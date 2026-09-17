import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from './Tooltip';

/**
 * Enterprise Confidence Indicator
 * Used in ML inference, price elasticity recommendations, and demand forecasting.
 */
export function ConfidenceIndicator({
  score = 85, // 0 to 100 or float 0 to 1
  sampleSize,
  reliabilityTier, // 'high' | 'medium' | 'low'
  showBar = true,
  showBadge = true,
  showDetails = true,
  size = 'md',
  className = '',
}) {
  // Normalize score to 0-100
  const normalizedScore = score <= 1 ? Math.round(score * 100) : Math.round(score);

  let tier = reliabilityTier;
  if (!tier) {
    if (normalizedScore >= 80) tier = 'high';
    else if (normalizedScore >= 60) tier = 'medium';
    else tier = 'low';
  }

  const tierConfigs = {
    high: {
      label: 'High Confidence',
      badgeClass: 'bg-pm-positiveBg text-pm-positiveText border-pm-positiveBorder',
      barColor: 'bg-pm-positive',
      icon: ShieldCheck,
      desc: 'High statistical power & dense historical transaction volume.',
    },
    medium: {
      label: 'Moderate',
      badgeClass: 'bg-pm-warningBg text-pm-warningText border-pm-warningBorder',
      barColor: 'bg-pm-warning',
      icon: Shield,
      desc: 'Moderate data coverage. Subject to market volatility band.',
    },
    low: {
      label: 'Low Sample',
      badgeClass: 'bg-pm-negativeBg text-pm-negativeText border-pm-negativeBorder',
      barColor: 'bg-pm-negative',
      icon: ShieldAlert,
      desc: 'Sparse sample size or high competitor divergence.',
    },
  };

  const config = tierConfigs[tier] || tierConfigs.medium;
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex flex-col gap-1 font-sans', className)}>
      <div className="flex items-center gap-2">
        {showBadge && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold font-mono border',
              config.badgeClass
            )}
          >
            <Icon className="w-3 h-3" />
            <span>{normalizedScore}%</span>
          </span>
        )}

        {showDetails && (
          <span className="text-xs text-pm-textSecondary font-medium">
            {config.label}
          </span>
        )}

        <Tooltip content={config.desc} position="top">
          <Info className="w-3 h-3 text-pm-textDim hover:text-pm-textSecondary cursor-help" />
        </Tooltip>
      </div>

      {showBar && (
        <div className="w-full min-w-[80px] h-1 bg-pm-subtle border border-pm-borderSubtle rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', config.barColor)}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
      )}

      {sampleSize && (
        <span className="text-[10px] font-mono text-pm-textDim">
          N = {sampleSize.toLocaleString()} observations
        </span>
      )}
    </div>
  );
}

export default ConfidenceIndicator;
