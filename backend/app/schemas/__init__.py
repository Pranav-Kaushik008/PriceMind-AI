"""
backend/app/schemas/__init__.py
-------------------------------
PriceMind AI — Schema Registry.
"""

from app.schemas.health import HealthResponse
from app.schemas.product import ProductResponse, ProductListResponse, CategoryResponse
from app.schemas.analytics import AnalyticsOverviewResponse
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.schemas.forecast import ForecastPoint, ForecastResponse
from app.schemas.elasticity import ElasticityResponse
from app.schemas.optimization import (
    OptimizePriceRequest,
    PricingRecommendationResponse,
    SingleSimulationRequest,
    SingleSimulationResponse,
    RangeSimulationRequest,
    RangeSimulationResponse,
    SimulationPoint,
    PricingCurveResponse,
)
from app.schemas.explanation import (
    FeatureContributionItem,
    PredictionExplanationRequest,
    PredictionExplanationResponse,
    PricingExplanationRequest,
    PricingExplanationResponse,
)
from app.schemas.pricing import (
    KPIResponse,
    SKUResponse,
    RecommendationResponse,
    SimulationParams,
    SimulationResponse,
    AssistantQuery,
    AssistantResponse,
)

__all__ = [
    "HealthResponse",
    "ProductResponse",
    "ProductListResponse",
    "CategoryResponse",
    "AnalyticsOverviewResponse",
    "PredictionRequest",
    "PredictionResponse",
    "ForecastPoint",
    "ForecastResponse",
    "ElasticityResponse",
    "OptimizePriceRequest",
    "PricingRecommendationResponse",
    "SingleSimulationRequest",
    "SingleSimulationResponse",
    "RangeSimulationRequest",
    "RangeSimulationResponse",
    "SimulationPoint",
    "PricingCurveResponse",
    "FeatureContributionItem",
    "PredictionExplanationRequest",
    "PredictionExplanationResponse",
    "PricingExplanationRequest",
    "PricingExplanationResponse",
    "KPIResponse",
    "SKUResponse",
    "RecommendationResponse",
    "SimulationParams",
    "SimulationResponse",
    "AssistantQuery",
    "AssistantResponse",
]
