"""
agent/agent.py
--------------
PriceMind AI Agent — Module 12 core.

Architecture:
  User message
    → Router (classify intent)
    → Tool selection & execution
    → Tool results (authoritative data)
    → LLM synthesis (language only, no hallucination)
    → Grounded response

Supports three LLM backends:
  - "openai"  → langchain_openai.ChatOpenAI
  - "google"  → langchain_google_genai.ChatGoogleGenerativeAI
  - "stub"    → deterministic template engine (no API key required)

The stub backend is the default and makes the agent fully functional without
any external LLM — ideal for development and testing.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone

from agent.config import agent_config, AgentConfig
from agent.prompts import SYSTEM_PROMPT
from agent.safety import contains_forbidden_action
from agent.tools import ALL_TOOLS

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Stub LLM synthesiser (no external API required)
# ---------------------------------------------------------------------------

class _StubSynthesiser:
    """
    Deterministic text synthesiser used when no LLM API key is configured.
    Produces grounded summaries directly from tool results without any LLM call.
    """

    def synthesise(self, question: str, tool_results: List[Dict[str, Any]]) -> str:
        if not tool_results:
            return (
                "I was unable to retrieve data for your question. "
                "Please ensure the product ID is correct and the backend services are running."
            )

        lines: List[str] = []
        for tr in tool_results:
            tool_name = tr.get("tool", "tool")
            data = tr.get("result", {})
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    lines.append(data)
                    continue

            if "error" in data:
                lines.append(f"**{tool_name}**: ⚠️ {data['error']}")
                continue

            if tool_name == "get_product_tool":
                lines.append(
                    f"**Product**: {data.get('name', 'N/A')} ({data.get('external_product_id', 'N/A')})\n"
                    f"- Category: {data.get('category', 'N/A')}\n"
                    f"- Current Price: **${data.get('current_price', 'N/A'):,.2f}**\n"
                    f"- Cost Price: ${data.get('cost_price', 'N/A')}\n"
                    f"- Margin: {data.get('margin_percent', 'N/A')}%\n"
                    f"- Inventory: {data.get('inventory_level', 'N/A')} units\n"
                    f"- Competitor Price: ${data.get('competitor_price', 'N/A')}"
                )

            elif tool_name == "search_products_tool":
                items = data.get("items", [])
                lines.append(f"**Products found** ({data.get('total', len(items))}):")
                for p in items[:5]:
                    lines.append(
                        f"- {p.get('external_product_id', '')} — {p.get('name', '')} "
                        f"@ ${p.get('current_price', 'N/A')} (margin {p.get('margin_percent', 'N/A')}%)"
                    )

            elif tool_name == "get_price_elasticity_tool":
                ed = data.get("elasticity", "N/A")
                cat = data.get("elasticity_category", "N/A")
                rel = data.get("reliability", "N/A")
                lines.append(
                    f"**Price Elasticity** for {data.get('sku_name', 'product')}:\n"
                    f"- Elasticity coefficient: **{ed}**\n"
                    f"- Category: **{cat}** "
                    f"({'pricing power — safe to raise price' if cat == 'inelastic' else 'demand-sensitive — raise with caution'})\n"
                    f"- Reliability: {rel}\n"
                    f"- R²: {data.get('r_squared', 'N/A')}, N={data.get('n_observations', 'N/A')}"
                )

            elif tool_name == "get_demand_forecast_tool":
                pts = data.get("forecast_points", [])
                total_demand = sum(p.get("predicted_demand", 0) for p in pts)
                lines.append(
                    f"**Demand Forecast** ({data.get('model_name', 'N/A')}, "
                    f"{data.get('forecast_horizon_days', 'N/A')}-day horizon):\n"
                    f"- Total projected demand: **{total_demand:.0f} units**\n"
                    f"- Daily average: **{total_demand / len(pts):.1f} units**" if pts else ""
                )
                if pts:
                    first = pts[0]
                    last = pts[-1]
                    lines.append(
                        f"- Day 1: {first.get('predicted_demand', 'N/A')} units "
                        f"(range {first.get('lower_bound', 'N/A')}–{first.get('upper_bound', 'N/A')})\n"
                        f"- Day {len(pts)}: {last.get('predicted_demand', 'N/A')} units"
                    )

            elif tool_name == "simulate_price_tool":
                lines.append(
                    f"**Price Simulation** — ${data.get('current_price', 'N/A')} → ${data.get('candidate_price', 'N/A')} "
                    f"({data.get('price_change_pct', 'N/A'):+.1f}%):\n"
                    f"- Predicted demand: **{data.get('predicted_demand', 'N/A')} units** "
                    f"(change: {data.get('demand_change_pct', 'N/A'):+.1f}%)\n"
                    f"- Revenue: **${data.get('predicted_revenue', 'N/A'):,.2f}** "
                    f"(change: {data.get('revenue_change_pct', 'N/A'):+.1f}%)\n"
                    f"- Profit: ${data.get('predicted_profit', 'N/A')}, "
                    f"Margin: {data.get('margin_pct', 'N/A')}%\n"
                    f"- Constraints satisfied: {data.get('constraints_satisfied', 'N/A')}"
                )
                for w in data.get("risk_warnings", []):
                    lines.append(f"- {w}")

            elif tool_name == "simulate_price_range_tool":
                lines.append(
                    f"**Price Range Simulation** ({data.get('total_evaluated', 'N/A')} points evaluated):\n"
                    f"- Optimal profit price: **${data.get('optimal_profit_price', 'N/A')}**\n"
                    f"- Optimal revenue price: **${data.get('optimal_revenue_price', 'N/A')}**\n"
                    f"- Current price: ${data.get('current_price', 'N/A')}"
                )

            elif tool_name == "optimize_price_tool":
                lines.append(
                    f"**Pricing Recommendation** ({data.get('objective', 'N/A')}):\n"
                    f"- Current price: ${data.get('current_price', 'N/A')}\n"
                    f"- **Recommended price: ${data.get('recommended_price', 'N/A')} "
                    f"({data.get('price_change_pct', 'N/A'):+.1f}%)**\n"
                    f"- Predicted demand: {data.get('predicted_demand', 'N/A')} units\n"
                    f"- Predicted revenue: ${data.get('predicted_revenue', 'N/A'):,.2f}\n"
                    f"- Predicted profit: ${data.get('predicted_profit', 'N/A')}\n"
                    f"- Margin: {data.get('predicted_margin_pct', 'N/A')}%\n"
                    f"- Elasticity: {data.get('elasticity', 'N/A')}, "
                    f"Confidence: {data.get('confidence', 'N/A')}\n"
                    f"- Status: **{data.get('status', 'pending')} (requires human approval)**\n"
                    f"- Rationale: {data.get('rationale', 'N/A')}"
                )
                for w in data.get("risk_warnings", []):
                    lines.append(f"- {w}")

            elif tool_name in ("explain_prediction_tool", "explain_pricing_recommendation_tool"):
                if "model_signals_summary" in data:
                    lines.append(
                        f"**SHAP Pricing Explanation**:\n"
                        f"- {data.get('model_signals_summary', '')}\n"
                        f"- {data.get('business_constraints_summary', '')}\n"
                        f"- Demand change: {data.get('demand_change', 'N/A'):+.2f} units "
                        f"({data.get('current_predicted_demand', 'N/A')} → "
                        f"{data.get('recommended_predicted_demand', 'N/A')})\n"
                        f"- Price SHAP delta: {data.get('price_shap_delta', 'N/A'):+.4f}"
                    )
                else:
                    lines.append(
                        f"**SHAP Prediction Explanation** (price ${data.get('price_used', 'N/A')}):\n"
                        f"- Predicted demand: **{data.get('predicted_demand', 'N/A')} units**\n"
                        f"- Base model value: {data.get('base_value', 'N/A')}\n"
                        f"- Model: {data.get('model_name', 'N/A')} via {data.get('explanation_method', 'SHAP')}"
                    )
                    top_pos = data.get("top_positive_contributors", [])
                    if top_pos:
                        lines.append("- **Top demand drivers (positive)**:")
                        for c in top_pos[:3]:
                            lines.append(f"  - {c.get('feature_name')}: SHAP={c.get('shap_value'):+.4f}")

            elif tool_name == "search_knowledge_base_tool":
                if data.get("is_grounded"):
                    lines.append(data.get("answer", ""))
                    srcs = data.get("sources", [])
                    if srcs:
                        lines.append(f"\n_Sources: {', '.join(s.get('title', '') for s in srcs[:3])}_")
                else:
                    lines.append(
                        "The knowledge base does not contain specific information on this topic. "
                        "Please consult your pricing policy documentation directly."
                    )

            else:
                # Generic fallback for any new tool
                lines.append(f"**{tool_name} result**: {json.dumps(data, indent=2)[:400]}")

        return "\n\n".join(line for line in lines if line)


# ---------------------------------------------------------------------------
# Tool registry for fast lookup
# ---------------------------------------------------------------------------

_TOOL_MAP = {t.name: t for t in ALL_TOOLS}


# ---------------------------------------------------------------------------
# Intent router — lightweight keyword classifier
# ---------------------------------------------------------------------------

def _classify_intent(message: str) -> List[str]:
    """
    Return an ordered list of suggested tool names based on message keywords.
    The agent uses this as a hint when no LLM is available.
    """
    m = message.lower()
    tools: List[str] = []

    # Knowledge / policy questions → RAG first
    if any(k in m for k in ["policy", "methodology", "how does", "what is the rule",
                              "constraint", "margin floor", "business rule", "explain how"]):
        tools.append("search_knowledge_base_tool")

    # Product lookup
    if any(k in m for k in ["sku-", "product", "item", "what is", "tell me about", "show me"]):
        tools.append("get_product_tool")

    # Elasticity
    if any(k in m for k in ["elastic", "inelastic", "price sensitivity", "demand sensitivity"]):
        tools.append("get_price_elasticity_tool")

    # Forecast
    if any(k in m for k in ["forecast", "next week", "next month", "demand next", "predict sales", "units expected"]):
        tools.append("get_demand_forecast_tool")

    # Simulation
    if any(k in m for k in ["what if", "simulate", "if price", "at $", "pricing curve"]):
        if "range" in m or "between" in m or "from $" in m:
            tools.append("simulate_price_range_tool")
        else:
            tools.append("simulate_price_tool")

    # Optimization
    if any(k in m for k in ["optimize", "recommend", "best price", "optimal price", "recommendation"]):
        tools.append("optimize_price_tool")

    # SHAP explanation
    if any(k in m for k in ["shap", "explain", "why", "feature importance", "driver"]):
        if any(k in m for k in ["recommend", "recommendation", "why increase", "why decrease"]):
            tools.append("explain_pricing_recommendation_tool")
        else:
            tools.append("explain_prediction_tool")

    # Default: search products
    if not tools:
        tools.append("search_products_tool")

    return tools


# ---------------------------------------------------------------------------
# PricingAgent
# ---------------------------------------------------------------------------

class PricingAgent:
    """
    PriceMind AI pricing agent.

    When an LLM is available (openai / google), uses LangChain tool-calling.
    Falls back to the deterministic stub synthesiser when no API key is set.
    """

    def __init__(self, config: Optional[AgentConfig] = None):
        self.config = config or agent_config
        self._synthesiser = _StubSynthesiser()
        self._llm_chain = None
        self._try_init_llm()

    def _try_init_llm(self) -> None:
        """Attempt to initialise a real LLM chain. Silently falls back to stub."""
        provider = self.config.effective_provider()
        try:
            if provider == "openai":
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(
                    model=self.config.openai_model,
                    temperature=self.config.temperature,
                    max_tokens=self.config.max_tokens,
                    openai_api_key=self.config.openai_api_key,
                )
                self._llm_chain = llm.bind_tools(ALL_TOOLS)
                logger.info("[Agent] Using OpenAI backend: %s", self.config.openai_model)

            elif provider == "google":
                from langchain_google_genai import ChatGoogleGenerativeAI
                llm = ChatGoogleGenerativeAI(
                    model=self.config.google_model,
                    temperature=self.config.temperature,
                    google_api_key=self.config.google_api_key,
                )
                self._llm_chain = llm.bind_tools(ALL_TOOLS)
                logger.info("[Agent] Using Google Gemini backend: %s", self.config.google_model)

            else:
                logger.info("[Agent] No LLM API key — using stub synthesiser")

        except ImportError as e:
            logger.warning("[Agent] LLM package not installed (%s) — using stub synthesiser", e)
        except Exception as e:
            logger.warning("[Agent] LLM init failed (%s) — using stub synthesiser", e)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def query(self, message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a user message and return a grounded agent response.

        Returns:
            {
                "answer": str,
                "tools_used": List[str],
                "sources": List[dict],
                "data": dict,
            }
        """
        # Safety check
        if contains_forbidden_action(message):
            return {
                "answer": (
                    "I can analyse and recommend pricing strategies, but I cannot autonomously "
                    "apply, set, or commit any price changes. All recommendations require "
                    "human review and approval through the Pricing Recommendations panel."
                ),
                "tools_used": [],
                "sources": [],
                "data": {},
            }

        if self._llm_chain is not None:
            return self._query_with_llm(message)
        else:
            return self._query_with_stub(message)

    # ------------------------------------------------------------------
    # LLM path
    # ------------------------------------------------------------------

    def _query_with_llm(self, message: str) -> Dict[str, Any]:
        """Execute tool-calling loop with real LLM."""
        from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=message),
        ]

        tools_used: List[str] = []
        tool_results: List[Dict[str, Any]] = []
        sources: List[Dict[str, Any]] = []
        combined_data: Dict[str, Any] = {}

        for _iteration in range(self.config.max_iterations):
            response = self._llm_chain.invoke(messages)

            # No more tool calls → final answer
            if not response.tool_calls:
                answer = response.content or ""
                return {
                    "answer": answer,
                    "tools_used": tools_used,
                    "sources": sources,
                    "data": combined_data,
                }

            # Execute tool calls
            messages.append(response)
            for tc in response.tool_calls:
                tool_name = tc["name"]
                tool_args = tc["args"]
                tool_id = tc["id"]

                result_str = self._execute_tool(tool_name, tool_args)
                tools_used.append(tool_name)

                try:
                    result_data = json.loads(result_str)
                    tool_results.append({"tool": tool_name, "result": result_data})
                    combined_data[tool_name] = result_data

                    # Extract RAG sources
                    if tool_name == "search_knowledge_base_tool" and isinstance(result_data, dict):
                        for src in result_data.get("sources", []):
                            sources.append(src)
                except json.JSONDecodeError:
                    tool_results.append({"tool": tool_name, "result": result_str})

                messages.append(
                    ToolMessage(content=result_str, tool_call_id=tool_id)
                )

        # Max iterations reached — synthesise from what we have
        answer = self._synthesiser.synthesise(message, tool_results)
        return {
            "answer": answer,
            "tools_used": tools_used,
            "sources": sources,
            "data": combined_data,
        }

    # ------------------------------------------------------------------
    # Stub path
    # ------------------------------------------------------------------

    def _query_with_stub(self, message: str) -> Dict[str, Any]:
        """Execute tool-calling with stub synthesiser (no LLM API key needed)."""
        suggested_tools = _classify_intent(message)
        tools_used: List[str] = []
        tool_results: List[Dict[str, Any]] = []
        sources: List[Dict[str, Any]] = []
        combined_data: Dict[str, Any] = {}

        # Extract product ID from message if present
        product_id = _extract_product_id(message)

        for tool_name in suggested_tools:
            args = _build_tool_args(tool_name, message, product_id)
            if args is None:
                continue

            result_str = self._execute_tool(tool_name, args)
            tools_used.append(tool_name)

            try:
                result_data = json.loads(result_str)
                tool_results.append({"tool": tool_name, "result": result_data})
                combined_data[tool_name] = result_data

                if tool_name == "search_knowledge_base_tool" and isinstance(result_data, dict):
                    for src in result_data.get("sources", []):
                        sources.append(src)
            except json.JSONDecodeError:
                tool_results.append({"tool": tool_name, "result": result_str})

        answer = self._synthesiser.synthesise(message, tool_results)
        return {
            "answer": answer,
            "tools_used": tools_used,
            "sources": sources,
            "data": combined_data,
        }

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    def _execute_tool(self, tool_name: str, args: Dict[str, Any]) -> str:
        """Look up a tool by name and invoke it with given args."""
        tool_fn = _TOOL_MAP.get(tool_name)
        if tool_fn is None:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})
        try:
            result = tool_fn.invoke(args)
            return result if isinstance(result, str) else json.dumps(result)
        except Exception as exc:
            logger.error("[Agent] Tool %s raised: %s", tool_name, exc, exc_info=True)
            return json.dumps({"error": str(exc)})


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

import re

_SKU_PATTERN = re.compile(r"(SKU-\d{4}-[A-Z]{2,6})", re.IGNORECASE)
_PRICE_PATTERN = re.compile(r"\$(\d+(?:\.\d{1,2})?)")


def _extract_product_id(message: str) -> Optional[str]:
    """Extract the first SKU-style product ID from the message."""
    m = _SKU_PATTERN.search(message)
    return m.group(1).upper() if m else None


def _extract_price(message: str) -> Optional[float]:
    """Extract the first dollar amount from the message."""
    m = _PRICE_PATTERN.search(message)
    return float(m.group(1)) if m else None


def _build_tool_args(
    tool_name: str,
    message: str,
    product_id: Optional[str],
) -> Optional[Dict[str, Any]]:
    """Build tool arguments from message context for stub routing."""
    if tool_name == "get_product_tool":
        if not product_id:
            return None
        return {"product_id": product_id}

    elif tool_name == "search_products_tool":
        m = message.lower()
        category = ""
        for cat in ["electronics", "industrial", "software", "hardware", "sensors"]:
            if cat in m:
                category = cat
                break
        return {"query": product_id or "", "category": category, "limit": 5}

    elif tool_name == "get_price_elasticity_tool":
        if not product_id:
            return None
        return {"product_id": product_id}

    elif tool_name == "get_demand_forecast_tool":
        if not product_id:
            return None
        # Extract horizon from message
        horizon = 14
        m = re.search(r"(\d+)\s*(?:day|week|month)", message.lower())
        if m:
            val = int(m.group(1))
            unit = message.lower()[m.end() - len(m.group(0).split()[-1]):]
            if "week" in unit:
                val *= 7
            elif "month" in unit:
                val *= 30
            horizon = min(90, max(1, val))
        return {"product_id": product_id, "horizon_days": horizon}

    elif tool_name == "simulate_price_tool":
        if not product_id:
            return None
        price = _extract_price(message)
        if price is None:
            return None
        return {"product_id": product_id, "candidate_price": price}

    elif tool_name == "simulate_price_range_tool":
        if not product_id:
            return None
        prices = _PRICE_PATTERN.findall(message)
        if len(prices) >= 2:
            p1, p2 = float(prices[0]), float(prices[1])
            min_p, max_p = min(p1, p2), max(p1, p2)
        else:
            return None
        return {"product_id": product_id, "min_price": min_p, "max_price": max_p, "step": 5.0}

    elif tool_name == "optimize_price_tool":
        if not product_id:
            return None
        m = message.lower()
        obj = "PROFIT_MAX"
        if "revenue" in m:
            obj = "REVENUE_MAX"
        elif "balance" in m or "balanced" in m:
            obj = "BALANCED"
        return {"product_id": product_id, "objective": obj}

    elif tool_name in ("explain_prediction_tool", "explain_pricing_recommendation_tool"):
        if not product_id:
            return None
        price = _extract_price(message)
        return {"product_id": product_id, "price": price}

    elif tool_name == "search_knowledge_base_tool":
        return {"question": message, "top_k": 4}

    return None


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_agent_instance: Optional[PricingAgent] = None


def get_agent() -> PricingAgent:
    """Return (or create) the module-level PricingAgent singleton."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = PricingAgent()
    return _agent_instance
