from fastapi import APIRouter
from app.schemas.pricing import AssistantQuery, AssistantResponse
from app.api.v1.endpoints.recommendations import MOCK_RECOMMENDATIONS
from datetime import datetime

router = APIRouter()

@router.post("/query", response_model=AssistantResponse)
def query_assistant(payload: AssistantQuery):
    """Query the natural language AI pricing assistant."""
    p = payload.prompt.lower()
    attached = None

    if "sku-8921" in p or "calibrator" in p:
        content = "**SKU-8921-PRO Analysis**:\n- **Inelasticity ($E_d = -0.62$)**: High pricing power.\n- **Competitor Spread**: Apex Industrial raised to $435.00.\n- **Recommendation**: +7.7% increase to $419.00."
        attached = [MOCK_RECOMMENDATIONS[0]]
    elif "inelastic" in p or "top" in p:
        content = "**Top Inelastic SKUs**:\n1. SKU-6109-OPT ($E_d = -0.38$)\n2. SKU-8921-PRO ($E_d = -0.62$)\n\nNet potential margin lift: **+$102.1K/mo**."
        attached = MOCK_RECOMMENDATIONS[:2]
    else:
        content = "Portfolio elasticity is healthy at **-1.34**. 18 actionable recommendations are pending review."

    return {
        "id": f"msg-{int(datetime.utcnow().timestamp())}",
        "sender": "assistant",
        "timestamp": datetime.utcnow().strftime("%I:%M %p"),
        "content": content,
        "recommendationsAttached": attached,
        "suggestedPrompts": [
            "Why did SKU-8921-PRO recommend +7.7%?",
            "Show highest elasticity risk items",
            "Simulate a +5% inflation scenario",
        ],
    }
