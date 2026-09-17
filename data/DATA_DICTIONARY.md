# PriceMind AI — Data Foundation & Schema Dictionary

## 1. Dataset Overview

- **Dataset Identifier**: `pricing_transactions`
- **Source**: Enterprise Point-of-Sale (POS) & ERP transactional feeds.
- **Coverage Window**: 365 days (2025-09-01 to 2026-08-31)
- **Granularity**: Daily SKU-Store transactional aggregations.
- **Total Raw Records**: `5,478`
- **Total Cleaned Records**: `5,475` (after deduplicating 3 duplicate rows)

---

## 2. Column Specification

| Column Name | Meaning & Business Definition | Storage Data Type | Standard Units | Missing-Value / Anomaly Behavior |
|---|---|---|---|---|
| `date` | Transaction timestamp/date | `datetime64[ns]` (ISO-8601: `YYYY-MM-DD`) | Calendar Date | Rows with unparseable or null dates are dropped. Dataset is sorted chronologically. |
| `sku_id` | Unique alphanumeric stock-keeping unit identifier | `object` / `string` | Alphanumeric Identifier | Whitespace stripped. Required foreign key to product catalog. |
| `sku_name` | Human-readable product name description | `object` / `string` | Text | Whitespace trimmed. |
| `category` | Product taxonomy / business category | `object` / `string` | Category Label | Categorical grouping for cross-elasticity and sub-segment modeling. |
| `store_id` | Channel / store location identifier | `object` / `string` | Alphanumeric Code | Multi-store channels (`STORE-NORTH-01`, `STORE-ONLINE-GLOBAL`, etc.). |
| `price` | Realized unit selling price | `float64` | Currency (USD \$) | Negative or zero prices are invalid and filtered out. |
| `cost_price` | Unit cost of goods sold (COGS) | `float64` | Currency (USD \$) | Used to compute unit gross profit and margin percentages. |
| `units_sold` | Total quantity / demand volume sold | `int64` / `float64` | Units (count) | Negative demand entries are filtered. Zero denotes no sales. |
| `revenue` | Net realized gross dollar revenue | `float64` | Currency (USD \$) | Derived as `price * units_sold` if not provided directly. |
| `competitor_price` | Real-time web-scraped market competitor benchmark price | `float64` | Currency (USD \$) | Scraped median competitor price for cross-price elasticity estimation. |
| `inventory_level` | End-of-day available stock runway | `int64` | Units on hand | Stock count used for inventory constraint guardrails and stockout risk models. |
| `is_promotion` | Active promotional discount indicator | `int64` (binary `0` or `1`) | Flag (`1` = Promo active) | Controls for promotional demand lift during feature engineering. |

---

## 3. Important Data Limitations & Econometric Considerations

1. **Stockout Truncation (Censored Demand)**:
   - When `inventory_level == 0`, observed `units_sold` reflects stock availability rather than true market unconstrained demand.
   - *Mitigation in ML*: Demand modeling will integrate Tobit / censored regression estimators.

2. **Simultaneity & Price Endogeneity**:
   - Correlation between price and demand does not automatically imply pure causal price elasticity because promotions and seasonal shifts co-occur with price adjustments.
   - *Mitigation in ML*: Non-linear spline regression and instrumental variable / TreeSHAP controls.

3. **Granularity Requirements for Pricing Optimization**:
   - The required minimum fields for full dynamic pricing optimization are:
     - `sku_id`, `date`, `price`, `cost_price`, `units_sold`
     - Optional but highly recommended: `competitor_price`, `inventory_level`, `is_promotion`.
