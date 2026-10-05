import React, { useState } from 'react';
import { Zap, CheckCircle2, RefreshCw, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockRecommendations } from '../../mock/mockData';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';

export function BatchExecutionDock() {
  const { queuedRecommendations, clearQueuedRecommendations, setActivePage } = useAppStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  if (queuedRecommendations.length === 0 && !executionSuccess) return null;

  const queuedRecs = mockRecommendations.filter((r) => queuedRecommendations.includes(r.id));
  const totalLift = queuedRecs.reduce((sum, r) => sum + r.projectedRevenueDelta, 0);

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setExecutionSuccess(true);
      clearQueuedRecommendations();
      setTimeout(() => setExecutionSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-[#0D1526]/90 border border-indigo-500/40 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(99,102,241,0.25)] backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Status */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-cyan-500/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            {executionSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Zap className="w-5 h-5 text-indigo-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                {executionSuccess ? 'Batch Sync Dispatched to SAP / POS' : `${queuedRecommendations.length} Recommendations Staged for Dispatch`}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                +{formatCurrency(totalLift, 'USD', true)}/mo Net Lift
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {executionSuccess
                ? 'Price vectors synchronized across ERP and marketplace channels with verified cryptographic audit signature.'
                : 'Validated against margin floors (min 35%) and competitor index guardrails.'}
            </p>
          </div>
        </div>

        {/* Right Action Trigger */}
        {!executionSuccess ? (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={clearQueuedRecommendations}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setActivePage('pricing')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-slate-200 transition-all cursor-pointer"
            >
              Inspect Queue
            </button>
            <button
              type="button"
              disabled={isExecuting}
              onClick={handleExecute}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              <span>{isExecuting ? 'Dispatching...' : 'Execute Batch ERP Sync'}</span>
            </button>
          </div>
        ) : (
          <span className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            STATUS: ACTIVE IN ERP
          </span>
        )}
      </div>
    </div>
  );
}

export default BatchExecutionDock;
