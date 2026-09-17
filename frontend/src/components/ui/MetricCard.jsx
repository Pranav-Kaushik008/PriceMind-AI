import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { cn, formatCurrency, formatPercent, formatBps, formatNumber } from '../../lib/utils';
import { Badge } from './Badge';
import { Tooltip } from './Tooltip';

/**
 * Enterprise MetricCard Component
 * High density, tabular numerals, delta indicator, forecast annotation, sparkline.
 */
export function MetricCard({
  label,
  value,
  unit = 'currency',
  currency = 'USD',
  delta,
  deltaPeriod = 'vs benchmark',
  deltaType = 'positive_is_good',
  historicalSparkline = [],
  forecastValue,
  confidenceInterval,
  tooltipExplanation,
  className = '',
  onClick,
}) {
  const formattedValue = () => {
    if (value === undefined || value === null) return '—';
    if (unit === 'currency') return formatCurrency(Number(value), currency);
    if (unit === 'percent') return formatPercent(Number(value));
    if (unit === 'bps') return formatBps(Number(value));
    if (unit === 'ratio') return Number(value).toFixed(2);
    return formatNumber(Number(value));
  };

  const isPositive = delta > 0;
  const isNegative = delta < 0;

  let deltaVariant = 'neutral';
  if (deltaType === 'positive_is_good') {
    deltaVariant = isPositive ? 'success' : isNegative ? 'danger' : 'neutral';
  } else if (deltaType === 'negative_is_good') {
    deltaVariant = isNegative ? 'success' : isPositive ? 'danger' : 'neutral';
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-pm-surface hover:bg-pm-hover border border-pm-border rounded-md p-4 transition-all duration-150 relative font-sans shadow-sm hover:border-pm-borderStrong flex flex-col justify-between',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-pm-textMuted uppercase tracking-wider flex items-center gap-1.5 truncate">
            {label}
          </span>
          {tooltipExplanation && (
            <Tooltip content={tooltipExplanation} position="top">
              <Info className="w-3.5 h-3.5 text-pm-textDim hover:text-pm-textSecondary cursor-help flex-shrink-0" />
            </Tooltip>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-1">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-pm-text tabular-nums">
            {formattedValue()}
          </div>

          {delta !== undefined && delta !== null && (
            <Badge variant={deltaVariant} size="sm" className="flex-shrink-0 font-mono">
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : isNegative ? (
                <ArrowDownRight className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {unit === 'bps' ? formatBps(delta, true) : formatPercent(delta, true)}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 flex items-center justify-between text-xs text-pm-textDim border-t border-pm-borderSubtle">
        <span className="truncate text-[11px]">{deltaPeriod}</span>
        {forecastValue !== undefined && (
          <span className="font-mono text-pm-accentText tabular-nums flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-pm-accent inline-block"></span>
            Fcst: {unit === 'currency' ? formatCurrency(forecastValue, currency, true) : formatPercent(forecastValue)}
          </span>
        )}
      </div>

      {/* Sparkline visualization */}
      {historicalSparkline.length > 0 && (
        <div className="mt-2.5 h-1.5 w-full flex items-end gap-1 overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity">
          {historicalSparkline.map((val, idx) => {
            const min = Math.min(...historicalSparkline);
            const max = Math.max(...historicalSparkline);
            const heightPct = max === min ? 50 : Math.max(20, ((val - min) / (max - min || 1)) * 100);
            return (
              <div
                key={idx}
                className="flex-1 bg-pm-accent/60 hover:bg-pm-accent rounded-t-sm transition-all"
                style={{ height: `${heightPct}%` }}
                title={`Step ${idx + 1}: ${val}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
