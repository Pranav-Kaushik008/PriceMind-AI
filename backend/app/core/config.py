"""
backend/app/core/config.py
--------------------------
Centralized configuration via environment variables.
Never hardcode secrets, passwords, or connection strings here.
"""

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # ── Application ────────────────────────────────────────────────────────
    PROJECT_NAME: str = "PriceMind AI Enterprise API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"   # development | staging | production
    LOG_LEVEL: str = "INFO"

    # ── CORS ───────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    # ── Database ───────────────────────────────────────────────────────────
    # Local dev defaults to SQLite; override with PostgreSQL in production.
    # Example: postgresql+psycopg2://user:password@host:5432/pricemind
    DATABASE_URL: str = "sqlite:///./pricemind.db"

    # Connection pool settings (ignored for SQLite)
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # ── Security ───────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-this-to-a-random-secret-in-production"

    # ── JWT Authentication (Module 13) ─────────────────────────────────────
    JWT_SECRET_KEY: str = "change-this-jwt-secret-to-a-random-value-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours default

    # ── Frontend ───────────────────────────────────────────────────────────
    VITE_API_URL: str = "http://localhost:8000/api/v1"

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}


settings = Settings()
