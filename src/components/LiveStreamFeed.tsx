import React from 'react';
import { LiveStreamComment, SuperChat } from '../types/game';
import { Heart, Sparkles, Zap } from 'lucide-react';

interface LiveStreamFeedProps {
  comments: LiveStreamComment[];
  superchats: SuperChat[];
}

export const LiveStreamFeed: React.FC<LiveStreamFeedProps> = ({
  comments,
  superchats,
}) => {
  return (
    <div className="absolute left-3 bottom-48 sm:left-6 sm:bottom-28 w-60 sm:w-84 pointer-events-none flex flex-col gap-2 z-20">
      {/* SuperChat Donation Callouts */}
      {superchats.slice(-2).map((sc) => (
        <div
          key={sc.id}
          className="glass-panel p-2.5 rounded-2xl border border-amber-400/50 bg-amber-950/70 shadow-xl shadow-amber-500/20 flex items-center gap-2.5 animate-bounce"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
            ₹
          </div>
          <div className="flex-1 overflow-hidden leading-tight">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-300 text-xs">{sc.user}</span>
              <span className="text-[11px] font-mono font-bold text-amber-200">
                ₹{sc.amount.toLocaleString()}
              </span>
            </div>
            <div className="text-[11px] text-white/90 mt-0.5 truncate">{sc.message}</div>
          </div>
        </div>
      ))}

      {/* Floating Live Chat Container */}
      <div className="flex flex-col-reverse gap-1.5 max-h-48 overflow-hidden mask-gradient-b">
        {comments.slice(-6).map((c) => (
          <div
            key={c.id}
            className="glass-panel px-3 py-1.5 rounded-xl border border-white/10 flex items-start gap-2 text-xs backdrop-blur-md shadow-md animate-float-up"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 shadow-sm">
              {c.user[0]}
            </div>
            <div className="flex-1 overflow-hidden leading-tight">
              <span className="font-bold text-slate-200 text-[11px] mr-1.5">
                {c.user}
              </span>
              <span className="text-slate-300 font-normal">{c.text}</span>
            </div>
            {c.emoji && <span className="text-sm">{c.emoji}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
