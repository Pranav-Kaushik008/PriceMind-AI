from fastapi import APIRouter
from typing import List
from app.schemas.pricing import KPIResponse

router = APIRouter()

MOCK_KPIS = [
    {
        "id": "kpi-rev-runrate",
        "label": "Annualized Net Revenue",
        "value": 48920400,
        "unit": "currency",
        "delta": 8.4,
        "deltaPeriod": "vs prior quarter",
        "deltaType": "positive_is_good",
        "historicalSparkline": [42.1, 43.4, 44.8, 46.2, 45.9, 47.3, 48.9],
        "forecastValue": 52400000,
        "confidenceInterval": [50800000, 53900000],
        "tooltipExplanation": "Annualized net revenue run-rate across all active product portfolios and channels.",
    },
    {
        "id": "kpi-gross-margin",
        "label": "Realized Gross Margin",
        "value": 41.8,
        "unit": "percent",
        "delta": 140,
        "deltaPeriod": "vs benchmark (+140 bps)",
        "deltaType": "positive_is_good",
        "historicalSparkline": [39.8, 40.2, 40.5, 41.1, 41.4, 41.6, 41.8],
        "forecastValue": 43.2,
        "tooltipExplanation": "Volume-weighted realized margin after factoring in promotional discounts and dynamic markdowns.",
    },
    {
        "id": "kpi-rev-at-risk",
        "label": "Revenue at Risk (Cannibalization / Elasticity)",
        "value": 1420500,
        "unit": "currency",
        "delta": -12.6,
        "deltaPeriod": "vs last 30d (-$204K risk mitigated)",
        "deltaType": "negative_is_good",
        "historicalSparkline": [2.1, 1.9, 1.8, 1.6, 1.5, 1.45, 1.42],
        "tooltipExplanation": "Projected revenue downside due to sub-optimal competitor price undercutting or over-elastic demand zones.",
    },
    {
        "id": "kpi-algo-velocity",
        "label": "Recommendation Capture Rate",
        "value": 86.4,
        "unit": "percent",
        "delta": 4.2,
        "deltaPeriod": "vs last month",
        "deltaType": "positive_is_good",
        "historicalSparkline": [74, 78, 80, 81, 84, 85, 86.4],
        "tooltipExplanation": "Percentage of algorithmic price recommendations accepted by revenue managers and synced to ERP/POS.",
    },
    {
        "id": "kpi-avg-elasticity",
        "label": "Portfolio Price Elasticity (Ed)",
        "value": -1.34,
        "unit": "ratio",
        "delta": 0.08,
        "deltaPeriod": "moderately elastic",
        "deltaType": "neutral",
        "historicalSparkline": [-1.48, -1.45, -1.40, -1.38, -1.36, -1.35, -1.34],
        "tooltipExplanation": "Aggregate cross-weighted price elasticity coefficient: 1% price change produces ~1.34% volume shift.",
    },
    {
        "id": "kpi-opportunity-pipeline",
        "label": "Uncaptured P&L Opportunity",
        "value": 864200,
        "unit": "currency",
        "delta": 22.1,
        "deltaPeriod": "in pending recommendations",
        "deltaType": "positive_is_good",
        "historicalSparkline": [450, 520, 610, 680, 740, 810, 864],
        "tooltipExplanation": "Immediate incremental gross profit achievable by approving the pending price recommendations.",
    }
]

@router.get("/kpis", response_model=List[KPIResponse])
def get_executive_kpis():
    """Retrieve top-level portfolio KPIs and revenue run-rate telemetry."""
    return MOCK_KPIS
