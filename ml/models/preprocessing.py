"""
PriceMind AI — Demand Modeling Preprocessing & Time-Aware Data Splitter
Provides strict chronological splitting, feature extraction, and leakage prevention.
"""

from typing import Tuple, List, Optional, Set
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class DataSplitter:
    """
    Time-aware, chronological data splitter ensuring strictly zero forward leakage.
    """

    @staticmethod
    def chronological_split(
        df: pd.DataFrame,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        date_col: str = "date",
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Splits dataset chronologically into Train, Validation, and Test partitions.
        """
        if date_col not in df.columns:
            raise ValueError(f"Date column '{date_col}' not found in dataset for chronological split.")

        if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
            raise ValueError(f"Split ratios must sum to 1.0. Got: {train_ratio + val_ratio + test_ratio}")

        # Ensure sorted by date
        sorted_df = df.sort_values(by=[date_col]).reset_index(drop=True)
        n = len(sorted_df)

        train_end = int(n * train_ratio)
        val_end = int(n * (train_ratio + val_ratio))

        train_df = sorted_df.iloc[:train_end].copy()
        val_df = sorted_df.iloc[train_end:val_end].copy()
        test_df = sorted_df.iloc[val_end:].copy()

        logger.info(
            f"Chronological split complete: "
            f"Train={len(train_df):,} ({train_df[date_col].min()} to {train_df[date_col].max()}) | "
            f"Val={len(val_df):,} ({val_df[date_col].min()} to {val_df[date_col].max()}) | "
            f"Test={len(test_df):,} ({test_df[date_col].min()} to {test_df[date_col].max()})"
        )

        return train_df, val_df, test_df


class FeaturePreprocessor:
    """
    Extracts model-ready numerical feature matrices and targets from feature engineering outputs.
    """

    DEFAULT_EXCLUDE_COLUMNS: Set[str] = {
        "date",
        "sku_id",
        "sku_name",
        "category",
        "store_id",
        "units_sold",
        "log_units_sold",
        "revenue",
        "log_revenue",
    }

    def __init__(
        self,
        target_col: str = "units_sold",
        exclude_cols: Optional[Set[str]] = None,
    ):
        self.target_col = target_col
        self.exclude_cols = exclude_cols or self.DEFAULT_EXCLUDE_COLUMNS
        self.feature_names_: List[str] = []

    def get_features_and_target(
        self,
        df: pd.DataFrame,
        is_training: bool = False,
    ) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
        """
        Validates target presence and extracts numeric predictors.
        """
        if self.target_col not in df.columns:
            raise ValueError(
                f"Target column '{self.target_col}' is missing from the dataset. "
                f"Cannot train or evaluate demand prediction models without an observed target."
            )

        if is_training or not self.feature_names_:
            # Identify all numerical columns not in exclude list
            numeric_cols = [
                c for c in df.columns
                if c not in self.exclude_cols and pd.api.types.is_numeric_dtype(df[c])
            ]
            self.feature_names_ = sorted(numeric_cols)

        # Check for any missing features in inference
        missing_feats = [c for c in self.feature_names_ if c not in df.columns]
        if missing_feats:
            raise ValueError(f"Dataset is missing required model features: {missing_feats[:5]}...")

        X = df[self.feature_names_].copy().fillna(0.0)
        y = df[self.target_col].copy()

        return X, y, self.feature_names_
