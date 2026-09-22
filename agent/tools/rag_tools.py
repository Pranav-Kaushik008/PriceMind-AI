"""
agent/tools/rag_tools.py
-------------------------
LangChain tool wrapping rag_service (Module 11).
Tool: search_knowledge_base
"""

from __future__ import annotations

import json
from typing import Optional

from langchain_core.tools import tool

from rag.service import rag_service


@tool
def search_knowledge_base_tool(
    question: str,
    document_type: Optional[str] = None,
    top_k: int = 4,
) -> str:
    """
    Search the PriceMind AI knowledge base for pricing policies, methodology
    documentation, business constraints, and explainability guides.

    Args:
        question: Natural language question to search for.
        document_type: Optional filter — one of 'pricing', 'models', 'optimization',
                       'forecasting', 'explainability', 'data_dictionary'.
        top_k: Number of knowledge chunks to retrieve (default 4).

    Returns: JSON with the grounded answer, source documents, confidence score,
    and is_grounded flag.

    Use this for questions about company pricing policy, margin floor rules,
    methodology ("how does elasticity work?"), or model documentation.
    Do NOT use this for live product prices or current demand — use get_product
    or predict_demand instead.
    """
    try:
        top_k = max(1, min(top_k, 10))
        result = rag_service.query(
            question=question,
            category_filter=document_type,
            top_k=top_k,
        )
        sources = []
        for src in result.sources:
            sources.append({
                "title": src.get("title", ""),
                "category": src.get("category", ""),
                "chunk_preview": src.get("chunk_preview", ""),
                "similarity_score": src.get("similarity_score"),
            })
        return json.dumps({
            "answer": result.answer,
            "is_grounded": result.is_grounded,
            "confidence_score": result.confidence_score,
            "sources": sources,
            "query": question,
        })
    except Exception as exc:
        return json.dumps({"error": str(exc)})
