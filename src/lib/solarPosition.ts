/**
 * Physical solar direction for scene visuals.
 *
 * Scene axes: X = east, Y = up, Z = south (so north is -Z, matching
 * `src/types/citylit.ts`). All angles are degrees and the module has no THREE
 * dependency, so it can be unit tested on its own.
 *
 * This is intentionally separate from the lamp/window schedule arc in
 * `streetLights.ts` — that curve is a day/night cue, not an ephemeris.
 */

const DEG = Math.PI / 180;
const MAX_DECLINATION_DEG = 23.44;
const YEAR_DAYS = 365;
/** Approximate mid-month day-of-year for a non-leap year, indexed by month - 1. */
const MID_MONTH_DAY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349] as const;

/**
 * Solar declination in degrees (negative in December, positive in June), using
 * Cooper's mid-month approximation. Out-of-range months clamp like
 * `monthToSeasonWeights`.
 */
export function solarDeclination(month: number): number {
  const m = Math.max(1, Math.min(12, Number.isFinite(month) ? Math.trunc(month) : 1));
  const day = MID_MONTH_DAY[m - 1];
  return MAX_DECLINATION_DEG * Math.sin((360 * (284 + day) * DEG) / YEAR_DAYS);
}

/**
 * Normalized direction from the site toward the physical sun. Morning is +X
 * (east), afternoon -X (west); solar noon leans north (-Z) for southern sites.
 * The returned tuple is the only allocation.
 */
export function southernSunDirection(
  hour: number,
  latitude: number,
  month: number
): readonly [x: number, y: number, z: number] {
  const h = Number.isFinite(hour) ? ((hour % 24) + 24) % 24 : 12;
  const lat = Math.max(-90, Math.min(90, Number.isFinite(latitude) ? latitude : 0));
  const decl = solarDeclination(month) * DEG;
  const phi = lat * DEG;
  const hourAngle = (h - 12) * 15 * DEG;

  const sinDecl = Math.sin(decl);
  const cosDecl = Math.cos(decl);
  const sinLat = Math.sin(phi);
  const cosLat = Math.cos(phi);
  const sinH = Math.sin(hourAngle);
  const cosH = Math.cos(hourAngle);

  // Standard local east/north/up solar vector, with north flipped into -Z.
  const east = -cosDecl * sinH;
  const north = cosLat * sinDecl - sinLat * cosDecl * cosH;
  const up = sinLat * sinDecl + cosLat * cosDecl * cosH;
  const south = -north;

  const length = Math.hypot(east, up, south) || 1;
  return [east / length, up / length, south / length] as const;
}
