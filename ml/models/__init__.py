"""
PriceMind AI — Demand Modeling & Prediction Package Public API
"""

from typing import Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

from ml.models.baseline import (
    HistoricalMeanBaseline,
    Lag1NaiveBaseline,
    Seasonal7DayNaiveBaseline,
)
from ml.models.preprocessing import DataSplitter, FeaturePreprocessor
from ml.models.evaluate import ModelEvaluator
from ml.models.train import DemandModelTrainer
from ml.models.model_registry import ModelRegistry


def train_model(
    df: pd.DataFrame,
    target_col: str = "units_sold",
    random_seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Convenience wrapper to train and benchmark all candidate demand models.
    """
    trainer = DemandModelTrainer(random_seed=random_seed, target_col=target_col)
    return trainer.train_and_benchmark_all(df)


def evaluate_model(
    y_true: np.ndarray | pd.Series,
    y_pred: np.ndarray | pd.Series,
    model_name: str = "Model",
) -> Dict[str, Any]:
    """
    Convenience wrapper to compute regression evaluation metrics.
    """
    return ModelEvaluator.calculate_metrics(y_true, y_pred, model_name=model_name)


def save_model(
    model: Any,
    model_name: str,
    metadata: Dict[str, Any],
    is_production_candidate: bool = True,
) -> Dict[str, Any]:
    """
    Convenience wrapper to persist a trained model and its metadata.
    """
    registry = ModelRegistry()
    return registry.save_model(model, model_name, metadata, is_production_candidate)


def load_model(model_path_or_name: Optional[str] = None) -> Tuple[Any, Dict[str, Any]]:
    """
    Convenience wrapper to load a serialized demand model.
    """
    registry = ModelRegistry()
    return registry.load_model(model_path_or_name)


def predict_demand(model: Any, X: pd.DataFrame) -> np.ndarray:
    """
    Convenience wrapper to generate non-negative demand predictions.
    """
    preds = model.predict(X)
    return np.maximum(0.0, np.round(preds, 2))


__all__ = [
    "DemandModelTrainer",
    "ModelEvaluator",
    "ModelRegistry",
    "DataSplitter",
    "FeaturePreprocessor",
    "HistoricalMeanBaseline",
    "Lag1NaiveBaseline",
    "Seasonal7DayNaiveBaseline",
    "train_model",
    "evaluate_model",
    "save_model",
    "load_model",
    "predict_demand",
]
