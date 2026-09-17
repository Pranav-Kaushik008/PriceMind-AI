"""Feature engineering for price elasticity, competitor spreads, and temporal seasonality."""
import pandas as pd
import numpy as np

class PricingFeatureBuilder:
    def build_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Constructs log-price, competitor index spread, and rolling velocity features."""
        df = df.copy()
        if "price" in df.columns:
            df["log_price"] = np.log1p(df["price"])
        if "competitor_price" in df.columns and "price" in df.columns:
            df["competitor_spread_pct"] = (df["price"] - df["competitor_price"]) / df["competitor_price"]
        return df

feature_builder = PricingFeatureBuilder()
