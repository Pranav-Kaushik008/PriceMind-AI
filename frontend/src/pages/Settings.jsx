import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Save, Key, Database, Sliders, CheckCircle2 } from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Input, NumberInput } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/ToastProvider';

export function Settings() {
  const toast = useToast();

  const [marginFloor, setMarginFloor] = useState(35.0);
  const [maxPriceIncreaseDaily, setMaxPriceIncreaseDaily] = useState(8.0);
  const [competitorBandTolerance, setCompetitorBandTolerance] = useState(15.0);
  const [erpSyncCadence, setErpSyncCadence] = useState('hourly');
  const [autoApproveConfidenceThreshold, setAutoApproveConfidenceThreshold] = useState(95.0);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Guardrails Saved', 'Pricing policy parameters updated across production inference clusters.');
    }, 600);
  };

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Platform Settings & Governance' }]}
      title="Platform Settings & Pricing Guardrails"
      description="Define mathematical constraint bounds, ERP synchronization triggers, and risk policy thresholds."
      badge={<Badge variant="success" size="sm">Policy Engine Active</Badge>}
      primaryAction={
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          loading={saving}
          onClick={handleSave}
        >
          Save Configuration
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Financial & Margin Guardrails */}
        <div className="bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-6 shadow-lg space-y-5 font-sans">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Margin & Guardrail Limits
            </h3>
          </div>

          <div className="space-y-4">
            <NumberInput
              label="Hard Minimum Gross Margin Floor (%)"
              value={marginFloor}
              onChange={(e) => setMarginFloor(Number(e.target.value))}
              suffix="%"
              helperText="Prices yielding below this margin will be rejected by the optimization engine"
            />

            <NumberInput
              label="Maximum Single-Day Price Adjustment (%)"
              value={maxPriceIncreaseDaily}
              onChange={(e) => setMaxPriceIncreaseDaily(Number(e.target.value))}
              suffix="%"
              helperText="Prevents sudden price shocks to preserve consumer elasticity goodwill"
            />

            <NumberInput
              label="Competitor Price Band Variance (±%)"
              value={competitorBandTolerance}
              onChange={(e) => setCompetitorBandTolerance(Number(e.target.value))}
              suffix="%"
              helperText="Maximum allowable price deviation relative to average market competitor pricing"
            />
          </div>
        </div>

        {/* Section 2: Automation & ERP Integration */}
        <div className="bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-6 shadow-lg space-y-5 font-sans">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Automation & ERP Connectors
            </h3>
          </div>

          <div className="space-y-4">
            <NumberInput
              label="Autonomous Dispatch Confidence Threshold (%)"
              value={autoApproveConfidenceThreshold}
              onChange={(e) => setAutoApproveConfidenceThreshold(Number(e.target.value))}
              suffix="%"
              helperText="Recommendations with confidence above this score bypass manual review"
            />

            <Select
              label="ERP Sync Dispatch Frequency"
              value={erpSyncCadence}
              onChange={setErpSyncCadence}
              options={[
                { value: 'realtime', label: 'Real-time Webhook Dispatch', subtext: 'Immediate API push upon approval' },
                { value: 'hourly', label: 'Hourly Batch Sync', subtext: 'Consolidated batch dispatch' },
                { value: 'daily', label: 'Daily End-of-Day Batch', subtext: 'Scheduled at 23:59 UTC' },
                { value: 'manual', label: 'Strictly Manual Dispatch', subtext: 'Requires explicit analyst trigger' },
              ]}
              helperText="Target ERP: SAP S/4HANA (Production Instance US-01)"
            />

            <div className="pt-2">
              <span className="text-xs font-medium text-slate-300 block mb-2">
                Active ERP Connector Health
              </span>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs">
                <span className="font-mono text-white">SAP S/4HANA REST Gateway</span>
                <span className="flex items-center gap-1.5 font-mono text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Connected (200 OK)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}

export default Settings;
