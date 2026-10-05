import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SearchInput } from './Input';
import { NativeSelect } from './Select';

/**
 * Filter Pill Component
 */
export function FilterPill({
  label,
  value,
  active = false,
  onClick,
  onClear,
  count,
  className = '',
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-150 cursor-pointer select-none border font-medium',
        active
          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
          : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.08] hover:border-white/[0.16]',
        className
      )}
    >
      <span>{label}</span>
      {value && <span className="font-semibold text-white">{value}</span>}
      {count !== undefined && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/[0.08] border border-white/[0.08] rounded-full text-slate-400">
          {count}
        </span>
      )}
      {active && onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-slate-400 hover:text-white ml-0.5 p-0.5 rounded-full cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Enterprise Filter Bar
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = 'Filter records...',
  categories = [],
  activeCategory,
  onCategoryChange,
  filters = [],
  activeFiltersCount = 0,
  onResetFilters,
  children,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-lg',
        className
      )}
    >
      {/* Search & Category Tabs */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        <div className="w-64 max-w-full">
          <SearchInput
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={onSearchClear}
            placeholder={searchPlaceholder}
            size="sm"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {categories.map((cat) => {
              const catId = typeof cat === 'object' ? cat.id : cat;
              const catLabel = typeof cat === 'object' ? cat.label : cat;
              const catCount = typeof cat === 'object' ? cat.count : undefined;
              const isActive = activeCategory === catId;

              return (
                <FilterPill
                  key={catId}
                  label={catLabel}
                  active={isActive}
                  count={catCount}
                  onClick={() => onCategoryChange && onCategoryChange(catId)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Extra custom controls & reset button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {children}

        {activeFiltersCount > 0 && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.16] bg-white/[0.02] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({activeFiltersCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
