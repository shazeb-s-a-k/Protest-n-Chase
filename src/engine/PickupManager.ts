import * as THREE from 'three';
import { PickupItem, MapId } from '../types/game';
import { ParticleSystem } from './ParticleSystem';

export class PickupManager {
  private scene: THREE.Scene;
  private particleSystem?: ParticleSystem;
  public pickups: {
    item: PickupItem;
    mesh: THREE.Group;
    baseY: number;
    rotationSpeed: number;
    bobFreq: number;
    bobOffset: number;
  }[] = [];

  public totalSpawned: number = 0;
  public totalCollected: number = 0;

  // Shared static geometries & materials to avoid GC churn
  private static _coinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 16);
  private static _starGeo = new THREE.OctahedronGeometry(0.35, 0);
  private static _magnetGeo = new THREE.TorusGeometry(0.28, 0.09, 8, 16, Math.PI);

  private static _goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    metalness: 0.9,
    roughness: 0.2,
  });

  private static _cyanStarMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.15,
  });

  private static _magnetMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.5,
    metalness: 0.7,
    roughness: 0.3,
  });

  private static _scratchDiff = new THREE.Vector3();

  constructor(scene: THREE.Scene, mapId: MapId = 'DELHI', particleSystem?: ParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.spawnMapPickups(mapId);
  }

  public spawnMapPickups(mapId: MapId) {
    this.clear();

    const spawnPoints: { x: number; y: number; z: number; type: PickupItem['type'] }[] = [];

    if (mapId === 'DELHI') {
      // 1. Sansad Marg Avenue run line
      for (let z = -60; z <= 60; z += 6) {
        spawnPoints.push({ x: -14, y: 0.6, z, type: 'COIN' });
        spawnPoints.push({ x: 14, y: 0.6, z, type: 'COIN' });
      }

      // 2. Central Jantar Mantar Plaza perimeter
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const rad = 26;
        spawnPoints.push({
          x: Math.cos(angle) * rad,
          y: 0.65,
          z: Math.sin(angle) * rad,
          type: 'COIN',
        });
      }

      // 3. High Parkour Gnomon Steps (Samrat Yantra)
      for (let i = 1; i <= 6; i++) {
        spawnPoints.push({ x: 0, y: 1.0 + i * 1.5, z: -18 - i * 2.2, type: 'ENERGY_STAR' });
      }

      // 4. Special Powerups on rooftops / stages
      spawnPoints.push({ x: 0, y: 2.2, z: 15, type: 'MAGNET' }); // Central stage
      spawnPoints.push({ x: -46, y: 1.2, z: -14, type: 'CHAI_CUP' }); // Chai Tapri
      spawnPoints.push({ x: 22, y: 0.4, z: -26, type: 'ENERGY_STAR' }); // Jai Prakash
      spawnPoints.push({ x: -28, y: 0.6, z: 20, type: 'COIN' }); // Ram Yantra
      spawnPoints.push({ x: 28, y: 0.6, z: 20, type: 'COIN' });
    } else {
      // PARIS: Place de la Bastille Boulevard & Metro
      for (let z = -55; z <= 55; z += 6) {
        spawnPoints.push({ x: -22, y: 0.6, z, type: 'COIN' });
        spawnPoints.push({ x: 22, y: 0.6, z, type: 'COIN' });
      }

      // Circular Bastille Column roundabout
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const rad = 22;
        spawnPoints.push({
          x: Math.cos(angle) * rad,
          y: 0.65,
          z: Math.sin(angle) * rad,
          type: 'COIN',
        });
      }

      // Opéra Bastille Forecourt Steps
      for (let i = 1; i <= 5; i++) {
        spawnPoints.push({ x: 48 + i * 2, y: 0.6 + i * 0.8, z: 0, type: 'ENERGY_STAR' });
      }

      spawnPoints.push({ x: 0, y: 1.5, z: 0, type: 'MAGNET' }); // Base of Column
      spawnPoints.push({ x: -26, y: 0.8, z: 30, type: 'COIN' }); // Fontaine Wallace
      spawnPoints.push({ x: 26, y: 0.8, z: -30, type: 'COIN' });
      spawnPoints.push({ x: 0, y: 2.0, z: -35, type: 'MAGNET' });
    }

    spawnPoints.forEach((sp, idx) => {
      this.createPickupMesh(sp.x, sp.y, sp.z, sp.type, `token_${idx}`);
    });

    this.totalSpawned = this.pickups.length;
  }

  private createPickupMesh(
    x: number,
    y: number,
    z: number,
    type: PickupItem['type'],
    id: string
  ) {
    const group = new THREE.Group();

    if (type === 'COIN') {
      const mesh = new THREE.Mesh(PickupManager._coinGeo, PickupManager._goldMat);
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    } else if (type === 'ENERGY_STAR') {
      const mesh = new THREE.Mesh(PickupManager._starGeo, PickupManager._cyanStarMat);
      group.add(mesh);
    } else if (type === 'MAGNET') {
      const mesh = new THREE.Mesh(PickupManager._magnetGeo, PickupManager._magnetMat);
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    } else {
      // Chai Cup / Food token
      const mesh = new THREE.Mesh(PickupManager._coinGeo, PickupManager._goldMat);
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    }

    group.position.set(x, y, z);
    this.scene.add(group);

    const item: PickupItem = {
      id,
      type,
      position: { x, y, z },
      value: type === 'ENERGY_STAR' ? 50 : 10,
      collected: false,
    };

    this.pickups.push({
      item,
      mesh: group,
      baseY: y,
      rotationSpeed: 2.5 + Math.random() * 1.5,
      bobFreq: 3.2 + Math.random() * 1.0,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }

  private timer = 0;

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    isMagnetActive: boolean = false,
    onCollect?: (item: PickupItem) => void
  ) {
    this.timer += delta;

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (p.item.collected || !p.mesh.visible) continue;

      // 1. Idle Rotation & Floating Bob
      p.mesh.rotation.y += delta * p.rotationSpeed;
      p.mesh.position.y = p.baseY + Math.sin(this.timer * p.bobFreq + p.bobOffset) * 0.12;

      // 2. Broadphase 2D distance test
      const dx = playerPos.x - p.mesh.position.x;
      const dz = playerPos.z - p.mesh.position.z;
      const distSq = dx * dx + dz * dz;

      // Magnet Pull (pull within 12m toward player)
      if (isMagnetActive && distSq < 144) {
        const pullSpeed = delta * 18;
        p.mesh.position.x += dx * pullSpeed;
        p.mesh.position.z += dz * pullSpeed;
        p.mesh.position.y += (playerPos.y + 0.8 - p.mesh.position.y) * pullSpeed;
      }

      // Collection Check (within 1.25m horizontal, 2.0m vertical)
      if (distSq < 1.6 && Math.abs(playerPos.y + 0.8 - p.mesh.position.y) < 2.0) {
        p.item.collected = true;
        p.mesh.visible = false;
        this.totalCollected++;

        if (this.particleSystem) {
          this.particleSystem.spawnSpeedLines(p.mesh.position, new THREE.Vector3(0, 1, 0));
        }

        onCollect?.(p.item);
      }
    }
  }

  public spawnBonusCoinWave(
    centerX: number = 0,
    centerZ: number = 0,
    radius: number = 14,
    count: number = 10
  ) {
    const waveId = `bonus_wave_${Date.now()}`;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      const type = i % 4 === 0 ? 'ENERGY_STAR' : 'COIN';
      this.createPickupMesh(x, 0.75, z, type, `${waveId}_${i}`);
    }
    this.totalSpawned = this.pickups.length;
  }

  public clear() {
    this.pickups.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.pickups = [];
    this.totalSpawned = 0;
    this.totalCollected = 0;
  }

  public destroy() {
    this.clear();
  }
}
