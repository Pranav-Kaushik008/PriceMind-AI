import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Drawer / Slide-Over Component
 * Sides: right, left
 * Widths: sm (380px), md (480px), lg (640px), xl (800px), full
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  side = 'right',
  width = 'md',
  className = '',
  showCloseButton = true,
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={cn('fixed inset-y-0 flex max-w-full', side === 'right' ? 'right-0' : 'left-0')}>
        <div
          ref={drawerRef}
          className={cn(
            'w-screen bg-[#0D1524]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl flex flex-col z-10 transition-transform transform duration-200 ease-out',
            widthClasses[width] || widthClasses.md,
            side === 'right' ? 'animate-in slide-in-from-right' : 'animate-in slide-in-from-left',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="min-w-0 pr-4">
              {title && (
                <h3 className="text-sm font-bold text-white font-sans truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5 truncate font-mono">
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-colors cursor-pointer flex-shrink-0"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-300 font-sans custom-scrollbar">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Drawer;
