"""
PriceMind AI — Data Foundation Pipeline
Orchestrates raw loading, validation, cleaning, and processed storage.
"""

import sys
from pathlib import Path
from typing import Optional, Dict, Any
import json
import logging

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.data.loader import DataLoader
from ml.data.validator import DataValidator, ValidationReport
from ml.data.cleaner import DataCleaner

logger = logging.getLogger(__name__)


class DataPipeline:
    """
    Reproducible end-to-end data processing pipeline for PriceMind AI.
    """

    def __init__(
        self,
        raw_dir: Optional[Path] = None,
        processed_dir: Optional[Path] = None,
    ):
        base_dir = Path(__file__).resolve().parents[2]
        self.raw_dir = raw_dir or (base_dir / "data" / "raw")
        self.processed_dir = processed_dir or (base_dir / "data" / "processed")
        self.processed_dir.mkdir(parents=True, exist_ok=True)

        self.loader = DataLoader(self.raw_dir)
        self.validator = DataValidator()
        self.cleaner = DataCleaner()

    def run(self, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute full pipeline: Load -> Validate -> Clean -> Export.
        """
        logger.info("Starting PriceMind AI Data Foundation Pipeline...")

        # 1. Load Raw Data
        df_raw = self.loader.load_raw_dataset(filename)
        initial_count = len(df_raw)

        # 2. Validate
        report: ValidationReport = self.validator.validate(df_raw)
        
        # Save Validation Reports
        val_json_path = self.processed_dir / "validation_report.json"
        val_md_path = self.processed_dir / "validation_report.md"

        with open(val_json_path, "w", encoding="utf-8") as f:
            json.dump(report.to_dict(), f, indent=2)

        with open(val_md_path, "w", encoding="utf-8") as f:
            f.write(report.to_markdown())

        logger.info(f"Saved validation report to {val_md_path}")

        # 3. Clean & Normalize
        df_cleaned, audit_log = self.cleaner.clean(df_raw)
        final_count = len(df_cleaned)

        # Save Cleaning Audit Log
        audit_json_path = self.processed_dir / "cleaning_audit_log.json"
        with open(audit_json_path, "w", encoding="utf-8") as f:
            json.dump(audit_log, f, indent=2)

        # 4. Save Processed Dataset (CSV and Parquet)
        out_csv = self.processed_dir / "pricing_dataset_cleaned.csv"
        out_parquet = self.processed_dir / "pricing_dataset_cleaned.parquet"

        df_cleaned.to_csv(out_csv, index=False)
        df_cleaned.to_parquet(out_parquet, index=False)

        logger.info(f"Successfully exported cleaned data ({final_count:,} rows) to {out_csv} and {out_parquet}")

        summary = {
            "status": "SUCCESS",
            "raw_records": initial_count,
            "cleaned_records": final_count,
            "retained_pct": round((final_count / max(initial_count, 1)) * 100, 2),
            "columns": list(df_cleaned.columns),
            "validation_report": report.to_dict(),
            "processed_csv": str(out_csv),
            "processed_parquet": str(out_parquet),
            "transformations_applied": len(audit_log),
        }

        return summary


if __name__ == "__main__":
    pipeline = DataPipeline()
    result = pipeline.run()
    print("\n--- Pipeline Execution Summary ---")
    print(json.dumps(result, indent=2))
