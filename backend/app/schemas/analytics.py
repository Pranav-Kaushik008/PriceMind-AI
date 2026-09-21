"""
backend/app/schemas/analytics.py
--------------------------------
Analytics and KPI schemas.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class AnalyticsOverviewResponse(BaseModel):
    total_products: int
    total_categories: int
    total_sales_records: int
    total_revenue: Optional[float] = 0.0
    average_price: Optional[float] = 0.0
    average_demand_units: Optional[float] = 0.0
    total_recommendations: int = 0
    total_optimizations_run: int = 0
    model_status: str = "active"
    data_timeframe_days: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
