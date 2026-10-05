import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Total Locked Capital</div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {formatCurrency(totalCapitalLocked, 'USD', true)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Weighted across active SKUs</span>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Annual Holding Drag (18% WACC)</div>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">
            {formatCurrency(totalAnnualHoldingDrag, 'USD', true)}/yr
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Warehousing, insurance & cost of capital</span>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Stockout Constraint SKUs</div>
          <div className="text-xl font-mono font-bold text-red-400 mt-1">
            {stockoutRiskCount} SKUs
          </div>
          <span className="text-[10px] text-red-400 font-mono mt-1 block">&lt;15 days of buffer runway remaining</span>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Excess Capital / Markdown</div>
          <div className="text-xl font-mono font-bold text-indigo-400 mt-1">
            {excessStockCount} SKUs
          </div>
          <span className="text-[10px] text-indigo-400 font-mono mt-1 block">&gt;60 days holding carry</span>
        </div>
      </div>

      {/* Runway Distribution & Carry Cost Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="pm-card-glass p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Days of Inventory Runway</h3>
              <p className="text-xs text-slate-400 mt-0.5">Thresholds: &lt;15d (Stockout danger) | &gt;60d (Excess drag)</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={runwayChartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `${v}d`} width={45} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                  fontSize: '11px',
                }}
                formatter={(val) => [`${val} Days`, 'Runway']}
              />
              <ReferenceLine y={15} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Stockout Limit (15d)', fill: '#EF4444', fontSize: 10, position: 'insideTopLeft' }} />
              <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Excess Limit (60d)', fill: '#F59E0B', fontSize: 10, position: 'insideTopLeft' }} />
              <Bar dataKey="runway" maxBarSize={28} radius={[4, 4, 0, 0]}>
                {runwayChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pm-card-glass p-5">
          <div className="pb-3 border-b border-white/[0.08] mb-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Inventory Valuation & Holding Cost Drag</h3>
            <p className="text-xs text-slate-400 mt-0.5">Opportunity cost mitigation via dynamic price discounting</p>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={skus} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="skuCode" stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => formatCurrency(v, 'USD', true)} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                  fontSize: '11px',
                }}
                formatter={(val, name) => [formatCurrency(val, 'USD', true), name === 'annualHoldingDrag' ? 'Annual Drag Cost' : 'Valuation']}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} iconType="circle" />
              <Bar dataKey="totalInventoryValuation" name="Locked Valuation" fill="#6366F1" maxBarSize={20} radius={[3, 3, 0, 0]} />
              <Bar dataKey="annualHoldingDrag" name="Annual Drag Cost" fill="#F59E0B" maxBarSize={20} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory SKU Telemetry Matrix */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Inventory Optimization Matrix</h3>
          <span className="text-[10px] font-mono text-slate-400">Automated ERP Sync Active</span>
        </div>

        <div className="pm-card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-left bg-white/[0.02]">
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">SKU & Category</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Stock On Hand</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Daily Velocity</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Runway (Days)</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Inventory Valuation</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Annual Carry Drag</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Risk Condition</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Prescribed Algorithmic Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSKUs.map((sku) => {
                  const isStockout = sku.risk === 'Stockout Risk';
                  const isOverstock = sku.risk === 'Overstock';

                  return (
                    <tr key={sku.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-white leading-tight">{sku.name}</div>
                        <div className="text-[10px] text-indigo-400 font-mono mt-0.5">{sku.skuCode} • {sku.category}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-white">
                        {formatNumber(sku.inventoryStock)} u
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-400">
                        {sku.currentVelocity}/day
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold">
                        <span className={isStockout ? 'text-red-400' : isOverstock ? 'text-amber-400' : 'text-emerald-400'}>
                          {sku.daysOfInventory}d
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-white">
                        {formatCurrency(sku.totalInventoryValuation, 'USD', true)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-amber-400">
                        {formatCurrency(sku.annualHoldingDrag, 'USD', true)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                          isStockout ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                          isOverstock ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {sku.risk}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-200 font-mono">
                          <Zap size={12} className={isStockout ? 'text-red-400' : isOverstock ? 'text-amber-400' : 'text-emerald-400'} />
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
      </div>
    </ModuleShell>
  );
}

export default InventoryDynamics;
