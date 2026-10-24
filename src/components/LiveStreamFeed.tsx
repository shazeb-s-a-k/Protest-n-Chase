import React from 'react';
import { LiveStreamComment } from '../types/game';
import { MessageSquare, Heart } from 'lucide-react';

interface LiveStreamFeedProps {
  comments: LiveStreamComment[];
}

export const LiveStreamFeed: React.FC<LiveStreamFeedProps> = ({ comments }) => {
  return (
    <div className="absolute left-3 bottom-24 sm:left-6 sm:bottom-28 w-64 sm:w-80 pointer-events-none flex flex-col gap-1.5 z-20">
      {/* Floating Chat Container */}
      <div className="flex flex-col-reverse gap-1.5 max-h-48 overflow-hidden mask-gradient-b">
        {comments.slice(-6).map((c) => (
          <div
            key={c.id}
            className="glass-panel px-3 py-1.5 rounded-xl border border-white/10 flex items-start gap-2 text-xs backdrop-blur-md shadow-md animate-float-up"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
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
