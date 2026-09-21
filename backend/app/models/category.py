"""
backend/app/models/category.py
--------------------------------
Product category model.
"""

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    # Relationships
    products: Mapped[list] = relationship("Product", back_populates="category", lazy="select")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name}>"
