"""
backend/app/models/user.py
---------------------------
User model — prepared for future authentication.

IMPORTANT: Only the schema is defined here.
Authentication endpoints are NOT implemented in this module.
Passwords are stored as hashes — never plaintext.
"""

from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.base_mixin import UUIDPrimaryKeyMixin, TimestampMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    organization_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="analyst", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    auth_provider: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    external_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
