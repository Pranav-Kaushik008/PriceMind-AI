# PriceMind AI

> **AI-powered Dynamic Pricing, Demand Intelligence & Revenue Optimization Platform**

PriceMind AI is an enterprise-grade system for professional pricing analysts and revenue management teams. It combines machine learning elasticity models, demand forecasting, competitive intelligence, and a generative AI copilot into a single decision-support platform.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Frontend](#frontend-react)
  - [Backend](#backend-fastapi)
  - [Full Stack with Docker](#full-stack-with-docker)
- [Deployment](#deployment-render)
- [Running Tests](#running-tests)
- [Documentation](#documentation)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)

---

## Overview

PriceMind AI answers three core questions for every SKU in your catalog:

| Question | Feature |
|---|---|
| **What happened?** | Executive KPI dashboard, demand trends, competitor radar |
| **Why did it happen?** | Explainable AI (SHAP), elasticity decomposition, audit trail |
| **What should I do?** | Price recommendations, what-if simulator, revenue optimizer |

---

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system diagram.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PriceMind AI                              │
│                                                                  │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────┐  │
│  │  React UI   │──▶│  FastAPI     │──▶│  ML Subsystem        │  │
│  │  (Port 3000)│   │  (Port 8000) │   │  LightGBM + SHAP     │  │
│  └─────────────┘   └──────┬───────┘   └──────────────────────┘  │
│                            │                                      │
│                    ┌───────▼───────┐   ┌──────────────────────┐  │
│                    │  SQLAlchemy   │   │  GenAI Copilot       │  │
│                    │  ORM (SQLite/ │   │  LangChain + RAG     │  │
│                    │  PostgreSQL)  │   └──────────────────────┘  │
│                    └───────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
PriceMind AI/
├── frontend/                   # React + Tailwind + Recharts UI
│   ├── src/
│   │   ├── pages/              # 10 analytical pages
│   │   ├── components/         # Reusable UI components
│   │   │   ├── layout/         # AppShell, Sidebar, Header
│   │   │   └── ui/             # MetricCard, DataTable, Charts…
│   │   ├── store/              # Zustand global state
│   │   ├── mock/               # Mock data for development
│   │   └── styles/             # Design tokens + global CSS
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint + CORS
│   │   ├── core/               # Config, security, settings
│   │   ├── api/v1/endpoints/   # 8 REST routers
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── db/                 # Database session + base registry
│   │   └── genai/              # LangChain copilot agent scaffold
│   ├── requirements.txt
│   └── venv/                   # Python virtual environment
│
├── ml/                         # ML subsystem (standalone Python package)
│   ├── data_processing/        # Raw data cleaning
│   ├── features/               # Feature engineering
│   ├── models/                 # Elasticity + demand forecasting
│   ├── optimization/           # Revenue-optimal price solver
│   ├── evaluation/             # WAPE, MAE, R² metrics
│   ├── explainability/         # SHAP explainer
│   └── mlops/                  # MLflow experiment tracking scaffold
│
├── data/                       # Data lake (see data/README.md)
│   ├── raw/
│   ├── processed/
│   └── external/
│
├── tests/                      # Test suite
│   ├── test_api.py             # FastAPI integration tests (5 tests)
│   └── test_ml.py              # ML unit tests (3 tests)
│
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
├── render.yaml                 # Render.com deployment manifest
├── .env.example                # Environment variable template
└── docs/
    ├── ARCHITECTURE.md         # System architecture + diagrams
    ├── API_SPEC.md             # Full API endpoint reference
    └── DATA_DICTIONARY.md      # Entity definitions + field specs
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.12
- Git

---

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

**Production build:**

```bash
npm run build
# Output: frontend/dist/
```

---

### Backend (FastAPI)

**1. Create & activate virtual environment:**

```bash
cd backend
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (CMD)
venv\Scripts\activate.bat

# macOS / Linux
source venv/bin/activate
```

**2. Install dependencies:**

```bash
pip install -r requirements.txt
```

**3. Configure environment:**

```bash
# Copy template and fill in your values
cp ../.env.example .env
```

**4. Start the API server:**

```bash
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
# → Swagger UI: http://localhost:8000/docs
```

---

### Full Stack with Docker

```bash
# From project root
docker-compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
```

---

## Deployment (Render)

The repository includes a [`render.yaml`](render.yaml) for zero-config deployment to [Render.com](https://render.com):

```bash
# Connect your GitHub repo to Render
# Render auto-detects render.yaml and deploys:
#   - Web Service: FastAPI backend (Python)
#   - Static Site: React frontend (Node build)
```

Set the required environment variables in the Render dashboard (see [Environment Variables](#environment-variables)).

---

## Running Tests

All tests run from the project root using the backend virtual environment:

```bash
# Run full test suite (8 tests)
.\backend\venv\Scripts\python.exe -m pytest tests/ -v

# Run only ML unit tests
.\backend\venv\Scripts\python.exe -m pytest tests/test_ml.py -v

# Run only API integration tests
.\backend\venv\Scripts\python.exe -m pytest tests/test_api.py -v
```

**Current test results:**

```
tests/test_ml.py::test_elasticity_model_generation   PASSED
tests/test_ml.py::test_price_optimizer               PASSED
tests/test_ml.py::test_evaluation_metrics            PASSED
tests/test_api.py::test_root                         PASSED
tests/test_api.py::test_get_kpis                     PASSED
tests/test_api.py::test_list_products                PASSED
tests/test_api.py::test_get_recommendations          PASSED
tests/test_api.py::test_run_simulation               PASSED

8 passed in 2.38s
```

---

## Documentation

| Document | Description |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, data flow, component diagram |
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | All REST endpoints with request/response schemas |
| [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) | Entity definitions, field specs, math notation |
| [`data/README.md`](data/README.md) | Data lake structure and ingestion guide |

---

## Environment Variables

Copy [`.env.example`](.env.example) to `.env` and fill in:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./pricemind.db` | SQLAlchemy connection string |
| `SECRET_KEY` | `change-me` | JWT signing secret |
| `OPENAI_API_KEY` | — | OpenAI key for GenAI copilot |
| `ANTHROPIC_API_KEY` | — | Anthropic key (optional) |
| `MLFLOW_TRACKING_URI` | `http://localhost:5000` | MLflow server URI |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed frontend origins |
| `ENVIRONMENT` | `development` | `development` / `production` |

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (JSX) |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | Zustand |
| Icons | Lucide React |

### Backend
| Layer | Technology |
|---|---|
| API Framework | FastAPI |
| Data Validation | Pydantic v2 |
| ORM | SQLAlchemy 2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Server | Uvicorn |

### Machine Learning
| Layer | Technology |
|---|---|
| Gradient Boosting | LightGBM |
| Elasticity Modeling | Spline regression + monopoly pricing math |
| Explainability | SHAP |
| Experiment Tracking | MLflow (scaffold) |
| Data Processing | Pandas + NumPy |

### GenAI
| Layer | Technology |
|---|---|
| Agent Orchestration | LangChain (scaffold) |
| RAG Engine | Pricing policy knowledge base |
| LLM Providers | OpenAI / Anthropic |

### Infrastructure
| Layer | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Deployment | Render.com |
| Process Manager | Uvicorn (with reload) |

---

## Pages

| Page | Route | Description |
|---|---|---|
| Executive Overview | `/` | KPI command center, revenue trends, strategy heatmap |
| Product Intelligence | `/products` | SKU catalog, price elasticity bands, competitive positioning |
| Demand Elasticity | `/elasticity` | Cross-elasticity matrix, demand curves, sensitivity analysis |
| Revenue Optimization | `/optimization` | Portfolio-level revenue maximization recommendations |
| What-If Simulator | `/simulator` | Scenario modeling for price change impact |
| Competitor Radar | `/competitors` | Real-time competitive pricing intelligence |
| Inventory Dynamics | `/inventory` | Stock level impact on pricing strategy |
| Explainable AI | `/explainability` | SHAP waterfall charts, decision audit |
| AI Assistant | `/assistant` | LLM-powered pricing copilot |
| Audit Logs | `/audit` | Cryptographic audit trail for all price changes |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/executive/kpis` | Revenue KPIs and trend data |
| `GET` | `/api/v1/products/` | SKU catalog with pricing state |
| `GET` | `/api/v1/recommendations/` | Pending price change recommendations |
| `GET` | `/api/v1/elasticity/` | Demand elasticity estimates |
| `GET` | `/api/v1/competitors/` | Competitive price monitoring |
| `POST` | `/api/v1/simulations/run` | What-if price simulation |
| `POST` | `/api/v1/assistant/query` | AI copilot query |
| `GET` | `/api/v1/models/status` | ML model health and metadata |

Full API reference: [`docs/API_SPEC.md`](docs/API_SPEC.md)

---

## License

Proprietary. All rights reserved.
