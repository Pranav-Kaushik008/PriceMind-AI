import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import {
  Sliders, Play, RotateCcw, TrendingUp, DollarSign, ShieldAlert,
  Sparkles, Layers, ArrowUpRight, ArrowDownRight, RefreshCw, Zap
} from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Button } from '../components/ui/Button';
import { NativeSelect } from '../components/ui/Select';
import { formatCurrency, formatPercent, formatBps, formatNumber } from '../lib/utils';
import { mockCrossElasticityMatrix } from '../mock/mockData';

export function WhatIfSimulator() {
  const [targetCategory, setTargetCategory] = useState('all');
  const [priceShift, setPriceShift] = useState(4.5); // +4.5%
  const [competitorReaction, setCompetitorReaction] = useState(1.5); // +1.5%
  const [costInflation, setCostInflation] = useState(0.0); // 0%
  const [demandElasticityMultiplier, setDemandElasticityMultiplier] = useState(-1.34);

  // Baseline Financials
  const baselineRevenue = 48920400;
  const baselineGrossProfit = 20450000;
  const baselineMargin = 41.8;
  const baselineUnits = 125750;

  // Simulation calculations based on dynamic elasticity formula
  // %ΔQ = Ed * (%ΔP - 0.4 * %ΔP_comp)
  const effectivePriceDelta = priceShift - (0.4 * competitorReaction);
  const volumeDeltaPct = (demandElasticityMultiplier * effectivePriceDelta);
  const projectedUnits = Math.round(baselineUnits * (1 + volumeDeltaPct / 100));
  const newAvgPrice = (baselineRevenue / baselineUnits) * (1 + priceShift / 100);
  const newAvgCost = ((baselineRevenue - baselineGrossProfit) / baselineUnits) * (1 + costInflation / 100);
  
  const simulatedRevenue = projectedUnits * newAvgPrice;
  const simulatedCost = projectedUnits * newAvgCost;
  const simulatedGrossProfit = simulatedRevenue - simulatedCost;
  const simulatedMargin = (simulatedGrossProfit / simulatedRevenue) * 100;

  const revenueLift = simulatedRevenue - baselineRevenue;
  const profitLift = simulatedGrossProfit - baselineGrossProfit;
  const marginDeltaBps = Math.round((simulatedMargin - baselineMargin) * 100);

  // Sensitivity Curve for price delta range [-15% to +20%]
  const sensitivityCurve = useMemo(() => {
    const points = [];
    for (let p = -10; p <= 15; p += 2.5) {
      const effP = p - (0.4 * competitorReaction);
      const volDelta = (demandElasticityMultiplier * effP);
      const u = baselineUnits * (1 + volDelta / 100);
      const pr = (baselineRevenue / baselineUnits) * (1 + p / 100);
      const cost = ((baselineRevenue - baselineGrossProfit) / baselineUnits) * (1 + costInflation / 100);
      const r = u * pr;
      const profit = r - (u * cost);
      points.push({
        priceChange: `${p > 0 ? '+' : ''}${p}%`,
        revenue: Math.round(r),
        profit: Math.round(profit),
        margin: Number(((profit / r) * 100).toFixed(1)),
        isCurrent: p === Math.round(priceShift),
      });
    }
    return points;
  }, [priceShift, competitorReaction, costInflation, demandElasticityMultiplier]);

  const resetParams = () => {
    setPriceShift(0);
    setCompetitorReaction(0);
    setCostInflation(0);
    setDemandElasticityMultiplier(-1.34);
  };

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} className="text-xs h-8">
        <option value="all">Full Enterprise Portfolio</option>
        <option value="hardware">Hardware & Tools (Ed = -1.15)</option>
        <option value="software">Software Subscriptions (Ed = -0.65)</option>
        <option value="iot">IoT Sensors (Ed = -2.10)</option>
      </NativeSelect>
      <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetParams} className="text-xs">
        Reset Baseline
      </Button>
    </div>
  );

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Simulator' }]}
      title="What-If Scenario & Elasticity Simulator"
      description="Interactive multi-variable P&L stress testing, competitor reaction cross-elasticity, and portfolio sensitivity modeling."
      actions={controls}
    >
      {/* Simulation Result Performance Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-pm-borderSubtle border border-pm-borderSubtle rounded-sm">
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Simulated Net Revenue</div>
          <div className="text-xl font-mono font-semibold text-pm-text">
            {formatCurrency(simulatedRevenue, 'USD', true)}
          </div>
          <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px]">
            <span className={revenueLift >= 0 ? 'text-pm-positiveText' : 'text-pm-negativeText'}>
              {revenueLift >= 0 ? '+' : ''}{formatCurrency(revenueLift, 'USD', true)} ({formatPercent((revenueLift / baselineRevenue) * 100, true)})
            </span>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Simulated Gross Profit</div>
          <div className={`text-xl font-mono font-semibold ${profitLift >= 0 ? 'text-pm-positiveText' : 'text-pm-negativeText'}`}>
            {formatCurrency(simulatedGrossProfit, 'USD', true)}
          </div>
          <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px]">
            <span className={profitLift >= 0 ? 'text-pm-positiveText' : 'text-pm-negativeText'}>
              {profitLift >= 0 ? '+' : ''}{formatCurrency(profitLift, 'USD', true)} ({formatPercent((profitLift / baselineGrossProfit) * 100, true)})
            </span>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Realized Gross Margin</div>
          <div className="text-xl font-mono font-semibold text-pm-accentText">
            {simulatedMargin.toFixed(1)}%
          </div>
          <span className="text-[10px] text-pm-textDim font-mono">
            {marginDeltaBps >= 0 ? '+' : ''}{marginDeltaBps} bps vs baseline ({baselineMargin.toFixed(1)}%)
          </span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Projected Unit Demand Shift</div>
          <div className={`text-xl font-mono font-semibold ${volumeDeltaPct >= 0 ? 'text-pm-positiveText' : 'text-pm-negativeText'}`}>
            {formatNumber(projectedUnits, true)} units
          </div>
          <span className="text-[10px] text-pm-textDim font-mono">
            {volumeDeltaPct >= 0 ? '+' : ''}{volumeDeltaPct.toFixed(1)}% volume response
          </span>
        </div>
      </div>

      {/* Interactive Controls & Sensitivity Curve */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slider Controls */}
        <div className="space-y-5 p-4 rounded-sm bg-pm-subtle border border-pm-borderSubtle">
          <div className="flex items-center justify-between pb-2 border-b border-pm-borderSubtle">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Scenario Variables</h3>
            <span className="text-[10px] font-mono text-pm-accentText flex items-center gap-1">
              <Zap size={10} /> Realtime Sync
            </span>
          </div>

          {/* Price Shift */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-pm-text">Direct Price Adjustment</span>
              <span className="font-semibold text-pm-accentText">{priceShift > 0 ? `+${priceShift}%` : `${priceShift}%`}</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="0.5"
              value={priceShift}
              onChange={(e) => setPriceShift(parseFloat(e.target.value))}
              className="w-full accent-pm-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-pm-textDim mt-0.5">
              <span>-10%</span>
              <span>Baseline (0%)</span>
              <span>+15%</span>
            </div>
          </div>

          {/* Competitor Reaction */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-pm-text">Competitor Price Reaction</span>
              <span className="font-semibold text-pm-warningText">{competitorReaction > 0 ? `+${competitorReaction}%` : `${competitorReaction}%`}</span>
            </div>
            <input
              type="range"
              min="-5"
              max="10"
              step="0.5"
              value={competitorReaction}
              onChange={(e) => setCompetitorReaction(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-pm-textDim mt-0.5">
              <span>Undercut (-5%)</span>
              <span>Passive (0%)</span>
              <span>Follow (+10%)</span>
            </div>
          </div>

          {/* Cost Inflation */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-pm-text">COGS / Supply Inflation</span>
              <span className="font-semibold text-pm-negativeText">{costInflation > 0 ? `+${costInflation}%` : `${costInflation}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={costInflation}
              onChange={(e) => setCostInflation(parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-pm-textDim mt-0.5">
              <span>0% Stable</span>
              <span>+7.5%</span>
              <span>+15% Severe</span>
            </div>
          </div>

          {/* Elasticity Factor */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-pm-text">Demand Elasticity Coeff (Ed)</span>
              <span className="font-semibold text-pm-text">{demandElasticityMultiplier.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-3.0"
              max="-0.2"
              step="0.05"
              value={demandElasticityMultiplier}
              onChange={(e) => setDemandElasticityMultiplier(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-pm-textDim mt-0.5">
              <span>-3.0 (Highly Elastic)</span>
              <span>-1.34 (Avg)</span>
              <span>-0.2 (Inelastic)</span>
            </div>
          </div>
        </div>

        {/* Profit Sensitivity Curve */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Profit & Revenue Sensitivity Curve</h3>
              <p className="text-xs text-pm-textMuted mt-0.5">P&L outcome across simulated price delta range</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={sensitivityCurve} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
              <XAxis dataKey="priceChange" stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} tickFormatter={(v) => formatCurrency(v, 'USD', true)} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pm-bg-elevated)',
                  border: '1px solid var(--pm-border-strong)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--pm-text)'
                }}
                formatter={(val, name) => [formatCurrency(val, 'USD', true), name === 'profit' ? 'Gross Profit' : 'Net Revenue']}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} iconType="circle" />
              <Line dataKey="revenue" name="Net Revenue" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line dataKey="profit" name="Gross Profit" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cross-Elasticity Matrix Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Cross-SKU Cannibalization & Substitution Matrix</h3>
          <span className="text-[10px] font-mono text-pm-textDim">Multi-Product Elasticity Tensor</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-pm-border text-left">
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Source Trigger SKU</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Impacted Target SKU</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Cross-Elasticity (E_ij)</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Relationship Type</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Projected Cannibalization Drag</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Net Portfolio Effect</th>
              </tr>
            </thead>
            <tbody>
              {mockCrossElasticityMatrix.map((matrix, idx) => {
                const isSubstitute = matrix.crossElasticity > 0;
                return (
                  <tr key={idx} className="border-b border-pm-borderSubtle hover:bg-pm-hover transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-xs font-semibold text-pm-text">{matrix.sourceSKU}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-xs text-pm-accentText">{matrix.targetSKU}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold">
                      <span className={isSubstitute ? 'text-amber-400' : 'text-blue-400'}>
                        {isSubstitute ? '+' : ''}{matrix.crossElasticity.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider ${isSubstitute ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {isSubstitute ? 'Direct Substitute' : 'Complementary'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-negativeText">
                      {formatCurrency(matrix.projectedCannibalizationRevenue, 'USD', true)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs text-pm-textMuted font-mono">
                        {matrix.netPortfolioImpact}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleShell>
  );
}
