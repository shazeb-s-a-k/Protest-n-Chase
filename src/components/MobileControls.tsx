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
  isUIIdle?: boolean;
  forceVisible?: boolean;
  onUserInteraction?: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInput,
  currentInput,
  team,
  onUseAbility,
  isUIIdle = false,
  forceVisible = false,
  onUserInteraction,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const centerCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [floatingBasePos, setFloatingBasePos] = useState<{ x: number; y: number } | null>(null);
  const [isSprinting, setIsSprinting] = useState(false);
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );

  const isProtestor = team === 'PROTESTOR';
  const maxTravel = isLandscape ? 40 : 48;

  // Detect touch device & track orientation changes
  useEffect(() => {
    const checkState = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 1024;
      setIsTouchDevice(hasTouch);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkState();
    window.addEventListener('resize', checkState);
    window.addEventListener('orientationchange', checkState);
    return () => {
      window.removeEventListener('resize', checkState);
      window.removeEventListener('orientationchange', checkState);
    };
  }, []);

  const triggerHaptic = (ms = 25) => {
    onUserInteraction?.();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (_) {}
    }
  };

  // Helper to calculate movement vector and update input
  const processMovement = useCallback(
    (clientX: number, clientY: number, centerX: number, centerY: number) => {
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const dist = Math.min(maxTravel, Math.hypot(deltaX, deltaY));
      const angle = Math.atan2(deltaY, deltaX);

      // Deadzone threshold (ignore micro-jitters < 4px)
      if (dist < 4) {
        setKnobPos({ x: 0, y: 0 });
        onInput({
          ...currentInput,
          moveRight: 0,
          moveForward: 0,
        });
        return;
      }

      const normX = (dist / maxTravel) * Math.cos(angle);
      const normY = (dist / maxTravel) * Math.sin(angle);

      setKnobPos({ x: normX * (isLandscape ? 30 : 36), y: normY * (isLandscape ? 30 : 36) });
      setIsJoystickActive(true);

      onInput({
        ...currentInput,
        moveRight: normX,
        moveForward: -normY, // Invert Y so up is forward
      });
    },
    [currentInput, maxTravel, isLandscape, onInput]
  );

  const resetJoystick = useCallback(() => {
    setKnobPos({ x: 0, y: 0 });
    setIsJoystickActive(false);
    activeTouchIdRef.current = null;
    isPointerDownRef.current = false;
    centerCoordsRef.current = null;
    setFloatingBasePos(null);

    onInput({
      ...currentInput,
      moveRight: 0,
      moveForward: 0,
    });
  }, [currentInput, onInput]);

  // Touch handlers for the left steering zone (Dynamic floating joystick)
  const handleZoneTouchStart = (e: React.TouchEvent) => {
    onUserInteraction?.();
    if (activeTouchIdRef.current !== null) return;
    if (e.changedTouches.length === 0) return;

    e.preventDefault();
    const touch = e.changedTouches[0];
    activeTouchIdRef.current = touch.identifier;

    // Place center right under the player's thumb
    const centerX = touch.clientX;
    const centerY = touch.clientY;
    centerCoordsRef.current = { x: centerX, y: centerY };

    // Anchor floating base at touch location (clamped to screen)
    const clampedX = Math.max(isLandscape ? 56 : 64, Math.min(window.innerWidth * 0.42, centerX));
    const clampedY = Math.max(100, Math.min(window.innerHeight - (isLandscape ? 56 : 64), centerY));
    setFloatingBasePos({ x: clampedX, y: clampedY });
    setIsJoystickActive(true);

    processMovement(touch.clientX, touch.clientY, centerX, centerY);
  };

  const handleZoneTouchMove = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current === null || !centerCoordsRef.current) return;
    e.preventDefault();
    onUserInteraction?.();

    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchIdRef.current) {
        processMovement(
          e.touches[i].clientX,
          e.touches[i].clientY,
          centerCoordsRef.current.x,
          centerCoordsRef.current.y
        );
        break;
      }
    }
  };

  const handleZoneTouchEnd = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
        resetJoystick();
        break;
      }
    }
  };

  // Pointer fallback for testing in Chrome Device Emulation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      onUserInteraction?.();
      isPointerDownRef.current = true;
      const rect = joystickBaseRef.current?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : e.clientX;
      const centerY = rect ? rect.top + rect.height / 2 : e.clientY;
      centerCoordsRef.current = { x: centerX, y: centerY };
      processMovement(e.clientX, e.clientY, centerX, centerY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && isPointerDownRef.current && centerCoordsRef.current) {
      processMovement(e.clientX, e.clientY, centerCoordsRef.current.x, centerCoordsRef.current.y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      resetJoystick();
    }
  };

  const toggleSprint = () => {
    triggerHaptic(30);
    const nextSprint = !isSprinting;
    setIsSprinting(nextSprint);
    onInput({ ...currentInput, sprint: nextSprint });
  };

  // Global blur safety
  useEffect(() => {
    const handleBlur = () => resetJoystick();
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [resetJoystick]);

  // If on desktop mouse-only device and not forced, hide controls
  if (!isTouchDevice && !forceVisible) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-30 select-none overflow-hidden touch-none transition-opacity duration-300 ${
        isUIIdle ? 'opacity-40 hover:opacity-100' : 'opacity-100'
      }`}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 8px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 8px)',
      }}
    >
      {/* ============================================================== */}
      {/* 1. Dynamic Left Steering Touch Zone (Covers left 45% of screen) */}
      {/* ============================================================== */}
      <div
        className="absolute left-0 bottom-0 w-[45vw] h-[75vh] pointer-events-auto touch-none z-10"
        onTouchStart={handleZoneTouchStart}
        onTouchMove={handleZoneTouchMove}
        onTouchEnd={handleZoneTouchEnd}
        onTouchCancel={handleZoneTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Visual Virtual Joystick Base & Knob */}
      <div
        ref={joystickBaseRef}
        style={{
          left: floatingBasePos ? `${floatingBasePos.x}px` : undefined,
          top: floatingBasePos ? `${floatingBasePos.y}px` : undefined,
          transform: floatingBasePos ? 'translate(-50%, -50%)' : undefined,
        }}
        className={`pointer-events-none transition-all duration-150 absolute ${
          !floatingBasePos
            ? isLandscape
              ? 'left-6 bottom-4'
              : 'left-4 sm:left-6 bottom-6'
            : ''
        }`}
      >
        <div
          className={`${
            isLandscape ? 'w-26 h-26' : 'w-32 h-32'
          } rounded-full glass-panel border-2 flex items-center justify-center relative shadow-2xl transition-colors duration-200 ${
            isJoystickActive
              ? 'border-cyan-400 bg-slate-900/80 shadow-cyan-500/30'
              : 'border-white/20 bg-slate-950/50'
          }`}
        >
          {/* Inner Guideline Ring */}
          <div
            className={`${
              isLandscape ? 'w-13 h-13' : 'w-16 h-16'
            } rounded-full border border-white/10 pointer-events-none flex items-center justify-center`}
          >
            {/* Direction Arrows */}
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest pointer-events-none">
              MOVE
            </div>
          </div>

          {/* Draggable Knob */}
          <div
            className={`${
              isLandscape ? 'w-11 h-11' : 'w-14 h-14'
            } rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-500 shadow-xl pointer-events-none flex items-center justify-center border-2 border-white/90 transition-transform ${
              isJoystickActive ? 'scale-105 shadow-cyan-400/50' : 'scale-100'
            }`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. Action Buttons & Quick Abilities (Right Side)               */}
      {/* ============================================================== */}
      <div
        className={`absolute right-3 sm:right-6 pointer-events-auto flex flex-col items-end gap-2 z-20 ${
          isLandscape ? 'bottom-2 sm:bottom-3' : 'bottom-5'
        }`}
      >
        {/* Ability Buttons: Horizontal Row in Landscape, 2x2 Grid in Portrait */}
        <div
          className={`flex gap-2 items-center ${
            isLandscape ? 'flex-row' : 'flex-col items-end'
          }`}
        >
          {isProtestor ? (
            <div className={`flex gap-2 ${isLandscape ? 'flex-row' : 'flex-row'}`}>
              {/* Chant */}
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
                className={`${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 text-white active:scale-90 border border-white/20`}
                title="Megaphone Chant"
              >
                <Megaphone className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>

              {/* Viral Live Hype */}
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
                className={`${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white active:scale-90 border border-white/20`}
                title="Viral Live Hype"
              >
                <Flame className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>

              {/* Bus / CRS Van Jailbreak */}
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
                className={`${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white active:scale-90 border border-white/20`}
                title="Vehicle Jailbreak"
              >
                <Unlock className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>

              {/* Human Chain */}
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
                className={`${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white active:scale-90 border border-white/20`}
                title="Human Chain"
              >
                <Users className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 flex-row">
              {/* Barricade */}
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
                className={`${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20`}
                title="Deploy Barricade"
              >
                <Shield className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>

              {/* Tear Gas Canister */}
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
                className={`${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-slate-600 to-zinc-700 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20`}
                title="Tear Gas Canister"
              >
                <AlertTriangle className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>

              {/* Water Cannon */}
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
                className={`${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20`}
                title="Water Cannon"
              >
                <Radio className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>
            </div>
          )}
        </div>

        {/* Primary Action Buttons: Sprint, Slide, Jump */}
        <div className="flex items-end gap-2.5">
          {/* Sprint Toggle */}
          <button
            type="button"
            style={{ touchAction: 'none' }}
            onTouchStart={(e) => {
              e.preventDefault();
              toggleSprint();
            }}
            onClick={toggleSprint}
            className={`${
              isLandscape ? 'w-11 h-11' : 'w-13 h-13'
            } rounded-2xl border flex flex-col items-center justify-center active:scale-90 shadow-xl transition-all ${
              isSprinting
                ? 'bg-amber-500 border-amber-300 text-slate-950 font-black shadow-amber-500/30'
                : 'glass-panel border-white/20 text-slate-300'
            }`}
          >
            <Flame className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
            <span className="text-[7px] font-bold">SPRINT</span>
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
            className={`${
              isLandscape ? 'w-11 h-11' : 'w-13 h-13'
            } rounded-2xl glass-panel border border-white/20 flex flex-col items-center justify-center active:scale-90 text-cyan-300 shadow-xl`}
          >
            <CornerDownRight className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
            <span className="text-[7px] font-bold">SLIDE</span>
          </button>

          {/* Jump Button (Largest & Most Prominent) */}
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
            className={`${
              isLandscape ? 'w-14 h-14' : 'w-16 h-16'
            } rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-600 flex flex-col items-center justify-center active:scale-90 text-white shadow-xl shadow-pink-500/40 border border-white/30`}
          >
            <ChevronsUp className={isLandscape ? 'w-7 h-7' : 'w-8 h-8'} />
            <span className="text-[8px] font-bold">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
