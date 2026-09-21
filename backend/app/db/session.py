"""
backend/app/db/session.py
-------------------------
SQLAlchemy engine, session factory, and FastAPI dependency.

Supports both SQLite (local dev) and PostgreSQL (production/Render).
DATABASE_URL is always read from the environment — never hardcoded.
"""

from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool, QueuePool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# ── Detect backend ─────────────────────────────────────────────────────────

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_is_postgres = "postgresql" in settings.DATABASE_URL

# ── Engine ─────────────────────────────────────────────────────────────────

_engine_kwargs: dict = {}

if _is_sqlite:
    # SQLite: no pooling, check_same_thread off for FastAPI threading
    _engine_kwargs = {
        "connect_args": {"check_same_thread": False},
    }
else:
    # PostgreSQL: connection pooling
    _engine_kwargs = {
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_pre_ping": True,      # detect stale connections
    }

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)

# ── Session factory ────────────────────────────────────────────────────────

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ── Declarative base ───────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ── FastAPI dependency ─────────────────────────────────────────────────────

def get_db():
    """
    Yields a database session per request, always closes on exit.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Health check ───────────────────────────────────────────────────────────

def check_db_connection() -> dict:
    """
    Verify database connectivity. Returns a status dict.
    Called by health-check utilities — not exposed as a public endpoint here.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database_url": _redacted_url(), "backend": _backend_name()}
    except Exception as exc:
        logger.error(f"[DB] Health check failed: {exc}")
        return {"status": "error", "detail": str(exc)}


def _backend_name() -> str:
    if _is_sqlite:
        return "sqlite"
    if _is_postgres:
        return "postgresql"
    return "unknown"


def _redacted_url() -> str:
    """Return DATABASE_URL with password replaced by ***."""
    url = settings.DATABASE_URL
    if "@" in url:
        prefix, rest = url.split("@", 1)
        if ":" in prefix.split("//")[-1]:
            proto_user, _ = prefix.rsplit(":", 1)
            return f"{proto_user}:***@{rest}"
    return url
