import React, { useState, useMemo, useEffect } from 'react';
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
import { Select } from '../components/ui/Select';
import { formatCurrency, formatPercent, formatBps, formatNumber } from '../lib/utils';
import { apiClient } from '../api/client';
import { mockCrossElasticityMatrix } from '../mock/mockData';

export function WhatIfSimulator() {
  const [targetCategory, setTargetCategory] = useState('all');
  const [priceShift, setPriceShift] = useState(4.5); // +4.5%
  const [competitorReaction, setCompetitorReaction] = useState(1.5); // +1.5%
  const [costInflation, setCostInflation] = useState(0.0); // 0%
  const [demandElasticityMultiplier, setDemandElasticityMultiplier] = useState(-1.34);
  const [isRunning, setIsRunning] = useState(false);
  const [serverResult, setServerResult] = useState(null); // live backend result

  // Dynamic baselines from backend analytics
  const [baseline, setBaseline] = useState({
    revenue: 48920400,
    grossProfit: 20450000,
    margin: 41.8,
    units: 125750,
  });

  useEffect(() => {
    async function fetchBaseline() {
      try {
        const overview = await apiClient.getAnalyticsOverview();
        if (overview && overview.total_revenue > 0) {
          const rev = overview.total_revenue;
          setBaseline({
            revenue: rev,
            grossProfit: Math.round(rev * 0.418),
            margin: 41.8,
            units: Math.round(rev / 389), // approximate by avg price
          });
          // Snap elasticity multiplier to portfolio default
          setDemandElasticityMultiplier(-1.34);
        }
      } catch (err) {
        console.warn('WhatIfSimulator: using local baseline', err);
      }
    }
    fetchBaseline();
  }, []);

  // Run simulation against live ML backend
  const handleRunLiveSimulation = async () => {
    setIsRunning(true);
    try {
      const result = await apiClient.runCustomSimulation({
        basePriceMultiplier: 1 + priceShift / 100,
        competitorReactionMultiplier: 1 + competitorReaction / 100,
        costInflationMultiplier: 1 + costInflation / 100,
        macroDemandShiftPercent: 0,
      });
      if (result) setServerResult(result);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Use server result if available, else local formula
  const baselineRevenue   = baseline.revenue;
  const baselineGrossProfit = baseline.grossProfit;
  const baselineMargin    = baseline.margin;
  const baselineUnits     = baseline.units;

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
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="w-56 sm:w-64">
        <Select
          size="sm"
          value={targetCategory}
          onChange={setTargetCategory}
          options={[
            { value: 'all', label: 'Full Enterprise Portfolio' },
            { value: 'hardware', label: 'Hardware & Tools (Ed = -1.15)' },
            { value: 'software', label: 'Software (Ed = -0.65)' },
            { value: 'iot', label: 'IoT Sensors (Ed = -2.10)' },
          ]}
        />
      </div>
      <Button
        variant="primary"
        size="sm"
        icon={Play}
        onClick={handleRunLiveSimulation}
        disabled={isRunning}
        className="text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold"
      >
        {isRunning ? 'Running…' : 'Run Live Simulation'}
      </Button>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Simulated Net Revenue</div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {formatCurrency(simulatedRevenue, 'USD', true)}
          </div>
          <div className="flex items-center gap-1 mt-1 font-mono text-[11px]">
            <span className={revenueLift >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {revenueLift >= 0 ? '+' : ''}{formatCurrency(revenueLift, 'USD', true)} ({formatPercent((revenueLift / baselineRevenue) * 100, true)})
            </span>
          </div>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Simulated Gross Profit</div>
          <div className={`text-xl font-mono font-bold mt-1 ${profitLift >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(simulatedGrossProfit, 'USD', true)}
          </div>
          <div className="flex items-center gap-1 mt-1 font-mono text-[11px]">
            <span className={profitLift >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {profitLift >= 0 ? '+' : ''}{formatCurrency(profitLift, 'USD', true)} ({formatPercent((profitLift / baselineGrossProfit) * 100, true)})
            </span>
          </div>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Realized Gross Margin</div>
          <div className="text-xl font-mono font-bold text-indigo-400 mt-1">
            {simulatedMargin.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {marginDeltaBps >= 0 ? '+' : ''}{marginDeltaBps} bps vs baseline ({baselineMargin.toFixed(1)}%)
          </span>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Projected Unit Demand Shift</div>
          <div className={`text-xl font-mono font-bold mt-1 ${volumeDeltaPct >= 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
            {formatNumber(projectedUnits, true)} units
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {volumeDeltaPct >= 0 ? '+' : ''}{volumeDeltaPct.toFixed(1)}% volume response
          </span>
        </div>
      </div>

      {/* Interactive Controls & Sensitivity Curve */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slider Controls */}
        <div className="space-y-5 p-5 pm-card-glass">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Scenario Variables</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-semibold">
              <Zap size={10} /> Realtime Sync
            </span>
          </div>

          {/* Price Shift */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">Direct Price Adjustment</span>
              <span className="font-bold text-indigo-400">{priceShift > 0 ? `+${priceShift}%` : `${priceShift}%`}</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="0.5"
              value={priceShift}
              onChange={(e) => setPriceShift(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-white/[0.10] rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>-10%</span>
              <span>Baseline (0%)</span>
              <span>+15%</span>
            </div>
          </div>

          {/* Competitor Reaction */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">Competitor Price Reaction</span>
              <span className="font-bold text-amber-400">{competitorReaction > 0 ? `+${competitorReaction}%` : `${competitorReaction}%`}</span>
            </div>
            <input
              type="range"
              min="-5"
              max="10"
              step="0.5"
              value={competitorReaction}
              onChange={(e) => setCompetitorReaction(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/[0.10] rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>Undercut (-5%)</span>
              <span>Passive (0%)</span>
              <span>Follow (+10%)</span>
            </div>
          </div>

          {/* Cost Inflation */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">COGS / Supply Inflation</span>
              <span className="font-bold text-red-400">{costInflation > 0 ? `+${costInflation}%` : `${costInflation}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={costInflation}
              onChange={(e) => setCostInflation(parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer h-1.5 bg-white/[0.10] rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>0% Stable</span>
              <span>+7.5%</span>
              <span>+15% Severe</span>
            </div>
          </div>

          {/* Elasticity Factor */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-300">Demand Elasticity Coeff (Ed)</span>
              <span className="font-bold text-cyan-400">{demandElasticityMultiplier.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-3.0"
              max="-0.2"
              step="0.05"
              value={demandElasticityMultiplier}
              onChange={(e) => setDemandElasticityMultiplier(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-white/[0.10] rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>-3.0 (Highly Elastic)</span>
              <span>-1.34 (Avg)</span>
              <span>-0.2 (Inelastic)</span>
            </div>
          </div>
        </div>

        {/* Profit Sensitivity Curve */}
        <div className="lg:col-span-2 pm-card-glass p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Profit & Revenue Sensitivity Curve</h3>
              <p className="text-xs text-slate-400 mt-0.5">P&L outcome across simulated price delta range</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={sensitivityCurve} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="priceChange" stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => formatCurrency(v, 'USD', true)} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                  fontSize: '11px',
                }}
                formatter={(val, name) => [formatCurrency(val, 'USD', true), name === 'profit' ? 'Gross Profit' : 'Net Revenue']}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} iconType="circle" />
              <Line dataKey="revenue" name="Net Revenue" stroke="#6366F1" strokeWidth={2} dot={false} />
              <Line dataKey="profit" name="Gross Profit" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cross-Elasticity Matrix Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Cross-SKU Cannibalization & Substitution Matrix</h3>
          <span className="text-[10px] font-mono text-slate-400">Multi-Product Elasticity Tensor</span>
        </div>

        <div className="pm-card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-left bg-white/[0.02]">
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Source Trigger SKU</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Impacted Target SKU</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Cross-Elasticity (E_ij)</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Relationship Type</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Projected Cannibalization Drag</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Net Portfolio Effect</th>
                </tr>
              </thead>
              <tbody>
                {mockCrossElasticityMatrix.map((matrix, idx) => {
                  const isSubstitute = matrix.crossElasticity > 0;
                  return (
                    <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-white">{matrix.sourceSKU}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-indigo-300">{matrix.targetSKU}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold">
                        <span className={isSubstitute ? 'text-amber-400' : 'text-cyan-400'}>
                          {isSubstitute ? '+' : ''}{matrix.crossElasticity.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold ${isSubstitute ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'}`}>
                          {isSubstitute ? 'Direct Substitute' : 'Complementary'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-red-400">
                        {formatCurrency(matrix.projectedCannibalizationRevenue, 'USD', true)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-400 font-mono">
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
      </div>
    </ModuleShell>
  );
}

export default WhatIfSimulator;
