import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Cpu,
  BarChart3,
  Sliders,
  Filter,
  Info,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { mockSKUs, mockElasticityCurves } from '../mock/mockData';
import { formatNumber, formatPercent, formatCurrency } from '../lib/utils';

// Design System Components
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
import { DateRangePicker } from '../components/ui/DatePicker';
import { Tooltip } from '../components/ui/Tooltip';
import { useToast } from '../components/ui/ToastProvider';

export function DemandElasticity() {
  const { setSelectedSkuForDrawer, setActivePage, currency } = useAppStore();
  const toast = useToast();

  // Control State
  const [selectedSkuCode, setSelectedSkuCode] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('90d');
  const [forecastHorizon, setForecastHorizon] = useState('60d'); // '30d' | '60d' | '90d' | '180d'
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('price_vs_demand'); // 'price_vs_demand' | 'seasonality' | 'distribution' | 'accuracy'
  const [rankingTab, setRankingTab] = useState('growth'); // 'growth' | 'decline' | 'volatility' | 'uncertainty'

  const activeSku = useMemo(() => {
    if (selectedSkuCode === 'ALL') return null;
    return mockSKUs.find((s) => s.skuCode === selectedSkuCode) || null;
  }, [selectedSkuCode]);

  // Large Analytical Time-Series Dataset (Actual, Forecast, Uncertainty Bounds)
  const forecastSeries = useMemo(() => {
    const scale = activeSku ? activeSku.currentVelocity * 30 : 25000;
    return [
      { period: 'Nov W1', actual: Math.round(scale * 0.94), isForecast: false },
      { period: 'Nov W2', actual: Math.round(scale * 0.96), isForecast: false },
      { period: 'Nov W3', actual: Math.round(scale * 0.98), isForecast: false },
      { period: 'Nov W4', actual: Math.round(scale * 1.02), isForecast: false },
      { period: 'Dec W1', actual: Math.round(scale * 1.08), isForecast: false },
      { period: 'Dec W2', actual: Math.round(scale * 1.14), isForecast: false },
      { period: 'Dec W3', actual: Math.round(scale * 1.18), isForecast: false },
      { period: 'Dec W4', actual: Math.round(scale * 1.12), isForecast: false },
      { period: 'Jan W1', actual: Math.round(scale * 0.95), isForecast: false },
      { period: 'Jan W2', actual: Math.round(scale * 0.97), isForecast: false },
      { period: 'Jan W3', actual: Math.round(scale * 0.99), isForecast: false },
      { period: 'Jan W4', actual: Math.round(scale * 1.00), isForecast: false },
      { period: 'Feb W1', actual: Math.round(scale * 1.01), isForecast: false },
      { period: 'Feb W2', actual: Math.round(scale * 1.03), isForecast: false },
      { period: 'Feb W3', actual: Math.round(scale * 1.02), isForecast: false },
      { period: 'Feb W4 (Today)', actual: Math.round(scale * 1.04), forecast: Math.round(scale * 1.04), lowerBound: Math.round(scale * 1.01), upperBound: Math.round(scale * 1.07), isForecast: false },
      { period: 'Mar W1 (Fcst)', forecast: Math.round(scale * 1.06), lowerBound: Math.round(scale * 1.01), upperBound: Math.round(scale * 1.11), isForecast: true },
      { period: 'Mar W2 (Fcst)', forecast: Math.round(scale * 1.07), lowerBound: Math.round(scale * 1.00), upperBound: Math.round(scale * 1.14), isForecast: true },
      { period: 'Mar W3 (Fcst)', forecast: Math.round(scale * 1.09), lowerBound: Math.round(scale * 1.01), upperBound: Math.round(scale * 1.17), isForecast: true },
      { period: 'Mar W4 (Fcst)', forecast: Math.round(scale * 1.11), lowerBound: Math.round(scale * 1.02), upperBound: Math.round(scale * 1.20), isForecast: true },
      { period: 'Apr W1 (Fcst)', forecast: Math.round(scale * 1.13), lowerBound: Math.round(scale * 1.03), upperBound: Math.round(scale * 1.23), isForecast: true },
      { period: 'Apr W2 (Fcst)', forecast: Math.round(scale * 1.14), lowerBound: Math.round(scale * 1.02), upperBound: Math.round(scale * 1.26), isForecast: true },
      { period: 'Apr W3 (Fcst)', forecast: Math.round(scale * 1.16), lowerBound: Math.round(scale * 1.03), upperBound: Math.round(scale * 1.29), isForecast: true },
      { period: 'Apr W4 (Fcst)', forecast: Math.round(scale * 1.18), lowerBound: Math.round(scale * 1.04), upperBound: Math.round(scale * 1.32), isForecast: true },
    ];
  }, [activeSku]);

  // Price vs Demand Curve Data
  const priceVsDemandData = useMemo(() => {
    if (activeSku && mockElasticityCurves[activeSku.skuCode]) {
      return mockElasticityCurves[activeSku.skuCode];
    }
    return [
      { price: 120, demandUnits: 1420, revenue: 170400 },
      { price: 130, demandUnits: 1360, revenue: 176800 },
      { price: 140, demandUnits: 1290, revenue: 180600 },
      { price: 149, demandUnits: 1220, revenue: 181780 },
      { price: 160, demandUnits: 1080, revenue: 172800 },
      { price: 175, demandUnits: 890, revenue: 155750 },
      { price: 190, demandUnits: 680, revenue: 129200 },
    ];
  }, [activeSku]);

  // Seasonality Data (Monthly seasonal multiplier index: 1.0 = baseline average)
  const seasonalityData = [
    { month: 'Jan', index: 0.88, label: '-12% Trough' },
    { month: 'Feb', index: 0.94, label: '-6%' },
    { month: 'Mar', index: 1.02, label: '+2%' },
    { month: 'Apr', index: 1.05, label: '+5%' },
    { month: 'May', index: 1.08, label: '+8%' },
    { month: 'Jun', index: 1.04, label: '+4%' },
    { month: 'Jul', index: 0.96, label: '-4%' },
    { month: 'Aug', index: 0.98, label: '-2%' },
    { month: 'Sep', index: 1.06, label: '+6%' },
    { month: 'Oct', index: 1.12, label: '+12%' },
    { month: 'Nov', index: 1.28, label: '+28% Peak' },
    { month: 'Dec', index: 1.34, label: '+34% Peak' },
  ];

  // Demand Distribution Buckets
  const demandDistributionData = [
    { bucket: '0–20 u/d', frequency: 8, pct: '11%' },
    { bucket: '21–40 u/d', frequency: 18, pct: '26%' },
    { bucket: '41–60 u/d', frequency: 26, pct: '37%' },
    { bucket: '61–80 u/d', frequency: 12, pct: '17%' },
    { bucket: '81–100 u/d', frequency: 4, pct: '6%' },
    { bucket: '100+ u/d', frequency: 2, pct: '3%' },
  ];

  // Forecast Accuracy / Residuals tracking (Past 8 Weeks)
  const accuracyResidualsData = [
    { week: 'W-8', predicted: 24200, actual: 24500, errorPct: 1.24 },
    { week: 'W-7', predicted: 24800, actual: 24650, errorPct: -0.60 },
    { week: 'W-6', predicted: 25100, actual: 25400, errorPct: 1.19 },
    { week: 'W-5', predicted: 25900, actual: 25750, errorPct: -0.58 },
    { week: 'W-4', predicted: 26400, actual: 26900, errorPct: 1.89 },
    { week: 'W-3', predicted: 27200, actual: 27100, errorPct: -0.37 },
    { week: 'W-2', predicted: 27800, actual: 28150, errorPct: 1.26 },
    { week: 'W-1', predicted: 28500, actual: 28420, errorPct: -0.28 },
  ];

  // Ranking Datasets
  const growthSKUs = [
    { skuCode: 'SKU-6109-OPT', name: 'FiberOptic Multiplexer 40Gbps Rack Unit', category: 'Telecommunications', currentVelocity: 65, velocityDeltaPct: 24.8, forecastVol: 1950, elasticity: -0.38, status: 'Surging Demand' },
    { skuCode: 'SKU-8921-PRO', name: 'Precision Industrial Calibrator X1', category: 'Hardware & Tools', currentVelocity: 42, velocityDeltaPct: 14.2, forecastVol: 1260, elasticity: -0.62, status: 'Strong Growth' },
    { skuCode: 'SKU-1082-LOG', name: 'Autonomous AGV Telemetry Gateway', category: 'Robotics', currentVelocity: 14, velocityDeltaPct: 9.8, forecastVol: 420, elasticity: -0.85, status: 'Steady Growth' },
  ];

  const declineSKUs = [
    { skuCode: 'SKU-3320-SENS', name: 'Multi-Spectrum Ambient Sensor Array', category: 'IoT & Sensors', currentVelocity: 110, velocityDeltaPct: -14.5, forecastVol: 3300, elasticity: -2.35, status: 'Competitor Pressure' },
    { skuCode: 'SKU-4402-AIR', name: 'AeroStream Commercial Turbine Fan', category: 'HVAC & Air Handling', currentVelocity: 18, velocityDeltaPct: -8.2, forecastVol: 540, elasticity: -1.88, status: 'Price Sensitive Drag' },
    { skuCode: 'SKU-5120-VAL', name: 'Hydraulic High-Pressure Relief Valve', category: 'Fluid Mechanics', currentVelocity: 34, velocityDeltaPct: -5.4, forecastVol: 1020, elasticity: -1.25, status: 'Inventory Clearance' },
  ];

  const volatileSKUs = [
    { skuCode: 'SKU-3320-SENS', name: 'Multi-Spectrum Ambient Sensor Array', category: 'IoT & Sensors', stdDev: '±28.4%', cv: 0.38, sampleSize: 3850, risk: 'High Volatility' },
    { skuCode: 'SKU-4402-AIR', name: 'AeroStream Commercial Turbine Fan', category: 'HVAC & Air Handling', stdDev: '±21.1%', cv: 0.29, sampleSize: 340, risk: 'Moderate Volatility' },
    { skuCode: 'SKU-9901-SER', name: 'UltraCore Edge Server Module E-8', category: 'Computing Infrastructure', stdDev: '±19.8%', cv: 0.26, sampleSize: 95, risk: 'Moderate Volatility' },
  ];

  const uncertaintySKUs = [
    { skuCode: 'SKU-9901-SER', name: 'UltraCore Edge Server Module E-8', category: 'Computing Infrastructure', intervalSpread: '±24.5%', confidence: 84.2, sampleSize: 95, reason: 'Small Sample Size (N=95)' },
    { skuCode: 'SKU-5120-VAL', name: 'Hydraulic High-Pressure Relief Valve', category: 'Fluid Mechanics', intervalSpread: '±18.2%', confidence: 88.4, sampleSize: 2400, reason: 'Wholesale Contract Window' },
    { skuCode: 'SKU-4402-AIR', name: 'AeroStream Commercial Turbine Fan', category: 'HVAC & Air Handling', intervalSpread: '±16.4%', confidence: 89.8, sampleSize: 340, reason: 'High Price Elasticity' },
  ];

  // Ranking Table Columns
  const rankingColumns = useMemo(() => {
    if (rankingTab === 'growth' || rankingTab === 'decline') {
      return [
        {
          header: 'Product / SKU',
          accessor: 'skuCode',
          cell: ({ row }) => (
            <div>
              <span className="font-mono font-bold text-xs text-pm-text block">{row.skuCode}</span>
              <span className="text-[11px] text-pm-textSecondary truncate max-w-xs block">{row.name}</span>
            </div>
          ),
        },
        { header: 'Category', accessor: 'category', cell: ({ value }) => <Badge variant="neutral" size="sm">{value}</Badge> },
        { header: 'Current Velocity', accessor: 'currentVelocity', align: 'right', cell: ({ value }) => `${value} u/d` },
        {
          header: 'Demand Velocity Shift',
          accessor: 'velocityDeltaPct',
          align: 'right',
          cell: ({ value }) => (
            <span className={`font-mono font-bold text-xs ${value > 0 ? 'text-pm-positiveText' : 'text-pm-negativeText'}`}>
              {formatPercent(value, true)}
            </span>
          ),
        },
        { header: 'Forecast (30d)', accessor: 'forecastVol', align: 'right', cell: ({ value }) => `${formatNumber(value)} units` },
        { header: 'Elasticity (Ed)', accessor: 'elasticity', align: 'right', cell: ({ value }) => <span className="font-mono text-xs">{value?.toFixed(2)}</span> },
        {
          header: 'Diagnostic Status',
          accessor: 'status',
          align: 'center',
          cell: ({ value }) => (
            <Badge variant={value.includes('Surging') || value.includes('Growth') ? 'success' : 'danger'} size="sm">
              {value}
            </Badge>
          ),
        },
      ];
    }

    if (rankingTab === 'volatility') {
      return [
        {
          header: 'Product / SKU',
          accessor: 'skuCode',
          cell: ({ row }) => (
            <div>
              <span className="font-mono font-bold text-xs text-pm-text block">{row.skuCode}</span>
              <span className="text-[11px] text-pm-textSecondary truncate max-w-xs block">{row.name}</span>
            </div>
          ),
        },
        { header: 'Category', accessor: 'category', cell: ({ value }) => <Badge variant="neutral" size="sm">{value}</Badge> },
        { header: 'Demand Std Deviation', accessor: 'stdDev', align: 'right', tabular: true },
        { header: 'Coeff of Variation (CV)', accessor: 'cv', align: 'right', cell: ({ value }) => <span className="font-mono text-xs font-bold">{value.toFixed(2)}</span> },
        { header: 'Sample Size (N)', accessor: 'sampleSize', align: 'right', tabular: true },
        {
          header: 'Volatility Tier',
          accessor: 'risk',
          align: 'center',
          cell: ({ value }) => (
            <Badge variant={value.includes('High') ? 'danger' : 'warning'} size="sm">
              {value}
            </Badge>
          ),
        },
      ];
    }

    // Uncertainty Tab
    return [
      {
        header: 'Product / SKU',
        accessor: 'skuCode',
        cell: ({ row }) => (
          <div>
            <span className="font-mono font-bold text-xs text-pm-text block">{row.skuCode}</span>
            <span className="text-[11px] text-pm-textSecondary truncate max-w-xs block">{row.name}</span>
          </div>
        ),
      },
      { header: 'Category', accessor: 'category', cell: ({ value }) => <Badge variant="neutral" size="sm">{value}</Badge> },
      { header: 'Prediction Bound Spread', accessor: 'intervalSpread', align: 'right', cell: ({ value }) => <span className="font-mono text-pm-warning font-semibold">{value}</span> },
      { header: 'Model Conviction', accessor: 'confidence', align: 'right', cell: ({ value }) => `${value}%` },
      { header: 'Root Factor', accessor: 'reason', cell: ({ value }) => <span className="text-xs text-pm-textMuted">{value}</span> },
    ];
  }, [rankingTab]);

  const activeRankingData = {
    growth: growthSKUs,
    decline: declineSKUs,
    volatility: volatileSKUs,
    uncertainty: uncertaintySKUs,
  }[rankingTab];

  return (
    <div className="flex flex-col gap-5 w-full font-sans max-w-7xl mx-auto">
      {/* =========================================================================
          1. HEADER & CONTROLS
          ========================================================================= */}
      <div className="flex flex-col gap-3 pb-3 border-b border-pm-borderSubtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-pm-text font-sans tracking-tight">
                Demand Intelligence & Forecasting
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pm-accentBg text-pm-accentText border border-pm-accentBorder font-semibold">
                Spline Regression Engine
              </span>
            </div>
            <p className="text-xs text-pm-textMuted mt-0.5">
              Decompose historical sales velocity, evaluate price elasticity, and inspect multi-horizon demand forecasts.
            </p>
          </div>

          {/* Slicers Toolbar: Product, Category, Date Range, Horizon */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Target SKU selector */}
            <div className="w-52">
              <Select
                value={selectedSkuCode}
                onChange={setSelectedSkuCode}
                size="sm"
                options={[
                  { value: 'ALL', label: 'All Catalog (Aggregated)' },
                  ...mockSKUs.map((s) => ({ value: s.skuCode, label: `${s.skuCode} — ${s.name}`, subtext: s.category })),
                ]}
              />
            </div>

            {/* Category Select */}
            <div className="w-40">
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                size="sm"
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'Hardware & Tools', label: 'Hardware & Tools' },
                  { value: 'Telecommunications', label: 'Telecommunications' },
                  { value: 'IoT & Sensors', label: 'IoT & Sensors' },
                  { value: 'Fluid Mechanics', label: 'Fluid Mechanics' },
                  { value: 'HVAC & Air Handling', label: 'HVAC & Air' },
                  { value: 'Computing Infrastructure', label: 'Computing' },
                ]}
              />
            </div>

            {/* Date Range */}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />

            {/* Forecast Horizon Selector */}
            <div className="w-36">
              <Select
                value={forecastHorizon}
                onChange={setForecastHorizon}
                size="sm"
                options={[
                  { value: '30d', label: 'Horizon: 30 Days' },
                  { value: '60d', label: 'Horizon: 60 Days' },
                  { value: '90d', label: 'Horizon: 90 Days' },
                  { value: '180d', label: 'Horizon: 180 Days' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MODEL METRICS STRIP (MAE, RMSE, MAPE, R²)
          ========================================================================= */}
      <div className="bg-pm-surface border border-pm-border rounded-md p-3.5 shadow-sm font-sans">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-pm-borderSubtle">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-pm-accent" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text">
              Demand Forecasting Model Accuracy & Error Diagnostics
            </h4>
          </div>
          <span className="text-[10px] font-mono text-pm-textDim">
            Model: Hierarchical-Bayes + LightGBM v3.4.1
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-pm-borderSubtle gap-y-2 sm:gap-y-0 font-mono">
          <div className="px-3 pt-1 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-pm-textDim uppercase">MAE (Mean Abs Error)</span>
              <Tooltip content="Mean Absolute Error in unit demand terms" position="top">
                <span className="text-pm-textDim text-[10px] cursor-help">ℹ</span>
              </Tooltip>
            </div>
            <span className="text-base sm:text-lg font-bold text-pm-text mt-0.5 block">
              3.42 units/day
            </span>
            <span className="text-[10px] text-pm-positiveText block">-0.32 vs prior retrain</span>
          </div>

          <div className="px-3 pt-1 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-pm-textDim uppercase">RMSE</span>
              <Tooltip content="Root Mean Squared Error penalizing large variance outliers" position="top">
                <span className="text-pm-textDim text-[10px] cursor-help">ℹ</span>
              </Tooltip>
            </div>
            <span className="text-base sm:text-lg font-bold text-pm-text mt-0.5 block">
              4.89
            </span>
            <span className="text-[10px] text-pm-positiveText block">Stable Variance Band</span>
          </div>

          <div className="px-3 pt-1 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-pm-textDim uppercase">MAPE (Percentage Error)</span>
              <Tooltip content="Mean Absolute Percentage Error across active portfolio" position="top">
                <span className="text-pm-textDim text-[10px] cursor-help">ℹ</span>
              </Tooltip>
            </div>
            <span className="text-base sm:text-lg font-bold text-pm-positiveText mt-0.5 block">
              4.2%
            </span>
            <span className="text-[10px] text-pm-textDim block">Tolerance: &lt; 8.0%</span>
          </div>

          <div className="px-3 pt-1 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-pm-textDim uppercase">R² Goodness-of-Fit</span>
              <Tooltip content="Coefficient of determination: explains 94.8% of historical demand variation" position="top">
                <span className="text-pm-textDim text-[10px] cursor-help">ℹ</span>
              </Tooltip>
            </div>
            <span className="text-base sm:text-lg font-bold text-pm-positiveText mt-0.5 block">
              0.948
            </span>
            <span className="text-[10px] text-pm-positiveText block">High Statistical Power</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. LARGE TIME-SERIES FORECAST CHART (ACTUAL / FORECAST / UNCERTAINTY)
          ========================================================================= */}
      <div className="bg-pm-surface border border-pm-border rounded-md p-4 shadow-sm font-sans flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-pm-borderSubtle mb-3">
          <div>
            <h3 className="text-xs font-semibold text-pm-text uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-pm-accent" />
              Time-Series Demand Forecast & Prediction Uncertainty
            </h3>
            <p className="text-[11px] text-pm-textDim mt-0.5">
              {activeSku
                ? `Specific SKU trajectory: ${activeSku.skuCode} (${activeSku.name})`
                : 'Aggregated catalog volume demand across historical and forecast horizons'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1 text-pm-positiveText">
              <span className="w-2.5 h-0.5 bg-pm-positive inline-block" /> Actual
            </span>
            <span className="flex items-center gap-1 text-pm-accentText font-bold">
              <span className="w-2.5 h-0.5 bg-pm-accent inline-block" /> Model Forecast
            </span>
            <span className="flex items-center gap-1 text-pm-textDim">
              <span className="w-2.5 h-2.5 bg-pm-accent/20 border border-pm-accent/40 inline-block rounded-xs" /> Uncertainty Interval (90% Bound)
            </span>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastSeries} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="uncertaintyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#64748B"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k u`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'var(--pm-bg-elevated)',
                  borderColor: 'var(--pm-border-strong)',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
                formatter={(val, name) => [
                  `${formatNumber(val)} units`,
                  name === 'actual'
                    ? 'Historical Actual'
                    : name === 'forecast'
                    ? 'Model Forecast'
                    : name === 'upperBound'
                    ? 'Upper Bound (+90% CI)'
                    : 'Lower Bound (-90% CI)',
                ]}
              />
              <ReferenceLine x="Feb W4 (Today)" stroke="#94A3B8" strokeDasharray="3 3" label={{ value: 'Today (Cutoff)', fill: '#94A3B8', fontSize: 10 }} />
              
              {/* Uncertainty Area */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="transparent"
                fill="url(#uncertaintyGrad)"
                name="upperBound"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="transparent"
                fill="var(--pm-bg-surface)"
                name="lowerBound"
              />

              {/* Forecast Line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#6366F1' }}
                name="forecast"
              />

              {/* Historical Actual Line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10B981' }}
                name="actual"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-[11px] text-pm-textDim font-mono flex items-center justify-between border-t border-pm-borderSubtle pt-2">
          <span>Uncertainty area indicates model-generated 90% prediction interval based on historical error residuals</span>
          <span>N = 1,420,950 observations</span>
        </div>
      </div>

      {/* =========================================================================
          4. ANALYSIS MODULES (Price vs Demand | Seasonality | Distribution | Accuracy)
          ========================================================================= */}
      <div className="bg-pm-surface border border-pm-border rounded-md p-4 shadow-sm font-sans flex flex-col gap-4">
        {/* Sub-Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pm-borderSubtle">
          <div>
            <h3 className="text-xs font-semibold text-pm-text uppercase tracking-wider">
              Empirical Demand Analytics & Decomposition
            </h3>
            <p className="text-[11px] text-pm-textDim mt-0.5">
              Inspect price-volume elasticity curves, seasonal multipliers, unit distribution, and residual tracking
            </p>
          </div>

          <div className="flex bg-pm-subtle p-0.5 rounded border border-pm-border text-xs font-medium">
            {[
              { id: 'price_vs_demand', label: 'Price vs Demand' },
              { id: 'seasonality', label: 'Seasonality Index' },
              { id: 'distribution', label: 'Demand Distribution' },
              { id: 'accuracy', label: 'Forecast Accuracy' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAnalysisTab(tab.id)}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                  activeAnalysisTab === tab.id
                    ? 'bg-pm-elevated text-pm-text font-semibold shadow-sm border border-pm-borderStrong'
                    : 'text-pm-textDim hover:text-pm-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* View 1: Price vs Demand Curve */}
        {activeAnalysisTab === 'price_vs_demand' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceVsDemandData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
                  <XAxis dataKey="price" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `$${val}`} />
                  <YAxis dataKey="demandUnits" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `${val} u`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--pm-bg-elevated)', borderColor: 'var(--pm-border-strong)', borderRadius: '4px', fontSize: '11px' }}
                    formatter={(val, name) => [name === 'demandUnits' ? `${val} units` : formatCurrency(val, currency), name === 'demandUnits' ? 'Demand Units' : 'Projected Revenue']}
                  />
                  <Line type="monotone" dataKey="demandUnits" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4, fill: '#06B6D4' }} name="demandUnits" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3.5 bg-pm-subtle border border-pm-borderSubtle rounded-md flex flex-col justify-between font-mono text-xs">
              <div>
                <span className="text-[10px] text-pm-textDim uppercase block">Elasticity Synthesis</span>
                <span className="text-sm font-bold text-pm-text block mt-1">
                  Point Elasticity: {activeSku ? activeSku.elasticityScore.toFixed(2) : '-1.34'}
                </span>
                <p className="text-[11px] font-sans text-pm-textSecondary mt-2 leading-relaxed">
                  Negative price coefficient indicates volume decay rate per 1% price increase. Products with |Ed| &lt; 1.0 support price increases with minimal volume leakage.
                </p>
              </div>

              <div className="pt-2 border-t border-pm-borderSubtle flex items-center justify-between text-[10px]">
                <span className="text-pm-textDim">Classification:</span>
                <Badge variant={activeSku && activeSku.elasticityScore > -1.0 ? 'success' : 'warning'} size="sm">
                  {activeSku ? activeSku.elasticityCategory.toUpperCase() : 'MODERATELY ELASTIC'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Seasonality Monthly Multipliers */}
        {activeAnalysisTab === 'seasonality' && (
          <div className="space-y-3">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalityData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[0.7, 1.5]} tickFormatter={(val) => `${val.toFixed(2)}x`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--pm-bg-elevated)', borderColor: 'var(--pm-border-strong)', borderRadius: '4px', fontSize: '11px' }}
                    formatter={(val) => [`${val.toFixed(2)}x baseline`, 'Seasonality Multiplier']}
                  />
                  <ReferenceLine y={1.0} stroke="#94A3B8" strokeDasharray="3 3" label={{ value: '1.0x Baseline', fill: '#94A3B8', fontSize: 10 }} />
                  <Bar dataKey="index" radius={[2, 2, 0, 0]}>
                    {seasonalityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.index > 1.1 ? '#6366F1' : entry.index < 0.95 ? '#64748B' : '#06B6D4'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-pm-textDim">
              <span>Peak seasonal quarters occur in Q4 (Nov-Dec attach peak). Summer trough observed in Jan-Feb.</span>
              <span>Model removes seasonality before computing pure price elasticity</span>
            </div>
          </div>
        )}

        {/* View 3: Demand Distribution */}
        {activeAnalysisTab === 'distribution' && (
          <div className="space-y-3">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandDistributionData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
                  <XAxis dataKey="bucket" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `${val} SKUs`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--pm-bg-elevated)', borderColor: 'var(--pm-border-strong)', borderRadius: '4px', fontSize: '11px' }}
                    formatter={(val, _, item) => [`${val} SKUs (${item.payload.pct})`, 'Catalog Frequency']}
                  />
                  <Bar dataKey="frequency" fill="#6366F1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-pm-textDim">
              Histogram of daily sales velocity across all catalog SKUs. Core catalog volume clusters between 41–60 units/day.
            </p>
          </div>
        )}

        {/* View 4: Forecast Accuracy & Residuals */}
        {activeAnalysisTab === 'accuracy' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracyResidualsData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
                    <XAxis dataKey="week" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'var(--pm-bg-elevated)', borderColor: 'var(--pm-border-strong)', borderRadius: '4px', fontSize: '11px' }}
                      formatter={(val, name) => [`${formatNumber(val)} units`, name === 'actual' ? 'Actual Demand' : 'Predicted Demand']}
                    />
                    <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} name="actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#6366F1" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3, fill: '#6366F1' }} name="predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3.5 bg-pm-subtle border border-pm-borderSubtle rounded-md flex flex-col justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] text-pm-textDim uppercase block">Residual Stability</span>
                  <span className="text-sm font-bold text-pm-positiveText block mt-1">
                    Mean Error: ±1.12%
                  </span>
                  <p className="text-[11px] font-sans text-pm-textSecondary mt-2 leading-relaxed">
                    Forecast residuals show normal Gaussian distribution around zero with no persistent over-prediction or under-prediction bias.
                  </p>
                </div>
                <div className="pt-2 border-t border-pm-borderSubtle text-[10px] text-pm-textDim">
                  Zero-bias validation confirmed
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          5. RANKINGS (Fastest Growth, Largest Decline, Highest Volatility, Uncertainty)
          ========================================================================= */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-pm-text uppercase tracking-wider">
              Demand Rankings & Behavioral Outliers
            </h3>
            <p className="text-[11px] text-pm-textDim">
              Analytical ranking of portfolio SKUs classified by velocity acceleration, volatility, and uncertainty
            </p>
          </div>

          {/* Ranking Category Pills */}
          <div className="flex bg-pm-subtle p-0.5 rounded border border-pm-border text-xs font-medium">
            {[
              { id: 'growth', label: 'Fastest Growth' },
              { id: 'decline', label: 'Largest Decline' },
              { id: 'volatility', label: 'Highest Volatility' },
              { id: 'uncertainty', label: 'Highest Uncertainty' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRankingTab(tab.id)}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                  rankingTab === tab.id
                    ? 'bg-pm-elevated text-pm-text font-semibold shadow-sm border border-pm-borderStrong'
                    : 'text-pm-textDim hover:text-pm-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analytical Rankings Table */}
        <DataTable
          columns={rankingColumns}
          data={activeRankingData}
          keyField="skuCode"
          onRowClick={(row) => {
            const matchedSku = mockSKUs.find((s) => s.skuCode === row.skuCode);
            if (matchedSku) setSelectedSkuForDrawer(matchedSku);
          }}
          pagination={false}
        />
      </div>
    </div>
  );
}

export default DemandElasticity;
