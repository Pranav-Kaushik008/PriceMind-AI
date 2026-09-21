"""
backend/app/services/product_service.py
---------------------------------------
Service layer for product and category operations.
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductResponse, ProductListResponse, CategoryResponse


def get_product_by_id_or_sku(db: Session, identifier: str) -> Optional[Product]:
    """Find a product by its UUID or external SKU ID (e.g. 'SKU-8921-PRO')."""
    product = db.get(Product, identifier)
    if product is None:
        product = db.scalar(select(Product).where(Product.external_product_id == identifier))
    return product


def list_products(
    db: Session,
    category: Optional[str] = None,
    active_only: bool = True,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> ProductListResponse:
    """List products with optional category filter, text search, and pagination."""
    page_size = max(1, min(page_size, 100))
    page = max(1, page)

    q = select(Product)
    if active_only:
        q = q.where(Product.is_active == True)  # noqa: E712

    if category and category.lower() != "all":
        q = q.join(Product.category).where(func.lower(Category.name) == category.lower())

    if search:
        pattern = f"%{search.lower()}%"
        q = q.where(
            func.lower(Product.name).like(pattern)
            | func.lower(Product.external_product_id).like(pattern)
        )

    # Count total
    count_q = select(func.count()).select_from(q.subquery())
    total = db.scalar(count_q) or 0

    # Paginate
    offset = (page - 1) * page_size
    items_raw = list(db.scalars(q.order_by(Product.external_product_id).offset(offset).limit(page_size)))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    items: List[ProductResponse] = []
    for p in items_raw:
        margin_pct = None
        if p.current_price and p.cost_price and p.current_price > 0:
            margin_pct = round(((p.current_price - p.cost_price) / p.current_price) * 100.0, 2)

        items.append(
            ProductResponse(
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
        )

    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def list_categories(db: Session) -> List[CategoryResponse]:
    cats = list(db.scalars(select(Category).order_by(Category.name)))
    return [
        CategoryResponse(id=c.id, name=c.name, created_at=c.created_at)
        for c in cats
    ]
