"""
backend/app/main.py
-------------------
Main FastAPI application entry point for PriceMind AI.
"""

import sys
from pathlib import Path

# Ensure project root is available in sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
for _p in [str(_PROJECT_ROOT), str(_BACKEND_ROOT)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.api import api_router

setup_logging()
logger = logging.getLogger("pricemind.api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Dynamic Pricing, Forecasting, Demand Optimization, and Explainable AI Engine.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = (time.time() - start_time) * 1000.0

    # Log structured request telemetry without sensitive payload parameters
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({duration:.1f}ms)"
    )
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=False)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred. Please contact system administrator."},
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["System"])
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
