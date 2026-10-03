import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, MapPin, ShieldAlert, Sparkles, Upload } from 'lucide-react';
import { InspectionPhoto } from '../types';

interface CameraCaptureModalProps {
  ngoName: string;
  ngoReg: string;
  officerName: string;
  officerBadge: string;
  currentCoordinates: { lat: number; lng: number };
  onCapture: (photo: InspectionPhoto) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  ngoName,
  ngoReg,
  officerName,
  officerBadge,
  currentCoordinates,
  onCapture,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<InspectionPhoto['category']>('OFFICE_EXTERIOR');
  const [caption, setCaption] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUsingSimulatedCamera, setIsUsingSimulatedCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const createAuditPhotoSvg = (label: string, category: string, color: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="#0f172a"/>
      <rect x="20" y="20" width="760" height="460" rx="12" fill="#1e293b" stroke="${color}" stroke-width="2"/>
      <rect x="20" y="20" width="760" height="4" fill="#0B3B60"/>
      <circle cx="400" cy="180" r="50" fill="#0f172a" stroke="${color}" stroke-width="3"/>
      <text x="400" y="192" fill="${color}" font-family="monospace" font-size="28" font-weight="bold" text-anchor="middle">${category.slice(0, 4)}</text>
      <text x="400" y="275" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">${label}</text>
      <text x="400" y="310" fill="#94a3b8" font-family="monospace" font-size="14" text-anchor="middle">FIELD AUDIT VERIFICATION CERTIFICATE</text>
      <rect x="150" y="340" width="500" height="70" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <text x="170" y="370" fill="#38bdf8" font-family="monospace" font-size="13">EVIDENCE TYPE: ${category}</text>
      <text x="170" y="392" fill="#a7f3d0" font-family="monospace" font-size="11">INSPIRA PROTOTYPE • FIELD SURVEILLANCE (SIH 2026)</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Sample high-fidelity field audit photos for instant testing or when webcam is restricted
  const SAMPLE_PHOTOS = [
    {
      label: 'Office Signboard & Entrance',
      category: 'OFFICE_EXTERIOR' as const,
      url: createAuditPhotoSvg('Office Signboard &amp; Main Entrance', 'OFFICE_EXTERIOR', '#38bdf8'),
    },
    {
      label: 'Financial Ledgers & Cashbooks',
      category: 'LEDGER_AUDIT' as const,
      url: createAuditPhotoSvg('Financial Ledgers &amp; Cashbooks', 'LEDGER_AUDIT', '#10b981'),
    },
    {
      label: 'Staff Presence & Meeting',
      category: 'STAFF_VERIFICATION' as const,
      url: createAuditPhotoSvg('Staff Presence &amp; Meeting Record', 'STAFF_VERIFICATION', '#818cf8'),
    },
    {
      label: 'Beneficiaries & Project Work',
      category: 'BENEFICIARY_MEET' as const,
      url: createAuditPhotoSvg('Beneficiaries &amp; Project Welfare Work', 'BENEFICIARY_MEET', '#f59e0b'),
    },
    {
      label: 'Irregularity / Padlocked Gate',
      category: 'VIOLATION_EVIDENCE' as const,
      url: createAuditPhotoSvg('Irregularity &amp; Padlocked Gate Discrepancy', 'VIOLATION_EVIDENCE', '#ef4444'),
    },
  ];

  // Try accessing device camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsUsingSimulatedCamera(true);
          return;
        }

        const constraintsToTry = [
          { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: true, audio: false },
        ];

        for (const constraint of constraintsToTry) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraint);
            if (stream) break;
          } catch (e) {
            // try next constraint
          }
        }

        if (stream) {
          setCameraStream(stream);
          setIsUsingSimulatedCamera(false);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch((e) => {
                console.warn('Auto play failed in CameraCaptureModal:', e);
                setIsUsingSimulatedCamera(true);
              });
            };
          }
        } else {
          setIsUsingSimulatedCamera(true);
        }
      } catch (err: any) {
        console.warn('Webcam permission not granted or in iframe:', err);
        setCameraError('Camera hardware unavailable or blocked in frame. Switched to high-fidelity Field Camera Simulator.');
        setIsUsingSimulatedCamera(true);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Synchronize stream with video element
  useEffect(() => {
    if (videoRef.current && cameraStream && !capturedImage) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(console.warn);
      }
    }
  }, [cameraStream, capturedImage]);

  const takeLiveSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply Government GPS Watermark
    applyWatermark(ctx, canvas.width, canvas.height);

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
  };

  const useSamplePhoto = (url: string, cat: InspectionPhoto['category']) => {
    setSelectedCategory(cat);
    // Draw onto canvas with watermark
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 800, 500);
      applyWatermark(ctx, 800, 500);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    };
  };

  const applyWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    const bannerHeight = 85;

    // Dark semi-transparent banner at bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Red/Blue Government Security Strip
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, height - bannerHeight, width, 4);

    // Watermark Text
    const latStr = currentCoordinates && typeof currentCoordinates.lat === 'number' ? currentCoordinates.lat.toFixed(6) : '28.613900';
    const lngStr = currentCoordinates && typeof currentCoordinates.lng === 'number' ? currentCoordinates.lng.toFixed(6) : '77.209000';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`📍 GPS: ${latStr}° N, ${lngStr}° E (±4.2m)`, 16, height - bannerHeight + 22);

    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`NGO: ${ngoName} [${ngoReg}]`, 16, height - bannerHeight + 42);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`AUDITOR: ${officerName} (${officerBadge}) | ${timestamp}`, 16, height - bannerHeight + 62);
  };

  const handleSavePhoto = () => {
    if (!capturedImage) return;
    const newPhoto: InspectionPhoto = {
      id: 'photo_' + Date.now(),
      caption: caption || `${selectedCategory.replace(/_/g, ' ')} Evidence`,
      category: selectedCategory,
      imageUrl: capturedImage,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      coordinates: currentCoordinates || { lat: 28.6139, lng: 77.2090 },
      accuracyMeters: 4.2,
    };
    onCapture(newPhoto);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#0f172a] text-white border border-slate-700/80 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modern Google-Style Gradient Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-white shrink-0">
              <Camera className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                Official Evidence Sensor
              </div>
              <h3 className="font-bold text-sm text-white">
                GPS-Watermarked Field Camera Audit
              </h3>
            </div>
          </div>
          <button
            id="btn-close-camera-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Metadata banner */}
          <div className="flex items-center justify-between text-xs bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-inner">
            <div className="flex items-center space-x-2 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-[11px]">
                {currentCoordinates.lat.toFixed(6)}°N, {currentCoordinates.lng.toFixed(6)}°E (±4.2m)
              </span>
            </div>
            <span className="text-amber-400 font-mono text-[11px] font-bold">Auto-Watermark Active</span>
          </div>

          {/* Photo Category Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
              Evidence Category Shelf:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'OFFICE_EXTERIOR', label: '1. Office Signboard & Gate' },
                { id: 'LEDGER_AUDIT', label: '2. Cashbooks & Ledgers' },
                { id: 'STAFF_VERIFICATION', label: '3. Staff & Attendance' },
                { id: 'BENEFICIARY_MEET', label: '4. Beneficiary Verification' },
                { id: 'VIOLATION_EVIDENCE', label: '5. Irregularity / Violation' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Camera View / Captured Image Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-700/80 shadow-inner">
            {capturedImage && (
              <img src={capturedImage} alt="Captured evidence" className="w-full h-full object-cover" />
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${capturedImage || !cameraStream ? 'hidden' : 'block'}`}
            />

            {!capturedImage && !cameraStream && (
              <div className="p-6 text-center space-y-3">
                <ShieldAlert className="w-9 h-9 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  {cameraError || 'Camera view ready.'} Click a sample evidence image below or trigger simulated capture.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-2 pt-1">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/50 rounded-full cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload Device Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const res = ev.target?.result as string;
                            if (res) useSamplePhoto(res, selectedCategory);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {SAMPLE_PHOTOS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => useSamplePhoto(item.url, item.category)}
                      className="px-3 py-1.5 text-[11px] bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-full border border-slate-600 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden canvas for watermarking */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* If captured image, allow captioning */}
          {capturedImage && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Auditor Note / Caption:
              </label>
              <input
                id="input-photo-caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g., Physical registration signboard verified at main entrance."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={() => setCapturedImage(null)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-full border border-slate-600 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                id="btn-confirm-save-photo"
                type="button"
                onClick={handleSavePhoto}
                className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-full border border-emerald-500 shadow-sm cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Attach to Statutory Dossier</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {cameraStream ? (
                <button
                  id="btn-take-live-photo"
                  type="button"
                  onClick={takeLiveSnapshot}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full border border-blue-500 shadow-md cursor-pointer transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Live Watermarked Photo</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => useSamplePhoto(SAMPLE_PHOTOS[0].url, SAMPLE_PHOTOS[0].category)}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full border border-blue-500 shadow-md cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use Verified Sample Evidence</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
