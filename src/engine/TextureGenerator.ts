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
}

