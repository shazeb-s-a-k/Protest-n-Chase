import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator for AAA-Grade Stylized Realism
 * Produces detailed diffuse maps, bump maps, and material presets
 */
export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Generates a rich, textured Asphalt Road surface with tar seams & aggregate noise
   */
  public static getAsphaltTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const mapKey = 'asphalt_diffuse';
    const bumpKey = 'asphalt_bump';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {
      return { map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! };
    }

    const size = 512;
    // 1. Diffuse Canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark charcoal base
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(0, 0, size, size);

    // Aggregate gravel noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 28;
      const speckle = Math.random() < 0.04 ? (Math.random() * 40) : 0;
      data[i] = Math.min(255, Math.max(0, data[i] + noise + speckle));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + speckle));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + speckle));
    }
    ctx.putImageData(imgData, 0, 0);

    // Tar wear cracks
    ctx.strokeStyle = 'rgba(10, 12, 16, 0.45)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      let cx = Math.random() * size;
      let cy = Math.random() * size;
      ctx.moveTo(cx, cy);
      for (let j = 0; j < 5; j++) {
        cx += (Math.random() - 0.5) * 40;
        cy += (Math.random() - 0.5) * 40;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(16, 16);

    // 2. Bump Canvas
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);

    const bImgData = bCtx.getImageData(0, 0, 256, 256);
    const bData = bImgData.data;
    for (let i = 0; i < bData.length; i += 4) {
      const val = 128 + (Math.random() - 0.5) * 45;
      bData[i] = val;
      bData[i + 1] = val;
      bData[i + 2] = val;
    }
    bCtx.putImageData(bImgData, 0, 0);

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(16, 16);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);

    return { map: diffuseTex, bumpMap: bumpTex };
  }

  /**
   * Generates authentic Delhi sandstone & flagstone texture with stone blocks and mortar
   */
  public static getSandstoneFlagstoneTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const mapKey = 'sandstone_diffuse';
    const bumpKey = 'sandstone_bump';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {
      return { map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! };
    }

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Warm terracotta sandstone base
    ctx.fillStyle = '#b84638';
    ctx.fillRect(0, 0, size, size);

    // Stone blocks grid with randomized hues
    const rows = 8;
    const cols = 8;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
      const offsetX = r % 2 === 0 ? 0 : cellW / 2;
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + offsetX;
        const y = r * cellH;

        // Individual stone tone
        const toneVar = (Math.random() - 0.5) * 20;
        const red = Math.min(210, Math.max(160, 185 + toneVar));
        const green = Math.min(90, Math.max(55, 70 + toneVar * 0.5));
        const blue = Math.min(75, Math.max(45, 58 + toneVar * 0.4));

        ctx.fillStyle = `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Chiseled stone inner bevel
        ctx.strokeStyle = 'rgba(255, 200, 180, 0.15)';
        ctx.strokeRect(x + 3, y + 3, cellW - 6, cellH - 6);

        // Deep mortar shadow
        ctx.strokeStyle = 'rgba(50, 18, 14, 0.65)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, cellW, cellH);
      }
    }

    // Micro-grain sediment
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
    }
    ctx.putImageData(imgData, 0, 0);

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(12, 12);

    // Bump texture
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);

    for (let r = 0; r < 4; r++) {
      const offsetX = r % 2 === 0 ? 0 : 32;
      for (let c = -1; c <= 4; c++) {
        bCtx.fillStyle = '#a0a0a0';
        bCtx.fillRect(c * 64 + offsetX + 2, r * 64 + 2, 60, 60);
        bCtx.strokeStyle = '#202020';
        bCtx.lineWidth = 4;
        bCtx.strokeRect(c * 64 + offsetX, r * 64, 64, 64);
      }
    }
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(12, 12);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);

    return { map: diffuseTex, bumpMap: bumpTex };
  }

  /**
   * Generates high-detail Parisian cobblestones with rounded convex stones & deep mortar
   */
  public static getParisCobblestoneTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const mapKey = 'paris_cobble_diffuse';
    const bumpKey = 'paris_cobble_bump';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {
      return { map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! };
    }

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep wet slate mortar
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(0, 0, size, size);

    const stoneSize = 32;
    for (let y = 0; y < size; y += stoneSize) {
      const offsetX = (y / stoneSize) % 2 === 0 ? 0 : stoneSize / 2;
      for (let x = -stoneSize / 2; x < size + stoneSize; x += stoneSize) {
        const posX = x + offsetX;

        // Radial gradient for rounded 3D stone cushion
        const grad = ctx.createRadialGradient(
          posX + stoneSize * 0.45,
          y + stoneSize * 0.4,
          2,
          posX + stoneSize / 2,
          y + stoneSize / 2,
          stoneSize * 0.55
        );

        const randTone = Math.random();
        if (randTone < 0.3) {
          grad.addColorStop(0, '#4b5563');
          grad.addColorStop(0.7, '#2d3748');
          grad.addColorStop(1, '#111827');
        } else if (randTone < 0.7) {
          grad.addColorStop(0, '#3f495a');
          grad.addColorStop(0.7, '#242e3d');
          grad.addColorStop(1, '#0e1520');
        } else {
          grad.addColorStop(0, '#525e73');
          grad.addColorStop(0.7, '#333e50');
          grad.addColorStop(1, '#151d28');
        }

        ctx.fillStyle = grad;
        // Rounded rectangle stone
        const radius = 6;
        const w = stoneSize - 4;
        const h = stoneSize - 4;
        const rx = posX + 2;
        const ry = y + 2;

        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.arcTo(rx + w, ry, rx + w, ry + h, radius);
        ctx.arcTo(rx + w, ry + h, rx, ry + h, radius);
        ctx.arcTo(rx, ry + h, rx, ry, radius);
        ctx.arcTo(rx, ry, rx + w, ry, radius);
        ctx.closePath();
        ctx.fill();

        // Top specular glint (wet cobblestone look)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.ellipse(posX + stoneSize * 0.42, y + stoneSize * 0.35, 4, 2.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(18, 18);

    // Bump map for 3D displacement
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#101010';
    bCtx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 16) {
      const offsetX = (y / 16) % 2 === 0 ? 0 : 8;
      for (let x = -8; x < 256 + 8; x += 16) {
        const grad = bCtx.createRadialGradient(x + offsetX + 8, y + 8, 1, x + offsetX + 8, y + 8, 8);
        grad.addColorStop(0, '#f0f0f0');
        grad.addColorStop(0.8, '#707070');
        grad.addColorStop(1, '#151515');
        bCtx.fillStyle = grad;
        bCtx.fillRect(x + offsetX + 1, y + 1, 14, 14);
      }
    }

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(18, 18);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);

    return { map: diffuseTex, bumpMap: bumpTex };
  }

  /**
   * Generates fabric weave normal/bump texture for cotton hoodies, denim pants, and jackets
   */
  public static getFabricBumpTexture(): THREE.CanvasTexture {
    const key = 'fabric_bump';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates ballistic Kevlar tactical armor bump texture with diamond/hex weave
   */
  public static getTacticalKevlarTexture(): THREE.CanvasTexture {
    const key = 'kevlar_bump';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#777777';
    for (let y = 0; y < size; y += 8) {
      for (let x = 0; x < size; x += 8) {
        if ((x / 8 + y / 8) % 2 === 0) {
          ctx.fillRect(x + 1, y + 1, 6, 6);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a GTA Vice City style 2-Lane Boulevard Asphalt road with
   * double center yellow stripes, white dashed lane dividers, and edge shoulder lines
   */
  public static getGTABoulevardRoadTexture(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
    const mapKey = 'gta_road_diffuse';
    const roughKey = 'gta_road_roughness';
    if (this.cache.has(mapKey) && this.cache.has(roughKey)) {
      return { map: this.cache.get(mapKey)!, roughnessMap: this.cache.get(roughKey)! };
    }

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. Dark weathered asphalt base
    ctx.fillStyle = '#181b22';
    ctx.fillRect(0, 0, size, size);

    // Fine gravel aggregate
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 26;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    // 2. White outer shoulder stripes
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(20, 0, 8, size);
    ctx.fillRect(size - 28, 0, 8, size);

    // 3. Double Solid Center Yellow Lines (Iconic GTA road markings)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(size / 2 - 10, 0, 6, size);
    ctx.fillRect(size / 2 + 4, 0, 6, size);

    // 4. White dashed lane dividers for multi-lane boulevards
    ctx.fillStyle = '#cbd5e1';
    for (let y = 0; y < size; y += 64) {
      ctx.fillRect(135, y, 5, 36);
      ctx.fillRect(size - 140, y, 5, 36);
    }

    // 5. Weathering, oil drips, and tire skid marks
    ctx.strokeStyle = 'rgba(10, 10, 14, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(size / 2 - 60, 0);
    ctx.lineTo(size / 2 - 60, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size / 2 + 60, 0);
    ctx.lineTo(size / 2 + 60, size);
    ctx.stroke();

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(1, 10);

    // Roughness / Specular Puddle Canvas (Wet puddle patches reflect sky/neon)
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 256;
    rCanvas.height = 256;
    const rCtx = rCanvas.getContext('2d')!;
    rCtx.fillStyle = '#b0b0b0'; // matte asphalt
    rCtx.fillRect(0, 0, 256, 256);

    // Wet reflective puddle patches
    rCtx.fillStyle = '#101010'; // very glossy/reflective
    for (let p = 0; p < 8; p++) {
      const px = Math.random() * 256;
      const py = Math.random() * 256;
      const pr = 12 + Math.random() * 18;
      rCtx.beginPath();
      rCtx.arc(px, py, pr, 0, Math.PI * 2);
      rCtx.fill();
    }
    const roughTex = new THREE.CanvasTexture(rCanvas);
    roughTex.wrapS = THREE.RepeatWrapping;
    roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(1, 10);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(roughKey, roughTex);

    return { map: diffuseTex, roughnessMap: roughTex };
  }

  /**
   * Generates a high-detail Pedestrian Crosswalk (Zebra crossing)
   */
  public static getZebraCrosswalkTexture(): THREE.CanvasTexture {
    const key = 'zebra_crosswalk';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#f8fafc';
    const barWidth = 32;
    for (let x = 16; x < 256; x += 64) {
      ctx.fillRect(x, 15, barWidth, 226);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates tropical palm tree textured trunk bark
   */
  public static getPalmBarkTexture(): THREE.CanvasTexture {
    const key = 'palm_bark';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Rich warm fibrous palm brown
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 128, 256);

    // Horizontal ridge rings
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 4;
    for (let y = 0; y < 256; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(64, y + 6, 128, y);
      ctx.stroke();

      // Fibrous flecks
      ctx.fillStyle = '#b45309';
      ctx.fillRect(Math.random() * 128, y + 2, 4, 8);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates vibrant tropical palm frond leaf blades
   */
  public static getPalmFrondTexture(): THREE.CanvasTexture {
    const key = 'palm_frond';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 128, 256);

    // Central golden palm spine
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(64, 256);
    ctx.quadraticCurveTo(64, 128, 64, 0);
    ctx.stroke();

    // Feathered green leaflet blades
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.5;
    for (let y = 20; y < 250; y += 6) {
      const spread = (1 - y / 256) * 52;
      // Left leaf
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.lineTo(64 - spread, y - 10);
      ctx.stroke();

      // Right leaf
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.lineTo(64 + spread, y - 10);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates glowing neon signage tube canvas texture for Vice City storefronts
   */
  public static getNeonSignTexture(title: string, glowColor: string, subTitle?: string): THREE.CanvasTexture {
    const key = `neon_${title}_${glowColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // Dark sleek backing plate
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 160);

    // Metallic frame
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 148);

    // Outer neon glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = glowColor;
    ctx.font = '900 44px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 75);

    // Inner bright neon tube core
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 256, 75);

    if (subTitle) {
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(subTitle, 256, 125);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates authentic Dholpur Red Sandstone (Jaipur/Delhi heritage monument stone)
   */
  public static getIndianRedSandstoneTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const mapKey = 'indian_red_sandstone_diffuse';
    const bumpKey = 'indian_red_sandstone_bump';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {
      return { map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! };
    }

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Rich terracotta red Dholpur sandstone base
    ctx.fillStyle = '#9e3223';
    ctx.fillRect(0, 0, size, size);

    // Natural geological sediment stratification lines
    for (let y = 0; y < size; y += 8) {
      const alpha = 0.08 + Math.random() * 0.12;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(180, 70, 50, ${alpha})` : `rgba(80, 20, 15, ${alpha})`;
      ctx.fillRect(0, y + (Math.random() - 0.5) * 4, size, 4 + Math.random() * 6);
    }

    // Hand-chiseled stone block seams
    const rows = 8;
    const cols = 4;
    const cellH = size / rows;
    const cellW = size / cols;
    ctx.lineWidth = 2.5;

    for (let r = 0; r < rows; r++) {
      const offsetX = r % 2 === 0 ? 0 : cellW / 2;
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + offsetX;
        const y = r * cellH;

        // Subtle block-to-block iron oxide tint variance
        const tint = (Math.random() - 0.5) * 22;
        ctx.fillStyle = `rgba(${Math.round(160 + tint)}, ${Math.round(52 + tint * 0.4)}, ${Math.round(36 + tint * 0.3)}, 0.35)`;
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Mortar groove
        ctx.strokeStyle = 'rgba(40, 12, 8, 0.7)';
        ctx.strokeRect(x, y, cellW, cellH);

        // Chiseled edge highlight
        ctx.strokeStyle = 'rgba(230, 130, 110, 0.25)';
        ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
      }
    }

    // Micro mineral grain
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 22;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 0.6));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 0.5));
    }
    ctx.putImageData(imgData, 0, 0);

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(4, 4);

    // Bump Map
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);

    for (let r = 0; r < 4; r++) {
      const offsetX = r % 2 === 0 ? 0 : 32;
      for (let c = -1; c <= 4; c++) {
        bCtx.fillStyle = '#a8a8a8';
        bCtx.fillRect(c * 64 + offsetX + 2, r * 64 + 2, 60, 60);
        bCtx.strokeStyle = '#202020';
        bCtx.lineWidth = 4;
        bCtx.strokeRect(c * 64 + offsetX, r * 64, 64, 64);
      }
    }
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(4, 4);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);
    return { map: diffuseTex, bumpMap: bumpTex };
  }

  /**
   * Generates Dholpur Cream/Buff Sandstone for Parliament Colonnades & Cornices
   */
  public static getDholpurBuffSandstoneTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const mapKey = 'dholpur_buff_diffuse';
    const bumpKey = 'dholpur_buff_bump';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {
      return { map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! };
    }

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Warm golden cream stone
    ctx.fillStyle = '#e4d2b3';
    ctx.fillRect(0, 0, size, size);

    // Fluting & stone block lines
    ctx.strokeStyle = 'rgba(120, 95, 70, 0.35)';
    ctx.lineWidth = 2;
    for (let x = 0; x < size; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();

      // Fluting shading
      ctx.fillStyle = 'rgba(100, 75, 50, 0.08)';
      ctx.fillRect(x + 2, 0, 14, size);
      ctx.fillStyle = 'rgba(255, 245, 230, 0.15)';
      ctx.fillRect(x + 16, 0, 14, size);
    }

    // Horizontal block courses
    ctx.strokeStyle = 'rgba(90, 70, 50, 0.5)';
    ctx.lineWidth = 3;
    for (let y = 0; y < size; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(4, 4);

    // Bump
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);
    bCtx.strokeStyle = '#303030';
    bCtx.lineWidth = 3;
    for (let y = 0; y < 256; y += 32) {
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(256, y);
      bCtx.stroke();
    }
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(4, 4);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);
    return { map: diffuseTex, bumpMap: bumpTex };
  }

  /**
   * Generates Makrana White Marble with Astronomical Calibration Engravings
   */
  public static getMakranaMarbleTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const mapKey = 'makrana_marble_diffuse';
    const bumpKey = 'makrana_marble_bump';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {
      return { map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! };
    }

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Pure Makrana white base
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, size, size);

    // Delicate grey crystalline veins
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      let vx = Math.random() * size;
      let vy = Math.random() * size;
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 6; s++) {
        vx += (Math.random() - 0.4) * 70;
        vy += (Math.random() - 0.5) * 50;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    // Celestial scale calibration lines & astronomical ticks
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < size; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      const isMajor = y % 64 === 0;
      ctx.lineTo(isMajor ? 48 : 24, y);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.font = 'bold 12px Space Grotesk, sans-serif';
        ctx.fillText(`${(y / 64) * 15}°`, 52, y + 4);
      }
    }

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(2, 6);

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);
    bCtx.strokeStyle = '#202020';
    bCtx.lineWidth = 2;
    for (let y = 0; y < 256; y += 8) {
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(24, y);
      bCtx.stroke();
    }
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(2, 6);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);
    return { map: diffuseTex, bumpMap: bumpTex };
  }

  /**
   * Generates Manicured Mughal Charbagh Garden Lawn Texture with Mowing Stripes
   */
  public static getMughalGardenLawnTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const mapKey = 'mughal_lawn_diffuse';
    const bumpKey = 'mughal_lawn_bump';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {
      return { map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! };
    }

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Alternating mower roller stripes
    const stripeW = 64;
    for (let x = 0; x < size; x += stripeW) {
      const isDark = (x / stripeW) % 2 === 0;
      ctx.fillStyle = isDark ? '#2a692a' : '#378237';
      ctx.fillRect(x, 0, stripeW, size);
    }

    // Grass blade noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const bladeNoise = (Math.random() - 0.5) * 26;
      data[i] = Math.min(255, Math.max(0, data[i] + bladeNoise * 0.4));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + bladeNoise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + bladeNoise * 0.3));
    }
    ctx.putImageData(imgData, 0, 0);

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(12, 12);

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);
    const bImg = bCtx.getImageData(0, 0, 256, 256);
    const bData = bImg.data;
    for (let i = 0; i < bData.length; i += 4) {
      const n = (Math.random() - 0.5) * 55;
      bData[i] = 128 + n;
      bData[i + 1] = 128 + n;
      bData[i + 2] = 128 + n;
    }
    bCtx.putImageData(bImg, 0, 0);

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(12, 12);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);
    return { map: diffuseTex, bumpMap: bumpTex };
  }

  /**
   * Generates the Indian National Flag (Tiranga) with 24-spoke Ashoka Chakra
   */
  public static getIndianFlagTexture(): THREE.CanvasTexture {
    const key = 'indian_flag_tiranga';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    const h = 400 / 3;
    // Saffron (Kesari)
    ctx.fillStyle = '#ff9933';
    ctx.fillRect(0, 0, 600, h);

    // White
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, h, 600, h);

    // Green (India Green)
    ctx.fillStyle = '#138808';
    ctx.fillRect(0, h * 2, 600, h);

    // Ashoka Chakra (Navy Blue)
    const cx = 300;
    const cy = 200;
    const radius = 54;
    ctx.strokeStyle = '#000080';
    ctx.fillStyle = '#000080';
    ctx.lineWidth = 4.5;

    // Outer circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Central hub
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    // 24 Spokes
    ctx.lineWidth = 2.4;
    for (let s = 0; s < 24; s++) {
      const angle = (s / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates the French National Flag (Tricolore) with vertical Blue, White, and Red bands & cloth weave
   */
  public static getFrenchFlagTexture(): THREE.CanvasTexture {
    const key = 'french_flag_tricolore';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    const w = 600 / 3;
    // Blue (Bleu de France)
    ctx.fillStyle = '#002654';
    ctx.fillRect(0, 0, w, 400);

    // White
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w, 0, w, 400);

    // Red
    ctx.fillStyle = '#ed2939';
    ctx.fillRect(w * 2, 0, w, 400);

    // Subtle cloth weave grain
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let x = 0; x < 600; x += 4) {
      ctx.fillRect(x, 0, 1, 400);
    }
    for (let y = 0; y < 400; y += 4) {
      ctx.fillRect(0, y, 600, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates Authentic Heritage and Government Road Signage
   */
  public static getHeritageSignTexture(
    type: 'ASI' | 'SANSAD_MARG' | 'CENTRAL_VISTA' | 'PARIS_CAFE'
  ): THREE.CanvasTexture {
    const key = `sign_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 240;
    const ctx = canvas.getContext('2d')!;

    if (type === 'ASI') {
      // Archaeological Survey of India Official Plaque
      ctx.fillStyle = '#0f172a'; // Deep navy
      ctx.fillRect(0, 0, 640, 240);
      ctx.strokeStyle = '#d97706'; // Gold border
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 620, 220);

      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 24px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('भारतीय पुरातत्व सर्वेक्षण', 320, 52);
      ctx.font = '600 18px Outfit, sans-serif';
      ctx.fillText('ARCHAEOLOGICAL SURVEY OF INDIA', 320, 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px Outfit, sans-serif';
      ctx.fillText('जंतर मंतर • JANTAR MANTAR', 320, 140);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 18px Outfit, sans-serif';
      ctx.fillText('BUILT 1724 AD BY MAHARAJA SAWAI JAI SINGH II', 320, 180);
      ctx.fillText('MONUMENT OF NATIONAL IMPORTANCE', 320, 208);
    } else if (type === 'SANSAD_MARG') {
      // Delhi Municipal Sansad Marg Street Sign
      ctx.fillStyle = '#14532d'; // Delhi municipal dark green
      ctx.fillRect(0, 0, 640, 240);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 620, 220);

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.font = 'bold 38px Outfit, sans-serif';
      ctx.fillText('संसद मार्ग', 320, 75);
      ctx.font = '900 46px Outfit, sans-serif';
      ctx.fillText('SANSAD MARG', 320, 138);

      ctx.font = '600 22px Outfit, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('PARLIAMENT STREET • CENTRAL VISTA DISTRICT', 320, 195);
    } else if (type === 'CENTRAL_VISTA') {
      // Central Vista Directional Board
      ctx.fillStyle = '#1e3a8a'; // Deep government blue
      ctx.fillRect(0, 0, 640, 240);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 624, 224);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏛️ संसद भवन / PARLIAMENT HOUSE  ➔ 500m', 320, 70);
      ctx.fillText('🇮🇳 कर्तव्य पथ / KARTAVYA PATH  ➔ 1.2km', 320, 125);
      ctx.fillText('⭕ कनाट प्लेस / CONNAUGHT PLACE  ⬅ 600m', 320, 180);
    } else {
      // Parisian Bistro Brass Plaque
      ctx.fillStyle = '#132a13';
      ctx.fillRect(0, 0, 640, 240);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 620, 220);

      ctx.fillStyle = '#d4af37';
      ctx.textAlign = 'center';
      ctx.font = '900 36px Outfit, sans-serif';
      ctx.fillText('LE BISTROT DE LA BASTILLE', 320, 95);
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText('FONDÉ EN 1889 • PLACE DE LA BASTILLE', 320, 155);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates Dense Deciduous Foliage Texture for Neem, Jamun, and Parisian Marronniers
   */
  public static getDeciduousCanopyTexture(): THREE.CanvasTexture {
    const key = 'deciduous_foliage';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Deep forest green base
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(0, 0, 256, 256);

    // Clustered leaf lobes
    for (let i = 0; i < 400; i++) {
      const lx = Math.random() * 256;
      const ly = Math.random() * 256;
      const lr = 6 + Math.random() * 10;
      const leafTone = Math.random();
      ctx.fillStyle = leafTone > 0.6 ? '#2d6a4f' : leafTone > 0.3 ? '#40916c' : '#52b788';
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates Authentic Parisian Haussmannian Architecture Facade Texture
   * Features Lutetian limestone coursing, French arched windows with wrought-iron balconies,
   * ground floor rustication, and Parisian cafe awnings
   */
  public static getHaussmannFacadeTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const mapKey = 'haussmann_facade_diffuse';
    const bumpKey = 'haussmann_facade_bump';
    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {
      return { map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! };
    }

    const width = 512;
    const height = 512;

    // 1. Diffuse Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Creamy Parisian Lutetian limestone base
    ctx.fillStyle = '#eae2d6';
    ctx.fillRect(0, 0, width, height);

    // Stone block horizontal coursing
    ctx.strokeStyle = '#c8bdaf';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Ground floor rustication (darker limestone base & storefronts)
    ctx.fillStyle = '#3a2b22';
    ctx.fillRect(0, height - 90, width, 90);
    // Bistro / Cafe awnings
    const awningColors = ['#1e3a5f', '#7f1d1d', '#14532d', '#78350f'];
    for (let s = 0; s < 4; s++) {
      const sx = s * 128 + 10;
      ctx.fillStyle = awningColors[s % awningColors.length];
      ctx.fillRect(sx, height - 85, 108, 30);
      // Cafe name
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      const names = ['LE BASTILLE', 'CAFÉ PHARES', 'BISTROT 1789', 'BRASSERIE'];
      ctx.fillText(names[s], sx + 54, height - 66);
      // Store glass window
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx + 8, height - 52, 92, 48);
      // Window warm light reflection
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.fillRect(sx + 14, height - 46, 38, 36);
    }

    // Upper 4 floors of French windows (4 bays across)
    const floors = [
      { y: 35, h: 65, arch: true, balcony: true },  // 5th floor
      { y: 125, h: 65, arch: false, balcony: false }, // 4th floor
      { y: 215, h: 65, arch: false, balcony: false }, // 3rd floor
      { y: 305, h: 75, arch: true, balcony: true },  // 2nd floor (étage noble)
    ];

    floors.forEach((f) => {
      // Continuous black wrought iron balcony on 2nd and 5th floors
      if (f.balcony) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, f.y + f.h - 4, width, 14);
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1.5;
        for (let bx = 0; bx < width; bx += 8) {
          ctx.beginPath();
          ctx.moveTo(bx, f.y + f.h - 4);
          ctx.lineTo(bx, f.y + f.h + 10);
          ctx.stroke();
        }
      }

      for (let bay = 0; bay < 4; bay++) {
        const wx = bay * 128 + 36;
        const wy = f.y;
        const ww = 56;
        const wh = f.h;

        // Molded Stone Frame (Chambranle)
        ctx.fillStyle = '#dfd5c6';
        ctx.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);

        // Window opening (dark glass with interior warm lamp light)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(wx, wy, ww, wh);

        // Warm interior glow in some windows
        if ((bay + f.y) % 3 === 0) {
          ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
          ctx.fillRect(wx + 4, wy + 4, ww - 8, wh - 8);
        }

        // White window panes (French double casement)
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, wy, ww, wh);
        // Vertical mullion
        ctx.beginPath();
        ctx.moveTo(wx + ww / 2, wy);
        ctx.lineTo(wx + ww / 2, wy + wh);
        ctx.stroke();
        // Horizontal transoms
        ctx.beginPath();
        ctx.moveTo(wx, wy + wh * 0.35);
        ctx.lineTo(wx + ww, wy + wh * 0.35);
        ctx.moveTo(wx, wy + wh * 0.7);
        ctx.lineTo(wx + ww, wy + wh * 0.7);
        ctx.stroke();

        // Individual wrought-iron guardrail for windows without full balcony
        if (!f.balcony) {
          ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
          ctx.fillRect(wx - 4, wy + wh - 18, ww + 8, 18);
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 1.2;
          for (let rx = wx - 2; rx <= wx + ww + 2; rx += 6) {
            ctx.beginPath();
            ctx.moveTo(rx, wy + wh - 18);
            ctx.lineTo(rx, wy + wh);
            ctx.stroke();
          }
        }
      }
    });

    const diffuseTex = new THREE.CanvasTexture(canvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(12, 1);

    // 2. Bump Map Canvas
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(12, 1);

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);

    return { map: diffuseTex, bumpMap: bumpTex };
  }

  /**
   * Pre-generates 100% of PBR textures into device RAM and uploads them directly
   * into GPU VRAM units via renderer.initTexture so there are ZERO mid-game stutters!
   */
  public static async preloadAllTextures(renderer?: THREE.WebGLRenderer): Promise<void> {
    // 1. Synthesize all authentic PBR textures into persistent RAM cache
    this.getAsphaltTexture();
    this.getSandstoneFlagstoneTexture();
    this.getIndianRedSandstoneTexture();
    this.getDholpurBuffSandstoneTexture();
    this.getMakranaMarbleTexture();
    this.getMughalGardenLawnTexture();
    this.getIndianFlagTexture();
    this.getFrenchFlagTexture();
    this.getHeritageSignTexture('ASI');
    this.getHeritageSignTexture('SANSAD_MARG');
    this.getHeritageSignTexture('CENTRAL_VISTA');
    this.getHeritageSignTexture('PARIS_CAFE');
    this.getDeciduousCanopyTexture();
    this.getParisCobblestoneTexture();
    this.getFabricBumpTexture();
    this.getTacticalKevlarTexture();
    this.getGTABoulevardRoadTexture();
    this.getZebraCrosswalkTexture();
    this.getHaussmannFacadeTexture();
    this.getPalmBarkTexture();
    this.getPalmFrondTexture();
    this.getNeonSignTexture('AWAAZ', '#00f0ff');
    this.getNeonSignTexture('LIBERTÉ', '#f43f5e');

    // 2. Pin textures into GPU VRAM if renderer is available
    if (renderer) {
      this.cache.forEach((tex) => {
        try {
          renderer.initTexture(tex);
        } catch (e) {
          // non-critical, renderer will bind on first frame
        }
      });
    }
  }
}

