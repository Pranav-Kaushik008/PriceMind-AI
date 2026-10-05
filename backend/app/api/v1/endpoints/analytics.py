"""
backend/app/api/v1/endpoints/analytics.py
-----------------------------------------
Analytics and KPI overview endpoints.
"""

from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_optional_current_user
from app.models.user import User
from app.services import analytics_service
from app.schemas.analytics import AnalyticsOverviewResponse
from app.schemas.pricing import KPIResponse

router = APIRouter()


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Portfolio Analytics Overview",
)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Retrieve real aggregated overview metrics from database records scoped to tenant."""
    org_id = current_user.organization_id if current_user else None
    return analytics_service.get_analytics_overview(db, organization_id=org_id)


@router.get(
    "/kpis",
    response_model=List[KPIResponse],
    summary="Executive Dashboard KPIs",
)
def get_executive_kpis(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Retrieve executive KPI telemetry scoped to tenant."""
    org_id = current_user.organization_id if current_user else None
    return analytics_service.get_executive_kpis(db, organization_id=org_id)
