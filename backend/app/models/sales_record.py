"""
backend/app/models/sales_record.py
------------------------------------
Historical sales / demand data — raw transactional records.

These are the daily observations from the project dataset:
  sku_id, date, price, units_sold, revenue, is_promotion, inventory_level, competitor_price
"""

from datetime import date
from sqlalchemy import String, Float, Integer, Boolean, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class SalesRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "sales_records"
    __table_args__ = (
        UniqueConstraint("product_id", "record_date", "store_channel", name="uq_sales_product_date_channel"),
        Index("ix_sales_product_date", "product_id", "record_date"),
    )

    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    record_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    store_channel: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Core observations from dataset
    price: Mapped[float] = mapped_column(Float, nullable=False)
    units_sold: Mapped[int] = mapped_column(Integer, nullable=False)
    revenue: Mapped[float | None] = mapped_column(Float, nullable=True)
    cost_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_promotion: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    inventory_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    competitor_price: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="sales_records")

    def __repr__(self) -> str:
        return f"<SalesRecord product={self.product_id} date={self.record_date}>"
