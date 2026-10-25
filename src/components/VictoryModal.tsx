import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Team, GameMatchState } from '../types/game';
import {
  Trophy,
  RotateCcw,
  Share2,
  Sparkles,
  Shield,
  Megaphone,
  Check,
  Award,
} from 'lucide-react';
import { recordMatchOutcome, Trophy as TrophyType } from '../utils/careerStats';

interface VictoryModalProps {
  matchState: GameMatchState;
  onRestart: () => void;
  onOpenCareerStats?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  matchState,
  onRestart,
  onOpenCareerStats,
}) => {
  const winner = matchState.winner || 'PROTESTOR';
  const isProtestorWin = winner === 'PROTESTOR';
  const isPlayerWinner = matchState.localTeam === winner;

  const [copied, setCopied] = useState(false);
  const [newTrophies, setNewTrophies] = useState<TrophyType[]>([]);

  useEffect(() => {
    // Launch celebratory confetti burst
    confetti({
      particleCount: 140,
      spread: 85,
      origin: { y: 0.6 },
      colors: isProtestorWin
        ? ['#ff007a', '#00f0ff', '#facc15', '#a855f7']
        : ['#1d4ed8', '#3b82f6', '#facc15', '#ffffff'],
    });

    // Automatically record match stats to lifetime career storage
    try {
      const unlocked = recordMatchOutcome({
        winner: winner as 'PROTESTOR' | 'POLICE',
        playerTeam: matchState.localTeam,
        mapId: matchState.mapId,
        awarenessScore: matchState.awarenessScore,
        detainedScore: matchState.detainedScore,
        viewerCount: matchState.viewerCount,
        kafilaRecruits: 4, // maximum recruited in match
        hasJailbroken: true,
        hasVisitedChai: true,
        hasVisitedJaiPrakash: true,
        hasScatteredLeaflets: true,
      });
      setNewTrophies(unlocked);
    } catch (_) {}
  }, [winner]);

  const handleShare = async () => {
    const mapName = matchState.mapId === 'PARIS' ? 'Place de la Bastille' : 'Jantar Mantar';
    const text = isProtestorWin
      ? `📢 I led the ${mapName} peaceful protest to VICTORY with ${matchState.viewerCount.toLocaleString()} live viewers in Protest-n-Chase! Can you beat my record? ✊🔥`
      : `🛡️ I maintained law and order, securing ${matchState.detainedScore}/8 detainees in Protest-n-Chase! Tactical victory! 👮‍♂️⚡`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Protest-n-Chase Match Result',
          text,
          url: window.location.href,
        });
      } catch (_) {}
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (_) {}
    }
  };

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

        {/* Newly Unlocked Trophies Banner */}
        {newTrophies.length > 0 && (
          <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-400/40 flex flex-col gap-1.5 animate-pulse">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{newTrophies.length} New Trophy Unlocked!</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {newTrophies.map((t) => (
                <div
                  key={t.id}
                  className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-amber-400/30 flex items-center gap-1.5 text-xs font-bold text-white shadow-sm"
                >
                  <span>{t.icon}</span>
                  <span>{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 w-full pt-1">
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
        <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/15"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">COPIED!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>SHARE</span>
              </>
            )}
          </button>

          {onOpenCareerStats && (
            <button
              onClick={onOpenCareerStats}
              className="px-4 py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/30"
              title="View Career Stats & Trophies"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>CAREER</span>
            </button>
          )}
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
