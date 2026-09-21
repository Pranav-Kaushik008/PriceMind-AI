"""
tests/test_database.py
------------------------
Database layer tests for Module 8.

Uses SQLite in-memory for isolation — NEVER touches the user's dev database.
"""

import uuid
import pytest
from datetime import date, datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.db.base import Base
from app.db.session import check_db_connection


# ── In-memory SQLite engine for tests ────────────────────────────────────────

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="module")
def engine():
    eng = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture(scope="function")
def db(engine):
    """Fresh session per test — rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection, expire_on_commit=False)
    session = Session()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


# ── 1. Connection ─────────────────────────────────────────────────────────────

def test_sqlite_connection(engine):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
    assert result == 1


def test_health_check_returns_dict():
    result = check_db_connection()
    assert isinstance(result, dict)
    assert "status" in result


# ── 2. Table creation ─────────────────────────────────────────────────────────

def test_all_tables_created(engine):
    with engine.connect() as conn:
        tables = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table'")
        ).fetchall()
    table_names = {t[0] for t in tables}
    expected = {
        "organizations", "users", "categories", "products",
        "sales_records", "elasticity_results", "demand_predictions",
        "forecasts", "pricing_recommendations", "pricing_simulations",
        "price_adjustment_logs", "ml_model_registry", "optimization_runs",
        "shap_explanations",
    }
    missing = expected - table_names
    assert not missing, f"Missing tables: {missing}"


# ── 3. Organization model ─────────────────────────────────────────────────────

def test_create_organization(db):
    from app.models.organization import Organization
    org = Organization(id=str(uuid.uuid4()), name="Test Org")
    db.add(org)
    db.flush()
    fetched = db.get(Organization, org.id)
    assert fetched is not None
    assert fetched.name == "Test Org"


def test_organization_name_unique(db):
    from app.models.organization import Organization
    from sqlalchemy.exc import IntegrityError
    org1 = Organization(id=str(uuid.uuid4()), name="Unique Org")
    org2 = Organization(id=str(uuid.uuid4()), name="Unique Org")
    db.add(org1)
    db.flush()
    db.add(org2)
    with pytest.raises(IntegrityError):
        db.flush()


# ── 4. User model ─────────────────────────────────────────────────────────────

def test_create_user(db):
    from app.models.organization import Organization
    from app.models.user import User
    org = Organization(id=str(uuid.uuid4()), name=f"Org-{uuid.uuid4()}")
    db.add(org)
    db.flush()
    user = User(
        id=str(uuid.uuid4()),
        organization_id=org.id,
        email=f"test-{uuid.uuid4()}@example.com",
        hashed_password="$2b$12$somehash",
        full_name="Test User",
    )
    db.add(user)
    db.flush()
    fetched = db.get(User, user.id)
    assert fetched.email == user.email
    assert fetched.hashed_password != "plaintext"


def test_user_email_unique(db):
    from app.models.user import User
    from sqlalchemy.exc import IntegrityError
    email = f"dup-{uuid.uuid4()}@example.com"
    u1 = User(id=str(uuid.uuid4()), email=email, hashed_password="hash1")
    u2 = User(id=str(uuid.uuid4()), email=email, hashed_password="hash2")
    db.add(u1)
    db.flush()
    db.add(u2)
    with pytest.raises(IntegrityError):
        db.flush()


# ── 5. Category + Product + FK ────────────────────────────────────────────────

def test_category_product_relationship(db):
    from app.models.category import Category
    from app.models.product import Product
    cat = Category(id=str(uuid.uuid4()), name=f"Cat-{uuid.uuid4()}")
    db.add(cat)
    db.flush()
    prod = Product(
        id=str(uuid.uuid4()),
        external_product_id=f"SKU-{uuid.uuid4()}",
        name="Test Product",
        category_id=cat.id,
        current_price=100.0,
        is_active=True,
    )
    db.add(prod)
    db.flush()
    assert prod.category_id == cat.id


# ── 6. SalesRecord ────────────────────────────────────────────────────────────

def test_sales_record_insert(db):
    from app.models.category import Category
    from app.models.product import Product
    from app.models.sales_record import SalesRecord
    cat = Category(id=str(uuid.uuid4()), name=f"Cat-{uuid.uuid4()}")
    db.add(cat)
    db.flush()
    prod = Product(
        id=str(uuid.uuid4()),
        external_product_id=f"SKU-{uuid.uuid4()}",
        name="P1",
        category_id=cat.id,
        current_price=50.0,
        is_active=True,
    )
    db.add(prod)
    db.flush()
    sr = SalesRecord(
        id=str(uuid.uuid4()),
        product_id=prod.id,
        record_date=date(2025, 9, 1),
        price=50.0,
        units_sold=10,
        is_promotion=False,
    )
    db.add(sr)
    db.flush()
    assert sr.id is not None
    assert sr.units_sold == 10


# ── 7. ElasticityResult ────────────────────────────────────────────────────────

def test_elasticity_result_insert(db):
    from app.models.category import Category
    from app.models.product import Product
    from app.models.elasticity import ElasticityResult
    cat = Category(id=str(uuid.uuid4()), name=f"Cat-{uuid.uuid4()}")
    db.add(cat)
    db.flush()
    prod = Product(id=str(uuid.uuid4()), external_product_id=f"SKU-{uuid.uuid4()}", name="P2", category_id=cat.id, current_price=100.0)
    db.add(prod)
    db.flush()
    er = ElasticityResult(
        id=str(uuid.uuid4()),
        product_id=prod.id,
        elasticity=-1.5,
        methodology="log_log_ols",
        model_version="v1",
        reliability="High Confidence",
    )
    db.add(er)
    db.flush()
    assert er.elasticity == -1.5


# ── 8. JSONB / JSON fields ────────────────────────────────────────────────────

def test_model_registry_json_metrics(db):
    from app.models.model_registry import MLModelRegistry
    reg = MLModelRegistry(
        id=str(uuid.uuid4()),
        model_name=f"xgboost-{uuid.uuid4()}",
        model_type="XGBRegressor",
        version="v1",
        target="units_sold",
        metrics={"rmse": 2.87, "r2": 0.944, "mae": 1.91},
        hyperparameters={"n_estimators": 300, "max_depth": 6},
        status="active",
    )
    db.add(reg)
    db.flush()
    fetched = db.get(MLModelRegistry, reg.id)
    assert fetched.metrics["rmse"] == pytest.approx(2.87)
    assert fetched.hyperparameters["n_estimators"] == 300


def test_shap_explanation_json(db):
    from app.models.category import Category
    from app.models.product import Product
    from app.models.explanation import SHAPExplanation
    cat = Category(id=str(uuid.uuid4()), name=f"Cat-{uuid.uuid4()}")
    db.add(cat)
    db.flush()
    prod = Product(id=str(uuid.uuid4()), external_product_id=f"SKU-{uuid.uuid4()}", name="P3", category_id=cat.id, current_price=200.0)
    db.add(prod)
    db.flush()
    exp = SHAPExplanation(
        id=str(uuid.uuid4()),
        product_id=prod.id,
        model_name="XGBRegressor",
        model_version="v1",
        explanation_type="local",
        base_value=18.5,
        predicted_value=22.3,
        feature_contributions={"price": 0.42, "inventory_level": -0.15, "is_promotion": 0.31},
    )
    db.add(exp)
    db.flush()
    fetched = db.get(SHAPExplanation, exp.id)
    assert fetched.feature_contributions["price"] == pytest.approx(0.42)


# ── 9. Transaction rollback ────────────────────────────────────────────────────

def test_transaction_rollback(engine):
    from app.models.organization import Organization
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        org = Organization(id=str(uuid.uuid4()), name=f"Rollback-{uuid.uuid4()}")
        db.add(org)
        db.flush()
        org_id = org.id
        db.rollback()
        # After rollback, the org should not exist
        fetched = db.get(Organization, org_id)
        assert fetched is None
    finally:
        db.close()


# ── 10. Repository functions ───────────────────────────────────────────────────

def test_product_repo_upsert(db):
    from app.models.category import Category
    from app.repositories.product_repo import get_or_create_category, upsert_product
    cat = get_or_create_category(db, f"Repo-Cat-{uuid.uuid4()}")
    prod = upsert_product(
        db,
        external_product_id=f"SKU-REPO-{uuid.uuid4()}",
        name="Repo Product",
        category_id=cat.id,
        current_price=99.0,
        is_active=True,
    )
    assert prod.id is not None
    # Upsert again — should update, not duplicate
    prod2 = upsert_product(
        db,
        external_product_id=prod.external_product_id,
        name="Repo Product Updated",
        category_id=cat.id,
        current_price=109.0,
        is_active=True,
    )
    assert prod2.id == prod.id
    assert prod2.current_price == 109.0
