/**
 * Per-city night palettes.
 *
 * A landmark's lit windows and lamps already vary by biome, but everything at
 * street level used one warm sodium tone. A city's night signature is mostly a
 * few choices — what colour its towers are lit, whether its spill is sodium or
 * LED-white, and how hard it pumps light into the sky — so these live in one
 * table and are consumed by the ground spill, the wet-road streaks and the sky
 * light-pollution term.
 */
import type { LandmarkBiome } from '../types/citylit';

export interface NightPalette {
  /** Street-level spill and wet-road streak tint. */
  spill: string;
  /** Cooler counter-accent for facade washes and halos. */
  counter: string;
  /** Colour the city pumps into the sky as light pollution. */
  pollution: string;
  /** How strongly this biome's city glows into the sky (0..1). */
  glow: number;
}

const PALETTES: Partial<Record<LandmarkBiome, NightPalette>> = {
  // Highveld CBD: modern warm-white LED towers over sodium streets.
  urban: { spill: '#ffc07a', counter: '#cfe0ff', pollution: '#ff9a52', glow: 1 },
  // Coastal promenades: cooler mercury/LED white, thin marine haze.
  coastal: { spill: '#ffe0b4', counter: '#bfe2ff', pollution: '#93b6d6', glow: 0.55 },
  // Bushveld camps: deep amber tungsten, very little sky glow.
  savannah: { spill: '#ffc98c', counter: '#d6dcff', pollution: '#e08a3c', glow: 0.34 },
  desert: { spill: '#ffd2a0', counter: '#d8e2ff', pollution: '#c98a52', glow: 0.26 },
  wetland: { spill: '#ffe3b8', counter: '#c4ecff', pollution: '#d9a468', glow: 0.3 },
  mountain: { spill: '#fff0d6', counter: '#cfe2ff', pollution: '#9fb4d0', glow: 0.22 },
  waterfall: { spill: '#eef6ff', counter: '#bfe4ff', pollution: '#9fc0da', glow: 0.2 },
};

const DEFAULT_PALETTE: NightPalette = {
  spill: '#ffd280',
  counter: '#cfe0ff',
  pollution: '#cc9a6a',
  glow: 0.45,
};

export function nightPaletteForBiome(biome: LandmarkBiome | string | undefined): NightPalette {
  if (!biome) return DEFAULT_PALETTE;
  return PALETTES[biome as LandmarkBiome] ?? DEFAULT_PALETTE;
}
