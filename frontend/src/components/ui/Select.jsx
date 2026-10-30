import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Select Component
 * Keyboard-navigable, searchable, customizable trigger and options list.
 * Pass searchable={true} to enable a search input for large option lists.
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
  searchable = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

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

  // Keyboard navigation + clear search on close
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!isOpen) setSearchQuery('');
  }, [isOpen, searchable]);

  const selectedOption = options.find((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return String(opt.value) === String(value);
    }
    return String(opt) === String(value);
  });
  const selectedLabel = selectedOption ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : null;

  // Filter options by search query when searchable
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const lbl = typeof opt === 'object' ? opt.label : opt;
      const sub = typeof opt === 'object' ? (opt.subtext || '') : '';
      return String(lbl).toLowerCase().includes(q) || String(sub).toLowerCase().includes(q);
    }).slice(0, 200); // cap rendered options for perf
  }, [options, searchQuery, searchable]);

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
          className="absolute top-full left-0 mt-1 min-w-full w-max max-w-[min(100vw-2rem,36rem)] bg-[#0D1524]/95 backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-2xl z-50 flex flex-col"
          style={{ maxHeight: '18rem' }}
        >
          {/* Search input for large lists */}
          {searchable && (
            <div className="px-2 pt-2 pb-1 border-b border-white/[0.08] flex-shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.05] rounded-lg px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to filter..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none min-w-0"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-[10px] text-slate-500 mt-1 px-0.5">{filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto flex-1 py-1.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-slate-500 text-center">No matching options</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                const optSub = typeof opt === 'object' ? opt.subtext : null;
                const optBadge = typeof opt === 'object' ? opt.badge : null;
                const isSelected = String(optVal) === String(value);

                return (
                  <div
                    key={idx}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(optVal);
                      setIsOpen(false);
                      setSearchQuery('');
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
  const handleChange = (e) => {
    if (!onChange) return;
    // Standard React SyntheticEvent with convenient direct .value property
    e.value = e.target.value;
    onChange(e);
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={handleChange}
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
