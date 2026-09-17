import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Toast Notification Component
 * Variants: success, error, warning, info
 */
export function Toast({
  id,
  type = 'info',
  title,
  message,
  action,
  onDismiss,
  className = '',
}) {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-pm-positive flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-pm-negative flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-pm-warning flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-pm-info flex-shrink-0" />,
  };

  const borders = {
    success: 'border-pm-positiveBorder',
    error: 'border-pm-negativeBorder',
    warning: 'border-pm-warningBorder',
    info: 'border-pm-infoBorder',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-3.5 bg-pm-elevated border rounded shadow-lg max-w-sm w-full font-sans text-xs transition-all duration-200 animate-in fade-in slide-in-from-top-2',
        borders[type] || 'border-pm-borderStrong',
        className
      )}
    >
      {icons[type] || icons.info}

      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <h4 className="font-semibold text-pm-text text-xs leading-tight mb-0.5">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-pm-textSecondary text-[11px] leading-relaxed">
            {message}
          </p>
        )}
        {action && (
          <div className="mt-2">
            <button
              type="button"
              onClick={action.onClick}
              className="text-[11px] font-semibold text-pm-accent hover:underline cursor-pointer"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="text-pm-textDim hover:text-pm-text p-0.5 rounded transition-colors cursor-pointer flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default Toast;
