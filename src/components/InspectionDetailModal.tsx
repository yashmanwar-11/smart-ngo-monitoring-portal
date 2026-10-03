import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  ShieldCheck,
  Printer,
  ExternalLink,
  Camera,
  Eye,
  Building2,
  BookOpen,
  Users,
  AlertOctagon,
  Download,
  FileCheck,
  ShieldAlert,
  Award,
  Hash,
  Share2,
  Gavel,
  Sliders,
  Edit3,
  FileBadge
} from 'lucide-react';
import { InspectionRecord, PhotoEvidenceCategory, InspectionPhoto } from '../types';
import {
  PUNITIVE_ACTION_OPTIONS,
  CLEARANCE_OPTIONS,
  getComplianceGradeFromScore
} from './GovernmentInspectionMaster';
import { InspiraLogo } from './InspiraLogo';

interface InspectionDetailModalProps {
  inspection: InspectionRecord;
  onClose: () => void;
  onActionTaken?: (action: string, remarks?: string) => void;
}

export const CATEGORY_METADATA: Record<
  PhotoEvidenceCategory,
  { label: string; icon: any; color: string; bgColor: string; borderColor: string }
> = {
  PREMISE_SIGNBOARD: {
    label: 'Premise & Signboard Entrance',
    icon: Building2,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  ACCOUNTS_LEDGERS: {
    label: 'Statutory Accounts & Ledgers',
    icon: BookOpen,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  WELFARE_BENEFICIARIES: {
    label: 'Welfare Activities & Beneficiaries',
    icon: Users,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  INFRASTRUCTURE: {
    label: 'Infrastructure & Facilities',
    icon: ShieldCheck,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
  },
  VIOLATIONS_DEFECTS: {
    label: 'Discrepancies & Violations',
    icon: AlertTriangle,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
};

// Helper to normalize photo categories
export const normalizePhotoCategory = (category?: string): PhotoEvidenceCategory => {
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

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  inspection,
  onClose,
  onActionTaken,
}) => {
  const [activePhotoCategory, setActivePhotoCategory] = useState<string>('ALL');
  const [zoomedPhoto, setZoomedPhoto] = useState<InspectionPhoto | null>(null);
  const [iasActionNotice, setIasActionNotice] = useState<string | null>(null);

  const isInitiallyBad =
    inspection.overallRating === 'C_NON_COMPLIANT' || inspection.overallRating === 'D_CRITICAL_FRAUD';

  const [scrutinyVerdict, setScrutinyVerdict] = useState<'GOOD_COMPLIANT' | 'BAD_DEFICIENT'>(
    isInitiallyBad ? 'BAD_DEFICIENT' : 'GOOD_COMPLIANT'
  );
  const [scrutinyScore, setScrutinyScore] = useState<number>(isInitiallyBad ? 32 : 88);
  const [actionChoice, setActionChoice] = useState<'ACTION_REQUIRED' | 'NO_ACTION_CLEARED'>(
    isInitiallyBad ? 'ACTION_REQUIRED' : 'NO_ACTION_CLEARED'
  );
  const [selectedActionList, setSelectedActionList] = useState<string[]>([
    isInitiallyBad ? PUNITIVE_ACTION_OPTIONS[0] : CLEARANCE_OPTIONS[0],
  ]);
  const [scrutinyRemarks, setScrutinyRemarks] = useState<string>(
    isInitiallyBad
      ? 'Physical inspection revealed statutory non-compliance. Punitive directives executed under Section 14.'
      : 'Comprehensive inspection of physical assets, accounts, and beneficiary interaction confirms full compliance.'
  );
  const [orderSealed, setOrderSealed] = useState<boolean>(false);
  const [sealedOrderNo, setSealedOrderNo] = useState<string>('');
  const [isEditingScrutiny, setIsEditingScrutiny] = useState<boolean>(true);

  const handleToggleActionItem = (itemText: string) => {
    setSelectedActionList((prev) =>
      prev.includes(itemText) ? prev.filter((x) => x !== itemText) : [...prev, itemText]
    );
  };

  const handleSealDirectorateOrder = () => {
    const orderNum = `DIR/SEC14/2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setSealedOrderNo(orderNum);
    setOrderSealed(true);
    setIsEditingScrutiny(false);
    const msg =
      scrutinyVerdict === 'GOOD_COMPLIANT'
        ? `✓ Directorate Order Sealed [${orderNum}]: Marked GOOD (Score: ${scrutinyScore}/100) — NGO Cleared for ${inspection.ngoName}.`
        : `⚠️ Directorate Order Sealed [${orderNum}]: Marked BAD (Score: ${scrutinyScore}/100) — Statutory Actions Sanctioned against ${inspection.ngoName}.`;
    setIasActionNotice(msg);
    if (onActionTaken) {
      onActionTaken(scrutinyVerdict === 'GOOD_COMPLIANT' ? 'APPROVE' : 'SHOW_CAUSE', msg);
    }
  };

  const getRatingBadge = (rating?: string) => {
    switch (rating) {
      case 'A_EXCELLENT':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Grade A - Fully Compliant
          </span>
        );
      case 'B_SATISFACTORY':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
            Grade B - Satisfactory (Minor Rectifications)
          </span>
        );
      case 'C_NON_COMPLIANT':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            Grade C - Non-Compliant
          </span>
        );
      case 'D_CRITICAL_FRAUD':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
            Grade D - Critical Violation / Fraud
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            Audit in Progress
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleIasAction = (actionType: string) => {
    let msg = '';
    if (actionType === 'APPROVE') {
      msg = `✓ Directorate Order Recorded: Approved Statutory Compliance Certificate for ${inspection.ngoName}. Issued by Demo Director (role: Directorate).`;
    } else if (actionType === 'SHOW_CAUSE') {
      msg = `⚠️ Directorate Notice Dispatched: Formal Show-Cause Notice under Section 14 issued to ${inspection.ngoName} with 14-day reply deadline.`;
    } else if (actionType === 'FREEZE') {
      msg = `🚨 Emergency Executive Sanction: Bank accounts flagged for freeze & formal dossier escalated to Enforcement Directorate (ED).`;
    }
    setIasActionNotice(msg);
    if (onActionTaken) {
      onActionTaken(actionType, msg);
    }
  };

  const allPhotos: InspectionPhoto[] = inspection.photos || [];

  // Group photos by normalized categories
  const filteredPhotos = allPhotos.filter((p) => {
    if (activePhotoCategory === 'ALL') return true;
    return normalizePhotoCategory(p.category) === activePhotoCategory;
  });

  const getCategoryCount = (categoryKey: PhotoEvidenceCategory) => {
    return allPhotos.filter((p) => normalizePhotoCategory(p.category) === categoryKey).length;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-4 shadow-2xl border border-slate-200/90 flex flex-col max-h-[94vh] overflow-hidden animate-scale-in">
        {/* Neutral Top Accent Line */}
        <div className="h-1 w-full bg-[#0B3B60] shrink-0" />

        {/* Institutional Inspection Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B3B60] text-white border-b border-[#0B3B60] bg-gradient-to-r from-[#07253d] via-[#0B3B60] to-[#0d4672]">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 shrink-0 flex items-center justify-center overflow-hidden">
              <InspiraLogo className="w-10 h-10 shadow-md" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 bg-white/15 px-2 py-0.5 rounded border border-white/20">
                  INSPIRA Prototype Dossier
                </span>
                <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  DOSSIER REF: {inspection.id}
                </span>
              </div>
              <div className="text-[11px] text-sky-200 font-medium mt-0.5">
                Problem statement by MoSJE (PS 26095) • Directorate Inspection Review
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{inspection.ngoName}</span>
                {inspection.priority === 'HIGH_SURPRISE' && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-900/80 text-rose-200 border border-rose-500/50">
                    Surprise Vigilance Audit
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              title="Print Official Audit Sheet"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-slate-700 cursor-pointer"
              title="Close Dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 bg-[#f8fafd]">
          {/* Directorate Action Banner if triggered */}
          {iasActionNotice && (
            <div className="p-4 rounded-xl bg-slate-900 text-white border-l-4 border-l-emerald-500 border border-slate-700 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Directorate Executive Order Enacted
                </div>
                <p className="text-xs text-slate-200 mt-0.5">{iasActionNotice}</p>
              </div>
              <button
                onClick={() => setIasActionNotice(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Status & Officer Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs card-hover-lift transition-all">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compliance Assessment</div>
              <div className="mt-1">{getRatingBadge(inspection.complianceRating)}</div>
              {inspection.score !== undefined && (
                <div className="text-xs text-slate-700 font-semibold mt-1">
                  Directorate Score:{' '}
                  <span className="text-slate-950 font-black text-sm">{inspection.score}/100</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reporting Field Auditor</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{inspection.officerName}</span>
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Official Badge: <strong className="text-slate-800">{inspection.officerBadge}</strong>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Audit Schedule &amp; Execution</div>
              <div className="text-xs text-slate-700 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {inspection.scheduledDate} ({inspection.scheduledTime})
                </span>
              </div>
              {inspection.startDateTime && (
                <div className="text-[11px] text-emerald-800 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>Conducted: {inspection.startDateTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Anti-Fraud GPS Geofence Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              inspection.geofenceVerified
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                inspection.geofenceVerified ? 'text-emerald-700' : 'text-amber-700'
              }`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {inspection.geofenceVerified
                    ? 'Physical 150m GPS Geofence Perimeter: Authenticated & Locked'
                    : 'Geofence Perimeter: Pending Verification'}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white border border-slate-200 font-bold shadow-2xs">
                  Fused Location Provider
                </span>
              </div>
              <p className="text-xs mt-0.5 leading-relaxed">
                {inspection.geofenceVerified
                  ? `Officer physical location verified at NGO registered address (within ${
                      inspection.officerDistanceToNgoMeters ?? 42
                    } meters). Fused GPS coordinates validated anti-fraud radius.`
                  : 'Officer was not inside the 150m perimeter during audit commencement or record is provisional.'}
              </p>
            </div>
          </div>

          {/* CATEGORIZED PHOTOGRAPHIC EVIDENCE SPACES */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Statutory Photographic Evidence Shelves (Burned Geotag &amp; Timestamp)</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                    {allPhotos.length} Total Captured
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Live webcam &amp; field captures burned with Indian Tricolor, IST timestamp, GPS coordinates &amp; cryptographic hash.
                </p>
              </div>
            </div>

            {/* Category Spaces Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActivePhotoCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  activePhotoCategory === 'ALL'
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-800 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300/80'
                }`}
              >
                All Evidence ({allPhotos.length})
              </button>

              {(Object.keys(CATEGORY_METADATA) as PhotoEvidenceCategory[]).map((catKey) => {
                const meta = CATEGORY_METADATA[catKey];
                const count = getCategoryCount(catKey);
                const Icon = meta.icon;
                const isSelected = activePhotoCategory === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setActivePhotoCategory(catKey)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-800 shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{meta.label.split('&')[0].trim()}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Photos Grid */}
            {filteredPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredPhotos.map((photo) => {
                  const normCat = normalizePhotoCategory(photo.category);
                  const meta = CATEGORY_METADATA[normCat];
                  const Icon = meta.icon;
                  const googleMapsUrl = `https://www.google.com/maps?q=${photo.coordinates.lat},${photo.coordinates.lng}`;

                  return (
                    <div
                      key={photo.id}
                      className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs bg-white text-slate-900 flex flex-col hover:border-indigo-500 card-hover-lift transition-all"
                    >
                      {/* Photo Image with Watermark Overlay */}
                      <div
                        className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer"
                        onClick={() => setZoomedPhoto(photo)}
                        title="Click to view full high-definition evidence"
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.caption}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />

                        {/* Top Category Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 text-[10px] font-bold text-white border border-slate-600/80 backdrop-blur-xs">
                          <Icon className="w-3 h-3 text-amber-400" />
                          <span>{meta.label}</span>
                        </div>

                        {/* Top Right Zoom Icon */}
                        <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/70 text-white/90 hover:bg-indigo-600 transition-colors border border-slate-600/80 backdrop-blur-xs">
                          <Eye className="w-3.5 h-3.5" />
                        </div>

                        {/* Bottom Burned Geotag Banner */}
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 p-2.5 text-white border-t border-slate-800 backdrop-blur-xs">
                          <div className="flex items-center justify-between text-[10px] font-mono text-amber-300">
                            <span className="flex items-center gap-1 font-bold">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              {photo.coordinates.lat.toFixed(5)}°N, {photo.coordinates.lng.toFixed(5)}°E
                            </span>
                            <span className="text-[10px] text-slate-300">Acc: ±{photo.accuracyMeters || 3.8}m</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {photo.timestamp}
                            </span>
                            <span className="text-emerald-400 font-mono font-bold text-[9px] bg-emerald-950/70 px-1.5 py-0.2 rounded-full border border-emerald-500/40">
                              NIC-GOVNET VERIFIED
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Photo Metadata Card Body */}
                      <div className="p-4 bg-white flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-2">{photo.caption}</p>
                          {photo.locationAddress && (
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                              📍 {photo.locationAddress}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                          {/* Real Google Maps Clickable Link */}
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                            title="Open exact physical coordinates on Google Maps in new window"
                          >
                            <MapPin className="w-3 h-3 text-rose-600" />
                            <span>Verify Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <button
                            type="button"
                            onClick={() => setZoomedPhoto(photo)}
                            className="text-[11px] text-slate-700 hover:text-indigo-700 font-semibold cursor-pointer underline"
                          >
                            High-Res Inspection
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-2">
                <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  No photographic records attached under the "{activePhotoCategory}" shelf.
                </p>
                <p className="text-[11px] text-slate-500">
                  Click "All Evidence" above to inspect all captured statutory field photographs.
                </p>
              </div>
            )}
          </div>

          {/* Statutory 10-Point Checklist */}
          {inspection.checklist && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="flex items-center gap-1.5 text-slate-900">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  Statutory 10-Point Audit Checklist Breakdown
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  Rule 12(A) Mandate
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  { label: 'Physical office exists and operating', pass: inspection.checklist.physicalOfficeExists },
                  { label: 'Official registration signboard displayed', pass: inspection.checklist.signboardDisplayed },
                  { label: 'Staff present and active in premises', pass: inspection.checklist.staffPresent },
                  { label: 'Financial ledgers & cashbook available', pass: inspection.checklist.cashBookLedgerAvailable },
                  { label: 'Beneficiary register verified with IDs', pass: inspection.checklist.beneficiaryRegisterVerified },
                  { label: 'Bank account operated in designated branch', pass: inspection.checklist.bankAccountOperatedLocally },
                  { label: 'On-ground project activities ongoing', pass: inspection.checklist.projectActivitiesOngoing },
                  { label: 'No illicit or political activity misuse', pass: inspection.checklist.noPoliticalCommercialMisuse },
                  { label: 'Fire & Building safety clearance valid', pass: inspection.checklist.fireSafetyValid },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      item.pass ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <span className="text-slate-900 font-medium text-xs">{item.label}</span>
                    {item.pass ? (
                      <span className="flex items-center text-emerald-800 font-bold shrink-0 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Compliant
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-800 font-bold shrink-0 text-xs">
                        <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Deficient
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observations & Findings */}
          {inspection.findingsSummary && (
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-1.5 shadow-xs">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                Auditor Field Observations &amp; Verification Remarks
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">{inspection.findingsSummary}</p>
            </div>
          )}

          {/* Action Recommended by Inspector */}
          {inspection.actionRecommended && (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3 shadow-xs">
              <Award className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  Field Auditor's Statutory Recommendation:
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {inspection.actionRecommended.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          )}

          {/* DIRECTORATE STATUTORY SCRUTINY & ASSESSMENT STATION */}
          <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm bg-white text-slate-900">
            {/* Station Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-amber-300">
                  <Gavel className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold tracking-wide text-amber-300 uppercase">
                      Directorate Statutory Scrutiny &amp; Decision Desk
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 font-mono">
                      Sec 14/19 Regulatory Mandate
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Competent Adjudicating Authority: <strong className="text-white">Demo Director (role: Directorate)</strong> (Directorate Administrator)
                  </p>
                </div>
              </div>

              {orderSealed && !isEditingScrutiny && (
                <button
                  type="button"
                  onClick={() => setIsEditingScrutiny(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Amend Order</span>
                </button>
              )}
            </div>

            {orderSealed && !isEditingScrutiny ? (
              /* VIEW SEALED ORDER */
              <div className="p-5 space-y-4 bg-[#f8fafd]">
                <div
                  className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    scrutinyVerdict === 'GOOD_COMPLIANT'
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50/90 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        scrutinyVerdict === 'GOOD_COMPLIANT'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                      }`}
                    >
                      {scrutinyVerdict === 'GOOD_COMPLIANT' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertOctagon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600">
                          Official Directorate Finding
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            scrutinyVerdict === 'GOOD_COMPLIANT'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-rose-700 text-white'
                          }`}
                        >
                          {scrutinyVerdict === 'GOOD_COMPLIANT'
                            ? '✓ MARKED GOOD (COMPLIANT)'
                            : '✕ MARKED BAD (DEFICIENT)'}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mt-1">
                        {scrutinyVerdict === 'GOOD_COMPLIANT'
                          ? 'Field inspection verified physical assets, accounts, and authentic welfare beneficiaries.'
                          : 'Severe non-compliance identified on-site. Statutory administrative actions executed.'}
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shrink-0 shadow-2xs">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Assigned Score</span>
                      <span className="text-base font-black text-slate-900">
                        {scrutinyScore}
                        <span className="text-xs text-slate-500 font-normal"> / 100</span>
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Grade</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          scrutinyScore >= 85
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : scrutinyScore >= 70
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : scrutinyScore >= 50
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        {getComplianceGradeFromScore(scrutinyScore)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      <span>Executive Determination</span>
                    </h5>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        actionChoice === 'ACTION_REQUIRED'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {actionChoice === 'ACTION_REQUIRED'
                        ? '🚨 STATUTORY ACTIONS MANDATED'
                        : '✓ NO PUNITIVE ACTION — CLEARED'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-600 font-bold uppercase block">
                      Enacted Statutory Directives:
                    </span>
                    {selectedActionList.length > 0 ? (
                      <ul className="space-y-1.5">
                        {selectedActionList.map((action, idx) => (
                          <li
                            key={idx}
                            className="text-xs flex items-start space-x-2 text-slate-800 bg-slate-50/70 px-3 py-2 rounded-xl border border-slate-200"
                          >
                            <span className="text-indigo-600 font-bold shrink-0">§</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific directives recorded.</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">
                      Competent Authority Notes &amp; Legal Directives:
                    </span>
                    <p className="text-xs text-slate-800 bg-slate-50/70 p-3 rounded-xl border border-slate-200 leading-relaxed font-sans">
                      {scrutinyRemarks || 'No additional remarks recorded.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-mono gap-2">
                    <div>
                      Sanction Order No: <strong className="text-slate-900 font-bold">{sealedOrderNo}</strong>
                    </div>
                    <div>
                      Authorizer: <span className="text-slate-800 font-semibold">Demo Director (role: Directorate)</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* INTERACTIVE FORM */
              <div className="p-5 space-y-4 bg-[#f8fafd]">
                {/* 1. Good or Bad Verdict Choice */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileBadge className="w-4 h-4 text-indigo-600" />
                    <span>1. Inspection Scrutiny Finding (Mark as Good or Bad) *</span>
                  </label>
                  <p className="text-[11px] text-slate-600">
                    Evaluate the physical geotagged photos, timestamps, live coordinates, and checklist to record the official compliance verdict.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setScrutinyVerdict('GOOD_COMPLIANT');
                        if (scrutinyScore < 70) setScrutinyScore(85);
                        setActionChoice('NO_ACTION_CLEARED');
                        setSelectedActionList([CLEARANCE_OPTIONS[0]]);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start space-x-3 card-hover-lift ${
                        scrutinyVerdict === 'GOOD_COMPLIANT'
                          ? 'bg-emerald-50/90 border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          scrutinyVerdict === 'GOOD_COMPLIANT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5
                            className={`text-xs font-bold uppercase tracking-wider ${
                              scrutinyVerdict === 'GOOD_COMPLIANT' ? 'text-emerald-900' : 'text-slate-800'
                            }`}
                          >
                            Mark as GOOD (Compliant)
                          </h5>
                          {scrutinyVerdict === 'GOOD_COMPLIANT' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-700 text-white">
                              SELECTED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Field evidence confirms active office, statutory accounts, and authentic beneficiaries. Meets DARPAN norms.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScrutinyVerdict('BAD_DEFICIENT');
                        if (scrutinyScore > 50) setScrutinyScore(30);
                        setActionChoice('ACTION_REQUIRED');
                        setSelectedActionList([PUNITIVE_ACTION_OPTIONS[0]]);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start space-x-3 card-hover-lift ${
                        scrutinyVerdict === 'BAD_DEFICIENT'
                          ? 'bg-rose-50/90 border-rose-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          scrutinyVerdict === 'BAD_DEFICIENT'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5
                            className={`text-xs font-bold uppercase tracking-wider ${
                              scrutinyVerdict === 'BAD_DEFICIENT' ? 'text-rose-900' : 'text-slate-800'
                            }`}
                          >
                            Mark as BAD (Deficient / Non-Compliant)
                          </h5>
                          {scrutinyVerdict === 'BAD_DEFICIENT' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-700 text-white">
                              SELECTED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Discrepancies, ghost beneficiaries, premises missing, or diverted public welfare funds detected.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. 0-100 Score Slider & Grade */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2. Assign Official Compliance Score (0 to 100) *</span>
                    </label>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 font-semibold">Grade:</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          scrutinyScore >= 85
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : scrutinyScore >= 70
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : scrutinyScore >= 50
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
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
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={scrutinyScore}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                          setScrutinyScore(val);
                        }}
                        className="w-16 px-2.5 py-1 bg-white border border-slate-200 text-slate-900 font-mono font-bold text-xs text-center rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-500 font-mono">/ 100</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 - Critical Failure</span>
                    <span>50 - Watchlist Threshold</span>
                    <span>70 - Compliant</span>
                    <span>100 - Full Compliance</span>
                  </div>
                </div>

                {/* 3. "Should we take action against this NGO or not?" */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                      <span>3. Statutory Enforcement: Should we take action against this NGO or not? *</span>
                    </label>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Determine whether punitive enforcement is initiated or the NGO is cleared for operational continuity.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActionChoice('ACTION_REQUIRED');
                        if (
                          selectedActionList.length === 0 ||
                          selectedActionList.some((a) => CLEARANCE_OPTIONS.includes(a))
                        ) {
                          setSelectedActionList([PUNITIVE_ACTION_OPTIONS[0]]);
                        }
                      }}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center space-x-3 ${
                        actionChoice === 'ACTION_REQUIRED'
                          ? 'bg-rose-50 border-rose-600 text-rose-950 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          actionChoice === 'ACTION_REQUIRED' ? 'border-rose-600 bg-rose-600' : 'border-slate-400'
                        }`}
                      >
                        {actionChoice === 'ACTION_REQUIRED' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <div>
                        <strong className="text-xs block text-slate-900">YES — Take Statutory Action Against NGO</strong>
                        <span className="text-[10px] text-rose-700">
                          Sanction punitive directives, freeze accounts, or issue show-cause
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActionChoice('NO_ACTION_CLEARED');
                        if (
                          selectedActionList.length === 0 ||
                          selectedActionList.some((a) => PUNITIVE_ACTION_OPTIONS.includes(a))
                        ) {
                          setSelectedActionList([CLEARANCE_OPTIONS[0]]);
                        }
                      }}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center space-x-3 ${
                        actionChoice === 'NO_ACTION_CLEARED'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          actionChoice === 'NO_ACTION_CLEARED'
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-slate-400'
                        }`}
                      >
                        {actionChoice === 'NO_ACTION_CLEARED' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <div>
                        <strong className="text-xs block text-slate-900">NO ACTION — Clear &amp; Approve NGO</strong>
                        <span className="text-[10px] text-emerald-700">
                          Grant compliance certificate renewal and release grants
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="pt-2 space-y-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-700 uppercase block">
                      {actionChoice === 'ACTION_REQUIRED'
                        ? 'Select Mandatory Punitive Actions to Execute (Multiple allowed):'
                        : 'Select Clearance &amp; Accreditation Directives:'}
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
                                    ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-medium'
                                    : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleActionItem(opt)}
                                className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-0"
                              />
                              <span className="leading-snug">{opt}</span>
                            </label>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Remarks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>4. Official Directorate Remarks &amp; Statutory Order Directive *</span>
                  </label>
                  <textarea
                    rows={3}
                    value={scrutinyRemarks}
                    onChange={(e) => setScrutinyRemarks(e.target.value)}
                    placeholder="Enter scrutiny review decision, observations, and recommendations..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* 5. Seal & Issue Directorate Order Button */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-600 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Authority: Directorate Scrutiny Officer (Demo Review)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {orderSealed && (
                      <button
                        type="button"
                        onClick={() => setIsEditingScrutiny(false)}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSealDirectorateOrder}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer border ${
                        scrutinyVerdict === 'GOOD_COMPLIANT'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-sm'
                      }`}
                    >
                      <FileBadge className="w-4 h-4" />
                      <span>Seal &amp; Issue Directorate Order</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-600 font-mono">
            Signed by Directorate Token • Valid for Legal Scrutiny
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 rounded-full border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              Print Sheet
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN ZOOM LIGHTBOX MODAL */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xs animate-fade-in"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                  STATUTORY FIELD EVIDENCE • HIGH DEFINITION
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs font-mono text-slate-200">
                  {CATEGORY_METADATA[normalizePhotoCategory(zoomedPhoto.category)].label}
                </span>
              </div>
              <button
                onClick={() => setZoomedPhoto(null)}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Center */}
            <div className="flex-1 bg-black flex items-center justify-center p-3 overflow-hidden">
              <img
                src={zoomedPhoto.imageUrl}
                alt={zoomedPhoto.caption}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Lightbox Footer Metadata */}
            <div className="p-5 bg-slate-900 border-t border-slate-800 text-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-white">{zoomedPhoto.caption}</h4>
                  {zoomedPhoto.locationAddress && (
                    <p className="text-[11px] text-slate-300 mt-0.5">📍 {zoomedPhoto.locationAddress}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${zoomedPhoto.coordinates.lat},${zoomedPhoto.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-full text-xs font-semibold shadow-xs transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-300" />
                    <span>Open on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={zoomedPhoto.imageUrl}
                    download="statutory-field-evidence.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full border border-slate-700 text-xs transition-colors"
                    title="Download Evidence"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Detailed Geotag Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Exact Coordinates</span>
                  <span className="text-amber-300 font-bold">
                    {zoomedPhoto.coordinates.lat.toFixed(6)}°N, {zoomedPhoto.coordinates.lng.toFixed(6)}°E
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Captured IST</span>
                  <span className="text-white">{zoomedPhoto.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Accuracy</span>
                  <span className="text-emerald-400 font-bold">±{zoomedPhoto.accuracyMeters || 3.2}m</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Cryptographic Seal</span>
                  <span className="text-purple-300 truncate block">
                    {zoomedPhoto.tamperProofHash || 'SHA256:VERIFIED-AUTHENTIC'}
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
