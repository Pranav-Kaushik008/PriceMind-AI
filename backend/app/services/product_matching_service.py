"""
backend/app/services/product_matching_service.py
------------------------------------------------
Phase 2.1: In-Store Product Catalog Matching Engine.
Matches detected visual objects and EasyOCR text strings with real catalog products in the database.
Uses deterministic token analysis, brand extraction, SKU identification, and n-gram similarity.
Strictly does not use hallucinating LLMs or fabricate matching confidences.
"""

import re
import difflib
from typing import List, Dict, Any, Optional, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.product import Product
from app.models.category import Category
from app.schemas.vision import (
    DetectedObject,
    DetectedTextLabel,
    MatchedProductInfo,
    ProductMatchResult,
)

# Known retail and industrial brands in database catalog
KNOWN_BRANDS = {
    "samsung": "Samsung",
    "sony": "Sony",
    "lg": "LG",
    "apple": "Apple",
    "dell": "Dell",
    "bose": "Bose",
    "logitech": "Logitech",
    "hydro flask": "Hydro Flask",
    "stanley": "Stanley",
    "thermoguard": "ThermoGuard",
    "ultraflow": "UltraFlow",
    "sensorcore": "SensorCore",
    "lavazza": "Lavazza",
    "lindt": "Lindt",
    "nike": "Nike",
    "philips": "Philips",
}

# Mapping of YOLO detected object labels to catalog categories
YOLO_TO_CATEGORY_MAP = {
    "tv": ["electronics", "display", "television"],
    "monitor": ["electronics", "computers", "peripherals"],
    "laptop": ["computers", "electronics"],
    "cell phone": ["smartphones", "electronics"],
    "bottle": ["accessories", "groceries"],
    "mouse": ["peripherals", "computers"],
    "keyboard": ["peripherals", "computers"],
    "cup": ["accessories", "groceries"],
    "clock": ["hardware & tools", "iot hardware"],
}


def normalize_text(text: str) -> str:
    """Lowercase and remove non-alphanumeric noise while preserving model numbers."""
    if not text:
        return ""
    cleaned = re.sub(r"[^\w\s\-\.]", " ", text.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def extract_tokens(text: str) -> Set[str]:
    """Extract normalized word and model tokens."""
    norm = normalize_text(text)
    tokens = set()
    for word in norm.split():
        cleaned = word.strip(".-")
        if len(cleaned) >= 2:
            tokens.add(cleaned)
    return tokens


def infer_brand(product_name: str) -> Optional[str]:
    """Identify brand from product name."""
    name_lower = product_name.lower()
    for brand_key, brand_val in KNOWN_BRANDS.items():
        if brand_key in name_lower:
            return brand_val
    first_word = product_name.split()[0] if product_name else ""
    return first_word.capitalize() if len(first_word) > 2 else None


def boxes_overlap(box_a, box_b, padding: float = 8.0) -> bool:
    """Determine if an OCR text box overlaps or sits near an object bounding box."""
    a_x1 = box_a.x_percent - padding
    a_y1 = box_a.y_percent - padding
    a_x2 = box_a.x_percent + box_a.width_percent + padding
    a_y2 = box_a.y_percent + box_a.height_percent + padding

    b_x1 = box_b.x_percent
    b_y1 = box_b.y_percent
    b_x2 = box_b.x_percent + box_b.width_percent
    b_y2 = box_b.y_percent + box_b.height_percent

    return not (a_x2 < b_x1 or a_x1 > b_x2 or a_y2 < b_y1 or a_y1 > b_y2)


def compute_catalog_match_score(
    product: Product,
    query_tokens: Set[str],
    concatenated_text: str,
    yolo_label: str = "",
) -> Tuple[float, str]:
    """
    Deterministic scoring algorithm between candidate catalog product and visual/OCR telemetry:
    1. Exact SKU match (1.0)
    2. Brand token presence (+0.35)
    3. Product Name Token Jaccard overlap (+0.40)
    4. Fuzzy string sequence similarity (+0.20)
    5. Category / YOLO alignment (+0.05)
    """
    prod_name = product.name or ""
    prod_sku = (product.external_product_id or "").lower()
    prod_name_tokens = extract_tokens(prod_name)
    prod_brand = infer_brand(prod_name)
    brand_lower = prod_brand.lower() if prod_brand else ""

    # 1. Exact SKU in OCR tokens or text
    norm_concat = normalize_text(concatenated_text)
    if prod_sku and (prod_sku in norm_concat or prod_sku.replace("-", "") in norm_concat.replace("-", "")):
        return 1.0, f"Exact SKU match on '{product.external_product_id}'"

    score = 0.0
    reasons = []

    # 2. Brand matching
    brand_matched = False
    if brand_lower and (brand_lower in query_tokens or brand_lower in norm_concat):
        score += 0.35
        brand_matched = True
        reasons.append(f"Brand '{prod_brand}' identified")

    # 3. Product name token overlap
    if prod_name_tokens and query_tokens:
        overlap = prod_name_tokens.intersection(query_tokens)
        token_ratio = len(overlap) / float(len(prod_name_tokens))
        score += token_ratio * 0.40
        if len(overlap) >= 2:
            reasons.append(f"Matching terms: {', '.join(sorted(list(overlap))[:4])}")

    # 4. Sequence fuzzy similarity between normalized product name & text
    seq_ratio = difflib.SequenceMatcher(None, normalize_text(prod_name), norm_concat).ratio()
    score += seq_ratio * 0.20

    # 5. YOLO Class / Category compatibility
    cat_name = (product.category.name.lower() if product.category else "") if hasattr(product, "category") else ""
    yolo_key = yolo_label.lower().split("/")[0].strip()
    if yolo_key in YOLO_TO_CATEGORY_MAP:
        allowed_cats = YOLO_TO_CATEGORY_MAP[yolo_key]
        if any(c in cat_name for c in allowed_cats):
            score += 0.05

    # If brand was not matched and token overlap is low, apply penalty
    if not brand_matched and len(prod_name_tokens.intersection(query_tokens)) < 2:
        score = min(score, 0.35)

    final_score = round(min(1.0, max(0.0, score)), 4)
    reason_str = " | ".join(reasons) if reasons else "Partial text correlation"

    return final_score, reason_str


def match_products_from_vision(
    db: Session,
    detected_objects: List[DetectedObject],
    detected_texts: List[DetectedTextLabel],
) -> List[ProductMatchResult]:
    """
    Main Product Matching Entrypoint:
    Evaluates detected objects and EasyOCR text blocks against active catalog products in the DB.
    """
    # 1. Fetch catalog products from the database
    catalog_products = list(
        db.scalars(
            select(Product).where(Product.is_active == True)  # noqa: E712
        )
    )

    if not catalog_products:
        return []

    # Prepare global OCR tokens and concatenated raw text
    all_raw_texts = [t.raw_text for t in detected_texts if t.raw_text]
    global_text_str = " ".join(all_raw_texts)
    global_tokens = extract_tokens(global_text_str)

    results: List[ProductMatchResult] = []

    # Case A: YOLO Detected Objects exist
    if detected_objects:
        for obj in detected_objects:
            # Find OCR tags situated in or near this object's bounding box
            local_texts = [
                t.raw_text for t in detected_texts
                if boxes_overlap(obj.box, t.box) and t.raw_text
            ]
            
            # If no local OCR tags found inside box, fall back to global OCR context
            effective_text_str = " ".join(local_texts) if local_texts else global_text_str
            effective_tokens = extract_tokens(effective_text_str).union(extract_tokens(obj.label))

            best_prod: Optional[Product] = None
            best_score = 0.0
            best_reason = ""

            for prod in catalog_products:
                score, reason = compute_catalog_match_score(
                    product=prod,
                    query_tokens=effective_tokens,
                    concatenated_text=effective_text_str,
                    yolo_label=obj.label,
                )
                if score > best_score:
                    best_score = score
                    best_prod = prod
                    best_reason = reason

            # Classify match status
            if best_score >= 0.70 and best_prod is not None:
                match_status = "matched"
            elif best_score >= 0.40 and best_prod is not None:
                match_status = "possible_match"
                best_reason = "Possible match — verify product"
            else:
                match_status = "unmatched"
                best_reason = "No confident catalog match found"

            matched_info = None
            if match_status != "unmatched" and best_prod is not None:
                matched_info = MatchedProductInfo(
                    product_id=str(best_prod.id),
                    sku=best_prod.external_product_id,
                    name=best_prod.name,
                    brand=infer_brand(best_prod.name),
                    category=best_prod.category.name if best_prod.category else "General",
                    current_price=best_prod.current_price,
                )

            results.append(
                ProductMatchResult(
                    detected_object_id=obj.id,
                    detected_label=obj.label,
                    matched_product=matched_info,
                    match_confidence=best_score,
                    match_status=match_status,
                    match_reason=best_reason,
                )
            )

    # Case B: No YOLO Objects detected, but OCR text exists (e.g. single product label scan)
    elif detected_texts:
        best_prod = None
        best_score = 0.0
        best_reason = ""

        for prod in catalog_products:
            score, reason = compute_catalog_match_score(
                product=prod,
                query_tokens=global_tokens,
                concatenated_text=global_text_str,
                yolo_label="Item Label",
            )
            if score > best_score:
                best_score = score
                best_prod = prod
                best_reason = reason

        if best_score >= 0.70 and best_prod is not None:
            match_status = "matched"
        elif best_score >= 0.40 and best_prod is not None:
            match_status = "possible_match"
            best_reason = "Possible match — verify product"
        else:
            match_status = "unmatched"
            best_reason = "No confident catalog match found"

        matched_info = None
        if match_status != "unmatched" and best_prod is not None:
            matched_info = MatchedProductInfo(
                product_id=str(best_prod.id),
                sku=best_prod.external_product_id,
                name=best_prod.name,
                brand=infer_brand(best_prod.name),
                category=best_prod.category.name if best_prod.category else "General",
                current_price=best_prod.current_price,
            )

        results.append(
            ProductMatchResult(
                detected_object_id=None,
                detected_label="OCR Text Identification",
                matched_product=matched_info,
                match_confidence=best_score,
                match_status=match_status,
                match_reason=best_reason,
            )
        )

    return results
