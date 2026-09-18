"""
PriceMind AI — Optimization & Dynamic Pricing Public API
"""

from typing import Dict, Any, Optional, Tuple, List
import pandas as pd

from ml.optimization.candidate_prices import CandidatePriceGenerator
from ml.optimization.constraints import PricingConstraints
from ml.optimization.objectives import OptimizationObjective, calculate_financial_metrics
from ml.optimization.demand_estimator import OptimizationDemandEstimator
from ml.optimization.optimizer import PriceOptimizer, OptimizationResult
from ml.optimization.simulator import WhatIfSimulator
from ml.optimization.recommendations import PricingRecommendationEngine
from ml.optimization.validation import PricingValidator


def optimize_price(
    sku_id: str,
    feature_context: pd.Series | pd.DataFrame,
    constraints: Optional[PricingConstraints] = None,
    objective: OptimizationObjective = OptimizationObjective.PROFIT_MAX,
) -> OptimizationResult:
    """
    Convenience wrapper to solve constrained price optimization for a single SKU.
    """
    optimizer = PriceOptimizer()
    return optimizer.optimize_sku(
        sku_id=sku_id,
        feature_context=feature_context,
        constraints=constraints,
        objective=objective,
    )


def simulate_price(
    sku_id: str,
    candidate_price: float,
    feature_context: pd.Series | pd.DataFrame,
    cost_price: Optional[float] = None,
    competitor_price: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Convenience wrapper to simulate demand, revenue, and profit for a what-if price point.
    """
    simulator = WhatIfSimulator()
    return simulator.simulate_price(
        sku_id=sku_id,
        candidate_price=candidate_price,
        feature_context=feature_context,
        cost_price=cost_price,
        competitor_price=competitor_price,
    )


def generate_recommendations(
    df_features: pd.DataFrame,
    constraints: Optional[PricingConstraints] = None,
    objective: OptimizationObjective = OptimizationObjective.PROFIT_MAX,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Convenience wrapper to generate optimization recommendations for all SKUs.
    """
    engine = PricingRecommendationEngine()
    return engine.generate_recommendations(df_features, constraints=constraints, objective=objective)


__all__ = [
    "CandidatePriceGenerator",
    "PricingConstraints",
    "OptimizationObjective",
    "calculate_financial_metrics",
    "OptimizationDemandEstimator",
    "PriceOptimizer",
    "OptimizationResult",
    "WhatIfSimulator",
    "PricingRecommendationEngine",
    "PricingValidator",
    "optimize_price",
    "simulate_price",
    "generate_recommendations",
]
