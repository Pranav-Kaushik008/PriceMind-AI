---
title: Time-Series Demand Forecasting Methodology
category: forecasting
document_type: methodology
version: 1.0.0
last_updated: 2026-03-15
---

# Time-Series Demand Forecasting Methodology

## 1. Overview
While the demand prediction model (XGBoost) predicts single-day demand given explicit feature vectors, the **Demand Forecasting Engine** generates multi-step temporal projections across horizons (7, 14, 30, and 90 days) with confidence intervals.

## 2. Algorithms & Selection
- **Exponential Smoothing (Holt-Winters)**:
  - Models level, trend, and seasonal components additively or multiplicatively.
  - Production benchmark: RMSE = 4.078 units/day.
- **SARIMAX (Seasonal AutoRegressive Integrated Moving Average with eXogenous variables)**:
  - Incorporates exogenous price series, holiday calendars, and promotional schedules.
  - Specification: (p, d, q) x (P, D, Q)_s.

## 3. Uncertainty Estimation & Prediction Intervals
- Forecasting outputs include 80% and 95% confidence bands calculated via empirical residual bootstrapping and parametric variance estimation:
  Y_hat_{t+h} +/- z_{alpha/2} * sigma_h
- Used for safety stock calculations and risk-adjusted revenue projections.
