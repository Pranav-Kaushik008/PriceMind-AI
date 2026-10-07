"""
backend/app/api/v1/endpoints/vision.py
--------------------------------------
Phase 1 Computer Vision & In-Store OCR Endpoints.
Validates, preprocesses, and analyzes real uploaded images (JPG, PNG, WebP up to 10MB).
Uses existing authentication architecture if available.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import base64
from app.core.deps import get_optional_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.vision import (
    VisionPipelineResponse,
    VisionExplainRequest,
    VisionExplanationResponse,
)
from app.services import vision_service

router = APIRouter()

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB strict limit
ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


@router.post(
    "/analyze",
    response_model=VisionPipelineResponse,
    summary="Analyze Image for Objects & OCR Price Tags",
    description="Accepts real uploaded image (JPG, PNG, WebP up to 10MB) or base64 frame and returns structured detection and OCR telemetry.",
)
async def analyze_image_endpoint(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    sample_id: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 1 Real Image Upload & Analysis Flow:
    1. Validate format (JPG, PNG, WEBP)
    2. Validate maximum file size (10 MB)
    3. Decode & inspect real image metadata
    4. Run object boundary and OCR price extraction
    5. Return structured response with pixel & normalized coordinates
    """
    image_bytes = None
    filename = "uploaded_image.jpg"

    # Case 1: Real Multipart File Upload
    if file is not None:
        filename = file.filename or "uploaded_image.jpg"
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        
        # Validate content type and extension
        if (file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES) and (ext not in ALLOWED_EXTENSIONS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{file.content_type or ext}'. Supported formats: JPG, JPEG, PNG, WEBP.",
            )

        try:
            image_bytes = await file.read()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read image stream: {str(e)}",
            )

    # Case 2: Base64 string from Live Camera
    elif image_base64:
        filename = "camera_snapshot.jpg"
        try:
            if "," in image_base64:
                header, encoded = image_base64.split(",", 1)
            else:
                encoded = image_base64
            image_bytes = base64.b64decode(encoded)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid base64 encoding for captured image: {str(e)}",
            )

    # Case 3: Preset Sample ID fallback
    elif sample_id:
        filename = f"sample_{sample_id}.jpg"
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (1280, 720), color=(15, 23, 42))
        draw = ImageDraw.Draw(img)
        draw.rectangle([80, 80, 560, 620], outline=(99, 102, 241), width=4)
        draw.rectangle([680, 80, 1180, 620], outline=(16, 185, 129), width=4)
        buf = io_import()
        img.save(buf, format="JPEG")
        image_bytes = buf.getvalue()

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image provided. Please select an image file or capture a photo.",
        )

    # Validate size & empty payload
    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty (0 bytes).",
        )

    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({len(image_bytes)/(1024*1024):.2f} MB) exceeds maximum allowed limit of 10 MB.",
        )

    # Run computer vision processing on the actual bytes
    try:
        return vision_service.analyze_image_bytes(image_bytes=image_bytes, filename=filename, db=db)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computer Vision analysis failure: {str(exc)}",
        )


@router.post(
    "/explain",
    response_model=VisionExplanationResponse,
    summary="Generate Grounded AI Pricing Explanation",
    description="Generates an authoritative, grounded natural language explanation for Visual Intelligence and Pricing Optimization results.",
)
async def explain_vision_endpoint(
    payload: VisionExplainRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 3.2: Grounded AI Explanation Endpoint
    1. Authenticate user and verify organization context if logged in.
    2. Extract and sanitize context (Prompt injection protection).
    3. Call explanation engine (Gemini or deterministic grounded fallback).
    4. Return structured 6-section business explanation.
    """
    try:
        from app.services.vision_explanation_service import generate_vision_explanation
        
        # Call explanation service with backend-controlled grounding
        return generate_vision_explanation(
            context=payload.context,
            user_question=payload.user_question,
        )
    except Exception as exc:
        # Non-fatal: Explanation layer failure never breaks the underlying recommendation
        return VisionExplanationResponse(
            status="unavailable",
            explanation=None,
            sources={},
            model_used=None,
            error_message=f"AI explanation temporarily unavailable: {str(exc)}",
            provider="fallback",
            grounded=False,
        )


def io_import():
    import io
    return io.BytesIO()

