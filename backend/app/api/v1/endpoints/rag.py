"""
backend/app/api/v1/endpoints/rag.py
-----------------------------------
FastAPI endpoints for RAG semantic search, grounded QA, and index lifecycle (Module 11).
"""

from fastapi import APIRouter, HTTPException, status
from rag.service import rag_service
from app.schemas.rag import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGRetrieveRequest,
    RAGRetrieveResponse,
    RAGStatusResponse,
    RetrievedChunkSchema,
    CitationSchema,
)

router = APIRouter()


@router.post("/query", response_model=RAGQueryResponse, summary="Execute Grounded RAG Query")
def query_rag_knowledge(payload: RAGQueryRequest):
    """
    Answers user pricing, policy, and modeling questions grounded strictly in
    curated enterprise knowledge docs, returning verified citations.
    """
    try:
        rag_answer = rag_service.query(
            question=payload.query,
            category_filter=payload.category_filter,
            top_k=payload.top_k,
        )

        return RAGQueryResponse(
            query=rag_answer.query,
            answer=rag_answer.answer,
            citations=[CitationSchema(**c) for c in rag_answer.citations],
            retrieved_chunks_count=rag_answer.retrieved_chunks_count,
            confidence_score=rag_answer.confidence_score,
            is_grounded=rag_answer.is_grounded,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query execution failed: {str(e)}",
        )


@router.post("/retrieve", response_model=RAGRetrieveResponse, summary="Retrieve Relevant Knowledge Chunks")
def retrieve_knowledge_chunks(payload: RAGRetrieveRequest):
    """
    Performs raw semantic retrieval over the knowledge base and returns matching chunks with scores.
    """
    try:
        retrieved_list = rag_service.retrieve_chunks(
            query=payload.query,
            category=payload.category_filter,
            top_k=payload.top_k,
        )

        chunks = [
            RetrievedChunkSchema(
                chunk_id=r.chunk_id,
                source_file=r.source_file,
                category=r.category,
                section_title=r.section_title,
                content=r.content,
                similarity_score=r.score,
            )
            for r in retrieved_list
        ]

        return RAGRetrieveResponse(
            query=payload.query,
            total_retrieved=len(chunks),
            chunks=chunks,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval failed: {str(e)}",
        )


@router.get("/status", response_model=RAGStatusResponse, summary="Knowledge Base Index Status")
def get_rag_status():
    """
    Returns telemetry on indexed documents, total chunks, categories, and embedding provider.
    """
    try:
        status_data = rag_service.get_status()
        return RAGStatusResponse(**status_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch RAG status: {str(e)}",
        )


@router.post("/reindex", response_model=RAGStatusResponse, summary="Reindex Knowledge Base")
def reindex_knowledge():
    """
    Triggers a full re-indexing of all Markdown documents in the knowledge repository.
    """
    try:
        rag_service.initialize(force_reindex=True)
        status_data = rag_service.get_status()
        return RAGStatusResponse(**status_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reindexing failed: {str(e)}",
        )
