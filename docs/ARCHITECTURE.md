# PriceMind AI System Architecture

PriceMind AI is an enterprise-grade, AI-powered Dynamic Pricing, Demand Intelligence, and Revenue Optimization platform.

---

## High-Level Architecture

```text
┌────────────────────────────────────────────────────────┐
│               React / Tailwind Client                  │
│       (Executive Overview, Matrix, What-If Sandbox)    │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend                       │
│        (Pydantic Validation, CORS, JWT Auth)           │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼──────────┐ ┌──────────────▼──────────────┐
│  SQLAlchemy Database   │ │     ML & GenAI Subsystem    │
│  (PostgreSQL / SQLite) │ │  - Spline Elasticity        │
│  - SKUs, Recommendations│ │  - Revenue Optimizer        │
│  - Audit Logs, Users   │ │  - LangChain Copilot Agent  │
└────────────────────────┘ └─────────────────────────────┘
```

---

## Subsystem Responsibilities

1. **Frontend (`frontend/`)**: High-density institutional UI. Pure React + Tailwind CSS + Recharts + Zustand client state.
2. **Backend (`backend/`)**: FastAPI gateway serving typed endpoints with SQLAlchemy persistence and Pydantic validation.
3. **Machine Learning (`ml/`)**: Modular data cleaner, feature builders, spline elasticity estimators, and SHAP explainability.
4. **Generative AI (`backend/app/genai/`)**: LangChain-powered domain agent with tool execution and policy RAG retrieval.
5. **Data Lake (`data/`)**: Isolated tiers for raw transactions, feature stores, and competitor scrape telemetry.
6. **Infrastructure (`docker/`, `render.yaml`)**: Zero-downtime deployment spec and multi-container docker orchestration.
