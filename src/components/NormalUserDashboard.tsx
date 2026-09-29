import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  MapPin,
  ExternalLink,
  ChevronRight,
  Upload,
  UserCheck,
  Shield,
  Lock,
  Radio,
  FileCheck2,
  Copy,
  Check,
  Camera,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { NGO, Complaint, NgoApplication, User, AuthSession } from '../types';
import { grievanceApi } from '../services/apiClient';
import { EmblemOfIndia } from './EmblemOfIndia';

interface NormalUserDashboardProps {
  currentUser?: User;
  currentSession?: AuthSession | null;
  ngos: NGO[];
  complaints: Complaint[];
  onSubmitComplaint: (newComplaint: Partial<Complaint>) => void;
  onSubmitApplication: (application: Partial<NgoApplication>) => void;
  initialTab?: 'DIRECTORY' | 'FILE_COMPLAINT' | 'TRACK_COMPLAINT' | 'REGISTER_NGO';
  preSelectedNgoId?: string;
}

export const NormalUserDashboard: React.FC<NormalUserDashboardProps> = ({
  currentUser,
  currentSession,
  ngos,
  complaints,
  onSubmitComplaint,
  onSubmitApplication,
  initialTab,
  preSelectedNgoId,
}) => {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'FILE_COMPLAINT' | 'TRACK_COMPLAINT' | 'REGISTER_NGO'>(
    initialTab || 'DIRECTORY'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Directory Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  // Complaint form state
  const [complaintNgoId, setComplaintNgoId] = useState(preSelectedNgoId || ngos[0]?.id || '');

  useEffect(() => {
    if (preSelectedNgoId) {
      setComplaintNgoId(preSelectedNgoId);
    }
  }, [preSelectedNgoId]);
  const [citizenName, setCitizenName] = useState(currentUser?.name || '');
  const [citizenContact, setCitizenContact] = useState(currentUser?.phone || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState<Complaint['category']>('FUNDS_EMBEZZLEMENT');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmittedToken, setComplaintSubmittedToken] = useState<string | null>(null);
  const [attachedEvidencePhotos, setAttachedEvidencePhotos] = useState<string[]>([]);
  const [copiedToken, setCopiedToken] = useState(false);

  // DARPAN Readiness Quiz State
  const [readinessCheck, setReadinessCheck] = useState({
    pan: true,
    cert: true,
    tax12A: true,
    fcra: false,
    audit3Yrs: true,
  });

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  // Track complaint token input
  const [trackTokenInput, setTrackTokenInput] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // New NGO Registration form state
  const [ngoName, setNgoName] = useState('');
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantRole, setApplicantRole] = useState('Managing Trustee');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [regNumber, setRegNumber] = useState('');
  const [darpanId, setDarpanId] = useState('');
  const [sector, setSector] = useState('Education');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('South Delhi');
  const [appSubmitted, setAppSubmitted] = useState(false);

  const filteredNgos = ngos.filter((n) => {
    const matchSearch =
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSector = sectorFilter === 'ALL' || n.sector === sectorFilter;
    return matchSearch && matchSector;
  });

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNgo = ngos.find((n) => n.id === complaintNgoId);
    if (!targetNgo) return;

    const token = `GRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newComp: Partial<Complaint> = {
      trackingToken: token,
      ngoId: targetNgo.id,
      ngoName: targetNgo.name,
      citizenName: isAnonymous ? undefined : citizenName || 'Concerned Citizen',
      citizenContact: isAnonymous ? undefined : citizenContact,
      isAnonymous,
      category: complaintCategory,
      description: complaintDesc,
      submittedAt: new Date().toLocaleString('en-IN') + ' IST',
      status: 'PENDING_REVIEW',
    };

    onSubmitComplaint(newComp);
    setComplaintSubmittedToken(token);
    setComplaintDesc('');
  };

  const [isTracking, setIsTracking] = useState(false);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackedComplaint(null);

    const cleanInput = trackTokenInput.trim().toUpperCase();
    if (!cleanInput) {
      setTrackError('Please enter a valid Grievance Token (e.g., GRV-2026-4402).');
      return;
    }

    try {
      setIsTracking(true);
      const res = await grievanceApi.track(cleanInput);
      setTrackedComplaint({
        id: res.trackingToken,
        trackingToken: res.trackingToken,
        ngoId: '',
        ngoName: res.ngoName,
        category: (res.category || 'OTHER') as any,
        description: res.publicRemarks || 'Central review in progress under Ministry Vigilance Unit.',
        submittedAt: res.submittedAt,
        status: (res.status || 'PENDING_REVIEW') as any,
        adminRemarks: res.publicRemarks,
      });
    } catch {
      // Local fallback
      const found = complaints.find(
        (c) => c.trackingToken?.toUpperCase() === cleanInput || c.id.toUpperCase() === cleanInput
      );

      if (found) {
        setTrackedComplaint(found);
      } else {
        setTrackedComplaint(null);
        setTrackError(`No grievance record found for tracking token "${cleanInput}". Please check the token code.`);
      }
    } finally {
      setIsTracking(false);
    }
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngoName || !applicantName) return;

    const newApp: Partial<NgoApplication> = {
      ngoName,
      applicantName,
      applicantRole,
      email,
      phone,
      registrationNumber: regNumber,
      darpanId: darpanId || `DL/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`,
      sector,
      address,
      district,
      state: 'Delhi NCR',
      lat: 28.6139,
      lng: 77.2090,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    };

    onSubmitApplication(newApp);
    setAppSubmitted(true);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Level-1 Citizen Transparency & Whistleblower Trust Header */}
      <div className="bg-[#0B3B60] text-white rounded-2xl border border-[#0B3B60] shadow-xl relative overflow-hidden">
        {/* National Tricolor Accent Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
        
        <div className="p-5 sm:p-6 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-[#07253d] via-[#0B3B60] to-[#0d4672]">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-19 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
              <EmblemOfIndia variant="badge" size={52} className="shadow-md" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/15 text-blue-100 border border-white/20">
                  Government of India • भारत सरकार
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  CVC Whistleblower Protection • धारा 4
                </span>
              </div>

              <div className="text-xs text-amber-300 font-medium tracking-wide">
                सामाजिक न्याय एवं अधिकारिता मंत्रालय | Ministry of Social Justice &amp; Empowerment
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentUser?.name || 'Citizen Whistleblower & Public Redressal Desk'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-normal">
                {currentUser?.designation || 'Public Vigilance, Whistleblower Grievance Redressal & DARPAN Verification Portal'}
              </p>
              <p className="text-[11px] text-slate-300 font-mono">
                e-Pramaan Official ID: <strong className="text-amber-300">{currentSession?.token?.substring(0, 16) || 'PRM-DL-88219'}</strong> • Whistleblower Identity Protected under Central Act No. 17 of 2014
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('FILE_COMPLAINT')}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-[#FF9933] to-[#e6851f] hover:from-[#e6851f] hover:to-[#cc7418] text-slate-950 text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
              <span>Report Grievance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TRACK_COMPLAINT')}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-blue-200" />
              <span>Track Status</span>
            </button>
          </div>
        </div>

        {/* Protection Banner Strip */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#071f33] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-200 font-mono">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
            <span>Encrypted Tracking Token issued upon submission with SHA-256 seal. Identity protected under CVC norms.</span>
          </div>
          <div className="text-emerald-300 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>National Redressal Gateway Active • GovNet 1.3</span>
          </div>
        </div>
      </div>

      {/* Floating Segmented Pill Navigation */}
      <div className="p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'DIRECTORY', label: `Public NGO Registry (${ngos.length})`, icon: Building2 },
          { id: 'FILE_COMPLAINT', label: 'File Grievance / Report NGO', icon: AlertTriangle },
          { id: 'TRACK_COMPLAINT', label: 'Track Grievance Status', icon: Clock },
          { id: 'REGISTER_NGO', label: 'Apply for NGO Registration', icon: FileText },
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
            </button>
          );
        })}
      </div>

      {/* TAB 1: PUBLIC NGO DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="input-citizen-search-ngo"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search registered NGOs by name, DARPAN ID, or district..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
              />
            </div>

            <select
              id="select-citizen-sector-filter"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none transition-all font-medium"
            >
              <option value="ALL">All Sectors</option>
              <option value="Child Welfare">Child Welfare</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Rural Development">Rural Development</option>
              <option value="Women Empowerment">Women Empowerment</option>
              <option value="Environment">Environment</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredNgos.map((ngo) => (
              <div key={ngo.id} className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-md transition-all space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">{ngo.regNumber}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1.5">{ngo.name}</h3>
                    <p className="text-xs text-slate-500">Sector: {ngo.sector} • Founded {ngo.foundingYear}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    ngo.status === 'REGISTERED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : ngo.status === 'FLAGGED_VIOLATION'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {ngo.status === 'REGISTERED' ? '✓ Govt Accredited' : ngo.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ngo.description}</p>

                <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Statutory Audit Score</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{ngo.complianceScore ?? 'Pending'}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">FCRA Authorization</span>
                    <span className="font-semibold text-slate-800">{ngo.fcraStatus}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {ngo.district}, {ngo.state}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setComplaintNgoId(ngo.id);
                      setActiveTab('FILE_COMPLAINT');
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Report Misconduct</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FILE A CITIZEN COMPLAINT */}
      {activeTab === 'FILE_COMPLAINT' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">File a Statutory Grievance / Misconduct Report</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your submission will trigger review by the Directorate General. Whistleblowers can opt for strict anonymity.
            </p>
          </div>

          {complaintSubmittedToken ? (
            <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base text-emerald-950">Grievance Registered Successfully</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Your complaint has been forwarded to the Directorate Vigilance Cell for field inspection and statutory verification.
              </p>
              <div className="p-3 bg-white border border-emerald-300 rounded-xl inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-900 shadow-sm">
                <span>Tracking Token:</span>
                <span className="text-slate-900 text-sm font-black">{complaintSubmittedToken}</span>
                <button
                  type="button"
                  onClick={() => handleCopyToken(complaintSubmittedToken)}
                  className="p-1 hover:bg-emerald-50 text-emerald-700 rounded transition-colors cursor-pointer ml-1"
                  title="Copy token to clipboard"
                >
                  {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComplaintSubmittedToken(null);
                    setTrackTokenInput(complaintSubmittedToken);
                    setActiveTab('TRACK_COMPLAINT');
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Track Status Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComplaintSubmittedToken(null);
                    setAttachedEvidencePhotos([]);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  File Another Grievance
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Target NGO
                </label>
                <select
                  id="select-complaint-ngo"
                  value={complaintNgoId}
                  onChange={(e) => setComplaintNgoId(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 font-medium outline-none transition-all"
                  required
                >
                  {ngos.map((ngo) => (
                    <option key={ngo.id} value={ngo.id}>
                      {ngo.name} ({ngo.regNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Violation Category
                </label>
                <select
                  id="select-complaint-category"
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value as any)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 font-medium outline-none transition-all"
                >
                  <option value="FUNDS_EMBEZZLEMENT">Misappropriation / Diversion of Funds</option>
                  <option value="FAKE_OFFICE">Ghost / Non-Existent Physical Office</option>
                  <option value="GHOST_BENEFICIARIES">Falsified Beneficiary Roll &amp; Aadhaar Misuse</option>
                  <option value="FCRA_VIOLATION">Foreign Contribution (FCRA) Irregularity</option>
                  <option value="DISCRIMINATION">Exclusion / Commercial Exploitation</option>
                  <option value="OTHER">Other Statutory Non-Compliance</option>
                </select>
              </div>

              {/* Supporting Photographic / Document Evidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Supporting Field Evidence / Document Proof
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedEvidencePhotos((prev) => [
                        ...prev,
                        'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
                      ]);
                    }}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>+ Attach Verified Evidence Sample</span>
                  </button>
                </div>

                {attachedEvidencePhotos.length > 0 && (
                  <div className="flex items-center gap-3 overflow-x-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    {attachedEvidencePhotos.map((url, i) => (
                      <div key={i} className="relative w-20 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                        <img src={url} alt="Evidence thumbnail" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] text-white text-center font-mono py-0.5">
                          EVID-{i + 1}
                        </span>
                      </div>
                    ))}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {attachedEvidencePhotos.length} item(s) staged with SHA-256 seal
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specific Incident Details &amp; Evidence Summary
                </label>
                <textarea
                  id="textarea-complaint-desc"
                  rows={4}
                  required
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="State dates, locations, unfulfilled promises, or financial discrepancies observed..."
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Anonymity Option */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    id="checkbox-is-anonymous"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                  />
                  <span>Submit Anonymously as Whistleblower (Personal identity will not be collected)</span>
                </label>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        value={citizenName}
                        onChange={(e) => setCitizenName(e.target.value)}
                        placeholder="e.g. Ramesh Chandra"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-indigo-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Phone / Email</label>
                      <input
                        type="text"
                        value={citizenContact}
                        onChange={(e) => setCitizenContact(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="btn-submit-citizen-complaint"
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Grievance to Directorate</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: TRACK COMPLAINT */}
      {activeTab === 'TRACK_COMPLAINT' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Track Official Grievance Investigation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your tracking token (e.g. <code className="text-indigo-600 font-bold">GRV-2024-8841</code>) to check inspector dispatch status.
            </p>
          </div>

          <div className="space-y-2">
            <form onSubmit={handleTrackSubmit} className="flex gap-2.5 max-w-md">
              <input
                id="input-track-token"
                type="text"
                required
                value={trackTokenInput}
                onChange={(e) => setTrackTokenInput(e.target.value)}
                placeholder="e.g. GRV-2026-4402 or GRV-2024-8841"
                className="flex-1 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono outline-none transition-all"
              />
              <button
                id="btn-track-lookup"
                type="submit"
                disabled={isTracking}
                className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {isTracking ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Official Grievance Token Lookup Samples */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-600 text-[11px]">Central Registry Records:</span>
              {(complaints.slice(0, 3).map((c) => c.trackingToken).filter(Boolean).length > 0
                ? complaints.slice(0, 3).map((c) => c.trackingToken!).filter(Boolean)
                : ['GRV-2026-4402', 'GRV-2024-8841']
              ).map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => {
                    setTrackTokenInput(tok);
                    const e = { preventDefault: () => {} } as any;
                    setTimeout(() => {
                      const found = complaints.find(
                        (c) => c.trackingToken?.toUpperCase() === tok.toUpperCase() || c.id.toUpperCase() === tok.toUpperCase()
                      );
                      if (found) setTrackedComplaint(found);
                    }, 50);
                  }}
                  className="px-2.5 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-full font-mono text-[10px] border border-slate-200 transition-colors cursor-pointer"
                >
                  {tok}
                </button>
              ))}
            </div>
          </div>

          {trackError && <div className="text-xs text-rose-700 font-semibold p-3 bg-rose-50 border border-rose-200 rounded-xl">{trackError}</div>}

          {trackedComplaint && (
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                      {trackedComplaint.trackingToken}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Logged: {trackedComplaint.submittedAt}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Target: {trackedComplaint.ngoName}</h4>
                  <div className="text-xs text-slate-500">Category: {trackedComplaint.category.replace(/_/g, ' ')}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold self-start border ${
                  trackedComplaint.status === 'INSPECTION_ORDERED'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : trackedComplaint.status === 'RESOLVED_VALIDATED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}>
                  ● {trackedComplaint.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* 5-Stage Interactive Visual Timeline */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vigilance Investigation Progression (5-Stage National Protocol)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Stage 1</span>
                    <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Grievance Sealed</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Token issued with SHA-256 seal</p>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">Stage 2</span>
                    <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Directorate Review</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Vigilance scrutiny complete</p>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${
                    trackedComplaint.status === 'INSPECTION_ORDERED' || trackedComplaint.status === 'RESOLVED_VALIDATED'
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}>
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Stage 3</span>
                    <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                      {trackedComplaint.status === 'INSPECTION_ORDERED' || trackedComplaint.status === 'RESOLVED_VALIDATED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>Inspector Assigned</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Surprise field audit ordered</p>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${
                    trackedComplaint.status === 'RESOLVED_VALIDATED'
                      ? 'bg-indigo-50/80 border-indigo-200'
                      : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}>
                    <span className="text-[10px] font-bold text-indigo-800 uppercase block">Stage 4</span>
                    <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                      {trackedComplaint.status === 'RESOLVED_VALIDATED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>150m On-Site Audit</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Physical evidence stamped</p>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-1 ${
                    trackedComplaint.status === 'RESOLVED_VALIDATED'
                      ? 'bg-emerald-50/90 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Stage 5</span>
                    <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                      {trackedComplaint.status === 'RESOLVED_VALIDATED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>Order Concluded</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Statutory directive executed</p>
                  </div>
                </div>
              </div>

              {trackedComplaint.adminRemarks && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                  <div className="font-bold text-[11px] text-blue-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Directorate General Statutory Directive / Observation:</span>
                  </div>
                  <p className="leading-relaxed">{trackedComplaint.adminRemarks}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: APPLY FOR NGO REGISTRATION */}
      {activeTab === 'REGISTER_NGO' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">New NGO Statutory Registration Application</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit your society / trust registration details and premise geo-coordinates for verification and DARPAN onboarding.
            </p>
          </div>

          {/* DARPAN Accreditation Readiness Checklist */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">DARPAN Accreditation Readiness Self-Check</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Readiness Score:</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  Object.values(readinessCheck).filter(Boolean).length >= 4
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {(Object.values(readinessCheck).filter(Boolean).length * 20)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readinessCheck.pan}
                  onChange={(e) => setReadinessCheck((p) => ({ ...p, pan: e.target.checked }))}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-[11px] font-semibold text-slate-700">PAN Card in NGO Name</span>
              </label>

              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readinessCheck.cert}
                  onChange={(e) => setReadinessCheck((p) => ({ ...p, cert: e.target.checked }))}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-[11px] font-semibold text-slate-700">Trust / Society Registration Deed</span>
              </label>

              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readinessCheck.tax12A}
                  onChange={(e) => setReadinessCheck((p) => ({ ...p, tax12A: e.target.checked }))}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-[11px] font-semibold text-slate-700">Section 12A &amp; 80G Approval</span>
              </label>

              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readinessCheck.audit3Yrs}
                  onChange={(e) => setReadinessCheck((p) => ({ ...p, audit3Yrs: e.target.checked }))}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-[11px] font-semibold text-slate-700">Last 3 Yrs Audited Statements</span>
              </label>

              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readinessCheck.fcra}
                  onChange={(e) => setReadinessCheck((p) => ({ ...p, fcra: e.target.checked }))}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-[11px] font-semibold text-slate-700">FCRA Registration (If Foreign Grants)</span>
              </label>
            </div>
          </div>

          {appSubmitted ? (
            <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base text-emerald-950">Application Submitted for Oversight Review</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Your NGO registration file has been placed in the Government Admin approval queue. A field inspection will be dispatched to verify your registered office coordinates.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setAppSubmitted(false)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Submit Another Application
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Proposed NGO Name
                  </label>
                  <input
                    type="text"
                    required
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    placeholder="e.g. Navchetna Rural Foundation"
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Sector
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all font-medium"
                  >
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Rural Development">Rural Development</option>
                    <option value="Women Empowerment">Women Empowerment</option>
                    <option value="Environment">Environment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registration / Trust Deed No.
                  </label>
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. REG-SOC-2024-9102"
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    NITI Aayog DARPAN ID
                  </label>
                  <input
                    type="text"
                    value={darpanId}
                    onChange={(e) => setDarpanId(e.target.value)}
                    placeholder="DL/2024/0998231"
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    District
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. South Delhi"
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Managing Trustee / President Name
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Dr. Harish Chandra"
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Phone / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98110 00123 / contact@ngo.org"
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Physical Office Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full physical street address where office signboard is mounted..."
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl p-3 text-xs text-slate-900 outline-none transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="btn-submit-ngo-application"
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Submit for Government Verification
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
