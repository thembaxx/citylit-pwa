/**
 * First-load frame-time benchmark used by the `auto` quality setting.
 *
 * Kept free of three.js and DOM dependencies so the decision logic can be
 * unit-tested with `node --test`. The engine feeds it real frame intervals and
 * render-call timings; the result replaces the old device heuristic that
 * assumed "not software GL means high quality".
 */

export type BenchmarkTier = 0 | 1 | 2;

export interface BenchmarkConfig {
  /** Frames discarded while shaders/HDR textures are still compiling. */
  warmupFrames: number;
  /** Frames used for the decision. ~1s at 60fps. */
  sampleFrames: number;
  /** Frame times above this are clamped rather than discarded (slow devices still resolve). */
  maxFrameMs: number;
  /** Gaps above this are a tab switch / pause, not a render frame. */
  stallMs: number;
  /** 60fps budget. Deliberately fixed, not derived from display refresh. */
  targetMs: number;
  /** A high tier must also keep its tail under this bound. */
  tailCeilingMs: number;
  /** Mid-tier upper bound; above this we fall back to low. */
  midCeilingMs: number;
}

export const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  warmupFrames: 20,
  sampleFrames: 60,
  maxFrameMs: 100,
  stallMs: 1000,
  targetMs: 16.7,
  tailCeilingMs: 24,
  midCeilingMs: 22,
};

export interface FrameStats {
  count: number;
  medianMs: number;
  p95Ms: number;
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index];
}

export function computeFrameStats(samples: readonly number[]): FrameStats {
  if (samples.length === 0) return { count: 0, medianMs: 0, p95Ms: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    count: sorted.length,
    medianMs: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
  };
}

/** Pick a tier from measured frame times. `softwareRenderer` remains a hard floor. */
export function pickQualityTier(
  stats: FrameStats,
  softwareRenderer: boolean,
  config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG
): BenchmarkTier {
  if (softwareRenderer || stats.count === 0) return 2;
  if (stats.medianMs <= config.targetMs && stats.p95Ms <= config.tailCeilingMs) return 0;
  if (stats.medianMs <= config.midCeilingMs) return 1;
  return 2;
}

/** Accumulates warm-up + sample frames. One instance per first-load session. */
export class FrameTimeBenchmark {
  readonly stats: () => FrameStats;
  private readonly config: BenchmarkConfig;
  private warmupRemaining: number;
  private readonly samples: number[] = [];

  constructor(config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG) {
    this.config = config;
    this.warmupRemaining = config.warmupFrames;
    this.stats = () => computeFrameStats(this.samples);
  }

  get done(): boolean {
    return this.samples.length >= this.config.sampleFrames;
  }

  get progress(): number {
    return Math.min(1, this.samples.length / this.config.sampleFrames);
  }

  /**
   * @param frameMs rAF interval. Captures vsync-bound GPU work.
   * @param renderMs CPU time spent in the render call. Captures CPU-bound work
   * that a capped rAF interval would otherwise hide.
   * @param gpuMs GPU timestamp query result when the backend supports it.
   */
  addFrame(frameMs: number, renderMs = 0, gpuMs: number | null = null): void {
    if (this.done) return;
    if (this.warmupRemaining > 0) {
      this.warmupRemaining--;
      return;
    }
    if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > this.config.stallMs) return;
    const render = Number.isFinite(renderMs) && renderMs > 0 ? renderMs : 0;
    const gpu = gpuMs !== null && Number.isFinite(gpuMs) && gpuMs > 0 ? gpuMs : 0;
    // Clamp rather than discard: a genuinely slow GPU must still resolve to the
    // low tier, while a 300ms frame should not push the median past the ceiling.
    this.samples.push(Math.min(this.config.maxFrameMs, Math.max(frameMs, render, gpu)));
  }
}

const CACHE_KEY = 'cl-quality-benchmark-v1';
const CACHE_VERSION = 1;
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedBenchmark {
  version: typeof CACHE_VERSION;
  backend: string;
  dpr: number;
  tier: BenchmarkTier;
  medianMs: number;
  p95Ms: number;
  measuredAt: number;
}

/** Reuse a recent measurement when the renderer and pixel density are unchanged. */
export function readCachedBenchmark(
  backend: string,
  dpr: number,
  maxAgeMs = DEFAULT_MAX_AGE_MS
): CachedBenchmark | null {
  try {
    const raw = globalThis.localStorage?.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedBenchmark>;
    if (
      parsed.version !== CACHE_VERSION ||
      parsed.backend !== backend ||
      parsed.dpr !== dpr ||
      typeof parsed.tier !== 'number' ||
      !Number.isFinite(parsed.medianMs) ||
      typeof parsed.measuredAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.measuredAt > maxAgeMs) return null;
    return parsed as CachedBenchmark;
  } catch {
    return null;
  }
}

export function writeCachedBenchmark(entry: Omit<CachedBenchmark, 'version' | 'measuredAt'>): void {
  try {
    const value: CachedBenchmark = { ...entry, version: CACHE_VERSION, measuredAt: Date.now() };
    globalThis.localStorage?.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Private mode / storage disabled: benchmarking still works, just not cached.
  }
}
