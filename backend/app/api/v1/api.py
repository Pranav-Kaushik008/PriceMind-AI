from fastapi import APIRouter
from app.api.v1.endpoints import (
    executive,
    products,
    recommendations,
    elasticity,
    competitors,
    simulations,
    assistant,
    models,
)

api_router = APIRouter()
api_router.include_router(executive.router, prefix="/executive", tags=["Executive Telemetry"])
api_router.include_router(products.router, prefix="/products", tags=["Product Catalog"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Pricing Recommendations"])
api_router.include_router(elasticity.router, prefix="/elasticity", tags=["Demand Elasticity"])
api_router.include_router(competitors.router, prefix="/competitors", tags=["Competitor Radar"])
api_router.include_router(simulations.router, prefix="/simulations", tags=["What-If Simulator"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["AI Copilot"])
api_router.include_router(models.router, prefix="/models", tags=["Model Observatory"])
