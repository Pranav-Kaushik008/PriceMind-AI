"""
ml/training/train_lightgbm.py
-----------------------------
Reproducible LightGBM Demand Model Training Pipeline with MLflow Tracking.
"""

from pathlib import Path
import time
import logging
import pandas as pd
import numpy as np
import lightgbm as lgb
import mlflow
import mlflow.lightgbm
from mlflow.models.signature import infer_signature

from ml.models.preprocessing import DataSplitter, FeaturePreprocessor
from ml.models.evaluate import ModelEvaluator
from ml.tracking.mlflow_config import setup_mlflow, EXPERIMENT_DEMAND_PREDICTION
from ml.tracking.experiment import set_active_experiment
from ml.tracking.tracking_utils import (
    log_dataset_metadata,
    log_model_parameters,
    log_evaluation_metrics,
    log_feature_artifacts,
    log_evaluation_plots,
)
from ml.tracking.model_registry import register_model_version

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parents[2]
FEATURES_PATH = ROOT_DIR / "data" / "processed" / "features.parquet"


def train_and_track_lightgbm(
    features_path: Path = FEATURES_PATH,
    random_seed: int = 42,
    n_estimators: int = 150,
    max_depth: int = 6,
    num_leaves: int = 31,
    learning_rate: float = 0.08,
    subsample: float = 0.85,
    colsample_bytree: float = 0.85,
    register_model: bool = True,
) -> dict:
    """
    Train LightGBM Regressor with MLflow tracking and metrics.
    """
    setup_mlflow()
    set_active_experiment(EXPERIMENT_DEMAND_PREDICTION)

    if not features_path.exists():
        raise FileNotFoundError(f"Feature dataset not found: {features_path}")

    df = pd.read_parquet(features_path)

    # 1. Chronological Split
    train_df, val_df, test_df = DataSplitter.chronological_split(
        df, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15, date_col="date"
    )

    preprocessor = FeaturePreprocessor(target_col="units_sold")
    X_train, y_train, feature_names = preprocessor.get_features_and_target(train_df, is_training=True)
    X_val, y_val, _ = preprocessor.get_features_and_target(val_df)
    X_test, y_test, _ = preprocessor.get_features_and_target(test_df)

    hp = {
        "n_estimators": n_estimators,
        "max_depth": max_depth,
        "num_leaves": num_leaves,
        "learning_rate": learning_rate,
        "subsample": subsample,
        "colsample_bytree": colsample_bytree,
        "random_state": random_seed,
        "verbose": -1,
        "n_jobs": -1,
    }

    with mlflow.start_run(run_name="LightGBM_Demand_Benchmark") as run:
        run_id = run.info.run_id
        logger.info(f"[TrainLightGBM] Started MLflow Run: {run_id}")

        log_dataset_metadata(
            dataset_name="features.parquet",
            n_rows=len(df),
            n_features=len(feature_names),
            feature_version="v1",
        )
        log_model_parameters(
            model_type="LightGBM (LGBMRegressor)",
            hyperparameters=hp,
            target_col="units_sold",
            random_seed=random_seed,
        )

        start_time = time.perf_counter()
        model = lgb.LGBMRegressor(**hp)
        model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(stopping_rounds=15, verbose=False)],
        )
        train_duration = time.perf_counter() - start_time
        mlflow.log_metric("train_duration_sec", train_duration)

        test_preds = model.predict(X_test)
        test_metrics = ModelEvaluator.calculate_metrics(y_test.values, test_preds)
        log_evaluation_metrics(test_metrics, prefix="test")

        feat_imp = dict(zip(feature_names, model.feature_importances_))
        log_feature_artifacts(feature_names, feat_imp)
        log_evaluation_plots(y_test.values, test_preds, model_name="LightGBM")

        signature = infer_signature(X_train.head(10), model.predict(X_train.head(10)))
        input_example = X_train.head(5)

        mlflow.lightgbm.log_model(
            lgb_model=model,
            artifact_path="model",
            signature=signature,
            input_example=input_example,
        )

        registered_version = None
        if register_model:
            reg = register_model_version(
                run_id=run_id,
                artifact_path="model",
                registered_model_name="PriceMind-Demand-LightGBM",
                tags={"framework": "lightgbm", "stage": "candidate"},
            )
            registered_version = reg.version

        logger.info(f"[TrainLightGBM] Complete. Test RMSE: {test_metrics['rmse']:.4f}, R²: {test_metrics['r2']:.4f}")

        return {
            "run_id": run_id,
            "model": model,
            "test_metrics": test_metrics,
            "registered_version": registered_version,
        }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = train_and_track_lightgbm()
    print("\n✓ LightGBM training and MLflow tracking complete:")
    print(f"  Run ID: {results['run_id']}")
    print(f"  Metrics: {results['test_metrics']}")
