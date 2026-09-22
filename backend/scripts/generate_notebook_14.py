"""
backend/scripts/generate_notebook_14.py
---------------------------------------
Generates notebooks/14_full_platform_integration.ipynb for Module 14.
Run: python backend/scripts/generate_notebook_14.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "notebooks" / "14_full_platform_integration.ipynb"

CELLS = [
    {
        "cell_type": "markdown",
        "source": [
            "# Module 14 — PriceMind AI Full Platform Integration\n",
            "\n",
            "This notebook demonstrates the end-to-end integration of all 14 PriceMind AI modules:\n",
            "- **Authentication & Multi-Tenancy** (JWT, Organizations)\n",
            "- **Product Catalog & Consolidated Analytics** (`/products/{id}/analytics`)\n",
            "- **Price Elasticity & Demand Forecasting** (OLS + Prophet/Spline)\n",
            "- **Constraint-Bounded Optimization** (`/pricing/recommend`)\n",
            "- **TreeSHAP Explainability** (`/explanations/pricing`)\n",
            "- **LangChain RAG Knowledge System** (`/rag/query`)\n",
            "- **LangChain AI Pricing Agent** (`/agent/query`)\n"
        ]
    },
    {
        "cell_type": "code",
        "source": [
            "import sys\n",
            "import json\n",
            "from pathlib import Path\n",
            "\n",
            "# Setup python paths\n",
            "ROOT = Path('..').resolve()\n",
            "sys.path.insert(0, str(ROOT))\n",
            "sys.path.insert(0, str(ROOT / 'backend'))\n",
            "print('Root directory:', ROOT)\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 1. Authentication & Organization Tenant Context\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "from fastapi.testclient import TestClient\n",
            "from app.main import app\n",
            "\n",
            "client = TestClient(app)\n",
            "\n",
            "reg_res = client.post('/api/v1/auth/register', json={\n",
            "    'full_name': 'Dr. Elena Rostova',\n",
            "    'email': 'elena.rostova@enterprise.com',\n",
            "    'organization_name': 'Global Pricing Corp',\n",
            "    'password': 'SecurePassword2026!',\n",
            "    'confirm_password': 'SecurePassword2026!',\n",
            "})\n",
            "\n",
            "if reg_res.status_code == 201:\n",
            "    token = reg_res.json()['access_token']\n",
            "    print('Authenticated as:', reg_res.json()['user']['email'])\n",
            "else:\n",
            "    login_res = client.post('/api/v1/auth/login', json={\n",
            "        'email': 'elena.rostova@enterprise.com',\n",
            "        'password': 'SecurePassword2026!'\n",
            "    })\n",
            "    token = login_res.json()['access_token']\n",
            "    print('Logged in successfully')\n",
            "\n",
            "headers = {'Authorization': f'Bearer {token}'}\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 2. Product Catalog & Consolidated Analytics (`/products/{id}/analytics`)\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "products_res = client.get('/api/v1/products')\n",
            "products = products_res.json()\n",
            "first_sku = products[0]['skuCode']\n",
            "print(f'Retrieved {len(products)} products. Analyzing first product: {first_sku}')\n",
            "\n",
            "analytics_res = client.get(f'/api/v1/products/{first_sku}/analytics')\n",
            "print('\\nConsolidated Product Analytics:')\n",
            "print(json.dumps(analytics_res.json(), indent=2))\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 3. End-to-End Pricing Recommendation Pipeline (`/pricing/recommend`)\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "rec_res = client.post('/api/v1/pricing/recommend', json={\n",
            "    'product_id': first_sku,\n",
            "    'objective': 'PROFIT_MAX'\n",
            "})\n",
            "rec_data = rec_res.json()\n",
            "print('Recommended Price:', rec_data.get('recommended_price'))\n",
            "print('Expected Profit:', rec_data.get('expected_profit'))\n",
            "print('Elasticity:', rec_data.get('elasticity'), f'({rec_data.get(\"elasticity_category\")})')\n",
            "print('SHAP Base Value:', rec_data.get('explanation', {}).get('base_value'))\n"
        ]
    },
    {
        "cell_type": "markdown",
        "source": ["## 4. Multi-Tool AI Pricing Agent (`/agent/query`)\n"]
    },
    {
        "cell_type": "code",
        "source": [
            "agent_res = client.post(\n",
            "    '/api/v1/agent/query',\n",
            "    json={'message': f'Why should {first_sku} optimize its pricing?'},\n",
            "    headers=headers,\n",
            ")\n",
            "agent_data = agent_res.json()\n",
            "print('Agent Answer:')\n",
            "print(agent_data.get('answer'))\n",
            "print('\\nTools Used:', agent_data.get('tools_used'))\n",
            "print('Sources:', [s['title'] for s in agent_data.get('sources', [])])\n"
        ]
    },
]

def make_cell(cell_data):
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
