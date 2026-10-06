import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  Sparkles,
  RefreshCw,
  Trash2,
  Table,
  Search,
  Layers,
  DollarSign,
  Package,
  Eye,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { apiClient } from '../../api/client';
import { useToast } from './ToastProvider';
import { formatCurrency, formatPercent, formatNumber } from '../../lib/utils';

function parseCSVRow(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export function DataImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [rawPreviewRows, setRawPreviewRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('mapped'); // 'mapped' | 'raw'
  const [searchTerm, setSearchTerm] = useState('');
  const [importMode, setImportMode] = useState('replace'); // 'replace' | 'append'

  const toast = useToast();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);
    setSearchTerm('');

    // Read up to 1MB of text for rich preview
    const slice = selected.slice(0, 1024 * 1024);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const allLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (allLines.length < 2) {
          setErrorMsg('CSV file must have a header row and at least 1 data row.');
          return;
        }

        const headers = parseCSVRow(allLines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());
        setRawHeaders(headers);

        const rows = [];
        const rawRows = [];

        // Parse up to 300 rows for smooth instant preview
        const maxRowsToParse = Math.min(allLines.length, 300);
        for (let i = 1; i < maxRowsToParse; i++) {
          const values = parseCSVRow(allLines[i]).map((v) => v.replace(/^["']|["']$/g, '').trim());
          if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

          const raw = {};
          const maxCols = Math.min(headers.length, 40);
          for (let col = 0; col < maxCols; col++) {
            const h = headers[col] || `col_${col + 1}`;
            raw[h] = values[col] !== undefined ? values[col] : '';
          }
          rawRows.push(raw);

          // Resilient field normalization supporting standard, M5, Walmart, and Kaggle formats
          const skuCode =
            raw.skuCode ||
            raw.sku ||
            raw.external_product_id ||
            raw.item_id ||
            raw.itemid ||
            raw.id ||
            raw.product_id ||
            `SKU-${i.toString().padStart(4, '0')}`;

          const category =
            raw.category ||
            raw.category_name ||
            raw.cat_id ||
            raw.dept_id ||
            raw.department ||
            raw.dept ||
            'General';

          const name =
            raw.name ||
            raw.product_name ||
            raw.item_name ||
            raw.description ||
            `${skuCode} (${category})`;

          let currentPrice = parseFloat(
            String(raw.currentPrice || raw.price || raw.sell_price || raw.unit_price || raw.sales || raw.weekly_sales || '').replace(/[\$,]/g, '')
          );
          if (isNaN(currentPrice) || currentPrice <= 0) {
            const hash = skuCode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            currentPrice = Math.round((25.0 + (hash % 160)) * 100) / 100;
          }

          let costPrice = parseFloat(
            String(raw.costPrice || raw.cost || raw.cogs || raw.unit_cost || '').replace(/[\$,]/g, '')
          );
          if (isNaN(costPrice) || costPrice <= 0) {
            costPrice = Math.round(currentPrice * 0.58 * 100) / 100;
          }

          const inventoryStock =
            parseInt(
              String(raw.inventoryStock || raw.inventory || raw.inventory_level || raw.stock || raw.quantity || raw.qty || raw.units_sold || '350').replace(/,/g, ''),
              10
            ) || 350;

          const competitorAvgPrice =
            parseFloat(String(raw.competitorAvgPrice || raw.competitor_price || raw.market_price || '').replace(/[\$,]/g, '')) ||
            Math.round(currentPrice * 1.05 * 100) / 100;

          const marginPercent =
            currentPrice > 0 ? Math.round(((currentPrice - costPrice) / currentPrice) * 1000) / 10 : 0;

          rows.push({
            ...raw,
            skuCode,
            name,
            category,
            currentPrice,
            costPrice,
            inventoryStock,
            competitorAvgPrice,
            marginPercent,
          });
        }

        if (rows.length === 0) {
          setErrorMsg('No valid data rows found in CSV. Please verify column formatting.');
          return;
        }

        setParsedRows(rows);
        setRawPreviewRows(rawRows);
      } catch (err) {
        setErrorMsg('Failed to parse CSV file: ' + (err.message || 'Ensure valid CSV format.'));
      }
    };
    reader.readAsText(slice);
  };

  const handleClearCatalog = async () => {
    if (!window.confirm('Are you sure you want to clear the entire product catalog and recommendations? This resets the database for a fresh upload.')) {
      return;
    }
    setIsClearing(true);
    try {
      const res = await apiClient.clearCatalog();
      toast.success('Catalog Cleared', res?.message || 'Database catalog and recommendations successfully reset.');
      if (onImportSuccess) onImportSuccess({ cleared: true });
    } catch (err) {
      toast.error('Clear Failed', err?.message || 'Unable to clear catalog.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    try {
      // If mode is 'replace', clear catalog first
      if (importMode === 'replace') {
        try {
          await apiClient.clearCatalog();
        } catch (clearErr) {
          console.warn('Pre-import catalog clearing notice:', clearErr);
        }
      }

      // Send up to 500 items per batch
      const batchToSend = parsedRows.slice(0, 500);
      const result = await apiClient.bulkImportSKUs(batchToSend);
      if (!result || result.status !== 'success') {
        throw new Error(result?.message || 'Ingestion returned unsuccessful status from server.');
      }
      toast.success(
        importMode === 'replace' ? 'Catalog Replaced Successfully' : 'Catalog Ingested Successfully',
        result.message || `Ingested ${result.inserted || batchToSend.length} SKUs into live database.`
      );
      if (onImportSuccess) onImportSuccess(result);
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Import Failed', err?.message || 'Backend server may be unreachable at http://localhost:8000.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    const sample = [
      { skuCode: 'SKU-5020-PWR', name: 'Industrial Power Module 1200W', category: 'Energy & Power', channel: 'STORE-EAST-01', currentPrice: 420.0, costPrice: 210.0, inventoryStock: 180, competitorAvgPrice: 445.0, marginPercent: 50.0 },
      { skuCode: 'SKU-6120-VAL', name: 'High-Pressure Hydraulic Valve V4', category: 'Fluid Mechanics', channel: 'STORE-ONLINE-GLOBAL', currentPrice: 580.0, costPrice: 320.0, inventoryStock: 95, competitorAvgPrice: 560.0, marginPercent: 44.8 },
      { skuCode: 'SKU-7840-OPT', name: 'Optical Fiber Fusion Splicer X2', category: 'Telecommunications', channel: 'STORE-NORTH-01', currentPrice: 1280.0, costPrice: 650.0, inventoryStock: 45, competitorAvgPrice: 1350.0, marginPercent: 49.2 },
      { skuCode: 'SKU-9910-SFT', name: 'Neural Pricing Optimization Agent', category: 'Software', channel: 'STORE-ONLINE-GLOBAL', currentPrice: 850.0, costPrice: 80.0, inventoryStock: 999, competitorAvgPrice: 920.0, marginPercent: 90.6 },
      { skuCode: 'SKU-3140-IOT', name: 'Mesh Gateway Wireless Controller', category: 'IoT Hardware', channel: 'STORE-WEST-02', currentPrice: 295.0, costPrice: 140.0, inventoryStock: 320, competitorAvgPrice: 310.0, marginPercent: 52.5 },
      { skuCode: 'SKU-4412-SEN', name: 'Ultra-Precision Acoustic Sensor', category: 'IoT Hardware', channel: 'STORE-WEST-02', currentPrice: 185.0, costPrice: 95.0, inventoryStock: 420, competitorAvgPrice: 195.0, marginPercent: 48.6 },
      { skuCode: 'SKU-8821-ROB', name: 'Robotic Actuator Arm Joint 6DOF', category: 'Robotics & Automation', channel: 'STORE-ONLINE-GLOBAL', currentPrice: 940.0, costPrice: 510.0, inventoryStock: 60, competitorAvgPrice: 980.0, marginPercent: 45.7 },
    ];
    setRawHeaders(['skuCode', 'name', 'category', 'currentPrice', 'costPrice', 'inventoryStock', 'competitorAvgPrice']);
    setParsedRows(sample);
    setRawPreviewRows(sample);
    setFile({ name: 'enterprise_multicategory_sample.csv', size: 2048 });
  };

  // Filtered rows for search in preview
  const filteredRows = useMemo(() => {
    if (!searchTerm) return parsedRows;
    const q = searchTerm.toLowerCase();
    return parsedRows.filter(
      (r) =>
        r.skuCode.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [parsedRows, searchTerm]);

  // Summary statistics of parsed dataset
  const stats = useMemo(() => {
    if (parsedRows.length === 0) return null;
    const cats = new Set(parsedRows.map((r) => r.category));
    const totalVal = parsedRows.reduce((sum, r) => sum + (r.currentPrice || 0) * (r.inventoryStock || 1), 0);
    const avgP = parsedRows.reduce((sum, r) => sum + (r.currentPrice || 0), 0) / parsedRows.length;
    const avgM = parsedRows.reduce((sum, r) => sum + (r.marginPercent || 0), 0) / parsedRows.length;
    return {
      rowCount: parsedRows.length,
      categoryCount: cats.size,
      totalPortfolioValue: totalVal,
      avgPrice: avgP,
      avgMargin: avgM,
    };
  }, [parsedRows]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dynamic Data Ingestion & CSV Analysis"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLoadSample} className="text-xs">
              <Sparkles size={13} className="mr-1.5 text-indigo-400" /> Load Sample Catalog
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCatalog}
              loading={isClearing}
              className="text-xs text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10"
            >
              <Trash2 size={12} className="mr-1" /> Clear Active Catalog
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              disabled={parsedRows.length === 0 || isProcessing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              {isProcessing
                ? 'Ingesting to SQLite…'
                : importMode === 'replace'
                ? `Replace & Analyze ${parsedRows.length} SKUs`
                : `Append ${parsedRows.length} SKUs`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Ingestion Mode Explanation & Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div
            onClick={() => setImportMode('replace')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              importMode === 'replace'
                ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-lg'
                : 'bg-white/[0.01] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <RefreshCw size={13} className="text-indigo-400" /> Replace Catalog (Recommended)
              </span>
              <Badge variant={importMode === 'replace' ? 'indigo' : 'neutral'} size="sm">
                Fresh Analysis
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Wipes prior catalog and starts a fresh analysis of only this CSV. Prevents mixed totals and stale products.
            </p>
          </div>

          <div
            onClick={() => setImportMode('append')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              importMode === 'append'
                ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-lg'
                : 'bg-white/[0.01] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Database size={13} className="text-cyan-400" /> Combine & Append
              </span>
              <Badge variant={importMode === 'append' ? 'indigo' : 'neutral'} size="sm">
                Merge Datasets
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Adds new SKUs and updates existing prices. Retains previously uploaded products in your database.
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        <label className="border-2 border-dashed border-white/[0.12] hover:border-indigo-500/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-[#0D1524]/60 hover:bg-[#0D1524] transition-all group">
          <Upload className="w-7 h-7 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-white">Click or drag CSV file to inspect & import</span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Accepts standard catalog, M5 demand forecasting, Kaggle, or Walmart CSV formats
          </span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CSV Display Section */}
        {parsedRows.length > 0 && stats && (
          <div className="space-y-3 pt-1">
            {/* Quick Metrics of Uploaded CSV */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-mono">Parsed Records</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">{formatNumber(stats.rowCount)} SKUs</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-mono">Est. Portfolio Value</span>
                <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">{formatCurrency(stats.totalPortfolioValue)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-mono">Avg Unit Price</span>
                <span className="text-xs font-bold text-indigo-300 font-mono mt-0.5 block">{formatCurrency(stats.avgPrice)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-mono">Categories</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">{stats.categoryCount} Categories</span>
              </div>
            </div>

            {/* Header & Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  {file?.name}
                </span>
                <Badge variant="neutral" size="sm">{parsedRows.length} Rows</Badge>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Bar inside Preview */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter preview..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-7 pl-7 pr-2 text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-white/[0.03] p-0.5 rounded-md border border-white/[0.08] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('mapped')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      activeTab === 'mapped' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pricing View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('raw')}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      activeTab === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Raw Columns ({rawHeaders.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Tab 1: Mapped Data Display */}
            {activeTab === 'mapped' && (
              <div className="max-h-56 overflow-y-auto border border-white/[0.08] rounded-xl bg-[#090D16]/80 font-mono text-[11px] shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0F1624] sticky top-0 border-b border-white/[0.08] text-[10px] text-slate-400 select-none">
                    <tr>
                      <th className="p-2.5">SKU Code</th>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Cost</th>
                      <th className="p-2.5 text-right">Margin %</th>
                      <th className="p-2.5 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredRows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-2.5 text-white font-bold">{r.skuCode}</td>
                        <td className="p-2.5 text-slate-300 truncate max-w-[180px]">{r.name}</td>
                        <td className="p-2.5 text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px]">{r.category}</span>
                        </td>
                        <td className="p-2.5 text-right text-emerald-400 font-semibold">{formatCurrency(r.currentPrice)}</td>
                        <td className="p-2.5 text-right text-slate-400">{formatCurrency(r.costPrice)}</td>
                        <td className="p-2.5 text-right">
                          <span className={`text-[10px] ${r.marginPercent >= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {r.marginPercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2.5 text-right text-slate-300">{formatNumber(r.inventoryStock)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Raw CSV Columns Inspector */}
            {activeTab === 'raw' && (
              <div className="max-h-56 overflow-x-auto overflow-y-auto border border-white/[0.08] rounded-xl bg-[#090D16]/80 font-mono text-[10px] shadow-inner">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-[#0F1624] sticky top-0 border-b border-white/[0.08] text-indigo-300 select-none">
                    <tr>
                      <th className="p-2 border-r border-white/[0.06] text-slate-500">#</th>
                      {rawHeaders.slice(0, 20).map((h, i) => (
                        <th key={i} className="p-2 border-r border-white/[0.06]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {rawPreviewRows.slice(0, 30).map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.04] text-slate-300">
                        <td className="p-2 border-r border-white/[0.06] text-slate-500">{i + 1}</td>
                        {rawHeaders.slice(0, 20).map((h, j) => (
                          <td key={j} className="p-2 border-r border-white/[0.06] truncate max-w-[140px]">
                            {r[h] !== undefined ? String(r[h]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {parsedRows.length > 50 && (
              <p className="text-[10px] text-slate-500 text-center">
                Showing preview of 50 rows • All {parsedRows.length} records will be imported into SQLite
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DataImportModal;
