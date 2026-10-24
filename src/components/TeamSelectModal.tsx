import React, { useState } from 'react';
import { Team, GameMode } from '../types/game';
import {
  Megaphone,
  Shield,
  Users,
  User,
  Sparkles,
  MapPin,
  Play,
  Share2,
  Lock,
  Heart,
} from 'lucide-react';

interface TeamSelectModalProps {
  onStartGame: (team: Team, mode: GameMode, roomCode?: string) => void;
  onOpenSupport?: () => void;
}

export const TeamSelectModal: React.FC<TeamSelectModalProps> = ({
  onStartGame,
  onOpenSupport,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team>('PROTESTOR');
  const [selectedMode, setSelectedMode] = useState<GameMode>('SOLO');
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel p-6 sm:p-10 rounded-3xl border border-white/15 shadow-2xl flex flex-col gap-6 my-auto">
        {/* Title Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            3D Tactical Action Game
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Awaaz: <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">Jantar Mantar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
            Subway Surfers-style agile evasion, megaphone chants, and tactical crowd control in an authentic 3D Delhi landmark.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-xs text-slate-300">
            <span>Created by</span>
            <strong className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 font-extrabold">Shazeb Anwar Khan</strong>
          </div>
        </div>

        {/* 1. Choose Team Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Protestors */}
          <div
            onClick={() => setSelectedTeam('PROTESTOR')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col gap-3 relative overflow-hidden ${
              selectedTeam === 'PROTESTOR'
                ? 'border-pink-500 bg-pink-500/15 shadow-xl shadow-pink-500/20 scale-[1.02]'
                : 'border-white/10 bg-slate-900/50 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase">
                High Agility
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">The Protestors</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Gen-Z youth fighting for their future. Fast sprint, slide under barricades, megaphone soundwave chants, and rescue detained friends from police buses.
              </p>
            </div>
          </div>

          {/* Card: Police */}
          <div
            onClick={() => setSelectedTeam('POLICE')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col gap-3 relative overflow-hidden ${
              selectedTeam === 'POLICE'
                ? 'border-blue-500 bg-blue-500/15 shadow-xl shadow-blue-500/20 scale-[1.02]'
                : 'border-white/10 bg-slate-900/50 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                Crowd Control
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Delhi Police</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Tactical unit maintaining order. Deploy steel barricades, toss smoke/tear gas canisters, push back with water cannons, and detain into transfer buses.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Mode Selection & Map Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
          {/* Solo vs Multiplayer Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedMode('SOLO')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                selectedMode === 'SOLO'
                  ? 'bg-white text-slate-950 border-white shadow-lg'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4" />
              Solo (AI Bots)
            </button>
            <button
              onClick={() => setSelectedMode('MULTIPLAYER')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                selectedMode === 'MULTIPLAYER'
                  ? 'bg-white text-slate-950 border-white shadow-lg'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              Multiplayer (P2P)
            </button>
          </div>

          {/* Map Location Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Map: </span>
            <strong className="text-white">Jantar Mantar, New Delhi</strong>
          </div>
        </div>

        {/* Multiplayer Room Code Input (If selected) */}
        {selectedMode === 'MULTIPLAYER' && (
          <div className="glass-panel p-4 rounded-xl border border-white/15 flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
            <div className="text-xs text-slate-300 font-medium">
              Join specific room or leave empty to host:
            </div>
            <input
              type="text"
              placeholder="e.g. JANTAR"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="px-4 py-2 bg-slate-900/90 border border-white/20 rounded-xl text-sm font-mono text-cyan-400 placeholder:text-slate-500 uppercase tracking-widest focus:outline-none focus:border-cyan-400 text-center w-36"
            />
          </div>
        )}

        {/* Start Game CTA Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStartGame(selectedTeam, selectedMode, roomCode || undefined);
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-black text-lg tracking-wider uppercase shadow-xl shadow-purple-500/30 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer z-10"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>ENTER THE SQUARE</span>
        </button>

        {/* Quick Controls Reminder */}
        <div className="text-center text-[11px] text-slate-400 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono">
          <span>Move: <strong className="text-slate-200">WASD / Arrows</strong></span>
          <span>Sprint: <strong className="text-slate-200">Shift</strong></span>
          <span>Jump: <strong className="text-slate-200">Space</strong></span>
          <span>Slide: <strong className="text-slate-200">C</strong></span>
          <span>Abilities: <strong className="text-slate-200">Q / E / F</strong></span>
        </div>

        {/* Creator & UPI Support Bar */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>Created with passion by </span>
            <span className="text-white font-bold">Shazeb Anwar Khan</span>
          </div>

          {onOpenSupport && (
            <button
              type="button"
              onClick={onOpenSupport}
              className="px-3.5 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 hover:text-pink-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
              <span>Support via UPI: <strong className="font-mono text-white">shazeb26@fam</strong></span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
