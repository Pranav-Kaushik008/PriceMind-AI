"""
rag/retrieval/retriever.py
--------------------------
Semantic retrieval engine with metadata filtering and relevance scoring.
"""

from typing import List, Optional, Tuple, Dict, Any
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore

from rag.config import rag_config
from rag.ingestion.ingest import KnowledgeIngestor


class RetrievedResult:
    """Encapsulates a single retrieved chunk with score and citation metadata."""

    def __init__(self, document: Document, score: float):
        self.document = document
        self.score = round(float(score), 4)

    @property
    def content(self) -> str:
        return self.document.page_content

    @property
    def metadata(self) -> Dict[str, Any]:
        return self.document.metadata

    @property
    def source_file(self) -> str:
        return self.metadata.get("relative_path", self.metadata.get("file_name", "unknown"))

    @property
    def section_title(self) -> str:
        return self.metadata.get("section_title", "General")

    @property
    def category(self) -> str:
        return self.metadata.get("category", "general")

    @property
    def chunk_id(self) -> str:
        return self.metadata.get("chunk_id", "chunk_000")

    def to_citation_dict(self) -> Dict[str, Any]:
        snippet = self.content[:240].replace("\n", " ").strip()
        if len(self.content) > 240:
            snippet += "..."
        return {
            "chunk_id": self.chunk_id,
            "source_file": self.source_file,
            "section": self.section_title,
            "category": self.category,
            "relevance_score": self.score,
            "snippet": snippet,
        }


class GroundedRetriever:
    """
    Retrieves grounded knowledge chunks using vector similarity and metadata filtering.
    """

    def __init__(
        self,
        ingestor: Optional[KnowledgeIngestor] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None,
    ):
        self.ingestor = ingestor or KnowledgeIngestor()
        self.top_k = top_k or rag_config.top_k
        self.similarity_threshold = similarity_threshold if similarity_threshold is not None else rag_config.similarity_threshold

    def retrieve(
        self,
        query: str,
        category: Optional[str] = None,
        document_type: Optional[str] = None,
        top_k: Optional[int] = None,
        threshold: Optional[float] = None,
    ) -> List[RetrievedResult]:
        """
        Execute semantic retrieval with optional category/document_type filters.
        """
        k = top_k or self.top_k
        thresh = threshold if threshold is not None else self.similarity_threshold
        vector_store = self.ingestor.get_vector_store()

        # Query vector store with similarity scores
        # Note: InMemoryVectorStore.similarity_search_with_score returns (Document, score)
        # where score is cosine similarity or distance depending on metric
        raw_results = vector_store.similarity_search_with_score(query, k=k * 2)

        results: List[RetrievedResult] = []
        for doc, raw_score in raw_results:
            # Normalize raw score to [0, 1] range if needed
            score = float(raw_score)
            if score < 0:
                score = max(0.0, score + 1.0)
            elif score > 1.0:
                score = 1.0 / (1.0 + score)

            # Apply metadata filters
            if category and doc.metadata.get("category", "").lower() != category.lower():
                continue
            if document_type and doc.metadata.get("document_type", "").lower() != document_type.lower():
                continue

            if score >= thresh:
                results.append(RetrievedResult(doc, score))

            if len(results) >= k:
                break

        return results

    def format_context(self, retrieved: List[RetrievedResult]) -> str:
        """Format retrieved chunks into a clean, source-attributed context block."""
        if not retrieved:
            return "No relevant knowledge context found."

        context_blocks = []
        for idx, res in enumerate(retrieved, start=1):
            block = (
                f"[Document {idx} | Source: {res.source_file} | Section: {res.section_title} | "
                f"Category: {res.category} | Relevance: {res.score:.2f}]\n"
                f"{res.content}\n"
            )
            context_blocks.append(block)

        return "\n---\n".join(context_blocks)
