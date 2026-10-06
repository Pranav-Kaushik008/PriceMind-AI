import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Camera,
  Upload,
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
  HelpCircle,
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
  Maximize2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';

// UI Components
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { useToast } from '../components/ui/ToastProvider';

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

  // Mode & Image State
  const [activePreset, setActivePreset] = useState(SAMPLE_PRESETS[0]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(SAMPLE_PRESETS[0].url);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [selectedBoxId, setSelectedBoxId] = useState(null);

  // Vision Pipeline State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [visionResult, setVisionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('objects'); // 'objects' | 'ocr' | 'json'
  const [copiedJson, setCopiedJson] = useState(false);

  // Overlay Toggles
  const [showObjectBoxes, setShowObjectBoxes] = useState(true);
  const [showOcrBoxes, setShowOcrBoxes] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Initial analysis on load
  useEffect(() => {
    runAnalysisFromSample(SAMPLE_PRESETS[0]);
  }, []);

  // ── 1. Live Camera Handlers ───────────────────────────────────────────────────
  const startLiveCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast.success('Live Camera Active', 'Point your camera at a store shelf or price tag.');
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Could not access camera device: ' + (err.message || 'Unknown error');
      setErrorMessage(msg);
      toast.error('Camera Error', msg);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg', 0.92);

    stopLiveCamera();
    setImagePreviewUrl(dataUri);
    setUploadedFile(null);
    setActivePreset(null);

    // Run backend analysis on captured frame
    runAnalysisFromBase64(dataUri);
  };

  // ── 2. File Upload Handler ───────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      const err = `Invalid file format (${file.type || 'unknown'}). Please upload a JPG, PNG, or WebP image.`;
      setErrorMessage(err);
      toast.error('Invalid Format', err);
      return;
    }

    // Validate size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      const err = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 15MB limit.`;
      setErrorMessage(err);
      toast.error('File Too Large', err);
      return;
    }

    setErrorMessage(null);
    setUploadedFile(file);
    setActivePreset(null);
    stopLiveCamera();

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);

    // Send multipart form data to backend
    runAnalysisFromFile(file);
  };

  // ── 3. Pipeline Execution ────────────────────────────────────────────────────
  const runAnalysisFromFile = async (file) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await apiClient.analyzeShelfImage(formData);
      if (result && result.status === 'success') {
        setVisionResult(result);
        toast.success(
          'Vision Processing Complete',
          `Detected ${result.detected_objects_count} objects and ${result.detected_text_count} OCR price tags in ${result.processing_stats.total_pipeline_time_ms}ms.`
        );
      } else {
        throw new Error(result?.detail || 'Backend returned an unformatted response.');
      }
    } catch (err) {
      console.error('Vision API Error:', err);
      setErrorMessage(err.message || 'Vision backend processing failed.');
      toast.error('Analysis Failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const runAnalysisFromBase64 = async (base64Str) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('image_base64', base64Str);

    try {
      const result = await apiClient.analyzeShelfImage(formData);
      if (result && result.status === 'success') {
        setVisionResult(result);
        toast.success(
          'Camera Frame Processed',
          `Detected ${result.detected_objects_count} objects and ${result.detected_text_count} OCR price tags.`
        );
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to process camera snapshot.');
    } finally {
      setIsProcessing(false);
    }
  };

  const runAnalysisFromSample = async (preset) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setActivePreset(preset);
    setImagePreviewUrl(preset.url);
    setUploadedFile(null);
    stopLiveCamera();

    const formData = new FormData();
    formData.append('sample_id', preset.id);

    try {
      const result = await apiClient.analyzeShelfImage(formData);
      if (result && result.status === 'success') {
        setVisionResult(result);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Sample analysis failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyJsonToClipboard = () => {
    if (!visionResult) return;
    navigator.clipboard.writeText(JSON.stringify(visionResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    toast.success('JSON Copied', 'Structured vision telemetry copied to clipboard.');
  };

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
            <Badge variant="indigo" size="sm" className="font-mono">PHASE 1 PROTOTYPE</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Standalone visual recognition engine for store shelf object localization and price tag OCR extraction.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Sample Preset Switcher */}
          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] text-xs">
            {SAMPLE_PRESETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => runAnalysisFromSample(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePreset?.id === s.id && !isCameraActive && !uploadedFile
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.title.split(' ')[0]}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={isCameraActive ? VideoOff : Camera}
            onClick={isCameraActive ? stopLiveCamera : startLiveCamera}
            className="text-xs"
          >
            {isCameraActive ? 'Stop Camera' : 'Live Camera'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
          >
            Upload Photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setErrorMessage(null)} className="text-rose-400">
            Dismiss
          </Button>
        </div>
      )}

      {/* =========================================================================
          2. MAIN WORKSPACE: CANVAS (LEFT) + STRUCTURED RESULTS (RIGHT)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT (7 COLS): IMAGE VIEWER / CAMERA CANVAS WITH BOUNDING OVERLAYS */}
        <div className="lg:col-span-7 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {isCameraActive ? 'Live Camera Feed' : 'Vision Detection Canvas'}
              </h2>
              {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400 ml-1" />}
            </div>

            {/* Overlay Layer Toggles */}
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showObjectBoxes}
                  onChange={(e) => setShowObjectBoxes(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-0"
                />
                <span className="text-[11px] text-emerald-400 font-mono">Objects</span>
              </label>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOcrBoxes}
                  onChange={(e) => setShowOcrBoxes(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-0"
                />
                <span className="text-[11px] text-amber-400 font-mono">OCR Tags</span>
              </label>
            </div>
          </div>

          {/* Interactive Bounding Box Canvas Frame */}
          <div className="relative w-full h-[400px] sm:h-[460px] rounded-xl overflow-hidden border border-white/[0.12] bg-[#070A11] flex items-center justify-center select-none group shadow-inner">
            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Camera}
                    onClick={captureCameraFrame}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-xl"
                  >
                    Capture Snapshot
                  </Button>
                  <Button variant="outline" size="sm" onClick={stopLiveCamera} className="text-xs bg-slate-900/90 text-white">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Background Image */}
                <img
                  src={imagePreviewUrl}
                  alt="Shelf Scan"
                  className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.01]"
                />

                {/* Object Bounding Boxes Overlay */}
                {showObjectBoxes &&
                  visionResult?.detected_objects?.map((obj) => {
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
                          className={`absolute -top-6 left-0 px-2 py-0.5 rounded-t-md font-mono text-[10px] font-bold flex items-center gap-1 shadow-md ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          <span>{obj.label}</span>
                          <span className="opacity-80">{(obj.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}

                {/* OCR Text / Price Bounding Boxes Overlay */}
                {showOcrBoxes &&
                  visionResult?.detected_text_and_prices?.map((ocr) => {
                    const isSelected = selectedBoxId === ocr.id;
                    return (
                      <div
                        key={ocr.id}
                        onClick={() => setSelectedBoxId(ocr.id)}
                        className={`absolute border-2 border-dashed border-amber-300 bg-amber-400/20 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center ${
                          isSelected ? 'scale-105 z-30 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'z-20'
                        }`}
                        style={{
                          top: `${ocr.box.y_percent}%`,
                          left: `${ocr.box.x_percent}%`,
                          width: `${ocr.box.width_percent}%`,
                          height: `${ocr.box.height_percent}%`,
                        }}
                      >
                        <div className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-extrabold text-[11px] shadow-lg flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-slate-950" />
                          <span>${ocr.extracted_price ? ocr.extracted_price.toFixed(2) : ocr.raw_text}</span>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>

          {/* Image & Preprocessing Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Resolution</span>
              <span className="text-white font-bold block mt-0.5">
                {visionResult?.image_metadata?.width} × {visionResult?.image_metadata?.height}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">File Size</span>
              <span className="text-white font-bold block mt-0.5">
                {visionResult?.image_metadata?.size_kb} KB ({visionResult?.image_metadata?.format})
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Objects Found</span>
              <span className="text-emerald-400 font-bold block mt-0.5">
                {visionResult?.detected_objects_count || 0} Units
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Total Pipeline</span>
              <span className="text-indigo-300 font-bold block mt-0.5">
                {visionResult?.processing_stats?.total_pipeline_time_ms || 0} ms
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT (5 COLS): STRUCTURED EXTRACTION TELEMETRY & RAW JSON */}
        <div className="lg:col-span-5 bg-[#0D1524]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Structured Extraction Results
            </h2>

            {/* View Tab Selector */}
            <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/[0.08] text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('objects')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'objects' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Objects ({visionResult?.detected_objects_count || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ocr')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'ocr' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                OCR Tags ({visionResult?.detected_text_count || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3 h-3" /> JSON
              </button>
            </div>
          </div>

          {/* TAB 1: DETECTED OBJECTS TABLE */}
          {activeTab === 'objects' && (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
              {visionResult?.detected_objects?.map((obj) => {
                const isSelected = selectedBoxId === obj.id;
                return (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedBoxId(obj.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/50 shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold flex-shrink-0">
                        {obj.id}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white truncate block">{obj.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Coords: [{obj.box.x_percent}%, {obj.box.y_percent}%] • Size: {obj.box.width_percent}%×{obj.box.height_percent}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <Badge variant="success" size="sm" className="font-mono">
                        {(obj.confidence * 100).toFixed(0)}% Conf
                      </Badge>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">
                        {obj.box.width_px}×{obj.box.height_px} px
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: OCR TEXT & PRICE LABELS TABLE */}
          {activeTab === 'ocr' && (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
              {visionResult?.detected_text_and_prices?.map((ocr) => {
                const isSelected = selectedBoxId === ocr.id;
                return (
                  <div
                    key={ocr.id}
                    onClick={() => setSelectedBoxId(ocr.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 font-mono text-xs font-bold flex-shrink-0">
                        $
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-amber-300 font-mono truncate block">
                          {ocr.raw_text}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Detected Price: {ocr.extracted_price ? `$${ocr.extracted_price.toFixed(2)}` : 'None'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-white">
                        ${ocr.extracted_price?.toFixed(2)}
                      </span>
                      <Badge variant="neutral" size="sm" className="font-mono mt-1 text-[10px]">
                        {(ocr.confidence * 100).toFixed(0)}% OCR
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: STRUCTURED BACKEND JSON VIEW */}
          {activeTab === 'json' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-end">
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
              <pre className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[410px] custom-scrollbar">
                {JSON.stringify(visionResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Micro Pipeline Timing Breakdown */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] font-mono flex items-center justify-between text-slate-400">
            <span>Prep: {visionResult?.processing_stats?.preprocessing_time_ms || 0}ms</span>
            <span>•</span>
            <span>Detect: {visionResult?.processing_stats?.detection_time_ms || 0}ms</span>
            <span>•</span>
            <span>OCR: {visionResult?.processing_stats?.ocr_time_ms || 0}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisualIntelligence;
