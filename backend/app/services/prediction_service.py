"""
backend/app/services/prediction_service.py
------------------------------------------
Service layer for demand prediction (Module 4).
Loads and caches the production XGBoost model artifact.
"""

from datetime import datetime, date, timezone
from pathlib import Path
from typing import Optional, Dict, Any
import logging
import joblib
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.prediction import DemandPrediction
from app.repositories.analytics_repo import save_prediction
from app.services.product_service import get_product_by_id_or_sku
from app.schemas.prediction import PredictionRequest, PredictionResponse

logger = logging.getLogger(__name__)

# Model artifact paths
ROOT_DIR = Path(__file__).resolve().parents[3]
MODEL_PATH = ROOT_DIR / "ml" / "artifacts" / "models" / "demand_model_production.joblib"
FEATURES_PATH = ROOT_DIR / "data" / "processed" / "features.parquet"

# Cached instances
_cached_model = None
_cached_feature_names = None
_cached_features_df = None


def get_model():
    global _cached_model, _cached_feature_names
    if _cached_model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Production demand model not found at: {MODEL_PATH}")
        _cached_model = joblib.load(MODEL_PATH)
        if hasattr(_cached_model, "feature_names_in_"):
            _cached_feature_names = list(_cached_model.feature_names_in_)
        logger.info(f"[PredictionService] Loaded model: {type(_cached_model).__name__} with {len(_cached_feature_names or [])} features")
    return _cached_model, _cached_feature_names


def get_feature_context() -> Optional[pd.DataFrame]:
    global _cached_features_df
    if _cached_features_df is None and FEATURES_PATH.exists():
        _cached_features_df = pd.read_parquet(FEATURES_PATH)
    return _cached_features_df


def predict_demand(
    db: Session,
    request: PredictionRequest,
) -> PredictionResponse:
    """
    Score demand for a product at a given price point.
    Constructs feature row from latest historical context with price override.
    """
    product = get_product_by_id_or_sku(db, request.product_id)
    if not product:
        raise ValueError(f"Product not found: {request.product_id}")

    model, feature_names = get_model()
    features_df = get_feature_context()

    # Build feature row
    sku_id = product.external_product_id
    feature_row = None
    if features_df is not None and "sku_id" in features_df.columns:
        sku_features = features_df[features_df["sku_id"] == sku_id]
        if not sku_features.empty:
            feature_row = sku_features.tail(1).copy()

    if feature_row is None:
        # Construct fallback dictionary
        feature_row = pd.DataFrame([{f: 0.0 for f in feature_names}])

    # Override price and relevant features
    if "price" in feature_row.columns:
        feature_row["price"] = request.price
    if request.is_promotion is not None and "is_promotion" in feature_row.columns:
        feature_row["is_promotion"] = int(request.is_promotion)
    if request.competitor_price is not None and "competitor_price" in feature_row.columns:
        feature_row["competitor_price"] = request.competitor_price
    if request.inventory_level is not None and "inventory_level" in feature_row.columns:
        feature_row["inventory_level"] = request.inventory_level

    # Ensure all model features exist
    for col in feature_names:
        if col not in feature_row.columns:
            feature_row[col] = 0.0

    X_eval = feature_row[feature_names]
    raw_pred = float(model.predict(X_eval)[0])
    predicted_demand = max(0.0, round(raw_pred, 2))

    pred_date = request.prediction_date or date.today()
    model_name = type(model).__name__
    model_version = "v1"

    pred_record = None
    if request.persist:
        pred_record = save_prediction(
            db,
            product_id=product.id,
            prediction_date=pred_date,
            predicted_demand=predicted_demand,
            price_at_prediction=request.price,
            model_name=model_name,
            model_version=model_version,
        )
        db.commit()

    return PredictionResponse(
        id=pred_record.id if pred_record else None,
        product_id=product.id,
        external_product_id=product.external_product_id,
        prediction_date=str(pred_date),
        price=request.price,
        predicted_demand=predicted_demand,
        model_name=model_name,
        model_version=model_version,
        predicted_at=datetime.now(timezone.utc).isoformat(),
        feature_count=len(feature_names),
    )
