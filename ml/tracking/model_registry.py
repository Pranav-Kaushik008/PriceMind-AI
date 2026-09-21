"""
ml/tracking/model_registry.py
-----------------------------
Model Registry management with MLflow and PostgreSQL synchronization.
"""

from typing import Optional, Dict, Any, List
from pathlib import Path
import logging
import mlflow
from mlflow.tracking import MlflowClient

from ml.tracking.mlflow_config import setup_mlflow

logger = logging.getLogger(__name__)


def register_model_version(
    run_id: str,
    artifact_path: str = "model",
    registered_model_name: str = "PriceMind-Demand-Prediction",
    tags: Optional[Dict[str, str]] = None,
) -> Any:
    """
    Register a model from a completed MLflow run in the Model Registry.
    """
    setup_mlflow()
    model_uri = f"runs:/{run_id}/{artifact_path}"
    model_version = mlflow.register_model(
        model_uri=model_uri,
        name=registered_model_name,
        tags=tags or {"framework": "xgboost", "domain": "demand_prediction"},
    )
    logger.info(
        f"[ModelRegistry] Registered model '{registered_model_name}' version {model_version.version}"
    )
    return model_version


def promote_model_to_production(
    registered_model_name: str,
    version: str,
    archive_existing: bool = True,
) -> None:
    """
    Promote a specific model version to 'production' alias / tag.
    Uses modern MLflow model alias API (set_registered_model_alias).
    """
    setup_mlflow()
    client = MlflowClient()

    try:
        # Set 'production' alias on the target version
        client.set_registered_model_alias(
            name=registered_model_name,
            alias="production",
            version=str(version),
        )
        logger.info(
            f"[ModelRegistry] Promoted '{registered_model_name}' version {version} to alias 'production'"
        )
    except Exception as e:
        logger.warning(f"[ModelRegistry] Alias set failed ({e}), setting model version tag...")
        client.set_model_version_tag(
            name=registered_model_name,
            version=str(version),
            key="stage",
            value="production",
        )


def sync_with_postgres_registry(
    db_session,
    model_name: str,
    model_type: str,
    version: str,
    metrics: Dict[str, float],
    hyperparameters: Dict[str, Any],
    artifact_path: str,
    status: str = "production",
    feature_version: str = "v1",
):
    """
    Synchronize MLflow model metadata with Module 8 PostgreSQL ml_model_registry table.
    """
    if db_session is None:
        return

    from app.repositories.analytics_repo import save_model_metadata, get_model_metadata

    existing = get_model_metadata(db_session, model_name=model_name, version=version)
    if existing:
        existing.metrics = metrics
        existing.hyperparameters = hyperparameters
        existing.artifact_path = artifact_path
        existing.status = status
        db_session.flush()
    else:
        save_model_metadata(
            db_session,
            model_name=model_name,
            model_type=model_type,
            version=version,
            feature_version=feature_version,
            metrics=metrics,
            hyperparameters=hyperparameters,
            artifact_path=artifact_path,
            status=status,
        )
    db_session.commit()
    logger.info(f"[ModelRegistry] Synced metadata for '{model_name}' v{version} to database")
