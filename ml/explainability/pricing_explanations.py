"""
pricing_explanations.py
-----------------------
SHAP-based explanation for pricing scenario comparisons.

For each SKU, compare:
  - Current price scenario SHAP breakdown
  - Recommended price scenario SHAP breakdown

NOTE: This is a MODEL-BASED scenario explanation.
It does NOT imply causal effects. Results depend entirely on the
trained demand model's learned relationships.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional, List, Dict
import warnings

from ml.explainability.explainer import ShapExplainer
from ml.explainability.explanation_schema import FeatureContribution, PricingScenarioExplanation


class PricingExplainer:
    """
    Explains the model-based impact of a price change for a given SKU.

    Workflow:
      1. Load a representative feature row for the SKU from features.parquet
      2. Clone the row, swap 'price' column to recommended_price
      3. Run SHAP on both rows
      4. Compute delta in price SHAP and overall prediction shift
      5. Load elasticity from reports/elasticity_summary.csv
    """

    def __init__(
        self,
        shap_explainer: ShapExplainer,
        features_path: str = "data/processed/features.parquet",
        elasticity_path: str = "reports/elasticity_summary.csv",
        recommendations_path: str = "reports/pricing_recommendations.csv",
    ):
        self.shap_explainer = shap_explainer
        self.features_path = Path(features_path)
        self.elasticity_path = Path(elasticity_path)
        self.recommendations_path = Path(recommendations_path)

        # Lazy-loaded
        self._features_df: Optional[pd.DataFrame] = None
        self._elasticity_df: Optional[pd.DataFrame] = None
        self._recommendations_df: Optional[pd.DataFrame] = None

    def _load_features(self) -> pd.DataFrame:
        if self._features_df is None:
            self._features_df = pd.read_parquet(self.features_path)
        return self._features_df

    def _load_elasticity(self) -> pd.DataFrame:
        if self._elasticity_df is None:
            self._elasticity_df = pd.read_csv(self.elasticity_path)
        return self._elasticity_df

    def _load_recommendations(self) -> pd.DataFrame:
        if self._recommendations_df is None:
            self._recommendations_df = pd.read_csv(self.recommendations_path)
        return self._recommendations_df

    def _get_elasticity(self, sku_id: str) -> tuple:
        """Return (elasticity, reliability) for a SKU."""
        df = self._load_elasticity()
        # Try to match 'sku_id' or 'SKU' column
        id_col = "sku_id" if "sku_id" in df.columns else df.columns[0]
        row = df[df[id_col] == sku_id]
        if row.empty:
            return 0.0, "Unknown"
        elasticity_col = [c for c in df.columns if "elasticity" in c.lower()][0]
        reliability_col = [c for c in df.columns if "reliability" in c.lower() or "confidence" in c.lower()]
        reliability = row[reliability_col[0]].iloc[0] if reliability_col else "Unknown"
        return float(row[elasticity_col].iloc[0]), str(reliability)

    def _get_representative_row(self, sku_id: str) -> Optional[pd.DataFrame]:
        """Get the most recent feature row for the given SKU."""
        df = self._load_features()
        id_col = "sku_id" if "sku_id" in df.columns else None
        if id_col is None:
            return None
        sku_df = df[df[id_col] == sku_id].copy()
        if sku_df.empty:
            return None
        # Use the most recent row
        if "date" in sku_df.columns:
            sku_df = sku_df.sort_values("date")
        return sku_df.tail(1)

    def explain_price_scenario(
        self,
        sku_id: str,
        current_price: Optional[float] = None,
        recommended_price: Optional[float] = None,
        top_n: int = 10,
    ) -> Optional[PricingScenarioExplanation]:
        """
        Generate a model-based scenario explanation comparing current vs recommended price.

        If current_price / recommended_price not provided, loads from pricing_recommendations.csv.
        """
        # Load recommendations if prices not given
        rec_df = self._load_recommendations()
        id_col = "sku_id" if "sku_id" in rec_df.columns else rec_df.columns[0]
        rec_row = rec_df[rec_df[id_col] == sku_id]

        if rec_row.empty and (current_price is None or recommended_price is None):
            print(f"[PricingExplainer] No recommendation found for {sku_id}")
            return None

        if current_price is None:
            current_price_col = [c for c in rec_df.columns if "current_price" in c.lower()][0]
            current_price = float(rec_row[current_price_col].iloc[0])

        if recommended_price is None:
            rec_price_col = [c for c in rec_df.columns if "recommended_price" in c.lower()][0]
            recommended_price = float(rec_row[rec_price_col].iloc[0])

        # Load representative feature row
        base_row = self._get_representative_row(sku_id)
        if base_row is None:
            print(f"[PricingExplainer] No feature row found for {sku_id}")
            return None

        # Align to model features
        X_current = self.shap_explainer.align_features(base_row.copy())
        X_recommended = X_current.copy()

        # Swap price column
        if "price" in X_current.columns:
            X_current = X_current.copy()
            X_current["price"] = current_price
            X_recommended = X_recommended.copy()
            X_recommended["price"] = recommended_price

        # Compute SHAP for both scenarios
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            shap_current = self.shap_explainer.compute_shap_values(X_current)[0]
            shap_recommended = self.shap_explainer.compute_shap_values(X_recommended)[0]

        feature_names = self.shap_explainer.feature_names
        base_value = float(self.shap_explainer.base_value)

        # Predictions
        current_demand = base_value + float(np.sum(shap_current))
        recommended_demand = base_value + float(np.sum(shap_recommended))

        # Price SHAP values
        price_idx = list(feature_names).index("price") if "price" in feature_names else None
        current_price_shap = float(shap_current[price_idx]) if price_idx is not None else 0.0
        recommended_price_shap = float(shap_recommended[price_idx]) if price_idx is not None else 0.0

        # Build contributions
        def _make_contributions(shap_vals: np.ndarray, X_row: pd.DataFrame) -> List[FeatureContribution]:
            feats = []
            vals = X_row.iloc[0].tolist()
            for fname, fval, sval in zip(feature_names, vals, shap_vals):
                feats.append(FeatureContribution(
                    feature_name=fname,
                    feature_value=float(fval) if fval is not None else 0.0,
                    shap_value=float(sval),
                    direction="positive" if sval > 0 else "negative",
                ))
            return sorted(feats, key=lambda c: abs(c.shap_value), reverse=True)

        contribs_current = _make_contributions(shap_current, X_current)
        contribs_recommended = _make_contributions(shap_recommended, X_recommended)

        elasticity, reliability = self._get_elasticity(sku_id)

        return PricingScenarioExplanation(
            sku_id=sku_id,
            current_price=current_price,
            recommended_price=recommended_price,
            current_predicted_demand=current_demand,
            recommended_predicted_demand=recommended_demand,
            current_price_shap=current_price_shap,
            recommended_price_shap=recommended_price_shap,
            price_shap_delta=recommended_price_shap - current_price_shap,
            base_value=base_value,
            elasticity=elasticity,
            elasticity_reliability=reliability,
            top_drivers_current=contribs_current[:top_n],
            top_drivers_recommended=contribs_recommended[:top_n],
        )

    def explain_all_skus(
        self,
        sku_ids: Optional[List[str]] = None,
        top_n: int = 10,
    ) -> List[PricingScenarioExplanation]:
        """Generate pricing explanations for all (or specified) SKUs."""
        rec_df = self._load_recommendations()
        id_col = "sku_id" if "sku_id" in rec_df.columns else rec_df.columns[0]

        if sku_ids is None:
            sku_ids = rec_df[id_col].unique().tolist()

        results = []
        for sku_id in sku_ids:
            exp = self.explain_price_scenario(sku_id, top_n=top_n)
            if exp is not None:
                results.append(exp)
                print(f"[PricingExplainer] ✓ {sku_id}: "
                      f"price SHAP delta = {exp.price_shap_delta:+.4f}, "
                      f"demand Δ = {exp.recommended_predicted_demand - exp.current_predicted_demand:+.2f}")
        return results

    def to_dataframe(self, explanations: List[PricingScenarioExplanation]) -> pd.DataFrame:
        """Flatten pricing explanations to a summary DataFrame."""
        rows = []
        for exp in explanations:
            rows.append({
                "sku_id": exp.sku_id,
                "current_price": exp.current_price,
                "recommended_price": exp.recommended_price,
                "current_predicted_demand": exp.current_predicted_demand,
                "recommended_predicted_demand": exp.recommended_predicted_demand,
                "demand_change": exp.recommended_predicted_demand - exp.current_predicted_demand,
                "current_price_shap": exp.current_price_shap,
                "recommended_price_shap": exp.recommended_price_shap,
                "price_shap_delta": exp.price_shap_delta,
                "base_value": exp.base_value,
                "elasticity": exp.elasticity,
                "elasticity_reliability": exp.elasticity_reliability,
                "note": "Model-based scenario explanation — not causal",
                "generated_at": exp.generated_at,
            })
        return pd.DataFrame(rows)

    def save_report(
        self,
        explanations: List[PricingScenarioExplanation],
        output_path: str = "reports/shap_pricing_explanations.csv",
    ) -> Path:
        """Save pricing scenario explanations to CSV."""
        df = self.to_dataframe(explanations)
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out, index=False)
        print(f"[PricingExplainer] Saved {len(explanations)} pricing explanations → {out}")
        return out
