export type Team = 'PROTESTOR' | 'POLICE';

export type GameMode = 'SOLO' | 'MULTIPLAYER';

export type MapId = 'DELHI' | 'PARIS';

export type MinigameType = 'NONE' | 'STRUGGLE' | 'CANISTER' | 'BUS_RESCUE';

export type CameraViewMode = 'CHASE' | 'TACTICAL' | 'FIRST_PERSON';

export type GraphicsQuality = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TimeOfDay = 'GOLDEN_HOUR' | 'NIGHT_RALLY' | 'MIDDAY';

export type WeatherCondition = 'CLEAR_GOLDEN' | 'MONSOON_RAIN' | 'NIGHT_CYBERPUNK';

export type PowerUpType = 'ENERGY_CHAI' | 'AMP_BOOST' | 'WIFI_HOTSPOT' | 'PEACE_AURA' | 'CONE_TRAP' | 'COIN_MAGNET';

export type KafilaCommand = 'FOLLOW' | 'RUSH' | 'DHARNA' | 'SCATTER';

export type AstronomicalZone = 'NONE' | 'SAMRAT_SUMMIT' | 'JAI_PRAKASH_BOWL' | 'RAM_YANTRA_MAZE';

export type DifficultyMode = 'CHILL' | 'STANDARD' | 'HARDCORE';

export type EmoteType = 'BHANGRA' | 'FIST_PUMP' | 'BACKFLIP' | 'CHAI_SIP' | 'MEGAPHONE_SOLO';

export type RadioStation = 'OFF' | 'DHOL_BRASS' | 'SYNTHWAVE' | 'CHILLHOP' | 'AMBIENCE';

export type JacketStyle = 'ELECTRIC_PINK' | 'TACTICAL_BLUE' | 'CYBER_YELLOW' | 'KHADI_GREEN' | 'PARIS_TRICOLORE';

export type HeadwearStyle = 'NONE' | 'AVIATORS' | 'PRESS_BERET' | 'STREET_BEANIE' | 'BANDANA';

export type PlacardStyle = 'NEON_CYBER' | 'CARDBOARD' | 'GOLD_LEAF' | 'FLAG_BANNER';

export interface WardrobeConfig {
  jacket: JacketStyle;
  headwear: HeadwearStyle;
  placardStyle: PlacardStyle;
}

export interface PickupItem {
  id: string;
  type: 'COIN' | 'CHAI_CUP' | 'MAGNET' | 'ENERGY_STAR';
  position: { x: number; y: number; z: number };
  value: number;
  collected: boolean;
}

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  position: { x: number; y: number; z: number };
  duration: number; // effect duration in seconds
  respawnTimer?: number;
}

export interface SuperChat {
  id: string;
  user: string;
  amount: number;
  message: string;
  timestamp: number;
}

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
  activePowerUp?: PowerUpType | null;
  powerUpTimeRemaining?: number;
  invulnerabilityTimer?: number;
  stunTimer?: number;
  currentAction?: 'CHANTING' | 'LIVESTREAMING' | 'PLACING_BARRICADE' | 'THROWING_SMOKE' | 'IDLE';
  isFollowingLeader?: boolean;
  kafilaOffset?: { x: number; z: number };
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
  type: 'LOCAL' | 'PROTESTOR' | 'POLICE' | 'BUS' | 'DRONE' | 'POWERUP' | 'LANDMARK';
  x: number;
  z: number;
  rotation?: number;
  isDetained?: boolean;
  powerUpType?: PowerUpType;
  label?: string;
  icon?: string;
}

export interface ActiveMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: string;
  progress: number;
  target: number;
  isCompleted: boolean;
}

export interface FloatingNotification {
  id: string;
  text: string;
  type: 'SCORE' | 'COMBO' | 'MISSION' | 'RESCUE' | 'IMMUNITY';
  timestamp: number;
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
  weather: WeatherCondition;
  radarEntities: RadarEntity[];
  droneSpotlightPos: { x: number; z: number };
  isPlayerInSpotlight: boolean;
  humanChainActive: boolean;
  placardText: string;
  activePowerUp: PowerUpType | null;
  powerUpTimeLeft: number;
  superchats: SuperChat[];
  isPhotoMode: boolean;
  mapId: MapId;
  detentionCountdown?: number;
  invulnerabilityTimer?: number;
  activeMission?: ActiveMission | null;
  floatingNotifications?: FloatingNotification[];
  scoreMultiplier?: number;
  kafilaCount?: number;
  kafilaCommand?: KafilaCommand;
  activeAstronomicalZone?: AstronomicalZone;
  leafletsRemaining?: number;
  dholTempo?: number;
  heatLevel?: number;
  coinsCollected?: number;
  totalCoinsInMap?: number;
  radioStation?: RadioStation;
  currentRadioStation?: RadioStation;
  difficultyMode?: DifficultyMode;
  activeEmote?: EmoteType | null;
  currentEmote?: EmoteType | null;
  wardrobe?: WardrobeConfig;
  wardrobeConfig?: WardrobeConfig;
  flowCombo?: number;
  flowMultiplier?: number;
  nearInteractiveStation?: {
    type: 'CHAI_TAPRI' | 'CAFE_TABLE' | 'PARKOUR_PAD';
    label: string;
    actionText: string;
  } | null;
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
    | 'POWERUP_COLLECT'
    | 'MATCH_SYNC';
  payload: any;
  senderId: string;
  timestamp: number;
}
