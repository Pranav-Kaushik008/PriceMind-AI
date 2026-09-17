"""
PriceMind AI — Model Registry & Artifact Management
Handles model serialization, metadata logging, report export, and inference loading.
"""

from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
import json
import joblib
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class ModelRegistry:
    """
    Manages persistence and versioning for trained machine learning models and evaluation metrics.
    """

    def __init__(
        self,
        artifacts_dir: Optional[Path | str] = None,
        reports_dir: Optional[Path | str] = None,
    ):
        project_root = Path(__file__).resolve().parents[2]
        self.artifacts_dir = Path(artifacts_dir) if artifacts_dir else (project_root / "ml" / "artifacts")
        self.reports_dir = Path(reports_dir) if reports_dir else (project_root / "reports")

        self.models_dir = self.artifacts_dir / "models"
        self.metrics_dir = self.artifacts_dir / "metrics"
        self.predictions_dir = self.artifacts_dir / "predictions"

        # Ensure directories exist
        for d in [self.models_dir, self.metrics_dir, self.predictions_dir, self.reports_dir]:
            d.mkdir(parents=True, exist_ok=True)

    def save_model(
        self,
        model: Any,
        model_name: str,
        metadata: Dict[str, Any],
        is_production_candidate: bool = True,
    ) -> Dict[str, Path]:
        """
        Serializes model binary and associated metadata using joblib and JSON.
        """
        slug = model_name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("-", "_")
        model_filename = f"{slug}.joblib"
        model_path = self.models_dir / model_filename

        joblib.dump(model, model_path)
        logger.info(f"Serialized model saved to: {model_path}")

        # If designated as production candidate, save symlink / primary copy
        prod_path = None
        if is_production_candidate:
            prod_path = self.models_dir / "demand_model_production.joblib"
            joblib.dump(model, prod_path)
            logger.info(f"Production candidate saved to: {prod_path}")

        # Save metadata
        metadata_path = self.metrics_dir / f"{slug}_metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, default=str)

        return {
            "model_path": model_path,
            "production_path": prod_path,
            "metadata_path": metadata_path,
        }

    def load_model(self, model_path_or_name: Optional[str | Path] = None) -> Tuple[Any, Dict[str, Any]]:
        """
        Loads a serialized model and its metadata.
        Defaults to 'demand_model_production.joblib' if path is omitted.
        """
        if model_path_or_name is None:
            target_path = self.models_dir / "demand_model_production.joblib"
        else:
            p = Path(model_path_or_name)
            target_path = p if p.is_absolute() else (self.models_dir / p)

        if not target_path.exists():
            raise FileNotFoundError(f"Model artifact not found at: {target_path}")

        model = joblib.load(target_path)
        logger.info(f"Successfully loaded model from {target_path}")

        # Try to load metadata
        metadata = {}
        metadata_file = self.metrics_dir / "demand_model_production_metadata.json"
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)

        return model, metadata

    def export_reports(
        self,
        comparison_df: pd.DataFrame,
        predictions_df: pd.DataFrame,
    ) -> Dict[str, Path]:
        """
        Exports standardized reports for Module 4 benchmark review.
        """
        # 1. Model comparison report
        comp_report_path = self.reports_dir / "model_comparison.csv"
        comparison_df.to_csv(comp_report_path, index=False)

        # 2. Detailed metrics report
        metrics_report_path = self.reports_dir / "model_metrics.csv"
        comparison_df.to_csv(metrics_report_path, index=False)

        # 3. Prediction outputs in reports and artifacts
        pred_eval_path = self.reports_dir / "prediction_evaluation.csv"
        predictions_df.to_csv(pred_eval_path, index=False)

        pred_artifact_path = self.predictions_dir / "test_demand_predictions.csv"
        predictions_df.to_csv(pred_artifact_path, index=False)

        return {
            "model_comparison": comp_report_path,
            "model_metrics": metrics_report_path,
            "prediction_evaluation": pred_eval_path,
            "predictions_artifact": pred_artifact_path,
        }
