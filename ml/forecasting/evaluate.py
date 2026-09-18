"""
PriceMind AI — Demand Forecast Evaluation Suite
Calculates MAE, RMSE, WAPE, MASE (Mean Absolute Scaled Error), prediction interval coverage, and demand bias.
"""

from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class ForecastEvaluator:
    """
    Evaluates point forecasts and prediction intervals using time-series specific accuracy metrics.
    """

    @staticmethod
    def calculate_metrics(
        y_true: np.ndarray | pd.Series,
        y_pred: np.ndarray | pd.Series,
        y_train_history: Optional[np.ndarray | pd.Series] = None,
        lower_bound: Optional[np.ndarray | pd.Series] = None,
        upper_bound: Optional[np.ndarray | pd.Series] = None,
        model_name: str = "Forecaster",
        sku_id: str = "ALL",
        horizon: int = 14,
        seasonal_period: int = 7,
    ) -> Dict[str, Any]:
        """
        Computes MAE, RMSE, WAPE, MASE, prediction interval coverage, and demand bias.
        """
        yt = np.asarray(y_true, dtype=float)
        yp = np.maximum(0.0, np.asarray(y_pred, dtype=float))

        n_steps = len(yt)
        if n_steps == 0:
            raise ValueError("Target array cannot be empty.")

        # 1. Standard Regression Metrics
        abs_errors = np.abs(yt - yp)
        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean((yt - yp) ** 2)))

        # 2. WAPE (Weighted Absolute Percentage Error)
        total_actual = float(np.sum(yt))
        total_pred = float(np.sum(yp))
        wape_pct = (float(np.sum(abs_errors)) / total_actual * 100.0) if total_actual > 0 else 0.0

        # 3. Safe MAPE (only on non-zero points)
        nonzero = yt > 0
        mape_pct = float(np.mean(abs_errors[nonzero] / yt[nonzero]) * 100.0) if np.any(nonzero) else np.nan

        # 4. MASE (Mean Absolute Scaled Error)
        # Scaled by in-sample seasonal naive 1-step error: mean(|y_t - y_{t-s}|)
        mase = None
        if y_train_history is not None:
            y_hist = np.asarray(y_train_history, dtype=float)
            s = seasonal_period if len(y_hist) > seasonal_period else 1
            if len(y_hist) > s:
                scale = float(np.mean(np.abs(y_hist[s:] - y_hist[:-s])))
                if scale > 0:
                    mase = round(mae / scale, 4)

        # 5. Prediction Interval Coverage
        coverage_pct = None
        if lower_bound is not None and upper_bound is not None:
            lb = np.asarray(lower_bound, dtype=float)
            ub = np.asarray(upper_bound, dtype=float)
            within_bounds = (yt >= lb) & (yt <= ub)
            coverage_pct = round(float(np.mean(within_bounds) * 100.0), 1)

        # 6. Demand Bias
        demand_bias = float(total_pred - total_actual)
        demand_bias_pct = (demand_bias / total_actual * 100.0) if total_actual > 0 else 0.0

        return {
            "model_name": model_name,
            "sku_id": sku_id,
            "horizon": horizon,
            "n_steps": n_steps,
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "wape_pct": round(wape_pct, 2),
            "mape_pct": round(mape_pct, 2) if not np.isnan(mape_pct) else None,
            "mase": mase,
            "interval_coverage_pct": coverage_pct,
            "total_actual_demand": round(total_actual, 1),
            "total_forecast_demand": round(total_pred, 1),
            "demand_bias": round(demand_bias, 1),
            "demand_bias_pct": round(demand_bias_pct, 2),
        }
