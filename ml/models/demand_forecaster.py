"""Forward-looking Demand & Volume Forecast Generator."""
from typing import List, Dict, Any

class DemandForecaster:
    def forecast_horizon(self, base_monthly_volume: int, price_multiplier: float, months: int = 6) -> List[Dict[str, Any]]:
        forecasts = []
        for m in range(1, months + 1):
            projected = int(base_monthly_volume * (1.0 + (m * 0.012)) * (price_multiplier ** -1.34))
            forecasts.append({
                "month": f"Month +{m}",
                "projectedUnits": projected,
                "lowerConfidence": int(projected * 0.95),
                "upperConfidence": int(projected * 1.05),
            })
        return forecasts

demand_forecaster = DemandForecaster()
