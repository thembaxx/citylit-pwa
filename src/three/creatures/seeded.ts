/**
 * Deterministic, allocation-free-per-call randomness for the creature layer.
 *
 * Everything in `src/three/creatures` draws from here so a landmark's wildlife
 * is reproducible across reloads, captures and tests. Pure module: no three.js,
 * no DOM, so `node --test` can import it directly.
 */

export interface SeededRng {
  /** Uniform [0, 1). */
  next(): number;
  /** Uniform [min, max). */
  range(min: number, max: number): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** True with the supplied probability. */
  chance(probability: number): boolean;
  /** Signed jitter in [-amount, amount]. */
  jitter(amount: number): number;
  /** A child stream, stable for the same salt. */
  fork(salt: string | number): SeededRng;
  /** The 32-bit seed this stream started from. */
  readonly seed: number;
}

/** FNV-1a over a string, stable across engines (uses Math.imul). */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32: small, fast, good enough for placement and pose jitter. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string | number): SeededRng {
  const numeric = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
  const random = mulberry32(numeric);
  const rng: SeededRng = {
    seed: numeric,
    next: random,
    range(min, max) {
      if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
      return min + (max - min) * random();
    },
    int(min, max) {
      const lo = Math.ceil(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) return 0;
      return lo + Math.floor(random() * (hi - lo + 1));
    },
    chance(probability) {
      return random() < probability;
    },
    jitter(amount) {
      return (random() * 2 - 1) * amount;
    },
    fork(salt) {
      return createRng((numeric ^ hashString(String(salt))) >>> 0);
    },
  };
  return rng;
}

export interface ScatterSpot {
  x: number;
  z: number;
  /** Angle around the diorama centre, radians, from +Z toward +X. */
  angle: number;
  /** Distance from the centre. */
  radius: number;
}

export interface ScatterOptions {
  count: number;
  innerRadius: number;
  outerRadius: number;
  /** Direction of the landmark's key sightline; spots within `keepOutHalf`
   * radians of it are rejected so creatures never sit in front of the hero. */
  keepOutAngle?: number;
  keepOutHalf?: number;
  /** Minimum distance between two spots in the same batch. */
  minSeparation?: number;
  /** Rejection attempts before a spot is accepted regardless. */
  maxAttempts?: number;
}

/** Angle distance on the circle, 0..PI. */
export function angularDistance(a: number, b: number): number {
  const tau = Math.PI * 2;
  const d = Math.abs(((a - b) % tau + tau) % tau);
  return d > Math.PI ? tau - d : d;
}

/**
 * Deterministic ring scatter with an optional forward keep-out wedge.
 * Never returns more than `count` spots; returns fewer only when count <= 0.
 */
export function scatterRing(rng: SeededRng, options: ScatterOptions): ScatterSpot[] {
  const count = Math.floor(options.count);
  if (!Number.isFinite(count) || count <= 0) return [];
  const inner = Math.max(0.01, options.innerRadius);
  const outer = Math.max(inner, options.outerRadius);
  const keepOutAngle = options.keepOutAngle;
  const keepOutHalf = Math.max(0, options.keepOutHalf ?? 0);
  const separation = Math.max(0, options.minSeparation ?? 0);
  const maxAttempts = Math.max(8, options.maxAttempts ?? 40);
  const spots: ScatterSpot[] = [];

  for (let i = 0; i < count; i++) {
    let placed: ScatterSpot | null = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = rng.range(0, Math.PI * 2);
      // sqrt keeps the distribution even per unit area instead of clumping at
      // the inner edge.
      const radius = Math.sqrt(rng.next()) * (outer - inner) + inner;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      if (
        keepOutAngle !== undefined &&
        keepOutHalf > 0 &&
        angularDistance(angle, keepOutAngle) < keepOutHalf
      ) {
        continue;
      }
      let tooClose = false;
      if (separation > 0) {
        for (let s = 0; s < spots.length; s++) {
          const dx = spots[s].x - x;
          const dz = spots[s].z - z;
          if (dx * dx + dz * dz < separation * separation) {
            tooClose = true;
            break;
          }
        }
      }
      if (tooClose) continue;
      placed = { x, z, angle, radius };
      break;
    }
    if (!placed) {
      // Deterministic fallback: evenly spaced around the ring.
      const angle = (i / count) * Math.PI * 2 + rng.jitter(0.2);
      const radius = (inner + outer) * 0.5;
      placed = {
        x: Math.sin(angle) * radius,
        z: Math.cos(angle) * radius,
        angle,
        radius,
      };
    }
    spots.push(placed);
  }
  return spots;
}

/** Exponentially distributed gap with a mean, clamped to [min, max]. */
export function poissonInterval(rng: SeededRng, mean: number, min = 0, max = Infinity): number {
  const safeMean = Number.isFinite(mean) && mean > 0 ? mean : 0.001;
  const u = Math.max(1e-6, rng.next());
  const value = -Math.log(u) * safeMean;
  return Math.min(max, Math.max(min, value));
}

/** Ease-out-with-overshoot used for stagger-in; always >= 0. */
export function easeOutBack(t: number, overshoot = 1.4): number {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  const c = overshoot + 1;
  const p = clamped - 1;
  return 1 + c * p * p * p + overshoot * p * p;
}
