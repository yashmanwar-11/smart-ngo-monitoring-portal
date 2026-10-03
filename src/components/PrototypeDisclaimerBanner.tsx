import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

export const PrototypeDisclaimerBanner: React.FC = () => {
  return (
    <div
      role="banner"
      aria-label="Hackathon Prototype Disclaimer"
      className="bg-amber-500 text-slate-950 px-3 py-1.5 text-xs font-semibold border-b border-amber-600 shadow-xs z-[100] relative"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-slate-950 text-amber-300 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            PROTOTYPE
          </span>
          <span className="text-[12px] font-bold text-slate-950">
            Prototype for Smart India Hackathon 2026. Not an official Government of India website.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-900 font-medium">
          <span className="hidden sm:inline">Problem Statement: MoSJE (PS 26095)</span>
          <span className="hidden md:inline">•</span>
          <span className="inline-flex items-center gap-1 bg-amber-600/30 px-2 py-0.5 rounded text-slate-950 font-bold text-[10px]">
            <Sparkles className="w-3 h-3 text-slate-950" />
            Team InnoCoders
          </span>
        </div>
      </div>
    </div>
  );
};
