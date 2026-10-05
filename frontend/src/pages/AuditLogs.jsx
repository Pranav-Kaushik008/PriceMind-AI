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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300">
          <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1">Ledger Integrity</div>
          <div className="text-xl font-mono font-bold text-emerald-400 flex items-center gap-2">
            <Lock size={16} />
            100% Verified
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Zero unhashed mutations</span>
        </div>

        <div className="p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300">
          <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1">Total Logged Events (30d)</div>
          <div className="text-xl font-mono font-bold text-white">
            14,892 Events
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Retained for 7 years (SOC-2 Type II)</span>
        </div>

        <div className="p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300">
          <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1">Guardrail Interventions</div>
          <div className="text-xl font-mono font-bold text-amber-400">
            38 Blocked
          </div>
          <span className="text-[11px] text-amber-400 font-mono mt-1 block">Prevented sub-floor price updates</span>
        </div>

        <div className="p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300">
          <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1">Regulatory Standard</div>
          <div className="text-xl font-mono font-bold text-cyan-400">
            ISO / SOC-2 / FTC
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Anti-collusion compliance enabled</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="mt-6 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Cryptographic Event Trail</h3>
            <span className="text-xs font-mono text-slate-400">({filteredLogs.length} events matching filter)</span>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search actor, SKU, or hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 bg-[#131D31]/90 border border-white/[0.08] focus:border-indigo-500/60 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 font-mono transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-left">
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Timestamp & Block Hash</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actor / System</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action Category</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Target Entity</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Event Details & State Change</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Guardrail Validation</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.map((log) => {
                const isBlocked = log.status === 'GUARDRAIL_BLOCKED';
                return (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-xs font-mono text-white">{log.timestamp}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Key size={10} className="text-indigo-400" /> {log.hash}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-200">{log.actor}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-xs font-mono font-semibold text-indigo-400">{log.target}</span>
                    </td>
                    <td className="py-3 px-3 max-w-md">
                      <p className="text-xs text-slate-300 font-mono leading-relaxed">{log.details}</p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full ${isBlocked ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
                        {log.guardrailCheck}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold ${
                        isBlocked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        log.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
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
