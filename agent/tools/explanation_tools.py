"""
agent/tools/explanation_tools.py
---------------------------------
LangChain tools wrapping explanation_service (Module 7 — SHAP).
Tools: explain_prediction, explain_pricing_recommendation
"""

from __future__ import annotations

import json
from typing import Optional

from langchain_core.tools import tool

from app.db.session import SessionLocal
from app.services.explanation_service import explain_prediction, explain_pricing_recommendation
from app.schemas.explanation import PredictionExplanationRequest, PricingExplanationRequest


@tool
def explain_prediction_tool(product_id: str, price: Optional[float] = None) -> str:
    """
    Generate a SHAP (TreeExplainer) local feature attribution breakdown for the
    demand prediction of a product at a given price point.

    Args:
        product_id: Product UUID or external SKU ID (e.g. 'SKU-8921-PRO').
        price: Price point to evaluate (defaults to current product price).

    Returns: JSON with predicted_demand, base_value, price_feature_contribution,
    top_positive_contributors, top_negative_contributors, and model metadata.

    Use this when the user asks "why is demand predicted at X?", "which features
    drive demand?", or "explain the model prediction".
    """
    db = SessionLocal()
    try:
        req = PredictionExplanationRequest(
            product_id=product_id,
            price=price,
            top_n=10,
        )
        result = explain_prediction(db, req)

        def _contrib(c):
            return {
                "feature_name": c.feature_name,
                "feature_value": c.feature_value,
                "shap_value": c.shap_value,
                "direction": c.direction,
            }

        return json.dumps({
            "product_id": result.product_id,
            "external_product_id": result.external_product_id,
            "predicted_demand": result.predicted_demand,
            "base_value": result.base_value,
            "price_used": result.price_used,
            "model_name": result.model_name,
            "explanation_method": result.explanation_method,
            "price_feature_contribution": _contrib(result.price_feature_contribution) if result.price_feature_contribution else None,
            "top_positive_contributors": [_contrib(c) for c in result.top_positive_contributors],
            "top_negative_contributors": [_contrib(c) for c in result.top_negative_contributors],
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()


@tool
def explain_pricing_recommendation_tool(
    product_id: str,
    current_price: Optional[float] = None,
    recommended_price: Optional[float] = None,
) -> str:
    """
    Generate a SHAP scenario comparison explaining WHY a pricing recommendation
    was made — contrasting current price vs recommended price feature attributions.

    Args:
        product_id: Product UUID or external SKU ID.
        current_price: Current price (optional — defaults to product's price).
        recommended_price: Recommended price to explain (optional — defaults to +5%).

    Returns: JSON with current vs recommended demand predictions, price SHAP delta,
    top feature drivers for each scenario, elasticity, and applied constraints summary.

    Use this when the user asks "why was this price recommended?", "explain the
    +7.7% increase", or "what does SHAP say about this recommendation".
    """
    db = SessionLocal()
    try:
        req = PricingExplanationRequest(
            product_id=product_id,
            current_price=current_price,
            recommended_price=recommended_price,
            top_n=10,
        )
        result = explain_pricing_recommendation(db, req)

        def _contrib(c):
            return {
                "feature_name": c.feature_name,
                "feature_value": c.feature_value,
                "shap_value": c.shap_value,
                "direction": c.direction,
            }

        return json.dumps({
            "product_id": result.product_id,
            "external_product_id": result.external_product_id,
            "current_price": result.current_price,
            "recommended_price": result.recommended_price,
            "current_predicted_demand": result.current_predicted_demand,
            "recommended_predicted_demand": result.recommended_predicted_demand,
            "demand_change": result.demand_change,
            "current_price_shap": result.current_price_shap,
            "recommended_price_shap": result.recommended_price_shap,
            "price_shap_delta": result.price_shap_delta,
            "base_value": result.base_value,
            "elasticity": result.elasticity,
            "elasticity_reliability": result.elasticity_reliability,
            "top_drivers_current": [_contrib(c) for c in result.top_drivers_current],
            "top_drivers_recommended": [_contrib(c) for c in result.top_drivers_recommended],
            "applied_constraints": result.applied_constraints,
            "model_signals_summary": result.model_signals_summary,
            "business_constraints_summary": result.business_constraints_summary,
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()
