"""
backend/app/api/v1/endpoints/health.py
--------------------------------------
Health check endpoint.
"""

from fastapi import APIRouter, status
from app.db.session import check_db_connection
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="Service and Database Health Check")
@router.get("/", response_model=HealthResponse, include_in_schema=False)
def health_check():
    """Verify API status and database connectivity."""
    db_status = check_db_connection()
    is_ok = db_status.get("status") == "ok"

    return HealthResponse(
        status="healthy" if is_ok else "degraded",
        database="connected" if is_ok else f"disconnected ({db_status.get('detail', 'error')})",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database_backend=db_status.get("backend"),
    )
