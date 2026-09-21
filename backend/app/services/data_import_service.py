"""
backend/app/services/data_import_service.py
----------------------------------------------
Controlled import utility: CSV -> Validation -> Transformation -> PostgreSQL.

Reuses Module 1 data validation logic.
Provides inserted/skipped/failed counts with error details.
Never silently drops malformed records.
"""

from __future__ import annotations

import uuid
from datetime import date
from pathlib import Path
from typing import Optional
import logging

import pandas as pd
from sqlalchemy.orm import Session

from app.repositories.product_repo import get_or_create_category, upsert_product
from app.repositories.analytics_repo import bulk_insert_sales_records, save_elasticity

logger = logging.getLogger(__name__)

# ── Result container ──────────────────────────────────────────────────────────

class ImportResult:
    def __init__(self):
        self.inserted = 0
        self.skipped = 0
        self.failed = 0
        self.errors: list[dict] = []

    def add_error(self, row_index, reason: str, row_data: dict = None):
        self.failed += 1
        self.errors.append({"row": row_index, "reason": reason, "data": row_data or {}})

    def __repr__(self):
        return (
            f"ImportResult(inserted={self.inserted}, "
            f"skipped={self.skipped}, failed={self.failed})"
        )


# ── Sales / Demand import ─────────────────────────────────────────────────────

REQUIRED_SALES_COLS = {"sku_id", "date", "price", "units_sold"}


def import_sales_csv(
    db: Session,
    csv_path: str,
    product_id_map: dict[str, str],   # sku_id -> product.id
    batch_size: int = 500,
) -> ImportResult:
    """
    Import historical sales records from CSV.

    Parameters
    ----------
    db             : active SQLAlchemy session
    csv_path       : path to the cleaned CSV / parquet
    product_id_map : mapping from external sku_id to DB product.id
    batch_size     : rows per flush batch

    Returns ImportResult with counts and error details.
    """
    result = ImportResult()
    path = Path(csv_path)

    if not path.exists():
        result.add_error(-1, f"File not found: {csv_path}")
        return result

    # Load file
    try:
        if path.suffix == ".parquet":
            df = pd.read_parquet(path)
        else:
            df = pd.read_csv(path)
    except Exception as exc:
        result.add_error(-1, f"File load error: {exc}")
        return result

    # Check required columns
    missing = REQUIRED_SALES_COLS - set(df.columns)
    if missing:
        result.add_error(-1, f"Missing required columns: {missing}")
        return result

    batch: list[dict] = []

    for idx, row in df.iterrows():
        try:
            sku_id = str(row["sku_id"])
            if sku_id not in product_id_map:
                result.skipped += 1
                continue

            record_date = pd.to_datetime(row["date"]).date()
            price = float(row["price"])
            units_sold = int(row["units_sold"])

            if price <= 0 or units_sold < 0:
                result.add_error(idx, "Invalid price or units_sold", {"sku_id": sku_id})
                continue

            record = {
                "product_id": product_id_map[sku_id],
                "record_date": record_date,
                "store_channel": str(row.get("store_id", "")) or None,
                "price": price,
                "units_sold": units_sold,
                "revenue": float(row["revenue"]) if "revenue" in row and pd.notna(row.get("revenue")) else None,
                "cost_price": float(row["cost_price"]) if "cost_price" in row and pd.notna(row.get("cost_price")) else None,
                "is_promotion": bool(row.get("is_promotion", False)),
                "inventory_level": int(row["inventory_level"]) if "inventory_level" in row and pd.notna(row.get("inventory_level")) else None,
                "competitor_price": float(row["competitor_price"]) if "competitor_price" in row and pd.notna(row.get("competitor_price")) else None,
            }
            batch.append(record)

            if len(batch) >= batch_size:
                inserted = bulk_insert_sales_records(db, batch)
                result.inserted += inserted
                batch = []

        except Exception as exc:
            result.add_error(idx, str(exc))

    # Final batch
    if batch:
        inserted = bulk_insert_sales_records(db, batch)
        result.inserted += inserted

    logger.info(f"[DataImport] Sales import complete: {result}")
    return result


# ── Elasticity import ─────────────────────────────────────────────────────────

def import_elasticity_csv(
    db: Session,
    csv_path: str,
    product_id_map: dict[str, str],
    model_version: str = "v1",
) -> ImportResult:
    """Import Module 3 elasticity results from reports/elasticity_summary.csv."""
    result = ImportResult()
    path = Path(csv_path)

    if not path.exists():
        result.add_error(-1, f"File not found: {csv_path}")
        return result

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        result.add_error(-1, f"File load error: {exc}")
        return result

    for idx, row in df.iterrows():
        try:
            sku_id = str(row.get("sku_id", ""))
            if sku_id not in product_id_map:
                result.skipped += 1
                continue

            save_elasticity(
                db,
                product_id=product_id_map[sku_id],
                model_version=model_version,
                methodology="log_log_ols",
                elasticity=float(row["elasticity"]),
                robust_elasticity=float(row["robust_elasticity"]) if "robust_elasticity" in row and pd.notna(row.get("robust_elasticity")) else None,
                std_error=float(row["std_error"]) if "std_error" in row and pd.notna(row.get("std_error")) else None,
                t_statistic=float(row["t_statistic"]) if "t_statistic" in row and pd.notna(row.get("t_statistic")) else None,
                p_value=float(row["p_value"]) if "p_value" in row and pd.notna(row.get("p_value")) else None,
                ci_lower=float(row["ci_lower"]) if "ci_lower" in row and pd.notna(row.get("ci_lower")) else None,
                ci_upper=float(row["ci_upper"]) if "ci_upper" in row and pd.notna(row.get("ci_upper")) else None,
                r_squared=float(row["r_squared"]) if "r_squared" in row and pd.notna(row.get("r_squared")) else None,
                adj_r_squared=float(row["adj_r_squared"]) if "adj_r_squared" in row and pd.notna(row.get("adj_r_squared")) else None,
                n_observations=int(row["n_obs"]) if "n_obs" in row and pd.notna(row.get("n_obs")) else None,
                reliability=str(row["reliability"]) if "reliability" in row and pd.notna(row.get("reliability")) else None,
                model_status=str(row.get("model_status", "SUCCESS")),
            )
            result.inserted += 1
        except Exception as exc:
            result.add_error(idx, str(exc))

    logger.info(f"[DataImport] Elasticity import complete: {result}")
    return result
