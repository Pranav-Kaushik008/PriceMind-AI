"""
backend/app/services/pricing_service.py
-----------------------------------------
Business logic for pricing recommendations and simulations.
Combines repositories with business rules — keeps DB logic out of route handlers.
"""

from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.analytics_repo import (
    save_recommendation,
    get_recommendation,
    list_recommendations,
    save_simulation,
    bulk_insert_simulations,
)
from app.models.pricing import PricingRecommendation, PricingSimulation


def record_pricing_recommendation(
    db: Session,
    product_id: str,
    current_price: float,
    recommended_price: float,
    objective: str = "PROFIT_MAX",
    **kwargs,
) -> PricingRecommendation:
    """Persist a pricing recommendation inside an existing transaction."""
    price_change_pct = ((recommended_price - current_price) / current_price) * 100.0 if current_price else None
    rec = save_recommendation(
        db,
        product_id=product_id,
        current_price=current_price,
        recommended_price=recommended_price,
        price_change_pct=price_change_pct,
        objective=objective,
        **kwargs,
    )
    return rec


def get_latest_recommendation(db: Session, product_id: str) -> Optional[PricingRecommendation]:
    return get_recommendation(db, product_id)


def list_all_recommendations(db: Session, status: Optional[str] = None) -> List[PricingRecommendation]:
    return list_recommendations(db, status=status)


def record_simulation_batch(
    db: Session,
    product_id: str,
    simulation_run_id: str,
    simulation_rows: List[dict],
) -> int:
    """Persist a batch of what-if simulation rows."""
    records = [
        {**row, "product_id": product_id, "simulation_run_id": simulation_run_id}
        for row in simulation_rows
    ]
    return bulk_insert_simulations(db, records)
