"""
agent/tools/__init__.py
-----------------------
All PriceMind AI agent tools.
"""

from agent.tools.product_tools import get_product_tool, search_products_tool
from agent.tools.elasticity_tools import get_price_elasticity_tool
from agent.tools.forecast_tools import get_demand_forecast_tool
from agent.tools.pricing_tools import (
    simulate_price_tool,
    simulate_price_range_tool,
    optimize_price_tool,
)
from agent.tools.explanation_tools import (
    explain_prediction_tool,
    explain_pricing_recommendation_tool,
)
from agent.tools.rag_tools import search_knowledge_base_tool

ALL_TOOLS = [
    get_product_tool,
    search_products_tool,
    get_price_elasticity_tool,
    get_demand_forecast_tool,
    simulate_price_tool,
    simulate_price_range_tool,
    optimize_price_tool,
    explain_prediction_tool,
    explain_pricing_recommendation_tool,
    search_knowledge_base_tool,
]

__all__ = ["ALL_TOOLS"]
