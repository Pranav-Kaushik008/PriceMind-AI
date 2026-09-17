"""
PriceMind AI — Master Feature Engineering Pipeline
Orchestrates temporal, pricing, demand, inventory, and categorical encodings into model-ready features.
"""

import sys
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import pandas as pd
import numpy as np
import json
import logging

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.features.feature_config import FeatureConfig
from ml.features.temporal_features import TemporalFeatureExtractor
from ml.features.pricing_features import PricingFeatureExtractor
from ml.features.demand_features import DemandFeatureExtractor
from ml.features.inventory_features import InventoryFeatureExtractor

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class FeaturePipeline:
    """
    End-to-end reproducible feature engineering pipeline.
    """

    def __init__(
        self,
        config: Optional[FeatureConfig] = None,
        data_dir: Optional[Path] = None,
        reports_dir: Optional[Path] = None,
    ):
        self.config = config or FeatureConfig()
        base_dir = Path(__file__).resolve().parents[2]
        self.data_dir = data_dir or (base_dir / "data" / "processed")
        self.reports_dir = reports_dir or (base_dir / "reports")
        self.reports_dir.mkdir(parents=True, exist_ok=True)

        self.temporal_extractor = TemporalFeatureExtractor(self.config)
        self.pricing_extractor = PricingFeatureExtractor(self.config)
        self.demand_extractor = DemandFeatureExtractor(self.config)
        self.inventory_extractor = InventoryFeatureExtractor(self.config)

    def load_processed_data(self, filename: Optional[str] = None) -> pd.DataFrame:
        """Load cleaned dataset from parquet or csv."""
        if filename:
            path = self.data_dir / filename
            if path.suffix == ".parquet":
                return pd.read_parquet(path)
            return pd.read_csv(path, parse_dates=[self.config.date_col])

        parquet_path = self.data_dir / "pricing_dataset_cleaned.parquet"
        if parquet_path.exists():
            return pd.read_parquet(parquet_path)

        csv_path = self.data_dir / "pricing_dataset_cleaned.csv"
        if csv_path.exists():
            return pd.read_csv(csv_path, parse_dates=[self.config.date_col])

        raise FileNotFoundError(f"No processed dataset found in '{self.data_dir}'. Run Module 1 DataPipeline first.")

    def encode_categoricals(self, df: pd.DataFrame) -> pd.DataFrame:
        """One-hot encode low cardinality categories and frequency encode SKU identifiers."""
        out = df.copy()

        # 1. Low-cardinality one-hot encoding (category, store_id)
        for cat_col in self.config.low_cardinality_categoricals:
            if cat_col in out.columns:
                dummies = pd.get_dummies(out[cat_col], prefix=cat_col, drop_first=False, dtype=int)
                out = pd.concat([out, dummies], axis=1)

        # 2. SKU Frequency Encoding
        sku_col = self.config.sku_col
        if sku_col in out.columns:
            freq_map = out[sku_col].value_counts(normalize=True).to_dict()
            out["sku_frequency_weight"] = out[sku_col].map(freq_map).astype(float)

        return out

    def generate_feature_report(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate feature quality report detailing name, dtype, missing %, cardinality, and leakage risk.
        """
        rows = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            missing_pct = round((df[col].isnull().sum() / len(df)) * 100, 2)
            n_unique = int(df[col].nunique())

            # Rule-based description & leakage assessment
            if col in {self.config.date_col, self.config.sku_col, "sku_name", self.config.store_col}:
                cat = "Entity / Identifier"
                desc = "Primary key or grouping metadata."
                leakage = "None (Identifier)"
                model_ready = False
            elif col == self.config.target_col or col == "log_units_sold":
                cat = "Target Variable"
                desc = "Actual observed demand volume (target)."
                leakage = "Target (Do not use as predictor)"
                model_ready = False
            elif "lag" in col:
                cat = "Autoregressive Lag"
                desc = f"Historical value shifted by fixed lag days."
                leakage = "Zero (Strictly shifted >= 1d)"
                model_ready = True
            elif "rolling" in col:
                cat = "Rolling Statistic"
                desc = f"Historical window aggregations over shifted t-1 signal."
                leakage = "Zero (Window excludes current t)"
                model_ready = True
            elif col.startswith("category_") or col.startswith("store_id_"):
                cat = "Categorical Encoding"
                desc = "One-hot binary feature."
                leakage = "Zero (Static attribute)"
                model_ready = True
            elif col in {"year", "month", "quarter", "day", "day_of_week", "day_of_year", "week_of_year", "is_weekend"}:
                cat = "Temporal Calendar"
                desc = "Calendar date attribute."
                leakage = "Zero (Known in advance)"
                model_ready = True
            elif "_sin" in col or "_cos" in col:
                cat = "Cyclical Encoding"
                desc = "Continuous trigonometric seasonal wave."
                leakage = "Zero (Known in advance)"
                model_ready = True
            elif "competitor" in col:
                cat = "Competitive Intelligence"
                desc = "Real-time competitor benchmark spread and ratio."
                leakage = "Zero (Point-in-time scrape)"
                model_ready = True
            elif "inventory" in col or "supply" in col or "stock" in col:
                cat = "Inventory Dynamics"
                desc = "Runway proxy and stockout risk indicators."
                leakage = "Zero (Point-in-time stock on hand)"
                model_ready = True
            else:
                cat = "Domain Feature"
                desc = "Pricing, cost, or derived margin indicator."
                leakage = "Zero"
                model_ready = True

            rows.append({
                "feature_name": col,
                "data_type": dtype,
                "category": cat,
                "description": desc,
                "missing_pct": missing_pct,
                "unique_values": n_unique,
                "leakage_risk": leakage,
                "is_model_ready": model_ready,
            })

        report_df = pd.DataFrame(rows)
        return report_df

    def run(self, filename: Optional[str] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Execute full feature engineering pipeline.
        """
        logger.info("Executing PriceMind AI Feature Engineering Pipeline...")

        # 1. Load Processed Clean Data
        df = self.load_processed_data(filename)
        initial_records = len(df)
        logger.info(f"Loaded {initial_records:,} cleaned transaction records.")

        # 2. Extract Temporal Features
        df = self.temporal_extractor.transform(df)

        # 3. Extract Pricing & Competitor Features
        df = self.pricing_extractor.transform(df)

        # 4. Extract Autoregressive Demand Features
        df = self.demand_extractor.transform(df)

        # 5. Extract Inventory & Runway Features
        df = self.inventory_extractor.transform(df)

        # 6. Encode Categoricals
        df = self.encode_categoricals(df)

        # 7. Warmup Window & Missing Value Treatment
        # Because we created 28-day lags, the first 28 days of each entity have NaNs
        if self.config.drop_unusable_lead_nas:
            # Filter records after warmup (drop rows where maximum lag is NaN)
            max_lag_col = f"demand_lag_{max(self.config.demand_lags)}"
            if max_lag_col in df.columns:
                df = df.dropna(subset=[max_lag_col]).reset_index(drop=True)
                logger.info(f"Filtered {initial_records - len(df):,} warmup records (<{max(self.config.demand_lags)}d history). Retained {len(df):,} model-ready rows.")

        # 8. Generate and Export Feature Quality Report
        report_df = self.generate_feature_report(df)
        rep_csv = self.reports_dir / "feature_report.csv"
        rep_md = self.reports_dir / "feature_report.md"

        report_df.to_csv(rep_csv, index=False)
        with open(rep_md, "w", encoding="utf-8") as f:
            f.write("# PriceMind AI — Feature Engineering Quality & Leakage Audit\n\n")
            f.write(report_df.to_markdown(index=False))

        # 9. Save Final Feature Dataset (Parquet & CSV)
        out_parquet = self.data_dir / "features.parquet"
        out_csv = self.data_dir / "features.csv"

        df.to_parquet(out_parquet, index=False)
        df.to_csv(out_csv, index=False)
        logger.info(f"Exported model-ready dataset ({len(df):,} rows x {len(df.columns)} features) to {out_parquet}")

        summary = {
            "status": "SUCCESS",
            "initial_rows": initial_records,
            "feature_dataset_rows": len(df),
            "total_features": len(df.columns),
            "model_ready_features_count": int(report_df["is_model_ready"].sum()),
            "output_parquet": str(out_parquet),
            "output_csv": str(out_csv),
            "feature_report_csv": str(rep_csv),
            "feature_report_md": str(rep_md),
        }

        return df, summary


if __name__ == "__main__":
    pipeline = FeaturePipeline()
    df_features, summary = pipeline.run()
    print("\n--- Feature Pipeline Execution Summary ---")
    print(json.dumps(summary, indent=2))
