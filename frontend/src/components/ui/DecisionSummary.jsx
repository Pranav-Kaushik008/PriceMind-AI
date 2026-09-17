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
        'bg-pm-surface border border-pm-border rounded-md p-5 shadow-sm font-sans flex flex-col md:flex-row items-start md:items-center justify-between gap-5',
        className
      )}
    >
      {/* Left: Summary Metrics */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Total Projected Revenue Lift */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-pm-textMuted block mb-1">
            Projected Portfolio Lift
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-pm-positiveText tabular-nums">
              +{formatCurrency(totalProjectedLift, currency, true)}
            </span>
            <Badge variant="success" size="sm" className="font-mono">
              +{expectedMarginDeltaBps} bps margin
            </Badge>
          </div>
        </div>

        <div className="hidden sm:block h-10 w-px bg-pm-borderSubtle" />

        {/* Action Status Counts */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-pm-textDim uppercase tracking-wider">Pending</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-pm-warning" />
              <span className="text-sm font-bold font-mono text-pm-text tabular-nums">
                {pendingCount}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-pm-textDim uppercase tracking-wider">Approved</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-pm-positive" />
              <span className="text-sm font-bold font-mono text-pm-text tabular-nums">
                {approvedCount}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-pm-textDim uppercase tracking-wider">Rejected</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-pm-negative" />
              <span className="text-sm font-bold font-mono text-pm-text tabular-nums">
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
