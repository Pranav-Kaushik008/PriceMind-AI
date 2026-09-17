import React, { useState } from 'react';
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
  const [filterThreat, setFilterThreat] = useState('all');
  const [selectedSku, setSelectedSku] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFeeds = competitorFeeds.filter(f => {
    if (filterThreat !== 'all' && f.threatLevel.toLowerCase() !== filterThreat.toLowerCase()) return false;
    if (selectedSku !== 'all' && f.skuCode !== selectedSku) return false;
    if (searchTerm && !f.competitor.toLowerCase().includes(searchTerm.toLowerCase()) && !f.skuName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const undercuttingCount = competitorFeeds.filter(f => f.priceDiffPct < 0).length;
  const criticalThreatCount = competitorFeeds.filter(f => f.threatLevel === 'Critical' || f.threatLevel === 'High').length;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)} className="text-xs h-8">
        <option value="all">All Monitored SKUs (6)</option>
        <option value="SKU-8921-PRO">SKU-8921-PRO (Calibrator)</option>
        <option value="SKU-3320-SENS">SKU-3320-SENS (ThermoGuard)</option>
        <option value="SKU-1090-CAB">SKU-1090-CAB (Bus Cable)</option>
      </NativeSelect>
      <DateRangePicker />
      <Button variant="ghost" size="sm" icon={RefreshCw} className="text-xs">
        Sync Crawlers
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
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-pm-borderSubtle border border-pm-borderSubtle rounded-sm">
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Monitored Endpoints</div>
          <div className="text-xl font-mono font-semibold text-pm-text flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pm-positiveText animate-pulse" />
            24 Channels
          </div>
          <span className="text-[10px] text-pm-textMuted">Avg crawl latency: 14m</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Portfolio Price Index</div>
          <div className="text-xl font-mono font-semibold text-pm-accentText">
            96.4 <span className="text-xs font-normal text-pm-textDim">(Parity = 100)</span>
          </div>
          <span className="text-[10px] text-pm-positiveText font-mono">3.6% aggregate price cushion</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Active Undercut Events</div>
          <div className="text-xl font-mono font-semibold text-pm-negativeText">
            {undercuttingCount} SKUs
          </div>
          <span className="text-[10px] text-pm-negativeText font-mono">{criticalThreatCount} high/critical priority</span>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider font-mono text-pm-textDim mb-1">Scraper Accuracy Score</div>
          <div className="text-xl font-mono font-semibold text-pm-text">
            99.8%
          </div>
          <span className="text-[10px] text-pm-textDim font-mono">DOM validation & stock check verified</span>
        </div>
      </div>

      {/* Main Multi-Channel Intelligence Chart */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle mb-4">
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Market Price Dynamics (SKU-8921-PRO)</h3>
              <p className="text-xs text-pm-textMuted mt-0.5">Benchmark tracking against Apex Industrial & OmniTech Supply</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-pm-subtle border border-pm-borderSubtle text-pm-textMuted">
              Live Feed
            </span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={priceHistoryData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pm-border-subtle)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} />
              <YAxis domain={[370, 450]} stroke="transparent" tick={{ fontSize: 10, fill: 'var(--pm-text-dim)' }} tickFormatter={(v) => `$${v}`} width={55} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pm-bg-elevated)',
                  border: '1px solid var(--pm-border-strong)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--pm-text)'
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
        <div>
          <div className="pb-3 border-b border-pm-borderSubtle mb-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Category Price Index (PPI)</h3>
            <p className="text-xs text-pm-textMuted mt-0.5">&lt;100 = Lower than market | &gt;100 = Premium</p>
          </div>

          <div className="space-y-3">
            {priceIndexData.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-sm bg-pm-subtle border border-pm-borderSubtle">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-pm-text">{item.category}</span>
                  <span className={`font-mono font-semibold tabular-nums ${item.index > 100 ? 'text-pm-negativeText' : 'text-pm-positiveText'}`}>
                    PPI {item.index.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-pm-textDim mt-1 font-mono">
                  <span>Our: ${item.ourAvg} vs Mkt: ${item.marketAvg}</span>
                  <span className="text-pm-textMuted">{item.status}</span>
                </div>
                <div className="w-full bg-pm-surface h-1 rounded-full overflow-hidden mt-1.5 border border-pm-borderSubtle">
                  <div
                    className={`h-full ${item.index > 100 ? 'bg-pm-negativeText' : 'bg-pm-positiveText'}`}
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
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-pm-borderSubtle mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-pm-textDim">Active Competitor Scraping Feeds</h3>
            <span className="text-xs font-mono text-pm-textDim">({filteredFeeds.length} feeds)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-pm-textDim" />
              <input
                type="text"
                placeholder="Filter competitor or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1 bg-pm-surface border border-pm-borderSubtle rounded-sm text-xs text-pm-text font-mono placeholder:text-pm-textDim focus:outline-none focus:border-pm-borderStrong"
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-pm-border text-left">
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">SKU & Target Product</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Competitor Channel</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Market Price</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Our Price</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Spread / Gap</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Availability</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Threat Level</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim">Freshness</th>
                <th className="py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-pm-textDim text-right">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeeds.map((feed) => {
                const isUndercut = feed.priceDiffPct < 0;
                return (
                  <tr key={feed.id} className="border-b border-pm-borderSubtle hover:bg-pm-hover transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="text-xs font-medium text-pm-text leading-tight">{feed.skuName}</div>
                      <div className="text-[10px] text-pm-textDim font-mono mt-0.5">{feed.skuCode}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-pm-text font-medium">{feed.competitor}</div>
                      <div className="text-[10px] text-pm-textDim">{feed.shippingSpeed}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-pm-text">
                      {formatCurrency(feed.marketPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-pm-textMuted">
                      {formatCurrency(feed.ourPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] ${isUndercut ? 'bg-pm-negativeBg text-pm-negativeText border border-pm-negativeBorder' : 'bg-pm-positiveBg text-pm-positiveText border border-pm-positiveBorder'}`}>
                        {isUndercut ? '' : '+'}{feed.priceDiffPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${feed.stockStatus.includes('In Stock') ? 'border-pm-borderSubtle text-pm-textMuted bg-pm-subtle' : 'border-pm-warningBorder text-pm-warningText bg-pm-warningBg'}`}>
                        {feed.stockStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold ${
                        feed.threatLevel === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        feed.threatLevel === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        feed.threatLevel === 'Medium' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {feed.threatLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[10px] font-mono text-pm-textDim">
                      {feed.lastScraped}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-pm-accentText hover:underline font-mono"
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
    </ModuleShell>
  );
}
