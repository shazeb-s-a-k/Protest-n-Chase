import * as THREE from 'three';
import { WeatherCondition } from '../types/game';

export class WeatherManager {
  private scene: THREE.Scene;
  public currentWeather: WeatherCondition = 'CLEAR_GOLDEN';

  // Rain Particles
  private rainGeometry?: THREE.BufferGeometry;
  private rainMaterial?: THREE.PointsMaterial;
  private rainSystem?: THREE.Points;
  private rainPositions: Float32Array = new Float32Array();

  // Dust Motes
  private dustSystem?: THREE.Points;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupRainSystem();
    this.setupDustSystem();
  }

  private setupRainSystem() {
    const rainCount = 1400;
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 120;
      this.rainPositions[i * 3 + 1] = Math.random() * 45;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    this.rainMaterial = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
    });

    this.rainSystem = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.rainSystem.visible = false;
    this.scene.add(this.rainSystem);
  }

  private setupDustSystem() {
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = 0.5 + Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.25,
      transparent: true,
      opacity: 0.45,
    });

    this.dustSystem = new THREE.Points(geo, mat);
    this.dustSystem.visible = true;
    this.scene.add(this.dustSystem);
  }

  public setWeather(weather: WeatherCondition) {
    this.currentWeather = weather;

    if (weather === 'MONSOON_RAIN') {
      if (this.rainSystem) this.rainSystem.visible = true;
      if (this.dustSystem) this.dustSystem.visible = false;
      this.scene.background = new THREE.Color(0x334155); // Overcast grey-blue
      this.scene.fog = new THREE.FogExp2(0x475569, 0.014);
    } else if (weather === 'NIGHT_CYBERPUNK') {
      if (this.rainSystem) this.rainSystem.visible = false;
      if (this.dustSystem) this.dustSystem.visible = false;
      this.scene.background = new THREE.Color(0x050811);
      this.scene.fog = new THREE.FogExp2(0x090d16, 0.012);
    } else {
      // CLEAR_GOLDEN
      if (this.rainSystem) this.rainSystem.visible = false;
      if (this.dustSystem) this.dustSystem.visible = true;
      this.scene.background = new THREE.Color(0xdbeafe);
      this.scene.fog = new THREE.FogExp2(0xfef08a, 0.006);
    }
  }

  public update(delta: number) {
    // 1. Update Rain
    if (this.currentWeather === 'MONSOON_RAIN' && this.rainSystem) {
      const positions = this.rainGeometry?.attributes.position.array as Float32Array;
      if (positions) {
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= delta * 45; // Fast rainfall speed
          if (positions[i] < 0) {
            positions[i] = 45;
          }
        }
        this.rainGeometry!.attributes.position.needsUpdate = true;
      }
    }

    // 2. Update Dust Motes Drifting in Sunlight
    if (this.currentWeather === 'CLEAR_GOLDEN' && this.dustSystem) {
      this.dustSystem.rotation.y += delta * 0.04;
    }
  }

  public destroy() {
    if (this.rainSystem) this.scene.remove(this.rainSystem);
    if (this.dustSystem) this.scene.remove(this.dustSystem);
  }
}
