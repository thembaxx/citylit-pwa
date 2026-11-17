import type { AmbientKind, AmbientMixerSettings, LandmarkBiome } from '../types/citylit';

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
  private trafficBand: FilterBand | null = null;
  private enabled = false;
  private volume = 0.8;
  private mixer = { wind: 0.8, birds: 0.75, traffic: 0.4 };
  private trafficPassTimer = 3.5;
  private hapticsEnabled = true;
  private reducedMotion = false;

  setPreferences(opts: {
    volume: number;
    mixer?: AmbientMixerSettings;
    haptics: boolean;
    reducedMotion: boolean;
  }): void {
    this.volume = Math.max(0, Math.min(1, opts.volume));
    if (opts.mixer) {
      this.mixer = {
        wind: Math.max(0, Math.min(1, opts.mixer.wind / 100)),
        birds: Math.max(0, Math.min(1, opts.mixer.birds / 100)),
        traffic: Math.max(0, Math.min(1, opts.mixer.traffic / 100)),
      };
    }
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
    this.trafficBand = makeBand(this.brownBuf, 'bandpass', 155, 0.72);
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

  private chirp(biome: LandmarkBiome): void {
    if (!this.ctx || !this.masterGain || this.mixer.birds <= 0.001) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    const isCoastal = biome === 'coastal';
    const f = isCoastal ? 1150 + Math.random() * 550 : 2200 + Math.random() * 1900;
    const dur = isCoastal ? 0.32 : 0.16;
    const peak = (isCoastal ? 0.045 : 0.055) * this.mixer.birds;
    osc.type = isCoastal ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(
      f * (isCoastal ? 0.65 + Math.random() * 0.2 : 0.7 + Math.random() * 0.7),
      t + dur * 0.85
    );
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.04);
  }

  private trafficPassby(intensity: number): void {
    if (!this.ctx || !this.masterGain || !this.brownBuf || intensity <= 0.001) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = 1.5 + Math.random() * 0.9;
    const src = ctx.createBufferSource();
    src.buffer = this.brownBuf;
    const fl = ctx.createBiquadFilter();
    fl.type = 'bandpass';
    fl.Q.value = 1.1;
    fl.frequency.setValueAtTime(420 + Math.random() * 140, t);
    fl.frequency.exponentialRampToValueAtTime(140 + Math.random() * 50, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05 * intensity, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(fl);
    fl.connect(g);
    g.connect(this.masterGain);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  update(
    dt: number,
    elapsed: number,
    kind: AmbientKind,
    biome: LandmarkBiome,
    wind: number,
    rain: number,
    night: number,
    lightning: number
  ): void {
    if (!this.ctx || !this.windBand || !this.waterBand || !this.hissBand || !this.trafficBand) {
      return;
    }
    const t = this.ctx.currentTime;

    const mountainBoost = biome === 'mountain' || biome === 'desert' ? 1.25 : 1.0;
    const windGain = (0.012 + (0.055 * wind) / 3.5) * mountainBoost * this.mixer.wind;
    this.windBand.g.gain.setTargetAtTime(windGain, t, 0.25);
    this.windBand.fl.frequency.setTargetAtTime(
      (biome === 'mountain' ? 380 : 300) + 260 * Math.sin(elapsed * 0.35) + wind * 120,
      t,
      0.3
    );

    const isSurf = biome === 'coastal' || biome === 'wetland' || kind === 's';
    const isCascade = biome === 'waterfall' || kind === 'f';
    const surfGain = isSurf
      ? (biome === 'wetland' ? 0.04 : 0.075) * (1 + 0.65 * Math.sin(elapsed * 0.72))
      : 0;
    const cascadeGain = isCascade ? 0.075 : 0;
    this.waterBand.g.gain.setTargetAtTime(surfGain + cascadeGain + lightning * 0.04, t, 0.3);
    this.waterBand.fl.frequency.setTargetAtTime(
      isCascade ? 780 : 400 + 320 * Math.sin(elapsed * 0.72),
      t,
      0.3
    );

    const sprayHiss = isCascade
      ? 0.055
      : isSurf
        ? 0.025 * Math.max(0, Math.sin(elapsed * 0.72))
        : 0;
    const hissLevel = sprayHiss * (0.35 + 0.65 * this.mixer.wind) + rain * 0.055;
    this.hissBand.g.gain.setTargetAtTime(hissLevel, t, 0.25);

    const urbanFactor =
      biome === 'urban'
        ? 1
        : biome === 'coastal'
          ? 0.55
          : biome === 'waterfall' || biome === 'mountain'
            ? 0.32
            : 0.24;
    const swell = 0.65 + 0.35 * Math.sin(elapsed * 0.37) * Math.cos(elapsed * 0.19);
    const trafficGain = this.mixer.traffic * urbanFactor * swell * 0.095;
    this.trafficBand.g.gain.setTargetAtTime(trafficGain, t, 0.25);
    this.trafficBand.fl.frequency.setTargetAtTime(
      145 + 35 * Math.sin(elapsed * 0.27) + urbanFactor * 25,
      t,
      0.3
    );

    if (this.enabled && this.mixer.birds > 0.01) {
      const birdSiteRate =
        biome === 'savannah' || biome === 'wetland'
          ? 1.4
          : biome === 'coastal'
            ? 0.85
            : kind === 'b'
              ? 1.25
              : 0.45;
      const prob = dt * (1 - night * 0.75) * (1 - rain * 0.8) * birdSiteRate * this.mixer.birds;
      if (Math.random() < prob) {
        this.chirp(biome);
      }
    }

    if (this.enabled && this.mixer.traffic > 0.04) {
      this.trafficPassTimer -= dt;
      if (this.trafficPassTimer <= 0) {
        this.trafficPassby(this.mixer.traffic * urbanFactor);
        this.trafficPassTimer = (3.2 + Math.random() * 4.5) / Math.max(0.3, urbanFactor);
      }
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
