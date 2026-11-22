/** Pure X/Z helpers for left-hand-traffic diorama routes. */

export interface PlanarVector {
  readonly x: number;
  readonly z: number;
}

/** Normalize a planar direction, returning null for a zero-length vector. */
export function normalizePlanar(x: number, z: number): PlanarVector | null {
  const len = Math.hypot(x, z);
  if (len < 1e-6) return null;
  return { x: x / len, z: z / len };
}

/**
 * Offset to the vehicle's left for the given heading. With Y up and the
 * scene's +X forward convention, left of +X is -Z (north).
 */
export function leftLaneOffset(
  forwardX: number,
  forwardZ: number,
  halfWidth: number
): PlanarVector {
  const dir = normalizePlanar(forwardX, forwardZ);
  if (!dir) return { x: 0, z: 0 };
  return { x: dir.z * halfWidth, z: -dir.x * halfWidth };
}

/** Yaw for a heading in the car() convention where local forward is +X. */
export function headingYaw(forwardX: number, forwardZ: number): number {
  const yaw = Math.atan2(-forwardZ, forwardX);
  return yaw < 0 ? yaw + Math.PI * 2 : yaw;
}
