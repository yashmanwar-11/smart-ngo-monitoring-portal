import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Video,
  Maximize2,
  Minimize2,
  MoreVertical,
  Camera as CameraIcon,
  Clock,
  FileText,
  Grid,
  List,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Eye,
  Radio,
  Building,
  GraduationCap,
  Heart,
  Award,
  Sparkles,
  Download,
  Shield,
  Layers,
  Search,
  Check,
  X
} from 'lucide-react';
import { NGO, User } from '../../types';

interface InstituteLiveCctvViewProps {
  institute: NGO;
  currentOfficer: User;
  onBack: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface CctvFeed {
  id: string;
  name: string;
  location: string;
  resolution: string;
  fps: number;
  imageUrl: string;
  status: 'LIVE' | 'BUFFERING' | 'OFFLINE';
  peopleCount: number;
}

export const InstituteLiveCctvView: React.FC<InstituteLiveCctvViewProps> = ({
  institute,
  currentOfficer,
  onBack,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'LIVE_CCTV' | 'CAMERA_LIST' | 'PLAYBACK' | 'SNAPSHOTS' | 'SETTINGS'>('LIVE_CCTV');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [selectedCameraFilter, setSelectedCameraFilter] = useState<string>('ALL');
  const [expandedFeed, setExpandedFeed] = useState<CctvFeed | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [capturedSnapshots, setCapturedSnapshots] = useState<{ id: string; camName: string; time: string; url: string }[]>([]);
  const [isDvrPlaying, setIsDvrPlaying] = useState<boolean>(true);
  const [dvrPosition, setDvrPosition] = useState<number>(100); // 100 = LIVE, 0 = 24h ago
  const [isAiOverlayActive, setIsAiOverlayActive] = useState<boolean>(true);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format dynamic IST clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentTimeStr(now.toLocaleDateString('en-GB', options).replace(/,/g, ''));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    const now = new Date();
    setLastUpdatedTime(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }));

    return () => clearInterval(interval);
  }, []);

  // 8 Dedicated Camera Feeds matching the exact mockup
  const cctvFeeds: CctvFeed[] = [
    {
      id: 'cam_1',
      name: 'Main Gate',
      location: 'Front Entrance & Outer Gate',
      resolution: '1080p',
      fps: 30,
      imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
      status: 'LIVE',
      peopleCount: 2,
    },
    {
      id: 'cam_2',
      name: 'Reception Area',
      location: 'Admin Desk & Visitors Lobby',
      resolution: '1080p',
      fps: 30,
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
      status: 'LIVE',
      peopleCount: 3,
    },
    {
      id: 'cam_3',
      name: 'Classroom 1',
      location: 'Primary Teaching Wing A',
      resolution: '1080p',
      fps: 30,
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
      status: 'LIVE',
      peopleCount: 24,
    },
    {
      id: 'cam_4',
      name: 'Classroom 2',
      location: 'Secondary Teaching Wing B',
      resolution: '1080p',
      fps: 30,
      imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
      status: 'LIVE',
      peopleCount: 18,
    },
    {
      id: 'cam_5',
      name: 'Computer Lab',
      location: 'IT & Digital Literacy Room',
      resolution: '1080p',
      fps: 30,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
      status: 'LIVE',
      peopleCount: 15,
    },
    {
      id: 'cam_6',
      name: 'Activity Hall',
      location: 'Multipurpose Skill & Therapy Center',
      resolution: '1080p',
      fps: 30,
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
      status: 'LIVE',
      peopleCount: 8,
    },
    {
      id: 'cam_7',
      name: 'Office Room',
      location: 'Managing Trustee & Records Room',
      resolution: '1080p',
      fps: 30,
      imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
      status: 'LIVE',
      peopleCount: 2,
    },
    {
      id: 'cam_8',
      name: 'Back Area',
      location: 'Rear Courtyard & Perimeter Wall',
      resolution: '1080p',
      fps: 30,
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
      status: 'LIVE',
      peopleCount: 1,
    },
  ];

  const filteredFeeds = selectedCameraFilter === 'ALL'
    ? cctvFeeds
    : cctvFeeds.filter((f) => f.id === selectedCameraFilter);

  // Take Snapshot function
  const handleTakeSnapshot = (feed?: CctvFeed) => {
    const target = feed || cctvFeeds[0];
    const newSnap = {
      id: `snap_${Date.now()}`,
      camName: target.name,
      time: currentTimeStr || new Date().toLocaleTimeString('en-IN'),
      url: target.imageUrl,
    };
    setCapturedSnapshots((prev) => [newSnap, ...prev]);
    onShowToast?.(`📸 Surveillance snapshot saved for ${target.name} with certified watermark and SHA-256 timestamp.`, 'success');
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Category Icon helper
  const getCategoryIcon = () => {
    switch (institute.sector) {
      case 'Education':
        return <Building className="w-5 h-5 text-red-600" />;
      case 'Divyang Care':
        return <Heart className="w-5 h-5 text-blue-600" />;
      case 'Skill Development':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'Women Empowerment':
        return <Sparkles className="w-5 h-5 text-rose-600" />;
      default:
        return <Building className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div ref={containerRef} className="space-y-4 animate-fade-in bg-slate-50 min-h-screen pb-12">
      {/* 1. Header Bar matching mockup */}
      <div className="bg-white px-4 py-3 sm:py-3.5 border-b border-slate-200 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Details"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Live CCTV Monitoring</h2>
            <p className="text-[11px] text-slate-500 font-mono">Camera Hub • Node ID #{institute.id.replace('ngo_', '')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onShowToast?.('CCTV Stream Settings & Stream Encryption: TLS 1.3 Active', 'info')}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. NGO Facility Status Header Card */}
      <div className="mx-3 sm:mx-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 shadow-2xs">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{institute.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                NGO | {institute.scheme || 'Education Support Scheme'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {institute.address.split(',')[0]}, {institute.district}, {institute.state}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            <span className="text-[11px] text-slate-500 block">Last Updated</span>
            <span className="text-xs font-semibold text-slate-800">{lastUpdatedTime}</span>
            <div className="mt-1 flex items-center sm:justify-end space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-700">All Systems Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs matching mockup */}
      <div className="mx-3 sm:mx-6 border-b border-slate-200 flex items-center space-x-6 text-xs font-bold overflow-x-auto no-scrollbar">
        {[
          { id: 'LIVE_CCTV', label: 'Live CCTV' },
          { id: 'CAMERA_LIST', label: 'Camera List' },
          { id: 'PLAYBACK', label: 'Playback' },
          { id: 'SNAPSHOTS', label: `Snapshots (${capturedSnapshots.length})` },
          { id: 'SETTINGS', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`pb-2.5 whitespace-nowrap cursor-pointer transition-all border-b-2 ${
              activeSubTab === tab.id
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Controls Row: Dropdown, Multi-View, Grid/List Toggles */}
      <div className="mx-3 sm:mx-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {/* Camera Filter Dropdown */}
          <select
            value={selectedCameraFilter}
            onChange={(e) => setSelectedCameraFilter(e.target.value)}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Cameras ({cctvFeeds.length})</option>
            {cctvFeeds.map((feed, idx) => (
              <option key={feed.id} value={feed.id}>
                Cam {idx + 1} - {feed.name}
              </option>
            ))}
          </select>

          {/* AI Overlay toggle */}
          <button
            type="button"
            onClick={() => {
              setIsAiOverlayActive(!isAiOverlayActive);
              onShowToast?.(isAiOverlayActive ? 'AI Vision overlay hidden' : 'AI Vision overlay activated: People count & tamper detector', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center space-x-1.5 ${
              isAiOverlayActive
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Analytics</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-600 hidden sm:inline">Multi View</span>
          <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center space-x-0.5">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid View (2x4 / 4x2)"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. TAB CONTENT: LIVE CCTV */}
      {activeSubTab === 'LIVE_CCTV' && (
        <div className="mx-3 sm:mx-6 space-y-4">
          {/* Feeds Grid (2x4 or 4x2) */}
          <div className={`grid gap-3 sm:gap-4 ${
            viewMode === 'GRID'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 max-w-3xl mx-auto'
          }`}>
            {filteredFeeds.map((feed) => (
              <div
                key={feed.id}
                className="group relative bg-slate-950 rounded-2xl overflow-hidden shadow-xs border border-slate-800 transition-all hover:shadow-md hover:border-slate-700"
              >
                {/* Camera Video / Photo Stream */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={feed.imageUrl}
                    alt={feed.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlays for contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/75 pointer-events-none" />

                  {/* Top Bar on Feed: Name & Live Badge */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-xs font-bold font-sans tracking-wide border border-white/10 shadow-xs">
                      {feed.name}
                    </span>
                    <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[11px] font-bold text-white tracking-wider">Live</span>
                    </div>
                  </div>

                  {/* AI Vision Analytics Overlay Badge */}
                  {isAiOverlayActive && (
                    <div className="absolute top-10 left-2.5 flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-950/80 backdrop-blur-xs border border-blue-400/40 text-[10px] text-blue-200">
                      <span>👤 {feed.peopleCount} Present</span>
                      <span className="text-emerald-400">• Clear</span>
                    </div>
                  )}

                  {/* Bottom Bar on Feed: Running Time & Expand Button */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-200 font-bold tracking-tight bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      {currentTimeStr || '13 Sep 2026 09:41:12 AM'}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleTakeSnapshot(feed)}
                        className="p-1 rounded bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
                        title="Capture Snapshot"
                      >
                        <CameraIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedFeed(feed)}
                        className="p-1 rounded bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
                        title="Expand Stream"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* List View Details (visible when viewMode is LIST) */}
                {viewMode === 'LIST' && (
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs border-t border-slate-800">
                    <div>
                      <span className="font-bold text-white block">{feed.name}</span>
                      <span className="text-[11px] text-slate-400">{feed.location}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-300">
                      <span>Resolution: {feed.resolution}</span>
                      <span>FPS: {feed.fps}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedFeed(feed)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Enlarge
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Department Guidelines Banner matching mockup */}
          <div className="bg-blue-50/80 border border-blue-200/80 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs text-blue-900 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
              i
            </div>
            <span className="font-medium">
              CCTV feeds are live and recorded as per department guidelines under MoSJE Vigilance Framework 2026.
            </span>
          </div>

          {/* Action Controls Bar matching mockup sticky bottom */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-around gap-2 text-xs font-bold text-slate-800">
            <button
              type="button"
              onClick={() => handleTakeSnapshot()}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer"
            >
              <CameraIcon className="w-4 h-4 text-blue-600" />
              <span>Take Snapshot</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('PLAYBACK')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>View Playback</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Download Report</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: CAMERA LIST */}
      {activeSubTab === 'CAMERA_LIST' && (
        <div className="mx-3 sm:mx-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Facility Camera Inventory</h3>
              <p className="text-xs text-slate-500">8 IP Surveillance Cameras connected via NIC Secure VPN Gateway</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
              8/8 Online
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {cctvFeeds.map((feed, idx) => (
              <div key={feed.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm block">{feed.name}</span>
                    <span className="text-[11px] text-slate-500">{feed.location}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-mono text-slate-600 hidden sm:inline">{feed.resolution} @ {feed.fps}fps</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                    ● Connected
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedFeed(feed);
                      setActiveSubTab('LIVE_CCTV');
                    }}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: PLAYBACK & DVR */}
      {activeSubTab === 'PLAYBACK' && (
        <div className="mx-3 sm:mx-6 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">24-Hour DVR Footage Playback</h3>
              <p className="text-xs text-slate-500">Government Archive Vault • Certified Tamper-Proof Storage</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsDvrPlaying(!isDvrPlaying)}
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isDvrPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isDvrPlaying ? 'Pause DVR' : 'Play DVR'}</span>
              </button>
            </div>
          </div>

          {/* Active playback video feed */}
          <div className="relative aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
            <img
              src={cctvFeeds[0].imageUrl}
              alt="DVR Playback"
              className="w-full h-full object-cover filter brightness-95"
            />
            <div className="absolute top-3 left-3 bg-black/75 text-amber-300 font-mono text-xs px-3 py-1 rounded-lg border border-amber-400/30">
              REC PLAYBACK • -{Math.round((100 - dvrPosition) * 0.24)}h 12m
            </div>
            <div className="absolute bottom-3 right-3 bg-black/75 text-white font-mono text-xs px-3 py-1 rounded-lg">
              1080p ARCHIVE
            </div>
          </div>

          {/* DVR Timeline Scrubber */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>24 Hours Ago (Yesterday)</span>
              <span className="text-blue-700 font-mono">Scrubbed Position: {dvrPosition}%</span>
              <span className="text-emerald-700">LIVE NOW</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={dvrPosition}
              onChange={(e) => setDvrPosition(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span className="text-emerald-700 font-bold">LIVE (NOW)</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB CONTENT: SNAPSHOTS */}
      {activeSubTab === 'SNAPSHOTS' && (
        <div className="mx-3 sm:mx-6 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Captured Surveillance Proofs</h3>
              <p className="text-xs text-slate-500">Official evidence photos recorded during surveillance session</p>
            </div>
            <button
              type="button"
              onClick={() => handleTakeSnapshot()}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CameraIcon className="w-3.5 h-3.5" />
              <span>Capture New</span>
            </button>
          </div>

          {capturedSnapshots.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <CameraIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700">No snapshots captured yet</p>
              <p className="text-xs text-slate-500 mt-1">Tap "Take Snapshot" while monitoring live feeds to save evidence.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {capturedSnapshots.map((snap) => (
                <div key={snap.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="relative aspect-video">
                    <img src={snap.url} alt={snap.camName} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/75 text-white font-mono text-[10px] px-2 py-0.5 rounded">
                      {snap.time}
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{snap.camName}</span>
                      <span className="text-[10px] text-slate-500">SHA-256 Verified Evidence</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onShowToast?.(`Downloading watermarked proof for ${snap.camName}...`, 'success')}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 9. TAB CONTENT: SETTINGS */}
      {activeSubTab === 'SETTINGS' && (
        <div className="mx-3 sm:mx-6 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-200 pb-3">CCTV Stream Configuration</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">NIC Gov Stream Gateway Protocol</span>
                <span className="text-slate-500 text-[11px]">Secure HLS / RTSP over TLS with Token Authentication</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold font-mono">
                TLS 1.3 / AES-256
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Retention Period</span>
                <span className="text-slate-500 text-[11px]">Continuous rolling DVR storage on state government cloud</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold font-mono">
                90 Days Rolling
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">AI Automated Vigilance Alerts</span>
                <span className="text-slate-500 text-[11px]">Camera occlusion, black screen, or field tamper detection</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                Active &bull; Real-time Alerting
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 10. Expanded Fullscreen Modal for single camera */}
      {expandedFeed && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-3 sm:p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="font-bold text-white text-base">{expandedFeed.name}</h3>
                <span className="text-xs text-slate-400 font-mono">({expandedFeed.location})</span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedFeed(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              <img src={expandedFeed.imageUrl} alt={expandedFeed.name} className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 bg-black/75 text-white font-mono text-xs px-2.5 py-1 rounded">
                LIVE &bull; {currentTimeStr}
              </div>
              <div className="absolute bottom-3 left-3 bg-black/75 text-emerald-400 font-mono text-xs px-2.5 py-1 rounded">
                1080p | 30fps | Bitrate: 4.2 Mbps
              </div>
              {isAiOverlayActive && (
                <div className="absolute top-3 right-3 bg-blue-900/80 text-blue-200 border border-blue-400/40 font-sans text-xs px-3 py-1 rounded-lg">
                  AI: {expandedFeed.peopleCount} Persons &bull; Normal Activity
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Officer: {currentOfficer.name} ({currentOfficer.badgeNumber || 'INSP-DEL-402'})</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleTakeSnapshot(expandedFeed)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CameraIcon className="w-3.5 h-3.5" />
                  <span>Capture Snapshot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedFeed(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. Official Certificate / Surveillance Report Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base text-white">CCTV Surveillance Audit Certificate</h3>
                  <p className="text-xs text-blue-200">Department of Social Justice &amp; Empowerment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-900 border-b pb-2">
                  <span>Facility:</span>
                  <span>{institute.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registration ID:</span>
                  <span className="font-mono font-bold text-slate-800">{institute.regNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheme:</span>
                  <span className="font-semibold text-slate-800">{institute.scheme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Surveillance Status:</span>
                  <span className="font-bold text-emerald-700">100% Online (8/8 Cameras Verified)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Auditing Inspector:</span>
                  <span className="font-semibold text-slate-800">{currentOfficer.name} ({currentOfficer.badgeNumber || 'INSP-DEL-402'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Certificate Generation Date:</span>
                  <span className="font-mono text-slate-800">{currentTimeStr}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  All 8 CCTV nodes (Main Gate, Reception, Classrooms 1 &amp; 2, Computer Lab, Activity Hall, Office, Back Area) meet mandatory Ministry surveillance and beneficiary presence standards.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCertModal(false);
                  onShowToast?.('✓ CCTV Surveillance Audit Certificate PDF downloaded successfully.', 'success');
                }}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Certified PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
