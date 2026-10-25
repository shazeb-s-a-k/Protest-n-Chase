import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './engine/GameEngine';
import {
  Team,
  GameMode,
  GameMatchState,
  CameraViewMode,
  LiveStreamComment,
  GraphicsQuality,
  TimeOfDay,
  WeatherCondition,
  MapId,
} from './types/game';
import { MovementInput } from './engine/CharacterController';
import { HUD } from './components/HUD';
import { LiveStreamFeed } from './components/LiveStreamFeed';
import { MinigameOverlay } from './components/MinigameOverlay';
import { MobileControls } from './components/MobileControls';
import { TeamSelectModal } from './components/TeamSelectModal';
import { VictoryModal } from './components/VictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { PhotoBoothModal } from './components/PhotoBoothModal';
import { SupportModal } from './components/SupportModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { audioManager } from './engine/AudioManager';
import { Smartphone } from 'lucide-react';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing device memory...');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPhotoBoothOpen, setIsPhotoBoothOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Fullscreen, Orientation & YouTube-style Autohide States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [isUIIdle, setIsUIIdle] = useState(false);
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const idleTimerRef = useRef<any>(null);

  useEffect(() => {
    const handleErr = (e: ErrorEvent) => {
      console.error('Window Error:', e);
      if (e.message && (e.message.includes('WebGL') || e.message.includes('Three') || e.message.includes('Context'))) {
        setLaunchError(e.message);
      }
    };
    window.addEventListener('error', handleErr);
    return () => window.removeEventListener('error', handleErr);
  }, []);

  // Track viewport, touch capability and fullscreen changes
  useEffect(() => {
    const checkViewport = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
      setIsMobileDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024
      );
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    document.addEventListener('fullscreenchange', checkViewport);
    document.addEventListener('webkitfullscreenchange', checkViewport);

    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
      document.removeEventListener('fullscreenchange', checkViewport);
      document.removeEventListener('webkitfullscreenchange', checkViewport);
    };
  }, []);

  // Fullscreen Toggle Handler (with orientation lock attempt)
  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const elem = document.documentElement as any;

      if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }

        try {
          if (screen.orientation && 'lock' in screen.orientation) {
            await (screen.orientation as any).lock('landscape');
          }
        } catch (_) {}
        setIsFullscreen(true);
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        try {
          if (screen.orientation && 'unlock' in screen.orientation) {
            (screen.orientation as any).unlock();
          }
        } catch (_) {}
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle note:', err);
    }
  };

  // YouTube-style UI idle autohide timer
  const resetUIIdleTimer = useCallback(() => {
    setIsUIIdle(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (isPlaying) {
      idleTimerRef.current = setTimeout(() => {
        setIsUIIdle(true);
      }, 4500); // 4.5s idle fades non-essential overlays
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      resetUIIdleTimer();
    } else {
      setIsUIIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPlaying, resetUIIdleTimer]);

  const [matchState, setMatchState] = useState<GameMatchState>({
    mode: 'SOLO',
    localPlayerId: '',
    localTeam: 'PROTESTOR',
    awarenessScore: 15,
    detainedScore: 0,
    timeRemaining: 180,
    isGameOver: false,
    winner: null,
    viewerCount: 1240,
    activeMinigame: 'NONE',
    minigameProgress: 50,
    graphicsQuality: 'HIGH',
    timeOfDay: 'GOLDEN_HOUR',
    weather: 'CLEAR_GOLDEN',
    radarEntities: [],
    droneSpotlightPos: { x: 0, z: 20 },
    isPlayerInSpotlight: false,
    humanChainActive: false,
    placardText: 'AWAAZ 2026',
    activePowerUp: null,
    powerUpTimeLeft: 0,
    superchats: [],
    isPhotoMode: false,
    mapId: 'DELHI',
  });

  const [stamina, setStamina] = useState(100);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('CHASE');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [cameraSensitivity, setCameraSensitivity] = useState(1.0);
  const [comments, setComments] = useState<LiveStreamComment[]>([
    { id: '1', user: 'DelhiEcho', text: 'Peaceful protest starting at Jantar Mantar! 📢', emoji: '✊', timestamp: Date.now() },
    { id: '2', user: 'Aarav_Z', text: 'Stand strong! Raise our voices!', emoji: '🔥', timestamp: Date.now() },
  ]);

  // Current Input State
  const inputRef = useRef<MovementInput>({
    moveForward: 0,
    moveRight: 0,
    sprint: false,
    jump: false,
    slide: false,
  });

  // Start Match with full RAM Asset Preloading
  const handleStartGame = async (team: Team, mode: GameMode, roomCode?: string, mapId: MapId = 'DELHI') => {
    setLaunchError(null);
    setIsLoadingAssets(true);
    setLoadingProgress(10);
    setLoadingStatus('Initializing Web Audio synthesis buffers...');

    try {
      audioManager.init();
      console.log('🎮 Starting Protest-n-Chase Match:', { team, mode, roomCode, mapId });

      if (mapId === 'PARIS') {
        setComments([
          { id: '1', user: 'BastilleEcho', text: 'Rassemblement à la Place de la Bastille! 🇫🇷📢', emoji: '✊', timestamp: Date.now() },
          { id: '2', user: 'Camille_Z', text: 'Liberté, Égalité, Solidarité! Bastille debout!', emoji: '🔥', timestamp: Date.now() },
        ]);
      } else {
        setComments([
          { id: '1', user: 'DelhiEcho', text: 'Peaceful protest starting at Jantar Mantar! 📢', emoji: '✊', timestamp: Date.now() },
          { id: '2', user: 'Aarav_Z', text: 'Stand strong! Raise our voices!', emoji: '🔥', timestamp: Date.now() },
        ]);
      }

      if (!containerRef.current) {
        console.warn('⚠️ containerRef.current is not attached yet, retrying in next tick...');
        setTimeout(() => handleStartGame(team, mode, roomCode, mapId), 50);
        return;
      }

      if (engineRef.current) {
        try {
          engineRef.current.destroy();
        } catch (destroyErr) {
          console.warn('Note while destroying previous engine:', destroyErr);
        }
      }

      const engine = new GameEngine(containerRef.current, mode, team, roomCode, mapId);
      engineRef.current = engine;

      engine.onPointerLockChange = (locked) => {
        setIsPointerLocked(locked);
      };

      engine.onStateUpdate = (newState) => {
        setMatchState(newState);
        if (engine.localPlayer) {
          setStamina(Math.round(engine.localPlayer.currentStamina));
        }
      };

      engine.onLiveStreamComment = (commentText) => {
        const isParis = engine.selectedMap === 'PARIS';
        const users = isParis
          ? ['Camille_Paris', 'Lucas_Bastille', 'Manon_Republique', 'Hugo_Z', 'Chloe_Libre', 'Bastien_FR', 'Léa_Agora']
          : ['PoojaLive', 'RohanYouth', 'Kavita_Now', 'GenZPower', 'Simran_V', 'ArjunDelhi', 'Vikram_S'];
        const emojis = isParis ? ['🇫🇷', '🔥', '📢', '✊', '⚡️', '🥖'] : ['❤️', '🔥', '📢', '✊', '⚡️', '🌟'];
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        setComments((prev) => [
          ...prev.slice(-12),
          {
            id: Math.random().toString(),
            user: randomUser,
            text: commentText,
            emoji: randomEmoji,
            timestamp: Date.now(),
          },
        ]);
      };

      // Preload & compile all PBR textures, audio synthesis, and WebGL shaders into RAM/VRAM
      await engine.preloadAssets((pct, status) => {
        setLoadingProgress(pct);
        setLoadingStatus(status);
      });

      setIsLoadingAssets(false);
      setIsPlaying(true);
    } catch (err: any) {
      console.error('❌ Error during GameEngine initialization:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setLaunchError(msg);
      setIsLoadingAssets(false);
      setIsPlaying(false);
    }
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || !engineRef.current) return;

      // Minigame Rapid Mash or Jailbreak Lockpick
      if (e.code === 'Space' || e.code === 'KeyE') {
        if (matchState.detentionCountdown && matchState.detentionCountdown > 0) {
          engineRef.current.handleMinigameTap();
          return;
        }
        if (matchState.activeMinigame !== 'NONE') {
          engineRef.current.handleMinigameTap();
          return;
        }
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.moveForward = 1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.moveForward = -1;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputRef.current.moveRight = -1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputRef.current.moveRight = 1;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          inputRef.current.sprint = true;
          break;
        case 'Space':
          inputRef.current.jump = true;
          break;
        case 'KeyC':
          inputRef.current.slide = true;
          break;
        // Abilities Shortcuts (1-4, Q, Z, F, R, E, H)
        case 'Digit1':
        case 'KeyQ':
          if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.triggerMegaphoneBlast();
          } else {
            engineRef.current.deployBarricade();
          }
          break;
        case 'Digit2':
        case 'KeyZ':
          if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.triggerParkourDash();
          } else {
            engineRef.current.triggerPursuitBoost();
          }
          break;
        case 'Digit3':
        case 'KeyF':
          if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.triggerLiveStreamHype();
          } else {
            engineRef.current.fireWaterCannon();
          }
          break;
        case 'Digit4':
        case 'KeyH':
          if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.toggleHumanChain();
          } else {
            engineRef.current.throwSmokeCanister();
          }
          break;
        case 'KeyR':
          if (matchState.localTeam === 'POLICE') {
            engineRef.current.throwSmokeCanister();
          } else {
            engineRef.current.recenterCamera();
          }
          break;
        case 'KeyB':
          engineRef.current.recenterCamera();
          break;
        case 'KeyE':
          if (matchState.nearInteractiveStation) {
            engineRef.current.interactWithStation();
          } else if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.triggerBusJailbreak();
          }
          break;
        case 'KeyP':
          setIsPhotoBoothOpen((prev) => !prev);
          break;
        case 'KeyV':
          setCameraMode(engineRef.current.toggleCameraMode());
          break;
        case 'KeyM':
          setIsMuted(audioManager.toggleMute());
          break;
        case 'Escape':
          if (isPhotoBoothOpen) {
            setIsPhotoBoothOpen(false);
          } else {
            setIsSettingsOpen((prev) => !prev);
          }
          break;
      }

      engineRef.current.updateLocalInput(inputRef.current);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isPlaying || !engineRef.current) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          if (inputRef.current.moveForward > 0) inputRef.current.moveForward = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          if (inputRef.current.moveForward < 0) inputRef.current.moveForward = 0;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          if (inputRef.current.moveRight < 0) inputRef.current.moveRight = 0;
          break;
        case 'KeyD':
        case 'ArrowRight':
          if (inputRef.current.moveRight > 0) inputRef.current.moveRight = 0;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          inputRef.current.sprint = false;
          break;
        case 'Space':
          inputRef.current.jump = false;
          break;
        case 'KeyC':
          inputRef.current.slide = false;
          break;
      }

      engineRef.current.updateLocalInput(inputRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, matchState.activeMinigame, matchState.localTeam, isPhotoBoothOpen, matchState.nearInteractiveStation, matchState.detentionCountdown]);

  // Ability Click Trigger from HUD or Mobile Controls
  const handleUseAbility = (ability: string) => {
    if (!engineRef.current) return;
    switch (ability) {
      case 'PARKOUR_DASH':
        engineRef.current.triggerParkourDash();
        break;
      case 'PURSUIT_BOOST':
        engineRef.current.triggerPursuitBoost();
        break;
      case 'MEGAPHONE':
        engineRef.current.triggerMegaphoneBlast();
        break;
      case 'LIVESTREAM':
        engineRef.current.triggerLiveStreamHype();
        break;
      case 'BUS_RESCUE':
        engineRef.current.triggerBusJailbreak();
        break;
      case 'HUMAN_CHAIN':
        engineRef.current.toggleHumanChain();
        break;
      case 'BARRICADE':
        engineRef.current.deployBarricade();
        break;
      case 'SMOKE':
        engineRef.current.throwSmokeCanister();
        break;
      case 'WATER':
        engineRef.current.fireWaterCannon();
        break;
    }
  };

  const handleMobileInput = (newInput: MovementInput) => {
    inputRef.current = newInput;
    if (engineRef.current) {
      engineRef.current.updateLocalInput(newInput);
    }
  };

  const handleToggleCamera = () => {
    if (engineRef.current) {
      setCameraMode(engineRef.current.toggleCameraMode());
    }
  };

  const handleToggleMute = () => {
    setIsMuted(audioManager.toggleMute());
  };

  const handleSelectGraphics = (q: GraphicsQuality) => {
    if (engineRef.current) {
      engineRef.current.setGraphicsQuality(q);
    }
  };

  const handleSelectTimeOfDay = (t: TimeOfDay) => {
    if (engineRef.current) {
      engineRef.current.setTimeOfDay(t);
    }
  };

  const handleSelectWeather = (w: WeatherCondition) => {
    if (engineRef.current) {
      engineRef.current.setWeather(w);
    }
  };

  const handleUpdatePlacard = (text: string) => {
    if (engineRef.current) {
      engineRef.current.setPlacardText(text);
    }
  };

  const handleSelectVolume = (vol: number) => {
    setVolume(vol);
    audioManager.setVolume(vol);
  };

  const handleSelectCameraSensitivity = (sens: number) => {
    setCameraSensitivity(sens);
    if (engineRef.current) {
      engineRef.current.setCameraSensitivity(sens);
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setIsLoadingAssets(false);
    setIsPlaying(false);
    setIsSettingsOpen(false);
    setIsPhotoBoothOpen(false);
  };

  return (
    <div
      onPointerDown={resetUIIdleTimer}
      onTouchStart={resetUIIdleTimer}
      onMouseMove={resetUIIdleTimer}
      className="fixed inset-0 w-full h-full min-h-[100dvh] h-[100dvh] overflow-hidden bg-slate-950 font-sans select-none touch-none"
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        id="awaaz-3d-viewport"
        className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950"
      />

      {/* On-screen diagnostic error banner */}
      {launchError && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-11/12 p-4 rounded-2xl bg-rose-950/95 border border-rose-500 text-rose-200 text-sm shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <span className="leading-snug">{launchError}</span>
          </div>
          <button
            onClick={() => setLaunchError(null)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Floating Landscape Orientation Suggestion for Mobile in Portrait */}
      {isPlaying && isMobileDevice && !isLandscape && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 rounded-full glass-panel border border-cyan-400/50 bg-slate-900/90 text-cyan-300 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-xl active:scale-95"
          >
            <Smartphone className="w-4 h-4 text-pink-400 rotate-90 animate-pulse" />
            <span>Rotate to Landscape or Tap for Fullscreen ⛶</span>
          </button>
        </div>
      )}

      {/* Main Game In-Play Overlays */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <HUD
            matchState={matchState}
            stamina={stamina}
            cameraMode={cameraMode}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            isImmersiveMode={isImmersiveMode}
            isUIHidden={isUIIdle}
            isPointerLocked={isPointerLocked}
            isTouchDevice={isMobileDevice}
            abilityCooldowns={engineRef.current?.abilityCooldowns}
            onToggleCamera={handleToggleCamera}
            onRecenterCamera={() => engineRef.current?.recenterCamera()}
            onToggleMute={handleToggleMute}
            onToggleFullscreen={toggleFullscreen}
            onToggleImmersiveMode={() => setIsImmersiveMode(!isImmersiveMode)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenPhotoBooth={() => setIsPhotoBoothOpen(true)}
            onOpenSupport={() => setIsSupportOpen(true)}
            onUseAbility={handleUseAbility}
            onInteractStation={() => engineRef.current?.interactWithStation()}
            onTapDetained={() => engineRef.current?.handleMinigameTap()}
          />

          <LiveStreamFeed
            comments={comments}
            superchats={matchState.superchats}
            isUIHidden={isUIIdle}
            isImmersiveMode={isImmersiveMode}
          />

          <MobileControls
            onInput={handleMobileInput}
            currentInput={inputRef.current}
            team={matchState.localTeam}
            onUseAbility={handleUseAbility}
            onRotateCamera={(dx, dy) => engineRef.current?.rotateCamera(dx, dy)}
            onZoomCamera={(dz) => engineRef.current?.zoomCamera(dz)}
            onRecenterCamera={() => engineRef.current?.recenterCamera()}
            abilityCooldowns={engineRef.current?.abilityCooldowns}
            isUIIdle={isUIIdle}
            onUserInteraction={resetUIIdleTimer}
            nearInteractiveStation={matchState.nearInteractiveStation}
            onInteractStation={() => engineRef.current?.interactWithStation()}
            detentionCountdown={matchState.detentionCountdown}
            onTapDetained={() => engineRef.current?.handleMinigameTap()}
          />

          <MinigameOverlay
            type={matchState.activeMinigame}
            progress={matchState.minigameProgress}
            onTap={() => {
              resetUIIdleTimer();
              engineRef.current?.handleMinigameTap();
            }}
          />

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            graphicsQuality={matchState.graphicsQuality}
            onSelectGraphics={handleSelectGraphics}
            timeOfDay={matchState.timeOfDay}
            onSelectTimeOfDay={handleSelectTimeOfDay}
            weather={matchState.weather}
            onSelectWeather={handleSelectWeather}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            volume={volume}
            onSelectVolume={handleSelectVolume}
            cameraSensitivity={cameraSensitivity}
            onSelectCameraSensitivity={handleSelectCameraSensitivity}
            placardText={matchState.placardText}
            onUpdatePlacard={handleUpdatePlacard}
          />

          <PhotoBoothModal
            isOpen={isPhotoBoothOpen}
            onClose={() => setIsPhotoBoothOpen(false)}
            canvasElement={engineRef.current?.renderer.domElement || null}
          />
        </div>
      )}

      {/* RAM Asset Preloading Screen */}
      {isLoadingAssets && (
        <LoadingOverlay progress={loadingProgress} status={loadingStatus} />
      )}

      {/* Team Selection & Mode Modal */}
      {!isPlaying && !isLoadingAssets && (
        <TeamSelectModal
          onStartGame={handleStartGame}
          onOpenSupport={() => setIsSupportOpen(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Victory / Defeat Modal */}
      {isPlaying && matchState.isGameOver && (
        <VictoryModal matchState={matchState} onRestart={handleRestart} />
      )}

      {/* Global Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
};

export default App;
