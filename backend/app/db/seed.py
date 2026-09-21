"""
backend/app/db/seed.py
-----------------------
Development seed data for PriceMind AI.

IMPORTANT:
- Seed data is clearly labeled as DEVELOPMENT/SYNTHETIC data.
- It must NEVER be used for ML model evaluation or production analytics.
- Safe to re-run (idempotent via upsert logic).
"""

import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uuid
import logging
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.organization import Organization
from app.models.category import Category
from app.models.product import Product
from app.models.user import User

logger = logging.getLogger(__name__)

DEV_ORG_NAME = "[DEV] PriceMind Demo Organization"

# Mirror the 5 actual SKUs from the project dataset
SEED_PRODUCTS = [
    {
        "external_product_id": "SKU-1090-CAB",
        "name": "Armored Industrial Bus Cable 50m",
        "category_name": "Accessories",
        "current_price": 85.0,
        "cost_price": 45.0,
        "store_channel": "STORE-NORTH-01",
    },
    {
        "external_product_id": "SKU-3320-SENS",
        "name": "ThermoGuard Pro Multi-Sensor",
        "category_name": "IoT Hardware",
        "current_price": 220.0,
        "cost_price": 110.0,
        "store_channel": "STORE-ONLINE-GLOBAL",
    },
    {
        "external_product_id": "SKU-4412-MTR",
        "name": "UltraFlow Core Flowmeter 500",
        "category_name": "Hardware & Tools",
        "current_price": 310.0,
        "cost_price": 165.0,
        "store_channel": "STORE-WEST-02",
    },
    {
        "external_product_id": "SKU-7731-SFT",
        "name": "SensorCore Analytics Suite",
        "category_name": "Software",
        "current_price": 495.0,
        "cost_price": 50.0,
        "store_channel": "STORE-ONLINE-GLOBAL",
    },
    {
        "external_product_id": "SKU-8921-PRO",
        "name": "Precision Industrial Calibrator X1",
        "category_name": "Hardware & Tools",
        "current_price": 750.0,
        "cost_price": 380.0,
        "store_channel": "STORE-NORTH-01",
    },
]


def seed_development_data(db: Session) -> dict:
    """
    Insert seed data. Idempotent — skips existing records.

    Returns counts of inserted records.
    """
    counts = {"organizations": 0, "categories": 0, "products": 0, "users": 0}

    # 1. Organization
    org = db.scalar(select(Organization).where(Organization.name == DEV_ORG_NAME))
    if org is None:
        org = Organization(id=str(uuid.uuid4()), name=DEV_ORG_NAME)
        db.add(org)
        counts["organizations"] += 1
        logger.info(f"[Seed] Created org: {DEV_ORG_NAME}")

    db.flush()

    # 2. Categories
    category_map: dict[str, str] = {}
    unique_cats = list({p["category_name"] for p in SEED_PRODUCTS})
    for cat_name in unique_cats:
        cat = db.scalar(select(Category).where(Category.name == cat_name))
        if cat is None:
            cat = Category(id=str(uuid.uuid4()), name=cat_name)
            db.add(cat)
            counts["categories"] += 1
        db.flush()
        category_map[cat_name] = cat.id

    # 3. Products
    for p in SEED_PRODUCTS:
        existing = db.scalar(
            select(Product).where(Product.external_product_id == p["external_product_id"])
        )
        if existing is None:
            product = Product(
                id=str(uuid.uuid4()),
                external_product_id=p["external_product_id"],
                name=p["name"],
                category_id=category_map[p["category_name"]],
                current_price=p["current_price"],
                cost_price=p["cost_price"],
                store_channel=p.get("store_channel"),
                is_active=True,
            )
            db.add(product)
            counts["products"] += 1
        db.flush()

    # 4. Dev user (password_hash is a placeholder — DO NOT use for authentication)
    dev_email = "dev@pricemind.local"
    existing_user = db.scalar(select(User).where(User.email == dev_email))
    if existing_user is None:
        user = User(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            email=dev_email,
            hashed_password="$2b$12$PLACEHOLDER_HASH_DO_NOT_USE_IN_PRODUCTION",
            full_name="Dev User (Seed)",
            role="admin",
            is_active=True,
        )
        db.add(user)
        counts["users"] += 1
        logger.info(f"[Seed] Created dev user: {dev_email}")

    db.commit()
    logger.info(f"[Seed] Complete: {counts}")
    return counts


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        result = seed_development_data(db)
        print(f"\n[Seed] Done: {result}")
    finally:
        db.close()
