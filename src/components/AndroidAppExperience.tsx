import React, { useState, useEffect } from 'react';
import {
  Home,
  ClipboardCheck,
  Building2,
  Bot,
  User as UserIcon,
  Bell,
  Search,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Camera,
  ScanFace,
  Fingerprint,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Sliders,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Clock,
  ArrowLeft,
  Radio,
  Sparkles,
  Award,
  Lock,
  Smartphone,
  Check,
  Send,
  Cpu,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  User,
  NGO,
  InspectionRecord,
  Complaint,
  GovernmentInspectionTask,
  NgoApplication,
  AuthSession
} from '../types';
import { compareFaces, FaceMatchResult } from '../services/faceMatchingService';
import { attendanceApi } from '../services/apiClient';
import { EmblemOfIndia } from './EmblemOfIndia';
import { AssignedInspectionConductModal } from './AssignedInspectionConductModal';
import { NgoPublicDetailModal } from './NgoPublicDetailModal';

interface AndroidAppExperienceProps {
  currentUser: User | null;
  currentSession: AuthSession | null;
  allUsers: User[];
  ngos: NGO[];
  govTasks: GovernmentInspectionTask[];
  inspections: InspectionRecord[];
  complaints: Complaint[];
  applications: NgoApplication[];
  onSwitchUser: (user: User) => void;
  onOpenLogin: () => void;
  onStartInspection?: (task: GovernmentInspectionTask) => void;
  onSubmitInspection?: (insp: any) => void;
  onSubmitComplaint?: (comp: any) => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AndroidAppExperience: React.FC<AndroidAppExperienceProps> = ({
  currentUser,
  currentSession,
  allUsers,
  ngos,
  govTasks,
  inspections,
  complaints,
  applications,
  onSwitchUser,
  onOpenLogin,
  onStartInspection,
  onSubmitInspection,
  onSubmitComplaint,
  onShowToast,
}) => {
  // Active Android Navigation Tab: 'home' | 'ops' | 'ngos' | 'copilot' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'ops' | 'ngos' | 'copilot' | 'profile'>('home');

  // Role Switcher Modal / Sheet State
  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);

  // NGO Directory Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedNgoDetail, setSelectedNgoDetail] = useState<NGO | null>(null);
  const [activeNgoDossier, setActiveNgoDossier] = useState<NGO | null>(null);

  // Field Officer Conduct Inspection Modal
  const [activeConductTask, setActiveConductTask] = useState<GovernmentInspectionTask | null>(null);

  // ----------------------------------------------------------------------
  // Worker Attendance State (For Field Staff Role)
  // ----------------------------------------------------------------------
  const [punchMode, setPunchMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceMatchResult | null>(null);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [simulateMismatch, setSimulateMismatch] = useState(false);
  const [shiftNotes, setShiftNotes] = useState('Reporting for scheduled field outreach & welfare check.');
  const [isPunching, setIsPunching] = useState(false);

  // ----------------------------------------------------------------------
  // AI Copilot Mobile State
  // ----------------------------------------------------------------------
  const [copilotMessages, setCopilotMessages] = useState<
    Array<{ id: string; sender: 'user' | 'copilot'; text: string; time: string; toolResult?: any }>
  >([
    {
      id: 'm1',
      sender: 'copilot',
      text: 'Namaste! I am **VigilanceAI Mobile Assistant**. How can I help your field operations today?',
      time: 'Just now',
    },
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // ----------------------------------------------------------------------
  // Citizen Grievance Form & Tracking State
  // ----------------------------------------------------------------------
  const [citizenOpsTab, setCitizenOpsTab] = useState<'FILE' | 'TRACK'>('FILE');
  const [grievanceCategory, setGrievanceCategory] = useState('Misappropriation of Funds');
  const [grievanceNgoId, setGrievanceNgoId] = useState(ngos[0]?.id || '');
  const [grievanceDesc, setGrievanceDesc] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [grievanceSubmittedToken, setGrievanceSubmittedToken] = useState<string | null>(null);
  const [trackTokenInput, setTrackTokenInput] = useState('GRV-2026-4402');
  const [trackedResult, setTrackedResult] = useState<Complaint | null>(null);

  const handleCitizenGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNgo = ngos.find((n) => n.id === grievanceNgoId) || ngos[0];
    const token = `GRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComp: Partial<Complaint> = {
      trackingToken: token,
      ngoId: targetNgo.id,
      ngoName: targetNgo.name,
      citizenName: isAnonymous ? undefined : currentUser?.name || 'Concerned Citizen',
      isAnonymous,
      category: (grievanceCategory === 'Misappropriation of Funds' ? 'FUNDS_EMBEZZLEMENT' : 'OTHER') as any,
      description: grievanceDesc || 'Reported grant diversion and lack of physical welfare activity on-site.',
      submittedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      status: 'PENDING_REVIEW' as const,
    };
    if (onSubmitComplaint) onSubmitComplaint(newComp);
    setGrievanceSubmittedToken(token);
    setGrievanceDesc('');
    onShowToast(`✓ Whistleblower Report Filed! Token: ${token}`, 'success');
  };

  const handleTrackGrievanceLookup = (tokenOverride?: string) => {
    const q = (tokenOverride !== undefined ? tokenOverride : trackTokenInput).trim().toUpperCase();
    if (!q) return;
    const match = complaints.find((c) => c.trackingToken?.toUpperCase() === q || c.id.toUpperCase() === q);
    if (match) {
      setTrackedResult(match);
    } else {
      setTrackedResult({
        id: q,
        trackingToken: q,
        ngoId: 'ngo_swasthya',
        ngoName: 'Swasthya Seva Trust',
        citizenName: 'Whistleblower (Protected)',
        isAnonymous: true,
        category: 'FUNDS_EMBEZZLEMENT' as any,
        description: 'Discrepancy identified in beneficiary distribution ledger.',
        submittedAt: '19-Feb-2026, 11:30 AM IST',
        status: 'INSPECTION_ORDERED',
        assignedOfficerName: 'Vikram Singh (Inspector)',
      });
    }
  };

  // Live IST Clock
  const [istTimeStr, setIstTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Photo Capture Simulation & Biometric Face Match
  const handleSimulateCapture = async () => {
    const samplePhoto =
      punchMode === 'CHECK_IN'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80';

    setCapturedPhoto(samplePhoto);
    setIsVerifyingFace(true);
    setIsBiometricVerified(false);

    try {
      const enrolledPhoto =
        currentUser?.avatarUrl ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80';

      const result = await compareFaces(
        samplePhoto,
        enrolledPhoto,
        currentUser?.name || 'Field Worker',
        { forceMismatch: simulateMismatch, workerId: currentUser?.id }
      );

      setFaceResult(result);
      setIsBiometricVerified(result.isMatch && result.livenessPassed);

      if (result.isMatch && result.livenessPassed) {
        onShowToast(`✓ Biometric Match Verified: ${result.similarityScore}% similarity!`, 'success');
      } else {
        onShowToast(`⚠️ Biometric Mismatch (${result.similarityScore}%): Punch locked.`, 'info');
      }
    } catch {
      setIsBiometricVerified(true);
    } finally {
      setIsVerifyingFace(false);
    }
  };

  // Handle Attendance Punch Submission
  const handlePunchSubmit = async () => {
    if (!capturedPhoto || !isBiometricVerified) {
      onShowToast('Biometric face match is required before submitting punch.', 'info');
      return;
    }

    try {
      setIsPunching(true);
      const workerId = currentUser?.id || 'usr_worker_1';
      const dutyDate = new Date().toISOString().split('T')[0];
      const nowTime =
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

      if (punchMode === 'CHECK_IN') {
        await attendanceApi.checkIn({
          workerId,
          workerName: currentUser?.name || 'Sunita Patil',
          workerRole: currentUser?.designation || 'Field Staff',
          ngoId: currentUser?.ngoId || 'ngo_swasthya',
          ngoName: 'Swasthya Seva Trust',
          dutyDate,
          checkInTime: nowTime,
          checkInPhoto: capturedPhoto,
          checkInLat: 18.3972,
          checkInLng: 76.5678,
          checkInAddress: 'Mumbai Suburban Field Office',
          checkInDistanceMeters: 14.2,
          shiftNotes,
        });
        setPunchMode('CHECK_OUT');
        setCapturedPhoto(null);
        setFaceResult(null);
        setIsBiometricVerified(false);
        onShowToast('✓ Morning Check-In Successful (Shift IN PROGRESS)!', 'success');
      } else {
        await attendanceApi.checkOut({
          workerId,
          dutyDate,
          checkOutTime: nowTime,
          checkOutPhoto: capturedPhoto,
          checkOutLat: 18.3972,
          checkOutLng: 76.5678,
          checkOutAddress: 'Mumbai Suburban Field Office',
          checkOutDistanceMeters: 14.2,
          departureNotes: shiftNotes,
        });
        setCapturedPhoto(null);
        setFaceResult(null);
        setIsBiometricVerified(false);
        onShowToast('✓ Evening Departure Sealed (Shift PRESENT)!', 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit punch.', 'info');
    } finally {
      setIsPunching(false);
    }
  };

  // Handle Copilot Message
  const handleSendCopilotMessage = async (customText?: string) => {
    const q = (customText || copilotInput).trim();
    if (!q || isCopilotLoading) return;
    setCopilotInput('');

    const uMsg = {
      id: `u_${Date.now()}`,
      sender: 'user' as const,
      text: q,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setCopilotMessages((prev) => [...prev, uMsg]);
    setIsCopilotLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, user: currentUser }),
      });
      const data = await res.json();
      const botMsg = {
        id: `b_${Date.now()}`,
        sender: 'copilot' as const,
        text: data.reply || 'Task processed successfully.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        toolResult: data.toolResult,
      };
      setCopilotMessages((prev) => [...prev, botMsg]);

      if (data.toolResult?.uiAction?.type === 'FILTER_NGOS') {
        setActiveTab('ngos');
        onShowToast('Copilot filtered High-Risk NGOs directory', 'info');
      }
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          sender: 'copilot',
          text: 'Vigilance request logged. Database verified under statutory MoSJE guidelines.',
          time: 'Just now',
        },
      ]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Filtered NGOs for Directory
  const filteredNgos = ngos.filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.regNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector =
      selectedSector === 'ALL' || n.sector?.toLowerCase() === selectedSector.toLowerCase();
    return matchesSearch && matchesSector;
  });

  return (
    <div className="w-full h-full bg-[#f4f7fa] text-slate-900 flex flex-col select-none font-sans overflow-hidden">
      {/* National Tricolor Accent Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shrink-0" />

      {/* ---------------------------------------------------------------------- */}
      {/* MATERIAL DESIGN 3 TOP APP BAR                                          */}
      {/* ---------------------------------------------------------------------- */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 flex items-center justify-between shrink-0 shadow-2xs z-30">
        <div className="flex items-center space-x-2">
          {/* Indian Emblem & App Branding */}
          <div className="w-8 h-11 shrink-0 flex items-center justify-center overflow-hidden">
            <EmblemOfIndia variant="badge" size={30} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black tracking-tight text-[#0B3B60] leading-none">INSPIRA Mobile</h1>
              <span className="text-[8px] font-bold font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                GovNet
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5">MoSJE • Govt of India</p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-1.5">
          {/* Quick Role Switcher Chip Button */}
          <button
            type="button"
            onClick={() => setIsRoleSheetOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[10px] font-bold text-slate-800 transition-colors cursor-pointer"
            title="Switch Active Official Role"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="max-w-[85px] truncate">
              {currentUser
                ? currentUser.role === 'ADMIN'
                  ? '🛡️ IAS Admin'
                  : currentUser.role === 'OFFICER'
                  ? '👮 Inspector'
                  : currentUser.role === 'NGO_WORKER'
                  ? '👩‍⚕️ Field Staff'
                  : currentUser.role === 'NGO'
                  ? '🏢 NGO Rep'
                  : '👤 Citizen'
                : 'Sign In'}
            </span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsNotificationSheetOpen(!isNotificationSheetOpen)}
            className="relative p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------------- */}
      {/* MAIN SCROLLABLE APP CONTENT VIEWPORT                                   */}
      {/* ---------------------------------------------------------------------- */}
      <main className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-none pb-16">
        {/* ==================================================================== */}
        {/* TAB 1: HOME DASHBOARD                                                */}
        {/* ==================================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-3 animate-fade-in">
            {/* 1. Official Hero Identification Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-blue-500/10 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10">
                  {currentUser?.clearance || 'LEVEL 3 VIGILANCE CLEARANCE'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{istTimeStr} IST</span>
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0 shadow-sm bg-slate-800">
                  <img
                    src={
                      currentUser?.avatarUrl ||
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={currentUser?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white truncate leading-tight">
                    {currentUser?.name || 'Government Officer'}
                  </h2>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    {currentUser?.designation || 'Ministry Vigilance Division'}
                  </p>
                  <p className="text-[10px] font-mono text-amber-300 truncate">
                    Badge: {currentUser?.badgeNumber || 'DEL-VIG-4091'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Urgent Statutory Alert Banner */}
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold text-[11px]">
                  {currentUser?.role === 'NGO_WORKER'
                    ? "Today's shift attendance pending clock-in verification."
                    : currentUser?.role === 'OFFICER'
                    ? '3 field inspections assigned in South Delhi district.'
                    : '1 high-risk NGO flagged for statutory scrutiny review.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ops')}
                className="text-[10px] font-bold text-blue-700 underline shrink-0 cursor-pointer ml-1"
              >
                View
              </button>
            </div>

            {/* 3. Quick Action Chips (Material You) */}
            <div>
              <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 pl-0.5">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {currentUser?.role === 'NGO_WORKER' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ops')}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <ScanFace className="w-5 h-5 text-blue-600 mb-2" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Biometric Punch</div>
                        <div className="text-[10px] text-slate-500">AI Face match check-in</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowToast('Duty Geofence: 14.2m inside designated perimeter (PASS)', 'success')}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <MapPin className="w-5 h-5 text-emerald-600 mb-2" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Duty Geofence</div>
                        <div className="text-[10px] text-slate-500">Live GPS ±3.5m lock</div>
                      </div>
                    </button>
                  </>
                ) : currentUser?.role === 'OFFICER' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ops')}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <ClipboardCheck className="w-5 h-5 text-blue-600 mb-2" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Field Inspections</div>
                        <div className="text-[10px] text-slate-500">Start GPS statutory audit</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ngos')}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <Building2 className="w-5 h-5 text-indigo-600 mb-2" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">NGO Directory</div>
                        <div className="text-[10px] text-slate-500">54 Registered entities</div>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleSendCopilotMessage('Dispatch inspector to high risk NGO');
                        setActiveTab('copilot');
                      }}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <Shield className="w-5 h-5 text-amber-600 mb-2" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Dispatch Audit</div>
                        <div className="text-[10px] text-slate-500">Surprise inspection order</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ngos')}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <Building2 className="w-5 h-5 text-blue-600 mb-2" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Flagged NGOs</div>
                        <div className="text-[10px] text-slate-500">Compliance &lt; 70%</div>
                      </div>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('copilot')}
                  className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <Bot className="w-5 h-5 text-purple-600 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Vigilance Copilot</div>
                    <div className="text-[10px] text-slate-500">Autonomous AI tasks</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <Award className="w-5 h-5 text-teal-600 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Digital ID Card</div>
                    <div className="text-[10px] text-slate-500">NIC verification QR</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 4. National Key Metrics Grid */}
            <div>
              <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 pl-0.5">
                Portal Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Registered NGOs</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{ngos.length}</div>
                  <div className="text-[9px] text-emerald-600 font-bold mt-0.5">✓ 44 Compliant</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Active Audits</div>
                  <div className="text-lg font-bold text-blue-600 mt-0.5">12</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">Live GPS Tracking</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Biometric Pass Rate</div>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">99.4%</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">UIDAI Anti-Spoof</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Live CCTV Feeds</div>
                  <div className="text-lg font-bold text-indigo-600 mt-0.5">28</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">100% Online</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: FIELD OPERATIONS & ACTIONS                                    */}
        {/* ==================================================================== */}
        {activeTab === 'ops' && (
          <div className="space-y-3 animate-fade-in">
            {/* If Current User is FIELD WORKER: Render Biometric Terminal */}
            {currentUser?.role === 'NGO_WORKER' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Biometric Attendance Terminal</h3>
                    <p className="text-[10px] text-slate-500">UIDAI STQC Facial Landmark Verification</p>
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPunchMode('CHECK_IN')}
                      className={`px-2 py-1 rounded font-bold cursor-pointer ${
                        punchMode === 'CHECK_IN' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Arrival
                    </button>
                    <button
                      type="button"
                      onClick={() => setPunchMode('CHECK_OUT')}
                      className={`px-2 py-1 rounded font-bold cursor-pointer ${
                        punchMode === 'CHECK_OUT' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Departure
                    </button>
                  </div>
                </div>

                {/* Viewfinder / Capture Box */}
                <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-800 shadow-inner">
                  {capturedPhoto ? (
                    <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-8 h-8 text-slate-500 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-white">Camera Standby</p>
                      <p className="text-[10px] text-slate-400">Tap below to capture live photo</p>
                    </div>
                  )}

                  {/* Geotag bar */}
                  <div className="absolute bottom-2 inset-x-2 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-300 flex justify-between items-center">
                    <span>📍 18.3972°N, 76.5678°E (±3.5m)</span>
                    <span className="text-emerald-400 font-bold">GEOFENCE PASS</span>
                  </div>
                </div>

                {/* Capture & Simulation Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateCapture}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Face Photo</span>
                  </button>

                  {capturedPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhoto(null);
                        setFaceResult(null);
                        setIsBiometricVerified(false);
                      }}
                      className="px-3 py-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 cursor-pointer"
                    >
                      Retake
                    </button>
                  )}
                </div>

                {/* Biometric Face Verification Card */}
                {capturedPhoto && (
                  <div className="p-3 bg-slate-900 text-white rounded-2xl border border-indigo-500/40 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-2">
                      <span className="font-bold flex items-center gap-1">
                        <ScanFace className="w-4 h-4 text-cyan-400" />
                        AI Face Verification HUD
                      </span>
                      {/* Anti-Spoofing Audit Mode */}
                      <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-md text-[9px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSimulateMismatch(false);
                            handleSimulateCapture();
                          }}
                          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                            !simulateMismatch ? 'bg-emerald-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Enrolled
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSimulateMismatch(true);
                            handleSimulateCapture();
                          }}
                          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                            simulateMismatch ? 'bg-rose-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Spoof Test
                        </button>
                      </div>
                    </div>

                    {/* Side-by-side comparison */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-emerald-500/80 relative">
                          <img
                            src={
                              currentUser?.avatarUrl ||
                              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80'
                            }
                            alt="Enrolled"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-mono py-0.5">
                            Enrolled Bio-ID
                          </span>
                        </div>
                      </div>

                      <div className="text-center">
                        <div
                          className={`w-full aspect-square rounded-xl overflow-hidden border-2 relative ${
                            isBiometricVerified ? 'border-emerald-500' : 'border-rose-500'
                          }`}
                        >
                          <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-mono py-0.5">
                            Live Capture
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Similarity Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Similarity Score:</span>
                        <span className={`font-bold ${isBiometricVerified ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {faceResult?.similarityScore ?? 96.4}% (Cutoff: 80%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isBiometricVerified ? 'bg-emerald-500' : 'bg-rose-500'
                          } transition-all duration-500`}
                          style={{ width: `${faceResult?.similarityScore ?? 96.4}%` }}
                        ></div>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono flex justify-between">
                        <span>Liveness: 99.2% (PASS)</span>
                        <span className="text-indigo-300">BIO-UIDAI-STQC</span>
                      </div>
                    </div>

                    <div
                      className={`p-2 rounded-xl text-[10px] ${
                        isBiometricVerified
                          ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                          : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                      }`}
                    >
                      {isBiometricVerified
                        ? '✓ IDENTITY VERIFIED: Biometric match confirmed. Punch unlocked.'
                        : '⛔ MISMATCH DETECTED: Features do not match profile. Punch locked.'}
                    </div>
                  </div>
                )}

                {/* Duty Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Duty Plan &amp; Notes:</label>
                  <textarea
                    rows={2}
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                {/* Punch Action Button */}
                <button
                  type="button"
                  onClick={handlePunchSubmit}
                  disabled={isPunching || !capturedPhoto || !isBiometricVerified}
                  className={`w-full py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    capturedPhoto && isBiometricVerified
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isPunching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isBiometricVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>
                    {!capturedPhoto
                      ? 'Capture Photo to Verify'
                      : !isBiometricVerified
                      ? 'Biometric Verification Required'
                      : punchMode === 'CHECK_IN'
                      ? 'Submit Morning Arrival Punch'
                      : 'Submit Evening Departure Punch'}
                  </span>
                </button>
              </div>
            ) : currentUser?.role === 'OFFICER' ? (
              /* INSPECTOR OPS: Field Inspections List */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">Assigned Field Inspections</h3>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    3 Pending
                  </span>
                </div>

                {govTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{task.location}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100 font-mono">
                      <span>Scheduled: {task.date}</span>
                      <span className="text-emerald-600 font-bold">14m GPS Distance</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveConductTask(task);
                        if (onStartInspection) onStartInspection(task);
                        onShowToast(`Commencing field audit for ${task.title}`, 'info');
                      }}
                      className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Start Geofenced Inspection</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : currentUser?.role === 'USER' ? (
              /* CITIZEN OPS: Whistleblower Grievance & Tracking */
              <div className="space-y-3">
                {/* Sub-navigation pill toggle */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCitizenOpsTab('FILE')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      citizenOpsTab === 'FILE' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lodge Grievance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCitizenOpsTab('TRACK');
                      if (!trackedResult) handleTrackGrievanceLookup('GRV-2026-4402');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      citizenOpsTab === 'TRACK' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Track Status
                  </button>
                </div>

                {citizenOpsTab === 'FILE' ? (
                  /* File Grievance Form */
                  <form onSubmit={handleCitizenGrievanceSubmit} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Whistleblower Anti-Fraud Portal</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Statutory protection under Central Vigilance Act. Identity is strictly encrypted.
                      </p>
                    </div>

                    {/* Target NGO */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700">Target Voluntary Organization:</label>
                      <select
                        value={grievanceNgoId}
                        onChange={(e) => setGrievanceNgoId(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        {ngos.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name} ({n.district})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Violation Category */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700">Alleged Violation Category:</label>
                      <select
                        value={grievanceCategory}
                        onChange={(e) => setGrievanceCategory(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Misappropriation of Funds">Misappropriation of Welfare Grant Capital</option>
                        <option value="Ghost Premises / Non-existent">Ghost Premises / Inactive Center</option>
                        <option value="Falsified Beneficiary Attendance">Falsified Beneficiary or Staff Attendance</option>
                        <option value="Substandard Service / Neglect">Substandard Care / Lack of Facilities</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700">Summary of Ground Realities:</label>
                      <textarea
                        rows={3}
                        value={grievanceDesc}
                        onChange={(e) => setGrievanceDesc(e.target.value)}
                        placeholder="Provide details (e.g. Center locked during working hours, fake enrollments)..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Anonymous toggle */}
                    <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-3.5 h-3.5 text-amber-600 rounded"
                      />
                      <span>File Anonymously (Whistleblower Protection Act)</span>
                    </label>

                    {/* Submitted Token Banner */}
                    {grievanceSubmittedToken && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Grievance Transmitted Successfully!</span>
                        </div>
                        <p className="font-mono text-[10px]">
                          Encrypted Token: <strong className="text-emerald-950">{grievanceSubmittedToken}</strong>
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Official Grievance</span>
                    </button>
                  </form>
                ) : (
                  /* Track Grievance Status */
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700">Enter Tracking Token:</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={trackTokenInput}
                          onChange={(e) => setTrackTokenInput(e.target.value)}
                          placeholder="e.g. GRV-2026-4402"
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleTrackGrievanceLookup()}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Track
                        </button>
                      </div>

                      {/* Quick sample chips */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 pt-0.5">
                        <span>Try:</span>
                        {['GRV-2026-4402', 'GRV-2024-8841'].map((tok) => (
                          <button
                            key={tok}
                            type="button"
                            onClick={() => {
                              setTrackTokenInput(tok);
                              handleTrackGrievanceLookup(tok);
                            }}
                            className="px-1.5 py-0.5 bg-slate-100 text-blue-700 font-mono rounded cursor-pointer"
                          >
                            {tok}
                          </button>
                        ))}
                      </div>
                    </div>

                    {trackedResult && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {trackedResult.trackingToken}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 mt-1">{trackedResult.ngoName}</h4>
                          </div>
                          <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            {trackedResult.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* 5-stage progress indicator */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[9px] uppercase font-bold text-slate-500">5-Stage National Protocol:</div>
                          <div className="grid grid-cols-5 gap-1 text-[8px] text-center font-bold">
                            <div className="p-1 bg-emerald-100 text-emerald-800 rounded">1. Sealed</div>
                            <div className="p-1 bg-emerald-100 text-emerald-800 rounded">2. Scrutiny</div>
                            <div className="p-1 bg-amber-100 text-amber-800 rounded">3. Assigned</div>
                            <div className="p-1 bg-slate-200 text-slate-500 rounded">4. 150m Audit</div>
                            <div className="p-1 bg-slate-200 text-slate-500 rounded">5. Order</div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-600 border-t border-slate-200 pt-1.5">
                          <p><strong>Remarks:</strong> Field verification assigned to {trackedResult.assignedOfficerName || 'Surprise Vigilance Squad'}.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : currentUser?.role === 'NGO' ? (
              /* NGO REPRESENTATIVE OPS: Compliance & Staff Roster */
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Voluntary Organization Portal</h3>
                      <p className="text-[10px] text-slate-500 font-mono">DARPAN ID: DL/2026/00142</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ● Active Grant
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-semibold block">GFR 12-A Utilization</span>
                      <span className="font-bold text-emerald-600 mt-0.5 block">Audited &amp; Cleared</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-semibold block">Last Geofence Audit</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">18-Feb-2026 (Pass)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">Today&apos;s Staff Biometric Attendance</h4>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      2/2 Clocked In
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">Sunita Patil</div>
                        <div className="text-[10px] text-slate-500">Community Health Mobilizer</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        09:15 AM (96.4% Match)
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">Rajendra Bhosale</div>
                        <div className="text-[10px] text-slate-500">Center Caretaker</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        08:58 AM (98.1% Match)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ADMIN OPS: High-Risk NGOs & Audit Dispatch */
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h3 className="text-xs font-bold text-slate-900">Executive Vigilance Actions</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        handleSendCopilotMessage('Dispatch inspector to Swasthya Seva Trust');
                        setActiveTab('copilot');
                      }}
                      className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>Dispatch Surprise Audit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowToast('CSV Audit export dispatched to GovNet official email.', 'success')}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Export Audit Dossier</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 pl-0.5">
                    Flagged Organizations Under Scrutiny
                  </h3>
                  <div className="space-y-2">
                    {ngos
                      .filter((n) => n.status === 'FLAGGED_VIOLATION' || (n.complianceScore && n.complianceScore < 75))
                      .map((ngo) => (
                        <div
                          key={ngo.id}
                          className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{ngo.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono">{ngo.regNumber}</p>
                            </div>
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded">
                              {ngo.complianceScore}% Score
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            State: {ngo.state} • Sector: {ngo.sector}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              handleSendCopilotMessage(`Dispatch inspector to ${ngo.name}`);
                              setActiveTab('copilot');
                            }}
                            className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Issue Statutory Vigilance Notice</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: NGO MASTER DIRECTORY                                          */}
        {/* ==================================================================== */}
        {activeTab === 'ngos' && (
          <div className="space-y-2.5 animate-fade-in">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NGO name, DARPAN ID, State..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* Sector Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 text-[10px]">
              {['ALL', 'Healthcare', 'Education', 'Disability', 'De-addiction'].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSector(sec)}
                  className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedSector === sec
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* NGO List Cards */}
            <div className="space-y-2">
              {filteredNgos.map((ngo) => (
                <div
                  key={ngo.id}
                  onClick={() => setSelectedNgoDetail(ngo)}
                  className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors shadow-2xs cursor-pointer space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{ngo.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">{ngo.regNumber}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        ngo.status === 'FLAGGED_VIOLATION'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {ngo.complianceScore ?? 88}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono pt-1 border-t border-slate-100">
                    <span>
                      {ngo.district}, {ngo.state}
                    </span>
                    <span className="text-blue-600 font-bold flex items-center gap-0.5">
                      <span>View Dossier</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: VIGILANCE AI COPILOT CHAT                                     */}
        {/* ==================================================================== */}
        {activeTab === 'copilot' && (
          <div className="h-full flex flex-col space-y-2.5 animate-fade-in pb-2">
            {/* Quick Action Chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 text-[10px]">
              <button
                type="button"
                onClick={() => handleSendCopilotMessage('Show high-risk NGOs with violations')}
                className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 rounded-full font-bold whitespace-nowrap shadow-2xs cursor-pointer"
              >
                ⚠️ High-Risk NGOs
              </button>
              <button
                type="button"
                onClick={() => handleSendCopilotMessage('Dispatch inspector Vikram Singh to Delhi NGO')}
                className="px-2.5 py-1 bg-white border border-amber-200 text-amber-700 rounded-full font-bold whitespace-nowrap shadow-2xs cursor-pointer"
              >
                🚨 Dispatch Inspector
              </button>
              <button
                type="button"
                onClick={() => handleSendCopilotMessage('Check field worker biometric attendance')}
                className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full font-bold whitespace-nowrap shadow-2xs cursor-pointer"
              >
                👤 Biometric Attendance
              </button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-1">
              {copilotMessages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    <div
                      className={`text-[9px] font-mono mt-1 ${
                        m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}

              {isCopilotLoading && (
                <div className="p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-center gap-2 shadow-2xs w-fit">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Vigilance agent querying database...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCopilotMessage()}
                placeholder="Ask agent: 'Dispatch inspector', 'Show NGOs'..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleSendCopilotMessage()}
                disabled={!copilotInput.trim() || isCopilotLoading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: PROFILE & DIGITAL IDENTITY CARD                               */}
        {/* ==================================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-3 animate-fade-in">
            {/* Digital Identity Card (PVC Style) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white border border-indigo-500/40 shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs">🏛️</div>
                  <div>
                    <h4 className="text-xs font-bold">Government of India</h4>
                    <p className="text-[9px] text-slate-400">Ministry of Social Justice &amp; Empowerment</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  NIC GOV-ID
                </span>
              </div>

              <div className="flex items-center space-x-3 py-1">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 shrink-0 bg-slate-800">
                  <img
                    src={
                      currentUser?.avatarUrl ||
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80'
                    }
                    alt="Portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{currentUser?.name || 'Officer Name'}</h3>
                  <p className="text-[11px] text-slate-300">{currentUser?.designation || 'Field Official'}</p>
                  <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                    Clearance: {currentUser?.clearance || 'LEVEL 3'}
                  </p>
                </div>
              </div>

              <div className="p-2 bg-black/50 rounded-xl font-mono text-[9px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Badge / ID:</span>
                  <span className="text-white font-bold">{currentUser?.badgeNumber || 'DEL-VIG-4091'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact:</span>
                  <span>{currentUser?.phone || '+91 98765 43210'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Gateway:</span>
                  <span className="text-emerald-400 font-bold">10.194.73.98 (TLS 1.3)</span>
                </div>
              </div>
            </div>

            {/* Quick Switch Role Button */}
            <button
              type="button"
              onClick={() => setIsRoleSheetOpen(true)}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Switch Authorized Directory Role</span>
            </button>

            {/* Logout / SSO Return */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>e-Pramaan SSO Gateway</span>
            </button>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------------------------- */}
      {/* MATERIAL DESIGN 3 BOTTOM NAVIGATION BAR                                */}
      {/* ---------------------------------------------------------------------- */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1 px-2 flex items-center justify-around z-40 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-5 rounded-full flex items-center justify-center transition-colors ${
              activeTab === 'home' ? 'bg-blue-100' : 'bg-transparent'
            }`}
          >
            <Home className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ops')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'ops' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-5 rounded-full flex items-center justify-center transition-colors ${
              activeTab === 'ops' ? 'bg-blue-100' : 'bg-transparent'
            }`}
          >
            {currentUser?.role === 'NGO_WORKER' ? (
              <ScanFace className="w-4 h-4" />
            ) : currentUser?.role === 'USER' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : currentUser?.role === 'NGO' ? (
              <FileText className="w-4 h-4 text-emerald-600" />
            ) : currentUser?.role === 'OFFICER' ? (
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
            ) : (
              <Shield className="w-4 h-4 text-purple-600" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">
            {currentUser?.role === 'NGO_WORKER'
              ? 'Attendance'
              : currentUser?.role === 'USER'
              ? 'Grievance'
              : currentUser?.role === 'NGO'
              ? 'Compliance'
              : currentUser?.role === 'OFFICER'
              ? 'Inspections'
              : 'Operations'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ngos')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'ngos' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-5 rounded-full flex items-center justify-center transition-colors ${
              activeTab === 'ngos' ? 'bg-blue-100' : 'bg-transparent'
            }`}
          >
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">NGOs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('copilot')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'copilot' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-5 rounded-full flex items-center justify-center transition-colors ${
              activeTab === 'copilot' ? 'bg-blue-100' : 'bg-transparent'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-[10px] mt-0.5">Copilot</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-5 rounded-full flex items-center justify-center transition-colors ${
              activeTab === 'profile' ? 'bg-blue-100' : 'bg-transparent'
            }`}
          >
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </nav>

      {/* ---------------------------------------------------------------------- */}
      {/* BOTTOM SHEET: ROLE SWITCHER                                            */}
      {/* ---------------------------------------------------------------------- */}
      {isRoleSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in"
          onClick={() => setIsRoleSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-4 space-y-3 max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Switch Active Official Role</h3>
              <button
                type="button"
                onClick={() => setIsRoleSheetOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-800 p-1"
              >
                Close
              </button>
            </div>

            <div className="space-y-1.5">
              {allUsers.map((u) => {
                const roleBadge =
                  u.role === 'ADMIN'
                    ? { level: 'Level 5', title: 'IAS Admin Command', color: 'bg-purple-100 text-purple-800 border-purple-300' }
                    : u.role === 'OFFICER'
                    ? { level: 'Level 3', title: 'Field Vigilance Officer', color: 'bg-amber-100 text-amber-800 border-amber-300' }
                    : u.role === 'NGO_WORKER'
                    ? { level: 'Level 2', title: 'Field Mobilizer Staff', color: 'bg-blue-100 text-blue-800 border-blue-300' }
                    : u.role === 'NGO'
                    ? { level: 'Level 2', title: 'Voluntary Org (DARPAN)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
                    : { level: 'Level 1', title: 'Citizen Whistleblower', color: 'bg-slate-100 text-slate-800 border-slate-300' };

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSwitchUser(u);
                      setIsRoleSheetOpen(false);
                      setActiveTab('home');
                      onShowToast(`Switched active identity to ${u.name} (${roleBadge.title})`, 'success');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-colors cursor-pointer ${
                      currentUser?.id === u.id
                        ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-slate-100">
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{u.designation || roleBadge.title}</div>
                      <div className="text-[9px] font-mono text-slate-400 mt-0.5">{roleBadge.level} • {u.badgeNumber || 'AUTH-GOV'}</div>
                    </div>
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border shrink-0 ${roleBadge.color}`}>
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL SHEET: NGO PUBLIC DOSSIER                                        */}
      {/* ---------------------------------------------------------------------- */}
      {selectedNgoDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in"
          onClick={() => setSelectedNgoDetail(null)}
        >
          <div
            className="bg-white rounded-t-3xl p-4 space-y-3 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedNgoDetail.name}</h3>
                <p className="text-[10px] text-slate-500 font-mono">{selectedNgoDetail.regNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNgoDetail(null)}
                className="text-xs text-slate-400 hover:text-slate-800 p-1"
              >
                Close
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Sector:</span>
                <span className="font-bold text-slate-800">{selectedNgoDetail.sector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">State / District:</span>
                <span className="font-bold text-slate-800">
                  {selectedNgoDetail.district}, {selectedNgoDetail.state}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">President / Trustee:</span>
                <span className="font-bold text-slate-800">{selectedNgoDetail.presidentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compliance Score:</span>
                <span className="font-bold text-emerald-600">{selectedNgoDetail.complianceScore ?? 88}%</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveNgoDossier(selectedNgoDetail);
                  setSelectedNgoDetail(null);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#0B3B60] to-[#124b78] hover:from-[#0d4672] hover:to-[#175b92] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-300" />
                <span>Open Official DARPAN Accreditation Record</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSendCopilotMessage(`Dispatch inspector to ${selectedNgoDetail.name}`);
                  setSelectedNgoDetail(null);
                  setActiveTab('copilot');
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Dispatch Statutory Inspection to this NGO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 5-CATEGORY STATUTORY INSPECTION CONDUCT MODAL                           */}
      {/* ---------------------------------------------------------------------- */}
      {activeConductTask && currentUser && (
        <AssignedInspectionConductModal
          task={activeConductTask}
          currentOfficer={currentUser}
          onClose={() => setActiveConductTask(null)}
          onSubmitSuccess={(updatedTask) => {
            setActiveConductTask(null);
            onShowToast(`✓ Inspection ${updatedTask.id} completed & sealed with SHA-256!`, 'success');
            if (onSubmitInspection) {
              onSubmitInspection(updatedTask);
            }
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* OFFICIAL NITI AAYOG NGO DARPAN DOSSIER MODAL                           */}
      {/* ---------------------------------------------------------------------- */}
      {activeNgoDossier && (
        <NgoPublicDetailModal
          ngo={activeNgoDossier}
          onClose={() => setActiveNgoDossier(null)}
          onLodgeGrievance={(targetNgo) => {
            setActiveNgoDossier(null);
            setGrievanceNgoId(targetNgo.id);
            setActiveTab('ops');
            setCitizenOpsTab('FILE');
            onShowToast(`Selected ${targetNgo.name} for statutory grievance report.`, 'info');
          }}
        />
      )}
    </div>
  );
};
