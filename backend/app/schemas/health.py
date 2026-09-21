"""
backend/app/schemas/health.py
-----------------------------
Health check schemas.
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: str
    database: str
    version: str
    environment: str
    database_backend: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
