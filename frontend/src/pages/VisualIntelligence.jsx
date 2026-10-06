import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Camera,
  Upload,
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Sliders,
  Bot,
  HelpCircle,
  FileText,
  Boxes,
  Check,
  Zap,
  Tag,
  ShieldCheck,
  Video,
  VideoOff,
  Image as ImageIcon,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';

// UI Components
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { useToast } from '../components/ui/ToastProvider';

const SAMPLE_SHELF_IMAGES = [
  {
    id: 'tvs',
    name: 'competitor_tv_wall.jpg',
    size: '2.4 MB',
    resolution: '1920x1080',
    title: 'Consumer Electronics Shelf (TVs)',
    thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'appliances',
    name: 'retail_home_appliances.jpg',
    size: '3.1 MB',
    resolution: '2048x1152',
    title: 'Retail Store Aisle (Appliances)',
    thumbnail: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hardware',
    name: 'industrial_tools_rack.jpg',
    size: '1.8 MB',
    resolution: '1920x1080',
    title: 'Hardware & Tools Display',
    thumbnail: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
  },
];

const DEFAULT_DETECTIONS = [
  {
    id: 'det-1',
    productName: 'LG 55" 4K UHD Smart TV',
    skuCode: 'SKU-TV-001',
    detectedPrice: 549.99,
    confidence: 0.94,
    brand: 'LG',
    box: { top: 12, left: 6, width: 42, height: 72 },
    priceTagBox: { top: 72, left: 16, width: 22, height: 14 },
    yourPrice: 579.99,
    priceDiffPct: -5.17,
    elasticity: -1.25,
    sales30d: 940,
    availability: 'In Stock',
    recommendedPrice: 539.99,
    recommendedDeltaPct: -6.9,
    volumeLift: 185,
    revenueLift: 24500,
    profitLift: 9800,
    explanation:
      'Competitor is discounting LG 55" by 5.2% below our catalog. Elasticity (-1.25) indicates reducing our price to $539.99 recaptures market volume yielding +$9.8K/mo profit lift.',
  },
  {
    id: 'det-2',
    productName: 'Samsung 55" QLED 4K TV',
    skuCode: 'SKU-TV-002',
    detectedPrice: 599.99,
    confidence: 0.96,
    brand: 'Samsung',
    box: { top: 12, left: 52, width: 42, height: 72 },
    priceTagBox: { top: 72, left: 62, width: 22, height: 14 },
    yourPrice: 619.99,
    priceDiffPct: -3.23,
    elasticity: -0.42,
    sales30d: 1240,
    availability: 'In Stock',
    recommendedPrice: 589.99,
    recommendedDeltaPct: -4.8,
    volumeLift: 210,
    revenueLift: 28600,
    profitLift: 11400,
    explanation:
      'The recommended price of $589.99 is 4.8% lower than your current price and slightly below the competitor price. Based on the demand elasticity of -0.42, a lower price is expected to increase demand by approximately 210 units per month, resulting in an estimated $11.4K increase in gross profit.',
  },
  {
    id: 'det-3',
    productName: 'Sony 55" Bravia XR TV',
    skuCode: 'SKU-TV-003',
    detectedPrice: 649.99,
    confidence: 0.92,
    brand: 'Sony',
    box: { top: 22, left: 6, width: 42, height: 62 },
    priceTagBox: { top: 74, left: 16, width: 22, height: 14 },
    yourPrice: 629.99,
    priceDiffPct: 3.17,
    elasticity: -0.75,
    sales30d: 680,
    availability: 'Low Stock',
    recommendedPrice: 639.99,
    recommendedDeltaPct: 1.6,
    volumeLift: -15,
    revenueLift: 16200,
    profitLift: 14200,
    explanation:
      'Competitor raised price to $649.99 with low on-shelf inventory. Price expansion to $639.99 captures higher margin while maintaining price competitiveness.',
  },
  {
    id: 'det-4',
    productName: 'TCL 55" 4K Smart TV',
    skuCode: 'SKU-TV-004',
    detectedPrice: 499.99,
    confidence: 0.91,
    brand: 'TCL',
    box: { top: 22, left: 52, width: 42, height: 62 },
    priceTagBox: { top: 74, left: 62, width: 22, height: 14 },
    yourPrice: 489.99,
    priceDiffPct: 2.04,
    elasticity: -1.85,
    sales30d: 1850,
    availability: 'In Stock',
    recommendedPrice: 489.99,
    recommendedDeltaPct: 0.0,
    volumeLift: 0,
    revenueLift: 0,
    profitLift: 0,
    explanation:
      'Our catalog price ($489.99) already beats competitor shelf price ($499.99) by 2.0%. Keep existing price point to preserve velocity.',
  },
];

export function VisualIntelligence() {
  const { setActivePage, setSelectedRecommendationForEvidence, currency } = useAppStore();
  const toast = useToast();

  // State
  const [activeImage, setActiveImage] = useState(SAMPLE_SHELF_IMAGES[0]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(100);
  const [detections, setDetections] = useState(DEFAULT_DETECTIONS);
  const [selectedDetectionId, setSelectedDetectionId] = useState('det-2'); // default Samsung TV
  const [pipelineStep, setPipelineStep] = useState(6);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const selectedProduct = useMemo(
    () => detections.find((d) => d.id === selectedDetectionId) || detections[0],
    [detections, selectedDetectionId]
  );

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Start webcam
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Camera Access Denied', 'Please allow webcam permissions or upload an image file.');
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture frame from webcam
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');

    handleStopCamera();
    setActiveImage({
      id: 'camera-snapshot',
      name: 'live_shelf_snapshot.jpg',
      size: '1.2 MB',
      resolution: `${canvas.width}x${canvas.height}`,
      title: 'Live Camera Capture',
      thumbnail: dataUrl,
    });
    runVisionPipeline();
  };

  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setActiveImage({
        id: 'uploaded-file',
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        resolution: '1920x1080',
        title: 'Uploaded Store Photo',
        thumbnail: event.target.result,
      });
      runVisionPipeline();
    };
    reader.readAsDataURL(file);
  };

  // Trigger analysis simulation
  const runVisionPipeline = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    setPipelineStep(1);

    const formData = new FormData();
    formData.append('sample_id', activeImage?.id || 'tvs');

    try {
      setTimeout(() => { setAnalysisProgress(40); setPipelineStep(2); }, 300);
      setTimeout(() => { setAnalysisProgress(70); setPipelineStep(3); }, 700);
      setTimeout(() => { setAnalysisProgress(90); setPipelineStep(4); }, 1100);

      const response = await apiClient.analyzeShelfImage(formData);

      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(100);
        setPipelineStep(6);
        if (response?.detected_products) {
          const mapped = response.detected_products.map((p) => ({
            id: p.id,
            productName: p.product_name,
            skuCode: p.matched_sku_code || 'SKU-001',
            detectedPrice: p.detected_price,
            confidence: p.confidence_score,
            brand: p.detected_brand,
            box: { top: p.bounding_box.y, left: p.bounding_box.x, width: p.bounding_box.width, height: p.bounding_box.height },
            priceTagBox: { top: p.price_tag_box.y, left: p.price_tag_box.x, width: p.price_tag_box.width, height: p.price_tag_box.height },
            yourPrice: p.catalog_price || p.detected_price * 1.05,
            priceDiffPct: p.price_difference_pct || -3.2,
            elasticity: p.demand_elasticity || -0.42,
            sales30d: 1240,
            availability: p.stock_status,
            recommendedPrice: p.recommended_price || p.detected_price * 0.98,
            recommendedDeltaPct: p.recommended_delta_pct || -4.8,
            volumeLift: p.volume_lift_units || 210,
            revenueLift: p.revenue_lift || 28600,
            profitLift: p.profit_lift || 11400,
            explanation: p.explanation,
          }));
          setDetections(mapped);
          setSelectedDetectionId(mapped[0]?.id || 'det-1');
        }
        toast.success('Vision Analysis Complete', 'Extracted 4 products with price tags & generated recommendations.');
      }, 1400);
    } catch (err) {
      setIsAnalyzing(false);
      setAnalysisProgress(100);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          1. HEADER & TOP BANNER
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold text-white tracking-tight">Visual Pricing Intelligence</h1>
            <Badge variant="indigo" size="sm" className="font-mono">COMPUTER VISION + OCR</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Automated in-store shelf scanning, real-time competitor price tag extraction, and AI demand elasticity recommendations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] text-xs">
            {SAMPLE_SHELF_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setActiveImage(sample);
                  handleStopCamera();
                  runVisionPipeline();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeImage?.id === sample.id && !isCameraActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sample.title.split(' ')[0]}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={isCameraActive ? VideoOff : Camera}
            onClick={isCameraActive ? handleStopCamera : handleStartCamera}
            className="text-xs"
          >
            {isCameraActive ? 'Close Camera' : 'Live Camera'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            loading={isAnalyzing}
            onClick={runVisionPipeline}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold text-white"
          >
            Re-Analyze Shelf
          </Button>
        </div>
      </div>

      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* =========================================================================
          2. STEP 1 & 2: IMAGE INPUT & VISION ANALYSIS CANVAS
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Step 1: Upload Store Image / Camera (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Upload Store Image</h3>
                <p className="text-[11px] text-slate-400">Upload a shelf image from a competitor store.</p>
              </div>
            </div>

            {/* Dropzone */}
            <label className="mt-3 border-2 border-dashed border-white/[0.12] hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#090D16]/50 hover:bg-[#090D16] transition-all group">
              <Upload className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white">Drag and drop an image here</span>
              <span className="text-[10px] text-slate-400 mt-1">or</span>
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
                Choose Image
              </div>
              <span className="text-[10px] text-slate-500 mt-2 font-mono">Supported formats: JPG, PNG (Max 10MB)</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>

            {/* Active Thumbnail Card */}
            <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/[0.10] flex-shrink-0 bg-slate-900">
                  <img src={activeImage?.thumbnail} alt="Shelf thumbnail" className="w-full h-full object-cover" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold text-white truncate block">{activeImage?.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">{activeImage?.size} • {activeImage?.resolution}</span>
                </div>
              </div>
              <Badge variant="success" size="sm">Loaded</Badge>
            </div>
          </div>

          {/* Quick Camera Capture Trigger */}
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <Button
              variant="outline"
              size="sm"
              icon={Camera}
              onClick={handleStartCamera}
              className="w-full text-xs"
            >
              Open Live Camera Scanner
            </Button>
          </div>
        </div>

        {/* Step 2: Vision Analysis with YOLO Bounding Boxes (8 Cols) */}
        <div className="lg:col-span-8 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Vision Analysis
                    {isAnalyzing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Detecting products, reading shelf tags, and extracting competitive intelligence...
                  </p>
                </div>
              </div>
              <Badge variant="indigo" size="sm" className="font-mono">YOLOv8 + OCR</Badge>
            </div>

            {/* Interactive Image Frame with Live Overlays */}
            <div className="relative rounded-xl overflow-hidden border border-white/[0.12] bg-[#070A11] h-72 sm:h-80 w-full flex items-center justify-center select-none group">
              {isCameraActive ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    <Button variant="primary" size="sm" icon={Camera} onClick={handleCaptureSnapshot} className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold">
                      Capture Snapshot
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleStopCamera} className="text-xs bg-slate-900/80">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Background Shelf Image */}
                  <img
                    src={activeImage?.thumbnail}
                    alt="Shelf Scan"
                    className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.02]"
                  />

                  {/* Dynamic YOLO Bounding Boxes */}
                  {detections.map((det) => {
                    const isSelected = det.id === selectedDetectionId;
                    return (
                      <div
                        key={det.id}
                        onClick={() => setSelectedDetectionId(det.id)}
                        className={`absolute border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.6)] z-20 scale-[1.01]'
                            : 'border-emerald-400/80 bg-emerald-500/10 hover:border-emerald-300 z-10'
                        }`}
                        style={{
                          top: `${det.box.top}%`,
                          left: `${det.box.left}%`,
                          width: `${det.box.width}%`,
                          height: `${det.box.height}%`,
                        }}
                      >
                        {/* Object Label Tag */}
                        <div
                          className={`absolute -top-6 left-0 px-2 py-0.5 rounded-t-md font-mono text-[10px] font-bold flex items-center gap-1 shadow-md ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          <span>{det.brand} TV</span>
                          <span className="opacity-80">{(det.confidence * 100).toFixed(0)}%</span>
                        </div>

                        {/* OCR Price Tag Overlay */}
                        <div
                          className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-mono font-extrabold text-xs shadow-lg border border-amber-300 flex items-center gap-1 animate-pulse`}
                        >
                          <Tag className="w-3 h-3 text-slate-900" />
                          <span>${det.detectedPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Checklist & Progress Pipeline */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-4 gap-y-1.5 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Detecting products (YOLO)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reading price tags (OCR)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matching catalog SKUs
              </span>
              <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Elasticity insights
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-mono text-slate-400">Pipeline:</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{analysisProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. STEPS 3, 4, 5: EXTRACTED PRODUCTS, COMPETITOR COMPARISON, & RECOMMENDATION
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Step 3: Extracted Products Table (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Extracted Products</h3>
                  <p className="text-[11px] text-slate-400">Products and prices detected from image.</p>
                </div>
              </div>
              <Badge variant="neutral" size="sm">{detections.length} Detected</Badge>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {detections.map((prod) => {
                const isSelected = prod.id === selectedDetectionId;
                return (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedDetectionId(prod.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/50 shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold flex-shrink-0">
                        {prod.brand.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white truncate block">{prod.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{prod.skuCode}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="font-mono font-bold text-white text-xs">{formatCurrency(prod.detectedPrice)}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full mt-0.5">
                        {(prod.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 4: Competitor Comparison (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                  4
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Competitor Comparison</h3>
                  <p className="text-[11px] text-slate-400">Compare with your current catalog.</p>
                </div>
              </div>
            </div>

            {/* Selected Product Banner */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] mb-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{selectedProduct?.productName}</span>
                <span className="text-[10px] text-indigo-400 font-mono block mt-0.5">{selectedProduct?.skuCode}</span>
              </div>
              <Badge variant="indigo" size="sm">{selectedProduct?.brand}</Badge>
            </div>

            {/* Comparison Metrics */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Your Catalog Price</span>
                <span className="text-white font-bold">{formatCurrency(selectedProduct?.yourPrice)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Competitor Shelf Price</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">{formatCurrency(selectedProduct?.detectedPrice)}</span>
                  <Badge variant={selectedProduct?.priceDiffPct < 0 ? 'danger' : 'success'} size="sm">
                    {formatPercent(selectedProduct?.priceDiffPct, true)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Demand Elasticity</span>
                <span className="text-amber-400 font-bold">{selectedProduct?.elasticity}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Your Sales (30 Days)</span>
                <span className="text-slate-200">{formatNumber(selectedProduct?.sales30d)} units</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Competitor Availability</span>
                <span className="text-emerald-400 font-semibold">{selectedProduct?.availability}</span>
              </div>
            </div>
          </div>

          {/* Competitor Context Insight */}
          <div className="mt-3.5 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              Competitor is pricing {Math.abs(selectedProduct?.priceDiffPct || 0).toFixed(1)}% {selectedProduct?.priceDiffPct < 0 ? 'lower' : 'higher'}. Demand is price sensitive ({selectedProduct?.elasticity}).
            </span>
          </div>
        </div>

        {/* Step 5: Pricing Recommendation (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                  5
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Pricing Recommendation</h3>
                  <p className="text-[11px] text-slate-400">AI-powered pricing optimization.</p>
                </div>
              </div>
              <Tooltip content="Optimized using empirical elasticity model" position="top">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              </Tooltip>
            </div>

            {/* Recommended Price Hero Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/15 to-cyan-500/10 border border-indigo-500/30 mb-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Recommended Price</span>
                <span className="text-2xl font-bold font-mono text-white tracking-tight mt-0.5 block">
                  {formatCurrency(selectedProduct?.recommendedPrice)}
                </span>
              </div>
              <Badge
                variant={selectedProduct?.recommendedDeltaPct < 0 ? 'danger' : 'success'}
                size="md"
                className="font-mono text-xs font-bold"
              >
                {formatPercent(selectedProduct?.recommendedDeltaPct, true)}
              </Badge>
            </div>

            {/* Expected Impact Telemetry */}
            <div className="space-y-2 text-xs font-mono">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">Expected Impact (Monthly):</span>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Estimated Volume Lift</span>
                <span className="text-emerald-400 font-bold">+{formatNumber(selectedProduct?.volumeLift)} units</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Revenue Increase</span>
                <span className="text-emerald-400 font-bold">+{formatCurrency(selectedProduct?.revenueLift, currency, true)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Gross Profit Impact</span>
                <span className="text-emerald-400 font-bold">+{formatCurrency(selectedProduct?.profitLift, currency, true)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              onClick={() => setActivePage('simulator')}
              className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold text-white"
            >
              Simulate This Price
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              onClick={() => setActivePage('pricing')}
              className="w-full text-xs"
            >
              View Full Pricing Opportunities
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. STEP 6: AI EXPLANATION & COPILOT CITATION
          ========================================================================= */}
      <div className="bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.08] mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
              6
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Strategy & Competitive Explanation
              </h3>
              <p className="text-[11px] text-slate-400">Get a clear explanation of the recommendation.</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={Bot}
            onClick={() => setActivePage('assistant')}
            className="text-xs text-indigo-400 hover:text-white"
          >
            Ask Follow-up in Copilot
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedProduct?.explanation}
            </p>
          </div>

          <div className="md:col-span-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Data Sources & Models:</span>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>• Competitor store shelf image OCR</div>
              <div>• Spline demand elasticity model (-0.42)</div>
              <div>• Real-time price optimization gateway</div>
              <div>• Trailing 30-day velocity records</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisualIntelligence;
