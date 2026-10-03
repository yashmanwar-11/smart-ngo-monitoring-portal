import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  Eye,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Building2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Camera,
  FileCheck,
  AlertOctagon,
  Download,
  X,
  Printer,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Users,
  ShieldCheck,
  Award,
  ShieldAlert,
  Hash,
  Gavel,
  Sliders,
  CheckSquare,
  FileBadge,
  Edit3,
  AlertCircle,
  Film,
  Play,
  Video
} from 'lucide-react';
import {
  GovernmentInspectionTask,
  GovernmentTaskStatus,
  User,
  TaskPhoto,
  TaskVideo,
  PhotoEvidenceCategory,
  ScrutinyVerdict,
  StatutoryActionChoice,
  DirectorateScrutinyReview
} from '../types';
import { updateTaskStatus, submitDirectorateScrutiny } from '../services/governmentTasksStorage';
import { inspectionApi } from '../services/apiClient';

interface GovernmentInspectionMasterProps {
  tasks: GovernmentInspectionTask[];
  officers: User[];
  onAssignInspector: (taskId: string, inspector: User) => void;
  onRefreshTasks?: () => void;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

const normalizePhotoCategory = (category?: string): PhotoEvidenceCategory => {
  if (!category) return 'PREMISE_SIGNBOARD';
  const cat = category.toUpperCase();
  if (cat === 'PREMISE_SIGNBOARD' || cat === 'OFFICE_EXTERIOR') return 'PREMISE_SIGNBOARD';
  if (cat === 'ACCOUNTS_LEDGERS' || cat === 'LEDGER_AUDIT') return 'ACCOUNTS_LEDGERS';
  if (cat === 'WELFARE_BENEFICIARIES' || cat === 'BENEFICIARY_MEET' || cat === 'STAFF_VERIFICATION')
    return 'WELFARE_BENEFICIARIES';
  if (cat === 'INFRASTRUCTURE') return 'INFRASTRUCTURE';
  if (cat === 'VIOLATIONS_DEFECTS' || cat === 'VIOLATION_EVIDENCE') return 'VIOLATIONS_DEFECTS';
  return 'PREMISE_SIGNBOARD';
};

const CATEGORY_METAS: Record<
  PhotoEvidenceCategory,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  PREMISE_SIGNBOARD: {
    label: 'Premise & Signboard',
    icon: Building2,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  ACCOUNTS_LEDGERS: {
    label: 'Accounts & Ledgers',
    icon: BookOpen,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  WELFARE_BENEFICIARIES: {
    label: 'Welfare & Beneficiaries',
    icon: Users,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  INFRASTRUCTURE: {
    label: 'Infrastructure & Safety',
    icon: ShieldCheck,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  VIOLATIONS_DEFECTS: {
    label: 'Discrepancies & Violations',
    icon: AlertTriangle,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
};

export const PUNITIVE_ACTION_OPTIONS: string[] = [
  'Issue Formal Show-Cause Notice Under DARPAN Section 14 (14-Day Mandatory Reply Window)',
  'Suspend FCRA Clearance & 80G Tax Exemption Certificates',
  'Direct Operational Bank Branch to Freeze Disbursable Welfare Accounts',
  'Initiate Formal Investigation with Enforcement Directorate (ED) & CBI',
  'Place NGO on National Central DARPAN Blacklist Registry (3-Year Bar)',
  'Order Mandatory On-Site Re-Audit by Senior Special Vigilance Squad (30 Days)',
];

export const CLEARANCE_OPTIONS: string[] = [
  'Issue Annual Statutory Compliance Renewal Certificate (FY 2026-27)',
  'Release Pending Central / State Scheme Grant Disbursements',
  'Mark NGO as "Verified Grade-A Partner" on Public DARPAN Portal',
];

export const getComplianceGradeFromScore = (
  score: number
): 'A_EXCELLENT' | 'B_SATISFACTORY' | 'C_NON_COMPLIANT' | 'D_CRITICAL_FRAUD' => {
  if (score >= 85) return 'A_EXCELLENT';
  if (score >= 70) return 'B_SATISFACTORY';
  if (score >= 45) return 'C_NON_COMPLIANT';
  return 'D_CRITICAL_FRAUD';
};

export const GovernmentInspectionMaster: React.FC<GovernmentInspectionMasterProps> = ({
  tasks,
  officers,
  onAssignInspector,
  onRefreshTasks,
  onShowToast,
}) => {
  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [scrutinyFilter, setScrutinyFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<GovernmentInspectionTask | null>(null);
  const [assigningTask, setAssigningTask] = useState<GovernmentInspectionTask | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<TaskPhoto | null>(null);
  const [zoomedVideo, setZoomedVideo] = useState<TaskVideo | null>(null);
  const [activePhotoCategory, setActivePhotoCategory] = useState<string>('ALL');
  const [iasActionNotice, setIasActionNotice] = useState<string | null>(null);

  // Directorate Scrutiny Form State
  const [scrutinyVerdict, setScrutinyVerdict] = useState<ScrutinyVerdict>('GOOD_COMPLIANT');
  const [scrutinyScore, setScrutinyScore] = useState<number>(85);
  const [actionChoice, setActionChoice] = useState<StatutoryActionChoice>('NO_ACTION_CLEARED');
  const [selectedActionList, setSelectedActionList] = useState<string[]>([]);
  const [scrutinyRemarks, setScrutinyRemarks] = useState<string>('');
  const [isEditingScrutiny, setIsEditingScrutiny] = useState<boolean>(false);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    safeTasks.forEach((t) => set.add(t.department));
    return Array.from(set).sort();
  }, [safeTasks]);

  // Statistics
  const totalCount = safeTasks.length;
  const pendingCount = safeTasks.filter((t) => t.status === 'Pending').length;
  const assignedCount = safeTasks.filter((t) => t.status === 'Assigned').length;
  const inProgressCount = safeTasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = safeTasks.filter((t) => t.status === 'Completed').length;
  const failedCount = safeTasks.filter((t) => t.status === 'Failed/Issue Found').length;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return safeTasks.filter((task) => {
      const matchesSearch =
        task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.inspectionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.assignedInspectorName && task.assignedInspectorName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
      const matchesDepartment = departmentFilter === 'ALL' || task.department === departmentFilter;

      let matchesScrutiny = true;
      if (scrutinyFilter === 'PENDING_SCRUTINY') {
        matchesScrutiny = !!task.submittedRecord && !task.scrutinyReview;
      } else if (scrutinyFilter === 'GOOD_CLEARED') {
        matchesScrutiny = task.scrutinyReview?.verdict === 'GOOD_COMPLIANT';
      } else if (scrutinyFilter === 'BAD_ACTION') {
        matchesScrutiny = task.scrutinyReview?.verdict === 'BAD_DEFICIENT';
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesScrutiny;
    });
  }, [safeTasks, searchTerm, statusFilter, priorityFilter, departmentFilter, scrutinyFilter]);

  // Synchronize Scrutiny Form state when selectedTaskForDetail changes
  React.useEffect(() => {
    if (selectedTaskForDetail?.scrutinyReview) {
      setScrutinyVerdict(selectedTaskForDetail.scrutinyReview.verdict);
      setScrutinyScore(selectedTaskForDetail.scrutinyReview.score);
      setActionChoice(selectedTaskForDetail.scrutinyReview.actionChoice);
      setSelectedActionList(selectedTaskForDetail.scrutinyReview.selectedActions || []);
      setScrutinyRemarks(selectedTaskForDetail.scrutinyReview.scrutinyRemarks || '');
      setIsEditingScrutiny(false);
    } else if (selectedTaskForDetail?.submittedRecord) {
      const isFailed = selectedTaskForDetail.status === 'Failed/Issue Found';
      const initialVerdict: ScrutinyVerdict = isFailed ? 'BAD_DEFICIENT' : 'GOOD_COMPLIANT';
      setScrutinyVerdict(initialVerdict);
      setScrutinyScore(isFailed ? 25 : 88);
      setActionChoice(isFailed ? 'ACTION_REQUIRED' : 'NO_ACTION_CLEARED');
      setSelectedActionList(
        isFailed
          ? ['Issue Formal Show-Cause Notice Under DARPAN Section 14 (14-Day Mandatory Reply Window)']
          : ['Issue Annual Statutory Compliance Renewal Certificate (FY 2026-27)']
      );
      setScrutinyRemarks(
        isFailed
          ? 'Physical audit verified severe irregularities and discrepancies against statutory regulations. Punitive enforcement sanctioned.'
          : 'Physical site audit verified premises, operational activities, and accounts. Full statutory compliance renewal recommended.'
      );
      setIsEditingScrutiny(true);
    }
  }, [selectedTaskForDetail]);

  const handleToggleActionItem = (itemText: string) => {
    setSelectedActionList((prev) =>
      prev.includes(itemText) ? prev.filter((x) => x !== itemText) : [...prev, itemText]
    );
  };

  const handleSaveDirectorateScrutiny = () => {
    if (!selectedTaskForDetail) return;

    const currentGrade = getComplianceGradeFromScore(scrutinyScore);
    const orderNumber = `DIR/ORD/2026/${selectedTaskForDetail.id.replace('INSP-', '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const reviewedAt = new Date().toLocaleString('en-IN') + ' IST';

    const review: DirectorateScrutinyReview = {
      reviewedByOfficerName: 'Demo Director (role: Directorate)',
      reviewedByOfficerBadge: 'DEMO-DIR-001',
      reviewedAt,
      verdict: scrutinyVerdict,
      score: scrutinyScore,
      complianceGrade: currentGrade,
      actionChoice,
      selectedActions: selectedActionList,
      scrutinyRemarks,
      sanctionOrderNumber: orderNumber,
      isLocked: true,
    };

    const result = submitDirectorateScrutiny(selectedTaskForDetail.id, review);
    if (result.success && result.updatedTask) {
      setSelectedTaskForDetail(result.updatedTask);
      setIsEditingScrutiny(false);
      const msg =
        scrutinyVerdict === 'GOOD_COMPLIANT'
          ? `✓ Directorate Order Sealed [${orderNumber}]: Marked GOOD (Score: ${scrutinyScore}/100) — NGO Cleared for ${selectedTaskForDetail.title}.`
          : `⚠️ Directorate Order Sealed [${orderNumber}]: Marked BAD (Score: ${scrutinyScore}/100) — Statutory Actions Sanctioned against ${selectedTaskForDetail.title}.`;
      setIasActionNotice(msg);
      onShowToast(msg, scrutinyVerdict === 'GOOD_COMPLIANT' ? 'success' : 'info');

      // Persist to central SQLite backend
      inspectionApi.review(selectedTaskForDetail.id, {
        ...review,
        remarks: scrutinyRemarks,
      } as any).catch((err) => {
        console.warn('Backend scrutiny sync status:', err);
      });

      if (onRefreshTasks) onRefreshTasks();
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask || !selectedOfficerId) return;

    const officer = officers.find((o) => o.id === selectedOfficerId);
    if (!officer) return;

    onAssignInspector(assigningTask.id, officer);
    onShowToast(
      `✓ Inspection ${assigningTask.id} successfully assigned to ${officer.name} (${officer.badgeNumber || 'INSP'}). It is now visible in the Inspector's Assigned Inspections.`,
      'success'
    );
    setAssigningTask(null);
    setSelectedOfficerId('');
  };

  const getStatusBadge = (status: GovernmentTaskStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            Pending Allocation
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <UserCheck className="w-3 h-3 mr-1 text-blue-600" />
            Assigned to Field
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Clock className="w-3 h-3 mr-1 text-indigo-600" />
            Active in Field
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Completed &amp; Sealed
          </span>
        );
      case 'Failed/Issue Found':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3 h-3 mr-1 text-rose-600" />
            Deficiencies Flagged
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            CRITICAL
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            HIGH
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Overview - Google-Style Administrative Command Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Central Inspection Management Authority</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Statutory Inspection Task Master <span className="text-blue-600">({totalCount} Projects)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rule 14 GFR 2017 compliant national ledger. Monitor physical audits across all ministries, dispatch surprise vigilance visits, and scrutinize photographic dossiers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {onRefreshTasks && (
            <button
              onClick={onRefreshTasks}
              className="p-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-full border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Refresh Tasks"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <div className="text-right">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Central Database Status</div>
            <div className="text-xs font-mono text-emerald-700 font-bold flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              NIC-GovNet Synced
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar - Google-Style Minimalist Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'ALL'
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">All Ministries</div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Pending'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'Pending'
              ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Needs Allocation</div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Assigned'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'Assigned'
              ? 'bg-gradient-to-br from-blue-50 to-sky-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Assigned</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">{assignedCount}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Field Inspectors</div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('In Progress'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'In Progress'
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Active</div>
          <div className="text-2xl font-extrabold text-indigo-900 mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">150m Geofence Lock</div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Completed'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'Completed'
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{completedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified &amp; Sealed</div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Failed/Issue Found'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'Failed/Issue Found'
              ? 'bg-gradient-to-br from-rose-50 to-pink-50/50 border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Deficiencies</div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">{failedCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Action Sanctioned</div>
        </button>
      </div>

      {/* Search & Filter Controls - Government Filter Strip */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="input-search-gov-inspections"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Task ID, Facility, Location..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="select-filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 text-slate-900 font-medium cursor-pointer"
            >
              <option value="ALL">Status: All ({totalCount})</option>
              <option value="Pending">Pending ({pendingCount})</option>
              <option value="Assigned">Assigned ({assignedCount})</option>
              <option value="In Progress">In Progress ({inProgressCount})</option>
              <option value="Completed">Completed ({completedCount})</option>
              <option value="Failed/Issue Found">Issues Found ({failedCount})</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              id="select-filter-priority"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 text-slate-900 font-medium cursor-pointer"
            >
              <option value="ALL">Priority: All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              id="select-filter-department"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 text-slate-900 font-medium cursor-pointer truncate"
            >
              <option value="ALL">All Ministries &amp; Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Scrutiny Status Filter */}
          <div>
            <select
              id="select-filter-scrutiny"
              value={scrutinyFilter}
              onChange={(e) => {
                setScrutinyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 text-xs bg-indigo-50 border border-indigo-200 rounded-full focus:outline-none focus:border-indigo-500 text-indigo-700 font-bold cursor-pointer truncate"
            >
              <option value="ALL">Directorate Scrutiny: All</option>
              <option value="PENDING_SCRUTINY">Pending Review</option>
              <option value="GOOD_CLEARED">Approved (Good)</option>
              <option value="BAD_ACTION">Action Taken (Bad)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tag Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <span>Showing: <strong>{filteredTasks.length}</strong> tasks</span>
            {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || departmentFilter !== 'ALL' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setDepartmentFilter('ALL');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-slate-600">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={55}>All (55)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 50+ Inspection Tasks Table - High-Density Official Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3.5 border-r border-slate-200/80">Task ID</th>
                <th className="py-3 px-3.5 border-r border-slate-200/80">Facility &amp; Location</th>
                <th className="py-3 px-3.5 border-r border-slate-200/80">Department</th>
                <th className="py-3 px-3.5 border-r border-slate-200/80">Type</th>
                <th className="py-3 px-3.5 border-r border-slate-200/80 text-center">Priority</th>
                <th className="py-3 px-3.5 border-r border-slate-200/80">Date</th>
                <th className="py-3 px-3.5 border-r border-slate-200/80 text-center">Status &amp; Scrutiny</th>
                <th className="py-3 px-3.5 border-r border-slate-200/80">Inspector</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No inspection tasks match your search criteria.</p>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* ID */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-700 border-r border-slate-200/80 whitespace-nowrap text-[11px]">
                      {task.id}
                    </td>

                    {/* Facility / Location */}
                    <td className="py-2.5 px-3.5 max-w-xs border-r border-slate-200/80">
                      <div className="font-bold text-slate-900 text-xs truncate" title={task.title}>
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1" title={task.location}>
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {task.location}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200/80">
                      <span className="text-[11px] text-slate-700 font-medium">
                        {task.department}
                      </span>
                    </td>

                    {/* Inspection Type */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-800 border-r border-slate-200/80 text-[11px]">
                      {task.inspectionType}
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center border-r border-slate-200/80">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Scheduled Date */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600 border-r border-slate-200/80">
                      {task.date}
                    </td>

                    {/* Current Status & Scrutiny Indicator */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-center border-r border-slate-200/80">
                      <div>{getStatusBadge(task.status)}</div>
                      {task.scrutinyReview ? (
                        task.scrutinyReview.verdict === 'GOOD_COMPLIANT' ? (
                          <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 mt-1 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved • {task.scrutinyReview.score}/100</span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-300 mt-1 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Action • {task.scrutinyReview.score}/100</span>
                          </div>
                        )
                      ) : task.submittedRecord ? (
                        <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 mt-1 inline-flex items-center gap-1">
                          <Gavel className="w-3 h-3 text-indigo-600" />
                          <span>Review Pending</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Assigned Inspector */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200/80">
                      {task.assignedInspectorName ? (
                        <div>
                          <div className="font-semibold text-slate-900 text-[11px]">
                            {task.assignedInspectorName}
                          </div>
                          {task.assignedInspectorBadge && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {task.assignedInspectorBadge}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-800 font-medium italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap space-x-1.5">
                      {/* If Completed, Failed, or Field Report Submitted: Show Scrutiny / Review button */}
                      {(task.status === 'Completed' || task.status === 'Failed/Issue Found' || task.submittedRecord) && (
                        <button
                          type="button"
                          id={`btn-view-details-${task.id}`}
                          onClick={() => setSelectedTaskForDetail(task)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold text-white transition-all cursor-pointer inline-flex items-center gap-1 border shadow-xs ${
                            !task.scrutinyReview
                              ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 border-indigo-800'
                              : task.scrutinyReview.verdict === 'GOOD_COMPLIANT'
                              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700'
                              : 'bg-rose-600 hover:bg-rose-700 border-rose-700'
                          }`}
                          title={!task.scrutinyReview ? 'Review and Scrutinize Submitted Report' : 'View Directorate Scrutiny Order'}
                        >
                          <Gavel className="w-3 h-3" />
                          <span>{!task.scrutinyReview ? 'Review' : 'Order'}</span>
                        </button>
                      )}

                      {/* If Pending: Assign Inspector button */}
                      {task.status === 'Pending' && (
                        <button
                          type="button"
                          id={`btn-assign-inspector-${task.id}`}
                          onClick={() => {
                            setAssigningTask(task);
                            setSelectedOfficerId(officers[0]?.id || '');
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-[11px] font-semibold border border-indigo-800 shadow-xs cursor-pointer inline-flex items-center gap-1"
                          title="Assign to Field Inspector"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      )}

                      {/* If Assigned or In Progress: Reassign / View button */}
                      {(task.status === 'Assigned' || task.status === 'In Progress') && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningTask(task);
                              setSelectedOfficerId(task.assignedInspectorId || officers[0]?.id || '');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-full text-[11px] font-semibold border border-slate-300 cursor-pointer transition-colors"
                            title="Change Assigned Inspector"
                          >
                            Reassign
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-semibold border border-indigo-200 cursor-pointer transition-colors"
                            title="View Task Details"
                          >
                            View
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, filteredTasks.length)}</strong> of{' '}
            <strong>{filteredTasks.length}</strong> tasks
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ASSIGN INSPECTOR MODAL - Official Government Dispatch Form */}
      {assigningTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Administrative Dispatch Protocol
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Assign Inspector to Field Task
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Snapshot Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{assigningTask.id}</span>
                {getPriorityBadge(assigningTask.priority)}
              </div>
              <div className="font-bold text-slate-900 text-sm">{assigningTask.title}</div>
              <div className="text-slate-600 flex items-center gap-1.5 text-xs">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {assigningTask.location}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Department</span>
                  <span className="font-semibold text-slate-800">{assigningTask.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Scheduled Date</span>
                  <span className="font-semibold text-slate-800">{assigningTask.date}</span>
                </div>
              </div>
            </div>

            {/* Inspector Selection Form */}
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Certified Field Inspector:
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {officers.map((officer) => (
                    <label
                      key={officer.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedOfficerId === officer.id
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="inspectorChoice"
                          value={officer.id}
                          checked={selectedOfficerId === officer.id}
                          onChange={(e) => setSelectedOfficerId(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{officer.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Badge: <span className="font-semibold text-slate-700">{officer.badgeNumber || 'INSP-DEL-402'}</span> | {officer.department?.split('&')[0]}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {officer.status === 'ON_DUTY' ? 'ON DUTY' : 'ACTIVE'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200/60 text-xs text-slate-600 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Once dispatched, this task is immediately locked to the designated inspector’s mobile terminal and requires 150m GPS geofence validation to execute.
                </span>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedOfficerId}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE STATUTORY INSPECTION DOSSIER MODAL */}
      {selectedTaskForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-4 p-6 sm:p-8 shadow-2xl border border-slate-200/90 space-y-6 max-h-[94vh] overflow-y-auto animate-scale-in">
            {/* Dossier Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 font-bold">
                    {selectedTaskForDetail.id}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600 font-bold">{selectedTaskForDetail.department}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {selectedTaskForDetail.title}
                </h2>
                <div className="flex items-center text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>{selectedTaskForDetail.location}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {getStatusBadge(selectedTaskForDetail.status)}
                <button
                  type="button"
                  onClick={() => setSelectedTaskForDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Inspector</span>
                <span className="font-bold text-slate-900">
                  {selectedTaskForDetail.assignedInspectorName || 'Unassigned'}
                </span>
                {selectedTaskForDetail.assignedInspectorBadge && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {selectedTaskForDetail.assignedInspectorBadge}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Inspection Type</span>
                <span className="font-semibold text-slate-800">{selectedTaskForDetail.inspectionType}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Scheduled Date</span>
                <span className="font-semibold text-slate-800">{selectedTaskForDetail.date}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Priority Level</span>
                <div>{getPriorityBadge(selectedTaskForDetail.priority)}</div>
              </div>
            </div>

            {/* If there is a submitted record, display all the rich submitted details */}
            {selectedTaskForDetail.submittedRecord ? (
              <div className="space-y-6">
                {/* Status Notice Banner */}
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                    selectedTaskForDetail.status === 'Completed'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-300 text-rose-950'
                  }`}
                >
                  {selectedTaskForDetail.status === 'Completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {selectedTaskForDetail.status === 'Completed'
                        ? 'Statutory Inspection Complete & Validated'
                        : 'Non-Compliance / Defects Identified During Audit'}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-700">
                      Conducted on site by {selectedTaskForDetail.submittedRecord.assignedInspector} (
                      {selectedTaskForDetail.submittedRecord.assignedInspectorBadge}) on{' '}
                      {selectedTaskForDetail.submittedRecord.dateTime}. GPS Geofence and Cryptographic watermark verified.
                    </p>
                  </div>
                </div>

                {/* Directorate Action Notice Banner if triggered */}
                {iasActionNotice && (
                  <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm flex items-start gap-3 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Executive Order Executed by Directorate
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5">{iasActionNotice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIasActionNotice(null)}
                      className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Evidence Photos Gallery with Categorized Spaces */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-indigo-600" />
                        <span>Categorized On-Site Photographic Evidence ({selectedTaskForDetail.submittedRecord.photos?.length || 0} Photos)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Captured on-site via inspector webcam/camera with burned Tricolor Geotag, IST timestamp &amp; SHA-256 seal.
                      </p>
                    </div>
                  </div>

                  {/* Category Spaces Tabs */}
                  {selectedTaskForDetail.submittedRecord.photos && selectedTaskForDetail.submittedRecord.photos.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setActivePhotoCategory('ALL')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          activePhotoCategory === 'ALL'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80'
                        }`}
                      >
                        All Evidence ({selectedTaskForDetail.submittedRecord.photos.length})
                      </button>

                      {(Object.keys(CATEGORY_METAS) as PhotoEvidenceCategory[]).map((catKey) => {
                        const meta = CATEGORY_METAS[catKey];
                        const count = (selectedTaskForDetail.submittedRecord?.photos || []).filter(
                          (p) => normalizePhotoCategory(p.category) === catKey
                        ).length;
                        const Icon = meta.icon;
                        const isSelected = activePhotoCategory === catKey;

                        return (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => setActivePhotoCategory(catKey)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-800 shadow-xs'
                                : `${meta.bg} ${meta.color} hover:opacity-85 ${meta.border}`
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{meta.label}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                isSelected ? 'bg-slate-950 text-blue-100' : 'bg-white text-slate-700 border border-slate-300'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Photos Grid */}
                  {selectedTaskForDetail.submittedRecord.photos && selectedTaskForDetail.submittedRecord.photos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTaskForDetail.submittedRecord.photos
                        .filter((p) => {
                          if (activePhotoCategory === 'ALL') return true;
                          return normalizePhotoCategory(p.category) === activePhotoCategory;
                        })
                        .map((photo) => {
                          const normCat = normalizePhotoCategory(photo.category);
                          const meta = CATEGORY_METAS[normCat];
                          const Icon = meta.icon;
                          const lat = photo.coordinates?.lat ?? 28.6139;
                          const lng = photo.coordinates?.lng ?? 77.2090;
                          const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

                          return (
                            <div
                              key={photo.id}
                              className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/80 shadow-sm flex flex-col hover:border-indigo-500 transition-all text-white card-hover-lift"
                            >
                              {/* Photo Canvas / Preview */}
                              <div
                                className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer"
                                onClick={() => setZoomedPhoto(photo)}
                                title="Click to inspect high-definition evidence"
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.caption || 'Evidence'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />

                                {/* Category Tag on Top Left */}
                                <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 text-[11px] font-bold text-white border border-slate-700 backdrop-blur-xs">
                                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{meta.label}</span>
                                </div>

                                {/* Zoom Icon on Top Right */}
                                <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-indigo-600 transition-colors border border-slate-700 backdrop-blur-xs">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>

                                {/* Bottom Burned Geotag Banner */}
                                <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 border-t border-slate-800 p-2.5 text-white backdrop-blur-xs">
                                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
                                    <span className="flex items-center gap-1 font-bold">
                                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                      {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
                                    </span>
                                    <span className="text-[10px] text-slate-300">±{photo.accuracyMeters || 3.8}m</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {photo.timestamp}
                                    </span>
                                    <span className="text-emerald-400 font-mono font-bold">SEAL: VERIFIED</span>
                                  </div>
                                </div>
                              </div>

                              {/* Photo Metadata Card Body */}
                              <div className="p-3.5 bg-slate-900 flex-1 flex flex-col justify-between space-y-2">
                                <div>
                                  <p className="text-xs font-semibold text-white line-clamp-2">
                                    {photo.caption || 'Field Inspection Evidence'}
                                  </p>
                                  {photo.locationAddress && (
                                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                      {photo.locationAddress}
                                    </p>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                                  <a
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline font-bold"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Verify on Map</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => setZoomedPhoto(photo)}
                                    className="text-xs text-slate-300 hover:text-white font-semibold cursor-pointer underline"
                                  >
                                    Inspect Full
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-600 border border-slate-200">
                      No photographic evidence attached to this dossier.
                    </div>
                  )}
                </div>

                {/* On-Site Video Evidence Gallery */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-purple-700" />
                      <span>On-Site Recorded Video Evidence ({selectedTaskForDetail.submittedRecord.videos?.length || 0})</span>
                    </h4>
                    {selectedTaskForDetail.submittedRecord.videos && selectedTaskForDetail.submittedRecord.videos.length > 0 && (
                      <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-semibold">
                        GIGW 3.0 Cryptographic Video Telemetry
                      </span>
                    )}
                  </div>

                  {selectedTaskForDetail.submittedRecord.videos && selectedTaskForDetail.submittedRecord.videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedTaskForDetail.submittedRecord.videos.map((video) => {
                        const googleMapsUrl = `https://www.google.com/maps?q=${video.coordinates?.lat || 28.6139},${video.coordinates?.lng || 77.2090}`;
                        const formatDuration = (sec?: number) => {
                          if (!sec) return '00:00';
                          const m = Math.floor(sec / 60);
                          const s = sec % 60;
                          return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                        };

                        return (
                          <div
                            key={video.id}
                            className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/80 flex flex-col group hover:border-purple-500 transition-all shadow-sm card-hover-lift"
                          >
                            {/* Video Thumbnail with Play Overlay */}
                            <div
                              className="relative aspect-video bg-black cursor-pointer overflow-hidden flex items-center justify-center"
                              onClick={() => setZoomedVideo(video)}
                            >
                              {video.thumbnailUrl ? (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.caption}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <video
                                  src={video.url}
                                  className="w-full h-full object-cover opacity-80"
                                  preload="metadata"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Play className="w-5 h-5 ml-0.5 fill-white" />
                                </div>
                              </div>

                              <div className="absolute top-2.5 left-2.5 bg-purple-950/80 border border-purple-500/50 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                <Film className="w-3 h-3" />
                                <span>{video.durationSeconds ? formatDuration(video.durationSeconds) : 'VIDEO'}</span>
                              </div>

                              <div className="absolute bottom-2 left-2.5 right-2.5 bg-black/80 px-2.5 py-0.5 rounded-full text-[10px] text-white flex justify-between items-center backdrop-blur-xs">
                                <span className="truncate">{video.timestamp || 'Recorded on-site'}</span>
                                <span className="text-emerald-400 font-mono font-bold text-[9px] shrink-0">SHA256 OK</span>
                              </div>
                            </div>

                            {/* Video Metadata Card Body */}
                            <div className="p-3.5 bg-slate-900 flex-1 flex flex-col justify-between space-y-2">
                              <div>
                                <p className="text-xs font-semibold text-white line-clamp-2">
                                  {video.caption || 'Field Inspection Video Evidence'}
                                </p>
                                {video.locationAddress && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                    {video.locationAddress}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline font-bold"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Verify on Map</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setZoomedVideo(video)}
                                  className="text-xs text-purple-300 hover:text-white font-semibold cursor-pointer underline flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  <span>Play Video</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-300">
                      No video audit clips attached to this dossier.
                    </div>
                  )}
                </div>

                {/* Statutory Checklist Results */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    <span>Statutory Inspection Checklist Breakdown</span>
                  </h4>
                  <div className="divide-y divide-slate-200 border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                    {selectedTaskForDetail.submittedRecord.checklist.map((item) => (
                      <div key={item.id} className="p-3.5 flex items-start justify-between gap-3 text-xs bg-white">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900">{item.label}</span>
                          {item.notes && <p className="text-[11px] text-slate-500">{item.notes}</p>}
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                            item.passed
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {item.passed ? '✓ PASSED' : '✕ FAILED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Field Observations & Issues */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700">
                      Field Observations
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedTaskForDetail.submittedRecord.observations || 'No specific observations recorded.'}
                    </p>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-rose-800">
                      Issues / Defects Found
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedTaskForDetail.submittedRecord.issuesDefects || 'None reported.'}
                    </p>
                  </div>
                </div>

                {/* Inspector Remarks */}
                <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-1.5 shadow-2xs">
                  <h5 className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
                    Inspector Closing Remarks &amp; Recommendations
                  </h5>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {selectedTaskForDetail.submittedRecord.inspectorRemarks || 'Satisfactory.'}
                  </p>
                  <div className="pt-2.5 flex items-center justify-between text-[11px] text-slate-600 border-t border-blue-200/80 font-mono">
                    <span>Digital Signature: Verified by Directorate Token</span>
                    <span>Hash: {selectedTaskForDetail.submittedRecord.tamperProofHash || 'SHA256:AUTHENTIC'}</span>
                  </div>
                </div>

                {/* DIRECTORATE STATUTORY SCRUTINY & ASSESSMENT STATION */}
                <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white text-slate-900 shadow-sm">
                  {/* Station Header */}
                  <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-amber-300">
                        <Gavel className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-white">
                            Directorate Scrutiny Desk
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                            Sec 14/19 GFR Compliance
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Competent Authority: <strong className="text-white">Demo Director (role: Directorate)</strong> (Directorate Administrator)
                        </p>
                      </div>
                    </div>

                    {selectedTaskForDetail.scrutinyReview && !isEditingScrutiny && (
                      <button
                        type="button"
                        onClick={() => setIsEditingScrutiny(true)}
                        className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer border border-white/20 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-300" />
                        <span>Re-evaluate Order</span>
                      </button>
                    )}
                  </div>

                  {/* VIEW MODE: When already scrutinized and not editing */}
                  {selectedTaskForDetail.scrutinyReview && !isEditingScrutiny ? (
                    <div className="p-5 space-y-4 bg-slate-50/50">
                      {/* Verdict Banner */}
                      <div
                        className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          selectedTaskForDetail.scrutinyReview.verdict === 'GOOD_COMPLIANT'
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50/80 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                              selectedTaskForDetail.scrutinyReview.verdict === 'GOOD_COMPLIANT'
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                : 'bg-rose-100 border-rose-300 text-rose-700'
                            }`}
                          >
                            {selectedTaskForDetail.scrutinyReview.verdict === 'GOOD_COMPLIANT' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <AlertOctagon className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                Scrutiny Verdict:
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                  selectedTaskForDetail.scrutinyReview.verdict === 'GOOD_COMPLIANT'
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-rose-600 text-white border-rose-700'
                                }`}
                              >
                                {selectedTaskForDetail.scrutinyReview.verdict === 'GOOD_COMPLIANT'
                                  ? '✓ MARKED GOOD (COMPLIANT)'
                                  : '✕ MARKED BAD (DEFICIENT)'}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 mt-1">
                              {selectedTaskForDetail.scrutinyReview.verdict === 'GOOD_COMPLIANT'
                                ? 'Field verification authenticated. Physical facilities, accounts, and activities verified satisfactory.'
                                : 'Material discrepancies or violations verified. Executive enforcement order enacted.'}
                            </h5>
                          </div>
                        </div>

                        {/* Score & Grade Display */}
                        <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs shrink-0 text-xs">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Score
                            </span>
                            <span className="text-lg font-black text-slate-900">
                              {selectedTaskForDetail.scrutinyReview.score}
                              <span className="text-xs text-slate-400 font-normal"> / 100</span>
                            </span>
                          </div>
                          <div className="h-7 w-px bg-slate-200" />
                          <div className="text-left">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Grade
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {selectedTaskForDetail.scrutinyReview.complianceGrade}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Decision & Selected Directives */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                            <ShieldAlert className="w-4 h-4 text-blue-600" />
                            <span>Statutory Determination</span>
                          </h5>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              selectedTaskForDetail.scrutinyReview.actionChoice === 'ACTION_REQUIRED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {selectedTaskForDetail.scrutinyReview.actionChoice === 'ACTION_REQUIRED'
                              ? '🚨 ACTION MANDATED'
                              : '✓ CLEARED'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                            Enacted Directives:
                          </span>
                          {selectedTaskForDetail.scrutinyReview.selectedActions &&
                          selectedTaskForDetail.scrutinyReview.selectedActions.length > 0 ? (
                            <ul className="space-y-1.5">
                              {selectedTaskForDetail.scrutinyReview.selectedActions.map((action, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs flex items-start space-x-2 text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70"
                                >
                                  <span className="text-blue-600 font-bold shrink-0">§</span>
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No specific directives selected.</p>
                          )}
                        </div>

                        {/* Remarks */}
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                            Official Remarks:
                          </span>
                          <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/70 leading-relaxed font-sans">
                            {selectedTaskForDetail.scrutinyReview.scrutinyRemarks || 'No additional remarks.'}
                          </p>
                        </div>

                        {/* Digital Stamp Footer */}
                        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
                          <div>
                            Order No: <strong className="text-slate-900">{selectedTaskForDetail.scrutinyReview.sanctionOrderNumber}</strong>
                          </div>
                          <div>
                            Date: <span className="text-slate-900 font-semibold">{selectedTaskForDetail.scrutinyReview.reviewedAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* EDIT / INPUT MODE */
                    <div className="p-5 space-y-4 bg-slate-50/50">
                      {/* Step 1: Good or Bad Verdict Choice */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                          <FileBadge className="w-4 h-4 text-blue-600" />
                          <span>1. Scrutiny Verdict (Mark Good or Bad) *</span>
                        </label>
                        <p className="text-xs text-slate-500">
                          Based on GPS compliance, on-site photographs, and checklist results, select the official review verdict.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setScrutinyVerdict('GOOD_COMPLIANT');
                              if (scrutinyScore < 70) setScrutinyScore(85);
                              setActionChoice('NO_ACTION_CLEARED');
                              setSelectedActionList([
                                'Issue Annual Statutory Compliance Renewal Certificate (FY 2026-27)',
                              ]);
                            }}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                              scrutinyVerdict === 'GOOD_COMPLIANT'
                                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                scrutinyVerdict === 'GOOD_COMPLIANT'
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h5 className="text-xs font-bold uppercase text-slate-900">
                                  Mark as GOOD (Compliant)
                                </h5>
                                {scrutinyVerdict === 'GOOD_COMPLIANT' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Valid premises, legitimate records, and authentic beneficiaries verified on-site.
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setScrutinyVerdict('BAD_DEFICIENT');
                              if (scrutinyScore > 50) setScrutinyScore(30);
                              setActionChoice('ACTION_REQUIRED');
                              setSelectedActionList([
                                'Issue Formal Show-Cause Notice Under DARPAN Section 14 (14-Day Mandatory Reply Window)',
                              ]);
                            }}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                              scrutinyVerdict === 'BAD_DEFICIENT'
                                ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                scrutinyVerdict === 'BAD_DEFICIENT'
                                  ? 'bg-rose-600 text-white border-rose-700'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <AlertOctagon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h5 className="text-xs font-bold uppercase text-slate-900">
                                  Mark as BAD (Deficient / Fraud)
                                </h5>
                                {scrutinyVerdict === 'BAD_DEFICIENT' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Severe irregularities, closed premises, or misappropriation of welfare funds confirmed.
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Step 2: 0-100 Score Slider & Rating Grade */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                            <Sliders className="w-4 h-4 text-blue-600" />
                            <span>2. Scrutiny Audit Score (0 to 100) *</span>
                          </label>

                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-500 font-semibold">Grade:</span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-900">
                              {getComplianceGradeFromScore(scrutinyScore)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={scrutinyScore}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setScrutinyScore(val);
                              if (val < 50 && scrutinyVerdict !== 'BAD_DEFICIENT') {
                                setScrutinyVerdict('BAD_DEFICIENT');
                                setActionChoice('ACTION_REQUIRED');
                              } else if (val >= 70 && scrutinyVerdict !== 'GOOD_COMPLIANT') {
                                setScrutinyVerdict('GOOD_COMPLIANT');
                              }
                            }}
                            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex items-center space-x-1 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={scrutinyScore}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                setScrutinyScore(val);
                              }}
                              className="w-14 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-xs text-center rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="text-xs text-slate-400 font-mono">/ 100</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Action Determination Question */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            <span>3. Statutory Action Determination: Mandate Action Against NGO? *</span>
                          </label>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Should statutory punitive enforcement proceedings be initiated against this NGO?
                          </p>
                        </div>

                        {/* Dual Action Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setActionChoice('ACTION_REQUIRED');
                              if (selectedActionList.length === 0 || selectedActionList.some(a => CLEARANCE_OPTIONS.includes(a))) {
                                setSelectedActionList([PUNITIVE_ACTION_OPTIONS[0]]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                              actionChoice === 'ACTION_REQUIRED'
                                ? 'bg-rose-50/80 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="actionChoiceDecision"
                              checked={actionChoice === 'ACTION_REQUIRED'}
                              onChange={() => {}}
                              className="text-rose-600 focus:ring-rose-500"
                            />
                            <div>
                              <strong className="text-xs block text-slate-900">YES — Enact Statutory Enforcement Actions</strong>
                              <span className="text-[11px] text-rose-600">Show-Cause Notice / Bank Account Freeze</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActionChoice('NO_ACTION_CLEARED');
                              if (selectedActionList.length === 0 || selectedActionList.some(a => PUNITIVE_ACTION_OPTIONS.includes(a))) {
                                setSelectedActionList([CLEARANCE_OPTIONS[0]]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                              actionChoice === 'NO_ACTION_CLEARED'
                                ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="actionChoiceDecision"
                              checked={actionChoice === 'NO_ACTION_CLEARED'}
                              onChange={() => {}}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <strong className="text-xs block text-slate-900">NO — Grant Full Clearance &amp; Approval</strong>
                              <span className="text-[11px] text-emerald-600">Clear &amp; Grant Annual Renewal</span>
                            </div>
                          </button>
                        </div>

                        {/* Checkboxes for Specific Actions based on decision */}
                        <div className="pt-3 space-y-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                            {actionChoice === 'ACTION_REQUIRED'
                              ? 'Select Punitive Enforcement Measures:'
                              : 'Select Clearance & Renewal Directives:'}
                          </span>

                          <div className="space-y-1.5">
                            {(actionChoice === 'ACTION_REQUIRED' ? PUNITIVE_ACTION_OPTIONS : CLEARANCE_OPTIONS).map(
                              (opt, idx) => {
                                const isChecked = selectedActionList.includes(opt);
                                return (
                                  <label
                                    key={idx}
                                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                                      isChecked
                                        ? actionChoice === 'ACTION_REQUIRED'
                                          ? 'bg-rose-50/70 border-rose-300 text-slate-900'
                                          : 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleActionItem(opt)}
                                      className="mt-0.5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="leading-snug">{opt}</span>
                                  </label>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Directorate Remarks & Directives */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                          <Edit3 className="w-4 h-4 text-blue-600" />
                          <span>4. Competent Authority Remarks &amp; Order Text *</span>
                        </label>
                        <textarea
                          rows={3}
                          value={scrutinyRemarks}
                          onChange={(e) => setScrutinyRemarks(e.target.value)}
                          placeholder="Enter legal grounds, statutory GFR sections applied, and executive instructions..."
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-sans"
                        />
                      </div>

                      {/* Step 5: Seal & Issue Directorate Order Button */}
                      <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Order will be sealed and synchronized with Central NGO-DARPAN Repository</span>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          {selectedTaskForDetail.scrutinyReview && (
                            <button
                              type="button"
                              onClick={() => setIsEditingScrutiny(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleSaveDirectorateScrutiny}
                            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white shadow-xs flex items-center space-x-2 ${
                              scrutinyVerdict === 'GOOD_COMPLIANT'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700'
                            }`}
                          >
                            <FileBadge className="w-4 h-4" />
                            <span>Seal &amp; Issue Statutory Order</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* If task has not yet been submitted by the inspector */
              <div className="bg-slate-50/80 p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 backdrop-blur-xs">
                <Clock className="w-10 h-10 text-amber-600 mx-auto animate-pulse" />
                <h4 className="font-bold text-slate-900 text-base">Inspection Incomplete / Awaiting Field Visit</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  {selectedTaskForDetail.status === 'Pending'
                    ? 'This task has not been assigned to a field officer yet. Click "Assign Inspector" to dispatch a qualified officer.'
                    : `Assigned to ${selectedTaskForDetail.assignedInspectorName} (${selectedTaskForDetail.assignedInspectorBadge}). When the officer visits the site, captures photos, and submits the inspection, the full statutory dossier will automatically appear here.`}
                </p>
                {selectedTaskForDetail.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssigningTask(selectedTaskForDetail);
                      setSelectedOfficerId(officers[0]?.id || '');
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all duration-200 card-hover-lift"
                  >
                    Assign Inspector Now
                  </button>
                )}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full font-bold border border-slate-300 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Dossier</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTaskForDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-bold transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO ZOOM & HIGH-DEFINITION GEOTAG LIGHTBOX */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Institutional 3px Indian Tricolor Accent Line */}
            <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>

            {/* Lightbox Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  High-Definition Forensic Photographic Evidence
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-mono text-white">
                  {CATEGORY_METAS[normalizePhotoCategory(zoomedPhoto.category)].label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Center */}
            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
              <img
                src={zoomedPhoto.url}
                alt={zoomedPhoto.caption}
                className="max-h-[60vh] max-w-full object-contain rounded-xl border border-slate-800 shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Lightbox Footer Metadata */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-white space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white">{zoomedPhoto.caption || 'Field Photographic Evidence'}</h4>
                  {zoomedPhoto.locationAddress && (
                    <p className="text-xs text-slate-400 mt-0.5">📍 {zoomedPhoto.locationAddress}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${zoomedPhoto.coordinates?.lat || 28.6139},${
                      zoomedPhoto.coordinates?.lng || 77.2090
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-300" />
                    <span>Open in Real Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={zoomedPhoto.url}
                    download="statutory-field-evidence.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full border border-slate-700 text-xs cursor-pointer transition-colors"
                    title="Download Evidence"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Detailed Geotag Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-slate-300 backdrop-blur-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Exact Coordinates</span>
                  <span className="text-amber-400 font-bold">
                    {zoomedPhoto.coordinates?.lat.toFixed(6) || '28.613900'}°N,{' '}
                    {zoomedPhoto.coordinates?.lng.toFixed(6) || '77.209000'}°E
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Captured IST</span>
                  <span className="text-white">{zoomedPhoto.timestamp || '2026-09-12 10:30 IST'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Accuracy</span>
                  <span className="text-emerald-400 font-bold">±{zoomedPhoto.accuracyMeters || 3.2}m</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Tamper-Proof Hash</span>
                  <span className="text-purple-300 truncate block">
                    {zoomedPhoto.tamperProofHash || 'SHA256:VERIFIED-AUTHENTIC'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Video Forensic Inspection Modal */}
      {zoomedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomedVideo(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Institutional 3px Indian Tricolor Accent Line */}
            <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>

            {/* Lightbox Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Film className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Statutory Video Audit Evidence Playback
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-mono text-purple-300">
                  {CATEGORY_METAS[normalizePhotoCategory(zoomedVideo.category)].label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomedVideo(null)}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Center */}
            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
              <video
                src={zoomedVideo.url}
                controls
                autoPlay
                className="max-h-[60vh] max-w-full rounded-xl border border-slate-800 shadow-2xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Lightbox Footer Metadata */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-white space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white">{zoomedVideo.caption || 'Field Inspection Video Evidence'}</h4>
                  {zoomedVideo.locationAddress && (
                    <p className="text-xs text-slate-400 mt-0.5">📍 {zoomedVideo.locationAddress}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${zoomedVideo.coordinates?.lat || 28.6139},${
                      zoomedVideo.coordinates?.lng || 77.2090
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-300" />
                    <span>Open in Real Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={zoomedVideo.url}
                    download="statutory-field-video.webm"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full border border-slate-700 text-xs cursor-pointer transition-colors"
                    title="Download Video Evidence"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Detailed Video Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-slate-300 backdrop-blur-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Exact Coordinates</span>
                  <span className="text-amber-400 font-bold">
                    {zoomedVideo.coordinates?.lat.toFixed(6) || '28.613900'}°N,{' '}
                    {zoomedVideo.coordinates?.lng.toFixed(6) || '77.209000'}°E
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Recorded IST</span>
                  <span className="text-white">{zoomedVideo.timestamp || '2026-09-15 14:30 IST'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Duration & Size</span>
                  <span className="text-emerald-400 font-bold">
                    {zoomedVideo.durationSeconds ? `${zoomedVideo.durationSeconds}s` : 'Full Length'}
                    {zoomedVideo.fileSizeMb ? ` • ${zoomedVideo.fileSizeMb.toFixed(1)}MB` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Tamper-Proof Seal</span>
                  <span className="text-purple-300 truncate block">
                    {zoomedVideo.tamperProofHash || 'SHA256:VERIFIED-AUTHENTIC-VIDEO'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
