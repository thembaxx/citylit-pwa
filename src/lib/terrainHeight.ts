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
export function createTriangulatedTerrainSampler(
  heightAt: (x: number, z: number) => number,
  options: TerrainGridSamplerOptions
): (x: number, z: number) => number {
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

  return (x, z) => {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return floor;
    const gridX = (Math.max(-halfExtent, Math.min(halfExtent, x)) + halfExtent) / step;
    const gridZ = (Math.max(-halfExtent, Math.min(halfExtent, z)) + halfExtent) / step;
    const ix = Math.min(segments - 1, Math.floor(gridX));
    const iz = Math.min(segments - 1, Math.floor(gridZ));
    const tx = gridX - ix;
    const tz = gridZ - iz;
    const a = heights[iz * stride + ix];
    const b = heights[iz * stride + ix + 1];
    const c = heights[(iz + 1) * stride + ix];
    const d = heights[(iz + 1) * stride + ix + 1];

    if (tx + tz <= 1) return a + tx * (b - a) + tz * (c - a);
    return b * (1 - tz) + c * (1 - tx) + d * (tx + tz - 1);
  };
}
