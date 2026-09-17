import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  Activity,
  RefreshCw,
  Cpu,
  Layers,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  FileText,
  Sliders,
  Package,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { mockRecommendations, mockSKUs } from '../mock/mockData';
import { formatCurrency, formatPercent, formatNumber, formatBps } from '../lib/utils';

// Design System Components
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { DateRangePicker } from '../components/ui/DatePicker';
import { Select } from '../components/ui/Select';
import { ConfidenceIndicator } from '../components/ui/ConfidenceIndicator';
import { StatusDot, TrendIndicator } from '../components/ui/StatusIndicator';
import { Tooltip } from '../components/ui/Tooltip';
import { useToast } from '../components/ui/ToastProvider';

export function ExecutiveOverview() {
  const {
    setActivePage,
    setSelectedRecommendationForEvidence,
    setSelectedSkuForDrawer,
    currency,
  } = useAppStore();

  const toast = useToast();

  // Header Filters State
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Main Chart Metric Toggle
  const [activeMetric, setActiveMetric] = useState('revenue'); // 'revenue' | 'profit' | 'units'

  // Pricing Recommendations data state
  const [recommendations, setRecommendations] = useState(mockRecommendations);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Telemetry Refreshed', 'Executive pricing metrics and ML inference signals synchronized.');
    }, 500);
  };

  const handleApprove = (id) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
    toast.success('Price Recommendation Approved', 'Price update queued for batch ERP synchronization.');
  };

  // Performance Strip Data (Current, Previous, Change, Direction)
  const performanceMetrics = [
    {
      id: 'revenue',
      label: 'Net Revenue',
      current: 12450000,
      previous: 11800000,
      delta: 5.51,
      deltaType: 'percent',
      direction: 'up',
      type: 'currency',
      tooltip: 'Volume-weighted net recognized revenue across all catalog SKUs',
    },
    {
      id: 'profit',
      label: 'Gross Profit',
      current: 4850000,
      previous: 4420000,
      delta: 9.73,
      deltaType: 'percent',
      direction: 'up',
      type: 'currency',
      tooltip: 'Gross contribution profit after cost of goods sold and channel commissions',
    },
    {
      id: 'margin',
      label: 'Realized Gross Margin',
      current: 38.95,
      previous: 37.45,
      delta: 150,
      deltaType: 'bps',
      direction: 'up',
      type: 'percent',
      tooltip: 'Realized gross margin percentage (+150 bps expansion vs prior period)',
    },
    {
      id: 'units',
      label: 'Units Sold',
      current: 84200,
      previous: 86100,
      delta: -2.21,
      deltaType: 'percent',
      direction: 'down',
      type: 'number',
      tooltip: 'Total unit volume sold; volume reduction offset by pricing power margin lift',
    },
    {
      id: 'asp',
      label: 'Average Selling Price (ASP)',
      current: 147.86,
      previous: 137.05,
      delta: 7.89,
      deltaType: 'percent',
      direction: 'up',
      type: 'currency',
      tooltip: 'Weighted average realized price per unit across active sales transactions',
    },
  ];

  // Time Series Chart Dataset
  const chartTimeSeries = [
    { date: 'Week 1', revenueActual: 2750000, revenueBaseline: 2750000, revenueOptimized: 2750000, profitActual: 1045000, profitBaseline: 1045000, profitOptimized: 1045000, unitsActual: 19800, unitsBaseline: 19800, unitsOptimized: 19800 },
    { date: 'Week 2', revenueActual: 2890000, revenueBaseline: 2890000, revenueOptimized: 2890000, profitActual: 1110000, profitBaseline: 1110000, profitOptimized: 1110000, unitsActual: 20400, unitsBaseline: 20400, unitsOptimized: 20400 },
    { date: 'Week 3', revenueActual: 3120000, revenueBaseline: 3050000, revenueOptimized: 3120000, profitActual: 1220000, profitBaseline: 1140000, profitOptimized: 1220000, unitsActual: 21600, unitsBaseline: 21200, unitsOptimized: 21600 },
    { date: 'Week 4', revenueActual: 3690000, revenueBaseline: 3110000, revenueOptimized: 3690000, profitActual: 1475000, profitBaseline: 1125000, profitOptimized: 1475000, unitsActual: 22400, unitsBaseline: 24700, unitsOptimized: 22400 },
    { date: 'Week 5 (Fcst)', revenueBaseline: 3180000, revenueOptimized: 3780000, profitBaseline: 1160000, profitOptimized: 1540000, unitsBaseline: 25100, unitsOptimized: 23100 },
    { date: 'Week 6 (Fcst)', revenueBaseline: 3240000, revenueOptimized: 3890000, profitBaseline: 1190000, profitOptimized: 1610000, unitsBaseline: 25400, unitsOptimized: 23500 },
    { date: 'Week 7 (Fcst)', revenueBaseline: 3300000, revenueOptimized: 4020000, profitBaseline: 1210000, profitOptimized: 1680000, unitsBaseline: 25800, unitsOptimized: 23900 },
    { date: 'Week 8 (Fcst)', revenueBaseline: 3350000, revenueOptimized: 4150000, profitBaseline: 1230000, profitOptimized: 1750000, unitsBaseline: 26000, unitsOptimized: 24200 },
  ];

  // Chart configuration based on active metric
  const chartConfig = {
    revenue: {
      title: 'Net Revenue Trajectory',
      unitFormatter: (val) => `$${(val / 1000000).toFixed(2)}M`,
      valFormatter: (val) => formatCurrency(val, currency),
      actualKey: 'revenueActual',
      baselineKey: 'revenueBaseline',
      optimizedKey: 'revenueOptimized',
      color: '#6366F1',
    },
    profit: {
      title: 'Gross Profit Trajectory',
      unitFormatter: (val) => `$${(val / 1000000).toFixed(2)}M`,
      valFormatter: (val) => formatCurrency(val, currency),
      actualKey: 'profitActual',
      baselineKey: 'profitBaseline',
      optimizedKey: 'profitOptimized',
      color: '#10B981',
    },
    units: {
      title: 'Unit Sales Volume',
      unitFormatter: (val) => `${(val / 1000).toFixed(0)}k units`,
      valFormatter: (val) => `${formatNumber(val)} units`,
      actualKey: 'unitsActual',
      baselineKey: 'unitsBaseline',
      optimizedKey: 'unitsOptimized',
      color: '#06B6D4',
    },
  }[activeMetric];

  // Pricing Opportunities Table Columns
  const opportunityColumns = [
    {
      header: 'Product / SKU',
      accessor: 'skuCode',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs text-pm-text">{row.skuCode}</span>
            <Badge variant="neutral" size="sm">{row.category}</Badge>
          </div>
          <span className="text-[11px] text-pm-textSecondary truncate max-w-xs mt-0.5">{row.skuName}</span>
        </div>
      ),
    },
    {
      header: 'Current Price',
      accessor: 'currentPrice',
      align: 'right',
      cell: ({ value }) => formatCurrency(value, currency),
    },
    {
      header: 'Recommended Price',
      accessor: 'recommendedPrice',
      align: 'right',
      cell: ({ row }) => (
        <div className="inline-flex items-center gap-1.5 justify-end">
          <span className="font-bold text-pm-text">{formatCurrency(row.recommendedPrice, currency)}</span>
          <Badge
            variant={row.priceDeltaPercent > 0 ? 'success' : 'danger'}
            size="sm"
            className="font-mono text-[10px] px-1 py-0"
          >
            {formatPercent(row.priceDeltaPercent, true)}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Expected Demand',
      accessor: 'projectedVolumeDeltaPercent',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex flex-col text-right">
          <span className="font-mono text-pm-textSecondary">
            {formatNumber(Math.round((row.currentPrice ? 1200 * (1 + row.projectedVolumeDeltaPercent / 100) : 1000)))} /mo
          </span>
          <span className="text-[10px] font-mono text-pm-textDim">
            {formatPercent(row.projectedVolumeDeltaPercent, true)} vol
          </span>
        </div>
      ),
    },
    {
      header: 'Expected Profit',
      accessor: 'projectedMarginPercent',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex flex-col text-right font-mono">
          <span className="text-pm-text font-semibold">
            {formatCurrency((row.projectedRevenueDelta || 35000) * 0.85, currency)}
          </span>
          <span className="text-[10px] text-pm-positiveText font-medium">
            {row.projectedMarginPercent?.toFixed(1)}% margin
          </span>
        </div>
      ),
    },
    {
      header: 'Profit Opportunity',
      accessor: 'projectedRevenueDelta',
      align: 'right',
      cell: ({ value }) => (
        <span className="font-mono font-bold text-pm-positiveText text-xs">
          +{formatCurrency(value, currency, true)}/mo
        </span>
      ),
    },
    {
      header: 'Confidence',
      accessor: 'confidenceScore',
      align: 'center',
      cell: ({ value }) => (
        <ConfidenceIndicator
          score={value}
          showBar={false}
          showDetails={false}
        />
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      cell: ({ value }) => <StatusBadge status={value} size="sm" />,
    },
    {
      header: 'Action',
      id: 'actions',
      align: 'center',
      sortable: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSelectedRecommendationForEvidence(row)}
            icon={FileText}
            className="text-[11px] text-pm-accentText hover:text-pm-text"
          >
            Inspect
          </Button>
          {row.status === 'pending' && (
            <Button
              variant="positive"
              size="xs"
              onClick={() => handleApprove(row.id)}
              icon={CheckCircle2}
            >
              Approve
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Insight Rail Items
  const insightRailItems = [
    {
      id: 'insight-1',
      category: 'Largest Pricing Opportunity',
      skuCode: 'SKU-6109-OPT',
      skuName: 'FiberOptic Multiplexer 40Gbps Unit',
      impact: '+$64.3K /mo Gross Profit',
      impactType: 'positive',
      icon: Sparkles,
      iconColor: 'text-pm-accent',
      rationale: 'Severe supply shortage in enterprise fiber. Demand elasticity is highly inelastic (Ed = -0.38). Recommending +7.9% price elevation.',
      actionLabel: 'Review Recommendation',
      onAction: () => setSelectedRecommendationForEvidence(mockRecommendations[1]),
    },
    {
      id: 'insight-2',
      category: 'Demand Decline & Buy-Box Risk',
      skuCode: 'SKU-3320-SENS',
      skuName: 'Multi-Spectrum Sensor Array',
      impact: '+$41.2K /mo Recaptured Volume',
      impactType: 'warning',
      icon: TrendingDown,
      iconColor: 'text-pm-warning',
      rationale: 'Competitor SensorTech dropped price to $143.50, causing 8.2% volume migration. Recommending -4.7% tactical markdown to win Buy-Box.',
      actionLabel: 'Inspect Elasticity',
      onAction: () => setSelectedRecommendationForEvidence(mockRecommendations[2]),
    },
    {
      id: 'insight-3',
      category: 'Inventory Holding Drag',
      skuCode: 'SKU-5120-VAL',
      skuName: 'Hydraulic High-Pressure Relief Valve',
      impact: '2,400 Units (70d on Hand)',
      impactType: 'warning',
      icon: Package,
      iconColor: 'text-pm-warning',
      rationale: 'Inventory runway is 70 days (healthy target: 30-40d). A -5.0% wholesale clearance price accelerates inventory turnover.',
      actionLabel: 'Simulate Markdown',
      onAction: () => setActivePage('simulator'),
    },
    {
      id: 'insight-4',
      category: 'Competitive Price Elevation',
      skuCode: 'SKU-8921-PRO',
      skuName: 'Precision Industrial Calibrator X1',
      impact: '+$37.8K /mo Margin Harvest',
      impactType: 'positive',
      icon: ShieldCheck,
      iconColor: 'text-pm-positiveText',
      rationale: 'Primary competitor Apex Industrial raised list price to $435.00 (+6.7% spread). Opportunity to lift price by +7.7% without volume loss.',
      actionLabel: 'Review Evidence',
      onAction: () => setSelectedRecommendationForEvidence(mockRecommendations[0]),
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full font-sans max-w-7xl mx-auto">
      {/* =========================================================================
          1. HEADER
          ========================================================================= */}
      <div className="flex flex-col gap-3 pb-3 border-b border-pm-borderSubtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-pm-text font-sans tracking-tight">
                Pricing Intelligence
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pm-accentBg text-pm-accentText border border-pm-accentBorder font-semibold">
                Executive Command Center
              </span>
            </div>
            <p className="text-xs text-pm-textMuted mt-0.5">
              Monitor revenue, demand, pricing opportunities and model health.
            </p>
          </div>

          {/* Header Controls: Date Range, Product/Category, Store/Business, Refresh */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Date Range Picker */}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />

            {/* Product / Category Selector */}
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

            {/* Store / Business Selector */}
            <div className="w-40">
              <Select
                value={selectedChannel}
                onChange={setSelectedChannel}
                size="sm"
                options={[
                  { value: 'all', label: 'All Business Units' },
                  { value: 'Direct B2B', label: 'Direct B2B Enterprise' },
                  { value: 'Wholesale', label: 'Wholesale Channel' },
                  { value: 'Amazon', label: 'Amazon / Marketplace' },
                  { value: 'Direct Online', label: 'Direct E-Commerce' },
                ]}
              />
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={isRefreshing}
              onClick={handleRefresh}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. PERFORMANCE STRIP (Analytical Horizontal Strip)
          ========================================================================= */}
      <div className="bg-pm-surface border border-pm-border rounded-md p-3 shadow-sm font-sans">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-pm-borderSubtle gap-y-3 md:gap-y-0">
          {performanceMetrics.map((m, idx) => {
            let currentDisplay = m.current;
            let prevDisplay = m.previous;
            if (m.type === 'currency') {
              currentDisplay = formatCurrency(m.current, currency, true);
              prevDisplay = formatCurrency(m.previous, currency, true);
            } else if (m.type === 'percent') {
              currentDisplay = `${m.current.toFixed(1)}%`;
              prevDisplay = `${m.previous.toFixed(1)}%`;
            } else {
              currentDisplay = formatNumber(m.current, true);
              prevDisplay = formatNumber(m.previous, true);
            }

            return (
              <div
                key={m.id}
                className={`flex flex-col px-3 ${idx === 0 ? 'pl-1' : ''} ${
                  idx === performanceMetrics.length - 1 ? 'pr-1' : ''
                } pt-2 md:pt-0`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-semibold text-pm-textMuted uppercase tracking-wider truncate">
                    {m.label}
                  </span>
                  <Tooltip content={m.tooltip} position="top">
                    <span className="text-pm-textDim hover:text-pm-textSecondary text-[10px] cursor-help">ℹ</span>
                  </Tooltip>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg sm:text-xl font-bold font-mono text-pm-text tabular-nums tracking-tight">
                    {currentDisplay}
                  </span>

                  <TrendIndicator
                    value={m.delta}
                    type={m.deltaType}
                    isPositiveGood={m.id !== 'risk'}
                    size="sm"
                  />
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-pm-textDim">
                  <span>Prev: {prevDisplay}</span>
                  <span className={m.direction === 'up' ? 'text-pm-positiveText' : 'text-pm-negativeText'}>
                    {m.direction === 'up' ? '▲ Up' : '▼ Down'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          3. MAIN CHART & INSIGHT RAIL (Two-Column Layout)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Chart Column (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-pm-surface border border-pm-border rounded-md p-4 shadow-sm font-sans flex flex-col">
            {/* Chart Header with Selector Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pm-borderSubtle mb-3">
              <div>
                <h3 className="text-xs font-semibold text-pm-text uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-pm-accent" />
                  {chartConfig.title}
                </h3>
                <p className="text-[11px] text-pm-textDim mt-0.5">
                  Comparing actuals against status quo baseline and PriceMind optimized scenario
                </p>
              </div>

              {/* Metric Selectors: Revenue | Profit | Units Sold */}
              <div className="flex bg-pm-subtle p-0.5 rounded border border-pm-border text-xs font-medium">
                {[
                  { id: 'revenue', label: 'Revenue' },
                  { id: 'profit', label: 'Profit' },
                  { id: 'units', label: 'Units Sold' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMetric(m.id)}
                    className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                      activeMetric === m.id
                        ? 'bg-pm-elevated text-pm-text font-semibold shadow-sm border border-pm-borderStrong'
                        : 'text-pm-textDim hover:text-pm-text'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time-Series Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartTimeSeries}>
                  <defs>
                    <linearGradient id="metricAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartConfig.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartConfig.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748B"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={chartConfig.unitFormatter}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--pm-bg-elevated)',
                      borderColor: 'var(--pm-border-strong)',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                    formatter={(val, name) => [
                      chartConfig.valFormatter(val),
                      name === chartConfig.optimizedKey
                        ? 'PriceMind Optimized'
                        : name === chartConfig.baselineKey
                        ? 'Status Quo Baseline'
                        : 'Historical Actual',
                    ]}
                  />
                  <ReferenceLine x="Week 4" stroke="#94A3B8" strokeDasharray="3 3" label={{ value: 'Today', fill: '#94A3B8', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey={chartConfig.optimizedKey}
                    stroke={chartConfig.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#metricAreaGrad)"
                    name={chartConfig.optimizedKey}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartConfig.baselineKey}
                    stroke="#64748B"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name={chartConfig.baselineKey}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartConfig.actualKey}
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10B981' }}
                    name={chartConfig.actualKey}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="mt-3 pt-2 border-t border-pm-borderSubtle flex items-center justify-between text-[11px] font-mono text-pm-textDim flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-pm-positiveText">
                  <span className="w-2.5 h-0.5 bg-pm-positive inline-block" /> Actuals
                </span>
                <span className="flex items-center gap-1.5 text-pm-textDim">
                  <span className="w-2.5 h-0.5 border-t border-dashed border-pm-textDim inline-block" /> Status Quo Baseline
                </span>
                <span className="flex items-center gap-1.5 text-pm-accentText">
                  <span className="w-2.5 h-0.5 bg-pm-accent inline-block" /> PriceMind Optimized
                </span>
              </div>
              <span className="text-[10px]">Updated 4m ago</span>
            </div>
          </div>
        </div>

        {/* Insight Rail Column (1 col) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-pm-text uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-pm-accent" />
              Actionable Intelligence Rail
            </h3>
            <span className="text-[10px] font-mono text-pm-textDim">4 Live Signals</span>
          </div>

          <div className="space-y-2.5">
            {insightRailItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-pm-surface border border-pm-border hover:border-pm-borderStrong rounded-md p-3 transition-colors shadow-sm font-sans flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pm-textDim flex items-center gap-1">
                        <Icon className={`w-3 h-3 ${item.iconColor}`} />
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-pm-positiveText">
                        {item.impact}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-pm-text truncate">
                      {item.skuCode}: <span className="font-normal text-pm-textSecondary">{item.skuName}</span>
                    </div>

                    <p className="text-[11px] text-pm-textMuted mt-1 leading-normal">
                      {item.rationale}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-pm-borderSubtle flex items-center justify-end">
                    <button
                      type="button"
                      onClick={item.onAction}
                      className="text-[11px] font-semibold text-pm-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. PRICING OPPORTUNITIES TABLE
          ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-pm-text uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-pm-positiveText" />
              Prioritized Pricing Opportunities
            </h3>
            <p className="text-[11px] text-pm-textDim">
              Model-driven price adjustments with expected demand changes and gross profit lift
            </p>
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => setActivePage('pricing')}
            className="text-xs text-pm-accentText"
          >
            View All in Pricing Module ({recommendations.length})
          </Button>
        </div>

        <DataTable
          columns={opportunityColumns}
          data={recommendations}
          keyField="id"
          onRowClick={(row) => setSelectedRecommendationForEvidence(row)}
          pagination={false}
        />
      </div>

      {/* =========================================================================
          5. MODEL HEALTH
          ========================================================================= */}
      <div className="bg-pm-surface border border-pm-border rounded-md p-4 shadow-sm font-sans">
        <div className="flex items-center justify-between pb-2.5 border-b border-pm-borderSubtle mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-pm-accent" />
            <h3 className="text-xs font-semibold text-pm-text uppercase tracking-wider">
              Machine Learning Model Health & Telemetry
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="active" pulse size="xs" />
            <span className="text-[11px] font-mono text-pm-positiveText font-medium">
              Inference Gateway Online
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-2.5 bg-pm-subtle border border-pm-borderSubtle rounded">
            <span className="text-[10px] text-pm-textDim uppercase block">Model Version</span>
            <span className="font-bold text-pm-text text-xs mt-0.5 block truncate">
              LightGBM-Spline v3.4.1
            </span>
          </div>

          <div className="p-2.5 bg-pm-subtle border border-pm-borderSubtle rounded">
            <span className="text-[10px] text-pm-textDim uppercase block">MAE (Error)</span>
            <span className="font-bold text-pm-text text-xs mt-0.5 block">
              3.42 units
            </span>
          </div>

          <div className="p-2.5 bg-pm-subtle border border-pm-borderSubtle rounded">
            <span className="text-[10px] text-pm-textDim uppercase block">RMSE</span>
            <span className="font-bold text-pm-text text-xs mt-0.5 block">
              4.89
            </span>
          </div>

          <div className="p-2.5 bg-pm-subtle border border-pm-borderSubtle rounded">
            <span className="text-[10px] text-pm-textDim uppercase block">MAPE</span>
            <span className="font-bold text-pm-positiveText text-xs mt-0.5 block">
              4.2% (Low)
            </span>
          </div>

          <div className="p-2.5 bg-pm-subtle border border-pm-borderSubtle rounded">
            <span className="text-[10px] text-pm-textDim uppercase block">R² Score</span>
            <span className="font-bold text-pm-positiveText text-xs mt-0.5 block">
              0.948
            </span>
          </div>

          <div className="p-2.5 bg-pm-subtle border border-pm-borderSubtle rounded">
            <span className="text-[10px] text-pm-textDim uppercase block">Last Trained</span>
            <span className="font-bold text-pm-text text-xs mt-0.5 block truncate">
              2026-03-16 04:00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExecutiveOverview;
