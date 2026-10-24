import * as THREE from 'three';
import { PowerUpType, PowerUpItem } from '../types/game';
import { audioManager } from './AudioManager';

interface PowerUpInstance {
  item: PowerUpItem;
  mesh: THREE.Group;
  initialY: number;
}

export class PowerUpManager {
  private scene: THREE.Scene;
  public powerUps: PowerUpInstance[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnDefaultPowerUps();
  }

  private spawnDefaultPowerUps() {
    const locations: { type: PowerUpType; x: number; z: number }[] = [
      { type: 'ENERGY_CHAI', x: -18, z: 22 }, // Near Samrat Yantra ramp
      { type: 'AMP_BOOST', x: 0, z: 31 },    // In front of Protest stage
      { type: 'WIFI_HOTSPOT', x: 22, z: 18 },  // East lawn
      { type: 'PEACE_AURA', x: -30, z: -8 },   // Near Ram Yantra
      { type: 'CONE_TRAP', x: 0, z: 46 },     // Near Police barricade line
      { type: 'ENERGY_CHAI', x: 30, z: -8 },   // Near Ram Yantra East
    ];

    locations.forEach((loc, idx) => {
      const item: PowerUpItem = {
        id: `powerup_${idx}`,
        type: loc.type,
        position: { x: loc.x, y: 1.1, z: loc.z },
        duration: loc.type === 'ENERGY_CHAI' ? 8 : loc.type === 'WIFI_HOTSPOT' ? 10 : 7,
      };
      this.createPowerUpMesh(item);
    });
  }

  private createPowerUpMesh(item: PowerUpItem) {
    const group = new THREE.Group();
    group.position.set(item.position.x, item.position.y, item.position.z);

    // Glowing base pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.15, 16);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.9;
    group.add(pedestal);

    // Aura Light Ring
    const ringGeo = new THREE.RingGeometry(0.65, 0.85, 24);
    let ringColor = 0xfacc15;
    if (item.type === 'ENERGY_CHAI') ringColor = 0xf97316; // Orange
    if (item.type === 'AMP_BOOST') ringColor = 0xff007a;   // Pink
    if (item.type === 'WIFI_HOTSPOT') ringColor = 0x00f0ff; // Cyan
    if (item.type === 'PEACE_AURA') ringColor = 0x10b981;   // Emerald
    if (item.type === 'CONE_TRAP') ringColor = 0xeab308;    // Yellow

    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.85;
    group.add(ring);

    // Core 3D Model depending on type
    if (item.type === 'ENERGY_CHAI') {
      // Traditional Cutting Chai Glass
      const glassGeo = new THREE.CylinderGeometry(0.28, 0.2, 0.55, 12);
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        roughness: 0.2,
        metalness: 0.1,
        emissive: 0xd97706,
        emissiveIntensity: 0.4,
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      group.add(glass);
    } else if (item.type === 'AMP_BOOST') {
      // Megaphone Symbol
      const coneGeo = new THREE.ConeGeometry(0.3, 0.6, 12);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0xff007a,
        emissive: 0xff007a,
        emissiveIntensity: 0.6,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.z = -Math.PI / 3;
      group.add(cone);
    } else if (item.type === 'WIFI_HOTSPOT') {
      // 5G Signal Antenna Tower
      const towerGeo = new THREE.OctahedronGeometry(0.35, 1);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.7,
        wireframe: true,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      group.add(tower);
    } else if (item.type === 'PEACE_AURA') {
      // Shield Orb
      const sphereGeo = new THREE.IcosahedronGeometry(0.35, 2);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      group.add(sphere);
    } else {
      // Traffic Cone
      const coneGeo = new THREE.ConeGeometry(0.3, 0.7, 8);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xeab308,
        emissiveIntensity: 0.5,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      group.add(cone);
    }

    this.scene.add(group);
    this.powerUps.push({
      item,
      mesh: group,
      initialY: item.position.y,
    });
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    onCollect: (type: PowerUpType, duration: number) => void
  ) {
    const time = Date.now() * 0.003;

    for (const p of this.powerUps) {
      if (p.item.respawnTimer && p.item.respawnTimer > 0) {
        p.item.respawnTimer -= delta;
        p.mesh.visible = false;
        if (p.item.respawnTimer <= 0) {
          p.mesh.visible = true;
          p.item.respawnTimer = 0;
        }
        continue;
      }

      // Continuous float and rotation
      p.mesh.rotation.y += delta * 2;
      p.mesh.position.y = p.initialY + Math.sin(time + p.mesh.position.x) * 0.15;

      // Check collection proximity
      const dist = p.mesh.position.distanceTo(playerPosition);
      if (dist < 1.6) {
        // Collect PowerUp!
        p.item.respawnTimer = 18; // Respawns after 18 seconds
        p.mesh.visible = false;
        audioManager.playCanisterKick();
        onCollect(p.item.type, p.item.duration);
      }
    }
  }

  public destroy() {
    this.powerUps.forEach((p) => this.scene.remove(p.mesh));
    this.powerUps = [];
  }
}
