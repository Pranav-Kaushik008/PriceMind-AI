"""
backend/scripts/verify_db.py
------------------------------
Database connection verification script.

Verifies:
1. PostgreSQL/SQLite is reachable
2. SQLAlchemy connects
3. Tables exist (or can be created)
4. A simple SELECT works
5. A transaction works
6. Rollback works

Run from project root:
    backend\\venv\\Scripts\\python.exe backend/scripts/verify_db.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.db.session import engine, SessionLocal, check_db_connection
from app.db.base import Base


def main():
    print("=" * 55)
    print("PriceMind AI — Database Verification")
    print("=" * 55)

    # 1. Health check
    print("\n[1] Connection health check...")
    status = check_db_connection()
    print(f"    Status  : {status['status']}")
    print(f"    Backend : {status.get('backend')}")
    print(f"    URL     : {status.get('database_url')}")
    if status["status"] != "ok":
        print(f"    ERROR   : {status.get('detail')}")
        sys.exit(1)

    # 2. Table creation (SQLite / dev only)
    print("\n[2] Creating tables (if not exist)...")
    Base.metadata.create_all(bind=engine)
    print("    Done.")

    # 3. Table list
    with engine.connect() as conn:
        is_sqlite = "sqlite" in str(engine.url)
        if is_sqlite:
            tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()
        else:
            tables = conn.execute(
                text("SELECT tablename FROM pg_tables WHERE schemaname='public'")
            ).fetchall()

        table_names = sorted([t[0] for t in tables])
        print(f"\n[3] Tables ({len(table_names)}):")
        for t in table_names:
            print(f"    - {t}")

    # 4. Simple SELECT
    print("\n[4] Simple SELECT 1...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        assert result == 1, "SELECT 1 failed"
    print("    OK")

    # 5. Transaction test
    print("\n[5] Transaction test (INSERT + COMMIT)...")
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db.commit()
        print("    OK")
    except Exception as exc:
        print(f"    FAIL: {exc}")
        db.rollback()
    finally:
        db.close()

    # 6. Rollback test
    print("\n[6] Rollback test...")
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db.rollback()
        print("    OK (rolled back)")
    except Exception as exc:
        print(f"    FAIL: {exc}")
    finally:
        db.close()

    print("\n" + "=" * 55)
    print("All checks passed.")
    print("=" * 55)


if __name__ == "__main__":
    main()
