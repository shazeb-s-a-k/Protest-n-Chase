import * as THREE from 'three';
import { CharacterController, MovementInput } from './CharacterController';
import { Collider } from './MapBuilder';
import { Team } from '../types/game';

export interface AIState {
  controller: CharacterController;
  behavior: 'PATROL' | 'PURSUIT' | 'ESCORT' | 'EVADE' | 'RESCUE' | 'CHANT';
  targetPos: THREE.Vector3;
  timer: number;
  grappleCooldown?: number;
  tackleWindupTimer?: number;
  assignedBusPos?: THREE.Vector3;
}

export class AIController {
  private aiUnits: AIState[] = [];

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
        // Find closest active (free) protestor
        let closestProtestor: CharacterController | null = null;
        let minDist = Infinity;

        // Count how many cops are already pursuing the local player
        let copsPursuingLocal = 0;
        const localP = allPlayers.find((p) => p.state.isLocal);
        for (const otherAi of this.aiUnits) {
          if (otherAi !== ai && otherAi.controller.state.team === 'POLICE' && otherAi.behavior === 'PURSUIT') {
            if (localP && otherAi.targetPos.distanceTo(localP.mesh.position) < 5) {
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
        // Check for approaching police
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
          // Flee in opposite direction (Zero-GC)
          const fleeDir = AIController._scratchFleeDir.subVectors(myPos, nearestCop.mesh.position);
          fleeDir.y = 0;
          fleeDir.normalize();
          ai.targetPos.copy(myPos).addScaledVector(fleeDir, 18);
          input.sprint = true;
          // Dodge maneuvers
          if (Math.random() < 0.03) input.jump = true;
          if (Math.random() < 0.02) input.slide = true;
        } else {
          // Wander peacefully near stage or Samrat Yantra and chant
          if (ai.timer > 8 || myPos.distanceTo(ai.targetPos) < 2) {
            ai.targetPos = this.getProtestPlazaPoint();
            ai.timer = 0;
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
