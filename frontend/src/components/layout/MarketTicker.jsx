import React from 'react';
import { Activity, Radio, RefreshCw, Zap } from 'lucide-react';

export function MarketTicker() {
  return (
    <div className="bg-pm-darkest border-b border-pm-borderSubtle px-4 py-1.5 flex items-center justify-between text-[11px] font-mono select-none text-pm-textDim overflow-x-auto whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-pm-lift">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pm-lift opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pm-lift"></span>
          </span>
          <span className="font-semibold uppercase tracking-wider text-pm-text">SYSTEM LIVE</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-pm-textMuted">PORTFOLIO ELASTICITY:</span>
          <span className="text-pm-text font-bold">-1.34 (Optimal Zone)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-pm-textMuted">COMPETITOR RADAR:</span>
          <span className="text-pm-lift font-bold">100% Monitored (242 SKUs)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-pm-textMuted">MARGIN RUN-RATE:</span>
          <span className="text-pm-lift font-bold">41.8% (+140 bps)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-pm-textMuted">QUEUE:</span>
          <span className="text-pm-accentLight font-bold">18 Actions (+$864K Lift)</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 text-pm-textDim">
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 text-pm-accent" />
          Scrape Sync: 2m ago
        </span>
        <span>ERP Gateway: Connected</span>
      </div>
    </div>
  );
}
