from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

MOCK_COMPETITORS = [
    {
        "competitorId": "comp-1",
        "competitorName": "Apex Industrial Supply",
        "skuCode": "SKU-8921-PRO",
        "price": 435.00,
        "shippingCost": 0,
        "inStock": True,
        "lastUpdated": "20 minutes ago",
        "priceDelta7d": 3.5,
    },
    {
        "competitorId": "comp-2",
        "competitorName": "OmniVanguard Global",
        "skuCode": "SKU-8921-PRO",
        "price": 415.00,
        "shippingCost": 15.00,
        "inStock": True,
        "lastUpdated": "1 hour ago",
        "priceDelta7d": 0.0,
    },
    {
        "competitorId": "comp-3",
        "competitorName": "SensorTech Dynamics",
        "skuCode": "SKU-3320-SENS",
        "price": 143.50,
        "shippingCost": 0,
        "inStock": True,
        "lastUpdated": "5 minutes ago",
        "priceDelta7d": -2.4,
    },
]

@router.get("/")
def get_competitor_telemetry():
    """Retrieve live competitor scraping telemetry."""
    return MOCK_COMPETITORS
