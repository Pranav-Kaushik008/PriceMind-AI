"""
PriceMind AI — Tests for Module 5 Demand Forecasting
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import shutil

from ml.forecasting.prepare import TimeSeriesPreparer
from ml.forecasting.baseline import NaiveForecaster, SeasonalNaiveForecaster, MovingAverageForecaster
from ml.forecasting.models import (
    ExponentialSmoothingForecaster,
    SARIMAXForecaster,
    RecursiveMLForecaster,
    STATSMODELS_AVAILABLE,
)
from ml.forecasting.evaluate import ForecastEvaluator
from ml.forecasting.diagnostics import ForecastDiagnostics
from ml.forecasting.forecast import DemandForecastingPipeline
from ml.forecasting.train import ForecastingTrainer


@pytest.fixture
def synthetic_forecast_df():
    """Generates synthetic daily time series with 60 days, 2 SKUs, and weekly seasonality."""
    np.random.seed(42)
    dates = pd.date_range("2026-01-01", periods=60, freq="D")
    records = []

    for d in dates:
        for sku in ["SKU-01", "SKU-02"]:
            dow = d.dayofweek
            season_boost = 1.3 if dow in [5, 6] else 1.0
            base_q = 20.0 if sku == "SKU-01" else 10.0
            q = int(round(base_q * season_boost + np.random.normal(0, 1.0)))

            records.append({
                "date": d,
                "sku_id": sku,
                "sku_name": f"Product {sku}",
                "category": "Electronics",
                "store_id": "STORE-01",
                "price": 100.0,
                "cost_price": 50.0,
                "units_sold": max(1, q),
                "revenue": 100.0 * max(1, q),
                "competitor_price": 102.0,
                "is_promotion": int(d.day % 15 == 0),
            })

    return pd.DataFrame(records)


@pytest.fixture
def temp_forecast_dirs():
    temp_dir = Path(tempfile.mkdtemp())
    reports_dir = temp_dir / "reports"
    artifacts_dir = temp_dir / "artifacts"
    reports_dir.mkdir(parents=True)
    artifacts_dir.mkdir(parents=True)
    yield reports_dir, artifacts_dir
    shutil.rmtree(temp_dir)


def test_time_series_preparer_and_frequency(synthetic_forecast_df):
    freq = TimeSeriesPreparer.detect_frequency(synthetic_forecast_df["date"])
    assert freq == "D"

    # Test SKU series preparation
    sku_df, meta = TimeSeriesPreparer.prepare_sku_series(synthetic_forecast_df, sku_id="SKU-01")
    assert meta["status"] == "READY"
    assert len(sku_df) == 60
    assert "units_sold" in sku_df.columns
    assert "date" in sku_df.columns


def test_insufficient_history_handling():
    short_dates = pd.date_range("2026-01-01", periods=10, freq="D")
    short_df = pd.DataFrame({
        "date": short_dates,
        "sku_id": "SKU-SHORT",
        "units_sold": [5] * 10,
        "price": [50.0] * 10,
    })

    _, meta = TimeSeriesPreparer.prepare_sku_series(short_df, sku_id="SKU-SHORT")
    assert meta["status"] == "INSUFFICIENT_HISTORY"


def test_baseline_forecasters():
    y = np.array([10, 12, 14, 16, 18, 20, 22] * 4)  # 28 days with weekly cycle
    horizon = 7

    # 1. Naive
    naive = NaiveForecaster().fit(y)
    p_n, l_n, u_n = naive.forecast(horizon=horizon)
    assert len(p_n) == horizon
    assert p_n[0] == y[-1]
    assert np.all(l_n <= p_n)
    assert np.all(u_n >= p_n)

    # 2. Seasonal Naive
    s_naive = SeasonalNaiveForecaster(seasonal_period=7).fit(y)
    p_sn, l_sn, u_sn = s_naive.forecast(horizon=horizon)
    assert len(p_sn) == horizon
    assert np.allclose(p_sn, y[-7:])

    # 3. Moving Average
    ma = MovingAverageForecaster(window=7).fit(y)
    p_ma, l_ma, u_ma = ma.forecast(horizon=horizon)
    assert len(p_ma) == horizon
    assert np.isclose(p_ma[0], np.mean(y[-7:]))


def test_advanced_forecasters(synthetic_forecast_df):
    sku_df, _ = TimeSeriesPreparer.prepare_sku_series(synthetic_forecast_df, sku_id="SKU-01")
    train_df, test_df = TimeSeriesPreparer.train_test_forecast_split(sku_df, horizon=7)

    # 1. Recursive ML Forecaster
    rec_ml = RecursiveMLForecaster(base_model_type="lightgbm").fit(train_df)
    p_ml, l_ml, u_ml = rec_ml.forecast(start_date=test_df["date"].iloc[0], horizon=7)
    assert len(p_ml) == 7
    assert np.all(p_ml >= 0)
    assert np.all(l_ml <= u_ml)

    # 2. Exponential Smoothing
    if STATSMODELS_AVAILABLE:
        es = ExponentialSmoothingForecaster(seasonal_periods=7).fit(train_df["units_sold"])
        p_es, l_es, u_es = es.forecast(horizon=7)
        assert len(p_es) == 7
        assert np.all(p_es >= 0)


def test_forecast_evaluator_metrics():
    y_true = np.array([10.0, 15.0, 20.0, 25.0])
    y_pred = np.array([12.0, 14.0, 18.0, 24.0])
    y_hist = np.array([5.0, 8.0, 10.0, 12.0, 10.0, 15.0, 20.0, 25.0])
    lb = np.array([8.0, 10.0, 15.0, 20.0])
    ub = np.array([16.0, 18.0, 22.0, 28.0])

    m = ForecastEvaluator.calculate_metrics(
        y_true=y_true,
        y_pred=y_pred,
        y_train_history=y_hist,
        lower_bound=lb,
        upper_bound=ub,
        model_name="TestModel",
    )

    assert m["mae"] > 0
    assert m["rmse"] > 0
    assert m["wape_pct"] > 0
    assert m["mase"] is not None
    assert m["interval_coverage_pct"] == 100.0


def test_forecast_diagnostics(synthetic_forecast_df):
    sku_df, _ = TimeSeriesPreparer.prepare_sku_series(synthetic_forecast_df, sku_id="SKU-01")

    season = ForecastDiagnostics.analyze_seasonality(sku_df)
    assert "has_weekly_seasonality" in season
    assert "dow_means" in season

    trend = ForecastDiagnostics.analyze_trend(sku_df)
    assert "trend_status" in trend
    assert "volatility_cv_pct" in trend


def test_production_forecast_pipeline(synthetic_forecast_df, temp_forecast_dirs):
    reports_dir, artifacts_dir = temp_forecast_dirs

    # 1. Pipeline execution
    pipeline = DemandForecastingPipeline(default_horizon=7)
    forecasts_df, summary_df = pipeline.forecast_all_skus(synthetic_forecast_df, horizon=7)

    assert len(summary_df) == 2
    assert len(forecasts_df) == 14  # 2 SKUs x 7 days
    assert "predicted_demand" in forecasts_df.columns
    assert "lower_bound" in forecasts_df.columns
    assert "upper_bound" in forecasts_df.columns

    # 2. Holdout trainer benchmark
    trainer = ForecastingTrainer(
        horizon=7, reports_dir=reports_dir, artifacts_dir=artifacts_dir
    )
    metrics_df, holdout_preds, summ = trainer.evaluate_all_models_on_holdout(synthetic_forecast_df)

    assert not metrics_df.empty
    assert (reports_dir / "forecast_metrics.csv").exists()
    assert (reports_dir / "forecast_predictions.csv").exists()
    assert (reports_dir / "forecast_summary.csv").exists()
