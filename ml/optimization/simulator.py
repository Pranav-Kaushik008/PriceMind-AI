"""
PriceMind AI — What-If Pricing Simulator & Response Curve Generator
Powers real-time interactive price sensitivity simulation, scenario analysis, and chart frontiers.
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

from ml.optimization.candidate_prices import CandidatePriceGenerator
from ml.optimization.constraints import PricingConstraints
from ml.optimization.objectives import OptimizationObjective, calculate_financial_metrics
from ml.optimization.demand_estimator import OptimizationDemandEstimator


class WhatIfSimulator:
    """
    Simulation engine calculating dynamic price-demand, revenue, and profit curves for scenario exploration.
    """

    def __init__(
        self,
        demand_estimator: Optional[OptimizationDemandEstimator] = None,
        constraints: Optional[PricingConstraints] = None,
    ):
        self.demand_estimator = demand_estimator or OptimizationDemandEstimator()
        self.constraints = constraints or PricingConstraints()

    def simulate_price(
        self,
        sku_id: str,
        candidate_price: float,
        feature_context: pd.Series | pd.DataFrame,
        cost_price: Optional[float] = None,
        competitor_price: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Simulates the financial and demand outcome of setting a specific candidate price.
        """
        if isinstance(feature_context, pd.DataFrame):
            row = feature_context.iloc[0].to_dict()
        else:
            row = feature_context.to_dict()

        current_price = float(row.get("price", 100.0))
        c = cost_price if cost_price is not None else row.get("cost_price")
        cp = competitor_price if competitor_price is not None else row.get("competitor_price")
        inv = row.get("inventory_level")
        hist_d = float(row.get("demand_rolling_mean_28", row.get("demand_lag_7", 10.0)))

        # Evaluate candidate demand
        pred_demands = self.demand_estimator.predict_demand_for_candidates(
            base_feature_row=pd.Series(row),
            candidate_prices=np.array([candidate_price, current_price]),
            cost_price=c,
            competitor_price=cp,
        )

        sim_q = float(pred_demands[0])
        curr_q = float(pred_demands[1])

        sim_fin = calculate_financial_metrics(candidate_price, sim_q, cost_price=c)
        curr_fin = calculate_financial_metrics(current_price, curr_q, cost_price=c)

        is_valid, violations = self.constraints.evaluate_candidate(
            candidate_price=candidate_price,
            current_price=current_price,
            cost_price=c,
            competitor_price=cp,
            inventory_level=inv,
            historical_daily_demand=hist_d,
        )

        # Delta metrics
        p_delta_pct = ((candidate_price - current_price) / current_price * 100.0)
        d_delta_pct = ((sim_q - curr_q) / curr_q * 100.0) if curr_q > 0 else 0.0
        r_delta_pct = ((sim_fin["revenue"] - curr_fin["revenue"]) / curr_fin["revenue"] * 100.0) if curr_fin["revenue"] > 0 else 0.0

        if sim_fin["profit"] is not None and curr_fin["profit"] is not None and curr_fin["profit"] > 0:
            prof_delta_pct = ((sim_fin["profit"] - curr_fin["profit"]) / curr_fin["profit"] * 100.0)
        else:
            prof_delta_pct = None

        return {
            "sku_id": sku_id,
            "candidate_price": round(candidate_price, 2),
            "current_price": round(current_price, 2),
            "price_delta_pct": round(p_delta_pct, 2),
            "simulated_demand": round(sim_q, 2),
            "current_demand": round(curr_q, 2),
            "demand_delta_pct": round(d_delta_pct, 2),
            "simulated_revenue": sim_fin["revenue"],
            "current_revenue": curr_fin["revenue"],
            "revenue_delta_pct": round(r_delta_pct, 2),
            "simulated_profit": sim_fin["profit"],
            "current_profit": curr_fin["profit"],
            "profit_delta_pct": round(prof_delta_pct, 2) if prof_delta_pct is not None else None,
            "margin_pct": sim_fin["margin_pct"],
            "is_valid": is_valid,
            "violations": violations,
        }

    def generate_price_response_curve(
        self,
        sku_id: str,
        feature_context: pd.Series | pd.DataFrame,
        n_points: int = 25,
        range_pct: float = 25.0,
    ) -> pd.DataFrame:
        """
        Generates continuous response curve data (Price vs Demand, Revenue, Profit) for analytical UI visualization.
        """
        if isinstance(feature_context, pd.DataFrame):
            row = feature_context.iloc[0].to_dict()
        else:
            row = feature_context.to_dict()

        current_price = float(row.get("price", 100.0))
        c = row.get("cost_price")
        cp = row.get("competitor_price")

        generator = CandidatePriceGenerator(
            max_decrease_pct=range_pct,
            max_increase_pct=range_pct,
            n_steps=n_points,
        )
        prices = generator.generate(current_price)

        demands = self.demand_estimator.predict_demand_for_candidates(
            base_feature_row=pd.Series(row),
            candidate_prices=prices,
            cost_price=c,
            competitor_price=cp,
        )

        curve_rows = []
        for p, q in zip(prices, demands):
            fin = calculate_financial_metrics(p, q, cost_price=c)
            fin["sku_id"] = sku_id
            fin["is_current_price"] = bool(np.isclose(p, current_price))
            curve_rows.append(fin)

        return pd.DataFrame(curve_rows)
