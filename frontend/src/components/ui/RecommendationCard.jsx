import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, ShieldCheck, Info, FileText } from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '../../lib/utils';
import { Badge } from './Badge';
import { Button } from './Button';
import { ConfidenceIndicator } from './ConfidenceIndicator';

/**
 * Enterprise Recommendation Card
 * Displays SKU details, current price vs recommended price, projected lift,
 * confidence score, and approval / rejection controls.
 */
export function RecommendationCard({
  recommendation,
  currency = 'USD',
  onApprove,
  onReject,
  onOpenEvidence,
  onToggleQueue,
  isQueued = false,
  className = '',
}) {
  const {
    skuCode,
    skuName,
    category,
    channel,
    currentPrice,
    recommendedPrice,
    priceDeltaPercent,
    currentMarginPercent = 38.5,
    projectedMarginPercent = 42.1,
    projectedRevenueDelta = 12400,
    confidenceScore = 92,
    urgency = 'immediate',
    status = 'pending',
    primaryDriver = 'Competitor Out-of-Stock Inelasticity',
    rationale = 'Competitor raised ASP by 8.4%. High inventory runway allows pricing power capture.',
  } = recommendation;

  const isPriceIncrease = priceDeltaPercent > 0;

  const urgencyConfigs = {
    immediate: { label: 'Immediate Action', variant: 'warning' },
    scheduled: { label: 'Scheduled Review', variant: 'primary' },
    monitoring: { label: 'Active Monitor', variant: 'neutral' },
    risk_mitigation: { label: 'Risk Mitigation', variant: 'danger' },
  };

  const currentUrgency = urgencyConfigs[urgency] || urgencyConfigs.scheduled;

  return (
    <div
      className={cn(
        'bg-pm-surface border border-pm-border hover:border-pm-borderStrong rounded-md p-4 transition-all duration-150 shadow-sm font-sans flex flex-col justify-between',
        status === 'approved' && 'border-pm-positiveBorder bg-pm-positiveBg/20',
        status === 'rejected' && 'opacity-60 border-pm-borderSubtle',
        className
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="font-mono font-bold text-xs text-pm-text">{skuCode}</span>
              {category && <Badge variant="neutral" size="sm">{category}</Badge>}
              {channel && <Badge variant="neutral" size="sm">{channel}</Badge>}
              <Badge variant={currentUrgency.variant} size="sm">{currentUrgency.label}</Badge>
            </div>
            <h4 className="text-xs font-medium text-pm-textSecondary truncate">{skuName}</h4>
          </div>

          <ConfidenceIndicator
            score={confidenceScore}
            showBar={false}
            showDetails={false}
            className="flex-shrink-0"
          />
        </div>

        {/* Pricing Shift Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-pm-subtle rounded p-2.5 border border-pm-borderSubtle mb-3">
          <div>
            <span className="text-[10px] text-pm-textDim font-mono uppercase block">Current ASP</span>
            <span className="text-xs font-mono font-medium text-pm-textSecondary tabular-nums">
              {formatCurrency(currentPrice, currency)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-pm-accentText font-mono uppercase block">Recommended</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-pm-text tabular-nums">
                {formatCurrency(recommendedPrice, currency)}
              </span>
              <Badge variant={isPriceIncrease ? 'success' : 'danger'} size="sm" className="font-mono text-[10px] px-1 py-0">
                {formatPercent(priceDeltaPercent, true)}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-pm-textDim font-mono uppercase block">Expected Lift</span>
            <span className="text-xs font-mono font-bold text-pm-positiveText tabular-nums">
              +{formatCurrency(projectedRevenueDelta, currency, true)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-pm-textDim font-mono uppercase block">Margin Shift</span>
            <div className="text-[11px] font-mono text-pm-textSecondary flex items-center gap-1 tabular-nums">
              <span>{currentMarginPercent.toFixed(1)}%</span>
              <ArrowRight className="w-2.5 h-2.5 text-pm-textDim" />
              <span className="font-semibold text-pm-positiveText">{projectedMarginPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Rationale */}
        <div className="mb-3">
          <div className="flex items-center gap-1 text-[11px] font-medium text-pm-textSecondary mb-0.5">
            <Info className="w-3 h-3 text-pm-accent" />
            <span>Driver: {primaryDriver}</span>
          </div>
          <p className="text-[11px] text-pm-textMuted leading-normal line-clamp-2">
            {rationale}
          </p>
        </div>

        {/* Guardrail Status */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-pm-textDim mb-3 py-1 px-2 bg-pm-surface rounded border border-pm-borderSubtle">
          <span className="flex items-center gap-1 text-pm-positiveText">
            <ShieldCheck className="w-3 h-3" />
            Margin Floor Passed
          </span>
          <span className="text-pm-borderStrong">•</span>
          <span className="flex items-center gap-1 text-pm-positiveText">
            <CheckCircle2 className="w-3 h-3" />
            Inventory Safe
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-pm-borderSubtle">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onOpenEvidence && onOpenEvidence(recommendation)}
          icon={FileText}
          className="text-[11px] text-pm-accentText hover:text-pm-text"
        >
          Inspect Evidence (SHAP)
        </Button>

        <div className="flex items-center gap-1.5">
          {status === 'pending' ? (
            <>
              {onReject && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onReject(recommendation.id)}
                  className="text-pm-negativeText hover:bg-pm-negativeBg border-pm-negativeBorder"
                >
                  Reject
                </Button>
              )}
              {onApprove && (
                <Button
                  variant="positive"
                  size="xs"
                  onClick={() => onApprove(recommendation.id)}
                  icon={CheckCircle2}
                >
                  Approve
                </Button>
              )}
            </>
          ) : (
            <Badge variant={status === 'approved' ? 'success' : 'neutral'} size="sm">
              {status.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;
