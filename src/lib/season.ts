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

/** Named foliage vocabulary shared by Places tree placements and the season gate. */
export type PlantSpecies = 'bush' | 'oak' | 'acacia' | 'quiver' | 'jacaranda';

export interface PlantSpeciesInfo {
  /** Human-readable label (used in info copy and tests). */
  readonly label: string;
  /** Southern-hemisphere months (1-12) when the species carries blossoms. */
  readonly bloomMonths: readonly number[];
  /** Canopy colour outside the bloom window. */
  readonly foliageColor: string;
}

export const PLANT_SPECIES: Readonly<Record<PlantSpecies, PlantSpeciesInfo>> = {
  bush: { label: 'Fynbos bush', bloomMonths: [], foliageColor: '#5d7a47' },
  oak: { label: 'Oak', bloomMonths: [], foliageColor: '#5d7b42' },
  acacia: { label: 'Acacia', bloomMonths: [], foliageColor: '#71894c' },
  quiver: { label: 'Quiver tree', bloomMonths: [], foliageColor: '#7d9450' },
  jacaranda: { label: 'Jacaranda', bloomMonths: [10, 11], foliageColor: '#5f7d43' },
};

/** Wrap any integer to a 1-12 calendar month. */
export function normalizeMonth(month: number): number {
  if (!Number.isFinite(month)) return 1;
  return ((((Math.floor(month) - 1) % 12) + 12) % 12) + 1;
}

let currentMonth: number | undefined;

/** Publish the engine's selected month so built slices can gate seasonal foliage. */
export function setSeasonMonth(month: number): void {
  currentMonth = Number.isFinite(month) ? normalizeMonth(month) : undefined;
}

/** Current published month; `undefined` means no gate has been applied yet. */
export function getSeasonMonth(): number | undefined {
  return currentMonth;
}

/**
 * True when a species shows blossoms in the given month. Species without a
 * bloom window never do; an unknown month errs on showing the blossoms so a
 * slice built before the first month event still reads as the reference look.
 */
export function isSpeciesBlooming(month: number | undefined, species: PlantSpecies): boolean {
  const months = PLANT_SPECIES[species]?.bloomMonths;
  if (!months?.length) return false;
  if (month === undefined || !Number.isFinite(month)) return true;
  const m = normalizeMonth(month);
  return months.some((candidate) => normalizeMonth(candidate) === m);
}
