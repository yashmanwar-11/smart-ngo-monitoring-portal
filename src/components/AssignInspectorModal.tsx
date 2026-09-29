import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, ShieldAlert, UserCheck } from 'lucide-react';
import { NGO, User, InspectionRecord } from '../types';

interface AssignInspectorModalProps {
  ngos: NGO[];
  officers: User[];
  preSelectedNgoId?: string;
  onAssign: (newInspection: InspectionRecord) => void;
  onClose: () => void;
}

export const AssignInspectorModal: React.FC<AssignInspectorModalProps> = ({
  ngos,
  officers,
  preSelectedNgoId,
  onAssign,
  onClose,
}) => {
  const [selectedNgoId, setSelectedNgoId] = useState(preSelectedNgoId || ngos[0]?.id || '');
  const [selectedOfficerId, setSelectedOfficerId] = useState(officers[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('11:00 AM');
  const [priority, setPriority] = useState<InspectionRecord['priority']>('ROUTINE');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNgo = ngos.find((n) => n.id === selectedNgoId);
    const targetOfficer = officers.find((o) => o.id === selectedOfficerId);

    if (!targetNgo || !targetOfficer) return;

    const newRecord: InspectionRecord = {
      id: `INSP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      ngoId: targetNgo.id,
      ngoName: targetNgo.name,
      officerId: targetOfficer.id,
      officerName: targetOfficer.name,
      officerBadge: targetOfficer.badgeNumber || 'INSP-FLD',
      scheduledDate,
      scheduledTime,
      status: 'SCHEDULED',
      priority,
      findingsSummary: notes ? `Special Directive: ${notes}` : undefined,
    };

    onAssign(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200/80">
        {/* Modern Google-Style Gradient Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400"></div>

        {/* Official Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white border-b border-blue-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                Statutory Vigilance Order
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Dispatch Field Audit Notice
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target NGO Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Target NGO
            </label>
            <select
              id="select-assign-ngo"
              value={selectedNgoId}
              onChange={(e) => setSelectedNgoId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer"
              required
            >
              {ngos.map((ngo) => (
                <option key={ngo.id} value={ngo.id}>
                  {ngo.name} ({ngo.regNumber}) - {ngo.district}
                </option>
              ))}
            </select>
          </div>

          {/* Target Officer Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assign Field Officer
            </label>
            <select
              id="select-assign-officer"
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer"
              required
            >
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} ({officer.badgeNumber || 'Officer'}) - {officer.status}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Inspection Date
              </label>
              <input
                id="input-assign-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Time Window
              </label>
              <input
                id="input-assign-time"
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="10:30 AM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Inspection Classification &amp; Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ROUTINE', label: 'Routine Statutory Audit' },
                { id: 'HIGH_SURPRISE', label: 'Surprise Vigilance Raid' },
                { id: 'COMPLAINT_INVESTIGATION', label: 'Grievance Inquiry' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as any)}
                  className={`py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    priority === p.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directives / Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Statutory Directives / Audit Scope
            </label>
            <textarea
              id="textarea-assign-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verify cash receipts, interview 5 enrolled beneficiaries, inspect physical registration board."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-full cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-assignment"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-xs cursor-pointer transition-all"
            >
              Dispatch Official Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
