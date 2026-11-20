import type {
  AmbientKind,
  AmbientMixerSettings,
  AmbientSiteProfile,
  LandmarkBiome,
  SpatialAudioSource,
} from '../types/citylit';

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const smoothBell = (x: number, start: number, peak: number, end: number): number => {
  if (x <= start || x >= end) return 0;
  return x <= peak ? smoothstep(start, peak, x) : 1 - smoothstep(peak, end, x);
};

const equalPower = (x: number): number => Math.sin(clamp01(x) * Math.PI * 0.5);

/** Base tactile vibration signatures (ms alternating on/off) for each biome. */
const BIOME_HAPTIC_PATTERNS: Record<LandmarkBiome, readonly number[]> = {
  coastal: [24, 42, 16, 52, 12],
  waterfall: [14, 18, 20, 18, 28, 18, 12],
  mountain: [32, 48, 36],
  savannah: [14, 28, 22, 54, 14],
  urban: [12, 24, 12],
  desert: [10, 66, 18],
  wetland: [14, 38, 18, 46, 12],
};

/** Provincial cadence & trailing accent ([pauseMs, vibrateMs, ...]) layered per region. */
const REGION_HAPTIC_ACCENTS: Record<string, { tempo: number; tail: readonly number[] }> = {
  'Western Cape': { tempo: 1.08, tail: [36, 12] },
  Gauteng: { tempo: 0.85, tail: [20, 10] },
  'KwaZulu-Natal': { tempo: 1, tail: [26, 14, 26, 10] },
  'Northern Cape': { tempo: 1.22, tail: [58, 14] },
  Mpumalanga: { tempo: 0.96, tail: [28, 20] },
  Limpopo: { tempo: 1.12, tail: [34, 22] },
  'Eastern Cape': { tempo: 1.04, tail: [30, 16, 24, 12] },
  'North West': { tempo: 0.94, tail: [32, 16] },
  'Free State': { tempo: 1.15, tail: [42, 16] },
};

const extractRegionName = (regionOrPlace?: string): string | undefined => {
  if (!regionOrPlace) return undefined;
  const parts = regionOrPlace.split(' · ');
  return (parts.length > 1 ? parts[parts.length - 1] : regionOrPlace).trim();
};

interface FilterBand {
  fl: BiquadFilterNode;
  g: GainNode;
}

interface SpatialEmitter {
  def: SpatialAudioSource;
  gain: GainNode;
  panner: StereoPannerNode | null;
  /** Bandpass/lowpass nodes whose cutoff is gently modulated per frame. */
  filters: BiquadFilterNode[];
  /** Looping buffer sources that need stopping when the site changes. */
  sources: AudioBufferSourceNode[];
  /** Every node owned by the emitter, disconnected together on teardown. */
  nodes: AudioNode[];
  /** Countdown to the next one-shot event for birds or insects. */
  timer: number;
  /** Per-emitter phase so emitters never swell in lockstep. */
  phase: number;
}

export interface SpatialListener {
  /** Listener (camera) position in diorama space. */
  position: readonly [x: number, y: number, z: number];
  /** Camera right axis in world space, used for stereo panning. */
  right: readonly [x: number, y: number, z: number];
  /** Camera forward axis in world space, used to soften rear sources. */
  forward: readonly [x: number, y: number, z: number];
}

class AmbientAudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array<ArrayBuffer> | null = null;
  private brownBuf: AudioBuffer | null = null;
  private whiteBuf: AudioBuffer | null = null;
  private windBand: FilterBand | null = null;
  private gustBand: FilterBand | null = null;
  private waterBand: FilterBand | null = null;
  private hissBand: FilterBand | null = null;
  private rainBodyBand: FilterBand | null = null;
  private stormRumbleBand: FilterBand | null = null;
  private trafficBand: FilterBand | null = null;
  private enabled = false;
  private volume = 0.8;
  private mixer = { wind: 0.8, birds: 0.75, traffic: 0.4 };
  private trafficPassTimer = 3.5;
  private cricketTimer = 1.2;
  private winterGustPhase = 0;
  private seasonMonth = new Date().getMonth() + 1;
  private tgtSummer = 0.5;
  private tgtAutumn = 0;
  private tgtWinter = 0.5;
  private tgtSpring = 0;
  private curSummer = 0.5;
  private curAutumn = 0;
  private curWinter = 0.5;
  private curSpring = 0;
  private hasProfileState = false;
  private curWind = 1;
  private curRain = 0;
  private curFog = 0;
  private curStorm = 0;
  private tgtDawn = 0;
  private tgtDay = 1;
  private tgtDusk = 0;
  private tgtNight = 0;
  private curDawn = 0;
  private curDay = 1;
  private curDusk = 0;
  private curNight = 0;
  private curSurf = 0;
  private curCascade = 0;
  private curMountain = 1;
  private curUrban = 0.3;
  private curBirdSite = 0.6;
  private curCricketBiome = 1;
  private hapticsEnabled = true;
  private reducedMotion = false;
  private site: AmbientSiteProfile | null = null;
  private cameraYaw = 0;
  private spatialSources: readonly SpatialAudioSource[] = [];
  private spatialEmitters = new Map<string, SpatialEmitter>();
  private listener: SpatialListener | null = null;
  private spatialActive = true;

  constructor() {
    this.setSeasonMonth(this.seasonMonth, true);
  }

  /** Swap/morph seasonal audio profile from calendar month (1–12, Southern Hemisphere). */
  setSeasonMonth(month: number, immediate = false): void {
    const clamped = Math.max(1, Math.min(12, Math.round(month)));
    this.seasonMonth = clamped;
    const angle = ((clamped - 1) / 12) * Math.PI * 2;
    this.tgtSummer = (Math.cos(angle) + 1) * 0.5;
    this.tgtWinter = 1 - this.tgtSummer;
    this.tgtAutumn = Math.max(0, Math.sin(angle));
    this.tgtSpring = Math.max(0, -Math.sin(angle));
    if (immediate) {
      this.curSummer = this.tgtSummer;
      this.curAutumn = this.tgtAutumn;
      this.curWinter = this.tgtWinter;
      this.curSpring = this.tgtSpring;
    }
  }

  getSeasonMonth(): number {
    return this.seasonMonth;
  }

  /** Site-specific sound profile supplied by the diorama kit. */
  setSiteProfile(profile: AmbientSiteProfile | null): void {
    this.site = profile;
    this.spatialSources = profile?.sources ?? [];
    this.rebuildSpatialEmitters();
  }

  /** Camera azimuth (radians) used to pan site events around the listener. */
  setCameraYaw(yaw: number): void {
    this.cameraYaw = yaw;
  }

  /** Listener basis supplied by the engine each frame. */
  updateSpatialListener(listener: SpatialListener): void {
    this.listener = listener;
  }

  /** Mute positional emitters while the globe overlay replaces the diorama. */
  setSpatialActive(active: boolean): void {
    this.spatialActive = active;
    if (!active && this.ctx) {
      const now = this.ctx.currentTime;
      for (const emitter of this.spatialEmitters.values()) {
        emitter.gain.gain.setTargetAtTime(0, now, 0.08);
      }
    }
  }

  private eventPan(jitter = 0): number {
    const anchor = this.site?.pan ?? 0;
    const p = Math.sin(this.cameraYaw * 0.55 + anchor) * 0.72 + jitter;
    return Math.max(-0.95, Math.min(0.95, p));
  }

  private connectPanned(node: AudioNode, pan: number): void {
    const ctx = this.ctx;
    const master = this.masterGain;
    if (!ctx || !master) return;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      node.connect(panner);
      panner.connect(master);
    } else {
      node.connect(master);
    }
  }

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

  /** Build a unique haptic signature combining biome character and provincial cadence. */
  getLandmarkVibrationPattern(biome: LandmarkBiome, regionOrPlace?: string): number[] {
    const base = BIOME_HAPTIC_PATTERNS[biome] ?? [15];
    const region = extractRegionName(regionOrPlace);
    const accent = region ? REGION_HAPTIC_ACCENTS[region] : undefined;
    if (!accent) return [...base];
    const scaled = base.map((ms) => Math.max(8, Math.round(ms * accent.tempo)));
    return [...scaled, ...accent.tail];
  }

  /** Trigger a biome- and region-specific haptic pulse via `vibrate`. */
  vibrateForLandmark(biome: LandmarkBiome, regionOrPlace?: string): void {
    this.vibrate(this.getLandmarkVibrationPattern(biome, regionOrPlace));
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
    if (typeof this.ctx.createAnalyser === 'function') {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -94;
      this.analyser.maxDecibels = -22;
      this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } else {
      this.masterGain.connect(this.ctx.destination);
    }

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
    this.gustBand = makeBand(this.whiteBuf, 'bandpass', 1100, 2.2);
    this.waterBand = makeBand(this.brownBuf, 'lowpass', 600, 0.4);
    this.hissBand = makeBand(this.whiteBuf, 'bandpass', 3000, 0.5);
    this.rainBodyBand = makeBand(this.brownBuf, 'bandpass', 720, 0.55);
    this.stormRumbleBand = makeBand(this.brownBuf, 'lowpass', 120, 0.7);
    this.trafficBand = makeBand(this.brownBuf, 'bandpass', 155, 0.72);

    this.rebuildSpatialEmitters();
  }

  /* ------------------------------------------------------------------ */
  /* Positional emitters                                                 */
  /* ------------------------------------------------------------------ */

  private rebuildSpatialEmitters(): void {
    const ctx = this.ctx;
    const master = this.masterGain;

    if (this.spatialEmitters.size > 0) {
      const retiring = Array.from(this.spatialEmitters.values());
      this.spatialEmitters.clear();
      if (ctx) {
        const now = ctx.currentTime;
        for (const emitter of retiring) {
          emitter.gain.gain.setTargetAtTime(0, now, 0.11);
        }
        window.setTimeout(() => {
          for (const emitter of retiring) {
            for (const source of emitter.sources) {
              try {
                source.stop();
              } catch {
                // Source may already have ended; disconnecting below is enough.
              }
            }
            for (const node of emitter.nodes) {
              node.disconnect();
            }
          }
        }, 420);
      } else {
        for (const emitter of retiring) {
          for (const node of emitter.nodes) {
            node.disconnect();
          }
        }
      }
    }

    if (!ctx || !master) return;

    for (const def of this.spatialSources) {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const nodes: AudioNode[] = [gain];

      let panner: StereoPannerNode | null = null;
      if (typeof ctx.createStereoPanner === 'function') {
        panner = ctx.createStereoPanner();
        gain.connect(panner);
        panner.connect(master);
        nodes.push(panner);
      } else {
        gain.connect(master);
      }

      const filters: BiquadFilterNode[] = [];
      const sources: AudioBufferSourceNode[] = [];

      if (def.kind === 'waterfall' || def.kind === 'surf') {
        const brown = this.brownBuf;
        if (brown) {
          const source = ctx.createBufferSource();
          source.buffer = brown;
          source.loop = true;
          const filter = ctx.createBiquadFilter();
          filter.type = def.kind === 'waterfall' ? 'lowpass' : 'bandpass';
          filter.frequency.value = def.kind === 'waterfall' ? 760 : 520;
          filter.Q.value = def.kind === 'waterfall' ? 0.55 : 0.9;
          source.connect(filter);
          filter.connect(gain);
          source.start();
          sources.push(source);
          filters.push(filter);
          nodes.push(source, filter);
        }

        if (def.kind === 'waterfall' && this.whiteBuf) {
          const spraySource = ctx.createBufferSource();
          spraySource.buffer = this.whiteBuf;
          spraySource.loop = true;
          const sprayFilter = ctx.createBiquadFilter();
          sprayFilter.type = 'bandpass';
          sprayFilter.frequency.value = 2650;
          sprayFilter.Q.value = 0.75;
          const sprayGain = ctx.createGain();
          sprayGain.gain.value = 0.22;
          spraySource.connect(sprayFilter);
          sprayFilter.connect(sprayGain);
          sprayGain.connect(gain);
          spraySource.start();
          sources.push(spraySource);
          filters.push(sprayFilter);
          nodes.push(spraySource, sprayFilter, sprayGain);
        }
      }

      this.spatialEmitters.set(def.id, {
        def,
        gain,
        panner,
        filters,
        sources,
        nodes,
        timer: 0.6 + Math.random() * 2.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private updateSpatial(dt: number, elapsed: number, biome: LandmarkBiome): void {
    const ctx = this.ctx;
    const listener = this.listener;
    if (!ctx || !listener) return;

    const now = ctx.currentTime;
    const [lx, ly, lz] = listener.position;
    const [rx, , rz] = listener.right;
    const [fx, fy, fz] = listener.forward;

    for (const emitter of this.spatialEmitters.values()) {
      const [px, py, pz] = emitter.def.position;
      const dx = px - lx;
      const dy = py - ly;
      const dz = pz - lz;
      const distance = Math.max(0.001, Math.hypot(dx, dy, dz));
      const horizontal = Math.max(0.0001, Math.hypot(dx, dz));

      // Inverse-distance falloff anchored to the source's physical radius.
      const closeness = emitter.def.radius / (emitter.def.radius + distance);
      // Project the source onto the camera-right axis for stereo placement.
      const pan = Math.max(-0.95, Math.min(0.95, ((dx * rx + dz * rz) / horizontal) * 0.9));
      // Rear sources sit a little softer than sources in front of the camera.
      const facing = (dx * fx + dy * fy + dz * fz) / distance;
      const frontal = 0.72 + 0.28 * Math.max(0, facing);
      const bus =
        emitter.def.kind === 'birds' || emitter.def.kind === 'insects' ? this.mixer.birds : 1;
      const active = this.spatialActive && this.enabled ? 1 : 0;
      const target = emitter.def.gain * closeness * frontal * bus * active;

      emitter.gain.gain.setTargetAtTime(target, now, 0.22);
      emitter.panner?.pan.setTargetAtTime(pan, now, 0.14);

      for (let i = 0; i < emitter.filters.length; i++) {
        const filter = emitter.filters[i];
        const base = emitter.def.kind === 'waterfall' ? (i === 0 ? 760 : 2650) : 520;
        const swing = emitter.def.kind === 'waterfall' ? (i === 0 ? 180 : 460) : 120;
        filter.frequency.setTargetAtTime(
          base + Math.sin(elapsed * (0.55 + i * 0.23) + emitter.phase) * swing,
          now,
          0.35
        );
      }

      if (!this.enabled || !this.spatialActive) continue;

      emitter.timer -= dt;
      if (emitter.timer > 0) continue;

      const rainFade = 1 - equalPower(this.curRain) * 0.85;
      const fogFade = 1 - this.curFog * 0.28;
      if (emitter.def.kind === 'birds') {
        const timeBird =
          this.curDawn * 1.35 + this.curDay * 1.0 + this.curDusk * 0.45 + this.curNight * 0.15;
        const seasonBird =
          0.55 + this.curSpring * 0.65 + this.curSummer * 0.35 + this.curAutumn * 0.25;
        if (Math.random() < Math.min(0.95, 0.72 * timeBird * rainFade * fogFade * seasonBird)) {
          this.emitterChirp(emitter, biome);
        }
        emitter.timer = (1.5 + Math.random() * 3.1) / Math.max(0.2, this.mixer.birds * seasonBird);
      } else if (emitter.def.kind === 'insects') {
        const summerWarmth = Math.max(0, (this.curSummer - 0.18) / 0.82);
        const duskNightMix = clamp01(this.curDusk * 0.65 + this.curNight);
        if (summerWarmth > 0.08 && Math.random() < summerWarmth * rainFade) {
          if (Math.random() < duskNightMix) {
            this.emitterCricket(emitter, 0.55 + 0.55 * summerWarmth * (0.4 + 0.6 * duskNightMix));
          } else {
            this.emitterCicada(emitter);
          }
        }
        emitter.timer = (1.1 + Math.random() * 2.2) / Math.max(0.4, 0.6 + summerWarmth * 0.8);
      }
    }
  }

  private emitterChirp(emitter: SpatialEmitter, biome: LandmarkBiome): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const coastal = biome === 'coastal';
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = coastal ? 1150 + Math.random() * 550 : 2200 + Math.random() * 1900;
    const duration = coastal ? 0.32 : 0.16;

    osc.type = coastal ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(
      freq * (coastal ? 0.65 + Math.random() * 0.2 : 0.7 + Math.random() * 0.7),
      now + duration * 0.85
    );
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(coastal ? 0.045 : 0.055, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(emitter.gain);
    osc.start(now);
    osc.stop(now + duration + 0.04);
    osc.onended = () => gain.disconnect();
  }

  private emitterCicada(emitter: SpatialEmitter): void {
    const ctx = this.ctx;
    const white = this.whiteBuf;
    if (!ctx || !white) return;
    const now = ctx.currentTime;
    const duration = 0.5 + Math.random() * 0.4;
    const source = ctx.createBufferSource();
    source.buffer = white;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200 + Math.random() * 900;
    filter.Q.value = 9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.linearRampToValueAtTime(0.018, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 38 + Math.random() * 10;
    lfoGain.gain.value = 0.011;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(emitter.gain);
    source.start(now);
    source.stop(now + duration + 0.05);
    lfo.start(now);
    lfo.stop(now + duration + 0.05);
    source.onended = () => {
      filter.disconnect();
      gain.disconnect();
      lfoGain.disconnect();
    };
  }

  private emitterCricket(emitter: SpatialEmitter, intensity = 1): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 2);
    const baseFreq = 4200 + Math.random() * 550;
    for (let i = 0; i < pulses; i++) {
      const at = now + i * 0.058;
      const dur = 0.036;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, at);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.94, at + dur);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.022 * intensity, at + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
      osc.connect(gain);
      gain.connect(emitter.gain);
      osc.start(at);
      osc.stop(at + dur + 0.015);
      osc.onended = () => gain.disconnect();
    }
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

  /**
   * Capture real-time normalized (0–1) frequency spectrum bars from the
   * master AnalyserNode for minimalist UI visualization.
   */
  sampleFrequencyBars(out: Float32Array): boolean {
    if (
      !this.enabled ||
      !this.analyser ||
      !this.analyserData ||
      !this.ctx ||
      this.ctx.state !== 'running'
    ) {
      out.fill(0);
      return false;
    }

    this.analyser.getByteFrequencyData(this.analyserData);
    const binCount = this.analyserData.length;
    const barCount = out.length;
    const usableBins = Math.min(binCount, Math.max(barCount, Math.floor(binCount * 0.78)));

    for (let i = 0; i < barCount; i++) {
      const start = Math.floor((i / barCount) * usableBins);
      const end = Math.max(start + 1, Math.floor(((i + 1) / barCount) * usableBins));
      let sum = 0;
      for (let b = start; b < end; b++) {
        sum += this.analyserData[b];
      }
      const avg = sum / ((end - start) * 255);
      // Slight high-band tilt so bird chirps, cicadas, and rain shimmer register beside bass wind.
      const tilt = 1 + (i / Math.max(1, barCount - 1)) * 0.45;
      out[i] = Math.min(1, Math.pow(avg * tilt, 0.75));
    }

    return true;
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

  private chirp(biome: LandmarkBiome, intensity = 1): void {
    if (!this.ctx || !this.masterGain || this.mixer.birds <= 0.001 || intensity <= 0.01) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    const isCoastal = biome === 'coastal';
    const f = isCoastal ? 1150 + Math.random() * 550 : 2200 + Math.random() * 1900;
    const dur = isCoastal ? 0.32 : 0.16;
    const peak = (isCoastal ? 0.045 : 0.055) * this.mixer.birds * intensity;
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
    this.connectPanned(g, this.eventPan((Math.random() - 0.5) * 0.45));
    osc.start(t);
    osc.stop(t + dur + 0.04);
    osc.onended = () => g.disconnect();
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
    this.connectPanned(g, this.eventPan((Math.random() - 0.5) * 0.35));
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  private shorebird(intensity = 1): void {
    if (!this.ctx || !this.masterGain || intensity <= 0.01) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = 1400 + Math.random() * 520;
      const dur = 0.12 + Math.random() * 0.1;
      const at = t + i * (0.18 + Math.random() * 0.12);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, at);
      osc.frequency.exponentialRampToValueAtTime(f * 0.62, at + dur);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.032 * this.mixer.birds * intensity, at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, at + dur);
      osc.connect(g);
      this.connectPanned(g, this.eventPan((Math.random() - 0.5) * 0.5));
      osc.start(at);
      osc.stop(at + dur + 0.05);
      osc.onended = () => g.disconnect();
    }
  }

  private cicada(intensity = 1): void {
    if (!this.ctx || !this.masterGain || !this.whiteBuf || intensity <= 0.01) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = 0.5 + Math.random() * 0.4;
    const src = ctx.createBufferSource();
    src.buffer = this.whiteBuf;
    const fl = ctx.createBiquadFilter();
    fl.type = 'bandpass';
    fl.frequency.value = 4200 + Math.random() * 900;
    fl.Q.value = 9;
    const g = ctx.createGain();
    const base = 0.018 * this.mixer.birds * intensity;
    g.gain.setValueAtTime(base, t);
    g.gain.linearRampToValueAtTime(base, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 38 + Math.random() * 10;
    lfoGain.gain.value = 0.011 * intensity;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    src.connect(fl);
    fl.connect(g);
    this.connectPanned(g, this.eventPan((Math.random() - 0.5) * 0.55));
    src.start(t);
    src.stop(t + dur + 0.05);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
    src.onended = () => {
      fl.disconnect();
      g.disconnect();
      lfoGain.disconnect();
    };
  }

  private frog(intensity = 1): void {
    if (!this.ctx || !this.masterGain || intensity <= 0.01) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const croaks = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < croaks; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const at = t + i * 0.16;
      osc.type = 'square';
      osc.frequency.setValueAtTime(210 + Math.random() * 60, at);
      osc.frequency.exponentialRampToValueAtTime(150, at + 0.08);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.018 * this.mixer.birds * intensity, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.12);
      osc.connect(g);
      this.connectPanned(g, this.eventPan((Math.random() - 0.5) * 0.7));
      osc.start(at);
      osc.stop(at + 0.16);
      osc.onended = () => g.disconnect();
    }
  }

  private cricket(intensity = 1): void {
    if (!this.ctx || !this.masterGain || this.mixer.birds <= 0.001 || intensity <= 0.01) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 2);
    const baseFreq = 4150 + Math.random() * 620;
    const pan = this.eventPan((Math.random() - 0.5) * 0.72);
    const peak = 0.02 * intensity * this.mixer.birds;
    for (let i = 0; i < pulses; i++) {
      const at = t + i * 0.058;
      const dur = 0.036;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, at);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.94, at + dur);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(peak, at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, at + dur);
      osc.connect(g);
      this.connectPanned(g, pan);
      osc.start(at);
      osc.stop(at + dur + 0.015);
      osc.onended = () => g.disconnect();
    }
  }

  private computeTimeTargets(timeOfDay: number | undefined, night: number): void {
    if (timeOfDay !== undefined && Number.isFinite(timeOfDay)) {
      const hr = ((timeOfDay % 24) + 24) % 24;
      const dawnRaw = smoothBell(hr, 4.5, 6.2, 8.5);
      const duskRaw = smoothBell(hr, 16.5, 18.2, 20.5);
      const dayBand = smoothstep(5.2, 7.6, hr) * (1 - smoothstep(16.8, 19.2, hr));
      const dayRaw = dayBand * (1 - 0.35 * dawnRaw) * (1 - 0.35 * duskRaw);
      const nightRaw = clamp01(1 - (dawnRaw + duskRaw + dayRaw));
      const invSum = 1 / Math.max(0.0001, dawnRaw + dayRaw + duskRaw + nightRaw);
      this.tgtDawn = dawnRaw * invSum;
      this.tgtDay = dayRaw * invSum;
      this.tgtDusk = duskRaw * invSum;
      this.tgtNight = nightRaw * invSum;
    } else {
      const n = clamp01(night);
      this.tgtNight = n;
      this.tgtDay = 1 - n;
      this.tgtDawn = 0;
      this.tgtDusk = 0;
    }
  }

  update(
    dt: number,
    elapsed: number,
    kind: AmbientKind,
    biome: LandmarkBiome,
    wind: number,
    rain: number,
    night: number,
    lightning: number,
    fog = 0,
    timeOfDay?: number
  ): void {
    if (
      !this.ctx ||
      !this.windBand ||
      !this.gustBand ||
      !this.waterBand ||
      !this.hissBand ||
      !this.rainBodyBand ||
      !this.stormRumbleBand ||
      !this.trafficBand
    ) {
      return;
    }
    const t = this.ctx.currentTime;

    this.computeTimeTargets(timeOfDay, night);
    const tgtSurf = biome === 'coastal' || kind === 's' ? 0.075 : biome === 'wetland' ? 0.04 : 0;
    const tgtCascade = biome === 'waterfall' || kind === 'f' ? 0.075 : 0;
    const tgtMountain = biome === 'mountain' || biome === 'desert' ? 1.25 : 1.0;
    const tgtUrban =
      biome === 'urban'
        ? 1
        : biome === 'coastal'
          ? 0.55
          : biome === 'waterfall' || biome === 'mountain'
            ? 0.32
            : 0.24;
    const tgtBirdSite =
      biome === 'savannah' || biome === 'wetland'
        ? 1.4
        : biome === 'coastal'
          ? 0.85
          : kind === 'b'
            ? 1.25
            : 0.45;
    const tgtCricketBiome = biome === 'desert' ? 0.45 : biome === 'urban' ? 0.55 : 1.0;

    if (!this.hasProfileState) {
      this.hasProfileState = true;
      this.curWind = wind;
      this.curRain = clamp01(rain);
      this.curFog = clamp01(fog);
      this.curStorm = clamp01(lightning);
      this.curDawn = this.tgtDawn;
      this.curDay = this.tgtDay;
      this.curDusk = this.tgtDusk;
      this.curNight = this.tgtNight;
      this.curSurf = tgtSurf;
      this.curCascade = tgtCascade;
      this.curMountain = tgtMountain;
      this.curUrban = tgtUrban;
      this.curBirdSite = tgtBirdSite;
      this.curCricketBiome = tgtCricketBiome;
    } else {
      const seasonLerp = 1 - Math.exp(-dt * 2.2);
      this.curSummer += (this.tgtSummer - this.curSummer) * seasonLerp;
      this.curAutumn += (this.tgtAutumn - this.curAutumn) * seasonLerp;
      this.curWinter += (this.tgtWinter - this.curWinter) * seasonLerp;
      this.curSpring += (this.tgtSpring - this.curSpring) * seasonLerp;

      const weatherLerp = 1 - Math.exp(-dt * 1.6);
      this.curWind += (wind - this.curWind) * weatherLerp;
      this.curRain += (clamp01(rain) - this.curRain) * weatherLerp;
      this.curFog += (clamp01(fog) - this.curFog) * weatherLerp;
      this.curStorm += (clamp01(lightning) - this.curStorm) * weatherLerp;

      const timeLerp = 1 - Math.exp(-dt * 1.8);
      this.curDawn += (this.tgtDawn - this.curDawn) * timeLerp;
      this.curDay += (this.tgtDay - this.curDay) * timeLerp;
      this.curDusk += (this.tgtDusk - this.curDusk) * timeLerp;
      this.curNight += (this.tgtNight - this.curNight) * timeLerp;

      const siteLerp = 1 - Math.exp(-dt * 2.2);
      this.curSurf += (tgtSurf - this.curSurf) * siteLerp;
      this.curCascade += (tgtCascade - this.curCascade) * siteLerp;
      this.curMountain += (tgtMountain - this.curMountain) * siteLerp;
      this.curUrban += (tgtUrban - this.curUrban) * siteLerp;
      this.curBirdSite += (tgtBirdSite - this.curBirdSite) * siteLerp;
      this.curCricketBiome += (tgtCricketBiome - this.curCricketBiome) * siteLerp;
    }

    const rainMix = equalPower(this.curRain);
    const stormMix = equalPower(this.curStorm);
    const fogMix = this.curFog;

    this.winterGustPhase += dt * (0.42 + this.curWind * 0.22 + this.curWinter * 0.32);
    const gustSwell =
      0.5 + 0.5 * Math.sin(this.winterGustPhase) * Math.cos(this.winterGustPhase * 0.43 + 0.8);

    const windSeasonScale =
      1 + this.curWinter * (0.48 + 0.36 * gustSwell) + this.curAutumn * 0.16 - this.curSummer * 0.1;
    const windTimeScale = 1 - this.curDawn * 0.16 - this.curNight * 0.18 + stormMix * 0.42;
    const windGain =
      (0.012 + (0.055 * this.curWind) / 3.5) *
      this.curMountain *
      windSeasonScale *
      windTimeScale *
      this.mixer.wind;
    this.windBand.g.gain.setTargetAtTime(windGain, t, 0.45);
    this.windBand.fl.frequency.setTargetAtTime(
      Math.max(
        180,
        (biome === 'mountain' ? 380 : 300) +
          260 * Math.sin(elapsed * 0.35) +
          this.curWind * 120 +
          this.curWinter * (120 + gustSwell * 200) +
          this.curAutumn * 60 -
          this.curNight * 65 -
          fogMix * 85
      ),
      t,
      0.5
    );
    this.windBand.fl.Q.setTargetAtTime(
      0.58 + this.curWinter * (0.6 + gustSwell * 0.6) + this.curAutumn * 0.18,
      t,
      0.45
    );

    const gustLevel =
      (this.curWinter * (0.009 + 0.021 * gustSwell) * (0.55 + this.curWind * 0.35) +
        this.curAutumn * 0.007 * (0.5 + 0.5 * gustSwell) * (0.4 + this.curWind * 0.3) +
        stormMix * 0.014 * (0.45 + 0.55 * gustSwell)) *
      this.curMountain *
      (1 - fogMix * 0.35) *
      this.mixer.wind;
    const gustFreq =
      (980 + gustSwell * 480) * (1 - this.curAutumn * 0.25) +
      this.curAutumn * (1250 + Math.sin(elapsed * 0.9) * 260) -
      fogMix * 260;
    this.gustBand.g.gain.setTargetAtTime(gustLevel, t, 0.45);
    this.gustBand.fl.frequency.setTargetAtTime(Math.max(420, gustFreq), t, 0.5);
    this.gustBand.fl.Q.setTargetAtTime(0.9 + this.curWinter * 1.6, t, 0.45);

    const surfSwell = this.curSurf * (1 + 0.65 * Math.sin(elapsed * 0.72));
    this.waterBand.g.gain.setTargetAtTime(surfSwell + this.curCascade, t, 0.45);
    const waterBlend =
      this.curSurf + this.curCascade > 0.001
        ? this.curCascade / (this.curSurf + this.curCascade)
        : 0;
    const surfFreq = 400 + 320 * Math.sin(elapsed * 0.72);
    this.waterBand.fl.frequency.setTargetAtTime(surfFreq + (780 - surfFreq) * waterBlend, t, 0.45);

    const sprayRatio =
      this.curCascade * 0.73 + this.curSurf * 0.33 * Math.max(0, Math.sin(elapsed * 0.72));
    const fogMistSheen = fogMix * 0.008 * (1 - rainMix * 0.5);
    const hissLevel =
      sprayRatio * (0.35 + 0.65 * this.mixer.wind) +
      rainMix * (0.056 + stormMix * 0.022) +
      fogMistSheen;
    this.hissBand.g.gain.setTargetAtTime(hissLevel, t, 0.45);
    this.hissBand.fl.frequency.setTargetAtTime(
      Math.max(1150, 3050 - fogMix * 1150 - this.curNight * 280 + stormMix * 320),
      t,
      0.55
    );

    this.rainBodyBand.g.gain.setTargetAtTime(
      rainMix * (0.042 + stormMix * 0.028) * (0.4 + 0.6 * this.mixer.wind),
      t,
      0.5
    );
    this.rainBodyBand.fl.frequency.setTargetAtTime(680 + stormMix * 180 - fogMix * 140, t, 0.5);

    this.stormRumbleBand.g.gain.setTargetAtTime(
      stormMix * (0.065 + 0.025 * Math.sin(elapsed * 0.48)),
      t,
      0.55
    );
    this.stormRumbleBand.fl.frequency.setTargetAtTime(
      105 + stormMix * 45 + 18 * Math.sin(elapsed * 0.31),
      t,
      0.55
    );

    const swell = 0.65 + 0.35 * Math.sin(elapsed * 0.37) * Math.cos(elapsed * 0.19);
    const trafficTimeFactor =
      0.38 + 0.62 * (this.curDay + this.curDawn * 0.65 + this.curDusk * 0.85);
    const trafficGain =
      this.mixer.traffic * this.curUrban * swell * trafficTimeFactor * (1 - fogMix * 0.25) * 0.095;
    this.trafficBand.g.gain.setTargetAtTime(trafficGain, t, 0.45);
    this.trafficBand.fl.frequency.setTargetAtTime(
      145 + 35 * Math.sin(elapsed * 0.27) + this.curUrban * 25 - fogMix * 35 - this.curNight * 18,
      t,
      0.5
    );

    const rainAtten = 1 - rainMix * 0.82;
    const fogAtten = 1 - fogMix * 0.32;
    const timeBirdFactor =
      this.curDawn * 1.35 + this.curDay * 1.0 + this.curDusk * 0.45 + this.curNight * 0.12;
    const seasonBirdFactor =
      0.55 + this.curSpring * 0.65 + this.curSummer * 0.35 + this.curAutumn * 0.25;
    if (this.enabled && this.mixer.birds > 0.01) {
      const hasSpatialBirds = this.spatialSources.some((source) => source.kind === 'birds');
      const spatialBed = hasSpatialBirds ? 0.45 : 1;
      const prob =
        dt *
        timeBirdFactor *
        rainAtten *
        fogAtten *
        this.curBirdSite *
        seasonBirdFactor *
        spatialBed *
        this.mixer.birds;
      if (Math.random() < prob) {
        this.chirp(biome, Math.min(1.15, 0.35 + timeBirdFactor * 0.65) * fogAtten);
      }
    }

    const summerWarmth = Math.max(0, (this.curSummer - 0.18) / 0.82);
    if (this.enabled && this.mixer.birds > 0.01 && summerWarmth > 0.05) {
      this.cricketTimer -= dt;
      const cricketTimeCurve = 0.18 * this.curDay + 0.72 * this.curDusk + this.curNight;
      if (this.cricketTimer <= 0) {
        const cricketProb = summerWarmth * this.curCricketBiome * cricketTimeCurve * rainAtten;
        if (Math.random() < cricketProb) {
          this.cricket((0.5 + 0.5 * summerWarmth) * (0.45 + 0.55 * cricketTimeCurve));
        }
        this.cricketTimer =
          (0.55 + Math.random() * 1.15) /
          Math.max(0.35, (0.5 + summerWarmth * 0.8) * this.mixer.birds);
      }
      const dayCicadaCurve = clamp01(this.curDay + this.curDawn * 0.3 + this.curDusk * 0.25);
      if (this.curSummer > 0.55 && dayCicadaCurve > 0.08 && biome !== 'urban') {
        const summerCicadaProb =
          dt * (this.curSummer - 0.55) * 0.32 * dayCicadaCurve * rainAtten * this.mixer.birds;
        if (Math.random() < summerCicadaProb) {
          this.cicada(0.45 + 0.55 * dayCicadaCurve);
        }
      }
    }

    if (this.enabled && this.mixer.traffic > 0.04) {
      this.trafficPassTimer -= dt;
      if (this.trafficPassTimer <= 0) {
        this.trafficPassby(this.mixer.traffic * this.curUrban * trafficTimeFactor);
        this.trafficPassTimer = (3.2 + Math.random() * 4.5) / Math.max(0.3, this.curUrban);
      }
    }

    const site = this.site;
    if (this.enabled && site && site.events.length > 0 && this.mixer.birds > 0.02) {
      const density = dt * site.density * rainAtten * fogAtten;
      const dayCicadaCurve = clamp01(this.curDay + this.curDawn * 0.3 + this.curDusk * 0.25);
      const nocturnalCurve = clamp01(this.curDusk * 0.55 + this.curNight);
      for (let i = 0; i < site.events.length; i++) {
        const event = site.events[i];
        if (event === 'shorebird') {
          if (
            Math.random() <
            density * 0.16 * timeBirdFactor * seasonBirdFactor * this.mixer.birds
          ) {
            this.shorebird(0.4 + 0.6 * Math.min(1, timeBirdFactor));
          }
        } else if (event === 'cicada') {
          const cicadaSeason = 0.25 + this.curSummer * 1.25;
          if (
            dayCicadaCurve > 0.08 &&
            Math.random() < density * 0.1 * dayCicadaCurve * cicadaSeason * this.mixer.birds
          ) {
            this.cicada(0.4 + 0.6 * dayCicadaCurve);
          }
        } else if (
          nocturnalCurve > 0.08 &&
          Math.random() < density * 0.12 * nocturnalCurve * this.mixer.birds
        ) {
          this.frog(0.4 + 0.6 * nocturnalCurve);
        }
      }
    }

    this.updateSpatial(dt, elapsed, biome);
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
