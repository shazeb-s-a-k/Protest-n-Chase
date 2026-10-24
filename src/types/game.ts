export type Team = 'PROTESTOR' | 'POLICE';

export type GameMode = 'SOLO' | 'MULTIPLAYER';

export type MinigameType = 'NONE' | 'STRUGGLE' | 'CANISTER' | 'BUS_RESCUE';

export type CameraViewMode = 'CHASE' | 'TACTICAL' | 'FIRST_PERSON';

export type GraphicsQuality = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TimeOfDay = 'GOLDEN_HOUR' | 'NIGHT_RALLY' | 'MIDDAY';

export interface PlayerStats {
  speed: number;
  sprintMultiplier: number;
  stamina: number;
  maxStamina: number;
  megaphoneCooldown: number;
  barricadeCooldown: number;
  smokeCooldown: number;
  waterCooldown: number;
  humanChainCooldown: number;
}

export interface PlayerState {
  id: string;
  name: string;
  team: Team;
  isLocal: boolean;
  isAI: boolean;
  position: { x: number; y: number; z: number };
  rotation: number; // Y-axis rotation in radians
  isSprinting: boolean;
  isSliding: boolean;
  isJumping: boolean;
  isDetained: boolean;
  isGrappled: boolean;
  isInHumanChain?: boolean;
  grappledById?: string;
  awarenessContribution: number;
  placardText?: string;
  currentAction?: 'CHANTING' | 'LIVESTREAMING' | 'PLACING_BARRICADE' | 'THROWING_SMOKE' | 'IDLE';
}

export interface DetainmentBus {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  detainedCount: number;
  maxCapacity: number;
  isRescueActive: boolean;
  rescueProgress: number; // 0 to 100
}

export interface ActiveBarricade {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  placedBy: string;
  health: number;
}

export interface ActiveCanister {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  timer: number; // seconds until detonation
  isDetonated: boolean;
  isKickedAway: boolean;
}

export interface LiveStreamComment {
  id: string;
  user: string;
  text: string;
  emoji?: string;
  timestamp: number;
}

export interface RadarEntity {
  id: string;
  type: 'LOCAL' | 'PROTESTOR' | 'POLICE' | 'BUS' | 'DRONE';
  x: number;
  z: number;
  rotation?: number;
  isDetained?: boolean;
}

export interface GameMatchState {
  mode: GameMode;
  localPlayerId: string;
  localTeam: Team;
  awarenessScore: number; // 0 to 100 (Protestor victory condition)
  detainedScore: number;  // 0 to 8 (Police victory condition)
  timeRemaining: number;  // match duration (e.g. 180s)
  isGameOver: boolean;
  winner: Team | null;
  viewerCount: number;
  activeMinigame: MinigameType;
  minigameProgress: number; // 0 to 100
  canisterIdTargeted?: string;
  graphicsQuality: GraphicsQuality;
  timeOfDay: TimeOfDay;
  radarEntities: RadarEntity[];
  droneSpotlightPos: { x: number; z: number };
  isPlayerInSpotlight: boolean;
  humanChainActive: boolean;
  placardText: string;
}

export interface NetworkMessage {
  type: 
    | 'PLAYER_UPDATE'
    | 'ABILITY_USED'
    | 'MINIGAME_TRIGGER'
    | 'MINIGAME_RESULT'
    | 'DETAINED_EVENT'
    | 'RESCUE_EVENT'
    | 'BARRICADE_SPAWN'
    | 'CANISTER_SPAWN'
    | 'HUMAN_CHAIN_TOGGLE'
    | 'MATCH_SYNC';
  payload: any;
  senderId: string;
  timestamp: number;
}
