import { WardrobeConfig, JacketStyle, HeadwearStyle, PlacardStyle } from '../types/game';

export interface WardrobeOption<T> {
  id: T;
  name: string;
  colorHex?: number;
  previewColor?: string;
  description: string;
  coinPrice?: number;
}

export const JACKET_OPTIONS: WardrobeOption<JacketStyle>[] = [
  {
    id: 'ELECTRIC_PINK',
    name: 'Electric Magenta',
    colorHex: 0xec4899,
    previewColor: '#ec4899',
    description: 'Vibrant cyberpunk neon hoodie with high visibility',
    coinPrice: 0,
  },
  {
    id: 'TACTICAL_BLUE',
    name: 'Gendarme Navy',
    colorHex: 0x1e3a8a,
    previewColor: '#1e3a8a',
    description: 'Tactical ballistic reinforced law-enforcement blue',
    coinPrice: 0,
  },
  {
    id: 'CYBER_YELLOW',
    name: 'Gilet Jaune / Hazard',
    colorHex: 0xeab308,
    previewColor: '#eab308',
    description: 'Iconic French manifestation high-vis safety jacket',
    coinPrice: 50,
  },
  {
    id: 'KHADI_GREEN',
    name: 'Delhi Khadi Green',
    colorHex: 0x15803d,
    previewColor: '#15803d',
    description: 'Traditional organic cotton rally kurta & Nehru jacket',
    coinPrice: 80,
  },
  {
    id: 'PARIS_TRICOLORE',
    name: 'Bastille Crimson',
    colorHex: 0xbe123c,
    previewColor: '#be123c',
    description: 'Bold Parisian revolutionary scarlet streetwear jacket',
    coinPrice: 120,
  },
];

export const HEADWEAR_OPTIONS: WardrobeOption<HeadwearStyle>[] = [
  {
    id: 'NONE',
    name: 'Natural Hair',
    description: 'Fresh aerodynamic blowout without headgear',
    coinPrice: 0,
  },
  {
    id: 'AVIATORS',
    name: 'Mirror Aviators',
    colorHex: 0x0f172a,
    description: 'Dark polarized gold-rim sunglasses for media drone flashes',
    coinPrice: 60,
  },
  {
    id: 'PRESS_BERET',
    name: 'Parisian Beret',
    colorHex: 0x1e293b,
    description: 'Classic wool artist & independent press correspondent beret',
    coinPrice: 80,
  },
  {
    id: 'STREET_BEANIE',
    name: 'Ribbed Beanie',
    colorHex: 0x334155,
    description: 'Snug street-parkour knit winter beanie cap',
    coinPrice: 50,
  },
  {
    id: 'BANDANA',
    name: 'Protest Bandana',
    colorHex: 0xf43f5e,
    description: 'Teargas-resistant face and forehead rally bandana',
    coinPrice: 90,
  },
];

export const PLACARD_OPTIONS: WardrobeOption<PlacardStyle>[] = [
  {
    id: 'NEON_CYBER',
    name: 'Holographic LED',
    previewColor: '#00f0ff',
    description: 'Digital scrolling LED sign with electric cyan illumination',
    coinPrice: 0,
  },
  {
    id: 'CARDBOARD',
    name: 'Classic Cardboard',
    previewColor: '#d97706',
    description: 'Authentic hand-marker painted protest placard',
    coinPrice: 0,
  },
  {
    id: 'GOLD_LEAF',
    name: 'Gold Foil Banner',
    previewColor: '#facc15',
    description: 'Polished metallic gold leaf frame celebrating freedom',
    coinPrice: 100,
  },
  {
    id: 'FLAG_BANNER',
    name: 'Movement Flag',
    previewColor: '#ec4899',
    description: 'Flowing fabric flag banner with bold typography',
    coinPrice: 140,
  },
];

const WARDROBE_STORAGE_KEY = 'pnc_wardrobe_v1';
const COINS_STORAGE_KEY = 'pnc_stored_coins_v1';
const UNLOCKED_STORAGE_KEY = 'pnc_unlocked_items_v1';

const DEFAULT_UNLOCKED_ITEMS = new Set<string>([
  'ELECTRIC_PINK',
  'TACTICAL_BLUE',
  'NONE',
  'NEON_CYBER',
  'CARDBOARD',
]);

export class WardrobeManager {
  private static cachedConfig: WardrobeConfig | null = null;
  private static cachedCoins: number | null = null;
  private static cachedUnlocked: Set<string> | null = null;

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

  // --- PERSISTENT STREET COIN BANK ---

  public static getStoredCoins(): number {
    if (this.cachedCoins !== null) return this.cachedCoins;
    if (typeof window === 'undefined') return 50;

    try {
      const raw = localStorage.getItem(COINS_STORAGE_KEY);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          this.cachedCoins = parsed;
          return this.cachedCoins;
        }
      }
    } catch (_) {}

    // Initial 50 starter bonus coins for all players
    this.cachedCoins = 50;
    try {
      localStorage.setItem(COINS_STORAGE_KEY, '50');
    } catch (_) {}
    return this.cachedCoins;
  }

  public static addStoredCoins(amount: number): number {
    const current = this.getStoredCoins();
    const updated = Math.max(0, current + amount);
    this.cachedCoins = updated;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(COINS_STORAGE_KEY, updated.toString());
      } catch (_) {}
    }
    return updated;
  }

  public static deductStoredCoins(amount: number): boolean {
    const current = this.getStoredCoins();
    if (current < amount) return false;
    this.addStoredCoins(-amount);
    return true;
  }

  // --- UNLOCKED COSMETICS PERSISTENCE ---

  public static getUnlockedItemIds(): Set<string> {
    if (this.cachedUnlocked !== null) return this.cachedUnlocked;
    if (typeof window === 'undefined') return new Set(DEFAULT_UNLOCKED_ITEMS);

    try {
      const raw = localStorage.getItem(UNLOCKED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const set = new Set<string>([...DEFAULT_UNLOCKED_ITEMS, ...parsed]);
          this.cachedUnlocked = set;
          return this.cachedUnlocked;
        }
      }
    } catch (_) {}

    this.cachedUnlocked = new Set(DEFAULT_UNLOCKED_ITEMS);
    return this.cachedUnlocked;
  }

  public static isItemUnlocked(itemId: string): boolean {
    const set = this.getUnlockedItemIds();
    return set.has(itemId);
  }

  public static unlockItem(itemId: string, price: number = 0): boolean {
    if (this.isItemUnlocked(itemId)) return true;

    if (price > 0) {
      const success = this.deductStoredCoins(price);
      if (!success) return false;
    }

    const set = this.getUnlockedItemIds();
    set.add(itemId);
    this.cachedUnlocked = set;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(Array.from(set)));
      } catch (_) {}
    }
    return true;
  }

  // Instance method delegates
  public getConfig(): WardrobeConfig {
    return WardrobeManager.getSavedConfig();
  }

  public saveConfig(config: WardrobeConfig) {
    WardrobeManager.saveConfig(config);
  }

  public getStoredCoins(): number {
    return WardrobeManager.getStoredCoins();
  }

  public addStoredCoins(amount: number): number {
    return WardrobeManager.addStoredCoins(amount);
  }

  public isItemUnlocked(itemId: string): boolean {
    return WardrobeManager.isItemUnlocked(itemId);
  }

  public unlockItem(itemId: string, price: number): boolean {
    return WardrobeManager.unlockItem(itemId, price);
  }
}
