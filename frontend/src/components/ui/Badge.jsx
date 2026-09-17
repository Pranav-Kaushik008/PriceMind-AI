import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Badge Component
 * Variants: neutral, primary, success, danger, warning, info, purple, cyan
 * Styles: subtle, solid, outline, dot
 * Sizes: sm, md, lg
 */
export function Badge({
  children,
  variant = 'neutral',
  style = 'subtle',
  size = 'md',
  dot = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center font-medium select-none tracking-tight rounded whitespace-nowrap transition-colors';

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  const subtleVariants = {
    neutral: 'bg-pm-subtle text-pm-textSecondary border border-pm-borderSubtle',
    primary: 'bg-pm-accentBg text-pm-accentText border border-pm-accentBorder',
    success: 'bg-pm-positiveBg text-pm-positiveText border border-pm-positiveBorder',
    danger: 'bg-pm-negativeBg text-pm-negativeText border border-pm-negativeBorder',
    warning: 'bg-pm-warningBg text-pm-warningText border border-pm-warningBorder',
    info: 'bg-pm-infoBg text-pm-infoText border border-pm-infoBorder',
    cyan: 'bg-pm-cyanBg text-cyan-400 border border-pm-cyanBorder',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  };

  const solidVariants = {
    neutral: 'bg-slate-700 text-white',
    primary: 'bg-pm-accent text-white',
    success: 'bg-pm-positive text-slate-950 font-bold',
    danger: 'bg-pm-negative text-white font-semibold',
    warning: 'bg-pm-warning text-slate-950 font-bold',
    info: 'bg-pm-info text-white font-semibold',
    cyan: 'bg-pm-cyan text-slate-950 font-bold',
    purple: 'bg-purple-600 text-white',
  };

  const outlineVariants = {
    neutral: 'bg-transparent text-pm-textMuted border border-pm-border',
    primary: 'bg-transparent text-pm-accent border border-pm-accent',
    success: 'bg-transparent text-pm-positiveText border border-pm-positive',
    danger: 'bg-transparent text-pm-negativeText border border-pm-negative',
    warning: 'bg-transparent text-pm-warningText border border-pm-warning',
    info: 'bg-transparent text-pm-infoText border border-pm-info',
    cyan: 'bg-transparent text-cyan-400 border border-cyan-500',
    purple: 'bg-transparent text-purple-400 border border-purple-500',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    primary: 'bg-pm-accent',
    success: 'bg-pm-positive',
    danger: 'bg-pm-negative',
    warning: 'bg-pm-warning',
    info: 'bg-pm-info',
    cyan: 'bg-pm-cyan',
    purple: 'bg-purple-400',
  };

  let variantStyle = subtleVariants[variant] || subtleVariants.neutral;
  if (style === 'solid') variantStyle = solidVariants[variant] || solidVariants.neutral;
  if (style === 'outline') variantStyle = outlineVariants[variant] || outlineVariants.neutral;

  return (
    <span
      className={cn(
        baseStyles,
        sizes[size] || sizes.md,
        variantStyle,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            dotColors[variant] || dotColors.neutral
          )}
        />
      )}
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '', size = 'md' }) {
  const statusMap = {
    active: { label: 'Active', variant: 'success', dot: true },
    approved: { label: 'Approved', variant: 'success', dot: true },
    pending: { label: 'Pending Review', variant: 'warning', dot: true },
    review: { label: 'In Review', variant: 'warning', dot: true },
    rejected: { label: 'Rejected', variant: 'danger', dot: true },
    simulated: { label: 'Simulated', variant: 'info', dot: true },
    syncing: { label: 'Syncing', variant: 'cyan', dot: true },
    locked: { label: 'Locked', variant: 'neutral', dot: false },
    archived: { label: 'Archived', variant: 'neutral', dot: false },
    high: { label: 'High Confidence', variant: 'success', dot: false },
    medium: { label: 'Medium Confidence', variant: 'warning', dot: false },
    low: { label: 'Low Confidence', variant: 'danger', dot: false },
  };

  const config = statusMap[String(status).toLowerCase()] || {
    label: status,
    variant: 'neutral',
    dot: false,
  };

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={config.dot}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

export default Badge;
