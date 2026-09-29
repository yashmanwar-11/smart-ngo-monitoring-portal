import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Camera,
  Shield,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  X,
  Sparkles,
  MapPin,
  Clock,
  Radio,
  FileCheck2,
  ExternalLink,
  RotateCw,
  RefreshCw,
  Send,
  Lock,
  Layers,
  Users
} from 'lucide-react';
import { NGO, VcParticipantType, VideoConferenceSession } from '../types';
import { vcApi } from '../services/apiClient';

interface RandomVideoConferenceModalProps {
  isOpen: boolean;
  ngos: NGO[];
  preSelectedNgoId?: string;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info') => void;
}

export const RandomVideoConferenceModal: React.FC<RandomVideoConferenceModalProps> = ({
  isOpen,
  ngos,
  preSelectedNgoId,
  onClose,
  onShowToast,
}) => {
  if (!isOpen) return null;

  // Selected NGO & Participant
  const [selectedNgoId, setSelectedNgoId] = useState<string>(
    preSelectedNgoId || (ngos.length > 0 ? ngos[0].id : '')
  );
  const selectedNgo = ngos.find((n) => n.id === selectedNgoId) || ngos[0];

  const [participantType, setParticipantType] = useState<VcParticipantType>('BENEFICIARY');
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  // Media Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [videoSource, setVideoSource] = useState<'DEVICE_CAMERA' | 'SIMULATED_GROUND'>('DEVICE_CAMERA');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // Checklist
  const [checklist, setChecklist] = useState({
    physicalPresenceConfirmed: true,
    identityVerifiedAadhaar: true,
    headcountMatchesRegister: true,
    reportedHeadcount: selectedNgo?.activeBeneficiaryCount || 24,
    cleanlinessAndMealsSatisfactory: true,
    noCoercionReported: true,
    immediateGrievanceNoted: '',
  });

  const [complianceVerdict, setComplianceVerdict] = useState<'SATISFACTORY' | 'DEFICIENT_WARNING' | 'CRITICAL_SHOW_CAUSE'>('SATISFACTORY');
  const [findingsNotes, setFindingsNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Live Camera Video Element Reference
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Candidate Participants for the selected institute
  const candidateParticipants = {
    INCHARGE: {
      name: selectedNgo?.presidentName || 'Dr. Anand Deshmukh',
      role: 'Project Director & In-Charge',
      phone: selectedNgo?.contactPhone || '+91 98220 44910',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
    STAFF: {
      name: 'Sunita Patil',
      role: 'Resident Welfare Officer & Counselor',
      phone: '+91 98334 11290',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    },
    BENEFICIARY: {
      name: 'Ramesh K. (Beneficiary ID: BEN-2026-081)',
      role: selectedNgo?.sector === 'De-addiction' ? 'Resident Patient (NAPDDR)' : selectedNgo?.sector === 'Disability Welfare' ? 'Special Student (DDRS)' : 'Senior Resident (AVYAY)',
      phone: '+91 91234 56789',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
  };

  const currentParticipant = candidateParticipants[participantType];

  // Call timer
  useEffect(() => {
    let timer: any;
    if (isConnected && !isCompleted) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected, isCompleted]);

  // Handle Video Stream
  useEffect(() => {
    if (isConnected && videoSource === 'DEVICE_CAMERA') {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          setVideoSource('SIMULATED_GROUND');
        });
    } else if (mediaStreamRef.current && videoSource === 'SIMULATED_GROUND') {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isConnected, videoSource]);

  // Pick Random Institute from DoSJE list
  const handlePickRandomInstitute = () => {
    if (ngos.length === 0) return;
    const randomIndex = Math.floor(Math.random() * ngos.length);
    const chosen = ngos[randomIndex];
    setSelectedNgoId(chosen.id);
    onShowToast?.(`🎲 Selected Random Target: ${chosen.name} (${chosen.district})`, 'info');
  };

  // Launch Video Call Session
  const handleStartCall = async () => {
    try {
      setIsCalling(true);
      const res = await vcApi.initiate({
        ngoId: selectedNgo.id,
        ngoName: selectedNgo.name,
        ngoDarpanId: selectedNgo.documents?.darpanId || selectedNgo.regNumber,
        district: selectedNgo.district,
        state: selectedNgo.state,
        scheme: selectedNgo.scheme || selectedNgo.sector,
        participantType,
        participantName: currentParticipant.name,
        participantPhone: currentParticipant.phone,
        lat: selectedNgo.coordinates?.lat || 18.3972,
        lng: selectedNgo.coordinates?.lng || 76.5678,
      });

      setActiveSession(res);
      // Simulate ringing and connected in 1.2 seconds
      setTimeout(() => {
        setIsCalling(false);
        setIsConnected(true);
        onShowToast?.(`✓ Encrypted VC Connected with ${currentParticipant.name}`, 'success');
      }, 1200);
    } catch (err: any) {
      setIsCalling(false);
      onShowToast?.(err.message || 'Failed to initiate surprise video conference.', 'info');
    }
  };

  // Capture video frame snapshot
  const handleCaptureSnapshot = () => {
    const simulatedSnapshot =
      participantType === 'BENEFICIARY'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80'
        : participantType === 'STAFF'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';

    setCapturedSnapshot(simulatedSnapshot);
    onShowToast?.('📸 Evidentiary Video Frame Snapshot Captured & Geotagged', 'success');
  };

  // Complete and Seal VC Session
  const handleCompleteCall = async () => {
    if (!activeSession?.sessionId) return;
    try {
      setIsSubmitting(true);
      await vcApi.complete({
        sessionId: activeSession.sessionId,
        findingsSummary: findingsNotes || `Surprise Video Conference conducted with ${currentParticipant.name} (${participantType}). Physical presence verified.`,
        complianceVerdict,
        snapshotUrl: capturedSnapshot || undefined,
        checklist,
      });

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      setIsCompleted(true);
      onShowToast?.('✓ Surprise VC Inspection sealed with SHA-256 cryptographic audit token!', 'success');
    } catch (err: any) {
      onShowToast?.(err.message || 'Failed to finalize session.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl border border-indigo-500/40 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Strip */}
        <div className="bg-slate-950/90 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Video className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black tracking-tight text-white">
                  DoSJE Surprise Video Conference (VC) Station
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  GIGW 3.0 SECURE VC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Department of Social Justice &amp; Empowerment • Random On-Site Connectivity Protocol
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Station"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!isConnected && !isCompleted ? (
            /* PRE-CALL CONFIGURATION VIEW */
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>1. Select Target Institute / Welfare Project</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Choose any grant-funded NGO running under DoSJE schemes (NAPDDR, AVYAY, DDRS, PM-AJAY, SMILE).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePickRandomInstitute}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🎲 Pick Random Institute</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Target Institute:</label>
                    <select
                      value={selectedNgoId}
                      onChange={(e) => setSelectedNgoId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {ngos.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} — {n.district} ({n.scheme || n.sector})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/80 text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">DARPAN ID:</span>
                      <span className="text-white font-bold">{selectedNgo?.documents?.darpanId || selectedNgo?.regNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheme:</span>
                      <span className="text-amber-300 font-bold">{selectedNgo?.scheme || selectedNgo?.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compliance Score:</span>
                      <span className="text-emerald-400 font-bold">{selectedNgo?.complianceScore || 85}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participant Selection */}
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>2. Select On-Site Surprise Call Participant</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      type: 'BENEFICIARY' as const,
                      title: 'Random Beneficiary',
                      badge: 'High Impact',
                      desc: 'Direct interaction with elderly, patient, or student.',
                      color: 'border-emerald-500/80 bg-emerald-950/20 text-emerald-300',
                    },
                    {
                      type: 'STAFF' as const,
                      title: 'On-Duty Staff',
                      badge: 'Roster Check',
                      desc: 'Verify presence of counselor, doctor, or nurse.',
                      color: 'border-blue-500/80 bg-blue-950/20 text-blue-300',
                    },
                    {
                      type: 'INCHARGE' as const,
                      title: 'Project In-Charge',
                      badge: 'Administration',
                      desc: 'Verify institutional books, registers, and facilities.',
                      color: 'border-purple-500/80 bg-purple-950/20 text-purple-300',
                    },
                  ].map((p) => (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => setParticipantType(p.type)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        participantType === p.type
                          ? 'border-2 border-blue-500 bg-blue-900/30 ring-2 ring-blue-500/40 shadow-md'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">{p.title}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${p.color}`}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{p.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Participant Details Preview */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-600 shrink-0">
                    <img src={currentParticipant.avatar} alt="Participant" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{currentParticipant.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{currentParticipant.role}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Secure Dial: {currentParticipant.phone}</div>
                  </div>
                </div>
              </div>

              {/* Start Call CTA */}
              <button
                type="button"
                onClick={handleStartCall}
                disabled={isCalling}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCalling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Establishing Encrypted NIC GovNet Link...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 text-amber-300" />
                    <span>Connect Surprise Video Call (VC) to Facility</span>
                  </>
                )}
              </button>
            </div>
          ) : isCompleted ? (
            /* CALL COMPLETED DOSSIER SUMMARY VIEW */
            <div className="space-y-4 max-w-2xl mx-auto py-4 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Surprise Video Conference Sealed &amp; Recorded</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Audit evidence, live frame capture, and on-call checklist have been cryptographically committed to the central DoSJE monitoring database.
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Institute:</span>
                  <span className="text-white font-bold">{selectedNgo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Participant:</span>
                  <span className="text-white">{currentParticipant.name} ({participantType})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Call Duration:</span>
                  <span className="text-emerald-400 font-bold">{formatDuration(callDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Compliance Verdict:</span>
                  <span className="text-amber-300 font-bold">{complianceVerdict}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session Token:</span>
                  <span className="text-blue-300 font-bold">{activeSession?.sessionToken}</span>
                </div>
              </div>

              {capturedSnapshot && (
                <div className="w-48 mx-auto rounded-xl overflow-hidden border border-slate-600 shadow-md">
                  <img src={capturedSnapshot} alt="Evidence" className="w-full h-auto" />
                  <div className="bg-black/80 py-1 text-[9px] font-mono text-slate-300">Geotagged Video Frame</div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            /* ACTIVE VIDEO CONFERENCE VIEWPORT */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Live Video Feed */}
              <div className="lg:col-span-7 space-y-3">
                <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-800 shadow-2xl">
                  {/* Real WebCam Video Element */}
                  {videoSource === 'DEVICE_CAMERA' && !isVideoOff ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Simulated Ground Reality Feed */
                    <div className="w-full h-full relative">
                      <img
                        src={currentParticipant.avatar}
                        alt="Participant Feed"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
                    </div>
                  )}

                  {/* Top HUD Overlay */}
                  <div className="absolute top-2.5 inset-x-3 flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE VC • {formatDuration(callDuration)}</span>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30">
                      <ShieldCheck className="w-3 h-3 text-blue-400" />
                      <span>TLS 1.3 ENCRYPTED</span>
                    </div>
                  </div>

                  {/* Bottom Cryptographic Geolocation Watermark */}
                  <div className="absolute bottom-2.5 inset-x-3 bg-black/80 backdrop-blur-xs p-2 rounded-xl text-[9px] font-mono text-slate-300 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <div>
                      <span className="text-amber-300 font-bold">📍 {selectedNgo.name}</span>
                      <span className="block text-slate-400">
                        {selectedNgo.coordinates?.lat.toFixed(4)}°N, {selectedNgo.coordinates?.lng.toFixed(4)}°E (±3.5m)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold">{selectedNgo.documents?.darpanId || selectedNgo.regNumber}</span>
                      <span className="block text-slate-400">Participant: {currentParticipant.name}</span>
                    </div>
                  </div>
                </div>

                {/* Call Action Bar */}
                <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isMuted ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      }`}
                      title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                    >
                      {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVideoSource(videoSource === 'DEVICE_CAMERA' ? 'SIMULATED_GROUND' : 'DEVICE_CAMERA')}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-[10px] font-bold cursor-pointer"
                      title="Switch Video Source"
                    >
                      {videoSource === 'DEVICE_CAMERA' ? 'Switch to Ground Feed' : 'Switch to Device Cam'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Evidence Snapshot</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCompleteCall}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>End &amp; Seal VC</span>
                    </button>
                  </div>
                </div>

                {/* Evidence Snapshot Preview if taken */}
                {capturedSnapshot && (
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-emerald-500/40 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/60 shrink-0">
                        <img src={capturedSnapshot} alt="Snapshot" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Snapshot Captured</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Geotagged &amp; SHA-256 Stamped</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">✓ Ready for Dossier</span>
                  </div>
                )}
              </div>

              {/* Right Column: Live On-Call Audit Verification Checklist */}
              <div className="lg:col-span-5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      <span>On-Call Audit Checklist</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">DoSJE Mandate</span>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2 pt-2 text-xs">
                    <label className="flex items-start space-x-2.5 text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={checklist.physicalPresenceConfirmed}
                        onChange={(e) => setChecklist({ ...checklist, physicalPresenceConfirmed: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-white block">Physical Presence Verified</span>
                        <span className="text-[10px] text-slate-400">Participant is live at the registered premises.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={checklist.identityVerifiedAadhaar}
                        onChange={(e) => setChecklist({ ...checklist, identityVerifiedAadhaar: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-white block">Identity &amp; Bio-ID Authenticated</span>
                        <span className="text-[10px] text-slate-400">Aadhaar / DARPAN registration documents confirmed.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={checklist.cleanlinessAndMealsSatisfactory}
                        onChange={(e) => setChecklist({ ...checklist, cleanlinessAndMealsSatisfactory: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-white block">Food, Bedding &amp; Medicine Available</span>
                        <span className="text-[10px] text-slate-400">Beneficiary confirms regular meals &amp; basic care.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 text-slate-300 cursor-pointer p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={checklist.noCoercionReported}
                        onChange={(e) => setChecklist({ ...checklist, noCoercionReported: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-white block">Zero Extortion / Coercion Reported</span>
                        <span className="text-[10px] text-slate-400">Beneficiary confirms no unauthorized financial demands.</span>
                      </div>
                    </label>
                  </div>

                  {/* Findings Notes */}
                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-bold text-slate-400">Official Observations / Grievance:</label>
                    <textarea
                      rows={2}
                      value={findingsNotes}
                      onChange={(e) => setFindingsNotes(e.target.value)}
                      placeholder="e.g. Inmate confirms 24 residents present. Daily food ledger verified..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Verdict Selector */}
                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-bold text-slate-400">Preliminary VC Audit Verdict:</label>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      {[
                        { id: 'SATISFACTORY', label: 'Satisfactory', color: 'bg-emerald-600 text-white' },
                        { id: 'DEFICIENT_WARNING', label: 'Deficient', color: 'bg-amber-600 text-white' },
                        { id: 'CRITICAL_SHOW_CAUSE', label: 'Critical Show-Cause', color: 'bg-rose-600 text-white' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setComplianceVerdict(v.id as any)}
                          className={`p-1.5 rounded-lg font-bold text-center cursor-pointer transition-colors ${
                            complianceVerdict === v.id ? v.color : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCompleteCall}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit VC Inspection Findings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
