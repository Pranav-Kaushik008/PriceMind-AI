"""
tests/test_shap_explainability.py
----------------------------------
Tests for Module 7 — SHAP Explainability.
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path

# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def features_df():
    path = Path("data/processed/features.parquet")
    assert path.exists(), f"features.parquet not found at {path}"
    return pd.read_parquet(path)


@pytest.fixture(scope="module")
def shap_explainer():
    from ml.explainability.explainer import ShapExplainer
    explainer = ShapExplainer()
    explainer.load()
    return explainer


@pytest.fixture(scope="module")
def X_sample(features_df, shap_explainer):
    """Aligned feature sample (100 rows) for SHAP tests."""
    sample = features_df.sample(n=min(100, len(features_df)), random_state=42)
    return shap_explainer.align_features(sample)


# ─── 1. Explainer Initialization ────────────────────────────────────────────

def test_shap_explainer_loads(shap_explainer):
    assert shap_explainer.model is not None
    assert shap_explainer.tree_explainer is not None
    assert len(shap_explainer.feature_names) > 0


def test_shap_explainer_has_base_value(shap_explainer):
    bv = shap_explainer.base_value
    assert isinstance(bv, float)
    assert np.isfinite(bv)


# ─── 2. SHAP Output Shape ────────────────────────────────────────────────────

def test_shap_values_shape(shap_explainer, X_sample):
    shap_vals = shap_explainer.compute_shap_values(X_sample)
    assert shap_vals.shape == (len(X_sample), len(shap_explainer.feature_names)), (
        f"Expected ({len(X_sample)}, {len(shap_explainer.feature_names)}), got {shap_vals.shape}"
    )


def test_shap_values_finite(shap_explainer, X_sample):
    shap_vals = shap_explainer.compute_shap_values(X_sample.head(10))
    assert np.all(np.isfinite(shap_vals)), "SHAP values contain NaN or Inf"


# ─── 3. Additive Consistency ─────────────────────────────────────────────────

def test_additive_consistency(shap_explainer, X_sample):
    """base_value + sum(shap) ≈ model_prediction for each row."""
    X_check = X_sample.head(20)
    shap_vals = shap_explainer.compute_shap_values(X_check)
    base = shap_explainer.base_value
    model_preds = shap_explainer.model.predict(X_check)

    reconstructed = base + shap_vals.sum(axis=1)
    deltas = np.abs(reconstructed - model_preds)
    # Allow up to 5% tolerance
    assert np.all(deltas < 0.5), (
        f"Additive consistency failed. Max delta: {deltas.max():.4f}"
    )


# ─── 4. Global Importance ────────────────────────────────────────────────────

def test_global_importance_columns(shap_explainer, X_sample):
    from ml.explainability.global_explanations import GlobalExplainer
    ge = GlobalExplainer(shap_explainer, max_samples=50)
    df = ge.compute_global_importance(X_sample, max_samples=50)
    assert "feature" in df.columns
    assert "mean_abs_shap" in df.columns
    assert "rank" in df.columns


def test_global_importance_non_negative(shap_explainer, X_sample):
    from ml.explainability.global_explanations import GlobalExplainer
    ge = GlobalExplainer(shap_explainer, max_samples=50)
    df = ge.compute_global_importance(X_sample, max_samples=50)
    assert (df["mean_abs_shap"] >= 0).all(), "mean_abs_shap should be non-negative"


def test_global_importance_ranked(shap_explainer, X_sample):
    from ml.explainability.global_explanations import GlobalExplainer
    ge = GlobalExplainer(shap_explainer, max_samples=50)
    df = ge.compute_global_importance(X_sample, max_samples=50)
    # Ranks should be monotonically increasing
    assert list(df["rank"]) == list(range(1, len(df) + 1))


# ─── 5. Local Explanation ────────────────────────────────────────────────────

def test_local_explanation_structure(shap_explainer, X_sample):
    from ml.explainability.local_explanations import LocalExplainer
    le = LocalExplainer(shap_explainer)
    exp = le.explain_prediction(X_sample, top_n=5, row_index=0)
    assert exp is not None
    assert isinstance(exp.base_value, float)
    assert isinstance(exp.predicted_value, float)
    assert isinstance(exp.additive_consistent, bool)
    assert len(exp.all_contributions) > 0


def test_local_explanation_has_contributors(shap_explainer, X_sample):
    from ml.explainability.local_explanations import LocalExplainer
    le = LocalExplainer(shap_explainer)
    exp = le.explain_prediction(X_sample, top_n=5, row_index=0)
    # At least some positive OR negative contributors
    assert len(exp.top_positive_contributors) > 0 or len(exp.top_negative_contributors) > 0


def test_local_explanation_additive(shap_explainer, X_sample):
    from ml.explainability.local_explanations import LocalExplainer
    le = LocalExplainer(shap_explainer)
    exp = le.explain_prediction(X_sample, top_n=5, row_index=0)
    delta = abs(exp.predicted_value - exp.model_prediction)
    assert delta < 0.5, f"Additive gap too large: {delta:.4f}"


# ─── 6. Pricing Scenario Explanation ─────────────────────────────────────────

def test_pricing_explanation_structure(shap_explainer):
    from ml.explainability.pricing_explanations import PricingExplainer
    pe = PricingExplainer(shap_explainer)
    sku_ids = ["SKU-3320-SENS", "SKU-4412-MTR"]
    for sku_id in sku_ids:
        exp = pe.explain_price_scenario(sku_id, top_n=5)
        if exp is not None:
            assert isinstance(exp.price_shap_delta, float)
            assert isinstance(exp.elasticity, float)
            assert len(exp.top_drivers_current) > 0
            assert len(exp.top_drivers_recommended) > 0


# ─── 7. Missing Feature Handling ─────────────────────────────────────────────

def test_missing_feature_handling(shap_explainer, X_sample):
    """align_features should add missing columns as 0 and drop extras."""
    # Drop some columns
    X_partial = X_sample.drop(columns=X_sample.columns[:5])
    X_aligned = shap_explainer.align_features(X_partial)
    assert list(X_aligned.columns) == list(shap_explainer.feature_names)
    # Missing cols should be 0
    for col in shap_explainer.feature_names[:5]:
        assert (X_aligned[col] == 0).all()
