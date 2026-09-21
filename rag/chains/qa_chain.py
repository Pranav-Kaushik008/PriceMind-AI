"""
rag/chains/qa_chain.py
----------------------
Grounded Question-Answering chain returning structured answers and citations.
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
import os

from rag.config import rag_config
from rag.retrieval.retriever import GroundedRetriever, RetrievedResult
from rag.chains.prompts import build_rag_prompt, RAG_SYSTEM_INSTRUCTION


@dataclass
class RAGAnswer:
    """Encapsulates the final grounded answer and its lineage citations."""
    query: str
    answer: str
    citations: List[Dict[str, Any]] = field(default_factory=list)
    retrieved_chunks_count: int = 0
    confidence_score: float = 0.0
    is_grounded: bool = True
    context_used: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "answer": self.answer,
            "citations": self.citations,
            "retrieved_chunks_count": self.retrieved_chunks_count,
            "confidence_score": self.confidence_score,
            "is_grounded": self.is_grounded,
        }


class GroundedSynthesizer:
    """
    Synthesizes grounded answers from retrieved context.
    Works either via external LLM (if API key available) or via an intelligent
    deterministic extractor that extracts key facts, tables, and bullet points
    from retrieved context while strictly maintaining attribution.
    """

    @classmethod
    def synthesize(cls, query: str, retrieved: List[RetrievedResult]) -> str:
        """Synthesize answer strictly using retrieved chunks."""
        if not retrieved:
            return (
                "I cannot find this information in the PriceMind AI enterprise knowledge base. "
                "For live predictions or calculations, please query the telemetry or dynamic pricing engine."
            )

        # Check if external LLM should be invoked
        llm_provider = rag_config.llm_provider.lower()
        if llm_provider == "openai" and os.getenv("OPENAI_API_KEY"):
            try:
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(
                    model=rag_config.llm_model_name,
                    temperature=rag_config.temperature,
                )
                from rag.retrieval.retriever import GroundedRetriever
                context_str = GroundedRetriever().format_context(retrieved)
                prompt_str = build_rag_prompt(context=context_str, question=query)
                res = llm.invoke(prompt_str)
                return res.content
            except Exception:
                pass  # Fallback to local grounded synthesis

        # Local Deterministic Grounded Synthesis
        primary_doc = retrieved[0]
        citations_summary = ", ".join(f"[{r.source_file}]" for r in retrieved)

        # Extract relevant bullet points or sentences matching query keywords
        q_tokens = set(query.lower().split())
        key_paragraphs = []

        for r in retrieved:
            paras = [p.strip() for p in r.content.split("\n\n") if p.strip()]
            for p in paras:
                # Score paragraph overlap
                p_tokens = set(p.lower().split())
                overlap = len(q_tokens.intersection(p_tokens))
                if overlap > 0 or len(paras) <= 2:
                    key_paragraphs.append((overlap, r.source_file, r.section_title, p))

        key_paragraphs.sort(key=lambda x: x[0], reverse=True)

        selected_snippets = []
        seen_texts = set()
        for _, src, sec, p_text in key_paragraphs[:3]:
            cleaned = p_text.replace("#", "").strip()
            if cleaned not in seen_texts:
                seen_texts.add(cleaned)
                selected_snippets.append(f"{cleaned} [Source: {src}, Section: {sec}]")

        if not selected_snippets:
            selected_snippets.append(
                f"{primary_doc.content[:300]}... [Source: {primary_doc.source_file}, Section: {primary_doc.section_title}]"
            )

        synthesized = (
            f"Based on PriceMind AI enterprise documentation:\n\n"
            + "\n\n".join(selected_snippets)
        )
        return synthesized


class RAGKnowledgeChain:
    """End-to-end question answering chain over the PriceMind AI knowledge base."""

    def __init__(
        self,
        retriever: Optional[GroundedRetriever] = None,
        synthesizer: Optional[GroundedSynthesizer] = None,
    ):
        self.retriever = retriever or GroundedRetriever()
        self.synthesizer = synthesizer or GroundedSynthesizer()

    def query(
        self,
        question: str,
        category_filter: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> RAGAnswer:
        """Process a natural language query and return a structured RAGAnswer."""
        retrieved = self.retriever.retrieve(
            query=question,
            category=category_filter,
            top_k=top_k,
        )

        citations = [r.to_citation_dict() for r in retrieved]
        retrieved_count = len(retrieved)

        if not retrieved:
            answer = (
                "I cannot find this information in the PriceMind AI enterprise knowledge base. "
                "Please consult the live API or internal documentation."
            )
            return RAGAnswer(
                query=question,
                answer=answer,
                citations=[],
                retrieved_chunks_count=0,
                confidence_score=0.0,
                is_grounded=False,
                context_used="",
            )

        # Average confidence score across retrieved results
        avg_confidence = round(sum(r.score for r in retrieved) / max(1, len(retrieved)), 4)
        context_str = self.retriever.format_context(retrieved)
        answer = self.synthesizer.synthesize(question, retrieved)

        return RAGAnswer(
            query=question,
            answer=answer,
            citations=citations,
            retrieved_chunks_count=retrieved_count,
            confidence_score=avg_confidence,
            is_grounded=True,
            context_used=context_str,
        )
