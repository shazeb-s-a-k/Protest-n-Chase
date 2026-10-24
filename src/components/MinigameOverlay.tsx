import React, { useState } from 'react';
import { MinigameType } from '../types/game';
import { AlertCircle, Zap, ShieldAlert, Sparkles } from 'lucide-react';

interface MinigameOverlayProps {
  type: MinigameType;
  progress: number;
  onTap: () => void;
}

export const MinigameOverlay: React.FC<MinigameOverlayProps> = ({
  type,
  progress,
  onTap,
}) => {
  const [tapEffect, setTapEffect] = useState(false);

  if (type === 'NONE') return null;

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setTapEffect(true);
    onTap();
    setTimeout(() => setTapEffect(false), 90);
  };

  const isStruggle = type === 'STRUGGLE';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in pointer-events-auto">
      {/* Dynamic Pulsing Vignette */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          isStruggle
            ? 'bg-radial-gradient from-transparent via-red-900/30 to-red-950/80 animate-pulse'
            : 'bg-radial-gradient from-transparent via-yellow-900/30 to-amber-950/80 animate-pulse'
        }`}
      />

      {/* Center QTE Interactive Modal */}
      <div className="relative glass-panel px-6 py-8 sm:px-10 sm:py-10 rounded-3xl max-w-md w-full text-center flex flex-col items-center gap-5 border border-white/20 shadow-2xl">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isStruggle
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/40 animate-bounce'
                : 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/40 animate-bounce'
            }`}
          >
            {isStruggle ? (
              <ShieldAlert className="w-9 h-9 text-white" />
            ) : (
              <Zap className="w-9 h-9 text-slate-900" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-1">
            {isStruggle ? 'Detainment Lock!' : 'Canister Incoming!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xs">
            {isStruggle
              ? 'Police are securing the grapple! Rapidly tap to break free!'
              : 'Tear gas canister landing! Mash to kick it away before detonation!'}
          </p>
        </div>

        {/* Dynamic Progress Meter */}
        <div className="w-full">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-slate-400">
              {isStruggle ? 'Police Grip' : 'Detonation'}
            </span>
            <span
              className={`font-mono text-sm font-extrabold ${
                progress > 70 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {Math.round(progress)}%
            </span>
            <span className="text-emerald-400 font-bold">
              {isStruggle ? 'Freedom' : 'Deflected'}
            </span>
          </div>

          <div className="w-full h-5 bg-slate-950/90 rounded-full p-1 border border-white/10 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                isStruggle
                  ? 'bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400 shadow-lg shadow-emerald-400/30'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        {/* Giant Rapid-Tap Interactive Mash Button */}
        <button
          onClick={handleTap}
          onTouchStart={handleTap}
          className={`w-full py-5 sm:py-6 rounded-2xl font-black text-xl sm:text-2xl tracking-wider uppercase transition-transform shadow-2xl flex items-center justify-center gap-3 touch-action-btn select-none ${
            tapEffect ? 'scale-95 brightness-125' : 'scale-100 hover:scale-102'
          } ${
            isStruggle
              ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-red-600 text-white shadow-pink-600/40'
              : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-slate-950 shadow-yellow-500/40'
          }`}
        >
          <Sparkles className="w-6 h-6 animate-spin" />
          <span>MASH TAP / SPACEBAR!</span>
        </button>

        <div className="text-[11px] text-slate-400 font-mono tracking-wide">
          Desktop: Tap <kbd className="px-2 py-0.5 bg-white/10 rounded font-bold">SPACE</kbd> or{' '}
          <kbd className="px-2 py-0.5 bg-white/10 rounded font-bold">E</kbd>
        </div>
      </div>
    </div>
  );
};
