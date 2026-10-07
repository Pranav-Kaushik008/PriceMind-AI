"""
backend/app/schemas/vision.py
-----------------------------
Pydantic schemas for Visual Intelligence & Computer Vision Module.
Structured schemas for image processing, object detection, OCR extraction, and product catalog matching.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BoundingBoxCoordinates(BaseModel):
    x_percent: float = Field(..., description="Left coordinate as percentage (0-100)")
    y_percent: float = Field(..., description="Top coordinate as percentage (0-100)")
    width_percent: float = Field(..., description="Width as percentage (0-100)")
    height_percent: float = Field(..., description="Height as percentage (0-100)")
    x_px: Optional[int] = Field(None, description="Left coordinate in pixels")
    y_px: Optional[int] = Field(None, description="Top coordinate in pixels")
    width_px: Optional[int] = Field(None, description="Width in pixels")
    height_px: Optional[int] = Field(None, description="Height in pixels")


class DetectedObject(BaseModel):
    id: str
    label: str
    confidence: float
    box: BoundingBoxCoordinates
    attributes: Optional[Dict[str, Any]] = None


class DetectedTextLabel(BaseModel):
    id: str
    raw_text: str
    extracted_price: Optional[float] = None
    currency_symbol: Optional[str] = None
    confidence: float
    box: BoundingBoxCoordinates
    is_price_tag: bool = False


class MatchedProductInfo(BaseModel):
    product_id: str
    sku: str
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    current_price: Optional[float] = None


class ProductMatchResult(BaseModel):
    detected_object_id: Optional[str] = None
    detected_label: str
    matched_product: Optional[MatchedProductInfo] = None
    match_confidence: float = 0.0
    match_status: str = "unmatched"  # "matched" | "possible_match" | "unmatched"
    match_reason: Optional[str] = None


class CompetitorInfo(BaseModel):
    competitor_name: Optional[str] = None  # None or competitor name like "Amazon", "Walmart", "Best Buy", etc.
    is_identified: bool = False
    detected_price: Optional[float] = None
    currency_symbol: str = "₹"
    raw_price_text: Optional[str] = None
    promotion: Optional[str] = None  # e.g. "20% OFF", "Save $50", "Sale"
    availability: Optional[str] = None  # e.g. "In Stock", "Out of Stock"
    detection_confidence: float = 0.0
    ocr_tag_id: Optional[str] = None
    box: Optional[BoundingBoxCoordinates] = None


class CompetitorComparisonResult(BaseModel):
    id: str
    product_id: Optional[str] = None
    sku: Optional[str] = None
    product_name: str
    detected_label: str
    match_status: str = "unmatched"  # "matched" | "possible_match" | "unmatched"
    match_confidence: float = 0.0
    your_price: Optional[float] = None  # Retrieved from PriceMind DB
    competitor_price: Optional[float] = None  # Detected from image
    currency_symbol: str = "₹"
    price_difference: Optional[float] = None  # your_price - competitor_price
    price_difference_percent: Optional[float] = None  # ((your_price - competitor_price) / competitor_price) * 100
    comparison_status: str = "no_comparison"  # "lower_than_competitor" | "similar_to_competitor" | "higher_than_competitor" | "no_price_detected" | "unmatched_product"
    status_label: str = "No Price Detected"  # Human-readable status indicator
    competitor_info: CompetitorInfo
    your_price_provenance: str = "Retrieved from PriceMind database"
    competitor_price_provenance: str = "Detected from image"


class ImageMetadata(BaseModel):
    filename: str
    format: str
    width: int
    height: int
    aspect_ratio: str
    size_kb: float
    color_mode: str


class ProcessingStats(BaseModel):
    preprocessing_time_ms: float
    detection_time_ms: float
    ocr_time_ms: float
    matching_time_ms: float = 0.0
    competitor_intelligence_time_ms: float = 0.0
    total_pipeline_time_ms: float


class VisionPipelineResponse(BaseModel):
    status: str
    image_metadata: ImageMetadata
    processing_stats: ProcessingStats
    detected_objects_count: int
    detected_text_count: int
    matched_products_count: int = 0
    competitor_insights_count: int = 0
    detected_objects: List[DetectedObject] = []
    detected_text_and_prices: List[DetectedTextLabel] = []
    matched_products: List[ProductMatchResult] = []
    competitor_intelligence: List[CompetitorComparisonResult] = []
