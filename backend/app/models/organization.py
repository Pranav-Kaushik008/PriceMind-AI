"""
backend/app/models/organization.py
------------------------------------
Organization model — top-level tenant grouping.
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    # Relationships
    users: Mapped[list] = relationship("User", back_populates="organization", lazy="select")

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name}>"
