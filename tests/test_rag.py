"""
tests/test_rag.py
-----------------
Comprehensive unit and integration tests for Module 11: LangChain + RAG Knowledge System.
"""

import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app
from rag.config import RAGConfig, rag_config
from rag.embeddings import FastTFIDFEmbeddings, DeterministicHashEmbeddings, get_embedding_provider
from rag.ingestion.loaders import MarkdownKnowledgeLoader
from rag.ingestion.splitter import KnowledgeSplitter
from rag.ingestion.metadata import DocumentHasher, MetadataEnricher
from rag.ingestion.ingest import KnowledgeIngestor
from rag.retrieval.retriever import GroundedRetriever
from rag.chains.prompts import build_rag_prompt, RAG_SYSTEM_INSTRUCTION
from rag.chains.qa_chain import RAGKnowledgeChain, GroundedSynthesizer
from rag.service import RAGService, rag_service


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def initialized_service():
    rag_service.initialize(force_reindex=True)
    return rag_service


# ── 1. Ingestion & Loader Tests ──────────────────────────────────────────────
def test_markdown_loader():
    knowledge_dir = rag_config.knowledge_dir
    loader = MarkdownKnowledgeLoader(knowledge_dir)
    docs = loader.load()

    assert len(docs) >= 8, f"Expected at least 8 markdown docs, found {len(docs)}"
    for doc in docs:
        assert doc.page_content, "Document content should not be empty"
        assert "title" in doc.metadata, "Metadata should contain title"
        assert "category" in doc.metadata, "Metadata should contain category"
        assert "source" in doc.metadata, "Metadata should contain source file path"


def test_markdown_loader_frontmatter_parsing():
    sample = """---
title: Test Document
category: pricing
document_type: policy
---

# Heading 1
Some policy text here.
"""
    meta, body = MarkdownKnowledgeLoader.parse_frontmatter(sample)
    assert meta.get("title") == "Test Document"
    assert meta.get("category") == "pricing"
    assert meta.get("document_type") == "policy"
    assert "# Heading 1" in body


# ── 2. Splitter & Metadata Enrichment Tests ──────────────────────────────────
def test_knowledge_splitter():
    loader = MarkdownKnowledgeLoader(rag_config.knowledge_dir)
    docs = loader.load()
    splitter = KnowledgeSplitter(chunk_size=400, chunk_overlap=60)
    chunks = splitter.split_documents(docs)

    assert len(chunks) > len(docs), "Chunking should produce more chunks than documents"
    for chunk in chunks:
        assert len(chunk.page_content) > 0
        assert "section_title" in chunk.metadata
        assert "chunk_id" in chunk.metadata


def test_document_hasher_and_enrichment():
    loader = MarkdownKnowledgeLoader(rag_config.knowledge_dir)
    docs = loader.load()
    splitter = KnowledgeSplitter(chunk_size=400, chunk_overlap=60)
    chunks = splitter.split_documents(docs)

    enriched = MetadataEnricher.enrich_chunks(chunks)
    assert len(enriched) == len(chunks)

    first = enriched[0]
    assert "content_hash" in first.metadata
    assert len(first.metadata["content_hash"]) == 64  # SHA-256 hex length
    assert "char_count" in first.metadata
    assert "word_count" in first.metadata
    assert first.metadata["char_count"] > 0


# ── 3. Embeddings Tests ───────────────────────────────────────────────────────
def test_tfidf_embeddings():
    emb = FastTFIDFEmbeddings(max_features=256)
    corpus = [
        "Dynamic pricing optimization and price elasticity of demand",
        "Machine learning demand forecasting with SARIMAX and Holt-Winters",
        "SHAP game theoretic attributions and feature importance",
    ]
    vectors = emb.embed_documents(corpus)
    assert len(vectors) == 3
    assert len(vectors[0]) > 0

    q_vec = emb.embed_query("price elasticity")
    assert len(q_vec) == len(vectors[0])


def test_deterministic_hash_embeddings():
    emb = DeterministicHashEmbeddings(dimension=64)
    q_vec = emb.embed_query("price elasticity")
    assert len(q_vec) == 64
    docs_vec = emb.embed_documents(["pricing", "elasticity"])
    assert len(docs_vec) == 2


# ── 4. Ingestion Pipeline & Vector Store Tests ───────────────────────────────
def test_knowledge_ingestor_pipeline():
    ingestor = KnowledgeIngestor()
    stats = ingestor.ingest(force_reindex=True)

    assert stats.documents_loaded >= 8
    assert stats.chunks_generated >= 20
    assert "pricing" in stats.categories_indexed
    assert "models" in stats.categories_indexed

    vs = ingestor.get_vector_store()
    assert vs is not None


# ── 5. Grounded Retrieval Tests ──────────────────────────────────────────────
def test_retrieval_pricing_margin_floor(initialized_service):
    results = initialized_service.retrieve_chunks("What is the margin floor for high precision sensors?")
    assert len(results) > 0
    top = results[0]
    assert top.score > 0
    assert any("sensor" in r.content.lower() or "margin" in r.content.lower() for r in results)


def test_retrieval_with_category_filter(initialized_service):
    pricing_results = initialized_service.retrieve_chunks("margin floors and cadence", category="pricing")
    assert len(pricing_results) > 0
    for r in pricing_results:
        assert r.category == "pricing"


def test_retrieval_shap_explainability(initialized_service):
    results = initialized_service.retrieve_chunks("How does SHAP calculate Shapley values?")
    assert len(results) > 0
    assert any("shap" in r.content.lower() or "additive" in r.content.lower() for r in results)


# ── 6. RAG Prompt & QA Chain Tests ───────────────────────────────────────────
def test_prompt_formatting():
    prompt = build_rag_prompt(context="Sample context", question="What is elasticity?")
    assert "STRICT GROUNDING" in prompt
    assert "Sample context" in prompt
    assert "What is elasticity?" in prompt


def test_rag_qa_chain_grounded_answer(initialized_service):
    answer = initialized_service.query("What are the optimization objectives in PriceMind AI?")
    assert answer.is_grounded is True
    assert len(answer.citations) > 0
    assert "PROFIT_MAX" in answer.answer or "REVENUE_MAX" in answer.answer or "optimization" in answer.answer.lower()
    assert answer.confidence_score > 0


def test_rag_qa_chain_refusal_for_ungrounded():
    # Out of domain query with high specificity threshold
    retriever = GroundedRetriever(similarity_threshold=0.99)
    chain = RAGKnowledgeChain(retriever=retriever)
    answer = chain.query("What is the capital of Mars and recipe for baking bread?")
    assert answer.is_grounded is False
    assert len(answer.citations) == 0
    assert "cannot find this information" in answer.answer.lower()


# ── 7. FastAPI Endpoints Tests ────────────────────────────────────────────────
def test_fastapi_rag_query(client: TestClient):
    response = client.post(
        "/api/v1/rag/query",
        json={"query": "Explain the price elasticity regimes in PriceMind AI", "top_k": 3},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "Explain the price elasticity regimes in PriceMind AI"
    assert "elastic" in data["answer"].lower()
    assert len(data["citations"]) > 0
    assert "relevance_score" in data["citations"][0]


def test_fastapi_rag_retrieve(client: TestClient):
    response = client.post(
        "/api/v1/rag/retrieve",
        json={"query": "XGBoost hyperparameters and R-squared", "top_k": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_retrieved"] > 0
    assert len(data["chunks"]) <= 2
    assert "chunk_id" in data["chunks"][0]
    assert "similarity_score" in data["chunks"][0]


def test_fastapi_rag_status(client: TestClient):
    response = client.get("/api/v1/rag/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert data["total_documents"] >= 8
    assert data["total_chunks"] >= 20
    assert "pricing" in data["categories"]


def test_fastapi_rag_reindex(client: TestClient):
    response = client.post("/api/v1/rag/reindex")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert data["total_chunks"] >= 20


def test_fastapi_assistant_with_rag(client: TestClient):
    response = client.post(
        "/api/v1/assistant/query",
        json={"prompt": "What is the corporate margin floor policy for hardware?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "sender" in data
    assert data["sender"] == "assistant"
    assert "margin" in data["content"].lower() or "floor" in data["content"].lower()
