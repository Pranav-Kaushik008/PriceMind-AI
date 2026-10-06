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
        'relative group flex flex-col p-4 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] hover:border-indigo-500/40 rounded-xl shadow-lg transition-all duration-300 font-sans overflow-hidden',
        className
      )}
    >
      {/* Subtle top glow highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Metric Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors truncate">
            {title}
          </span>
          {tooltip && (
            <Tooltip content={tooltip} position="top">
              <Info className="w-3 h-3 text-slate-500 hover:text-slate-300 cursor-help flex-shrink-0" />
            </Tooltip>
          )}
        </div>

        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-500/40 transition-all flex-shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Main Tabular Value */}
      <div className="flex items-baseline gap-2.5 mb-2">
        <span className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
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
      <div className="mt-auto pt-2 border-t border-white/[0.05] space-y-1.5 text-[11px] font-mono">
        {benchmarkLabel && (
          <div className="flex items-center justify-between gap-1.5 text-[11px]">
            <span className="text-slate-500">{benchmarkLabel}:</span>
            <span className="font-semibold text-slate-300 truncate">
              {benchmarkValue}
            </span>
          </div>
        )}

        {/* Micro progress bar */}
        {progress !== undefined && (
          <div className="w-full flex flex-col gap-1 pt-0.5">
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 shadow-sm',
                  progress >= 95
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : progress > 80
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500'
                )}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Ingestion SLA</span>
              <span className="text-emerald-400 font-semibold">{progress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default KPIDisplay;
