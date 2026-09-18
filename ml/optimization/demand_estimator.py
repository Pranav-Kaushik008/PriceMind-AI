"""
PriceMind AI — Optimization Demand Estimator
Bridges candidate price variations to the trained machine learning demand model and econometric elasticity functions.
"""

from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import logging

from ml.models.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class OptimizationDemandEstimator:
    """
    Evaluates ML demand response curves and econometric elasticity projections for candidate prices.
    """

    def __init__(
        self,
        model_artifact_path: Optional[str | Path] = None,
        elasticity_report_path: Optional[str | Path] = None,
    ):
        project_root = Path(__file__).resolve().parents[2]
        self.model_path = Path(model_artifact_path) if model_artifact_path else (project_root / "ml" / "artifacts" / "models" / "demand_model_production.joblib")
        self.elasticity_path = Path(elasticity_report_path) if elasticity_report_path else (project_root / "reports" / "elasticity_summary.csv")

        self.model = None
        self.feature_names: List[str] = []
        self.elasticities: Dict[str, Dict[str, Any]] = {}
        self._load_artifacts()

    def _load_artifacts(self):
        # 1. Load ML Model
        if self.model_path.exists():
            self.model = joblib.load(self.model_path)
            # Try to get feature names
            if hasattr(self.model, "feature_names_in_"):
                self.feature_names = list(self.model.feature_names_in_)
        else:
            logger.warning(f"Production demand model not found at: {self.model_path}")

        # 2. Load Elasticities
        if self.elasticity_path.exists():
            df_e = pd.read_csv(self.elasticity_path)
            for _, row in df_e.iterrows():
                self.elasticities[row["sku_id"]] = {
                    "elasticity": float(row["elasticity"]) if not pd.isna(row["elasticity"]) else -1.0,
                    "reliability": str(row["reliability"]),
                    "p_value": float(row["p_value"]) if not pd.isna(row.get("p_value")) else 1.0,
                }

    def predict_demand_for_candidates(
        self,
        base_feature_row: pd.Series | pd.DataFrame,
        candidate_prices: np.ndarray | List[float],
        cost_price: Optional[float] = None,
        competitor_price: Optional[float] = None,
    ) -> np.ndarray:
        """
        Generates vectorized demand predictions for an array of candidate prices
        while preserving all surrounding temporal, lag, and inventory context.
        """
        if self.model is None:
            raise RuntimeError("Demand model is not loaded in OptimizationDemandEstimator.")

        if isinstance(base_feature_row, pd.DataFrame):
            row_dict = base_feature_row.iloc[0].to_dict()
        else:
            row_dict = base_feature_row.to_dict()

        prices = np.asarray(candidate_prices, dtype=float)
        n = len(prices)

        # Build batch feature matrix
        batch_records = []
        cp = competitor_price if competitor_price is not None else row_dict.get("competitor_price", 100.0)
        c = cost_price if cost_price is not None else row_dict.get("cost_price", 50.0)
        is_promo = int(row_dict.get("is_promotion", 0))

        for p in prices:
            rec = dict(row_dict)
            rec["price"] = p
            rec["log_price"] = np.log(p) if p > 0 else 0.0
            if cp > 0:
                rec["competitor_price"] = cp
                rec["log_competitor_price"] = np.log(cp)
                rec["competitor_spread_pct"] = ((p - cp) / cp) * 100.0
                rec["competitor_price_diff"] = p - cp
                rec["competitor_price_ratio"] = p / cp
                rec["is_undercut_by_competitor"] = int(cp < p)
            if c > 0:
                rec["cost_price"] = c
                rec["log_cost_price"] = np.log(c)
                rec["unit_gross_margin_dollar"] = p - c
                rec["unit_gross_margin_pct"] = ((p - c) / p) * 100.0 if p > 0 else 0.0
                rec["price_to_cost_markup"] = p / c

            rec["promo_price_interaction"] = is_promo * (np.log(p) if p > 0 else 0.0)

            # Price delta vs lag 1
            if "price_lag_1" in rec and rec["price_lag_1"] > 0:
                rec["price_change_1d"] = p - rec["price_lag_1"]
                rec["price_pct_change_1d"] = ((p - rec["price_lag_1"]) / rec["price_lag_1"]) * 100.0

            batch_records.append(rec)

        batch_df = pd.DataFrame(batch_records)

        # Align with model's expected feature columns
        if self.feature_names:
            available_cols = [col for col in self.feature_names if col in batch_df.columns]
            missing_cols = [col for col in self.feature_names if col not in batch_df.columns]
            for mc in missing_cols:
                batch_df[mc] = 0.0
            eval_X = batch_df[self.feature_names]
        else:
            # Fallback to numeric columns
            exclude = {"date", "sku_id", "sku_name", "category", "store_id", "units_sold", "log_units_sold", "revenue", "log_revenue"}
            num_cols = [c for c in batch_df.columns if c not in exclude and pd.api.types.is_numeric_dtype(batch_df[c])]
            eval_X = batch_df[num_cols]

        preds = self.model.predict(eval_X)
        return np.maximum(0.0, np.round(preds, 2))

    def get_elasticity_info(self, sku_id: str) -> Dict[str, Any]:
        """Returns empirical price elasticity metadata for a SKU."""
        return self.elasticities.get(
            sku_id,
            {"elasticity": -1.0, "reliability": "Insufficient Data", "p_value": 1.0}
        )
