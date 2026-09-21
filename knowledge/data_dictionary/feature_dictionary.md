---
title: PriceMind AI Feature Engineering Data Dictionary
category: data_dictionary
document_type: reference
version: 1.0.0
last_updated: 2026-03-15
---

# Feature Engineering Data Dictionary

## 1. Feature Categories & Definitions
The feature store maintains 88 production-engineered features:

| Feature Name | Type | Description | Range / Domain |
| :--- | :--- | :--- | :--- |
| `current_price` | Float | Unit selling price of the SKU | > 0.0 |
| `cost_price` | Float | Unit cost price from ERP | > 0.0 |
| `margin_amount` | Float | Current gross profit per unit (P - C) | Any float |
| `margin_percent` | Float | Percentage gross margin ((P - C) / P * 100) | 0.0% - 100.0% |
| `competitor_price` | Float | Benchmark direct competitor price | > 0.0 |
| `price_ratio` | Float | Ratio of our price to competitor (P / P_comp) | Typical 0.70 - 1.40 |
| `price_diff` | Float | Absolute price difference (P - P_comp) | Any float |
| `discount_pct` | Float | Active discount percentage from base list price | 0.0% - 70.0% |
| `demand_lag_1` | Float | Actual sales units sold 1 day prior (t-1) | >= 0 |
| `demand_lag_7` | Float | Actual sales units sold 7 days prior (t-7) | >= 0 |
| `demand_lag_14` | Float | Actual sales units sold 14 days prior (t-14) | >= 0 |
| `demand_lag_28` | Float | Actual sales units sold 28 days prior (t-28) | >= 0 |
| `rolling_mean_7` | Float | 7-day simple moving average of sales volume | >= 0 |
| `rolling_mean_14` | Float | 14-day simple moving average of sales volume | >= 0 |
| `rolling_mean_28` | Float | 28-day simple moving average of sales volume | >= 0 |
| `rolling_std_7` | Float | 7-day standard deviation of sales volume | >= 0 |
| `rolling_std_28` | Float | 28-day standard deviation of sales volume | >= 0 |
| `inventory_level` | Integer | Current stock on hand in distribution center | >= 0 |
| `days_of_inventory` | Float | Estimated days of inventory remaining at current velocity | >= 0 |
| `is_weekend` | Integer | Binary flag: 1 if Saturday/Sunday, 0 otherwise | {0, 1} |
| `day_of_week` | Integer | Day of week integer (0=Monday, 6=Sunday) | 0 - 6 |
| `month` | Integer | Month of year | 1 - 12 |
| `is_holiday` | Integer | Binary flag for federal/regional holiday | {0, 1} |
| `is_promoted` | Integer | Binary flag for active marketing campaign | {0, 1} |
