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

  const workspaceNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, tooltip: 'Executive performance, revenue trajectory & top actions' },
    { id: 'pricing', label: 'Pricing', icon: Tag, badge: queuedRecommendations.length > 0 ? `${queuedRecommendations.length}` : null, tooltip: 'Suggested prices, elasticity & optimization' },
    { id: 'products', label: 'Products', icon: Package, tooltip: 'Product catalog, margins & SKU performance' },
    { id: 'demand', label: 'Demand', icon: TrendingUp, tooltip: 'Demand prediction & price sensitivity curves' },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, tooltip: 'Revenue, profit & category contributions' },
    { id: 'customers', label: 'Customers', icon: Users, tooltip: 'Customer tiers & willingness-to-pay segments' },
    { id: 'inventory', label: 'Inventory', icon: Boxes, tooltip: 'Stock runway, holding costs & markdown planning' },
    { id: 'competitors', label: 'Competitors', icon: ShieldAlert, tooltip: 'Competitor price tracking & market position' },
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

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;

    const buttonContent = (
      <button
        type="button"
        onClick={() => setActivePage(item.id)}
        className={cn(
          'w-full flex items-center gap-2.5 rounded-lg text-xs transition-all duration-150 group cursor-pointer text-left border relative overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500',
          isSidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 justify-between',
          isActive
            ? 'bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent text-white font-semibold border-indigo-500/30 shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border-transparent'
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-r shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={cn(
              'w-4 h-4 flex-shrink-0 transition-all duration-150',
              isActive ? 'text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)] scale-105' : 'text-slate-400 group-hover:text-slate-200'
            )}
          />
          {!isSidebarCollapsed && (
            <span className={cn('truncate text-xs tracking-wide', isActive ? 'text-white font-medium' : 'text-slate-300 font-normal')}>
              {item.label}
            </span>
          )}
        </div>

        {!isSidebarCollapsed && item.badge && (
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

    if (isSidebarCollapsed || item.tooltip) {
      return (
        <Tooltip key={item.id} content={isSidebarCollapsed ? item.label : item.tooltip} position="right" delay={200}>
          {buttonContent}
        </Tooltip>
      );
    }

    return <div key={item.id}>{buttonContent}</div>;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#090D16]/95 backdrop-blur-xl border-r border-white/[0.07] font-sans select-none">
      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
        {/* Workspace */}
        <div>
          {!isSidebarCollapsed && (
            <span className="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Workspace
            </span>
          )}
          <div className="space-y-1">
            {workspaceNav.map(renderNavItem)}
          </div>
        </div>

        {/* Analysis */}
        <div className="pt-2.5 border-t border-white/[0.06]">
          {!isSidebarCollapsed && (
            <span className="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Analysis
            </span>
          )}
          <div className="space-y-1">
            {analysisNav.map(renderNavItem)}
          </div>
        </div>

        {/* Models & System */}
        <div className="pt-2.5 border-t border-white/[0.06]">
          {!isSidebarCollapsed && (
            <span className="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Models & System
            </span>
          )}
          <div className="space-y-1">
            {systemNav.map(renderNavItem)}
          </div>
        </div>
      </div>

      {/* Collapse & Status Footer */}
      <div className="p-2.5 border-t border-white/[0.07] bg-[#0B101D]/80 flex items-center justify-between backdrop-blur-md">
        {!isSidebarCollapsed ? (
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
