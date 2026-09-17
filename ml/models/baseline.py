"""
PriceMind AI — Baseline Demand Forecasting Models
Implements non-ML heuristics (Historical Mean, Lag-1 Naive, and Seasonal 7-Day Naive) as performance benchmarks.
"""

from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np


class HistoricalMeanBaseline:
    """
    Predicts demand using the SKU-level historical mean demand observed in training.
    """
    def __init__(self):
        self.sku_means: Dict[str, float] = {}
        self.global_mean: float = 0.0
        self.feature_names: List[str] = []

    def fit(self, X: pd.DataFrame, y: pd.Series, group_col: Optional[pd.Series] = None):
        self.global_mean = float(y.mean())
        if group_col is not None:
            df_temp = pd.DataFrame({"sku": group_col, "target": y})
            self.sku_means = df_temp.groupby("sku")["target"].mean().to_dict()
        self.feature_names = list(X.columns) if hasattr(X, "columns") else []
        return self

    def predict(self, X: pd.DataFrame, group_col: Optional[pd.Series] = None) -> np.ndarray:
        if group_col is not None:
            return np.array([self.sku_means.get(sku, self.global_mean) for sku in group_col])
        return np.full(len(X), self.global_mean)


class Lag1NaiveBaseline:
    """
    Predicts demand using the immediate prior day's demand (demand_lag_1).
    """
    def __init__(self, lag_col: str = "demand_lag_1"):
        self.lag_col = lag_col
        self.global_mean: float = 0.0

    def fit(self, X: pd.DataFrame, y: pd.Series, group_col: Optional[pd.Series] = None):
        self.global_mean = float(y.mean())
        return self

    def predict(self, X: pd.DataFrame, group_col: Optional[pd.Series] = None) -> np.ndarray:
        if isinstance(X, pd.DataFrame) and self.lag_col in X.columns:
            preds = X[self.lag_col].fillna(self.global_mean).values
            return np.maximum(0, preds)
        return np.full(len(X), self.global_mean)


class Seasonal7DayNaiveBaseline:
    """
    Predicts demand using the same day-of-week demand from the prior week (demand_lag_7).
    """
    def __init__(self, lag_col: str = "demand_lag_7"):
        self.lag_col = lag_col
        self.global_mean: float = 0.0

    def fit(self, X: pd.DataFrame, y: pd.Series, group_col: Optional[pd.Series] = None):
        self.global_mean = float(y.mean())
        return self

    def predict(self, X: pd.DataFrame, group_col: Optional[pd.Series] = None) -> np.ndarray:
        if isinstance(X, pd.DataFrame) and self.lag_col in X.columns:
            preds = X[self.lag_col].fillna(self.global_mean).values
            return np.maximum(0, preds)
        return np.full(len(X), self.global_mean)
