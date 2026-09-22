"""
backend/app/schemas/auth.py
-----------------------------
Pydantic schemas for authentication endpoints (Module 13).

SECURITY: password_hash NEVER appears in any response schema.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    """Request body for POST /api/v1/auth/register."""
    full_name: str = Field(min_length=2, max_length=255, description="User's full name")
    email: EmailStr = Field(description="Work email address")
    organization_name: str = Field(min_length=2, max_length=255, description="Organization or company name")
    password: str = Field(min_length=8, max_length=128, description="Password (min 8 characters)")
    confirm_password: str = Field(description="Must match password")

    @model_validator(mode="after")
    def passwords_match(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    """Request body for POST /api/v1/auth/login."""
    email: EmailStr
    password: str = Field(min_length=1)


# ---------------------------------------------------------------------------
# Response schemas — password_hash NEVER included
# ---------------------------------------------------------------------------

class UserPublic(BaseModel):
    """Safe user representation — no password_hash."""
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Response from /register and /login."""
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class MeResponse(BaseModel):
    """Response from GET /auth/me — authenticated user profile."""
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    auth_provider: str = "local"

    model_config = {"from_attributes": True}
