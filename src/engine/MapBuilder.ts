import * as THREE from 'three';

export interface Collider {
  box: THREE.Box3;
  type: 'WALL' | 'BARRICADE' | 'BUS' | 'RAMP';
  interactiveId?: string;
}

export class MapBuilder {
  public colliders: Collider[] = [];
  public busPositions: { x: number; y: number; z: number; id: string }[] = [];
  public stagePosition: THREE.Vector3 = new THREE.Vector3(0, 0, 35);

  /**
   * Builds the entire 3D Jantar Mantar observatory and protest plaza
   */
  public buildJantarMantar(scene: THREE.Scene): { colliders: Collider[]; busPositions: any[] } {
    this.colliders = [];
    this.busPositions = [];

    // Materials
    const sandstoneRedMat = new THREE.MeshStandardMaterial({
      color: 0xba4336, // Authentic Jaipur/Delhi red sandstone
      roughness: 0.85,
      metalness: 0.1,
    });

    const marbleWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf3ece0, // White marble graduation markings
      roughness: 0.6,
      metalness: 0.05,
    });

    const pavementMat = new THREE.MeshStandardMaterial({
      color: 0xd6c2a8, // Warm beige flagstones
      roughness: 0.9,
    });

    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x477839, // Green Delhi garden grass
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

    // 8. Plaza Streetlights and Atmospheric Spotlights
    this.createPlazaLighting(scene);

    return {
      colliders: this.colliders,
      busPositions: this.busPositions,
    };
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
    const wallH = 4;
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

    // Triangular Gnomon using ExtrudeGeometry
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

    // Marble central calibration strip
    const stripGeo = new THREE.BoxGeometry(0.8, height * 1.1, 0.1);
    const stripMesh = new THREE.Mesh(stripGeo, marbleMat);
    stripMesh.position.set(0, height / 2, 0);
    stripMesh.rotation.x = Math.atan2(height, length);
    yantraGroup.add(stripMesh);

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

    // Add Collider for the central gnomon
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

    // Outer circular segmented walls with arch openings
    for (let i = 0; i < numSections; i++) {
      if (i % 2 === 0) {
        // Wall segment
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

    // Central Pillar
    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, wallHeight, 16);
    const pillarMesh = new THREE.Mesh(pillarGeo, marbleMat);
    pillarMesh.position.y = wallHeight / 2;
    pillarMesh.castShadow = true;
    ramGroup.add(pillarMesh);

    scene.add(ramGroup);

    // Box collider for Ram Yantra
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
      bowlMesh.rotation.x = Math.PI; // Invert to form concave bowl
      bowlMesh.receiveShadow = true;
      scene.add(bowlMesh);

      // Walkway crossing
      const bridgeGeo = new THREE.BoxGeometry(11, 0.4, 1.2);
      const bridgeMesh = new THREE.Mesh(bridgeGeo, marbleMat);
      bridgeMesh.position.set(x + offsetX, 0.25, z);
      bridgeMesh.receiveShadow = true;
      scene.add(bridgeMesh);
    });
  }

  /**
   * Gen-Z Protest Stage with Stage Banners, Fairy Lights & Speakers
   */
  private createProtestStage(scene: THREE.Scene) {
    const stageGroup = new THREE.Group();
    stageGroup.position.copy(this.stagePosition);

    // Stage Platform
    const stageGeo = new THREE.BoxGeometry(18, 1.2, 10);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.8 });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = 0.6;
    stageMesh.castShadow = true;
    stageMesh.receiveShadow = true;
    stageGroup.add(stageMesh);

    // Backstage Truss & Giant Backdrop Banner
    const bannerGeo = new THREE.PlaneGeometry(16, 5);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Vibrant Gradient
      const grad = ctx.createLinearGradient(0, 0, 1024, 320);
      grad.addColorStop(0, '#ff007a');
      grad.addColorStop(0.5, '#7928ca');
      grad.addColorStop(1, '#00f0ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 320);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡️ AWAAZ: VOICES OF JANTAR MANTAR ⚡️', 512, 100);
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillText('NON-VIOLENT • UNITED • YOUTH FOR CLIMATE & FUTURE', 512, 180);
      ctx.font = 'italic 28px Space Grotesk, monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('#GenZActivism #RaiseYourVoice #DelhiUnited', 512, 250);
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

    // Add stage collider
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.stagePosition.x, 0.6, this.stagePosition.z),
      new THREE.Vector3(18, 1.2, 10)
    );
    this.colliders.push({ box, type: 'WALL' });
  }

  /**
   * Delhi Police Encampment: Yellow Barricades, Detainment Buses, Water Cannon Truck
   */
  private createPoliceCamp(scene: THREE.Scene) {
    // 1. Two Blue DTC/Delhi Police Detainment Buses parked at the main gate
    this.createDetainmentBus(scene, -22, 55, Math.PI / 12, 'BUS_ALPHA');
    this.createDetainmentBus(scene, 22, 55, -Math.PI / 12, 'BUS_BRAVO');

    // 2. Water Cannon Truck "Varun" parked centrally behind perimeter
    this.createWaterCannonTruck(scene, 0, 62);

    // 3. Staggered Delhi Police Barricades forming dynamic corridors
    const barricadeSpecs = [
      { x: -14, z: 42, rot: 0.1 },
      { x: -6, z: 42, rot: -0.05 },
      { x: 6, z: 42, rot: 0.05 },
      { x: 14, z: 42, rot: -0.1 },
      // Side flank barricades
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
   * Detainment Prisoner Transport Bus (with openable rear rescue hatch)
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

    // Bus Body (Delhi Police Deep Blue & Yellow Accent)
    const bodyGeo = new THREE.BoxGeometry(busWidth, busHeight, busLength);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Police Blue
      roughness: 0.4,
      metalness: 0.2,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = busHeight / 2 + 0.6;
    bodyMesh.castShadow = true;
    busGroup.add(bodyMesh);

    // Yellow stripe on bus side
    const stripeGeo = new THREE.BoxGeometry(busWidth + 0.05, 0.4, busLength);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
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

    // Rear Emergency Jailbreak Door (Target for Rescue)
    const doorGeo = new THREE.BoxGeometry(1.6, 2.4, 0.3);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red emergency latch
      roughness: 0.3,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(0, 1.8, -busLength / 2 - 0.05);
    busGroup.add(doorMesh);

    // Top Siren Beacon
    const sirenGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12);
    const sirenMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
    });
    const sirenMesh = new THREE.Mesh(sirenGeo, sirenMat);
    sirenMesh.position.set(0, busHeight + 0.7, 3.5);
    busGroup.add(sirenMesh);

    scene.add(busGroup);

    // Record bus location for rescue mechanics
    this.busPositions.push({ x, y: 0, z, id: busId });

    // Collider
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, busHeight / 2, z),
      new THREE.Vector3(busWidth, busHeight, busLength)
    );
    this.colliders.push({ box, type: 'BUS', interactiveId: busId });
  }

  /**
   * Water Cannon Truck "Varun"
   */
  private createWaterCannonTruck(scene: THREE.Scene, x: number, z: number) {
    const truckGroup = new THREE.Group();
    truckGroup.position.set(x, 0, z);

    // Chassis
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

    // Stencil Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Yellow background
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, 512, 128);
      // Black diagonal stripes
      ctx.fillStyle = '#18181b';
      for (let i = -100; i < 600; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 30, 0);
        ctx.lineTo(i - 20, 128);
        ctx.lineTo(i - 50, 128);
        ctx.fill();
      }
      // Text
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

    // Tubular legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, height + 0.3, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8 });
    [-width / 2 + 0.1, width / 2 - 0.1].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, (height + 0.3) / 2, 0);
      barricadeGroup.add(leg);

      // Base foot
      const footGeo = new THREE.BoxGeometry(0.12, 0.1, 0.8);
      const foot = new THREE.Mesh(footGeo, legMat);
      foot.position.set(lx, 0.05, 0);
      barricadeGroup.add(foot);
    });

    scene.add(barricadeGroup);

    // Barricade Collider
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width, height, 0.8)
    );
    this.colliders.push({ box, type: 'BARRICADE' });

    return barricadeGroup;
  }

  /**
   * Plaza Lighting: Ambient warm golden-hour sun, dusk spotlights
   */
  private createPlazaLighting(scene: THREE.Scene) {
    // Golden Hour Directional Sunlight
    const sunLight = new THREE.DirectionalLight(0xfff1dc, 1.8);
    sunLight.position.set(45, 50, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -65;
    sunLight.shadow.camera.right = 65;
    sunLight.shadow.camera.top = 65;
    sunLight.shadow.camera.bottom = -65;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm Ambient Fill Light
    const ambientLight = new THREE.AmbientLight(0x718096, 0.7);
    scene.add(ambientLight);

    // Stage Spotlights (Cyan & Magenta for Gen-Z concert vibes)
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

    // Police Beacon Spotlights (Alternating Red and Blue)
    const policeBlueSpot = new THREE.PointLight(0x2563eb, 2.5, 35);
    policeBlueSpot.position.set(-22, 6, 55);
    scene.add(policeBlueSpot);

    const policeRedSpot = new THREE.PointLight(0xef4444, 2.5, 35);
    policeRedSpot.position.set(22, 6, 55);
    scene.add(policeRedSpot);
  }
}
