import * as THREE from 'three';
import { CharacterController, MovementInput } from './CharacterController';
import { Collider } from './MapBuilder';
import { Team, KafilaCommand } from '../types/game';

export interface AIState {
  controller: CharacterController;
  behavior: 'PATROL' | 'PURSUIT' | 'ESCORT' | 'EVADE' | 'RESCUE' | 'CHANT' | 'FOLLOW' | 'DHARNA' | 'INSPECT_DECOY';
  targetPos: THREE.Vector3;
  timer: number;
  grappleCooldown?: number;
  tackleWindupTimer?: number;
  assignedBusPos?: THREE.Vector3;
  kafilaOffset?: THREE.Vector3;
  decoyTimer?: number;
}

export class AIController {
  private aiUnits: AIState[] = [];
  public currentKafilaCommand: KafilaCommand = 'FOLLOW';
  public activeDecoyPos: THREE.Vector3 | null = null;
  public activeDecoyTimer: number = 0;

  constructor() {}

  public registerAI(
    controller: CharacterController,
    initialBehavior: 'PATROL' | 'EVADE' | 'CHANT' = 'PATROL'
  ) {
    this.aiUnits.push({
      controller,
      behavior: initialBehavior,
      targetPos: this.getRandomPatrolPoint(),
      timer: Math.random() * 3,
    });
  }

  public deployDecoy(pos: THREE.Vector3) {
    this.activeDecoyPos = pos.clone();
    this.activeDecoyTimer = 4.0;
  }

  public recruitToKafila(leader: CharacterController, maxRecruits: number = 4) {
    const leaderPos = leader.mesh.position;
    let recruited = 0;

    // Radius offsets around the leader for natural flocking formation
    const formationOffsets = [
      new THREE.Vector3(-1.8, 0, -1.8),
      new THREE.Vector3(1.8, 0, -1.8),
      new THREE.Vector3(-2.6, 0, -0.6),
      new THREE.Vector3(2.6, 0, -0.6),
      new THREE.Vector3(0, 0, -2.8),
    ];

    for (const ai of this.aiUnits) {
      if (recruited >= maxRecruits) break;
      if (ai.controller.state.team === 'PROTESTOR' && !ai.controller.state.isDetained && !ai.controller.state.isGrappled) {
        if (ai.behavior !== 'FOLLOW') {
          const dist = ai.controller.mesh.position.distanceTo(leaderPos);
          if (dist < 18) {
            ai.behavior = 'FOLLOW';
            ai.kafilaOffset = formationOffsets[recruited % formationOffsets.length].clone();
            ai.controller.state.isFollowingLeader = true;
            recruited++;
          }
        }
      }
    }
  }

  public setKafilaCommand(cmd: KafilaCommand) {
    this.currentKafilaCommand = cmd;
    for (const ai of this.aiUnits) {
      if (ai.controller.state.team === 'PROTESTOR' && ai.behavior === 'FOLLOW') {
        if (cmd === 'DHARNA') {
          ai.behavior = 'DHARNA';
        } else if (cmd === 'SCATTER') {
          ai.behavior = 'EVADE';
          ai.timer = 0;
        } else {
          ai.behavior = 'FOLLOW';
        }
      }
    }
  }

  public getKafilaFollowers(): CharacterController[] {
    return this.aiUnits
      .filter((ai) => ai.controller.state.team === 'PROTESTOR' && (ai.behavior === 'FOLLOW' || ai.behavior === 'DHARNA'))
      .map((ai) => ai.controller);
  }

  private static _scratchDir = new THREE.Vector3();
  private static _scratchFleeDir = new THREE.Vector3();
  private static _scratchInput: MovementInput = {
    moveForward: 0,
    moveRight: 0,
    sprint: false,
    jump: false,
    slide: false,
  };

  public update(
    delta: number,
    allPlayers: CharacterController[],
    colliders: Collider[],
    busPositions: { x: number; y: number; z: number; id: string }[],
    onTriggerGrapple: (cop: CharacterController, protestor: CharacterController) => void,
    isWetEnvironment: boolean = false
  ) {
    if (this.activeDecoyTimer > 0) {
      this.activeDecoyTimer -= delta;
      if (this.activeDecoyTimer <= 0) {
        this.activeDecoyPos = null;
      }
    }

    const localLeader = allPlayers.find((p) => p.state.isLocal && p.state.team === 'PROTESTOR');

    for (const ai of this.aiUnits) {
      if (ai.controller.state.isDetained || ai.controller.state.isGrappled) {
        continue;
      }

      ai.controller.isInPuddle = isWetEnvironment;
      ai.timer += delta;
      const isPolice = ai.controller.state.team === 'POLICE';
      const myPos = ai.controller.mesh.position;

      const input = AIController._scratchInput;
      input.moveForward = 0;
      input.moveRight = 0;
      input.sprint = false;
      input.jump = false;
      input.slide = false;

      if (isPolice) {
        if (ai.grappleCooldown && ai.grappleCooldown > 0) {
          ai.grappleCooldown -= delta;
        }

        // --- POLICE AI LOGIC ---
        // Check for scattered leaflet decoy distraction
        if (this.activeDecoyPos && myPos.distanceTo(this.activeDecoyPos) < 11) {
          ai.behavior = 'INSPECT_DECOY';
          ai.targetPos.copy(this.activeDecoyPos);
        }

        if (ai.behavior === 'INSPECT_DECOY') {
          if (myPos.distanceTo(ai.targetPos) < 1.8 || !this.activeDecoyPos) {
            // Inspecting fluttered pamphlets on the tarmac
            input.moveForward = 0;
            if (!this.activeDecoyPos) {
              ai.behavior = 'PATROL';
              ai.timer = 0;
            }
          } else {
            // Walk toward the decoy leaflets
            ai.targetPos.copy(this.activeDecoyPos);
          }
        } else {
          // Find closest active (free) protestor
          let closestProtestor: CharacterController | null = null;
          let minDist = Infinity;

          // Count how many cops are already pursuing the local player
          let copsPursuingLocal = 0;
          for (const otherAi of this.aiUnits) {
            if (otherAi !== ai && otherAi.controller.state.team === 'POLICE' && otherAi.behavior === 'PURSUIT') {
              if (localLeader && otherAi.targetPos.distanceTo(localLeader.mesh.position) < 5) {
                copsPursuingLocal++;
              }
            }
          }

          for (let pIdx = 0; pIdx < allPlayers.length; pIdx++) {
            const p = allPlayers[pIdx];
            if (p.state.team === 'PROTESTOR' && !p.state.isDetained && !p.state.isGrappled) {
              // Skip protestors in ghost grace period (5s immunity on spawn/revive)
              if (p.state.invulnerabilityTimer && p.state.invulnerabilityTimer > 0) {
                continue;
              }
              // Max 1 cop chasing local player simultaneously to prevent unfair dogpiling!
              if (p.state.isLocal && copsPursuingLocal >= 1) {
                continue;
              }

              const dist = myPos.distanceTo(p.mesh.position);
              if (dist < minDist) {
                minDist = dist;
                closestProtestor = p;
              }
            }
          }

          // If a protestor is within 28m, switch to PURSUIT
          if (closestProtestor && minDist < 28) {
            ai.behavior = 'PURSUIT';
            ai.targetPos.copy(closestProtestor.mesh.position);

            // If within tackle range (1.9m) and not on cooldown:
            if (minDist < 1.9 && (!ai.grappleCooldown || ai.grappleCooldown <= 0)) {
              ai.tackleWindupTimer = (ai.tackleWindupTimer || 0) + delta;
              // 0.45s telegraph windup giving player a chance to dodge/vault/slide!
              if (ai.tackleWindupTimer >= 0.45) {
                ai.tackleWindupTimer = 0;
                ai.grappleCooldown = 6.0; // 6s tackle cooldown
                onTriggerGrapple(ai.controller, closestProtestor);
              }
            } else {
              ai.tackleWindupTimer = 0;
            }
          } else {
            ai.tackleWindupTimer = 0;
            // If no protestor nearby, patrol between observatory monuments
            if (ai.timer > 6 || myPos.distanceTo(ai.targetPos) < 3) {
              ai.targetPos = this.getRandomPatrolPoint();
              ai.timer = 0;
              ai.behavior = 'PATROL';
            }
          }
        }

        // Calculate direction to target (Zero-GC)
        const dir = AIController._scratchDir.subVectors(ai.targetPos, myPos);
        dir.y = 0;
        if (dir.lengthSq() > 0.25) {
          dir.normalize();
          input.moveForward = 1;
          input.sprint = ai.behavior === 'PURSUIT';
          ai.controller.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }
      } else {
        // --- PROTESTOR AI LOGIC ---
        // 1. Follow Leader in Kafila Formation
        if (ai.behavior === 'FOLLOW' && localLeader && !localLeader.state.isDetained) {
          const leaderPos = localLeader.mesh.position;
          const offset = ai.kafilaOffset || new THREE.Vector3(-1.8, 0, -1.8);
          
          if (this.currentKafilaCommand === 'RUSH' && busPositions.length > 0) {
            // Rush toward the primary bus to stage a crowd jailbreak
            ai.targetPos.set(busPositions[0].x, busPositions[0].y, busPositions[0].z);
            input.sprint = true;
          } else {
            // Flocking offset matching leader's rotation
            const cosL = Math.cos(localLeader.mesh.rotation.y);
            const sinL = Math.sin(localLeader.mesh.rotation.y);
            ai.targetPos.set(
              leaderPos.x + offset.x * cosL - offset.z * sinL,
              leaderPos.y,
              leaderPos.z + offset.x * sinL + offset.z * cosL
            );

            // Crowd Shield: If a cop is within 3.5m of the leader, intercept the cop!
            for (const p of allPlayers) {
              if (p.state.team === 'POLICE' && p.mesh.position.distanceTo(leaderPos) < 3.8) {
                // Interpose between cop and leader
                ai.targetPos.lerpVectors(leaderPos, p.mesh.position, 0.55);
                break;
              }
            }

            const distToTarget = myPos.distanceTo(ai.targetPos);
            if (distToTarget > 1.2) {
              input.moveForward = 1;
              input.sprint = distToTarget > 4.5 || localLeader.state.isSprinting;
            }
            if (localLeader.state.isJumping && Math.random() < 0.25) input.jump = true;
            if (localLeader.state.isSliding && Math.random() < 0.20) input.slide = true;
          }
        } else if (ai.behavior === 'DHARNA' && localLeader) {
          // Sit-In Mode: Remain seated in circle around leader
          const leaderPos = localLeader.mesh.position;
          const offset = ai.kafilaOffset || new THREE.Vector3(-1.8, 0, -1.8);
          ai.targetPos.set(leaderPos.x + offset.x, leaderPos.y, leaderPos.z + offset.z);
          if (myPos.distanceTo(ai.targetPos) > 1.2) {
            input.moveForward = 1;
          } else {
            input.moveForward = 0;
            // Face outward from center
            const outDir = AIController._scratchDir.subVectors(myPos, leaderPos);
            outDir.y = 0;
            if (outDir.lengthSq() > 0.05) {
              outDir.normalize();
              ai.controller.mesh.rotation.y = Math.atan2(outDir.x, outDir.z);
            }
          }
        } else {
          // Standard Evade or Peaceful Plaza Chanting
          let nearestCop: CharacterController | null = null;
          let minCopDist = Infinity;

          for (let pIdx = 0; pIdx < allPlayers.length; pIdx++) {
            const p = allPlayers[pIdx];
            if (p.state.team === 'POLICE') {
              const d = myPos.distanceTo(p.mesh.position);
              if (d < minCopDist) {
                minCopDist = d;
                nearestCop = p;
              }
            }
          }

          // If cop within 12m, EVADE
          if (nearestCop && minCopDist < 12) {
            ai.behavior = 'EVADE';
            const fleeDir = AIController._scratchFleeDir.subVectors(myPos, nearestCop.mesh.position);
            fleeDir.y = 0;
            fleeDir.normalize();
            ai.targetPos.copy(myPos).addScaledVector(fleeDir, 18);
            input.sprint = true;
            if (Math.random() < 0.03) input.jump = true;
            if (Math.random() < 0.02) input.slide = true;
          } else {
            if (ai.timer > 8 || myPos.distanceTo(ai.targetPos) < 2) {
              ai.targetPos = this.getProtestPlazaPoint();
              ai.timer = 0;
            }
          }
        }

        const dir = AIController._scratchDir.subVectors(ai.targetPos, myPos);
        dir.y = 0;
        if (dir.lengthSq() > 0.25) {
          dir.normalize();
          input.moveForward = 1;
          ai.controller.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }

      // Update movement and collisions
      ai.controller.update(delta, input, colliders);
    }
  }

  private getRandomPatrolPoint(): THREE.Vector3 {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      0,
      (Math.random() - 0.5) * 80
    );
  }

  private getProtestPlazaPoint(): THREE.Vector3 {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 35,
      0,
      15 + Math.random() * 25
    );
  }

  public clear() {
    this.aiUnits = [];
  }
}
