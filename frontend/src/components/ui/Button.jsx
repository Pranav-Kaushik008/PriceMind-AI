import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Button Component
 * Supports: primary, secondary, subtle, outline, ghost, positive, negative, warning
 * Sizes: xs, sm, md, lg
 * States: loading, disabled, icon-only, active
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  fullWidth = false,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium select-none cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-pm-accent focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:translate-y-[0.5px]';

  const sizes = {
    xs: 'text-xs h-6 px-2 rounded gap-1 tracking-tight',
    sm: 'text-xs h-7 px-2.5 rounded gap-1.5 font-medium tracking-tight',
    md: 'text-xs h-8 px-3 rounded gap-2 font-medium',
    lg: 'text-sm h-9 px-4 rounded gap-2 font-semibold',
    iconXs: 'w-6 h-6 p-0 rounded flex items-center justify-center',
    iconSm: 'w-7 h-7 p-0 rounded flex items-center justify-center',
    iconMd: 'w-8 h-8 p-0 rounded flex items-center justify-center',
    iconLg: 'w-9 h-9 p-0 rounded flex items-center justify-center',
  };

  const variants = {
    primary:
      'bg-pm-accent hover:bg-pm-accentHover text-white shadow-sm border border-indigo-400/30 font-semibold',
    secondary:
      'bg-pm-surface hover:bg-pm-hover text-pm-text border border-pm-border shadow-sm',
    subtle:
      'bg-pm-subtle hover:bg-pm-hover text-pm-textSecondary hover:text-pm-text border border-pm-borderSubtle',
    outline:
      'bg-transparent hover:bg-pm-hover text-pm-text border border-pm-border hover:border-pm-borderStrong',
    ghost:
      'bg-transparent hover:bg-pm-hover text-pm-textMuted hover:text-pm-text border border-transparent',
    positive:
      'bg-pm-positive hover:bg-pm-positiveHover text-slate-950 font-semibold shadow-sm border border-emerald-400/40',
    positiveSubtle:
      'bg-pm-positiveBg hover:bg-pm-positive/20 text-pm-positive border border-pm-positiveBorder font-medium',
    negative:
      'bg-pm-negative hover:bg-pm-negativeHover text-white shadow-sm border border-rose-500/40 font-semibold',
    negativeSubtle:
      'bg-pm-negativeBg hover:bg-pm-negative/20 text-pm-negativeText border border-pm-negativeBorder font-medium',
    warning:
      'bg-pm-warning hover:bg-pm-warningHover text-slate-950 font-semibold shadow-sm border border-amber-400/40',
    warningSubtle:
      'bg-pm-warningBg hover:bg-pm-warning/20 text-pm-warningText border border-pm-warningBorder font-medium',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4 h-4',
    iconXs: 'w-3.5 h-3.5',
    iconSm: 'w-3.5 h-3.5',
    iconMd: 'w-4 h-4',
    iconLg: 'w-4.5 h-4.5',
  };

  const isIconOnly = !children && Icon;
  const currentSize = isIconOnly ? (size.startsWith('icon') ? size : `icon${size.charAt(0).toUpperCase() + size.slice(1)}`) : size;

  return (
    <button
      type={type}
      className={cn(
        baseStyles,
        sizes[currentSize] || sizes.md,
        variants[variant] || variants.primary,
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn(iconSizes[currentSize] || 'w-4 h-4', 'animate-spin')} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className={iconSizes[currentSize] || 'w-4 h-4'} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className={iconSizes[currentSize] || 'w-4 h-4'} />}
    </button>
  );
}

export function ButtonGroup({ children, className = '' }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded border border-pm-border bg-pm-subtle p-0.5 gap-0.5',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}

export default Button;
