"""
ml/tracking/mlflow_config.py
----------------------------
Centralized MLflow tracking configuration for PriceMind AI.
Reads tracking URI, experiment names, and environment flags from environment variables.
"""

import os
from pathlib import Path
import logging
import mlflow

logger = logging.getLogger(__name__)

# Default local tracking URI: SQLite file or local directory
ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_LOCAL_TRACKING_URI = f"sqlite:///{ROOT_DIR / 'mlruns.db'}"

MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", DEFAULT_LOCAL_TRACKING_URI)
MLFLOW_ENABLED = os.getenv("MLFLOW_ENABLED", "true").lower() in ("true", "1", "yes")

# Standardized experiment names
EXPERIMENT_DEMAND_PREDICTION = os.getenv(
    "MLFLOW_EXPERIMENT_DEMAND", "PriceMind-Demand-Prediction"
)
EXPERIMENT_FORECASTING = os.getenv(
    "MLFLOW_EXPERIMENT_FORECAST", "PriceMind-Forecasting"
)
EXPERIMENT_OPTIMIZATION = os.getenv(
    "MLFLOW_EXPERIMENT_OPTIMIZATION", "PriceMind-Optimization"
)


def get_tracking_uri() -> str:
    """Return active MLflow tracking URI."""
    active_uri = mlflow.get_tracking_uri()
    if active_uri:
        return active_uri
    return os.getenv("MLFLOW_TRACKING_URI", DEFAULT_LOCAL_TRACKING_URI)


def is_mlflow_enabled() -> bool:
    """Return whether MLflow tracking is enabled."""
    return MLFLOW_ENABLED


def setup_mlflow(tracking_uri: str = None) -> str:
    """
    Initialize MLflow tracking URI and verify connectivity.
    """
    uri = tracking_uri or os.getenv("MLFLOW_TRACKING_URI", DEFAULT_LOCAL_TRACKING_URI)
    mlflow.set_tracking_uri(uri)
    logger.info(f"[MLflowConfig] Tracking URI set to: {uri}")
    return uri
