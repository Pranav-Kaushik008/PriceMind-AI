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
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StatusDot } from '../ui/StatusIndicator';

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
    <header className="h-12 bg-pm-surface border-b border-pm-border px-3 sm:px-4 flex items-center justify-between gap-3 select-none z-30 font-sans shadow-sm">
      {/* Left: Mobile Menu Toggle & Brand / Workspace Selector */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="lg:hidden p-1.5 rounded text-pm-textDim hover:text-pm-text hover:bg-pm-hover transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Branding Logo & Name */}
        <div
          onClick={() => setActivePage('overview')}
          className="flex items-center gap-2 cursor-pointer group flex-shrink-0 mr-1"
        >
          <div className="w-6 h-6 rounded bg-pm-accent flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-bold text-xs tracking-wider text-pm-text font-mono">PRICEMIND</span>
            <span className="text-[9px] font-mono px-1 py-0.2 bg-pm-accentBg text-pm-accentText rounded border border-pm-accentBorder font-semibold">
              AI
            </span>
          </div>
        </div>

        <div className="hidden sm:block h-4 w-px bg-pm-borderSubtle" />

        {/* Workspace Selector */}
        <div className="relative" ref={wsRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceOpen((prev) => !prev)}
            className="flex items-center gap-2 h-7 px-2 bg-pm-subtle hover:bg-pm-hover border border-pm-border hover:border-pm-borderStrong rounded text-xs transition-all cursor-pointer select-none max-w-[200px] sm:max-w-[240px]"
          >
            <Building2 className="w-3 h-3 text-pm-accent flex-shrink-0" />
            <span className="truncate font-medium text-pm-text text-[11px]">
              {currentWs.name}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-pm-textDim transition-transform ${
                isWorkspaceOpen ? 'rotate-180 text-pm-accent' : ''
              }`}
            />
          </button>

          {isWorkspaceOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-pm-elevated border border-pm-borderStrong rounded shadow-lg z-50 py-1 font-sans animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pm-textDim border-b border-pm-borderSubtle">
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
                      className={`flex items-start justify-between w-full px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        isSelected ? 'bg-pm-accentBg text-pm-accent' : 'text-pm-text hover:bg-pm-hover'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-medium text-xs truncate text-pm-text">{ws.name}</span>
                        <span className="text-[10px] text-pm-textDim font-mono mt-0.5">
                          {ws.region} • <span className="uppercase">{ws.env}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-pm-subtle border border-pm-borderSubtle text-pm-textDim">
                          {ws.badge}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-pm-accent" />}
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
      <div className="flex-1 max-w-md mx-2 hidden md:block">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between h-7 px-2.5 rounded bg-pm-subtle border border-pm-border hover:border-pm-borderStrong text-xs text-pm-textDim hover:text-pm-text transition-all cursor-pointer shadow-sm"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-pm-textDim flex-shrink-0" />
            <span className="font-mono text-[11px] truncate">Search SKUs, Elasticity, Competitors...</span>
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <kbd className="text-[10px] font-mono px-1.5 py-0.2 bg-pm-elevated rounded border border-pm-border text-pm-textDim">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Controls: Quick Search (Mobile), Copilot, Notifications, Theme, User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden p-1.5 rounded text-pm-textDim hover:text-pm-text hover:bg-pm-hover transition-colors cursor-pointer"
          title="Search (⌘K)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* AI Copilot Quick Action */}
        <Button
          variant="primary"
          size="xs"
          onClick={() => setActivePage('assistant')}
          icon={Zap}
          className="hidden sm:inline-flex text-[11px] font-mono font-semibold"
        >
          Copilot
        </Button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="p-1.5 rounded text-pm-textDim hover:text-pm-text hover:bg-pm-hover transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {notificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-pm-positive" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-pm-elevated border border-pm-borderStrong rounded shadow-lg z-50 font-sans animate-in fade-in zoom-in-95 overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-pm-border bg-pm-subtle">
                <span className="text-xs font-semibold text-pm-text">Telemetry Alerts</span>
                {notificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[10px] text-pm-accent hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-pm-borderSubtle">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-xs transition-colors hover:bg-pm-hover ${
                      n.unread ? 'bg-pm-surface' : 'opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-pm-text text-[11px] truncate">{n.title}</span>
                      <span className="text-[10px] font-mono text-pm-textDim flex-shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-pm-textSecondary leading-relaxed">{n.desc}</p>
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
          className="p-1.5 rounded text-pm-textDim hover:text-pm-text hover:bg-pm-hover transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <div className="h-4 w-px bg-pm-borderSubtle" />

        {/* User Menu Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 p-1 rounded hover:bg-pm-hover transition-colors cursor-pointer select-none"
          >
            <div className="w-6 h-6 rounded bg-pm-accentBg border border-pm-accentBorder flex items-center justify-center font-mono text-[10px] font-bold text-pm-accentText">
              {user.initials}
            </div>
            <ChevronDown className="w-3 h-3 text-pm-textDim hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-pm-elevated border border-pm-borderStrong rounded shadow-lg z-50 py-1 font-sans animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2.5 border-b border-pm-border bg-pm-subtle">
                <div className="font-semibold text-xs text-pm-text truncate">{user.name}</div>
                <div className="text-[10px] text-pm-textDim font-mono truncate">{user.email}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <StatusDot status="active" size="xs" />
                  <span className="text-[10px] text-pm-textMuted">{user.role}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3.5 py-1.5 text-xs text-pm-textSecondary hover:text-pm-text hover:bg-pm-hover transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Platform Settings & Guardrails</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('models');
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3.5 py-1.5 text-xs text-pm-textSecondary hover:text-pm-text hover:bg-pm-hover transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Model Governance</span>
                </button>
              </div>

              <div className="border-t border-pm-borderSubtle pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-3.5 py-1.5 text-xs text-pm-negativeText hover:bg-pm-negativeBg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
