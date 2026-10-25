import React from 'react';
import { Cpu, Zap, Shield, Sparkles } from 'lucide-react';

interface LoadingOverlayProps {
  progress: number;
  status: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, status }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4 select-none">
      {/* Background ambient neon glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-white font-['Outfit']">
        {/* Header with Title and Creator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 animate-pulse">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400">
                PROTEST-N-CHASE
              </h2>
              <p className="text-xs text-slate-400 tracking-wide font-medium">
                Engine by <span className="text-amber-400 font-semibold">Shazeb Anwar Khan</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-['Space_Grotesk'] text-cyan-400 tracking-tight">
              {Math.min(100, Math.max(0, Math.round(progress)))}%
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 rounded-full bg-slate-800/80 p-0.5 border border-slate-700/60 overflow-hidden mb-3 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-fuchsia-500 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(6,182,212,0.6)] relative"
            style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Status Text */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-cyan-200/90 font-medium mb-5 truncate">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="truncate">{status || 'Pre-allocating device memory...'}</span>
        </div>

        {/* Performance feature tags */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">RAM Cache Active</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Zero-GC Loop</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">VRAM Shaders</span>
          </div>
        </div>
      </div>
    </div>
  );
};
