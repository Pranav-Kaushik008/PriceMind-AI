"""
PriceMind AI — Time-Series Forecasting Data Preparation
Detects series frequency, guarantees continuity, handles missing dates, and partitions horizons.
"""

from typing import Tuple, List, Optional, Dict, Any
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class TimeSeriesPreparer:
    """
    Validates time-series integrity, enforces calendar continuity,
    checks data frequency, and prepares SKU-level forecasting partitions.
    """

    MIN_HISTORY_OBSERVATIONS: int = 30  # Minimum days required for reliable forecasting

    @staticmethod
    def detect_frequency(dates: pd.Series | pd.DatetimeIndex) -> str:
        """
        Infers the dominant time-series frequency (e.g., 'D' for Daily, 'W' for Weekly).
        """
        sorted_dates = pd.to_datetime(dates).drop_duplicates().sort_values()
        if len(sorted_dates) < 2:
            return "UNKNOWN"

        inferred = pd.infer_freq(sorted_dates)
        if inferred:
            return inferred

        # Fallback to median diff
        diffs = sorted_dates.diff().dropna()
        median_days = diffs.dt.total_seconds().median() / 86400.0

        if np.isclose(median_days, 1.0, atol=0.1):
            return "D"
        elif np.isclose(median_days, 7.0, atol=0.5):
            return "W"
        elif np.isclose(median_days, 30.0, atol=3.0):
            return "M"
        return f"{int(round(median_days))}D"

    @classmethod
    def prepare_sku_series(
        cls,
        df: pd.DataFrame,
        sku_id: str,
        date_col: str = "date",
        demand_col: str = "units_sold",
        price_col: str = "price",
        group_cols: Optional[List[str]] = None,
        aggregate_stores: bool = True,
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Prepares a complete, contiguous time series for a single SKU.
        If aggregate_stores is True, sums units_sold and averages price across stores per day.
        """
        if date_col not in df.columns or demand_col not in df.columns:
            raise ValueError(f"Required columns '{date_col}' or '{demand_col}' not in dataset.")

        sku_sub = df[df["sku_id"] == sku_id].copy()
        if len(sku_sub) == 0:
            return pd.DataFrame(), {
                "sku_id": sku_id,
                "status": "MISSING_DATA",
                "reason": f"SKU {sku_id} not found in dataset.",
                "n_obs": 0,
            }

        sku_sub[date_col] = pd.to_datetime(sku_sub[date_col])

        if aggregate_stores:
            # Aggregate store telemetry to daily SKU level
            agg_dict = {demand_col: "sum"}
            if price_col in sku_sub.columns:
                agg_dict[price_col] = "mean"
            if "competitor_price" in sku_sub.columns:
                agg_dict["competitor_price"] = "mean"
            if "is_promotion" in sku_sub.columns:
                agg_dict["is_promotion"] = "max"
            if "category" in sku_sub.columns:
                agg_dict["category"] = "first"
            if "sku_name" in sku_sub.columns:
                agg_dict["sku_name"] = "first"

            daily_df = sku_sub.groupby(date_col).agg(agg_dict).reset_index()
        else:
            daily_df = sku_sub.sort_values(date_col).reset_index(drop=True)

        # Check chronological continuity
        daily_df = daily_df.sort_values(date_col).reset_index(drop=True)
        min_date = daily_df[date_col].min()
        max_date = daily_df[date_col].max()
        full_idx = pd.date_range(start=min_date, end=max_date, freq="D", name=date_col)

        daily_df = daily_df.set_index(date_col).reindex(full_idx).reset_index()
        daily_df["sku_id"] = sku_id

        # Forward fill product metadata if present
        for col in ["category", "sku_name"]:
            if col in daily_df.columns:
                daily_df[col] = daily_df[col].ffill().bfill()

        # For demand, missing dates represent true zero demand periods
        daily_df[demand_col] = daily_df[demand_col].fillna(0.0)

        # For price/competitor, forward fill then backward fill
        for col in [price_col, "competitor_price"]:
            if col in daily_df.columns:
                daily_df[col] = daily_df[col].ffill().bfill()

        if "is_promotion" in daily_df.columns:
            daily_df["is_promotion"] = daily_df["is_promotion"].fillna(0).astype(int)

        n_obs = len(daily_df)
        if n_obs < cls.MIN_HISTORY_OBSERVATIONS:
            return daily_df, {
                "sku_id": sku_id,
                "status": "INSUFFICIENT_HISTORY",
                "reason": f"Only {n_obs} observations available (minimum {cls.MIN_HISTORY_OBSERVATIONS} required).",
                "n_obs": n_obs,
            }

        return daily_df, {
            "sku_id": sku_id,
            "status": "READY",
            "n_obs": n_obs,
            "start_date": str(min_date.date()),
            "end_date": str(max_date.date()),
            "frequency": "D",
        }

    @staticmethod
    def train_test_forecast_split(
        df: pd.DataFrame,
        horizon: int = 14,
        date_col: str = "date",
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Splits single SKU series into Historical Training window and Held-out Evaluation Forecast horizon.
        """
        if len(df) <= horizon:
            raise ValueError(
                f"Series length ({len(df)}) must exceed forecast horizon ({horizon})."
            )
        sorted_df = df.sort_values(date_col).reset_index(drop=True)
        train_df = sorted_df.iloc[:-horizon].copy()
        test_df = sorted_df.iloc[-horizon:].copy()
        return train_df, test_df
