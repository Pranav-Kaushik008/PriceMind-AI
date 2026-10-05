import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { NativeSelect } from './Select';

/**
 * Enterprise Financial Data Table
 * High density, sortable columns, tabular numbers, pagination, row selection, density toggle.
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match your query.',
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  defaultSortField,
  defaultSortDirection = 'asc',
  density: initialDensity = 'standard', // 'compact' | 'standard' | 'relaxed'
  stickyHeader = true,
  className = '',
}) {
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [density, setDensity] = useState(initialDensity);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedRows.includes(row[keyField]));

  const densityPadding = {
    compact: 'py-1.5 px-3 text-xs',
    standard: 'py-2.5 px-3.5 text-xs',
    relaxed: 'py-3.5 px-4 text-xs',
  };

  return (
    <div className={cn('flex flex-col w-full bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-lg overflow-hidden font-sans', className)}>
      {/* Table Scroll Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead className={cn('bg-white/[0.02] border-b border-white/[0.08]', stickyHeader && 'sticky top-0 z-10 backdrop-blur-md')}>
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked ? paginatedData.map((r) => r[keyField]) : [])}
                    className="rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"
                    aria-label="Select all rows on page"
                  />
                </th>
              )}

              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                const isCurrentSort = sortField === col.accessor || sortField === col.id;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.id || col.accessor}
                    className={cn(
                      'px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none whitespace-nowrap',
                      alignClass,
                      col.headerClassName
                    )}
                    style={{ width: col.width }}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.accessor || col.id)}
                        className={cn(
                          'inline-flex items-center gap-1 hover:text-white transition-colors focus:outline-none cursor-pointer',
                          alignClass === 'text-right' && 'ml-auto'
                        )}
                      >
                        <span>{col.header}</span>
                        {isCurrentSort ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && (
                    <td className="px-3 py-3 text-center">
                      <div className="w-3.5 h-3.5 bg-white/[0.05] rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, idx) => (
                    <td key={idx} className="px-4 py-3.5">
                      <div className="h-3.5 bg-white/[0.05] rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    compact
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const rowKey = row[keyField] || rowIdx;
                const isSelected = selectedRows.includes(rowKey);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'transition-colors duration-150',
                      isSelected ? 'bg-indigo-500/10' : 'hover:bg-white/[0.03]',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {selectable && (
                      <td
                        className="w-10 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow && onSelectRow(rowKey)}
                          className="rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"
                          aria-label={`Select row ${rowKey}`}
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const cellValue = col.accessor ? row[col.accessor] : null;
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      const isTabular =
                        col.align === 'right' || col.tabular !== false;

                      return (
                        <td
                          key={col.id || col.accessor}
                          className={cn(
                            densityPadding[density] || densityPadding.standard,
                            'text-slate-300 whitespace-nowrap',
                            alignClass,
                            isTabular && 'tabular-nums font-mono',
                            col.className
                          )}
                        >
                          {col.cell ? col.cell({ row, value: cellValue, index: rowIdx }) : cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Density Controls Footer */}
      {pagination && !loading && sortedData.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white/[0.02] border-t border-white/[0.08] text-xs text-slate-400">
          {/* Row selection summary & page size */}
          <div className="flex items-center gap-3">
            {selectable && (
              <span className="font-mono text-slate-300">
                {selectedRows.length} of {data.length} selected
              </span>
            )}

            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <NativeSelect
                value={pageSize}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={pageSizeOptions.map((n) => ({ value: n, label: String(n) }))}
                size="xs"
              />
            </div>
          </div>

          {/* Page nav buttons */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400">
              Page <span className="text-white font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span> ({sortedData.length} items)
            </span>

            <div className="inline-flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
