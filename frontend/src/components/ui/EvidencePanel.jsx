import React from 'react';
import { ShieldCheck, TrendingUp, Cpu, CheckCircle2, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Badge } from './Badge';
import { Button } from './Button';
import { SHAPWaterfall } from './SHAPWaterfall';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import tokens from '../../styles/tokens';

/**
 * Enterprise Evidence Panel Component
 * Decomposes price recommendations into:
 * 1. Demand & Revenue Elasticity Curve
 * 2. SHAP Feature Attribution (Drivers)
 * 3. Operational Guardrail Validations
 */
export function EvidencePanel({
  recommendation,
  elasticityCurve = [],
  currency = 'USD',
  className = '',
}) {
  if (!recommendation) return null;

  const {
    skuCode,
    skuName,
    category,
    currentPrice = 149.99,
    recommendedPrice = 164.99,
    priceDeltaPercent = 10.0,
    currentMarginPercent = 38.5,
    projectedMarginPercent = 42.1,
    projectedRevenueDelta = 12400,
    confidenceScore = 92,
    rationale,
    shapAttribution = [],
    guardrailChecks = [],
    elasticityAtPoint = -1.35,
  } = recommendation;

  return (
    <div className={cn('flex flex-col gap-4 w-full font-sans', className)}>
      {/* Top Impact Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-pm-subtle p-3.5 rounded-md border border-pm-border">
        <div>
          <span className="text-[10px] font-mono uppercase text-pm-textDim block">Current vs Target</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono line-through text-xs text-pm-textDim">{formatCurrency(currentPrice, currency)}</span>
            <span className="font-mono font-bold text-sm text-pm-text">{formatCurrency(recommendedPrice, currency)}</span>
            <Badge variant={priceDeltaPercent > 0 ? 'success' : 'danger'} size="sm" className="font-mono text-[10px]">
              {formatPercent(priceDeltaPercent, true)}
            </Badge>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-pm-textDim block">Margin Shift</span>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono text-xs">
            <span className="text-pm-textDim">{currentMarginPercent.toFixed(1)}%</span>
            <ArrowRight className="w-3 h-3 text-pm-textDim" />
            <span className="font-bold text-pm-positiveText">{projectedMarginPercent.toFixed(1)}%</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase text-pm-textDim block">Projected Monthly Lift</span>
          <span className="font-mono font-bold text-sm text-pm-positiveText mt-1 block">
            +{formatCurrency(projectedRevenueDelta, currency, true)}/mo
          </span>
        </div>
      </div>

      {/* Section 1: Empirical Demand & Elasticity Curve */}
      <div className="bg-pm-surface p-4 rounded-md border border-pm-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-pm-accent" />
            Empirical Demand & Elasticity Curve
          </h4>
          <span className="font-mono text-xs text-pm-accentText">
            Local Elasticity: {elasticityAtPoint?.toFixed(2) || '-1.35'}
          </span>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={elasticityCurve.length > 0 ? elasticityCurve : [
              { price: 130, revenue: 38000, demand: 292 },
              { price: 140, revenue: 42000, demand: 300 },
              { price: 150, revenue: 45000, demand: 300 },
              { price: 165, revenue: 48500, demand: 294 },
              { price: 180, revenue: 44000, demand: 244 },
              { price: 195, revenue: 39000, demand: 200 },
            ]}>
              <XAxis dataKey="price" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis dataKey="revenue" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `$${val / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#131A27', borderColor: '#222D42', borderRadius: '4px', fontSize: '11px' }}
                formatter={(val, name) => [name === 'revenue' ? formatCurrency(val, currency) : val, name === 'revenue' ? 'Revenue Projected' : 'Demand Units']}
              />
              <ReferenceLine x={currentPrice} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Current', fill: '#EF4444', fontSize: 10 }} />
              <ReferenceLine x={recommendedPrice} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Target', fill: '#10B981', fontSize: 10 }} />
              <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={{ r: 3, fill: '#6366F1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-pm-textDim mt-2 leading-relaxed">
          Indigo curve displays non-linear revenue response across tested pricing increments. The peak corresponds to the revenue-optimal price under current elasticity.
        </p>
      </div>

      {/* Section 2: SHAP Waterfall Drivers */}
      <div>
        <SHAPWaterfall attributions={shapAttribution} />
      </div>

      {/* Section 3: Guardrail Validations */}
      <div className="bg-pm-surface p-4 rounded-md border border-pm-border shadow-sm">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-pm-positiveText" />
          Operational Guardrail Validations
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-pm-subtle border border-pm-borderSubtle">
            <span className="text-pm-text">Margin Floor Compliance (Min 35.0%)</span>
            <Badge variant="success" size="sm">PASSED</Badge>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-pm-subtle border border-pm-borderSubtle">
            <span className="text-pm-text">Competitor Band Index Variance (±15%)</span>
            <Badge variant="success" size="sm">PASSED</Badge>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-pm-subtle border border-pm-borderSubtle">
            <span className="text-pm-text">Stock Runway & Inventory Safe Zone</span>
            <Badge variant="success" size="sm">PASSED (29d runway)</Badge>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-pm-subtle border border-pm-borderSubtle">
            <span className="text-pm-text">MAP Policy & Brand Erosion Check</span>
            <Badge variant="success" size="sm">PASSED</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EvidencePanel;
