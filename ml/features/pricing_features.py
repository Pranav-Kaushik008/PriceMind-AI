"""
PriceMind AI — Pricing & Competitor Feature Engineering
Extracts price dynamics, competitor spread ratios, elasticity log transforms, and margin indicators.
"""

import pandas as pd
import numpy as np
from typing import Optional
from ml.features.feature_config import FeatureConfig


class PricingFeatureExtractor:
    """
    Constructs price, competitor spread, and elasticity support features without data leakage.
    """

    def __init__(self, config: Optional[FeatureConfig] = None):
        self.config = config or FeatureConfig()

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        p_col = self.config.price_col
        cost_col = self.config.cost_col
        comp_col = self.config.competitor_col
        promo_col = self.config.promotion_col
        group_cols = self.config.group_cols
        date_col = self.config.date_col

        if p_col not in df.columns:
            return df

        out = df.copy()
        # Sort chronologically within each SKU/Store group
        out = out.sort_values(by=group_cols + [date_col]).reset_index(drop=True)

        # 1. Price Log Transform (Elasticity Support: ln(P))
        out["log_price"] = np.log(np.maximum(out[p_col], 1e-4))

        # 2. Historical Price Lags & Shifts
        for lag in self.config.price_lags:
            out[f"price_lag_{lag}"] = out.groupby(group_cols)[p_col].shift(lag)

        # 3. Short-Term Price Velocity
        # Absolute & relative price change vs prior day (t-1)
        prev_p = out.groupby(group_cols)[p_col].shift(1)
        out["price_change_1d"] = out[p_col] - prev_p
        out["price_pct_change_1d"] = ((out[p_col] - prev_p) / np.maximum(prev_p, 1e-4)) * 100.0

        # 4. Rolling Price Benchmark (Using strictly historical shifted prices)
        for w in [7, 28]:
            shifted_p = out.groupby(group_cols)[p_col].shift(1)
            roll_mean = shifted_p.groupby(out[group_cols[0]]).rolling(w, min_periods=1).mean().reset_index(level=0, drop=True)
            out[f"price_rolling_mean_{w}"] = roll_mean
            out[f"price_deviation_rolling_{w}"] = out[p_col] - roll_mean

        # 5. Cost & Unit Margin Dynamics
        if cost_col in out.columns:
            out["log_cost_price"] = np.log(np.maximum(out[cost_col], 1e-4))
            out["unit_gross_margin_dollar"] = out[p_col] - out[cost_col]
            out["unit_gross_margin_pct"] = (out["unit_gross_margin_dollar"] / np.maximum(out[p_col], 1e-4)) * 100.0
            out["price_to_cost_markup"] = out[p_col] / np.maximum(out[cost_col], 1e-4)

        # 6. Competitor Benchmark Telemetry (If competitor price is available)
        if comp_col in out.columns:
            out["log_competitor_price"] = np.log(np.maximum(out[comp_col], 1e-4))
            out["competitor_price_diff"] = out[p_col] - out[comp_col]
            out["competitor_price_ratio"] = out[p_col] / np.maximum(out[comp_col], 1e-4)
            out["competitor_spread_pct"] = ((out[p_col] - out[comp_col]) / np.maximum(out[comp_col], 1e-4)) * 100.0
            out["is_undercut_by_competitor"] = (out[comp_col] < out[p_col]).astype(int)

        # 7. Promotional Context
        if promo_col in out.columns:
            out["is_promotion_flag"] = out[promo_col].astype(int)
            # Promo interaction with price
            out["promo_price_interaction"] = out["is_promotion_flag"] * out[p_col]

        return out
