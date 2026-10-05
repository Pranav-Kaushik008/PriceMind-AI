import React from 'react';
import { Send, CheckCircle2, Clock, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '../../lib/utils';
import { Button } from './Button';
import { Badge } from './Badge';

/**
 * Enterprise Decision Summary Component
 * Displays executive summary of pricing action items, aggregate portfolio lift,
 * pending review counts, and ERP dispatch controls.
 */
export function DecisionSummary({
  pendingCount = 12,
  approvedCount = 4,
  rejectedCount = 1,
  totalProjectedLift = 428500,
  expectedMarginDeltaBps = 142,
  currency = 'USD',
  onPushToERP,
  onApproveAll,
  isPushing = false,
  className = '',
}) {
  return (
    <div
      className={cn(
        'bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 shadow-lg font-sans flex flex-col md:flex-row items-start md:items-center justify-between gap-5',
        className
      )}
    >
      {/* Left: Summary Metrics */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Total Projected Revenue Lift */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Projected Portfolio Lift
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              +{formatCurrency(totalProjectedLift, currency, true)}
            </span>
            <Badge variant="success" size="sm" className="font-mono">
              +{expectedMarginDeltaBps} bps margin
            </Badge>
          </div>
        </div>

        <div className="hidden sm:block h-10 w-px bg-white/[0.08]" />

        {/* Action Status Counts */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Pending</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {pendingCount}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Approved</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {approvedCount}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Rejected</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {rejectedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        {onApproveAll && pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onApproveAll}
          >
            Approve Validated ({pendingCount})
          </Button>
        )}

        {onPushToERP && (
          <Button
            variant="primary"
            size="sm"
            icon={Send}
            loading={isPushing}
            onClick={onPushToERP}
            disabled={approvedCount === 0}
          >
            Push {approvedCount} to ERP
          </Button>
        )}
      </div>
    </div>
  );
}

export default DecisionSummary;
