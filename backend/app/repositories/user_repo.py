"""
backend/app/repositories/user_repo.py
---------------------------------------
Data-access functions for User and Organization models (Module 13).
"""

from __future__ import annotations

import re
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.organization import Organization


# ---------------------------------------------------------------------------
# Organization helpers
# ---------------------------------------------------------------------------

def _slugify(name: str) -> str:
    """Convert organization name to a URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = slug.strip("-")
    return slug[:100]


def get_organization_by_name(db: Session, name: str) -> Optional[Organization]:
    return db.scalar(select(Organization).where(Organization.name == name))


def get_or_create_organization(db: Session, name: str) -> Organization:
    """
    Return existing organization by name, or create a new one.
    Uses case-sensitive exact match on organization name.
    """
    org = get_organization_by_name(db, name)
    if org:
        return org

    slug = _slugify(name)
    # Ensure slug uniqueness by appending short id if needed
    existing_slug = db.scalar(select(Organization).where(Organization.slug == slug))
    if existing_slug:
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"

    org = Organization(
        id=str(uuid.uuid4()),
        name=name,
        slug=slug,
    )
    db.add(org)
    db.flush()  # get the id without committing
    return org


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Look up user by normalized (lowercase) email."""
    return db.scalar(select(User).where(User.email == email.lower().strip()))


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Look up user by primary key UUID."""
    return db.get(User, user_id)


def create_user(
    db: Session,
    *,
    email: str,
    hashed_password: str,
    full_name: Optional[str] = None,
    organization_id: Optional[str] = None,
    role: str = "analyst",
    auth_provider: str = "local",
) -> User:
    """
    Create and persist a new user.
    The caller is responsible for hashing the password before passing it here.
    """
    user = User(
        id=str(uuid.uuid4()),
        email=email.lower().strip(),
        hashed_password=hashed_password,
        full_name=full_name,
        organization_id=organization_id,
        role=role,
        auth_provider=auth_provider,
        is_active=True,
    )
    db.add(user)
    return user
