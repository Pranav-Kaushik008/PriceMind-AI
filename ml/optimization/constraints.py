"""
PriceMind AI — Pricing Constraints & Guardrails
Evaluates hard and soft business constraints including margin floors, MAP, competitor boundaries, and stockout buffers.
"""

from typing import Optional, List, Tuple, Dict, Any
from dataclasses import dataclass
import numpy as np


@dataclass
class PricingConstraints:
    """
    Central business constraints for dynamic pricing decisions.
    """
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    max_decrease_pct: float = 25.0
    max_increase_pct: float = 25.0
    min_margin_pct: float = 15.0
    competitor_max_ratio: Optional[float] = 1.20
    min_inventory_buffer_days: Optional[float] = 5.0

    def evaluate_candidate(
        self,
        candidate_price: float,
        current_price: float,
        cost_price: Optional[float] = None,
        competitor_price: Optional[float] = None,
        inventory_level: Optional[float] = None,
        historical_daily_demand: Optional[float] = None,
    ) -> Tuple[bool, List[str]]:
        """
        Evaluates a single candidate price against all active constraints.
        Returns:
            - is_valid: True if candidate passes all mandatory bounds
            - violations: List of violated constraint descriptions
        """
        violations = []

        if candidate_price <= 0:
            violations.append("Price must be strictly positive")
            return False, violations

        # 1. Absolute Price Floors and Ceilings
        if self.min_price is not None and candidate_price < self.min_price:
            violations.append(f"Below minimum allowed price floor (${self.min_price:.2f})")

        if self.max_price is not None and candidate_price > self.max_price:
            violations.append(f"Exceeds maximum allowed price ceiling (${self.max_price:.2f})")

        # 2. Maximum Percentage Change Boundaries
        if current_price > 0:
            pct_change = ((candidate_price - current_price) / current_price) * 100.0
            if pct_change < -self.max_decrease_pct:
                violations.append(f"Exceeds maximum price drop (-{self.max_decrease_pct:.1f}%)")
            elif pct_change > self.max_increase_pct:
                violations.append(f"Exceeds maximum price hike (+{self.max_increase_pct:.1f}%)")

        # 3. Minimum Gross Margin Floor
        if cost_price is not None and cost_price > 0:
            margin_pct = ((candidate_price - cost_price) / candidate_price) * 100.0
            if margin_pct < self.min_margin_pct:
                violations.append(f"Gross margin ({margin_pct:.1f}%) violates minimum margin floor ({self.min_margin_pct:.1f}%)")

        # 4. Competitor Price Ceiling
        if competitor_price is not None and competitor_price > 0 and self.competitor_max_ratio is not None:
            max_comp_allowed = competitor_price * self.competitor_max_ratio
            if candidate_price > max_comp_allowed:
                violations.append(f"Exceeds competitor benchmark ratio (${max_comp_allowed:.2f})")

        # 5. Inventory Stockout Protection
        if (
            inventory_level is not None
            and historical_daily_demand is not None
            and historical_daily_demand > 0
            and self.min_inventory_buffer_days is not None
        ):
            days_of_supply = inventory_level / historical_daily_demand
            if days_of_supply < self.min_inventory_buffer_days and candidate_price < current_price:
                violations.append(
                    f"Low inventory warning ({days_of_supply:.1f} days supply): Price discounts disallowed to prevent stockouts"
                )

        is_valid = (len(violations) == 0)
        return is_valid, violations
