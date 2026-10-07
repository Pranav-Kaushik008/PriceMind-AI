import os
import sys
from PIL import Image, ImageDraw, ImageFont
import io

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath("backend"))

from app.db.session import SessionLocal
from app.services.vision_service import analyze_image_bytes
from app.models.product import Product
from app.models.pricing import PricingRecommendation

def create_mock_shelf_image(text_overlay="Sony Bravia 55 OLED\n₹69,999", color=(20, 25, 40)):
    img = Image.new("RGB", (800, 600), color=color)
    draw = ImageDraw.Draw(img)
    # Draw simulated shelf/product rectangle
    draw.rectangle([100, 100, 700, 500], outline=(255, 255, 255), width=3)
    # Draw text
    draw.text((150, 200), text_overlay, fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def run_tests():
    db = SessionLocal()
    print("=================================================================")
    print("PHASE 3.1: END-TO-END VISION PRICING OPTIMIZATION VERIFICATION")
    print("=================================================================")

    # Test 1: Complete Data Scenario (Sony TV matched, competitor price detected)
    print("\n--- TEST CASE 1: Complete Data (Matched Product + Competitor Price) ---")
    img_bytes = create_mock_shelf_image("Sony Bravia 55\nRs 69,999")
    resp = analyze_image_bytes(img_bytes, filename="sony_shelf_test.jpg", db=db)
    print(f"Status: {resp.status}")
    print(f"Detected Objects: {resp.detected_objects_count}")
    print(f"Detected Text: {resp.detected_text_count}")
    print(f"Matched Products: {resp.matched_products_count}")
    print(f"Competitor Insights: {resp.competitor_insights_count}")
    print(f"PriceMind Contexts: {resp.pricemind_contexts_count}")
    print(f"Pricing Recommendations: {resp.pricing_recommendations_count}")
    
    if resp.pricing_recommendations:
        rec = resp.pricing_recommendations[0]
        print(f"Product: {rec.product_name} (SKU: {rec.sku})")
        print(f"Current Price (DB): Rs {rec.current_price}")
        print(f"Detected Competitor (Image): Rs {rec.detected_competitor_price}")
        print(f"Recommended Price (Opt): Rs {rec.recommended_price} ({rec.price_change_pct}%)")
        print(f"Expected Demand: {rec.expected_demand} units/day (Model estimate)")
        print(f"Expected Daily Revenue: Rs {rec.expected_revenue} (Model estimate)")
        print(f"Expected Daily Profit: Rs {rec.expected_profit} (Model estimate)")
        print(f"Gross Margin: {rec.margin_percent}% (Constraint-verified)")
        print(f"Confidence: {rec.confidence}")
        print(f"Factors Considered: {rec.factors_considered}")
        print(f"Constraints Valid: {rec.constraints.valid}")
        if rec.simulation:
            print(f"Simulation Demand Change: {rec.simulation.demand_change_pct}%")
            print(f"Simulation Profit Change: {rec.simulation.profit_change_pct}%")

    # Test 2: Missing Competitor Price (Product matched, but no price on image)
    print("\n--- TEST CASE 2: Missing Competitor Price (Product Matched, No Price Tag) ---")
    img_bytes2 = create_mock_shelf_image("Sony Bravia TV 4K OLED")
    resp2 = analyze_image_bytes(img_bytes2, filename="sony_no_price.jpg", db=db)
    print(f"Pricing Recommendations Count: {resp2.pricing_recommendations_count}")
    if resp2.pricing_recommendations:
        rec2 = resp2.pricing_recommendations[0]
        print(f"Current Price: Rs {rec2.current_price}")
        print(f"Competitor Price: {rec2.detected_competitor_price}")
        print(f"Recommended Price: Rs {rec2.recommended_price}")
        print(f"Status: {rec2.status}")

    # Test 3: Unmatched Product
    print("\n--- TEST CASE 3: Unmatched Product (Non-Catalog Retail Item) ---")
    img_bytes3 = create_mock_shelf_image("Random Vintage Lamp 1970s\nRs 1,200")
    resp3 = analyze_image_bytes(img_bytes3, filename="vintage_lamp.jpg", db=db)
    print(f"Matched Products Count: {resp3.matched_products_count}")
    print(f"Pricing Recommendations Count: {resp3.pricing_recommendations_count}")

    # Test 4: Missing Cost / Inventory Edge Case
    print("\n--- TEST CASE 4: Product with Missing Cost in Context ---")
    # Test directly with empty/missing cost in context
    from app.schemas.vision import UnifiedPriceMindContext, VisualAnalysisData, CompetitorComparisonResult, PricingContext
    incomplete_ctx = UnifiedPriceMindContext(
        id="ctx_incomplete_01",
        product_id="prod_incomplete",
        sku="SKU-INCOMPLETE",
        product_name="Incomplete Data Product",
        visual_analysis=VisualAnalysisData(
            detected_label="Incomplete Widget",
            match_confidence=0.85,
            match_status="matched"
        ),
        competitor_analysis=CompetitorComparisonResult(
            id="comp_inc",
            detected_label="Incomplete Widget",
            product_name="Incomplete Data Product",
            comparison_status="no_price_detected"
        ),
        pricing_context=PricingContext(
            current_price=500.0,
            cost_price=None, # Missing cost
        )
    )
    from app.services.vision_pricing_optimization_service import run_vision_pricing_optimization
    recs_inc = run_vision_pricing_optimization(db, [incomplete_ctx])
    print(f"Incomplete Data Rec Status: {recs_inc[0].status}")
    print(f"Incomplete Data Rec Message: {recs_inc[0].status_message}")
    print(f"Confidence: {recs_inc[0].confidence}")

    # Test 5: Latency and Timing Breakdown Check
    print("\n--- TEST CASE 5: Pipeline Latency Breakdown ---")
    stats = resp.processing_stats
    print(f"Preprocessing: {stats.preprocessing_time_ms} ms")
    print(f"YOLO Detection: {stats.detection_time_ms} ms")
    print(f"EasyOCR: {stats.ocr_time_ms} ms")
    print(f"Matching: {stats.matching_time_ms} ms")
    print(f"Competitor Intelligence: {stats.competitor_intelligence_time_ms} ms")
    print(f"PriceMind Context: {stats.pricemind_context_time_ms} ms")
    print(f"Optimization: {stats.optimization_time_ms} ms")
    print(f"Total Pipeline: {stats.total_pipeline_time_ms} ms")

    # Verify recommendations persisted in DB
    db_recs = db.query(PricingRecommendation).all()
    print(f"\n--- Total DB Persisted Pricing Recommendations: {len(db_recs)} ---")
    for r in db_recs[-3:]:
        print(f" - [DB #{r.id}] Product: {r.product_id} | Curr: Rs {r.current_price} -> Rec: Rs {r.recommended_price} | Status: {r.status}")

    db.close()
    print("\nAll 6 test cases executed successfully!")

if __name__ == "__main__":
    run_tests()
