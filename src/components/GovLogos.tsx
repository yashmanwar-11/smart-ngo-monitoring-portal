import React from 'react';

export const DigitalIndiaLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-2xs">
      <span className="text-[10px] font-black text-sky-400 font-mono tracking-tighter">SIH</span>
    </div>
    <div className="flex flex-col text-left leading-none">
      <span className="text-[10px] font-bold tracking-tight text-slate-800">Smart India Hackathon</span>
      <span className="text-[8px] font-semibold text-sky-600">PS 26095 • MoSJE</span>
    </div>
  </div>
);

export const EPramaanLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs shadow-2xs border border-slate-600">
      <span className="text-[10px] font-black text-sky-300">IN</span>
    </div>
    <div className="flex flex-col text-left leading-none">
      <span className="text-[10px] font-bold text-slate-800 tracking-tight">INSPIRA</span>
      <span className="text-[8px] font-medium text-slate-500">Secure Access</span>
    </div>
  </div>
);

export const NgoDarpanLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
    <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
      <span className="text-[10px] font-bold text-sky-200">NGO</span>
    </div>
    <div className="flex flex-col text-left leading-none">
      <span className="text-[10px] font-bold text-slate-800 tracking-tight">DARPAN Sync</span>
      <span className="text-[8px] font-medium text-slate-500">External Registry</span>
    </div>
  </div>
);

export const NicLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <div className={`inline-flex items-center gap-1 select-none ${className}`}>
    <div className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[10px] font-bold tracking-wider font-mono">
      PS 26095
    </div>
    <div className="flex flex-col text-left leading-none">
      <span className="text-[9px] font-bold text-slate-700">Team InnoCoders</span>
      <span className="text-[7.5px] font-medium text-slate-500">Prototype System</span>
    </div>
  </div>
);
