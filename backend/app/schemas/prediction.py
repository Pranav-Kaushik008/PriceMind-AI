"""
backend/app/schemas/prediction.py
---------------------------------
Demand prediction schemas for Module 4.
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class PredictionRequest(BaseModel):
    product_id: str = Field(description="Product UUID or external SKU ID (e.g. SKU-8921-PRO)")
    price: float = Field(gt=0, description="Proposed price point")
    prediction_date: Optional[date] = Field(default=None, description="Prediction target date (defaults to today)")
    is_promotion: Optional[bool] = Field(default=False, description="Whether promotion active")
    competitor_price: Optional[float] = Field(default=None, gt=0, description="Current competitor price")
    inventory_level: Optional[int] = Field(default=None, ge=0, description="Current stock level")
    persist: Optional[bool] = Field(default=True, description="Whether to persist prediction in DB")


class PredictionResponse(BaseModel):
    id: Optional[str] = None
    product_id: str
    external_product_id: str
    prediction_date: str
    price: float
    predicted_demand: float
    model_name: str
    model_version: str
    predicted_at: str
    feature_count: int

    model_config = ConfigDict(from_attributes=True)
