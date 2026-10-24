import React, { useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownRight, ChevronsUp, Flame } from 'lucide-react';
import { MovementInput } from '../engine/CharacterController';

interface MobileControlsProps {
  onInput: (input: MovementInput) => void;
  currentInput: MovementInput;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInput,
  currentInput,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true);
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
    const dist = Math.min(45, Math.hypot(deltaX, deltaY));
    const angle = Math.atan2(deltaY, deltaX);

    const normX = (dist / 45) * Math.cos(angle);
    const normY = (dist / 45) * Math.sin(angle);

    setKnobPos({ x: normX * 35, y: normY * 35 });

    // Update input: Forward is negative Y in screen space
    onInput({
      ...currentInput,
      moveRight: normX,
      moveForward: -normY,
    });
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
    setKnobPos({ x: 0, y: 0 });
    onInput({
      ...currentInput,
      moveRight: 0,
      moveForward: 0,
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none">
      {/* Left Virtual Joystick */}
      <div className="absolute left-6 bottom-8 pointer-events-auto sm:hidden">
        <div
          ref={joystickRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-28 h-28 rounded-full glass-panel border-2 border-white/20 flex items-center justify-center relative touch-action-btn shadow-2xl"
        >
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 shadow-lg absolute pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          />
        </div>
      </div>

      {/* Right Action Buttons: Jump & Slide */}
      <div className="absolute right-6 bottom-8 pointer-events-auto flex items-end gap-3 sm:hidden">
        {/* Slide Button */}
        <button
          onTouchStart={() => onInput({ ...currentInput, slide: true })}
          onTouchEnd={() => onInput({ ...currentInput, slide: false })}
          className="w-14 h-14 rounded-full glass-panel border border-white/20 flex flex-col items-center justify-center active:scale-90 text-cyan-300 shadow-xl"
        >
          <CornerDownRight className="w-5 h-5" />
          <span className="text-[9px] font-bold">SLIDE</span>
        </button>

        {/* Jump Button */}
        <button
          onTouchStart={() => onInput({ ...currentInput, jump: true })}
          onTouchEnd={() => onInput({ ...currentInput, jump: false })}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex flex-col items-center justify-center active:scale-90 text-white shadow-xl shadow-pink-500/40"
        >
          <ChevronsUp className="w-7 h-7" />
          <span className="text-[9px] font-bold">JUMP</span>
        </button>
      </div>
    </div>
  );
};
