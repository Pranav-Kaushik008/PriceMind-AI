import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import numpy as np
from ml.models.elasticity_model import elasticity_model
from ml.optimization.price_optimizer import price_optimizer
from ml.evaluation.metrics import calculate_wape, calculate_mae, calculate_r2

def test_elasticity_model_generation():
    curve = elasticity_model.generate_demand_curve(current_price=389.0, current_demand=42, cost_price=210.0)
    assert len(curve) == 9
    assert all("revenue" in pt for pt in curve)

def test_price_optimizer():
    result = price_optimizer.optimize_sku(current_price=389.0, cost_price=210.0, elasticity=-0.62)
    assert "recommended_price" in result
    assert result["guardrail_floor_passed"] is True

def test_evaluation_metrics():
    y_true = np.array([100.0, 150.0, 200.0])
    y_pred = np.array([102.0, 148.0, 195.0])
    wape = calculate_wape(y_true, y_pred)
    mae = calculate_mae(y_true, y_pred)
    r2 = calculate_r2(y_true, y_pred)
    assert wape > 0
    assert mae > 0
    assert r2 > 0.9
