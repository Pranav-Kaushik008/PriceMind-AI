"""
ml/tracking/model_loader.py
---------------------------
Unified model loader with MLflow Registry integration and local artifact fallback.
"""

from typing import Tuple, Any, List, Optional
from pathlib import Path
import logging

try:
    import joblib
except ImportError:
    joblib = None

try:
    import mlflow
except ImportError:
    mlflow = None

from ml.tracking.mlflow_config import setup_mlflow, is_mlflow_enabled

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parents[2]
LOCAL_MODEL_PATH = ROOT_DIR / "ml" / "artifacts" / "models" / "demand_model_production.joblib"


class ProductionModelLoader:
    """
    Loads production model either via MLflow Model Registry alias ('production')
    or via local joblib artifact fallback.
    """

    def __init__(
        self,
        registered_model_name: str = "PriceMind-Demand-Prediction",
        alias: str = "production",
        local_fallback_path: Optional[Path] = None,
    ):
        self.registered_model_name = registered_model_name
        self.alias = alias
        self.local_fallback_path = local_fallback_path or LOCAL_MODEL_PATH
        self._cached_model: Optional[Any] = None
        self._cached_version: str = "v1"
        self._cached_source: str = "unloaded"
        self._feature_names: List[str] = []

    def load(self, force_reload: bool = False) -> Tuple[Any, str, str]:
        """
        Load production model.
        Returns:
            (model_object, model_version, source_type)
        """
        if self._cached_model is not None and not force_reload:
            return self._cached_model, self._cached_version, self._cached_source

        # 1. Attempt MLflow registry load if enabled and available
        if is_mlflow_enabled() and mlflow:
            try:
                setup_mlflow()
                model_uri = f"models:/{self.registered_model_name}@{self.alias}"
                logger.info(f"[ModelLoader] Attempting to load from MLflow URI: {model_uri}")
                model = mlflow.pyfunc.load_model(model_uri)

                # Extract underlying sklearn/xgb model if possible
                if hasattr(model, "_model_impl"):
                    self._cached_model = model._model_impl
                else:
                    self._cached_model = model

                self._cached_version = "mlflow-prod"
                self._cached_source = "mlflow_registry"

                if hasattr(self._cached_model, "feature_names_in_"):
                    self._feature_names = list(self._cached_model.feature_names_in_)

                logger.info(f"[ModelLoader] Successfully loaded production model from MLflow registry")
                return self._cached_model, self._cached_version, self._cached_source
            except Exception as e:
                logger.warning(f"[ModelLoader] MLflow registry load failed ({e}). Falling back to local artifact.")

        # 2. Local artifact fallback
        if joblib and self.local_fallback_path.exists():
            try:
                logger.info(f"[ModelLoader] Loading local model artifact: {self.local_fallback_path}")
                self._cached_model = joblib.load(self.local_fallback_path)
                self._cached_version = "v1"
                self._cached_source = "local_artifact"

                if hasattr(self._cached_model, "feature_names_in_"):
                    self._feature_names = list(self._cached_model.feature_names_in_)

                return self._cached_model, self._cached_version, self._cached_source
            except Exception as e:
                logger.warning(f"[ModelLoader] Local joblib load error ({e}). Using heuristic model fallback.")

        # 3. Fallback dummy model if neither MLflow nor joblib succeeds
        class SimpleHeuristicModel:
            def predict(self, X):
                import numpy as np
                return np.full(len(X), 42.0)

        self._cached_model = SimpleHeuristicModel()
        self._cached_version = "heuristic-fallback"
        self._cached_source = "fallback"
        return self._cached_model, self._cached_version, self._cached_source

    @property
    def feature_names(self) -> List[str]:
        if not self._feature_names and self._cached_model is None:
            self.load()
        return self._feature_names
