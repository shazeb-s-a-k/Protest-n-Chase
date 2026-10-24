import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './engine/GameEngine';
import { Team, GameMode, GameMatchState, CameraViewMode, LiveStreamComment, MinigameType } from './types/game';
import { MovementInput } from './engine/CharacterController';
import { HUD } from './components/HUD';
import { LiveStreamFeed } from './components/LiveStreamFeed';
import { MinigameOverlay } from './components/MinigameOverlay';
import { MobileControls } from './components/MobileControls';
import { TeamSelectModal } from './components/TeamSelectModal';
import { VictoryModal } from './components/VictoryModal';
import { audioManager } from './engine/AudioManager';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI States
  const [isPlaying, setIsPlaying] = useState(false);
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
    if (!containerRef.current) return;

    // Clean existing engine if any
    if (engineRef.current) {
      engineRef.current.destroy();
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
      const users = ['PoojaLive', 'RohanYouth', 'Kavita_Now', 'GenZPower', 'Simran_V', 'ArjunDelhi'];
      const emojis = ['❤️', '🔥', '📢', '✊', '⚡️'];
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
        case 'KeyV':
          setCameraMode(engineRef.current.toggleCameraMode());
          break;
        case 'KeyM':
          setIsMuted(audioManager.toggleMute());
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
  }, [isPlaying, matchState.activeMinigame, matchState.localTeam]);

  // Ability Click Trigger from HUD
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

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setIsPlaying(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Main Game In-Play Overlays */}
      {isPlaying && (
        <>
          {/* Top & Bottom In-Game HUD */}
          <HUD
            matchState={matchState}
            stamina={stamina}
            cameraMode={cameraMode}
            isMuted={isMuted}
            onToggleCamera={handleToggleCamera}
            onToggleMute={handleToggleMute}
            onUseAbility={handleUseAbility}
          />

          {/* Floating Gen-Z Live Stream Reactions */}
          <LiveStreamFeed comments={comments} />

          {/* Mobile Touch Virtual Controls */}
          <MobileControls
            onInput={handleMobileInput}
            currentInput={inputRef.current}
          />

          {/* Struggle & Canister Rapid-Tap Minigame */}
          <MinigameOverlay
            type={matchState.activeMinigame}
            progress={matchState.minigameProgress}
            onTap={() => engineRef.current?.handleMinigameTap()}
          />
        </>
      )}

      {/* Team Selection & Mode Modal */}
      {!isPlaying && <TeamSelectModal onStartGame={handleStartGame} />}

      {/* Victory / Defeat Modal */}
      {isPlaying && matchState.isGameOver && (
        <VictoryModal matchState={matchState} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default App;
