"""
PriceMind AI — Candidate Price Generator
Generates finely grained, configurable candidate price grids around current price points.
"""

from typing import Optional, List
import numpy as np
import logging

logger = logging.getLogger(__name__)


class CandidatePriceGenerator:
    """
    Generates a bounded, monotonic grid of candidate prices centered on a product's current price.
    """

    def __init__(
        self,
        max_decrease_pct: float = 20.0,
        max_increase_pct: float = 20.0,
        price_step: Optional[float] = None,
        n_steps: int = 25,
        min_allowed_price: Optional[float] = None,
        max_allowed_price: Optional[float] = None,
    ):
        self.max_decrease_pct = abs(max_decrease_pct)
        self.max_increase_pct = abs(max_increase_pct)
        self.price_step = price_step
        self.n_steps = max(5, n_steps)
        self.min_allowed_price = min_allowed_price
        self.max_allowed_price = max_allowed_price

    def generate(self, current_price: float) -> np.ndarray:
        """
        Generates array of candidate prices including current price.
        """
        if current_price <= 0 or np.isnan(current_price):
            raise ValueError(f"Invalid current price '{current_price}'. Must be positive.")

        lower_bound = current_price * (1.0 - self.max_decrease_pct / 100.0)
        upper_bound = current_price * (1.0 + self.max_increase_pct / 100.0)

        if self.min_allowed_price is not None:
            lower_bound = max(lower_bound, self.min_allowed_price)
        if self.max_allowed_price is not None:
            upper_bound = min(upper_bound, self.max_allowed_price)

        if lower_bound >= upper_bound:
            return np.array([round(current_price, 2)])

        if self.price_step is not None and self.price_step > 0:
            prices = np.arange(lower_bound, upper_bound + (self.price_step / 2.0), self.price_step)
        else:
            prices = np.linspace(lower_bound, upper_bound, self.n_steps)

        # Always include exact current price
        prices = np.unique(np.round(np.append(prices, current_price), 2))
        prices = prices[prices > 0]
        prices.sort()

        return prices
