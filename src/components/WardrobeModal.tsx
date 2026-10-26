import React, { useState, useEffect } from 'react';
import {
  X,
  Shirt,
  Glasses,
  Flag,
  Sparkles,
  Check,
  Lock,
  Coins,
} from 'lucide-react';
import {
  WardrobeConfig,
  JacketStyle,
  HeadwearStyle,
  PlacardStyle,
} from '../types/game';
import {
  JACKET_OPTIONS,
  HEADWEAR_OPTIONS,
  PLACARD_OPTIONS,
  WardrobeManager,
} from '../engine/WardrobeManager';
import { audioManager } from '../engine/AudioManager';

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWardrobe?: (config: WardrobeConfig) => void;
  onSaveWardrobe?: (config: WardrobeConfig) => void;
  currentConfig?: WardrobeConfig;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  isOpen,
  onClose,
  onApplyWardrobe,
  onSaveWardrobe,
  currentConfig,
}) => {
  const [config, setConfig] = useState<WardrobeConfig>(
    currentConfig || WardrobeManager.getSavedConfig()
  );
  const [activeTab, setActiveTab] = useState<'JACKET' | 'HEADWEAR' | 'PLACARD'>('JACKET');
  const [storedCoins, setStoredCoins] = useState<number>(WardrobeManager.getStoredCoins());
  const [unlockedItems, setUnlockedItems] = useState<Set<string>>(WardrobeManager.getUnlockedItemIds());
  const [unlockFeedback, setUnlockFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStoredCoins(WardrobeManager.getStoredCoins());
      setUnlockedItems(new Set(WardrobeManager.getUnlockedItemIds()));
      setUnlockFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const notifyChange = (updated: WardrobeConfig) => {
    WardrobeManager.saveConfig(updated);
    onApplyWardrobe?.(updated);
    onSaveWardrobe?.(updated);
  };

  const handleSelectJacket = (jacket: JacketStyle, price: number = 0) => {
    if (!unlockedItems.has(jacket) && price > 0) {
      handleUnlockItem(jacket, price, () => {
        const updated = { ...config, jacket };
        setConfig(updated);
        notifyChange(updated);
      });
      return;
    }
    const updated = { ...config, jacket };
    setConfig(updated);
    notifyChange(updated);
  };

  const handleSelectHeadwear = (headwear: HeadwearStyle, price: number = 0) => {
    if (!unlockedItems.has(headwear) && price > 0) {
      handleUnlockItem(headwear, price, () => {
        const updated = { ...config, headwear };
        setConfig(updated);
        notifyChange(updated);
      });
      return;
    }
    const updated = { ...config, headwear };
    setConfig(updated);
    notifyChange(updated);
  };

  const handleSelectPlacard = (placardStyle: PlacardStyle, price: number = 0) => {
    if (!unlockedItems.has(placardStyle) && price > 0) {
      handleUnlockItem(placardStyle, price, () => {
        const updated = { ...config, placardStyle };
        setConfig(updated);
        notifyChange(updated);
      });
      return;
    }
    const updated = { ...config, placardStyle };
    setConfig(updated);
    notifyChange(updated);
  };

  const handleUnlockItem = (itemId: string, price: number, onEquip: () => void) => {
    const coins = WardrobeManager.getStoredCoins();
    if (coins < price) {
      setUnlockFeedback(`Need ${price - coins} more Street Coins! Collect tokens in matches! 🪙`);
      return;
    }

    const success = WardrobeManager.unlockItem(itemId, price);
    if (success) {
      const newCoins = WardrobeManager.getStoredCoins();
      setStoredCoins(newCoins);
      setUnlockedItems(new Set(WardrobeManager.getUnlockedItemIds()));
      audioManager.playVictoryFanfare();
      setUnlockFeedback(`Unlocked item successfully! Equipped! ✨`);
      onEquip();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-xl glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>Avatar Wardrobe</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  Custom Look
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Personalize your rally streetwear, eyewear & placard banner
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Persistent Street Coin Bank */}
            <div className="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-amber-400/50 bg-amber-950/60 text-amber-300 font-bold text-xs shadow-md">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm">{storedCoins}</span>
              <span className="text-[10px] text-amber-400/80 uppercase">Coins</span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unlock Feedback Toast */}
        {unlockFeedback && (
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-purple-950/60 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{unlockFeedback}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('JACKET')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'JACKET'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Hoodie</span>
          </button>

          <button
            onClick={() => setActiveTab('HEADWEAR')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'HEADWEAR'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Glasses className="w-3.5 h-3.5" />
            <span>Eyewear</span>
          </button>

          <button
            onClick={() => setActiveTab('PLACARD')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'PLACARD'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Placard</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex flex-col gap-2.5">
          {activeTab === 'JACKET' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {JACKET_OPTIONS.map((opt) => {
                const isSelected = config.jacket === opt.id;
                const isUnlocked = unlockedItems.has(opt.id) || !opt.coinPrice;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectJacket(opt.id, opt.coinPrice)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-400/10'
                        : isUnlocked
                        ? 'bg-white/5 border-white/5 hover:bg-white/10'
                        : 'bg-slate-900/60 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 border border-white/20 shadow-sm flex items-center justify-center relative"
                      style={{ backgroundColor: opt.previewColor }}
                    >
                      {isSelected && <Check className="w-5 h-5 text-white" />}
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-slate-950/60 rounded-xl flex items-center justify-center">
                          <Lock className="w-4 h-4 text-amber-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span className="truncate">{opt.name}</span>
                        {!isUnlocked && (
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-400/30">
                            {opt.coinPrice} 🪙
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'HEADWEAR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HEADWEAR_OPTIONS.map((opt) => {
                const isSelected = config.headwear === opt.id;
                const isUnlocked = unlockedItems.has(opt.id) || !opt.coinPrice;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectHeadwear(opt.id, opt.coinPrice)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-400/10'
                        : isUnlocked
                        ? 'bg-white/5 border-white/5 hover:bg-white/10'
                        : 'bg-slate-900/60 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl shrink-0 bg-slate-800 border border-white/20 shadow-sm flex items-center justify-center text-slate-300 relative">
                      {opt.id === 'NONE' ? '👤' : opt.id === 'AVIATORS' ? '🕶️' : opt.id === 'PRESS_BERET' ? '🧢' : opt.id === 'STREET_BEANIE' ? '🧶' : '🧣'}
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-slate-950/60 rounded-xl flex items-center justify-center">
                          <Lock className="w-4 h-4 text-amber-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span className="truncate">{opt.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        {!isUnlocked && (
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-400/30">
                            {opt.coinPrice} 🪙
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'PLACARD' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PLACARD_OPTIONS.map((opt) => {
                const isSelected = config.placardStyle === opt.id;
                const isUnlocked = unlockedItems.has(opt.id) || !opt.coinPrice;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectPlacard(opt.id, opt.coinPrice)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-400/10'
                        : isUnlocked
                        ? 'bg-white/5 border-white/5 hover:bg-white/10'
                        : 'bg-slate-900/60 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 border border-white/20 shadow-sm flex items-center justify-center text-xs font-bold relative"
                      style={{ color: opt.previewColor }}
                    >
                      📢
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-slate-950/60 rounded-xl flex items-center justify-center">
                          <Lock className="w-4 h-4 text-amber-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span className="truncate">{opt.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        {!isUnlocked && (
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-400/30">
                            {opt.coinPrice} 🪙
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Saved Confirmation Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Outfit saved to local profile</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Auto-synced</span>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer active:scale-98"
        >
          Confirm Style
        </button>
      </div>
    </div>
  );
};

