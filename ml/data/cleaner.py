"""
PriceMind AI — Data Foundation
Data Cleaning & Normalization Engine.
"""

from typing import Tuple, List, Dict, Any, Optional
import pandas as pd
import numpy as np
import logging
import re

logger = logging.getLogger(__name__)


class DataCleaner:
    """
    Applies justified, reproducible transformations to raw pricing data.
    Maintains an audit trail of every modification performed.
    """

    def __init__(self):
        self.audit_log: List[Dict[str, Any]] = []

    def _log_transformation(self, step: str, description: str, rows_affected: int = 0):
        entry = {
            "step": step,
            "description": description,
            "rows_affected": rows_affected,
        }
        self.audit_log.append(entry)
        logger.info(f"[{step}] {description} (Rows affected: {rows_affected})")

    @staticmethod
    def _to_snake_case(name: str) -> str:
        s = re.sub(r"[^\w\s]", "", name)
        s = re.sub(r"[\s_]+", "_", s)
        return s.strip("_").lower()

    def clean(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """
        Execute full cleaning pipeline on a raw dataframe.
        """
        self.audit_log = []
        cleaned = df.copy()
        initial_len = len(cleaned)

        # 1. Column Name Normalization
        orig_cols = list(cleaned.columns)
        new_cols = [self._to_snake_case(c) for c in orig_cols]
        cleaned.columns = new_cols
        if orig_cols != new_cols:
            self._log_transformation(
                "NORMALIZE_COLUMNS",
                f"Converted {len(orig_cols)} column names to standardized snake_case.",
                rows_affected=len(cleaned)
            )

        # 2. Duplicate Removal
        dup_count = cleaned.duplicated().sum()
        if dup_count > 0:
            cleaned = cleaned.drop_duplicates().reset_index(drop=True)
            self._log_transformation(
                "DROP_DUPLICATES",
                f"Removed exact duplicate records.",
                rows_affected=int(dup_count)
            )

        # 3. Date Parsing & Temporal Sorting
        date_candidates = ["date", "timestamp", "transaction_date", "day", "order_date"]
        date_col = next((c for c in cleaned.columns if c in date_candidates), None)
        if date_col:
            cleaned[date_col] = pd.to_datetime(cleaned[date_col], errors="coerce")
            invalid_dates = cleaned[date_col].isnull().sum()
            if invalid_dates > 0:
                cleaned = cleaned.dropna(subset=[date_col]).reset_index(drop=True)
                self._log_transformation(
                    "DROP_INVALID_DATES",
                    f"Dropped rows with unparseable date strings in '{date_col}'.",
                    rows_affected=int(invalid_dates)
                )
            cleaned = cleaned.sort_values(by=date_col).reset_index(drop=True)
            self._log_transformation(
                "SORT_BY_DATE",
                f"Sorted dataset chronologically by '{date_col}'.",
                rows_affected=len(cleaned)
            )

        # 4. Standardizing Price Columns
        price_candidates = ["price", "unit_price", "current_price", "selling_price"]
        price_col = next((c for c in cleaned.columns if c in price_candidates), None)
        if price_col:
            cleaned[price_col] = pd.to_numeric(cleaned[price_col], errors="coerce")
            invalid_prices = (cleaned[price_col] <= 0) | cleaned[price_col].isnull()
            dropped_prices = int(invalid_prices.sum())
            if dropped_prices > 0:
                cleaned = cleaned[~invalid_prices].reset_index(drop=True)
                self._log_transformation(
                    "DROP_NON_POSITIVE_PRICES",
                    f"Filtered out records with price <= 0 or NaN in '{price_col}'.",
                    rows_affected=dropped_prices
                )

        # 5. Standardizing Demand / Units Column
        demand_candidates = ["units_sold", "demand", "quantity", "units", "sales_volume"]
        demand_col = next((c for c in cleaned.columns if c in demand_candidates), None)
        if demand_col:
            cleaned[demand_col] = pd.to_numeric(cleaned[demand_col], errors="coerce")
            invalid_demand = (cleaned[demand_col] < 0) | cleaned[demand_col].isnull()
            dropped_demand = int(invalid_demand.sum())
            if dropped_demand > 0:
                cleaned = cleaned[~invalid_demand].reset_index(drop=True)
                self._log_transformation(
                    "DROP_NEGATIVE_DEMAND",
                    f"Filtered out records with demand < 0 or NaN in '{demand_col}'.",
                    rows_affected=dropped_demand
                )

        # 6. Derive Revenue Column if Missing
        revenue_candidates = ["revenue", "total_sales", "sales", "gross_revenue"]
        revenue_col = next((c for c in cleaned.columns if c in revenue_candidates), None)
        if not revenue_col and price_col and demand_col:
            cleaned["revenue"] = (cleaned[price_col] * cleaned[demand_col]).round(2)
            self._log_transformation(
                "DERIVE_REVENUE",
                f"Generated 'revenue' column as ({price_col} * {demand_col}).",
                rows_affected=len(cleaned)
            )

        # 7. Categorical String Trimming
        cat_cols = cleaned.select_dtypes(include=["object", "string"]).columns
        for col in cat_cols:
            cleaned[col] = cleaned[col].astype(str).str.strip()

        final_len = len(cleaned)
        self._log_transformation(
            "CLEANING_COMPLETED",
            f"Cleaning finished. Retained {final_len:,} / {initial_len:,} rows ({((final_len/max(initial_len,1))*100):.1f}% yield).",
            rows_affected=initial_len - final_len
        )

        return cleaned, self.audit_log
