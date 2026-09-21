"""
backend/app/services/elasticity_service.py
------------------------------------------
Service layer for price elasticity analysis (Module 3).
"""

from pathlib import Path
from typing import Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.services.product_service import get_product_by_id_or_sku
from app.repositories.analytics_repo import get_elasticity
from app.schemas.elasticity import ElasticityResponse

ROOT_DIR = Path(__file__).resolve().parents[3]
ELASTICITY_CSV = ROOT_DIR / "reports" / "elasticity_summary.csv"

_cached_elasticity_df = None


def _load_elasticity_report() -> Optional[pd.DataFrame]:
    global _cached_elasticity_df
    if _cached_elasticity_df is None and ELASTICITY_CSV.exists():
        _cached_elasticity_df = pd.read_csv(ELASTICITY_CSV)
    return _cached_elasticity_df


def get_product_elasticity(
    db: Session,
    product_identifier: str,
) -> ElasticityResponse:
    """Get elasticity analysis for a product."""
    product = get_product_by_id_or_sku(db, product_identifier)
    if not product:
        raise ValueError(f"Product not found: {product_identifier}")

    sku_id = product.external_product_id

    # Check database
    db_result = get_elasticity(db, product.id)
    if db_result:
        ed = db_result.elasticity
        cat = "inelastic" if abs(ed) < 1.0 else "elastic"
        return ElasticityResponse(
            product_id=product.id,
            external_product_id=product.external_product_id,
            sku_name=product.name,
            category=product.category.name if product.category else "General",
            elasticity=round(db_result.elasticity, 4),
            robust_elasticity=round(db_result.robust_elasticity, 4) if db_result.robust_elasticity is not None else None,
            elasticity_category=cat,
            std_error=round(db_result.std_error, 4) if db_result.std_error is not None else None,
            t_statistic=round(db_result.t_statistic, 4) if db_result.t_statistic is not None else None,
            p_value=round(db_result.p_value, 4) if db_result.p_value is not None else None,
            ci_lower=round(db_result.ci_lower, 4) if db_result.ci_lower is not None else None,
            ci_upper=round(db_result.ci_upper, 4) if db_result.ci_upper is not None else None,
            r_squared=round(db_result.r_squared, 4) if db_result.r_squared is not None else None,
            adj_r_squared=round(db_result.adj_r_squared, 4) if db_result.adj_r_squared is not None else None,
            n_observations=db_result.n_observations,
            reliability=db_result.reliability or "High Confidence",
            methodology=db_result.methodology,
            model_version=db_result.model_version,
        )

    # Fallback to report CSV
    df = _load_elasticity_report()
    if df is not None:
        id_col = "sku_id" if "sku_id" in df.columns else df.columns[0]
        row = df[df[id_col] == sku_id]
        if not row.empty:
            r = row.iloc[0]
            ed = float(r["elasticity"])
            cat = "inelastic" if abs(ed) < 1.0 else "elastic"
            return ElasticityResponse(
                product_id=product.id,
                external_product_id=product.external_product_id,
                sku_name=str(r.get("sku_name", product.name)),
                category=str(r.get("category", product.category.name if product.category else "General")),
                elasticity=round(ed, 4),
                robust_elasticity=round(float(r["robust_elasticity"]), 4) if "robust_elasticity" in r and pd.notna(r["robust_elasticity"]) else None,
                elasticity_category=cat,
                std_error=round(float(r["std_error"]), 4) if "std_error" in r and pd.notna(r["std_error"]) else None,
                t_statistic=round(float(r["t_statistic"]), 4) if "t_statistic" in r and pd.notna(r["t_statistic"]) else None,
                p_value=round(float(r["p_value"]), 4) if "p_value" in r and pd.notna(r["p_value"]) else None,
                ci_lower=round(float(r["ci_lower"]), 4) if "ci_lower" in r and pd.notna(r["ci_lower"]) else None,
                ci_upper=round(float(r["ci_upper"]), 4) if "ci_upper" in r and pd.notna(r["ci_upper"]) else None,
                r_squared=round(float(r["r_squared"]), 4) if "r_squared" in r and pd.notna(r["r_squared"]) else None,
                adj_r_squared=round(float(r["adj_r_squared"]), 4) if "adj_r_squared" in r and pd.notna(r["adj_r_squared"]) else None,
                n_observations=int(r["n_obs"]) if "n_obs" in r and pd.notna(r["n_obs"]) else None,
                reliability=str(r.get("reliability", "High Confidence")),
                methodology="log_log_ols",
                model_version="v1",
            )

    # Default fallback
    return ElasticityResponse(
        product_id=product.id,
        external_product_id=product.external_product_id,
        sku_name=product.name,
        category=product.category.name if product.category else "General",
        elasticity=-1.0,
        elasticity_category="unit_elastic",
        reliability="Estimated",
        methodology="default",
        model_version="v1",
    )
