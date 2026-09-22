"""
agent/tools/pricing_tools.py
-----------------------------
LangChain tools wrapping simulation_service and optimization_service (Module 6).
Tools: simulate_price, simulate_price_range, optimize_price
"""

from __future__ import annotations

import json
from typing import Optional

from langchain_core.tools import tool

from app.db.session import SessionLocal
from app.services.simulation_service import simulate_single_price, simulate_price_range
from app.services.optimization_service import optimize_product_price
from app.schemas.optimization import (
    SingleSimulationRequest,
    RangeSimulationRequest,
    OptimizePriceRequest,
)
from agent.safety import validate_price, validate_price_range, validate_objective, build_risk_summary


@tool
def simulate_price_tool(product_id: str, candidate_price: float) -> str:
    """
    Simulate the demand, revenue, and profit impact of a single candidate price
    for a product, compared to the current price.

    Args:
        product_id: Product UUID or external SKU ID (e.g. 'SKU-8921-PRO').
        candidate_price: The price point to evaluate (must be > 0).

    Returns: JSON with predicted_demand, predicted_revenue, predicted_profit,
    margin_pct, demand_change_pct, revenue_change_pct, profit_change_pct,
    constraints_satisfied, and any violations.

    Use this for "what if we price at $X" questions. Always run get_product first
    to confirm the current price before comparing.
    """
    db = SessionLocal()
    try:
        validate_price(candidate_price, "candidate_price")
        req = SingleSimulationRequest(product_id=product_id, candidate_price=candidate_price)
        result = simulate_single_price(db, req)
        risks = build_risk_summary(result.violations, result.current_price, result.candidate_price)
        return json.dumps({
            "product_id": result.product_id,
            "external_product_id": result.external_product_id,
            "current_price": result.current_price,
            "candidate_price": result.candidate_price,
            "price_change_pct": result.price_change_pct,
            "predicted_demand": result.predicted_demand,
            "predicted_revenue": result.predicted_revenue,
            "predicted_profit": result.predicted_profit,
            "margin_pct": result.margin_pct,
            "demand_change_pct": result.demand_change_pct,
            "revenue_change_pct": result.revenue_change_pct,
            "profit_change_pct": result.profit_change_pct,
            "constraints_satisfied": result.constraints_satisfied,
            "violations": result.violations,
            "risk_warnings": risks,
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()


@tool
def simulate_price_range_tool(
    product_id: str,
    min_price: float,
    max_price: float,
    step: float = 5.0,
) -> str:
    """
    Evaluate a grid of candidate prices across [min_price, max_price] at a given
    step increment, returning demand, revenue, and profit for each price point.
    Capped at 100 evaluated points.

    Args:
        product_id: Product UUID or external SKU ID.
        min_price: Start of the price range (> 0).
        max_price: End of the price range (> min_price).
        step: Price increment (default 5.0).

    Returns: JSON with all simulation points plus the optimal_profit_price
    and optimal_revenue_price.

    Use this for "pricing curve" or "what is the best price between $X and $Y"
    type questions.
    """
    db = SessionLocal()
    try:
        validate_price_range(min_price, max_price)
        validate_price(step, "step")
        req = RangeSimulationRequest(
            product_id=product_id,
            min_price=min_price,
            max_price=max_price,
            step=step,
        )
        result = simulate_price_range(db, req)
        points = [
            {
                "price": p.price,
                "demand": p.demand,
                "revenue": p.revenue,
                "profit": p.profit,
                "margin_pct": p.margin_pct,
                "is_current": p.is_current,
                "is_optimal_revenue": p.is_optimal_revenue,
                "is_optimal_profit": p.is_optimal_profit,
                "constraints_satisfied": p.constraints_satisfied,
            }
            for p in result.points
        ]
        return json.dumps({
            "product_id": result.product_id,
            "external_product_id": result.external_product_id,
            "current_price": result.current_price,
            "total_evaluated": result.total_evaluated,
            "optimal_profit_price": result.optimal_profit_price,
            "optimal_revenue_price": result.optimal_revenue_price,
            "points": points,
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()


@tool
def optimize_price_tool(
    product_id: str,
    objective: str = "PROFIT_MAX",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> str:
    """
    Run the full pricing optimization algorithm for a product and return the
    recommended price under the specified objective.

    Args:
        product_id: Product UUID or external SKU ID (e.g. 'SKU-8921-PRO').
        objective: Optimization goal — 'PROFIT_MAX', 'REVENUE_MAX', or 'BALANCED'.
                   Default is 'PROFIT_MAX'.
        min_price: Optional lower bound for candidate prices.
        max_price: Optional upper bound for candidate prices.

    Returns: JSON with recommended_price, price_change_pct, predicted_demand,
    predicted_revenue, predicted_profit, predicted_margin_pct, elasticity,
    confidence, rationale, status ('pending').

    IMPORTANT: The returned recommendation has status='pending'. It is NOT
    automatically applied. Human approval is required before any price change.
    """
    db = SessionLocal()
    try:
        validate_objective(objective)
        if min_price is not None:
            validate_price(min_price, "min_price")
        if max_price is not None:
            validate_price(max_price, "max_price")
        if min_price is not None and max_price is not None:
            validate_price_range(min_price, max_price)

        req = OptimizePriceRequest(
            product_id=product_id,
            objective=objective.upper(),
            min_price=min_price,
            max_price=max_price,
        )
        result = optimize_product_price(db, req)
        risks = build_risk_summary([], result.current_price, result.recommended_price)
        return json.dumps({
            "id": result.id,
            "product_id": result.product_id,
            "external_product_id": result.external_product_id,
            "product_name": result.product_name,
            "category": result.category,
            "current_price": result.current_price,
            "recommended_price": result.recommended_price,
            "price_change_pct": result.price_change_pct,
            "predicted_demand": result.predicted_demand,
            "predicted_revenue": result.predicted_revenue,
            "predicted_profit": result.predicted_profit,
            "predicted_margin_pct": result.predicted_margin_pct,
            "elasticity": result.elasticity,
            "confidence": result.confidence,
            "objective": result.objective,
            "status": result.status,
            "rationale": result.rationale,
            "risk_warnings": risks,
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        db.close()
