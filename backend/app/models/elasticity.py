"""
backend/app/models/elasticity.py
----------------------------------
Elasticity analysis results from Module 3.
"""

from sqlalchemy import String, Float, Integer, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class ElasticityResult(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "elasticity_results"
    __table_args__ = (
        Index("ix_elasticity_product", "product_id"),
    )

    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    model_version: Mapped[str] = mapped_column(String(100), nullable=False, default="v1")
    methodology: Mapped[str] = mapped_column(String(100), nullable=False, default="log_log_ols")

    # Elasticity estimate
    elasticity: Mapped[float] = mapped_column(Float, nullable=False)
    robust_elasticity: Mapped[float | None] = mapped_column(Float, nullable=True)
    std_error: Mapped[float | None] = mapped_column(Float, nullable=True)
    t_statistic: Mapped[float | None] = mapped_column(Float, nullable=True)
    p_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    ci_lower: Mapped[float | None] = mapped_column(Float, nullable=True)
    ci_upper: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Fit statistics
    r_squared: Mapped[float | None] = mapped_column(Float, nullable=True)
    adj_r_squared: Mapped[float | None] = mapped_column(Float, nullable=True)
    f_statistic: Mapped[float | None] = mapped_column(Float, nullable=True)
    durbin_watson: Mapped[float | None] = mapped_column(Float, nullable=True)
    aic: Mapped[float | None] = mapped_column(Float, nullable=True)
    bic: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Meta
    n_observations: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reliability: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_status: Mapped[str] = mapped_column(String(50), default="SUCCESS", nullable=False)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="elasticity_results")

    def __repr__(self) -> str:
        return f"<ElasticityResult product={self.product_id} elasticity={self.elasticity}>"
