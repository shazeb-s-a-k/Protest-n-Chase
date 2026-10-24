import React, { useEffect, useRef, useState } from 'react';
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
import { audioManager } from './engine/AudioManager';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPhotoBoothOpen, setIsPhotoBoothOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

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
  });

  const [stamina, setStamina] = useState(100);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('CHASE');
  const [isMuted, setIsMuted] = useState(false);
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

  // Start Match
  const handleStartGame = (team: Team, mode: GameMode, roomCode?: string) => {
    setLaunchError(null);
    try {
      console.log('🎮 Starting Awaaz Match:', { team, mode, roomCode });

      if (!containerRef.current) {
        console.warn('⚠️ containerRef.current is not attached yet, retrying in next tick...');
        setTimeout(() => handleStartGame(team, mode, roomCode), 50);
        return;
      }

      if (engineRef.current) {
        try {
          engineRef.current.destroy();
        } catch (destroyErr) {
          console.warn('Note while destroying previous engine:', destroyErr);
        }
      }

      const engine = new GameEngine(containerRef.current, mode, team, roomCode);
      engineRef.current = engine;

      engine.onStateUpdate = (newState) => {
        setMatchState(newState);
        if (engine.localPlayer) {
          setStamina(Math.round(engine.localPlayer.currentStamina));
        }
      };

      engine.onLiveStreamComment = (commentText) => {
        const users = ['PoojaLive', 'RohanYouth', 'Kavita_Now', 'GenZPower', 'Simran_V', 'ArjunDelhi', 'Vikram_S'];
        const emojis = ['❤️', '🔥', '📢', '✊', '⚡️', '🌟'];
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

      setIsPlaying(true);
    } catch (err: any) {
      console.error('❌ Error during GameEngine initialization:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setLaunchError(msg);
      setIsPlaying(false);
    }
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || !engineRef.current) return;

      // Minigame Rapid Mash
      if (e.code === 'Space' || e.code === 'KeyE') {
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
        // Abilities
        case 'KeyQ':
          if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.triggerMegaphoneBlast();
          } else {
            engineRef.current.deployBarricade();
          }
          break;
        case 'KeyF':
          if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.triggerLiveStreamHype();
          } else {
            engineRef.current.fireWaterCannon();
          }
          break;
        case 'KeyR':
          if (matchState.localTeam === 'POLICE') {
            engineRef.current.throwSmokeCanister();
          }
          break;
        case 'KeyE':
          if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.triggerBusJailbreak();
          }
          break;
        case 'KeyH':
          if (matchState.localTeam === 'PROTESTOR') {
            engineRef.current.toggleHumanChain();
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
  }, [isPlaying, matchState.activeMinigame, matchState.localTeam, isPhotoBoothOpen]);

  // Ability Click Trigger from HUD or Mobile Controls
  const handleUseAbility = (ability: string) => {
    if (!engineRef.current) return;
    switch (ability) {
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

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setIsPlaying(false);
    setIsSettingsOpen(false);
    setIsPhotoBoothOpen(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
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

      {/* Main Game In-Play Overlays */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <HUD
            matchState={matchState}
            stamina={stamina}
            cameraMode={cameraMode}
            isMuted={isMuted}
            onToggleCamera={handleToggleCamera}
            onToggleMute={handleToggleMute}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenPhotoBooth={() => setIsPhotoBoothOpen(true)}
            onOpenSupport={() => setIsSupportOpen(true)}
            onUseAbility={handleUseAbility}
          />

          <LiveStreamFeed
            comments={comments}
            superchats={matchState.superchats}
          />

          <MobileControls
            onInput={handleMobileInput}
            currentInput={inputRef.current}
            team={matchState.localTeam}
            onUseAbility={handleUseAbility}
          />

          <MinigameOverlay
            type={matchState.activeMinigame}
            progress={matchState.minigameProgress}
            onTap={() => engineRef.current?.handleMinigameTap()}
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

      {/* Team Selection & Mode Modal */}
      {!isPlaying && (
        <TeamSelectModal
          onStartGame={handleStartGame}
          onOpenSupport={() => setIsSupportOpen(true)}
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
