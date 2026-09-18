"""
PriceMind AI — Baseline Demand Forecasters
Implements simple Naive, Seasonal Naive (7-day cadence), and Moving Average forecasters with prediction intervals.
"""

from typing import Optional, Dict, Any, Tuple
import numpy as np
import pandas as pd
from scipy import stats


class NaiveForecaster:
    """
    Carries the last observed demand value forward over the forecast horizon.
    """
    def __init__(self):
        self.last_value: float = 0.0
        self.residual_std: float = 0.0

    def fit(self, y: pd.Series | np.ndarray) -> "NaiveForecaster":
        y_arr = np.asarray(y, dtype=float)
        if len(y_arr) == 0:
            raise ValueError("Cannot fit NaiveForecaster on empty series.")
        self.last_value = float(y_arr[-1])
        # Residuals: y_t - y_{t-1}
        if len(y_arr) > 1:
            diffs = np.diff(y_arr)
            self.residual_std = float(np.std(diffs, ddof=1)) if len(diffs) > 1 else 0.0
        return self

    def forecast(
        self,
        horizon: int = 14,
        confidence_level: float = 0.95,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Returns (point_forecast, lower_bound, upper_bound).
        """
        point_forecast = np.full(horizon, self.last_value)
        z = stats.norm.ppf((1.0 + confidence_level) / 2.0)

        # Standard error scales with sqrt(h)
        h_steps = np.arange(1, horizon + 1)
        half_width = z * self.residual_std * np.sqrt(h_steps)

        lower_bound = np.maximum(0.0, point_forecast - half_width)
        upper_bound = np.maximum(0.0, point_forecast + half_width)

        return point_forecast, lower_bound, upper_bound


class SeasonalNaiveForecaster:
    """
    Projects the observed demand from the exact same season in the past (e.g. s=7 for day-of-week).
    """
    def __init__(self, seasonal_period: int = 7):
        self.seasonal_period = seasonal_period
        self.last_season: np.ndarray = np.array([])
        self.residual_std: float = 0.0

    def fit(self, y: pd.Series | np.ndarray) -> "SeasonalNaiveForecaster":
        y_arr = np.asarray(y, dtype=float)
        n = len(y_arr)
        if n < self.seasonal_period:
            raise ValueError(
                f"Seasonal naive requires at least {self.seasonal_period} observations. Got {n}."
            )
        self.last_season = y_arr[-self.seasonal_period:]

        # Seasonal residuals: y_t - y_{t-s}
        if n > self.seasonal_period:
            diffs = y_arr[self.seasonal_period:] - y_arr[:-self.seasonal_period]
            self.residual_std = float(np.std(diffs, ddof=1)) if len(diffs) > 1 else 0.0
        return self

    def forecast(
        self,
        horizon: int = 14,
        confidence_level: float = 0.95,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Returns (point_forecast, lower_bound, upper_bound).
        """
        # Tile seasonal pattern across horizon
        num_cycles = int(np.ceil(horizon / self.seasonal_period))
        tiled = np.tile(self.last_season, num_cycles)[:horizon]
        point_forecast = np.maximum(0.0, tiled)

        z = stats.norm.ppf((1.0 + confidence_level) / 2.0)
        cycles = np.floor(np.arange(horizon) / self.seasonal_period) + 1.0
        half_width = z * self.residual_std * np.sqrt(cycles)

        lower_bound = np.maximum(0.0, point_forecast - half_width)
        upper_bound = np.maximum(0.0, point_forecast + half_width)

        return point_forecast, lower_bound, upper_bound


class MovingAverageForecaster:
    """
    Projects the rolling average of the last W periods forward flatly.
    """
    def __init__(self, window: int = 14):
        self.window = window
        self.ma_value: float = 0.0
        self.residual_std: float = 0.0

    def fit(self, y: pd.Series | np.ndarray) -> "MovingAverageForecaster":
        y_arr = np.asarray(y, dtype=float)
        n = len(y_arr)
        if n == 0:
            raise ValueError("Empty series for MovingAverageForecaster.")
        w = min(self.window, n)
        self.ma_value = float(np.mean(y_arr[-w:]))
        if n > 1:
            self.residual_std = float(np.std(y_arr[-w:], ddof=1)) if w > 1 else 0.0
        return self

    def forecast(
        self,
        horizon: int = 14,
        confidence_level: float = 0.95,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        point_forecast = np.full(horizon, self.ma_value)
        z = stats.norm.ppf((1.0 + confidence_level) / 2.0)
        h_steps = np.arange(1, horizon + 1)
        half_width = z * self.residual_std * np.sqrt(h_steps)

        lower_bound = np.maximum(0.0, point_forecast - half_width)
        upper_bound = np.maximum(0.0, point_forecast + half_width)

        return point_forecast, lower_bound, upper_bound
