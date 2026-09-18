"""
notebooks/build_shap_notebook.py
---------------------------------
Generates the 07_shap_explainability.ipynb notebook programmatically.
"""

import nbformat as nbf

nb = nbf.v4.new_notebook()

cells = []

# ── Cell 0: Title ──────────────────────────────────────────────────────────
cells.append(nbf.v4.new_markdown_cell("""# Module 7 — SHAP Explainability & Model Interpretability
**PriceMind AI**

This notebook demonstrates model-based SHAP explanations for the production XGBoost demand model.

NOTE: SHAP values reflect learned model input-output relationships. They do NOT imply causality.
"""))

# ── Cell 1: Setup ─────────────────────────────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
import sys, os
sys.path.insert(0, os.path.abspath(".."))

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

print("✓ Imports OK")
"""))

# ── Cell 2: Load Features ──────────────────────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
features_df = pd.read_parquet("../data/processed/features.parquet")
print(f"Features shape: {features_df.shape}")
features_df.head(3)
"""))

# ── Cell 3: Initialize ShapExplainer ──────────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
from ml.explainability.explainer import ShapExplainer

explainer = ShapExplainer()
explainer.load()

print(f"Model: {explainer.model_name}")
print(f"Features: {len(explainer.feature_names)}")
print(f"Base value E[f(X)]: {explainer.base_value:.4f}")
"""))

# ── Cell 4: Global Importance ─────────────────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
from ml.explainability.global_explanations import GlobalExplainer

ge = GlobalExplainer(explainer, max_samples=300)
global_df = ge.compute_global_importance(features_df, max_samples=300)

print(f"Global importance computed for {len(global_df)} features")
print("\\nTop 15 features by mean |SHAP|:")
print(global_df.head(15)[["rank", "feature", "mean_abs_shap"]].to_string(index=False))
"""))

# ── Cell 5: Save Global Report ────────────────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
ge.save_report(global_df, output_path="../reports/shap_global_importance.csv")
print("✓ Saved shap_global_importance.csv")
"""))

# ── Cell 6: Plot Top-20 Global Importance ─────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
top20 = ge.top_features(global_df, n=20)

fig, ax = plt.subplots(figsize=(10, 7))
ax.barh(top20["feature"][::-1], top20["mean_abs_shap"][::-1], color="steelblue")
ax.set_xlabel("Mean |SHAP Value| (model contribution magnitude)")
ax.set_title("Top 20 Features — Global SHAP Importance\\n(Model input-output relationship, not causal)")
ax.grid(axis="x", alpha=0.3)
plt.tight_layout()
plt.savefig("../reports/shap_global_importance.png", dpi=120, bbox_inches="tight")
plt.show()
print("✓ Saved shap_global_importance.png")
"""))

# ── Cell 7: Local Explanation ─────────────────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
from ml.explainability.local_explanations import LocalExplainer

le = LocalExplainer(explainer)

# Sample 50 rows for local explanations
sample_100 = features_df.sample(n=50, random_state=42)
X_aligned = explainer.align_features(sample_100)

explanations = le.explain_batch(X_aligned, top_n=10, max_rows=50)
print(f"Generated {len(explanations)} local explanations")
print(f"\\nExample (row 0):")
exp0 = explanations[0]
print(f"  Base value      : {exp0.base_value:.4f}")
print(f"  Predicted demand: {exp0.predicted_value:.4f}")
print(f"  Model prediction: {exp0.model_prediction:.4f}")
print(f"  Additive gap    : {abs(exp0.predicted_value - exp0.model_prediction):.6f}")
print(f"  Additive OK?    : {exp0.additive_consistent}")
print(f"  Top positive    : {[(c.feature_name, round(c.shap_value,4)) for c in exp0.top_positive_contributors[:3]]}")
print(f"  Top negative    : {[(c.feature_name, round(c.shap_value,4)) for c in exp0.top_negative_contributors[:3]]}")
"""))

# ── Cell 8: Save Local Report ─────────────────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
le.save_report(explanations, output_path="../reports/shap_local_explanations.csv")
print("✓ Saved shap_local_explanations.csv")
"""))

# ── Cell 9: Pricing Scenario Explanations ─────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
from ml.explainability.pricing_explanations import PricingExplainer

pe = PricingExplainer(
    explainer,
    features_path="../data/processed/features.parquet",
    elasticity_path="../reports/elasticity_summary.csv",
    recommendations_path="../reports/pricing_recommendations.csv",
)

pricing_exps = pe.explain_all_skus(top_n=10)
print(f"\\nPricing explanations generated for {len(pricing_exps)} SKUs")
"""))

# ── Cell 10: Save Pricing Report ──────────────────────────────────────────
cells.append(nbf.v4.new_code_cell("""\
pe.save_report(pricing_exps, output_path="../reports/shap_pricing_explanations.csv")

pricing_df = pe.to_dataframe(pricing_exps)
print("\\nPricing Scenario Summary:")
display_cols = ["sku_id", "current_price", "recommended_price",
                "current_predicted_demand", "recommended_predicted_demand",
                "demand_change", "price_shap_delta", "elasticity"]
print(pricing_df[display_cols].to_string(index=False))
print("\\n✓ Saved shap_pricing_explanations.csv")
"""))

# ── Cell 11: Summary ──────────────────────────────────────────────────────
cells.append(nbf.v4.new_markdown_cell("""\
## Module 7 Summary

| Report | Description |
|--------|-------------|
| shap_global_importance.csv | Mean abs SHAP per feature across sample |
| shap_local_explanations.csv | Per-row top positive/negative SHAP contributors |
| shap_pricing_explanations.csv | Current vs recommended price SHAP delta per SKU |

All explanations are model-based, reflecting the trained XGBoost model learned relationships.
They do NOT imply real-world causal effects.
"""))

nb.cells = cells

output_path = "notebooks/07_shap_explainability.ipynb"
with open(output_path, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

print(f"[OK] Notebook created: {output_path}")
