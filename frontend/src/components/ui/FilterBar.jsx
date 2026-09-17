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
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all duration-150 cursor-pointer select-none border',
        active
          ? 'bg-pm-accentBg text-pm-accentText border-pm-accentBorder font-medium'
          : 'bg-pm-surface text-pm-textSecondary hover:text-pm-text border-pm-border hover:border-pm-borderStrong',
        className
      )}
    >
      <span>{label}</span>
      {value && <span className="font-semibold text-pm-text">{value}</span>}
      {count !== undefined && (
        <span className="text-[10px] font-mono px-1 py-0.2 bg-pm-subtle border border-pm-borderSubtle rounded text-pm-textDim">
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
          className="text-pm-textDim hover:text-pm-text ml-0.5 p-0.5 rounded cursor-pointer"
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
        'flex flex-wrap items-center justify-between gap-3 p-3 bg-pm-surface border border-pm-border rounded-md shadow-sm',
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
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
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
            className="inline-flex items-center gap-1 text-xs text-pm-textDim hover:text-pm-text px-2 py-1 rounded transition-colors cursor-pointer"
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
