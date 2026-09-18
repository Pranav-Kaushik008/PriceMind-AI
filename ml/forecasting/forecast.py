"""
PriceMind AI — Production Demand Forecasting Pipeline
Executes end-to-end multi-horizon demand forecasting with prediction intervals and data readiness guards.
"""

from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import pandas as pd
import numpy as np
import logging

from ml.forecasting.prepare import TimeSeriesPreparer
from ml.forecasting.baseline import NaiveForecaster, SeasonalNaiveForecaster
from ml.forecasting.models import (
    ExponentialSmoothingForecaster,
    SARIMAXForecaster,
    RecursiveMLForecaster,
    STATSMODELS_AVAILABLE,
)

logger = logging.getLogger(__name__)


class DemandForecastingPipeline:
    """
    Production-grade forecaster generating structured point forecasts and prediction intervals
    across configurable horizons (e.g., 7, 14, 30 days) with data validation.
    """

    SUPPORTED_MODELS = [
        "Recursive_LightGBM",
        "Recursive_XGBoost",
        "ExponentialSmoothing",
        "SeasonalNaive_7D",
        "Naive",
    ]

    def __init__(
        self,
        default_horizon: int = 14,
        confidence_level: float = 0.95,
        primary_model: str = "Recursive_LightGBM",
    ):
        self.default_horizon = default_horizon
        self.confidence_level = confidence_level
        self.primary_model = primary_model

    def forecast_sku(
        self,
        df: pd.DataFrame,
        sku_id: str,
        horizon: Optional[int] = None,
        model_name: Optional[str] = None,
        future_prices: Optional[List[float]] = None,
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Generates forecast table for a single SKU.
        """
        h = horizon or self.default_horizon
        m_name = model_name or self.primary_model

        # 1. Prepare and validate time series
        sku_df, status_info = TimeSeriesPreparer.prepare_sku_series(df, sku_id=sku_id)
        if status_info["status"] != "READY":
            # Return empty forecast table with error status
            return pd.DataFrame(), status_info

        sku_name = sku_df["sku_name"].iloc[0] if "sku_name" in sku_df.columns else sku_id
        category = sku_df["category"].iloc[0] if "category" in sku_df.columns else "General"
        last_date = sku_df["date"].max()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=h, freq="D")

        # 2. Fit selected model and generate forecast
        try:
            if m_name == "Recursive_LightGBM":
                forecaster = RecursiveMLForecaster(base_model_type="lightgbm")
                forecaster.fit(sku_df)
                point, lower, upper = forecaster.forecast(
                    start_date=future_dates[0],
                    horizon=h,
                    future_prices=future_prices,
                    confidence_level=self.confidence_level,
                )
            elif m_name == "Recursive_XGBoost":
                forecaster = RecursiveMLForecaster(base_model_type="xgboost")
                forecaster.fit(sku_df)
                point, lower, upper = forecaster.forecast(
                    start_date=future_dates[0],
                    horizon=h,
                    future_prices=future_prices,
                    confidence_level=self.confidence_level,
                )
            elif m_name == "ExponentialSmoothing" and STATSMODELS_AVAILABLE:
                forecaster = ExponentialSmoothingForecaster()
                forecaster.fit(sku_df["units_sold"])
                point, lower, upper = forecaster.forecast(horizon=h, confidence_level=self.confidence_level)
            elif m_name == "SeasonalNaive_7D":
                forecaster = SeasonalNaiveForecaster(seasonal_period=7)
                forecaster.fit(sku_df["units_sold"])
                point, lower, upper = forecaster.forecast(horizon=h, confidence_level=self.confidence_level)
            else:
                # Default Naive fallback
                forecaster = NaiveForecaster()
                forecaster.fit(sku_df["units_sold"])
                point, lower, upper = forecaster.forecast(horizon=h, confidence_level=self.confidence_level)
                m_name = "Naive"

        except Exception as e:
            logger.warning(f"Forecaster {m_name} failed for {sku_id}: {e}. Falling back to SeasonalNaive_7D...")
            forecaster = SeasonalNaiveForecaster(seasonal_period=7)
            forecaster.fit(sku_df["units_sold"])
            point, lower, upper = forecaster.forecast(horizon=h, confidence_level=self.confidence_level)
            m_name = "SeasonalNaive_7D (Fallback)"

        # 3. Construct structured output DataFrame
        forecast_rows = []
        for i in range(h):
            forecast_rows.append({
                "sku_id": sku_id,
                "sku_name": sku_name,
                "category": category,
                "forecast_date": future_dates[i],
                "horizon_step": i + 1,
                "predicted_demand": round(float(point[i]), 2),
                "lower_bound": round(float(lower[i]), 2),
                "upper_bound": round(float(upper[i]), 2),
                "model_name": m_name,
                "status": "READY",
            })

        forecast_df = pd.DataFrame(forecast_rows)
        return forecast_df, {
            "sku_id": sku_id,
            "status": "READY",
            "model_used": m_name,
            "horizon": h,
            "forecast_start": str(future_dates[0].date()),
            "forecast_end": str(future_dates[-1].date()),
            "mean_predicted_demand": round(float(np.mean(point)), 2),
        }

    def forecast_all_skus(
        self,
        df: pd.DataFrame,
        horizon: Optional[int] = None,
        model_name: Optional[str] = None,
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Runs forecasting across all SKUs in the dataset.
        Returns:
            - all_forecasts_df: Table of daily future predictions with intervals
            - summary_df: SKU-level metadata and diagnostic summary
        """
        h = horizon or self.default_horizon
        skus = sorted(df["sku_id"].dropna().unique())

        forecast_frames = []
        summary_records = []

        for sku in skus:
            f_df, meta = self.forecast_sku(df, sku_id=sku, horizon=h, model_name=model_name)
            if not f_df.empty:
                forecast_frames.append(f_df)
                # Historical summary stats
                sku_data, _ = TimeSeriesPreparer.prepare_sku_series(df, sku_id=sku)
                hist_mean = float(sku_data["units_sold"].mean()) if not sku_data.empty else 0.0
                recent_7d_mean = float(sku_data["units_sold"].iloc[-7:].mean()) if len(sku_data) >= 7 else hist_mean

                summary_records.append({
                    "sku_id": sku,
                    "sku_name": f_df["sku_name"].iloc[0],
                    "category": f_df["category"].iloc[0],
                    "historical_avg_demand": round(hist_mean, 2),
                    "recent_7d_avg_demand": round(recent_7d_mean, 2),
                    "forecast_avg_demand": meta["mean_predicted_demand"],
                    "forecast_horizon_days": h,
                    "model_name": meta["model_used"],
                    "forecast_status": meta["status"],
                })
            else:
                summary_records.append({
                    "sku_id": sku,
                    "sku_name": sku,
                    "category": "N/A",
                    "historical_avg_demand": 0.0,
                    "recent_7d_avg_demand": 0.0,
                    "forecast_avg_demand": 0.0,
                    "forecast_horizon_days": h,
                    "model_name": "None",
                    "forecast_status": meta["status"],
                })

        all_forecasts_df = pd.concat(forecast_frames, ignore_index=True) if forecast_frames else pd.DataFrame()
        summary_df = pd.DataFrame(summary_records)
        return all_forecasts_df, summary_df
