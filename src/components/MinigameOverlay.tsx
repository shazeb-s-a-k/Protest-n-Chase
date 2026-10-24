import React, { useState, useEffect } from 'react';
import { MinigameType } from '../types/game';
import { ShieldAlert, Zap, Sparkles, Flame } from 'lucide-react';

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
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    if (type === 'NONE') {
      setCombo(0);
    }
  }, [type]);

  if (type === 'NONE') return null;

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setTapEffect(true);
    setCombo((c) => c + 1);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }

    onTap();
    setTimeout(() => setTapEffect(false), 80);
  };

  const isStruggle = type === 'STRUGGLE';

  return (
    <div
      onClick={handleTap}
      onTouchStart={handleTap}
      style={{ touchAction: 'none' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-fade-in pointer-events-auto cursor-pointer select-none"
    >
      {/* Pulsing Red/Amber Vignette */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
          isStruggle
            ? 'bg-radial-gradient from-transparent via-red-950/40 to-red-950/90 animate-pulse'
            : 'bg-radial-gradient from-transparent via-yellow-950/40 to-amber-950/90 animate-pulse'
        }`}
      />

      {/* Main QTE Card */}
      <div
        className={`relative glass-panel px-6 py-8 sm:px-10 sm:py-10 rounded-3xl max-w-md w-full text-center flex flex-col items-center gap-5 border border-white/20 shadow-2xl transition-transform ${
          tapEffect ? 'scale-98 animate-mash' : 'scale-100'
        }`}
      >
        {/* Header Icon */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
              isStruggle
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/50 animate-bounce'
                : 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/50 animate-bounce'
            }`}
          >
            {isStruggle ? (
              <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            ) : (
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-1">
            {isStruggle ? 'Detainment Lock!' : 'Canister Incoming!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xs">
            {isStruggle
              ? 'Police are locking the grapple! Mash rapidly anywhere to break free!'
              : 'Tear gas canister landing nearby! Tap rapidly to deflect it away!'}
          </p>
        </div>

        {/* Dynamic Combo Counter */}
        {combo > 2 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-black uppercase tracking-wider animate-bounce">
            <Flame className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span>MASH COMBO: {combo}x!</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-slate-400">
              {isStruggle ? 'Police Grip' : 'Detonation'}
            </span>
            <span
              className={`font-mono text-base font-black ${
                progress > 70 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {Math.round(progress)}%
            </span>
            <span className="text-emerald-400 font-bold">
              {isStruggle ? 'Freedom' : 'Deflected'}
            </span>
          </div>

          <div className="w-full h-6 bg-slate-950/90 rounded-full p-1 border border-white/10 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                isStruggle
                  ? 'bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400 shadow-lg shadow-emerald-400/40'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        {/* Massive Mash Action Button */}
        <div
          className={`w-full py-5 sm:py-6 rounded-2xl font-black text-xl sm:text-2xl tracking-wider uppercase transition-transform shadow-2xl flex items-center justify-center gap-3 select-none ${
            tapEffect ? 'scale-95 brightness-125' : 'scale-100 hover:scale-102'
          } ${
            isStruggle
              ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-red-600 text-white shadow-pink-600/40'
              : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-slate-950 shadow-yellow-500/40'
          }`}
        >
          <Sparkles className="w-6 h-6 animate-spin" />
          <span>TAP ANYWHERE FAST!</span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono tracking-wide">
          Desktop: Tap <kbd className="px-2 py-0.5 bg-white/10 rounded font-bold">SPACE</kbd> or{' '}
          <kbd className="px-2 py-0.5 bg-white/10 rounded font-bold">E</kbd>
        </div>
      </div>
    </div>
  );
};
