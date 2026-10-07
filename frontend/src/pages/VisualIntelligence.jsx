import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  Boxes,
  Zap,
  Tag,
  Video,
  VideoOff,
  Image as ImageIcon,
  Copy,
  Check,
  Code,
  Layers,
  Sparkles,
  Trash2,
  X,
  Play,
  Info,
  RotateCcw,
  DollarSign,
  Type,
  Target,
  Clock,
  ShieldAlert,
  SearchX,
  Building2,
  Store,
  Database,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingBag,
  BadgePercent,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Activity,
  BarChart3,
  History,
  PackageCheck,
  PackageX,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';

// UI Components
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { useToast } from '../components/ui/ToastProvider';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SAMPLE_PRESETS = [
  {
    id: 'shelf_electronics',
    title: 'Electronics & TV Wall',
    filename: 'competitor_shelf_tv_wall.jpg',
    size: '2.4 MB',
    url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'shelf_groceries',
    title: 'Retail Packaged Goods',
    filename: 'supermarket_shelf_aisle.jpg',
    size: '1.9 MB',
    url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'shelf_tools',
    title: 'Hardware & Tools Rack',
    filename: 'industrial_hardware_rack.jpg',
    size: '2.1 MB',
    url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1000&q=80',
  },
];

export function VisualIntelligence() {
  const toast = useToast();

  // Image Selection State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(SAMPLE_PRESETS[0].url);
  const [fileMeta, setFileMeta] = useState({
    name: SAMPLE_PRESETS[0].filename,
    size: SAMPLE_PRESETS[0].size,
    type: 'image/jpeg',
  });
  const [activePreset, setActivePreset] = useState(SAMPLE_PRESETS[0]);

  // Live Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCameraCapture, setIsCameraCapture] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  // Vision Pipeline State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [visionResult, setVisionResult] = useState(null);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [activeTab, setActiveTab] = useState('objects'); // 'objects' | 'prices' | 'ocr' | 'matches' | 'competitor' | 'context' | 'json'
  const [copiedJson, setCopiedJson] = useState(false);

  // Overlay Toggles
  const [showObjectBoxes, setShowObjectBoxes] = useState(true);
  const [showOcrBoxes, setShowOcrBoxes] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera tracks cleanly on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Synchronize camera stream to video element whenever active
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((e) => console.warn('Webcam auto-play notice:', e));
    }
  }, [isCameraActive, cameraStream]);

  // Auto-analyze initial sample
  useEffect(() => {
    runSampleAnalysis(SAMPLE_PRESETS[0]);
  }, []);

  // ── 1. Image Validation Helper ───────────────────────────────────────────────
  const validateFile = (file) => {
    if (!file) return 'No file selected.';

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type);
    const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

    if (!isMimeValid && !isExtValid) {
      return `Invalid format '${ext}'. Please upload a JPG, JPEG, PNG, or WEBP image.`;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${mb} MB) exceeds maximum allowed limit of 10 MB.`;
    }

    if (file.size === 0) {
      return 'Selected file is empty (0 bytes).';
    }

    return null;
  };

  // ── 2. Select & Preview Image ────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      toast.error('Validation Error', validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setActivePreset(null);
    setIsCameraCapture(false);
    stopLiveCamera();

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    setFileMeta({
      name: file.name,
      size: sizeFormatted,
      type: file.type || 'image/jpeg',
    });

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);

    toast.success('Image Selected', `${file.name} (${sizeFormatted}) ready for analysis.`);
  };

  // ── 3. Remove / Reselect Image ───────────────────────────────────────────────
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileMeta(null);
    setActivePreset(null);
    setVisionResult(null);
    setIsCameraCapture(false);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopLiveCamera();
    toast.info('Image Cleared', 'You can now select or capture another image.');
  };

  // ── 4. Live Camera Handlers ───────────────────────────────────────────────────
  const startLiveCamera = async () => {
    setErrorMessage(null);
    setVisionResult(null);

    // 1. Browser compatibility check
    if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Live Camera API is not supported in this browser or environment (requires HTTPS or localhost).';
      setErrorMessage(msg);
      toast.error('Browser Unsupported', msg);
      return;
    }

    setIsStartingCamera(true);

    try {
      // 2. Request user media stream with environment facing mode fallback
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        });
      } catch (constraintErr) {
        // Fallback to generic webcam constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      // 3. Attach track termination listener
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          toast.warning('Camera Closed', 'The webcam stream was stopped or disconnected.');
          stopLiveCamera();
        };
      }

      setCameraStream(stream);
      setIsCameraActive(true);
      setSelectedFile(null);
      setActivePreset(null);
      setPreviewUrl(null);
      setIsCameraCapture(false);
      toast.success('Camera Live', 'Align your camera with the store shelf and click "Capture Snapshot".');
    } catch (err) {
      let friendlyMessage = 'Could not access camera device.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMessage = 'Camera permission was denied. Please allow camera permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMessage = 'No camera device found on this system. Please connect a webcam.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        friendlyMessage = 'Camera is already in use by another application or tab. Please close other camera apps and retry.';
      } else if (err.name === 'OverconstrainedError') {
        friendlyMessage = 'Camera constraints could not be satisfied by available video hardware.';
      } else if (err.name === 'SecurityError') {
        friendlyMessage = 'Camera access was blocked by browser security policy (requires HTTPS or localhost).';
      } else if (err.message) {
        friendlyMessage = `Camera error: ${err.message}`;
      }
      setErrorMessage(friendlyMessage);
      toast.error('Camera Access Error', friendlyMessage);
      stopLiveCamera();
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    const dataUri = canvas.toDataURL('image/jpeg', 0.92);

    // Stop camera stream after capture to avoid continuous power/battery consumption
    stopLiveCamera();

    setPreviewUrl(dataUri);
    setSelectedFile(null);
    setActivePreset(null);
    setIsCameraCapture(true);
    setVisionResult(null);

    const approxSizeKb = Math.round((dataUri.length * 3) / 4 / 1024);
    setFileMeta({
      name: `webcam_snap_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.jpg`,
      size: `${approxSizeKb} KB`,
      type: 'image/jpeg',
    });

    toast.success('Snapshot Captured', 'Preview ready. Click "Analyze Image" to run YOLO + OCR.');
  };

  // ── 5. Analyze Image (Backend Trigger) ─────────────────────────────────────────
  const handleAnalyzeImage = async () => {
    if (!previewUrl && !selectedFile && !activePreset) {
      toast.error('No Image', 'Please select an image or take a photo first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    const formData = new FormData();

    if (selectedFile) {
      formData.append('file', selectedFile);
    } else if (previewUrl && previewUrl.startsWith('data:image')) {
      formData.append('image_base64', previewUrl);
    } else if (activePreset) {
      formData.append('sample_id', activePreset.id);
    }

    try {
      const response = await apiClient.analyzeShelfImage(formData);

      if (response && response.status === 'success') {
        setVisionResult(response);
        toast.success(
          'Analysis Complete',
          `Detected ${response.detected_objects_count} objects and ${response.detected_text_count} OCR price tags in ${response.processing_stats.total_pipeline_time_ms} ms.`
        );
      } else {
        throw new Error(response?.detail || 'Backend analysis returned an error.');
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
      setErrorMessage(err.message || 'Vision analysis failed.');
      toast.error('Analysis Failed', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runSampleAnalysis = async (preset) => {
    setActivePreset(preset);
    setSelectedFile(null);
    setIsCameraCapture(false);
    setPreviewUrl(preset.url);
    setFileMeta({
      name: preset.filename,
      size: preset.size,
      type: 'image/jpeg',
    });
    stopLiveCamera();

    const formData = new FormData();
    formData.append('sample_id', preset.id);

    try {
      const res = await apiClient.analyzeShelfImage(formData);
      if (res && res.status === 'success') {
        setVisionResult(res);
      }
    } catch (_) {}
  };

  const copyJsonToClipboard = () => {
    if (!visionResult) return;
    navigator.clipboard.writeText(JSON.stringify(visionResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    toast.success('JSON Copied', 'Structured vision response copied to clipboard.');
  };

  // Derived Results & Filtering
  const detectedObjects = visionResult?.detected_objects || [];
  const allTextLabels = visionResult?.detected_text_and_prices || [];
  const detectedPrices = allTextLabels.filter((t) => t.is_price_tag || t.extracted_price !== null);
  const detectedTextRegions = allTextLabels.filter((t) => !t.is_price_tag && t.extracted_price === null);
  const matchedProducts = visionResult?.matched_products || [];
  const competitorInsights = visionResult?.competitor_intelligence || [];
  const pricemindContexts = visionResult?.pricemind_contexts || [];

  const hasLowConfidence = detectedObjects.some((o) => o.confidence < 0.4) || allTextLabels.some((t) => t.confidence < 0.4);

  return (
    <div className="flex flex-col gap-6 w-full font-sans max-w-7xl mx-auto pb-16">
      {/* Hidden Snapshot Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* =========================================================================
          1. HEADER
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold text-white tracking-tight">Computer Vision & In-Store OCR</h1>
            <Badge variant="indigo" size="sm" className="font-mono">VISUAL INTELLIGENCE</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Upload images or capture live camera frames to run YOLO object detection and EasyOCR multi-currency price parsing.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Sample Preset Buttons */}
          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] text-xs">
            {SAMPLE_PRESETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => runSampleAnalysis(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePreset?.id === s.id && !selectedFile && !isCameraActive && !isCameraCapture
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.title.split(' ')[0]}
              </button>
            ))}
          </div>

          <Button
            variant={isCameraActive ? "danger" : "outline"}
            size="sm"
            loading={isStartingCamera}
            icon={isCameraActive ? VideoOff : Camera}
            onClick={isCameraActive ? stopLiveCamera : startLiveCamera}
            className={`text-xs transition-all ${
              isCameraActive ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-lg' : ''
            }`}
          >
            {isCameraActive ? 'Stop Camera' : 'Live Camera'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
          >
            {selectedFile ? 'Change File' : 'Select Image'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Analysis Failure Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div>
              <span className="font-semibold block text-rose-200">Analysis Error</span>
              <span className="text-slate-300">{errorMessage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {previewUrl && (
              <Button variant="outline" size="xs" onClick={handleAnalyzeImage} className="text-xs text-rose-300 border-rose-500/30">
                Retry Analysis
              </Button>
            )}
            <Button variant="ghost" size="xs" onClick={() => setErrorMessage(null)} className="text-rose-400">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. SELECTION & PREVIEW CONTROLS CARD
          ========================================================================= */}
      <div className="p-4 rounded-2xl bg-[#0D1524]/60 backdrop-blur-md border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        {/* Selected Image Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/[0.12] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
            {isCameraActive ? (
              <Video className="w-6 h-6 text-emerald-400 animate-pulse" />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white truncate">
                {isCameraActive ? 'Live Camera Feed' : fileMeta?.name || 'No image selected'}
              </span>
              {isCameraActive && <Badge variant="success" size="sm" className="animate-pulse">Streaming</Badge>}
              {isCameraCapture && <Badge variant="warning" size="sm">Webcam Snapshot</Badge>}
              {selectedFile && <Badge variant="indigo" size="sm">Local File</Badge>}
              {activePreset && !isCameraCapture && <Badge variant="neutral" size="sm">Preset</Badge>}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-3 flex-wrap">
              <span>{isCameraActive ? 'Target: 1080p / 720p' : `Size: ${fileMeta?.size || '—'}`}</span>
              <span>•</span>
              <span>{isCameraActive ? 'Mode: Live Viewfinder' : `Format: ${fileMeta?.type || '—'}`}</span>
              <span>•</span>
              <span className="text-slate-500">Max limit: 10 MB</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {isCameraCapture && (
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={startLiveCamera}
              className="text-xs text-amber-300 hover:text-amber-200 border-amber-500/30 hover:bg-amber-500/10"
            >
              Retake Photo
            </Button>
          )}

          {previewUrl && !isCameraActive && (
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={handleRemoveImage}
              className="text-xs text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10"
            >
              Remove
            </Button>
          )}

          {!isCameraActive && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              loading={isAnalyzing}
              disabled={!previewUrl || isAnalyzing}
              onClick={handleAnalyzeImage}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
            >
              {isAnalyzing ? 'Analyzing Image…' : 'Analyze Image'}
            </Button>
          )}
        </div>
      </div>

      {/* =========================================================================
          3. ANALYSIS SUMMARY KPI RIBBON
          ========================================================================= */}
      {visionResult && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* KPI 1: Objects Detected */}
          <div className="p-3.5 rounded-2xl bg-[#0D1524]/70 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Objects</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Boxes className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {detectedObjects.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {detectedObjects.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          {/* KPI 2: Text Regions */}
          <div className="p-3.5 rounded-2xl bg-[#0D1524]/70 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Text Tags</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Type className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-indigo-300">
                {allTextLabels.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">regions</span>
            </div>
          </div>

          {/* KPI 3: Prices Extracted */}
          <div className="p-3.5 rounded-2xl bg-[#0D1524]/70 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Prices</span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {detectedPrices.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">detected</span>
            </div>
          </div>

          {/* KPI 4: Catalog Matches */}
          <div className="p-3.5 rounded-2xl bg-[#0D1524]/70 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Matches</span>
              <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Database className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-teal-300">
                {matchedProducts.filter((m) => m.match_status === 'matched').length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                / {matchedProducts.length} items
              </span>
            </div>
          </div>

          {/* KPI 5: Competitor Intel */}
          <div className="p-3.5 rounded-2xl bg-[#0D1524]/70 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Competitor Intel</span>
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Store className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-purple-300">
                {competitorInsights.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {competitorInsights.filter((c) => c.competitor_info?.is_identified).length > 0 ? 'competitor tagged' : 'detected'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Low Confidence Warning Notice */}
      {hasLowConfidence && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            Some detections have confidence below 40%. For highest accuracy, ensure steady focus, adequate retail illumination, and upright shelf labels.
          </span>
        </div>
      )}

      {/* =========================================================================
          4. MAIN WORKSPACE: CANVAS (LEFT) + STRUCTURED RESULTS (RIGHT)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT (7 COLS): IMAGE CANVAS WITH BOUNDING BOXES */}
        <div className="lg:col-span-7 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {isCameraActive ? 'Live Camera Feed' : 'Vision Canvas & Detection Overlay'}
              </h2>
              {isAnalyzing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400 ml-1" />}
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showObjectBoxes}
                  onChange={(e) => setShowObjectBoxes(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-0"
                />
                <span className="text-[11px] text-emerald-400 font-mono">Object Boxes ({detectedObjects.length})</span>
              </label>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOcrBoxes}
                  onChange={(e) => setShowOcrBoxes(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-0"
                />
                <span className="text-[11px] text-amber-400 font-mono">OCR Tags ({allTextLabels.length})</span>
              </label>
            </div>
          </div>

          {/* Canvas Box */}
          <div className="relative w-full h-[400px] sm:h-[460px] rounded-xl overflow-hidden border border-white/[0.12] bg-[#070A11] flex items-center justify-center select-none group shadow-inner">
            {isCameraActive ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />

                {/* Viewfinder Target / Crosshair HUD */}
                <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-4">
                  <div className="flex justify-between items-start">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                    <div className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5 backdrop-blur-md">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>LIVE VIEW • ALIGN SHELF</span>
                    </div>
                    <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </div>

                {/* Live Camera Bottom Toolbar */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Camera}
                    onClick={captureCameraFrame}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] px-5 py-2"
                  >
                    Capture Snapshot
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopLiveCamera}
                    className="text-xs bg-slate-900/90 text-white border-white/20 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Shelf Scan"
                  className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.01]"
                />

                {/* Object Bounding Boxes Overlay */}
                {showObjectBoxes &&
                  detectedObjects.map((obj) => {
                    const isSelected = selectedBoxId === obj.id;
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedBoxId(obj.id)}
                        className={`absolute border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-500/25 shadow-[0_0_20px_rgba(99,102,241,0.7)] z-20 scale-[1.01]'
                            : 'border-emerald-400/90 bg-emerald-500/10 hover:border-emerald-300 z-10'
                        }`}
                        style={{
                          top: `${obj.box.y_percent}%`,
                          left: `${obj.box.x_percent}%`,
                          width: `${obj.box.width_percent}%`,
                          height: `${obj.box.height_percent}%`,
                        }}
                      >
                        <div
                          className={`absolute -top-6 left-0 px-2 py-0.5 rounded-t-md font-mono text-[10px] font-bold flex items-center gap-1 shadow-md whitespace-nowrap ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          <span>{obj.label}</span>
                          <span className="opacity-80">{(obj.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}

                {/* OCR Price Tags Overlay */}
                {showOcrBoxes &&
                  allTextLabels.map((ocr) => {
                    const isSelected = selectedBoxId === ocr.id;
                    const isPrice = ocr.is_price_tag || ocr.extracted_price !== null;
                    return (
                      <div
                        key={ocr.id}
                        onClick={() => setSelectedBoxId(ocr.id)}
                        className={`absolute border-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center ${
                          isPrice
                            ? 'border-dashed border-amber-300 bg-amber-400/20'
                            : 'border-dotted border-cyan-400/60 bg-cyan-500/10'
                        } ${
                          isSelected ? 'scale-105 z-30 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'z-20'
                        }`}
                        style={{
                          top: `${ocr.box.y_percent}%`,
                          left: `${ocr.box.x_percent}%`,
                          width: `${ocr.box.width_percent}%`,
                          height: `${ocr.box.height_percent}%`,
                        }}
                      >
                        {isPrice ? (
                          <div className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-extrabold text-[11px] shadow-lg flex items-center gap-1 whitespace-nowrap">
                            <Tag className="w-2.5 h-2.5 text-slate-950" />
                            <span>
                              {ocr.currency_symbol || '$'}
                              {ocr.extracted_price ? ocr.extracted_price.toFixed(2) : ocr.raw_text}
                            </span>
                          </div>
                        ) : (
                          <div className="px-1.5 py-0.5 rounded bg-slate-900/90 text-cyan-300 font-mono text-[9px] border border-cyan-500/30 whitespace-nowrap">
                            {ocr.raw_text}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </>
            ) : (
              <div className="text-center text-slate-500 text-xs p-6">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                <span>No image selected. Click "Select Image" or "Live Camera" above.</span>
              </div>
            )}
          </div>

          {/* Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Resolution</span>
              <span className="text-white font-bold block mt-0.5">
                {visionResult?.image_metadata?.width ? `${visionResult.image_metadata.width} × ${visionResult.image_metadata.height}` : '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Image Size</span>
              <span className="text-white font-bold block mt-0.5">
                {visionResult?.image_metadata?.size_kb ? `${visionResult.image_metadata.size_kb} KB` : fileMeta?.size || '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Objects / OCR</span>
              <span className="text-emerald-400 font-bold block mt-0.5">
                {detectedObjects.length} obj / {allTextLabels.length} txt
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Latency Breakdown</span>
              <span className="text-indigo-300 font-bold block mt-0.5 truncate" title={`Prep: ${visionResult?.processing_stats?.preprocessing_time_ms}ms, YOLO: ${visionResult?.processing_stats?.detection_time_ms}ms, OCR: ${visionResult?.processing_stats?.ocr_time_ms}ms`}>
                {visionResult?.processing_stats?.total_pipeline_time_ms ? `${visionResult.processing_stats.total_pipeline_time_ms} ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT (5 COLS): STRUCTURED RESULTS & DETAILED TABS */}
        <div className="lg:col-span-5 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Detection Results
            </h2>

            {/* Navigation Tabs */}
            <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/[0.08] text-xs font-mono flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('objects')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'objects' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Objects ({detectedObjects.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('prices')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'prices' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Prices ({detectedPrices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ocr')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'ocr' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Text ({allTextLabels.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'matches' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Matches ({matchedProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('competitor')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'competitor' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Competitor Intel ({competitorInsights.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('context')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'context' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                PriceMind Context ({pricemindContexts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'json' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3 h-3" /> JSON
              </button>
            </div>
          </div>

          {/* =========================================================================
              TAB 1: DETECTED OBJECTS
              ========================================================================= */}
          {activeTab === 'objects' && (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {!visionResult ? (
                <div className="text-center text-xs text-slate-500 py-12 flex flex-col items-center gap-2">
                  <ScanEye className="w-8 h-8 text-slate-600 opacity-60" />
                  <span>Click "Analyze Image" to run YOLO object detection.</span>
                </div>
              ) : detectedObjects.length === 0 ? (
                /* Clear State: No Objects Detected */
                <div className="text-center p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-2">
                  <SearchX className="w-8 h-8 text-slate-500 mb-1" />
                  <span className="text-xs font-bold text-slate-300">No Objects Detected</span>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    No relevant retail objects or products were identified above the confidence threshold. Try repositioning or adjusting lighting.
                  </p>
                </div>
              ) : (
                detectedObjects.map((obj) => {
                  const isSelected = selectedBoxId === obj.id;
                  const isLowConf = obj.confidence < 0.4;
                  return (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedBoxId(obj.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500/60 shadow-lg'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold flex-shrink-0">
                          {obj.id}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{obj.label}</span>
                            {isLowConf && (
                              <Badge variant="warning" size="sm" className="text-[9px] font-mono">
                                Low Conf
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Position: [{obj.box.x_percent}%, {obj.box.y_percent}%] • Dimensions: {obj.box.width_percent}% × {obj.box.height_percent}%
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <Badge
                          variant={obj.confidence >= 0.7 ? "success" : obj.confidence >= 0.4 ? "indigo" : "warning"}
                          size="sm"
                          className="font-mono"
                        >
                          {(obj.confidence * 100).toFixed(1)}% Conf
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono mt-1">
                          {obj.box.width_px}×{obj.box.height_px} px
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: DETECTED PRICES
              ========================================================================= */}
          {activeTab === 'prices' && (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {!visionResult ? (
                <div className="text-center text-xs text-slate-500 py-12 flex flex-col items-center gap-2">
                  <Tag className="w-8 h-8 text-slate-600 opacity-60" />
                  <span>Click "Analyze Image" to extract in-store price tags.</span>
                </div>
              ) : detectedPrices.length === 0 ? (
                /* Clear State: No Prices Detected */
                <div className="text-center p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-2">
                  <SearchX className="w-8 h-8 text-slate-500 mb-1" />
                  <span className="text-xs font-bold text-slate-300">No Prices Detected</span>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    No price-formatted text (e.g. $599.99, ₹1,299, €499) was recognized in this image. Ensure shelf tags are in clear focus.
                  </p>
                </div>
              ) : (
                detectedPrices.map((priceItem) => {
                  const isSelected = selectedBoxId === priceItem.id;
                  const isLowConf = priceItem.confidence < 0.4;
                  return (
                    <div
                      key={priceItem.id}
                      onClick={() => setSelectedBoxId(priceItem.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-lg'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 font-mono text-sm font-bold flex-shrink-0">
                          {priceItem.currency_symbol || '$'}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-300 font-mono">
                              {priceItem.raw_text}
                            </span>
                            <Badge variant="warning" size="sm" className="font-mono text-[9px]">
                              Price Tag
                            </Badge>
                            {isLowConf && (
                              <Badge variant="danger" size="sm" className="text-[9px] font-mono">
                                Low Conf
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Normalized Value: <span className="text-white font-bold">{priceItem.currency_symbol || '$'}{priceItem.extracted_price?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-sm font-mono font-extrabold text-white">
                          {priceItem.currency_symbol || '$'}{priceItem.extracted_price ? priceItem.extracted_price.toFixed(2) : priceItem.raw_text}
                        </span>
                        <Badge variant="neutral" size="sm" className="font-mono mt-1 text-[10px]">
                          {(priceItem.confidence * 100).toFixed(1)}% OCR
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: DETECTED TEXT / OCR
              ========================================================================= */}
          {activeTab === 'ocr' && (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {!visionResult ? (
                <div className="text-center text-xs text-slate-500 py-12 flex flex-col items-center gap-2">
                  <Type className="w-8 h-8 text-slate-600 opacity-60" />
                  <span>Click "Analyze Image" to view detected text regions.</span>
                </div>
              ) : allTextLabels.length === 0 ? (
                /* Clear State: No Text Detected */
                <div className="text-center p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-2">
                  <SearchX className="w-8 h-8 text-slate-500 mb-1" />
                  <span className="text-xs font-bold text-slate-300">No Text Detected</span>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    The EasyOCR engine did not detect any readable text strings in this image.
                  </p>
                </div>
              ) : (
                allTextLabels.map((txt) => {
                  const isSelected = selectedBoxId === txt.id;
                  const isPrice = txt.is_price_tag || txt.extracted_price !== null;
                  return (
                    <div
                      key={txt.id}
                      onClick={() => setSelectedBoxId(txt.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500/50 shadow-lg'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 ${
                          isPrice ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' : 'bg-slate-800 border border-white/10 text-cyan-400'
                        }`}>
                          {isPrice ? '$' : 'T'}
                        </div>
                        <div className="truncate">
                          <span className={`text-xs font-bold font-mono truncate block ${isPrice ? 'text-amber-300' : 'text-white'}`}>
                            {txt.raw_text}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Type: {isPrice ? 'Price Tag' : 'Text Region'} • Box: [{txt.box.x_percent}%, {txt.box.y_percent}%]
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <Badge variant={isPrice ? "warning" : "neutral"} size="sm" className="font-mono text-[10px]">
                          {(txt.confidence * 100).toFixed(1)}% Conf
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono mt-1">
                          {txt.box.width_px}×{txt.box.height_px} px
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 5: PRODUCT CATALOG MATCHES
              ========================================================================= */}
          {activeTab === 'matches' && (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {!visionResult ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-xs gap-2">
                  <span className="text-2xl">🔍</span>
                  <span>Analyze an image to see product catalog matches</span>
                </div>
              ) : matchedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-xs gap-2">
                  <span className="text-2xl">📦</span>
                  <span>No catalog matches found</span>
                  <span className="text-slate-600 text-[11px]">Try an image with visible product labels or brand names</span>
                </div>
              ) : (
                matchedProducts.map((match, idx) => {
                  const isMatched = match.match_status === 'matched';
                  const isPossible = match.match_status === 'possible_match';
                  const isUnmatched = match.match_status === 'unmatched';
                  const pct = Math.round((match.match_confidence || 0) * 100);
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isMatched
                          ? 'bg-emerald-900/20 border-emerald-500/30'
                          : isPossible
                          ? 'bg-amber-900/20 border-amber-500/30'
                          : 'bg-white/[0.03] border-white/[0.08]'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                            {match.detected_label}
                          </span>
                          <span className="text-slate-600">→</span>
                          <span className={`text-[11px] font-semibold ${isMatched ? 'text-emerald-400' : isPossible ? 'text-amber-400' : 'text-slate-500'}`}>
                            {match.matched_product ? match.matched_product.name : 'No catalog match'}
                          </span>
                        </div>
                        {/* Status badge */}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isMatched ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isPossible ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700/40 text-slate-500 border border-slate-600/30'
                        }`}>
                          {isMatched ? 'Matched' : isPossible ? 'Possible' : 'Unmatched'}
                        </span>
                      </div>

                      {/* Matched Product Details */}
                      {match.matched_product && (
                        <div className="grid grid-cols-2 gap-2 mb-2.5 text-[11px]">
                          <div>
                            <span className="text-slate-500 uppercase tracking-wider text-[10px]">SKU</span>
                            <p className="text-slate-200 font-mono">{match.matched_product.sku}</p>
                          </div>
                          {match.matched_product.brand && (
                            <div>
                              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Brand</span>
                              <p className="text-slate-200">{match.matched_product.brand}</p>
                            </div>
                          )}
                          {match.matched_product.category && (
                            <div>
                              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Category</span>
                              <p className="text-slate-300">{match.matched_product.category}</p>
                            </div>
                          )}
                          {match.matched_product.current_price != null && (
                            <div>
                              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Catalog Price</span>
                              <p className="text-emerald-400 font-semibold">₹{match.matched_product.current_price?.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confidence bar */}
                      <div className="mb-1.5">
                        <div className="flex justify-between items-center mb-1 text-[10px]">
                          <span className="text-slate-500 uppercase tracking-wider">Match Confidence</span>
                          <span className={`font-bold ${isMatched ? 'text-emerald-400' : isPossible ? 'text-amber-400' : 'text-slate-500'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isMatched ? 'bg-emerald-500' : isPossible ? 'bg-amber-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Warning for possible match */}
                      {isPossible && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-900/20 rounded-lg px-2.5 py-1.5 border border-amber-500/20">
                          <span>⚠️</span>
                          <span>Possible match — verify product</span>
                        </div>
                      )}

                      {/* Reason */}
                      {match.match_reason && !isUnmatched && (
                        <div className="mt-1.5 text-[10px] text-slate-500 font-mono truncate">
                          {match.match_reason}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 6: COMPETITOR PRICE INTELLIGENCE & COMPARISON
              ========================================================================= */}
          {activeTab === 'competitor' && (
            <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
              {!visionResult ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-2">
                  <Store className="w-8 h-8 text-slate-600 opacity-60" />
                  <span>Analyze an image to view competitor price comparisons.</span>
                </div>
              ) : competitorInsights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-2">
                  <SearchX className="w-8 h-8 text-slate-600 opacity-60" />
                  <span>No competitor prices or items detected</span>
                  <span className="text-slate-600 text-[11px]">Upload an image containing visible shelf price tags or competitor listings</span>
                </div>
              ) : (
                competitorInsights.map((item) => {
                  const isLower = item.comparison_status === 'lower_than_competitor';
                  const isHigher = item.comparison_status === 'higher_than_competitor';
                  const isSimilar = item.comparison_status === 'similar_to_competitor';
                  const isNoPrice = item.comparison_status === 'no_price_detected';
                  const isUnmatched = item.comparison_status === 'unmatched_product';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isLower
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isHigher
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : isSimilar
                          ? 'bg-blue-950/20 border-blue-500/30'
                          : 'bg-white/[0.03] border-white/[0.08]'
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white tracking-tight">
                            {item.product_name}
                          </span>
                          {item.sku && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                              SKU: {item.sku}
                            </span>
                          )}
                          {!item.sku && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {item.detected_label}
                            </span>
                          )}
                        </div>

                        {/* Status Indicator Badge */}
                        <div className="flex items-center gap-1.5">
                          {isLower && (
                            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              Lower than competitor ({item.price_difference_percent > 0 ? `+${item.price_difference_percent}%` : `${item.price_difference_percent}%`})
                            </span>
                          )}
                          {isHigher && (
                            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Higher than competitor ({item.price_difference_percent > 0 ? `+${item.price_difference_percent}%` : `${item.price_difference_percent}%`})
                            </span>
                          )}
                          {isSimilar && (
                            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                              <Minus className="w-3 h-3" />
                              Similar to competitor ({item.price_difference_percent > 0 ? `+${item.price_difference_percent}%` : `${item.price_difference_percent}%`})
                            </span>
                          )}
                          {isNoPrice && (
                            <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-400 border border-slate-600/30">
                              Competitor Price Not Detected
                            </span>
                          )}
                          {isUnmatched && (
                            <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-400 border border-slate-600/30">
                              Unmatched Catalog Product
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3-Column Price Comparison Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                        {/* 1. Your Price */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col justify-between">
                          <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider">Your Price</span>
                            <Database className="w-3 h-3 text-indigo-400" />
                          </div>
                          <div className="text-lg font-bold font-mono text-white">
                            {item.your_price != null ? `₹${item.your_price.toLocaleString()}` : '—'}
                          </div>
                          <div className="mt-1 text-[9px] text-indigo-300/80 font-mono truncate">
                            Retrieved from PriceMind database
                          </div>
                        </div>

                        {/* 2. Detected Competitor Price */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col justify-between">
                          <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider">Detected Competitor Price</span>
                            <Camera className="w-3 h-3 text-purple-400" />
                          </div>
                          <div className="text-lg font-bold font-mono text-purple-300">
                            {item.competitor_price != null ? `₹${item.competitor_price.toLocaleString()}` : '—'}
                          </div>
                          <div className="mt-1 text-[9px] text-purple-300/80 font-mono truncate">
                            Detected from image
                          </div>
                        </div>

                        {/* 3. Difference */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                          isLower
                            ? 'bg-emerald-950/30 border-emerald-500/20'
                            : isHigher
                            ? 'bg-amber-950/30 border-amber-500/20'
                            : isSimilar
                            ? 'bg-blue-950/30 border-blue-500/20'
                            : 'bg-black/40 border-white/[0.06]'
                        }`}>
                          <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider">Difference</span>
                            <Scale className="w-3 h-3 text-slate-400" />
                          </div>
                          <div className={`text-lg font-bold font-mono ${
                            isLower
                              ? 'text-emerald-400'
                              : isHigher
                              ? 'text-amber-400'
                              : isSimilar
                              ? 'text-blue-400'
                              : 'text-slate-400'
                          }`}>
                            {item.price_difference_percent != null
                              ? `${item.price_difference_percent > 0 ? '+' : ''}${item.price_difference_percent.toFixed(2)}%`
                              : '—'}
                          </div>
                          <div className="mt-1 text-[9px] font-mono text-slate-400">
                            {item.price_difference != null
                              ? `${item.price_difference > 0 ? '+' : ''}₹${item.price_difference.toLocaleString()}`
                              : isNoPrice
                              ? 'Awaiting image price'
                              : 'No baseline catalog price'}
                          </div>
                        </div>
                      </div>

                      {/* Competitor Retail Information Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] mb-2.5">
                        {/* Competitor Name */}
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Competitor</span>
                          <span className={`font-medium ${item.competitor_info?.is_identified ? 'text-purple-300 font-semibold' : 'text-slate-400 italic'}`}>
                            {item.competitor_info?.competitor_name || 'Competitor not identified'}
                          </span>
                        </div>

                        {/* Promotion */}
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Promotion / Discount</span>
                          <span className="text-slate-300 font-medium truncate block">
                            {item.competitor_info?.promotion || 'None detected'}
                          </span>
                        </div>

                        {/* Availability */}
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Availability</span>
                          <span className="text-slate-300 font-medium truncate block">
                            {item.competitor_info?.availability || 'Not specified'}
                          </span>
                        </div>

                        {/* Detection Confidence */}
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">OCR Confidence</span>
                          <span className="text-emerald-400 font-mono font-medium">
                            {item.competitor_info?.detection_confidence ? `${Math.round(item.competitor_info.detection_confidence * 100)}%` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Strict Data Provenance Attribution */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/[0.04] gap-1">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Database className="w-2.5 h-2.5 text-indigo-400" />
                          <span>{item.your_price_provenance}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Camera className="w-2.5 h-2.5 text-purple-400" />
                          <span>{item.competitor_price_provenance}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 7: PRICEMIND UNIFIED CONTEXT (PHASE 2.3)
              ========================================================================= */}
          {activeTab === 'context' && (
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {!visionResult ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-2">
                  <Activity className="w-8 h-8 text-slate-600 opacity-60" />
                  <span>Analyze an image to view unified PriceMind contextual intelligence.</span>
                </div>
              ) : pricemindContexts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs gap-2">
                  <SearchX className="w-8 h-8 text-slate-600 opacity-60" />
                  <span>No catalog-matched items found for PriceMind contextual enrichment</span>
                  <span className="text-slate-600 text-[11px]">Upload an image matching active catalog products to view sales, elasticity, and inventory data</span>
                </div>
              ) : (
                pricemindContexts.map((ctx) => {
                  const pCtx = ctx.pricing_context || {};
                  const comp = ctx.competitor_analysis || {};
                  const isLower = comp.comparison_status === 'lower_than_competitor';
                  const isHigher = comp.comparison_status === 'higher_than_competitor';

                  return (
                    <div
                      key={ctx.id}
                      className="p-4 rounded-xl border bg-white/[0.02] border-white/[0.08] space-y-3.5 transition-all"
                    >
                      {/* 1. Header Bar with Product & Metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white tracking-tight">
                              {ctx.product_name}
                            </span>
                            {ctx.sku && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                SKU: {ctx.sku}
                              </span>
                            )}
                            {ctx.category && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                                {ctx.category}
                              </span>
                            )}
                            {ctx.brand && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                                Brand: {ctx.brand}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Match Status Badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            Catalog Match ({Math.round(ctx.visual_analysis.match_confidence * 100)}%)
                          </span>
                        </div>
                      </div>

                      {/* 2. 4-Box Unified Telemetry Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* QUADRANT 1: PRICING & COMPETITOR */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col justify-between">
                          <div className="flex items-center justify-between text-slate-400 mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> Pricing & Competitor
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">Image + DB</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Your Price (DB):</span>
                              <span className="font-mono font-bold text-white">
                                {pCtx.current_price != null ? `₹${pCtx.current_price.toLocaleString()}` : 'Not available'}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Detected Competitor:</span>
                              <span className="font-mono font-bold text-purple-300">
                                {comp.competitor_price != null ? `₹${comp.competitor_price.toLocaleString()}` : 'Not available'}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1 border-t border-white/[0.04]">
                              <span className="text-slate-400 text-[11px]">Price Difference:</span>
                              <span className={`font-mono font-bold ${isLower ? 'text-emerald-400' : isHigher ? 'text-amber-400' : 'text-slate-400'}`}>
                                {comp.price_difference_percent != null ? `${comp.price_difference_percent > 0 ? '+' : ''}${comp.price_difference_percent.toFixed(2)}%` : 'Not available'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-[9px] font-mono text-slate-500 truncate">
                            Competitor: {comp.competitor_info?.competitor_name || 'Competitor not identified'}
                          </div>
                        </div>

                        {/* QUADRANT 2: INVENTORY & MARGIN */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col justify-between">
                          <div className="flex items-center justify-between text-slate-400 mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                              <PackageCheck className="w-3 h-3" /> Inventory & Margin
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">Database</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Stock Level:</span>
                              <span className="font-mono font-bold text-white">
                                {pCtx.inventory?.inventory_level != null ? `${pCtx.inventory.inventory_level} units` : 'Not available'}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Stock Status:</span>
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                pCtx.inventory?.stock_status === 'In Stock'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : pCtx.inventory?.stock_status === 'Low Stock'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'text-slate-400'
                              }`}>
                                {pCtx.inventory?.stock_status || 'Not available'}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1 border-t border-white/[0.04]">
                              <span className="text-slate-400 text-[11px]">Cost & Margin:</span>
                              <span className="font-mono text-slate-300">
                                {pCtx.inventory?.margin_percent != null ? `${pCtx.inventory.margin_percent}% margin` : 'Not available'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-[9px] font-mono text-slate-500 truncate">
                            {pCtx.inventory?.data_source || 'Retrieved from PriceMind database'}
                          </div>
                        </div>

                        {/* QUADRANT 3: HISTORICAL DEMAND */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col justify-between">
                          <div className="flex items-center justify-between text-slate-400 mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" /> Historical Demand
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">Database</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Total Units Sold:</span>
                              <span className="font-mono font-bold text-cyan-300">
                                {pCtx.historical_demand?.total_units_sold != null ? `${pCtx.historical_demand.total_units_sold.toLocaleString()} units` : 'Not available'}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Daily Avg Sales:</span>
                              <span className="font-mono text-slate-200">
                                {pCtx.historical_demand?.avg_daily_demand != null ? `${pCtx.historical_demand.avg_daily_demand} / day` : 'Not available'}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1 border-t border-white/[0.04]">
                              <span className="text-slate-400 text-[11px]">Demand Trend:</span>
                              <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                                <Activity className="w-2.5 h-2.5 text-cyan-400" />
                                {pCtx.historical_demand?.demand_trend || 'Not available'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-[9px] font-mono text-slate-500 truncate">
                            {pCtx.historical_demand?.sales_records_count ? `${pCtx.historical_demand.sales_records_count} historical transaction records` : 'No sales records in DB'}
                          </div>
                        </div>

                        {/* QUADRANT 4: PRICE ELASTICITY */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col justify-between">
                          <div className="flex items-center justify-between text-slate-400 mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Price Elasticity
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">Model-derived</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Elasticity (E):</span>
                              <span className="font-mono font-bold text-amber-300">
                                {pCtx.elasticity?.elasticity != null ? `${pCtx.elasticity.elasticity}` : 'Not available'}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-400 text-[11px]">Classification:</span>
                              <span className="font-mono text-slate-200 font-bold uppercase text-[10px]">
                                {pCtx.elasticity?.elasticity_category || 'Not available'}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1 border-t border-white/[0.04]">
                              <span className="text-slate-400 text-[11px]">Model Confidence:</span>
                              <span className="font-mono text-slate-300">
                                {pCtx.elasticity?.r_squared != null ? `R² = ${pCtx.elasticity.r_squared}` : 'Not available'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-[9px] font-mono text-slate-500 truncate">
                            {pCtx.elasticity?.interpretation || 'Module 3 statistical elasticity estimate'}
                          </div>
                        </div>
                      </div>

                      {/* 3. Three-Way Data Provenance Footer */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[9px] font-mono text-slate-400">
                        <div className="flex items-center gap-1 text-purple-300 truncate">
                          <Camera className="w-3 h-3 shrink-0" />
                          <span>Image: Competitor Price, OCR, YOLO</span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-300 truncate">
                          <Database className="w-3 h-3 shrink-0" />
                          <span>DB: SKU, Current Price, Inventory, Sales</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-300 truncate">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span>Model: Elasticity, Sensitivity</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 8: JSON TELEMETRY VIEW
              ========================================================================= */}
          {activeTab === 'json' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-mono text-[11px]">Direct Backend Response Payload</span>
                <Button
                  variant="ghost"
                  size="xs"
                  icon={copiedJson ? Check : Copy}
                  onClick={copyJsonToClipboard}
                  className="text-xs text-indigo-400 hover:text-white"
                >
                  {copiedJson ? 'Copied' : 'Copy JSON'}
                </Button>
              </div>
              <pre className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[390px] custom-scrollbar">
                {JSON.stringify(visionResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Pipeline Execution Footer */}
          {visionResult && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] font-mono flex items-center justify-between text-slate-400 flex-wrap gap-1">
              <span>Preprocessing: {visionResult.processing_stats?.preprocessing_time_ms || 0}ms</span>
              <span>•</span>
              <span>YOLO Det: {visionResult.processing_stats?.detection_time_ms || 0}ms</span>
              <span>•</span>
              <span>OCR: {visionResult.processing_stats?.ocr_time_ms || 0}ms</span>
              <span>•</span>
              <span>Matching: {visionResult.processing_stats?.matching_time_ms || 0}ms</span>
              <span>•</span>
              <span>Comp Intel: {visionResult.processing_stats?.competitor_intelligence_time_ms || 0}ms</span>
              <span>•</span>
              <span>Context: {visionResult.processing_stats?.pricemind_context_time_ms || 0}ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VisualIntelligence;
