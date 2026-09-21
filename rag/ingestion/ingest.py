"""
rag/ingestion/ingest.py
-----------------------
End-to-end ingestion pipeline for indexing PriceMind AI knowledge repositories.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, UTC
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore

from rag.config import rag_config
from rag.embeddings import get_embedding_provider, FastTFIDFEmbeddings
from rag.ingestion.loaders import MarkdownKnowledgeLoader
from rag.ingestion.splitter import KnowledgeSplitter
from rag.ingestion.metadata import MetadataEnricher, DocumentHasher


class IngestionStats:
    """Telemetry data capturing ingestion execution stats."""

    def __init__(self):
        self.documents_loaded: int = 0
        self.chunks_generated: int = 0
        self.categories_indexed: List[str] = []
        self.total_tokens_approx: int = 0
        self.started_at: str = datetime.now(UTC).isoformat()
        self.completed_at: Optional[str] = None
        self.hashes_seen: set = set()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "documents_loaded": self.documents_loaded,
            "chunks_generated": self.chunks_generated,
            "categories_indexed": self.categories_indexed,
            "total_tokens_approx": self.total_tokens_approx,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
        }


class KnowledgeIngestor:
    """Manages full knowledge repository ingestion and index construction."""

    def __init__(
        self,
        knowledge_dir: Optional[Path] = None,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
        embedding_provider_name: Optional[str] = None,
    ):
        self.knowledge_dir = Path(knowledge_dir or rag_config.knowledge_dir)
        self.chunk_size = chunk_size or rag_config.chunk_size
        self.chunk_overlap = chunk_overlap or rag_config.chunk_overlap
        self.embedding_provider = get_embedding_provider(embedding_provider_name)

        self.loader = MarkdownKnowledgeLoader(self.knowledge_dir)
        self.splitter = KnowledgeSplitter(self.chunk_size, self.chunk_overlap)
        self.vector_store: Optional[InMemoryVectorStore] = None
        self.indexed_chunks: List[Document] = []
        self.last_stats: Optional[IngestionStats] = None

    def ingest(self, force_reindex: bool = False) -> IngestionStats:
        """Run the complete ingestion pipeline."""
        stats = IngestionStats()

        # 1. Load documents
        raw_docs = self.loader.load()
        stats.documents_loaded = len(raw_docs)

        if not raw_docs:
            stats.completed_at = datetime.utcnow().isoformat()
            self.last_stats = stats
            return stats

        # 2. Split documents into chunks
        raw_chunks = self.splitter.split_documents(raw_docs)

        # 3. Enrich chunks and deduplicate
        enriched_chunks = MetadataEnricher.enrich_chunks(raw_chunks)
        unique_chunks: List[Document] = []
        seen_hashes = set()

        for chunk in enriched_chunks:
            h = chunk.metadata.get("content_hash")
            if h not in seen_hashes:
                seen_hashes.add(h)
                unique_chunks.append(chunk)

        stats.chunks_generated = len(unique_chunks)
        stats.total_tokens_approx = sum(c.metadata.get("word_count", 0) for c in unique_chunks)
        stats.categories_indexed = sorted(list({c.metadata.get("category", "general") for c in unique_chunks}))

        # 4. Prepare Embeddings & Vector Store
        corpus_texts = [c.page_content for c in unique_chunks]
        if isinstance(self.embedding_provider, FastTFIDFEmbeddings):
            self.embedding_provider.fit(corpus_texts)

        # Create InMemoryVectorStore using LangChain
        self.vector_store = InMemoryVectorStore.from_documents(
            documents=unique_chunks,
            embedding=self.embedding_provider,
        )

        self.indexed_chunks = unique_chunks
        stats.completed_at = datetime.now(UTC).isoformat()
        self.last_stats = stats
        return stats

    def get_indexed_chunks(self) -> List[Document]:
        """Return all currently indexed chunk documents."""
        return self.indexed_chunks

    def get_vector_store(self) -> InMemoryVectorStore:
        """Return the active vector store instance, initializing if needed."""
        if self.vector_store is None:
            self.ingest()
        return self.vector_store
