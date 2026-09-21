"""
backend/app/services/optimization_service.py
--------------------------------------------
Service layer for pricing optimization (Module 6).
Integrates with Module 6 optimizer, candidate price generation, and constraint validation.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.product import Product
from app.models.pricing import PricingRecommendation
from app.services.product_service import get_product_by_id_or_sku
from app.services.prediction_service import get_model, get_feature_context
from app.services.elasticity_service import get_product_elasticity
from app.repositories.analytics_repo import save_recommendation, list_recommendations
from app.schemas.optimization import OptimizePriceRequest, PricingRecommendationResponse

ROOT_DIR = Path(__file__).resolve().parents[3]
RECOMMENDATIONS_CSV = ROOT_DIR / "reports" / "pricing_recommendations.csv"


def optimize_product_price(
    db: Session,
    request: OptimizePriceRequest,
) -> PricingRecommendationResponse:
    """
    Run pricing optimization for a product under given objective and constraints.
    Persists recommendation in database.
    """
    product = get_product_by_id_or_sku(db, request.product_id)
    if not product:
        raise ValueError(f"Product not found: {request.product_id}")

    current_price = product.current_price or 100.0
    cost_price = product.cost_price

    # Generate candidate prices: ±20% around current price
    min_p = request.min_price or (current_price * 0.80)
    max_p = request.max_price or (current_price * 1.20)
    step = request.price_step or max(0.50, round((max_p - min_p) / 20.0, 2))

    candidate_prices = np.arange(min_p, max_p + (step / 2.0), step).tolist()
    if not candidate_prices:
        candidate_prices = [current_price]

    model, feature_names = get_model()
    features_df = get_feature_context()

    # Base feature template
    sku_id = product.external_product_id
    base_row = None
    if features_df is not None and "sku_id" in features_df.columns:
        sku_feats = features_df[features_df["sku_id"] == sku_id]
        if not sku_feats.empty:
            base_row = sku_feats.tail(1).copy()

    if base_row is None:
        base_row = pd.DataFrame([{f: 0.0 for f in feature_names}])

    # Score all candidate prices
    best_price = current_price
    best_metric_val = -float("inf")
    best_demand = 0.0
    best_revenue = 0.0
    best_profit = None
    best_margin = None

    for price in candidate_prices:
        row = base_row.copy()
        for col in feature_names:
            if col not in row.columns:
                row[col] = 0.0
        row["price"] = price

        X_eval = row[feature_names]
        demand = max(0.0, float(model.predict(X_eval)[0]))
        revenue = price * demand
        profit = (price - cost_price) * demand if cost_price is not None else None
        margin = ((price - cost_price) / price) * 100.0 if cost_price is not None and price > 0 else None

        # Constraint check: min_margin_pct
        if request.min_margin_pct and margin is not None and margin < request.min_margin_pct:
            continue

        # Constraint check: competitor_max_ratio
        if request.competitor_max_ratio and product.competitor_price and product.competitor_price > 0:
            if (price / product.competitor_price) > request.competitor_max_ratio:
                continue

        # Objective evaluation
        obj = request.objective.upper()
        if obj == "REVENUE_MAX":
            metric = revenue
        elif obj == "PROFIT_MAX":
            metric = profit if profit is not None else revenue
        else:  # BALANCED
            metric = (profit if profit is not None else revenue) * 0.7 + revenue * 0.3

        if metric > best_metric_val:
            best_metric_val = metric
            best_price = price
            best_demand = demand
            best_revenue = revenue
            best_profit = profit
            best_margin = margin

    # Get elasticity
    try:
        elasticity_obj = get_product_elasticity(db, product.id)
        ed_val = elasticity_obj.elasticity
        ed_reliability = elasticity_obj.reliability
    except Exception:
        ed_val = -1.0
        ed_reliability = "Estimated"

    price_change_pct = round(((best_price - current_price) / current_price) * 100.0, 2)
    rationale = (
        f"Optimized for {request.objective}. Recommended ${best_price:.2f} ({price_change_pct:+.1f}%) "
        f"yielding estimated {best_demand:.1f} units demand, ${best_revenue:,.2f} revenue"
    )
    if best_profit is not None:
        rationale += f", and ${best_profit:,.2f} gross profit (margin {best_margin:.1f}%)."

    # Persist recommendation
    rec = save_recommendation(
        db,
        product_id=product.id,
        current_price=round(current_price, 2),
        recommended_price=round(best_price, 2),
        price_change_pct=price_change_pct,
        predicted_demand=round(best_demand, 2),
        predicted_revenue=round(best_revenue, 2),
        predicted_profit=round(best_profit, 2) if best_profit is not None else None,
        predicted_margin_pct=round(best_margin, 2) if best_margin is not None else None,
        elasticity=round(ed_val, 4),
        objective=request.objective,
        confidence=ed_reliability,
        status="pending",
        rationale=rationale,
    )
    db.commit()

    return PricingRecommendationResponse(
        id=rec.id,
        product_id=product.id,
        external_product_id=product.external_product_id,
        product_name=product.name,
        category=product.category.name if product.category else "General",
        current_price=round(current_price, 2),
        recommended_price=round(best_price, 2),
        price_change_pct=price_change_pct,
        predicted_demand=round(best_demand, 2),
        predicted_revenue=round(best_revenue, 2),
        predicted_profit=round(best_profit, 2) if best_profit is not None else None,
        predicted_margin_pct=round(best_margin, 2) if best_margin is not None else None,
        elasticity=round(ed_val, 4),
        confidence=ed_reliability,
        objective=request.objective,
        status="pending",
        rationale=rationale,
        created_at=rec.created_at.isoformat() if rec.created_at else None,
    )


def list_pricing_recommendations(
    db: Session,
    status: Optional[str] = None,
    product_identifier: Optional[str] = None,
) -> List[PricingRecommendationResponse]:
    """List all recommendations from DB or fallback reports."""
    q = select(PricingRecommendation).join(PricingRecommendation.product)
    if status and status.lower() != "all":
        q = q.where(PricingRecommendation.status == status.lower())
    if product_identifier:
        q = q.where(
            (Product.id == product_identifier)
            | (Product.external_product_id == product_identifier)
        )

    db_recs = list(db.scalars(q.order_by(PricingRecommendation.created_at.desc())))

    if db_recs:
        res = []
        for r in db_recs:
            res.append(
                PricingRecommendationResponse(
                    id=r.id,
                    product_id=r.product.id,
                    external_product_id=r.product.external_product_id,
                    product_name=r.product.name,
                    category=r.product.category.name if r.product.category else "General",
                    current_price=r.current_price,
                    recommended_price=r.recommended_price,
                    price_change_pct=r.price_change_pct or 0.0,
                    predicted_demand=r.predicted_demand,
                    predicted_revenue=r.predicted_revenue,
                    predicted_profit=r.predicted_profit,
                    predicted_margin_pct=r.predicted_margin_pct,
                    elasticity=r.elasticity,
                    confidence=r.confidence or "High Confidence",
                    objective=r.objective or "PROFIT_MAX",
                    status=r.status,
                    rationale=r.rationale,
                    applied_at=r.applied_at,
                    created_at=r.created_at.isoformat() if r.created_at else None,
                )
            )
        return res

    # Fallback to report CSV
    if RECOMMENDATIONS_CSV.exists():
        df = pd.read_csv(RECOMMENDATIONS_CSV)
        items = []
        for _, row in df.iterrows():
            sku = str(row.get("sku_id", ""))
            p = get_product_by_id_or_sku(db, sku)
            p_id = p.id if p else sku
            p_name = p.name if p else str(row.get("sku_name", sku))
            cat = p.category.name if p and p.category else str(row.get("category", "General"))
            c_price = float(row.get("current_price", 100.0))
            r_price = float(row.get("recommended_price", 105.0))
            items.append(
                PricingRecommendationResponse(
                    id=f"rec-{sku}",
                    product_id=p_id,
                    external_product_id=sku,
                    product_name=p_name,
                    category=cat,
                    current_price=c_price,
                    recommended_price=r_price,
                    price_change_pct=round(((r_price - c_price) / c_price) * 100.0, 2),
                    predicted_demand=float(row.get("predicted_demand", 0.0)),
                    predicted_revenue=float(row.get("predicted_revenue", 0.0)),
                    predicted_profit=float(row.get("predicted_profit", 0.0)) if "predicted_profit" in row else None,
                    predicted_margin_pct=float(row.get("margin_pct", 0.0)) if "margin_pct" in row else None,
                    elasticity=float(row.get("elasticity", -1.0)) if "elasticity" in row else None,
                    confidence=str(row.get("confidence", "High Confidence")),
                    objective=str(row.get("objective", "PROFIT_MAX")),
                    status="pending",
                    rationale=f"Model recommended ${r_price:.2f} based on elasticity and profit margin maximization.",
                )
            )
        return items

    return []
