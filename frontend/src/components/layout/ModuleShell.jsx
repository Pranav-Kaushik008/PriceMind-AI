import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

/**
 * Enterprise Module Shell
 * Standardized layout frame for every analytical module in PriceMind AI.
 * Implements hierarchy through spacing, typography, and restrained separators (avoiding card wrap overload).
 */
export function ModuleShell({
  breadcrumb = [],
  title,
  description,
  badge,
  primaryAction,
  secondaryActions,
  filterArea,
  children,
  className = '',
}) {
  const { setActivePage } = useAppStore();

  return (
    <div className={cn('flex flex-col gap-5 w-full font-sans max-w-7xl mx-auto', className)}>
      {/* Module Header Section */}
      <div className="flex flex-col gap-3 pb-3 border-b border-pm-borderSubtle">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-mono text-pm-textDim">
          <button
            type="button"
            onClick={() => setActivePage('overview')}
            className="hover:text-pm-text flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Home className="w-3 h-3" />
            <span>PriceMind</span>
          </button>

          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-pm-textDim/60" />
              {crumb.onClick ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="hover:text-pm-text transition-colors cursor-pointer"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={idx === breadcrumb.length - 1 ? 'text-pm-text font-medium' : 'text-pm-textDim'}>
                  {crumb.label || crumb}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Title, Badge, Description & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-pm-text font-sans tracking-tight">
                {title}
              </h1>
              {badge && <div>{badge}</div>}
            </div>
            {description && (
              <p className="text-xs text-pm-textMuted mt-0.5 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Action Triggers */}
          {(primaryAction || secondaryActions) && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
              {secondaryActions}
              {primaryAction}
            </div>
          )}
        </div>

        {/* Filter Area Slot (if present) */}
        {filterArea && (
          <div className="pt-2">
            {filterArea}
          </div>
        )}
      </div>

      {/* Main Workspace Area */}
      <div className="flex flex-col gap-5 w-full">
        {children}
      </div>
    </div>
  );
}

export default ModuleShell;
