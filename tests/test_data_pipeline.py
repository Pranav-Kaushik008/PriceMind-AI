"""
PriceMind AI — Tests for Module 1 Data Foundation & Pipeline
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import shutil

from ml.data.loader import DataLoader
from ml.data.validator import DataValidator
from ml.data.cleaner import DataCleaner
from ml.data.pipeline import DataPipeline


@pytest.fixture
def sample_raw_df():
    return pd.DataFrame({
        "Transaction Date": ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-03", "invalid-date"],
        "SKU ID": ["SKU-01", "SKU-01", "SKU-02", "SKU-02", "SKU-03"],
        "Unit Price": [100.0, 105.0, 50.0, 50.0, -10.0],
        "Units Sold": [10, 8, 20, 20, -5],
        "Cost Price": [60.0, 60.0, 30.0, 30.0, 30.0],
    })


@pytest.fixture
def temp_data_dirs():
    temp_dir = Path(tempfile.mkdtemp())
    raw_dir = temp_dir / "raw"
    processed_dir = temp_dir / "processed"
    raw_dir.mkdir(parents=True)
    processed_dir.mkdir(parents=True)
    yield raw_dir, processed_dir
    shutil.rmtree(temp_dir)


def test_data_loader_valid_and_invalid(temp_data_dirs):
    raw_dir, _ = temp_data_dirs
    sample_file = raw_dir / "test.csv"
    df = pd.DataFrame({"a": [1, 2], "b": [3, 4]})
    df.to_csv(sample_file, index=False)

    unsupported_file = raw_dir / "test.unsupported_ext"
    unsupported_file.write_text("dummy")

    loader = DataLoader(raw_dir)
    loaded = loader.load_file(sample_file)
    assert len(loaded) == 2
    assert list(loaded.columns) == ["a", "b"]

    with pytest.raises(FileNotFoundError):
        loader.load_file(raw_dir / "nonexistent.csv")

    with pytest.raises(ValueError):
        loader.load_file(unsupported_file)


def test_data_validator_detects_anomalies(sample_raw_df):
    validator = DataValidator()
    report = validator.validate(sample_raw_df)

    assert report.total_rows == 5
    assert report.duplicate_count == 1
    assert report.negative_prices == 1
    assert report.negative_demand == 1
    assert report.invalid_dates >= 1
    assert not report.is_valid

    report_dict = report.to_dict()
    assert "issues" in report_dict
    assert len(report_dict["issues"]) > 0

    report_md = report.to_markdown()
    assert "# PriceMind AI — Data Validation Report" in report_md


def test_data_cleaner_transformations(sample_raw_df):
    cleaner = DataCleaner()
    cleaned, audit_log = cleaner.clean(sample_raw_df)

    # 1. Snake case columns
    assert "transaction_date" in cleaned.columns
    assert "unit_price" in cleaned.columns
    assert "units_sold" in cleaned.columns

    # 2. Derived revenue
    assert "revenue" in cleaned.columns

    # 3. Filtered duplicates & invalid negative prices/dates
    assert (cleaned["unit_price"] > 0).all()
    assert (cleaned["units_sold"] >= 0).all()
    assert len(cleaned) == 3

    assert len(audit_log) > 0


def test_full_pipeline_execution(temp_data_dirs, sample_raw_df):
    raw_dir, processed_dir = temp_data_dirs
    raw_file = raw_dir / "raw_transactions.csv"
    sample_raw_df.to_csv(raw_file, index=False)

    pipeline = DataPipeline(raw_dir=raw_dir, processed_dir=processed_dir)
    summary = pipeline.run("raw_transactions.csv")

    assert summary["status"] == "SUCCESS"
    assert summary["raw_records"] == 5
    assert summary["cleaned_records"] == 3
    assert Path(summary["processed_csv"]).exists()
    assert Path(summary["processed_parquet"]).exists()
    assert (processed_dir / "validation_report.json").exists()
    assert (processed_dir / "validation_report.md").exists()
