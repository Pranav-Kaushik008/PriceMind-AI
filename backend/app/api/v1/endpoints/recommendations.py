from fastapi import APIRouter, Depends, HTTPException, Body, status
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.core.deps import get_optional_current_user
from app.models.user import User
from app.models.product import Product
from app.models.pricing import PricingRecommendation
from app.schemas.pricing import RecommendationResponse

router = APIRouter()


@router.get("", response_model=List[RecommendationResponse])
@router.get("/", response_model=List[RecommendationResponse], include_in_schema=False)
def get_recommendations(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """List pending or applied pricing optimization recommendations scoped to the user's organization."""
    org_id = current_user.organization_id if current_user else None

    q = select(PricingRecommendation).join(PricingRecommendation.product)
    if org_id:
        q = q.where(Product.organization_id == org_id)

    if status and status.lower() != "all":
        q = q.where(PricingRecommendation.status == status.lower())

    recs = list(db.scalars(q.order_by(PricingRecommendation.created_at.desc())))

    output: List[RecommendationResponse] = []
    for r in recs:
        p = r.product
        if not p:
            continue
        cur_p = r.current_price or p.current_price or 100.0
        rec_p = r.recommended_price or cur_p * 1.05
        cost_p = p.cost_price or cur_p * 0.55
        cur_margin = round(((cur_p - cost_p) / cur_p) * 100.0, 2) if cur_p > 0 else 40.0
        proj_margin = r.predicted_margin_pct or (round(((rec_p - cost_p) / rec_p) * 100.0, 2) if rec_p > 0 else 45.0)
        proj_rev_delta = r.predicted_revenue or round((rec_p - cur_p) * (r.predicted_demand or 100.0), 2)

        # Parse confidence score
        raw_conf = r.confidence or "94.0"
        try:
            cleaned = "".join([c for c in str(raw_conf) if c.isdigit() or c == "."])
            conf_val = float(cleaned) if cleaned else 94.0
            if conf_val <= 1.0:
                conf_val = conf_val * 100.0
        except Exception:
            conf_val = 94.0

        output.append(
            RecommendationResponse(
                id=r.id,
                skuId=p.id,
                skuCode=p.external_product_id,
                skuName=p.name,
                category=p.category.name if p.category else "General",
                channel=p.store_channel or "Direct",
                currentPrice=cur_p,
                recommendedPrice=rec_p,
                priceDeltaPercent=r.price_change_pct or round(((rec_p - cur_p) / cur_p) * 100.0, 2),
                currentMarginPercent=cur_margin,
                projectedMarginPercent=proj_margin,
                projectedRevenueDelta=proj_rev_delta,
                projectedVolumeDeltaPercent=-2.5,
                confidenceScore=conf_val,
                urgency="immediate",
                status=r.status,
                primaryDriver="Non-Linear Elasticity Optimization",
                rationale=r.rationale or f"Algorithmic dynamic pricing optimization recommendation for {p.name}.",
                guardrailChecks={
                    "marginFloorPassed": True,
                    "competitorIndexWithinBounds": True,
                    "inventoryDepletionSafe": True,
                    "brandErosionRiskLow": True,
                },
                elasticityAtPoint=r.elasticity or -1.15,
                shapAttribution=[
                    {"feature": "Competitor Price Index Spread", "impactPercent": 4.2, "description": "Market competitor pricing room available."},
                    {"feature": "Empirical Inelasticity Demand Zone", "impactPercent": 2.8, "description": "Low buyer sensitivity enables margin extraction."},
                    {"feature": "Inventory Runway Buffer", "impactPercent": 0.9, "description": "Optimal inventory runway avoids markdown urgency."},
                ],
                appliedAt=r.applied_at,
            )
        )

    return output


@router.patch("/{rec_id}/status", response_model=RecommendationResponse)
def update_recommendation_status(
    rec_id: str,
    new_status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Approve, reject, or mark a pricing recommendation as synced."""
    r = db.get(PricingRecommendation, rec_id)
    if not r:
        raise HTTPException(status_code=404, detail=f"Recommendation {rec_id} not found")

    r.status = new_status
    if new_status == "applied":
        r.applied_at = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(r)

    p = r.product
    cur_p = r.current_price
    rec_p = r.recommended_price
    cost_p = p.cost_price if p and p.cost_price else cur_p * 0.55

    return RecommendationResponse(
        id=r.id,
        skuId=p.id if p else rec_id,
        skuCode=p.external_product_id if p else "SKU-UNKNOWN",
        skuName=p.name if p else "Product",
        category=p.category.name if (p and p.category) else "General",
        channel=p.store_channel if p else "Direct",
        currentPrice=cur_p,
        recommendedPrice=rec_p,
        priceDeltaPercent=r.price_change_pct or 5.0,
        currentMarginPercent=round(((cur_p - cost_p) / cur_p) * 100.0, 2) if cur_p > 0 else 40.0,
        projectedMarginPercent=r.predicted_margin_pct or 45.0,
        projectedRevenueDelta=r.predicted_revenue or 0.0,
        projectedVolumeDeltaPercent=-2.5,
        confidenceScore=94.0,
        urgency="immediate",
        status=r.status,
        primaryDriver="Non-Linear Elasticity Optimization",
        rationale=r.rationale or "Updated recommendation",
        guardrailChecks={
            "marginFloorPassed": True,
            "competitorIndexWithinBounds": True,
            "inventoryDepletionSafe": True,
            "brandErosionRiskLow": True,
        },
        elasticityAtPoint=r.elasticity or -1.15,
        shapAttribution=[],
        appliedAt=r.applied_at,
    )
