"""
backend/alembic/env.py
-----------------------
Alembic environment config for PriceMind AI.
- Reads DATABASE_URL from environment (never hardcoded).
- Imports all models so autogenerate detects the full schema.
"""

import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Add backend/ to path so `app` package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# This must be imported before target_metadata is set
from app.db.base import Base          # noqa: F401 — registers all models
from app.core.config import settings  # reads DATABASE_URL from environment

# Alembic Config object
config = context.config

# Override sqlalchemy.url with environment-driven DATABASE_URL
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set up Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no DB connection needed)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations with an active DB connection."""
    # For SQLite we must disable pooling (NullPool)
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")
    pool_class = pool.NullPool if is_sqlite else pool.QueuePool

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool_class,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
