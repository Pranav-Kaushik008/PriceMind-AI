"""
PriceMind AI — Tests for Module 2 Feature Engineering
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import shutil

from ml.features.feature_config import FeatureConfig
from ml.features.temporal_features import TemporalFeatureExtractor
from ml.features.pricing_features import PricingFeatureExtractor
from ml.features.demand_features import DemandFeatureExtractor
from ml.features.inventory_features import InventoryFeatureExtractor
from ml.features.feature_pipeline import FeaturePipeline


@pytest.fixture
def sample_timeseries_df():
    dates = pd.date_range(start="2026-01-01", periods=60, freq="D")
    records = []
    for d in dates:
        for sku in ["SKU-01", "SKU-02"]:
            for store in ["STORE-A"]:
                price = 100.0 if sku == "SKU-01" else 50.0
                records.append({
                    "date": d,
                    "sku_id": sku,
                    "sku_name": f"Product {sku}",
                    "category": "Electronics",
                    "store_id": store,
                    "price": price + (5.0 if d.day % 7 == 0 else 0.0),
                    "cost_price": price * 0.6,
                    "units_sold": 10 + (sku == "SKU-01") * 5 + d.day % 4,
                    "revenue": price * 10,
                    "competitor_price": price * 1.05,
                    "inventory_level": 500 - d.day * 2,
                    "is_promotion": int(d.day % 10 == 0),
                })
    return pd.DataFrame(records)


@pytest.fixture
def temp_feature_dirs():
    temp_dir = Path(tempfile.mkdtemp())
    data_dir = temp_dir / "data" / "processed"
    reports_dir = temp_dir / "reports"
    data_dir.mkdir(parents=True)
    reports_dir.mkdir(parents=True)
    yield data_dir, reports_dir
    shutil.rmtree(temp_dir)


def test_temporal_features(sample_timeseries_df):
    extractor = TemporalFeatureExtractor()
    out = extractor.transform(sample_timeseries_df)

    assert "year" in out.columns
    assert "month" in out.columns
    assert "day_of_week" in out.columns
    assert "is_weekend" in out.columns
    assert "month_sin" in out.columns
    assert "month_cos" in out.columns
    assert "dow_sin" in out.columns
    assert "dow_cos" in out.columns

    # Verify sine/cosine range [-1, 1]
    assert out["month_sin"].between(-1.0, 1.0).all()
    assert out["dow_cos"].between(-1.0, 1.0).all()


def test_pricing_features(sample_timeseries_df):
    extractor = PricingFeatureExtractor()
    out = extractor.transform(sample_timeseries_df)

    assert "log_price" in out.columns
    assert "price_lag_1" in out.columns
    assert "price_change_1d" in out.columns
    assert "price_to_cost_markup" in out.columns
    assert "competitor_spread_pct" in out.columns
    assert "is_undercut_by_competitor" in out.columns


def test_demand_features_leakage_prevention(sample_timeseries_df):
    extractor = DemandFeatureExtractor()
    out = extractor.transform(sample_timeseries_df)

    assert "log_units_sold" in out.columns
    assert "demand_lag_1" in out.columns
    assert "demand_rolling_mean_7" in out.columns

    # STRICT LEAKAGE VERIFICATION:
    # For any row t > 0 within a group, demand_lag_1 must equal units_sold at t-1
    for (sku, store), group in out.groupby(["sku_id", "store_id"]):
        group_sorted = group.sort_values("date")
        actual_t_minus_1 = group_sorted["units_sold"].shift(1).iloc[1:]
        lag_1_vals = group_sorted["demand_lag_1"].iloc[1:]
        assert np.allclose(actual_t_minus_1, lag_1_vals)


def test_inventory_features(sample_timeseries_df):
    # First extract demand rolling mean to allow runway proxy calculation
    d_extractor = DemandFeatureExtractor()
    df_with_demand = d_extractor.transform(sample_timeseries_df)

    i_extractor = InventoryFeatureExtractor()
    out = i_extractor.transform(df_with_demand)

    assert "inventory_lag_1" in out.columns
    assert "inventory_change_1d" in out.columns
    assert "days_of_supply_proxy" in out.columns
    assert "is_stockout_risk_flag" in out.columns


def test_master_feature_pipeline_execution(temp_feature_dirs, sample_timeseries_df):
    data_dir, reports_dir = temp_feature_dirs
    raw_processed_file = data_dir / "pricing_dataset_cleaned.parquet"
    sample_timeseries_df.to_parquet(raw_processed_file, index=False)

    pipeline = FeaturePipeline(data_dir=data_dir, reports_dir=reports_dir)
    df_out, summary = pipeline.run("pricing_dataset_cleaned.parquet")

    assert summary["status"] == "SUCCESS"
    assert summary["feature_dataset_rows"] > 0
    assert summary["total_features"] > 30
    assert Path(summary["output_parquet"]).exists()
    assert Path(summary["output_csv"]).exists()
    assert Path(summary["feature_report_csv"]).exists()
    assert Path(summary["feature_report_md"]).exists()
