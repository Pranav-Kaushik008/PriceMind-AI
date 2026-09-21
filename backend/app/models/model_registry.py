"""
backend/app/models/model_registry.py
---------------------------------------
ML model registry — tracks trained model artifacts.
"""

from datetime import datetime, timezone
from sqlalchemy import String, Float, ForeignKey, Index, UniqueConstraint, Text, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class MLModelRegistry(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ml_model_registry"
    __table_args__ = (
        UniqueConstraint("model_name", "version", name="uq_model_name_version"),
        Index("ix_model_registry_name", "model_name"),
    )

    model_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model_type: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1")
    target: Mapped[str] = mapped_column(String(100), nullable=False, default="units_sold")
    feature_version: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Performance metrics stored as JSON (e.g. {"rmse": 2.87, "r2": 0.94})
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Hyperparameters
    hyperparameters: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    artifact_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<MLModelRegistry {self.model_name} v{self.version} status={self.status}>"


class OptimizationRun(UUIDPrimaryKeyMixin, Base):
    """Tracks a full optimization job execution."""
    __tablename__ = "optimization_runs"

    run_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    objective: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="running", nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(100), nullable=False, default="v1")

    products_processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    products_optimized: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    products_failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
