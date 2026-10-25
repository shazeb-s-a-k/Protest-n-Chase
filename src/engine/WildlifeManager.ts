import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Pigeon {
  mesh: THREE.Group;
  wings: THREE.Mesh[];
  state: 'PECKING' | 'FLYING';
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  timer: number;
}

interface SoaringBird {
  mesh: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  angle: number;
  radius: number;
  speed: number;
  altitude: number;
  waveFreq: number;
}

export class WildlifeManager {
  private static _scratchFleeDir = new THREE.Vector3();
  private static _scratchToTarget = new THREE.Vector3();

  private scene: THREE.Scene;
  private pigeons: Pigeon[] = [];
  private soaringBirds: SoaringBird[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnPigeonFlock();
    this.spawnSoaringBirds();
  }

  private spawnSoaringBirds() {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/Flamingo.glb',
      (gltf) => {
        const specs = [
          { radius: 36, altitude: 28, speed: 0.24, waveFreq: 2.2, startAngle: 0.0 },
          { radius: 48, altitude: 34, speed: 0.19, waveFreq: 1.8, startAngle: 2.1 },
          { radius: 60, altitude: 31, speed: 0.22, waveFreq: 2.5, startAngle: 4.2 },
        ];

        specs.forEach((s) => {
          // Clone hierarchy
          const bird = gltf.scene.clone(true);
          bird.scale.set(0.038, 0.038, 0.038);
          bird.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
            }
          });

          let mixer: THREE.AnimationMixer | undefined;
          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(bird);
            const action = mixer.clipAction(gltf.animations[0]);
            action.setDuration(1.2 + Math.random() * 0.4);
            action.play();
          }

          const initX = Math.cos(s.startAngle) * s.radius;
          const initZ = Math.sin(s.startAngle) * s.radius;
          bird.position.set(initX, s.altitude, initZ);
          bird.rotation.y = -s.startAngle + Math.PI / 2;

          this.scene.add(bird);

          this.soaringBirds.push({
            mesh: bird,
            mixer,
            angle: s.startAngle,
            radius: s.radius,
            speed: s.speed,
            altitude: s.altitude,
            waveFreq: s.waveFreq,
          });
        });
      },
      undefined,
      (err) => console.warn('Flamingo.glb load skipped:', err)
    );
  }

  private spawnPigeonFlock() {
    const pigeonCount = 18;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 }); // Slate grey
    const neckMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.5 }); // Iridescent green neck
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });

    for (let i = 0; i < pigeonCount; i++) {
      const group = new THREE.Group();

      // Torso
      const bodyGeo = new THREE.ConeGeometry(0.12, 0.35, 6);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2.3;
      group.add(body);

      // Neck & Head
      const headGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const head = new THREE.Mesh(headGeo, neckMat);
      head.position.set(0, 0.14, 0.18);
      group.add(head);

      // Beak
      const beakGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
      const beakMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const beak = new THREE.Mesh(beakGeo, beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.14, 0.26);
      group.add(beak);

      // Wings
      const wings: THREE.Mesh[] = [];
      [-1, 1].forEach((side) => {
        const wingGeo = new THREE.BoxGeometry(0.25, 0.02, 0.18);
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(side * 0.14, 0.08, 0);
        group.add(wing);
        wings.push(wing);
      });

      // Position in lawn zones
      const startX = -40 + Math.random() * 20;
      const startZ = 15 + Math.random() * 15;
      group.position.set(startX, 0.15, startZ);

      this.scene.add(group);

      this.pigeons.push({
        mesh: group,
        wings,
        state: 'PECKING',
        targetPos: new THREE.Vector3(startX, 0.15, startZ),
        velocity: new THREE.Vector3(),
        timer: Math.random() * 5,
      });
    }
  }

  public scareNearbyPigeons(origin: THREE.Vector3, radius = 6) {
    for (const p of this.pigeons) {
      if (p.mesh.position.distanceTo(origin) < radius && p.state === 'PECKING') {
        p.state = 'FLYING';
        p.timer = 0;
        // Launch upwards and away
        const fleeDir = WildlifeManager._scratchFleeDir.subVectors(p.mesh.position, origin).normalize();
        p.velocity.set(fleeDir.x * 12, 14, fleeDir.z * 12);

        // Pick new landing spot
        p.targetPos.set(
          (Math.random() - 0.5) * 70,
          0.15,
          (Math.random() - 0.5) * 70
        );
      }
    }
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    // 1. Check if player runs close to pigeons
    this.scareNearbyPigeons(playerPos, 4.5);

    for (const p of this.pigeons) {
      p.timer += delta;

      if (p.state === 'PECKING') {
        // Pecking head bob animation
        p.mesh.rotation.x = Math.sin(p.timer * 6) * 0.15;
        p.wings[0].rotation.z = 0;
        p.wings[1].rotation.z = 0;
      } else {
        // FLYING
        p.mesh.position.addScaledVector(p.velocity, delta);

        // Rapid wing flap
        const flap = Math.sin(p.timer * 35) * 0.7;
        p.wings[0].rotation.z = -flap;
        p.wings[1].rotation.z = flap;

        // Fly towards target landing spot
        const toTarget = WildlifeManager._scratchToTarget.subVectors(p.targetPos, p.mesh.position);
        toTarget.y = 0;

        if (toTarget.length() > 2) {
          toTarget.normalize();
          p.velocity.x = toTarget.x * 10;
          p.velocity.z = toTarget.z * 10;
          p.velocity.y = Math.sin(p.timer * 2) * 2; // Glide wave
          p.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        } else {
          // Land
          p.mesh.position.y -= delta * 8;
          if (p.mesh.position.y <= 0.15) {
            p.mesh.position.y = 0.15;
            p.state = 'PECKING';
            p.velocity.set(0, 0, 0);
          }
        }
      }
    }

    // 2. Animate 3D Soaring Birds across Sky Skyline
    for (const b of this.soaringBirds) {
      b.angle += delta * b.speed;
      b.mixer?.update(delta);

      const x = Math.cos(b.angle) * b.radius;
      const z = Math.sin(b.angle) * b.radius;
      const y = b.altitude + Math.sin(b.angle * b.waveFreq) * 2.2;

      b.mesh.position.set(x, y, z);
      b.mesh.rotation.y = -b.angle + Math.PI / 2;
      b.mesh.rotation.z = Math.sin(b.angle * 2) * 0.14; // Banking turn
    }
  }

  public destroy() {
    this.pigeons.forEach((p) => this.scene.remove(p.mesh));
    this.pigeons = [];
    this.soaringBirds.forEach((b) => this.scene.remove(b.mesh));
    this.soaringBirds = [];
  }
}

