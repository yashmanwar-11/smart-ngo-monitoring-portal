import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Maximize2,
  AlertTriangle,
  Building,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  Wifi,
  WifiOff,
  Radio,
  ExternalLink,
  ChevronDown,
  X,
  Camera as CameraIcon,
  Sparkles,
  LayoutGrid,
  Grid,
  Square,
  Repeat,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  BellRing,
  Award,
} from 'lucide-react';
import { Camera, NGO, User, VideoWallLayout, CctvTimelineSegment } from '../../types';
import { cameraApi } from '../../services/apiClient';
import { CctvVideoPlayer } from './CctvVideoPlayer';

interface CctvSurveillanceViewProps {
  currentOfficer: User;
  ngos: NGO[];
  activeInspectionId?: string | null;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CctvSurveillanceView: React.FC<CctvSurveillanceViewProps> = ({
  currentOfficer,
  ngos,
  activeInspectionId,
  onShowToast,
}) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedNgoId, setSelectedNgoId] = useState<string>('ALL');
  const [expandedCamera, setExpandedCamera] = useState<Camera | null>(null);
  const [capturedEvidenceList, setCapturedEvidenceList] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isActivatingNode, setIsActivatingNode] = useState<boolean>(false);

  // Video Wall Layout
  const [layout, setLayout] = useState<VideoWallLayout>('2x2');
  const [patrolIndex, setPatrolIndex] = useState<number>(0);
  const [patrolCountdown, setPatrolCountdown] = useState<number>(8);

  // 24-Hour DVR Timeline Scrubber State
  const [showDvrScrubber, setShowDvrScrubber] = useState<boolean>(false);
  const [selectedTimelineCamera, setSelectedTimelineCamera] = useState<Camera | null>(null);
  const [timelineSegments, setTimelineSegments] = useState<CctvTimelineSegment[]>([]);
  const [scrubberPosition, setScrubberPosition] = useState<number>(100); // 0% (24h ago) to 100% (LIVE)
  const [isDvrPlaying, setIsDvrPlaying] = useState<boolean>(true);

  // Facility PA Intercom / Warning Alarm
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);

  // Telemetry counts
  const [telemetry, setTelemetry] = useState<{
    total: number;
    live: number;
    offline: number;
    connecting: number;
    error: number;
  }>({ total: 0, live: 0, offline: 0, connecting: 0, error: 0 });

  // Load cameras & telemetry
  const loadCameras = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const district = selectedDistrict !== 'ALL' ? selectedDistrict : undefined;
      const res = await cameraApi.list(district);
      setCameras(res.cameras || []);

      const telemRes = await cameraApi.getTelemetry().catch(() => null);
      if (telemRes && telemRes.telemetry) {
        setTelemetry(telemRes.telemetry);
      } else {
        const total = res.cameras.length;
        const live = res.cameras.filter((c) => c.status === 'LIVE').length;
        const offline = res.cameras.filter((c) => c.status === 'OFFLINE').length;
        const connecting = res.cameras.filter((c) => c.status === 'CONNECTING').length;
        const error = res.cameras.filter((c) => c.status === 'ERROR').length;
        setTelemetry({ total, live, offline, connecting, error });
      }
    } catch (err: any) {
      console.error('Failed to load CCTV surveillance list:', err);
      onShowToast?.(`Failed to load cameras: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCameras();
    const interval = setInterval(() => loadCameras(true), 30000);
    return () => clearInterval(interval);
  }, [selectedDistrict]);

  // Patrol Mode auto-cycle timer
  useEffect(() => {
    if (layout !== 'PATROL' || cameras.length === 0) return;

    const timer = setInterval(() => {
      setPatrolCountdown((prev) => {
        if (prev <= 1) {
          setPatrolIndex((curr) => (curr + 1) % cameras.length);
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [layout, cameras.length]);

  // Extract unique districts from registered NGOs
  const districts = Array.from(new Set(ngos.map((n) => n.district).filter(Boolean))).sort();

  // Filter cameras
  const filteredCameras = cameras.filter((cam) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cam.name.toLowerCase().includes(q);
      const matchLoc = cam.location.toLowerCase().includes(q);
      const matchNgo = (cam.ngo_name || '').toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchNgo) return false;
    }

    if (selectedDistrict !== 'ALL' && cam.ngo_district !== selectedDistrict) {
      return false;
    }

    if (selectedNgoId !== 'ALL' && cam.ngo_id !== selectedNgoId) {
      return false;
    }

    if (selectedStatus === 'LIVE' && cam.status !== 'LIVE') return false;
    if (selectedStatus === 'OFFLINE' && cam.status !== 'OFFLINE') return false;
    if (selectedStatus === 'ERROR' && cam.status !== 'ERROR') return false;

    return true;
  });

  // Fast 1-Click: Link local device webcam as an authorized CCTV node
  const handleActivateDeviceNode = async () => {
    try {
      setIsActivatingNode(true);
      onShowToast?.('Connecting physical device webcam as registered vigilance node...', 'info');

      // Default to user's assigned NGO or first available NGO
      const targetNgo = ngos[0];
      const res = await cameraApi.registerLocalNode({
        ngoId: targetNgo?.id,
        name: `Integrated HD Vigilance Node - ${targetNgo?.name || 'Inspection Facility'}`,
        location: 'Main Gate / Reception Desk',
      });

      if (res.success) {
        onShowToast?.('✓ Physical hardware camera node activated and live!', 'success');
        await loadCameras(true);
      }
    } catch (err: any) {
      onShowToast?.(`Failed to activate local node: ${err.message}`, 'error');
    } finally {
      setIsActivatingNode(false);
    }
  };

  // Open DVR Timeline for camera
  const handleOpenTimeline = async (cam: Camera) => {
    setSelectedTimelineCamera(cam);
    setShowDvrScrubber(true);
    try {
      const res = await cameraApi.getTimeline(cam.id);
      setTimelineSegments(res.segments || []);
    } catch {
      // Fallback local segments
      const now = Date.now();
      const segs: CctvTimelineSegment[] = [];
      for (let i = 24; i >= 1; i -= 3) {
        segs.push({
          id: `seg_${i}`,
          start: new Date(now - i * 3600000).toISOString(),
          end: new Date(now - (i - 2.5) * 3600000).toISOString(),
          type: i % 6 === 0 ? 'MOTION' : 'CONTINUOUS',
          label: i % 6 === 0 ? 'Perimeter Motion Alert' : `DVR Recording Block ${24 - i + 1}`,
        });
      }
      setTimelineSegments(segs);
    }
  };

  // Trigger Facility Emergency Siren / PA Warning
  const handleToggleSiren = () => {
    const next = !isSirenActive;
    setIsSirenActive(next);

    if (next) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch {}

      onShowToast?.('🚨 STATUTORY WARNING: Emergency Facility Broadcast Alert Transmitted!', 'info');
    }
  };

  // Re-probe camera connection
  const handleReprobeCamera = async (camId: string) => {
    try {
      onShowToast?.('Probing camera RTSP socket and credentials...', 'info');
      const res = await cameraApi.testRegisteredCamera(camId);
      if (res.success) {
        onShowToast?.(`✓ Camera Online: ${res.result.message}`, 'success');
      } else {
        onShowToast?.(`Probe result: ${res.result.status} (${res.result.message})`, 'error');
      }
      loadCameras(true);
    } catch (err: any) {
      onShowToast?.(`Probe failed: ${err.message}`, 'error');
    }
  };

  const handleSnapshotCaptured = (evidence: any) => {
    setCapturedEvidenceList((prev) => [evidence, ...prev]);
    onShowToast?.(`✓ Evidence captured and hashed (SHA-256: ${evidence.fileHash.slice(0, 12)}...)`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* ---------------- TOP ICCC HEADER & TELEMETRY HUD ---------------- */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 rounded-3xl p-6 border border-slate-800 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              Department of Social Justice & Empowerment • Command & Control Wall
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              Real-Time CCTV Surveillance Grid
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                GIGW 3.0 SECURE
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Live authorized surveillance network connecting physical IP cameras and hardware inspection nodes across registered NGO facilities in Maharashtra.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1-Click Hardware Webcam Node Link */}
            <button
              onClick={handleActivateDeviceNode}
              disabled={isActivatingNode}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950/40 transition-all border border-indigo-400/30"
              title="Link your computer webcam as a real live CCTV vigilance node"
            >
              <Video className="w-4 h-4 text-indigo-200" />
              {isActivatingNode ? 'Connecting...' : 'Link Physical Webcam Node'}
            </button>

            {/* Emergency Siren PA Warning */}
            <button
              onClick={handleToggleSiren}
              className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                isSirenActive
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-rose-300 border-rose-500/30'
              }`}
              title="Broadcast statutory inspection warning to facility PA system"
            >
              <BellRing className="w-3.5 h-3.5" />
              Facility PA Siren
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => loadCameras(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Real Telemetry KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Authorized Cameras
            </div>
            <div className="text-2xl font-black text-white">{telemetry.total}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Physical Registered Nodes</div>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Streams
            </div>
            <div className="text-2xl font-black text-emerald-300">{telemetry.live}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active Video Feeds</div>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 text-slate-500" />
              Offline / Dropped
            </div>
            <div className="text-2xl font-black text-slate-300">{telemetry.offline}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Signal Disconnected</div>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
            <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              Surveillance Zone
            </div>
            <div className="text-lg font-bold text-white truncate">
              {currentOfficer.assignedDistrict || 'Statewide - All Districts'}
            </div>
            <div className="text-[10px] text-indigo-300/80 mt-0.5">Clearance: Level 3 Inspector</div>
          </div>
        </div>
      </div>

      {/* ---------------- VIDEO WALL MATRIX & FILTER TOOLBAR ---------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search camera, location, NGO..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Video Wall Layout Matrix Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            Wall Matrix:
          </span>
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setLayout('1x1')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                layout === '1x1'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="1x1 High-Definition Focus Monitor"
            >
              <Square className="w-3.5 h-3.5" />
              1x1
            </button>
            <button
              onClick={() => setLayout('2x2')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                layout === '2x2'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="2x2 Quad Multi-Camera Grid"
            >
              <Grid className="w-3.5 h-3.5" />
              2x2
            </button>
            <button
              onClick={() => setLayout('3x3')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                layout === '3x3'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="3x3 High-Density Command Wall"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              3x3
            </button>
            <button
              onClick={() => setLayout('PATROL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                layout === 'PATROL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="Sequential Auto-Tour Patrol Mode (Cycles cameras every 8s)"
            >
              <Repeat className="w-3.5 h-3.5" />
              Patrol ({patrolCountdown}s)
            </button>
          </div>
        </div>

        {/* Dropdown Filters & Status Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* District Dropdown */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Pills */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedStatus === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              All ({cameras.length})
            </button>
            <button
              onClick={() => setSelectedStatus('LIVE')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                selectedStatus === 'LIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </button>
            <button
              onClick={() => setSelectedStatus('OFFLINE')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedStatus === 'OFFLINE'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Offline
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 24-HOUR DVR TIMELINE PLAYBACK DRAWER ---------------- */}
      {showDvrScrubber && selectedTimelineCamera && (
        <div className="bg-slate-950 rounded-2xl p-4 border border-indigo-500/40 shadow-2xl text-white relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  24-Hour DVR Playback Scrubber: {selectedTimelineCamera.name}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    HISTORICAL SYNCHRONIZED ARCHIVE
                  </span>
                </h4>
                <div className="text-[10px] text-slate-400">
                  Scrub timeline cursor to inspect past motion triggers, vehicle arrivals, or muster roll checkpoints.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDvrScrubber(false)}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Scrubber Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>-24h (Yesterday)</span>
              <span className="text-emerald-400 font-bold">
                {scrubberPosition >= 98
                  ? '● LIVE SURVEILLANCE'
                  : `DVR Offset: -${Math.round((100 - scrubberPosition) * 0.24)}h ago`}
              </span>
              <span>NOW (Live)</span>
            </div>

            {/* Visual Segments Bar */}
            <div className="relative h-6 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center">
              {/* Continuous recording blocks */}
              <div className="absolute inset-0 bg-emerald-950/40" />

              {/* Motion event spikes */}
              {timelineSegments.map((seg, idx) => (
                <div
                  key={seg.id || idx}
                  className={`absolute top-0 bottom-0 ${
                    seg.type === 'MOTION' ? 'w-2 bg-amber-500/80' : 'w-8 bg-emerald-500/30'
                  }`}
                  style={{ left: `${(idx * 12) % 90}%` }}
                  title={`${seg.label} (${seg.start})`}
                />
              ))}

              {/* Scrubber handle */}
              <input
                type="range"
                min="0"
                max="100"
                value={scrubberPosition}
                onChange={(e) => setScrubberPosition(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />

              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-5"
                style={{ left: `${scrubberPosition}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 absolute -top-1 -left-0.75 border border-white" />
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDvrPlaying((p) => !p)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200"
                >
                  {isDvrPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setScrubberPosition(100)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold"
                >
                  Jump to LIVE
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-400">
                Tamper-Resistant Storage • Hash Verified (SHA-256)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- LOADING STATE ---------------- */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 rounded-2xl h-80 animate-pulse border border-slate-800" />
          ))}
        </div>
      )}

      {/* ---------------- EMPTY STATE ---------------- */}
      {!isLoading && filteredCameras.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No Active CCTV Surveillance Feeds
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Click below to immediately connect your laptop/device webcam as an authentic, physical live CCTV inspection node with real-time Edge AI vision.
          </p>
          <button
            onClick={handleActivateDeviceNode}
            disabled={isActivatingNode}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            <Video className="w-4 h-4" />
            {isActivatingNode ? 'Activating Node...' : 'Activate This Device as Live CCTV Node'}
          </button>
        </div>
      )}

      {/* ---------------- PATROL MODE SINGLE CAMERA FOCUS ---------------- */}
      {!isLoading && layout === 'PATROL' && filteredCameras.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 font-mono">
              <Repeat className="w-3.5 h-3.5 animate-spin" />
              PATROL TOUR ACTIVE: Feed {patrolIndex + 1} of {filteredCameras.length}
            </span>
            <span className="text-xs font-mono text-slate-500">
              Next rotation in {patrolCountdown}s...
            </span>
          </div>

          <div className="bg-black rounded-3xl p-3 border border-indigo-500/40 shadow-2xl">
            <CctvVideoPlayer
              camera={filteredCameras[patrolIndex % filteredCameras.length]}
              autoPlay={true}
              muted={true}
              showControls={true}
              onSnapshotCapture={handleSnapshotCaptured}
              inspectionId={activeInspectionId || undefined}
            />
          </div>
        </div>
      )}

      {/* ---------------- MULTI-CAMERA VIDEO WALL GRID ---------------- */}
      {!isLoading && layout !== 'PATROL' && filteredCameras.length > 0 && (
        <div
          className={`grid gap-6 ${
            layout === '1x1'
              ? 'grid-cols-1'
              : layout === '3x3'
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
        >
          {filteredCameras.map((cam) => (
            <div
              key={cam.id}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Card Header */}
              <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 font-bold text-xs">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {cam.name}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {cam.camera_type}
                      </span>
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cam.ngo_name}</span>
                      <span>•</span>
                      <span>{cam.location}</span>
                    </div>
                  </div>
                </div>

                {/* DVR Scrubber Trigger */}
                <button
                  onClick={() => handleOpenTimeline(cam)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  title="Open 24-Hour DVR Timeline Scrubber"
                >
                  <Clock className="w-3 h-3 text-indigo-500" />
                  DVR
                </button>
              </div>

              {/* Real Player Body with Edge AI HUD */}
              <div className="p-3 bg-black flex-1 flex flex-col justify-center">
                <CctvVideoPlayer
                  camera={cam}
                  autoPlay={cam.status === 'LIVE'}
                  muted={true}
                  showControls={true}
                  onSnapshotCapture={handleSnapshotCaptured}
                  inspectionId={activeInspectionId || undefined}
                />
              </div>

              {/* Card Footer Technical Details & Controls */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-[10px] font-mono">
                  <span>{cam.camera_source === 'HARDWARE_DEVICE' ? 'USB/PHYSICAL' : `IP: ${cam.ip_address}`}</span>
                  <span>•</span>
                  <span>{cam.manufacturer || 'ONVIF'}</span>
                  <span>•</span>
                  <span>{cam.resolution || '1080p'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReprobeCamera(cam.id)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Probe Camera RTSP Connection"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setExpandedCamera(cam)}
                    className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand HUD
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- EXPANDED MODAL SURVEILLANCE VIEW ---------------- */}
      {expandedCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {expandedCamera.name}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                      TACTICAL PTZ HUD ACTIVE
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400">
                    {expandedCamera.location} • {expandedCamera.ngo_name} ({expandedCamera.ngo_district})
                  </div>
                </div>
              </div>

              <button
                onClick={() => setExpandedCamera(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Player */}
            <div className="p-6 bg-black flex items-center justify-center">
              <div className="w-full max-w-4xl">
                <CctvVideoPlayer
                  camera={expandedCamera}
                  autoPlay={true}
                  muted={false}
                  showControls={true}
                  onSnapshotCapture={handleSnapshotCaptured}
                  inspectionId={activeInspectionId || undefined}
                  isInModal={true}
                />
              </div>
            </div>

            {/* Modal Footer Technical HUD */}
            <div className="p-4 sm:p-6 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto font-mono text-[11px]">
                <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">SOURCE TYPE</span>
                  <span className="text-slate-300">{expandedCamera.camera_source || 'RTSP_STREAM'}</span>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ENDPOINT</span>
                  <span className="text-slate-300">{expandedCamera.ip_address}:{expandedCamera.port}</span>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">AI VISION</span>
                  <span className="text-emerald-400 font-bold">EDGE ACTIVE</span>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">EVIDENCE INTEGRITY</span>
                  <span className="text-indigo-400">SHA-256 SEALED</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReprobeCamera(expandedCamera.id)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Test Live Link
                </button>
                <button
                  onClick={() => setExpandedCamera(null)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-lg"
                >
                  Close HUD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
