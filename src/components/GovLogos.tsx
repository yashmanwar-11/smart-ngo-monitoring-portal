import React from 'react';

export const DigitalIndiaLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 via-white to-green-600 p-[1.5px] shadow-2xs">
      <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center">
        <span className="text-[10px] font-black text-amber-400 font-mono tracking-tighter">DI</span>
      </div>
    </div>
    <div className="flex flex-col text-left leading-none">
      <span className="text-[10px] font-black tracking-tight text-slate-800">Digital India</span>
      <span className="text-[8px] font-semibold text-orange-600">Power To Empower</span>
    </div>
  </div>
);

export const EPramaanLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
    <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs shadow-2xs border border-blue-700">
      <span className="text-[11px] font-black text-sky-300">ई</span>
    </div>
    <div className="flex flex-col text-left leading-none">
      <span className="text-[10px] font-black text-blue-900 tracking-tight">e-Pramaan</span>
      <span className="text-[8px] font-semibold text-slate-500">मेरी पहचान (SSO)</span>
    </div>
  </div>
);

export const NgoDarpanLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
    <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
      <span className="text-[10px] font-black text-amber-200">दर्पण</span>
    </div>
    <div className="flex flex-col text-left leading-none">
      <span className="text-[10px] font-black text-slate-800 tracking-tight">NGO-DARPAN</span>
      <span className="text-[8px] font-semibold text-amber-700">NITI Aayog Portal</span>
    </div>
  </div>
);

export const NicLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <div className={`inline-flex items-center gap-1 select-none ${className}`}>
    <div className="px-1.5 py-0.5 bg-blue-950 text-white rounded text-[10px] font-black tracking-wider font-mono">
      NIC
    </div>
    <div className="flex flex-col text-left leading-none">
      <span className="text-[9px] font-bold text-slate-700">National</span>
      <span className="text-[7.5px] font-medium text-slate-500">Informatics Centre</span>
    </div>
  </div>
);
