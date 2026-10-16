import React, { useState } from 'react';
import { FlaskConical, Plus, Play, Pause, CheckCircle2, TrendingUp, Sparkles, X } from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { KPIDisplay } from '../components/ui/KPIDisplay';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/ToastProvider';
import { formatCurrency, formatPercent } from '../lib/utils';

export function Experiments() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialExperiments = [
    { id: 'exp-401', name: 'Premium Wireless Audio ASP Elevation', type: 'Bayesian A/B Test', sampleSize: 18400, controlPrice: 149.99, variantPrice: 164.99, revenueDeltaPercent: 8.4, pValue: 0.002, status: 'RUNNING', duration: 'Day 12 / 21' },
    { id: 'exp-402', name: 'Smart Home Hub Bundle Elasticity Test', type: 'Multi-Arm Bandit', sampleSize: 42100, controlPrice: 199.99, variantPrice: 219.99, revenueDeltaPercent: 12.1, pValue: 0.0008, status: 'STAT_SIGNIFICANT', duration: 'Day 18 / 30' },
    { id: 'exp-403', name: 'Fitness Tracker Markdown Ramp Test', type: 'Synthetic Control', sampleSize: 9200, controlPrice: 99.99, variantPrice: 89.99, revenueDeltaPercent: -2.1, pValue: 0.24, status: 'INCONCLUSIVE', duration: 'Day 7 / 14' },
    { id: 'exp-404', name: '4K Action Cam Parity Under-cut Experiment', type: 'Bayesian A/B Test', sampleSize: 31000, controlPrice: 299.99, variantPrice: 289.99, revenueDeltaPercent: 14.8, pValue: 0.0001, status: 'CONCLUDED_WINNER', duration: 'Completed' },
  ];

  const [experiments, setExperiments] = useState(initialExperiments);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Bayesian A/B Test',
    sampleSize: '25000',
    controlPrice: '129.99',
    variantPrice: '139.99',
    durationDays: '21',
  });

  const handleLaunchExperiment = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Title Required', 'Please enter an experiment title.');
      return;
    }

    const cPrice = parseFloat(formData.controlPrice) || 100;
    const vPrice = parseFloat(formData.variantPrice) || 110;
    const sSize = parseInt(formData.sampleSize, 10) || 10000;
    const liftEst = Math.round(((vPrice - cPrice) / cPrice) * 100 * 10) / 10;

    const newExp = {
      id: `exp-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name.trim(),
      type: formData.type,
      sampleSize: sSize,
      controlPrice: cPrice,
      variantPrice: vPrice,
      revenueDeltaPercent: liftEst,
      pValue: 0.045,
      status: 'RUNNING',
      duration: `Day 1 / ${formData.durationDays || '21'}`,
    };

    setExperiments((prev) => [newExp, ...prev]);
    setIsModalOpen(false);
    setFormData({
      name: '',
      type: 'Bayesian A/B Test',
      sampleSize: '25000',
      controlPrice: '129.99',
      variantPrice: '139.99',
      durationDays: '21',
    });
    toast.success('Experiment Launched', `"${newExp.name}" is now live and collecting randomized customer traffic.`);
  };

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
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
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

      {/* New Experiment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Launch Dynamic Pricing Experiment"
        subtitle="Configure randomized A/B or multi-arm bandit pricing tests."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={Play} onClick={handleLaunchExperiment}>
              Start Experiment
            </Button>
          </div>
        }
      >
        <form onSubmit={handleLaunchExperiment} className="space-y-4 py-2 font-sans text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Experiment Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Smart Audio Pro Elasticity Elevation Test"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#131D31] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Experiment Framework</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#131D31] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Bayesian A/B Test">Bayesian A/B Test</option>
                <option value="Multi-Arm Bandit">Multi-Arm Bandit</option>
                <option value="Synthetic Control">Synthetic Control</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Sample Size (Transactions)</label>
              <input
                type="number"
                value={formData.sampleSize}
                onChange={(e) => setFormData({ ...formData, sampleSize: e.target.value })}
                className="w-full bg-[#131D31] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Control Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.controlPrice}
                onChange={(e) => setFormData({ ...formData, controlPrice: e.target.value })}
                className="w-full bg-[#131D31] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Variant Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.variantPrice}
                onChange={(e) => setFormData({ ...formData, variantPrice: e.target.value })}
                className="w-full bg-[#131D31] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Duration (Days)</label>
              <input
                type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                className="w-full bg-[#131D31] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-[11px] leading-relaxed">
            Traffic will automatically be split 50/50 across Control and Variant pricing arms. Bayesian p-value and revenue delta metrics update in real-time.
          </div>
        </form>
      </Modal>
    </ModuleShell>
  );
}

export default Experiments;
