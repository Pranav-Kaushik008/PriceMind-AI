from fastapi import APIRouter
from app.schemas.pricing import SimulationParams, SimulationResponse
import time

router = APIRouter()

@router.post("/run", response_model=SimulationResponse)
def run_simulation(params: SimulationParams):
    """Run real-time scenario simulation calculation."""
    base_rev = 48920400.0
    base_cogs = 28471673.0
    base_vol = 124500

    price_delta_pct = (params.basePriceMultiplier - 1.0) * 100
    comp_delta_pct = (params.competitorReactionMultiplier - 1.0) * 100
    cost_inflation_pct = (params.costInflationMultiplier - 1.0) * 100

    vol_impact_pct = (price_delta_pct * -1.34) + (comp_delta_pct * 0.45) + params.macroDemandShiftPercent
    sim_vol = int(base_vol * (1.0 + vol_impact_pct / 100.0))
    sim_rev = base_rev * params.basePriceMultiplier * (1.0 + vol_impact_pct / 100.0)
    sim_cogs = base_cogs * (1.0 + cost_inflation_pct / 100.0) * (1.0 + vol_impact_pct / 100.0)
    sim_profit = sim_rev - sim_cogs
    sim_margin_pct = (sim_profit / sim_rev) * 100.0

    rev_delta_pct = round(((sim_rev - base_rev) / base_rev) * 100.0, 2)
    margin_delta_bps = int((sim_margin_pct - ((base_rev - base_cogs) / base_rev * 100.0)) * 100.0)

    timeline = [
        {"date": f"Month +{i}", "baselineForecast": 4070000 + i * 40000, "simulatedProjection": round((sim_rev / 12) * (1.0 + i * 0.01)), "lowerBound": round((sim_rev / 12) * 0.96), "upperBound": round((sim_rev / 12) * 1.04)}
        for i in range(1, 7)
    ]

    return {
        "id": f"sim-{int(time.time())}",
        "name": "Custom Simulation",
        "description": f"Price: {params.basePriceMultiplier:.2f}x, Comp: {params.competitorReactionMultiplier:.2f}x",
        "basePriceMultiplier": params.basePriceMultiplier,
        "competitorReactionMultiplier": params.competitorReactionMultiplier,
        "costInflationMultiplier": params.costInflationMultiplier,
        "macroDemandShiftPercent": params.macroDemandShiftPercent,
        "projectedRevenue": round(sim_rev, 2),
        "projectedGrossProfit": round(sim_profit, 2),
        "projectedVolume": sim_vol,
        "revenueDeltaPercent": rev_delta_pct,
        "marginDeltaBps": margin_delta_bps,
        "volumeDeltaPercent": round(vol_impact_pct, 2),
        "confidenceLowerBound": round(sim_rev * 0.96, 2),
        "confidenceUpperBound": round(sim_rev * 1.04, 2),
        "timelineForecast": timeline,
    }
