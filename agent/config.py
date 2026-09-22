"""
agent/config.py
---------------
Configuration for the PriceMind AI Agent (Module 12).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass
class AgentConfig:
    """Runtime configuration for the LangChain pricing agent."""

    # LLM provider — "openai" | "google" | "stub"
    llm_provider: str = field(
        default_factory=lambda: os.getenv("AGENT_LLM_PROVIDER", "stub")
    )

    # OpenAI
    openai_api_key: str = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", "")
    )
    openai_model: str = field(
        default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    )

    # Google Gemini
    google_api_key: str = field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    )
    google_model: str = field(
        default_factory=lambda: os.getenv("GOOGLE_MODEL", "gemini-1.5-flash")
    )

    # Generation settings
    temperature: float = field(
        default_factory=lambda: float(os.getenv("AGENT_TEMPERATURE", "0.0"))
    )
    max_tokens: int = field(
        default_factory=lambda: int(os.getenv("AGENT_MAX_TOKENS", "1024"))
    )

    # Agent behaviour
    max_iterations: int = field(
        default_factory=lambda: int(os.getenv("AGENT_MAX_ITERATIONS", "6"))
    )
    verbose: bool = field(
        default_factory=lambda: os.getenv("AGENT_VERBOSE", "false").lower() == "true"
    )

    # RAG integration
    rag_top_k: int = field(
        default_factory=lambda: int(os.getenv("AGENT_RAG_TOP_K", "4"))
    )

    def effective_provider(self) -> str:
        """Return the provider that has a valid API key, else 'stub'."""
        if (self.llm_provider in ("google", "gemini") or not self.openai_api_key) and self.google_api_key:
            return "google"
        if self.llm_provider == "openai" and self.openai_api_key:
            return "openai"
        if self.google_api_key:
            return "google"
        return "stub"


# Module-level singleton
agent_config = AgentConfig()
