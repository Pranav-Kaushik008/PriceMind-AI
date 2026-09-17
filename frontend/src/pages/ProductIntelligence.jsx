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
  Package,
  Layers,
  Search,
  Filter,
  Sliders,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Columns,
  Download,
  Send,
  Zap,
  DollarSign,
  Boxes,
  Activity,
  SlidersHorizontal,
  FileText,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { mockSKUs, mockRecommendations, mockCompetitorTelemetry, mockElasticityCurves } from '../mock/mockData';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';

// UI Components
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { Select } from '../components/ui/Select';
import { ConfidenceIndicator } from '../components/ui/ConfidenceIndicator';
import { StatusDot, TrendIndicator } from '../components/ui/StatusIndicator';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { SHAPWaterfall } from '../components/ui/SHAPWaterfall';
import { Tooltip } from '../components/ui/Tooltip';
import { useToast } from '../components/ui/ToastProvider';

export function ProductIntelligence() {
  const {
    setActivePage,
    setSelectedRecommendationForEvidence,
    toggleQueuedRecommendation,
    queuedRecommendations,
    currency,
  } = useAppStore();

  const toast = useToast();

  // Search & Filtering State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedElasticity, setSelectedElasticity] = useState('all');

  // Selected SKU for Product Detail Workspace
  const [selectedSku, setSelectedSku] = useState(null);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' | 'elasticity' | 'competitors' | 'inventory'

  // Row Selection for Batch Operations
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Column Visibility State
  const [isColMenuOpen, setIsColMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    product: true,
    category: true,
    currentPrice: true,
    demand: true,
    forecast: true,
    inventory: true,
    competitorPrice: true,
    recommendedPrice: true,
    profitOpportunity: true,
    status: true,
  });

  const toggleColumn = (colKey) => {
    setVisibleColumns((prev) => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  // Enriched SKU dataset
  const enrichedSKUs = useMemo(() => {
    return mockSKUs.map((sku) => {
      const rec = mockRecommendations.find((r) => r.skuCode === sku.skuCode || r.skuId === sku.id);
      const isPriceUp = (sku.recommendedPrice || sku.currentPrice) > sku.currentPrice;
      const priceDeltaPct = sku.recommendedPrice
        ? ((sku.recommendedPrice - sku.currentPrice) / sku.currentPrice) * 100
        : 0;

      const monthlyDemand = sku.currentVelocity * 30;
      const forecastMonthlyDemand = Math.round(monthlyDemand * (1 + (rec?.projectedVolumeDeltaPercent || -2.5) / 100));
      const expectedRevenue = (sku.recommendedPrice || sku.currentPrice) * forecastMonthlyDemand;
      const expectedProfit = ((sku.recommendedPrice || sku.currentPrice) - sku.costPrice) * forecastMonthlyDemand;
      const currentProfit = (sku.currentPrice - sku.costPrice) * monthlyDemand;
      const profitLift = Math.max(0, expectedProfit - currentProfit);

      return {
        ...sku,
        recommendation: rec,
        priceDeltaPercent: priceDeltaPct,
        monthlyDemand,
        forecastMonthlyDemand,
        expectedRevenue,
        expectedProfit,
        profitLift: rec?.projectedRevenueDelta || profitLift || 28500,
        confidenceScore: rec?.confidenceScore || 93.4,
        status: rec?.status || 'pending',
        isQueued: queuedRecommendations.includes(rec?.id || sku.id),
      };
    });
  }, [queuedRecommendations]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return enrichedSKUs.filter((sku) => {
      const matchSearch =
        search === '' ||
        sku.skuCode.toLowerCase().includes(search.toLowerCase()) ||
        sku.name.toLowerCase().includes(search.toLowerCase()) ||
        sku.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory = selectedCategory === 'all' || sku.category === selectedCategory;
      const matchChannel = selectedChannel === 'all' || sku.channel === selectedChannel;
      const matchElasticity =
        selectedElasticity === 'all' ||
        (selectedElasticity === 'inelastic' && sku.elasticityScore > -1.0) ||
        (selectedElasticity === 'elastic' && sku.elasticityScore <= -1.0);

      return matchSearch && matchCategory && matchChannel && matchElasticity;
    });
  }, [enrichedSKUs, search, selectedCategory, selectedChannel, selectedElasticity]);

  // Categories list
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Hardware & Tools', label: 'Hardware & Tools' },
    { value: 'HVAC & Air Handling', label: 'HVAC & Air Handling' },
    { value: 'Telecommunications', label: 'Telecommunications' },
    { value: 'IoT & Sensors', label: 'IoT & Sensors' },
    { value: 'Computing Infrastructure', label: 'Computing' },
    { value: 'Fluid Mechanics', label: 'Fluid Mechanics' },
    { value: 'Robotics', label: 'Robotics' },
  ];

  // Table Columns Definition
  const allColumns = [
    visibleColumns.product && {
      header: 'Product',
      accessor: 'skuCode',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs text-pm-text">{row.skuCode}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-pm-subtle border border-pm-borderSubtle text-pm-textDim">
              {row.channel}
            </span>
          </div>
          <span className="text-[11px] text-pm-textSecondary truncate max-w-xs mt-0.5" title={row.name}>
            {row.name}
          </span>
        </div>
      ),
    },
    visibleColumns.category && {
      header: 'Category',
      accessor: 'category',
      cell: ({ value }) => <Badge variant="neutral" size="sm">{value}</Badge>,
    },
    visibleColumns.currentPrice && {
      header: 'Current Price',
      accessor: 'currentPrice',
      align: 'right',
      cell: ({ value, row }) => (
        <div className="flex flex-col text-right">
          <span className="font-mono font-semibold text-xs text-pm-text">{formatCurrency(value, currency)}</span>
          <span className="text-[10px] font-mono text-pm-textDim">COGS: {formatCurrency(row.costPrice, currency)}</span>
        </div>
      ),
    },
    visibleColumns.demand && {
      header: 'Demand',
      accessor: 'currentVelocity',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex flex-col text-right font-mono">
          <span className="text-xs text-pm-text">{row.currentVelocity} u/d</span>
          <span className="text-[10px] text-pm-textDim">{formatNumber(row.monthlyDemand)} /mo</span>
        </div>
      ),
    },
    visibleColumns.forecast && {
      header: 'Forecast',
      accessor: 'forecastMonthlyDemand',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex flex-col text-right font-mono">
          <span className="text-xs text-pm-accentText font-semibold">{formatNumber(row.forecastMonthlyDemand)} /mo</span>
          <span className="text-[10px] text-pm-textDim">
            {formatPercent(row.priceDeltaPercent > 0 ? -2.8 : 14.5, true)} vol
          </span>
        </div>
      ),
    },
    visibleColumns.inventory && {
      header: 'Inventory',
      accessor: 'daysOfInventory',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex flex-col items-end">
          <Badge
            variant={row.daysOfInventory > 60 ? 'warning' : row.daysOfInventory < 15 ? 'danger' : 'success'}
            size="sm"
            className="font-mono"
          >
            {row.daysOfInventory}d supply
          </Badge>
          <span className="text-[10px] font-mono text-pm-textDim mt-0.5">{formatNumber(row.inventoryStock)} units</span>
        </div>
      ),
    },
    visibleColumns.competitorPrice && {
      header: 'Competitor Price',
      accessor: 'competitorAvgPrice',
      align: 'right',
      cell: ({ row }) => {
        const spread = ((row.currentPrice - row.competitorAvgPrice) / row.competitorAvgPrice) * 100;
        return (
          <div className="flex flex-col text-right font-mono">
            <span className="text-xs text-pm-text">{formatCurrency(row.competitorAvgPrice, currency)}</span>
            <span className={`text-[10px] ${spread > 0 ? 'text-pm-negativeText' : 'text-pm-positiveText'}`}>
              {formatPercent(spread, true)} vs avg
            </span>
          </div>
        );
      },
    },
    visibleColumns.recommendedPrice && {
      header: 'Recommended Price',
      accessor: 'recommendedPrice',
      align: 'right',
      cell: ({ row }) => (
        <div className="inline-flex items-center gap-1.5 justify-end">
          <span className="font-mono font-bold text-xs text-pm-text">
            {formatCurrency(row.recommendedPrice, currency)}
          </span>
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
    visibleColumns.profitOpportunity && {
      header: 'Profit Opportunity',
      accessor: 'profitLift',
      align: 'right',
      cell: ({ value, row }) => (
        <div className="flex flex-col text-right font-mono">
          <span className="font-bold text-xs text-pm-positiveText">
            +{formatCurrency(value, currency, true)}/mo
          </span>
          <span className="text-[10px] text-pm-textDim">
            {row.marginPercent.toFixed(1)}% → {(row.marginPercent + 3.8).toFixed(1)}%
          </span>
        </div>
      ),
    },
    visibleColumns.status && {
      header: 'Status',
      accessor: 'elasticityCategory',
      align: 'center',
      cell: ({ row }) => (
        <Badge
          variant={row.elasticityScore > -1.0 ? 'success' : 'warning'}
          size="sm"
          dot
        >
          {row.elasticityScore > -1.0 ? 'INELASTIC' : 'ELASTIC'}
        </Badge>
      ),
    },
  ].filter(Boolean);

  // Time-Series dataset for the selected SKU detail workspace
  const skuHistorySeries = useMemo(() => {
    if (!selectedSku) return [];
    const baseP = selectedSku.currentPrice;
    const baseD = selectedSku.currentVelocity * 30;
    return [
      { month: 'Oct', price: baseP * 0.95, demand: Math.round(baseD * 1.08), revenue: Math.round(baseP * 0.95 * baseD * 1.08) },
      { month: 'Nov', price: baseP * 0.95, demand: Math.round(baseD * 1.05), revenue: Math.round(baseP * 0.95 * baseD * 1.05) },
      { month: 'Dec', price: baseP * 1.00, demand: Math.round(baseD * 1.15), revenue: Math.round(baseP * 1.00 * baseD * 1.15) },
      { month: 'Jan', price: baseP * 1.00, demand: Math.round(baseD * 0.98), revenue: Math.round(baseP * 1.00 * baseD * 0.98) },
      { month: 'Feb', price: baseP * 1.00, demand: Math.round(baseD * 1.00), revenue: Math.round(baseP * 1.00 * baseD * 1.00) },
      { month: 'Mar (Current)', price: baseP, demand: baseD, revenue: Math.round(baseP * baseD) },
      { month: 'Apr (Fcst)', price: selectedSku.recommendedPrice, demand: selectedSku.forecastMonthlyDemand, revenue: Math.round(selectedSku.expectedRevenue) },
      { month: 'May (Fcst)', price: selectedSku.recommendedPrice, demand: Math.round(selectedSku.forecastMonthlyDemand * 1.02), revenue: Math.round(selectedSku.expectedRevenue * 1.02) },
    ];
  }, [selectedSku]);

  return (
    <div className="flex flex-col gap-5 w-full font-sans max-w-7xl mx-auto">
      {/* =========================================================================
          1. HEADER & SLICERS
          ========================================================================= */}
      <div className="flex flex-col gap-3 pb-3 border-b border-pm-borderSubtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-pm-text font-sans tracking-tight">
                Product Intelligence Matrix
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pm-accentBg text-pm-accentText border border-pm-accentBorder font-semibold">
                {enrichedSKUs.length} Active Catalog SKUs
              </span>
            </div>
            <p className="text-xs text-pm-textMuted mt-0.5">
              Comprehensive SKU-level elasticity diagnostics, competitor benchmark spreads, and profit opportunities.
            </p>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-2">
            {selectedRowKeys.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => {
                  toast.success('Batch ERP Queue Updated', `Added ${selectedRowKeys.length} SKUs to the dispatch dock.`);
                }}
              >
                Queue Selected ({selectedRowKeys.length})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={Sliders}
              onClick={() => setActivePage('simulator')}
            >
              What-If Sandbox
            </Button>
          </div>
        </div>

        {/* Filter Bar with Search, Category, Channel, Elasticity & Column Visibility */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-pm-surface border border-pm-border rounded-md shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
            {/* Search Input */}
            <div className="w-64 max-w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU code, name, or category..."
                className="w-full bg-pm-subtle border border-pm-border hover:border-pm-borderStrong focus:border-pm-accent focus:ring-1 focus:ring-pm-accent rounded text-xs text-pm-text placeholder:text-pm-textDim px-3 h-8 focus:outline-none transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="w-44">
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                size="sm"
                options={categoryOptions}
              />
            </div>

            {/* Channel Select */}
            <div className="w-36">
              <Select
                value={selectedChannel}
                onChange={setSelectedChannel}
                size="sm"
                options={[
                  { value: 'all', label: 'All Channels' },
                  { value: 'Direct', label: 'Direct' },
                  { value: 'Amazon', label: 'Amazon' },
                  { value: 'Wholesale', label: 'Wholesale' },
                  { value: 'B2B Direct', label: 'B2B Direct' },
                ]}
              />
            </div>

            {/* Elasticity Tier Filter */}
            <div className="w-36">
              <Select
                value={selectedElasticity}
                onChange={setSelectedElasticity}
                size="sm"
                options={[
                  { value: 'all', label: 'All Elasticities' },
                  { value: 'inelastic', label: 'Inelastic (Ed > -1)' },
                  { value: 'elastic', label: 'Elastic (Ed ≤ -1)' },
                ]}
              />
            </div>
          </div>

          {/* Column Visibility Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              icon={Columns}
              onClick={() => setIsColMenuOpen((prev) => !prev)}
            >
              Columns
            </Button>

            {isColMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-pm-elevated border border-pm-borderStrong rounded shadow-lg z-50 p-2 font-sans text-xs animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold uppercase tracking-wider text-pm-textDim px-2 py-1 mb-1 border-b border-pm-borderSubtle">
                  Toggle Columns
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {Object.entries({
                    category: 'Category',
                    currentPrice: 'Current Price',
                    demand: 'Demand Velocity',
                    forecast: 'Demand Forecast',
                    inventory: 'Inventory Runway',
                    competitorPrice: 'Competitor Price',
                    recommendedPrice: 'Recommended Price',
                    profitOpportunity: 'Profit Opportunity',
                    status: 'Elasticity Status',
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-pm-hover cursor-pointer text-pm-text select-none text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => toggleColumn(key)}
                        className="rounded border-pm-border bg-pm-surface text-pm-accent focus:ring-pm-accent"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. PRODUCT TABLE (Primary Analytical Workspace)
          ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-pm-textDim">
          <span>Click any product row to open the complete Analyst Workspace</span>
          <span className="font-mono">Showing {filteredData.length} of {mockSKUs.length} SKUs</span>
        </div>

        <DataTable
          columns={allColumns}
          data={filteredData}
          keyField="id"
          selectable={true}
          selectedRows={selectedRowKeys}
          onSelectRow={(id) =>
            setSelectedRowKeys((prev) =>
              prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
            )
          }
          onSelectAll={(allIds) => setSelectedRowKeys(allIds)}
          onRowClick={(row) => setSelectedSku(row)}
          pagination={true}
          pageSize={10}
        />
      </div>

      {/* =========================================================================
          3. PRODUCT DETAIL & DECISION ANALYTICAL WORKSPACE (Slide-Over Drawer)
          ========================================================================= */}
      {selectedSku && (
        <Drawer
          isOpen={Boolean(selectedSku)}
          onClose={() => setSelectedSku(null)}
          title={`Analyst Workspace: ${selectedSku.skuCode}`}
          subtitle={`${selectedSku.name} • ${selectedSku.category} • ${selectedSku.channel}`}
          width="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="sm" onClick={() => setSelectedSku(null)}>
                Close Workspace
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Sliders}
                  onClick={() => {
                    setActivePage('simulator');
                    setSelectedSku(null);
                  }}
                >
                  Simulate in Sandbox
                </Button>

                <Button
                  variant="positive"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => {
                    toast.success('Price Approved', `${selectedSku.skuCode} price adjustment queued for ERP.`);
                    setSelectedSku(null);
                  }}
                >
                  Approve Recommendation
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-5 font-sans">
            {/* =================================================================
                A. DECISION PANEL (Prominently Featured at Top of Workspace)
                ================================================================= */}
            <div className="bg-pm-subtle border border-pm-borderStrong rounded-md p-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-pm-borderSubtle">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-pm-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-pm-text">
                    Pricing Decision & Impact Projection
                  </h3>
                </div>
                <ConfidenceIndicator
                  score={selectedSku.confidenceScore}
                  showBar={false}
                  showDetails={true}
                />
              </div>

              {/* 6 Key Decision Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                <div className="p-2.5 bg-pm-surface border border-pm-border rounded">
                  <span className="text-[10px] text-pm-textDim uppercase block">Current Price</span>
                  <span className="text-sm font-bold text-pm-text mt-0.5 block">
                    {formatCurrency(selectedSku.currentPrice, currency)}
                  </span>
                  <span className="text-[10px] text-pm-textDim mt-0.5 block">COGS: {formatCurrency(selectedSku.costPrice, currency)}</span>
                </div>

                <div className="p-2.5 bg-pm-surface border border-pm-border rounded">
                  <span className="text-[10px] text-pm-accentText uppercase block">Recommended</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-sm font-bold text-pm-text">
                      {formatCurrency(selectedSku.recommendedPrice, currency)}
                    </span>
                    <Badge variant={selectedSku.priceDeltaPercent > 0 ? 'success' : 'danger'} size="sm" className="text-[10px] px-1 py-0">
                      {formatPercent(selectedSku.priceDeltaPercent, true)}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-pm-positiveText mt-0.5 block">+{(selectedSku.recommendedPrice - selectedSku.currentPrice).toFixed(2)} delta</span>
                </div>

                <div className="p-2.5 bg-pm-surface border border-pm-border rounded">
                  <span className="text-[10px] text-pm-textDim uppercase block">Expected Demand</span>
                  <span className="text-sm font-bold text-pm-text mt-0.5 block">
                    {formatNumber(selectedSku.forecastMonthlyDemand)} /mo
                  </span>
                  <span className="text-[10px] text-pm-textDim mt-0.5 block">
                    {formatPercent(selectedSku.priceDeltaPercent > 0 ? -2.8 : 14.5, true)} vs base
                  </span>
                </div>

                <div className="p-2.5 bg-pm-surface border border-pm-border rounded">
                  <span className="text-[10px] text-pm-textDim uppercase block">Expected Revenue</span>
                  <span className="text-sm font-bold text-pm-text mt-0.5 block">
                    {formatCurrency(selectedSku.expectedRevenue, currency, true)}
                  </span>
                  <span className="text-[10px] text-pm-positiveText mt-0.5 block">+4.8% net rev</span>
                </div>

                <div className="p-2.5 bg-pm-surface border border-pm-border rounded">
                  <span className="text-[10px] text-pm-textDim uppercase block">Expected Profit</span>
                  <span className="text-sm font-bold text-pm-positiveText mt-0.5 block">
                    {formatCurrency(selectedSku.expectedProfit, currency, true)}
                  </span>
                  <span className="text-[10px] font-semibold text-pm-positiveText mt-0.5 block">
                    +{formatCurrency(selectedSku.profitLift, currency, true)}/mo
                  </span>
                </div>

                <div className="p-2.5 bg-pm-surface border border-pm-border rounded">
                  <span className="text-[10px] text-pm-textDim uppercase block">Expected Margin</span>
                  <span className="text-sm font-bold text-pm-positiveText mt-0.5 block">
                    {(selectedSku.marginPercent + 3.8).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-pm-positiveText mt-0.5 block">+380 bps yield</span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="mt-3 pt-3 border-t border-pm-borderSubtle flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-pm-textDim">
                  Driver: {selectedSku.recommendation?.primaryDriver || 'Inelastic Demand Zone & Competitor Parity Deficit'}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Sliders}
                    onClick={() => {
                      setActivePage('simulator');
                      setSelectedSku(null);
                    }}
                  >
                    Simulate
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={ShieldCheck}
                    onClick={() => setDetailTab('competitors')}
                  >
                    Compare Competitors
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={FileText}
                    onClick={() => {
                      setSelectedRecommendationForEvidence(selectedSku.recommendation || mockRecommendations[0]);
                    }}
                  >
                    Explain (SHAP)
                  </Button>
                </div>
              </div>
            </div>

            {/* Workspace Sub-Tabs */}
            <div className="flex items-center border-b border-pm-border gap-4 text-xs font-medium">
              {[
                { id: 'overview', label: 'Price & Demand History' },
                { id: 'elasticity', label: 'Elasticity & Sensitivity' },
                { id: 'competitors', label: 'Competitor Comparison' },
                { id: 'inventory', label: 'Inventory & Runway' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id)}
                  className={`pb-2 transition-all cursor-pointer ${
                    detailTab === tab.id
                      ? 'border-b-2 border-pm-accent text-pm-text font-semibold'
                      : 'text-pm-textDim hover:text-pm-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Price & Demand History Time-Series */}
            {detailTab === 'overview' && (
              <div className="space-y-4">
                <div className="bg-pm-surface border border-pm-border rounded-md p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-pm-accent" />
                      Historical Price & Demand Trajectory (6 Months + Forecast)
                    </h4>
                    <span className="font-mono text-[11px] text-pm-textDim">Solid: Price ($) • Shaded: Revenue ($)</span>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={skuHistorySeries}>
                        <defs>
                          <linearGradient id="skuRevGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                        <YAxis yAxisId="left" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `$${val}`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `${val}u`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'var(--pm-bg-elevated)', borderColor: 'var(--pm-border-strong)', borderRadius: '4px', fontSize: '11px' }}
                          formatter={(val, name) => [name === 'price' ? formatCurrency(val, currency) : `${val} units`, name === 'price' ? 'List Price' : 'Monthly Demand']}
                        />
                        <ReferenceLine yAxisId="left" x="Mar (Current)" stroke="#94A3B8" strokeDasharray="3 3" label={{ value: 'Current', fill: '#94A3B8', fontSize: 10 }} />
                        <Area yAxisId="left" type="monotone" dataKey="revenue" fill="url(#skuRevGrad)" stroke="#6366F1" strokeWidth={1.5} name="revenue" />
                        <Line yAxisId="left" type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} name="price" />
                        <Line yAxisId="right" type="monotone" dataKey="demand" stroke="#06B6D4" strokeWidth={1.5} strokeDasharray="3 3" name="demand" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* SKU Financial Anatomy */}
                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 bg-pm-surface border border-pm-border rounded">
                    <span className="text-[10px] text-pm-textDim uppercase block">Cost Structure</span>
                    <span className="text-xs font-semibold text-pm-text block mt-1">COGS: {formatCurrency(selectedSku.costPrice, currency)}</span>
                    <span className="text-[10px] text-pm-textDim block mt-0.5">Direct Margin: {(selectedSku.currentPrice - selectedSku.costPrice).toFixed(2)}/u</span>
                  </div>
                  <div className="p-3 bg-pm-surface border border-pm-border rounded">
                    <span className="text-[10px] text-pm-textDim uppercase block">Current Run-Rate</span>
                    <span className="text-xs font-semibold text-pm-text block mt-1">
                      {formatCurrency(selectedSku.currentPrice * selectedSku.monthlyDemand, currency, true)}/mo
                    </span>
                    <span className="text-[10px] text-pm-textDim block mt-0.5">{selectedSku.currentVelocity} units/day</span>
                  </div>
                  <div className="p-3 bg-pm-surface border border-pm-border rounded">
                    <span className="text-[10px] text-pm-textDim uppercase block">Elasticity Index</span>
                    <span className="text-xs font-semibold text-pm-positiveText block mt-1">
                      Ed = {selectedSku.elasticityScore.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-pm-textDim block mt-0.5">{selectedSku.elasticityCategory.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Elasticity Curve */}
            {detailTab === 'elasticity' && (
              <div className="space-y-4">
                <div className="bg-pm-surface border border-pm-border rounded-md p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text">
                      Neural Spline Elasticity Demand Curve (Q = f(P))
                    </h4>
                    <span className="font-mono text-xs text-pm-accentText">
                      Point Elasticity: {selectedSku.elasticityScore.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-pm-textDim mb-3">
                    Shows projected monthly gross revenue across price points. Peak indicates the profit-maximizing optimal price step.
                  </p>

                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={mockElasticityCurves[selectedSku.skuCode] || [
                          { price: selectedSku.currentPrice * 0.85, revenue: 38000 },
                          { price: selectedSku.currentPrice * 0.95, revenue: 42000 },
                          { price: selectedSku.currentPrice, revenue: 45000 },
                          { price: selectedSku.recommendedPrice, revenue: 49500 },
                          { price: selectedSku.currentPrice * 1.15, revenue: 44000 },
                          { price: selectedSku.currentPrice * 1.25, revenue: 39000 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
                        <XAxis dataKey="price" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `$${val}`} />
                        <YAxis dataKey="revenue" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'var(--pm-bg-elevated)', borderColor: 'var(--pm-border-strong)', borderRadius: '4px', fontSize: '11px' }}
                          formatter={(val) => [formatCurrency(val, currency), 'Gross Revenue']}
                        />
                        <ReferenceLine x={selectedSku.currentPrice} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Current', fill: '#EF4444', fontSize: 10 }} />
                        <ReferenceLine x={selectedSku.recommendedPrice} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Target', fill: '#10B981', fontSize: 10 }} />
                        <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366F1' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Feature Attribution Drivers */}
                <SHAPWaterfall
                  attributions={
                    selectedSku.recommendation?.shapAttribution || [
                      { feature: 'Competitor Price Index Spread', impactPercent: 4.2, description: 'Competitor prices are higher by +6.7%' },
                      { feature: 'Low Empirical Price Sensitivity', impactPercent: 2.8, description: 'High customer lock-in' },
                      { feature: 'Stock Runway Safe Threshold', impactPercent: 0.9, description: 'Sufficient inventory runway' },
                    ]
                  }
                />
              </div>
            )}

            {/* TAB 3: Competitor Comparison */}
            {detailTab === 'competitors' && (
              <div className="space-y-4">
                <div className="bg-pm-surface border border-pm-border rounded-md p-4 shadow-sm">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text mb-3">
                    Competitor Market Benchmark Price Spread
                  </h4>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between text-pm-textDim text-[11px]">
                      <span>Min: {formatCurrency(selectedSku.competitorMinPrice, currency)}</span>
                      <span>Avg: {formatCurrency(selectedSku.competitorAvgPrice, currency)}</span>
                      <span>Max: {formatCurrency(selectedSku.competitorMaxPrice, currency)}</span>
                    </div>

                    {/* Spread Slider */}
                    <div className="w-full bg-pm-subtle h-2.5 rounded-full relative overflow-hidden border border-pm-borderSubtle">
                      <div className="absolute inset-y-0 bg-pm-borderStrong left-[15%] right-[15%] rounded" />
                      <div
                        className="absolute top-0 bottom-0 w-3 bg-pm-accent rounded-full -translate-x-1/2 shadow-sm"
                        style={{
                          left: `${Math.max(5, Math.min(95, ((selectedSku.currentPrice - selectedSku.competitorMinPrice) / (selectedSku.competitorMaxPrice - selectedSku.competitorMinPrice || 1)) * 100))}%`,
                        }}
                        title={`Our Price: ${formatCurrency(selectedSku.currentPrice, currency)}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-pm-textDim">
                      <span>Position: <strong className="text-pm-text uppercase">{selectedSku.pricePosition}</strong></span>
                      <span>
                        Spread vs Avg: <strong className="text-pm-text">{formatPercent(((selectedSku.currentPrice - selectedSku.competitorAvgPrice) / selectedSku.competitorAvgPrice) * 100, true)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scraped Competitor List Table */}
                <div className="bg-pm-surface border border-pm-border rounded-md p-3 shadow-sm font-sans text-xs">
                  <span className="text-xs font-semibold text-pm-text block mb-2">
                    Scraped Competitor Price Feeds
                  </span>
                  <div className="divide-y divide-pm-borderSubtle">
                    {mockCompetitorTelemetry.map((comp) => (
                      <div key={comp.competitorId} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-pm-text block">{comp.competitorName}</span>
                          <span className="text-[10px] font-mono text-pm-textDim">Updated: {comp.lastUpdated}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-pm-text">{formatCurrency(comp.price, currency)}</span>
                          <Badge variant={comp.inStock ? 'success' : 'danger'} size="sm">
                            {comp.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Inventory & Runway */}
            {detailTab === 'inventory' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-pm-surface border border-pm-border rounded">
                    <span className="text-[10px] text-pm-textDim uppercase block">Stock on Hand</span>
                    <span className="text-sm font-bold text-pm-text block mt-1">{formatNumber(selectedSku.inventoryStock)} units</span>
                    <span className="text-[10px] text-pm-textDim block mt-0.5">Burn Rate: {selectedSku.currentVelocity} units/day</span>
                  </div>
                  <div className="p-3 bg-pm-surface border border-pm-border rounded">
                    <span className="text-[10px] text-pm-textDim uppercase block">Runway Safety</span>
                    <span className="text-sm font-bold text-pm-positiveText block mt-1">{selectedSku.daysOfInventory} Days Supply</span>
                    <span className="text-[10px] text-pm-textDim block mt-0.5">Reorder Point: 14 Days</span>
                  </div>
                </div>

                <div className="p-3.5 bg-pm-surface border border-pm-border rounded text-xs text-pm-textSecondary leading-relaxed">
                  <h5 className="font-semibold text-pm-text mb-1">Inventory Runway Analysis:</h5>
                  <p>
                    Current inventory is well within the safe buffer zone (29 days). The recommended +7.7% price elevation will slightly reduce daily burn rate from 42 to 40 units/day, extending runway by +2.5 days while maximizing margin extraction.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default ProductIntelligence;
