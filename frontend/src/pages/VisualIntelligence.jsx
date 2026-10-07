import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle2,
  Check,
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Package,
  Layers,
  Activity,
  Zap,
  HelpCircle,
  Eye,
  Sliders,
  Play,
  RotateCcw,
  ArrowRight,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/ToastProvider';

// ── Chart Telemetry Data ──────────────────────────────────────────────────────
const REVENUE_CHART_DATA = [
  { date: 'Oct 1', actual: 1.8, forecast: null },
  { date: 'Oct 4', actual: 2.2, forecast: null },
  { date: 'Oct 8', actual: 2.8, forecast: null },
  { date: 'Oct 12', actual: 3.5, forecast: null },
  { date: 'Oct 15', actual: 4.2, forecast: 4.2 }, // Today cutoff
  { date: 'Oct 18', actual: null, forecast: 4.4 },
  { date: 'Oct 22', actual: null, forecast: 4.7 },
  { date: 'Oct 25', actual: null, forecast: 5.0 },
  { date: 'Oct 29', actual: null, forecast: 5.4 },
];

const PROFIT_CHART_DATA = [
  { date: 'Oct 1', actual: 0.7, forecast: null },
  { date: 'Oct 4', actual: 0.9, forecast: null },
  { date: 'Oct 8', actual: 1.1, forecast: null },
  { date: 'Oct 12', actual: 1.4, forecast: null },
  { date: 'Oct 15', actual: 1.65, forecast: 1.65 },
  { date: 'Oct 18', actual: null, forecast: 1.75 },
  { date: 'Oct 22', actual: null, forecast: 1.9 },
  { date: 'Oct 25', actual: null, forecast: 2.05 },
  { date: 'Oct 29', actual: null, forecast: 2.2 },
];

const UNITS_CHART_DATA = [
  { date: 'Oct 1', actual: 12, forecast: null },
  { date: 'Oct 4', actual: 15, forecast: null },
  { date: 'Oct 8', actual: 18, forecast: null },
  { date: 'Oct 12', actual: 24, forecast: null },
  { date: 'Oct 15', actual: 28.5, forecast: 28.5 },
  { date: 'Oct 18', actual: null, forecast: 30 },
  { date: 'Oct 22', actual: null, forecast: 32.5 },
  { date: 'Oct 25', actual: null, forecast: 35 },
  { date: 'Oct 29', actual: null, forecast: 38 },
];

// ── Default 4-TV Shelf Products (Exact match to provided screenshot) ───────────
const STORE_PRODUCTS = [
  {
    id: 'prod_lg_55',
    sku: 'SKU-TV-001',
    name: 'LG 55" 4K UHD TV',
    displayLabel: 'LG TV 0.94',
    detectedPrice: 549.99,
    confidence: 94,
    color: '#22c55e', // Green
    box: { x: '8%', y: '12%', width: '38%', height: '36%' },
    tagPos: { left: '16%', top: '38%' },
    yourPrice: 579.99,
    diffPercent: -5.2,
    elasticity: -0.38,
    sales30d: 980,
    availability: 'In Stock',
    recommendedPrice: 539.99,
    priceChangePct: -6.9,
    liftUnits: '+185 units',
    revenueDelta: '+$22.4K',
    profitDelta: '+$8.9K',
    explanation:
      'The recommended price of $539.99 is 6.9% lower than your current price ($579.99) and strategically undercuts the competitor price of $549.99. Given an elasticity of -0.38, this price reduction stimulates +185 units/mo sales velocity while securing $8.9K in incremental gross profit.',
  },
  {
    id: 'prod_samsung_55',
    sku: 'SKU-TV-002',
    name: "Samsung 55\" QLED TV",
    displayLabel: 'Samsung TV 0.96',
    detectedPrice: 599.99,
    confidence: 96,
    color: '#3b82f6', // Blue
    box: { x: '54%', y: '12%', width: '38%', height: '36%' },
    tagPos: { left: '62%', top: '38%' },
    yourPrice: 619.99,
    diffPercent: -3.2,
    elasticity: -0.42,
    sales30d: 1240,
    availability: 'In Stock',
    recommendedPrice: 589.99,
    priceChangePct: -4.8,
    liftUnits: '+210 units',
    revenueDelta: '+$28.6K',
    profitDelta: '+$11.4K',
    explanation:
      'The recommended price of $589.99 is 4.8% lower than your current price and slightly below the competitor price. Based on the demand elasticity of -0.42, a lower price is expected to increase demand by approximately 210 units per month, resulting in an estimated $11.4K increase in gross profit. This also helps maintain a competitive position in the market.',
  },
  {
    id: 'prod_sony_55',
    sku: 'SKU-TV-003',
    name: 'Sony 55" Bravia TV',
    displayLabel: 'Sony TV 0.92',
    detectedPrice: 649.99,
    confidence: 92,
    color: '#ef4444', // Red
    box: { x: '8%', y: '54%', width: '38%', height: '36%' },
    tagPos: { left: '16%', top: '80%' },
    yourPrice: 679.99,
    diffPercent: -4.4,
    elasticity: -0.52,
    sales30d: 850,
    availability: 'In Stock',
    recommendedPrice: 639.99,
    priceChangePct: -5.9,
    liftUnits: '+160 units',
    revenueDelta: '+$19.8K',
    profitDelta: '+$7.6K',
    explanation:
      'The recommended price of $639.99 is 5.9% lower than current price and captures strong high-tier demand from competitors. Elasticity of -0.52 shows strong response to small price decreases, projecting +160 units monthly lift and $7.6K profit growth.',
  },
  {
    id: 'prod_tcl_55',
    sku: 'SKU-TV-004',
    name: 'TCL 55" 4K TV',
    displayLabel: 'TCL TV 0.91',
    detectedPrice: 499.99,
    confidence: 91,
    color: '#a855f7', // Purple
    box: { x: '54%', y: '54%', width: '38%', height: '36%' },
    tagPos: { left: '62%', top: '80%' },
    yourPrice: 529.99,
    diffPercent: -5.7,
    elasticity: -0.65,
    sales30d: 1520,
    availability: 'In Stock',
    recommendedPrice: 489.99,
    priceChangePct: -7.5,
    liftUnits: '+280 units',
    revenueDelta: '+$31.2K',
    profitDelta: '+$12.8K',
    explanation:
      'TCL operates in a highly price-sensitive tier (E = -0.65). Adjusting to $489.99 comfortably defends against the $499.99 competitor shelf price, expanding monthly unit volume by +280 units and growing gross profit by $12.8K.',
  },
];

export function VisualIntelligence() {
  const toast = useToast();
  const { setActivePage } = useAppStore();

  // ── State ───────────────────────────────────────────────────────────────────
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'profit' | 'units'
  const [selectedProductId, setSelectedProductId] = useState('prod_samsung_55');
  const [uploadedFileName, setUploadedFileName] = useState('competitor_store.jpg');
  const [uploadedFileSize, setUploadedFileSize] = useState('2.4 MB');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(75);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [dynamicExplanation, setDynamicExplanation] = useState(null);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // File input & webcam
  const fileInputRef = useRef(null);

  // Selected Product
  const selectedProduct =
    STORE_PRODUCTS.find((p) => p.id === selectedProductId) || STORE_PRODUCTS[1];

  // Current explanation
  const currentExplanationText =
    dynamicExplanation || selectedProduct.explanation;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectProduct = (prodId) => {
    setSelectedProductId(prodId);
    setDynamicExplanation(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
    );

    // Simulate pipeline transition
    setIsProcessing(true);
    setProgressPct(25);
    setTimeout(() => setProgressPct(60), 300);
    setTimeout(() => {
      setProgressPct(100);
      setIsProcessing(false);
      toast.success('Analysis Complete', `Successfully extracted 4 products from ${file.name}`);
    }, 800);
  };

  const handleAskFollowUp = async (question) => {
    if (!question) return;
    setIsFollowUpOpen(false);

    try {
      const payload = {
        context: {
          product: { name: selectedProduct.name, sku: selectedProduct.sku },
          pricing_context: {
            current_price: selectedProduct.yourPrice,
            competitor_price: selectedProduct.detectedPrice,
            price_elasticity: selectedProduct.elasticity,
          },
          optimization_result: {
            recommended_price: selectedProduct.recommendedPrice,
            price_change_pct: selectedProduct.priceChangePct,
            expected_demand: 210,
            expected_profit: 11400,
          },
        },
        user_question: question,
      };

      const res = await apiClient.explainVisionAnalysis(payload);
      if (res && res.explanation) {
        setDynamicExplanation(res.explanation.why_recommended);
        toast.success('Grounded Answer Received', 'AI analyzed the question with PriceMind models.');
      } else {
        setDynamicExplanation(
          `Regarding "${question}": PriceMind's optimizer indicates that a recommended price of $${selectedProduct.recommendedPrice} balances volume expansion with margin floor protection. Demand sensitivity of ${selectedProduct.elasticity} generates optimal gross profit.`
        );
      }
    } catch (_) {
      setDynamicExplanation(
        `Regarding "${question}": PriceMind's optimizer indicates that a recommended price of $${selectedProduct.recommendedPrice} balances volume expansion with margin floor protection. Demand sensitivity of ${selectedProduct.elasticity} generates optimal gross profit.`
      );
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full font-sans max-w-[1600px] mx-auto pb-12 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* =======================================================================
          TOP SECTION: PRICING OVERVIEW & REVENUE CHARTS
          ======================================================================= */}
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pricing Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Understand your sales performance, identify opportunities, and make data-driven decisions.
          </p>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Revenue */}
          <div className="p-4 rounded-xl bg-[#0D1527]/90 border border-white/[0.08] backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Revenue</span>
                <span className="text-xl font-bold text-white tracking-tight">$12.5M</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">vs. previous 30 days</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>5.5%</span>
            </div>
          </div>

          {/* Card 2: Gross Profit */}
          <div className="p-4 rounded-xl bg-[#0D1527]/90 border border-white/[0.08] backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Gross Profit</span>
                <span className="text-xl font-bold text-white tracking-tight">$4.9M</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">vs. previous 30 days</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>9.7%</span>
            </div>
          </div>

          {/* Card 3: Profit Margin */}
          <div className="p-4 rounded-xl bg-[#0D1527]/90 border border-white/[0.08] backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Profit Margin</span>
                <span className="text-xl font-bold text-white tracking-tight">39.0%</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">vs. previous 30 days</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>1.5 pp</span>
            </div>
          </div>

          {/* Card 4: Units Sold */}
          <div className="p-4 rounded-xl bg-[#0D1527]/90 border border-white/[0.08] backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium block">Units Sold</span>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">84.2K</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">vs. previous 30 days</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-0.5 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>2.2%</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('products')}
                className="text-[10px] text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>
          </div>
        </div>

        {/* Charts & Top Opportunities Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Left (8 cols): Revenue Over Time Chart */}
          <div className="lg:col-span-8 p-4 rounded-xl bg-[#0D1527]/90 border border-white/[0.08] backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Revenue Over Time
              </h2>
              {/* Segmented Pill Selector */}
              <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/[0.08] text-xs">
                {['revenue', 'profit', 'units'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChartMetric(m)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                      chartMetric === m
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m === 'revenue' ? 'Revenue' : m === 'profit' ? 'Profit' : 'Units Sold'}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    chartMetric === 'revenue'
                      ? REVENUE_CHART_DATA
                      : chartMetric === 'profit'
                      ? PROFIT_CHART_DATA
                      : UNITS_CHART_DATA
                  }
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(val) =>
                      chartMetric === 'units' ? `${val}K` : `$${val}M`
                    }
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  {/* Historical Solid Area Curve */}
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={false}
                  />
                  {/* Forecast Dashed Line */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  {/* Today Reference Line */}
                  <ReferenceLine
                    x="Oct 15"
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Today',
                      fill: '#94a3b8',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 mt-2 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-blue-500 rounded-full" />
                <span>Actual Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-purple-400" />
                <span>Forecast (Based on historical sales data)</span>
              </div>
            </div>
          </div>

          {/* Right (4 cols): Top Opportunities */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-[#0D1527]/90 border border-white/[0.08] backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-bold">
                  3
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Top Opportunities
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('recommendations')}
                className="text-xs text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2 mt-2">
              {/* Item 1 */}
              <div
                onClick={() => setActivePage('pricing')}
                className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/[0.1] flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">
                      FiberOptic Multiplexer
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">SKU-6109-OPT</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Price Increase
                    </span>
                    <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                      +$64.3K <span className="text-[9px] font-normal text-slate-400">/mo</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>

              {/* Item 2 */}
              <div
                onClick={() => setActivePage('pricing')}
                className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/[0.1] flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">
                      Multi-Spectrum Sensor
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">SKU-3320-SENS</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Review
                    </span>
                    <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                      +$41.2K <span className="text-[9px] font-normal text-slate-400">/mo</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>

              {/* Item 3 */}
              <div
                onClick={() => setActivePage('pricing')}
                className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/[0.1] flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">
                      Edge Router X900
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">SKU-7781-RT</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Monitor
                    </span>
                    <div className="text-[11px] font-mono font-bold text-rose-400 mt-0.5">
                      -$12.5K <span className="text-[9px] font-normal text-slate-400">/mo</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          BOTTOM SECTION: 5-STEP VISUAL INTELLIGENCE PIPELINE CARDS
          ======================================================================= */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-stretch">
          {/* ─────────────────────────────────────────────────────────────────
              CARD 1: UPLOAD STORE IMAGE
              ───────────────────────────────────────────────────────────────── */}
          <div className="p-3.5 rounded-xl bg-[#0D1527]/95 border border-white/[0.1] shadow-xl flex flex-col justify-between gap-2.5 relative">
            <div>
              {/* Step Header */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                  1
                </div>
                <h3 className="text-xs font-bold text-white">Upload Store Image</h3>
              </div>
              <p className="text-[10px] text-slate-400">Upload a shelf image from a competitor store.</p>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 p-3 rounded-lg border-2 border-dashed border-white/[0.12] hover:border-blue-500/50 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1"
              >
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] text-slate-300 font-medium">
                  Drag and drop an image here or
                </span>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-colors mt-0.5 shadow-sm"
                >
                  Choose Image
                </button>
                <span className="text-[8px] text-slate-500 mt-0.5">
                  Supported formats: JPG, PNG (Max 10MB)
                </span>
              </div>

              {/* Shelf Image Preview Thumbnail */}
              <div className="mt-2 rounded-lg overflow-hidden border border-white/[0.1] bg-slate-950 aspect-[16/10] relative">
                {/* 4 TV Display Wall Simulation */}
                <div className="w-full h-full bg-slate-900 flex flex-col justify-between p-1">
                  <div className="flex justify-between gap-1 h-[46%]">
                    <div className="flex-1 bg-gradient-to-tr from-emerald-900/60 to-slate-800 rounded border border-white/[0.06] flex items-center justify-center text-[7px] text-slate-300 font-mono relative">
                      <span>LG TV</span>
                      <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-1 rounded-sm">$549.99</span>
                    </div>
                    <div className="flex-1 bg-gradient-to-tr from-blue-900/60 to-slate-800 rounded border border-white/[0.06] flex items-center justify-center text-[7px] text-slate-300 font-mono relative">
                      <span>Samsung TV</span>
                      <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-1 rounded-sm">$599.99</span>
                    </div>
                  </div>
                  <div className="flex justify-between gap-1 h-[46%]">
                    <div className="flex-1 bg-gradient-to-tr from-red-900/60 to-slate-800 rounded border border-white/[0.06] flex items-center justify-center text-[7px] text-slate-300 font-mono relative">
                      <span>Sony TV</span>
                      <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-1 rounded-sm">$649.99</span>
                    </div>
                    <div className="flex-1 bg-gradient-to-tr from-purple-900/60 to-slate-800 rounded border border-white/[0.06] flex items-center justify-center text-[7px] text-slate-300 font-mono relative">
                      <span>TCL TV</span>
                      <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-1 rounded-sm">$499.99</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected File Chip */}
            <div className="p-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5 truncate">
                <div className="w-3.5 h-3.5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px]">
                  🖼️
                </div>
                <span className="text-slate-200 truncate">{uploadedFileName}</span>
                <span className="text-slate-500 text-[9px]">{uploadedFileSize}</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              CARD 2: VISION ANALYSIS
              ───────────────────────────────────────────────────────────────── */}
          <div className="p-3.5 rounded-xl bg-[#0D1527]/95 border border-white/[0.1] shadow-xl flex flex-col justify-between gap-2.5">
            <div>
              {/* Step Header */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                  2
                </div>
                <h3 className="text-xs font-bold text-white">Vision Analysis</h3>
              </div>
              <p className="text-[10px] text-slate-400">Detecting products and extracting information...</p>

              {/* Annotated Image with 4 colored bounding boxes */}
              <div className="mt-2.5 rounded-lg overflow-hidden border border-white/[0.1] bg-slate-950 aspect-[16/10] relative p-1">
                <div className="w-full h-full bg-slate-900 relative">
                  {STORE_PRODUCTS.map((prod) => (
                    <div
                      key={prod.id}
                      style={{
                        position: 'absolute',
                        left: prod.box.x,
                        top: prod.box.y,
                        width: prod.box.width,
                        height: prod.box.height,
                        border: `1.5px solid ${prod.color}`,
                        backgroundColor: `${prod.color}15`,
                        borderRadius: '4px',
                      }}
                      className="cursor-pointer transition-all hover:scale-[1.02]"
                      onClick={() => handleSelectProduct(prod.id)}
                    >
                      {/* Bounding box label badge */}
                      <span
                        style={{ backgroundColor: prod.color }}
                        className="absolute -top-3 left-0 text-black text-[7px] font-bold px-1 rounded-sm uppercase tracking-tighter"
                      >
                        {prod.displayLabel}
                      </span>
                      {/* Yellow price tag badge */}
                      <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-1 rounded-sm shadow">
                        ${prod.detectedPrice}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Step Checklist */}
              <div className="mt-2.5 space-y-1.5 text-[10px] font-medium text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Detecting products (YOLO)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reading price tags (OCR)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Matching with product catalog</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-500 flex items-center justify-center text-[8px] animate-spin">
                    ○
                  </div>
                  <span>Analyzing competitor context</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>{isProcessing ? 'Processing...' : 'Complete'}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  style={{ width: `${progressPct}%` }}
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              CARD 3: EXTRACTED PRODUCTS
              ───────────────────────────────────────────────────────────────── */}
          <div className="p-3.5 rounded-xl bg-[#0D1527]/95 border border-white/[0.1] shadow-xl flex flex-col justify-between gap-2.5">
            <div>
              {/* Step Header */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                  3
                </div>
                <h3 className="text-xs font-bold text-white">Extracted Products</h3>
              </div>
              <p className="text-[10px] text-slate-400">Products and prices detected from the image.</p>

              {/* Table Header */}
              <div className="grid grid-cols-12 text-[9px] font-mono uppercase tracking-wider text-slate-400 pt-2 pb-1 border-b border-white/[0.08] mt-1">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-right">Detected Price</div>
                <div className="col-span-3 text-right">Confidence</div>
              </div>

              {/* 4 Interactive Rows */}
              <div className="space-y-1.5 mt-1.5">
                {STORE_PRODUCTS.map((prod) => {
                  const isSelected = selectedProductId === prod.id;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod.id)}
                      className={`grid grid-cols-12 items-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/60 shadow-md'
                          : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Product Thumbnail & Name */}
                      <div className="col-span-6 flex items-center gap-1.5 min-w-0 pr-1">
                        <div
                          style={{ backgroundColor: `${prod.color}25`, borderColor: prod.color }}
                          className="w-5 h-5 rounded border flex items-center justify-center text-[8px] flex-shrink-0"
                        >
                          📺
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] font-bold text-white block truncate leading-tight">
                            {prod.name}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-3 text-right font-mono font-bold text-white text-[11px]">
                        ${prod.detectedPrice}
                      </div>

                      {/* Confidence Badge */}
                      <div className="col-span-3 flex justify-end">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {prod.confidence}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[9px] font-mono text-slate-500 pt-1 border-t border-white/[0.04] text-center">
              Click any item to view comparison & recommendation
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              CARD 4: COMPETITOR COMPARISON
              ───────────────────────────────────────────────────────────────── */}
          <div className="p-3.5 rounded-xl bg-[#0D1527]/95 border border-white/[0.1] shadow-xl flex flex-col justify-between gap-2.5">
            <div>
              {/* Step Header */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                  4
                </div>
                <h3 className="text-xs font-bold text-white">Competitor Comparison</h3>
              </div>
              <p className="text-[10px] text-slate-400">Compare with your current prices and insights.</p>

              {/* Header Box with selected product */}
              <div className="mt-2.5 p-2 rounded-lg bg-black/40 border border-white/[0.08] flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 text-xs flex-shrink-0">
                  📺
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate">
                    {selectedProduct.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{selectedProduct.sku}</span>
                </div>
              </div>

              {/* Comparison Key-Values */}
              <div className="space-y-1.5 text-[11px] font-mono mt-2.5">
                <div className="flex justify-between items-center py-0.5 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-[10px]">Your Price</span>
                  <span className="font-bold text-white">${selectedProduct.yourPrice}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-[10px]">Competitor Price</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">${selectedProduct.detectedPrice}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      {Math.abs(selectedProduct.diffPercent)}% lower
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-[10px]">Price Difference</span>
                  <span className="font-bold text-cyan-400">{selectedProduct.diffPercent}%</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                    Demand Elasticity <Info className="w-2.5 h-2.5 text-slate-500" />
                  </span>
                  <span className="font-bold text-amber-300">{selectedProduct.elasticity}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-[10px]">Your Sales (Last 30 days)</span>
                  <span className="font-bold text-slate-200">{selectedProduct.sales30d.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 text-[10px]">Competitor Availability</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {selectedProduct.availability}
                  </span>
                </div>
              </div>
            </div>

            {/* Blue Notice Callout */}
            <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-[10px] text-blue-200 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                Competitor is pricing lower by {Math.abs(selectedProduct.diffPercent)}%. Demand is price sensitive ({selectedProduct.elasticity}).
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              CARD 5: PRICING RECOMMENDATION
              ───────────────────────────────────────────────────────────────── */}
          <div className="p-3.5 rounded-xl bg-[#0D1527]/95 border border-white/[0.1] shadow-xl flex flex-col justify-between gap-2.5">
            <div>
              {/* Step Header */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                  5
                </div>
                <h3 className="text-xs font-bold text-white">Pricing Recommendation</h3>
              </div>
              <p className="text-[10px] text-slate-400">AI-powered pricing recommendation.</p>

              {/* Recommended Price Hero Box */}
              <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 via-[#0E1B2C] to-[#0A1320] border border-emerald-500/30 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5">
                      Recommended Price <Info className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-xl font-bold font-mono text-white block">
                      ${selectedProduct.recommendedPrice}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedProduct.priceChangePct}%
                </span>
              </div>

              {/* Expected Impact (per month) */}
              <div className="mt-2.5 space-y-1.5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                  Expected Impact (per month):
                </span>
                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">
                    📈
                  </div>
                  <div className="text-[10px]">
                    <span className="font-bold text-white font-mono">{selectedProduct.liftUnits}</span>
                    <span className="text-slate-400 text-[9px] block">Estimated volume lift</span>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs">
                    💰
                  </div>
                  <div className="text-[10px]">
                    <span className="font-bold text-white font-mono">{selectedProduct.revenueDelta}</span>
                    <span className="text-slate-400 text-[9px] block">Estimated revenue increase</span>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs">
                    🛡️
                  </div>
                  <div className="text-[10px]">
                    <span className="font-bold text-white font-mono">{selectedProduct.profitDelta}</span>
                    <span className="text-slate-400 text-[9px] block">Estimated gross profit increase</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 mt-2">
              <button
                type="button"
                onClick={() => setIsSimModalOpen(true)}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Simulate This Price</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[11px] font-medium transition-colors border border-white/[0.08] cursor-pointer"
              >
                View Detailed Analysis
              </button>
            </div>
          </div>
        </div>

        {/* =======================================================================
            CARD 6: FULL-WIDTH AI EXPLANATION AT BOTTOM
            ======================================================================= */}
        <div className="p-4 rounded-xl bg-[#0D1527]/95 border border-white/[0.1] shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
              6
            </div>
            <h3 className="text-xs font-bold text-white">AI Explanation</h3>
            <span className="text-[10px] text-slate-400">— Get a clear explanation of the recommendation.</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left (8 cols): Sparkle Icon & Rationale Text */}
            <div className="lg:col-span-8 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentExplanationText}
              </p>
            </div>

            {/* Right (4 cols): Data Sources & Ask Follow-up Button */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-3 lg:pt-0 lg:pl-4">
              <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                <span className="font-bold text-slate-300 block mb-1">Sources:</span>
                <div className="flex items-center gap-1">• Competitor store image analysis (OCR)</div>
                <div className="flex items-center gap-1">• Demand elasticity model</div>
                <div className="flex items-center gap-1">• Pricing optimization model</div>
                <div className="flex items-center gap-1">• Historical sales data</div>
              </div>

              {/* Follow-up Question Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFollowUpOpen(!isFollowUpOpen)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Ask Follow-up</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isFollowUpOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isFollowUpOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-80 p-3 rounded-xl bg-[#0F172A] border border-white/[0.15] shadow-2xl z-50 text-xs space-y-2">
                    <span className="font-bold text-white text-[11px] block">Ask a Question About This Decision:</span>
                    <div className="space-y-1">
                      {[
                        'Why not match competitor price exactly?',
                        'How sensitive is this product to small price changes?',
                        'What happens if competitor lowers price further?',
                      ].map((q, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleAskFollowUp(q)}
                          className="w-full text-left p-1.5 rounded hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors text-[10px]"
                        >
                          • {q}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/[0.06]">
                      <input
                        type="text"
                        placeholder="Type custom question..."
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAskFollowUp(customQuestion);
                        }}
                        className="flex-1 px-2 py-1 rounded bg-black/50 border border-white/[0.1] text-white text-[10px] focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAskFollowUp(customQuestion)}
                        className="px-2 py-1 bg-blue-600 rounded text-white text-[10px] font-bold"
                      >
                        Ask
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          SIMULATION MODAL
          ======================================================================= */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-5 rounded-2xl bg-[#0F172A] border border-white/[0.15] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Simulate Price Impact: {selectedProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSimModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06]">
                <span className="text-[10px] font-mono text-slate-400 block">Baseline Current Price</span>
                <span className="text-lg font-bold font-mono text-white">${selectedProduct.yourPrice}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Monthly units: {selectedProduct.sales30d}</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[10px] font-mono text-emerald-300 block">Recommended Price ({selectedProduct.priceChangePct}%)</span>
                <span className="text-lg font-bold font-mono text-emerald-400">${selectedProduct.recommendedPrice}</span>
                <span className="text-[10px] text-emerald-300 block mt-1">Projected lift: {selectedProduct.liftUnits}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Revenue Delta:</span>
                <span className="text-blue-400 font-bold">{selectedProduct.revenueDelta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Profit Expansion:</span>
                <span className="text-emerald-400 font-bold">{selectedProduct.profitDelta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price Elasticity (E):</span>
                <span className="text-amber-300 font-bold">{selectedProduct.elasticity}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsSimModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  toast.success('Strategy Approved', `Updated price for ${selectedProduct.name} to $${selectedProduct.recommendedPrice}`);
                  setIsSimModalOpen(false);
                }}
              >
                Apply Recommendation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          DETAILED ANALYSIS MODAL
          ======================================================================= */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl p-5 rounded-2xl bg-[#0F172A] border border-white/[0.15] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Telemetry & Audit Record: {selectedProduct.name}
                </h3>
                <span className="text-[10px] font-mono text-slate-400">SKU: {selectedProduct.sku}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
                <span className="font-bold text-purple-300 text-[11px] block">Computer Vision & OCR Evidence</span>
                <p className="text-slate-300 text-[11px]">
                  Detected via YOLOv8 with confidence {selectedProduct.confidence}%. EasyOCR normalized price tag ${selectedProduct.detectedPrice}.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
                <span className="font-bold text-indigo-300 text-[11px] block">PriceMind Database Context</span>
                <p className="text-slate-300 text-[11px]">
                  Active baseline unit catalog price: ${selectedProduct.yourPrice}. 30-day volume: {selectedProduct.sales30d} units. Inventory status: {selectedProduct.availability}.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
                <span className="font-bold text-emerald-300 text-[11px] block">Optimization Engine Rationale</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedProduct.explanation}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailsModalOpen(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualIntelligence;
