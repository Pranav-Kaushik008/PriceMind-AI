"""
backend/app/schemas/forecast.py
-------------------------------
Demand forecasting schemas for Module 5.
"""

from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ForecastPoint(BaseModel):
    date: str
    predicted_demand: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None


class ForecastResponse(BaseModel):
    product_id: str
    external_product_id: str
    model_name: str
    model_version: str
    forecast_horizon_days: int
    forecast_run_id: Optional[str] = None
    generated_at: str
    forecast_points: List[ForecastPoint]

    model_config = ConfigDict(from_attributes=True)
