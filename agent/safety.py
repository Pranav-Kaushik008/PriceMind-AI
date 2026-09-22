"""
agent/safety.py
---------------
Safety guardrails for the PriceMind AI Agent (Module 12).

Validates tool inputs before execution and flags high-risk outputs.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Forbidden action detection
# ---------------------------------------------------------------------------

_FORBIDDEN_VERBS = [
    "apply", "set price", "update price", "change price", "approve",
    "override", "force", "deploy", "push", "commit", "execute", "publish",
]


def contains_forbidden_action(text: str) -> bool:
    """Return True if the user message requests an autonomous irreversible action."""
    lower = text.lower()
    return any(v in lower for v in _FORBIDDEN_VERBS)


# ---------------------------------------------------------------------------
# Input validators
# ---------------------------------------------------------------------------

def validate_price(price: float, label: str = "price") -> None:
    """Raise ValueError if price is unreasonably low or high."""
    if price <= 0:
        raise ValueError(f"{label} must be positive, got {price}")
    if price > 1_000_000:
        raise ValueError(f"{label} ${price:,.2f} exceeds maximum allowed value ($1,000,000)")


def validate_price_range(min_price: float, max_price: float) -> None:
    """Raise ValueError if price range is invalid."""
    validate_price(min_price, "min_price")
    validate_price(max_price, "max_price")
    if min_price >= max_price:
        raise ValueError(f"min_price ({min_price}) must be less than max_price ({max_price})")
    span = max_price - min_price
    if span > 10_000:
        raise ValueError(f"Price range span ${span:,.2f} is too wide (max $10,000)")


def validate_horizon(horizon_days: int) -> None:
    """Raise ValueError if forecast horizon is out of range."""
    if horizon_days < 1:
        raise ValueError("horizon_days must be >= 1")
    if horizon_days > 90:
        raise ValueError("horizon_days must be <= 90")


def validate_objective(objective: str) -> None:
    """Raise ValueError if optimization objective is unrecognised."""
    valid = {"PROFIT_MAX", "REVENUE_MAX", "BALANCED"}
    if objective.upper() not in valid:
        raise ValueError(f"objective must be one of {valid}, got '{objective}'")


# ---------------------------------------------------------------------------
# Output risk flags
# ---------------------------------------------------------------------------

def flag_high_risk_change(current_price: float, recommended_price: float) -> Optional[str]:
    """Return a warning string if the price change exceeds ±30%."""
    if current_price <= 0:
        return None
    pct = ((recommended_price - current_price) / current_price) * 100.0
    if abs(pct) > 30.0:
        direction = "increase" if pct > 0 else "decrease"
        return (
            f"⚠️ HIGH RISK: Recommended price {direction} of {pct:+.1f}% "
            f"exceeds the ±30% safety guardrail. Human review required."
        )
    return None


def build_risk_summary(violations: List[str], current_price: float, recommended_price: Optional[float]) -> List[str]:
    """Aggregate all risk flags into a list of warning strings."""
    warnings = list(violations)
    if recommended_price is not None:
        hw = flag_high_risk_change(current_price, recommended_price)
        if hw:
            warnings.append(hw)
    return warnings
