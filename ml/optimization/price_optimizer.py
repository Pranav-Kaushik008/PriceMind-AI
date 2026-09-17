"""Constrained Revenue & Gross Margin Optimization Engine."""
from typing import Dict, Any

class PriceOptimizer:
    """Solves bounded optimization: maximize Profit(P) = (P - Cost) * Q(P) subject to Margin Floor & MAP bounds."""

    def optimize_sku(
        self,
        current_price: float,
        cost_price: float,
        elasticity: float,
        min_margin_floor_pct: float = 35.0,
        max_price_adjustment_pct: float = 15.0,
    ) -> Dict[str, Any]:
        # Unconstrained theoretical optimum: P* = Cost * (Ed / (1 + Ed))
        if elasticity < -1.0:
            raw_optimal = cost_price * (elasticity / (1.0 + elasticity))
        else:
            raw_optimal = current_price * 1.08 # Bound inelastic items

        min_allowed_price = max(cost_price / (1.0 - (min_margin_floor_pct / 100.0)), current_price * (1.0 - max_price_adjustment_pct / 100.0))
        max_allowed_price = current_price * (1.0 + max_price_adjustment_pct / 100.0)

        optimal_price = round(max(min_allowed_price, min(max_allowed_price, raw_optimal)), 2)
        price_delta_pct = round(((optimal_price - current_price) / current_price) * 100.0, 2)
        projected_margin_pct = round(((optimal_price - cost_price) / optimal_price) * 100.0, 2)

        return {
            "current_price": current_price,
            "recommended_price": optimal_price,
            "price_delta_percent": price_delta_pct,
            "projected_margin_percent": projected_margin_pct,
            "guardrail_floor_passed": optimal_price >= min_allowed_price,
        }

price_optimizer = PriceOptimizer()
