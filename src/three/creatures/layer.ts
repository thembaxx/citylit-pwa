/**
 * Per-landmark creature layer.
 *
 * Resolves the habitat table for the landmark's biome and current conditions,
 * asks the budget manager for capacity hero-first, then places one instanced
 * field per species. The layer re-resolves when the time band, month, weather
 * band or quality tier changes, so a diorama built at noon does not keep
 * daytime species at midnight.
 *
 * Adding a species never touches this file: it is data in `habitat.ts` plus a
 * builder in `species.ts`.
 */
import * as THREE from 'three';
import { CreatureBudget, tierDensity, type CreatureTier } from './budget';
import { CREATURE_ENV } from './env';
import { CreatureField } from './field';
import {
  resolveHabitat,
  timeBandForHour,
  weatherBandFor,
  type CreatureZone,
  type HabitatEntry,
} from './habitat';
import { getSpeciesBuild } from './species';
import type { LandmarkBiome } from '../../types/citylit';

export interface CreatureLayerOptions {
  key: string;
  biome: LandmarkBiome;
  /** Optional override, defaults to the landmark key. */
  seed?: string | number;
  tier?: CreatureTier;
  /** For the Lab: build even a tier the engine would normally skip. */
  force?: boolean;
}

export interface CreatureLayerStats {
  instances: number;
  triangles: number;
  drawCalls: number;
  species: number;
  budgetUtilisation: number;
  tier: CreatureTier;
}

export interface CreatureLayer {
  group: THREE.Group;
  /** `dt` must already be motion-scaled, as the engine's landmark tick is. */
  update(dt: number, elapsed: number): void;
  setTier(tier: CreatureTier): void;
  stats(): CreatureLayerStats;
  dispose(): void;
}

/** Ring radii per zone, in diorama units. */
const ZONE_PLACEMENT: Record<CreatureZone, { inner: number; outer: number; y: number }> = {
  ground: { inner: 1.95, outer: 3.1, y: 0.02 },
  air: { inner: 1.75, outer: 3.2, y: 0.02 },
  water: { inner: 2.25, outer: 3.25, y: 0.06 },
};

/**
 * The hero is viewed from +X/+Z. Airborne silhouettes keep clear of that wedge
 * so they never mask the landmark; ground and water life may sit anywhere,
 * otherwise the near half of the ring (the only half the camera can see) would
 * be empty.
 */
const SIGHTLINE_ANGLE = Math.PI / 4;
const SIGHTLINE_HALF = 0.4;

export function createCreatureLayer(options: CreatureLayerOptions): CreatureLayer | null {
  // Software GL normally runs none of this. `force` exists for the dev Lab and
  // the `?creatures=on` capture override, never for a user setting.
  const force = Boolean(options.force);
  if (CREATURE_ENV.software && !force) return null;

  const group = new THREE.Group();
  group.name = `creatures:${options.key}`;
  const seedBase = options.seed ?? options.key;
  let fields: CreatureField[] = [];
  let budget = new CreatureBudget(options.tier ?? CREATURE_ENV.tier, false);
  let conditionsKey = '';
  let cached: CreatureLayerStats | null = null;

  const conditionKey = (): string => {
    const tier = CREATURE_ENV.tier;
    const band = timeBandForHour(CREATURE_ENV.hour);
    const weather = weatherBandFor(CREATURE_ENV.rain, CREATURE_ENV.wind, CREATURE_ENV.storm);
    const month = Number.isFinite(CREATURE_ENV.month) ? Math.floor(CREATURE_ENV.month) : 1;
    return `${options.biome}|${band}|${weather}|${month}|${tier}|${CREATURE_ENV.software}`;
  };

  const clearFields = (): void => {
    for (let i = 0; i < fields.length; i++) {
      group.remove(fields[i].group);
      fields[i].dispose();
    }
    fields = [];
  };

  const buildFields = (): void => {
    clearFields();
    const software = CREATURE_ENV.software && !force;
    if (software) return;
    const tier = CREATURE_ENV.tier;
    budget = new CreatureBudget(tier, false);
    const entries: HabitatEntry[] = resolveHabitat({
      biome: options.biome,
      month: CREATURE_ENV.month,
      hour: CREATURE_ENV.hour,
      rain: CREATURE_ENV.rain,
      wind: CREATURE_ENV.wind,
      storm: CREATURE_ENV.storm,
    });
    for (const entry of entries) {
      const requested = tierDensity(entry.density, tier);
      if (requested < 1) continue;
      const trianglesEach = getSpeciesBuild(entry.species).triangles;
      const granted = budget.reserve(entry.species, entry.priority, requested, trianglesEach);
      if (granted < 1) continue;
      const placement = ZONE_PLACEMENT[entry.zone];
      const field = new CreatureField({
        species: entry.species,
        count: granted,
        seed: `${seedBase}:${entry.species}`,
        innerRadius: placement.inner,
        outerRadius: placement.outer,
        zone: entry.zone,
        groundY: placement.y,
        scaleRange: entry.scale,
        keepOutAngle: entry.zone === 'air' ? SIGHTLINE_ANGLE : undefined,
        keepOutHalf: entry.zone === 'air' ? SIGHTLINE_HALF : 0,
        tier,
        minSeparation: entry.species === 'whale' ? 2.2 : 0.2,
      });
      fields.push(field);
      group.add(field.group);
    }
    cached = null;
  };

  conditionsKey = conditionKey();
  buildFields();

  const layer: CreatureLayer = {
    group,
    update(dt, elapsed) {
      const next = conditionKey();
      if (next !== conditionsKey) {
        conditionsKey = next;
        buildFields();
      }
      const distance = CREATURE_ENV.cameraDistance;
      for (let i = 0; i < fields.length; i++) fields[i].update(dt, elapsed, distance);
    },
    setTier(next) {
      budget.setTier(next);
      for (let i = 0; i < fields.length; i++) fields[i].setTier(next);
      cached = null;
    },
    stats() {
      if (cached) return cached;
      let instances = 0;
      let triangles = 0;
      let drawCalls = 0;
      for (let i = 0; i < fields.length; i++) {
        const s = fields[i].stats();
        instances += s.instances;
        triangles += s.triangles;
        drawCalls += s.drawCalls;
      }
      const b = budget.stats();
      cached = {
        instances,
        triangles,
        drawCalls,
        species: fields.length,
        budgetUtilisation: b.utilisation,
        tier: b.tier,
      };
      return cached;
    },
    dispose() {
      clearFields();
      group.clear();
    },
  };

  group.userData.creatureLayer = layer;
  return layer;
}

/* ------------------------------------------------------------------ */
/* Drop-in for the diorama builder                                     */
/* ------------------------------------------------------------------ */

/**
 * Landmarks that carry the full creature layer in this phase. These are the
 * three pilot sites: coastal, savannah and urban.
 */
export const CREATURE_PILOT_SITES: readonly string[] = [
  'Boulders Beach',
  'Kruger National Park',
  'Orlando Towers',
];

export function isCreaturePilotSite(key: string): boolean {
  return CREATURE_PILOT_SITES.includes(key);
}
