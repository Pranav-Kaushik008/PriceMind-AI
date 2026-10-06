"""
backend/app/services/vision_service.py
--------------------------------------
Real Computer Vision pipeline combining:
1. Lightweight YOLOv8 Object Detection
2. EasyOCR Text & Price Label Extraction
"""

import io
import os
import ssl
import time
import re
import numpy as np
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session
from PIL import Image, ImageStat, ImageOps

# Ensure unverified SSL context for PyTorch model downloads if needed
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except Exception:
    pass

from app.schemas.vision import (
    BoundingBoxCoordinates,
    DetectedObject,
    DetectedTextLabel,
    ImageMetadata,
    ProcessingStats,
    VisionPipelineResponse,
)

# Global Cached Singletons
_yolo_model = None
_easyocr_reader = None


def get_yolo_model():
    """Lazy loads and caches the lightweight YOLOv8 Nano model."""
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "yolov8n.pt")
            if not os.path.exists(model_path):
                model_path = "yolov8n.pt"
            _yolo_model = YOLO(model_path)
        except Exception as e:
            print(f"Warning: Could not initialize YOLO model: {e}")
            _yolo_model = None
    return _yolo_model


def get_easyocr_reader():
    """Lazy loads and caches the EasyOCR Reader instance on CPU."""
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            _easyocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        except Exception as e:
            print(f"Warning: Could not initialize EasyOCR reader: {e}")
            _easyocr_reader = None
    return _easyocr_reader


def parse_price_candidate(text: str) -> Tuple[bool, Optional[float], Optional[str]]:
    """
    Identifies price-like text candidates and normalizes numeric values & currencies.
    Supports: ₹59,999, $599.99, €499, £45.50, 599.99, ₹1,299
    Rejects: dates (2026-03-12), percentages (4.8%), model numbers (v3.4), dimensions (55"), single integers.
    """
    clean_text = text.strip()

    # Reject percentages or dimension tags
    if '%' in clean_text or clean_text.endswith('"') or clean_text.endswith("'") or clean_text.endswith("px"):
        return False, None, None

    # Reject dates (e.g. 2026-03-12 or 12/03/2026)
    if re.search(r'\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', clean_text):
        return False, None, None

    # Match currency symbol + price amount: ₹59,999, $599.99, €499, £1,299.00
    currency_match = re.search(r'([₹$€£¥])\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)', clean_text)
    if currency_match:
        currency = currency_match.group(1)
        raw_num = currency_match.group(2).replace(',', '')
        try:
            val = float(raw_num)
            if val > 0:
                return True, round(val, 2), currency
        except ValueError:
            pass

    # Match standard decimal price format without currency symbol: 599.99, 1299.50, 49.99
    decimal_match = re.search(r'\b([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})\b', clean_text)
    if decimal_match:
        raw_num = decimal_match.group(1).replace(',', '')
        try:
            val = float(raw_num)
            if val > 0:
                return True, round(val, 2), None
        except ValueError:
            pass

    return False, None, None


def analyze_image_bytes(
    image_bytes: bytes,
    filename: str = "upload.jpg",
    db: Optional[Session] = None,
) -> VisionPipelineResponse:
    """
    Full Vision Pipeline:
    Image → Preprocessing → YOLO Object Detection → EasyOCR Text & Price Extraction → Product Catalog Matching
    """
    start_total = time.perf_counter()

    # Step 1: Decode image with Pillow
    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        if pil_image.mode not in ("RGB", "L"):
            pil_image = pil_image.convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid or corrupted image format: {str(e)}")

    orig_width, orig_height = pil_image.size
    orig_format = pil_image.format or "JPEG"
    orig_mode = pil_image.mode
    size_kb = round(len(image_bytes) / 1024, 1)

    # Step 2: Preprocessing
    start_prep = time.perf_counter()
    gray_image = ImageOps.grayscale(pil_image)
    stat = ImageStat.Stat(gray_image)
    mean_brightness = stat.mean[0] if stat.mean else 128.0
    aspect_ratio_str = f"{orig_width}:{orig_height}" if orig_width == orig_height else f"{(orig_width/orig_height):.2f}:1"
    prep_time_ms = round((time.perf_counter() - start_prep) * 1000, 2)

    # Step 3: Real YOLO Object Detection
    start_det = time.perf_counter()
    detected_objects: List[DetectedObject] = []

    yolo = get_yolo_model()
    if yolo is not None:
        try:
            results = yolo(pil_image, conf=0.15, verbose=False)
            boxes = results[0].boxes

            for idx, b in enumerate(boxes):
                cls_id = int(b.cls.item())
                raw_label = results[0].names.get(cls_id, "Unknown")
                confidence = round(float(b.conf.item()), 4)

                x_min, y_min, x_max, y_max = b.xyxy[0].tolist()
                x_min = max(0.0, min(float(orig_width), float(x_min)))
                y_min = max(0.0, min(float(orig_height), float(y_min)))
                x_max = max(x_min, min(float(orig_width), float(x_max)))
                y_max = max(y_min, min(float(orig_height), float(y_max)))

                w_px = int(x_max - x_min)
                h_px = int(y_max - y_min)
                x_px = int(x_min)
                y_px = int(y_min)

                x_pct = round((x_min / orig_width) * 100.0, 2)
                y_pct = round((y_min / orig_height) * 100.0, 2)
                w_pct = round(((x_max - x_min) / orig_width) * 100.0, 2)
                h_pct = round(((y_max - y_min) / orig_height) * 100.0, 2)

                display_label = raw_label.title()
                if raw_label.lower() in ("tv", "monitor"):
                    display_label = "TV / Display Unit"
                elif raw_label.lower() == "bottle":
                    display_label = "Bottle / Retail Item"
                elif raw_label.lower() == "refrigerator":
                    display_label = "Refrigerator Unit"
                elif not raw_label or raw_label == "Unknown":
                    display_label = "Unknown Object"

                detected_objects.append(
                    DetectedObject(
                        id=f"yolo_{idx+1:02d}",
                        label=display_label,
                        confidence=confidence,
                        box=BoundingBoxCoordinates(
                            x_percent=x_pct,
                            y_percent=y_pct,
                            width_percent=w_pct,
                            height_percent=h_pct,
                            x_px=x_px,
                            y_px=y_px,
                            width_px=w_px,
                            height_px=h_px,
                        ),
                        attributes={
                            "yolo_class_id": cls_id,
                            "raw_class_name": raw_label,
                            "detection_engine": "YOLOv8n-COCO",
                        },
                    )
                )
        except Exception as det_err:
            print(f"YOLO detection error: {det_err}")

    det_time_ms = round((time.perf_counter() - start_det) * 1000, 2)

    # Step 4: Real EasyOCR Text & Price Detection
    start_ocr = time.perf_counter()
    detected_texts: List[DetectedTextLabel] = []

    ocr_reader = get_easyocr_reader()
    if ocr_reader is not None:
        try:
            # Convert PIL image to numpy array for EasyOCR
            np_img = np.array(pil_image)
            ocr_results = ocr_reader.readtext(np_img, paragraph=False)

            for i, (polygon, raw_text, ocr_conf) in enumerate(ocr_results):
                # Filter low-confidence OCR noise
                if ocr_conf < 0.10 or not raw_text or len(raw_text.strip()) == 0:
                    continue

                # Calculate bounding box from 4-corner polygon: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                xs = [pt[0] for pt in polygon]
                ys = [pt[1] for pt in polygon]
                x_min = max(0.0, min(xs))
                y_min = max(0.0, min(ys))
                x_max = min(float(orig_width), max(xs))
                y_max = min(float(orig_height), max(ys))

                x_px = int(x_min)
                y_px = int(y_min)
                w_px = max(1, int(x_max - x_min))
                h_px = max(1, int(y_max - y_min))

                x_pct = round((x_min / orig_width) * 100.0, 2)
                y_pct = round((y_min / orig_height) * 100.0, 2)
                w_pct = round(((x_max - x_min) / orig_width) * 100.0, 2)
                h_pct = round(((y_max - y_min) / orig_height) * 100.0, 2)

                # Identify if text is price-like (₹59,999, $599.99, €499, 599.99, etc.)
                is_price, price_val, curr_sym = parse_price_candidate(raw_text)

                detected_texts.append(
                    DetectedTextLabel(
                        id=f"ocr_{i+1:02d}",
                        raw_text=raw_text.strip(),
                        extracted_price=price_val,
                        currency_symbol=curr_sym,
                        confidence=round(float(ocr_conf), 4),
                        box=BoundingBoxCoordinates(
                            x_percent=x_pct,
                            y_percent=y_pct,
                            width_percent=w_pct,
                            height_percent=h_pct,
                            x_px=x_px,
                            y_px=y_px,
                            width_px=w_px,
                            height_px=h_px,
                        ),
                        is_price_tag=is_price,
                    )
                )
        except Exception as ocr_err:
            print(f"EasyOCR extraction error: {ocr_err}")

    ocr_time_ms = round((time.perf_counter() - start_ocr) * 1000, 2)

    # Step 5: Product Catalog Matching
    start_match = time.perf_counter()
    matched_products = []
    if db is not None:
        try:
            from app.services.product_matching_service import match_products_from_vision
            matched_products = match_products_from_vision(db, detected_objects, detected_texts)
        except Exception as match_err:
            print(f"Product matching error (non-fatal): {match_err}")
    match_time_ms = round((time.perf_counter() - start_match) * 1000, 2)

    total_time_ms = round((time.perf_counter() - start_total) * 1000, 2)

    return VisionPipelineResponse(
        status="success",
        image_metadata=ImageMetadata(
            filename=filename,
            format=orig_format,
            width=orig_width,
            height=orig_height,
            aspect_ratio=aspect_ratio_str,
            size_kb=size_kb,
            color_mode=orig_mode,
        ),
        processing_stats=ProcessingStats(
            preprocessing_time_ms=prep_time_ms,
            detection_time_ms=det_time_ms,
            ocr_time_ms=ocr_time_ms,
            matching_time_ms=match_time_ms,
            total_pipeline_time_ms=total_time_ms,
        ),
        detected_objects_count=len(detected_objects),
        detected_text_count=len(detected_texts),
        matched_products_count=len(matched_products),
        detected_objects=detected_objects,
        detected_text_and_prices=detected_texts,
        matched_products=matched_products,
    )
