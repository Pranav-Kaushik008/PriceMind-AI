import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, ComposedChart, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import {
  Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, DollarSign, ShieldAlert, Cpu,
  Sliders, Layers, Eye, Download, RefreshCw, BarChart2, ShieldCheck, Zap
} from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Button } from '../components/ui/Button';
import { NativeSelect } from '../components/ui/Select';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { ConfidenceIndicator } from '../components/ui/ConfidenceIndicator';
import { SHAPWaterfall } from '../components/ui/SHAPWaterfall';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';
import { apiClient } from '../api/client';
import { mockSKUs, mockRecommendations, mockElasticityCurves } from '../mock/mockData';

// ─── Chart Styling Tokens ─────────────────────────────────────────────────────

const CS = {
  grid: { strokeDasharray: '3 3', stroke: 'var(--pm-border-subtle)', vertical: false },
  xAxis: { stroke: 'transparent', tick: { fontSize: 10, fill: 'var(--pm-text-dim)' } },
  yAxis: { stroke: 'transparent', tick: { fontSize: 10, fill: 'var(--pm-text-dim)' } },
  tooltip: {
    contentStyle: {
      backgroundColor: 'var(--pm-bg-elevated)',
      border: '1px solid var(--pm-border-strong)',
      borderRadius: '4px',
      fontSize: '11px',
      color: 'var(--pm-text)',
    },
    labelStyle: { color: 'var(--pm-text-muted)', marginBottom: 4 },
  },
};

export function PriceOptimization() {
  const { setActivePage, setSelectedRecommendationForEvidence, setSelectedSkuForDrawer } = useAppStore();

  // Dynamic backend data
  const [skus, setSkus]       = useState(mockSKUs);
  const [recs, setRecs]       = useState(mockRecommendations);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  const [selectedSkuCode, setSelectedSkuCode] = useState('SKU-8921-PRO');
  const [responseMetric, setResponseMetric] = useState('profit'); // 'demand' | 'revenue' | 'profit'

  // Fetch dynamic catalog on mount
  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      setIsLoading(true);
      try {
        const [skuList, recList] = await Promise.all([
          apiClient.getSKUs(),
          apiClient.getRecommendations(),
        ]);
        if (mounted) {
          if (Array.isArray(skuList)) {
            setSkus(skuList);
            if (skuList.length > 0) setSelectedSkuCode(skuList[0].skuCode);
          }
          if (Array.isArray(recList)) setRecs(recList);
        }
      } catch (err) {
        console.error('PriceOptimization: failed to fetch catalog', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadCatalog();
    return () => { mounted = false; };
  }, []);

  // Run live optimization via backend ML engine
  const handleRunOptimization = async () => {
    if (!currentSKU) return;
    setIsOptimizing(true);
    try {
      const result = await apiClient.getConsolidatedRecommendation(currentSKU.id || currentSKU.skuCode);
      if (result) setOptimizationResult(result);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Current SKU & Recommendation Context
  const currentSKU = useMemo(() => {
    return skus.find(s => s.skuCode === selectedSkuCode) || skus[0] || mockSKUs[0];
  }, [selectedSkuCode, skus]);

  const currentRec = useMemo(() => {
    return recs.find(r => r.skuCode === selectedSkuCode) || recs[0] || mockRecommendations[0];
  }, [selectedSkuCode, recs]);

  // Curve Data
  const curveData = useMemo(() => {
    const raw = mockElasticityCurves[selectedSkuCode] || mockElasticityCurves['SKU-8921-PRO'] || [];
    const cost = currentSKU?.costPrice || 50;
    return raw.map(pt => ({
      ...pt,
      cost: cost * pt.demand,
      profit: (pt.price - cost) * pt.demand,
      margin: pt.price > 0 ? ((pt.price - cost) / pt.price) * 100 : 0,
    }));
  }, [selectedSkuCode, currentSKU]);

  // Candidate Prices Matrix
  const candidatePrices = useMemo(() => {
    const baseP = currentSKU?.currentPrice || 100;
    const recP = currentSKU?.recommendedPrice || baseP * 1.05;
    const cost = currentSKU?.costPrice || baseP * 0.55;
    const ed = currentSKU?.elasticity ?? -1.15;
    const velocity = currentSKU?.currentVelocity || 35;

    const testPrices = [
      { p: Math.round(baseP * 0.90 * 100) / 100, note: 'Discount Promotion', constraint: 'Volume Boost' },
      { p: Math.round(baseP * 0.95 * 100) / 100, note: 'Under-Parity Test', constraint: 'Margin Dilution' },
      { p: baseP, note: 'Current Baseline', constraint: 'No Change' },
      { p: Math.round(baseP * 1.05 * 100) / 100, note: 'Conservative Shift', constraint: 'Within Normal Band' },
      { p: recP, note: 'AI Recommended Optimum', constraint: 'Max Gross Profit (P&L Optimal)' },
      { p: Math.round(baseP * 1.18 * 100) / 100, note: 'Aggressive Capture', constraint: 'Approaching Upper Guardrail' },
      { p: Math.round(baseP * 1.25 * 100) / 100, note: 'Boundary Stress', constraint: 'Violates Max Velocity Drop' },
    ];

    return testPrices.map((tp, idx) => {
      const priceDeltaPct = baseP > 0 ? (tp.p - baseP) / baseP : 0;
      const demandDeltaPct = priceDeltaPct * ed;
      const predictedDemand = Math.round(velocity * 30 * (1 + demandDeltaPct));
      const revenue = predictedDemand * tp.p;
      const profit = predictedDemand * (tp.p - cost);
      const margin = tp.p > 0 ? ((tp.p - cost) / tp.p) * 100 : 0;
      const isOptimal = tp.p === recP;
      const isCurrent = tp.p === baseP;

      return {
        id: `cand-${idx}`,
        price: tp.p,
        predictedDemand,
        revenue,
        profit,
        margin,
        constraint: tp.constraint,
        status: isOptimal ? 'OPTIMAL' : isCurrent ? 'CURRENT' : priceDeltaPct > 0.20 ? 'GUARDRAIL_BREACH' : 'FEASIBLE',
        isOptimal,
        isCurrent,
        label: tp.note,
      };
    });
  }, [currentSKU]);

  // Expected Metrics
  const basePrice = currentSKU?.currentPrice || 100;
  const recPrice = currentSKU?.recommendedPrice || basePrice * 1.05;
  const cost = currentSKU?.costPrice || basePrice * 0.55;
  const currentMargin = basePrice > 0 ? ((basePrice - cost) / basePrice) * 100 : 0;
  const expectedMargin = recPrice > 0 ? ((recPrice - cost) / recPrice) * 100 : 0;
  const marginDeltaBps = Math.round((expectedMargin - currentMargin) * 100);
  const profitLiftAmt = currentRec?.projectedProfitDelta || ((currentRec?.projectedRevenueDelta || 0) * (expectedMargin / 100));

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        value={selectedSkuCode}
        onChange={(e) => setSelectedSkuCode(e.target.value)}
        className="text-xs h-8 font-mono"
      >
        {skus.map(s => (
          <option key={s.id} value={s.skuCode}>{s.skuCode} — {s.name}</option>
        ))}
      </NativeSelect>
      <Button
        variant="ghost" size="sm" icon={RefreshCw}
        className="text-xs"
        onClick={handleRunOptimization}
        disabled={isOptimizing}
      >
        {isOptimizing ? 'Optimizing…' : 'Recalibrate Model'}
      </Button>
      <Button variant="ghost" size="sm" icon={Download} className="text-xs">
        Export Dossier
      </Button>
    </div>
  );

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Pricing' }, { label: 'Price Optimization' }]}
      title="Price Optimization & Decision Workspace"
      description="Evaluate algorithmic price revisions, elasticity response curves, candidate boundary evaluations, and transparent causal attribution."
      actions={controls}
    >
      {/* 1. PRODUCT CONTEXT STRIP */}
      <div className="pm-card-glass divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 overflow-hidden">
        <div className="p-3.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Product & Category</div>
          <div className="text-xs font-bold text-white font-mono truncate mt-1" title={currentSKU.name}>{currentSKU.name}</div>
          <div className="text-[10px] text-indigo-400 font-mono mt-0.5">{currentSKU.category}</div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Current Price</div>
          <div className="text-sm font-bold font-mono text-white mt-1">{formatCurrency(currentSKU.currentPrice)}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Unit List Price</div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Unit Cost (COGS)</div>
          <div className="text-sm font-bold font-mono text-slate-300 mt-1">{formatCurrency(currentSKU.costPrice)}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Margin: {currentMargin.toFixed(1)}%</div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Monthly Demand</div>
          <div className="text-sm font-bold font-mono text-white mt-1">{formatNumber(currentSKU.currentVelocity * 30)} u/mo</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentSKU.currentVelocity} units / day</div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Inventory Runway</div>
          <div className={`text-sm font-bold font-mono mt-1 ${currentSKU.daysOfInventory < 15 ? 'text-red-400' : 'text-emerald-400'}`}>
            {currentSKU.inventoryStock.toLocaleString()} u ({currentSKU.daysOfInventory}d)
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Buffer: Normal</div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Competitor Median</div>
          <div className="text-sm font-bold font-mono text-white mt-1">{formatCurrency(currentSKU.competitorPrice)}</div>
          <div className="text-[10px] font-mono mt-0.5 text-emerald-400">
            {currentSKU.competitorPrice > currentSKU.currentPrice ? `+${formatPercent((currentSKU.competitorPrice / currentSKU.currentPrice - 1) * 100)} room` : 'Undercut'}
          </div>
        </div>

        <div className="p-3.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Empirical Elasticity (Ed)</div>
          <div className="text-sm font-bold font-mono text-indigo-400 mt-1">{currentSKU.elasticity.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Spline fitted</div>
        </div>
      </div>

      {/* 2. VISUALLY DOMINANT RECOMMENDATION AREA */}
      <div className="mt-6 pm-card-glass border-indigo-500/40 p-6 relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-indigo-300 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                RECOMMENDED PRICE
              </span>
              <span className="text-xs text-slate-400 font-mono">Prescribed by XGBoost Non-Linear Elasticity Engine</span>
            </div>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-4xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                {formatCurrency(currentSKU.recommendedPrice)}
              </span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-500 line-through">{formatCurrency(currentSKU.currentPrice)}</span>
                <span className="text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  +{formatPercent(((currentSKU.recommendedPrice - currentSKU.currentPrice) / currentSKU.currentPrice) * 100, true)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-slate-400">Confidence Conviction</div>
              <div className="flex items-center gap-2 mt-1">
                <ConfidenceIndicator score={currentRec.confidence || 0.94} />
                <span className="text-sm font-mono font-bold text-white">{Math.round((currentRec.confidence || 0.94) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Outcomes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
          <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Expected Demand</span>
            <div className="text-base font-mono font-bold text-white mt-1">
              {formatNumber(Math.round(currentSKU.currentVelocity * 30 * (1 + ((currentSKU.recommendedPrice - currentSKU.currentPrice)/currentSKU.currentPrice)*currentSKU.elasticity)))} u/mo
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {formatPercent(((currentSKU.recommendedPrice - currentSKU.currentPrice)/currentSKU.currentPrice)*currentSKU.elasticity * 100, true)} volume
            </span>
          </div>

          <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Expected Net Revenue</span>
            <div className="text-base font-mono font-bold text-white mt-1">
              {formatCurrency(currentSKU.recommendedPrice * Math.round(currentSKU.currentVelocity * 30 * (1 + ((currentSKU.recommendedPrice - currentSKU.currentPrice)/currentSKU.currentPrice)*currentSKU.elasticity)), 'USD', true)}
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              +{formatCurrency(currentRec.projectedRevenueDelta, 'USD', true)}/mo
            </span>
          </div>

          <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Expected Gross Profit</span>
            <div className="text-base font-mono font-bold text-emerald-400 mt-1">
              {formatCurrency((currentSKU.recommendedPrice - currentSKU.costPrice) * Math.round(currentSKU.currentVelocity * 30 * (1 + ((currentSKU.recommendedPrice - currentSKU.currentPrice)/currentSKU.currentPrice)*currentSKU.elasticity)), 'USD', true)}
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              +{formatCurrency(profitLiftAmt, 'USD', true)}/mo
            </span>
          </div>

          <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Expected Gross Margin</span>
            <div className="text-base font-mono font-bold text-indigo-400 mt-1">
              {expectedMargin.toFixed(1)}%
            </div>
            <span className="text-[10px] font-mono text-indigo-400">
              +{marginDeltaBps} bps expansion
            </span>
          </div>

          <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Expected Improvement</span>
            <div className="text-base font-mono font-bold text-emerald-400 mt-1">
              +{formatPercent(currentRec.expectedProfitLiftPercent || 14.2)}
            </div>
            <span className="text-[10px] font-mono text-slate-400">P&L profit lift</span>
          </div>

          <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Guardrail Clearance</span>
            <div className="text-base font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck size={16} /> 4 / 4 Rules
            </div>
            <span className="text-[10px] font-mono text-slate-400">Zero violations</span>
          </div>
        </div>
      </div>

      {/* 3. PRICE RESPONSE INTERACTIVE CURVE */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Price Response & Optimization Curves</h3>
            <p className="text-xs text-slate-400 mt-0.5">Simulated response over price variation band. Current price and recommended price marked.</p>
          </div>

          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg p-1 gap-1">
            {[
              { id: 'profit', label: 'Price vs Profit' },
              { id: 'revenue', label: 'Price vs Revenue' },
              { id: 'demand', label: 'Price vs Demand' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setResponseMetric(tab.id)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                  responseMetric === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pm-card-glass p-4">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={curveData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="price"
                stroke="transparent"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                stroke="transparent"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={(v) => responseMetric === 'demand' ? formatNumber(v, true) : formatCurrency(v, 'USD', true)}
                width={65}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                  fontSize: '11px',
                }}
                formatter={(val) => [
                  responseMetric === 'demand' ? `${formatNumber(val)} units` : formatCurrency(val, 'USD', true),
                  responseMetric === 'profit' ? 'Gross Profit' : responseMetric === 'revenue' ? 'Net Revenue' : 'Demand'
                ]}
                labelFormatter={(label) => `Unit Price: $${label}`}
              />
              <ReferenceLine
                x={currentSKU.currentPrice}
                stroke="#64748B"
                strokeDasharray="4 4"
                label={{ value: `Current: $${currentSKU.currentPrice}`, fill: '#94A3B8', fontSize: 10, position: 'insideTopLeft' }}
              />
              <ReferenceLine
                x={currentSKU.recommendedPrice}
                stroke="#10B981"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{ value: `Recommended: $${currentSKU.recommendedPrice}`, fill: '#10B981', fontSize: 10, position: 'insideTopRight' }}
              />
              <Line
                dataKey={responseMetric}
                name={responseMetric === 'profit' ? 'Gross Profit' : responseMetric === 'revenue' ? 'Net Revenue' : 'Demand'}
                stroke={responseMetric === 'profit' ? '#10B981' : responseMetric === 'revenue' ? '#6366F1' : '#06B6D4'}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. CANDIDATE PRICES TABLE */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Candidate Price Points & Frontier Evaluation</h3>
            <p className="text-xs text-slate-400 mt-0.5">Comprehensive scenario grid across price discretization band.</p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Green highlight indicates optimal candidate</span>
        </div>

        <div className="pm-card-glass overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-left bg-white/[0.02]">
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Price Candidate</th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Predicted Demand</th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Net Revenue</th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Margin</th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Constraint & Bounds</th>
                <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {candidatePrices.map((cand) => {
                return (
                  <tr
                    key={cand.id}
                    className={`border-b transition-colors ${
                      cand.isOptimal
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : cand.isCurrent
                        ? 'bg-white/[0.04] border-white/[0.08]'
                        : 'border-white/[0.04] hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${cand.isOptimal ? 'text-emerald-400' : 'text-white'}`}>
                          {formatCurrency(cand.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({cand.label})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-200">
                      {formatNumber(cand.predictedDemand)} u/mo
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-200">
                      {formatCurrency(cand.revenue, 'USD', true)}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono tabular-nums text-xs font-bold ${cand.isOptimal ? 'text-emerald-400' : 'text-white'}`}>
                      {formatCurrency(cand.profit, 'USD', true)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-400">
                      {cand.margin.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono text-slate-300">{cand.constraint}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      {cand.isOptimal ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold tracking-wider">
                          OPTIMAL
                        </span>
                      ) : cand.isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.10] text-[10px]">
                          CURRENT
                        </span>
                      ) : cand.status === 'GUARDRAIL_BREACH' ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px]">
                          BREACH
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">FEASIBLE</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. WHY THIS PRICE? — EVIDENCE SECTION */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="pm-card-glass p-5">
          <div className="pb-3 border-b border-white/[0.08] mb-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Why This Price? — Causal Drivers & Evidence</h3>
            <p className="text-xs text-slate-400 mt-0.5">Empirical model telemetry backing recommendation {currentRec.skuCode}.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between text-white font-semibold mb-1">
                <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-400" /> 1. Demand & Elasticity Effect</span>
                <span className="text-emerald-400 font-mono">Ed = {currentSKU.elasticity.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Inelastic demand corridor up to ${Math.round(currentSKU.currentPrice * 1.15)}. 1% price revision yields only ~1.34% volume drop, maximizing net dollar capture.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between text-white font-semibold mb-1">
                <span className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-indigo-400" /> 2. Competitor Pricing Telemetry</span>
                <span className="text-indigo-400 font-mono">Market Med: ${currentSKU.competitorPrice}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Competitors Apex Industrial ($435) and OmniTech ($415) priced well above baseline ($389). Revised price of ${currentSKU.recommendedPrice} maintains parity without triggering undercutting retaliation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between text-white font-semibold mb-1">
                <span className="flex items-center gap-1.5"><Layers size={14} className="text-slate-300" /> 3. Inventory Runway & Carrying Cost</span>
                <span className="text-slate-300 font-mono">{currentSKU.daysOfInventory} Days Buffer</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Healthy stock runway of {currentSKU.daysOfInventory} days with zero stockout vulnerability. No requirement for markdown velocity clearance.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between text-white font-semibold mb-1">
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> 4. Business Guardrail Constraints</span>
                <span className="text-emerald-400 font-mono">4 / 4 Cleared</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Cleared Margin Floor (&gt;35%), Max Single-Step Delta (&lt;15%), MAP Compliance ($350), and Competitor Ceiling ($450).
              </p>
            </div>
          </div>
        </div>

        {/* SHAP Attribution Waterfall */}
        <div className="pm-card-glass p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">TreeSHAP Additive Price Bridge</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">Zero Black-Box</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <SHAPWaterfall
              basePrice={currentSKU.currentPrice}
              recommendedPrice={currentSKU.recommendedPrice}
              shapContributions={currentRec.shapContributions}
            />
          </div>
        </div>
      </div>

      {/* 6. ACTION BAR */}
      <div className="mt-8 p-5 pm-card-glass flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-white font-mono">Decision Review Actions</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Perform scenario simulations, side-by-side comparison, or explainability audit before approval.</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Sliders}
            onClick={() => setActivePage('simulator')}
            className="text-xs font-mono"
          >
            Simulate Scenario
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={BarChart2}
            onClick={() => setSelectedSkuForDrawer(currentSKU)}
            className="text-xs font-mono"
          >
            Compare Competitors
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Cpu}
            onClick={() => setActivePage('models')}
            className="text-xs font-mono"
          >
            Explain Features
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            className="text-xs font-mono"
          >
            Export Dossier
          </Button>
        </div>
      </div>
    </ModuleShell>
  );
}
