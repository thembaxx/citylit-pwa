import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { AmbientEvent, AmbientSiteProfile, LandmarkBiome } from '../../types/citylit';
import { getStoneBumpTexture, WU } from '../shaders';
import {
  add,
  C,
  CB,
  finalizeTreeBatch,
  G,
  grassTufts,
  instancedMeshes,
  Mc,
  MSteel,
  MStone,
  MWood,
  R,
  scatterRocks,
  stream,
  tree,
  type InstanceTransform,
} from './primitives';

type Update = (t: number) => void;
type Tick = (t: number, dt: number) => void;
type AnchorKind = 'jetty' | 'windpump' | 'bollards' | 'deck' | 'reedbed';
export type DioramaFx =
  | 'surf'
  | 'spray'
  | 'mist'
  | 'foam'
  | 'dust'
  | 'haze'
  | 'sparkle'
  | 'cityGlow'
  | 'ridgeFog';

interface SiteProfile {
  biome: LandmarkBiome;
  /** [top bevel, outer edge, strata band, base wall] */
  rim: readonly [string, string, string, string];
  rock: readonly [string, string];
  plants?: readonly string[];
  /** [boulders, plant tufts] */
  count: readonly [number, number];
  /** [count, tree kind, scale] */
  ring: readonly [number, number, number];
  fx: readonly DioramaFx[];
  anchor: AnchorKind;
  audio: AmbientSiteProfile;
}

function au(pan: number, events: AmbientEvent[] = [], density = 1): AmbientSiteProfile {
  return { pan, events, density };
}

/**
 * Curated site profiles: every South African landmark gets a graded rim,
 * ground cover, secondary anchor prop, micro-weather and a spatial audio bed.
 */
const SITE_PROFILES: Record<string, SiteProfile> = {
  'Table Mountain': {
    biome: 'mountain',
    rim: ['#5f7042', '#87905a', '#93805a', '#3c4030'],
    rock: ['#7b7765', '#b0a890'],
    plants: ['#3d5a2e', '#5f7c3b', '#8d8a4d'],
    count: [14, 18],
    ring: [5, 1, 0.7],
    fx: ['ridgeFog'],
    anchor: 'deck',
    audio: au(0.1),
  },
  'Union Buildings': {
    biome: 'urban',
    rim: ['#c9b98f', '#ded0a6', '#a98e63', '#6d5f47'],
    rock: ['#8c7c64', '#c3b393'],
    plants: ['#3f6136', '#587a3f'],
    count: [8, 12],
    ring: [6, 2, 0.8],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(-0.15),
  },
  'Moses Mabhida Stadium': {
    biome: 'urban',
    rim: ['#b9bec2', '#d7dbdf', '#8f979e', '#4a535c'],
    rock: ['#8f9297', '#c3c6ca'],
    plants: ['#426b3e', '#5d8348'],
    count: [6, 10],
    ring: [4, 1, 0.7],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(0.25),
  },
  'Nelson Mandela Bridge': {
    biome: 'urban',
    rim: ['#4d5560', '#6d7683', '#38414c', '#242a32'],
    rock: ['#6b6f74', '#9aa0a6'],
    count: [6, 0],
    ring: [0, 0, 0],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(0, [], 1.1),
  },
  'The Big Hole': {
    biome: 'desert',
    rim: ['#8a6a4a', '#a98a63', '#6f5237', '#463426'],
    rock: ['#7d6448', '#b1926c'],
    plants: ['#7c7440', '#948a4c'],
    count: [16, 8],
    ring: [0, 0, 0],
    fx: ['dust', 'haze'],
    anchor: 'windpump',
    audio: au(0.3, [], 1.2),
  },
  'Voortrekker Monument': {
    biome: 'urban',
    rim: ['#b0a184', '#cbbb9c', '#8d7d61', '#5c5140'],
    rock: ['#8b806b', '#bdb198'],
    plants: ['#6d7742', '#8a8f4e'],
    count: [10, 12],
    ring: [6, 2, 0.8],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(-0.2),
  },
  'Cape Point Lighthouse': {
    biome: 'coastal',
    rim: ['#8c8f77', '#b3b596', '#6d7460', '#3f4739'],
    rock: ['#6f6a58', '#a9a189'],
    plants: ['#5b6e3a', '#7d8b4c', '#a49a55'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray'],
    anchor: 'jetty',
    audio: au(0.4, ['shorebird']),
  },
  'Bo-Kaap': {
    biome: 'urban',
    rim: ['#9a8d86', '#bbb0a6', '#7a6f68', '#4b4440'],
    rock: ['#7d7368', '#aaa096'],
    plants: ['#4f7040'],
    count: [8, 8],
    ring: [4, 1, 0.65],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(-0.3),
  },
  'FNB Stadium (Soccer City)': {
    biome: 'urban',
    rim: ['#8f5a3c', '#b47a52', '#6c402a', '#40261a'],
    rock: ['#7c6552', '#ad9276'],
    plants: ['#5a7245'],
    count: [8, 8],
    ring: [3, 1, 0.6],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(0.1),
  },
  'Three Rondavels': {
    biome: 'mountain',
    rim: ['#8a6a45', '#b08e60', '#6b5033', '#3f2f1f'],
    rock: ['#7d6144', '#b3956c'],
    plants: ['#5c6b3a', '#7c8547'],
    count: [16, 14],
    ring: [4, 2, 0.7],
    fx: ['ridgeFog'],
    anchor: 'deck',
    audio: au(0.15),
  },
  Baobab: {
    biome: 'savannah',
    rim: ['#a0683f', '#bd8555', '#7a4c2d', '#4a2d1b'],
    rock: ['#8a6046', '#bb9270'],
    plants: ['#6e7440', '#8b8a4c'],
    count: [12, 12],
    ring: [3, 2, 0.75],
    fx: ['dust', 'haze'],
    anchor: 'windpump',
    audio: au(0.2, [], 1.3),
  },
  'Hole in the Wall': {
    biome: 'coastal',
    rim: ['#7f6b53', '#a8916f', '#5f4f3c', '#382e23'],
    rock: ['#716050', '#ab967c'],
    plants: ['#4a6b3c', '#6b8348'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray'],
    anchor: 'jetty',
    audio: au(-0.35, ['shorebird'], 1.1),
  },
  'Castle of Good Hope': {
    biome: 'urban',
    rim: ['#b6a374', '#d1bd8c', '#8e7a54', '#57503b'],
    rock: ['#8a7b60', '#b9ab8a'],
    plants: ['#546b3b'],
    count: [10, 10],
    ring: [5, 1, 0.7],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(0.15),
  },
  'Drakensberg Amphitheatre': {
    biome: 'waterfall',
    rim: ['#5e6a58', '#828d6e', '#4d5747', '#2e352b'],
    rock: ['#6e7263', '#a3a892'],
    plants: ['#4d6b3d', '#6a8549'],
    count: [16, 14],
    ring: [4, 1, 0.7],
    fx: ['mist', 'foam', 'ridgeFog'],
    anchor: 'deck',
    audio: au(0.1, [], 1.1),
  },
  'Palace of the Lost City': {
    biome: 'savannah',
    rim: ['#a9825a', '#c6a276', '#7f5f3f', '#4b3826'],
    rock: ['#8d7458', '#bfa17e'],
    plants: ['#4f7040', '#6d8a4b'],
    count: [10, 14],
    ring: [4, 1, 0.8],
    fx: ['dust'],
    anchor: 'deck',
    audio: au(-0.1, [], 0.9),
  },
  'Golden Gate Highlands': {
    biome: 'mountain',
    rim: ['#8d6334', '#c08a45', '#6d4a24', '#42301a'],
    rock: ['#8a6a44', '#c39a63'],
    plants: ['#6c7442', '#8e8c4e'],
    count: [16, 12],
    ring: [5, 2, 0.75],
    fx: ['ridgeFog'],
    anchor: 'deck',
    audio: au(0.2),
  },
  'Kruger National Park': {
    biome: 'savannah',
    rim: ['#8e5030', '#b06a3e', '#6b3a22', '#412314'],
    rock: ['#7f5741', '#b08666'],
    plants: ['#6f7440', '#8d8a4b'],
    count: [14, 18],
    ring: [5, 2, 0.8],
    fx: ['dust', 'haze'],
    anchor: 'windpump',
    audio: au(-0.25, ['cicada'], 1.3),
  },
  'Ponte City': {
    biome: 'urban',
    rim: ['#5d6268', '#7f858c', '#454a50', '#262a2e'],
    rock: ['#75787c', '#a8abaf'],
    count: [6, 0],
    ring: [0, 0, 0],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(0.3, [], 1.1),
  },
  'Boulders Beach': {
    biome: 'coastal',
    rim: ['#a49d8b', '#cdc6b1', '#847d6c', '#4d4a40'],
    rock: ['#7f7d72', '#c1bfb3'],
    plants: ['#6a7f45', '#8a9a55'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray'],
    anchor: 'jetty',
    audio: au(-0.4, ['shorebird'], 1.1),
  },
  'Cape Agulhas Lighthouse': {
    biome: 'coastal',
    rim: ['#9a948a', '#c0bab0', '#79736a', '#474440'],
    rock: ['#77736c', '#b0aca4'],
    plants: ['#6b7a44', '#8b9450'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray'],
    anchor: 'jetty',
    audio: au(0.45, ['shorebird']),
  },
  'Orlando Towers': {
    biome: 'urban',
    rim: ['#6a6259', '#8d8477', '#4d4841', '#2b2824'],
    rock: ['#7b7469', '#a9a196'],
    plants: ['#5c7246'],
    count: [8, 10],
    ring: [4, 1, 0.7],
    fx: ['cityGlow'],
    anchor: 'bollards',
    audio: au(-0.25, [], 1.15),
  },
  "Bourke's Luck Potholes": {
    biome: 'waterfall',
    rim: ['#8a5a35', '#b07c4c', '#653f24', '#3b2414'],
    rock: ['#87654a', '#bd9a72'],
    plants: ['#586b3c', '#75834a'],
    count: [18, 10],
    ring: [3, 1, 0.7],
    fx: ['mist', 'foam'],
    anchor: 'deck',
    audio: au(0.1, [], 1.2),
  },
  'Augrabies Falls': {
    biome: 'waterfall',
    rim: ['#7b6552', '#a58d72', '#5a4838', '#33281f'],
    rock: ['#7a6853', '#b29a7c'],
    plants: ['#6d7442', '#8a8a4e'],
    count: [16, 10],
    ring: [3, 1, 0.7],
    fx: ['mist', 'foam', 'haze'],
    anchor: 'deck',
    audio: au(-0.15, [], 1.2),
  },
  'SALT Telescope': {
    biome: 'desert',
    rim: ['#8c7a62', '#b3a086', '#675845', '#3a3226'],
    rock: ['#847761', '#bcae95'],
    plants: ['#7c7444', '#948a52'],
    count: [14, 8],
    ring: [0, 0, 0],
    fx: ['dust', 'haze'],
    anchor: 'windpump',
    audio: au(0.3, [], 1.1),
  },
  'Bloukrans Bridge': {
    biome: 'waterfall',
    rim: ['#55664a', '#79885f', '#3f4c37', '#252e20'],
    rock: ['#6b705d', '#a3a68c'],
    plants: ['#3f6437', '#5c7f45'],
    count: [14, 18],
    ring: [6, 1, 0.85],
    fx: ['mist', 'ridgeFog'],
    anchor: 'deck',
    audio: au(0.2, ['cicada'], 1.1),
  },
  'Pilanesberg Crater': {
    biome: 'mountain',
    rim: ['#7a6248', '#a2865f', '#594630', '#33291c'],
    rock: ['#7f6a50', '#b49873'],
    plants: ['#6a7040', '#8a854a'],
    count: [16, 12],
    ring: [4, 2, 0.75],
    fx: ['ridgeFog', 'dust'],
    anchor: 'deck',
    audio: au(-0.2),
  },
  'Robben Island': {
    biome: 'coastal',
    rim: ['#9d9a8c', '#c4c1b1', '#7d7a6d', '#4a4841'],
    rock: ['#7c7a70', '#b2b0a4'],
    plants: ['#6a7a4a'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray'],
    anchor: 'jetty',
    audio: au(0.35, ['shorebird'], 0.9),
  },
  "Chapman's Peak Drive": {
    biome: 'coastal',
    rim: ['#7f6f58', '#a89270', '#5f5340', '#362f24'],
    rock: ['#6f604e', '#a89478'],
    plants: ['#546b3a', '#75884a'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray', 'ridgeFog'],
    anchor: 'jetty',
    audio: au(-0.4, ['shorebird']),
  },
  Isandlwana: {
    biome: 'mountain',
    rim: ['#8a7a4e', '#b09c68', '#67593a', '#3a3222'],
    rock: ['#83765a', '#b9a885'],
    plants: ['#7a7a40', '#948f4c'],
    count: [14, 16],
    ring: [5, 2, 0.8],
    fx: ['dust', 'ridgeFog'],
    anchor: 'deck',
    audio: au(0.2, ['cicada']),
  },
  'Gariep Dam': {
    biome: 'waterfall',
    rim: ['#6f6a58', '#958e76', '#524e40', '#2e2c24'],
    rock: ['#77725e', '#afa88c'],
    plants: ['#657344', '#828a4e'],
    count: [14, 8],
    ring: [3, 1, 0.7],
    fx: ['mist', 'spray'],
    anchor: 'deck',
    audio: au(-0.2),
  },
  'Cradle of Humankind': {
    biome: 'mountain',
    rim: ['#8a7d64', '#b3a586', '#665c48', '#3a342a'],
    rock: ['#817660', '#b8ac90'],
    plants: ['#6b7442', '#898a4e'],
    count: [16, 14],
    ring: [5, 1, 0.75],
    fx: ['dust', 'ridgeFog'],
    anchor: 'deck',
    audio: au(0.15, ['cicada']),
  },
  'Mapungubwe Hill': {
    biome: 'savannah',
    rim: ['#8e5e3a', '#b47f52', '#6a4429', '#3e2917'],
    rock: ['#866249', '#bb9873'],
    plants: ['#6d7440', '#8a894b'],
    count: [14, 14],
    ring: [4, 2, 0.8],
    fx: ['dust', 'haze'],
    anchor: 'windpump',
    audio: au(0.25, [], 1.2),
  },
  'Kgalagadi Red Dunes': {
    biome: 'desert',
    rim: ['#a5542e', '#c9794a', '#7c3b20', '#482210'],
    rock: ['#8f5a3d', '#c58a63'],
    plants: ['#7d7540', '#95894a'],
    count: [14, 10],
    ring: [0, 0, 0],
    fx: ['dust', 'haze'],
    anchor: 'windpump',
    audio: au(-0.3, [], 1.2),
  },
  'Storms River Mouth': {
    biome: 'coastal',
    rim: ['#5f6a5c', '#83907a', '#465047', '#28302a'],
    rock: ['#676b5f', '#9ba087'],
    plants: ['#3f6437', '#5c7f45'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray', 'mist'],
    anchor: 'jetty',
    audio: au(0.4, ['shorebird']),
  },
  'Groot Constantia': {
    biome: 'savannah',
    rim: ['#8d7a5a', '#b29b74', '#6a5c43', '#3d3527'],
    rock: ['#837459', '#b8a788'],
    plants: ['#4f6b38', '#6f8547'],
    count: [12, 16],
    ring: [6, 2, 0.8],
    fx: ['dust'],
    anchor: 'windpump',
    audio: au(-0.2, ['cicada'], 0.8),
  },
  'Hermanus Whale Watching': {
    biome: 'coastal',
    rim: ['#8c8674', '#b5ae98', '#6d6859', '#403d34'],
    rock: ['#75705f', '#ada68e'],
    plants: ['#5e7440', '#7d8c4c'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray'],
    anchor: 'jetty',
    audio: au(0.45, ['shorebird'], 1.1),
  },
  'iSimangaliso Wetland Park': {
    biome: 'wetland',
    rim: ['#6d7048', '#8f925f', '#4f5336', '#2c2f1e'],
    rock: ['#6f6e54', '#a5a083'],
    plants: ['#5c7f45', '#7d9a55'],
    count: [10, 18],
    ring: [5, 3, 0.8],
    fx: ['sparkle', 'mist'],
    anchor: 'deck',
    audio: au(-0.3, ['frog'], 1.2),
  },
  'Sani Pass': {
    biome: 'mountain',
    rim: ['#6b7058', '#8f9474', '#4d523f', '#2c3024'],
    rock: ['#6d7160', '#a3a78e'],
    plants: ['#5b6e3c', '#7d8a4a'],
    count: [16, 12],
    ring: [3, 4, 0.7],
    fx: ['ridgeFog', 'dust'],
    anchor: 'deck',
    audio: au(0.2, [], 1.1),
  },
  Richtersveld: {
    biome: 'desert',
    rim: ['#8f6a48', '#b58c61', '#6a4e34', '#3d2c1e'],
    rock: ['#87684c', '#bd9c74'],
    plants: ['#7c7444', '#978d54'],
    count: [18, 8],
    ring: [0, 0, 0],
    fx: ['dust', 'haze'],
    anchor: 'windpump',
    audio: au(0.25, [], 1.15),
  },
  'Vredefort Dome': {
    biome: 'mountain',
    rim: ['#8a7a55', '#b09c70', '#665a40', '#3a3224'],
    rock: ['#83785e', '#b9ae8c'],
    plants: ['#727a42', '#8d8a4c'],
    count: [14, 12],
    ring: [4, 1, 0.75],
    fx: ['dust', 'ridgeFog'],
    anchor: 'deck',
    audio: au(-0.15),
  },
  'Hartbeespoort Dam': {
    biome: 'waterfall',
    rim: ['#6d7558', '#909776', '#4f5642', '#2d3226'],
    rock: ['#707460', '#a6a88c'],
    plants: ['#4d6b3a', '#6a8549'],
    count: [14, 14],
    ring: [4, 1, 0.7],
    fx: ['mist', 'spray'],
    anchor: 'deck',
    audio: au(0.1),
  },
  'Knysna Heads': {
    biome: 'coastal',
    rim: ['#5f6a58', '#84907a', '#475043', '#282f27'],
    rock: ['#6a6d5f', '#9ea28a'],
    plants: ['#3f6437', '#5f8246'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray', 'ridgeFog'],
    anchor: 'jetty',
    audio: au(-0.45, ['shorebird']),
  },
  'Donkin Reserve': {
    biome: 'coastal',
    rim: ['#8d8570', '#b3aa92', '#6c6655', '#403d33'],
    rock: ['#7a7462', '#b0a990'],
    plants: ['#5c7240', '#7a8a4a'],
    count: [0, 0],
    ring: [0, 0, 0],
    fx: ['surf', 'spray', 'cityGlow'],
    anchor: 'bollards',
    audio: au(0.3, ['shorebird']),
  },
};

const FALLBACK_PROFILE: SiteProfile = {
  biome: 'mountain',
  rim: ['#8a8272', '#aca492', '#6d6658', '#403c33'],
  rock: ['#7f7a6b', '#b3ac99'],
  plants: ['#5b6e3c', '#7a8548'],
  count: [10, 10],
  ring: [0, 0, 0],
  fx: [],
  anchor: 'deck',
  audio: au(0),
};

export function getSiteProfile(key: string): SiteProfile {
  return SITE_PROFILES[key] ?? FALLBACK_PROFILE;
}

export function hasSiteProfile(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(SITE_PROFILES, key);
}

/* ------------------------------------------------------------------ */
/* Crafted base rim                                                    */
/* ------------------------------------------------------------------ */

let rimMaterial: THREE.MeshStandardMaterial | null = null;

function getRimMaterial(): THREE.MeshStandardMaterial {
  if (!rimMaterial) {
    rimMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.03,
      bumpMap: getStoneBumpTexture(),
      bumpScale: 0.018,
    });
  }
  return rimMaterial;
}

function paintRadial(
  geo: THREE.BufferGeometry,
  inner: string,
  outer: string,
  edge: string,
  rIn: number,
  rOut: number
): void {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cInner = new THREE.Color(inner);
  const cOuter = new THREE.Color(outer);
  const cEdge = new THREE.Color(edge);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const u = Math.min(1, Math.max(0, (r - rIn) / (rOut - rIn)));
    const grain =
      0.05 * Math.sin(x * 3.1 + z * 2.3) +
      0.035 * Math.sin(x * 9.7 - z * 7.1) +
      0.02 * Math.sin((x + z) * 21.3);
    c.copy(cInner).lerp(cOuter, u);
    const ao = 0.84 + 0.16 * Math.min(1, u * 4.5);
    c.multiplyScalar(ao + grain);
    if (u > 0.9) c.lerp(cEdge, (u - 0.9) * 3.5);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.deleteAttribute('uv');
}

function paintStrata(geo: THREE.BufferGeometry, bands: readonly string[], seed: number): void {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const minY = bb ? bb.min.y : 0;
  const maxY = bb ? bb.max.y : 1;
  const span = Math.max(0.0001, maxY - minY);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cs = bands.map((b) => new THREE.Color(b));
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = pos.getY(i);
    const f = ((y - minY) / span) * (cs.length - 1);
    const i0 = Math.max(0, Math.min(cs.length - 1, Math.floor(f)));
    const i1 = Math.min(cs.length - 1, i0 + 1);
    c.copy(cs[i0]).lerp(cs[i1], f - i0);
    const grain = 1 + 0.07 * Math.sin(x * 6.1 + seed) + 0.05 * Math.sin(z * 8.3 + y * 13);
    c.multiplyScalar(grain);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.deleteAttribute('uv');
}

function addCraftedRim(g: THREE.Group, profile: SiteProfile): void {
  const [top, edge, band, wall] = profile.rim;
  const topGeo = new THREE.RingGeometry(7.62, 8.22, 120, 2)
    .rotateX(-Math.PI / 2)
    .translate(0, 0.185, 0);
  paintRadial(topGeo, top, edge, band, 7.62, 8.22);

  const bevelGeo = new THREE.CylinderGeometry(8.22, 8.38, 0.075, 120, 1, true).translate(
    0,
    0.147,
    0
  );
  paintStrata(bevelGeo, [edge, band], 1.7);

  const skirtGeo = new THREE.CylinderGeometry(8.38, 8.5, 0.135, 120, 3, true).translate(
    0,
    0.045,
    0
  );
  paintStrata(skirtGeo, [wall, band, top], 4.2);

  const merged = mergeGeometries([topGeo, bevelGeo, skirtGeo], false);
  topGeo.dispose();
  bevelGeo.dispose();
  skirtGeo.dispose();
  if (!merged) return;
  merged.computeBoundingSphere();
  const mesh = new THREE.Mesh(merged, getRimMaterial());
  mesh.receiveShadow = true;
  g.add(mesh);
}

/* ------------------------------------------------------------------ */
/* Base scatter: rim boulders + biome ground cover                     */
/* ------------------------------------------------------------------ */

function addBaseScatter(g: THREE.Group, profile: SiteProfile): void {
  const [rockCount, plantCount] = profile.count;
  if (rockCount > 0) {
    const items: InstanceTransform[] = [];
    for (let i = 0; i < rockCount; i++) {
      const a = (i / rockCount) * 6.2832 + R(i * 7.1 + 3) * 0.55;
      const r = 7.1 + R(i * 3.7 + 9) * 0.85;
      items.push({
        x: Math.cos(a) * r,
        y: 0.2,
        z: Math.sin(a) * r,
        ry: R(i + 4) * 6.28,
        sx: 0.3 + R(i + 5) * 0.38,
        sy: 0.2 + R(i + 6) * 0.24,
        sz: 0.3 + R(i + 7) * 0.38,
      });
    }
    scatterRocks(g, items, profile.rock[0], profile.rock[1]);
  }

  const plants = profile.plants;
  if (plantCount > 0 && plants && plants.length > 0) {
    const items: InstanceTransform[] = [];
    for (let i = 0; i < plantCount; i++) {
      const a = (i / plantCount) * 6.2832 + R(i * 5.3 + 2) * 0.8;
      const r = 6.9 + R(i * 2.9 + 1) * 0.65;
      items.push({
        x: Math.cos(a) * r,
        y: 0.19,
        z: Math.sin(a) * r,
        ry: R(i) * 6.28,
        sx: 0.7 + R(i + 3) * 0.55,
        sy: 0.75 + R(i + 4) * 0.7,
        sz: 0.7 + R(i + 5) * 0.55,
      });
    }
    grassTufts(g, items, plants);
  }
}

function addTreeRing(g: THREE.Group, profile: SiteProfile, angle: number): void {
  const [count, kind, scale] = profile.ring;
  if (count <= 0) return;
  for (let i = 0; i < count; i++) {
    const a = angle + (i / count) * 6.2832 + (R(i * 4.7 + 1) - 0.5) * 0.4;
    const r = 7.0 + R(i * 2.3 + 6) * 0.22;
    tree(g, Math.cos(a) * r, Math.sin(a) * r, scale * (0.88 + R(i + 8) * 0.24), kind, 0.19);
  }
}

/* ------------------------------------------------------------------ */
/* Secondary site anchors                                              */
/* ------------------------------------------------------------------ */

function anchorGroup(g: THREE.Group, angle: number, radius: number): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(Math.cos(angle) * radius, 0.19, Math.sin(angle) * radius);
  grp.rotation.y = -angle;
  g.add(grp);
  return grp;
}

function addJetty(g: THREE.Group, angle: number): Update[] {
  const grp = anchorGroup(g, angle, 0);
  const wood = MWood('#6a4b33', 0.9);
  const dark = MWood('#3f2c1e', 0.92);
  for (let i = 0; i < 7; i++) {
    add(grp, CB(0.3, 0.045, 0.62, 0.012), wood, 6.55 + i * 0.22, 0.2, 0);
  }
  for (let p = 0; p < 3; p++) {
    for (const s of [-1, 1]) {
      add(grp, C(0.035, 0.045, 0.42, 6), dark, 6.62 + p * 0.55, 0.02, s * 0.25);
    }
  }
  add(grp, C(0.03, 0.038, 0.5, 6), dark, 7.78, 0.36, 0.24);
  add(grp, new THREE.SphereGeometry(0.055, 10, 8), G('#ffd9a0', 1.2), 7.78, 0.63, 0.24);
  return [];
}

function addWindpump(g: THREE.Group, angle: number): Update[] {
  const grp = anchorGroup(g, angle, 7.25);
  const steel = MSteel('#8a8f94', 0.62, 0.7);
  const wood = MWood('#6d5539', 0.9);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.78;
    const leg = add(
      grp,
      C(0.018, 0.03, 0.9, 5),
      steel,
      Math.cos(a) * 0.11,
      0.45,
      Math.sin(a) * 0.11
    );
    leg.rotation.z = -Math.cos(a) * 0.13;
    leg.rotation.x = Math.sin(a) * 0.13;
  }
  add(grp, CB(0.26, 0.02, 0.02, 0.005), steel, 0, 0.5, 0).rotation.y = 0.78;
  add(grp, CB(0.02, 0.02, 0.26, 0.005), steel, 0, 0.5, 0).rotation.y = 0.78;
  add(grp, CB(0.16, 0.1, 0.12, 0.02), steel, 0, 0.92, 0);
  add(grp, CB(0.03, 0.16, 0.46, 0.01), steel, 0, 0.97, 0.2);
  const wheel = new THREE.Group();
  wheel.position.set(0, 0.94, -0.06);
  grp.add(wheel);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const blade = add(
      wheel,
      CB(0.11, 0.2, 0.01, 0.004),
      wood,
      Math.cos(a) * 0.13,
      Math.sin(a) * 0.13,
      0
    );
    blade.rotation.z = a + Math.PI / 2;
  }
  return [
    (t) => {
      wheel.rotation.z = t * 2.4;
    },
  ];
}

function addBollards(g: THREE.Group, angle: number): Update[] {
  const grp = anchorGroup(g, angle, 0);
  const steel = MSteel('#3c4248', 0.55, 0.75);
  for (let i = 0; i < 3; i++) {
    const z = (i - 1) * 0.55;
    add(grp, C(0.05, 0.06, 0.22, 10), steel, 7.2, 0.3, z);
    add(grp, new THREE.SphereGeometry(0.055, 10, 8), G('#ffd9a0', 1.0), 7.2, 0.42, z);
  }
  add(grp, CB(0.5, 0.2, 0.3, 0.02), MStone('#8a8378', 0.9), 7.1, 0.29, 0);
  grassTufts(grp, [{ x: 7.1, y: 0.4, z: 0 }], ['#5c7a42', '#7a8f4c']);
  return [];
}

function addDeck(g: THREE.Group, angle: number): Update[] {
  const grp = anchorGroup(g, angle, 0);
  const st = MStone('#8a8274', 0.92);
  const wood = MWood('#6b5138', 0.88);
  add(grp, CB(1.0, 0.1, 0.7, 0.02), wood, 7.1, 0.24, 0);
  for (const x of [6.7, 7.5]) {
    for (const z of [-0.3, 0.3]) add(grp, C(0.03, 0.04, 0.2, 6), st, x, 0.13, z);
  }
  for (let i = 0; i < 3; i++) add(grp, C(0.012, 0.012, 0.34, 5), st, 6.68 + i * 0.42, 0.46, 0.33);
  add(grp, CB(0.86, 0.02, 0.02, 0.005), st, 7.1, 0.56, 0.33);
  return [];
}

function addReedbed(g: THREE.Group, angle: number): Update[] {
  const tufts: InstanceTransform[] = [];
  const reeds: InstanceTransform[] = [];
  for (let i = 0; i < 16; i++) {
    const a = angle + (R(i * 3.1) - 0.5) * 0.9;
    const r = 7.0 + R(i * 5.7) * 0.55;
    tufts.push({
      x: Math.cos(a) * r,
      y: 0.19,
      z: Math.sin(a) * r,
      ry: R(i) * 6.28,
      sx: 0.7 + R(i + 2) * 0.5,
      sy: 0.9 + R(i + 3) * 0.8,
      sz: 0.7 + R(i + 4) * 0.5,
    });
  }
  for (let i = 0; i < 12; i++) {
    const a = angle + (R(i * 6.7 + 4) - 0.5) * 1.1;
    const r = 7.05 + R(i * 2.3 + 7) * 0.5;
    reeds.push({
      x: Math.cos(a) * r,
      y: 0.19,
      z: Math.sin(a) * r,
      ry: R(i + 1) * 6.28,
      sy: 0.8 + R(i + 5) * 0.7,
      sx: 1,
      sz: 1,
    });
  }
  grassTufts(g, tufts, ['#5f7c3f', '#7c8c49', '#8f8c52']);
  instancedMeshes(g, C(0.008, 0.016, 0.8, 5, 1, false).translate(0, 0.4, 0), Mc('#6e8144'), reeds);
  return [];
}

function addAnchor(g: THREE.Group, profile: SiteProfile, angle: number): Update[] {
  switch (profile.anchor) {
    case 'jetty':
      return addJetty(g, angle);
    case 'windpump':
      return addWindpump(g, angle);
    case 'bollards':
      return addBollards(g, angle);
    case 'reedbed':
      return addReedbed(g, angle);
    default:
      return addDeck(g, angle);
  }
}

/* ------------------------------------------------------------------ */
/* Micro-weather                                                       */
/* ------------------------------------------------------------------ */

function addWeatherFx(g: THREE.Group, profile: SiteProfile): Update[] {
  const updates: Update[] = [];
  for (let f = 0; f < profile.fx.length; f++) {
    const kind = profile.fx[f];
    if (kind === 'surf') {
      const s = stream(
        g,
        26,
        '#e6fbff',
        0.075,
        (i, t, o) => {
          const a = R(i * 3.13 + 1) * 6.2832 + t * 0.05;
          const r = 6.15 + R(i * 7.7 + 2) * 1.45;
          const swell = Math.sin(t * 1.1 + i * 1.7);
          const rr = r + swell * 0.08;
          o.set(Math.cos(a) * rr, 0.135 + swell * 0.035, Math.sin(a) * rr);
        },
        0.55
      );
      updates.push(s.update);
    } else if (kind === 'spray') {
      const s = stream(
        g,
        20,
        '#f2feff',
        0.06,
        (i, t, o) => {
          const a = R(i * 9.7 + 1) * 6.2832 + t * 0.04;
          const u = (t * 0.32 + R(i * 5.3)) % 1;
          const r = 6.35 + R(i * 2.1) * 0.8;
          o.set(Math.cos(a) * r, 0.12 + u * (0.35 + R(i) * 0.55), Math.sin(a) * r);
        },
        0.42
      );
      updates.push(s.update);
    } else if (kind === 'mist') {
      const s = stream(
        g,
        26,
        '#eef6ff',
        0.42,
        (i, t, o) => {
          const a = R(i * 3.7 + 2) * 6.2832 + Math.sin(t * 0.1 + i) * 0.2;
          const r = 1.4 + R(i * 5.9 + 1) * 3.2;
          const u = (t * 0.08 + R(i * 7.3)) % 1;
          o.set(Math.cos(a) * r, 0.25 + u * 2.6, Math.sin(a) * r);
        },
        0.16,
        false
      );
      updates.push(s.update);
    } else if (kind === 'foam') {
      const s = stream(
        g,
        18,
        '#f6ffff',
        0.1,
        (i, t, o) => {
          const a = R(i * 4.9 + 1) * 6.2832 + t * 0.12;
          const u = (t * 0.42 + R(i * 8.1)) % 1;
          const r = 0.25 + R(i * 3.3) * 1.3 * (0.4 + u);
          o.set(Math.cos(a) * r, 0.2 + u * 1.9, Math.sin(a) * r);
        },
        0.6
      );
      updates.push(s.update);
    } else if (kind === 'dust') {
      const s = stream(
        g,
        24,
        '#e8c590',
        0.055,
        (i, t, o) => {
          const a = R(i * 6.1 + 2) * 6.2832 + t * 0.035;
          const r = 3.2 + R(i * 4.7 + 3) * 4.2;
          o.set(Math.cos(a) * r, 0.22 + ((R(i * 2.3) * 2.4 + t * 0.12) % 2.4), Math.sin(a) * r);
        },
        0.38
      );
      updates.push(s.update);
    } else if (kind === 'haze') {
      const s = stream(
        g,
        12,
        '#f0dcba',
        0.5,
        (i, t, o) => {
          const a = R(i * 2.7 + 5) * 6.2832 + Math.sin(t * 0.06 + i) * 0.12;
          const r = 2.4 + R(i * 6.3 + 1) * 4.6;
          o.set(Math.cos(a) * r, 0.35 + Math.sin(t * 0.2 + i) * 0.14 + R(i) * 0.3, Math.sin(a) * r);
        },
        0.1,
        false
      );
      updates.push(s.update);
    } else if (kind === 'sparkle') {
      const s = stream(
        g,
        26,
        '#d9fbff',
        0.05,
        (i, t, o) => {
          const a = R(i * 5.1 + 4) * 6.2832 + t * 0.02;
          const r = 2.2 + R(i * 3.9 + 2) * 4.9;
          const tw = Math.sin(t * 2.6 + i * 1.9);
          o.set(Math.cos(a) * r, 0.14 + tw * 0.02, Math.sin(a) * r);
        },
        0.5
      );
      updates.push(s.update);
    } else if (kind === 'cityGlow') {
      const s = stream(
        g,
        24,
        '#ffcf8a',
        0.075,
        (i, t, o) => {
          const a = R(i * 4.3 + 1) * 6.2832 + Math.sin(t * 0.05 + i) * 0.1;
          const r = 2.6 + R(i * 6.7 + 2) * 3.9;
          o.set(Math.cos(a) * r, 0.3 + R(i * 3.1) * 2.8, Math.sin(a) * r);
        },
        0.24
      );
      updates.push(s.update);
      const mat = s.material;
      updates.push((t) => {
        mat.opacity = 0.14 + WU.lit.value * 0.52 + Math.sin(t * 1.3) * 0.03;
      });
    } else {
      const s = stream(
        g,
        18,
        '#dfeaf4',
        0.55,
        (i, t, o) => {
          const a = R(i * 3.1 + 6) * 6.2832 + Math.sin(t * 0.05 + i) * 0.1;
          const r = 4.6 + R(i * 5.7 + 1) * 2.6;
          o.set(
            Math.cos(a) * r,
            1.0 + R(i * 2.9) * 2.4 + Math.sin(t * 0.18 + i) * 0.16,
            Math.sin(a) * r
          );
        },
        0.11,
        false
      );
      updates.push(s.update);
    }
  }
  return updates;
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                  */
/* ------------------------------------------------------------------ */

function keyAngle(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % 100003;
  }
  return (h / 100003) * 6.2832;
}

/**
 * Applies the shared crafted-diorama layer to a landmark group: stratified
 * base rim, biome ground cover, a secondary anchor prop, micro-weather and
 * spatial audio metadata. Tree instances are batched at the end.
 */
export function applyDioramaUpgrade(key: string, group: THREE.Group): THREE.Group {
  const profile = getSiteProfile(key);
  const angle = keyAngle(key) + 0.6;

  addCraftedRim(group, profile);
  addBaseScatter(group, profile);
  addTreeRing(group, profile, angle);
  const updates = addAnchor(group, profile, angle);
  finalizeTreeBatch(group);

  const fx = addWeatherFx(group, profile);
  for (let i = 0; i < fx.length; i++) updates.push(fx[i]);

  const prev = group.userData.tick as Tick | undefined;
  group.userData.tick = (t: number, dt: number) => {
    if (prev) prev(t, dt);
    for (let i = 0; i < updates.length; i++) updates[i](t);
  };
  group.userData.audioProfile = profile.audio;
  group.userData.biome = profile.biome;
  return group;
}
