"""
tests/test_agent.py
-------------------
Test suite for Module 12 — LangChain Tool-Calling + Pricing AI Agent.

All tests use the stub LLM (no API key required) and mock services where needed.
Tests are deterministic and do not require a live database or LLM API.
"""

from __future__ import annotations

import json
import sys
import os
import unittest
from unittest.mock import patch, MagicMock, PropertyMock
from pathlib import Path

# Ensure project root is on the path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))


# ---------------------------------------------------------------------------
# Safety module tests
# ---------------------------------------------------------------------------

class TestSafety(unittest.TestCase):

    def setUp(self):
        from agent.safety import (
            contains_forbidden_action,
            validate_price,
            validate_price_range,
            validate_horizon,
            validate_objective,
            flag_high_risk_change,
            build_risk_summary,
        )
        self.contains_forbidden_action = contains_forbidden_action
        self.validate_price = validate_price
        self.validate_price_range = validate_price_range
        self.validate_horizon = validate_horizon
        self.validate_objective = validate_objective
        self.flag_high_risk_change = flag_high_risk_change
        self.build_risk_summary = build_risk_summary

    def test_forbidden_action_detected(self):
        self.assertTrue(self.contains_forbidden_action("Please apply the price change"))
        self.assertTrue(self.contains_forbidden_action("Set price to $99"))
        self.assertTrue(self.contains_forbidden_action("Override the recommendation"))

    def test_safe_messages_not_flagged(self):
        self.assertFalse(self.contains_forbidden_action("What is the elasticity of SKU-8921-PRO?"))
        self.assertFalse(self.contains_forbidden_action("Show me the price recommendation"))
        self.assertFalse(self.contains_forbidden_action("Explain why profit increased"))

    def test_validate_price_ok(self):
        self.validate_price(99.99)  # Should not raise

    def test_validate_price_negative(self):
        with self.assertRaises(ValueError):
            self.validate_price(-5.0)

    def test_validate_price_zero(self):
        with self.assertRaises(ValueError):
            self.validate_price(0.0)

    def test_validate_price_range_ok(self):
        self.validate_price_range(80.0, 120.0)  # Should not raise

    def test_validate_price_range_inverted(self):
        with self.assertRaises(ValueError):
            self.validate_price_range(200.0, 100.0)

    def test_validate_price_range_equal(self):
        with self.assertRaises(ValueError):
            self.validate_price_range(100.0, 100.0)

    def test_validate_horizon_ok(self):
        self.validate_horizon(14)  # Should not raise

    def test_validate_horizon_out_of_range(self):
        with self.assertRaises(ValueError):
            self.validate_horizon(0)
        with self.assertRaises(ValueError):
            self.validate_horizon(91)

    def test_validate_objective_valid(self):
        self.validate_objective("PROFIT_MAX")
        self.validate_objective("REVENUE_MAX")
        self.validate_objective("BALANCED")

    def test_validate_objective_invalid(self):
        with self.assertRaises(ValueError):
            self.validate_objective("MARGIN_MAX")

    def test_flag_high_risk_change_triggers(self):
        warning = self.flag_high_risk_change(100.0, 140.0)
        self.assertIsNotNone(warning)
        self.assertIn("HIGH RISK", warning)
        self.assertIn("+40.0%", warning)

    def test_flag_high_risk_change_safe(self):
        warning = self.flag_high_risk_change(100.0, 115.0)
        self.assertIsNone(warning)

    def test_build_risk_summary_includes_violation_and_flag(self):
        result = self.build_risk_summary(["Price below cost"], 100.0, 160.0)
        self.assertIn("Price below cost", result)
        self.assertTrue(any("HIGH RISK" in w for w in result))


# ---------------------------------------------------------------------------
# Agent config tests
# ---------------------------------------------------------------------------

class TestAgentConfig(unittest.TestCase):

    def test_defaults_to_stub(self):
        from agent.config import AgentConfig
        cfg = AgentConfig()
        self.assertEqual(cfg.effective_provider(), "stub")

    def test_openai_provider_without_key(self):
        from agent.config import AgentConfig
        cfg = AgentConfig(llm_provider="openai", openai_api_key="")
        self.assertEqual(cfg.effective_provider(), "stub")

    def test_openai_provider_with_key(self):
        from agent.config import AgentConfig
        cfg = AgentConfig(llm_provider="openai", openai_api_key="sk-test-123")
        self.assertEqual(cfg.effective_provider(), "openai")

    def test_google_provider_with_key(self):
        from agent.config import AgentConfig
        cfg = AgentConfig(llm_provider="google", google_api_key="AIzaFake")
        self.assertEqual(cfg.effective_provider(), "google")


# ---------------------------------------------------------------------------
# Intent routing tests (stub path)
# ---------------------------------------------------------------------------

class TestIntentRouting(unittest.TestCase):

    def setUp(self):
        from agent.agent import _classify_intent, _extract_product_id, _extract_price
        self.classify = _classify_intent
        self.extract_pid = _extract_product_id
        self.extract_price = _extract_price

    def test_policy_question_routes_to_rag(self):
        tools = self.classify("What is the margin floor policy?")
        self.assertIn("search_knowledge_base_tool", tools)

    def test_product_question_routes_to_product(self):
        tools = self.classify("Tell me about product SKU-8921-PRO")
        self.assertIn("get_product_tool", tools)

    def test_elasticity_question_routed(self):
        tools = self.classify("Is SKU-8921-PRO elastic or inelastic?")
        self.assertIn("get_price_elasticity_tool", tools)

    def test_forecast_question_routed(self):
        tools = self.classify("What is the demand forecast for the next 14 days?")
        self.assertIn("get_demand_forecast_tool", tools)

    def test_simulate_question_routed(self):
        tools = self.classify("What if we price SKU-8921-PRO at $430?")
        self.assertIn("simulate_price_tool", tools)

    def test_optimize_question_routed(self):
        tools = self.classify("What is the optimal price for SKU-8921-PRO?")
        self.assertIn("optimize_price_tool", tools)

    def test_explain_question_routed(self):
        tools = self.classify("Explain why the demand prediction was made for SKU-8921-PRO")
        self.assertIn("explain_prediction_tool", tools)

    def test_extract_sku_id(self):
        pid = self.extract_pid("Tell me about SKU-8921-PRO performance")
        self.assertEqual(pid, "SKU-8921-PRO")

    def test_extract_price_from_message(self):
        price = self.extract_price("What if we price at $430.50?")
        self.assertAlmostEqual(price, 430.50)

    def test_no_sku_returns_none(self):
        pid = self.extract_pid("What is the pricing policy?")
        self.assertIsNone(pid)


# ---------------------------------------------------------------------------
# Stub synthesiser tests
# ---------------------------------------------------------------------------

class TestStubSynthesiser(unittest.TestCase):

    def setUp(self):
        from agent.agent import _StubSynthesiser
        self.synth = _StubSynthesiser()

    def test_empty_tool_results_returns_fallback(self):
        result = self.synth.synthesise("What is elasticity?", [])
        self.assertIsInstance(result, str)
        self.assertTrue(len(result) > 10)

    def test_product_tool_result_formatted(self):
        result = self.synth.synthesise(
            "Tell me about SKU-8921-PRO",
            [{
                "tool": "get_product_tool",
                "result": {
                    "id": "abc",
                    "external_product_id": "SKU-8921-PRO",
                    "name": "Precision Calibrator X1",
                    "category": "Industrial",
                    "current_price": 388.5,
                    "cost_price": 220.0,
                    "margin_percent": 43.4,
                    "inventory_level": 300,
                    "competitor_price": 435.0,
                },
            }],
        )
        self.assertIn("Precision Calibrator X1", result)
        self.assertIn("388.5", result)

    def test_error_in_tool_result_surfaced(self):
        result = self.synth.synthesise(
            "Tell me about SKU-9999",
            [{"tool": "get_product_tool", "result": {"error": "Product not found: SKU-9999"}}],
        )
        self.assertIn("Product not found", result)

    def test_elasticity_tool_result_formatted(self):
        result = self.synth.synthesise(
            "What is the elasticity?",
            [{
                "tool": "get_price_elasticity_tool",
                "result": {
                    "sku_name": "Calibrator",
                    "elasticity": -0.62,
                    "elasticity_category": "inelastic",
                    "reliability": "High Confidence",
                    "r_squared": 0.88,
                    "n_observations": 365,
                },
            }],
        )
        self.assertIn("-0.62", result)
        self.assertIn("inelastic", result)

    def test_rag_grounded_result_returned(self):
        result = self.synth.synthesise(
            "What is the margin floor policy?",
            [{
                "tool": "search_knowledge_base_tool",
                "result": {
                    "answer": "The corporate margin floor is 20%.",
                    "is_grounded": True,
                    "confidence_score": 0.85,
                    "sources": [{"title": "Pricing Policy", "category": "pricing"}],
                },
            }],
        )
        self.assertIn("20%", result)

    def test_rag_ungrounded_result_handled(self):
        result = self.synth.synthesise(
            "What is the margin floor?",
            [{
                "tool": "search_knowledge_base_tool",
                "result": {
                    "answer": "",
                    "is_grounded": False,
                    "confidence_score": 0.0,
                    "sources": [],
                },
            }],
        )
        self.assertIn("does not contain", result)

    def test_optimize_result_shows_pending_status(self):
        result = self.synth.synthesise(
            "Optimize SKU-8921-PRO",
            [{
                "tool": "optimize_price_tool",
                "result": {
                    "current_price": 388.5,
                    "recommended_price": 419.0,
                    "price_change_pct": 7.7,
                    "predicted_demand": 42.1,
                    "predicted_revenue": 17638.9,
                    "predicted_profit": 8400.0,
                    "predicted_margin_pct": 47.6,
                    "elasticity": -0.62,
                    "confidence": "High Confidence",
                    "objective": "PROFIT_MAX",
                    "status": "pending",
                    "rationale": "Optimized for profit.",
                    "risk_warnings": [],
                },
            }],
        )
        self.assertIn("pending", result)
        self.assertIn("419.0", result)


# ---------------------------------------------------------------------------
# Agent query flow tests (stub path)
# ---------------------------------------------------------------------------

class TestPricingAgentStubPath(unittest.TestCase):
    """Test the full agent.query() flow using the stub synthesiser."""

    def _make_agent(self):
        """Create an agent that is guaranteed to use the stub path."""
        from agent.agent import PricingAgent
        from agent.config import AgentConfig
        cfg = AgentConfig(llm_provider="stub")
        agent = PricingAgent(config=cfg)
        # Force stub path
        agent._llm_chain = None
        return agent

    def test_forbidden_action_blocked(self):
        agent = self._make_agent()
        result = agent.query("Please apply the price change now")
        self.assertIn("cannot", result["answer"].lower())
        self.assertEqual(result["tools_used"], [])

    def test_policy_question_calls_rag(self):
        agent = self._make_agent()
        with patch("agent.tools.rag_tools.rag_service") as mock_rag:
            mock_rag.query.return_value = MagicMock(
                answer="The margin floor is 20%.",
                is_grounded=True,
                confidence_score=0.85,
                sources=[],
            )
            result = agent.query("What is the margin floor policy?")
        self.assertIn("search_knowledge_base_tool", result["tools_used"])

    def test_product_question_without_sku_falls_back(self):
        """Without an SKU in the message, get_product returns None gracefully."""
        agent = self._make_agent()
        # No SKU in message → stub routes to search_products
        with patch("agent.tools.product_tools.list_products") as mock_list:
            mock_list.return_value = MagicMock(
                items=[],
                total=0,
                page=1,
                page_size=5,
                total_pages=1,
            )
            result = agent.query("Show me all products in the Electronics category")
        self.assertIsInstance(result["answer"], str)
        self.assertIsInstance(result["tools_used"], list)

    def test_result_always_has_required_keys(self):
        agent = self._make_agent()
        result = agent.query("Hello, what can you do?")
        self.assertIn("answer", result)
        self.assertIn("tools_used", result)
        self.assertIn("sources", result)
        self.assertIn("data", result)
        self.assertIsInstance(result["answer"], str)
        self.assertIsInstance(result["tools_used"], list)
        self.assertIsInstance(result["sources"], list)
        self.assertIsInstance(result["data"], dict)


# ---------------------------------------------------------------------------
# FastAPI endpoint tests
# ---------------------------------------------------------------------------

class TestAgentEndpoint(unittest.TestCase):
    """Test the FastAPI /api/v1/agent/query endpoint."""

    def _get_test_client(self):
        from fastapi.testclient import TestClient
        from fastapi import FastAPI
        from app.api.v1.endpoints.agent import router

        app = FastAPI()
        app.include_router(router, prefix="/agent")
        return TestClient(app)

    def test_query_endpoint_returns_200(self):
        with patch("app.api.v1.endpoints.agent.get_agent") as mock_get:
            mock_agent = MagicMock()
            mock_agent.query.return_value = {
                "answer": "The margin floor is 20%.",
                "tools_used": ["search_knowledge_base_tool"],
                "sources": [{"title": "Pricing Policy", "category": "pricing", "chunk_preview": "...", "similarity_score": 0.9}],
                "data": {},
            }
            mock_get.return_value = mock_agent

            client = self._get_test_client()
            resp = client.post("/agent/query", json={"message": "What is the margin floor?"})

        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn("answer", body)
        self.assertIn("tools_used", body)
        self.assertIn("sources", body)
        self.assertIn("data", body)

    def test_query_endpoint_answer_content(self):
        with patch("app.api.v1.endpoints.agent.get_agent") as mock_get:
            mock_agent = MagicMock()
            mock_agent.query.return_value = {
                "answer": "Margin floor is 20%.",
                "tools_used": [],
                "sources": [],
                "data": {},
            }
            mock_get.return_value = mock_agent

            client = self._get_test_client()
            resp = client.post("/agent/query", json={"message": "Policy question"})

        self.assertEqual(resp.json()["answer"], "Margin floor is 20%.")

    def test_query_endpoint_empty_message_rejected(self):
        with patch("app.api.v1.endpoints.agent.get_agent"):
            client = self._get_test_client()
            resp = client.post("/agent/query", json={"message": ""})
        self.assertIn(resp.status_code, [400, 422])

    def test_query_endpoint_with_session_id(self):
        with patch("app.api.v1.endpoints.agent.get_agent") as mock_get:
            mock_agent = MagicMock()
            mock_agent.query.return_value = {
                "answer": "Here is your answer.",
                "tools_used": [],
                "sources": [],
                "data": {},
            }
            mock_get.return_value = mock_agent

            client = self._get_test_client()
            resp = client.post(
                "/agent/query",
                json={"message": "What is elasticity?", "session_id": "session-abc-123"},
            )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["session_id"], "session-abc-123")

    def test_query_endpoint_tools_used_list(self):
        with patch("app.api.v1.endpoints.agent.get_agent") as mock_get:
            mock_agent = MagicMock()
            mock_agent.query.return_value = {
                "answer": "Elasticity is -0.62.",
                "tools_used": ["get_product_tool", "get_price_elasticity_tool"],
                "sources": [],
                "data": {},
            }
            mock_get.return_value = mock_agent

            client = self._get_test_client()
            resp = client.post("/agent/query", json={"message": "Elasticity for SKU-8921-PRO?"})

        body = resp.json()
        self.assertIn("get_price_elasticity_tool", body["tools_used"])

    def test_query_endpoint_agent_error_returns_500(self):
        with patch("app.api.v1.endpoints.agent.get_agent") as mock_get:
            mock_agent = MagicMock()
            mock_agent.query.side_effect = RuntimeError("Unexpected failure")
            mock_get.return_value = mock_agent

            client = self._get_test_client()
            resp = client.post("/agent/query", json={"message": "Test query"})

        self.assertEqual(resp.status_code, 500)


# ---------------------------------------------------------------------------
# Tool schemas validation tests
# ---------------------------------------------------------------------------

class TestAgentSchemas(unittest.TestCase):

    def test_query_request_valid(self):
        from app.schemas.agent import AgentQueryRequest
        req = AgentQueryRequest(message="What is elasticity?")
        self.assertEqual(req.message, "What is elasticity?")
        self.assertIsNone(req.session_id)

    def test_query_request_with_session(self):
        from app.schemas.agent import AgentQueryRequest
        req = AgentQueryRequest(message="Show me products", session_id="sess-001")
        self.assertEqual(req.session_id, "sess-001")

    def test_query_response_valid(self):
        from app.schemas.agent import AgentQueryResponse
        resp = AgentQueryResponse(
            answer="The margin floor is 20%.",
            tools_used=["search_knowledge_base_tool"],
            sources=[],
            data={"search_knowledge_base_tool": {"answer": "20%"}},
        )
        self.assertEqual(resp.answer, "The margin floor is 20%.")
        self.assertEqual(resp.tools_used, ["search_knowledge_base_tool"])

    def test_agent_source_schema(self):
        from app.schemas.agent import AgentSource
        src = AgentSource(
            title="Pricing Policy",
            category="pricing",
            chunk_preview="The margin floor...",
            similarity_score=0.87,
        )
        self.assertEqual(src.title, "Pricing Policy")
        self.assertAlmostEqual(src.similarity_score, 0.87)


if __name__ == "__main__":
    unittest.main(verbosity=2)
