from fastapi import APIRouter
from typing import List, Dict, Any
from app.schemas.pricing import ElasticityPoint

router = APIRouter()

MOCK_CURVES = {
    "SKU-8921-PRO": [
        {"price": 340, "demandUnits": 58, "revenue": 19720, "grossMarginDollars": 7540, "grossMarginPercent": 38.2, "isCurrent": False, "isOptimalRevenue": False, "isOptimalMargin": False},
        {"price": 360, "demandUnits": 52, "revenue": 18720, "grossMarginDollars": 7800, "grossMarginPercent": 41.7, "isCurrent": False, "isOptimalRevenue": False, "isOptimalMargin": False},
        {"price": 380, "demandUnits": 46, "revenue": 17480, "grossMarginDollars": 7820, "grossMarginPercent": 44.7, "isCurrent": False, "isOptimalRevenue": False, "isOptimalMargin": False},
        {"price": 389, "demandUnits": 42, "revenue": 16338, "grossMarginDollars": 7518, "grossMarginPercent": 46.0, "isCurrent": True, "isOptimalRevenue": False, "isOptimalMargin": False},
        {"price": 400, "demandUnits": 41, "revenue": 16400, "grossMarginDollars": 7790, "grossMarginPercent": 47.5, "isCurrent": False, "isOptimalRevenue": False, "isOptimalMargin": False},
        {"price": 419, "demandUnits": 40, "revenue": 16760, "grossMarginDollars": 8360, "grossMarginPercent": 49.9, "isCurrent": False, "isOptimalRevenue": True, "isOptimalMargin": True},
        {"price": 440, "demandUnits": 36, "revenue": 15840, "grossMarginDollars": 8280, "grossMarginPercent": 52.3, "isCurrent": False, "isOptimalRevenue": False, "isOptimalMargin": False},
        {"price": 460, "demandUnits": 30, "revenue": 13800, "grossMarginDollars": 7500, "grossMarginPercent": 54.3, "isCurrent": False, "isOptimalRevenue": False, "isOptimalMargin": False},
    ]
}

@router.get("/{sku_code}", response_model=List[ElasticityPoint])
def get_elasticity_curve(sku_code: str):
    """Retrieve non-linear price elasticity curve for a given SKU."""
    return MOCK_CURVES.get(sku_code.upper(), MOCK_CURVES["SKU-8921-PRO"])
