"""
backend/app/api/v1/endpoints/products.py
----------------------------------------
Product catalog and SKU endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Union
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import product_service
from app.schemas.product import ProductResponse, ProductListResponse, CategoryResponse
from app.schemas.pricing import SKUResponse

router = APIRouter()


@router.get(
    "",
    summary="List Products with Search and Filters",
)
@router.get("/", include_in_schema=False)
def get_products(
    category: Optional[str] = Query(None, description="Category name filter"),
    search: Optional[str] = Query(None, description="Search query in name or SKU"),
    active_only: bool = Query(True, description="Filter active products only"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
):
    """Retrieve catalog products with pagination, category filter, and search."""
    result = product_service.list_products(
        db, category=category, active_only=active_only, search=search, page=page, page_size=page_size
    )
    # Format for both UI compatibility and schema conformance
    return [
        SKUResponse(
            id=p.id,
            skuCode=p.external_product_id,
            name=p.name,
            category=p.category_name or "General",
            channel=p.store_channel or "Direct",
            currentPrice=p.current_price or 0.0,
            costPrice=p.cost_price or 0.0,
            marginPercent=p.margin_percent or 0.0,
            currentVelocity=35,
            inventoryStock=p.inventory_level or 500,
            daysOfInventory=25,
            elasticityScore=-1.15,
            elasticityCategory="elastic",
            competitorMinPrice=(p.competitor_price * 0.95) if p.competitor_price else (p.current_price * 0.95 if p.current_price else 0.0),
            competitorAvgPrice=p.competitor_price or p.current_price or 0.0,
            competitorMaxPrice=(p.competitor_price * 1.08) if p.competitor_price else (p.current_price * 1.08 if p.current_price else 0.0),
            pricePosition="parity",
            revenueRiskScore=15,
            recommendedPrice=round((p.current_price or 100.0) * 1.05, 2),
            projectedUpliftPercent=5.0,
        )
        for p in result.items
    ]


@router.get(
    "/paginated",
    response_model=ProductListResponse,
    summary="List Products Paginated",
)
def get_products_paginated(
    category: Optional[str] = Query(None, description="Category filter"),
    search: Optional[str] = Query(None, description="Search term"),
    active_only: bool = Query(True, description="Active products only"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """Paginated product list returning metadata and totals."""
    return product_service.list_products(
        db, category=category, active_only=active_only, search=search, page=page, page_size=page_size
    )


@router.get(
    "/categories",
    response_model=List[CategoryResponse],
    summary="List Product Categories",
)
def get_categories(db: Session = Depends(get_db)):
    """List all product categories."""
    return product_service.list_categories(db)


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get Product by ID or SKU",
)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
):
    """Get single product details by internal UUID or external SKU ID."""
    p = product_service.get_product_by_id_or_sku(db, product_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product not found: {product_id}",
        )

    margin_pct = None
    if p.current_price and p.cost_price and p.current_price > 0:
        margin_pct = round(((p.current_price - p.cost_price) / p.current_price) * 100.0, 2)

    return ProductResponse(
        id=p.id,
        external_product_id=p.external_product_id,
        name=p.name,
        category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        store_channel=p.store_channel,
        current_price=p.current_price,
        cost_price=p.cost_price,
        margin_percent=margin_pct,
        inventory_level=p.inventory_level,
        competitor_price=p.competitor_price,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )
