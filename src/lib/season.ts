/**
 * Southern-hemisphere season weights derived from a calendar month.
 *
 * These drive the smooth foliage/terrain colour transition in the 3D scene.
 * The weights are deliberately continuous so changing the month in the
 * WeatherWidget eases between looks rather than snapping between them.
 */
export interface SeasonWeights {
  /** Peak summer warmth (1 in January, 0 in July). */
  warmth: number;
  /** Autumn/golden influence (peaks around April). */
  autumn: number;
  /** Spring/fresh-growth influence (peaks around October). */
  spring: number;
}

export function monthToSeasonWeights(month: number): SeasonWeights {
  const clamped = Math.max(1, Math.min(12, Number.isFinite(month) ? month : 1));
  const angle = ((clamped - 1) / 12) * Math.PI * 2;
  return {
    warmth: (Math.cos(angle) + 1) * 0.5,
    autumn: Math.max(0, Math.sin(angle)),
    spring: Math.max(0, -Math.sin(angle)),
  };
}
