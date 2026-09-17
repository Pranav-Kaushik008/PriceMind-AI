import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Dropdown Menu Component
 * Supports headers, items with icons, hotkeys, separators, destructive items.
 */
export function DropdownMenu({
  trigger,
  items = [],
  align = 'left', // 'left' | 'right'
  className = '',
  menuWidth = 'w-48',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setIsOpen((prev) => !prev)}>
        {typeof trigger === 'function' ? trigger({ isOpen }) : trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute mt-1.5 bg-pm-elevated border border-pm-borderStrong rounded shadow-lg z-50 py-1 font-sans animate-in fade-in zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0',
            menuWidth,
            className
          )}
        >
          {items.map((item, idx) => {
            if (item.type === 'separator' || item.separator) {
              return <div key={idx} className="h-px bg-pm-borderSubtle my-1" />;
            }

            if (item.type === 'header' || item.header) {
              return (
                <div
                  key={idx}
                  className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pm-textDim select-none"
                >
                  {item.label}
                </div>
              );
            }

            const Icon = item.icon;
            const isDestructive = item.destructive || item.variant === 'danger';

            return (
              <button
                key={idx}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-1.5 text-xs text-left transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer',
                  isDestructive
                    ? 'text-pm-negative hover:bg-pm-negativeBg'
                    : 'text-pm-textSecondary hover:text-pm-text hover:bg-pm-hover'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </div>

                {item.shortcut && (
                  <kbd className="text-[10px] font-mono text-pm-textDim bg-pm-subtle px-1.5 py-0.5 rounded border border-pm-borderSubtle">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;
