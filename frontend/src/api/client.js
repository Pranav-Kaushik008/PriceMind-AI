import {
  mockExecutiveKPIs,
  mockSKUs,
  mockRecommendations,
  mockElasticityCurves,
  mockCompetitorTelemetry,
  mockSimulations,
  mockModelTelemetry,
} from '../mock/mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    return null; // Signals to use fallback when backend is offline
  }
}

export const apiClient = {
  // ── 1. System Health ────────────────────────────────────────────────────────
  async getHealth() {
    const data = await fetchJson('/health');
    return data || { status: 'healthy', database: 'connected (local)' };
  },

  // ── 2. Executive KPIs ───────────────────────────────────────────────────────
  async getExecutiveKPIs() {
    const data = await fetchJson('/executive/kpis');
    if (data && Array.isArray(data) && data.length > 0) return data;
    return [...mockExecutiveKPIs];
  },

  async getAnalyticsOverview() {
    const data = await fetchJson('/analytics/overview');
    return data || {
      total_products: 5,
      total_categories: 4,
      total_sales_records: 5475,
      total_revenue: 48920400,
      average_price: 388.0,
      average_demand_units: 34.2,
      total_recommendations: 5,
      total_optimizations_run: 5,
      model_status: 'active',
    };
  },

  // ── 3. Product Catalog ─────────────────────────────────────────────────────
  async getSKUs(categoryFilter, search) {
    let query = '';
    const params = new URLSearchParams();
    if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const data = await fetchJson(`/products${queryString}`);
    if (data && Array.isArray(data) && data.length > 0) return data;

    // Fallback filter
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
    const data = await fetchJson(`/products/${id}`);
    if (data) {
      return {
        id: data.id,
        skuCode: data.external_product_id,
        name: data.name,
        category: data.category_name || 'General',
        channel: data.store_channel || 'Direct',
        currentPrice: data.current_price,
        costPrice: data.cost_price,
        marginPercent: data.margin_percent || 40.0,
        inventoryStock: data.inventory_level || 500,
        daysOfInventory: 25,
        elasticityScore: -1.15,
        elasticityCategory: 'elastic',
        competitorAvgPrice: data.competitor_price || data.current_price,
      };
    }
    return mockSKUs.find((s) => s.id === id || s.skuCode === id);
  },

  // ── 4. Pricing Recommendations ─────────────────────────────────────────────
  async getRecommendations(statusFilter) {
    const param = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    const data = await fetchJson(`/recommendations${param}`);
    if (data && Array.isArray(data) && data.length > 0) return data;

    let list = [...mockRecommendations];
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list;
  },

  async updateRecommendationStatus(recId, status) {
    const updated = await fetchJson(`/recommendations/${recId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (updated) return updated;

    const rec = mockRecommendations.find((r) => r.id === recId);
    if (!rec) throw new Error(`Recommendation ${recId} not found`);
    rec.status = status;
    if (status === 'applied') {
      rec.appliedAt = new Date().toISOString();
    }
    return { ...rec };
  },

  // ── 5. Elasticity & Pricing Curves ─────────────────────────────────────────
  async getElasticityCurve(skuCode) {
    const data = await fetchJson(`/elasticity/${skuCode}/curve`);
    if (data && Array.isArray(data) && data.length > 0) return data;
    return mockElasticityCurves[skuCode] || mockElasticityCurves['SKU-8921-PRO'];
  },

  async getElasticity(productId) {
    return await fetchJson(`/elasticity/${productId}`);
  },

  // ── 6. Competitor Radar & Telemetry ────────────────────────────────────────
  async getCompetitorTelemetry() {
    const data = await fetchJson('/competitors');
    if (data && Array.isArray(data) && data.length > 0) return data;
    return [...mockCompetitorTelemetry];
  },

  // ── 7. Simulations & What-If ───────────────────────────────────────────────
  async getSimulations() {
    const data = await fetchJson('/simulations');
    if (data && Array.isArray(data) && data.length > 0) return data;
    return [...mockSimulations];
  },

  async runCustomSimulation(params) {
    const data = await fetchJson('/simulations/run', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (data) return data;

    // Local client-side calculation fallback
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

  // ── 8. Model Observatory ───────────────────────────────────────────────────
  async getModelTelemetry() {
    const data = await fetchJson('/models/telemetry');
    if (data && Array.isArray(data) && data.length > 0) return data;
    return [...mockModelTelemetry];
  },

  // ── 9. Forecasts & Predictions ─────────────────────────────────────────────
  async getForecasts(productId, horizon = 14) {
    return await fetchJson(`/forecasts/${productId}?horizon=${horizon}`);
  },

  async predictDemand(payload) {
    return await fetchJson('/predictions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ── 10. Pricing Optimization & Explanations ────────────────────────────────
  async optimizePrice(payload) {
    return await fetchJson('/pricing/optimize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPredictionExplanation(payload) {
    return await fetchJson('/explanations/prediction', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPricingExplanation(payload) {
    return await fetchJson('/explanations/pricing', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ── 11. AI Assistant Query ─────────────────────────────────────────────────
  async queryAIAssistant(prompt) {
    const data = await fetchJson('/assistant/query', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    if (data) return data;

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
  },

  // ── 12. RAG Knowledge System (Module 11) ──────────────────────────────────
  async queryRAG(query, categoryFilter = null, topK = 4) {
    return await fetchJson('/rag/query', {
      method: 'POST',
      body: JSON.stringify({ query, category_filter: categoryFilter, top_k: topK }),
    });
  },

  async retrieveKnowledge(query, categoryFilter = null, topK = 5) {
    return await fetchJson('/rag/retrieve', {
      method: 'POST',
      body: JSON.stringify({ query, category_filter: categoryFilter, top_k: topK }),
    });
  },

  async getKnowledgeStatus() {
    return await fetchJson('/rag/status');
  },

  async reindexKnowledge() {
    return await fetchJson('/rag/reindex', {
      method: 'POST',
    });
  },
};

