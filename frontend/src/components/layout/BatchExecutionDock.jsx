import React, { useState } from 'react';
import { Zap, CheckCircle2, RefreshCw, X, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockRecommendations } from '../../mock/mockData';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-pm-card/95 border border-pm-accent/50 rounded-xl p-3.5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pm-accent/20 border border-pm-accent/50 flex items-center justify-center text-pm-accentLight flex-shrink-0">
            {executionSuccess ? <CheckCircle2 className="w-5 h-5 text-pm-lift" /> : <Zap className="w-5 h-5 text-pm-accent" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                {executionSuccess ? 'Batch Sync Dispatched to SAP / POS' : `${queuedRecommendations.length} Recommendations Staged for Dispatch`}
              </span>
              <Badge variant="lift">
                +{formatCurrency(totalLift, 'USD', true)}/mo Net Lift
              </Badge>
            </div>
            <p className="text-[11px] text-pm-textMuted">
              {executionSuccess
                ? 'Price vectors synchronized across ERP and marketplace channels with verified cryptographic audit signature.'
                : 'Validated against margin floors (min 35%) and competitor index guardrails.'}
            </p>
          </div>
        </div>

        {/* Right Action Trigger */}
        {!executionSuccess ? (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="xs"
              onClick={clearQueuedRecommendations}
              className="text-xs text-pm-textDim hover:text-white"
            >
              Clear
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setActivePage('revenue-optimization')}
            >
              Inspect Queue
            </Button>
            <Button
              variant="lift"
              size="sm"
              disabled={isExecuting}
              onClick={handleExecute}
              icon={isExecuting ? RefreshCw : ArrowUpRight}
              className="font-mono font-bold"
            >
              {isExecuting ? 'Dispatching...' : 'Execute Batch ERP Sync'}
            </Button>
          </div>
        ) : (
          <Badge variant="lift" className="px-3 py-1 text-xs">
            STATUS: ACTIVE IN ERP
          </Badge>
        )}
      </div>
    </div>
  );
}
