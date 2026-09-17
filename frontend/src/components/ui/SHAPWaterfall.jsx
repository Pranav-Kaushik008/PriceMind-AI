import React from 'react';
import { ArrowUpRight, ArrowDownRight, Sparkles, Cpu } from 'lucide-react';
import { cn, formatPercent } from '../../lib/utils';

/**
 * Enterprise SHAP Waterfall / Feature Attribution Component
 */
export function SHAPWaterfall({
  attributions = [],
  title = 'Model Feature Attribution (SHAP)',
  modelName = 'LightGBM-Spline v3.4',
  className = '',
}) {
  if (!attributions || attributions.length === 0) return null;

  return (
    <div className={cn('bg-pm-surface border border-pm-border rounded-md p-4 font-sans shadow-sm', className)}>
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-pm-borderSubtle">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-pm-accent" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-pm-text">
            {title}
          </h4>
        </div>
        <span className="text-[10px] font-mono text-pm-textDim">{modelName}</span>
      </div>

      <div className="space-y-3">
        {attributions.map((attr, idx) => {
          const isPositive = attr.impactPercent > 0;
          const absVal = Math.abs(attr.impactPercent);
          const maxImpact = Math.max(...attributions.map((a) => Math.abs(a.impactPercent)), 5);
          const widthPct = Math.min(100, (absVal / maxImpact) * 100);

          return (
            <div key={idx} className="group/shap">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-pm-textSecondary truncate max-w-[280px] flex items-center gap-1.5">
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-pm-positiveText flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-pm-negativeText flex-shrink-0" />
                  )}
                  {attr.feature}
                </span>
                <span
                  className={cn(
                    'font-mono font-semibold tabular-nums text-xs',
                    isPositive ? 'text-pm-positiveText' : 'text-pm-negativeText'
                  )}
                >
                  {formatPercent(attr.impactPercent, true)}
                </span>
              </div>

              {/* Driver Bar */}
              <div className="w-full bg-pm-subtle h-1.5 rounded-full overflow-hidden flex items-center border border-pm-borderSubtle">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isPositive ? 'bg-pm-positive' : 'bg-pm-negative'
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>

              {attr.description && (
                <p className="text-[11px] text-pm-textDim mt-0.5 pl-5 leading-normal">
                  {attr.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SHAPWaterfall;
