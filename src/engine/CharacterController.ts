import * as THREE from 'three';
import { Team, PlayerState, WardrobeConfig, EmoteType, PlacardStyle } from '../types/game';
import { Collider } from './MapBuilder';
import { audioManager } from './AudioManager';
import { TextureGenerator } from './TextureGenerator';
import { ParticleSystem } from './ParticleSystem';

export interface MovementInput {
  moveForward: number; // -1 to 1
  moveRight: number;   // -1 to 1
  sprint: boolean;
  jump: boolean;
  slide: boolean;
}

/**
 * AAA-Grade Stylized 3D Character Controller
 * Features smooth anatomical proportions, PBR materials, detailed apparel,
 * realistic streetwear/tactical gear, and dynamic articulated limb physics.
 */
export class CharacterController {
  public mesh: THREE.Group;
  public state: PlayerState;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = true;
  public currentStamina: number = 100;
  public maxStamina: number = 100;
  public particleSystem: ParticleSystem | null = null;
  public isInPuddle: boolean = false;

  // Visual Limbs for procedural animation
  private leftArmGroup?: THREE.Group;
  private rightArmGroup?: THREE.Group;
  private leftLegGroup?: THREE.Group;
  private rightLegGroup?: THREE.Group;
  private headGroup?: THREE.Group;
  private torsoGroup?: THREE.Group;
  private accessoryGroup?: THREE.Group;
  private placardMesh?: THREE.Mesh;
  private auraRing?: THREE.Mesh;
  private animTimer: number = 0;

  // Collision
  public radius: number = 0.38;
  public height: number = 1.80;

  // Ability Overdrive & Dash State
  public dashTimer: number = 0;
  public dashDirection: THREE.Vector3 = new THREE.Vector3();
  public pursuitTimer: number = 0;
  public stunTimer: number = 0;
  public policeLightLeft?: THREE.PointLight;
  public policeLightRight?: THREE.PointLight;

  // Slide-Jump Momentum Surge & Emote State
  public slideSurgeTimer: number = 0;
  public slideSurgeDirection: THREE.Vector3 = new THREE.Vector3();
  public currentEmote: EmoteType | null = null;
  public emoteTimer: number = 0;
  private hoodieMat?: THREE.MeshStandardMaterial;
  private headwearGroup?: THREE.Group;

  // Zero-GC scratch instances to eliminate thousands of allocations per second
  private static _scratchMoveDir = new THREE.Vector3();
  private static _scratchPlayerBox = new THREE.Box3();
  private static _scratchBoxCenter = new THREE.Vector3();
  private static _scratchBoxSize = new THREE.Vector3();
  private static _scratchResolvedPos = new THREE.Vector3();

  constructor(scene: THREE.Scene, state: PlayerState, wardrobe?: WardrobeConfig) {
    this.state = state;
    this.mesh = this.buildCharacterMesh(state.team);
    this.mesh.position.set(state.position.x, state.position.y, state.position.z);
    this.mesh.rotation.y = state.rotation;
    scene.add(this.mesh);

    if (wardrobe) {
      this.applyWardrobe(wardrobe);
    }
  }

  /**
   * Builds an anatomically stylized, high-detail character model
   */
  private buildCharacterMesh(team: Team): THREE.Group {
    const root = new THREE.Group();
    const isProtestor = team === 'PROTESTOR';

    // Materials with PBR textures
    const fabricBump = TextureGenerator.getFabricBumpTexture();
    const kevlarBump = TextureGenerator.getTacticalKevlarTexture();

    // Skin Material with warm subsurface feel
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.65,
      metalness: 0.05,
    });

    // Hair Material with anisotropic sheen
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.45,
      metalness: 0.1,
    });

    // Clothing Materials
    let hoodieMat: THREE.MeshStandardMaterial;
    let pantsMat: THREE.MeshStandardMaterial;

    if (isProtestor) {
      hoodieMat = new THREE.MeshStandardMaterial({
        color: 0xec4899, // Vibrant Electric Magenta
        roughness: 0.75,
        bumpMap: fabricBump,
        bumpScale: 0.03,
      });
      pantsMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b, // Dark Navy Denim
        roughness: 0.8,
        bumpMap: fabricBump,
        bumpScale: 0.04,
      });
    } else {
      hoodieMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a, // Tactical Gendarmerie/Delhi Blue
        roughness: 0.55,
        bumpMap: fabricBump,
        bumpScale: 0.02,
      });
      pantsMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Riot Black/Navy Cargo BDUs
        roughness: 0.65,
        bumpMap: fabricBump,
        bumpScale: 0.03,
      });
    }

    this.hoodieMat = hoodieMat;

    // ==============================================================
    // 1. Torso & Upper Body
    // ==============================================================
    const torsoGroup = new THREE.Group();
    this.torsoGroup = torsoGroup;
    torsoGroup.position.y = 1.05;

    // Sculpted upper chest & belly (tapered cylinder for athletic build)
    const chestGeo = new THREE.CylinderGeometry(0.35, 0.30, 0.62, 16);
    const chest = new THREE.Mesh(chestGeo, hoodieMat);
    chest.position.y = 0.31;
    chest.castShadow = true;
    chest.receiveShadow = true;
    torsoGroup.add(chest);

    // Rounded shoulders yoke
    const shoulderYokeGeo = new THREE.SphereGeometry(0.36, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const shoulderYoke = new THREE.Mesh(shoulderYokeGeo, hoodieMat);
    shoulderYoke.position.y = 0.55;
    shoulderYoke.scale.set(1.05, 0.5, 0.95);
    torsoGroup.add(shoulderYoke);

    // Hips / Pelvis
    const hipsGeo = new THREE.CylinderGeometry(0.30, 0.28, 0.22, 14);
    const hips = new THREE.Mesh(hipsGeo, pantsMat);
    hips.position.y = -0.05;
    hips.castShadow = true;
    torsoGroup.add(hips);

    // Stitched Leather Belt with Polished Metal Buckle
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6 });
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.2 });
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.07, 16), beltMat);
    belt.position.y = 0.04;
    torsoGroup.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.04), buckleMat);
    buckle.position.set(0, 0.04, 0.31);
    torsoGroup.add(buckle);

    if (isProtestor) {
      // Kangaroo pocket on belly
      const pocketGeo = new THREE.BoxGeometry(0.38, 0.22, 0.12);
      const pocketMat = new THREE.MeshStandardMaterial({
        color: 0xdb2777,
        roughness: 0.7,
      });
      const pocket = new THREE.Mesh(pocketGeo, pocketMat);
      pocket.position.set(0, 0.24, 0.26);
      torsoGroup.add(pocket);

      // Crossbody tactical streetwear sling bag
      const strapGeo = new THREE.TorusGeometry(0.38, 0.03, 8, 24);
      const strapMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 });
      const strap = new THREE.Mesh(strapGeo, strapMat);
      strap.rotation.x = Math.PI / 3;
      strap.rotation.y = Math.PI / 6;
      strap.position.set(0, 0.32, 0);
      torsoGroup.add(strap);

      // Sling pouch on hip/back
      const pouchGeo = new THREE.BoxGeometry(0.24, 0.28, 0.12);
      const pouchMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4, // Cyan utility pouch
        roughness: 0.4,
        metalness: 0.2,
      });
      const pouch = new THREE.Mesh(pouchGeo, pouchMat);
      pouch.position.set(-0.25, 0.15, -0.22);
      pouch.rotation.y = 0.4;
      torsoGroup.add(pouch);
    } else {
      // Tactical Ballistic Plate Carrier / Body Armor
      const vestGeo = new THREE.BoxGeometry(0.72, 0.56, 0.54);
      const vestMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.45,
        metalness: 0.2,
        bumpMap: kevlarBump,
        bumpScale: 0.05,
      });
      const vest = new THREE.Mesh(vestGeo, vestMat);
      vest.position.set(0, 0.34, 0);
      vest.castShadow = true;
      torsoGroup.add(vest);

      // MOLLE tactical webbing strips
      const molleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      [-0.08, 0.02, 0.12].forEach((offsetY) => {
        const molleGeo = new THREE.BoxGeometry(0.56, 0.04, 0.02);
        const molle = new THREE.Mesh(molleGeo, molleMat);
        molle.position.set(0, 0.34 + offsetY, 0.28);
        torsoGroup.add(molle);
      });

      // Polished Gold Police Badge
      const badgeGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.02, 6);
      const badgeMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.95,
        roughness: 0.15,
      });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.rotation.x = Math.PI / 2;
      badge.position.set(0.18, 0.46, 0.28);
      torsoGroup.add(badge);

      // Body-cam with blue blinking LED indicator
      const camGeo = new THREE.BoxGeometry(0.09, 0.09, 0.04);
      const camMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2 });
      const cam = new THREE.Mesh(camGeo, camMat);
      cam.position.set(-0.18, 0.45, 0.28);
      torsoGroup.add(cam);

      const ledGeo = new THREE.SphereGeometry(0.015, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(-0.18, 0.47, 0.31);
      torsoGroup.add(led);

      // Emergency Tactical Shoulder Strobes for Pursuit Overdrive
      const leftBeacon = new THREE.PointLight(0xef4444, 0, 5);
      leftBeacon.position.set(-0.35, 0.58, 0);
      torsoGroup.add(leftBeacon);
      this.policeLightLeft = leftBeacon;

      const rightBeacon = new THREE.PointLight(0x3b82f6, 0, 5);
      rightBeacon.position.set(0.35, 0.58, 0);
      torsoGroup.add(rightBeacon);
      this.policeLightRight = rightBeacon;
    }

    root.add(torsoGroup);

    // ==============================================================
    // 2. Sculpted Head, Face, Hair & Headgear
    // ==============================================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.72, 0);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = -0.16;
    this.headGroup.add(neck);

    // Head Base (Curved stylized cranial geometry)
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    headGeo.scale(0.95, 1.1, 1.0);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Stylized Eyes with white sclera & pupil
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.1 });

    [-0.08, 0.08].forEach((eyeX) => {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), eyeWhiteMat);
      eyeWhite.position.set(eyeX, 0.04, 0.22);
      this.headGroup?.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), pupilMat);
      pupil.position.set(eyeX, 0.04, 0.245);
      this.headGroup?.add(pupil);
    });

    if (isProtestor) {
      // Layered Streetwear Hair
      const hairGeo = new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 0.06, -0.02);
      this.headGroup.add(hair);

      // Dynamic Headwear Mount Point for Wardrobe Customizer
      this.headwearGroup = new THREE.Group();
      this.headGroup.add(this.headwearGroup);

      // Snapback Cap with curved visor
      const capDomeGeo = new THREE.SphereGeometry(0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4, // Cyan Streetwear Cap
        roughness: 0.6,
      });
      const capDome = new THREE.Mesh(capDomeGeo, capMat);
      capDome.position.set(0, 0.08, -0.01);
      this.headwearGroup.add(capDome);

      // Curved Cap Visor / Bill
      const visorGeo = new THREE.BoxGeometry(0.28, 0.025, 0.22);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 0.1, 0.28);
      visor.rotation.x = -0.15;
      this.headwearGroup.add(visor);

      // Iconic Vice City Gold Aviator Sunglasses
      const shadesFrameMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.15 });
      const shadesLensMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.05 });
      [-0.08, 0.08].forEach((sx) => {
        const lensGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.015, 12);
        const lens = new THREE.Mesh(lensGeo, shadesLensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(sx, 0.04, 0.24);
        this.headwearGroup?.add(lens);

        const frame = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 16), shadesFrameMat);
        frame.position.set(sx, 0.04, 0.245);
        this.headwearGroup?.add(frame);
      });
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.01), shadesFrameMat);
      bridge.position.set(0, 0.06, 0.245);
      this.headwearGroup.add(bridge);

      // Chunky DJ / Streetwear Wireless Headphones around neck
      const hpBandGeo = new THREE.TorusGeometry(0.22, 0.025, 8, 20, Math.PI * 1.3);
      const hpMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });
      const hpBand = new THREE.Mesh(hpBandGeo, hpMat);
      hpBand.rotation.x = Math.PI / 2;
      hpBand.position.set(0, -0.1, 0.02);
      this.headGroup.add(hpBand);

      // Ear cups
      [-0.23, 0.23].forEach((cupX) => {
        const cupGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12);
        const cupMat = new THREE.MeshStandardMaterial({ color: 0xec4899, metalness: 0.85, roughness: 0.15 });
        const cup = new THREE.Mesh(cupGeo, cupMat);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(cupX, -0.08, 0.06);
        this.headGroup?.add(cup);
      });
    } else {
      // High-Detail Police Riot Helmet with ballistic visor
      const helmetGeo = new THREE.SphereGeometry(0.28, 16, 14);
      const helmetMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.35,
        metalness: 0.4,
      });
      const helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.set(0, 0.08, -0.01);
      helmet.castShadow = true;
      this.headGroup.add(helmet);

      // Helmet visor mount rim
      const rimGeo = new THREE.TorusGeometry(0.27, 0.02, 8, 24, Math.PI);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, 0.08, 0);
      this.headGroup.add(rim);

      // Transparent Curved Polycarbonate Ballistic Visor
      const visorGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.22, 16, 1, true, -Math.PI / 2.5, Math.PI / 1.25);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.52,
        roughness: 0.08,
        metalness: 0.85,
      });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.02, 0.02);
      this.headGroup.add(visor);
    }

    root.add(this.headGroup);

    // ==============================================================
    // 3. Articulated Legs & Detailed Footwear
    // ==============================================================
    // Build Left Leg
    this.leftLegGroup = this.buildArticulatedLeg(-0.18, pantsMat, isProtestor);
    root.add(this.leftLegGroup);

    // Build Right Leg
    this.rightLegGroup = this.buildArticulatedLeg(0.18, pantsMat, isProtestor);
    root.add(this.rightLegGroup);

    // ==============================================================
    // 4. Articulated Arms & Detailed Handheld Gear
    // ==============================================================
    // Build Left Arm
    this.leftArmGroup = this.buildArticulatedArm(-0.42, hoodieMat, skinMat, isProtestor);
    root.add(this.leftArmGroup);

    // Build Right Arm
    this.rightArmGroup = this.buildArticulatedArm(0.42, hoodieMat, skinMat, isProtestor);
    root.add(this.rightArmGroup);

    // Held Accessories
    this.accessoryGroup = new THREE.Group();

    if (isProtestor) {
      // 3D Realistic Megaphone
      const megaGroup = this.createDetailedMegaphone();
      megaGroup.position.set(0, -0.55, 0.22);
      this.accessoryGroup.add(megaGroup);

      // 3D Protest Placard in Left Hand
      this.placardMesh = this.createHeldPlacard(this.state.placardText || 'AWAAZ');
      this.leftArmGroup.add(this.placardMesh);
    } else {
      // Police Ballistic Riot Shield
      const shieldGroup = this.createBallisticRiotShield();
      shieldGroup.position.set(0, -0.45, 0.25);
      this.leftArmGroup.add(shieldGroup);

      // Tactical Stun Baton in Right Hand
      const batonGroup = this.createTacticalBaton();
      batonGroup.position.set(0, -0.52, 0.18);
      this.accessoryGroup.add(batonGroup);
    }

    this.rightArmGroup.add(this.accessoryGroup);

    // ==============================================================
    // 5. Glowing Human Chain Ground Resonance Aura Ring
    // ==============================================================
    const ringGeo = new THREE.RingGeometry(0.85, 1.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.auraRing = new THREE.Mesh(ringGeo, ringMat);
    this.auraRing.rotation.x = -Math.PI / 2;
    this.auraRing.position.y = 0.04;
    root.add(this.auraRing);

    return root;
  }

  /**
   * Builds an articulated leg with thigh, knee, calf, and high-detail sneakers/combat boots
   */
  private buildArticulatedLeg(xPos: number, pantsMat: THREE.Material, isProtestor: boolean): THREE.Group {
    const legGroup = new THREE.Group();
    legGroup.position.set(xPos, 0.95, 0); // Pivoted at hip

    // Upper Thigh
    const thighGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.44, 12);
    thighGeo.translate(0, -0.22, 0);
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Knee Joint
    const kneeGeo = new THREE.SphereGeometry(0.105, 10, 10);
    kneeGeo.translate(0, -0.44, 0);
    const knee = new THREE.Mesh(kneeGeo, pantsMat);
    legGroup.add(knee);

    // Hard-shell tactical knee pad for Police
    if (!isProtestor) {
      const padGeo = new THREE.BoxGeometry(0.18, 0.16, 0.08);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.4 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(0, -0.44, 0.11);
      legGroup.add(pad);
    }

    // Lower Calf / Shin
    const calfGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.42, 12);
    calfGeo.translate(0, -0.65, 0);
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.castShadow = true;
    legGroup.add(calf);

    // High-Detail Footwear: Parkour Sneakers or Tactical Combat Boots
    if (isProtestor) {
      // Parkour High-Top Sneaker
      const soleGeo = new THREE.BoxGeometry(0.24, 0.08, 0.44);
      const soleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.set(0, -0.91, 0.06);
      sole.castShadow = true;
      legGroup.add(sole);

      const upperGeo = new THREE.BoxGeometry(0.22, 0.14, 0.40);
      const upperMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.7 });
      const upper = new THREE.Mesh(upperGeo, upperMat);
      upper.position.set(0, -0.83, 0.06);
      legGroup.add(upper);

      // White Toe Cap
      const toeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.12, 12, 1, false, 0, Math.PI);
      const toe = new THREE.Mesh(toeGeo, soleMat);
      toe.rotation.x = Math.PI / 2;
      toe.position.set(0, -0.83, 0.22);
      legGroup.add(toe);
    } else {
      // Tactical Combat Assault Boot
      const bootGeo = new THREE.BoxGeometry(0.25, 0.22, 0.46);
      const bootMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.4,
        metalness: 0.3,
      });
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(0, -0.84, 0.06);
      boot.castShadow = true;
      legGroup.add(boot);

      // Deep Lugged Rubber Sole
      const lugSoleGeo = new THREE.BoxGeometry(0.26, 0.07, 0.48);
      const lugSoleMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9 });
      const lugSole = new THREE.Mesh(lugSoleGeo, lugSoleMat);
      lugSole.position.set(0, -0.92, 0.06);
      legGroup.add(lugSole);
    }

    return legGroup;
  }

  /**
   * Builds an articulated arm with shoulder, biceps, forearm, and detailed hands/gloves
   */
  private buildArticulatedArm(
    xPos: number,
    clothMat: THREE.Material,
    skinMat: THREE.Material,
    isProtestor: boolean
  ): THREE.Group {
    const armGroup = new THREE.Group();
    armGroup.position.set(xPos, 1.48, 0); // Pivoted at shoulder

    // Shoulder Cap Deltoid
    const shoulderGeo = new THREE.SphereGeometry(0.12, 12, 10);
    const shoulder = new THREE.Mesh(shoulderGeo, clothMat);
    armGroup.add(shoulder);

    // Upper Bicep Arm
    const upperGeo = new THREE.CylinderGeometry(0.10, 0.085, 0.38, 12);
    upperGeo.translate(0, -0.19, 0);
    const upper = new THREE.Mesh(upperGeo, clothMat);
    upper.castShadow = true;
    armGroup.add(upper);

    // Elbow Joint
    const elbowGeo = new THREE.SphereGeometry(0.08, 10, 10);
    elbowGeo.translate(0, -0.38, 0);
    const elbow = new THREE.Mesh(elbowGeo, clothMat);
    armGroup.add(elbow);

    // Forearm
    const foreGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.34, 12);
    foreGeo.translate(0, -0.55, 0);
    const forearm = new THREE.Mesh(foreGeo, isProtestor ? skinMat : clothMat);
    forearm.castShadow = true;
    armGroup.add(forearm);

    // Luxury Gold Chronograph Wristwatch on Left Arm (Tommy Vercetti signature)
    if (xPos < 0 && isProtestor) {
      const watchMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.15 });
      const watchBand = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.016, 8, 16), watchMat);
      watchBand.rotation.x = Math.PI / 2;
      watchBand.position.set(0, -0.62, 0);
      armGroup.add(watchBand);

      const watchFace = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.015, 12), watchMat);
      watchFace.position.set(0, -0.62, 0.085);
      watchFace.rotation.x = Math.PI / 2;
      armGroup.add(watchFace);
    }

    // Hand & Tactical Fingerless Gloves
    const handGeo = new THREE.BoxGeometry(0.13, 0.15, 0.11);
    const gloveMat = isProtestor
      ? new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.7 })
      : new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.3 });
    const hand = new THREE.Mesh(handGeo, gloveMat);
    hand.position.set(0, -0.74, 0.02);
    armGroup.add(hand);

    return armGroup;
  }

  /**
   * Creates a high-detail 3D Megaphone with flared horn, acoustic cone, handle, and trigger
   */
  private createDetailedMegaphone(): THREE.Group {
    const mega = new THREE.Group();

    // Flared acoustic horn
    const hornGeo = new THREE.ConeGeometry(0.19, 0.48, 16, 1, true);
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red Body
      roughness: 0.3,
      metalness: 0.2,
    });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.rotation.x = Math.PI / 2;
    mega.add(horn);

    // Chrome front rim ring
    const rimGeo = new THREE.TorusGeometry(0.19, 0.015, 8, 24);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(0, 0, 0.24);
    mega.add(rim);

    // Rear battery enclosure
    const rearGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.18, 16);
    const rearMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
    const rear = new THREE.Mesh(rearGeo, rearMat);
    rear.rotation.x = Math.PI / 2;
    rear.position.set(0, 0, -0.16);
    mega.add(rear);

    // Pistol grip handle
    const handleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10);
    const handle = new THREE.Mesh(handleGeo, rearMat);
    handle.position.set(0, -0.16, -0.08);
    handle.rotation.x = -0.2;
    mega.add(handle);

    return mega;
  }

  /**
   * Creates a curved ballistic riot shield with aluminum border & POLICE stencil
   */
  private createBallisticRiotShield(): THREE.Group {
    const shield = new THREE.Group();

    // Curved transparent polycarbonate shield body
    const bodyGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.25, 20, 1, true, -Math.PI / 3.5, Math.PI / 1.75);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.85,
      side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.y = Math.PI;
    body.position.set(0, 0, 0);
    shield.add(body);

    // Aluminum reinforced border
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    [-0.62, 0.62].forEach((offsetY) => {
      const bGeo = new THREE.CylinderGeometry(0.66, 0.66, 0.04, 20, 1, true, -Math.PI / 3.5, Math.PI / 1.75);
      const b = new THREE.Mesh(bGeo, borderMat);
      b.rotation.y = Math.PI;
      b.position.y = offsetY;
      shield.add(b);
    });

    return shield;
  }

  /**
   * Creates a tactical stun baton with ribbed grip
   */
  private createTacticalBaton(): THREE.Group {
    const baton = new THREE.Group();

    const shaftGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.85, 12);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.5 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.x = Math.PI / 3.5;
    baton.add(shaft);

    const gripGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.24, 12);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.25, -0.15);
    grip.rotation.x = Math.PI / 3.5;
    baton.add(grip);

    return baton;
  }

  /**
   * Creates held protest placard with wood pole and high-res canvas poster
   */
  private createHeldPlacard(text: string): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, 0, 512, 320);

      // Weathered border
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 12;
      ctx.strokeRect(8, 8, 496, 304);

      ctx.fillStyle = '#090d16';
      ctx.font = '900 48px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, 175);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const boardGeo = new THREE.BoxGeometry(0.85, 0.58, 0.025);
    const boardMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, -0.48, 0.32);
    board.rotation.y = Math.PI / 5;
    return board;
  }

  public updatePlacardText(newText: string) {
    if (!this.placardMesh) return;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, 0, 512, 320);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 12;
      ctx.strokeRect(8, 8, 496, 304);
      ctx.fillStyle = '#090d16';
      ctx.font = '900 48px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(newText, 256, 175);
    }
    const tex = new THREE.CanvasTexture(canvas);
    (this.placardMesh.material as THREE.MeshStandardMaterial).map = tex;
    (this.placardMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
  }

  /**
   * Applies customizable Wardrobe configuration (Jacket color, Headwear model, Placard style)
   */
  public applyWardrobe(config: WardrobeConfig) {
    // 1. Custom Jacket Style
    if (this.hoodieMat) {
      const colors: Record<string, number> = {
        ELECTRIC_PINK: 0xec4899,
        TACTICAL_BLUE: 0x1e3a8a,
        CYBER_YELLOW: 0xfacc15,
        KHADI_GREEN: 0x15803d,
        PARIS_TRICOLORE: 0x2563eb,
      };
      const hex = colors[config.jacket] || 0xec4899;
      this.hoodieMat.color.setHex(hex);
      this.hoodieMat.needsUpdate = true;
    }

    // 2. Headwear Stylization
    if (this.headwearGroup) {
      while (this.headwearGroup.children.length > 0) {
        const child = this.headwearGroup.children[0];
        this.headwearGroup.remove(child);
      }

      if (config.headwear === 'AVIATORS') {
        const shadesFrameMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.15 });
        const shadesLensMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.05 });
        [-0.08, 0.08].forEach((sx) => {
          const lensGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.015, 12);
          const lens = new THREE.Mesh(lensGeo, shadesLensMat);
          lens.rotation.x = Math.PI / 2;
          lens.position.set(sx, 0.04, 0.24);
          this.headwearGroup?.add(lens);

          const frame = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 16), shadesFrameMat);
          frame.position.set(sx, 0.04, 0.245);
          this.headwearGroup?.add(frame);
        });
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.01), shadesFrameMat);
        bridge.position.set(0, 0.06, 0.245);
        this.headwearGroup.add(bridge);
      } else if (config.headwear === 'PRESS_BERET') {
        const beretGeo = new THREE.CylinderGeometry(0.26, 0.3, 0.08, 16);
        const beretMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
        const beret = new THREE.Mesh(beretGeo, beretMat);
        beret.position.set(0.05, 0.14, 0);
        beret.rotation.z = -0.18;
        this.headwearGroup.add(beret);
      } else if (config.headwear === 'STREET_BEANIE') {
        const beanieGeo = new THREE.SphereGeometry(0.265, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7);
        const beanieMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 });
        const beanie = new THREE.Mesh(beanieGeo, beanieMat);
        beanie.position.set(0, 0.08, -0.01);
        this.headwearGroup.add(beanie);
      } else if (config.headwear === 'BANDANA') {
        const bandGeo = new THREE.TorusGeometry(0.25, 0.04, 8, 20);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.rotation.x = Math.PI / 2;
        band.position.set(0, 0.06, 0.02);
        this.headwearGroup.add(band);
      }
    }

    // 3. Placard Aesthetic
    if (this.placardMesh) {
      this.updatePlacardStyle(config.placardStyle, this.state.placardText || 'AWAAZ');
    }
  }

  /**
   * Updates held placard material based on wardrobe placard style
   */
  public updatePlacardStyle(style: PlacardStyle, text: string) {
    if (!this.placardMesh) return;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (style === 'NEON_CYBER') {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 512, 320);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 10;
        ctx.strokeRect(8, 8, 496, 304);
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
      } else if (style === 'GOLD_LEAF') {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 512, 320);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 12;
        ctx.strokeRect(8, 8, 496, 304);
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
      } else if (style === 'FLAG_BANNER') {
        ctx.fillStyle = '#ff9933';
        ctx.fillRect(0, 0, 512, 106);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 106, 512, 108);
        ctx.fillStyle = '#138808';
        ctx.fillRect(0, 214, 512, 106);
        ctx.fillStyle = '#000080';
      } else {
        // CARDBOARD
        ctx.fillStyle = '#d97706';
        ctx.fillRect(0, 0, 512, 320);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 12;
        ctx.strokeRect(8, 8, 496, 304);
        ctx.fillStyle = '#1c1917';
      }
      ctx.font = '900 48px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, 175);
    }
    const tex = new THREE.CanvasTexture(canvas);
    (this.placardMesh.material as THREE.MeshStandardMaterial).map = tex;
    (this.placardMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
  }

  /**
   * Plays expressive procedural emote animation (Bhangra, Fist Pump, Backflip, Chai Sip, Megaphone)
   */
  public playEmote(emote: EmoteType) {
    if (this.state.isDetained || this.state.isGrappled) return;
    this.currentEmote = emote;
    this.emoteTimer = 3.5;

    switch (emote) {
      case 'BHANGRA':
        audioManager.playDholBass(0.42);
        this.particleSystem?.spawnComicPopup('🕺 BHANGRA BEAT!', this.mesh.position, '#f43f5e');
        break;
      case 'FIST_PUMP':
        audioManager.speakSlogan('INQUILAB ZINDABAD!');
        this.particleSystem?.spawnComicPopup('✊ INQUILAB!', this.mesh.position, '#00f0ff');
        break;
      case 'BACKFLIP':
        audioManager.playParkourAction('VAULT');
        this.particleSystem?.spawnComicPopup('⚡ BACKFLIP!', this.mesh.position, '#facc15');
        break;
      case 'CHAI_SIP':
        audioManager.playChaiSip();
        this.particleSystem?.spawnComicPopup('☕ KADAK CHAI!', this.mesh.position, '#f59e0b');
        break;
      case 'MEGAPHONE_SOLO':
        audioManager.playPoliceDispersalWarning();
        this.particleSystem?.spawnComicPopup('📢 AWAAZ DO!', this.mesh.position, '#a855f7');
        break;
    }
  }

  public setHumanChain(active: boolean) {
    this.state.isInHumanChain = active;
    if (this.auraRing) {
      const mat = this.auraRing.material as THREE.MeshBasicMaterial;
      mat.opacity = active ? 0.75 : 0;
    }
    if (active) {
      audioManager.playHumanChainResonance();
    }
  }

  /**
   * Triggers high-speed parkour dash vault for protestors
   */
  public triggerParkourDash(camForward?: THREE.Vector3) {
    this.state.isGrappled = false;
    this.dashTimer = 0.45;
    this.state.invulnerabilityTimer = 2.0;
    if (camForward && (camForward.x !== 0 || camForward.z !== 0)) {
      this.dashDirection.set(camForward.x, 0, camForward.z).normalize();
    } else {
      this.dashDirection.set(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));
    }
    audioManager.playBreakoutDash();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(45);
    }
  }

  /**
   * Triggers tactical pursuit overdrive sprint for police officers
   */
  public triggerPursuitBoost(duration = 3.5) {
    this.pursuitTimer = duration;
    audioManager.startSiren(0.35);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(55);
    }
  }

  /**
   * Updates player physics, movement, and procedural animations
   */
  public update(
    delta: number,
    input: MovementInput,
    colliders: Collider[],
    cameraYaw: number = 0
  ) {
    if (this.state.isDetained) {
      this.animTimer += delta * 2;
      if (this.leftArmGroup) this.leftArmGroup.rotation.x = Math.sin(this.animTimer) * 0.2;
      return;
    }

    if (this.state.isGrappled) {
      this.mesh.rotation.y += Math.sin(Date.now() * 0.05) * 0.02;
      return;
    }

    // Stunned police officer / protestor state (holding ears, unable to move)
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      this.mesh.rotation.y += Math.sin(Date.now() * 0.02) * 0.03;
      if (this.leftArmGroup) this.leftArmGroup.rotation.x = -Math.PI / 1.6;
      if (this.rightArmGroup) this.rightArmGroup.rotation.x = -Math.PI / 1.6;
      return;
    }

    // Grace / Invulnerability Timer
    if (this.state.invulnerabilityTimer && this.state.invulnerabilityTimer > 0) {
      this.state.invulnerabilityTimer -= delta;
      if (this.auraRing) {
        const mat = this.auraRing.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xfacc15); // Golden ethereal shield
        mat.opacity = 0.85 + Math.sin(Date.now() * 0.015) * 0.15;
      }
    } else if (this.auraRing && !this.state.isInHumanChain && !this.state.activePowerUp) {
      const mat = this.auraRing.material as THREE.MeshBasicMaterial;
      mat.opacity = 0;
    }

    // In Human Chain: interlocked arms stance
    if (this.state.isInHumanChain) {
      if (this.leftArmGroup) this.leftArmGroup.rotation.z = -Math.PI / 2.3;
      if (this.rightArmGroup) this.rightArmGroup.rotation.z = Math.PI / 2.3;
      return;
    } else {
      if (this.leftArmGroup) this.leftArmGroup.rotation.z = 0;
      if (this.rightArmGroup) this.rightArmGroup.rotation.z = 0;
    }

    const wasGrounded = this.isGrounded;
    const isProtestor = this.state.team === 'PROTESTOR';
    const baseSpeed = isProtestor ? 11.5 : 8.5;
    let speed = baseSpeed;

    // 1. Check Active Overdrive Abilities
    const isDashing = this.dashTimer > 0;
    if (isDashing) {
      this.dashTimer -= delta;
      speed = 24.5;
    }

    const isSlideSurge = this.slideSurgeTimer > 0;
    if (isSlideSurge) {
      this.slideSurgeTimer -= delta;
      speed = Math.max(speed, 22.0);
    }

    const isPursuit = this.pursuitTimer > 0;
    if (isPursuit) {
      this.pursuitTimer -= delta;
      speed *= 1.72; // Overdrive sprint

      // Alternate shoulder strobes (Red / Blue)
      const strobePhase = Math.floor((this.pursuitTimer * 12) % 2);
      if (this.policeLightLeft) this.policeLightLeft.intensity = strobePhase === 0 ? 4.5 : 0;
      if (this.policeLightRight) this.policeLightRight.intensity = strobePhase === 1 ? 4.5 : 0;

      if (this.pursuitTimer <= 0) {
        if (this.policeLightLeft) this.policeLightLeft.intensity = 0;
        if (this.policeLightRight) this.policeLightRight.intensity = 0;
        audioManager.stopSiren();
      }
    }

    // 2. Sprint & Stamina Mechanics
    if (!isDashing && !isPursuit && !isSlideSurge) {
      if (input.sprint && this.currentStamina > 5) {
        speed *= isProtestor ? 1.55 : 1.45;
        this.currentStamina = Math.max(0, this.currentStamina - delta * 25);
        this.state.isSprinting = true;
      } else {
        this.currentStamina = Math.min(this.maxStamina, this.currentStamina + delta * 18);
        this.state.isSprinting = false;
      }
    } else {
      this.state.isSprinting = true;
    }

    // 3. Momentum Parkour Slide & Slide-Jump Mechanics
    if (input.jump && this.state.isSliding) {
      // Momentum Parkour Slide-Jump: convert slide inertia into massive forward leap!
      this.state.isSliding = false;
      this.velocity.y = isProtestor ? 10.2 : 8.8;
      this.isGrounded = false;
      this.state.isJumping = true;
      this.slideSurgeTimer = 0.45;
      this.slideSurgeDirection.set(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y)).normalize();
      audioManager.playParkourAction('VAULT');
      this.particleSystem?.spawnComicPopup('SLICK SLIDE-JUMP! ⚡', this.mesh.position, '#38bdf8');
      this.particleSystem?.spawnNeonSprintTrail(this.mesh.position, 0x00f0ff);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }
    } else if (input.slide && this.isGrounded && !this.state.isSliding && !isDashing) {
      this.state.isSliding = true;
      this.particleSystem?.spawnSlideDust(this.mesh.position);
      this.particleSystem?.spawnComicPopup('SLICK SLIDE!', this.mesh.position, '#38bdf8');
      audioManager.playParkourAction('SLIDE');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
      setTimeout(() => {
        this.state.isSliding = false;
      }, 550);
    }

    // 4. Jump Mechanic
    if (input.jump && this.isGrounded && !this.state.isSliding) {
      this.velocity.y = isProtestor ? 8.5 : 7.2;
      this.isGrounded = false;
      this.state.isJumping = true;
      audioManager.playParkourAction('JUMP');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(40);
      }
    }

    // 5. Gravity
    if (!this.isGrounded) {
      this.velocity.y -= 22 * delta;
    }

    // 6. Movement Direction calculation (Zero-GC)
    const moveDir = CharacterController._scratchMoveDir.set(0, 0, 0);

    if (isDashing) {
      moveDir.copy(this.dashDirection);
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.mesh.rotation.y = targetAngle;
      this.state.rotation = targetAngle;
      if (Math.random() < 0.35) {
        this.particleSystem?.spawnSpeedLines(this.mesh.position, moveDir);
      }
    } else if (this.state.isAI) {
      if (input.moveForward !== 0) {
        moveDir.set(
          Math.sin(this.mesh.rotation.y) * input.moveForward,
          0,
          Math.cos(this.mesh.rotation.y) * input.moveForward
        );
      }
    } else if (input.moveForward !== 0 || input.moveRight !== 0) {
      // Calculate camera-relative direction in world coordinates
      const forwardX = -Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      moveDir.set(
        forwardX * input.moveForward + rightX * input.moveRight,
        0,
        forwardZ * input.moveForward + rightZ * input.moveRight
      );

      if (moveDir.lengthSq() > 0.001) {
        moveDir.normalize();
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);

        // Smooth shortest-arc character turning
        let diff = targetAngle - this.mesh.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1.0, delta * 18);
        this.state.rotation = this.mesh.rotation.y;
      }
    }

    const nextX = this.mesh.position.x + moveDir.x * speed * delta;
    const nextZ = this.mesh.position.z + moveDir.z * speed * delta;
    const nextY = Math.max(0, this.mesh.position.y + this.velocity.y * delta);

    const newPos = this.resolveCollisions(
      this.mesh.position.x,
      this.mesh.position.y,
      this.mesh.position.z,
      nextX,
      nextY,
      nextZ,
      colliders
    );

    this.mesh.position.copy(newPos);
    this.state.position.x = newPos.x;
    this.state.position.y = newPos.y;
    this.state.position.z = newPos.z;

    if (newPos.y <= 0.05) {
      this.mesh.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.state.isJumping = false;
    }

    if (!wasGrounded && this.isGrounded) {
      this.particleSystem?.spawnSlideDust(this.mesh.position);
      if (this.state.isLocal) {
        audioManager.playParkourAction('LAND');
      }
    }

    this.animateLimbs(delta, moveDir.lengthSq() > 0 || isDashing, speed);
  }

  /**
   * Continuous cylinder-vs-AABB closest-point collision resolution
   * with multi-pass relaxation, sub-stepping to eliminate tunneling,
   * and smooth tangent wall-sliding so players never stick or get trapped.
   */
  private resolveCollisions(
    startX: number,
    startY: number,
    startZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    colliders: Collider[]
  ): THREE.Vector3 {
    const halfR = this.radius;
    const charHeight = this.state.isSliding ? 0.7 : this.height;

    const totalDx = targetX - startX;
    const totalDz = targetZ - startZ;
    const horizontalDist = Math.hypot(totalDx, totalDz);

    // Sub-stepping to completely eliminate tunneling at sprint or dash speeds
    const numSteps = Math.min(4, Math.max(1, Math.ceil(horizontalDist / 0.14)));
    const stepDx = totalDx / numSteps;
    const stepDz = totalDz / numSteps;

    let currX = startX;
    let currZ = startZ;
    let currY = targetY;

    for (let step = 0; step < numSteps; step++) {
      currX += stepDx;
      currZ += stepDz;

      // Relaxation iterations (2 passes) to resolve multiple colliders (e.g. corners)
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < colliders.length; i++) {
          const c = colliders[i];
          const min = c.box.min;
          const max = c.box.max;

          // Slide underneath barricades if sliding
          if (this.state.isSliding && c.type === 'BARRICADE' && currY < 0.8) {
            continue;
          }

          // Vertical bounds
          const playerBottom = currY;
          const playerTop = currY + charHeight;

          // Broadphase 2D/3D distance culling: discard colliders outside interaction sphere
          if (
            currX < min.x - 2.5 ||
            currX > max.x + 2.5 ||
            currZ < min.z - 2.5 ||
            currZ > max.z + 2.5 ||
            min.y > playerTop + 0.1 ||
            max.y < playerBottom - 1.0
          ) {
            continue;
          }

          // Step-up mechanic: smoothly step onto low curbs, stairs, or stage edges (<= 0.38m high)
          const stepOffset = max.y - playerBottom;
          if (stepOffset > 0 && stepOffset <= 0.38) {
            if (
              currX >= min.x - halfR &&
              currX <= max.x + halfR &&
              currZ >= min.z - halfR &&
              currZ <= max.z + halfR
            ) {
              currY = max.y;
              this.isGrounded = true;
              this.velocity.y = 0;
              continue;
            }
          }

          // If obstacle is below feet, check if we can stand on it
          if (max.y <= playerBottom + 0.15) {
            if (
              currX >= min.x - halfR &&
              currX <= max.x + halfR &&
              currZ >= min.z - halfR &&
              currZ <= max.z + halfR
            ) {
              if (startY >= max.y - 0.25) {
                currY = Math.max(currY, max.y);
                this.isGrounded = true;
                this.velocity.y = 0;
              }
            }
            continue;
          }

          // If obstacle is overhead
          if (min.y >= playerTop - 0.05) {
            continue;
          }

          // Horizontal 2D closest point on AABB to player center (currX, currZ)
          const clampedX = Math.max(min.x, Math.min(max.x, currX));
          const clampedZ = Math.max(min.z, Math.min(max.z, currZ));

          const diffX = currX - clampedX;
          const diffZ = currZ - clampedZ;
          const distSq = diffX * diffX + diffZ * diffZ;

          if (distSq < 0.00001) {
            // Player center is inside the bounding box - eject along shallowest axis
            const dLeft = currX - min.x;
            const dRight = max.x - currX;
            const dBack = currZ - min.z;
            const dFront = max.z - currZ;

            const minDist = Math.min(dLeft, dRight, dBack, dFront);
            if (minDist === dLeft) {
              currX = min.x - halfR - 0.01;
            } else if (minDist === dRight) {
              currX = max.x + halfR + 0.01;
            } else if (minDist === dBack) {
              currZ = min.z - halfR - 0.01;
            } else {
              currZ = max.z + halfR + 0.01;
            }
          } else if (distSq < halfR * halfR) {
            // Overlapping cylinder boundary - smooth push-out along contact normal
            const dist = Math.sqrt(distSq);
            const nx = diffX / dist;
            const nz = diffZ / dist;
            const penetration = halfR - dist;

            currX += nx * (penetration + 0.003);
            currZ += nz * (penetration + 0.003);
          }
        }
      }
    }

    // Keep within world bounds
    currX = Math.max(-80, Math.min(80, currX));
    currZ = Math.max(-80, Math.min(80, currZ));

    return CharacterController._scratchResolvedPos.set(currX, currY, currZ);
  }

  /**
   * Procedural articulated limb animations for run, sprint, slide, and jump
   */
  private animateLimbs(delta: number, isMoving: boolean, currentSpeed: number) {
    // 0. Active Emote Animation Overrides
    if (this.currentEmote && this.emoteTimer > 0) {
      if (isMoving || !this.isGrounded) {
        this.currentEmote = null;
        this.emoteTimer = 0;
      } else {
        this.emoteTimer -= delta;
        const t = (3.5 - this.emoteTimer) * 4;

        switch (this.currentEmote) {
          case 'BHANGRA': {
            const armWave = Math.sin(t * 2.2) * 0.45;
            if (this.leftArmGroup) {
              this.leftArmGroup.rotation.x = -Math.PI / 1.4 + armWave;
              this.leftArmGroup.rotation.z = -0.4;
            }
            if (this.rightArmGroup) {
              this.rightArmGroup.rotation.x = -Math.PI / 1.4 - armWave;
              this.rightArmGroup.rotation.z = 0.4;
            }
            if (this.leftLegGroup) this.leftLegGroup.rotation.x = Math.max(0, Math.sin(t * 2)) * 0.5;
            if (this.rightLegGroup) this.rightLegGroup.rotation.x = Math.max(0, -Math.sin(t * 2)) * 0.5;
            if (this.torsoGroup) this.torsoGroup.position.y = 1.05 + Math.abs(Math.sin(t * 2)) * 0.12;
            return;
          }
          case 'FIST_PUMP': {
            if (this.rightArmGroup) {
              this.rightArmGroup.rotation.x = -Math.PI / 1.1 + Math.sin(t * 3) * 0.2;
              this.rightArmGroup.rotation.z = 0.2;
            }
            if (this.leftArmGroup) {
              this.leftArmGroup.rotation.x = 0.2;
              this.leftArmGroup.rotation.z = -0.3;
            }
            if (this.headGroup) this.headGroup.rotation.x = -0.25;
            return;
          }
          case 'BACKFLIP': {
            const progress = (3.5 - this.emoteTimer) / 1.0;
            if (progress <= 1.0) {
              this.mesh.rotation.x = -progress * Math.PI * 2;
              if (this.torsoGroup) this.torsoGroup.position.y = 1.05 + Math.sin(progress * Math.PI) * 1.5;
              if (this.leftLegGroup) this.leftLegGroup.rotation.x = -Math.PI / 2.5;
              if (this.rightLegGroup) this.rightLegGroup.rotation.x = -Math.PI / 2.5;
              return;
            } else {
              this.mesh.rotation.x = 0;
            }
            break;
          }
          case 'CHAI_SIP': {
            if (this.rightArmGroup) {
              this.rightArmGroup.rotation.x = -Math.PI / 2.2;
              this.rightArmGroup.rotation.z = -0.3;
            }
            if (this.headGroup) {
              this.headGroup.rotation.x = Math.sin(t) * 0.15;
            }
            return;
          }
          case 'MEGAPHONE_SOLO': {
            if (this.rightArmGroup) {
              this.rightArmGroup.rotation.x = -Math.PI / 2.0;
              this.rightArmGroup.rotation.z = -0.2;
            }
            if (this.leftArmGroup) {
              this.leftArmGroup.rotation.z = -0.5;
            }
            return;
          }
        }
      }
    }

    if (this.state.isSliding) {
      this.mesh.rotation.x = -Math.PI / 4;
      if (this.leftLegGroup) this.leftLegGroup.rotation.x = -Math.PI / 3;
      if (this.rightLegGroup) this.rightLegGroup.rotation.x = -Math.PI / 3;
      return;
    }

    this.mesh.rotation.x = 0;

    if (!this.isGrounded) {
      // In air jump pose
      if (this.leftLegGroup) this.leftLegGroup.rotation.x = -Math.PI / 5;
      if (this.rightLegGroup) this.rightLegGroup.rotation.x = Math.PI / 5;
      if (this.leftArmGroup) this.leftArmGroup.rotation.x = Math.PI / 3;
      if (this.rightArmGroup) this.rightArmGroup.rotation.x = -Math.PI / 4;
      return;
    }

    if (isMoving) {
      const prevTimer = this.animTimer;
      const animRate = currentSpeed * 0.85;
      this.animTimer += delta * animRate;

      // Tactile footstep sound & puddle splash when foot touches down
      if (this.isGrounded && Math.sin(prevTimer) * Math.sin(this.animTimer) < 0) {
        if (this.state.isLocal) {
          audioManager.playFootstep(this.state.isSprinting);
          if (this.isInPuddle) {
            audioManager.playPuddleSplash();
            this.particleSystem?.spawnPuddleSplash(this.mesh.position);
          }
        } else if (this.isInPuddle && this.particleSystem) {
          // AI running through wet pavement or rain creates water ripple splashes
          this.particleSystem.spawnPuddleSplash(this.mesh.position);
        }
      }

      const swing = Math.sin(this.animTimer) * 0.72;
      if (this.leftLegGroup) this.leftLegGroup.rotation.x = swing;
      if (this.rightLegGroup) this.rightLegGroup.rotation.x = -swing;
      if (this.leftArmGroup) this.leftArmGroup.rotation.x = -swing;
      if (this.rightArmGroup) this.rightArmGroup.rotation.x = swing * 0.55;

      // Subtle hip & spine bounce while running
      if (this.torsoGroup) {
        this.torsoGroup.position.y = 1.05 + Math.abs(Math.sin(this.animTimer * 2)) * 0.05;
      }
    } else {
      this.animTimer += delta * 2;
      const breathe = Math.sin(this.animTimer) * 0.06;
      if (this.leftLegGroup) this.leftLegGroup.rotation.x = 0;
      if (this.rightLegGroup) this.rightLegGroup.rotation.x = 0;
      if (this.leftArmGroup) this.leftArmGroup.rotation.x = breathe;
      if (this.rightArmGroup) this.rightArmGroup.rotation.x = -breathe;

      if (this.torsoGroup) {
        this.torsoGroup.position.y = 1.05 + breathe * 0.3;
      }
    }
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.mesh);
  }
}
