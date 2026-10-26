import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { EmoteType } from '../types/game';

interface EmoteWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmote: (emote: EmoteType) => void;
}

interface EmoteItem {
  id: EmoteType;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  bgGradient: string;
}

const EMOTES: EmoteItem[] = [
  {
    id: 'BHANGRA',
    label: 'Bhangra Groove',
    sublabel: 'Rally street dance',
    icon: '🕺',
    color: '#ec4899',
    bgGradient: 'from-pink-500/30 to-purple-600/30',
  },
  {
    id: 'FIST_PUMP',
    label: 'Awaaz Fist Pump',
    sublabel: 'Inquilab chant',
    icon: '✊',
    color: '#00f0ff',
    bgGradient: 'from-cyan-500/30 to-blue-600/30',
  },
  {
    id: 'BACKFLIP',
    label: 'Parkour Backflip',
    sublabel: 'Acrobatic stunt',
    icon: '🤸',
    color: '#a855f7',
    bgGradient: 'from-purple-500/30 to-pink-600/30',
  },
  {
    id: 'CHAI_SIP',
    label: 'Chai Toast',
    sublabel: 'Take a steaming sip',
    icon: '☕',
    color: '#f97316',
    bgGradient: 'from-amber-500/30 to-orange-600/30',
  },
  {
    id: 'MEGAPHONE_SOLO',
    label: 'Megaphone Beat',
    sublabel: 'Crowd resonance',
    icon: '📢',
    color: '#eab308',
    bgGradient: 'from-yellow-500/30 to-amber-600/30',
  },
];

export const EmoteWheel: React.FC<EmoteWheelProps> = ({
  isOpen,
  onClose,
  onSelectEmote,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full glass-panel border border-white/20 shadow-2xl flex flex-col items-center justify-center p-6"
      >
        {/* Center Hub */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-slate-900/90 border border-cyan-400/50 shadow-xl flex flex-col items-center justify-center text-center">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[10px] font-black uppercase text-slate-300 mt-0.5">EMOTE</span>
          </div>
        </div>

        {/* Emotes Positioned Around Radial Circle */}
        {EMOTES.map((e, idx) => {
          const total = EMOTES.length;
          const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
          const radius = 110; // pixels from center

          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <button
              key={e.id}
              onClick={() => {
                onSelectEmote(e.id);
                onClose();
              }}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className="absolute w-24 h-24 -ml-12 -mt-12 rounded-2xl glass-panel border border-white/20 hover:border-cyan-400 hover:scale-110 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 p-2 text-center shadow-lg group cursor-pointer bg-slate-900/80 hover:bg-slate-800"
            >
              <span className="text-2xl group-hover:animate-bounce">{e.icon}</span>
              <span className="text-[10px] font-bold text-white leading-tight line-clamp-1">
                {e.label}
              </span>
            </button>
          );
        })}

        {/* Close Button at bottom */}
        <button
          onClick={onClose}
          className="absolute -bottom-12 py-1.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Cancel (<kbd className="font-mono">Esc</kbd>)
        </button>
      </div>
    </div>
  );
};
