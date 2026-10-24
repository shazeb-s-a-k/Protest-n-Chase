import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleGrowth: number;
  initialScale: number;
}

interface SoundwaveRing {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  radiusGrowth: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private soundwaves: SoundwaveRing[] = [];

  private smokeMaterial: THREE.MeshStandardMaterial;
  private waterMaterial: THREE.MeshStandardMaterial;
  private waveMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Materials
    this.smokeMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.7,
      roughness: 0.9,
    });

    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.3,
    });

    this.waveMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Spawns an expanding soundwave ring from the Megaphone blast
   */
  public spawnMegaphoneSoundwave(origin: THREE.Vector3) {
    const geo = new THREE.RingGeometry(0.3, 0.7, 32);
    const mat = this.waveMaterial.clone();
    mat.color.setHex(0x00f0ff);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.position.y += 1.2;
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);

    this.soundwaves.push({
      mesh,
      life: 0,
      maxLife: 0.8,
      radiusGrowth: 18,
    });
  }

  /**
   * Spawns a dense smoke grenade plume
   */
  public spawnSmokePlume(origin: THREE.Vector3) {
    const count = 28;
    for (let i = 0; i < count; i++) {
      const size = 0.5 + Math.random() * 0.8;
      const geo = new THREE.DodecahedronGeometry(size, 1);
      const mat = this.smokeMaterial.clone();
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.copy(origin);
      mesh.position.x += (Math.random() - 0.5) * 1.5;
      mesh.position.z += (Math.random() - 0.5) * 1.5;
      mesh.position.y = 0.5 + Math.random() * 0.5;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        1.2 + Math.random() * 2.5,
        (Math.random() - 0.5) * 3
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 3.5 + Math.random() * 2,
        scaleGrowth: 2.5,
        initialScale: 1,
      });
    }
  }

  /**
   * Spawns a surge of water cannon droplet particles
   */
  public spawnWaterSurge(origin: THREE.Vector3, direction: THREE.Vector3) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.25, 8, 8);
      const mat = this.waterMaterial.clone();
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.copy(origin);
      mesh.position.y += 1.5;

      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.2
      );

      const velocity = direction.clone().add(spread).multiplyScalar(22 + Math.random() * 8);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.9,
        scaleGrowth: 0.5,
        initialScale: 1,
      });
    }
  }

  /**
   * Spawns floating Gen-Z live-stream emoji sprites (hearts, megaphones, lightning)
   */
  public spawnLiveStreamEmoji(origin: THREE.Vector3, emojiText: string = '🔥') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojiText, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 1.2, 1);

    sprite.position.copy(origin);
    sprite.position.y += 2.2;
    sprite.position.x += (Math.random() - 0.5) * 0.8;
    sprite.position.z += (Math.random() - 0.5) * 0.8;

    this.scene.add(sprite as any);

    // Treat sprite as particle
    this.particles.push({
      mesh: sprite as any,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        2.2 + Math.random() * 1.5,
        (Math.random() - 0.5) * 0.8
      ),
      life: 0,
      maxLife: 1.4,
      scaleGrowth: 0.6,
      initialScale: 1.2,
    });
  }

  public update(delta: number) {
    // 1. Update Standard Particles (Smoke, Water, Emojis)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry?.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material?.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Move
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Dampen velocity / gravity
      p.velocity.x *= 0.96;
      p.velocity.z *= 0.96;
      if (p.velocity.y < 0) {
        p.velocity.y -= 9.8 * delta; // Gravity on water
      }

      // Fade & Scale
      const progress = p.life / p.maxLife;
      const currentScale = p.initialScale + progress * p.scaleGrowth;
      p.mesh.scale.set(currentScale, currentScale, currentScale);

      const mat = p.mesh.material as THREE.Material & { opacity?: number };
      if (mat && 'opacity' in mat) {
        mat.opacity = Math.max(0, 1 - progress);
      }
    }

    // 2. Update Megaphone Soundwaves
    for (let i = this.soundwaves.length - 1; i >= 0; i--) {
      const wave = this.soundwaves[i];
      wave.life += delta;

      if (wave.life >= wave.maxLife) {
        this.scene.remove(wave.mesh);
        wave.mesh.geometry.dispose();
        (wave.mesh.material as THREE.Material).dispose();
        this.soundwaves.splice(i, 1);
        continue;
      }

      const progress = wave.life / wave.maxLife;
      const currentScale = 1 + progress * wave.radiusGrowth;
      wave.mesh.scale.set(currentScale, currentScale, 1);

      const mat = wave.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - progress) * 0.9;
    }
  }

  public clear() {
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.soundwaves.forEach((w) => this.scene.remove(w.mesh));
    this.particles = [];
    this.soundwaves = [];
  }
}
