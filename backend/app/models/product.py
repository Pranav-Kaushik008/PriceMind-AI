"""
backend/app/models/product.py
------------------------------
Product model — corresponds to SKUs in dataset.
"""

from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("external_product_id", name="uq_products_external_id"),
    )

    external_product_id: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    store_channel: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    # Pricing
    current_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    cost_price: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Inventory
    inventory_level: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Competitor
    competitor_price: Mapped[float | None] = mapped_column(Float, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    sales_records: Mapped[list] = relationship("SalesRecord", back_populates="product", lazy="select")
    elasticity_results: Mapped[list] = relationship("ElasticityResult", back_populates="product", lazy="select")
    demand_predictions: Mapped[list] = relationship("DemandPrediction", back_populates="product", lazy="select")
    forecasts: Mapped[list] = relationship("Forecast", back_populates="product", lazy="select")
    pricing_recommendations: Mapped[list] = relationship("PricingRecommendation", back_populates="product", lazy="select")
    pricing_simulations: Mapped[list] = relationship("PricingSimulation", back_populates="product", lazy="select")
    explanations: Mapped[list] = relationship("SHAPExplanation", back_populates="product", lazy="select")

    def __repr__(self) -> str:
        return f"<Product id={self.id} sku={self.external_product_id}>"
