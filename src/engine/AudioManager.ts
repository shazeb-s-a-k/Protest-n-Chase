/**
 * Audio Engine: Web Audio API Procedural Synthesizer
 * Generates rich, authentic sounds in real time without external mp3 dependencies.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive: boolean = false;
  private chantInterval: number | null = null;

  constructor() {
    // AudioContext will be initialized on user interaction (browser autoplay policy)
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Sound 1: Megaphone Acoustic Blast
   * Emits a megaphone-style resonant chirp with distortion harmonics
   */
  public playMegaphoneChant() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Megaphone horn filter: peak bandpass around 1200Hz
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(3.5, t);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(720, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.35);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.42);

    // Complementary crowd voice burst
    this.playCrowdCheer(0.3);
  }

  /**
   * Sound 2: Protest Dhol / Drum Beat (Punchy resonant rhythm)
   */
  public playDrumBeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Sound 3: Police Whistle (High pitch FM modulation)
   */
  public playWhistle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(2600, t);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(32, t); // rapid warble

    modGain.gain.setValueAtTime(200, t);

    modulator.connect(carrier.frequency);
    carrier.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    carrier.start(t);
    modulator.start(t);
    carrier.stop(t + 0.36);
    modulator.stop(t + 0.36);
  }

  /**
   * Sound 4: Police Siren Toggle (Continuous Doppler Siren)
   */
  public startSiren(intensity: number = 0.4) {
    if (this.isSirenActive || this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.isSirenActive = true;
    const t = this.ctx.currentTime;

    this.sirenOsc1 = this.ctx.createOscillator();
    this.sirenOsc2 = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc1.type = 'sine';
    this.sirenOsc2.type = 'sawtooth';

    // Dual-tone wailing siren
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.6, t); // 0.6 Hz cycle
    lfoGain.gain.setValueAtTime(300, t);

    this.sirenOsc1.frequency.setValueAtTime(750, t);
    this.sirenOsc2.frequency.setValueAtTime(750, t);

    lfo.connect(this.sirenOsc1.frequency);
    lfo.connect(this.sirenOsc2.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    this.sirenGain.gain.setValueAtTime(0.15 * intensity, t);

    this.sirenOsc1.connect(filter);
    this.sirenOsc2.connect(filter);
    filter.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);

    lfo.start(t);
    this.sirenOsc1.start(t);
    this.sirenOsc2.start(t);
  }

  public stopSiren() {
    if (!this.isSirenActive) return;
    try {
      if (this.sirenOsc1) this.sirenOsc1.stop();
      if (this.sirenOsc2) this.sirenOsc2.stop();
    } catch (_) {}
    this.isSirenActive = false;
  }

  /**
   * Sound 5: Rapid-Tap Tension Heartbeat (Lub-Dub)
   */
  public playTensionHeartbeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // First beat
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, t);
    osc1.frequency.exponentialRampToValueAtTime(30, t + 0.1);
    gain1.gain.setValueAtTime(0.9, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.11);

    // Second beat (slightly higher)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(75, t + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(35, t + 0.24);
    gain2.gain.setValueAtTime(0.7, t + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.24);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.14);
    osc2.stop(t + 0.25);
  }

  /**
   * Sound 6: Break-Free Success Woosh / Dash
   */
  public playBreakoutDash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.25);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Sound 7: Smoke Canister Hiss / Deflection Clank
   */
  public playCanisterKick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Metallic impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.15);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Sound 8: Water Cannon Splash / Continuous Spray
   */
  public playWaterCannonSpray() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Synthesize water noise using filtered buffer
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(1400, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  /**
   * Sound 9: Crowd Cheering & Applause
   */
  public playCrowdCheer(volume = 0.5) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, t);
    filter.Q.setValueAtTime(1.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.78);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  /**
   * Sound 10: Jump / Parkour Slide
   */
  public playParkourAction(type: 'JUMP' | 'SLIDE') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'JUMP') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    } else {
      // Slide woosh
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Sound 11: Detainment Handcuff Click
   */
  public playHandcuffClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.setValueAtTime(2400, t + 0.05);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Ambient Rhythm Loop (protest beat every 2 seconds)
   */
  public startAmbientProtestLoop() {
    if (this.chantInterval) return;
    let beatCount = 0;
    this.chantInterval = window.setInterval(() => {
      beatCount++;
      if (beatCount % 2 === 0) {
        this.playDrumBeat();
      }
      if (beatCount % 6 === 0) {
        this.playCrowdCheer(0.2);
      }
    }, 700);
  }

  public stopAmbientProtestLoop() {
    if (this.chantInterval) {
      clearInterval(this.chantInterval);
      this.chantInterval = null;
    }
  }
}

export const audioManager = new AudioManager();
