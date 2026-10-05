import React, { useState } from 'react';
import { Download, Maximize2, Minimize2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { Modal } from './Modal';

/**
 * Enterprise Analytical Chart Container
 * Provides standardized chart headers, time grain switchers, metric selectors,
 * CSV export hooks, fullscreen inspection mode, and legend footers.
 */
export function AnalyticalChartContainer({
  title,
  subtitle,
  children,
  timeGrains,
  activeGrain,
  onGrainChange,
  metrics,
  activeMetric,
  onMetricChange,
  legend,
  onExportCSV,
  tooltipExplanation,
  actions,
  className = '',
  minHeight = 'min-h-[260px]',
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const renderHeader = (isModal = false) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08] mb-3">
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-white tracking-tight font-sans">
            {title}
          </h3>
          {tooltipExplanation && (
            <Tooltip content={tooltipExplanation} position="top">
              <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            </Tooltip>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {/* Metric Selector Tabs */}
        {metrics && (
          <div className="flex bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.08]">
            {metrics.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onMetricChange?.(m.id)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer select-none',
                  activeMetric === m.id
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Time Grain selector */}
        {timeGrains && (
          <div className="flex bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.08]">
            {timeGrains.map((grain) => (
              <button
                key={grain}
                type="button"
                onClick={() => onGrainChange?.(grain)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-mono rounded-md transition-all cursor-pointer uppercase select-none',
                  activeGrain === grain
                    ? 'bg-indigo-600 text-white font-semibold shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {grain}
              </button>
            ))}
          </div>
        )}

        {/* CSV Export */}
        {onExportCSV && (
          <button
            type="button"
            onClick={onExportCSV}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-all cursor-pointer"
            title="Export chart dataset (.CSV)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Fullscreen Expand */}
        {!isModal && (
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-all cursor-pointer"
            title="Expand chart inspection"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {actions}
      </div>
    </div>
  );

  return (
    <>
      <div className={cn('bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 flex flex-col shadow-lg font-sans', className)}>
        {renderHeader(false)}

        <div className={cn('flex-1 w-full relative', minHeight)}>
          {children}
        </div>

        {legend && (
          <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            {legend}
          </div>
        )}
      </div>

      {/* Fullscreen Inspection Modal */}
      {isFullscreen && (
        <Modal
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          title={`Detailed Telemetry: ${title}`}
          subtitle={subtitle}
          size="full"
        >
          <div className="h-[60vh] w-full pt-2">
            {children}
          </div>
        </Modal>
      )}
    </>
  );
}

export default AnalyticalChartContainer;
