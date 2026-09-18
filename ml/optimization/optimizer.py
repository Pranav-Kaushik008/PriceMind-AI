"""
PriceMind AI — Dynamic Pricing Optimization Engine
Conducts grid evaluation across candidate prices, applies business constraints, and selects the optimal price point.
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
import pandas as pd
import numpy as np
import logging

from ml.optimization.candidate_prices import CandidatePriceGenerator
from ml.optimization.constraints import PricingConstraints
from ml.optimization.objectives import OptimizationObjective, calculate_financial_metrics
from ml.optimization.demand_estimator import OptimizationDemandEstimator

logger = logging.getLogger(__name__)


@dataclass
class OptimizationResult:
    sku_id: str
    sku_name: str
    category: str
    current_price: float
    recommended_price: float
    price_delta_dollar: float
    price_delta_pct: float
    current_demand: float
    recommended_demand: float
    demand_delta_pct: float
    current_revenue: float
    recommended_revenue: float
    revenue_lift_pct: float
    current_profit: Optional[float]
    recommended_profit: Optional[float]
    profit_lift_pct: Optional[float]
    recommended_margin_pct: Optional[float]
    elasticity: float
    elasticity_reliability: str
    objective_used: str
    constraints_satisfied: bool
    status: str
    scenarios_df: pd.DataFrame = field(repr=False)


class PriceOptimizer:
    """
    Transparent mathematical optimizer evaluating candidate pricing grids against trained ML demand models and business constraints.
    """

    def __init__(
        self,
        demand_estimator: Optional[OptimizationDemandEstimator] = None,
        default_constraints: Optional[PricingConstraints] = None,
    ):
        self.demand_estimator = demand_estimator or OptimizationDemandEstimator()
        self.default_constraints = default_constraints or PricingConstraints()

    def optimize_sku(
        self,
        sku_id: str,
        feature_context: pd.Series | pd.DataFrame,
        constraints: Optional[PricingConstraints] = None,
        candidate_generator: Optional[CandidatePriceGenerator] = None,
        objective: OptimizationObjective = OptimizationObjective.PROFIT_MAX,
    ) -> OptimizationResult:
        """
        Solves price optimization for a single SKU.
        """
        if isinstance(feature_context, pd.DataFrame):
            row = feature_context.iloc[0].to_dict()
        else:
            row = feature_context.to_dict()

        current_price = float(row.get("price", 0.0))
        cost_price = float(row["cost_price"]) if "cost_price" in row and row["cost_price"] is not None and row["cost_price"] > 0 else None
        competitor_price = float(row["competitor_price"]) if "competitor_price" in row and row["competitor_price"] is not None and row["competitor_price"] > 0 else None
        inventory_level = float(row["inventory_level"]) if "inventory_level" in row and row["inventory_level"] is not None else None
        sku_name = str(row.get("sku_name", sku_id))
        category = str(row.get("category", "General"))

        if current_price <= 0:
            return self._create_failed_result(
                sku_id, sku_name, category, current_price, "INVALID_CURRENT_PRICE", objective
            )

        active_constraints = constraints or self.default_constraints
        gen = candidate_generator or CandidatePriceGenerator(
            max_decrease_pct=active_constraints.max_decrease_pct,
            max_increase_pct=active_constraints.max_increase_pct,
            n_steps=25,
        )

        # 1. Generate Candidate Prices
        candidate_prices = gen.generate(current_price)

        # 2. Vectorized Demand Scoring
        predicted_demands = self.demand_estimator.predict_demand_for_candidates(
            base_feature_row=pd.Series(row),
            candidate_prices=candidate_prices,
            cost_price=cost_price,
            competitor_price=competitor_price,
        )

        # Historical daily demand proxy for inventory checks
        hist_demand = float(row.get("demand_rolling_mean_28", row.get("demand_lag_7", 10.0)))

        # 3. Evaluate Scenarios and Constraints
        scenario_rows = []
        for p, q in zip(candidate_prices, predicted_demands):
            is_valid, violations = active_constraints.evaluate_candidate(
                candidate_price=p,
                current_price=current_price,
                cost_price=cost_price,
                competitor_price=competitor_price,
                inventory_level=inventory_level,
                historical_daily_demand=hist_demand,
            )

            fin = calculate_financial_metrics(p, q, cost_price=cost_price, objective=objective)
            fin["is_valid"] = is_valid
            fin["violations"] = ", ".join(violations) if violations else "None"
            fin["is_current_price"] = bool(np.isclose(p, current_price))
            scenario_rows.append(fin)

        scenarios_df = pd.DataFrame(scenario_rows)

        # 4. Current Price Baseline Metrics
        curr_mask = scenarios_df["is_current_price"]
        if curr_mask.any():
            curr_row = scenarios_df[curr_mask].iloc[0]
        else:
            curr_row = scenarios_df.iloc[0]

        curr_demand = float(curr_row["predicted_demand"])
        curr_rev = float(curr_row["revenue"])
        curr_profit = float(curr_row["profit"]) if curr_row["profit"] is not None else None

        # 5. Select Best Valid Candidate
        valid_scenarios = scenarios_df[scenarios_df["is_valid"]]
        if valid_scenarios.empty:
            return self._create_failed_result(
                sku_id, sku_name, category, current_price, "NO_VALID_RECOMMENDATION", objective, scenarios_df
            )

        best_row = valid_scenarios.sort_values("optimization_score", ascending=False).iloc[0]

        rec_price = float(best_row["candidate_price"])
        rec_demand = float(best_row["predicted_demand"])
        rec_rev = float(best_row["revenue"])
        rec_profit = float(best_row["profit"]) if best_row["profit"] is not None else None
        rec_margin = float(best_row["margin_pct"]) if best_row["margin_pct"] is not None else None

        # Lift calculations
        p_delta = rec_price - current_price
        p_delta_pct = (p_delta / current_price * 100.0)
        d_delta_pct = ((rec_demand - curr_demand) / curr_demand * 100.0) if curr_demand > 0 else 0.0
        r_lift_pct = ((rec_rev - curr_rev) / curr_rev * 100.0) if curr_rev > 0 else 0.0
        p_lift_pct = (((rec_profit - curr_profit) / curr_profit * 100.0) if (curr_profit and curr_profit > 0 and rec_profit is not None) else None)

        elast_info = self.demand_estimator.get_elasticity_info(sku_id)

        return OptimizationResult(
            sku_id=sku_id,
            sku_name=sku_name,
            category=category,
            current_price=round(current_price, 2),
            recommended_price=round(rec_price, 2),
            price_delta_dollar=round(p_delta, 2),
            price_delta_pct=round(p_delta_pct, 2),
            current_demand=round(curr_demand, 2),
            recommended_demand=round(rec_demand, 2),
            demand_delta_pct=round(d_delta_pct, 2),
            current_revenue=round(curr_rev, 2),
            recommended_revenue=round(rec_rev, 2),
            revenue_lift_pct=round(r_lift_pct, 2),
            current_profit=round(curr_profit, 2) if curr_profit is not None else None,
            recommended_profit=round(rec_profit, 2) if rec_profit is not None else None,
            profit_lift_pct=round(p_lift_pct, 2) if p_lift_pct is not None else None,
            recommended_margin_pct=round(rec_margin, 2) if rec_margin is not None else None,
            elasticity=elast_info["elasticity"],
            elasticity_reliability=elast_info["reliability"],
            objective_used=objective.value,
            constraints_satisfied=True,
            status="READY",
            scenarios_df=scenarios_df,
        )

    def _create_failed_result(
        self,
        sku_id: str,
        sku_name: str,
        category: str,
        current_price: float,
        status: str,
        objective: OptimizationObjective,
        scenarios_df: Optional[pd.DataFrame] = None,
    ) -> OptimizationResult:
        return OptimizationResult(
            sku_id=sku_id,
            sku_name=sku_name,
            category=category,
            current_price=current_price,
            recommended_price=current_price,
            price_delta_dollar=0.0,
            price_delta_pct=0.0,
            current_demand=0.0,
            recommended_demand=0.0,
            demand_delta_pct=0.0,
            current_revenue=0.0,
            recommended_revenue=0.0,
            revenue_lift_pct=0.0,
            current_profit=None,
            recommended_profit=None,
            profit_lift_pct=None,
            recommended_margin_pct=None,
            elasticity=-1.0,
            elasticity_reliability="Insufficient Data",
            objective_used=objective.value,
            constraints_satisfied=False,
            status=status,
            scenarios_df=scenarios_df if scenarios_df is not None else pd.DataFrame(),
        )
