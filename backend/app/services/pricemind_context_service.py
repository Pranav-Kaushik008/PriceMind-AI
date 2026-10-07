"""
backend/app/services/pricemind_context_service.py
-------------------------------------------------
Phase 2.3: Connect Visual Intelligence to PriceMind Data & Analytics Engine.
Builds a unified analysis result combining:
1. Image-derived Computer Vision & Competitor Intelligence
2. Database-derived Product, SKU, Inventory & Historical Sales data
3. Model-derived Price Elasticity and Demand Forecasts

Strictly preserves data provenance across image, database, and model sources.
Does not fabricate unavailable data or generate pricing recommendations yet.
"""

from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.models.product import Product
from app.models.sales_record import SalesRecord
from app.models.elasticity import ElasticityResult
from app.models.prediction import DemandPrediction
from app.models.forecast import Forecast

from app.schemas.vision import (
    DetectedObject,
    DetectedTextLabel,
    ProductMatchResult,
    CompetitorComparisonResult,
    HistoricalDemandContext,
    InventoryContext,
    ElasticityContext,
    DemandForecastContext,
    PricingContext,
    VisualAnalysisData,
    UnifiedPriceMindContext,
)
from app.repositories.analytics_repo import get_elasticity
from app.services.product_matching_service import infer_brand, boxes_overlap


def build_historical_demand_context(db: Session, product_id: str) -> Optional[HistoricalDemandContext]:
    """
    Queries historical sales transactions from the PriceMind database (SalesRecord table)
    and computes factual demand metrics.
    """
    sales = list(
        db.scalars(
            select(SalesRecord)
            .where(SalesRecord.product_id == product_id)
            .order_by(SalesRecord.record_date.desc())
        )
    )

    if not sales:
        return None

    total_units = sum(s.units_sold for s in sales if s.units_sold is not None)
    total_revenue = sum(
        s.revenue if s.revenue is not None else ((s.price or 0.0) * (s.units_sold or 0))
        for s in sales
    )
    rec_count = len(sales)
    avg_daily = round(total_units / float(rec_count), 2) if rec_count > 0 else None

    # Recent 30-day units sold
    latest_date = sales[0].record_date
    cutoff_date = latest_date - timedelta(days=30)
    recent_30d = [s for s in sales if s.record_date >= cutoff_date]
    recent_30d_units = sum(s.units_sold for s in recent_30d if s.units_sold is not None) if recent_30d else None

    # Trend calculation (comparing second half of records vs first half)
    trend = None
    if rec_count >= 10:
        half = rec_count // 2
        recent_half = sum(s.units_sold for s in sales[:half] if s.units_sold is not None)
        older_half = sum(s.units_sold for s in sales[half:] if s.units_sold is not None)
        if older_half > 0:
            change_ratio = (recent_half - older_half) / float(older_half)
            if change_ratio > 0.08:
                trend = "Growing"
            elif change_ratio < -0.08:
                trend = "Declining"
            else:
                trend = "Stable"

    return HistoricalDemandContext(
        total_units_sold=total_units,
        avg_daily_demand=avg_daily,
        recent_30d_units=recent_30d_units,
        sales_records_count=rec_count,
        historical_revenue=round(total_revenue, 2),
        demand_trend=trend,
        data_source="Retrieved from PriceMind database (SalesRecord table)",
    )


def build_inventory_context(product: Product) -> InventoryContext:
    """
    Extracts live inventory levels and computes stock health and margin from the Product database record.
    """
    inv_level = product.inventory_level
    curr_price = product.current_price
    cost_price = product.cost_price

    margin_pct = None
    if curr_price and cost_price and curr_price > 0:
        margin_pct = round(((curr_price - cost_price) / curr_price) * 100.0, 2)

    if inv_level is None:
        stock_status = "Not available"
    elif inv_level == 0:
        stock_status = "Out of Stock"
    elif inv_level <= 20:
        stock_status = "Low Stock"
    else:
        stock_status = "In Stock"

    return InventoryContext(
        inventory_level=inv_level,
        stock_status=stock_status,
        cost_price=cost_price,
        margin_percent=margin_pct,
        data_source="Retrieved from PriceMind database (Product record)",
    )


def build_elasticity_context(db: Session, product: Product) -> Optional[ElasticityContext]:
    """
    Retrieves statistical price elasticity estimates from Module 3 (ElasticityResult database table
    or reports summary fallback).
    """
    # 1. Check database record
    db_result = get_elasticity(db, product.id)
    if db_result:
        ed = db_result.elasticity
        if abs(ed) > 1.05:
            cat = "elastic"
            interp = f"Price Elastic (|E| = {abs(ed):.2f} > 1): Demand is sensitive to price changes. Lowering price tends to expand revenue."
        elif abs(ed) < 0.95:
            cat = "inelastic"
            interp = f"Price Inelastic (|E| = {abs(ed):.2f} < 1): Demand is relatively rigid. Increasing price typically preserves volume."
        else:
            cat = "unit_elastic"
            interp = f"Unitary Elastic (|E| ~ 1.0): Percentage change in demand matches percentage change in price."

        return ElasticityContext(
            elasticity=round(db_result.elasticity, 4),
            elasticity_category=cat,
            robust_elasticity=round(db_result.robust_elasticity, 4) if db_result.robust_elasticity is not None else None,
            p_value=round(db_result.p_value, 4) if db_result.p_value is not None else None,
            r_squared=round(db_result.r_squared, 4) if db_result.r_squared is not None else None,
            reliability=db_result.reliability or "Normal",
            interpretation=interp,
            data_source="Model-derived (Module 3 Log-Log OLS Regression)",
        )

    # 2. Check cached summary file fallback
    try:
        from app.services.elasticity_service import _load_elasticity_report
        df = _load_elasticity_report()
        if df is not None and not df.empty:
            match = df[df["sku_id"] == product.external_product_id]
            if not match.empty:
                row = match.iloc[0]
                ed = float(row["elasticity"])
                cat = "elastic" if abs(ed) > 1.05 else ("inelastic" if abs(ed) < 0.95 else "unit_elastic")
                return ElasticityContext(
                    elasticity=round(ed, 4),
                    elasticity_category=cat,
                    robust_elasticity=float(row["robust_elasticity"]) if "robust_elasticity" in row and pd.notna(row["robust_elasticity"]) else None,
                    p_value=float(row["p_value"]) if "p_value" in row and pd.notna(row["p_value"]) else None,
                    r_squared=float(row["r_squared"]) if "r_squared" in row and pd.notna(row["r_squared"]) else None,
                    reliability=str(row.get("reliability", "Normal")),
                    interpretation=f"Price {cat.capitalize()}: |E| = {abs(ed):.2f}",
                    data_source="Model-derived (reports/elasticity_summary.csv)",
                )
    except Exception:
        pass

    return None


def build_demand_forecast_context(db: Session, product_id: str) -> Optional[DemandForecastContext]:
    """
    Retrieves latest demand predictions / forecasts from Module 4 models or database tables.
    """
    pred = db.scalar(
        select(DemandPrediction)
        .where(DemandPrediction.product_id == product_id)
        .order_by(DemandPrediction.prediction_date.desc())
        .limit(1)
    )

    if pred and pred.predicted_demand is not None:
        return DemandForecastContext(
            predicted_daily_demand=round(float(pred.predicted_demand), 2),
            forecast_confidence=round(float(pred.confidence_score), 4) if pred.confidence_score is not None else None,
            forecast_horizon_days=7,
            data_source=f"Model-derived ({pred.model_version or 'Module 4 LightGBM'})",
        )

    # Check Forecast table
    fc = db.scalar(
        select(Forecast)
        .where(Forecast.product_id == product_id)
        .order_by(Forecast.forecast_date.desc())
        .limit(1)
    )
    if fc and fc.predicted_units is not None:
        return DemandForecastContext(
            predicted_daily_demand=round(float(fc.predicted_units), 2),
            forecast_confidence=None,
            forecast_horizon_days=7,
            data_source=f"Model-derived ({fc.model_type or 'Forecast Engine'})",
        )

    return None


def extract_unified_pricemind_contexts(
    db: Optional[Session],
    detected_objects: List[DetectedObject],
    detected_texts: List[DetectedTextLabel],
    matched_products: List[ProductMatchResult],
    competitor_insights: List[CompetitorComparisonResult],
) -> List[UnifiedPriceMindContext]:
    """
    Unified Pipeline Orchestrator for Phase 2.3:
    Combines:
    - Computer Vision & OCR telemetry (Image-derived)
    - Competitor Retail Information (Image-derived)
    - Live Product Catalog, Pricing & Inventory (Database-derived)
    - Historical Sales Transactions (Database-derived)
    - Price Elasticity & Demand Forecasts (Model-derived)

    Preserves strict separation of data sources.
    """
    unified_contexts: List[UnifiedPriceMindContext] = []

    # Map competitor insights by index/id or sku
    comp_map: Dict[str, CompetitorComparisonResult] = {}
    for c in competitor_insights:
        if c.sku:
            comp_map[c.sku] = c
        elif c.detected_label:
            comp_map[c.detected_label] = c

    # Case 1: Products matched against catalog
    for idx, match in enumerate(matched_products):
        matched_info = match.matched_product
        obj_id = match.detected_object_id

        # Find associated competitor insight
        comp_result = None
        if matched_info and matched_info.sku in comp_map:
            comp_result = comp_map[matched_info.sku]
        elif match.detected_label in comp_map:
            comp_result = comp_map[match.detected_label]
        elif idx < len(competitor_insights):
            comp_result = competitor_insights[idx]

        # Extract local OCR text snippets
        ocr_snippets = []
        associated_obj = next((o for o in detected_objects if o.id == obj_id), None)
        if associated_obj:
            for t in detected_texts:
                if t.raw_text and boxes_overlap(associated_obj.box, t.box, padding=12.0):
                    ocr_snippets.append(t.raw_text)
        if not ocr_snippets:
            ocr_snippets = [t.raw_text for t in detected_texts[:4] if t.raw_text]

        # Build Visual Analysis payload (Image-derived)
        visual_data = VisualAnalysisData(
            detected_object_id=obj_id,
            detected_label=match.detected_label,
            match_confidence=match.match_confidence,
            match_status=match.match_status,
            ocr_snippets=ocr_snippets,
            data_source="Detected from image",
        )

        # Database & Model Data
        prod_obj = None
        product_dict = None
        hist_demand = None
        inv_context = None
        elast_context = None
        fc_context = None
        curr_price = None
        cost_price = None

        if db is not None and matched_info is not None:
            # Query the actual Product model
            prod_obj = db.scalar(select(Product).where(Product.id == matched_info.product_id))
            if prod_obj:
                curr_price = prod_obj.current_price
                cost_price = prod_obj.cost_price
                product_dict = {
                    "product_id": str(prod_obj.id),
                    "sku": prod_obj.external_product_id,
                    "name": prod_obj.name,
                    "category": prod_obj.category.name if prod_obj.category else "General",
                    "brand": infer_brand(prod_obj.name),
                    "store_channel": prod_obj.store_channel,
                    "current_price": prod_obj.current_price,
                    "cost_price": prod_obj.cost_price,
                    "inventory_level": prod_obj.inventory_level,
                    "is_active": prod_obj.is_active,
                    "data_source": "Retrieved from PriceMind database (products table)",
                }

                # Historical sales data
                hist_demand = build_historical_demand_context(db, prod_obj.id)

                # Inventory data
                inv_context = build_inventory_context(prod_obj)

                # Price elasticity
                elast_context = build_elasticity_context(db, prod_obj)

                # Demand forecast
                fc_context = build_demand_forecast_context(db, prod_obj.id)

        # Assemble Pricing Context block
        pricing_ctx = PricingContext(
            current_price=curr_price,
            cost_price=cost_price,
            historical_demand=hist_demand,
            inventory=inv_context,
            elasticity=elast_context,
            demand_forecast=fc_context,
        )

        unified_contexts.append(
            UnifiedPriceMindContext(
                id=f"ctx_{idx+1:02d}",
                product_id=matched_info.product_id if matched_info else None,
                sku=matched_info.sku if matched_info else None,
                product_name=matched_info.name if matched_info else match.detected_label,
                category=matched_info.category if matched_info else None,
                brand=matched_info.brand if matched_info else None,
                product=product_dict,
                visual_analysis=visual_data,
                competitor_analysis=comp_result or (
                    competitor_insights[0] if competitor_insights else CompetitorComparisonResult(
                        id="comp_fallback",
                        product_name=match.detected_label,
                        detected_label=match.detected_label,
                        competitor_info=None,
                    )
                ),
                pricing_context=pricing_ctx,
            )
        )

    return unified_contexts
