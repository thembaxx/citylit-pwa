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
