"""
agent/tools/product_tools.py
-----------------------------
LangChain tools wrapping product_service (Module 1 / Module 9).
Tools: get_product, search_products
"""

from __future__ import annotations

import json
from typing import Optional

from langchain_core.tools import tool

from app.db.session import SessionLocal
from app.services.product_service import get_product_by_id_or_sku, list_products


@tool
def get_product_tool(product_id: str) -> str:
    """
    Retrieve detailed information about a single product by its UUID or external
    SKU ID (e.g. 'SKU-8921-PRO').

    Returns: JSON with id, external_product_id, name, category, current_price,
    cost_price, margin_percent, inventory_level, competitor_price, is_active.

    Use this first whenever the user mentions a specific product or SKU.
    """
    db = SessionLocal()
    try:
        product = get_product_by_id_or_sku(db, product_id)
        if product is None:
            return json.dumps({"error": f"Product not found: {product_id}"})

        cost = product.cost_price
        curr = product.current_price or 0.0
        margin = None
        if cost and curr > 0:
            margin = round(((curr - cost) / curr) * 100.0, 2)

        return json.dumps({
            "id": product.id,
            "external_product_id": product.external_product_id,
            "name": product.name,
            "category": product.category.name if product.category else None,
            "store_channel": product.store_channel,
            "current_price": curr,
            "cost_price": cost,
            "margin_percent": margin,
            "inventory_level": product.inventory_level,
            "competitor_price": product.competitor_price,
            "is_active": product.is_active,
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()


@tool
def search_products_tool(
    query: str = "",
    category: str = "",
    limit: int = 5,
) -> str:
    """
    Search or list products by name, SKU keyword, and/or category.

    Args:
        query: Free-text search string (product name or SKU fragment).
        category: Optional category name filter (e.g. 'Electronics', 'Industrial').
        limit: Maximum number of results (default 5, max 20).

    Returns: JSON array of matching products with id, external_product_id, name,
    category, current_price, margin_percent.

    Use this when the user asks about "all products", "top SKUs in a category",
    or searches by keyword rather than a specific ID.
    """
    db = SessionLocal()
    try:
        limit = max(1, min(limit, 20))
        cat_filter = category.strip() if category else None
        search_text = query.strip() if query else None

        result = list_products(
            db,
            category=cat_filter,
            active_only=True,
            search=search_text,
            page=1,
            page_size=limit,
        )

        items = [
            {
                "id": p.id,
                "external_product_id": p.external_product_id,
                "name": p.name,
                "category": p.category_name,
                "current_price": p.current_price,
                "cost_price": p.cost_price,
                "margin_percent": p.margin_percent,
                "inventory_level": p.inventory_level,
            }
            for p in result.items
        ]
        return json.dumps({"total": result.total, "items": items})
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()
