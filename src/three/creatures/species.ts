/**
 * Procedural species library.
 *
 * Every creature is assembled from primitive geometry (lathe, sphere, box,
 * cone, capsule-like cylinders) into ONE merged geometry per species, carrying
 * the vertex attributes the GPU animation reads:
 *
 *   aBend   0 at the head → 1 at the tail (spine-bend wave weight)
 *   aPivot  local pivot for part rotation
 *   aAxis   unit rotation axis for part rotation
 *   aWeight signed rotation amplitude (left/right mirror by sign)
 *   aFreq   oscillation rate multiplier
 *   aPhase  fixed phase offset for follow-through
 *   aPart   part id, for debugging and matched LOD poses
 *
 * No imported models, no textures: bead eyes are geometry with a white glint.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CreatureAnimation, SpeciesId } from './habitat';

export const PART = {
  body: 0,
  wingL: 1,
  wingR: 2,
  legL: 3,
  legR: 4,
  head: 5,
  tail: 6,
  eye: 7,
} as const;

export interface PartInput {
  geo: THREE.BufferGeometry;
  color: THREE.ColorRepresentation;
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
  part?: number;
  pivot?: readonly [number, number, number];
  axis?: readonly [number, number, number];
  weight?: number;
  freq?: number;
  phase?: number;
}

export interface AssembledGeometry {
  geometry: THREE.BufferGeometry;
  triangles: number;
  height: number;
  length: number;
  zMax: number;
  zSpan: number;
}

export type SpeciesLod = 0 | 1 | 2;

const scratchMatrix = new THREE.Matrix4();
const scratchQuat = new THREE.Quaternion();
const scratchEuler = new THREE.Euler();
const scratchPos = new THREE.Vector3();
const scratchScale = new THREE.Vector3();
const AXIS_DEFAULT: readonly [number, number, number] = [0, 0, 1];

/** 0 = X, 1 = Y, 2 = Z; parts only ever rotate about a cardinal axis. */
function axisId(axis: readonly [number, number, number]): number {
  const x = Math.abs(axis[0]);
  const y = Math.abs(axis[1]);
  const z = Math.abs(axis[2]);
  if (x >= y && x >= z) return 0;
  if (y >= z) return 1;
  return 2;
}

/** Merge parts into one geometry and synthesise the animation attributes. */
export function assembleParts(
  parts: readonly PartInput[],
  spineBounds?: { readonly zMax: number; readonly zSpan: number }
): AssembledGeometry {
  if (parts.length === 0) throw new Error('[creatures] assembleParts needs at least one part');
  const prepared: THREE.BufferGeometry[] = [];
  const counts: number[] = [];

  for (const part of parts) {
    const geo = part.geo.index ? part.geo.toNonIndexed() : part.geo.clone();
    scratchPos.set(part.x ?? 0, part.y ?? 0, part.z ?? 0);
    scratchEuler.set(part.rx ?? 0, part.ry ?? 0, part.rz ?? 0);
    scratchQuat.setFromEuler(scratchEuler);
    scratchScale.set(part.sx ?? 1, part.sy ?? 1, part.sz ?? 1);
    scratchMatrix.compose(scratchPos, scratchQuat, scratchScale);
    geo.applyMatrix4(scratchMatrix);
    for (const name of Object.keys(geo.attributes)) {
      if (name !== 'position' && name !== 'normal') geo.deleteAttribute(name);
    }
    if (!geo.attributes.normal) geo.computeVertexNormals();
    prepared.push(geo);
    counts.push(geo.attributes.position.count);
  }

  const merged = mergeGeometries(prepared, false);
  if (!merged) throw new Error('[creatures] part merge failed');
  for (const geo of prepared) geo.dispose();

  const total = merged.attributes.position.count;
  const color = new Float32Array(total * 3);
  const bend = new Float32Array(total);
  const pivot = new Float32Array(total * 3);
  // (weight, freq, phaseOffset, axisId) packed into one vec4 to stay inside the
  // guaranteed vertex-attribute budget alongside instancing.
  const motion = new Float32Array(total * 4);
  const tmpColor = new THREE.Color();

  let offset = 0;
  for (let p = 0; p < parts.length; p++) {
    const part = parts[p];
    const count = counts[p];
    tmpColor.set(part.color);
    const ax = part.axis ?? AXIS_DEFAULT;
    const pv = part.pivot ?? [part.x ?? 0, part.y ?? 0, part.z ?? 0];
    for (let i = 0; i < count; i++) {
      const v = offset + i;
      color[v * 3] = tmpColor.r;
      color[v * 3 + 1] = tmpColor.g;
      color[v * 3 + 2] = tmpColor.b;
      pivot[v * 3] = pv[0];
      pivot[v * 3 + 1] = pv[1];
      pivot[v * 3 + 2] = pv[2];
      motion[v * 4] = part.weight ?? 0;
      motion[v * 4 + 1] = part.freq ?? 1;
      motion[v * 4 + 2] = part.phase ?? 0;
      motion[v * 4 + 3] = axisId(ax);
    }
    offset += count;
  }

  merged.computeBoundingBox();
  const bbox = merged.boundingBox ?? new THREE.Box3();
  const zMax = spineBounds ? spineBounds.zMax : bbox.max.z;
  const zSpan = spineBounds ? spineBounds.zSpan : Math.max(0.0001, zMax - bbox.min.z);
  const position = merged.attributes.position;
  for (let i = 0; i < total; i++) {
    const z = position.getZ(i);
    const t = Math.max(0, Math.min(1, (zMax - z) / zSpan));
    bend[i] = t;
  }

  merged.setAttribute('color', new THREE.BufferAttribute(color, 3));
  merged.setAttribute('aBend', new THREE.BufferAttribute(bend, 1));
  merged.setAttribute('aPivot', new THREE.BufferAttribute(pivot, 3));
  merged.setAttribute('aMotion', new THREE.BufferAttribute(motion, 4));
  merged.computeBoundingSphere();

  return {
    geometry: merged,
    triangles: total / 3,
    height: Math.max(0.02, bbox.max.y - bbox.min.y),
    length: Math.max(0.02, bbox.max.z - bbox.min.z),
    zMax,
    zSpan,
  };
}

export interface SpeciesBuild {
  body: THREE.BufferGeometry;
  eyes: THREE.BufferGeometry | null;
  triangles: number;
  eyeTriangles: number;
  height: number;
  length: number;
  roughness: number;
  metalness: number;
  /** True for marine species: lower roughness, stronger rim. */
  wet?: boolean;
}

export interface SpeciesDefinition {
  id: SpeciesId;
  label: string;
  animation: CreatureAnimation;
  build: (lod: SpeciesLod) => SpeciesBuild;
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

function segFor(base: number, lod: SpeciesLod, min = 4): number {
  if (lod === 0) return base;
  if (lod === 1) return Math.max(min, Math.round(base * 0.72));
  return Math.max(min, Math.round(base * 0.48));
}

function lathe(
  points: readonly (readonly [number, number])[],
  segments = 9,
  lod: SpeciesLod = 0,
  upright = false
): THREE.BufferGeometry {
  const vectors = points.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y));
  const geo = new THREE.LatheGeometry(vectors, segFor(segments, lod, 5));
  return upright ? geo : geo.rotateX(Math.PI / 2);
}

function ball(radius: number, segments = 8, lod: SpeciesLod = 0): THREE.BufferGeometry {
  const s = segFor(segments, lod, 4);
  return new THREE.SphereGeometry(radius, s, Math.max(4, Math.round(s * 0.7)));
}

function box(w: number, h: number, d: number): THREE.BufferGeometry {
  return new THREE.BoxGeometry(w, h, d);
}

function cone(radius: number, height: number, segments = 6, lod: SpeciesLod = 0): THREE.BufferGeometry {
  return new THREE.ConeGeometry(radius, height, segFor(segments, lod, 4));
}

const INK = '#221f1c';
const GLINT = '#fffdf7';

interface EyeOptions {
  x: number;
  y: number;
  z: number;
  radius: number;
  /** Head pivot so the eyes follow head turns with the resting body. */
  pivot?: readonly [number, number, number];
  weight?: number;
  freq?: number;
  /** Fish and whales do not blink. */
  blinkPivot?: readonly [number, number, number];
  lod?: SpeciesLod;
}

function eyePair(opts: EyeOptions): PartInput[] {
  const lod = opts.lod ?? 0;
  const parts: PartInput[] = [];
  for (const side of [-1, 1]) {
    const pivot = opts.pivot ?? opts.blinkPivot ?? [side * opts.x, opts.y, opts.z];
    parts.push({
      geo: ball(opts.radius, 8, lod),
      color: INK,
      x: side * opts.x,
      y: opts.y,
      z: opts.z,
      part: PART.eye,
      pivot,
      weight: opts.weight ?? 0,
      freq: opts.freq ?? 1,
    });
    if (lod < 2) {
      parts.push({
        geo: ball(opts.radius * 0.34, 6, lod),
        color: GLINT,
        x: side * opts.x + side * opts.radius * 0.3,
        y: opts.y + opts.radius * 0.42,
        z: opts.z + opts.radius * 0.72,
        part: PART.eye,
        pivot,
        weight: opts.weight ?? 0,
        freq: opts.freq ?? 1,
      });
    }
  }
  return parts;
}

/* ------------------------------------------------------------------ */
/* Species                                                             */
/* ------------------------------------------------------------------ */

function buildGull(lod: SpeciesLod): SpeciesBuild {
  const body = '#e9e6dd';
  const wing = '#b9bcc0';
  const headPivot: [number, number, number] = [0, 0.055, 0.06];
  const parts: PartInput[] = [
    { geo: ball(0.08, 10, lod), color: body, sx: 1, sy: 0.92, sz: 2.4 },
    // Tail wedge with follow-through.
    {
      geo: box(0.09, 0.012, 0.12),
      color: body,
      z: -0.21,
      y: 0.012,
      part: PART.tail,
      pivot: [0, 0.012, -0.14],
      axis: [1, 0, 0],
      weight: 0.18,
      freq: 3.2,
      phase: 0.9,
    },
    // Head + beak.
    {
      geo: ball(0.045, 8, lod),
      color: '#f6f3ea',
      y: 0.055,
      z: 0.185,
      part: PART.head,
      pivot: headPivot,
      axis: [1, 0, 0],
      weight: 0.08,
      freq: 1.4,
    },
    {
      geo: cone(0.018, 0.075, 6, lod),
      color: '#e0b64a',
      y: 0.048,
      z: 0.235,
      rx: Math.PI / 2,
      part: PART.head,
      pivot: headPivot,
      axis: [1, 0, 0],
      weight: 0.08,
      freq: 1.4,
    },
    // Wings: inner airfoil + swept dark-tipped outer primary with subtle lag.
    {
      geo: box(0.22, 0.009, 0.12),
      color: wing,
      x: 0.145,
      y: 0.035,
      z: 0.015,
      part: PART.wingL,
      pivot: [0.045, 0.035, 0.03],
      axis: [0, 0, 1],
      weight: 0.95,
      freq: 9.5,
    },
    {
      geo: box(0.14, 0.007, 0.075),
      color: '#34383e',
      x: 0.31,
      y: 0.035,
      z: -0.025,
      ry: -0.22,
      part: PART.wingL,
      pivot: [0.045, 0.035, 0.03],
      axis: [0, 0, 1],
      weight: 0.95,
      freq: 9.5,
      phase: -0.32,
    },
    {
      geo: box(0.22, 0.009, 0.12),
      color: wing,
      x: -0.145,
      y: 0.035,
      z: 0.015,
      part: PART.wingR,
      pivot: [-0.045, 0.035, 0.03],
      axis: [0, 0, 1],
      weight: -0.95,
      freq: 9.5,
    },
    {
      geo: box(0.14, 0.007, 0.075),
      color: '#34383e',
      x: -0.31,
      y: 0.035,
      z: -0.025,
      ry: 0.22,
      part: PART.wingR,
      pivot: [-0.045, 0.035, 0.03],
      axis: [0, 0, 1],
      weight: -0.95,
      freq: 9.5,
      phase: -0.32,
    },
    // Folded feet tucked under the body.
    { geo: box(0.014, 0.02, 0.05), color: '#c98f4a', x: 0.026, y: -0.055, z: -0.04 },
    { geo: box(0.014, 0.02, 0.05), color: '#c98f4a', x: -0.026, y: -0.055, z: -0.04 },
  ];
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(
          eyePair({ x: 0.032, y: 0.058, z: 0.2, radius: 0.011, pivot: headPivot, lod }),
          assembled
        )
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.72,
    metalness: 0,
  };
}

function buildPenguin(lod: SpeciesLod): SpeciesBuild {
  const body = '#20252d';
  const belly = '#e3ded2';
  const pinkPatch = '#cc767a';
  const headPivot: [number, number, number] = [0, 0.335, 0];
  const parts: PartInput[] = [
    // Upright chunky body.
    { geo: lathe([[0.02, 0], [0.11, 0.08], [0.125, 0.2], [0.09, 0.3], [0.03, 0.335]], 10, lod, true), color: body },
    // Warm-white belly panel + flush African penguin chest band.
    { geo: ball(0.102, 8, lod), color: belly, y: 0.18, z: 0.066, sx: 0.88, sy: 1.32, sz: 0.64 },
    { geo: ball(0.095, 8, lod), color: body, y: 0.252, z: 0.055, sx: 0.96, sy: 0.22, sz: 0.72 },
    // Head + pink supraloral eye patches + beak.
    { geo: ball(0.062, 8, lod), color: body, y: 0.35, z: 0.01, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.06, freq: 1.2 },
    { geo: ball(0.017, 5, lod), color: pinkPatch, x: 0.027, y: 0.357, z: 0.05, sx: 0.9, sy: 0.75, sz: 0.6, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.06, freq: 1.2 },
    { geo: ball(0.017, 5, lod), color: pinkPatch, x: -0.027, y: 0.357, z: 0.05, sx: 0.9, sy: 0.75, sz: 0.6, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.06, freq: 1.2 },
    { geo: cone(0.016, 0.075, 6, lod), color: '#2b2b2b', y: 0.34, z: 0.085, rx: Math.PI / 2, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.06, freq: 1.2 },
    // Flippers tucked closer to shoulders.
    { geo: box(0.018, 0.16, 0.052), color: body, x: 0.112, y: 0.195, z: 0.005, rz: 0.18, part: PART.wingL, pivot: [0.09, 0.265, 0.005], axis: [0, 0, 1], weight: 0.42, freq: 4.6 },
    { geo: box(0.018, 0.16, 0.052), color: body, x: -0.112, y: 0.195, z: 0.005, rz: -0.18, part: PART.wingR, pivot: [-0.09, 0.265, 0.005], axis: [0, 0, 1], weight: -0.42, freq: 4.6 },
    // Black African penguin feet.
    { geo: box(0.048, 0.02, 0.088), color: '#2b2d32', x: 0.045, y: 0.012, z: 0.025, part: PART.legL, pivot: [0.045, 0.03, 0], axis: [1, 0, 0], weight: 0.3, freq: 5.4 },
    { geo: box(0.048, 0.02, 0.088), color: '#2b2d32', x: -0.045, y: 0.012, z: 0.025, part: PART.legR, pivot: [-0.045, 0.03, 0], axis: [1, 0, 0], weight: 0.3, freq: 5.4, phase: Math.PI },
  ];
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(
          eyePair({ x: 0.028, y: 0.355, z: 0.052, radius: 0.009, pivot: headPivot, weight: 0.06, freq: 1.2, lod }),
          assembled
        )
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.62,
    metalness: 0,
  };
}

function buildFish(lod: SpeciesLod): SpeciesBuild {
  const body = '#7d8f96';
  const parts: PartInput[] = [
    {
      geo: lathe([[0.005, -0.19], [0.05, -0.1], [0.075, 0.02], [0.06, 0.12], [0.02, 0.19]], 10, lod),
      color: body,
      sx: 0.55,
    },
    // Dorsal fin.
    { geo: box(0.008, 0.06, 0.13), color: '#5d6f76', y: 0.06, z: 0.0 },
    // Vertically-forked tail fin.
    {
      geo: box(0.01, 0.16, 0.1),
      color: '#68797f',
      z: -0.23,
      part: PART.tail,
      pivot: [0, 0, -0.17],
      axis: [0, 1, 0],
      weight: 0.45,
      freq: 5.2,
    },
    // Pectoral fins.
    { geo: box(0.06, 0.006, 0.035), color: '#6d7f85', x: 0.045, y: -0.005, z: 0.06, rz: -0.3 },
    { geo: box(0.06, 0.006, 0.035), color: '#6d7f85', x: -0.045, y: -0.005, z: 0.06, rz: 0.3 },
  ];
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(eyePair({ x: 0.038, y: 0.02, z: 0.14, radius: 0.012, lod }), assembled)
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.34,
    metalness: 0.25,
    wet: true,
  };
}

function buildDolphin(lod: SpeciesLod): SpeciesBuild {
  const body = '#5a6670';
  const parts: PartInput[] = [
    {
      geo: lathe([[0.004, -0.46], [0.04, -0.38], [0.085, -0.22], [0.1, 0], [0.075, 0.22], [0.03, 0.36], [0.012, 0.42]], 12, lod),
      color: body,
      sy: 1.05,
    },
    { geo: box(0.02, 0.11, 0.16), color: '#4c5760', y: 0.09, z: 0.02, rz: 0.25 },
    // Horizontal flukes.
    { geo: box(0.34, 0.014, 0.12), color: '#4c5760', z: -0.47, part: PART.tail, pivot: [0, 0, -0.38], axis: [0, 1, 0], weight: 0.4, freq: 4.4 },
    // Beak.
    { geo: cone(0.03, 0.12, 7, lod), color: '#66727c', y: -0.012, z: 0.47, rx: Math.PI / 2, part: PART.head, pivot: [0, 0, 0.4], axis: [0, 1, 0], weight: 0.2, freq: 2.4 },
    // Pectoral fins.
    { geo: box(0.13, 0.012, 0.05), color: '#515d66', x: 0.09, y: -0.055, z: 0.14, rz: -0.25 },
    { geo: box(0.13, 0.012, 0.05), color: '#515d66', x: -0.09, y: -0.055, z: 0.14, rz: 0.25 },
  ];
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(eyePair({ x: 0.055, y: 0.01, z: 0.34, radius: 0.011, lod }), assembled)
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.24,
    metalness: 0.18,
    wet: true,
  };
}

function buildWhale(lod: SpeciesLod): SpeciesBuild {
  const body = '#3c4550';
  const pale = '#7d837f';
  const parts: PartInput[] = [
    {
      geo: lathe([[0.006, -0.95], [0.08, -0.8], [0.2, -0.5], [0.26, -0.1], [0.22, 0.34], [0.14, 0.66], [0.06, 0.82]], 14, lod),
      color: body,
      sy: 0.92,
    },
    // Right-whale callosities read as pale lumps on the head.
    { geo: ball(0.03, 5, lod), color: pale, y: 0.055, z: 0.63, sx: 1.4, sy: 0.5, sz: 1 },
    { geo: ball(0.022, 5, lod), color: pale, y: 0.07, z: 0.55, x: 0.05, sx: 1.2, sy: 0.4, sz: 1 },
    // Wide flukes.
    { geo: box(0.6, 0.02, 0.16), color: '#333c45', z: -0.97, part: PART.tail, pivot: [0, 0, -0.82], axis: [0, 1, 0], weight: 0.36, freq: 2.6 },
    // Pectoral fins.
    { geo: box(0.24, 0.018, 0.09), color: '#343d47', x: 0.2, y: -0.08, z: 0.2, rz: -0.35, ry: -0.2 },
    { geo: box(0.24, 0.018, 0.09), color: '#343d47', x: -0.2, y: -0.08, z: 0.2, rz: 0.35, ry: 0.2 },
  ];
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(eyePair({ x: 0.19, y: -0.02, z: 0.55, radius: 0.016, lod }), assembled)
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.28,
    metalness: 0.12,
    wet: true,
  };
}

function buildGemsbok(lod: SpeciesLod): SpeciesBuild {
  const tan = '#b7a184';
  const white = '#ece7da';
  const dark = '#3d332a';
  const headPivot: [number, number, number] = [0, 0.36, 0.32];
  const parts: PartInput[] = [
    { geo: ball(0.11, 9, lod), color: tan, y: 0.3, z: 0, sx: 0.86, sy: 0.9, sz: 1.9 },
    // Pale flank band.
    { geo: ball(0.08, 7, lod), color: white, y: 0.27, z: -0.02, sx: 0.9, sy: 0.9, sz: 1.7 },
    // Neck and head.
    { geo: cone(0.055, 0.24, 7, lod), color: tan, y: 0.39, z: 0.24, rx: 0.52, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.24, freq: 1.1 },
    { geo: box(0.09, 0.09, 0.17), color: white, y: 0.44, z: 0.34, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.24, freq: 1.1 },
    { geo: box(0.072, 0.028, 0.12), color: dark, y: 0.42, z: 0.365, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.24, freq: 1.1 },
    // The long straight horns: the defining silhouette cue.
    { geo: cone(0.016, 0.42, 6, lod), color: '#2f2a25', x: 0.032, y: 0.63, z: 0.32, rx: -0.34, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.24, freq: 1.1 },
    { geo: cone(0.016, 0.42, 6, lod), color: '#2f2a25', x: -0.032, y: 0.63, z: 0.32, rx: -0.34, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.24, freq: 1.1 },
    // Tail.
    { geo: box(0.02, 0.12, 0.02), color: dark, y: 0.3, z: -0.22, part: PART.tail, pivot: [0, 0.36, -0.2], axis: [0, 0, 1], weight: 0.5, freq: 2.2 },
  ];
  // Four legs, diagonal pairs share a phase offset.
  const legs: Array<[number, number, number, number]> = [
    [0.06, 0.17, 1, 0],
    [-0.06, 0.17, 1, Math.PI],
    [0.06, -0.17, -1, Math.PI],
    [-0.06, -0.17, -1, 0],
  ];
  for (const [x, z, side, phase] of legs) {
    parts.push({
      geo: box(0.035, 0.3, 0.04),
      color: '#8d7a63',
      x,
      y: 0.15,
      z,
      part: side > 0 ? PART.legL : PART.legR,
      pivot: [x, 0.3, z],
      axis: [1, 0, 0],
      weight: 0.34,
      freq: 5.6,
      phase,
    });
  }
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(
          eyePair({ x: 0.043, y: 0.455, z: 0.39, radius: 0.011, pivot: headPivot, weight: 0.24, freq: 1.1, lod }),
          assembled
        )
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.7,
    metalness: 0,
  };
}

function buildMeerkat(lod: SpeciesLod): SpeciesBuild {
  const fur = '#bca483';
  const dark = '#6d5a45';
  const headPivot: [number, number, number] = [0, 0.29, 0.02];
  const parts: PartInput[] = [
    { geo: lathe([[0.02, 0], [0.06, 0.08], [0.065, 0.2], [0.035, 0.27]], 9, lod, true), color: fur },
    { geo: ball(0.055, 8, lod), color: fur, y: 0.3, z: 0.02, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.22, freq: 1.3 },
    // Muzzle and dark eye mask.
    { geo: box(0.04, 0.03, 0.05), color: '#e7dcc9', y: 0.29, z: 0.07, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.22, freq: 1.3 },
    { geo: box(0.062, 0.022, 0.02), color: dark, y: 0.315, z: 0.055, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.22, freq: 1.3 },
    { geo: ball(0.016, 5, lod), color: fur, x: 0.045, y: 0.325, z: 0, sx: 0.5, sy: 1, sz: 1, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.22, freq: 1.3 },
    { geo: ball(0.016, 5, lod), color: fur, x: -0.045, y: 0.325, z: 0, sx: 0.5, sy: 1, sz: 1, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.22, freq: 1.3 },
    // Tail held up like a sentry.
    { geo: box(0.018, 0.16, 0.018), color: dark, y: 0.1, z: -0.075, rx: 0.5, part: PART.tail, pivot: [0, 0.02, -0.05], axis: [1, 0, 0], weight: 0.3, freq: 1.6 },
    // Front legs tucked.
    { geo: box(0.022, 0.12, 0.026), color: fur, x: 0.035, y: 0.12, z: 0.03 },
    { geo: box(0.022, 0.12, 0.026), color: fur, x: -0.035, y: 0.12, z: 0.03 },
  ];
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(
          eyePair({ x: 0.033, y: 0.31, z: 0.058, radius: 0.009, pivot: headPivot, weight: 0.22, freq: 1.3, lod }),
          assembled
        )
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.82,
    metalness: 0,
  };
}

function buildVulture(lod: SpeciesLod): SpeciesBuild {
  const body = '#4a4038';
  const wing = '#3b332d';
  const headPivot: [number, number, number] = [0, 0.03, 0.12];
  const parts: PartInput[] = [
    { geo: ball(0.1, 9, lod), color: body, sx: 1, sy: 0.95, sz: 1.9 },
    { geo: ball(0.04, 7, lod), color: '#b9a08a', y: 0.03, z: 0.2, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.08, freq: 1 },
    { geo: cone(0.018, 0.07, 6, lod), color: '#2c2622', y: 0.02, z: 0.255, rx: Math.PI / 2, part: PART.head, pivot: headPivot, axis: [1, 0, 0], weight: 0.08, freq: 1 },
    // Long broad wings with separated wingtip cards.
    { geo: box(0.62, 0.008, 0.2), color: wing, x: 0.36, y: 0.03, z: 0.02, part: PART.wingL, pivot: [0.06, 0.03, 0.02], axis: [0, 0, 1], weight: 0.85, freq: 4.4 },
    { geo: box(0.18, 0.008, 0.12), color: '#332c26', x: 0.72, y: 0.03, z: -0.01, rz: 0.06, part: PART.wingL, pivot: [0.06, 0.03, 0.02], axis: [0, 0, 1], weight: 0.85, freq: 4.4 },
    { geo: box(0.62, 0.008, 0.2), color: wing, x: -0.36, y: 0.03, z: 0.02, part: PART.wingR, pivot: [-0.06, 0.03, 0.02], axis: [0, 0, 1], weight: -0.85, freq: 4.4 },
    { geo: box(0.18, 0.008, 0.12), color: '#332c26', x: -0.72, y: 0.03, z: -0.01, rz: -0.06, part: PART.wingR, pivot: [-0.06, 0.03, 0.02], axis: [0, 0, 1], weight: -0.85, freq: 4.4 },
    // Fanned tail.
    { geo: box(0.17, 0.008, 0.17), color: '#3b332d', z: -0.26, part: PART.tail, pivot: [0, 0, -0.17], axis: [0, 0, 1], weight: 0.16, freq: 2.6 },
  ];
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(
          eyePair({ x: 0.028, y: 0.045, z: 0.21, radius: 0.009, pivot: headPivot, weight: 0.08, lod }),
          assembled
        )
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.68,
    metalness: 0,
  };
}

function buildButterfly(): SpeciesBuild {
  const orange = '#d9822b';
  const black = '#33291f';
  const wingGeos: PartInput[] = [];
  for (const side of [-1, 1]) {
    wingGeos.push({
      geo: box(0.09, 0.003, 0.08),
      color: orange,
      x: side * 0.045,
      z: 0,
      part: side > 0 ? PART.wingL : PART.wingR,
      pivot: [0, 0, 0],
      axis: [0, 0, 1],
      weight: side > 0 ? 1.5 : -1.5,
      freq: 13,
    });
    wingGeos.push({
      geo: box(0.055, 0.003, 0.05),
      color: black,
      x: side * 0.075,
      z: -0.035,
      rz: side * 0.3,
      part: side > 0 ? PART.wingL : PART.wingR,
      pivot: [0, 0, 0],
      axis: [0, 0, 1],
      weight: side > 0 ? 1.5 : -1.5,
      freq: 13,
    });
  }
  const assembled = assembleParts([
    { geo: box(0.012, 0.012, 0.075), color: black },
    ...wingGeos,
  ]);
  return {
    body: assembled.geometry,
    eyes: null,
    triangles: assembled.triangles,
    eyeTriangles: 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.5,
    metalness: 0,
  };
}

function buildBat(lod: SpeciesLod): SpeciesBuild {
  const fur = '#3a332c';
  const membrane = '#4a3f36';
  const parts: PartInput[] = [
    { geo: ball(0.045, 7, lod), color: fur, sy: 0.9, sz: 1.5 },
    { geo: ball(0.026, 6, lod), color: fur, y: 0.01, z: 0.06 },
    { geo: cone(0.008, 0.03, 4, lod), color: fur, x: 0.015, y: 0.04, z: 0.06, rz: -0.2 },
    { geo: cone(0.008, 0.03, 4, lod), color: fur, x: -0.015, y: 0.04, z: 0.06, rz: 0.2 },
  ];
  for (const side of [-1, 1]) {
    parts.push({
      geo: box(0.11, 0.003, 0.075),
      color: membrane,
      x: side * 0.06,
      part: side > 0 ? PART.wingL : PART.wingR,
      pivot: [0, 0.01, 0],
      axis: [0, 0, 1],
      weight: side > 0 ? 1.25 : -1.25,
      freq: 12,
    });
    parts.push({
      geo: box(0.05, 0.003, 0.05),
      color: membrane,
      x: side * 0.13,
      z: -0.02,
      part: side > 0 ? PART.wingL : PART.wingR,
      pivot: [0, 0.01, 0],
      axis: [0, 0, 1],
      weight: side > 0 ? 1.25 : -1.25,
      freq: 12,
      phase: -0.5,
    });
  }
  const assembled = assembleParts(parts);
  const eyes =
    lod < 2
      ? assembleParts(eyePair({ x: 0.018, y: 0.012, z: 0.082, radius: 0.007, lod }), assembled)
      : null;
  return {
    body: assembled.geometry,
    eyes: eyes?.geometry ?? null,
    triangles: assembled.triangles + (eyes?.triangles ?? 0),
    eyeTriangles: eyes?.triangles ?? 0,
    height: assembled.height,
    length: assembled.length,
    roughness: 0.7,
    metalness: 0,
  };
}

export const SPECIES: Readonly<Record<SpeciesId, SpeciesDefinition>> = {
  gull: { id: 'gull', label: 'Kelp gull', animation: 'flap', build: buildGull },
  penguin: { id: 'penguin', label: 'African penguin', animation: 'parts', build: buildPenguin },
  fish: { id: 'fish', label: 'Shoal fish', animation: 'spine', build: buildFish },
  dolphin: { id: 'dolphin', label: 'Bottlenose dolphin', animation: 'spine', build: buildDolphin },
  whale: { id: 'whale', label: 'Southern right whale', animation: 'spine', build: buildWhale },
  gemsbok: { id: 'gemsbok', label: 'Gemsbok', animation: 'parts', build: buildGemsbok },
  meerkat: { id: 'meerkat', label: 'Meerkat', animation: 'parts', build: buildMeerkat },
  vulture: { id: 'vulture', label: 'Cape vulture', animation: 'flap', build: buildVulture },
  butterfly: { id: 'butterfly', label: 'Butterfly', animation: 'flap', build: buildButterfly },
  bat: { id: 'bat', label: 'Bat', animation: 'flap', build: buildBat },
};

export const SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];

const buildCache = new Map<string, SpeciesBuild>();

/** Build (once) and share the geometry for a species at the requested LOD. */
export function getSpeciesBuild(id: SpeciesId, lod: SpeciesLod = 0): SpeciesBuild {
  const key = `${id}:${lod}`;
  let build = buildCache.get(key);
  if (!build) {
    build = SPECIES[id].build(lod);
    buildCache.set(key, build);
  }
  return build;
}
