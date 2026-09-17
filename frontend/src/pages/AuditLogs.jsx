import React, { useState } from 'react';
import {
  FileCheck2, ShieldCheck, CheckCircle2, RefreshCw, Download,
  Lock, Search, Filter, AlertCircle, Terminal, Key
} from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Button } from '../components/ui/Button';
import { NativeSelect } from '../components/ui/Select';
import { DateRangePicker } from '../components/ui/DatePicker';

const auditLogsData = [
  {
    id: 'log-101',
    hash: '0x8f2a91...c4b2',
    timestamp: '2026-09-17 05:42:10 UTC',
    actor: 'Sarah Chen (Lead Pricing Mgr)',
    actionType: 'PRICE_APPROVAL',
    target: 'SKU-8921-PRO',
    details: 'Approved +11.8% price revision ($389.00 → $435.00). Dispatched to SAP ERP production endpoint.',
    guardrailCheck: 'PASSED (4/4 rules)',
    status: 'VERIFIED',
  },
  {
    id: 'log-102',
    hash: '0x3d1e89...910a',
    timestamp: '2026-09-17 05:15:32 UTC',
    actor: 'PriceMind AI Crawler Cluster',
    actionType: 'TELEMETRY_INGEST',
    target: 'Apex Industrial & OmniTech Feeds',
    details: 'Ingested 3,420 price vectors across 12 competitor domains. TreeSHAP recalculation completed.',
    guardrailCheck: 'PASSED (0 DOM errors)',
    status: 'COMPLETED',
  },
  {
    id: 'log-103',
    hash: '0xaa45b2...f881',
    timestamp: '2026-09-17 04:30:19 UTC',
    actor: 'Marcus Vance (Compliance Admin)',
    actionType: 'POLICY_MUTATION',
    target: 'Global Hardware Margin Floor',
    details: 'Updated margin floor constraint from 32.0% to 35.0% for Hardware & Tools portfolio.',
    guardrailCheck: 'APPROVED (2FA verified)',
    status: 'VERIFIED',
  },
  {
    id: 'log-104',
    hash: '0x55c910...22ea',
    timestamp: '2026-09-17 03:22:04 UTC',
    actor: 'Alex Rivera (VP Revenue)',
    actionType: 'SIMULATION_EXEC',
    target: 'Q4 Macro Inflation Sensitivity',
    details: 'Executed 10,000-run Monte Carlo scenario with 5% COGS shock and competitor price response.',
    guardrailCheck: 'SIMULATED',
    status: 'COMPLETED',
  },
  {
    id: 'log-105',
    hash: '0x99e124...71db',
    timestamp: '2026-09-16 22:11:45 UTC',
    actor: 'PriceMind AI Automated Engine',
    actionType: 'PRICE_REJECTION',
    target: 'SKU-1090-CAB',
    details: 'Auto-rejected price cut suggestion: Triggered margin constraint guardrail #3 (Minimum Margin Violation).',
    guardrailCheck: 'BLOCKED BY GUARDRAIL',
    status: 'GUARDRAIL_BLOCKED',
  },
  {
    id: 'log-106',
    hash: '0x12b884...aa90',
    timestamp: '2026-09-16 18:04:12 UTC',
    actor: 'Sarah Chen (Lead Pricing Mgr)',
    actionType: 'MODEL_DEPLOYMENT',
    target: 'XGBoost Spline Elasticity v2.4.1',
    details: 'Promoted candidate model v2.4.1 to production after passing 14-day shadow A/B backtesting.',
    guardrailCheck: 'PASSED (R²=0.912)',
    status: 'VERIFIED',
  }
];

export function AuditLogs() {
  const [filterAction, setFilterAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogsData.filter(log => {
    if (filterAction !== 'all' && log.actionType !== filterAction) return false;
    if (searchTerm && !log.actor.toLowerCase().includes(searchTerm.toLowerCase()) && !log.details.toLowerCase().includes(searchTerm.toLowerCase()) && !log.target.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="text-xs h-8">
        <option value="all">All Action Types</option>
        <option value="PRICE_APPROVAL">Price Approvals</option>
        <option value="POLICY_MUTATION">Policy Mutations</option>
        <option value="MODEL_DEPLOYMENT">Model Deployments</option>
        <option value="PRICE_REJECTION">Guardrail Rejections</option>
      </NativeSelect>
      <DateRangePicker />
      <Button variant="ghost" size="sm" icon={RefreshCw} className="text-xs">
        Verify Blockchain
      </Button>
      <Button variant="ghost" size="sm" icon={Download} className="text-xs">
        Export Audit Trail
      </Button>
    </div>
  );

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Settings' }, { label: 'Audit Logs' }]}
      title="Immutable Governance & Audit Trail"
      description="Cryptographically signed ledger of all pricing interventions, guardrail overrides, crawler events, and model deployments."
      actions={controls}
    >
      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-pm-borderSubtle border border-pm-borderSubtle rounded-sm">
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Ledger Integrity</div>
          <div className="text-xl font-mono font-semibold text-pm-positiveText flex items-center gap-2">
            <Lock size={14} />
            100% Verified
          </div>
          <span className="text-[10px] text-pm-textMuted font-mono">Zero unhashed mutations</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Total Logged Events (30d)</div>
          <div className="text-xl font-mono font-semibold text-pm-text">
            14,892 Events
          </div>
          <span className="text-[10px] text-pm-textDim font-mono">Retained for 7 years (SOC-2 Type II)</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Guardrail Interventions</div>
          <div className="text-xl font-mono font-semibold text-pm-warningText">
            38 Blocked
          </div>
          <span className="text-[10px] text-pm-warningText font-mono">Prevented sub-floor price updates</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Regulatory Standard</div>
          <div className="text-xl font-mono font-semibold text-pm-accentText">
            ISO / SOC-2 / FTC
          </div>
          <span className="text-[10px] text-pm-textDim font-mono">Anti-collusion compliance enabled</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-pm-borderSubtle mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Cryptographic Event Trail</h3>
            <span className="text-xs font-mono text-pm-textDim">({filteredLogs.length} events matching filter)</span>
          </div>

          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2.5 text-pm-textDim" />
            <input
              type="text"
              placeholder="Search actor, SKU, or hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-3 py-1 bg-pm-surface border border-pm-borderSubtle rounded-sm text-xs text-pm-text font-mono placeholder:text-pm-textDim focus:outline-none focus:border-pm-borderStrong"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-pm-border text-left">
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Timestamp & Block Hash</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Actor / System</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Action Category</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Target Entity</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Event Details & State Change</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Guardrail Validation</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isBlocked = log.status === 'GUARDRAIL_BLOCKED';
                return (
                  <tr key={log.id} className="border-b border-pm-borderSubtle hover:bg-pm-hover transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="text-xs font-mono text-pm-text">{log.timestamp}</div>
                      <div className="text-[10px] text-pm-textDim font-mono mt-0.5 flex items-center gap-1">
                        <Key size={9} className="text-pm-accentText" /> {log.hash}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-pm-text">{log.actor}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-pm-subtle border border-pm-borderSubtle text-pm-textMuted">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-xs font-mono font-semibold text-pm-accentText">{log.target}</span>
                    </td>
                    <td className="py-2.5 px-3 max-w-md">
                      <p className="text-xs text-pm-text font-mono leading-relaxed">{log.details}</p>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${isBlocked ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {log.guardrailCheck}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold ${
                        isBlocked ? 'bg-red-500/10 text-red-400' :
                        log.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleShell>
  );
}
