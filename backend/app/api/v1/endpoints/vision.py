"""
backend/app/api/v1/endpoints/vision.py
--------------------------------------
Phase 1 Computer Vision & In-Store OCR Endpoints.
Provides image ingestion, live camera stream processing, object detection, and OCR extraction.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Optional
import base64

from app.schemas.vision import VisionPipelineResponse
from app.services import vision_service

router = APIRouter()

MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit


@router.post(
    "/analyze",
    response_model=VisionPipelineResponse,
    summary="Phase 1 Computer Vision & OCR Analysis",
    description="Upload an image or send a base64 webcam frame to detect objects and extract OCR price tags.",
)
async def analyze_image_endpoint(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    sample_id: Optional[str] = Form(None),
):
    """
    Phase 1 Computer Vision Endpoint:
    - Accepts uploaded file or base64 webcam snapshot
    - Preprocesses image
    - Runs object boundary detection
    - Runs OCR text and price extraction
    - Returns structured detection telemetry
    """
    image_bytes = None
    filename = "snapshot.jpg"

    # Case 1: Uploaded file
    if file is not None:
        filename = file.filename or "uploaded_image.jpg"
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{file.content_type}'. Please upload an image file (JPG, PNG, WebP).",
            )
        try:
            image_bytes = await file.read()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read uploaded image stream: {str(e)}",
            )

    # Case 2: Base64 data URI from webcam capture
    elif image_base64:
        filename = "live_camera_capture.jpg"
        try:
            # Strip data URI header if present (e.g. 'data:image/jpeg;base64,...')
            if "," in image_base64:
                header, encoded = image_base64.split(",", 1)
            else:
                encoded = image_base64
            image_bytes = base64.b64decode(encoded)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid base64 image encoding: {str(e)}",
            )

    # Case 3: Preset sample fallback
    elif sample_id:
        filename = f"sample_{sample_id}.jpg"
        # Generate clean synthetic test image bytes with Pillow
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (1280, 720), color=(15, 23, 42))
        draw = ImageDraw.Draw(img)
        draw.rectangle([100, 100, 500, 600], outline=(99, 102, 241), width=4)
        draw.rectangle([700, 100, 1100, 600], outline=(16, 185, 129), width=4)
        buf = io_buffer = io_import()
        img.save(buf, format="JPEG")
        image_bytes = buf.getvalue()

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image provided. Please upload a file, capture a camera frame, or select a sample.",
        )

    # Validate image size
    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty (0 bytes).",
        )

    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size ({len(image_bytes)/(1024*1024):.1f} MB) exceeds maximum allowed limit of 15 MB.",
        )

    # Run computer vision processing
    try:
        result = vision_service.analyze_image_bytes(image_bytes=image_bytes, filename=filename)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vision processing pipeline failure: {str(exc)}",
        )


def io_import():
    import io
    return io.BytesIO()
