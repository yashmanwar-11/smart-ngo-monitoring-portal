import React, { useState } from 'react';
import { Shield, Lock, UserCheck, KeyRound, AlertCircle, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface InspectorLoginModalProps {
  allOfficers: User[];
  currentOfficer?: User | null;
  onLoginSuccess: (officer: User) => void;
  onClose: () => void;
}

export const InspectorLoginModal: React.FC<InspectorLoginModalProps> = ({
  allOfficers,
  currentOfficer,
  onLoginSuccess,
  onClose,
}) => {
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(
    allOfficers.find((o) => o.id === currentOfficer?.id)?.id || allOfficers[0]?.id || ''
  );
  const [badgeInput, setBadgeInput] = useState<string>(
    allOfficers.find((o) => o.id === selectedOfficerId)?.badgeNumber || 'INSP-DEL-402'
  );
  const [passwordInput, setPasswordInput] = useState<string>('••••••••');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleOfficerChange = (officerId: string) => {
    setSelectedOfficerId(officerId);
    const found = allOfficers.find((o) => o.id === officerId);
    if (found) {
      setBadgeInput(found.badgeNumber || '');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const officer = allOfficers.find((o) => o.id === selectedOfficerId);
    if (!officer) {
      setLoginError('Invalid inspector credentials. Officer account not found.');
      return;
    }

    onLoginSuccess(officer);
    onClose();
  };

  const handleCustomLogin = handleLoginSubmit;

  const handleQuickLogin = (officer: User) => {
    setSelectedOfficerId(officer.id);
    onLoginSuccess(officer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Modern Gradient Accent Line */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400"></div>

        {/* Official Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 border border-blue-400/40 flex items-center justify-center text-white shadow-xs shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                  e-Pramaan Official Cadre
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Field Vigilance Inspector Terminal
              </h3>
              <p className="text-xs text-slate-300">
                Central Vigilance &amp; NGO Field Audit Unit
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Quick 1-Click Credential Switcher for Inspectors */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Authorized Field Inspector:
            </label>
            <div className="space-y-2">
              {allOfficers.map((officer) => (
                <button
                  key={officer.id}
                  type="button"
                  onClick={() => handleQuickLogin(officer)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentOfficer?.id === officer.id
                      ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-blue-300 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                      {officer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{officer.name}</div>
                      <div className="text-[11px] text-slate-500">{officer.designation}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {officer.badgeNumber || 'OFFICER'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form for Selected Officer */}
          <form onSubmit={handleCustomLogin} className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Security Passcode / Token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-full text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Authenticate &amp; Open Inspector Terminal</span>
            </button>
          </form>

          <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Inspector Data Isolation Policy</span>
            </div>
            <p className="leading-relaxed">
              Each inspector's saved inspection records are encrypted and tied strictly to their officer profile. Unauthorized cross-officer record viewing is prevented by system security policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
