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
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-pm-borderSubtle border border-pm-borderSubtle rounded-sm">
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Production Models</div>
          <div className="text-xl font-mono font-semibold text-pm-text flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pm-positiveText" />
            3 Active Ensembles
          </div>
          <span className="text-[10px] text-pm-textMuted font-mono">XGBoost + Spline + Prophet</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Global SHAP Attribution</div>
          <div className="text-xl font-mono font-semibold text-pm-accentText">
            100% Explainable
          </div>
          <span className="text-[10px] text-pm-positiveText font-mono">Additive Shapley Values verified</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">PSI Concept Drift</div>
          <div className="text-xl font-mono font-semibold text-pm-text">
            0.042 <span className="text-xs font-normal text-pm-positiveText">(&lt;0.10 Optimal)</span>
          </div>
          <span className="text-[10px] text-pm-textDim font-mono">No data distribution shift detected</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Decision Audit Readiness</div>
          <div className="text-xl font-mono font-semibold text-pm-positiveText">
            SOC-2 / ISO Validated
          </div>
          <span className="text-[10px] text-pm-textDim font-mono">Cryptographic audit log enabled</span>
        </div>
      </div>

      {/* Global Feature Importance vs SKU SHAP Waterfall */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Global Feature Weights */}
        <div>
          <div className="pb-3 border-b border-pm-borderSubtle mb-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Global Model Feature Importance (|SHAP|)</h3>
            <p className="text-xs text-pm-textMuted mt-0.5">Average absolute impact on price recommendation decisions across all categories</p>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={globalFeatureWeights} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" horizontal={false} />
              <XAxis type="number" stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="feature" width={160} stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-muted)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pm-bg-elevated)',
                  border: '1px solid var(--pm-border-strong)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--pm-text)'
                }}
                formatter={(val) => [`${val}%`, 'Relative Importance']}
              />
              <Bar dataKey="impactPercent" fill="#3B82F6" radius={[0, 2, 2, 0]} maxBarSize={16} label={{ position: 'right', formatter: (v) => `${v}%`, fontSize: 10, fill: 'var(--pm-text-dim)' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Local SKU Decision SHAP Waterfall */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Local SHAP Attribution: {currentRec.skuCode}</h3>
              <p className="text-xs text-pm-textMuted mt-0.5">Price bridge: Base Price ${currentRec.currentPrice.toFixed(2)} → Recommended ${currentRec.recommendedPrice.toFixed(2)}</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-pm-positiveBg text-pm-positiveText border border-pm-positiveBorder">
              +{((currentRec.recommendedPrice / currentRec.currentPrice - 1) * 100).toFixed(1)}% Adjustment
            </span>
          </div>

          <div className="p-4 rounded-sm bg-pm-subtle border border-pm-borderSubtle">
            <SHAPWaterfall
              basePrice={currentRec.currentPrice}
              recommendedPrice={currentRec.recommendedPrice}
              shapContributions={currentRec.shapContributions}
            />
          </div>
        </div>
      </div>

      {/* Production Ensembles Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Production ML Models & Telemetry</h3>
          <span className="text-[10px] font-mono text-pm-textDim">Continuous Automated Evaluation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-pm-border text-left">
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Model Architecture</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Version & Commit</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">R² Score</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">MAPE</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">RMSE</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Drift Status</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Last Trained</th>
              </tr>
            </thead>
            <tbody>
              {mockModelTelemetry.map((model, idx) => (
                <tr key={idx} className="border-b border-pm-borderSubtle hover:bg-pm-hover transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="text-xs font-medium text-pm-text font-mono">{model.modelName}</div>
                    <div className="text-[10px] text-pm-textDim">{model.targetTask || 'Demand & Elasticity Modeling'}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-pm-textMuted">
                    {model.modelVersion}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-pm-positiveText">
                    {model.r2}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-text">
                    {model.mape}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-textMuted">
                    {model.rmse}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      {model.driftStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[10px] font-mono text-pm-textDim">
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
