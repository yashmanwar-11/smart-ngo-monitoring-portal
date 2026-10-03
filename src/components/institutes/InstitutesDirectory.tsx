import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Building,
  GraduationCap,
  Heart,
  Award,
  Sparkles,
  MapPin,
  Users,
  ChevronRight,
  Bell,
  ChevronDown,
  X,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { NGO, User } from '../../types';
import { InspiraLogo } from '../InspiraLogo';
import { AddInstituteModal } from './AddInstituteModal';

interface InstitutesDirectoryProps {
  ngos: NGO[];
  currentOfficer: User;
  onSelectInstitute: (ngo: NGO) => void;
  onAddNewInstitute: (newNgo: NGO) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const InstitutesDirectory: React.FC<InstitutesDirectoryProps> = ({
  ngos,
  currentOfficer,
  onSelectInstitute,
  onAddNewInstitute,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'LATEST' | 'SCORE' | 'NAME' | 'BENEFICIARIES'>('LATEST');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Advanced filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Format date helper
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

  // Distinct districts
  const districts = useMemo(() => {
    const list = Array.from(new Set(ngos.map((n) => n.district).filter(Boolean)));
    return list.sort();
  }, [ngos]);

  // Sector categories matching mockup
  const sectorTabs = [
    'All',
    'Education',
    'Skill Development',
    'Divyang Care',
    'Women Empowerment',
    'Healthcare',
    'Child Welfare',
  ];

  // Helper for Category Icon & Badge Colors
  const renderCategoryIcon = (sector?: string) => {
    switch (sector) {
      case 'Education':
        return (
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Building className="w-6 h-6 text-red-600" />
          </div>
        );
      case 'Divyang Care':
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Heart className="w-6 h-6 text-blue-600" />
          </div>
        );
      case 'Skill Development':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Award className="w-6 h-6 text-emerald-600" />
          </div>
        );
      case 'Women Empowerment':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-rose-600" />
          </div>
        );
      case 'Healthcare':
        return (
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Heart className="w-6 h-6 text-teal-600" />
          </div>
        );
      case 'Child Welfare':
        return (
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-purple-600" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Building className="w-6 h-6 text-indigo-600" />
          </div>
        );
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (status?: string, complianceScore?: number) => {
    if (status === 'FLAGGED_VIOLATION') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Non-Compliant
        </span>
      );
    }
    if (status === 'UNDER_INSPECTION') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Under Review
        </span>
      );
    }
    if (complianceScore && complianceScore >= 95) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Compliant
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Active
      </span>
    );
  };

  // Filter & Search Logic
  const filteredNgos = useMemo(() => {
    return ngos.filter((ngo) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ngo.name.toLowerCase().includes(q);
        const matchDistrict = ngo.district.toLowerCase().includes(q);
        const matchReg = ngo.regNumber.toLowerCase().includes(q);
        const matchScheme = (ngo.scheme || '').toLowerCase().includes(q);
        if (!matchName && !matchDistrict && !matchReg && !matchScheme) return false;
      }

      // Sector category
      if (selectedSector !== 'All') {
        if (ngo.sector !== selectedSector) return false;
      }

      // District filter
      if (selectedDistrict !== 'ALL') {
        if (ngo.district !== selectedDistrict) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'COMPLIANT' && (ngo.complianceScore || 0) < 95) return false;
        if (selectedStatus === 'UNDER_REVIEW' && ngo.status !== 'UNDER_INSPECTION') return false;
        if (selectedStatus === 'NON_COMPLIANT' && ngo.status !== 'FLAGGED_VIOLATION') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'SCORE') {
        return (b.complianceScore || 0) - (a.complianceScore || 0);
      }
      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'BENEFICIARIES') {
        return (b.activeBeneficiaryCount || b.beneficiaryCapacity || 0) - (a.activeBeneficiaryCount || a.beneficiaryCapacity || 0);
      }
      // Default: Latest inspection date or founding year
      return (b.lastInspectionDate || '').localeCompare(a.lastInspectionDate || '');
    });
  }, [ngos, searchQuery, selectedSector, selectedDistrict, selectedStatus, sortBy]);

  return (
    <div className="space-y-4 animate-fade-in bg-slate-50 min-h-screen pb-12">
      {/* 1. Official Government Header matching mockup */}
      <div className="bg-white px-4 py-3 sm:py-3.5 border-b border-slate-200 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <InspiraLogo className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              INSPIRA Institute Registry
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">Problem statement by MoSJE (PS 26095)</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onShowToast?.('3 pending surveillance alerts for registered institutes', 'info')}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                3
              </span>
            </button>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {currentOfficer.name ? currentOfficer.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'RS'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {currentOfficer.name || 'Rajesh Sharma'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {currentOfficer.designation || 'Joint Secretary'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>
        </div>
      </div>

      {/* 2. Page Title & Action Bar */}
      <div className="mx-3 sm:mx-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Institutes / NGOs</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View and manage all registered institutes and organizations
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Institute</span>
        </button>
      </div>

      {/* 3. Search Bar & Filter Button */}
      <div className="mx-3 sm:mx-6 flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, district or registration number..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            isFilterOpen || selectedDistrict !== 'ALL' || selectedStatus !== 'ALL'
              ? 'bg-blue-50 text-blue-700 border-blue-300'
              : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Filter Drawer / Popover */}
      {isFilterOpen && (
        <div className="mx-3 sm:mx-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800">Filter Directory Records</span>
            <button
              type="button"
              onClick={() => {
                setSelectedDistrict('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-blue-700 hover:underline font-semibold text-[11px]"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Filter by District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="ALL">All Districts ({districts.length})</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Compliance Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLIANT">Compliant (&gt;95%)</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="NON_COMPLIANT">Non-Compliant / Flagged</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sector Category Horizontal Pills matching mockup */}
      <div className="mx-3 sm:mx-6 border-b border-slate-200 flex items-center space-x-6 text-xs font-bold overflow-x-auto no-scrollbar">
        {sectorTabs.map((sector) => (
          <button
            key={sector}
            type="button"
            onClick={() => setSelectedSector(sector)}
            className={`pb-2.5 whitespace-nowrap cursor-pointer transition-all border-b-2 ${
              selectedSector === sector
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* 5. Count & Sort Row matching mockup */}
      <div className="mx-3 sm:mx-6 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>{filteredNgos.length} Institutes / NGOs</span>

        <div className="flex items-center space-x-1.5">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent font-bold text-slate-800 border-none outline-none cursor-pointer focus:ring-0 text-xs pr-1"
          >
            <option value="LATEST">Latest</option>
            <option value="SCORE">Compliance Score</option>
            <option value="NAME">Name (A-Z)</option>
            <option value="BENEFICIARIES">Beneficiaries</option>
          </select>
        </div>
      </div>

      {/* 6. List of Institute Cards matching mockup */}
      <div className="mx-3 sm:mx-6 space-y-2.5">
        {filteredNgos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Building className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No institutes found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or clear the filters.
            </p>
          </div>
        ) : (
          filteredNgos.map((ngo) => (
            <div
              key={ngo.id}
              onClick={() => onSelectInstitute(ngo)}
              className="group bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4"
            >
              {/* Left Column: Icon + Information */}
              <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                {renderCategoryIcon(ngo.sector)}

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate group-hover:text-blue-700 transition-colors">
                    {ngo.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {ngo.scheme || 'Education Support Scheme'}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ngo.address.split(',')[0]}, {ngo.district}, {ngo.state}</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ngo.activeBeneficiaryCount || ngo.beneficiaryCapacity || 320} beneficiaries</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Status + Last Inspection + Chevron */}
              <div className="flex items-center space-x-3 sm:space-x-4 shrink-0 text-right">
                <div className="space-y-1 text-right">
                  <div className="flex justify-end">
                    {renderStatusBadge(ngo.status, ngo.complianceScore)}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 block">Last Inspection</span>
                    <span className="text-xs font-bold text-slate-800">
                      {formattedDate(ngo.lastInspectionDate)}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Institute Modal */}
      {isAddModalOpen && (
        <AddInstituteModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddInstitute={(newNgo) => {
            onAddNewInstitute(newNgo);
            onShowToast?.(`✓ Successfully registered institute: ${newNgo.name}`, 'success');
          }}
        />
      )}
    </div>
  );
};
