import React, { useState } from 'react';
import { GraphicsQuality, TimeOfDay, WeatherCondition } from '../types/game';
import {
  X,
  Sliders,
  Sun,
  Moon,
  Sunset,
  CloudRain,
  Monitor,
  Volume2,
  VolumeX,
  Type,
  Keyboard,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphicsQuality: GraphicsQuality;
  onSelectGraphics: (q: GraphicsQuality) => void;
  timeOfDay: TimeOfDay;
  onSelectTimeOfDay: (t: TimeOfDay) => void;
  weather: WeatherCondition;
  onSelectWeather: (w: WeatherCondition) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  placardText: string;
  onUpdatePlacard: (text: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  graphicsQuality,
  onSelectGraphics,
  timeOfDay,
  onSelectTimeOfDay,
  weather,
  onSelectWeather,
  isMuted,
  onToggleMute,
  placardText,
  onUpdatePlacard,
}) => {
  const [inputText, setInputText] = useState(placardText);

  if (!isOpen) return null;

  const handleSavePlacard = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onUpdatePlacard(inputText.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-xl glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Game Settings & Quality
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Graphics Quality & Resolution Upscaling */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-pink-400" />
            Graphics Quality & Resolution Upscaling
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['ULTRA', 'HIGH', 'MEDIUM', 'LOW'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => onSelectGraphics(q)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                  graphicsQuality === q
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-lg shadow-pink-500/25'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-400">
            {graphicsQuality === 'ULTRA' && '✨ 2x Supersampling upscaling, soft PCF shadows, high particle density.'}
            {graphicsQuality === 'HIGH' && '🌟 1.5x Pixel Ratio with dynamic soft shadows.'}
            {graphicsQuality === 'MEDIUM' && '⚡️ 1.0x Native resolution, balanced performance.'}
            {graphicsQuality === 'LOW' && '🚀 Performance mode: 0.85x downscaled buffer for older mobile devices.'}
          </div>
        </div>

        {/* 2. Weather & Atmosphere Simulation */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CloudRain className="w-4 h-4 text-cyan-400" />
            Dynamic Weather Simulation
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSelectWeather('CLEAR_GOLDEN')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                weather === 'CLEAR_GOLDEN'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400 shadow-lg'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Sunset className="w-4 h-4" />
              Golden Dust
            </button>
            <button
              onClick={() => onSelectWeather('MONSOON_RAIN')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                weather === 'MONSOON_RAIN'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white border-blue-400 shadow-lg'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <CloudRain className="w-4 h-4" />
              Monsoon Rain
            </button>
            <button
              onClick={() => onSelectWeather('NIGHT_CYBERPUNK')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                weather === 'NIGHT_CYBERPUNK'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-lg'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Moon className="w-4 h-4" />
              Cyberpunk
            </button>
          </div>
        </div>

        {/* 3. Audio & Voice Settings */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5">
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <div className="text-xs font-bold text-white">Synthesized Audio & Chants</div>
              <div className="text-[10px] text-slate-400">Web Audio API megaphones, sirens & drumbeats</div>
            </div>
          </div>
          <button
            onClick={onToggleMute}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {isMuted ? 'MUTED' : 'ACTIVE'}
          </button>
        </div>

        {/* 4. Customize Placard Slogan */}
        <form onSubmit={handleSavePlacard} className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-4 h-4 text-cyan-400" />
            Held Placard Slogan
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={20}
              placeholder="e.g. CLEAN AIR DELHI"
              className="flex-1 px-4 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs font-bold uppercase tracking-wider text-cyan-300 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Update
            </button>
          </div>
        </form>

        {/* 5. Controls Reference */}
        <div className="border-t border-white/10 pt-3">
          <div className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-purple-400" />
            Controls Reference
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
            <div><strong className="text-white">WASD / Arrows:</strong> Move</div>
            <div><strong className="text-white">Shift:</strong> Sprint</div>
            <div><strong className="text-white">Space:</strong> Jump / QTE Mash</div>
            <div><strong className="text-white">C:</strong> Slide under barricade</div>
            <div><strong className="text-white">Q:</strong> Megaphone / Barricade</div>
            <div><strong className="text-white">F:</strong> Viral Hype / Water Cannon</div>
            <div><strong className="text-white">E:</strong> Bus Jailbreak / Canister Kick</div>
            <div><strong className="text-white">H:</strong> Form Human Chain</div>
            <div><strong className="text-white">P:</strong> Photo Mode / Poster</div>
            <div><strong className="text-white">V:</strong> Camera View Mode</div>
            <div><strong className="text-white">Right-Drag:</strong> Free Orbit Camera</div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all mt-1"
        >
          Resume Game
        </button>
      </div>
    </div>
  );
};
