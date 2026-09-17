import React from 'react';
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
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';

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

  const primaryNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pricing', label: 'Pricing', icon: Tag, badge: queuedRecommendations.length > 0 ? `${queuedRecommendations.length}` : null },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'demand', label: 'Demand', icon: TrendingUp },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'competitors', label: 'Competitors', icon: ShieldAlert },
    { id: 'simulator', label: 'Simulator', icon: Sliders },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, badge: 'Agent' },
  ];

  const secondaryNav = [
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;

    const buttonContent = (
      <button
        type="button"
        onClick={() => setActivePage(item.id)}
        className={cn(
          'w-full flex items-center gap-2.5 rounded text-xs transition-colors group cursor-pointer text-left border focus:outline-none focus-visible:ring-1 focus-visible:ring-pm-accent',
          isSidebarCollapsed ? 'justify-center p-2' : 'px-2.5 py-1.5 justify-between',
          isActive
            ? 'bg-pm-elevated text-pm-text font-semibold border-pm-borderStrong shadow-sm'
            : 'text-pm-textSecondary hover:text-pm-text hover:bg-pm-hover border-transparent'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={cn(
              'w-4 h-4 flex-shrink-0 transition-colors',
              isActive ? 'text-pm-accent' : 'text-pm-textDim group-hover:text-pm-textSecondary'
            )}
          />
          {!isSidebarCollapsed && (
            <span className="truncate text-xs font-medium">{item.label}</span>
          )}
        </div>

        {!isSidebarCollapsed && item.badge && (
          <span
            className={cn(
              'text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold flex-shrink-0',
              isActive
                ? 'bg-pm-accentBg text-pm-accentText border border-pm-accentBorder'
                : 'bg-pm-surface text-pm-textDim border border-pm-borderSubtle'
            )}
          >
            {item.badge}
          </span>
        )}
      </button>
    );

    if (isSidebarCollapsed) {
      return (
        <Tooltip key={item.id} content={item.label} position="right" delay={100}>
          {buttonContent}
        </Tooltip>
      );
    }

    return <div key={item.id}>{buttonContent}</div>;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-pm-subtle border-r border-pm-border font-sans select-none">
      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div>
          {!isSidebarCollapsed && (
            <span className="px-2 text-[9px] font-mono font-bold uppercase tracking-wider text-pm-textDim block mb-1">
              Primary
            </span>
          )}
          <div className="space-y-0.5">
            {primaryNav.map(renderNavItem)}
          </div>
        </div>

        <div className="pt-2 border-t border-pm-borderSubtle">
          {!isSidebarCollapsed && (
            <span className="px-2 text-[9px] font-mono font-bold uppercase tracking-wider text-pm-textDim block mb-1">
              System & Registry
            </span>
          )}
          <div className="space-y-0.5">
            {secondaryNav.map(renderNavItem)}
          </div>
        </div>
      </div>

      {/* Collapse & Status Footer */}
      <div className="p-2 border-t border-pm-border bg-pm-surface flex items-center justify-between">
        {!isSidebarCollapsed ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-pm-positive flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-mono text-pm-textSecondary truncate block">
                  Engine Online
                </span>
                <span className="text-[9px] font-mono text-pm-textDim truncate block">
                  v1.4.2-prod
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="p-1 rounded text-pm-textDim hover:text-pm-text hover:bg-pm-hover transition-colors cursor-pointer border border-transparent hover:border-pm-border"
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
              className="p-1 rounded text-pm-textDim hover:text-pm-text hover:bg-pm-hover transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 h-full transition-all duration-200 ease-in-out',
          isSidebarCollapsed ? 'w-14' : 'w-56'
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
                className="p-1 text-pm-textDim hover:text-pm-text rounded hover:bg-pm-hover"
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
