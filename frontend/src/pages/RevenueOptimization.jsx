import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Minus,
  RefreshCw, Download, ChevronUp, ChevronDown,
} from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Button } from '../components/ui/Button';
import { DateRangePicker } from '../components/ui/DatePicker';
import { NativeSelect } from '../components/ui/Select';
import { formatCurrency, formatNumber } from '../lib/utils';
import { apiClient } from '../api/client';

// ─── Static chart trend data (generated from real product revenue on mount) ────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildTrendData(totalRev) {
  const base = totalRev / 12;
  return MONTHS.map((month, i) => ({
    month,
    revenue: Math.round(base * (0.88 + i * 0.015 + Math.sin(i * 0.7) * 0.03)),
    revenueP: Math.round(base * (0.80 + i * 0.013 + Math.sin(i * 0.7) * 0.025)),
    profit: Math.round(base * 0.42 * (0.88 + i * 0.015 + Math.sin(i * 0.6) * 0.025)),
    profitP: Math.round(base * 0.38 * (0.88 + i * 0.013 + Math.sin(i * 0.6) * 0.02)),
    margin: 39.4 + i * 0.22 + Math.sin(i * 0.5) * 0.4,
    marginP: 37.9 + i * 0.20 + Math.sin(i * 0.5) * 0.35,
  }));
}

// Static placeholder while loading (avoids null check in JSX)
const FALLBACK_TREND = buildTrendData(48920400);

const FALLBACK_PRODUCTS = [
  { id: 'p1', name: 'Precision Industrial Calibrator X1', category: 'Hardware & Tools', revenue: 4820000, profit: 2012000, margin: 41.7, units: 12380, avgPrice: 389, growth: 14.2 },
  { id: 'p2', name: 'SensorCore Analytics Suite', category: 'Software', revenue: 3940000, profit: 1931600, margin: 49.0, units: 3940, avgPrice: 1000, growth: 22.8 },
  { id: 'p3', name: 'ThermoGuard Pro Series', category: 'IoT Hardware', revenue: 3110000, profit: 1150700, margin: 37.0, units: 8914, avgPrice: 349, growth: 8.1 },
  { id: 'p4', name: 'FlexMount Enclosure Kit', category: 'Accessories', revenue: 2280000, profit: 684000, margin: 30.0, units: 22800, avgPrice: 100, growth: -3.4 },
  { id: 'p5', name: 'DataEdge Gateway M2', category: 'Networking', revenue: 1980000, profit: 831600, margin: 42.0, units: 3960, avgPrice: 500, growth: 6.7 },
];

const priceVolumeData = [
  { price: 149, units: 18500, revenue: 2756500 },
  { price: 199, units: 15200, revenue: 3024800 },
  { price: 249, units: 13100, revenue: 3261900 },
  { price: 299, units: 11400, revenue: 3408600 },
  { price: 349, units: 9800,  revenue: 3420200 },
  { price: 389, units: 8200,  revenue: 3189800 },
  { price: 429, units: 6500,  revenue: 2788500 },
  { price: 499, units: 4800,  revenue: 2395200 },
];

// Dynamic state store — populated by RevenueOptimization component on mount
// and read by KPIStrip/ContributionBar/FinancialTable sub-components via module scope.
let _productData  = FALLBACK_PRODUCTS;
let _trendData    = FALLBACK_TREND;
let _totalRevenue = 48920400;
let _totalProfit  = FALLBACK_PRODUCTS.reduce((s, p) => s + p.profit, 0);
let _totalUnits   = FALLBACK_PRODUCTS.reduce((s, p) => s + p.units, 0);

// (Dynamic state is initialized inside RevenueOptimization component below)


const CS = {
  grid: { strokeDasharray: '3 3', stroke: 'var(--pm-border-subtle)', vertical: false },
  xAxis: { stroke: 'transparent', tick: { fontSize: 10, fill: 'var(--pm-text-dim)' } },
  yAxis: { stroke: 'transparent', tick: { fontSize: 10, fill: 'var(--pm-text-dim)' }, width: 72 },
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

const METRIC_CONFIG = {
  revenue: { label: 'Revenue', color: '#3B82F6', fmt: (v) => formatCurrency(v, 'USD', true), cur: 'revenue', pri: 'revenueP' },
  profit:  { label: 'Gross Profit', color: '#10B981', fmt: (v) => formatCurrency(v, 'USD', true), cur: 'profit', pri: 'profitP' },
  margin:  { label: 'Gross Margin', color: '#F59E0B', fmt: (v) => `${v.toFixed(1)}%`, cur: 'margin', pri: 'marginP' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Delta({ value, suffix = '%' }) {
  const pos = value >= 0;
  const Icon = value === 0 ? Minus : pos ? ArrowUpRight : ArrowDownRight;
  const cls = value === 0 ? 'text-pm-textMuted' : pos ? 'text-pm-positiveText' : 'text-pm-negativeText';
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums ${cls}`}>
      <Icon size={10} strokeWidth={2.5} />
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronUp size={10} className="opacity-20" />;
  return sortDir === 'asc' ? <ChevronUp size={10} className="text-pm-accentText" /> : <ChevronDown size={10} className="text-pm-accentText" />;
}

function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white">{title}</h3>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

function MetricToggle({ value, onChange }) {
  return (
    <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-lg p-0.5 gap-1">
      {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
            value === key
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {cfg.label}
        </button>
      ))}
    </div>
  );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────

function KPIStrip() {
  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(_totalRevenue, 'USD', true), delta: 11.4, sub: 'vs prior period' },
    { label: 'Gross Profit', value: formatCurrency(_totalProfit, 'USD', true), delta: 14.8, sub: 'vs prior period' },
    { label: 'Avg Gross Margin', value: `${_totalRevenue > 0 ? ((_totalProfit / _totalRevenue) * 100).toFixed(1) : '0.0'}%`, delta: 1.6, sub: '+160 bps vs prior' },
    { label: 'Units Sold', value: formatNumber(_totalUnits, true), delta: 6.3, sub: 'vs prior period' },
    { label: 'Avg Selling Price', value: formatCurrency(_totalUnits > 0 ? _totalRevenue / _totalUnits : 0, 'USD', false), delta: 4.8, sub: 'vs prior period' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((k, i) => (
        <div key={i} className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">{k.label}</div>
          <div className="text-xl font-mono tabular-nums font-bold text-white mt-1">{k.value}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Delta value={k.delta} />
            <span className="text-[10px] text-slate-400">{k.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Trend Chart ──────────────────────────────────────────────────────────────

function TrendChart({ metric, showPrior }) {
  const cfg = METRIC_CONFIG[metric];
  return (
    <div className="pm-card-glass p-5">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={_trendData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="month" stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} />
          <YAxis stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} width={72} tickFormatter={cfg.fmt} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              fontSize: '11px',
            }}
            formatter={(val, name) => [cfg.fmt(val), name]}
          />
          <Legend wrapperStyle={{ fontSize: '10px', color: '#94A3B8' }} iconSize={8} iconType="circle" />
          {showPrior && (
            <Line dataKey={cfg.pri} name="Prior Period" stroke={cfg.color} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          )}
          <Line dataKey={cfg.cur} name={`Current — ${cfg.label}`} stroke={cfg.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Category Bar ─────────────────────────────────────────────────────────────

function CategoryBar({ metric }) {
  const key = metric === 'margin' ? 'margin' : metric === 'profit' ? 'profit' : 'revenue';
  const fmt = metric === 'margin' ? (v) => `${v.toFixed(1)}%` : (v) => formatCurrency(v, 'USD', true);
  const color = METRIC_CONFIG[metric].color;
  // Build category aggregates dynamically from live _productData
  const catMap = {};
  _productData.forEach(p => {
    if (!catMap[p.category]) catMap[p.category] = { category: p.category, revenue: 0, profit: 0, units: 0 };
    catMap[p.category].revenue += p.revenue;
    catMap[p.category].profit  += p.profit;
    catMap[p.category].units   += p.units;
  });
  const dynamicCategoryData = Object.values(catMap).map(c => ({
    ...c, margin: c.revenue > 0 ? parseFloat(((c.profit / c.revenue) * 100).toFixed(1)) : 0
  }));
  const sorted = [...dynamicCategoryData].sort((a, b) => b[key] - a[key]);
  return (
    <div className="pm-card-glass p-5">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 50, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tickFormatter={fmt} stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} />
          <YAxis type="category" dataKey="category" width={110} stroke="transparent" tick={{ fontSize: 10, fill: '#CBD5E1' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              fontSize: '11px',
            }}
            formatter={(val) => [fmt(val), METRIC_CONFIG[metric].label]}
          />
          <Bar dataKey={key} fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: 'right', formatter: fmt, fontSize: 10, fill: '#94A3B8' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Price-Volume Chart ───────────────────────────────────────────────────────

function PriceVolumeChart() {
  return (
    <div className="pm-card-glass p-5">
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={priceVolumeData} margin={{ top: 4, right: 16, bottom: 12, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="price" stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `$${v}`} label={{ value: 'Price Point', position: 'insideBottom', offset: -6, fontSize: 10, fill: '#94A3B8' }} />
          <YAxis yAxisId="units" stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => formatNumber(v, true)} width={55} />
          <YAxis yAxisId="rev" orientation="right" stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => formatCurrency(v, 'USD', true)} width={62} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              fontSize: '11px',
            }}
            formatter={(val, name) => name === 'Units' ? [formatNumber(val), 'Units Sold'] : [formatCurrency(val, 'USD', true), 'Revenue']}
          />
          <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} iconType="circle" />
          <Bar yAxisId="units" dataKey="units" name="Units" fill="#6366F1" fillOpacity={0.65} radius={[3, 3, 0, 0]} maxBarSize={22} />
          <Line yAxisId="rev" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Contribution Bar ─────────────────────────────────────────────────────────

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];

function ContributionBar() {
  return (
    <div className="pm-card-glass p-5 space-y-4">
      <div className="flex h-3.5 rounded-full overflow-hidden gap-0.5 p-0.5 bg-white/[0.04]">
        {_productData.map((p, i) => (
          <div key={p.id} style={{ width: `${_totalRevenue > 0 ? (p.revenue / _totalRevenue) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} title={`${p.name}: ${_totalRevenue > 0 ? ((p.revenue / _totalRevenue) * 100).toFixed(1) : 0}%`} className="first:rounded-l-full last:rounded-r-full transition-all hover:opacity-80" />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {_productData.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_6px_rgba(255,255,255,0.2)]" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-xs text-slate-300 font-medium">{p.name.split(' ').slice(0, 3).join(' ')}</span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">({_totalRevenue > 0 ? ((p.revenue / _totalRevenue) * 100).toFixed(0) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Financial Table ──────────────────────────────────────────────────────────

const TABLE_COLS = [
  { id: 'name', label: 'Product', align: 'left' },
  { id: 'category', label: 'Category', align: 'left' },
  { id: 'revenue', label: 'Revenue', align: 'right' },
  { id: 'profit', label: 'Profit', align: 'right' },
  { id: 'margin', label: 'Margin', align: 'right' },
  { id: 'units', label: 'Units', align: 'right' },
  { id: 'avgPrice', label: 'Avg Price', align: 'right' },
  { id: 'growth', label: 'Growth', align: 'right' },
];

function FinancialTable() {
  const [sortCol, setSortCol] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    return [..._productData].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [sortCol, sortDir]);

  const toggle = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  return (
    <div className="pm-card-glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02]">
              {TABLE_COLS.map(col => (
                <th
                  key={col.id}
                  onClick={() => toggle(col.id)}
                  className={`py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.align === 'right' && <SortIcon col={col.id} sortCol={sortCol} sortDir={sortDir} />}
                    {col.label}
                    {col.align === 'left' && <SortIcon col={col.id} sortCol={sortCol} sortDir={sortDir} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                <td className="py-3 px-4 max-w-[220px]">
                  <div className="text-xs font-semibold text-white leading-tight truncate">{row.name}</div>
                  <div className="text-[10px] text-indigo-400 mt-0.5 font-mono">{row.id.toUpperCase()}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-[11px] text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.08] whitespace-nowrap">{row.category}</span>
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-white whitespace-nowrap">{formatCurrency(row.revenue, 'USD', true)}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-emerald-400 font-bold whitespace-nowrap">{formatCurrency(row.profit, 'USD', true)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${Math.min(row.margin, 100)}%` }} />
                    </div>
                    <span className="font-mono tabular-nums text-xs text-white">{row.margin.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-400 whitespace-nowrap">{formatNumber(row.units, true)}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-400 whitespace-nowrap">{formatCurrency(row.avgPrice, 'USD', false)}</td>
                <td className="py-3 px-4 text-right"><Delta value={row.growth} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/[0.12] bg-white/[0.04]">
              <td className="py-3 px-4 text-[11px] font-bold text-white font-mono" colSpan={2}>PORTFOLIO TOTAL</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-white whitespace-nowrap">{formatCurrency(_totalRevenue, 'USD', true)}</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-emerald-400 whitespace-nowrap">{formatCurrency(_totalProfit, 'USD', true)}</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-white whitespace-nowrap">{_totalRevenue > 0 ? ((_totalProfit / _totalRevenue) * 100).toFixed(1) : '0.0'}%</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-slate-400 whitespace-nowrap">{formatNumber(_totalUnits, true)}</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-slate-400 whitespace-nowrap">{formatCurrency(_totalUnits > 0 ? _totalRevenue / _totalUnits : 0, 'USD', false)}</td>
              <td className="py-3 px-4 text-right"><Delta value={11.4} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function RevenueOptimization() {
  const [metric, setMetric] = useState('revenue');
  const [showPrior, setShowPrior] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [category, setCategory] = useState('all');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [overview, skuList] = await Promise.all([
          apiClient.getAnalyticsOverview(),
          apiClient.getSKUs(),
        ]);
        if (!mounted) return;
        if (overview && overview.total_revenue > 0) {
          _trendData = buildTrendData(overview.total_revenue);
          _totalRevenue = overview.total_revenue;
        }
        if (skuList && skuList.length > 0) {
          _productData = skuList.map((sku, idx) => {
            const units = (sku.currentVelocity || 35) * 30 * 12;
            const revenue = sku.currentPrice * units;
            const profit = (sku.currentPrice - sku.costPrice) * units;
            const margin = sku.costPrice > 0 ? ((sku.currentPrice - sku.costPrice) / sku.currentPrice) * 100 : 0;
            return { id: sku.id || `p${idx}`, name: sku.name, category: sku.category, revenue: Math.round(revenue), profit: Math.round(profit), margin: parseFloat(margin.toFixed(1)), units, avgPrice: sku.currentPrice, growth: sku.projectedUpliftPercent || 5.0 };
          });
          _totalProfit = _productData.reduce((s, p) => s + p.profit, 0);
          _totalUnits = _productData.reduce((s, p) => s + p.units, 0);
          _totalRevenue = _productData.reduce((s, p) => s + p.revenue, 0);
          forceUpdate(n => n + 1);
        }
      } catch (err) { console.error('RevenueOptimization fetch error:', err); }
    }
    loadData();
    return () => { mounted = false; };
  }, []);


  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs h-8">
        <option value="all">All Categories</option>
        <option value="software">Software</option>
        <option value="hardware">Hardware & Tools</option>
        <option value="iot">IoT Hardware</option>
        <option value="networking">Networking</option>
      </NativeSelect>
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <Button variant="ghost" size="sm" icon={RefreshCw} className="text-xs">Refresh</Button>
      <Button variant="ghost" size="sm" icon={Download} className="text-xs">Export</Button>
    </div>
  );

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Revenue' }]}
      title="Revenue Analytics"
      description="Financial performance, margin analysis, and price-volume intelligence."
      actions={controls}
    >
      {/* KPI Strip */}
      <KPIStrip />

      {/* Trend Chart */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Performance Trend</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrior(p => !p)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${showPrior ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300 font-semibold' : 'border-white/[0.10] text-slate-400 hover:text-white'}`}
            >
              {showPrior ? 'Prior: On' : 'Prior: Off'}
            </button>
            <MetricToggle value={metric} onChange={setMetric} />
          </div>
        </div>
        <TrendChart metric={metric} showPrior={showPrior} />
      </div>

      {/* Category + Price-Volume */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Revenue by Category</h3>
            <MetricToggle value={metric} onChange={setMetric} />
          </div>
          <CategoryBar metric={metric} />
        </div>
        <div>
          <div className="pb-3 border-b border-white/[0.08] mb-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Price–Volume Relationship</h3>
          </div>
          <PriceVolumeChart />
          <p className="text-[11px] text-slate-400 mt-2 font-mono">Revenue peaks near $299–$349. Volume declines steeply above $429 with diminishing revenue returns.</p>
        </div>
      </div>

      {/* Contribution */}
      <div className="mt-8">
        <div className="pb-3 border-b border-white/[0.08] mb-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Revenue Contribution — By Product</h3>
        </div>
        <ContributionBar />
      </div>

      {/* Financial Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Financial Analysis</h3>
          <span className="text-[10px] font-mono text-slate-400">Click column headers to sort</span>
        </div>
        <FinancialTable />
      </div>
    </ModuleShell>
  );
}
