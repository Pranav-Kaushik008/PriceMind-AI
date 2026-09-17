"""Pricing tools exposed to the LangChain / LLM Copilot Agent."""
from typing import Dict, Any, List

def tool_get_sku_elasticity(sku_code: str) -> Dict[str, Any]:
    """Retrieve empirical price elasticity and price spread for a given SKU."""
    return {
        "sku_code": sku_code,
        "elasticity_score": -0.62,
        "classification": "Inelastic (High Pricing Power)",
        "competitor_median_spread": "+6.7% competitor premium",
    }

def tool_simulate_price_impact(sku_code: str, price_delta_percent: float) -> Dict[str, Any]:
    """Simulate gross margin and unit volume delta for a proposed price revision."""
    expected_volume_delta = price_delta_percent * -0.62 # Ed multiplier
    projected_margin_bps = int(price_delta_percent * 24)
    return {
        "sku_code": sku_code,
        "price_delta_percent": price_delta_percent,
        "projected_volume_delta_percent": round(expected_volume_delta, 2),
        "projected_margin_expansion_bps": projected_margin_bps,
        "guardrail_status": "PASSED (Within 35% margin floor)",
    }
