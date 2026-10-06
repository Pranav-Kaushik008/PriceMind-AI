import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Select Component
 * Keyboard-navigable, searchable, customizable trigger and options list.
 */
export function Select({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  helperText,
  error,
  disabled = false,
  size = 'md',
  className = '',
  containerClassName = '',
  clearable = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((opt) => (typeof opt === 'object' ? opt.value === value : opt === value));
  const selectedLabel = selectedOption ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : null;

  const sizes = {
    sm: 'h-8 text-xs px-3',
    md: 'h-9 text-xs px-3.5',
    lg: 'h-10 text-sm px-4',
  };

  return (
    <div className={cn('flex flex-col gap-1.5 relative w-full', containerClassName)} ref={containerRef}>
      {label && (
        <label className="text-xs font-medium text-slate-300">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center justify-between w-full bg-[#131D31]/90 border rounded-xl text-left transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 shadow-inner',
          error
            ? 'border-rose-500/60 text-rose-300'
            : isOpen
            ? 'border-indigo-500/60 ring-1 ring-indigo-500/40'
            : 'border-white/[0.08] hover:border-white/[0.16]',
          disabled && 'opacity-50 cursor-not-allowed bg-white/[0.02]',
          sizes[size] || sizes.md,
          className
        )}
      >
        <span className={cn('truncate', !selectedLabel ? 'text-slate-500' : 'text-white font-medium')}>
          {selectedLabel || placeholder}
        </span>

        <div className="flex items-center gap-1 pl-2 text-slate-400">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="hover:text-white p-0.5 rounded-lg hover:bg-white/[0.05]"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={cn('w-3.5 h-3.5 transition-transform duration-200', isOpen && 'rotate-180 text-indigo-400')}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 w-full bg-[#0D1524]/95 backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto custom-scrollbar"
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-2 text-xs text-slate-500 text-center">No options available</div>
          ) : (
            options.map((opt, idx) => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const optSub = typeof opt === 'object' ? opt.subtext : null;
              const optBadge = typeof opt === 'object' ? opt.badge : null;
              const isSelected = optVal === value;

              return (
                <div
                  key={idx}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(optVal);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition-colors duration-150 select-none mx-1 rounded-lg',
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                      : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{optLabel}</span>
                    {optSub && <span className="text-[10px] text-slate-400 truncate">{optSub}</span>}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {optBadge && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full text-slate-400">
                        {optBadge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {(error || helperText) && (
        <p className={cn('text-[11px]', error ? 'text-rose-400 font-medium' : 'text-slate-400')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Lightweight Native Select for ultra-compact forms / table headers
 */
export function NativeSelect({
  options = [],
  value,
  onChange,
  label,
  disabled = false,
  size = 'sm',
  className = '',
  children,
  ...props
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'appearance-none bg-[#131D31]/90 border border-white/[0.08] hover:border-white/[0.16] text-white font-sans rounded-lg pl-3 pr-8 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200 cursor-pointer disabled:opacity-50 text-xs shadow-inner min-w-[180px]',
          size === 'xs' ? 'h-7 text-[11px]' : size === 'sm' ? 'h-8 text-xs' : 'h-9 text-xs',
          className
        )}
        {...props}
      >
        {children
          ? children
          : options.map((opt, i) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={i} value={val} className="bg-slate-900 text-white">
                  {lbl}
                </option>
              );
            })}
      </select>
      <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

export default Select;
