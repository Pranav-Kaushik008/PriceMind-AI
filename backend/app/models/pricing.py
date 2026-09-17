from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="pricing_analyst") # 'executive', 'pricing_analyst', 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SKU(Base):
    __tablename__ = "skus"

    id = Column(String, primary_key=True, index=True)
    sku_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)
    channel = Column(String, index=True, nullable=False)
    current_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    margin_percent = Column(Float, nullable=False)
    current_velocity = Column(Integer, default=0)
    inventory_stock = Column(Integer, default=0)
    days_of_inventory = Column(Integer, default=0)
    elasticity_score = Column(Float, default=-1.0)
    elasticity_category = Column(String, default="unit_elastic")
    competitor_min_price = Column(Float, default=0.0)
    competitor_avg_price = Column(Float, default=0.0)
    competitor_max_price = Column(Float, default=0.0)
    price_position = Column(String, default="parity")
    revenue_risk_score = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PriceRecommendation(Base):
    __tablename__ = "price_recommendations"

    id = Column(String, primary_key=True, index=True)
    sku_id = Column(String, ForeignKey("skus.id"), index=True, nullable=False)
    sku_code = Column(String, index=True, nullable=False)
    current_price = Column(Float, nullable=False)
    recommended_price = Column(Float, nullable=False)
    price_delta_percent = Column(Float, nullable=False)
    projected_margin_percent = Column(Float, nullable=False)
    projected_revenue_delta = Column(Float, nullable=False)
    projected_volume_delta_percent = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    urgency = Column(String, default="immediate")
    status = Column(String, default="pending", index=True) # 'pending', 'approved', 'rejected', 'applied'
    primary_driver = Column(String, nullable=False)
    rationale = Column(String, nullable=False)
    guardrail_checks = Column(JSON, nullable=True)
    shap_attribution = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    applied_at = Column(DateTime(timezone=True), nullable=True)

class PriceAdjustmentLog(Base):
    __tablename__ = "price_adjustment_logs"

    id = Column(String, primary_key=True, index=True)
    sku_code = Column(String, index=True, nullable=False)
    actor_email = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    old_price = Column(Float, nullable=False)
    new_price = Column(Float, nullable=False)
    delta_profit_annualized = Column(Float, nullable=True)
    erp_sync_status = Column(String, default="SUCCESS")
    cryptographic_hash = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
