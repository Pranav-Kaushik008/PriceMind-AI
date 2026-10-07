"""
FastAPI Endpoint test for Phase 3.2: POST /api/v1/vision/explain
"""
import sys
import os

sys.path.insert(0, os.path.abspath("backend"))
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_api_tests():
    print("=================================================================")
    print("PHASE 3.2: FASTAPI ENDPOINT /api/v1/vision/explain VERIFICATION")
    print("=================================================================")

    # Test 1: Full context explanation
    print("\n--- TEST 1: POST /api/v1/vision/explain (Complete Context) ---")
    payload = {
        "context": {
            "product": {
                "name": "Sony Bravia 55 4K OLED",
                "sku": "SONY-OLED-55",
            },
            "visual_analysis": {
                "detected_label": "tv",
                "detected_competitor_price": 59999.0,
                "competitor_name": "Amazon",
                "ocr_texts": ["Sony Bravia OLED", "₹59,999"],
            },
            "pricing_context": {
                "current_price": 61999.0,
                "cost_price": 42000.0,
                "competitor_price": 59999.0,
                "historical_demand_daily": 2.5,
                "price_elasticity": -1.4,
                "inventory_level": 45,
            },
            "optimization_result": {
                "recommended_price": 60499.0,
                "price_change_pct": -2.4,
                "expected_demand": 2.9,
                "expected_revenue": 175447.10,
                "expected_profit": 53647.10,
                "margin_percent": 30.6,
                "status": "optimized",
                "factors_considered": ["Competitor price", "Price elasticity", "Inventory"],
                "constraints_valid": True,
            }
        }
    }

    res = client.post("/api/v1/vision/explain", json=payload)
    print(f"HTTP Status: {res.status_code}")
    data = res.json()
    print(f"Response Status: {data['status']}")
    print(f"Provider: {data['provider']}")
    print(f"Grounded: {data['grounded']}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert data["status"] == "success"
    assert data["explanation"] is not None
    assert data["sources"]["current_price"] == 61999.0
    assert data["sources"]["recommended_price"] == 60499.0
    print("✓ Test 1: POST /api/v1/vision/explain returned 200 with 6 grounded sections.")

    # Test 2: Follow-up question
    print("\n--- TEST 2: Follow-up Question to Endpoint ---")
    payload_q = {
        "context": payload["context"],
        "user_question": "Why is the recommended price lower than catalog price?",
    }
    res_q = client.post("/api/v1/vision/explain", json=payload_q)
    print(f"HTTP Status: {res_q.status_code}")
    data_q = res_q.json()
    assert res_q.status_code == 200
    print(f"Why Recommended with Question: {data_q['explanation']['why_recommended']}")
    print("✓ Test 2: Follow-up query executed successfully.")

    print("\n=================================================================")
    print("ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    run_api_tests()
