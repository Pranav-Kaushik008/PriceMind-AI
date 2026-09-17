import React, { useState, useMemo } from 'react';
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
  const [selectedSkuCode, setSelectedSkuCode] = useState('SKU-8921-PRO');
  const [responseMetric, setResponseMetric] = useState('profit'); // 'demand' | 'revenue' | 'profit'

  // Current SKU & Recommendation Context
  const currentSKU = useMemo(() => {
    return mockSKUs.find(s => s.skuCode === selectedSkuCode) || mockSKUs[0];
  }, [selectedSkuCode]);

  const currentRec = useMemo(() => {
    return mockRecommendations.find(r => r.skuCode === selectedSkuCode) || mockRecommendations[0];
  }, [selectedSkuCode]);

  // Curve Data
  const curveData = useMemo(() => {
    const raw = mockElasticityCurves[selectedSkuCode] || mockElasticityCurves['SKU-8921-PRO'] || [];
    return raw.map(pt => ({
      ...pt,
      cost: currentSKU.costPrice * pt.demand,
      profit: (pt.price - currentSKU.costPrice) * pt.demand,
      margin: ((pt.price - currentSKU.costPrice) / pt.price) * 100,
    }));
  }, [selectedSkuCode, currentSKU]);

  // Candidate Prices Matrix
  const candidatePrices = useMemo(() => {
    const baseP = currentSKU.currentPrice;
    const recP = currentSKU.recommendedPrice;
    const cost = currentSKU.costPrice;
    const ed = currentSKU.elasticity;

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
      const priceDeltaPct = (tp.p - baseP) / baseP;
      const demandDeltaPct = priceDeltaPct * ed;
      const predictedDemand = Math.round(currentSKU.currentVelocity * 30 * (1 + demandDeltaPct));
      const revenue = predictedDemand * tp.p;
      const profit = predictedDemand * (tp.p - cost);
      const margin = ((tp.p - cost) / tp.p) * 100;
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
  const currentMargin = ((currentSKU.currentPrice - currentSKU.costPrice) / currentSKU.currentPrice) * 100;
  const expectedMargin = ((currentSKU.recommendedPrice - currentSKU.costPrice) / currentSKU.recommendedPrice) * 100;
  const marginDeltaBps = Math.round((expectedMargin - currentMargin) * 100);
  const profitLiftAmt = currentRec.projectedProfitDelta || (currentRec.projectedRevenueDelta * (expectedMargin / 100));

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        value={selectedSkuCode}
        onChange={(e) => setSelectedSkuCode(e.target.value)}
        className="text-xs h-8 font-mono"
      >
        {mockSKUs.map(s => (
          <option key={s.id} value={s.skuCode}>{s.skuCode} — {s.name}</option>
        ))}
      </NativeSelect>
      <Button variant="ghost" size="sm" icon={RefreshCw} className="text-xs">
        Recalibrate Model
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
      <div className="border border-pm-borderSubtle rounded-sm bg-pm-surface divide-y sm:divide-y-0 sm:divide-x divide-pm-borderSubtle grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-pm-textDim">Product & Category</div>
          <div className="text-xs font-semibold text-pm-text font-mono truncate mt-0.5" title={currentSKU.name}>{currentSKU.name}</div>
          <div className="text-[10px] text-pm-textMuted font-mono mt-0.5">{currentSKU.category}</div>
        </div>

        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-pm-textDim">Current Price</div>
          <div className="text-sm font-semibold font-mono text-pm-text mt-0.5">{formatCurrency(currentSKU.currentPrice)}</div>
          <div className="text-[10px] text-pm-textDim font-mono mt-0.5">Unit List Price</div>
        </div>

        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-pm-textDim">Unit Cost (COGS)</div>
          <div className="text-sm font-semibold font-mono text-pm-textMuted mt-0.5">{formatCurrency(currentSKU.costPrice)}</div>
          <div className="text-[10px] text-pm-textDim font-mono mt-0.5">Margin: {currentMargin.toFixed(1)}%</div>
        </div>

        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-pm-textDim">Monthly Demand</div>
          <div className="text-sm font-semibold font-mono text-pm-text mt-0.5">{formatNumber(currentSKU.currentVelocity * 30)} u/mo</div>
          <div className="text-[10px] text-pm-textDim font-mono mt-0.5">{currentSKU.currentVelocity} units / day</div>
        </div>

        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-pm-textDim">Inventory Runway</div>
          <div className={`text-sm font-semibold font-mono mt-0.5 ${currentSKU.daysOfInventory < 15 ? 'text-pm-negativeText' : 'text-pm-positiveText'}`}>
            {currentSKU.inventoryStock.toLocaleString()} u ({currentSKU.daysOfInventory}d)
          </div>
          <div className="text-[10px] text-pm-textDim font-mono mt-0.5">Buffer: Normal</div>
        </div>

        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-pm-textDim">Competitor Median</div>
          <div className="text-sm font-semibold font-mono text-pm-text mt-0.5">{formatCurrency(currentSKU.competitorPrice)}</div>
          <div className="text-[10px] font-mono mt-0.5 text-pm-positiveText">
            {currentSKU.competitorPrice > currentSKU.currentPrice ? `+${formatPercent((currentSKU.competitorPrice / currentSKU.currentPrice - 1) * 100)} room` : 'Undercut'}
          </div>
        </div>

        <div className="p-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-pm-textDim">Empirical Elasticity (Ed)</div>
          <div className="text-sm font-semibold font-mono text-pm-accentText mt-0.5">{currentSKU.elasticity.toFixed(2)}</div>
          <div className="text-[10px] text-pm-textDim font-mono mt-0.5">Spline fitted</div>
        </div>
      </div>

      {/* 2. VISUALLY DOMINANT RECOMMENDATION AREA */}
      <div className="mt-6 border-2 border-pm-accent/60 bg-pm-surface p-5 rounded-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-pm-borderSubtle">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-pm-accentText px-2 py-0.5 rounded-sm bg-pm-accentBg border border-pm-accent/30">
                RECOMMENDED PRICE
              </span>
              <span className="text-xs text-pm-textMuted font-mono">Prescribed by XGBoost Non-Linear Elasticity Engine</span>
            </div>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-4xl font-extrabold font-mono text-pm-text tabular-nums tracking-tight">
                {formatCurrency(currentSKU.recommendedPrice)}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-pm-textDim line-through">{formatCurrency(currentSKU.currentPrice)}</span>
                <span className="text-pm-positiveText font-bold">
                  +{formatPercent(((currentSKU.recommendedPrice - currentSKU.currentPrice) / currentSKU.currentPrice) * 100, true)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-pm-textDim">Confidence Conviction</div>
              <div className="flex items-center gap-2 mt-1">
                <ConfidenceIndicator score={currentRec.confidence || 0.94} />
                <span className="text-sm font-mono font-bold text-pm-text">{Math.round((currentRec.confidence || 0.94) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Outcomes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
          <div>
            <span className="text-[10px] uppercase font-mono text-pm-textDim block">Expected Demand</span>
            <div className="text-base font-mono font-semibold text-pm-text mt-0.5">
              {formatNumber(Math.round(currentSKU.currentVelocity * 30 * (1 + ((currentSKU.recommendedPrice - currentSKU.currentPrice)/currentSKU.currentPrice)*currentSKU.elasticity)))} u/mo
            </div>
            <span className="text-[10px] font-mono text-pm-textMuted">
              {formatPercent(((currentSKU.recommendedPrice - currentSKU.currentPrice)/currentSKU.currentPrice)*currentSKU.elasticity * 100, true)} volume
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-pm-textDim block">Expected Net Revenue</span>
            <div className="text-base font-mono font-semibold text-pm-text mt-0.5">
              {formatCurrency(currentSKU.recommendedPrice * Math.round(currentSKU.currentVelocity * 30 * (1 + ((currentSKU.recommendedPrice - currentSKU.currentPrice)/currentSKU.currentPrice)*currentSKU.elasticity)), 'USD', true)}
            </div>
            <span className="text-[10px] font-mono text-pm-positiveText">
              +{formatCurrency(currentRec.projectedRevenueDelta, 'USD', true)}/mo
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-pm-textDim block">Expected Gross Profit</span>
            <div className="text-base font-mono font-semibold text-pm-positiveText mt-0.5">
              {formatCurrency((currentSKU.recommendedPrice - currentSKU.costPrice) * Math.round(currentSKU.currentVelocity * 30 * (1 + ((currentSKU.recommendedPrice - currentSKU.currentPrice)/currentSKU.currentPrice)*currentSKU.elasticity)), 'USD', true)}
            </div>
            <span className="text-[10px] font-mono text-pm-positiveText">
              +{formatCurrency(profitLiftAmt, 'USD', true)}/mo
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-pm-textDim block">Expected Gross Margin</span>
            <div className="text-base font-mono font-semibold text-pm-accentText mt-0.5">
              {expectedMargin.toFixed(1)}%
            </div>
            <span className="text-[10px] font-mono text-pm-accentText">
              +{marginDeltaBps} bps expansion
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-pm-textDim block">Expected Improvement</span>
            <div className="text-base font-mono font-semibold text-pm-positiveText mt-0.5">
              +{formatPercent(currentRec.expectedProfitLiftPercent || 14.2)}
            </div>
            <span className="text-[10px] font-mono text-pm-textDim">P&L profit lift</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-pm-textDim block">Guardrail Clearance</span>
            <div className="text-base font-mono font-semibold text-pm-positiveText mt-0.5 flex items-center gap-1">
              <ShieldCheck size={14} /> 4 / 4 Rules
            </div>
            <span className="text-[10px] font-mono text-pm-textMuted">Zero violations</span>
          </div>
        </div>
      </div>

      {/* 3. PRICE RESPONSE INTERACTIVE CURVE */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Price Response & Optimization Curves</h3>
            <p className="text-xs text-pm-textMuted mt-0.5">Simulated response over price variation band. Current price and recommended price marked.</p>
          </div>

          <div className="flex bg-pm-surface border border-pm-borderSubtle rounded-sm p-0.5 gap-0.5">
            {[
              { id: 'profit', label: 'Price vs Profit' },
              { id: 'revenue', label: 'Price vs Revenue' },
              { id: 'demand', label: 'Price vs Demand' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setResponseMetric(tab.id)}
                className={`px-3 py-1 text-[11px] font-mono rounded-sm transition-all cursor-pointer ${
                  responseMetric === tab.id
                    ? 'bg-pm-elevated text-pm-text border border-pm-border shadow-sm'
                    : 'text-pm-textDim hover:text-pm-textMuted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={curveData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid {...CS.grid} />
            <XAxis
              dataKey="price"
              stroke="transparent"
              tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }}
              tickFormatter={(v) => `$${v}`}
            />
            <YAxis
              stroke="transparent"
              tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }}
              tickFormatter={(v) => responseMetric === 'demand' ? formatNumber(v, true) : formatCurrency(v, 'USD', true)}
              width={65}
            />
            <Tooltip
              {...CS.tooltip}
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
              stroke={responseMetric === 'profit' ? '#10B981' : responseMetric === 'revenue' ? '#3B82F6' : '#F59E0B'}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. CANDIDATE PRICES TABLE */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Candidate Price Points & Frontier Evaluation</h3>
            <p className="text-xs text-pm-textMuted mt-0.5">Comprehensive scenario grid across price discretization band.</p>
          </div>
          <span className="text-[10px] font-mono text-pm-textDim">Green highlight indicates optimal candidate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-pm-border text-left">
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Price Candidate</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Predicted Demand</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Net Revenue</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Gross Profit</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Margin</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Constraint & Bounds</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Status</th>
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
                        ? 'bg-pm-elevated border-pm-border'
                        : 'border-pm-borderSubtle hover:bg-pm-hover'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${cand.isOptimal ? 'text-pm-positiveText' : 'text-pm-text'}`}>
                          {formatCurrency(cand.price)}
                        </span>
                        <span className="text-[10px] text-pm-textDim font-mono">({cand.label})</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-text">
                      {formatNumber(cand.predictedDemand)} u/mo
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-text">
                      {formatCurrency(cand.revenue, 'USD', true)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold ${cand.isOptimal ? 'text-pm-positiveText' : 'text-pm-text'}`}>
                      {formatCurrency(cand.profit, 'USD', true)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-textMuted">
                      {cand.margin.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-mono text-pm-textMuted">{cand.constraint}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      {cand.isOptimal ? (
                        <span className="px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider">
                          OPTIMAL REVISED
                        </span>
                      ) : cand.isCurrent ? (
                        <span className="px-2 py-0.5 rounded-sm bg-pm-subtle text-pm-textDim border border-pm-borderSubtle text-[10px]">
                          CURRENT
                        </span>
                      ) : cand.status === 'GUARDRAIL_BREACH' ? (
                        <span className="px-2 py-0.5 rounded-sm bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">
                          BREACH
                        </span>
                      ) : (
                        <span className="text-pm-textDim text-[10px]">FEASIBLE</span>
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
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="pb-3 border-b border-pm-borderSubtle mb-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Why This Price? — Causal Drivers & Evidence</h3>
            <p className="text-xs text-pm-textMuted mt-0.5">Empirical model telemetry backing recommendation {currentRec.skuCode}.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-sm bg-pm-subtle border border-pm-borderSubtle">
              <div className="flex items-center justify-between text-pm-text font-semibold mb-1">
                <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-pm-positiveText" /> 1. Demand & Elasticity Effect</span>
                <span className="text-pm-positiveText font-mono">Ed = {currentSKU.elasticity.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-pm-textMuted leading-relaxed">
                Inelastic demand corridor up to ${Math.round(currentSKU.currentPrice * 1.15)}. 1% price revision yields only ~1.34% volume drop, maximizing net dollar capture.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-pm-subtle border border-pm-borderSubtle">
              <div className="flex items-center justify-between text-pm-text font-semibold mb-1">
                <span className="flex items-center gap-1.5"><ShieldAlert size={12} className="text-pm-accentText" /> 2. Competitor Pricing Telemetry</span>
                <span className="text-pm-accentText font-mono">Market Med: ${currentSKU.competitorPrice}</span>
              </div>
              <p className="text-[11px] text-pm-textMuted leading-relaxed">
                Competitors Apex Industrial ($435) and OmniTech ($415) priced well above baseline ($389). Revised price of ${currentSKU.recommendedPrice} maintains parity without triggering undercutting retaliation.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-pm-subtle border border-pm-borderSubtle">
              <div className="flex items-center justify-between text-pm-text font-semibold mb-1">
                <span className="flex items-center gap-1.5"><Layers size={12} className="text-pm-text" /> 3. Inventory Runway & Carrying Cost</span>
                <span className="text-pm-text font-mono">{currentSKU.daysOfInventory} Days Buffer</span>
              </div>
              <p className="text-[11px] text-pm-textMuted leading-relaxed">
                Healthy stock runway of {currentSKU.daysOfInventory} days with zero stockout vulnerability. No requirement for markdown velocity clearance.
              </p>
            </div>

            <div className="p-3 rounded-sm bg-pm-subtle border border-pm-borderSubtle">
              <div className="flex items-center justify-between text-pm-text font-semibold mb-1">
                <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-pm-positiveText" /> 4. Business Guardrail Constraints</span>
                <span className="text-pm-positiveText font-mono">4 / 4 Cleared</span>
              </div>
              <p className="text-[11px] text-pm-textMuted leading-relaxed">
                Cleared Margin Floor (&gt;35%), Max Single-Step Delta (&lt;15%), MAP Compliance ($350), and Competitor Ceiling ($450).
              </p>
            </div>
          </div>
        </div>

        {/* SHAP Attribution Waterfall */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">TreeSHAP Additive Price Bridge</h3>
            <span className="text-[10px] font-mono text-pm-accentText">Zero Black-Box</span>
          </div>

          <div className="p-4 rounded-sm bg-pm-subtle border border-pm-borderSubtle">
            <SHAPWaterfall
              basePrice={currentSKU.currentPrice}
              recommendedPrice={currentSKU.recommendedPrice}
              shapContributions={currentRec.shapContributions}
            />
          </div>
        </div>
      </div>

      {/* 6. ACTION BAR */}
      <div className="mt-8 p-4 rounded-sm bg-pm-surface border border-pm-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-pm-text font-mono">Decision Review Actions</div>
          <div className="text-[11px] text-pm-textDim font-mono">Perform scenario simulations, side-by-side comparison, or explainability audit before approval.</div>
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
