"""
PriceMind AI — Explainable AI Schemas
Standardized data structures for local, global, and pricing scenario SHAP attributions.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime


@dataclass
class FeatureContribution:
    feature_name: str
    feature_value: float
    shap_value: float
    direction: str  # 'positive' | 'negative'

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class LocalExplanation:
    row_index: int
    base_value: float
    predicted_value: float
    model_prediction: float
    additive_consistent: bool
    all_contributions: List[FeatureContribution]
    top_positive_contributors: List[FeatureContribution]
    top_negative_contributors: List[FeatureContribution]
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        return d


@dataclass
class PricingScenarioExplanation:
    sku_id: str
    current_price: float
    recommended_price: float
    current_predicted_demand: float
    recommended_predicted_demand: float
    current_price_shap: float
    recommended_price_shap: float
    price_shap_delta: float
    base_value: float
    elasticity: float
    elasticity_reliability: str
    top_drivers_current: List[FeatureContribution]
    top_drivers_recommended: List[FeatureContribution]
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
