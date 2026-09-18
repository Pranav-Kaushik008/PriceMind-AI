"""
PriceMind AI — Advanced Statistical & Machine Learning Demand Forecasters
Implements Holt-Winters Exponential Smoothing, SARIMAX, and Multi-Step Recursive ML Forecasting.
"""

from typing import Optional, Dict, Any, Tuple, List
import numpy as np
import pandas as pd
from scipy import stats
import logging

try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False

from sklearn.ensemble import HistGradientBoostingRegressor
import lightgbm as lgb
import xgboost as xgb

logger = logging.getLogger(__name__)


class ExponentialSmoothingForecaster:
    """
    Holt-Winters Exponential Smoothing with additive trend and weekly seasonality (s=7).
    """

    def __init__(
        self,
        seasonal_periods: int = 7,
        trend: str = "add",
        seasonal: str = "add",
        damped_trend: bool = False,
    ):
        self.seasonal_periods = seasonal_periods
        self.trend = trend
        self.seasonal = seasonal
        self.damped_trend = damped_trend
        self.model_fit = None
        self.residual_std: float = 0.0
        self.last_date: Optional[pd.Timestamp] = None

    def fit(self, y: pd.Series | np.ndarray) -> "ExponentialSmoothingForecaster":
        if not STATSMODELS_AVAILABLE:
            raise RuntimeError("statsmodels is required for ExponentialSmoothingForecaster.")

        y_arr = np.asarray(y, dtype=float)
        n = len(y_arr)
        if n < 2 * self.seasonal_periods:
            raise ValueError(
                f"Exponential smoothing requires at least 2 full seasonal cycles ({2 * self.seasonal_periods} observations). Got {n}."
            )

        # Shift by small epsilon if strictly non-negative required
        model = ExponentialSmoothing(
            y_arr,
            trend=self.trend,
            seasonal=self.seasonal,
            seasonal_periods=self.seasonal_periods,
            damped_trend=self.damped_trend,
            initialization_method="estimated",
        )
        self.model_fit = model.fit(optimized=True)
        residuals = self.model_fit.resid
        self.residual_std = float(np.std(residuals, ddof=1)) if len(residuals) > 1 else 1.0
        return self

    def forecast(
        self,
        horizon: int = 14,
        confidence_level: float = 0.95,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.model_fit is None:
            raise RuntimeError("Model must be fitted before forecasting.")

        preds = self.model_fit.forecast(steps=horizon)
        point_forecast = np.maximum(0.0, np.asarray(preds, dtype=float))

        # Empirical simulation bounds
        z = stats.norm.ppf((1.0 + confidence_level) / 2.0)
        h_steps = np.arange(1, horizon + 1)
        half_width = z * self.residual_std * np.sqrt(1.0 + 0.05 * h_steps)

        lower_bound = np.maximum(0.0, point_forecast - half_width)
        upper_bound = np.maximum(0.0, point_forecast + half_width)

        return point_forecast, lower_bound, upper_bound


class SARIMAXForecaster:
    """
    Seasonal AutoRegressive Integrated Moving Average with weekly seasonal cycle (s=7).
    """

    def __init__(
        self,
        order: Tuple[int, int, int] = (1, 0, 1),
        seasonal_order: Tuple[int, int, int, int] = (1, 0, 1, 7),
    ):
        self.order = order
        self.seasonal_order = seasonal_order
        self.model_fit = None

    def fit(self, y: pd.Series | np.ndarray) -> "SARIMAXForecaster":
        if not STATSMODELS_AVAILABLE:
            raise RuntimeError("statsmodels is required for SARIMAXForecaster.")

        y_arr = np.asarray(y, dtype=float)
        n = len(y_arr)
        if n < 2 * self.seasonal_order[3]:
            raise ValueError(f"SARIMAX requires at least {2 * self.seasonal_order[3]} observations. Got {n}.")

        try:
            model = SARIMAX(
                y_arr,
                order=self.order,
                seasonal_order=self.seasonal_order,
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            self.model_fit = model.fit(disp=False, maxiter=100)
        except Exception as e:
            logger.warning(f"SARIMAX full fit failed ({e}), fitting reduced order (1, 0, 0)...")
            model = SARIMAX(
                y_arr,
                order=(1, 0, 0),
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            self.model_fit = model.fit(disp=False, maxiter=50)

        return self

    def forecast(
        self,
        horizon: int = 14,
        confidence_level: float = 0.95,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.model_fit is None:
            raise RuntimeError("SARIMAX must be fitted before forecasting.")

        alpha = 1.0 - confidence_level
        forecast_res = self.model_fit.get_forecast(steps=horizon)
        point_forecast = np.maximum(0.0, np.asarray(forecast_res.predicted_mean, dtype=float))

        conf_df = forecast_res.conf_int(alpha=alpha)
        lower_bound = np.maximum(0.0, np.asarray(conf_df[:, 0] if isinstance(conf_df, np.ndarray) else conf_df.iloc[:, 0], dtype=float))
        upper_bound = np.maximum(0.0, np.asarray(conf_df[:, 1] if isinstance(conf_df, np.ndarray) else conf_df.iloc[:, 1], dtype=float))

        return point_forecast, lower_bound, upper_bound


class RecursiveMLForecaster:
    """
    Multi-Step Recursive GBDT Forecaster.
    Dynamically updates autoregressive lags and rolling statistics step-by-step
    to project demand across arbitrary horizons without future target leakage.
    """

    def __init__(
        self,
        base_model_type: str = "lightgbm",
        random_state: int = 42,
    ):
        self.base_model_type = base_model_type
        self.random_state = random_state
        self.model = None
        self.feature_names: List[str] = []
        self.history_demand: List[float] = []
        self.last_price: float = 100.0
        self.last_cost: float = 50.0
        self.last_comp: float = 100.0
        self.residual_std: float = 2.0

    def fit(
        self,
        df_history: pd.DataFrame,
        demand_col: str = "units_sold",
        price_col: str = "price",
        date_col: str = "date",
    ) -> "RecursiveMLForecaster":
        df = df_history.sort_values(date_col).copy()
        self.history_demand = list(df[demand_col].values)

        if price_col in df.columns:
            self.last_price = float(df[price_col].iloc[-1])
        if "cost_price" in df.columns:
            self.last_cost = float(df["cost_price"].iloc[-1])
        if "competitor_price" in df.columns:
            self.last_comp = float(df["competitor_price"].iloc[-1])

        # Feature matrix creation for single SKU series
        records = []
        demands = self.history_demand
        n = len(demands)

        for i in range(28, n):
            row_date = df[date_col].iloc[i]
            p = float(df[price_col].iloc[i]) if price_col in df.columns else self.last_price
            cp = float(df["competitor_price"].iloc[i]) if "competitor_price" in df.columns else p

            feat = self._build_feature_row(
                demand_history=demands[:i],
                target_date=row_date,
                price=p,
                competitor_price=cp,
                cost_price=self.last_cost,
                is_promo=int(df["is_promotion"].iloc[i]) if "is_promotion" in df.columns else 0,
            )
            records.append(feat)

        train_X = pd.DataFrame(records)
        train_y = np.array(demands[28:])

        self.feature_names = list(train_X.columns)

        if self.base_model_type == "xgboost":
            self.model = xgb.XGBRegressor(
                n_estimators=100, max_depth=5, learning_rate=0.08, random_state=self.random_state, n_jobs=-1
            )
        elif self.base_model_type == "lightgbm":
            self.model = lgb.LGBMRegressor(
                n_estimators=100, max_depth=5, num_leaves=20, learning_rate=0.08, random_state=self.random_state, verbose=-1, n_jobs=-1
            )
        else:
            self.model = HistGradientBoostingRegressor(max_iter=100, max_depth=6, random_state=self.random_state)

        self.model.fit(train_X, train_y)
        in_sample_preds = self.model.predict(train_X)
        self.residual_std = float(np.std(train_y - in_sample_preds, ddof=1)) if len(train_y) > 1 else 2.0

        return self

    def _build_feature_row(
        self,
        demand_history: List[float],
        target_date: pd.Timestamp,
        price: float,
        competitor_price: float,
        cost_price: float,
        is_promo: int = 0,
    ) -> Dict[str, float]:
        """Constructs predictor vector matching the feature engineering schema."""
        d = np.array(demand_history, dtype=float)
        p = float(price)
        cp = float(competitor_price)
        c = float(cost_price)

        lag_1 = float(d[-1])
        lag_7 = float(d[-7]) if len(d) >= 7 else lag_1
        lag_14 = float(d[-14]) if len(d) >= 14 else lag_7
        lag_28 = float(d[-28]) if len(d) >= 28 else lag_14

        roll_7 = float(np.mean(d[-7:])) if len(d) >= 7 else lag_1
        roll_14 = float(np.mean(d[-14:])) if len(d) >= 14 else roll_7
        roll_28 = float(np.mean(d[-28:])) if len(d) >= 28 else roll_14

        dow = target_date.dayofweek
        month = target_date.month

        return {
            "price": p,
            "log_price": float(np.log(p)) if p > 0 else 0.0,
            "cost_price": c,
            "competitor_price": cp,
            "competitor_spread_pct": float(((p - cp) / cp * 100.0) if cp > 0 else 0.0),
            "is_promotion": int(is_promo),
            "demand_lag_1": lag_1,
            "demand_lag_7": lag_7,
            "demand_lag_14": lag_14,
            "demand_lag_28": lag_28,
            "demand_rolling_mean_7": roll_7,
            "demand_rolling_mean_14": roll_14,
            "demand_rolling_mean_28": roll_28,
            "day_of_week": float(dow),
            "month": float(month),
            "dow_sin": float(np.sin(2 * np.pi * dow / 7.0)),
            "dow_cos": float(np.cos(2 * np.pi * dow / 7.0)),
            "month_sin": float(np.sin(2 * np.pi * month / 12.0)),
            "month_cos": float(np.cos(2 * np.pi * month / 12.0)),
            "is_weekend": float(1.0 if dow >= 5 else 0.0),
        }

    def forecast(
        self,
        start_date: pd.Timestamp,
        horizon: int = 14,
        future_prices: Optional[List[float]] = None,
        confidence_level: float = 0.95,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.model is None:
            raise RuntimeError("Model must be fitted before forecasting.")

        current_history = list(self.history_demand)
        preds = []
        cur_date = pd.to_datetime(start_date)

        for step in range(horizon):
            step_date = cur_date + pd.Timedelta(days=step)
            step_price = future_prices[step] if (future_prices and step < len(future_prices)) else self.last_price

            feat_dict = self._build_feature_row(
                demand_history=current_history,
                target_date=step_date,
                price=step_price,
                competitor_price=self.last_comp,
                cost_price=self.last_cost,
                is_promo=0,
            )

            df_step = pd.DataFrame([feat_dict])[self.feature_names]
            step_pred = float(self.model.predict(df_step)[0])
            step_pred = max(0.0, round(step_pred, 2))

            preds.append(step_pred)
            # Recursive update: Append prediction to history buffer for next step's lags
            current_history.append(step_pred)

        point_forecast = np.array(preds)
        z = stats.norm.ppf((1.0 + confidence_level) / 2.0)
        h_steps = np.arange(1, horizon + 1)
        half_width = z * self.residual_std * np.sqrt(1.0 + 0.08 * h_steps)

        lower_bound = np.maximum(0.0, point_forecast - half_width)
        upper_bound = np.maximum(0.0, point_forecast + half_width)

        return point_forecast, lower_bound, upper_bound
