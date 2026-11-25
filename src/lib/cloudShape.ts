const LOBES = [
  { x: 0.12, y: 0.62, rx: 0.14, ry: 0.25, weight: 0.72 },
  { x: 0.28, y: 0.47, rx: 0.18, ry: 0.33, weight: 0.78 },
  { x: 0.47, y: 0.39, rx: 0.2, ry: 0.37, weight: 0.82 },
  { x: 0.68, y: 0.48, rx: 0.19, ry: 0.32, weight: 0.76 },
  { x: 0.88, y: 0.63, rx: 0.13, ry: 0.23, weight: 0.68 },
] as const;

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * A deterministic, broad cumulus silhouette sampled in normalized UV space.
 * Values are smooth enough for a small alpha texture and deliberately fade
 * at the lower edge so adjacent cloud banks blend without circular sprite rims.
 */
export function sampleCloudDensity(u: number, v: number): number {
  if (u < 0 || u > 1 || v < 0 || v > 1) return 0;

  const baseRadius = Math.hypot((u - 0.5) / 0.49, (v - 0.72) / 0.23);
  let density = 0.56 * (1 - smoothstep(0.68, 1.1, baseRadius));

  for (let i = 0; i < LOBES.length; i++) {
    const lobe = LOBES[i];
    const dx = (u - lobe.x) / lobe.rx;
    const dy = (v - lobe.y) / lobe.ry;
    const radius = Math.hypot(dx, dy);
    const edgeWarp =
      Math.sin(u * (30 + i * 3) + v * 11 + i * 1.7) * 0.032 +
      Math.cos(v * (25 + i * 2) - u * 8 + i) * 0.024;
    density += lobe.weight * (1 - smoothstep(0.63, 1.12, radius + edgeWarp));
  }

  return Math.max(0, Math.min(1, density));
}

/** Convert density into a feathered alpha value with a clear but soft silhouette. */
export function cloudOpacity(density: number): number {
  return smoothstep(0.42, 0.92, Math.max(0, Math.min(1, density)));
}
