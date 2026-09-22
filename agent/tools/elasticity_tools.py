"""
agent/tools/elasticity_tools.py
--------------------------------
LangChain tool wrapping elasticity_service (Module 3).
Tool: get_price_elasticity
"""

from __future__ import annotations

import json

from langchain_core.tools import tool

from app.db.session import SessionLocal
from app.services.elasticity_service import get_product_elasticity


@tool
def get_price_elasticity_tool(product_id: str) -> str:
    """
    Retrieve the price elasticity of demand for a product.

    Args:
        product_id: Product UUID or external SKU ID (e.g. 'SKU-8921-PRO').

    Returns: JSON with elasticity coefficient, elasticity_category ('elastic' or
    'inelastic'), confidence interval, R-squared, reliability rating, and methodology.

    Elasticity < -1  → elastic   (demand sensitive to price, risky to raise)
    -1 < elasticity < 0 → inelastic (pricing power, can raise price safely)

    Use this before any pricing recommendation to understand demand sensitivity.
    """
    db = SessionLocal()
    try:
        result = get_product_elasticity(db, product_id)
        return json.dumps({
            "product_id": result.product_id,
            "external_product_id": result.external_product_id,
            "sku_name": result.sku_name,
            "category": result.category,
            "elasticity": result.elasticity,
            "robust_elasticity": result.robust_elasticity,
            "elasticity_category": result.elasticity_category,
            "std_error": result.std_error,
            "t_statistic": result.t_statistic,
            "p_value": result.p_value,
            "ci_lower": result.ci_lower,
            "ci_upper": result.ci_upper,
            "r_squared": result.r_squared,
            "n_observations": result.n_observations,
            "reliability": result.reliability,
            "methodology": result.methodology,
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()
