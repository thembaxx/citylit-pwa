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

export type AnimalKind =
  | 'generic'
  | 'elephant'
  | 'penguin'
  | 'whale'
  | 'hippo'
  | 'gemsbok'
  | 'flamingo'
  | 'seabird'
  | 'vulture'
  | 'dassie'
  | 'bird';
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

/* ------------------------------------------------------------------ */
/* Near-tier articulation (count <= 6)                                  */
/*                                                                      */
/* The body stays in the merged/instanced batches. A handful of small    */
/* accents get their own parented pivots plus one InstancedMesh per part  */
/* type, so the whole herd still costs only 2-3 extra draw calls. All     */
/* matrices are written into preallocated scratch objects; motionScale=0  */
/* feeds phase 0 to the same maths, giving a deterministic rest pose.    */
/* ------------------------------------------------------------------ */

type ArticulationAxis = 'x' | 'y' | 'z';

interface NearPartTemplate {
  key: string;
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  /** Local offset from the animal's origin before member yaw/scale. */
  offset: readonly [number, number, number];
  tilt: readonly [number, number, number];
  scale: readonly [number, number, number];
  axis: ArticulationAxis;
  amp: number;
  freq: number;
  seed: number;
}

interface NearPlacement {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

interface NearPartBatch {
  pivot: THREE.Group;
  mesh: THREE.InstancedMesh;
  template: NearPartTemplate;
  placements: NearPlacement[];
}

const nearGeoCache = new Map<string, THREE.BufferGeometry>();
let nearTemplateCache: Partial<Record<AnimalKind, NearPartTemplate[]>> | null = null;

function nearGeo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = nearGeoCache.get(key);
  if (!geo) {
    geo = make();
    geo.userData.sharedResource = true;
    nearGeoCache.set(key, geo);
  }
  return geo;
}

function getNearPartTemplates(kind: AnimalKind, p: PrimitiveModule): NearPartTemplate[] {
  if (nearTemplateCache?.[kind]) return nearTemplateCache[kind]!;
  const parts: NearPartTemplate[] = [];
  const dark = p.M('#3a3129', 0.92);
  const steel = p.M('#5b6872', 0.72, 0.18);

  if (kind === 'elephant') {
    parts.push(
      {
        key: 'trunk',
        geo: nearGeo('near_trunk', () => new THREE.CylinderGeometry(0.022, 0.048, 0.34, 6)),
        mat: dark,
        offset: [0, 0.26, 0.27],
        tilt: [0.5, 0, 0],
        scale: [1, 1, 1],
        axis: 'z',
        amp: 0.2,
        freq: 1.1,
        seed: 0.4,
      },
      {
        key: 'earL',
        geo: nearGeo('near_ear', () => new THREE.BoxGeometry(0.2, 0.24, 0.025)),
        mat: dark,
        offset: [-0.21, 0.36, 0.13],
        tilt: [0, 0, 0.2],
        scale: [1, 1, 1],
        axis: 'y',
        amp: 0.3,
        freq: 0.7,
        seed: 1.3,
      },
      {
        key: 'earR',
        geo: nearGeo('near_ear', () => new THREE.BoxGeometry(0.2, 0.24, 0.025)),
        mat: dark,
        offset: [0.21, 0.36, 0.13],
        tilt: [0, 0, -0.2],
        scale: [1, 1, 1],
        axis: 'y',
        amp: 0.3,
        freq: 0.7,
        seed: 2.1,
      }
    );
  } else if (kind === 'penguin') {
    parts.push(
      {
        key: 'flipperL',
        geo: nearGeo('near_flipper', () => new THREE.BoxGeometry(0.045, 0.22, 0.09)),
        mat: dark,
        offset: [-0.14, 0.24, 0.01],
        tilt: [0, 0, 0.22],
        scale: [1, 1, 1],
        axis: 'z',
        amp: 0.5,
        freq: 2.2,
        seed: 0.7,
      },
      {
        key: 'flipperR',
        geo: nearGeo('near_flipper', () => new THREE.BoxGeometry(0.045, 0.22, 0.09)),
        mat: dark,
        offset: [0.14, 0.24, 0.01],
        tilt: [0, 0, -0.22],
        scale: [1, 1, 1],
        axis: 'z',
        amp: 0.5,
        freq: 2.2,
        seed: 0.7 + Math.PI,
      }
    );
  } else if (kind === 'whale') {
    parts.push(
      {
        key: 'fluke',
        geo: nearGeo('near_fluke', () => new THREE.BoxGeometry(0.42, 0.035, 0.18)),
        mat: steel,
        offset: [0, 0.16, -0.62],
        tilt: [0, 0, 0],
        scale: [1, 1, 1],
        axis: 'x',
        amp: 0.26,
        freq: 1.1,
        seed: 0.9,
      },
      {
        key: 'fin',
        geo: nearGeo('near_fin', () => new THREE.BoxGeometry(0.17, 0.035, 0.1)),
        mat: steel,
        offset: [0.21, 0.11, 0.04],
        tilt: [0, 0, -0.2],
        scale: [1, 1, 1],
        axis: 'x',
        amp: 0.18,
        freq: 1.4,
        seed: 2.4,
      }
    );
  } else if (kind === 'gemsbok') {
    parts.push(
      {
        key: 'head',
        geo: nearGeo('near_head', () => new THREE.BoxGeometry(0.11, 0.13, 0.19)),
        mat: dark,
        offset: [0, 0.46, 0.25],
        tilt: [0, 0, 0],
        scale: [1, 1, 1],
        axis: 'x',
        amp: 0.32,
        freq: 0.7,
        seed: 0.6,
      },
      {
        key: 'hornL',
        geo: nearGeo('near_horn', () => new THREE.ConeGeometry(0.018, 0.28, 6)),
        mat: dark,
        offset: [-0.04, 0.62, 0.27],
        tilt: [-0.32, 0, 0],
        scale: [1, 1, 1],
        axis: 'x',
        amp: 0.1,
        freq: 0.7,
        seed: 0.6,
      },
      {
        key: 'hornR',
        geo: nearGeo('near_horn', () => new THREE.ConeGeometry(0.018, 0.28, 6)),
        mat: dark,
        offset: [0.04, 0.62, 0.27],
        tilt: [-0.32, 0, 0],
        scale: [1, 1, 1],
        axis: 'x',
        amp: 0.1,
        freq: 0.7,
        seed: 0.8,
      }
    );
  }
  if (!nearTemplateCache) nearTemplateCache = {};
  nearTemplateCache[kind] = parts;
  return parts;
}

function createNearParts(
  kind: AnimalKind,
  members: AnimalMember[],
  p: PrimitiveModule,
  group: THREE.Group
): NearPartBatch[] {
  const templates = getNearPartTemplates(kind, p);
  if (!templates.length) return [];
  const batches: NearPartBatch[] = [];
  for (const template of templates) {
    const pivot = new THREE.Group();
    group.add(pivot);
    const placements: NearPlacement[] = [];
    const transforms: InstanceTransform[] = [];
    for (const m of members) {
      const cos = Math.cos(m.yaw);
      const sin = Math.sin(m.yaw);
      const [lx, ly, lz] = template.offset;
      const x = m.ox + (lx * cos + lz * sin) * m.scale;
      const z = m.oz + (-lx * sin + lz * cos) * m.scale;
      const y = ly * m.scale;
      placements.push({ x, y, z, rx: template.tilt[0], ry: m.yaw + template.tilt[1], rz: template.tilt[2] });
      transforms.push({
        x,
        y,
        z,
        rx: template.tilt[0],
        ry: m.yaw + template.tilt[1],
        rz: template.tilt[2],
        sx: m.scale * template.scale[0],
        sy: m.scale * template.scale[1],
        sz: m.scale * template.scale[2],
      });
    }
    const mesh = p.instancedMeshes(pivot, template.geo, template.mat, transforms);
    if (!mesh) continue;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    // Keep these out of contact-stamp scans and any future static merge pass.
    mesh.userData.noShadow = true;
    mesh.userData.cannotReceiveAO = true;
    mesh.userData.animatedPart = true;
    batches.push({ pivot, mesh, template, placements });
  }
  return batches;
}

function poseNearParts(
  batches: readonly NearPartBatch[],
  members: readonly AnimalMember[],
  time: number,
  frozen: boolean,
  idle: AnimalIdle,
  lodScale: number
): void {
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const t = batch.template;
    const m0 = members[0];
    const ph0 = frozen ? 0 : time * m0.freq + m0.phase;
    const collective = Math.sin(ph0 * t.freq + t.seed) * t.amp * 0.2;
    batch.pivot.rotation.set(0, 0, 0);
    if (t.axis === 'x') batch.pivot.rotation.x = collective;
    else if (t.axis === 'y') batch.pivot.rotation.y = collective;
    else batch.pivot.rotation.z = collective;
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const phase = frozen ? 0 : time * m.freq + m.phase;
      writeAnimalPose(poseScratch, idle, phase, m.amp);
      const swing = Math.sin(phase * t.freq + t.seed) * t.amp;
      const pl = batch.placements[i];
      scratchPos.set(pl.x, pl.y + poseScratch.y, pl.z);
      scratchEuler.set(
        pl.rx + (t.axis === 'x' ? swing : 0),
        pl.ry + (t.axis === 'y' ? swing : 0),
        pl.rz + (t.axis === 'z' ? swing : 0)
      );
      scratchQuat.setFromEuler(scratchEuler);
      const s = m.scale * lodScale;
      scratchScale.set(s * t.scale[0], s * t.scale[1], s * t.scale[2]);
      scratchMatrix.compose(scratchPos, scratchQuat, scratchScale);
      batch.mesh.setMatrixAt(i, scratchMatrix);
    }
    batch.mesh.instanceMatrix.needsUpdate = true;
  }
}

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
    case 'flamingo':
      p.flamingo(holder, 0, 0, 0, 1, 0);
      break;
    case 'seabird':
      p.seabird(holder, 0, 0, 0, 1, 0);
      break;
    case 'vulture':
      p.vulture(holder, 0, 0, 0, 1, 0);
      break;
    case 'dassie':
      p.dassie(holder, 0, 0, 0, 1, 0);
      break;
    case 'bird':
      // Small flying birds reuse the existing animated gull template.
      holder.add(p.bird());
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

  // Far/instanced herds (count > 6) stay as the merged body batches above.
  const nearParts = count <= 6 ? createNearParts(spec.kind, members, p, group) : [];

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
      poseNearParts(nearParts, members, time, frozen, spec.idle, lodScale);
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
    poseNearParts(nearParts, members, time, frozen, spec.idle, lodScale);
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
