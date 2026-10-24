import React from 'react';
import {
  Megaphone,
  Radio,
  Shield,
  Flame,
  Camera,
  Volume2,
  VolumeX,
  Users,
  Unlock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { GameMatchState, CameraViewMode } from '../types/game';

interface HUDProps {
  matchState: GameMatchState;
  stamina: number;
  cameraMode: CameraViewMode;
  isMuted: boolean;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onUseAbility: (ability: string) => void;
}

export const HUD: React.FC<HUDProps> = ({
  matchState,
  stamina,
  cameraMode,
  isMuted,
  onToggleCamera,
  onToggleMute,
  onUseAbility,
}) => {
  const isProtestor = matchState.localTeam === 'PROTESTOR';
  const minutes = Math.floor(Math.max(0, matchState.timeRemaining) / 60);
  const seconds = Math.floor(Math.max(0, matchState.timeRemaining) % 60);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 w-full max-w-4xl mx-auto">
        {/* Live Stream Hype Indicator */}
        <div className="glass-panel px-3.5 py-2 rounded-2xl flex items-center gap-2.5 pointer-events-auto border border-white/10 shadow-lg">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full badge-live text-xs font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            LIVE
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-200">
            {matchState.viewerCount.toLocaleString()}{' '}
            <span className="text-slate-400 font-normal">watching</span>
          </div>
        </div>

        {/* Central Match Status: Awareness vs Detainment */}
        <div className="glass-panel px-4 sm:px-6 py-2.5 rounded-2xl flex-1 max-w-md mx-2 pointer-events-auto shadow-xl border border-white/10">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1 text-pink-400 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Awaaz (Viral Reach)
            </span>
            <span className="text-sm font-mono text-cyan-300 font-extrabold">
              {Math.round(matchState.awarenessScore)}%
            </span>
          </div>
          {/* Awareness Progress Bar */}
          <div className="w-full h-3 bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shadow-md"
              style={{ width: `${Math.min(100, matchState.awarenessScore)}%` }}
            />
          </div>

          {/* Sub Stats: Detained Count & Timer */}
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5 text-[11px] sm:text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Buses: </span>
              <span className="font-bold text-amber-300">
                {matchState.detainedScore} / 8 Detained
              </span>
            </div>
            <div className="font-mono font-bold text-slate-200 tracking-wider">
              ⏱ {formattedTime}
            </div>
          </div>
        </div>

        {/* Utility Controls (Camera Toggle, Sound) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleCamera}
            className="glass-panel p-2.5 rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
            title="Toggle Camera View (C)"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </button>
          <button
            onClick={onToggleMute}
            className="glass-panel p-2.5 rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
            title="Toggle Sound (M)"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Action HUD: Stamina & Ability Bar */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-2.5">
        {/* Stamina Meter */}
        <div className="w-48 sm:w-64 glass-panel px-3 py-1.5 rounded-xl flex items-center gap-2 pointer-events-auto border border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Stamina
          </span>
          <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-100"
              style={{ width: `${stamina}%` }}
            />
          </div>
        </div>

        {/* Action Abilities Bar */}
        <div className="glass-panel px-3 py-2 sm:px-5 sm:py-3 rounded-2xl flex items-center gap-2.5 sm:gap-4 pointer-events-auto border border-white/15 shadow-2xl">
          {isProtestor ? (
            <>
              {/* Protestor Ability 1: Megaphone */}
              <button
                onClick={() => onUseAbility('MEGAPHONE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:brightness-110">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-pink-300">
                  <span className="hidden sm:inline px-1 bg-black/40 rounded text-[9px]">Q</span>
                  <span>Chant</span>
                </div>
              </button>

              {/* Protestor Ability 2: Live-Stream Hype */}
              <button
                onClick={() => onUseAbility('LIVESTREAM')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:brightness-110">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300">
                  <span className="hidden sm:inline px-1 bg-black/40 rounded text-[9px]">F</span>
                  <span>Viral Hype</span>
                </div>
              </button>

              {/* Protestor Ability 3: Bus Jailbreak */}
              <button
                onClick={() => onUseAbility('BUS_RESCUE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:brightness-110">
                  <Unlock className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <span className="hidden sm:inline px-1 bg-black/40 rounded text-[9px]">E</span>
                  <span>Free Bus</span>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Police Ability 1: Deploy Barricade */}
              <button
                onClick={() => onUseAbility('BARRICADE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:brightness-110">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                  <span className="hidden sm:inline px-1 bg-black/40 rounded text-[9px]">Q</span>
                  <span>Barricade</span>
                </div>
              </button>

              {/* Police Ability 2: Smoke Canister */}
              <button
                onClick={() => onUseAbility('SMOKE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-zinc-700 flex items-center justify-center shadow-lg shadow-slate-500/30 group-hover:brightness-110">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                  <span className="hidden sm:inline px-1 bg-black/40 rounded text-[9px]">R</span>
                  <span>Smoke</span>
                </div>
              </button>

              {/* Police Ability 3: Water Cannon */}
              <button
                onClick={() => onUseAbility('WATER')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:brightness-110">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-300">
                  <span className="hidden sm:inline px-1 bg-black/40 rounded text-[9px]">F</span>
                  <span>Water Surge</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
