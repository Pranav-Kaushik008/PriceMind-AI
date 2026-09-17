import React from 'react';
import { ArrowUpRight, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from './Badge';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

export function StrategyHeatmap({ skus = [] }) {
  const { setSelectedSkuForDrawer } = useAppStore();

  const quadrants = [
    {
      id: 'harvest',
      title: 'Inelastic Margin Harvest (High Pricing Power)',
      description: 'Low elasticity ($E_d > -1.0$) + Healthy Stock. Prime candidates for +4% to +8% price lift.',
      badgeVariant: 'lift',
      accentColor: 'border-emerald-500/30 bg-emerald-950/20',
      filter: (s) => s.elasticityScore > -1.0 && s.daysOfInventory <= 45,
    },
    {
      id: 'defend',
      title: 'Competitive Buy-Box Defense (Elastic Zone)',
      description: 'High elasticity ($E_d < -1.5$) + Aggressive competitor undercutting. Strategic targeted match.',
      badgeVariant: 'accent',
      accentColor: 'border-indigo-500/30 bg-indigo-950/20',
      filter: (s) => s.elasticityScore <= -1.5 && s.daysOfInventory <= 50,
    },
    {
      id: 'liquidate',
      title: 'Aged Inventory Markdown Acceleration',
      description: 'Excess stock carry (>60 days supply). Markdown liquidation to release working capital.',
      badgeVariant: 'warning',
      accentColor: 'border-amber-500/30 bg-amber-950/20',
      filter: (s) => s.daysOfInventory > 60,
    },
    {
      id: 'constrained',
      title: 'Supply Scarcity Yield Stretch',
      description: 'Critical inventory stockout risk (<15 days). Price rationing to stretch remaining margin yield.',
      badgeVariant: 'risk',
      accentColor: 'border-rose-500/30 bg-rose-950/20',
      filter: (s) => s.daysOfInventory < 15,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quadrants.map((quad) => {
        const matchingSkus = skus.filter(quad.filter);
        return (
          <div
            key={quad.id}
            className={`border rounded-lg p-4 flex flex-col justify-between transition-all ${quad.accentColor}`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-xs font-bold font-mono text-pm-text uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-pm-accent" />
                  {quad.title}
                </h4>
                <Badge variant={quad.badgeVariant}>{matchingSkus.length} SKUs</Badge>
              </div>
              <p className="text-[11px] text-pm-textDim mb-3 leading-relaxed">
                {quad.description}
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              {matchingSkus.slice(0, 2).map((sku) => (
                <div
                  key={sku.id}
                  onClick={() => setSelectedSkuForDrawer(sku)}
                  className="bg-pm-darkest/70 hover:bg-pm-cardHover/80 p-2 rounded flex items-center justify-between text-xs cursor-pointer border border-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-pm-text">{sku.skuCode}</span>
                    <span className="text-[10px] text-pm-textDim block truncate">{sku.name}</span>
                  </div>
                  <div className="text-right font-mono flex-shrink-0">
                    <span className="text-xs font-bold text-pm-lift">{formatCurrency(sku.currentPrice)}</span>
                    <span className="text-[10px] text-pm-textDim block">{sku.elasticityScore.toFixed(2)} Ed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
