"""
backend/app/api/v1/api.py
-------------------------
API Router registering all endpoints for Module 9.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    products,
    analytics,
    predictions,
    forecasts,
    elasticity,
    pricing,
    explanations,
    executive,
    recommendations,
    competitors,
    simulations,
    assistant,
    models,
)

api_router = APIRouter()

# Core Module 9 REST endpoints
api_router.include_router(health.router, prefix="/health", tags=["Health & Status"])
api_router.include_router(products.router, prefix="/products", tags=["Product Catalog"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & KPIs"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Demand Predictions"])
api_router.include_router(forecasts.router, prefix="/forecasts", tags=["Demand Forecasts"])
api_router.include_router(elasticity.router, prefix="/elasticity", tags=["Price Elasticity"])
api_router.include_router(pricing.router, prefix="/pricing", tags=["Dynamic Pricing & Optimization"])
api_router.include_router(explanations.router, prefix="/explanations", tags=["SHAP Explainability"])

# Frontend backwards-compatibility endpoints
api_router.include_router(executive.router, prefix="/executive", tags=["Executive Telemetry (UI)"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Pricing Recommendations (UI)"])
api_router.include_router(competitors.router, prefix="/competitors", tags=["Competitor Radar (UI)"])
api_router.include_router(simulations.router, prefix="/simulations", tags=["What-If Simulator (UI)"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["AI Copilot (UI)"])
api_router.include_router(models.router, prefix="/models", tags=["Model Observatory (UI)"])
