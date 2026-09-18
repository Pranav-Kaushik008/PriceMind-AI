"""
PriceMind AI — Core SHAP Explainer Engine
Initializes TreeExplainer for production tree-based demand models and computes exact Shapley attributions.
"""

from typing import Optional, List, Tuple, Any, Dict
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import logging
import shap

logger = logging.getLogger(__name__)


class ShapExplainer:
    """
    Initializes and caches shap.TreeExplainer for the production demand prediction model.
    """

    def __init__(
        self,
        model: Optional[Any] = None,
        model_path: Optional[str] = None,
        feature_names: Optional[List[str]] = None,
    ):
        self.model = model
        self.model_path = (
            Path(model_path)
            if model_path
            else (
                Path(__file__).resolve().parents[2]
                / "ml"
                / "artifacts"
                / "models"
                / "demand_model_production.joblib"
            )
        )
        self.feature_names: List[str] = feature_names or []
        self.tree_explainer: Optional[shap.TreeExplainer] = None
        self.base_value: float = 0.0
        self.model_name: str = "XGBoost (XGBRegressor)"

    def load(self) -> "ShapExplainer":
        """Load model and initialize TreeExplainer. Call this explicitly or use __init__ directly."""
        if self.model is None:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model artifact not found at: {self.model_path}")
            self.model = joblib.load(self.model_path)
            self.model_name = type(self.model).__name__

        if hasattr(self.model, "feature_names_in_"):
            self.feature_names = list(self.model.feature_names_in_)

        try:
            self.tree_explainer = shap.TreeExplainer(self.model)
            ev = self.tree_explainer.expected_value
            self.base_value = float(np.atleast_1d(ev)[0])
            logger.info(
                f"TreeExplainer initialized. Base value E[f(X)] = {self.base_value:.4f}"
            )
        except Exception as e:
            logger.warning(f"TreeExplainer init note: {e}. Falling back to shap.Explainer.")
            self.tree_explainer = shap.Explainer(self.model)
            ev = self.tree_explainer.expected_value
            self.base_value = float(np.atleast_1d(ev)[0]) if ev is not None else 0.0

        return self

    def align_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Reorder / add / drop columns to match model's expected feature order.

        Missing features are filled with 0. Extra features are dropped.
        """
        if not self.feature_names:
            return X
        for col in self.feature_names:
            if col not in X.columns:
                X = X.copy()
                X[col] = 0.0
        return X[self.feature_names]

    def compute_shap_values(self, X: pd.DataFrame) -> np.ndarray:
        """
        Compute SHAP values for input X.

        Returns
        -------
        np.ndarray of shape (n_samples, n_features)
        """
        if self.tree_explainer is None:
            # Auto-load if not yet loaded
            self.load()

        X_eval = self.align_features(X)

        raw_shap = self.tree_explainer.shap_values(X_eval)

        if isinstance(raw_shap, list):
            shap_matrix = raw_shap[0]
        elif hasattr(raw_shap, "values"):
            shap_matrix = raw_shap.values
        else:
            shap_matrix = np.asarray(raw_shap)

        # Handle 3D output (multi-output models)
        if shap_matrix.ndim == 3:
            shap_matrix = shap_matrix[:, :, 0]

        return shap_matrix
