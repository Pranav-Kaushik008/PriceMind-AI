"""
notebooks/build_mlflow_notebook.py
----------------------------------
Builds and saves notebooks/10_mlflow_experiment_tracking.ipynb programmatically.
"""

import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

# Cell 0: Title
cells.append(nbf.v4.new_markdown_cell("""# Module 10 — MLflow Experiment Tracking & MLOps
**PriceMind AI**

This notebook demonstrates the production-grade MLOps layer:
- Centralized MLflow Tracking
- Hyperparameter, Metric & Artifact Logging
- MLflow Model Registry & Model Promotion
- Model Loading & Version Verification
- SHAP Explainability & Prediction Compatibility
"""))

# Cell 1: Setup & Imports
cells.append(nbf.v4.new_code_cell("""\
import sys, os
sys.path.insert(0, os.path.abspath(".."))

import warnings
warnings.filterwarnings("ignore")

import mlflow
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from ml.tracking import (
    setup_mlflow,
    get_tracking_uri,
    is_mlflow_enabled,
    EXPERIMENT_DEMAND_PREDICTION,
    get_or_create_experiment,
    set_active_experiment,
    ProductionModelLoader,
)

print(f"MLflow Version: {mlflow.__version__}")
print(f"Tracking URI: {get_tracking_uri()}")
print(f"Tracking Enabled: {is_mlflow_enabled()}")
"""))

# Cell 2: Experiment Setup
cells.append(nbf.v4.new_code_cell("""\
setup_mlflow()
exp_id = set_active_experiment(EXPERIMENT_DEMAND_PREDICTION)
print(f"Active Experiment: {EXPERIMENT_DEMAND_PREDICTION} (ID: {exp_id})")
"""))

# Cell 3: Train & Track XGBoost
cells.append(nbf.v4.new_code_cell("""\
from ml.training.train_xgboost import train_and_track_xgboost

print("Training & Tracking XGBoost Regressor...")
xgb_results = train_and_track_xgboost(
    n_estimators=150,
    max_depth=6,
    learning_rate=0.08,
    register_model=True,
    promote_to_production=True,
)

print(f"\\nXGBoost Run ID: {xgb_results['run_id']}")
print(f"Registered Version: {xgb_results['registered_version']}")
print(f"Test RMSE: {xgb_results['test_metrics']['rmse']:.4f}")
print(f"Test R2: {xgb_results['test_metrics']['r2']:.4f}")
"""))

# Cell 4: Train & Track LightGBM
cells.append(nbf.v4.new_code_cell("""\
from ml.training.train_lightgbm import train_and_track_lightgbm

print("Training & Tracking LightGBM Regressor...")
lgb_results = train_and_track_lightgbm(
    n_estimators=150,
    max_depth=6,
    learning_rate=0.08,
    register_model=True,
)

print(f"\\nLightGBM Run ID: {lgb_results['run_id']}")
print(f"Registered Version: {lgb_results['registered_version']}")
print(f"Test RMSE: {lgb_results['test_metrics']['rmse']:.4f}")
print(f"Test R2: {lgb_results['test_metrics']['r2']:.4f}")
"""))

# Cell 5: Compare MLflow Runs
cells.append(nbf.v4.new_code_cell("""\
from ml.training.evaluate_models import compare_mlflow_runs

comparison_df = compare_mlflow_runs()
print("=== Candidate Model Benchmark Comparison ===")
print(comparison_df[["run_id", "model_type", "test_rmse", "test_mae", "test_r2", "status"]].to_string(index=False))
"""))

# Cell 6: Load Production Model via ModelLoader
cells.append(nbf.v4.new_code_cell("""\
loader = ProductionModelLoader()
model, version, source = loader.load()

print(f"Production Model Object: {type(model).__name__}")
print(f"Model Version: {version}")
print(f"Source: {source}")
print(f"Feature Count: {len(loader.feature_names)}")
"""))

# Cell 7: Generate Demand Prediction with Model
cells.append(nbf.v4.new_code_cell("""\
features_df = pd.read_parquet("../data/processed/features.parquet")
sample_row = features_df.tail(1)[loader.feature_names]

prediction = float(model.predict(sample_row)[0])
print(f"Sample Input Price: ${sample_row['price'].iloc[0]:.2f}")
print(f"Predicted Expected Demand: {prediction:.2f} units")
"""))

# Cell 8: SHAP Explainability on Production Model
cells.append(nbf.v4.new_code_cell("""\
from ml.explainability.explainer import ShapExplainer
from ml.explainability.local_explanations import LocalExplainer

explainer = ShapExplainer(model=model, feature_names=loader.feature_names).load()
local_exp = LocalExplainer(explainer)

explanation = local_exp.explain_prediction(sample_row, top_n=5)
print(f"Base Value E[f(X)]: {explanation.base_value:.2f}")
print(f"Reconstructed Prediction: {explanation.predicted_value:.2f}")
print(f"Additive Consistent: {explanation.additive_consistent}")
print(f"Top 3 Positive Drivers: {[(c.feature_name, round(c.shap_value, 3)) for c in explanation.top_positive_contributors[:3]]}")
print(f"Top 3 Negative Drivers: {[(c.feature_name, round(c.shap_value, 3)) for c in explanation.top_negative_contributors[:3]]}")
"""))

# Cell 9: Summary
cells.append(nbf.v4.new_markdown_cell("""\
## Module 10 Summary
- MLflow tracking server and experiments initialized.
- XGBoost and LightGBM tracked with parameters, metrics, plots, and signatures.
- Production model registered and promoted with alias `production`.
- `ProductionModelLoader` provides seamless registry loading and local fallback.
- Predictions and SHAP explanations verify exact model version consistency.
"""))

nb.cells = cells

output_path = "notebooks/10_mlflow_experiment_tracking.ipynb"
with open(output_path, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

print(f"[OK] Notebook created: {output_path}")
