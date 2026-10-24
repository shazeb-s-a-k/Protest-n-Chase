import * as THREE from 'three';
import { Team, PlayerState } from '../types/game';
import { Collider } from './MapBuilder';
import { audioManager } from './AudioManager';

export interface MovementInput {
  moveForward: number; // -1 to 1
  moveRight: number;   // -1 to 1
  sprint: boolean;
  jump: boolean;
  slide: boolean;
}

export class CharacterController {
  public mesh: THREE.Group;
  public state: PlayerState;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = true;
  public currentStamina: number = 100;
  public maxStamina: number = 100;

  // Visual Limbs for procedural animation
  private leftArm?: THREE.Mesh;
  private rightArm?: THREE.Mesh;
  private leftLeg?: THREE.Mesh;
  private rightLeg?: THREE.Mesh;
  private accessoryGroup?: THREE.Group;
  private animTimer: number = 0;

  // Collision
  public radius: number = 0.55;
  public height: number = 1.8;

  constructor(scene: THREE.Scene, state: PlayerState) {
    this.state = state;
    this.mesh = this.buildCharacterMesh(state.team);
    this.mesh.position.set(state.position.x, state.position.y, state.position.z);
    this.mesh.rotation.y = state.rotation;
    scene.add(this.mesh);
  }

  /**
   * Procedural stylized low-poly character model
   */
  private buildCharacterMesh(team: Team): THREE.Group {
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });

    let clothMat: THREE.MeshStandardMaterial;
    let pantsMat: THREE.MeshStandardMaterial;

    if (team === 'PROTESTOR') {
      // Vibrant Gen-Z streetwear hoodie (Hot Pink & Cyan highlights)
      clothMat = new THREE.MeshStandardMaterial({
        color: 0xec4899, // Bright pink hoodie
        roughness: 0.7,
      });
      pantsMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b, // Dark denim cargo pants
        roughness: 0.8,
      });
    } else {
      // Delhi Police Khaki/Navy Tactical Uniform
      clothMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a, // Tactical Police Blue
        roughness: 0.5,
      });
      pantsMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Dark Navy trousers
        roughness: 0.7,
      });
    }

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    const torso = new THREE.Mesh(torsoGeo, clothMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    if (team === 'POLICE') {
      // Police High-Vis / Tactical Vest
      const vestGeo = new THREE.BoxGeometry(0.74, 0.65, 0.5);
      const vestMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const vest = new THREE.Mesh(vestGeo, vestMat);
      vest.position.y = 1.1;
      group.add(vest);

      // Yellow Police Badge
      const badgeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.05);
      const badgeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.set(0.18, 1.25, 0.28);
      group.add(badge);
    } else {
      // Protest Slogan Badge on Chest ("VOICE")
      const badgeGeo = new THREE.BoxGeometry(0.35, 0.15, 0.05);
      const badgeMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.set(0, 1.2, 0.25);
      group.add(badge);
    }

    // 2. Head & Hair/Cap
    const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);

    if (team === 'PROTESTOR') {
      // Trendy Cap (Backwards)
      const capGeo = new THREE.BoxGeometry(0.46, 0.18, 0.5);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 1.88, -0.05);
      group.add(cap);

      // Sunglasses / Shades
      const glassesGeo = new THREE.BoxGeometry(0.34, 0.1, 0.08);
      const glassesMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 });
      const glasses = new THREE.Mesh(glassesGeo, glassesMat);
      glasses.position.set(0, 1.7, 0.23);
      group.add(glasses);
    } else {
      // Police Beret / Peaked Cap
      const capGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.2, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x854d0e }); // Khaki/Brown beret
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 1.95, 0);
      group.add(cap);
    }

    // 3. Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    armGeo.translate(0, -0.3, 0); // pivot at shoulder

    this.leftArm = new THREE.Mesh(armGeo, clothMat);
    this.leftArm.position.set(-0.48, 1.45, 0);
    this.leftArm.castShadow = true;
    group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, clothMat);
    this.rightArm.position.set(0.48, 1.45, 0);
    this.rightArm.castShadow = true;
    group.add(this.rightArm);

    // 4. Held Items (Megaphone/Phone vs Tactical Baton)
    this.accessoryGroup = new THREE.Group();
    if (team === 'PROTESTOR') {
      // Red & White Megaphone in right hand
      const megaCone = new THREE.ConeGeometry(0.18, 0.45, 12);
      const megaMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
      const megaphone = new THREE.Mesh(megaCone, megaMat);
      megaphone.rotation.x = Math.PI / 2;
      megaphone.position.set(0, -0.5, 0.25);
      this.accessoryGroup.add(megaphone);
    } else {
      // Police Tactical Baton
      const batonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
      const batonMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3 });
      const baton = new THREE.Mesh(batonGeo, batonMat);
      baton.rotation.x = Math.PI / 4;
      baton.position.set(0, -0.4, 0.2);
      this.accessoryGroup.add(baton);
    }
    this.rightArm.add(this.accessoryGroup);

    // 5. Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.85, 0.24);
    legGeo.translate(0, -0.4, 0); // pivot at hip

    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.2, 0.7, 0);
    this.leftLeg.castShadow = true;
    group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.2, 0.7, 0);
    this.rightLeg.castShadow = true;
    group.add(this.rightLeg);

    return group;
  }

  /**
   * Updates player physics, movement, and animations
   */
  public update(delta: number, input: MovementInput, colliders: Collider[]) {
    if (this.state.isDetained) {
      // Detained inside bus, play gentle idle
      this.animTimer += delta * 2;
      if (this.leftArm) this.leftArm.rotation.x = Math.sin(this.animTimer) * 0.2;
      return;
    }

    if (this.state.isGrappled) {
      // Locked in struggle minigame
      this.mesh.rotation.y += Math.sin(Date.now() * 0.05) * 0.02;
      return;
    }

    const isProtestor = this.state.team === 'PROTESTOR';
    const baseSpeed = isProtestor ? 11.5 : 8.5; // Subway Surfers quick agility
    let speed = baseSpeed;

    // Sprint & Stamina
    if (input.sprint && this.currentStamina > 5) {
      speed *= isProtestor ? 1.55 : 1.45;
      this.currentStamina = Math.max(0, this.currentStamina - delta * 25);
      this.state.isSprinting = true;
    } else {
      this.currentStamina = Math.min(this.maxStamina, this.currentStamina + delta * 18);
      this.state.isSprinting = false;
    }

    // Slide Mechanic (Subway Surfers parkour slide under barricades)
    if (input.slide && this.isGrounded && !this.state.isSliding) {
      this.state.isSliding = true;
      audioManager.playParkourAction('SLIDE');
      setTimeout(() => {
        this.state.isSliding = false;
      }, 550);
    }

    // Jump Mechanic
    if (input.jump && this.isGrounded && !this.state.isSliding) {
      this.velocity.y = isProtestor ? 8.5 : 7.2;
      this.isGrounded = false;
      this.state.isJumping = true;
      audioManager.playParkourAction('JUMP');
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y -= 22 * delta;
    }

    // Movement Direction calculation
    const moveDir = new THREE.Vector3();
    if (input.moveForward !== 0 || input.moveRight !== 0) {
      // Calculate world direction based on input
      moveDir.set(input.moveRight, 0, -input.moveForward).normalize();

      // Smooth rotate mesh to facing direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.mesh.rotation.y = targetAngle;
      this.state.rotation = targetAngle;
    }

    // Proposed new position
    const moveOffset = moveDir.clone().multiplyScalar(speed * delta);
    const nextX = this.mesh.position.x + moveOffset.x;
    const nextZ = this.mesh.position.z + moveOffset.z;
    const nextY = Math.max(0, this.mesh.position.y + this.velocity.y * delta);

    // Collision check against map colliders
    const newPos = this.resolveCollisions(nextX, nextY, nextZ, colliders);

    this.mesh.position.copy(newPos);
    this.state.position = { x: newPos.x, y: newPos.y, z: newPos.z };

    // Check Grounded
    if (newPos.y <= 0.05) {
      this.mesh.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.state.isJumping = false;
    }

    // Animate Limbs based on speed & state
    this.animateLimbs(delta, moveDir.length() > 0, speed);
  }

  /**
   * AABB Collision resolution with sliding against obstacles
   */
  private resolveCollisions(
    targetX: number,
    targetY: number,
    targetZ: number,
    colliders: Collider[]
  ): THREE.Vector3 {
    const playerBox = new THREE.Box3();
    const halfR = this.radius;
    const charHeight = this.state.isSliding ? 0.7 : this.height;

    // Check X axis movement
    let resolvedX = targetX;
    playerBox.setFromCenterAndSize(
      new THREE.Vector3(targetX, targetY + charHeight / 2, this.mesh.position.z),
      new THREE.Vector3(halfR * 2, charHeight, halfR * 2)
    );

    for (const c of colliders) {
      // If sliding and collider is a high barricade, allow ducking under
      if (this.state.isSliding && c.type === 'BARRICADE' && targetY < 0.8) {
        continue;
      }
      if (c.box.intersectsBox(playerBox)) {
        resolvedX = this.mesh.position.x; // Block X movement
        break;
      }
    }

    // Check Z axis movement
    let resolvedZ = targetZ;
    playerBox.setFromCenterAndSize(
      new THREE.Vector3(resolvedX, targetY + charHeight / 2, targetZ),
      new THREE.Vector3(halfR * 2, charHeight, halfR * 2)
    );

    for (const c of colliders) {
      if (this.state.isSliding && c.type === 'BARRICADE' && targetY < 0.8) {
        continue;
      }
      if (c.box.intersectsBox(playerBox)) {
        resolvedZ = this.mesh.position.z; // Block Z movement
        break;
      }
    }

    return new THREE.Vector3(resolvedX, targetY, resolvedZ);
  }

  /**
   * Running, sliding, and jumping procedural animations
   */
  private animateLimbs(delta: number, isMoving: boolean, currentSpeed: number) {
    if (this.state.isSliding) {
      // Slide pose: lean back, slide along ground
      this.mesh.rotation.x = -Math.PI / 4;
      if (this.leftLeg) this.leftLeg.rotation.x = -Math.PI / 3;
      if (this.rightLeg) this.rightLeg.rotation.x = -Math.PI / 3;
      return;
    }

    // Reset pitch
    this.mesh.rotation.x = 0;

    if (!this.isGrounded) {
      // In-air jump pose
      if (this.leftLeg) this.leftLeg.rotation.x = -Math.PI / 6;
      if (this.rightLeg) this.rightLeg.rotation.x = Math.PI / 6;
      if (this.leftArm) this.leftArm.rotation.x = Math.PI / 4;
      return;
    }

    if (isMoving) {
      const animRate = currentSpeed * 0.9;
      this.animTimer += delta * animRate;

      const swing = Math.sin(this.animTimer) * 0.75;
      if (this.leftLeg) this.leftLeg.rotation.x = swing;
      if (this.rightLeg) this.rightLeg.rotation.x = -swing;
      if (this.leftArm) this.leftArm.rotation.x = -swing;
      if (this.rightArm) this.rightArm.rotation.x = swing * 0.5; // slight arm swing with item
    } else {
      // Idle breathing
      this.animTimer += delta * 2;
      const breathe = Math.sin(this.animTimer) * 0.08;
      if (this.leftLeg) this.leftLeg.rotation.x = 0;
      if (this.rightLeg) this.rightLeg.rotation.x = 0;
      if (this.leftArm) this.leftArm.rotation.x = breathe;
      if (this.rightArm) this.rightArm.rotation.x = -breathe;
    }
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.mesh);
  }
}
