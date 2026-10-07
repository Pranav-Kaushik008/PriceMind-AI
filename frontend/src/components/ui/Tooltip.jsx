import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

/**
 * Enterprise Tooltip Component
 * Uses fixed positioning so it is never clipped by parent overflow:hidden/auto.
 * Supports: top, bottom, left, right positions.
 * Keyboard focus accessible, delay customizable, Esc to dismiss.
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
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const computePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const GAP = 8;
    let x = 0;
    let y = 0;
    if (position === 'right') {
      x = rect.right + GAP;
      y = rect.top + rect.height / 2;
    } else if (position === 'left') {
      x = rect.left - GAP;
      y = rect.top + rect.height / 2;
    } else if (position === 'bottom') {
      x = rect.left + rect.width / 2;
      y = rect.bottom + GAP;
    } else {
      // top (default)
      x = rect.left + rect.width / 2;
      y = rect.top - GAP;
    }
    setCoords({ x, y });
  };

  const showTooltip = () => {
    if (disabled || !content) return;
    computePosition();
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isVisible) setIsVisible(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible]);

  // CSS transform to anchor the tooltip bubble to the correct edge
  const getTransform = () => {
    if (position === 'right')  return 'translateY(-50%)';
    if (position === 'left')   return 'translateY(-50%) translateX(-100%)';
    if (position === 'bottom') return 'translateX(-50%)';
    return 'translateX(-50%) translateY(-100%)'; // top
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-flex w-full"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible && content && (
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: getTransform(),
            zIndex: 9999,
          }}
          className={cn(
            'px-3 py-1.5 bg-[#1a2035] text-slate-100 border border-slate-600/60',
            'rounded-lg shadow-2xl text-xs leading-snug font-sans pointer-events-none whitespace-nowrap',
            maxWidth,
            className
          )}
        >
          {content}
        </div>
      )}
    </>
  );
}

export default Tooltip;
