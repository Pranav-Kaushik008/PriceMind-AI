import os
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Union, Any

SECRET_KEY = os.getenv("SECRET_KEY", "pricemind-enterprise-super-secure-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

def create_hash(data: str) -> str:
    """Generates SHA-256 cryptographic audit hash."""
    return hashlib.sha256(data.encode()).hexdigest()

def verify_token(token: str) -> bool:
    """Token signature validator placeholder."""
    return bool(token and len(token) > 10)
