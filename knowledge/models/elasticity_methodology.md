---
title: Econometric Price Elasticity Methodology & Regimes
category: models
document_type: methodology
version: 1.0.0
last_updated: 2026-03-15
---

# Econometric Price Elasticity Methodology

## 1. Mathematical Formulation
Price Elasticity of Demand (E_d) measures the percentage change in quantity demanded in response to a 1% change in price:
E_d = (% delta Q) / (% delta P) = d(ln Q) / d(ln P)

PriceMind AI estimates elasticity using a multi-variable **Log-Log Ordinary Least Squares (OLS)** regression with Huber Robust Linear Model (RLM) correction for outlier resilience:
ln(Q_t) = alpha + beta_p * ln(P_t) + beta_c * ln(P_comp,t) + sum_k(gamma_k * X_k,t) + epsilon_t
Where:
- beta_p is the direct price elasticity coefficient.
- beta_c is the cross-price elasticity coefficient with respect to competitor pricing.
- X_k are control covariates (promotions, day-of-week, seasonality).

## 2. Elasticity Regimes & Strategic Interpretation
Products are categorized into three primary elasticity regimes:
1. **Inelastic Demand (|E_d| < 1.0)**:
   - Quantity demanded changes by a smaller percentage than price.
   - **Pricing Action**: Opportunity to increase prices safely; revenue and gross margin expand as volume loss is minimal.
   - Example: SKU-8921-PRO (E_d = -0.62), SKU-6109-OPT (E_d = -0.38).

2. **Unitary Elastic Demand (|E_d| approx 1.0, specifically 0.95 <= |E_d| <= 1.05)**:
   - Percentage change in quantity exactly offsets price change. Total revenue remains stable across moderate price fluctuations.

3. **Elastic Demand (|E_d| > 1.0)**:
   - Buyers are highly price-sensitive. A price increase triggers a larger percentage reduction in demand.
   - **Pricing Action**: Price cuts or promotional discounts can drive volume and total revenue growth, provided unit margin covers incremental volume.
   - Example: Consumer accessories (E_d = -1.85).

## 3. Cross-Price Elasticity (E_xy)
- E_xy > 0: **Substitute Goods** - when competitor raises price, our demand increases.
- E_xy < 0: **Complementary Goods** - when complement price rises, demand decreases.
- E_xy approx 0: **Independent Goods** - competitor price fluctuations have negligible impact.
