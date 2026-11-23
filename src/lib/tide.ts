/**
 * Coastal tide oscillation curve across the 24-hour cycle.
 *
 * Uses a smooth semidiurnal lunar-solar harmonic (2 high tides and 2 low tides
 * every 24 hours, with a gentle diurnal inequality) so wrapping cleanly across
 * midnight (24 -> 0) stays continuous during Time-Lapse and slider scrubs.
 *
 * Offsets are kept subtle (`[-0.011, +0.045]` plus up to `±0.004` wave swell)
 * so low tide never exposes beneath the square diorama plinth lip (`y = 0.04`)
 * and high tide laps higher up coves, reefs, and beaches without flooding roads.
 */

export const TIDE_CENTER_OFFSET = 0.017;
export const TIDE_HALF_AMPLITUDE = 0.028;
export const TIDE_WAVE_AMPLITUDE = 0.004;

export function computeCoastalTideOffset(
  hour: number,
  wavePhaseSec = 0,
  waveScale = 0
): number {
  const h = Number.isFinite(hour) ? ((hour % 24) + 24) % 24 : 12;
  // Semidiurnal primary wave (2 cycles per 24h; high tides around 06:30 & 18:30)
  const semidiurnal = Math.sin(((h - 3.5) / 12) * Math.PI * 2);
  // Subtle diurnal inequality so morning and evening high tides differ naturally
  const diurnal = 0.16 * Math.sin(((h - 5) / 24) * Math.PI * 2);
  const tideNorm = Math.max(-1, Math.min(1, (semidiurnal + diurnal) / 1.16));

  const clampedScale = Math.max(0, Math.min(1, Number.isFinite(waveScale) ? waveScale : 0));
  const swell =
    clampedScale > 0 && Number.isFinite(wavePhaseSec)
      ? TIDE_WAVE_AMPLITUDE * Math.sin(wavePhaseSec * 0.95) * clampedScale
      : 0;

  return TIDE_CENTER_OFFSET + tideNorm * TIDE_HALF_AMPLITUDE + swell;
}
