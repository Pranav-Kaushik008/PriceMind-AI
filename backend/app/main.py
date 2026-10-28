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
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.api import api_router
from app.db.session import engine, Base
import app.models  # ensure all models registered

setup_logging()
logger = logging.getLogger("pricemind.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to auto-initialize database tables on startup and seed initial catalog."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Auto-seed database if empty
        try:
            from app.db.session import SessionLocal
            from app.models.product import Product
            with SessionLocal() as db_session:
                prod_count = db_session.query(Product).count()
                if prod_count == 0:
                    logger.info("Database empty, running initial seed...")
                    from app.db.seed import seed_development_data
                    seed_development_data(db_session)
                    logger.info("Database successfully seeded with catalog data.")
        except Exception as seed_err:
            logger.warning(f"Database seed note: {seed_err}")
    except Exception as exc:
        logger.warning(f"Database table initialization warning: {exc}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Dynamic Pricing, Forecasting, Demand Optimization, and Explainable AI Engine.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.onrender\.com|.*\.vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Allow large JSON payloads (up to 50 MB) — needed for bulk CSV imports on Render
# Render's reverse proxy has a 100 MB limit; this middleware is belt-and-suspenders.
class LargeBodyMiddleware(BaseHTTPMiddleware):
    MAX_BODY = 50 * 1024 * 1024  # 50 MB

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.MAX_BODY:
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"Request body too large. Maximum allowed is 50 MB."},
                )
        return await call_next(request)

app.add_middleware(LargeBodyMiddleware)


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


@app.get("/health", tags=["System"])
def health():
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }

