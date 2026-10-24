import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  const activeTouchIdRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  const [isJoystickActive, setIsJoystickActive] = useState(false);

  const isProtestor = team === 'PROTESTOR';

  const triggerHaptic = (ms = 25) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

  // Helper to update knob and movement direction
  const updateJoystickPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickRef.current) return;
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const dist = Math.min(48, Math.hypot(deltaX, deltaY));
      const angle = Math.atan2(deltaY, deltaX);

      // Deadzone threshold (ignore tiny micro-jitters < 4px)
      if (dist < 4) {
        setKnobPos({ x: 0, y: 0 });
        onInput({
          ...currentInput,
          moveRight: 0,
          moveForward: 0,
        });
        return;
      }

      const normX = (dist / 48) * Math.cos(angle);
      const normY = (dist / 48) * Math.sin(angle);

      setKnobPos({ x: normX * 36, y: normY * 36 });
      setIsJoystickActive(true);

      onInput({
        ...currentInput,
        moveRight: normX,
        moveForward: -normY, // Invert Y so up is positive forward
      });
    },
    [currentInput, onInput]
  );

  const resetJoystick = useCallback(() => {
    setKnobPos({ x: 0, y: 0 });
    setIsJoystickActive(false);
    activeTouchIdRef.current = null;
    isPointerDownRef.current = false;
    onInput({
      ...currentInput,
      moveRight: 0,
      moveForward: 0,
    });
  }, [currentInput, onInput]);

  // Touch handlers with multi-touch ID isolation
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (activeTouchIdRef.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      activeTouchIdRef.current = touch.identifier;
      updateJoystickPosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (activeTouchIdRef.current === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchIdRef.current) {
        updateJoystickPosition(e.touches[i].clientX, e.touches[i].clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (activeTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
        resetJoystick();
        break;
      }
    }
  };

  // Pointer / Mouse fallback for Chrome Device Mode testing
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      isPointerDownRef.current = true;
      joystickRef.current?.setPointerCapture(e.pointerId);
      updateJoystickPosition(e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && isPointerDownRef.current) {
      updateJoystickPosition(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      try {
        joystickRef.current?.releasePointerCapture(e.pointerId);
      } catch (_) {}
      resetJoystick();
    }
  };

  const toggleSprint = () => {
    triggerHaptic(30);
    const nextSprint = !isSprinting;
    setIsSprinting(nextSprint);
    onInput({ ...currentInput, sprint: nextSprint });
  };

  // Global safety release if window blurs or loses focus
  useEffect(() => {
    const handleBlur = () => resetJoystick();
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [resetJoystick]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 select-none md:hidden overflow-hidden"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
      }}
    >
      {/* 1. Left Virtual Joystick */}
      <div className="absolute left-3 sm:left-6 bottom-5 pointer-events-auto">
        <div
          ref={joystickRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          className={`w-32 h-32 rounded-full glass-panel border-2 flex items-center justify-center relative shadow-2xl transition-colors ${
            isJoystickActive ? 'border-cyan-400/70 bg-slate-900/80' : 'border-white/20'
          }`}
        >
          {/* Inner Guideline Ring */}
          <div className="w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

          {/* Draggable Knob */}
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-500 shadow-xl pointer-events-none flex items-center justify-center border-2 border-white/80 transition-shadow ${
              isJoystickActive
                ? 'shadow-cyan-400/50 scale-105'
                : 'shadow-pink-500/30 scale-100'
            }`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
          </div>
        </div>
      </div>

      {/* 2. Floating Mobile Quick Abilities (Above Action Buttons) */}
      <div className="absolute right-3 sm:right-6 bottom-28 pointer-events-auto flex flex-col gap-2 items-end">
        {isProtestor ? (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic();
                  onUseAbility('MEGAPHONE');
                }}
                onClick={() => {
                  triggerHaptic();
                  onUseAbility('MEGAPHONE');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 text-white active:scale-90 border border-white/20"
                title="Megaphone Chant"
              >
                <Megaphone className="w-5 h-5" />
              </button>
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic();
                  onUseAbility('LIVESTREAM');
                }}
                onClick={() => {
                  triggerHaptic();
                  onUseAbility('LIVESTREAM');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white active:scale-90 border border-white/20"
                title="Viral Live Hype"
              >
                <Flame className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic();
                  onUseAbility('BUS_RESCUE');
                }}
                onClick={() => {
                  triggerHaptic();
                  onUseAbility('BUS_RESCUE');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white active:scale-90 border border-white/20"
                title="Bus Jailbreak"
              >
                <Unlock className="w-5 h-5" />
              </button>
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic();
                  onUseAbility('HUMAN_CHAIN');
                }}
                onClick={() => {
                  triggerHaptic();
                  onUseAbility('HUMAN_CHAIN');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white active:scale-90 border border-white/20"
                title="Human Chain"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic();
                  onUseAbility('BARRICADE');
                }}
                onClick={() => {
                  triggerHaptic();
                  onUseAbility('BARRICADE');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20"
                title="Deploy Barricade"
              >
                <Shield className="w-5 h-5" />
              </button>
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic();
                  onUseAbility('SMOKE');
                }}
                onClick={() => {
                  triggerHaptic();
                  onUseAbility('SMOKE');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-600 to-zinc-700 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20"
                title="Tear Gas Canister"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic();
                  onUseAbility('WATER');
                }}
                onClick={() => {
                  triggerHaptic();
                  onUseAbility('WATER');
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20"
                title="Water Cannon"
              >
                <Radio className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 3. Right Action Buttons: Sprint, Slide, Jump */}
      <div className="absolute right-3 sm:right-6 bottom-5 pointer-events-auto flex items-end gap-2.5">
        {/* Sprint Toggle */}
        <button
          type="button"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => {
            e.preventDefault();
            toggleSprint();
          }}
          onClick={toggleSprint}
          className={`w-13 h-13 rounded-2xl border flex flex-col items-center justify-center active:scale-90 shadow-xl transition-all ${
            isSprinting
              ? 'bg-amber-500 border-amber-300 text-slate-950 font-black shadow-amber-500/30'
              : 'glass-panel border-white/20 text-slate-300'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[8px] font-bold">SPRINT</span>
        </button>

        {/* Slide Button */}
        <button
          type="button"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic();
            onInput({ ...currentInput, slide: true });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput({ ...currentInput, slide: false });
          }}
          onTouchCancel={() => onInput({ ...currentInput, slide: false })}
          onMouseDown={() => onInput({ ...currentInput, slide: true })}
          onMouseUp={() => onInput({ ...currentInput, slide: false })}
          onMouseLeave={() => onInput({ ...currentInput, slide: false })}
          className="w-13 h-13 rounded-2xl glass-panel border border-white/20 flex flex-col items-center justify-center active:scale-90 text-cyan-300 shadow-xl"
        >
          <CornerDownRight className="w-5 h-5" />
          <span className="text-[8px] font-bold">SLIDE</span>
        </button>

        {/* Jump Button */}
        <button
          type="button"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => {
            e.preventDefault();
            triggerHaptic(35);
            onInput({ ...currentInput, jump: true });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput({ ...currentInput, jump: false });
          }}
          onTouchCancel={() => onInput({ ...currentInput, jump: false })}
          onMouseDown={() => onInput({ ...currentInput, jump: true })}
          onMouseUp={() => onInput({ ...currentInput, jump: false })}
          onMouseLeave={() => onInput({ ...currentInput, jump: false })}
          className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-600 flex flex-col items-center justify-center active:scale-90 text-white shadow-xl shadow-pink-500/40 border border-white/30"
        >
          <ChevronsUp className="w-8 h-8" />
          <span className="text-[9px] font-bold">JUMP</span>
        </button>
      </div>
    </div>
  );
};
