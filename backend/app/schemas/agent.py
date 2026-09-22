"""
backend/app/schemas/agent.py
-----------------------------
Request/Response schemas for the Module 12 AI Agent endpoint.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentQueryRequest(BaseModel):
    """Request body for POST /api/v1/agent/query."""
    message: str = Field(
        description="Natural language question or instruction for the pricing agent.",
        min_length=1,
        max_length=2000,
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session identifier for future conversation threading.",
    )


class AgentSource(BaseModel):
    """A knowledge base source document referenced in the agent's answer."""
    title: str = ""
    category: str = ""
    chunk_preview: str = ""
    similarity_score: Optional[float] = None


class AgentQueryResponse(BaseModel):
    """Response body for POST /api/v1/agent/query."""
    answer: str = Field(description="Grounded natural language response from the agent.")
    tools_used: List[str] = Field(
        default_factory=list,
        description="Names of the tools invoked to generate this answer.",
    )
    sources: List[AgentSource] = Field(
        default_factory=list,
        description="Knowledge base documents referenced in the answer.",
    )
    data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured tool result data keyed by tool name.",
    )
    session_id: Optional[str] = None
