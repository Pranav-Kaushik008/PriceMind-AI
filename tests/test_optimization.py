"""
PriceMind AI — Tests for Module 6 Dynamic Pricing & Optimization Engine
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import shutil

from ml.optimization.candidate_prices import CandidatePriceGenerator
from ml.optimization.constraints import PricingConstraints
from ml.optimization.objectives import OptimizationObjective, calculate_financial_metrics
from ml.optimization.demand_estimator import OptimizationDemandEstimator
from ml.optimization.optimizer import PriceOptimizer, OptimizationResult
from ml.optimization.simulator import WhatIfSimulator
from ml.optimization.recommendations import PricingRecommendationEngine
from ml.optimization.validation import PricingValidator


@pytest.fixture
def sample_feature_context():
    """Generates synthetic feature row representing a single SKU's operational state."""
    return pd.DataFrame([{
        "date": pd.Timestamp("2026-08-31"),
        "sku_id": "SKU-8921-PRO",
        "sku_name": "Precision Industrial Calibrator X1",
        "category": "Hardware & Tools",
        "store_id": "STORE-NORTH-01",
        "price": 100.0,
        "cost_price": 50.0,
        "competitor_price": 105.0,
        "inventory_level": 500,
        "is_promotion": 0,
        "demand_lag_1": 20.0,
        "demand_lag_7": 22.0,
        "demand_lag_14": 21.0,
        "demand_lag_28": 20.0,
        "demand_rolling_mean_7": 21.0,
        "demand_rolling_mean_14": 20.5,
        "demand_rolling_mean_28": 20.0,
        "price_lag_1": 100.0,
        "price_to_cost_markup": 2.0,
        "competitor_spread_pct": -4.76,
        "unit_gross_margin_pct": 50.0,
        "unit_gross_margin_dollar": 50.0,
        "day_of_week": 0,
        "month": 8,
        "dow_sin": 0.0,
        "dow_cos": 1.0,
        "month_sin": -0.86,
        "month_cos": -0.5,
        "is_weekend": 0,
    }])


@pytest.fixture
def temp_opt_reports():
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    shutil.rmtree(temp_dir)


def test_candidate_price_generator():
    gen = CandidatePriceGenerator(max_decrease_pct=10.0, max_increase_pct=10.0, n_steps=5)
    prices = gen.generate(current_price=100.0)

    assert len(prices) >= 5
    assert 100.0 in prices
    assert np.min(prices) >= 90.0
    assert np.max(prices) <= 110.0
    assert np.all(np.diff(prices) > 0)  # Strictly ascending


def test_candidate_price_generator_invalid_price():
    gen = CandidatePriceGenerator()
    with pytest.raises(ValueError, match="Invalid current price"):
        gen.generate(current_price=-10.0)


def test_pricing_constraints():
    constraints = PricingConstraints(
        min_price=80.0,
        max_price=120.0,
        max_decrease_pct=15.0,
        max_increase_pct=15.0,
        min_margin_pct=25.0,
        competitor_max_ratio=1.10,
    )

    # Valid candidate
    valid, violations = constraints.evaluate_candidate(
        candidate_price=100.0,
        current_price=100.0,
        cost_price=50.0,
        competitor_price=100.0,
    )
    assert valid is True
    assert len(violations) == 0

    # Margin floor violation (Cost = 90, Price = 100 -> Margin = 10% < 25%)
    valid_margin, v_margin = constraints.evaluate_candidate(
        candidate_price=100.0,
        current_price=100.0,
        cost_price=90.0,
    )
    assert valid_margin is False
    assert any("margin" in v.lower() for v in v_margin)

    # Price hike bound violation (+25% > +15%)
    valid_hike, v_hike = constraints.evaluate_candidate(
        candidate_price=125.0,
        current_price=100.0,
        cost_price=50.0,
    )
    assert valid_hike is False
    assert any("price hike" in v.lower() for v in v_hike)


def test_financial_metrics_calculation():
    fin = calculate_financial_metrics(
        candidate_price=100.0,
        predicted_demand=20.0,
        cost_price=60.0,
        objective=OptimizationObjective.PROFIT_MAX,
    )

    assert fin["revenue"] == 2000.0
    assert fin["profit"] == 800.0  # (100 - 60) * 20
    assert fin["margin_pct"] == 40.0
    assert fin["optimization_score"] == 800.0


def test_demand_estimator_batch_scoring(sample_feature_context):
    estimator = OptimizationDemandEstimator()
    prices = np.array([80.0, 90.0, 100.0, 110.0, 120.0])

    demands = estimator.predict_demand_for_candidates(
        base_feature_row=sample_feature_context,
        candidate_prices=prices,
        cost_price=50.0,
        competitor_price=105.0,
    )

    assert len(demands) == 5
    assert np.all(demands >= 0)


def test_price_optimizer_execution(sample_feature_context):
    optimizer = PriceOptimizer()
    constraints = PricingConstraints(min_margin_pct=20.0, max_decrease_pct=15.0, max_increase_pct=15.0)

    res = optimizer.optimize_sku(
        sku_id="SKU-8921-PRO",
        feature_context=sample_feature_context,
        constraints=constraints,
        objective=OptimizationObjective.PROFIT_MAX,
    )

    assert isinstance(res, OptimizationResult)
    assert res.status == "READY"
    assert res.recommended_price > 0
    assert res.recommended_revenue > 0
    assert not res.scenarios_df.empty


def test_what_if_simulator(sample_feature_context):
    simulator = WhatIfSimulator()

    # Single price point simulation
    sim = simulator.simulate_price(
        sku_id="SKU-8921-PRO",
        candidate_price=110.0,
        feature_context=sample_feature_context,
    )

    assert sim["candidate_price"] == 110.0
    assert sim["simulated_demand"] >= 0
    assert sim["simulated_revenue"] > 0
    assert sim["price_delta_pct"] == 10.0

    # Response curve generation
    curve_df = simulator.generate_price_response_curve(
        sku_id="SKU-8921-PRO",
        feature_context=sample_feature_context,
        n_points=10,
    )

    assert len(curve_df) >= 10
    assert "candidate_price" in curve_df.columns
    assert "predicted_demand" in curve_df.columns
    assert "revenue" in curve_df.columns


def test_recommendation_engine_and_reports(sample_feature_context, temp_opt_reports):
    engine = PricingRecommendationEngine(reports_dir=temp_opt_reports)

    recs_df, scenarios_df = engine.generate_recommendations(
        df_features=sample_feature_context,
        objective=OptimizationObjective.PROFIT_MAX,
    )

    assert not recs_df.empty
    assert "recommended_price" in recs_df.columns
    assert "confidence" in recs_df.columns
    assert "explanation_demand" in recs_df.columns

    # Verify report exports
    assert (temp_opt_reports / "pricing_recommendations.csv").exists()
    assert (temp_opt_reports / "optimization_results.csv").exists()
    assert (temp_opt_reports / "simulation_results.csv").exists()


def test_pricing_validator():
    valid_rec = {
        "recommended_price": 105.0,
        "expected_demand": 25.0,
        "expected_revenue": 2625.0,
        "expected_profit": 1375.0,
        "expected_margin_pct": 52.38,
    }
    is_valid, errors = PricingValidator.validate_recommendation(valid_rec)
    assert is_valid is True
    assert len(errors) == 0

    invalid_rec = {
        "recommended_price": -50.0,
        "expected_demand": -10.0,
        "expected_revenue": np.nan,
    }
    is_invalid, errs = PricingValidator.validate_recommendation(invalid_rec)
    assert is_invalid is False
    assert len(errs) >= 2
