import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Skeleton Shimmer Loader
 * Variants: text, rectangular, circular, card, tableRow, kpi
 */
export function Skeleton({
  variant = 'rectangular', // 'text' | 'rectangular' | 'circular' | 'card' | 'tableRow' | 'kpi'
  width,
  height,
  className = '',
  count = 1,
}) {
  const baseClasses = 'animate-pulse bg-pm-subtle border border-pm-borderSubtle/40 rounded';

  if (variant === 'kpi') {
    return (
      <div className="p-4 bg-pm-surface border border-pm-border rounded-md animate-pulse flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="h-3 w-24 bg-pm-borderSubtle rounded" />
          <div className="h-4 w-4 bg-pm-borderSubtle rounded-full" />
        </div>
        <div className="h-7 w-32 bg-pm-borderSubtle rounded" />
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-16 bg-pm-borderSubtle rounded" />
          <div className="h-3 w-20 bg-pm-borderSubtle rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'tableRow') {
    return (
      <div className="flex items-center gap-4 py-3 px-4 border-b border-pm-borderSubtle animate-pulse">
        <div className="h-3.5 w-20 bg-pm-borderSubtle rounded" />
        <div className="h-3.5 w-40 bg-pm-borderSubtle rounded flex-1" />
        <div className="h-3.5 w-16 bg-pm-borderSubtle rounded" />
        <div className="h-3.5 w-16 bg-pm-borderSubtle rounded" />
        <div className="h-3.5 w-12 bg-pm-borderSubtle rounded" />
      </div>
    );
  }

  const elements = Array.from({ length: count });

  return (
    <>
      {elements.map((_, i) => (
        <div
          key={i}
          className={cn(
            baseClasses,
            variant === 'text' && 'h-3.5 w-full my-1 rounded-sm',
            variant === 'circular' && 'rounded-full flex-shrink-0',
            className
          )}
          style={{
            width: width,
            height: height,
          }}
        />
      ))}
    </>
  );
}

export default Skeleton;
