"""
PriceMind AI — Inventory & Supply Constraint Feature Engineering
Extracts stock runway proxies, inventory velocity depletion, and stockout vulnerability indicators.
"""

import pandas as pd
import numpy as np
from typing import Optional
from ml.features.feature_config import FeatureConfig


class InventoryFeatureExtractor:
    """
    Constructs inventory runway proxies and stockout risk indicators without data leakage.
    """

    def __init__(self, config: Optional[FeatureConfig] = None):
        self.config = config or FeatureConfig()

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        inv_col = self.config.inventory_col
        group_cols = self.config.group_cols
        date_col = self.config.date_col

        if inv_col not in df.columns:
            return df

        out = df.copy()
        # Sort chronologically within group
        out = out.sort_values(by=group_cols + [date_col]).reset_index(drop=True)

        # 1. Inventory Lags & Depletion Shifts
        for lag in self.config.inventory_lags:
            out[f"inventory_lag_{lag}"] = out.groupby(group_cols)[inv_col].shift(lag)

        # 2. Daily Inventory Change (Burn / Restock)
        prev_inv = out.groupby(group_cols)[inv_col].shift(1)
        out["inventory_change_1d"] = out[inv_col] - prev_inv

        # 3. Days of Inventory Runway Proxy (Inventory / Rolling Demand Mean)
        if "demand_rolling_mean_7" in out.columns:
            demand_benchmark = np.maximum(out["demand_rolling_mean_7"], 1.0)
            out["days_of_supply_proxy"] = out[inv_col] / demand_benchmark
            out["is_stockout_risk_flag"] = (out["days_of_supply_proxy"] < 15.0).astype(int)
            out["is_excess_stock_flag"] = (out["days_of_supply_proxy"] > 60.0).astype(int)

        # 4. Inventory Log Transform
        out["log_inventory_level"] = np.log1p(np.maximum(out[inv_col], 0))

        return out
