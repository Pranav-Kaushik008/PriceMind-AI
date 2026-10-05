import React from 'react';
import { Database, Plus, Search, FilterX } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

/**
 * Enterprise Empty State Component
 * Clean, restrained editorial typography, no decorative blobs or cartoon illustrations.
 */
export function EmptyState({
  icon: Icon = Database,
  title = 'No records found',
  description = 'There are no items matching your current criteria or date range.',
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/[0.12] p-8 bg-[#0D1524]/40 backdrop-blur-md font-sans shadow-inner',
        compact ? 'py-6 px-4' : 'py-12 px-6',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-indigo-400 mb-3.5 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
        <Icon className="w-5 h-5" />
      </div>

      <h4 className="text-sm font-bold text-white mb-1.5">
        {title}
      </h4>

      <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-5">
        {description}
      </p>

      {(onAction || onSecondaryAction) && (
        <div className="flex items-center gap-2.5">
          {onAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              icon={ActionIcon}
            >
              {actionLabel || 'Create Record'}
            </Button>
          )}

          {onSecondaryAction && (
            <Button
              variant="subtle"
              size="sm"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel || 'Reset Filters'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
