import React from 'react';
import { Package, Shield, TrendingUp, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Drawer } from './Drawer';
import { Badge } from './Badge';
import { Button } from './Button';

/**
 * Enterprise SKU Detail Drawer
 * Provides deep-dive SKU inspection including price elasticity, competitor spread, and inventory runway.
 */
export function SKUDetailDrawer({ sku, onClose, onSimulate, currency = 'USD' }) {
  if (!sku) return null;

  const {
    skuCode,
    name,
    category,
    channel,
    currentPrice,
    costPrice,
    marginPercent,
    currentVelocity,
    inventoryStock,
    daysOfInventory,
    elasticityScore,
    elasticityCategory = 'inelastic',
    competitorMinPrice = currentPrice * 0.9,
    competitorAvgPrice = currentPrice * 1.05,
    competitorMaxPrice = currentPrice * 1.2,
    pricePosition = 'competitive',
    recommendedPrice,
    projectedUpliftPercent,
  } = sku;

  return (
    <Drawer
      isOpen={Boolean(sku)}
      onClose={onClose}
      title={`${skuCode}: ${name}`}
      subtitle={`${category} • ${channel}`}
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          {recommendedPrice && onSimulate && (
            <Button
              variant="primary"
              size="sm"
              icon={TrendingUp}
              onClick={() => {
                onSimulate(sku);
                onClose();
              }}
            >
              Simulate in Pricing Sandbox
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Pricing & Margin Core Metrics */}
        <div className="grid grid-cols-3 gap-3 bg-pm-subtle p-3.5 rounded-md border border-pm-border">
          <div>
            <span className="text-[10px] font-mono uppercase text-pm-textDim block">Current ASP</span>
            <span className="text-sm font-mono font-bold text-pm-text">{formatCurrency(currentPrice, currency)}</span>
            <span className="text-[10px] font-mono text-pm-textDim block mt-0.5">COGS: {formatCurrency(costPrice, currency)}</span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-pm-textDim block">Gross Margin</span>
            <span className="text-sm font-mono font-bold text-pm-positiveText">{marginPercent?.toFixed(1) || '38.5'}%</span>
            <span className="text-[10px] font-mono text-pm-textDim block mt-0.5">
              Per unit: {formatCurrency(currentPrice - costPrice, currency)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-pm-textDim block">Velocity & Stock</span>
            <span className="text-sm font-mono font-bold text-pm-accentText">{currentVelocity} units/day</span>
            <span className="text-[10px] font-mono text-pm-textDim block mt-0.5">Inventory: {inventoryStock}</span>
          </div>
        </div>

        {/* Elasticity Diagnostic */}
        <div className="bg-pm-surface p-4 rounded-md border border-pm-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-pm-accent" />
              Elasticity Sensitivity Diagnostic
            </h4>
            <Badge variant={elasticityScore > -1.0 ? 'success' : 'warning'} size="sm">
              {elasticityCategory.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-mono font-bold text-pm-text">{elasticityScore?.toFixed(2) || '-1.25'}</span>
            <span className="text-[11px] text-pm-textDim font-mono">Price Elasticity Coefficient (Ed)</span>
          </div>
          <p className="text-[11px] text-pm-textMuted mt-2 leading-relaxed">
            {elasticityScore > -1.0
              ? 'Demand is relatively inelastic. A price increase will generate higher net revenue and margin expansion with minimal volume loss.'
              : 'Demand is price-sensitive. Price increases risk rapid volume migration to substitute competitors.'}
          </p>
        </div>

        {/* Competitor Price Benchmark Range */}
        <div className="bg-pm-surface p-4 rounded-md border border-pm-border shadow-sm">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-pm-info" />
            Competitor Benchmark Price Spread
          </h4>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between text-pm-textDim text-[11px]">
              <span>Min: {formatCurrency(competitorMinPrice, currency)}</span>
              <span>Avg: {formatCurrency(competitorAvgPrice, currency)}</span>
              <span>Max: {formatCurrency(competitorMaxPrice, currency)}</span>
            </div>

            {/* Visual price spread slider */}
            <div className="w-full bg-pm-subtle h-2 rounded-full relative overflow-hidden border border-pm-borderSubtle">
              <div className="absolute inset-y-0 bg-pm-borderStrong left-[10%] right-[10%] rounded" />
              <div
                className="absolute top-0 bottom-0 w-2.5 bg-pm-accent rounded-full -translate-x-1/2"
                style={{
                  left: `${Math.max(5, Math.min(95, ((currentPrice - competitorMinPrice) / (competitorMaxPrice - competitorMinPrice || 1)) * 100))}%`,
                }}
                title={`Our Price: ${formatCurrency(currentPrice, currency)}`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-pm-textDim">
              <span>Position: <strong className="text-pm-text uppercase">{pricePosition}</strong></span>
              <span>
                Spread: <strong className="text-pm-text font-mono">{formatPercent(((currentPrice - competitorAvgPrice) / competitorAvgPrice) * 100, true)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Velocity & Runway */}
        <div className="bg-pm-surface p-4 rounded-md border border-pm-border shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-pm-warning" />
              Inventory Runway & Stock Health
            </h4>
            <span className={daysOfInventory > 60 ? 'text-pm-warning font-mono font-bold text-xs' : 'text-pm-positiveText font-mono font-bold text-xs'}>
              {daysOfInventory} Days Supply
            </span>
          </div>
          <p className="text-[11px] text-pm-textMuted leading-relaxed">
            {daysOfInventory > 60
              ? 'Warning: High inventory holding drag. Consider targeted promotional markdowns to prevent stock obsolescence.'
              : daysOfInventory < 15
              ? 'Alert: Constrained inventory runway. Price should be raised to maximize margin yield on remaining stock.'
              : 'Healthy inventory runway aligned with standard replenishment cadence.'}
          </p>
        </div>
      </div>
    </Drawer>
  );
}

export default SKUDetailDrawer;
