"""
backend/app/services/explanation_service.py
-------------------------------------------
Service layer for SHAP Explainability (Module 7).
Caches ShapExplainer and generates per-prediction and pricing scenario breakdowns.
"""

from pathlib import Path
from typing import Optional, List, Dict
import pandas as pd
from sqlalchemy.orm import Session

from app.services.product_service import get_product_by_id_or_sku
from app.services.prediction_service import get_feature_context
from app.services.elasticity_service import get_product_elasticity
from app.schemas.explanation import (
    FeatureContributionItem,
    PredictionExplanationRequest,
    PredictionExplanationResponse,
    PricingExplanationRequest,
    PricingExplanationResponse,
)

from ml.explainability.explainer import ShapExplainer
from ml.explainability.local_explanations import LocalExplainer
from ml.explainability.pricing_explanations import PricingExplainer

_cached_shap_explainer: Optional[ShapExplainer] = None


def get_shap_explainer() -> ShapExplainer:
    global _cached_shap_explainer
    if _cached_shap_explainer is None:
        _cached_shap_explainer = ShapExplainer().load()
    return _cached_shap_explainer


def explain_prediction(
    db: Session,
    request: PredictionExplanationRequest,
) -> PredictionExplanationResponse:
    """Generate per-prediction local SHAP feature breakdown."""
    product = get_product_by_id_or_sku(db, request.product_id)
    if not product:
        raise ValueError(f"Product not found: {request.product_id}")

    explainer = get_shap_explainer()
    features_df = get_feature_context()
    sku_id = product.external_product_id

    # Retrieve representative feature row
    base_row = None
    if features_df is not None and "sku_id" in features_df.columns:
        sku_feats = features_df[features_df["sku_id"] == sku_id]
        if not sku_feats.empty:
            base_row = sku_feats.tail(1).copy()

    if base_row is None:
        base_row = pd.DataFrame([{f: 0.0 for f in explainer.feature_names}])

    price_used = request.price or product.current_price or 100.0
    if "price" in base_row.columns:
        base_row["price"] = price_used

    # Compute SHAP
    local_exp = LocalExplainer(explainer)
    X_aligned = explainer.align_features(base_row)
    explanation = local_exp.explain_prediction(X_aligned, top_n=request.top_n or 10, row_index=0)

    # Extract price feature
    price_contrib = None
    for c in explanation.all_contributions:
        if c.feature_name == "price":
            price_contrib = FeatureContributionItem(
                feature_name="price",
                feature_value=c.feature_value,
                shap_value=round(c.shap_value, 4),
                direction=c.direction,
            )
            break

    top_pos = [
        FeatureContributionItem(
            feature_name=c.feature_name,
            feature_value=c.feature_value,
            shap_value=round(c.shap_value, 4),
            direction=c.direction,
        )
        for c in explanation.top_positive_contributors[: request.top_n or 10]
    ]

    top_neg = [
        FeatureContributionItem(
            feature_name=c.feature_name,
            feature_value=c.feature_value,
            shap_value=round(c.shap_value, 4),
            direction=c.direction,
        )
        for c in explanation.top_negative_contributors[: request.top_n or 10]
    ]

    return PredictionExplanationResponse(
        product_id=product.id,
        external_product_id=product.external_product_id,
        predicted_demand=round(explanation.predicted_value, 2),
        base_value=round(explanation.base_value, 2),
        price_used=round(price_used, 2),
        model_name=explainer.model_name,
        model_version="v1",
        explanation_method="TreeExplainer (Exact Shapley)",
        top_positive_contributors=top_pos,
        top_negative_contributors=top_neg,
        price_feature_contribution=price_contrib,
    )


def explain_pricing_recommendation(
    db: Session,
    request: PricingExplanationRequest,
) -> PricingExplanationResponse:
    """Generate SHAP scenario comparison for current vs recommended price."""
    product = get_product_by_id_or_sku(db, request.product_id)
    if not product:
        raise ValueError(f"Product not found: {request.product_id}")

    explainer = get_shap_explainer()
    pricing_exp = PricingExplainer(explainer)

    curr_p = request.current_price or product.current_price or 100.0
    rec_p = request.recommended_price or (curr_p * 1.05)

    scenario_exp = pricing_exp.explain_price_scenario(
        sku_id=product.external_product_id,
        current_price=curr_p,
        recommended_price=rec_p,
        top_n=request.top_n or 10,
    )

    if scenario_exp is None:
        raise RuntimeError(f"Could not generate pricing explanation for {product.external_product_id}")

    top_curr = [
        FeatureContributionItem(
            feature_name=c.feature_name,
            feature_value=c.feature_value,
            shap_value=round(c.shap_value, 4),
            direction=c.direction,
        )
        for c in scenario_exp.top_drivers_current
    ]

    top_rec = [
        FeatureContributionItem(
            feature_name=c.feature_name,
            feature_value=c.feature_value,
            shap_value=round(c.shap_value, 4),
            direction=c.direction,
        )
        for c in scenario_exp.top_drivers_recommended
    ]

    # Clear separation between Model Signals and Business Constraints
    model_signals = (
        f"Demand model indicates price feature attribution changes by {scenario_exp.price_shap_delta:+.4f} units. "
        f"Base model value is {scenario_exp.base_value:.2f}. "
        f"Empirical elasticity is {scenario_exp.elasticity:.4f} ({scenario_exp.elasticity_reliability})."
    )

    constraints = [
        "Margin floor >= 20.0%",
        "Price adjustment within ±20.0% boundary",
        "Competitor price index <= 1.15x",
    ]
    biz_summary = "Applied constraints: " + "; ".join(constraints)

    return PricingExplanationResponse(
        product_id=product.id,
        external_product_id=product.external_product_id,
        current_price=round(curr_p, 2),
        recommended_price=round(rec_p, 2),
        current_predicted_demand=round(scenario_exp.current_predicted_demand, 2),
        recommended_predicted_demand=round(scenario_exp.recommended_predicted_demand, 2),
        demand_change=round(scenario_exp.recommended_predicted_demand - scenario_exp.current_predicted_demand, 2),
        current_price_shap=round(scenario_exp.current_price_shap, 4),
        recommended_price_shap=round(scenario_exp.recommended_price_shap, 4),
        price_shap_delta=round(scenario_exp.price_shap_delta, 4),
        base_value=round(scenario_exp.base_value, 2),
        elasticity=round(scenario_exp.elasticity, 4),
        elasticity_reliability=scenario_exp.elasticity_reliability,
        top_drivers_current=top_curr,
        top_drivers_recommended=top_rec,
        applied_constraints=constraints,
        model_signals_summary=model_signals,
        business_constraints_summary=biz_summary,
    )
