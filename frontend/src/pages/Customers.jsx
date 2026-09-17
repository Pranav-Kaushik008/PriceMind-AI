import React, { useState } from 'react';
import { Users, Filter, Download, Plus, DollarSign, TrendingUp, ShieldCheck } from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { KPIDisplay } from '../components/ui/KPIDisplay';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FilterBar } from '../components/ui/FilterBar';
import { formatCurrency, formatPercent } from '../lib/utils';

export function Customers() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const customerSegments = [
    { id: 'seg-1', name: 'Enterprise Volume Buyers', tier: 'Enterprise', accounts: 142, revenueShare: 44.5, avgDiscount: 18.2, priceSensitivity: 'Low (Inelastic)', churnRisk: 'Low' },
    { id: 'seg-2', name: 'Mid-Market Retailers', tier: 'Mid-Market', accounts: 388, revenueShare: 28.1, avgDiscount: 11.5, priceSensitivity: 'Moderate', churnRisk: 'Low' },
    { id: 'seg-3', name: 'Direct-to-Consumer Core', tier: 'Consumer', accounts: 12400, revenueShare: 18.4, avgDiscount: 4.2, priceSensitivity: 'High (Elastic)', churnRisk: 'Moderate' },
    { id: 'seg-4', name: 'B2B Distribution Partners', tier: 'Wholesale', accounts: 64, revenueShare: 9.0, avgDiscount: 24.0, priceSensitivity: 'Very Low', churnRisk: 'Minimal' },
  ];

  const columns = [
    { header: 'Segment Name', accessor: 'name', cell: ({ row }) => (
      <div>
        <span className="font-semibold text-xs text-pm-text block">{row.name}</span>
        <span className="text-[10px] text-pm-textDim font-mono">ID: {row.id}</span>
      </div>
    )},
    { header: 'Tier', accessor: 'tier', cell: ({ value }) => <Badge variant="neutral" size="sm">{value}</Badge> },
    { header: 'Active Accounts', accessor: 'accounts', align: 'right', tabular: true },
    { header: 'Revenue Share', accessor: 'revenueShare', align: 'right', cell: ({ value }) => formatPercent(value) },
    { header: 'Avg Contract Discount', accessor: 'avgDiscount', align: 'right', cell: ({ value }) => formatPercent(value) },
    { header: 'Price Sensitivity (Ed)', accessor: 'priceSensitivity', align: 'center', cell: ({ value }) => (
      <Badge variant={value.includes('Low') ? 'success' : value.includes('Moderate') ? 'warning' : 'danger'} size="sm">
        {value}
      </Badge>
    )},
    { header: 'Retention Status', accessor: 'churnRisk', align: 'center', cell: ({ value }) => (
      <Badge variant={value === 'Low' || value === 'Minimal' ? 'success' : 'warning'} size="sm">
        {value} Risk
      </Badge>
    )},
  ];

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Customers & Willingness-to-Pay' }]}
      title="Customer Segmentation & Willingness-to-Pay"
      description="Micro-segmentation, contract discount elasticity, and customer price sensitivity clusters."
      badge={<Badge variant="primary" size="sm">4 Active Clusters</Badge>}
      primaryAction={
        <Button variant="primary" size="sm" icon={Plus}>
          New Custom Segment
        </Button>
      }
      secondaryActions={
        <Button variant="outline" size="sm" icon={Download}>
          Export Cohort Data
        </Button>
      }
      filterArea={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          onSearchClear={() => setSearch('')}
          searchPlaceholder="Filter segments by account or sensitivity..."
          categories={[
            { id: 'all', label: 'All Tiers' },
            { id: 'enterprise', label: 'Enterprise' },
            { id: 'consumer', label: 'Consumer' },
            { id: 'wholesale', label: 'Wholesale' },
          ]}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      }
    >
      {/* Top Value Displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPIDisplay
          title="Avg Willingness-to-Pay Index"
          value="108.4"
          type="raw"
          delta={3.2}
          benchmarkLabel="Baseline"
          benchmarkValue="100.0"
          tooltip="Average price headroom above catalog baseline across all contract accounts"
        />
        <KPIDisplay
          title="Discount Capture Leakage"
          value={142800}
          type="currency"
          delta={-8.4}
          isPositiveGood={false}
          benchmarkLabel="Recoverable"
          benchmarkValue="$84.2k"
          tooltip="Unjustified contract discount leakage beyond volume-tier thresholds"
        />
        <KPIDisplay
          title="Elasticity Dispersion"
          value="0.38"
          type="raw"
          benchmarkLabel="Cluster Variance"
          benchmarkValue="Low"
          tooltip="Variance in price elasticity coefficient within identified customer cohorts"
        />
        <KPIDisplay
          title="Personalized Pricing Yield"
          value={384000}
          type="currency"
          delta={14.2}
          benchmarkLabel="Target Realization"
          benchmarkValue="92%"
          progress={92}
          tooltip="Incremental gross margin yielded through tier-based contract rate optimization"
        />
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={customerSegments}
        keyField="id"
        pagination={false}
      />
    </ModuleShell>
  );
}

export default Customers;
