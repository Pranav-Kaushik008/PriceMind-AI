"""
Test optimization with actual product IDs from DB.
"""
import sys
sys.path.insert(0, 'backend')

from app.db.session import SessionLocal
from app.models.product import Product
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

# Get a real product from DB
products = db.query(Product).filter(Product.is_active == True, Product.cost_price != None, Product.current_price != None).limit(3).all()
print(f"Using {len(products)} real products from DB:")
for p in products:
    print(f"  {p.id} | {p.name} | Rs {p.current_price} | Cost Rs {p.cost_price} | Stock {p.inventory_level}")

print()
print("=" * 70)
print("OPTIMIZATION TEST WITH REAL DB PRODUCT IDs")
print("=" * 70)

for i, prod in enumerate(products):
    ctx = UnifiedPriceMindContext(
        id=f"ctx_real_{i+1}",
        product_id=prod.id,  # Real UUID from DB
        sku=prod.external_product_id,
        product_name=prod.name,
        visual_analysis=VisualAnalysisData(
            detected_label="product",
            match_confidence=0.85,
            match_status="matched"
        ),
        competitor_analysis=CompetitorComparisonResult(
            id=f"comp_real_{i+1}",
            detected_label="product",
            product_name=prod.name,
            comparison_status="higher_than_competitor" if prod.current_price else "no_price_detected",
            your_price=prod.current_price,
            competitor_price=round(prod.current_price * 0.96, 2) if prod.current_price else None,
            competitor_info=CompetitorInfo(
                competitor_name="Amazon" if i == 0 else None,
                is_identified=(i == 0),
                detection_confidence=0.75 if i == 0 else 0.0
            )
        ),
        pricing_context=PricingContext(
            current_price=prod.current_price,
            cost_price=prod.cost_price,
            inventory=InventoryContext(
                inventory_level=prod.inventory_level,
                stock_status="In Stock" if (prod.inventory_level or 0) > 10 else "Low Stock",
                cost_price=prod.cost_price
            )
        )
    )
    
    print(f"\n--- Product {i+1}: {prod.name} (SKU: {prod.external_product_id}) ---")
    recs = run_vision_pricing_optimization(db, [ctx])
    if recs:
        r = recs[0]
        print(f"Status: {r.status}")
        print(f"Current Price: Rs {r.current_price}")
        print(f"Competitor (Image): Rs {r.detected_competitor_price}")
        print(f"RECOMMENDED: Rs {r.recommended_price} ({r.price_change_pct}%)")
        print(f"Exp Demand: {r.expected_demand} units/day")
        print(f"Exp Revenue: Rs {r.expected_revenue}/day")
        print(f"Exp Profit: Rs {r.expected_profit}/day")
        print(f"Margin: {r.margin_percent}%")
        print(f"Confidence: {r.confidence}")
        print(f"Constraints: valid={r.constraints.valid}")
        if r.simulation:
            s = r.simulation
            print(f"Sim: Baseline Profit Rs {s.baseline.profit}/day -> Recommended Rs {s.recommended.profit}/day")
            print(f"Sim: Profit Change: {s.profit_change_pct}% | Revenue Change: {s.revenue_change_pct}%")

db.close()
print("\nTest complete!")
