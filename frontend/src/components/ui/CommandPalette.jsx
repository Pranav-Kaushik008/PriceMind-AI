import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  TrendingUp,
  Layers,
  Sliders,
  Shield,
  FileText,
  ArrowRight,
  X,
  Tag,
  Users,
  Boxes,
  Cpu,
  FlaskConical,
  Settings,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { mockSKUs } from '../../mock/mockData';

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActivePage,
    setSelectedSkuForDrawer,
  } = useAppStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredSKUs = mockSKUs.filter(
    (s) => s.skuCode.toLowerCase().includes(query.toLowerCase()) || s.name.toLowerCase().includes(query.toLowerCase())
  );

  const navigationItems = [
    { label: 'Overview', page: 'overview', icon: Layers },
    { label: 'Pricing Recommendations', page: 'pricing', icon: Tag },
    { label: 'Products Intelligence', page: 'products', icon: Layers },
    { label: 'Demand & Elasticity (Ed)', page: 'demand', icon: TrendingUp },
    { label: 'Revenue Optimization', page: 'revenue', icon: Sparkles },
    { label: 'Customer Segmentation', page: 'customers', icon: Users },
    { label: 'Inventory & Markdown', page: 'inventory', icon: Boxes },
    { label: 'Competitor Intelligence', page: 'competitors', icon: Shield },
    { label: 'What-If Simulator', page: 'simulator', icon: Sliders },
    { label: 'AI Pricing Copilot', page: 'assistant', icon: Sparkles },
    { label: 'ML Model Registry', page: 'models', icon: Cpu },
    { label: 'Pricing Experiments', page: 'experiments', icon: FlaskConical },
    { label: 'Settings & Guardrails', page: 'settings', icon: Settings },
  ];

  const filteredNav = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0D1524]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Input box */}
        <div className="flex items-center px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="w-4 h-4 text-indigo-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, run commands, or find SKUs..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none font-sans"
          />
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                Navigation Modules
              </span>
              <div className="space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.page}
                      type="button"
                      onClick={() => {
                        setActivePage(item.page);
                        setCommandPaletteOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer text-left border border-transparent hover:border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKU Jump Section */}
          {filteredSKUs.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                SKU Fast Drilldown
              </span>
              <div className="space-y-1">
                {filteredSKUs.map((sku) => (
                  <button
                    key={sku.id}
                    type="button"
                    onClick={() => {
                      setActivePage('products');
                      setSelectedSkuForDrawer(sku);
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer text-left border border-transparent hover:border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="font-mono font-bold text-indigo-400 text-xs">{sku.skuCode}</span>
                      <span className="truncate text-xs text-slate-400">{sku.name}</span>
                    </div>
                    <span className="font-mono text-xs text-white tabular-nums flex-shrink-0 font-semibold">
                      ${Number(sku.currentPrice || 0).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-2.5 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Use ⌘K / Ctrl K to open</span>
          <span>ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
