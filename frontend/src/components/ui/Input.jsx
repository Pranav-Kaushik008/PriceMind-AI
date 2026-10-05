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
    sm: 'h-8 text-xs px-3',
    md: 'h-9 text-xs px-3.5',
    lg: 'h-10 text-sm px-4',
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-slate-300 flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-rose-400 text-[11px]">*</span>}
        </label>
      )}

      <div
        className={cn(
          'relative flex items-center bg-[#131D31]/90 border rounded-xl transition-all duration-200 shadow-inner',
          error
            ? 'border-rose-500/60 text-rose-300 focus-within:ring-1 focus-within:ring-rose-500/50'
            : 'border-white/[0.08] hover:border-white/[0.16] focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/40',
          disabled && 'opacity-50 cursor-not-allowed bg-white/[0.02]',
          className
        )}
      >
        {Icon && iconPosition === 'left' && (
          <div className="pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}

        {prefix && (
          <span className="pl-3 text-xs text-slate-400 font-mono select-none">
            {prefix}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed font-sans text-xs',
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
          <span className="pr-3 text-xs text-slate-400 font-mono select-none">
            {suffix}
          </span>
        )}

        {Icon && iconPosition === 'right' && !error && (
          <div className="pr-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}

        {error && (
          <div className="pr-3 flex items-center pointer-events-none text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p
          className={cn(
            'text-[11px] leading-tight',
            error ? 'text-rose-400 font-medium' : 'text-slate-400'
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
      <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'w-full bg-[#131D31]/90 border border-white/[0.08] hover:border-white/[0.16] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 rounded-xl text-xs text-white placeholder:text-slate-500 pl-8.5 pr-14 focus:outline-none transition-all duration-200 font-sans shadow-inner',
          size === 'sm' ? 'h-8' : size === 'lg' ? 'h-10 text-sm' : 'h-9'
        )}
        {...props}
      />
      <div className="absolute right-2.5 flex items-center gap-1">
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none cursor-pointer hover:bg-white/[0.05]"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {shortcut && !hasValue && (
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded-md">
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
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-slate-300 flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-rose-400 text-[11px]">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full bg-[#131D31]/90 border rounded-xl p-3 text-xs text-white placeholder:text-slate-500 font-sans focus:outline-none transition-all duration-200 resize-y shadow-inner',
          error
            ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-500/50'
            : 'border-white/[0.08] hover:border-white/[0.16] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40',
          disabled && 'opacity-50 cursor-not-allowed bg-white/[0.02]',
          inputClassName
        )}
        {...props}
      />

      {(error || helperText) && (
        <p
          className={cn(
            'text-[11px] leading-tight',
            error ? 'text-rose-400 font-medium' : 'text-slate-400'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
