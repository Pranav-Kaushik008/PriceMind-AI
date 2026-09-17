import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Filter, Layers } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { RecommendationCard } from './RecommendationCard';
import { Button } from './Button';
import { Tabs } from './Tabs';
import { EmptyState } from './EmptyState';

/**
 * Enterprise Recommendation Panel
 * Organizes pricing recommendations by urgency/category with batch approval support.
 */
export function RecommendationPanel({
  recommendations = [],
  currency = 'USD',
  onApprove,
  onReject,
  onOpenEvidence,
  onApproveAll,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('all');

  const pendingRecs = recommendations.filter((r) => r.status === 'pending');
  const immediateRecs = recommendations.filter((r) => r.urgency === 'immediate');

  const filteredRecs = recommendations.filter((rec) => {
    if (activeTab === 'pending') return rec.status === 'pending';
    if (activeTab === 'immediate') return rec.urgency === 'immediate';
    if (activeTab === 'approved') return rec.status === 'approved';
    return true;
  });

  const totalPendingLift = pendingRecs.reduce((sum, r) => sum + (r.projectedRevenueDelta || 0), 0);

  const tabs = [
    { id: 'all', label: 'All Items', badge: recommendations.length },
    { id: 'immediate', label: 'Immediate Action', badge: immediateRecs.length },
    { id: 'pending', label: 'Pending Review', badge: pendingRecs.length },
    { id: 'approved', label: 'Approved' },
  ];

  return (
    <div className={cn('flex flex-col gap-4 w-full font-sans', className)}>
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-pm-surface border border-pm-border rounded-md p-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-pm-accentBg border border-pm-accentBorder flex items-center justify-center text-pm-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-pm-text">
              Active Optimization Recommendations
            </h3>
            <p className="text-[11px] text-pm-textDim">
              Model-driven price elasticity opportunities awaiting analyst validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onApproveAll && pendingRecs.length > 0 && (
            <Button
              variant="positive"
              size="xs"
              icon={CheckCircle2}
              onClick={onApproveAll}
            >
              Approve All Pending ({pendingRecs.length}) • +{formatCurrency(totalPendingLift, currency, true)}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="segmented"
        size="sm"
      />

      {/* Cards Grid */}
      {filteredRecs.length === 0 ? (
        <EmptyState
          title="No recommendations found"
          description="All price adjustments in this segment have been resolved or are within target margins."
          compact
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              currency={currency}
              onApprove={onApprove}
              onReject={onReject}
              onOpenEvidence={onOpenEvidence}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RecommendationPanel;
