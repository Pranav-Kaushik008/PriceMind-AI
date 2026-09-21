"""
rag/config.py
-------------
Configuration settings for the PriceMind AI RAG knowledge system.
"""

import os
from pathlib import Path
from pydantic import BaseModel, Field


class RAGConfig(BaseModel):
    """Configuration for RAG knowledge ingestion and retrieval."""

    # Paths
    knowledge_dir: Path = Field(
        default_factory=lambda: Path(
            os.getenv("PRICEMIND_KNOWLEDGE_DIR", str(Path(__file__).resolve().parent.parent / "knowledge"))
        )
    )
    index_cache_path: Path = Field(
        default_factory=lambda: Path(
            os.getenv("PRICEMIND_INDEX_CACHE", str(Path(__file__).resolve().parent.parent / "rag" / ".rag_cache"))
        )
    )

    # Chunking
    chunk_size: int = Field(default=500, description="Target character count per chunk")
    chunk_overlap: int = Field(default=80, description="Overlap characters between chunks")

    # Retrieval
    top_k: int = Field(default=4, description="Default number of chunks to retrieve")
    similarity_threshold: float = Field(default=0.05, description="Minimum cosine similarity score")
    max_context_chars: int = Field(default=3000, description="Maximum total context length")

    # Embedding Provider ("tfidf", "huggingface", "openai", "deterministic")
    embedding_provider: str = Field(
        default_factory=lambda: os.getenv("RAG_EMBEDDING_PROVIDER", "tfidf").lower()
    )
    embedding_model_name: str = Field(
        default_factory=lambda: os.getenv("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    )

    # LLM Provider ("mock", "openai", "anthropic", "gemini")
    llm_provider: str = Field(
        default_factory=lambda: os.getenv("RAG_LLM_PROVIDER", "mock").lower()
    )
    llm_model_name: str = Field(
        default_factory=lambda: os.getenv("RAG_LLM_MODEL", "gpt-4o-mini")
    )
    temperature: float = Field(default=0.0, description="Temperature for generation")

    # Strict Grounding Flag
    strict_grounding: bool = Field(
        default=True,
        description="Refuse to answer or fabricate if relevant knowledge is not retrieved",
    )


# Default singleton config instance
rag_config = RAGConfig()
