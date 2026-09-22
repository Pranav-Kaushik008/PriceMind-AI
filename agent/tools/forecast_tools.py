"""
agent/tools/forecast_tools.py
------------------------------
LangChain tool wrapping forecast_service (Module 5).
Tool: get_demand_forecast
"""

from __future__ import annotations

import json

from langchain_core.tools import tool

from app.db.session import SessionLocal
from app.services.forecast_service import get_product_forecast
from agent.safety import validate_horizon


@tool
def get_demand_forecast_tool(product_id: str, horizon_days: int = 14) -> str:
    """
    Retrieve the demand forecast for a product over the next N days.

    Args:
        product_id: Product UUID or external SKU ID (e.g. 'SKU-8921-PRO').
        horizon_days: Number of forecast days (1–90). Default is 14.

    Returns: JSON with model name, horizon, and a list of forecast points each
    containing date, predicted_demand, lower_bound, upper_bound.

    Use this when the user asks about "demand next week", "sales forecast",
    "expected units", or similar forward-looking demand questions.
    """
    db = SessionLocal()
    try:
        validate_horizon(horizon_days)
        result = get_product_forecast(db, product_id, horizon_days=horizon_days)
        points = [
            {
                "date": p.date,
                "predicted_demand": p.predicted_demand,
                "lower_bound": p.lower_bound,
                "upper_bound": p.upper_bound,
            }
            for p in result.forecast_points
        ]
        return json.dumps({
            "product_id": result.product_id,
            "external_product_id": result.external_product_id,
            "model_name": result.model_name,
            "forecast_horizon_days": result.forecast_horizon_days,
            "generated_at": result.generated_at,
            "forecast_points": points,
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()
