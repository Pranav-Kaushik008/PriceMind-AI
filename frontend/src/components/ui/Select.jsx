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
    sm: 'h-7 text-xs px-2.5',
    md: 'h-8 text-xs px-3',
    lg: 'h-9 text-sm px-3.5',
  };

  return (
    <div className={cn('flex flex-col gap-1 relative w-full', containerClassName)} ref={containerRef}>
      {label && (
        <label className="text-xs font-medium text-pm-textSecondary">
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
          'flex items-center justify-between w-full bg-pm-surface border rounded text-left transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-pm-accent',
          error
            ? 'border-pm-negative text-pm-negative'
            : isOpen
            ? 'border-pm-accent ring-1 ring-pm-accent'
            : 'border-pm-border hover:border-pm-borderStrong',
          disabled && 'opacity-50 cursor-not-allowed bg-pm-subtle',
          sizes[size] || sizes.md,
          className
        )}
      >
        <span className={cn('truncate', !selectedLabel ? 'text-pm-textDim' : 'text-pm-text font-medium')}>
          {selectedLabel || placeholder}
        </span>

        <div className="flex items-center gap-1 pl-2 text-pm-textDim">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="hover:text-pm-text p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={cn('w-3.5 h-3.5 transition-transform duration-150', isOpen && 'rotate-180 text-pm-accent')}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 w-full bg-pm-elevated border border-pm-borderStrong rounded shadow-md z-50 py-1 max-h-60 overflow-y-auto"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-pm-textDim text-center">No options available</div>
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
                    'flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors duration-100 select-none',
                    isSelected
                      ? 'bg-pm-accentBg text-pm-accent font-semibold'
                      : 'text-pm-text hover:bg-pm-hover'
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{optLabel}</span>
                    {optSub && <span className="text-[10px] text-pm-textDim truncate">{optSub}</span>}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {optBadge && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-pm-subtle border border-pm-border rounded text-pm-textDim">
                        {optBadge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-pm-accent" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {(error || helperText) && (
        <p className={cn('text-[11px]', error ? 'text-pm-negativeText' : 'text-pm-textDim')}>
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
  ...props
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'appearance-none bg-pm-surface border border-pm-border hover:border-pm-borderStrong text-pm-text font-sans rounded pl-2.5 pr-7 focus:outline-none focus:border-pm-accent focus:ring-1 focus:ring-pm-accent transition-all duration-150 cursor-pointer disabled:opacity-50',
          size === 'xs' ? 'h-6 text-[11px]' : size === 'sm' ? 'h-7 text-xs' : 'h-8 text-xs',
          className
        )}
        {...props}
      >
        {options.map((opt, i) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={i} value={val} className="bg-pm-elevated text-pm-text">
              {lbl}
            </option>
          );
        })}
      </select>
      <ChevronDown className="absolute right-2 w-3.5 h-3.5 text-pm-textDim pointer-events-none" />
    </div>
  );
}

export default Select;
