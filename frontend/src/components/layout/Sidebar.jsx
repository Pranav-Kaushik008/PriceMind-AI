import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Tag,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Boxes,
  ShieldAlert,
  Sliders,
  Bot,
  Cpu,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  ScanEye,
  GripVertical,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';

const MIN_SIDEBAR_WIDTH = 64; // Collapsed icon-only mode
const DEFAULT_EXPANDED_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 340;

export function Sidebar() {
  const {
    activePage,
    setActivePage,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    queuedRecommendations,
  } = useAppStore();

  const [sidebarWidth, setSidebarWidth] = useState(
    isSidebarCollapsed ? MIN_SIDEBAR_WIDTH : DEFAULT_EXPANDED_WIDTH
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isEdgeHovered, setIsEdgeHovered] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const sidebarRef = useRef(null);

  // Sync width when collapsed state changes via other triggers
  useEffect(() => {
    if (isSidebarCollapsed) {
      setSidebarWidth(MIN_SIDEBAR_WIDTH);
    } else {
      setSidebarWidth((prev) => (prev <= MIN_SIDEBAR_WIDTH ? DEFAULT_EXPANDED_WIDTH : prev));
    }
  }, [isSidebarCollapsed]);

  // ── Drag Resizer Logic ───────────────────────────────────────────────────────
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        let newWidth = e.clientX;
        if (newWidth < 120) {
          newWidth = MIN_SIDEBAR_WIDTH;
          if (!isSidebarCollapsed) toggleSidebarCollapsed();
        } else {
          if (newWidth > MAX_SIDEBAR_WIDTH) newWidth = MAX_SIDEBAR_WIDTH;
          if (isSidebarCollapsed) toggleSidebarCollapsed();
        }
        setSidebarWidth(newWidth);
      }
    },
    [isResizing, isSidebarCollapsed, toggleSidebarCollapsed]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  const workspaceNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, tooltip: 'Executive performance, revenue trajectory & top actions' },
    { id: 'pricing', label: 'Pricing', icon: Tag, badge: queuedRecommendations.length > 0 ? `${queuedRecommendations.length}` : null, tooltip: 'Suggested prices, elasticity & optimization' },
    { id: 'products', label: 'Products', icon: Package, tooltip: 'Product catalog, margins & SKU performance' },
    { id: 'demand', label: 'Demand', icon: TrendingUp, tooltip: 'Demand prediction & price sensitivity curves' },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, tooltip: 'Revenue, profit & category contributions' },
    { id: 'customers', label: 'Customers', icon: Users, tooltip: 'Customer tiers & willingness-to-pay segments' },
    { id: 'inventory', label: 'Inventory', icon: Boxes, tooltip: 'Stock runway, holding costs & markdown planning' },
    { id: 'competitors', label: 'Competitors', icon: ShieldAlert, tooltip: 'Competitor price tracking & market position' },
    { id: 'vision', label: 'Visual Intelligence', icon: ScanEye, badge: 'New', tooltip: 'In-store shelf scanning, OCR & competitor price extraction' },
  ];

  const analysisNav = [
    { id: 'simulator', label: 'Pricing Simulator', icon: Sliders, tooltip: 'Simulate scenario outcomes & what-if pricing tests' },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, badge: 'Copilot', tooltip: 'Ask natural-language pricing questions & get insights' },
  ];

  const systemNav = [
    { id: 'models', label: 'Models', icon: Cpu, tooltip: 'ML models, versions & accuracy metrics' },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, tooltip: 'A/B pricing tests & model evaluation' },
    { id: 'settings', label: 'Settings', icon: Settings, tooltip: 'Pricing guardrails, policies & preferences' },
  ];

  const effectivelyCollapsed = isSidebarCollapsed && !isHoverExpanded;

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;

    const buttonContent = (
      <button
        type="button"
        onClick={() => setActivePage(item.id)}
        className={cn(
          'w-full flex items-center gap-2.5 rounded-lg text-xs transition-all duration-150 group cursor-pointer text-left border relative overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500',
          effectivelyCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 justify-between',
          isActive
            ? 'bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent text-white font-semibold border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
            : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border-transparent'
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-r shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={cn(
              'w-4 h-4 flex-shrink-0 transition-all duration-150',
              isActive
                ? 'text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)] scale-105'
                : 'text-slate-400 group-hover:text-slate-200'
            )}
          />
          {!effectivelyCollapsed && (
            <span
              className={cn(
                'truncate text-xs tracking-wide',
                isActive ? 'text-white font-medium' : 'text-slate-300 font-normal'
              )}
            >
              {item.label}
            </span>
          )}
        </div>

        {!effectivelyCollapsed && item.badge && (
          <span
            className={cn(
              'text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 uppercase tracking-wider',
              isActive
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                : 'bg-white/[0.06] text-slate-400 border border-white/[0.08]'
            )}
          >
            {item.badge}
          </span>
        )}
      </button>
    );

    if (effectivelyCollapsed || item.tooltip) {
      return (
        <Tooltip
          key={item.id}
          content={effectivelyCollapsed ? item.label : item.tooltip}
          position="right"
          delay={150}
        >
          {buttonContent}
        </Tooltip>
      );
    }

    return <div key={item.id}>{buttonContent}</div>;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#070B14] border-r border-white/[0.09] font-sans select-none relative shadow-2xl">
      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
        {/* Workspace */}
        <div>
          {!effectivelyCollapsed && (
            <span className="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Workspace
            </span>
          )}
          <div className="space-y-1">{workspaceNav.map(renderNavItem)}</div>
        </div>

        {/* Analysis */}
        <div className="pt-2.5 border-t border-white/[0.06]">
          {!effectivelyCollapsed && (
            <span className="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Analysis
            </span>
          )}
          <div className="space-y-1">{analysisNav.map(renderNavItem)}</div>
        </div>

        {/* Models & System */}
        <div className="pt-2.5 border-t border-white/[0.06]">
          {!effectivelyCollapsed && (
            <span className="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Models & System
            </span>
          )}
          <div className="space-y-1">{systemNav.map(renderNavItem)}</div>
        </div>
      </div>

      {/* Collapse & Status Footer */}
      <div className="p-2.5 border-t border-white/[0.08] bg-[#0A0E1A] flex items-center justify-between">
        {!effectivelyCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/30 animate-ping" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-slate-200 truncate block">
                  Engine Active
                </span>
                <span className="text-[9px] font-mono text-emerald-400/90 truncate block">
                  v1.4.2 · Production
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer border border-transparent hover:border-white/[0.08]"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          BORDER EDGE CONTRAST & EXPAND/COLLAPSE RESIZER HANDLE
          ─────────────────────────────────────────────────────────────────────── */}
      <div
        onMouseEnter={() => setIsEdgeHovered(true)}
        onMouseLeave={() => setIsEdgeHovered(false)}
        onMouseDown={startResizing}
        className={cn(
          'absolute top-0 right-0 w-3 h-full cursor-col-resize z-30 flex items-center justify-center translate-x-1.5 transition-colors',
          (isEdgeHovered || isResizing) && 'w-3.5'
        )}
        title="Drag to resize sidebar or click pill to toggle"
      >
        {/* Vertical Glowing Separator Line */}
        <div
          className={cn(
            'w-[1px] h-full transition-all duration-150',
            isResizing
              ? 'w-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]'
              : isEdgeHovered
              ? 'w-[2px] bg-indigo-400/80 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
              : 'bg-transparent'
          )}
        />

        {/* Floating Toggle Pill Button Centered Vertically on the Border Line */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebarCollapsed();
          }}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-5 h-7 rounded-full bg-[#0D1527] border border-white/[0.15] text-slate-300 hover:text-white hover:border-indigo-400/60 shadow-xl flex items-center justify-center transition-all cursor-pointer z-40',
            (isEdgeHovered || isResizing || isSidebarCollapsed)
              ? 'opacity-100 scale-100 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
              : 'opacity-40 hover:opacity-100 scale-95'
          )}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3 h-3 text-indigo-400" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-slate-300" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar with Resizable Width and Hover Contrast */}
      <aside
        ref={sidebarRef}
        style={{
          width: effectivelyCollapsed ? `${MIN_SIDEBAR_WIDTH}px` : `${sidebarWidth}px`,
        }}
        onMouseEnter={() => {
          if (isSidebarCollapsed) setIsHoverExpanded(true);
        }}
        onMouseLeave={() => {
          if (isSidebarCollapsed) setIsHoverExpanded(false);
        }}
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 h-full relative transition-[width] duration-200 ease-in-out z-20',
          isResizing && 'transition-none',
          effectivelyCollapsed ? 'w-16' : ''
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Responsive Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden flex">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity animate-in fade-in"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-drawer z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute top-2 right-2 z-20">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.08]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
