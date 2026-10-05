import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Database, Sparkles, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { apiClient } from '../../api/client';
import { useToast } from './ToastProvider';

export function DataImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const toast = useToast();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setErrorMsg('CSV file must have a header row and at least 1 data row.');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const rows = [];

        // Parse up to 2,000 rows for high responsiveness
        const maxRowsToParse = Math.min(lines.length, 2000);
        for (let i = 1; i < maxRowsToParse; i++) {
          const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
          if (values.length < headers.length) continue;

          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx];
          });
          rows.push(rowObj);
        }

        setParsedRows(rows);
      } catch (err) {
        setErrorMsg('Failed to parse CSV file. Ensure valid comma-separated format.');
      }
    };
    reader.readAsText(selected);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    try {
      // Send up to 500 items per batch to keep backend SQLite transaction fast
      const batchToSend = parsedRows.slice(0, 500);
      const result = await apiClient.bulkImportSKUs(batchToSend);
      toast.success(
        'Catalog Ingested Successfully',
        result?.message || `Ingested ${batchToSend.length} SKUs into live database.`
      );
      if (onImportSuccess) onImportSuccess(result);
      onClose();
    } catch (err) {
      toast.error('Import Failed', err?.message || 'Could not sync records with database.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    const sample = [
      { skuCode: 'SKU-5020-PWR', name: 'Industrial Power Module 1200W', category: 'Energy & Power', channel: 'STORE-EAST-01', currentPrice: 420.0, costPrice: 210.0, inventoryStock: 180, competitorAvgPrice: 445.0 },
      { skuCode: 'SKU-6120-VAL', name: 'High-Pressure Hydraulic Valve V4', category: 'Fluid Mechanics', channel: 'STORE-ONLINE-GLOBAL', currentPrice: 580.0, costPrice: 320.0, inventoryStock: 95, competitorAvgPrice: 560.0 },
      { skuCode: 'SKU-7840-OPT', name: 'Optical Fiber Fusion Splicer X2', category: 'Telecommunications', channel: 'STORE-NORTH-01', currentPrice: 1280.0, costPrice: 650.0, inventoryStock: 45, competitorAvgPrice: 1350.0 },
      { skuCode: 'SKU-9910-SFT', name: 'Neural Pricing Optimization Agent', category: 'Software', channel: 'STORE-ONLINE-GLOBAL', currentPrice: 850.0, costPrice: 80.0, inventoryStock: 999, competitorAvgPrice: 920.0 },
      { skuCode: 'SKU-3140-IOT', name: 'Mesh Gateway Wireless Controller', category: 'IoT Hardware', channel: 'STORE-WEST-02', currentPrice: 295.0, costPrice: 140.0, inventoryStock: 320, competitorAvgPrice: 310.0 },
    ];
    setParsedRows(sample);
    setFile({ name: 'sample_enterprise_catalog.csv', size: 1024 });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dynamic Data Ingestion & CSV Import"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={handleLoadSample} className="text-xs">
            <Sparkles size={13} className="mr-1.5 text-pm-accent" /> Load Sample Catalog
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              disabled={parsedRows.length === 0 || isProcessing}
            >
              {isProcessing ? 'Ingesting to DB…' : `Ingest ${parsedRows.length} Records`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-pm-textSecondary">
          Upload custom product catalogs, historical sales records, or competitor prices. The dynamic ingestion engine validates columns, registers categories, and calculates real-time margins and elasticity automatically.
        </p>

        {/* Upload Dropzone */}
        <label className="border-2 border-dashed border-pm-borderSubtle hover:border-pm-accent/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-pm-surface/40 hover:bg-pm-surface transition-all">
          <Upload className="w-8 h-8 text-pm-accent mb-2" />
          <span className="text-xs font-semibold text-pm-text">Click to choose CSV file</span>
          <span className="text-[10px] text-pm-textDim mt-1">Accepts .csv with skuCode, name, category, currentPrice, costPrice</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>

        {errorMsg && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* File Preview */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-pm-text font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                {file?.name} ({parsedRows.length} rows parsed)
              </span>
              <span className="text-pm-textDim text-[10px]">Ready for SQLite / ML Engine</span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-pm-borderSubtle rounded bg-pm-subtle/30 font-mono text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-pm-surface sticky top-0 border-b border-pm-borderSubtle text-[10px] text-pm-textDim">
                  <tr>
                    <th className="p-2">SKU</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pm-borderSubtle/40">
                  {parsedRows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-pm-subtle/50">
                      <td className="p-2 text-pm-text font-bold">{r.skuCode || r.external_product_id || r.sku}</td>
                      <td className="p-2 text-pm-textSecondary truncate max-w-xs">{r.name || r.product_name}</td>
                      <td className="p-2 text-pm-textDim">{r.category || r.category_name || 'General'}</td>
                      <td className="p-2 text-right text-emerald-400 font-semibold">${Number(r.currentPrice || r.price || 0).toFixed(2)}</td>
                      <td className="p-2 text-right text-pm-textDim">${Number(r.costPrice || r.cost || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 10 && (
              <p className="text-[10px] text-pm-textDim text-center">+ {parsedRows.length - 10} more rows will be imported</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
