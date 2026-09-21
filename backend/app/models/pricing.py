"""
backend/app/models/pricing.py
------------------------------
Pricing recommendation and simulation models from Modules 6 and existing app.

Replaces the legacy pricing.py with properly typed SQLAlchemy 2.x models.
The old SKU, PriceRecommendation, PriceAdjustmentLog, User models are superseded
by product.py, user.py, organization.py, and this file.
"""

from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, Integer, ForeignKey, Index, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class PricingRecommendation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Pricing recommendations from Module 6 optimization engine.
    One row per product per optimization run.
    """
    __tablename__ = "pricing_recommendations"
    __table_args__ = (
        Index("ix_pricingrec_product", "product_id"),
    )

    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    optimization_run_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    # Prices
    current_price: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_price: Mapped[float] = mapped_column(Float, nullable=False)
    price_change_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Demand / Revenue / Profit (profit nullable when cost data unavailable)
    predicted_demand: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_revenue: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_margin_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Elasticity used
    elasticity: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Optimization metadata
    objective: Mapped[str | None] = mapped_column(String(50), nullable=True)
    confidence: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(100), nullable=False, default="v1")

    # Human-readable rationale
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Applied timestamp
    applied_at: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="pricing_recommendations")

    def __repr__(self) -> str:
        return f"<PricingRecommendation product={self.product_id} rec={self.recommended_price}>"


class PricingSimulation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    What-if simulation results from Module 6 simulator.
    Multiple rows per product (one per candidate price point).
    """
    __tablename__ = "pricing_simulations"
    __table_args__ = (
        Index("ix_primsim_product", "product_id"),
    )

    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    simulation_run_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    candidate_price: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_demand: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_revenue: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    margin_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    price_change_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    demand_change_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue_change_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit_change_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    constraints_satisfied: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="pricing_simulations")

    def __repr__(self) -> str:
        return f"<PricingSimulation product={self.product_id} price={self.candidate_price}>"


class PriceAdjustmentLog(UUIDPrimaryKeyMixin, Base):
    """Audit log for applied price changes."""
    __tablename__ = "price_adjustment_logs"
    __table_args__ = (
        Index("ix_priceadj_product", "product_id"),
    )

    product_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    actor_email: Mapped[str] = mapped_column(String(255), nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    old_price: Mapped[float] = mapped_column(Float, nullable=False)
    new_price: Mapped[float] = mapped_column(Float, nullable=False)
    delta_profit_annualized: Mapped[float | None] = mapped_column(Float, nullable=True)
    erp_sync_status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
