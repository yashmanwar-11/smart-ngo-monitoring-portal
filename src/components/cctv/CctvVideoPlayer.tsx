import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RefreshCw,
  Camera as CameraIcon,
  Shield,
  Wifi,
  WifiOff,
  AlertTriangle,
  Play,
  Pause,
  Clock,
  Sparkles,
  CheckCircle2,
  Layers,
  Compass,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Eye,
  EyeOff,
  Video,
  Activity,
  UserCheck,
  AlertOctagon,
  Radio,
} from 'lucide-react';
import { Camera, CameraSource, CctvStreamSession, PtzPreset } from '../../types';
import { cameraApi } from '../../services/apiClient';
import { CctvVisionEngine, VisionTelemetry } from '../../utils/cctvVision';

interface CctvVideoPlayerProps {
  camera: Camera;
  autoPlay?: boolean;
  muted?: boolean;
  showControls?: boolean;
  onSnapshotCapture?: (evidence: any) => void;
  inspectionId?: string;
  className?: string;
  isInModal?: boolean;
}

const DEFAULT_PRESETS: PtzPreset[] = [
  { id: 'p1', name: 'Main Gate', pan: 0, tilt: 0, zoom: 1.0 },
  { id: 'p2', name: 'Muster Station', pan: -15, tilt: 8, zoom: 1.8 },
  { id: 'p3', name: 'Facility Center', pan: 18, tilt: -10, zoom: 2.2 },
  { id: 'p4', name: 'Perimeter Fence', pan: 12, tilt: 20, zoom: 2.8 },
];

export const CctvVideoPlayer: React.FC<CctvVideoPlayerProps> = ({
  camera,
  autoPlay = true,
  muted = true,
  showControls = true,
  onSnapshotCapture,
  inspectionId,
  className = '',
  isInModal = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const visionEngineRef = useRef<CctvVisionEngine | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Determine initial source (Hardware Webcam vs RTSP Stream vs HTTP MJPEG vs HLS)
  const initialSource: CameraSource =
    camera.camera_source || (camera.camera_type === 'DEVICE_CAM' ? 'HARDWARE_DEVICE' : 'RTSP_STREAM');
  const [activeSource, setActiveSource] = useState<CameraSource>(initialSource);
  const [mjpegUrl, setMjpegUrl] = useState<string>('');

  useEffect(() => {
    const src: CameraSource =
      camera.camera_source || (camera.camera_type === 'DEVICE_CAM' ? 'HARDWARE_DEVICE' : 'RTSP_STREAM');
    setActiveSource(src);
  }, [camera.id, camera.camera_source, camera.camera_type]);

  const [session, setSession] = useState<CctvStreamSession | null>(null);
  const [streamState, setStreamState] = useState<'CONNECTING' | 'LIVE' | 'OFFLINE' | 'ERROR'>('CONNECTING');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(muted);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureToast, setCaptureToast] = useState<string | null>(null);
  const [liveClock, setLiveClock] = useState<string>('');

  // PTZ & Digital Zoom Viewport State
  const [ptz, setPtz] = useState<{ pan: number; tilt: number; zoom: number }>({
    pan: 0,
    tilt: 0,
    zoom: 1.0,
  });
  const [showPtzDeck, setShowPtzDeck] = useState<boolean>(false);

  // Edge AI Vision HUD State
  const [aiVisionEnabled, setAiVisionEnabled] = useState<boolean>(true);
  const [tripwireEnabled, setTripwireEnabled] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<VisionTelemetry>({
    fps: 30,
    frameLatencyMs: 3.5,
    motionIntensity: 0,
    headcount: 0,
    isTripwireBreached: false,
    isTampered: false,
    bitrateKbps: 2450,
  });

  // Update live clock overlay
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize or Re-initialize Video Stream (Hardware Webcam OR RTSP Stream)
  useEffect(() => {
    let isCancelled = false;
    let countdownInterval: any = null;

    const cleanupPreviousStream = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (visionEngineRef.current) {
        visionEngineRef.current.stop();
        visionEngineRef.current = null;
      }
      setMjpegUrl('');
    };

    const initStream = async () => {
      cleanupPreviousStream();

      if (!camera.is_enabled) {
        setStreamState('OFFLINE');
        setErrorMessage('Camera has been disabled by security administration.');
        return;
      }

      setStreamState('CONNECTING');
      setErrorMessage('');

      // -------------------------------------------------------------
      // PATH A: PHYSICAL HARDWARE WEBCAM / LOCAL INSPECTION NODE
      // -------------------------------------------------------------
      if (activeSource === 'HARDWARE_DEVICE') {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Device media permissions not supported in this browser context.');
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
              frameRate: { ideal: 30, min: 15 },
            },
            audio: false,
          });

          if (isCancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          mediaStreamRef.current = stream;
          const video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
              if (!isCancelled) {
                video.play().catch(() => {});
                setStreamState('LIVE');
                startVisionEngine();
              }
            };
          }
        } catch (err: any) {
          if (!isCancelled) {
            console.warn('Physical camera access error:', err.message);
            setStreamState('OFFLINE');
            setErrorMessage(
              err.name === 'NotAllowedError'
                ? 'Camera access permission was denied. Please allow camera in browser settings.'
                : `Hardware camera unavailable: ${err.message}`
            );
          }
        }
        return;
      }

      // -------------------------------------------------------------
      // PATH B: HTTP MJPEG (PHONE "IP WEBCAM" / ESP32 / PROXY FEED)
      // -------------------------------------------------------------
      if (activeSource === 'HTTP_MJPEG') {
        try {
          const sess = await cameraApi.createSession(camera.id);
          if (isCancelled) return;
          setSession(sess);

          // Backend proxy URL (or direct URL if configured)
          const streamEndpoint = sess.streamUrl || `/api/cameras/${camera.id}/stream.mjpeg`;
          setMjpegUrl(streamEndpoint);
        } catch (err: any) {
          if (!isCancelled) {
            if (camera.stream_url) {
              setMjpegUrl(camera.stream_url);
            } else {
              setStreamState('OFFLINE');
              setErrorMessage(err.message || 'HTTP MJPEG camera unreachable on network.');
              startAutoReconnect();
            }
          }
        }
        return;
      }

      // -------------------------------------------------------------
      // PATH C: NETWORK RTSP / ONVIF / HLS STREAM RELAY
      // -------------------------------------------------------------
      try {
        const sess = await cameraApi.createSession(camera.id);
        if (isCancelled) return;

        setSession(sess);

        // If backend resolved streamType as MJPEG, dynamically render via MJPEG
        if (sess.streamType === 'MJPEG') {
          setActiveSource('HTTP_MJPEG');
          setMjpegUrl(sess.streamUrl || `/api/cameras/${camera.id}/stream.mjpeg`);
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        const streamEndpoint = sess.streamUrl;

        if (Hls.isSupported()) {
          const hls = new Hls({
            liveSyncDurationCount: 2,
            liveMaxLatencyDurationCount: 4,
            maxLiveSyncPlaybackRate: 1.1,
            enableWorker: true,
            lowLatencyMode: true,
            manifestLoadingTimeOut: 6000,
            levelLoadingTimeOut: 6000,
            fragLoadingTimeOut: 8000,
          });

          hlsRef.current = hls;
          hls.loadSource(streamEndpoint);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!isCancelled) {
              setStreamState('LIVE');
              if (autoPlay) {
                video.play().catch(() => {});
              }
              startVisionEngine();
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.warn(`HLS Fatal Stream Error for camera [${camera.id}]:`, data.type);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  setStreamState('OFFLINE');
                  setErrorMessage('Stream connection lost. Re-probing camera...');
                  startAutoReconnect();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native Safari HLS
          video.src = streamEndpoint;
          video.addEventListener('loadedmetadata', () => {
            if (!isCancelled) {
              setStreamState('LIVE');
              if (autoPlay) {
                video.play().catch(() => {});
              }
              startVisionEngine();
            }
          });
          video.addEventListener('error', () => {
            if (!isCancelled) {
              setStreamState('OFFLINE');
              setErrorMessage('Native video pipeline error.');
              startAutoReconnect();
            }
          });
        } else {
          setStreamState('ERROR');
          setErrorMessage('Browser does not support HLS streaming.');
        }
      } catch (err: any) {
        if (!isCancelled) {
          setStreamState('OFFLINE');
          setErrorMessage(err.message || 'Camera stream unreachable over network.');
          startAutoReconnect();
        }
      }
    };

    const startAutoReconnect = () => {
      setRetryCountdown(6);
      countdownInterval = setInterval(() => {
        setRetryCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setRetryCount((c) => c + 1);
            initStream();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    initStream();

    return () => {
      isCancelled = true;
      if (countdownInterval) clearInterval(countdownInterval);
      cleanupPreviousStream();
      if (session) {
        cameraApi.endSession(camera.id, session.sessionToken).catch(() => {});
      }
    };
  }, [camera.id, activeSource, retryCount]);

  // Start / restart the Edge AI Computer Vision Engine
  const startVisionEngine = useCallback(() => {
    if (!aiVisionEnabled || !overlayCanvasRef.current) return;
    const mediaEl = activeSource === 'HTTP_MJPEG' ? imageRef.current : videoRef.current;
    if (!mediaEl) return;

    if (visionEngineRef.current) {
      visionEngineRef.current.stop();
    }

    const engine = new CctvVisionEngine(
      mediaEl,
      overlayCanvasRef.current,
      (telem) => {
        setTelemetry(telem);
      }
    );

    engine.setTripwire({ enabled: tripwireEnabled });
    engine.start();
    visionEngineRef.current = engine;
  }, [aiVisionEnabled, tripwireEnabled, activeSource]);

  // Handle AI Vision toggle
  useEffect(() => {
    if (!aiVisionEnabled) {
      if (visionEngineRef.current) {
        visionEngineRef.current.stop();
        visionEngineRef.current = null;
      }
      if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    } else if (streamState === 'LIVE') {
      startVisionEngine();
    }
  }, [aiVisionEnabled, streamState, startVisionEngine]);

  // Update tripwire setting in engine
  useEffect(() => {
    if (visionEngineRef.current) {
      visionEngineRef.current.setTripwire({ enabled: tripwireEnabled });
    }
  }, [tripwireEnabled]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Dispatch PTZ command
  const handlePtzAction = (action: 'PAN_TILT' | 'ZOOM' | 'PRESET' | 'STOP', newPtz: typeof ptz, presetName?: string) => {
    setPtz(newPtz);
    cameraApi.sendPtzCommand(camera.id, {
      action,
      pan: newPtz.pan,
      tilt: newPtz.tilt,
      zoom: newPtz.zoom,
      presetName,
    }).catch(() => {});
  };

  // Certified Evidence Frame Capture with SHA-256 watermark
  const handleCaptureSnapshot = async () => {
    try {
      setIsCapturing(true);

      const mediaEl = activeSource === 'HTTP_MJPEG' ? imageRef.current : (activeSource === 'HARDWARE_DEVICE' ? videoRef.current : null);

      // If playing from hardware webcam or client-rendered MJPEG, attempt certified canvas capture
      if (mediaEl) {
        try {
          const offCanvas = document.createElement('canvas');
          const isVideo = mediaEl instanceof HTMLVideoElement;
          const w = (isVideo ? mediaEl.videoWidth : (mediaEl as HTMLImageElement).naturalWidth) || 1920;
          const h = (isVideo ? mediaEl.videoHeight : (mediaEl as HTMLImageElement).naturalHeight) || 1080;
          offCanvas.width = w;
          offCanvas.height = h;
          const ctx = offCanvas.getContext('2d')!;

          // Draw active media frame
          ctx.drawImage(mediaEl, 0, 0, w, h);

          // Stamp statutory government watermark
          const nowIso = new Date().toISOString();
          const watermarkBanner = `GOVT OF MAHARASHTRA | DOSJE VIGILANCE | ${camera.name} | ${nowIso} | BADGE: IAS-VIGIL-001`;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, h - 40, w, 40);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(watermarkBanner, 20, h - 15);

          const dataUrl = offCanvas.toDataURL('image/jpeg', 0.92);

          // Compute real SHA-256 hash using Web Crypto API
          const encoder = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataUrl));
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const fileHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

          const evidence = {
            id: 'evid_hw_' + Math.random().toString(36).substring(2, 9),
            cameraId: camera.id,
            cameraName: camera.name,
            ngoId: camera.ngo_id,
            ngoName: camera.ngo_name || 'Assigned Facility',
            location: camera.location,
            fileHash,
            timestamp: nowIso,
            imageUrl: dataUrl,
            inspectionId: inspectionId || null,
          };

          setCaptureToast(`✓ Certified Evidence Frame Captured! SHA-256: ${fileHash.slice(0, 12)}...`);
          setTimeout(() => setCaptureToast(null), 4000);
          onSnapshotCapture?.(evidence);
          setIsCapturing(false);
          return;
        } catch (canvasErr) {
          console.warn('Direct canvas capture cross-origin fallback:', canvasErr);
        }
      }

      // Backend gateway capture fallback
      const res = await cameraApi.captureEvidence(camera.id, {
        inspectionId,
        categoryCode: 'CCTV_FACILITY_MONITOR',
        caption: `Certified CCTV Frame: ${camera.name} at ${camera.location}`,
      });

      setCaptureToast(`✓ Evidence frame captured! SHA-256: ${res.evidence.fileHash.slice(0, 12)}...`);
      setTimeout(() => setCaptureToast(null), 4000);
      onSnapshotCapture?.(res.evidence);
    } catch (err: any) {
      setCaptureToast(`⚠ Capture failed: ${err.message}`);
      setTimeout(() => setCaptureToast(null), 4000);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 group select-none ${className}`}
    >
      {/* ---------------- TOP TACTICAL HUD METADATA BAR ---------------- */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Real Status Badge */}
          {streamState === 'LIVE' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
          {streamState === 'CONNECTING' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              CONNECTING
            </span>
          )}
          {streamState === 'OFFLINE' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700 backdrop-blur-md">
              <WifiOff className="w-3 h-3 text-slate-400" />
              OFFLINE
            </span>
          )}

          {/* Camera Info */}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[170px] sm:max-w-[220px]">
              {camera.name}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
              {camera.location} • {camera.ngo_name || 'Vigilance Node'}
            </span>
          </div>
        </div>

        {/* Tactical Telemetry & Stream Source Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Protocol Badge & Fast Source Switcher */}
          <div className="flex items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all border ${
                activeSource === 'HARDWARE_DEVICE'
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                  : activeSource === 'HTTP_MJPEG'
                  ? 'bg-amber-600/30 text-amber-200 border-amber-500/50'
                  : activeSource === 'HLS_STREAM'
                  ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50'
                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {activeSource === 'HARDWARE_DEVICE'
                ? '📹 WEBCAM'
                : activeSource === 'HTTP_MJPEG'
                ? '📱 PHONE / MJPEG'
                : activeSource === 'HLS_STREAM'
                ? '🌐 HLS STREAM'
                : '📡 RTSP RELAY'}
            </span>

            {/* Quick Toggle to Local Device Webcam */}
            {activeSource !== 'HARDWARE_DEVICE' && (
              <button
                onClick={() => setActiveSource('HARDWARE_DEVICE')}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 transition-colors hover:border-slate-500"
                title="Switch to local physical device webcam"
              >
                📹 Webcam
              </button>
            )}

            {/* Quick Toggle to IP Network Stream */}
            {activeSource === 'HARDWARE_DEVICE' && (
              <button
                onClick={() => {
                  const orig = camera.camera_source || (camera.camera_type === 'DEVICE_CAM' ? 'HARDWARE_DEVICE' : 'RTSP_STREAM');
                  setActiveSource(orig === 'HARDWARE_DEVICE' ? 'RTSP_STREAM' : orig);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 transition-colors hover:border-slate-500"
                title="Switch back to IP camera network stream"
              >
                📡 IP Stream
              </button>
            )}
          </div>

          {/* Real-time FPS & Quality Tag */}
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 text-emerald-400 border border-emerald-500/30">
            {telemetry.fps} FPS
          </span>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/80 text-emerald-400 border border-emerald-500/20">
            {liveClock}
          </span>
        </div>
      </div>

      {/* ---------------- SECONDARY EDGE AI TELEMETRY HUD BAR ---------------- */}
      {streamState === 'LIVE' && aiVisionEnabled && (
        <div className="absolute top-11 inset-x-0 z-20 px-3.5 flex items-center justify-between text-[10px] font-mono pointer-events-none">
          <div className="flex items-center gap-2">
            {/* Occupancy Headcount */}
            <span className="px-2 py-0.5 rounded bg-slate-900/85 text-teal-300 border border-teal-500/30 backdrop-blur-sm flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-teal-400" />
              Occupancy: {telemetry.headcount > 0 ? `${telemetry.headcount} Persons` : 'Area Clear'}
            </span>

            {/* Motion Intensity */}
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/85 text-slate-300 border border-slate-700/60 backdrop-blur-sm">
              <Activity className="w-3 h-3 text-indigo-400" />
              Activity: {telemetry.motionIntensity}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tripwire Alarm Strobe */}
            {telemetry.isTripwireBreached && (
              <span className="px-2.5 py-0.5 rounded bg-rose-600/90 text-white font-bold animate-pulse border border-rose-400 flex items-center gap-1 shadow-lg shadow-rose-900/50">
                <AlertOctagon className="w-3 h-3" />
                PERIMETER BREACH
              </span>
            )}

            {/* Latency & Bitrate */}
            <span className="hidden md:inline-block text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
              {telemetry.frameLatencyMs}ms | {telemetry.bitrateKbps} kbps
            </span>
          </div>
        </div>
      )}

      {/* ---------------- PRIMARY VIDEO VIEWPORT WITH DIGITAL PTZ ---------------- */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {/* Transform container for smooth Digital Pan/Tilt & Zoom */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${ptz.pan}%, ${ptz.tilt}%) scale(${ptz.zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {activeSource === 'HTTP_MJPEG' ? (
            <img
              ref={imageRef}
              src={mjpegUrl}
              alt={camera.name}
              className={`w-full h-full object-contain ${streamState === 'LIVE' ? 'opacity-100' : 'opacity-0'}`}
              crossOrigin="anonymous"
              onLoad={() => {
                if (streamState !== 'LIVE') {
                  setStreamState('LIVE');
                  startVisionEngine();
                }
              }}
              onError={() => {
                if (streamState === 'CONNECTING') {
                  setStreamState('OFFLINE');
                  setErrorMessage('IP Camera stream did not respond. Check IP and network connection.');
                }
              }}
            />
          ) : (
            <video
              ref={videoRef}
              className={`w-full h-full object-contain ${streamState === 'LIVE' ? 'opacity-100' : 'opacity-0'}`}
              playsInline
              muted={isMuted}
            />
          )}
        </div>

        {/* Edge AI Computer Vision Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
            streamState === 'LIVE' && aiVisionEnabled ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Optical PTZ Reticle in Center when PTZ active */}
        {showPtzDeck && streamState === 'LIVE' && (
          <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border border-indigo-400/30 flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-indigo-400/50" />
            </div>
          </div>
        )}

        {/* CONNECTING State View */}
        {streamState === 'CONNECTING' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 backdrop-blur-sm z-20">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <CameraIcon className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Establishing Surveillance Stream
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {activeSource === 'HARDWARE_DEVICE'
                ? 'Initializing physical hardware camera sensor. Requesting media stream...'
                : activeSource === 'HTTP_MJPEG'
                ? `Connecting to HTTP MJPEG stream at ${camera.stream_url || `${camera.ip_address}:${camera.port}`}...`
                : `Handshaking RTSP gateway for ${camera.name} (${camera.ip_address}:${camera.port}). Authenticating stream session...`}
            </p>
          </div>
        )}

        {/* OFFLINE / DISCONNECTED State View */}
        {streamState === 'OFFLINE' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-20">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
              <WifiOff className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              CAMERA OFFLINE
            </h4>

            {/* Diagnostic Target Details */}
            <div className="mb-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span>Target: <span className="text-slate-200">{camera.stream_url || `${camera.ip_address}:${camera.port}`}</span></span>
              <span>•</span>
              <span>Protocol: <span className="text-indigo-300">{activeSource}</span></span>
            </div>

            <p className="text-xs text-slate-400 max-w-md mb-3">
              {errorMessage || 'Camera connection lost or stream unreachable over network.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pointer-events-auto mt-1">
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {retryCountdown > 0 ? `Retrying in ${retryCountdown}s` : 'Retry Connection'}
              </button>

              {/* Fast switch to hardware camera */}
              {activeSource !== 'HARDWARE_DEVICE' ? (
                <button
                  onClick={() => setActiveSource('HARDWARE_DEVICE')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Video className="w-3.5 h-3.5" />
                  Use Device Webcam
                </button>
              ) : (
                <button
                  onClick={() => {
                    const orig = camera.camera_source || (camera.camera_type === 'DEVICE_CAM' ? 'HARDWARE_DEVICE' : 'RTSP_STREAM');
                    setActiveSource(orig === 'HARDWARE_DEVICE' ? 'RTSP_STREAM' : orig);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Radio className="w-3.5 h-3.5" />
                  Switch to IP Stream
                </button>
              )}
            </div>
          </div>
        )}

        {/* ERROR State View */}
        {streamState === 'ERROR' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-20">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center mb-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-rose-300 mb-1">
              Stream Initialization Error
            </h4>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              {errorMessage || 'Unable to decode live stream in this browser.'}
            </p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors pointer-events-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-probe Camera
            </button>
          </div>
        )}

        {/* Capture Notification Toast */}
        {captureToast && (
          <div className="absolute top-14 inset-x-4 z-40 flex justify-center pointer-events-none">
            <div className="px-4 py-2 rounded-xl bg-indigo-950/95 text-indigo-100 border border-indigo-500/50 shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
              <Shield className="w-4 h-4 text-emerald-400" />
              {captureToast}
            </div>
          </div>
        )}

        {/* ---------------- INTERACTIVE PTZ TACTICAL DECK OVERLAY ---------------- */}
        {showPtzDeck && streamState === 'LIVE' && (
          <div className="absolute bottom-12 right-3 z-30 p-3 rounded-2xl bg-slate-950/90 border border-indigo-500/40 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 pointer-events-auto w-56">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                PTZ Tactical Controller
              </span>
              <span className="font-mono text-[10px] text-slate-400">{ptz.zoom.toFixed(1)}x</span>
            </div>

            {/* D-Pad Directional Arrows */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handlePtzAction('PAN_TILT', { ...ptz, tilt: Math.max(-40, ptz.tilt - 8) })}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all border border-slate-800"
                title="Tilt Up"
              >
                ▲
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePtzAction('PAN_TILT', { ...ptz, pan: Math.max(-40, ptz.pan - 8) })}
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all border border-slate-800"
                  title="Pan Left"
                >
                  ◀
                </button>
                <button
                  onClick={() => handlePtzAction('STOP', { pan: 0, tilt: 0, zoom: 1.0 })}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold transition-all border border-slate-700"
                  title="Center & Reset"
                >
                  1.0x
                </button>
                <button
                  onClick={() => handlePtzAction('PAN_TILT', { ...ptz, pan: Math.min(40, ptz.pan + 8) })}
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all border border-slate-800"
                  title="Pan Right"
                >
                  ▶
                </button>
              </div>
              <button
                onClick={() => handlePtzAction('PAN_TILT', { ...ptz, tilt: Math.min(40, ptz.tilt + 8) })}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all border border-slate-800"
                title="Tilt Down"
              >
                ▼
              </button>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.2"
                value={ptz.zoom}
                onChange={(e) => {
                  const z = parseFloat(e.target.value);
                  handlePtzAction('ZOOM', { ...ptz, zoom: z });
                }}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
              <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Presets List */}
            <div className="grid grid-cols-2 gap-1 pt-1">
              {DEFAULT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePtzAction('PRESET', { pan: preset.pan, tilt: preset.tilt, zoom: preset.zoom }, preset.name)}
                  className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] font-medium text-slate-300 hover:text-white text-left truncate transition-colors border border-slate-800"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- BOTTOM TACTICAL PLAYER CONTROLS ---------------- */}
      {showControls && (
        <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-3.5 py-2 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent opacity-95 group-hover:opacity-100 transition-opacity">
          {/* Left: Playback & Volume & PTZ */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                if (!videoRef.current) return;
                if (videoRef.current.paused) {
                  videoRef.current.play();
                  setIsPlaying(true);
                } else {
                  videoRef.current.pause();
                  setIsPlaying(false);
                }
              }}
              disabled={streamState !== 'LIVE'}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors disabled:opacity-40"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                if (!videoRef.current) return;
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
              }}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* PTZ Deck Toggle */}
            <button
              onClick={() => setShowPtzDeck((prev) => !prev)}
              disabled={streamState !== 'LIVE'}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                showPtzDeck ? 'bg-indigo-600 text-white' : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300'
              }`}
              title="Toggle Tactical PTZ Controller"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>

            {/* Edge AI Vision Toggle */}
            <button
              onClick={() => setAiVisionEnabled((prev) => !prev)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 ${
                aiVisionEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700'
              }`}
              title="Toggle Edge AI Computer Vision Analytics HUD"
            >
              {aiVisionEnabled ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
              AI HUD
            </button>
          </div>

          {/* Right: Capture Evidence & Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleCaptureSnapshot}
              disabled={isCapturing || streamState !== 'LIVE'}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-40"
              title="Capture certified statutory evidence snapshot with SHA-256 integrity hash"
            >
              <CameraIcon className="w-3.5 h-3.5" />
              {isCapturing ? 'Capturing...' : 'Capture Evidence'}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
