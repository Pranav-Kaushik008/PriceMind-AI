# PriceMind AI — ML Artifacts & MLOps Structure

This directory houses trained machine learning model artifacts, evaluation metrics, and time-series forecasts.

## Structure

- `models/`: Production and benchmark model binaries (`demand_model_production.joblib`, LightGBM, Random Forest).
- `metrics/`: JSON metadata containing feature names, hyperparameter configurations, and evaluation scores.
- `forecasts/`: Time-series forecasting metadata and Holt-Winters/SARIMAX artifacts.
- `predictions/`: Serialized batch inference and holdout demand predictions.

## MLflow Integration

Model tracking, parameters, metrics, and artifact registration are managed through **MLflow 3.x**.
- **Tracking URI**: Configured via `MLFLOW_TRACKING_URI` (defaults to local `sqlite:///mlruns.db` in development).
- **Model Registry**: Production model alias is maintained under `PriceMind-Demand-XGBoost@production`.
- **Fallback**: If MLflow server is offline, the FastAPI service automatically falls back to `models/demand_model_production.joblib`.
