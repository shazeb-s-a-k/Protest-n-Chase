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
  Settings,
  Tv,
  Coffee,
  Wifi,
  Eye,
  Heart,
} from 'lucide-react';
import { GameMatchState, CameraViewMode } from '../types/game';
import { Radar } from './Radar';

interface HUDProps {
  matchState: GameMatchState;
  stamina: number;
  cameraMode: CameraViewMode;
  isMuted: boolean;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenPhotoBooth: () => void;
  onOpenSupport?: () => void;
  onUseAbility: (ability: string) => void;
}

export const HUD: React.FC<HUDProps> = ({
  matchState,
  stamina,
  cameraMode,
  isMuted,
  onToggleCamera,
  onToggleMute,
  onOpenSettings,
  onOpenPhotoBooth,
  onOpenSupport,
  onUseAbility,
}) => {
  const isProtestor = matchState.localTeam === 'PROTESTOR';
  const minutes = Math.floor(Math.max(0, matchState.timeRemaining) / 60);
  const seconds = Math.floor(Math.max(0, matchState.timeRemaining) % 60);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-5">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-2.5 w-full max-w-6xl mx-auto">
        {/* Left: Live Stream Indicator, Active PowerUp & Media Spotlight Alert */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="glass-panel px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-lg">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full badge-live text-[10px] sm:text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              LIVE
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">
              {matchState.viewerCount.toLocaleString()}{' '}
              <span className="text-slate-400 font-normal hidden sm:inline">watching</span>
            </div>
          </div>

          {/* Active PowerUp Badge */}
          {matchState.activePowerUp && (
            <div className="glass-panel px-3 py-1 rounded-xl border border-amber-400/50 bg-amber-950/80 text-amber-300 text-xs font-black tracking-wide uppercase flex items-center gap-2 animate-bounce shadow-xl shadow-amber-500/20">
              {matchState.activePowerUp === 'ENERGY_CHAI' && <Coffee className="w-4 h-4 text-orange-400" />}
              {matchState.activePowerUp === 'WIFI_HOTSPOT' && <Wifi className="w-4 h-4 text-cyan-400" />}
              {matchState.activePowerUp === 'AMP_BOOST' && <Megaphone className="w-4 h-4 text-pink-400" />}
              {matchState.activePowerUp === 'PEACE_AURA' && <Shield className="w-4 h-4 text-emerald-400" />}
              {matchState.activePowerUp === 'CONE_TRAP' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
              <span>
                {matchState.activePowerUp.replace('_', ' ')} (
                {Math.ceil(matchState.powerUpTimeLeft)}s)
              </span>
            </div>
          )}

          {/* Dynamic Spotlight Banner */}
          {matchState.isPlayerInSpotlight && (
            <div className="glass-panel px-3 py-1.5 rounded-xl border border-cyan-400/50 bg-cyan-950/70 text-cyan-300 text-xs font-extrabold tracking-wide uppercase flex items-center gap-1.5 animate-pulse shadow-xl shadow-cyan-500/20">
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>MEDIA DRONE SPOTLIGHT (3X HYPE!)</span>
            </div>
          )}
        </div>

        {/* Center: Awareness vs Detainment Status */}
        <div className="glass-panel px-3 sm:px-6 py-2 rounded-2xl flex-1 max-w-md mx-1 sm:mx-2 pointer-events-auto shadow-xl border border-white/10">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1 text-pink-400 tracking-wide uppercase text-[11px] sm:text-xs">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Awaaz (Viral Reach)
            </span>
            <span className="text-xs sm:text-sm font-mono text-cyan-300 font-extrabold">
              {Math.round(matchState.awarenessScore)}%
            </span>
          </div>

          <div className="w-full h-2.5 sm:h-3 bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shadow-md"
              style={{ width: `${Math.min(100, matchState.awarenessScore)}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5 text-[10px] sm:text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
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

        {/* Right: Controls & Radar Minimap */}
        <div className="flex items-start gap-2.5 pointer-events-auto">
          {/* Action Buttons: Camera, PhotoBooth, Sound, Settings */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={onToggleCamera}
              className="glass-panel p-2 rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
              title="Toggle Camera View (V)"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={onOpenPhotoBooth}
              className="glass-panel p-2 rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
              title="Photo Mode / Poster (P)"
            >
              <Camera className="w-4 h-4 text-pink-400" />
            </button>
            <button
              onClick={onToggleMute}
              className="glass-panel p-2 rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
              title="Toggle Audio (M)"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <button
              onClick={onOpenSettings}
              className="glass-panel p-2 rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
              title="Settings & Quality"
            >
              <Settings className="w-4 h-4 text-purple-400" />
            </button>
            {onOpenSupport && (
              <button
                onClick={onOpenSupport}
                className="glass-panel p-2 rounded-xl hover:bg-pink-500/20 transition-all text-slate-200 active:scale-95 border border-pink-500/30 bg-pink-500/10 shadow-lg"
                title="Support Shazeb Anwar Khan (UPI: shazeb26@fam)"
              >
                <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              </button>
            )}
          </div>

          {/* Real-time Circular Radar */}
          <Radar
            entities={matchState.radarEntities}
            localPlayerId={matchState.localPlayerId}
          />
        </div>
      </div>

      {/* Bottom Center: Desktop Ability Bar & Stamina */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-2 hidden md:flex">
        {/* Stamina Meter */}
        <div className="w-56 glass-panel px-3 py-1 rounded-xl flex items-center gap-2 pointer-events-auto border border-white/10">
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

        {/* Ability Action Buttons */}
        <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-4 pointer-events-auto border border-white/15 shadow-2xl">
          {isProtestor ? (
            <>
              {/* Megaphone Chant */}
              <button
                onClick={() => onUseAbility('MEGAPHONE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:brightness-110">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-pink-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">Q</span>
                  <span>Chant</span>
                </div>
              </button>

              {/* Viral Hype */}
              <button
                onClick={() => onUseAbility('LIVESTREAM')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:brightness-110">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">F</span>
                  <span>Hype</span>
                </div>
              </button>

              {/* Bus Jailbreak */}
              <button
                onClick={() => onUseAbility('BUS_RESCUE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:brightness-110">
                  <Unlock className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">E</span>
                  <span>Free Bus</span>
                </div>
              </button>

              {/* Human Chain Formation */}
              <button
                onClick={() => onUseAbility('HUMAN_CHAIN')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg group-hover:brightness-110 border ${
                    matchState.humanChainActive
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-300 shadow-purple-500/40 animate-pulse'
                      : 'bg-white/10 border-white/20'
                  }`}
                >
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-purple-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">H</span>
                  <span>Chain</span>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Deploy Barricade */}
              <button
                onClick={() => onUseAbility('BARRICADE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">Q</span>
                  <span>Barricade</span>
                </div>
              </button>

              {/* Smoke Canister */}
              <button
                onClick={() => onUseAbility('SMOKE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-600 to-zinc-700 flex items-center justify-center shadow-lg text-white">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">R</span>
                  <span>Smoke</span>
                </div>
              </button>

              {/* Water Cannon */}
              <button
                onClick={() => onUseAbility('WATER')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
                  <Radio className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">F</span>
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
