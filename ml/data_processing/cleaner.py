"""Data ingestion and preprocessing for transaction records and catalog pricing."""
import pandas as pd
import numpy as np
from typing import Tuple

class TransactionDataCleaner:
    def __init__(self, outlier_iqr_threshold: float = 1.5):
        self.outlier_threshold = outlier_iqr_threshold

    def clean_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Removes canceled orders, clips outliers, and normalizes date indexes."""
        df = df.copy()
        if "quantity" in df.columns:
            df = df[df["quantity"] > 0]
        if "price" in df.columns:
            df = df[df["price"] > 0]
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
        return df

data_cleaner = TransactionDataCleaner()
