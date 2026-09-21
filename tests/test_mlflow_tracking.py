"""
tests/test_mlflow_tracking.py
-----------------------------
Unit and integration tests for Module 10 MLflow Tracking and MLOps Layer.
"""

import pytest
import os
import tempfile
from pathlib import Path
import numpy as np
import pandas as pd
import mlflow
import xgboost as xgb

from ml.tracking.mlflow_config import (
    setup_mlflow,
    get_tracking_uri,
    is_mlflow_enabled,
    EXPERIMENT_DEMAND_PREDICTION,
)
from ml.tracking.experiment import get_or_create_experiment, set_active_experiment
from ml.tracking.tracking_utils import (
    log_dataset_metadata,
    log_model_parameters,
    log_evaluation_metrics,
    log_feature_artifacts,
    log_evaluation_plots,
)
from ml.tracking.model_registry import (
    register_model_version,
    promote_model_to_production,
    sync_with_postgres_registry,
)
from ml.tracking.model_loader import ProductionModelLoader


@pytest.fixture(scope="module")
def tracking_env():
    """Create isolated SQLite MLflow tracking backend for testing."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmpdir:
        test_db = Path(tmpdir) / "test_mlruns.db"
        test_uri = f"sqlite:///{test_db}"
        setup_mlflow(test_uri)
        yield test_uri


def test_mlflow_configuration(tracking_env):
    assert get_tracking_uri() == tracking_env
    assert is_mlflow_enabled() is True


def test_experiment_creation(tracking_env):
    exp_id = get_or_create_experiment("Test-PriceMind-Experiment")
    assert exp_id is not None
    assert str(exp_id) != ""

    # Re-retrieval returns same ID
    exp_id_again = get_or_create_experiment("Test-PriceMind-Experiment")
    assert exp_id_again == exp_id


def test_run_logging_parameters_and_metrics(tracking_env):
    set_active_experiment("Test-PriceMind-Experiment")

    with mlflow.start_run(run_name="test_run") as run:
        run_id = run.info.run_id

        log_dataset_metadata("test_data.parquet", n_rows=1000, n_features=10)
        log_model_parameters("XGBoost", {"max_depth": 6, "learning_rate": 0.08})
        log_evaluation_metrics({"rmse": 2.5, "r2": 0.94, "mae": 1.8}, prefix="test")

        feat_names = [f"f_{i}" for i in range(10)]
        feat_imp = {f"f_{i}": 0.1 * i for i in range(10)}
        log_feature_artifacts(feat_names, feat_imp)

        y_act = np.array([10, 20, 30, 40])
        y_p = np.array([11, 19, 32, 38])
        log_evaluation_plots(y_act, y_p, model_name="TestModel")

    client = mlflow.tracking.MlflowClient()
    run_data = client.get_run(run_id).data

    assert "hp.max_depth" in run_data.params
    assert run_data.params["hp.max_depth"] == "6"
    assert "test_rmse" in run_data.metrics
    assert run_data.metrics["test_rmse"] == pytest.approx(2.5)
    assert run_data.tags["dataset.name"] == "test_data.parquet"


def test_model_registration_and_promotion(tracking_env):
    set_active_experiment("Test-PriceMind-Experiment")

    # Train dummy model and log
    X = np.random.randn(50, 4)
    y = X[:, 0] * 2 + np.random.randn(50) * 0.1
    model = xgb.XGBRegressor(n_estimators=10, max_depth=3)
    model.fit(X, y)

    with mlflow.start_run(run_name="test_model_run") as run:
        run_id = run.info.run_id
        mlflow.xgboost.log_model(model, artifact_path="model")

    # Register
    model_version = register_model_version(
        run_id=run_id,
        artifact_path="model",
        registered_model_name="Test-Registered-Model",
    )
    assert model_version.version is not None

    # Promote to production
    promote_model_to_production("Test-Registered-Model", model_version.version)


def test_production_model_loader_local_fallback():
    # Test local fallback when model registry name is not found
    loader = ProductionModelLoader(registered_model_name="NonExistentModel123XYZ")
    model, version, source = loader.load()

    assert model is not None
    assert source == "local_artifact"
    assert version == "v1"
    assert len(loader.feature_names) > 0


def test_sync_with_postgres_registry():
    from unittest.mock import MagicMock
    mock_session = MagicMock()

    sync_with_postgres_registry(
        db_session=mock_session,
        model_name="PriceMind-Demand-XGBoost",
        model_type="XGBRegressor",
        version="v1",
        metrics={"rmse": 2.87, "r2": 0.944},
        hyperparameters={"n_estimators": 150, "max_depth": 6},
        artifact_path="ml/artifacts/models/demand_model_production.joblib",
        status="production",
    )
    mock_session.commit.assert_called_once()
