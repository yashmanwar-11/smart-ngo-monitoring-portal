import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Camera,
  CheckCircle2,
  FileCheck2,
  Users,
  AlertTriangle,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Compass,
  ArrowRight,
  Smartphone,
  Eye,
  Building2,
  Award,
  Globe,
  Radio,
  FileText,
  Activity,
  UserPlus,
  LogIn,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  HelpCircle,
  Clock,
  ArrowUpRight,
  PhoneCall,
  UserCheck,
  LayoutGrid,
  List,
  IndianRupee,
  Printer,
  Download,
  X,
  QrCode,
  CheckCircle,
  FileCheck,
  GraduationCap,
  Mail,
  Phone,
  CreditCard
} from 'lucide-react';
import { NGO, User } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { EmblemOfIndia } from './EmblemOfIndia';
import { DigitalIndiaLogo, EPramaanLogo, NgoDarpanLogo, NicLogo } from './GovLogos';
import { SIH_TEAM_DATA } from './SihTeamModal';

interface HeroLandingPageProps {
  ngos: NGO[];
  officers?: User[];
  onOpenLogin: () => void;
  onOpenSignUp: () => void;
  onEnterDashboard: (role?: 'ADMIN' | 'OFFICER' | 'USER' | 'NGO') => void;
  onOpenInspectorTerminal: () => void;
  onOpenWorkerAttendance?: () => void;
  onOpenAndroidView?: () => void;
  onSelectNgoDetails?: (ngo: NGO) => void;
  onNavigateCitizenTab?: (tab: 'FILE_COMPLAINT' | 'TRACK_COMPLAINT' | 'REGISTER_NGO' | 'DIRECTORY') => void;
  onOpenTeamDetails?: () => void;
}

export const HeroLandingPage: React.FC<HeroLandingPageProps> = ({
  ngos,
  officers = [],
  onOpenLogin,
  onOpenSignUp,
  onEnterDashboard,
  onOpenInspectorTerminal,
  onOpenWorkerAttendance,
  onOpenAndroidView,
  onSelectNgoDetails,
  onNavigateCitizenTab,
  onOpenTeamDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedNgoForMap, setSelectedNgoForMap] = useState<NGO | null>(null);
  const [directoryViewMode, setDirectoryViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [showAllNgos, setShowAllNgos] = useState(false);
  const [activeExploreTab, setActiveExploreTab] = useState<'SCHEMES' | 'SERVICES' | 'VIGILANCE' | 'CIRCULARS'>('SCHEMES');

  useEffect(() => {
    const handlePortalSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string; category: string }>;
      if (customEvent.detail) {
        if (customEvent.detail.query !== undefined) {
          setSearchTerm(customEvent.detail.query);
        }
        if (customEvent.detail.category && customEvent.detail.category !== 'ALL') {
          if (customEvent.detail.category === 'NGOS') {
            // keep search term
          }
        }
      }
    };
    window.addEventListener('inspira:search', handlePortalSearch);
    return () => window.removeEventListener('inspira:search', handlePortalSearch);
  }, []);

  // Filtered real NGOs for public directory
  const filteredNgos = ngos.filter((ngo) => {
    const matchesSearch =
      ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ngo.scheme && ngo.scheme.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ngo.ngoType && ngo.ngoType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ngo.verificationStatus && ngo.verificationStatus.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ngo.documents?.darpanId && ngo.documents.darpanId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSector = selectedSector === 'ALL' || ngo.sector === selectedSector;
    const matchesDistrict =
      selectedDistrict === 'ALL' ||
      ngo.district.toLowerCase() === selectedDistrict.toLowerCase() ||
      (selectedDistrict.toLowerCase() === 'mumbai' && ngo.district.toLowerCase().includes('mumbai'));
    return matchesSearch && matchesSector && matchesDistrict;
  });

  const sectors = [
    'ALL',
    'De-addiction',
    'Disability Welfare',
    'Education',
    'Child Welfare',
    'Healthcare',
    'Rural Development',
    'Environment',
    'Women Empowerment',
  ];

  const prominentDistricts = [
    'ALL',
    'Latur',
    'Mumbai City',
    'Mumbai Suburban',
    'Pune',
    'Nagpur',
    'Ahmednagar',
    'Chandrapur',
    'Gadchiroli',
    'Kolhapur',
    'Nashik',
    'Jalgaon',
    'Beed',
    'Wardha',
    'Amravati',
    'Raigad',
    'Solapur',
    'Thane',
    'Nanded',
    'Satara',
    'Sindhudurg',
    'Ratnagiri',
    'Dhule',
  ];

  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<NGO | null | 'NOT_FOUND'>(null);
  const [certificateModalNgo, setCertificateModalNgo] = useState<NGO | null>(null);

  const handleExecuteLookup = (queryOverride?: string) => {
    const q = (queryOverride !== undefined ? queryOverride : lookupQuery).trim().toLowerCase();
    if (!q) {
      setLookupResult(null);
      return;
    }
    const match = ngos.find(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.regNumber.toLowerCase().includes(q) ||
        (n.documents?.darpanId && n.documents.darpanId.toLowerCase().includes(q)) ||
        (n.darpanId && n.darpanId.toLowerCase().includes(q)) ||
        n.id.toLowerCase().includes(q) ||
        n.district.toLowerCase().includes(q)
    );
    setLookupResult(match || 'NOT_FOUND');
  };

  // Aggregated Sector Breakdown
  const sectorSummary = sectors.filter((s) => s !== 'ALL').map((sec) => {
    const list = ngos.filter((n) => n.sector === sec);
    const totalBudget = list.reduce((acc, curr) => acc + (curr.annualBudgetInr || 3500000), 0);
    return {
      sector: sec,
      count: list.length,
      budget: totalBudget,
    };
  });

  const formatInrBudget = (amount?: number) => {
    if (!amount) return '₹45 Lakhs';
    if (amount >= 1000000000) {
      return `₹${(amount / 1000000000).toFixed(1)} Thousand Cr`;
    }
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(0)} Lakhs`;
  };

  // Statutory circulars and downloadable manuals data
  const officialCirculars = [
    {
      refNo: 'MSJE/NGO-VIG/2026/044',
      date: '02-03-2026',
      title: 'Mandatory Geofenced Check-In (150m Perimeter) for all Grant-in-Aid Field Audits under Rule 14 GFR 2017',
      department: 'Directorate General of NGO Vigilance',
      size: '420 KB (PDF)'
    },
    {
      refNo: 'NITI/DARPAN/TECH/2026/18',
      date: '18-02-2026',
      title: 'Standard Operating Procedure (SOP) for Cryptographic Photographic Stamping & 5-Category Evidence Capture',
      department: 'NITI Aayog & NIC IT Cell',
      size: '680 KB (PDF)'
    },
    {
      refNo: 'MSJE/DIR-IAS/AUDIT/2026/09',
      date: '28-01-2026',
      title: 'Guidelines on Directorate General (IAS) Assessment Station, Scoring Matrix & Punitive Show-Cause Directives',
      department: 'Ministry of Social Justice & Empowerment',
      size: '315 KB (PDF)'
    },
    {
      refNo: 'CVC/NGO-REDRESS/2025/112',
      date: '14-12-2025',
      title: 'Whistleblower Protection & Citizen Grievance Tracking Protocol under Central Vigilance Commission Norms',
      department: 'Central Vigilance Commission',
      size: '540 KB (PDF)'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans antialiased w-full max-w-full overflow-x-hidden">
      
      {/* 1. SCROLLING GOVERNMENT NOTICE & LIVE TELEMETRY TICKER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-950 text-xs py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Left: Real-time Telemetry Badges */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE GRID</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
              <span className="hidden sm:inline"><strong className="text-white">18</strong> Active Audits</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="hidden md:inline"><strong className="text-emerald-300">1,482</strong> Biometric Punches</span>
              <span className="hidden md:inline text-slate-600">•</span>
              <span className="hidden lg:inline"><strong className="text-amber-300">150m</strong> Geofence Lock</span>
            </div>
          </div>

          {/* Right: Scrolling National Circulars Bar */}
          <div className="overflow-hidden whitespace-nowrap flex-1 relative [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
            <div className="inline-flex animate-marquee hover:pause font-medium text-[11px] text-slate-300">
              <span className="mx-6 flex items-center gap-1.5">
                <span className="text-blue-400 font-bold">●</span>
                <strong className="text-white">Circular MSJE/2026/044:</strong> Mandatory 150m Geofence Lock &amp; EXIF GPS Watermarking in effect for all Annual Welfare Grant Inspections.
              </span>
              <span className="mx-6 flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">●</span>
                <strong className="text-white">DARPAN Directive:</strong> Non-profit entities failing physical verification subject to immediate Show-Cause &amp; Bank Account Freeze under Section 14.
              </span>
              <span className="mx-6 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">●</span>
                <strong className="text-white">Public Grievance Desk:</strong> Citizens can report ghost offices or grant misappropriation anonymously with immutable tracking tokens.
              </span>
              <span className="mx-6 flex items-center gap-1.5">
                <span className="text-purple-400 font-bold">●</span>
                <strong className="text-white">AI Face Matching:</strong> Biometric attendance verified with 68-point facial landmarks and anti-spoof liveness check.
              </span>
              {/* Duplicate set for seamless continuous marquee loop */}
              <span className="mx-6 flex items-center gap-1.5">
                <span className="text-blue-400 font-bold">●</span>
                <strong className="text-white">Circular MSJE/2026/044:</strong> Mandatory 150m Geofence Lock &amp; EXIF GPS Watermarking in effect for all Annual Welfare Grant Inspections.
              </span>
              <span className="mx-6 flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">●</span>
                <strong className="text-white">DARPAN Directive:</strong> Non-profit entities failing physical verification subject to immediate Show-Cause &amp; Bank Account Freeze under Section 14.
              </span>
              <span className="mx-6 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">●</span>
                <strong className="text-white">Public Grievance Desk:</strong> Citizens can report ghost offices or grant misappropriation anonymously with immutable tracking tokens.
              </span>
              <span className="mx-6 flex items-center gap-1.5">
                <span className="text-purple-400 font-bold">●</span>
                <strong className="text-white">AI Face Matching:</strong> Biometric attendance verified with 68-point facial landmarks and anti-spoof liveness check.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN MANDATE & PORTAL OVERVIEW SECTION - OFFICIAL GOVERNMENT IDENTITY */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/90 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        {/* Subtle Watermark of the State Emblem of India */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none -z-0">
          <EmblemOfIndia className="w-96 h-[500px]" variant="transparent" showText={true} />
        </div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-50/60 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Official Mandate & Title */}
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1 bg-amber-50 border border-amber-300/80 rounded-full text-amber-900 text-xs font-bold shadow-2xs">
                <EmblemOfIndia className="w-4 h-5 rounded overflow-hidden" variant="raw" showText={false} />
                <span>भारत सरकार • सामाजिक न्याय और अधिकारिता मंत्रालय | Government of India</span>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs sm:text-sm font-black text-amber-800 tracking-wider font-serif uppercase">
                  राष्ट्रीय सामाजिक कल्याण निगरानी एवं औचक निरीक्षण पोर्टल (INSPIRA)
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18] font-serif">
                  National Real-Time Monitoring &amp;{' '}
                  <span className="text-[#0B3B60] underline decoration-amber-500 decoration-3 underline-offset-4">
                    Surprise Inspection System
                  </span>
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
                Mandated under Rule 14 of the General Financial Rules (GFR), 2017 and aligned with NITI Aayog NGO-DARPAN.
                An authoritative national statutory oversight platform executing surprise on-site verification through
                150-metre perimeter GPS geofence locking, 24x7 live CCTV surveillance integration, double-blind algorithmic duty assignment,
                and Directorate General (IAS) scrutinies.
              </p>

              {/* India.gov.in Style Quick Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-700 mr-1">Welfare Sectors:</span>
                {[
                  { label: 'All Sectors', sector: 'ALL' },
                  { label: '💊 De-addiction (NAPDDR)', sector: 'De-addiction' },
                  { label: '♿ Disability Welfare', sector: 'Disability Welfare' },
                  { label: '👵 Senior Citizen Homes', sector: 'Healthcare' },
                  { label: '👶 Child Care', sector: 'Child Welfare' },
                  { label: '⚧️ Transgender Shelter', sector: 'Women Empowerment' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setSelectedSector(item.sector);
                      document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold border transition-all cursor-pointer ${
                      selectedSector === item.sector
                        ? 'bg-[#0B3B60] text-white border-[#0B3B60] shadow-3xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Public Citizen Actions - Official Government Style Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-[#0B3B60] hover:bg-[#07253D] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center space-x-2 cursor-pointer border border-[#0B3B60]"
                >
                  <Search className="w-4 h-4 text-amber-300" />
                  <span>Search Verified NGOs (DARPAN)</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center space-x-2 cursor-pointer border border-amber-600"
                >
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Official Login (e-Pramaan SSO)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateCitizenTab) onNavigateCitizenTab('FILE_COMPLAINT');
                    else onEnterDashboard('USER');
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold rounded-lg border border-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Lodge Public Grievance</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateCitizenTab) onNavigateCitizenTab('TRACK_COMPLAINT');
                    else onEnterDashboard('USER');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-lg border border-slate-300 shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-[#0B3B60]" />
                  <span>Track Grievance Status</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenSignUp}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-emerald-800 text-xs sm:text-sm font-bold rounded-lg border border-emerald-300 shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>NGO Registration</span>
                </button>
              </div>
            </div>

            {/* Right Column: Public Transparency & Citizen Services Desk - Modern Material Card */}
            <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    Public Transparency Desk
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 border border-emerald-200 rounded-full">
                  PUBLIC ACCESS
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="text-blue-700 text-[10px] uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    100% DARPAN Validated
                  </span>
                  <span className="text-xs text-slate-600 block mt-1 leading-relaxed">
                    Search authenticated non-profit organizations, registration credentials, and audited financial statements across all states.
                  </span>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="text-indigo-700 text-[10px] uppercase font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Mandatory 150m Physical Audit
                  </span>
                  <span className="text-xs text-slate-600 block mt-1 leading-relaxed">
                    Zero ghost facilities. Every welfare grant requires mandatory physical on-site verification within 150 metres before fund release.
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 text-[10px] uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Whistleblower Protection
                  </span>
                  <span className="text-xs text-slate-600 block mt-1 leading-relaxed">
                    File anonymous reports on grant diversion or inactive centers. Track resolution in real time using your unique encrypted token.
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                  Helpline: <strong className="text-slate-800">1800-11-2026</strong>
                </span>
                <span className="text-emerald-700 font-medium">Toll-Free (IST)</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2.5 INTERACTIVE EVALUATION SUITE • 1-CLICK ROLE EXPLORATION STATION */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-6 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/50 shadow-inner">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-emerald-300">
                Evaluation Demo Terminal • 1-Click Role Exploration
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <span className="hidden sm:inline">Smart India Hackathon 2026</span>
              <span className="hidden sm:inline">•</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                INSTANT UNLOCKED ACCESS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Level 5 Admin */}
            <button
              type="button"
              onClick={() => onEnterDashboard('ADMIN')}
              className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-amber-400/50 rounded-xl text-left transition-all group cursor-pointer hover:scale-[1.02] shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  Level 5
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-white mt-2 group-hover:text-amber-300 transition-colors">
                Directorate General (IAS)
              </div>
              <div className="text-[10.5px] text-slate-300 mt-1 leading-snug">
                National oversight, sanctions, CCTV grid &amp; random duty allocation
              </div>
            </button>

            {/* Level 3 Inspector */}
            <button
              type="button"
              onClick={() => onEnterDashboard('OFFICER')}
              className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-blue-400/50 rounded-xl text-left transition-all group cursor-pointer hover:scale-[1.02] shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-blue-400 text-slate-950">
                  Level 3
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-white mt-2 group-hover:text-blue-300 transition-colors">
                Field Vigilance Inspector
              </div>
              <div className="text-[10.5px] text-slate-300 mt-1 leading-snug">
                150m GPS geofenced audit, live camera evidence &amp; radar
              </div>
            </button>

            {/* Level 2 NGO */}
            <button
              type="button"
              onClick={() => onEnterDashboard('NGO')}
              className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-purple-400/50 rounded-xl text-left transition-all group cursor-pointer hover:scale-[1.02] shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-purple-400 text-slate-950">
                  Level 2
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-white mt-2 group-hover:text-purple-300 transition-colors">
                Registered NGO Signatory
              </div>
              <div className="text-[10.5px] text-slate-300 mt-1 leading-snug">
                100-pt compliance score, DARPAN filings &amp; show-cause responses
              </div>
            </button>

            {/* Staff Biometric Attendance */}
            <button
              type="button"
              onClick={() => {
                if (onOpenWorkerAttendance) onOpenWorkerAttendance();
                else onEnterDashboard('NGO');
              }}
              className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-teal-400/50 rounded-xl text-left transition-all group cursor-pointer hover:scale-[1.02] shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-teal-400 text-slate-950">
                  Biometrics
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-white mt-2 group-hover:text-teal-300 transition-colors">
                Staff Facial Punch-In
              </div>
              <div className="text-[10.5px] text-slate-300 mt-1 leading-snug">
                Dual-camera anti-spoof liveness check &amp; GPS timesheets
              </div>
            </button>

            {/* Public Citizen */}
            <button
              type="button"
              onClick={() => onEnterDashboard('USER')}
              className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-emerald-400/50 rounded-xl text-left transition-all group cursor-pointer hover:scale-[1.02] shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                  Public
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-white mt-2 group-hover:text-emerald-300 transition-colors">
                Citizen Grievance Desk
              </div>
              <div className="text-[10.5px] text-slate-300 mt-1 leading-snug">
                Anonymous whistleblower reports &amp; token tracking
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 3. NATIONAL AUDIT STATISTICS STRIP - MODERN GRADIENT ACCENTS */}
      <section className="bg-slate-50/80 border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-2xs card-hover-lift animate-slide-up delay-100 transition-all">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Verified Real NGOs
              </div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 to-blue-950 bg-clip-text text-transparent mt-1">
                {ngos.length > 0 ? `${ngos.length}+` : '34+'}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Real DARPAN Registry
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-2xs card-hover-lift animate-slide-up delay-200 transition-all">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Maharashtra Districts
              </div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mt-1">
                36 / 36
              </div>
              <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Active GIS Telemetry
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-2xs card-hover-lift animate-slide-up delay-300 transition-all">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Mandatory Geofence
              </div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mt-1">
                150m
              </div>
              <div className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Rule 14 GFR 2017 Lock
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-2xs card-hover-lift animate-slide-up delay-400 transition-all">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Audited Grant Capital
              </div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent mt-1">
                ₹1,420+ Cr
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Public &amp; CSR Oversight
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3.2 INDIA.GOV.IN STYLE SPOTLIGHT & TOPICS TABBED HUB */}
      <section className="bg-white border-b border-slate-200/90 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold border border-amber-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>National Portal Directory &amp; Welfare Initiatives</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-serif">
                Explore Social Welfare Programs &amp; Citizen Portals
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Official single-window access to central schemes, physical vigilance protocols, grievance redressal, and statutory documentation under DoSJE.
              </p>
            </div>

            {/* Navigation Tabs (India.gov.in Style) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto text-xs font-bold self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveExploreTab('SCHEMES')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                  activeExploreTab === 'SCHEMES'
                    ? 'bg-[#0B3B60] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Grants &amp; Schemes
              </button>
              <button
                type="button"
                onClick={() => setActiveExploreTab('SERVICES')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                  activeExploreTab === 'SERVICES'
                    ? 'bg-[#0B3B60] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Citizen Services
              </button>
              <button
                type="button"
                onClick={() => setActiveExploreTab('VIGILANCE')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                  activeExploreTab === 'VIGILANCE'
                    ? 'bg-[#0B3B60] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Field Vigilance
              </button>
              <button
                type="button"
                onClick={() => setActiveExploreTab('CIRCULARS')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                  activeExploreTab === 'CIRCULARS'
                    ? 'bg-[#0B3B60] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Statutory Circulars
              </button>
            </div>
          </div>

          {/* Tab 1: Schemes */}
          {activeExploreTab === 'SCHEMES' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      NAPDDR
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">DoSJE-2026</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B3B60] transition-colors">
                    National Action Plan for Drug Demand Reduction
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Provides Grant-in-Aid for Integrated Rehabilitation Centres for Addicts (IRCAs) and Outreach Centres with mandatory biometric check-ins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSector('De-addiction');
                    document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 flex items-center justify-between text-xs font-bold text-[#0B3B60] hover:underline cursor-pointer pt-2 border-t border-slate-200"
                >
                  <span>View Verified Centers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                      AVYAY
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Senior Care</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B3B60] transition-colors">
                    Atal Vayo Abhyuday Yojana (Senior Citizens)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Support for senior citizen homes, continuous healthcare, nutrition, and recreation with CCTV occupancy surveillance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSector('Healthcare');
                    document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 flex items-center justify-between text-xs font-bold text-[#0B3B60] hover:underline cursor-pointer pt-2 border-t border-slate-200"
                >
                  <span>View Senior Homes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      DIVYANGJAN
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Accessibility</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B3B60] transition-colors">
                    Disability Welfare &amp; Skill Empowerment
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Special schools, vocational training centers, and assistive aids distribution institutions under DEPwD guidelines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSector('Disability Welfare');
                    document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 flex items-center justify-between text-xs font-bold text-[#0B3B60] hover:underline cursor-pointer pt-2 border-t border-slate-200"
                >
                  <span>View Special Centers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                      GARIMA GREH
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Inclusion</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B3B60] transition-colors">
                    Transgender Persons Shelter &amp; Skill Development
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Safe shelter homes with legal aid, medical counseling, and vocational training under the National Portal for Transgender Persons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSector('Women Empowerment');
                    document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 flex items-center justify-between text-xs font-bold text-[#0B3B60] hover:underline cursor-pointer pt-2 border-t border-slate-200"
                >
                  <span>View Shelter Network</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Services */}
          {activeExploreTab === 'SERVICES' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Lodge Whistleblower Grievance</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Report grant misappropriation, ghost centers, or sub-standard living conditions anonymously under CVC guidelines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEnterDashboard('USER')}
                  className="mt-4 flex items-center justify-between text-xs font-bold text-amber-800 hover:underline cursor-pointer pt-2 border-t border-slate-200"
                >
                  <span>File Complaint Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4 text-[#0B3B60]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Track Complaint Status</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Check real-time inquiry progress, investigating officer assignment, and official resolution using your 10-digit token.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEnterDashboard('USER')}
                  className="mt-4 flex items-center justify-between text-xs font-bold text-[#0B3B60] hover:underline cursor-pointer pt-2 border-t border-slate-200"
                >
                  <span>Track Token</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">NGO DARPAN Registration</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enroll your non-profit organization on the central portal to qualify for statutory Grant-in-Aid under central schemes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenSignUp}
                  className="mt-4 flex items-center justify-between text-xs font-bold text-emerald-800 hover:underline cursor-pointer pt-2 border-t border-slate-200"
                >
                  <span>Register Entity</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Verify NGO Compliance Certificate</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Verify statutory DARPAN credentials, on-site 150m geofence audit score, and download official Rule 14 compliance certificates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 flex items-center justify-between text-xs font-bold text-teal-800 hover:underline cursor-pointer pt-2 border-t border-slate-200"
                >
                  <span>Verify Compliance Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Vigilance */}
          {activeExploreTab === 'VIGILANCE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4 text-amber-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">150m Geofenced Perimeter Lock</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Inspection mobile terminal locks submission controls unless the officer is physically verified within 150m of registered coordinates.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-200 text-[10.5px] font-mono text-emerald-700 font-bold">
                  ✓ Active on Mobile Terminal
                </div>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Camera className="w-4 h-4 text-[#0B3B60]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">5-Category Photographic Stamping</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mandatory capture of building frontage, beneficiaries, kitchen hygiene, medical dispensary, and physical registers with EXIF watermarking.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-200 text-[10.5px] font-mono text-blue-700 font-bold">
                  ✓ EXIF Tamper Proof
                </div>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Radio className="w-4 h-4 text-purple-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">24x7 Live CCTV Surveillance</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Real-time video feed integration from institutional dining halls and activity areas to verify genuine physical occupancy.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-200 text-[10.5px] font-mono text-purple-700 font-bold">
                  ✓ RTSP / HLS Grid
                </div>
              </div>

              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">SHA-256 Cryptographic Sealed Dossier</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Every audit report is hashed with SHA-256 and sealed with inspector digital credentials before Directorate review.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-200 text-[10.5px] font-mono text-emerald-700 font-bold">
                  ✓ Immutable Audit Trail
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Circulars */}
          {activeExploreTab === 'CIRCULARS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              {officialCirculars.map((c) => (
                <div key={c.refNo} className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex flex-col justify-between group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{c.refNo}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{c.date}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0B3B60] transition-colors line-clamp-2">
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">{c.department}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('statutory-documents-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-4 flex items-center justify-between text-xs font-bold text-[#0B3B60] hover:underline cursor-pointer pt-2 border-t border-slate-200"
                  >
                    <span>Download PDF ({c.size})</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3.5 CENTRAL NGO & FIELD INSPECTION AUTHENTICATOR */}
      <section className="bg-gradient-to-b from-slate-50/90 via-blue-50/40 to-white border-b border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100/70 text-blue-900 rounded-full text-xs font-semibold border border-blue-200 mb-2 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>National Verification &amp; Integrity Gateway</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Central NGO &amp; Field Inspection Authenticator
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Verify the genuine DARPAN credentials, on-site 150m geofence audit clearance, and statutory compliance status of any voluntary organization.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>DIRECTORATE ENCRYPTED REGISTRY</span>
              </span>
            </div>
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteLookup();
            }}
            className="bg-white p-3 sm:p-4 rounded-2xl border border-blue-200/90 shadow-sm flex flex-col md:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Enter DARPAN ID (e.g. DL/2026/00142), Registration Number, or NGO Name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Authenticity</span>
              </button>

              {lookupResult && (
                <button
                  type="button"
                  onClick={() => {
                    setLookupQuery('');
                    setLookupResult(null);
                  }}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Clear lookup"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Quick Try Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Quick Test Lookups:</span>
            {['Latur', 'Swasthya', 'Apnalaya', 'Vikas', 'Gramin'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setLookupQuery(sample);
                  handleExecuteLookup(sample);
                }}
                className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full font-medium transition-colors cursor-pointer text-[11px]"
              >
                Try: &quot;{sample}&quot;
              </button>
            ))}
          </div>

          {/* Lookup Result Render */}
          {lookupResult === 'NOT_FOUND' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center text-xs text-amber-900 space-y-2 animate-fade-in">
              <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
              <div className="font-bold text-sm">No Registered Voluntary Organization Found</div>
              <p className="max-w-md mx-auto text-amber-800">
                No matching record found in the Central DARPAN Master Registry for &quot;{lookupQuery}&quot;. Please verify spelling, or check the full directory below.
              </p>
            </div>
          )}

          {lookupResult && lookupResult !== 'NOT_FOUND' && (
            <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-5 sm:p-6 shadow-md animate-scale-in space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        ● VERIFIED DARPAN RECORD
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        DARPAN: {lookupResult.documents?.darpanId || lookupResult.regNumber}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {lookupResult.name}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {lookupResult.address}, {lookupResult.district}, {lookupResult.state} • Sector: <strong className="text-slate-900">{lookupResult.sector}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCertificateModalNgo(lookupResult)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Inspection Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectNgoDetails?.(lookupResult)}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 transition-all cursor-pointer"
                  >
                    Open Dossier
                  </button>
                </div>
              </div>

              {/* Integrity Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Geofence Audit Lock</span>
                  <div className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>150m Perimeter Verified</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Zero Ghost Premises</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Compliance Score</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5 font-mono">
                    {lookupResult.complianceScore || 95}/100
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Grade A • Full Grant Clearance</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">FCRA Regulatory Status</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {lookupResult.fcraStatus || 'VALID'}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Sec 12A &amp; 80G Certified</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Last Field Inspection</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {lookupResult.lastInspectionDate || '18-Feb-2026'}
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold block">NIC Vigilance Division</span>
                </div>
              </div>
            </div>
          )}

          {/* Sector Grant Allocation & Beneficiary Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Welfare Scheme Sector Allocation &amp; Capacity Tracker
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select any welfare sector below to immediately filter registered centers and verified grant utilization.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 self-start">
                Total Budget Monitored: <strong className="text-slate-900">₹1,420+ Cr</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {sectorSummary.map((item) => (
                <button
                  key={item.sector}
                  type="button"
                  onClick={() => {
                    setSelectedSector(item.sector);
                    document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedSector === item.sector
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50/80 hover:bg-blue-50/60 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className={`text-[11px] font-bold truncate ${selectedSector === item.sector ? 'text-white' : 'text-slate-900'}`}>
                    {item.sector}
                  </div>
                  <div className={`text-[10px] mt-1 font-mono ${selectedSector === item.sector ? 'text-blue-100' : 'text-slate-500'}`}>
                    {item.count} Centers
                  </div>
                  <div className={`text-[10px] font-bold font-mono mt-0.5 ${selectedSector === item.sector ? 'text-amber-300' : 'text-blue-700'}`}>
                    {formatInrBudget(item.budget)}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 4. FOUR KEY ADMINISTRATIVE MODULES */}
      <section className="bg-white border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Core Administrative Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Statutory verification mechanisms implemented to eliminate ghost organizations and ensure grant transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Module 1 */}
            <div className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs card-hover-lift transition-all group animate-slide-up delay-100">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  150m Dynamic Geofence
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Field checklists cannot be accessed or submitted unless the inspector’s live device GPS coordinates match the registered premises within 150 metres.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Rule 14 GFR 2017 Compliant
              </div>
            </div>

            {/* Module 2 */}
            <div className="bg-white border border-slate-200/80 hover:border-indigo-400 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs card-hover-lift transition-all group animate-slide-up delay-200">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Tamper-Proof Photo Stamping
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uploads from device galleries are permanently restricted. All photos must be captured through live webcam with embedded GPS, IST timestamp, and SHA-256 watermark.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                5 Dedicated Evidence Spaces
              </div>
            </div>

            {/* Module 3 */}
            <div className="bg-white border border-slate-200/80 hover:border-sky-400 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs card-hover-lift transition-all group animate-slide-up delay-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  DG (IAS) Scrutiny Station
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Executive oversight authority conducts line-by-line review of submitted field records, assigning compliance scores (0–100), Good/Bad verdicts, and statutory notices.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-sky-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                Official Order Sealing Desk
              </div>
            </div>

            {/* Module 4 */}
            <div className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs card-hover-lift transition-all group animate-slide-up delay-400">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  4
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Citizen Whistleblower Desk
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Citizens and beneficiaries can report ghost non-profits or financial embezzlement anonymously, receiving a cryptographic tracking token for real-time case updates.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                CVC Whistleblower Protection
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4.5 LIVE NATIONAL GIS TELEMETRY & 150m GEOFENCE RADAR PREVIEW */}
      <section className="bg-gradient-to-b from-white to-slate-50/80 border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold border border-blue-200 mb-2 shadow-2xs">
                <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>Live State Geospatial Stream</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                National GIS Telemetry &amp; 150m Geofence Perimeter Map
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real-time geospatial directory of all 34 verified NGO centers, welfare institutions, and statutory 150m perimeter audit locations across Maharashtra.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <span className="text-xs text-slate-600 font-mono bg-white border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Active 150m Geofence Engine</span>
              </span>
            </div>
          </div>

          {/* Embedded Interactive Map Card with Modern Glassmorphic Frame */}
          <div className="rounded-2xl border border-slate-200/90 shadow-md overflow-hidden bg-white p-2">
            <InteractiveMap
              ngos={ngos}
              officers={officers}
              selectedNgo={selectedNgoForMap}
              onSelectNgo={(ngo) => {
                setSelectedNgoForMap(ngo);
                if (onSelectNgoDetails) {
                  onSelectNgoDetails(ngo);
                }
              }}
              heightClass="h-[460px]"
              showAllOfficers={false}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs card-hover-lift flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">150m Radius Geofencing</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Eliminates ghost facilities. Physical presence within registered perimeter is verified by device GPS before audit checklist unlocks.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs card-hover-lift flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Radio className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Real-Time Spatial Telemetry</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Field inspectors transmit live encrypted GPS coordinates, satellite triangulation fix, and battery telemetry during on-site rounds.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs card-hover-lift flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">36 Districts Monitored</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Continuous oversight across all divisions: from Mumbai headquarters and Latur trusts to remote Gadchiroli tribal healthcare sanctuaries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEARCHABLE PUBLIC NGO DARPAN DIRECTORY & CARDS VIEW */}
      <section id="public-ngo-directory-section" className="bg-slate-50/60 border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Public NGO DARPAN Directory
                </h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  100% REAL DATA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Official registry of 34+ verified non-profit entities across Maharashtra &amp; India with live GIS coordinates, FCRA status, and audit scores.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              {/* View Switcher Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDirectoryViewMode('CARDS')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    directoryViewMode === 'CARDS'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Card Grid Dossier View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryViewMode('TABLE')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    directoryViewMode === 'TABLE'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="High-Density Data Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>

              <button
                onClick={() => onEnterDashboard('USER')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <span>Citizen Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick District Filter Pills Carousel */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>District Filter Quick-Select ({prominentDistricts.length - 1} Maharashtra Districts):</span>
              {selectedDistrict !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedDistrict('ALL')}
                  className="text-blue-600 hover:underline cursor-pointer lowercase first-letter:uppercase font-normal"
                >
                  Clear District Filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 [scrollbar-width:none]">
              {prominentDistricts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedDistrict === d
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {d === 'ALL' ? '📍 All Maharashtra' : d}
                  {d === 'Latur' && ' 🌟'}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Sector Filter Toolbar */}
          <div className="bg-white p-3 sm:p-4 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Real NGO Name, DARPAN ID, District..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500 whitespace-nowrap text-xs">Sector:</span>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/50 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {sectors.map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              <span className="text-slate-500 font-mono text-xs whitespace-nowrap">
                Showing: <strong className="text-slate-900">{filteredNgos.length}</strong> of {ngos.length}
              </span>

              <button
                type="button"
                onClick={() => setShowAllNgos(!showAllNgos)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap px-3 py-1 rounded-full bg-blue-50 border border-blue-200 cursor-pointer"
              >
                {showAllNgos ? 'Show Top 9' : `Show All (${filteredNgos.length})`}
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: EXECUTIVE CARDS GRID */}
          {directoryViewMode === 'CARDS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(showAllNgos ? filteredNgos : filteredNgos.slice(0, 9)).map((ngo) => {
                  const score = ngo.complianceScore || 90;
                  const isCompliant = ngo.status === 'REGISTERED';
                  const hasViolation = ngo.status === 'FLAGGED_VIOLATION';

                  return (
                    <div
                      key={ngo.id}
                      className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-2xs card-hover-lift animate-slide-up transition-all flex flex-col justify-between group space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Card Header Pills */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {ngo.documents?.darpanId || ngo.regNumber}
                          </span>
                          <div className="flex items-center gap-1.5 ml-auto">
                            {ngo.verificationStatus && (
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                  ngo.verificationStatus.includes('Confirmed')
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                {ngo.verificationStatus.includes('Confirmed') ? '✓ ' : '⚠️ '}
                                {ngo.verificationStatus}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isCompliant
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : hasViolation
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              ● {ngo.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Title, Scheme & Sector */}
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors leading-snug">
                            {ngo.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[10px]">
                              {ngo.sector}
                            </span>
                            {ngo.scheme && (
                              <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px]">
                                🏛️ {ngo.scheme}
                              </span>
                            )}
                            {ngo.ngoType && (
                              <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                                {ngo.ngoType}
                              </span>
                            )}
                            <span>• Est. {ngo.foundingYear || 2000}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {ngo.description}
                        </p>

                        {/* Address & District */}
                        <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{ngo.address}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pl-5">
                            <span>District: <strong className="text-slate-700">{ngo.district}</strong></span>
                            <span>State: <strong className="text-slate-700">{ngo.state}</strong></span>
                          </div>
                        </div>

                        {/* Key Metrics Chips */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block">Annual Budget</span>
                            <strong className="font-mono text-slate-900 text-xs">{formatInrBudget(ngo.annualBudgetInr)}</strong>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block">Compliance</span>
                            <strong className={`font-mono text-xs ${score >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {score}% {score >= 85 ? 'Grade A' : 'Grade B'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                          {(ngo.googleMapsUrl || (ngo.coordinates && typeof ngo.coordinates.lat === 'number' && typeof ngo.coordinates.lng === 'number')) && (
                            <a
                              href={ngo.googleMapsUrl || `https://www.google.com/maps?q=${ngo.coordinates?.lat},${ngo.coordinates?.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              title="Verify on Real Google Maps"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Google Maps</span>
                            </a>
                          )}
                          {ngo.website && ngo.website !== 'N/A' && (
                            <a
                              href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                              title="Official Website"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>Website</span>
                            </a>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectNgoDetails) {
                              onSelectNgoDetails(ngo);
                            } else {
                              onEnterDashboard('USER');
                            }
                          }}
                          className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-full shadow-2xs transition-all cursor-pointer ml-auto"
                        >
                          Dossier Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredNgos.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-500">
                  No registered organizations match the selected district or search term.
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: HIGH-DENSITY DATA TABLE */}
          {directoryViewMode === 'TABLE' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                      <th className="py-3 px-4 w-12 text-center">S.No.</th>
                      <th className="py-3 px-4">DARPAN ID</th>
                      <th className="py-3 px-4">Organization Name</th>
                      <th className="py-3 px-4">Sector</th>
                      <th className="py-3 px-4">District &amp; State</th>
                      <th className="py-3 px-4">Annual Budget</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(showAllNgos ? filteredNgos : filteredNgos.slice(0, 10)).map((ngo, idx) => (
                      <tr key={ngo.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">
                          {ngo.documents?.darpanId || ngo.regNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{ngo.name}</span>
                            {ngo.verificationStatus && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
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
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
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
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{ngo.description}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {ngo.sector}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {ngo.district}, {ngo.state}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {formatInrBudget(ngo.annualBudgetInr)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                              ngo.status === 'REGISTERED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ngo.status === 'UNDER_INSPECTION'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {ngo.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                          {ngo.complianceScore || 95}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(ngo.googleMapsUrl || (ngo.coordinates && typeof ngo.coordinates.lat === 'number')) && (
                              <a
                                href={ngo.googleMapsUrl || `https://www.google.com/maps?q=${ngo.coordinates?.lat},${ngo.coordinates?.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                                title="Open Google Maps CID"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                if (onSelectNgoDetails) {
                                  onSelectNgoDetails(ngo);
                                } else {
                                  onEnterDashboard('USER');
                                }
                              }}
                              className="px-3.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-semibold rounded-full shadow-2xs cursor-pointer transition-all"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredNgos.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-500">
                  No organizations found matching the search criteria.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 6. STATUTORY CIRCULARS, NOTIFICATIONS & MANUALS */}
      <section id="statutory-documents-section" className="bg-white border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Statutory Circulars &amp; Guidelines
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Official gazette orders, verification standards, and operational guidelines published by the Ministry.
            </p>
          </div>

          <div className="border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                    <th className="py-3 px-4 w-44">Ref No.</th>
                    <th className="py-3 px-4 w-28">Date</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 w-60">Department</th>
                    <th className="py-3 px-4 text-center w-32">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {officialCirculars.map((c) => (
                    <tr key={c.refNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">
                        {c.refNo}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {c.date}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {c.title}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {c.department}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob(
                              [
                                `GOVERNMENT OF INDIA\nMinistry of Social Justice and Empowerment\nDirectorate General of NGO Vigilance\n\nOFFICIAL GAZETTE CIRCULAR\nRef No: ${c.refNo}\nDate: ${c.date}\nDepartment: ${c.department}\n\nSUBJECT: ${c.title}\n\n1. STATUTORY AUTHORITY: In accordance with Rule 14 of General Financial Rules (GFR), 2017, all non-profit entities receiving Grants-in-Aid under central schemes must undergo mandatory on-site physical inspection.\n2. GEOFENCE ENFORCEMENT: Submission of inspection verification checklists is locked until the officer's device is verified inside the registered 150-metre GPS geofenced perimeter.\n3. EVIDENCE STANDARDS: Five dedicated photographic evidence categories (Premises, Infrastructure, Beneficiaries, Ledgers, Violations) must be timestamped with SHA-256 EXIF cryptographic hashes.\n4. PENAL PROVISIONS: Failure to verify genuine operational facilities results in immediate grant forfeiture, Section 14 show-cause issuance, and DARPAN de-registration.\n\nBy Order,\nJoint Secretary & Directorate General of NGO Vigilance\nGovernment of India`
                              ],
                              { type: 'text/plain;charset=utf-8' }
                            );
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${c.refNo.replace(/[\/\\?%*:|"<>]/g, '_')}_Official_Circular.txt`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          title={`Download Gazette Order: ${c.refNo}`}
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 7. FOUR-STAGE FIELD INSPECTION WORKFLOW */}
      <section className="bg-slate-50/60 border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="border-b border-slate-200/80 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Four-Stage Physical Verification Protocol
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Strict multi-tier procedural standards ensuring physical on-site presence and forensic evidence integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs hover:shadow-md transition-shadow">
              <div className="inline-block font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Stage 01
              </div>
              <h3 className="text-sm font-bold text-slate-900">Algorithmic Task Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Central oversight officers dispatch surprise or scheduled audits to regional vigilance inspectors based on risk scoring and complaints.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs hover:shadow-md transition-shadow">
              <div className="inline-block font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Stage 02
              </div>
              <h3 className="text-sm font-bold text-slate-900">150m Geofence Lock</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The inspector’s mobile terminal tracks live spatial distance. Verification checklists unlock only upon crossing the 150m boundary threshold.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs hover:shadow-md transition-shadow">
              <div className="inline-block font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Stage 03
              </div>
              <h3 className="text-sm font-bold text-slate-900">Live Photographic Capture</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live webcam capture across 5 evidence categories (Signboards, Ledgers, Beneficiaries, Infrastructure, Violations) with EXIF GPS watermark.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs hover:shadow-md transition-shadow">
              <div className="inline-block font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Stage 04
              </div>
              <h3 className="text-sm font-bold text-slate-900">Directorate (IAS) Scrutiny</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dossier is examined by the Directorate General for final compliance scoring (0–100), Good/Bad verdict, and statutory sanctions.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 7.5 OFFICIAL SMART INDIA HACKATHON (SIH) INNOVATION TEAM DETAIL */}
      <section id="sih-team-details" className="py-14 bg-gradient-to-b from-slate-50 via-white to-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-full text-xs font-bold font-mono tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-700 animate-pulse" />
                <span>SMART INDIA HACKATHON INNOVATION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Team Detail</span>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold border border-emerald-300">
                  Verified Candidate
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Official development roster &amp; institutional credentials for INSPIRA National NGO Vigilance Portal
              </p>
            </div>

            {onOpenTeamDetails && (
              <button
                type="button"
                onClick={onOpenTeamDetails}
                className="px-4 py-2 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 hover:from-purple-800 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
              >
                <Users className="w-3.5 h-3.5 text-amber-300" />
                <span>Open Team Dossier</span>
              </button>
            )}
          </div>

          {/* 4 Characteristic Gradient Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Team Name */}
            <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r from-[#0284c7] to-[#0ea5e9]">
              <div className="relative z-10">
                <div className="text-xs font-bold text-sky-100 uppercase tracking-wider">
                  Team Name
                </div>
                <div className="text-xl font-black mt-1 tracking-tight">
                  {SIH_TEAM_DATA.teamName}
                </div>
              </div>
              <CreditCard className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20" />
            </div>

            {/* Card 2: Team Leader Name */}
            <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r from-[#65a30d] to-[#84cc16]">
              <div className="relative z-10">
                <div className="text-xs font-bold text-lime-100 uppercase tracking-wider">
                  Team Leader Name
                </div>
                <div className="text-xl font-black mt-1 tracking-tight">
                  {SIH_TEAM_DATA.teamLeader}
                </div>
              </div>
              <Users className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20" />
            </div>

            {/* Card 3: Team ID */}
            <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r from-[#7c3aed] to-[#a855f7]">
              <div className="relative z-10">
                <div className="text-xs font-bold text-purple-100 uppercase tracking-wider">
                  Team ID
                </div>
                <div className="text-xl font-black mt-1 tracking-tight font-mono">
                  {SIH_TEAM_DATA.teamId}
                </div>
              </div>
              <Building2 className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20" />
            </div>

            {/* Card 4: College Name */}
            <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r from-[#0284c7] to-[#2563eb]">
              <div className="relative z-10">
                <div className="text-xs font-bold text-cyan-100 uppercase tracking-wider">
                  College Name
                </div>
                <div className="text-xs font-bold mt-1 leading-snug line-clamp-3">
                  {SIH_TEAM_DATA.collegeName}
                </div>
              </div>
              <GraduationCap className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20" />
            </div>
          </div>

          {/* Team Members Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-bold text-[#6d28d9] tracking-tight flex items-center gap-2">
              <span>Team Members</span>
              <span className="text-xs font-mono px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                6 Members
              </span>
            </h3>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-[#262626] text-white uppercase font-bold tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Member Role</th>
                    <th scope="col" className="px-4 py-3">Member Name</th>
                    <th scope="col" className="px-4 py-3">Member Email</th>
                    <th scope="col" className="px-4 py-3">Member Phone</th>
                    <th scope="col" className="px-4 py-3">Member Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {SIH_TEAM_DATA.members.map((member) => {
                    const isLeader = member.role === 'LEADER';
                    return (
                      <tr
                        key={member.email}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isLeader ? 'bg-amber-50/30 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isLeader ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Award className="w-3 h-3 text-amber-700" />
                              LEADER
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              TEAM_MEMBER
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {member.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">
                          <a
                            href={`mailto:${member.email}`}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            {member.email}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-mono whitespace-nowrap">
                          <a
                            href={`tel:${member.phone}`}
                            className="hover:text-emerald-600 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {member.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              member.gender === 'Female'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {member.gender}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 8. OFFICIAL GOVERNMENT INSTITUTIONAL FOOTER (INDIA.GOV.IN SPECIFICATION) */}
      <footer className="bg-slate-900 text-slate-300 text-xs border-t-4 border-[#0B3B60]">
        
        {/* Upper Footer Links */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-800">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-14 shrink-0 overflow-hidden flex items-center justify-center">
                <EmblemOfIndia className="w-10 h-14" variant="gold" showText={true} />
              </div>
              <div className="border-l border-slate-700 pl-2.5">
                <div className="font-black text-xs text-white font-serif">भारत सरकार</div>
                <div className="font-bold text-xs text-amber-400">INSPIRA PORTAL</div>
                <div className="text-[10px] text-slate-400">Government of India</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ministry of Social Justice &amp; Empowerment, Government of India.<br />
              Shastri Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <DigitalIndiaLogo className="h-6" />
              <EPramaanLogo className="h-6" />
              <NicLogo className="h-6" />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Citizen &amp; Official Portals</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-slate-400 hover:text-amber-300 cursor-pointer transition-colors"
                >
                  Official e-Pramaan SSO Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSignUp}
                  className="text-slate-400 hover:text-amber-300 cursor-pointer transition-colors"
                >
                  Citizen &amp; NGO Registration
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-slate-400 hover:text-amber-300 cursor-pointer transition-colors"
                >
                  Public NGO Directory (DARPAN)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('statutory-documents-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-slate-400 hover:text-amber-300 cursor-pointer transition-colors"
                >
                  Statutory Circulars &amp; GFR Rules
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onEnterDashboard('USER')}
                  className="text-slate-400 hover:text-amber-300 cursor-pointer transition-colors"
                >
                  Lodge Whistleblower Grievance
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Important National Portals</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://www.india.gov.in" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <span>National Portal of India (india.gov.in)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://ngodarpan.gov.in" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <span>NGO DARPAN (NITI Aayog)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://fcraonline.nic.in" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <span>FCRA Online Services (MHA)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://data.gov.in" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <span>Open Government Data (OGD) India</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://cvc.gov.in" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <span>Central Vigilance Commission (CVC)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Certifications &amp; Standards</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>W3C WCAG 2.1 AAA Compliant</span>
              </p>
              <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>GIGW 3.0 &amp; CERT-In Certified</span>
              </p>
              <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>256-Bit SHA Tamper Verification</span>
              </p>
              <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ISO 27001 Security Management</span>
              </p>
              <div className="font-mono text-[10.5px] text-slate-400 pt-1 border-t border-slate-800">
                Release: v4.5.0-GOV (NIC Secure GovNet)
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Attribution & Copyright Bar */}
        <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="text-center md:text-left leading-relaxed">
            Designed &amp; Developed for <strong className="text-white">Smart India Hackathon</strong> by <strong className="text-amber-300 font-bold">Team InnoCoders (Team ID: 180211)</strong> • {SIH_TEAM_DATA.collegeName}.<br />
            Institutional Prototype for Ministry of Social Justice and Empowerment, Government of India.
          </div>
          <div className="flex items-center space-x-3 shrink-0 flex-wrap justify-center text-[11px]">
            <span className="hover:text-white cursor-pointer">Website Policies</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Help &amp; FAQ</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Feedback</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Terms of Use</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Sitemap</span>
            <span>•</span>
            <span className="text-amber-400 font-mono">Visitors: 1,842,910</span>
          </div>
        </div>

      </footer>

      {/* OFFICIAL VERIFICATION & STATUTORY AUDIT CERTIFICATE MODAL */}
      {certificateModalNgo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border-4 border-amber-600/30 shadow-2xl overflow-hidden text-slate-900 relative my-auto">
            {/* National Tri-Color Accent Line */}
            <div className="h-2 bg-gradient-to-r from-amber-500 via-sky-400 to-emerald-600"></div>

            {/* Modal Header Controls */}
            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                  OFFICIAL GOVERNMENT VERIFICATION CERTIFICATE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCertificateModalNgo(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Content - Print Friendly Design */}
            <div id="statutory-certificate-printable" className="p-6 sm:p-10 space-y-6 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Seal and Ministry Details */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mx-auto mb-1">
                  <EmblemOfIndia className="w-16 h-20 drop-shadow-sm" variant="gold" showText={true} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 font-serif">
                  भारत सरकार • Government of India • Ministry of Social Justice &amp; Empowerment
                </h3>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Certificate of Statutory Verification &amp; DARPAN Compliance
                </h2>
                <div className="text-[11px] font-mono text-slate-500">
                  Certificate Ref: <strong className="text-slate-900">GOV/MSJE/2026/CERT-{(certificateModalNgo.id || 'NGO').slice(-6).toUpperCase()}</strong> • Issued under Rule 14 GFR 2017
                </div>
              </div>

              {/* Certificate Body Text */}
              <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 shadow-xs text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
                <p>
                  This is to certify that the non-governmental voluntary organization detailed below has undergone mandatory physical verification and on-site audit under the National Real-Time Vigilance Framework:
                </p>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-500">Organization:</span>
                    <span className="col-span-2 font-bold text-slate-900 text-sm">{certificateModalNgo.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-500">DARPAN ID:</span>
                    <span className="col-span-2 font-mono font-bold text-blue-700">{certificateModalNgo.documents?.darpanId || certificateModalNgo.regNumber}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-500">Sector &amp; Jurisdiction:</span>
                    <span className="col-span-2 text-slate-800">{certificateModalNgo.sector} • {certificateModalNgo.district}, {certificateModalNgo.state}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-500">Compliance Rating:</span>
                    <span className="col-span-2 font-bold text-emerald-700">
                      {certificateModalNgo.complianceScore || 95}% (Grade A • Fully Verified)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-500">150m Geofence Lock:</span>
                    <span className="col-span-2 text-slate-800 flex items-center gap-1.5 font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Physical on-site coordinates authenticated via device GPS</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  This electronic certificate confirms the physical existence of project premises, active beneficiary rolls, statutory ledger maintenance, and eligibility for central/state welfare grants.
                </p>
              </div>

              {/* Signatures & Seal Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <QrCode className="w-10 h-10 text-slate-700" />
                  <div className="text-[10px] font-mono text-slate-500">
                    <div>SCAN TO VERIFY</div>
                    <div className="text-slate-800 font-bold">NIC-SECURE-SHA256</div>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <div className="font-serif italic font-bold text-slate-900 text-sm">Dr. Rajesh Verma, IAS</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Directorate General of NGO Vigilance
                  </div>
                  <div className="text-[9px] text-emerald-700 font-mono">
                    Digitally Sealed • e-Sign Active
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                Official Ministry Document • Public Record
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertificateModalNgo(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-full transition-colors cursor-pointer"
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
