"""
backend/app/models/__init__.py
--------------------------------
Import all models so Alembic and SQLAlchemy have full registry visibility.
Order matters: define referenced tables before referencing ones.
"""

from app.models.organization import Organization          # noqa: F401
from app.models.user import User                          # noqa: F401
from app.models.category import Category                  # noqa: F401
from app.models.product import Product                    # noqa: F401
from app.models.sales_record import SalesRecord           # noqa: F401
from app.models.elasticity import ElasticityResult        # noqa: F401
from app.models.prediction import DemandPrediction        # noqa: F401
from app.models.forecast import Forecast                  # noqa: F401
from app.models.pricing import (                          # noqa: F401
    PricingRecommendation,
    PricingSimulation,
    PriceAdjustmentLog,
)
from app.models.model_registry import MLModelRegistry, OptimizationRun  # noqa: F401
from app.models.explanation import SHAPExplanation        # noqa: F401
