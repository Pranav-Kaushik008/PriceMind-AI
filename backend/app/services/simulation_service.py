"""
backend/app/services/simulation_service.py
------------------------------------------
Service layer for What-If price simulations and Pricing Curves (Module 6).
"""

from typing import List, Optional
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.services.product_service import get_product_by_id_or_sku
from app.services.prediction_service import get_model, get_feature_context
from app.services.elasticity_service import get_product_elasticity
from app.schemas.optimization import (
    SingleSimulationRequest,
    SingleSimulationResponse,
    RangeSimulationRequest,
    RangeSimulationResponse,
    SimulationPoint,
    PricingCurveResponse,
)


def simulate_single_price(
    db: Session,
    request: SingleSimulationRequest,
) -> SingleSimulationResponse:
    """Simulate the financial and demand impact of a candidate price point."""
    product = get_product_by_id_or_sku(db, request.product_id)
    if not product:
        raise ValueError(f"Product not found: {request.product_id}")

    current_price = product.current_price or 100.0
    cost_price = product.cost_price
    candidate_price = request.candidate_price

    model, feature_names = get_model()
    features_df = get_feature_context()

    # Build feature row
    sku_id = product.external_product_id
    base_row = None
    if features_df is not None and "sku_id" in features_df.columns:
        sku_feats = features_df[features_df["sku_id"] == sku_id]
        if not sku_feats.empty:
            base_row = sku_feats.tail(1).copy()

    if base_row is None:
        base_row = pd.DataFrame([{f: 0.0 for f in feature_names}])

    for col in feature_names:
        if col not in base_row.columns:
            base_row[col] = 0.0

    # Current baseline
    row_curr = base_row.copy()
    row_curr["price"] = current_price
    base_demand = max(0.1, float(model.predict(row_curr[feature_names])[0]))
    base_revenue = current_price * base_demand
    base_profit = (current_price - cost_price) * base_demand if cost_price is not None else None

    # Candidate evaluation
    row_cand = base_row.copy()
    row_cand["price"] = candidate_price
    cand_demand = max(0.0, float(model.predict(row_cand[feature_names])[0]))
    cand_revenue = candidate_price * cand_demand
    cand_profit = (candidate_price - cost_price) * cand_demand if cost_price is not None else None
    cand_margin = ((candidate_price - cost_price) / candidate_price) * 100.0 if cost_price is not None and candidate_price > 0 else None

    # Deltas
    price_change_pct = round(((candidate_price - current_price) / current_price) * 100.0, 2)
    demand_change_pct = round(((cand_demand - base_demand) / base_demand) * 100.0, 2)
    rev_change_pct = round(((cand_revenue - base_revenue) / base_revenue) * 100.0, 2) if base_revenue > 0 else 0.0
    profit_change_pct = None
    if base_profit is not None and cand_profit is not None and base_profit != 0:
        profit_change_pct = round(((cand_profit - base_profit) / abs(base_profit)) * 100.0, 2)

    # Constraints verification
    violations = []
    if cost_price and candidate_price < cost_price:
        violations.append(f"Price (${candidate_price:.2f}) below unit cost (${cost_price:.2f})")
    if abs(price_change_pct) > 30.0:
        violations.append(f"Price change magnitude ({price_change_pct:+.1f}%) exceeds safety guardrail (±30%)")

    return SingleSimulationResponse(
        product_id=product.id,
        external_product_id=product.external_product_id,
        current_price=round(current_price, 2),
        candidate_price=round(candidate_price, 2),
        price_change_pct=price_change_pct,
        predicted_demand=round(cand_demand, 2),
        predicted_revenue=round(cand_revenue, 2),
        predicted_profit=round(cand_profit, 2) if cand_profit is not None else None,
        margin_pct=round(cand_margin, 2) if cand_margin is not None else None,
        demand_change_pct=demand_change_pct,
        revenue_change_pct=rev_change_pct,
        profit_change_pct=profit_change_pct,
        constraints_satisfied=len(violations) == 0,
        violations=violations,
    )


def simulate_price_range(
    db: Session,
    request: RangeSimulationRequest,
) -> RangeSimulationResponse:
    """Evaluate a grid of candidate prices across [min_price, max_price]."""
    product = get_product_by_id_or_sku(db, request.product_id)
    if not product:
        raise ValueError(f"Product not found: {request.product_id}")

    current_price = product.current_price or 100.0
    cost_price = product.cost_price

    if request.min_price >= request.max_price:
        raise ValueError("min_price must be strictly less than max_price")
    if request.step <= 0:
        raise ValueError("step must be positive")

    prices = np.arange(request.min_price, request.max_price + (request.step / 2.0), request.step).tolist()
    # Cap to max 100 points
    if len(prices) > 100:
        prices = np.linspace(request.min_price, request.max_price, 100).tolist()

    model, feature_names = get_model()
    features_df = get_feature_context()

    sku_id = product.external_product_id
    base_row = None
    if features_df is not None and "sku_id" in features_df.columns:
        sku_feats = features_df[features_df["sku_id"] == sku_id]
        if not sku_feats.empty:
            base_row = sku_feats.tail(1).copy()

    if base_row is None:
        base_row = pd.DataFrame([{f: 0.0 for f in feature_names}])

    for col in feature_names:
        if col not in base_row.columns:
            base_row[col] = 0.0

    points: List[SimulationPoint] = []
    max_rev = -float("inf")
    max_rev_price = None
    max_profit = -float("inf")
    max_profit_price = None

    for price in prices:
        row = base_row.copy()
        row["price"] = price
        demand = max(0.0, float(model.predict(row[feature_names])[0]))
        revenue = price * demand
        profit = (price - cost_price) * demand if cost_price is not None else None
        margin = ((price - cost_price) / price) * 100.0 if cost_price is not None and price > 0 else None

        if revenue > max_rev:
            max_rev = revenue
            max_rev_price = price
        if profit is not None and profit > max_profit:
            max_profit = profit
            max_profit_price = price

        is_curr = abs(price - current_price) < (request.step / 2.0)

        points.append(
            SimulationPoint(
                price=round(price, 2),
                demand=round(demand, 2),
                revenue=round(revenue, 2),
                profit=round(profit, 2) if profit is not None else None,
                margin_pct=round(margin, 2) if margin is not None else None,
                is_current=is_curr,
                is_optimal_revenue=False,
                is_optimal_profit=False,
                constraints_satisfied=not (cost_price and price < cost_price),
            )
        )

    # Flag optimal points
    for pt in points:
        if max_rev_price and abs(pt.price - max_rev_price) < 0.01:
            pt.is_optimal_revenue = True
        if max_profit_price and abs(pt.price - max_profit_price) < 0.01:
            pt.is_optimal_profit = True

    return RangeSimulationResponse(
        product_id=product.id,
        external_product_id=product.external_product_id,
        current_price=round(current_price, 2),
        points=points,
        total_evaluated=len(points),
        optimal_profit_price=round(max_profit_price, 2) if max_profit_price else None,
        optimal_revenue_price=round(max_rev_price, 2) if max_rev_price else None,
    )


def get_pricing_curve(
    db: Session,
    product_identifier: str,
) -> PricingCurveResponse:
    """Generate pricing curve data for Price vs Demand, Revenue, and Profit."""
    product = get_product_by_id_or_sku(db, product_identifier)
    if not product:
        raise ValueError(f"Product not found: {product_identifier}")

    current_price = product.current_price or 100.0
    min_p = round(current_price * 0.70, 2)
    max_p = round(current_price * 1.30, 2)
    step = round((max_p - min_p) / 24.0, 2)

    req = RangeSimulationRequest(
        product_id=product.id,
        min_price=min_p,
        max_price=max_p,
        step=max(0.50, step),
    )
    sim_res = simulate_price_range(db, req)

    try:
        ed_obj = get_product_elasticity(db, product.id)
        ed_val = ed_obj.elasticity
    except Exception:
        ed_val = -1.0

    return PricingCurveResponse(
        product_id=product.id,
        external_product_id=product.external_product_id,
        product_name=product.name,
        category=product.category.name if product.category else "General",
        current_price=round(current_price, 2),
        elasticity=round(ed_val, 4),
        curve_points=sim_res.points,
    )
