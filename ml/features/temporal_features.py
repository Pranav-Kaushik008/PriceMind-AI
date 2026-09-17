"""
PriceMind AI — Temporal & Calendar Feature Engineering
Extracts calendar attributes, weekend flags, month/quarter boundaries, and cyclical sine/cosine encodings.
"""

import pandas as pd
import numpy as np
from typing import List, Optional
from ml.features.feature_config import FeatureConfig


class TemporalFeatureExtractor:
    """
    Transforms datetime timestamps into calendar features and continuous cyclical signals.
    """

    def __init__(self, config: Optional[FeatureConfig] = None):
        self.config = config or FeatureConfig()

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract temporal signals without mutating original DataFrame.
        """
        date_col = self.config.date_col
        if date_col not in df.columns:
            raise ValueError(f"Date column '{date_col}' not found in DataFrame.")

        out = df.copy()
        # Ensure datetime format
        dt = pd.to_datetime(out[date_col])

        # 1. Standard Calendar Attributes
        out["year"] = dt.dt.year.astype(int)
        out["month"] = dt.dt.month.astype(int)
        out["quarter"] = dt.dt.quarter.astype(int)
        out["day"] = dt.dt.day.astype(int)
        out["day_of_week"] = dt.dt.dayofweek.astype(int) # 0 = Monday, 6 = Sunday
        out["day_of_year"] = dt.dt.dayofyear.astype(int)
        out["week_of_year"] = dt.dt.isocalendar().week.astype(int)
        out["is_weekend"] = dt.dt.dayofweek.isin([5, 6]).astype(int)

        # 2. Period Boundary Indicators
        out["is_month_start"] = dt.dt.is_month_start.astype(int)
        out["is_month_end"] = dt.dt.is_month_end.astype(int)
        out["is_quarter_start"] = dt.dt.is_quarter_start.astype(int)
        out["is_quarter_end"] = dt.dt.is_quarter_end.astype(int)

        # 3. Continuous Cyclical Sine / Cosine Encodings
        # Month (1-12)
        out["month_sin"] = np.sin(2 * np.pi * out["month"] / 12.0)
        out["month_cos"] = np.cos(2 * np.pi * out["month"] / 12.0)

        # Day of Week (0-6)
        out["dow_sin"] = np.sin(2 * np.pi * out["day_of_week"] / 7.0)
        out["dow_cos"] = np.cos(2 * np.pi * out["day_of_week"] / 7.0)

        # Week of Year (1-52)
        out["week_sin"] = np.sin(2 * np.pi * out["week_of_year"] / 52.0)
        out["week_cos"] = np.cos(2 * np.pi * out["week_of_year"] / 52.0)

        return out
