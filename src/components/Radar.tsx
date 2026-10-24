import React from 'react';
import { RadarEntity } from '../types/game';
import { Compass } from 'lucide-react';

interface RadarProps {
  entities: RadarEntity[];
  localPlayerId: string;
}

export const Radar: React.FC<RadarProps> = ({ entities, localPlayerId }) => {
  const localEntity = entities.find((e) => e.type === 'LOCAL');
  const radarRadius = 56; // pixel radius of circular radar (112px width/height)
  const mapScale = 1.35; // world meters to radar pixels

  const centerX = radarRadius;
  const centerY = radarRadius;

  return (
    <div className="relative w-28 h-28 rounded-full radar-grid overflow-hidden border border-emerald-500/40 shadow-2xl pointer-events-auto backdrop-blur-md">
      {/* Compass North Marker */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-emerald-400 select-none">
        N
      </div>

      {/* Radar Sweep Animation Line */}
      <div className="absolute inset-0 rounded-full border border-emerald-500/20 pointer-events-none">
        <div className="w-full h-full rounded-full border-t border-emerald-400/60 animate-spin" style={{ animationDuration: '4s' }} />
      </div>

      {/* Crosshairs */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-500/20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-emerald-500/20 pointer-events-none" />

      {/* Render Entities relative to local player */}
      {entities.map((e) => {
        if (!localEntity) return null;

        // Position offset relative to local player
        const dx = (e.x - localEntity.x) * mapScale;
        const dz = (e.z - localEntity.z) * mapScale;

        // Clamp to radar radius
        const dist = Math.hypot(dx, dz);
        if (dist > radarRadius - 6) return null; // Outside radar range

        const screenX = centerX + dx;
        const screenY = centerY + dz;

        if (e.type === 'LOCAL') {
          return (
            <div
              key={e.id}
              className="absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] flex items-center justify-center pointer-events-none z-20"
              style={{ left: screenX, top: screenY }}
            >
              <div
                className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400 filter drop-shadow(0 0 4px #00f0ff)"
                style={{ transform: `rotate(${(e.rotation || 0) * (180 / Math.PI) + 180}deg)` }}
              />
            </div>
          );
        }

        if (e.type === 'POLICE') {
          return (
            <div
              key={e.id}
              className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse pointer-events-none"
              style={{ left: screenX, top: screenY }}
            />
          );
        }

        if (e.type === 'PROTESTOR') {
          if (e.isDetained) return null;
          return (
            <div
              key={e.id}
              className="absolute w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 pointer-events-none"
              style={{ left: screenX, top: screenY }}
            />
          );
        }

        if (e.type === 'BUS') {
          return (
            <div
              key={e.id}
              className="absolute w-3 h-2 -ml-1.5 -mt-1 rounded-[2px] bg-amber-400 border border-black/40 pointer-events-none"
              style={{ left: screenX, top: screenY }}
            />
          );
        }

        if (e.type === 'DRONE') {
          return (
            <div
              key={e.id}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border border-cyan-400/80 animate-ping pointer-events-none"
              style={{ left: screenX, top: screenY }}
            />
          );
        }

        return null;
      })}
    </div>
  );
};
