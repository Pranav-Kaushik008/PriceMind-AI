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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pm-borderSubtle mb-3">
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-pm-text tracking-tight font-sans">
            {title}
          </h3>
          {tooltipExplanation && (
            <Tooltip content={tooltipExplanation} position="top">
              <Info className="w-3.5 h-3.5 text-pm-textDim hover:text-pm-textSecondary cursor-help" />
            </Tooltip>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-pm-textDim mt-0.5 font-sans">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {/* Metric Selector Tabs */}
        {metrics && (
          <div className="flex bg-pm-subtle p-0.5 rounded border border-pm-border">
            {metrics.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onMetricChange?.(m.id)}
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded transition-all cursor-pointer select-none',
                  activeMetric === m.id
                    ? 'bg-pm-elevated text-pm-text font-semibold shadow-sm border border-pm-borderStrong'
                    : 'text-pm-textDim hover:text-pm-text'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Time Grain selector */}
        {timeGrains && (
          <div className="flex bg-pm-subtle p-0.5 rounded border border-pm-border">
            {timeGrains.map((grain) => (
              <button
                key={grain}
                type="button"
                onClick={() => onGrainChange?.(grain)}
                className={cn(
                  'px-2 py-0.5 text-[11px] font-mono rounded transition-all cursor-pointer uppercase select-none',
                  activeGrain === grain
                    ? 'bg-pm-accent text-white font-semibold'
                    : 'text-pm-textDim hover:text-pm-text'
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
            className="p-1 rounded text-pm-textDim hover:text-pm-text hover:bg-pm-hover border border-pm-border transition-colors cursor-pointer"
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
            className="p-1 rounded text-pm-textDim hover:text-pm-text hover:bg-pm-hover border border-pm-border transition-colors cursor-pointer"
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
      <div className={cn('bg-pm-surface border border-pm-border rounded-md p-4 flex flex-col shadow-sm font-sans', className)}>
        {renderHeader(false)}

        <div className={cn('flex-1 w-full relative', minHeight)}>
          {children}
        </div>

        {legend && (
          <div className="mt-3 pt-2.5 border-t border-pm-borderSubtle flex items-center justify-between text-[11px] text-pm-textDim flex-wrap gap-2">
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
