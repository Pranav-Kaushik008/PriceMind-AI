import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

/**
 * Enterprise Module Shell
 * Standardized layout frame for every analytical module in PriceMind AI.
 */
export function ModuleShell({
  breadcrumb = [],
  title,
  description,
  badge,
  actions,
  primaryAction,
  secondaryActions,
  filterArea,
  children,
  className = '',
}) {
  const { setActivePage } = useAppStore();

  return (
    <div className={cn('flex flex-col gap-6 w-full font-sans max-w-7xl mx-auto', className)}>
      {/* Module Header Section */}
      <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.07]">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <button
            type="button"
            onClick={() => setActivePage('overview')}
            className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span>PriceMind</span>
          </button>

          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              {crumb.onClick ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={idx === breadcrumb.length - 1 ? 'text-white font-medium' : 'text-slate-300'}>
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
              <h1 className="text-xl font-bold text-white font-sans tracking-tight">
                {title}
              </h1>
              {badge && <div>{badge}</div>}
            </div>
            {description && (
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Action Triggers */}
          {(actions || primaryAction || secondaryActions) && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
              {actions}
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
