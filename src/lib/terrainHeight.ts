/** Create the canonical clamped height sampler shared by a terrain and its props. */
export function createTerrainHeightSampler(
  heightAt: (x: number, z: number) => number,
  baseY = 0,
  clearance = 0.08
): (x: number, z: number) => number {
  const floorBase = Number.isFinite(baseY) ? baseY : 0;
  const floor = floorBase + Math.max(0, Number.isFinite(clearance) ? clearance : 0);
  return (x, z) => {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return floor;
    const height = heightAt(x, z);
    return Number.isFinite(height) ? Math.max(floor, height) : floor;
  };
}

export interface TerrainSurfaceNormal {
  x: number;
  y: number;
  z: number;
}

export interface TriangulatedTerrainSampler {
  (x: number, z: number): number;
  normalAt(x: number, z: number): TerrainSurfaceNormal;
}

export interface TerrainGridSamplerOptions {
  halfExtent: number;
  segments: number;
  baseY?: number;
  clearance?: number;
}

/**
 * Sample the piecewise-planar surface formed by the terrain mesh's grid triangles.
 * This keeps props and roads on the visible surface between authored grid vertices.
 */
export function computeTerrainContactLift(
  positions: ArrayLike<number>,
  matrix: ArrayLike<number>,
  heightAt: (x: number, z: number) => number,
  clearance = 0.004
): number {
  if (positions.length < 3 || matrix.length < 16) return 0;
  const safeClearance = Number.isFinite(clearance) ? Math.max(0, clearance) : 0;
  let lift = 0;

  for (let i = 0; i + 2 < positions.length; i += 3) {
    const x =
      matrix[0] * positions[i] +
      matrix[4] * positions[i + 1] +
      matrix[8] * positions[i + 2] +
      matrix[12];
    const y =
      matrix[1] * positions[i] +
      matrix[5] * positions[i + 1] +
      matrix[9] * positions[i + 2] +
      matrix[13];
    const z =
      matrix[2] * positions[i] +
      matrix[6] * positions[i + 1] +
      matrix[10] * positions[i + 2] +
      matrix[14];
    const ground = heightAt(x, z);
    if (!Number.isFinite(ground) || !Number.isFinite(y)) continue;
    lift = Math.max(lift, ground + safeClearance - y);
  }

  return Math.max(0, lift);
}

export function createTriangulatedTerrainSampler(
  heightAt: (x: number, z: number) => number,
  options: TerrainGridSamplerOptions
): TriangulatedTerrainSampler {
  const halfExtent =
    Number.isFinite(options.halfExtent) && options.halfExtent > 0 ? options.halfExtent : 1.5;
  const segments = Number.isFinite(options.segments)
    ? Math.max(1, Math.floor(options.segments))
    : 1;
  const baseY = Number.isFinite(options.baseY) ? (options.baseY ?? 0) : 0;
  const clearance = Number.isFinite(options.clearance) ? Math.max(0, options.clearance ?? 0) : 0.08;
  const floor = baseY + clearance;
  const step = (2 * halfExtent) / segments;
  const stride = segments + 1;
  const heights = new Float32Array(stride * stride);
  const safeHeightAt = createTerrainHeightSampler(heightAt, baseY, clearance);

  for (let iz = 0; iz <= segments; iz++) {
    for (let ix = 0; ix <= segments; ix++) {
      heights[iz * stride + ix] = safeHeightAt(-halfExtent + ix * step, -halfExtent + iz * step);
    }
  }

  const gridCoords = (x: number, z: number) => {
    const gridX = (Math.max(-halfExtent, Math.min(halfExtent, x)) + halfExtent) / step;
    const gridZ = (Math.max(-halfExtent, Math.min(halfExtent, z)) + halfExtent) / step;
    const ix = Math.min(segments - 1, Math.floor(gridX));
    const iz = Math.min(segments - 1, Math.floor(gridZ));
    return { ix, iz, tx: gridX - ix, tz: gridZ - iz };
  };

  const sample: TriangulatedTerrainSampler = (x, z) => {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return floor;
    const { ix, iz, tx, tz } = gridCoords(x, z);
    const a = heights[iz * stride + ix];
    const b = heights[iz * stride + ix + 1];
    const c = heights[(iz + 1) * stride + ix];
    const d = heights[(iz + 1) * stride + ix + 1];

    if (tx + tz <= 1) return a + tx * (b - a) + tz * (c - a);
    return b * (1 - tz) + c * (1 - tx) + d * (tx + tz - 1);
  };

  sample.normalAt = (x, z) => {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return { x: 0, y: 1, z: 0 };
    const { ix, iz, tx, tz } = gridCoords(x, z);
    const a = heights[iz * stride + ix];
    const b = heights[iz * stride + ix + 1];
    const c = heights[(iz + 1) * stride + ix];
    const d = heights[(iz + 1) * stride + ix + 1];
    let dx: number;
    let dz: number;

    if (tx + tz <= 1) {
      dx = (b - a) / step;
      dz = (c - a) / step;
    } else {
      dx = (d - c) / step;
      dz = (d - b) / step;
    }

    const length = Math.hypot(dx, 1, dz);
    return { x: -dx / length, y: 1 / length, z: -dz / length };
  };

  return sample;
}
