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
        className="inline-flex items-center gap-2 h-8 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] hover:border-white/[0.16] rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 shadow-sm"
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
        <span>{currentPreset.label}</span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180 text-indigo-400')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0D1524]/95 backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-2xl z-50 py-1.5 font-sans text-xs animate-in fade-in zoom-in-95">
          <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
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
                    'flex items-center justify-between w-full px-3.5 py-2 text-left transition-colors cursor-pointer select-none mx-1 rounded-lg',
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  )}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>

          {value === 'custom' && (
            <div className="p-3.5 border-t border-white/[0.08] bg-white/[0.02] flex flex-col gap-2.5">
              <div className="text-[11px] font-medium text-slate-300">Custom Range</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Start</label>
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => onCustomChange && onCustomChange({ startDate: e.target.value, endDate })}
                    className="w-full bg-[#131D31] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">End</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => onCustomChange && onCustomChange({ startDate, endDate: e.target.value })}
                    className="w-full bg-[#131D31] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-1 w-full py-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-lg text-xs font-semibold hover:from-indigo-600 hover:to-cyan-600 transition-colors cursor-pointer shadow-[0_0_12px_rgba(99,102,241,0.3)]"
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
