"""
PriceMind AI — Statistical Analysis Suite
Computes descriptive statistics, parametric/non-parametric correlations, and hypothesis tests.
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from scipy import stats
import logging

logger = logging.getLogger(__name__)


class StatisticalAnalyzer:
    """
    Robust descriptive and inferential statistical testing for pricing and demand telemetry.
    """

    @staticmethod
    def compute_summary_statistics(
        df: pd.DataFrame,
        numeric_cols: Optional[List[str]] = None,
        group_col: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Calculates mean, median, std, min, max, IQR, and Coefficient of Variation (CV).
        """
        cols = numeric_cols or ["price", "units_sold", "revenue", "competitor_price", "inventory_level"]
        available_cols = [c for c in cols if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]

        if not available_cols:
            return pd.DataFrame()

        def _calc_stats(series: pd.Series) -> Dict[str, float]:
            s = series.dropna()
            if len(s) == 0:
                return {}
            mean_val = float(s.mean())
            std_val = float(s.std(ddof=1)) if len(s) > 1 else 0.0
            q25 = float(s.quantile(0.25))
            q75 = float(s.quantile(0.75))
            return {
                "count": int(len(s)),
                "mean": round(mean_val, 4),
                "std": round(std_val, 4),
                "cv_pct": round((std_val / abs(mean_val) * 100) if mean_val != 0 else 0.0, 2),
                "min": round(float(s.min()), 4),
                "q25": round(q25, 4),
                "median": round(float(s.median()), 4),
                "q75": round(q75, 4),
                "max": round(float(s.max()), 4),
                "iqr": round(q75 - q25, 4),
                "skewness": round(float(stats.skew(s)), 4) if len(s) > 2 else 0.0,
            }

        if group_col and group_col in df.columns:
            rows = []
            for grp, sub_df in df.groupby(group_col):
                for col in available_cols:
                    st = _calc_stats(sub_df[col])
                    st[group_col] = grp
                    st["metric"] = col
                    rows.append(st)
            return pd.DataFrame(rows)

        rows = []
        for col in available_cols:
            st = _calc_stats(df[col])
            st["metric"] = col
            rows.append(st)
        return pd.DataFrame(rows)

    @staticmethod
    def compute_correlations(
        df: pd.DataFrame,
        x_col: str = "price",
        y_col: str = "units_sold",
        group_col: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Calculates Pearson (linear) and Spearman (monotonic rank) correlations with p-values.
        """
        if x_col not in df.columns or y_col not in df.columns:
            raise ValueError(f"Columns '{x_col}' and/or '{y_col}' missing from DataFrame.")

        def _calc_corr(sub: pd.DataFrame, grp_val=None) -> Dict[str, Any]:
            valid = sub[[x_col, y_col]].dropna()
            n = len(valid)
            if n < 3:
                return {
                    "group": grp_val,
                    "n_obs": n,
                    "pearson_r": np.nan,
                    "pearson_p": np.nan,
                    "spearman_rho": np.nan,
                    "spearman_p": np.nan,
                    "is_significant_05": False,
                }

            p_r, p_p = stats.pearsonr(valid[x_col], valid[y_col])
            s_rho, s_p = stats.spearmanr(valid[x_col], valid[y_col])

            return {
                "group": grp_val,
                "n_obs": n,
                "pearson_r": round(float(p_r), 4),
                "pearson_p": round(float(p_p), 6),
                "spearman_rho": round(float(s_rho), 4),
                "spearman_p": round(float(s_p), 6),
                "is_significant_05": bool(p_p < 0.05),
            }

        if group_col and group_col in df.columns:
            results = [_calc_corr(sub_df, grp) for grp, sub_df in df.groupby(group_col)]
        else:
            results = [_calc_corr(df, "OVERALL")]

        return pd.DataFrame(results)

    @staticmethod
    def test_promotion_impact(
        df: pd.DataFrame,
        promo_col: str = "is_promotion",
        demand_col: str = "units_sold",
        group_col: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Performs two-sample Welch's t-test and Mann-Whitney U test comparing promo vs non-promo demand.
        """
        if promo_col not in df.columns or demand_col not in df.columns:
            return pd.DataFrame()

        def _test_group(sub: pd.DataFrame, grp_val=None) -> Dict[str, Any]:
            promo_d = sub[sub[promo_col] == 1][demand_col].dropna()
            non_promo_d = sub[sub[promo_col] == 0][demand_col].dropna()

            n_promo = len(promo_d)
            n_non_promo = len(non_promo_d)

            if n_promo < 2 or n_non_promo < 2:
                return {
                    "group": grp_val,
                    "n_promo": n_promo,
                    "n_non_promo": n_non_promo,
                    "mean_promo_demand": round(float(promo_d.mean()), 2) if n_promo > 0 else np.nan,
                    "mean_non_promo_demand": round(float(non_promo_d.mean()), 2) if n_non_promo > 0 else np.nan,
                    "ttest_stat": np.nan,
                    "ttest_p": np.nan,
                    "mannwhitney_p": np.nan,
                    "significant_lift": False,
                }

            t_stat, t_p = stats.ttest_ind(promo_d, non_promo_d, equal_var=False)
            u_stat, u_p = stats.mannwhitneyu(promo_d, non_promo_d, alternative="two-sided")

            mean_p = float(promo_d.mean())
            mean_np = float(non_promo_d.mean())
            lift_pct = ((mean_p - mean_np) / mean_np * 100) if mean_np > 0 else 0.0

            return {
                "group": grp_val,
                "n_promo": n_promo,
                "n_non_promo": n_non_promo,
                "mean_promo_demand": round(mean_p, 2),
                "mean_non_promo_demand": round(mean_np, 2),
                "lift_pct": round(lift_pct, 2),
                "ttest_stat": round(float(t_stat), 4),
                "ttest_p": round(float(t_p), 6),
                "mannwhitney_p": round(float(u_p), 6),
                "significant_lift": bool(t_p < 0.05 and lift_pct > 0),
            }

        if group_col and group_col in df.columns:
            results = [_test_group(sub_df, grp) for grp, sub_df in df.groupby(group_col)]
        else:
            results = [_test_group(df, "OVERALL")]

        return pd.DataFrame(results)
