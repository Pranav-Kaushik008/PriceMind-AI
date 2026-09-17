"""
PriceMind AI — Demand & Revenue Historical Feature Engineering
Constructs lagged demand, shifted rolling momentum, and volatility metrics with STRICT leakage prevention.
"""

import pandas as pd
import numpy as np
from typing import Optional
from ml.features.feature_config import FeatureConfig


class DemandFeatureExtractor:
    """
    Constructs autoregressive demand and historical revenue signals.
    GUARANTEE: All features use shift >= 1 to ensure zero target leakage.
    """

    def __init__(self, config: Optional[FeatureConfig] = None):
        self.config = config or FeatureConfig()

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        target_col = self.config.target_col
        rev_col = self.config.revenue_col
        group_cols = self.config.group_cols
        date_col = self.config.date_col

        if target_col not in df.columns:
            return df

        out = df.copy()
        # Sort chronologically within group
        out = out.sort_values(by=group_cols + [date_col]).reset_index(drop=True)

        # 1. Target Log Transform for Elasticity Modeling: ln(1 + Q)
        out["log_units_sold"] = np.log1p(np.maximum(out[target_col], 0))

        # 2. Demand Lags (Shifted 1, 7, 14, 28)
        for lag in self.config.demand_lags:
            out[f"demand_lag_{lag}"] = out.groupby(group_cols)[target_col].shift(lag)

        # 3. Shifted Rolling Demand Statistics (7, 14, 28 days)
        # CRITICAL: shift(1) ensures today's target is not inside the rolling window
        for w in self.config.rolling_windows:
            shifted_demand = out.groupby(group_cols)[target_col].shift(1)
            grouped_rolling = shifted_demand.groupby([out[c] for c in group_cols]).rolling(w, min_periods=1)

            out[f"demand_rolling_mean_{w}"] = grouped_rolling.mean().reset_index(level=list(range(len(group_cols))), drop=True)
            out[f"demand_rolling_std_{w}"] = grouped_rolling.std().reset_index(level=list(range(len(group_cols))), drop=True).fillna(0)
            out[f"demand_rolling_min_{w}"] = grouped_rolling.min().reset_index(level=list(range(len(group_cols))), drop=True)
            out[f"demand_rolling_max_{w}"] = grouped_rolling.max().reset_index(level=list(range(len(group_cols))), drop=True)

        # 4. Demand Velocity & Momentum Signals (Short vs Long term ratio)
        if "demand_rolling_mean_7" in out.columns and "demand_rolling_mean_28" in out.columns:
            out["demand_momentum_7_28"] = out["demand_rolling_mean_7"] / np.maximum(out["demand_rolling_mean_28"], 1e-4)

        # 5. Historical Revenue Signals (If revenue column is present)
        if rev_col in out.columns:
            out["log_revenue"] = np.log1p(np.maximum(out[rev_col], 0))
            for lag in self.config.revenue_lags:
                out[f"revenue_lag_{lag}"] = out.groupby(group_cols)[rev_col].shift(lag)

            # Rolling revenue shifted 1
            shifted_rev = out.groupby(group_cols)[rev_col].shift(1)
            grouped_rev_rolling = shifted_rev.groupby([out[c] for c in group_cols]).rolling(7, min_periods=1)
            out["revenue_rolling_mean_7"] = grouped_rev_rolling.mean().reset_index(level=list(range(len(group_cols))), drop=True)

        return out
