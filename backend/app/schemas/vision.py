"""
backend/app/schemas/vision.py
-----------------------------
Pydantic schemas for Phase 1 Computer Vision & In-Store OCR Module.
Structured schemas strictly for image processing, object detection, and OCR extraction.
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
    total_pipeline_time_ms: float


class VisionPipelineResponse(BaseModel):
    status: str
    image_metadata: ImageMetadata
    processing_stats: ProcessingStats
    detected_objects_count: int
    detected_text_count: int
    detected_objects: List[DetectedObject]
    detected_text_and_prices: List[DetectedTextLabel]
