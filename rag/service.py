"""
rag/service.py
--------------
Singleton service wrapper for RAG knowledge operations.
"""

from typing import Optional, Dict, Any, List
from rag.ingestion.ingest import KnowledgeIngestor, IngestionStats
from rag.retrieval.retriever import GroundedRetriever, RetrievedResult
from rag.chains.qa_chain import RAGKnowledgeChain, RAGAnswer


class RAGService:
    """Central singleton service orchestrating RAG operations across PriceMind AI."""

    def __init__(self):
        self.ingestor = KnowledgeIngestor()
        self.retriever = GroundedRetriever(ingestor=self.ingestor)
        self.qa_chain = RAGKnowledgeChain(retriever=self.retriever)
        self._initialized = False

    def initialize(self, force_reindex: bool = False) -> IngestionStats:
        """Trigger indexing of the knowledge repository."""
        stats = self.ingestor.ingest(force_reindex=force_reindex)
        self._initialized = True
        return stats

    def query(
        self,
        question: str,
        category_filter: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> RAGAnswer:
        """Execute grounded QA query."""
        if not self._initialized:
            self.initialize()
        return self.qa_chain.query(question=question, category_filter=category_filter, top_k=top_k)

    def retrieve_chunks(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> List[RetrievedResult]:
        """Execute semantic retrieval only."""
        if not self._initialized:
            self.initialize()
        return self.retriever.retrieve(query=query, category=category, top_k=top_k)

    def get_status(self) -> Dict[str, Any]:
        """Get index telemetry and knowledge base status."""
        if not self._initialized:
            self.initialize()

        chunks = self.ingestor.get_indexed_chunks()
        categories = sorted(list({c.metadata.get("category", "general") for c in chunks}))
        files = sorted(list({c.metadata.get("file_name", "") for c in chunks}))

        return {
            "status": "active" if len(chunks) > 0 else "empty",
            "total_documents": len(files),
            "total_chunks": len(chunks),
            "categories": categories,
            "indexed_files": files,
            "embedding_provider": type(self.ingestor.embedding_provider).__name__,
            "last_stats": self.ingestor.last_stats.to_dict() if self.ingestor.last_stats else None,
        }


# Global singleton instance
rag_service = RAGService()
