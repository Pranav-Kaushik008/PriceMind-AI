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
import { useToast } from '../components/ui/ToastProvider';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildTrendData(totalRev, range = '30d') {
  if (range === '7d' || range === '24h') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const base = (totalRev / 52) / 7;
    return days.map((d, i) => ({
      month: d,
      revenue: Math.round(base * (0.9 + i * 0.03 + Math.sin(i * 1.1) * 0.05)),
      revenueP: Math.round(base * (0.82 + i * 0.02 + Math.sin(i * 1.1) * 0.04)),
      profit: Math.round(base * 0.42 * (0.9 + i * 0.03 + Math.sin(i * 1.1) * 0.05)),
      profitP: Math.round(base * 0.38 * (0.82 + i * 0.02)),
      margin: 39.4 + i * 0.2,
      marginP: 37.9,
    }));
  }
  if (range === '90d' || range === 'qtd') {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
    const base = (totalRev / 4) / 12;
    return weeks.map((w, i) => ({
      month: w,
      revenue: Math.round(base * (0.88 + i * 0.02 + Math.sin(i * 0.8) * 0.04)),
      revenueP: Math.round(base * (0.80 + i * 0.015)),
      profit: Math.round(base * 0.42 * (0.88 + i * 0.02)),
      profitP: Math.round(base * 0.38 * (0.80 + i * 0.015)),
      margin: 39.4 + i * 0.15,
      marginP: 37.9,
    }));
  }
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

const METRIC_CONFIG = {
  revenue: { label: 'Revenue', color: '#3B82F6', fmt: (v) => formatCurrency(v, 'USD', true), cur: 'revenue', pri: 'revenueP' },
  profit:  { label: 'Gross Profit', color: '#10B981', fmt: (v) => formatCurrency(v, 'USD', true), cur: 'profit', pri: 'profitP' },
  margin:  { label: 'Gross Margin', color: '#F59E0B', fmt: (v) => `${v.toFixed(1)}%`, cur: 'margin', pri: 'marginP' },
};

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

function KPIStrip({ totalRevenue, totalProfit, totalUnits }) {
  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue, 'USD', true), delta: 11.4, sub: 'vs prior period' },
    { label: 'Gross Profit', value: formatCurrency(totalProfit, 'USD', true), delta: 14.8, sub: 'vs prior period' },
    { label: 'Avg Gross Margin', value: `${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%`, delta: 1.6, sub: '+160 bps vs prior' },
    { label: 'Units Sold', value: formatNumber(totalUnits, true), delta: 6.3, sub: 'vs prior period' },
    { label: 'Avg Selling Price', value: formatCurrency(totalUnits > 0 ? totalRevenue / totalUnits : 0, 'USD', false), delta: 4.8, sub: 'vs prior period' },
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

function TrendChart({ metric, showPrior, data }) {
  const cfg = METRIC_CONFIG[metric];
  return (
    <div className="pm-card-glass p-5">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
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

function CategoryBar({ metric, products }) {
  const key = metric === 'margin' ? 'margin' : metric === 'profit' ? 'profit' : 'revenue';
  const fmt = metric === 'margin' ? (v) => `${v.toFixed(1)}%` : (v) => formatCurrency(v, 'USD', true);
  const color = METRIC_CONFIG[metric].color;
  
  const catMap = {};
  products.forEach(p => {
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

function ContributionBar({ products, totalRevenue }) {
  return (
    <div className="pm-card-glass p-5 space-y-4">
      <div className="flex h-3.5 rounded-full overflow-hidden gap-0.5 p-0.5 bg-white/[0.04]">
        {products.map((p, i) => (
          <div key={p.id} style={{ width: `${totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} title={`${p.name}: ${totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : 0}%`} className="first:rounded-l-full last:rounded-r-full transition-all hover:opacity-80" />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {products.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_6px_rgba(255,255,255,0.2)]" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-xs text-slate-300 font-medium">{p.name.split(' ').slice(0, 3).join(' ')}</span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">({totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(0) : 0}%)</span>
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

function FinancialTable({ products, totalRevenue, totalProfit, totalUnits }) {
  const [sortCol, setSortCol] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [products, sortCol, sortDir]);

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
                  <div className="text-[10px] text-indigo-400 mt-0.5 font-mono">{String(row.id).toUpperCase()}</div>
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
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-white whitespace-nowrap">{formatCurrency(totalRevenue, 'USD', true)}</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-emerald-400 whitespace-nowrap">{formatCurrency(totalProfit, 'USD', true)}</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-white whitespace-nowrap">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-slate-400 whitespace-nowrap">{formatNumber(totalUnits, true)}</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-slate-400 whitespace-nowrap">{formatCurrency(totalUnits > 0 ? totalRevenue / totalUnits : 0, 'USD', false)}</td>
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
  const { addToast } = useToast();
  const [metric, setMetric] = useState('revenue');
  const [showPrior, setShowPrior] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [category, setCategory] = useState('all');
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [baseRevenue, setBaseRevenue] = useState(48920400);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showSuccessToast = false) => {
    try {
      const [overview, skuList] = await Promise.all([
        apiClient.getAnalyticsOverview(),
        apiClient.getSKUs(),
      ]);
      if (overview && overview.total_revenue > 0) {
        setBaseRevenue(overview.total_revenue);
      }
      if (skuList && skuList.length > 0) {
        const mapped = skuList.map((sku, idx) => {
          const units = (sku.currentVelocity || 35) * 30 * 12;
          const revenue = sku.currentPrice * units;
          const profit = (sku.currentPrice - sku.costPrice) * units;
          const margin = sku.costPrice > 0 ? ((sku.currentPrice - sku.costPrice) / sku.currentPrice) * 100 : 0;
          return {
            id: sku.id || `p${idx}`,
            name: sku.name,
            category: sku.category,
            revenue: Math.round(revenue),
            profit: Math.round(profit),
            margin: parseFloat(margin.toFixed(1)),
            units,
            avgPrice: sku.currentPrice,
            growth: sku.projectedUpliftPercent || 5.0,
          };
        });
        setProducts(mapped);
      }
      if (showSuccessToast) {
        addToast({ type: 'success', title: 'Data Refreshed', message: 'Revenue analytics updated with latest metrics.' });
      }
    } catch (err) {
      console.error('RevenueOptimization fetch error:', err);
      if (showSuccessToast) {
        addToast({ type: 'error', title: 'Refresh Failed', message: 'Could not fetch latest revenue metrics.' });
      }
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const categoryOptions = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (category === 'all') return products;
    return products.filter(p =>
      p.category && (
        p.category.toLowerCase() === category.toLowerCase() ||
        p.category.toLowerCase().includes(category.toLowerCase())
      )
    );
  }, [products, category]);

  const totalRevenue = useMemo(() => filteredProducts.reduce((s, p) => s + p.revenue, 0), [filteredProducts]);
  const totalProfit  = useMemo(() => filteredProducts.reduce((s, p) => s + p.profit, 0), [filteredProducts]);
  const totalUnits   = useMemo(() => filteredProducts.reduce((s, p) => s + p.units, 0), [filteredProducts]);

  const trendData = useMemo(() => {
    return buildTrendData(totalRevenue > 0 ? totalRevenue : baseRevenue, dateRange);
  }, [totalRevenue, baseRevenue, dateRange]);

  const handleExport = () => {
    const headers = ['Product ID', 'Name', 'Category', 'Revenue', 'Profit', 'Margin %', 'Units Sold', 'Avg Price', 'Growth %'];
    const rows = filteredProducts.map(p => [
      p.id, p.name, p.category, p.revenue, p.profit, p.margin, p.units, p.avgPrice, p.growth
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'revenue_financial_analysis.csv'; a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Export Complete', message: `${filteredProducts.length} product rows exported to CSV.` });
  };

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs h-8">
        <option value="all">All Categories</option>
        {categoryOptions.map(cat => (
          <option key={cat} value={cat.toLowerCase()}>{cat}</option>
        ))}
      </NativeSelect>
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <Button variant="ghost" size="sm" icon={RefreshCw} className="text-xs" onClick={handleRefresh} disabled={refreshing}>
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </Button>
      <Button variant="ghost" size="sm" icon={Download} className="text-xs" onClick={handleExport}>
        Export
      </Button>
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
      <KPIStrip totalRevenue={totalRevenue} totalProfit={totalProfit} totalUnits={totalUnits} />

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
        <TrendChart metric={metric} showPrior={showPrior} data={trendData} />
      </div>

      {/* Category + Price-Volume */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Revenue by Category</h3>
            <MetricToggle value={metric} onChange={setMetric} />
          </div>
          <CategoryBar metric={metric} products={filteredProducts} />
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
        <ContributionBar products={filteredProducts} totalRevenue={totalRevenue} />
      </div>

      {/* Financial Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Financial Analysis</h3>
          <span className="text-[10px] font-mono text-slate-400">Click column headers to sort</span>
        </div>
        <FinancialTable products={filteredProducts} totalRevenue={totalRevenue} totalProfit={totalProfit} totalUnits={totalUnits} />
      </div>
    </ModuleShell>
  );
}

export default RevenueOptimization;
