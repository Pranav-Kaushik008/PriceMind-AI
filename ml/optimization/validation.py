"""
PriceMind AI — Pricing Decision & Guardrail Validation
Provides safety verification and sanity checking for pricing recommendations.
"""

from typing import Dict, Any, List, Tuple
import numpy as np


class PricingValidator:
    """
    Validates mathematical and business consistency before recommendations are finalized.
    """

    @staticmethod
    def validate_recommendation(rec_dict: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validates a completed recommendation object against critical safety guardrails.
        """
        errors = []

        price = rec_dict.get("recommended_price")
        if price is None or price <= 0 or np.isnan(price) or np.isinf(price):
            errors.append(f"Invalid recommended price: {price}")

        demand = rec_dict.get("expected_demand")
        if demand is None or demand < 0 or np.isnan(demand) or np.isinf(demand):
            errors.append(f"Invalid expected demand: {demand}")

        revenue = rec_dict.get("expected_revenue")
        if revenue is None or revenue < 0 or np.isnan(revenue) or np.isinf(revenue):
            errors.append(f"Invalid expected revenue: {revenue}")

        profit = rec_dict.get("expected_profit")
        if profit is not None and (np.isnan(profit) or np.isinf(profit)):
            errors.append(f"Invalid expected profit: {profit}")

        margin = rec_dict.get("expected_margin_pct")
        if margin is not None and (margin < -100.0 or margin > 100.0 or np.isnan(margin)):
            errors.append(f"Unrealistic margin percentage: {margin}")

        is_valid = (len(errors) == 0)
        return is_valid, errors
