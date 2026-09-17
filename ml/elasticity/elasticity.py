"""
PriceMind AI — Core Elasticity Estimation Module
Orchestrates per-product and per-category elasticity estimation with reliability classification.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
import logging

from ml.elasticity.regression import ElasticityRegressionEngine
from ml.elasticity.statistical_tests import StatisticalAnalyzer

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@dataclass
class ElasticityConfig:
    """
    Documented thresholds for reliability classification.

    Reliability labels are assigned as follows (rules applied in order):
      HIGH CONFIDENCE   : n_obs >= min_obs_high AND price_cv >= min_cv_high
                          AND p_value < alpha_high AND ci_width < max_ci_high
      MEDIUM CONFIDENCE : n_obs >= min_obs_medium AND price_cv >= min_cv_medium
                          AND p_value < alpha_medium
      LOW CONFIDENCE    : n_obs >= min_obs_low AND p_value < alpha_low
      INSUFFICIENT DATA : all other cases (too few observations, no price variation, error)
    """
    # Observation count thresholds
    min_obs_high: int = 30
    min_obs_medium: int = 15
    min_obs_low: int = 10

    # Price coefficient of variation thresholds (percent)
    min_cv_high: float = 5.0
    min_cv_medium: float = 2.0

    # Significance level thresholds
    alpha_high: float = 0.05
    alpha_medium: float = 0.10
    alpha_low: float = 0.25

    # Maximum CI width for High Confidence
    max_ci_high: float = 1.0

    # Controls to include in the regression model
    control_cols: List[str] = field(
        default_factory=lambda: ["competitor_price", "is_promotion"]
    )


# ---------------------------------------------------------------------------
# Arc / Point Elasticity Utilities
# ---------------------------------------------------------------------------

def calculate_arc_elasticity(
    p1: float, p2: float, q1: float, q2: float
) -> Optional[float]:
    """
    Computes the arc (midpoint) price elasticity of demand.

    Formula:
        E = ((Q2 - Q1) / midpoint_Q) / ((P2 - P1) / midpoint_P)

    Returns None if prices are equal, quantities are zero-bounded, or inputs are invalid.
    """
    try:
        p1, p2, q1, q2 = float(p1), float(p2), float(q1), float(q2)
        if any(np.isnan(v) for v in [p1, p2, q1, q2]):
            return None
        if p1 == p2:
            return None  # No price variation
        midpoint_q = (q1 + q2) / 2
        midpoint_p = (p1 + p2) / 2
        if midpoint_p == 0 or midpoint_q == 0:
            return None
        return float((q2 - q1) / midpoint_q) / float((p2 - p1) / midpoint_p)
    except (TypeError, ValueError, ZeroDivisionError):
        return None


def compute_pct_changes(
    df: pd.DataFrame,
    group_cols: List[str],
    price_col: str = "price",
    demand_col: str = "units_sold",
) -> pd.DataFrame:
    """
    Computes within-group period-over-period percentage changes in price and demand.
    Used for exploratory arc elasticity visualization.
    Applies shift(1) to prevent any look-ahead.
    """
    df = df.sort_values(group_cols + ["date"]).copy()
    grouped = df.groupby(group_cols)
    df["pct_chg_price"] = grouped[price_col].transform(
        lambda x: x.pct_change()
    )
    df["pct_chg_demand"] = grouped[demand_col].transform(
        lambda x: x.pct_change()
    )
    # Remove infinite or extreme changes
    for c in ["pct_chg_price", "pct_chg_demand"]:
        df[c] = df[c].replace([np.inf, -np.inf], np.nan)
    return df


# ---------------------------------------------------------------------------
# Reliability Classification
# ---------------------------------------------------------------------------

def classify_reliability(
    n_obs: int,
    price_cv: float,
    p_value: float,
    ci_width: float,
    config: ElasticityConfig,
    status: str = "SUCCESS",
) -> str:
    """
    Classifies an elasticity estimate into one of four reliability tiers.

    Classification rules (applied in priority order):

    HIGH CONFIDENCE:
      - n_obs >= config.min_obs_high (default 30)
      - price_cv >= config.min_cv_high (default 5.0%)
      - p_value < config.alpha_high (default 0.05)
      - ci_width < config.max_ci_high (default 1.0)

    MEDIUM CONFIDENCE:
      - n_obs >= config.min_obs_medium (default 15)
      - price_cv >= config.min_cv_medium (default 2.0%)
      - p_value < config.alpha_medium (default 0.10)

    LOW CONFIDENCE:
      - n_obs >= config.min_obs_low (default 10)
      - p_value < config.alpha_low (default 0.25)

    INSUFFICIENT DATA:
      - All other cases (model error, no price variation, too few observations)
    """
    if status != "SUCCESS":
        return "Insufficient Data"
    if any(np.isnan(v) for v in [price_cv, p_value, ci_width]):
        return "Insufficient Data"

    if (
        n_obs >= config.min_obs_high
        and price_cv >= config.min_cv_high
        and p_value < config.alpha_high
        and ci_width < config.max_ci_high
    ):
        return "High Confidence"

    if (
        n_obs >= config.min_obs_medium
        and price_cv >= config.min_cv_medium
        and p_value < config.alpha_medium
    ):
        return "Medium Confidence"

    if n_obs >= config.min_obs_low and p_value < config.alpha_low:
        return "Low Confidence"

    return "Insufficient Data"


# ---------------------------------------------------------------------------
# Product-Level Elasticity Estimation
# ---------------------------------------------------------------------------

def estimate_product_elasticity(
    df: pd.DataFrame,
    config: ElasticityConfig,
    sku_col: str = "sku_id",
    price_col: str = "price",
    demand_col: str = "units_sold",
) -> pd.DataFrame:
    """
    Estimates price elasticity for each SKU using log-log OLS with controls.

    For each SKU:
      1. Subsets data to that SKU (across all stores — more observations).
      2. Runs controlled log-log OLS using ElasticityRegressionEngine.
      3. Runs robust RLM for sensitivity check.
      4. Classifies reliability using documented thresholds.

    Returns a DataFrame with one row per SKU.
    """
    if sku_col not in df.columns:
        raise ValueError(f"SKU column '{sku_col}' not found in DataFrame.")

    skus = df[sku_col].dropna().unique()
    results = []

    # Identify available controls
    control_cols = [c for c in config.control_cols if c in df.columns]

    for sku in sorted(skus):
        sku_df = df[df[sku_col] == sku].copy()

        sku_name = (
            sku_df["sku_name"].iloc[0]
            if "sku_name" in sku_df.columns
            else sku
        )
        category = (
            sku_df["category"].iloc[0]
            if "category" in sku_df.columns
            else None
        )

        # OLS estimate
        ols_result = ElasticityRegressionEngine.fit_log_log_ols(
            sku_df,
            price_col=price_col,
            demand_col=demand_col,
            control_cols=control_cols,
        )

        # Robust RLM estimate (bivariate only — no controls)
        rlm_result = ElasticityRegressionEngine.fit_robust_rlm(
            sku_df,
            price_col=price_col,
            demand_col=demand_col,
        )

        # Reliability classification
        reliability = classify_reliability(
            n_obs=ols_result.get("n_obs", 0),
            price_cv=ols_result.get("price_cv_pct", np.nan),
            p_value=ols_result.get("p_value", np.nan),
            ci_width=ols_result.get("ci_width", np.nan),
            config=config,
            status=ols_result.get("status", "ERROR"),
        )

        # Cross-price elasticity
        cross = ols_result.get("cross_price_elasticity") or {}

        row = {
            "sku_id": sku,
            "sku_name": sku_name,
            "category": category,
            # OLS primary estimate
            "elasticity": ols_result.get("elasticity", np.nan),
            "std_error": ols_result.get("std_error", np.nan),
            "p_value": ols_result.get("p_value", np.nan),
            "ci_lower": ols_result.get("ci_lower", np.nan),
            "ci_upper": ols_result.get("ci_upper", np.nan),
            "ci_width": ols_result.get("ci_width", np.nan),
            "r_squared": ols_result.get("r_squared", np.nan),
            "adj_r_squared": ols_result.get("adj_r_squared", np.nan),
            "t_statistic": ols_result.get("t_statistic", np.nan),
            "f_statistic": ols_result.get("f_statistic", np.nan),
            "durbin_watson": ols_result.get("durbin_watson", np.nan),
            "aic": ols_result.get("aic", np.nan),
            "bic": ols_result.get("bic", np.nan),
            # Data quality
            "n_obs": ols_result.get("n_obs", 0),
            "price_cv_pct": ols_result.get("price_cv_pct", np.nan),
            "model_status": ols_result.get("status", "ERROR"),
            # Robust comparison
            "robust_elasticity": rlm_result.get("robust_elasticity", np.nan),
            "robust_p_value": rlm_result.get("robust_p_value", np.nan),
            # Cross-price
            "cross_price_elasticity": cross.get("cross_elasticity", np.nan),
            "cross_price_p_value": cross.get("cross_p_value", np.nan),
            # Reliability
            "reliability": reliability,
        }
        results.append(row)
        logger.info(
            f"[Elasticity] {sku}: elasticity={row['elasticity']:.4f}, "
            f"p={row['p_value']}, reliability={reliability}"
            if not np.isnan(row.get("elasticity") or np.nan)
            else f"[Elasticity] {sku}: {ols_result.get('status')}"
        )

    return pd.DataFrame(results)


# ---------------------------------------------------------------------------
# Category-Level Elasticity
# ---------------------------------------------------------------------------

def estimate_category_elasticity(
    df: pd.DataFrame,
    config: ElasticityConfig,
    category_col: str = "category",
    price_col: str = "price",
    demand_col: str = "units_sold",
) -> pd.DataFrame:
    """
    Estimates elasticity at the category level by pooling all SKUs in each category.
    Less granular than SKU-level but more statistically stable.
    """
    if category_col not in df.columns:
        logger.warning(f"Category column '{category_col}' not found.")
        return pd.DataFrame()

    categories = df[category_col].dropna().unique()
    results = []
    control_cols = [c for c in config.control_cols if c in df.columns]

    for cat in sorted(categories):
        cat_df = df[df[category_col] == cat].copy()
        ols_result = ElasticityRegressionEngine.fit_log_log_ols(
            cat_df,
            price_col=price_col,
            demand_col=demand_col,
            control_cols=control_cols,
        )
        reliability = classify_reliability(
            n_obs=ols_result.get("n_obs", 0),
            price_cv=ols_result.get("price_cv_pct", np.nan),
            p_value=ols_result.get("p_value", np.nan),
            ci_width=ols_result.get("ci_width", np.nan),
            config=config,
            status=ols_result.get("status", "ERROR"),
        )
        results.append({
            "category": cat,
            "elasticity": ols_result.get("elasticity", np.nan),
            "p_value": ols_result.get("p_value", np.nan),
            "ci_lower": ols_result.get("ci_lower", np.nan),
            "ci_upper": ols_result.get("ci_upper", np.nan),
            "r_squared": ols_result.get("r_squared", np.nan),
            "n_obs": ols_result.get("n_obs", 0),
            "price_cv_pct": ols_result.get("price_cv_pct", np.nan),
            "reliability": reliability,
            "model_status": ols_result.get("status", "ERROR"),
        })

    return pd.DataFrame(results)


# ---------------------------------------------------------------------------
# Statistical Test Orchestration
# ---------------------------------------------------------------------------

def run_statistical_tests(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """
    Orchestrates StatisticalAnalyzer tests and returns a dict of result DataFrames.

    Returns:
        {
          'summary_overall':  overall descriptive stats,
          'summary_by_sku':   stats grouped by sku_id,
          'correlations_overall': price-demand Pearson/Spearman,
          'correlations_by_sku':  per-SKU correlations,
          'promotion_impact_overall': t-test / Mann-Whitney overall,
          'promotion_impact_by_sku':  per-SKU promotion tests,
        }
    """
    analyzer = StatisticalAnalyzer()
    results: Dict[str, pd.DataFrame] = {}

    results["summary_overall"] = analyzer.compute_summary_statistics(df)
    results["summary_by_sku"] = analyzer.compute_summary_statistics(
        df, group_col="sku_id"
    )

    results["correlations_overall"] = analyzer.compute_correlations(
        df, x_col="price", y_col="units_sold"
    )
    if "sku_id" in df.columns:
        results["correlations_by_sku"] = analyzer.compute_correlations(
            df, x_col="price", y_col="units_sold", group_col="sku_id"
        )

    if "is_promotion" in df.columns:
        results["promotion_impact_overall"] = analyzer.test_promotion_impact(df)
        if "sku_id" in df.columns:
            results["promotion_impact_by_sku"] = analyzer.test_promotion_impact(
                df, group_col="sku_id"
            )

    return results
