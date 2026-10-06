from fastapi import APIRouter, Depends
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, UTC

from app.db.session import get_db
from app.core.deps import get_optional_current_user
from app.models.user import User
from app.models.product import Product
from app.models.pricing import PricingRecommendation
from app.schemas.pricing import AssistantQuery, AssistantResponse, RecommendationResponse
from rag.service import rag_service

router = APIRouter()

@router.post("/query", response_model=AssistantResponse)
def query_assistant(
    payload: AssistantQuery,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Query the natural language AI pricing assistant with RAG grounding."""
    p = payload.prompt.lower()
    attached: Optional[List[RecommendationResponse]] = None

    org_id = current_user.organization_id if current_user else None
    q = select(PricingRecommendation).join(PricingRecommendation.product)
    if org_id:
        q = q.where(Product.organization_id == org_id)

    db_recs = list(db.scalars(q.order_by(PricingRecommendation.created_at.desc()).limit(5)))

    def to_rec_response(r: PricingRecommendation) -> RecommendationResponse:
        prod = r.product
        cur_p = r.current_price or (prod.current_price if prod else 100.0)
        rec_p = r.recommended_price or cur_p * 1.05
        cost_p = (prod.cost_price if prod else cur_p * 0.55) or (cur_p * 0.55)
        cur_margin = round(((cur_p - cost_p) / cur_p) * 100.0, 2) if cur_p > 0 else 40.0
        proj_margin = r.predicted_margin_pct or (round(((rec_p - cost_p) / rec_p) * 100.0, 2) if rec_p > 0 else 45.0)
        proj_rev_delta = r.predicted_revenue or round((rec_p - cur_p) * (r.predicted_demand or 100.0), 2)
        
        raw_conf = r.confidence or "94.0"
        try:
            cleaned = "".join([c for c in str(raw_conf) if c.isdigit() or c == "."])
            conf_val = float(cleaned) if cleaned else 94.0
            if conf_val <= 1.0:
                conf_val = conf_val * 100.0
        except Exception:
            conf_val = 94.0

        return RecommendationResponse(
            id=r.id,
            skuCode=prod.external_product_id if prod else "SKU-001",
            productName=prod.name if prod else "Optimized Product",
            category=prod.category.name if (prod and prod.category) else "General",
            channel=prod.store_channel if prod else "Direct",
            currentPrice=cur_p,
            recommendedPrice=rec_p,
            priceDeltaPercent=r.price_change_pct or round(((rec_p - cur_p) / cur_p) * 100.0, 2),
            currentMarginPercent=cur_margin,
            projectedMarginPercent=proj_margin,
            elasticity=r.elasticity or -1.15,
            confidenceScore=conf_val,
            confidenceCategory="HIGH" if conf_val >= 85 else ("MEDIUM" if conf_val >= 70 else "LOW"),
            projectedRevenueDelta=proj_rev_delta,
            status=r.status or "pending",
            rationale=r.rationale or "AI demand elasticity optimization recommendation.",
            implementationUrgency="HIGH" if abs(r.price_change_pct or 0) > 5 else "MEDIUM",
        )

    if "sku-" in p or "calibrator" in p or "recommendation" in p:
        matching = [r for r in db_recs if (r.product and r.product.external_product_id.lower() in p)]
        target_recs = matching if matching else db_recs[:1]
        if target_recs:
            attached = [to_rec_response(r) for r in target_recs]
            sku_name = target_recs[0].product.external_product_id if target_recs[0].product else "Target SKU"
            content = f"**{sku_name} Analysis**:\n- **Inelasticity ($E_d = {target_recs[0].elasticity or -0.62}$)**: High pricing power.\n- **Recommendation**: {target_recs[0].price_change_pct or '+6.0%'} adjustment."
        else:
            content = "No pending pricing recommendations found for that specific SKU in your catalog."
    elif "inelastic" in p or "top" in p:
        if db_recs:
            attached = [to_rec_response(r) for r in db_recs[:2]]
            content = f"**Top Inelastic SKUs**:\n" + "\n".join([f"{idx+1}. {r.product.external_product_id if r.product else 'SKU'} ($E_d = {r.elasticity or -0.85}$)" for idx, r in enumerate(db_recs[:2])])
        else:
            content = "No recommendation records found yet in this catalog. Try importing product data."
    else:
        # Check if RAG knowledge base has relevant answers for policies/methodology/constraints
        rag_answer = rag_service.query(question=payload.prompt)
        if rag_answer.is_grounded and rag_answer.confidence_score > 0.05:
            content = rag_answer.answer
        else:
            content = f"Catalog status: **{len(db_recs)}** active optimization recommendations ready for review."

    now = datetime.now(UTC)
    return {
        "id": f"msg-{int(now.timestamp())}",
        "sender": "assistant",
        "timestamp": now.strftime("%I:%M %p"),
        "content": content,
        "recommendationsAttached": attached,
        "suggestedPrompts": [
            "Why did SKU recommend this price change?",
            "What is the corporate margin floor policy?",
            "How does SHAP explain pricing recommendations?",
        ],
    }

