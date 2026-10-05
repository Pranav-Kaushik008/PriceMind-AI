import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Activity,
  Layers, RefreshCw, Download, Zap, Eye, ChevronRight
} from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Button } from '../components/ui/Button';
import { NativeSelect } from '../components/ui/Select';
import { SHAPWaterfall } from '../components/ui/SHAPWaterfall';
import { mockModelTelemetry, mockRecommendations } from '../mock/mockData';

const globalFeatureWeights = [
  { feature: 'Competitor Benchmark Spread', impactPercent: 28.4, desc: 'Relative premium/discount against real-time competitor median.' },
  { feature: 'Empirical Price Elasticity Spline', impactPercent: 24.1, desc: 'Non-linear historical demand sensitivity to past price revisions.' },
  { feature: 'Stock Runout Velocity (Days of Supply)', impactPercent: 18.5, desc: 'Depletion rate relative to lead time and warehouse carry drag.' },
  { feature: 'Macro COGS & Raw Inflation', impactPercent: 12.3, desc: 'Component raw material inflation & supplier cost schedule updates.' },
  { feature: 'Cross-Category Substitute Cannibalization', impactPercent: 9.7, desc: 'Demand halo and cannibalization risk across adjacent product families.' },
  { feature: 'Seasonal & Promotional Multiplier', impactPercent: 7.0, desc: 'Quarter-end purchasing cycle & seasonal demand indices.' },
];

export function ExplainableAI() {
  const [selectedSkuId, setSelectedSkuId] = useState('rec-1');
  const [selectedModel, setSelectedModel] = useState('all');

  const currentRec = mockRecommendations.find(r => r.id === selectedSkuId) || mockRecommendations[0];

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={selectedSkuId} onChange={(e) => setSelectedSkuId(e.target.value)} className="text-xs h-8">
        {mockRecommendations.map(r => (
          <option key={r.id} value={r.id}>{r.skuCode} — {r.name}</option>
        ))}
      </NativeSelect>
      <Button variant="ghost" size="sm" icon={RefreshCw} className="text-xs">
        Recalculate SHAP
      </Button>
    </div>
  );

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Models' }, { label: 'Explainable AI' }]}
      title="Explainable AI (XAI) & SHAP Observatory"
      description="Zero black-box pricing decisions. Real-time game-theoretic TreeSHAP feature attributions, model lineage, and drift monitoring."
      actions={controls}
    >
      {/* Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300">
          <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1">Production Models</div>
          <div className="text-xl font-mono font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            3 Active Ensembles
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">XGBoost + Spline + Prophet</span>
        </div>

        <div className="p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300">
          <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1">Global SHAP Attribution</div>
          <div className="text-xl font-mono font-bold text-cyan-400">
            100% Explainable
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">Additive Shapley Values verified</span>
        </div>

        <div className="p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300">
          <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1">PSI Concept Drift</div>
          <div className="text-xl font-mono font-bold text-white">
            0.042 <span className="text-xs font-normal text-emerald-400">(&lt;0.10 Optimal)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">No data distribution shift detected</span>
        </div>

        <div className="p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300">
          <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1">Decision Audit Readiness</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            SOC-2 / ISO Validated
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Cryptographic audit log enabled</span>
        </div>
      </div>

      {/* Global Feature Importance vs SKU SHAP Waterfall */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Feature Weights */}
        <div className="p-5 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-lg">
          <div className="pb-3 border-b border-white/[0.08] mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Global Model Feature Importance (|SHAP|)</h3>
            <p className="text-xs text-slate-400 mt-1">Average absolute impact on price recommendation decisions across all categories</p>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={globalFeatureWeights} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" stroke="transparent" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="feature" width={160} stroke="transparent" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  fontSize: '11px',
                  color: '#fff'
                }}
                formatter={(val) => [`${val}%`, 'Relative Importance']}
              />
              <Bar dataKey="impactPercent" fill="#6366F1" radius={[0, 4, 4, 0]} maxBarSize={16} label={{ position: 'right', formatter: (v) => `${v}%`, fontSize: 10, fill: '#94a3b8' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Local SKU Decision SHAP Waterfall */}
        <div className="p-5 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Local SHAP Attribution: {currentRec.skuCode}</h3>
              <p className="text-xs text-slate-400 mt-1">Price bridge: Base Price ${currentRec.currentPrice?.toFixed(2) || '0.00'} → Recommended ${currentRec.recommendedPrice?.toFixed(2) || '0.00'}</p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              +{currentRec.currentPrice ? ((currentRec.recommendedPrice / currentRec.currentPrice - 1) * 100).toFixed(1) : 0}% Adjustment
            </span>
          </div>

          <SHAPWaterfall
            basePrice={currentRec.currentPrice}
            recommendedPrice={currentRec.recommendedPrice}
            shapContributions={currentRec.shapContributions}
            className="p-0 border-0 bg-transparent shadow-none"
          />
        </div>
      </div>

      {/* Production Ensembles Table */}
      <div className="mt-6 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Production ML Models & Telemetry</h3>
          <span className="text-[11px] font-mono text-slate-400">Continuous Automated Evaluation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-left">
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Model Architecture</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Version & Commit</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">R² Score</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">MAPE</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">RMSE</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Drift Status</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Last Trained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {mockModelTelemetry.map((model, idx) => (
                <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-3">
                    <div className="text-xs font-semibold text-white font-mono">{model.modelName}</div>
                    <div className="text-[11px] text-slate-400">{model.targetTask || 'Demand & Elasticity Modeling'}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-400">
                    {model.modelVersion}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-bold text-emerald-400">
                    {model.r2}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-white">
                    {model.mape}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-slate-400">
                    {model.rmse}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                      {model.driftStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] font-mono text-slate-400">
                    {model.trainingDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleShell>
  );
}
