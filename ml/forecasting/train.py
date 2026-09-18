"""
PriceMind AI — Demand Forecasting Trainer & Walk-Forward Benchmark Suite
Executes time-aware rolling-origin evaluation across forecasting models and exports standardized metrics.
"""

from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import pandas as pd
import numpy as np
import logging
import joblib

from ml.forecasting.prepare import TimeSeriesPreparer
from ml.forecasting.baseline import NaiveForecaster, SeasonalNaiveForecaster, MovingAverageForecaster
from ml.forecasting.models import (
    ExponentialSmoothingForecaster,
    SARIMAXForecaster,
    RecursiveMLForecaster,
    STATSMODELS_AVAILABLE,
)
from ml.forecasting.evaluate import ForecastEvaluator
from ml.forecasting.forecast import DemandForecastingPipeline

logger = logging.getLogger(__name__)


class ForecastingTrainer:
    """
    Orchestrates time-series walk-forward validation and benchmarks multi-model forecasting performance.
    """

    def __init__(
        self,
        horizon: int = 14,
        confidence_level: float = 0.95,
        reports_dir: Optional[Path | str] = None,
        artifacts_dir: Optional[Path | str] = None,
    ):
        self.horizon = horizon
        self.confidence_level = confidence_level
        project_root = Path(__file__).resolve().parents[2]
        self.reports_dir = Path(reports_dir) if reports_dir else (project_root / "reports")
        self.artifacts_dir = Path(artifacts_dir) if artifacts_dir else (project_root / "ml" / "artifacts" / "forecasts")

        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

    def evaluate_all_models_on_holdout(
        self,
        df: pd.DataFrame,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Executes holdout validation for every SKU across all candidate forecasting models.
        Returns:
            - metrics_df: Summary metrics per model and per SKU
            - predictions_df: Detailed held-out ground truth vs forecasts
            - summary_df: Overall SKU forecast summary
        """
        skus = sorted(df["sku_id"].dropna().unique())
        metric_rows = []
        pred_rows = []

        for sku in skus:
            sku_df, status = TimeSeriesPreparer.prepare_sku_series(df, sku_id=sku)
            if status["status"] != "READY":
                continue

            train_df, test_df = TimeSeriesPreparer.train_test_forecast_split(
                sku_df, horizon=self.horizon
            )
            y_train = train_df["units_sold"].values
            y_test = test_df["units_sold"].values
            test_dates = test_df["date"].values

            models_to_test = {
                "Naive": NaiveForecaster(),
                "Seasonal_Naive_7D": SeasonalNaiveForecaster(seasonal_period=7),
                "Moving_Average_14D": MovingAverageForecaster(window=14),
                "Recursive_LightGBM": RecursiveMLForecaster(base_model_type="lightgbm"),
                "Recursive_XGBoost": RecursiveMLForecaster(base_model_type="xgboost"),
            }

            if STATSMODELS_AVAILABLE:
                models_to_test["Exponential_Smoothing"] = ExponentialSmoothingForecaster()
                models_to_test["SARIMAX"] = SARIMAXForecaster()

            for name, model in models_to_test.items():
                try:
                    if isinstance(model, RecursiveMLForecaster):
                        model.fit(train_df)
                        point, lower, upper = model.forecast(
                            start_date=test_dates[0],
                            horizon=self.horizon,
                            confidence_level=self.confidence_level,
                        )
                    else:
                        model.fit(y_train)
                        point, lower, upper = model.forecast(
                            horizon=self.horizon,
                            confidence_level=self.confidence_level,
                        )

                    # Compute evaluation metrics
                    m_dict = ForecastEvaluator.calculate_metrics(
                        y_true=y_test,
                        y_pred=point,
                        y_train_history=y_train,
                        lower_bound=lower,
                        upper_bound=upper,
                        model_name=name,
                        sku_id=sku,
                        horizon=self.horizon,
                        seasonal_period=7,
                    )
                    metric_rows.append(m_dict)

                    # Store prediction rows
                    for h in range(self.horizon):
                        pred_rows.append({
                            "sku_id": sku,
                            "date": test_dates[h],
                            "horizon_step": h + 1,
                            "actual_demand": round(float(y_test[h]), 2),
                            "forecast_demand": round(float(point[h]), 2),
                            "lower_bound": round(float(lower[h]), 2),
                            "upper_bound": round(float(upper[h]), 2),
                            "model_name": name,
                        })

                except Exception as e:
                    logger.warning(f"Validation failed for SKU {sku} with {name}: {e}")

        metrics_df = pd.DataFrame(metric_rows).sort_values(["sku_id", "rmse"]).reset_index(drop=True)
        predictions_df = pd.DataFrame(pred_rows)

        # Generate production forecasts into the future
        pipeline = DemandForecastingPipeline(default_horizon=self.horizon, confidence_level=self.confidence_level)
        future_forecasts_df, summary_df = pipeline.forecast_all_skus(df, horizon=self.horizon)

        # Save artifacts
        self.export_reports(metrics_df, future_forecasts_df, summary_df)

        return metrics_df, predictions_df, summary_df

    def export_reports(
        self,
        metrics_df: pd.DataFrame,
        forecast_predictions_df: pd.DataFrame,
        summary_df: pd.DataFrame,
    ) -> Dict[str, Path]:
        """Saves reports to CSV files and serializes pipeline."""
        m_path = self.reports_dir / "forecast_metrics.csv"
        p_path = self.reports_dir / "forecast_predictions.csv"
        s_path = self.reports_dir / "forecast_summary.csv"

        metrics_df.to_csv(m_path, index=False)
        forecast_predictions_df.to_csv(p_path, index=False)
        summary_df.to_csv(s_path, index=False)

        # Serialize forecasting metadata
        joblib.dump(
            {
                "horizon": self.horizon,
                "confidence_level": self.confidence_level,
                "summary": summary_df.to_dict(orient="records"),
            },
            self.artifacts_dir / "forecasting_metadata.joblib"
        )

        return {
            "forecast_metrics": m_path,
            "forecast_predictions": p_path,
            "forecast_summary": s_path,
        }
