/**
 * Time-of-day window lighting.
 *
 * A facade is baked into a colour map plus a matching emissive map. A
 * deterministic hash picks which windows are switched on, and both the lit
 * occupancy and the hash salt change with the hour, so every building shows a
 * different, plausible scatter of lit rooms as the day advances. A whole facade
 * is one canvas pair and one draw call, and re-baking redraws the existing
 * canvases in place, so no material or texture is ever allocated per hour.
 *
 * Three details keep the schedule from reading as a single global light switch:
 *  - occupancy follows the clock *and* the weather (overcast days light rooms);
 *  - lit cells are grouped into 1-3 pane rooms that persist for a couple of
 *    hours, with ground/top floors biased brighter;
 *  - each facade re-bakes on its own phase offset, a few per frame, and eases
 *    its emissive back up through a shared ramp uniform.
 */
import * as THREE from 'three';
import { prepareCanvasTexture } from './shaders';

const CELL_W = 20;
const CELL_H = 24;
/** Minimum wall-clock gap between facade re-bakes while hours are scrubbed. */
const REBAKE_INTERVAL_MS = 320;
/** Facades re-baked per update pass, so a schedule change never lands in one frame. */
const REBAKES_PER_UPDATE = 2;
/** Occupancy added by full cloud cover, as a share of a facade's base chance. */
const OVERCAST_BUMP = 0.18;

/**
 * Multiplier on a facade's base lit chance across the day: a few rooms left on
 * overnight, almost none at midday, then a rush of them from dusk onward.
 */
const OCCUPANCY_KEYFRAMES: ReadonlyArray<readonly [number, number]> = [
  [0, 0.55],
  [3, 0.38],
  [5, 0.26],
  [6.5, 0.14],
  [8, 0.06],
  [12, 0.04],
  [15, 0.08],
  [17.5, 0.32],
  [19, 0.8],
  [20.5, 1],
  [22.5, 0.85],
  [24, 0.55],
];

/** Lit-occupancy multiplier for a decimal hour (0..24), smoothly interpolated. */
export function windowOccupancy(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 1; i < OCCUPANCY_KEYFRAMES.length; i++) {
    const [h1, v1] = OCCUPANCY_KEYFRAMES[i];
    if (h <= h1) {
      const [h0, v0] = OCCUPANCY_KEYFRAMES[i - 1];
      const t = h1 === h0 ? 0 : (h - h0) / (h1 - h0);
      return v0 + (v1 - v0) * t;
    }
  }
  return OCCUPANCY_KEYFRAMES[OCCUPANCY_KEYFRAMES.length - 1][1];
}

function hash01(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export interface WindowFacadeOptions {
  wall: THREE.ColorRepresentation;
  lit?: THREE.ColorRepresentation;
  dark?: THREE.ColorRepresentation;
  cols?: number;
  rows?: number;
  seed?: number;
  /** Base share of lit windows at the evening peak (0..1). */
  chance?: number;
}

export interface WindowFacade {
  readonly map: THREE.CanvasTexture;
  readonly emissiveMap: THREE.CanvasTexture;
  readonly cols: number;
  readonly rows: number;
  /** Shared emissive ramp: dips on each re-bake and eases back to 1. */
  readonly ramp: { value: number };
}

interface FacadeRecord extends WindowFacade {
  seed: number;
  chance: number;
  wallHex: string;
  darkHex: string;
  warm: THREE.Color;
  cool: THREE.Color;
  ctx: CanvasRenderingContext2D;
  ex: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Per-facade schedule phase in hours (0..0.9) so buildings do not sync. */
  offset: number;
  lastKey: string;
  /** Share of panes currently lit, feeding the sky's light-pollution term. */
  litRatio: number;
}

const facades = new Map<string, FacadeRecord>();
const tmpLit = new THREE.Color();
let currentHour = 21;
let currentCover = 0;
let lastBakeAt = -Infinity;
/** Smoothed share of panes lit across every registered facade. */
let litFraction = 0;

/**
 * Share of all baked panes that are lit right now (0..1). The horizon and sky
 * read this so the city's glow into the night actually tracks how many rooms
 * are occupied rather than sitting at a fixed brightness.
 */
export function windowLitFraction(): number {
  return litFraction;
}

function bake(record: FacadeRecord, hour: number, cover: number): void {
  const { ctx, ex, cols, rows, width, height } = record;
  ctx.globalAlpha = 1;
  ctx.fillStyle = `#${record.wallHex}`;
  ctx.fillRect(0, 0, width, height);
  ex.fillStyle = '#000000';
  ex.fillRect(0, 0, width, height);

  // Occupancy peaks in the evening, thins overnight and at midday, and lifts on
  // overcast days when offices actually do leave the lights on. It is evaluated
  // per floor below, because each floor runs slightly behind the one under it.
  // Rooms hold their state for about two hours; brightness re-rolls hourly.
  const roomSalt = Math.floor((((hour % 24) + 24) % 24) / 2) * 7919;
  const detailSalt = Math.floor((((hour % 24) + 24) % 24)) * 104729;
  // Late-night rooms skew cooler (television blue) than evening tungsten.
  const coolBias = hour >= 23 || hour < 5 ? 0.42 : 0.22;
  // Offices light from the ground up, so each floor runs a fraction of an hour
  // behind the one below it. Without this a tower flips every pane at once and
  // reads as a single switch rather than a building waking up.
  const floorLagHours = 0.75;
  let litCells = 0;
  const marginX = 3;
  const marginY = 3;
  const ww = CELL_W - marginX * 2;
  const wh = CELL_H - marginY * 2;

  const paintCell = (px: number, py: number, litHex: string | null): void => {
    ctx.fillStyle = '#181c22';
    ctx.fillRect(px - 1, py - 1, ww + 2, wh + 2);
    if (litHex) {
      ctx.fillStyle = litHex;
      ctx.fillRect(px, py, ww, wh);
      ex.fillStyle = litHex;
      ex.fillRect(px, py, ww, wh);
    } else {
      ctx.fillStyle = `#${record.darkHex}`;
      ctx.fillRect(px, py, ww, wh);
    }
    ctx.fillStyle = 'rgba(20,24,30,0.68)';
    ctx.fillRect(px + Math.floor(ww / 2), py, 1, wh);
    ctx.fillRect(px, py + Math.floor(wh * 0.48), ww, 1);
    if (litHex) {
      ex.fillStyle = '#1a1a1a';
      ex.fillRect(px + Math.floor(ww / 2), py, 1, wh);
      ex.fillRect(px, py + Math.floor(wh * 0.48), ww, 1);
    }
  };

  for (let r = 0; r < rows; r++) {
    // Ground-floor retail and the top few floors stay lit noticeably more.
    const floorBias = r === 0 ? 1.35 : r >= rows - 3 ? 1.15 : 1;
    // Per-floor choreography: higher floors trail the lobby by up to 45 min.
    const rowHour = hour - (r / Math.max(1, rows)) * floorLagHours;
    const rowSalt = roomSalt + r * 131;
    const rowChance = Math.min(
      1,
      record.chance * Math.min(1, windowOccupancy(rowHour) + cover * OVERCAST_BUMP) * floorBias
    );
    let c = 0;
    while (c < cols) {
      const run = 1 + Math.floor(hash01(record.seed * 13 + r * 911 + c * 37 + rowSalt) * 3);
      const roomChance = rowChance;
      const on = roomChance > 0 && hash01(record.seed * 97 + r * cols + c * 17 + rowSalt) > 1 - roomChance;
      const coolMix = hash01(record.seed * 31 + r * 7 + c + detailSalt) < coolBias ? 0.55 : 0;
      const brightness = 0.58 + 0.42 * hash01(record.seed * 29 + r * 53 + c * 5 + detailSalt);
      tmpLit.copy(record.warm).lerp(record.cool, coolMix).multiplyScalar(brightness);
      const litHex = on ? `#${tmpLit.getHexString()}` : null;
      const last = Math.min(cols, c + run);
      for (let k = c; k < last; k++) {
        paintCell(k * CELL_W + marginX, r * CELL_H + marginY, litHex);
      }
      if (on) litCells += last - c;
      c = last;
    }
  }

  record.litRatio = rows * cols > 0 ? litCells / (rows * cols) : 0;
  // Dim the freshly baked content and let the ramp ease it back up, so a facade
  // "switches on" instead of popping.
  record.ramp.value = 0.35;
  record.map.needsUpdate = true;
  record.emissiveMap.needsUpdate = true;
}

/**
 * Build (or reuse) the procedural lit-window facade for a building. The facade
 * is registered for the hourly re-bake, so returning a cached handle keeps the
 * schedule in sync with any other building that shares the same facade recipe.
 */
export function createWindowFacade(opts: WindowFacadeOptions): WindowFacade {
  const cols = Math.max(1, Math.round(opts.cols ?? 12));
  const rows = Math.max(1, Math.round(opts.rows ?? 24));
  const seed = opts.seed ?? 0;
  const chance = Math.max(0, Math.min(1, opts.chance ?? 0.55));
  const wallHex = new THREE.Color(opts.wall).getHexString();
  const litHex = new THREE.Color(opts.lit ?? '#ffd582').getHexString();
  const darkHex = new THREE.Color(opts.dark ?? '#202630').getHexString();
  const key = `${wallHex}_${litHex}_${darkHex}_${cols}x${rows}_${seed}_${chance}`;
  const existing = facades.get(key);
  if (existing) return existing;

  const width = cols * CELL_W;
  const height = rows * CELL_H;
  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  const ecv = document.createElement('canvas');
  ecv.width = width;
  ecv.height = height;

  const map = prepareCanvasTexture(new THREE.CanvasTexture(cv));
  map.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = prepareCanvasTexture(new THREE.CanvasTexture(ecv));
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  const record: FacadeRecord = {
    map,
    emissiveMap,
    cols,
    rows,
    ramp: { value: 1 },
    seed,
    chance,
    wallHex,
    darkHex,
    warm: new THREE.Color(`#${litHex}`),
    cool: new THREE.Color('#c6dcfa'),
    ctx: cv.getContext('2d')!,
    ex: ecv.getContext('2d')!,
    width,
    height,
    offset: (((seed * 0.37) % 1) + 1) % 1 * 0.9,
    lastKey: '',
    litRatio: 0,
  };
  bake(record, currentHour, currentCover);
  record.ramp.value = 1;
  record.lastKey = `${Math.floor((((currentHour + record.offset) % 24) + 24) % 24)}:${Math.round(currentCover * 4)}`;
  facades.set(key, record);
  return record;
}

/**
 * Advance the window schedule. `dt` drives the per-facade turn-on ramp; `cover`
 * is the weather cloud cover (0..1) so overcast days light more rooms. Runs in
 * every camera mode, because Places and Globe share the same facade materials.
 */
export function updateWindowLights(hour: number, dt = 0, cover = 0): void {
  currentHour = hour;
  currentCover = cover;
  const now = performance.now();
  const coverKey = Math.round(Math.max(0, Math.min(1, cover)) * 4);
  let baked = 0;
  let ratioSum = 0;
  facades.forEach((record) => {
    ratioSum += record.litRatio;
    // Shared ramp: eases freshly baked emissive maps up from a dim start.
    if (dt > 0 && record.ramp.value < 1) {
      record.ramp.value += (1 - record.ramp.value) * Math.min(1, dt * 3.2);
    }
    if (baked >= REBAKES_PER_UPDATE) return;
    const localHour = (((hour + record.offset) % 24) + 24) % 24;
    const key = `${Math.floor(localHour)}:${coverKey}`;
    if (key === record.lastKey) return;
    if (now - lastBakeAt < REBAKE_INTERVAL_MS) return;
    record.lastKey = key;
    lastBakeAt = now;
    baked++;
    bake(record, localHour, cover);
  });
  if (facades.size > 0) {
    const targetRatio = ratioSum / facades.size;
    const ease = dt > 0 ? Math.min(1, dt * 1.6) : 1;
    litFraction += (targetRatio - litFraction) * ease;
  }
}
