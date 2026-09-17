import React, { forwardRef, useState } from 'react';
import { Search, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Form Input Components
 * - Input (Text / Password / Email)
 * - SearchInput (with hotkey badge & clear button)
 * - NumberInput (with currency/pct prefixes and stepper controls)
 * - TextArea
 */

export const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    prefix,
    suffix,
    disabled = false,
    className = '',
    inputClassName = '',
    containerClassName = '',
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || (label ? `pm-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const sizes = {
    sm: 'h-7 text-xs px-2.5',
    md: 'h-8 text-xs px-3',
    lg: 'h-9 text-sm px-3.5',
  };

  return (
    <div className={cn('flex flex-col gap-1 w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-pm-textSecondary flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-pm-negativeText text-[11px]">*</span>}
        </label>
      )}

      <div
        className={cn(
          'relative flex items-center bg-pm-surface border rounded transition-all duration-150',
          error
            ? 'border-pm-negative text-pm-negative focus-within:ring-1 focus-within:ring-pm-negative'
            : 'border-pm-border hover:border-pm-borderStrong focus-within:border-pm-accent focus-within:ring-1 focus-within:ring-pm-accent',
          disabled && 'opacity-50 cursor-not-allowed bg-pm-subtle',
          className
        )}
      >
        {Icon && iconPosition === 'left' && (
          <div className="pl-2.5 flex items-center pointer-events-none text-pm-textDim">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}

        {prefix && (
          <span className="pl-2.5 text-xs text-pm-textDim font-mono select-none">
            {prefix}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full bg-transparent text-pm-text placeholder:text-pm-textDim focus:outline-none disabled:cursor-not-allowed font-sans',
            sizes[size] || sizes.md,
            Icon && iconPosition === 'left' && 'pl-2',
            Icon && iconPosition === 'right' && 'pr-2',
            prefix && 'pl-1.5',
            suffix && 'pr-1.5',
            inputClassName
          )}
          {...props}
        />

        {suffix && (
          <span className="pr-2.5 text-xs text-pm-textDim font-mono select-none">
            {suffix}
          </span>
        )}

        {Icon && iconPosition === 'right' && !error && (
          <div className="pr-2.5 flex items-center pointer-events-none text-pm-textDim">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}

        {error && (
          <div className="pr-2.5 flex items-center pointer-events-none text-pm-negativeText">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p
          className={cn(
            'text-[11px] leading-tight',
            error ? 'text-pm-negativeText font-medium' : 'text-pm-textDim'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    onChange,
    onClear,
    placeholder = 'Search SKUs, categories, or metrics...',
    shortcut = '⌘K',
    size = 'md',
    className = '',
    ...props
  },
  ref
) {
  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-2.5 w-3.5 h-3.5 text-pm-textDim pointer-events-none" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'w-full bg-pm-surface border border-pm-border hover:border-pm-borderStrong focus:border-pm-accent focus:ring-1 focus:ring-pm-accent rounded text-xs text-pm-text placeholder:text-pm-textDim pl-8 pr-14 focus:outline-none transition-all duration-150',
          size === 'sm' ? 'h-7' : size === 'lg' ? 'h-9 text-sm' : 'h-8'
        )}
        {...props}
      />
      <div className="absolute right-2 flex items-center gap-1">
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-pm-textDim hover:text-pm-text p-0.5 rounded focus:outline-none cursor-pointer"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {shortcut && !hasValue && (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-pm-textDim bg-pm-subtle border border-pm-borderSubtle rounded">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
});

export const NumberInput = forwardRef(function NumberInput(
  {
    value,
    onChange,
    min,
    max,
    step = 1,
    prefix,
    suffix,
    precision = 2,
    className = '',
    ...props
  },
  ref
) {
  return (
    <Input
      ref={ref}
      type="number"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      prefix={prefix}
      suffix={suffix}
      inputClassName="font-mono tabular-nums"
      className={className}
      {...props}
    />
  );
});

export const TextArea = forwardRef(function TextArea(
  {
    label,
    helperText,
    error,
    rows = 3,
    disabled = false,
    className = '',
    inputClassName = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `pm-textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-pm-textSecondary flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-pm-negativeText text-[11px]">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full bg-pm-surface border rounded p-2.5 text-xs text-pm-text placeholder:text-pm-textDim font-sans focus:outline-none transition-all duration-150 resize-y',
          error
            ? 'border-pm-negative focus:ring-1 focus:ring-pm-negative'
            : 'border-pm-border hover:border-pm-borderStrong focus:border-pm-accent focus:ring-1 focus:ring-pm-accent',
          disabled && 'opacity-50 cursor-not-allowed bg-pm-subtle',
          inputClassName
        )}
        {...props}
      />

      {(error || helperText) && (
        <p
          className={cn(
            'text-[11px] leading-tight',
            error ? 'text-pm-negativeText font-medium' : 'text-pm-textDim'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
