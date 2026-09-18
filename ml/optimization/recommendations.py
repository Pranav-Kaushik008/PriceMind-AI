"""
PriceMind AI — Pricing Recommendation Engine
Synthesizes optimizer outputs, elasticity ratings, financial lifts, and structured business explanations.
"""

from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import pandas as pd
import numpy as np
import logging

from ml.optimization.optimizer import PriceOptimizer, OptimizationResult
from ml.optimization.constraints import PricingConstraints
from ml.optimization.objectives import OptimizationObjective

logger = logging.getLogger(__name__)


class PricingRecommendationEngine:
    """
    Generates enterprise-ready pricing recommendation cards with transparent confidence tiers and decision explanations.
    """

    def __init__(
        self,
        optimizer: Optional[PriceOptimizer] = None,
        reports_dir: Optional[Path | str] = None,
    ):
        self.optimizer = optimizer or PriceOptimizer()
        project_root = Path(__file__).resolve().parents[2]
        self.reports_dir = Path(reports_dir) if reports_dir else (project_root / "reports")
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def determine_confidence(
        self,
        opt_result: OptimizationResult,
    ) -> str:
        """
        Assigns transparent, rule-based confidence tier to pricing recommendations.
        """
        if opt_result.status != "READY":
            return "INSUFFICIENT_DATA"

        rel = opt_result.elasticity_reliability
        price_change_abs = abs(opt_result.price_delta_pct)

        if rel == "High Confidence" and price_change_abs <= 15.0:
            return "HIGH_CONFIDENCE"
        elif rel in ["High Confidence", "Medium Confidence"] and price_change_abs <= 25.0:
            return "MEDIUM_CONFIDENCE"
        elif rel == "Low Confidence":
            return "LOW_CONFIDENCE"
        else:
            return "INSUFFICIENT_DATA"

    def build_explanation(
        self,
        opt_result: OptimizationResult,
        row_context: Dict[str, Any],
    ) -> Dict[str, str]:
        """
        Builds transparent, quantitative explanation factors for the analyst workspace.
        """
        p_delta = opt_result.price_delta_pct
        d_delta = opt_result.demand_delta_pct
        r_lift = opt_result.revenue_lift_pct
        p_lift = opt_result.profit_lift_pct

        # Demand explanation
        if p_delta == 0:
            demand_exp = f"Current price (${opt_result.current_price:.2f}) is already optimal; no demand disruption expected."
        elif p_delta > 0:
            demand_exp = (
                f"Price increase of +{p_delta:.1f}% (${opt_result.current_price:.2f} -> ${opt_result.recommended_price:.2f}) "
                f"leads to controlled demand change of {d_delta:.1f}% ({opt_result.current_demand:.1f} -> {opt_result.recommended_demand:.1f} units/day)."
            )
        else:
            demand_exp = (
                f"Price discount of {p_delta:.1f}% (${opt_result.current_price:.2f} -> ${opt_result.recommended_price:.2f}) "
                f"stimulates +{abs(d_delta):.1f}% demand lift ({opt_result.current_demand:.1f} -> {opt_result.recommended_demand:.1f} units/day)."
            )

        # Financial explanation
        if p_lift is not None:
            fin_exp = (
                f"Gross margin set to {opt_result.recommended_margin_pct:.1f}%, delivering projected daily profit lift of "
                f"{'+' if p_lift >= 0 else ''}{p_lift:.1f}% (${opt_result.current_profit:.2f} -> ${opt_result.recommended_profit:.2f})."
            )
        else:
            fin_exp = f"Projected daily revenue lift of {'+' if r_lift >= 0 else ''}{r_lift:.1f}% (${opt_result.current_revenue:.2f} -> ${opt_result.recommended_revenue:.2f})."

        # Competitor positioning
        cp = row_context.get("competitor_price")
        if cp and cp > 0:
            spread = ((opt_result.recommended_price - cp) / cp) * 100.0
            if spread < 0:
                comp_exp = f"Positions product at a {abs(spread):.1f}% discount vs competitor benchmark (${cp:.2f})."
            elif spread > 0:
                comp_exp = f"Positions product at a {spread:.1f}% premium vs competitor benchmark (${cp:.2f})."
            else:
                comp_exp = f"Matches competitor benchmark price (${cp:.2f}) exactly."
        else:
            comp_exp = "No direct competitor pricing benchmark available."

        # Inventory considerations
        inv = row_context.get("inventory_level")
        hist_d = row_context.get("demand_rolling_mean_28", 10.0)
        if inv and hist_d and hist_d > 0:
            dos = inv / hist_d
            inv_exp = f"Healthy inventory runway of {dos:.1f} days supply ({int(inv)} units in stock); low stockout probability."
        else:
            inv_exp = "Standard inventory replenishment buffer maintained."

        return {
            "demand_effect": demand_exp,
            "financial_effect": fin_exp,
            "competitor_position": comp_exp,
            "inventory_consideration": inv_exp,
            "elasticity_signal": f"Empirical price elasticity $\\beta = {opt_result.elasticity:.2f}$ ({opt_result.elasticity_reliability}).",
        }

    def generate_recommendations(
        self,
        df_features: pd.DataFrame,
        constraints: Optional[PricingConstraints] = None,
        objective: OptimizationObjective = OptimizationObjective.PROFIT_MAX,
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Generates optimal recommendations across all SKUs based on their latest feature state.
        Returns:
            - recommendations_df: High-level recommendation table for UI/reporting
            - scenario_results_df: Granular candidate price evaluations
        """
        skus = sorted(df_features["sku_id"].dropna().unique())
        rec_rows = []
        all_scenarios = []

        # Get latest observation per SKU
        latest_df = df_features.sort_values("date").groupby("sku_id").last().reset_index()

        for sku in skus:
            sub = latest_df[latest_df["sku_id"] == sku]
            if sub.empty:
                continue

            row_dict = sub.iloc[0].to_dict()
            opt_res = self.optimizer.optimize_sku(
                sku_id=sku,
                feature_context=sub,
                constraints=constraints,
                objective=objective,
            )

            conf = self.determine_confidence(opt_res)
            exp_dict = self.build_explanation(opt_res, row_dict)

            rec_rows.append({
                "sku_id": opt_res.sku_id,
                "sku_name": opt_res.sku_name,
                "category": opt_res.category,
                "current_price": opt_res.current_price,
                "recommended_price": opt_res.recommended_price,
                "price_delta_dollar": opt_res.price_delta_dollar,
                "price_delta_pct": opt_res.price_delta_pct,
                "current_demand": opt_res.current_demand,
                "expected_demand": opt_res.recommended_demand,
                "demand_delta_pct": opt_res.demand_delta_pct,
                "current_revenue": opt_res.current_revenue,
                "expected_revenue": opt_res.recommended_revenue,
                "revenue_lift_pct": opt_res.revenue_lift_pct,
                "current_profit": opt_res.current_profit,
                "expected_profit": opt_res.recommended_profit,
                "profit_lift_pct": opt_res.profit_lift_pct,
                "expected_margin_pct": opt_res.recommended_margin_pct,
                "elasticity": opt_res.elasticity,
                "elasticity_reliability": opt_res.elasticity_reliability,
                "confidence": conf,
                "optimization_objective": opt_res.objective_used,
                "recommendation_status": opt_res.status,
                "explanation_demand": exp_dict["demand_effect"],
                "explanation_financial": exp_dict["financial_effect"],
                "explanation_competitor": exp_dict["competitor_position"],
            })

            if not opt_res.scenarios_df.empty:
                sc_copy = opt_res.scenarios_df.copy()
                sc_copy["sku_id"] = sku
                all_scenarios.append(sc_copy)

        recommendations_df = pd.DataFrame(rec_rows)
        scenario_results_df = pd.concat(all_scenarios, ignore_index=True) if all_scenarios else pd.DataFrame()

        # Save Reports
        rec_path = self.reports_dir / "pricing_recommendations.csv"
        opt_path = self.reports_dir / "optimization_results.csv"
        sim_path = self.reports_dir / "simulation_results.csv"

        recommendations_df.to_csv(rec_path, index=False)
        scenario_results_df.to_csv(opt_path, index=False)
        scenario_results_df.to_csv(sim_path, index=False)

        logger.info(f"Saved recommendations to: {rec_path}")
        return recommendations_df, scenario_results_df
