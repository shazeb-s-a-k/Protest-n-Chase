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
  RadarEntity,
} from '../types/game';
import { MapBuilder, Collider } from './MapBuilder';
import { CharacterController, MovementInput } from './CharacterController';
import { AIController } from './AIController';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from './AudioManager';
import { NetworkManager } from './NetworkManager';

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  // Systems
  public mapBuilder: MapBuilder;
  public particleSystem: ParticleSystem;
  public aiController: AIController;
  public networkManager: NetworkManager;

  // Entities
  public localPlayer: CharacterController | null = null;
  public remotePlayers: Map<string, CharacterController> = new Map();
  public aiPlayers: CharacterController[] = [];
  public colliders: Collider[] = [];
  public busPositions: { x: number; y: number; z: number; id: string }[] = [];

  // Match State
  public matchState: GameMatchState;
  public cameraMode: CameraViewMode = 'CHASE';
  private cameraDistance: number = 7.5;
  private cameraOrbitAngle: number = 0;
  private isMouseDragging: boolean = false;
  private previousMouseX: number = 0;

  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number | null = null;

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

  constructor(
    container: HTMLElement,
    mode: GameMode,
    team: Team,
    roomCode?: string
  ) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdbeafe);
    this.scene.fog = new THREE.FogExp2(0xfef08a, 0.006);

    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    // Systems
    this.mapBuilder = new MapBuilder();
    this.particleSystem = new ParticleSystem(this.scene);
    this.aiController = new AIController();
    this.networkManager = new NetworkManager();

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
      radarEntities: [],
      droneSpotlightPos: { x: 0, z: 20 },
      isPlayerInSpotlight: false,
      humanChainActive: false,
      placardText: 'AWAAZ 2026',
    };

    // Build World
    this.setupWorld();

    // Spawn Characters
    this.spawnLocalPlayer(team);
    this.spawnAIUnits(mode, team);

    // Audio & Loop
    audioManager.init();
    audioManager.startAmbientProtestLoop();

    // Setup Network if Multiplayer
    if (mode === 'MULTIPLAYER') {
      this.setupMultiplayer(roomCode);
    }

    // Controls & Listeners
    this.setupMouseControls();
    window.addEventListener('resize', this.onResize);

    // Start Loop
    this.animate();
  }

  private setupWorld() {
    const { colliders, busPositions } = this.mapBuilder.buildJantarMantar(this.scene);
    this.colliders = colliders;
    this.busPositions = busPositions;
  }

  private setupMouseControls() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 0) { // Right or Left click drag
        this.isMouseDragging = true;
        this.previousMouseX = e.clientX;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDragging) return;
      const deltaX = e.clientX - this.previousMouseX;
      this.previousMouseX = e.clientX;
      this.cameraOrbitAngle -= deltaX * 0.006;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDragging = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = THREE.MathUtils.clamp(
        this.cameraDistance + e.deltaY * 0.01,
        4.5,
        14.0
      );
    }, { passive: false });

    // Prevent context menu on right click in game
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private spawnLocalPlayer(team: Team) {
    const isProtestor = team === 'PROTESTOR';
    const spawnPos = isProtestor
      ? new THREE.Vector3((Math.random() - 0.5) * 8, 0, 28)
      : new THREE.Vector3((Math.random() - 0.5) * 8, 0, 48);

    const state: PlayerState = {
      id: this.matchState.localPlayerId,
      name: isProtestor ? 'You (Voice)' : 'You (Officer)',
      team,
      isLocal: true,
      isAI: false,
      position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
      rotation: isProtestor ? 0 : Math.PI,
      isSprinting: false,
      isSliding: false,
      isJumping: false,
      isDetained: false,
      isGrappled: false,
      awarenessContribution: 0,
      placardText: this.matchState.placardText,
    };

    this.localPlayer = new CharacterController(this.scene, state);
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

  // --- GRAPHICS & ATMOSPHERE MODIFIERS ---

  public setGraphicsQuality(quality: GraphicsQuality) {
    this.matchState.graphicsQuality = quality;
    if (quality === 'ULTRA') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio * 1.5, 3.0));
      this.renderer.shadowMap.enabled = true;
    } else if (quality === 'HIGH') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
    } else if (quality === 'MEDIUM') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = true;
    } else {
      // LOW: Performance boost for older mobile phones
      this.renderer.setPixelRatio(0.85);
      this.renderer.shadowMap.enabled = false;
    }
    this.onResize();
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.matchState.timeOfDay = time;
    this.mapBuilder.setTimeOfDay(time, this.scene);
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

  // --- ABILITIES ---

  public triggerMegaphoneBlast() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;
    if (this.localPlayer.state.isDetained || this.localPlayer.state.isGrappled) return;

    audioManager.playMegaphoneChant();
    const pos = this.localPlayer.mesh.position.clone();
    this.particleSystem.spawnMegaphoneSoundwave(pos);

    // Stun nearby police officers
    this.aiPlayers.forEach((ai) => {
      if (ai.state.team === 'POLICE' && ai.mesh.position.distanceTo(pos) < 9) {
        ai.mesh.rotation.y += Math.PI / 2;
      }
    });

    const boost = this.matchState.isPlayerInSpotlight ? 9 : 4;
    this.addAwareness(boost);
    this.particleSystem.spawnLiveStreamEmoji(pos, '📢');
    if (this.onLiveStreamComment) {
      this.onLiveStreamComment(
        this.matchState.isPlayerInSpotlight
          ? '🌟 SPOTLIGHT CHANT! Millions tuning in live across India!!'
          : '📢 Mega megaphone chant resonating through Jantar Mantar!!'
      );
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

  public triggerLiveStreamHype() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;
    const pos = this.localPlayer.mesh.position.clone();

    const emojis = ['❤️', '🔥', '✊', '⚡️', '🌟'];
    const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    this.particleSystem.spawnLiveStreamEmoji(pos, chosenEmoji);

    const multiplier = this.matchState.isPlayerInSpotlight ? 3 : 1;
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
    const pos = this.localPlayer.mesh.position.clone();
    const rot = this.localPlayer.mesh.rotation.y;
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);

    audioManager.playWaterCannonSpray();
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
    this.localPlayer.state.isGrappled = true;
    this.localPlayer.state.grappledById = grapplerId;

    this.matchState.activeMinigame = 'STRUGGLE';
    this.matchState.minigameProgress = 40;

    audioManager.startSiren(0.2);
    audioManager.playTensionHeartbeat();

    if (this.onMinigameTrigger) {
      this.onMinigameTrigger('STRUGGLE');
    }
  }

  public handleMinigameTap() {
    if (this.matchState.activeMinigame === 'STRUGGLE') {
      this.matchState.minigameProgress += 8.5;
      audioManager.playTensionHeartbeat();

      if (this.matchState.minigameProgress >= 100) {
        this.resolveGrappleSuccess();
      }
    } else if (this.matchState.activeMinigame === 'CANISTER') {
      this.matchState.minigameProgress += 25;
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

    const backDir = new THREE.Vector3(0, 0, 8).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.localPlayer.mesh.rotation.y
    );
    this.localPlayer.mesh.position.add(backDir);
  }

  public resolveGrappleFail() {
    if (!this.localPlayer) return;
    this.localPlayer.state.isGrappled = false;
    this.localPlayer.state.isDetained = true;
    this.matchState.activeMinigame = 'NONE';
    audioManager.stopSiren();
    audioManager.playHandcuffClick();

    const nearestBus = this.busPositions[0];
    if (nearestBus) {
      this.localPlayer.mesh.position.set(nearestBus.x, 1.2, nearestBus.z);
    }
    this.matchState.detainedScore += 1;
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
    this.checkVictoryConditions();
  }

  private checkVictoryConditions() {
    if (this.matchState.isGameOver) return;

    if (this.matchState.awarenessScore >= 100) {
      this.matchState.isGameOver = true;
      this.matchState.winner = 'PROTESTOR';
      audioManager.playCrowdCheer(1.0);
    } else if (this.matchState.detainedScore >= 8) {
      this.matchState.isGameOver = true;
      this.matchState.winner = 'POLICE';
      audioManager.playHandcuffClick();
    }
  }

  // --- GAME LOOP ---

  public updateLocalInput(input: MovementInput) {
    if (this.localPlayer) {
      this.localPlayer.update(this.clock.getDelta(), input, this.colliders);
    }
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Match Timer
    if (!this.matchState.isGameOver) {
      this.matchState.timeRemaining -= delta;
      if (this.matchState.timeRemaining <= 0) {
        this.matchState.isGameOver = true;
        this.matchState.winner = this.matchState.awarenessScore >= 50 ? 'PROTESTOR' : 'POLICE';
      }
    }

    // 2. Update Drone & Spotlight Position
    const spotlightPos = this.mapBuilder.updateDrone(delta);
    this.matchState.droneSpotlightPos = spotlightPos;

    // Check if local player is in the spotlight
    if (this.localPlayer) {
      const p = this.localPlayer.mesh.position;
      const distToSpotlight = Math.hypot(p.x - spotlightPos.x, p.z - spotlightPos.z);
      this.matchState.isPlayerInSpotlight = distToSpotlight < 4.2;

      // Passive awareness boost while under spotlight
      if (this.matchState.isPlayerInSpotlight && this.localPlayer.state.team === 'PROTESTOR') {
        this.addAwareness(delta * 0.8);
      }
    }

    // 3. Update Police Flashing Lights
    this.mapBuilder.updateSirenLights();

    // 4. Update AI Units
    const allUnits = this.localPlayer ? [this.localPlayer, ...this.aiPlayers] : this.aiPlayers;
    this.aiController.update(
      delta,
      allUnits,
      this.colliders,
      this.busPositions,
      (cop, protestor) => {
        if (protestor.state.isLocal) {
          this.triggerLocalGrappleMinigame(cop.state.id);
        } else {
          if (Math.random() < 0.5) {
            protestor.state.isDetained = true;
            this.matchState.detainedScore++;
            const bus = this.busPositions[0];
            if (bus) protestor.mesh.position.set(bus.x, 1, bus.z);
          }
        }
      }
    );

    // 5. Update Active Canisters
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
        audioManager.playCanisterKick();
        this.scene.remove(c.mesh);
        this.activeCanisters.splice(i, 1);
        if (this.matchState.activeMinigame === 'CANISTER') {
          this.matchState.activeMinigame = 'NONE';
        }
      }
    }

    // 6. Update QTE decay
    if (this.matchState.activeMinigame === 'STRUGGLE') {
      this.matchState.minigameProgress -= delta * 12;
      if (this.matchState.minigameProgress <= 0) {
        this.resolveGrappleFail();
      }
    }

    // 7. Update Particle System
    this.particleSystem.update(delta);

    // 8. Update Camera Follow
    this.updateCamera(delta);

    // 9. Collect Entities for Real-Time Radar HUD
    this.updateRadarEntities();

    // 10. Render
    this.renderer.render(this.scene, this.camera);

    // 11. Notify UI
    if (this.onStateUpdate) {
      this.onStateUpdate({ ...this.matchState });
    }
  };

  private updateRadarEntities() {
    const entities: RadarEntity[] = [];

    // Local player
    if (this.localPlayer) {
      entities.push({
        id: this.matchState.localPlayerId,
        type: 'LOCAL',
        x: this.localPlayer.mesh.position.x,
        z: this.localPlayer.mesh.position.z,
        rotation: this.localPlayer.mesh.rotation.y,
      });
    }

    // AI Players
    this.aiPlayers.forEach((ai) => {
      entities.push({
        id: ai.state.id,
        type: ai.state.team === 'PROTESTOR' ? 'PROTESTOR' : 'POLICE',
        x: ai.mesh.position.x,
        z: ai.mesh.position.z,
        rotation: ai.mesh.rotation.y,
        isDetained: ai.state.isDetained,
      });
    });

    // Buses
    this.busPositions.forEach((bus) => {
      entities.push({
        id: bus.id,
        type: 'BUS',
        x: bus.x,
        z: bus.z,
      });
    });

    // Drone Spotlight
    entities.push({
      id: 'media_drone',
      type: 'DRONE',
      x: this.matchState.droneSpotlightPos.x,
      z: this.matchState.droneSpotlightPos.z,
    });

    this.matchState.radarEntities = entities;
  }

  private updateCamera(delta: number) {
    if (!this.localPlayer) return;

    const targetPos = this.localPlayer.mesh.position;
    const playerRot = this.localPlayer.mesh.rotation.y;
    const finalRot = playerRot + this.cameraOrbitAngle;

    if (this.cameraMode === 'CHASE') {
      const cameraHeight = 3.6;

      const idealOffset = new THREE.Vector3(0, cameraHeight, this.cameraDistance).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        finalRot
      );
      const idealCameraPos = targetPos.clone().add(idealOffset);

      this.camera.position.lerp(idealCameraPos, delta * 9);
      const lookTarget = targetPos.clone().add(new THREE.Vector3(0, 1.6, 0));
      this.camera.lookAt(lookTarget);

      const targetFOV = this.localPlayer.state.isSprinting ? 75 : 65;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, delta * 5);
      this.camera.updateProjectionMatrix();
    } else if (this.cameraMode === 'TACTICAL') {
      const tacticalPos = new THREE.Vector3(targetPos.x, 28, targetPos.z + 14);
      this.camera.position.lerp(tacticalPos, delta * 6);
      this.camera.lookAt(targetPos);
    } else {
      // FIRST_PERSON VIEW
      const headPos = targetPos.clone().add(new THREE.Vector3(0, 1.7, 0));
      this.camera.position.copy(headPos);
      const frontDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot);
      this.camera.lookAt(headPos.clone().add(frontDir));
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
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    audioManager.stopSiren();
    audioManager.stopAmbientProtestLoop();
    this.networkManager.destroy();
    this.particleSystem.clear();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
