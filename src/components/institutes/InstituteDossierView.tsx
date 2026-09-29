import React, { useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Building,
  GraduationCap,
  Heart,
  Award,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Edit,
  ClipboardList,
  Video,
  FileText,
  Navigation,
  Phone,
  Mail,
  Globe,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  X,
  FileCheck,
  Eye,
  CheckCircle,
  AlertTriangle,
  Download
} from 'lucide-react';
import { NGO, InspectionRecord, User } from '../../types';
import { EditInstituteModal } from './EditInstituteModal';
import { InstituteLiveCctvView } from './InstituteLiveCctvView';
import { InteractiveMap } from '../InteractiveMap';

interface InstituteDossierViewProps {
  institute: NGO;
  inspections: InspectionRecord[];
  currentOfficer: User;
  onBack: () => void;
  onScheduleInspection: (institute: NGO) => void;
  onOpenAuditDossier: (inspection: InspectionRecord) => void;
  onUpdateInstitute: (updatedNgo: NGO) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const InstituteDossierView: React.FC<InstituteDossierViewProps> = ({
  institute,
  inspections,
  currentOfficer,
  onBack,
  onScheduleInspection,
  onOpenAuditDossier,
  onUpdateInstitute,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INSPECTIONS' | 'CCTV' | 'DOCUMENTS' | 'CONTACT'>('OVERVIEW');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Gallery photos
  const photos = institute.photos && institute.photos.length > 0
    ? institute.photos
    : [
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1200', // Gate
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200', // Reception
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200', // Classroom 1
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200', // Classroom 2
      ];

  // Past inspections for this NGO
  const ngoInspections = inspections.filter((i) => i.ngoId === institute.id);
  const latestInspection = ngoInspections.length > 0
    ? ngoInspections[0]
    : {
        id: 'INSP-2026-0812',
        ngoId: institute.id,
        ngoName: institute.name,
        officerId: 'usr_officer_rajesh',
        officerName: 'Rajesh Sharma',
        officerBadge: 'INSP-DEL-402',
        scheduledDate: institute.lastInspectionDate || '2026-08-12',
        scheduledTime: '10:30 AM',
        status: 'COMPLETED' as const,
        priority: 'ROUTINE' as const,
        complianceRating: 'A_EXCELLENT' as const,
        score: institute.complianceScore || 98,
        findingsSummary: 'All physical records, signboard, and active beneficiary registries verified on-site without discrepancies. Fully compliant with statutory norms.',
      };

  const formattedDate = (dateStr?: string) => {
    if (!dateStr) return '12 Aug 2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Category Icon helper
  const getCategoryIcon = () => {
    switch (institute.sector) {
      case 'Education':
        return <Building className="w-6 h-6 text-red-600" />;
      case 'Divyang Care':
        return <Heart className="w-6 h-6 text-blue-600" />;
      case 'Skill Development':
        return <Award className="w-6 h-6 text-emerald-600" />;
      case 'Women Empowerment':
        return <Sparkles className="w-6 h-6 text-rose-600" />;
      default:
        return <Building className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in bg-slate-50 min-h-screen pb-12">
      {/* 1. Header Bar matching mockup */}
      <div className="bg-white px-4 py-3 sm:py-3.5 border-b border-slate-200 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Institute / NGO Details</h2>
            <p className="text-[11px] text-slate-500 font-mono">Dossier ID: {institute.regNumber}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onShowToast?.(`Dossier options for ${institute.name}`, 'info')}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Top Summary Card matching mockup */}
      <div className="mx-3 sm:mx-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 shadow-2xs">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{institute.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {institute.scheme || 'Education Support Scheme'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{institute.address.split(',')[0]}, {institute.district}, {institute.state}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            <span className="text-xs text-slate-600 font-mono block">
              Reg. No. <strong className="text-slate-900">{institute.regNumber}</strong>
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Est. {institute.foundingYear || 2018}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs matching mockup */}
      <div className="mx-3 sm:mx-6 border-b border-slate-200 flex items-center space-x-6 text-xs font-bold overflow-x-auto no-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'INSPECTIONS', label: `Inspections (${ngoInspections.length})` },
          { id: 'CCTV', label: 'CCTV' },
          { id: 'DOCUMENTS', label: 'Documents' },
          { id: 'CONTACT', label: 'Contact' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 whitespace-nowrap cursor-pointer transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="mx-3 sm:mx-6 space-y-4">
          {/* Facility Photo Banner with 1/4 badge & description */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="relative aspect-video sm:aspect-21/9 max-h-[320px] w-full overflow-hidden bg-slate-900 group">
              <img
                src={photos[selectedPhotoIndex] || photos[0]}
                alt={institute.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              />

              {/* Next / Prev Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* 1/4 Badge Overlay */}
              <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-lg border border-white/10 font-mono">
                {selectedPhotoIndex + 1}/{photos.length}
              </div>
            </div>

            {/* Description Text */}
            <div className="p-4 sm:p-5 text-xs text-slate-700 leading-relaxed border-t border-slate-100">
              {institute.description || 'Hope Foundation works for the education and overall development of underprivileged children in urban and rural areas.'}
            </div>
          </div>

          {/* Key Information Grid matching mockup */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-blue-700" />
                <h4 className="text-sm font-bold text-slate-900">Key Information</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center space-x-1 text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
              {/* Location */}
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Location</span>
                  <span className="font-semibold text-slate-900">
                    {institute.address.split(',')[0]}, {institute.district}, {institute.state}
                  </span>
                </div>
              </div>

              {/* Registration Number */}
              <div className="flex items-start space-x-2.5">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Registration Number</span>
                  <span className="font-mono font-bold text-slate-900">{institute.regNumber}</span>
                </div>
              </div>

              {/* Type */}
              <div className="flex items-start space-x-2.5">
                <Building className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Type</span>
                  <span className="font-semibold text-slate-900">
                    {institute.ngoType || 'NGO / Recognized Society'}
                  </span>
                </div>
              </div>

              {/* Scheme */}
              <div className="flex items-start space-x-2.5">
                <Award className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Scheme</span>
                  <span className="font-semibold text-slate-900">{institute.scheme || 'Education Support Scheme'}</span>
                </div>
              </div>

              {/* Establishment Year */}
              <div className="flex items-start space-x-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Establishment Year</span>
                  <span className="font-semibold text-slate-900">{institute.foundingYear || 2018}</span>
                </div>
              </div>

              {/* Managed By */}
              <div className="flex items-start space-x-2.5">
                <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Managed By</span>
                  <span className="font-semibold text-slate-900">{institute.presidentName || 'Governing Trust Board'}</span>
                </div>
              </div>

              {/* Beneficiaries */}
              <div className="flex items-start space-x-2.5">
                <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Beneficiaries</span>
                  <span className="font-bold text-slate-900">
                    {institute.activeBeneficiaryCount || institute.beneficiaryCapacity || 320} (Enrolled Students)
                  </span>
                </div>
              </div>

              {/* Compliance Status */}
              <div className="flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Compliance Status</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
                    Compliant (Score: {institute.complianceScore || 98}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Inspection Card matching mockup */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-blue-700" />
                <h4 className="text-sm font-bold text-slate-900">Latest Inspection</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('INSPECTIONS')}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div
              onClick={() => onOpenAuditDossier(latestInspection as any)}
              className="p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Date</span>
                  <span className="font-bold text-slate-900">{formattedDate(latestInspection.scheduledDate)}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block">Inspector</span>
                  <span className="font-semibold text-slate-900">{latestInspection.officerName || 'Rajesh Sharma'}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block">Status</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Completed
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </div>
          </div>

          {/* Quick Actions (4 Large Action Cards matching mockup) */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 px-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Quick Actions</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
              {/* 1. Schedule Inspection */}
              <button
                type="button"
                onClick={() => onScheduleInspection(institute)}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-sm transition-all text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  Schedule / Conduct Inspection
                </span>
              </button>

              {/* 2. View CCTV */}
              <button
                type="button"
                onClick={() => setActiveTab('CCTV')}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-sm transition-all text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  View CCTV
                </span>
              </button>

              {/* 3. View Reports */}
              <button
                type="button"
                onClick={() => setActiveTab('INSPECTIONS')}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-sm transition-all text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  View Reports
                </span>
              </button>

              {/* 4. View on Map */}
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-sm transition-all text-center flex flex-col items-center justify-center space-y-2 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  View on Map
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Cards: Address & Contact Information matching mockup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Address Card */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">Address</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {institute.address || '123, Civil Lines, Sitabuldi, Nagpur - 440001, Maharashtra'}
              </p>
              <div className="pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(institute.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 hover:text-blue-800"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">Contact Information</h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${institute.contactPhone}`} className="text-slate-700 hover:text-blue-700 font-medium">
                    {institute.contactPhone || '+91 712 256 7890'}
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${institute.contactEmail}`} className="text-slate-700 hover:text-blue-700 font-medium">
                    {institute.contactEmail || 'info@hopefoundation.org'}
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={institute.website || 'https://www.hopefoundation.org'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline font-medium"
                  >
                    {institute.website ? institute.website.replace('https://', '') : 'www.hopefoundation.org'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: INSPECTIONS */}
      {activeTab === 'INSPECTIONS' && (
        <div className="mx-3 sm:mx-6 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Inspection History &amp; Field Audits</h3>
              <p className="text-xs text-slate-500">Statutory audits conducted under 150m geofence verification norms</p>
            </div>
            <button
              type="button"
              onClick={() => onScheduleInspection(institute)}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              + Conduct New Inspection
            </button>
          </div>

          <div className="space-y-3">
            {ngoInspections.length === 0 ? (
              <div
                onClick={() => onOpenAuditDossier(latestInspection as any)}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-700">{latestInspection.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Completed &bull; Grade A
                    </span>
                  </div>
                  <p className="text-slate-800 font-semibold">{latestInspection.findingsSummary || (latestInspection as any).findingsNotes}</p>
                  <p className="text-[11px] text-slate-500">
                    Inspected on {formattedDate(latestInspection.scheduledDate)} by {latestInspection.officerName} ({latestInspection.officerBadge})
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
            ) : (
              ngoInspections.map((insp) => (
                <div
                  key={insp.id}
                  onClick={() => onOpenAuditDossier(insp)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-700">{insp.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        insp.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {insp.status}
                      </span>
                    </div>
                    <p className="text-slate-800 font-semibold">{insp.findingsSummary || (insp as any).findingsNotes || 'Statutory on-site inspection completed.'}</p>
                    <p className="text-[11px] text-slate-500">
                      Inspected on {formattedDate(insp.scheduledDate)} by {insp.officerName}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. TAB 3: CCTV (Embeds InstituteLiveCctvView directly!) */}
      {activeTab === 'CCTV' && (
        <InstituteLiveCctvView
          institute={institute}
          currentOfficer={currentOfficer}
          onBack={() => setActiveTab('OVERVIEW')}
          onShowToast={onShowToast}
        />
      )}

      {/* 7. TAB 4: DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="mx-3 sm:mx-6 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">Statutory Documents &amp; Regulatory Filings</h3>
            <p className="text-xs text-slate-500">Verified through National NGO DARPAN &amp; Ministry Archives</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {[
              { title: 'NGO Registration Deed / MoA', num: institute.regNumber, tag: 'Verified' },
              { title: 'PAN Card Certificate', num: institute.documents?.panCardNumber || 'AAATH1245M', tag: 'Income Tax Dept' },
              { title: 'NGO DARPAN UID', num: institute.documents?.darpanId || 'MH/2018/001245', tag: 'NITI Aayog' },
              { title: 'FCRA Registration Status', num: institute.fcraStatus || 'APPROVED', tag: 'MHA Cleared' },
              { title: '12A & 80G Tax Exemption', num: 'EXEMPT-2026/80G', tag: 'Valid' },
              { title: 'Annual CAG Audited Balance Sheet', num: 'FY 2025-26 Filed', tag: 'Audited' },
            ].map((doc, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{doc.title}</span>
                  <span className="font-mono text-slate-600 text-[11px]">{doc.num}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200">
                    {doc.tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => onShowToast?.(`Opening official document: ${doc.title}`, 'info')}
                    className="p-1 text-slate-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB 5: CONTACT */}
      {activeTab === 'CONTACT' && (
        <div className="mx-3 sm:mx-6 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">Official Contact &amp; Grievance Registry</h3>
            <p className="text-xs text-slate-500">Authorized personnel for legal notices and inspection coordination</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px] block font-bold uppercase">Authorized Representative / Trustee</span>
              <span className="text-slate-900 font-bold text-sm block">{institute.presidentName || 'Hope Foundation Trust'}</span>
              <span className="text-slate-600 block">Phone: {institute.contactPhone || '+91 712 256 7890'}</span>
              <span className="text-slate-600 block">Email: {institute.contactEmail || 'info@hopefoundation.org'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px] block font-bold uppercase">District Vigilance Nodal Officer</span>
              <span className="text-slate-900 font-bold text-sm block">{currentOfficer.name}</span>
              <span className="text-slate-600 block">Badge: {currentOfficer.badgeNumber || 'INSP-DEL-402'}</span>
              <span className="text-slate-600 block">Email: {currentOfficer.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditInstituteModal
          isOpen={isEditModalOpen}
          institute={institute}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            onUpdateInstitute(updated);
            onShowToast?.(`✓ Successfully updated details for ${updated.name}`, 'success');
          }}
        />
      )}

      {/* Interactive Map Modal with 150m Geofence Perimeter */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base text-white">{institute.name}</h3>
                  <p className="text-xs text-blue-200">
                    Geofenced Location: {institute.coordinates?.lat?.toFixed(4)}, {institute.coordinates?.lng?.toFixed(4)} &bull; 150m Perimeter
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 sm:p-4 bg-slate-100 flex-1 min-h-[350px]">
              <InteractiveMap
                ngos={[institute]}
                selectedNgo={institute}
                heightClass="h-[380px] sm:h-[450px]"
                showAllOfficers={false}
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                150-meter anti-fraud perimeter actively enforced.
              </span>
              <div className="flex items-center space-x-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${institute.coordinates?.lat},${institute.coordinates?.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
