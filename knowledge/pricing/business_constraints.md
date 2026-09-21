---
title: PriceMind AI Business Constraints and Inventory Optimization
category: pricing
document_type: constraints
version: 1.0.0
last_updated: 2026-03-15
---

# Business Constraints & Inventory Optimization Rules

## 1. Inventory Holding Constraints
Inventory levels directly influence the pricing objective function:
- **Overstock Regime (Days of Supply > 60 days)**: The optimization objective switches toward volume acceleration or balanced margin recovery. Markdown limits are relaxed up to -25.0% to minimize inventory carrying costs ($0.18/unit/month).
- **Normal Regime (20 <= Days of Supply <= 60 days)**: Standard profit maximization (PROFIT_MAX) applies with default margin floors.
- **Critical Stockout Risk (Days of Supply < 15 days)**: Pricing engine applies scarcity buffering, recommending price increases (+5.0% to +12.0%) to ration demand until replenishment purchase orders arrive.

## 2. Competitor Reaction & Matching Bounds
Dynamic pricing accounts for competitive price positioning:
- **Leader Positioning**: When our brand equity and quality score exceed competitors by > 20%, maintain a +5.0% to +10.0% premium over competitor median.
- **Parity Positioning**: For commoditized hardware, maintain prices within +/-2.0% of the lowest verified competitor price to preserve Buy-Box win rate (> 70%).
- **Predatory Price Defense**: Do not match competitor prices that drop below our unit cost price plus 10% gross margin. Instead, trigger an executive pricing alert.

## 3. Contractual Minimum Advertised Price (MAP)
- MAP policies enforced by brand manufacturers represent strict hard bounds (P >= P_MAP).
- The optimization engine treats P_MAP as a hard lower inequality constraint in the scipy SLSQP solver.
