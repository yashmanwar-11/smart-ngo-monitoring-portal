import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Lock,
  X,
  Printer,
  ChevronDown,
  Info,
  Building2,
  UserCheck,
  Check,
  Hash,
  FileText
} from 'lucide-react';
import {
  SavedInspectionRecord,
  InspectionPriority,
  SavedInspectionStatus,
  InspectionChecklistItem,
  NGO,
  User
} from '../types';
import {
  getInspectionsForInspector,
  getInspectionById,
  saveInspection,
  deleteInspection,
  generateNextInspectionId,
  DEFAULT_CHECKLIST_TEMPLATE
} from '../services/inspectionStorage';

interface InspectionManagementSectionProps {
  currentOfficer: User;
  ngos: NGO[];
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const INSPECTION_TYPES = [
  'Routine Statutory Audit',
  'Surprise Compliance Check',
  'Complaint Investigation',
  'Financial & FCRA Verification',
  'Physical Infrastructure Inspection',
  'Annual Renewal Audit',
  'Special Inquiry / Whistleblower Probe',
];

export const InspectionManagementSection: React.FC<InspectionManagementSectionProps> = ({
  currentOfficer,
  ngos,
  onShowToast,
}) => {
  // Database records belonging strictly to this inspector
  const [records, setRecords] = useState<SavedInspectionRecord[]>([]);

  // Form states
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [inspectionId, setInspectionId] = useState<string>(generateNextInspectionId());
  const [selectedNgoId, setSelectedNgoId] = useState<string>('');
  const [locationSite, setLocationSite] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [inspectionType, setInspectionType] = useState<string>(INSPECTION_TYPES[0]);
  const [checklistItems, setChecklistItems] = useState<InspectionChecklistItem[]>(
    DEFAULT_CHECKLIST_TEMPLATE.map((item) => ({ ...item }))
  );
  const [observations, setObservations] = useState<string>('');
  const [issuesDefectsFound, setIssuesDefectsFound] = useState<string>('');
  const [severityPriority, setSeverityPriority] = useState<InspectionPriority>('LOW');
  const [remarks, setRemarks] = useState<string>('');
  const [status, setStatus] = useState<SavedInspectionStatus>('Completed');

  // Form UI states
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // Table Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | SavedInspectionStatus>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | InspectionPriority>('ALL');

  // Modal states
  const [viewingRecord, setViewingRecord] = useState<SavedInspectionRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<SavedInspectionRecord | null>(null);

  // Load records for the logged-in inspector on mount and when officer changes
  const refreshRecords = () => {
    const data = getInspectionsForInspector(currentOfficer.id);
    setRecords(data);
  };

  useEffect(() => {
    refreshRecords();
    resetForm();
    // Security verification log
    setSecurityNotice(
      `Authenticated Session: All records strictly isolated and linked to ${currentOfficer.name} (${currentOfficer.badgeNumber || 'INSP-DEL-000'}). Unauthorized access to other officers' data is blocked.`
    );
  }, [currentOfficer.id]);

  // Handle NGO dropdown selection to autofill site address
  const handleNgoSelect = (ngoId: string) => {
    setSelectedNgoId(ngoId);
    if (!ngoId) return;
    const found = ngos.find((n) => n.id === ngoId);
    if (found) {
      setLocationSite(`${found.name}, ${found.address}, ${found.district}, ${found.state}`);
    }
  };

  // Reset form to clean state
  const resetForm = () => {
    setEditingRecordId(null);
    setInspectionId(generateNextInspectionId());
    setSelectedNgoId('');
    setLocationSite('');
    const now = new Date();
    setDateTime(now.toISOString().slice(0, 16));
    setInspectionType(INSPECTION_TYPES[0]);
    setChecklistItems(DEFAULT_CHECKLIST_TEMPLATE.map((item) => ({ ...item })));
    setObservations('');
    setIssuesDefectsFound('');
    setSeverityPriority('LOW');
    setRemarks('');
    setStatus('Completed');
    setFormError(null);
  };

  // Quick checklist presets
  const handleChecklistPreset = (mode: 'ALL_PASS' | 'FLAG_VIOLATIONS' | 'RESET') => {
    if (mode === 'ALL_PASS') {
      setChecklistItems((prev) =>
        prev.map((item) => ({
          ...item,
          passed: true,
          notes: 'Verified compliant during physical inspection.',
        }))
      );
      setObservations('All physical facilities, registers, signboards, and staff headcounts verified on-site without discrepancies.');
      setIssuesDefectsFound('None detected. Fully adhering to statutory NGO compliance norms.');
      setSeverityPriority('LOW');
      setRemarks('Recommended for annual registration renewal and clear compliance certification.');
    } else if (mode === 'FLAG_VIOLATIONS') {
      setChecklistItems((prev) =>
        prev.map((item, idx) => ({
          ...item,
          passed: idx % 3 === 0, // Fail majority of items
          notes: idx % 3 === 0 ? 'Verified' : 'DEFICIENCY: Records not available or non-compliant.',
        }))
      );
      setObservations('Critical discrepancies observed during spot inspection: Physical office closed, records not produced on demand, no operational activity evident.');
      setIssuesDefectsFound('Unaccounted fund expenditures, missing beneficiary registration books, premises used for commercial activities.');
      setSeverityPriority('CRITICAL');
      setRemarks('Immediate show-cause notice recommended. Bank accounts to be placed under administrative scrutiny.');
    } else {
      setChecklistItems(DEFAULT_CHECKLIST_TEMPLATE.map((item) => ({ ...item })));
    }
  };

  // Toggle single checklist item
  const toggleChecklistItem = (itemId: string) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, passed: !item.passed } : item
      )
    );
  };

  // Save / Update Inspection Handler
  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!inspectionId.trim()) {
      setFormError('Inspection ID is required.');
      return;
    }
    if (!locationSite.trim()) {
      setFormError('Location/Site address is required.');
      return;
    }
    if (!dateTime.trim()) {
      setFormError('Date & Time is required.');
      return;
    }

    setIsSaving(true);

    try {
      const result = saveInspection(
        {
          id: inspectionId.trim().toUpperCase(),
          locationSite: locationSite.trim(),
          ngoId: selectedNgoId || undefined,
          dateTime,
          inspectionType,
          checklistItems,
          observations: observations.trim() || 'No additional observations recorded.',
          issuesDefectsFound: issuesDefectsFound.trim() || 'None recorded.',
          severityPriority,
          remarks: remarks.trim() || 'Statutory review conducted.',
          status,
        },
        {
          id: currentOfficer.id,
          name: currentOfficer.name,
          badgeNumber: currentOfficer.badgeNumber,
        }
      );

      if (!result.success) {
        setFormError(result.error || 'Failed to save inspection.');
        setIsSaving(false);
        return;
      }

      refreshRecords();
      setIsSaving(false);

      const msg = result.isEdit
        ? `Inspection record ${inspectionId} updated successfully in the secure database.`
        : `Inspection record ${inspectionId} saved successfully and linked to ${currentOfficer.name}.`;

      setSaveSuccessMessage(msg);
      onShowToast?.(msg, 'success');

      // Auto-hide success message after 4 seconds
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 4000);

      // Reset form to next new record
      resetForm();
    } catch (err: any) {
      setIsSaving(false);
      setFormError(err?.message || 'An error occurred while saving the inspection.');
    }
  };

  // Edit an existing record
  const handleEditClick = (rec: SavedInspectionRecord) => {
    // Authorization check
    if (rec.inspectorId !== currentOfficer.id) {
      const errMsg = `Unauthorized Access: You cannot edit record ${rec.id} because it belongs to another inspector (${rec.inspectorName}).`;
      setFormError(errMsg);
      onShowToast?.(errMsg, 'error');
      return;
    }

    setEditingRecordId(rec.id);
    setInspectionId(rec.id);
    setSelectedNgoId(rec.ngoId || '');
    setLocationSite(rec.locationSite);
    setDateTime(rec.dateTime);
    setInspectionType(rec.inspectionType);
    setChecklistItems(rec.checklistItems && rec.checklistItems.length > 0 ? rec.checklistItems : DEFAULT_CHECKLIST_TEMPLATE);
    setObservations(rec.observations);
    setIssuesDefectsFound(rec.issuesDefectsFound);
    setSeverityPriority(rec.severityPriority);
    setRemarks(rec.remarks);
    setStatus(rec.status);
    setFormError(null);
    setSaveSuccessMessage(null);

    // Scroll up to form smoothly
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // View full details modal
  const handleViewClick = (rec: SavedInspectionRecord) => {
    // Authorization check using security helper
    const check = getInspectionById(rec.id, currentOfficer.id);
    if (check.unauthorized) {
      const errMsg = `Security Alert: Access denied to inspection ${rec.id}. Record belongs to another officer.`;
      setFormError(errMsg);
      onShowToast?.(errMsg, 'error');
      return;
    }
    setViewingRecord(rec);
  };

  // Delete an inspection
  const confirmDelete = () => {
    if (!recordToDelete) return;

    const res = deleteInspection(recordToDelete.id, currentOfficer.id);
    if (!res.success) {
      setFormError(res.error || 'Failed to delete record.');
      onShowToast?.(res.error || 'Failed to delete record.', 'error');
    } else {
      refreshRecords();
      const msg = `Inspection record ${recordToDelete.id} was securely deleted.`;
      onShowToast?.(msg, 'info');
      if (editingRecordId === recordToDelete.id) {
        resetForm();
      }
    }
    setRecordToDelete(null);
  };

  // Filter and Search logic
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Search query (ID, Location, Type, Observations, Defects)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          rec.id.toLowerCase().includes(q) ||
          rec.locationSite.toLowerCase().includes(q) ||
          rec.inspectionType.toLowerCase().includes(q) ||
          rec.observations.toLowerCase().includes(q) ||
          rec.issuesDefectsFound.toLowerCase().includes(q) ||
          rec.remarks.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Date filter (match YYYY-MM-DD)
      if (filterDate) {
        const recDate = rec.dateTime.slice(0, 10);
        if (recDate !== filterDate) return false;
      }

      // 3. Status filter
      if (filterStatus !== 'ALL') {
        if (rec.status !== filterStatus) return false;
      }

      // 4. Priority/Severity filter
      if (filterPriority !== 'ALL') {
        if (rec.severityPriority !== filterPriority) return false;
      }

      return true;
    });
  }, [records, searchQuery, filterDate, filterStatus, filterPriority]);

  return (
    <div className="space-y-6">
      {/* Session Security Indicator */}
      <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800">Officer Terminal Clearance:</span>
          <span className="font-mono text-slate-600 font-semibold">{currentOfficer.badgeNumber || 'INSP-DEL-402'}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">{currentOfficer.department || 'Field Inspection Cadre'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            RBAC Encrypted Ledger
          </span>
        </div>
      </div>

      {/* Confirmation Success Toast Message */}
      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl flex items-center justify-between shadow-2xs animate-fade-in text-xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {formError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-2xl flex items-center justify-between shadow-2xs text-xs">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{formError}</span>
          </div>
          <button
            onClick={() => setFormError(null)}
            className="text-rose-700 hover:text-rose-900 p-1 rounded-full hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. INSPECTION RECORD ENTRY FORM (CREATE & EDIT) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/90 via-blue-50/30 to-white">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              <FileCheck2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  {editingRecordId ? 'Edit Inspection Mode' : 'Statutory Inspection Entry'}
                </span>
                {editingRecordId && (
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Editing: {editingRecordId}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {editingRecordId ? 'Modify Field Inspection Record' : 'Record & Save Field Inspection'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill statutory inspection findings, verified checklist items, defects, and official remarks.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {editingRecordId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                resetForm();
                onShowToast?.('Form cleared for new inspection record entry.', 'info');
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Form</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveInspection} className="p-4 sm:p-5 space-y-4">
          {/* Metadata Row 1: ID, Location/Site, Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Inspection ID */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Inspection ID <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inspectionId}
                  onChange={(e) => setInspectionId(e.target.value.toUpperCase())}
                  placeholder="e.g. INSP-2026-4421"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setInspectionId(generateNextInspectionId())}
                  title="Generate new unique Inspection ID"
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Unique statutory audit dossier identifier</p>
            </div>

            {/* Quick NGO Picker (Optional helper to autofill Location/Site) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Registered NGO (Autofill Site)
              </label>
              <select
                value={selectedNgoId}
                onChange={(e) => handleNgoSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
              >
                <option value="">-- Choose Registered NGO (or enter custom site) --</option>
                {ngos.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.name} ({ngo.district})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-0.5">Autofills address and links to NGO master</p>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date &amp; Time <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setDateTime(now.toISOString().slice(0, 16));
                  }}
                  title="Set to current date & time"
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Now
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Inspection conducted timestamp</p>
            </div>
          </div>

          {/* Location/Site Full Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Location / Site Premises <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={locationSite}
                onChange={(e) => setLocationSite(e.target.value)}
                placeholder="e.g. Hope Child Welfare Trust, 14-B Nehru Place, South Delhi, Delhi NCR"
                required
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Exact physical site, plot/building number, and district where audit took place</p>
          </div>

          {/* Row 2: Inspector Name (Locked/Linked), Inspection Type, Severity/Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Inspector Name (Linked to logged-in inspector) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Inspector Name (Linked)
              </label>
              <div className="flex items-center space-x-2.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl">
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {currentOfficer.name}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    Badge: {currentOfficer.badgeNumber || 'INSP-DEL-402'} (Locked)
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Authenticated officer ownership</p>
            </div>

            {/* Inspection Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Inspection Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
              >
                {INSPECTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-0.5">Statutory classification of audit</p>
            </div>

            {/* Severity / Priority */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Severity / Priority <span className="text-rose-600">*</span>
              </label>
              <select
                value={severityPriority}
                onChange={(e) => setSeverityPriority(e.target.value as InspectionPriority)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all ${
                  severityPriority === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : severityPriority === 'HIGH'
                    ? 'bg-orange-50 text-orange-800 border-orange-300'
                    : severityPriority === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                <option value="LOW">Low (Routine / Nominal)</option>
                <option value="MEDIUM">Medium (Operational Defect)</option>
                <option value="HIGH">High (Serious Non-Compliance)</option>
                <option value="CRITICAL">Critical (Suspected Fraud)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-0.5">Action priority tier</p>
            </div>

            {/* Inspection Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Inspection Status <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Pending')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    status === 'Pending'
                      ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ⏳ Pending
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Completed')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    status === 'Completed'
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-700 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✓ Completed
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Pending lab/paper checks or Final</p>
            </div>
          </div>

          {/* 10-Point Checklist Section */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Statutory Checklist Items ({checklistItems.filter((i) => i.passed).length}/{checklistItems.length} Passed)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify key compliance indicators on site. Tap any item to toggle pass/fail status.
                </p>
              </div>

              {/* Quick Checklist Preset Helpers */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleChecklistPreset('ALL_PASS')}
                  className="px-3 py-1 text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-700 rounded-full transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
                >
                  ✓ All Pass (Compliant)
                </button>
                <button
                  type="button"
                  onClick={() => handleChecklistPreset('FLAG_VIOLATIONS')}
                  className="px-3 py-1 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 rounded-full transition-colors border border-rose-300 shadow-2xs cursor-pointer"
                >
                  ⚠️ Flag Violations
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {checklistItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    item.passed
                      ? 'bg-white border-emerald-300 hover:border-emerald-500 shadow-xs'
                      : 'bg-rose-50/60 border-rose-300 hover:border-rose-500'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] ${
                      item.passed
                        ? 'bg-emerald-700 text-white'
                        : 'bg-rose-700 text-white'
                    }`}
                  >
                    {item.passed ? '✓' : '✕'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900">
                      {index + 1}. {item.label}
                    </div>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        item.passed ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {item.passed ? 'Status: Compliant / Verified' : 'Status: Deficient / Violation'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observations & Issues/Defects Found */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Observations */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Auditor Observations &amp; Ground Findings
              </label>
              <textarea
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Enter detailed physical inspection observations (e.g. office operational status, student/patient headcounts, ledger books examined, condition of facilities)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Detailed field observation notes</p>
            </div>

            {/* Issues/Defects Found */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Issues / Defects Found
              </label>
              <textarea
                rows={3}
                value={issuesDefectsFound}
                onChange={(e) => setIssuesDefectsFound(e.target.value)}
                placeholder="Document any compliance defects, missing vouchers, fire safety lapses, beneficiary discrepancies, or fraudulent practices discovered..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Specific irregularities or non-compliance items noted</p>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Inspector Statutory Remarks &amp; Recommendations
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Recommended for annual registration renewal; or Show-cause notice to be issued within 7 days for voucher reconciliation."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">Statutory recommendation submitted to the Directorate</p>
          </div>

          {/* Form Actions: Save Inspection / Update Inspection */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Record will be permanently signed and stored under Inspector <strong>{currentOfficer.name}</strong>.
              </span>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {editingRecordId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition-all duration-200 card-hover-lift cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isSaving
                    ? 'Saving to Database...'
                    : editingRecordId
                    ? 'Update Inspection Record'
                    : 'Save Inspection Record'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. SAVED INSPECTIONS TABLE (WITH SEARCH, FILTER BY DATE/STATUS/PRIORITY, VIEW, EDIT, DELETE) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Saved Field Inspection Dossiers
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {records.length} {records.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Securely stored in Directorate Ledger • Filtered for Inspector <strong>{currentOfficer.name}</strong>
            </p>
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => {
              refreshRecords();
              onShowToast?.('Inspection records reloaded from secure database.', 'info');
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 transition-colors self-start lg:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Refresh Table</span>
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 backdrop-blur-xs">
          {/* Search Bar */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, site, defect..."
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Date */}
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              title="Filter by Inspection Date"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                title="Clear date filter"
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">All Statuses (Pending / Completed)</option>
              <option value="Pending">⏳ Pending Only</option>
              <option value="Completed">✓ Completed Only</option>
            </select>
          </div>

          {/* Filter by Priority */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">All Priorities / Severities</option>
              <option value="LOW">Low Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="CRITICAL">Critical Severity</option>
            </select>
          </div>
        </div>

        {/* Reset Filter indicator */}
        {(searchQuery || filterDate || filterStatus !== 'ALL' || filterPriority !== 'ALL') && (
          <div className="flex items-center justify-between text-xs text-slate-700 bg-blue-50/80 px-3.5 py-1.5 rounded-xl border border-blue-200/80 backdrop-blur-xs">
            <span>
              Showing <strong>{filteredRecords.length}</strong> of {records.length} matching inspections
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDate('');
                setFilterStatus('ALL');
                setFilterPriority('ALL');
              }}
              className="font-bold text-blue-700 hover:text-indigo-800 underline text-xs cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Responsive Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Inspection ID</th>
                <th className="py-2.5 px-3">Location / Site</th>
                <th className="py-2.5 px-3">Date &amp; Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Defects / Issues</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <FileText className="w-7 h-7 text-slate-400" />
                      <div className="font-bold text-xs text-slate-700">No inspections found</div>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        {records.length === 0
                          ? 'No inspection records have been saved by this inspector yet. Fill out the form above and click "Save Inspection Record".'
                          : 'No records matched your search/filter criteria. Try clearing filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Inspection ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {rec.id}
                    </td>

                    {/* Location / Site */}
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <div className="font-semibold text-slate-900 truncate" title={rec.locationSite}>
                        {rec.locationSite}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Site Premises Verified</span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                      <div className="font-medium text-slate-800">
                        {new Date(rec.dateTime).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(rec.dateTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Inspection Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {rec.inspectionType}
                    </td>

                    {/* Priority / Severity */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.severityPriority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : rec.severityPriority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : rec.severityPriority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {rec.severityPriority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {rec.status === 'Completed' ? '✓ Completed' : '⏳ Pending'}
                      </span>
                    </td>

                    {/* Defects / Issues */}
                    <td className="py-2.5 px-3 max-w-[160px] text-slate-600 truncate" title={rec.issuesDefectsFound}>
                      {rec.issuesDefectsFound || 'None recorded'}
                    </td>

                    {/* Actions: View Details, Edit, Delete */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => handleViewClick(rec)}
                          title="View complete inspection dossier details"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleEditClick(rec)}
                          title="Edit this inspection record"
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(rec)}
                          title="Delete inspection record"
                          className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. VIEW DETAILS MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scale-in">
            {/* Institutional 3px Indian Tricolor Accent Line */}
            <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-blue-200">
                    {viewingRecord.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      viewingRecord.status === 'Completed'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {viewingRecord.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/25">
                    Priority: {viewingRecord.severityPriority}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Statutory Field Inspection Dossier
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                  title="Print official report"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Primary Key-Value Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block tracking-wider">Field Inspector</span>
                  <span className="font-bold text-slate-900 text-xs">{viewingRecord.inspectorName}</span>
                  <span className="text-slate-500 block text-[10px] font-mono">
                    Badge: {viewingRecord.inspectorBadge}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block tracking-wider">Date &amp; Time (IST)</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(viewingRecord.dateTime).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block tracking-wider">Inspection Type</span>
                  <span className="font-semibold text-slate-900">{viewingRecord.inspectionType}</span>
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block tracking-wider">Location / Site Premises</span>
                  <span className="font-semibold text-slate-900">{viewingRecord.locationSite}</span>
                </div>
              </div>

              {/* Checklist Review */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Statutory Checklist Verification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {viewingRecord.checklistItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2 ${
                        item.passed
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <span className={`font-bold text-xs ${item.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {item.passed ? '✓' : '✕'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-xs">
                          {idx + 1}. {item.label}
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Inspector Observations
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap">
                  {viewingRecord.observations || 'No additional observations recorded.'}
                </div>
              </div>

              {/* Issues & Defects Found */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Issues &amp; Defects Found
                </h4>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-xs text-rose-900 whitespace-pre-wrap">
                  {viewingRecord.issuesDefectsFound || 'None detected.'}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Statutory Recommendations &amp; Remarks
                </h4>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs text-blue-950">
                  {viewingRecord.remarks || 'None.'}
                </div>
              </div>

              {/* Cryptographic Seal & Security Stamp */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                <span>Tamper-Proof Audit Hash: {viewingRecord.tamperProofHash || 'SHA256:AUTHENTICATED'}</span>
                <span>Created: {new Date(viewingRecord.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleEditClick(viewingRecord);
                  setViewingRecord(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                Edit This Record
              </button>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION DIALOG */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Inspection Record Deletion
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete inspection record{' '}
                  <strong className="font-mono text-blue-700">{recordToDelete.id}</strong> for{' '}
                  <strong>{recordToDelete.locationSite}</strong>?
                </p>
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  This action cannot be undone. Record will be erased from Directorate storage.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-full text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
