/** A road control point authored above its local terrain surface. */
export interface RoadControlPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** A terrain-conformed point sampled along a road ribbon. */
export type RoadSample = RoadControlPoint;

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Samples a smooth road in plan view, then drapes its authored grade over the
 * terrain heightfield. Sampling the grade separately avoids the bridges and
 * floating sections that appear when a sparse 3D spline cuts across rolling ground.
 */
export function sampleRoadRibbon(
  points: readonly RoadControlPoint[],
  heightAt: (x: number, z: number) => number,
  segments = 38
): RoadSample[] {
  if (points.length < 2) return [];
  const count = Math.max(1, Math.floor(segments));
  const grades = points.map((point) => point.y - heightAt(point.x, point.z));
  const samples: RoadSample[] = [];

  for (let i = 0; i <= count; i++) {
    const progress = (i / count) * (points.length - 1);
    const segment = Math.min(points.length - 2, Math.floor(progress));
    const t = progress - segment;
    const p0 = points[Math.max(0, segment - 1)];
    const p1 = points[segment];
    const p2 = points[segment + 1];
    const p3 = points[Math.min(points.length - 1, segment + 2)];
    const x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
    const z = catmullRom(p0.z, p1.z, p2.z, p3.z, t);
    const grade = catmullRom(
      grades[Math.max(0, segment - 1)],
      grades[segment],
      grades[segment + 1],
      grades[Math.min(grades.length - 1, segment + 2)],
      t
    );
    samples.push({ x, y: heightAt(x, z) + grade, z });
  }

  return samples;
}
