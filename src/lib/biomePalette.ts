import type { LandmarkBiome } from '../types/citylit';

/**
 * Fine-grained South African visual regions. These are art-direction labels only:
 * they do not add or replace the coarse `LandmarkBiome` values used by the engine.
 */
export type RegionalPaletteKey =
  | 'fynbos'
  | 'cape'
  | 'highveld'
  | 'karoo'
  | 'kzn'
  | 'forest'
  | 'limpopo'
  | 'coastal';

export interface RegionalPalette {
  /** Named region, useful for tests and diagnostics. */
  readonly region: RegionalPaletteKey;
  /** Soft bounce fill color during daytime. */
  readonly bounceDay: string;
  /** Soft bounce fill color during dusk/night. */
  readonly bounceNight: string;
  /** Directional rim backlight tint. */
  readonly rimColor: string;
  /** Sky dome zenith tint. */
  readonly skyTopTint: string;
  /** Sky dome horizon tint. */
  readonly skyHorizonTint: string;
  /** Stylized crevice shadow ink. */
  readonly aoShadowColor: string;
  /** Plinth frame accent in daylight. */
  readonly plinthRingDay: string;
  /** Plinth frame emissive accent at night. */
  readonly plinthRingNight: string;
}

/**
 * Deliberately low-contrast, slightly warm/cool shifted tints. Kept away from
 * blown-out whites and saturated neon cyans so they sit inside the existing
 * site-visual albedo guardrails.
 */
export const REGIONAL_PALETTES: Readonly<Record<RegionalPaletteKey, RegionalPalette>> = {
  fynbos: {
    region: 'fynbos',
    bounceDay: '#c5d3dc',
    bounceNight: '#62769c',
    rimColor: '#e3c3c0',
    skyTopTint: '#27517d',
    skyHorizonTint: '#a5b3c1',
    aoShadowColor: '#181a2a',
    plinthRingDay: '#9d826e',
    plinthRingNight: '#cfa7a2',
  },
  cape: {
    region: 'cape',
    bounceDay: '#b8d4d4',
    bounceNight: '#4e7892',
    rimColor: '#d9dcc5',
    skyTopTint: '#225677',
    skyHorizonTint: '#96c0c1',
    aoShadowColor: '#101e28',
    plinthRingDay: '#6c9b9a',
    plinthRingNight: '#9dc9c2',
  },
  highveld: {
    region: 'highveld',
    bounceDay: '#ded1b2',
    bounceNight: '#70658f',
    rimColor: '#e7c48e',
    skyTopTint: '#294b78',
    skyHorizonTint: '#c1a5a9',
    aoShadowColor: '#191627',
    plinthRingDay: '#ae8a4f',
    plinthRingNight: '#e6b666',
  },
  karoo: {
    region: 'karoo',
    bounceDay: '#d9c3ae',
    bounceNight: '#735e72',
    rimColor: '#e3b28f',
    skyTopTint: '#3a4a74',
    skyHorizonTint: '#c8a497',
    aoShadowColor: '#1c1724',
    plinthRingDay: '#a37556',
    plinthRingNight: '#d89a70',
  },
  kzn: {
    region: 'kzn',
    bounceDay: '#bcd2bd',
    bounceNight: '#4d7a78',
    rimColor: '#d8d5a8',
    skyTopTint: '#265b72',
    skyHorizonTint: '#8fb7ad',
    aoShadowColor: '#102120',
    plinthRingDay: '#6d9a84',
    plinthRingNight: '#98c7a8',
  },
  forest: {
    region: 'forest',
    bounceDay: '#b6cdbc',
    bounceNight: '#4b6d6b',
    rimColor: '#d4d2a8',
    skyTopTint: '#264f63',
    skyHorizonTint: '#86a99c',
    aoShadowColor: '#0d1a1a',
    plinthRingDay: '#5e8a72',
    plinthRingNight: '#88b99a',
  },
  limpopo: {
    region: 'limpopo',
    bounceDay: '#dccaa6',
    bounceNight: '#7a6658',
    rimColor: '#e6c08c',
    skyTopTint: '#3b5270',
    skyHorizonTint: '#c5a984',
    aoShadowColor: '#1b171f',
    plinthRingDay: '#ad7f4c',
    plinthRingNight: '#dfa75e',
  },
  coastal: {
    region: 'coastal',
    bounceDay: '#bcd1d2',
    bounceNight: '#4d7489',
    rimColor: '#d2dfd2',
    skyTopTint: '#235a78',
    skyHorizonTint: '#93bfbe',
    aoShadowColor: '#0f1d26',
    plinthRingDay: '#6b9597',
    plinthRingNight: '#96c8c4',
  },
};

interface SiteRule {
  readonly region: RegionalPaletteKey;
  readonly keys: readonly string[];
  readonly fragments: readonly string[];
}

/** Mirrors `normalizeSiteVisualKey` so apostrophe variants resolve identically. */
function normalizeRuleKey(key: string): string {
  return key.replace(/[’‘`]/g, "'").trim().toLowerCase();
}

function rule(
  region: RegionalPaletteKey,
  keys: readonly string[],
  fragments: readonly string[] = [],
): SiteRule {
  return {
    region,
    keys: keys.map(normalizeRuleKey),
    fragments: fragments.map(normalizeRuleKey),
  };
}

/**
 * Named rules for the 43 landmark keys. Exact keys win first, then ordered
 * fragments for nearby/alternate labels (e.g. "Simon's Town" suffixes).
 */
const SITE_RULES: readonly SiteRule[] = [
  rule(
    'fynbos',
    ['Table Mountain', 'Cape Point Lighthouse', 'Groot Constantia'],
    ['table mountain', 'constantia', 'cape peninsula', 'fynbos'],
  ),
  rule(
    'cape',
    [
      'Bo-Kaap',
      'Boulders Beach',
      'Cape Agulhas Lighthouse',
      'Castle of Good Hope',
      'Chapman’s Peak Drive',
      'Hermanus Whale Watching',
      'Robben Island',
    ],
    [
      'boulders beach',
      'cape agulhas',
      'chapman',
      'hermanus',
      'robben island',
      'bo-kaap',
      'castle of good hope',
      'overberg',
      'cape town',
      'western cape',
    ],
  ),
  rule(
    'highveld',
    [
      'Union Buildings',
      'Nelson Mandela Bridge',
      'Voortrekker Monument',
      'FNB Stadium (Soccer City)',
      'Golden Gate Highlands',
      'Ponte City',
      'Orlando Towers',
      'Cradle of Humankind',
      'Vredefort Dome',
      'Hartbeespoort Dam',
    ],
    [
      'pretoria',
      'johannesburg',
      'gauteng',
      'soweto',
      'soccer city',
      'hartbeespoort',
      'vredefort',
      'cradle of humankind',
      'golden gate',
      'free state',
    ],
  ),
  rule(
    'karoo',
    [
      'The Big Hole',
      'Augrabies Falls',
      'SALT Telescope',
      'Gariep Dam',
      'Kgalagadi Red Dunes',
      'Richtersveld',
    ],
    [
      'kgalagadi',
      'richtersveld',
      'augrabies',
      'salt telescope',
      'sutherland',
      'karoo',
      'gariep',
      'kimberley',
      'big hole',
    ],
  ),
  rule(
    'kzn',
    [
      'Moses Mabhida Stadium',
      'Drakensberg Amphitheatre',
      'Isandlwana',
      'iSimangaliso Wetland Park',
      'Sani Pass',
    ],
    [
      'isimangaliso',
      'mabhida',
      'durban',
      'drakensberg',
      'isandlwana',
      'sani pass',
      'kwazulu',
      'kwa zulu',
      'kzn',
    ],
  ),
  rule(
    'forest',
    ['Bloukrans Bridge', 'Storms River Mouth', 'Knysna Heads'],
    ['knysna', 'storms river', 'tsitsikamma', 'bloukrans', 'indigenous forest'],
  ),
  rule(
    'limpopo',
    [
      'Three Rondavels',
      'Baobab',
      'Palace of the Lost City',
      'Kruger National Park',
      'Bourke’s Luck Potholes',
      'Pilanesberg Crater',
      'Mapungubwe Hill',
    ],
    [
      'kruger',
      'mapungubwe',
      'baobab',
      'pilanesberg',
      'sun city',
      'lost city',
      'blyde',
      'rondavels',
      'bourke',
      'limpopo',
      'lowveld',
      'mopane',
    ],
  ),
  rule(
    'coastal',
    ['Hole in the Wall', 'Donkin Reserve'],
    ['hole in the wall', 'donkin', 'port elizabeth', 'gqeberha', 'wild coast', 'transkei'],
  ),
];

const BIOME_FALLBACK: Readonly<Record<LandmarkBiome, RegionalPaletteKey>> = {
  coastal: 'coastal',
  waterfall: 'forest',
  mountain: 'fynbos',
  savannah: 'limpopo',
  urban: 'highveld',
  desert: 'karoo',
  wetland: 'kzn',
};

/**
 * Resolve a fine-grained regional palette from a site key, using the coarse
 * biome only as a last resort. Pure: no THREE, no mutation of inputs.
 */
export function resolveRegionalPalette(key: string, biome: LandmarkBiome): RegionalPalette | null {
  const normalized = normalizeRuleKey(key);

  for (const { region, keys } of SITE_RULES) {
    if (keys.includes(normalized)) return REGIONAL_PALETTES[region];
  }
  for (const { region, fragments } of SITE_RULES) {
    if (fragments.some((fragment) => normalized.includes(fragment))) {
      return REGIONAL_PALETTES[region];
    }
  }

  const fallback = BIOME_FALLBACK[biome] ?? 'fynbos';
  return REGIONAL_PALETTES[fallback] ?? null;
}
