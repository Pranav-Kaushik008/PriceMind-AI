"""
PriceMind AI — Baseline Data Generator
Creates a realistic historical pricing dataset with real price-elasticity dynamics.
"""

from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_dataset(output_path: Path, n_days: int = 365, seed: int = 42):
    np.random.seed(seed)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    products = [
        {
            "sku_id": "SKU-8921-PRO",
            "sku_name": "Precision Industrial Calibrator X1",
            "category": "Hardware & Tools",
            "base_price": 389.0,
            "cost_price": 225.0,
            "base_demand": 42.0,
            "elasticity": -1.34,
            "competitor_base": 420.0,
        },
        {
            "sku_id": "SKU-3320-SENS",
            "sku_name": "ThermoGuard Pro Multi-Sensor",
            "category": "IoT Hardware",
            "base_price": 149.0,
            "cost_price": 92.0,
            "base_demand": 68.0,
            "elasticity": -2.10,
            "competitor_base": 145.0,
        },
        {
            "sku_id": "SKU-4412-MTR",
            "sku_name": "UltraFlow Core Flowmeter 500",
            "category": "Hardware & Tools",
            "base_price": 520.0,
            "cost_price": 310.0,
            "base_demand": 24.0,
            "elasticity": -0.95,
            "competitor_base": 560.0,
        },
        {
            "sku_id": "SKU-1090-CAB",
            "sku_name": "Armored Industrial Bus Cable 50m",
            "category": "Accessories",
            "base_price": 68.0,
            "cost_price": 48.0,
            "base_demand": 110.0,
            "elasticity": -0.45,
            "competitor_base": 65.0,
        },
        {
            "sku_id": "SKU-7731-SFT",
            "sku_name": "SensorCore Analytics Suite",
            "category": "Software",
            "base_price": 1000.0,
            "cost_price": 510.0,
            "base_demand": 14.0,
            "elasticity": -0.65,
            "competitor_base": 980.0,
        },
    ]

    stores = ["STORE-NORTH-01", "STORE-WEST-02", "STORE-ONLINE-GLOBAL"]
    start_date = datetime(2025, 9, 1)

    records = []

    for day_idx in range(n_days):
        curr_date = start_date + timedelta(days=day_idx)
        # Seasonal factor (sinusoidal)
        seasonality = 1.0 + 0.15 * np.sin(2 * np.pi * day_idx / 365.25)
        # Day of week effect (higher on weekdays for B2B)
        dow_factor = 1.15 if curr_date.weekday() < 5 else 0.70

        for prod in products:
            for store in stores:
                # Occasional price test or promotion
                is_promo = np.random.choice([0, 1], p=[0.85, 0.15])
                price_noise = np.random.normal(0, 0.04)
                if is_promo:
                    price_noise -= 0.10 # 10% promo discount
                
                price = round(prod["base_price"] * (1 + price_noise), 2)
                price_ratio = price / prod["base_price"]

                # Economic demand function: Q = Q0 * (P/P0)^Ed * Seasonality * DOW * Noise
                elastic_multiplier = (price_ratio) ** prod["elasticity"]
                noise = np.random.lognormal(0, 0.12)
                demand_val = prod["base_demand"] * elastic_multiplier * seasonality * dow_factor * noise / len(stores)
                units_sold = max(0, int(np.round(demand_val)))

                # Competitor price
                comp_noise = np.random.normal(0, 0.03)
                competitor_price = round(prod["competitor_base"] * (1 + comp_noise), 2)

                # Inventory simulation
                inventory = int(np.random.uniform(150, 800))

                records.append({
                    "date": curr_date.strftime("%Y-%m-%d"),
                    "sku_id": prod["sku_id"],
                    "sku_name": prod["sku_name"],
                    "category": prod["category"],
                    "store_id": store,
                    "price": price,
                    "cost_price": prod["cost_price"],
                    "units_sold": units_sold,
                    "revenue": round(price * units_sold, 2),
                    "competitor_price": competitor_price,
                    "inventory_level": inventory,
                    "is_promotion": int(is_promo),
                })

    df = pd.DataFrame(records)

    # Insert controlled realistic edge cases for validator testing
    # 1. A few duplicate rows (3 rows)
    duplicates = df.iloc[:3].copy()
    df = pd.concat([df, duplicates], ignore_index=True)

    df.to_csv(output_path, index=False)
    print(f"Generated sample dataset: {len(df):,} records saved to {output_path}")
    return df

if __name__ == "__main__":
    raw_path = Path(__file__).resolve().parents[2] / "data" / "raw" / "pricing_transactions.csv"
    generate_sample_dataset(raw_path)
