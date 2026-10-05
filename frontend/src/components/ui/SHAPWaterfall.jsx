import React from 'react';
import { ArrowUpRight, ArrowDownRight, Sparkles, Cpu } from 'lucide-react';
import { cn, formatPercent } from '../../lib/utils';

/**
 * Enterprise SHAP Waterfall / Feature Attribution Component
 */
export function SHAPWaterfall({
  attributions = [],
  shapContributions,
  title = 'Model Feature Attribution (TreeSHAP)',
  modelName = 'LightGBM-Spline v3.4',
  className = '',
}) {
  const data = shapContributions || attributions || [];
  if (!data || data.length === 0) return null;

  return (
    <div className={cn('bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 font-sans shadow-lg', className)}>
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
            {title}
          </h4>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.08]">{modelName}</span>
      </div>

      <div className="space-y-3.5">
        {data.map((attr, idx) => {
          const impactVal = attr.impactPercent ?? attr.impact ?? attr.weight ?? 0;
          const isPositive = impactVal > 0;
          const absVal = Math.abs(impactVal);
          const maxImpact = Math.max(...data.map((a) => Math.abs(a.impactPercent ?? a.impact ?? a.weight ?? 0)), 5);
          const widthPct = Math.min(100, (absVal / maxImpact) * 100);

          return (
            <div key={idx} className="group/shap">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-300 truncate max-w-[280px] flex items-center gap-1.5">
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  )}
                  {attr.feature || attr.factor || attr.name}
                </span>
                <span
                  className={cn(
                    'font-mono font-semibold tabular-nums text-xs',
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {formatPercent(impactVal, true)}
                </span>
              </div>

              {/* Driver Bar */}
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden flex items-center border border-white/[0.06]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 shadow-sm',
                    isPositive ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>

              {(attr.description || attr.desc) && (
                <p className="text-[11px] text-slate-500 mt-1 pl-5 leading-normal">
                  {attr.description || attr.desc}
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
