"""
backend/app/api/v1/endpoints/forecasts.py
-----------------------------------------
Demand forecasting endpoints (Module 5).
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import forecast_service
from app.schemas.forecast import ForecastResponse

router = APIRouter()


@router.get(
    "/{product_id}",
    response_model=ForecastResponse,
    summary="Get Demand Forecast for Product",
)
def get_forecast(
    product_id: str,
    horizon: int = Query(14, ge=1, le=90, description="Forecast horizon in days"),
    db: Session = Depends(get_db),
):
    """
    Retrieve time-series demand forecasts for a product over a given horizon (1-90 days).
    """
    try:
        return forecast_service.get_product_forecast(db, product_id, horizon_days=horizon)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting error: {e}",
        )
