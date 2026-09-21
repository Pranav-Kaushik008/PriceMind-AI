"""
ml/tracking/experiment.py
-------------------------
Experiment management utilities.
"""

from typing import Optional
import logging
import mlflow
from mlflow.entities import Experiment

from ml.tracking.mlflow_config import (
    setup_mlflow,
    EXPERIMENT_DEMAND_PREDICTION,
    EXPERIMENT_FORECASTING,
    EXPERIMENT_OPTIMIZATION,
)

logger = logging.getLogger(__name__)


def get_or_create_experiment(
    experiment_name: str,
    artifact_location: Optional[str] = None,
) -> str:
    """
    Retrieve existing experiment ID or create a new experiment.
    """
    setup_mlflow()
    client = mlflow.tracking.MlflowClient()
    exp = client.get_experiment_by_name(experiment_name)

    if exp is None:
        try:
            exp_id = client.create_experiment(
                name=experiment_name,
                artifact_location=artifact_location,
                tags={"project": "PriceMind-AI", "layer": "MLOps"},
            )
            logger.info(f"[ExperimentManager] Created experiment '{experiment_name}' (ID: {exp_id})")
            return exp_id
        except Exception:
            exp = client.get_experiment_by_name(experiment_name)
            return exp.experiment_id if exp else "0"
    else:
        return exp.experiment_id


def set_active_experiment(experiment_name: str) -> str:
    """Set active MLflow experiment by name and return experiment ID."""
    exp_id = get_or_create_experiment(experiment_name)
    mlflow.set_experiment(experiment_name)
    return exp_id
