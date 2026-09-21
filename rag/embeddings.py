"""
rag/embeddings.py
-----------------
Embedding providers for the PriceMind AI RAG system.
Complies with langchain_core.embeddings.Embeddings interface.
"""

from typing import List, Optional
import numpy as np
import hashlib
from langchain_core.embeddings import Embeddings


class FastTFIDFEmbeddings(Embeddings):
    """
    Lightweight, deterministic TF-IDF embedding provider using scikit-learn.
    Requires zero external API calls or large model downloads.
    """

    def __init__(self, max_features: int = 2048):
        from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
        custom_stop_words = list(ENGLISH_STOP_WORDS.union({"pricemind", "ai", "overview", "welcome", "repository"}))
        self.max_features = max_features
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=(1, 2),
            stop_words=custom_stop_words,
            norm="l2",
            sublinear_tf=True,
        )
        self._is_fitted = False
        self._corpus: List[str] = []

    def fit(self, texts: List[str]):
        """Fit the TF-IDF vocabulary on domain texts."""
        if not texts:
            texts = ["pricemind dynamic pricing elasticity optimization forecasting shap"]
        self._corpus = texts
        self.vectorizer.fit(texts)
        self._is_fitted = True

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of document strings."""
        if not self._is_fitted:
            self.fit(texts)
        matrix = self.vectorizer.transform(texts)
        arr = matrix.toarray().astype(np.float32)
        # Ensure rows are never all zeros
        for i in range(len(arr)):
            norm = np.linalg.norm(arr[i])
            if norm == 0 or np.isnan(norm):
                arr[i] = np.ones(arr.shape[1], dtype=np.float32) / np.sqrt(arr.shape[1])
            else:
                arr[i] = arr[i] / norm
        return arr.tolist()

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query string."""
        if not self._is_fitted:
            self.fit([text, "pricing policy elasticity demand optimization forecasting"])
        vec = self.vectorizer.transform([text]).toarray()[0].astype(np.float32)
        norm = np.linalg.norm(vec)
        if norm == 0 or np.isnan(norm):
            vec = np.ones(len(vec), dtype=np.float32) / np.sqrt(len(vec))
        else:
            vec = vec / norm
        return vec.tolist()


class DeterministicHashEmbeddings(Embeddings):
    """
    Fast SHA-256 / ngram token hash embedding provider for ultra-fast deterministic testing.
    """

    def __init__(self, dimension: int = 128):
        self.dimension = dimension

    def _hash_text(self, text: str) -> List[float]:
        vec = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().split()
        if not words:
            return (np.ones(self.dimension, dtype=np.float32) / np.sqrt(self.dimension)).tolist()

        for word in words:
            h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            idx = h % self.dimension
            val = ((h >> 8) % 1000) / 1000.0 - 0.5
            vec[idx] += val

        norm = np.linalg.norm(vec)
        if norm == 0 or np.isnan(norm):
            vec = np.ones(self.dimension, dtype=np.float32) / np.sqrt(self.dimension)
        else:
            vec = vec / norm
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._hash_text(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._hash_text(text)



def get_embedding_provider(provider_type: Optional[str] = None) -> Embeddings:
    """
    Factory function returning the configured LangChain Embeddings provider.
    """
    from rag.config import rag_config

    provider = (provider_type or rag_config.embedding_provider).lower()

    if provider in ("tfidf", "sklearn"):
        return FastTFIDFEmbeddings()
    elif provider in ("hash", "deterministic"):
        return DeterministicHashEmbeddings()
    elif provider in ("huggingface", "sentence_transformers"):
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            return HuggingFaceEmbeddings(model_name=rag_config.embedding_model_name)
        except Exception:
            return FastTFIDFEmbeddings()
    elif provider == "openai":
        try:
            from langchain_community.embeddings import OpenAIEmbeddings
            return OpenAIEmbeddings()
        except Exception:
            return FastTFIDFEmbeddings()
    else:
        return FastTFIDFEmbeddings()
