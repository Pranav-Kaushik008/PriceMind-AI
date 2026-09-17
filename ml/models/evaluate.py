"""
PriceMind AI — Demand Model Evaluation Suite
Computes statistical, business, and diagnostic metrics for regression demand models.
"""

from typing import Dict, Any, List, Optional
import time
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import logging

logger = logging.getLogger(__name__)


class ModelEvaluator:
    """
    Comprehensive evaluator computing statistical metrics (MAE, RMSE, R²),
    business metrics (WAPE, Demand Bias, Aggregate Volume), and residual diagnostics.
    """

    @staticmethod
    def calculate_metrics(
        y_true: np.ndarray | pd.Series,
        y_pred: np.ndarray | pd.Series,
        model_name: str = "Model",
        train_time_sec: float = 0.0,
        inference_time_ms: float = 0.0,
        split_name: str = "test",
        n_features: int = 0,
    ) -> Dict[str, Any]:
        """
        Calculates MAE, RMSE, R², WAPE, safe MAPE, demand bias, and latency.
        """
        y_t = np.asarray(y_true, dtype=float)
        y_p = np.asarray(y_pred, dtype=float)

        # Enforce non-negative demand predictions
        y_p = np.maximum(0.0, y_p)

        n_samples = len(y_t)
        if n_samples == 0:
            raise ValueError("Cannot calculate evaluation metrics on empty target array.")

        # 1. Standard Regression Metrics
        mae = float(mean_absolute_error(y_t, y_p))
        rmse = float(np.sqrt(mean_squared_error(y_t, y_p)))
        r2 = float(r2_score(y_t, y_p))

        # 2. WAPE (Weighted Absolute Percentage Error) — robust to zero-demand
        total_actual = float(np.sum(y_t))
        total_pred = float(np.sum(y_p))
        total_abs_error = float(np.sum(np.abs(y_t - y_p)))
        wape_pct = (total_abs_error / total_actual * 100.0) if total_actual > 0 else 0.0

        # 3. MAPE — computed only on non-zero actuals
        nonzero_mask = y_t > 0
        if np.any(nonzero_mask):
            mape_pct = float(np.mean(np.abs((y_t[nonzero_mask] - y_p[nonzero_mask]) / y_t[nonzero_mask])) * 100.0)
            mape_coverage_pct = float(np.mean(nonzero_mask) * 100.0)
        else:
            mape_pct = np.nan
            mape_coverage_pct = 0.0

        # 4. Business & Bias Metrics
        demand_bias = float(total_pred - total_actual)
        demand_bias_pct = (demand_bias / total_actual * 100.0) if total_actual > 0 else 0.0

        return {
            "model_name": model_name,
            "split": split_name,
            "n_samples": n_samples,
            "n_features": n_features,
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "wape_pct": round(wape_pct, 2),
            "mape_pct": round(mape_pct, 2) if not np.isnan(mape_pct) else None,
            "mape_coverage_pct": round(mape_coverage_pct, 1),
            "total_actual_demand": round(total_actual, 1),
            "total_predicted_demand": round(total_pred, 1),
            "demand_bias": round(demand_bias, 1),
            "demand_bias_pct": round(demand_bias_pct, 2),
            "train_time_sec": round(train_time_sec, 4),
            "inference_time_ms": round(inference_time_ms, 2),
        }

    @staticmethod
    def extract_feature_importance(
        model: Any,
        feature_names: List[str],
        top_n: int = 20,
    ) -> pd.DataFrame:
        """
        Extracts feature importance weights for tree-based estimators.
        """
        importances = None
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_)

        if importances is None or len(importances) != len(feature_names):
            return pd.DataFrame()

        df_imp = pd.DataFrame({
            "feature": feature_names,
            "importance": importances,
        }).sort_values("importance", ascending=False).reset_index(drop=True)

        # Normalize to percentage sum
        total = df_imp["importance"].sum()
        if total > 0:
            df_imp["importance_pct"] = round((df_imp["importance"] / total) * 100.0, 2)
        else:
            df_imp["importance_pct"] = 0.0

        return df_imp.head(top_n)

    @staticmethod
    def analyze_residuals(
        df_eval: pd.DataFrame,
        actual_col: str = "units_sold",
        pred_col: str = "predicted_units",
    ) -> Dict[str, Any]:
        """
        Calculates residual distributions and grouped error metrics.
        """
        df = df_eval.copy()
        df["residual"] = df[actual_col] - df[pred_col]
        df["abs_error"] = np.abs(df["residual"])

        res_mean = float(df["residual"].mean())
        res_std = float(df["residual"].std())
        res_q25 = float(df["residual"].quantile(0.25))
        res_median = float(df["residual"].median())
        res_q75 = float(df["residual"].quantile(0.75))

        # SKU error breakdown
        sku_errors = []
        if "sku_id" in df.columns:
            for sku, grp in df.groupby("sku_id"):
                sku_errors.append({
                    "sku_id": sku,
                    "n_obs": len(grp),
                    "mae": round(float(grp["abs_error"].mean()), 3),
                    "rmse": round(float(np.sqrt(np.mean(grp["residual"] ** 2))), 3),
                    "bias": round(float((grp[pred_col].sum() - grp[actual_col].sum())), 1),
                })

        return {
            "residual_mean": round(res_mean, 4),
            "residual_std": round(res_std, 4),
            "residual_q25": round(res_q25, 4),
            "residual_median": round(res_median, 4),
            "residual_q75": round(res_q75, 4),
            "sku_error_breakdown": pd.DataFrame(sku_errors),
        }
