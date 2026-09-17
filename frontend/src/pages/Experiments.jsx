import React from 'react';
import { FlaskConical, Plus, Play, Pause, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { KPIDisplay } from '../components/ui/KPIDisplay';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatPercent } from '../lib/utils';

export function Experiments() {
  const experiments = [
    { id: 'exp-401', name: 'Premium Wireless Audio ASP Elevation', type: 'Bayesian A/B Test', sampleSize: 18400, controlPrice: 149.99, variantPrice: 164.99, revenueDeltaPercent: 8.4, pValue: 0.002, status: 'RUNNING', duration: 'Day 12 / 21' },
    { id: 'exp-402', name: 'Smart Home Hub Bundle Elasticity Test', type: 'Multi-Arm Bandit', sampleSize: 42100, controlPrice: 199.99, variantPrice: 219.99, revenueDeltaPercent: 12.1, pValue: 0.0008, status: 'STAT_SIGNIFICANT', duration: 'Day 18 / 30' },
    { id: 'exp-403', name: 'Fitness Tracker Markdown Ramp Test', type: 'Synthetic Control', sampleSize: 9200, controlPrice: 99.99, variantPrice: 89.99, revenueDeltaPercent: -2.1, pValue: 0.24, status: 'INCONCLUSIVE', duration: 'Day 7 / 14' },
    { id: 'exp-404', name: '4K Action Cam Parity Under-cut Experiment', type: 'Bayesian A/B Test', sampleSize: 31000, controlPrice: 299.99, variantPrice: 289.99, revenueDeltaPercent: 14.8, pValue: 0.0001, status: 'CONCLUDED_WINNER', duration: 'Completed' },
  ];

  const columns = [
    { header: 'Experiment Title', accessor: 'name', cell: ({ row }) => (
      <div>
        <span className="font-semibold text-xs text-pm-text block">{row.name}</span>
        <span className="text-[10px] text-pm-textDim font-mono">Type: {row.type} • ID: {row.id}</span>
      </div>
    )},
    { header: 'Status', accessor: 'status', align: 'center', cell: ({ value }) => (
      <Badge variant={value.includes('WINNER') || value.includes('SIGNIFICANT') ? 'success' : value === 'RUNNING' ? 'warning' : 'neutral'} size="sm">
        {value.replace('_', ' ')}
      </Badge>
    )},
    { header: 'Sample Size', accessor: 'sampleSize', align: 'right', tabular: true },
    { header: 'Control Price', accessor: 'controlPrice', align: 'right', cell: ({ value }) => formatCurrency(value) },
    { header: 'Variant Price', accessor: 'variantPrice', align: 'right', cell: ({ value }) => formatCurrency(value) },
    { header: 'Realized Lift', accessor: 'revenueDeltaPercent', align: 'right', cell: ({ value }) => (
      <span className={value > 0 ? 'text-pm-positiveText font-bold font-mono' : 'text-pm-negativeText font-mono'}>
        {formatPercent(value, true)}
      </span>
    )},
    { header: 'p-Value', accessor: 'pValue', align: 'right', tabular: true },
    { header: 'Timeline', accessor: 'duration', align: 'right', tabular: true },
  ];

  return (
    <ModuleShell
      breadcrumb={[{ label: 'A/B Pricing Experiments' }]}
      title="Dynamic Pricing Experiments & Sandbox Bandits"
      description="Randomized pricing experiments, multi-arm bandit exploration, and Bayesian lift verification."
      badge={<Badge variant="primary" size="sm">3 Active Experiments</Badge>}
      primaryAction={
        <Button variant="primary" size="sm" icon={Plus}>
          Launch New Experiment
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPIDisplay
          title="Active Testing Volume"
          value="69,700"
          type="raw"
          benchmarkLabel="Traffic Allocation"
          benchmarkValue="15% Catalog"
          tooltip="Total customer transaction sample exposed to randomized pricing variants"
        />
        <KPIDisplay
          title="Experiment Measured Lift"
          value={189400}
          type="currency"
          delta={11.4}
          benchmarkLabel="Confidence"
          benchmarkValue="99.2%"
          tooltip="Statistically significant incremental revenue generated via experimental pricing arms"
        />
        <KPIDisplay
          title="Stat-Sig Win Rate"
          value="75.0%"
          type="raw"
          benchmarkLabel="Target"
          benchmarkValue="> 60%"
          tooltip="Percentage of completed pricing experiments that achieve statistically significant margin gains"
        />
        <KPIDisplay
          title="Bandit Exploration Rate (ε)"
          value="0.05"
          type="raw"
          benchmarkLabel="Exploitation"
          benchmarkValue="95.0%"
          tooltip="Epsilon parameter governing automated multi-arm exploration vs revenue exploitation"
        />
      </div>

      <DataTable
        columns={columns}
        data={experiments}
        keyField="id"
        pagination={false}
      />
    </ModuleShell>
  );
}

export default Experiments;
