/**
 * Audio Engine: Web Audio API Procedural Synthesizer & Speech Chants
 * Generates rich, authentic sounds in real time without external mp3 dependencies.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive: boolean = false;
  private chantInterval: number | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private speechAvailable: boolean = false;

  constructor() {
    this.speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();

          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);

          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
          this.sfxGain.connect(this.masterGain);

          this.bgmGain = this.ctx.createGain();
          this.bgmGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
          this.bgmGain.connect(this.masterGain);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('Web Audio initialization note:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.75, this.ctx.currentTime);
    }
    if (muted && this.speechAvailable) {
      window.speechSynthesis.cancel();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Speech Synthesizer Voice Slogans (Gen-Z & Crowd Slogans)
   */
  public speakSlogan(text: string) {
    if (this.isMuted || !this.speechAvailable) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 1.1;
      utterance.volume = 0.85;

      // Try selecting an English/Hindi voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.includes('en-IN') || v.lang.includes('hi-IN') || v.lang.includes('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }

  /**
   * Sound 1: Megaphone Acoustic Blast
   */
  public playMegaphoneChant() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(3.5, t);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(720, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.35);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.42);

    this.playCrowdCheer(0.35);

    // Random vocal slogan
    const slogans = [
      'Awaaz do, hum ek hain!',
      'Youth united for the future!',
      'Our voices cannot be silenced!',
      'Save our trees and air!',
    ];
    if (Math.random() < 0.4) {
      this.speakSlogan(slogans[Math.floor(Math.random() * slogans.length)]);
    }
  }

  /**
   * Sound 2: Protest Dhol / Drum Beat
   */
  public playDrumBeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.bgmGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.18);

    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Sound 3: Police Whistle (Sharp FM Modulation)
   */
  public playWhistle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(2600, t);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(32, t);

    modGain.gain.setValueAtTime(220, t);

    modulator.connect(carrier.frequency);
    carrier.connect(gain);
    gain.connect(this.sfxGain);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    carrier.start(t);
    modulator.start(t);
    carrier.stop(t + 0.36);
    modulator.stop(t + 0.36);
  }

  /**
   * Sound 4: Continuous Doppler Police Siren
   */
  public startSiren(intensity: number = 0.4) {
    if (this.isSirenActive || this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    this.isSirenActive = true;
    const t = this.ctx.currentTime;

    this.sirenOsc1 = this.ctx.createOscillator();
    this.sirenOsc2 = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc1.type = 'sine';
    this.sirenOsc2.type = 'sawtooth';

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.65, t);
    lfoGain.gain.setValueAtTime(320, t);

    this.sirenOsc1.frequency.setValueAtTime(780, t);
    this.sirenOsc2.frequency.setValueAtTime(780, t);

    lfo.connect(this.sirenOsc1.frequency);
    lfo.connect(this.sirenOsc2.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1450, t);

    this.sirenGain.gain.setValueAtTime(0.18 * intensity, t);

    this.sirenOsc1.connect(filter);
    this.sirenOsc2.connect(filter);
    filter.connect(this.sirenGain);
    this.sirenGain.connect(this.sfxGain);

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
   * Sound 5: Rapid-Tap Tension Heartbeat
   */
  public playTensionHeartbeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, t);
    osc1.frequency.exponentialRampToValueAtTime(30, t + 0.1);
    gain1.gain.setValueAtTime(0.95, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.11);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(75, t + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(35, t + 0.24);
    gain2.gain.setValueAtTime(0.75, t + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.24);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.14);
    osc2.stop(t + 0.25);
  }

  /**
   * Sound 6: Break-Free Dash / Woosh
   */
  public playBreakoutDash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(850, t + 0.25);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Sound 7: Smoke Canister Deflection Clank
   */
  public playCanisterKick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.15);
    gain.gain.setValueAtTime(0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Sound 8: Water Cannon Splash & Jet
   */
  public playWaterCannonSpray() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, t);
    filter.frequency.linearRampToValueAtTime(1500, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  /**
   * Sound 9: Crowd Cheering & Applause
   */
  public playCrowdCheer(volume = 0.5) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.85;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(880, t);
    filter.Q.setValueAtTime(1.6, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.82);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  /**
   * Sound 10: Jump & Slide
   */
  public playParkourAction(type: 'JUMP' | 'SLIDE') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'JUMP') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.12);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Sound 11: Detainment Handcuff Click
   */
  public playHandcuffClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1900, t);
    osc.frequency.setValueAtTime(2500, t + 0.05);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Sound 12: Human Chain Resonance
   */
  public playHumanChainResonance() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.4);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  /**
   * Ambient Rhythm Loop (protest beat every 700ms)
   */
  public startAmbientProtestLoop() {
    if (this.chantInterval) return;
    let beatCount = 0;
    this.chantInterval = window.setInterval(() => {
      beatCount++;
      if (beatCount % 2 === 0) {
        this.playDrumBeat();
      }
      if (beatCount % 8 === 0) {
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
