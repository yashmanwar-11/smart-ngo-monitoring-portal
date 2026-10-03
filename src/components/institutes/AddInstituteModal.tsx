import React, { useState } from 'react';
import { X, Building2, MapPin, Phone, Mail, Globe, Users, Calendar, Award, ShieldCheck, Check } from 'lucide-react';
import { NGO } from '../../types';
import { ngoApi } from '../../services/apiClient';

interface AddInstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInstitute: (newNgo: NGO) => void;
}

export const AddInstituteModal: React.FC<AddInstituteModalProps> = ({
  isOpen,
  onClose,
  onAddInstitute,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sector: 'Education',
    scheme: 'Education Support Scheme',
    regNumber: `MH/NGO/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    foundingYear: 2018,
    beneficiaries: 250,
    presidentName: '',
    phone: '+91 ',
    email: '',
    website: 'https://',
    address: '',
    district: 'Nagpur',
    state: 'Maharashtra',
    lat: 21.1458,
    lng: 79.0882,
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) return;

    const newNgo: NGO = {
      id: `ngo_inst_${Date.now()}`,
      name: formData.name.trim(),
      regNumber: formData.regNumber.trim(),
      sector: formData.sector,
      scheme: formData.scheme,
      dosjeScheme: formData.scheme,
      beneficiaryCapacity: Number(formData.beneficiaries) + 100,
      activeBeneficiaryCount: Number(formData.beneficiaries),
      status: 'REGISTERED',
      foundingYear: Number(formData.foundingYear) || new Date().getFullYear(),
      presidentName: formData.presidentName.trim() || 'Governing Body Trust',
      contactEmail: formData.email.trim() || `contact@${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
      contactPhone: formData.phone.trim() || '+91 98765 43210',
      website: formData.website.trim(),
      address: formData.address.trim(),
      district: formData.district,
      state: formData.state,
      coordinates: {
        lat: Number(formData.lat) || 21.1458,
        lng: Number(formData.lng) || 79.0882,
      },
      fcraStatus: 'APPROVED',
      annualBudgetInr: 35000000,
      lastInspectionDate: new Date().toISOString().split('T')[0],
      complianceScore: 92,
      reportedComplaintsCount: 0,
      description: formData.description.trim() || `${formData.name} is dedicated to welfare and social service under ${formData.scheme}.`,
      documents: {
        panCardNumber: `AAAT${Math.floor(1000 + Math.random() * 9000)}M`,
        darpanId: `MH/${formData.foundingYear}/${Math.floor(100000 + Math.random() * 900000)}`,
      },
      photos: [],
    };

    try {
      await ngoApi.create(newNgo);
    } catch (err) {
      console.warn('Institute saved to local state:', err);
    }

    onAddInstitute(newNgo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        {/* Neutral Top Accent Line */}
        <div className="h-1 bg-[#0B3B60]"></div>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">Add New Institute / NGO</h3>
              <p className="text-xs text-blue-200">INSPIRA Institute Registry • SIH 2026 Prototype</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Institute Name */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                Institute / NGO Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hope Foundation, Jan Seva Sanstha"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800"
              />
            </div>

            {/* Sector */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Sector Category</label>
              <select
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="Education">Education</option>
                <option value="Skill Development">Skill Development</option>
                <option value="Divyang Care">Divyang Care</option>
                <option value="Women Empowerment">Women Empowerment</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Child Welfare">Child Welfare</option>
                <option value="Rural Development">Rural Development</option>
              </select>
            </div>

            {/* Scheme Name */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Grant / Scheme Name</label>
              <input
                type="text"
                placeholder="e.g. Education Support Scheme, DDRS"
                value={formData.scheme}
                onChange={(e) => setFormData({ ...formData, scheme: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Registration / DARPAN ID</label>
              <input
                type="text"
                value={formData.regNumber}
                onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800"
              />
            </div>

            {/* Establishment Year */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Establishment Year</label>
              <input
                type="number"
                min="1940"
                max="2026"
                value={formData.foundingYear}
                onChange={(e) => setFormData({ ...formData, foundingYear: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Beneficiaries Count */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Registered Beneficiaries Count</label>
              <input
                type="number"
                min="1"
                value={formData.beneficiaries}
                onChange={(e) => setFormData({ ...formData, beneficiaries: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* President / Trust Name */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Managed By / President</label>
              <input
                type="text"
                placeholder="Trustee or Executive Director"
                value={formData.presidentName}
                onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* District */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">District</label>
              <input
                type="text"
                placeholder="e.g. Nagpur, Pune, Akola"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* State */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Official Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Official Email</label>
              <input
                type="email"
                placeholder="info@institute.org"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Full Address */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                Full Physical Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Door/Plot No., Street, Landmark, Pin Code"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Mission / Scope of Work</label>
              <textarea
                rows={2}
                placeholder="Brief summary of activities and target beneficiary group"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Register Institute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
