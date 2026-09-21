"""
backend/app/schemas/explanation.py
----------------------------------
SHAP explanation schemas for Module 7.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class FeatureContributionItem(BaseModel):
    feature_name: str
    feature_value: float
    shap_value: float
    direction: str  # 'positive' | 'negative'


class PredictionExplanationRequest(BaseModel):
    product_id: str = Field(description="Product UUID or external SKU ID")
    price: Optional[float] = Field(default=None, gt=0, description="Price point to explain")
    top_n: Optional[int] = Field(default=10, ge=1, le=50, description="Top positive/negative features")


class PredictionExplanationResponse(BaseModel):
    product_id: str
    external_product_id: str
    predicted_demand: float
    base_value: float
    price_used: float
    model_name: str
    model_version: str
    explanation_method: str = "TreeExplainer (Exact Shapley)"
    top_positive_contributors: List[FeatureContributionItem]
    top_negative_contributors: List[FeatureContributionItem]
    price_feature_contribution: Optional[FeatureContributionItem] = None
    note: str = "Model-based attribution — reflects learned model relationships, not causality"

    model_config = ConfigDict(from_attributes=True)


class PricingExplanationRequest(BaseModel):
    product_id: str = Field(description="Product UUID or external SKU ID")
    current_price: Optional[float] = Field(default=None, gt=0)
    recommended_price: Optional[float] = Field(default=None, gt=0)
    top_n: Optional[int] = Field(default=10, ge=1, le=50)


class PricingExplanationResponse(BaseModel):
    product_id: str
    external_product_id: str
    current_price: float
    recommended_price: float
    current_predicted_demand: float
    recommended_predicted_demand: float
    demand_change: float
    current_price_shap: float
    recommended_price_shap: float
    price_shap_delta: float
    base_value: float
    elasticity: float
    elasticity_reliability: str
    top_drivers_current: List[FeatureContributionItem]
    top_drivers_recommended: List[FeatureContributionItem]
    applied_constraints: List[str]
    model_signals_summary: str
    business_constraints_summary: str
    note: str = "Model-based scenario explanation — reflects learned model relationships, not causality"

    model_config = ConfigDict(from_attributes=True)
