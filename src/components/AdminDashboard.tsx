import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  FileText,
  Activity,
  Plus,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Lock,
  KeyRound,
  ShieldAlert,
  Radio,
  FileSpreadsheet,
  RotateCw,
  Send,
  X,
  Video,
  Zap,
  Download,
  Flame,
  Shuffle,
  Sparkles,
  Printer
} from 'lucide-react';
import { NGO, User, InspectionRecord, Complaint, NgoApplication, GovernmentInspectionTask, AuthSession, StatutoryNotice, AuditLogEntry } from '../types';
import { noticeApi, dashboardApi, cameraApi } from '../services/apiClient';
import { InteractiveMap } from './InteractiveMap';
import { GovernmentInspectionMaster } from './GovernmentInspectionMaster';
import { CctvManagementSection } from './cctv/CctvManagementSection';
import { AnomalyAnalyticsSection } from './AnomalyAnalyticsSection';
import { EmblemOfIndia } from './EmblemOfIndia';
import { DigitalIndiaLogo, EPramaanLogo, NicLogo } from './GovLogos';

interface AdminDashboardProps {
  currentAdmin?: User;
  currentSession?: AuthSession | null;
  ngos: NGO[];
  officers: User[];
  inspections: InspectionRecord[];
  complaints: Complaint[];
  applications: NgoApplication[];
  govTasks?: GovernmentInspectionTask[];
  onAssignGovTask?: (taskId: string, inspector: User) => void;
  onRefreshGovTasks?: () => void;
  onOpenAssignModal: (ngoId?: string) => void;
  onOpenRandomVc?: (ngoId?: string) => void;
  onOpenRandomDutyModal?: (scheme?: string) => void;
  onViewInspectionDetails: (inspection: InspectionRecord) => void;
  onApproveApplication: (appId: string) => void;
  onRejectApplication: (appId: string, reason: string) => void;
  onUpdateComplaintStatus: (complaintId: string, status: Complaint['status'], remarks?: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info') => void;
  initialTab?: 'OVERVIEW' | 'INSPECTIONS' | 'NGOS' | 'OFFICERS' | 'COMPLAINTS' | 'APPLICATIONS' | 'NOTICES' | 'AUDIT_LOGS' | 'CCTV_MANAGEMENT' | 'DOSJE_ANALYTICS';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  currentSession,
  ngos,
  officers,
  inspections,
  complaints,
  applications,
  govTasks = [],
  onAssignGovTask,
  onRefreshGovTasks,
  onOpenAssignModal,
  onOpenRandomVc,
  onOpenRandomDutyModal,
  onViewInspectionDetails,
  onApproveApplication,
  onRejectApplication,
  onUpdateComplaintStatus,
  onShowToast,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INSPECTIONS' | 'NGOS' | 'OFFICERS' | 'COMPLAINTS' | 'APPLICATIONS' | 'NOTICES' | 'AUDIT_LOGS' | 'CCTV_MANAGEMENT' | 'DOSJE_ANALYTICS'>(
    initialTab || 'INSPECTIONS'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedNgoForMap, setSelectedNgoForMap] = useState<NGO | null>(null);
  const [inspectionViewMode, setInspectionViewMode] = useState<'GOV_MASTER' | 'LEGACY_LOGS'>('GOV_MASTER');

  // Statutory Notices & Audit Logs state
  const [notices, setNotices] = useState<StatutoryNotice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [isCreateNoticeOpen, setIsCreateNoticeOpen] = useState(false);

  const [newNoticeTargetNgoId, setNewNoticeTargetNgoId] = useState(ngos[0]?.id || '');
  const [newNoticeSubject, setNewNoticeSubject] = useState('');
  const [newNoticeType, setNewNoticeType] = useState('SHOW_CAUSE_NOTICE');
  const [newNoticeReason, setNewNoticeReason] = useState('DARPAN Section 14 Violation');
  const [newNoticeDetails, setNewNoticeDetails] = useState('');
  const [newNoticeDeadlineDays, setNewNoticeDeadlineDays] = useState(14);

  const fetchNotices = async () => {
    setIsLoadingNotices(true);
    try {
      const data = await noticeApi.getAll();
      setNotices(data);
    } catch (e) {
      console.warn('Failed to load notices:', e);
    } finally {
      setIsLoadingNotices(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingAuditLogs(true);
    try {
      const data = await dashboardApi.getAuditLogs({ limit: 100 });
      setAuditLogs(data);
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  const [cctvStats, setCctvStats] = useState<{ total: number; live: number }>({ total: 0, live: 0 });
  const [adminStats, setAdminStats] = useState<any>(null);

  const fetchCctvStats = async () => {
    try {
      const telem = await cameraApi.getTelemetry();
      if (telem?.telemetry) {
        setCctvStats({ total: telem.telemetry.total, live: telem.telemetry.live });
      }
    } catch {
      // Ignore if offline
    }
  };

  const fetchAdminStats = async () => {
    try {
      const data = await dashboardApi.getAdminStats();
      if (data?.kpis) {
        setAdminStats(data.kpis);
      }
    } catch {
      // Ignore if offline
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchAuditLogs();
    fetchCctvStats();
    fetchAdminStats();
  }, []);

  const handleCreateNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTargetNgoId || !newNoticeSubject.trim()) return;

    try {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + Number(newNoticeDeadlineDays));
      const deadline = deadlineDate.toISOString().split('T')[0];

      await noticeApi.create({
        ngoId: newNoticeTargetNgoId,
        subject: newNoticeSubject.trim(),
        noticeType: newNoticeType,
        reason: newNoticeReason,
        details: newNoticeDetails.trim(),
        deadline,
      });

      if (onShowToast) onShowToast('✓ Statutory Notice served under Section 14 with 14-day compliance window.', 'success');
      setIsCreateNoticeOpen(false);
      setNewNoticeSubject('');
      setNewNoticeDetails('');
      fetchNotices();
      fetchAuditLogs();
    } catch (err: any) {
      if (onShowToast) onShowToast(err.message || 'Failed to serve notice.', 'info');
    }
  };

  // Export Master Registry to CSV
  const handleExportMasterCsv = () => {
    const headers = [
      'DARPAN ID',
      'Organization Name',
      'Sector',
      'District',
      'State',
      'Annual Budget (INR)',
      'Compliance Score',
      'FCRA Status',
      'Status',
      'Reported Complaints',
      'Last Inspection Date'
    ];
    const rows = ngos.map((n) => [
      `"${n.documents?.darpanId || n.regNumber}"`,
      `"${n.name.replace(/"/g, '""')}"`,
      `"${n.sector}"`,
      `"${n.district}"`,
      `"${n.state}"`,
      n.annualBudgetInr || 2500000,
      `${n.complianceScore || 95}%`,
      `"${n.fcraStatus || 'VALID'}"`,
      `"${n.status}"`,
      n.reportedComplaintsCount || 0,
      `"${n.lastInspectionDate || 'N/A'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `National_NGO_Master_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast?.('✓ National NGO Master Registry exported to CSV successfully.', 'success');
  };

  // Automated AI Risk Scoring Engine
  const getRiskScore = (ngo: NGO) => {
    let score = 15;
    const compScore = ngo.complianceScore ?? 100;
    if (compScore < 60) score += 45;
    else if (compScore < 80) score += 25;

    if (ngo.status === 'FLAGGED_VIOLATION') score += 30;
    else if (ngo.status === 'UNDER_INSPECTION') score += 15;

    score += Math.min(30, (ngo.reportedComplaintsCount || 0) * 12);
    if (ngo.fcraStatus === 'UNDER_REVIEW') score += 15;
    if (ngo.fcraStatus === 'SUSPENDED') score += 35;
    return Math.min(100, Math.max(10, score));
  };

  const highRiskNgos = [...ngos]
    .map((n) => ({ ...n, computedRisk: getRiskScore(n) }))
    .filter((n) => n.computedRisk >= 40)
    .sort((a, b) => b.computedRisk - a.computedRisk)
    .slice(0, 3);

  // Statistics with authoritative backend SQLite synchronization
  const totalNgos = adminStats?.totalNgos ?? ngos.length;
  const verifiedNgos = ngos.filter((n) => n.status === 'REGISTERED').length;
  const flaggedNgos = adminStats?.flaggedViolations ?? ngos.filter((n) => n.status === 'FLAGGED_VIOLATION').length;
  const activeInspectionsCount = adminStats?.activeAudits ?? inspections.filter(
    (i) => i.status === 'ON_SITE_IN_PROGRESS' || i.status === 'EN_ROUTE'
  ).length;
  const pendingComplaintsCount = adminStats?.openGrievances ?? complaints.filter((c) => c.status === 'PENDING_REVIEW').length;
  const pendingAppsCount = applications.filter((a) => a.status === 'PENDING').length;

  const filteredNgos = ngos.filter((ngo) => {
    const matchesSearch =
      ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'ALL' || ngo.sector === sectorFilter;
    const matchesStatus = statusFilter === 'ALL' || ngo.status === statusFilter;
    return matchesSearch && matchesSector && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Level-5 Directorate General Ministerial Command Header */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0B3B60] to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
        {/* Subtle top national tri-color accent strip */}
        <div className="absolute top-0 left-0 right-0 grid grid-cols-3 h-[3.5px]">
          <div className="bg-[#FF9933]"></div>
          <div className="bg-[#FFFFFF] flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-[#000080]"></div></div>
          <div className="bg-[#138808]"></div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-18 rounded-xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
              <EmblemOfIndia className="w-12 h-16" variant="white" showText={false} />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-amber-300 font-serif tracking-wider uppercase">
                भारत सरकार • Government of India • Ministry of Social Justice &amp; Empowerment
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                  Level 5 • Directorate General (IAS)
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/40">
                  National NGO Vigilance Division
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-950/70 px-2.5 py-0.5 rounded border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  NIC GOVNET TLS 1.3
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-serif">
                {currentAdmin?.name || 'Dr. Rajesh Verma, IAS'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                {currentAdmin?.designation || 'Director General & Joint Secretary (NGO Vigilance & Field Oversight)'}
              </p>
              <p className="text-[11px] text-slate-300 font-mono">
                Directorate ID: <strong className="text-amber-300">{currentAdmin?.badgeNumber || 'GOV-DIR-009'}</strong> • Rule 14 GFR 2017 Regulatory Station
              </p>
            </div>
          </div>

          {/* Right Action Center */}
          <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
            <button
              id="btn-admin-quick-vc"
              onClick={() => {
                onOpenRandomVc?.();
                onShowToast?.('Opening Random Video Conferencing (VC) Connectivity', 'info');
              }}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-indigo-400/40"
            >
              <Video className="w-4 h-4 text-indigo-200" />
              <span>Surprise VC</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            </button>

            <button
              id="btn-admin-quick-duty-allocator"
              onClick={() => {
                onOpenRandomDutyModal?.();
                onShowToast?.('Opening AI Double-Blind Random Duty Allocator', 'info');
              }}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-cyan-400/40"
            >
              <Shuffle className="w-4 h-4 text-cyan-200" />
              <span>AI Duty Allocator</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            </button>

            <button
              id="btn-admin-quick-cctv"
              onClick={() => {
                setActiveTab('CCTV_MANAGEMENT');
                onShowToast?.('Opening Live CCTV Surveillance & Camera Operations', 'info');
              }}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-emerald-400/40"
            >
              <Radio className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>CCTV Video Wall</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>

            <button
              id="btn-admin-assign-inspector"
              onClick={() => onOpenAssignModal()}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer border border-amber-400/40"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>Manual Dispatch</span>
            </button>

            <button
              onClick={handleExportMasterCsv}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-300" />
              <span>Audit Export (CSV)</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Session Metadata Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <span>Session ID: <strong className="text-slate-200">{currentSession?.token?.substring(0, 18) || 'SES-DIR-2026-9811'}...</strong></span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline">Gateway IP: <strong className="text-slate-200">{currentSession?.ipAddress || '10.244.18.91 (NIC)'}</strong></span>
          </div>
          <div className="text-emerald-300 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            2FA Verified • 150m Geofence Enforcement Active
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - High Density Premium Administrative Metric Cells */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered NGOs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-slate-900">{totalNgos}</div>
          </div>
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              ● {verifiedNgos} Compliant
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Audits</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-blue-700">{activeInspectionsCount}</div>
          </div>
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
              Live GPS Tracking
            </span>
          </div>
        </div>

        {/* CCTV Live Surveillance Quick Action Cell */}
        <div
          id="card-admin-cctv-shortcut"
          onClick={() => {
            setActiveTab('CCTV_MANAGEMENT');
            onShowToast?.('Opening Live CCTV Surveillance & Camera Operations', 'info');
          }}
          className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-indigo-500/50 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between group cursor-pointer text-white relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live CCTV
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <Video className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
              <span>{cctvStats.total}</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">({cctvStats.live} Live)</span>
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 group-hover:text-white transition-colors">
              <span>Quick Launch HUD</span>
              <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Field Officers</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-slate-900">{officers.length}</div>
          </div>
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              ● {officers.filter((o) => o.status === 'ON_DUTY').length} On Field
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flagged Violations</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-rose-600">{flaggedNgos}</div>
          </div>
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
              Show-cause issued
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Citizen Grievances</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-purple-700">{complaints.length}</div>
          </div>
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
              {pendingComplaintsCount} Pending Review
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reg Applications</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-teal-700">{applications.length}</div>
          </div>
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
              {pendingAppsCount} Needs Approval
            </span>
          </div>
        </div>
      </div>

      {/* AI VIGILANCE RISK INTELLIGENCE & AUTO-TARGETING HUD */}
      {highRiskNgos.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/20 via-amber-950/10 to-slate-900/40 border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <Zap className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>AI-Assisted Vigilance Risk Engine</span>
                  <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                    DIRECTORATE PRIORITY TARGETS
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Algorithmic risk evaluation based on unresolved citizen grievances, low physical audit scores, and regulatory flags under Rule 14.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 self-start sm:self-auto">
              {highRiskNgos.length} High-Risk Entities Detected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            {highRiskNgos.map((ngo) => (
              <div
                key={ngo.id}
                className="bg-white border border-rose-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ngo.documents?.darpanId || ngo.regNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-600" />
                      Risk Index: {ngo.computedRisk}/100
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{ngo.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    {ngo.district}, {ngo.state} • Sector: {ngo.sector}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(ngo.reportedComplaintsCount || 0) > 0 && (
                      <span className="text-[9px] font-semibold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                        ⚠️ {ngo.reportedComplaintsCount} Grievance(s)
                      </span>
                    )}
                    {(ngo.complianceScore || 100) < 70 && (
                      <span className="text-[9px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                        Score: {ngo.complianceScore}% (Deficient)
                      </span>
                    )}
                    {ngo.status === 'FLAGGED_VIOLATION' && (
                      <span className="text-[9px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-300">
                        Flagged Violation
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenAssignModal(ngo.id)}
                    className="flex-1 px-2.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Dispatch Audit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewNoticeTargetNgoId(ngo.id);
                      setNewNoticeSubject(`Statutory Show-Cause Directive under Section 14 - Discrepancies in ${ngo.name}`);
                      setIsCreateNoticeOpen(true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Notice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modern Segmented Navigation Tabs */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'INSPECTIONS', label: `Government Inspections (${govTasks.length || 55}+ Tasks)`, icon: FileCheck },
          { id: 'DOSJE_ANALYTICS', label: 'DoSJE Scheme & Anomaly Analytics', icon: Sparkles },
          { id: 'CCTV_MANAGEMENT', label: 'CCTV Surveillance & Cameras', icon: Video },
          { id: 'OVERVIEW', label: 'GIS Map & Live Tracking', icon: MapPin },
          { id: 'NGOS', label: `NGO Master Directory (${ngos.length})`, icon: Building2 },
          { id: 'NOTICES', label: `Statutory Notices (${notices.length})`, icon: ShieldAlert },
          { id: 'AUDIT_LOGS', label: `System Audit Logs (${auditLogs.length})`, icon: ShieldCheck },
          { id: 'OFFICERS', label: `Field Officers (${officers.length})`, icon: Users },
          { id: 'COMPLAINTS', label: `Grievances (${complaints.length})`, icon: AlertTriangle },
          { id: 'APPLICATIONS', label: `Approvals (${pendingAppsCount})`, icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-3.5 text-xs font-semibold whitespace-nowrap transition-all rounded-xl cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-700 font-bold shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: DOSJE SCHEME & ANOMALY SURVEILLANCE */}
      {activeTab === 'DOSJE_ANALYTICS' && (
        <div className="animate-slide-up">
          <AnomalyAnalyticsSection
            onLaunchVcWithNgo={(ngoId) => {
              onOpenRandomVc?.(ngoId);
              onShowToast?.('Opening Surprise VC terminal for flagged institute', 'info');
            }}
            onOpenDutyAllocation={(scheme) => {
              onOpenRandomDutyModal?.(scheme);
              onShowToast?.('Opening AI Random Duty Allocation terminal', 'info');
            }}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* TAB CONTENT: CCTV SURVEILLANCE & CAMERA MANAGEMENT */}
      {activeTab === 'CCTV_MANAGEMENT' && (
        <div className="animate-slide-up">
          <CctvManagementSection
            ngos={ngos}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* TAB CONTENT: 1. OVERVIEW & GIS MAP */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4 animate-slide-up">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Live Geospatial GIS Monitoring &amp; Officer GPS Beacon
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time GPS tracking stream from Android Fused Location Provider. Green circles represent statutory 150m anti-fraud geofences.
                </p>
              </div>

              {selectedNgoForMap && (
                <button
                  onClick={() => setSelectedNgoForMap(null)}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Reset Map Zoom
                </button>
              )}
            </div>

            {/* Interactive Map Component */}
            <InteractiveMap
              ngos={ngos}
              officers={officers}
              selectedNgo={selectedNgoForMap}
              onSelectNgo={(ngo) => setSelectedNgoForMap(ngo)}
              heightClass="h-[480px]"
              showAllOfficers={true}
            />

            {/* Quick Map Legend and Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs card-hover-lift">
                <span className="font-bold text-slate-800 block mb-0.5">Real-Time Officer GPS</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Officer pings update periodically with battery status, precision accuracy radius, and speed telemetry.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs card-hover-lift">
                <span className="font-bold text-slate-800 block mb-0.5">Anti-Fraud Geofencing</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Officers cannot start or submit an audit unless physical GPS distance is within 150m of registered premises.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs card-hover-lift">
                <span className="font-bold text-slate-800 block mb-0.5">Camera Watermarking</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Every field photo captured embeds cryptographically signed coordinates, IST timestamp, and officer badge.
                </p>
              </div>
            </div>
          </div>

          {/* Ongoing live audits tracker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Active Field Inspections in Progress
            </h3>
            <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/90 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-3">Audit ID</th>
                    <th className="p-3">Target NGO</th>
                    <th className="p-3">Assigned Officer</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Geofence Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.map((insp) => (
                    <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600">{insp.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{insp.ngoName}</div>
                        <div className="text-[10px] text-slate-500">Scheduled: {insp.scheduledDate} ({insp.scheduledTime})</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{insp.officerName}</div>
                        <div className="text-[10px] text-slate-500">{insp.officerBadge}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          insp.status === 'ON_SITE_IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : insp.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : insp.status === 'FLAGGED_FOR_AUDIT'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}>
                          {insp.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        {insp.geofenceVerified ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Verified On-Site ({insp.officerDistanceToNgoMeters ?? 45}m)
                          </span>
                        ) : (
                          <span className="text-slate-500">Pending arrival</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onViewInspectionDetails(insp)}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-blue-700 rounded-full font-semibold text-xs border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. NGOS MASTER DIRECTORY */}
      {activeTab === 'NGOS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                id="input-search-ngo-admin"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search NGO by name, DARPAN registration ID, or district..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                id="select-sector-filter"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Sectors</option>
                <option value="De-addiction">De-addiction</option>
                <option value="Disability Welfare">Disability Welfare</option>
                <option value="Education">Education</option>
                <option value="Child Welfare">Child Welfare</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Rural Development">Rural Development</option>
                <option value="Women Empowerment">Women Empowerment</option>
                <option value="Environment">Environment</option>
              </select>

              <select
                id="select-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="REGISTERED">Compliant / Registered</option>
                <option value="UNDER_INSPECTION">Under Inspection</option>
                <option value="FLAGGED_VIOLATION">Flagged Violation</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/90 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3">Registration &amp; NGO</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3">District / State</th>
                  <th className="p-3 text-center">FCRA Status</th>
                  <th className="p-3 text-center">Audit Score</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNgos.map((ngo) => (
                  <tr key={ngo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-blue-600">{ngo.regNumber}</span>
                        {ngo.verificationStatus && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              ngo.verificationStatus.includes('Confirmed')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {ngo.verificationStatus.includes('Confirmed') ? '✓ ' : '⚠️ '}
                            {ngo.verificationStatus}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{ngo.name}</div>
                      {(ngo.scheme || ngo.ngoType) && (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {ngo.scheme && (
                            <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                              🏛️ {ngo.scheme}
                            </span>
                          )}
                          {ngo.ngoType && (
                            <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {ngo.ngoType}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-0.5">President: {ngo.presidentName}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{ngo.sector}</td>
                    <td className="p-3 text-slate-600">
                      <div>{ngo.district}</div>
                      <div className="text-[10px] text-slate-400">{ngo.state}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        ngo.fcraStatus === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : ngo.fcraStatus === 'SUSPENDED'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {ngo.fcraStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-bold text-slate-900">{ngo.complianceScore ?? 'N/A'}%</div>
                      <div className="text-[10px] text-slate-500">Last: {ngo.lastInspectionDate || 'None'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        ngo.status === 'REGISTERED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : ngo.status === 'FLAGGED_VIOLATION'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {ngo.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      {(ngo.googleMapsUrl || (ngo.coordinates && typeof ngo.coordinates.lat === 'number')) && (
                        <a
                          href={ngo.googleMapsUrl || `https://www.google.com/maps?q=${ngo.coordinates?.lat},${ngo.coordinates?.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs bg-white hover:bg-slate-50 text-blue-700 rounded-full font-semibold border border-blue-200 shadow-2xs hover:shadow-xs transition-all inline-flex items-center gap-1"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Maps</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedNgoForMap(ngo);
                          setActiveTab('OVERVIEW');
                        }}
                        className="px-3 py-1 text-xs bg-white hover:bg-slate-50 text-slate-700 rounded-full font-semibold border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        title="Locate on GIS Map"
                      >
                        GIS
                      </button>
                      <button
                        onClick={() => onOpenAssignModal(ngo.id)}
                        className="px-3.5 py-1 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                      >
                        Assign Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. GOVERNMENT INSPECTIONS MASTER & AUDIT REPORTS */}
      {activeTab === 'INSPECTIONS' && (
        <div className="space-y-3">
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">View Mode:</span>
              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setInspectionViewMode('GOV_MASTER')}
                  className={`px-3.5 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                    inspectionViewMode === 'GOV_MASTER'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Statutory Project Master ({govTasks.length || 55}+ Tasks)
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionViewMode('LEGACY_LOGS')}
                  className={`px-3.5 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                    inspectionViewMode === 'LEGACY_LOGS'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  NGO Dispatch Cards ({inspections.length})
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenAssignModal()}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Dispatch Form</span>
            </button>
          </div>

          {inspectionViewMode === 'GOV_MASTER' ? (
            <GovernmentInspectionMaster
              tasks={govTasks}
              officers={officers}
              onAssignInspector={(taskId, officer) => {
                if (onAssignGovTask) {
                  onAssignGovTask(taskId, officer);
                }
              }}
              onRefreshTasks={onRefreshGovTasks}
              onShowToast={(msg, type) => {
                if (onShowToast) onShowToast(msg, type);
              }}
            />
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 animate-slide-up">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Field Inspection Logs &amp; Audit Dossiers</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official reports with 10-point statutory checklist, GPS stamps, and evidence photographs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inspections.map((insp) => (
                  <div key={insp.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-2xs card-hover-lift">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-blue-600">{insp.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            insp.priority === 'HIGH_SURPRISE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {insp.priority.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{insp.ngoName}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        insp.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : insp.status === 'FLAGGED_FOR_AUDIT'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {insp.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Field Auditor</span>
                        <span className="font-semibold text-slate-800">{insp.officerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Schedule</span>
                        <span>{insp.scheduledDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Anti-Fraud Geofence</span>
                        <span className={insp.geofenceVerified ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {insp.geofenceVerified ? 'Verified Within 150m' : 'Not verified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Audit Score</span>
                        <span className="font-bold text-slate-800">{insp.score !== undefined ? `${insp.score}/100` : 'Pending'}</span>
                      </div>
                    </div>

                    {insp.findingsSummary && (
                      <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50/50 p-2 rounded-lg">
                        "{insp.findingsSummary}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">
                        {insp.photos ? `${insp.photos.length} GPS Watermarked Photos` : 'No photos attached yet'}
                      </span>
                      <button
                        onClick={() => onViewInspectionDetails(insp)}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Open Audit Dossier</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. FIELD OFFICERS */}
      {activeTab === 'OFFICERS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 animate-slide-up">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Vigilance &amp; Field Inspection Officers</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live location streaming from mobile devices with battery level and assigned jurisdiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officers.map((officer) => (
              <div key={officer.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-2xs card-hover-lift">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{officer.name}</h4>
                      <div className="text-xs text-slate-500 font-mono">Badge: {officer.badgeNumber}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    officer.status === 'ON_DUTY'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    ● {officer.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div><strong>Department:</strong> {officer.department}</div>
                  <div><strong>Jurisdiction:</strong> {officer.assignedDistrict || 'All NCR Districts'}</div>
                  <div><strong>Contact:</strong> {officer.phone} | {officer.email}</div>
                </div>

                {officer.currentLocation && typeof officer.currentLocation.lat === 'number' && typeof officer.currentLocation.lng === 'number' && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5 text-blue-600">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        Live Fused Location
                      </span>
                      <span className="text-emerald-700">🔋 {officer.currentLocation.batteryLevel}% Battery</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">
                      Lat: {officer.currentLocation.lat.toFixed(4)}, Lng: {officer.currentLocation.lng.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-slate-400">Ping: {officer.currentLocation.lastPingTime}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. CITIZEN COMPLAINTS */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 animate-slide-up">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Public Grievances &amp; Whistleblower Reports</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complaints received from citizens regarding misappropriation of funds, fake beneficiaries, or ghost offices.
            </p>
          </div>

          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-2xs card-hover-lift">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-purple-700">Token: {c.trackingToken}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        {c.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">Target NGO: {c.ngoName}</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    c.status === 'INSPECTION_ORDERED'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : c.status === 'RESOLVED_VALIDATED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-300'
                  }`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  "{c.description}"
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    Reported by: <strong className="text-slate-700">{c.isAnonymous ? 'Anonymous Whistleblower' : c.citizenName}</strong> on {c.submittedAt}
                  </div>

                  <div className="flex items-center space-x-2">
                    {c.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => onUpdateComplaintStatus(c.id, 'INSPECTION_ORDERED', 'Field probe dispatched.')}
                          className="px-3.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        >
                          Order Surprise Inspection
                        </button>
                        <button
                          onClick={() => onUpdateComplaintStatus(c.id, 'DISMISSED', 'Unsubstantiated allegation.')}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-full font-medium text-xs border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {c.status === 'INSPECTION_ORDERED' && (
                      <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Vigilance probe assigned to field officer
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. NGO REGISTRATION APPLICATIONS */}
      {activeTab === 'APPLICATIONS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 animate-slide-up">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">New NGO Registration Applications</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review DARPAN registrations, trust deeds, and physical premise coordinates submitted by new NGO applicants.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No pending registration applications in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-2xs card-hover-lift">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600">DARPAN ID: {app.darpanId}</span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{app.ngoName}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Applicant: {app.applicantName} ({app.applicantRole})</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      app.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : app.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div><strong>Registration No:</strong> {app.registrationNumber}</div>
                    <div><strong>Sector:</strong> {app.sector}</div>
                    <div><strong>Premise Address:</strong> {app.address}, {app.district}</div>
                    <div><strong>Contact:</strong> {app.phone} | {app.email}</div>
                    <div><strong>Geo-Coordinates:</strong> {typeof app.lat === 'number' && typeof app.lng === 'number' ? `${app.lat.toFixed(4)}°N, ${app.lng.toFixed(4)}°E` : 'Pending Verification'}</div>
                    <div><strong>Application Date:</strong> {app.appliedDate}</div>
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => onRejectApplication(app.id, 'Discrepancy in declared physical office coordinates')}
                        className="px-3.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-full transition-colors cursor-pointer"
                      >
                        Reject Application
                      </button>
                      <button
                        onClick={() => onApproveApplication(app.id)}
                        className="px-4 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                      >
                        Approve &amp; Add to Master Registry
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 7. STATUTORY NOTICES (SECTION 14 / SECTION 8) */}
      {activeTab === 'NOTICES' && (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Statutory Notices &amp; Directorate Orders (Section 14 / Section 8)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official show-cause notices issued under Public Welfare Vigilance Act. NGOs are bound by a 14-day mandatory response window.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={fetchNotices}
                disabled={isLoadingNotices}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold border border-slate-300/80 transition-colors cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoadingNotices ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateNoticeOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Serve Statutory Notice</span>
              </button>
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs border border-dashed border-slate-300/80 rounded-2xl bg-slate-50/50">
              No statutory notices currently active. Notices generated automatically upon "BAD / DEFICIENT" scrutiny verdicts will appear here.
            </div>
          ) : (
            <div className="space-y-3.5">
              {notices.map((n) => (
                <div key={n.id} className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white card-hover-lift transition-all space-y-3.5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          {n.noticeNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {n.noticeType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">{n.subject}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Target NGO: <strong>{n.ngoName || 'Registered NGO'}</strong> {n.ngoDarpanId ? `(${n.ngoDarpanId})` : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        n.status === 'RESPONSE_SUBMITTED'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : n.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}>
                        {n.status.replace(/_/g, ' ')}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        Deadline: <strong>{n.deadline}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div><strong>Reason:</strong> {n.reason}</div>
                    <div className="text-slate-600 leading-relaxed">{n.details}</div>
                  </div>

                  {n.response && (
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                      <div className="flex items-center justify-between text-emerald-900 font-bold">
                        <span>Official NGO Written Response Received:</span>
                        <span className="text-[10px] font-mono text-emerald-700">{n.response.submittedAt}</span>
                      </div>
                      <p className="text-emerald-950 bg-white p-3 rounded-lg border border-emerald-200/70 leading-relaxed font-sans">
                        "{n.response.responseText}"
                      </p>
                      {n.response.attachmentUrls && n.response.attachmentUrls.length > 0 && (
                        <div className="text-[11px] text-emerald-800">
                          <strong>Attachments:</strong> {n.response.attachmentUrls.length} file(s) attached for Directorate review.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 gap-2">
                    <div>Issued by: <strong>{n.issuedByName || 'Directorate General'}</strong> on {n.issuedAt}</div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([
                            `GOVERNMENT OF INDIA\nMinistry of Social Justice and Empowerment\nDirectorate General of NGO Vigilance\n\nOFFICIAL STATUTORY NOTICE (SECTION 14)\nNotice Ref: ${n.noticeNumber}\nDate of Issue: ${n.issuedAt}\nMandatory Response Deadline: ${n.deadline}\n\nTARGET NGO: ${n.ngoName || 'Registered NGO'} (${n.ngoDarpanId || 'DARPAN/MH/2026'})\n\nSUBJECT: ${n.subject}\nREASON: ${n.reason}\n\nDIRECTIVE DETAILS:\n${n.details}\n\nUnder Section 14 of GFR 2017 and DARPAN statutory vigilance regulations, you are hereby required to submit a comprehensive written explanation along with audited records within 14 calendar days from receipt of this notice.\n\nFailure to comply shall result in immediate freezing of welfare grant accounts and debarment from Central Grant-in-Aid schemes.\n\nSigned,\nDirectorate General (IAS)\nMinistry of Social Justice and Empowerment\nGovernment of India`
                          ], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Statutory_Notice_${n.noticeNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
                        title="Export printable official Gazette notice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Notice</span>
                      </button>
                      <span className="font-mono text-slate-400">14-Day Window Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 8. SYSTEM AUDIT LOGS (IMMUTABLE LOGGING) */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Central Immutable Audit Trail &amp; Regulatory Event Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                MeitY / CERT-In compliant tamper-proof audit records. Tracks administrative sanctions, GPS check-ins, evidence hashes, and user access.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-full text-xs bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Actions</option>
                <option value="LOGIN_SUCCESS">Login Success</option>
                <option value="GEOFENCE_CHECK_IN_VERIFIED">Geofence Check-in</option>
                <option value="EVIDENCE_UPLOADED">Evidence Uploaded</option>
                <option value="INSPECTION_SUBMITTED">Inspection Submitted</option>
                <option value="SCRUTINY_SANCTION_SEALED">Scrutiny Sanction</option>
                <option value="GRIEVANCE_REGISTERED">Grievance Registered</option>
                <option value="STATUTORY_NOTICE_ISSUED">Notice Issued</option>
              </select>

              <button
                type="button"
                onClick={fetchAuditLogs}
                disabled={isLoadingAuditLogs}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoadingAuditLogs ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Timestamp (IST)</th>
                  <th className="p-3">Regulatory Action</th>
                  <th className="p-3">Actor / Officer</th>
                  <th className="p-3">IP &amp; Node</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {auditLogs
                  .filter((l) => auditActionFilter === 'ALL' || l.action === auditActionFilter)
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          log.action.includes('SANCTION') || log.action.includes('NOTICE')
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : log.action.includes('GEOFENCE')
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : log.action.includes('EVIDENCE')
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : log.action.includes('LOGIN')
                            ? 'bg-slate-100 text-slate-900 border-slate-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{log.userName || 'System'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.userRole || 'SYSTEM'}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="p-3 text-slate-700 whitespace-nowrap">
                        <span className="font-semibold">{log.entityType || 'SYSTEM'}</span>
                        {log.entityId && <span className="block text-[10px] font-mono text-slate-500">ID: {log.entityId.substring(0, 14)}</span>}
                      </td>
                      <td className="p-3 text-slate-700 text-xs">
                        {log.details || 'No extended remarks.'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE STATUTORY NOTICE MODAL */}
      {isCreateNoticeOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200/80 shadow-2xl overflow-hidden text-slate-800">
            {/* Modern Gradient Accent Line */}
            <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-600"></div>

            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Serve Statutory Notice</h3>
                  <p className="text-xs text-slate-300">Under Section 14, Public Welfare Vigilance Act</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateNoticeOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNoticeSubmit} className="p-5 sm:p-6 space-y-4 bg-white">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Target Inspected NGO *</label>
                <select
                  value={newNoticeTargetNgoId}
                  onChange={(e) => setNewNoticeTargetNgoId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {ngos.map((ngo) => (
                    <option key={ngo.id} value={ngo.id}>
                      {ngo.name} ({ngo.regNumber} — {ngo.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notice Type *</label>
                  <select
                    value={newNoticeType}
                    onChange={(e) => setNewNoticeType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="SHOW_CAUSE_NOTICE">Show-Cause Notice (Section 14)</option>
                    <option value="DEFICIENCY_RECTIFICATION">Deficiency Rectification Order</option>
                    <option value="DARPAN_DISBARMENT_WARNING">DARPAN Disbarment Warning</option>
                    <option value="SPECIAL_AUDIT_SUMMONS">Special Audit Summons</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Compliance Window *</label>
                  <select
                    value={newNoticeDeadlineDays}
                    onChange={(e) => setNewNoticeDeadlineDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value={7}>7 Days (Urgent Sanction)</option>
                    <option value={14}>14 Days (Standard Section 14 Window)</option>
                    <option value={21}>21 Days (Detailed Financial Reconciliation)</option>
                    <option value={30}>30 Days (Statutory Right of Appeal)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Show-Cause regarding unverified beneficiary rolls and ledger discrepancy"
                  value={newNoticeSubject}
                  onChange={(e) => setNewNoticeSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Statutory Reason / Clause *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Section 14 (Mandatory physical presence &amp; books of account)"
                  value={newNoticeReason}
                  onChange={(e) => setNewNoticeReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Directives &amp; Actionable Rectification Demands *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Specify the physical inspection findings, discrepancies observed, and the mandatory explanation or documentary proof required from the NGO."
                  value={newNoticeDetails}
                  onChange={(e) => setNewNoticeDetails(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateNoticeOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-full text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Statutory Directive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
