# PriceMind AI API Specification (v1)

Base URL: `http://localhost:8000/api/v1`

---

## Endpoints

### 1. Executive Telemetry
- `GET /api/v1/executive/kpis`: Returns high-level portfolio KPIs, annualized revenue run-rate, and realized elasticity.

### 2. Product Matrix
- `GET /api/v1/products`: List all SKUs with margin %, velocity, and stock health.
- `GET /api/v1/products/{sku_code}`: Deep-dive telemetry for a single SKU.

### 3. Pricing Recommendations
- `GET /api/v1/recommendations`: Retrieve pending, approved, or applied pricing actions.
- `PATCH /api/v1/recommendations/{rec_id}/status`: Approve, reject, or mark as synced to ERP.

### 4. Demand Elasticity
- `GET /api/v1/elasticity/{sku_code}`: Return empirical step-wise price response curve ($Q = f(P)$).

### 5. What-If Simulations
- `POST /api/v1/simulations/run`: Execute real-time multi-variable scenario calculation.

### 6. Competitor Radar
- `GET /api/v1/competitors`: Retrieve real-time market price parity feeds.

### 7. AI Copilot Agent
- `POST /api/v1/assistant/query`: Natural language query with tool execution and policy RAG.

### 8. Model Observatory
- `GET /api/v1/models`: Production model telemetry (WAPE, MAE, $R^2$, drift status).
