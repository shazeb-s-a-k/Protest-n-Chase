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
  Zap,
  Siren,
  Compass,
  Coffee,
} from 'lucide-react';
import { MovementInput } from '../engine/CharacterController';
import { Team } from '../types/game';

interface MobileControlsProps {
  onInput: (input: MovementInput) => void;
  currentInput: MovementInput;
  team: Team;
  onUseAbility: (ability: string) => void;
  onRotateCamera?: (deltaX: number, deltaY: number) => void;
  onZoomCamera?: (deltaZoom: number) => void;
  onRecenterCamera?: () => void;
  abilityCooldowns?: Map<string, number>;
  isUIIdle?: boolean;
  forceVisible?: boolean;
  onUserInteraction?: () => void;
  nearInteractiveStation?: { type: string; label: string; actionText: string } | null;
  onInteractStation?: () => void;
  detentionCountdown?: number;
  onTapDetained?: () => void;
  onScatterLeaflets?: () => void;
  onCycleKafilaCommand?: () => void;
  kafilaCommand?: string;
  kafilaCount?: number;
  leafletsRemaining?: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInput,
  currentInput,
  team,
  onUseAbility,
  onRotateCamera,
  onZoomCamera,
  onRecenterCamera,
  abilityCooldowns,
  isUIIdle = false,
  forceVisible = false,
  onUserInteraction,
  nearInteractiveStation,
  onInteractStation,
  detentionCountdown,
  onTapDetained,
  onScatterLeaflets,
  onCycleKafilaCommand,
  kafilaCommand,
  kafilaCount,
  leafletsRemaining,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const centerCoordsRef = useRef<{ x: number; y: number } | null>(null);

  // Dedicated Mobile Camera Touch Swipe & Pinch Refs
  const activeCameraTouchIdRef = useRef<number | null>(null);
  const lastCameraTouchPosRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const lastCameraTapTimeRef = useRef<number>(0);

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
        ('ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches) ||
        (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
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

  // ==============================================================
  // Dedicated Mobile Camera Touch Swipe & Two-Finger Pinch Zoom
  // Properly filters out the movement joystick touch so camera rotates
  // flawlessly while the player is moving with their thumb!
  // ==============================================================
  const getCameraTouches = (touchList: React.TouchList) => {
    const list: React.Touch[] = [];
    for (let i = 0; i < touchList.length; i++) {
      const t = touchList[i];
      if (t.identifier !== activeTouchIdRef.current) {
        list.push(t);
      }
    }
    return list;
  };

  const handleCameraTouchStart = (e: React.TouchEvent) => {
    onUserInteraction?.();
    const camTouches = getCameraTouches(e.touches);

    // Two dedicated camera fingers triggers pinch zoom
    if (camTouches.length >= 2) {
      pinchStartDistRef.current = Math.hypot(
        camTouches[0].clientX - camTouches[1].clientX,
        camTouches[0].clientY - camTouches[1].clientY
      );
      return;
    }

    if (activeCameraTouchIdRef.current !== null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Skip the joystick touch
      if (touch.identifier === activeTouchIdRef.current) continue;

      // Do not capture touches strictly inside the bottom-left joystick home area
      if (touch.clientX < window.innerWidth * 0.38 && touch.clientY > window.innerHeight * 0.45) {
        continue;
      }

      // Quick double-tap anywhere in camera view recenters camera directly behind player
      const now = Date.now();
      if (now - lastCameraTapTimeRef.current < 280) {
        triggerHaptic(30);
        onRecenterCamera?.();
        lastCameraTapTimeRef.current = 0;
      } else {
        lastCameraTapTimeRef.current = now;
      }

      activeCameraTouchIdRef.current = touch.identifier;
      lastCameraTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
      break;
    }
  };

  const handleCameraTouchMove = (e: React.TouchEvent) => {
    onUserInteraction?.();
    const camTouches = getCameraTouches(e.touches);

    // Two dedicated camera touches handles pinch zoom
    if (camTouches.length >= 2 && pinchStartDistRef.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        camTouches[0].clientX - camTouches[1].clientX,
        camTouches[0].clientY - camTouches[1].clientY
      );
      const deltaZoom = (pinchStartDistRef.current - dist) * 0.02;
      pinchStartDistRef.current = dist;
      onZoomCamera?.(deltaZoom);
      return;
    }

    if (activeCameraTouchIdRef.current === null || !lastCameraTouchPosRef.current) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === activeCameraTouchIdRef.current) {
        e.preventDefault();
        const deltaX = touch.clientX - lastCameraTouchPosRef.current.x;
        const deltaY = touch.clientY - lastCameraTouchPosRef.current.y;
        lastCameraTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
        onRotateCamera?.(deltaX, deltaY);
        break;
      }
    }
  };

  const handleCameraTouchEnd = (e: React.TouchEvent) => {
    const camTouches = getCameraTouches(e.touches);
    if (camTouches.length < 2) {
      pinchStartDistRef.current = null;
    }
    if (activeCameraTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeCameraTouchIdRef.current) {
        activeCameraTouchIdRef.current = null;
        lastCameraTouchPosRef.current = null;
        break;
      }
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

  const getCD = (k: string) => abilityCooldowns?.get(k) || 0;

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
      {/* 0. Fullscreen / Right-side Touch Camera Swipe & Pinch Surface   */}
      {/* ============================================================== */}
      <div
        className="absolute inset-0 z-0 touch-none"
        style={{ pointerEvents: isTouchDevice ? 'auto' : 'none' }}
        onTouchStart={handleCameraTouchStart}
        onTouchMove={handleCameraTouchMove}
        onTouchEnd={handleCameraTouchEnd}
        onTouchCancel={handleCameraTouchEnd}
      />

      {/* Quick Action Button: Chai / Espresso Station */}
      {nearInteractiveStation && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic(45);
            onInteractStation?.();
          }}
          className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 pointer-events-auto z-40 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-2xl shadow-amber-500/50 border border-white/30 animate-bounce active:scale-95 transition-transform"
        >
          <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span>{nearInteractiveStation.actionText}</span>
        </button>
      )}

      {/* Quick Action Button: Pick Lock Escape when Detained */}
      {detentionCountdown !== undefined && detentionCountdown > 0 && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic(50);
            onTapDetained?.();
          }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-50 px-6 py-4 sm:px-8 sm:py-5 rounded-3xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-base sm:text-xl uppercase tracking-wider flex flex-col items-center gap-2 shadow-2xl shadow-red-500/60 border-2 border-white/40 animate-pulse active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-2">
            <Unlock className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300 animate-bounce" />
            <span>TAP RAPIDLY TO PICK LOCK!</span>
          </div>
          <span className="text-xs text-yellow-200 font-bold">
            RESCUE IN: {detentionCountdown.toFixed(1)}s (TAP TO ESCAPE FASTER!)
          </span>
        </button>
      )}

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
        className={`pointer-events-none transition-all duration-150 absolute z-10 ${
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
                className={`relative ${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 text-white active:scale-90 border border-white/20 overflow-hidden`}
                title="Megaphone Chant"
              >
                <Megaphone className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
                {getCD('MEGAPHONE') > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-mono font-bold text-pink-300">
                    {Math.ceil(getCD('MEGAPHONE'))}s
                  </div>
                )}
              </button>

              {/* Parkour Vault Dash */}
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic(40);
                  onUseAbility('PARKOUR_DASH');
                }}
                onClick={() => {
                  triggerHaptic(40);
                  onUseAbility('PARKOUR_DASH');
                }}
                className={`relative ${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 text-white active:scale-90 border border-white/20 overflow-hidden`}
                title="Parkour Dash Vault"
              >
                <Zap className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
                {getCD('PARKOUR_DASH') > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-mono font-bold text-cyan-300">
                    {Math.ceil(getCD('PARKOUR_DASH'))}s
                  </div>
                )}
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
                className={`relative ${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white active:scale-90 border border-white/20 overflow-hidden`}
                title="Viral Live Hype"
              >
                <Flame className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
                {getCD('LIVESTREAM') > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-mono font-bold text-cyan-200">
                    {Math.ceil(getCD('LIVESTREAM'))}s
                  </div>
                )}
              </button>

              {/* Bus Jailbreak */}
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
                className={`relative ${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white active:scale-90 border border-white/20 overflow-hidden`}
                title="Vehicle Jailbreak"
              >
                <Unlock className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>

              {/* Kafila Squad Command */}
              {onCycleKafilaCommand && (
                <button
                  type="button"
                  style={{ touchAction: 'none' }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    triggerHaptic();
                    onCycleKafilaCommand();
                  }}
                  onClick={() => {
                    triggerHaptic();
                    onCycleKafilaCommand();
                  }}
                  className={`relative ${
                    isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                  } rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg text-white active:scale-90 border border-emerald-400/30 overflow-hidden`}
                  title="Squad Command (March, Halla Bol, Dharna, Scatter)"
                >
                  <Users className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
                  <span className="absolute bottom-0 text-[8px] font-mono font-bold text-emerald-200">
                    {kafilaCount || 0}
                  </span>
                </button>
              )}

              {/* Scatter Leaflet Decoy */}
              {onScatterLeaflets && (
                <button
                  type="button"
                  disabled={(leafletsRemaining ?? 3) <= 0}
                  style={{ touchAction: 'none' }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    triggerHaptic();
                    onScatterLeaflets();
                  }}
                  onClick={() => {
                    triggerHaptic();
                    onScatterLeaflets();
                  }}
                  className={`relative ${
                    isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                  } rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg text-white active:scale-90 border border-cyan-400/30 overflow-hidden disabled:opacity-40`}
                  title="Scatter Leaflets Decoy"
                >
                  <span className={isLandscape ? 'text-xs' : 'text-sm'}>📄</span>
                  <span className="absolute bottom-0 text-[8px] font-mono font-bold text-cyan-200">
                    {leafletsRemaining ?? 3}
                  </span>
                </button>
              )}
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
                className={`relative ${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20 overflow-hidden`}
                title="Deploy Barricade"
              >
                <Shield className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
                {getCD('BARRICADE') > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-mono font-bold text-amber-200">
                    {Math.ceil(getCD('BARRICADE'))}s
                  </div>
                )}
              </button>

              {/* Pursuit Boost Sprint */}
              <button
                type="button"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic(50);
                  onUseAbility('PURSUIT_BOOST');
                }}
                onClick={() => {
                  triggerHaptic(50);
                  onUseAbility('PURSUIT_BOOST');
                }}
                className={`relative ${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/40 text-white active:scale-90 border border-white/20 overflow-hidden`}
                title="Pursuit Siren Overdrive"
              >
                <Siren className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
                {getCD('PURSUIT_BOOST') > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-mono font-bold text-rose-200">
                    {Math.ceil(getCD('PURSUIT_BOOST'))}s
                  </div>
                )}
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
                className={`relative ${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-slate-600 to-zinc-700 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20 overflow-hidden`}
                title="Tear Gas Canister"
              >
                <AlertTriangle className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
                {getCD('SMOKE') > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-mono font-bold text-slate-200">
                    {Math.ceil(getCD('SMOKE'))}s
                  </div>
                )}
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
                className={`relative ${
                  isLandscape ? 'w-10 h-10' : 'w-11 h-11'
                } rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white active:scale-90 border border-white/20 overflow-hidden`}
                title="Water Cannon"
              >
                <Radio className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
                {getCD('WATER') > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-mono font-bold text-blue-200">
                    {Math.ceil(getCD('WATER'))}s
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Primary Action Buttons: Recenter, Sprint, Slide, Jump */}
        <div className="flex items-end gap-2.5">
          {/* Recenter Camera Button */}
          {onRecenterCamera && (
            <button
              type="button"
              style={{ touchAction: 'none' }}
              onTouchStart={(e) => {
                e.preventDefault();
                triggerHaptic(30);
                onRecenterCamera();
              }}
              onClick={() => {
                triggerHaptic(30);
                onRecenterCamera();
              }}
              className={`${
                isLandscape ? 'w-10 h-10' : 'w-11 h-11'
              } rounded-2xl glass-panel border border-emerald-400/40 bg-emerald-950/40 flex flex-col items-center justify-center active:scale-90 text-emerald-300 shadow-xl`}
              title="Recenter Camera Behind Player"
            >
              <Compass className={isLandscape ? 'w-4 h-4' : 'w-5 h-5'} />
              <span className="text-[6px] font-bold tracking-tighter uppercase">CAM</span>
            </button>
          )}

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
