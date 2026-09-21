"""
backend/app/repositories/product_repo.py
------------------------------------------
Data-access functions for Organization, Category, and Product.
Raw SQL queries stay here — not in route handlers.
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.organization import Organization
from app.models.category import Category
from app.models.product import Product


# ── Organization ──────────────────────────────────────────────────────────────

def get_or_create_organization(db: Session, name: str) -> Organization:
    org = db.scalar(select(Organization).where(Organization.name == name))
    if org is None:
        org = Organization(id=str(uuid.uuid4()), name=name)
        db.add(org)
        db.flush()
    return org


def get_organization(db: Session, org_id: str) -> Optional[Organization]:
    return db.get(Organization, org_id)


# ── Category ──────────────────────────────────────────────────────────────────

def get_or_create_category(db: Session, name: str) -> Category:
    cat = db.scalar(select(Category).where(Category.name == name))
    if cat is None:
        cat = Category(id=str(uuid.uuid4()), name=name)
        db.add(cat)
        db.flush()
    return cat


def list_categories(db: Session) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)))


# ── Product ───────────────────────────────────────────────────────────────────

def get_product(db: Session, product_id: str) -> Optional[Product]:
    return db.get(Product, product_id)


def get_product_by_external_id(db: Session, external_id: str) -> Optional[Product]:
    return db.scalar(select(Product).where(Product.external_product_id == external_id))


def list_products(db: Session, active_only: bool = True) -> list[Product]:
    q = select(Product)
    if active_only:
        q = q.where(Product.is_active == True)  # noqa: E712
    return list(db.scalars(q.order_by(Product.external_product_id)))


def upsert_product(db: Session, **kwargs) -> Product:
    """Insert or update a product by external_product_id."""
    ext_id = kwargs.get("external_product_id")
    product = get_product_by_external_id(db, ext_id)
    if product is None:
        product = Product(id=str(uuid.uuid4()), **kwargs)
        db.add(product)
    else:
        for k, v in kwargs.items():
            setattr(product, k, v)
    db.flush()
    return product
