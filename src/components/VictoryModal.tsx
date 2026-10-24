import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Team, GameMatchState } from '../types/game';
import { Trophy, RotateCcw, Share2, Sparkles, Shield, Megaphone } from 'lucide-react';

interface VictoryModalProps {
  matchState: GameMatchState;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  matchState,
  onRestart,
}) => {
  const winner = matchState.winner || 'PROTESTOR';
  const isProtestorWin = winner === 'PROTESTOR';
  const isPlayerWinner = matchState.localTeam === winner;

  useEffect(() => {
    // Launch celebratory confetti burst
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: isProtestorWin
        ? ['#ff007a', '#00f0ff', '#facc15', '#a855f7']
        : ['#1d4ed8', '#3b82f6', '#facc15', '#ffffff'],
    });
  }, [winner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center text-center gap-5">
        {/* Victory Trophy Badge */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce ${
            isProtestorWin
              ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 shadow-pink-500/40 text-white'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-700 shadow-blue-500/40 text-amber-300'
          }`}
        >
          {isProtestorWin ? (
            <Megaphone className="w-10 h-10" />
          ) : (
            <Shield className="w-10 h-10" />
          )}
        </div>

        {/* Victory Title */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            {isPlayerWinner ? '🎉 VICTORY ACHIEVED!' : 'MATCH CONCLUDED'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            {isProtestorWin ? 'The Voices Prevailed!' : 'Square Secured!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            {isProtestorWin
              ? matchState.mapId === 'PARIS'
                ? 'Place de la Bastille resonated with freedom! The French movement achieved global viral awareness!'
                : 'Jantar Mantar echoed with united energy! The movement achieved global viral awareness!'
              : 'Crowd control units tactically cleared the perimeter and secured the plaza.'}
          </p>
        </div>

        {/* Match Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 w-full pt-2">
          <div className="glass-panel p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Awareness</div>
            <div className="text-xl font-mono font-black text-cyan-400 mt-0.5">
              {Math.round(matchState.awarenessScore)}%
            </div>
          </div>
          <div className="glass-panel p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Detained</div>
            <div className="text-xl font-mono font-black text-amber-400 mt-0.5">
              {matchState.detainedScore} / 8
            </div>
          </div>
          <div className="glass-panel p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Peak Live</div>
            <div className="text-xl font-mono font-black text-pink-400 mt-0.5">
              {matchState.viewerCount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
        </div>

        {/* Creator & Support Footer */}
        <div className="pt-3 border-t border-white/10 w-full flex flex-col items-center gap-1.5 text-center">
          <div className="text-[11px] text-slate-300 font-medium">
            Created with ❤️ by <span className="text-white font-bold">Shazeb Anwar Khan</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <span>Support via UPI:</span>
            <strong className="text-white select-all">shazeb26@fam</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
