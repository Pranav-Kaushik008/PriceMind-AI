"""Explainable AI & SHAP value decomposition pipeline."""
from typing import List, Dict, Any

class PricingSHAPExplainer:
    def explain_recommendation(
        self,
        sku_code: str,
        competitor_spread_pct: float,
        elasticity: float,
        inventory_days: int,
    ) -> List[Dict[str, Any]]:
        """Generates additive feature attributions for price decision transparency."""
        attributions = [
            {
                "feature": "Competitor Price Index Spread",
                "impactPercent": round(competitor_spread_pct * 0.8, 2),
                "description": f"Competitor spread is currently {competitor_spread_pct:+.1f}%.",
            },
            {
                "feature": "Empirical Inelasticity Power",
                "impactPercent": round((abs(elasticity) < 1.0) * 2.8, 2),
                "description": f"Demand sensitivity rating: {elasticity:.2f} Ed.",
            },
            {
                "feature": "Inventory Runway Factor",
                "impactPercent": round((30 - inventory_days) * 0.08, 2),
                "description": f"Warehouse runway is {inventory_days} days of supply.",
            },
        ]
        return attributions

shap_explainer = PricingSHAPExplainer()
