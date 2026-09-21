"""
ml/tracking/tracking_utils.py
-----------------------------
Standardized logging helpers for parameters, metrics, artifacts, and signatures.
"""

import os
import json
import tempfile
from pathlib import Path
from typing import Dict, Any, List, Optional
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
import mlflow.xgboost
import mlflow.lightgbm
from mlflow.models.signature import infer_signature


def log_dataset_metadata(
    dataset_name: str,
    n_rows: int,
    n_features: int,
    train_dates: Optional[tuple] = None,
    val_dates: Optional[tuple] = None,
    test_dates: Optional[tuple] = None,
    feature_version: str = "v1",
):
    """Log dataset information and version tags."""
    tags = {
        "dataset.name": dataset_name,
        "dataset.n_rows": str(n_rows),
        "dataset.n_features": str(n_features),
        "feature.version": feature_version,
    }
    if train_dates:
        tags["dataset.train_period"] = f"{train_dates[0]} to {train_dates[1]}"
    if test_dates:
        tags["dataset.test_period"] = f"{test_dates[0]} to {test_dates[1]}"

    mlflow.set_tags(tags)


def log_model_parameters(
    model_type: str,
    hyperparameters: Dict[str, Any],
    target_col: str = "units_sold",
    random_seed: int = 42,
):
    """Log model hyperparameters and metadata."""
    params = {
        "model_type": model_type,
        "target_col": target_col,
        "random_seed": random_seed,
    }
    for k, v in hyperparameters.items():
        if isinstance(v, (int, float, str, bool)):
            params[f"hp.{k}"] = v
    mlflow.log_params(params)


def log_evaluation_metrics(
    metrics: Dict[str, float],
    prefix: str = "test",
):
    """Log performance metrics (e.g. MAE, RMSE, R2, MAPE)."""
    log_dict = {}
    for k, v in metrics.items():
        if isinstance(v, (int, float)) and np.isfinite(v):
            key = f"{prefix}_{k}" if prefix else k
            log_dict[key] = float(v)
    mlflow.log_metrics(log_dict)


def log_feature_artifacts(
    feature_names: List[str],
    feature_importances: Optional[Dict[str, float]] = None,
):
    """Save and log feature list JSON and importance plot as artifacts."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # 1. Feature names JSON
        features_file = tmp_path / "feature_names.json"
        with open(features_file, "w") as f:
            json.dump({"feature_names": feature_names, "count": len(feature_names)}, f, indent=2)
        mlflow.log_artifact(str(features_file), artifact_path="metadata")

        # 2. Feature importance plot
        if feature_importances:
            imp_df = pd.DataFrame(
                list(feature_importances.items()), columns=["feature", "importance"]
            ).sort_values("importance", ascending=False).head(20)

            fig, ax = plt.subplots(figsize=(8, 6))
            ax.barh(imp_df["feature"][::-1], imp_df["importance"][::-1], color="steelblue")
            ax.set_title("Top 20 Feature Importances")
            ax.set_xlabel("Importance")
            plt.tight_layout()

            plot_path = tmp_path / "feature_importance.png"
            plt.savefig(plot_path, dpi=120)
            plt.close(fig)

            mlflow.log_artifact(str(plot_path), artifact_path="plots")


def log_evaluation_plots(
    y_actual: np.ndarray,
    y_pred: np.ndarray,
    model_name: str = "Model",
):
    """Generate and log actual vs predicted and residual evaluation plots."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # 1. Actual vs Predicted
        fig, ax = plt.subplots(figsize=(7, 5))
        ax.scatter(y_actual, y_pred, alpha=0.5, color="teal", s=15)
        min_val = min(float(y_actual.min()), float(y_pred.min()))
        max_val = max(float(y_actual.max()), float(y_pred.max()))
        ax.plot([min_val, max_val], [min_val, max_val], "r--", label="Ideal")
        ax.set_xlabel("Actual Demand (Units)")
        ax.set_ylabel("Predicted Demand (Units)")
        ax.set_title(f"{model_name}: Actual vs Predicted Demand")
        ax.legend()
        plt.tight_layout()

        pred_plot = tmp_path / "actual_vs_predicted.png"
        plt.savefig(pred_plot, dpi=120)
        plt.close(fig)
        mlflow.log_artifact(str(pred_plot), artifact_path="plots")

        # 2. Residuals
        residuals = y_actual - y_pred
        fig, ax = plt.subplots(figsize=(7, 4))
        ax.hist(residuals, bins=30, color="indianred", edgecolor="black", alpha=0.7)
        ax.axvline(0, color="black", linestyle="--", linewidth=1.2)
        ax.set_xlabel("Residual (Actual - Predicted)")
        ax.set_ylabel("Frequency")
        ax.set_title(f"{model_name}: Residual Distribution")
        plt.tight_layout()

        res_plot = tmp_path / "residual_distribution.png"
        plt.savefig(res_plot, dpi=120)
        plt.close(fig)
        mlflow.log_artifact(str(res_plot), artifact_path="plots")
