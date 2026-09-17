import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_get_kpis():
    response = client.get("/api/v1/executive/kpis")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_list_products():
    response = client.get("/api/v1/products/")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_get_recommendations():
    response = client.get("/api/v1/recommendations/")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_run_simulation():
    payload = {
        "basePriceMultiplier": 1.05,
        "competitorReactionMultiplier": 1.02,
        "costInflationMultiplier": 1.0,
        "macroDemandShiftPercent": 0.0
    }
    response = client.post("/api/v1/simulations/run", json=payload)
    assert response.status_code == 200
    assert "projectedRevenue" in response.json()
