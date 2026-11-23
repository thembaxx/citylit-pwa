import { REFERENCE_HEIGHTS, type ScaleFact } from '../data/scaleFacts.ts';
import type { ScaleReferenceKind } from '../types/citylit';

/** Silhouettes below this height would be invisible at the default camera. */
export const MIN_REFERENCE_UNITS = 0.42;
/** Above this height a reference would fall outside the fitted diorama shot. */
export const MAX_REFERENCE_UNITS = 2.6;

/**
 * How far a true-to-scale silhouette must be enlarged (or reduced) to stay
 * legible beside a stylised diorama. `modelUnits` is the landmark's height in
 * diorama units; without it the caller should measure the built group.
 */
/**
 * Metres represented by one diorama unit at a site. An explicitly curated
 * ratio wins; otherwise it is derived from the seeded magnitude and its model
 * height. Returns null when the site has no disclosed ratio — callers must
 * never silently pretend a compressed diorama is 1:1.
 */
export function siteMetresPerUnit(
  fact: Pick<ScaleFact, 'magnitudeM' | 'modelUnits' | 'metresPerUnit'>
): number | null {
  const explicit = fact.metresPerUnit;
  if (Number.isFinite(explicit) && (explicit as number) > 0) return explicit as number;
  const { magnitudeM, modelUnits } = fact;
  if (
    Number.isFinite(magnitudeM) &&
    (magnitudeM as number) > 0 &&
    Number.isFinite(modelUnits) &&
    (modelUnits as number) > 0
  ) {
    return (magnitudeM as number) / (modelUnits as number);
  }
  return null;
}

/** Convert a real-world metre measurement into diorama units for one site. */
export function metresToUnits(metres: number, metresPerUnit: number | null): number | null {
  if (!Number.isFinite(metres) || !Number.isFinite(metresPerUnit)) return null;
  if ((metresPerUnit as number) <= 0) return null;
  return metres / (metresPerUnit as number);
}

export function referenceDisplayFactor(
  magnitudeM: number | null,
  modelUnits: number,
  kind: ScaleReferenceKind
): number | null {
  if (!magnitudeM || magnitudeM <= 0 || !Number.isFinite(modelUnits) || modelUnits <= 0) {
    return null;
  }
  const trueHeight = (REFERENCE_HEIGHTS[kind] * modelUnits) / magnitudeM;
  if (!Number.isFinite(trueHeight) || trueHeight <= 0) return null;
  const displayHeight = Math.min(MAX_REFERENCE_UNITS, Math.max(MIN_REFERENCE_UNITS, trueHeight));
  return displayHeight / trueHeight;
}
