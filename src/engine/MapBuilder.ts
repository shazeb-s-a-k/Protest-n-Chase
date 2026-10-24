import * as THREE from 'three';
import { TimeOfDay } from '../types/game';
import { TextureGenerator } from './TextureGenerator';

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

    // High-Resolution PBR Textures & Materials
    const { map: pavementTex, bumpMap: pavementBump } = TextureGenerator.getSandstoneFlagstoneTexture();
    const pavementMat = new THREE.MeshStandardMaterial({
      map: pavementTex,
      bumpMap: pavementBump,
      bumpScale: 0.08,
      roughness: 0.72,
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

    // 11. GTA Vice City Boulevard Roadways & Curbs
    this.createGTARoadways(scene, 'DELHI');

    // 12. Tropical Palm Tree Groves (Vice City signature palms)
    this.createPalmGroves(scene, 'DELHI');

    // 13. Parked GTA Sports Cars & Street Dressing
    this.createGTAStreetDressings(scene, 'DELHI');

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

    // 2 High-Speed Tactical Police Cruisers with flashing dual lightbars
    this.createPoliceCruiser(scene, -11, 47, 0.22, 'DELHI');
    this.createPoliceCruiser(scene, 11, 47, -0.22, 'DELHI');

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

    const busLength = 11.2;
    const busWidth = 3.3;
    const busHeight = 3.6;

    // 1. Lower Chassis (Dark Metallic Steel)
    const chassisGeo = new THREE.BoxGeometry(busWidth - 0.2, 0.4, busLength);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.8 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.55;
    busGroup.add(chassis);

    // 2. Main Bus Body (Deep Police Blue with subtle metallic car lacquer)
    const bodyGeo = new THREE.BoxGeometry(busWidth, busHeight - 0.4, busLength);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.25,
      metalness: 0.45,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = busHeight / 2 + 0.6;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    busGroup.add(bodyMesh);

    // 3. Curved Aerodynamic Roof Cap with Roof Ribs
    const roofGeo = new THREE.CylinderGeometry(busWidth / 2, busWidth / 2, busLength, 16, 1, false, 0, Math.PI);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.3, metalness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.x = Math.PI / 2;
    roof.rotation.z = Math.PI / 2;
    roof.position.set(0, busHeight + 0.35, 0);
    busGroup.add(roof);

    // Roof AC & Ventilation Pods
    [-2, 1.5].forEach((offsetZ) => {
      const acGeo = new THREE.BoxGeometry(1.8, 0.35, 1.6);
      const acMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const ac = new THREE.Mesh(acGeo, acMat);
      ac.position.set(0, busHeight + 0.65, offsetZ);
      busGroup.add(ac);
    });

    // 4. Slanted Aerodynamic Windshield with Black Rubber Framing
    const windGeo = new THREE.BoxGeometry(busWidth - 0.25, 1.25, 0.2);
    const windMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.05,
      metalness: 0.95,
    });
    const windshield = new THREE.Mesh(windGeo, windMat);
    windshield.position.set(0, 2.7, busLength / 2 + 0.02);
    windshield.rotation.x = -0.15;
    busGroup.add(windshield);

    // Steel Riot Mesh Wire Guard on Windshield
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x000000, wireframe: true });
    const wireMesh = new THREE.Mesh(new THREE.BoxGeometry(busWidth - 0.28, 1.22, 0.22), wireMat);
    wireMesh.position.set(0, 2.7, busLength / 2 + 0.04);
    wireMesh.rotation.x = -0.15;
    busGroup.add(wireMesh);

    // 5. Front Chrome Grille & High-Intensity Headlights
    const grilleGeo = new THREE.BoxGeometry(2.2, 0.7, 0.15);
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.2 });
    const grille = new THREE.Mesh(grilleGeo, grilleMat);
    grille.position.set(0, 1.35, busLength / 2 + 0.05);
    busGroup.add(grille);

    // Headlight Assemblies (Chrome bezel + Glowing Emissive lens)
    [-1.25, 1.25].forEach((hx) => {
      const bezelGeo = new THREE.BoxGeometry(0.5, 0.38, 0.12);
      const bezelMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      bezel.position.set(hx, 1.45, busLength / 2 + 0.04);
      busGroup.add(bezel);

      const lensGeo = new THREE.BoxGeometry(0.42, 0.3, 0.05);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff7ed,
        emissiveIntensity: 0.9,
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(hx, 1.45, busLength / 2 + 0.09);
      busGroup.add(lens);

      const indGeo = new THREE.BoxGeometry(0.15, 0.3, 0.04);
      const indMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6 });
      const ind = new THREE.Mesh(indGeo, indMat);
      ind.position.set(hx > 0 ? hx + 0.32 : hx - 0.32, 1.45, busLength / 2 + 0.08);
      busGroup.add(ind);
    });

    // 6. Heavy-Duty Steel Bull-Bar Push Bumper
    const bumperGeo = new THREE.BoxGeometry(busWidth + 0.2, 0.5, 0.4);
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.8 });
    const bumper = new THREE.Mesh(bumperGeo, bumperMat);
    bumper.position.set(0, 0.75, busLength / 2 + 0.2);
    busGroup.add(bumper);

    // 7. Dual Aerodynamic Rearview Mirrors
    [-busWidth / 2 - 0.25, busWidth / 2 + 0.25].forEach((mx) => {
      const mirrorPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8),
        bumperMat
      );
      mirrorPost.rotation.z = mx > 0 ? -Math.PI / 3 : Math.PI / 3;
      mirrorPost.position.set(mx * 0.9, 2.5, busLength / 2 - 0.4);
      busGroup.add(mirrorPost);

      const mirrorHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.45, 0.22),
        bumperMat
      );
      mirrorHousing.position.set(mx, 2.65, busLength / 2 - 0.25);
      busGroup.add(mirrorHousing);
    });

    // 8. High-Detail Wheels with Steel Rims, Lug Nuts & Deep Tire Tread
    const wheelOffsets = [
      { x: -busWidth / 2 - 0.12, z: 3.3 },
      { x: busWidth / 2 + 0.12, z: 3.3 },
      { x: -busWidth / 2 - 0.12, z: -3.3 },
      { x: busWidth / 2 + 0.12, z: -3.3 },
    ];
    wheelOffsets.forEach((w) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(w.x, 0.68, w.z);
      wheelGroup.rotation.z = Math.PI / 2;

      const tireGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.48, 20);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      wheelGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.50, 16);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rim);

      const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.52, 10);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.95 });
      const hub = new THREE.Mesh(hubGeo, hubMat);
      wheelGroup.add(hub);

      busGroup.add(wheelGroup);
    });

    // 9. Reflective Yellow Stencil Stripe with "DELHI POLICE"
    const stripeGeo = new THREE.BoxGeometry(busWidth + 0.06, 0.5, busLength - 0.4);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 2.05, -0.1);
    busGroup.add(stripe);

    // 10. Barred Security Windows along sides
    const winGeo = new THREE.BoxGeometry(busWidth + 0.08, 1.15, busLength * 0.68);
    const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.95 });
    const windows = new THREE.Mesh(winGeo, winMat);
    windows.position.set(0, 2.75, -0.6);
    busGroup.add(windows);

    // 11. Rear Emergency Door (Can swing open on Jailbreak)
    const doorHinge = new THREE.Group();
    doorHinge.position.set(busWidth / 2 - 0.15, 1.8, -busLength / 2 - 0.05);

    const doorGeo = new THREE.BoxGeometry(1.6, 2.4, 0.18);
    doorGeo.translate(-0.8, 0, 0);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      metalness: 0.2,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.castShadow = true;
    doorHinge.add(doorMesh);
    busGroup.add(doorHinge);
    this.busDoors.set(busId, doorHinge);

    // 12. Rear LED Brake Lights
    [-1.25, 1.25].forEach((rx) => {
      const brakeGeo = new THREE.BoxGeometry(0.35, 0.55, 0.06);
      const brakeMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.8,
      });
      const brake = new THREE.Mesh(brakeGeo, brakeMat);
      brake.position.set(rx, 1.6, -busLength / 2 - 0.02);
      busGroup.add(brake);
    });

    // 13. Flashing Dual Siren Lightbar
    const lightBarGeo = new THREE.BoxGeometry(1.6, 0.28, 0.38);
    const lightBarMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
    const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
    lightBar.position.set(0, busHeight + 0.82, 3.2);
    busGroup.add(lightBar);

    const redLight = new THREE.PointLight(0xef4444, 2.8, 14);
    redLight.position.set(-0.55, busHeight + 0.95, 3.2);
    busGroup.add(redLight);
    this.policeLights.push(redLight);

    const blueLight = new THREE.PointLight(0x00f0ff, 2.8, 14);
    blueLight.position.set(0.55, busHeight + 0.95, 3.2);
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
      door.rotation.y = -Math.PI / 1.8;
      setTimeout(() => {
        door.rotation.y = 0;
      }, 4000);
    }
  }

  /**
   * High-Detail Water Cannon Truck "Varun" with armored cab & dual roof turrets
   */
  private createWaterCannonTruck(scene: THREE.Scene, x: number, z: number) {
    const truckGroup = new THREE.Group();
    truckGroup.position.set(x, 0, z);

    // 1. Armored Chassis & Slanted Heavy Cab
    const cabGeo = new THREE.BoxGeometry(3.6, 3.4, 9.6);
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.65,
      roughness: 0.35,
    });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.y = 2.4;
    cab.castShadow = true;
    cab.receiveShadow = true;
    truckGroup.add(cab);

    // Front Hydraulic Heavy Dozer Push-Plow / Obstacle Blade
    const plowGeo = new THREE.BoxGeometry(3.8, 1.1, 0.4);
    const plowMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.3 });
    const plow = new THREE.Mesh(plowGeo, plowMat);
    plow.position.set(0, 0.75, 5.0);
    truckGroup.add(plow);

    // 2. Dual High-Pressure Water Cannon Turrets on Roof
    [-0.9, 0.9].forEach((tx) => {
      const baseGeo = new THREE.CylinderGeometry(0.35, 0.42, 0.3, 12);
      const turretMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
      const base = new THREE.Mesh(baseGeo, turretMat);
      base.position.set(tx, 4.25, 2.2);
      truckGroup.add(base);

      const barrelGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.8, 12);
      const barrel = new THREE.Mesh(barrelGeo, turretMat);
      barrel.rotation.x = Math.PI / 3.2;
      barrel.position.set(tx, 4.75, 2.6);
      barrel.castShadow = true;
      truckGroup.add(barrel);
    });

    // 3. Heavy-Duty Armored Wheels
    const truckWheelOffsets = [
      { x: -1.9, z: 2.8 },
      { x: 1.9, z: 2.8 },
      { x: -1.9, z: -2.8 },
      { x: 1.9, z: -2.8 },
    ];
    truckWheelOffsets.forEach((tw) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(tw.x, 0.75, tw.z);
      wGroup.rotation.z = Math.PI / 2;

      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.75, 0.55, 18),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
      );
      wGroup.add(tire);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 0.57, 14),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 })
      );
      wGroup.add(rim);

      truckGroup.add(wGroup);
    });

    // 4. Roof Emergency Blue Siren Light
    const siren = new THREE.PointLight(0x00f0ff, 3.2, 16);
    siren.position.set(0, 4.6, 0);
    truckGroup.add(siren);
    this.policeLights.push(siren);

    scene.add(truckGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 2.4, z),
      new THREE.Vector3(3.8, 4.2, 10)
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
  /**
   * Plaza Lighting and Environment Atmosphere
   */
  private createPlazaLighting(scene: THREE.Scene) {
    // 1. High-Precision Key Sunlight with 2048x2048 Shadows & NormalBias (eliminates shadow acne)
    this.sunLight = new THREE.DirectionalLight(0xfff1dc, 2.0);
    this.sunLight.position.set(45, 55, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.camera.left = -65;
    this.sunLight.shadow.camera.right = 65;
    this.sunLight.shadow.camera.top = 65;
    this.sunLight.shadow.camera.bottom = -65;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.04;
    scene.add(this.sunLight);

    // 2. Natural Sky / Ground Bounce Hemisphere Lighting (Softens black shadows)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.25);
    scene.add(hemiLight);

    // 3. Cool Cinematic Rim Light (Pops character silhouettes from background)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(-35, 30, -45);
    scene.add(rimLight);

    this.ambientLight = new THREE.AmbientLight(0x718096, 0.65);
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
    const cobblestonePBR = TextureGenerator.getParisCobblestoneTexture();
    const cobblestoneMat = new THREE.MeshStandardMaterial({
      map: cobblestonePBR.map,
      bumpMap: cobblestonePBR.bumpMap,
      bumpScale: 0.12,
      roughness: 0.72,
      metalness: 0.15,
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

    // 11. GTA Paris Boulevard Roadways & Curbs
    this.createGTARoadways(scene, 'PARIS');

    // 12. Parked GTA Sports Cars & Street Dressing
    this.createGTAStreetDressings(scene, 'PARIS');

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

    // 2 French CRS High-Speed Police Interceptor Cruisers
    this.createPoliceCruiser(scene, -11, 47, 0.22, 'CRS');
    this.createPoliceCruiser(scene, 11, 47, -0.22, 'CRS');

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

    const busLength = 10.8;
    const busWidth = 3.3;
    const busHeight = 3.4;

    // 1. Lower Chassis with undercarriage trim
    const chassisGeo = new THREE.BoxGeometry(busWidth - 0.2, 0.5, busLength);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.6 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.65;
    busGroup.add(chassis);

    // 2. French CRS Main Coach Body (Deep French Tactical Navy Blue Lacquer)
    const bodyGeo = new THREE.BoxGeometry(busWidth, busHeight - 0.6, busLength);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f2852, // Authentic French CRS Dark Blue
      roughness: 0.35,
      metalness: 0.4,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = (busHeight - 0.6) / 2 + 0.7;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    busGroup.add(bodyMesh);

    // 3. Aerodynamic Curved Roof
    const roofGeo = new THREE.CylinderGeometry(busWidth / 2, busWidth / 2, busLength - 0.2, 16, 1, false, 0, Math.PI);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x091c3d, roughness: 0.4, metalness: 0.3 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.x = Math.PI / 2;
    roof.rotation.y = -Math.PI / 2;
    roof.position.set(0, busHeight + 0.4, 0);
    roof.castShadow = true;
    busGroup.add(roof);

    // 4. Front Cab Slope & Ballistic Windshield with protective cage mesh
    const windshieldGeo = new THREE.PlaneGeometry(busWidth * 0.86, 1.4);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
    });
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 2.3, busLength / 2 + 0.02);
    busGroup.add(windshield);

    // Ballistic wire cage mesh over windshield
    const cageGeo = new THREE.BoxGeometry(busWidth * 0.88, 1.45, 0.08);
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.4, wireframe: true });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    cage.position.set(0, 2.3, busLength / 2 + 0.08);
    busGroup.add(cage);

    // 5. Heavy-Duty Steel Bull-Bar / Push Bumper
    const bullBarGeo = new THREE.BoxGeometry(busWidth + 0.3, 0.8, 0.4);
    const bullBarMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.3 });
    const bullBar = new THREE.Mesh(bullBarGeo, bullBarMat);
    bullBar.position.set(0, 0.9, busLength / 2 + 0.25);
    busGroup.add(bullBar);

    // 6. Glowing Xenon Headlights + Amber Turn Signals
    [-1.2, 1.2].forEach((hx) => {
      const headGeo = new THREE.BoxGeometry(0.5, 0.35, 0.1);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xf8fafc,
        emissiveIntensity: 1.0,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(hx, 1.35, busLength / 2 + 0.05);
      busGroup.add(head);

      const turnGeo = new THREE.BoxGeometry(0.18, 0.35, 0.1);
      const turnMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 });
      const turn = new THREE.Mesh(turnGeo, turnMat);
      turn.position.set(hx > 0 ? hx + 0.38 : hx - 0.38, 1.35, busLength / 2 + 0.05);
      busGroup.add(turn);
    });

    // 7. Reflective White Stripe with French CRS Markings
    const stripeGeo = new THREE.BoxGeometry(busWidth + 0.06, 0.48, busLength - 0.4);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 2.05, -0.1);
    busGroup.add(stripe);

    // French Tricolor Flag Cockade on Sides (Blue / White / Red)
    [-busWidth / 2 - 0.04, busWidth / 2 + 0.04].forEach((fx) => {
      const tricolorGeo = new THREE.BoxGeometry(0.04, 0.4, 0.9);
      const tricolorCanvas = document.createElement('canvas');
      tricolorCanvas.width = 90;
      tricolorCanvas.height = 40;
      const tctx = tricolorCanvas.getContext('2d');
      if (tctx) {
        tctx.fillStyle = '#002395';
        tctx.fillRect(0, 0, 30, 40);
        tctx.fillStyle = '#ffffff';
        tctx.fillRect(30, 0, 30, 40);
        tctx.fillStyle = '#ed2939';
        tctx.fillRect(60, 0, 30, 40);
      }
      const tTex = new THREE.CanvasTexture(tricolorCanvas);
      const tMat = new THREE.MeshStandardMaterial({ map: tTex });
      const tricolorMesh = new THREE.Mesh(tricolorGeo, tMat);
      tricolorMesh.position.set(fx, 2.05, 3.2);
      busGroup.add(tricolorMesh);
    });

    // 8. Barred Security Windows along sides
    const winGeo = new THREE.BoxGeometry(busWidth + 0.08, 1.15, busLength * 0.68);
    const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.95 });
    const windows = new THREE.Mesh(winGeo, winMat);
    windows.position.set(0, 2.75, -0.6);
    busGroup.add(windows);

    // 9. Realistic Multi-Spoke Wheels with Deep-Tread Tires
    const wheelOffsets = [
      { x: -busWidth / 2 - 0.12, z: 3.4 },
      { x: busWidth / 2 + 0.12, z: 3.4 },
      { x: -busWidth / 2 - 0.12, z: -3.4 },
      { x: busWidth / 2 + 0.12, z: -3.4 },
    ];
    wheelOffsets.forEach((w) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(w.x, 0.68, w.z);
      wheelGroup.rotation.z = Math.PI / 2;

      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.68, 0.48, 20),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
      );
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.48, 0.50, 16),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 })
      );
      wheelGroup.add(rim);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.52, 10),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.95 })
      );
      wheelGroup.add(hub);

      busGroup.add(wheelGroup);
    });

    // 10. Rear Escape Door (Hinged for Jailbreak Rescue)
    const doorHinge = new THREE.Group();
    doorHinge.position.set(busWidth / 2 - 0.15, 1.8, -busLength / 2 - 0.05);

    const doorGeo = new THREE.BoxGeometry(1.6, 2.4, 0.18);
    doorGeo.translate(-0.8, 0, 0); // pivot on edge
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // High-contrast Red emergency release door
      roughness: 0.3,
      metalness: 0.2,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.castShadow = true;
    doorHinge.add(doorMesh);
    busGroup.add(doorHinge);
    this.busDoors.set(busId, doorHinge);

    // 11. Rear LED Brake Lights
    [-1.25, 1.25].forEach((rx) => {
      const brake = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.55, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.85 })
      );
      brake.position.set(rx, 1.6, -busLength / 2 - 0.02);
      busGroup.add(brake);
    });

    // 12. Flashing French Blue Beacons (Gyrophare Bleu)
    const lightBarGeo = new THREE.BoxGeometry(1.6, 0.28, 0.38);
    const lightBarMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
    const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
    lightBar.position.set(0, busHeight + 0.82, 3.2);
    busGroup.add(lightBar);

    const blueLight1 = new THREE.PointLight(0x0066ff, 3.2, 16);
    blueLight1.position.set(-0.6, busHeight + 0.95, 3.2);
    busGroup.add(blueLight1);
    this.policeLights.push(blueLight1);

    const blueLight2 = new THREE.PointLight(0x0088ff, 3.2, 16);
    blueLight2.position.set(0.6, busHeight + 0.95, 3.2);
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

    // 1. Armored Chassis & Slanted Heavy Cab
    const cabGeo = new THREE.BoxGeometry(3.6, 3.4, 9.6);
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f, // Dark tactical navy
      metalness: 0.7,
      roughness: 0.35,
    });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.y = 2.4;
    cab.castShadow = true;
    cab.receiveShadow = true;
    truckGroup.add(cab);

    // Front Dozer Push-Plow (Armored CRS Crowd Dispersal Blade)
    const bladeGeo = new THREE.BoxGeometry(4.2, 1.4, 0.4);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.85, roughness: 0.3 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, 1.1, 5.1);
    blade.rotation.x = -Math.PI / 18;
    blade.castShadow = true;
    truckGroup.add(blade);

    // Ballistic Windshield with wire protection
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
    );
    windshield.position.set(0, 3.2, 4.82);
    truckGroup.add(windshield);

    // 2. High-Pressure Dual Water Cannon Turrets
    [-1.0, 1.0].forEach((tx) => {
      const turretBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.48, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.85 })
      );
      turretBase.position.set(tx, 4.3, 2.4);
      truckGroup.add(turretBase);

      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 1.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 })
      );
      barrel.rotation.x = Math.PI / 3.2;
      barrel.position.set(tx, 4.75, 2.6);
      barrel.castShadow = true;
      truckGroup.add(barrel);
    });

    // 3. Heavy-Duty Armored Wheels
    const truckWheelOffsets = [
      { x: -1.9, z: 2.8 },
      { x: 1.9, z: 2.8 },
      { x: -1.9, z: -2.8 },
      { x: 1.9, z: -2.8 },
    ];
    truckWheelOffsets.forEach((tw) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(tw.x, 0.75, tw.z);
      wGroup.rotation.z = Math.PI / 2;

      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.75, 0.55, 18),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
      );
      wGroup.add(tire);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 0.57, 14),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 })
      );
      wGroup.add(rim);

      truckGroup.add(wGroup);
    });

    // 4. Roof Emergency Blue Siren Light
    const siren = new THREE.PointLight(0x0088ff, 3.5, 18);
    siren.position.set(0, 4.8, 0);
    truckGroup.add(siren);
    this.policeLights.push(siren);

    scene.add(truckGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 2.4, z),
      new THREE.Vector3(3.8, 4.2, 10)
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
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 1.25);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(-35, 35, -45);
    scene.add(rimLight);

    this.ambientLight = new THREE.AmbientLight(0x718096, 0.7);
    scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffedd5, 1.9);
    this.sunLight.position.set(35, 60, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.04;

    const d = 65;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    scene.add(this.sunLight);
  }

  /**
   * GTA Vice City Style Boulevard Roadways, Curbs & Crosswalks
   */
  public createGTARoadways(scene: THREE.Scene, _map: 'DELHI' | 'PARIS') {
    const { map: roadTex, roughnessMap: roadRough } = TextureGenerator.getGTABoulevardRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughnessMap: roadRough,
      roughness: 0.75,
      metalness: 0.15,
    });

    // South Perimeter Main Boulevard (140m long, 16m wide)
    const southRoadGeo = new THREE.PlaneGeometry(140, 16);
    const southRoad = new THREE.Mesh(southRoadGeo, roadMat);
    southRoad.rotation.x = -Math.PI / 2;
    southRoad.position.set(0, 0.03, 64);
    southRoad.receiveShadow = true;
    scene.add(southRoad);

    // Raised Concrete Curbs along the roadway edge
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const curbGeo = new THREE.BoxGeometry(140, 0.22, 0.4);
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(0, 0.11, 55.8);
    curb.receiveShadow = true;
    curb.castShadow = true;
    scene.add(curb);

    // Pedestrian Zebra Crosswalks at intersections
    const crosswalkTex = TextureGenerator.getZebraCrosswalkTexture();
    const crosswalkMat = new THREE.MeshStandardMaterial({
      map: crosswalkTex,
      roughness: 0.8,
    });
    [-32, 32].forEach((cx) => {
      const crossGeo = new THREE.PlaneGeometry(8, 16);
      const cross = new THREE.Mesh(crossGeo, crosswalkMat);
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(cx, 0.035, 64);
      cross.receiveShadow = true;
      scene.add(cross);
    });
  }

  /**
   * Iconic GTA Police Patrol Cruiser (VCPD / Delhi Police Squad Sedan)
   */
  public createPoliceCruiser(
    scene: THREE.Scene,
    x: number,
    z: number,
    rot: number,
    model: 'DELHI' | 'CRS' = 'DELHI'
  ) {
    const carGroup = new THREE.Group();
    carGroup.position.set(x, 0, z);
    carGroup.rotation.y = rot;

    const length = 5.2;
    const width = 2.15;
    const height = 1.55;

    const bodyColor = model === 'DELHI' ? 0x0f172a : 0x0f2852; // Tactical Black / CRS Navy
    const doorColor = 0xf8fafc; // Contrasting white doors & roof

    const mainMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.5,
      roughness: 0.35,
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: doorColor,
      metalness: 0.3,
      roughness: 0.4,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.05,
    });

    // 1. Lower Chassis
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.1, 0.35, length),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.7 })
    );
    chassis.position.y = 0.45;
    carGroup.add(chassis);

    // 2. Fenders & Lower Body
    const lowerBody = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.45, length - 0.1),
      mainMat
    );
    lowerBody.position.y = 0.65;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    carGroup.add(lowerBody);

    // 3. Front Sloped Hood
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.05, 0.28, 1.6),
      mainMat
    );
    hood.position.set(0, 0.85, 1.45);
    hood.rotation.x = 0.05;
    hood.castShadow = true;
    carGroup.add(hood);

    // 4. White Doors & Side Contrasts
    const doors = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.02, 0.55, 2.1),
      whiteMat
    );
    doors.position.set(0, 0.78, -0.2);
    carGroup.add(doors);

    // Police Star / Badge on front doors
    const starGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 5);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
    [-width / 2 - 0.02, width / 2 + 0.02].forEach((sx) => {
      const star = new THREE.Mesh(starGeo, starMat);
      star.rotation.z = Math.PI / 2;
      star.position.set(sx, 0.85, -0.2);
      carGroup.add(star);
    });

    // 5. Rear Trunk
    const trunk = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.05, 0.28, 1.3),
      mainMat
    );
    trunk.position.set(0, 0.84, -1.8);
    trunk.castShadow = true;
    carGroup.add(trunk);

    // 6. Cabin Greenhouse with Raked Windshield & Glass
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.25, 0.52, 2.05),
      glassMat
    );
    cabin.position.set(0, 1.25, -0.3);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // White Roof Plate
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.28, 0.06, 1.6),
      whiteMat
    );
    roof.position.set(0, 1.52, -0.3);
    carGroup.add(roof);

    // 7. Heavy-Duty Front Push Bumper / Bull-Bar
    const bullBar = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.1, 0.55, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.25 })
    );
    bullBar.position.set(0, 0.62, length / 2 + 0.1);
    carGroup.add(bullBar);

    // Dual Bull-Bar Halogen Spotlights
    [-0.55, 0.55].forEach((bx) => {
      const spot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
      );
      spot.rotation.x = Math.PI / 2;
      spot.position.set(bx, 0.82, length / 2 + 0.15);
      carGroup.add(spot);
    });

    // 8. Glowing Xenon Headlights & Corner Lights
    [-0.85, 0.85].forEach((hx) => {
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.22, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xf8fafc, emissiveIntensity: 1.2 })
      );
      head.position.set(hx, 0.72, length / 2 + 0.02);
      carGroup.add(head);
    });

    // Rear Red LED Tail-lights
    [-0.85, 0.85].forEach((rx) => {
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.18, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.0 })
      );
      tail.position.set(rx, 0.74, -length / 2 - 0.02);
      carGroup.add(tail);
    });

    // Dual Chrome Exhaust Pipes
    [-0.6, 0.6].forEach((ex) => {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 })
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(ex, 0.32, -length / 2 - 0.1);
      carGroup.add(pipe);
    });

    // 9. Realistic Wheels with Deep Rubber Tires & Chrome Hubcaps
    const wheelOffsets = [
      { x: -width / 2 - 0.05, z: 1.55 },
      { x: width / 2 + 0.05, z: 1.55 },
      { x: -width / 2 - 0.05, z: -1.55 },
      { x: width / 2 + 0.05, z: -1.55 },
    ];
    wheelOffsets.forEach((w) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(w.x, 0.42, w.z);
      wGroup.rotation.z = Math.PI / 2;

      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.32, 18),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
      );
      wGroup.add(tire);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.30, 0.30, 0.34, 14),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.15 })
      );
      wGroup.add(rim);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.36, 10),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 })
      );
      wGroup.add(hub);

      carGroup.add(wGroup);
    });

    // 10. Aerodynamic Roof Siren Lightbar (Alternating Red & Blue)
    const barFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.12, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85 })
    );
    barFrame.position.set(0, 1.58, -0.2);
    carGroup.add(barFrame);

    // Left Red Strobe Pod
    const redPod = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.14, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.2 })
    );
    redPod.position.set(-0.4, 1.68, -0.2);
    carGroup.add(redPod);

    const redLight = new THREE.PointLight(0xef4444, 3.2, 14);
    redLight.position.set(-0.4, 1.75, -0.2);
    carGroup.add(redLight);
    this.policeLights.push(redLight);

    // Right Blue Strobe Pod
    const bluePod = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.14, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 1.2 })
    );
    bluePod.position.set(0.4, 1.68, -0.2);
    carGroup.add(bluePod);

    const blueLight = new THREE.PointLight(0x0066ff, 3.2, 14);
    blueLight.position.set(0.4, 1.75, -0.2);
    carGroup.add(blueLight);
    this.policeLights.push(blueLight);

    scene.add(carGroup);

    // Collider so players & AI take cover behind squad car
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width, height, length)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Iconic GTA Retro Wedge Sports Car (Cheetah / Infernus style)
   */
  public createSportsCar(scene: THREE.Scene, x: number, z: number, rot: number, color: number) {
    const carGroup = new THREE.Group();
    carGroup.position.set(x, 0, z);
    carGroup.rotation.y = rot;

    const length = 4.6;
    const width = 2.05;
    const height = 1.18;

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.18,
      metalness: 0.65,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.05,
      metalness: 0.95,
    });

    // 1. Sleek Aerodynamic Wedge Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.42, length),
      bodyMat
    );
    body.position.y = 0.52;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    // 2. Slanted Low Wedge Nose
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.1, 0.22, 1.4),
      bodyMat
    );
    nose.position.set(0, 0.62, 1.5);
    nose.rotation.x = 0.12;
    carGroup.add(nose);

    // Pop-up headlights outlines
    [-0.65, 0.65].forEach((px) => {
      const pop = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.08, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 })
      );
      pop.position.set(px, 0.68, 1.4);
      carGroup.add(pop);
    });

    // 3. Raked Low-Profile Windshield & Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.3, 0.45, 1.8),
      glassMat
    );
    cabin.position.set(0, 0.92, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // 4. Rear Engine Decklid & Raised Aerodynamic Spoiler Wing
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.1, 0.22, 1.4),
      bodyMat
    );
    deck.position.set(0, 0.64, -1.5);
    carGroup.add(deck);

    // Elevated Rear Spoiler Wing
    const wingGeo = new THREE.BoxGeometry(width + 0.15, 0.08, 0.45);
    const wing = new THREE.Mesh(wingGeo, bodyMat);
    wing.position.set(0, 1.15, -length / 2 + 0.2);
    wing.castShadow = true;
    carGroup.add(wing);

    [-width / 2 + 0.2, width / 2 - 0.2].forEach((sx) => {
      const strut = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.45, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 })
      );
      strut.position.set(sx, 0.95, -length / 2 + 0.2);
      carGroup.add(strut);
    });

    // 5. Dual Sports Twin-Exhaust
    [-0.5, 0.5].forEach((ex) => {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 })
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(ex, 0.28, -length / 2 - 0.05);
      carGroup.add(pipe);
    });

    // 6. Wide Sports Wheels with 5-Spoke Star Alloy Mags
    const wheelOffsets = [
      { x: -width / 2 - 0.06, z: 1.35 },
      { x: width / 2 + 0.06, z: 1.35 },
      { x: -width / 2 - 0.08, z: -1.35 },
      { x: width / 2 + 0.08, z: -1.35 },
    ];
    wheelOffsets.forEach((w) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(w.x, 0.38, w.z);
      wGroup.rotation.z = Math.PI / 2;

      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.34, 20),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
      );
      wGroup.add(tire);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.36, 5),
        new THREE.MeshStandardMaterial({ color: 0xf3f4f6, metalness: 0.95, roughness: 0.1 })
      );
      wGroup.add(rim);

      carGroup.add(wGroup);
    });

    scene.add(carGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width, height, length)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Tropical Palm Tree (Signature Vice City Palm)
   */
  public createPalmTree(scene: THREE.Scene, x: number, z: number, scale = 1.0) {
    const palmGroup = new THREE.Group();
    palmGroup.position.set(x, 0, z);
    palmGroup.scale.set(scale, scale, scale);

    const barkTex = TextureGenerator.getPalmBarkTexture();
    const frondTex = TextureGenerator.getPalmFrondTexture();

    const barkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.85,
    });

    const frondMat = new THREE.MeshStandardMaterial({
      map: frondTex,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.45,
    });

    // 1. Natural Curved Segmented Trunk
    const segments = 5;
    const segHeight = 2.2;
    let currX = 0;
    let currY = 0;
    let currZ = 0;
    const curveDir = (Math.random() - 0.5) * 0.4;

    for (let i = 0; i < segments; i++) {
      const rBot = 0.45 - i * 0.05;
      const rTop = 0.40 - i * 0.05;
      const segGeo = new THREE.CylinderGeometry(rTop, rBot, segHeight, 10);
      const seg = new THREE.Mesh(segGeo, barkMat);
      seg.position.set(currX, currY + segHeight / 2, currZ);
      seg.rotation.z = curveDir * (i * 0.15);
      seg.castShadow = true;
      palmGroup.add(seg);

      currX += Math.sin(curveDir * (i * 0.15)) * segHeight;
      currY += segHeight;
    }

    // 2. Crown of Arching Tropical Palm Fronds
    const frondCount = 10;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2;
      const frondGeo = new THREE.PlaneGeometry(2.4, 5.5);
      frondGeo.translate(0, 2.75, 0); // pivot at base
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(currX, currY, currZ);
      frond.rotation.y = angle;
      frond.rotation.x = Math.PI / 3.4; // arch outward
      frond.rotation.z = (Math.random() - 0.5) * 0.2;
      frond.castShadow = true;
      palmGroup.add(frond);
    }

    // 3. Cluster of Coconuts under the crown
    const cocoMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    for (let c = 0; c < 4; c++) {
      const cAngle = (c / 4) * Math.PI * 2;
      const coco = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), cocoMat);
      coco.position.set(
        currX + Math.cos(cAngle) * 0.4,
        currY - 0.35,
        currZ + Math.sin(cAngle) * 0.4
      );
      palmGroup.add(coco);
    }

    scene.add(palmGroup);

    // Trunk collider
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 5, z),
      new THREE.Vector3(1.2, 10, 1.2)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Spawns Tropical Palm Groves across lawns and boulevard curbs
   */
  public createPalmGroves(scene: THREE.Scene, _map: 'DELHI' | 'PARIS') {
    const palmPositions = [
      { x: -55, z: 32, s: 1.1 },
      { x: -55, z: -20, s: 1.0 },
      { x: 55, z: 32, s: 1.1 },
      { x: 55, z: -20, s: 1.0 },
      { x: -38, z: 52, s: 0.95 },
      { x: 38, z: 52, s: 0.95 },
      { x: -48, z: -48, s: 1.05 },
      { x: 48, z: -48, s: 1.05 },
    ];
    palmPositions.forEach((p) => {
      this.createPalmTree(scene, p.x, p.z, p.s);
    });
  }

  /**
   * Cast-Metal Traffic Light with Glowing Red, Amber & Green Signal Lenses
   */
  public createTrafficLight(scene: THREE.Scene, x: number, z: number, rot = 0) {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    tGroup.rotation.y = rot;

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.3 });

    // Vertical Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 6.5, 8), metalMat);
    mast.position.y = 3.25;
    mast.castShadow = true;
    tGroup.add(mast);

    // Cantilever Arm over road
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 4.2), metalMat);
    arm.position.set(0, 6.2, 2.1);
    tGroup.add(arm);

    // Signal Head Box
    const boxGeo = new THREE.BoxGeometry(0.45, 1.35, 0.4);
    const boxMesh = new THREE.Mesh(boxGeo, metalMat);
    boxMesh.position.set(0, 5.5, 3.8);
    tGroup.add(boxMesh);

    // 3 Signal Lenses
    const lensColors = [
      { c: 0xef4444, y: 5.9, active: true },  // Red (Active glow)
      { c: 0xf59e0b, y: 5.5, active: false }, // Amber
      { c: 0x10b981, y: 5.1, active: false }, // Green
    ];

    lensColors.forEach((l) => {
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14),
        new THREE.MeshStandardMaterial({
          color: l.c,
          emissive: l.c,
          emissiveIntensity: l.active ? 1.4 : 0.2,
        })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, l.y, 4.02);
      tGroup.add(lens);
    });

    scene.add(tGroup);

    const colBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 3.25, z),
      new THREE.Vector3(1, 6.5, 1)
    );
    this.colliders.push({ box: colBox, type: 'WALL' });
  }

  /**
   * Cast-Metal Street Fire Hydrant
   */
  public createFireHydrant(scene: THREE.Scene, x: number, z: number) {
    const hGroup = new THREE.Group();
    hGroup.position.set(x, 0, z);

    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.4 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.75, 12), redMat);
    barrel.position.y = 0.38;
    barrel.castShadow = true;
    hGroup.add(barrel);

    // Top Dome & Operating Nut
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
    dome.position.y = 0.75;
    hGroup.add(dome);

    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 5), metalMat);
    nut.position.y = 0.95;
    hGroup.add(nut);

    // Side Nozzle Caps
    [-0.22, 0.22].forEach((nx) => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8), metalMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(nx, 0.48, 0);
      hGroup.add(cap);
    });

    scene.add(hGroup);
  }

  /**
   * Spawns parked sports cars, street furniture, and neon storefront signs
   */
  public createGTAStreetDressings(scene: THREE.Scene, map: 'DELHI' | 'PARIS') {
    if (map === 'DELHI') {
      // Parked GTA Wedge Sports Cars on Boulevard Curbs
      this.createSportsCar(scene, -46, 56, Math.PI / 2, 0xec4899); // Vice City Hot Magenta
      this.createSportsCar(scene, 46, 56, -Math.PI / 2, 0x06b6d4); // Miami Electric Teal

      // Traffic Lights at Crosswalks
      this.createTrafficLight(scene, -36, 56, 0);
      this.createTrafficLight(scene, 36, 56, Math.PI);

      // Fire Hydrants along Curbs
      this.createFireHydrant(scene, -40, 55);
      this.createFireHydrant(scene, 40, 55);

      // Glowing Neon Signs on buildings
      this.createNeonSign(scene, 0, 7.5, -67, 'OCEAN DRIVE RALLY', '#ec4899', 'VICE CITY TOUR');
      this.createNeonSign(scene, -48, 7.5, -67, 'DELHI 24/7 CLUB', '#38bdf8', 'ALL NIGHT ACCESS');
      this.createNeonSign(scene, 48, 7.5, -67, 'SYNTHWAVE STAGE', '#facc15', 'LIVE MUSIC');
    } else {
      // PARIS MAP: Parked Supercars & Parisian Boulevard Dressing
      this.createSportsCar(scene, -48, 48, Math.PI / 2.8, 0xfacc15); // Canary Yellow
      this.createSportsCar(scene, 48, 48, -Math.PI / 2.8, 0xef4444); // Crimson Red

      // Traffic Lights
      this.createTrafficLight(scene, -32, 45, 0);
      this.createTrafficLight(scene, 32, 45, Math.PI);

      // Fire Hydrant
      this.createFireHydrant(scene, -26, 44);
      this.createFireHydrant(scene, 26, 44);

      // Glowing Paris Neon Signs
      this.createNeonSign(scene, 0, 8.5, -67, 'LE BISTROT DE LA BASTILLE', '#38bdf8', 'GASTRONOMIE & CAFÉ');
      this.createNeonSign(scene, -48, 8.5, -67, 'CLUB D\'OR BASTILLE', '#ec4899', 'DISCOTHÈQUE');
      this.createNeonSign(scene, 48, 8.5, -67, 'PROTEST-N-CHASE PARIS', '#facc15', 'WORLD TOUR 2026');
    }
  }

  /**
   * Glowing Neon Sign with bloom trigger
   */
  public createNeonSign(
    scene: THREE.Scene,
    x: number,
    y: number,
    z: number,
    title: string,
    color: string,
    subTitle?: string
  ) {
    const tex = TextureGenerator.getNeonSignTexture(title, color, subTitle);
    const signGeo = new THREE.PlaneGeometry(12, 3.8);
    const signMat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.3,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(x, y, z + 0.15);
    scene.add(sign);
  }
}
