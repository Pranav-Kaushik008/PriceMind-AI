from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

MOCK_MODELS = [
    {
        "modelName": "PriceMind Elasticity Neural Ensemble (LightGBM + Spline)",
        "modelVersion": "v3.4.1-prod",
        "trainingDate": "2026-09-12 04:00 UTC",
        "mae": 0.042,
        "wape": 3.8,
        "r2Score": 0.941,
        "driftStatus": "optimal",
        "lastEvaluation": "12 minutes ago",
        "featuresCount": 84,
        "activeSamples": 1420950,
    },
    {
        "modelName": "Cross-Price Cannibalization Matrix Engine",
        "modelVersion": "v2.1.0-prod",
        "trainingDate": "2026-09-10 02:00 UTC",
        "mae": 0.061,
        "wape": 5.2,
        "r2Score": 0.912,
        "driftStatus": "optimal",
        "lastEvaluation": "1 hour ago",
        "featuresCount": 42,
        "activeSamples": 850300,
    },
]

@router.get("/")
def get_model_telemetry():
    """Retrieve production ML model accuracy and drift telemetry."""
    return MOCK_MODELS
