import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

/**
 * Enterprise Error State Component
 * Provides clear diagnosis, error code, retry mechanism, and collapsible technical logs.
 */
export function ErrorState({
  title = 'Data Pipeline Exception',
  message = 'Failed to load telemetry and price recommendations from the optimization backend.',
  errorCode = 'ERR_PRICING_INFERENCE_TIMEOUT',
  errorDetails,
  onRetry,
  compact = false,
  className = '',
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `${errorCode}: ${message}\n\n${typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : errorDetails || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border border-pm-negativeBorder bg-pm-negativeBg p-5 font-sans',
        compact && 'p-3.5',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded bg-pm-negative/20 border border-pm-negative/30 text-pm-negativeText flex-shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-semibold text-pm-text">
              {title}
            </h4>
            {errorCode && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-pm-surface border border-pm-negativeBorder text-pm-negativeText rounded">
                {errorCode}
              </span>
            )}
          </div>

          <p className="text-xs text-pm-textSecondary mt-1 leading-relaxed">
            {message}
          </p>

          <div className="flex items-center gap-2 mt-3.5 flex-wrap">
            {onRetry && (
              <Button
                variant="negative"
                size="sm"
                onClick={onRetry}
                icon={RefreshCw}
              >
                Retry Request
              </Button>
            )}

            {errorDetails && (
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs text-pm-textMuted hover:text-pm-text px-2 py-1 rounded transition-colors cursor-pointer"
              >
                <span>{showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}</span>
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {showDetails && errorDetails && (
            <div className="mt-3 p-3 bg-pm-app border border-pm-border rounded text-[11px] font-mono text-pm-textMuted relative overflow-x-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 text-pm-textDim hover:text-pm-text p-1 rounded hover:bg-pm-surface transition-colors cursor-pointer"
                title="Copy error details"
              >
                {copied ? <Check className="w-3 h-3 text-pm-positive" /> : <Copy className="w-3 h-3" />}
              </button>
              <pre className="whitespace-pre-wrap pr-6">
                {typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : String(errorDetails)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
