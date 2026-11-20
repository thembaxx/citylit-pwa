import * as THREE from 'three';

export const GLOBE_RADIUS = 5;

/** Geographic coordinate → point on a sphere (y is up, longitude offset by 180°). */
export function latLonToVec3(lat: number, lon: number, radius = GLOBE_RADIUS): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Ray-casting containment test for a flat, [lon, lat, lon, lat, …] ring. */
export function pointInPoly(x: number, y: number, poly: readonly number[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i];
    const yi = poly[i + 1];
    const xj = poly[j];
    const yj = poly[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Spherical interpolation between two unit vectors, returned as a unit vector. */
export function slerpDirection(
  from: THREE.Vector3,
  to: THREE.Vector3,
  t: number
): THREE.Vector3 {
  const angle = from.angleTo(to);
  if (angle < 1e-4) return to.clone();
  const sin = Math.sin(angle);
  return from
    .clone()
    .multiplyScalar(Math.sin((1 - t) * angle) / sin)
    .add(to.clone().multiplyScalar(Math.sin(t * angle) / sin))
    .normalize();
}

/** Deterministic PRNG so generated detail (e.g. starfield) is stable across reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fraction of a province's landmarks that have been visited (0 when none exist). */
export function provinceVisitRatio(
  provinceName: string,
  landmarks: readonly { c: string }[],
  visited: ReadonlySet<number>
): number {
  const indices: number[] = [];
  landmarks.forEach((lm, i) => {
    if (lm.c.includes(provinceName)) indices.push(i);
  });
  if (!indices.length) return 0;
  return indices.filter((i) => visited.has(i)).length / indices.length;
}
