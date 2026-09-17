import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Tooltip Component
 * Supports: top, bottom, left, right positions
 * Keyboard focus accessible, delay customizable, esc to dismiss.
 */
export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
  maxWidth = 'max-w-xs',
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && content && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2.5 py-1.5 bg-pm-elevated text-pm-text border border-pm-borderStrong rounded shadow-lg text-xs leading-snug font-sans pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95',
            maxWidth,
            positionClasses[position] || positionClasses.top,
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
