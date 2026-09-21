"""
backend/app/models/prediction.py
----------------------------------
Demand prediction results from Module 4 (ML models).
"""

from datetime import date
from sqlalchemy import String, Float, Integer, Date, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class DemandPrediction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "demand_predictions"
    __table_args__ = (
        Index("ix_prediction_product_date", "product_id", "prediction_date"),
    )

    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    prediction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    predicted_demand: Mapped[float] = mapped_column(Float, nullable=False)
    actual_demand: Mapped[float | None] = mapped_column(Float, nullable=True)

    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(100), nullable=False, default="v1")

    # Price used for this prediction
    price_at_prediction: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="demand_predictions")
    explanations: Mapped[list] = relationship("SHAPExplanation", back_populates="prediction", lazy="select")

    def __repr__(self) -> str:
        return f"<DemandPrediction product={self.product_id} date={self.prediction_date} pred={self.predicted_demand}>"
