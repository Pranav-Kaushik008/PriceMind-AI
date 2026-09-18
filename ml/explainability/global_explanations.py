"""
global_explanations.py
----------------------
Compute global feature contribution magnitudes via SHAP.

NOTE: SHAP values reflect model input-output relationships.
They do NOT imply causality or real-world effect sizes.
Label as "Model feature contribution magnitude" in all outputs.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional
import warnings

from ml.explainability.explainer import ShapExplainer


class GlobalExplainer:
    """
    Computes global feature importance as mean |SHAP| across a sample.
    """

    def __init__(self, shap_explainer: ShapExplainer, max_samples: int = 500):
        self.shap_explainer = shap_explainer
        self.max_samples = max_samples

    def compute_global_importance(
        self,
        X_sample: pd.DataFrame,
        max_samples: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Compute mean absolute SHAP value per feature.

        Returns
        -------
        pd.DataFrame with columns:
            feature, mean_abs_shap, std_abs_shap, rank
        """
        limit = max_samples or self.max_samples

        if len(X_sample) > limit:
            X_sample = X_sample.sample(n=limit, random_state=42)

        # Align columns to model feature order
        X_aligned = self.shap_explainer.align_features(X_sample)

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            shap_vals = self.shap_explainer.compute_shap_values(X_aligned)

        # shap_vals shape: (n_samples, n_features)
        feature_names = self.shap_explainer.feature_names

        abs_shap = np.abs(shap_vals)
        mean_abs = abs_shap.mean(axis=0)
        std_abs = abs_shap.std(axis=0)

        df = pd.DataFrame({
            "feature": feature_names,
            "mean_abs_shap": mean_abs,
            "std_abs_shap": std_abs,
        })
        df = df.sort_values("mean_abs_shap", ascending=False).reset_index(drop=True)
        df["rank"] = df.index + 1
        df["note"] = "Model feature contribution magnitude — not causal"

        return df

    def save_report(
        self,
        df: pd.DataFrame,
        output_path: str = "reports/shap_global_importance.csv",
    ) -> Path:
        """Save global importance report to CSV."""
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out, index=False)
        print(f"[GlobalExplainer] Saved global importance → {out}")
        return out

    def top_features(self, df: pd.DataFrame, n: int = 20) -> pd.DataFrame:
        """Return top-N features by mean |SHAP|."""
        return df.head(n).copy()
