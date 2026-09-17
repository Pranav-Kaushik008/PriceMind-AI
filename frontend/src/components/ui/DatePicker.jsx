import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Date Range Picker
 * Standard institutional presets: 24h, 7D, 30D, 90D, YTD, QTD, Custom
 */
export function DateRangePicker({
  value = '30d',
  onChange,
  startDate,
  endDate,
  onCustomChange,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const presets = [
    { id: '24h', label: 'Last 24 Hours', shortLabel: '24H' },
    { id: '7d', label: 'Last 7 Days', shortLabel: '7D' },
    { id: '30d', label: 'Last 30 Days', shortLabel: '30D' },
    { id: '90d', label: 'Last 90 Days (Quarter)', shortLabel: '90D' },
    { id: 'qtd', label: 'Quarter to Date', shortLabel: 'QTD' },
    { id: 'ytd', label: 'Year to Date', shortLabel: 'YTD' },
    { id: 'custom', label: 'Custom Range...', shortLabel: 'Custom' },
  ];

  const currentPreset = presets.find((p) => p.id === value) || presets[2];

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={cn('relative inline-flex', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 h-8 px-2.5 bg-pm-surface hover:bg-pm-hover text-pm-text border border-pm-border hover:border-pm-borderStrong rounded text-xs font-medium transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-pm-accent"
      >
        <Calendar className="w-3.5 h-3.5 text-pm-textDim" />
        <span>{currentPreset.label}</span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-pm-textDim transition-transform duration-150', isOpen && 'rotate-180 text-pm-accent')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-60 bg-pm-elevated border border-pm-borderStrong rounded shadow-lg z-50 py-1 font-sans text-xs animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pm-textDim border-b border-pm-borderSubtle">
            Select Horizon
          </div>

          <div className="py-1">
            {presets.map((preset) => {
              const isSelected = value === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onChange(preset.id);
                    if (preset.id !== 'custom') setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-1.5 text-left transition-colors cursor-pointer select-none',
                    isSelected
                      ? 'bg-pm-accentBg text-pm-accent font-semibold'
                      : 'text-pm-textSecondary hover:text-pm-text hover:bg-pm-hover'
                  )}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-pm-accent" />}
                </button>
              );
            })}
          </div>

          {value === 'custom' && (
            <div className="p-3 border-t border-pm-borderSubtle bg-pm-subtle flex flex-col gap-2">
              <div className="text-[11px] font-medium text-pm-textSecondary">Custom Range</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-pm-textDim block mb-0.5">Start</label>
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => onCustomChange && onCustomChange({ startDate: e.target.value, endDate })}
                    className="w-full bg-pm-surface border border-pm-border rounded px-1.5 py-1 text-[11px] text-pm-text font-mono focus:outline-none focus:border-pm-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-pm-textDim block mb-0.5">End</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => onCustomChange && onCustomChange({ startDate, endDate: e.target.value })}
                    className="w-full bg-pm-surface border border-pm-border rounded px-1.5 py-1 text-[11px] text-pm-text font-mono focus:outline-none focus:border-pm-accent"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-1 w-full py-1 bg-pm-accent text-white rounded text-[11px] font-medium hover:bg-pm-accentHover transition-colors cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
