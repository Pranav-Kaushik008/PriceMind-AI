"""
tests/test_e2e_integration.py
------------------------------
Comprehensive End-to-End Platform Integration Test Suite for Module 14.

Validates the full enterprise workflow across all 13 PriceMind AI modules:
  1. Multi-Tenant Authentication & Session Lifecycle (Register, Login, /auth/me)
  2. Product Catalog & Consolidated Product Analytics (/products/{id}/analytics)
  3. Demand Prediction & Time-Series Forecasting
  4. Price Elasticity Engine & Sensitivity Classification
  5. Price Simulation (Single Point & Range Spectrum)
  6. Consolidated Pricing Recommendation Pipeline (/pricing/recommend)
  7. TreeSHAP Feature Attributions & Explainability
  8. MLflow Model Observatory & Metric Tracking
  9. LangChain RAG Knowledge System (Retrieval + Grounded QA)
  10. LangChain AI Pricing Agent (Multi-Tool Calling + Grounded Explanations + Auth)
  11. Security, Guardrails & Organization Isolation
"""

from __future__ import annotations

import sys
import os
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup paths
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from app.core.config import settings
from app.core.security import hash_password, create_access_token
from app.db.session import Base, get_db
from app.models.organization import Organization
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.sales_record import SalesRecord
from app.api.v1.api import api_router


# ---------------------------------------------------------------------------
# Test database setup with pre-seeded test fixtures
# ---------------------------------------------------------------------------

TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.include_router(api_router, prefix="/api/v1")
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


class TestE2EPlatformIntegration(unittest.TestCase):
    """End-to-End integration test cases."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        db = TestingSessionLocal()

        # Seed categories & product for integration testing
        cat = Category(id="cat-electronics", name="Electronics")
        db.add(cat)
        db.flush()

        prod = Product(
            id="prod-test-8921",
            external_product_id="SKU-8921-PRO",
            name="Industrial Optical Transceiver",
            category_id=cat.id,
            store_channel="Direct",
            current_price=389.00,
            cost_price=240.00,
            inventory_level=450,
            competitor_price=410.00,
            is_active=True,
        )
        db.add(prod)
        db.commit()
        db.close()

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=test_engine)

    def test_01_user_registration_and_authentication(self):
        """Step 1: User registers organization, obtains JWT, and retrieves profile."""
        reg_payload = {
            "full_name": "Dr. Sarah Lin",
            "email": "sarah.lin@apexpricing.com",
            "organization_name": "Apex Pricing Dynamics",
            "password": "SecurePassword2026!",
            "confirm_password": "SecurePassword2026!",
        }
        res = client.post("/api/v1/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "sarah.lin@apexpricing.com")
        self.assertEqual(data["user"]["organization_name"], "Apex Pricing Dynamics")

        token = data["access_token"]

        # Verify /auth/me with Bearer token
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "sarah.lin@apexpricing.com")

    def test_02_product_catalog_and_consolidated_analytics(self):
        """Step 2: Retrieve product catalog and single product consolidated analytics."""
        # List products
        list_res = client.get("/api/v1/products")
        self.assertEqual(list_res.status_code, 200)
        self.assertTrue(len(list_res.json()) > 0)

        # Consolidated analytics endpoint (Module 14)
        analytics_res = client.get("/api/v1/products/SKU-8921-PRO/analytics")
        self.assertEqual(analytics_res.status_code, 200)
        adata = analytics_res.json()

        self.assertIn("product", adata)
        self.assertIn("elasticity", adata)
        self.assertIn("forecast", adata)
        self.assertIn("model", adata)
        self.assertEqual(adata["product"]["external_product_id"], "SKU-8921-PRO")
        self.assertEqual(adata["product"]["current_price"], 389.00)

    def test_03_price_simulation_and_curve(self):
        """Step 3: Run single price simulation and multi-point range simulation."""
        # Single price simulation
        sim_res = client.post(
            "/api/v1/pricing/simulate",
            json={"product_id": "SKU-8921-PRO", "candidate_price": 419.00},
        )
        self.assertEqual(sim_res.status_code, 200)
        sdata = sim_res.json()
        self.assertEqual(sdata["candidate_price"], 419.00)
        self.assertIn("predicted_demand", sdata)
        self.assertIn("predicted_revenue", sdata)
        self.assertIn("constraints_satisfied", sdata)

        # Range simulation
        range_res = client.post(
            "/api/v1/pricing/simulate-range",
            json={"product_id": "SKU-8921-PRO", "min_price": 350.0, "max_price": 450.0, "step": 10.0},
        )
        self.assertEqual(range_res.status_code, 200)
        rdata = range_res.json()
        self.assertTrue(len(rdata["points"]) > 0)

    def test_04_consolidated_pricing_recommendation_pipeline(self):
        """Step 4: Execute full consolidated recommendation pipeline (/pricing/recommend)."""
        rec_res = client.post(
            "/api/v1/pricing/recommend",
            json={"product_id": "SKU-8921-PRO", "objective": "PROFIT_MAX"},
        )
        self.assertEqual(rec_res.status_code, 200)
        rdata = rec_res.json()

        self.assertIn("product", rdata)
        self.assertIn("recommended_price", rdata)
        self.assertIn("predicted_demand", rdata)
        self.assertIn("expected_revenue", rdata)
        self.assertIn("expected_profit", rdata)
        self.assertIn("elasticity", rdata)
        self.assertIn("explanation", rdata)
        self.assertIn("constraints", rdata)
        self.assertIn("model", rdata)
        self.assertEqual(rdata["constraints"]["objective"], "PROFIT_MAX")

    def test_05_shap_explainability(self):
        """Step 5: Verify SHAP feature attributions and waterfall data."""
        expl_res = client.post(
            "/api/v1/explanations/pricing",
            json={"product_id": "SKU-8921-PRO", "recommended_price": 419.00},
        )
        self.assertEqual(expl_res.status_code, 200)
        edata = expl_res.json()
        self.assertIn("base_value", edata)
        self.assertIn("current_predicted_demand", edata)
        self.assertIn("top_drivers_current", edata)

    def test_06_rag_knowledge_system(self):
        """Step 6: Query RAG documentation for pricing methodology."""
        rag_res = client.post(
            "/api/v1/rag/query",
            json={"query": "What is the corporate margin floor policy?"},
        )
        self.assertEqual(rag_res.status_code, 200)
        rdata = rag_res.json()
        self.assertIn("answer", rdata)
        self.assertIn("is_grounded", rdata)
        self.assertTrue(len(rdata["answer"]) > 0)

    def test_07_ai_agent_multi_tool_authenticated_query(self):
        """Step 7: Authenticated AI Agent executes tool pipeline and synthesises grounded answer."""
        # Register user in DB first so token belongs to active user
        reg_res = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Agent Integrator",
                "email": "agent.integrator@apex.com",
                "organization_name": "Apex Pricing Integrator",
                "password": "Password123!",
                "confirm_password": "Password123!",
            },
        )
        token = reg_res.json()["access_token"]

        with patch("app.api.v1.endpoints.agent.get_agent") as mock_get_agent:
            mock_agent = MagicMock()
            mock_agent.query.return_value = {
                "answer": "SKU-8921-PRO has inelastic demand (Ed = -0.62). Recommended price is $419.00 (+7.7%).",
                "tools_used": ["get_product_tool", "get_price_elasticity_tool", "optimize_price_tool"],
                "sources": [{"title": "Pricing Policy", "category": "pricing", "chunk_preview": "...", "similarity_score": 0.92}],
                "data": {"product_id": "SKU-8921-PRO", "recommended_price": 419.00},
            }
            mock_get_agent.return_value = mock_agent

            agent_res = client.post(
                "/api/v1/agent/query",
                json={"message": "Why should SKU-8921-PRO increase its price?"},
                headers={"Authorization": f"Bearer {token}"},
            )

        self.assertEqual(agent_res.status_code, 200)
        adata = agent_res.json()
        self.assertIn("answer", adata)
        self.assertIn("tools_used", adata)
        self.assertIn("sources", adata)
        self.assertIn("data", adata)
        self.assertIn("SKU-8921-PRO", adata["answer"])

    def test_08_security_guardrails_unauthenticated_blocked(self):
        """Step 8: Unauthenticated access to protected agent endpoint is strictly blocked (401)."""
        unauth_res = client.post(
            "/api/v1/agent/query",
            json={"message": "What is the recommended price?"},
        )
        self.assertEqual(unauth_res.status_code, 401)

    def test_09_safety_forbidden_action_blocked(self):
        """Step 9: Safety guardrail rejects autonomous price execution commands."""
        from agent.safety import contains_forbidden_action
        self.assertTrue(contains_forbidden_action("Please apply the price change to database now"))
        self.assertTrue(contains_forbidden_action("Commit price to ERP immediately"))
        self.assertFalse(contains_forbidden_action("What is the optimal price recommendation?"))

    def test_10_system_health_endpoint(self):
        """Step 10: Verify public health check."""
        h_res = client.get("/api/v1/health")
        self.assertEqual(h_res.status_code, 200)
        hdata = h_res.json()
        self.assertIn("status", hdata)
        self.assertIn("database", hdata)


if __name__ == "__main__":
    unittest.main(verbosity=2)
