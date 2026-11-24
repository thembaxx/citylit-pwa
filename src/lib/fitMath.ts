/**
 * Pure fit/clamp maths shared by diorama framing and the square plinth.
 *
 * The stand in CitylitEngine is a filled square with a half-extent of 8.52;
 * 8.46 keeps a small inset so fitted dioramas never touch its edge. Keeping
 * those numbers here makes the stand, bounds audit, and any future fit clamp
 * agree instead of drifting apart.
 */
export const PLINTH_HALF_EXTENT = 8.52;
export const PLINTH_FRAME_WIDTH = 0.06;
export const PLINTH_INNER_HALF_EXTENT = 8.46;

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

/**
 * Fit an X/Z footprint inside the plinth's inner square. The result is
 * centre-preserving: it scales down only when needed and returns the offset
 * that brings the scaled centre back to the plinth origin.
 */
export function fitBoundsToPlinth(
  bounds: PlanarBounds,
  margin = 0.12,
  halfExtent = PLINTH_INNER_HALF_EXTENT
): PlinthFit {
  const usable = Math.max(0.01, halfExtent - Math.max(0, margin));
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
