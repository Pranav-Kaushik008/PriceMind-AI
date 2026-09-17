from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional
from datetime import datetime
from app.schemas.pricing import RecommendationResponse

router = APIRouter()

MOCK_RECOMMENDATIONS = [
    {
        "id": "rec-101",
        "skuId": "sku-1",
        "skuCode": "SKU-8921-PRO",
        "skuName": "Precision Industrial Calibrator X1",
        "category": "Hardware & Tools",
        "channel": "Direct",
        "currentPrice": 389.00,
        "recommendedPrice": 419.00,
        "priceDeltaPercent": 7.71,
        "currentMarginPercent": 46.02,
        "projectedMarginPercent": 49.88,
        "projectedRevenueDelta": 37800,
        "projectedVolumeDeltaPercent": -2.8,
        "confidenceScore": 94.8,
        "urgency": "immediate",
        "status": "pending",
        "primaryDriver": "Inelasticity Zone & Competitor Parity Deficit",
        "rationale": "Product exhibits low price sensitivity (Ed = -0.62). Primary competitor raised price with zero volume churn.",
        "guardrailChecks": {
            "marginFloorPassed": True,
            "competitorIndexWithinBounds": True,
            "inventoryDepletionSafe": True,
            "brandErosionRiskLow": True,
        },
        "elasticityAtPoint": -0.62,
        "shapAttribution": [
            {"feature": "Competitor Price Index Spread", "impactPercent": 4.2, "description": "Competitor pricing is +6.7% above current list."},
            {"feature": "Empirical Low Inelasticity", "impactPercent": 2.8, "description": "B2B buyers have qualification lock-in."},
            {"feature": "Inventory Runway Balance (29d)", "impactPercent": 0.9, "description": "Optimal stock levels prevent stockout risk."},
        ],
    },
    {
        "id": "rec-102",
        "skuId": "sku-3",
        "skuCode": "SKU-6109-OPT",
        "skuName": "FiberOptic Multiplexer 40Gbps Rack Unit",
        "category": "Telecommunications",
        "channel": "B2B Direct",
        "currentPrice": 1250.00,
        "recommendedPrice": 1349.00,
        "priceDeltaPercent": 7.92,
        "currentMarginPercent": 45.60,
        "projectedMarginPercent": 49.59,
        "projectedRevenueDelta": 64350,
        "projectedVolumeDeltaPercent": -1.6,
        "confidenceScore": 96.2,
        "urgency": "immediate",
        "status": "pending",
        "primaryDriver": "Extreme Supply Constrained Demand Inelasticity",
        "rationale": "Inventory runway is down to 14 days amidst strong enterprise pipeline.",
        "guardrailChecks": {
            "marginFloorPassed": True,
            "competitorIndexWithinBounds": True,
            "inventoryDepletionSafe": True,
            "brandErosionRiskLow": True,
        },
        "elasticityAtPoint": -0.38,
        "shapAttribution": [
            {"feature": "Stock Run-out Velocity Factor", "impactPercent": 4.8, "description": "Burn rate exceeds replenishment by 18%."},
            {"feature": "Market Lead Time Advantage", "impactPercent": 2.4, "description": "Competitors out of stock for 4-6 weeks."},
        ],
    },
]

@router.get("/", response_model=List[RecommendationResponse])
def get_recommendations(status: Optional[str] = None):
    """List pending or applied pricing optimization recommendations."""
    if status and status.lower() != "all":
        return [r for r in MOCK_RECOMMENDATIONS if r["status"].lower() == status.lower()]
    return MOCK_RECOMMENDATIONS

@router.patch("/{rec_id}/status", response_model=RecommendationResponse)
def update_recommendation_status(rec_id: str, new_status: str = Body(..., embed=True)):
    """Approve, reject, or mark a pricing recommendation as synced."""
    for r in MOCK_RECOMMENDATIONS:
        if r["id"] == rec_id:
            r["status"] = new_status
            if new_status == "applied":
                r["appliedAt"] = datetime.utcnow().isoformat()
            return r
    raise HTTPException(status_code=404, detail=f"Recommendation {rec_id} not found")
