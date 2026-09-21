"""
ml/tracking/__init__.py
-----------------------
MLflow Tracking and MLOps layer for PriceMind AI.
"""

from ml.tracking.mlflow_config import (
    setup_mlflow,
    get_tracking_uri,
    is_mlflow_enabled,
    EXPERIMENT_DEMAND_PREDICTION,
    EXPERIMENT_FORECASTING,
    EXPERIMENT_OPTIMIZATION,
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

__all__ = [
    "setup_mlflow",
    "get_tracking_uri",
    "is_mlflow_enabled",
    "EXPERIMENT_DEMAND_PREDICTION",
    "EXPERIMENT_FORECASTING",
    "EXPERIMENT_OPTIMIZATION",
    "get_or_create_experiment",
    "set_active_experiment",
    "log_dataset_metadata",
    "log_model_parameters",
    "log_evaluation_metrics",
    "log_feature_artifacts",
    "log_evaluation_plots",
    "register_model_version",
    "promote_model_to_production",
    "sync_with_postgres_registry",
    "ProductionModelLoader",
]
