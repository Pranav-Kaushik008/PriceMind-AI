import { create } from 'zustand';

const getInitialToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('pricemind_token') || null;
};

const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('pricemind_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialToken = getInitialToken();
const initialUser = getInitialUser();

export const useAppStore = create((set) => ({
  // Authentication State (Module 13)
  isAuthenticated: !!initialToken,
  authToken: initialToken,
  authUser: initialUser,
  isAuthLoading: false,
  authPage: 'login', // 'login' | 'signup'
  setAuthPage: (page) => set({ authPage: page }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  login: (token, user) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pricemind_token', token);
      if (user) sessionStorage.setItem('pricemind_user', JSON.stringify(user));
    }
    const displayName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Alex Chen');
    const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AC';
    set({
      authToken: token,
      authUser: user,
      isAuthenticated: true,
      user: {
        name: displayName,
        email: user?.email || 'user@pricemind.ai',
        role: user?.role === 'admin' ? 'Administrator' : 'Pricing Analyst',
        initials,
        avatar: null,
      },
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pricemind_token');
      sessionStorage.removeItem('pricemind_user');
    }
    set({
      authToken: null,
      authUser: null,
      isAuthenticated: false,
      authPage: 'login',
    });
  },

  activePage: 'overview',
  setActivePage: (page) => set({ activePage: page, isMobileSidebarOpen: false }),

  // Sidebar collapse & responsive mobile state
  isSidebarCollapsed: false,
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),

  // Workspace / Tenant
  activeWorkspace: 'ws-prod-global',
  setActiveWorkspace: (wsId) => set({ activeWorkspace: wsId }),
  workspaces: [
    { id: 'ws-prod-global', name: 'Global Retail (Production)', region: 'US-East & EU', env: 'PROD', badge: 'Live ERP' },
    { id: 'ws-us-direct', name: 'North America Direct-to-Consumer', region: 'US-West', env: 'PROD', badge: 'Live' },
    { id: 'ws-eu-wholesale', name: 'EMEA Enterprise Wholesale', region: 'EU-Central', env: 'STAGE', badge: 'Staging' },
    { id: 'ws-sandbox', name: 'Dynamic Pricing Simulation Sandbox', region: 'Local', env: 'DEV', badge: 'Sandbox' },
  ],

  // User Profile
  user: initialUser
    ? {
        name: initialUser.full_name || initialUser.email.split('@')[0],
        email: initialUser.email,
        role: initialUser.role === 'admin' ? 'Administrator' : 'Pricing Analyst',
        initials: (initialUser.full_name || initialUser.email).slice(0, 2).toUpperCase(),
        avatar: null,
      }
    : {
        name: 'Alex Chen',
        email: 'alex.chen@pricemind.ai',
        role: 'Principal Pricing Architect',
        initials: 'AC',
        avatar: null,
      },

  viewMode: 'command', // 'command' | 'analytics'
  setViewMode: (mode) => set({ viewMode: mode }),

  currency: 'USD',
  setCurrency: (c) => set({ currency: c }),

  theme: 'dark',
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    }),

  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  selectedSkuForDrawer: null,
  setSelectedSkuForDrawer: (sku) => set({ selectedSkuForDrawer: sku }),

  selectedRecommendationForEvidence: null,
  setSelectedRecommendationForEvidence: (rec) => set({ selectedRecommendationForEvidence: rec }),

  // Queued batch execution list for ERP push
  queuedRecommendations: ['rec-101', 'rec-102'],
  toggleQueuedRecommendation: (id) =>
    set((state) => {
      const exists = state.queuedRecommendations.includes(id);
      return {
        queuedRecommendations: exists
          ? state.queuedRecommendations.filter((i) => i !== id)
          : [...state.queuedRecommendations, id],
      };
    }),
  clearQueuedRecommendations: () => set({ queuedRecommendations: [] }),

  activeCategoryFilter: 'all',
  setActiveCategoryFilter: (category) => set({ activeCategoryFilter: category }),

  globalTimeGrain: '30d',
  setGlobalTimeGrain: (grain) => set({ globalTimeGrain: grain }),

  notifications: [
    { id: 'notif-1', title: 'Competitor Price Shock', desc: 'Apex Dynamics raised Pro Audio ASP by +14.2%', time: '8m ago', unread: true, type: 'warning' },
    { id: 'notif-2', title: 'ERP Push Completed', desc: 'Batch #4092 synchronized 42 SKU price adjustments to SAP S/4', time: '24m ago', unread: true, type: 'success' },
    { id: 'notif-3', title: 'Inventory Runway Alert', desc: 'Wireless ANC Headphones below 14d safety threshold', time: '1h ago', unread: false, type: 'info' },
    { id: 'notif-4', title: 'Model Drift Check Passed', desc: 'LightGBM-Spline v3.4 WAPE within ±1.8% tolerance', time: '3h ago', unread: false, type: 'success' },
  ],
  notificationsCount: 2,
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, unread: false })),
      notificationsCount: 0,
    })),
}));
