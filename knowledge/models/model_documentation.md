---
title: PriceMind AI Demand Prediction Model Documentation
category: models
document_type: specification
version: 1.0.0
last_updated: 2026-03-15
---

# Demand Prediction Model Documentation

## 1. Model Architecture
The core demand prediction engine employs a gradient-boosted decision tree ensemble (**XGBoost Regressor**) tuned for retail demand estimation. A benchmark LightGBM model and baseline Ridge/RandomForest models are maintained for performance comparison.

## 2. Hyperparameters (Production XGBoost)
- **n_estimators**: 300
- **learning_rate**: 0.05
- **max_depth**: 6
- **subsample**: 0.85
- **colsample_bytree**: 0.80
- **min_child_weight**: 3
- **objective**: `reg:squarederror`
- **random_state**: 42

## 3. Training & Validation Regimen
- **Data Splitting**: Temporal train/validation/test split preserving time-series order (Train: 70%, Validation: 15%, Out-of-Time Test: 15%).
- **Evaluation Metrics**:
  - Out-of-Time Test R-squared: 0.9444
  - Root Mean Squared Error (RMSE): 2.14 units/day
  - Mean Absolute Error (MAE): 1.42 units/day
  - Mean Absolute Percentage Error (MAPE): 4.18%

## 4. Feature Space
The model consumes 88 engineered features across 5 major groups:
1. **Direct Pricing & Competitor Dynamics**: Current unit price, competitor price ratio, discount depth, price relative to category average.
2. **Lagged Demand Features**: Lags 1, 2, 3, 7, 14, 21, and 28 days.
3. **Rolling Window Aggregations**: 7-day, 14-day, and 28-day rolling means, standard deviations, min, max, and demand momentum.
4. **Calendar & Seasonality Features**: Day of week (one-hot), month of year, is_weekend, day of month, quarter, week of year.
5. **Promotional & Event Flags**: On promotion indicator, holiday proximity, marketing campaign intensity index.
