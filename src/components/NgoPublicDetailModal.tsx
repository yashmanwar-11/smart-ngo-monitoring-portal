import React from 'react';
import {
  Building2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Award,
  Clock,
  Phone,
  Mail,
  User,
  X,
  FileText,
  Calendar,
  AlertOctagon
} from 'lucide-react';
import { NGO } from '../types';
import { InspiraLogo } from './InspiraLogo';

interface NgoPublicDetailModalProps {
  ngo: NGO;
  onClose: () => void;
  onLodgeGrievance?: (ngo: NGO) => void;
}

export const NgoPublicDetailModal: React.FC<NgoPublicDetailModalProps> = ({
  ngo,
  onClose,
  onLodgeGrievance,
}) => {
  const isCompliant = ngo.status === 'REGISTERED';
  const hasViolation = ngo.status === 'FLAGGED_VIOLATION';
  const isUnderInspection = ngo.status === 'UNDER_INSPECTION';

  const score = ngo.complianceScore || 88;
  const grade = score >= 85 ? 'Grade A • Compliant' : score >= 60 ? 'Grade B • Satisfactory' : 'Grade D • High Risk';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200/80 shadow-2xl overflow-hidden my-6 flex flex-col">
        {/* Neutral Accent Stripe */}
        <div className="h-1.5 w-full bg-[#0B3B60]"></div>

        {/* Modal Header */}
        <div className="bg-[#0B3B60] text-white p-5 sm:p-6 relative border-b border-[#0B3B60] bg-gradient-to-r from-[#07253d] via-[#0B3B60] to-[#0d4672]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer border border-white/20"
            title="Close Institutional Dossier"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-3.5 pr-8">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
              <InspiraLogo className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 text-blue-100 px-2 py-0.5 rounded border border-white/20">
                  NGO Registry Record
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  DARPAN: {ngo.documents?.darpanId || ngo.regNumber}
                </span>
                {ngo.verificationStatus && (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      ngo.verificationStatus.includes('Confirmed')
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                        : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                    }`}
                  >
                    {ngo.verificationStatus.includes('Confirmed') ? '✓ ' : '⚠️ '}
                    {ngo.verificationStatus}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isCompliant
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                    : hasViolation
                    ? 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                    : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                }`}>
                  ● {ngo.status.replace(/_/g, ' ')}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {ngo.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <span>Sector: <strong className="text-white">{ngo.sector}</strong></span>
                {ngo.scheme && (
                  <span className="bg-white/10 text-amber-200 border border-amber-400/30 px-2 py-0.2 rounded text-[11px] font-semibold">
                    🏛️ Scheme: {ngo.scheme}
                  </span>
                )}
                {ngo.ngoType && (
                  <span className="bg-white/10 text-slate-200 px-2 py-0.2 rounded text-[11px]">
                    {ngo.ngoType}
                  </span>
                )}
                <span>• Registered in {ngo.foundingYear || 2015}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[70vh] bg-slate-50/50">
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compliance Rating</div>
              <div className={`text-xl font-bold font-mono mt-1 ${
                score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {score}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{grade}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FCRA Clearance</div>
              <div className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{ngo.fcraStatus || 'APPROVED'}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">FCRA Compliance Record</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Citizen Grievances</div>
              <div className={`text-xl font-bold font-mono mt-1 ${
                (ngo.reportedComplaintsCount || 0) > 0 ? 'text-rose-600' : 'text-slate-800'
              }`}>
                {ngo.reportedComplaintsCount || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Public Reports on Record</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Annual Budget</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-1.5">
                ₹{(ngo.annualBudgetInr || 4500000).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Audited FY 2025-26</div>
            </div>
          </div>

          {/* Institutional Description */}
          {ngo.description && (
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mission &amp; Operational Scope</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {ngo.description}
              </p>
            </div>
          )}

          {/* Premise Geolocation & Address */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Physical Premise &amp; Anti-Fraud Geofence</span>
              </div>
              {(ngo.googleMapsUrl || (ngo.coordinates && typeof ngo.coordinates.lat === 'number')) && (
                <a
                  href={ngo.googleMapsUrl || `https://www.google.com/maps?q=${ngo.coordinates?.lat},${ngo.coordinates?.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Maps Telemetry (CID Link)</span>
                </a>
              )}
            </div>

            <div className="text-xs text-slate-700 space-y-1">
              <div><strong>Registered Address:</strong> {ngo.address}</div>
              <div><strong>Jurisdiction:</strong> {ngo.district}, {ngo.state}</div>
              <div className="font-mono text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                📍 Coordinates: {ngo.coordinates && typeof ngo.coordinates.lat === 'number' && typeof ngo.coordinates.lng === 'number'
                  ? `${ngo.coordinates.lat.toFixed(5)}°N, ${ngo.coordinates.lng.toFixed(5)}°E`
                  : '28.61390°N, 77.20900°E'} • Radius: 150m Strict Geofence Circle
              </div>
            </div>
          </div>

          {/* Executive Leadership & Contact Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Authorized Office Bearers &amp; Nodal Contact</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div>
                <span className="text-[11px] text-slate-500 block">Authorized President / Trustee:</span>
                <strong className="text-slate-900 text-xs">{ngo.presidentName || 'Registered Managing Trustee'}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Registration Code:</span>
                <span className="font-mono font-bold text-slate-900">{ngo.regNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Official Nodal Email:</span>
                <span className="font-mono text-slate-800">{ngo.contactEmail || 'nodal.officer@darpan.org'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Official Verified Phone:</span>
                <span className="font-mono text-slate-800">{ngo.contactPhone || '+91-11-2338-9001'}</span>
              </div>
              {ngo.website && ngo.website !== 'N/A' && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-slate-500 block">Official Portal / Website:</span>
                  <a
                    href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{ngo.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Direct Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium">
            Authenticated record from National DARPAN NGO Oversight Registry.
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {onLodgeGrievance && (
              <button
                type="button"
                onClick={() => {
                  onLodgeGrievance(ngo);
                  onClose();
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-full text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>File Grievance Against This NGO</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
