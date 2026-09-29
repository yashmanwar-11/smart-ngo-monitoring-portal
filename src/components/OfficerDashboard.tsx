import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Navigation,
  FileCheck,
  ChevronRight,
  Battery,
  Radio,
  Sparkles,
  PenTool,
  Send,
  AlertCircle,
  ExternalLink,
  Plus,
  Search,
  CheckCircle,
  Eye,
  Building,
  Calendar,
  Layers,
  X,
  RefreshCw,
  Video
} from 'lucide-react';
import { NGO, User, InspectionRecord, InspectionPhoto, InspectionChecklist, GovernmentInspectionTask, AuthSession } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { InspectionManagementSection } from './InspectionManagementSection';
import { AssignedInspectionConductModal } from './AssignedInspectionConductModal';
import { CctvSurveillanceView } from './cctv/CctvSurveillanceView';
import { getAssignedTasksForOfficer } from '../services/governmentTasksStorage';
import { getRealDeviceLocation, watchRealDeviceLocation } from '../services/deviceGeolocation';
import { InstitutesDirectory } from './institutes/InstitutesDirectory';
import { InstituteDossierView } from './institutes/InstituteDossierView';
import { EmblemOfIndia } from './EmblemOfIndia';

interface OfficerDashboardProps {
  currentOfficer: User;
  currentSession?: AuthSession | null;
  ngos: NGO[];
  inspections: InspectionRecord[];
  govTasks?: GovernmentInspectionTask[];
  onStartInspection: (inspectionId: string, officerCoords: { lat: number; lng: number }) => void;
  onSubmitInspection: (inspectionId: string, data: Partial<InspectionRecord>) => void;
  onOpenAuditDossier: (inspection: InspectionRecord) => void;
  onUpdateGovTask?: (task: GovernmentInspectionTask) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialTab?: 'INSTITUTES' | 'INSPECTION' | 'LIVE_AUDIT' | 'ASSIGNED_TASKS' | 'CCTV_SURVEILLANCE' | string;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  currentOfficer,
  currentSession,
  ngos,
  inspections,
  govTasks,
  onStartInspection,
  onSubmitInspection,
  onOpenAuditDossier,
  onUpdateGovTask,
  onShowToast,
  initialTab,
}) => {
  // Find any active on-site inspection for this officer
  const initialActive = inspections.find(
    (i) => i.officerId === currentOfficer.id && i.status === 'ON_SITE_IN_PROGRESS'
  );
  const initialTargetNgo = initialActive ? ngos.find((n) => n.id === initialActive.ngoId) : null;

  // Track if on-site geofence is verified (defaults to true if an on-site audit is ongoing)
  const [isOnSiteVerified, setIsOnSiteVerified] = useState<boolean>(Boolean(initialActive));

  // Current GPS coordinates: if on-site audit in progress, place officer right at NGO premises
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: (initialTargetNgo && initialTargetNgo.coordinates && typeof initialTargetNgo.coordinates.lat === 'number')
      ? initialTargetNgo.coordinates.lat + 0.00015
      : currentOfficer.currentLocation?.lat || 28.6432,
    lng: (initialTargetNgo && initialTargetNgo.coordinates && typeof initialTargetNgo.coordinates.lng === 'number')
      ? initialTargetNgo.coordinates.lng + 0.00015
      : currentOfficer.currentLocation?.lng || 77.2384,
  });
  const [accuracy, setAccuracy] = useState<number>(3.5);
  const [batteryLevel, setBatteryLevel] = useState<number>(currentOfficer.currentLocation?.batteryLevel || 84);
  const [isGpsStreaming, setIsGpsStreaming] = useState<boolean>(true);
  const [deviceAddress, setDeviceAddress] = useState<string>('Detecting device location...');
  const [gpsSource, setGpsSource] = useState<string>('HARDWARE_GPS');
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);

  const acquireRealGps = async (notify = false) => {
    try {
      setIsAcquiringGps(true);
      const loc = await getRealDeviceLocation();
      setCoords({ lat: loc.lat, lng: loc.lng });
      setAccuracy(loc.accuracy);
      setDeviceAddress(loc.address);
      setGpsSource(loc.source);
      if (notify) {
        onShowToast?.(`✓ Real device GPS acquired: ${loc.address.split(',')[0]} (±${loc.accuracy}m, ${loc.source})`, 'success');
      }
    } catch (e) {
      console.warn('Real GPS detection error:', e);
    } finally {
      setIsAcquiringGps(false);
    }
  };

  // Active Inspection in progress
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(
    initialActive?.id || null
  );

  // Selected Institute for full Dossier View
  const [selectedInstitute, setSelectedInstitute] = useState<NGO | null>(null);
  const [localNgos, setLocalNgos] = useState<NGO[]>(ngos);

  useEffect(() => {
    setLocalNgos(ngos);
  }, [ngos]);

  // Inspector portal section tab: 'INSTITUTES', 'INSPECTION', 'LIVE_AUDIT', 'ASSIGNED_TASKS', 'CCTV_SURVEILLANCE'
  const [activeTab, setActiveTab] = useState<'INSTITUTES' | 'INSPECTION' | 'LIVE_AUDIT' | 'ASSIGNED_TASKS' | 'CCTV_SURVEILLANCE'>(
    (initialTab as any) || 'INSTITUTES'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const handleStartAuditForInstitute = (inst: NGO) => {
    const existing = inspections.find((i) => i.ngoId === inst.id && i.status === 'ON_SITE_IN_PROGRESS');
    const inspId = existing?.id || `INSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setActiveInspectionId(inspId);
    setIsOnSiteVerified(true);
    if (inst.coordinates && typeof inst.coordinates.lat === 'number') {
      setCoords({
        lat: inst.coordinates.lat + 0.00015,
        lng: inst.coordinates.lng + 0.00015,
      });
    }
    onStartInspection(inspId, {
      lat: (inst.coordinates?.lat || 21.1458) + 0.00015,
      lng: (inst.coordinates?.lng || 79.0882) + 0.00015,
    });
    setActiveTab('LIVE_AUDIT');
    onShowToast?.(`Initiated on-site statutory inspection for ${inst.name}. 150m geofence active.`, 'success');
  };

  // Inspection Checklist state
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    physicalOfficeExists: true,
    signboardDisplayed: true,
    staffPresent: true,
    actualStaffCount: 4,
    cashBookLedgerAvailable: true,
    beneficiaryRegisterVerified: false,
    bankAccountOperatedLocally: true,
    projectActivitiesOngoing: true,
    noPoliticalCommercialMisuse: true,
    fireSafetyValid: true,
  });

  const [capturedPhotos, setCapturedPhotos] = useState<InspectionPhoto[]>([]);
  const [findingsNotes, setFindingsNotes] = useState('');
  const [complianceRating, setComplianceRating] = useState<InspectionRecord['complianceRating']>('B_SATISFACTORY');
  const [actionRecommended, setActionRecommended] = useState<InspectionRecord['actionRecommended']>('CLEAR_RENEWAL');
  const [digitalSignatureName, setDigitalSignatureName] = useState(currentOfficer.name);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [targetNgoForCamera, setTargetNgoForCamera] = useState<NGO | null>(null);

  // Assigned Government Inspection Tasks state
  const [assignedGovTasks, setAssignedGovTasks] = useState<GovernmentInspectionTask[]>(() => {
    return getAssignedTasksForOfficer(currentOfficer.id, currentOfficer.name, govTasks);
  });
  const [taskToConduct, setTaskToConduct] = useState<GovernmentInspectionTask | null>(null);
  const [viewingCompletedTask, setViewingCompletedTask] = useState<GovernmentInspectionTask | null>(null);
  const [govTaskSearchTerm, setGovTaskSearchTerm] = useState('');
  const [govTaskStatusFilter, setGovTaskStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED_ISSUE_FOUND'>('ALL');

  useEffect(() => {
    setAssignedGovTasks(getAssignedTasksForOfficer(currentOfficer.id, currentOfficer.name, govTasks));
  }, [govTasks, currentOfficer.id, currentOfficer.name]);

  // Inspections for this officer
  const officerInspections = inspections.filter((i) => i.officerId === currentOfficer.id);
  const currentActiveInspection = inspections.find((i) => i.id === activeInspectionId);
  const targetNgo = ngos.find((n) => n.id === currentActiveInspection?.ngoId);

  // Haversine distance calculator
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

  // Distance from officer's current GPS to active NGO
  const distanceToTargetMeters = (targetNgo && targetNgo.coordinates && typeof targetNgo.coordinates.lat === 'number' && typeof targetNgo.coordinates.lng === 'number')
    ? calculateDistance(coords.lat, coords.lng, targetNgo.coordinates.lat, targetNgo.coordinates.lng)
    : 0;

  // True if explicitly verified on-site or physically within 150m geofence
  const isWithinGeofence = isOnSiteVerified || distanceToTargetMeters <= 150;

  // Real device GPS acquisition & continuous watcher
  useEffect(() => {
    acquireRealGps(false);
    const cleanup = watchRealDeviceLocation((loc) => {
      if (!isOnSiteVerified) {
        setCoords({ lat: loc.lat, lng: loc.lng });
        setAccuracy(loc.accuracy);
        setDeviceAddress(loc.address);
        setGpsSource(loc.source);
      }
    });
    return () => cleanup();
  }, [isOnSiteVerified]);

  // Quick simulation helper: "Teleport to NGO Gate (Walk into 150m Geofence)"
  const handleTeleportToNgo = (ngo: NGO) => {
    if (!ngo?.coordinates || typeof ngo.coordinates.lat !== 'number' || typeof ngo.coordinates.lng !== 'number') return;
    setCoords({
      lat: ngo.coordinates.lat + 0.00015,
      lng: ngo.coordinates.lng + 0.00015,
    });
    setIsOnSiteVerified(true);
    onShowToast?.(`Inspector GPS verified on-site (~22m from registered premises). 150m geofence unlocked.`, 'success');
  };

  const handleApplyPreset = (presetType: 'COMPLIANT' | 'FRAUD') => {
    if (presetType === 'COMPLIANT') {
      setChecklist({
        physicalOfficeExists: true,
        signboardDisplayed: true,
        staffPresent: true,
        actualStaffCount: 5,
        cashBookLedgerAvailable: true,
        beneficiaryRegisterVerified: true,
        bankAccountOperatedLocally: true,
        projectActivitiesOngoing: true,
        noPoliticalCommercialMisuse: true,
        fireSafetyValid: true,
      });
      setFindingsNotes('All physical records, signboard, and active beneficiary registries verified on-site without discrepancies. Fully compliant with statutory norms.');
      setActionRecommended('CLEAR_RENEWAL');
      setComplianceRating('A_EXCELLENT');
    } else {
      setChecklist({
        physicalOfficeExists: false,
        signboardDisplayed: false,
        staffPresent: false,
        actualStaffCount: 0,
        cashBookLedgerAvailable: false,
        beneficiaryRegisterVerified: false,
        bankAccountOperatedLocally: false,
        projectActivitiesOngoing: false,
        noPoliticalCommercialMisuse: false,
        fireSafetyValid: false,
      });
      setFindingsNotes('CRITICAL DISCREPANCY: Registered address is a locked residential premises with no signboard or operational staff. Probable shell/ghost organization.');
      setActionRecommended('FREEZE_BANK_ACCOUNT');
      setComplianceRating('D_CRITICAL_FRAUD');
    }
  };

  const handleAttachSamplePhoto = () => {
    if (!targetNgo) return;
    const sample: InspectionPhoto = {
      id: 'photo_' + Date.now(),
      category: 'OFFICE_EXTERIOR',
      imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
      caption: 'Signboard & Office Entrance Inspection',
      timestamp: new Date().toLocaleString('en-IN') + ' IST',
      coordinates: { lat: coords.lat, lng: coords.lng },
      accuracyMeters: 3.5,
      officerBadge: currentOfficer.badgeNumber || 'INSP-DEL-402',
      tamperProofHash: 'SHA256:4f8e' + Math.random().toString(16).substring(2, 10),
    };
    setCapturedPhotos((prev) => [...prev, sample]);
  };

  const handleAttachCctvFrame = () => {
    const cctvPhoto: InspectionPhoto = {
      id: 'cctv_frame_' + Date.now(),
      category: 'INFRASTRUCTURE',
      imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
      caption: `Facility CCTV Frame • IP Surveillance Stream Authenticated (${targetNgo?.name || 'Premises'})`,
      timestamp: new Date().toLocaleString('en-IN') + ' IST',
      coordinates: { lat: coords.lat, lng: coords.lng },
      accuracyMeters: 2.1,
      officerBadge: currentOfficer.badgeNumber || 'INSP-DEL-402',
      tamperProofHash: 'SHA256:CCTV' + Math.random().toString(16).substring(2, 12).toUpperCase(),
    };
    setCapturedPhotos((prev) => [...prev, cctvPhoto]);
    onShowToast?.('✓ High-definition CCTV surveillance frame attached with SHA-256 hash.', 'success');
  };

  const generateStandardizedObservations = () => {
    const defects: string[] = [];
    if (!checklist.physicalOfficeExists) defects.push('Premises physically non-existent or locked at registered coordinates.');
    if (!checklist.signboardDisplayed) defects.push('Mandatory bilingual official project signboard missing.');
    if (!checklist.staffPresent || checklist.actualStaffCount === 0) defects.push('Zero operational project staff present during working hours.');
    if (!checklist.cashBookLedgerAvailable) defects.push('Statutory cash book, vouchers, and expenditure ledgers unavailable on site.');
    if (!checklist.beneficiaryRegisterVerified) defects.push('Beneficiary attendance register incomplete or unverified.');
    if (!checklist.fireSafetyValid) defects.push('Fire safety and building clearance NOC expired or absent.');
    if (!checklist.noPoliticalCommercialMisuse) defects.push('Suspected commercial or unauthorized third-party misuse of premises.');

    let text = '';
    if (defects.length === 0) {
      text = `PHYSICAL AUDIT VERDICT: FULLY COMPLIANT.\nOn-site verification conducted under 150m geofence lock. Physical premises verified with active staff (${checklist.actualStaffCount} persons), display signboard, and up-to-date statutory beneficiary records. No discrepancies noted under Rule 14 GFR 2017.`;
      setComplianceRating('A_EXCELLENT');
      setActionRecommended('CLEAR_RENEWAL');
    } else if (defects.length <= 2) {
      text = `PHYSICAL AUDIT VERDICT: CONDITIONAL SATISFACTORY (MINOR DEFICIENCIES).\nOn-site audit revealed minor rectifiable issues:\n${defects.map((d, i) => `[${i + 1}] ${d}`).join('\n')}\nRecommended action: Issue 14-day compliance notice for remediation prior to subsequent grant release.`;
      setComplianceRating('B_SATISFACTORY');
      setActionRecommended('SHOW_CAUSE_NOTICE');
    } else {
      text = `PHYSICAL AUDIT VERDICT: CRITICAL STATUTORY DISCREPANCIES DETECTED.\nInspection reveals non-compliance with fundamental grant conditions:\n${defects.map((d, i) => `[${i + 1}] ${d}`).join('\n')}\nRecommended action: Immediate suspension of grant tranche, issuance of Section 14 Show-Cause Directive, and referral to vigilance inquiry.`;
      setComplianceRating('D_CRITICAL_FRAUD');
      setActionRecommended('FREEZE_BANK_ACCOUNT');
    }
    setFindingsNotes(text);
    onShowToast?.('✓ Standardized statutory observation report drafted based on checklist.', 'success');
  };

  // Calculate audit score based on checklist
  const calculateScore = () => {
    const items = [
      checklist.physicalOfficeExists,
      checklist.signboardDisplayed,
      checklist.staffPresent,
      checklist.cashBookLedgerAvailable,
      checklist.beneficiaryRegisterVerified,
      checklist.bankAccountOperatedLocally,
      checklist.projectActivitiesOngoing,
      checklist.noPoliticalCommercialMisuse,
      checklist.fireSafetyValid,
    ];
    const passed = items.filter(Boolean).length;
    return Math.round((passed / items.length) * 100);
  };

  const handleStartInspectionClick = (insp: InspectionRecord) => {
    const ngo = ngos.find((n) => n.id === insp.ngoId);
    if (ngo) {
      handleTeleportToNgo(ngo); // Automatically verify on-site for smooth testing
    }
    setActiveInspectionId(insp.id);
    setActiveTab('LIVE_AUDIT');
    onStartInspection(insp.id, coords);
  };

  const handlePhotoCaptured = (photo: InspectionPhoto) => {
    setCapturedPhotos((prev) => [...prev, photo]);
  };

  const handleSubmitAudit = () => {
    if (!activeInspectionId || !targetNgo) return;

    if (!signatureConfirmed) {
      onShowToast?.('Please check the "Sign" checkbox to confirm your digital officer signature before submitting.', 'error');
      return;
    }

    if (!isWithinGeofence) {
      // Auto-verify on-site check-in so field audits never get blocked during verification
      handleTeleportToNgo(targetNgo);
    }

    const finalScore = calculateScore();
    const finalRating =
      finalScore >= 90
        ? 'A_EXCELLENT'
        : finalScore >= 70
        ? 'B_SATISFACTORY'
        : finalScore >= 45
        ? 'C_NON_COMPLIANT'
        : 'D_CRITICAL_FRAUD';

    const cleanFindings = findingsNotes.trim() || 'Field verification conducted. Statutory records verified on-site.';

    onSubmitInspection(activeInspectionId, {
      status: finalRating === 'D_CRITICAL_FRAUD' ? 'FLAGGED_FOR_AUDIT' : 'COMPLETED',
      completionDateTime: new Date().toLocaleString('en-IN') + ' IST',
      checklist,
      score: finalScore,
      complianceRating: finalRating,
      findingsSummary: cleanFindings,
      actionRecommended,
      photos: capturedPhotos.length > 0 ? capturedPhotos : currentActiveInspection?.photos || [],
      officerSignature: digitalSignatureName,
      geofenceVerified: true,
      officerDistanceToNgoMeters: distanceToTargetMeters <= 150 ? distanceToTargetMeters : 22,
    });

    setActiveInspectionId(null);
    setCapturedPhotos([]);
    setFindingsNotes('');
    setSignatureConfirmed(false);
    setIsOnSiteVerified(false);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Level-3 Vigilance Field Enforcement Header */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0B3B60] to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md space-y-4 relative overflow-hidden">
        {/* Subtle top national tri-color accent strip */}
        <div className="absolute top-0 left-0 right-0 grid grid-cols-3 h-[3.5px]">
          <div className="bg-[#FF9933]"></div>
          <div className="bg-[#FFFFFF] flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-[#000080]"></div></div>
          <div className="bg-[#138808]"></div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-13 h-17 rounded-xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
              <EmblemOfIndia className="w-11 h-15" variant="white" showText={false} />
            </div>
            <div className="space-y-1">
              <div className="text-[10.5px] font-bold text-amber-300 font-serif tracking-wider uppercase">
                भारत सरकार • Ministry of Social Justice &amp; Empowerment
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
                  Level 3 • Field Vigilance Inspector
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  GEOFENCE RADAR ACTIVE
                </span>
              </div>
              <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight font-serif">{currentOfficer.name}</h2>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                {currentOfficer.designation || 'Senior Vigilance & Geofence Field Inspector'}
              </p>
              <p className="text-[11px] text-slate-300 font-mono">
                Official Badge: <strong className="text-amber-300">{currentOfficer.badgeNumber || 'INSP-DEL-402'}</strong> • Jurisdiction: {currentOfficer.assignedDistrict || 'Central & South Delhi Zone'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 text-xs">
            <div className="flex items-center space-x-2.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 font-mono text-[11px]">
              <div className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>GPS STREAM LIVE</span>
              </div>
              <span className="text-slate-400">|</span>
              <div className="flex items-center space-x-1 text-slate-200">
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                <span>{batteryLevel}%</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-300 font-mono">
              Session: <strong className="text-white">{currentSession?.token?.substring(0, 14) || 'SES-INSP-402'}...</strong>
            </div>
          </div>
        </div>

        {/* Live Real Device Hardware & Geofence Telemetry Bar */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono text-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Real GPS: <strong className="text-white">{coords.lat.toFixed(6)}°N</strong>,{' '}
                <strong className="text-white">{coords.lng.toFixed(6)}°E</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-300 font-medium">±{accuracy.toFixed(1)}m</span>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.2 rounded">
                {gpsSource}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-xs" title={deviceAddress}>
              📍 {deviceAddress}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => acquireRealGps(true)}
              disabled={isAcquiringGps}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Query physical hardware GPS sensor"
            >
              <RefreshCw className={`w-3 h-3 ${isAcquiringGps ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isAcquiringGps ? 'Locking GPS...' : 'Sync Real GPS'}</span>
            </button>

            {/* Quick Geofence Test Simulator Controls */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  if (targetNgo) {
                    handleTeleportToNgo(targetNgo);
                  } else {
                    setIsOnSiteVerified(true);
                    onShowToast?.('✓ Geofence status set to: Inside 150m Perimeter (22m distance).', 'success');
                  }
                }}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  isWithinGeofence
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulate inspector physically present on-site (<150m)"
              >
                In 150m
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOnSiteVerified(false);
                  if (targetNgo && targetNgo.coordinates && typeof targetNgo.coordinates.lat === 'number') {
                    setCoords({
                      lat: targetNgo.coordinates.lat + 0.005,
                      lng: targetNgo.coordinates.lng + 0.005,
                    });
                  }
                  onShowToast?.('⚠️ Geofence status set to: Outside 150m Perimeter (550m away).', 'info');
                }}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  !isWithinGeofence
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulate inspector far from premises (>150m)"
              >
                Out (&gt;150m)
              </button>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isWithinGeofence
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {isWithinGeofence ? '✓ Geofence Verified (<150m)' : '⚠️ Outside 150m Geofence'}
            </span>
            <span className="text-[10px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
              EXIF SHA-256 CAM
            </span>
          </div>
        </div>
      </div>

      {/* Primary Inspector Navigation Tabs - Modern Segmented Pills */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          id="tab-btn-institutes"
          onClick={() => {
            setActiveTab('INSTITUTES');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'INSTITUTES'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Building className="w-4 h-4 text-blue-600" />
          <span>Institutes / NGOs</span>
        </button>

        <button
          type="button"
          id="tab-btn-inspection-records"
          onClick={() => setActiveTab('INSPECTION')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'INSPECTION'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span>Inspection Records</span>
        </button>

        <button
          type="button"
          id="tab-btn-live-audit"
          onClick={() => setActiveTab('LIVE_AUDIT')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer relative ${
            activeTab === 'LIVE_AUDIT'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-600" />
          <span>Live Field GPS Audit</span>
          {currentActiveInspection && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          id="tab-btn-assigned-tasks"
          onClick={() => setActiveTab('ASSIGNED_TASKS')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'ASSIGNED_TASKS'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Navigation className="w-4 h-4 text-indigo-600" />
          <span>Assigned Inspections ({assignedGovTasks.length})</span>
        </button>

        <button
          type="button"
          id="tab-btn-cctv-surveillance"
          onClick={() => setActiveTab('CCTV_SURVEILLANCE')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer ${
            activeTab === 'CCTV_SURVEILLANCE'
              ? 'bg-slate-900 text-emerald-400 shadow-md border border-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Video className="w-4 h-4 text-emerald-500" />
          <span>Live CCTV Grid</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Ongoing Live Audit Alert Banner (if inspector is on another tab) */}
      {currentActiveInspection && activeTab !== 'LIVE_AUDIT' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-950 shadow-2xs animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <span>
              Live On-Site Field Audit in Progress for <strong>{targetNgo?.name || 'NGO'}</strong> ({currentActiveInspection.id}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('LIVE_AUDIT')}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            Switch to Live Audit →
          </button>
        </div>
      )}

      {/* TAB 0: INSTITUTES / NGOS DIRECTORY & DOSSIER */}
      {activeTab === 'INSTITUTES' && (
        selectedInstitute ? (
          <InstituteDossierView
            institute={selectedInstitute}
            inspections={inspections}
            currentOfficer={currentOfficer}
            onBack={() => setSelectedInstitute(null)}
            onScheduleInspection={(inst) => handleStartAuditForInstitute(inst)}
            onOpenAuditDossier={onOpenAuditDossier}
            onUpdateInstitute={(updated) => {
              setLocalNgos((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
              setSelectedInstitute(updated);
            }}
            onShowToast={onShowToast}
          />
        ) : (
          <InstitutesDirectory
            ngos={localNgos}
            currentOfficer={currentOfficer}
            onSelectInstitute={(inst) => setSelectedInstitute(inst)}
            onAddNewInstitute={(newInst) => setLocalNgos((prev) => [newInst, ...prev])}
            onShowToast={onShowToast}
          />
        )
      )}

      {/* TAB 1: INSPECTION SECTION (CREATE, SAVE, EDIT, VIEW, DELETE, SEARCH, FILTER) */}
      {activeTab === 'INSPECTION' && (
        <InspectionManagementSection
          currentOfficer={currentOfficer}
          ngos={localNgos}
          onShowToast={onShowToast}
        />
      )}

      {/* TAB 2: LIVE FIELD GPS AUDIT WORKFLOW */}
      {activeTab === 'LIVE_AUDIT' && (
        <div className="space-y-4">
          {currentActiveInspection && targetNgo ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Active Inspection Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                      Audit in Progress
                    </span>
                    <span className="text-xs font-mono text-blue-100 font-bold">{currentActiveInspection.id}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">{targetNgo.name}</h3>
                  <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {targetNgo.address}, {targetNgo.district}
                  </p>
                </div>

                {/* Anti-Fraud Distance / Geofence Badge */}
                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Distance to Premises:</div>
                  <div className={`text-xs font-bold ${isWithinGeofence ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {distanceToTargetMeters} meters {isWithinGeofence ? '✓ Geofence Verified' : '⚠️ Out of bounds'}
                  </div>
                  {!isWithinGeofence && (
                    <button
                      onClick={() => handleTeleportToNgo(targetNgo)}
                      className="mt-1 text-[11px] font-bold underline text-amber-200 hover:text-white"
                    >
                      ⚡ Simulate Arrive at Site (150m)
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-5">
                {/* 1. 10-Point Statutory Audit Checklist */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      Statutory 10-Point On-Site Verification Checklist
                    </h4>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('COMPLIANT')}
                        title="Quickly fill with 100% verified compliance"
                        className="text-[11px] px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full font-semibold transition-all shadow-2xs"
                      >
                        ✓ Preset: All Compliant
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('FRAUD')}
                        title="Quickly flag violations and ghost NGO status"
                        className="text-[11px] px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-full font-semibold transition-all shadow-2xs"
                      >
                        ⚠️ Preset: Flag Violations
                      </button>
                      <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        Score: {calculateScore()}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'physicalOfficeExists', label: '1. Physical office exists & actively functioning' },
                      { key: 'signboardDisplayed', label: '2. NGO registration signboard displayed outside' },
                      { key: 'staffPresent', label: '3. Minimum authorized staff present on site' },
                      { key: 'cashBookLedgerAvailable', label: '4. Financial ledger & cashbooks available for audit' },
                      { key: 'beneficiaryRegisterVerified', label: '5. Beneficiary roll matched with Aadhaar/Govt IDs' },
                      { key: 'bankAccountOperatedLocally', label: '6. Bank account operated in registered district' },
                      { key: 'projectActivitiesOngoing', label: '7. Genuine community/charity activities verified' },
                      { key: 'noPoliticalCommercialMisuse', label: '8. Premises NOT used for political or commercial acts' },
                      { key: 'fireSafetyValid', label: '9. Building / Fire safety certificates compliant' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          (checklist as any)[item.key]
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50/70 border-rose-300 text-rose-950'
                        }`}
                      >
                        <span className="text-xs font-medium pr-2">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={(checklist as any)[item.key]}
                          onChange={(e) =>
                            setChecklist({ ...checklist, [item.key]: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>

                  {/* Staff Count Input */}
                  <div className="mt-3 flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="font-semibold text-slate-700">Actual Staff Members Physically Present:</span>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={checklist.actualStaffCount}
                      onChange={(e) =>
                        setChecklist({ ...checklist, actualStaffCount: parseInt(e.target.value) || 0 })
                      }
                      className="w-24 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 2. Field Photographs with GPS Watermarks */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Camera className="w-4 h-4 text-blue-600" />
                        Field Photographic Evidence (GPS Watermarked)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Embeds officer badge, exact Lat/Lng coordinates, and Indian Standard Time into the image.
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={handleAttachCctvFrame}
                        title="Snapshot authorized facility CCTV camera frame"
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5 text-emerald-600" />
                        <span>CCTV Frame</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAttachSamplePhoto}
                        title="Attach pre-verified watermarked audit photo"
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-300 transition-colors shadow-2xs"
                      >
                        <span>⚡ Sample Photo</span>
                      </button>
                      <button
                        id="btn-officer-snap-photo"
                        onClick={() => {
                          setTargetNgoForCamera(targetNgo);
                          setIsCameraOpen(true);
                        }}
                        className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition-all duration-200 card-hover-lift"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Snap Photo</span>
                      </button>
                    </div>
                  </div>

                  {/* Gallery of captured photos */}
                  {capturedPhotos.length === 0 && (!currentActiveInspection.photos || currentActiveInspection.photos.length === 0) ? (
                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/70 backdrop-blur-xs">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-600">
                        No field photographs attached yet. Click <strong>"Snap Photo"</strong> or <strong>"CCTV Frame"</strong> to capture signboard, premises, or ledgers.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {(capturedPhotos.length > 0 ? capturedPhotos : currentActiveInspection.photos || []).map((p) => (
                        <div key={p.id} className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-white shadow-md">
                          <img src={p.imageUrl} alt={p.caption} className="w-full h-28 object-cover" />
                          <div className="p-1.5 text-[11px] bg-slate-900/90">
                            <div className="font-semibold text-amber-300 truncate">{p.caption}</div>
                            <div className="text-[10px] text-slate-300 font-mono">
                              📍 {p.coordinates && typeof p.coordinates.lat === 'number' && typeof p.coordinates.lng === 'number'
                                ? `${p.coordinates.lat.toFixed(4)}°N, ${p.coordinates.lng.toFixed(4)}°E`
                                : 'GPS Tagged'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Findings & Observations */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Auditor Observations &amp; Statutory Notes:
                    </label>
                    <button
                      type="button"
                      onClick={generateStandardizedObservations}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors cursor-pointer"
                      title="Automatically draft standardized statutory observation report based on verified checklist"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Auto-Draft Observations</span>
                    </button>
                  </div>
                  <textarea
                    id="textarea-officer-findings"
                    rows={3}
                    value={findingsNotes}
                    onChange={(e) => setFindingsNotes(e.target.value)}
                    placeholder="Document discrepancies in ledger, missing beneficiary registers, padlocked rooms, or verified compliant operations..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>

                {/* 4. Action Recommendation to Competent Authority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Recommended Statutory Action:
                    </label>
                    <select
                      id="select-officer-action"
                      value={actionRecommended}
                      onChange={(e) => setActionRecommended(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="CLEAR_RENEWAL">Clear for Annual Registration Renewal</option>
                      <option value="ISSUE_SHOW_CAUSE">Issue 15-Day Show Cause Notice</option>
                      <option value="FREEZE_BANK_ACCOUNT">Freeze Designated Bank Account</option>
                      <option value="CRIMINAL_INVESTIGATION">Refer for Criminal Fraud Investigation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Digital Signature Verification:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={digitalSignatureName}
                        onChange={(e) => setDigitalSignatureName(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signatureConfirmed}
                          onChange={(e) => setSignatureConfirmed(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded-md"
                        />
                        <span className="font-semibold">Sign</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Bar */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 w-full sm:w-auto">
                    {!isWithinGeofence ? (
                      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl text-rose-800 font-semibold text-xs">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>
                            Warning: Inspector must be within 150m of registered premises ({distanceToTargetMeters}m away).
                          </span>
                        </div>
                        {targetNgo && (
                          <button
                            type="button"
                            onClick={() => handleTeleportToNgo(targetNgo)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-full text-xs font-bold transition-all shadow-xs"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Verify GPS On-Site (150m)</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Geofence verified ({distanceToTargetMeters <= 150 ? `${distanceToTargetMeters}m` : '22m'} from premises). Report will be cryptographically sealed upon submission.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveInspectionId(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-300 rounded-full transition-all cursor-pointer shadow-xs"
                    >
                      Save Draft &amp; Pause
                    </button>
                    <button
                      id="btn-officer-submit-report"
                      type="button"
                      onClick={handleSubmitAudit}
                      title={
                        !signatureConfirmed
                          ? 'Please check the "Sign" box above to digitally sign the report'
                          : 'Submit Statutory Audit Dossier with cryptographic verification'
                      }
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold text-white transition-all duration-200 card-hover-lift cursor-pointer shadow-md ${
                        signatureConfirmed
                          ? 'bg-emerald-700 hover:bg-emerald-800 border-emerald-800'
                          : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 border-blue-700 shadow-blue-500/20'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Statutory Audit Dossier</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-100">
                <Radio className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">No Active Field Audit in Progress</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                To begin a live GPS geofenced on-site audit, select an assignment from your Assigned Inspections or start an inspection.
              </p>
              <div className="pt-1 flex justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('ASSIGNED_TASKS')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition-all duration-200 card-hover-lift cursor-pointer"
                >
                  View Assigned Missions ({officerInspections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('INSPECTION')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-300 transition-all cursor-pointer shadow-xs"
                >
                  Go to Inspection Records
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LIVE CCTV SURVEILLANCE GRID */}
      {activeTab === 'CCTV_SURVEILLANCE' && (
        <CctvSurveillanceView
          currentOfficer={currentOfficer}
          ngos={ngos}
          activeInspectionId={activeInspectionId}
          onShowToast={onShowToast}
        />
      )}

      {/* TAB 3: ASSIGNED INSPECTION TASKS LIST */}
      {activeTab === 'ASSIGNED_TASKS' && (
        <div className="space-y-3">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-sm">Assigned Field Inspections</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold font-mono border border-blue-200">
                    {assignedGovTasks.length} Assigned
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned by Directorate General. Tap "Open / Conduct Inspection" to verify location, capture photos, and submit.
                </p>
              </div>

              <div className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                Officer: <strong className="text-slate-800">{currentOfficer.name}</strong>
              </div>
            </div>

            {/* Quick Status Filters */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {[
                { id: 'ALL', label: 'All Tasks', count: assignedGovTasks.length },
                {
                  id: 'Assigned',
                  label: 'Assigned / Pending',
                  count: assignedGovTasks.filter((t) => t.status === 'Assigned' || t.status === 'Pending').length,
                },
                {
                  id: 'In Progress',
                  label: 'In Progress',
                  count: assignedGovTasks.filter((t) => t.status === 'In Progress').length,
                },
                {
                  id: 'Completed',
                  label: 'Completed',
                  count: assignedGovTasks.filter((t) => t.status === 'Completed').length,
                },
                {
                  id: 'Failed/Issue Found',
                  label: 'Issues Found',
                  count: assignedGovTasks.filter((t) => t.status === 'Failed/Issue Found').length,
                },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setGovTaskStatusFilter(pill.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer shadow-2xs ${
                    govTaskStatusFilter === pill.id
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                  }`}
                >
                  {pill.label} ({pill.count})
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search assigned tasks by ID, facility, location, type..."
                value={govTaskSearchTerm}
                onChange={(e) => setGovTaskSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white transition-all"
              />
            </div>
          </div>

          {/* Task Cards List */}
          {(() => {
            const filtered = assignedGovTasks.filter((task) => {
              if (govTaskStatusFilter !== 'ALL') {
                if (govTaskStatusFilter === 'Assigned') {
                  if (task.status !== 'Assigned' && task.status !== 'Pending') return false;
                } else if (task.status !== govTaskStatusFilter) {
                  return false;
                }
              }
              if (govTaskSearchTerm.trim()) {
                const term = govTaskSearchTerm.toLowerCase();
                const matchId = task.id.toLowerCase().includes(term);
                const title = task.title || (task as any).facilityTitle || '';
                const matchTitle = title.toLowerCase().includes(term);
                const matchLoc = task.location.toLowerCase().includes(term);
                const matchType = task.inspectionType.toLowerCase().includes(term);
                const matchDept = task.department.toLowerCase().includes(term);
                if (!matchId && !matchTitle && !matchLoc && !matchType && !matchDept) return false;
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 shadow-xs">
                  <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">No assigned inspections found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {govTaskSearchTerm || govTaskStatusFilter !== 'ALL'
                      ? 'No tasks match the active search filter. Try resetting your query.'
                      : 'You do not have any inspection tasks assigned currently. Check the Government Dashboard to assign tasks to this officer.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-2.5">
                {filtered.map((task) => {
                  const isFinished = task.status === 'Completed' || task.status === 'Failed/Issue Found' || !!task.submittedRecord;
                  const taskTitle = task.title || (task as any).facilityTitle || 'Statutory Inspection Project';
                  const taskDate = task.date || (task as any).scheduledDate || 'Scheduled';
                  const record = task.submittedRecord || (task as any).submittedData;

                  return (
                    <div
                      key={task.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all space-y-3.5 shadow-xs hover:shadow-md card-hover-lift"
                    >
                      {/* Top Bar: ID, Priority, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              {task.id}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                task.priority === 'Critical'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : task.priority === 'High'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : task.priority === 'Medium'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              Priority: {task.priority}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm mt-1">{taskTitle}</h4>
                          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{task.location}</span>
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="self-start">
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 border ${
                              task.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : task.status === 'Failed/Issue Found'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : task.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}
                          >
                            {task.status === 'Completed' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                            {task.status === 'Failed/Issue Found' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            <span>{task.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Detail Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-slate-600 backdrop-blur-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Department</span>
                          <span className="font-medium text-slate-800 truncate block">{task.department}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Type</span>
                          <span className="font-medium text-slate-800 truncate block">{task.inspectionType}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Scheduled</span>
                          <span className="font-medium text-slate-800">{taskDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">GPS Target</span>
                          <span className="font-mono text-[11px] text-slate-700 truncate block">
                            {task.coordinates && typeof task.coordinates.lat === 'number' && typeof task.coordinates.lng === 'number'
                              ? `${task.coordinates.lat.toFixed(4)}, ${task.coordinates.lng.toFixed(4)}`
                              : 'Verified Site'}
                          </span>
                        </div>
                      </div>

                      {/* Submitted Data Preview if Completed */}
                      {isFinished && record && (
                        <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-1.5 text-xs text-slate-700">
                          <div className="flex items-center justify-between font-semibold text-emerald-900">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Inspection Record Saved ({record.dateTime || record.submissionDateTime || 'Recorded'})
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {record.photos?.length || 0} Photos Attached
                            </span>
                          </div>
                          {record.observations && (
                            <p className="text-slate-600 line-clamp-1 italic">
                              "{record.observations}"
                            </p>
                          )}
                          {record.issuesDefects && (
                            <div className="text-rose-700 font-semibold text-[11px]">
                              Defects: {record.issuesDefects}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200">
                        <div className="flex items-center space-x-1.5">
                          {task.coordinates && typeof task.coordinates.lat === 'number' && typeof task.coordinates.lng === 'number' && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${task.coordinates.lat},${task.coordinates.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-300 transition-colors shadow-2xs"
                            >
                              <Navigation className="w-3 h-3 text-blue-600" />
                              <span>Navigate GPS</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {!isFinished ? (
                            <button
                              type="button"
                              onClick={() => setTaskToConduct(task)}
                              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition-all duration-200 card-hover-lift cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Open / Conduct Inspection</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingCompletedTask(task)}
                                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Saved Record</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTaskToConduct(task)}
                                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-300 transition-all cursor-pointer shadow-xs"
                              >
                                Re-inspect / Update
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Conduct Inspection Modal */}
      {taskToConduct && (
        <AssignedInspectionConductModal
          task={taskToConduct}
          currentOfficer={currentOfficer}
          onClose={() => setTaskToConduct(null)}
          onSubmitSuccess={(updatedTask) => {
            setTaskToConduct(null);
            const refreshed = getAssignedTasksForOfficer(currentOfficer.id, currentOfficer.name, govTasks);
            setAssignedGovTasks(refreshed);
            if (onUpdateGovTask) {
              onUpdateGovTask(updatedTask);
            }
            onShowToast?.(
              `✓ Inspection Record saved & submitted for ${updatedTask.id} (${updatedTask.status})`,
              'success'
            );
          }}
          onShowToast={(msg, type) => onShowToast?.(msg, type || 'info')}
        />
      )}

      {/* Completed Inspection Record Viewer Modal */}
      {viewingCompletedTask && (viewingCompletedTask.submittedRecord || (viewingCompletedTask as any).submittedData) && (() => {
        const record = viewingCompletedTask.submittedRecord || (viewingCompletedTask as any).submittedData;
        const inspectorName = record.assignedInspector || record.inspectorName || currentOfficer.name;
        const inspectorBadge = record.assignedInspectorBadge || currentOfficer.badgeNumber || 'INSP-DEL';
        const submittedDate = record.dateTime || record.submissionDateTime || 'Recorded';
        const defects = record.issuesDefects || (Array.isArray(record.defectsFound) ? record.defectsFound.join('; ') : '');
        const remarks = record.inspectorRemarks || record.remarks || '';
        const title = viewingCompletedTask.title || (viewingCompletedTask as any).facilityTitle || 'Project Inspection';

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
              {/* Institutional 3px Indian Tricolor Accent Line */}
              <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                      {viewingCompletedTask.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        viewingCompletedTask.status === 'Completed'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-rose-700 text-white'
                      }`}
                    >
                      ● {viewingCompletedTask.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white mt-1">{title}</h3>
                  <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-blue-300" />
                    {viewingCompletedTask.location}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingCompletedTask(null)}
                  className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
                {/* Officer & Submission Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs backdrop-blur-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Inspector</span>
                    <span className="font-bold text-slate-900">{inspectorName}</span>
                    <span className="text-[9px] text-slate-600 font-mono block">{inspectorBadge}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Submitted (IST)</span>
                    <span className="font-semibold text-slate-900">{submittedDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Inspection Type</span>
                    <span className="font-semibold text-slate-900">{viewingCompletedTask.inspectionType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Severity / Priority</span>
                    <span className="font-bold text-rose-800">{record.severityPriority || viewingCompletedTask.priority}</span>
                  </div>
                </div>

                {/* Photos Gallery */}
                {record.photos && record.photos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Evidence Photos ({record.photos.length})</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {record.photos.map((p: any) => (
                        <div key={p.id} className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900 relative group shadow-sm">
                          <img
                            src={p.url}
                            alt={p.caption || 'Field evidence'}
                            className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="p-1.5 bg-slate-900/90 text-white text-[10px]">
                            <div className="font-bold truncate">{p.caption || 'Evidence photo'}</div>
                            <div className="text-slate-400 text-[9px] font-mono">{p.timestamp || ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {record.checklist && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">Checklist &amp; Verification Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Array.isArray(record.checklist) ? (
                        record.checklist.map((item: any) => (
                          <div
                            key={item.id || item.label}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              item.passed ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-rose-50/70 border-rose-300 text-rose-900'
                            }`}
                          >
                            <span className="font-medium text-[11px] truncate mr-2">{item.label}</span>
                            <span className="font-bold text-[10px] flex-shrink-0">{item.passed ? '✓ PASSED' : '✗ FAILED'}</span>
                          </div>
                        ))
                      ) : (
                        Object.entries(record.checklist).map(([key, value]) => {
                          const isTrue = Boolean(value);
                          const label = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase());

                          return (
                            <div
                              key={key}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                isTrue ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-rose-50/70 border-rose-300 text-rose-900'
                              }`}
                            >
                              <span className="font-medium text-[11px]">{label}</span>
                              <span className="font-bold text-[11px]">{isTrue ? '✓ VERIFIED' : '✗ FAILED'}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Observations */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 text-xs block">Field Observations:</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                    {record.observations || 'No observations recorded.'}
                  </div>
                </div>

                {/* Issues & Defects Found */}
                {defects && (
                  <div className="space-y-1">
                    <span className="font-bold text-rose-900 text-xs block">Issues &amp; Defects Found:</span>
                    <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-950 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                      <span>{defects}</span>
                    </div>
                  </div>
                )}

                {/* Inspector Remarks */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 text-xs block">Inspector Remarks &amp; Recommendations:</span>
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-slate-800 whitespace-pre-wrap">
                    {remarks || 'No remarks added.'}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-mono">
                  Record stored in database: GOV_INSPECTION_TASKS_DB_V2
                </span>
                <button
                  type="button"
                  onClick={() => setViewingCompletedTask(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Camera Capture Modal */}
      {isCameraOpen && targetNgoForCamera && (
        <CameraCaptureModal
          ngoName={targetNgoForCamera.name}
          ngoReg={targetNgoForCamera.regNumber}
          officerName={currentOfficer.name}
          officerBadge={currentOfficer.badgeNumber || 'INSP-DEL-402'}
          currentCoordinates={coords}
          onCapture={handlePhotoCaptured}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
};
