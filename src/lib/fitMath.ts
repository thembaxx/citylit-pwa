/**
 * Pure fit/clamp maths shared by diorama framing and the stand.
 *
 * The stand's size and silhouette live in standFootprint.ts. These aliases
 * keep existing callers working and always match it, so the plate, the block
 * and the fit can't drift apart.
 */
import {
  defaultStandPolygon,
  insetStandPolygon,
  pointInStandPolygon,
  STAND_HALF,
  STAND_INNER_HALF,
  STAND_MARGIN,
  standPolygonBounds,
  type StandPolygon,
} from './standFootprint.ts';

export const PLINTH_HALF_EXTENT = STAND_HALF;
export const PLINTH_FRAME_WIDTH = 0.06;
export const PLINTH_INNER_HALF_EXTENT = STAND_INNER_HALF;

export interface PlanarBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

export interface PlinthFit {
  /** Uniform scale, never greater than 1, that keeps the original scale for small dioramas. */
  readonly scale: number;
  /** Translation that centres the scaled footprint on the plinth. */
  readonly offsetX: number;
  readonly offsetZ: number;
  /** Remaining half-extents after scaling, useful for assertions and debug overlays. */
  readonly halfX: number;
  readonly halfZ: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** The stand's usable inner boundary: the square stand shrunk by its margin. */
export function innerStandPolygon(half: number = STAND_HALF): StandPolygon {
  return insetStandPolygon(defaultStandPolygon(half), STAND_MARGIN);
}

/**
 * True when the four corners of a centred footprint sit inside a stand
 * polygon. The stand silhouettes are convex enough that a footprint whose
 * corners are inside is inside in full.
 */
function footprintInsidePolygon(
  bounds: PlanarBounds,
  scale: number,
  polygon: StandPolygon
): boolean {
  const hx = Math.max(0, (bounds.maxX - bounds.minX) * 0.5) * scale;
  const hz = Math.max(0, (bounds.maxZ - bounds.minZ) * 0.5) * scale;
  return (
    pointInStandPolygon(hx, hz, polygon) &&
    pointInStandPolygon(-hx, hz, polygon) &&
    pointInStandPolygon(hx, -hz, polygon) &&
    pointInStandPolygon(-hx, -hz, polygon)
  );
}

/** Largest scale ≤ `maxScale` whose centred footprint still fits the polygon. */
function shrinkToPolygon(
  bounds: PlanarBounds,
  polygon: StandPolygon,
  maxScale: number
): number {
  let lo = 0;
  let hi = maxScale;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) * 0.5;
    if (footprintInsidePolygon(bounds, mid, polygon)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * Fit an X/Z footprint inside a stand's footprint.
 *
 * The fit is centre-preserving: it scales down only when needed and returns
 * the offset that brings the scaled centre back onto the stand's origin. It
 * honours the stand's actual silhouette, so content cannot spill past a
 * chamfered pilot corner even though its bounding square would fit.
 */
export function fitBoundsToStand(
  bounds: PlanarBounds,
  polygon: StandPolygon,
  margin = 0.12
): PlinthFit {
  const b = standPolygonBounds(polygon);
  const usableX = Math.max(0.01, (b.maxX - b.minX) * 0.5 - Math.max(0, margin));
  const usableZ = Math.max(0.01, (b.maxZ - b.minZ) * 0.5 - Math.max(0, margin));
  const rawHalfX = Math.max(0, (bounds.maxX - bounds.minX) * 0.5);
  const rawHalfZ = Math.max(0, (bounds.maxZ - bounds.minZ) * 0.5);
  let scale = Math.min(
    1,
    rawHalfX > 1e-6 ? usableX / rawHalfX : 1,
    rawHalfZ > 1e-6 ? usableZ / rawHalfZ : 1
  );
  if (scale > 0 && !footprintInsidePolygon(bounds, scale, polygon)) {
    scale = shrinkToPolygon(bounds, polygon, scale);
  }
  const centreX = (bounds.minX + bounds.maxX) * 0.5;
  const centreZ = (bounds.minZ + bounds.maxZ) * 0.5;
  const offsetX = -centreX * scale;
  const offsetZ = -centreZ * scale;
  return {
    scale,
    offsetX: Math.abs(offsetX) < 1e-9 ? 0 : offsetX,
    offsetZ: Math.abs(offsetZ) < 1e-9 ? 0 : offsetZ,
    halfX: rawHalfX * scale,
    halfZ: rawHalfZ * scale,
  };
}

/**
 * Fit an X/Z footprint inside the stand's inner square. Kept for callers that
 * only know about the square stand; the polygon-aware `fitBoundsToStand` is
 * what the engine uses.
 */
export function fitBoundsToPlinth(
  bounds: PlanarBounds,
  margin = 0.12,
  halfExtent = PLINTH_INNER_HALF_EXTENT
): PlinthFit {
  const polygon = insetStandPolygon(defaultStandPolygon(halfExtent), 0);
  const b = standPolygonBounds(polygon);
  const usable = Math.max(0.01, Math.min(b.maxX - b.minX, b.maxZ - b.minZ) * 0.5 - Math.max(0, margin));
  const rawHalfX = Math.max(0, (bounds.maxX - bounds.minX) * 0.5);
  const rawHalfZ = Math.max(0, (bounds.maxZ - bounds.minZ) * 0.5);
  const scale = Math.min(
    1,
    rawHalfX > 1e-6 ? usable / rawHalfX : 1,
    rawHalfZ > 1e-6 ? usable / rawHalfZ : 1
  );
  const centreX = (bounds.minX + bounds.maxX) * 0.5;
  const centreZ = (bounds.minZ + bounds.maxZ) * 0.5;
  const offsetX = -centreX * scale;
  const offsetZ = -centreZ * scale;
  return {
    scale,
    offsetX: Math.abs(offsetX) < 1e-9 ? 0 : offsetX,
    offsetZ: Math.abs(offsetZ) < 1e-9 ? 0 : offsetZ,
    halfX: rawHalfX * scale,
    halfZ: rawHalfZ * scale,
  };
}

/** True when a centred footprint still fits within the plinth rim. */
export function boundsFitPlinth(
  bounds: PlanarBounds,
  margin = 0.12,
  halfExtent = PLINTH_INNER_HALF_EXTENT
): boolean {
  const fit = fitBoundsToPlinth(bounds, margin, halfExtent);
  return fit.scale > 0.999;
}

/** True when a centred footprint already sits inside a stand silhouette. */
export function boundsFitStand(
  bounds: PlanarBounds,
  polygon: StandPolygon,
  margin = 0.12
): boolean {
  const fit = fitBoundsToStand(bounds, polygon, margin);
  return fit.scale > 0.999;
}
