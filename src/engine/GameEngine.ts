import * as THREE from 'three';
import {
  Team,
  GameMode,
  PlayerState,
  GameMatchState,
  MinigameType,
  CameraViewMode,
  GraphicsQuality,
  TimeOfDay,
  WeatherCondition,
  PowerUpType,
  RadarEntity,
  SuperChat,
  MapId,
  ActiveMission,
  FloatingNotification,
  KafilaCommand,
  AstronomicalZone,
  DifficultyMode,
  EmoteType,
  RadioStation,
  WardrobeConfig,
} from '../types/game';
import { MapBuilder, Collider } from './MapBuilder';
import { CharacterController, MovementInput } from './CharacterController';
import { AIController } from './AIController';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from './AudioManager';
import { NetworkManager } from './NetworkManager';
import { PowerUpManager } from './PowerUpManager';
import { WeatherManager } from './WeatherManager';
import { WildlifeManager } from './WildlifeManager';
import { SkyAtmosphere } from './SkyAtmosphere';
import { TextureGenerator } from './TextureGenerator';
import { PickupManager } from './PickupManager';
import { GamepadManager } from './GamepadManager';
import { WardrobeManager } from './WardrobeManager';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  public selectedMap: MapId = 'DELHI';

  // Systems
  public mapBuilder: MapBuilder;
  public particleSystem: ParticleSystem;
  public aiController: AIController;
  public networkManager: NetworkManager;
  public powerUpManager: PowerUpManager;
  public weatherManager: WeatherManager;
  public wildlifeManager: WildlifeManager;
  public skyAtmosphere: SkyAtmosphere;
  public pickupManager: PickupManager;
  public gamepadManager: GamepadManager;
  public wardrobeManager: WardrobeManager;
  private composer: EffectComposer | null = null;
  public isPointerLocked: boolean = false;
  public onPointerLockChange?: (locked: boolean) => void;
  public activeMissionsList: ActiveMission[] = [];
  public currentMissionIndex: number = 0;

  // Entities
  public localPlayer: CharacterController | null = null;
  public remotePlayers: Map<string, CharacterController> = new Map();
  public aiPlayers: CharacterController[] = [];
  public colliders: Collider[] = [];
  public busPositions: { x: number; y: number; z: number; id: string }[] = [];

  // Match State
  public matchState: GameMatchState;
  public cameraMode: CameraViewMode = 'CHASE';
  public cameraDistance: number = 7.5;
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.28;
  private isMouseDragging: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;
  public abilityCooldowns: Map<string, number> = new Map();
  public isReadyToPlay: boolean = false;

  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private superchatTimer: number = 0;
  private uiUpdateTimer: number = 0;
  private dholBeatTimer: number = 0;
  private dholBeatCount: number = 0;

  // Callbacks to React UI
  public onStateUpdate?: (state: GameMatchState) => void;
  public onMinigameTrigger?: (type: MinigameType) => void;
  public onLiveStreamComment?: (comment: string) => void;

  // Active Throwables
  public activeCanisters: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    timer: number;
    id: string;
  }[] = [];

  // Static scratch vectors for Zero-GC frame updates
  private static readonly _idealCamPos = new THREE.Vector3();
  private static readonly _lookTarget = new THREE.Vector3();
  private static readonly _headPos = new THREE.Vector3();
  private static readonly _frontDir = new THREE.Vector3();
  private static readonly _tacticalPos = new THREE.Vector3();
  private static readonly _camRay = new THREE.Ray();
  private static readonly _hitPoint = new THREE.Vector3();
  private droneFlashTimer: number = 0;
  private _radarEntitiesPool: RadarEntity[] = [];
  private drsScale: number = 1.0;
  private consecutiveSlowFrames: number = 0;
  private consecutiveFastFrames: number = 0;

  private static readonly _delhiLandmarks: ReadonlyArray<RadarEntity> = [
    { id: 'lm_samrat_yantra', type: 'LANDMARK', x: 0, z: -25, icon: '🏛️', label: 'Samrat Yantra' },
    { id: 'lm_stage', type: 'LANDMARK', x: 0, z: 15, icon: '📢', label: 'Main Stage' },
    { id: 'lm_chai_tapri', type: 'LANDMARK', x: -46, z: -14, icon: '☕', label: 'Chai Tapri' },
  ];

  private static readonly _bastilleLandmarks: ReadonlyArray<RadarEntity> = [
    { id: 'lm_colonne', type: 'LANDMARK', x: 0, z: 0, icon: '🗼', label: 'Colonne Bastille' },
    { id: 'lm_opera', type: 'LANDMARK', x: 58, z: 0, icon: '🎭', label: 'Opéra Bastille' },
    { id: 'lm_wallace_north', type: 'LANDMARK', x: -26, z: 30, icon: '💧', label: 'Fontaine Wallace' },
    { id: 'lm_wallace_south', type: 'LANDMARK', x: 26, z: -30, icon: '💧', label: 'Fontaine Wallace' },
  ];

  private getRadarSlot(idx: number): RadarEntity {
    if (!this._radarEntitiesPool[idx]) {
      this._radarEntitiesPool[idx] = {
        id: '',
        type: 'LOCAL',
        x: 0,
        z: 0,
      };
    }
    const slot = this._radarEntitiesPool[idx];
    slot.rotation = undefined;
    slot.isDetained = undefined;
    slot.powerUpType = undefined;
    slot.label = undefined;
    slot.icon = undefined;
    return slot;
  }

  public screenShakeIntensity: number = 0;

  public addScreenShake(intensity: number) {
    this.screenShakeIntensity = Math.min(1.2, this.screenShakeIntensity + intensity);
  }

  public recenterCamera() {
    if (!this.localPlayer) return;
    this.cameraYaw = this.localPlayer.mesh.rotation.y + Math.PI;
    this.cameraPitch = 0.28;
    this.snapCameraToPlayer();
  }

  constructor(
    container: HTMLElement,
    mode: GameMode,
    team: Team,
    roomCode?: string,
    mapId: MapId = 'DELHI'
  ) {
    this.selectedMap = mapId;
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(mapId === 'PARIS' ? 0x0f172a : 0xdbeafe);
    this.scene.fog = new THREE.FogExp2(mapId === 'PARIS' ? 0x1e293b : 0xfef08a, mapId === 'PARIS' ? 0.0035 : 0.0022);

    const width = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280) || 1280;
    const height = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 720) || 720;

    this.camera = new THREE.PerspectiveCamera(
      65,
      width / height,
      0.1,
      500
    );

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'default',
        preserveDrawingBuffer: true, // Allows high-res screenshots for PhotoBooth
      });
    } catch (e1) {
      console.warn('High-res WebGL failed, trying basic WebGL:', e1);
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          preserveDrawingBuffer: false,
        });
      } catch (e2) {
        console.error('WebGL context creation failed:', e2);
        throw new Error('WebGL 3D graphics context could not be created. Please ensure Hardware Acceleration is enabled in your browser settings.');
      }
    }

    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent || '');
    const maxDPR = isMobile ? 1.35 : 2.0;

    this.renderer = renderer;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, maxDPR));

    try {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (shadowErr) {
      console.warn('ShadowMap disabled on this hardware:', shadowErr);
    }

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(this.renderer.domElement);

    // Systems
    this.mapBuilder = new MapBuilder();
    this.particleSystem = new ParticleSystem(this.scene);
    this.aiController = new AIController();
    this.networkManager = new NetworkManager();
    this.powerUpManager = new PowerUpManager(this.scene, this.selectedMap);
    this.weatherManager = new WeatherManager(this.scene);
    this.wildlifeManager = new WildlifeManager(this.scene);
    this.skyAtmosphere = new SkyAtmosphere(this.scene);
    this.wardrobeManager = new WardrobeManager();
    this.gamepadManager = new GamepadManager();
    this.pickupManager = new PickupManager(this.scene, this.selectedMap);

    // GTA Vice City Cinematic Post-Processing Pipeline: UnrealBloomPass & Tone Mapping
    // On mobile devices, bloom runs at half resolution to cut fillrate overhead by 75% with zero quality loss
    try {
      const renderPass = new RenderPass(this.scene, this.camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(
          isMobile ? Math.floor(width / 2) : width,
          isMobile ? Math.floor(height / 2) : height
        ),
        0.58, // Bloom Strength
        0.42, // Bloom Radius
        0.80  // Bloom Threshold (Sirens, neon, headlights, gold statues bloom)
      );
      const outputPass = new OutputPass();

      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(renderPass);
      this.composer.addPass(bloomPass);

      // On PC and high-end hardware, add SMAAPass for crisp, edge-perfect anti-aliasing
      if (!isMobile) {
        try {
          const pixelRatio = this.renderer.getPixelRatio();
          const smaaPass = new SMAAPass(width * pixelRatio, height * pixelRatio);
          this.composer.addPass(smaaPass);
        } catch (smaaErr) {
          console.warn('SMAAPass fallback:', smaaErr);
        }
      }

      this.composer.addPass(outputPass);
    } catch (compErr) {
      console.warn('EffectComposer fallback to standard WebGL renderer:', compErr);
      this.composer = null;
    }

    // Default Match State
    this.matchState = {
      mode,
      localPlayerId: 'player_' + Math.random().toString(36).substring(2, 7),
      localTeam: team,
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
      placardText: this.selectedMap === 'PARIS' ? 'LIBERTÉ 2026' : 'AWAAZ 2026',
      activePowerUp: null,
      powerUpTimeLeft: 0,
      superchats: [
        this.selectedMap === 'PARIS'
          ? { id: 'sc_paris', user: 'BastilleEcho', amount: 50, message: 'Solidarité depuis Paris! 🇫🇷✊', timestamp: Date.now() }
          : { id: 'sc_init', user: 'DelhiEcho', amount: 500, message: 'Solidarity with the youth! ✊', timestamp: Date.now() },
      ],
      isPhotoMode: false,
      mapId: this.selectedMap,
      detentionCountdown: 0,
      invulnerabilityTimer: 4.0,
      activeMission: null,
      floatingNotifications: [],
      scoreMultiplier: 1,
      nearInteractiveStation: null,
      kafilaCount: 0,
      kafilaCommand: 'FOLLOW',
      activeAstronomicalZone: 'NONE',
      leafletsRemaining: 3,
      dholTempo: 90,
      heatLevel: 15,
      coinsCollected: 0,
      radioStation: 'OFF',
      difficultyMode: 'STANDARD',
      wardrobe: this.wardrobeManager.getConfig(),
    };

    // Build World
    this.setupWorld();

    // Spawn Characters
    this.spawnLocalPlayer(team);
    this.spawnAIUnits(mode, team);
    this.initMissions();
    if (this.localPlayer) {
      this.localPlayer.state.invulnerabilityTimer = 4.0;
    }
    this.addFloatingNotification('🌟 MATCH STARTED! 4s GHOST SHIELD ACTIVE', 'IMMUNITY');

    // Audio & Loop
    try {
      audioManager.init();
      audioManager.startAmbientProtestLoop();
    } catch (e) {
      console.warn('Audio initialization note:', e);
    }

    // Setup Network if Multiplayer
    if (mode === 'MULTIPLAYER') {
      try {
        this.setupMultiplayer(roomCode);
      } catch (e) {
        console.warn('Multiplayer initialization note:', e);
      }
    }

    // Controls & Listeners
    this.setupMouseControls();
    window.addEventListener('resize', this.onResize);

    // Start Loop
    this.animate();
  }

  private setupWorld() {
    if (this.selectedMap === 'PARIS') {
      const { colliders, busPositions } = this.mapBuilder.buildParisBastille(this.scene);
      this.colliders = colliders;
      this.busPositions = busPositions;
    } else {
      const { colliders, busPositions } = this.mapBuilder.buildJantarMantar(this.scene);
      this.colliders = colliders;
      this.busPositions = busPositions;
    }

    this.setupEnvironmentLighting();
    this.loadHighFidelityProps();
  }

  private setupEnvironmentLighting() {
    try {
      const cubeLoader = new THREE.CubeTextureLoader();
      const isParis = this.selectedMap === 'PARIS';
      cubeLoader.setPath(isParis ? '/textures/cube/pisa/' : '/textures/cube/park/');
      const files = isParis
        ? ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']
        : ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'];
      cubeLoader.load(
        files,
        (cubeTexture) => {
          cubeTexture.colorSpace = THREE.SRGBColorSpace;
          this.scene.environment = cubeTexture;
        },
        undefined,
        (err) => console.warn('Cubemap environment load failed:', err)
      );
    } catch (e) {
      console.warn('CubeTextureLoader setup error:', e);
    }
  }

  private loadHighFidelityProps() {
    const gltfLoader = new GLTFLoader();

    // 1. High-Detail Retro Boombox on Protest Rally Stage (GLTF)
    gltfLoader.load(
      '/models/BoomBox.glb',
      (gltf) => {
        const boombox = gltf.scene;
        // Bounding box indicates ~0.02m native dimensions, scale by 75 to reach ~1.5m realistic stage monitor
        boombox.scale.set(75, 75, 75);
        boombox.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        if (this.selectedMap === 'PARIS') {
          boombox.position.set(0, 1.2, 34);
          boombox.rotation.y = 0;
        } else {
          boombox.position.set(0, 1.2, 0);
          boombox.rotation.y = Math.PI;
        }
        this.scene.add(boombox);
      },
      undefined,
      (err) => console.warn('BoomBox.glb load skipped:', err)
    );

    // 2. High-Detail Ceramic Chai / Coffee Mug on Tapri Counter (GLTF)
    gltfLoader.load(
      '/models/coffeeMug.glb',
      (gltf) => {
        const mug = gltf.scene;
        // Bounding box is ~10 units, scale by 0.04 to reach ~0.4m mug
        mug.scale.set(0.04, 0.04, 0.04);
        mug.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        if (this.selectedMap === 'PARIS') {
          mug.position.set(22, 0.9, -15);
        } else {
          mug.position.set(-46, 1.0, -14);
        }
        this.scene.add(mug);
      },
      undefined,
      (err) => console.warn('coffeeMug.glb load skipped:', err)
    );
  }

  public requestPointerLock() {
    const el = this.renderer?.domElement;
    if (!el) return;
    try {
      if (document.pointerLockElement !== el) {
        el.requestPointerLock();
      }
    } catch (err) {
      console.warn('requestPointerLock failed:', err);
    }
  }

  public exitPointerLock() {
    try {
      if (document.pointerLockElement === this.renderer?.domElement) {
        document.exitPointerLock();
      }
    } catch (err) {
      console.warn('exitPointerLock failed:', err);
    }
  }

  public cameraSensitivity: number = 1.0;

  public setCameraSensitivity(val: number) {
    this.cameraSensitivity = THREE.MathUtils.clamp(val, 0.25, 2.5);
  }

  public rotateCamera(deltaX: number, deltaY: number = 0) {
    this.cameraYaw -= deltaX * 0.007 * this.cameraSensitivity;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + deltaY * 0.005 * this.cameraSensitivity, -0.22, 0.72);
  }

  public zoomCamera(deltaZoom: number) {
    this.cameraDistance = THREE.MathUtils.clamp(
      this.cameraDistance + deltaZoom,
      3.5,
      16.0
    );
  }

  private setupMouseControls() {
    const el = this.renderer.domElement;

    // 1. Pointer Lock on Canvas Click (Direct PC 360 FPS-style mouse look)
    el.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === el;
      if (this.onPointerLockChange) {
        this.onPointerLockChange(this.isPointerLocked);
      }
    });

    // 2. Mouse Move: handles both Pointer Lock (seamless 360 look) & Drag fallback
    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        // Direct continuous mouse look without holding any buttons!
        this.rotateCamera(e.movementX * 0.45, e.movementY * 0.45);
      } else if (this.isMouseDragging) {
        const deltaX = e.clientX - this.previousMouseX;
        const deltaY = e.clientY - this.previousMouseY;
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
        this.rotateCamera(deltaX, deltaY);
      }
    });

    // 3. Desktop Mouse Drag fallback when not pointer locked
    el.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked && (e.button === 2 || e.button === 0)) {
        this.isMouseDragging = true;
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDragging = false;
    });

    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoomCamera(e.deltaY * 0.008);
      },
      { passive: false }
    );

    el.addEventListener('contextmenu', (e) => e.preventDefault());

    // 4. Direct Touch Event Handlers on Canvas (Mobile Swiping & Pinch Zoom)
    let touchPrevX = 0;
    let touchPrevY = 0;
    let touchDistStart = 0;

    el.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          touchPrevX = e.touches[0].clientX;
          touchPrevY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          touchDistStart = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      },
      { passive: true }
    );

    el.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 1) {
          const deltaX = e.touches[0].clientX - touchPrevX;
          const deltaY = e.touches[0].clientY - touchPrevY;
          touchPrevX = e.touches[0].clientX;
          touchPrevY = e.touches[0].clientY;
          this.rotateCamera(deltaX, deltaY);
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const deltaDist = (touchDistStart - dist) * 0.02;
          touchDistStart = dist;
          this.zoomCamera(deltaDist);
        }
      },
      { passive: true }
    );
  }

  private spawnLocalPlayer(team: Team) {
    const isProtestor = team === 'PROTESTOR';
    const spawnPos = isProtestor
      ? new THREE.Vector3((Math.random() - 0.5) * 6, 0, 18)
      : new THREE.Vector3((Math.random() - 0.5) * 6, 0, 46);

    // Initial camera orient towards map center
    this.cameraYaw = isProtestor ? 0 : Math.PI;
    this.cameraPitch = 0.28;
    this.cameraDistance = 7.5;

    const state: PlayerState = {
      id: this.matchState.localPlayerId,
      name: isProtestor ? 'You (Voice)' : 'You (Officer)',
      team,
      isLocal: true,
      isAI: false,
      position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
      rotation: isProtestor ? Math.PI : 0, // Faces North into monument plaza
      isSprinting: false,
      isSliding: false,
      isJumping: false,
      isDetained: false,
      isGrappled: false,
      awarenessContribution: 0,
      placardText: this.matchState.placardText,
      activePowerUp: null,
      powerUpTimeRemaining: 0,
    };

    this.localPlayer = new CharacterController(this.scene, state, this.wardrobeManager.getConfig());
    this.localPlayer.particleSystem = this.particleSystem;
    this.snapCameraToPlayer();
  }

  private spawnAIUnits(mode: GameMode, localTeam: Team) {
    const copCount = localTeam === 'POLICE' ? 3 : 5;
    const protestorCount = localTeam === 'PROTESTOR' ? 5 : 7;

    for (let i = 0; i < copCount; i++) {
      const spawnX = -20 + i * 10;
      const spawnZ = 45 + Math.random() * 8;
      const state: PlayerState = {
        id: `ai_cop_${i}`,
        name: `Officer ${101 + i}`,
        team: 'POLICE',
        isLocal: false,
        isAI: true,
        position: { x: spawnX, y: 0, z: spawnZ },
        rotation: Math.PI,
        isSprinting: false,
        isSliding: false,
        isJumping: false,
        isDetained: false,
        isGrappled: false,
        awarenessContribution: 0,
      };

      const controller = new CharacterController(this.scene, state);
      controller.particleSystem = this.particleSystem;
      this.aiPlayers.push(controller);
      this.aiController.registerAI(controller, 'PATROL');
    }

    const aiSlogans = ['CLIMATE NOW', 'FREE MINDS', 'EQUALITY', 'SAVE FORESTS', 'GEN-Z'];
    for (let i = 0; i < protestorCount; i++) {
      const spawnX = (Math.random() - 0.5) * 26;
      const spawnZ = 15 + Math.random() * 20;
      const state: PlayerState = {
        id: `ai_protestor_${i}`,
        name: `Chanter ${i + 1}`,
        team: 'PROTESTOR',
        isLocal: false,
        isAI: true,
        position: { x: spawnX, y: 0, z: spawnZ },
        rotation: 0,
        isSprinting: false,
        isSliding: false,
        isJumping: false,
        isDetained: false,
        isGrappled: false,
        awarenessContribution: 0,
        placardText: aiSlogans[i % aiSlogans.length],
      };

      const controller = new CharacterController(this.scene, state);
      controller.particleSystem = this.particleSystem;
      this.aiPlayers.push(controller);
      this.aiController.registerAI(controller, 'CHANT');
    }
  }

  private setupMultiplayer(roomCode?: string) {
    this.networkManager.init(
      roomCode,
      (msg) => {
        if (msg.type === 'MINIGAME_TRIGGER' && msg.payload.targetId === this.matchState.localPlayerId) {
          this.triggerLocalGrappleMinigame(msg.senderId);
        } else if (msg.type === 'ABILITY_USED') {
          if (msg.payload.ability === 'MEGAPHONE') {
            this.particleSystem.spawnMegaphoneSoundwave(new THREE.Vector3().copy(msg.payload.position));
            audioManager.playMegaphoneChant();
          } else if (msg.payload.ability === 'SMOKE') {
            this.spawnSmokeCanisterMesh(
              new THREE.Vector3().copy(msg.payload.position),
              new THREE.Vector3().copy(msg.payload.velocity)
            );
          }
        }
      }
    );
  }

  // --- POWER-UP PICKUPS ---

  public handleCollectPowerUp(type: PowerUpType, duration: number) {
    this.matchState.activePowerUp = type;
    this.matchState.powerUpTimeLeft = duration;

    if (type === 'ENERGY_CHAI' && this.localPlayer) {
      this.localPlayer.currentStamina = 100;
      this.localPlayer.maxStamina = 150;
      if (this.onLiveStreamComment) {
        this.onLiveStreamComment('☕️ Cutting Chai Power! Stamina fully recharged + Super Sprint!');
      }
    } else if (type === 'WIFI_HOTSPOT') {
      this.matchState.viewerCount += 2500;
      if (this.onLiveStreamComment) {
        this.onLiveStreamComment('📶 5G Hotspot Active! Stream bandwidth 5x viral acceleration!');
      }
    } else if (type === 'PEACE_AURA') {
      if (this.onLiveStreamComment) {
        this.onLiveStreamComment('🛡️ Peace Aura Activated! Immune to police detainment locks!');
      }
    } else if (type === 'CONE_TRAP') {
      // Extinguish all active canisters
      this.activeCanisters.forEach((c) => {
        c.timer = 0;
      });
      if (this.onLiveStreamComment) {
        this.onLiveStreamComment('🧯 Traffic cone deployed! Tear gas smothered safely!');
      }
    }
  }

  // --- GRAPHICS & WEATHER ---

  private getTargetDPR(): number {
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent || '');
    const quality = this.matchState?.graphicsQuality || 'HIGH';
    if (quality === 'ULTRA') return isMobile ? 2.0 : 2.5;
    if (quality === 'HIGH') return isMobile ? 1.45 : 2.0;
    if (quality === 'MEDIUM') return 1.0;
    return 0.85;
  }

  public setGraphicsQuality(quality: GraphicsQuality) {
    this.matchState.graphicsQuality = quality;
    this.renderer.shadowMap.enabled = quality !== 'LOW';
    this.onResize();
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.matchState.timeOfDay = time;
    this.mapBuilder.setTimeOfDay(time, this.scene);
    if (this.skyAtmosphere) {
      this.skyAtmosphere.setTimeOfDay(time);
    }
  }

  public setWeather(weather: WeatherCondition) {
    this.matchState.weather = weather;
    this.weatherManager.setWeather(weather);
  }

  public setPlacardText(text: string) {
    this.matchState.placardText = text;
    if (this.localPlayer) {
      this.localPlayer.updatePlacardText(text);
    }
  }

  public toggleHumanChain(): boolean {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return false;
    this.matchState.humanChainActive = !this.matchState.humanChainActive;
    this.localPlayer.setHumanChain(this.matchState.humanChainActive);

    if (this.matchState.humanChainActive) {
      this.addAwareness(3);
      if (this.onLiveStreamComment) {
        this.onLiveStreamComment('🤝 Human chain formed! An immovable peaceful wall of unity!');
      }
    }
    return this.matchState.humanChainActive;
  }

  // --- ABILITIES & COOLDOWNS ---

  public getAbilityCooldown(ability: string): number {
    return this.abilityCooldowns.get(ability) || 0;
  }

  public setAbilityCooldown(ability: string, duration: number) {
    this.abilityCooldowns.set(ability, duration);
  }

  public initMissions() {
    if (this.matchState.localTeam === 'PROTESTOR') {
      this.activeMissionsList = [
        {
          id: 'parkour_evasion',
          title: 'Acrobatic Evader',
          description: 'Evade police pursuit using parkour vault or slide',
          icon: 'Zap',
          reward: '+300 PTS & Speed Surge',
          progress: 0,
          target: 2,
          isCompleted: false,
        },
        {
          id: 'tapri_energy',
          title: 'Street Fuel',
          description:
            this.selectedMap === 'PARIS'
              ? 'Drink double espresso at Bastille Cafe'
              : 'Drink hot cutting chai at the Sansad Marg Tapri stall',
          icon: 'Coffee',
          reward: '+250 PTS & Ghost Aura',
          progress: 0,
          target: 1,
          isCompleted: false,
        },
        {
          id: 'rally_crowd',
          title: 'Voice of the People',
          description: 'Use Megaphone Chant near 3+ protestors to amplify awareness',
          icon: 'Megaphone',
          reward: '+20 Awareness & Crowd Surge',
          progress: 0,
          target: 3,
          isCompleted: false,
        },
        {
          id: 'jailbreak_heroes',
          title: 'Freedom Fighter',
          description: 'Break comrades out of the police detainment bus',
          icon: 'Unlock',
          reward: '+500 PTS & Confetti Shower',
          progress: 0,
          target: 1,
          isCompleted: false,
        },
      ];
    } else {
      this.activeMissionsList = [
        {
          id: 'police_detain',
          title: 'Maintain Order',
          description: 'Detain 2 active chanters in the plaza',
          icon: 'Shield',
          reward: '+2 Detained Score',
          progress: 0,
          target: 2,
          isCompleted: false,
        },
        {
          id: 'police_barricade',
          title: 'Perimeter Defense',
          description: 'Deploy a tactical riot barricade across main avenue',
          icon: 'AlertTriangle',
          reward: '+300 Tactical Points',
          progress: 0,
          target: 1,
          isCompleted: false,
        },
        {
          id: 'police_smoke',
          title: 'Crowd Dispersal',
          description: 'Deploy tear gas smoke canister near monument',
          icon: 'Flame',
          reward: '+250 Points',
          progress: 0,
          target: 1,
          isCompleted: false,
        },
      ];
    }
    this.matchState.activeMission = { ...this.activeMissionsList[0] };
  }

  public updateMissionProgress(missionId: string, amount: number = 1) {
    const cur = this.matchState.activeMission;
    if (cur && cur.id === missionId && !cur.isCompleted) {
      cur.progress = Math.min(cur.target, cur.progress + amount);
      if (cur.progress >= cur.target) {
        cur.isCompleted = true;
        audioManager.playCrowdCheer(1.0);
        this.addFloatingNotification(`🏆 MISSION COMPLETE: ${cur.title.toUpperCase()}! ${cur.reward}`, 'MISSION');
        if (this.localPlayer) {
          this.particleSystem.spawnConfettiSurge(this.localPlayer.mesh.position);
          this.localPlayer.dashTimer = 3.0; // speed surge
        }
        this.addAwareness(12);

        setTimeout(() => {
          this.currentMissionIndex = (this.currentMissionIndex + 1) % this.activeMissionsList.length;
          const next = { ...this.activeMissionsList[this.currentMissionIndex], progress: 0, isCompleted: false };
          this.matchState.activeMission = next;
        }, 4000);
      }
    }
  }

  public addFloatingNotification(
    text: string,
    type: 'SCORE' | 'COMBO' | 'MISSION' | 'RESCUE' | 'IMMUNITY' = 'SCORE'
  ) {
    if (!this.matchState.floatingNotifications) {
      this.matchState.floatingNotifications = [];
    }
    this.matchState.floatingNotifications.push({
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: Date.now(),
    });
    if (this.matchState.floatingNotifications.length > 4) {
      this.matchState.floatingNotifications.shift();
    }
  }

  public interactWithStation() {
    if (!this.localPlayer || !this.matchState.nearInteractiveStation) return;
    const isParis = this.selectedMap === 'PARIS';

    this.matchState.activePowerUp = 'ENERGY_CHAI';
    this.matchState.powerUpTimeLeft = 18.0;
    this.localPlayer.state.invulnerabilityTimer = 6.0;
    this.localPlayer.dashTimer = 3.0;
    this.addScreenShake(0.2);
    audioManager.playBreakoutDash();

    this.addFloatingNotification(
      isParis
        ? '☕ DOUBLE ESPRESSO FUEL! (+40% SPEED & GHOST SHIELD) +200 PTS'
        : '☕ CUTTING CHAI ENERGY! (+40% SPEED & GHOST SHIELD) +200 PTS',
      'SCORE'
    );
    this.particleSystem.spawnLiveStreamEmoji(this.localPlayer.mesh.position, '☕');
    this.updateMissionProgress('tapri_energy', 1);

    if (this.onLiveStreamComment) {
      this.onLiveStreamComment(
        isParis
          ? '☕ Cafe terrace fuel! Double espresso speeding up the march!!'
          : '☕ Garam Chai break! Special Tapri chai giving infinite energy!!'
      );
    }
  }

  public reviveLocalPlayer() {
    if (!this.localPlayer || !this.localPlayer.state.isDetained) return;
    this.localPlayer.state.isDetained = false;
    this.localPlayer.state.isGrappled = false;
    this.matchState.detentionCountdown = 0;

    const isParis = this.selectedMap === 'PARIS';
    const safeRevivePos = isParis
      ? new THREE.Vector3((Math.random() - 0.5) * 8, 0, 32)
      : new THREE.Vector3((Math.random() - 0.5) * 8, 0, 12);

    this.localPlayer.mesh.position.copy(safeRevivePos);

    // 5 seconds of Ghost Invulnerability Grace Period!
    this.localPlayer.state.invulnerabilityTimer = 5.0;
    this.localPlayer.dashTimer = 2.5;

    // Open the bus door with smoke plume
    const bus = this.busPositions[0];
    if (bus) {
      this.mapBuilder.openBusDoor(bus.id);
      this.particleSystem.spawnSmokePlume(new THREE.Vector3(bus.x, 1, bus.z));
    }

    this.matchState.detainedScore = Math.max(0, (this.matchState.detainedScore || 1) - 1);
    this.addScreenShake(0.4);
    audioManager.playCrowdCheer(0.9);
    audioManager.playBreakoutDash();
    this.particleSystem.spawnConfettiSurge(safeRevivePos);

    this.addFloatingNotification('🎉 JAILBREAK RESCUE! (5s GHOST SHIELD ACTIVE) +250 PTS', 'RESCUE');

    if (this.onLiveStreamComment) {
      this.onLiveStreamComment('🔥 EPIC JAILBREAK! Comrades broke open the bus doors!!');
    }
    this.updateMissionProgress('jailbreak_heroes', 1);
  }

  public triggerMegaphoneBlast() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;
    if (this.localPlayer.state.isDetained || this.localPlayer.state.isGrappled) return;

    if (this.getAbilityCooldown('MEGAPHONE') > 0) {
      audioManager.playCanisterKick();
      return;
    }
    this.setAbilityCooldown('MEGAPHONE', 5.0);

    audioManager.playMegaphoneChant();
    const pos = this.localPlayer.mesh.position.clone();
    this.particleSystem.spawnMegaphoneSoundwave(pos);

    // Scare nearby pigeons!
    this.wildlifeManager.scareNearbyPigeons(pos, 12);

    // Stun radius boosted if AMP_BOOST is active
    const isAmped = this.matchState.activePowerUp === 'AMP_BOOST';
    const stunRadius = isAmped ? 16 : 9;

    let copsStunned = 0;
    this.aiPlayers.forEach((ai) => {
      if (ai.state.team === 'POLICE' && ai.mesh.position.distanceTo(pos) < stunRadius) {
        ai.stunTimer = 4.5;
        copsStunned++;
        this.particleSystem.spawnLiveStreamEmoji(ai.mesh.position, '💫');
        const knockback = new THREE.Vector3().subVectors(ai.mesh.position, pos).normalize().multiplyScalar(7.0);
        ai.mesh.position.add(knockback);
      }
    });

    if (copsStunned > 0) {
      this.addFloatingNotification(`📢 MEGAPHONE STUN! ${copsStunned} COPS KNOCKED BACK! +${copsStunned * 100} PTS`, 'COMBO');
      this.updateMissionProgress('rally_crowd', copsStunned);
    }

    let boost = this.matchState.isPlayerInSpotlight ? 9 : 4;
    if (this.matchState.activePowerUp === 'WIFI_HOTSPOT') boost *= 2.5;

    this.addAwareness(boost);
    this.addScreenShake(0.35);
    this.particleSystem.spawnLiveStreamEmoji(pos, '📢');
    if (this.onLiveStreamComment) {
      this.onLiveStreamComment(
        this.matchState.isPlayerInSpotlight
          ? '🌟 SPOTLIGHT CHANT! Millions tuning in live across India!!'
          : isAmped
          ? '📢 AMPLIFIED CHANT! Whole plaza echoing with unity!!'
          : '📢 Mega megaphone chant resonating through Jantar Mantar!!'
      );
    }

    // Recruit nearby protestors into the player's Kafila!
    this.aiController.recruitToKafila(this.localPlayer, 4);
    const followerCount = this.aiController.getKafilaFollowers().length;
    this.matchState.kafilaCount = followerCount;
    if (followerCount > 0) {
      this.addFloatingNotification(`✊ KAFILA SWELLS: ${followerCount} COMRADES MARCHING WITH YOU!`, 'MISSION');
      audioManager.playCrowdCheer(0.3);
    }

    if (this.matchState.mode === 'MULTIPLAYER') {
      this.networkManager.broadcast({
        type: 'ABILITY_USED',
        payload: { ability: 'MEGAPHONE', position: pos },
        senderId: this.matchState.localPlayerId,
        timestamp: Date.now(),
      });
    }
  }

  public scatterLeafletDecoys() {
    if (!this.localPlayer || this.localPlayer.state.isDetained) return;
    const remaining = this.matchState.leafletsRemaining ?? 3;
    if (remaining <= 0) {
      this.addFloatingNotification('⚠️ No Leaflets Remaining!', 'SCORE');
      return;
    }

    this.matchState.leafletsRemaining = remaining - 1;
    const pos = this.localPlayer.mesh.position.clone();
    audioManager.playLeafletScatter();
    this.aiController.deployDecoy(pos);

    // Visual leaflet flurry
    for (let i = 0; i < 8; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        0.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 2.5
      );
      this.particleSystem.spawnLiveStreamEmoji(pos.clone().add(offset), '📄');
    }

    this.addFloatingNotification(`📄 LEAFLETS SCATTERED! Police Distracted! (${this.matchState.leafletsRemaining} Left)`, 'COMBO');
    this.matchState.heatLevel = Math.max(0, (this.matchState.heatLevel || 30) - 20);
  }

  public commandKafila(cmd: KafilaCommand) {
    if (!this.localPlayer || this.localPlayer.state.isDetained) return;
    this.aiController.setKafilaCommand(cmd);
    this.matchState.kafilaCommand = cmd;

    if (cmd === 'RUSH') {
      this.addFloatingNotification('✊ KAFILA: HALLA BOL! (Swarming Bus!)', 'MISSION');
      audioManager.playMegaphoneChant();
    } else if (cmd === 'DHARNA') {
      this.addFloatingNotification('🧘 KAFILA: DHARNA SIT-IN! (3X Viral Hype)', 'SCORE');
      audioManager.playCelestialSanctuary();
    } else if (cmd === 'SCATTER') {
      this.addFloatingNotification('💨 KAFILA: BIKHRO! (Scatter & Evade)', 'RESCUE');
    } else if (cmd === 'FOLLOW') {
      this.addFloatingNotification('📢 KAFILA: MARCH TOGETHER!', 'IMMUNITY');
    }
  }

  public cycleKafilaCommand() {
    const sequence: KafilaCommand[] = ['FOLLOW', 'RUSH', 'DHARNA', 'SCATTER'];
    const current = this.matchState.kafilaCommand || 'FOLLOW';
    const nextIdx = (sequence.indexOf(current) + 1) % sequence.length;
    this.commandKafila(sequence[nextIdx]);
  }

  public triggerParkourDash() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;
    if (this.localPlayer.state.isDetained) return;

    if (this.getAbilityCooldown('PARKOUR_DASH') > 0) {
      audioManager.playCanisterKick();
      return;
    }
    this.setAbilityCooldown('PARKOUR_DASH', 4.0);

    // Forward direction in horizontal plane relative to camera
    const camForward = new THREE.Vector3(
      -Math.sin(this.cameraYaw),
      0,
      -Math.cos(this.cameraYaw)
    ).normalize();

    this.localPlayer.triggerParkourDash(camForward);
    this.addScreenShake(0.28);
    const pos = this.localPlayer.mesh.position.clone();
    this.particleSystem.spawnLiveStreamEmoji(pos, '⚡️');

    if (this.onLiveStreamComment) {
      this.onLiveStreamComment('💨 Extreme parkour burst through security! #Awaaz');
    }

    if (this.matchState.mode === 'MULTIPLAYER') {
      this.networkManager.broadcast({
        type: 'ABILITY_USED',
        payload: { ability: 'PARKOUR_DASH', position: pos },
        senderId: this.matchState.localPlayerId,
        timestamp: Date.now(),
      });
    }
  }

  public triggerPursuitBoost() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'POLICE') return;

    if (this.getAbilityCooldown('PURSUIT_BOOST') > 0) {
      audioManager.playCanisterKick();
      return;
    }
    this.setAbilityCooldown('PURSUIT_BOOST', 6.0);

    this.localPlayer.triggerPursuitBoost(3.5);
    this.addScreenShake(0.3);
    audioManager.playPoliceRadioChatter();
    const pos = this.localPlayer.mesh.position.clone();
    this.particleSystem.spawnLiveStreamEmoji(pos, '🚨');

    if (this.matchState.mode === 'MULTIPLAYER') {
      this.networkManager.broadcast({
        type: 'ABILITY_USED',
        payload: { ability: 'PURSUIT_BOOST', position: pos },
        senderId: this.matchState.localPlayerId,
        timestamp: Date.now(),
      });
    }
  }

  public triggerLiveStreamHype() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;

    if (this.getAbilityCooldown('LIVESTREAM') > 0) {
      audioManager.playCanisterKick();
      return;
    }
    this.setAbilityCooldown('LIVESTREAM', 6.0);

    const pos = this.localPlayer.mesh.position.clone();
    const emojis = ['❤️', '🔥', '✊', '⚡️', '🌟'];
    const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    this.particleSystem.spawnLiveStreamEmoji(pos, chosenEmoji);

    let multiplier = this.matchState.isPlayerInSpotlight ? 3 : 1;
    if (this.matchState.activePowerUp === 'WIFI_HOTSPOT') multiplier *= 3;

    this.matchState.viewerCount += Math.floor((400 + Math.random() * 800) * multiplier);
    this.addAwareness(2.5 * multiplier);

    if (this.onLiveStreamComment) {
      const streamComments = [
        'Stream is blowing up! #DelhiUnited',
        'Stay peaceful, stay strong! ❤️✊',
        'Trending #1 in India right now! 🔥',
        'Look at the crowd at Samrat Yantra!',
        'Media drone got the live shot! 🎥',
      ];
      this.onLiveStreamComment(streamComments[Math.floor(Math.random() * streamComments.length)]);
    }
  }

  public deployBarricade() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'POLICE') return;

    if (this.getAbilityCooldown('BARRICADE') > 0) {
      audioManager.playCanisterKick();
      return;
    }
    this.setAbilityCooldown('BARRICADE', 6.0);

    const pos = this.localPlayer.mesh.position.clone();
    const rot = this.localPlayer.mesh.rotation.y;

    const frontOffset = new THREE.Vector3(0, 0, -2).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    const spawnPos = pos.add(frontOffset);

    this.mapBuilder.createBarricadeMesh(this.scene, spawnPos.x, spawnPos.z, rot);
    this.colliders = this.mapBuilder.colliders;

    audioManager.playCanisterKick();
  }

  public throwSmokeCanister() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'POLICE') return;

    if (this.getAbilityCooldown('SMOKE') > 0) {
      audioManager.playCanisterKick();
      return;
    }
    this.setAbilityCooldown('SMOKE', 7.0);

    const pos = this.localPlayer.mesh.position.clone();
    const rot = this.localPlayer.mesh.rotation.y;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    const velocity = forward.multiplyScalar(16).add(new THREE.Vector3(0, 6, 0));

    this.spawnSmokeCanisterMesh(pos, velocity);

    if (this.matchState.mode === 'MULTIPLAYER') {
      this.networkManager.broadcast({
        type: 'ABILITY_USED',
        payload: { ability: 'SMOKE', position: pos, velocity },
        senderId: this.matchState.localPlayerId,
        timestamp: Date.now(),
      });
    }
  }

  private spawnSmokeCanisterMesh(origin: THREE.Vector3, velocity: THREE.Vector3) {
    const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.position.y += 1.5;
    this.scene.add(mesh);

    const id = 'canister_' + Math.random().toString(36).substr(2, 6);
    this.activeCanisters.push({
      mesh,
      velocity,
      timer: 2.8,
      id,
    });
  }

  public fireWaterCannon() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'POLICE') return;

    if (this.getAbilityCooldown('WATER') > 0) {
      audioManager.playCanisterKick();
      return;
    }
    this.setAbilityCooldown('WATER', 6.0);

    const pos = this.localPlayer.mesh.position.clone();
    const rot = this.localPlayer.mesh.rotation.y;
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);

    audioManager.playWaterCannonSpray();
    this.addScreenShake(0.42);
    this.particleSystem.spawnWaterSurge(pos, forward);

    this.aiPlayers.forEach((p) => {
      if (p.state.team === 'PROTESTOR') {
        const toTarget = p.mesh.position.clone().sub(pos);
        if (toTarget.length() < 12 && toTarget.normalize().dot(forward) > 0.6) {
          p.mesh.position.addScaledVector(forward, 6);
        }
      }
    });
  }

  // --- MINIGAMES & RESCUE ---

  public triggerLocalGrappleMinigame(grapplerId: string) {
    if (!this.localPlayer) return;
    // Grapple Immunity if PEACE_AURA or invulnerabilityTimer is active!
    if (
      this.matchState.activePowerUp === 'PEACE_AURA' ||
      (this.localPlayer.state.invulnerabilityTimer && this.localPlayer.state.invulnerabilityTimer > 0)
    ) {
      audioManager.playBreakoutDash();
      return;
    }

    // Crowd Shield: If player has 2+ Kafila followers, a comrade blocks the grapple!
    const followers = this.aiController.getKafilaFollowers();
    if (followers.length >= 2) {
      this.addFloatingNotification('🛡️ COMRADE SHIELD: Kafila follower blocked the police tackle!', 'IMMUNITY');
      audioManager.playCanisterKick();
      this.particleSystem.spawnLiveStreamEmoji(this.localPlayer.mesh.position, '✊');
      const grappler = this.aiPlayers.find((p) => p.state.id === grapplerId);
      if (grappler) {
        grappler.stunTimer = 3.5;
        this.particleSystem.spawnLiveStreamEmoji(grappler.mesh.position, '💫');
        const knockback = new THREE.Vector3().subVectors(grappler.mesh.position, this.localPlayer.mesh.position).normalize().multiplyScalar(6.0);
        grappler.mesh.position.add(knockback);
      }
      return;
    }

    this.localPlayer.state.isGrappled = true;
    this.localPlayer.state.grappledById = grapplerId;

    this.matchState.activeMinigame = 'STRUGGLE';
    this.matchState.minigameProgress = 40;

    this.addScreenShake(0.55);
    audioManager.startSiren(0.2);
    audioManager.playPoliceRadioChatter();
    audioManager.playTensionHeartbeat();

    if (this.onMinigameTrigger) {
      this.onMinigameTrigger('STRUGGLE');
    }
  }

  public handleMinigameTap() {
    this.addScreenShake(0.08);

    // If currently detained in bus, tapping picks lock faster!
    if (this.localPlayer && this.localPlayer.state.isDetained) {
      if (this.matchState.detentionCountdown && this.matchState.detentionCountdown > 0) {
        this.matchState.detentionCountdown = Math.max(0, this.matchState.detentionCountdown - 0.75);
        audioManager.playCanisterKick();
        this.particleSystem.spawnLiveStreamEmoji(this.localPlayer.mesh.position, '🔓');
        if (this.matchState.detentionCountdown <= 0) {
          this.reviveLocalPlayer();
        }
      }
      return;
    }

    if (this.matchState.activeMinigame === 'STRUGGLE') {
      this.matchState.minigameProgress += 12.0;
      audioManager.playTensionHeartbeat();

      if (this.matchState.minigameProgress >= 100) {
        this.resolveGrappleSuccess();
      }
    } else if (this.matchState.activeMinigame === 'CANISTER') {
      this.matchState.minigameProgress += 30.0;
      audioManager.playCanisterKick();

      if (this.matchState.minigameProgress >= 100) {
        this.resolveCanisterKickSuccess();
      }
    }
  }

  private resolveGrappleSuccess() {
    if (!this.localPlayer) return;
    this.localPlayer.state.isGrappled = false;
    this.matchState.activeMinigame = 'NONE';
    audioManager.stopSiren();
    audioManager.playBreakoutDash();

    // 1. Stun grappler cop
    const grapplerId = this.localPlayer.state.grappledById;
    if (grapplerId) {
      const grappler = this.aiPlayers.find((p) => p.state.id === grapplerId);
      if (grappler) {
        grappler.stunTimer = 4.5;
        this.particleSystem.spawnLiveStreamEmoji(grappler.mesh.position, '💫');
      }
    }

    // 2. Grant 5 seconds of Ghost Invulnerability!
    this.localPlayer.state.invulnerabilityTimer = 5.0;
    this.localPlayer.dashTimer = 2.0;

    // 3. Knockback backwards into crowd
    const backDir = new THREE.Vector3(0, 0, 10).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.localPlayer.mesh.rotation.y
    );
    this.localPlayer.mesh.position.add(backDir);

    this.addFloatingNotification('⚡️ BROKE FREE! (5s GHOST SHIELD ACTIVE) +150 PTS', 'COMBO');
    this.addAwareness(5);
    this.updateMissionProgress('parkour_evasion', 1);
  }

  public resolveGrappleFail() {
    if (!this.localPlayer) return;
    if (this.matchState.difficultyMode === 'CHILL') {
      this.resolveGrappleSuccess();
      return;
    }
    this.localPlayer.state.isGrappled = false;
    this.localPlayer.state.isDetained = true;
    this.matchState.activeMinigame = 'NONE';
    this.matchState.detentionCountdown = 5.0;
    audioManager.stopSiren();
    audioManager.playHandcuffClick();

    const nearestBus = this.busPositions[0];
    if (nearestBus) {
      this.localPlayer.mesh.position.set(nearestBus.x, 1.2, nearestBus.z);
    }
    this.matchState.detainedScore = Math.min(8, (this.matchState.detainedScore || 0) + 1);
    this.addFloatingNotification('⛓️ DETAINED! MASH [SPACE] TO PICK LOCK & ESCAPE!', 'SCORE');
    this.checkVictoryConditions();
  }

  private resolveCanisterKickSuccess() {
    this.matchState.activeMinigame = 'NONE';
    if (this.activeCanisters.length > 0) {
      const c = this.activeCanisters[0];
      c.velocity.multiplyScalar(-1.5);
    }
    audioManager.playBreakoutDash();
  }

  public triggerBusJailbreak() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;

    for (const bus of this.busPositions) {
      const busVec = new THREE.Vector3(bus.x, 0, bus.z);
      if (this.localPlayer.mesh.position.distanceTo(busVec) < 6.5) {
        this.mapBuilder.openBusDoor(bus.id);
        this.addScreenShake(0.5);

        this.aiPlayers.forEach((ai) => {
          if (ai.state.isDetained) {
            ai.state.isDetained = false;
            ai.mesh.position.set(bus.x + (Math.random() - 0.5) * 6, 0, bus.z - 8);
          }
        });

        this.matchState.detainedScore = 0;
        this.addAwareness(8);
        audioManager.playCrowdCheer(0.8);
        this.particleSystem.spawnLiveStreamEmoji(busVec, '✊');

        if (this.onLiveStreamComment) {
          this.onLiveStreamComment('🎉 BREAKOUT! Detained friends freed from the police bus!!');
        }
        break;
      }
    }
  }

  private addAwareness(amount: number) {
    this.matchState.awarenessScore = Math.min(100, this.matchState.awarenessScore + amount);
    audioManager.updateRallyIntensity(this.matchState.awarenessScore);
    this.checkVictoryConditions();
  }

  private checkVictoryConditions() {
    if (this.matchState.isGameOver) return;

    if (this.matchState.awarenessScore >= 100) {
      this.matchState.isGameOver = true;
      this.matchState.winner = 'PROTESTOR';
      audioManager.playCrowdCheer(1.0);
      audioManager.playVictoryFanfare();
      if (this.localPlayer) {
        this.particleSystem.spawnConfettiSurge(this.localPlayer.mesh.position);
      }
    } else if (this.matchState.detainedScore >= 8) {
      this.matchState.isGameOver = true;
      this.matchState.winner = 'POLICE';
      audioManager.playHandcuffClick();
      if (this.localPlayer && this.localPlayer.state.team === 'POLICE') {
        audioManager.playVictoryFanfare();
        this.particleSystem.spawnConfettiSurge(this.localPlayer.mesh.position);
      }
    }
  }

  // --- GAME LOOP ---

  public currentInput: MovementInput = {
    moveForward: 0,
    moveRight: 0,
    sprint: false,
    jump: false,
    slide: false,
  };

  public updateLocalInput(input: MovementInput) {
    this.currentInput = input;
  }

  /**
   * Triggers an expressive character emote (Bhangra dance, Inquilab fist pump, backflip, chai sip, megaphone)
   */
  public triggerEmote(emote: EmoteType) {
    if (!this.localPlayer) return;
    this.localPlayer.playEmote(emote);
    this.matchState.activeEmote = emote;
    if (this.networkManager) {
      this.networkManager.broadcast({
        type: 'PLAYER_UPDATE',
        payload: { emote },
        senderId: this.matchState.localPlayerId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Toggles through the 4 procedural boombox radio stations (Dhol, Synthwave, Chillhop, Ambience, Off)
   */
  public toggleRadioStation(): RadioStation {
    const nextStation = audioManager.toggleRadioStation();
    this.matchState.radioStation = nextStation;
    const names: Record<RadioStation, string> = {
      OFF: 'RADIO OFF 🔇',
      DHOL_BRASS: '📻 RADIO: DHOL BRASS BEATS 🥁',
      SYNTHWAVE: '📻 RADIO: CYBER SYNTHWAVE ⚡',
      CHILLHOP: '📻 RADIO: LO-FI CHILLHOP ☕',
      AMBIENCE: '📻 RADIO: CITY AMBIENCE 🍃',
    };
    this.addFloatingNotification(names[nextStation], 'MISSION');
    return nextStation;
  }

  public setRadioStation(station: RadioStation) {
    audioManager.setRadioStation(station);
    this.matchState.radioStation = station;
  }

  /**
   * Sets game assist difficulty tier (Chill Explorer, Standard, Hardcore)
   */
  public setDifficulty(mode: DifficultyMode) {
    this.matchState.difficultyMode = mode;
    const labels: Record<DifficultyMode, string> = {
      CHILL: '🕊️ CHILL EXPLORER: Free Roam & Zero Detention!',
      STANDARD: '⚖️ STANDARD: Balanced Rally & Tactical Pursuits',
      HARDCORE: '🔥 HARDCORE: Aggressive Units & Extreme Tension!',
    };
    this.addFloatingNotification(labels[mode], 'IMMUNITY');
    if (this.localPlayer) {
      this.particleSystem.spawnComicPopup(`${mode} MODE!`, this.localPlayer.mesh.position, '#38bdf8');
    }
  }

  /**
   * Saves and live-applies Wardrobe customizer selections
   */
  public setWardrobe(config: WardrobeConfig) {
    this.wardrobeManager.saveConfig(config);
    this.matchState.wardrobe = config;
    if (this.localPlayer) {
      this.localPlayer.applyWardrobe(config);
    }
  }

  public snapCameraToPlayer() {
    if (!this.localPlayer) return;
    const targetPos = this.localPlayer.mesh.position;

    if (this.cameraMode === 'CHASE') {
      const cosPitch = Math.cos(this.cameraPitch);
      const sinPitch = Math.sin(this.cameraPitch);
      const sinYaw = Math.sin(this.cameraYaw);
      const cosYaw = Math.cos(this.cameraYaw);

      const offsetX = sinYaw * cosPitch * this.cameraDistance;
      const offsetY = sinPitch * this.cameraDistance + 2.0;
      const offsetZ = cosYaw * cosPitch * this.cameraDistance;

      GameEngine._idealCamPos.set(
        targetPos.x + offsetX,
        Math.max(1.0, targetPos.y + offsetY),
        targetPos.z + offsetZ
      );

      const headX = targetPos.x;
      const headY = targetPos.y + 1.45;
      const headZ = targetPos.z;
      const toCamX = GameEngine._idealCamPos.x - headX;
      const toCamY = GameEngine._idealCamPos.y - headY;
      const toCamZ = GameEngine._idealCamPos.z - headZ;
      const fullDist = Math.hypot(toCamX, toCamY, toCamZ);

      if (fullDist > 0.1) {
        GameEngine._camRay.origin.set(headX, headY, headZ);
        GameEngine._camRay.direction.set(toCamX / fullDist, toCamY / fullDist, toCamZ / fullDist);

        let closestHitDist = fullDist;
        for (let i = 0; i < this.colliders.length; i++) {
          const c = this.colliders[i];
          if (c.type === 'RAMP') continue;
          const hit = GameEngine._camRay.intersectBox(c.box, GameEngine._hitPoint);
          if (hit) {
            const hitDist = GameEngine._camRay.origin.distanceTo(hit);
            if (hitDist > 0.35 && hitDist < closestHitDist) {
              closestHitDist = hitDist;
            }
          }
        }

        if (closestHitDist < fullDist) {
          const safeDist = Math.max(1.25, closestHitDist - 0.4);
          GameEngine._idealCamPos.set(
            headX + (toCamX / fullDist) * safeDist,
            Math.max(0.8, headY + (toCamY / fullDist) * safeDist),
            headZ + (toCamZ / fullDist) * safeDist
          );
        }
      }

      this.camera.position.copy(GameEngine._idealCamPos);
      GameEngine._lookTarget.set(targetPos.x, targetPos.y + 1.45, targetPos.z);
      this.camera.lookAt(GameEngine._lookTarget);
      this.camera.updateProjectionMatrix();
    }
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // If still preloading assets and compiling shaders, only render the static scene without game ticks
    if (!this.isReadyToPlay) {
      if (this.composer && this.matchState.graphicsQuality !== 'LOW') {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
      return;
    }

    try {
      // 1. Update Match Timer
      if (!this.matchState.isGameOver) {
        this.matchState.timeRemaining -= delta;
        if (this.matchState.timeRemaining <= 0) {
          this.matchState.isGameOver = true;
          this.matchState.winner = this.matchState.awarenessScore >= 50 ? 'PROTESTOR' : 'POLICE';
        }
      }

      // Detention countdown tick & auto-revive
      if (this.localPlayer && this.localPlayer.state.isDetained) {
        if (this.matchState.detentionCountdown !== undefined && this.matchState.detentionCountdown > 0) {
          this.matchState.detentionCountdown -= delta;
          if (this.matchState.detentionCountdown <= 0) {
            this.reviveLocalPlayer();
          }
        }
      }

      // Sync invulnerabilityTimer to matchState for UI
      if (this.localPlayer) {
        this.matchState.invulnerabilityTimer = this.localPlayer.state.invulnerabilityTimer || 0;
      }

      // Check proximity to Interactive Stations (Delhi Chai Tapri / Paris Cafe)
      if (this.localPlayer && !this.localPlayer.state.isDetained) {
        const pPos = this.localPlayer.mesh.position;
        const isParis = this.selectedMap === 'PARIS';
        const chaiStationPos = isParis ? new THREE.Vector3(22, 0, -15) : new THREE.Vector3(-46, 0, -14);
        const distToChai = pPos.distanceTo(chaiStationPos);

        if (distToChai < 5.0) {
          this.matchState.nearInteractiveStation = {
            type: isParis ? 'CAFE_TABLE' : 'CHAI_TAPRI',
            label: isParis ? 'Place de la Bastille Cafe' : 'Delhi Special Tapri Chai',
            actionText: isParis
              ? 'Drink Double Espresso ☕ (+40% Speed & Ghost Shield)'
              : 'Drink Hot Cutting Chai ☕ (+40% Speed & Ghost Shield)',
          };
        } else {
          this.matchState.nearInteractiveStation = null;
        }
      } else {
        this.matchState.nearInteractiveStation = null;
      }

      // Filter floating notifications
      if (this.matchState.floatingNotifications && this.matchState.floatingNotifications.length > 0) {
        const now = Date.now();
        this.matchState.floatingNotifications = this.matchState.floatingNotifications.filter(
          (n) => now - n.timestamp < 3500
        );
      }

      // Check Astronomical Landmark Zones (Jantar Mantar Features)
      if (this.localPlayer && !this.localPlayer.state.isDetained && this.selectedMap === 'DELHI') {
        const pPos = this.localPlayer.mesh.position;
        if (Math.abs(pPos.x) < 4.5 && pPos.z < -20 && pPos.z > -32 && pPos.y > 9.0) {
          if (this.matchState.activeAstronomicalZone !== 'SAMRAT_SUMMIT') {
            this.matchState.activeAstronomicalZone = 'SAMRAT_SUMMIT';
            this.addFloatingNotification('🏛️ SAMRAT YANTRA APEX! Live Satellite Uplink (3X HYPE!)', 'MISSION');
            audioManager.playVictoryFanfare();
          }
          this.addAwareness(delta * 2.2);
          this.particleSystem.spawnLiveStreamEmoji(pPos, '📡');
        } else if (Math.hypot(pPos.x - 22, pPos.z - (-26)) < 6.0) {
          if (this.matchState.activeAstronomicalZone !== 'JAI_PRAKASH_BOWL') {
            this.matchState.activeAstronomicalZone = 'JAI_PRAKASH_BOWL';
            this.addFloatingNotification('✨ JAI PRAKASH SANCTUARY: Celestial Meditation Active!', 'IMMUNITY');
            audioManager.playCelestialSanctuary();
          }
          this.localPlayer.currentStamina = 100;
          this.localPlayer.state.invulnerabilityTimer = Math.max(this.localPlayer.state.invulnerabilityTimer || 0, 4.0);
        } else if (Math.hypot(pPos.x - 28, pPos.z - 20) < 8.5 || Math.hypot(pPos.x - (-28), pPos.z - 20) < 8.5) {
          if (this.matchState.activeAstronomicalZone !== 'RAM_YANTRA_MAZE') {
            this.matchState.activeAstronomicalZone = 'RAM_YANTRA_MAZE';
            this.addFloatingNotification('🌀 RAM YANTRA MAZE: Line of Sight Broken!', 'RESCUE');
          }
          this.matchState.heatLevel = Math.max(0, (this.matchState.heatLevel || 30) - delta * 20);
        } else {
          this.matchState.activeAstronomicalZone = 'NONE';
        }
      }

      // Dynamic Procedural Dhol & Tasha Rally Beats
      if (!this.matchState.isGameOver) {
        this.dholBeatTimer += delta;
        const bpm = Math.min(145, Math.max(90, 85 + (this.matchState.awarenessScore / 100) * 60));
        this.matchState.dholTempo = Math.round(bpm);
        const beatInterval = 60 / bpm;
        if (this.dholBeatTimer >= beatInterval) {
          this.dholBeatTimer = 0;
          this.dholBeatCount++;
          if (this.dholBeatCount % 2 === 0) {
            audioManager.playDholBass(0.3);
          }
          if (this.matchState.awarenessScore > 35 && this.dholBeatCount % 4 === 1) {
            audioManager.playTashaRimshot(0.2);
          }
        }
      }

      // Sync Kafila State to matchState for UI
      this.matchState.kafilaCount = this.aiController.getKafilaFollowers().length;
      this.matchState.kafilaCommand = this.aiController.currentKafilaCommand;

      // 2. Continuous Local Player Physics, Sprint, Slide, Gamepad & Collision Update
      if (this.localPlayer) {
        const hasChai = this.matchState.activePowerUp === 'ENERGY_CHAI';
        const isChill = this.matchState.difficultyMode === 'CHILL';
        if (hasChai || isChill) {
          this.localPlayer.currentStamina = 100;
        }
        const isRain = this.weatherManager.currentWeather === 'MONSOON_RAIN';
        const p = this.localPlayer.mesh.position;
        const isParisWet = this.selectedMap === 'PARIS' && Math.hypot(p.x, p.z) < 55;
        this.localPlayer.isInPuddle = isRain || isParisWet;

        // Poll Gamepad Controller input and blend with keyboard / touch
        const gp = this.gamepadManager.pollInput();
        const activeInput: MovementInput = { ...this.currentInput };
        if (gp.connected) {
          if (Math.abs(gp.moveForward) > 0.08) activeInput.moveForward = gp.moveForward;
          if (Math.abs(gp.moveRight) > 0.08) activeInput.moveRight = gp.moveRight;
          if (gp.sprint) activeInput.sprint = true;
          if (gp.jump) activeInput.jump = true;
          if (gp.slide) activeInput.slide = true;

          if (Math.abs(gp.lookX) > 0.05) this.cameraYaw += gp.lookX * 2.4 * delta;
          if (Math.abs(gp.lookY) > 0.05) {
            this.cameraPitch = Math.max(0.05, Math.min(1.2, this.cameraPitch + gp.lookY * 1.8 * delta));
          }

          if (gp.actionA) {
            if (this.localPlayer.state.team === 'PROTESTOR') {
              this.triggerParkourDash();
            } else {
              this.triggerPursuitBoost();
            }
          }
          if (gp.actionB) {
            if (this.localPlayer.state.team === 'PROTESTOR') {
              this.toggleHumanChain();
            } else {
              this.throwSmokeCanister();
            }
          }
        }

        this.localPlayer.update(delta, activeInput, this.colliders, this.cameraYaw);

        // Dynamic Camera FOV Widening on Slide-Jump / Sprint
        const isHighSpeed = this.localPlayer.state.isSprinting || this.localPlayer.slideSurgeTimer > 0 || this.localPlayer.dashTimer > 0;
        const targetFov = isHighSpeed ? 72 : 62;
        this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, delta * 6.5);
        this.camera.updateProjectionMatrix();
      }

      // 3. Ability Cooldown Ticks & Overdrive Collision Detection
      this.abilityCooldowns.forEach((cd, key) => {
        if (cd > 0) {
          this.abilityCooldowns.set(key, Math.max(0, cd - delta));
        }
      });

      if (
        this.localPlayer &&
        this.localPlayer.state.team === 'POLICE' &&
        this.localPlayer.pursuitTimer > 0
      ) {
        const pPos = this.localPlayer.mesh.position;
        this.aiPlayers.forEach((ai) => {
          if (ai.state.team === 'PROTESTOR' && !ai.state.isDetained && !ai.state.isGrappled) {
            if (ai.mesh.position.distanceTo(pPos) < 2.0) {
              ai.state.isGrappled = true;
              audioManager.playBreakoutDash();
              this.particleSystem.spawnLiveStreamEmoji(ai.mesh.position, '💥');
              setTimeout(() => {
                ai.state.isDetained = true;
                ai.state.isGrappled = false;
                this.matchState.detainedScore = (this.matchState.detainedScore || 0) + 1;
              }, 800);
            }
          }
        });
      }

      // 4. Update Power-Up Active Duration
      if (this.matchState.activePowerUp && this.matchState.powerUpTimeLeft > 0) {
        this.matchState.powerUpTimeLeft -= delta;
        if (this.matchState.powerUpTimeLeft <= 0) {
          this.matchState.activePowerUp = null;
          this.matchState.powerUpTimeLeft = 0;
        }
      }

      // 4. Update Power-Ups in Scene
      if (this.localPlayer) {
        this.powerUpManager.update(
          delta,
          this.localPlayer.mesh.position,
          (type, duration) => this.handleCollectPowerUp(type, duration)
        );

        // 4b. Update 3D Collectible Street Coins & Energy Tokens
        if (!this.localPlayer.state.isDetained) {
          const isMagnetActive = this.matchState.activePowerUp === 'COIN_MAGNET';
          this.pickupManager.update(
            delta,
            this.localPlayer.mesh.position,
            isMagnetActive,
            (item) => {
              this.matchState.coinsCollected = (this.matchState.coinsCollected || 0) + item.value;
              audioManager.playCoinChime(this.matchState.coinsCollected);
              this.particleSystem.spawnGoldStarBurst(this.localPlayer!.mesh.position);
              this.particleSystem.spawnComicPopup(`+${item.value} COINS!`, this.localPlayer!.mesh.position, '#facc15');
              this.gamepadManager.rumble(0.2, 0.4, 75);
              if (item.type === 'ENERGY_STAR') {
                this.localPlayer!.currentStamina = 100;
                this.addFloatingNotification('⭐ ENERGY STAR COLLECTED! Stamina Maxed!', 'IMMUNITY');
              }
            }
          );
        }
      }

      // 5. Update Weather & Atmospheric Simulation
      this.weatherManager.update(delta);

      // 6. Update Wildlife Flocks (Pigeons)
      if (this.localPlayer) {
        this.wildlifeManager.update(delta, this.localPlayer.mesh.position);
      }

      // 7. Update Superchats Simulation
      this.superchatTimer += delta;
      if (this.superchatTimer > 25) {
        this.superchatTimer = 0;
        const donors = ['Aarav_Z', 'Kavita_Youth', 'Simran_Delhi', 'Rohan_Now', 'Arjun_V', 'Pooja_Eco'];
        const messages = [
          'Voice of Gen-Z! Stay strong!',
          'Donating for fresh megaphones! 📢',
          'Truth cannot be detained! ❤️',
          'Trending across all of Twitter/X right now!',
          'Sending love from Mumbai! ✊',
        ];
        const randomDonor = donors[Math.floor(Math.random() * donors.length)];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        const randomAmount = [200, 500, 1000, 2000][Math.floor(Math.random() * 4)];

        this.matchState.superchats.push({
          id: 'sc_' + Date.now(),
          user: randomDonor,
          amount: randomAmount,
          message: randomMsg,
          timestamp: Date.now(),
        });
        audioManager.playCanisterKick(); // Chime
      }

      // 8. Update Drone & Spotlight Position
      const spotlightPos = this.mapBuilder.updateDrone(delta);
      this.matchState.droneSpotlightPos = spotlightPos;

      if (this.localPlayer) {
        const p = this.localPlayer.mesh.position;
        const distToSpotlight = Math.hypot(p.x - spotlightPos.x, p.z - spotlightPos.z);
        this.matchState.isPlayerInSpotlight = distToSpotlight < 4.2;

        if (this.matchState.isPlayerInSpotlight && this.localPlayer.state.team === 'PROTESTOR') {
          this.addAwareness(delta * 0.8);

          // Media Press Drone Flash Strobe
          this.droneFlashTimer += delta;
          if (this.droneFlashTimer > 3.2) {
            this.droneFlashTimer = 0;
            this.particleSystem.spawnCameraFlash(this.localPlayer.mesh.position);
            audioManager.playCameraFlash();
          }
        }
      }

      // 9. Update Police Flashing Lights & Billowing Flags
      this.mapBuilder.updateSirenLights();
      this.mapBuilder.updateFlagAnimations(Date.now() * 0.003);

      // 10. Update AI Units
      const allUnits = this.localPlayer ? [this.localPlayer, ...this.aiPlayers] : this.aiPlayers;
      const isRain = this.weatherManager.currentWeather === 'MONSOON_RAIN';
      const isParisWet = this.selectedMap === 'PARIS';
      this.aiController.update(
        delta,
        allUnits,
        this.colliders,
        this.busPositions,
        (cop, protestor) => {
          if (protestor.state.isLocal) {
            if (this.matchState.difficultyMode === 'CHILL') {
              this.particleSystem.spawnComicPopup('CHILL EVASION! ✨', protestor.mesh.position, '#38bdf8');
              return;
            }
            this.triggerLocalGrappleMinigame(cop.state.id);
          } else {
            if (Math.random() < 0.5) {
              protestor.state.isDetained = true;
              this.matchState.detainedScore++;
              const bus = this.busPositions[0];
              if (bus) protestor.mesh.position.set(bus.x, 1, bus.z);
            }
          }
        },
        isRain || isParisWet
      );

      // Dynamic distance-attenuated police sirens for immersive tactical tension
      if (this.localPlayer && this.localPlayer.state.team === 'PROTESTOR' && !this.localPlayer.state.isDetained) {
        let minCopDist = Infinity;
        const pPos = this.localPlayer.mesh.position;
        for (let i = 0; i < this.aiPlayers.length; i++) {
          const ai = this.aiPlayers[i];
          if (ai.state.team === 'POLICE') {
            const d = pPos.distanceTo(ai.mesh.position);
            if (d < minCopDist) minCopDist = d;
          }
        }
        if (minCopDist < 42) {
          const intensity = Math.max(0.12, 1.0 - minCopDist / 42);
          audioManager.startSiren(intensity);
          audioManager.setSirenIntensity(intensity);
        } else if (this.matchState.activeMinigame !== 'STRUGGLE') {
          audioManager.stopSiren();
        }
      }

      // 11. Update Active Canisters
      for (let i = this.activeCanisters.length - 1; i >= 0; i--) {
        const c = this.activeCanisters[i];
        c.timer -= delta;
        c.mesh.position.addScaledVector(c.velocity, delta);
        c.velocity.y -= 12 * delta;

        if (c.mesh.position.y <= 0.2) {
          c.mesh.position.y = 0.2;
          c.velocity.x *= 0.7;
          c.velocity.z *= 0.7;
        }

        if (
          this.localPlayer &&
          this.localPlayer.state.team === 'PROTESTOR' &&
          this.matchState.activeMinigame === 'NONE' &&
          c.mesh.position.distanceTo(this.localPlayer.mesh.position) < 3.2 &&
          c.timer > 0.5
        ) {
          this.matchState.activeMinigame = 'CANISTER';
          this.matchState.minigameProgress = 20;
          this.matchState.canisterIdTargeted = c.id;
          if (this.onMinigameTrigger) this.onMinigameTrigger('CANISTER');
        }

        if (c.timer <= 0) {
          this.particleSystem.spawnSmokePlume(c.mesh.position);
          this.addScreenShake(0.45);
          audioManager.playCanisterKick();
          this.scene.remove(c.mesh);
          this.activeCanisters.splice(i, 1);
          if (this.matchState.activeMinigame === 'CANISTER') {
            this.matchState.activeMinigame = 'NONE';
          }
        }
      }

      // 12. Update QTE decay
      if (this.matchState.activeMinigame === 'STRUGGLE') {
        this.matchState.minigameProgress -= delta * 12;
        if (this.matchState.minigameProgress <= 0) {
          this.resolveGrappleFail();
        }
      }

      // 13. Update Particle System & Atmospheric Sky
      this.particleSystem.update(delta);
      if (this.skyAtmosphere) {
        this.skyAtmosphere.update(delta);
      }

      // 14. Update Camera Follow
      this.updateCamera(delta);

      // 14. Dynamic Resolution Scaling (DRS) monitor:
      // Protect solid 60+ FPS on budget GPUs or thermal-throttled mobile phones
      if (delta > 0.033) {
        this.consecutiveSlowFrames++;
        this.consecutiveFastFrames = 0;
        if (this.consecutiveSlowFrames > 90 && this.drsScale > 0.75) {
          this.drsScale = Math.max(0.75, this.drsScale - 0.1);
          this.consecutiveSlowFrames = 0;
          this.onResize();
        }
      } else if (delta < 0.017) {
        this.consecutiveFastFrames++;
        this.consecutiveSlowFrames = 0;
        if (this.consecutiveFastFrames > 300 && this.drsScale < 1.0) {
          this.drsScale = Math.min(1.0, this.drsScale + 0.1);
          this.consecutiveFastFrames = 0;
          this.onResize();
        }
      }

      // 15. Render Frame (Cinematic Bloom Post-processing in HIGH/MEDIUM quality)
      if (this.composer && this.matchState.graphicsQuality !== 'LOW') {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      // 16. Notify UI (Throttled to ~16 FPS so React isn't flooded with 120 re-renders/sec)
      this.uiUpdateTimer += delta;
      if (this.uiUpdateTimer >= 0.06) {
        this.uiUpdateTimer = 0;
        this.updateRadarEntities();
        if (this.onStateUpdate) {
          this.onStateUpdate({ ...this.matchState });
        }
      }
    } catch (frameErr) {
      console.warn('Frame render loop warning:', frameErr);
    }
  };

  private updateRadarEntities() {
    let poolIdx = 0;

    if (this.localPlayer) {
      const e = this.getRadarSlot(poolIdx++);
      e.id = this.matchState.localPlayerId;
      e.type = 'LOCAL';
      e.x = this.localPlayer.mesh.position.x;
      e.z = this.localPlayer.mesh.position.z;
      e.rotation = this.localPlayer.mesh.rotation.y;
    }

    for (let i = 0; i < this.aiPlayers.length; i++) {
      const ai = this.aiPlayers[i];
      const e = this.getRadarSlot(poolIdx++);
      e.id = ai.state.id;
      e.type = ai.state.team === 'PROTESTOR' ? 'PROTESTOR' : 'POLICE';
      e.x = ai.mesh.position.x;
      e.z = ai.mesh.position.z;
      e.rotation = ai.mesh.rotation.y;
      e.isDetained = ai.state.isDetained;
    }

    for (let i = 0; i < this.busPositions.length; i++) {
      const bus = this.busPositions[i];
      const e = this.getRadarSlot(poolIdx++);
      e.id = bus.id;
      e.type = 'BUS';
      e.x = bus.x;
      e.z = bus.z;
    }

    const drone = this.getRadarSlot(poolIdx++);
    drone.id = 'media_drone';
    drone.type = 'DRONE';
    drone.x = this.matchState.droneSpotlightPos.x;
    drone.z = this.matchState.droneSpotlightPos.z;

    const powerUps = this.powerUpManager.powerUps;
    for (let i = 0; i < powerUps.length; i++) {
      const p = powerUps[i];
      if (p.mesh.visible) {
        const e = this.getRadarSlot(poolIdx++);
        e.id = p.item.id;
        e.type = 'POWERUP';
        e.x = p.item.position.x;
        e.z = p.item.position.z;
        e.powerUpType = p.item.type;
      }
    }

    const landmarks = this.selectedMap === 'DELHI' ? GameEngine._delhiLandmarks : GameEngine._bastilleLandmarks;
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const e = this.getRadarSlot(poolIdx++);
      e.id = lm.id;
      e.type = 'LANDMARK';
      e.x = lm.x;
      e.z = lm.z;
      e.icon = lm.icon;
      e.label = lm.label;
    }

    this._radarEntitiesPool.length = poolIdx;
    this.matchState.radarEntities = this._radarEntitiesPool;
  }

  private updateCamera(delta: number) {
    if (!this.localPlayer) return;

    const targetPos = this.localPlayer.mesh.position;

    if (this.cameraMode === 'CHASE') {
      const cosPitch = Math.cos(this.cameraPitch);
      const sinPitch = Math.sin(this.cameraPitch);
      const sinYaw = Math.sin(this.cameraYaw);
      const cosYaw = Math.cos(this.cameraYaw);

      const offsetX = sinYaw * cosPitch * this.cameraDistance;
      const offsetY = sinPitch * this.cameraDistance + 2.0;
      const offsetZ = cosYaw * cosPitch * this.cameraDistance;

      GameEngine._idealCamPos.set(
        targetPos.x + offsetX,
        Math.max(1.0, targetPos.y + offsetY),
        targetPos.z + offsetZ
      );

      // AAA Camera Collision & Occlusion Avoidance against world colliders
      const headX = targetPos.x;
      const headY = targetPos.y + 1.45;
      const headZ = targetPos.z;

      const toCamX = GameEngine._idealCamPos.x - headX;
      const toCamY = GameEngine._idealCamPos.y - headY;
      const toCamZ = GameEngine._idealCamPos.z - headZ;
      const fullDist = Math.hypot(toCamX, toCamY, toCamZ);

      if (fullDist > 0.1) {
        GameEngine._camRay.origin.set(headX, headY, headZ);
        GameEngine._camRay.direction.set(toCamX / fullDist, toCamY / fullDist, toCamZ / fullDist);

        let closestHitDist = fullDist;
        for (let i = 0; i < this.colliders.length; i++) {
          const c = this.colliders[i];
          if (c.type === 'RAMP') continue;
          const hit = GameEngine._camRay.intersectBox(c.box, GameEngine._hitPoint);
          if (hit) {
            const hitDist = GameEngine._camRay.origin.distanceTo(hit);
            if (hitDist > 0.35 && hitDist < closestHitDist) {
              closestHitDist = hitDist;
            }
          }
        }

        if (closestHitDist < fullDist) {
          const safeDist = Math.max(1.25, closestHitDist - 0.4);
          GameEngine._idealCamPos.set(
            headX + (toCamX / fullDist) * safeDist,
            Math.max(0.8, headY + (toCamY / fullDist) * safeDist),
            headZ + (toCamZ / fullDist) * safeDist
          );
        }
      }

      this.camera.position.lerp(GameEngine._idealCamPos, Math.min(1.0, delta * 11));
      GameEngine._lookTarget.set(targetPos.x, targetPos.y + 1.45, targetPos.z);
      this.camera.lookAt(GameEngine._lookTarget);

      const targetFOV = this.localPlayer.state.isSprinting ? 75 : 65;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, Math.min(1.0, delta * 5));
      this.camera.updateProjectionMatrix();
    } else if (this.cameraMode === 'TACTICAL') {
      GameEngine._tacticalPos.set(targetPos.x, 26, targetPos.z + 12);
      this.camera.position.lerp(GameEngine._tacticalPos, Math.min(1.0, delta * 6));
      this.camera.lookAt(targetPos);
    } else {
      GameEngine._headPos.set(targetPos.x, targetPos.y + 1.65, targetPos.z);
      this.camera.position.copy(GameEngine._headPos);
      const lookDirX = -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch);
      const lookDirY = -Math.sin(this.cameraPitch);
      const lookDirZ = -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch);
      GameEngine._frontDir.set(
        GameEngine._headPos.x + lookDirX,
        GameEngine._headPos.y + lookDirY,
        GameEngine._headPos.z + lookDirZ
      );
      this.camera.lookAt(GameEngine._frontDir);
    }

    // Visceral AAA Screen Shake with high-frequency decaying jitter
    if (this.screenShakeIntensity > 0.001) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * 0.45;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * 0.35;
      const shakeZ = (Math.random() - 0.5) * this.screenShakeIntensity * 0.45;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.camera.position.z += shakeZ;
      this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - delta * 3.2);
    }
  }

  public toggleCameraMode(): CameraViewMode {
    if (this.cameraMode === 'CHASE') this.cameraMode = 'TACTICAL';
    else if (this.cameraMode === 'TACTICAL') this.cameraMode = 'FIRST_PERSON';
    else this.cameraMode = 'CHASE';
    return this.cameraMode;
  }

  private onResize = () => {
    if (!this.container) return;
    const maxDPR = this.getTargetDPR() * this.drsScale;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, maxDPR));
    if (this.composer) {
      this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
  };

  /**
   * Pre-loads all game assets, synthesized PBR textures, procedural audio buffers,
   * and pre-compiles all WebGL shaders into GPU VRAM for silky-smooth 60+ FPS mobile gameplay.
   */
  public async preloadAssets(onProgress?: (pct: number, status: string) => void): Promise<void> {
    try {
      onProgress?.(15, 'Pre-allocating Web Audio synthesis buffers...');
      await audioManager.preloadAudio();

      onProgress?.(45, 'Generating & caching PBR textures into device RAM...');
      await TextureGenerator.preloadAllTextures(this.renderer);

      onProgress?.(75, 'Pre-computing bounding volumes & scene geometry...');
      this.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) {
            if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          }
        }
      });

      onProgress?.(90, 'Pre-compiling WebGL shaders into GPU VRAM...');
      this.renderer.compile(this.scene, this.camera);
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      this.isReadyToPlay = true;
      onProgress?.(100, 'All systems cached in RAM! Ready to play!');
    } catch (err) {
      console.warn('RAM preloading notice:', err);
      this.isReadyToPlay = true;
      onProgress?.(100, 'Ready');
    }
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    audioManager.stopSiren();
    audioManager.stopAmbientProtestLoop();
    audioManager.setRadioStation('OFF');
    this.networkManager.destroy();
    this.particleSystem.clear();
    this.powerUpManager.destroy();
    this.pickupManager.destroy();
    this.gamepadManager.destroy();
    this.weatherManager.destroy();
    this.wildlifeManager.destroy();
    if (this.skyAtmosphere) {
      this.skyAtmosphere.destroy();
    }
    if (this.composer) {
      this.composer.dispose();
    }
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
