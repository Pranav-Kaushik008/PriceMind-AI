"""
PriceMind AI — Feature Engineering Configuration
Centralized configuration dataclasses and defaults for reproducible feature extraction.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class FeatureConfig:
    """
    Configurable parameters for all feature extraction transformations.
    """
    # Core Entity & Temporal identifiers
    date_col: str = "date"
    sku_col: str = "sku_id"
    store_col: str = "store_id"
    group_cols: List[str] = field(default_factory=lambda: ["sku_id", "store_id"])

    # Target definition
    target_col: str = "units_sold"

    # Raw Price & Cost columns
    price_col: str = "price"
    cost_col: str = "cost_price"
    competitor_col: str = "competitor_price"
    revenue_col: str = "revenue"
    inventory_col: str = "inventory_level"
    promotion_col: str = "is_promotion"

    # Categorical columns to encode
    low_cardinality_categoricals: List[str] = field(default_factory=lambda: ["category", "store_id"])

    # Temporal & Cyclical configuration
    cyclical_features: List[str] = field(default_factory=lambda: ["month", "day_of_week", "week_of_year"])

    # Lag windows (in days)
    demand_lags: List[int] = field(default_factory=lambda: [1, 7, 14, 28])
    price_lags: List[int] = field(default_factory=lambda: [1, 7, 14])
    revenue_lags: List[int] = field(default_factory=lambda: [1, 7])
    inventory_lags: List[int] = field(default_factory=lambda: [1, 7])

    # Rolling window sizes (in days)
    rolling_windows: List[int] = field(default_factory=lambda: [7, 14, 28])
    rolling_stats: List[str] = field(default_factory=lambda: ["mean", "std", "min", "max"])

    # Missing value imputation policy
    fill_lag_nas: bool = True
    drop_unusable_lead_nas: bool = True
