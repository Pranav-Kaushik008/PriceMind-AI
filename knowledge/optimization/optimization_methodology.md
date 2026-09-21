---
title: Dynamic Pricing Optimization Formulations & Solvers
category: optimization
document_type: methodology
version: 1.0.0
last_updated: 2026-03-15
---

# Dynamic Pricing Optimization Methodology

## 1. Problem Formulation
The dynamic pricing optimization engine finds the optimal unit price P* for a given SKU that maximizes the target business objective over a planning horizon subject to operational and market constraints.

## 2. Supported Optimization Objectives
1. **Profit Maximization (`PROFIT_MAX`)**:
   max_P Profit(P) = (P - C) * Q_hat(P)
   Where C is unit cost price and Q_hat(P) is the demand prediction evaluated by the machine learning model.

2. **Revenue Maximization (`REVENUE_MAX`)**:
   max_P Revenue(P) = P * Q_hat(P)
   Suitable for land-grab market expansion, new product launches, or market share defense.

3. **Balanced Objective (`BALANCED`)**:
   max_P J(P) = w * (Profit(P) / Profit_base) + (1 - w) * (Revenue(P) / Revenue_base)
   Where w in [0, 1] is the profit weighting factor (default w = 0.60).

## 3. Constraints & Solvers
The optimization problem is constrained by:
- **Price Bounds**: P_min <= P <= P_max
- **Margin Floor Constraint**: (P - C) / P >= m_min
- **Competitor Parity Constraint**: (1 - delta) * P_comp <= P <= (1 + delta) * P_comp
- **Inventory Clearance Target**: Q(P) >= Q_target

**Solvers**:
- **SLSQP (Sequential Least Squares Quadratic Programming)**: Primary continuous non-linear constrained optimizer.
- **Dense Grid Search Evaluation**: Evaluates 100 discrete price candidate points across [P_min, P_max] to verify global optimality and guard against local minima.
