import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value, currency = 'USD', compact = false) {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value, includeSign = false, decimals = 1) {
  if (value === undefined || value === null || isNaN(value)) return '0.0%';
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(decimals)}%`;
}

export function formatBps(value, includeSign = false) {
  if (value === undefined || value === null || isNaN(value)) return '0 bps';
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${Math.round(value)} bps`;
}

export function formatNumber(value, compact = false) {
  if (value === undefined || value === null || isNaN(value)) return '0';
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
}
