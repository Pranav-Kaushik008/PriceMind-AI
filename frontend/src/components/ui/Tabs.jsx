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
    segmented: 'inline-flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl p-1 gap-1',
    underline: 'flex items-center border-b border-white/[0.08] gap-6 w-full',
    pills: 'flex items-center gap-2 flex-wrap',
  };

  const sizes = {
    sm: 'text-xs py-1 px-3',
    md: 'text-xs py-1.5 px-3.5 font-medium',
    lg: 'text-sm py-2 px-4.5 font-semibold',
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
                  ? 'text-white font-semibold border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-white border-b-2 border-transparent'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tabLabel}</span>
              {tabBadge !== null && tabBadge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full',
                    isActive ? 'bg-indigo-500 text-white' : 'bg-white/[0.05] text-slate-400 border border-white/[0.08]'
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
                'inline-flex items-center gap-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer select-none border focus:outline-none',
                sizes[size] || sizes.md,
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.08] hover:border-white/[0.16]'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tabLabel}</span>
              {tabBadge !== null && tabBadge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-indigo-500/40 text-indigo-200' : 'bg-white/[0.08] text-slate-400'
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
              'inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer select-none focus:outline-none',
              sizes[size] || sizes.md,
              isActive
                ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white border border-transparent'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tabLabel}</span>
            {tabBadge !== null && tabBadge !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-indigo-500/30 text-indigo-200' : 'text-slate-500'
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
