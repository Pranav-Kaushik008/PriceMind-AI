"""
local_explanations.py
---------------------
Compute per-prediction (local) SHAP explanations.

NOTE: SHAP values reflect model input-output relationships.
They do NOT imply causality or real-world effect sizes.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional, List
import warnings

from ml.explainability.explainer import ShapExplainer
from ml.explainability.explanation_schema import FeatureContribution, LocalExplanation


class LocalExplainer:
    """
    Generates per-row SHAP explanations for demand predictions.
    """

    ADDITIVE_TOLERANCE = 0.05  # |base + sum(shap) - prediction| must be < this

    def __init__(self, shap_explainer: ShapExplainer):
        self.shap_explainer = shap_explainer

    def explain_prediction(
        self,
        X_row: pd.DataFrame,
        top_n: int = 10,
        row_index: int = 0,
    ) -> LocalExplanation:
        """
        Explain a single prediction row.

        Parameters
        ----------
        X_row : pd.DataFrame, shape (1, n_features) or (n, n_features)
            Feature row(s). Only the first row is explained unless row_index specified.
        top_n : int
            Number of top contributors to return (each for positive and negative).
        row_index : int
            Which row in X_row to explain (default 0).

        Returns
        -------
        LocalExplanation dataclass
        """
        X_aligned = self.shap_explainer.align_features(X_row)
        single_row = X_aligned.iloc[[row_index]]

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            shap_vals = self.shap_explainer.compute_shap_values(single_row)

        base_value = float(self.shap_explainer.base_value)
        shap_row = shap_vals[0]  # shape: (n_features,)
        feature_names = self.shap_explainer.feature_names
        feature_values = single_row.iloc[0].tolist()

        # Model prediction (additive decomposition)
        predicted_value = base_value + float(np.sum(shap_row))

        # Validate additive consistency
        model_pred = float(
            self.shap_explainer.model.predict(single_row)[0]
        )
        delta = abs(predicted_value - model_pred)
        additive_consistent = delta < self.ADDITIVE_TOLERANCE

        # Build contributions
        contributions: List[FeatureContribution] = []
        for fname, fval, sval in zip(feature_names, feature_values, shap_row):
            contributions.append(
                FeatureContribution(
                    feature_name=fname,
                    feature_value=float(fval) if fval is not None else 0.0,
                    shap_value=float(sval),
                    direction="positive" if sval > 0 else "negative",
                )
            )

        # Sort by |shap|
        contributions_sorted = sorted(
            contributions, key=lambda c: abs(c.shap_value), reverse=True
        )
        top_positive = [c for c in contributions_sorted if c.shap_value > 0][:top_n]
        top_negative = [c for c in contributions_sorted if c.shap_value < 0][:top_n]

        return LocalExplanation(
            row_index=row_index,
            base_value=base_value,
            predicted_value=predicted_value,
            model_prediction=model_pred,
            additive_consistent=additive_consistent,
            all_contributions=contributions_sorted,
            top_positive_contributors=top_positive,
            top_negative_contributors=top_negative,
        )

    def explain_batch(
        self,
        X: pd.DataFrame,
        top_n: int = 10,
        max_rows: int = 200,
    ) -> List[LocalExplanation]:
        """Explain multiple rows (up to max_rows)."""
        X_use = X.head(max_rows)
        explanations = []
        for i in range(len(X_use)):
            exp = self.explain_prediction(X_use, top_n=top_n, row_index=i)
            explanations.append(exp)
        return explanations

    def to_dataframe(self, explanations: List[LocalExplanation]) -> pd.DataFrame:
        """Flatten a list of LocalExplanations to a DataFrame (top contributors only)."""
        rows = []
        for exp in explanations:
            for contrib in exp.top_positive_contributors + exp.top_negative_contributors:
                rows.append({
                    "row_index": exp.row_index,
                    "base_value": exp.base_value,
                    "predicted_value": exp.predicted_value,
                    "model_prediction": exp.model_prediction,
                    "additive_consistent": exp.additive_consistent,
                    "feature_name": contrib.feature_name,
                    "feature_value": contrib.feature_value,
                    "shap_value": contrib.shap_value,
                    "direction": contrib.direction,
                })
        return pd.DataFrame(rows)

    def save_report(
        self,
        explanations: List[LocalExplanation],
        output_path: str = "reports/shap_local_explanations.csv",
    ) -> Path:
        """Save local explanations to CSV."""
        df = self.to_dataframe(explanations)
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out, index=False)
        print(f"[LocalExplainer] Saved {len(explanations)} local explanations → {out}")
        return out
