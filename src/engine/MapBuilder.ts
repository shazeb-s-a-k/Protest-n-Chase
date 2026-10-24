import * as THREE from 'three';
import { TimeOfDay } from '../types/game';

export interface Collider {
  box: THREE.Box3;
  type: 'WALL' | 'BARRICADE' | 'BUS' | 'RAMP';
  interactiveId?: string;
}

export class MapBuilder {
  public colliders: Collider[] = [];
  public busPositions: { x: number; y: number; z: number; id: string }[] = [];
  public busDoors: Map<string, THREE.Group> = new Map();
  public stagePosition: THREE.Vector3 = new THREE.Vector3(0, 0, 35);

  // Drone & Spotlight
  public droneGroup?: THREE.Group;
  public droneSpotlight?: THREE.SpotLight;
  public droneTargetMesh?: THREE.Mesh;
  public dronePropellers: THREE.Mesh[] = [];
  public droneAngle: number = 0;
  public droneSpotlightPos: { x: number; z: number } = { x: 0, z: 20 };

  // Environment Lights for Dynamic TimeOfDay
  private sunLight?: THREE.DirectionalLight;
  private ambientLight?: THREE.AmbientLight;
  private policeLights: THREE.PointLight[] = [];

  /**
   * Builds the entire 3D Jantar Mantar observatory and protest plaza
   */
  public buildJantarMantar(scene: THREE.Scene): { colliders: Collider[]; busPositions: any[] } {
    this.colliders = [];
    this.busPositions = [];
    this.busDoors.clear();
    this.policeLights = [];

    // Textures & Materials
    const pavementTex = this.generateFlagstoneTexture();
    const pavementMat = new THREE.MeshStandardMaterial({
      map: pavementTex,
      roughness: 0.85,
      metalness: 0.05,
    });

    const sandstoneRedMat = new THREE.MeshStandardMaterial({
      color: 0xba4336, // Authentic Jaipur/Delhi red sandstone
      roughness: 0.8,
      metalness: 0.1,
    });

    const marbleWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf3ece0, // White marble calibration lines
      roughness: 0.5,
      metalness: 0.05,
    });

    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x3d7032, // Lush garden lawn
      roughness: 0.95,
    });

    const borderWallMat = new THREE.MeshStandardMaterial({
      color: 0x8a2f24,
      roughness: 0.8,
    });

    // 1. Ground Plaza & Grass Lawns
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const ground = new THREE.Mesh(groundGeo, pavementMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Decorative Lawn Zones
    this.createLawnPatch(scene, lawnMat, -40, 20, 25, 30);
    this.createLawnPatch(scene, lawnMat, 40, 20, 25, 30);
    this.createLawnPatch(scene, lawnMat, -45, -35, 20, 25);
    this.createLawnPatch(scene, lawnMat, 45, -35, 20, 25);

    // 2. Perimeter Boundary Walls
    this.createPerimeterWalls(scene, borderWallMat);

    // 3. The Great Samrat Yantra (Giant Triangular Sundial)
    this.createSamratYantra(scene, sandstoneRedMat, marbleWhiteMat);

    // 4. Ram Yantra (Two Cylindrical Observatories)
    this.createRamYantra(scene, sandstoneRedMat, marbleWhiteMat, -35, -5, 9);
    this.createRamYantra(scene, sandstoneRedMat, marbleWhiteMat, 35, -5, 9);

    // 5. Jai Prakash Yantra (Sunken Bowls)
    this.createJaiPrakashYantra(scene, sandstoneRedMat, marbleWhiteMat, 0, -32);

    // 6. Gen-Z Protest Stage & Banners
    this.createProtestStage(scene);

    // 7. Police Camp: Barricades, Water Cannon Truck, Detainment Buses
    this.createPoliceCamp(scene);

    // 8. Overhead Media Drone with Dynamic Spotlight
    this.createMediaDrone(scene);

    // 9. Protest Placards in Ground
    this.createPlantedPlacards(scene);

    // 10. Plaza Streetlights and Atmospheric Spotlights
    this.createPlazaLighting(scene);

    return {
      colliders: this.colliders,
      busPositions: this.busPositions,
    };
  }

  /**
   * Generates a procedural high-res flagstone texture canvas
   */
  private generateFlagstoneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base sandstone warm beige
      ctx.fillStyle = '#d3c2a6';
      ctx.fillRect(0, 0, 512, 512);

      // Mortar lines
      ctx.strokeStyle = '#a89478';
      ctx.lineWidth = 4;

      const gridSize = 64;
      for (let y = 0; y < 512; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();

        const offset = (y / gridSize) % 2 === 0 ? 0 : gridSize / 2;
        for (let x = offset; x < 512; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + gridSize);
          ctx.stroke();

          // Subtle stone tone variation
          if (Math.random() < 0.3) {
            ctx.fillStyle = 'rgba(180, 150, 120, 0.15)';
            ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
          }
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    return tex;
  }

  private createLawnPatch(
    scene: THREE.Scene,
    mat: THREE.Material,
    x: number,
    z: number,
    w: number,
    d: number
  ) {
    const geo = new THREE.BoxGeometry(w, 0.15, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.08, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  private createPerimeterWalls(scene: THREE.Scene, mat: THREE.Material) {
    const wallH = 4.2;
    const wallThick = 2;
    const size = 150;

    const walls = [
      { x: 0, z: -size / 2, w: size, d: wallThick },
      { x: 0, z: size / 2, w: size, d: wallThick },
      { x: -size / 2, z: 0, w: wallThick, d: size },
      { x: size / 2, z: 0, w: wallThick, d: size },
    ];

    walls.forEach((w) => {
      const geo = new THREE.BoxGeometry(w.w, wallH, w.d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(w.x, wallH / 2, w.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push({ box, type: 'WALL' });
    });
  }

  /**
   * Iconic Samrat Yantra: Giant Triangular Gnomon with Quadrant Wings
   */
  private createSamratYantra(
    scene: THREE.Scene,
    sandstoneMat: THREE.Material,
    marbleMat: THREE.Material
  ) {
    const yantraGroup = new THREE.Group();
    yantraGroup.position.set(0, 0, 5);

    const shape = new THREE.Shape();
    const length = 28;
    const height = 14;
    shape.moveTo(-length / 2, 0);
    shape.lineTo(length / 2, 0);
    shape.lineTo(-length / 2, height);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 3.5,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
      bevelSegments: 2,
    };

    const gnomonGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    gnomonGeo.center();
    const gnomonMesh = new THREE.Mesh(gnomonGeo, sandstoneMat);
    gnomonMesh.position.set(0, height / 2, 0);
    gnomonMesh.rotation.y = Math.PI / 2; // North facing
    gnomonMesh.castShadow = true;
    gnomonMesh.receiveShadow = true;
    yantraGroup.add(gnomonMesh);

    // Marble central calibration strip with celestial tick lines
    const stripGeo = new THREE.BoxGeometry(0.85, height * 1.15, 0.12);
    const stripMesh = new THREE.Mesh(stripGeo, marbleMat);
    stripMesh.position.set(0, height / 2, 0);
    stripMesh.rotation.x = Math.atan2(height, length);
    yantraGroup.add(stripMesh);

    // Handrail along the top ramp
    const railGeo = new THREE.CylinderGeometry(0.06, 0.06, height * 1.15, 8);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 }); // Polished brass rail
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(0, height / 2 + 0.45, 0);
    rail.rotation.x = Math.atan2(height, length);
    yantraGroup.add(rail);

    // East and West Quadrant Arcs (Curved sandstone walls)
    [-1, 1].forEach((side) => {
      const quadrantGeo = new THREE.CylinderGeometry(14, 14, 2, 24, 1, true, 0, Math.PI / 2);
      const quadrantMesh = new THREE.Mesh(quadrantGeo, sandstoneMat);
      quadrantMesh.position.set(side * 12, 1, 0);
      quadrantMesh.rotation.z = Math.PI / 2;
      quadrantMesh.rotation.y = side === 1 ? 0 : Math.PI;
      quadrantMesh.castShadow = true;
      quadrantMesh.receiveShadow = true;
      yantraGroup.add(quadrantMesh);
    });

    scene.add(yantraGroup);

    const box = new THREE.Box3().setFromObject(gnomonMesh);
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Cylindrical Ram Yantra: Open-top circular structure with inner pillars
   */
  private createRamYantra(
    scene: THREE.Scene,
    sandstoneMat: THREE.Material,
    marbleMat: THREE.Material,
    x: number,
    z: number,
    radius: number
  ) {
    const ramGroup = new THREE.Group();
    ramGroup.position.set(x, 0, z);

    const wallHeight = 5.5;
    const numSections = 8;
    const angleStep = (Math.PI * 2) / numSections;

    for (let i = 0; i < numSections; i++) {
      if (i % 2 === 0) {
        const segmentGeo = new THREE.CylinderGeometry(
          radius,
          radius,
          wallHeight,
          6,
          1,
          true,
          i * angleStep,
          angleStep * 0.75
        );
        const segmentMesh = new THREE.Mesh(segmentGeo, sandstoneMat);
        segmentMesh.position.y = wallHeight / 2;
        segmentMesh.castShadow = true;
        segmentMesh.receiveShadow = true;
        ramGroup.add(segmentMesh);
      }
    }

    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, wallHeight, 16);
    const pillarMesh = new THREE.Mesh(pillarGeo, marbleMat);
    pillarMesh.position.y = wallHeight / 2;
    pillarMesh.castShadow = true;
    ramGroup.add(pillarMesh);

    scene.add(ramGroup);

    const ramBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, wallHeight / 2, z),
      new THREE.Vector3(radius * 1.8, wallHeight, radius * 1.8)
    );
    this.colliders.push({ box: ramBox, type: 'WALL' });
  }

  /**
   * Jai Prakash Yantra: Sunken Hemispherical Bowls
   */
  private createJaiPrakashYantra(
    scene: THREE.Scene,
    sandstoneMat: THREE.Material,
    marbleMat: THREE.Material,
    x: number,
    z: number
  ) {
    [-7, 7].forEach((offsetX) => {
      const bowlGeo = new THREE.SphereGeometry(5.5, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const bowlMesh = new THREE.Mesh(bowlGeo, sandstoneMat);
      bowlMesh.position.set(x + offsetX, 0.2, z);
      bowlMesh.rotation.x = Math.PI;
      bowlMesh.receiveShadow = true;
      scene.add(bowlMesh);

      const bridgeGeo = new THREE.BoxGeometry(11, 0.4, 1.2);
      const bridgeMesh = new THREE.Mesh(bridgeGeo, marbleMat);
      bridgeMesh.position.set(x + offsetX, 0.25, z);
      bridgeMesh.receiveShadow = true;
      scene.add(bridgeMesh);
    });
  }

  /**
   * Gen-Z Protest Stage with Vibrant Neon Banners, Lights & Speakers
   */
  private createProtestStage(scene: THREE.Scene) {
    const stageGroup = new THREE.Group();
    stageGroup.position.copy(this.stagePosition);

    const stageGeo = new THREE.BoxGeometry(18, 1.2, 10);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = 0.6;
    stageMesh.castShadow = true;
    stageMesh.receiveShadow = true;
    stageGroup.add(stageMesh);

    // Giant Backdrop Banner
    const bannerGeo = new THREE.PlaneGeometry(16, 5);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1024, 320);
      grad.addColorStop(0, '#ff007a');
      grad.addColorStop(0.5, '#7928ca');
      grad.addColorStop(1, '#00f0ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 320);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡️ PROTEST-N-CHASE: JANTAR MANTAR ⚡️', 512, 95);
      ctx.font = 'bold 34px Inter, sans-serif';
      ctx.fillText('TACTICAL ACTION • UNITED YOUTH • BY SHAZEB ANWAR KHAN', 512, 175);
      ctx.font = 'italic 28px Space Grotesk, monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('#ProtestNChase #GenZActivism #DelhiUnited', 512, 245);
    }
    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 4.2, -4.8);
    stageGroup.add(bannerMesh);

    // Side Sound System Speakers
    [-8.2, 8.2].forEach((sx) => {
      const speakerGeo = new THREE.BoxGeometry(1.4, 3.5, 1.4);
      const speakerMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 });
      const speaker = new THREE.Mesh(speakerGeo, speakerMat);
      speaker.position.set(sx, 2.3, -3);
      speaker.castShadow = true;
      stageGroup.add(speaker);
    });

    scene.add(stageGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.stagePosition.x, 0.6, this.stagePosition.z),
      new THREE.Vector3(18, 1.2, 10)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Overhead Media Drone with Dynamic Spotlight
   */
  private createMediaDrone(scene: THREE.Scene) {
    this.droneGroup = new THREE.Group();
    this.droneGroup.position.set(0, 22, 20);

    // Drone Body
    const bodyGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.droneGroup.add(body);

    // 4 Propeller arms
    const armOffsets = [
      { x: -1.2, z: -1.2 },
      { x: 1.2, z: -1.2 },
      { x: -1.2, z: 1.2 },
      { x: 1.2, z: 1.2 },
    ];

    armOffsets.forEach((ao) => {
      const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
      const arm = new THREE.Mesh(armGeo, bodyMat);
      arm.rotation.z = Math.PI / 4;
      arm.position.set(ao.x * 0.5, 0, ao.z * 0.5);
      this.droneGroup!.add(arm);

      // Spinning Propeller
      const propGeo = new THREE.BoxGeometry(1.2, 0.02, 0.12);
      const propMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(ao.x, 0.2, ao.z);
      this.droneGroup!.add(prop);
      this.dronePropellers.push(prop);
    });

    // Camera Gimbal & Downward Spotlight
    this.droneSpotlight = new THREE.SpotLight(0xffffff, 4.5, 45, Math.PI / 6, 0.35, 1);
    this.droneSpotlight.position.set(0, 0, 0);
    this.droneSpotlight.castShadow = true;
    this.droneGroup.add(this.droneSpotlight);

    // Spotlight Ground Target Ring
    const ringGeo = new THREE.RingGeometry(3.5, 4.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    this.droneTargetMesh = new THREE.Mesh(ringGeo, ringMat);
    this.droneTargetMesh.rotation.x = -Math.PI / 2;
    this.droneTargetMesh.position.set(0, 0.1, 20);
    scene.add(this.droneTargetMesh);

    this.droneSpotlight.target = this.droneTargetMesh;

    scene.add(this.droneGroup);
  }

  /**
   * Updates drone movement, propeller spin, and spotlight position
   */
  public updateDrone(delta: number): { x: number; z: number } {
    if (!this.droneGroup || !this.droneTargetMesh) return { x: 0, z: 20 };

    // Spin Propellers
    this.dronePropellers.forEach((p) => {
      p.rotation.y += delta * 25;
    });

    // Orbit slowly around plaza
    this.droneAngle += delta * 0.25;
    const radius = 24;
    const droneX = Math.sin(this.droneAngle) * radius;
    const droneZ = 18 + Math.cos(this.droneAngle) * (radius * 0.7);

    this.droneGroup.position.x = droneX;
    this.droneGroup.position.z = droneZ;
    this.droneGroup.position.y = 22 + Math.sin(this.droneAngle * 2) * 1.5;

    // Ground spotlight tracks slightly offset
    const targetX = Math.sin(this.droneAngle + 0.2) * (radius * 0.85);
    const targetZ = 18 + Math.cos(this.droneAngle + 0.2) * (radius * 0.6);

    this.droneTargetMesh.position.x = targetX;
    this.droneTargetMesh.position.z = targetZ;
    this.droneSpotlightPos = { x: targetX, z: targetZ };

    // Pulse target ring opacity
    const mat = this.droneTargetMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.4 + Math.sin(Date.now() * 0.005) * 0.3;

    return this.droneSpotlightPos;
  }

  /**
   * Planted Protest Placards in Lawns
   */
  private createPlantedPlacards(scene: THREE.Scene) {
    const slogans = [
      'CLIMATE ACTION NOW!',
      'VOICES OF THE YOUTH',
      'CLEAN AIR DELHI',
      'EQUALITY & PEACE',
      'SAVE ARAVALLI FORESTS',
      'INTERNET FREEDOM',
    ];

    const placardPositions = [
      { x: -35, z: 12 },
      { x: -28, z: 28 },
      { x: 32, z: 15 },
      { x: 42, z: 26 },
      { x: -10, z: 24 },
      { x: 10, z: 24 },
    ];

    placardPositions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = (Math.random() - 0.5) * 0.6;

      // Wooden stake
      const stakeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
      const stakeMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
      const stake = new THREE.Mesh(stakeGeo, stakeMat);
      stake.position.y = 0.9;
      group.add(stake);

      // Placard Board
      const boardGeo = new THREE.BoxGeometry(1.6, 1.1, 0.05);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = idx % 2 === 0 ? '#fef08a' : '#fed7aa';
        ctx.fillRect(0, 0, 256, 160);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slogans[idx % slogans.length], 128, 85);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const boardMat = new THREE.MeshStandardMaterial({ map: tex });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(0, 1.6, 0.03);
      group.add(board);

      scene.add(group);
    });
  }

  /**
   * Delhi Police Encampment: Yellow Barricades, Detainment Buses, Water Cannon Truck
   */
  private createPoliceCamp(scene: THREE.Scene) {
    this.createDetainmentBus(scene, -22, 55, Math.PI / 12, 'BUS_ALPHA');
    this.createDetainmentBus(scene, 22, 55, -Math.PI / 12, 'BUS_BRAVO');
    this.createWaterCannonTruck(scene, 0, 62);

    const barricadeSpecs = [
      { x: -14, z: 42, rot: 0.1 },
      { x: -6, z: 42, rot: -0.05 },
      { x: 6, z: 42, rot: 0.05 },
      { x: 14, z: 42, rot: -0.1 },
      { x: -28, z: 25, rot: Math.PI / 3 },
      { x: 28, z: 25, rot: -Math.PI / 3 },
      { x: -18, z: 8, rot: 0 },
      { x: 18, z: 8, rot: 0 },
    ];

    barricadeSpecs.forEach((b) => {
      this.createBarricadeMesh(scene, b.x, b.z, b.rot);
    });
  }

  /**
   * Detainment Prisoner Transport Bus (with openable rear door)
   */
  public createDetainmentBus(
    scene: THREE.Scene,
    x: number,
    z: number,
    rot: number,
    busId: string
  ) {
    const busGroup = new THREE.Group();
    busGroup.position.set(x, 0, z);
    busGroup.rotation.y = rot;

    const busLength = 11;
    const busWidth = 3.2;
    const busHeight = 3.6;

    // Bus Body (Deep Police Blue)
    const bodyGeo = new THREE.BoxGeometry(busWidth, busHeight, busLength);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.35,
      metalness: 0.3,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = busHeight / 2 + 0.6;
    bodyMesh.castShadow = true;
    busGroup.add(bodyMesh);

    // Yellow stripe
    const stripeGeo = new THREE.BoxGeometry(busWidth + 0.05, 0.45, busLength);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.y = 2.1;
    busGroup.add(stripeMesh);

    // Barred Windows
    const windowGeo = new THREE.BoxGeometry(busWidth + 0.1, 1.1, busLength * 0.7);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
    });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.position.y = 2.8;
    busGroup.add(windowMesh);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.6, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wheelOffsets = [
      { x: -busWidth / 2 - 0.1, z: 3.2 },
      { x: busWidth / 2 + 0.1, z: 3.2 },
      { x: -busWidth / 2 - 0.1, z: -3.2 },
      { x: busWidth / 2 + 0.1, z: -3.2 },
    ];
    wheelOffsets.forEach((w) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(w.x, 0.65, w.z);
      busGroup.add(wheel);
    });

    // Rear Emergency Door (Can swing open on Jailbreak)
    const doorHinge = new THREE.Group();
    doorHinge.position.set(busWidth / 2 - 0.1, 1.8, -busLength / 2 - 0.05);

    const doorGeo = new THREE.BoxGeometry(1.6, 2.4, 0.15);
    doorGeo.translate(-0.8, 0, 0); // pivot at hinge edge
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red emergency hatch
      roughness: 0.3,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorHinge.add(doorMesh);
    busGroup.add(doorHinge);
    this.busDoors.set(busId, doorHinge);

    // Flashing Dual Siren Lightbar (Red and Blue)
    const lightBarGeo = new THREE.BoxGeometry(1.4, 0.3, 0.4);
    const lightBarMat = new THREE.MeshStandardMaterial({ color: 0x27272a });
    const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
    lightBar.position.set(0, busHeight + 0.75, 3.5);
    busGroup.add(lightBar);

    const redLight = new THREE.PointLight(0xef4444, 2.5, 12);
    redLight.position.set(-0.5, busHeight + 0.85, 3.5);
    busGroup.add(redLight);
    this.policeLights.push(redLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 2.5, 12);
    blueLight.position.set(0.5, busHeight + 0.85, 3.5);
    busGroup.add(blueLight);
    this.policeLights.push(blueLight);

    scene.add(busGroup);

    this.busPositions.push({ x, y: 0, z, id: busId });

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, busHeight / 2, z),
      new THREE.Vector3(busWidth, busHeight, busLength)
    );
    this.colliders.push({ box, type: 'BUS', interactiveId: busId });
  }

  /**
   * Triggers the visual door swing animation on jailbreak
   */
  public openBusDoor(busId: string) {
    const door = this.busDoors.get(busId);
    if (door) {
      door.rotation.y = -Math.PI / 1.8; // Swing open
      setTimeout(() => {
        door.rotation.y = 0; // Close after 4s
      }, 4000);
    }
  }

  /**
   * Water Cannon Truck "Varun"
   */
  private createWaterCannonTruck(scene: THREE.Scene, x: number, z: number) {
    const truckGroup = new THREE.Group();
    truckGroup.position.set(x, 0, z);

    const truckGeo = new THREE.BoxGeometry(3.5, 3.2, 9);
    const truckMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5, roughness: 0.4 });
    const truckMesh = new THREE.Mesh(truckGeo, truckMat);
    truckMesh.position.y = 2.2;
    truckMesh.castShadow = true;
    truckGroup.add(truckMesh);

    // Roof-Mounted Water Cannon Turret
    const turretGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 12);
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.rotation.x = Math.PI / 4;
    turret.position.set(0, 4.3, 2);
    truckGroup.add(turret);

    scene.add(truckGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 2, z),
      new THREE.Vector3(3.5, 4, 9)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Yellow & Black Stencil Delhi Police Metal Barricade
   */
  public createBarricadeMesh(scene: THREE.Scene, x: number, z: number, rot = 0): THREE.Group {
    const barricadeGroup = new THREE.Group();
    barricadeGroup.position.set(x, 0, z);
    barricadeGroup.rotation.y = rot;

    const width = 3.4;
    const height = 1.6;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#18181b';
      for (let i = -100; i < 600; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 30, 0);
        ctx.lineTo(i - 20, 128);
        ctx.lineTo(i - 50, 128);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(130, 34, 252, 60);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DELHI POLICE', 256, 76);
    }

    const tex = new THREE.CanvasTexture(canvas);
    const barricadeMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.6,
      metalness: 0.3,
    });

    const panelGeo = new THREE.BoxGeometry(width, height, 0.15);
    const panel = new THREE.Mesh(panelGeo, barricadeMat);
    panel.position.y = height / 2 + 0.1;
    panel.castShadow = true;
    panel.receiveShadow = true;
    barricadeGroup.add(panel);

    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, height + 0.3, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8 });
    [-width / 2 + 0.1, width / 2 - 0.1].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, (height + 0.3) / 2, 0);
      barricadeGroup.add(leg);

      const footGeo = new THREE.BoxGeometry(0.12, 0.1, 0.8);
      const foot = new THREE.Mesh(footGeo, legMat);
      foot.position.set(lx, 0.05, 0);
      barricadeGroup.add(foot);
    });

    scene.add(barricadeGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width, height, 0.8)
    );
    this.colliders.push({ box, type: 'BARRICADE' });

    return barricadeGroup;
  }

  /**
   * Plaza Lighting and Environment Atmosphere
   */
  private createPlazaLighting(scene: THREE.Scene) {
    this.sunLight = new THREE.DirectionalLight(0xfff1dc, 1.8);
    this.sunLight.position.set(45, 50, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.camera.left = -65;
    this.sunLight.shadow.camera.right = 65;
    this.sunLight.shadow.camera.top = 65;
    this.sunLight.shadow.camera.bottom = -65;
    this.sunLight.shadow.bias = -0.0005;
    scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x718096, 0.7);
    scene.add(this.ambientLight);

    // Stage Spotlights
    const stageSpotCyan = new THREE.SpotLight(0x00f0ff, 3.5, 30, Math.PI / 4, 0.4);
    stageSpotCyan.position.set(-8, 10, 42);
    stageSpotCyan.target.position.set(0, 1, 35);
    scene.add(stageSpotCyan);
    scene.add(stageSpotCyan.target);

    const stageSpotPink = new THREE.SpotLight(0xff007a, 3.5, 30, Math.PI / 4, 0.4);
    stageSpotPink.position.set(8, 10, 42);
    stageSpotPink.target.position.set(0, 1, 35);
    scene.add(stageSpotPink);
    scene.add(stageSpotPink.target);
  }

  /**
   * Configures dynamic TimeOfDay lighting and atmosphere
   */
  public setTimeOfDay(time: TimeOfDay, scene: THREE.Scene) {
    if (!this.sunLight || !this.ambientLight) return;

    if (time === 'GOLDEN_HOUR') {
      scene.background = new THREE.Color(0xdbeafe);
      scene.fog = new THREE.FogExp2(0xfef08a, 0.006);
      this.sunLight.color.setHex(0xffedd5);
      this.sunLight.intensity = 1.8;
      this.ambientLight.color.setHex(0x718096);
      this.ambientLight.intensity = 0.7;
    } else if (time === 'NIGHT_RALLY') {
      scene.background = new THREE.Color(0x090d16);
      scene.fog = new THREE.FogExp2(0x090d16, 0.012);
      this.sunLight.color.setHex(0x38bdf8);
      this.sunLight.intensity = 0.35;
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.45;
    } else {
      // MIDDAY
      scene.background = new THREE.Color(0xbfdbfe);
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.004);
      this.sunLight.color.setHex(0xffffff);
      this.sunLight.intensity = 2.2;
      this.ambientLight.color.setHex(0xa0aec0);
      this.ambientLight.intensity = 0.8;
    }
  }

  /**
   * Flashes police sirens
   */
  public updateSirenLights() {
    const isRed = (Date.now() % 600) < 300;
    this.policeLights.forEach((light, i) => {
      if (i % 2 === 0) {
        light.intensity = isRed ? 3.5 : 0.2;
      } else {
        light.intensity = isRed ? 0.2 : 3.5;
      }
    });
  }

  // =========================================================================
  // CHAPTER 2: PLACE DE LA BASTILLE, PARIS (FRANCE)
  // =========================================================================

  /**
   * Builds the authentic 3D Place de la Bastille (Paris) map
   */
  public buildParisBastille(scene: THREE.Scene): { colliders: Collider[]; busPositions: any[] } {
    this.colliders = [];
    this.busPositions = [];
    this.busDoors.clear();
    this.policeLights = [];

    // Textures & Materials
    const cobblestoneTex = this.generateParisCobblestoneTexture();
    const cobblestoneMat = new THREE.MeshStandardMaterial({
      map: cobblestoneTex,
      roughness: 0.8,
      metalness: 0.1,
    });

    const creamStoneMat = new THREE.MeshStandardMaterial({
      color: 0xf5eee4, // Parisian limestone (Pierre de taille)
      roughness: 0.75,
      metalness: 0.05,
    });

    const zincRoofMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Parisian blue-grey zinc mansard roofs
      roughness: 0.45,
      metalness: 0.4,
    });

    // 1. Parisian Cobblestone Plaza Ground
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const ground = new THREE.Mesh(groundGeo, cobblestoneMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Decorative inner plaza granite ring
    const innerRingGeo = new THREE.RingGeometry(14, 28, 32);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      roughness: 0.85,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.02;
    innerRing.receiveShadow = true;
    scene.add(innerRing);

    // 2. The Colossal July Column (Colonne de Juillet) at Center
    this.createJulyColumn(scene, creamStoneMat);

    // 3. Haussmannian Perimeter Architecture (Parisian Boulevards)
    this.createParisianBuildings(scene, creamStoneMat, zincRoofMat);

    // 4. Parisian Art Nouveau Metro Entrance (Station Bastille)
    this.createParisMetroEntrance(scene, -25, 14);

    // 5. French CRS Police Riot Encampment (CRS Blue Vans, Water Cannon & Vauban Barriers)
    this.createFrenchCRSCamp(scene);

    // 6. Parisian Morris Columns (Colonnes Morris)
    this.createMorrisColumns(scene);

    // 7. Paris Protest Stage with French Tricolor Flags
    this.createParisProtestStage(scene);

    // 8. Overhead Media Drone with Dynamic Spotlight
    this.createMediaDrone(scene);

    // 9. Planted French Protest Placards
    this.createParisPlacards(scene);

    // 10. Ornate Parisian Street Lamps (Réverbères Parisiens)
    this.createParisLighting(scene);

    return {
      colliders: this.colliders,
      busPositions: this.busPositions,
    };
  }

  /**
   * Generates a procedural high-res Parisian dark cobblestone texture
   */
  private generateParisCobblestoneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark slate/charcoal granite base
      ctx.fillStyle = '#1e2430';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;

      const gridSize = 32;
      for (let y = 0; y < 512; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();

        const offset = (y / gridSize) % 2 === 0 ? 0 : gridSize / 2;
        for (let x = offset; x < 512; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + gridSize);
          ctx.stroke();

          // Subtle variation in granite pavers
          const tone = Math.random();
          if (tone < 0.25) {
            ctx.fillStyle = 'rgba(75, 85, 99, 0.2)';
            ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
          } else if (tone > 0.75) {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
            ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
          }
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    return tex;
  }

  /**
   * The Monumental July Column (Colonne de Juillet)
   */
  private createJulyColumn(scene: THREE.Scene, stoneMat: THREE.Material) {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    // 1. Concentric Stepped Stone Base (Plinth)
    const tiers = [
      { r: 14, h: 0.8, y: 0.4 },
      { r: 11, h: 0.8, y: 1.2 },
      { r: 8.5, h: 1.0, y: 2.1 },
    ];
    tiers.forEach((t) => {
      const geo = new THREE.CylinderGeometry(t.r, t.r + 0.3, t.h, 32);
      const mesh = new THREE.Mesh(geo, stoneMat);
      mesh.position.y = t.y;
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      group.add(mesh);
    });

    // 2. Square White Marble & Bronze Pedestal
    const pedGeo = new THREE.BoxGeometry(7, 5, 7);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x2b382d, // Dark antique French bronze
      metalness: 0.45,
      roughness: 0.5,
    });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = 5.1;
    ped.castShadow = true;
    ped.receiveShadow = true;
    group.add(ped);

    // Golden Inscription Medallions on 4 sides of the pedestal
    const medGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
    const medMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Gilded gold
      metalness: 0.85,
      roughness: 0.25,
    });
    const medOffsets = [
      { x: 0, z: 3.55, rot: 0 },
      { x: 0, z: -3.55, rot: Math.PI },
      { x: 3.55, z: 0, rot: Math.PI / 2 },
      { x: -3.55, z: 0, rot: -Math.PI / 2 },
    ];
    medOffsets.forEach((m) => {
      const med = new THREE.Mesh(medGeo, medMat);
      med.rotation.x = Math.PI / 2;
      med.rotation.z = m.rot;
      med.position.set(m.x, 5.1, m.z);
      group.add(med);
    });

    // 3. Tall Fluted Dark Bronze Column (24m high)
    const colGeo = new THREE.CylinderGeometry(1.6, 1.8, 22, 24);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x1f3b30, // Verdigris dark patina green
      metalness: 0.6,
      roughness: 0.35,
    });
    const column = new THREE.Mesh(colGeo, colMat);
    column.position.y = 18.6;
    column.castShadow = true;
    group.add(column);

    // Decorative Gilded Bronze Rings along the column
    [11, 16, 21, 26].forEach((yPos) => {
      const ringGeo = new THREE.TorusGeometry(1.8, 0.12, 8, 24);
      const ring = new THREE.Mesh(ringGeo, medMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = yPos;
      group.add(ring);
    });

    // 4. Corinthian Capital & Observation Balustrade
    const capGeo = new THREE.CylinderGeometry(2.5, 1.7, 1.8, 24);
    const cap = new THREE.Mesh(capGeo, medMat);
    cap.position.y = 30.5;
    group.add(cap);

    const balustradeGeo = new THREE.CylinderGeometry(2.7, 2.7, 0.8, 24, 1, true);
    const balustrade = new THREE.Mesh(balustradeGeo, medMat);
    balustrade.position.y = 31.8;
    group.add(balustrade);

    // 5. Gilded Dome & Winged Statue (Le Génie de la Liberté)
    const domeGeo = new THREE.SphereGeometry(1.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, medMat);
    dome.position.y = 32.2;
    group.add(dome);

    // Golden Angel Figure (Génie de la Liberté)
    const figureGroup = new THREE.Group();
    figureGroup.position.set(0, 33.6, 0);

    // Angel Body
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.18, 1.6, 8);
    const angelMat = new THREE.MeshStandardMaterial({
      color: 0xffdf00,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xffc700,
      emissiveIntensity: 0.25,
    });
    const angelBody = new THREE.Mesh(bodyGeo, angelMat);
    figureGroup.add(angelBody);

    // Wings
    const wingGeo = new THREE.BoxGeometry(1.6, 0.8, 0.08);
    const leftWing = new THREE.Mesh(wingGeo, angelMat);
    leftWing.position.set(-0.8, 0.5, -0.2);
    leftWing.rotation.z = Math.PI / 6;
    leftWing.rotation.y = -Math.PI / 8;
    figureGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, angelMat);
    rightWing.position.set(0.8, 0.5, -0.2);
    rightWing.rotation.z = -Math.PI / 6;
    rightWing.rotation.y = Math.PI / 8;
    figureGroup.add(rightWing);

    // Torch of Freedom (emitting radiant golden light)
    const torchGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
    const torch = new THREE.Mesh(torchGeo, angelMat);
    torch.position.set(0.4, 0.9, 0.3);
    torch.rotation.z = -Math.PI / 8;
    figureGroup.add(torch);

    const flameLight = new THREE.PointLight(0xffb703, 2.5, 30);
    flameLight.position.set(0.5, 1.4, 0.4);
    figureGroup.add(flameLight);

    group.add(figureGroup);
    scene.add(group);

    // Add Central Monument Collider
    const colBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 8, 0),
      new THREE.Vector3(9, 16, 9)
    );
    this.colliders.push({ box: colBox, type: 'WALL' });
  }

  /**
   * Haussmannian Buildings along North, East, and West perimeter
   */
  private createParisianBuildings(
    scene: THREE.Scene,
    stoneMat: THREE.Material,
    zincMat: THREE.Material
  ) {
    const buildingSpecs = [
      // North Boulevard Buildings
      { x: -50, z: -68, w: 42, d: 20, h: 22, rot: 0 },
      { x: 0, z: -68, w: 52, d: 20, h: 22, rot: 0 },
      { x: 50, z: -68, w: 42, d: 20, h: 22, rot: 0 },

      // West Boulevard Buildings
      { x: -68, z: -25, w: 20, d: 45, h: 22, rot: 0 },
      { x: -68, z: 25, w: 20, d: 45, h: 22, rot: 0 },

      // East Boulevard Buildings
      { x: 68, z: -25, w: 20, d: 45, h: 22, rot: 0 },
      { x: 68, z: 25, w: 20, d: 45, h: 22, rot: 0 },
    ];

    buildingSpecs.forEach((b, idx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);

      // Main Stone Facade
      const facadeGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const facade = new THREE.Mesh(facadeGeo, stoneMat);
      facade.position.y = b.h / 2;
      facade.castShadow = true;
      facade.receiveShadow = true;
      bGroup.add(facade);

      // Zinc Mansard Roof (Sloped top)
      const roofGeo = new THREE.BoxGeometry(b.w - 0.5, 6, b.d - 0.5);
      const roof = new THREE.Mesh(roofGeo, zincMat);
      roof.position.y = b.h + 3;
      roof.castShadow = true;
      bGroup.add(roof);

      // Window Rows (Haussmann rhythm)
      const windowMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.2,
        metalness: 0.8,
      });
      const windowRowY = [5, 10, 15, 19];
      windowRowY.forEach((wy) => {
        const rowGeo = new THREE.BoxGeometry(b.w * 0.85, 1.8, b.d + 0.2);
        const rowMesh = new THREE.Mesh(rowGeo, windowMat);
        rowMesh.position.y = wy;
        bGroup.add(rowMesh);
      });

      // Ground Floor Parisian Bistro / Café
      if (idx === 1) {
        // "Bistrot de la Bastille" with red-striped awning
        const awningGeo = new THREE.BoxGeometry(16, 0.4, 3.5);
        const awningMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.6 });
        const awning = new THREE.Mesh(awningGeo, awningMat);
        awning.position.set(0, 3.8, b.d / 2 + 1.6);
        awning.rotation.x = Math.PI / 14;
        bGroup.add(awning);

        // Café signage canvas
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 256;
        signCanvas.height = 64;
        const sctx = signCanvas.getContext('2d');
        if (sctx) {
          sctx.fillStyle = '#0f172a';
          sctx.fillRect(0, 0, 256, 64);
          sctx.fillStyle = '#fef08a';
          sctx.font = 'bold 22px Outfit, sans-serif';
          sctx.textAlign = 'center';
          sctx.fillText('BISTROT DE LA BASTILLE', 128, 42);
        }
        const signTex = new THREE.CanvasTexture(signCanvas);
        const signGeo = new THREE.BoxGeometry(14, 1.2, 0.1);
        const signMat = new THREE.MeshStandardMaterial({ map: signTex });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 4.4, b.d / 2 + 0.15);
        bGroup.add(sign);
      }

      scene.add(bGroup);

      // Add building collider
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(b.x, b.h / 2, b.z),
        new THREE.Vector3(b.w, b.h, b.d)
      );
      this.colliders.push({ box, type: 'WALL' });
    });
  }

  /**
   * Art Nouveau Guimard Parisian Metro Entrance (Station Bastille)
   */
  private createParisMetroEntrance(scene: THREE.Scene, x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const greenIronMat = new THREE.MeshStandardMaterial({
      color: 0x164e3b, // Iconic Paris Metro emerald green
      roughness: 0.35,
      metalness: 0.6,
    });

    // Sunken Stairway Border
    const stairGeo = new THREE.BoxGeometry(4.5, 0.4, 7);
    const stairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const stairs = new THREE.Mesh(stairGeo, stairMat);
    stairs.position.y = 0.2;
    group.add(stairs);

    // Railing around 3 sides
    const railLGeo = new THREE.BoxGeometry(0.2, 1.2, 6.8);
    const railL = new THREE.Mesh(railLGeo, greenIronMat);
    railL.position.set(-2.2, 0.8, 0);
    group.add(railL);

    const railR = new THREE.Mesh(railLGeo, greenIronMat);
    railR.position.set(2.2, 0.8, 0);
    group.add(railR);

    const railBGeo = new THREE.BoxGeometry(4.4, 1.2, 0.2);
    const railB = new THREE.Mesh(railBGeo, greenIronMat);
    railB.position.set(0, 0.8, -3.4);
    group.add(railB);

    // Archway with "MÉTROPOLITAIN" sign
    const archPoleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8);
    const archPoleL = new THREE.Mesh(archPoleGeo, greenIronMat);
    archPoleL.position.set(-2.2, 1.9, 3.4);
    group.add(archPoleL);

    const archPoleR = new THREE.Mesh(archPoleGeo, greenIronMat);
    archPoleR.position.set(2.2, 1.9, 3.4);
    group.add(archPoleR);

    // Amber Flower Globe Lamp atop poles
    const globeGeo = new THREE.SphereGeometry(0.25, 12, 12);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
    });
    const globeL = new THREE.Mesh(globeGeo, globeMat);
    globeL.position.set(-2.2, 3.8, 3.4);
    group.add(globeL);

    const globeR = new THREE.Mesh(globeGeo, globeMat);
    globeR.position.set(2.2, 3.8, 3.4);
    group.add(globeR);

    // "MÉTROPOLITAIN" Archway Banner
    const archCanvas = document.createElement('canvas');
    archCanvas.width = 256;
    archCanvas.height = 64;
    const actx = archCanvas.getContext('2d');
    if (actx) {
      actx.fillStyle = '#164e3b';
      actx.fillRect(0, 0, 256, 64);
      actx.fillStyle = '#fef08a';
      actx.font = 'bold 26px Outfit, sans-serif';
      actx.textAlign = 'center';
      actx.fillText('MÉTROPOLITAIN', 128, 44);
    }
    const archTex = new THREE.CanvasTexture(archCanvas);
    const archSignGeo = new THREE.BoxGeometry(4.2, 0.7, 0.1);
    const archSignMat = new THREE.MeshStandardMaterial({ map: archTex });
    const archSign = new THREE.Mesh(archSignGeo, archSignMat);
    archSign.position.set(0, 3.4, 3.4);
    group.add(archSign);

    scene.add(group);

    // Collider
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 1, z),
      new THREE.Vector3(5, 2, 7.5)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * French CRS Police Encampment: CRS Blue Vans, Armored Water Cannon & Vauban Barriers
   */
  private createFrenchCRSCamp(scene: THREE.Scene) {
    // 2 French CRS Detainment Vans (Working rear doors for jailbreak)
    this.createFrenchCRSRiotVan(scene, -22, 54, Math.PI / 12, 'CRS_ALPHA');
    this.createFrenchCRSRiotVan(scene, 22, 54, -Math.PI / 12, 'CRS_BRAVO');

    // Armored French CRS Water Cannon Truck (Camion Arroseur Blindé)
    this.createFrenchWaterCannonTruck(scene, 0, 62);

    // Galvanized Silver Steel Crowd Barriers (Barrières Vauban)
    const barricadeSpecs = [
      { x: -14, z: 42, rot: 0.05 },
      { x: -6, z: 42, rot: -0.05 },
      { x: 6, z: 42, rot: 0.05 },
      { x: 14, z: 42, rot: -0.05 },
      { x: -28, z: 28, rot: Math.PI / 3.5 },
      { x: 28, z: 28, rot: -Math.PI / 3.5 },
      { x: -18, z: 10, rot: 0 },
      { x: 18, z: 10, rot: 0 },
    ];

    barricadeSpecs.forEach((b) => {
      this.createBarricadeMesh(scene, b.x, b.z, b.rot);
    });
  }

  /**
   * French CRS Riot Tactical Van (Fourgon CRS) with escape rear hatch
   */
  public createFrenchCRSRiotVan(
    scene: THREE.Scene,
    x: number,
    z: number,
    rot: number,
    busId: string
  ) {
    const busGroup = new THREE.Group();
    busGroup.position.set(x, 0, z);
    busGroup.rotation.y = rot;

    const busLength = 10.5;
    const busWidth = 3.2;
    const busHeight = 3.5;

    // CRS Body (Deep French Tactical Navy Blue)
    const bodyGeo = new THREE.BoxGeometry(busWidth, busHeight, busLength);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f2852, // Authentic French CRS Dark Blue
      roughness: 0.35,
      metalness: 0.3,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = busHeight / 2 + 0.6;
    bodyMesh.castShadow = true;
    busGroup.add(bodyMesh);

    // Reflective White Side Stripe with French CRS markings
    const stripeGeo = new THREE.BoxGeometry(busWidth + 0.05, 0.45, busLength);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.y = 2.1;
    busGroup.add(stripeMesh);

    // French Tricolor Flag Cockade on Sides (Blue / White / Red)
    const flagGeo = new THREE.BoxGeometry(busWidth + 0.08, 0.4, 0.8);
    const flagMat = new THREE.MeshStandardMaterial({ color: 0x002395 });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(0, 2.1, 3.2);
    busGroup.add(flagMesh);

    // Reinforced Wire-Mesh Windows
    const windowGeo = new THREE.BoxGeometry(busWidth + 0.1, 1.1, busLength * 0.65);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.8,
    });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.position.y = 2.7;
    busGroup.add(windowMesh);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.6, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wheelOffsets = [
      { x: -busWidth / 2 - 0.1, z: 3.2 },
      { x: busWidth / 2 + 0.1, z: 3.2 },
      { x: -busWidth / 2 - 0.1, z: -3.2 },
      { x: busWidth / 2 + 0.1, z: -3.2 },
    ];
    wheelOffsets.forEach((w) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(w.x, 0.65, w.z);
      busGroup.add(wheel);
    });

    // Rear Escape Door (Hinged for Jailbreak Rescue)
    const doorHinge = new THREE.Group();
    doorHinge.position.set(busWidth / 2 - 0.1, 1.8, -busLength / 2 - 0.05);

    const doorGeo = new THREE.BoxGeometry(1.6, 2.4, 0.15);
    doorGeo.translate(-0.8, 0, 0); // pivot on edge
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c, // High-contrast Red emergency release door
      roughness: 0.3,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorHinge.add(doorMesh);
    busGroup.add(doorHinge);
    this.busDoors.set(busId, doorHinge);

    // Flashing French Blue Beacons (Gyrophare Bleu)
    const beaconGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.35, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x0055ff,
      emissive: 0x0055ff,
      emissiveIntensity: 0.8,
    });

    const beacon1 = new THREE.Mesh(beaconGeo, beaconMat);
    beacon1.position.set(-0.8, busHeight + 0.78, 3.5);
    busGroup.add(beacon1);

    const beacon2 = new THREE.Mesh(beaconGeo, beaconMat);
    beacon2.position.set(0.8, busHeight + 0.78, 3.5);
    busGroup.add(beacon2);

    const blueLight1 = new THREE.PointLight(0x0066ff, 3.0, 14);
    blueLight1.position.set(-0.8, busHeight + 0.9, 3.5);
    busGroup.add(blueLight1);
    this.policeLights.push(blueLight1);

    const blueLight2 = new THREE.PointLight(0x0088ff, 3.0, 14);
    blueLight2.position.set(0.8, busHeight + 0.9, 3.5);
    busGroup.add(blueLight2);
    this.policeLights.push(blueLight2);

    scene.add(busGroup);

    this.busPositions.push({ x, y: 0, z, id: busId });

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, busHeight / 2, z),
      new THREE.Vector3(busWidth, busHeight, busLength)
    );
    this.colliders.push({ box, type: 'BUS', interactiveId: busId });
  }

  /**
   * Armored French CRS Water Cannon Truck (Camion Arroseur Blindé)
   */
  private createFrenchWaterCannonTruck(scene: THREE.Scene, x: number, z: number) {
    const truckGroup = new THREE.Group();
    truckGroup.position.set(x, 0, z);

    // Armored Cab
    const cabGeo = new THREE.BoxGeometry(3.6, 3.8, 11);
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f, // Dark tactical navy
      metalness: 0.7,
      roughness: 0.3,
    });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.y = 2.4;
    cab.castShadow = true;
    truckGroup.add(cab);

    // Dual Roof Water Cannon Monitors
    const cannonGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.6, 12);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const cannonL = new THREE.Mesh(cannonGeo, cannonMat);
    cannonL.rotation.x = Math.PI / 3;
    cannonL.position.set(-0.8, 4.6, 3.5);
    truckGroup.add(cannonL);

    const cannonR = new THREE.Mesh(cannonGeo, cannonMat);
    cannonR.rotation.x = Math.PI / 3;
    cannonR.position.set(0.8, 4.6, 3.5);
    truckGroup.add(cannonR);

    // Flashing CRS Lightbar
    const beacon = new THREE.PointLight(0x0066ff, 3.5, 16);
    beacon.position.set(0, 4.8, 4.0);
    truckGroup.add(beacon);
    this.policeLights.push(beacon);

    scene.add(truckGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 2.4, z),
      new THREE.Vector3(3.6, 4, 11)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Parisian Morris Columns (Colonnes Morris) with French Protest Art
   */
  private createMorrisColumns(scene: THREE.Scene) {
    const pos = [
      { x: -35, z: -25, slogan: 'LIBERTÉ • ÉGALITÉ • SOLIDARITÉ' },
      { x: 35, z: -25, slogan: 'CLIMAT URGENCE PARIS' },
      { x: -35, z: 25, slogan: 'VOIX DE LA JEUNESSE • BASTILLE' },
      { x: 35, z: 25, slogan: 'PROTEST-N-CHASE: WORLD TOUR' },
    ];

    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // Classic Paris kiosk green
      roughness: 0.4,
      metalness: 0.5,
    });

    pos.forEach((p) => {
      const kGroup = new THREE.Group();
      kGroup.position.set(p.x, 0, p.z);

      // Kiosk Base
      const baseGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.8, 16);
      const baseMesh = new THREE.Mesh(baseGeo, greenMat);
      baseMesh.position.y = 0.4;
      kGroup.add(baseMesh);

      // Poster Cylinder
      const postCanvas = document.createElement('canvas');
      postCanvas.width = 256;
      postCanvas.height = 256;
      const pctx = postCanvas.getContext('2d');
      if (pctx) {
        pctx.fillStyle = '#fef08a';
        pctx.fillRect(0, 0, 256, 256);
        pctx.fillStyle = '#0f172a';
        pctx.font = 'bold 24px Outfit, sans-serif';
        pctx.textAlign = 'center';
        pctx.fillText(p.slogan, 128, 130);
      }
      const postTex = new THREE.CanvasTexture(postCanvas);
      const bodyGeo = new THREE.CylinderGeometry(1.35, 1.35, 3.8, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ map: postTex });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 2.7;
      body.castShadow = true;
      kGroup.add(body);

      // Ornate Dome Roof
      const domeGeo = new THREE.SphereGeometry(1.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, greenMat);
      dome.position.y = 4.6;
      kGroup.add(dome);

      scene.add(kGroup);

      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(p.x, 2.5, p.z),
        new THREE.Vector3(3, 5, 3)
      );
      this.colliders.push({ box, type: 'WALL' });
    });
  }

  /**
   * Paris Protest Stage with French Tricolor Flags
   */
  private createParisProtestStage(scene: THREE.Scene) {
    const stageGroup = new THREE.Group();
    stageGroup.position.copy(this.stagePosition);

    // Stage Platform
    const stagePlatformGeo = new THREE.BoxGeometry(16, 1.2, 10);
    const stagePlatformMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
    });
    const platform = new THREE.Mesh(stagePlatformGeo, stagePlatformMat);
    platform.position.y = 0.6;
    platform.receiveShadow = true;
    platform.castShadow = true;
    stageGroup.add(platform);

    // French Tricolor Flag Poles on Stage
    [-7, 7].forEach((xPos, idx) => {
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 6, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(xPos, 3, 4);
      stageGroup.add(pole);

      // French Flag Canvas (Bleu, Blanc, Rouge)
      const flagCanvas = document.createElement('canvas');
      flagCanvas.width = 180;
      flagCanvas.height = 120;
      const fctx = flagCanvas.getContext('2d');
      if (fctx) {
        fctx.fillStyle = '#002395'; // French Blue
        fctx.fillRect(0, 0, 60, 120);
        fctx.fillStyle = '#ffffff'; // White
        fctx.fillRect(60, 0, 60, 120);
        fctx.fillStyle = '#ed2939'; // French Red
        fctx.fillRect(120, 0, 60, 120);
      }
      const flagTex = new THREE.CanvasTexture(flagCanvas);
      const flagGeo = new THREE.PlaneGeometry(2.4, 1.6);
      const flagMat = new THREE.MeshStandardMaterial({
        map: flagTex,
        side: THREE.DoubleSide,
      });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(xPos + (idx === 0 ? 1.2 : -1.2), 4.8, 4);
      stageGroup.add(flag);
    });

    // Massive Paris Stage Backdrop Banner
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 384;
    const bctx = bannerCanvas.getContext('2d');
    if (bctx) {
      // Dark Blue gradient
      const grad = bctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e3a8a');
      grad.addColorStop(1, '#0f172a');
      bctx.fillStyle = grad;
      bctx.fillRect(0, 0, 1024, 384);

      // Tricolor Header Bar
      bctx.fillStyle = '#002395';
      bctx.fillRect(0, 0, 341, 14);
      bctx.fillStyle = '#ffffff';
      bctx.fillRect(341, 0, 342, 14);
      bctx.fillStyle = '#ed2939';
      bctx.fillRect(683, 0, 341, 14);

      bctx.fillStyle = '#38bdf8';
      bctx.font = 'bold 36px Outfit, sans-serif';
      bctx.textAlign = 'center';
      bctx.fillText('⚡️ PROTEST-N-CHASE: WORLD TOUR • PARIS ⚡️', 512, 110);

      bctx.fillStyle = '#ffffff';
      bctx.font = '900 68px Outfit, sans-serif';
      bctx.fillText('LIBERTÉ • ÉGALITÉ • SOLIDARITÉ', 512, 210);

      bctx.fillStyle = '#f472b6';
      bctx.font = 'bold 32px Outfit, sans-serif';
      bctx.fillText('PLACE DE LA BASTILLE • BY SHAZEB ANWAR KHAN', 512, 310);
    }
    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerGeo = new THREE.BoxGeometry(15, 6, 0.2);
    const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 4.2, -4.8);
    stageGroup.add(banner);

    scene.add(stageGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.stagePosition.x, 3, this.stagePosition.z),
      new THREE.Vector3(16, 6, 10)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Planted French Protest Placards in Paris Plaza
   */
  private createParisPlacards(scene: THREE.Scene) {
    const slogans = [
      'LIBERTÉ POUR LA JEUNESSE!',
      'JUSTICE SOCIALE & CLIMAT',
      'NOTRE VOIX, NOTRE POUVOIR',
      'BASTILLE DEBOUT!',
      'AVENIR ÉCOLOGIQUE',
      'PROTEST-N-CHASE 2026',
    ];

    const positions = [
      { x: -28, z: 12 },
      { x: -22, z: 28 },
      { x: 25, z: 15 },
      { x: 32, z: 26 },
      { x: -10, z: 22 },
      { x: 10, z: 22 },
    ];

    positions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = (Math.random() - 0.5) * 0.6;

      const stakeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
      const stakeMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
      const stake = new THREE.Mesh(stakeGeo, stakeMat);
      stake.position.y = 0.9;
      group.add(stake);

      const boardGeo = new THREE.BoxGeometry(1.6, 1.1, 0.05);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = idx % 2 === 0 ? '#38bdf8' : '#fed7aa';
        ctx.fillRect(0, 0, 256, 160);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slogans[idx % slogans.length], 128, 85);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const boardMat = new THREE.MeshStandardMaterial({ map: tex });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(0, 1.6, 0.03);
      group.add(board);

      scene.add(group);
    });
  }

  /**
   * Ornate Parisian Street Lighting (Réverbères Parisiens)
   */
  private createParisLighting(scene: THREE.Scene) {
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.3,
    });

    const lampPositions = [
      { x: -28, z: -10 },
      { x: 28, z: -10 },
      { x: -28, z: 22 },
      { x: 28, z: 22 },
      { x: -16, z: -35 },
      { x: 16, z: -35 },
    ];

    lampPositions.forEach((pos) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(pos.x, 0, pos.z);

      // Ornate Cast Iron Lamp Post
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.22, 6, 8);
      const pole = new THREE.Mesh(poleGeo, lampMat);
      pole.position.y = 3;
      pole.castShadow = true;
      lampGroup.add(pole);

      // Dual Lantern Arms
      const armGeo = new THREE.BoxGeometry(1.8, 0.12, 0.12);
      const arm = new THREE.Mesh(armGeo, lampMat);
      arm.position.y = 5.8;
      lampGroup.add(arm);

      // Warm Parisian Lantern Glow
      [-0.8, 0.8].forEach((lx) => {
        const lanternGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
        const lanternMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xfef08a,
          emissiveIntensity: 0.9,
        });
        const lantern = new THREE.Mesh(lanternGeo, lanternMat);
        lantern.position.set(lx, 5.5, 0);
        lampGroup.add(lantern);

        const pointLight = new THREE.PointLight(0xfef08a, 1.4, 18);
        pointLight.position.set(lx, 5.2, 0);
        lampGroup.add(pointLight);
      });

      scene.add(lampGroup);

      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(pos.x, 3, pos.z),
        new THREE.Vector3(1, 6, 1)
      );
      this.colliders.push({ box, type: 'WALL' });
    });

    // Sun & Ambient Lighting for Paris Twilight / Blue-Hour
    this.ambientLight = new THREE.AmbientLight(0x718096, 0.8);
    scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    this.sunLight.position.set(35, 60, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.bias = -0.0005;

    const d = 60;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    scene.add(this.sunLight);
  }
}
