"""
tests/test_api_v1.py
--------------------
Comprehensive REST API tests for Module 9 FastAPI endpoints.
Uses FastAPI TestClient and in-memory SQLite database.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── 1. Health & Root ──────────────────────────────────────────────────────────

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert "version" in data


# ── 2. Product Catalog ────────────────────────────────────────────────────────

def test_list_products():
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "skuCode" in first
    assert "name" in first
    assert "currentPrice" in first


def test_list_products_paginated():
    response = client.get("/api/v1/products/paginated?page=1&page_size=3")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 3


def test_list_categories():
    response = client.get("/api/v1/products/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_product_by_sku():
    response = client.get("/api/v1/products/SKU-8921-PRO")
    assert response.status_code == 200
    data = response.json()
    assert data["external_product_id"] == "SKU-8921-PRO"
    assert "current_price" in data


def test_get_product_not_found():
    response = client.get("/api/v1/products/NON_EXISTENT_SKU_999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ── 3. Analytics & Telemetry ──────────────────────────────────────────────────

def test_analytics_overview():
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "total_categories" in data
    assert "model_status" in data


def test_executive_kpis():
    response = client.get("/api/v1/analytics/kpis")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3


# ── 4. Demand Prediction (Module 4) ───────────────────────────────────────────

def test_predict_demand_valid():
    payload = {
        "product_id": "SKU-8921-PRO",
        "price": 419.00,
        "is_promotion": False,
        "competitor_price": 435.00,
        "inventory_level": 500,
        "persist": False,
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["external_product_id"] == "SKU-8921-PRO"
    assert data["predicted_demand"] >= 0.0
    assert "predicted_at" in data


def test_predict_demand_invalid_price():
    payload = {
        "product_id": "SKU-8921-PRO",
        "price": -50.0,
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 422  # Pydantic validation rejection


def test_predict_demand_unknown_product():
    payload = {
        "product_id": "UNKNOWN_SKU_XYZ",
        "price": 100.0,
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 404


# ── 5. Demand Forecasting (Module 5) ──────────────────────────────────────────

def test_get_forecast():
    response = client.get("/api/v1/forecasts/SKU-8921-PRO?horizon=7")
    assert response.status_code == 200
    data = response.json()
    assert data["external_product_id"] == "SKU-8921-PRO"
    assert len(data["forecast_points"]) == 7
    first_pt = data["forecast_points"][0]
    assert "predicted_demand" in first_pt
    assert "date" in first_pt


def test_get_forecast_unknown_product():
    response = client.get("/api/v1/forecasts/UNKNOWN_SKU")
    assert response.status_code == 404


# ── 6. Price Elasticity (Module 3) ────────────────────────────────────────────

def test_get_elasticity():
    response = client.get("/api/v1/elasticity/SKU-8921-PRO")
    assert response.status_code == 200
    data = response.json()
    assert data["external_product_id"] == "SKU-8921-PRO"
    assert "elasticity" in data
    assert "reliability" in data


def test_get_elasticity_curve_points():
    response = client.get("/api/v1/elasticity/SKU-8921-PRO/curve")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "price" in data[0]
    assert "demandUnits" in data[0]


# ── 7. Pricing Optimization & Simulation (Module 6) ───────────────────────────

def test_list_pricing_recommendations():
    response = client.get("/api/v1/pricing/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_optimize_price_profit_max():
    payload = {
        "product_id": "SKU-8921-PRO",
        "objective": "PROFIT_MAX",
        "min_margin_pct": 20.0,
    }
    response = client.post("/api/v1/pricing/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["external_product_id"] == "SKU-8921-PRO"
    assert data["recommended_price"] > 0
    assert "rationale" in data


def test_simulate_single_price():
    payload = {
        "product_id": "SKU-8921-PRO",
        "candidate_price": 420.00,
    }
    response = client.post("/api/v1/pricing/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["candidate_price"] == 420.00
    assert "predicted_revenue" in data
    assert "price_change_pct" in data


def test_simulate_price_range():
    payload = {
        "product_id": "SKU-8921-PRO",
        "min_price": 350.00,
        "max_price": 450.00,
        "step": 10.00,
    }
    response = client.post("/api/v1/pricing/simulate-range", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["points"]) > 0
    assert data["total_evaluated"] > 0


def test_get_pricing_curve():
    response = client.get("/api/v1/pricing/SKU-8921-PRO/curve")
    assert response.status_code == 200
    data = response.json()
    assert data["external_product_id"] == "SKU-8921-PRO"
    assert len(data["curve_points"]) > 0


# ── 8. SHAP Explainability (Module 7) ─────────────────────────────────────────

def test_explain_prediction():
    payload = {
        "product_id": "SKU-8921-PRO",
        "price": 419.00,
        "top_n": 5,
    }
    response = client.post("/api/v1/explanations/prediction", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["external_product_id"] == "SKU-8921-PRO"
    assert "base_value" in data
    assert len(data["top_positive_contributors"]) <= 5


def test_explain_pricing():
    payload = {
        "product_id": "SKU-8921-PRO",
        "current_price": 389.00,
        "recommended_price": 419.00,
        "top_n": 5,
    }
    response = client.post("/api/v1/explanations/pricing", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["external_product_id"] == "SKU-8921-PRO"
    assert "price_shap_delta" in data
    assert "model_signals_summary" in data
    assert "business_constraints_summary" in data
