import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Activity, RefreshCw } from 'lucide-react';
import { cn, formatPercent, formatBps } from '../../lib/utils';

/**
 * Status Dot with optional subtle pulsation
 */
export function StatusDot({
  status = 'active', // 'active' | 'warning' | 'error' | 'syncing' | 'offline'
  size = 'md',
  pulse = false,
  className = '',
}) {
  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const statusColors = {
    active: 'bg-pm-positive',
    success: 'bg-pm-positive',
    warning: 'bg-pm-warning',
    error: 'bg-pm-negative',
    danger: 'bg-pm-negative',
    syncing: 'bg-pm-cyan',
    info: 'bg-pm-info',
    offline: 'bg-pm-textDim',
  };

  const currentColor = statusColors[status] || statusColors.offline;

  return (
    <span className={cn('relative inline-flex items-center justify-center flex-shrink-0', className)}>
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping',
            currentColor
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full', sizeClasses[size] || sizeClasses.md, currentColor)} />
    </span>
  );
}

/**
 * Financial & Pricing Trend Indicator (+/- %, bps, flat)
 */
export function TrendIndicator({
  value,
  type = 'percent', // 'percent' | 'bps' | 'raw'
  isPositiveGood = true,
  showIcon = true,
  decimals = 1,
  size = 'md',
  className = '',
}) {
  const num = Number(value) || 0;
  const isPositive = num > 0;
  const isNegative = num < 0;
  const isFlat = num === 0;

  // In pricing, positive delta can be good (revenue lift) or bad (competitor undercut)
  let colorClass = 'text-pm-textDim';
  if (isPositive) {
    colorClass = isPositiveGood ? 'text-pm-positiveText' : 'text-pm-negativeText';
  } else if (isNegative) {
    colorClass = isPositiveGood ? 'text-pm-negativeText' : 'text-pm-positiveText';
  }

  let formattedValue = '';
  if (type === 'percent') {
    formattedValue = formatPercent(num, true, decimals);
  } else if (type === 'bps') {
    formattedValue = formatBps(num, true);
  } else {
    formattedValue = `${isPositive ? '+' : ''}${num.toFixed(decimals)}`;
  }

  const sizes = {
    sm: 'text-[11px] gap-0.5',
    md: 'text-xs gap-1',
    lg: 'text-sm gap-1.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-medium tabular-nums select-none',
        sizes[size] || sizes.md,
        colorClass,
        className
      )}
    >
      {showIcon && (
        <>
          {isPositive && <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />}
          {isNegative && <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />}
          {isFlat && <Minus className="w-3.5 h-3.5 flex-shrink-0" />}
        </>
      )}
      <span>{formattedValue}</span>
    </span>
  );
}

/**
 * Engine Health / Connection Status Indicator
 */
export function HealthGauge({
  health = 'healthy', // 'healthy' | 'degraded' | 'critical'
  latencyMs = 24,
  label = 'Inference Engine',
  className = '',
}) {
  const configs = {
    healthy: {
      status: 'active',
      badge: 'ONLINE',
      color: 'text-pm-positiveText',
    },
    degraded: {
      status: 'warning',
      badge: 'DEGRADED',
      color: 'text-pm-warningText',
    },
    critical: {
      status: 'error',
      badge: 'OFFLINE',
      color: 'text-pm-negativeText',
    },
  };

  const current = configs[health] || configs.healthy;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 bg-pm-subtle border border-pm-borderSubtle rounded text-xs',
        className
      )}
    >
      <StatusDot status={current.status} pulse={health === 'healthy'} size="xs" />
      <span className="text-pm-textSecondary font-medium">{label}</span>
      <span className="text-pm-textDim font-mono text-[10px]">
        {latencyMs}ms
      </span>
    </div>
  );
}

export default StatusDot;
