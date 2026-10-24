import * as THREE from 'three';
import {
  Team,
  GameMode,
  PlayerState,
  GameMatchState,
  MinigameType,
  CameraViewMode,
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
    this.scene.background = new THREE.Color(0xdbeafe); // Warm twilight Delhi atmosphere
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.008);

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // Initialize systems
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

    // Window resize
    window.addEventListener('resize', this.onResize);

    // Start Game Loop
    this.animate();
  }

  private setupWorld() {
    const { colliders, busPositions } = this.mapBuilder.buildJantarMantar(this.scene);
    this.colliders = colliders;
    this.busPositions = busPositions;
  }

  private spawnLocalPlayer(team: Team) {
    const isProtestor = team === 'PROTESTOR';
    const spawnPos = isProtestor
      ? new THREE.Vector3((Math.random() - 0.5) * 8, 0, 28) // Near protest stage
      : new THREE.Vector3((Math.random() - 0.5) * 8, 0, 48); // Near police camp

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
    };

    this.localPlayer = new CharacterController(this.scene, state);
  }

  private spawnAIUnits(mode: GameMode, localTeam: Team) {
    const copCount = localTeam === 'POLICE' ? 3 : 5;
    const protestorCount = localTeam === 'PROTESTOR' ? 5 : 7;

    // Spawn AI Police
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

    // Spawn AI Protestors
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
        // Handle incoming network messages
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

  // --- ACTIONS & ABILITIES ---

  /**
   * Protestor Ability 1: Megaphone Soundwave Chant
   */
  public triggerMegaphoneBlast() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;
    if (this.localPlayer.state.isDetained || this.localPlayer.state.isGrappled) return;

    audioManager.playMegaphoneChant();
    const pos = this.localPlayer.mesh.position.clone();
    this.particleSystem.spawnMegaphoneSoundwave(pos);

    // Stun nearby police officers
    this.aiPlayers.forEach((ai) => {
      if (ai.state.team === 'POLICE' && ai.mesh.position.distanceTo(pos) < 9) {
        ai.mesh.rotation.y += Math.PI / 2; // Disorient
      }
    });

    // Awareness Boost & Live-stream emoji
    this.addAwareness(4);
    this.particleSystem.spawnLiveStreamEmoji(pos, '📢');
    if (this.onLiveStreamComment) {
      this.onLiveStreamComment('📢 Mega megaphone chant resonating through Jantar Mantar!!');
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

  /**
   * Protestor Ability 2: Live-stream Hype Spike
   */
  public triggerLiveStreamHype() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;
    const pos = this.localPlayer.mesh.position.clone();

    // Floating reaction emojis
    const emojis = ['❤️', '🔥', '✊', '⚡️'];
    const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    this.particleSystem.spawnLiveStreamEmoji(pos, chosenEmoji);

    // Spike viewer count & awareness
    this.matchState.viewerCount += Math.floor(400 + Math.random() * 800);
    this.addAwareness(2.5);

    if (this.onLiveStreamComment) {
      const streamComments = [
        'Stream is blowing up! #DelhiUnited',
        'Stay peaceful, stay strong! ❤️✊',
        'Trending #1 in India right now! 🔥',
        'Look at the crowd at Samrat Yantra!',
      ];
      this.onLiveStreamComment(streamComments[Math.floor(Math.random() * streamComments.length)]);
    }
  }

  /**
   * Police Ability 1: Deploy Yellow Barricade
   */
  public deployBarricade() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'POLICE') return;
    const pos = this.localPlayer.mesh.position.clone();
    const rot = this.localPlayer.mesh.rotation.y;

    // Spawn 2 meters in front
    const frontOffset = new THREE.Vector3(0, 0, -2).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    const spawnPos = pos.add(frontOffset);

    this.mapBuilder.createBarricadeMesh(this.scene, spawnPos.x, spawnPos.z, rot);
    this.colliders = this.mapBuilder.colliders;

    audioManager.playCanisterKick(); // Metallic barricade lock sound
  }

  /**
   * Police Ability 2: Throw Smoke / Tear Gas Canister
   */
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
      timer: 2.8, // explodes after 2.8s
      id,
    });
  }

  /**
   * Police Ability 3: Water Cannon Surge
   */
  public fireWaterCannon() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'POLICE') return;
    const pos = this.localPlayer.mesh.position.clone();
    const rot = this.localPlayer.mesh.rotation.y;
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);

    audioManager.playWaterCannonSpray();
    this.particleSystem.spawnWaterSurge(pos, forward);

    // Push back protestors in cone
    this.aiPlayers.forEach((p) => {
      if (p.state.team === 'PROTESTOR') {
        const toTarget = p.mesh.position.clone().sub(pos);
        if (toTarget.length() < 12 && toTarget.normalize().dot(forward) > 0.6) {
          p.mesh.position.addScaledVector(forward, 6); // Push back
        }
      }
    });
  }

  // --- MINIGAMES & INTERACTION ---

  /**
   * Triggers the Struggle / Break-Free Rapid-Tap Minigame
   */
  public triggerLocalGrappleMinigame(grapplerId: string) {
    if (!this.localPlayer) return;
    this.localPlayer.state.isGrappled = true;
    this.localPlayer.state.grappledById = grapplerId;

    this.matchState.activeMinigame = 'STRUGGLE';
    this.matchState.minigameProgress = 40; // Start at 40%

    audioManager.startSiren(0.2);
    audioManager.playTensionHeartbeat();

    if (this.onMinigameTrigger) {
      this.onMinigameTrigger('STRUGGLE');
    }
  }

  /**
   * Called repeatedly when player mashes the button / taps the screen during QTE
   */
  public handleMinigameTap() {
    if (this.matchState.activeMinigame === 'STRUGGLE') {
      this.matchState.minigameProgress += 7.5;
      audioManager.playTensionHeartbeat();

      if (this.matchState.minigameProgress >= 100) {
        // BREAK-FREE SUCCESS!
        this.resolveGrappleSuccess();
      }
    } else if (this.matchState.activeMinigame === 'CANISTER') {
      this.matchState.minigameProgress += 22;
      audioManager.playCanisterKick();

      if (this.matchState.minigameProgress >= 100) {
        // CANISTER KICKAWAY SUCCESS!
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

    // Do an evasive backflip/dash away
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

    // Transport to the nearest Bus
    const nearestBus = this.busPositions[0];
    if (nearestBus) {
      this.localPlayer.mesh.position.set(nearestBus.x, 1.2, nearestBus.z);
    }
    this.matchState.detainedScore += 1;
    this.checkVictoryConditions();
  }

  private resolveCanisterKickSuccess() {
    this.matchState.activeMinigame = 'NONE';
    // Deflect active canister away
    if (this.activeCanisters.length > 0) {
      const c = this.activeCanisters[0];
      c.velocity.multiplyScalar(-1.5);
    }
    audioManager.playBreakoutDash();
  }

  /**
   * Jailbreak Action: Free allies from the detainment bus
   */
  public triggerBusJailbreak() {
    if (!this.localPlayer || this.localPlayer.state.team !== 'PROTESTOR') return;

    // Check if player is near rear door of any bus (< 4.5m)
    for (const bus of this.busPositions) {
      const busVec = new THREE.Vector3(bus.x, 0, bus.z);
      if (this.localPlayer.mesh.position.distanceTo(busVec) < 6.5) {
        // Free detained allies!
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
          this.onLiveStreamComment('🎉 BREAKOUT! Detained friends rescued from the police bus!!');
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

    // 2. Update AI Units
    const allUnits = this.localPlayer ? [this.localPlayer, ...this.aiPlayers] : this.aiPlayers;
    this.aiController.update(
      delta,
      allUnits,
      this.colliders,
      this.busPositions,
      (cop, protestor) => {
        // Grapple trigger
        if (protestor.state.isLocal) {
          this.triggerLocalGrappleMinigame(cop.state.id);
        } else {
          // AI vs AI grapple resolution
          if (Math.random() < 0.5) {
            protestor.state.isDetained = true;
            this.matchState.detainedScore++;
            const bus = this.busPositions[0];
            if (bus) protestor.mesh.position.set(bus.x, 1, bus.z);
          }
        }
      }
    );

    // 3. Update Active Canisters
    for (let i = this.activeCanisters.length - 1; i >= 0; i--) {
      const c = this.activeCanisters[i];
      c.timer -= delta;
      c.mesh.position.addScaledVector(c.velocity, delta);
      c.velocity.y -= 12 * delta; // Gravity

      if (c.mesh.position.y <= 0.2) {
        c.mesh.position.y = 0.2;
        c.velocity.x *= 0.7;
        c.velocity.z *= 0.7;
      }

      // Check proximity to local player for Canister Kick minigame
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

      // Detonation
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

    // 4. Update QTE decay (tug-of-war tension)
    if (this.matchState.activeMinigame === 'STRUGGLE') {
      this.matchState.minigameProgress -= delta * 12; // Cops pulling back
      if (this.matchState.minigameProgress <= 0) {
        this.resolveGrappleFail();
      }
    }

    // 5. Update Particle System
    this.particleSystem.update(delta);

    // 6. Camera Follow System
    this.updateCamera(delta);

    // 7. Render
    this.renderer.render(this.scene, this.camera);

    // 8. Notify UI
    if (this.onStateUpdate) {
      this.onStateUpdate({ ...this.matchState });
    }
  };

  /**
   * Dynamic Subway Surfers Chase Camera or Tactical Bird's Eye Camera
   */
  private updateCamera(delta: number) {
    if (!this.localPlayer) return;

    const targetPos = this.localPlayer.mesh.position;
    const targetRot = this.localPlayer.mesh.rotation.y;

    if (this.cameraMode === 'CHASE') {
      // Behind character follow camera
      const cameraDist = 7.5;
      const cameraHeight = 3.6;

      const idealOffset = new THREE.Vector3(0, cameraHeight, cameraDist).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        targetRot
      );
      const idealCameraPos = targetPos.clone().add(idealOffset);

      // Smooth lerp
      this.camera.position.lerp(idealCameraPos, delta * 9);
      const lookTarget = targetPos.clone().add(new THREE.Vector3(0, 1.6, 0));
      this.camera.lookAt(lookTarget);

      // Dynamic FOV widening on sprint (Subway Surfers speed sensation)
      const targetFOV = this.localPlayer.state.isSprinting ? 75 : 65;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, delta * 5);
      this.camera.updateProjectionMatrix();
    } else {
      // Tactical Bird's Eye View
      const tacticalPos = new THREE.Vector3(targetPos.x, 28, targetPos.z + 14);
      this.camera.position.lerp(tacticalPos, delta * 6);
      this.camera.lookAt(targetPos);
    }
  }

  public toggleCameraMode(): CameraViewMode {
    this.cameraMode = this.cameraMode === 'CHASE' ? 'TACTICAL' : 'CHASE';
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
