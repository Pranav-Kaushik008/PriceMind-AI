import React, { useState } from 'react';
import { Users, Filter, Download, Plus, DollarSign, TrendingUp, ShieldCheck, X } from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { KPIDisplay } from '../components/ui/KPIDisplay';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FilterBar } from '../components/ui/FilterBar';
import { formatCurrency, formatPercent } from '../lib/utils';
import { useToast } from '../components/ui/ToastProvider';

export function Customers() {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false);
  const [newSegment, setNewSegment] = useState({ name: '', tier: 'Enterprise', accounts: '', revenueShare: '', avgDiscount: '' });

  const [customerSegments, setCustomerSegments] = useState([
    { id: 'seg-1', name: 'Enterprise Volume Buyers', tier: 'Enterprise', accounts: 142, revenueShare: 44.5, avgDiscount: 18.2, priceSensitivity: 'Low (Inelastic)', churnRisk: 'Low' },
    { id: 'seg-2', name: 'Mid-Market Retailers', tier: 'Mid-Market', accounts: 388, revenueShare: 28.1, avgDiscount: 11.5, priceSensitivity: 'Moderate', churnRisk: 'Low' },
    { id: 'seg-3', name: 'Direct-to-Consumer Core', tier: 'Consumer', accounts: 12400, revenueShare: 18.4, avgDiscount: 4.2, priceSensitivity: 'High (Elastic)', churnRisk: 'Moderate' },
    { id: 'seg-4', name: 'B2B Distribution Partners', tier: 'Wholesale', accounts: 64, revenueShare: 9.0, avgDiscount: 24.0, priceSensitivity: 'Very Low', churnRisk: 'Minimal' },
  ]);

  const handleCreateSegment = () => {
    if (!newSegment.name.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Segment name is required.' });
      return;
    }
    const id = `seg-${Date.now()}`;
    setCustomerSegments(prev => [...prev, {
      id,
      name: newSegment.name.trim(),
      tier: newSegment.tier,
      accounts: parseInt(newSegment.accounts) || 0,
      revenueShare: parseFloat(newSegment.revenueShare) || 0,
      avgDiscount: parseFloat(newSegment.avgDiscount) || 0,
      priceSensitivity: 'Moderate',
      churnRisk: 'Low',
    }]);
    setShowNewSegmentModal(false);
    setNewSegment({ name: '', tier: 'Enterprise', accounts: '', revenueShare: '', avgDiscount: '' });
    addToast({ type: 'success', title: 'Segment Created', message: `"${newSegment.name.trim()}" added to customer clusters.` });
  };

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

  const inputCls = "w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30";
  const labelCls = "block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1";

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Customers & Willingness-to-Pay' }]}
      title="Customer Segmentation & Willingness-to-Pay"
      description="Micro-segmentation, contract discount elasticity, and customer price sensitivity clusters."
      badge={<Badge variant="primary" size="sm">{customerSegments.length} Active Clusters</Badge>}
      primaryAction={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNewSegmentModal(true)}>
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

      {/* New Custom Segment Modal */}
      {showNewSegmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowNewSegmentModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md bg-[#0f172a] border border-white/[0.12] rounded-2xl shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-white">New Custom Segment</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Define a new customer pricing cohort</p>
              </div>
              <button onClick={() => setShowNewSegmentModal(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Segment Name *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Strategic Alliance Partners"
                  value={newSegment.name}
                  onChange={e => setNewSegment(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Customer Tier</label>
                <select
                  className={inputCls}
                  value={newSegment.tier}
                  onChange={e => setNewSegment(p => ({ ...p, tier: e.target.value }))}
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="Mid-Market">Mid-Market</option>
                  <option value="Consumer">Consumer</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Accounts</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="0"
                    value={newSegment.accounts}
                    onChange={e => setNewSegment(p => ({ ...p, accounts: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Rev Share %</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="0.0"
                    value={newSegment.revenueShare}
                    onChange={e => setNewSegment(p => ({ ...p, revenueShare: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Avg Discount %</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="0.0"
                    value={newSegment.avgDiscount}
                    onChange={e => setNewSegment(p => ({ ...p, avgDiscount: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setShowNewSegmentModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" icon={Plus} onClick={handleCreateSegment}>
                Create Segment
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModuleShell>
  );
}

export default Customers;
