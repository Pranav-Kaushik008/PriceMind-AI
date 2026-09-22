"""
backend/app/core/security.py
-----------------------------
Authentication security utilities for PriceMind AI (Module 13).

Provides:
  - Direct bcrypt password hashing and verification
  - JWT access token creation and decoding (via PyJWT)

SECURITY RULES enforced here:
  - Passwords are NEVER stored in plaintext.
  - Passwords NEVER appear in logs, responses, or error messages.
  - JWT secret is ALWAYS read from environment — never hardcoded.
  - Tokens NEVER contain sensitive personal data or credentials.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Password hashing (native bcrypt)
# ---------------------------------------------------------------------------

def hash_password(plain_password: str) -> str:
    """
    Hash a plaintext password using bcrypt.
    Handles the 72-byte bcrypt limit gracefully.
    Returns the decoded salt+hash string.
    """
    pwd_bytes = plain_password.encode("utf-8")
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against a bcrypt hash.
    Returns True if they match, False otherwise.
    NEVER logs either argument.
    """
    try:
        pwd_bytes = plain_password.encode("utf-8")
        if len(pwd_bytes) > 72:
            pwd_bytes = pwd_bytes[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception as exc:
        logger.debug("Password verification exception: %s", exc)
        return False


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Claims to encode. Should contain 'sub' (user id).
              MUST NOT contain password, hashed_password, or API keys.
        expires_delta: Token lifetime. Defaults to ACCESS_TOKEN_EXPIRE_MINUTES.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    to_encode["iat"] = datetime.now(timezone.utc)

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Raises:
        jwt.ExpiredSignatureError: Token has expired.
        jwt.InvalidTokenError: Token is malformed or signature invalid.

    Returns:
        Decoded claims dict.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


# ---------------------------------------------------------------------------
# Audit hashing
# ---------------------------------------------------------------------------

def create_audit_hash(data: str) -> str:
    """Generate SHA-256 cryptographic audit hash for non-sensitive data."""
    return hashlib.sha256(data.encode()).hexdigest()
