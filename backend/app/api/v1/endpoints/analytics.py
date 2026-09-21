"""
backend/app/api/v1/endpoints/analytics.py
-----------------------------------------
Analytics and KPI overview endpoints.
"""

from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import analytics_service
from app.schemas.analytics import AnalyticsOverviewResponse
from app.schemas.pricing import KPIResponse

router = APIRouter()


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Portfolio Analytics Overview",
)
def get_analytics_overview(db: Session = Depends(get_db)):
    """Retrieve real aggregated overview metrics from database records."""
    return analytics_service.get_analytics_overview(db)


@router.get(
    "/kpis",
    response_model=List[KPIResponse],
    summary="Executive Dashboard KPIs",
)
def get_executive_kpis(db: Session = Depends(get_db)):
    """Retrieve executive KPI telemetry."""
    return analytics_service.get_executive_kpis(db)
