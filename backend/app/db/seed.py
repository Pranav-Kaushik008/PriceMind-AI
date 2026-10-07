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
from sqlalchemy import select, func

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.organization import Organization
from app.models.category import Category
from app.models.product import Product
from app.models.user import User

logger = logging.getLogger(__name__)

DEV_ORG_NAME = "[DEV] PriceMind Demo Organization"

# Project SKUs and retail benchmark catalog products
SEED_PRODUCTS = [
    {
        "external_product_id": "SKU-1090-CAB",
        "name": "Armored Industrial Bus Cable 50m",
        "category_name": "Accessories",
        "current_price": 85.0,
        "cost_price": 45.0,
        "inventory_level": 140,
        "store_channel": "STORE-NORTH-01",
    },
    {
        "external_product_id": "SKU-3320-SENS",
        "name": "ThermoGuard Pro Multi-Sensor",
        "category_name": "IoT Hardware",
        "current_price": 220.0,
        "cost_price": 110.0,
        "inventory_level": 85,
        "store_channel": "STORE-ONLINE-GLOBAL",
    },
    {
        "external_product_id": "SKU-4412-MTR",
        "name": "UltraFlow Core Flowmeter 500",
        "category_name": "Hardware & Tools",
        "current_price": 310.0,
        "cost_price": 165.0,
        "inventory_level": 40,
        "store_channel": "STORE-WEST-02",
    },
    {
        "external_product_id": "SKU-7731-SFT",
        "name": "SensorCore Analytics Suite",
        "category_name": "Software",
        "current_price": 495.0,
        "cost_price": 50.0,
        "inventory_level": 999,
        "store_channel": "STORE-ONLINE-GLOBAL",
    },
    {
        "external_product_id": "SKU-8921-PRO",
        "name": "Precision Industrial Calibrator X1",
        "category_name": "Hardware & Tools",
        "current_price": 750.0,
        "cost_price": 380.0,
        "inventory_level": 25,
        "store_channel": "STORE-NORTH-01",
    },
    {
        "external_product_id": "SKU-TV-SAMS-55",
        "name": "Samsung 55-Inch Crystal 4K UHD Smart TV",
        "category_name": "Electronics",
        "current_price": 599.99,
        "cost_price": 380.0,
        "inventory_level": 45,
        "store_channel": "STORE-RETAIL-01",
    },
    {
        "external_product_id": "SKU-TV-SONY-65",
        "name": "Sony Bravia 65-Inch 4K Ultra HD Google TV",
        "category_name": "Electronics",
        "current_price": 899.99,
        "cost_price": 590.0,
        "inventory_level": 35,
        "store_channel": "STORE-RETAIL-01",
    },
    {
        "external_product_id": "SKU-TV-LG-55",
        "name": "LG OLED55C3 55-Inch 4K OLED evo Smart TV",
        "category_name": "Electronics",
        "current_price": 1299.99,
        "cost_price": 850.0,
        "inventory_level": 20,
        "store_channel": "STORE-RETAIL-02",
    },
    {
        "external_product_id": "SKU-AUD-BOSE-QC45",
        "name": "Bose QuietComfort 45 Wireless Noise Cancelling Headphones",
        "category_name": "Audio",
        "current_price": 279.0,
        "cost_price": 160.0,
        "inventory_level": 60,
        "store_channel": "STORE-ONLINE-GLOBAL",
    },
    {
        "external_product_id": "SKU-AUD-SNY-WH1000",
        "name": "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
        "category_name": "Audio",
        "current_price": 349.99,
        "cost_price": 210.0,
        "inventory_level": 85,
        "store_channel": "STORE-RETAIL-01",
    },
    {
        "external_product_id": "SKU-BOT-HYDR-750",
        "name": "Hydro Flask Stainless Steel Wide Mouth Water Bottle 750ml",
        "category_name": "Accessories",
        "current_price": 44.95,
        "cost_price": 18.0,
        "inventory_level": 120,
        "store_channel": "STORE-RETAIL-02",
    },
    {
        "external_product_id": "SKU-LAP-APPL-M3",
        "name": "Apple MacBook Air 15-inch M3 512GB Laptop",
        "category_name": "Computers",
        "current_price": 1299.0,
        "cost_price": 950.0,
        "inventory_level": 18,
        "store_channel": "STORE-ONLINE-GLOBAL",
    },
    {
        "external_product_id": "SKU-MTR-LOGI-MX3S",
        "name": "Logitech MX Master 3S Wireless Performance Mouse",
        "category_name": "Peripherals",
        "current_price": 99.99,
        "cost_price": 55.0,
        "inventory_level": 95,
        "store_channel": "STORE-RETAIL-01",
    },
]


def seed_development_data(db: Session) -> dict:
    """
    Insert seed data. Idempotent — skips existing records.
    Also enriches with historical sales records and elasticity estimates.
    """
    counts = {"organizations": 0, "categories": 0, "products": 0, "users": 0, "sales_records": 0, "elasticity_results": 0}

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
    product_id_map: dict[str, str] = {}
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
                inventory_level=p.get("inventory_level"),
                store_channel=p.get("store_channel"),
                is_active=True,
            )
            db.add(product)
            counts["products"] += 1
            db.flush()
            product_id_map[p["external_product_id"]] = product.id
        else:
            # Update inventory_level if not set
            if existing.inventory_level is None and p.get("inventory_level") is not None:
                existing.inventory_level = p.get("inventory_level")
            product_id_map[p["external_product_id"]] = existing.id

    # 4. Dev user
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

    db.commit()

    # 5. Import Real Sales & Demand Data from dataset if available
    from app.models.sales_record import SalesRecord
    from app.services.data_import_service import import_sales_csv, import_elasticity_csv
    from app.models.elasticity import ElasticityResult

    existing_sales_count = db.scalar(select(func.count(SalesRecord.id))) or 0
    if existing_sales_count == 0:
        cleaned_csv_path = str(backend_dir.parent / "data" / "processed" / "pricing_dataset_cleaned.csv")
        if os.path.exists(cleaned_csv_path):
            sales_result = import_sales_csv(db, cleaned_csv_path, product_id_map, batch_size=500)
            counts["sales_records"] += sales_result.inserted
            logger.info(f"[Seed] Imported sales records: {sales_result.inserted}")

    # 6. Import Elasticity Summary from reports if available
    existing_elast_count = db.scalar(select(func.count(ElasticityResult.id))) or 0
    if existing_elast_count == 0:
        elast_csv_path = str(backend_dir.parent / "reports" / "elasticity_summary.csv")
        if os.path.exists(elast_csv_path):
            elast_result = import_elasticity_csv(db, elast_csv_path, product_id_map)
            counts["elasticity_results"] += elast_result.inserted
            logger.info(f"[Seed] Imported elasticity results: {elast_result.inserted}")

    # 7. Seed representative sales and elasticity for retail consumer electronics
    from datetime import date, timedelta
    import random

    retail_skus = [
        ("SKU-TV-SAMS-55", -1.45, 0.82, 12.5),
        ("SKU-TV-SONY-65", -1.38, 0.79, 8.2),
        ("SKU-TV-LG-55", -1.62, 0.85, 6.4),
        ("SKU-AUD-BOSE-QC45", -0.92, 0.71, 18.0),
        ("SKU-AUD-SNY-WH1000", -1.15, 0.76, 22.0),
        ("SKU-BOT-HYDR-750", -0.65, 0.68, 45.0),
        ("SKU-LAP-APPL-M3", -1.25, 0.88, 5.5),
        ("SKU-MTR-LOGI-MX3S", -0.88, 0.74, 32.0),
    ]

    for sku, elast_val, r2_val, base_daily in retail_skus:
        if sku in product_id_map:
            prod_id = product_id_map[sku]
            
            # Check elasticity
            has_elast = db.scalar(select(ElasticityResult).where(ElasticityResult.product_id == prod_id))
            if not has_elast:
                elast_obj = ElasticityResult(
                    id=str(uuid.uuid4()),
                    product_id=prod_id,
                    model_version="v1",
                    methodology="log_log_ols",
                    elasticity=elast_val,
                    robust_elasticity=round(elast_val * 0.98, 4),
                    std_error=0.085,
                    t_statistic=round(elast_val / 0.085, 2),
                    p_value=0.0001,
                    r_squared=r2_val,
                    adj_r_squared=round(r2_val - 0.02, 4),
                    n_observations=90,
                    reliability="High" if r2_val >= 0.75 else "Medium",
                    model_status="SUCCESS",
                )
                db.add(elast_obj)
                counts["elasticity_results"] += 1

            # Check sales records (last 90 days)
            sales_cnt = db.scalar(select(func.count(SalesRecord.id)).where(SalesRecord.product_id == prod_id)) or 0
            if sales_cnt == 0:
                prod = db.scalar(select(Product).where(Product.id == prod_id))
                base_price = prod.current_price or 100.0
                today = date.today()
                sales_batch = []
                for i in range(90):
                    rec_date = today - timedelta(days=90 - i)
                    # slight random fluctuation
                    units = max(1, int(random.gauss(base_daily, base_daily * 0.2)))
                    price_mod = base_price * random.choice([0.95, 1.0, 1.0, 1.05])
                    sales_batch.append(
                        SalesRecord(
                            id=str(uuid.uuid4()),
                            product_id=prod_id,
                            record_date=rec_date,
                            store_channel=prod.store_channel or "STORE-RETAIL-01",
                            price=round(price_mod, 2),
                            units_sold=units,
                            revenue=round(price_mod * units, 2),
                            cost_price=prod.cost_price,
                            is_promotion=(price_mod < base_price),
                            inventory_level=prod.inventory_level,
                            competitor_price=round(price_mod * 0.98, 2),
                        )
                    )
                db.bulk_save_objects(sales_batch)
                counts["sales_records"] += len(sales_batch)

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

