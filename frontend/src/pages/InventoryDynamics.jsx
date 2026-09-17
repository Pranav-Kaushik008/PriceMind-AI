import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine, ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  Package, AlertTriangle, ArrowRight, ShieldCheck, DollarSign,
  TrendingDown, TrendingUp, RefreshCw, Download, Layers, ShieldAlert, Zap
} from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Button } from '../components/ui/Button';
import { NativeSelect } from '../components/ui/Select';
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils';
import { mockSKUs } from '../mock/mockData';

export function InventoryDynamics() {
  const [filterCategory, setFilterCategory] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const skus = mockSKUs.map((s) => {
    const annualHoldingDrag = (s.inventoryStock * s.costPrice * 0.18);
    let risk = 'Optimal';
    let action = 'Maintain Baseline';
    if (s.daysOfInventory > 60) {
      risk = 'Overstock';
      action = `Markdown -${((1 - s.recommendedPrice / s.currentPrice) * 100).toFixed(0)}% to clear runway`;
    } else if (s.daysOfInventory < 15) {
      risk = 'Stockout Risk';
      action = `Surcharge +${((s.recommendedPrice / s.currentPrice - 1) * 100).toFixed(0)}% to throttle velocity`;
    }

    return {
      ...s,
      annualHoldingDrag,
      risk,
      action,
      totalInventoryValuation: s.inventoryStock * s.costPrice,
    };
  });

  const filteredSKUs = skus.filter(s => {
    if (filterCategory !== 'all' && s.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (riskFilter !== 'all' && s.risk.toLowerCase() !== riskFilter.toLowerCase()) return false;
    return true;
  });

  const totalCapitalLocked = skus.reduce((sum, s) => sum + s.totalInventoryValuation, 0);
  const totalAnnualHoldingDrag = skus.reduce((sum, s) => sum + s.annualHoldingDrag, 0);
  const stockoutRiskCount = skus.filter(s => s.daysOfInventory < 15).length;
  const excessStockCount = skus.filter(s => s.daysOfInventory > 60).length;

  const runwayChartData = skus.map(s => ({
    name: s.skuCode,
    runway: s.daysOfInventory,
    stock: s.inventoryStock,
    fill: s.daysOfInventory < 15 ? '#EF4444' : s.daysOfInventory > 60 ? '#F59E0B' : '#10B981'
  }));

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-xs h-8">
        <option value="all">All Categories</option>
        <option value="hardware & tools">Hardware & Tools</option>
        <option value="software">Software</option>
        <option value="iot hardware">IoT Hardware</option>
      </NativeSelect>
      <NativeSelect value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="text-xs h-8">
        <option value="all">All Inventory States</option>
        <option value="stockout risk">Stockout Risk (&lt;15d)</option>
        <option value="overstock">Overstock (&gt;60d)</option>
        <option value="optimal">Optimal Runway</option>
      </NativeSelect>
      <Button variant="ghost" size="sm" icon={RefreshCw} className="text-xs">
        Sync ERP Stock
      </Button>
      <Button variant="ghost" size="sm" icon={Download} className="text-xs">
        Export
      </Button>
    </div>
  );

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Inventory' }]}
      title="Inventory Dynamics & Markdown Intelligence"
      description="Stock runway optimization, holding cost drag analytics, and dynamic stockout mitigation pricing."
      actions={controls}
    >
      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-pm-borderSubtle border border-pm-borderSubtle rounded-sm">
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Total Locked Capital</div>
          <div className="text-xl font-mono font-semibold text-pm-text">
            {formatCurrency(totalCapitalLocked, 'USD', true)}
          </div>
          <span className="text-[10px] text-pm-textMuted font-mono">Weighted across active SKUs</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Annual Holding Drag (18% WACC)</div>
          <div className="text-xl font-mono font-semibold text-pm-warningText">
            {formatCurrency(totalAnnualHoldingDrag, 'USD', true)}/yr
          </div>
          <span className="text-[10px] text-pm-textDim font-mono">Warehousing, insurance & cost of capital</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Stockout Constraint SKUs</div>
          <div className="text-xl font-mono font-semibold text-pm-negativeText">
            {stockoutRiskCount} SKUs
          </div>
          <span className="text-[10px] text-pm-negativeText font-mono">&lt;15 days of buffer runway remaining</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Excess Capital / Markdown</div>
          <div className="text-xl font-mono font-semibold text-pm-accentText">
            {excessStockCount} SKUs
          </div>
          <span className="text-[10px] text-pm-accentText font-mono">&gt;60 days holding carry</span>
        </div>
      </div>

      {/* Runway Distribution & Carry Cost Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Days of Inventory Runway</h3>
              <p className="text-xs text-pm-textMuted mt-0.5">Thresholds: &lt;15d (Stockout danger) | &gt;60d (Excess drag)</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={runwayChartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
              <XAxis dataKey="name" stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} tickFormatter={(v) => `${v}d`} width={45} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pm-bg-elevated)',
                  border: '1px solid var(--pm-border-strong)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--pm-text)'
                }}
                formatter={(val) => [`${val} Days`, 'Runway']}
              />
              <ReferenceLine y={15} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Stockout Limit (15d)', fill: '#EF4444', fontSize: 10, position: 'insideTopLeft' }} />
              <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Excess Limit (60d)', fill: '#F59E0B', fontSize: 10, position: 'insideTopLeft' }} />
              <Bar dataKey="runway" maxBarSize={28} radius={[2, 2, 0, 0]}>
                {runwayChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="pb-3 border-b border-pm-borderSubtle mb-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Inventory Valuation & Holding Cost Drag</h3>
            <p className="text-xs text-pm-textMuted mt-0.5">Opportunity cost mitigation via dynamic price discounting</p>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={skus} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
              <XAxis dataKey="skuCode" stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} tickFormatter={(v) => formatCurrency(v, 'USD', true)} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pm-bg-elevated)',
                  border: '1px solid var(--pm-border-strong)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--pm-text)'
                }}
                formatter={(val, name) => [formatCurrency(val, 'USD', true), name === 'annualHoldingDrag' ? 'Annual Drag Cost' : 'Valuation']}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} iconType="circle" />
              <Bar dataKey="totalInventoryValuation" name="Locked Valuation" fill="#3B82F6" maxBarSize={20} radius={[2, 2, 0, 0]} />
              <Bar dataKey="annualHoldingDrag" name="Annual Drag Cost" fill="#F59E0B" maxBarSize={20} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory SKU Telemetry Matrix */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Inventory Optimization Matrix</h3>
          <span className="text-[10px] font-mono text-pm-textDim">Automated ERP Sync Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-pm-border text-left">
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">SKU & Category</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Stock On Hand</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Daily Velocity</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Runway (Days)</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Inventory Valuation</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Annual Carry Drag</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Risk Condition</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Prescribed Algorithmic Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSKUs.map((sku) => {
                const isStockout = sku.risk === 'Stockout Risk';
                const isOverstock = sku.risk === 'Overstock';

                return (
                  <tr key={sku.id} className="border-b border-pm-borderSubtle hover:bg-pm-hover transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="text-xs font-medium text-pm-text leading-tight">{sku.name}</div>
                      <div className="text-[10px] text-pm-textDim font-mono mt-0.5">{sku.skuCode} • {sku.category}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-text">
                      {formatNumber(sku.inventoryStock)} u
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-textMuted">
                      {sku.currentVelocity}/day
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold">
                      <span className={isStockout ? 'text-pm-negativeText' : isOverstock ? 'text-pm-warningText' : 'text-pm-positiveText'}>
                        {sku.daysOfInventory}d
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-text">
                      {formatCurrency(sku.totalInventoryValuation, 'USD', true)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-warningText">
                      {formatCurrency(sku.annualHoldingDrag, 'USD', true)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold ${
                        isStockout ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        isOverstock ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {sku.risk}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 text-xs text-pm-text font-mono">
                        <Zap size={11} className={isStockout ? 'text-pm-negativeText' : isOverstock ? 'text-pm-warningText' : 'text-pm-positiveText'} />
                        {sku.action}
                      </div>
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
