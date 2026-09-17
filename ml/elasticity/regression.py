"""
PriceMind AI — Econometric Regression & Elasticity Modeling
Implements Log-Log OLS, Multi-Variable Controlled Regression, and Robust M-Estimation.
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.stats.stattools import durbin_watson
import logging

logger = logging.getLogger(__name__)


class ElasticityRegressionEngine:
    """
    Fits econometric log-log regression models to estimate price elasticity with controls and diagnostics.
    """

    @staticmethod
    def fit_log_log_ols(
        df: pd.DataFrame,
        price_col: str = "price",
        demand_col: str = "units_sold",
        control_cols: Optional[List[str]] = None,
        alpha_ci: float = 0.05,
    ) -> Dict[str, Any]:
        """
        Fits ln(Q) = alpha + beta * ln(P) + gamma * Controls + epsilon.
        Beta directly represents the constant price elasticity coefficient.
        """
        # 1. Validation & Data Sanitization
        cols_needed = [price_col, demand_col] + (control_cols or [])
        missing_cols = [c for c in cols_needed if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns for regression: {missing_cols}")

        clean_df = df[cols_needed].dropna().copy()
        # Keep positive values for log transform
        clean_df = clean_df[(clean_df[price_col] > 0) & (clean_df[demand_col] >= 0)]

        n_obs = len(clean_df)
        if n_obs < 10:
            return {
                "status": "INSUFFICIENT_OBSERVATIONS",
                "n_obs": n_obs,
                "elasticity": np.nan,
                "std_error": np.nan,
                "p_value": np.nan,
                "ci_lower": np.nan,
                "ci_upper": np.nan,
                "r_squared": np.nan,
                "adj_r_squared": np.nan,
            }

        # Check Price Variance
        price_std = clean_df[price_col].std()
        price_mean = clean_df[price_col].mean()
        price_cv = (price_std / price_mean * 100) if price_mean > 0 else 0.0

        if price_cv < 0.5:
            return {
                "status": "NO_PRICE_VARIATION",
                "n_obs": n_obs,
                "price_cv_pct": round(price_cv, 2),
                "elasticity": np.nan,
                "std_error": np.nan,
                "p_value": np.nan,
                "ci_lower": np.nan,
                "ci_upper": np.nan,
                "r_squared": np.nan,
                "adj_r_squared": np.nan,
            }

        # 2. Build Dependent Variable & Regressors
        y = np.log1p(clean_df[demand_col]) # ln(1 + Q) handles zeros safely
        X = pd.DataFrame({"log_price": np.log(clean_df[price_col])}, index=clean_df.index)

        # Add optional control variables
        if control_cols:
            for c in control_cols:
                if c in clean_df.columns:
                    if pd.api.types.is_numeric_dtype(clean_df[c]):
                        # If competitor price, log transform
                        if "competitor" in c.lower() and (clean_df[c] > 0).all():
                            X[f"log_{c}"] = np.log(clean_df[c])
                        else:
                            X[c] = clean_df[c]

        X = sm.add_constant(X)

        # 3. Fit OLS Model
        try:
            ols_model = sm.OLS(y, X).fit()
            conf_int = ols_model.conf_int(alpha=alpha_ci)

            elasticity_val = float(ols_model.params["log_price"])
            se_val = float(ols_model.bse["log_price"])
            p_val = float(ols_model.pvalues["log_price"])
            t_stat = float(ols_model.tvalues["log_price"])
            ci_low = float(conf_int.loc["log_price", 0])
            ci_high = float(conf_int.loc["log_price", 1])

            # Calculate Durbin-Watson statistic for autocorrelation
            dw_stat = float(durbin_watson(ols_model.resid))

            # Cross-price elasticity if competitor control was included
            cross_elasticity = None
            comp_log_cols = [col for col in X.columns if "competitor" in col]
            if comp_log_cols:
                comp_col_name = comp_log_cols[0]
                cross_elasticity = {
                    "cross_elasticity": round(float(ols_model.params[comp_col_name]), 4),
                    "cross_p_value": round(float(ols_model.pvalues[comp_col_name]), 6),
                    "cross_se": round(float(ols_model.bse[comp_col_name]), 4),
                }

            return {
                "status": "SUCCESS",
                "n_obs": n_obs,
                "price_cv_pct": round(price_cv, 2),
                "elasticity": round(elasticity_val, 4),
                "std_error": round(se_val, 4),
                "t_statistic": round(t_stat, 4),
                "p_value": round(p_val, 6),
                "ci_lower": round(ci_low, 4),
                "ci_upper": round(ci_high, 4),
                "ci_width": round(abs(ci_high - ci_low), 4),
                "r_squared": round(float(ols_model.rsquared), 4),
                "adj_r_squared": round(float(ols_model.rsquared_adj), 4),
                "f_statistic": round(float(ols_model.fvalue), 4) if not np.isnan(ols_model.fvalue) else None,
                "f_pvalue": round(float(ols_model.f_pvalue), 6) if not np.isnan(ols_model.f_pvalue) else None,
                "durbin_watson": round(dw_stat, 4),
                "aic": round(float(ols_model.aic), 2),
                "bic": round(float(ols_model.bic), 2),
                "cross_price_elasticity": cross_elasticity,
                "all_coefficients": {k: round(float(v), 4) for k, v in ols_model.params.items()},
            }

        except Exception as e:
            logger.error(f"OLS regression failed: {str(e)}")
            return {
                "status": f"ERROR: {str(e)}",
                "n_obs": n_obs,
                "elasticity": np.nan,
                "std_error": np.nan,
                "p_value": np.nan,
                "ci_lower": np.nan,
                "ci_upper": np.nan,
                "r_squared": np.nan,
                "adj_r_squared": np.nan,
            }

    @staticmethod
    def fit_robust_rlm(
        df: pd.DataFrame,
        price_col: str = "price",
        demand_col: str = "units_sold",
    ) -> Dict[str, Any]:
        """
        Fits Huber Robust Linear Model (RLM) to assess outlier influence on elasticity.
        """
        clean_df = df[[price_col, demand_col]].dropna()
        clean_df = clean_df[(clean_df[price_col] > 0) & (clean_df[demand_col] >= 0)]

        if len(clean_df) < 10:
            return {"status": "INSUFFICIENT_OBSERVATIONS"}

        y = np.log1p(clean_df[demand_col])
        X = sm.add_constant(np.log(clean_df[price_col]))

        try:
            rlm_model = sm.RLM(y, X, M=sm.robust.norms.HuberT()).fit()
            return {
                "status": "SUCCESS",
                "robust_elasticity": round(float(rlm_model.params.iloc[1]), 4),
                "robust_se": round(float(rlm_model.bse.iloc[1]), 4),
                "robust_p_value": round(float(rlm_model.pvalues.iloc[1]), 6),
            }
        except Exception as e:
            return {"status": f"ERROR: {str(e)}"}
