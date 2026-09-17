import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Tabs Component
 * Variants:
 * - 'segmented' (terminal button group style)
 * - 'underline' (financial portal header tabs)
 * - 'pills' (compact filter pills)
 */
export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'segmented',
  size = 'md',
  className = '',
}) {
  const containerVariants = {
    segmented: 'inline-flex items-center bg-pm-subtle border border-pm-border rounded p-0.5 gap-0.5',
    underline: 'flex items-center border-b border-pm-border gap-6 w-full',
    pills: 'flex items-center gap-1.5 flex-wrap',
  };

  const sizes = {
    sm: 'text-xs py-1 px-2.5',
    md: 'text-xs py-1.5 px-3 font-medium',
    lg: 'text-sm py-2 px-4 font-semibold',
  };

  return (
    <div className={cn(containerVariants[variant] || containerVariants.segmented, className)} role="tablist">
      {tabs.map((tab) => {
        const tabId = typeof tab === 'object' ? tab.id || tab.value : tab;
        const tabLabel = typeof tab === 'object' ? tab.label : tab;
        const tabBadge = typeof tab === 'object' ? tab.badge : null;
        const tabIcon = typeof tab === 'object' ? tab.icon : null;
        const Icon = tabIcon;
        const isActive = activeTab === tabId;

        if (variant === 'underline') {
          return (
            <button
              key={tabId}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tabId)}
              className={cn(
                'relative py-2.5 text-xs font-medium transition-all duration-150 flex items-center gap-2 cursor-pointer select-none focus:outline-none -mb-px',
                isActive
                  ? 'text-pm-text font-semibold border-b-2 border-pm-accent'
                  : 'text-pm-textMuted hover:text-pm-text border-b-2 border-transparent'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tabLabel}</span>
              {tabBadge !== null && tabBadge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded-full',
                    isActive ? 'bg-pm-accent text-white' : 'bg-pm-subtle text-pm-textDim border border-pm-borderSubtle'
                  )}
                >
                  {tabBadge}
                </span>
              )}
            </button>
          );
        }

        if (variant === 'pills') {
          return (
            <button
              key={tabId}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tabId)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded text-xs font-medium transition-all duration-150 cursor-pointer select-none border focus:outline-none',
                sizes[size] || sizes.md,
                isActive
                  ? 'bg-pm-accent text-white border-pm-accent shadow-sm'
                  : 'bg-pm-surface text-pm-textSecondary hover:text-pm-text border-pm-border hover:border-pm-borderStrong'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tabLabel}</span>
              {tabBadge !== null && tabBadge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded',
                    isActive ? 'bg-white/20 text-white' : 'bg-pm-subtle text-pm-textDim'
                  )}
                >
                  {tabBadge}
                </span>
              )}
            </button>
          );
        }

        // Segmented Terminal Style (Default)
        return (
          <button
            key={tabId}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tabId)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded text-xs font-medium transition-all duration-150 cursor-pointer select-none focus:outline-none',
              sizes[size] || sizes.md,
              isActive
                ? 'bg-pm-elevated text-pm-text font-semibold shadow-sm border border-pm-borderStrong'
                : 'text-pm-textDim hover:text-pm-text border border-transparent'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tabLabel}</span>
            {tabBadge !== null && tabBadge !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.2 rounded',
                  isActive ? 'bg-pm-accentBg text-pm-accentText' : 'text-pm-textDim'
                )}
              >
                {tabBadge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
