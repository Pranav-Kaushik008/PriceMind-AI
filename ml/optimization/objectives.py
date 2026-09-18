"""
PriceMind AI — Optimization Objective Functions
Defines objective evaluation for Revenue Maximization, Profit Maximization, and Gross Margin targets.
"""

from enum import Enum
from typing import Dict, Any, Optional
import numpy as np


class OptimizationObjective(str, Enum):
    REVENUE_MAX = "revenue_max"
    PROFIT_MAX = "profit_max"
    BALANCED = "balanced"


def calculate_financial_metrics(
    candidate_price: float,
    predicted_demand: float,
    cost_price: Optional[float] = None,
    objective: OptimizationObjective = OptimizationObjective.PROFIT_MAX,
) -> Dict[str, Any]:
    """
    Computes financial metrics (Revenue, Profit, Margin) for a candidate pricing point.
    """
    p = float(candidate_price)
    q = max(0.0, float(predicted_demand))

    revenue = p * q

    if cost_price is not None and cost_price > 0:
        c = float(cost_price)
        unit_margin = p - c
        profit = unit_margin * q
        margin_pct = (unit_margin / p * 100.0) if p > 0 else 0.0
    else:
        profit = None
        margin_pct = None
        unit_margin = None

    # Determine optimization score
    if objective == OptimizationObjective.PROFIT_MAX and profit is not None:
        score = profit
    else:
        score = revenue

    return {
        "candidate_price": round(p, 2),
        "predicted_demand": round(q, 2),
        "revenue": round(revenue, 2),
        "profit": round(profit, 2) if profit is not None else None,
        "margin_pct": round(margin_pct, 2) if margin_pct is not None else None,
        "unit_margin_dollar": round(unit_margin, 2) if unit_margin is not None else None,
        "optimization_score": round(score, 2),
    }
