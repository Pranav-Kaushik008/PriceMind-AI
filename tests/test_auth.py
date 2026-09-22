"""
tests/test_auth.py
-------------------
Comprehensive test suite for Module 13 — Authentication + User & Organization Management.

Covers:
  - Password hashing & verification with bcrypt
  - JWT token generation, expiration, and validation
  - Registration endpoint (validation, duplication, org creation)
  - Login endpoint (credentials validation, safe errors)
  - Current user endpoint (/auth/me)
  - Reusable dependency get_current_user & get_current_active_user
  - Protected endpoints (agent, assistant)
"""

from __future__ import annotations

import sys
import os
import unittest
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch, MagicMock

import jwt
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup paths
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.db.session import Base, get_db
from app.models.organization import Organization
from app.models.user import User
from app.repositories.user_repo import (
    get_user_by_email,
    get_user_by_id,
    create_user,
    get_or_create_organization,
)
from app.api.v1.api import api_router


# ---------------------------------------------------------------------------
# In-memory test database setup
# ---------------------------------------------------------------------------

TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.include_router(api_router, prefix="/api/v1")
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------

class TestPasswordSecurity(unittest.TestCase):
    """Test password hashing and verification."""

    def test_hash_password_produces_bcrypt_hash(self):
        pwd = "SuperSecretPassword123!"
        hashed = hash_password(pwd)
        self.assertNotEqual(pwd, hashed)
        self.assertTrue(hashed.startswith("$2b$") or hashed.startswith("$2a$") or "$bcrypt$" in hashed)

    def test_verify_password_correct(self):
        pwd = "EnterprisePricing2026$"
        hashed = hash_password(pwd)
        self.assertTrue(verify_password(pwd, hashed))

    def test_verify_password_incorrect(self):
        pwd = "CorrectPassword123"
        hashed = hash_password(pwd)
        self.assertFalse(verify_password("WrongPassword456", hashed))


class TestJWTSecurity(unittest.TestCase):
    """Test JWT access token generation and decoding."""

    def test_create_and_decode_token_success(self):
        claims = {"sub": "user-uuid-1234", "email": "analyst@pricemind.ai", "role": "analyst"}
        token = create_access_token(claims)
        decoded = decode_access_token(token)

        self.assertEqual(decoded["sub"], "user-uuid-1234")
        self.assertEqual(decoded["email"], "analyst@pricemind.ai")
        self.assertIn("exp", decoded)
        self.assertIn("iat", decoded)

    def test_expired_token_raises_error(self):
        claims = {"sub": "user-uuid-expired"}
        expired_token = create_access_token(claims, expires_delta=timedelta(seconds=-10))

        with self.assertRaises(jwt.ExpiredSignatureError):
            decode_access_token(expired_token)

    def test_invalid_token_raises_error(self):
        with self.assertRaises(jwt.PyJWTError):
            decode_access_token("invalid.token.signature")


class TestUserRepo(unittest.TestCase):
    """Test database repo functions for user and org."""

    def setUp(self):
        Base.metadata.create_all(bind=test_engine)
        self.db = TestingSessionLocal()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=test_engine)

    def test_get_or_create_organization(self):
        org1 = get_or_create_organization(self.db, "Global Corp")
        self.db.commit()
        self.assertIsNotNone(org1.id)
        self.assertEqual(org1.name, "Global Corp")
        self.assertIn("global-corp", org1.slug)

        # Calling again should retrieve the same org
        org2 = get_or_create_organization(self.db, "Global Corp")
        self.assertEqual(org1.id, org2.id)

    def test_create_and_get_user(self):
        org = get_or_create_organization(self.db, "Acme Inc")
        self.db.commit()

        user = create_user(
            self.db,
            email="Test.User@Acme.com",
            hashed_password=hash_password("password123"),
            full_name="Test User",
            organization_id=org.id,
            role="admin",
        )
        self.db.commit()

        fetched_by_email = get_user_by_email(self.db, "test.user@acme.com")
        self.assertIsNotNone(fetched_by_email)
        self.assertEqual(fetched_by_email.id, user.id)
        self.assertEqual(fetched_by_email.full_name, "Test User")

        fetched_by_id = get_user_by_id(self.db, user.id)
        self.assertIsNotNone(fetched_by_id)
        self.assertEqual(fetched_by_id.email, "test.user@acme.com")


class TestAuthAPIEndpoints(unittest.TestCase):
    """Test REST endpoints: /auth/register, /auth/login, /auth/me."""

    def setUp(self):
        Base.metadata.create_all(bind=test_engine)

    def tearDown(self):
        Base.metadata.drop_all(bind=test_engine)

    def test_register_success(self):
        payload = {
            "full_name": "Sarah Connor",
            "email": "sarah@cyberdyne.com",
            "organization_name": "Cyberdyne Systems",
            "password": "Password123!",
            "confirm_password": "Password123!",
        }
        res = client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)

        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["email"], "sarah@cyberdyne.com")
        self.assertEqual(data["user"]["full_name"], "Sarah Connor")
        self.assertEqual(data["user"]["organization_name"], "Cyberdyne Systems")
        self.assertNotIn("password_hash", data["user"])
        self.assertNotIn("hashed_password", data["user"])

    def test_register_duplicate_email(self):
        payload = {
            "full_name": "Duplicate User",
            "email": "duplicate@enterprise.com",
            "organization_name": "Enterprise Inc",
            "password": "Password123!",
            "confirm_password": "Password123!",
        }
        res1 = client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res1.status_code, 201)

        res2 = client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res2.status_code, 400)
        self.assertIn("already exists", res2.json()["detail"])

    def test_register_password_mismatch(self):
        payload = {
            "full_name": "Mismatch User",
            "email": "mismatch@test.com",
            "organization_name": "Test Org",
            "password": "Password123!",
            "confirm_password": "DifferentPassword123!",
        }
        res = client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res.status_code, 422)

    def test_login_success(self):
        # Register first
        client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Marcus Wright",
                "email": "marcus@resistance.org",
                "organization_name": "Resistance",
                "password": "StrongPassword123",
                "confirm_password": "StrongPassword123",
            },
        )

        # Login
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "marcus@resistance.org", "password": "StrongPassword123"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "marcus@resistance.org")

    def test_login_wrong_password(self):
        client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Kyle Reese",
                "email": "kyle@resistance.org",
                "organization_name": "Resistance",
                "password": "Password123!",
                "confirm_password": "Password123!",
            },
        )

        res = client.post(
            "/api/v1/auth/login",
            json={"email": "kyle@resistance.org", "password": "WrongPassword!"},
        )
        self.assertEqual(res.status_code, 401)
        self.assertIn("Incorrect email or password", res.json()["detail"])

    def test_login_nonexistent_user(self):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "ghost@nowhere.com", "password": "AnyPassword123"},
        )
        self.assertEqual(res.status_code, 401)
        self.assertIn("Incorrect email or password", res.json()["detail"])

    def test_get_current_user_me(self):
        # Register and get token
        reg_res = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "John Connor",
                "email": "john@resistance.org",
                "organization_name": "Tech Comm",
                "password": "SecurePassword123",
                "confirm_password": "SecurePassword123",
            },
        )
        token = reg_res.json()["access_token"]

        # Call /auth/me with Bearer token
        me_res = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.json()
        self.assertEqual(me_data["email"], "john@resistance.org")
        self.assertEqual(me_data["full_name"], "John Connor")
        self.assertEqual(me_data["organization_name"], "Tech Comm")
        self.assertNotIn("hashed_password", me_data)

    def test_get_current_user_unauthorized(self):
        res = client.get("/api/v1/auth/me")
        self.assertEqual(res.status_code, 401)

    def test_get_current_user_invalid_token(self):
        res = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-garbage-token"},
        )
        self.assertEqual(res.status_code, 401)


class TestProtectedEndpoints(unittest.TestCase):
    """Verify that agent and assistant endpoints require valid authentication."""

    def setUp(self):
        Base.metadata.create_all(bind=test_engine)

    def tearDown(self):
        Base.metadata.drop_all(bind=test_engine)

    def test_agent_query_unauthorized(self):
        res = client.post("/api/v1/agent/query", json={"message": "What is the elasticity?"})
        self.assertEqual(res.status_code, 401)

    def test_assistant_query_optional_auth(self):
        res = client.post("/api/v1/assistant/query", json={"prompt": "Explain SKU-8921-PRO"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("content", res.json())

    def test_agent_query_authorized(self):
        # Register user
        reg_res = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Agent User",
                "email": "agent.user@pricemind.ai",
                "organization_name": "Pricing Ops",
                "password": "Password123!",
                "confirm_password": "Password123!",
            },
        )
        token = reg_res.json()["access_token"]

        with patch("app.api.v1.endpoints.agent.get_agent") as mock_get_agent:
            mock_agent = MagicMock()
            mock_agent.query.return_value = {
                "answer": "Elasticity for SKU-8921-PRO is -0.62 (inelastic).",
                "tools_used": ["get_price_elasticity_tool"],
                "sources": [],
                "data": {},
            }
            mock_get_agent.return_value = mock_agent

            res = client.post(
                "/api/v1/agent/query",
                json={"message": "What is the elasticity of SKU-8921-PRO?"},
                headers={"Authorization": f"Bearer {token}"},
            )

        self.assertEqual(res.status_code, 200)
        self.assertIn("Elasticity for SKU-8921-PRO", res.json()["answer"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
