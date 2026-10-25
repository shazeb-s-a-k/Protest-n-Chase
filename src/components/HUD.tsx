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
  EyeOff,
  Heart,
  Maximize,
  Minimize,
  Zap,
  Siren,
  Compass,
  MousePointer,
  Target,
  KeyRound,
  Trophy,
} from 'lucide-react';
import { GameMatchState, CameraViewMode } from '../types/game';
import { Radar } from './Radar';

interface HUDProps {
  matchState: GameMatchState;
  stamina: number;
  cameraMode: CameraViewMode;
  isMuted: boolean;
  isFullscreen?: boolean;
  isImmersiveMode?: boolean;
  isUIHidden?: boolean;
  isPointerLocked?: boolean;
  isTouchDevice?: boolean;
  abilityCooldowns?: Map<string, number>;
  onToggleCamera: () => void;
  onRecenterCamera?: () => void;
  onToggleMute: () => void;
  onToggleFullscreen?: () => void;
  onToggleImmersiveMode?: () => void;
  onOpenSettings: () => void;
  onOpenPhotoBooth: () => void;
  onOpenSupport?: () => void;
  onOpenCareerStats?: () => void;
  onUseAbility: (ability: string) => void;
  onInteractStation?: () => void;
  onTapDetained?: () => void;
  onScatterLeaflets?: () => void;
  onCycleKafilaCommand?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  matchState,
  stamina,
  cameraMode,
  isMuted,
  isFullscreen = false,
  isImmersiveMode = false,
  isUIHidden = false,
  isPointerLocked = false,
  isTouchDevice = false,
  abilityCooldowns,
  onToggleCamera,
  onRecenterCamera,
  onToggleMute,
  onToggleFullscreen,
  onToggleImmersiveMode,
  onOpenSettings,
  onOpenPhotoBooth,
  onOpenSupport,
  onOpenCareerStats,
  onUseAbility,
  onInteractStation,
  onTapDetained,
  onScatterLeaflets,
  onCycleKafilaCommand,
}) => {
  const isProtestor = matchState.localTeam === 'PROTESTOR';
  const minutes = Math.floor(Math.max(0, matchState.timeRemaining) / 60);
  const seconds = Math.floor(Math.max(0, matchState.timeRemaining) % 60);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const isOverlayHidden = isUIHidden || isImmersiveMode;

  return (
    <div
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-5"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 8px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 8px)',
      }}
    >
      {/* Floating Restore Pill if HUD is Hidden / Immersive Mode active */}
      {isOverlayHidden && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 pointer-events-auto flex items-center gap-1.5 animate-fade-in z-50">
          {onToggleImmersiveMode && (
            <button
              onClick={onToggleImmersiveMode}
              className="glass-panel px-3 py-1.5 rounded-full text-xs font-bold text-slate-200 border border-white/20 hover:bg-white/15 flex items-center gap-1.5 shadow-2xl backdrop-blur-xl active:scale-95 transition-transform"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] tracking-wider uppercase">Show HUD</span>
            </button>
          )}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="glass-panel p-1.5 rounded-full text-xs text-slate-200 border border-white/20 hover:bg-white/15 shadow-2xl backdrop-blur-xl active:scale-95 transition-transform"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="w-3.5 h-3.5 text-pink-400" />
              ) : (
                <Maximize className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Top Header Bar with YouTube-style autohide transition */}
      <div
        className={`flex items-start justify-between gap-2.5 w-full max-w-6xl mx-auto transition-all duration-300 ${
          isOverlayHidden ? '-translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
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

          {/* Active Mission Tracker Card */}
          {matchState.activeMission && (
            <div className="glass-panel p-2.5 rounded-2xl border border-purple-500/40 bg-slate-900/90 max-w-[210px] sm:max-w-xs shadow-xl pointer-events-auto">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-purple-300 uppercase tracking-wide text-[10px] sm:text-[11px] truncate">
                  <span className="text-xs">{matchState.activeMission.icon || '🎯'}</span>
                  <span className="truncate">{matchState.activeMission.title}</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                  {matchState.activeMission.progress}/{matchState.activeMission.target}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden p-0.5 mb-1 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (matchState.activeMission.progress / matchState.activeMission.target) * 100)}%`
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-300 leading-tight">
                {matchState.activeMission.description}
              </div>
              <div className="text-[9px] text-amber-300 font-bold mt-1">
                Reward: {matchState.activeMission.reward}
              </div>
            </div>
          )}

          {/* Kafila Rally Horde Card */}
          {matchState.localTeam === 'PROTESTOR' && (
            <div className="glass-panel p-2 rounded-2xl border border-emerald-500/40 bg-slate-900/90 max-w-[210px] sm:max-w-xs shadow-xl pointer-events-auto flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-300 text-[10px] sm:text-[11px]">
                  <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Kafila: <strong className="text-white font-mono">{matchState.kafilaCount || 0}</strong></span>
                </span>
                {onCycleKafilaCommand && (
                  <button
                    onClick={onCycleKafilaCommand}
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all"
                  >
                    {matchState.kafilaCommand === 'RUSH' ? '🔥 Halla Bol' : matchState.kafilaCommand === 'DHARNA' ? '🧘 Dharna' : matchState.kafilaCommand === 'SCATTER' ? '💨 Bikhro' : '📢 March'}
                  </button>
                )}
              </div>
              {onScatterLeaflets && (
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[9px] text-slate-300 flex items-center gap-1">
                    <span>📄</span>
                    <span>Leaflets: <strong className="text-cyan-300">{matchState.leafletsRemaining ?? 3}</strong></span>
                  </span>
                  <button
                    onClick={onScatterLeaflets}
                    disabled={(matchState.leafletsRemaining ?? 3) <= 0}
                    className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 text-[9px] font-bold active:scale-95 disabled:opacity-40"
                    title="Scatter Leaflet Decoys (X)"
                  >
                    Drop [X]
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Awareness vs Detainment Status */}
        <div className="glass-panel px-3 sm:px-6 py-2 rounded-2xl flex-1 max-w-md mx-1 sm:mx-2 pointer-events-auto shadow-xl border border-white/10">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5 text-pink-400 tracking-wide uppercase text-[11px] sm:text-xs">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{matchState.mapId === 'PARIS' ? 'Bastille Mobilisation' : 'Awaaz (Viral Reach)'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono border border-white/10">
                {matchState.mapId === 'PARIS' ? '🇫🇷 Paris' : '🇮🇳 Delhi'}
              </span>
            </span>
            <span className="text-xs sm:text-sm font-mono text-cyan-300 font-extrabold flex items-center gap-2">
              {matchState.dholTempo && (
                <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1 animate-pulse">
                  <span>🥁</span>
                  <span>{matchState.dholTempo} BPM</span>
                </span>
              )}
              <span>{Math.round(matchState.awarenessScore)}%</span>
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
              <span>{matchState.mapId === 'PARIS' ? 'CRS Vans: ' : 'Buses: '}</span>
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
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <button
              onClick={onToggleCamera}
              className="glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
              title="Toggle Camera View (V)"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            </button>
            {onRecenterCamera && (
              <button
                onClick={onRecenterCamera}
                className="glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
                title="Recenter Camera Behind Player (R)"
              >
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              </button>
            )}
            <button
              onClick={onOpenPhotoBooth}
              className="glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
              title="Photo Mode / Poster (P)"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
            </button>
            <button
              onClick={onToggleMute}
              className="glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
              title="Toggle Audio (M)"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              )}
            </button>
            {/* Fullscreen Button (YouTube-style Maximize / Minimize) */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg"
                title={isFullscreen ? 'Exit Fullscreen' : 'Full Screen (Landscape)'}
              >
                {isFullscreen ? (
                  <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                ) : (
                  <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                )}
              </button>
            )}

            {/* Theater / Cinema View Toggle (Hide HUD) */}
            {onToggleImmersiveMode && (
              <button
                onClick={onToggleImmersiveMode}
                className={`glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg ${
                  isImmersiveMode ? 'border-amber-400 bg-amber-500/20 text-amber-300' : ''
                }`}
                title={isImmersiveMode ? 'Show Full HUD' : 'Cinema View (Hide Overlays)'}
              >
                {isImmersiveMode ? (
                  <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                ) : (
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
                )}
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/15 transition-all text-slate-200 active:scale-95 border border-white/10 shadow-lg cursor-pointer"
              title="Settings & Quality"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            </button>
            {onOpenCareerStats && (
              <button
                onClick={onOpenCareerStats}
                className="glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-amber-500/20 transition-all text-slate-200 active:scale-95 border border-amber-500/30 bg-amber-500/10 shadow-lg cursor-pointer"
                title="Career Stats & Trophies"
              >
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              </button>
            )}
            {onOpenSupport && (
              <button
                onClick={onOpenSupport}
                className="glass-panel p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-pink-500/20 transition-all text-slate-200 active:scale-95 border border-pink-500/30 bg-pink-500/10 shadow-lg cursor-pointer"
                title="Support Shazeb Anwar Khan (UPI: shazeb26@fam)"
              >
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 fill-pink-400" />
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

      {/* Center Screen Crosshair / Aim Point when Pointer Lock is Active */}
      {isPointerLocked && !isOverlayHidden && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-20">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.8)] border border-white/60" />
        </div>
      )}

      {/* Mid-Screen Center Alerts, Missions, Station Prompts & Banners */}
      <div className="flex-1 flex flex-col items-center justify-start pointer-events-none mt-2 sm:mt-4 z-20 max-w-lg mx-auto w-full px-4 gap-2">
        {/* Floating Dynamic Score & Action Popups */}
        {matchState.floatingNotifications && matchState.floatingNotifications.length > 0 && (
          <div className="flex flex-col items-center gap-1.5 pointer-events-none">
            {matchState.floatingNotifications.map((notif) => {
              let badgeColor = 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60';
              if (notif.type === 'SCORE') badgeColor = 'bg-pink-500/40 text-pink-100 border-pink-400/80';
              else if (notif.type === 'MISSION') badgeColor = 'bg-amber-500/40 text-amber-100 border-amber-400/80 animate-bounce';
              else if (notif.type === 'IMMUNITY') badgeColor = 'bg-emerald-500/40 text-emerald-100 border-emerald-400/80';
              else if (notif.type === 'COMBO') badgeColor = 'bg-purple-500/40 text-purple-100 border-purple-400/80';
              else if (notif.type === 'RESCUE') badgeColor = 'bg-rose-500/40 text-rose-100 border-rose-400/80';

              return (
                <div
                  key={notif.id}
                  className={`glass-panel px-4 py-1 rounded-full border text-xs sm:text-sm font-black shadow-2xl backdrop-blur-xl animate-fade-in ${badgeColor}`}
                >
                  {notif.text}
                </div>
              );
            })}
          </div>
        )}

        {/* Ghost Shield / Invulnerability Banner */}
        {((matchState.invulnerabilityTimer || 0) > 0) && (
          <div className="glass-panel px-4 py-1.5 rounded-full border border-amber-400/80 bg-amber-950/90 text-amber-300 text-xs sm:text-sm font-black shadow-2xl shadow-amber-500/30 flex items-center gap-2 animate-pulse pointer-events-none">
            <Shield className="w-4 h-4 text-amber-300 animate-spin" />
            <span>GHOST SHIELD: {matchState.invulnerabilityTimer?.toFixed(1)}s (Immune to Police Tackle!)</span>
          </div>
        )}

        {/* PC Pointer Lock Desktop Banner */}
        {!isPointerLocked && !isTouchDevice && !isOverlayHidden && (
          <div className="pointer-events-auto">
            <div className="glass-panel px-4 py-1.5 rounded-full border border-cyan-400/50 bg-slate-900/85 text-cyan-300 text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2 animate-pulse">
              <MousePointer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Click anywhere to lock mouse & look 360° (ESC to release cursor)</span>
            </div>
          </div>
        )}

        {/* Detention Jailbreak / Rapid Pick Lock Emergency Banner */}
        {((matchState.detentionCountdown || 0) > 0) && (
          <div className="pointer-events-auto w-full max-w-md">
            <div className="glass-panel p-3.5 rounded-2xl border-2 border-rose-500/90 bg-rose-950/95 text-white shadow-2xl flex flex-col items-center gap-2 animate-fade-in backdrop-blur-xl">
              <div className="flex items-center gap-2 text-rose-300 font-black text-sm sm:text-base animate-pulse">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>DETAINED IN BUS! Auto-Rescue in {Math.ceil(matchState.detentionCountdown!)}s</span>
              </div>
              <p className="text-[11px] text-slate-300 text-center leading-snug">
                Mash <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20 font-mono text-cyan-300">SPACE</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20 font-mono text-cyan-300">E</kbd> or tap button to lockpick and break out instantly!
              </p>
              {onTapDetained && (
                <button
                  onClick={onTapDetained}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-amber-200" />
                  <span>⚡ Mash To Pick Lock & Escape!</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Astronomical Landmark Banners */}
        {matchState.activeAstronomicalZone === 'SAMRAT_SUMMIT' && (
          <div className="glass-panel px-4 py-2 rounded-2xl border-2 border-amber-400 bg-amber-950/95 text-amber-200 text-xs sm:text-sm font-black shadow-2xl shadow-amber-500/40 flex items-center gap-2 animate-bounce pointer-events-none backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
            <span>SAMRAT YANTRA APEX: Live Satellite Uplink (3X Viral Hype Active!)</span>
          </div>
        )}

        {matchState.activeAstronomicalZone === 'JAI_PRAKASH_BOWL' && (
          <div className="glass-panel px-4 py-2 rounded-2xl border-2 border-emerald-400 bg-emerald-950/95 text-emerald-200 text-xs sm:text-sm font-black shadow-2xl shadow-emerald-500/40 flex items-center gap-2 animate-pulse pointer-events-none backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>JAI PRAKASH SANCTUARY: Celestial Meditation (Stamina & Shield Full!)</span>
          </div>
        )}

        {matchState.activeAstronomicalZone === 'RAM_YANTRA_MAZE' && (
          <div className="glass-panel px-4 py-2 rounded-2xl border border-purple-400 bg-purple-950/95 text-purple-200 text-xs sm:text-sm font-black shadow-2xl flex items-center gap-2 animate-pulse pointer-events-none backdrop-blur-xl">
            <Compass className="w-4 h-4 text-purple-300 shrink-0" />
            <span>RAM YANTRA COLUMNS: Police Line-of-Sight Broken!</span>
          </div>
        )}

        {/* Interactive Station Proximity Prompt */}
        {matchState.nearInteractiveStation && (
          <div className="pointer-events-auto animate-bounce mt-1">
            <button
              onClick={onInteractStation}
              className="glass-panel px-4 py-2.5 rounded-2xl border-2 border-emerald-400 bg-emerald-950/95 text-emerald-200 text-xs sm:text-sm font-black shadow-2xl shadow-emerald-500/30 flex items-center gap-2.5 active:scale-95 transition-transform backdrop-blur-xl"
            >
              <Coffee className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>{matchState.nearInteractiveStation.label}: {matchState.nearInteractiveStation.actionText}</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/30 text-white font-mono text-[10px] border border-emerald-300/40">
                [E] or Click
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Center: Desktop Ability Bar & Stamina (hidden on mobile landscape, shown on desktop keyboards) */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-2 hidden lg:flex">
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
                <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:brightness-110 overflow-hidden">
                  <Megaphone className="w-6 h-6 text-white" />
                  {(abilityCooldowns?.get('MEGAPHONE') || 0) > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono font-bold text-xs text-pink-300">
                      {Math.ceil(abilityCooldowns!.get('MEGAPHONE')!)}s
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-pink-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">1 / Q</span>
                  <span>Chant</span>
                </div>
              </button>

              {/* Parkour Vault Dash */}
              <button
                onClick={() => onUseAbility('PARKOUR_DASH')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 group-hover:brightness-110 overflow-hidden">
                  <Zap className="w-6 h-6 text-white" />
                  {(abilityCooldowns?.get('PARKOUR_DASH') || 0) > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono font-bold text-xs text-cyan-300">
                      {Math.ceil(abilityCooldowns!.get('PARKOUR_DASH')!)}s
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">2 / Z</span>
                  <span>Vault Dash</span>
                </div>
              </button>

              {/* Viral Hype */}
              <button
                onClick={() => onUseAbility('LIVESTREAM')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:brightness-110 overflow-hidden">
                  <Flame className="w-6 h-6 text-white" />
                  {(abilityCooldowns?.get('LIVESTREAM') || 0) > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono font-bold text-xs text-cyan-200">
                      {Math.ceil(abilityCooldowns!.get('LIVESTREAM')!)}s
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">3 / F</span>
                  <span>Live Hype</span>
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
                  <span className="px-1 bg-black/40 rounded text-[9px]">4 / H</span>
                  <span>Chain Shield</span>
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
            </>
          ) : (
            <>
              {/* Deploy Barricade */}
              <button
                onClick={() => onUseAbility('BARRICADE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg text-white overflow-hidden">
                  <Shield className="w-6 h-6" />
                  {(abilityCooldowns?.get('BARRICADE') || 0) > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono font-bold text-xs text-amber-200">
                      {Math.ceil(abilityCooldowns!.get('BARRICADE')!)}s
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">1 / Q</span>
                  <span>Barricade</span>
                </div>
              </button>

              {/* Pursuit Siren Overdrive */}
              <button
                onClick={() => onUseAbility('PURSUIT_BOOST')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg text-white overflow-hidden">
                  <Siren className="w-6 h-6" />
                  {(abilityCooldowns?.get('PURSUIT_BOOST') || 0) > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono font-bold text-xs text-rose-200">
                      {Math.ceil(abilityCooldowns!.get('PURSUIT_BOOST')!)}s
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">2 / Z</span>
                  <span>Pursuit Sprint</span>
                </div>
              </button>

              {/* Smoke Canister */}
              <button
                onClick={() => onUseAbility('SMOKE')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-600 to-zinc-700 flex items-center justify-center shadow-lg text-white overflow-hidden">
                  <AlertTriangle className="w-6 h-6" />
                  {(abilityCooldowns?.get('SMOKE') || 0) > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono font-bold text-xs text-slate-200">
                      {Math.ceil(abilityCooldowns!.get('SMOKE')!)}s
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">3 / R</span>
                  <span>Tear Gas</span>
                </div>
              </button>

              {/* Water Cannon */}
              <button
                onClick={() => onUseAbility('WATER')}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white overflow-hidden">
                  <Radio className="w-6 h-6" />
                  {(abilityCooldowns?.get('WATER') || 0) > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono font-bold text-xs text-blue-200">
                      {Math.ceil(abilityCooldowns!.get('WATER')!)}s
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-300">
                  <span className="px-1 bg-black/40 rounded text-[9px]">4 / F</span>
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
