/**
 * Streetlamp light sources.
 *
 * Landmark builders record where their most representative lamp fixtures sit;
 * the engine owns one fixed-size pool of point lights for the whole session and
 * anchors that pool to the active landmark. Keeping the pool in the scene means
 * the renderer's point-light count is constant, so swapping between a
 * lamp-heavy diorama and one with no lamps never changes the lighting defines
 * and never forces materials to recompile.
 *
 * The pool only illuminates while the sun is below the horizon. Each fixture
 * also carries a small photocell offset so lamps switch over a spread of
 * minutes rather than all at once, and each biome gets its own lamp colour
 * temperature (sodium-amber city, mercury-blue coast, warm bushveld).
 */
import * as THREE from 'three';
import type { LandmarkBiome } from '../types/citylit';

/**
 * Mirrors the engine's sun path (`weatherScene`): the sun rises at 06:00,
 * peaks at noon and sets at 18:00.
 */
export function sunAltitudeDeg(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  const alt = Math.sin(((h - 6) * Math.PI) / 12);
  return Math.asin(Math.max(-1, Math.min(1, alt))) * (180 / Math.PI);
}

/**
 * 0 while the sun is on or above the horizon, rising to 1 once it has sunk
 * about 7° below it. `offsetHours` shifts the curve per fixture (photocell).
 */
export function streetLampNightFactor(hour: number, offsetHours = 0): number {
  return THREE.MathUtils.smoothstep(-sunAltitudeDeg(hour + offsetHours), 0.6, 7);
}

/** Lamp colour temperatures by biome: sodium city, mercury coast, warm bush. */
const LAMP_TINT: Partial<Record<LandmarkBiome, string>> = {
  urban: '#ffb35c',
  coastal: '#cfe6ff',
  wetland: '#ffe0b0',
  mountain: '#eaf3ff',
  waterfall: '#eaf3ff',
  desert: '#ffd7a0',
  savannah: '#ffd79a',
};

export function lampTintForBiome(biome: LandmarkBiome | string | undefined): string {
  if (!biome) return '#ffd280';
  return LAMP_TINT[biome as LandmarkBiome] ?? '#ffd280';
}

/** A promoted lamp fixture, in the local space of the group that owns it. */
export interface StreetLampAnchor {
  x: number;
  y: number;
  z: number;
  color: THREE.ColorRepresentation;
  /** Candela at full night. */
  intensity: number;
  /** Point-light falloff radius in scene units. */
  distance: number;
  /** Per-fixture photocell offset in hours (may be negative). */
  offset: number;
}

/** Real lights are the expensive part of a forward renderer, so cap the pool. */
export const STREET_LAMP_POOL_SIZE = 4;

/**
 * Create the fixed pool once. The lights stay in the scene for the lifetime of
 * the engine at zero intensity, so NUM_POINT_LIGHTS never changes at runtime.
 */
export function createStreetLampPool(
  parent: THREE.Object3D,
  count = STREET_LAMP_POOL_SIZE
): THREE.PointLight[] {
  const pool: THREE.PointLight[] = [];
  for (let i = 0; i < count; i++) {
    const light = new THREE.PointLight('#ffd280', 0, 4, 2);
    light.castShadow = false;
    light.userData.streetLampLight = true;
    parent.add(light);
    pool.push(light);
  }
  return pool;
}

/**
 * Gather every lamp anchor under a landmark group, expressed in that group's
 * local space so the engine can place the pool through the hero transform each
 * frame. Called once per landmark switch.
 */
export function collectStreetLampAnchors(
  root: THREE.Object3D | null | undefined
): StreetLampAnchor[] {
  if (!root) return [];
  root.updateWorldMatrix(true, true);
  const invRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const relative = new THREE.Matrix4();
  const point = new THREE.Vector3();
  const anchors: StreetLampAnchor[] = [];
  root.traverse((obj) => {
    const list = obj.userData.streetLampAnchors as StreetLampAnchor[] | undefined;
    if (!list || list.length === 0) return;
    relative.multiplyMatrices(invRoot, obj.matrixWorld);
    for (const anchor of list) {
      point.set(anchor.x, anchor.y, anchor.z).applyMatrix4(relative);
      anchors.push({ ...anchor, x: point.x, y: point.y, z: point.z });
    }
  });
  return anchors;
}
