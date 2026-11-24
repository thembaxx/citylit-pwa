import type { LandmarkBiome } from '../types/citylit';
import { clamp, PLINTH_INNER_HALF_EXTENT } from './fitMath.ts';

export type PlinthSilhouette = 'square' | 'coastal-cut' | 'terrace' | 'hex-chamfer';

export type UndergroundStoryKind = 'burrows' | 'termites' | 'conduit' | 'roots';

export interface StrataPalette {
  /** Dark organic topsoil / humus rim directly beneath ground cover. */
  readonly humus: string;
  /** Upper subsoil / dune sand / leached loam horizon. */
  readonly subsoil: string;
  /** Mid mineral clay / ferric saprolite / gravel horizon. */
  readonly upperRock: string;
  /** Primary regional bedrock / corestone / conglomerate layer. */
  readonly coreRock: string;
  /** Deep basement rock horizon at the base of the cut slab. */
  readonly basement: string;
  /** Thin contrasting mineral seam 1 (e.g. calcrete, quartz, gold-reef). */
  readonly seamLight: string;
  /** Thin contrasting mineral seam 2 (e.g. ironstone, manganese, shale). */
  readonly seamDark: string;
  /** Ground-level dominant soil/turf base color tint. */
  readonly groundBase: string;
  /** Secondary ground patch color (sand, gravel, red earth). */
  readonly groundAccent: string;
  /** Pedestal bevel collar / museum base color. */
  readonly skirtColor: string;
  /** Engraved nameplate frame metal color. */
  readonly plateFrameColor: string;
  /** Engraved nameplate recessed plate background. */
  readonly plateBgColor: string;
  /** Engraved nameplate text ink. */
  readonly plateTextColor: string;
}

export interface WaterCutawaySpec {
  readonly waterLevel: number;
  readonly shallowColor: string;
  readonly deepColor: string;
  readonly clarity: number;
  readonly foamStrength: number;
  readonly turbulence: number;
  readonly caustic: number;
  readonly glint: number;
  readonly tracksTide: boolean;
}

export interface PlinthSiteSpec {
  readonly key: string;
  readonly silhouette: PlinthSilhouette;
  readonly halfExtent: number;
  readonly baseY: number;
  readonly skirtBottomY: number;
  readonly strata: StrataPalette;
  readonly story: UndergroundStoryKind;
  readonly water?: WaterCutawaySpec;
  readonly seasonalGroundStrength: number;
}

/** Deterministic 2D value noise (zero external deps, identical across Node & browser). */
export function hash2(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

export function noise2(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

export function fbm2(x: number, z: number, octaves = 3): number {
  let sum = 0;
  let amp = 0.5;
  let px = x;
  let pz = z;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(px, pz);
    px = px * 2.04 + 13.7;
    pz = pz * 2.04 - 7.3;
    amp *= 0.5;
  }
  return sum;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  if (Math.abs(span) < 1e-6) return x >= edge1 ? 1 : 0;
  const t = clamp((x - edge0) / span, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Formats decimal latitude/longitude into crisp cartographic DMS coordinates
 * for diorama nameplates (e.g. `34°12′S · 18°27′E`).
 */
export function formatDmsCoords(lat: number, lon: number): string {
  const fmt = (val: number, posHem: string, negHem: string): string => {
    const abs = Math.abs(val);
    let deg = Math.floor(abs);
    let min = Math.round((abs - deg) * 60);
    if (min === 60) {
      deg += 1;
      min = 0;
    }
    const mm = String(min).padStart(2, '0');
    return `${deg}°${mm}′${val >= 0 ? posHem : negHem}`;
  };
  return `${fmt(lat, 'N', 'S')} · ${fmt(lon, 'E', 'W')}`;
}

/**
 * Maps normalized square domain `(u, v) in [-1, 1]^2` onto the landmark's
 * plinth footprint `(x, z)` cleanly inside `PLINTH_INNER_HALF_EXTENT`.
 * Because the map is continuous and exact along `(u = ±1)` and `(v = ±1)`,
 * terrain top, geological strata walls, glass water cutaway walls, and the
 * pedestal rim all share the exact perimeter with zero seams.
 */
export function mapDomainToPlinth(
  u: number,
  v: number,
  silhouette: PlinthSilhouette,
  half: number
): [number, number] {
  const safeHalf = Math.min(half, PLINTH_INNER_HALF_EXTENT - 0.32);
  if (silhouette === 'square') {
    return [u * safeHalf, v * safeHalf];
  }

  const au = Math.abs(u);
  const av = Math.abs(v);
  const cheb = Math.max(au, av);

  if (silhouette === 'hex-chamfer') {
    // Bold chamfered octagonal footprint retaining flat front/back faces for nameplate
    const cornerCut = Math.max(0, au + av - 1.56);
    const shrink = 1 - cornerCut * 0.24;
    return [u * safeHalf * shrink, v * safeHalf * shrink];
  }

  if (silhouette === 'terrace') {
    // Gently bevelled architectural square with subtle organic earth trim
    const cornerCut = Math.max(0, au + av - 1.72);
    const shrink = 1 - cornerCut * 0.16;
    const micro =
      cheb > 0.88
        ? Math.sin(u * 5.2 + v * 3.7) * 0.055 * smoothstep(0.88, 1.0, cheb)
        : 0;
    return [u * safeHalf * shrink + micro * Math.sign(u || 1), v * safeHalf * shrink];
  }

  // 'coastal-cut': gently rounded headland corners on the granite west/north
  // flanks and a crisp False Bay bay-slice chamfer along the ocean edge.
  const cornerCut = Math.max(0, au + av - 1.66);
  let shrink = 1 - cornerCut * 0.19;
  if (u > 0.2 && v > 0.15) {
    // Subtle seaward curve on the False Bay aquarium edge
    const bayT = smoothstep(0.2, 1.0, Math.max(u, v));
    shrink -= 0.032 * bayT * Math.sin(clamp((u + v) * 0.9, 0, Math.PI));
  }
  return [u * safeHalf * shrink, v * safeHalf * shrink];
}

/**
 * Generates an ordered closed polygon along the outer boundary of a plinth
 * silhouette (for building matching engine pedestal rings & bevel collars).
 */
export function getPlinthOutlinePoints(
  silhouette: PlinthSilhouette,
  half: number,
  segmentsPerEdge = 14
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const step = Math.max(2, segmentsPerEdge);
  // Bottom edge (v = +1, u: -1 -> +1)
  for (let i = 0; i < step; i++) {
    pts.push(mapDomainToPlinth(-1 + (2 * i) / step, 1, silhouette, half));
  }
  // Right edge (u = +1, v: +1 -> -1)
  for (let i = 0; i < step; i++) {
    pts.push(mapDomainToPlinth(1, 1 - (2 * i) / step, silhouette, half));
  }
  // Top edge (v = -1, u: +1 -> -1)
  for (let i = 0; i < step; i++) {
    pts.push(mapDomainToPlinth(1 - (2 * i) / step, -1, silhouette, half));
  }
  // Left edge (u = -1, v: -1 -> +1)
  for (let i = 0; i < step; i++) {
    pts.push(mapDomainToPlinth(-1, -1 + (2 * i) / step, silhouette, half));
  }
  return pts;
}

/**
 * Boulders Beach terrain relief:
 * - Sheltered sandy horseshoe cove (`y ~ 0.17..0.28`) around the Foxy Beach boardwalk
 * - Higher coastal granite/fynbos bluff behind (`z < -3.2` up to `0.54`)
 * - Three subtle granite rock-shelf anchors beneath boulder clusters
 * - Sloping False Bay seabed (`y` down to `-0.86`) on the front/right bay side
 */
export function bouldersGroundHeight(x: number, z: number): number {
  const nBroad = (fbm2(x * 0.24 + 3.1, z * 0.24 - 1.7, 3) - 0.5) * 0.18;
  const nFine = (noise2(x * 1.15 - 2.4, z * 1.15 + 5.2) - 0.5) * 0.045;

  // Crescent cove bay carving in from front-right (+X, +Z) and right flank (+X)
  // Keep boulder cluster centers [-2.85,-1.85], [2.8,-1.65], [-1.15,2.55] high enough
  // for rocky outcrops while letting clear False Bay shallows lap around them.
  const bayDiag = (x * 0.72 + z * 0.68 - 1.35) / 5.4;
  const rightCove = (x - 1.85) / 5.2;
  const bayCurve = Math.max(bayDiag, rightCove * 0.85) + (fbm2(x * 0.35 + 7.2, z * 0.35 + 1.4, 2) - 0.5) * 0.28;
  const bayDip = smoothstep(0.02, 0.95, bayCurve) * 1.06;

  // Back-left granite headland & coastal fynbos bluff
  const backBluff = smoothstep(-2.4, -7.2, z) * 0.36 + smoothstep(-3.0, -7.4, x) * smoothstep(2.0, -5.0, z) * 0.24;

  // Sheltered pocket shelves supporting the 3 Cape granite boulder headlands
  const shelfA = Math.exp(-((x + 2.85) ** 2 + (z + 1.85) ** 2) / 3.4) * 0.17;
  const shelfB = Math.exp(-((x - 2.8) ** 2 + (z + 1.65) ** 2) / 3.2) * 0.22;
  const shelfC = Math.exp(-((x + 1.15) ** 2 + (z - 2.55) ** 2) / 2.8) * 0.26;

  // Foxy Beach timber boardwalk sand pad (`x ≈ 1.2, z ∈ [-3.6, 1.4]`)
  const boardDist = Math.hypot((x - 1.2) * 1.1, clamp(z, -3.6, 1.4) - z);
  const boardPad = Math.exp(-(boardDist * boardDist) / 1.4);

  // Subtle submerged sandy ripple channel in the cove bay
  const raw = 0.23 + nBroad + nFine + backBluff + shelfA + shelfB + shelfC - bayDip;
  const levelled = raw * (1 - boardPad * 0.55) + 0.21 * (boardPad * 0.55);
  return clamp(levelled, -0.92, 0.78);
}

/**
 * Kruger National Park terrain relief:
 * - Sun-baked Lowveld red-earth/ochre savanna undulation (`0.18..0.48`)
 * - Recessed irregular muddy-edged waterhole pan centered near `(3.35, 2.65)`
 * - Subtle sunken game trails leading from north-west and south-west to the waterhole
 * - Slightly flatter pad for ranger camp kraal fence (`-5.1, 4.1`) & termite mound (`4.65, -1.85`)
 */
export function krugerGroundHeight(x: number, z: number): number {
  const nBroad = (fbm2(x * 0.22 + 9.4, z * 0.22 + 2.1, 3) - 0.5) * 0.24;
  const nFine = (noise2(x * 1.05 + 4.3, z * 1.05 - 6.1) - 0.5) * 0.04;

  // Gentle northern acacia ridge
  const ridge = smoothstep(-1.5, -7.2, z) * 0.24;

  // Irregular Lowveld waterhole depression centered at (3.35, 2.65)
  const wx = x - 3.35;
  const wz = z - 2.65;
  const ang = Math.atan2(wz, wx);
  const pondR = 2.02 + Math.sin(ang * 3 + 0.7) * 0.22 + Math.cos(ang * 5 - 1.1) * 0.14;
  const dPond = Math.hypot(wx, wz) / pondR;
  const pondBasin = (1 - smoothstep(0.62, 1.24, dPond)) * 0.23;

  // Two subtle worn elephant game trails converging toward waterhole
  const trailA = Math.exp(-Math.pow((z - (0.45 * x + 1.14)), 2) / 0.36) * smoothstep(-6.0, 2.5, x) * smoothstep(4.2, 2.2, x);
  const trailB = Math.exp(-Math.pow((x - (0.35 * z + 2.42)), 2) / 0.34) * smoothstep(-5.5, 1.8, z) * smoothstep(3.5, 1.6, z);
  const trailDip = Math.max(trailA, trailB) * 0.055;

  // Ranger camp pad near (-5.0, 4.1)
  const campPad = Math.exp(-((x + 5.0) ** 2 + (z - 4.1) ** 2) / 2.2) * 0.65;
  // Elevated earth apron around termite mound at (4.65, -1.85)
  const moundApron = Math.exp(-((x - 4.65) ** 2 + (z + 1.85) ** 2) / 0.85) * 0.09;

  const base = 0.24 + nBroad + nFine + ridge + moundApron - pondBasin - trailDip;
  return clamp(base * (1 - campPad) + 0.2 * campPad, 0.01, 0.62);
}

/**
 * Orlando Towers terrain relief:
 * - Level graded earth (`y = 0.20`) across cooling tower basins (`±2.4, 0`),
 *   circular Soweto ring road (`r ∈ [4.4, 5.4]`), and soccer pitch (`|x|<=2.2, z∈[2.0, 4.9]`)
 * - Gentle Soweto Highveld berm rise around outer neighborhood fringe & back pylons
 */
export function orlandoGroundHeight(x: number, z: number): number {
  const nBroad = (fbm2(x * 0.25 - 4.1, z * 0.25 + 6.8, 3) - 0.5) * 0.18;
  const nFine = (noise2(x * 1.1 + 1.9, z * 1.1 - 3.4) - 0.5) * 0.03;

  const rad = Math.hypot(x, z);
  const outerRise = smoothstep(5.4, 7.6, rad) * 0.22 + smoothstep(-3.8, -7.2, z) * 0.14;

  // Keep cooling basins, ring road, and soccer pitch crisply graded at y = 0.20
  const dTowerW = Math.hypot(x + 2.4, z);
  const dTowerE = Math.hypot(x - 2.4, z);
  const nearTower = Math.max(1 - smoothstep(2.4, 3.1, dTowerW), 1 - smoothstep(2.4, 3.1, dTowerE));
  const nearRoad = 1 - smoothstep(0.0, 0.85, Math.abs(rad - 4.9));
  const inPitch =
    (1 - smoothstep(1.85, 2.55, Math.abs(x))) *
    (1 - smoothstep(1.15, 1.75, Math.abs(z - 3.5)));
  const flatMask = clamp(Math.max(nearTower, nearRoad, inPitch), 0, 1);

  const raw = 0.22 + outerRise + nBroad + nFine;
  return clamp(raw * (1 - flatMask) + 0.2 * flatMask, 0.16, 0.62);
}

export const PILOT_PLINTH_SPECS: Record<string, PlinthSiteSpec> = {
  'Boulders Beach': {
    key: 'Boulders Beach',
    silhouette: 'coastal-cut',
    halfExtent: 7.72,
    baseY: -1.25,
    skirtBottomY: -1.44,
    story: 'burrows',
    seasonalGroundStrength: 0.35,
    water: {
      waterLevel: 0.14,
      shallowColor: '#48a0ab',
      deepColor: '#215c6d',
      clarity: 0.84,
      foamStrength: 1.05,
      turbulence: 0.92,
      caustic: 1.08,
      glint: 1.0,
      tracksTide: true,
    },
    strata: {
      humus: '#3d3325',
      subsoil: '#d6c69e',
      upperRock: '#b69b74',
      coreRock: '#888278',
      basement: '#3e454d',
      seamLight: '#ccbda2',
      seamDark: '#5a574f',
      groundBase: '#d8c8a0',
      groundAccent: '#7f8665',
      skirtColor: '#2f353b',
      plateFrameColor: '#a6864c',
      plateBgColor: '#262b30',
      plateTextColor: '#e0d4b8',
    },
  },
  'Kruger National Park': {
    key: 'Kruger National Park',
    silhouette: 'terrace',
    halfExtent: 7.72,
    baseY: -1.25,
    skirtBottomY: -1.44,
    story: 'termites',
    seasonalGroundStrength: 0.78,
    strata: {
      humus: '#3b2d1f',
      subsoil: '#b09155',
      upperRock: '#96563b',
      coreRock: '#645c4c',
      basement: '#3b3c37',
      seamLight: '#d2c4a2',
      seamDark: '#593729',
      groundBase: '#b49858',
      groundAccent: '#966544',
      skirtColor: '#3a2d24',
      plateFrameColor: '#b38b4a',
      plateBgColor: '#2c221b',
      plateTextColor: '#e4d6b5',
    },
  },
  'Orlando Towers': {
    key: 'Orlando Towers',
    silhouette: 'hex-chamfer',
    halfExtent: 7.72,
    baseY: -1.25,
    skirtBottomY: -1.44,
    story: 'conduit',
    seasonalGroundStrength: 0.65,
    strata: {
      humus: '#3d3a2c',
      subsoil: '#8d7350',
      upperRock: '#96643f',
      coreRock: '#6b6457',
      basement: '#3c4147',
      seamLight: '#cbb376',
      seamDark: '#47433e',
      groundBase: '#7c8d55',
      groundAccent: '#8e7858',
      skirtColor: '#2f3338',
      plateFrameColor: '#b88c48',
      plateBgColor: '#23262b',
      plateTextColor: '#e2d7bc',
    },
  },
};

export function getPilotGroundHeightFn(
  key: string
): ((x: number, z: number) => number) | null {
  if (key === 'Boulders Beach') return bouldersGroundHeight;
  if (key === 'Kruger National Park') return krugerGroundHeight;
  if (key === 'Orlando Towers') return orlandoGroundHeight;
  return null;
}

export function getDefaultBiomeSkirtColor(biome: LandmarkBiome): string {
  switch (biome) {
    case 'coastal':
      return '#2f353b';
    case 'savannah':
    case 'desert':
      return '#3a2d24';
    default:
      return '#2f3338';
  }
}
