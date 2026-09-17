import React, { useState, useMemo } from 'react';
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const trendData = MONTHS.map((month, i) => ({
  month,
  revenue: 3200000 + i * 180000 + Math.sin(i * 0.7) * 120000,
  revenueP: 2900000 + i * 160000 + Math.sin(i * 0.7) * 100000,
  profit: 1260000 + i * 68000 + Math.sin(i * 0.6) * 50000,
  profitP: 1100000 + i * 58000 + Math.sin(i * 0.6) * 42000,
  margin: 39.4 + i * 0.22 + Math.sin(i * 0.5) * 0.4,
  marginP: 37.9 + i * 0.20 + Math.sin(i * 0.5) * 0.35,
}));

const productData = [
  { id: 'p1', name: 'Precision Industrial Calibrator X1', category: 'Hardware & Tools', revenue: 4820000, profit: 2012000, margin: 41.7, units: 12380, avgPrice: 389, growth: 14.2 },
  { id: 'p2', name: 'SensorCore Analytics Suite', category: 'Software', revenue: 3940000, profit: 1931600, margin: 49.0, units: 3940, avgPrice: 1000, growth: 22.8 },
  { id: 'p3', name: 'ThermoGuard Pro Series', category: 'IoT Hardware', revenue: 3110000, profit: 1150700, margin: 37.0, units: 8914, avgPrice: 349, growth: 8.1 },
  { id: 'p4', name: 'FlexMount Enclosure Kit', category: 'Accessories', revenue: 2280000, profit: 684000, margin: 30.0, units: 22800, avgPrice: 100, growth: -3.4 },
  { id: 'p5', name: 'DataEdge Gateway M2', category: 'Networking', revenue: 1980000, profit: 831600, margin: 42.0, units: 3960, avgPrice: 500, growth: 6.7 },
  { id: 'p6', name: 'PowerCell Industrial 48V', category: 'Energy', revenue: 1640000, profit: 557600, margin: 34.0, units: 4100, avgPrice: 400, growth: -1.2 },
  { id: 'p7', name: 'CloudSync Enterprise License', category: 'Software', revenue: 1480000, profit: 1110000, margin: 75.0, units: 1480, avgPrice: 1000, growth: 31.4 },
  { id: 'p8', name: 'CablePro Armored Series', category: 'Accessories', revenue: 920000, profit: 230000, margin: 25.0, units: 18400, avgPrice: 50, growth: 2.1 },
];

const categoryData = [
  { category: 'Software', revenue: 5420000, profit: 3041200, margin: 56.1, growth: 26.2 },
  { category: 'Hardware & Tools', revenue: 4820000, profit: 2012000, margin: 41.7, growth: 14.2 },
  { category: 'IoT Hardware', revenue: 3110000, profit: 1150700, margin: 37.0, growth: 8.1 },
  { category: 'Networking', revenue: 1980000, profit: 831600, margin: 42.0, growth: 6.7 },
  { category: 'Energy', revenue: 1640000, profit: 557600, margin: 34.0, growth: -1.2 },
  { category: 'Accessories', revenue: 3200000, profit: 914000, margin: 28.6, growth: -0.8 },
];

const priceVolumeData = [
  { price: 199, units: 9800, revenue: 1950200 },
  { price: 249, units: 8200, revenue: 2041800 },
  { price: 299, units: 6900, revenue: 2063100 },
  { price: 349, units: 5600, revenue: 1954400 },
  { price: 389, units: 4900, revenue: 1906100 },
  { price: 429, units: 3800, revenue: 1630200 },
  { price: 499, units: 2400, revenue: 1197600 },
  { price: 599, units: 1200, revenue: 718800 },
];

const TOTAL_REVENUE = productData.reduce((s, p) => s + p.revenue, 0);
const TOTAL_PROFIT = productData.reduce((s, p) => s + p.profit, 0);
const TOTAL_UNITS = productData.reduce((s, p) => s + p.units, 0);

// ─── Chart Style ──────────────────────────────────────────────────────────────

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
    <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">{title}</h3>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

function MetricToggle({ value, onChange }) {
  return (
    <div className="flex bg-pm-surface border border-pm-borderSubtle rounded-sm p-0.5 gap-0.5">
      {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-2.5 py-1 text-[11px] font-mono rounded-sm transition-all cursor-pointer ${
            value === key
              ? 'bg-pm-elevated text-pm-text border border-pm-border shadow-sm'
              : 'text-pm-textDim hover:text-pm-textMuted'
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
    { label: 'Total Revenue', value: formatCurrency(TOTAL_REVENUE, 'USD', true), delta: 11.4, sub: 'vs prior period' },
    { label: 'Gross Profit', value: formatCurrency(TOTAL_PROFIT, 'USD', true), delta: 14.8, sub: 'vs prior period' },
    { label: 'Avg Gross Margin', value: `${((TOTAL_PROFIT / TOTAL_REVENUE) * 100).toFixed(1)}%`, delta: 1.6, sub: '+160 bps vs prior' },
    { label: 'Units Sold', value: formatNumber(TOTAL_UNITS, true), delta: 6.3, sub: 'vs prior period' },
    { label: 'Avg Selling Price', value: formatCurrency(TOTAL_REVENUE / TOTAL_UNITS, 'USD', false), delta: 4.8, sub: 'vs prior period' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-pm-borderSubtle border border-pm-borderSubtle rounded-sm">
      {kpis.map((k, i) => (
        <div key={i} className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">{k.label}</div>
          <div className="text-xl font-mono tabular-nums font-semibold text-pm-text">{k.value}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Delta value={k.delta} />
            <span className="text-[10px] text-pm-textMuted">{k.sub}</span>
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
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={trendData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid {...CS.grid} />
        <XAxis dataKey="month" {...CS.xAxis} />
        <YAxis {...CS.yAxis} tickFormatter={cfg.fmt} />
        <Tooltip {...CS.tooltip} formatter={(val, name) => [cfg.fmt(val), name]} />
        <Legend wrapperStyle={{ fontSize: '10px', color: 'var(--pm-text-muted)' }} iconSize={8} iconType="circle" />
        {showPrior && (
          <Line dataKey={cfg.pri} name="Prior Period" stroke={cfg.color} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
        )}
        <Line dataKey={cfg.cur} name={`Current — ${cfg.label}`} stroke={cfg.color} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Category Bar ─────────────────────────────────────────────────────────────

function CategoryBar({ metric }) {
  const key = metric === 'margin' ? 'margin' : metric === 'profit' ? 'profit' : 'revenue';
  const fmt = metric === 'margin' ? (v) => `${v.toFixed(1)}%` : (v) => formatCurrency(v, 'USD', true);
  const color = METRIC_CONFIG[metric].color;
  const sorted = [...categoryData].sort((a, b) => b[key] - a[key]);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 50, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" horizontal={false} />
        <XAxis type="number" tickFormatter={fmt} stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} />
        <YAxis type="category" dataKey="category" width={110} stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-muted)' }} />
        <Tooltip {...CS.tooltip} formatter={(val) => [fmt(val), METRIC_CONFIG[metric].label]} />
        <Bar dataKey={key} fill={color} radius={[0, 2, 2, 0]} maxBarSize={18} label={{ position: 'right', formatter: fmt, fontSize: 10, fill: 'var(--pm-text-dim)' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Price-Volume Chart ───────────────────────────────────────────────────────

function PriceVolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={priceVolumeData} margin={{ top: 4, right: 16, bottom: 12, left: 0 }}>
        <CartesianGrid {...CS.grid} />
        <XAxis dataKey="price" {...CS.xAxis} tickFormatter={(v) => `$${v}`} label={{ value: 'Price Point', position: 'insideBottom', offset: -6, fontSize: 10, fill: 'var(--pm-text-dim)' }} />
        <YAxis yAxisId="units" stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} tickFormatter={(v) => formatNumber(v, true)} width={55} />
        <YAxis yAxisId="rev" orientation="right" stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} tickFormatter={(v) => formatCurrency(v, 'USD', true)} width={62} />
        <Tooltip {...CS.tooltip} formatter={(val, name) => name === 'Units' ? [formatNumber(val), 'Units Sold'] : [formatCurrency(val, 'USD', true), 'Revenue']} />
        <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} iconType="circle" />
        <Bar yAxisId="units" dataKey="units" name="Units" fill="#3B82F6" fillOpacity={0.55} radius={[2, 2, 0, 0]} maxBarSize={22} />
        <Line yAxisId="rev" dataKey="revenue" name="Revenue" stroke="#F59E0B" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── Contribution Bar ─────────────────────────────────────────────────────────

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];

function ContributionBar() {
  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-sm overflow-hidden gap-px">
        {productData.map((p, i) => (
          <div key={p.id} style={{ width: `${(p.revenue / TOTAL_REVENUE) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} title={`${p.name}: ${((p.revenue / TOTAL_REVENUE) * 100).toFixed(1)}%`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {productData.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-[10px] text-pm-textMuted">{p.name.split(' ').slice(0, 3).join(' ')}</span>
            <span className="text-[10px] font-mono text-pm-textDim tabular-nums">{((p.revenue / TOTAL_REVENUE) * 100).toFixed(0)}%</span>
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
    return [...productData].sort((a, b) => {
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-pm-border">
            {TABLE_COLS.map(col => (
              <th
                key={col.id}
                onClick={() => toggle(col.id)}
                className={`py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim cursor-pointer select-none hover:text-pm-textMuted transition-colors whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
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
            <tr key={row.id} className="border-b border-pm-borderSubtle hover:bg-pm-hover transition-colors">
              <td className="py-2.5 px-3 max-w-[220px]">
                <div className="text-xs font-medium text-pm-text leading-tight truncate">{row.name}</div>
                <div className="text-[10px] text-pm-textDim mt-0.5 font-mono">{row.id.toUpperCase()}</div>
              </td>
              <td className="py-2.5 px-3">
                <span className="text-[11px] text-pm-textMuted bg-pm-subtle px-1.5 py-0.5 rounded-sm border border-pm-borderSubtle whitespace-nowrap">{row.category}</span>
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-text whitespace-nowrap">{formatCurrency(row.revenue, 'USD', true)}</td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-positiveText whitespace-nowrap">{formatCurrency(row.profit, 'USD', true)}</td>
              <td className="py-2.5 px-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-12 bg-pm-subtle rounded-full h-1 overflow-hidden">
                    <div className="h-1 rounded-full bg-pm-accentText" style={{ width: `${Math.min(row.margin, 100)}%` }} />
                  </div>
                  <span className="font-mono tabular-nums text-xs text-pm-text">{row.margin.toFixed(1)}%</span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-textMuted whitespace-nowrap">{formatNumber(row.units, true)}</td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-textMuted whitespace-nowrap">{formatCurrency(row.avgPrice, 'USD', false)}</td>
              <td className="py-2.5 px-3 text-right"><Delta value={row.growth} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-pm-border bg-pm-subtle">
            <td className="py-2.5 px-3 text-[11px] font-semibold text-pm-text font-mono" colSpan={2}>PORTFOLIO TOTAL</td>
            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-pm-text whitespace-nowrap">{formatCurrency(TOTAL_REVENUE, 'USD', true)}</td>
            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-pm-positiveText whitespace-nowrap">{formatCurrency(TOTAL_PROFIT, 'USD', true)}</td>
            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-pm-text whitespace-nowrap">{((TOTAL_PROFIT / TOTAL_REVENUE) * 100).toFixed(1)}%</td>
            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-pm-textMuted whitespace-nowrap">{formatNumber(TOTAL_UNITS, true)}</td>
            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-pm-textMuted whitespace-nowrap">{formatCurrency(TOTAL_REVENUE / TOTAL_UNITS, 'USD', false)}</td>
            <td className="py-2.5 px-3 text-right"><Delta value={11.4} /></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function RevenueOptimization() {
  const [metric, setMetric] = useState('revenue');
  const [showPrior, setShowPrior] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [category, setCategory] = useState('all');

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
        <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Performance Trend</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrior(p => !p)}
              className={`text-[10px] font-mono px-2 py-1 rounded-sm border transition-colors cursor-pointer ${showPrior ? 'border-pm-border bg-pm-elevated text-pm-textMuted' : 'border-pm-borderSubtle text-pm-textDim hover:text-pm-textMuted'}`}
            >
              {showPrior ? 'Prior: On' : 'Prior: Off'}
            </button>
            <MetricToggle value={metric} onChange={setMetric} />
          </div>
        </div>
        <TrendChart metric={metric} showPrior={showPrior} />
      </div>

      {/* Category + Price-Volume */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Revenue by Category</h3>
            <MetricToggle value={metric} onChange={setMetric} />
          </div>
          <CategoryBar metric={metric} />
        </div>
        <div>
          <div className="pb-3 border-b border-pm-borderSubtle mb-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Price–Volume Relationship</h3>
          </div>
          <PriceVolumeChart />
          <p className="text-[10px] text-pm-textDim mt-2 font-mono">Revenue peaks near $299–$349. Volume declines steeply above $429 with diminishing revenue returns.</p>
        </div>
      </div>

      {/* Contribution */}
      <div className="mt-8">
        <div className="pb-3 border-b border-pm-borderSubtle mb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Revenue Contribution — By Product</h3>
        </div>
        <ContributionBar />
      </div>

      {/* Financial Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Financial Analysis</h3>
          <span className="text-[10px] font-mono text-pm-textDim">Click column headers to sort</span>
        </div>
        <FinancialTable />
      </div>
    </ModuleShell>
  );
}
