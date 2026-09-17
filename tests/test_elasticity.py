"""
PriceMind AI — Tests for Module 3 Statistical Analysis & Price Elasticity
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import shutil

from ml.elasticity.statistical_tests import StatisticalAnalyzer
from ml.elasticity.regression import ElasticityRegressionEngine
from ml.elasticity.elasticity import (
    ElasticityConfig,
    calculate_arc_elasticity,
    compute_pct_changes,
    classify_reliability,
    estimate_product_elasticity,
    estimate_category_elasticity,
    run_statistical_tests,
)
from ml.elasticity.elasticity_report import generate_elasticity_report


@pytest.fixture
def synthetic_elasticity_df():
    """Generates synthetic pricing time series with known negative elasticity."""
    np.random.seed(42)
    n_days = 60
    dates = pd.date_range("2026-01-01", periods=n_days, freq="D")
    records = []

    # SKU 1: Elastic (beta ~ -1.5)
    # SKU 2: Inelastic (beta ~ -0.4)
    skus = [
        ("SKU-ELASTIC", "Hardware", 100.0, -1.5),
        ("SKU-INELASTIC", "Software", 50.0, -0.4),
    ]

    for sku_id, cat, base_p, true_beta in skus:
        for d in dates:
            # Add price variation +/- 10%
            price_mult = 1.0 + np.random.uniform(-0.10, 0.10)
            price = round(base_p * price_mult, 2)
            comp_price = round(base_p * (1.0 + np.random.uniform(-0.05, 0.05)), 2)
            is_promo = int(np.random.random() < 0.15)
            promo_boost = 1.25 if is_promo else 1.0

            # Demand follows log-log power law
            base_q = 50.0
            log_q = np.log(base_q) + true_beta * np.log(price / base_p) + np.log(promo_boost) + np.random.normal(0, 0.05)
            q = max(1, int(round(np.exp(log_q))))

            records.append({
                "date": d,
                "sku_id": sku_id,
                "sku_name": f"Product {sku_id}",
                "category": cat,
                "store_id": "STORE-01",
                "price": price,
                "cost_price": base_p * 0.5,
                "units_sold": q,
                "revenue": price * q,
                "competitor_price": comp_price,
                "inventory_level": 500,
                "is_promotion": is_promo,
            })

    return pd.DataFrame(records)


@pytest.fixture
def temp_report_dir():
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    shutil.rmtree(temp_dir)


def test_calculate_arc_elasticity():
    # Normal elastic drop
    # P: 10 -> 12 (+20%), Q: 100 -> 70 (-30%) -> E should be negative
    e = calculate_arc_elasticity(10, 12, 100, 70)
    assert e is not None
    assert e < 0

    # Edge cases
    assert calculate_arc_elasticity(10, 10, 100, 70) is None  # No price change
    assert calculate_arc_elasticity(0, 10, 100, 70) is not None  # Non-zero midpoint
    assert calculate_arc_elasticity(np.nan, 10, 100, 70) is None  # NaN handling


def test_statistical_analyzer_summary_and_correlations(synthetic_elasticity_df):
    analyzer = StatisticalAnalyzer()

    # 1. Summary Statistics
    summary = analyzer.compute_summary_statistics(synthetic_elasticity_df, group_col="sku_id")
    assert not summary.empty
    assert "mean" in summary.columns
    assert "cv_pct" in summary.columns
    assert "skewness" in summary.columns

    # 2. Correlations
    corrs = analyzer.compute_correlations(
        synthetic_elasticity_df, x_col="price", y_col="units_sold", group_col="sku_id"
    )
    assert len(corrs) == 2
    for _, row in corrs.iterrows():
        # Demand should negatively correlate with price
        assert row["pearson_r"] < 0
        assert row["spearman_rho"] < 0


def test_promotion_impact_hypothesis_testing(synthetic_elasticity_df):
    analyzer = StatisticalAnalyzer()
    promo_results = analyzer.test_promotion_impact(
        synthetic_elasticity_df, promo_col="is_promotion", demand_col="units_sold", group_col="sku_id"
    )
    assert not promo_results.empty
    assert "lift_pct" in promo_results.columns
    assert "ttest_p" in promo_results.columns
    assert "mannwhitney_p" in promo_results.columns


def test_log_log_ols_regression(synthetic_elasticity_df):
    sku1_df = synthetic_elasticity_df[synthetic_elasticity_df["sku_id"] == "SKU-ELASTIC"]

    res = ElasticityRegressionEngine.fit_log_log_ols(
        sku1_df,
        price_col="price",
        demand_col="units_sold",
        control_cols=["competitor_price", "is_promotion"],
    )

    assert res["status"] == "SUCCESS"
    assert res["n_obs"] == 60
    assert res["elasticity"] < 0  # True elasticity is negative
    assert res["p_value"] < 0.05  # Highly significant
    assert res["ci_lower"] < res["elasticity"] < res["ci_upper"]
    assert 0.0 <= res["r_squared"] <= 1.0
    assert res["durbin_watson"] > 0


def test_robust_rlm_regression(synthetic_elasticity_df):
    sku1_df = synthetic_elasticity_df[synthetic_elasticity_df["sku_id"] == "SKU-ELASTIC"]
    rlm_res = ElasticityRegressionEngine.fit_robust_rlm(sku1_df)

    assert rlm_res["status"] == "SUCCESS"
    assert rlm_res["robust_elasticity"] < 0
    assert rlm_res["robust_p_value"] < 0.05


def test_reliability_classification():
    config = ElasticityConfig()

    # High Confidence scenario
    rel_high = classify_reliability(
        n_obs=100, price_cv=6.0, p_value=0.01, ci_width=0.5, config=config, status="SUCCESS"
    )
    assert rel_high == "High Confidence"

    # Medium Confidence scenario (CV 3%, p 0.08)
    rel_med = classify_reliability(
        n_obs=20, price_cv=3.0, p_value=0.08, ci_width=1.8, config=config, status="SUCCESS"
    )
    assert rel_med == "Medium Confidence"

    # Low Confidence scenario (few observations / higher p)
    rel_low = classify_reliability(
        n_obs=12, price_cv=1.0, p_value=0.20, ci_width=2.5, config=config, status="SUCCESS"
    )
    assert rel_low == "Low Confidence"

    # Insufficient Data (insufficient obs or failed regression)
    rel_insuf = classify_reliability(
        n_obs=4, price_cv=0.1, p_value=0.80, ci_width=10.0, config=config, status="INSUFFICIENT_OBSERVATIONS"
    )
    assert rel_insuf == "Insufficient Data"


def test_full_elasticity_pipeline_and_reports(synthetic_elasticity_df, temp_report_dir):
    config = ElasticityConfig(min_obs_high=30, min_cv_high=2.0)

    # 1. Product estimates
    prod_df = estimate_product_elasticity(synthetic_elasticity_df, config=config)
    assert len(prod_df) == 2
    assert "reliability" in prod_df.columns
    assert "elasticity" in prod_df.columns

    # 2. Category estimates
    cat_df = estimate_category_elasticity(synthetic_elasticity_df, config=config)
    assert len(cat_df) == 2

    # 3. Statistical tests
    stats = run_statistical_tests(synthetic_elasticity_df)
    assert "correlations_by_sku" in stats
    assert "promotion_impact_by_sku" in stats

    # 4. Report generation
    written = generate_elasticity_report(
        product_elasticity=prod_df,
        category_elasticity=cat_df,
        statistical_tests=stats,
        output_dir=temp_report_dir,
    )

    assert (temp_report_dir / "elasticity_summary.csv").exists()
    assert (temp_report_dir / "elasticity_categories.csv").exists()
    assert (temp_report_dir / "statistical_analysis.csv").exists()
    assert (temp_report_dir / "promotion_impact.csv").exists()
    assert (temp_report_dir / "elasticity_report.md").exists()
