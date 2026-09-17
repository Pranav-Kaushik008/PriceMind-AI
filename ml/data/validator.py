"""
PriceMind AI — Data Foundation
Data Validation Suite & Anomaly Detection.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import logging
import json
import re

logger = logging.getLogger(__name__)


class ValidationReport:
    """Encapsulates validation findings, statistics, and anomalies."""

    def __init__(self, total_rows: int, total_columns: int):
        self.total_rows = total_rows
        self.total_columns = total_columns
        self.is_valid = True
        self.missing_values: Dict[str, Dict[str, Any]] = {}
        self.duplicate_count: int = 0
        self.negative_prices: int = 0
        self.negative_demand: int = 0
        self.zero_prices: int = 0
        self.invalid_dates: int = 0
        self.outliers: Dict[str, int] = {}
        self.type_inconsistencies: List[str] = []
        self.issues: List[str] = []

    def add_issue(self, issue: str):
        self.issues.append(issue)
        self.is_valid = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_rows": self.total_rows,
            "total_columns": self.total_columns,
            "is_valid": self.is_valid,
            "duplicate_count": self.duplicate_count,
            "negative_prices": self.negative_prices,
            "negative_demand": self.negative_demand,
            "zero_prices": self.zero_prices,
            "invalid_dates": self.invalid_dates,
            "missing_values": self.missing_values,
            "outliers": self.outliers,
            "type_inconsistencies": self.type_inconsistencies,
            "issues": self.issues,
        }

    def to_markdown(self) -> str:
        md = [
            "# PriceMind AI — Data Validation Report",
            "",
            f"- **Total Records Analyzed**: `{self.total_rows:,}`",
            f"- **Total Columns**: `{self.total_columns}`",
            f"- **Overall Status**: `{'PASSED' if self.is_valid else 'WARNINGS DETECTED'}`",
            "",
            "## Quality Checks",
            f"- **Duplicate Rows**: `{self.duplicate_count:,}`",
            f"- **Negative Prices**: `{self.negative_prices:,}`",
            f"- **Zero Prices**: `{self.zero_prices:,}`",
            f"- **Negative Demand / Units**: `{self.negative_demand:,}`",
            f"- **Invalid / Unparseable Dates**: `{self.invalid_dates:,}`",
            "",
            "## Missing Values Breakdown",
            "| Column | Missing Count | Missing % |",
            "|---|---|---|",
        ]
        if self.missing_values:
            for col, stats in self.missing_values.items():
                md.append(f"| `{col}` | {stats['count']:,} | {stats['percent']:.2f}% |")
        else:
            md.append("| None | 0 | 0.00% |")

        if self.outliers:
            md.extend([
                "",
                "## Outlier Detection (1.5 × IQR Rule)",
                "| Column | Outlier Records |",
                "|---|---|",
            ])
            for col, count in self.outliers.items():
                md.append(f"| `{col}` | {count:,} |")

        if self.issues:
            md.extend([
                "",
                "## Actionable Issues Identified",
            ])
            for iss in self.issues:
                md.append(f"- ⚠️ {iss}")

        return "\n".join(md)


class DataValidator:
    """Validates pricing datasets across structural, domain, and statistical rules."""

    def __init__(
        self,
        date_col_candidates: Optional[List[str]] = None,
        price_col_candidates: Optional[List[str]] = None,
        demand_col_candidates: Optional[List[str]] = None,
    ):
        self.date_cols = date_col_candidates or ["date", "timestamp", "transaction_date", "day", "order_date"]
        self.price_cols = price_col_candidates or ["price", "unit_price", "current_price", "selling_price"]
        self.demand_cols = demand_col_candidates or ["demand", "units_sold", "quantity", "units", "sales_volume"]

    def _normalize_name(self, s: str) -> str:
        clean = re.sub(r"[^\w\s]", "", str(s))
        return re.sub(r"[\s_]+", "_", clean).strip("_").lower()

    def _find_column(self, df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
        cols_normalized = {self._normalize_name(c): c for c in df.columns}
        for cand in candidates:
            cand_norm = self._normalize_name(cand)
            if cand_norm in cols_normalized:
                return cols_normalized[cand_norm]
        return None

    def validate(self, df: pd.DataFrame) -> ValidationReport:
        """Run complete validation suite on input DataFrame without mutating original."""
        report = ValidationReport(total_rows=len(df), total_columns=len(df.columns))

        if df.empty:
            report.add_issue("Dataset is completely empty.")
            return report

        # 1. Missing Values
        missing = df.isnull().sum()
        for col, count in missing.items():
            if count > 0:
                pct = (count / len(df)) * 100
                report.missing_values[col] = {"count": int(count), "percent": float(pct)}
                if pct > 40:
                    report.add_issue(f"High missing rate on column '{col}': {pct:.1f}% missing.")

        # 2. Duplicate Records
        report.duplicate_count = int(df.duplicated().sum())
        if report.duplicate_count > 0:
            report.add_issue(f"Found {report.duplicate_count:,} duplicate rows.")

        # 3. Date Validation
        date_col = self._find_column(df, self.date_cols)
        if date_col:
            if not pd.api.types.is_datetime64_any_dtype(df[date_col]):
                try:
                    parsed_dates = pd.to_datetime(df[date_col], errors="coerce")
                    invalid_dates = int(parsed_dates.isnull().sum() - df[date_col].isnull().sum())
                    report.invalid_dates = max(0, invalid_dates)
                    if report.invalid_dates > 0:
                        report.add_issue(f"Found {report.invalid_dates:,} unparseable date values in '{date_col}'.")
                except Exception as e:
                    report.type_inconsistencies.append(f"Failed to parse date column '{date_col}': {str(e)}")
        else:
            report.add_issue("No standard date column identified in dataset.")

        # 4. Price Constraints
        price_col = self._find_column(df, self.price_cols)
        if price_col:
            if pd.api.types.is_numeric_dtype(df[price_col]):
                report.negative_prices = int((df[price_col] < 0).sum())
                report.zero_prices = int((df[price_col] == 0).sum())
                if report.negative_prices > 0:
                    report.add_issue(f"Detected {report.negative_prices:,} negative prices in '{price_col}'.")
                if report.zero_prices > 0:
                    report.add_issue(f"Detected {report.zero_prices:,} zero-price entries in '{price_col}'.")
            else:
                report.type_inconsistencies.append(f"Price column '{price_col}' is non-numeric.")
                report.add_issue(f"Price column '{price_col}' has non-numeric dtype.")

        # 5. Demand / Quantity Constraints
        demand_col = self._find_column(df, self.demand_cols)
        if demand_col:
            if pd.api.types.is_numeric_dtype(df[demand_col]):
                report.negative_demand = int((df[demand_col] < 0).sum())
                if report.negative_demand > 0:
                    report.add_issue(f"Detected {report.negative_demand:,} negative demand/quantity values in '{demand_col}'.")
            else:
                report.type_inconsistencies.append(f"Demand column '{demand_col}' is non-numeric.")
                report.add_issue(f"Demand column '{demand_col}' has non-numeric dtype.")

        # 6. Outlier Detection on Numeric Columns (IQR rule)
        num_cols = df.select_dtypes(include=[np.number]).columns
        for col in num_cols:
            q25 = df[col].quantile(0.25)
            q75 = df[col].quantile(0.75)
            iqr = q75 - q25
            if iqr > 0:
                lower = q25 - 1.5 * iqr
                upper = q75 + 1.5 * iqr
                outlier_count = int(((df[col] < lower) | (df[col] > upper)).sum())
                if outlier_count > 0:
                    report.outliers[col] = outlier_count

        return report
