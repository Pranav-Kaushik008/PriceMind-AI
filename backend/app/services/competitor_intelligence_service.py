"""
backend/app/services/competitor_intelligence_service.py
-------------------------------------------------------
Phase 2.2: Competitor Price Intelligence Service.
Extracts competitor retail metadata, promotions, availability, and compares
detected image prices directly against user catalog prices retrieved from PriceMind database.
Strictly does not fabricate competitor data or use hallucinating LLMs.
"""

import re
import math
from typing import List, Dict, Any, Optional, Tuple

from app.schemas.vision import (
    BoundingBoxCoordinates,
    DetectedObject,
    DetectedTextLabel,
    MatchedProductInfo,
    ProductMatchResult,
    CompetitorInfo,
    CompetitorComparisonResult,
)
from app.services.product_matching_service import boxes_overlap, normalize_text

# Known retail and e-commerce competitors across global & regional markets
KNOWN_COMPETITORS = {
    # Tech & E-Commerce Global
    "amazon": "Amazon",
    "walmart": "Walmart",
    "best buy": "Best Buy",
    "bestbuy": "Best Buy",
    "target": "Target",
    "ebay": "eBay",
    "costco": "Costco",
    "sams club": "Sam's Club",
    "sam's club": "Sam's Club",
    "b&h": "B&H Photo Video",
    "bh photo": "B&H Photo Video",
    "newegg": "Newegg",
    "micro center": "Micro Center",
    "apple store": "Apple Store",
    "apple.com": "Apple Store",
    "samsung store": "Samsung Store",
    # India & South Asia Retail
    "croma": "Croma",
    "reliance digital": "Reliance Digital",
    "reliance": "Reliance Digital",
    "vijay sales": "Vijay Sales",
    "flipkart": "Flipkart",
    "poorvika": "Poorvika Mobiles",
    "sangeetha": "Sangeetha Mobiles",
    "d-mart": "DMart",
    "dmart": "DMart",
    "big bazaar": "Big Bazaar",
    "jiomart": "JioMart",
    "tata cliq": "Tata CLiQ",
    # European & International Retail
    "mediamarkt": "MediaMarkt",
    "media markt": "MediaMarkt",
    "saturn": "Saturn",
    "currys": "Currys",
    "argos": "Argos",
    "tesco": "Tesco",
    "carrefour": "Carrefour",
    "aldi": "Aldi",
    "lidl": "Lidl",
    "ikea": "IKEA",
    "decathlon": "Decathlon",
    "home depot": "Home Depot",
    "lowe's": "Lowe's",
    "walgreens": "Walgreens",
    "cvs": "CVS Pharmacy",
    "boots": "Boots",
}

# Regex patterns for promotion and discount detection
PROMOTION_PATTERNS = [
    (re.compile(r"(\d{1,2}%\s*(?:off|discount|save|savings))", re.IGNORECASE), "Discount"),
    (re.compile(r"(?:save|savings|save up to)\s*([₹\$€£¥]?\s*\d[\d,]*(?:\.\d{2})?)", re.IGNORECASE), "Save Amount"),
    (re.compile(r"(?:m\.?r\.?p\.?|was|regular price|list price)\s*[:\s]*([₹\$€£¥]?\s*\d[\d,]*(?:\.\d{2})?)", re.IGNORECASE), "MRP Comparison"),
    (re.compile(r"\b(clearance|rollback|special offer|limited time deal|deal of the day|sale|flash sale|black friday|cyber monday|bogo|buy 1 get 1)\b", re.IGNORECASE), "Promotional Event"),
]

# Regex patterns for availability status
AVAILABILITY_PATTERNS = [
    (re.compile(r"\b(in stock|available now|in-store pickup|ready for pickup|ready to ship)\b", re.IGNORECASE), "In Stock"),
    (re.compile(r"\b(out of stock|sold out|currently unavailable|temporarily unavailable)\b", re.IGNORECASE), "Out of Stock"),
    (re.compile(r"\b(only \d+ left|limited stock|low stock|few left in stock)\b", re.IGNORECASE), "Limited Stock"),
    (re.compile(r"\b(pre-?order|back-?order)\b", re.IGNORECASE), "Pre-Order"),
]


def identify_competitor_from_text(all_texts: List[str]) -> Tuple[Optional[str], bool]:
    """
    Scans detected OCR text for known competitor brand names and store indicators.
    Returns (competitor_name, is_identified). If not identified, returns ("Competitor not identified", False).
    """
    concatenated = " ".join(all_texts).lower()
    
    # 1. Direct known competitor name matching
    for key, display_name in KNOWN_COMPETITORS.items():
        pattern = r"\b" + re.escape(key) + r"\b"
        if re.search(pattern, concatenated):
            return display_name, True

    # 2. Check for retail phrases e.g. "Sold by XYZ", "Store: XYZ"
    store_match = re.search(r"(?:sold by|store|retailer|seller)\s*[:\-]?\s*([A-Za-z0-9\s&]{3,20})", concatenated)
    if store_match:
        extracted = store_match.group(1).strip().title()
        if len(extracted) >= 3 and extracted.lower() not in ("you", "us", "pricemind"):
            return extracted, True

    return "Competitor not identified", False


def extract_promotion_and_availability(texts: List[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Extracts promotion text and availability status from candidate OCR text fragments.
    """
    full_text = " ".join(texts)
    
    # Extract Promotion
    detected_promo = None
    for pattern, promo_type in PROMOTION_PATTERNS:
        match = pattern.search(full_text)
        if match:
            matched_str = match.group(0).strip()
            # Clean up punctuation
            detected_promo = re.sub(r"\s+", " ", matched_str).upper()
            break

    # Extract Availability
    detected_avail = None
    for pattern, canonical_status in AVAILABILITY_PATTERNS:
        match = pattern.search(full_text)
        if match:
            detected_avail = canonical_status
            break

    return detected_promo, detected_avail


def calculate_price_distance(box_a: BoundingBoxCoordinates, box_b: BoundingBoxCoordinates) -> float:
    """Calculates Euclidean distance between centers of two normalized bounding boxes."""
    center_a_x = box_a.x_percent + (box_a.width_percent / 2.0)
    center_a_y = box_a.y_percent + (box_a.height_percent / 2.0)
    center_b_x = box_b.x_percent + (box_b.width_percent / 2.0)
    center_b_y = box_b.y_percent + (box_b.height_percent / 2.0)
    return math.sqrt((center_a_x - center_b_x) ** 2 + (center_a_y - center_b_y) ** 2)


def extract_competitor_intelligence(
    detected_objects: List[DetectedObject],
    detected_texts: List[DetectedTextLabel],
    matched_products: List[ProductMatchResult],
) -> List[CompetitorComparisonResult]:
    """
    Core Competitor Price Intelligence & Comparison Pipeline:
    1. Identifies competitor name from OCR telemetry.
    2. Finds OCR price tags associated with each matched product / detected object.
    3. Extracts promotions, discounts, availability, and OCR confidence.
    4. Compares detected competitor price against PriceMind database catalog price.
    5. Computes % difference and assigns visual indicator status.
    6. Ensures strict data provenance attribution.
    """
    all_raw_texts = [t.raw_text for t in detected_texts if t.raw_text]
    competitor_name, is_competitor_identified = identify_competitor_from_text(all_raw_texts)
    global_promo, global_avail = extract_promotion_and_availability(all_raw_texts)

    # Filter OCR price tags
    price_tags = [t for t in detected_texts if t.is_price_tag and t.extracted_price is not None]

    comparison_results: List[CompetitorComparisonResult] = []
    used_price_tag_ids = set()

    # Case 1: Matched products exist from Phase 2.1
    for match in matched_products:
        matched_info: Optional[MatchedProductInfo] = match.matched_product
        obj_id = match.detected_object_id

        # Find the detected object if present
        associated_obj = next((o for o in detected_objects if o.id == obj_id), None)

        # Find best matching price tag for this object / product
        best_price_tag: Optional[DetectedTextLabel] = None

        if associated_obj and price_tags:
            # Check price tags overlapping this object
            overlapping = [
                pt for pt in price_tags
                if boxes_overlap(associated_obj.box, pt.box, padding=12.0)
            ]
            if overlapping:
                # Pick the highest confidence overlapping price tag
                best_price_tag = max(overlapping, key=lambda p: p.confidence)
            else:
                # Pick closest price tag by distance
                best_price_tag = min(
                    price_tags,
                    key=lambda pt: calculate_price_distance(associated_obj.box, pt.box),
                )
        elif price_tags:
            # Fallback: pick first available price tag not yet heavily used
            unused = [pt for pt in price_tags if pt.id not in used_price_tag_ids]
            best_price_tag = unused[0] if unused else price_tags[0]

        if best_price_tag:
            used_price_tag_ids.add(best_price_tag.id)

        # Extract local promotion & availability if nearby price tag
        local_texts = []
        if best_price_tag:
            local_texts.append(best_price_tag.raw_text)
            for t in detected_texts:
                if t.id != best_price_tag.id and boxes_overlap(best_price_tag.box, t.box, padding=15.0):
                    local_texts.append(t.raw_text)
        
        local_promo, local_avail = extract_promotion_and_availability(local_texts)
        effective_promo = local_promo or global_promo
        effective_avail = local_avail or global_avail

        # Competitor Price metadata
        det_price = best_price_tag.extracted_price if best_price_tag else None
        currency = (best_price_tag.currency_symbol if best_price_tag and best_price_tag.currency_symbol else "₹")
        conf = best_price_tag.confidence if best_price_tag else 0.0

        comp_info = CompetitorInfo(
            competitor_name=competitor_name if is_competitor_identified else "Competitor not identified",
            is_identified=is_competitor_identified,
            detected_price=det_price,
            currency_symbol=currency,
            raw_price_text=best_price_tag.raw_text if best_price_tag else None,
            promotion=effective_promo,
            availability=effective_avail,
            detection_confidence=conf,
            ocr_tag_id=best_price_tag.id if best_price_tag else None,
            box=best_price_tag.box if best_price_tag else None,
        )

        # Price comparison against database catalog price
        your_price = matched_info.current_price if matched_info else None
        price_diff = None
        price_diff_pct = None
        comp_status = "no_comparison"
        status_label = "No Price Detected"

        if matched_info and your_price is not None and det_price is not None and det_price > 0:
            price_diff = round(your_price - det_price, 2)
            price_diff_pct = round(((your_price - det_price) / det_price) * 100.0, 2)

            if price_diff_pct < -0.5:
                comp_status = "lower_than_competitor"
                status_label = f"Lower than competitor ({price_diff_pct:+.2f}%)"
            elif price_diff_pct > 0.5:
                comp_status = "higher_than_competitor"
                status_label = f"Higher than competitor ({price_diff_pct:+.2f}%)"
            else:
                comp_status = "similar_to_competitor"
                status_label = f"Similar to competitor ({price_diff_pct:+.2f}%)"
        elif matched_info and (det_price is None or det_price == 0):
            comp_status = "no_price_detected"
            status_label = "Competitor price not detected in image"
        elif not matched_info:
            comp_status = "unmatched_product"
            status_label = "Product unmatched in catalog"

        prod_id = matched_info.product_id if matched_info else None
        prod_sku = matched_info.sku if matched_info else None
        prod_name = matched_info.name if matched_info else match.detected_label

        comparison_results.append(
            CompetitorComparisonResult(
                id=f"comp_{len(comparison_results)+1:02d}",
                product_id=prod_id,
                sku=prod_sku,
                product_name=prod_name,
                detected_label=match.detected_label,
                match_status=match.match_status,
                match_confidence=match.match_confidence,
                your_price=your_price,
                competitor_price=det_price,
                currency_symbol=currency,
                price_difference=price_diff,
                price_difference_percent=price_diff_pct,
                comparison_status=comp_status,
                status_label=status_label,
                competitor_info=comp_info,
                your_price_provenance=f"Retrieved from PriceMind database (SKU: {prod_sku})" if prod_sku else "Retrieved from PriceMind database",
                competitor_price_provenance=f"Detected from image (OCR Tag: {best_price_tag.id})" if best_price_tag else "Detected from image",
            )
        )

    # Case 2: No product matches at all, but OCR price tags exist
    if not comparison_results and price_tags:
        for idx, pt in enumerate(price_tags):
            local_texts = [pt.raw_text]
            for t in detected_texts:
                if t.id != pt.id and boxes_overlap(pt.box, t.box, padding=15.0):
                    local_texts.append(t.raw_text)
            
            local_promo, local_avail = extract_promotion_and_availability(local_texts)

            comp_info = CompetitorInfo(
                competitor_name=competitor_name if is_competitor_identified else "Competitor not identified",
                is_identified=is_competitor_identified,
                detected_price=pt.extracted_price,
                currency_symbol=pt.currency_symbol or "₹",
                raw_price_text=pt.raw_text,
                promotion=local_promo or global_promo,
                availability=local_avail or global_avail,
                detection_confidence=pt.confidence,
                ocr_tag_id=pt.id,
                box=pt.box,
            )

            comparison_results.append(
                CompetitorComparisonResult(
                    id=f"comp_{idx+1:02d}",
                    product_id=None,
                    sku=None,
                    product_name="Unidentified Shelf Item",
                    detected_label=f"Price Tag ({pt.raw_text})",
                    match_status="unmatched",
                    match_confidence=0.0,
                    your_price=None,
                    competitor_price=pt.extracted_price,
                    currency_symbol=pt.currency_symbol or "₹",
                    price_difference=None,
                    price_difference_percent=None,
                    comparison_status="unmatched_product",
                    status_label="Product unmatched in catalog",
                    competitor_info=comp_info,
                    your_price_provenance="Retrieved from PriceMind database",
                    competitor_price_provenance=f"Detected from image (OCR Tag: {pt.id})",
                )
            )

    return comparison_results
