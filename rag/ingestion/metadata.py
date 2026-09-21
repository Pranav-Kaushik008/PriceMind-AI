"""
rag/ingestion/metadata.py
-------------------------
Document hashing and metadata enrichment for PriceMind AI RAG system.
"""

import hashlib
from typing import Dict, Any, List
from langchain_core.documents import Document


class DocumentHasher:
    """Calculates deterministic cryptographic SHA-256 hashes for content deduplication."""

    @staticmethod
    def compute_content_hash(text: str) -> str:
        """Compute SHA-256 hex digest of normalized text."""
        normalized = " ".join(text.strip().split())
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    @staticmethod
    def compute_doc_hash(doc: Document) -> str:
        """Compute SHA-256 hex digest combining content and core metadata."""
        content_hash = DocumentHasher.compute_content_hash(doc.page_content)
        path = doc.metadata.get("relative_path", "")
        combined = f"{path}:{content_hash}"
        return hashlib.sha256(combined.encode("utf-8")).hexdigest()


class MetadataEnricher:
    """Enriches chunk metadata with taxonomic tags, word counts, and search keywords."""

    CATEGORY_KEYWORDS = {
        "pricing": ["margin", "floor", "markup", "discount", "cadence", "approval", "tier", "volatility", "map"],
        "models": ["xgboost", "r-squared", "rmse", "mae", "hyperparameter", "elasticity", "log-log", "ols", "hubber"],
        "optimization": ["slsqp", "profit_max", "revenue_max", "balanced", "constraint", "solver", "bounds"],
        "forecasting": ["sarimax", "holt-winters", "exponential smoothing", "horizon", "interval", "seasonality"],
        "explainability": ["shap", "shapley", "treeexplainer", "waterfall", "attribution", "additive"],
        "data_dictionary": ["lag", "rolling_mean", "price_ratio", "inventory_level", "is_weekend", "promoted"],
    }

    @classmethod
    def enrich_chunk(cls, chunk: Document) -> Document:
        """Add enriched tags, hash, and reading statistics to chunk metadata."""
        text = chunk.page_content
        meta = dict(chunk.metadata)

        meta["content_hash"] = DocumentHasher.compute_content_hash(text)
        meta["char_count"] = len(text)
        meta["word_count"] = len(text.split())

        # Taxonomic keyword matching
        category = meta.get("category", "").lower()
        keywords = cls.CATEGORY_KEYWORDS.get(category, [])
        matched_tags = [kw for kw in keywords if kw in text.lower()]
        meta["tags"] = matched_tags

        chunk.metadata = meta
        return chunk

    @classmethod
    def enrich_chunks(cls, chunks: List[Document]) -> List[Document]:
        """Enrich a list of document chunks."""
        return [cls.enrich_chunk(c) for c in chunks]
