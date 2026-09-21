---
title: SHAP Explainability & Feature Attribution Methodology
category: explainability
document_type: methodology
version: 1.0.0
last_updated: 2026-03-15
---

# SHAP Explainability Methodology

## 1. Game-Theoretic Attribution
PriceMind AI utilizes **SHAP (SHapley Additive exPlanations)** to provide transparent, mathematically sound attributions for every demand prediction and pricing recommendation.
Based on cooperative game theory, the Shapley value phi_i represents the average marginal contribution of feature i across all possible feature subsets S:
phi_i = sum_{S subseteq F \ {i}} [|S|!(|F| - |S| - 1)! / |F|!] * [f(S union {i}) - f(S)]

## 2. Additive Consistency (Efficiency Property)
The sum of SHAP attribution values for all features plus the expected model baseline value E[f(X)] strictly equals the final predicted demand:
y_hat = E[f(X)] + sum_i(phi_i)

## 3. Explanation Types
1. **Local Prediction Explanation**: Decomposes a specific SKU demand forecast into top positive contributors (e.g. promotional discount +5.2 units) and negative detractors (e.g. competitor undercutting -3.1 units).
2. **Global Feature Importance**: Ranks the macro influence of all 88 features across the full catalog. Price ratio, 7-day lag demand, and promotional flag consistently rank as top drivers.
3. **Pricing Recommendation Explanation**: Explains why the optimizer recommends a price adjustment by breaking down price elasticity impact, competitor gap, margin buffer, and inventory pressure.
