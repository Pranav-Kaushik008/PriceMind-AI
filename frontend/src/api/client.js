import {
  mockExecutiveKPIs,
  mockSKUs,
  mockRecommendations,
  mockElasticityCurves,
  mockCompetitorTelemetry,
  mockSimulations,
  mockModelTelemetry,
} from '../mock/mockData';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  async getExecutiveKPIs() {
    await delay(120);
    return [...mockExecutiveKPIs];
  },

  async getSKUs(categoryFilter, search) {
    await delay(140);
    let list = [...mockSKUs];
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter((s) => s.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.skuCode.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    return list;
  },

  async getSKUById(id) {
    await delay(80);
    return mockSKUs.find((s) => s.id === id || s.skuCode === id);
  },

  async getRecommendations(statusFilter) {
    await delay(150);
    let list = [...mockRecommendations];
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list;
  },

  async updateRecommendationStatus(recId, status) {
    await delay(200);
    const rec = mockRecommendations.find((r) => r.id === recId);
    if (!rec) throw new Error(`Recommendation ${recId} not found`);
    rec.status = status;
    if (status === 'applied') {
      rec.appliedAt = new Date().toISOString();
    }
    return { ...rec };
  },

  async getElasticityCurve(skuCode) {
    await delay(120);
    return mockElasticityCurves[skuCode] || mockElasticityCurves['SKU-8921-PRO'];
  },

  async getCompetitorTelemetry() {
    await delay(140);
    return [...mockCompetitorTelemetry];
  },

  async getSimulations() {
    await delay(120);
    return [...mockSimulations];
  },

  async runCustomSimulation(params) {
    await delay(280);
    const baseRev = 48920400;
    const baseCogs = 28471673;
    const baseVolume = 124500;

    const priceDeltaPct = (params.basePriceMultiplier - 1) * 100;
    const competitorDeltaPct = (params.competitorReactionMultiplier - 1) * 100;
    const costInflationPct = (params.costInflationMultiplier - 1) * 100;
    
    const volumeImpactPct = (priceDeltaPct * -1.34) + (competitorDeltaPct * 0.45) + params.macroDemandShiftPercent;
    const simulatedVolume = baseVolume * (1 + volumeImpactPct / 100);
    const simulatedRevenue = baseRev * params.basePriceMultiplier * (1 + volumeImpactPct / 100);
    const simulatedCogs = baseCogs * (1 + costInflationPct / 100) * (1 + volumeImpactPct / 100);
    const simulatedProfit = simulatedRevenue - simulatedCogs;
    const simulatedMarginPct = (simulatedProfit / simulatedRevenue) * 100;

    const revDeltaPct = ((simulatedRevenue - baseRev) / baseRev) * 100;
    const marginDeltaBps = (simulatedMarginPct - ((baseRev - baseCogs) / baseRev * 100)) * 100;

    const timelineForecast = [
      { date: 'Month +1', baselineForecast: 4070000, simulatedProjection: (simulatedRevenue / 12) * 1.00, lowerBound: (simulatedRevenue / 12) * 0.97, upperBound: (simulatedRevenue / 12) * 1.03 },
      { date: 'Month +2', baselineForecast: 4100000, simulatedProjection: (simulatedRevenue / 12) * 1.01, lowerBound: (simulatedRevenue / 12) * 0.98, upperBound: (simulatedRevenue / 12) * 1.04 },
      { date: 'Month +3', baselineForecast: 4150000, simulatedProjection: (simulatedRevenue / 12) * 1.02, lowerBound: (simulatedRevenue / 12) * 0.98, upperBound: (simulatedRevenue / 12) * 1.05 },
      { date: 'Month +4', baselineForecast: 4190000, simulatedProjection: (simulatedRevenue / 12) * 1.03, lowerBound: (simulatedRevenue / 12) * 0.99, upperBound: (simulatedRevenue / 12) * 1.06 },
      { date: 'Month +5', baselineForecast: 4230000, simulatedProjection: (simulatedRevenue / 12) * 1.04, lowerBound: (simulatedRevenue / 12) * 1.00, upperBound: (simulatedRevenue / 12) * 1.07 },
      { date: 'Month +6', baselineForecast: 4280000, simulatedProjection: (simulatedRevenue / 12) * 1.06, lowerBound: (simulatedRevenue / 12) * 1.01, upperBound: (simulatedRevenue / 12) * 1.09 },
    ];

    return {
      id: `sim-custom-${Date.now()}`,
      name: 'Custom Parameter Simulation',
      description: `Price Multiplier: ${params.basePriceMultiplier.toFixed(2)}x, Comp Reaction: ${params.competitorReactionMultiplier.toFixed(2)}x`,
      basePriceMultiplier: params.basePriceMultiplier,
      competitorReactionMultiplier: params.competitorReactionMultiplier,
      costInflationMultiplier: params.costInflationMultiplier,
      macroDemandShiftPercent: params.macroDemandShiftPercent,
      projectedRevenue: Math.round(simulatedRevenue),
      projectedGrossProfit: Math.round(simulatedProfit),
      projectedVolume: Math.round(simulatedVolume),
      revenueDeltaPercent: parseFloat(revDeltaPct.toFixed(2)),
      marginDeltaBps: Math.round(marginDeltaBps),
      volumeDeltaPercent: parseFloat(volumeImpactPct.toFixed(2)),
      confidenceLowerBound: Math.round(simulatedRevenue * 0.96),
      confidenceUpperBound: Math.round(simulatedRevenue * 1.04),
      timelineForecast,
    };
  },

  async getModelTelemetry() {
    await delay(100);
    return [...mockModelTelemetry];
  },

  async queryAIAssistant(prompt) {
    await delay(450);
    const p = prompt.toLowerCase();
    let content = `I have analyzed the current portfolio models regarding your query: "${prompt}".\n\n`;
    let attachedRecs = null;

    if (p.includes('sku-8921') || p.includes('calibrator') || p.includes('increase')) {
      content += `**SKU-8921-PRO Rationale Summary**:\n- **Empirical Elasticity (Ed = -0.62)**: High degree of buyer inelasticity.\n- **Competitor Spread**: Apex Industrial raised to **$435.00** (+11.8% premium).\n- **Net Financial Lift**: +$37.8K gross profit with only -2.8% volume drag.\n- **Recommendation**: Approve price increase to **$419.00** (+7.7%).`;
      attachedRecs = [mockRecommendations[0]];
    } else if (p.includes('inelastic') || p.includes('top 3') || p.includes('highest')) {
      content += `**Top 3 Most Inelastic SKUs (Prime Pricing Power)**:\n1. **SKU-6109-OPT** (Ed = -0.38) — FiberOptic Multiplexer (Recommend +7.9% to $1,349)\n2. **SKU-8921-PRO** (Ed = -0.62) — Precision Calibrator X1 (Recommend +7.7% to $419)\n3. **SKU-9901-SER** (Ed = -0.45) — UltraCore Edge Server (Recommend +5.1% to $2,995)\n\nCombined uncaptured opportunity across these products is **+$120.3K monthly gross margin**.`;
      attachedRecs = [mockRecommendations[1], mockRecommendations[0]];
    } else if (p.includes('undercut') || p.includes('competitor') || p.includes('buy-box')) {
      content += `**Competitor Threat & Buy-Box Analysis**:\n- **SKU-3320-SENS**: SensorTech Dynamics dropped price to **$143.50**, cutting our Amazon Buy-Box win rate from 72% to 38%.\n- **Recommendation**: Adjust list price down to **$142.00** to reclaim Buy-Box and drive +14.5% unit volume.`;
      attachedRecs = [mockRecommendations[2]];
    } else {
      content += `Based on our multi-stage pricing model:\n- **Portfolio Price Elasticity**: -1.34\n- **18 Pending Recommendations**: Potential +$864.2K annual profit uplift\n- **Zero Margin Floor Violations** detected across current pipeline.\n\nYou can inspect specific SKUs or run a custom What-If scenario.`;
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content,
      recommendationsAttached: attachedRecs,
      suggestedPrompts: [
        'Run break-even sensitivity on SKU-6109-OPT',
        'Show all products with inventory > 60 days',
        'Compare competitor price variance over last 14 days',
      ],
    };
  }
};
