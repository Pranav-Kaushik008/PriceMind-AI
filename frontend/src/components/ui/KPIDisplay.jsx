import React from 'react';
import { Info } from 'lucide-react';
import { cn, formatCurrency, formatPercent, formatBps, formatNumber } from '../../lib/utils';
import { TrendIndicator } from './StatusIndicator';
import { Tooltip } from './Tooltip';

/**
 * Enterprise KPI Display / Metric Component
 * Features tabular financial numerals, delta indicator, benchmark target, sparkline/progress.
 */
export function KPIDisplay({
  title,
  value,
  type = 'currency', // 'currency' | 'percent' | 'bps' | 'number' | 'raw'
  currency = 'USD',
  delta,
  deltaType = 'percent', // 'percent' | 'bps'
  isPositiveGood = true,
  benchmarkLabel,
  benchmarkValue,
  tooltip,
  icon: Icon,
  progress, // 0 to 100 for capacity/target progress
  sparklineData = [],
  className = '',
}) {
  let formattedValue = value;
  if (type === 'currency') {
    formattedValue = typeof value === 'number' ? formatCurrency(value, currency) : value;
  } else if (type === 'percent') {
    formattedValue = typeof value === 'number' ? formatPercent(value) : value;
  } else if (type === 'bps') {
    formattedValue = typeof value === 'number' ? formatBps(value) : value;
  } else if (type === 'number') {
    formattedValue = typeof value === 'number' ? formatNumber(value) : value;
  }

  return (
    <div
      className={cn(
        'flex flex-col p-4 bg-pm-surface border border-pm-border rounded-md shadow-sm transition-all duration-150 font-sans hover:border-pm-borderStrong',
        className
      )}
    >
      {/* Metric Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-pm-textMuted truncate">
            {title}
          </span>
          {tooltip && (
            <Tooltip content={tooltip} position="top">
              <Info className="w-3 h-3 text-pm-textDim hover:text-pm-textSecondary cursor-help flex-shrink-0" />
            </Tooltip>
          )}
        </div>

        {Icon && (
          <div className="w-6 h-6 rounded bg-pm-subtle border border-pm-borderSubtle flex items-center justify-center text-pm-textDim flex-shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Main Tabular Value */}
      <div className="flex items-baseline gap-2.5 mb-2">
        <span className="text-xl sm:text-2xl font-bold font-mono text-pm-text tabular-nums tracking-tight">
          {formattedValue}
        </span>

        {delta !== undefined && delta !== null && (
          <TrendIndicator
            value={delta}
            type={deltaType}
            isPositiveGood={isPositiveGood}
            size="sm"
          />
        )}
      </div>

      {/* Benchmark or Progress or Sparkline */}
      <div className="mt-auto pt-1 flex items-center justify-between text-[11px] text-pm-textDim">
        {benchmarkLabel && (
          <div className="flex items-center gap-1 truncate font-mono">
            <span>{benchmarkLabel}:</span>
            <span className="font-semibold text-pm-textSecondary">
              {benchmarkValue}
            </span>
          </div>
        )}

        {/* Micro progress bar */}
        {progress !== undefined && (
          <div className="w-full flex flex-col gap-1 mt-1">
            <div className="w-full h-1 bg-pm-subtle rounded-full overflow-hidden border border-pm-borderSubtle">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  progress > 90 ? 'bg-pm-warning' : 'bg-pm-accent'
                )}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-pm-textDim">
              <span>Target: {progress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default KPIDisplay;
