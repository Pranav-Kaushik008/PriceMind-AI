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
        'flex flex-col items-center justify-center text-center rounded-md border border-dashed border-pm-border p-8 bg-pm-subtle/50 font-sans',
        compact ? 'py-6 px-4' : 'py-12 px-6',
        className
      )}
    >
      <div className="w-10 h-10 rounded border border-pm-border bg-pm-surface flex items-center justify-center text-pm-textDim mb-3 shadow-sm">
        <Icon className="w-5 h-5" />
      </div>

      <h4 className="text-sm font-semibold text-pm-text mb-1">
        {title}
      </h4>

      <p className="text-xs text-pm-textMuted max-w-sm leading-relaxed mb-4">
        {description}
      </p>

      {(onAction || onSecondaryAction) && (
        <div className="flex items-center gap-2">
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
