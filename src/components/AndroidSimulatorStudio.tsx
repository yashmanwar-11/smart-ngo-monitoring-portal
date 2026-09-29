import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Tablet,
  RotateCw,
  X,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Battery,
  Shield,
  Bell,
  Sparkles,
  Layers,
  ArrowLeft,
  Circle,
  Square,
  ZoomIn,
  Compass,
  UserCheck,
  FileCheck2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Palette
} from 'lucide-react';
import { EmblemOfIndia } from './EmblemOfIndia';

export type AndroidDeviceModel = 'PIXEL_8_PRO' | 'GALAXY_S24' | 'FIELD_PHONE' | 'ANDROID_TABLET';

interface DeviceSpec {
  name: string;
  brand: string;
  width: number;
  height: number;
  bezelRadius: string;
  screenRadius: string;
  type: 'phone' | 'tablet';
  ratio: string;
}

const DEVICE_SPECS: Record<AndroidDeviceModel, DeviceSpec> = {
  PIXEL_8_PRO: {
    name: 'Google Pixel 8 Pro',
    brand: 'Google Tensor G3 • Android 15',
    width: 412,
    height: 915,
    bezelRadius: 'rounded-[44px]',
    screenRadius: 'rounded-[36px]',
    type: 'phone',
    ratio: '20:9',
  },
  GALAXY_S24: {
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Snapdragon 8 Gen 3 • One UI 6',
    width: 390,
    height: 844,
    bezelRadius: 'rounded-[38px]',
    screenRadius: 'rounded-[30px]',
    type: 'phone',
    ratio: '19.5:9',
  },
  FIELD_PHONE: {
    name: 'Field Officer Rugged Phone',
    brand: 'GovNet Secured Android 14',
    width: 360,
    height: 800,
    bezelRadius: 'rounded-[32px]',
    screenRadius: 'rounded-[24px]',
    type: 'phone',
    ratio: '20:9',
  },
  ANDROID_TABLET: {
    name: 'Rugged Field Inspection Tablet',
    brand: 'GovNet Inspection OS 12.4"',
    width: 768,
    height: 1024,
    bezelRadius: 'rounded-[32px]',
    screenRadius: 'rounded-[24px]',
    type: 'tablet',
    ratio: '4:3',
  },
};

interface AndroidSimulatorStudioProps {
  onClose: () => void;
  initialRole?: string;
  initialView?: string;
}

export const AndroidSimulatorStudio: React.FC<AndroidSimulatorStudioProps> = ({
  onClose,
  initialRole = 'OFFICER',
  initialView = 'HERO',
}) => {
  const [selectedDevice, setSelectedDevice] = useState<AndroidDeviceModel>('PIXEL_8_PRO');
  const [isLandscape, setIsLandscape] = useState(false);
  const [chassisTheme, setChassisTheme] = useState<'obsidian' | 'titanium'>('obsidian');
  const [navStyle, setNavStyle] = useState<'gesture' | 'buttons'>('gesture');
  const [scale, setScale] = useState<number>(0.9);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isRecentsOpen, setIsRecentsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [batteryLevel] = useState(96);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const spec = DEVICE_SPECS[selectedDevice];
  const effectiveWidth = isLandscape ? spec.height : spec.width;
  const effectiveHeight = isLandscape ? spec.width : spec.height;

  // Real-time IST clock for Android status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute local network URL for physical Android device testing
  const localHostName = window.location.hostname;
  const localPort = window.location.port ? `:${window.location.port}` : '';
  const localNetworkUrl =
    localHostName === 'localhost' || localHostName === '127.0.0.1'
      ? `http://10.194.73.98${localPort}`
      : `${window.location.protocol}//${localHostName}${localPort}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    localNetworkUrl
  )}`;

  const getInitialUrl = () => {
    if (initialView === 'WORKER_ATTENDANCE') return '/?android_mode=1&view=WORKER_ATTENDANCE';
    if (initialRole && initialRole !== 'HERO') return `/?android_mode=1&role=${initialRole}`;
    return '/?android_mode=1&role=OFFICER';
  };
  const [currentIframeUrl, setCurrentIframeUrl] = useState<string>(getInitialUrl);

  // Android Navigation Actions
  const handleAndroidBack = () => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.history.back();
      }
    } catch {
      // Fallback
    }
  };

  const handleAndroidHome = () => {
    try {
      const homeUrl = '/?android_mode=1';
      setCurrentIframeUrl(homeUrl);
      if (iframeRef.current) {
        iframeRef.current.src = homeUrl;
      }
    } catch {
      // Fallback
    }
  };

  const handleNavigateIframe = (targetPath: string) => {
    setCurrentIframeUrl(targetPath);
    if (iframeRef.current) {
      iframeRef.current.src = targetPath;
      setIsRecentsOpen(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(localNetworkUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col select-none text-slate-100 overflow-hidden font-sans">
      {/* National Tricolor Accent Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shrink-0" />

      {/* Top Studio Control HUD */}
      <header className="h-16 px-4 sm:px-6 bg-[#0B3B60] border-b border-[#0B3B60] flex items-center justify-between gap-3 shrink-0 shadow-lg z-20 bg-gradient-to-r from-[#07253d] via-[#0B3B60] to-[#0d4672]">
        {/* Left: Branding & Model Tag */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-13 shrink-0 flex items-center justify-center overflow-hidden">
            <EmblemOfIndia variant="badge" size={38} className="shadow-md" />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                INSPIRA Mobile PMU Field Simulator
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                GovNet Secured OS
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium hidden sm:block">
              {spec.name} • MoSJE Mobile Inspection Framework
            </p>
          </div>
        </div>

        {/* Center: Device Controls */}
        <div className="flex items-center gap-2">
          {/* Device Model Selector */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200">
            <span className="text-[11px] text-slate-400 mr-1.5 hidden md:inline">Device:</span>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value as AndroidDeviceModel)}
              className="bg-transparent border-none text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="PIXEL_8_PRO" className="bg-slate-900 text-white">Pixel 8 Pro (412×915)</option>
              <option value="GALAXY_S24" className="bg-slate-900 text-white">Galaxy S24 Ultra (390×844)</option>
              <option value="FIELD_PHONE" className="bg-slate-900 text-white">Field Phone (360×800)</option>
              <option value="ANDROID_TABLET" className="bg-slate-900 text-white">Rugged Tablet (768×1024)</option>
            </select>
          </div>

          {/* Orientation Switcher */}
          <button
            type="button"
            onClick={() => setIsLandscape(!isLandscape)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
            title="Rotate Device Orientation"
          >
            <RotateCw className={`w-3.5 h-3.5 transition-transform duration-300 ${isLandscape ? 'rotate-90 text-emerald-400' : ''}`} />
            <span className="hidden lg:inline">{isLandscape ? 'Landscape' : 'Portrait'}</span>
          </button>

          {/* Scale Selector */}
          <div className="hidden sm:flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2 py-1 text-xs text-slate-200">
            <ZoomIn className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <select
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="bg-transparent border-none text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value={0.75} className="bg-slate-900 text-white">75%</option>
              <option value={0.85} className="bg-slate-900 text-white">85%</option>
              <option value={0.9} className="bg-slate-900 text-white">90% (Recommended)</option>
              <option value={1.0} className="bg-slate-900 text-white">100%</option>
            </select>
          </div>

          {/* Theme Skin Switcher */}
          <button
            type="button"
            onClick={() => setChassisTheme(chassisTheme === 'obsidian' ? 'titanium' : 'obsidian')}
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
            title="Toggle Device Hardware Finish"
          >
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{chassisTheme}</span>
          </button>

          {/* Navigation Bar Style */}
          <button
            type="button"
            onClick={() => setNavStyle(navStyle === 'gesture' ? 'buttons' : 'gesture')}
            className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
            title="Toggle Android Navigation Style (Gestures vs 3-Buttons)"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{navStyle === 'gesture' ? 'Gestures' : '3-Buttons'}</span>
          </button>
        </div>

        {/* Quick Role Switcher Pills */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 p-1 rounded-xl text-xs">
          <span className="text-[10px] text-slate-400 px-1 font-semibold">Test Role:</span>
          <button
            type="button"
            onClick={() => handleNavigateIframe('/?android_mode=1&role=OFFICER')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentIframeUrl.includes('role=OFFICER')
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <FileCheck2 className="w-3 h-3 text-amber-300" />
            <span>Inspector</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigateIframe('/?android_mode=1&view=WORKER_ATTENDANCE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentIframeUrl.includes('WORKER_ATTENDANCE')
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <UserCheck className="w-3 h-3 text-indigo-300" />
            <span>Worker</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigateIframe('/?android_mode=1&role=USER')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentIframeUrl.includes('role=USER')
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-emerald-300" />
            <span>Citizen</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigateIframe('/?android_mode=1&role=ADMIN')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentIframeUrl.includes('role=ADMIN')
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Shield className="w-3 h-3 text-purple-300" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigateIframe('/?android_mode=1')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentIframeUrl === '/?android_mode=1'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Compass className="w-3 h-3 text-blue-300" />
            <span>Home</span>
          </button>
        </div>

        {/* Right: Actions (QR Code for real phone + Exit) */}
        <div className="flex items-center gap-2">
          {/* Test on Physical Android Phone */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
            title="Scan QR Code to open on physical Android smartphone"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test on Real Android</span>
          </button>

          {/* Close / Return to Desktop */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Exit Android View Mode"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative">
        {/* Subtle Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Scaled Android Device Frame Container */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.25s ease-out, width 0.3s ease, height 0.3s ease',
          }}
          className="relative shrink-0 flex items-center justify-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
        >
          {/* External Hardware Buttons */}
          {/* Left Side: Volume Up & Down Buttons */}
          <div className="absolute -left-[14px] top-28 w-[4px] h-14 bg-slate-700 rounded-l-sm pointer-events-none" />
          <div className="absolute -left-[14px] top-46 w-[4px] h-14 bg-slate-700 rounded-l-sm pointer-events-none" />
          {/* Right Side: Power Button */}
          <div className="absolute -right-[14px] top-32 w-[4px] h-16 bg-slate-700 rounded-r-sm pointer-events-none" />

          {/* Outer Metallic Bezel Chassis */}
          <div
            className={`relative p-[11px] ${spec.bezelRadius} transition-all duration-300 ${
              chassisTheme === 'obsidian'
                ? 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[3px] border-slate-700/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                : 'bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 border-[3px] border-slate-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
            }`}
            style={{
              width: effectiveWidth + 24,
              height: effectiveHeight + 24,
            }}
          >
            {/* Screen Glass Surface */}
            <div
              className={`relative w-full h-full bg-slate-900 overflow-hidden ${spec.screenRadius} flex flex-col shadow-inner`}
            >
              {/* Android 15 Status Bar */}
              <div className="h-7 bg-slate-900 text-white px-5 flex items-center justify-between text-[11px] font-semibold shrink-0 z-30 select-none border-b border-white/5">
                {/* Left: Live IST Clock & Notification Icons */}
                <div className="flex items-center space-x-2">
                  <span className="font-mono tracking-tight text-white font-bold">{currentTime || '09:41'}</span>
                  <div className="flex items-center space-x-1.5 opacity-80 text-emerald-400">
                    <Shield className="w-3 h-3" />
                    <Bell className="w-2.5 h-2.5 text-blue-400" />
                  </div>
                </div>

                {/* Center: Android Camera Punch Hole */}
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800/80 flex items-center justify-center shrink-0 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900/90" />
                </div>

                {/* Right: 5G, Wi-Fi, Battery */}
                <div className="flex items-center space-x-2 text-white">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-slate-300">5G</span>
                  <Wifi className="w-3 h-3 text-white" />
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-mono">{batteryLevel}%</span>
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Native App Viewport (Iframe with Full Camera/Microphone/GPS permissions) */}
              <div className="flex-1 w-full relative bg-[#f4f7fa] overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={currentIframeUrl}
                  title="National NGO Portal Android View"
                  className="w-full h-full border-none"
                  allow="camera; microphone; geolocation; clipboard-read; clipboard-write; display-capture"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                  }}
                />

                {/* Android Multitasking App Switcher Drawer (When Recents is Clicked) */}
                {isRecentsOpen && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 p-4 flex flex-col justify-between animate-fade-in text-white">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold tracking-tight">Active Workspaces</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRecentsOpen(false)}
                        className="text-xs text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* App Cards Grid */}
                    <div className="grid grid-cols-1 gap-2.5 my-auto max-h-[70%] overflow-y-auto pr-1">
                      {/* Card 1: Worker Attendance */}
                      <button
                        type="button"
                        onClick={() => handleNavigateIframe('/?android_mode=1&view=WORKER_ATTENDANCE')}
                        className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center space-x-3 text-left transition-all hover:scale-101 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center shrink-0">
                          <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">Staff Attendance Terminal</p>
                          <p className="text-[10px] text-slate-400 truncate">Dual Camera Punch-In & Check-Out</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-700 rounded-full">
                          ACTIVE
                        </span>
                      </button>

                      {/* Card 2: Field Inspector Terminal */}
                      <button
                        type="button"
                        onClick={() => handleNavigateIframe('/?android_mode=1&role=OFFICER')}
                        className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center space-x-3 text-left transition-all hover:scale-101 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center shrink-0">
                          <FileCheck2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">Inspector GPS Terminal</p>
                          <p className="text-[10px] text-slate-400 truncate">150m Geofence & Evidence Capture</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700 rounded-full">
                          GPS LOCKED
                        </span>
                      </button>

                      {/* Card 3: Citizen Grievances */}
                      <button
                        type="button"
                        onClick={() => handleNavigateIframe('/?android_mode=1&role=USER')}
                        className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center space-x-3 text-left transition-all hover:scale-101 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">Citizen Grievance Desk</p>
                          <p className="text-[10px] text-slate-400 truncate">Report Malpractice & Whistleblower</p>
                        </div>
                      </button>

                      {/* Card 4: Portal Home */}
                      <button
                        type="button"
                        onClick={() => handleNavigateIframe('/?android_mode=1')}
                        className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center space-x-3 text-left transition-all hover:scale-101 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-600 flex items-center justify-center shrink-0">
                          <Compass className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">National Portal Home</p>
                          <p className="text-[10px] text-slate-400 truncate">Public Directory & Verification</p>
                        </div>
                      </button>
                    </div>

                    <p className="text-center text-[10px] text-slate-400">
                      Tap any card to switch workspace instantly
                    </p>
                  </div>
                )}
              </div>

              {/* Android Navigation Bar (Bottom System Bar) */}
              <div className="h-9 bg-slate-900 text-white shrink-0 flex items-center justify-center z-30 select-none border-t border-white/5">
                {navStyle === 'gesture' ? (
                  /* Modern Android Gesture Bar Pill */
                  <button
                    type="button"
                    onClick={handleAndroidHome}
                    className="w-32 h-1 bg-slate-400/70 hover:bg-white rounded-full transition-colors cursor-pointer"
                    title="Android Gesture Pill (Tap for Home)"
                  />
                ) : (
                  /* Classic Android 3-Button Navigation (Back, Home, Recents) */
                  <div className="w-full flex items-center justify-around px-8">
                    {/* Back Button (Triangle / Arrow) */}
                    <button
                      type="button"
                      onClick={handleAndroidBack}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Back"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    {/* Home Button (Circle) */}
                    <button
                      type="button"
                      onClick={handleAndroidHome}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Home"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    {/* Recents Button (Square) */}
                    <button
                      type="button"
                      onClick={() => setIsRecentsOpen(!isRecentsOpen)}
                      className={`p-1.5 transition-colors cursor-pointer ${
                        isRecentsOpen ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Recents / Task Switcher"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Modal for Physical Android Device Testing */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Test on Physical Android Phone</h3>
                  <p className="text-[11px] text-slate-400">Scan via phone camera or Google Lens</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner">
              <img
                src={qrCodeUrl}
                alt="Scan to open on Android device"
                className="w-56 h-56 rounded-lg object-contain"
              />
              <p className="text-slate-700 text-[11px] font-semibold mt-2 font-mono">
                DARPAN Mobile Gateway
              </p>
            </div>

            {/* Local Wi-Fi Network URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400">Local Wi-Fi Gateway URL:</label>
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400">
                <span className="flex-1 truncate">{localNetworkUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[10px] flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs space-y-1.5 text-slate-400">
              <p className="font-semibold text-slate-300">Quick Testing Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Ensure your Android phone is connected to the same Wi-Fi network.</li>
                <li>Open your Android Camera app or Google Lens and point at the QR code.</li>
                <li>Tap the prompt to open the website directly in Chrome for Android.</li>
                <li>You can also tap Chrome menu (⋮) → <strong>"Add to Home Screen"</strong> to install as a native Android Web App!</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Done / Return to Simulator
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
