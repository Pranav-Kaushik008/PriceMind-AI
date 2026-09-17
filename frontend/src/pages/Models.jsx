import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, RefreshCw, Layers, ShieldCheck, Activity } from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { KPIDisplay } from '../components/ui/KPIDisplay';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { HealthGauge } from '../components/ui/StatusIndicator';

export function Models() {
  const models = [
    { id: 'lgbm-spline-v3.4', name: 'LightGBM-Spline Elasticity Engine', version: 'v3.4.1', status: 'ACTIVE_PROD', wape: 4.8, r2: 0.942, latency: '18ms', lastRetrained: '2026-03-12', driftScore: '0.012 (Safe)' },
    { id: 'hierarchical-demand-v2', name: 'Hierarchical Bayes Demand Forecaster', version: 'v2.1.0', status: 'ACTIVE_PROD', wape: 6.2, r2: 0.918, latency: '34ms', lastRetrained: '2026-03-10', driftScore: '0.024 (Safe)' },
    { id: 'shap-kernel-explainer-v1', name: 'SHAP Feature Attribution Explainer', version: 'v1.8.0', status: 'ONLINE', wape: 0.0, r2: 0.998, latency: '12ms', lastRetrained: '2026-03-14', driftScore: '0.000 (Static)' },
    { id: 'cross-elasticity-nn-v4-canary', name: 'Deep Cross-Elasticity Matrix (Canary)', version: 'v4.0.0-rc2', status: 'CANARY_10PCT', wape: 3.9, r2: 0.961, latency: '42ms', lastRetrained: '2026-03-15', driftScore: '0.018 (Safe)' },
  ];

  const columns = [
    { header: 'Model Name & Identifier', accessor: 'name', cell: ({ row }) => (
      <div>
        <span className="font-semibold text-xs text-pm-text block">{row.name}</span>
        <span className="text-[10px] text-pm-textDim font-mono">{row.id}</span>
      </div>
    )},
    { header: 'Version', accessor: 'version', cell: ({ value }) => <span className="font-mono text-xs text-pm-textSecondary">{value}</span> },
    { header: 'Status', accessor: 'status', align: 'center', cell: ({ value }) => (
      <Badge variant={value.includes('PROD') || value === 'ONLINE' ? 'success' : 'warning'} size="sm">
        {value}
      </Badge>
    )},
    { header: 'WAPE Error', accessor: 'wape', align: 'right', cell: ({ value }) => `${value}%` },
    { header: 'R² Fit', accessor: 'r2', align: 'right', cell: ({ value }) => value.toFixed(3) },
    { header: 'Inference P99', accessor: 'latency', align: 'right', tabular: true },
    { header: 'Drift Index (PSI)', accessor: 'driftScore', align: 'center', cell: ({ value }) => (
      <span className="text-[11px] font-mono text-pm-positiveText">{value}</span>
    )},
    { header: 'Last Trained', accessor: 'lastRetrained', align: 'right', tabular: true },
  ];

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Model Registry & Governance' }]}
      title="Machine Learning Model Registry & Observability"
      description="Production inference pipelines, spline elasticity model weights, and drift monitoring."
      badge={<Badge variant="success" size="sm">4 Models Online</Badge>}
      primaryAction={
        <Button variant="primary" size="sm" icon={RefreshCw}>
          Trigger Retraining Run
        </Button>
      }
      secondaryActions={
        <div className="flex items-center gap-2">
          <HealthGauge health="healthy" latencyMs={18} label="Inference Gateway" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPIDisplay
          title="Production Elasticity Models"
          value="4"
          type="number"
          benchmarkLabel="Deployment"
          benchmarkValue="Zero Downtime"
          tooltip="Active ML inference models serving dynamic pricing recommendations"
        />
        <KPIDisplay
          title="Portfolio WAPE Accuracy"
          value="4.8%"
          type="raw"
          delta={-0.6}
          benchmarkLabel="Tolerance"
          benchmarkValue="< 8.0%"
          tooltip="Weighted Absolute Percentage Error on 30-day out-of-sample demand forecast"
        />
        <KPIDisplay
          title="Inference Latency (P99)"
          value="24ms"
          type="raw"
          delta={-4}
          benchmarkLabel="SLA Target"
          benchmarkValue="< 50ms"
          tooltip="99th percentile end-to-end pricing recommendation inference latency"
        />
        <KPIDisplay
          title="Dataset Ingestion Health"
          value="1.4M / day"
          type="raw"
          benchmarkLabel="Sync Cadence"
          benchmarkValue="Hourly Batch"
          progress={98}
          tooltip="Daily clean transaction records ingested and featurized for retraining"
        />
      </div>

      <DataTable
        columns={columns}
        data={models}
        keyField="id"
        pagination={false}
      />
    </ModuleShell>
  );
}

export default Models;
