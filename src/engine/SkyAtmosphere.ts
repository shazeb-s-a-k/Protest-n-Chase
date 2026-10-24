import * as THREE from 'three';
import { TimeOfDay } from '../types/game';

/**
 * SkyAtmosphere: GTA Vice City & Modern Remake Style Atmospheric Environment
 * Provides dynamic gradient sky dome, sun glare, moving 3D volumetric clouds,
 * and distant city skyline silhouettes.
 */
export class SkyAtmosphere {
  private scene: THREE.Scene;
  private skyDome: THREE.Mesh;
  private sunMesh: THREE.Mesh;
  private sunGlow: THREE.Sprite;
  private cloudGroup: THREE.Group;
  private skylineGroup: THREE.Group;
  private starsMesh: THREE.Points;
  private animTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Procedural Gradient Sky Dome
    const skyGeo = new THREE.SphereGeometry(240, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);

    // 2. High-Altitude Sun Disc & Flare
    const sunGeo = new THREE.SphereGeometry(7, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.95,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(70, 95, 60);
    this.scene.add(this.sunMesh);

    // Sun corona lens flare
    const coronaCanvas = document.createElement('canvas');
    coronaCanvas.width = 128;
    coronaCanvas.height = 128;
    const cctx = coronaCanvas.getContext('2d')!;
    const grad = cctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 240, 200, 1.0)');
    grad.addColorStop(0.35, 'rgba(255, 180, 80, 0.5)');
    grad.addColorStop(1, 'rgba(255, 140, 40, 0.0)');
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, 128, 128);
    const coronaTex = new THREE.CanvasTexture(coronaCanvas);

    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    });
    this.sunGlow = new THREE.Sprite(coronaMat);
    this.sunGlow.scale.set(38, 38, 1);
    this.sunGlow.position.copy(this.sunMesh.position);
    this.scene.add(this.sunGlow);

    // 3. Twinkling Night Stars
    const starCount = 380;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 230;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.max(25, r * Math.cos(phi));
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.0, // hidden in daytime
    });
    this.starsMesh = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsMesh);

    // 4. Moving 3D Volumetric Styled Clouds
    this.cloudGroup = new THREE.Group();
    this.spawnVolumetricClouds();
    this.scene.add(this.cloudGroup);

    // 5. Distant City Skyline Silhouettes (Vice City High-Rises)
    this.skylineGroup = new THREE.Group();
    this.spawnCitySkyline();
    this.scene.add(this.skylineGroup);

    // Default to Golden Hour for initial Vice City glow
    this.setTimeOfDay('GOLDEN_HOUR');
  }

  /**
   * Spawns stylized multi-puff 3D clouds that drift at altitude
   */
  private spawnVolumetricClouds() {
    const cloudCount = 14;
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.72,
    });

    for (let i = 0; i < cloudCount; i++) {
      const cluster = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 4);

      for (let j = 0; j < puffs; j++) {
        const radius = 6 + Math.random() * 8;
        const puffGeo = new THREE.SphereGeometry(radius, 8, 8);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (j - puffs / 2) * 8 + (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 8
        );
        puff.scale.set(1.4, 0.65, 1.0);
        cluster.add(puff);
      }

      cluster.position.set(
        (Math.random() - 0.5) * 220,
        95 + Math.random() * 25,
        (Math.random() - 0.5) * 220
      );
      this.cloudGroup.add(cluster);
    }
  }

  /**
   * Spawns perimeter city skyscraper silhouettes with blinking aviation beacons
   */
  private spawnCitySkyline() {
    const radius = 135;
    const towerCount = 36;
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Dark silhouette
      roughness: 0.8,
      metalness: 0.2,
    });

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    for (let i = 0; i < towerCount; i++) {
      const angle = (i / towerCount) * Math.PI * 2;
      const dist = radius + (Math.random() - 0.5) * 18;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const height = 30 + Math.random() * 55;
      const width = 12 + Math.random() * 14;
      const depth = 12 + Math.random() * 14;

      const tower = new THREE.Group();
      tower.position.set(x, height / 2, z);
      tower.rotation.y = angle + Math.PI / 2;

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), buildingMat);
      tower.add(bMesh);

      // Random window grid strip
      if (Math.random() > 0.35) {
        const winGeo = new THREE.BoxGeometry(width * 0.8, height * 0.7, depth + 0.1);
        const winMesh = new THREE.Mesh(winGeo, windowMat);
        tower.add(winMesh);
      }

      // Rooftop radio antenna with blinking red beacon
      if (height > 50) {
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.3, 10, 6),
          new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.9 })
        );
        mast.position.set(0, height / 2 + 5, 0);
        tower.add(mast);

        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        beacon.position.set(0, height / 2 + 10, 0);
        tower.add(beacon);
      }

      this.skylineGroup.add(tower);
    }
  }

  /**
   * Updates sky colors, sun position, and atmospheric haze based on TimeOfDay
   */
  public setTimeOfDay(time: TimeOfDay) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 256);

    if (time === 'GOLDEN_HOUR') {
      // Iconic Vice City Sunset: Zenith royal purple -> hot coral pink -> sunset gold -> warm amber horizon
      grad.addColorStop(0.0, '#3b0764'); // Deep dusk violet at zenith
      grad.addColorStop(0.3, '#701a75'); // Magenta glow
      grad.addColorStop(0.65, '#c026d3'); // Hot synthwave pink
      grad.addColorStop(0.85, '#f97316'); // Vibrant orange
      grad.addColorStop(1.0, '#fef08a'); // Warm golden horizon

      this.sunMesh.visible = true;
      this.sunGlow.visible = true;
      this.sunMesh.position.set(65, 38, 80); // Low sunset angle
      this.sunGlow.position.copy(this.sunMesh.position);
      (this.sunGlow.material as THREE.SpriteMaterial).color.setHex(0xf97316);

      this.starsMesh.visible = true;
      (this.starsMesh.material as THREE.PointsMaterial).opacity = 0.3;

      this.cloudGroup.children.forEach((c) => {
        c.children.forEach((p) => {
          const m = (p as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m) m.color.setHex(0xfda4af); // sunset rose-tinted clouds
        });
      });
    } else if (time === 'NIGHT_RALLY') {
      // Midnight Vice City: Deep indigo zenith -> neon dark violet -> horizon synthwave cyan glow
      grad.addColorStop(0.0, '#030712'); // Pitch space black
      grad.addColorStop(0.4, '#0f172a'); // Deep navy
      grad.addColorStop(0.8, '#1e1b4b'); // Indigo
      grad.addColorStop(1.0, '#0284c7'); // Electric neon cyan horizon

      this.sunMesh.visible = false;
      this.sunGlow.visible = false;

      this.starsMesh.visible = true;
      (this.starsMesh.material as THREE.PointsMaterial).opacity = 0.95;

      this.cloudGroup.children.forEach((c) => {
        c.children.forEach((p) => {
          const m = (p as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m) m.color.setHex(0x1e293b); // Dark moonlit clouds
        });
      });
    } else {
      // MIDDAY: Vibrant tropical turquoise blue -> pale cerulean -> bright horizon haze
      grad.addColorStop(0.0, '#0284c7'); // Ocean blue
      grad.addColorStop(0.5, '#38bdf8'); // Sky cyan
      grad.addColorStop(0.85, '#bae6fd'); // Atmospheric haze
      grad.addColorStop(1.0, '#ffffff'); // Horizon solar glare

      this.sunMesh.visible = true;
      this.sunGlow.visible = true;
      this.sunMesh.position.set(70, 110, 50); // High overhead
      this.sunGlow.position.copy(this.sunMesh.position);
      (this.sunGlow.material as THREE.SpriteMaterial).color.setHex(0xffffff);

      this.starsMesh.visible = false;

      this.cloudGroup.children.forEach((c) => {
        c.children.forEach((p) => {
          const m = (p as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m) m.color.setHex(0xffffff); // Pure white fluffy clouds
        });
      });
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 256);

    const skyTex = new THREE.CanvasTexture(canvas);
    (this.skyDome.material as THREE.MeshBasicMaterial).map = skyTex;
    (this.skyDome.material as THREE.MeshBasicMaterial).needsUpdate = true;
  }

  /**
   * Animate clouds drifting and aviation red beacons blinking
   */
  public update(delta: number) {
    this.animTimer += delta;

    // Drifting clouds across the city sky
    this.cloudGroup.children.forEach((c) => {
      c.position.x += delta * 1.8;
      if (c.position.x > 140) {
        c.position.x = -140;
      }
    });

    // Gentle sun pulse
    if (this.sunGlow.visible) {
      const pulse = 1.0 + Math.sin(this.animTimer * 2.0) * 0.05;
      this.sunGlow.scale.set(38 * pulse, 38 * pulse, 1);
    }
  }

  public destroy() {
    this.scene.remove(this.skyDome);
    this.scene.remove(this.sunMesh);
    this.scene.remove(this.sunGlow);
    this.scene.remove(this.starsMesh);
    this.scene.remove(this.cloudGroup);
    this.scene.remove(this.skylineGroup);
  }
}
