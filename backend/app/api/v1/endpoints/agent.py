"""
backend/app/api/v1/endpoints/agent.py
--------------------------------------
FastAPI endpoint for the Module 12 AI Agent.

POST /api/v1/agent/query
  Body: { "message": "...", "session_id": null }
  Response: { "answer": "...", "tools_used": [...], "sources": [...], "data": {...} }
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Depends

from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.agent import AgentQueryRequest, AgentQueryResponse, AgentSource
from agent.agent import get_agent

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/query", response_model=AgentQueryResponse, summary="Query the PriceMind AI pricing agent")
def query_agent(
    payload: AgentQueryRequest,
    current_user: User = Depends(get_current_active_user),
) -> AgentQueryResponse:
    """
    Send a natural language question to the PriceMind AI pricing agent.

    The agent will:
    1. Classify the intent of the question.
    2. Call the appropriate tools (product lookup, elasticity, forecast, simulation,
       optimization, SHAP explanation, knowledge base).
    3. Synthesise a grounded answer using only data returned by the tools.

    **Safety**: The agent will NOT autonomously apply price changes, approve
    recommendations, or modify any data. All recommendations have status='pending'
    and require human review.
    """
    try:
        agent = get_agent()
        result = agent.query(message=payload.message, session_id=payload.session_id)

        sources = [
            AgentSource(
                title=s.get("title", ""),
                category=s.get("category", ""),
                chunk_preview=s.get("chunk_preview", ""),
                similarity_score=s.get("similarity_score"),
            )
            for s in result.get("sources", [])
        ]

        return AgentQueryResponse(
            answer=result["answer"],
            tools_used=result.get("tools_used", []),
            sources=sources,
            data=result.get("data", {}),
            session_id=payload.session_id,
        )

    except Exception as exc:
        logger.error("[Agent endpoint] Unhandled error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent error: {exc}")
