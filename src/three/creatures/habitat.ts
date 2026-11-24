/**
 * Habitat table: the single data source for which creatures belong where.
 *
 * Adding a species means adding one entry here plus a builder in `species.ts`;
 * the engine, placement, budget manager and Lab never need editing. Pure module
 * (only a type-only import) so the table is unit-testable with `node --test`.
 */
import type { AnimalSeason } from '../builders/animalKit';
import type { LandmarkBiome } from '../../types/citylit';

export type TimeBand = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherBand = 'clear' | 'rain' | 'wind' | 'storm';
export type CreatureZone = 'ground' | 'air' | 'water';
export type CreatureAnimation = 'spine' | 'parts' | 'flap';

/** Species ids are stable keys shared by the table, builders and the Lab. */
export type SpeciesId =
  | 'gull'
  | 'penguin'
  | 'fish'
  | 'dolphin'
  | 'whale'
  | 'gemsbok'
  | 'meerkat'
  | 'vulture'
  | 'butterfly'
  | 'bat';

export interface HabitatEntry {
  species: SpeciesId;
  label: string;
  zone: CreatureZone;
  /** Primary animation path; species builders must support it. */
  animation: CreatureAnimation;
  biomes: readonly LandmarkBiome[];
  /** Optional month gate (southern hemisphere). */
  months?: readonly number[];
  /** Optional season gate, ANDed with months. */
  seasons?: readonly AnimalSeason[];
  /** Bands this species tolerates; omitted means all bands. */
  times?: readonly TimeBand[];
  /** Weather bands this species tolerates; omitted means all bands. */
  weather?: readonly WeatherBand[];
  /** Individuals at the High tier before the budget manager trims. */
  density: number;
  /** Uniform scale range, seeded per individual. */
  scale: readonly [number, number];
  /** How strongly this species competes for the instance budget. */
  priority: 'hero' | 'mid' | 'ambient';
  /** True for species that read as a single individual (whales, tortoises). */
  solitary?: boolean;
}

export interface HabitatConditions {
  biome: LandmarkBiome;
  month: number;
  hour: number;
  rain: number;
  wind: number;
  storm: number;
}

export const HABITATS: readonly HabitatEntry[] = [
  {
    species: 'gull',
    label: 'Kelp gulls',
    zone: 'air',
    animation: 'flap',
    biomes: ['coastal', 'wetland', 'urban', 'waterfall'],
    times: ['dawn', 'day', 'dusk'],
    weather: ['clear', 'wind', 'rain'],
    density: 10,
    scale: [0.8, 1.15],
    priority: 'mid',
  },
  {
    species: 'penguin',
    label: 'African penguins',
    zone: 'ground',
    animation: 'parts',
    biomes: ['coastal'],
    times: ['dawn', 'day', 'dusk'],
    density: 8,
    scale: [0.9, 1.1],
    priority: 'mid',
  },
  {
    species: 'fish',
    label: 'Shoal fish',
    zone: 'water',
    animation: 'spine',
    biomes: ['coastal', 'wetland', 'waterfall'],
    times: ['day', 'dusk'],
    density: 36,
    scale: [0.55, 1],
    priority: 'ambient',
  },
  {
    species: 'dolphin',
    label: 'Bottlenose dolphins',
    zone: 'water',
    animation: 'spine',
    biomes: ['coastal'],
    times: ['dawn', 'day'],
    weather: ['clear', 'wind'],
    density: 3,
    scale: [0.8, 1.1],
    priority: 'mid',
  },
  {
    species: 'whale',
    label: 'Southern right whales',
    zone: 'water',
    animation: 'spine',
    biomes: ['coastal'],
    months: [6, 7, 8, 9, 10],
    times: ['dawn', 'day', 'dusk'],
    density: 2,
    scale: [0.85, 1.05],
    priority: 'hero',
    solitary: true,
  },
  {
    species: 'gemsbok',
    label: 'Gemsbok',
    zone: 'ground',
    animation: 'parts',
    biomes: ['savannah', 'desert'],
    times: ['dawn', 'day', 'dusk'],
    density: 7,
    scale: [0.85, 1.15],
    priority: 'hero',
  },
  {
    species: 'meerkat',
    label: 'Meerkats',
    zone: 'ground',
    animation: 'parts',
    biomes: ['savannah', 'desert'],
    times: ['dawn', 'day'],
    weather: ['clear', 'wind'],
    density: 6,
    scale: [0.85, 1.1],
    priority: 'mid',
  },
  {
    species: 'vulture',
    label: 'Cape vultures',
    zone: 'air',
    animation: 'flap',
    biomes: ['savannah', 'mountain'],
    times: ['day', 'dusk'],
    weather: ['clear', 'wind'],
    density: 3,
    scale: [0.8, 1.2],
    priority: 'mid',
  },
  {
    species: 'butterfly',
    label: 'Garden butterflies',
    zone: 'air',
    animation: 'flap',
    biomes: ['savannah', 'wetland', 'urban', 'waterfall'],
    seasons: ['spring', 'summer'],
    times: ['day'],
    weather: ['clear'],
    density: 10,
    scale: [0.7, 1.2],
    priority: 'ambient',
  },
  {
    species: 'bat',
    label: 'Bats',
    zone: 'air',
    animation: 'flap',
    biomes: ['urban', 'wetland', 'savannah'],
    times: ['dusk', 'night'],
    weather: ['clear', 'wind'],
    density: 9,
    scale: [0.7, 1.1],
    priority: 'ambient',
  },
];

export function clampHour(hour: number): number {
  if (!Number.isFinite(hour)) return 12;
  return ((hour % 24) + 24) % 24;
}

/** Four bands matching the app's lighting presets closely enough. */
export function timeBandForHour(hour: number): TimeBand {
  const h = clampHour(hour);
  if (h >= 4.5 && h < 7) return 'dawn';
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 19.5) return 'dusk';
  return 'night';
}

export function weatherBandFor(rain: number, wind: number, storm: number): WeatherBand {
  const safeRain = Number.isFinite(rain) ? rain : 0;
  const safeWind = Number.isFinite(wind) ? wind : 0;
  const safeStorm = Number.isFinite(storm) ? storm : 0;
  if (safeStorm >= 0.55) return 'storm';
  if (safeRain >= 0.4) return 'rain';
  if (safeWind >= 2.4) return 'wind';
  return 'clear';
}

/** Southern-hemisphere season for a month, independent of animalKit's copy. */
export function habitatSeasonForMonth(month: number): AnimalSeason {
  const m = Number.isFinite(month) ? ((((Math.floor(month) - 1) % 12) + 12) % 12) + 1 : 1;
  if (m === 12 || m <= 2) return 'summer';
  if (m <= 5) return 'autumn';
  if (m <= 8) return 'winter';
  return 'spring';
}

function matchesList<T>(value: T, allowed: readonly T[] | undefined): boolean {
  return !allowed || allowed.length === 0 || allowed.includes(value);
}

/** Which species are active in these conditions, hero first. Deterministic. */
export function resolveHabitat(conditions: HabitatConditions): HabitatEntry[] {
  const band = timeBandForHour(conditions.hour);
  const weather = weatherBandFor(conditions.rain, conditions.wind, conditions.storm);
  const season = habitatSeasonForMonth(conditions.month);
  const month =
    Number.isFinite(conditions.month) ? ((((Math.floor(conditions.month) - 1) % 12) + 12) % 12) + 1 : 1;
  const rank: Record<HabitatEntry['priority'], number> = { hero: 0, mid: 1, ambient: 2 };
  const out: HabitatEntry[] = [];
  for (const entry of HABITATS) {
    if (!entry.biomes.includes(conditions.biome)) continue;
    if (entry.months && !entry.months.includes(month)) continue;
    if (entry.seasons && !entry.seasons.includes(season)) continue;
    if (!matchesList(band, entry.times)) continue;
    if (!matchesList(weather, entry.weather)) continue;
    out.push(entry);
  }
  // Stable sort: density desc, then priority, then table order for determinism.
  return out
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const p = rank[a.entry.priority] - rank[b.entry.priority];
      if (p !== 0) return p;
      const d = b.entry.density - a.entry.density;
      if (d !== 0) return d;
      return a.index - b.index;
    })
    .map(({ entry }) => entry);
}

export function habitatForSpecies(species: SpeciesId): HabitatEntry | undefined {
  return HABITATS.find((entry) => entry.species === species);
}
