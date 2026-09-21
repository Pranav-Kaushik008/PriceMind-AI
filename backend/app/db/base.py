"""
backend/app/db/base.py
-----------------------
Import Base and all models to ensure Alembic autogenerate sees the full schema.
"""

from app.db.session import Base                # noqa: F401
from app.models import *                       # noqa: F401, F403 — intentional wildcard for Alembic
