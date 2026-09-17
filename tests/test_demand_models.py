"""
PriceMind AI — Tests for Module 4 Demand Prediction & Model Benchmarking
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import shutil

from ml.models.baseline import (
    HistoricalMeanBaseline,
    Lag1NaiveBaseline,
    Seasonal7DayNaiveBaseline,
)
from ml.models.preprocessing import DataSplitter, FeaturePreprocessor
from ml.models.evaluate import ModelEvaluator
from ml.models.train import DemandModelTrainer
from ml.models.model_registry import ModelRegistry
from ml.models import train_model, evaluate_model, predict_demand, save_model, load_model


@pytest.fixture
def synthetic_demand_df():
    """Generates synthetic time-series dataset with 90 days and 2 SKUs."""
    np.random.seed(42)
    dates = pd.date_range("2026-01-01", periods=90, freq="D")
    records = []

    for d in dates:
        for sku in ["SKU-A", "SKU-B"]:
            base_p = 100.0 if sku == "SKU-A" else 50.0
            price = base_p + np.random.normal(0, 2.0)
            comp_p = base_p * 1.02
            is_promo = int(d.day % 10 == 0)
            lag_1 = 15.0 + (sku == "SKU-A") * 10.0 + (d.day % 5)
            lag_7 = lag_1 + np.random.normal(0, 1.0)
            units = max(1, int(round(lag_1 - 0.1 * (price - base_p) + 4.0 * is_promo)))

            records.append({
                "date": d,
                "sku_id": sku,
                "sku_name": f"Product {sku}",
                "category": "Hardware",
                "store_id": "STORE-01",
                "price": price,
                "cost_price": base_p * 0.5,
                "units_sold": units,
                "revenue": price * units,
                "competitor_price": comp_p,
                "inventory_level": 300,
                "is_promotion": is_promo,
                "demand_lag_1": lag_1,
                "demand_lag_7": lag_7,
                "demand_rolling_mean_7": lag_1,
                "price_to_cost_markup": price / (base_p * 0.5),
                "competitor_spread_pct": ((price - comp_p) / comp_p) * 100.0,
            })

    return pd.DataFrame(records)


@pytest.fixture
def temp_ml_dirs():
    temp_dir = Path(tempfile.mkdtemp())
    artifacts_dir = temp_dir / "artifacts"
    reports_dir = temp_dir / "reports"
    artifacts_dir.mkdir(parents=True)
    reports_dir.mkdir(parents=True)
    yield artifacts_dir, reports_dir
    shutil.rmtree(temp_dir)


def test_chronological_data_splitter(synthetic_demand_df):
    train_df, val_df, test_df = DataSplitter.chronological_split(
        synthetic_demand_df, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15
    )

    assert len(train_df) + len(val_df) + len(test_df) == len(synthetic_demand_df)
    assert train_df["date"].max() <= val_df["date"].min()
    assert val_df["date"].max() <= test_df["date"].min()


def test_feature_preprocessor(synthetic_demand_df):
    preprocessor = FeaturePreprocessor(target_col="units_sold")
    X, y, feats = preprocessor.get_features_and_target(synthetic_demand_df, is_training=True)

    assert "units_sold" not in X.columns
    assert "date" not in X.columns
    assert "sku_id" not in X.columns
    assert "price" in X.columns
    assert "demand_lag_1" in X.columns
    assert len(y) == len(synthetic_demand_df)


def test_missing_target_raises_error(synthetic_demand_df):
    df_no_target = synthetic_demand_df.drop(columns=["units_sold"])
    preprocessor = FeaturePreprocessor(target_col="units_sold")

    with pytest.raises(ValueError, match="Target column 'units_sold' is missing"):
        preprocessor.get_features_and_target(df_no_target, is_training=True)


def test_baseline_models(synthetic_demand_df):
    preprocessor = FeaturePreprocessor(target_col="units_sold")
    X, y, _ = preprocessor.get_features_and_target(synthetic_demand_df, is_training=True)

    mean_base = HistoricalMeanBaseline()
    mean_base.fit(X, y, group_col=synthetic_demand_df["sku_id"])
    preds_mean = mean_base.predict(X, group_col=synthetic_demand_df["sku_id"])
    assert len(preds_mean) == len(X)
    assert np.all(preds_mean > 0)

    lag_base = Lag1NaiveBaseline(lag_col="demand_lag_1")
    lag_base.fit(X, y)
    preds_lag = lag_base.predict(X)
    assert len(preds_lag) == len(X)
    assert np.all(preds_lag >= 0)


def test_metric_calculations_and_zero_handling():
    y_true = np.array([10.0, 20.0, 0.0, 50.0])
    y_pred = np.array([12.0, 18.0, 2.0, 48.0])

    metrics = ModelEvaluator.calculate_metrics(y_true, y_pred, model_name="TestModel")

    assert metrics["mae"] > 0
    assert metrics["rmse"] > 0
    assert metrics["wape_pct"] > 0
    assert metrics["total_actual_demand"] == 80.0
    assert metrics["total_predicted_demand"] == 80.0
    assert metrics["demand_bias"] == 0.0
    # Zero actual is safely excluded from MAPE calculation
    assert metrics["mape_coverage_pct"] == 75.0


def test_end_to_end_training_and_registry(synthetic_demand_df, temp_ml_dirs):
    artifacts_dir, reports_dir = temp_ml_dirs

    trainer = DemandModelTrainer(random_seed=42)
    comp_df, preds_df, artifacts = trainer.train_and_benchmark_all(
        synthetic_demand_df, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15
    )

    assert not comp_df.empty
    assert "rmse" in comp_df.columns
    assert "r2" in comp_df.columns
    assert len(comp_df) >= 5  # Baselines + Sklearn + XGBoost + LightGBM

    best_model = artifacts["best_model"]
    assert best_model is not None

    # Test ModelRegistry persistence
    registry = ModelRegistry(artifacts_dir=artifacts_dir, reports_dir=reports_dir)
    save_res = registry.save_model(best_model, "ProductionBest", artifacts["metadata"])

    assert Path(save_res["model_path"]).exists()
    assert Path(save_res["metadata_path"]).exists()

    # Test load
    loaded_model, meta = registry.load_model(save_res["model_path"])
    assert loaded_model is not None

    # Test report exports
    report_res = registry.export_reports(comp_df, preds_df)
    assert Path(report_res["model_comparison"]).exists()
    assert Path(report_res["prediction_evaluation"]).exists()
