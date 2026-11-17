import type { AmbientKind } from '../types/citylit';

interface FilterBand {
  fl: BiquadFilterNode;
  g: GainNode;
}

class AmbientAudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private brownBuf: AudioBuffer | null = null;
  private whiteBuf: AudioBuffer | null = null;
  private windBand: FilterBand | null = null;
  private waterBand: FilterBand | null = null;
  private hissBand: FilterBand | null = null;
  private enabled = false;
  private volume = 0.8;
  private hapticsEnabled = true;
  private reducedMotion = false;

  setPreferences(opts: { volume: number; haptics: boolean; reducedMotion: boolean }): void {
    this.volume = opts.volume;
    this.hapticsEnabled = opts.haptics;
    this.reducedMotion = opts.reducedMotion;
    if (this.enabled && this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  vibrate(pattern: number | number[]): void {
    try {
      if (this.hapticsEnabled && !this.reducedMotion && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore unsupported vibration environments
    }
  }

  private ensureContext(): void {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    const makeNoiseBuffer = (isWhite: boolean): AudioBuffer => {
      const ctx = this.ctx!;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i++) {
        const x = Math.random() * 2 - 1;
        brown = isWhite ? x : 0.97 * brown + 0.03 * x;
        data[i] = isWhite ? x * 0.5 : brown * 6;
      }
      return buf;
    };

    const makeBand = (
      buf: AudioBuffer,
      type: BiquadFilterType,
      freq: number,
      q: number
    ): FilterBand => {
      const ctx = this.ctx!;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const fl = ctx.createBiquadFilter();
      fl.type = type;
      fl.frequency.value = freq;
      fl.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(fl);
      fl.connect(g);
      g.connect(this.masterGain!);
      src.start();
      return { fl, g };
    };

    this.brownBuf = makeNoiseBuffer(false);
    this.whiteBuf = makeNoiseBuffer(true);
    this.windBand = makeBand(this.brownBuf, 'bandpass', 500, 0.6);
    this.waterBand = makeBand(this.brownBuf, 'lowpass', 600, 0.4);
    this.hissBand = makeBand(this.whiteBuf, 'bandpass', 3000, 0.5);
  }

  toggle(): boolean {
    this.ensureContext();
    this.enabled = !this.enabled;
    if (this.ctx && this.masterGain) {
      void this.ctx.resume();
      this.masterGain.gain.setTargetAtTime(
        this.enabled ? this.volume : 0,
        this.ctx.currentTime,
        0.4
      );
    }
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  playSfx(kind: 'whoosh' | 'ping' | 'thunder' | 'open'): void {
    if (!this.ctx || !this.enabled || !this.masterGain) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const m = this.masterGain;

    const playNoise = (
      buf: AudioBuffer | null,
      type: BiquadFilterType,
      f0: number,
      f1: number,
      dur: number,
      gain: number,
      q: number
    ) => {
      if (!buf) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const fl = ctx.createBiquadFilter();
      fl.type = type;
      fl.Q.value = q;
      fl.frequency.setValueAtTime(f0, t);
      fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(fl);
      fl.connect(g);
      g.connect(m);
      src.start(t);
      src.stop(t + dur + 0.1);
    };

    const playTone = (freq: number, dur: number, gain: number, delay: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(gain, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
      osc.connect(g);
      g.connect(m);
      osc.start(t + delay);
      osc.stop(t + delay + dur + 0.05);
    };

    if (kind === 'whoosh') {
      playNoise(this.whiteBuf, 'bandpass', 300, 3000, 0.7, 0.35, 0.8);
    } else if (kind === 'ping') {
      playTone(880, 0.5, 0.12, 0);
      playTone(1320, 0.7, 0.08, 0.05);
    } else if (kind === 'thunder') {
      playNoise(this.brownBuf, 'lowpass', 400, 60, 1.9, 0.9, 0.5);
    } else if (kind === 'open') {
      playNoise(this.whiteBuf, 'bandpass', 200, 2400, 1.1, 0.3, 0.7);
      playTone(220, 1.2, 0.08, 0);
    }
  }

  private chirp(): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    const f = 2200 + Math.random() * 1800;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * (0.7 + Math.random() * 0.7), t + 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  update(
    dt: number,
    elapsed: number,
    kind: AmbientKind,
    wind: number,
    rain: number,
    night: number,
    lightning: number
  ): void {
    if (!this.ctx || !this.windBand || !this.waterBand || !this.hissBand) return;
    const t = this.ctx.currentTime;
    this.windBand.g.gain.setTargetAtTime(0.01 + (0.05 * wind) / 3.5, t, 0.3);
    this.windBand.fl.frequency.setTargetAtTime(
      300 + 260 * Math.sin(elapsed * 0.35) + wind * 120,
      t,
      0.3
    );
    this.waterBand.g.gain.setTargetAtTime(
      (kind === 's' ? 0.07 * (1 + 0.6 * Math.sin(elapsed * 0.8)) : 0) + lightning * 0.04,
      t,
      0.3
    );
    this.waterBand.fl.frequency.setTargetAtTime(400 + 300 * Math.sin(elapsed * 0.8), t, 0.3);
    this.hissBand.g.gain.setTargetAtTime((kind === 'f' ? 0.05 : 0) + rain * 0.05, t, 0.3);
    if (this.enabled && kind === 'b' && Math.random() < dt * (1 - night) * (1 - rain) * 1.2) {
      this.chirp();
    }
  }

  handleVisibilityChange(hidden: boolean): void {
    if (!this.ctx) return;
    if (hidden) {
      void this.ctx.suspend();
    } else if (this.enabled) {
      void this.ctx.resume();
    }
  }
}

export const ambientAudio = new AmbientAudioController();
