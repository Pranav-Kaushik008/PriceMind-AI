import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Drawer } from './Drawer';
import { EvidencePanel } from './EvidencePanel';
import { Button } from './Button';

/**
 * Enterprise Evidence Drawer
 * Slide-over drawer wrapping the comprehensive EvidencePanel with action buttons.
 */
export function EvidenceDrawer({
  recommendation,
  elasticityCurve = [],
  currency = 'USD',
  onClose,
  onApprove,
  onReject,
}) {
  if (!recommendation) return null;

  return (
    <Drawer
      isOpen={Boolean(recommendation)}
      onClose={onClose}
      title={`Model Evidence: ${recommendation.skuCode}`}
      subtitle={`${recommendation.skuName} • ${recommendation.category}`}
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReject(recommendation.id);
                  onClose();
                }}
                className="text-pm-negativeText border-pm-negativeBorder hover:bg-pm-negativeBg"
              >
                Reject Action
              </Button>
            )}

            {onApprove && (
              <Button
                variant="positive"
                size="sm"
                icon={CheckCircle2}
                onClick={() => {
                  onApprove(recommendation.id);
                  onClose();
                }}
              >
                Approve & Deploy Price
              </Button>
            )}
          </div>
        </div>
      }
    >
      <EvidencePanel
        recommendation={recommendation}
        elasticityCurve={elasticityCurve}
        currency={currency}
      />
    </Drawer>
  );
}

export default EvidenceDrawer;
