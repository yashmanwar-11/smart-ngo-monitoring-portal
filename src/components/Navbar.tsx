import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Users,
  Bell,
  Clock,
  Home,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserCheck,
  ChevronDown,
  MapPin,
  Building2,
  FileCheck2,
  AlertTriangle,
  Lock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  PhoneCall,
  Smartphone,
  Search,
  Contrast,
  Globe,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  HelpCircle,
  X,
  Sparkles,
  ArrowRight,
  Video,
  Zap
} from 'lucide-react';
import { User, AuthSession } from '../types';
import { InspiraLogo } from './InspiraLogo';
import { PrototypeDisclaimerBanner } from './PrototypeDisclaimerBanner';
import { DigitalIndiaLogo, EPramaanLogo, NgoDarpanLogo, NicLogo } from './GovLogos';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  currentUser: User | null;
  currentSession?: AuthSession | null;
  allUsers: User[];
  currentView: 'HERO' | 'DASHBOARD' | 'WORKER_ATTENDANCE' | 'ANDROID_VIEW';
  onNavigateHome: () => void;
  onNavigateDashboard: (targetTab?: string) => void;
  onNavigateWorkerAttendance?: () => void;
  onOpenLogin: () => void;
  onOpenSignUp: () => void;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  onOpenInspectorLogin: () => void;
  isMobileFrame?: boolean;
  onToggleMobileFrame?: () => void;
  onOpenCodeModal?: () => void;
  unreadComplaintsCount: number;
  fontSizeRatio?: 'standard' | 'large' | 'small';
  onSetFontSize?: (ratio: 'standard' | 'large' | 'small') => void;
  isHighContrast?: boolean;
  onToggleHighContrast?: () => void;
  language?: 'en' | 'hi';
  onToggleLanguage?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenTeamDetails?: () => void;
  onOpenVersionModal?: () => void;
  onOpenApiConfigModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentSession,
  allUsers,
  currentView,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateWorkerAttendance,
  onOpenLogin,
  onOpenSignUp,
  onLogout,
  onSwitchUser,
  onOpenInspectorLogin,
  isMobileFrame,
  onToggleMobileFrame,
  unreadComplaintsCount,
  fontSizeRatio = 'standard',
  onSetFontSize,
  isHighContrast = false,
  onToggleHighContrast,
  language = 'en',
  onToggleLanguage,
  onOpenCommandPalette,
  onOpenTeamDetails,
  onOpenVersionModal,
  onOpenApiConfigModal,
}) => {
  const isInsideAndroid = isMobileFrame || (typeof window !== 'undefined' && window.location.search.includes('android_mode=1'));
  const [istTime, setIstTime] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDelegationSubmenuOpen, setIsDelegationSubmenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [searchCategory, setSearchCategory] = useState<string>('ALL');
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const calendarRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        }) +
          ' | ' +
          now.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }) +
          ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close calendar popover, mega menu and user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setActiveMegaMenu(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = navSearchQuery.trim();
    window.dispatchEvent(
      new CustomEvent('inspira:search', {
        detail: { query: q, category: searchCategory },
      })
    );
    if (currentView !== 'HERO') {
      onNavigateHome();
    }
    setTimeout(() => {
      const el = document.getElementById('public-ngo-directory-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const handleTrendingClick = (tag: string) => {
    setNavSearchQuery(tag);
    window.dispatchEvent(
      new CustomEvent('inspira:search', {
        detail: { query: tag, category: 'ALL' },
      })
    );
    if (currentView !== 'HERO') {
      onNavigateHome();
    }
    setTimeout(() => {
      const el = document.getElementById('public-ngo-directory-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded">
            Directorate Admin
          </span>
        );
      case 'OFFICER':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 rounded">
            Field Inspector
          </span>
        );
      case 'NGO':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 rounded">
            Level 2: NGO Authorized Signatory
          </span>
        );
      case 'NGO_WORKER':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300 rounded">
            Level 2: Institutional Field Staff
          </span>
        );
      case 'USER':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 rounded">
            Level 1: Citizen / Public Vigilance
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white text-slate-900 border-b border-slate-200/90 shadow-sm font-sans">
      {/* Permanent, Non-Dismissible SIH Prototype Disclaimer Banner */}
      <PrototypeDisclaimerBanner />

      {/* Tier 1: National Tricolor Flag Accent Ribbon */}
      <div className="grid grid-cols-3 h-[4px] w-full shadow-2xs">
        <div className="bg-[#FF9933]"></div>
        <div className="bg-[#FFFFFF] relative flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#000080]"></div>
        </div>
        <div className="bg-[#138808]"></div>
      </div>

      {/* Tier 2: Utility & Accessibility Bar */}
      {!isInsideAndroid && (
        <div className="bg-[#F8FAFC] border-b border-slate-200/90 px-3 sm:px-6 py-1.5 text-[11px] text-slate-700">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            {/* Left: SIH Hackathon & Problem Statement Attribution */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-extrabold text-[#0B3B60] tracking-tight">
                Smart India Hackathon 2026
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-medium">
                Problem Statement by MoSJE (PS 26095)
              </span>
              <span className="text-slate-300 hidden md:inline">•</span>
              <span className="text-slate-500 text-[10px] hidden md:inline">
                Team InnoCoders Prototype
              </span>
            </div>

            {/* Right: Accessibility Controls, Calendar Popover, Helpline, IST Clock & Clearance */}
            <div className="flex items-center space-x-2 flex-wrap">
              {/* Skip to Main Content */}
              <a
                href="#main-portal-content"
                className="hidden sm:inline-block text-[10px] font-semibold text-slate-600 hover:text-[#0B3B60] hover:underline cursor-pointer"
              >
                {language === 'hi' ? 'मुख्य सामग्री पर जाएं' : 'Skip to Main Content'}
              </a>

              {/* National Calendar Popover (India.gov.in Feature) */}
              <div className="relative" ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="hidden sm:flex items-center space-x-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium text-[10px] cursor-pointer shadow-3xs"
                  title="National Indian Calendar (Saka Samvat) & Gregorian Calendar"
                >
                  <Calendar className="w-3 h-3 text-[#0B3B60]" />
                  <span>Saka 1948, Ashvina 06</span>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>

                {isCalendarOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-300 rounded-lg shadow-xl p-3 z-50 text-slate-900 animate-fade-in text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <div className="font-bold text-[#0B3B60] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>National Calendar of India</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(false)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          Saka Samvat (राष्ट्रीय पंचांग)
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">Saka Era 1948, Ashvina 06</div>
                        <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                          कृष्णा पक्ष, षष्ठी तिथि
                        </div>
                      </div>
                      <div className="bg-blue-50/60 p-2 rounded border border-blue-200/80">
                        <div className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">
                          Gregorian Calendar
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
                          Official Working Day • Standard Working Hours
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Size Resizer */}
              <div className="hidden sm:flex items-center space-x-1 border-x border-slate-200 px-2">
                <span className="text-slate-400 font-medium text-[10px]">A11y:</span>
                <button
                  type="button"
                  onClick={() => onSetFontSize?.('small')}
                  className={`px-1.5 py-0.2 border rounded font-bold text-[10px] cursor-pointer transition-colors ${
                    fontSizeRatio === 'small'
                      ? 'bg-[#0B3B60] text-white border-[#0B3B60]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Reduce Text Size (90%)"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => onSetFontSize?.('standard')}
                  className={`px-1.5 py-0.2 border rounded font-bold text-[10px] cursor-pointer transition-colors ${
                    fontSizeRatio === 'standard'
                      ? 'bg-[#0B3B60] text-white border-[#0B3B60]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Normal Text Size (100%)"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => onSetFontSize?.('large')}
                  className={`px-1.5 py-0.2 border rounded font-bold text-[10px] cursor-pointer transition-colors ${
                    fontSizeRatio === 'large'
                      ? 'bg-[#0B3B60] text-white border-[#0B3B60]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Enlarge Text Size (115%)"
                >
                  A+
                </button>
              </div>

              {/* High Contrast Toggle */}
              {onToggleHighContrast && (
                <button
                  type="button"
                  onClick={onToggleHighContrast}
                  className={`hidden sm:flex items-center space-x-1 px-2 py-0.5 border rounded font-bold text-[10px] cursor-pointer transition-colors ${
                    isHighContrast
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Toggle High Contrast Mode (WCAG 2.1 AAA)"
                >
                  <Contrast className="w-3 h-3 text-amber-500" />
                  <span>{isHighContrast ? 'Standard' : 'High Contrast'}</span>
                </button>
              )}

              {/* Bilingual Hindi / English Toggle */}
              {onToggleLanguage && (
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className="flex items-center space-x-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded font-bold text-[10px] cursor-pointer transition-colors shadow-2xs"
                  title="Switch Language / भाषा बदलें"
                >
                  <Globe className="w-3 h-3 text-[#0B3B60]" />
                  <span>{language === 'hi' ? 'English' : 'हिन्दी'}</span>
                </button>
              )}

              {/* SIH Team InnoCoders Detail Button */}
              {onOpenTeamDetails && (
                <button
                  type="button"
                  onClick={onOpenTeamDetails}
                  className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 hover:from-purple-800 hover:to-blue-700 text-white rounded font-bold text-[10px] cursor-pointer shadow-xs transition-all hover:scale-105"
                  title="Smart India Hackathon Team Detail • InnoCoders (Team ID: 180211)"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>SIH: InnoCoders (180211)</span>
                </button>
              )}

              {/* Live IST Timestamp */}
              <div className="hidden 2xl:flex items-center space-x-1 font-mono text-slate-700 bg-white px-2 py-0.5 border border-slate-300 rounded text-[10px]">
                <Clock className="w-3 h-3 text-[#0B3B60]" />
                <span>{istTime || 'IST'}</span>
              </div>

              {/* Clearance / Session Badge */}
              {currentUser ? (
                <span className="inline-flex items-center gap-1 font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-300 rounded text-[10px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>{currentUser.clearance?.replace(/_/g, ' ') || 'VERIFIED CLEARANCE'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium bg-slate-200/70 text-slate-800 px-2 py-0.5 border border-slate-300 rounded text-[10px]">
                  <Lock className="w-3 h-3 text-slate-600" />
                  <span>Public View</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tier 3: Main Identity & Search Bar */}
      <div className="bg-white px-3 sm:px-6 py-2.5 border-b border-slate-200/90 relative">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3 min-w-0">
          
          {/* Left: Neutral INSPIRA Logo + Title + Problem Statement by MoSJE */}
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-3 text-left group cursor-pointer focus:outline-none shrink-0"
            title="INSPIRA Prototype Homepage"
          >
            {/* Neutral Custom INSPIRA Logo */}
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              <InspiraLogo className="w-10 h-10 drop-shadow-2xs group-hover:scale-105 transition-transform" />
            </div>

            <div className="space-y-0.5 border-l border-slate-200 pl-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-[#0B3B60] tracking-tight leading-none">
                  INSPIRA
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  SIH 2026 Prototype
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-600 leading-tight">
                NGO Monitoring &amp; Inspection System
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Problem statement by MoSJE (Ministry of Social Justice and Empowerment)
              </div>
            </div>
          </button>

          {/* Center: Signature India.gov.in Global Search Bar with Integrated Category Dropdown */}
          <div className="flex-1 min-w-0 max-w-xl mx-0 xl:mx-3 w-full xl:w-auto">
            <form onSubmit={handleNavSearch} className="flex items-center w-full shadow-2xs rounded-lg overflow-hidden border-2 border-[#0B3B60] focus-within:ring-2 focus-within:ring-amber-400 bg-white transition-all">
              {/* Category Dropdown */}
              <div className="relative border-r border-slate-200 bg-slate-50 shrink-0">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="h-9.5 pl-2.5 pr-6 text-xs font-semibold text-slate-700 bg-transparent appearance-none cursor-pointer focus:outline-none"
                  title="Filter Search by Category"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SCHEMES">Schemes</option>
                  <option value="SERVICES">Services</option>
                  <option value="NGOS">NGO Directory</option>
                  <option value="ACTS">Vigilance Acts</option>
                  <option value="CIRCULARS">Circulars</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Text Input */}
              <div className="relative flex-1 min-w-0 flex items-center">
                <input
                  type="text"
                  value={navSearchQuery}
                  onChange={(e) => setNavSearchQuery(e.target.value)}
                  placeholder="Search the Portal (e.g. Nasha Mukti, GFR Rule 14)..."
                  className="w-full h-9.5 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none bg-white min-w-0"
                />
                {navSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setNavSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="h-9.5 px-3.5 bg-[#0B3B60] hover:bg-[#07253D] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Execute Search on National Portal"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            {/* Trending Quick Search Keywords (India.gov.in Pattern) */}
            <div className="hidden md:flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 overflow-x-auto no-scrollbar">
              <span className="font-semibold text-slate-700 shrink-0">Popular:</span>
              <button
                type="button"
                onClick={() => handleTrendingClick('GFR Rule 14')}
                className="hover:text-[#0B3B60] hover:underline cursor-pointer shrink-0 text-slate-600"
              >
                #GFR Rule 14
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleTrendingClick('Nasha Mukti')}
                className="hover:text-[#0B3B60] hover:underline cursor-pointer shrink-0 text-slate-600"
              >
                #Nasha Mukti
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleTrendingClick('DARPAN')}
                className="hover:text-[#0B3B60] hover:underline cursor-pointer shrink-0 text-slate-600"
              >
                #DARPAN Verification
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleTrendingClick('Geofence')}
                className="hover:text-[#0B3B60] hover:underline cursor-pointer shrink-0 text-slate-600"
              >
                #150m Geofence
              </button>
            </div>
          </div>

          {/* Right: Official Profile & Clean Institutional Authentication */}
          <div className="flex items-center gap-2 shrink-0 justify-between xl:justify-end w-full xl:w-auto">
            {/* Grievance Notification Counter */}
            {currentUser && unreadComplaintsCount > 0 && currentView === 'DASHBOARD' && (
              <div
                title={`${unreadComplaintsCount} Pending Grievances requiring administrative review`}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold rounded-md shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5 text-rose-600" />
                <span>{unreadComplaintsCount}</span>
              </div>
            )}

            {/* Unauthenticated: Official Login & DARPAN Registration Buttons (ALWAYS 100% VISIBLE!) */}
            {!currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenSignUp}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-md text-xs font-bold transition-colors cursor-pointer border border-slate-300 shadow-2xs whitespace-nowrap"
                  title="Non-Profit Organization Registration on DARPAN Portal"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>NGO Registration</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0B3B60] hover:bg-[#07253D] text-white rounded-md text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap border border-[#0B3B60]"
                  title="Sign in with your role account"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Login</span>
                </button>
              </div>
            ) : (
              /* Authenticated Official Profile Chip */
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md text-xs text-left cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
                >
                  <div className="relative">
                    <UserAvatar
                      name={currentUser.name}
                      role={currentUser.role}
                      avatarUrl={currentUser.avatarUrl}
                      size="xs"
                      showBadge={false}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight max-w-[150px] truncate group-hover:text-[#0B3B60] transition-colors">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium truncate flex items-center gap-1">
                      <span>{currentUser.designation?.split('•')[0] || currentUser.role}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 transition-transform group-hover:translate-y-0.5" />
                </button>

                {/* Authenticated User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-84 bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl shadow-2xl p-3 z-50 text-slate-900 animate-fade-in divide-y divide-slate-100">
                    <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 rounded-xl mb-2.5 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <UserAvatar
                            name={currentUser.name}
                            role={currentUser.role}
                            avatarUrl={currentUser.avatarUrl}
                            size="lg"
                            showBadge={true}
                          />
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Session Active"></span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate mt-0.5 font-mono">{currentUser.email}</p>
                          <p className="text-[10px] text-[#0B3B60] font-bold truncate mt-0.5">{currentUser.designation}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                        {getRoleBadge(currentUser.role)}
                        {currentUser.badgeNumber && (
                          <span className="text-[10px] text-slate-700 font-mono bg-white border border-slate-300 px-2 py-0.5 rounded shadow-2xs">
                            ID: {currentUser.badgeNumber}
                          </span>
                        )}
                        {currentUser.clearance && (
                          <span className="text-[9px] text-amber-900 font-semibold bg-amber-50 border border-amber-300/80 px-1.5 py-0.5 rounded">
                            {currentUser.clearance.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 space-y-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigateHome();
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[#0B3B60] rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Home className="w-3.5 h-3.5 text-slate-500" />
                        <span>Return to Public Portal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenInspectorLogin();
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-blue-700 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                        <span>Switch to Field Inspector Terminal</span>
                      </button>

                      {/* Delegated Authority Switcher Submenu */}
                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsDelegationSubmenuOpen(!isDelegationSubmenuOpen)}
                          className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-md flex items-center justify-between text-xs cursor-pointer font-medium"
                        >
                          <span className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>Switch Delegated Authority</span>
                          </span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDelegationSubmenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDelegationSubmenuOpen && (
                          <div className="mt-1 p-1 bg-slate-50 border border-slate-200 rounded-md max-h-52 overflow-y-auto space-y-1">
                            {allUsers.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  onSwitchUser(u);
                                  setIsUserMenuOpen(false);
                                  setIsDelegationSubmenuOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                                  u.id === currentUser.id
                                    ? 'bg-[#0B3B60] text-white font-bold'
                                    : 'hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate max-w-[210px]">
                                  <UserAvatar
                                    name={u.name}
                                    role={u.role}
                                    avatarUrl={u.avatarUrl}
                                    size="xs"
                                    showBadge={false}
                                  />
                                  <span className="truncate">{u.name}</span>
                                </span>
                                <span className="text-[9px] font-mono uppercase opacity-75 shrink-0">{u.role}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-md flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1 font-bold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Log Out / Revoke Session Token</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier 4: Primary Government Navigation Bar (Deep Navy Blue #0B3B60 - India.gov.in Style) */}
      <nav className="bg-[#0B3B60] text-white px-3 sm:px-6 py-1 shadow-sm border-t border-[#104875]" ref={megaMenuRef}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto text-xs font-semibold py-0.5 no-scrollbar">
            
            {/* 1. Portal Home */}
            <button
              type="button"
              onClick={onNavigateHome}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'HERO'
                  ? 'bg-white/20 text-white font-bold border-b-2 border-amber-400'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'मुख्य पृष्ठ' : 'Portal Home'}</span>
            </button>

            {/* 2. Topics & Welfare Sectors (Mega Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveMegaMenu(activeMegaMenu === 'TOPICS' ? null : 'TOPICS')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${
                  activeMegaMenu === 'TOPICS' ? 'bg-white/20 text-amber-300 font-bold' : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Topics &amp; Sectors</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {activeMegaMenu === 'TOPICS' && (
                <div className="absolute left-0 mt-1 w-72 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 p-2 z-50 animate-fade-in text-xs font-normal">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Welfare Sectors Monitored
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      handleTrendingClick('De-addiction');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <span>💊 De-addiction Centers (NAPDDR)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      handleTrendingClick('Disability');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <span>♿ Disability Welfare &amp; Rehab</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      handleTrendingClick('Old Age');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <span>👵 Senior Citizen Homes (APY)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      handleTrendingClick('Child Welfare');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <span>👶 Child Care &amp; Protection</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      handleTrendingClick('Transgender');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <span>⚧️ Garima Greh (Transgender Shelter)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}
            </div>

            {/* 3. Services & Grievances (Mega Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveMegaMenu(activeMegaMenu === 'SERVICES' ? null : 'SERVICES')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${
                  activeMegaMenu === 'SERVICES' ? 'bg-white/20 text-amber-300 font-bold' : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Services &amp; Grievances</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {activeMegaMenu === 'SERVICES' && (
                <div className="absolute left-0 mt-1 w-80 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 p-2 z-50 animate-fade-in text-xs font-normal">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Citizen &amp; Official Services
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      onNavigateDashboard('FILE_COMPLAINT');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-amber-800 rounded flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Lodge Whistleblower Grievance</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Anonymous reporting under CVC norms</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      onNavigateDashboard('TRACK_COMPLAINT');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0B3B60]" />
                        <span>Track Grievance Status</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Search with 10-digit tracking token</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      onOpenSignUp();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>NGO-DARPAN Registration</span>
                      </div>
                      <div className="text-[10px] text-slate-500">New registration under NITI Aayog</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      if (onNavigateWorkerAttendance) onNavigateWorkerAttendance();
                      else onNavigateDashboard('ATTENDANCE');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Dual-Camera Biometric Attendance</span>
                      </div>
                      <div className="text-[10px] text-slate-500">68-point AI anti-spoof check-in</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}
            </div>

            {/* 4. Schemes & Guidelines (Mega Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveMegaMenu(activeMegaMenu === 'SCHEMES' ? null : 'SCHEMES')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${
                  activeMegaMenu === 'SCHEMES' ? 'bg-white/20 text-amber-300 font-bold' : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Schemes &amp; Rules</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {activeMegaMenu === 'SCHEMES' && (
                <div className="absolute left-0 mt-1 w-80 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 p-2 z-50 animate-fade-in text-xs font-normal">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Statutory Framework &amp; Schemes
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      onNavigateHome();
                      setTimeout(() => {
                        document.getElementById('statutory-documents-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">Rule 14 of GFR, 2017</div>
                      <div className="text-[10px] text-slate-500">Mandatory 150m perimeter on-site verification</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      handleTrendingClick('NAPDDR');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">NAPDDR Scheme Guidelines</div>
                      <div className="text-[10px] text-slate-500">Grant-in-Aid for Addiction Treatment Facilities</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMegaMenu(null);
                      handleTrendingClick('Atal Vayo Abhyuday');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-[#0B3B60] rounded flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">Atal Vayo Abhyuday Yojana (AVYAY)</div>
                      <div className="text-[10px] text-slate-500">Senior Citizen Old Age Homes &amp; Respite Care</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}
            </div>

            {/* 5. Public NGO Directory (DARPAN) */}
            <button
              type="button"
              onClick={() => {
                onNavigateHome();
                setTimeout(() => {
                  document.getElementById('public-ngo-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>NGO Directory (DARPAN)</span>
            </button>

            {/* Unauthenticated Citizen Direct Track Grievance Status button */}
            {!currentUser && (
              <button
                type="button"
                onClick={() => onNavigateDashboard('TRACK_COMPLAINT')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer"
                title="Search and track resolution of submitted grievances"
              >
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Track Grievance</span>
              </button>
            )}

            {/* 6. Field Vigilance Terminal / Official Workspace Tab */}
            <button
              type="button"
              onClick={() => onNavigateDashboard()}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'DASHBOARD'
                  ? 'bg-white/20 text-white font-bold border-b-2 border-amber-400'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>
                {currentUser
                  ? `${currentUser.role === 'ADMIN' ? 'Directorate Desk' : currentUser.role === 'OFFICER' ? 'Field Terminal' : currentUser.role === 'NGO' ? 'NGO Portal' : currentUser.role === 'NGO_WORKER' ? 'Staff Attendance' : 'Citizen Desk'}`
                  : 'Official Dashboard'}
              </span>
            </button>

            {/* Role-Specific Direct Actions when Authenticated */}
            {currentUser?.role === 'ADMIN' && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('NGOS')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>GIS Telemetry</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('INSPECTIONS')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-sky-300" />
                  <span>Dossiers</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('SANCTIONS')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                  <span>Sanctions</span>
                </button>
              </>
            )}

            {currentUser?.role === 'OFFICER' && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('INSTITUTES')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-white bg-white/10 hover:bg-white/20 transition-all whitespace-nowrap cursor-pointer text-xs font-semibold"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-300" />
                  <span>Institutes / NGOs</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('LIVE_AUDIT')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-amber-300 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>150m Geofence</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('ASSIGNED_TASKS')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-300" />
                  <span>Assigned Audits</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('CCTV_SURVEILLANCE')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-emerald-300 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CCTV Grid</span>
                </button>
              </>
            )}

            {currentUser?.role === 'NGO' && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('NOTICES')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ministry Notices</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('DOCUMENTS')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Compliance Certificate</span>
                </button>
              </>
            )}

            {currentUser?.role === 'NGO_WORKER' && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateWorkerAttendance) onNavigateWorkerAttendance();
                  else onNavigateDashboard('ATTENDANCE');
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer text-amber-200 hover:text-white hover:bg-white/10"
                title="Dual Camera Facial Biometric Staff Attendance Terminal"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'hi' ? 'कर्मचारी उपस्थिति' : 'Staff Attendance'}</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-400 text-slate-950 rounded">AI</span>
              </button>
            )}

            {currentUser?.role === 'USER' && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('FILE_COMPLAINT')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-amber-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>File Complaint</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateDashboard('TRACK_COMPLAINT')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer text-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-sky-300" />
                  <span>Track Token</span>
                </button>
              </>
            )}
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {onOpenTeamDetails && (
              <button
                type="button"
                onClick={onOpenTeamDetails}
                className="flex items-center space-x-1.5 px-3 py-1 rounded bg-purple-700/80 hover:bg-purple-600 text-amber-300 hover:text-white text-xs font-bold border border-purple-400/40 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                title="Smart India Hackathon Team Detail • InnoCoders (Team ID: 180211)"
              >
                <Users className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Team InnoCoders</span>
                <span className="sm:hidden">Team</span>
              </button>
            )}

            {onToggleMobileFrame && (
              <button
                type="button"
                onClick={onToggleMobileFrame}
                className="flex items-center space-x-1.5 px-3 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                title="Launch Android Mobile Inspection Device Simulator"
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-950" />
                <span>Android App Mode</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
