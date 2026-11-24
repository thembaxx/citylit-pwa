/**
 * Shared creature environment: the one snapshot every creature field reads.
 *
 * The engine publishes weather, time, season, quality and camera distance once
 * per frame. Fields never reach into the engine, so the Lab can drive the same
 * values from its sliders. Pure module (no three.js).
 */
import type { CreatureTier } from './budget';
import { timeBandForHour } from './habitat';

export interface CreatureEnvSnapshot {
  hour: number;
  night: number;
  rain: number;
  wind: number;
  storm: number;
  month: number;
  /** 0 pauses all motion (reduced motion / settled idle). */
  motion: number;
  tier: CreatureTier;
  software: boolean;
  /** Camera distance to the diorama centre, drives coarse LOD culling. */
  cameraDistance: number;
}

export const CREATURE_ENV: CreatureEnvSnapshot = {
  hour: 12,
  night: 0,
  rain: 0,
  wind: 0.6,
  storm: 0,
  month: 1,
  motion: 1,
  tier: 0,
  software: false,
  cameraDistance: 10,
};

export function setCreatureEnvironment(patch: Partial<CreatureEnvSnapshot>): void {
  if (patch.hour !== undefined && Number.isFinite(patch.hour)) CREATURE_ENV.hour = patch.hour;
  if (patch.night !== undefined && Number.isFinite(patch.night)) CREATURE_ENV.night = patch.night;
  if (patch.rain !== undefined && Number.isFinite(patch.rain)) CREATURE_ENV.rain = patch.rain;
  if (patch.wind !== undefined && Number.isFinite(patch.wind)) CREATURE_ENV.wind = patch.wind;
  if (patch.storm !== undefined && Number.isFinite(patch.storm)) CREATURE_ENV.storm = patch.storm;
  if (patch.month !== undefined && Number.isFinite(patch.month)) CREATURE_ENV.month = patch.month;
  if (patch.motion !== undefined && Number.isFinite(patch.motion))
    CREATURE_ENV.motion = Math.max(0, Math.min(patch.motion, 2));
  if (patch.tier === 0 || patch.tier === 1 || patch.tier === 2) CREATURE_ENV.tier = patch.tier;
  if (patch.software !== undefined) CREATURE_ENV.software = patch.software;
  if (patch.cameraDistance !== undefined && Number.isFinite(patch.cameraDistance))
    CREATURE_ENV.cameraDistance = Math.max(0, patch.cameraDistance);
}

/** Called once per frame by the engine; positional to avoid a per-frame object. */
export function publishCreatureEnvironment(
  hour: number,
  night: number,
  rain: number,
  wind: number,
  storm: number,
  month: number,
  motion: number,
  tier: CreatureTier,
  software: boolean,
  cameraDistance: number
): void {
  CREATURE_ENV.hour = Number.isFinite(hour) ? hour : CREATURE_ENV.hour;
  CREATURE_ENV.night = Number.isFinite(night) ? night : CREATURE_ENV.night;
  CREATURE_ENV.rain = Number.isFinite(rain) ? rain : CREATURE_ENV.rain;
  CREATURE_ENV.wind = Number.isFinite(wind) ? wind : CREATURE_ENV.wind;
  CREATURE_ENV.storm = Number.isFinite(storm) ? storm : CREATURE_ENV.storm;
  CREATURE_ENV.month = Number.isFinite(month) ? month : CREATURE_ENV.month;
  CREATURE_ENV.motion = Number.isFinite(motion) ? Math.max(0, Math.min(motion, 2)) : 0;
  CREATURE_ENV.tier = tier;
  CREATURE_ENV.software = software;
  CREATURE_ENV.cameraDistance = Number.isFinite(cameraDistance)
    ? Math.max(0, cameraDistance)
    : CREATURE_ENV.cameraDistance;
}

export function currentTimeBand(): ReturnType<typeof timeBandForHour> {
  return timeBandForHour(CREATURE_ENV.hour);
}
