"""
backend/app/api/v1/endpoints/auth.py
-------------------------------------
Authentication and user management endpoints (Module 13).

Routes:
  - POST /api/v1/auth/register  → Register new user + organization
  - POST /api/v1/auth/login     → Authenticate and obtain JWT token
  - GET  /api/v1/auth/me        → Get current authenticated user profile
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user
from app.core.security import hash_password, verify_password, create_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repo import (
    get_user_by_email,
    create_user,
    get_or_create_organization,
)
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserPublic,
    MeResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and organization",
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Register a new user along with their organization.
    Returns access token and safe public user information.
    """
    normalized_email = payload.email.lower().strip()
    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Create or associate organization
    org = get_or_create_organization(db, payload.organization_name.strip())

    # Hash password securely
    hashed_pwd = hash_password(payload.password)

    # Create new user
    user = create_user(
        db,
        email=normalized_email,
        hashed_password=hashed_pwd,
        full_name=payload.full_name.strip(),
        organization_id=org.id,
        role="analyst",
        auth_provider="local",
    )
    db.commit()
    db.refresh(user)

    # Generate access token
    access_token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "organization_id": user.organization_id,
            "role": user.role,
        }
    )

    user_public = UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        organization_id=org.id,
        organization_name=org.name,
        is_active=user.is_active,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_public,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT token",
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate user using email and password.
    Returns JWT access token upon successful verification.
    """
    normalized_email = payload.email.lower().strip()
    user = get_user_by_email(db, normalized_email)

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    access_token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "organization_id": user.organization_id,
            "role": user.role,
        }
    )

    org_name = user.organization.name if user.organization else None

    user_public = UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        organization_id=user.organization_id,
        organization_name=org_name,
        is_active=user.is_active,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_public,
    )


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Get profile of currently authenticated user",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> MeResponse:
    """
    Return the authenticated user's profile and organization details.
    """
    org_name = current_user.organization.name if current_user.organization else None

    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        organization_id=current_user.organization_id,
        organization_name=org_name,
        auth_provider=current_user.auth_provider,
    )
