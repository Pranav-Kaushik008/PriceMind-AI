"""
backend/app/repositories/analytics_repo.py
--------------------------------------------
Data-access functions for SalesRecord, ElasticityResult, DemandPrediction,
Forecast, PricingRecommendation, PricingSimulation, and SHAPExplanation.
"""

import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.models.sales_record import SalesRecord
from app.models.elasticity import ElasticityResult
from app.models.prediction import DemandPrediction
from app.models.forecast import Forecast
from app.models.pricing import PricingRecommendation, PricingSimulation
from app.models.explanation import SHAPExplanation
from app.models.model_registry import MLModelRegistry, OptimizationRun


# ── SalesRecord ────────────────────────────────────────────────────────────────

def bulk_insert_sales_records(db: Session, records: List[dict]) -> int:
    """Bulk-insert sales records. Returns count inserted."""
    if not records:
        return 0
    objs = [SalesRecord(id=str(uuid.uuid4()), **r) for r in records]
    db.bulk_save_objects(objs)
    db.flush()
    return len(objs)


def get_sales_records(
    db: Session,
    product_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[SalesRecord]:
    q = select(SalesRecord).where(SalesRecord.product_id == product_id)
    if start_date:
        q = q.where(SalesRecord.record_date >= start_date)
    if end_date:
        q = q.where(SalesRecord.record_date <= end_date)
    return list(db.scalars(q.order_by(SalesRecord.record_date)))


# ── ElasticityResult ────────────────────────────────────────────────────────────

def save_elasticity(db: Session, **kwargs) -> ElasticityResult:
    result = ElasticityResult(id=str(uuid.uuid4()), **kwargs)
    db.add(result)
    db.flush()
    return result


def get_elasticity(db: Session, product_id: str) -> Optional[ElasticityResult]:
    return db.scalar(
        select(ElasticityResult)
        .where(ElasticityResult.product_id == product_id)
        .order_by(ElasticityResult.created_at.desc())
        .limit(1)
    )


# ── DemandPrediction ────────────────────────────────────────────────────────────

def save_prediction(db: Session, **kwargs) -> DemandPrediction:
    pred = DemandPrediction(id=str(uuid.uuid4()), **kwargs)
    db.add(pred)
    db.flush()
    return pred


def get_predictions(
    db: Session,
    product_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[DemandPrediction]:
    q = select(DemandPrediction).where(DemandPrediction.product_id == product_id)
    if start_date:
        q = q.where(DemandPrediction.prediction_date >= start_date)
    if end_date:
        q = q.where(DemandPrediction.prediction_date <= end_date)
    return list(db.scalars(q.order_by(DemandPrediction.prediction_date)))


# ── Forecast ────────────────────────────────────────────────────────────────────

def save_forecast(db: Session, **kwargs) -> Forecast:
    obj = Forecast(id=str(uuid.uuid4()), **kwargs)
    db.add(obj)
    db.flush()
    return obj


def bulk_insert_forecasts(db: Session, records: List[dict]) -> int:
    objs = [Forecast(id=str(uuid.uuid4()), **r) for r in records]
    db.bulk_save_objects(objs)
    db.flush()
    return len(objs)


def get_forecast(
    db: Session,
    product_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[Forecast]:
    q = select(Forecast).where(Forecast.product_id == product_id)
    if start_date:
        q = q.where(Forecast.forecast_date >= start_date)
    if end_date:
        q = q.where(Forecast.forecast_date <= end_date)
    return list(db.scalars(q.order_by(Forecast.forecast_date)))


# ── PricingRecommendation ────────────────────────────────────────────────────────

def save_recommendation(db: Session, **kwargs) -> PricingRecommendation:
    rec = PricingRecommendation(id=str(uuid.uuid4()), **kwargs)
    db.add(rec)
    db.flush()
    return rec


def get_recommendation(db: Session, product_id: str) -> Optional[PricingRecommendation]:
    return db.scalar(
        select(PricingRecommendation)
        .where(PricingRecommendation.product_id == product_id)
        .order_by(PricingRecommendation.created_at.desc())
        .limit(1)
    )


def list_recommendations(db: Session, status: Optional[str] = None) -> List[PricingRecommendation]:
    q = select(PricingRecommendation)
    if status:
        q = q.where(PricingRecommendation.status == status)
    return list(db.scalars(q.order_by(PricingRecommendation.created_at.desc())))


# ── PricingSimulation ────────────────────────────────────────────────────────────

def save_simulation(db: Session, **kwargs) -> PricingSimulation:
    obj = PricingSimulation(id=str(uuid.uuid4()), **kwargs)
    db.add(obj)
    db.flush()
    return obj


def bulk_insert_simulations(db: Session, records: List[dict]) -> int:
    objs = [PricingSimulation(id=str(uuid.uuid4()), **r) for r in records]
    db.bulk_save_objects(objs)
    db.flush()
    return len(objs)


# ── SHAPExplanation ────────────────────────────────────────────────────────────

def save_explanation(db: Session, **kwargs) -> SHAPExplanation:
    exp = SHAPExplanation(id=str(uuid.uuid4()), **kwargs)
    db.add(exp)
    db.flush()
    return exp


def get_explanation(db: Session, product_id: str, explanation_type: str = "local") -> Optional[SHAPExplanation]:
    return db.scalar(
        select(SHAPExplanation)
        .where(
            and_(
                SHAPExplanation.product_id == product_id,
                SHAPExplanation.explanation_type == explanation_type,
            )
        )
        .order_by(SHAPExplanation.created_at.desc())
        .limit(1)
    )


# ── MLModelRegistry ────────────────────────────────────────────────────────────

def save_model_metadata(db: Session, **kwargs) -> MLModelRegistry:
    obj = MLModelRegistry(id=str(uuid.uuid4()), **kwargs)
    db.add(obj)
    db.flush()
    return obj


def get_model_metadata(db: Session, model_name: str, version: str = "v1") -> Optional[MLModelRegistry]:
    return db.scalar(
        select(MLModelRegistry)
        .where(
            and_(
                MLModelRegistry.model_name == model_name,
                MLModelRegistry.version == version,
            )
        )
    )


# ── OptimizationRun ────────────────────────────────────────────────────────────

def create_optimization_run(db: Session, **kwargs) -> OptimizationRun:
    obj = OptimizationRun(id=str(uuid.uuid4()), **kwargs)
    db.add(obj)
    db.flush()
    return obj


def update_optimization_run(db: Session, run_id: str, **kwargs) -> Optional[OptimizationRun]:
    obj = db.scalar(select(OptimizationRun).where(OptimizationRun.run_id == run_id))
    if obj:
        for k, v in kwargs.items():
            setattr(obj, k, v)
        db.flush()
    return obj
