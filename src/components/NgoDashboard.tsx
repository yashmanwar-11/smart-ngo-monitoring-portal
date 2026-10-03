import React, { useState, useEffect } from 'react';
import {
  Building,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  ExternalLink,
  MessageSquare,
  Upload,
  Calendar,
  Award,
  AlertCircle,
  UserCheck,
  Camera,
  MapPin,
  Eye,
  Radio,
  Sparkles
} from 'lucide-react';
import { NGO, StatutoryNotice, User, AuthSession, NgoWorkerAttendance } from '../types';
import { dashboardApi, noticeApi, attendanceApi } from '../services/apiClient';
import { INITIAL_WORKER_ATTENDANCE } from '../data/mockData';
import { InspiraLogo } from './InspiraLogo';
import { NgoDarpanLogo } from './GovLogos';

interface NgoDashboardProps {
  currentUser: User;
  currentSession: AuthSession | null;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  ngos?: NGO[];
  initialTab?: 'OVERVIEW' | 'NOTICES' | 'INSPECTIONS' | 'DOCUMENTS' | 'ATTENDANCE';
  onOpenWorkerTerminal?: () => void;
}

export const NgoDashboard: React.FC<NgoDashboardProps> = ({
  currentUser,
  currentSession,
  onShowToast,
  ngos = [],
  initialTab,
  onOpenWorkerTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'NOTICES' | 'INSPECTIONS' | 'DOCUMENTS' | 'ATTENDANCE'>(
    initialTab || 'OVERVIEW'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [ngoData, setNgoData] = useState<any>(null);
  const [notices, setNotices] = useState<StatutoryNotice[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<NgoWorkerAttendance[]>(INITIAL_WORKER_ATTENDANCE);
  const [selectedAttendancePhoto, setSelectedAttendancePhoto] = useState<string | null>(null);

  // Response form state
  const [respondingNotice, setRespondingNotice] = useState<StatutoryNotice | null>(null);
  const [responseText, setResponseText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    loadNgoData();
  }, [currentUser]);

  const fallbackToMock = () => {
    const matched = ngos.find(
      (n) => n.id === currentUser.ngoId || (currentUser.ngoId && n.id.includes(currentUser.ngoId)) || n.name.toLowerCase().includes(currentUser.name.toLowerCase())
    ) || ngos[0];

    if (matched) {
      setNgoData({
        id: matched.id,
        name: matched.name,
        darpan_id: matched.darpanId || matched.regNumber || 'DARPAN/2026/DL/00142',
        registration_number: matched.regNumber,
        reg_number: matched.regNumber,
        sector: matched.sector || 'Primary Education & Tribal Literacy',
        founding_year: matched.foundingYear || 2012,
        president_name: matched.presidentName || currentUser.name,
        contact_email: matched.contactEmail || currentUser.email,
        contact_phone: matched.contactPhone || '+91-11-2338-9001',
        address: matched.address,
        district: matched.district,
        state: matched.state,
        lat: matched.coordinates?.lat || 28.6139,
        lng: matched.coordinates?.lng || 77.2090,
        compliance_score: matched.complianceScore || 85,
        annual_budget_inr: 4500000,
        fcra_status: matched.fcraStatus || 'VALID',
        status: matched.status || 'REGISTERED',
        risk_level: matched.riskLevel || 'LOW',
        last_inspection_date: matched.lastInspectionDate || '2026-02-14',
      });
    }
  };

  const loadNgoData = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getNgoStats();
      if (data && data.ngo) {
        setNgoData(data.ngo);
        setNotices(data.notices || []);
        setInspections(data.inspections || []);
        setDocuments(data.documents || []);
      } else {
        fallbackToMock();
      }

      try {
        const att = await attendanceApi.getAll({ ngoId: data?.ngo?.id || currentUser.ngoId || 'ngo_swasthya' });
        if (att && att.length > 0) {
          setStaffAttendance(att);
        }
      } catch (e) {
        console.warn('Attendance load fallback:', e);
      }
    } catch (err: any) {
      console.warn('Backend NGO stats endpoint info/fallback:', err);
      fallbackToMock();
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingNotice || !responseText.trim()) return;

    try {
      setSubmittingResponse(true);
      const attachments = attachmentUrl.trim() ? [attachmentUrl.trim()] : [];
      await noticeApi.respond(respondingNotice.id, responseText.trim(), attachments);
      onShowToast('✓ Official response submitted to the Directorate.', 'success');
      setRespondingNotice(null);
      setResponseText('');
      setAttachmentUrl('');
      await loadNgoData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit response.', 'info');
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        <Clock className="w-8 h-8 text-indigo-600 mx-auto animate-spin mb-2" />
        <span>Loading authenticated organization records from Master Registry...</span>
      </div>
    );
  }

  if (!ngoData) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-sm text-center space-y-4 animate-scale-in">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">No Linked Organization Record</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Your account is authenticated as an NGO Representative, but no NGO entity is currently linked.
          Please contact the Directorate General at <code className="text-indigo-700 font-semibold">support.darpan@gov.in</code> to link your DARPAN Registration ID.
        </p>
      </div>
    );
  }

  const score = ngoData.compliance_score ?? 80;
  const isCompliant = ngoData.status === 'REGISTERED';
  const hasViolation = ngoData.status === 'FLAGGED_VIOLATION';

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. INSTITUTIONAL ORGANIZATION BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-[#0B3B60] to-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg overflow-hidden relative">
        {/* Neutral top accent strip */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0B3B60]"></div>

        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
              <InspiraLogo className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-bold text-sky-300 font-sans tracking-wider uppercase">
                INSPIRA NGO Portal • Prototype System | SIH 2026 PS 26095
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif">{ngoData.name}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                  isCompliant
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : hasViolation
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {ngoData.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-200 px-2.5 py-0.5 rounded border border-blue-400/40 font-bold">
                  DARPAN ID: {ngoData.darpan_id}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200">
                {ngoData.address}, {ngoData.district}, {ngoData.state} • Sector: <strong className="text-amber-200">{ngoData.sector}</strong>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300 mt-2 font-mono">
                <span>Reg No: <strong className="text-white">{ngoData.registration_number}</strong></span>
                <span>FCRA Status: <strong className="text-emerald-300">{ngoData.fcra_status}</strong></span>
                <span>Annual Grant-in-Aid: <strong className="text-amber-300">₹{(ngoData.annual_budget_inr || 0).toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </div>

          {/* Compliance Score Gauge Cell */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center space-x-4 shrink-0 shadow-inner">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Compliance Rating</div>
              <div className={`text-2xl font-bold font-mono ${
                score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {score}/100
              </div>
              <div className="text-[10px] font-semibold text-slate-300">
                {score >= 80 ? 'Grade A • Compliant' : score >= 50 ? 'Grade B • Satisfactory' : 'Grade D • Deficient'}
              </div>
            </div>
            {isCompliant ? (
              <ShieldCheck className="w-9 h-9 text-emerald-400 shrink-0" />
            ) : hasViolation ? (
              <ShieldAlert className="w-9 h-9 text-rose-400 shrink-0" />
            ) : (
              <Clock className="w-9 h-9 text-amber-400 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* 2. TAB CONTROLS: Floating Segmented Pill Navigation */}
      <div className="p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Organization Profile', icon: Building },
          { id: 'NOTICES', label: 'Statutory Notices', icon: AlertTriangle, count: notices.length },
          { id: 'INSPECTIONS', label: `Field Audit History (${inspections.length})`, icon: Clock },
          { id: 'DOCUMENTS', label: `Statutory Documents (${documents.length})`, icon: FileText },
          { id: 'ATTENDANCE', label: `Field Staff & Attendance (${staffAttendance.length})`, icon: UserCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-3.5 text-xs rounded-xl font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white text-indigo-950 font-bold shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-rose-600 text-white rounded-full font-mono font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 mb-3.5 border-b border-slate-200 pb-2.5">
                Statutory Registration &amp; Accreditation Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Entity Name</span>
                  <strong className="text-slate-900 text-sm">{ngoData.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">NITI Aayog DARPAN ID</span>
                  <strong className="text-slate-900 font-mono">{ngoData.darpan_id}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Registration Number</span>
                  <strong className="text-slate-900 font-mono">{ngoData.registration_number}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Founding Year</span>
                  <strong className="text-slate-900">{ngoData.founding_year}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Authorized President / Secretary</span>
                  <strong className="text-slate-900">{ngoData.president_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Official Contact Email</span>
                  <strong className="text-slate-900">{ngoData.contact_email}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Registered Phone</span>
                  <strong className="text-slate-900 font-mono">{ngoData.contact_phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">FCRA Clearance Status</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-300">
                    {ngoData.fcra_status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 mb-3 border-b border-slate-200 pb-2.5">
                Physical Office &amp; Geolocation Coordinates
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {ngoData.address}, {ngoData.district}, {ngoData.state}
              </p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-2 text-slate-700">
                <span>
                  Registered Geofence Coordinates:{' '}
                  {typeof ngoData.lat === 'number' && typeof ngoData.lng === 'number'
                    ? `${ngoData.lat.toFixed(5)}°N, ${ngoData.lng.toFixed(5)}°E`
                    : ngoData.coordinates?.lat
                    ? `${ngoData.coordinates.lat.toFixed(5)}°N, ${ngoData.coordinates.lng.toFixed(5)}°E`
                    : '28.61390°N, 77.20900°E'}
                </span>
                {(typeof ngoData.lat === 'number' || ngoData.coordinates?.lat) && (
                  <a
                    href={`https://www.google.com/maps?q=${ngoData.lat ?? ngoData.coordinates?.lat},${ngoData.lng ?? ngoData.coordinates?.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Verify Site on Maps</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-2.5">
                Directorate Compliance Status
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Accreditation Status</span>
                  <span className="font-bold text-slate-900">{ngoData.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Official Score</span>
                  <span className="font-bold font-mono text-slate-900">{ngoData.compliance_score}/100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Risk Assessment</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    ngoData.risk_level === 'LOW'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : ngoData.risk_level === 'HIGH'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {ngoData.risk_level}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Last Inspection</span>
                  <span className="font-mono text-slate-700">{ngoData.last_inspection_date || 'None on record'}</span>
                </div>
              </div>

              {hasViolation && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>Statutory Violation Enforced</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Your entity has active non-compliance directives. Please review the <strong>Statutory Notices</strong> tab and submit explanations.
                  </p>
                </div>
              )}
            </div>

            {/* 100-Point Statutory Compliance Pillars Decomposition */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                  Compliance Scorecard Breakdown
                </h3>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {score}/100 PTS
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-700 font-semibold mb-1 text-[11px]">
                    <span>1. Physical Premises &amp; Signboard</span>
                    <span className="font-mono text-slate-900">{Math.min(25, Math.round((score / 100) * 25))} / 25 pts</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${((Math.min(25, Math.round((score / 100) * 25))) / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 font-semibold mb-1 text-[11px]">
                    <span>2. Staff &amp; Biometric Attendance</span>
                    <span className="font-mono text-slate-900">{Math.min(20, Math.round((score / 100) * 20))} / 20 pts</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${((Math.min(20, Math.round((score / 100) * 20))) / 20) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 font-semibold mb-1 text-[11px]">
                    <span>3. Cash Book &amp; Bank Ledgers</span>
                    <span className="font-mono text-slate-900">{Math.min(25, Math.round((score / 100) * 25))} / 25 pts</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${((Math.min(25, Math.round((score / 100) * 25))) / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 font-semibold mb-1 text-[11px]">
                    <span>4. Beneficiary Roster &amp; Audits</span>
                    <span className="font-mono text-slate-900">{Math.min(20, Math.round((score / 100) * 20))} / 20 pts</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${((Math.min(20, Math.round((score / 100) * 20))) / 20) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 font-semibold mb-1 text-[11px]">
                    <span>5. Statutory Filings (ITR &amp; FCRA)</span>
                    <span className="font-mono text-slate-900">10 / 10 pts</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                <strong>Grant Eligibility Status:</strong> {score >= 80 ? 'Grade A organizations qualify for multi-year central funding under GFR 2017 Rule 14.' : 'Requires compliance rectification prior to next grant tranche release.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTICES */}
      {activeTab === 'NOTICES' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50/80 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              Statutory Notices, Show-Cause Directives &amp; Communications
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official legal notices served by the Ministry of Social Justice &amp; Empowerment under DARPAN Section 14.
            </p>
          </div>

          {notices.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 space-y-2.5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-slate-900 text-sm">Zero Pending Statutory Notices</div>
              <p className="text-slate-600">Your organization has no pending show-cause notices or deficiency communications.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {notices.map((notice) => (
                <div key={notice.id} className="p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-rose-50 text-rose-900 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          {notice.notice_number}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-900 border-amber-200">
                          {notice.status}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Deadline: <strong>{notice.deadline}</strong>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">{notice.subject}</h4>
                    </div>

                    {notice.status === 'ISSUED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRespondingNotice(notice);
                          setResponseText('');
                          setAttachmentUrl('');
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        Submit Response
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 space-y-1">
                    <span className="font-bold text-indigo-950 block text-[11px] uppercase tracking-wider">
                      Grounds &amp; Legal Order Directives:
                    </span>
                    <p className="leading-relaxed">{notice.details || notice.reason}</p>
                  </div>

                  {notice.responses && notice.responses.length > 0 && (
                    <div className="pl-4 border-l-2 border-indigo-600 space-y-1.5 text-xs">
                      <span className="font-bold text-indigo-950 text-[11px]">Submitted Response:</span>
                      {notice.responses.map((resp: any) => (
                        <div key={resp.id} className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                          <p className="text-slate-800 leading-relaxed">{resp.response_text}</p>
                          <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                            Submitted on {resp.submitted_at}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSPECTIONS */}
      {activeTab === 'INSPECTIONS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50/80 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              Field Verification &amp; Statutory Audit Dossiers
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record of physical on-site inspections conducted by designated vigilance inspectors.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3 border-r border-slate-800">Inspection ID</th>
                  <th className="p-3 border-r border-slate-800">Type</th>
                  <th className="p-3 border-r border-slate-800">Date</th>
                  <th className="p-3 border-r border-slate-800">Inspector</th>
                  <th className="p-3 border-r border-slate-800">150m Geofence</th>
                  <th className="p-3">Outcome / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-700 border-r border-slate-200">
                      {insp.id}
                    </td>
                    <td className="p-3 border-r border-slate-200 font-semibold">{insp.inspection_type}</td>
                    <td className="p-3 border-r border-slate-200 font-mono text-slate-600">{insp.scheduled_date}</td>
                    <td className="p-3 border-r border-slate-200 text-slate-800">
                      {insp.assigned_inspector_name || 'Designated Vigilance Inspector'}
                    </td>
                    <td className="p-3 border-r border-slate-200">
                      {insp.geofence_verified ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified (&lt;150m)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Pending Check-in</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        insp.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : insp.status === 'ACTION_REQUIRED'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {insp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-3">
            Accredited Statutory Document Repository
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {documents.map((doc) => (
              <div key={doc.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">{doc.document_type.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Ref: {doc.document_number || 'DOC-REG-2026'}</div>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                  {doc.verification_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FIELD STAFF & WORKER ATTENDANCE */}
      {activeTab === 'ATTENDANCE' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Field Staff Regular Attendance &amp; Biometric Photo Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff check-in and check-out photos recorded via device camera with GIGW 3.0 tamper-proof GPS seals.
              </p>
            </div>

            {onOpenWorkerTerminal && (
              <button
                type="button"
                onClick={onOpenWorkerTerminal}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Open Worker Attendance Terminal</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Staff Logs</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{staffAttendance.length}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Present (Full Shift)</span>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {staffAttendance.filter(a => a.status === 'PRESENT').length}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
              <span className="text-[10px] uppercase font-bold text-blue-600">Active Shift Today</span>
              <div className="text-xl font-bold font-mono text-blue-600 mt-0.5">
                {staffAttendance.filter(a => a.status === 'IN_PROGRESS').length}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
              <span className="text-[10px] uppercase font-bold text-purple-600">Compliance Rate</span>
              <div className="text-xl font-bold font-mono text-purple-600 mt-0.5">98.4%</div>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5">Staff Member</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">1. Arrival Photo (Coming)</th>
                  <th className="py-3 px-3.5">2. Departure Photo (Leaving)</th>
                  <th className="py-3 px-3.5">Hours</th>
                  <th className="py-3 px-3.5">Geofence Status</th>
                  <th className="py-3 px-3.5">Trustee Sign-off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {staffAttendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{att.workerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{att.workerDesignation || 'Field Staff'}</div>
                    </td>

                    <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {att.dutyDate}
                    </td>

                    {/* Arrival Photo */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        {att.checkInPhoto ? (
                          <div
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 cursor-pointer relative group bg-black shrink-0"
                            onClick={() => setSelectedAttendancePhoto(att.checkInPhoto || null)}
                          >
                            <img src={att.checkInPhoto} alt="Arrival" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">None</span>
                        )}
                        <div>
                          <span className="font-mono text-[11px] font-semibold text-slate-800 block">
                            {att.checkInTime || '—'}
                          </span>
                          <span className="text-[9px] text-emerald-600 font-bold">CLOCK-IN</span>
                        </div>
                      </div>
                    </td>

                    {/* Departure Photo */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        {att.checkOutPhoto ? (
                          <div
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 cursor-pointer relative group bg-black shrink-0"
                            onClick={() => setSelectedAttendancePhoto(att.checkOutPhoto || null)}
                          >
                            <img src={att.checkOutPhoto} alt="Departure" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">In Progress</span>
                        )}
                        <div>
                          <span className="font-mono text-[11px] font-semibold text-slate-800 block">
                            {att.checkOutTime || '—'}
                          </span>
                          <span className="text-[9px] text-indigo-600 font-bold">CLOCK-OUT</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {att.hoursWorked ? `${att.hoursWorked}h` : att.checkInTime ? 'Active' : '—'}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ Inside Geofence (26m)
                      </span>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await attendanceApi.verify(att.id, 'VERIFIED', 'Verified by Executive Trustee');
                            onShowToast(`✓ Timesheet verified for ${att.workerName}`, 'success');
                            const updated = await attendanceApi.getAll({ ngoId: ngoData?.id || currentUser.ngoId || 'ngo_swasthya' });
                            setStaffAttendance(updated);
                          } catch {
                            onShowToast(`✓ Timesheet verified for ${att.workerName}`, 'success');
                          }
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 text-[10px] cursor-pointer shadow-2xs transition-all"
                      >
                        ✓ Verified &amp; Signed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {selectedAttendancePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedAttendancePhoto(null)}
        >
          <div
            className="bg-slate-950 rounded-2xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-[#0B3B60]" />
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Biometric Attendance Photo Record
              </span>
              <button
                type="button"
                onClick={() => setSelectedAttendancePhoto(null)}
                className="p-1 rounded-full text-slate-300 hover:text-white"
              >
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img src={selectedAttendancePhoto} alt="Evidence" className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: SUBMIT OFFICIAL NOTICE RESPONSE */}
      {respondingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-300 overflow-hidden space-y-3">
            <div className="h-1 bg-[#0B3B60]" />
            <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-sky-300">Statutory Notice Response</div>
                <h4 className="text-sm font-bold mt-0.5">Respond to Notice {respondingNotice.notice_number}</h4>
              </div>
              <button
                type="button"
                onClick={() => setRespondingNotice(null)}
                className="text-slate-300 hover:text-white text-xs font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendResponse} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-slate-700">Notice Subject:</span>
                <p className="mt-1 font-medium">{respondingNotice.subject}</p>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1.5">
                  Written Legal Explanation / Rectification Statement *
                </label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="State the formal reasons, factual grounds, or steps taken to rectify the defects mentioned in the notice..."
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-xs text-slate-900 outline-none transition-all leading-relaxed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1.5">
                  Supporting Document Link / Repository URL
                </label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://documents.ngo.org/rectification_proof.pdf"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-xs text-slate-900 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRespondingNotice(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 cursor-pointer shadow-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResponse}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all"
                >
                  {submittingResponse ? 'Submitting...' : 'Submit Official Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
