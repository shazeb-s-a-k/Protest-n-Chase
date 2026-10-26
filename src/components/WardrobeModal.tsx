import React, { useState } from 'react';
import {
  X,
  Shirt,
  Glasses,
  Flag,
  Sparkles,
  Check,
  RotateCcw,
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
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const notifyChange = (updated: WardrobeConfig) => {
    WardrobeManager.saveConfig(updated);
    onApplyWardrobe?.(updated);
    onSaveWardrobe?.(updated);
  };

  const handleSelectJacket = (jacket: JacketStyle) => {
    const updated = { ...config, jacket };
    setConfig(updated);
    setIsSaved(true);
    notifyChange(updated);
  };

  const handleSelectHeadwear = (headwear: HeadwearStyle) => {
    const updated = { ...config, headwear };
    setConfig(updated);
    setIsSaved(true);
    notifyChange(updated);
  };

  const handleSelectPlacard = (placardStyle: PlacardStyle) => {
    const updated = { ...config, placardStyle };
    setConfig(updated);
    setIsSaved(true);
    notifyChange(updated);
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
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectJacket(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-400/10'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 border border-white/20 shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: opt.previewColor }}
                    >
                      {isSelected && <Check className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{opt.name}</span>
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
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectHeadwear(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-400/10'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl shrink-0 bg-slate-800 border border-white/20 shadow-sm flex items-center justify-center text-slate-300">
                      {opt.id === 'NONE' ? '👤' : opt.id === 'AVIATORS' ? '🕶️' : opt.id === 'PRESS_BERET' ? '🧢' : opt.id === 'STREET_BEANIE' ? '🧶' : '🧣'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{opt.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
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
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectPlacard(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-400/10'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 border border-white/20 shadow-sm flex items-center justify-center text-xs font-bold"
                      style={{ color: opt.previewColor }}
                    >
                      📢
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{opt.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
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
