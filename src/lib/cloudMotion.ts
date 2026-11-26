export interface CloudDrift {
  x: number;
  z: number;
}

/**
 * Small, looping advection for a cloud and its ground shadow. Wind sets the
 * dominant axis while a restrained cross-breeze keeps the motion from feeling mechanical.
 */
export function cloudDrift(
  elapsed: number,
  phase: number,
  wind: number,
  directionX: number,
  directionZ: number
): CloudDrift {
  const safeElapsed = Number.isFinite(elapsed) ? elapsed : 0;
  const safePhase = Number.isFinite(phase) ? phase : 0;
  const strength = Number.isFinite(wind) ? Math.max(0, Math.min(2, wind)) : 0;
  const directionLength = Math.hypot(directionX, directionZ);
  const dx =
    Number.isFinite(directionLength) && directionLength > 1e-4 ? directionX / directionLength : 1;
  const dz =
    Number.isFinite(directionLength) && directionLength > 1e-4 ? directionZ / directionLength : 0;
  const along =
    Math.sin(safeElapsed * (0.12 + strength * 0.04) + safePhase) * (0.03 + strength * 0.035);
  const across = Math.sin(safeElapsed * 0.07 + safePhase * 1.7) * (0.025 + strength * 0.01);

  return {
    x: dx * along - dz * across,
    z: dz * along + dx * across,
  };
}
