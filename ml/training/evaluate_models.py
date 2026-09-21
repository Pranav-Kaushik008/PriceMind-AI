"""
ml/training/evaluate_models.py
------------------------------
Structured benchmark and comparison across all tracked candidate models.
"""

from pathlib import Path
import logging
import pandas as pd
import mlflow
from mlflow.tracking import MlflowClient

from ml.tracking.mlflow_config import setup_mlflow, EXPERIMENT_DEMAND_PREDICTION

logger = logging.getLogger(__name__)


def compare_mlflow_runs(
    experiment_name: str = EXPERIMENT_DEMAND_PREDICTION,
) -> pd.DataFrame:
    """
    Query MLflow tracking backend and build a structured comparison table of all candidate models.
    """
    setup_mlflow()
    client = MlflowClient()
    experiment = client.get_experiment_by_name(experiment_name)

    if experiment is None:
        return pd.DataFrame()

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["metrics.test_rmse ASC"],
    )

    records = []
    for r in runs:
        metrics = r.data.metrics
        params = r.data.params
        tags = r.data.tags

        records.append({
            "run_id": r.info.run_id[:8],
            "model_type": params.get("model_type", tags.get("mlflow.runName", "Unknown")),
            "test_rmse": round(metrics.get("test_rmse", float("nan")), 4),
            "test_mae": round(metrics.get("test_mae", float("nan")), 4),
            "test_r2": round(metrics.get("test_r2", float("nan")), 4),
            "test_mape": round(metrics.get("test_mape", float("nan")), 4),
            "train_duration_sec": round(metrics.get("train_duration_sec", 0.0), 3),
            "status": r.info.status,
            "end_time": pd.to_datetime(r.info.end_time, unit="ms") if r.info.end_time else None,
        })

    df = pd.DataFrame(records)
    if not df.empty and "test_rmse" in df.columns:
        df = df.sort_values("test_rmse", ascending=True).reset_index(drop=True)
    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    comp = compare_mlflow_runs()
    print("\n=== MLflow Model Comparison Table ===")
    print(comp.to_string(index=False) if not comp.empty else "No runs found.")
