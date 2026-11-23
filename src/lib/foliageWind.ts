/**
 * Pure weather-driven wind helpers for tree/foliage sway and daylight bird
 * activity gating, shared between CitylitEngine and unit tests.
 */

export function computeFoliageWindStrength(
  baseWind: number,
  storm: number,
  rain: number,
  timeSec: number,
  motionScale: number
): number {
  const safeBase = Number.isFinite(baseWind) ? Math.max(0, Math.min(4.2, baseWind)) : 0;
  const safeStorm = Number.isFinite(storm) ? Math.max(0, Math.min(1, storm)) : 0;
  const safeRain = Number.isFinite(rain) ? Math.max(0, Math.min(1, rain)) : 0;
  if (safeBase <= 0.001) return 0;

  if (motionScale <= 0) {
    // Keep a gentle settled posture under reduced motion without oscillating gusts.
    return Math.min(4.5, safeBase * 0.45);
  }

  const gustPrimary = Math.sin(timeSec * 0.62) * (0.14 + safeStorm * 0.18 + safeRain * 0.06);
  const gustSecondary = Math.sin(timeSec * 1.47 + 1.15) * (0.08 + safeStorm * 0.12);
  const gustEnvelope = Math.max(0.55, 1 + gustPrimary + gustSecondary);

  return Math.max(0, Math.min(4.5, safeBase * gustEnvelope));
}

export function computeFoliageSwayAngle(
  timeSec: number,
  phase: number,
  speed: number,
  baseAmp: number,
  windStrength: number,
  motionScale: number
): number {
  if (motionScale <= 0 || windStrength <= 0.001) return 0;
  const windFactor = 0.38 + Math.min(4.2, Math.max(0, windStrength)) * 0.46;
  const primary = Math.sin(timeSec * speed + phase);
  const harmonic = Math.sin(timeSec * (speed * 2.15) + phase * 1.7) * 0.24;
  return (primary + harmonic) * baseAmp * windFactor;
}

export function isDaylightForBirds(
  isNightHours: boolean,
  isStudio: boolean,
  rain: number,
  storm: number
): boolean {
  if (isNightHours || isStudio) return false;
  return storm < 0.55 && rain < 0.85;
}

export function computeBirdSpawnIntervalSec(wind: number, activeCount: number): number {
  if (activeCount <= 0) return 1.8;
  const safeWind = Math.max(0, Math.min(4, Number.isFinite(wind) ? wind : 1));
  const crowdDelay = Math.min(4, Math.max(0, activeCount)) * 0.85;
  return 2.6 + crowdDelay + safeWind * 0.35;
}
