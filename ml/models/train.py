"""
PriceMind AI — Demand Model Training Suite
Trains and benchmarks multiple demand models: Baselines, Scikit-Learn, XGBoost, and LightGBM.
"""

from typing import Dict, Any, List, Optional, Tuple
import time
import pandas as pd
import numpy as np
import logging
from pathlib import Path

from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
import xgboost as xgb
import lightgbm as lgb

from ml.models.baseline import (
    HistoricalMeanBaseline,
    Lag1NaiveBaseline,
    Seasonal7DayNaiveBaseline,
)
from ml.models.preprocessing import DataSplitter, FeaturePreprocessor
from ml.models.evaluate import ModelEvaluator

logger = logging.getLogger(__name__)


class DemandModelTrainer:
    """
    Orchestrates time-aware training, validation, and benchmarking of candidate demand models.
    """

    def __init__(
        self,
        random_seed: int = 42,
        target_col: str = "units_sold",
    ):
        self.random_seed = random_seed
        self.target_col = target_col
        self.preprocessor = FeaturePreprocessor(target_col=target_col)
        self.trained_models: Dict[str, Any] = {}
        self.evaluation_results: List[Dict[str, Any]] = []

    def get_model_candidates(self) -> Dict[str, Any]:
        """
        Instantiates standardized regression model candidates with reproducible hyperparameters.
        """
        return {
            "Baseline (Lag-1 Naive)": Lag1NaiveBaseline(),
            "Baseline (Seasonal 7-Day)": Seasonal7DayNaiveBaseline(),
            "Baseline (Historical Mean)": HistoricalMeanBaseline(),
            "Scikit-Learn (Random Forest)": RandomForestRegressor(
                n_estimators=100,
                max_depth=12,
                min_samples_leaf=2,
                random_state=self.random_seed,
                n_jobs=-1,
            ),
            "Scikit-Learn (HistGradientBoosting)": HistGradientBoostingRegressor(
                max_iter=150,
                max_depth=8,
                learning_rate=0.08,
                random_state=self.random_seed,
            ),
            "XGBoost (XGBRegressor)": xgb.XGBRegressor(
                n_estimators=150,
                max_depth=6,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=self.random_seed,
                n_jobs=-1,
            ),
            "LightGBM (LGBMRegressor)": lgb.LGBMRegressor(
                n_estimators=150,
                max_depth=6,
                num_leaves=31,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=self.random_seed,
                verbose=-1,
                n_jobs=-1,
            ),
        }

    def train_and_benchmark_all(
        self,
        df: pd.DataFrame,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        date_col: str = "date",
    ) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        """
        Executes end-to-end benchmark across all models on held-out test split.
        Returns:
            - comparison_df: Summary performance metrics across models
            - test_predictions_df: Held-out test records with actual vs predicted demand
            - artifacts_dict: Dictionary containing trained model objects and metadata
        """
        # 1. Chronological Partitioning
        train_df, val_df, test_df = DataSplitter.chronological_split(
            df,
            train_ratio=train_ratio,
            val_ratio=val_ratio,
            test_ratio=test_ratio,
            date_col=date_col,
        )

        # 2. Extract Feature Matrices
        X_train, y_train, feature_names = self.preprocessor.get_features_and_target(train_df, is_training=True)
        X_val, y_val, _ = self.preprocessor.get_features_and_target(val_df)
        X_test, y_test, _ = self.preprocessor.get_features_and_target(test_df)

        models = self.get_model_candidates()
        comparison_records = []
        test_preds_dict = {
            "date": test_df[date_col].values,
            "sku_id": test_df["sku_id"].values if "sku_id" in test_df.columns else np.arange(len(test_df)),
            "store_id": test_df["store_id"].values if "store_id" in test_df.columns else "STORE-01",
            "actual_units": y_test.values,
        }

        # Train and evaluate each model candidate
        for name, model in models.items():
            logger.info(f"Training candidate: {name}...")
            start_train = time.perf_counter()

            # Handle Baseline fit signature vs ML fit signature
            if isinstance(model, (HistoricalMeanBaseline, Lag1NaiveBaseline, Seasonal7DayNaiveBaseline)):
                group_col = train_df["sku_id"] if "sku_id" in train_df.columns else None
                model.fit(X_train, y_train, group_col=group_col)
            else:
                model.fit(X_train, y_train)

            train_time = time.perf_counter() - start_train

            # Measure test inference latency
            start_infer = time.perf_counter()
            if isinstance(model, (HistoricalMeanBaseline, Lag1NaiveBaseline, Seasonal7DayNaiveBaseline)):
                test_group = test_df["sku_id"] if "sku_id" in test_df.columns else None
                preds = model.predict(X_test, group_col=test_group)
            else:
                preds = model.predict(X_test)
            infer_time_ms = (time.perf_counter() - start_infer) * 1000.0

            # Clean predictions: demand cannot be negative
            preds = np.maximum(0.0, np.round(preds, 2))
            test_preds_dict[f"pred_{name}"] = preds

            # Calculate evaluation metrics
            metrics = ModelEvaluator.calculate_metrics(
                y_true=y_test,
                y_pred=preds,
                model_name=name,
                train_time_sec=train_time,
                inference_time_ms=infer_time_ms,
                split_name="test",
                n_features=len(feature_names),
            )
            comparison_records.append(metrics)
            self.trained_models[name] = model

        comparison_df = pd.DataFrame(comparison_records).sort_values("rmse", ascending=True).reset_index(drop=True)
        test_predictions_df = pd.DataFrame(test_preds_dict)

        # Select Best Model based on RMSE and R²
        best_model_name = comparison_df.iloc[0]["model_name"]
        best_model = self.trained_models[best_model_name]

        metadata = {
            "best_model_name": best_model_name,
            "feature_names": feature_names,
            "target_col": self.target_col,
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df),
            "train_date_range": [str(train_df[date_col].min()), str(train_df[date_col].max())],
            "test_date_range": [str(test_df[date_col].min()), str(test_df[date_col].max())],
            "random_seed": self.random_seed,
        }

        return comparison_df, test_predictions_df, {
            "best_model": best_model,
            "best_model_name": best_model_name,
            "trained_models": self.trained_models,
            "metadata": metadata,
            "feature_names": feature_names,
        }
