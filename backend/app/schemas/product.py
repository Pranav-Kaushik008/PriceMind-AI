"""
backend/app/schemas/product.py
------------------------------
Product and Category API schemas.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class CategoryResponse(BaseModel):
    id: str
    name: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: str
    external_product_id: str
    name: str
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    store_channel: Optional[str] = None
    current_price: Optional[float] = None
    cost_price: Optional[float] = None
    margin_percent: Optional[float] = None
    inventory_level: Optional[int] = None
    competitor_price: Optional[float] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
