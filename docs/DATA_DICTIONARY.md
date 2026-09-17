# PriceMind AI Data Dictionary

---

## Core Entities

### SKU (Stock Keeping Unit)
- `sku_code`: Unique alphanumeric product identifier (e.g. `SKU-8921-PRO`).
- `current_price`: Active list price ($ USD).
- `cost_price`: Cost of goods sold (COGS) ($ USD).
- `margin_percent`: Realized gross margin $\% = (P - C) / P \times 100$.
- `current_velocity`: Average daily sales rate (units/day).
- `days_of_inventory`: Warehouse stock runway (days of supply).
- `elasticity_score`: Empirical price elasticity coefficient ($E_d = \% \Delta Q / \% \Delta P$).

### Pricing Recommendation
- `recommended_price`: AI-optimized target price ($ USD).
- `projected_revenue_delta`: Estimated incremental monthly revenue ($ USD).
- `confidence_score`: Bayesian model certainty gauge ($0 - 100\%$).
- `guardrail_checks`: Validations for margin floors, competitor index spreads, and MAP compliance.
