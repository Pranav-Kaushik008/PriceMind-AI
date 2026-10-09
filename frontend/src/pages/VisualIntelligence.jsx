import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle2,
  Check,
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Package,
  Layers,
  Activity,
  Zap,
  HelpCircle,
  Eye,
  FileText,
  Tag,
  Boxes,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sliders,
  History,
  Store,
  Building2,
  Video,
  VideoOff,
  Box,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/ToastProvider';

// ── 5 Catalog TVs Dataset (Exact match to provided screenshot) ─────────────────
const STORE_PRODUCTS = [
  {
    id: 'prod_lg_55',
    sku: 'LG-55UQ75',
    name: 'LG 55" 4K UHD TV',
    catalogName: 'LG 55" 4K UHD Smart TV',
    detectedLabel: 'LG 55" TV',
    displayLabel: 'LG TV 0.94',
    detectedPrice: 549.99,
    confidence: 94,
    color: '#22c55e', // Green
    box: { x: '5%', y: '6%', width: '42%', height: '42%' },
    tagPos: { left: '16%', top: '38%' },
    yourPrice: 579.99,
    diffPercent: -5.2,
    elasticity: -0.38,
    sales30d: 980,
    availability: 'In Stock',
    recommendedPrice: 539.99,
    priceChangePct: -6.9,
    liftUnits: '+185 units',
    revenueDelta: '+$22.4K',
    profitDelta: '+$8.9K',
    ocrTag: 'LG UHD TV',
    explanation: 'Competitor price $549.99 is 5.2% below our $579.99 baseline. Moderate elasticity (-0.38) indicates lowering to $539.99 will maximize margin expansion.',
  },
  {
    id: 'prod_samsung_55',
    sku: 'SS-55Q60',
    name: 'Samsung 55" QLED TV',
    catalogName: 'Samsung 55" QLED 4K TV',
    detectedLabel: 'Samsung 55" QLED',
    displayLabel: 'Samsung TV 0.96',
    detectedPrice: 599.99,
    confidence: 96,
    color: '#3b82f6', // Blue
    box: { x: '52%', y: '6%', width: '42%', height: '42%' },
    tagPos: { left: '62%', top: '38%' },
    yourPrice: 619.99,
    diffPercent: -3.2,
    elasticity: -0.42,
    sales30d: 1240,
    availability: 'In Stock',
    recommendedPrice: 589.99,
    priceChangePct: -4.8,
    liftUnits: '+210 units',
    revenueDelta: '+$28.6K',
    profitDelta: '+$11.4K',
    ocrTag: 'SAMSUNG QLED',
    explanation: 'Detected competitor price of $599.99 with 96% match. PriceMind recommends $589.99 to capture 210 additional units with $11.4K monthly profit lift.',
  },
  {
    id: 'prod_sony_55',
    sku: 'SY-55X80L',
    name: 'Sony 55" Bravia TV',
    catalogName: 'Sony 55" Bravia 4K TV',
    detectedLabel: 'Sony 55" TV',
    displayLabel: 'Sony TV 0.92',
    detectedPrice: 649.99,
    confidence: 92,
    color: '#ef4444', // Red
    box: { x: '5%', y: '52%', width: '30%', height: '44%' },
    tagPos: { left: '12%', top: '82%' },
    yourPrice: 679.99,
    diffPercent: -4.4,
    elasticity: -0.52,
    sales30d: 850,
    availability: 'In Stock',
    recommendedPrice: 639.99,
    priceChangePct: -5.9,
    liftUnits: '+160 units',
    revenueDelta: '+$19.8K',
    profitDelta: '+$7.6K',
    ocrTag: 'SONY BRAVIA',
    explanation: 'Competitor shelf price $649.99 detected. Recommended target $639.99 preserves margin above cost floor while matching local market momentum.',
  },
  {
    id: 'prod_tcl_55',
    sku: 'TC-55P635',
    name: 'TCL 55" 4K TV',
    catalogName: 'TCL 55" 4K UHD TV',
    detectedLabel: 'TCL 55" TV',
    displayLabel: 'TCL TV 0.91',
    detectedPrice: 499.99,
    confidence: 91,
    color: '#a855f7', // Purple
    box: { x: '37%', y: '52%', width: '30%', height: '44%' },
    tagPos: { left: '44%', top: '82%' },
    yourPrice: 529.99,
    diffPercent: -5.7,
    elasticity: -0.65,
    sales30d: 1520,
    availability: 'In Stock',
    recommendedPrice: 489.99,
    priceChangePct: -7.5,
    liftUnits: '+280 units',
    revenueDelta: '+$31.2K',
    profitDelta: '+$12.8K',
    ocrTag: 'TCL 4K TV',
    explanation: 'High price sensitivity (E = -0.65). Adjusting to $489.99 counters competitor aggressive pricing and accelerates sell-through by +280 units/mo.',
  },
  {
    id: 'prod_hisense_55',
    sku: 'HS-55A6H',
    name: 'Hisense 55" UHD TV',
    catalogName: 'Hisense 55" UHD 4K TV',
    detectedLabel: 'Hisense 55" TV',
    displayLabel: 'Hisense TV 0.89',
    detectedPrice: 459.99,
    confidence: 89,
    color: '#f97316', // Orange
    box: { x: '69%', y: '52%', width: '28%', height: '44%' },
    tagPos: { left: '76%', top: '82%' },
    yourPrice: 489.99,
    diffPercent: -6.1,
    elasticity: -0.71,
    sales30d: 1100,
    availability: 'In Stock',
    recommendedPrice: 449.99,
    priceChangePct: -8.2,
    liftUnits: '+240 units',
    revenueDelta: '+$24.5K',
    profitDelta: '+$10.2K',
    ocrTag: 'Hisense UHD',
    explanation: 'Detected competitor rollback price of $459.99. Setting price to $449.99 reclaims category leader status with projected $24.5K revenue increase.',
  },
];

const DETECTED_TEXT_ITEMS = [
  { id: 't1', text: '$549.99', subtext: 'Price - USD', conf: 0.98, type: 'price', color: 'yellow' },
  { id: 't2', text: '$599.99', subtext: 'Price - USD', conf: 0.97, type: 'price', color: 'yellow' },
  { id: 't3', text: '$649.99', subtext: 'Price - USD', conf: 0.96, type: 'price', color: 'yellow' },
  { id: 't4', text: '$499.99', subtext: 'Price - USD', conf: 0.95, type: 'price', color: 'yellow' },
  { id: 't5', text: '$459.99', subtext: 'Price - USD', conf: 0.94, type: 'price', color: 'yellow' },
  { id: 't6', text: '$439.99', subtext: 'Price - USD (Old)', conf: 0.91, type: 'price', color: 'yellow' },
  { id: 't7', text: 'LG UHD TV', subtext: 'Text', conf: 0.95, type: 'text', color: 'slate' },
  { id: 't8', text: 'SAMSUNG QLED', subtext: 'Text', conf: 0.93, type: 'text', color: 'slate' },
  { id: 't9', text: 'SONY BRAVIA', subtext: 'Text', conf: 0.92, type: 'text', color: 'slate' },
  { id: 't10', text: 'TCL 4K TV', subtext: 'Text', conf: 0.91, type: 'text', color: 'slate' },
  { id: 't11', text: 'Hisense UHD', subtext: 'Text', conf: 0.89, type: 'text', color: 'slate' },
  { id: 't12', text: '55 Inch Class', subtext: 'Text', conf: 0.88, type: 'text', color: 'slate' },
  { id: 't13', text: 'Smart Google TV', subtext: 'Text', conf: 0.87, type: 'text', color: 'slate' },
  { id: 't14', text: 'Rollback Deal', subtext: 'Text', conf: 0.86, type: 'text', color: 'slate' },
];

export function VisualIntelligence() {
  const toast = useToast();
  const { setActivePage } = useAppStore();

  // ── States ──────────────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'camera'
  const [selectedProductId, setSelectedProductId] = useState('prod_samsung_55');
  const [imageFilter, setImageFilter] = useState('all'); // 'all' | 'objects' | 'text'
  const [textFilter, setTextFilter] = useState('all'); // 'all' | 'prices' | 'other'
  const [uploadedFileName, setUploadedFileName] = useState('store_shelf.jpg');
  const [uploadedFileSize, setUploadedFileSize] = useState('2.4 MB');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Selected Product
  const selectedProduct =
    STORE_PRODUCTS.find((p) => p.id === selectedProductId) || STORE_PRODUCTS[1];

  // Stop camera tracks cleanly
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Sync camera stream to video tag
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraActive]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectProduct = (id) => {
    setSelectedProductId(id);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      setInputMode('camera');
      toast.success('Live Camera Active', 'Point your camera at competitor store shelves.');
    } catch (err) {
      toast.error('Camera Access Error', 'Please grant webcam permission.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setInputMode('upload');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
    );
    toast.info('Image Selected', `${file.name} ready for computer vision.`);
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    toast.info('Running Pipeline', 'Executing YOLOv8, EasyOCR, and Catalog Matching...');
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success('Analysis Complete', 'Detected 5 products and 14 text regions.');
    }, 900);
  };

  const filteredTextItems = DETECTED_TEXT_ITEMS.filter((item) => {
    if (textFilter === 'prices') return item.type === 'price';
    if (textFilter === 'other') return item.type === 'text';
    return true;
  });

  return (
    <div className="flex flex-col gap-4 w-full font-sans max-w-[1640px] mx-auto pb-12 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* =======================================================================
          TOP BAR: TITLE, SUBTITLE & ANALYSIS HISTORY
          ======================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-pm-text tracking-tight">
            Visual Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-pm-textMuted mt-0.5">
            Analyze products, prices, and retail images using Computer Vision and AI.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsHistoryModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pm-subtle hover:bg-pm-hover text-pm-textSecondary hover:text-pm-text border border-pm-border text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Clock className="w-3.5 h-3.5 text-pm-textMuted" />
          <span>Analysis History</span>
        </button>
      </div>

      {/* =======================================================================
          TOP SECTION: UPLOAD / CAMERA & ANALYSIS SUMMARY
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column (6 cols): Upload Image / Live Camera Box */}
        <div className="lg:col-span-6 flex flex-col gap-2.5">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { stopCamera(); setInputMode('upload'); }}
              className={`p-2.5 rounded-2xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-pm-accentSubtle border-pm-accent/50 shadow-sm'
                  : 'bg-pm-surface border-pm-border hover:bg-pm-hover shadow-sm'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Upload className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-pm-text block">Upload Image</span>
                <span className="text-[10px] text-pm-textMuted truncate block">
                  Upload a shelf image from a competitor store
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`p-2.5 rounded-2xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                inputMode === 'camera'
                  ? 'bg-pm-accentSubtle border-pm-accent/50 shadow-sm'
                  : 'bg-pm-surface border-pm-border hover:bg-pm-hover shadow-sm'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-pm-subtle border border-pm-border flex items-center justify-center text-pm-textMuted flex-shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-pm-text block">Live Camera</span>
                <span className="text-[10px] text-pm-textMuted truncate block">
                  {isCameraActive ? 'Camera active (Click to stop)' : 'Capture an image using your camera'}
                </span>
              </div>
            </button>
          </div>

          {/* Upload Dropzone + Preview Card */}
          <div className="p-4 rounded-2xl bg-pm-surface border border-pm-border flex-1 flex flex-col justify-between gap-3 shadow-sm">
            {inputMode === 'camera' && isCameraActive ? (
              <div className="w-full aspect-[16/9] bg-black rounded-xl overflow-hidden relative border border-pm-border">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('Snapshot Captured', 'Analyzing camera frame...');
                      stopCamera();
                      runAnalysis();
                    }}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Capture & Analyze
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Left Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-pm-border hover:border-pm-accent/60 bg-pm-subtle/50 hover:bg-pm-hover/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 min-h-[140px]"
                >
                  <Upload className="w-5 h-5 text-pm-textMuted" />
                  <span className="text-[11px] text-pm-textSecondary font-medium">
                    Drag and drop an image here
                  </span>
                  <span className="text-[9px] text-pm-textDim">or</span>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    Choose Image
                  </button>
                  <span className="text-[8px] text-pm-textDim mt-1">
                    Supported formats: JPG, PNG, WEBP (Max 10 MB)
                  </span>
                </div>

                {/* Right Image Thumbnail Preview */}
                <div className="flex flex-col gap-2">
                  <div className="relative rounded-xl overflow-hidden border border-pm-border bg-pm-subtle aspect-[16/10]">
                    {/* Simulated 4-TV Shelf Preview */}
                    <div className="w-full h-full bg-slate-900 grid grid-cols-2 gap-1 p-1">
                      <div className="bg-emerald-950/40 rounded border border-emerald-500/30 flex items-center justify-center text-[8px] text-slate-300 font-mono relative">
                        LG TV
                        <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-0.5 rounded-sm">$549.99</span>
                      </div>
                      <div className="bg-blue-950/40 rounded border border-blue-500/30 flex items-center justify-center text-[8px] text-slate-300 font-mono relative">
                        Samsung TV
                        <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-0.5 rounded-sm">$599.99</span>
                      </div>
                      <div className="bg-red-950/40 rounded border border-red-500/30 flex items-center justify-center text-[8px] text-slate-300 font-mono relative">
                        Sony TV
                        <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-0.5 rounded-sm">$649.99</span>
                      </div>
                      <div className="bg-purple-950/40 rounded border border-purple-500/30 flex items-center justify-center text-[8px] text-slate-300 font-mono relative">
                        TCL TV
                        <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-black text-[7px] font-bold px-0.5 rounded-sm">$499.99</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-pm-textMuted px-0.5">
                    <span>{uploadedFileName}</span>
                    <span>{uploadedFileSize}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Analyze Image Button */}
            <button
              type="button"
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs shadow-[0_4px_14px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Image with Computer Vision...</span>
                </>
              ) : (
                <>
                  <span>Analyze Image</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (6 cols): Analysis Summary */}
        <div className="lg:col-span-6 p-4 rounded-2xl bg-pm-surface border border-pm-border flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-pm-borderSubtle">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <h2 className="text-xs font-bold text-pm-text">Analysis Summary</h2>
            </div>

            {/* 4 Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-border flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-pm-textMuted block font-medium">Products Detected</span>
                  <span className="text-lg font-bold text-pm-text font-mono">5</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-border flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-pm-textMuted block font-medium">Text Regions</span>
                  <span className="text-lg font-bold text-pm-text font-mono">14</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-border flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 dark:text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-pm-textMuted block font-medium">Possible Prices</span>
                  <span className="text-lg font-bold text-pm-text font-mono">6</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-border flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-500 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-pm-textMuted block font-medium">Matched Products</span>
                  <span className="text-lg font-bold text-pm-text font-mono">4</span>
                </div>
              </div>
            </div>

            {/* Processing Steps Checklist with Timings */}
            <div className="mt-3.5 space-y-1.5 font-mono text-[11px]">
              <span className="text-[10px] font-sans font-semibold text-pm-textDim uppercase tracking-wider block mb-1">
                Processing Steps
              </span>
              <div className="flex items-center justify-between text-pm-textSecondary">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Image received
                </span>
                <span className="text-pm-textDim text-[10px]">2.1s</span>
              </div>
              <div className="flex items-center justify-between text-pm-textSecondary">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Preprocessing
                </span>
                <span className="text-pm-textDim text-[10px]">3.4s</span>
              </div>
              <div className="flex items-center justify-between text-pm-textSecondary">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Detecting objects (YOLO)
                </span>
                <span className="text-pm-textDim text-[10px]">4.8s</span>
              </div>
              <div className="flex items-center justify-between text-pm-textSecondary">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Reading text (OCR)
                </span>
                <span className="text-pm-textDim text-[10px]">6.2s</span>
              </div>
              <div className="flex items-center justify-between text-pm-textSecondary">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Matching products
                </span>
                <span className="text-pm-textDim text-[10px]">2.3s</span>
              </div>
              <div className="flex items-center justify-between text-pm-textSecondary">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Generating results
                </span>
                <span className="text-pm-textDim text-[10px]">1.1s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          MIDDLE SECTION: CARDS 1, 2, AND 3
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* ─────────────────────────────────────────────────────────────────
            CARD 1: ANALYZED IMAGE (6 cols)
            ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 p-4 rounded-2xl bg-pm-surface border border-pm-border shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                1
              </div>
              <h2 className="text-xs font-bold text-pm-text">Analyzed Image</h2>
            </div>

            {/* Filter Toggle Pills: All | Objects | Text */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setImageFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                  imageFilter === 'all'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-pm-subtle text-pm-textMuted hover:text-pm-text border border-pm-borderSubtle'
                }`}
              >
                ● All
              </button>
              <button
                type="button"
                onClick={() => setImageFilter('objects')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                  imageFilter === 'objects'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-pm-subtle text-pm-textMuted hover:text-pm-text border border-pm-borderSubtle'
                }`}
              >
                ○ Objects
              </button>
              <button
                type="button"
                onClick={() => setImageFilter('text')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                  imageFilter === 'text'
                    ? 'bg-yellow-500 text-black shadow-xs font-bold'
                    : 'bg-pm-subtle text-pm-textMuted hover:text-pm-text border border-pm-borderSubtle'
                }`}
              >
                ○ Text
              </button>
            </div>
          </div>

          {/* Main Shelf Image with Colored Bounding Boxes */}
          <div className="relative rounded-xl overflow-hidden border border-pm-border bg-slate-950 aspect-[16/10] w-full">
            {/* Background Shelf Structure */}
            <div className="w-full h-full bg-[#0a0f1d] relative overflow-hidden">
              {/* Shelves Graphic */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />
              <div className="absolute top-[48%] left-0 right-0 h-2 bg-slate-700/60 border-t border-b border-white/[0.1]" />
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-700/60 border-t border-white/[0.1]" />

              {/* Render the 5 TV Boxes */}
              {STORE_PRODUCTS.map((prod) => {
                const isSelected = selectedProductId === prod.id;
                const showBox = imageFilter === 'all' || imageFilter === 'objects';
                const showTag = imageFilter === 'all' || imageFilter === 'text';

                return (
                  <div
                    key={prod.id}
                    style={{
                      position: 'absolute',
                      left: prod.box.x,
                      top: prod.box.y,
                      width: prod.box.width,
                      height: prod.box.height,
                      border: showBox ? `2px solid ${prod.color}` : 'none',
                      backgroundColor: showBox ? `${prod.color}18` : 'transparent',
                      borderRadius: '8px',
                    }}
                    onClick={() => handleSelectProduct(prod.id)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-black scale-[1.01]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    {/* TV Display Graphic Inside Box */}
                    <div className="w-full h-full p-1 flex flex-col justify-between">
                      {/* Top Label Tag */}
                      {showBox && (
                        <div
                          style={{ backgroundColor: prod.color }}
                          className="self-start text-black text-[8px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-tight shadow-sm"
                        >
                          {prod.displayLabel}
                        </div>
                      )}

                      {/* Screen Art Simulation */}
                      <div className="flex-1 flex items-center justify-center my-0.5 rounded bg-black/40 border border-white/[0.04] text-[8px] text-slate-400 font-mono">
                        <span>{prod.ocrTag}</span>
                      </div>

                      {/* Yellow Shelf Price Tag */}
                      {showTag && (
                        <div className="self-center bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                          <span className="text-[6px] font-normal uppercase text-black/70">PRICE</span>
                          <span>${prod.detectedPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            CARD 2: DETECTED PRODUCTS (3 cols)
            ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-pm-surface border border-pm-border shadow-sm flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-pm-borderSubtle">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                2
              </div>
              <h2 className="text-xs font-bold text-pm-text">Detected Products</h2>
            </div>

            <div className="space-y-1.5 mt-2.5">
              {STORE_PRODUCTS.map((prod) => {
                const isSelected = selectedProductId === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pm-accentSubtle border-pm-accent/50 shadow-sm'
                        : 'bg-pm-subtle border-pm-borderSubtle hover:bg-pm-hover hover:border-pm-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        style={{ backgroundColor: `${prod.color}25`, borderColor: prod.color }}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center text-xs flex-shrink-0 shadow-xs"
                      >
                        📺
                      </div>
                      <div className="truncate">
                        <span className="text-[11px] font-bold text-pm-text block truncate leading-tight">
                          {prod.name}
                        </span>
                        <span className="text-[10px] font-mono text-pm-textSecondary font-semibold">
                          ${prod.detectedPrice}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                        {prod.confidence}%
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-pm-textDim" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            CARD 3: DETECTED TEXT & PRICES (3 cols)
            ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-pm-surface border border-pm-border shadow-sm flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-pm-borderSubtle">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                3
              </div>
              <h2 className="text-xs font-bold text-pm-text">Detected Text & Prices</h2>
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex bg-pm-subtle p-0.5 rounded-lg border border-pm-border text-[10px] font-medium mt-2">
              <button
                type="button"
                onClick={() => setTextFilter('all')}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  textFilter === 'all' ? 'bg-pm-surface text-pm-text font-bold shadow-xs border border-pm-borderSubtle' : 'text-pm-textMuted hover:text-pm-text'
                }`}
              >
                All Text
              </button>
              <button
                type="button"
                onClick={() => setTextFilter('prices')}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  textFilter === 'prices' ? 'bg-pm-surface text-pm-text font-bold shadow-xs border border-pm-borderSubtle' : 'text-pm-textMuted hover:text-pm-text'
                }`}
              >
                Prices (6)
              </button>
              <button
                type="button"
                onClick={() => setTextFilter('other')}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  textFilter === 'other' ? 'bg-pm-surface text-pm-text font-bold shadow-xs border border-pm-borderSubtle' : 'text-pm-textMuted hover:text-pm-text'
                }`}
              >
                Other Text (8)
              </button>
            </div>

            {/* Scrollable OCR Item List */}
            <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredTextItems.map((item) => (
                <div
                  key={item.id}
                  className="p-1.5 rounded-lg bg-pm-subtle hover:bg-pm-hover border border-pm-borderSubtle flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        item.color === 'yellow'
                          ? 'bg-yellow-400 text-black shadow-xs'
                          : 'bg-pm-surface text-pm-textSecondary border border-pm-borderSubtle'
                      }`}
                    >
                      {item.text}
                    </span>
                    <span className="text-[10px] text-pm-textMuted truncate">{item.subtext}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-pm-textDim">
                    <span>{item.conf}</span>
                    <ChevronRight className="w-3 h-3 text-pm-textDim" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          BOTTOM SECTION: CARDS 4, 5, AND 6
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* ─────────────────────────────────────────────────────────────────
            CARD 4: PRODUCT MATCHING (6 cols)
            ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 p-4 rounded-2xl bg-pm-surface border border-pm-border shadow-sm flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-pm-borderSubtle">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                4
              </div>
              <h2 className="text-xs font-bold text-pm-text">Product Matching</h2>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 text-[9px] font-mono uppercase tracking-wider text-pm-textDim pt-2 pb-1 border-b border-pm-borderSubtle mt-1">
              <div className="col-span-3">Detected Product</div>
              <div className="col-span-3">Matched Catalog Product</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-2">Match Confidence</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* 5 Rows */}
            <div className="space-y-1 mt-1.5 font-mono text-[11px]">
              {STORE_PRODUCTS.map((prod) => {
                const isSelected = selectedProductId === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod.id)}
                    className={`grid grid-cols-12 items-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pm-accentSubtle border-pm-accent/50 shadow-xs'
                        : 'bg-pm-subtle border-pm-borderSubtle hover:bg-pm-hover'
                    }`}
                  >
                    <div className="col-span-3 text-pm-textSecondary truncate pr-1">
                      {prod.detectedLabel}
                    </div>
                    <div className="col-span-3 text-pm-text font-sans font-medium truncate pr-1">
                      {prod.catalogName}
                    </div>
                    <div className="col-span-2 text-pm-textDim truncate text-[10px]">
                      {prod.sku}
                    </div>
                    <div className="col-span-2 text-pm-accent font-bold">
                      {prod.confidence}%
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                        Matched
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            CARD 5: COMPETITOR COMPARISON (3 cols)
            ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-pm-surface border border-pm-border shadow-sm flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-pm-borderSubtle">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                5
              </div>
              <h2 className="text-xs font-bold text-pm-text">Competitor Comparison</h2>
            </div>

            {/* Selected Product Header */}
            <div className="mt-2 p-2 rounded-xl bg-pm-subtle border border-pm-border flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 text-xs flex-shrink-0">
                📺
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-pm-text block truncate">
                  {selectedProduct.name}
                </span>
                <span className="text-[9px] font-mono text-pm-textDim">
                  SKU: {selectedProduct.sku}
                </span>
              </div>
            </div>

            {/* Key-Value Comparison Table */}
            <div className="space-y-1.5 text-[11px] font-mono mt-2.5">
              <div className="flex justify-between items-center py-0.5 border-b border-pm-borderSubtle">
                <span className="text-pm-textMuted text-[10px]">Your Price</span>
                <span className="font-bold text-pm-text">${selectedProduct.yourPrice}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-pm-borderSubtle">
                <span className="text-pm-textMuted text-[10px]">Competitor Price</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-pm-text">${selectedProduct.detectedPrice}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30">
                    {Math.abs(selectedProduct.diffPercent)}% lower
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-pm-borderSubtle">
                <span className="text-pm-textMuted text-[10px]">Price Difference</span>
                <span className="font-bold text-cyan-500 dark:text-cyan-400">{selectedProduct.diffPercent}%</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-pm-borderSubtle">
                <span className="text-pm-textMuted text-[10px]">Demand Elasticity</span>
                <span className="font-bold text-amber-500 dark:text-amber-300">{selectedProduct.elasticity}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-pm-borderSubtle">
                <span className="text-pm-textMuted text-[10px]">Your Sales (Last 30 days)</span>
                <span className="font-bold text-pm-textSecondary">{selectedProduct.sales30d.toLocaleString()} units</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-pm-textMuted text-[10px]">Competitor Availability</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">
                  {selectedProduct.availability}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            CARD 6: PRICING RECOMMENDATION (3 cols)
            ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-pm-surface border border-pm-border shadow-sm flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-pm-borderSubtle">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                6
              </div>
              <h2 className="text-xs font-bold text-pm-text">Pricing Recommendation</h2>
            </div>

            {/* Recommended Price Hero Box */}
            <div className="mt-2 p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-pm-surface to-pm-subtle border border-emerald-500/30 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-pm-textMuted flex items-center gap-0.5">
                    Recommended Price <Info className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-lg font-bold font-mono text-pm-text block">
                    ${selectedProduct.recommendedPrice}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                {selectedProduct.priceChangePct}%
              </span>
            </div>

            {/* Expected Impact (per month) */}
            <div className="mt-2 space-y-1.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-pm-textDim block">
                Expected Impact (per month):
              </span>
              <div className="p-2 rounded-xl bg-pm-subtle border border-pm-borderSubtle flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center text-xs">
                  📈
                </div>
                <div className="text-[10px]">
                  <span className="font-bold text-pm-text font-mono">{selectedProduct.liftUnits}</span>
                  <span className="text-pm-textMuted text-[9px] block">Estimated volume lift</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-pm-subtle border border-pm-borderSubtle flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center text-xs">
                  💰
                </div>
                <div className="text-[10px]">
                  <span className="font-bold text-pm-text font-mono">{selectedProduct.revenueDelta}</span>
                  <span className="text-pm-textMuted text-[9px] block">Estimated revenue increase</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-pm-subtle border border-pm-borderSubtle flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-500 dark:text-purple-400 flex items-center justify-center text-xs">
                  🛡️
                </div>
                <div className="text-[10px]">
                  <span className="font-bold text-pm-text font-mono">{selectedProduct.profitDelta}</span>
                  <span className="text-pm-textMuted text-[9px] block">Estimated gross profit increase</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5 mt-2">
            <button
              type="button"
              onClick={() => setIsSimModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-xs transition-all shadow-[0_2px_6px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(99,102,241,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Simulate This Price</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsDetailsModalOpen(true)}
              className="w-full py-1.5 px-3 rounded-xl bg-pm-subtle hover:bg-pm-hover text-pm-textSecondary hover:text-pm-text text-[11px] font-medium transition-colors border border-pm-border cursor-pointer"
            >
              View Detailed Analysis
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================================
          SIMULATION MODAL
          ======================================================================= */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-5 rounded-2xl bg-pm-elevated border border-pm-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-pm-text">
                  Simulate Price Impact: {selectedProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSimModalOpen(false)}
                className="text-pm-textMuted hover:text-pm-text cursor-pointer p-1 rounded-lg hover:bg-pm-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-border">
                <span className="text-[10px] font-mono text-pm-textMuted block">Baseline Current Price</span>
                <span className="text-lg font-bold font-mono text-pm-text">${selectedProduct.yourPrice}</span>
                <span className="text-[10px] text-pm-textDim block mt-1">Monthly units: {selectedProduct.sales30d}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-300 block">Recommended Price ({selectedProduct.priceChangePct}%)</span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">${selectedProduct.recommendedPrice}</span>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-300 block mt-1">Projected lift: {selectedProduct.liftUnits}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-pm-subtle border border-pm-borderSubtle space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-pm-textMuted">Monthly Revenue Delta:</span>
                <span className="text-indigo-500 dark:text-indigo-400 font-bold">{selectedProduct.revenueDelta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pm-textMuted">Gross Profit Expansion:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedProduct.profitDelta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pm-textMuted">Price Elasticity (E):</span>
                <span className="text-amber-500 dark:text-amber-300 font-bold">{selectedProduct.elasticity}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsSimModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  toast.success('Strategy Approved', `Updated price for ${selectedProduct.name} to $${selectedProduct.recommendedPrice}`);
                  setIsSimModalOpen(false);
                }}
              >
                Apply Recommendation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          DETAILED ANALYSIS MODAL
          ======================================================================= */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl p-5 rounded-2xl bg-pm-elevated border border-pm-border shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle">
              <div>
                <h3 className="text-sm font-bold text-pm-text">
                  Telemetry & Audit Record: {selectedProduct.name}
                </h3>
                <span className="text-[10px] font-mono text-pm-textDim">SKU: {selectedProduct.sku}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-pm-textMuted hover:text-pm-text cursor-pointer p-1 rounded-lg hover:bg-pm-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-borderSubtle space-y-1">
                <span className="font-bold text-purple-600 dark:text-purple-300 text-[11px] block">Computer Vision & OCR Evidence</span>
                <p className="text-pm-textSecondary text-[11px]">
                  Detected via YOLOv8 with confidence {selectedProduct.confidence}%. EasyOCR normalized price tag ${selectedProduct.detectedPrice}.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-borderSubtle space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-300 text-[11px] block">PriceMind Database Context</span>
                <p className="text-pm-textSecondary text-[11px]">
                  Active baseline unit catalog price: ${selectedProduct.yourPrice}. 30-day volume: {selectedProduct.sales30d} units. Inventory status: {selectedProduct.availability}.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-borderSubtle space-y-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-300 text-[11px] block">Optimization Engine Rationale</span>
                <p className="text-pm-textSecondary text-[11px] leading-relaxed">
                  {selectedProduct.explanation}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailsModalOpen(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          ANALYSIS HISTORY MODAL
          ======================================================================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-5 rounded-2xl bg-pm-elevated border border-pm-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pm-borderSubtle">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-pm-text">Analysis History</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-pm-textMuted hover:text-pm-text cursor-pointer p-1 rounded-lg hover:bg-pm-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-borderSubtle flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-pm-text block">store_shelf.jpg</span>
                  <span className="text-[10px] text-pm-textDim">Oct 7, 2026 • 5 Products • 14 OCR Texts</span>
                </div>
                <Badge variant="success">Completed</Badge>
              </div>
              <div className="p-3 rounded-xl bg-pm-subtle border border-pm-borderSubtle flex items-center justify-between opacity-70">
                <div>
                  <span className="text-xs font-bold text-pm-text block">electronics_retail_aisle.jpg</span>
                  <span className="text-[10px] text-pm-textDim">Oct 5, 2026 • 3 Products • 8 OCR Texts</span>
                </div>
                <Badge variant="success">Completed</Badge>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualIntelligence;
