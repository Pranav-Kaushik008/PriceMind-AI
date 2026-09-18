"""
PriceMind AI — Time-Series Demand Diagnostics & Decomposition
Performs seasonality testing, trend identification, volatility scoring, and horizon error profiling.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from scipy import stats
import logging

logger = logging.getLogger(__name__)


class ForecastDiagnostics:
    """
    Time-series diagnostics evaluating trend significance, day-of-week seasonality,
    demand volatility, and error degradation across forecast horizons.
    """

    @staticmethod
    def analyze_seasonality(
        df: pd.DataFrame,
        date_col: str = "date",
        demand_col: str = "units_sold",
    ) -> Dict[str, Any]:
        """
        Calculates day-of-week demand patterns and conducts ANOVA F-test for weekly seasonality.
        """
        df_temp = df.copy()
        df_temp[date_col] = pd.to_datetime(df_temp[date_col])
        df_temp["dow"] = df_temp[date_col].dt.day_name()
        df_temp["dow_num"] = df_temp[date_col].dt.dayofweek

        dow_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        dow_stats = df_temp.groupby("dow")[demand_col].agg(["mean", "std", "count"]).reindex(dow_order)

        # One-way ANOVA across days of week
        groups = [grp[demand_col].dropna().values for _, grp in df_temp.groupby("dow_num")]
        if len(groups) == 7 and all(len(g) > 1 for g in groups):
            f_stat, p_val = stats.f_oneway(*groups)
            has_weekly_seasonality = bool(p_val < 0.05)
        else:
            f_stat, p_val = np.nan, np.nan
            has_weekly_seasonality = False

        return {
            "has_weekly_seasonality": has_weekly_seasonality,
            "anova_f_stat": round(float(f_stat), 4) if not np.isnan(f_stat) else None,
            "anova_p_val": round(float(p_val), 6) if not np.isnan(p_val) else None,
            "dow_means": {dow: round(float(dow_stats.loc[dow, "mean"]), 2) for dow in dow_order if dow in dow_stats.index},
        }

    @staticmethod
    def analyze_trend(
        df: pd.DataFrame,
        date_col: str = "date",
        demand_col: str = "units_sold",
    ) -> Dict[str, Any]:
        """
        Estimates linear trend slope, statistical significance, and volatility (CV%).
        """
        df_sorted = df.sort_values(date_col).copy()
        y = df_sorted[demand_col].values
        n = len(y)
        if n < 5:
            return {"trend_status": "INSUFFICIENT_DATA"}

        x = np.arange(n)
        slope, intercept, r_val, p_val, std_err = stats.linregress(x, y)

        mean_val = float(np.mean(y))
        std_val = float(np.std(y, ddof=1)) if n > 1 else 0.0
        cv_pct = (std_val / mean_val * 100.0) if mean_val > 0 else 0.0

        if p_val < 0.05:
            trend_status = "UPWARD" if slope > 0 else "DOWNWARD"
        else:
            trend_status = "STABLE"

        return {
            "trend_status": trend_status,
            "slope_per_day": round(float(slope), 4),
            "r_squared": round(float(r_val ** 2), 4),
            "p_value": round(float(p_val), 6),
            "mean_daily_demand": round(mean_val, 2),
            "std_daily_demand": round(std_val, 2),
            "volatility_cv_pct": round(cv_pct, 2),
        }

    @staticmethod
    def evaluate_horizon_degradation(
        actuals: np.ndarray,
        forecasts: np.ndarray,
    ) -> pd.DataFrame:
        """
        Computes absolute error progression step-by-step from h=1 to h=H.
        """
        yt = np.asarray(actuals, dtype=float)
        yp = np.asarray(forecasts, dtype=float)
        horizon = min(len(yt), len(yp))

        rows = []
        for h in range(horizon):
            abs_err = abs(yt[h] - yp[h])
            sq_err = (yt[h] - yp[h]) ** 2
            rows.append({
                "horizon_step": h + 1,
                "actual": round(float(yt[h]), 2),
                "forecast": round(float(yp[h]), 2),
                "abs_error": round(float(abs_err), 2),
                "squared_error": round(float(sq_err), 2),
            })

        return pd.DataFrame(rows)
