import * as THREE from 'three';
import { CharacterController, MovementInput } from './CharacterController';
import { Collider } from './MapBuilder';
import { Team } from '../types/game';

export interface AIState {
  controller: CharacterController;
  behavior: 'PATROL' | 'PURSUIT' | 'ESCORT' | 'EVADE' | 'RESCUE' | 'CHANT';
  targetPos: THREE.Vector3;
  timer: number;
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
    onTriggerGrapple: (cop: CharacterController, protestor: CharacterController) => void
  ) {
    for (const ai of this.aiUnits) {
      if (ai.controller.state.isDetained || ai.controller.state.isGrappled) {
        continue;
      }

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
        // --- POLICE AI LOGIC ---
        // Find closest active (free) protestor
        let closestProtestor: CharacterController | null = null;
        let minDist = Infinity;

        for (let pIdx = 0; pIdx < allPlayers.length; pIdx++) {
          const p = allPlayers[pIdx];
          if (p.state.team === 'PROTESTOR' && !p.state.isDetained && !p.state.isGrappled) {
            const dist = myPos.distanceTo(p.mesh.position);
            if (dist < minDist) {
              minDist = dist;
              closestProtestor = p;
            }
          }
        }

        // If a protestor is within 32m, switch to PURSUIT
        if (closestProtestor && minDist < 32) {
          ai.behavior = 'PURSUIT';
          ai.targetPos.copy(closestProtestor.mesh.position);

          // If within grapple range (2.0m), trigger catch!
          if (minDist < 2.0) {
            onTriggerGrapple(ai.controller, closestProtestor);
          }
        } else {
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
