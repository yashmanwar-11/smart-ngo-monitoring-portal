import React, { useState } from 'react';
import { X, Building2, MapPin, Phone, Mail, Globe, Users, Calendar, Award, ShieldCheck, Check } from 'lucide-react';
import { NGO } from '../../types';

interface EditInstituteModalProps {
  isOpen: boolean;
  institute: NGO;
  onClose: () => void;
  onSave: (updatedNgo: NGO) => void;
}

export const EditInstituteModal: React.FC<EditInstituteModalProps> = ({
  isOpen,
  institute,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: institute.name,
    sector: institute.sector || 'Education',
    scheme: institute.scheme || 'Education Support Scheme',
    regNumber: institute.regNumber,
    foundingYear: institute.foundingYear || 2018,
    beneficiaries: institute.activeBeneficiaryCount || institute.beneficiaryCapacity || 320,
    presidentName: institute.presidentName || '',
    phone: institute.contactPhone || '',
    email: institute.contactEmail || '',
    website: institute.website || '',
    address: institute.address,
    district: institute.district,
    state: institute.state,
    complianceScore: institute.complianceScore || 95,
    status: institute.status,
    description: institute.description || '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: NGO = {
      ...institute,
      name: formData.name.trim(),
      sector: formData.sector,
      scheme: formData.scheme.trim(),
      regNumber: formData.regNumber.trim(),
      foundingYear: Number(formData.foundingYear),
      activeBeneficiaryCount: Number(formData.beneficiaries),
      presidentName: formData.presidentName.trim(),
      contactPhone: formData.phone.trim(),
      contactEmail: formData.email.trim(),
      website: formData.website.trim(),
      address: formData.address.trim(),
      district: formData.district.trim(),
      state: formData.state.trim(),
      complianceScore: Number(formData.complianceScore),
      status: formData.status as any,
      description: formData.description.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        {/* Tricolor Accent */}
        <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">Edit Institute Information</h3>
              <p className="text-xs text-blue-200 font-mono">{institute.regNumber}</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Institute Name */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Institute / NGO Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              />
            </div>

            {/* Scheme Name */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Grant / Scheme Name</label>
              <input
                type="text"
                value={formData.scheme}
                onChange={(e) => setFormData({ ...formData, scheme: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Sector */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Sector Category</label>
              <select
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
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

            {/* Registration Number */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Registration Number</label>
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
                value={formData.foundingYear}
                onChange={(e) => setFormData({ ...formData, foundingYear: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Beneficiaries */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Beneficiaries (Students/Clients)</label>
              <input
                type="number"
                value={formData.beneficiaries}
                onChange={(e) => setFormData({ ...formData, beneficiaries: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Managed By */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Managed By / Trustee</label>
              <input
                type="text"
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
              <label className="block font-bold text-slate-800 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Website */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Registered Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            {/* Mission Description */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Description / Mandate</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>
          </div>

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
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
