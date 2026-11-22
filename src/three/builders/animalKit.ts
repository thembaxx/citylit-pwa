import * as THREE from 'three';
import type { InstanceTransform } from './primitives';

/**
 * Shared animal scaffolding extension.
 *
 * This module does not model animals: every mesh comes from the existing
 * builders in `primitives.ts`. It adds a typed spec, a zero-allocation idle
 * tick, month/season gating, one shared contact-shadow stamp per scaffold and
 * an optional distance-based visibility/scale LOD tier.
 *
 * `primitives.ts` uses Vite-only extensionless/directory specifiers. The
 * guarded dynamic import below keeps the pure helpers in this file importable
 * from plain `node --test` (which cannot resolve those specifiers); scaffold
 * construction itself only runs inside the Vite/browser module graph.
 */
type PrimitiveModule = typeof import('./primitives');

let primitives: PrimitiveModule | null = null;
try {
  primitives = await import('./primitives');
} catch {
  primitives = null;
}

export type AnimalKind = 'generic' | 'elephant' | 'penguin' | 'whale' | 'hippo' | 'gemsbok';
export type AnimalIdle = 'bob' | 'graze' | 'lookup' | 'waddle' | 'submerge' | 'rock';
/** Southern-hemisphere seasons, matching South African sites. */
export type AnimalSeason = 'summer' | 'autumn' | 'winter' | 'spring';

export interface AnimalVec3 {
  x: number;
  y: number;
  z: number;
}

/** Optional distance LOD: a reduced scale tier and a hard cull distance. */
export interface AnimalLodSpec {
  /** Hide the herd beyond this distance. */
  cullDistance?: number;
  /** Apply `farScale` beyond this distance. */
  farDistance?: number;
  /** Uniform scale multiplier for the far tier. Defaults to 1. */
  farScale?: number;
}

export interface AnimalScaffoldSpec {
  /** Existing builder to wrap. `generic` uses `animal(color)`. */
  kind: AnimalKind;
  count?: number;
  /** World-space anchor of the herd. */
  position: AnimalVec3;
  scale?: number;
  yaw?: number;
  /** Hide colour for `kind: 'generic'` only. Existing species palettes are untouched. */
  color?: string;
  /** Lateral herd spacing for `count > 1`. Defaults to `scale * 0.9`. */
  spread?: number;
  /** Per-animal phase offset multiplier. Defaults to 0.7. */
  phaseSpread?: number;
  idle: AnimalIdle;
  /** 1-12; a single month or an allow-list. */
  month?: number | readonly number[];
  /** Southern-hemisphere season allow-list. Combined with `month` as an AND. */
  season?: AnimalSeason | readonly AnimalSeason[];
  /** Dedicated contact stamps, batched into one shadow mesh for the whole scaffold. */
  contact?: boolean;
  contactRadius?: number;
  contactOpacity?: number;
  lods?: AnimalLodSpec;
}

export interface AnimalPose {
  y: number;
  rx: number;
  ry: number;
  rz: number;
  sy: number;
}

export interface AnimalScaffold {
  group: THREE.Group;
  /** `motionScale = 0` writes a deterministic rest pose and freezes time. */
  update(dt: number, elapsed: number, motionScale: number, month?: number): void;
  /** Feed camera distance to drive the optional LOD tier. */
  setLod(distance: number): void;
  readonly count: number;
}

/* ------------------------------------------------------------------ */
/* Pure helpers (no THREE dependency at call time)                      */
/* ------------------------------------------------------------------ */

let seasonMonth: number | undefined;

/** Publish the engine's current southern-hemisphere month to animal scaffolds. */
export function setAnimalSeasonMonth(month: number): void {
  seasonMonth = Number.isFinite(month) ? normalizeAnimalMonth(month) : undefined;
}

/** Read the current month; `undefined` means "no gate evaluation". */
export function getAnimalSeasonMonth(): number | undefined {
  return seasonMonth;
}

/** Normalise any integer to a 1-12 month, wrapping in both directions. */
export function normalizeAnimalMonth(month: number): number {
  if (!Number.isFinite(month)) return 1;
  return ((((Math.floor(month) - 1) % 12) + 12) % 12) + 1;
}

/** Southern-hemisphere season for a 1-12 month. */
export function animalSeasonForMonth(month: number): AnimalSeason {
  const m = normalizeAnimalMonth(month);
  if (m === 12 || m <= 2) return 'summer';
  if (m <= 5) return 'autumn';
  if (m <= 8) return 'winter';
  return 'spring';
}

/**
 * True when no gate is configured, or when the supplied month satisfies every
 * configured gate. An unknown/absent month leaves the herd visible.
 */
export function isAnimalActive(
  month: number | undefined,
  allowedMonths?: number | readonly number[],
  allowedSeasons?: AnimalSeason | readonly AnimalSeason[]
): boolean {
  if (month === undefined || !Number.isFinite(month)) return true;
  const months = typeof allowedMonths === 'number' ? [allowedMonths] : allowedMonths;
  const seasons = typeof allowedSeasons === 'string' ? [allowedSeasons] : allowedSeasons;
  if (!months?.length && !seasons?.length) return true;
  const m = normalizeAnimalMonth(month);
  if (months?.length && !months.some((candidate) => normalizeAnimalMonth(candidate) === m)) {
    return false;
  }
  if (seasons?.length && !seasons.includes(animalSeasonForMonth(m))) return false;
  return true;
}

/** Advance a conserved phase clock; clamps dt and motionScale, ignores bad input. */
export function advanceAnimalTime(current: number, dt: number, motionScale: number): number {
  if (!Number.isFinite(current)) return 0;
  if (!Number.isFinite(dt) || !Number.isFinite(motionScale)) return current;
  const scale = Math.max(0, Math.min(motionScale, 2));
  if (scale === 0 || dt <= 0) return current;
  return current + Math.min(dt, 0.1) * scale;
}

/**
 * Write one idle pose into a caller-owned object. No allocations; reused by
 * both the single-animal and instanced-herd paths.
 */
export function writeAnimalPose(
  out: AnimalPose,
  idle: AnimalIdle,
  phase: number,
  amp = 1
): AnimalPose {
  out.y = 0;
  out.rx = 0;
  out.ry = 0;
  out.rz = 0;
  out.sy = 1;
  if (!Number.isFinite(phase)) return out;
  const a = Number.isFinite(amp) ? amp : 1;
  const s = Math.sin(phase);
  switch (idle) {
    case 'bob':
      out.y = s * 0.018 * a;
      out.sy = 1 + s * 0.012 * a;
      break;
    case 'graze':
      out.rx = -(0.24 + s * 0.07) * a;
      out.y = -0.004 * a;
      break;
    case 'lookup':
      out.rx = (0.16 + s * 0.05) * a;
      out.y = 0.006 * a;
      break;
    case 'waddle':
      out.rz = s * 0.14 * a;
      out.ry = Math.sin(phase * 0.5) * 0.08 * a;
      out.y = Math.abs(s) * 0.012 * a;
      break;
    case 'submerge':
      out.y = (-0.06 + (s * 0.5 + 0.5) * 0.12) * a;
      out.sy = 1 - (s * 0.5 + 0.5) * 0.06 * a;
      break;
    case 'rock':
      out.rz = s * 0.055 * a;
      out.rx = Math.sin(phase * 0.61) * 0.035 * a;
      break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Scaffold construction                                                */
/* ------------------------------------------------------------------ */

const IDLE_FREQ: Record<AnimalIdle, number> = {
  bob: 1.6,
  graze: 0.7,
  lookup: 0.55,
  waddle: 2.2,
  submerge: 0.5,
  rock: 0.8,
};

interface AnimalMember {
  ox: number;
  oz: number;
  yaw: number;
  scale: number;
  phase: number;
  freq: number;
  amp: number;
}

const poseScratch: AnimalPose = { y: 0, rx: 0, ry: 0, rz: 0, sy: 1 };
const scratchPos = new THREE.Vector3();
const scratchEuler = new THREE.Euler();
const scratchQuat = new THREE.Quaternion();
const scratchScale = new THREE.Vector3();
const scratchMatrix = new THREE.Matrix4();
const scratchPartMatrix = new THREE.Matrix4();

function createAnimalTemplate(kind: AnimalKind, color: string, p: PrimitiveModule): THREE.Group {
  const holder = new THREE.Group();
  switch (kind) {
    case 'elephant':
      p.elephant(holder, 0, 0, 0, 1, 0);
      break;
    case 'penguin':
      p.penguin(holder, 0, 0, 0, 1, 0);
      break;
    case 'hippo':
      p.hippo(holder, 0, 0, 0, 1, 0);
      break;
    case 'gemsbok':
      p.gemsbok(holder, 0, 0, 0, 1, 0);
      break;
    case 'whale':
      holder.add(p.whale(1));
      break;
    case 'generic':
      holder.add(p.animal(color));
      break;
  }
  return holder;
}

/** Wrap one or more existing animal builders in a shared idle/tick scaffold. */
export function createAnimalScaffold(spec: AnimalScaffoldSpec): AnimalScaffold {
  const p = primitives;
  if (!p) {
    throw new Error('[animalKit] primitives is unavailable outside the Vite module graph');
  }

  const count = Math.max(1, Math.floor(Number.isFinite(spec.count) ? (spec.count as number) : 1));
  const baseScale =
    Number.isFinite(spec.scale) && (spec.scale as number) > 0 ? (spec.scale as number) : 1;
  const baseYaw = Number.isFinite(spec.yaw) ? (spec.yaw as number) : 0;

  const group = new THREE.Group();
  group.position.set(spec.position.x, spec.position.y, spec.position.z);

  const template = createAnimalTemplate(spec.kind, spec.color ?? '#8a7a63', p);
  const spread = spec.spread ?? baseScale * 0.9;
  const phaseSpread = spec.phaseSpread ?? 0.7;
  const baseFreq = IDLE_FREQ[spec.idle] ?? 1;
  const members: AnimalMember[] = [];
  for (let i = 0; i < count; i++) {
    const centered = i - (count - 1) * 0.5;
    members.push({
      ox: count > 1 ? centered * spread : 0,
      oz: count > 1 ? Math.sin(i * 2.399963) * spread * 0.35 : 0,
      yaw: count > 1 ? baseYaw + Math.sin(i * 4.7) * 0.18 : baseYaw,
      scale: baseScale,
      phase: i * phaseSpread * Math.PI * 2,
      freq: baseFreq + (i % 3) * 0.13,
      amp: 0.85 + (i % 4) * 0.05,
    });
  }

  let pivot: THREE.Group | null = null;
  const batches: THREE.InstancedMesh[] = [];
  // Material buckets whose meshes were not merged keep a local transform.
  const partMatrices: THREE.Matrix4[] = [];
  if (count === 1) {
    pivot = new THREE.Group();
    group.add(pivot);
    pivot.add(template);
    template.scale.setScalar(baseScale);
    template.rotation.y = members[0].yaw;
    // Base yaw lives on the template; the pivot carries only idle sway.
    members[0].yaw = 0;
  } else {
    const transforms: InstanceTransform[] = members.map((m) => ({
      x: m.ox,
      y: 0,
      z: m.oz,
      ry: m.yaw,
      sx: m.scale,
      sy: m.scale,
      sz: m.scale,
    }));
    const parts: THREE.Mesh[] = [];
    template.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !(obj instanceof THREE.InstancedMesh)) parts.push(obj);
    });
    for (const part of parts) {
      if (Array.isArray(part.material)) continue;
      const batch = p.instancedMeshes(group, part.geometry, part.material, transforms);
      if (!batch) continue;
      part.updateMatrix();
      partMatrices.push(part.matrix);
      batches.push(batch);
    }
  }

  let time = 0;
  let timeSeeded = false;
  let frozen = true;
  let active = true;
  let lodVisible = true;
  let lodScale = 1;
  let lodApplied = false;

  const applyPose = (): void => {
    if (pivot) {
      const m = members[0];
      writeAnimalPose(poseScratch, spec.idle, frozen ? 0 : time * m.freq + m.phase, m.amp);
      pivot.position.set(0, poseScratch.y, 0);
      pivot.rotation.set(poseScratch.rx, poseScratch.ry, poseScratch.rz);
      pivot.scale.set(lodScale, lodScale * poseScratch.sy, lodScale);
      return;
    }
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      writeAnimalPose(poseScratch, spec.idle, frozen ? 0 : time * m.freq + m.phase, m.amp);
      scratchPos.set(m.ox, poseScratch.y, m.oz);
      scratchEuler.set(poseScratch.rx, m.yaw + poseScratch.ry, poseScratch.rz);
      scratchQuat.setFromEuler(scratchEuler);
      const s = m.scale * lodScale;
      scratchScale.set(s, s * poseScratch.sy, s);
      scratchMatrix.compose(scratchPos, scratchQuat, scratchScale);
      for (let b = 0; b < batches.length; b++) {
        scratchPartMatrix.multiplyMatrices(scratchMatrix, partMatrices[b]);
        batches[b].setMatrixAt(i, scratchPartMatrix);
      }
    }
    for (let b = 0; b < batches.length; b++) batches[b].instanceMatrix.needsUpdate = true;
  };

  if (spec.contact) {
    const radius = spec.contactRadius ?? baseScale * 0.24;
    const opacity = spec.contactOpacity ?? 0.24;
    // The stamp is a child of `group`, whose transform already carries the
    // anchor. Offsets must stay in local space or the shadow lands twice as far
    // from the origin as the animal.
    for (const m of members) {
      p.stampContactShadow(group, m.ox, m.oz, radius, opacity, 0.014);
    }
    // Stop a site-level stampContactShadowsFromMeshes() from double-stamping.
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.userData.noShadow = true;
    });
    // One material + one mesh for the entire herd, never one per animal.
    p.finalizeContactShadows(group);
  }

  const update = (dt: number, elapsed: number, motionScale: number, month?: number): void => {
    active = isAnimalActive(month, spec.month, spec.season);
    group.visible = active && lodVisible;
    if (!timeSeeded && Number.isFinite(elapsed)) {
      time = elapsed;
      timeSeeded = true;
    }
    const scale = Number.isFinite(motionScale) ? Math.max(0, Math.min(motionScale, 2)) : 0;
    if (scale === 0) {
      frozen = true;
      applyPose();
      return;
    }
    frozen = false;
    time = advanceAnimalTime(time, dt, scale);
    applyPose();
  };

  const setLod = (distance: number): void => {
    const lod = spec.lods;
    let nextVisible = true;
    let nextScale = 1;
    if (lod) {
      const d = Number.isFinite(distance) ? distance : 0;
      nextVisible = lod.cullDistance === undefined || d <= lod.cullDistance;
      nextScale = lod.farDistance !== undefined && d > lod.farDistance ? (lod.farScale ?? 1) : 1;
    }
    if (!lodApplied || nextVisible !== lodVisible || nextScale !== lodScale) {
      lodVisible = nextVisible;
      lodScale = nextScale;
      group.visible = active && lodVisible;
      applyPose();
    }
  };

  applyPose();
  lodApplied = true;
  // The engine collects these targets once per landmark and feeds camera
  // distance without the builder needing a camera reference.
  group.userData.updateAnimalLod = setLod;
  return { group, update, setLod, count };
}
