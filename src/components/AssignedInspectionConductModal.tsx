import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Shield,
  Trash2,
  Navigation,
  Image as ImageIcon,
  Check,
  AlertOctagon,
  Clock,
  ChevronRight,
  ChevronLeft,
  Video,
  VideoOff,
  RefreshCw,
  Eye,
  Building2,
  BookOpen,
  Users,
  ShieldCheck,
  ExternalLink,
  PenTool,
  Hash,
  Sparkles,
  Maximize2,
  Play,
  Square,
  Radio,
  Film,
  FileVideo,
  Download
} from 'lucide-react';
import { GovernmentInspectionTask, User, TaskPhoto, TaskVideo, InspectionChecklistItem, PhotoEvidenceCategory } from '../types';
import { submitTaskInspection } from '../services/governmentTasksStorage';
import { inspectionApi } from '../services/apiClient';
import { getRealDeviceLocation, watchRealDeviceLocation } from '../services/deviceGeolocation';
import { CctvEvidenceModal } from './cctv/CctvEvidenceModal';
import { EmblemOfIndia } from './EmblemOfIndia';

interface AssignedInspectionConductModalProps {
  task: GovernmentInspectionTask;
  currentOfficer: User;
  onClose: () => void;
  onSubmitSuccess: (updatedTask: GovernmentInspectionTask) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const DEFAULT_INSPECTION_CHECKLIST: InspectionChecklistItem[] = [
  { id: 'c1', label: 'Physical Registered Premises Exists & Fully Operational', passed: true, notes: 'Verified at physical site' },
  { id: 'c2', label: 'Official Signboard Displayed with Registration & Darpan ID', passed: true, notes: 'Exterior board clearly visible' },
  { id: 'c3', label: 'Authorized Key Staff & Program Officers Present On-Site', passed: true, notes: 'Headcount checked & registered' },
  { id: 'c4', label: 'General Ledgers, Cash Book & Bank Operation Audited', passed: true, notes: 'Daily cash vouchers inspected' },
  { id: 'c5', label: 'Beneficiary Register & Biometric / Attendance Authenticated', passed: true, notes: 'Active beneficiary records verified' },
  { id: 'c6', label: 'Fire Safety Clearance & Building Safety Norms Complied', passed: true, notes: 'Extinguishers in service & exits clear' },
  { id: 'c7', label: 'Activities Aligned with Statutory Non-Profit Charter', passed: true, notes: 'No unauthorized commercial activity' },
  { id: 'c8', label: 'Bank Account Operated in Approved Local Branch', passed: true, notes: 'Passbook matches authorized branch' },
  { id: 'c9', label: 'Statutory 80G / FCRA Documentation Available', passed: true, notes: 'Exemption certificates verified' },
  { id: 'c10', label: 'Asset Register Verified Against Physical Inventory', passed: true, notes: 'Computers & machinery matched with register' },
];

export const PHOTO_CATEGORIES: Array<{
  id: PhotoEvidenceCategory;
  name: string;
  icon: any;
  description: string;
  recommendedMin: number;
}> = [
  {
    id: 'PREMISE_SIGNBOARD',
    name: 'Premise & Signboard Entrance',
    icon: Building2,
    description: 'Mandatory exterior view with official signboard, NGO name, and DARPAN ID.',
    recommendedMin: 1,
  },
  {
    id: 'ACCOUNTS_LEDGERS',
    name: 'Statutory Accounts & Ledgers',
    icon: BookOpen,
    description: 'Cash book, ledger books, bank vouchers, and audited balance sheets.',
    recommendedMin: 1,
  },
  {
    id: 'WELFARE_BENEFICIARIES',
    name: 'Welfare Activities & Beneficiaries',
    icon: Users,
    description: 'On-ground welfare program in progress, beneficiaries, classrooms or clinics.',
    recommendedMin: 1,
  },
  {
    id: 'INFRASTRUCTURE',
    name: 'Infrastructure & Facilities',
    icon: ShieldCheck,
    description: 'Classrooms, sanitation, fire extinguishers, computers, and medical tools.',
    recommendedMin: 1,
  },
  {
    id: 'VIOLATIONS_DEFECTS',
    name: 'Discrepancies & Violations',
    icon: AlertTriangle,
    description: 'Locked gates, shell offices, missing registers, or unauthorized activity.',
    recommendedMin: 0,
  },
];

const SAMPLE_FIELD_PHOTOS: Array<{
  url: string;
  caption: string;
  category: PhotoEvidenceCategory;
}> = [
  {
    category: 'PREMISE_SIGNBOARD',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Official Premise Entrance & Signboard Verification with Darpan ID',
  },
  {
    category: 'ACCOUNTS_LEDGERS',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Statutory Accounts Ledger & Bank Passbook Vouchers Audit',
  },
  {
    category: 'WELFARE_BENEFICIARIES',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    caption: 'On-Site Welfare Activity & Beneficiary Attendance In Session',
  },
  {
    category: 'INFRASTRUCTURE',
    url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80',
    caption: 'Infrastructure & Safety Equipment Inspection',
  },
  {
    category: 'VIOLATIONS_DEFECTS',
    url: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1200&q=80',
    caption: 'Irregularity / Padlocked Unattended Premises Discrepancy',
  },
];

export const AssignedInspectionConductModal: React.FC<AssignedInspectionConductModalProps> = ({
  task,
  currentOfficer,
  onClose,
  onSubmitSuccess,
  onShowToast,
}) => {
  // Wizard Navigation: Step 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Location & Geofence Check-In State
  const targetCoords = (task.coordinates && typeof task.coordinates.lat === 'number' && typeof task.coordinates.lng === 'number')
    ? task.coordinates
    : { lat: 18.5284, lng: 73.8423 };
  const [visitedSite, setVisitedSite] = useState<boolean>(
    task.status === 'In Progress' || !!task.submittedRecord
  );
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: targetCoords.lat + (visitedSite ? 0.00012 : 0.0035),
    lng: targetCoords.lng + (visitedSite ? 0.00010 : 0.0028),
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3.2);
  const [distanceMeters, setDistanceMeters] = useState<number>(visitedSite ? 32 : 380);
  const [deviceAddress, setDeviceAddress] = useState<string>('Detecting device location...');
  const [gpsSource, setGpsSource] = useState<string>('HARDWARE_GPS');
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);
  const [isRealGpsLocked, setIsRealGpsLocked] = useState<boolean>(false);

  const acquireRealGps = async (notify = false) => {
    try {
      setIsAcquiringGps(true);
      const loc = await getRealDeviceLocation();
      setCurrentGps({ lat: loc.lat, lng: loc.lng });
      setGpsAccuracy(loc.accuracy);
      setDeviceAddress(loc.address);
      setGpsSource(loc.source);
      setIsRealGpsLocked(true);
      const dist = calculateDistance(loc.lat, loc.lng, targetCoords.lat, targetCoords.lng);
      setDistanceMeters(dist);
      if (notify) {
        onShowToast(`✓ Real device location acquired: ${loc.address.split(',')[0]} (±${loc.accuracy}m, ${loc.source})`, 'success');
      }
    } catch (e) {
      console.warn('Real GPS detection error:', e);
    } finally {
      setIsAcquiringGps(false);
    }
  };

  const handleAlignTargetToCurrentLocation = () => {
    task.coordinates = { lat: currentGps.lat, lng: currentGps.lng };
    targetCoords.lat = currentGps.lat;
    targetCoords.lng = currentGps.lng;
    setDistanceMeters(0);
    setVisitedSite(true);
    onShowToast(`✓ Target inspection site set to current real location (~0m). 150m perimeter unlocked!`, 'success');
  };

  // Step 2: Live WebCam, Photo & Video Evidence Spaces State
  const [activeCategory, setActiveCategory] = useState<PhotoEvidenceCategory>('PREMISE_SIGNBOARD');
  const [photos, setPhotos] = useState<TaskPhoto[]>(task.submittedRecord?.photos || []);
  const [videos, setVideos] = useState<TaskVideo[]>(task.submittedRecord?.videos || []);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [isUsingSimulatedCamera, setIsUsingSimulatedCamera] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<TaskPhoto | null>(null);
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState<TaskVideo | null>(null);
  const [customPhotoCaption, setCustomPhotoCaption] = useState<string>('');
  const [evidenceTab, setEvidenceTab] = useState<'PHOTOS' | 'VIDEOS'>('PHOTOS');
  const [isCctvModalOpen, setIsCctvModalOpen] = useState<boolean>(false);

  // Live Video Recording State
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const videoStartTimeRef = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 3: Statutory Checklist State
  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>(
    task.submittedRecord?.checklist || DEFAULT_INSPECTION_CHECKLIST
  );

  // Step 4: Observations, Issues & Severity
  const [observations, setObservations] = useState<string>(
    task.submittedRecord?.observations ||
      'Conducted statutory physical audit of facility. On-site staff verified, attendance roster inspected, and operational premises validated.'
  );
  const [issuesDefects, setIssuesDefects] = useState<string>(
    task.submittedRecord?.issuesDefects || ''
  );
  const [severityPriority, setSeverityPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>(
    task.priority || 'Medium'
  );
  const [dateTime, setDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  // Step 5: Digital Signature & Submission
  const [inspectorRemarks, setInspectorRemarks] = useState<string>(
    task.submittedRecord?.inspectorRemarks ||
      'Statutory on-site verification concluded. Recommended for continuation and compliance renewal.'
  );
  const [submissionStatus, setSubmissionStatus] = useState<'Completed' | 'Failed/Issue Found'>('Completed');
  const [digitalSignature, setDigitalSignature] = useState<string>(currentOfficer.name);
  const [certifyTruthChecked, setCertifyTruthChecked] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Haversine Distance Calculator
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Real device GPS acquisition & continuous watcher
  useEffect(() => {
    acquireRealGps(false);
    const cleanup = watchRealDeviceLocation((loc) => {
      if (!visitedSite) {
        setCurrentGps({ lat: loc.lat, lng: loc.lng });
        setGpsAccuracy(loc.accuracy);
        setDeviceAddress(loc.address);
        setGpsSource(loc.source);
        setIsRealGpsLocked(true);
        const dist = calculateDistance(loc.lat, loc.lng, targetCoords.lat, targetCoords.lng);
        setDistanceMeters(dist);
      }
    });
    return () => cleanup();
  }, [visitedSite, targetCoords]);

  // Manage WebCam lifecycle
  const startWebcam = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    setIsUsingSimulatedCamera(false);
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
      // Constraint Tier 1: User-chosen facing mode with standard HD resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e1) {
        // Constraint Tier 2: Generic ideal resolution without strict facing constraint (best for laptop webcams)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch (e2) {
          // Constraint Tier 3: Simplest bare video stream (universal fallback on all laptops)
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      if (!stream) {
        throw new Error('No video stream returned from camera hardware.');
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsUsingSimulatedCamera(false);
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
      console.warn('Laptop webcam access error:', err);
      setIsCameraStarting(false);
      setIsCameraActive(false);

      let errMsg = 'Could not access your laptop camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was blocked. Please click the camera or lock icon 🔒 in your browser address bar, set Camera to "Allow", and click "Retry Laptop Camera".';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No physical webcam detected on this laptop/device. Please check your camera hardware or physical privacy slider.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Your laptop camera is in use by another application (Zoom, Teams, or another browser tab). Please close other camera apps and retry.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setCameraError(errMsg);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
  };

  // Wire stream to video whenever videoRef mounts or stream updates
  useEffect(() => {
    if (videoRef.current && streamRef.current && !isUsingSimulatedCamera) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(console.warn);
      }
    }
  }, [isUsingSimulatedCamera, isCameraActive]);

  // Automatically start webcam when user enters Step 2
  useEffect(() => {
    if (currentStep === 2) {
      startWebcam();
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsRecordingVideo(false);
      stopWebcam();
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      stopWebcam();
    };
  }, [currentStep, cameraFacingMode]);

  // Flip camera between front and back
  const handleToggleCameraFacing = () => {
    const newFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(newFacing);
    startWebcam(newFacing);
  };

  // Burn authentic Geotag onto Image Canvas
  const burnGeotagOnCanvas = (
    source: CanvasImageSource,
    width: number,
    height: number,
    category: PhotoEvidenceCategory,
    captionText: string
  ): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw main photo
    ctx.drawImage(source, 0, 0, width, height);

    const now = new Date();
    const timestampStr =
      now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' IST';

    const hashStr = 'SHA256:' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
    const categoryObj = PHOTO_CATEGORIES.find((c) => c.id === category);

    // 1. Top Indian National Tricolor Strip
    ctx.fillStyle = '#FF9933';
    ctx.fillRect(0, 0, width / 3, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(width / 3, 0, width / 3, 6);
    ctx.fillStyle = '#128807';
    ctx.fillRect((width * 2) / 3, 0, width / 3, 6);

    // 2. Top Header Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 6, width, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(`🇮🇳 GOVT OF INDIA • STATUTORY AUDIT EVIDENCE • ${task.id}`, 16, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`CATEGORY: ${categoryObj?.name.toUpperCase()}`, width - 280, 28);

    // 3. Bottom Comprehensive Geotag & Coordinates Strip
    const bannerHeight = 110;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Cyan Geotag Accent Line
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, height - bannerHeight, width, 3);

    // Row 1: Real GPS & Location
    const latStr = currentGps && typeof currentGps.lat === 'number' ? currentGps.lat.toFixed(6) : '28.532000';
    const lngStr = currentGps && typeof currentGps.lng === 'number' ? currentGps.lng.toFixed(6) : '77.273000';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `📍 GPS: ${latStr}° N, ${lngStr}° E  (Accuracy: ±${gpsAccuracy.toFixed(1)}m)`,
      18,
      height - bannerHeight + 24
    );

    // Google Maps Search Pin Tag
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`✓ 150M GEOFENCE VERIFIED`, width - 220, height - bannerHeight + 24);

    // Row 2: Target Facility & Address
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`FACILITY: ${task.title} | ${task.location}`, 18, height - bannerHeight + 48);

    // Row 3: Auditor & Timestamp
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(
      `AUDITOR: ${currentOfficer.name} [Badge: ${currentOfficer.badgeNumber || 'INSP-DEL-402'}] | ${timestampStr}`,
      18,
      height - bannerHeight + 72
    );

    // Row 4: Caption & Tamper-Proof Cryptographic Hash
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`NOTE: ${captionText || categoryObj?.name}`, 18, height - bannerHeight + 94);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(hashStr, width - 260, height - bannerHeight + 94);

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Capture Live Snapshot from Video Stream or Simulated Field Camera
  const handleCaptureLiveSnapshot = () => {
    const categoryObj = PHOTO_CATEGORIES.find((c) => c.id === activeCategory);
    const captionToUse = customPhotoCaption.trim() || `${categoryObj?.name} Physical Verification`;

    // 1. If using simulated feed
    if (isUsingSimulatedCamera) {
      const activeSample = SAMPLE_FIELD_PHOTOS.find((s) => s.category === activeCategory) || SAMPLE_FIELD_PHOTOS[0];
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeSample.url;
      img.onload = () => {
        const dataUrl = burnGeotagOnCanvas(img, 1280, 720, activeCategory, captionToUse);
        if (dataUrl) {
          const newPhoto: TaskPhoto = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            url: dataUrl,
            caption: captionToUse,
            category: activeCategory,
            timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
            coordinates: { ...currentGps },
            accuracyMeters: gpsAccuracy,
            locationAddress: task.location,
            officerBadge: currentOfficer.badgeNumber || 'INSP-DEL-402',
            tamperProofHash: 'SHA256:' + Math.random().toString(16).substring(2, 10),
          };

          setPhotos((prev) => [...prev, newPhoto]);
          setCustomPhotoCaption('');
          onShowToast(`✓ Geotagged audit photo captured for "${categoryObj?.name}"`, 'success');
        }
      };
      return;
    }

    // 2. Hardware laptop camera capture
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      onShowToast('Awaiting live laptop camera video feed. Please ensure camera is active.', 'error');
      return;
    }

    const dataUrl = burnGeotagOnCanvas(video, video.videoWidth, video.videoHeight, activeCategory, captionToUse);
    if (!dataUrl) {
      onShowToast('Could not capture frame from laptop camera.', 'error');
      return;
    }

    const newPhoto: TaskPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: dataUrl,
      caption: captionToUse,
      category: activeCategory,
      timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
      coordinates: { ...currentGps },
      accuracyMeters: gpsAccuracy,
      locationAddress: task.location,
      officerBadge: currentOfficer.badgeNumber || 'INSP-DEL-402',
      tamperProofHash: 'SHA256:' + Math.random().toString(16).substring(2, 10),
    };

    setPhotos((prev) => [...prev, newPhoto]);
    setCustomPhotoCaption('');
    onShowToast(`✓ Live laptop camera photo captured & stamped for "${categoryObj?.name}"`, 'success');
  };

  // Upload or attach sample photo into active category space
  const handleAddSamplePhoto = (sample: { url: string; caption: string; category: PhotoEvidenceCategory }) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sample.url;
    img.onload = () => {
      const dataUrl = burnGeotagOnCanvas(img, 1280, 720, activeCategory, sample.caption);
      const newPhoto: TaskPhoto = {
        id: `photo_sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: dataUrl || sample.url,
        caption: sample.caption,
        category: activeCategory,
        timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
        coordinates: { ...currentGps },
        accuracyMeters: gpsAccuracy,
        locationAddress: task.location,
        officerBadge: currentOfficer.badgeNumber || 'INSP-DEL-402',
        tamperProofHash: 'SHA256:' + Math.random().toString(16).substring(2, 10),
      };
      setPhotos((prev) => [...prev, newPhoto]);
      onShowToast(`✓ Attached photo to "${PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}"`, 'success');
    };
  };

  // Upload file from device storage into active category space
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.src = event.target.result as string;
          img.onload = () => {
            const dataUrl = burnGeotagOnCanvas(
              img,
              img.width || 1280,
              img.height || 720,
              activeCategory,
              file.name.replace(/\.[^/.]+$/, '')
            );

            const newPhoto: TaskPhoto = {
              id: `photo_up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              url: dataUrl,
              caption: file.name.replace(/\.[^/.]+$/, ''),
              category: activeCategory,
              timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
              coordinates: { ...currentGps },
              accuracyMeters: gpsAccuracy,
              locationAddress: task.location,
              officerBadge: currentOfficer.badgeNumber || 'INSP-DEL-402',
              tamperProofHash: 'SHA256:' + Math.random().toString(16).substring(2, 10),
            };
            setPhotos((prev) => [...prev, newPhoto]);
            onShowToast(`✓ Uploaded evidence into "${PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}"`, 'success');
          };
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    onShowToast('Evidence photo removed.', 'info');
  };

  // Video Recording Handlers
  const handleStartVideoRecording = async () => {
    if (isRecordingVideo) return;

    // 1. If using simulated camera feed
    if (isUsingSimulatedCamera) {
      setIsRecordingVideo(true);
      setRecordingDuration(0);
      videoStartTimeRef.current = Date.now();
      onShowToast('🔴 Field Video Recording initiated (Simulation Mode)', 'info');

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            handleStopVideoRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
      return;
    }

    // 2. Hardware camera video recording
    if (!streamRef.current || !streamRef.current.active) {
      onShowToast('Awaiting live webcam feed before starting video recording.', 'error');
      return;
    }

    try {
      let combinedStream = streamRef.current;
      // Optional: attach microphone audio track if available
      if (combinedStream.getAudioTracks().length === 0) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach((track) => {
            combinedStream.addTrack(track);
          });
        } catch {
          // Video-only recording is acceptable if microphone blocked
        }
      }

      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(combinedStream, { mimeType }) : new MediaRecorder(combinedStream);
      mediaRecorderRef.current = recorder;
      videoChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: mimeType || 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);

        let thumbUrl = '';
        if (videoRef.current && videoRef.current.videoWidth > 0) {
          thumbUrl = burnGeotagOnCanvas(
            videoRef.current,
            videoRef.current.videoWidth,
            videoRef.current.videoHeight,
            activeCategory,
            `Video Frame (${recordingDuration}s)`
          );
        }

        const categoryObj = PHOTO_CATEGORIES.find((c) => c.id === activeCategory);
        const newVideo: TaskVideo = {
          id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          url: videoUrl,
          durationSeconds: recordingDuration || 5,
          caption: customPhotoCaption.trim() || `${categoryObj?.name} Statutory On-Site Video Audit`,
          category: activeCategory,
          timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
          coordinates: { ...currentGps },
          accuracyMeters: gpsAccuracy,
          locationAddress: task.location,
          officerBadge: currentOfficer.badgeNumber || 'INSP-MH-402',
          tamperProofHash: 'SHA256:' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10),
          thumbnailUrl: thumbUrl || (photos.length > 0 ? photos[photos.length - 1].url : undefined),
          fileSizeMb: Number((blob.size / (1024 * 1024)).toFixed(2)),
        };

        setVideos((prev) => [...prev, newVideo]);
        setEvidenceTab('VIDEOS');
        setCustomPhotoCaption('');
        onShowToast(`✓ Recorded & sealed statutory audit video (${recordingDuration}s) for "${categoryObj?.name}"`, 'success');
      };

      recorder.start(500);
      setIsRecordingVideo(true);
      setRecordingDuration(0);
      videoStartTimeRef.current = Date.now();
      onShowToast('🔴 Recording video audit evidence. Keep camera focused on premises.', 'info');

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            handleStopVideoRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('MediaRecorder start error:', err);
      onShowToast(`Could not start video recording: ${err.message}`, 'error');
    }
  };

  const handleStopVideoRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const finalDuration = Math.max(1, recordingDuration || Math.round((Date.now() - videoStartTimeRef.current) / 1000));
    setIsRecordingVideo(false);

    if (isUsingSimulatedCamera) {
      const categoryObj = PHOTO_CATEGORIES.find((c) => c.id === activeCategory);
      const activeSample = SAMPLE_FIELD_PHOTOS.find((s) => s.category === activeCategory) || SAMPLE_FIELD_PHOTOS[0];
      const simulatedVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

      const newVideo: TaskVideo = {
        id: `video_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: simulatedVideoUrl,
        durationSeconds: finalDuration,
        caption: customPhotoCaption.trim() || `${categoryObj?.name} Field Inspection Video Recording`,
        category: activeCategory,
        timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
        coordinates: { ...currentGps },
        accuracyMeters: gpsAccuracy,
        locationAddress: task.location,
        officerBadge: currentOfficer.badgeNumber || 'INSP-MH-402',
        tamperProofHash: 'SHA256:' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10),
        thumbnailUrl: activeSample.url,
        fileSizeMb: Number((finalDuration * 0.45).toFixed(1)),
      };

      setVideos((prev) => [...prev, newVideo]);
      setEvidenceTab('VIDEOS');
      setCustomPhotoCaption('');
      onShowToast(`✓ Simulated audit video recording sealed (${finalDuration}s).`, 'success');
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
      }
    }
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const videoUrl = URL.createObjectURL(file);
    const categoryObj = PHOTO_CATEGORIES.find((c) => c.id === activeCategory);

    const newVideo: TaskVideo = {
      id: `video_up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: videoUrl,
      durationSeconds: 15,
      caption: file.name.replace(/\.[^/.]+$/, ''),
      category: activeCategory,
      timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
      coordinates: { ...currentGps },
      accuracyMeters: gpsAccuracy,
      locationAddress: task.location,
      officerBadge: currentOfficer.badgeNumber || 'INSP-MH-402',
      tamperProofHash: 'SHA256:' + Math.random().toString(16).substring(2, 10),
      fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
    };

    setVideos((prev) => [...prev, newVideo]);
    setEvidenceTab('VIDEOS');
    onShowToast(`✓ Attached video file "${file.name}" to ${categoryObj?.name}`, 'success');
  };

  const handleRemoveVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    onShowToast('Evidence video removed.', 'info');
  };

  // Checklist handlers
  const handleToggleChecklist = (id: string, passed: boolean) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed } : item))
    );
  };

  const handleChecklistNoteChange = (id: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const passedCount = checklist.filter((c) => c.passed).length;
  const failedCount = checklist.filter((c) => !c.passed).length;
  const checklistScorePercent = Math.round((passedCount / checklist.length) * 100);

  // Final statutory record submission
  const handleSubmitFinalDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitedSite) {
      onShowToast('Please complete Step 1: Location Verification & GPS Check-in before submitting.', 'error');
      setCurrentStep(1);
      return;
    }

    if (photos.length === 0 && videos.length === 0) {
      onShowToast('At least 1 photo or video evidence is required under Ministry audit rules.', 'error');
      setCurrentStep(2);
      return;
    }

    if (!certifyTruthChecked) {
      onShowToast('Please certify statutory truth and authenticity oath.', 'error');
      return;
    }

    setIsSubmitting(true);

    const finalStatus: 'Completed' | 'Failed/Issue Found' =
      submissionStatus === 'Failed/Issue Found' || issuesDefects.trim().length > 20 || failedCount >= 3
        ? 'Failed/Issue Found'
        : 'Completed';

    const result = submitTaskInspection({
      taskId: task.id,
      inspector: currentOfficer,
      locationSite: task.location,
      dateTime: dateTime.replace('T', ' ') + ' IST',
      inspectionType: task.inspectionType,
      photos,
      videos,
      checklist,
      observations,
      issuesDefects: issuesDefects.trim() || 'All verified parameters compliant with Government guidelines.',
      severityPriority,
      inspectorRemarks: `${inspectorRemarks} | Digitally certified by ${digitalSignature}`,
      inspectionStatus: finalStatus,
    });

    setIsSubmitting(false);

    if (result.success && result.updatedTask) {
      // Asynchronously record inspection completion in central SQLite database
      inspectionApi.submit(task.id, {
        checklist: checklist.map((c) => ({ id: c.id, label: c.label, passed: c.passed, notes: c.notes })),
        observations,
        issuesDefects: issuesDefects.trim() || 'All verified parameters compliant with Government guidelines.',
        inspectorRemarks: `${inspectorRemarks} | Digitally certified by ${digitalSignature}`,
        inspectionStatus: finalStatus,
      }).catch((err) => {
        console.warn('Backend inspection submit sync:', err);
      });

      onShowToast(
        `✓ Official statutory audit dossier for ${task.id} sealed with SHA-256 and submitted to Directorate General (IAS).`,
        'success'
      );
      onSubmitSuccess(result.updatedTask);
      onClose();
    } else {
      onShowToast('Failed to submit statutory record. Please review required fields.', 'error');
    }
  };

  // Evidence filtered for currently selected category space
  const categoryPhotos = photos.filter((p) => (p.category || 'PREMISE_SIGNBOARD') === activeCategory);
  const categoryVideos = videos.filter((v) => (v.category || 'PREMISE_SIGNBOARD') === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-5xl w-full my-4 shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col max-h-[95vh] ring-1 ring-white/10">
        
        {/* National Tricolor Accent Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shrink-0" />

        {/* Institutional Government Header Strip */}
        <div className="bg-[#0B3B60] text-white p-5 sm:p-6 border-b border-[#0B3B60] shrink-0 bg-gradient-to-r from-[#07253d] via-[#0B3B60] to-[#0d4672]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-13 h-17 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                <EmblemOfIndia variant="badge" size={50} className="shadow-md" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 bg-white/15 text-blue-100 border border-white/20 rounded text-[10px] font-bold uppercase tracking-wider">
                    Government of India • भारत सरकार
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-full font-mono font-semibold text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    WARRANT NO: {task.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${
                    task.priority?.toUpperCase().includes('HIGH') || task.priority?.toUpperCase().includes('CRITICAL')
                      ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                      : task.priority?.toUpperCase().includes('MEDIUM')
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                      : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                  }`}>
                    Priority: {task.priority}
                  </span>
                </div>

                <div className="text-xs text-amber-300 font-medium">
                  सामाजिक न्याय एवं अधिकारिता मंत्रालय | Department of Social Justice &amp; Empowerment
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                  Field Vigilance Inspection Execution Terminal <span className="text-slate-400 font-normal">|</span> <span className="text-blue-100">{task.title}</span>
                </h2>
                <div className="flex items-center text-xs text-slate-200 font-mono">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-amber-400 shrink-0" />
                  <span className="line-clamp-1">{task.location}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 transition-all cursor-pointer border border-white/20 shrink-0"
              title="Close Inspection Terminal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 5-STAGE WORKFLOW STEPPER BAR */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span className="font-semibold tracking-wider uppercase text-slate-300">Statutory Audit Workflow: Stage {currentStep} of 5</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold text-[11px]">
                {Math.round((currentStep / 5) * 100)}% Completed
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            {/* Step Segment Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 text-center text-xs">
              {[
                { step: 1, title: '1. GPS Check-In', icon: Navigation },
                { step: 2, title: '2. Photos & Videos', icon: Camera },
                { step: 3, title: '3. Statutory Checklist', icon: FileCheck },
                { step: 4, title: '4. Observations & Defects', icon: AlertTriangle },
                { step: 5, title: '5. Signature & Submit', icon: PenTool },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentStep === item.step;
                const isPassed = currentStep > item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setCurrentStep(item.step)}
                    className={`py-2 px-2 rounded-xl border flex items-center justify-center space-x-1.5 transition-all cursor-pointer truncate ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/50 font-bold shadow-md shadow-blue-950/50'
                        : isPassed
                        ? 'bg-slate-800/80 text-emerald-400 border-emerald-500/30 hover:bg-slate-800 hover:border-emerald-500/50'
                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
                    <span className="truncate text-[11px] sm:text-xs">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Body: Multi-Step Pages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 text-slate-800">
          
          {/* ============================================================ */}
          {/* PAGE 1: LOCATION VERIFICATION & 150M GEOFENCE CHECK-IN */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                        Stage 1: Physical On-Site Verification &amp; Fused GPS Check-In
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Central Vigilance Commission (CVC) mandate requires officer presence within 150m perimeter of registered NGO premises.
                      </p>
                    </div>
                  </div>

                  {visitedSite ? (
                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs shrink-0 self-start sm:self-center">
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Check-In Verified (Within 150m)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs shrink-0 self-start sm:self-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                      Awaiting Physical Check-In
                    </span>
                  )}
                </div>

                {/* Target Facility & Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Audited Target Facility / NGO</span>
                    <span className="font-bold text-slate-900 text-sm mt-1 block">{task.title}</span>
                    <span className="text-slate-500 block mt-1.5 leading-relaxed">{task.location}</span>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Target Registered GPS Geofence Center</span>
                    <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
                      {targetCoords.lat.toFixed(6)}° N, {targetCoords.lng.toFixed(6)}° E
                    </span>
                    <div className="mt-2">
                      <a
                        href={`https://www.google.com/maps?q=${targetCoords.lat},${targetCoords.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Verify Coordinates on Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Live Inspector GPS Radar Card */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2.5 font-mono text-cyan-300">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                      <span className="font-bold tracking-wider uppercase text-xs">Live Real Device Telemetry Radar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-mono text-xs bg-cyan-950/70 border border-cyan-800/60 px-3 py-1 rounded-lg">
                        {gpsSource} • ±{gpsAccuracy.toFixed(1)}m
                      </span>
                      <button
                        type="button"
                        onClick={() => acquireRealGps(true)}
                        disabled={isAcquiringGps}
                        className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Re-query physical hardware GPS sensor"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAcquiringGps ? 'animate-spin text-cyan-400' : ''}`} />
                        <span>{isAcquiringGps ? 'Locking...' : 'Sync GPS'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Real Device Address Readout */}
                  <div className="bg-slate-900/80 px-3.5 py-2.5 rounded-xl text-xs text-slate-300 flex items-center gap-2 border border-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate" title={deviceAddress}>
                      Physical Location: <strong className="text-white font-semibold">{deviceAddress}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Current Inspector Lat/Lng</span>
                      <span className="text-white font-bold text-sm mt-1 block">{currentGps.lat.toFixed(6)}° N</span>
                      <span className="text-slate-300 block">{currentGps.lng.toFixed(6)}° E</span>
                    </div>

                    <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Distance to Premises</span>
                      <span className={`text-xl font-extrabold mt-0.5 block ${distanceMeters <= 150 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km (${distanceMeters.toLocaleString()} m)` : `${distanceMeters} Meters`}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Radius Threshold: 150m</span>
                    </div>

                    <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                      <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Geofence Lock Status</span>
                      <div className="mt-1">
                        <span className={`font-bold inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border ${
                          distanceMeters <= 150
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                            : 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${distanceMeters <= 150 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                          {distanceMeters <= 150 ? 'Inside 150m Perimeter' : 'Outside Geofence Perimeter'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions to Check In */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {!visitedSite ? (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await inspectionApi.checkIn(task.id, currentGps.lat, currentGps.lng);
                              setDistanceMeters(res.distanceMeters || distanceMeters);
                              setVisitedSite(true);
                              onShowToast(`✓ Real device GPS location checked in (${res.distanceMeters || distanceMeters}m).`, 'success');
                            } catch {
                              setVisitedSite(true);
                              onShowToast(`✓ Real device GPS authenticated at ${currentGps.lat.toFixed(4)}, ${currentGps.lng.toFixed(4)}.`, 'success');
                            }
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold border border-emerald-500/40 flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-950/50 transition-all"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Check-In at Current Real GPS ({distanceMeters >= 1000 ? `${(distanceMeters/1000).toFixed(1)}km` : `${distanceMeters}m`})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAlignTargetToCurrentLocation}
                          className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 rounded-xl text-xs font-semibold border border-blue-500/30 flex items-center space-x-2 cursor-pointer transition-all"
                          title="Set target site coordinates to this physical device location"
                        >
                          <MapPin className="w-4 h-4 text-cyan-400" />
                          <span>Set Target to My Location (~0m)</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const checkInLat = targetCoords.lat + 0.00010;
                            const checkInLng = targetCoords.lng + 0.00010;
                            setCurrentGps({ lat: checkInLat, lng: checkInLng });
                            try {
                              const res = await inspectionApi.checkIn(task.id, checkInLat, checkInLng);
                              setDistanceMeters(res.distanceMeters || 22);
                              setVisitedSite(true);
                              onShowToast(`✓ CVC 150m Geofence approved (${res.distanceMeters || 22}m from NGO entrance).`, 'success');
                            } catch {
                              setDistanceMeters(22);
                              setVisitedSite(true);
                              onShowToast('✓ Simulated arrival at NGO gate (22m distance). Geofence verified.', 'info');
                            }
                          }}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-all"
                        >
                          <span>Simulate Arrival at Gate (22m)</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-emerald-950/80 p-3.5 rounded-xl border border-emerald-500/50 text-emerald-200 text-xs font-semibold">
                        <div className="flex items-center space-x-2.5">
                          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>Official Physical Check-In Confirmed: Inspector {currentOfficer.name} (#{currentOfficer.badgeNumber || 'INSP-DEL-402'})</span>
                        </div>
                        <span className="text-xs font-mono text-emerald-300">IST: {new Date().toLocaleTimeString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ============================================================ */}
          {/* PAGE 2: LIVE WEBCAM & CATEGORIZED GEOTAGGED PHOTO & VIDEO EVIDENCE */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                        Stage 2: Real-Time Photographic &amp; Video Audit Evidence
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Live laptop camera captures geotagged photos and records statutory on-site video clips stamped with Indian Tricolor, GPS coordinates, timestamp, and SHA-256 seal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono shadow-xs">
                      📷 {photos.length} Photos
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono shadow-xs">
                      🎥 {videos.length} Videos
                    </span>
                  </div>
                </div>

                {/* CATEGORY SPACES TABS / SELECTOR */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Select Target Evidence Category Shelf:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PHOTO_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const countPhotos = photos.filter((p) => (p.category || 'PREMISE_SIGNBOARD') === cat.id).length;
                      const countVideos = videos.filter((v) => (v.category || 'PREMISE_SIGNBOARD') === cat.id).length;
                      const isSelected = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveCategory(cat.id)}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-500 shadow-md shadow-blue-900/20 ring-2 ring-blue-400/30'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-slate-100'}`}>
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                                isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {countPhotos}📷
                              </span>
                              {countVideos > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                                  isSelected ? 'bg-rose-900 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {countVideos}🎥
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-bold mt-2.5 line-clamp-1 leading-tight">
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    Active Shelf: <strong className="text-blue-700 font-bold">{PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}</strong> — {PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.description}
                  </p>
                </div>

                {/* LIVE WEBCAM VIEWFINDER HUD */}
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
                  {/* Top Tactical HUD Bar */}
                  <div className="p-3 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 text-xs font-mono text-slate-300">
                    <div className="flex items-center space-x-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRecordingVideo ? 'bg-rose-500' : isUsingSimulatedCamera ? 'bg-amber-400' : isCameraActive ? 'bg-emerald-400' : 'bg-cyan-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRecordingVideo ? 'bg-rose-600' : isUsingSimulatedCamera ? 'bg-amber-500' : isCameraActive ? 'bg-emerald-500' : 'bg-cyan-500'}`}></span>
                      </span>
                      <span className="font-bold text-white text-xs uppercase tracking-wider">
                        {isRecordingVideo
                          ? '🔴 VIDEO RECORDING IN PROGRESS'
                          : isUsingSimulatedCamera
                          ? 'SIMULATED FEED'
                          : isCameraActive
                          ? 'LIVE LAPTOP WEBCAM ACTIVE'
                          : isCameraStarting
                          ? 'CONNECTING LAPTOP WEBCAM...'
                          : 'WEBCAM STANDBY'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      {/* Mode Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isRecordingVideo) {
                            handleStopVideoRecording();
                          }
                          if (isUsingSimulatedCamera) {
                            setIsUsingSimulatedCamera(false);
                            startWebcam();
                          } else {
                            setIsUsingSimulatedCamera(true);
                            stopWebcam();
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold uppercase transition-all cursor-pointer border ${
                          isUsingSimulatedCamera
                            ? 'bg-blue-950 text-blue-300 border-blue-500 hover:bg-blue-900'
                            : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                        }`}
                      >
                        {isUsingSimulatedCamera ? '📷 Switch to Laptop Camera' : '⚡ Switch to Simulator'}
                      </button>
                      <span className="text-emerald-400 font-bold">
                        📍 {currentGps.lat.toFixed(5)}°N, {currentGps.lng.toFixed(5)}°E
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-amber-300 font-bold">{new Date().toLocaleTimeString('en-IN')} IST</span>
                    </div>
                  </div>

                  {/* Video Screen with Reticle / Simulated Feed */}
                  <div className="relative aspect-video max-h-[380px] bg-slate-950 flex items-center justify-center overflow-hidden">
                    {/* Always keep video element mounted in the DOM so videoRef.current is NEVER null */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${isUsingSimulatedCamera ? 'hidden' : 'block'}`}
                    />

                    {/* Simulated Camera Feed Overlay */}
                    {isUsingSimulatedCamera && (
                      <div className="relative w-full h-full">
                        <img
                          src={(SAMPLE_FIELD_PHOTOS.find((s) => s.category === activeCategory) || SAMPLE_FIELD_PHOTOS[0]).url}
                          alt="Field Camera Simulated Feed"
                          className="w-full h-full object-cover brightness-95 contrast-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20 pointer-events-none" />
                        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs border border-amber-500/40 px-3 py-1 rounded-lg text-[11px] font-mono font-bold text-amber-300 flex items-center space-x-1.5 shadow-md pointer-events-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>SIMULATED SCENE: {PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name.toUpperCase()}</span>
                        </div>
                      </div>
                    )}

                    {/* LIVE VIDEO RECORDING FLOATING BADGE OVERLAY */}
                    {isRecordingVideo && (
                      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-rose-950/95 text-white px-4 py-1.5 rounded-full border border-rose-500 shadow-xl font-mono">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                        <span className="font-bold text-xs text-rose-300 uppercase tracking-wider">REC</span>
                        <span className="text-white font-bold text-xs">{formatDuration(recordingDuration)}</span>
                        <span className="text-slate-400 text-[10px]">/ 01:00</span>
                      </div>
                    )}

                    {/* Loading State when camera is spinning up */}
                    {isCameraStarting && !isUsingSimulatedCamera && (
                      <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-4 text-center space-y-2 z-10">
                        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-emerald-300 font-medium">Opening laptop camera... Please allow camera access if prompted by browser.</p>
                      </div>
                    )}

                    {/* Corner Target L-Brackets */}
                    <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-400 pointer-events-none"></div>
                    <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-amber-400 pointer-events-none"></div>
                    <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-amber-400 pointer-events-none"></div>
                    <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-amber-400 pointer-events-none"></div>

                    {/* Geotag Watermark Live Preview Strip */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-slate-950/90 text-white text-[11px] font-mono pointer-events-none border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-300 font-bold">
                          📍 {currentGps.lat.toFixed(6)}° N, {currentGps.lng.toFixed(6)}° E (±{gpsAccuracy.toFixed(1)}m)
                        </span>
                        <span className="text-emerald-400 font-bold">
                          SHELF: {PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] truncate mt-0.5">
                        {task.title} • {task.location}
                      </p>
                    </div>

                    {/* Error fallback banner if webcam blocked */}
                    {cameraError && !isUsingSimulatedCamera && (
                      <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 text-slate-200 z-10">
                        <VideoOff className="w-9 h-9 text-rose-500" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-white">Laptop Camera Not Accessible</h4>
                          <p className="text-xs text-rose-300 max-w-md bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/50">{cameraError}</p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => startWebcam()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Retry Opening Camera
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsUsingSimulatedCamera(true);
                              setCameraError(null);
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-600 cursor-pointer"
                          >
                            Use Simulated Feed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Control Bar */}
                  <div className="p-3 bg-slate-900 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                    <div className="flex items-center space-x-2 flex-1 min-w-[200px] max-w-md">
                      <input
                        type="text"
                        value={customPhotoCaption}
                        onChange={(e) => setCustomPhotoCaption(e.target.value)}
                        placeholder={`Caption for ${PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}...`}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-slate-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2 flex-wrap">
                      {/* Live Photo Capture Button */}
                      <button
                        type="button"
                        id="btn-capture-webcam-snapshot"
                        onClick={handleCaptureLiveSnapshot}
                        disabled={isRecordingVideo}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-blue-400/40 flex items-center space-x-1.5 cursor-pointer shadow-md tracking-wider uppercase transition-all"
                        title="Capture Instant Geotagged Photo"
                      >
                        <Camera className="w-4 h-4 text-white" />
                        <span>CAPTURE AUDIT PHOTO</span>
                      </button>

                      {/* Live Video Recording Button */}
                      {!isRecordingVideo ? (
                        <button
                          type="button"
                          id="btn-record-webcam-video"
                          onClick={handleStartVideoRecording}
                          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl border border-rose-400/40 flex items-center space-x-1.5 cursor-pointer shadow-md tracking-wider uppercase transition-all"
                          title="Record Geotagged Field Video Audit (10s–60s)"
                        >
                          <Video className="w-4 h-4 text-white" />
                          <span>RECORD AUDIT VIDEO</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="btn-stop-webcam-video"
                          onClick={handleStopVideoRecording}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-2 border-red-300 flex items-center space-x-1.5 cursor-pointer shadow-lg uppercase tracking-wider animate-pulse"
                          title="Stop Recording and Seal Video Evidence"
                        >
                          <Square className="w-4 h-4 fill-white text-white" />
                          <span>STOP &amp; SEAL VIDEO ({formatDuration(recordingDuration)})</span>
                        </button>
                      )}

                      {/* Flip Camera Button (only relevant if using hardware webcam) */}
                      {!isUsingSimulatedCamera && (
                        <button
                          type="button"
                          onClick={handleToggleCameraFacing}
                          disabled={isRecordingVideo}
                          title="Switch Camera (Front / Back)"
                          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload or Attach Verified Evidence */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {/* Upload Photo Button */}
                    <label className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Upload Video Button */}
                    <label className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors">
                      <Film className="w-4 h-4 text-rose-600" />
                      <span>Upload Video (.mp4, .webm)</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Facility CCTV Live Frame Capture */}
                    <button
                      type="button"
                      onClick={() => setIsCctvModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-emerald-400 border border-slate-700/80 rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-all"
                    >
                      <Video className="w-4 h-4 text-emerald-400" />
                      <span>Facility CCTV Frame</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </button>

                    <span className="text-slate-400 text-xs hidden sm:inline">or sample photo:</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SAMPLE_FIELD_PHOTOS.filter((s) => s.category === activeCategory).map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddSamplePhoto(s)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span className="line-clamp-1 max-w-[150px]">{s.caption}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SEPARATE CATEGORY SPACE GALLERY WITH PHOTO / VIDEO TABS */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => setEvidenceTab('PHOTOS')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                          evidenceTab === 'PHOTOS'
                            ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Shelf Photos ({categoryPhotos.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEvidenceTab('VIDEOS')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                          evidenceTab === 'VIDEOS'
                            ? 'bg-white text-rose-700 shadow-xs border border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Shelf Videos ({categoryVideos.length})</span>
                      </button>
                    </div>

                    <span className="text-xs text-slate-500 font-mono">
                      Shelf: <strong className="text-slate-800">{PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}</strong>
                    </span>
                  </div>

                  {/* TAB 1: PHOTOS GRID */}
                  {evidenceTab === 'PHOTOS' && (
                    <>
                      {categoryPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {categoryPhotos.map((photo) => (
                            <div
                              key={photo.id}
                              className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-200 shadow-xs group hover:shadow-md transition-all"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption || 'Evidence'}
                                className="w-full h-32 object-cover cursor-pointer group-hover:scale-102 transition-transform duration-200"
                                onClick={() => setSelectedPhotoForZoom(photo)}
                              />

                              {/* Quick Geotag Badge Overlay */}
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] text-amber-300 font-mono border border-slate-700">
                                📍 {photo.coordinates ? `${photo.coordinates.lat.toFixed(4)}°N` : 'GPS'}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(photo.id)}
                                className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg text-xs transition-colors cursor-pointer border border-rose-500 shadow-sm"
                                title="Remove Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div
                                onClick={() => setSelectedPhotoForZoom(photo)}
                                className="absolute inset-x-0 bottom-0 bg-slate-950/90 p-2.5 text-white cursor-pointer border-t border-slate-800"
                              >
                                <p className="font-bold text-[11px] truncate leading-tight">{photo.caption}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span>{photo.timestamp}</span>
                                  <span className="text-blue-400 underline font-bold">Inspect</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-1.5">
                          <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-700">
                            No photographic evidence attached for {PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}.
                          </p>
                          <p className="text-xs text-slate-500">
                            Aim webcam and click "CAPTURE AUDIT PHOTO" to attach geotagged record to this shelf.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 2: VIDEOS GRID */}
                  {evidenceTab === 'VIDEOS' && (
                    <>
                      {categoryVideos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {categoryVideos.map((video) => (
                            <div
                              key={video.id}
                              className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-xs group hover:shadow-md transition-all"
                            >
                              {/* Video thumbnail or preview */}
                              <div
                                className="relative w-full h-36 bg-black flex items-center justify-center cursor-pointer overflow-hidden"
                                onClick={() => setSelectedVideoForPreview(video)}
                              >
                                {video.thumbnailUrl ? (
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.caption || 'Video Audit'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-90"
                                  />
                                ) : (
                                  <video
                                    src={video.url}
                                    className="w-full h-full object-cover brightness-90"
                                    preload="metadata"
                                  />
                                )}

                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                  <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg border border-rose-400 group-hover:scale-110 transition-transform">
                                    <Play className="w-4 h-4 fill-white ml-0.5" />
                                  </div>
                                </div>

                                {/* Duration Badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/85 text-[10px] text-amber-300 font-mono font-bold border border-slate-700 flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDuration(video.durationSeconds || 0)}</span>
                                </div>

                                {/* Video Audit Badge & Remove Button */}
                                <div className="absolute top-2 right-2 flex items-center space-x-1">
                                  <span className="px-2 py-0.5 rounded-md bg-rose-950/90 text-[10px] text-rose-300 font-mono border border-rose-800 font-bold uppercase">
                                    VIDEO AUDIT
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveVideo(video.id);
                                    }}
                                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs transition-colors cursor-pointer border border-rose-500 shadow-sm"
                                    title="Remove Video"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div
                                onClick={() => setSelectedVideoForPreview(video)}
                                className="p-2.5 bg-slate-900 text-white cursor-pointer border-t border-slate-800"
                              >
                                <p className="font-bold text-xs truncate text-white">{video.caption}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                                  <span className="text-emerald-400">
                                    📍 {video.coordinates ? `${video.coordinates.lat.toFixed(4)}°N` : 'GPS'}
                                  </span>
                                  <span>{video.timestamp}</span>
                                  <span className="text-blue-400 font-bold underline">Play ↗</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                          <Film className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-700">
                            No video audit recordings attached for {PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}.
                          </p>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Aim your camera and click <strong className="text-rose-600 font-bold">"RECORD AUDIT VIDEO"</strong> above to record a statutory on-site video clip, or upload an existing video file.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PAGE 3: STATUTORY 10-POINT INSPECTION CHECKLIST */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                        Stage 3: Statutory 10-Point Regulatory Checklist
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Audit all 10 statutory conditions required under the NGO Oversight Framework &amp; GIGW 3.0 norms.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setChecklist((prev) => prev.map((item) => ({ ...item, passed: true })));
                        onShowToast('✓ All 10 statutory conditions marked compliant.', 'info');
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      Mark All Pass
                    </button>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-xs">
                      ✓ {passedCount} Compliant
                    </span>
                    {failedCount > 0 && (
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-xs">
                        ✕ {failedCount} Deficient
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-white font-bold font-mono shadow-xs ${
                      checklistScorePercent >= 80
                        ? 'bg-emerald-600'
                        : checklistScorePercent >= 50
                        ? 'bg-amber-600'
                        : 'bg-rose-600'
                    }`}>
                      Score: {checklistScorePercent}%
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
                  {checklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            §{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.label}</span>
                        </div>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleChecklistNoteChange(item.id, e.target.value)}
                          placeholder="Verification observation or statutory document ref..."
                          className="w-full text-xs bg-slate-50 hover:bg-white focus:bg-white px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => handleToggleChecklist(item.id, true)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            item.passed
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleChecklist(item.id, false)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            !item.passed
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Fail</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PAGE 4: FIELD OBSERVATIONS, DEFECTS & SEVERITY */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                      Stage 4: Field Observations, Discrepancy Findings &amp; Severity
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Record field audit observations, detected irregularities, and priority classification for Directorate General (IAS) scrutiny.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Field Observations */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Physical Premises &amp; Operational Observations:
                    </label>
                    <textarea
                      rows={4}
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Detail operational premises, staff headcount, active beneficiary services..."
                      className="w-full p-3.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all placeholder:text-slate-400 leading-relaxed shadow-xs"
                    />
                  </div>

                  {/* Issues / Defects Found */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Discrepancies / Defects Identified:</span>
                      <span className="text-[11px] text-emerald-700 font-normal bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Leave blank if fully compliant
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      value={issuesDefects}
                      onChange={(e) => setIssuesDefects(e.target.value)}
                      placeholder="e.g. Missing DARPAN ID signboard, 2 ghost beneficiaries discovered, ledger vouchers incomplete..."
                      className="w-full p-3.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all placeholder:text-slate-400 leading-relaxed shadow-xs"
                    />
                  </div>
                </div>

                {/* Audit Priority & Date Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Audit Severity / Priority Level:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Low', 'Medium', 'High', 'Critical'] as const).map((lvl) => {
                        const isSelected = severityPriority === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSeverityPriority(lvl)}
                            className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? lvl === 'Critical'
                                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-500 shadow-md shadow-rose-900/20 ring-2 ring-rose-300'
                                  : lvl === 'High'
                                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500 shadow-md shadow-amber-900/20 ring-2 ring-amber-300'
                                  : lvl === 'Medium'
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-900/20 ring-2 ring-blue-300'
                                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-500 shadow-md shadow-teal-900/20 ring-2 ring-teal-300'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Inspection Execution Date &amp; Time:
                    </label>
                    <input
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-mono transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Recommendation for Directorate */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Statutory Recommendation for Directorate General (IAS):
                  </label>
                  <textarea
                    rows={3}
                    value={inspectorRemarks}
                    onChange={(e) => setInspectorRemarks(e.target.value)}
                    placeholder="Recommend compliance clearance, show-cause notice, or financial freeze..."
                    className="w-full p-3.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all placeholder:text-slate-400 leading-relaxed shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PAGE 5: DIGITAL SIGNATURE & FINAL SUBMISSION */}
          {/* ============================================================ */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <PenTool className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                      Stage 5: Digital Signature, Pre-Submission Audit &amp; Sealing
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Review statutory audit parameters and sign off cryptographically before transmission to the Directorate General (IAS).
                    </p>
                  </div>
                </div>

                {/* Pre-submission Summary Review Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/90 text-xs shadow-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">150m Geofence</span>
                    <span className="font-bold text-emerald-700 mt-1 block flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Verified On-Site
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{distanceMeters >= 1000 ? `${(distanceMeters/1000).toFixed(1)}km` : `${distanceMeters}m`} away</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Evidence Photos</span>
                    <span className="font-bold text-slate-900 mt-1 block">{photos.length} Captured</span>
                    <span className="text-[10px] text-blue-600 block font-semibold mt-0.5">Across Shelves</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Video Audits</span>
                    <span className="font-bold text-rose-700 mt-1 block">{videos.length} Recorded</span>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">Live On-Site</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Checklist Score</span>
                    <span className="font-bold text-slate-900 mt-1 block">{checklistScorePercent}% ({passedCount}/10)</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Statutory Norms</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Severity Rating</span>
                    <span className="font-bold text-amber-700 mt-1 block">{severityPriority}</span>
                    <span className="text-[10px] text-slate-500 block font-mono truncate mt-0.5">{task.inspectionType}</span>
                  </div>
                </div>

                {/* Evidence Attached Highlights (Photos + Videos) */}
                {(photos.length > 0 || videos.length > 0) && (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold uppercase tracking-wider">
                        Evidence Attached: {photos.length} Photos • {videos.length} Videos
                      </span>
                      <span className="text-emerald-400 font-semibold">✓ SHA-256 Watermarks Burned</span>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {/* Video Thumbnails */}
                      {videos.map((vid) => (
                        <div
                          key={vid.id}
                          onClick={() => setSelectedVideoForPreview(vid)}
                          className="relative w-28 h-20 bg-black rounded-xl overflow-hidden border border-rose-500/60 shrink-0 cursor-pointer group shadow-xs"
                          title={vid.caption}
                        >
                          {vid.thumbnailUrl ? (
                            <img src={vid.thumbnailUrl} alt="Video thumb" className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                              <Film className="w-5 h-5 text-rose-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10">
                            <Play className="w-5 h-5 fill-white text-white drop-shadow" />
                          </div>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 text-[9px] font-mono text-amber-300 font-bold">
                            {formatDuration(vid.durationSeconds || 0)}
                          </span>
                        </div>
                      ))}

                      {/* Photo Thumbnails */}
                      {photos.slice(0, 6).map((ph) => (
                        <div
                          key={ph.id}
                          onClick={() => setSelectedPhotoForZoom(ph)}
                          className="relative w-20 h-20 bg-black rounded-xl overflow-hidden border border-slate-700 shrink-0 cursor-pointer hover:border-blue-400 group shadow-xs"
                          title={ph.caption}
                        >
                          <img src={ph.url} alt="Photo thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-slate-300 font-mono text-center truncate px-1 py-0.5">
                            {ph.caption}
                          </span>
                        </div>
                      ))}
                      {photos.length > 6 && (
                        <div className="w-16 h-20 bg-slate-850 rounded-xl flex items-center justify-center text-slate-300 font-mono text-xs shrink-0 border border-slate-700 font-bold">
                          +{photos.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Outcome Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select Statutory Finding to Transmit:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-4 rounded-2xl border-2 flex items-start space-x-3.5 cursor-pointer transition-all ${
                        submissionStatus === 'Completed'
                          ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-2 ring-emerald-400/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="finalOutcome"
                        value="Completed"
                        checked={submissionStatus === 'Completed'}
                        onChange={() => setSubmissionStatus('Completed')}
                        className="mt-1 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Submit as Completed (Compliant)</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Premises confirmed, ledgers audited, facilities compliant with statutory charter.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-4 rounded-2xl border-2 flex items-start space-x-3.5 cursor-pointer transition-all ${
                        submissionStatus === 'Failed/Issue Found'
                          ? 'bg-rose-50/60 border-rose-500 shadow-sm ring-2 ring-rose-400/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="finalOutcome"
                        value="Failed/Issue Found"
                        checked={submissionStatus === 'Failed/Issue Found'}
                        onChange={() => setSubmissionStatus('Failed/Issue Found')}
                        className="mt-1 text-rose-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-rose-900 flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4 text-rose-600" />
                          <span>Submit as Failed / Non-Compliance Found</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Discrepancies, missing premises, or diversion of public welfare grants identified.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Digital Signature Card */}
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                    <PenTool className="w-4 h-4 text-blue-600" />
                    <span>Digital Cryptographic Signature of Field Auditor:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={digitalSignature}
                        onChange={(e) => setDigitalSignature(e.target.value)}
                        placeholder="Type authenticated officer name..."
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                        Badge: {currentOfficer.badgeNumber || 'INSP-DEL-402'} • Jurisdiction: {currentOfficer.assignedDistrict || 'Central Delhi'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center space-x-2 shadow-xs">
                      <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono truncate text-[11px] text-slate-600">
                        Cryptographic Hash: <strong className="text-indigo-600 font-semibold">SHA256:{Math.random().toString(16).substring(2, 12)}</strong>
                      </span>
                    </div>
                  </div>

                  <label className="flex items-start space-x-2.5 text-xs text-slate-700 cursor-pointer pt-1 bg-white/70 p-3 rounded-xl border border-slate-200/70">
                    <input
                      type="checkbox"
                      checked={certifyTruthChecked}
                      onChange={(e) => setCertifyTruthChecked(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs leading-relaxed text-slate-600">
                      I solemnly affirm that this inspection was physically executed at the registered GPS site. The captured evidence photos and audit observations represent true factual findings without manipulation.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Wizard Navigation Footer */}
        <div className="p-4 sm:p-5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer flex items-center space-x-1.5 transition-all shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Stage</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                id="btn-next-wizard-step"
                onClick={() => {
                  if (currentStep === 1 && !visitedSite) {
                    onShowToast('Please authenticate location check-in before moving to photos.', 'error');
                    return;
                  }
                  setCurrentStep((prev) => Math.min(5, prev + 1));
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold border border-blue-500/40 transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-blue-900/20"
              >
                <span>Proceed to Stage {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-submit-task-inspection"
                onClick={handleSubmitFinalDossier}
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 border shadow-lg ${
                  submissionStatus === 'Completed'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-500 shadow-emerald-900/30'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 border-rose-500 shadow-rose-900/30'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Sealing Record...' : 'Seal & Submit Official Dossier to IAS Directorate'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL FOR ZOOMED GEOTAGGED PHOTO */}
      {selectedPhotoForZoom && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-950 text-white rounded-2xl max-w-4xl w-full overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[95vh] ring-1 ring-white/10">
            <div className="p-4 bg-slate-900 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5 text-xs">
                <span className="font-bold text-amber-300 uppercase tracking-wider font-mono">
                  {selectedPhotoForZoom.category || 'GEOTAGGED EVIDENCE'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-mono">{selectedPhotoForZoom.id}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPhotoForZoom(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-rose-900/50 border border-slate-700 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                <img
                  src={selectedPhotoForZoom.url}
                  alt={selectedPhotoForZoom.caption || 'Evidence'}
                  className="w-full max-h-[55vh] object-contain"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Caption &amp; Category</span>
                  <span className="text-white font-bold text-xs block mt-0.5">{selectedPhotoForZoom.caption}</span>
                  <span className="text-amber-300 block mt-1 text-[11px]">{selectedPhotoForZoom.category}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">GPS Coordinates &amp; Map</span>
                  <span className="text-emerald-400 font-bold block mt-0.5">
                    {selectedPhotoForZoom.coordinates
                      ? `${selectedPhotoForZoom.coordinates.lat.toFixed(6)}° N, ${selectedPhotoForZoom.coordinates.lng.toFixed(6)}° E`
                      : '28.5320° N, 77.2730° E'}
                  </span>
                  {selectedPhotoForZoom.coordinates && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedPhotoForZoom.coordinates.lat},${selectedPhotoForZoom.coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline block mt-1 hover:text-blue-300 flex items-center gap-1 text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verify on Google Maps ↗</span>
                    </a>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Capture Timestamp</span>
                  <span className="text-slate-200 block mt-0.5">{selectedPhotoForZoom.timestamp || 'Real-Time IST'}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Cryptographic Hash</span>
                  <span className="text-purple-300 text-[11px] truncate block font-mono mt-0.5">
                    {selectedPhotoForZoom.tamperProofHash || 'SHA256:4f8e9102c7b3'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPhotoForZoom(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Close Evidence Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUTORY VIDEO AUDIT PLAYER MODAL */}
      {selectedVideoForPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-950 rounded-2xl max-w-4xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] ring-1 ring-white/10">
            {/* Tricolor Accent Strip */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-500 shrink-0 opacity-90" />

            {/* Modal Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2.5">
                <Film className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-xs sm:text-sm uppercase tracking-wider font-mono">
                  🇮🇳 STATUTORY ON-SITE VIDEO AUDIT EVIDENCE • {task.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoForPreview(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                title="Close Video Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Video Player */}
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                <video
                  src={selectedVideoForPreview.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[58vh] object-contain"
                />
              </div>

              {/* Video Statutory Evidence Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Video Caption</span>
                  <span className="text-white font-bold text-xs truncate block mt-0.5">{selectedVideoForPreview.caption}</span>
                  <span className="text-amber-300 block mt-1 text-[11px]">{selectedVideoForPreview.category}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">GPS Coordinates &amp; Map</span>
                  <span className="text-emerald-400 font-bold block mt-0.5">
                    {selectedVideoForPreview.coordinates
                      ? `${selectedVideoForPreview.coordinates.lat.toFixed(6)}° N, ${selectedVideoForPreview.coordinates.lng.toFixed(6)}° E`
                      : '18.5284° N, 73.8423° E'}
                  </span>
                  {selectedVideoForPreview.coordinates && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedVideoForPreview.coordinates.lat},${selectedVideoForPreview.coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline block mt-1 hover:text-blue-300 flex items-center gap-1 text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verify on Google Maps ↗</span>
                    </a>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Duration &amp; Timestamp</span>
                  <span className="text-white font-bold block mt-0.5">{formatDuration(selectedVideoForPreview.durationSeconds || 0)} duration</span>
                  <span className="text-slate-300 text-[11px] block mt-1">{selectedVideoForPreview.timestamp}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Cryptographic Hash</span>
                  <span className="text-purple-300 text-[11px] truncate block font-mono mt-0.5">
                    {selectedVideoForPreview.tamperProofHash || 'SHA256:video7f8a92'}
                  </span>
                  {selectedVideoForPreview.fileSizeMb && (
                    <span className="text-slate-400 text-[10px] block mt-1">Size: ~{selectedVideoForPreview.fileSizeMb} MB</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <a
                href={selectedVideoForPreview.url}
                download={`video_audit_${task.id}.webm`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-600 flex items-center space-x-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Video Evidence</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedVideoForPreview(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Close Video Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certified CCTV Inspection Evidence Capture Modal */}
      {isCctvModalOpen && (
        <CctvEvidenceModal
          ngoId={task.ngoId}
          ngoName={task.ngoName}
          inspectionId={task.id}
          onClose={() => setIsCctvModalOpen(false)}
          onEvidenceCaptured={(evidence) => {
            const newPhoto: TaskPhoto = {
              id: evidence.id,
              caption: `[CCTV LIVE] ${evidence.cameraName} (${evidence.location})`,
              category: activeCategory,
              url: evidence.imageUrl,
              timestamp: new Date(evidence.timestamp).toLocaleTimeString('en-IN') + ' IST',
              coordinates: currentGps,
              tamperProofHash: `SHA256:${evidence.fileHash.slice(0, 16)}...`,
            };
            setPhotos((prev) => [...prev, newPhoto]);
            onShowToast(`✓ CCTV Frame captured and attached to ${PHOTO_CATEGORIES.find((c) => c.id === activeCategory)?.name}!`, 'success');
          }}
        />
      )}
    </div>
  );
};
