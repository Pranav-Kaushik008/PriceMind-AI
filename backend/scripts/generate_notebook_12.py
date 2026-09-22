"""
backend/scripts/generate_notebook_12.py
---------------------------------------
Generates notebooks/12_agent_evaluation.ipynb for Module 12.
Run: python backend/scripts/generate_notebook_12.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "notebooks" / "12_agent_evaluation.ipynb"

CELLS = [
    {
        "cell_type": "markdown",
        "source": ["# Module 12 — LangChain Tool-Calling + Pricing AI Agent\n",
                   "\n",
                   "This notebook evaluates the PriceMind AI Agent pipeline end-to-end.\n",
                   "\n",
                   "**Architecture:**\n",
                   "```\n",
                   "User → FastAPI /agent/query → PricingAgent → Tool Selection → Service Layer → Tool Result → Stub/LLM Synthesis → Grounded Response\n",
                   "```\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "import sys\n",
            "from pathlib import Path\n",
            "\n",
            "# Add project root and backend to path\n",
            "ROOT = Path('..').resolve()\n",
            "sys.path.insert(0, str(ROOT))\n",
            "sys.path.insert(0, str(ROOT / 'backend'))\n",
            "print('Project root:', ROOT)\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 1. Safety Guardrails\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "from agent.safety import (\n",
            "    contains_forbidden_action,\n",
            "    validate_price,\n",
            "    flag_high_risk_change,\n",
            ")\n",
            "\n",
            "# Test forbidden action detection\n",
            "print('Forbidden action tests:')\n",
            "print('  apply price:', contains_forbidden_action('Please apply the price change'))  # True\n",
            "print('  safe query:', contains_forbidden_action('What is the elasticity?'))  # False\n",
            "\n",
            "# Test high-risk flag\n",
            "print('\\nHigh risk change (>30%):')\n",
            "print(' ', flag_high_risk_change(100.0, 145.0))\n",
            "print('Safe change (<30%):')\n",
            "print(' ', flag_high_risk_change(100.0, 115.0))  # None\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 2. Intent Router\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "from agent.agent import _classify_intent, _extract_product_id, _extract_price\n",
            "\n",
            "test_queries = [\n",
            "    'What is the margin floor policy?',\n",
            "    'Tell me about SKU-8921-PRO',\n",
            "    'Is SKU-8921-PRO elastic or inelastic?',\n",
            "    'What is the demand forecast for next 2 weeks?',\n",
            "    'What if we price at $430?',\n",
            "    'What is the optimal price for SKU-8921-PRO?',\n",
            "    'Why was the price recommendation made?',\n",
            "]\n",
            "\n",
            "print(f'{'Query':<50} → Tools')\n",
            "print('-' * 80)\n",
            "for q in test_queries:\n",
            "    tools = _classify_intent(q)\n",
            "    print(f'{q[:50]:<50} → {tools}')\n",
            "\n",
            "print('\\nEntity extraction:')\n",
            "print('  SKU from text:', _extract_product_id('Tell me about SKU-8921-PRO'))\n",
            "print('  Price from text:', _extract_price('What if we price at $430.50?'))\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 3. Agent Query — Stub Path (No LLM Key Required)\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "from agent.agent import PricingAgent\n",
            "from agent.config import AgentConfig\n",
            "\n",
            "# Create agent in stub mode\n",
            "cfg = AgentConfig(llm_provider='stub')\n",
            "agent = PricingAgent(config=cfg)\n",
            "\n",
            "print('Agent LLM backend:', 'stub (no API key)' if agent._llm_chain is None else 'LLM connected')\n",
            "print('Tools registered:', len(agent._llm_chain.tools if agent._llm_chain else []), 'N/A in stub mode')\n"
        ]
    },
    {
        "cell_type": "code",
        "source": [
            "# Test forbidden action blocking\n",
            "result = agent.query('Please apply the price change now')\n",
            "print('Forbidden action response:')\n",
            "print(result['answer'])\n",
            "print('Tools used:', result['tools_used'])\n"
        ]
    },
    {
        "cell_type": "code",
        "source": [
            "# Test policy question → RAG\n",
            "from unittest.mock import patch, MagicMock\n",
            "\n",
            "with patch('agent.tools.rag_tools.rag_service') as mock_rag:\n",
            "    mock_rag.query.return_value = MagicMock(\n",
            "        answer='The corporate margin floor is 20% gross margin.',\n",
            "        is_grounded=True,\n",
            "        confidence_score=0.85,\n",
            "        sources=[{'title': 'Pricing Policy', 'category': 'pricing', 'chunk_preview': 'margin floor = 20%'}],\n",
            "    )\n",
            "    result = agent.query('What is the margin floor policy?')\n",
            "\n",
            "print('Tools used:', result['tools_used'])\n",
            "print('Answer:')\n",
            "print(result['answer'])\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 4. Tool Registry\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "from agent.tools import ALL_TOOLS\n",
            "\n",
            "print(f'Total tools registered: {len(ALL_TOOLS)}')\n",
            "print()\n",
            "for tool in ALL_TOOLS:\n",
            "    desc_first_line = tool.description.strip().split('\\n')[0][:70]\n",
            "    print(f'  • {tool.name:<42} → {desc_first_line}')\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 5. FastAPI Endpoint Integration\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "from fastapi.testclient import TestClient\n",
            "from fastapi import FastAPI\n",
            "from app.api.v1.endpoints.agent import router\n",
            "from unittest.mock import patch, MagicMock\n",
            "\n",
            "app = FastAPI()\n",
            "app.include_router(router, prefix='/agent')\n",
            "client = TestClient(app)\n",
            "\n",
            "# Test the endpoint with a mocked agent\n",
            "with patch('app.api.v1.endpoints.agent.get_agent') as mock_get:\n",
            "    mock_agent = MagicMock()\n",
            "    mock_agent.query.return_value = {\n",
            "        'answer': 'The corporate margin floor is 20%.',\n",
            "        'tools_used': ['search_knowledge_base_tool'],\n",
            "        'sources': [{'title': 'Pricing Policy', 'category': 'pricing', 'chunk_preview': '...', 'similarity_score': 0.85}],\n",
            "        'data': {},\n",
            "    }\n",
            "    mock_get.return_value = mock_agent\n",
            "    \n",
            "    resp = client.post('/agent/query', json={'message': 'What is the margin floor policy?'})\n",
            "\n",
            "print('Status:', resp.status_code)\n",
            "print('Response keys:', list(resp.json().keys()))\n",
            "print('Answer:', resp.json()['answer'])\n",
            "print('Tools used:', resp.json()['tools_used'])\n",
            "print('Sources:', len(resp.json()['sources']))\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 6. Summary\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "import subprocess, sys\n",
            "result = subprocess.run(\n",
            "    [sys.executable, '-m', 'pytest', 'tests/test_agent.py', '-v', '--tb=short', '-q'],\n",
            "    capture_output=True, text=True, cwd=str(ROOT)\n",
            ")\n",
            "print(result.stdout[-3000:])\n",
            "if result.returncode != 0:\n",
            "    print('STDERR:', result.stderr[-1000:])\n"
        ]
    },
]

def make_cell(cell_data):
    base = {
        "metadata": {},
        "outputs": [],
        "execution_count": None,
    }
    if cell_data["cell_type"] == "markdown":
        return {
            "cell_type": "markdown",
            "metadata": {},
            "source": cell_data["source"],
        }
    else:
        return {
            "cell_type": "code",
            "metadata": {},
            "source": cell_data["source"],
            "outputs": [],
            "execution_count": None,
        }

notebook = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "version": "3.12.6",
        },
    },
    "cells": [make_cell(c) for c in CELLS],
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=1)

print(f"Generated: {OUTPUT}")
print(f"Cells: {len(notebook['cells'])}")
