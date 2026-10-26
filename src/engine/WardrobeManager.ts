import { WardrobeConfig, JacketStyle, HeadwearStyle, PlacardStyle } from '../types/game';

export interface WardrobeOption<T> {
  id: T;
  name: string;
  colorHex?: number;
  previewColor?: string;
  description: string;
}

export const JACKET_OPTIONS: WardrobeOption<JacketStyle>[] = [
  {
    id: 'ELECTRIC_PINK',
    name: 'Electric Magenta',
    colorHex: 0xec4899,
    previewColor: '#ec4899',
    description: 'Vibrant cyberpunk neon hoodie with high visibility',
  },
  {
    id: 'TACTICAL_BLUE',
    name: 'Gendarme Navy',
    colorHex: 0x1e3a8a,
    previewColor: '#1e3a8a',
    description: 'Tactical ballistic reinforced law-enforcement blue',
  },
  {
    id: 'CYBER_YELLOW',
    name: 'Gilet Jaune / Hazard',
    colorHex: 0xeab308,
    previewColor: '#eab308',
    description: 'Iconic French manifestation high-vis safety jacket',
  },
  {
    id: 'KHADI_GREEN',
    name: 'Delhi Khadi Green',
    colorHex: 0x15803d,
    previewColor: '#15803d',
    description: 'Traditional organic cotton rally kurta & Nehru jacket',
  },
  {
    id: 'PARIS_TRICOLORE',
    name: 'Bastille Crimson',
    colorHex: 0xbe123c,
    previewColor: '#be123c',
    description: 'Bold Parisian revolutionary scarlet streetwear jacket',
  },
];

export const HEADWEAR_OPTIONS: WardrobeOption<HeadwearStyle>[] = [
  {
    id: 'NONE',
    name: 'Natural Hair',
    description: 'Fresh aerodynamic blowout without headgear',
  },
  {
    id: 'AVIATORS',
    name: 'Mirror Aviators',
    colorHex: 0x0f172a,
    description: 'Dark polarized gold-rim sunglasses for media drone flashes',
  },
  {
    id: 'PRESS_BERET',
    name: 'Parisian Beret',
    colorHex: 0x1e293b,
    description: 'Classic wool artist & independent press correspondent beret',
  },
  {
    id: 'STREET_BEANIE',
    name: 'Ribbed Beanie',
    colorHex: 0x334155,
    description: 'Snug street-parkour knit winter beanie cap',
  },
  {
    id: 'BANDANA',
    name: 'Protest Bandana',
    colorHex: 0xf43f5e,
    description: 'Teargas-resistant face and forehead rally bandana',
  },
];

export const PLACARD_OPTIONS: WardrobeOption<PlacardStyle>[] = [
  {
    id: 'NEON_CYBER',
    name: 'Holographic LED',
    previewColor: '#00f0ff',
    description: 'Digital scrolling LED sign with electric cyan illumination',
  },
  {
    id: 'CARDBOARD',
    name: 'Classic Cardboard',
    previewColor: '#d97706',
    description: 'Authentic hand-marker painted protest placard',
  },
  {
    id: 'GOLD_LEAF',
    name: 'Gold Foil Banner',
    previewColor: '#facc15',
    description: 'Polished metallic gold leaf frame celebrating freedom',
  },
  {
    id: 'FLAG_BANNER',
    name: 'Movement Flag',
    previewColor: '#ec4899',
    description: 'Flowing fabric flag banner with bold typography',
  },
];

const WARDROBE_STORAGE_KEY = 'pnc_wardrobe_v1';

export class WardrobeManager {
  private static cachedConfig: WardrobeConfig | null = null;

  public static getSavedConfig(): WardrobeConfig {
    if (this.cachedConfig) return this.cachedConfig;
    if (typeof window === 'undefined') return this.getDefaultConfig();

    try {
      const raw = localStorage.getItem(WARDROBE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.cachedConfig = {
          jacket: parsed.jacket || 'ELECTRIC_PINK',
          headwear: parsed.headwear || 'NONE',
          placardStyle: parsed.placardStyle || 'NEON_CYBER',
        };
        return this.cachedConfig;
      }
    } catch (_) {}

    this.cachedConfig = this.getDefaultConfig();
    return this.cachedConfig;
  }

  public static saveConfig(config: WardrobeConfig) {
    this.cachedConfig = config;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(config));
    } catch (_) {}
  }

  public static getDefaultConfig(): WardrobeConfig {
    return {
      jacket: 'ELECTRIC_PINK',
      headwear: 'NONE',
      placardStyle: 'NEON_CYBER',
    };
  }

  public getConfig(): WardrobeConfig {
    return WardrobeManager.getSavedConfig();
  }

  public saveConfig(config: WardrobeConfig) {
    WardrobeManager.saveConfig(config);
  }
}
