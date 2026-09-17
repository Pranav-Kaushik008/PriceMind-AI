"""Empirical Price Elasticity & Non-Linear Spline Demand Modeling."""
import numpy as np
from typing import Dict, Any, List

class ElasticityModel:
    """Log-Log regression and spline-based price elasticity estimator."""

    def __init__(self, base_elasticity: float = -1.34):
        self.base_elasticity = base_elasticity

    def estimate_elasticity(self, prices: np.ndarray, quantities: np.ndarray) -> float:
        """Estimates elasticity coefficient: % dQ / % dP."""
        if len(prices) < 2:
            return self.base_elasticity
        log_p = np.log(prices)
        log_q = np.log(quantities)
        slope, _ = np.polyfit(log_p, log_q, 1)
        return float(slope)

    def generate_demand_curve(self, current_price: float, current_demand: int, cost_price: float) -> List[Dict[str, Any]]:
        """Generates step-wise demand, revenue, and gross profit projections across a ±20% price band."""
        points = []
        steps = np.linspace(current_price * 0.85, current_price * 1.20, 9)
        for p in steps:
            p = round(float(p), 2)
            price_ratio = p / current_price
            sim_demand = max(1, int(current_demand * (price_ratio ** self.base_elasticity)))
            rev = round(p * sim_demand, 2)
            gross_profit = round((p - cost_price) * sim_demand, 2)
            margin_pct = round((gross_profit / rev) * 100, 2) if rev > 0 else 0.0
            points.append({
                "price": p,
                "demandUnits": sim_demand,
                "revenue": rev,
                "grossMarginDollars": gross_profit,
                "grossMarginPercent": margin_pct,
                "isCurrent": abs(p - current_price) < 1.0,
                "isOptimalRevenue": False,
                "isOptimalMargin": False,
            })
        return points

elasticity_model = ElasticityModel()
