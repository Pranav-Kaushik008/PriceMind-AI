import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Zap,
  ChevronDown,
  Building2,
  Check,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StatusDot } from '../ui/StatusIndicator';
import { DataImportModal } from '../ui/DataImportModal';

/**
 * Enterprise Top Bar Component
 * Minimal, institutional pricing command center header.
 */
export function Header() {
  const {
    theme,
    toggleTheme,
    setCommandPaletteOpen,
    activeWorkspace,
    setActiveWorkspace,
    workspaces,
    user,
    authUser,
    logout,
    notifications,
    notificationsCount,
    markAllNotificationsRead,
    setActivePage,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useAppStore();

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const wsRef = useRef(null);
  const userRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wsRef.current && !wsRef.current.contains(event.target)) setIsWorkspaceOpen(false);
      if (userRef.current && !userRef.current.contains(event.target)) setIsUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentWs = workspaces.find((w) => w.id === activeWorkspace) || workspaces[0];

  return (
    <header className="h-13 bg-[#090D16]/90 backdrop-blur-xl border-b border-white/[0.08] px-3 sm:px-5 flex items-center justify-between gap-3 select-none z-30 font-sans sticky top-0">
      {/* Left: Mobile Menu Toggle & Brand / Workspace Selector */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Branding Logo & Name */}
        <div
          onClick={() => setActivePage('overview')}
          className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-transform group-hover:scale-105">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-bold text-xs tracking-wider text-white font-mono">PRICEMIND</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/40 font-bold uppercase">
              AI
            </span>
          </div>
        </div>

        <div className="hidden sm:block h-4 w-px bg-white/[0.08]" />

        {/* Workspace Selector */}
        <div className="relative" ref={wsRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceOpen((prev) => !prev)}
            className="flex items-center gap-2 h-8 px-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] hover:border-white/[0.16] rounded-lg text-xs transition-all cursor-pointer select-none max-w-[200px] sm:max-w-[240px]"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="truncate font-medium text-slate-200 text-[11px]">
              {currentWs.name}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform ${
                isWorkspaceOpen ? 'rotate-180 text-indigo-400' : ''
              }`}
            />
          </button>

          {isWorkspaceOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-[#0F1624]/95 backdrop-blur-xl border border-white/[0.12] rounded-xl shadow-2xl z-50 py-1.5 font-sans overflow-hidden">
              <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
                Workspaces & Environments
              </div>
              <div className="py-1">
                {workspaces.map((ws) => {
                  const isSelected = ws.id === activeWorkspace;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        setActiveWorkspace(ws.id);
                        setIsWorkspaceOpen(false);
                      }}
                      className={`flex items-start justify-between w-full px-3.5 py-2 text-left text-xs transition-all cursor-pointer ${
                        isSelected ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-medium text-xs truncate">{ws.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {ws.region} • <span className="uppercase">{ws.env}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-slate-400">
                          {ws.badge}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Input Button with Keyboard Shortcut */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between h-8 px-3.5 rounded-lg bg-white/[0.05] border border-white/[0.10] hover:border-indigo-500/40 hover:bg-white/[0.08] text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="font-mono text-[11px] truncate">Search SKUs, Elasticity, Competitors...</span>
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white/[0.06] rounded-md border border-white/[0.10] text-slate-400">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Search (⌘K)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Import CSV / Data Quick Action */}
        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.10] hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Import CSV</span>
        </button>

        {/* AI Copilot Quick Action */}
        <button
          type="button"
          onClick={() => setActivePage('assistant')}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 text-[11px] font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] hover:shadow-[0_0_20px_rgba(99,102,241,0.55)] transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-white" />
          <span>Copilot</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#0F1624]/95 backdrop-blur-xl border border-white/[0.12] rounded-xl shadow-2xl z-50 font-sans overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08]">
                <span className="text-xs font-semibold text-white">Telemetry Alerts</span>
                {notificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.06]">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 text-xs transition-colors hover:bg-white/[0.04] ${
                      n.unread ? 'bg-white/[0.02]' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-slate-100 text-[11px] truncate">{n.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="h-5 w-px bg-white/[0.08]" />

        {/* User Menu Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer select-none"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-[11px] text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]">
              {user.initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0F1624]/95 backdrop-blur-xl border border-white/[0.12] rounded-xl shadow-2xl z-50 py-1.5 font-sans overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.08]">
                <div className="font-semibold text-xs text-white truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{user.email}</div>
                {authUser?.organization_name && (
                  <div className="text-[10px] text-indigo-400 font-medium truncate mt-1">
                    {authUser.organization_name}
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] text-slate-300">{user.role}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => { setActivePage('settings'); setIsUserMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Platform Settings & Guardrails</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActivePage('models'); setIsUserMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Model Governance</span>
                </button>
              </div>

              <div className="border-t border-white/[0.08] pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => { setIsUserMenuOpen(false); logout(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Ingestion Modal */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          // Trigger catalog refresh
          window.location.reload();
        }}
      />
    </header>
  );
}

export default Header;
