"""
PriceMind AI — Elasticity Report Generator
Produces final CSV and Markdown summary reports from elasticity estimation results.
"""

from pathlib import Path
from typing import Dict, Optional
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Report column display order
PRODUCT_REPORT_COLS = [
    "sku_id",
    "sku_name",
    "category",
    "elasticity",
    "robust_elasticity",
    "std_error",
    "t_statistic",
    "p_value",
    "ci_lower",
    "ci_upper",
    "ci_width",
    "r_squared",
    "adj_r_squared",
    "durbin_watson",
    "cross_price_elasticity",
    "cross_price_p_value",
    "n_obs",
    "price_cv_pct",
    "reliability",
    "model_status",
]

CATEGORY_REPORT_COLS = [
    "category",
    "elasticity",
    "p_value",
    "ci_lower",
    "ci_upper",
    "r_squared",
    "n_obs",
    "price_cv_pct",
    "reliability",
    "model_status",
]


def _safe_col_order(df: pd.DataFrame, cols: list) -> pd.DataFrame:
    """Returns df with only existing columns in the specified order."""
    ordered = [c for c in cols if c in df.columns]
    remaining = [c for c in df.columns if c not in ordered]
    return df[ordered + remaining]


def generate_elasticity_report(
    product_elasticity: pd.DataFrame,
    category_elasticity: Optional[pd.DataFrame],
    statistical_tests: Dict[str, pd.DataFrame],
    output_dir: str | Path,
) -> Dict[str, Path]:
    """
    Writes elasticity results to CSV files and generates a markdown summary.

    Output files:
        reports/elasticity_summary.csv     — per-SKU elasticity estimates
        reports/elasticity_categories.csv  — per-category elasticity estimates
        reports/statistical_analysis.csv   — price-demand correlations per SKU
        reports/promotion_impact.csv       — promotion lift test results per SKU
        reports/elasticity_report.md       — human-readable markdown summary

    Returns:
        dict mapping report names to their absolute file Paths.
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    written: Dict[str, Path] = {}

    # 1. Product-level elasticity CSV
    if not product_elasticity.empty:
        sku_df = _safe_col_order(product_elasticity, PRODUCT_REPORT_COLS)
        p = output_path / "elasticity_summary.csv"
        sku_df.to_csv(p, index=False, float_format="%.4f")
        written["elasticity_summary"] = p
        logger.info(f"Wrote {p}")

    # 2. Category-level elasticity CSV
    if category_elasticity is not None and not category_elasticity.empty:
        cat_df = _safe_col_order(category_elasticity, CATEGORY_REPORT_COLS)
        p = output_path / "elasticity_categories.csv"
        cat_df.to_csv(p, index=False, float_format="%.4f")
        written["elasticity_categories"] = p
        logger.info(f"Wrote {p}")

    # 3. Correlation results CSV
    corr_key = "correlations_by_sku"
    if corr_key in statistical_tests and not statistical_tests[corr_key].empty:
        p = output_path / "statistical_analysis.csv"
        statistical_tests[corr_key].to_csv(p, index=False, float_format="%.6f")
        written["statistical_analysis"] = p
        logger.info(f"Wrote {p}")

    # 4. Promotion impact CSV
    promo_key = "promotion_impact_by_sku"
    if promo_key in statistical_tests and not statistical_tests[promo_key].empty:
        p = output_path / "promotion_impact.csv"
        statistical_tests[promo_key].to_csv(p, index=False, float_format="%.4f")
        written["promotion_impact"] = p
        logger.info(f"Wrote {p}")

    # 5. Markdown report
    md_path = _write_markdown_report(
        product_elasticity,
        category_elasticity,
        statistical_tests,
        output_path,
    )
    written["elasticity_report_md"] = md_path

    return written


def _write_markdown_report(
    product_elasticity: pd.DataFrame,
    category_elasticity: Optional[pd.DataFrame],
    statistical_tests: Dict[str, pd.DataFrame],
    output_path: Path,
) -> Path:
    """Generates the human-readable markdown summary report."""
    lines = [
        "# PriceMind AI — Price Elasticity Report",
        "",
        "> This report is generated automatically by `ml/elasticity/elasticity_report.py`.",
        "> All elasticity estimates are based on log-log OLS regression with available controls.",
        "> Reliability labels are assigned using documented, configurable thresholds (see `ElasticityConfig`).",
        "> Correlation does not imply causation.",
        "",
    ]

    # --- SKU-level summary ---
    lines.append("## Product-Level Elasticity Estimates")
    lines.append("")

    if not product_elasticity.empty:
        reliability_counts = product_elasticity["reliability"].value_counts()

        lines.append("### Reliability Distribution")
        lines.append("")
        lines.append("| Reliability | Count |")
        lines.append("|-------------|-------|")
        for tier, count in reliability_counts.items():
            lines.append(f"| {tier} | {count} |")
        lines.append("")

        lines.append("### Estimates by Product")
        lines.append("")
        lines.append(
            "| SKU | Category | Elasticity | 95% CI | p-value | R² | Reliability |"
        )
        lines.append(
            "|-----|----------|------------|--------|---------|-----|-------------|"
        )
        for _, row in product_elasticity.iterrows():
            sku = row.get("sku_id", "—")
            cat = row.get("category", "—")
            elast = f"{row['elasticity']:.4f}" if not _isnan(row.get("elasticity")) else "N/A"
            ci = (
                f"[{row['ci_lower']:.3f}, {row['ci_upper']:.3f}]"
                if not (_isnan(row.get("ci_lower")) or _isnan(row.get("ci_upper")))
                else "N/A"
            )
            pval = f"{row['p_value']:.4f}" if not _isnan(row.get("p_value")) else "N/A"
            r2 = f"{row['r_squared']:.4f}" if not _isnan(row.get("r_squared")) else "N/A"
            rel = row.get("reliability", "—")
            lines.append(f"| {sku} | {cat} | {elast} | {ci} | {pval} | {r2} | {rel} |")

        lines.append("")

        # Interpretation note
        lines.append("### Notes on Interpretation")
        lines.append("")
        lines.append(
            "- **Negative elasticity** indicates demand falls when price rises (normal goods)."
        )
        lines.append(
            "- **|E| > 1** indicates elastic demand; **|E| < 1** indicates inelastic demand."
        )
        lines.append(
            "- Estimates are based on observational transaction data; causal inference requires additional assumptions."
        )
        lines.append(
            "- Products with **Insufficient Data** have too few price variation points for reliable estimation."
        )
        lines.append("")

    # --- Category-level ---
    if category_elasticity is not None and not category_elasticity.empty:
        lines.append("## Category-Level Elasticity")
        lines.append("")
        lines.append("| Category | Elasticity | p-value | R² | n_obs | Reliability |")
        lines.append("|----------|------------|---------|-----|-------|-------------|")
        for _, row in category_elasticity.iterrows():
            cat = row.get("category", "—")
            elast = f"{row['elasticity']:.4f}" if not _isnan(row.get("elasticity")) else "N/A"
            pval = f"{row['p_value']:.4f}" if not _isnan(row.get("p_value")) else "N/A"
            r2 = f"{row['r_squared']:.4f}" if not _isnan(row.get("r_squared")) else "N/A"
            n = int(row.get("n_obs", 0))
            rel = row.get("reliability", "—")
            lines.append(f"| {cat} | {elast} | {pval} | {r2} | {n} | {rel} |")
        lines.append("")

    # --- Correlations ---
    corr_df = statistical_tests.get("correlations_by_sku")
    if corr_df is not None and not corr_df.empty:
        lines.append("## Price–Demand Correlations (Per SKU)")
        lines.append("")
        lines.append("| SKU | n | Pearson r | Pearson p | Spearman ρ | Spearman p | Significant (α=0.05) |")
        lines.append("|-----|---|-----------|-----------|------------|------------|----------------------|")
        for _, row in corr_df.iterrows():
            grp = row.get("group", "—")
            n = int(row.get("n_obs", 0))
            pr = f"{row['pearson_r']:.4f}" if not _isnan(row.get("pearson_r")) else "N/A"
            pp = f"{row['pearson_p']:.4f}" if not _isnan(row.get("pearson_p")) else "N/A"
            sr = f"{row['spearman_rho']:.4f}" if not _isnan(row.get("spearman_rho")) else "N/A"
            sp = f"{row['spearman_p']:.4f}" if not _isnan(row.get("spearman_p")) else "N/A"
            sig = "✓" if row.get("is_significant_05") else "✗"
            lines.append(f"| {grp} | {n} | {pr} | {pp} | {sr} | {sp} | {sig} |")
        lines.append("")

    # --- Promotion impact ---
    promo_df = statistical_tests.get("promotion_impact_by_sku")
    if promo_df is not None and not promo_df.empty:
        lines.append("## Promotion Impact on Demand")
        lines.append("")
        lines.append(
            "| SKU | n(promo) | n(non-promo) | Mean(promo) | Mean(non-promo) | Lift% | t-test p | Significant |"
        )
        lines.append(
            "|-----|----------|--------------|-------------|-----------------|-------|----------|-------------|"
        )
        for _, row in promo_df.iterrows():
            grp = row.get("group", "—")
            np_ = int(row.get("n_promo", 0))
            nnp = int(row.get("n_non_promo", 0))
            mp = f"{row['mean_promo_demand']:.2f}" if not _isnan(row.get("mean_promo_demand")) else "N/A"
            mnp = f"{row['mean_non_promo_demand']:.2f}" if not _isnan(row.get("mean_non_promo_demand")) else "N/A"
            lift = f"{row['lift_pct']:.1f}%" if not _isnan(row.get("lift_pct")) else "N/A"
            tp = f"{row['ttest_p']:.4f}" if not _isnan(row.get("ttest_p")) else "N/A"
            sig = "✓" if row.get("significant_lift") else "✗"
            lines.append(f"| {grp} | {np_} | {nnp} | {mp} | {mnp} | {lift} | {tp} | {sig} |")
        lines.append("")

    lines.append("---")
    lines.append("*Generated by PriceMind AI — ml/elasticity/elasticity_report.py*")

    md_text = "\n".join(lines)
    p = output_path / "elasticity_report.md"
    p.write_text(md_text, encoding="utf-8")
    logger.info(f"Wrote {p}")
    return p


def _isnan(v) -> bool:
    """Safe NaN check for mixed types."""
    try:
        return v is None or np.isnan(float(v))
    except (TypeError, ValueError):
        return True
