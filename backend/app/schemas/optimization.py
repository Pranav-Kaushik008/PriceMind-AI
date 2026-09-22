"""
backend/app/schemas/optimization.py
-----------------------------------
Pricing optimization, simulation, and curve schemas for Module 6.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class OptimizePriceRequest(BaseModel):
    product_id: str = Field(description="Product UUID or external SKU ID (e.g. SKU-8921-PRO)")
    objective: str = Field(default="PROFIT_MAX", description="Optimization objective: 'PROFIT_MAX' | 'REVENUE_MAX' | 'BALANCED'")
    min_price: Optional[float] = Field(default=None, gt=0, description="Optional minimum price override")
    max_price: Optional[float] = Field(default=None, gt=0, description="Optional maximum price override")
    price_step: Optional[float] = Field(default=None, gt=0, description="Price granularity step")
    min_margin_pct: Optional[float] = Field(default=None, description="Optional minimum gross margin %")
    competitor_max_ratio: Optional[float] = Field(default=None, description="Max allowed ratio to competitor price")


class PricingRecommendationResponse(BaseModel):
    id: Optional[str] = None
    product_id: str
    external_product_id: str
    product_name: str
    category: str
    current_price: float
    recommended_price: float
    price_change_pct: float
    predicted_demand: Optional[float] = None
    predicted_revenue: Optional[float] = None
    predicted_profit: Optional[float] = None
    predicted_margin_pct: Optional[float] = None
    elasticity: Optional[float] = None
    confidence: str
    objective: str
    status: str
    rationale: Optional[str] = None
    applied_at: Optional[str] = None
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SingleSimulationRequest(BaseModel):
    product_id: str = Field(description="Product UUID or external SKU ID")
    candidate_price: float = Field(gt=0, description="Candidate price to evaluate")


class SingleSimulationResponse(BaseModel):
    product_id: str
    external_product_id: str
    current_price: float
    candidate_price: float
    price_change_pct: float
    predicted_demand: float
    predicted_revenue: float
    predicted_profit: Optional[float] = None
    margin_pct: Optional[float] = None
    demand_change_pct: float
    revenue_change_pct: float
    profit_change_pct: Optional[float] = None
    constraints_satisfied: bool
    violations: List[str] = []


class RangeSimulationRequest(BaseModel):
    product_id: str = Field(description="Product UUID or external SKU ID")
    min_price: float = Field(gt=0, description="Starting minimum price")
    max_price: float = Field(gt=0, description="Ending maximum price")
    step: float = Field(gt=0, description="Price increment step")


class SimulationPoint(BaseModel):
    price: float
    demand: float
    revenue: float
    profit: Optional[float] = None
    margin_pct: Optional[float] = None
    is_current: bool = False
    is_optimal_revenue: bool = False
    is_optimal_profit: bool = False
    constraints_satisfied: bool = True


class RangeSimulationResponse(BaseModel):
    product_id: str
    external_product_id: str
    current_price: float
    points: List[SimulationPoint]
    total_evaluated: int
    optimal_profit_price: Optional[float] = None
    optimal_revenue_price: Optional[float] = None


class PricingCurveResponse(BaseModel):
    product_id: str
    external_product_id: str
    product_name: str
    category: str
    current_price: float
    elasticity: float
    curve_points: List[SimulationPoint]


class ConsolidatedRecommendationRequest(BaseModel):
    product_id: str = Field(description="Product UUID or external SKU ID (e.g. SKU-8921-PRO)")
    objective: Optional[str] = Field(default="PROFIT_MAX", description="Optimization objective: 'PROFIT_MAX' | 'REVENUE_MAX' | 'BALANCED'")


class ConsolidatedRecommendationResponse(BaseModel):
    product: Dict[str, Any]
    current_price: float
    recommended_price: float
    price_change_pct: float
    predicted_demand: float
    expected_revenue: float
    expected_profit: float
    elasticity: float
    elasticity_category: str
    constraints: Dict[str, Any]
    explanation: Dict[str, Any]
    model: Dict[str, Any]
    sources: List[Dict[str, Any]] = []
