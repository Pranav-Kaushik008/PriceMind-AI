"""
backend/app/models/forecast.py
--------------------------------
Demand forecast results from Module 5 (time-series forecasting).
"""

from datetime import date
from sqlalchemy import String, Float, ForeignKey, Index, UniqueConstraint, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class Forecast(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "forecasts"
    __table_args__ = (
        Index("ix_forecast_product_date", "product_id", "forecast_date"),
        UniqueConstraint("product_id", "forecast_date", "model_name", "forecast_run_id", name="uq_forecast_product_date_model_run"),
    )

    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    forecast_run_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    predicted_demand: Mapped[float] = mapped_column(Float, nullable=False)
    lower_bound: Mapped[float | None] = mapped_column(Float, nullable=True)
    upper_bound: Mapped[float | None] = mapped_column(Float, nullable=True)

    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(100), nullable=False, default="v1")

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="forecasts")

    def __repr__(self) -> str:
        return f"<Forecast product={self.product_id} date={self.forecast_date} pred={self.predicted_demand}>"
