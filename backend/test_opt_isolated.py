"""
Quick isolated test of vision_pricing_optimization_service.
No YOLO, no EasyOCR — directly tests optimization math.
"""
import sys
sys.path.insert(0, 'backend')

from app.db.session import SessionLocal
from app.schemas.vision import (
    UnifiedPriceMindContext,
    VisualAnalysisData,
    CompetitorComparisonResult,
    CompetitorInfo,
    PricingContext,
    HistoricalDemandContext,
    InventoryContext,
    ElasticityContext
)
from app.services.vision_pricing_optimization_service import run_vision_pricing_optimization

db = SessionLocal()

# Build test contexts
test_cases = [
    # Case 1: Full data — matched product, competitor price detected
    {
        "name": "Full Data (Sony TV — higher than competitor)",
        "ctx": UnifiedPriceMindContext(
            id="ctx_t1",
            product_id="prod-001",
            sku="SONY-OLED-55",
            product_name="Sony Bravia 55 4K OLED",
            category="Electronics",
            brand="Sony",
            visual_analysis=VisualAnalysisData(
                detected_label="tv",
                match_confidence=0.87,
                match_status="matched"
            ),
            competitor_analysis=CompetitorComparisonResult(
                id="comp_t1",
                detected_label="tv",
                product_name="Sony Bravia 55 4K OLED",
                comparison_status="higher_than_competitor",
                your_price=61999.0,
                competitor_price=59999.0,
                price_difference=-2000.0,
                price_difference_percent=-3.23,
                competitor_info=CompetitorInfo(
                    competitor_name="Amazon",
                    is_identified=True,
                    detection_confidence=0.82
                )
            ),
            pricing_context=PricingContext(
                current_price=61999.0,
                cost_price=42000.0,
                historical_demand=HistoricalDemandContext(
                    total_units_sold=520,
                    avg_daily_demand=2.5,
                    demand_trend="Stable",
                    sales_records_count=130
                ),
                inventory=InventoryContext(
                    inventory_level=45,
                    stock_status="In Stock",
                    cost_price=42000.0,
                    margin_percent=32.2
                ),
                elasticity=ElasticityContext(
                    elasticity=-1.4,
                    elasticity_category="elastic",
                    reliability="Statistical estimate",
                    r_squared=0.72,
                    interpretation="Price-sensitive"
                )
            )
        )
    },
    # Case 2: No competitor price detected
    {
        "name": "No Competitor Price Detected",
        "ctx": UnifiedPriceMindContext(
            id="ctx_t2",
            product_id="prod-002",
            sku="SAMSUNG-QLED-65",
            product_name="Samsung QLED 65 4K",
            category="Electronics",
            visual_analysis=VisualAnalysisData(
                detected_label="tv",
                match_confidence=0.75,
                match_status="matched"
            ),
            competitor_analysis=CompetitorComparisonResult(
                id="comp_t2",
                detected_label="tv",
                product_name="Samsung QLED 65 4K",
                comparison_status="no_price_detected",
                competitor_info=CompetitorInfo(is_identified=False)
            ),
            pricing_context=PricingContext(
                current_price=79999.0,
                cost_price=55000.0,
                historical_demand=HistoricalDemandContext(
                    total_units_sold=300,
                    avg_daily_demand=1.8,
                    demand_trend="Declining"
                ),
                inventory=InventoryContext(
                    inventory_level=12,
                    stock_status="Low Stock",
                    cost_price=55000.0
                ),
                elasticity=ElasticityContext(
                    elasticity=-0.9,
                    elasticity_category="inelastic",
                    reliability="Statistical estimate",
                    r_squared=0.61
                )
            )
        )
    },
    # Case 3: Missing cost data
    {
        "name": "Missing Cost Price (should flag missing_data)",
        "ctx": UnifiedPriceMindContext(
            id="ctx_t3",
            product_id="prod-003",
            sku="LOGITECH-MX-MOUSE",
            product_name="Logitech MX Master 3S",
            category="Peripherals",
            visual_analysis=VisualAnalysisData(
                detected_label="mouse",
                match_confidence=0.80,
                match_status="matched"
            ),
            competitor_analysis=CompetitorComparisonResult(
                id="comp_t3",
                detected_label="mouse",
                product_name="Logitech MX Master 3S",
                comparison_status="no_price_detected",
                competitor_info=CompetitorInfo(is_identified=False)
            ),
            pricing_context=PricingContext(
                current_price=7999.0,
                cost_price=None,  # Missing cost
                historical_demand=HistoricalDemandContext(
                    avg_daily_demand=5.2
                )
            )
        )
    }
]

print("=" * 70)
print("OPTIMIZATION SERVICE UNIT TEST — Phase 3.1")
print("=" * 70)

for i, tc in enumerate(test_cases):
    print(f"\n--- TEST {i+1}: {tc['name']} ---")
    recs = run_vision_pricing_optimization(db, [tc["ctx"]])
    if recs:
        r = recs[0]
        print(f"Status: {r.status}")
        print(f"Status Message: {r.status_message}")
        print(f"Current Price: Rs {r.current_price}")
        print(f"Competitor Price (Image): Rs {r.detected_competitor_price}")
        print(f"Recommended Price: Rs {r.recommended_price}")
        print(f"Price Change: {r.price_change_pct}%")
        print(f"Expected Demand: {r.expected_demand} units/day")
        print(f"Expected Revenue: Rs {r.expected_revenue}/day")
        print(f"Expected Profit: Rs {r.expected_profit}/day")
        print(f"Gross Margin: {r.margin_percent}%")
        print(f"Confidence: {r.confidence}")
        print(f"Factors: {r.factors_considered}")
        print(f"Constraints Valid: {r.constraints.valid}")
        if r.constraints.violations:
            print(f"Violations: {r.constraints.violations}")
        if r.simulation:
            s = r.simulation
            print(f"Sim Demand Change: {s.demand_change_pct}%")
            print(f"Sim Revenue Change: {s.revenue_change_pct}%")
            print(f"Sim Profit Change: {s.profit_change_pct}%")
    else:
        print("No recommendation generated")

# Check DB persistence
from app.models.pricing import PricingRecommendation
db_recs = db.query(PricingRecommendation).order_by(PricingRecommendation.created_at.desc()).limit(5).all()
print(f"\n--- DB Persisted Recommendations (Latest 5) ---")
for r in db_recs:
    print(f"  Product: {r.product_id} | Rs {r.current_price} -> Rs {r.recommended_price} | Status: {r.status}")

db.close()
print("\nAll tests complete!")
