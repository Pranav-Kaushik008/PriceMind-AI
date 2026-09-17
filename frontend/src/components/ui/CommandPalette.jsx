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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-pm-elevated border border-pm-borderStrong rounded-md shadow-lg overflow-hidden flex flex-col font-sans">
        {/* Input box */}
        <div className="flex items-center px-4 py-3 border-b border-pm-border bg-pm-surface">
          <Search className="w-4 h-4 text-pm-textDim mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, run commands, or find SKUs..."
            className="w-full bg-transparent text-xs text-pm-text placeholder:text-pm-textDim focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-pm-textDim hover:text-pm-text rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-pm-textDim block mb-1">
                Navigation Modules
              </span>
              <div className="space-y-0.5">
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
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-pm-textSecondary hover:text-pm-text rounded hover:bg-pm-hover transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-pm-accent flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-pm-textDim" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKU Jump Section */}
          {filteredSKUs.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-pm-textDim block mb-1">
                SKU Fast Drilldown
              </span>
              <div className="space-y-0.5">
                {filteredSKUs.map((sku) => (
                  <button
                    key={sku.id}
                    type="button"
                    onClick={() => {
                      setActivePage('products');
                      setSelectedSkuForDrawer(sku);
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-pm-textSecondary hover:text-pm-text rounded hover:bg-pm-hover transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono font-bold text-pm-accentText text-[11px]">{sku.skuCode}</span>
                      <span className="truncate text-[11px] text-pm-textMuted">{sku.name}</span>
                    </div>
                    <span className="font-mono text-[11px] text-pm-textDim tabular-nums flex-shrink-0">
                      ${sku.currentPrice.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3.5 py-1.5 bg-pm-subtle border-t border-pm-borderSubtle flex items-center justify-between text-[10px] font-mono text-pm-textDim">
          <span>Use ⌘K / Ctrl K to open</span>
          <span>ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
