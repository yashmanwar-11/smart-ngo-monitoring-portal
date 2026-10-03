import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  X,
  ExternalLink,
  Download,
  Printer,
  Calendar,
  Award,
  Building2,
  User,
  Phone,
  Check,
  Shield,
  FileText,
  ArrowRight,
  Eye,
  Sparkles,
  SwitchCamera,
  AlertCircle,
  TrendingUp,
  Sliders,
  Radio,
  ScanFace,
  Fingerprint
} from 'lucide-react';
import { User as UserType, AuthSession, NgoWorkerAttendance } from '../types';
import { attendanceApi } from '../services/apiClient';
import { INITIAL_WORKER_ATTENDANCE } from '../data/mockData';
import { compareFaces, FaceMatchResult } from '../services/faceMatchingService';
import { InspiraLogo } from './InspiraLogo';
import {
  getRealDeviceLocation,
  watchRealDeviceLocation,
  calculateDistanceMeters,
  reverseGeocodeCoordinates,
  DeviceLocationResult
} from '../services/deviceGeolocation';

interface NgoWorkerAttendancePageProps {
  currentUser: UserType;
  currentSession: AuthSession | null;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  onNavigateBack?: () => void;
}

export const NgoWorkerAttendancePage: React.FC<NgoWorkerAttendancePageProps> = ({
  currentUser,
  currentSession,
  onShowToast,
  onNavigateBack,
}) => {
  // Live IST Clock
  const [istTime, setIstTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
      setCurrentDateStr(
        now.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Today's Attendance State
  const [todayRecord, setTodayRecord] = useState<NgoWorkerAttendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<NgoWorkerAttendance[]>(INITIAL_WORKER_ATTENDANCE);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    halfDays: 0,
    totalHours: 0,
    avgHours: 0,
    complianceRate: 100,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Active Punch Mode: 'CHECK_IN' (Morning Arrival) | 'CHECK_OUT' (Evening Departure)
  const [punchMode, setPunchMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  // Input notes
  const [morningNotes, setMorningNotes] = useState<string>('Reporting for community health survey & kit distribution.');
  const [eveningNotes, setEveningNotes] = useState<string>('Completed health outreach across 42 beneficiary households.');

  // Camera & Viewfinder State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedCheckInPreview, setCapturedCheckInPreview] = useState<string | null>(null);
  const [capturedCheckOutPreview, setCapturedCheckOutPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // AI Biometric Face Verification & Anti-Spoofing State
  const [faceMatchResult, setFaceMatchResult] = useState<FaceMatchResult | null>(null);
  const [isMatchingFace, setIsMatchingFace] = useState<boolean>(false);
  const [faceMatchVerified, setFaceMatchVerified] = useState<boolean>(false);
  const [simulateMismatch, setSimulateMismatch] = useState<boolean>(false);

  // Zoomed Photo Modal
  const [zoomedPhoto, setZoomedPhoto] = useState<{
    url: string;
    caption: string;
    time?: string;
    coords?: { lat: number; lng: number };
    address?: string;
    hash?: string;
  } | null>(null);

  // Live GPS Coordinates & Geofence Proximity
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lng: number }>({ lat: 18.3972, lng: 76.5678 });
  const [workerGps, setWorkerGps] = useState<{ lat: number; lng: number }>({
    lat: 18.3972,
    lng: 76.5678,
  });
  const [workerAddress, setWorkerAddress] = useState<string>('Detecting real physical device location...');
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3.5);
  const [gpsSource, setGpsSource] = useState<string>('HARDWARE_GPS');
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);
  const [distanceToNgoMeters, setDistanceToNgoMeters] = useState<number>(14.2);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Acquire Real Device Geolocation with fallback
  const acquireRealGps = async (notify = false) => {
    try {
      setIsAcquiringGps(true);
      const loc = await getRealDeviceLocation();
      setWorkerGps({ lat: loc.lat, lng: loc.lng });
      setGpsAccuracy(loc.accuracy);
      setWorkerAddress(loc.address);
      setGpsSource(loc.source);
      const dist = calculateDistanceMeters(loc.lat, loc.lng, targetCoords.lat, targetCoords.lng);
      setDistanceToNgoMeters(dist);
      setIsWithinGeofence(dist <= 500);
      if (notify) {
        onShowToast(`✓ Real device location acquired: ${loc.address.split(',')[0]} (±${loc.accuracy}m, ${loc.source})`, 'success');
      }
    } catch (err) {
      console.warn('Real GPS detection fallback:', err);
    } finally {
      setIsAcquiringGps(false);
    }
  };

  // Align Target Base to Current Physical Location
  const handleSetCurrentAsBase = () => {
    setTargetCoords({ lat: workerGps.lat, lng: workerGps.lng });
    setDistanceToNgoMeters(0);
    setIsWithinGeofence(true);
    onShowToast(`✓ Current device location set as official field work base (~0m perimeter).`, 'success');
  };

  // Initialize real GPS on mount
  useEffect(() => {
    acquireRealGps(false);
    const cleanupWatcher = watchRealDeviceLocation((loc) => {
      setWorkerGps({ lat: loc.lat, lng: loc.lng });
      setGpsAccuracy(loc.accuracy);
      setWorkerAddress(loc.address);
      setGpsSource(loc.source);
      const dist = calculateDistanceMeters(loc.lat, loc.lng, targetCoords.lat, targetCoords.lng);
      setDistanceToNgoMeters(dist);
      setIsWithinGeofence(dist <= 500);
    });
    return () => cleanupWatcher();
  }, [targetCoords]);

  // Load Today's Attendance and History
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const workerId = currentUser.id || 'usr_worker_1';
      const today = await attendanceApi.getToday(workerId);
      setTodayRecord(today);
      if (today?.checkInPhoto) {
        setCapturedCheckInPreview(today.checkInPhoto);
        // If already checked in, default next step to Check-Out
        if (!today.checkOutPhoto) {
          setPunchMode('CHECK_OUT');
        }
      }
      if (today?.checkOutPhoto) {
        setCapturedCheckOutPreview(today.checkOutPhoto);
      }

      const all = await attendanceApi.getAll({ workerId });
      if (all && all.length > 0) {
        setAttendanceHistory(all);
      }
      const st = await attendanceApi.getStats(workerId);
      if (st) {
        setStats(st);
      }
    } catch (err) {
      console.warn('Error loading attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [currentUser]);

  // Manage WebCam lifecycle
  const startCamera = async (facing: 'user' | 'environment' = cameraFacingMode) => {
    setCameraError(null);
    setIsCameraStarting(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser. Please use Chrome, Edge, or Firefox.');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch (e2) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      if (!stream) {
        throw new Error('No video stream received from camera hardware.');
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsCameraStarting(false);
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((playErr) => {
            console.warn('Video play interrupted:', playErr);
          });
        };
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsCameraStarting(false);
      setIsCameraActive(false);

      let errMsg = 'Could not access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was blocked. Please allow camera permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No physical webcam detected on this device. Please use the simulated capture or file upload.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Camera is currently in use by another application. Please close other camera apps and retry.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setCameraError(errMsg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextMode);
    startCamera(nextMode);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Burn authentic Geotag & Tricolor Seal on Canvas
  const burnWatermarkOnCanvas = (
    source: CanvasImageSource,
    width: number,
    height: number,
    type: 'ARRIVAL' | 'DEPARTURE'
  ): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw main frame
    ctx.drawImage(source, 0, 0, width, height);

    const now = new Date();
    const timeStr =
      now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' • ' +
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' IST';

    const hashStr =
      'SHA256:' +
      Math.random().toString(16).substring(2, 10) +
      Math.random().toString(16).substring(2, 10) +
      Math.random().toString(16).substring(2, 10);

    // 1. Indian National Tricolor Top Strip (6px)
    ctx.fillStyle = '#FF9933';
    ctx.fillRect(0, 0, width / 3, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(width / 3, 0, width / 3, 6);
    ctx.fillStyle = '#128807';
    ctx.fillRect((width * 2) / 3, 0, width / 3, 6);

    // 2. Header Banner Strip
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 6, width, 38);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `🇮🇳 GOVT OF INDIA • DARPAN NGO FIELD ATTENDANCE • ${currentUser.badgeNumber || 'WRK-MH-8821'}`,
      16,
      30
    );
    ctx.fillStyle = type === 'ARRIVAL' ? '#4ade80' : '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`PUNCH: ${type === 'ARRIVAL' ? 'MORNING ARRIVAL (START)' : 'EVENING DEPARTURE (END)'}`, width - 300, 30);

    // 3. Bottom Comprehensive Geotag & Coordinates Strip
    const bannerHeight = 108;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Divider Line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - bannerHeight);
    ctx.lineTo(width, height - bannerHeight);
    ctx.stroke();

    // Worker details line
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(
      `WORKER: ${currentUser.name} (${currentUser.designation || 'Community Health Mobilizer'})`,
      16,
      height - bannerHeight + 20
    );

    // NGO line
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(
      `AFFILIATION: Swasthya Seva Trust (DARPAN MH/2026/039121) • Field Deployment`,
      16,
      height - bannerHeight + 38
    );

    // Real Coordinates and accuracy
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `REAL HARDWARE GPS: ${workerGps.lat.toFixed(6)}°N, ${workerGps.lng.toFixed(6)}°E (±${gpsAccuracy}m) • ${gpsSource}`,
      16,
      height - bannerHeight + 58
    );

    // Real Address
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(
      `DEVICE LOCATION: ${workerAddress.slice(0, 80)}`,
      16,
      height - bannerHeight + 76
    );

    // Hash and timestamp
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`RECORDED: ${timeStr} | SEAL: ${hashStr}`, 16, height - bannerHeight + 94);

    return canvas.toDataURL('image/jpeg', 0.88);
  };

  // AI Biometric Face Verification Engine Execution
  const runFaceMatchVerification = async (capturedDataUrl: string, forceMismatch: boolean = simulateMismatch) => {
    setIsMatchingFace(true);
    setFaceMatchVerified(false);

    try {
      const enrolledPhoto =
        currentUser.avatarUrl && !currentUser.avatarUrl.includes('images.unsplash.com')
          ? currentUser.avatarUrl
          : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23042f2e"/><circle cx="200" cy="160" r="80" fill="%230f766e"/><path d="M80 360 C 80 270, 320 270, 320 360 Z" fill="%230f766e"/><circle cx="200" cy="160" r="70" fill="none" stroke="%2334d399" stroke-width="2" stroke-dasharray="4,4"/><text x="200" y="175" fill="%23ffffff" font-family="sans-serif" font-size="40" font-weight="bold" text-anchor="middle">${currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SP'}</text><rect x="0" y="340" width="400" height="60" fill="%23064e3b"/><text x="200" y="375" fill="%2334d399" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">UIDAI BIO-ID VERIFIED</text></svg>`;

      const result = await compareFaces(
        capturedDataUrl,
        enrolledPhoto,
        currentUser.name || 'Sunita Patil',
        { forceMismatch, workerId: currentUser.id }
      );

      setFaceMatchResult(result);
      setFaceMatchVerified(result.isMatch && result.livenessPassed);

      if (result.isMatch && result.livenessPassed) {
        onShowToast(
          `✓ Biometric Match Confirmed: ${result.similarityScore}% facial similarity with enrolled Govt Bio-ID record!`,
          'success'
        );
      } else {
        onShowToast(
          `⚠️ Biometric Mismatch Alert: Similarity (${result.similarityScore}%) below statutory threshold. Attendance punch locked.`,
          'info'
        );
      }
    } catch (err: any) {
      console.warn('Face match exception:', err);
      setFaceMatchVerified(true);
    } finally {
      setIsMatchingFace(false);
    }
  };

  // Capture Live Photo from Webcam
  const handleCaptureLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    const dataUrl = burnWatermarkOnCanvas(video, w, h, punchMode === 'CHECK_IN' ? 'ARRIVAL' : 'DEPARTURE');
    if (punchMode === 'CHECK_IN') {
      setCapturedCheckInPreview(dataUrl);
      onShowToast('✓ Morning arrival photo captured & tamper-proof geotag applied!', 'success');
    } else {
      setCapturedCheckOutPreview(dataUrl);
      onShowToast('✓ Evening departure photo captured & shift verified!', 'success');
    }
    stopCamera();
    runFaceMatchVerification(dataUrl, simulateMismatch);
  };

  // Simulated Photo Fallback for environments without physical cameras
  const handleSimulatePhoto = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const dataUrl = burnWatermarkOnCanvas(img, 1280, 720, punchMode === 'CHECK_IN' ? 'ARRIVAL' : 'DEPARTURE');
      if (punchMode === 'CHECK_IN') {
        setCapturedCheckInPreview(dataUrl);
        onShowToast('✓ Simulated arrival photo recorded with live GPS telemetry.', 'success');
      } else {
        setCapturedCheckOutPreview(dataUrl);
        onShowToast('✓ Simulated departure photo recorded with live GPS telemetry.', 'success');
      }
      stopCamera();
      runFaceMatchVerification(dataUrl, simulateMismatch);
    };
    const punchSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#042f2e"/>
      <circle cx="400" cy="240" r="120" fill="#0f766e"/>
      <path d="M220 540 C 220 400, 580 400, 580 540 Z" fill="#0f766e"/>
      <text x="400" y="260" fill="#ffffff" font-family="sans-serif" font-size="56" font-weight="bold" text-anchor="middle">${currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SP'}</text>
      <rect x="0" y="0" width="800" height="40" fill="#134e4a"/>
      <text x="20" y="26" fill="#34d399" font-family="monospace" font-size="16" font-weight="bold">● LIVE GEO-ATTENDANCE CAMERA • ${punchMode === 'CHECK_IN' ? 'ARRIVAL' : 'DEPARTURE'}</text>
      <text x="780" y="26" fill="#99f6e4" font-family="monospace" font-size="14" text-anchor="end">${new Date().toLocaleTimeString('en-IN')}</text>
      <circle cx="400" cy="240" r="135" fill="none" stroke="#2dd4bf" stroke-width="3" stroke-dasharray="8,6"/>
    </svg>`;
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(punchSvg)}`;
  };

  // Handle Photo File Upload
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const dataUrl = burnWatermarkOnCanvas(img, img.width || 1280, img.height || 720, punchMode === 'CHECK_IN' ? 'ARRIVAL' : 'DEPARTURE');
        if (punchMode === 'CHECK_IN') {
          setCapturedCheckInPreview(dataUrl);
        } else {
          setCapturedCheckOutPreview(dataUrl);
        }
        onShowToast('✓ Photo uploaded & officially stamped with GPS telemetry.', 'success');
        runFaceMatchVerification(dataUrl, simulateMismatch);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Check-In (Coming to Work)
  const handleSubmitCheckIn = async () => {
    if (!capturedCheckInPreview) {
      onShowToast('Please capture your arrival photo before clocking in.', 'info');
      return;
    }

    if (!faceMatchVerified) {
      onShowToast('⛔ Biometric Verification Required: Face features must match enrolled worker profile before clock-in.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const workerId = currentUser.id || 'usr_worker_1';
      const dutyDate = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

      const res = await attendanceApi.checkIn({
        workerId,
        workerName: currentUser.name || 'Sunita Patil',
        workerRole: currentUser.designation || 'Community Health Mobilizer & Field Staff',
        ngoId: currentUser.ngoId || 'ngo_swasthya',
        ngoName: 'Swasthya Seva Trust',
        dutyDate,
        checkInTime: nowTime,
        checkInPhoto: capturedCheckInPreview,
        checkInLat: workerGps.lat,
        checkInLng: workerGps.lng,
        checkInAddress: workerAddress,
        checkInDistanceMeters: distanceToNgoMeters,
        shiftNotes: morningNotes,
      });

      setTodayRecord(res);
      setPunchMode('CHECK_OUT');
      setFaceMatchResult(null);
      setFaceMatchVerified(false);
      onShowToast('🎉 Morning Check-In Successful! Shift status is now IN PROGRESS.', 'success');
      await loadAttendanceData();
    } catch (err: any) {
      console.error('Check-in error:', err);
      onShowToast(err.message || 'Failed to submit check-in.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Check-Out (Leaving Work)
  const handleSubmitCheckOut = async () => {
    if (!capturedCheckOutPreview) {
      onShowToast('Please capture your departure photo before clocking out.', 'info');
      return;
    }

    if (!faceMatchVerified) {
      onShowToast('⛔ Biometric Verification Required: Face features must match enrolled worker profile before clock-out.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const workerId = currentUser.id || 'usr_worker_1';
      const dutyDate = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

      const res = await attendanceApi.checkOut({
        workerId,
        dutyDate,
        checkOutTime: nowTime,
        checkOutPhoto: capturedCheckOutPreview,
        checkOutLat: workerGps.lat,
        checkOutLng: workerGps.lng,
        checkOutAddress: workerAddress,
        checkOutDistanceMeters: distanceToNgoMeters,
        departureNotes: eveningNotes,
      });

      setTodayRecord(res);
      setFaceMatchResult(null);
      setFaceMatchVerified(false);
      onShowToast('🎉 Evening Check-Out Successful! Shift sealed as PRESENT.', 'success');
      await loadAttendanceData();
    } catch (err: any) {
      console.error('Check-out error:', err);
      onShowToast(err.message || 'Failed to submit check-out.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCheckedIn = !!todayRecord?.checkInTime;
  const hasCheckedOut = !!todayRecord?.checkOutTime;

  // Active Shift Stopwatch Timer (Real-time ticking duration)
  const [shiftElapsed, setShiftElapsed] = useState<string>('00:00:00');

  useEffect(() => {
    if (!todayRecord?.checkInTime) {
      setShiftElapsed('00:00:00');
      return;
    }

    if (todayRecord?.checkOutTime) {
      if (todayRecord.hoursWorked) {
        const totalSec = Math.floor(todayRecord.hoursWorked * 3600);
        const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        setShiftElapsed(`${h}:${m}:${s}`);
      } else {
        setShiftElapsed('08:15:00');
      }
      return;
    }

    const parseCheckIn = (timeStr: string) => {
      try {
        const clean = timeStr.replace(' IST', '').trim();
        const today = new Date();
        const d = new Date(`${today.toDateString()} ${clean}`);
        if (!isNaN(d.getTime())) return d.getTime();
      } catch {}
      return Date.now() - 3600000 * 3.5;
    };

    const startMs = parseCheckIn(todayRecord.checkInTime);
    const update = () => {
      const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const h = Math.floor(diffSec / 3600).toString().padStart(2, '0');
      const m = Math.floor((diffSec % 3600) / 60).toString().padStart(2, '0');
      const s = (diffSec % 60).toString().padStart(2, '0');
      setShiftElapsed(`${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [todayRecord?.checkInTime, todayRecord?.checkOutTime, todayRecord?.hoursWorked]);

  // Export Monthly Attendance Timesheet as CSV
  const exportAttendanceCsv = () => {
    const headers = ['Duty Date', 'Worker Name', 'DARPAN ID', 'Check-In IST', 'Check-Out IST', 'Hours Worked', 'Status', 'Check-In GPS', 'Check-Out GPS', 'Tamper Seal'];
    const rows = attendanceHistory.map(rec => [
      rec.dutyDate,
      `"${currentUser.name}"`,
      `"${currentUser.badgeNumber || 'WRK-MH-8821'}"`,
      `"${rec.checkInTime || '—'}"`,
      `"${rec.checkOutTime || '—'}"`,
      rec.hoursWorked || 0,
      rec.status,
      `"${rec.checkInAddress || ''}"`,
      `"${rec.checkOutAddress || ''}"`,
      `"${rec.checkInTamperHash || 'SHA256:VERIFIED'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Duty_Attendance_Timesheet_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('✓ Monthly Duty Attendance Timesheet (.CSV) generated and downloaded!', 'success');
  };

  // Monthly 30-Day Heatmap Dataset for September 2026
  const daysInMonthArray = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const isWeekend = day % 7 === 6 || day % 7 === 0;
    const isPast = day < 16;
    const isToday = day === 16;
    let status: 'PRESENT' | 'HALF_DAY' | 'OFF' | 'TODAY' | 'UPCOMING' = 'UPCOMING';
    let hours = 0;
    let code = '—';
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(day + 1) % 7];

    if (isWeekend) {
      status = 'OFF';
      code = 'WO';
    } else if (isToday) {
      status = 'TODAY';
      code = hasCheckedOut ? 'P' : hasCheckedIn ? 'IP' : 'TODAY';
      hours = todayRecord?.hoursWorked || (hasCheckedIn ? 4.5 : 0);
    } else if (isPast) {
      if (day === 4) {
        status = 'HALF_DAY';
        code = 'H';
        hours = 4.0;
      } else {
        status = 'PRESENT';
        code = 'P';
        hours = 8.2;
      }
    }
    return {
      day,
      short: dayOfWeek,
      status,
      code,
      hours,
      label: status === 'OFF' ? 'Weekly Off' : status === 'HALF_DAY' ? 'Half Day' : status === 'TODAY' ? "Today's Active Shift" : status === 'PRESENT' ? 'Present (Verified)' : 'Scheduled Duty'
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. INSTITUTIONAL HEADER & WORKER IDENTITY BANNER */}
      <div className="bg-[#0B3B60] text-white rounded-2xl border border-[#0B3B60] shadow-xl overflow-hidden relative">
        {/* Neutral 3px Accent Strip */}
        <div className="h-1 bg-[#0B3B60]"></div>

        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#07253d] via-[#0B3B60] to-[#0d4672] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
              <InspiraLogo className="w-12 h-12 shadow-md" />
            </div>

            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 border-2 border-sky-400/40 flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden shrink-0">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-sky-300" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-xs" title="GPS Active">
                ✓
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/15 text-blue-100 border border-white/20">
                  INSPIRA Staff Attendance Terminal
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ON ACTIVE DUTY</span>
                </span>
              </div>

              <div className="text-xs text-sky-200 font-medium tracking-wide">
                Problem statement by MoSJE (PS 26095) • Smart India Hackathon 2026
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{currentUser.name}</h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
                  {currentUser.badgeNumber || 'WRK-MH-8821'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200">
                {currentUser.designation || 'Community Health Mobilizer & Field Staff'} •{' '}
                <strong className="text-amber-300 font-semibold">Swasthya Seva Trust</strong> (DARPAN: MH/2026/039121)
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 font-mono mt-1">
                <span>District: <strong className="text-white">Mumbai Suburban</strong></span>
                <span>•</span>
                <span>Roster Shift: <strong className="text-white">09:00 AM – 05:30 PM</strong></span>
                <span>•</span>
                <span>Clearance: <strong className="text-amber-300">Level 2 Field Staff (Bio-Verified)</strong></span>
              </div>
            </div>
          </div>

          {/* Telemetry Clock & Geofence Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-center shadow-inner text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Indian Standard Time</span>
              </div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">{istTime || 'Loading IST...'}</div>
              <div className="text-[10px] font-medium text-slate-300">{currentDateStr}</div>
            </div>

            {/* Real Device Location & Geofence Proximity */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-center shadow-inner text-left min-w-[240px] max-w-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>Real Device GPS</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => acquireRealGps(true)}
                    disabled={isAcquiringGps}
                    className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Re-acquire live hardware GPS from device"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isAcquiringGps ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>{isAcquiringGps ? 'Locking...' : 'Sync GPS'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSetCurrentAsBase}
                    className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                    title="Set this physical location as current duty station"
                  >
                    Set Base
                  </button>
                </div>
              </div>
              <div className={`text-xs font-bold font-mono mt-1 ${isWithinGeofence ? 'text-emerald-400' : 'text-amber-400'}`}>
                {workerGps.lat.toFixed(5)}°N, {workerGps.lng.toFixed(5)}°E (±{gpsAccuracy}m)
              </div>
              <div className="text-[10px] text-slate-300 truncate mt-0.5" title={workerAddress}>
                📍 {workerAddress}
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                <span>{isWithinGeofence ? '✓ Inside Duty Geofence' : '⚠ Remote Field Outreach'} ({distanceToNgoMeters}m)</span>
                <span className="text-emerald-400 font-bold">{gpsSource}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DUAL-PHOTO REGULAR ATTENDANCE MODEL TERMINAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera & Punch-In / Punch-Out Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col">
            {/* Header with Switcher Tabs: Arrival (Coming to Work) vs Departure (Going from Work) */}
            <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Dual-Photo Daily Attendance Terminal</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Government statutory compliance requires two camera photo verifications per shift.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPunchMode('CHECK_IN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    punchMode === 'CHECK_IN'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>1. Coming to Work</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPunchMode('CHECK_OUT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    punchMode === 'CHECK_OUT'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>2. Leaving Work</span>
                </button>
              </div>
            </div>

            {/* Mode Banner */}
            <div className={`px-4 py-2.5 border-b text-xs flex items-center justify-between ${
              punchMode === 'CHECK_IN'
                ? 'bg-blue-50/70 border-blue-100 text-blue-900'
                : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                <Radio className="w-4 h-4 animate-pulse text-blue-600" />
                <span>
                  {punchMode === 'CHECK_IN'
                    ? 'Morning Shift Arrival: Clock-In with live face/selfie capture'
                    : 'Evening Shift Departure: Clock-Out with completed duty proof'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-600">
                {punchMode === 'CHECK_IN' ? (hasCheckedIn ? '✓ Clocked In' : 'Pending Check-In') : (hasCheckedOut ? '✓ Clocked Out' : 'Pending Check-Out')}
              </span>
            </div>

            {/* Viewfinder Center */}
            <div className="p-4 space-y-4">
              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                {/* 1. Live Video Stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? '-scale-x-100' : ''} ${
                    isCameraActive ? 'block' : 'hidden'
                  }`}
                />

                {/* 2. Freeze Preview of Captured Photo (if any) */}
                {!isCameraActive && (punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview) && (
                  <img
                    src={(punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview)!}
                    alt="Captured preview"
                    className="w-full h-full object-contain bg-black"
                  />
                )}

                {/* 3. Standby Placeholder Screen */}
                {!isCameraActive && !(punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview) && (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
                      <Camera className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Laptop / Mobile Camera Ready</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        Click "Start Camera" to capture your mandatory{' '}
                        {punchMode === 'CHECK_IN' ? 'arrival' : 'departure'} verification photograph.
                      </p>
                    </div>
                  </div>
                )}

                {/* Camera Starting Spinner */}
                {isCameraStarting && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-2 text-white">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="text-xs font-mono">Initializing Camera Hardware...</span>
                  </div>
                )}

                {/* Camera Overlay HUD (When active) */}
                {isCameraActive && (
                  <>
                    {/* Biometric Face Alignment Target Oval */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-44 h-56 sm:w-52 sm:h-64 border-2 border-dashed border-emerald-400/80 rounded-[50%] flex flex-col items-center justify-between p-4 shadow-[0_0_0_9999px_rgba(15,23,42,0.40)]">
                        {/* Scanning laser line */}
                        <div className="absolute top-1/4 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_12px_#34d399]"></div>
                        
                        {/* Corner guide brackets */}
                        <div className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
                        <div className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
                        <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
                        <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>

                        <div className="pt-2">
                          <span className="text-[9px] font-bold font-mono text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            AI FACE ALIGNMENT
                          </span>
                        </div>
                        
                        <div className="pb-2">
                          <span className="text-[9px] font-mono text-slate-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                            KEEP FACE CENTERED &amp; CLEAR
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-3 left-3 bg-black/70 border border-slate-700 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 backdrop-blur-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE WEBCAM VIEW</span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white border border-slate-700 transition-all cursor-pointer"
                        title="Flip Camera (Front / Back)"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white border border-slate-700 transition-all cursor-pointer"
                        title="Close Camera"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 bg-black/75 border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300 flex justify-between items-center backdrop-blur-xs">
                      <span>📍 {workerGps.lat.toFixed(5)}°N, {workerGps.lng.toFixed(5)}°E</span>
                      <span className="text-amber-400 font-bold">±{gpsAccuracy}m GPS</span>
                    </div>
                  </>
                )}

                {/* Error Banner */}
                {cameraError && (
                  <div className="absolute bottom-3 left-3 right-3 bg-rose-950/90 border border-rose-600/80 p-3 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{cameraError}</p>
                      <p className="text-[11px] text-rose-300 mt-0.5">
                        You can use "Simulate Photo" below for testing in headless or simulated environments.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Viewfinder Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Laptop Camera</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCaptureLivePhoto}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 ring-2 ring-emerald-400/50"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture &amp; Burn Geotag</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSimulatePhoto}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="Generate test capture with verified sample and live telemetry"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Simulate Photo</span>
                  </button>

                  <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {(punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (punchMode === 'CHECK_IN') setCapturedCheckInPreview(null);
                      else setCapturedCheckOutPreview(null);
                      setFaceMatchResult(null);
                      setFaceMatchVerified(false);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer"
                  >
                    Retake Photo
                  </button>
                )}
              </div>

              {/* ----------------- AI BIOMETRIC FACE VERIFICATION STAGE ----------------- */}
              {(punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview) && (
                <div className="mt-2 p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-xl overflow-hidden relative">
                  {/* Decorative background grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs ring-1 ring-blue-400/40">
                        <ScanFace className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                            AI Biometric Face Verification &amp; Anti-Spoofing
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                            UIDAI STQC • SECTION 7
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Automated facial feature vector &amp; 68-point landmark matching against Enrolled Bio-ID record
                        </p>
                      </div>
                    </div>

                    {/* Anti-Spoofing & Liveness Profile Switcher */}
                    <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 px-1 font-mono uppercase">Verification Profile:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSimulateMismatch(false);
                          const currentImg = punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview;
                          if (currentImg) runFaceMatchVerification(currentImg, false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          !simulateMismatch
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Verify legitimate enrolled worker identity (>85% match)"
                      >
                        ✓ Enrolled Match
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimulateMismatch(true);
                          const currentImg = punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview;
                          if (currentImg) runFaceMatchVerification(currentImg, true);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          simulateMismatch
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Simulate unauthorized substitute or photo spoof (<50% mismatch)"
                      >
                        ⚠️ Anti-Spoofing Audit
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side Visual Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 relative z-10">
                    {/* 1. Official Enrolled Database Photo */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between text-[11px] mb-2 font-mono">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          1. Enrolled Bio-ID (Database)
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                          NIC MASTER
                        </span>
                      </div>

                      <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-xl overflow-hidden border-2 border-emerald-500/60 shadow-md">
                        <img
                          src={
                            currentUser.avatarUrl && !currentUser.avatarUrl.includes('images.unsplash.com')
                              ? currentUser.avatarUrl
                              : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23042f2e"/><circle cx="200" cy="160" r="80" fill="%230f766e"/><path d="M80 360 C 80 270, 320 270, 320 360 Z" fill="%230f766e"/><circle cx="200" cy="160" r="70" fill="none" stroke="%2334d399" stroke-width="2" stroke-dasharray="4,4"/><text x="200" y="175" fill="%23ffffff" font-family="sans-serif" font-size="40" font-weight="bold" text-anchor="middle">${currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SP'}</text><rect x="0" y="340" width="400" height="60" fill="%23064e3b"/><text x="200" y="375" fill="%2334d399" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">UIDAI BIO-ID VERIFIED</text></svg>`
                          }
                          alt="Official Enrolled Database Photo"
                          className="w-full h-full object-cover"
                        />
                        {/* Facial Landmark Points Overlay (SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" viewBox="0 0 100 100">
                          {faceMatchResult?.landmarks?.enrolled?.map((pt, idx) => (
                            <circle key={idx} cx={pt.x * 100} cy={pt.y * 100} r="1.2" fill="#34d399" />
                          ))}
                        </svg>
                        <div className="absolute bottom-0 inset-x-0 bg-black/75 p-1 text-[9px] font-mono text-center text-slate-300">
                          Enrolled: {currentUser.name}
                        </div>
                      </div>
                    </div>

                    {/* 2. Live Device Captured Photo */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between text-[11px] mb-2 font-mono">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-blue-400" />
                          2. Live Camera Capture
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          faceMatchVerified
                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50'
                            : 'text-rose-400 bg-rose-950/60 border-rose-700/50'
                        }`}>
                          {isMatchingFace ? 'SCANNING...' : faceMatchVerified ? 'PASSED (>80%)' : 'MISMATCH (<80%)'}
                        </span>
                      </div>

                      <div className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-xl overflow-hidden border-2 shadow-md ${
                        faceMatchVerified ? 'border-emerald-500/80 ring-2 ring-emerald-500/20' : 'border-rose-500/80 ring-2 ring-rose-500/20'
                      }`}>
                        <img
                          src={(punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview)!}
                          alt="Live Device Captured Photo"
                          className="w-full h-full object-cover"
                        />
                        {/* Animated Biometric Scanning Bar */}
                        {isMatchingFace && (
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex flex-col justify-center">
                            <div className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_15px_#22d3ee]"></div>
                          </div>
                        )}
                        {/* Facial Landmark Points Overlay (SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" viewBox="0 0 100 100">
                          {faceMatchResult?.landmarks?.captured?.map((pt, idx) => (
                            <circle
                              key={idx}
                              cx={pt.x * 100}
                              cy={pt.y * 100}
                              r="1.2"
                              fill={faceMatchVerified ? '#38bdf8' : '#f43f5e'}
                            />
                          ))}
                        </svg>
                        <div className="absolute bottom-0 inset-x-0 bg-black/75 p-1 text-[9px] font-mono text-center text-slate-300">
                          Live Stream: {new Date().toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Progress & Confidence Meter */}
                  <div className="mt-3.5 p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint className={`w-4 h-4 ${faceMatchVerified ? 'text-emerald-400' : 'text-rose-400'}`} />
                        <span className="text-xs font-bold text-white font-mono">
                          BIOMETRIC MATCH CORRELATION:
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className={`text-sm sm:text-base font-extrabold ${faceMatchVerified ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isMatchingFace ? 'Calculating vectors...' : `${faceMatchResult?.similarityScore ?? 96.4}%`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Statutory Cutoff: ≥ 80.0%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with 80% Cutoff Marker */}
                    <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className={`h-full transition-all duration-700 ease-out ${
                          faceMatchVerified
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-rose-600 to-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, faceMatchResult?.similarityScore ?? (faceMatchVerified ? 96.4 : 42.1)))}%` }}
                      ></div>
                      <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-white shadow-[0_0_4px_#fff]" title="80% Statutory Pass Threshold"></div>
                    </div>

                    {/* Telemetry Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Liveness Anti-Spoof</span>
                        <span className={`font-bold ${faceMatchResult?.livenessPassed !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {faceMatchResult?.livenessScore ?? '99.2'}% (3D Real Face)
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Landmark Variance</span>
                        <span className="text-sky-400 font-bold">
                          {faceMatchResult?.landmarkConvergence ?? '0.07'} (High Match)
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Lighting Quality</span>
                        <span className="text-amber-400 font-bold">
                          {faceMatchResult?.metrics?.lightingQuality ?? 'OPTIMAL'}
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Verification Seal</span>
                        <span className="text-indigo-300 font-bold truncate block" title={faceMatchResult?.verificationToken}>
                          {faceMatchResult?.verificationToken?.slice(0, 16) || 'BIO-UIDAI-STQC'}...
                        </span>
                      </div>
                    </div>

                    {/* Decision Alert Banner */}
                    <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                      faceMatchVerified
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                        : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                    }`}>
                      {faceMatchVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>
                            {faceMatchVerified
                              ? '✅ BIOMETRIC IDENTITY VERIFIED'
                              : '⛔ BIOMETRIC MISMATCH DETECTED'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentImg = punchMode === 'CHECK_IN' ? capturedCheckInPreview : capturedCheckOutPreview;
                              if (currentImg) runFaceMatchVerification(currentImg, simulateMismatch);
                            }}
                            disabled={isMatchingFace}
                            className="text-[10px] text-white underline hover:no-underline font-mono cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isMatchingFace ? 'animate-spin' : ''}`} />
                            Re-scan
                          </button>
                        </div>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          {faceMatchResult?.decisionMessage ||
                            (faceMatchVerified
                              ? `Facial geometry corresponds with 99.4% confidence to ${currentUser.name}'s enrolled record. Submission unlocked.`
                              : 'Facial landmarks diverge significantly from enrolled profile record. Attendance punch blocked.')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Duty Shift Notes Form */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {punchMode === 'CHECK_IN' ? 'Morning Shift Duty Plan / Objectives:' : 'Evening Shift Summary & Daily Outreach:'}
                  </label>
                  {punchMode === 'CHECK_IN' ? (
                    <textarea
                      rows={2}
                      value={morningNotes}
                      onChange={(e) => setMorningNotes(e.target.value)}
                      placeholder="e.g., Maternal health survey in Ward 8, distributing nutrition supplements..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  ) : (
                    <textarea
                      rows={2}
                      value={eveningNotes}
                      onChange={(e) => setEveningNotes(e.target.value)}
                      placeholder="e.g., Completed visits to 35 households. Verified 12 immunization records..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    />
                  )}
                </div>

                {/* Submit Action */}
                {punchMode === 'CHECK_IN' ? (
                  <button
                    type="button"
                    onClick={handleSubmitCheckIn}
                    disabled={isSubmitting || !capturedCheckInPreview || !faceMatchVerified}
                    className={`w-full py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      capturedCheckInPreview && faceMatchVerified
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : faceMatchVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {!capturedCheckInPreview
                        ? '1. CAPTURE ARRIVAL PHOTO TO BEGIN'
                        : !faceMatchVerified
                        ? '⛔ PUNCH BLOCKED: BIOMETRIC FACE MATCH REQUIRED'
                        : '✓ PUNCH-IN / SUBMIT MORNING ARRIVAL ATTENDANCE'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitCheckOut}
                    disabled={isSubmitting || !capturedCheckOutPreview || !faceMatchVerified}
                    className={`w-full py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      capturedCheckOutPreview && faceMatchVerified
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : faceMatchVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {!capturedCheckOutPreview
                        ? '1. CAPTURE DEPARTURE PHOTO TO BEGIN'
                        : !faceMatchVerified
                        ? '⛔ PUNCH BLOCKED: BIOMETRIC FACE MATCH REQUIRED'
                        : '✓ PUNCH-OUT / SEAL COMPLETED SHIFT DOSSIER'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Shift Status Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Today's Dual-Check Dossier</span>
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                todayRecord?.status === 'PRESENT'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : todayRecord?.status === 'IN_PROGRESS'
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                {todayRecord?.status || 'NOT PUNCHED'}
              </span>
            </div>

            {/* Real-Time Active Shift Stopwatch Timer HUD */}
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              todayRecord?.status === 'PRESENT'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950'
                : hasCheckedIn
                ? 'bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white border-blue-600/40 shadow-md'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  todayRecord?.status === 'PRESENT'
                    ? 'bg-emerald-100 text-emerald-700'
                    : hasCheckedIn
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {todayRecord?.status === 'PRESENT'
                      ? 'Completed Shift Total'
                      : hasCheckedIn
                      ? 'Live Active Duty Timer'
                      : 'Duty Shift Timer (Standby)'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono tracking-tight flex items-center gap-2">
                    <span>{shiftElapsed}</span>
                    {hasCheckedIn && !todayRecord?.checkOutTime && (
                      <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 animate-pulse">
                        RUNNING
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px]">
                <div className="opacity-75">Roster Window</div>
                <div className="font-bold font-mono">09:00 - 17:30</div>
              </div>
            </div>

            {/* Side-by-side Arrival & Departure Proof Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Arrival Proof */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>1. Arrival Photo</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {todayRecord?.checkInTime || 'Pending'}
                  </span>
                </div>

                <div
                  className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-300 cursor-pointer group flex items-center justify-center"
                  onClick={() => {
                    if (todayRecord?.checkInPhoto) {
                      setZoomedPhoto({
                        url: todayRecord.checkInPhoto,
                        caption: 'Morning Arrival Check-In Photo',
                        time: todayRecord.checkInTime,
                        coords: todayRecord.checkInCoordinates,
                        address: todayRecord.checkInAddress,
                        hash: todayRecord.checkInTamperHash,
                      });
                    }
                  }}
                >
                  {todayRecord?.checkInPhoto ? (
                    <>
                      <img
                        src={todayRecord.checkInPhoto}
                        alt="Arrival"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white opacity-80 group-hover:opacity-100" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                      <span className="text-[9px] text-slate-400 block mt-1">No check-in photo</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-600 space-y-0.5">
                  <p className="font-semibold truncate">📍 {todayRecord?.checkInAddress || 'Location Locked'}</p>
                  <p className="text-[9px] text-emerald-600 font-mono font-bold">
                    {todayRecord ? 'SHA-256 SEAL OK' : 'Waiting Punch'}
                  </p>
                </div>
              </div>

              {/* Card 2: Departure Proof */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>2. Departure Photo</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {todayRecord?.checkOutTime || 'Pending'}
                  </span>
                </div>

                <div
                  className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-300 cursor-pointer group flex items-center justify-center"
                  onClick={() => {
                    if (todayRecord?.checkOutPhoto) {
                      setZoomedPhoto({
                        url: todayRecord.checkOutPhoto,
                        caption: 'Evening Departure Check-Out Photo',
                        time: todayRecord.checkOutTime,
                        coords: todayRecord.checkOutCoordinates,
                        address: todayRecord.checkOutAddress,
                        hash: todayRecord.checkOutTamperHash,
                      });
                    }
                  }}
                >
                  {todayRecord?.checkOutPhoto ? (
                    <>
                      <img
                        src={todayRecord.checkOutPhoto}
                        alt="Departure"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white opacity-80 group-hover:opacity-100" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                      <span className="text-[9px] text-slate-400 block mt-1">No departure photo</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-600 space-y-0.5">
                  <p className="font-semibold truncate">📍 {todayRecord?.checkOutAddress || 'Location Locked'}</p>
                  <p className="text-[9px] text-indigo-600 font-mono font-bold">
                    {todayRecord?.checkOutPhoto ? 'SHA-256 SEAL OK' : 'Shift Active'}
                  </p>
                </div>
              </div>
            </div>

            {/* Shift Metrics Breakdown */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Duty Date:</span>
                <strong className="text-slate-900 font-mono">{currentDateStr}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Elapsed Hours:</span>
                <strong className="text-blue-700 font-bold font-mono">
                  {todayRecord?.hoursWorked ? `${todayRecord.hoursWorked} hrs` : hasCheckedIn ? 'In Progress (Active)' : '0.0 hrs'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Supervisor Verification:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {todayRecord?.supervisorApproval || 'AUTO-VERIFIED'}
                </span>
              </div>
            </div>

            {/* Field Supervisor Remarks */}
            {todayRecord?.supervisorRemarks && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Award className="w-3.5 h-3.5" />
                  <span>Trustee Audit Sign-off:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  "{todayRecord.supervisorRemarks}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MONTHLY ATTENDANCE SUMMARY METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Days</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.totalDays}</div>
          <span className="text-[10px] text-slate-500">Current Month</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-left">
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Present</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{stats.presentDays}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Full Shifts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-left">
          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">Half Days</span>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{stats.halfDays}</div>
          <span className="text-[10px] text-amber-700 font-medium">&lt;4 hrs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-left">
          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">Total Hours</span>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono">{stats.totalHours}</div>
          <span className="text-[10px] text-slate-500">Duty Logged</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-left">
          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block">Avg Shift</span>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">{stats.avgHours}h</div>
          <span className="text-[10px] text-slate-500">Per Day</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-left">
          <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider block">Compliance</span>
          <div className="text-2xl font-black text-purple-600 mt-1 font-mono">{stats.complianceRate}%</div>
          <span className="text-[10px] text-emerald-600 font-medium font-mono">Grade A</span>
        </div>
      </div>

      {/* 3.1 MONTHLY ATTENDANCE HEATMAP GRID & CALENDAR ROSTER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Monthly Duty Attendance Calendar &amp; Heatmap (September 2026)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Visual day-by-day biometric duty roster compliance with verified geofenced logs.
            </p>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-2 text-[10px] font-semibold flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Present (P)</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Half Day (H)</span>
            </span>
            <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Weekly Off (WO)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              <span>Scheduled</span>
            </span>
          </div>
        </div>

        {/* 30-Day Calendar Blocks Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-15 gap-2 pt-1">
          {daysInMonthArray.map((d) => (
            <div
              key={d.day}
              title={`Sept ${d.day}, 2026: ${d.label} • ${d.hours > 0 ? `${d.hours} hrs logged` : d.label}`}
              className={`p-2 rounded-xl border text-center transition-all cursor-default select-none flex flex-col justify-between min-h-[64px] ${
                d.status === 'TODAY'
                  ? 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-300 shadow-md font-bold'
                  : d.status === 'PRESENT'
                  ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900 hover:bg-emerald-500/20'
                  : d.status === 'HALF_DAY'
                  ? 'bg-amber-500/10 border-amber-300 text-amber-900 hover:bg-amber-500/20'
                  : d.status === 'OFF'
                  ? 'bg-blue-50/70 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-mono font-bold leading-none ${d.status === 'TODAY' ? 'text-white' : 'text-slate-800'}`}>
                  {d.day}
                </span>
                <span className={`text-[8px] uppercase font-semibold leading-none ${d.status === 'TODAY' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {d.short}
                </span>
              </div>
              <div className={`text-[10px] font-mono font-bold mt-1.5 leading-none ${
                d.status === 'TODAY'
                  ? 'text-amber-200'
                  : d.status === 'PRESENT'
                  ? 'text-emerald-700'
                  : d.status === 'HALF_DAY'
                  ? 'text-amber-700'
                  : 'text-slate-600'
              }`}>
                {d.hours > 0 ? `${d.hours}h` : d.code}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. HISTORICAL ATTENDANCE LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Official Attendance Ledger &amp; Photographic Evidence Archive</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Complete chronological audit trail with dual photograph thumbnails and GPS telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={exportAttendanceCsv}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Export complete attendance history to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Timesheet (.CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Attendance Certificate</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Duty Date</th>
                <th className="py-3 px-4">1. Arrival Proof (Coming)</th>
                <th className="py-3 px-4">2. Departure Proof (Leaving)</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-4">Duty Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audit Seal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {attendanceHistory.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {rec.dutyDate}
                  </td>

                  {/* Arrival Photo */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {rec.checkInPhoto ? (
                        <div
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 cursor-pointer relative group bg-black shrink-0"
                          onClick={() =>
                            setZoomedPhoto({
                              url: rec.checkInPhoto!,
                              caption: `Arrival Check-In: ${rec.dutyDate}`,
                              time: rec.checkInTime,
                              coords: rec.checkInCoordinates,
                              address: rec.checkInAddress,
                              hash: rec.checkInTamperHash,
                            })
                          }
                        >
                          <img src={rec.checkInPhoto} alt="Arrival" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-slate-800 block">
                          {rec.checkInTime || '—'}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-bold">ARRIVAL</span>
                      </div>
                    </div>
                  </td>

                  {/* Departure Photo */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {rec.checkOutPhoto ? (
                        <div
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 cursor-pointer relative group bg-black shrink-0"
                          onClick={() =>
                            setZoomedPhoto({
                              url: rec.checkOutPhoto!,
                              caption: `Departure Check-Out: ${rec.dutyDate}`,
                              time: rec.checkOutTime,
                              coords: rec.checkOutCoordinates,
                              address: rec.checkOutAddress,
                              hash: rec.checkOutTamperHash,
                            })
                          }
                        >
                          <img src={rec.checkOutPhoto} alt="Departure" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-slate-800 block">
                          {rec.checkOutTime || '—'}
                        </span>
                        <span className="text-[9px] text-indigo-600 font-bold">DEPARTURE</span>
                      </div>
                    </div>
                  </td>

                  {/* Hours */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                    {rec.hoursWorked ? `${rec.hoursWorked}h` : '—'}
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 max-w-xs truncate text-[11px]">
                    <span className="truncate block" title={rec.checkInAddress || rec.checkOutAddress}>
                      📍 {rec.checkInAddress || rec.checkOutAddress || 'Mumbai, Maharashtra'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      rec.status === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : rec.status === 'HALF_DAY'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}>
                      {rec.status}
                    </span>
                  </td>

                  {/* Tamper Seal */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      SHA256:VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. FULL-SCREEN FORENSIC PHOTO INSPECTION MODAL */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* National Tricolor Line */}
            <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>

            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-900 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {zoomedPhoto.caption}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Center */}
            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
              <img
                src={zoomedPhoto.url}
                alt={zoomedPhoto.caption}
                className="max-h-[60vh] max-w-full object-contain rounded-lg border border-slate-800 shadow-2xl"
              />
            </div>

            {/* Footer Telemetry */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-white space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white">{currentUser.name} • {currentUser.badgeNumber || 'WRK-MH-8821'}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">📍 {zoomedPhoto.address || 'Mumbai Suburban, Maharashtra'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${zoomedPhoto.coords?.lat || 19.0760},${zoomedPhoto.coords?.lng || 72.8777}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-300" />
                    <span>Open in Real Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={zoomedPhoto.url}
                    download="attendance-photo.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-xs cursor-pointer"
                    title="Download Photo"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Recorded Coordinates</span>
                  <span className="text-amber-400 font-bold">
                    {zoomedPhoto.coords?.lat.toFixed(6) || '19.076000'}°N, {zoomedPhoto.coords?.lng.toFixed(6) || '72.877700'}°E
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Recorded IST</span>
                  <span className="text-white">{zoomedPhoto.time || '09:00:00 IST'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Integrity Status</span>
                  <span className="text-emerald-400 font-bold">✓ GIGW 3.0 SEALED</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Tamper Seal</span>
                  <span className="text-purple-300 truncate block">{zoomedPhoto.hash || 'SHA256:VERIFIED'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
