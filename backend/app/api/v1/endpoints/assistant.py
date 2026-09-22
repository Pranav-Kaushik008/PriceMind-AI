from fastapi import APIRouter, Depends
from typing import Optional
from app.schemas.pricing import AssistantQuery, AssistantResponse
from app.api.v1.endpoints.recommendations import MOCK_RECOMMENDATIONS
from app.core.deps import get_optional_current_user
from app.models.user import User
from rag.service import rag_service
from datetime import datetime, UTC

router = APIRouter()

@router.post("/query", response_model=AssistantResponse)
def query_assistant(
    payload: AssistantQuery,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Query the natural language AI pricing assistant with RAG grounding."""
    p = payload.prompt.lower()
    attached = None

    if "sku-8921" in p or "calibrator" in p:
        content = "**SKU-8921-PRO Analysis**:\n- **Inelasticity ($E_d = -0.62$)**: High pricing power.\n- **Competitor Spread**: Apex Industrial raised to $435.00.\n- **Recommendation**: +7.7% increase to $419.00."
        attached = [MOCK_RECOMMENDATIONS[0]]
    elif "inelastic" in p or "top" in p:
        content = "**Top Inelastic SKUs**:\n1. SKU-6109-OPT ($E_d = -0.38$)\n2. SKU-8921-PRO ($E_d = -0.62$)\n\nNet potential margin lift: **+$102.1K/mo**."
        attached = MOCK_RECOMMENDATIONS[:2]
    else:
        # Check if RAG knowledge base has relevant answers for policies/methodology/constraints
        rag_answer = rag_service.query(question=payload.prompt)
        if rag_answer.is_grounded and rag_answer.confidence_score > 0.05:
            content = rag_answer.answer
        else:
            content = "Portfolio elasticity is healthy at **-1.34**. 18 actionable recommendations are pending review."

    now = datetime.now(UTC)
    return {
        "id": f"msg-{int(now.timestamp())}",
        "sender": "assistant",
        "timestamp": now.strftime("%I:%M %p"),
        "content": content,
        "recommendationsAttached": attached,
        "suggestedPrompts": [
            "Why did SKU-8921-PRO recommend +7.7%?",
            "What is the corporate margin floor policy?",
            "How does SHAP explain pricing recommendations?",
        ],
    }

