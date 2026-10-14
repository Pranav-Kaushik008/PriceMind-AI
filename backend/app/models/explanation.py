"""
backend/app/models/explanation.py
-----------------------------------
SHAP explanation results from Module 7.

feature_contributions stored as JSONB (PostgreSQL) / JSON (SQLite):
{
    "price": 0.42,
    "inventory_level": -0.15,
    "is_promotion": 0.31,
    ...
}
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base_mixin import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.prediction import DemandPrediction
    from app.models.product import Product


class SHAPExplanation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "shap_explanations"
    __table_args__ = (
        Index("ix_shap_product", "product_id"),
    )

    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Optional FK to a specific prediction
    prediction_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("demand_predictions.id", ondelete="SET NULL"), nullable=True, index=True
    )

    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(100), nullable=False, default="v1")
    explanation_method: Mapped[str] = mapped_column(String(100), nullable=False, default="TreeExplainer")

    base_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    # JSONB on PostgreSQL — dict of {feature: shap_value}
    feature_contributions: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Explanation type: 'local' | 'global' | 'pricing_scenario'
    explanation_type: Mapped[str] = mapped_column(String(50), nullable=False, default="local")

    # Relationships
    product: Mapped[Product] = relationship("Product", back_populates="explanations")
    prediction: Mapped[DemandPrediction | None] = relationship(
        "DemandPrediction", back_populates="explanations"
    )

    def __repr__(self) -> str:
        return f"<SHAPExplanation product={self.product_id} method={self.explanation_method}>"
