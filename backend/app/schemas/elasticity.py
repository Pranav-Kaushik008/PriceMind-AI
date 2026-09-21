"""
backend/app/schemas/elasticity.py
---------------------------------
Price elasticity schemas for Module 3.
"""

from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ElasticityResponse(BaseModel):
    product_id: str
    external_product_id: str
    sku_name: str
    category: str
    elasticity: float
    robust_elasticity: Optional[float] = None
    elasticity_category: str
    std_error: Optional[float] = None
    t_statistic: Optional[float] = None
    p_value: Optional[float] = None
    ci_lower: Optional[float] = None
    ci_upper: Optional[float] = None
    r_squared: Optional[float] = None
    adj_r_squared: Optional[float] = None
    n_observations: Optional[int] = None
    reliability: str
    methodology: str = "log_log_ols"
    model_version: str = "v1"

    model_config = ConfigDict(from_attributes=True)
