"""
backend/app/schemas/rag.py
--------------------------
Pydantic v2 schemas for RAG knowledge endpoints in PriceMind AI.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CitationSchema(BaseModel):
    chunk_id: str = Field(..., description="Unique chunk identifier")
    source_file: str = Field(..., description="Relative path of the source document")
    section: str = Field(..., description="Section or header name where chunk appears")
    category: str = Field(..., description="Knowledge domain category")
    relevance_score: float = Field(..., description="Similarity relevance score between 0 and 1")
    snippet: str = Field(..., description="Text excerpt from the source chunk")


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Natural language question to ask")
    category_filter: Optional[str] = Field(None, description="Optional category filter (e.g. pricing, models)")
    top_k: Optional[int] = Field(4, ge=1, le=10, description="Max number of chunks to retrieve")


class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[CitationSchema]
    retrieved_chunks_count: int
    confidence_score: float
    is_grounded: bool


class RAGRetrieveRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Search query")
    category_filter: Optional[str] = Field(None, description="Optional category filter")
    top_k: Optional[int] = Field(5, ge=1, le=20, description="Number of results to retrieve")


class RetrievedChunkSchema(BaseModel):
    chunk_id: str
    source_file: str
    category: str
    section_title: str
    content: str
    similarity_score: float


class RAGRetrieveResponse(BaseModel):
    query: str
    total_retrieved: int
    chunks: List[RetrievedChunkSchema]


class RAGStatusResponse(BaseModel):
    status: str
    total_documents: int
    total_chunks: int
    categories: List[str]
    indexed_files: List[str]
    embedding_provider: str
    last_stats: Optional[Dict[str, Any]] = None
