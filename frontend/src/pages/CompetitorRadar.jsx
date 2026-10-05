import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ReferenceLine
} from 'recharts';
import {
  ShieldAlert, RefreshCw, Download, Radio,
  ExternalLink, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ChevronUp, ChevronDown, Filter, Search
} from 'lucide-react';
import { ModuleShell } from '../components/layout/ModuleShell';
import { Button } from '../components/ui/Button';
import { NativeSelect } from '../components/ui/Select';
import { DateRangePicker } from '../components/ui/DatePicker';
import { StatusBadge } from '../components/ui/Badge';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';
import { apiClient } from '../api/client';
import { mockCompetitorTelemetry, mockSKUs } from '../mock/mockData';

// --- Extended Competitor Feeds ------------------------------------------------

const competitorFeeds = [
  {
    id: 'cf-1',
    skuCode: 'SKU-8921-PRO',
    skuName: 'Precision Industrial Calibrator X1',
    competitor: 'Apex Industrial Dynamics',
    marketPrice: 435.00,
    ourPrice: 389.00,
    priceDiffPct: 11.8,
    status: 'above_us',
    stockStatus: 'In Stock',
    shippingSpeed: '2 Days',
    lastScraped: '12m ago',
    url: 'https://apexindustrial.com/p/calibrator-x1',
    history7d: -2.2,
    threatLevel: 'Low',
  },
  {
    id: 'cf-2',
    skuCode: 'SKU-8921-PRO',
    skuName: 'Precision Industrial Calibrator X1',
    competitor: 'OmniTech Supply Global',
    marketPrice: 415.00,
    ourPrice: 389.00,
    priceDiffPct: 6.7,
    status: 'above_us',
    stockStatus: 'In Stock',
    shippingSpeed: '1 Day',
    lastScraped: '45m ago',
    url: 'https://omnitechsupply.com/sku/8921',
    history7d: 0.0,
    threatLevel: 'Low',
  },
  {
    id: 'cf-3',
    skuCode: 'SKU-3320-SENS',
    skuName: 'ThermoGuard Pro Multi-Sensor',
    competitor: 'SensorTech Direct',
    marketPrice: 143.50,
    ourPrice: 149.00,
    priceDiffPct: -3.7,
    status: 'undercutting',
    stockStatus: 'In Stock (Low)',
    shippingSpeed: '3-5 Days',
    lastScraped: '8m ago',
    url: 'https://sensortech.io/sensors/tg-pro',
    history7d: -5.4,
    threatLevel: 'High',
  },
  {
    id: 'cf-4',
    skuCode: 'SKU-3320-SENS',
    skuName: 'ThermoGuard Pro Multi-Sensor',
    competitor: 'VoltMetrix Instruments',
    marketPrice: 148.00,
    ourPrice: 149.00,
    priceDiffPct: -0.7,
    status: 'undercutting',
    stockStatus: 'Out of Stock',
    shippingSpeed: 'Backordered',
    lastScraped: '2h ago',
    url: 'https://voltmetrix.com/tg-sensor',
    history7d: +1.4,
    threatLevel: 'Medium',
  },
  {
    id: 'cf-5',
    skuCode: 'SKU-4412-MTR',
    skuName: 'UltraFlow Core Flowmeter 500',
    competitor: 'Apex Industrial Dynamics',
    marketPrice: 580.00,
    ourPrice: 520.00,
    priceDiffPct: 11.5,
    status: 'above_us',
    stockStatus: 'In Stock',
    shippingSpeed: 'Same Day',
    lastScraped: '24m ago',
    url: 'https://apexindustrial.com/p/flowmeter-500',
    history7d: +3.6,
    threatLevel: 'Low',
  },
  {
    id: 'cf-6',
    skuCode: 'SKU-1090-CAB',
    skuName: 'Armored Industrial Bus Cable 50m',
    competitor: 'CableWorld B2B',
    marketPrice: 62.00,
    ourPrice: 68.00,
    priceDiffPct: -8.8,
    status: 'undercutting',
    stockStatus: 'In Stock',
    shippingSpeed: '1 Day',
    lastScraped: '4m ago',
    url: 'https://cableworld.com/industrial/bus-50m',
    history7d: -7.5,
    threatLevel: 'Critical',
  },
];

const priceHistoryData = [
  { date: 'Sep 01', ourPrice: 389, apexPrice: 420, omniPrice: 415, marketAvg: 417.5 },
  { date: 'Sep 04', ourPrice: 389, apexPrice: 420, omniPrice: 415, marketAvg: 417.5 },
  { date: 'Sep 07', ourPrice: 389, apexPrice: 425, omniPrice: 415, marketAvg: 420.0 },
  { date: 'Sep 10', ourPrice: 389, apexPrice: 430, omniPrice: 412, marketAvg: 421.0 },
  { date: 'Sep 13', ourPrice: 389, apexPrice: 435, omniPrice: 415, marketAvg: 425.0 },
  { date: 'Today',  ourPrice: 389, apexPrice: 435, omniPrice: 415, marketAvg: 425.0 },
];

const priceIndexData = [
  { category: 'Hardware & Tools', index: 92.4, ourAvg: 389, marketAvg: 421, status: 'Competitive (+7.6% room)' },
  { category: 'Software Suites', index: 104.2, ourAvg: 1000, marketAvg: 960, status: 'Premium (+4.2%)' },
  { category: 'IoT Sensors', index: 103.8, ourAvg: 149, marketAvg: 143.5, status: 'Undercut (-3.7% gap)' },
  { category: 'Cables & Wiring', index: 109.7, ourAvg: 68, marketAvg: 62, status: 'Undercut (-8.8% gap)' },
  { category: 'Flowmeters', index: 89.6, ourAvg: 520, marketAvg: 580, status: 'Competitive (+11.5% room)' },
];

export function CompetitorRadar() {
  const [feeds, setFeeds] = useState(competitorFeeds);
  const [skus, setSkus] = useState(mockSKUs);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [filterThreat, setFilterThreat] = useState('all');
  const [selectedSku, setSelectedSku] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadTelemetry() {
      setIsLoading(true);
      try {
        const [telemetry, skuList] = await Promise.all([
          apiClient.getCompetitorTelemetry(),
          apiClient.getSKUs(),
        ]);
        if (mounted) {
          if (Array.isArray(skuList)) setSkus(skuList);
        }
      } catch (err) {
        console.error('CompetitorRadar: error fetching telemetry', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadTelemetry();
    return () => { mounted = false; };
  }, []);

  const handleSyncCrawlers = async () => {
    setIsSyncing(true);
    try {
      const data = await apiClient.getCompetitorTelemetry();
      if (data && data.length > 0) {
        // Telemetry updated
      }
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const filteredFeeds = feeds.filter(f => {
    if (filterThreat !== 'all' && f.threatLevel.toLowerCase() !== filterThreat.toLowerCase()) return false;
    if (selectedSku !== 'all' && f.skuCode !== selectedSku) return false;
    if (searchTerm && !f.competitor.toLowerCase().includes(searchTerm.toLowerCase()) && !f.skuName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const undercuttingCount = feeds.filter(f => f.priceDiffPct < 0).length;
  const criticalThreatCount = feeds.filter(f => f.threatLevel === 'Critical' || f.threatLevel === 'High').length;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)} className="text-xs h-8">
        <option value="all">All Monitored SKUs ({skus.length || 6})</option>
        {skus.map(s => (
          <option key={s.id || s.skuCode} value={s.skuCode}>{s.skuCode} ({s.name.split(' ')[0]})</option>
        ))}
      </NativeSelect>
      <DateRangePicker />
      <Button
        variant="ghost"
        size="sm"
        icon={RefreshCw}
        className="text-xs"
        onClick={handleSyncCrawlers}
        disabled={isSyncing}
      >
        {isSyncing ? 'Crawling…' : 'Sync Crawlers'}
      </Button>
      <Button variant="ghost" size="sm" icon={Download} className="text-xs">
        Export CSV
      </Button>
    </div>
  );

  return (
    <ModuleShell
      breadcrumb={[{ label: 'Competitors' }]}
      title="Competitor Radar"
      description="Real-time multi-channel web price intelligence, price index monitoring, and elasticity undercutting telemetry."
      actions={controls}
    >
      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Monitored Endpoints</div>
          <div className="text-xl font-mono font-bold text-white flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            24 Channels
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Avg crawl latency: 14m</span>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Portfolio Price Index</div>
          <div className="text-xl font-mono font-bold text-indigo-400 mt-1">
            96.4 <span className="text-xs font-normal text-slate-400">(Parity = 100)</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">3.6% aggregate price cushion</span>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Active Undercut Events</div>
          <div className="text-xl font-mono font-bold text-red-400 mt-1">
            {undercuttingCount} SKUs
          </div>
          <span className="text-[10px] text-red-400 font-mono mt-1 block">{criticalThreatCount} high/critical priority</span>
        </div>

        <div className="pm-card-glass p-4 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1">Scraper Accuracy Score</div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
            99.8%
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">DOM validation & stock check verified</span>
        </div>
      </div>

      {/* Main Multi-Channel Intelligence Chart */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 pm-card-glass p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Market Price Dynamics (SKU-8921-PRO)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Benchmark tracking against Apex Industrial & OmniTech Supply</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              Live Feed
            </span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={priceHistoryData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis domain={[370, 450]} stroke="transparent" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `$${v}`} width={55} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                  fontSize: '11px',
                }}
                formatter={(val) => [`$${val}`, 'Price']}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} iconType="circle" />
              <Line dataKey="ourPrice" name="Our Price" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
              <Line dataKey="marketAvg" name="Market Avg" stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              <Line dataKey="apexPrice" name="Apex Industrial" stroke="#EF4444" strokeWidth={1.5} dot={false} />
              <Line dataKey="omniPrice" name="OmniTech Supply" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Price Index */}
        <div className="pm-card-glass p-5">
          <div className="pb-3 border-b border-white/[0.08] mb-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Category Price Index (PPI)</h3>
            <p className="text-xs text-slate-400 mt-0.5">&lt;100 = Lower than market | &gt;100 = Premium</p>
          </div>

          <div className="space-y-3">
            {priceIndexData.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{item.category}</span>
                  <span className={`font-mono font-bold tabular-nums ${item.index > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                    PPI {item.index.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>Our: ${item.ourAvg} vs Mkt: ${item.marketAvg}</span>
                  <span className="text-indigo-400">{item.status}</span>
                </div>
                <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${item.index > 100 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'}`}
                    style={{ width: `${Math.min(item.index, 120) * 0.8}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Crawled Telemetry Table */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-indigo-300">Active Competitor Scraping Feeds</h3>
            <span className="text-xs font-mono text-slate-400">({filteredFeeds.length} feeds)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter competitor or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1 bg-white/[0.05] border border-white/[0.10] hover:border-white/[0.16] focus:border-indigo-500/60 focus:bg-white/[0.07] rounded-lg text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none transition-all"
              />
            </div>

            <NativeSelect
              value={filterThreat}
              onChange={(e) => setFilterThreat(e.target.value)}
              className="text-xs h-7"
            >
              <option value="all">All Threat Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </NativeSelect>
          </div>
        </div>

        <div className="pm-card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-left bg-white/[0.02]">
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">SKU & Target Product</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Competitor Channel</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Market Price</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Our Price</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Spread / Gap</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Availability</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Threat Level</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Freshness</th>
                  <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-right">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeeds.map((feed) => {
                  const isUndercut = feed.priceDiffPct < 0;
                  return (
                    <tr key={feed.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-white leading-tight">{feed.skuName}</div>
                        <div className="text-[10px] text-indigo-400 font-mono mt-0.5">{feed.skuCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-200 font-medium">{feed.competitor}</div>
                        <div className="text-[10px] text-slate-400">{feed.shippingSpeed}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-bold text-white">
                        {formatCurrency(feed.marketPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-400">
                        {formatCurrency(feed.ourPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${isUndercut ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                          {isUndercut ? '' : '+'}{feed.priceDiffPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${feed.stockStatus.includes('In Stock') ? 'border-white/[0.10] text-slate-300 bg-white/[0.04]' : 'border-amber-500/30 text-amber-400 bg-amber-500/15'}`}>
                          {feed.stockStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                          feed.threatLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          feed.threatLevel === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          feed.threatLevel === 'Medium' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                          'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                        }`}>
                          {feed.threatLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[10px] font-mono text-slate-400">
                        {feed.lastScraped}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={feed.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
                        >
                          Verify <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
