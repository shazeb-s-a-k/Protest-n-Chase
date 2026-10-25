import re

with open("src/engine/TextureGenerator.ts", "r") as f:
    code = f.read()

# 1. Add PBRTextureSet interface export before TextureGenerator
header_replacement = """import * as THREE from 'three';

export interface PBRTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  normalMap?: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
}

/**
 * Procedural PBR Texture Generator for AAA-Grade Stylized Realism
 * Produces detailed diffuse maps, bump maps, normal maps (via 3x3 Sobel kernel),
 * roughness maps, and material presets.
 */
export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Generates a tangent-space Normal Map (RGB encoding dx, dy, dz) from a grayscale height canvas
   * using a 3x3 Sobel convolution kernel with seamless toroidal edge wrapping.
   */
  public static generateNormalMapFromHeightmap(
    heightCanvas: HTMLCanvasElement,
    repeatX: number = 1,
    repeatY: number = 1,
    strength: number = 2.5
  ): THREE.CanvasTexture {
    const w = heightCanvas.width;
    const h = heightCanvas.height;
    const srcCtx = heightCanvas.getContext('2d')!;
    const srcData = srcCtx.getImageData(0, 0, w, h).data;

    const normCanvas = document.createElement('canvas');
    normCanvas.width = w;
    normCanvas.height = h;
    const nCtx = normCanvas.getContext('2d')!;
    const nImg = nCtx.createImageData(w, h);
    const nData = nImg.data;

    const getL = (x: number, y: number): number => {
      const wx = ((x % w) + w) % w;
      const wy = ((y % h) + h) % h;
      const idx = (wy * w + wx) * 4;
      return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255.0;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tl = getL(x - 1, y - 1);
        const l  = getL(x - 1, y);
        const bl = getL(x - 1, y + 1);
        const tr = getL(x + 1, y - 1);
        const r  = getL(x + 1, y);
        const br = getL(x + 1, y + 1);
        const dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);

        const t  = getL(x, y - 1);
        const b  = getL(x, y + 1);
        const dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

        const nx = -dx * strength;
        const ny = -dy * strength;
        const nz = 1.0;
        const len = Math.hypot(nx, ny, nz) || 1.0;

        const idx = (y * w + x) * 4;
        nData[idx]     = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
        nData[idx + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
        nData[idx + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
        nData[idx + 3] = 255;
      }
    }
    nCtx.putImageData(nImg, 0, 0);

    const normTex = new THREE.CanvasTexture(normCanvas);
    normTex.wrapS = THREE.RepeatWrapping;
    normTex.wrapT = THREE.RepeatWrapping;
    normTex.repeat.set(repeatX, repeatY);
    return normTex;
  }

  /**
   * Generates a PBR Roughness Map from diffuse/height canvas, mapping luminance to roughness values
   */
  public static generateRoughnessMap(
    sourceCanvas: HTMLCanvasElement,
    repeatX: number = 1,
    repeatY: number = 1,
    minRough: number = 0.45,
    maxRough: number = 0.85,
    invert: boolean = false
  ): THREE.CanvasTexture {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const srcCtx = sourceCanvas.getContext('2d')!;
    const srcData = srcCtx.getImageData(0, 0, w, h).data;

    const rCanvas = document.createElement('canvas');
    rCanvas.width = w;
    rCanvas.height = h;
    const rCtx = rCanvas.getContext('2d')!;
    const rImg = rCtx.createImageData(w, h);
    const rData = rImg.data;

    for (let i = 0; i < srcData.length; i += 4) {
      const lum = (srcData[i] * 0.299 + srcData[i + 1] * 0.587 + srcData[i + 2] * 0.114) / 255.0;
      const factor = invert ? (1.0 - lum) : lum;
      const roughVal = Math.floor((minRough + factor * (maxRough - minRough)) * 255);
      rData[i] = roughVal;
      rData[i + 1] = roughVal;
      rData[i + 2] = roughVal;
      rData[i + 3] = 255;
    }
    rCtx.putImageData(rImg, 0, 0);

    const rTex = new THREE.CanvasTexture(rCanvas);
    rTex.wrapS = THREE.RepeatWrapping;
    rTex.wrapT = THREE.RepeatWrapping;
    rTex.repeat.set(repeatX, repeatY);
    return rTex;
  }
"""

old_header_pattern = r"import \* as THREE from 'three';\s+/\*\*\s+\* Procedural PBR Texture Generator for AAA-Grade Stylized Realism\s+\* Produces detailed diffuse maps, bump maps, and material presets\s+\*/\s+export class TextureGenerator \{\s+private static cache: Map<string, THREE\.CanvasTexture> = new Map\(\);"

assert re.search(old_header_pattern, code), "Header pattern not found"
code = re.sub(old_header_pattern, header_replacement.strip(), code, count=1)

# Function to patch a texture method
def patch_texture_method(code, method_name, map_key, bump_key, norm_key, rough_key, rep_x, rep_y, norm_strength, min_r, max_r, invert=False):
    # Pattern for return type and cache check
    old_sig = f"public static {method_name}(): {{ map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture }} {{"
    new_sig = f"public static {method_name}(): PBRTextureSet {{"
    assert old_sig in code, f"Could not find signature for {method_name}"
    code = code.replace(old_sig, new_sig, 1)

    old_cache = f"""    const mapKey = '{map_key}';
    const bumpKey = '{bump_key}';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey)) {{
      return {{ map: this.cache.get(mapKey)!, bumpMap: this.cache.get(bumpKey)! }};
    }}"""

    new_cache = f"""    const mapKey = '{map_key}';
    const bumpKey = '{bump_key}';
    const normKey = '{norm_key}';
    const roughKey = '{rough_key}';

    if (this.cache.has(mapKey) && this.cache.has(bumpKey) && this.cache.has(normKey) && this.cache.has(roughKey)) {{
      return {{
        map: this.cache.get(mapKey)!,
        bumpMap: this.cache.get(bumpKey)!,
        normalMap: this.cache.get(normKey)!,
        roughnessMap: this.cache.get(roughKey)!,
      }};
    }}"""

    if old_cache in code:
        code = code.replace(old_cache, new_cache, 1)
    else:
        # try relaxed spacing
        pattern = rf"const mapKey = '{map_key}';\s+const bumpKey = '{bump_key}';\s+if \(this\.cache\.has\(mapKey\) && this\.cache\.has\(bumpKey\)\) \x7b\s+return \x7b map: this\.cache\.get\(mapKey\)!, bumpMap: this\.cache\.get\(bumpKey\)! \x7d;\s+\x7d"
        assert re.search(pattern, code), f"Cache pattern not found for {method_name}"
        code = re.sub(pattern, new_cache.strip(), code, count=1)

    # Now patch the cache saving and return
    old_return = f"""    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);

    return {{ map: diffuseTex, bumpMap: bumpTex }};"""

    inv_str = "true" if invert else "false"
    new_return = f"""    const normTex = this.generateNormalMapFromHeightmap(bumpCanvas, {rep_x}, {rep_y}, {norm_strength});
    const roughTex = this.generateRoughnessMap(canvas, {rep_x}, {rep_y}, {min_r}, {max_r}, {inv_str});

    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);
    this.cache.set(normKey, normTex);
    this.cache.set(roughKey, roughTex);

    return {{ map: diffuseTex, bumpMap: bumpTex, normalMap: normTex, roughnessMap: roughTex }};"""

    if old_return in code:
        code = code.replace(old_return, new_return, 1)
    else:
        # try single newline or relaxed spacing
        old_return_alt = f"""    this.cache.set(mapKey, diffuseTex);
    this.cache.set(bumpKey, bumpTex);
    return {{ map: diffuseTex, bumpMap: bumpTex }};"""
        if old_return_alt in code:
            code = code.replace(old_return_alt, new_return, 1)
        else:
            pattern_ret = rf"this\.cache\.set\(mapKey, diffuseTex\);\s+this\.cache\.set\(bumpKey, bumpTex\);\s+return \x7b map: diffuseTex, bumpMap: bumpTex \x7d;"
            assert re.search(pattern_ret, code), f"Return pattern not found for {method_name}"
            code = re.sub(pattern_ret, new_return.strip(), code, count=1)

    return code

# 1. getAsphaltTexture
code = patch_texture_method(code, "getAsphaltTexture", "asphalt_diffuse", "asphalt_bump", "asphalt_normal", "asphalt_roughness", 16, 16, 2.8, 0.7, 0.95)

# 2. getSandstoneFlagstoneTexture
code = patch_texture_method(code, "getSandstoneFlagstoneTexture", "sandstone_diffuse", "sandstone_bump", "sandstone_normal", "sandstone_roughness", 12, 12, 2.5, 0.65, 0.88)

# 3. getParisCobblestoneTexture
code = patch_texture_method(code, "getParisCobblestoneTexture", "paris_cobble_diffuse", "paris_cobble_bump", "paris_cobble_normal", "paris_cobble_roughness", 18, 18, 3.2, 0.45, 0.82, invert=True)

# 4. getIndianRedSandstoneTexture
code = patch_texture_method(code, "getIndianRedSandstoneTexture", "indian_red_sandstone_diffuse", "indian_red_sandstone_bump", "indian_red_sandstone_normal", "indian_red_sandstone_roughness", 4, 4, 2.6, 0.68, 0.86)

# 5. getDholpurBuffSandstoneTexture
code = patch_texture_method(code, "getDholpurBuffSandstoneTexture", "dholpur_buff_diffuse", "dholpur_buff_bump", "dholpur_buff_normal", "dholpur_buff_roughness", 4, 4, 2.4, 0.62, 0.82)

# 6. getMakranaMarbleTexture
code = patch_texture_method(code, "getMakranaMarbleTexture", "makrana_marble_diffuse", "makrana_marble_bump", "makrana_marble_normal", "makrana_marble_roughness", 2, 6, 1.8, 0.22, 0.42, invert=True)

# 7. getMughalGardenLawnTexture
code = patch_texture_method(code, "getMughalGardenLawnTexture", "mughal_lawn_diffuse", "mughal_lawn_bump", "mughal_lawn_normal", "mughal_lawn_roughness", 12, 12, 2.2, 0.82, 0.96)

# 8. getHaussmannFacadeTexture
code = patch_texture_method(code, "getHaussmannFacadeTexture", "haussmann_facade_diffuse", "haussmann_facade_bump", "haussmann_facade_normal", "haussmann_facade_roughness", 12, 1, 2.8, 0.55, 0.85)

# 9. getOperaBastilleGlassTexture
code = patch_texture_method(code, "getOperaBastilleGlassTexture", "opera_bastille_glass_diffuse", "opera_bastille_glass_bump", "opera_bastille_glass_normal", "opera_bastille_glass_roughness", 4, 3, 1.5, 0.12, 0.35, invert=True)

with open("src/engine/TextureGenerator.ts", "w") as f:
    f.write(code)

print("Successfully enhanced TextureGenerator.ts with Sobel Normal Maps and Roughness Maps!")
