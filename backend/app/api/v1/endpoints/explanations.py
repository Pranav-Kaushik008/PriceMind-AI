"""
backend/app/api/v1/endpoints/explanations.py
-------------------------------------------
SHAP Explainability endpoints (Module 7).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import explanation_service
from app.schemas.explanation import (
    PredictionExplanationRequest,
    PredictionExplanationResponse,
    PricingExplanationRequest,
    PricingExplanationResponse,
)

router = APIRouter()


@router.post(
    "/prediction",
    response_model=PredictionExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Explain Prediction with Local SHAP",
)
def explain_prediction(
    request: PredictionExplanationRequest,
    db: Session = Depends(get_db),
):
    """
    Calculate local SHAP feature attributions explaining model prediction for a product/price.
    """
    try:
        return explanation_service.explain_prediction(db, request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SHAP explanation failed: {e}",
        )


@router.post(
    "/pricing",
    response_model=PricingExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Explain Pricing Scenario Shift with SHAP",
)
def explain_pricing(
    request: PricingExplanationRequest,
    db: Session = Depends(get_db),
):
    """
    Explain model behavior differences between current price and recommended price.
    Separates model signals from business constraints.
    """
    try:
        return explanation_service.explain_pricing_recommendation(db, request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pricing explanation failed: {e}",
        )
