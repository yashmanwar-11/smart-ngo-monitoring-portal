import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Command,
  X,
  Building2,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  AlertTriangle,
  FileCheck2,
  Home,
  Smartphone,
  Contrast,
  Download,
  ArrowRight,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  Shuffle,
  Video
} from 'lucide-react';
import { NGO } from '../types';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'PORTALS' | 'ACTIONS' | 'NGOS';
  icon: React.ReactNode;
  badge?: string;
  action: () => void;
}

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  ngos: NGO[];
  onSelectNgo: (ngo: NGO) => void;
  onNavigateView: (view: 'HERO' | 'DASHBOARD' | 'WORKER_ATTENDANCE', role?: string, targetTab?: string) => void;
  onOpenRandomVc?: () => void;
  onOpenRandomDutyModal?: () => void;
  onToggleHighContrast: () => void;
  onToggleAndroidSimulator: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
  onOpenTeamDetails?: () => void;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  ngos,
  onSelectNgo,
  onNavigateView,
  onOpenRandomVc,
  onOpenRandomDutyModal,
  onToggleHighContrast,
  onToggleAndroidSimulator,
  onShowToast,
  onOpenTeamDetails,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static Portals & Actions
  const baseItems: CommandItem[] = useMemo(() => [
    {
      id: 'portal-home',
      title: 'Public Portal Homepage',
      subtitle: 'National NGO directory, verification search & welfare scheme statistics',
      category: 'PORTALS',
      icon: <Home className="w-4 h-4 text-blue-500" />,
      action: () => {
        onNavigateView('HERO');
        onClose();
      },
    },
    {
      id: 'portal-admin',
      title: 'Directorate General (IAS Admin Portal)',
      subtitle: 'Executive risk matrix, regulatory scrutiny & inspection task dispatches',
      category: 'PORTALS',
      badge: 'LEVEL 5',
      icon: <Shield className="w-4 h-4 text-purple-500" />,
      action: () => {
        onNavigateView('DASHBOARD', 'ADMIN');
        onClose();
      },
    },
    {
      id: 'portal-officer',
      title: 'Vigilance Field Inspector Portal',
      subtitle: '150m geofence radar, live inspection checklists & CCTV telemetry',
      category: 'PORTALS',
      badge: 'LEVEL 3',
      icon: <FileCheck2 className="w-4 h-4 text-amber-500" />,
      action: () => {
        onNavigateView('DASHBOARD', 'OFFICER');
        onClose();
      },
    },
    {
      id: 'portal-worker',
      title: 'Field Staff Biometric Attendance Desk',
      subtitle: 'Dual-photo geotagged punch-in, active duty stopwatch & timesheets',
      category: 'PORTALS',
      badge: 'BIOMETRICS',
      icon: <UserCheck className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onNavigateView('WORKER_ATTENDANCE');
        onClose();
      },
    },
    {
      id: 'portal-citizen',
      title: 'Citizen & Whistleblower Grievance Desk',
      subtitle: 'File anonymous malpractice reports & track statutory resolution tokens',
      category: 'PORTALS',
      badge: 'PUBLIC',
      icon: <AlertTriangle className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onNavigateView('DASHBOARD', 'USER');
        onClose();
      },
    },
    {
      id: 'portal-ngo',
      title: 'Registered NGO Management Portal',
      subtitle: '100-point statutory compliance scorecard, staff roster & filings',
      category: 'PORTALS',
      badge: 'LEVEL 2',
      icon: <Building2 className="w-4 h-4 text-cyan-500" />,
      action: () => {
        onNavigateView('DASHBOARD', 'NGO');
        onClose();
      },
    },
    {
      id: 'action-sih-team',
      title: 'Smart India Hackathon: Team InnoCoders Detail',
      subtitle: "Team ID: 180211 • Leader: Monika Warkad • Mauli Group of Institution's COET, Shegaon",
      category: 'ACTIONS',
      badge: 'SIH 2026',
      icon: <Users className="w-4 h-4 text-purple-400" />,
      action: () => {
        onOpenTeamDetails?.();
        onClose();
      },
    },
    {
      id: 'action-dosje-vc',
      title: 'Initiate Surprise Video Conference (VC)',
      subtitle: 'Instant encrypted call with Incharge, Staff, or Beneficiary under Rule 14',
      category: 'ACTIONS',
      badge: 'SURPRISE VC',
      icon: <Video className="w-4 h-4 text-purple-400" />,
      action: () => {
        onOpenRandomVc?.();
        onClose();
      },
    },
    {
      id: 'action-dosje-duty',
      title: 'DoSJE AI Double-Blind Duty Allocator',
      subtitle: 'Algorithmic random duty assignment with zero-collusion T-4h lock',
      category: 'ACTIONS',
      badge: 'ANTI-COLLUSION',
      icon: <Shuffle className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onOpenRandomDutyModal?.();
        onClose();
      },
    },
    {
      id: 'action-dosje-analytics',
      title: 'DoSJE Statutory Scheme Surveillance',
      subtitle: 'NAPDDR, AVYAY, DDRS, PM-AJAY & SMILE pattern analysis & live anomalies',
      category: 'ACTIONS',
      badge: 'ANALYTICS',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateView('DASHBOARD', 'ADMIN', 'DOSJE_ANALYTICS');
        onClose();
      },
    },
    {
      id: 'action-android',
      title: 'Launch Android App Simulator Studio',
      subtitle: 'Simulate Google Pixel 8 Pro, Galaxy S24 Ultra & Rugged Field Tablets',
      category: 'ACTIONS',
      badge: 'MOBILE',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onToggleAndroidSimulator();
        onClose();
      },
    },
    {
      id: 'action-contrast',
      title: 'Toggle High-Contrast Accessibility Theme',
      subtitle: 'Switch WCAG 2.1 AAA high-contrast visual display for field sunlight',
      category: 'ACTIONS',
      badge: 'GIGW 3.0',
      icon: <Contrast className="w-4 h-4 text-amber-400" />,
      action: () => {
        onToggleHighContrast();
        onShowToast('✓ Visual display contrast adjusted for accessibility.', 'info');
        onClose();
      },
    },
  ], [onNavigateView, onClose, onOpenRandomVc, onOpenRandomDutyModal, onToggleAndroidSimulator, onToggleHighContrast, onShowToast]);

  // Dynamic filtered list (Base items + matched NGOs)
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchedBase = q
      ? baseItems.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
      : baseItems;

    let matchedNgos: CommandItem[] = [];
    if (q) {
      matchedNgos = ngos
        .filter(
          (ngo) =>
            ngo.name.toLowerCase().includes(q) ||
            ngo.darpanId.toLowerCase().includes(q) ||
            ngo.state.toLowerCase().includes(q) ||
            ngo.sectors.some((s) => s.toLowerCase().includes(q))
        )
        .slice(0, 8)
        .map((ngo) => ({
          id: `ngo-${ngo.id}`,
          title: ngo.name,
          subtitle: `${ngo.darpanId} • ${ngo.district}, ${ngo.state} • ${ngo.sectors.join(', ')}`,
          category: 'NGOS',
          badge: ngo.status === 'FLAGGED_VIOLATION' ? 'FLAGGED' : 'VERIFIED',
          icon: <Building2 className="w-4 h-4 text-blue-600" />,
          action: () => {
            onSelectNgo(ngo);
            onClose();
          },
        }));
    }

    return [...matchedBase, ...matchedNgos];
  }, [query, baseItems, ngos, onSelectNgo, onClose]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* National 3px Tricolor Header Strip */}
        <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search portal, NGOs (e.g. MH/2026, Akshaya), dispatches, tools..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 font-mono text-[10px] font-bold">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 max-h-96">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No matching portal or NGO found</p>
              <p className="text-xs text-slate-400">Try searching by DARPAN ID, State (e.g. Maharashtra), or role.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 text-blue-950 border border-blue-200/80 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-white border-blue-200 shadow-2xs'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              item.badge === 'FLAGGED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.badge === 'LEVEL 5'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : item.badge === 'LEVEL 3'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'translate-x-0.5 text-blue-600 opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Guide */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px] font-bold shadow-3xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px] font-bold shadow-3xs">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[9px] font-bold shadow-3xs">↵</kbd>
              <span>Select</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <span>National NGO Monitoring Portal • GIGW 3.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
