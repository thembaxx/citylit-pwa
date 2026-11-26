export type TerrainTangent = readonly [x: number, y: number, z: number];
export type TerrainNormal = readonly [x: number, y: number, z: number];

/**
 * Compute an upward-facing surface normal from the actual world-space grid
 * tangents. This remains correct when a normalized terrain grid is warped into
 * a chamfered or curved plinth footprint.
 */
export function terrainNormalFromTangents(
  alongX: TerrainTangent,
  alongZ: TerrainTangent
): TerrainNormal {
  const [ix, iy, iz] = alongX;
  const [zx, zy, zz] = alongZ;

  // alongZ × alongX preserves an upward normal for the terrain grid winding.
  let nx = zy * iz - zz * iy;
  let ny = zz * ix - zx * iz;
  let nz = zx * iy - zy * ix;
  const length = Math.hypot(nx, ny, nz);

  if (!Number.isFinite(length) || length < 1e-10 || ny < 0) return [0, 1, 0];
  nx /= length;
  ny /= length;
  nz /= length;
  return [nx, ny, nz];
}
