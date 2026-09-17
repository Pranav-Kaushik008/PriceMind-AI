from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.schemas.pricing import SKUResponse

router = APIRouter()

MOCK_SKUS = [
    {
        "id": "sku-1",
        "skuCode": "SKU-8921-PRO",
        "name": "Precision Industrial Calibrator X1",
        "category": "Hardware & Tools",
        "channel": "Direct",
        "currentPrice": 389.00,
        "costPrice": 210.00,
        "marginPercent": 46.0,
        "currentVelocity": 42,
        "inventoryStock": 1240,
        "daysOfInventory": 29,
        "elasticityScore": -0.62,
        "elasticityCategory": "inelastic",
        "competitorMinPrice": 399.00,
        "competitorAvgPrice": 415.00,
        "competitorMaxPrice": 440.00,
        "pricePosition": "discount",
        "revenueRiskScore": 12,
        "recommendedPrice": 419.00,
        "projectedUpliftPercent": 7.7,
    },
    {
        "id": "sku-2",
        "skuCode": "SKU-4402-AIR",
        "name": "AeroStream Commercial Turbine Fan 300",
        "category": "HVAC & Air Handling",
        "channel": "Wholesale",
        "currentPrice": 849.00,
        "costPrice": 520.00,
        "marginPercent": 38.75,
        "currentVelocity": 18,
        "inventoryStock": 340,
        "daysOfInventory": 19,
        "elasticityScore": -1.88,
        "elasticityCategory": "elastic",
        "competitorMinPrice": 799.00,
        "competitorAvgPrice": 830.00,
        "competitorMaxPrice": 890.00,
        "pricePosition": "premium",
        "revenueRiskScore": 68,
        "recommendedPrice": 819.00,
        "projectedUpliftPercent": 4.8,
    },
    {
        "id": "sku-3",
        "skuCode": "SKU-6109-OPT",
        "name": "FiberOptic Multiplexer 40Gbps Rack Unit",
        "category": "Telecommunications",
        "channel": "B2B Direct",
        "currentPrice": 1250.00,
        "costPrice": 680.00,
        "marginPercent": 45.6,
        "currentVelocity": 65,
        "inventoryStock": 890,
        "daysOfInventory": 14,
        "elasticityScore": -0.38,
        "elasticityCategory": "highly_inelastic",
        "competitorMinPrice": 1290.00,
        "competitorAvgPrice": 1380.00,
        "competitorMaxPrice": 1495.00,
        "pricePosition": "discount",
        "revenueRiskScore": 8,
        "recommendedPrice": 1349.00,
        "projectedUpliftPercent": 7.9,
    },
    {
        "id": "sku-4",
        "skuCode": "SKU-3320-SENS",
        "name": "Multi-Spectrum Ambient Sensor Array",
        "category": "IoT & Sensors",
        "channel": "Amazon",
        "currentPrice": 149.00,
        "costPrice": 72.00,
        "marginPercent": 51.68,
        "currentVelocity": 110,
        "inventoryStock": 3850,
        "daysOfInventory": 35,
        "elasticityScore": -2.35,
        "elasticityCategory": "highly_elastic",
        "competitorMinPrice": 139.00,
        "competitorAvgPrice": 145.00,
        "competitorMaxPrice": 160.00,
        "pricePosition": "premium",
        "revenueRiskScore": 74,
        "recommendedPrice": 142.00,
        "projectedUpliftPercent": 6.2,
    },
    {
        "id": "sku-5",
        "skuCode": "SKU-9901-SER",
        "name": "UltraCore Edge Server Module E-8",
        "category": "Computing Infrastructure",
        "channel": "Direct",
        "currentPrice": 2850.00,
        "costPrice": 1750.00,
        "marginPercent": 38.6,
        "currentVelocity": 9,
        "inventoryStock": 95,
        "daysOfInventory": 11,
        "elasticityScore": -0.45,
        "elasticityCategory": "inelastic",
        "competitorMinPrice": 2900.00,
        "competitorAvgPrice": 3050.00,
        "competitorMaxPrice": 3200.00,
        "pricePosition": "discount",
        "revenueRiskScore": 15,
        "recommendedPrice": 2995.00,
        "projectedUpliftPercent": 5.1,
    },
    {
        "id": "sku-6",
        "skuCode": "SKU-5120-VAL",
        "name": "Hydraulic High-Pressure Relief Valve 5K",
        "category": "Fluid Mechanics",
        "channel": "Wholesale",
        "currentPrice": 420.00,
        "costPrice": 240.00,
        "marginPercent": 42.86,
        "currentVelocity": 34,
        "inventoryStock": 2400,
        "daysOfInventory": 70,
        "elasticityScore": -1.25,
        "elasticityCategory": "elastic",
        "competitorMinPrice": 410.00,
        "competitorAvgPrice": 430.00,
        "competitorMaxPrice": 460.00,
        "pricePosition": "parity",
        "revenueRiskScore": 42,
        "recommendedPrice": 399.00,
        "projectedUpliftPercent": 8.9,
    },
]

@router.get("/", response_model=List[SKUResponse])
def list_products(
    category: Optional[str] = Query(None, description="Filter by product category"),
    search: Optional[str] = Query(None, description="Search query by SKU code or name"),
):
    """List product catalog with margin, velocity, and elasticity telemetry."""
    results = MOCK_SKUS
    if category and category.lower() != "all":
        results = [s for s in results if s["category"].lower() == category.lower()]
    if search:
        q = search.lower()
        results = [s for s in results if q in s["skuCode"].lower() or q in s["name"].lower()]
    return results

@router.get("/{sku_code}", response_model=SKUResponse)
def get_product(sku_code: str):
    """Retrieve detailed SKU profile."""
    for s in MOCK_SKUS:
        if s["skuCode"].lower() == sku_code.lower() or s["id"] == sku_code:
            return s
    raise HTTPException(status_code=404, detail=f"Product {sku_code} not found")
