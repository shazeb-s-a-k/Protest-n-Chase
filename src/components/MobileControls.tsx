import React, { useRef, useState } from 'react';
import {
  ChevronsUp,
  CornerDownRight,
  Flame,
  Megaphone,
  Shield,
  Radio,
  Unlock,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { MovementInput } from '../engine/CharacterController';
import { Team } from '../types/game';

interface MobileControlsProps {
  onInput: (input: MovementInput) => void;
  currentInput: MovementInput;
  team: Team;
  onUseAbility: (ability: string) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInput,
  currentInput,
  team,
  onUseAbility,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);

  const isProtestor = team === 'PROTESTOR';

  const triggerHaptic = (ms = 30) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const dist = Math.min(48, Math.hypot(deltaX, deltaY));
    const angle = Math.atan2(deltaY, deltaX);

    const normX = (dist / 48) * Math.cos(angle);
    const normY = (dist / 48) * Math.sin(angle);

    setKnobPos({ x: normX * 36, y: normY * 36 });

    onInput({
      ...currentInput,
      moveRight: normX,
      moveForward: -normY,
    });
  };

  const handleTouchEnd = () => {
    setKnobPos({ x: 0, y: 0 });
    onInput({
      ...currentInput,
      moveRight: 0,
      moveForward: 0,
    });
  };

  const toggleSprint = () => {
    triggerHaptic(25);
    const nextSprint = !isSprinting;
    setIsSprinting(nextSprint);
    onInput({ ...currentInput, sprint: nextSprint });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none md:hidden">
      {/* 1. Left Virtual Joystick */}
      <div className="absolute left-4 bottom-6 pointer-events-auto">
        <div
          ref={joystickRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-32 h-32 rounded-full glass-panel border-2 border-white/20 flex items-center justify-center relative touch-action-btn shadow-2xl"
        >
          {/* Inner Joystick Ring */}
          <div className="w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

          {/* Draggable Knob */}
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 shadow-xl shadow-cyan-500/30 absolute pointer-events-none transition-transform duration-75 flex items-center justify-center border-2 border-white/60"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* 2. Floating Mobile Quick Abilities (Top-Right of Joystick or Right-Mid) */}
      <div className="absolute right-4 bottom-28 pointer-events-auto flex flex-col gap-2.5 items-end">
        {isProtestor ? (
          <>
            <div className="flex gap-2">
              <button
                onTouchStart={() => {
                  triggerHaptic();
                  onUseAbility('MEGAPHONE');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 text-white active:scale-90"
              >
                <Megaphone className="w-5 h-5" />
              </button>
              <button
                onTouchStart={() => {
                  triggerHaptic();
                  onUseAbility('LIVESTREAM');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white active:scale-90"
              >
                <Flame className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onTouchStart={() => {
                  triggerHaptic();
                  onUseAbility('BUS_RESCUE');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white active:scale-90"
              >
                <Unlock className="w-5 h-5" />
              </button>
              <button
                onTouchStart={() => {
                  triggerHaptic();
                  onUseAbility('HUMAN_CHAIN');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white active:scale-90"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onTouchStart={() => {
                  triggerHaptic();
                  onUseAbility('BARRICADE');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg text-white active:scale-90"
              >
                <Shield className="w-5 h-5" />
              </button>
              <button
                onTouchStart={() => {
                  triggerHaptic();
                  onUseAbility('SMOKE');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-600 to-zinc-700 flex items-center justify-center shadow-lg text-white active:scale-90"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
              <button
                onTouchStart={() => {
                  triggerHaptic();
                  onUseAbility('WATER');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white active:scale-90"
              >
                <Radio className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 3. Right Action Buttons: Sprint, Slide, Jump */}
      <div className="absolute right-4 bottom-6 pointer-events-auto flex items-end gap-3">
        {/* Sprint Toggle */}
        <button
          onTouchStart={toggleSprint}
          className={`w-13 h-13 rounded-2xl border flex flex-col items-center justify-center active:scale-90 shadow-xl transition-all ${
            isSprinting
              ? 'bg-amber-500 border-amber-300 text-slate-950 font-black'
              : 'glass-panel border-white/20 text-slate-300'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[8px] font-bold">SPRINT</span>
        </button>

        {/* Slide Button */}
        <button
          onTouchStart={() => {
            triggerHaptic();
            onInput({ ...currentInput, slide: true });
          }}
          onTouchEnd={() => onInput({ ...currentInput, slide: false })}
          className="w-13 h-13 rounded-2xl glass-panel border border-white/20 flex flex-col items-center justify-center active:scale-90 text-cyan-300 shadow-xl"
        >
          <CornerDownRight className="w-5 h-5" />
          <span className="text-[8px] font-bold">SLIDE</span>
        </button>

        {/* Jump Button */}
        <button
          onTouchStart={() => {
            triggerHaptic(35);
            onInput({ ...currentInput, jump: true });
          }}
          onTouchEnd={() => onInput({ ...currentInput, jump: false })}
          className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-600 flex flex-col items-center justify-center active:scale-90 text-white shadow-xl shadow-pink-500/40 border border-white/30"
        >
          <ChevronsUp className="w-8 h-8" />
          <span className="text-[9px] font-bold">JUMP</span>
        </button>
      </div>
    </div>
  );
};
