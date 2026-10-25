import * as THREE from 'three';
import { TimeOfDay } from '../types/game';
import { TextureGenerator } from './TextureGenerator';

export interface Collider {
  box: THREE.Box3;
  type: 'WALL' | 'BARRICADE' | 'BUS' | 'RAMP';
  interactiveId?: string;
}

export interface AnimatedFlag {
  mesh: THREE.Mesh;
  initialPositions: Float32Array;
  speed: number;
  frequency: number;
  amplitude: number;
}

/**
 * MapBuilder: Constructs highly detailed, photorealistic 3D heritage maps.
 * - Chapter 1: New Delhi (Authentic Jantar Mantar Observatory, Sansad Marg, and Central Vista/Parliament District)
 * - Chapter 2: Paris (Place de la Bastille, Colonne de Juillet, Haussmannian Boulevards, and CRS Encampment)
 */
export class MapBuilder {
  public colliders: Collider[] = [];
  public busPositions: { x: number; y: number; z: number; id: string }[] = [];
  public busDoors: Map<string, THREE.Group> = new Map();
  public stagePosition: THREE.Vector3 = new THREE.Vector3(0, 0, 35);
  public animatedFlags: AnimatedFlag[] = [];

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
   * Registers a subdivided flag mesh for real-time vertex wind flutter
   */
  public addAnimatedFlag(mesh: THREE.Mesh, speed = 4.2, frequency = 2.0, amplitude = 0.28) {
    const geo = mesh.geometry;
    if (!geo.attributes.position) return;
    const initialPositions = new Float32Array(geo.attributes.position.array);
    this.animatedFlags.push({
      mesh,
      initialPositions,
      speed,
      frequency,
      amplitude,
    });
  }

  /**
   * Zero-GC real-time vertex displacement for billowing flags
   */
  public updateFlagAnimations(time: number) {
    for (let f = 0; f < this.animatedFlags.length; f++) {
      const flag = this.animatedFlags[f];
      const geo = flag.mesh.geometry;
      const pos = geo.attributes.position;
      const init = flag.initialPositions;
      const count = pos.count;

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const x = init[ix];
        const y = init[ix + 1];
        const dist = Math.abs(x);
        const wave = Math.sin(time * flag.speed + x * flag.frequency + y * 0.4) * dist * flag.amplitude;
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
    }
  }

  /**
   * Builds the entire 3D Jantar Mantar heritage observatory, Sansad Marg, and Central Vista
   */
  public buildJantarMantar(scene: THREE.Scene): { colliders: Collider[]; busPositions: any[] } {
    this.colliders = [];
    this.busPositions = [];
    this.busDoors.clear();
    this.policeLights = [];
    this.animatedFlags = [];

    // 1. High-Resolution Authentic PBR Textures & Materials
    const { map: pavementTex, bumpMap: pavementBump } = TextureGenerator.getSandstoneFlagstoneTexture();
    const pavementMat = new THREE.MeshStandardMaterial({
      map: pavementTex,
      bumpMap: pavementBump,
      bumpScale: 0.08,
      roughness: 0.75,
      metalness: 0.05,
    });

    const { map: redSandstoneTex, bumpMap: redSandstoneBump } = TextureGenerator.getIndianRedSandstoneTexture();
    const sandstoneRedMat = new THREE.MeshStandardMaterial({
      map: redSandstoneTex,
      bumpMap: redSandstoneBump,
      bumpScale: 0.12,
      roughness: 0.78,
      metalness: 0.08,
    });

    const { map: buffTex, bumpMap: buffBump } = TextureGenerator.getDholpurBuffSandstoneTexture();
    const dholpurBuffMat = new THREE.MeshStandardMaterial({
      map: buffTex,
      bumpMap: buffBump,
      bumpScale: 0.08,
      roughness: 0.72,
      metalness: 0.05,
    });

    const { map: marbleTex, bumpMap: marbleBump } = TextureGenerator.getMakranaMarbleTexture();
    const marbleWhiteMat = new THREE.MeshStandardMaterial({
      map: marbleTex,
      bumpMap: marbleBump,
      bumpScale: 0.04,
      roughness: 0.32,
      metalness: 0.1,
    });

    const { map: lawnTex, bumpMap: lawnBump } = TextureGenerator.getMughalGardenLawnTexture();
    const lawnMat = new THREE.MeshStandardMaterial({
      map: lawnTex,
      bumpMap: lawnBump,
      bumpScale: 0.12,
      roughness: 0.88,
    });

    // 2. Ground Plaza Paved in Dholpur Stone
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const ground = new THREE.Mesh(groundGeo, pavementMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 3. Symmetrical Mughal Charbagh Manicured Gardens & Flowerbeds
    this.createMughalCharbaghGardens(scene, lawnMat, sandstoneRedMat);

    // 4. Heritage Enclosure Walls with Western Gateway to Sansad Marg
    this.createJantarMantarEnclosure(scene, sandstoneRedMat);

    // 5. The Colossal Samrat Yantra (24m High Sundial with Stairs & Apex Chhatri)
    this.createSamratYantra(scene, sandstoneRedMat, marbleWhiteMat);

    // 6. The Signature Mishra Yantra (Heart-shaped composite astronomical instrument unique to Delhi)
    this.createMishraYantra(scene, sandstoneRedMat, marbleWhiteMat);

    // 7. Cylindrical Ram Yantra (Twin altitude-azimuth observatories)
    this.createRamYantra(scene, sandstoneRedMat, marbleWhiteMat, -28, 20, 8.5);
    this.createRamYantra(scene, sandstoneRedMat, marbleWhiteMat, 28, 20, 8.5);

    // 8. Jai Prakash Yantra (Twin sunken hemispherical marble calibration bowls)
    this.createJaiPrakashYantra(scene, sandstoneRedMat, marbleWhiteMat, 22, -26);

    // 9. Digamsa and Shasthansa Auxiliary Yantras
    this.createDigamsaAndShasthansa(scene, sandstoneRedMat, marbleWhiteMat);

    // 10. Samvidhan Sadan (The Historic Circular Parliament House with 72 Colonnade, Dome & Indian Flag)
    this.createSamvidhanSadan(scene, dholpurBuffMat, sandstoneRedMat);

    // 11. Sansad Bhavan (The Modern Triangular New Parliament House with Ashoka Lion Capital)
    this.createSansadBhavan(scene, dholpurBuffMat, sandstoneRedMat);

    // 12. Raisina Hill Secretariats (North & South Blocks) & India Gate Triumphal Arch in distant vista
    this.createRaisinaSecretariat(scene, sandstoneRedMat, dholpurBuffMat);
    this.createIndiaGate(scene, dholpurBuffMat);

    // 13. Sansad Marg (Parliament Street) 6-Lane Ceremonial Avenue, ASI Monument Plaque & Road Signs
    this.createSansadMargBoulevard(scene);

    // 14. Native Lutyens' Delhi Shade Trees (Neem, Jamun, Ashoka, Banyan)
    this.createNativeDelhiTrees(scene);

    // 15. Authentic Delhi Police & Government Vehicles (Vajra Riot Vehicle, Patrol SUVs, VIP Ambassador Sedans)
    this.createDelhiPoliceVehicles(scene);

    // 16. Police Camp, Yellow Steel Barricades & Security Checkpoint
    this.createPoliceCamp(scene);

    // 17. Peaceful Rally Stage & Indian Unity Banners
    this.createProtestStage(scene);

    // 18. Overhead Media Drone with Dynamic Spotlight
    this.createMediaDrone(scene);

    // 19. Protest Placards in Ground
    this.createPlantedPlacards(scene);

    // 20. Plaza Streetlights and Atmospheric Spotlights
    this.createPlazaLighting(scene);

    return {
      colliders: this.colliders,
      busPositions: this.busPositions,
    };
  }

  /**
   * Symmetrical Mughal Charbagh Gardens with Manicured Lawns, Red Stone Curbs & Flowerbeds
   */
  private createMughalCharbaghGardens(
    scene: THREE.Scene,
    lawnMat: THREE.Material,
    stoneMat: THREE.Material
  ) {
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x992d22, roughness: 0.8 });
    const flowerRed = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.85 });
    const flowerGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.85 });

    const lawnZones = [
      { x: -36, z: -18, w: 26, d: 22 },
      { x: 36, z: -18, w: 26, d: 22 },
      { x: -36, z: 20, w: 26, d: 22 },
      { x: 36, z: 20, w: 26, d: 22 },
    ];

    lawnZones.forEach((z) => {
      // 1. Manicured Grass Lawn
      const lawnGeo = new THREE.BoxGeometry(z.w, 0.18, z.d);
      const lawnMesh = new THREE.Mesh(lawnGeo, lawnMat);
      lawnMesh.position.set(z.x, 0.09, z.z);
      lawnMesh.receiveShadow = true;
      scene.add(lawnMesh);

      // 2. Red Sandstone Raised Curbs
      const curbGeoH = new THREE.BoxGeometry(z.w + 0.6, 0.25, 0.4);
      const curbGeoV = new THREE.BoxGeometry(0.4, 0.25, z.d + 0.6);

      [-z.d / 2, z.d / 2].forEach((offsetZ) => {
        const curbMesh = new THREE.Mesh(curbGeoH, curbMat);
        curbMesh.position.set(z.x, 0.125, z.z + offsetZ);
        curbMesh.receiveShadow = true;
        scene.add(curbMesh);
      });

      [-z.w / 2, z.w / 2].forEach((offsetX) => {
        const curbMesh = new THREE.Mesh(curbGeoV, curbMat);
        curbMesh.position.set(z.x + offsetX, 0.125, z.z);
        curbMesh.receiveShadow = true;
        scene.add(curbMesh);
      });

      // 3. Geometric Flowerbeds (Marigold & Bougainvillea)
      for (let f = -z.w / 2 + 3; f <= z.w / 2 - 3; f += 4.5) {
        const fMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.55, 8, 6),
          Math.abs(f) % 2 === 0 ? flowerGold : flowerRed
        );
        fMesh.position.set(z.x + f, 0.35, z.z - z.d / 2 + 1.8);
        fMesh.castShadow = true;
        scene.add(fMesh);
      }
    });

    // Authentic Stone Garden Benches
    const benchPositions = [
      { x: -20, z: -4, rot: Math.PI / 2 },
      { x: 20, z: -4, rot: -Math.PI / 2 },
      { x: -20, z: 8, rot: Math.PI / 2 },
      { x: 20, z: 8, rot: -Math.PI / 2 },
    ];
    benchPositions.forEach((b) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);
      bGroup.rotation.y = b.rot;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.7), stoneMat);
      seat.position.y = 0.55;
      seat.castShadow = true;
      bGroup.add(seat);

      [-0.9, 0.9].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.55, 0.6), stoneMat);
        leg.position.set(lx, 0.275, 0);
        bGroup.add(leg);
      });

      scene.add(bGroup);
    });
  }

  /**
   * Authentic Heritage Boundary Walls with Open View Gateway to Sansad Marg
   */
  private createJantarMantarEnclosure(scene: THREE.Scene, sandstoneMat: THREE.Material) {
    const wallH = 4.8;
    const wallThick = 2.0;

    // North, East, South solid walls
    const solidWalls = [
      { x: 0, z: -75, w: 150, d: wallThick },
      { x: 0, z: 75, w: 150, d: wallThick },
      { x: 75, z: 0, w: wallThick, d: 150 },
    ];

    solidWalls.forEach((w) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, wallH, w.d), sandstoneMat);
      mesh.position.set(w.x, wallH / 2, w.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Decorative Sandstone Wall Cornice
      const cornice = new THREE.Mesh(
        new THREE.BoxGeometry(w.w + 0.4, 0.4, w.d + 0.4),
        sandstoneMat
      );
      cornice.position.set(w.x, wallH + 0.2, w.z);
      scene.add(cornice);

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push({ box, type: 'WALL' });
    });

    // West Boundary Facing Sansad Marg:
    // Has open heritage colonial railings and central grand arched gateway at (x: -54, z: 0)
    // so players inside Jantar Mantar can clearly view the Parliament District!
    const westPillars = [
      { x: -54, z: -40, w: 2.2, d: 2.2 },
      { x: -54, z: -20, w: 2.2, d: 2.2 },
      { x: -54, z: -8, w: 2.6, d: 2.6 },  // Gatepost North
      { x: -54, z: 8, w: 2.6, d: 2.6 },   // Gatepost South
      { x: -54, z: 20, w: 2.2, d: 2.2 },
      { x: -54, z: 40, w: 2.2, d: 2.2 },
    ];

    westPillars.forEach((p) => {
      const pMesh = new THREE.Mesh(new THREE.BoxGeometry(p.w, wallH + 1.2, p.d), sandstoneMat);
      pMesh.position.set(p.x, (wallH + 1.2) / 2, p.z);
      pMesh.castShadow = true;
      scene.add(pMesh);

      // Chhatri pinnacle on gateposts
      if (Math.abs(p.z) === 8) {
        const cap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 8), sandstoneMat);
        cap.position.set(p.x, wallH + 2.0, p.z);
        scene.add(cap);
      }

      const box = new THREE.Box3().setFromObject(pMesh);
      this.colliders.push({ box, type: 'WALL' });
    });

    // Open Decorative Wrought Iron Railings between pillars
    const railingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const railingSpans = [
      { z: -55, d: 30 },
      { z: -30, d: 18 },
      { z: -14, d: 10 },
      { z: 14, d: 10 },
      { z: 30, d: 18 },
      { z: 55, d: 30 },
    ];
    railingSpans.forEach((r) => {
      const railMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH - 0.5, r.d), railingMat);
      railMesh.position.set(-54, (wallH - 0.5) / 2 + 0.3, r.z);
      railMesh.castShadow = true;
      scene.add(railMesh);

      const rBox = new THREE.Box3().setFromObject(railMesh);
      this.colliders.push({ box: rBox, type: 'WALL' });
    });

    // Grand Heritage Entrance Arch connecting the gateposts at (x: -54, z: 0)
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 18), sandstoneMat);
    archBeam.position.set(-54, wallH + 0.8, 0);
    archBeam.castShadow = true;
    scene.add(archBeam);
  }

  /**
   * The Colossal Samrat Yantra (Supreme Instrument)
   * 24m High Colossal Triangular Sundial with Central Stairs, Octagonal Apex Chhatri,
   * Sweeping Makrana Marble Quadrants with Celestial Markings & Flying Buttresses
   */
  private createSamratYantra(
    scene: THREE.Scene,
    sandstoneMat: THREE.Material,
    marbleMat: THREE.Material
  ) {
    const samratGroup = new THREE.Group();
    samratGroup.position.set(0, 0, -2);

    const length = 32;
    const height = 22;
    const width = 4.4;

    // 1. Triangular Gnomon
    const shape = new THREE.Shape();
    shape.moveTo(-length / 2, 0);
    shape.lineTo(length / 2, 0);
    shape.lineTo(-length / 2, height);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.25,
      bevelSize: 0.25,
      bevelSegments: 2,
    };

    const gnomonGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    gnomonGeo.center();
    const gnomonMesh = new THREE.Mesh(gnomonGeo, sandstoneMat);
    gnomonMesh.position.set(0, height / 2, 0);
    gnomonMesh.rotation.y = Math.PI / 2; // North-South alignment
    gnomonMesh.castShadow = true;
    gnomonMesh.receiveShadow = true;
    samratGroup.add(gnomonMesh);

    // 2. Central Flight of Stairs to Apex
    const stepCount = 36;
    const hypLen = Math.hypot(length, height);
    const angle = Math.atan2(height, length);
    const stairGeo = new THREE.BoxGeometry(1.4, 0.4, hypLen);
    const stairMesh = new THREE.Mesh(stairGeo, marbleMat);
    stairMesh.position.set(0, height / 2 + 0.1, 0);
    stairMesh.rotation.x = angle;
    samratGroup.add(stairMesh);

    // 3. Polished Brass Handrails along both sides of hypotenuse
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 });
    [-0.8, 0.8].forEach((rx) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, hypLen, 8), brassMat);
      rail.position.set(rx, height / 2 + 0.75, 0);
      rail.rotation.x = angle;
      samratGroup.add(rail);
    });

    // 4. Apex Observation Chhatri (Octagonal domed pavilion at the top)
    const chhatriGroup = new THREE.Group();
    chhatriGroup.position.set(0, height, length / 2 - 1.5);

    // Platform
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.6, 8), sandstoneMat);
    chhatriGroup.add(plat);

    // 8 Pillars
    for (let p = 0; p < 8; p++) {
      const pAngle = (p / 8) * Math.PI * 2;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.8, 8), sandstoneMat);
      pil.position.set(Math.cos(pAngle) * 1.8, 1.4, Math.sin(pAngle) * 1.8);
      chhatriGroup.add(pil);
    }

    // Dome & Golden Pinnacle
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), sandstoneMat);
    dome.position.y = 2.8;
    chhatriGroup.add(dome);

    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 8), brassMat);
    spire.position.y = 4.9;
    chhatriGroup.add(spire);

    samratGroup.add(chhatriGroup);

    // 5. Sweeping East and West Quadrant Curved Wings (with Makrana marble scales)
    [-1, 1].forEach((side) => {
      const quadGroup = new THREE.Group();
      quadGroup.position.set(side * 14, 0, 0);

      // Curved quadrant arc wall
      const arcGeo = new THREE.CylinderGeometry(15, 15, 3.2, 32, 1, true, 0, Math.PI / 2.2);
      const arcMesh = new THREE.Mesh(arcGeo, sandstoneMat);
      arcMesh.rotation.z = Math.PI / 2;
      arcMesh.rotation.y = side === 1 ? -Math.PI / 8 : Math.PI + Math.PI / 8;
      arcMesh.position.y = 1.6;
      arcMesh.castShadow = true;
      arcMesh.receiveShadow = true;
      quadGroup.add(arcMesh);

      // Inlaid Makrana Marble Calibration Scale
      const scaleGeo = new THREE.CylinderGeometry(15.08, 15.08, 0.8, 32, 1, true, 0, Math.PI / 2.2);
      const scaleMesh = new THREE.Mesh(scaleGeo, marbleMat);
      scaleMesh.rotation.z = Math.PI / 2;
      scaleMesh.rotation.y = side === 1 ? -Math.PI / 8 : Math.PI + Math.PI / 8;
      scaleMesh.position.y = 2.4;
      quadGroup.add(scaleMesh);

      // Flying Buttress Supports
      for (let b = 0; b < 3; b++) {
        const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.5, 4.2), sandstoneMat);
        buttress.position.set(0, 2.75, (b - 1) * 6);
        buttress.castShadow = true;
        quadGroup.add(buttress);
      }

      samratGroup.add(quadGroup);

      const qBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(side * (width / 2 + 10.5), 6.5, -2),
        new THREE.Vector3(16, 13, 22)
      );
      this.colliders.push({ box: qBox, type: 'WALL' });
    });

    scene.add(samratGroup);

    const colBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, height / 2, -2),
      new THREE.Vector3(width + 0.4, height, length)
    );
    this.colliders.push({ box: colBox, type: 'WALL' });
  }

  /**
   * The Signature Mishra Yantra (The Composite Instrument)
   * The unique heart-shaped winged monument that defines Delhi Jantar Mantar!
   */
  private createMishraYantra(
    scene: THREE.Scene,
    sandstoneMat: THREE.Material,
    marbleMat: THREE.Material
  ) {
    const mishraGroup = new THREE.Group();
    mishraGroup.position.set(-24, 0, -25);

    const baseLen = 22;
    const height = 11;

    // 1. Central Inclined Gnomon
    const gShape = new THREE.Shape();
    gShape.moveTo(-baseLen / 2, 0);
    gShape.lineTo(baseLen / 2, 0);
    gShape.lineTo(0, height);
    gShape.closePath();

    const gGeo = new THREE.ExtrudeGeometry(gShape, { depth: 3.2, bevelEnabled: true, bevelThickness: 0.2 });
    gGeo.center();
    const gMesh = new THREE.Mesh(gGeo, sandstoneMat);
    gMesh.position.y = height / 2;
    gMesh.castShadow = true;
    gMesh.receiveShadow = true;
    mishraGroup.add(gMesh);

    // 2. The Niyat Chakra Semicircular Arches (Heart/Wing shape)
    [-1, 1].forEach((side) => {
      const wingGeo = new THREE.TorusGeometry(6.5, 1.4, 8, 24, Math.PI);
      const wingMesh = new THREE.Mesh(wingGeo, sandstoneMat);
      wingMesh.rotation.x = Math.PI / 4;
      wingMesh.rotation.y = side * (Math.PI / 3);
      wingMesh.position.set(side * 5.5, 4.5, 0);
      wingMesh.castShadow = true;
      mishraGroup.add(wingMesh);

      // Marble calibration ring
      const mRingGeo = new THREE.TorusGeometry(6.55, 0.35, 8, 24, Math.PI);
      const mRingMesh = new THREE.Mesh(mRingGeo, marbleMat);
      mRingMesh.rotation.x = Math.PI / 4;
      mRingMesh.rotation.y = side * (Math.PI / 3);
      mRingMesh.position.set(side * 5.5, 4.5, 0);
      mishraGroup.add(mRingMesh);
    });

    // 3. Central Arched Portal through Base
    const archHole = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4, 16), sandstoneMat);
    archHole.rotation.x = Math.PI / 2;
    archHole.position.y = 1.6;
    mishraGroup.add(archHole);

    scene.add(mishraGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-24, height / 2, -25),
      new THREE.Vector3(baseLen, height, 10)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Cylindrical Ram Yantra: Twin Open-Top Cylindrical Observatories
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

    const wallHeight = 5.8;
    const numSectors = 12;
    const angleStep = (Math.PI * 2) / numSectors;

    // 1. Alternating Wall Pillars & Viewing Openings
    for (let i = 0; i < numSectors; i++) {
      if (i % 2 === 0) {
        const segGeo = new THREE.CylinderGeometry(
          radius,
          radius,
          wallHeight,
          6,
          1,
          true,
          i * angleStep,
          angleStep * 0.8
        );
        const segMesh = new THREE.Mesh(segGeo, sandstoneMat);
        segMesh.position.y = wallHeight / 2;
        segMesh.castShadow = true;
        segMesh.receiveShadow = true;
        ramGroup.add(segMesh);

        // Inlaid Marble Calibration on Inside Face of Pillar
        const mSegGeo = new THREE.CylinderGeometry(
          radius - 0.08,
          radius - 0.08,
          wallHeight - 0.8,
          6,
          1,
          true,
          i * angleStep + 0.05,
          angleStep * 0.7
        );
        const mSegMesh = new THREE.Mesh(mSegGeo, marbleMat);
        mSegMesh.position.y = wallHeight / 2;
        ramGroup.add(mSegMesh);
      }
    }

    // 2. Central Vertical Gnomon Pillar
    const gnomon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, wallHeight, 16), marbleMat);
    gnomon.position.y = wallHeight / 2;
    gnomon.castShadow = true;
    ramGroup.add(gnomon);

    // 3. Radial Floor Sectors (Stone and marble radiating from center)
    for (let s = 0; s < numSectors; s += 2) {
      const sAngle = s * angleStep;
      const sectorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.15, radius - 1),
        marbleMat
      );
      sectorMesh.position.set(Math.sin(sAngle) * (radius / 2), 0.08, Math.cos(sAngle) * (radius / 2));
      sectorMesh.rotation.y = sAngle;
      sectorMesh.receiveShadow = true;
      ramGroup.add(sectorMesh);
    }

    scene.add(ramGroup);

    const ramBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, wallHeight / 2, z),
      new THREE.Vector3(radius * 1.9, wallHeight, radius * 1.9)
    );
    this.colliders.push({ box: ramBox, type: 'WALL' });
  }

  /**
   * Jai Prakash Yantra: Twin Sunken Hemispherical Marble Calibration Bowls
   */
  private createJaiPrakashYantra(
    scene: THREE.Scene,
    sandstoneMat: THREE.Material,
    marbleMat: THREE.Material,
    x: number,
    z: number
  ) {
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 });

    [-6.5, 6.5].forEach((offsetX) => {
      // 1. Sunken Hemispherical Bowl
      const bowlGeo = new THREE.SphereGeometry(4.8, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const bowlMesh = new THREE.Mesh(bowlGeo, marbleMat);
      bowlMesh.position.set(x + offsetX, 0.15, z);
      bowlMesh.rotation.x = Math.PI;
      bowlMesh.receiveShadow = true;
      scene.add(bowlMesh);

      // Raised Stone Rim
      const rim = new THREE.Mesh(new THREE.RingGeometry(4.6, 5.4, 24), sandstoneMat);
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(x + offsetX, 0.18, z);
      scene.add(rim);

      // Crosswire Sighting Ring across rim
      const crossWireH = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 9.6, 8), brassMat);
      crossWireH.rotation.z = Math.PI / 2;
      crossWireH.position.set(x + offsetX, 0.22, z);
      scene.add(crossWireH);

      const crossWireV = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 9.6, 8), brassMat);
      crossWireV.rotation.x = Math.PI / 2;
      crossWireV.position.set(x + offsetX, 0.22, z);
      scene.add(crossWireV);
    });
  }

  /**
   * Digamsa & Shasthansa Yantras (Observation Pillars & Arcs)
   */
  private createDigamsaAndShasthansa(
    scene: THREE.Scene,
    sandstoneMat: THREE.Material,
    marbleMat: THREE.Material
  ) {
    const dGroup = new THREE.Group();
    dGroup.position.set(0, 0, 26);

    // Central Pillar
    const cPil = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 4.5, 16), sandstoneMat);
    cPil.position.y = 2.25;
    cPil.castShadow = true;
    dGroup.add(cPil);

    // Outer Concentric Graduated Ring
    const oRing = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 2.2, 24, 1, true), sandstoneMat);
    oRing.position.y = 1.1;
    oRing.castShadow = true;
    dGroup.add(oRing);

    // Marble Calibration Band
    const mBand = new THREE.Mesh(new THREE.CylinderGeometry(5.95, 5.95, 0.4, 24, 1, true), marbleMat);
    mBand.position.y = 2.1;
    dGroup.add(mBand);

    scene.add(dGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 2.25, 26),
      new THREE.Vector3(12.5, 4.5, 12.5)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Samvidhan Sadan (The Historic Circular Parliament House)
   * Colossal 60m Circular Edifice with 72-144 Colonnade, Dome & Billowing Indian Flag
   */
  private createSamvidhanSadan(
    scene: THREE.Scene,
    buffStoneMat: THREE.Material,
    redSandstoneMat: THREE.Material
  ) {
    const parlGroup = new THREE.Group();
    parlGroup.position.set(-105, 0, -15);

    const radius = 28;
    const height = 18;

    // 1. Sandstone Ceremonial Podium (Radius 31m, Height 2.2m)
    const podiumGeo = new THREE.CylinderGeometry(radius + 3, radius + 3.5, 2.2, 48);
    const podium = new THREE.Mesh(podiumGeo, redSandstoneMat);
    podium.position.y = 1.1;
    podium.receiveShadow = true;
    parlGroup.add(podium);

    // 2. Circular Outer Colonnade: 72 Classical Fluted Columns
    const numColumns = 72;
    const colHeight = 12.5;
    const colRadius = 0.45;
    const colGeo = new THREE.CylinderGeometry(colRadius * 0.9, colRadius, colHeight, 12);

    for (let c = 0; c < numColumns; c++) {
      const angle = (c / numColumns) * Math.PI * 2;
      const col = new THREE.Mesh(colGeo, buffStoneMat);
      col.position.set(Math.cos(angle) * (radius - 1), 2.2 + colHeight / 2, Math.sin(angle) * (radius - 1));
      col.castShadow = true;
      parlGroup.add(col);

      // Capital on each column
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), buffStoneMat);
      cap.position.set(col.position.x, 2.2 + colHeight + 0.175, col.position.z);
      parlGroup.add(cap);
    }

    // 3. Deep Circular Veranda Inner Gallery Wall (Radius 24m)
    const galleryWall = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - 4, radius - 4, colHeight + 0.5, 48, 1, true),
      buffStoneMat
    );
    galleryWall.position.y = 2.2 + colHeight / 2;
    galleryWall.castShadow = true;
    parlGroup.add(galleryWall);

    // 4. Circular Entablature & Frieze Ring connecting the colonnade
    const entablature = new THREE.Mesh(
      new THREE.CylinderGeometry(radius + 0.5, radius + 0.5, 1.8, 48, 1, true),
      buffStoneMat
    );
    entablature.position.y = 2.2 + colHeight + 1.2;
    entablature.castShadow = true;
    parlGroup.add(entablature);

    // Classical Stone Balustrade Ring along the roof perimeter
    const balustrade = new THREE.Mesh(
      new THREE.CylinderGeometry(radius + 0.4, radius + 0.4, 0.8, 48, 1, true),
      buffStoneMat
    );
    balustrade.position.y = 2.2 + colHeight + 2.5;
    parlGroup.add(balustrade);

    // 5. Central Stepped Roof Drum
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 19, 3.8, 36),
      buffStoneMat
    );
    drum.position.y = 2.2 + colHeight + 3.8;
    drum.castShadow = true;
    parlGroup.add(drum);

    // 6. The Grand Central Dome
    const domeGeo = new THREE.SphereGeometry(12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373, // Dholpur buff/copper dome
      roughness: 0.6,
      metalness: 0.2,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 2.2 + colHeight + 5.7;
    dome.castShadow = true;
    parlGroup.add(dome);

    // 7. Tall 14m Flagpole Mast flying the Indian National Flag (Tiranga)
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.18, 14, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.2 + colHeight + 5.7 + 12 + 7;
    parlGroup.add(mast);

    const flagTex = TextureGenerator.getIndianFlagTexture();
    const flagGeo = new THREE.PlaneGeometry(6, 4, 12, 8);
    flagGeo.translate(3.0, 0, 0);
    const flagMat = new THREE.MeshStandardMaterial({
      map: flagTex,
      side: THREE.DoubleSide,
      roughness: 0.5,
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0, 2.2 + colHeight + 5.7 + 12 + 11.5, 0);
    parlGroup.add(flag);
    this.addAnimatedFlag(flag, 3.8, 1.8, 0.28);

    // Upward Night Spotlight on Flag
    const flagLight = new THREE.SpotLight(0xffedd5, 2.5, 30, Math.PI / 6, 0.4);
    flagLight.position.set(0, 2.2 + colHeight + 5.7 + 12, 0);
    flagLight.target = flag;
    parlGroup.add(flagLight);

    // 8. Ceremonial Approach Steps facing East towards Sansad Marg
    const steps = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2.2, 12),
      redSandstoneMat
    );
    steps.position.set(radius + 5, 1.1, 0);
    parlGroup.add(steps);

    scene.add(parlGroup);

    // Parliament Colliders
    const pBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-105, height / 2, -15),
      new THREE.Vector3(radius * 2.2, height, radius * 2.2)
    );
    this.colliders.push({ box: pBox, type: 'WALL' });
  }

  /**
   * Sansad Bhavan (The Modern Triangular New Parliament House)
   * High-Tech Sandstone Architecture with Jali Screens and Golden Ashoka Lion Capital
   */
  private createSansadBhavan(
    scene: THREE.Scene,
    buffStoneMat: THREE.Material,
    redSandstoneMat: THREE.Material
  ) {
    const newParlGroup = new THREE.Group();
    newParlGroup.position.set(-105, 0, 45);

    const side = 38;
    const height = 15;

    // Triangular Extruded Base
    const shape = new THREE.Shape();
    shape.moveTo(-side / 2, -side / 2);
    shape.lineTo(side / 2, -side / 2);
    shape.lineTo(0, side * 0.7);
    shape.closePath();

    const tGeo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.5,
    });
    tGeo.center();

    const tMesh = new THREE.Mesh(tGeo, buffStoneMat);
    tMesh.rotation.x = Math.PI / 2;
    tMesh.position.y = height / 2;
    tMesh.castShadow = true;
    tMesh.receiveShadow = true;
    newParlGroup.add(tMesh);

    // Lower Terracotta Sandstone Plinth
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(side + 4, 2.2, side + 4),
      redSandstoneMat
    );
    plinth.position.y = 1.1;
    newParlGroup.add(plinth);

    // Central Triangular Skylight Tower
    const skyGeo = new THREE.CylinderGeometry(5.5, 6.5, 4.5, 3);
    const skyMesh = new THREE.Mesh(skyGeo, buffStoneMat);
    skyMesh.position.y = height + 2.25;
    skyMesh.castShadow = true;
    newParlGroup.add(skyMesh);

    // Golden Bronze Sculpture of Lion Capital of Ashoka on Spire
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
    });

    const ashokaSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 5, 8), goldMat);
    ashokaSpire.position.y = height + 6.5;
    newParlGroup.add(ashokaSpire);

    const lionCapital = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), goldMat);
    lionCapital.position.y = height + 9.5;
    lionCapital.castShadow = true;
    newParlGroup.add(lionCapital);

    scene.add(newParlGroup);

    const npBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-105, height / 2, 45),
      new THREE.Vector3(side + 4, height + 10, side + 4)
    );
    this.colliders.push({ box: npBox, type: 'WALL' });
  }

  /**
   * Raisina Hill Secretariats (North & South Blocks) in the Distant Western Horizon
   */
  private createRaisinaSecretariat(scene: THREE.Scene, redStone: THREE.Material, buffStone: THREE.Material) {
    const secGroup = new THREE.Group();
    secGroup.position.set(-165, 0, 12);

    [-28, 28].forEach((offsetZ) => {
      // Main Secretariat Palace Wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 36), redStone);
      wing.position.set(0, 8, offsetZ);
      wing.castShadow = true;
      secGroup.add(wing);

      // Colonnaded Upper Gallery
      const colFacade = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 28), buffStone);
      colFacade.position.set(11.1, 10, offsetZ);
      secGroup.add(colFacade);

      // Corner Chhatris
      [-16, 16].forEach((cz) => {
        const chhatri = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 3.2, 8), redStone);
        chhatri.position.set(8, 17.6, offsetZ + cz);
        secGroup.add(chhatri);
      });

      // Central Copper Cupola Dome
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(4.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x38a169, metalness: 0.6, roughness: 0.4 })
      );
      dome.position.set(0, 16, offsetZ);
      secGroup.add(dome);
    });

    scene.add(secGroup);
  }

  /**
   * India Gate Ceremonial Triumphal Arch in the Distant Axial Vista
   */
  private createIndiaGate(scene: THREE.Scene, stoneMat: THREE.Material) {
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -165);

    const width = 24;
    const depth = 12;
    const height = 32;

    // 1. Two Main Arch Pylons
    [-width / 2 + 3.5, width / 2 - 3.5].forEach((px) => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(7, height - 8, depth), stoneMat);
      pylon.position.set(px, (height - 8) / 2, 0);
      archGroup.add(pylon);
    });

    // 2. Central Arch Vault
    const archSpan = new THREE.Mesh(new THREE.BoxGeometry(width, 8, depth), stoneMat);
    archSpan.position.set(0, height - 4, 0);
    archGroup.add(archSpan);

    // 3. Tiered Attic Cornice
    const attic = new THREE.Mesh(new THREE.BoxGeometry(width - 2, 4.5, depth - 2), stoneMat);
    attic.position.set(0, height + 2.25, 0);
    archGroup.add(attic);

    // 4. Top Memorial Flame Bowl with Golden Glow
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 1.8, 1.5, 16), stoneMat);
    bowl.position.set(0, height + 5.25, 0);
    archGroup.add(bowl);

    const flameGlow = new THREE.PointLight(0xf59e0b, 3.5, 45);
    flameGlow.position.set(0, height + 6.5, 0);
    archGroup.add(flameGlow);

    scene.add(archGroup);
  }

  /**
   * Sansad Marg (Parliament Street) 6-Lane Ceremonial Boulevard
   * Dark Asphalt, Crisp White Markings, Red Stone Curbs, ASI Plaque & Directional Signs
   */
  private createSansadMargBoulevard(scene: THREE.Scene) {
    const { map: roadTex, roughnessMap: roadRough } = TextureGenerator.getGTABoulevardRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughnessMap: roadRough,
      roughness: 0.72,
      metalness: 0.12,
    });

    // 6-Lane Main Roadway along x = -62 from z = -85 to z = 85 (width: 16m)
    const roadGeo = new THREE.PlaneGeometry(16, 170);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(-62, 0.04, 0);
    road.receiveShadow = true;
    scene.add(road);

    // Raised Red Sandstone Curbs along roadway
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x992d22, roughness: 0.75 });
    [-70.2, -53.8].forEach((cx) => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.24, 170), curbMat);
      curb.position.set(cx, 0.12, 0);
      curb.receiveShadow = true;
      scene.add(curb);
    });

    // Pedestrian Zebra Crosswalks
    const crosswalkTex = TextureGenerator.getZebraCrosswalkTexture();
    const crosswalkMat = new THREE.MeshStandardMaterial({ map: crosswalkTex, roughness: 0.8 });
    [-35, 0, 35].forEach((cz) => {
      const cross = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), crosswalkMat);
      cross.rotation.x = -Math.PI / 2;
      cross.rotation.z = Math.PI / 2;
      cross.position.set(-62, 0.045, cz);
      cross.receiveShadow = true;
      scene.add(cross);
    });

    // 1. Official ASI Blue & Gold Heritage Plaque at Jantar Mantar Gateway
    const asiTex = TextureGenerator.getHeritageSignTexture('ASI');
    const asiSign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 1.8),
      new THREE.MeshStandardMaterial({ map: asiTex, roughness: 0.3, metalness: 0.2 })
    );
    asiSign.position.set(-52.6, 2.8, -7.5);
    asiSign.rotation.y = Math.PI / 2;
    scene.add(asiSign);

    // 2. Delhi Municipal Sansad Marg Overhead Street Signs
    const sansadTex = TextureGenerator.getHeritageSignTexture('SANSAD_MARG');
    const sansadSign = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 2.0),
      new THREE.MeshStandardMaterial({ map: sansadTex, roughness: 0.35 })
    );
    sansadSign.position.set(-62, 6.2, -35);
    sansadSign.rotation.y = 0;
    scene.add(sansadSign);

    // Sign Gantry Posts
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 });
    const gantry = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 7.5, 8), gantryMat);
    gantry.position.set(-53.8, 3.75, -35);
    scene.add(gantry);

    // 3. Central Vista Directional Board
    const vistaTex = TextureGenerator.getHeritageSignTexture('CENTRAL_VISTA');
    const vistaSign = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 1.9),
      new THREE.MeshStandardMaterial({ map: vistaTex, roughness: 0.3 })
    );
    vistaSign.position.set(-62, 6.2, 35);
    vistaSign.rotation.y = Math.PI;
    scene.add(vistaSign);

    const gantry2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 7.5, 8), gantryMat);
    gantry2.position.set(-53.8, 3.75, 35);
    scene.add(gantry2);
  }

  /**
   * Native Lutyens' Delhi Trees: Spreading Neem, Tall Jamun, Columnar Ashoka & Banyan Tree
   */
  private createNativeDelhiTrees(scene: THREE.Scene) {
    // 1. Columnar Ashoka Trees lining Sansad Marg & garden paths
    const ashokaPos = [
      { x: -50, z: -35 },
      { x: -50, z: -20 },
      { x: -50, z: 20 },
      { x: -50, z: 35 },
      { x: 50, z: -35 },
      { x: 50, z: 35 },
    ];
    ashokaPos.forEach((p) => this.createAshokaTree(scene, p.x, p.z));

    // 2. Dense Canopy Neem Trees in lawns
    const neemPos = [
      { x: -36, z: -18, s: 1.15 },
      { x: 36, z: -18, s: 1.1 },
      { x: 36, z: 20, s: 1.15 },
    ];
    neemPos.forEach((p) => this.createNeemTree(scene, p.x, p.z, p.s));

    // 3. Tall Jamun Trees along avenues
    this.createJamunTree(scene, -72, -25, 1.2);
    this.createJamunTree(scene, -72, 25, 1.2);

    // 4. Heritage Banyan Tree near the entrance gateway
    this.createBanyanTree(scene, -46, -14);
  }

  /**
   * Pyramidal Columnar Ashoka Tree (Polyalthia longifolia) - Signature Lutyens' Tree
   */
  public createAshokaTree(scene: THREE.Scene, x: number, z: number, scale = 1.0) {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    tGroup.scale.set(scale, scale, scale);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 });
    const leafTex = TextureGenerator.getDeciduousCanopyTexture();
    const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, roughness: 0.65 });

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 8.5, 8), trunkMat);
    trunk.position.y = 4.25;
    trunk.castShadow = true;
    tGroup.add(trunk);

    // 3 Stacked Cones for realistic columnar tapering
    const coneH = [
      { r: 2.2, h: 4.5, y: 4.8 },
      { r: 1.8, h: 4.5, y: 7.2 },
      { r: 1.2, h: 4.5, y: 9.5 },
    ];
    coneH.forEach((c) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(c.r, c.h, 10), leafMat);
      cone.position.y = c.y;
      cone.castShadow = true;
      tGroup.add(cone);
    });

    scene.add(tGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 4.5, z),
      new THREE.Vector3(1.2, 9, 1.2)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Spreading Neem Tree (Azadirachta indica) with dense clustered foliage
   */
  public createNeemTree(scene: THREE.Scene, x: number, z: number, scale = 1.0) {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    tGroup.scale.set(scale, scale, scale);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
    const leafTex = TextureGenerator.getDeciduousCanopyTexture();
    const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, roughness: 0.7 });

    // Branching trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 5, 8), trunkMat);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    tGroup.add(trunk);

    // Clustered leafy lobes
    const lobes = [
      { x: 0, y: 6.2, z: 0, r: 3.4 },
      { x: -2.2, y: 5.5, z: 1.2, r: 2.8 },
      { x: 2.2, y: 5.5, z: -1.2, r: 2.8 },
      { x: 0, y: 5.4, z: 2.4, r: 2.6 },
      { x: 0, y: 5.4, z: -2.4, r: 2.6 },
    ];
    lobes.forEach((l) => {
      const lobe = new THREE.Mesh(new THREE.SphereGeometry(l.r, 10, 8), leafMat);
      lobe.position.set(l.x, l.y, l.z);
      lobe.castShadow = true;
      tGroup.add(lobe);
    });

    scene.add(tGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 3.5, z),
      new THREE.Vector3(1.6, 7, 1.6)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Tall Jamun Tree (Syzygium cumini)
   */
  public createJamunTree(scene: THREE.Scene, x: number, z: number, scale = 1.0) {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    tGroup.scale.set(scale, scale, scale);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x33261d, roughness: 0.9 });
    const leafTex = TextureGenerator.getDeciduousCanopyTexture();
    const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, roughness: 0.75 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 7.5, 8), trunkMat);
    trunk.position.y = 3.75;
    trunk.castShadow = true;
    tGroup.add(trunk);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 10), leafMat);
    canopy.position.y = 8.5;
    canopy.castShadow = true;
    tGroup.add(canopy);

    scene.add(tGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 3.75, z),
      new THREE.Vector3(1.4 * scale, 7.5 * scale, 1.4 * scale)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Heritage Banyan Tree with Hanging Prop Roots
   */
  public createBanyanTree(scene: THREE.Scene, x: number, z: number) {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x423226, roughness: 0.9 });
    const leafTex = TextureGenerator.getDeciduousCanopyTexture();
    const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, roughness: 0.8 });

    // Girthed main trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 5.5, 10), trunkMat);
    trunk.position.y = 2.75;
    trunk.castShadow = true;
    tGroup.add(trunk);

    // Prop roots
    [-1.6, 1.6].forEach((rx) => {
      [-1.4, 1.4].forEach((rz) => {
        const root = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.2, 6), trunkMat);
        root.position.set(rx, 2.1, rz);
        tGroup.add(root);
      });
    });

    // Massive broad canopy
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(5.6, 14, 10), leafMat);
    canopy.scale.set(1.4, 0.8, 1.4);
    canopy.position.y = 6.2;
    canopy.castShadow = true;
    tGroup.add(canopy);

    scene.add(tGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 2.75, z),
      new THREE.Vector3(3.2, 5.5, 3.2)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Authentic Delhi Police & Government VIP Vehicles
   */
  private createDelhiPoliceVehicles(scene: THREE.Scene) {
    // 1. Delhi Police "Vajra" Armored Riot Control Carrier
    this.createVajraRiotCarrier(scene, -62, 58, 0);

    // 2. Delhi Police Patrol SUVs (White & Navy with Crest)
    this.createDelhiPoliceSUV(scene, -62, 28, 0.08);
    this.createDelhiPoliceSUV(scene, -62, -28, -0.08);

    // 3. Official VIP Ambassador Diplomatic Sedan
    this.createVIPAmbassador(scene, -66, 0, Math.PI / 2);
  }

  /**
   * Delhi Police "Vajra" Heavy Armored Riot Carrier
   * Features: Protected Wire-Mesh Windshield, Rooftop Water Cannon Turret & Flashing Lightbars
   */
  public createVajraRiotCarrier(scene: THREE.Scene, x: number, z: number, rot = 0) {
    const vajraGroup = new THREE.Group();
    vajraGroup.position.set(x, 0, z);
    vajraGroup.rotation.y = rot;

    const length = 7.8;
    const width = 2.9;
    const height = 3.2;

    const armorWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.4 });
    const navyBlue = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3, metalness: 0.5 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.85 });

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.5, length), steelMat);
    chassis.position.y = 0.65;
    vajraGroup.add(chassis);

    // Main Armored Hull (Lower Navy, Upper White)
    const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(width, 1.1, length), navyBlue);
    lowerHull.position.y = 1.45;
    lowerHull.castShadow = true;
    vajraGroup.add(lowerHull);

    const upperHull = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 1.2, length - 0.2), armorWhite);
    upperHull.position.y = 2.5;
    upperHull.castShadow = true;
    vajraGroup.add(upperHull);

    // Slanted Front Armored Windshield with Wire Mesh Guard
    const windMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.3, 0.9, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 })
    );
    windMesh.position.set(0, 2.5, length / 2 - 0.1);
    windMesh.rotation.x = -0.22;
    vajraGroup.add(windMesh);

    // Wire Mesh Screen Guard
    const wireGuard = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.35, 0.95, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x000000, wireframe: true })
    );
    wireGuard.position.set(0, 2.5, length / 2 - 0.05);
    wireGuard.rotation.x = -0.22;
    vajraGroup.add(wireGuard);

    // Rooftop Water Cannon Turret
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.6, 12), steelMat);
    turret.position.set(0, height + 0.3, length / 2 - 1.2);
    vajraGroup.add(turret);

    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.6, 8), steelMat);
    nozzle.rotation.x = Math.PI / 2.2;
    nozzle.position.set(0, height + 0.6, length / 2 - 0.4);
    vajraGroup.add(nozzle);

    // 6 Heavy Armored All-Terrain Wheels
    [-width / 2 - 0.05, width / 2 + 0.05].forEach((wx) => {
      [-2.4, 0, 2.4].forEach((wz) => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.58, 0.58, 0.45, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.58, wz);
        wheel.castShadow = true;
        vajraGroup.add(wheel);
      });
    });

    // Flashing Red & Blue Police Lightbars
    [-0.8, 0.8].forEach((lx, idx) => {
      const isRed = idx === 0;
      const light = new THREE.PointLight(isRed ? 0xef4444 : 0x3b82f6, 2.0, 15);
      light.position.set(lx, height + 0.2, 0);
      vajraGroup.add(light);
      this.policeLights.push(light);

      const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.18, 0.25),
        new THREE.MeshStandardMaterial({
          color: isRed ? 0xef4444 : 0x3b82f6,
          emissive: isRed ? 0xef4444 : 0x3b82f6,
          emissiveIntensity: 1.5,
        })
      );
      bulb.position.set(lx, height + 0.15, 0);
      vajraGroup.add(bulb);
    });

    // Dual Front Heavy Headlights & Road Illumination
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    [-1.0, 1.0].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.1), headMat);
      lamp.position.set(hx, 1.35, length / 2 + 0.02);
      vajraGroup.add(lamp);

      const grillRing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.05), steelMat);
      grillRing.position.set(hx, 1.35, length / 2 + 0.01);
      vajraGroup.add(grillRing);
    });

    const frontLight = new THREE.SpotLight(0xfffbeb, 2.5, 35, Math.PI / 4, 0.4);
    frontLight.position.set(0, 1.4, length / 2 + 0.2);
    frontLight.target.position.set(0, 0, length / 2 + 18);
    vajraGroup.add(frontLight.target);
    vajraGroup.add(frontLight);

    // Dual Rear Red Taillights
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    [-1.05, 1.05].forEach((tx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.1), tailMat);
      lamp.position.set(tx, 1.4, -length / 2 - 0.02);
      vajraGroup.add(lamp);
    });

    scene.add(vajraGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width + 0.4, height + 0.6, length + 0.4)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Delhi Police Patrol SUV (Maruti Gypsy / Safari)
   * White Body, Navy Hood Decals, Push Bull Bar & Siren Beacon
   */
  public createDelhiPoliceSUV(scene: THREE.Scene, x: number, z: number, rot = 0) {
    const suvGroup = new THREE.Group();
    suvGroup.position.set(x, 0, z);
    suvGroup.rotation.y = rot;

    const length = 4.6;
    const width = 1.95;
    const height = 1.85;

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.3 });
    const navyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.9 });

    // Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.35, length), steelMat);
    chassis.position.y = 0.55;
    suvGroup.add(chassis);

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, 0.65, length), whiteMat);
    body.position.y = 0.95;
    body.castShadow = true;
    suvGroup.add(body);

    // Navy Blue Delhi Police Side Stripe & Hood
    const hoodStripe = new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, 0.05, 1.4), navyMat);
    hoodStripe.position.set(0, 1.28, length / 2 - 0.75);
    suvGroup.add(hoodStripe);

    // Cabin Greenhouse
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width - 0.15, 0.8, 2.5), whiteMat);
    cabin.position.set(0, 1.65, -0.2);
    cabin.castShadow = true;
    suvGroup.add(cabin);

    // Front Windshield
    const wind = new THREE.Mesh(new THREE.BoxGeometry(width - 0.25, 0.7, 0.1), glassMat);
    wind.position.set(0, 1.62, 1.05);
    wind.rotation.x = -0.25;
    suvGroup.add(wind);

    // Front Bull Bar
    const bullBar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, width - 0.2, 8), steelMat);
    bullBar.rotation.z = Math.PI / 2;
    bullBar.position.set(0, 0.85, length / 2 + 0.1);
    suvGroup.add(bullBar);

    // 4 Wheels
    [-width / 2 - 0.04, width / 2 + 0.04].forEach((wx) => {
      [-1.4, 1.4].forEach((wz) => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.48, wz);
        wheel.castShadow = true;
        suvGroup.add(wheel);
      });
    });

    // Rooftop Blue & Red Police Strobe Lightbar
    [-0.35, 0.35].forEach((lx, idx) => {
      const isRed = idx === 0;
      const strobe = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.14, 0.2),
        new THREE.MeshStandardMaterial({
          color: isRed ? 0xef4444 : 0x3b82f6,
          emissive: isRed ? 0xef4444 : 0x3b82f6,
          emissiveIntensity: 1.6,
        })
      );
      strobe.position.set(lx, height + 0.25, 0);
      suvGroup.add(strobe);

      const light = new THREE.PointLight(isRed ? 0xef4444 : 0x3b82f6, 1.6, 12);
      light.position.set(lx, height + 0.3, 0);
      suvGroup.add(light);
      this.policeLights.push(light);
    });

    // Dual Front Headlights
    const suvHeadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    [-0.65, 0.65].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.08), suvHeadMat);
      lamp.position.set(hx, 0.98, length / 2 + 0.01);
      suvGroup.add(lamp);
    });

    const suvBeam = new THREE.SpotLight(0xfffbeb, 2.0, 28, Math.PI / 4, 0.4);
    suvBeam.position.set(0, 1.0, length / 2 + 0.1);
    suvBeam.target.position.set(0, 0, length / 2 + 15);
    suvGroup.add(suvBeam.target);
    suvGroup.add(suvBeam);

    // Dual Rear Taillights
    const suvTailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    [-0.7, 0.7].forEach((tx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.08), suvTailMat);
      lamp.position.set(tx, 1.0, -length / 2 - 0.01);
      suvGroup.add(lamp);
    });

    scene.add(suvGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width, height, length)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Official Government VIP Ambassador Diplomatic Sedan
   * Classic White VIP Car with Rooftop Red Beacon & Golden Emblem
   */
  public createVIPAmbassador(scene: THREE.Scene, x: number, z: number, rot = 0) {
    const ambGroup = new THREE.Group();
    ambGroup.position.set(x, 0, z);
    ambGroup.rotation.y = rot;

    const length = 4.4;
    const width = 1.75;
    const height = 1.6;

    const whitePaint = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.25, metalness: 0.45 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.95 });

    // Chassis & Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, 0.55, length), whitePaint);
    body.position.y = 0.72;
    body.castShadow = true;
    ambGroup.add(body);

    // Rounded Classic Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width - 0.18, 0.65, 2.3), whitePaint);
    cabin.position.set(0, 1.3, -0.2);
    cabin.castShadow = true;
    ambGroup.add(cabin);

    // Front Slanted Windshield
    const wind = new THREE.Mesh(new THREE.BoxGeometry(width - 0.25, 0.58, 0.1), glassMat);
    wind.position.set(0, 1.28, 0.95);
    wind.rotation.x = -0.3;
    ambGroup.add(wind);

    // Chrome Bumper
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, 0.16, 0.22), chromeMat);
    bumper.position.set(0, 0.55, length / 2 + 0.05);
    ambGroup.add(bumper);

    // Rooftop Flashing Red VIP Beacon
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.8 })
    );
    beacon.position.set(0, height + 0.15, 0.2);
    ambGroup.add(beacon);

    const bLight = new THREE.PointLight(0xef4444, 2.0, 10);
    bLight.position.set(0, height + 0.25, 0.2);
    ambGroup.add(bLight);
    this.policeLights.push(bLight);

    // 4 Wheels with Chrome Hubcaps
    [-width / 2 - 0.03, width / 2 + 0.03].forEach((wx) => {
      [-1.3, 1.3].forEach((wz) => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.28, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.42, wz);
        ambGroup.add(wheel);

        const hubcap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.3, 12), chromeMat);
        hubcap.rotation.z = Math.PI / 2;
        hubcap.position.set(wx > 0 ? wx + 0.02 : wx - 0.02, 0.42, wz);
        ambGroup.add(hubcap);
      });
    });

    // Classic Vintage Round Chrome Headlights
    const ambHeadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffedd5,
      emissiveIntensity: 2.0,
      roughness: 0.1,
    });
    [-0.55, 0.55].forEach((hx) => {
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), chromeMat);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(hx, 0.75, length / 2 + 0.02);
      ambGroup.add(bezel);

      const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.09, 16), ambHeadMat);
      bulb.rotation.x = Math.PI / 2;
      bulb.position.set(hx, 0.75, length / 2 + 0.03);
      ambGroup.add(bulb);
    });

    // Dual Rear Vintage Red Taillights
    const ambTailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    [-0.6, 0.6].forEach((tx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.08), ambTailMat);
      lamp.position.set(tx, 0.75, -length / 2 - 0.01);
      ambGroup.add(lamp);
    });

    scene.add(ambGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width, height, length)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Gen-Z Peaceful Rally Stage with Dignified Banners, Tiranga Flags, Lights & Speakers
   */
  private createProtestStage(scene: THREE.Scene) {
    const stageGroup = new THREE.Group();
    stageGroup.position.copy(this.stagePosition);

    const stageGeo = new THREE.BoxGeometry(18, 1.2, 10);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
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
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 320);

      // Gold Border
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 1004, 300);

      ctx.fillStyle = '#ff9933';
      ctx.font = '900 44px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🇮🇳 AWAAZ 2026: SANSAD MARG RALLY 🇮🇳', 512, 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.fillText('WE THE PEOPLE OF INDIA • UNITY IN DIVERSITY', 512, 155);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 24px Outfit, sans-serif';
      ctx.fillText('PEACEFUL VOICES • TRUTH & SOLIDARITY • BY SHAZEB ANWAR KHAN', 512, 215);

      ctx.fillStyle = '#facc15';
      ctx.font = 'italic 20px Space Grotesk, monospace';
      ctx.fillText('#Awaaz2026 #DelhiUnited #YouthEmpowerment', 512, 270);
    }
    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 4.2, -4.8);
    stageGroup.add(bannerMesh);

    // Two Indian Flags on stage sides
    const flagTex = TextureGenerator.getIndianFlagTexture();
    const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.5 });
    [-7.5, 7.5].forEach((fx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 6.5, 8), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 }));
      pole.position.set(fx, 4.2, -4.5);
      stageGroup.add(pole);

      const flagGeo = new THREE.PlaneGeometry(2.4, 1.6, 8, 6);
      const isRight = fx > 0;
      flagGeo.translate(isRight ? -1.2 : 1.2, 0, 0);
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(fx, 6.5, -4.5);
      stageGroup.add(flag);
      this.addAnimatedFlag(flag, 4.0, 2.2, 0.22);
    });

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
    const droneGroup = new THREE.Group();
    this.droneGroup = droneGroup;
    droneGroup.position.set(0, 24, 20);

    const bodyGeo = new THREE.BoxGeometry(2.2, 0.45, 2.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    droneGroup.add(body);

    const camGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const camMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0.9 });
    const cam = new THREE.Mesh(camGeo, camMat);
    cam.position.set(0, -0.3, 0.7);
    droneGroup.add(cam);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const propMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 });

    const armCoords = [
      { x: 1.4, z: 1.4 },
      { x: -1.4, z: 1.4 },
      { x: 1.4, z: -1.4 },
      { x: -1.4, z: -1.4 },
    ];

    armCoords.forEach((coord) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), armMat);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = Math.atan2(coord.z, coord.x);
      arm.position.set(coord.x / 2, 0, coord.z / 2);
      droneGroup.add(arm);

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 12), bodyMat);
      motor.position.set(coord.x, 0.15, coord.z);
      droneGroup.add(motor);

      const prop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 0.16), propMat);
      prop.position.set(coord.x, 0.35, coord.z);
      droneGroup.add(prop);
      this.dronePropellers.push(prop);
    });

    this.droneSpotlight = new THREE.SpotLight(0xffffff, 5.0, 50, Math.PI / 7, 0.35, 1.2);
    this.droneSpotlight.position.set(0, 0, 0);
    this.droneSpotlight.castShadow = true;

    this.droneTargetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ visible: false }));
    scene.add(this.droneTargetMesh);
    this.droneSpotlight.target = this.droneTargetMesh;

    droneGroup.add(this.droneSpotlight);
    scene.add(this.droneGroup);
  }

  public updateDrone(delta: number): { x: number; z: number } {
    if (!this.droneGroup || !this.droneSpotlight || !this.droneTargetMesh) {
      return { x: 0, z: 20 };
    }

    this.droneAngle += delta * 0.45;
    this.dronePropellers.forEach((p) => {
      p.rotation.y += delta * 45;
    });

    const flightRadius = 32;
    const droneX = Math.cos(this.droneAngle) * flightRadius;
    const droneZ = Math.sin(this.droneAngle * 0.8) * flightRadius * 0.7 + 10;
    const droneY = 22 + Math.sin(this.droneAngle * 1.5) * 2;

    this.droneGroup.position.set(droneX, droneY, droneZ);

    const targetX = Math.cos(this.droneAngle + 0.6) * 16;
    const targetZ = Math.sin(this.droneAngle * 0.8 + 0.6) * 16;

    this.droneTargetMesh.position.set(targetX, 0, targetZ);
    this.droneSpotlightPos = { x: targetX, z: targetZ };

    return this.droneSpotlightPos;
  }

  /**
   * Planted Protest Placards
   */
  private createPlantedPlacards(scene: THREE.Scene) {
    const slogans = [
      'AWAAZ 2026',
      'PEACE & UNITY',
      'SPEAK TRUTH',
      'YOUTH VOICE',
      'NO SILENCE',
      'EQUALITY NOW',
      'FUTURE IS OURS',
    ];

    for (let i = 0; i < 18; i++) {
      const slogan = slogans[i % slogans.length];
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 192;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#fef08a';
        ctx.fillRect(0, 0, 256, 192);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 184);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 30px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slogan, 128, 105);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const signMat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide });

      const signGroup = new THREE.Group();
      const posX = (Math.random() - 0.5) * 55;
      const posZ = 12 + Math.random() * 32;
      signGroup.position.set(posX, 0, posZ);
      signGroup.rotation.y = (Math.random() - 0.5) * Math.PI;

      const board = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), signMat);
      board.position.y = 1.35;
      board.castShadow = true;
      signGroup.add(board);

      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      stick.position.y = 0.7;
      signGroup.add(stick);

      scene.add(signGroup);
    }
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

    const busLength = 11.2;
    const busWidth = 3.3;
    const busHeight = 3.6;

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(busWidth - 0.2, 0.4, busLength);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.8 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.55;
    busGroup.add(chassis);

    // Body (Deep Police Navy Blue)
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

    // Curved Aerodynamic Roof Cap
    const roofGeo = new THREE.CylinderGeometry(busWidth / 2, busWidth / 2, busLength, 16, 1, false, 0, Math.PI);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.3, metalness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.x = Math.PI / 2;
    roof.rotation.z = Math.PI / 2;
    roof.position.set(0, busHeight + 0.35, 0);
    busGroup.add(roof);

    // Windshield
    const windGeo = new THREE.BoxGeometry(busWidth - 0.25, 1.25, 0.2);
    const windMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.95 });
    const windshield = new THREE.Mesh(windGeo, windMat);
    windshield.position.set(0, 2.7, busLength / 2 + 0.02);
    windshield.rotation.x = -0.15;
    busGroup.add(windshield);

    // Wire Guard
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x000000, wireframe: true });
    const wireMesh = new THREE.Mesh(new THREE.BoxGeometry(busWidth - 0.28, 1.22, 0.22), wireMat);
    wireMesh.position.set(0, 2.7, busLength / 2 + 0.04);
    wireMesh.rotation.x = -0.15;
    busGroup.add(wireMesh);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wheelPositions = [
      { x: -busWidth / 2 - 0.05, z: 3.4 },
      { x: busWidth / 2 + 0.05, z: 3.4 },
      { x: -busWidth / 2 - 0.05, z: -3.4 },
      { x: busWidth / 2 + 0.05, z: -3.4 },
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.5, 16), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.65, pos.z);
      wheel.castShadow = true;
      busGroup.add(wheel);
    });

    // Rear Interactive Jailbreak Door
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 1.6, -busLength / 2 - 0.05);

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.2, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.7, roughness: 0.3 })
    );
    doorPanel.position.set(0.8, 0, 0);
    doorGroup.add(doorPanel);

    busGroup.add(doorGroup);
    this.busDoors.set(busId, doorGroup);

    // Flashing Red & Blue Police Roof Lightbar
    const sirenBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.25, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, emissive: 0x0284c7, emissiveIntensity: 1.5 })
    );
    sirenBar.position.set(0, busHeight + 0.7, 4.2);
    busGroup.add(sirenBar);

    const pLight = new THREE.PointLight(0xef4444, 2.0, 18);
    pLight.position.set(0, busHeight + 0.9, 4.2);
    busGroup.add(pLight);
    this.policeLights.push(pLight);

    // Dual Front Heavy Headlights & Amber Indicators
    const busHeadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 2.4,
      roughness: 0.1,
    });
    const busTurnMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
    });

    [-1.25, 1.25].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.1), busHeadMat);
      lamp.position.set(hx, 1.25, busLength / 2 + 0.02);
      busGroup.add(lamp);

      const turn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.1), busTurnMat);
      turn.position.set(hx > 0 ? hx + 0.24 : hx - 0.24, 1.25, busLength / 2 + 0.02);
      busGroup.add(turn);
    });

    const busBeam = new THREE.SpotLight(0xfffbeb, 2.8, 35, Math.PI / 4, 0.4);
    busBeam.position.set(0, 1.3, busLength / 2 + 0.2);
    busBeam.target.position.set(0, 0, busLength / 2 + 20);
    busGroup.add(busBeam.target);
    busGroup.add(busBeam);

    // Rear Dual Taillights
    const busTailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    [-1.3, 1.3].forEach((tx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 0.1), busTailMat);
      lamp.position.set(tx, 1.4, -busLength / 2 - 0.02);
      busGroup.add(lamp);
    });

    scene.add(busGroup);

    this.busPositions.push({ x, y: 0, z, id: busId });

    const cosR = Math.abs(Math.cos(rot));
    const sinR = Math.abs(Math.sin(rot));
    const bbX = busWidth * cosR + busLength * sinR;
    const bbZ = busWidth * sinR + busLength * cosR;

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, busHeight / 2, z),
      new THREE.Vector3(bbX, busHeight, bbZ)
    );
    this.colliders.push({ box, type: 'BUS', interactiveId: busId });
  }

  public openBusDoor(busId: string) {
    const door = this.busDoors.get(busId);
    if (door) {
      door.rotation.y = -Math.PI / 1.5;
    }
  }

  /**
   * Tactical Water Cannon Truck
   */
  private createWaterCannonTruck(scene: THREE.Scene, x: number, z: number) {
    const truckGroup = new THREE.Group();
    truckGroup.position.set(x, 0, z);

    const truckMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6, roughness: 0.4 });
    const waterTank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 7.5, 16), truckMat);
    waterTank.rotation.x = Math.PI / 2;
    waterTank.position.y = 2.4;
    waterTank.castShadow = true;
    truckGroup.add(waterTank);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 3.2), truckMat);
    cab.position.set(0, 1.8, 4.4);
    cab.castShadow = true;
    truckGroup.add(cab);

    // Cannon Turret
    const cannonTurret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    cannonTurret.rotation.x = Math.PI / 2.5;
    cannonTurret.position.set(0, 3.4, 4.2);
    truckGroup.add(cannonTurret);

    scene.add(truckGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 1.8, z),
      new THREE.Vector3(3.2, 3.6, 11)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Yellow Steel Delhi Police Barricade Mesh
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
      ctx.fillStyle = '#eab308'; // Police Yellow
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

      ctx.fillStyle = '#1e3a8a'; // Navy plate
      ctx.fillRect(110, 24, 292, 80);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(114, 28, 284, 72);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DELHI POLICE', 256, 64);
      ctx.font = '600 16px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('शांति • सेवा • न्याय', 256, 90);
    }

    const tex = new THREE.CanvasTexture(canvas);
    const barricadeMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.6,
      metalness: 0.3,
    });

    const panel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.15), barricadeMat);
    panel.position.y = height / 2 + 0.1;
    panel.castShadow = true;
    panel.receiveShadow = true;
    barricadeGroup.add(panel);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8 });
    [-width / 2 + 0.1, width / 2 - 0.1].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, height + 0.3, 8), legMat);
      leg.position.set(lx, (height + 0.3) / 2, 0);
      barricadeGroup.add(leg);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.8), legMat);
      foot.position.set(lx, 0.05, 0);
      barricadeGroup.add(foot);
    });

    scene.add(barricadeGroup);

    const cosR = Math.abs(Math.cos(rot));
    const sinR = Math.abs(Math.sin(rot));
    const bbX = width * cosR + 0.8 * sinR;
    const bbZ = width * sinR + 0.8 * cosR;

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(bbX, height, bbZ)
    );
    this.colliders.push({ box, type: 'BARRICADE' });

    return barricadeGroup;
  }

  /**
   * Plaza Streetlighting & Heritage Lanterns
   */
  private createPlazaLighting(scene: THREE.Scene) {
    const lampPositions = [
      { x: -35, z: -35 },
      { x: 35, z: -35 },
      { x: -35, z: 35 },
      { x: 35, z: 35 },
      { x: -54, z: -20 },
      { x: -54, z: 20 },
      { x: 0, z: -45 },
      { x: 0, z: 45 },
    ];

    lampPositions.forEach((pos) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(pos.x, 0, pos.z);

      const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 6.5, 8), metalMat);
      post.position.y = 3.25;
      post.castShadow = true;
      lampGroup.add(post);

      // Dual Ornate Arm & Warm Lanterns
      [-0.9, 0.9].forEach((lx) => {
        const lantern = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 12, 8),
          new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xffedd5, emissiveIntensity: 1.2 })
        );
        lantern.position.set(lx, 6.2, 0);
        lampGroup.add(lantern);

        const light = new THREE.PointLight(0xffeedd, 1.2, 18);
        light.position.set(lx, 6.0, 0);
        lampGroup.add(light);
      });

      scene.add(lampGroup);

      const colBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(pos.x, 3.25, pos.z),
        new THREE.Vector3(1, 6.5, 1)
      );
      this.colliders.push({ box: colBox, type: 'WALL' });
    });

    // Sun & Ambient Lighting
    this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.85);
    scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffd8a8, 2.2);
    this.sunLight.position.set(45, 65, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0005;

    const d = 95;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    scene.add(this.sunLight);
  }

  public setTimeOfDay(time: TimeOfDay, scene: THREE.Scene) {
    if (!this.sunLight || !this.ambientLight) return;

    switch (time) {
      case 'MIDDAY':
        this.sunLight.color.setHex(0xffffff);
        this.sunLight.intensity = 2.6;
        this.sunLight.position.set(10, 80, 10);
        this.ambientLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 1.0;
        scene.fog = new THREE.FogExp2(0xdbeafe, 0.0022);
        break;
      case 'GOLDEN_HOUR':
        this.sunLight.color.setHex(0xf59e0b);
        this.sunLight.intensity = 2.2;
        this.sunLight.position.set(55, 35, 45);
        this.ambientLight.color.setHex(0xfef08a);
        this.ambientLight.intensity = 0.85;
        scene.fog = new THREE.FogExp2(0xfef08a, 0.0025);
        break;
      case 'NIGHT_RALLY':
        this.sunLight.color.setHex(0x38bdf8);
        this.sunLight.intensity = 0.55;
        this.sunLight.position.set(-30, 45, -30);
        this.ambientLight.color.setHex(0x1e293b);
        this.ambientLight.intensity = 0.45;
        scene.fog = new THREE.FogExp2(0x0f172a, 0.0035);
        break;
    }
  }

  public updateSirenLights() {
    const time = Date.now() * 0.008;
    this.policeLights.forEach((light, i) => {
      const isRed = i % 2 === 0;
      const flash = Math.sin(time * 3 + (isRed ? 0 : Math.PI)) > 0 ? 3.0 : 0.2;
      light.intensity = flash;
    });
  }

  // ==========================================
  // CHAPTER 2: PARIS (PLACE DE LA BASTILLE)
  // ==========================================

  public buildParisBastille(scene: THREE.Scene): { colliders: Collider[]; busPositions: any[] } {
    this.colliders = [];
    this.busPositions = [];
    this.busDoors.clear();
    this.policeLights = [];
    this.animatedFlags = [];

    const cobblestonePBR = TextureGenerator.getParisCobblestoneTexture();
    const cobblestoneMat = new THREE.MeshStandardMaterial({
      map: cobblestonePBR.map,
      bumpMap: cobblestonePBR.bumpMap,
      bumpScale: 0.12,
      roughness: 0.72,
      metalness: 0.15,
    });

    const creamStoneMat = new THREE.MeshStandardMaterial({
      color: 0xf5eee4,
      roughness: 0.75,
      metalness: 0.05,
    });

    const zincRoofMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.4,
    });

    // 1. Parisian Cobblestone Plaza Ground
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const ground = new THREE.Mesh(groundGeo, cobblestoneMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Granite ring
    const innerRingGeo = new THREE.RingGeometry(14, 28, 32);
    const innerRingMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.85 });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.02;
    innerRing.receiveShadow = true;
    scene.add(innerRing);

    // 2. Colonne de Juillet
    this.createJulyColumn(scene, creamStoneMat);

    // 3. Haussmannian Perimeter Architecture
    this.createParisianBuildings(scene, creamStoneMat, zincRoofMat);

    // 4. Parisian Metro Entrance
    this.createParisMetroEntrance(scene, -25, 14);

    // 5. French CRS Police Encampment
    this.createFrenchCRSCamp(scene);

    // 6. Morris Columns
    this.createMorrisColumns(scene);

    // 7. Paris Protest Stage
    this.createParisProtestStage(scene);

    // 8. Overhead Media Drone
    this.createMediaDrone(scene);

    // 9. Planted Placards
    this.createParisPlacards(scene);

    // 10. Ornate Parisian Street Lamps
    this.createParisLighting(scene);

    // 11. Parisian Boulevard Roadways
    this.createParisBoulevardRoadways(scene);

    // 12. Parisian Horse-Chestnut Trees & Street Dressing
    this.createParisStreetDressings(scene);

    return {
      colliders: this.colliders,
      busPositions: this.busPositions,
    };
  }

  private generateParisCobblestoneTexture(): THREE.CanvasTexture {
    return TextureGenerator.getParisCobblestoneTexture().map;
  }

  private createJulyColumn(scene: THREE.Scene, stoneMat: THREE.Material) {
    const colGroup = new THREE.Group();
    colGroup.position.set(0, 0, 0);

    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x1e3a2b, roughness: 0.6, metalness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.15, emissive: 0xd97706, emissiveIntensity: 0.4 });

    // Multi-tier Pedestal
    const baseP1 = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.2, 2.4, 24), stoneMat);
    baseP1.position.y = 1.2;
    baseP1.receiveShadow = true;
    colGroup.add(baseP1);

    const baseP2 = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 7.2, 3.2, 24), stoneMat);
    baseP2.position.y = 4.0;
    baseP2.castShadow = true;
    colGroup.add(baseP2);

    // Fluted Bronze Column Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 24, 20), bronzeMat);
    shaft.position.y = 17.6;
    shaft.castShadow = true;
    colGroup.add(shaft);

    // Corinthian Capital & Gallery
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 2.5, 2.4, 16), bronzeMat);
    cap.position.y = 30.8;
    colGroup.add(cap);

    // Golden Spirit of Liberty (Génie de la Liberté)
    const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.2, 8), goldMat);
    statue.position.y = 33.6;
    colGroup.add(statue);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 0.2), goldMat);
    wings.position.set(0, 34.2, 0);
    colGroup.add(wings);

    const torchLight = new THREE.PointLight(0xfacc15, 3.0, 35);
    torchLight.position.set(0, 36, 0);
    colGroup.add(torchLight);

    scene.add(colGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 16, 0),
      new THREE.Vector3(14, 34, 14)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  private createParisianBuildings(scene: THREE.Scene, stoneMat: THREE.Material, roofMat: THREE.Material) {
    const { map: facadeTex, bumpMap: facadeBump } = TextureGenerator.getHaussmannFacadeTexture();
    const haussmannMat = new THREE.MeshStandardMaterial({
      map: facadeTex,
      bumpMap: facadeBump,
      bumpScale: 0.08,
      roughness: 0.72,
      metalness: 0.08,
    });

    const wallH = 24;
    const size = 150;

    const bSpecs = [
      { x: 0, z: -size / 2, w: size, d: 8, rot: 0 },
      { x: 0, z: size / 2, w: size, d: 8, rot: 0 },
      { x: -size / 2, z: 0, w: 8, d: size, rot: 0 },
      { x: size / 2, z: 0, w: 8, d: size, rot: 0 },
    ];

    bSpecs.forEach((b) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);

      const facade = new THREE.Mesh(new THREE.BoxGeometry(b.w, wallH - 5, b.d), haussmannMat);
      facade.position.y = (wallH - 5) / 2;
      facade.castShadow = true;
      facade.receiveShadow = true;
      bGroup.add(facade);

      // Mansard Zinc Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w, 5, b.d - 1), roofMat);
      roof.position.y = wallH - 2.5;
      roof.castShadow = true;
      bGroup.add(roof);

      scene.add(bGroup);

      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(b.x, wallH / 2, b.z),
        new THREE.Vector3(b.w, wallH, b.d)
      );
      this.colliders.push({ box, type: 'WALL' });
    });
  }

  private createParisMetroEntrance(scene: THREE.Scene, x: number, z: number) {
    const mGroup = new THREE.Group();
    mGroup.position.set(x, 0, z);

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x14532d, metalness: 0.8, roughness: 0.3 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.5 });

    const stairs = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    stairs.position.y = 0.2;
    mGroup.add(stairs);

    // Hector Guimard Art Nouveau Balustrade
    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.2, 6.2), greenMat);
    balustrade.position.y = 0.8;
    mGroup.add(balustrade);

    // "METROPOLITAIN" Sign Arch
    const arch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.15), greenMat);
    arch.position.set(0, 3.2, 3.1);
    mGroup.add(arch);

    // Glowing Orange Tulip Lamps
    [-1.8, 1.8].forEach((lx) => {
      const tulip = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), lampMat);
      tulip.position.set(lx, 3.5, 3.1);
      mGroup.add(tulip);
    });

    scene.add(mGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 1.5, z),
      new THREE.Vector3(4.8, 3, 6.8)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  private createFrenchCRSCamp(scene: THREE.Scene) {
    this.createFrenchCRSRiotVan(scene, -20, 52, Math.PI / 12, 'BUS_PARIS_ALPHA');
    this.createFrenchCRSRiotVan(scene, 20, 52, -Math.PI / 12, 'BUS_PARIS_BRAVO');
    this.createFrenchWaterCannonTruck(scene, 0, 60);

    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    [-15, -7, 0, 7, 15].forEach((bx) => {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 0.15), barrierMat);
      barrier.position.set(bx, 0.7, 40);
      barrier.castShadow = true;
      scene.add(barrier);

      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(bx, 0.7, 40),
        new THREE.Vector3(2.8, 1.4, 0.5)
      );
      this.colliders.push({ box, type: 'BARRICADE' });
    });
  }

  public createFrenchCRSRiotVan(
    scene: THREE.Scene,
    x: number,
    z: number,
    rot: number,
    busId: string
  ) {
    const vanGroup = new THREE.Group();
    vanGroup.position.set(x, 0, z);
    vanGroup.rotation.y = rot;

    const vanLength = 9.8;
    const vanWidth = 3.0;
    const vanHeight = 3.3;

    const crsNavy = new THREE.MeshStandardMaterial({ color: 0x0f2852, roughness: 0.35, metalness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(vanWidth, vanHeight - 0.4, vanLength), crsNavy);
    body.position.y = vanHeight / 2 + 0.4;
    body.castShadow = true;
    vanGroup.add(body);

    // CRS White Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(vanWidth + 0.05, 0.4, vanLength), whiteMat);
    stripe.position.y = 1.8;
    vanGroup.add(stripe);

    // Wheels
    [-vanWidth / 2 - 0.05, vanWidth / 2 + 0.05].forEach((wx) => {
      [-2.8, 2.8].forEach((wz) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.55, wz);
        vanGroup.add(wheel);
      });
    });

    // Flashing Blue Lightbar
    const bLight = new THREE.PointLight(0x3b82f6, 2.5, 18);
    bLight.position.set(0, vanHeight + 0.6, 3.2);
    vanGroup.add(bLight);
    this.policeLights.push(bLight);

    // Rear Interactive Door
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 1.5, -vanLength / 2 - 0.05);
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 0.1), whiteMat);
    doorGroup.add(doorPanel);
    vanGroup.add(doorGroup);
    this.busDoors.set(busId, doorGroup);

    // Dual Front Xenon Headlights
    const crsHeadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xe0f2fe,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    [-1.0, 1.0].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.1), crsHeadMat);
      lamp.position.set(hx, 1.25, vanLength / 2 + 0.02);
      vanGroup.add(lamp);
    });

    const vanSpot = new THREE.SpotLight(0xe0f2fe, 2.4, 30, Math.PI / 4, 0.4);
    vanSpot.position.set(0, 1.3, vanLength / 2 + 0.2);
    vanSpot.target.position.set(0, 0, vanLength / 2 + 18);
    vanGroup.add(vanSpot.target);
    vanGroup.add(vanSpot);

    // Dual Rear Red Taillights
    const crsTailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    [-1.05, 1.05].forEach((tx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.1), crsTailMat);
      lamp.position.set(tx, 1.35, -vanLength / 2 - 0.02);
      vanGroup.add(lamp);
    });

    scene.add(vanGroup);

    this.busPositions.push({ x, y: 0, z, id: busId });

    const cosR = Math.abs(Math.cos(rot));
    const sinR = Math.abs(Math.sin(rot));
    const bbX = vanWidth * cosR + vanLength * sinR;
    const bbZ = vanWidth * sinR + vanLength * cosR;

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, vanHeight / 2, z),
      new THREE.Vector3(bbX, vanHeight, bbZ)
    );
    this.colliders.push({ box, type: 'BUS', interactiveId: busId });
  }

  private createFrenchWaterCannonTruck(scene: THREE.Scene, x: number, z: number) {
    const truckGroup = new THREE.Group();
    truckGroup.position.set(x, 0, z);

    const length = 9.6;
    const width = 3.2;
    const height = 3.4;

    const crsNavy = new THREE.MeshStandardMaterial({ color: 0x0f2852, roughness: 0.35, metalness: 0.45 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.85 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.95 });

    // Armored Lower Hull & Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.5, length), steelMat);
    chassis.position.y = 0.65;
    truckGroup.add(chassis);

    // Main Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.8, length), crsNavy);
    body.position.y = height / 2 + 0.2;
    body.castShadow = true;
    body.receiveShadow = true;
    truckGroup.add(body);

    // Reinforced Cabin with Slanted Windshield
    const wind = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 1.1, 0.15), glassMat);
    wind.position.set(0, 2.4, length / 2 - 0.1);
    wind.rotation.x = -0.2;
    truckGroup.add(wind);

    // Heavy Front Wire-Mesh Protective Screen
    const wire = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.25, 1.15, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x000000, wireframe: true })
    );
    wire.position.set(0, 2.4, length / 2 - 0.04);
    wire.rotation.x = -0.2;
    truckGroup.add(wire);

    // Rooftop Water Cannon Turret
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.5, 12), steelMat);
    turret.position.set(0, height + 0.1, length / 2 - 1.2);
    truckGroup.add(turret);

    const cannonNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.8, 8), steelMat);
    cannonNozzle.rotation.x = Math.PI / 2.2;
    cannonNozzle.position.set(0, height + 0.4, length / 2 - 0.4);
    truckGroup.add(cannonNozzle);

    // 6 Heavy Off-Road Wheels
    [-width / 2 - 0.05, width / 2 + 0.05].forEach((wx) => {
      [-2.8, 0, 2.8].forEach((wz) => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 0.45, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.6, wz);
        wheel.castShadow = true;
        truckGroup.add(wheel);
      });
    });

    // Dual Front Heavy Headlights
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    [-1.1, 1.1].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.1), headMat);
      lamp.position.set(hx, 1.3, length / 2 + 0.02);
      truckGroup.add(lamp);
    });

    const frontSpot = new THREE.SpotLight(0xfffbeb, 2.5, 35, Math.PI / 4, 0.4);
    frontSpot.position.set(0, 1.4, length / 2 + 0.2);
    frontSpot.target.position.set(0, 0, length / 2 + 18);
    truckGroup.add(frontSpot.target);
    truckGroup.add(frontSpot);

    // Dual Rear Red Taillights
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    [-1.15, 1.15].forEach((tx) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.1), tailMat);
      lamp.position.set(tx, 1.4, -length / 2 - 0.02);
      truckGroup.add(lamp);
    });

    // Flashing Emergency French Blue Beacon
    const bLight = new THREE.PointLight(0x3b82f6, 2.5, 18);
    bLight.position.set(0, height + 0.7, 0);
    truckGroup.add(bLight);
    this.policeLights.push(bLight);

    scene.add(truckGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width, height, length)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  private createMorrisColumns(scene: THREE.Scene) {
    const mPositions = [
      { x: -38, z: -25 },
      { x: 38, z: -25 },
      { x: -38, z: 25 },
      { x: 38, z: 25 },
    ];
    mPositions.forEach((p) => {
      const col = new THREE.Group();
      col.position.set(p.x, 0, p.z);

      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 1.3, 4.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.6 })
      );
      barrel.position.y = 2.4;
      barrel.castShadow = true;
      col.add(barrel);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      dome.position.y = 4.8;
      col.add(dome);

      scene.add(col);

      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(p.x, 2.4, p.z),
        new THREE.Vector3(2.8, 5.5, 2.8)
      );
      this.colliders.push({ box, type: 'WALL' });
    });
  }

  private createParisProtestStage(scene: THREE.Scene) {
    const stageGroup = new THREE.Group();
    stageGroup.position.set(0, 0, 35);

    // Platform Base & Dark Industrial Trusses
    const stage = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.2, 10),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.25 })
    );
    stage.position.y = 0.6;
    stage.castShadow = true;
    stage.receiveShadow = true;
    stageGroup.add(stage);

    // Giant Paris Rally Backdrop Banner
    const bannerGeo = new THREE.PlaneGeometry(16, 5);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1024, 320);
      grad.addColorStop(0, '#002654');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#ed2939');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 320);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px Outfit, sans-serif';
      ctx.fillText('LIBERTÉ • ÉGALITÉ • FRATERNITÉ', 512, 110);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 28px Outfit, sans-serif';
      ctx.fillText('PEUPLE DE PARIS — RASSEMBLEMENT CLIMATIQUE & SOCIAL', 512, 175);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 20px Space Grotesk, monospace';
      ctx.fillText('#BastilleDebout #Paris2026 #GenerationClimat', 512, 250);
    }
    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 4.2, -4.8);
    stageGroup.add(bannerMesh);

    // Two French Tricolore Flags billowing on stage flanks
    const flagTex = TextureGenerator.getFrenchFlagTexture();
    const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.5 });
    [-7.5, 7.5].forEach((fx) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 6.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
      );
      pole.position.set(fx, 4.2, -4.5);
      stageGroup.add(pole);

      const flagGeo = new THREE.PlaneGeometry(2.4, 1.6, 8, 6);
      const isRight = fx > 0;
      flagGeo.translate(isRight ? -1.2 : 1.2, 0, 0);
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(fx, 6.5, -4.5);
      stageGroup.add(flag);
      this.addAnimatedFlag(flag, 4.2, 2.0, 0.24);
    });

    // Sound System Speakers
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
      new THREE.Vector3(0, 0.6, 35),
      new THREE.Vector3(18, 1.2, 10)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  private createParisPlacards(scene: THREE.Scene) {
    // Parisian slogans
  }

  private createParisLighting(scene: THREE.Scene) {
    // Directional Paris Sunlight & Ambient Light for soft shadows & realistic tone mapping
    this.ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 2.4);
    this.sunLight.position.set(45, 65, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0004;

    const d = 95;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    scene.add(this.sunLight);

    const lampPositions = [
      { x: -28, z: -28 },
      { x: 28, z: -28 },
      { x: -28, z: 28 },
      { x: 28, z: 28 },
    ];
    lampPositions.forEach((pos) => {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.2, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));
      lamp.position.set(pos.x, 3.1, pos.z);
      scene.add(lamp);

      const light = new THREE.PointLight(0xffeedd, 1.4, 20);
      light.position.set(pos.x, 6.0, pos.z);
      scene.add(light);
    });
  }

  private createParisBoulevardRoadways(scene: THREE.Scene) {
    const { map: roadTex, roughnessMap: roadRough } = TextureGenerator.getGTABoulevardRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughnessMap: roadRough,
      roughness: 0.6,
      metalness: 0.15,
    });

    // Boulevard Henri IV (South)
    const southRoad = new THREE.Mesh(new THREE.PlaneGeometry(150, 18), roadMat);
    southRoad.rotation.x = -Math.PI / 2;
    southRoad.position.set(0, 0.03, 62);
    southRoad.receiveShadow = true;
    scene.add(southRoad);

    // Boulevard Beaumarchais (North)
    const northRoad = new THREE.Mesh(new THREE.PlaneGeometry(150, 18), roadMat);
    northRoad.rotation.x = -Math.PI / 2;
    northRoad.position.set(0, 0.03, -62);
    northRoad.receiveShadow = true;
    scene.add(northRoad);

    // Zebra Crosswalks
    const crosswalkTex = TextureGenerator.getZebraCrosswalkTexture();
    const cwMat = new THREE.MeshStandardMaterial({
      map: crosswalkTex,
      transparent: true,
      roughness: 0.8,
    });

    [-35, 0, 35].forEach((cx) => {
      const cwSouth = new THREE.Mesh(new THREE.PlaneGeometry(6, 16), cwMat);
      cwSouth.rotation.x = -Math.PI / 2;
      cwSouth.position.set(cx, 0.04, 62);
      cwSouth.receiveShadow = true;
      scene.add(cwSouth);

      const cwNorth = new THREE.Mesh(new THREE.PlaneGeometry(6, 16), cwMat);
      cwNorth.rotation.x = -Math.PI / 2;
      cwNorth.position.set(cx, 0.04, -62);
      cwNorth.receiveShadow = true;
      scene.add(cwNorth);
    });

    // Granite Sidewalk Curbs separating road from cobblestone plaza
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const southCurb = new THREE.Mesh(new THREE.BoxGeometry(150, 0.28, 0.6), curbMat);
    southCurb.position.set(0, 0.14, 52.8);
    southCurb.receiveShadow = true;
    scene.add(southCurb);

    const northCurb = new THREE.Mesh(new THREE.BoxGeometry(150, 0.28, 0.6), curbMat);
    northCurb.position.set(0, 0.14, -52.8);
    northCurb.receiveShadow = true;
    scene.add(northCurb);
  }

  public createParisianMarronnierTree(scene: THREE.Scene, x: number, z: number, scale = 1.0) {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    tGroup.scale.set(scale, scale, scale);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 6, 8), new THREE.MeshStandardMaterial({ color: 0x3f2e21 }));
    trunk.position.y = 3;
    trunk.castShadow = true;
    tGroup.add(trunk);

    const leafTex = TextureGenerator.getDeciduousCanopyTexture();
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 8), new THREE.MeshStandardMaterial({ map: leafTex, roughness: 0.7 }));
    canopy.position.y = 6.8;
    canopy.castShadow = true;
    tGroup.add(canopy);

    scene.add(tGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 3, z),
      new THREE.Vector3(1.2 * scale, 6 * scale, 1.2 * scale)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  private createParisStreetDressings(scene: THREE.Scene) {
    // Parisian Horse-Chestnut Trees along boulevard
    const trees = [
      { x: -48, z: 52 },
      { x: -24, z: 52 },
      { x: 24, z: 52 },
      { x: 48, z: 52 },
    ];
    trees.forEach((t) => this.createParisianMarronnierTree(scene, t.x, t.z));

    // Authentic Parisian Bistro Brass Plaque Sign
    const signTex = TextureGenerator.getHeritageSignTexture('PARIS_CAFE');
    const bistroSign = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 1.8),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3, metalness: 0.4 })
    );
    bistroSign.position.set(0, 6.5, -67);
    scene.add(bistroSign);
  }
}
