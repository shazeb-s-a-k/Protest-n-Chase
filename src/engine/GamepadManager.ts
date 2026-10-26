import { MovementInput } from './CharacterController';

export interface GamepadActions {
  input: MovementInput;
  cameraLookX: number;
  cameraLookY: number;
  usePrimaryAbility: boolean;
  useSecondaryAbility: boolean;
  toggleEmoteWheel: boolean;
  recenterCamera: boolean;
  cycleKafila: boolean;
  cycleRadio: boolean;
}

export class GamepadManager {
  private activeGamepadIndex: number | null = null;
  private prevButtonStates: boolean[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
        console.log(`🎮 Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}`);
        this.activeGamepadIndex = e.gamepad.index;
      });

      window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
        console.log(`Gamepad disconnected from index ${e.gamepad.index}`);
        if (this.activeGamepadIndex === e.gamepad.index) {
          this.activeGamepadIndex = null;
        }
      });
    }
  }

  public isGamepadConnected(): boolean {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return false;
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] !== null) return true;
    }
    return false;
  }

  public poll(): GamepadActions | null {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;

    const gamepads = navigator.getGamepads();
    let pad: Gamepad | null = null;

    if (this.activeGamepadIndex !== null && gamepads[this.activeGamepadIndex]) {
      pad = gamepads[this.activeGamepadIndex];
    } else {
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          pad = gamepads[i];
          this.activeGamepadIndex = i;
          break;
        }
      }
    }

    if (!pad) return null;

    // Apply deadzones
    const deadzone = 0.15;
    const rawLx = pad.axes[0] || 0;
    const rawLy = pad.axes[1] || 0;
    const rawRx = pad.axes[2] || 0;
    const rawRy = pad.axes[3] || 0;

    const lx = Math.abs(rawLx) > deadzone ? rawLx : 0;
    const ly = Math.abs(rawLy) > deadzone ? rawLy : 0;
    const rx = Math.abs(rawRx) > deadzone ? rawRx : 0;
    const ry = Math.abs(rawRy) > deadzone ? rawRy : 0;

    // Buttons
    const btnA = pad.buttons[0]?.pressed || false; // Jump / Tap
    const btnB = pad.buttons[1]?.pressed || false; // Slide
    const btnX = pad.buttons[2]?.pressed || false; // Primary
    const btnY = pad.buttons[3]?.pressed || false; // Emote Wheel
    const btnLB = pad.buttons[4]?.pressed || false; // Secondary (Leaflets)
    const btnRB = pad.buttons[5]?.pressed || false; // Sprint
    const btnLT = pad.buttons[6]?.pressed || false; // Recenter
    const btnRT = pad.buttons[7]?.pressed || false; // Sprint (Trigger)

    const dpadUp = pad.buttons[12]?.pressed || false;
    const dpadDown = pad.buttons[13]?.pressed || false;
    const dpadRight = pad.buttons[15]?.pressed || false;

    // Edge-triggered actions (only on press down, not hold)
    const justPressed = (idx: number, isPressed: boolean) => {
      const wasPressed = this.prevButtonStates[idx] || false;
      this.prevButtonStates[idx] = isPressed;
      return isPressed && !wasPressed;
    };

    const actionPrimary = justPressed(2, btnX);
    const actionEmote = justPressed(3, btnY);
    const actionSecondary = justPressed(4, btnLB);
    const actionRecenter = justPressed(6, btnLT);
    const actionKafila = justPressed(12, dpadUp) || justPressed(13, dpadDown);
    const actionRadio = justPressed(15, dpadRight);

    return {
      input: {
        moveForward: -ly,
        moveRight: lx,
        sprint: btnRB || btnRT,
        jump: btnA,
        slide: btnB,
      },
      cameraLookX: rx * 5.0,
      cameraLookY: ry * 3.5,
      usePrimaryAbility: actionPrimary,
      useSecondaryAbility: actionSecondary,
      toggleEmoteWheel: actionEmote,
      recenterCamera: actionRecenter,
      cycleKafila: actionKafila,
      cycleRadio: actionRadio,
    };
  }

  /**
   * Dual-rumble haptic feedback vibration
   */
  public vibrate(durationMs: number = 200, strongMagnitude: number = 0.5, weakMagnitude: number = 0.5) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (this.activeGamepadIndex !== null && gamepads[this.activeGamepadIndex]) {
      const pad = gamepads[this.activeGamepadIndex];
      const actuator = (pad as any)?.vibrationActuator;
      if (actuator && actuator.playEffect) {
        try {
          actuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: durationMs,
            weakMagnitude,
            strongMagnitude,
          });
        } catch (_) {}
      }
    }
  }

  public pollInput(): {
    connected: boolean;
    moveForward: number;
    moveRight: number;
    sprint: boolean;
    jump: boolean;
    slide: boolean;
    lookX: number;
    lookY: number;
    actionA: boolean;
    actionB: boolean;
  } {
    const act = this.poll();
    if (!act) {
      return {
        connected: false,
        moveForward: 0,
        moveRight: 0,
        sprint: false,
        jump: false,
        slide: false,
        lookX: 0,
        lookY: 0,
        actionA: false,
        actionB: false,
      };
    }
    return {
      connected: true,
      moveForward: act.input.moveForward,
      moveRight: act.input.moveRight,
      sprint: act.input.sprint,
      jump: act.input.jump,
      slide: act.input.slide,
      lookX: act.cameraLookX,
      lookY: act.cameraLookY,
      actionA: act.usePrimaryAbility,
      actionB: act.useSecondaryAbility,
    };
  }

  public rumble(weak: number = 0.5, strong: number = 0.5, durationMs: number = 200) {
    this.vibrate(durationMs, strong, weak);
  }

  public destroy() {
    this.activeGamepadIndex = null;
    this.prevButtonStates = [];
  }
}
