import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EASTER_EGGS } from '../../data/easterEggs';
import { REFERENCE_HEIGHTS, SCALE_FACTS } from '../../data/scaleFacts';
import { WILDLIFE } from '../../data/wildlife';
import type {
  AmbientEvent,
  AmbientSiteProfile,
  LandmarkBiome,
  ScaleReferenceKind,
  SpatialAudioSource,
} from '../../types/citylit';
import {
  applyDissolveToShader,
  WU,
  flagWindy,
  getSoftTexture,
  normalMapsActive,
  waterize,
} from '../shaders';
import { MAX_REFERENCE_UNITS, MIN_REFERENCE_UNITS } from '../../lib/scale';
import { getSeasonMonth, isSpeciesBlooming } from '../../lib/season';
import { createAnimalScaffold, getAnimalSeasonMonth } from './animalKit';
import { createCreatureLayer, isCreaturePilotSite } from '../creatures/layer';
import {
  add,
  B,
  boostBuiltVibrancy,
  C,
  camelthorn,
  CB,
  finalizeContactShadows,
  finalizeTreeBatch,
  fynbos,
  G,
  grassTufts,
  instancedMeshes,
  jacaranda,
  M,
  marula,
  Mc,
  milkwood,
  protea,
  mergeByMaterial,
  MGlass,
  MSteel,
  litWindowMaterial,
  MStone,
  MWood,
  PANE_VARIANTS,
  R,
  scatterRocks,
  silverTree,
  stampContactShadow,
  stampContactShadowsFromMeshes,
  stream,
  surfaceDetail,
  swayItems,
  tree,
  yellowwood,
  weatherVertexColors,
  windowPaneMaterial,
  type InstanceTransform,
} from './primitives';
import type { StreetLampAnchor } from '../streetLights';

type Update = (t: number, dt: number) => void;
type Tick = (t: number, dt: number) => void;
type AnchorKind = 'jetty' | 'windpump' | 'bollards' | 'deck' | 'reedbed';

/** Structural mirror of the engine's InteractiveTarget, without importing the engine. */
interface LayerTarget {
  object: THREE.Object3D;
  kind: 'wildlife' | 'egg';
  id: string;
  text: string;
  touchRadius: number;
  isEnabled?: () => boolean;
}

interface ScaleReferenceEntry {
  kind: ScaleReferenceKind;
  object: THREE.Object3D;
}
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

/** Named species selectable through `SITE_PROFILES.ring` (Batch 2 vocabulary). */
type SiteSpecies =
  | 'fynbos'
  | 'silverTree'
  | 'protea'
  | 'marula'
  | 'yellowwood'
  | 'jacaranda'
  | 'camelthorn'
  | 'milkwood';

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
  /**
   * Optional named-species vocabulary for the ring. When present the ring is
   * built from the shared species builders in primitives.ts (instanced per
   * material) instead of the numeric generic tree kinds.
   */
  species?: readonly SiteSpecies[];
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
    species: ['fynbos', 'silverTree', 'protea'],
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
    species: ['jacaranda'],
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
    ring: [3, 1, 0.6],
    species: ['fynbos', 'protea'],
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
    species: ['marula'],
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
    species: ['marula'],
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
    ring: [4, 1, 0.7],
    species: ['camelthorn'],
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
    ring: [4, 1, 0.6],
    species: ['yellowwood', 'milkwood'],
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
    ring: [4, 1, 0.6],
    species: ['yellowwood', 'milkwood'],
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

/**
 * Derives a surface-feature colour for a given (x, z) position on the rim
 * top, blending the site's rock and plant palette so the rim reads as an
 * extension of the terrain rather than a uniform stone slab. Used both for
 * the top face colour and for carrying the edge colour into the wall band.
 */
function rimEdgeColor(
  x: number,
  z: number,
  profile: SiteProfile,
  tmp: THREE.Color
): THREE.Color {
  const [top] = profile.rim;
  const [rock0, rock1] = profile.rock;
  const plants = profile.plants;
  const isCoastalOrWet = profile.biome === 'coastal' || profile.biome === 'wetland';
  const isWaterfall = profile.biome === 'waterfall';

  // Base: the rim top colour.
  tmp.set(top);

  // Blend in terrain rock tones at the outer ring so the stone slab reads as
  // the same geological material as the landscape edge above it.
  const outerR = Math.max(Math.abs(x), Math.abs(z));
  const edgeBlend = Math.max(0, (outerR - 5.5) / 2.9); // 0 at centre → 1 at rim lip

  const cRock = new THREE.Color(rock0).lerp(new THREE.Color(rock1), 0.5);
  tmp.lerp(cRock, edgeBlend * 0.55);

  // Blend in ground-cover green for vegetated biomes.
  if (plants && plants.length > 0 && !isCoastalOrWet) {
    const cPlant = new THREE.Color(plants[Math.floor(edgeBlend * (plants.length - 0.001))]);
    tmp.lerp(cPlant, edgeBlend * 0.28 * (1 - edgeBlend));
  }

  // Water-biome edge: tint toward shallow water colour so the sea/river appears
  // to lap right against the cut slab wall.
  if (isCoastalOrWet) {
    const cWater = new THREE.Color(profile.biome === 'wetland' ? '#607767' : '#2d7a89');
    tmp.lerp(cWater, edgeBlend * 0.42);
  } else if (isWaterfall) {
    // Waterfall sites: carry a damp, mossy tone to the perimeter.
    const cDamp = new THREE.Color('#4a7060');
    tmp.lerp(cDamp, edgeBlend * 0.28);
  }

  return tmp;
}

/** Square cutaway block with layered earth walls, used for the estate dioramas. */
export function addSquareRim(g: THREE.Group, profile: SiteProfile): void {
  const [top, edge, band, wall] = profile.rim;
  // Subdivided so the carved lip and the two small ledges are real geometry,
  // not just painted bands — still one mesh and one material.
  const geo = new THREE.BoxGeometry(16.8, 1.2, 16.8, 10, 24, 10).translate(0, -0.56, 0);
  paintStrata(geo, [wall, band, edge, edge], 3.4);
  const pos = geo.attributes.position;
  const col = geo.attributes.color as THREE.BufferAttribute;
  const cTop = new THREE.Color(top);
  const cTmp = new THREE.Color();
  const cEdge = new THREE.Color(edge);
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
      const macro =
        1 + 0.045 * Math.sin(x * 0.47 + z * 0.29) + 0.03 * Math.sin(x * 0.93 - z * 0.71);
      const plaza = Math.max(0, 1 - Math.hypot(x, z) / 3.4) * 0.09;
      const path = Math.exp(-Math.min(Math.abs(x), Math.abs(z)) * 1.7) * 0.055;
      const contact = 1 - 0.2 * Math.max(0, (perimeter - 0.82) / 0.18);
      const tone = (macro + plaza + path) * contact;
      // Blend a surface-feature colour toward the perimeter so the terrain
      // edge continues seamlessly onto the top of the rim slab.
      rimEdgeColor(x, z, profile, cTmp);
      cTop.set(top);
      cTop.lerp(cTmp, Math.max(0, (perimeter - 0.3) / 0.7) * 0.72);
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
      // Carry the terrain-edge feature colour into the top band of the wall
      // face (y > -0.14) so rivers, roads and soil seams continue through the
      // cut rather than stopping dead at the slab edge.
      if (y > -0.14) {
        const wallBlend = Math.max(0, 1 - Math.abs(y + 0.07) / 0.07); // peaks at y≈−0.07
        rimEdgeColor(x, z, profile, cTmp);
        cEdge.set(edge);
        cEdge.lerp(cTmp, wallBlend * 0.6);
        col.setXYZ(i, cEdge.r * contact, cEdge.g * contact, cEdge.b * contact);
      } else {
        col.setXYZ(i, col.getX(i) * contact, col.getY(i) * contact, col.getZ(i) * contact);
      }
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

/* ------------------------------------------------------------------ */
/* Vibrant accent trim (shared by all 43 landmarks)                    */
/* ------------------------------------------------------------------ */

/** Three-colour accent trios; one is chosen deterministically per landmark. */
const VIBRANT_ACCENTS: readonly (readonly [string, string, string])[] = [
  ['#ef476f', '#ffd166', '#06d6a0'],
  ['#f78c2f', '#2a9d8f', '#ffd166'],
  ['#3a86ff', '#ffbe0b', '#fb5607'],
  ['#8338ec', '#06d6a0', '#ffd166'],
  ['#e4572e', '#17bebb', '#ffc914'],
  ['#118ab2', '#ef476f', '#ffd166'],
  ['#d62828', '#f77f00', '#0077b6'],
  ['#7b2cbf', '#f72585', '#4cc9f0'],
];

const HERITAGE_ACCENTS: readonly (readonly [string, string, string])[] = [
  ['#7c6a50', '#4d5258', '#9c835d'],
  ['#6b6359', '#4a564c', '#8e7b5e'],
  ['#6a5848', '#525b63', '#8c7656'],
];

function isVibrantModernSite(key: string): boolean {
  return (
    key.includes('Bo-Kaap') ||
    key.includes('Orlando') ||
    key.includes('Moses') ||
    key.includes('FNB') ||
    key.includes('Mandela Bridge') ||
    key.includes('Ponte') ||
    key.includes('Lost City') ||
    key.includes('Donkin')
  );
}

function accentFor(key: string): readonly [string, string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 100003;
  const pool = isVibrantModernSite(key) ? VIBRANT_ACCENTS : HERITAGE_ACCENTS;
  return pool[h % pool.length];
}

/**
 * Painted or patinated bronze/slate inlay along two front plinth edges plus
 * four colour-coded corner studs. Vivid polychrome trim is kept for modern
 * urban icons; heritage & wilderness monuments receive muted bronze/slate trim.
 */
function addVibrantAccents(g: THREE.Group, key: string, profile: SiteProfile): void {
  if (profile.square === false) return;
  const [primary, secondary, tertiary] = accentFor(key);
  const heritage = !isVibrantModernSite(key);
  const grp = new THREE.Group();
  const paint = M(primary, heritage ? 0.56 : 0.52, heritage ? 0.28 : 0.04);

  add(grp, CB(13.6, 0.075, 0.14, 0.02), paint, 0, 0.095, 7.7);
  add(grp, CB(0.14, 0.075, 13.6, 0.02), paint, -7.7, 0.095, 0);

  const corners: readonly (readonly [number, number])[] = [
    [-7.55, 7.55],
    [7.55, 7.55],
    [-7.55, -7.55],
    [7.55, -7.55],
  ];
  const studColors = [secondary, tertiary, primary, secondary];
  for (let i = 0; i < corners.length; i++) {
    const [x, z] = corners[i];
    add(
      grp,
      C(0.085, 0.1, 0.2, 10),
      M(studColors[i], heritage ? 0.52 : 0.48, heritage ? 0.34 : 0.06),
      x,
      0.16,
      z
    );
  }

  mergeByMaterial(grp);
  grp.traverse((obj) => {
    obj.userData.vibrantAccent = true;
  });
  g.add(grp);
}

/* ------------------------------------------------------------------ */
/* Floating-stand underside: low-poly strata rock + hanging roots       */
/* ------------------------------------------------------------------ */

let undersideMaterial: THREE.MeshStandardMaterial | null = null;

function getUndersideMaterial(): THREE.MeshStandardMaterial {
  if (!undersideMaterial) {
    undersideMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: true,
      side: THREE.DoubleSide,
      ...surfaceDetail('stone', 0.015),
    });
    undersideMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uSkyUnder = WU.sky;
      shader.uniforms.uLitUnder = WU.lit;
      shader.uniforms.uHorUnder = WU.sunHor;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform vec3 uSkyUnder;uniform float uLitUnder,uHorUnder;'
        )
        .replace(
          '#include <opaque_fragment>',
          `{
  vec3 uView = normalize(vViewPosition);
  float uRim = pow(1.0 - abs(dot(uView, normal)), 2.2);
  float strataMask = smoothstep(-8.4, -1.2, vWD.y);
  vec3 bounceCol = mix(uSkyUnder * 0.42 + vec3(0.06, 0.09, 0.14), vec3(0.45, 0.28, 0.14), uHorUnder * 0.65);
  outgoingLight += bounceCol * (0.09 + 0.12 * uLitUnder) * uRim * (0.35 + 0.65 * strataMask);
}
#include <opaque_fragment>`
        );
      applyDissolveToShader(shader, undersideMaterial!);
    };
    undersideMaterial.customProgramCacheKey = () => 'underside_rim_v1';
    undersideMaterial.userData.sharedResource = true;
  }
  return undersideMaterial;
}

/**
 * Grows the floating-island underside beneath the cut block: a tall, chunky,
 * dark rock mass of many offset strata layers, thin roots and fallen chips.
 * All of it is baked into one non-indexed, vertex-coloured geometry (one draw
 * call) with a flat-shaded material so the low-poly facets read at any scale.
 */
function addStandUnderside(g: THREE.Group, profile: SiteProfile): void {
  const [, edge, band, wall] = profile.rim;
  const positions: number[] = [];
  const colors: number[] = [];
  const cWall = new THREE.Color(wall);
  const cEdge = new THREE.Color(edge);
  const cBand = new THREE.Color(band);
  // Reuse each landmark's own rock palette (the colours of the scattered
  // rocks in its 3D model), lifted a little so the underside stays readable.
  const rockDark = new THREE.Color(profile.rock[0]).multiplyScalar(1.12);
  const rockLight = new THREE.Color(profile.rock[1]).multiplyScalar(1.08);
  const soil = new THREE.Color('#3b2a1d').lerp(rockDark, 0.3);
  const cream = new THREE.Color('#efe6d4');
  const rootBase = new THREE.Color('#4a3524');
  const rootDark = new THREE.Color('#1c130c');
  const tmp = new THREE.Color();

  // Alternating earth/stone bands with a dark soil crust at the top edge.
  // One band per ring so every layer stands out.
  const rockBands = Array.from({ length: 14 }, (_, i) => {
    if (i === 0) return soil.clone();
    if (i === 1) return soil.clone().lerp(rockDark, 0.65);
    const t = i / 13;
    const c = i % 3 === 0
      ? rockLight.clone().lerp(cWall, 0.22)
      : rockDark.clone().lerp(i % 2 ? cEdge : cBand, 0.18 + (1 - t) * 0.14);
    return c.multiplyScalar(1 - t * 0.18 + (R(i + 200) - 0.5) * 0.1).lerp(cream, 0.06);
  });
  const strata = (t: number): THREE.Color =>
    rockBands[Math.min(rockBands.length - 1, Math.floor(t * rockBands.length))];

  const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, col: THREE.Color): void => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let k = 0; k < 3; k++) colors.push(col.r, col.g, col.b);
  };
  const pushQuad = (
    a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3,
    colA: THREE.Color, colB: THREE.Color
  ): void => {
    pushTri(a, b, d, colA);
    pushTri(b, c, d, colB);
  };

  // --- layered rock mass -------------------------------------------------
  // A deep, stepped stack roughly half the stand's width, like the reference:
  // the radius widens at rings 4, 8 and 11 so craggy ledges overhang the
  // layers above them instead of reading as one smooth cone.
  const ringY = [-1.08, -1.46, -1.86, -2.28, -2.72, -3.18, -3.66, -4.16, -4.68, -5.22, -5.78, -6.36, -6.96, -7.6];
  const ringR = [8.2, 7.8, 7.3, 7.05, 7.4, 6.5, 6.1, 6.35, 5.2, 4.6, 4.85, 3.4, 2.2, 1.0];
  const SEG = 10;
  const ringPos: THREE.Vector3[][] = ringY.map((yy, k) => {
    const rot = R(k + 13.3) * Math.PI;
    const y = yy + (R(k + 2.1) - 0.5) * 0.1;
    const radius = ringR[k] + (R(k + 7.7) - 0.5) * 0.4;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j < SEG; j++) {
      const a = (j / SEG) * Math.PI * 2 + rot + (R(k * SEG + j + 21) - 0.5) * 0.26;
      const rr = radius * (0.86 + R(k * SEG + j + 41) * 0.28);
      row.push(
        new THREE.Vector3(Math.cos(a) * rr, y + (R(k * SEG + j + 61) - 0.5) * 0.22, Math.sin(a) * rr)
      );
    }
    return row;
  });
  for (let k = 0; k < ringY.length - 1; k++) {
    const base = strata((k + 0.5) / ringY.length);
    for (let j = 0; j < SEG; j++) {
      const j2 = (j + 1) % SEG;
      tmp.copy(base).multiplyScalar(0.78 + R(k * SEG * 2 + j * 3 + 1) * 0.34);
      const a = tmp.clone();
      tmp.copy(base).multiplyScalar(0.78 + R(k * SEG * 2 + j * 3 + 2) * 0.34);
      pushQuad(ringPos[k][j], ringPos[k][j2], ringPos[k + 1][j2], ringPos[k + 1][j], a, tmp);
    }
  }
  // Ragged point that closes the last ring.
  const last = ringPos[ringPos.length - 1];
  const tip = new THREE.Vector3(0, -8.7, 0);
  const tipCol = strata(0.99);
  for (let j = 0; j < SEG; j++) {
    tmp.copy(tipCol).multiplyScalar(0.72 + R(j + 81) * 0.28);
    pushTri(last[j], last[(j + 1) % SEG], tip, tmp);
  }

  // --- thin hanging roots ------------------------------------------------
  const ROOTS = 16;
  const RS = 3;
  const growRoot = (x: number, y: number, z: number, angle: number, steps: number, r0: number, seed: number): void => {
    const rings: THREE.Vector3[][] = [];
    let cx = x, cy = y, cz = z;
    for (let s = 0; s <= steps; s++) {
      const rr = r0 * (1 - (s / steps) * 0.88);
      const row: THREE.Vector3[] = [];
      for (let j = 0; j < RS; j++) {
        const ang = (j / RS) * Math.PI * 2 + seed * 0.7;
        row.push(new THREE.Vector3(cx + Math.cos(ang) * rr, cy, cz + Math.sin(ang) * rr));
      }
      rings.push(row);
      cy -= 0.42 + R(seed * 7 + s) * 0.32;
      const drift = 0.16 + R(seed * 11 + s) * 0.3;
      cx += (R(seed * 13 + s) - 0.5) * drift + Math.cos(angle) * 0.05;
      cz += (R(seed * 17 + s) - 0.5) * drift + Math.sin(angle) * 0.05;
    }
    for (let s = 0; s < steps; s++) {
      for (let j = 0; j < RS; j++) {
        const j2 = (j + 1) % RS;
        tmp.copy(rootBase).lerp(rootDark, (s / steps) * 0.85 + R(seed * 19 + s) * 0.1);
        const a = tmp.clone();
        tmp.copy(rootBase).lerp(rootDark, (s / steps) * 0.9);
        pushQuad(rings[s][j], rings[s][j2], rings[s + 1][j2], rings[s + 1][j], a, tmp);
      }
    }
  };
  for (let n = 0; n < ROOTS; n++) {
    // Start on the surface of a rock ring, not under the block, so the roots
    // look like they have grown out of the rock itself.
    const k = 1 + Math.floor(R(n * 3 + 0.3) * 7);
    const j = Math.floor(R(n * 3 + 1.7) * SEG);
    const start = ringPos[k][j];
    const a = Math.atan2(start.z, start.x);
    const x = start.x * 1.02;
    const z = start.z * 1.02;
    const y = start.y;
    const targetY = -9.2 - R(n + 33) * 1.4;
    const steps = Math.max(5, Math.round((y - targetY) / 0.58));
    growRoot(x, y, z, a, steps, 0.04 + R(n + 15.5) * 0.05, n + 1);
    if (n % 4 === 0) {
      growRoot(x * 0.98, y - steps * 0.3, z * 0.98, a + 1.1, 4, 0.022, n + 40);
    }
  }

  // --- scattered chips ----------------------------------------------------
  for (let n = 0; n < 6; n++) {
    const a = R(n + 101) * Math.PI * 2;
    const d = 8.6 + R(n + 111) * 3.0;
    const cx = Math.cos(a) * d;
    const cy = -1.5 - R(n + 121) * 6.0;
    const cz = Math.sin(a) * d;
    const sx = 0.12 + R(n + 131) * 0.22;
    const sy = 0.1 + R(n + 141) * 0.2;
    const sz = 0.12 + R(n + 151) * 0.22;
    const v = [
      new THREE.Vector3(cx, cy + sy, cz),
      new THREE.Vector3(cx + sx, cy, cz),
      new THREE.Vector3(cx, cy, cz + sz),
      new THREE.Vector3(cx - sx, cy, cz),
      new THREE.Vector3(cx, cy, cz - sz),
      new THREE.Vector3(cx, cy - sy, cz),
    ];
    const faces = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]];
    const col = strata(0.2 + R(n + 161) * 0.6);
    for (const [i, j, k] of faces) {
      tmp.copy(col).multiplyScalar(0.8 + R(n * 8 + i) * 0.3);
      pushTri(v[i], v[j], v[k], tmp);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, getUndersideMaterial());
  mesh.receiveShadow = true;
  mesh.userData.noShadow = true; // below the ground plane; skip contact-shadow stamping
  g.add(mesh);
}

/**
 * Adds thin feature-continuation strips along all four walls of the square
 * rim block. Each strip is a narrow quad band right at the slab edge (y ≈ 0)
 * whose vertex colours are sampled from the terrain surface at that edge
 * position, so rivers, roads, soil seams and vegetation borders read as
 * continuing through the cut wall instead of stopping dead at the slab face.
 *
 * The strips run from just below the slab top (y = 0) down to the contact
 * depth (~0.4 units) where they dissolve into the standard strata below.
 * One merged mesh, one draw call, shares the existing rim material.
 */
function addRimEdgeContinuity(g: THREE.Group, profile: SiteProfile): void {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const HALF = 8.4; // rim half-width
  const BAND_H = 0.38; // height of the continuation band on the wall
  const TOP_Y = 0.0; // just flush with the slab top
  const BOT_Y = TOP_Y - BAND_H;
  const SEG = 20; // segments along each edge

  const cTmp = new THREE.Color();
  const cBot = new THREE.Color(profile.rim[1]); // edge colour at the bottom of the band

  // Emit one edge of quads. `edgeFn(t)` returns the [x, z] world position on
  // the slab perimeter at parametric position t ∈ [0,1].
  const emitEdge = (edgeFn: (t: number) => [number, number], outX: number, outZ: number) => {
    const base = positions.length / 3;
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      const [x, z] = edgeFn(t);
      // Push the wall vertex inward by a hair so it sits behind the rim face.
      const wx = x + outX * 0.015;
      const wz = z + outZ * 0.015;

      // Top vertex: colour sampled from the terrain edge feature.
      rimEdgeColor(x, z, profile, cTmp);
      positions.push(wx, TOP_Y, wz);
      colors.push(cTmp.r, cTmp.g, cTmp.b);

      // Bottom vertex: fades toward the strata edge colour so the band
      // dissolves naturally into the geology below.
      const fade = cTmp.clone().lerp(cBot, 0.65);
      positions.push(wx, BOT_Y, wz);
      colors.push(fade.r, fade.g, fade.b);
    }
    for (let i = 0; i < SEG; i++) {
      const t0 = base + i * 2;
      const t1 = t0 + 2;
      const b0 = t0 + 1;
      const b1 = t1 + 1;
      // Winding: outward normals (facing away from centre).
      if (outZ > 0 || outX < 0) {
        indices.push(t0, b0, t1, t1, b0, b1);
      } else {
        indices.push(t0, t1, b0, t1, b1, b0);
      }
    }
  };

  // Front face (z = +HALF, outward = +Z)
  emitEdge((t) => [-HALF + t * HALF * 2, HALF], 0, 1);
  // Back face (z = -HALF, outward = -Z)
  emitEdge((t) => [HALF - t * HALF * 2, -HALF], 0, -1);
  // Right face (x = +HALF, outward = +X)
  emitEdge((t) => [HALF, HALF - t * HALF * 2], 1, 0);
  // Left face (x = -HALF, outward = -X)
  emitEdge((t) => [-HALF, -HALF + t * HALF * 2], -1, 0);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  const mesh = new THREE.Mesh(geo, getRimMaterial());
  mesh.receiveShadow = false;
  mesh.userData.noShadow = true;
  g.add(mesh);
}

/** A thin low-poly stream spilling over one edge, biome-calibrated. */
function addEdgeWaterfall(g: THREE.Group, angle: number, profile: SiteProfile): void {
  const rows = 10;
  const cols = 2;
  const width = 1.7;
  const topY = 0.05;
  const bottomY = -4.6;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const isWetland = profile.biome === 'wetland';
  const isWaterfall = profile.biome === 'waterfall';
  const cTop = new THREE.Color(
    isWetland ? '#98aa9e' : isWaterfall ? '#a8d4c0' : '#bad8e0'
  );
  const cBottom = new THREE.Color(
    isWetland ? '#485f54' : isWaterfall ? '#2e6b52' : '#21627b'
  );
  const tmp = new THREE.Color();

  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const y = topY + (bottomY - topY) * t;
    for (let k = 0; k <= cols; k++) {
      const u = k / cols;
      const x = 8.1 + Math.sin(t * 7 + u * 2) * 0.14 * t;
      const z = (u - 0.5) * width + Math.sin(t * 5 + u * 3) * 0.12 * t;
      positions.push(x, y, z);
      tmp.copy(cTop).lerp(cBottom, t * 0.9 + R(r * 3 + k) * 0.08);
      colors.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const a = r * (cols + 1) + k;
      const b = a + 1;
      const c = a + cols + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.rotateY(angle);
  geo.computeBoundingSphere();
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.76,
    roughness: 0.18,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.noShadow = true;
  g.add(mesh);
}

/** Fill the corners of the square block with sea so coastal/wetland/waterfall scenes read as water-filled cuts. */
function addSquareWaterPlate(g: THREE.Group, profile: SiteProfile): void {
  const geo = new THREE.PlaneGeometry(16.2, 16.2, 32, 32).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const isWetland = profile.biome === 'wetland';
  const isWaterfall = profile.biome === 'waterfall';
  const deep = new THREE.Color(
    isWetland ? '#3e5449' : isWaterfall ? '#2a5540' : '#16526d'
  );
  const shallow = new THREE.Color(
    isWetland ? '#607767' : isWaterfall ? '#4a8060' : '#2d7a89'
  );
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
  mesh.userData.isWaterSurface = true;
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

const SPECIES_BUILDERS: Record<
  SiteSpecies,
  (g: THREE.Object3D, x: number, y: number, z: number, sc: number, ry: number) => THREE.Group
> = { fynbos, silverTree, protea, marula, yellowwood, jacaranda, camelthorn, milkwood };

interface SpeciesPart {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  /** Violet jacaranda bloom shell: toggled by the shared October/November gate. */
  seasonal: boolean;
}

const speciesPartsCache = new Map<SiteSpecies, SpeciesPart[]>();

/**
 * Reuse the builder's merged output as an instancing template. The throwaway
 * group never enters the scene; its merged geometry/material pairs are cached
 * as shared resources and drawn once per material regardless of tree count.
 */
function getSpeciesParts(name: SiteSpecies): SpeciesPart[] {
  const cached = speciesPartsCache.get(name);
  if (cached) return cached;
  const scratch = new THREE.Group();
  SPECIES_BUILDERS[name](scratch, 0, 0, 0, 1, 0);
  const parts: SpeciesPart[] = [];
  scratch.children.forEach((child) => {
    if (!(child instanceof THREE.Mesh) || Array.isArray(child.material)) return;
    child.geometry.userData.sharedResource = true;
    parts.push({
      geo: child.geometry,
      mat: child.material,
      seasonal: Boolean((child.material.userData as { seasonalSpecies?: string }).seasonalSpecies),
    });
  });
  speciesPartsCache.set(name, parts);
  return parts;
}

function addTreeRing(g: THREE.Group, profile: SiteProfile, angle: number): Update[] {
  const [count, kind, scale] = profile.ring;
  if (count <= 0) return [];
  const species = profile.species;
  if (!species?.length) {
    for (let i = 0; i < count; i++) {
      const a = angle + (i / count) * 6.2832 + (R(i * 4.7 + 1) - 0.5) * 0.4;
      const r = 7.0 + R(i * 2.3 + 6) * 0.22;
      tree(g, Math.cos(a) * r, Math.sin(a) * r, scale * (0.88 + R(i + 8) * 0.24), kind, 0.19);
    }
    return [];
  }

  const placements = new Map<SiteSpecies, InstanceTransform[]>();
  for (let i = 0; i < count; i++) {
    const name = species[i % species.length];
    const a = angle + (i / count) * 6.2832 + (R(i * 4.7 + 1) - 0.5) * 0.4;
    const r = 7.0 + R(i * 2.3 + 6) * 0.22;
    const sc = scale * (0.88 + R(i + 8) * 0.24);
    let list = placements.get(name);
    if (!list) {
      list = [];
      placements.set(name, list);
    }
    list.push({ x: Math.cos(a) * r, y: 0.19, z: Math.sin(a) * r, ry: a, sx: sc, sy: sc, sz: sc });
  }

  const bloomMeshes: THREE.InstancedMesh[] = [];
  placements.forEach((transforms, name) => {
    for (const part of getSpeciesParts(name)) {
      const im = instancedMeshes(g, part.geo, part.mat, transforms);
      if (im && part.seasonal) bloomMeshes.push(im);
    }
  });
  if (!bloomMeshes.length) return [];
  return [
    () => {
      const blooming = isSpeciesBlooming(getSeasonMonth(), 'jacaranda');
      for (let i = 0; i < bloomMeshes.length; i++) bloomMeshes[i].visible = blooming;
    },
  ];
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

  // Miniature moored rowing dinghy bobbing gently beside the pier
  const boat = new THREE.Group();
  boat.position.set(7.45, -0.09, -0.78);
  boat.rotation.y = 0.28;
  const hullMat = MWood('#c7b9a2', 0.72);
  const trimMat = MWood('#7c4c2f', 0.85);
  add(
    boat,
    new THREE.CylinderGeometry(0.14, 0.1, 0.52, 8).rotateZ(Math.PI / 2),
    hullMat,
    0,
    0.05,
    0
  );
  add(boat, CB(0.05, 0.025, 0.22, 0.005), trimMat, -0.06, 0.09, 0);
  add(boat, CB(0.05, 0.025, 0.22, 0.005), trimMat, 0.08, 0.09, 0);
  add(boat, C(0.009, 0.014, 0.16, 6), trimMat, 0.25, 0.11, 0).rotation.z = -0.35;
  add(boat, CB(0.38, 0.012, 0.024, 0.004), wood, -0.02, 0.115, 0.11).rotation.y = 0.12;
  mergeByMaterial(boat);
  grp.add(boat);

  return [
    (t) => {
      const wave = 1 + Math.min(1.4, WU.wind.value) * 0.25;
      boat.position.y = -0.09 + Math.sin(t * 1.65) * 0.022 * wave;
      boat.rotation.x = Math.sin(t * 1.9 + 0.6) * 0.065 * wave;
      boat.rotation.z = Math.cos(t * 1.35) * 0.045 * wave;
    },
  ];
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
  mergeByMaterial(grp);

  // Pivoting head turns gently into the prevailing wind vector
  const head = new THREE.Group();
  head.position.set(0, 0.92, 0);
  grp.add(head);
  add(head, CB(0.16, 0.1, 0.12, 0.02), steel, 0, 0, 0);
  add(head, CB(0.03, 0.16, 0.46, 0.01), steel, 0, 0.05, 0.2);
  mergeByMaterial(head);

  const wheel = new THREE.Group();
  wheel.position.set(0, 0.02, -0.06);
  head.add(wheel);
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

  let spinPhase = 0;
  let lastT = 0;
  return [
    (t) => {
      const dt = Math.min(0.1, Math.max(0, t - lastT));
      lastT = t;
      spinPhase += dt * (1.2 + WU.wind.value * 2.1);
      wheel.rotation.z = spinPhase;
      const targetYaw = Math.atan2(WU.windDir.value.x, WU.windDir.value.y) + angle;
      const diff = Math.atan2(
        Math.sin(targetYaw - head.rotation.y),
        Math.cos(targetYaw - head.rotation.y)
      );
      head.rotation.y += diff * Math.min(1, dt * 2.5 + 0.05);
    },
  ];
}

function addBollards(g: THREE.Group, angle: number): Update[] {
  const grp = anchorGroup(g, angle, 0);
  addStreetLampSet(grp, [
    { x: 7.2, y: 0.19, z: -0.55, kind: 'bollard', scale: 1.0, color: '#ffd9a0', poolRadius: 0.72 },
    { x: 7.2, y: 0.19, z: 0, kind: 'bollard', scale: 1.0, color: '#ffd9a0', poolRadius: 0.72 },
    { x: 7.2, y: 0.19, z: 0.55, kind: 'bollard', scale: 1.0, color: '#ffd9a0', poolRadius: 0.72 },
  ]);
  add(grp, CB(0.5, 0.2, 0.3, 0.02), MStone('#8a8378', 0.9), 7.1, 0.29, 0);
  mergeByMaterial(grp);
  grassTufts(grp, [{ x: 7.1, y: 0.4, z: 0 }], ['#5c7a42', '#7a8f4c']);
  return [];
}

let pennantGeoShared: THREE.PlaneGeometry | null = null;
let pennantMatShared: THREE.MeshStandardMaterial | null = null;

function addDeck(g: THREE.Group, angle: number): Update[] {
  const grp = anchorGroup(g, angle, 0);
  const st = MStone('#8a8274', 0.92);
  const wood = MWood('#6b5138', 0.88);
  const brass = MSteel('#c89c4c', 0.32, 0.88);
  add(grp, CB(1.0, 0.1, 0.7, 0.02), wood, 7.1, 0.24, 0);
  for (const x of [6.7, 7.5]) {
    for (const z of [-0.3, 0.3]) add(grp, C(0.03, 0.04, 0.2, 6), st, x, 0.13, z);
  }
  for (let i = 0; i < 3; i++) add(grp, C(0.012, 0.012, 0.34, 5), st, 6.68 + i * 0.42, 0.46, 0.33);
  add(grp, CB(0.86, 0.02, 0.02, 0.005), st, 7.1, 0.56, 0.33);
  // Miniature brass scenic viewfinder / wind mast
  add(grp, C(0.014, 0.022, 0.36, 8), brass, 7.42, 0.47, -0.22);
  add(grp, C(0.022, 0.018, 0.14, 8), brass, 7.42, 0.65, -0.22).rotation.z = Math.PI * 0.42;
  // Wind-fluttering reserve pennant on corner post
  add(grp, C(0.008, 0.01, 0.56, 6), st, 6.72, 0.56, -0.26);
  mergeByMaterial(grp);

  if (!pennantGeoShared) {
    pennantGeoShared = new THREE.PlaneGeometry(0.28, 0.11, 8, 2);
    pennantGeoShared.translate(0.14, 0, 0);
    pennantGeoShared.userData.sharedResource = true;
  }
  if (!pennantMatShared) {
    pennantMatShared = flagWindy(
      new THREE.MeshStandardMaterial({ color: '#d87a3b', roughness: 0.78 }),
      'deck_pennant'
    );
    pennantMatShared.userData.sharedResource = true;
  }
  const flagMesh = new THREE.Mesh(pennantGeoShared, pennantMatShared);
  flagMesh.position.set(6.72, 0.78, -0.26);
  flagMesh.userData.noShadow = true;
  grp.add(flagMesh);

  return [
    () => {
      flagMesh.rotation.y = Math.atan2(-WU.windDir.value.y, WU.windDir.value.x) + angle;
    },
  ];
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

  // Subtle concentric water ripple ring around the reedbed
  const rippleMat = new THREE.MeshBasicMaterial({
    color: '#d8f4ff',
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  rippleMat.userData.noDissolve = true;
  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.24, 24).rotateX(-Math.PI / 2),
    rippleMat
  );
  ripple.position.set(Math.cos(angle) * 6.3, 0.075, Math.sin(angle) * 6.3);
  ripple.userData.noShadow = true;
  ripple.userData.cannotReceiveAO = true;
  g.add(ripple);

  return [
    (t) => {
      const p = (t * 0.45) % 1;
      ripple.scale.setScalar(0.65 + p * 2.2);
      rippleMat.opacity = (1 - p) * 0.3;
    },
  ];
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
  if (
    key.includes('Union Buildings') ||
    key.includes('Voortrekker') ||
    key.includes('Constantia')
  ) {
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
    // Foam flecks & wind-bent rising mist plumes at waterfall anchors
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
          anchor[0] + Math.cos(a) * spread + WU.windDir.value.x * WU.wind.value * u * 0.35,
          anchor[1] - u * 1.1 + Math.sin(t * 1.2 + i) * 0.04,
          anchor[2] + Math.sin(a) * spread + WU.windDir.value.y * WU.wind.value * u * 0.35
        );
      },
      0.34
    );
    updates.push(s.update);

    const plume = stream(
      g,
      detailed ? 14 : 7,
      '#eefaff',
      0.24,
      (i, t, o) => {
        const u = (t * 0.19 + R(i * 9.3 + 4)) % 1;
        const a = R(i * 4.1 + 1) * 6.2832;
        const rad = 0.25 + u * 0.95;
        o.set(
          anchor[0] + Math.cos(a) * rad + WU.windDir.value.x * u * (0.4 + WU.wind.value * 0.7),
          Math.max(0.22, anchor[1] - 0.85 + u * 1.35),
          anchor[2] + Math.sin(a) * rad + WU.windDir.value.y * u * (0.4 + WU.wind.value * 0.7)
        );
      },
      0.22,
      false
    );
    updates.push(plume.update);
  }

  // Nocturnal fireflies drifting warmly in wetland, savannah, and forest clearings
  if (
    profile.biome === 'wetland' ||
    profile.biome === 'savannah' ||
    key.includes('Kirstenbosch') ||
    key.includes('Storms River')
  ) {
    const fireflies = stream(
      g,
      detailed ? 18 : 10,
      '#ffe57f',
      0.06,
      (i, t, o) => {
        const a = R(i * 6.3 + 2) * 6.2832 + Math.sin(t * 0.3 + i) * 0.45;
        const r = 2.6 + R(i * 4.1 + 3) * 3.8;
        o.set(
          Math.cos(a) * r + Math.sin(t * 0.8 + i * 2.1) * 0.25,
          0.35 + R(i * 5.7) * 1.45 + Math.sin(t * 1.3 + i) * 0.18,
          Math.sin(a) * r + Math.cos(t * 0.7 + i * 1.7) * 0.25
        );
      },
      0.0
    );
    updates.push(fireflies.update);
    const ffMat = fireflies.material;
    updates.push((t) => {
      const nightGlow = Math.max(0, (WU.lit.value - 0.35) / 0.65);
      const blink = 0.6 + 0.4 * Math.sin(t * 2.8);
      ffMat.opacity = nightGlow * 0.78 * blink;
    });
  }

  // Hermanus' cove whale is now a season-gated, LOD'd wildlife spot at the
  // same tuned position (src/data/wildlife.ts); no duplicate builder whale here.

  if (
    key.includes('Union Buildings') ||
    key.includes('Voortrekker') ||
    key.includes('Constitution')
  ) {
    // Wind-borne purple Jacaranda blossoms drifting across Pretoria & Johannesburg groves.
    const s = stream(
      g,
      detailed ? 22 : 11,
      '#be8ee8',
      0.062,
      (i, t, o) => {
        const u = (t * 0.095 + R(i * 6.1 + 3)) % 1;
        const driftScale = 0.6 + WU.wind.value * 0.85;
        const bx = (R(i * 4.7 + 1) - 0.5) * 6.2;
        const bz = (R(i * 5.9 + 2) - 0.5) * 6.2;
        o.set(
          bx + WU.windDir.value.x * u * 2.1 * driftScale + Math.sin(t * 1.4 + i) * 0.22,
          2.6 - u * 2.5 + Math.sin(t * 2.1 + i * 1.3) * 0.08,
          bz + WU.windDir.value.y * u * 2.1 * driftScale + Math.cos(t * 1.2 + i) * 0.22
        );
      },
      0.55,
      false
    );
    updates.push(s.update);
  } else if (
    key.includes('Kirstenbosch') ||
    key.includes('Constantia') ||
    key.includes('Blyde') ||
    key.includes('Drakensberg') ||
    key.includes('Stellenbosch')
  ) {
    // Slow sunlit foliage & golden pollen motes drifting in mountain/garden air currents.
    const s = stream(
      g,
      detailed ? 16 : 8,
      '#d9be6c',
      0.055,
      (i, t, o) => {
        const u = (t * 0.075 + R(i * 7.3 + 1)) % 1;
        const driftScale = 0.5 + WU.wind.value * 0.7;
        const bx = (R(i * 3.7 + 4) - 0.5) * 6.4;
        const bz = (R(i * 8.1 + 5) - 0.5) * 6.4;
        o.set(
          bx + WU.windDir.value.x * u * 1.6 * driftScale + Math.sin(t * 1.1 + i) * 0.18,
          2.4 - u * 2.25 + Math.sin(t * 1.8 + i) * 0.07,
          bz + WU.windDir.value.y * u * 1.6 * driftScale + Math.cos(t * 0.9 + i) * 0.18
        );
      },
      0.42,
      false
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
  // Ordinary recessed windows join the hourly lit-window schedule: the pane's
  // emissive map is re-baked with the time of day exactly like a tower facade.
  // The variant comes from the opening's position, so neighbouring windows do
  // not all light up together.
  const paneVariant =
    Math.floor(
      Math.abs(
        Math.sin(
          spec.x * 12.9898 +
            spec.y * 78.233 +
            spec.z * 37.719 +
            (spec.rotationY ?? 0) * 5.3 +
            (spec.width ?? 0.42) * 9.7 +
            (spec.height ?? 0.6) * 4.1
        )
      ) * 997
    ) % PANE_VARIANTS;
  const glass = windowPaneMaterial(paneVariant, spec.glass ?? '#10242f');
  // Seal band behind the glass, slightly larger and darker than the glass so
  // the panel-to-glass transition reads as a glass frame (a recessed rim).
  const seal = MGlass(spec.glass ?? '#10242f', 0.55, 0.07);
  const bar = 0.045;
  add(grp, CB(w * 0.86 + 0.006, h * 0.88 + 0.006, 0.012, 0.012), seal, 0, 0, -d * 0.5 + 0.004);
  add(grp, CB(w * 0.86, h * 0.88, 0.012, 0.012), glass, 0, 0, -d * 0.5);
  add(grp, CB(w, bar, d + 0.02, 0.008), frame, 0, h * 0.5, 0);
  add(grp, CB(w, bar, d + 0.02, 0.008), frame, 0, -h * 0.5, 0);
  add(grp, CB(bar, h, d + 0.02, 0.008), frame, -w * 0.5, 0, 0);
  add(grp, CB(bar, h, d + 0.02, 0.008), frame, w * 0.5, 0, 0);
  add(grp, CB(w * 0.5, 0.018, d * 0.9, 0.006), frame, 0, -h * 0.5 - 0.028, d * 0.1);
  return mergeByMaterial(grp);
}

export interface ShopfrontBandSpec {
  x: number;
  y: number;
  z: number;
  width: number;
  height?: number;
  depth?: number;
  ry?: number;
  wall?: THREE.ColorRepresentation;
  lit?: THREE.ColorRepresentation;
  seed?: number;
  chance?: number;
}

/**
 * Ground-floor shopfront / entrance band. One wide lit-window strip on the same
 * time-of-day schedule as the tower facades, so street level stays awake after
 * the offices above have gone dark.
 */
export function shopfrontBand(g: THREE.Object3D, spec: ShopfrontBandSpec): THREE.Mesh {
  const height = spec.height ?? 0.34;
  const cols = Math.max(3, Math.round(spec.width / 0.42));
  const mat = litWindowMaterial({
    wall: spec.wall ?? '#201e24',
    lit: spec.lit ?? '#ffd08a',
    dark: '#161a20',
    cols,
    rows: 1,
    seed: spec.seed ?? 31,
    chance: spec.chance ?? 0.78,
    intensity: 0.5,
  });
  const mesh = add(
    g,
    CB(spec.width, height, spec.depth ?? 0.05, Math.min(0.02, height * 0.2)),
    mat,
    spec.x,
    spec.y,
    spec.z
  );
  mesh.rotation.y = spec.ry ?? 0;

  // Light from the shopfront spills onto the pavement below it. A single
  // additive quad replaces a real light, so street level glows without adding
  // to the (deliberately fixed) forward light count.
  const spillW = spec.width * 1.3;
  const spillD = Math.max(0.55, spec.width * 0.34);
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    getWindowSpillMat(spec.lit ?? '#ffd08a')
  );
  spill.scale.set(spillW, 1, spillD);
  spill.position.set(spec.x, spec.y - height * 0.5 - 0.008, spec.z + spillD * 0.4);
  spill.rotation.y = spec.ry ?? 0;
  spill.renderOrder = 2;
  spill.castShadow = false;
  spill.receiveShadow = false;
  spill.userData.noShadow = true;
  spill.userData.cannotReceiveAO = true;
  spill.userData.noDissolve = true;
  g.add(spill);
  return mesh;
}

const spillMats = new Map<string, THREE.ShaderMaterial>();

function getWindowSpillMat(lit: THREE.ColorRepresentation): THREE.ShaderMaterial {
  const key = new THREE.Color(lit).getHexString();
  const cached = spillMats.get(key);
  if (cached) return cached;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.lit,
      uDY: WU.dy,
      uCol: { value: new THREE.Color(`#${key}`) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uLit, uDY;
      uniform vec3 uCol;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float night = smoothstep(0.12, 0.8, uLit);
        if (night <= 0.004) discard;
        vec2 c = (vUv - 0.5) * 2.0;
        float across = pow(max(0.0, 1.0 - abs(c.x)), 2.2);
        float away = smoothstep(-0.2, 0.85, c.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
        float a = across * away * night * 0.13;
        gl_FragColor = vec4(uCol * a * 1.25, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  mat.userData.sharedResource = true;
  mat.userData.noDissolve = true;
  spillMats.set(key, mat);
  return mat;
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
/* Batched streetlights, bollards & night illumination pools           */
/* ------------------------------------------------------------------ */

export type StreetLampKind = 'victorian' | 'cobra' | 'bollard' | 'flood' | 'lantern' | 'uplight';

export interface StreetLampSpec {
  x: number;
  y: number;
  z: number;
  /**
   * Optional water-surface height. When set, an additive light streak is laid
   * on the water below the fixture so lamps read as reflected at night.
   */
  reflectY?: number;
  kind?: StreetLampKind;
  /** Yaw around Y in radians (orients cobra arm / flood face). */
  ry?: number;
  /** Uniform fixture scale (default 1). */
  scale?: number;
  /** Bulb, cone & ground-pool tint (default warm tungsten/amber). */
  color?: THREE.ColorRepresentation;
  /** Ground light pool radius (default chosen per kind). */
  poolRadius?: number;
  /** Volumetric haze cone height (default chosen per kind). */
  coneHeight?: number;
  /** Volumetric haze cone outer radius (default chosen per kind). */
  coneRadius?: number;
}

/**
 * Places/OSM slices reuse the same instanced lamp hardware but never own a
 * point light and do not need the diorama contact-shadow pass, so both can be
 * opted out without forking the material/geometry pipeline.
 */
export interface StreetLampSetOptions {
  /** Publish promoted fixtures as anchors for the hero-only 4-light pool. */
  anchors?: boolean;
  /** Queue baked contact-shadow stamps (finalised by the diorama build). */
  contactShadows?: boolean;
}

interface LampArchetype {
  bulbOffset: readonly [number, number, number];
  bulbRadius: readonly [number, number, number];
  poolOffset: readonly [number, number];
  poolRadius: number;
  coneHeight: number;
  coneRadius: number;
  upward: boolean;
}

const LAMP_ARCHETYPES: Record<StreetLampKind, LampArchetype> = {
  victorian: {
    bulbOffset: [0, 0.62, 0],
    bulbRadius: [0.046, 0.052, 0.046],
    poolOffset: [0, 0],
    poolRadius: 0.98,
    coneHeight: 0.6,
    coneRadius: 0.56,
    upward: false,
  },
  cobra: {
    bulbOffset: [0.16, 0.78, 0],
    bulbRadius: [0.048, 0.028, 0.036],
    poolOffset: [0.16, 0],
    poolRadius: 1.28,
    coneHeight: 0.76,
    coneRadius: 0.74,
    upward: false,
  },
  bollard: {
    bulbOffset: [0, 0.255, 0],
    bulbRadius: [0.048, 0.042, 0.048],
    poolOffset: [0, 0],
    poolRadius: 0.68,
    coneHeight: 0.25,
    coneRadius: 0.36,
    upward: false,
  },
  flood: {
    bulbOffset: [0.06, 0.58, 0],
    bulbRadius: [0.055, 0.042, 0.075],
    poolOffset: [0.12, 0],
    poolRadius: 1.65,
    coneHeight: 0.62,
    coneRadius: 0.96,
    upward: false,
  },
  lantern: {
    bulbOffset: [0, 0.38, 0],
    bulbRadius: [0.042, 0.048, 0.042],
    poolOffset: [0, 0],
    poolRadius: 0.82,
    coneHeight: 0.37,
    coneRadius: 0.44,
    upward: false,
  },
  uplight: {
    bulbOffset: [0, 0.038, 0],
    bulbRadius: [0.044, 0.018, 0.044],
    poolOffset: [0, 0],
    poolRadius: 0.52,
    coneHeight: 1.05,
    coneRadius: 0.52,
    upward: true,
  },
};

const lampGeoCache: Partial<Record<StreetLampKind, THREE.BufferGeometry>> = {};
let lampBulbGeoShared: THREE.SphereGeometry | null = null;
let lampPoolGeoShared: THREE.BufferGeometry | null = null;
let lampDownConeGeoShared: THREE.BufferGeometry | null = null;
let lampUpConeGeoShared: THREE.BufferGeometry | null = null;
let lampHaloGeoShared: THREE.BufferGeometry | null = null;
let lampBulbMatShared: THREE.ShaderMaterial | null = null;
let lampPoolMatShared: THREE.ShaderMaterial | null = null;
let lampDownConeMatShared: THREE.ShaderMaterial | null = null;
let lampUpConeMatShared: THREE.ShaderMaterial | null = null;
let lampHaloMatShared: THREE.ShaderMaterial | null = null;

function markSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.userData.sharedResource = true;
  return geo;
}

function getLampHardwareGeo(kind: StreetLampKind): THREE.BufferGeometry {
  const existing = lampGeoCache[kind];
  if (existing) return existing;

  const parts: THREE.BufferGeometry[] = [];
  if (kind === 'victorian') {
    parts.push(new THREE.CylinderGeometry(0.042, 0.058, 0.12, 8).translate(0, 0.06, 0));
    parts.push(new THREE.CylinderGeometry(0.018, 0.032, 0.46, 8).translate(0, 0.35, 0));
    parts.push(new THREE.CylinderGeometry(0.045, 0.024, 0.04, 8).translate(0, 0.58, 0));
    parts.push(new THREE.ConeGeometry(0.068, 0.075, 6).translate(0, 0.695, 0));
    parts.push(new THREE.BoxGeometry(0.11, 0.014, 0.014).translate(0, 0.52, 0));
  } else if (kind === 'cobra') {
    parts.push(new THREE.CylinderGeometry(0.038, 0.05, 0.09, 8).translate(0, 0.045, 0));
    parts.push(new THREE.CylinderGeometry(0.018, 0.03, 0.72, 8).translate(0, 0.41, 0));
    const arm = new THREE.CylinderGeometry(0.013, 0.016, 0.19, 6);
    arm.rotateZ(-Math.PI / 2.25);
    arm.translate(0.085, 0.785, 0);
    parts.push(arm);
    parts.push(new THREE.BoxGeometry(0.11, 0.026, 0.064).translate(0.165, 0.805, 0));
  } else if (kind === 'bollard') {
    parts.push(new THREE.CylinderGeometry(0.046, 0.056, 0.24, 10).translate(0, 0.12, 0));
    parts.push(new THREE.CylinderGeometry(0.052, 0.052, 0.028, 10).translate(0, 0.295, 0));
  } else if (kind === 'flood') {
    parts.push(new THREE.CylinderGeometry(0.036, 0.048, 0.08, 8).translate(0, 0.04, 0));
    parts.push(new THREE.CylinderGeometry(0.02, 0.03, 0.52, 8).translate(0, 0.3, 0));
    parts.push(new THREE.BoxGeometry(0.09, 0.07, 0.15).rotateZ(-0.28).translate(0.035, 0.59, 0));
  } else if (kind === 'lantern') {
    parts.push(new THREE.CylinderGeometry(0.028, 0.04, 0.06, 8).translate(0, 0.03, 0));
    parts.push(new THREE.CylinderGeometry(0.014, 0.022, 0.31, 8).translate(0, 0.19, 0));
    parts.push(new THREE.ConeGeometry(0.062, 0.065, 6).translate(0, 0.445, 0));
  } else {
    parts.push(new THREE.CylinderGeometry(0.068, 0.076, 0.036, 12).translate(0, 0.018, 0));
  }

  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) {
    const fallback = markSharedGeo(new THREE.CylinderGeometry(0.02, 0.03, 0.4, 6).translate(0, 0.2, 0));
    lampGeoCache[kind] = fallback;
    return fallback;
  }
  merged.computeBoundingSphere();
  markSharedGeo(merged);
  lampGeoCache[kind] = merged;
  return merged;
}

function getLampBulbGeo(): THREE.SphereGeometry {
  if (!lampBulbGeoShared) {
    lampBulbGeoShared = markSharedGeo(new THREE.SphereGeometry(1, 10, 8));
  }
  return lampBulbGeoShared;
}

function getLampPoolGeo(): THREE.BufferGeometry {
  if (!lampPoolGeoShared) {
    lampPoolGeoShared = markSharedGeo(new THREE.CircleGeometry(1, 22).rotateX(-Math.PI / 2));
  }
  return lampPoolGeoShared;
}

function getLampHaloGeo(): THREE.BufferGeometry {
  if (!lampHaloGeoShared) {
    lampHaloGeoShared = markSharedGeo(new THREE.PlaneGeometry(1, 1));
  }
  return lampHaloGeoShared;
}

function getLampConeGeo(upward: boolean): THREE.BufferGeometry {
  if (upward) {
    if (!lampUpConeGeoShared) {
      lampUpConeGeoShared = markSharedGeo(
        new THREE.CylinderGeometry(1.0, 0.14, 1.0, 16, 1, true).translate(0, 0.5, 0)
      );
    }
    return lampUpConeGeoShared;
  }
  if (!lampDownConeGeoShared) {
    lampDownConeGeoShared = markSharedGeo(
      new THREE.CylinderGeometry(0.16, 1.0, 1.0, 16, 1, true).translate(0, -0.5, 0)
    );
  }
  return lampDownConeGeoShared;
}

function getLampBulbMat(): THREE.ShaderMaterial {
  if (lampBulbMatShared) return lampBulbMatShared;
  lampBulbMatShared = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.streetLampLit,
      uWT: WU.t,
      uDY: WU.dy,
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNorm;
      varying vec3 vViewDir;
      varying vec3 vLampCol;
      void main() {
        #ifdef USE_INSTANCING_COLOR
          vLampCol = instanceColor;
        #else
          vLampCol = vec3(1.0, 0.8, 0.45);
        #endif
        vec4 localPos = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * localPos;
          vec3 instN = mat3(instanceMatrix) * normal;
        #else
          vec4 worldPos = modelMatrix * localPos;
          vec3 instN = normal;
        #endif
        vWorldPos = worldPos.xyz;
        vec4 mvPos = viewMatrix * worldPos;
        vNorm = normalize(normalMatrix * instN);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uLit;
      uniform float uWT;
      uniform float uDY;
      varying vec3 vWorldPos;
      varying vec3 vNorm;
      varying vec3 vViewDir;
      varying vec3 vLampCol;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        vec3 cc = floor(vWorldPos * 3.0);
        float hh = fract(sin(dot(cc, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float on = smoothstep(hh * 0.45, hh * 0.45 + 0.28, uLit);
        float shimmer = 0.93 + 0.07 * sin(uWT * (2.8 + hh * 3.2) + hh * 24.0);
        float fresnel = pow(clamp(dot(normalize(vNorm), normalize(vViewDir)), 0.0, 1.0), 0.7);
        vec3 core = mix(vLampCol * 0.58, vLampCol * 1.45 + vec3(0.24, 0.18, 0.08), on * shimmer);
        vec3 col = mix(core * 0.85, core * 1.18, fresnel);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    toneMapped: true,
  });
  lampBulbMatShared.userData.sharedResource = true;
  lampBulbMatShared.userData.noDissolve = true;
  lampBulbMatShared.userData.streetLampEmissive = true;
  return lampBulbMatShared;
}

function getLampPoolMat(): THREE.ShaderMaterial {
  if (lampPoolMatShared) return lampPoolMatShared;
  lampPoolMatShared = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.streetLampLit,
      uWT: WU.t,
      uDY: WU.dy,
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vLampCol;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vLampCol = instanceColor;
        #else
          vLampCol = vec3(1.0, 0.78, 0.44);
        #endif
        vec4 localPos = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * localPos;
        #else
          vec4 worldPos = modelMatrix * localPos;
        #endif
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uLit;
      uniform float uWT;
      uniform float uDY;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vLampCol;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float litVis = smoothstep(0.06, 0.86, uLit);
        if (litVis <= 0.002) discard;
        float r = length((vUv - 0.5) * 2.0);
        if (r >= 1.0) discard;
        float falloff = pow(1.0 - r, 2.15);
        float hotspot = exp(-r * r * 5.2) * 0.42;
        float pulse = 0.95 + 0.05 * sin(uWT * 2.1 + vWorldPos.x * 1.7 + vWorldPos.z * 1.3);
        float alpha = (falloff * 0.44 + hotspot) * litVis * pulse;
        gl_FragColor = vec4(vLampCol * alpha * 1.35, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    toneMapped: false,
  });
  lampPoolMatShared.userData.sharedResource = true;
  lampPoolMatShared.userData.noDissolve = true;
  lampPoolMatShared.userData.streetLampEmissive = true;
  return lampPoolMatShared;
}

function getLampConeMat(upward: boolean): THREE.ShaderMaterial {
  if (upward && lampUpConeMatShared) return lampUpConeMatShared;
  if (!upward && lampDownConeMatShared) return lampDownConeMatShared;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.streetLampLit,
      uDY: WU.dy,
      uUpward: { value: upward ? 1.0 : 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNorm;
      varying vec3 vViewDir;
      varying vec3 vLampCol;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vLampCol = instanceColor;
        #else
          vLampCol = vec3(1.0, 0.8, 0.45);
        #endif
        vec4 localPos = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * localPos;
          vec3 instN = mat3(instanceMatrix) * normal;
        #else
          vec4 worldPos = modelMatrix * localPos;
          vec3 instN = normal;
        #endif
        vWorldPos = worldPos.xyz;
        vec4 mvPos = viewMatrix * worldPos;
        vNorm = normalize(normalMatrix * instN);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uLit;
      uniform float uDY;
      uniform float uUpward;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNorm;
      varying vec3 vViewDir;
      varying vec3 vLampCol;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float litVis = smoothstep(0.08, 0.9, uLit);
        if (litVis <= 0.002) discard;
        float t = mix(vUv.y, 1.0 - vUv.y, uUpward);
        float axial = pow(clamp(t, 0.0, 1.0), 1.05) * smoothstep(0.0, 0.3, t) * smoothstep(1.0, 0.86, t);
        float edge = pow(abs(dot(normalize(vNorm), normalize(vViewDir))), 1.4);
        float strength = uUpward > 0.5 ? 0.16 : 0.125;
        float alpha = axial * edge * litVis * strength;
        gl_FragColor = vec4(vLampCol * alpha * 1.3, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  mat.userData.sharedResource = true;
  mat.userData.noDissolve = true;
  mat.userData.streetLampEmissive = true;
  if (upward) lampUpConeMatShared = mat;
  else lampDownConeMatShared = mat;
  return mat;
}

function getLampHaloMat(): THREE.ShaderMaterial {
  if (lampHaloMatShared) return lampHaloMatShared;
  lampHaloMatShared = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.streetLampLit,
      uDY: WU.dy,
      uWT: WU.t,
      // Fog swells the halo so lamps bloom in mist.
      uFog: WU.fog,
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vLampCol;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vLampCol = instanceColor;
        #else
          vLampCol = vec3(1.0, 0.82, 0.50);
        #endif
        #ifdef USE_INSTANCING
          vec4 worldCenter = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float haloSize = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));
        #else
          vec4 worldCenter = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float haloSize = 0.4;
        #endif
        vWorldPos = worldCenter.xyz;
        vec4 mvCenter = viewMatrix * worldCenter;
        mvCenter.xy += position.xy * haloSize;
        gl_Position = projectionMatrix * mvCenter;
      }
    `,
    fragmentShader: `
      uniform float uLit, uDY, uWT, uFog;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vLampCol;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float litVis = smoothstep(0.08, 0.88, uLit);
        if (litVis <= 0.004) discard;
        float r = length((vUv - 0.5) * 2.0);
        if (r >= 1.0) discard;
        float core = exp(-r * r * 7.5);
        float corona = pow(1.0 - r, 2.4) * 0.42;
        float pulse = 0.94 + 0.06 * sin(uWT * 2.3 + vWorldPos.x * 2.1 + vWorldPos.z * 1.7);
        float alpha = (core * 0.42 + corona * 0.28) * litVis * pulse * (1.0 + uFog * 1.5);
        gl_FragColor = vec4(vLampCol * alpha * 1.35, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  lampHaloMatShared.userData.sharedResource = true;
  lampHaloMatShared.userData.noDissolve = true;
  lampHaloMatShared.userData.streetLampEmissive = true;
  return lampHaloMatShared;
}

const lampPoolColorTmp = new THREE.Color();

/**
 * Adds instanced streetlamps, bollards, lanterns, floodlights or architectural
 * uplights with GPU-driven `WU.lit` bulbs, additive haze cones and soft
 * ground light pools. Costs only a handful of batched draw calls per landmark.
 */
/**
 * Real point lights are the most expensive part of a forward renderer, so a
 * lamp set promotes only this many of its most representative fixtures. Every
 * other lamp is still drawn with the batched bulb, pool, cone and halo meshes.
 */
const STREET_POINT_LIGHT_LIMIT = 4;

let lampReflectionMatShared: THREE.ShaderMaterial | null = null;
let lampReflectionGeoShared: THREE.BufferGeometry | null = null;

function getLampReflectionGeo(): THREE.BufferGeometry {
  if (!lampReflectionGeoShared) {
    // Unit plane lying on the water, streak running away from the fixture.
    lampReflectionGeoShared = markSharedGeo(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
    );
  }
  return lampReflectionGeoShared;
}

function getLampReflectionMat(): THREE.ShaderMaterial {
  if (lampReflectionMatShared) return lampReflectionMatShared;
  lampReflectionMatShared = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.lit,
      uWT: WU.t,
      uDY: WU.dy,
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vLampCol;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        #else
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
        #endif
        #ifdef USE_INSTANCING_COLOR
          vLampCol = instanceColor;
        #else
          vLampCol = vec3(1.0, 0.82, 0.5);
        #endif
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uLit, uWT, uDY;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vLampCol;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float litVis = smoothstep(0.1, 0.9, uLit);
        if (litVis <= 0.004) discard;
        float across = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 2.0), 2.4);
        float along = smoothstep(0.0, 0.3, 1.0 - vUv.y) * pow(vUv.y, 1.5);
        float ripple = 0.72 + 0.28 * sin(vUv.y * 24.0 + uWT * 1.6 + vWorldPos.x * 2.1);
        float a = across * along * ripple * litVis * 0.5;
        gl_FragColor = vec4(vLampCol * a * 1.4, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  lampReflectionMatShared.userData.sharedResource = true;
  lampReflectionMatShared.userData.noDissolve = true;
  return lampReflectionMatShared;
}

/** Additive light streaks on the water below waterfront fixtures. */
function addLampWaterReflections(
  g: THREE.Object3D,
  items: ReadonlyArray<{
    x: number;
    z: number;
    y: number;
    color: THREE.ColorRepresentation;
    scale: number;
  }>
): void {
  const transforms: InstanceTransform[] = [];
  const colors: THREE.ColorRepresentation[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const len = 1.15 * it.scale;
    transforms.push({
      x: it.x,
      y: it.y + 0.006,
      z: it.z - len * 0.5,
      sx: 0.42 * it.scale,
      sy: 1,
      sz: len,
    });
    colors.push(it.color);
  }
  const im = instancedMeshes(g, getLampReflectionGeo(), getLampReflectionMat(), transforms, colors);
  if (!im) return;
  im.castShadow = false;
  im.receiveShadow = false;
  im.renderOrder = 3;
  im.userData.noShadow = true;
  im.userData.cannotReceiveAO = true;
  im.userData.noDissolve = true;
}

let wetRoadMatShared: THREE.ShaderMaterial | null = null;

function getWetRoadMat(): THREE.ShaderMaterial {
  if (wetRoadMatShared) return wetRoadMatShared;
  wetRoadMatShared = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.lit,
      uRain: WU.rain,
      uWT: WU.t,
      uDY: WU.dy,
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vLampCol;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        #else
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
        #endif
        #ifdef USE_INSTANCING_COLOR
          vLampCol = instanceColor;
        #else
          vLampCol = vec3(1.0, 0.82, 0.5);
        #endif
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uLit, uRain, uWT, uDY;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vLampCol;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        // Wet asphalt only mirrors light once the road is genuinely soaked, so
        // the streaks fade in with rain instead of appearing on a dry night.
        float wet = smoothstep(0.28, 0.85, uRain);
        if (wet <= 0.004) discard;
        float night = smoothstep(0.12, 0.85, uLit);
        if (night <= 0.004) discard;
        float across = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 2.0), 3.1);
        float along = smoothstep(0.0, 0.35, 1.0 - vUv.y) * pow(vUv.y, 1.1);
        float broken = 0.55 + 0.45 * sin(vUv.y * 17.0 - uWT * 2.2 + vWorldPos.x * 1.7);
        float a = across * along * broken * wet * night * 0.34;
        gl_FragColor = vec4(vLampCol * a * 1.35, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  wetRoadMatShared.userData.sharedResource = true;
  wetRoadMatShared.userData.noDissolve = true;
  return wetRoadMatShared;
}

/** Rain-soaked road reflection streaks under every street lamp. */
function addWetRoadStreaks(
  g: THREE.Object3D,
  items: ReadonlyArray<{ x: number; y: number; z: number; color: THREE.ColorRepresentation; scale: number }>
): void {
  const transforms: InstanceTransform[] = [];
  const colors: THREE.ColorRepresentation[] = [];
  for (const it of items) {
    const len = 0.95 * it.scale;
    transforms.push({
      x: it.x,
      y: it.y + 0.007,
      z: it.z - len * 0.5,
      sx: 0.36 * it.scale,
      sy: 1,
      sz: len,
    });
    colors.push(it.color);
  }
  const im = instancedMeshes(g, getLampReflectionGeo(), getWetRoadMat(), transforms, colors);
  if (!im) return;
  im.castShadow = false;
  im.receiveShadow = false;
  im.renderOrder = 3;
  im.userData.noShadow = true;
  im.userData.cannotReceiveAO = true;
  im.userData.noDissolve = true;
}

export function addStreetLampSet(
  g: THREE.Object3D,
  specs: readonly StreetLampSpec[],
  options?: StreetLampSetOptions
): void {
  if (!specs.length) return;
  const withAnchors = options?.anchors !== false;
  const withContactShadows = options?.contactShadows !== false;

  const byKind = new Map<StreetLampKind, InstanceTransform[]>();
  const bulbTransforms: InstanceTransform[] = [];
  const bulbColors: THREE.ColorRepresentation[] = [];
  const poolTransforms: InstanceTransform[] = [];
  const poolColors: THREE.ColorRepresentation[] = [];
  const downConeTransforms: InstanceTransform[] = [];
  const downConeColors: THREE.ColorRepresentation[] = [];
  const upConeTransforms: InstanceTransform[] = [];
  const upConeColors: THREE.ColorRepresentation[] = [];

  // Promote a spread of the downward fixtures to anchors before the fixtures
  // are batched, so their baked ground pool can be dimmed below.
  const lightCandidates: number[] = [];
  for (let i = 0; i < specs.length; i++) {
    const kind: StreetLampKind = specs[i].kind ?? 'victorian';
    if (!LAMP_ARCHETYPES[kind].upward && kind !== 'flood') lightCandidates.push(i);
  }
  const promotedCount = withAnchors ? Math.min(STREET_POINT_LIGHT_LIMIT, lightCandidates.length) : 0;
  const promotedIndices: number[] = [];
  for (let k = 0; k < promotedCount; k++) {
    promotedIndices.push(lightCandidates[Math.floor(((k + 0.5) * lightCandidates.length) / promotedCount)]);
  }
  const promotedSet = new Set(promotedIndices);
  const reflections: Array<{
    x: number;
    z: number;
    y: number;
    color: THREE.ColorRepresentation;
    scale: number;
  }> = [];
  const wetStreaks: Array<{
    x: number;
    y: number;
    z: number;
    color: THREE.ColorRepresentation;
    scale: number;
  }> = [];

  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const kind: StreetLampKind = s.kind ?? 'victorian';
    const arch = LAMP_ARCHETYPES[kind];
    const sc = s.scale ?? 1;
    const ry = s.ry ?? 0;
    const cosR = Math.cos(ry);
    const sinR = Math.sin(ry);
    const col = s.color ?? (kind === 'cobra' ? '#ffb25c' : kind === 'flood' ? '#e2f0ff' : '#ffd280');

    let kindList = byKind.get(kind);
    if (!kindList) {
      kindList = [];
      byKind.set(kind, kindList);
    }
    kindList.push({ x: s.x, y: s.y, z: s.z, ry, sx: sc, sy: sc, sz: sc });

    // Local [lx, lz] rotated around Y by ry: x' = lx*cos(ry) + lz*sin(ry), z' = -lx*sin(ry) + lz*cos(ry)
    const [bx, by, bz] = arch.bulbOffset;
    const worldBx = s.x + (bx * cosR + bz * sinR) * sc;
    const worldBy = s.y + by * sc;
    const worldBz = s.z + (-bx * sinR + bz * cosR) * sc;
    bulbTransforms.push({
      x: worldBx,
      y: worldBy,
      z: worldBz,
      ry,
      sx: arch.bulbRadius[0] * sc,
      sy: arch.bulbRadius[1] * sc,
      sz: arch.bulbRadius[2] * sc,
    });
    bulbColors.push(col);

    const [px, pz] = arch.poolOffset;
    const poolR = (s.poolRadius ?? arch.poolRadius) * sc;
    poolTransforms.push({
      x: s.x + (px * cosR + pz * sinR) * sc,
      y: s.y + 0.016,
      z: s.z + (-px * sinR + pz * cosR) * sc,
      sx: poolR,
      sy: 1,
      sz: poolR,
    });
    // A fixture promoted to a real point light keeps only a dim baked pool so
    // the ground is not lit twice.
    poolColors.push(
      lampPoolColorTmp
        .set(col)
        .multiplyScalar(promotedSet.has(i) ? 0.45 : 1)
        .getHex()
    );
    // Poles cast no real shadows, so seat each post with a baked contact blob.
    if (withContactShadows) {
      stampContactShadow(g, s.x, s.z, Math.max(0.14, 0.26 * sc), 0.18, s.y + 0.006);
    }
    if (s.reflectY !== undefined) {
      reflections.push({ x: s.x, z: s.z, y: s.reflectY, color: col, scale: sc });
    }
    // Every fixture also lays a rain-gated streak on the road beneath it, so a
    // wet night reads as reflective asphalt even where there is no water body.
    wetStreaks.push({ x: s.x, y: s.y + 0.016, z: s.z, color: col, scale: sc });

    const coneH = (s.coneHeight ?? arch.coneHeight) * sc;
    const coneR = (s.coneRadius ?? arch.coneRadius) * sc;
    if (coneH > 0.02 && coneR > 0.02) {
      const coneTransform: InstanceTransform = {
        x: worldBx,
        y: worldBy,
        z: worldBz,
        ry,
        sx: coneR,
        sy: coneH,
        sz: coneR,
      };
      if (arch.upward) {
        upConeTransforms.push(coneTransform);
        upConeColors.push(col);
      } else {
        downConeTransforms.push(coneTransform);
        downConeColors.push(col);
      }
    }
  }

  // Anchor records for the promoted fixtures. The engine owns the actual point
  // lights (one fixed pool for the whole session), so a landmark never adds or
  // removes lights from the scene.
  const anchors: StreetLampAnchor[] = [];
  for (let k = 0; k < promotedCount; k++) {
    const idx = promotedIndices[k];
    const spec = specs[idx];
    const bulb = bulbTransforms[idx];
    const kind: StreetLampKind = spec.kind ?? 'victorian';
    const sc = spec.scale ?? 1;
    const poolR = (spec.poolRadius ?? LAMP_ARCHETYPES[kind].poolRadius) * sc;
    const colour = spec.color ?? (kind === 'cobra' ? '#ffb25c' : '#ffd280');
    anchors.push({
      x: bulb.x,
      y: bulb.y,
      z: bulb.z,
      color: colour,
      // Candela at full night; tuned against the diorama's ~3.0 key light.
      intensity: 0.5 + poolR * 0.34,
      distance: Math.max(1.4, poolR * 3.2),
      // Photocell spread: each fixture switches within +/-20 min of the others.
      offset: (R(idx * 17 + 3) * 2 - 1) * 0.35,
    });
  }
  if (anchors.length > 0) {
    const list = (g.userData.streetLampAnchors as StreetLampAnchor[] | undefined) ?? [];
    list.push(...anchors);
    g.userData.streetLampAnchors = list;
  }

  const ironMat = MSteel('#232830', 0.44, 0.78);
  const galvMat = MSteel('#58626d', 0.42, 0.82);
  byKind.forEach((transforms, kind) => {
    const mat = kind === 'cobra' || kind === 'flood' ? galvMat : ironMat;
    const im = instancedMeshes(g, getLampHardwareGeo(kind), mat, transforms);
    if (im) im.castShadow = true;
  });

  const bulbIm = instancedMeshes(g, getLampBulbGeo(), getLampBulbMat(), bulbTransforms, bulbColors);
  if (bulbIm) {
    bulbIm.castShadow = false;
    bulbIm.receiveShadow = false;
    bulbIm.userData.noShadow = true;
    bulbIm.userData.cannotReceiveAO = true;
    bulbIm.userData.noDissolve = true;
    bulbIm.userData.isStreetLamp = true;
  }

  const poolIm = instancedMeshes(g, getLampPoolGeo(), getLampPoolMat(), poolTransforms, poolColors);
  if (poolIm) {
    poolIm.castShadow = false;
    poolIm.receiveShadow = false;
    poolIm.renderOrder = 2;
    poolIm.userData.noShadow = true;
    poolIm.userData.cannotReceiveAO = true;
    poolIm.userData.noDissolve = true;
  }

  if (downConeTransforms.length > 0) {
    const coneIm = instancedMeshes(
      g,
      getLampConeGeo(false),
      getLampConeMat(false),
      downConeTransforms,
      downConeColors
    );
    if (coneIm) {
      coneIm.castShadow = false;
      coneIm.receiveShadow = false;
      coneIm.renderOrder = 4;
      coneIm.userData.noShadow = true;
      coneIm.userData.cannotReceiveAO = true;
      coneIm.userData.noDissolve = true;
    }
  }

  if (upConeTransforms.length > 0) {
    const upIm = instancedMeshes(
      g,
      getLampConeGeo(true),
      getLampConeMat(true),
      upConeTransforms,
      upConeColors
    );
    if (upIm) {
      upIm.castShadow = false;
      upIm.receiveShadow = false;
      upIm.renderOrder = 4;
      upIm.userData.noShadow = true;
      upIm.userData.cannotReceiveAO = true;
      upIm.userData.noDissolve = true;
    }
  }

  // Soft batched camera-facing airglow halo sprite around every lit lamp bulb
  const haloTransforms: InstanceTransform[] = bulbTransforms.map((b) => {
    const rad = Math.max(0.28, Math.max(b.sx ?? 0.04, b.sy ?? 0.04) * 7.5);
    return { x: b.x, y: b.y, z: b.z, sx: rad, sy: rad, sz: rad };
  });
  const haloIm = instancedMeshes(g, getLampHaloGeo(), getLampHaloMat(), haloTransforms, bulbColors);
  if (haloIm) {
    haloIm.castShadow = false;
    haloIm.receiveShadow = false;
    haloIm.renderOrder = 5;
    haloIm.frustumCulled = false;
    haloIm.userData.noShadow = true;
    haloIm.userData.cannotReceiveAO = true;
    haloIm.userData.noDissolve = true;
  }

  if (reflections.length > 0) addLampWaterReflections(g, reflections);
  if (wetStreaks.length > 0) addWetRoadStreaks(g, wetStreaks);
}

let lighthouseSweepGeoShared: THREE.BufferGeometry | null = null;

/**
 * Adds a dual-lobe additive light sweep crescent projected onto water or headland
 * ground, synced cleanly to a rotating lighthouse beacon.
 */
export function addLighthouseSweep(
  g: THREE.Object3D,
  x: number,
  yGround: number,
  z: number,
  radius = 5.6,
  color: THREE.ColorRepresentation = '#ffeaa2'
): THREE.Mesh {
  if (!lighthouseSweepGeoShared) {
    lighthouseSweepGeoShared = markSharedGeo(
      new THREE.RingGeometry(0.14, 1.0, 56, 1).rotateX(-Math.PI / 2)
    );
  }
  const col = new THREE.Color(color);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.lit,
      uDY: WU.dy,
      uCol: { value: col },
    },
    vertexShader: `
      varying vec2 vLocal;
      varying vec3 vWorldPos;
      void main() {
        vLocal = position.xz;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uLit, uDY;
      uniform vec3 uCol;
      varying vec2 vLocal;
      varying vec3 vWorldPos;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float r = length(vLocal);
        if (r <= 0.14 || r >= 1.0) discard;
        vec2 dir = vLocal / r;
        float lobe = pow(abs(dir.x), 8.5);
        float radial = smoothstep(0.14, 0.28, r) * pow(1.0 - r, 1.35);
        float strength = 0.08 + 0.34 * smoothstep(0.05, 0.85, uLit);
        float a = lobe * radial * strength;
        if (a <= 0.002) discard;
        gl_FragColor = vec4(uCol * a * 1.4, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    toneMapped: false,
  });
  mat.userData.noDissolve = true;
  const mesh = new THREE.Mesh(lighthouseSweepGeoShared, mat);
  mesh.position.set(x, yGround, z);
  mesh.scale.set(radius, 1, radius);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 3;
  mesh.userData.noShadow = true;
  mesh.userData.cannotReceiveAO = true;
  mesh.userData.noDissolve = true;
  g.add(mesh);
  return mesh;
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
        const thermalClimb = Math.sin(t * 0.65 + b.phase * 1.4);
        b.root.position.set(
          Math.cos(ang) * b.radius,
          b.baseY + thermalClimb * 0.26,
          Math.sin(ang) * b.radius
        );
        b.root.rotation.y = -ang;
        // Gentle inward banking roll into circular turns + subtle pitch along climb
        b.root.rotation.z = -0.22 - Math.sin(t * 0.4 + i) * 0.06;
        b.root.rotation.x = Math.cos(t * 0.65 + b.phase * 1.4) * 0.08;

        // Realistic flap-burst -> thermal soar-glide wing cycle
        const burstCycle = Math.sin(t * 0.85 + b.phase * 2.3);
        const flapWeight = THREE.MathUtils.smoothstep(burstCycle, -0.2, 0.35);
        const flap = flapWeight * Math.sin(t * 8.6 + b.phase * 3) * 0.44 + (1 - flapWeight) * 0.12;
        b.left.rotation.z = flap;
        b.right.rotation.z = -flap;
      }
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Discovery layers: scale reference, wildlife, hidden details           */
/* ------------------------------------------------------------------ */

const SCALE_REF_POSITION = [6.2, 0, 5.2] as const;

function silhouetteFor(kind: ScaleReferenceKind, height: number): THREE.Group {
  const holder = new THREE.Group();
  const dark = M('#26262c', 0.92);
  const tan = M('#c9a06f', 0.9);
  const iron = MSteel('#5c626b', 0.62, 0.45);

  if (kind === 'person') {
    add(holder, C(height * 0.075, height * 0.095, height * 0.5, 10), dark, 0, height * 0.42, 0);
    add(holder, new THREE.SphereGeometry(height * 0.075, 12, 10), dark, 0, height * 0.78, 0);
    for (const s of [-1, 1]) {
      add(
        holder,
        C(height * 0.028, height * 0.032, height * 0.36, 8),
        dark,
        s * height * 0.045,
        height * 0.18,
        0
      );
      const arm = add(
        holder,
        C(height * 0.022, height * 0.024, height * 0.34, 8),
        dark,
        s * height * 0.115,
        height * 0.55,
        0
      );
      arm.rotation.z = s * 0.16;
    }
  } else if (kind === 'springbok') {
    const body = add(holder, new THREE.SphereGeometry(height * 0.19, 12, 10), tan, 0, height * 0.58, 0);
    body.scale.set(1.5, 0.72, 0.62);
    add(holder, C(height * 0.06, height * 0.09, height * 0.3, 8), tan, height * 0.22, height * 0.72, 0).rotation.z = -0.55;
    const head = add(holder, new THREE.SphereGeometry(height * 0.08, 10, 8), tan, height * 0.33, height * 0.85, 0);
    head.scale.set(1.2, 0.85, 0.7);
    for (const sx of [-0.16, 0.16]) {
      for (const sz of [-0.07, 0.07]) {
        add(
          holder,
          C(height * 0.018, height * 0.022, height * 0.47, 6),
          dark,
          height * sx,
          height * 0.24,
          height * sz
        );
      }
    }
    for (const s of [-1, 1]) {
      add(
        holder,
        C(height * 0.012, height * 0.016, height * 0.18, 6),
        dark,
        height * 0.36,
        height * 0.95,
        s * height * 0.04
      ).rotation.z = 0.25;
    }
  } else {
    const legHeight = height * 0.42;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = add(
          holder,
          C(height * 0.012, height * 0.03, legHeight, 8),
          iron,
          sx * height * 0.16,
          legHeight * 0.5,
          sz * height * 0.16
        );
        leg.rotation.z = sx * 0.09;
        leg.rotation.x = sz * 0.09;
      }
    }
    add(holder, CB(height * 0.42, height * 0.035, height * 0.42, height * 0.008), iron, 0, legHeight, 0);
    add(holder, CB(height * 0.26, height * 0.028, height * 0.26, height * 0.008), iron, 0, height * 0.68, 0);
    add(holder, C(height * 0.012, height * 0.055, height * 0.28, 8), iron, 0, height * 0.84, 0);
    add(holder, C(height * 0.004, height * 0.006, height * 0.06, 6), iron, 0, height * 1.0, 0);
  }

  mergeByMaterial(holder);
  holder.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.userData.noShadow = true;
    obj.userData.cannotReceiveAO = true;
    obj.userData.noDissolve = true;
    obj.castShadow = false;
    obj.receiveShadow = false;
  });
  return holder;
}

/** One legible silhouette per reference kind, hidden until scale mode is on. */
function addScaleReference(group: THREE.Group, key: string): void {
  const fact = SCALE_FACTS[key];
  const refs: ScaleReferenceEntry[] = [];
  group.userData.scaleReferences = refs;
  if (!fact?.magnitudeM || fact.magnitudeM <= 0) return;

  // Measure before the (hidden) silhouettes are attached so they cannot
  // inflate their own bounds.
  const box = new THREE.Box3().setFromObject(group);
  const modelUnits = fact.modelUnits ?? (box.isEmpty() ? 3 : Math.max(0.5, box.max.y));
  const unitsPerMetre = modelUnits / fact.magnitudeM;

  // The wrapper stays in the graph; only the three holder groups toggle. This
  // keeps the silhouettes out of the hero fit bounds while hidden.
  const wrapper = new THREE.Group();
  wrapper.visible = true;
  wrapper.position.set(SCALE_REF_POSITION[0], SCALE_REF_POSITION[1], SCALE_REF_POSITION[2]);
  (['person', 'springbok', 'eiffel'] as const).forEach((kind) => {
    const trueHeight = REFERENCE_HEIGHTS[kind] * unitsPerMetre;
    const height = THREE.MathUtils.clamp(trueHeight, MIN_REFERENCE_UNITS, MAX_REFERENCE_UNITS);
    const holder = silhouetteFor(kind, height);
    holder.userData.displayFactor = height / trueHeight;
    wrapper.add(holder);
    refs.push({ kind, object: holder });
  });
  group.add(wrapper);
}

/** Season-aware animal scaffolds plus a small invisible tap proxy per spot. */
function addWildlifeLayer(group: THREE.Group, key: string): Update[] {
  const spots = WILDLIFE.filter((spot) => spot.siteKey === key);
  if (spots.length === 0) return [];

  const updates: Update[] = [];
  const wrappers: Array<{ object: THREE.Group; inner: THREE.Object3D }> = [];
  const targets: LayerTarget[] = [];
  for (const spot of spots) {
    const scaffold = createAnimalScaffold({
      kind: spot.species,
      count: spot.count ?? 3,
      position: { x: spot.position[0], y: spot.position[1], z: spot.position[2] },
      scale: spot.scale ?? 0.6,
      idle: spot.idle ?? 'graze',
      color: spot.color,
      month: spot.months,
      season: spot.seasons,
      contact: false,
      lods: { farDistance: 18, farScale: 0.75, cullDistance: 34 },
    });
    const wrapper = new THREE.Group();
    wrapper.visible = true;
    wrapper.add(scaffold.group);

    // Transparent proxy keeps the existing raycast/hover pipeline; the real
    // animals keep their own seasonal visibility on the inner group.
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 6),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      })
    );
    proxy.position.set(spot.position[0], spot.position[1] + 0.4, spot.position[2]);
    proxy.userData.cannotReceiveAO = true;
    wrapper.add(proxy);
    group.add(wrapper);

    wrappers.push({ object: wrapper, inner: scaffold.group });
    targets.push({
      object: proxy,
      kind: 'wildlife',
      id: spot.id,
      text: spot.fact,
      touchRadius: 18,
      isEnabled: () => wrapper.visible && scaffold.group.visible,
    });
    updates.push((_t, dt) => {
      scaffold.update(dt, _t, dt > 0 ? 1 : 0, getAnimalSeasonMonth());
    });
  }

  group.userData.wildlifeGroups = wrappers;
  appendLayerTargets(group, targets);
  return updates;
}

/**
 * Phase-1 procedural creature layer (Brief 2) on the three pilot sites.
 * One instanced field per species, GPU-animated, capped by the tier budget.
 * Blob shadows are part of each field, so nothing here may stamp contact AO.
 */
function addCreatureLife(group: THREE.Group, key: string, biome: LandmarkBiome): Update[] {
  if (!isCreaturePilotSite(key)) return [];
  // Dev-only capture override: `?creatures=on` also works on a software-GL
  // machine so contact sheets can be captured anywhere.
  const force =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('creatures') === 'on';
  const layer = createCreatureLayer({ key, biome, force });
  if (!layer) return [];
  layer.group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.userData.noShadow = true;
    obj.userData.cannotReceiveAO = true;
    obj.castShadow = false;
    obj.receiveShadow = false;
  });
  group.add(layer.group);
  group.userData.creatureLayer = layer;
  return [(t: number, dt: number) => layer.update(dt, t)];
}

/** A single tiny, unmarked prop per diorama — exact-hit only. */
function addHiddenDetail(group: THREE.Group, key: string): void {
  const egg = EASTER_EGGS[key];
  if (!egg) return;
  const holder = new THREE.Group();
  holder.position.set(egg.position[0], egg.position[1], egg.position[2]);
  const metal = M('#8d8372', 0.82, 0.2);
  const warm = M('#d5a94f', 0.78);
  const dark = M('#332d28', 0.92);
  const small = 0.075;

  if (egg.kind === 'keeper' || egg.kind === 'tool') {
    add(holder, B(small * 1.4, small * 2, small), metal, 0, small, 0);
    add(holder, new THREE.SphereGeometry(small * 0.55, 8, 6), warm, 0, small * 2.2, 0);
    add(holder, C(small * 0.08, small * 0.08, small * 0.9, 6), metal, small * 0.5, small * 1.4, 0);
  } else if (egg.kind === 'baboon' || egg.kind === 'tortoise' || egg.kind === 'bird') {
    const body = add(holder, new THREE.SphereGeometry(small, 10, 8), dark, 0, small, 0);
    body.scale.set(1.3, 0.8, 0.9);
    add(holder, new THREE.SphereGeometry(small * 0.5, 8, 6), dark, small, small * 1.5, 0);
    for (const s of [-1, 1]) {
      add(holder, C(small * 0.09, small * 0.09, small * 0.8, 6), dark, s * small * 0.5, small * 0.4, 0);
    }
  } else {
    add(holder, C(small, small * 0.8, small * 1.6, 8), warm, 0, small * 0.8, 0);
    add(holder, new THREE.SphereGeometry(small * 0.4, 8, 6), metal, 0, small * 1.8, 0);
    add(holder, B(small * 1.2, small * 0.2, small * 0.6), dark, 0, small * 0.1, 0);
  }

  holder.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.userData.noShadow = true;
    obj.userData.cannotReceiveAO = true;
    obj.castShadow = false;
    obj.receiveShadow = false;
  });
  group.add(holder);
  const eggs: Array<{ object: THREE.Object3D; id: string }> =
    (group.userData.eggGroups as Array<{ object: THREE.Object3D; id: string }> | undefined) ?? [];
  eggs.push({ object: holder, id: egg.id });
  group.userData.eggGroups = eggs;
  holder.userData.eggLabel = egg.label;
  appendLayerTargets(group, [
    {
      object: holder,
      kind: 'egg',
      id: egg.id,
      text: `${egg.label} — ${egg.fact}`,
      touchRadius: 0,
      isEnabled: () => holder.visible,
    },
  ]);
}

function appendLayerTargets(group: THREE.Group, targets: LayerTarget[]): void {
  const existing = (group.userData.interactiveTargets as LayerTarget[] | undefined) ?? [];
  group.userData.interactiveTargets = [...existing, ...targets];
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
  const sourceKey = key;
  key = normalizeProfileKey(key);
  const profile = getSiteProfile(key);
  const angle = keyAngle(key) + 0.6;

  addCraftedRim(group, profile);
  addStandUnderside(group, profile);
  addRimEdgeContinuity(group, profile);
  if (profile.biome === 'coastal' || profile.biome === 'wetland' || profile.biome === 'waterfall') {
    addSquareWaterPlate(group, profile);
    addEdgeWaterfall(group, angle, profile);
  }
  addBaseScatter(group, profile);
  const treeUpdates = addTreeRing(group, profile, angle);
  const updates = addAnchor(group, profile, angle);
  for (let i = 0; i < treeUpdates.length; i++) updates.push(treeUpdates[i]);
  const wildlife = addWildlifeLayer(group, sourceKey);
  for (let i = 0; i < wildlife.length; i++) updates.push(wildlife[i]);
  const creatures = addCreatureLife(group, sourceKey, profile.biome);
  for (let i = 0; i < creatures.length; i++) updates.push(creatures[i]);
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

  // Lift built-material saturation last: shared materials are boosted once,
  // and the accent trim added afterwards keeps its curated palette verbatim.
  boostBuiltVibrancy(group);
  addVibrantAccents(group, key, profile);

  // These stay out of the shadow/AO/vibrancy passes: the egg is deliberately
  // tiny and the silhouettes must not inflate the hero fit bounds.
  addHiddenDetail(group, sourceKey);
  addScaleReference(group, sourceKey);

  const prev = group.userData.tick as Tick | undefined;
  group.userData.hasAnimatedShadowMeshes =
    Boolean(prev) || profile.anchor === 'windpump' || swayItems.length > 0;
  group.userData.tick = (t: number, dt: number) => {
    if (prev) prev(t, dt);
    for (let i = 0; i < updates.length; i++) updates[i](t, dt);
  };
  group.userData.audioProfile = {
    ...profile.audio,
    sources: buildSpatialSources(key, profile, angle),
  } satisfies AmbientSiteProfile;
  group.userData.biome = profile.biome;
  return group;
}

/**
 * Finalize a raw landmark build with the surrounding context kit disabled.
 *
 * Only the render/audio infrastructure the builders rely on is kept: tree LOD
 * batching, contact-shadow stamping, the animated-shadow flag and the site
 * metadata the engine reads when swapping landmarks. No rim, scatter, ring,
 * anchor prop, weather, wildlife, birds or hidden detail is added.
 *
 * Stand continuity (rim block, underside, edge feature strips, water plate)
 * is applied here so every landmark — including the three pilot-plinth sites —
 * gets seamless terrain-to-stand integration.
 */
export function finalizeLandmarkGroup(key: string, group: THREE.Group): THREE.Group {
  finalizeTreeBatch(group);
  stampContactShadowsFromMeshes(group);
  finalizeContactShadows(group);

  const profileKey = normalizeProfileKey(key);
  const profile = getSiteProfile(profileKey);

  // --- Stand continuity kit -------------------------------------------
  // Pilot-plinth landmarks (Kruger, Boulders, Orlando) already have their own
  // geological terrain slab built by buildPilotPlinth / attachPilotPlinthToGroup,
  // so we skip adding a second rim block on top. All other landmarks get the
  // full diorama rim + underside. Every landmark — pilot or not — gets the
  // feature-continuation strips and water features, since those are always
  // additive and complementary to whatever slab is present.
  const hasPilotPlinth = Boolean(group.userData.plinthOutlineGeo);
  const angle = keyAngle(profileKey) + 0.6;

  if (!hasPilotPlinth) {
    addCraftedRim(group, profile);
    addStandUnderside(group, profile);
  }
  addRimEdgeContinuity(group, profile);
  if (profile.biome === 'coastal' || profile.biome === 'wetland' || profile.biome === 'waterfall') {
    addSquareWaterPlate(group, profile);
    addEdgeWaterfall(group, angle, profile);
  }
  // --------------------------------------------------------------------

  // Creature life is part of the live build path (the context kit is not).
  const creatures = addCreatureLife(group, key, profile.biome);
  if (creatures.length > 0) {
    const prevTick = group.userData.tick as Tick | undefined;
    group.userData.tick = (t: number, dt: number) => {
      if (prevTick) prevTick(t, dt);
      for (let i = 0; i < creatures.length; i++) creatures[i](t, dt);
    };
  }

  group.userData.hasAnimatedShadowMeshes = Boolean(group.userData.tick) || swayItems.length > 0;
  group.userData.audioProfile = {
    ...profile.audio,
    sources: buildSpatialSources(profileKey, profile, keyAngle(profileKey) + 0.6),
  } satisfies AmbientSiteProfile;
  group.userData.biome = profile.biome;
  return group;
}
