import { REFERENCE_HEIGHTS } from '../data/scaleFacts';
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
