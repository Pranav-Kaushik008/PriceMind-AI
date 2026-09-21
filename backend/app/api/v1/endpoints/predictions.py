"""
backend/app/api/v1/endpoints/predictions.py
-------------------------------------------
Demand prediction endpoints (Module 4).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import prediction_service
from app.schemas.prediction import PredictionRequest, PredictionResponse

router = APIRouter()


@router.post(
    "",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Demand for Product at Price",
)
@router.post("/", response_model=PredictionResponse, include_in_schema=False)
def create_prediction(
    request: PredictionRequest,
    db: Session = Depends(get_db),
):
    """
    Score demand for a product under given price and market conditions using the trained XGBoost model.
    """
    try:
        return prediction_service.predict_demand(db, request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model artifact unavailable: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction calculation failed: {e}",
        )
