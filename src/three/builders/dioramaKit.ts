import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {
  AmbientEvent,
  AmbientSiteProfile,
  LandmarkBiome,
  SpatialAudioSource,
} from '../../types/citylit';
import { WU, getSoftTexture, normalMapsActive, waterize } from '../shaders';
import {
  add,
  C,
  CB,
  finalizeContactShadows,
  finalizeTreeBatch,
  G,
  grassTufts,
  instancedMeshes,
  Mc,
  mergeByMaterial,
  MGlass,
  MSteel,
  MStone,
  MWood,
  R,
  scatterRocks,
  stampContactShadowsFromMeshes,
  stream,
  surfaceDetail,
  swayItems,
  tree,
  weatherVertexColors,
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
  /** Marks landmarks with their own bespoke square-block treatment (e.g. cloud bank). */
  square?: boolean;
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
    square: true,
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
  return SITE_PROFILES[normalizeProfileKey(key)] ?? FALLBACK_PROFILE;
}

function normalizeProfileKey(key: string): string {
  return key.replace(/[’‘`]/g, "'");
}

export function hasSiteProfile(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(SITE_PROFILES, normalizeProfileKey(key));
}

/* ------------------------------------------------------------------ */
/* Crafted base rim                                                    */
/* ------------------------------------------------------------------ */

let rimMaterial: THREE.MeshStandardMaterial | null = null;

function getRimMaterial(): THREE.MeshStandardMaterial {
  if (!rimMaterial) {
    rimMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.03,
      ...surfaceDetail('stone', 0.03),
    });
    rimMaterial.userData.sharedResource = true;
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
    // Broad terrain undulation plus a soft contact shadow where the ground
    // meets the carved rim on both sides of the band.
    const macro = 1 + 0.05 * Math.sin(x * 0.38 + z * 0.27) + 0.03 * Math.sin(x * 0.83 - z * 0.61);
    const contact = 1 - 0.16 * Math.max(0, 1 - Math.min(u, 1 - u) * 7);
    c.multiplyScalar((ao + grain) * macro * contact);
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
    const grain =
      1 +
      0.07 * Math.sin(x * 6.1 + seed) +
      0.05 * Math.sin(z * 8.3 + y * 13) +
      0.035 * Math.sin(y * 46 + x * 1.7) +
      0.025 * Math.sin(x * 23 - z * 19 + y * 5);
    // Darker seams at band boundaries and scattered pebble speckle read as real strata.
    const bandPos = f - Math.floor(f);
    const seam = Math.max(0, 1 - Math.min(bandPos, 1 - bandPos) * 9);
    const pebble = Math.pow(Math.max(0, Math.sin(x * 13.7 + z * 11.3 + y * 7.1)), 16);
    c.multiplyScalar(grain * (1 - seam * 0.16) + pebble * 0.12);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.deleteAttribute('uv');
}

/** Square cutaway block with layered earth walls, used for the estate dioramas. */
function addSquareRim(g: THREE.Group, profile: SiteProfile): void {
  const [top, edge, band, wall] = profile.rim;
  // Subdivided so the carved lip and the two small ledges are real geometry,
  // not just painted bands — still one mesh and one material.
  const geo = new THREE.BoxGeometry(16.8, 1.2, 16.8, 10, 24, 10).translate(0, -0.56, 0);
  paintStrata(geo, [wall, band, edge, edge], 3.4);
  const pos = geo.attributes.position;
  const col = geo.attributes.color as THREE.BufferAttribute;
  const cTop = new THREE.Color(top);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > 0.03) {
      // Erode the perimeter of the top face so it reads as a cut slab.
      const perimeter = Math.max(Math.abs(x), Math.abs(z)) / 8.4;
      const lip = Math.max(0, (perimeter - 0.8) / 0.2);
      const chip = Math.sin(x * 4.7 + z * 3.1) * lip;
      pos.setX(i, x * (1 - 0.012 * lip) + 0.035 * chip);
      pos.setZ(i, z * (1 - 0.012 * lip) + 0.021 * chip);
      pos.setY(i, y - lip * (0.018 + 0.014 * Math.sin(x * 7.3 - z * 5.9)));
      // Macro terrain variation, a faint plaza/cross-path accent and contact
      // darkening where the top surface meets the cut wall.
      const macro = 1 + 0.045 * Math.sin(x * 0.47 + z * 0.29) + 0.03 * Math.sin(x * 0.93 - z * 0.71);
      const plaza = Math.max(0, 1 - Math.hypot(x, z) / 3.4) * 0.09;
      const path = Math.exp(-Math.min(Math.abs(x), Math.abs(z)) * 1.7) * 0.055;
      const contact = 1 - 0.2 * Math.max(0, (perimeter - 0.82) / 0.18);
      const tone = (macro + plaza + path) * contact;
      col.setXYZ(
        i,
        Math.min(1, cTop.r * tone),
        Math.min(1, cTop.g * tone),
        Math.min(1, cTop.b * tone)
      );
    } else if (y > -0.36) {
      // Shallow stepped ledges on the four walls give the strata relief.
      const step = y > -0.14 ? 0.055 : 0.026;
      if (Math.abs(x) > 8.2) pos.setX(i, x + Math.sign(x) * step);
      if (Math.abs(z) > 8.2) pos.setZ(i, z + Math.sign(z) * step);
      // Contact shade just under the lip where wall meets ground.
      const contact = 1 - 0.18 * Math.max(0, 1 - Math.abs(y + 0.02) / 0.16);
      col.setXYZ(i, col.getX(i) * contact, col.getY(i) * contact, col.getZ(i) * contact);
    }
  }
  col.needsUpdate = true;
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  weatherVertexColors(geo, { ao: 0.16, exposure: 0.06, grain: 0.05, aoSpan: 1.2 });
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, getRimMaterial());
  mesh.receiveShadow = true;
  g.add(mesh);
}

function addCraftedRim(g: THREE.Group, profile: SiteProfile): void {
  // The square stratified block is the house style for every landmark; the old
  // circular rim is retained only for profiles that explicitly opt back in.
  if (profile.square !== false) {
    addSquareRim(g, profile);
    return;
  }
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

/** Fill the corners of the square block with sea so coastal scenes read as water-filled cuts. */
function addSquareWaterPlate(g: THREE.Group): void {
  const geo = new THREE.PlaneGeometry(16.2, 16.2, 32, 32).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const deep = new THREE.Color('#176a8f');
  const shallow = new THREE.Color('#46b9c4');
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    tmp.copy(shallow).lerp(deep, Math.min(1, Math.max(0, (r - 1.5) / 6.5)));
    // Slow shader-independent variation reads as shallows and depth bands;
    // the edge darkens where the water laps against the cut wall.
    const swell = 1 + 0.06 * Math.sin(x * 0.52 + z * 0.31) + 0.035 * Math.cos(x * 0.91 - z * 0.74);
    const edge = 1 - 0.22 * Math.max(0, (r - 6.6) / 1.5);
    cols[i * 3] = tmp.r * swell * edge;
    cols[i * 3 + 1] = tmp.g * swell * edge;
    cols[i * 3 + 2] = tmp.b * swell * edge;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const mat = waterize(
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.22 })
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.06;
  mesh.userData.noShadow = true;
  g.add(mesh);
}

/* ------------------------------------------------------------------ */
/* Floating clouds — a signature of the reference miniature look       */
/* ------------------------------------------------------------------ */

let dioramaCloudMat: THREE.SpriteMaterial | null = null;

/**
 * One soft, shared sprite material for all cloud puffs. Tinted toward the
 * current sky uniform and alpha-mapped with the shared radial texture, the
 * puffs dissolve at their edges instead of reading as solid balloons.
 */
function getDioramaCloudMat(): THREE.SpriteMaterial {
  if (!dioramaCloudMat) {
    const tint = new THREE.Color('#f4f8fc').lerp(WU.sky.value, 0.24);
    dioramaCloudMat = new THREE.SpriteMaterial({
      map: getSoftTexture(),
      color: tint,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      fog: true,
    });
    dioramaCloudMat.userData.sharedResource = true;
    dioramaCloudMat.userData.noDissolve = true;
  }
  return dioramaCloudMat;
}

function addDioramaClouds(g: THREE.Group): Update[] {
  const updates: Update[] = [];
  const mat = getDioramaCloudMat();
  // Fewer but much larger puffs: two drifting banks of three overlapping
  // sprites, no shadows and no geometry to merge.
  const specs: ReadonlyArray<readonly [number, number, number, number]> = [
    [-4.4, 5.5, -3.9, 1],
    [4.4, 5.6, -3.5, 1.15],
  ];
  specs.forEach(([bx, by, bz, s], i) => {
    const cluster = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Sprite(mat);
      const width = s * (2.5 + R(i * 13 + j) * 0.9);
      puff.scale.set(width, width * (0.46 + R(i * 17 + j) * 0.12), 1);
      puff.position.set(
        (j - 1) * s * 1.05 + (R(i * 7 + j) - 0.5) * 0.3,
        (R(i * 11 + j) - 0.5) * s * 0.34,
        (R(i * 19 + j) - 0.5) * s * 0.4
      );
      puff.userData.noShadow = true;
      cluster.add(puff);
    }
    cluster.position.set(bx, by, bz);
    g.add(cluster);
    updates.push((t) => {
      cluster.position.x = bx + Math.sin(t * 0.14 + i) * 0.32;
      cluster.position.y = by + Math.sin(t * 0.09 + i * 1.7) * 0.08;
    });
  });
  return updates;
}

/* ------------------------------------------------------------------ */
/* Base scatter: rim boulders + biome ground cover                     */
/* ------------------------------------------------------------------ */

function addBaseScatter(g: THREE.Group, profile: SiteProfile): void {
  const [baseRocks, basePlants] = profile.count;
  const rockCount = Math.round(baseRocks * 1.3);
  const plantCount = Math.round(basePlants * 1.25);
  if (rockCount <= 0 && plantCount <= 0) return;
  // Water-covered sites keep their scatter on the rim; interior props would
  // otherwise float on the sea plate.
  const hasWaterPlate = profile.biome === 'coastal' || profile.biome === 'wetland';

  const detailGroup = new THREE.Group();
  if (rockCount > 0) {
    const items: InstanceTransform[] = [];
    for (let i = 0; i < rockCount; i++) {
      const a = (i / rockCount) * 6.2832 + R(i * 7.1 + 3) * 0.55;
      const inner = !hasWaterPlate && i % 3 === 2;
      const r = inner ? 2.8 + Math.sqrt(R(i * 2.1 + 17)) * 3.5 : 7.1 + R(i * 3.7 + 9) * 0.85;
      const size = inner ? 0.72 : 1;
      items.push({
        x: Math.cos(a) * r,
        y: 0.2,
        z: Math.sin(a) * r,
        ry: R(i + 4) * 6.28,
        sx: (0.3 + R(i + 5) * 0.38) * size,
        sy: (0.2 + R(i + 6) * 0.24) * size,
        sz: (0.3 + R(i + 7) * 0.38) * size,
      });
    }
    if (!hasWaterPlate) {
      // Two faint crossing paths of flat stones, batched into the same rock
      // instance draw. Urban sites get a denser plaza-like scattering.
      const paving = profile.biome === 'urban' ? 16 : 9;
      for (let i = 0; i < paving; i++) {
        const along = (i / Math.max(1, paving - 1) - 0.5) * 6.2;
        const cross = i % 2 === 0;
        items.push({
          x: cross ? along : (R(i + 23) - 0.5) * 0.5,
          y: 0.205,
          z: cross ? (R(i + 31) - 0.5) * 0.5 : along,
          ry: R(i + 17) * 6.28,
          sx: 0.34 + R(i + 19) * 0.16,
          sy: 0.025 + R(i + 29) * 0.012,
          sz: 0.3 + R(i + 37) * 0.14,
        });
      }
    }
    scatterRocks(detailGroup, items, profile.rock[0], profile.rock[1]);
  }

  const plants = profile.plants;
  if (plantCount > 0 && plants && plants.length > 0) {
    const items: InstanceTransform[] = [];
    for (let i = 0; i < plantCount; i++) {
      const a = (i / plantCount) * 6.2832 + R(i * 5.3 + 2) * 0.8;
      const inner = !hasWaterPlate && i % 3 === 1;
      const r = inner ? 2.6 + Math.sqrt(R(i * 1.7 + 11)) * 3.4 : 6.9 + R(i * 2.9 + 1) * 0.65;
      const size = inner ? 0.78 : 1;
      items.push({
        x: Math.cos(a) * r,
        y: 0.19,
        z: Math.sin(a) * r,
        ry: R(i) * 6.28,
        sx: (0.7 + R(i + 3) * 0.55) * size,
        sy: (0.75 + R(i + 4) * 0.7) * size,
        sz: (0.7 + R(i + 5) * 0.55) * size,
      });
    }
    grassTufts(detailGroup, items, plants);
  }

  const lod = new THREE.LOD();
  lod.addLevel(detailGroup, 0);
  lod.addLevel(new THREE.Group(), 24.5);
  g.add(lod);
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
  mergeByMaterial(grp);
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
  mergeByMaterial(grp);
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
  mergeByMaterial(wheel);
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
  mergeByMaterial(grp);
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
  mergeByMaterial(grp);
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
/* Site-specific micro motion                                          */
/* ------------------------------------------------------------------ */

/**
 * Small, site-flavoured streams layered on top of the biome FX. All use the
 * zero-allocation `stream()` helper: the fill callback receives WU.t and
 * writes into a shared vector, wind comes from WU.wind, and particle counts
 * follow the quality path selected by configureTextureQuality().
 */
function addSiteMotion(g: THREE.Group, key: string, profile: SiteProfile, angle: number): Update[] {
  const updates: Update[] = [];
  const detailed = normalMapsActive();

  // Masonry landmarks with visible hearths get a slow wispy chimney plume.
  if (key.includes('Union Buildings') || key.includes('Voortrekker') || key.includes('Constantia')) {
    const sx = Math.cos(angle + 0.8) * 2.2;
    const sz = Math.sin(angle + 0.8) * 2.2;
    const s = stream(
      g,
      detailed ? 12 : 7,
      '#e3e9ec',
      0.14,
      (i, t, o) => {
        const u = (t * 0.085 + R(i * 5.3 + 1)) % 1;
        o.set(
          sx + WU.wind.value * u * 0.55 + Math.sin(t * 0.7 + i) * 0.06,
          1.0 + u * 1.7,
          sz + Math.sin(t * 0.5 + i * 1.7) * 0.05
        );
      },
      0.17,
      false
    );
    updates.push(s.update);
  }

  if (profile.biome === 'desert' || profile.biome === 'savannah') {
    // Ground-hugging dust eddies that bend with the same wind as the trees.
    const s = stream(
      g,
      detailed ? 18 : 10,
      '#d9b98a',
      0.07,
      (i, t, o) => {
        const a = R(i * 4.1 + 2) * 6.2832 + t * 0.12 * WU.wind.value;
        const r = 3.2 + R(i * 2.7 + 5) * 3.1 + Math.sin(t * 0.5 + i) * 0.18;
        o.set(
          Math.cos(a) * r,
          0.25 + R(i * 3.3) * 0.5 + Math.sin(t * 0.9 + i) * 0.08,
          Math.sin(a) * r
        );
      },
      0.26
    );
    updates.push(s.update);
  }

  if (profile.biome === 'waterfall' || profile.fx.includes('foam')) {
    // Foam flecks fall away from the authored waterfall anchor (or the centre
    // of a coastal cut) and fade out with the existing stream opacity curve.
    const anchor = WATERFALL_ANCHORS[key] ?? [0, 1.2, 0];
    const s = stream(
      g,
      detailed ? 16 : 9,
      '#eafaff',
      0.09,
      (i, t, o) => {
        const u = (t * 0.28 + R(i * 7.1)) % 1;
        const a = R(i * 3.9 + 2) * 6.2832;
        const spread = u * (0.5 + R(i * 5.3) * 0.7);
        o.set(
          anchor[0] + Math.cos(a) * spread + WU.wind.value * u * 0.3,
          anchor[1] - u * 1.1 + Math.sin(t * 1.2 + i) * 0.04,
          anchor[2] + Math.sin(a) * spread
        );
      },
      0.34
    );
    updates.push(s.update);
  }

  return updates;
}

/* ------------------------------------------------------------------ */
/* Facade kit — cheap reusable details for landmark builders           */
/* ------------------------------------------------------------------ */

export interface FacadeWindowSpec {
  /** Window centre in the parent group's local space. */
  x: number;
  y: number;
  z: number;
  /** Nominal opening size (defaults: 0.42 x 0.6). */
  width?: number;
  height?: number;
  /** Recess depth behind the wall plane (default 0.12). */
  depth?: number;
  frame?: THREE.ColorRepresentation;
  glass?: THREE.ColorRepresentation;
  rotationY?: number;
}

/**
 * Recessed dark-glass window with a stone frame. Returns the detail group;
 * several windows can be collapsed with `mergeByMaterial(parent)` because
 * all helpers here use cached materials and cached rounded-box geometry.
 */
export function facadeWindow(g: THREE.Group, spec: FacadeWindowSpec): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(spec.x, spec.y, spec.z);
  grp.rotation.y = spec.rotationY ?? 0;
  g.add(grp);
  const w = spec.width ?? 0.42;
  const h = spec.height ?? 0.6;
  const d = spec.depth ?? 0.12;
  const frame = MStone(spec.frame ?? '#c2b69c', 0.86, 0.012);
  const glass = MGlass(spec.glass ?? '#10242f', 0.82, 0.05);
  const bar = 0.045;
  add(grp, CB(w * 0.86, h * 0.88, 0.012, 0.004), glass, 0, 0, -d * 0.5);
  add(grp, CB(w, bar, d + 0.02, 0.008), frame, 0, h * 0.5, 0);
  add(grp, CB(w, bar, d + 0.02, 0.008), frame, 0, -h * 0.5, 0);
  add(grp, CB(bar, h, d + 0.02, 0.008), frame, -w * 0.5, 0, 0);
  add(grp, CB(bar, h, d + 0.02, 0.008), frame, w * 0.5, 0, 0);
  add(grp, CB(w * 0.5, 0.018, d * 0.9, 0.006), frame, 0, -h * 0.5 - 0.028, d * 0.1);
  return mergeByMaterial(grp);
}

export interface CorniceBandSpec {
  /** Band centre in the parent group's local space. */
  x: number;
  y: number;
  z: number;
  width?: number;
  depth?: number;
  /** Total band height including the projecting lip (default 0.14). */
  height?: number;
  color?: THREE.ColorRepresentation;
  rotationY?: number;
}

/** String course / cornice: one merged stone mesh with a projecting lip. */
export function corniceBand(g: THREE.Group, spec: CorniceBandSpec): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(spec.x, spec.y, spec.z);
  grp.rotation.y = spec.rotationY ?? 0;
  g.add(grp);
  const w = spec.width ?? 1.6;
  const d = spec.depth ?? 0.3;
  const h = spec.height ?? 0.14;
  const stone = MStone(spec.color ?? '#cfc4aa', 0.88, 0.014);
  add(grp, CB(w, h, d, 0.012), stone, 0, 0, 0);
  add(grp, CB(w * 1.04, h * 0.3, d * 1.12, 0.01), stone, 0, h * 0.55, d * 0.04);
  return mergeByMaterial(grp);
}

export interface DoorSurroundSpec {
  /** Door centre in the parent group's local space. */
  x: number;
  y: number;
  z: number;
  width?: number;
  height?: number;
  depth?: number;
  jamb?: THREE.ColorRepresentation;
  panel?: THREE.ColorRepresentation;
  rotationY?: number;
}

/** Jambs, lintel, threshold and a recessed dark door leaf (one merged mesh per material). */
export function doorSurround(g: THREE.Group, spec: DoorSurroundSpec): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(spec.x, spec.y, spec.z);
  grp.rotation.y = spec.rotationY ?? 0;
  g.add(grp);
  const w = spec.width ?? 0.72;
  const h = spec.height ?? 1.12;
  const d = spec.depth ?? 0.14;
  const jamb = MStone(spec.jamb ?? '#b9ad94', 0.86, 0.014);
  const panel = MWood(spec.panel ?? '#4a3424', 0.88);
  const bar = 0.075;
  add(grp, CB(w * 0.92, h * 0.97, 0.02, 0.005), panel, 0, 0, -d * 0.45);
  add(grp, CB(bar, h + bar, d, 0.012), jamb, -w * 0.5, 0, 0);
  add(grp, CB(bar, h + bar, d, 0.012), jamb, w * 0.5, 0, 0);
  add(grp, CB(w + bar * 2, bar, d, 0.012), jamb, 0, h * 0.5 + bar * 0.5, 0);
  add(grp, CB(w + bar * 2, 0.03, d * 1.2, 0.008), jamb, 0, -h * 0.5 - 0.015, d * 0.1);
  return mergeByMaterial(grp);
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
 * Exact world positions for the modelling team's waterfall meshes, so the
 * cascade's voice comes from the ribbon rather than a generic rim slot.
 */
const WATERFALL_ANCHORS: Record<string, readonly [number, number, number]> = {
  'Drakensberg Amphitheatre': [-2.4, 2.2, -3.05],
  'Augrabies Falls': [0, 2.2, -3.95],
  "Bourke's Luck Potholes": [0, 0.8, 0],
  'Bloukrans Bridge': [0, 0.6, 0],
  'Gariep Dam': [0, 1.2, 0.4],
  'Hartbeespoort Dam': [0, 1.0, -0.15],
};

/**
 * Places the site's audible features around the diorama. Waterfalls and surf
 * sit on the same rim as their visual counterparts; bird and insect voices
 * perch on opposite sides so orbiting the camera sweeps them across the mix.
 */
function buildSpatialSources(
  key: string,
  profile: SiteProfile,
  angle: number
): readonly SpatialAudioSource[] {
  const sources: SpatialAudioSource[] = [];
  const at = (radius: number, heading: number, y: number): [number, number, number] => [
    Math.cos(heading) * radius,
    y,
    Math.sin(heading) * radius,
  ];
  const { biome } = profile;

  if (biome === 'waterfall') {
    sources.push({
      id: 'falls',
      kind: 'waterfall',
      position: WATERFALL_ANCHORS[key] ?? at(3.6, angle + 0.35, 1.6),
      gain: 0.32,
      radius: 7,
    });
  } else if (biome === 'coastal' || biome === 'wetland') {
    sources.push({
      id: 'surf',
      kind: 'surf',
      position: at(5.4, angle + Math.PI, 0.2),
      gain: 0.26,
      radius: 8,
    });
  }

  if (
    biome === 'waterfall' ||
    biome === 'coastal' ||
    biome === 'wetland' ||
    biome === 'savannah' ||
    biome === 'mountain' ||
    biome === 'urban' ||
    biome === 'desert'
  ) {
    sources.push({
      id: 'birds-near',
      kind: 'birds',
      position: at(4.2, angle + 1.35, 2.7),
      gain: 2.1,
      radius: 6,
    });
    sources.push({
      id: 'birds-far',
      kind: 'birds',
      position: at(5.1, angle - 1.9, 3.6),
      gain: 1.5,
      radius: 5.5,
    });
  }

  if (biome === 'desert' || biome === 'savannah' || biome === 'wetland') {
    sources.push({
      id: 'insects',
      kind: 'insects',
      position: at(4.4, angle + 0.8, 0.5),
      gain: 1.4,
      radius: 6,
    });
  }

  return sources;
}

function addSoaringBirds(g: THREE.Group, profile: SiteProfile, seedAngle: number): Update[] {
  const { biome } = profile;
  if (
    biome !== 'mountain' &&
    biome !== 'coastal' &&
    biome !== 'waterfall' &&
    biome !== 'savannah' &&
    biome !== 'wetland'
  ) {
    return [];
  }

  const count = biome === 'coastal' || biome === 'wetland' ? 4 : 3;
  const birdCol = biome === 'coastal' ? '#eef3f8' : '#2f2924';
  const mat = new THREE.MeshBasicMaterial({ color: birdCol, side: THREE.DoubleSide });
  const wingGeo = new THREE.BufferGeometry();
  const verts = new Float32Array([0, 0, 0.04, 0.16, 0.03, -0.04, 0.04, 0, -0.05]);
  wingGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  wingGeo.computeVertexNormals();

  const birdsGroup = new THREE.Group();
  const lod = new THREE.LOD();
  lod.addLevel(birdsGroup, 0);
  lod.addLevel(new THREE.Group(), 25.5);
  g.add(lod);

  const specs: Array<{
    root: THREE.Group;
    left: THREE.Mesh;
    right: THREE.Mesh;
    radius: number;
    baseY: number;
    speed: number;
    phase: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const root = new THREE.Group();
    const left = new THREE.Mesh(wingGeo, mat);
    const right = new THREE.Mesh(wingGeo, mat);
    right.scale.x = -1;
    left.userData.noShadow = true;
    right.userData.noShadow = true;
    root.add(left, right);
    birdsGroup.add(root);
    specs.push({
      root,
      left,
      right,
      radius: 2.6 + R(i * 5.1 + seedAngle) * 3.1,
      baseY: 4.5 + R(i * 3.7 + 2) * 1.9,
      speed: 0.22 + R(i * 2.9 + 1) * 0.14,
      phase: seedAngle + i * 2.1,
    });
  }

  return [
    (t: number) => {
      for (let i = 0; i < specs.length; i++) {
        const b = specs[i];
        const ang = b.phase + t * b.speed;
        b.root.position.set(
          Math.cos(ang) * b.radius,
          b.baseY + Math.sin(t * 0.9 + b.phase) * 0.22,
          Math.sin(ang) * b.radius
        );
        b.root.rotation.y = -ang;
        const flap = Math.sin(t * 5.2 + b.phase * 3) * 0.42;
        b.left.rotation.z = flap;
        b.right.rotation.z = -flap;
      }
    },
  ];
}

/**
 * Applies the shared crafted-diorama layer to a landmark group: stratified
 * base rim, biome ground cover, a secondary anchor prop, micro-weather and
 * spatial audio metadata. Tree instances are batched at the end.
 */
export function applyDioramaUpgrade(key: string, group: THREE.Group): THREE.Group {
  // LANDMARKS keys use curly apostrophes (Bourke’s, Chapman’s) while the
  // curated site profiles use straight ones. Normalize once so both lookups
  // resolve to the intended biome, rim palette, FX and spatial audio.
  key = normalizeProfileKey(key);
  const profile = getSiteProfile(key);
  const angle = keyAngle(key) + 0.6;

  addCraftedRim(group, profile);
  if (profile.biome === 'coastal' || profile.biome === 'wetland') {
    addSquareWaterPlate(group);
  }
  addBaseScatter(group, profile);
  addTreeRing(group, profile, angle);
  const updates = addAnchor(group, profile, angle);
  finalizeTreeBatch(group);
  stampContactShadowsFromMeshes(group);
  finalizeContactShadows(group);

  // Groot Constantia already has its own bespoke cloud bank.
  if (!profile.square) {
    const clouds = addDioramaClouds(group);
    for (let i = 0; i < clouds.length; i++) updates.push(clouds[i]);
  }

  const fx = addWeatherFx(group, profile);
  for (let i = 0; i < fx.length; i++) updates.push(fx[i]);
  const motion = addSiteMotion(group, key, profile, angle);
  for (let i = 0; i < motion.length; i++) updates.push(motion[i]);
  const birds = addSoaringBirds(group, profile, angle);
  for (let i = 0; i < birds.length; i++) updates.push(birds[i]);

  const prev = group.userData.tick as Tick | undefined;
  group.userData.hasAnimatedShadowMeshes =
    Boolean(prev) || profile.anchor === 'windpump' || swayItems.length > 0;
  group.userData.tick = (t: number, dt: number) => {
    if (prev) prev(t, dt);
    for (let i = 0; i < updates.length; i++) updates[i](t);
  };
  group.userData.audioProfile = {
    ...profile.audio,
    sources: buildSpatialSources(key, profile, angle),
  } satisfies AmbientSiteProfile;
  group.userData.biome = profile.biome;
  return group;
}
