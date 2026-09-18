"""
PriceMind AI — Demand Forecasting Package Public API
"""

from typing import Dict, Any, Optional, Tuple, List
import pandas as pd

from ml.forecasting.prepare import TimeSeriesPreparer
from ml.forecasting.baseline import NaiveForecaster, SeasonalNaiveForecaster, MovingAverageForecaster
from ml.forecasting.models import (
    ExponentialSmoothingForecaster,
    SARIMAXForecaster,
    RecursiveMLForecaster,
)
from ml.forecasting.evaluate import ForecastEvaluator
from ml.forecasting.diagnostics import ForecastDiagnostics
from ml.forecasting.forecast import DemandForecastingPipeline
from ml.forecasting.train import ForecastingTrainer


def prepare_forecasting_data(
    df: pd.DataFrame,
    sku_id: str,
    date_col: str = "date",
    demand_col: str = "units_sold",
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Prepares a clean, contiguous time series for a single SKU.
    """
    return TimeSeriesPreparer.prepare_sku_series(df, sku_id=sku_id, date_col=date_col, demand_col=demand_col)


def train_forecasting_model(
    df: pd.DataFrame,
    horizon: int = 14,
    confidence_level: float = 0.95,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Trains and benchmarks all candidate forecasting models on time-series holdout partitions.
    """
    trainer = ForecastingTrainer(horizon=horizon, confidence_level=confidence_level)
    return trainer.evaluate_all_models_on_holdout(df)


def forecast_demand(
    df: pd.DataFrame,
    sku_id: Optional[str] = None,
    horizon: int = 14,
    confidence_level: float = 0.95,
    model_name: Optional[str] = None,
) -> Tuple[pd.DataFrame, Dict[str, Any] | pd.DataFrame]:
    """
    Generates point forecasts and prediction intervals for a single SKU or all SKUs.
    """
    pipeline = DemandForecastingPipeline(default_horizon=horizon, confidence_level=confidence_level)
    if sku_id:
        return pipeline.forecast_sku(df, sku_id=sku_id, horizon=horizon, model_name=model_name)
    return pipeline.forecast_all_skus(df, horizon=horizon, model_name=model_name)


def evaluate_forecast(
    y_true: pd.Series | list,
    y_pred: pd.Series | list,
    y_train_history: Optional[pd.Series | list] = None,
    lower_bound: Optional[pd.Series | list] = None,
    upper_bound: Optional[pd.Series | list] = None,
    model_name: str = "Forecaster",
    sku_id: str = "ALL",
) -> Dict[str, Any]:
    """
    Evaluates forecast accuracy with MAE, RMSE, WAPE, MASE, coverage, and bias.
    """
    return ForecastEvaluator.calculate_metrics(
        y_true=y_true,
        y_pred=y_pred,
        y_train_history=y_train_history,
        lower_bound=lower_bound,
        upper_bound=upper_bound,
        model_name=model_name,
        sku_id=sku_id,
    )


__all__ = [
    "TimeSeriesPreparer",
    "NaiveForecaster",
    "SeasonalNaiveForecaster",
    "MovingAverageForecaster",
    "ExponentialSmoothingForecaster",
    "SARIMAXForecaster",
    "RecursiveMLForecaster",
    "ForecastEvaluator",
    "ForecastDiagnostics",
    "DemandForecastingPipeline",
    "ForecastingTrainer",
    "prepare_forecasting_data",
    "train_forecasting_model",
    "forecast_demand",
    "evaluate_forecast",
]
