from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Dict, Any

class KPIResponse(BaseModel):
    id: str
    label: str
    value: float | str
    unit: str
    delta: float
    deltaPeriod: str
    deltaType: str
    historicalSparkline: List[float]
    forecastValue: Optional[float] = None
    confidenceInterval: Optional[Tuple[float, float]] = None
    tooltipExplanation: str

class SKUResponse(BaseModel):
    id: str
    skuCode: str
    name: str
    category: str
    channel: str
    currentPrice: float
    costPrice: float
    marginPercent: float
    currentVelocity: int
    inventoryStock: int
    daysOfInventory: int
    elasticityScore: float
    elasticityCategory: str
    competitorMinPrice: float
    competitorAvgPrice: float
    competitorMaxPrice: float
    pricePosition: str
    revenueRiskScore: int
    recommendedPrice: Optional[float] = None
    projectedUpliftPercent: Optional[float] = None

class RecommendationResponse(BaseModel):
    id: str
    skuId: str
    skuCode: str
    skuName: str
    category: str
    channel: str
    currentPrice: float
    recommendedPrice: float
    priceDeltaPercent: float
    currentMarginPercent: float
    projectedMarginPercent: float
    projectedRevenueDelta: float
    projectedVolumeDeltaPercent: float
    confidenceScore: float
    urgency: str
    status: str
    primaryDriver: str
    rationale: str
    guardrailChecks: Dict[str, Any]
    elasticityAtPoint: float
    shapAttribution: List[Dict[str, Any]]
    appliedAt: Optional[str] = None

class ElasticityPoint(BaseModel):
    price: float
    demandUnits: int
    revenue: float
    grossMarginDollars: float
    grossMarginPercent: float
    isCurrent: bool
    isOptimalRevenue: bool
    isOptimalMargin: bool

class SimulationParams(BaseModel):
    basePriceMultiplier: float = Field(default=1.0, ge=0.5, le=2.0)
    competitorReactionMultiplier: float = Field(default=1.0, ge=0.5, le=2.0)
    costInflationMultiplier: float = Field(default=1.0, ge=0.8, le=2.0)
    macroDemandShiftPercent: float = Field(default=0.0, ge=-50.0, le=50.0)

class SimulationResponse(BaseModel):
    id: str
    name: str
    description: str
    basePriceMultiplier: float
    competitorReactionMultiplier: float
    costInflationMultiplier: float
    macroDemandShiftPercent: float
    projectedRevenue: float
    projectedGrossProfit: float
    projectedVolume: int
    revenueDeltaPercent: float
    marginDeltaBps: int
    volumeDeltaPercent: float
    confidenceLowerBound: float
    confidenceUpperBound: float
    timelineForecast: List[Dict[str, Any]]

class AssistantQuery(BaseModel):
    prompt: str

class AssistantResponse(BaseModel):
    id: str
    sender: str
    timestamp: str
    content: str
    recommendationsAttached: Optional[List[RecommendationResponse]] = None
    suggestedPrompts: Optional[List[str]] = None
