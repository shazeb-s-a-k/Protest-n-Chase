import React from 'react';
import {
  X,
  Trophy as TrophyIcon,
  Award,
  Flame,
  Shield,
  Users,
  Megaphone,
  Coffee,
  CheckCircle2,
  Lock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { ALL_TROPHIES, getCareerStats, CareerStats } from '../utils/careerStats';

interface CareerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CareerStatsModal: React.FC<CareerStatsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const stats: CareerStats = getCareerStats();
  const winRate =
    stats.matchesPlayed > 0
      ? Math.round((stats.victories / stats.matchesPlayed) * 100)
      : 0;

  const unlockedCount = stats.unlockedTrophyIds.length;
  const totalTrophies = ALL_TROPHIES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 text-slate-950">
              <TrophyIcon className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>Career & Trophies</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {unlockedCount} / {totalTrophies}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Persistent legacy across all New Delhi & Paris rallies
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

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="glass-panel p-3 rounded-2xl border border-white/10 flex flex-col">
            <div className="text-[10px] font-bold uppercase text-slate-400">Matches</div>
            <div className="text-2xl font-mono font-black text-white mt-1">
              {stats.matchesPlayed}
            </div>
            <div className="text-[9px] text-slate-500 mt-auto">
              {stats.victories} Won
            </div>
          </div>

          <div className="glass-panel p-3 rounded-2xl border border-white/10 flex flex-col">
            <div className="text-[10px] font-bold uppercase text-slate-400">Win Rate</div>
            <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
              {winRate}%
            </div>
            <div className="text-[9px] text-slate-500 mt-auto">
              {stats.protestWins}P • {stats.policeWins}C
            </div>
          </div>

          <div className="glass-panel p-3 rounded-2xl border border-white/10 flex flex-col">
            <div className="text-[10px] font-bold uppercase text-slate-400">Peak Viewers</div>
            <div className="text-2xl font-mono font-black text-pink-400 mt-1">
              {stats.maxLiveViewers > 0 ? stats.maxLiveViewers.toLocaleString() : '0'}
            </div>
            <div className="text-[9px] text-slate-500 mt-auto flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
              <span>Viral Hype</span>
            </div>
          </div>

          <div className="glass-panel p-3 rounded-2xl border border-white/10 flex flex-col">
            <div className="text-[10px] font-bold uppercase text-slate-400">Max Kafila</div>
            <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
              {stats.maxKafilaRecruited}
            </div>
            <div className="text-[9px] text-slate-500 mt-auto flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-cyan-400" />
              <span>Entourage</span>
            </div>
          </div>
        </div>

        {/* Trophies Grid */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Trophy Case</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              {Math.round((unlockedCount / totalTrophies) * 100)}% Completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALL_TROPHIES.map((trophy) => {
              const isUnlocked = stats.unlockedTrophyIds.includes(trophy.id);
              return (
                <div
                  key={trophy.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                    isUnlocked
                      ? 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-slate-900/60 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-white/5 border-white/5 opacity-60'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      isUnlocked
                        ? 'bg-gradient-to-tr from-amber-400 to-pink-500 shadow-md shadow-amber-400/20'
                        : 'bg-slate-800/80 text-slate-500'
                    }`}
                  >
                    {trophy.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isUnlocked ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {trophy.title}
                      </h4>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-2">
                      {trophy.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Creator & Support Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-500/20 flex items-center justify-between">
          <div className="text-[11px] text-slate-300">
            Game crafted by <span className="text-white font-bold">Shazeb Anwar Khan</span>
          </div>
          <div className="text-xs font-mono font-bold text-amber-300">
            UPI: <span className="text-white select-all">shazeb26@fam</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
