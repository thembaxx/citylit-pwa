/**
 * Single source of truth for the diorama stand's footprint.
 *
 * Every stand — the square estate block, the default top plate, the pilot
 * silhouettes and the fit maths — reads its half-extent from here, so the
 * terrain, the plate and the fitted content can no longer disagree.
 *
 * Three numbers matter:
 *
 *  - `STAND_HALF` is the outermost boundary of a stand. Nothing built for a
 *    landmark may extend past it, and the engine's stand plate sits exactly
 *    on it.
 *  - `STAND_MARGIN` is the clearance kept between fitted content and that
 *    boundary, so a diorama never touches the rim.
 *  - `STAND_EDGE_ALLOWANCE` is the strip of the boundary reserved for detail
 *    that bolts onto the stand (the pilot plinths' engraved nameplates), so
 *    the pilots can carry a nameplate and still stay inside the shared
 *    envelope.
 */

/** Half-width of the stand: the outer edge of the cut block and its top plate. */
export const STAND_HALF = 8.4;

/** Clearance kept clear of the outer edge, so fitted content never touches the rim. */
export const STAND_MARGIN = 0.06;

/** Largest half-extent that content may occupy. */
export const STAND_INNER_HALF = STAND_HALF - STAND_MARGIN;

/** Strip of the outer boundary reserved for detail that bolts onto the stand. */
export const STAND_EDGE_ALLOWANCE = 0.25;

/** Half-extent of a stand that carries bolted-on detail (the pilot plinths). */
export const STAND_DETAIL_HALF = STAND_HALF - STAND_EDGE_ALLOWANCE;

/**
 * Half-width of the cut block itself.
 *
 * The block's terrain-edge continuation veneer sits a hair outside it, so the
 * block plus its veneer reach exactly `STAND_HALF` and nothing reaches past.
 */
export const STAND_BLOCK_HALF = STAND_HALF - 0.015;

/** Shape of a stand's outer boundary. */
export type StandSilhouette = 'square' | 'coastal-cut' | 'terrace' | 'hex-chamfer';

/** A closed polygon of the stand's outer boundary, in world X/Z. */
export type StandPolygon = ReadonlyArray<readonly [number, number]>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  if (Math.abs(span) < 1e-6) return x >= edge1 ? 1 : 0;
  const t = clamp((x - edge0) / span, 0, 1);
  return t * t * (3 - 2 * t);
}

/** True when a planar point lies inside the stand, with an optional inset. */
export function standContains(x: number, z: number, inset = 0): boolean {
  const limit = STAND_HALF - inset;
  return Math.abs(x) <= limit && Math.abs(z) <= limit;
}

/**
 * Pulls a planar point back onto the stand, keeping `inset` clear of the edge.
 * Used for anything placed by sampling (vegetation, water, roads) so it can't
 * escape the cut block.
 */
export function clampToStand(x: number, z: number, inset = STAND_MARGIN): [number, number] {
  const limit = Math.max(0, STAND_HALF - inset);
  return [clamp(x, -limit, limit), clamp(z, -limit, limit)];
}

/**
 * Maps the normalized square domain `(u, v) in [-1, 1]^2` onto a stand
 * silhouette.
 *
 * The map is continuous and exact along `(u = ±1)` and `(v = ±1)`, so the
 * terrain top, the geological strata walls, the glass water cutaway walls and
 * the pedestal plate all share the exact perimeter with zero seams. The
 * silhouette only trims its own corners, so the half-extent of the result is
 * always exactly `half` on the edge midpoints.
 */
export function mapStandDomain(
  u: number,
  v: number,
  silhouette: StandSilhouette,
  half: number
): [number, number] {
  const safeHalf = Math.max(0, half);
  if (silhouette === 'square') {
    return [u * safeHalf, v * safeHalf];
  }

  const au = Math.abs(u);
  const av = Math.abs(v);
  const cheb = Math.max(au, av);

  if (silhouette === 'hex-chamfer') {
    // Bold chamfered octagonal footprint retaining flat front/back faces for nameplate
    const cornerCut = Math.max(0, au + av - 1.56);
    const shrink = 1 - cornerCut * 0.24;
    return [u * safeHalf * shrink, v * safeHalf * shrink];
  }

  if (silhouette === 'terrace') {
    // Gently bevelled architectural square with subtle organic earth trim
    const cornerCut = Math.max(0, au + av - 1.72);
    const shrink = 1 - cornerCut * 0.16;
    const micro =
      cheb > 0.88
        ? Math.sin(u * 5.2 + v * 3.7) * 0.055 * smoothstep(0.88, 1.0, cheb)
        : 0;
    return [u * safeHalf * shrink + micro * Math.sign(u || 1), v * safeHalf * shrink];
  }

  // 'coastal-cut': gently rounded headland corners on the granite west/north
  // flanks and a crisp False Bay bay-slice chamfer along the ocean edge.
  const cornerCut = Math.max(0, au + av - 1.66);
  let shrink = 1 - cornerCut * 0.19;
  if (u > 0.2 && v > 0.15) {
    // Subtle seaward curve on the False Bay aquarium edge
    const bayT = smoothstep(0.2, 1.0, Math.max(u, v));
    shrink -= 0.032 * bayT * Math.sin(clamp((u + v) * 0.9, 0, Math.PI));
  }
  return [u * safeHalf * shrink, v * safeHalf * shrink];
}

/**
 * Generates an ordered closed polygon along the outer boundary of a stand
 * silhouette (for building matching engine pedestal plates & bevel collars).
 */
export function getStandOutlinePoints(
  silhouette: StandSilhouette,
  half: number,
  segmentsPerEdge = 14
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const step = Math.max(2, segmentsPerEdge);
  // Bottom edge (v = +1, u: -1 -> +1)
  for (let i = 0; i < step; i++) {
    pts.push(mapStandDomain(-1 + (2 * i) / step, 1, silhouette, half));
  }
  // Right edge (u = +1, v: +1 -> -1)
  for (let i = 0; i < step; i++) {
    pts.push(mapStandDomain(1, 1 - (2 * i) / step, silhouette, half));
  }
  // Top edge (v = -1, u: +1 -> -1)
  for (let i = 0; i < step; i++) {
    pts.push(mapStandDomain(1 - (2 * i) / step, -1, silhouette, half));
  }
  // Left edge (u = -1, v: -1 -> +1)
  for (let i = 0; i < step; i++) {
    pts.push(mapStandDomain(-1, -1 + (2 * i) / step, silhouette, half));
  }
  return pts;
}

/** The stand's outer boundary polygon for a silhouette. */
export function standPolygonFor(
  silhouette: StandSilhouette,
  half: number
): Array<[number, number]> {
  return getStandOutlinePoints(silhouette, half, 16);
}

/** The default square stand's boundary — the engine's own top plate. */
export function defaultStandPolygon(half: number = STAND_HALF): Array<[number, number]> {
  return [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
}

/**
 * Signed distance from a point to a stand polygon: negative when the point is
 * inside, positive when it is outside. A positive value is exactly how far
 * past the stand boundary the point sits, which is what the containment
 * audit reports.
 */
export function standPolygonOverflow(x: number, z: number, polygon: StandPolygon): number {
  const n = polygon.length;
  if (n < 3) return Number.POSITIVE_INFINITY;
  let best = Number.POSITIVE_INFINITY;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0];
    const zi = polygon[i][1];
    const xj = polygon[j][0];
    const zj = polygon[j][1];
    const dx = xj - xi;
    const dz = zj - zi;
    const lenSq = dx * dx + dz * dz;
    let t = lenSq > 0 ? ((x - xi) * dx + (z - zi) * dz) / lenSq : 0;
    t = clamp(t, 0, 1);
    const px = xi + t * dx;
    const pz = zi + t * dz;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) best = d;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside ? -best : best;
}

/** True when a planar point lies inside a stand polygon. */
export function pointInStandPolygon(x: number, z: number, polygon: StandPolygon): boolean {
  return standPolygonOverflow(x, z, polygon) <= 0;
}

/**
 * Shrinks a stand polygon toward its centre by `inset` units.
 *
 * The offset is applied to the polygon's half-extent rather than to each
 * edge, which is exact for the square silhouette (the common case) and
 * conservative — never larger than the footprint — for the chamfered pilot
 * silhouettes.
 */
export function insetStandPolygon(polygon: StandPolygon, inset: number): Array<[number, number]> {
  const bounds = standPolygonBounds(polygon);
  const halfExtent = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) * 0.5;
  if (inset <= 0 || halfExtent <= inset) {
    return polygon.map(([x, z]) => [x, z] as [number, number]);
  }
  const f = (halfExtent - inset) / halfExtent;
  return polygon.map(([x, z]) => [x * f, z * f] as [number, number]);
}

/** Axis-aligned bounds of a stand polygon. */
export function standPolygonBounds(polygon: StandPolygon): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  if (!Number.isFinite(minX)) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  return { minX, maxX, minZ, maxZ };
}
