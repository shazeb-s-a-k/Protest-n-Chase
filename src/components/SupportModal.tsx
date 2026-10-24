import React, { useState } from 'react';
import {
  Heart,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  Coffee,
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const upiId = 'shazeb26@fam';
  const creatorName = 'Shazeb Anwar Khan';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-pink-500/30 shadow-2xl shadow-pink-500/10 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                Support The Creator
              </h2>
              <p className="text-xs text-pink-400 font-medium">
                Keep Protest-n-Chase growing & running
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-900/60 border border-pink-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-purple-500/30">
            SA
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Lead Creator & Developer
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-base font-extrabold text-white">
              {creatorName}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              anwarshazeb09@gmail.com
            </div>
          </div>
        </div>

        {/* UPI Support Box */}
        <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-900/90 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Direct UPI Contribution (India)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              Instant 0% Fee
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your support helps fund server costs, multiplayer matchmaking, and future updates like new city maps and characters!
          </p>

          {/* UPI Address Box with Copy Button */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-cyan-500/30">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-mono uppercase">UPI ID</span>
              <span className="text-base sm:text-lg font-black font-mono text-cyan-300 select-all">
                {upiId}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:brightness-110'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>

          {/* Supported UPI Apps Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 mr-1">Works on:</span>
            {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'FamPay', 'Cred'].map((app) => (
              <span
                key={app}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-medium"
              >
                {app}
              </span>
            ))}
          </div>

          {/* Mobile Direct Pay Intent */}
          <a
            href={`upi://pay?pa=${upiId}&pn=Shazeb%20Anwar%20Khan&cu=INR`}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all text-center sm:hidden"
          >
            <Coffee className="w-4 h-4" />
            <span>Open in UPI App (Mobile)</span>
          </a>
        </div>

        {/* GitHub Repository Link */}
        <a
          href="https://github.com/shazeb-s-a-k/Protest-n-Chase"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <svg
              className="w-5 h-5 text-purple-400 fill-current"
              viewBox="0 0 24 24"
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                Star on GitHub: shazeb-s-a-k/Protest-n-Chase
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Open-source 3D WebGL game
              </div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
        </a>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
