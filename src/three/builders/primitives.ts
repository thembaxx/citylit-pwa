import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  cascadeize,
  getBrushedRoughnessTexture,
  getCanvasBumpTexture,
  getCanvasNormalTexture,
  getPlasterBumpTexture,
  getPlasterNormalTexture,
  getRoofBumpTexture,
  getRoofNormalTexture,
  getSoftTexture,
  getSurfaceRoughnessTexture,
  getStoneBumpTexture,
  getStoneNormalTexture,
  getWoodBumpTexture,
  getWoodNormalTexture,
  grassWindy,
  interiorParallaxShader,
  lights,
  normalMapsActive,
  getBrushedNormalTexture,
  prepareCanvasTexture,
  waterize,
  type WaterFlow,
  wetPuddleShader,
  windy,
  WU,
} from '../shaders';
import { createWindowFacade } from '../windowLights';

export interface SwayItem {
  o: THREE.Object3D;
  ph: number;
  a: number;
  sp: number;
}

export interface WetMaterialEntry {
  mat: THREE.MeshPhysicalMaterial;
  dryColor: THREE.Color;
  wetColor: THREE.Color;
  rDry: number;
  rWet: number;
}

export type SurfaceKind = 'stone' | 'plaster' | 'roof' | 'canvas' | 'wood';

const heightTextureByKind: Record<SurfaceKind, () => THREE.CanvasTexture> = {
  stone: getStoneBumpTexture,
  plaster: getPlasterBumpTexture,
  roof: getRoofBumpTexture,
  canvas: getCanvasBumpTexture,
  wood: getWoodBumpTexture,
};

const normalTextureByKind: Record<SurfaceKind, () => THREE.CanvasTexture | null> = {
  stone: getStoneNormalTexture,
  plaster: getPlasterNormalTexture,
  roof: getRoofNormalTexture,
  canvas: getCanvasNormalTexture,
  wood: getWoodNormalTexture,
};

/**
 * Shared surface-detail parameters for every procedural material. The height
 * map is always supplied as a fallback; when normal maps are enabled the
 * renderer prefers them automatically (Three's normal/bump chunks are an
 * either/or), so the same call sites work on software GL and full hardware.
 */
export function surfaceDetail(
  kind: SurfaceKind,
  bumpScale: number
): Pick<
  THREE.MeshStandardMaterialParameters,
  'bumpMap' | 'bumpScale' | 'normalMap' | 'normalScale' | 'roughnessMap'
> {
  const detail: Pick<
    THREE.MeshStandardMaterialParameters,
    'bumpMap' | 'bumpScale' | 'normalMap' | 'normalScale' | 'roughnessMap'
  > = {
    bumpMap: heightTextureByKind[kind](),
    bumpScale,
    // Works alongside normalMap on hardware and keeps the height-map fallback
    // useful on software GL — Three only treats bump/normal as exclusive.
    roughnessMap: getSurfaceRoughnessTexture(kind),
  };
  const normalMap = normalMapsActive() ? normalTextureByKind[kind]() : null;
  if (normalMap) {
    const s = THREE.MathUtils.clamp(bumpScale * 20, 0.2, 1.15);
    detail.normalMap = normalMap;
    detail.normalScale = new THREE.Vector2(s, s);
  }
  return detail;
}

export interface InstanceTransform {
  x: number;
  y: number;
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

export const glowMaterials: THREE.MeshStandardMaterial[] = [];
export const swayItems: SwayItem[] = [];
export const wetMaterials: WetMaterialEntry[] = [];

const matCache: Record<string, THREE.MeshStandardMaterial> = {};
const foliageCache: Record<string, THREE.MeshStandardMaterial> = {};
const geoCache: Record<string, THREE.BufferGeometry> = {};
let grassMatShared: THREE.MeshStandardMaterial | null = null;

function cacheMat(key: string, mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  mat.userData.sharedResource = true;
  matCache[key] = mat;
  return mat;
}

function cacheGeo<T extends THREE.BufferGeometry>(key: string, geo: T): T {
  geo.userData.sharedResource = true;
  geoCache[key] = geo;
  return geo;
}

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();
const tmpColor = new THREE.Color();

let lastWetRain = -1;

export function resetSceneDynamicLists(ringMat: THREE.MeshStandardMaterial): void {
  glowMaterials.length = 0;
  glowMaterials.push(ringMat);
  swayItems.length = 0;
  wetMaterials.length = 0;
  lastWetRain = -1;
}

export function updateWetSurfaces(rain: number): void {
  const w = Math.max(0, Math.min(1, rain));
  if (Math.abs(w - lastWetRain) < 0.002) return;
  lastWetRain = w;
  const wetFactor = w * w * (3 - 2 * w);
  for (let i = 0; i < wetMaterials.length; i++) {
    const entry = wetMaterials[i];
    entry.mat.roughness = entry.rDry + (entry.rWet - entry.rDry) * wetFactor;
    entry.mat.color.copy(entry.dryColor).lerp(entry.wetColor, wetFactor * 0.55);
    entry.mat.envMapIntensity = 0.45 + wetFactor * 0.85;
    entry.mat.clearcoat = 0.02 + wetFactor * 0.83;
    entry.mat.clearcoatRoughness = 0.24 - wetFactor * 0.18;
  }
}

let roofDirtCache: THREE.CanvasTexture | null = null;

/**
 * Procedural roof-face map: flat base tone plus a mix of dark grime and pale
 * dust splatter with faint vertical streaks. Reused at 0.8 opacity by
 * MRoof({ dirty: true }) so repeated landmarks share one variation-rich map.
 */
export function getRoofDirtMap(): THREE.CanvasTexture {
  if (roofDirtCache) return roofDirtCache;
  const size = 192;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  // Strength is baked in: there is no mapIntensity on materials in this
  // Three version, so the map colors carry the dirt modulation directly.
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#5c4332';
  ctx.fillRect(0, 0, size, size);
  // Splatter patches: darker grime and lighter airborne dust.
  ctx.globalAlpha = 0.62;
  for (let i = 0; i < 420; i++) {
    const r = (Math.random() * 3 + 1.2) * Math.max(size / 24, 1.5);
    const x = Math.random() * size + r;
    const y = Math.random() * size + r;
    ctx.fillStyle = Math.random() < 0.45 ? '#322618' : '#f1e5ca';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Faint streaks where roof courses run diagonally.
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * size;
    const t = Math.random();
    ctx.strokeStyle = `rgba(0,0,0,${0.05 * (0.3 + 0.7 * t)})`;
    ctx.lineWidth = Math.random() < 0.5 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x, -size * Math.random() * 0.6);
    ctx.lineTo(x + size * Math.random() * 0.3, size + size * Math.random() * 0.4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = prepareCanvasTexture(new THREE.CanvasTexture(c));
  tex.colorSpace = THREE.SRGBColorSpace;
  roofDirtCache = tex;
  return tex;
}

export function MRoof(
  c: THREE.ColorRepresentation,
  r = 0.8,
  bumpScale = 0.032,
  opts?: { dirty?: boolean }
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `roof_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}${opts?.dirty ? '_d' : ''}`;
  if (matCache[key]) return matCache[key];
  // Thin gloss on the roof ridge so it separates from the dark thatch below.
  const mat = new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: r,
    metalness: 0.03,
    clearcoat: 0.1,
    clearcoatRoughness: 0.35,
    ...surfaceDetail('roof', bumpScale),
  });
  if (opts?.dirty) mat.map = getRoofDirtMap();
  return cacheMat(key, mat);
}

export function MSteel(
  c: THREE.ColorRepresentation,
  r = 0.74,
  m = 0.9
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `steel_${colHex}_${r.toFixed(2)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  // Stronger specular than the earlier pass: steel reads as a true polished
  // metal, with tangent-space normals for the swept strokes.
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    envMapIntensity: 1.35,
    roughnessMap: getBrushedRoughnessTexture(),
    normalMap: getBrushedNormalTexture(),
    normalScale: new THREE.Vector2(2.5, 2.5),
  });
  return cacheMat(key, mat);
}

export function MCanvas(
  c: THREE.ColorRepresentation,
  r = 0.88,
  bumpScale = 0.022
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `canvas_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: 0,
    ...surfaceDetail('canvas', bumpScale),
  });
  return cacheMat(key, mat);
}

export function MGlass(
  c: THREE.ColorRepresentation,
  opacity = 0.62,
  r = 0.055,
  m = 0.42
): THREE.MeshPhysicalMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `glass_${colHex}_${opacity.toFixed(2)}_${r.toFixed(2)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key] as THREE.MeshPhysicalMaterial;
  const refractive = opacity < 1;
  // Tint the body darker than the emissive/lit layers so glass reads as a
  // shaded void rather than a pale sheet in the miniature lighting.
  const bodyColor = new THREE.Color(c).multiplyScalar(0.72);
  const mat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    roughness: Math.min(r, 0.09),
    metalness: m,
    envMapIntensity: 1.7,
    // Transmission handles the see-through look; plain alpha blending would
    // sort badly against the miniature plinth and the rain/dissolve layers.
    transparent: !refractive,
    opacity: refractive ? 1 : opacity,
    depthWrite: true,
    transmission: refractive ? THREE.MathUtils.clamp(0.55 + (1 - opacity) * 0.5, 0, 0.95) : 0,
    ior: 1.46,
    thickness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.04,
  });
  return cacheMat(key, mat) as THREE.MeshPhysicalMaterial;
}

const litWindowCache = new Map<string, THREE.MeshStandardMaterial>();

/**
 * Procedural facade with varied lit windows. One CanvasTexture pair and one
 * material regardless of window count, so it costs a single draw call and
 * plugs into the existing night/emissive update system.
 */
export function litWindowMaterial(opts: {
  wall: THREE.ColorRepresentation;
  lit?: THREE.ColorRepresentation;
  dark?: THREE.ColorRepresentation;
  cols?: number;
  rows?: number;
  seed?: number;
  chance?: number;
  intensity?: number;
}): THREE.MeshStandardMaterial {
  const cols = Math.max(1, Math.round(opts.cols ?? 12));
  const rows = Math.max(1, Math.round(opts.rows ?? 24));
  const chance = Math.max(0, Math.min(1, opts.chance ?? 0.55));
  const intensity = opts.intensity ?? 0.18;
  const wall = new THREE.Color(opts.wall).getHexString();
  const lit = new THREE.Color(opts.lit ?? '#ffd582').getHexString();
  const dark = new THREE.Color(opts.dark ?? '#202630').getHexString();
  const key = `${wall}_${lit}_${dark}_${cols}x${rows}_${opts.seed ?? 0}_${chance}_${intensity}`;
  const cached = litWindowCache.get(key);
  if (cached) {
    if (!glowMaterials.includes(cached)) glowMaterials.push(cached);
    return cached;
  }

  // The facade itself is procedural and time-driven: windowLights re-bakes the
  // emissive map as the hour advances, so which rooms are lit changes through
  // the day instead of being frozen at build time.
  const facade = createWindowFacade({
    wall: `#${wall}`,
    lit: `#${lit}`,
    dark: `#${dark}`,
    cols,
    rows,
    seed: opts.seed ?? 0,
    chance,
  });
  const mat = new THREE.MeshStandardMaterial({
    map: facade.map,
    emissive: '#ffffff',
    emissiveMap: facade.emissiveMap,
    emissiveIntensity: intensity,
    roughness: 0.54,
    metalness: 0.14,
    envMapIntensity: 1.4,
    ...surfaceDetail('plaster', 0.012),
    side: THREE.DoubleSide,
  });
  mat.userData.sharedResource = true;
  // Lit window glow is gated on the solar clock, not on the generic night lift.
  mat.userData.windowLit = true;
  interiorParallaxShader(mat, cols, rows, facade.ramp);
  litWindowCache.set(key, mat);
  glowMaterials.push(mat);
  return mat;
}

/**
 * Shared pool of single-pane glazing variants for ordinary recessed facade
 * windows. Each window picks a variant from its position, which scatters the
 * lit/dark state without a material per pane.
 */
export const PANE_VARIANTS = 6;

const paneMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

/**
 * Recessed single-pane window glazing on the same time-of-day schedule as the
 * tower facades: the emissive map is re-baked with the hour, so an ordinary
 * facade window switches on and off through the evening like a lit tower pane.
 */
export function windowPaneMaterial(
  variant: number,
  dark: THREE.ColorRepresentation = '#10242f',
  lit: THREE.ColorRepresentation = '#ffd390'
): THREE.MeshStandardMaterial {
  const v = Math.abs(Math.round(variant)) % PANE_VARIANTS;
  const darkHex = new THREE.Color(dark).getHexString();
  const litHex = new THREE.Color(lit).getHexString();
  const key = `pane_${v}_${darkHex}_${litHex}`;
  const cached = paneMaterialCache.get(key);
  if (cached) {
    if (!glowMaterials.includes(cached)) glowMaterials.push(cached);
    return cached;
  }
  const facade = createWindowFacade({
    wall: '#181c22',
    lit: `#${litHex}`,
    dark: `#${darkHex}`,
    cols: 1,
    rows: 1,
    seed: 4001 + v,
    chance: 0.45,
  });
  const mat = new THREE.MeshStandardMaterial({
    map: facade.map,
    emissive: '#ffffff',
    emissiveMap: facade.emissiveMap,
    emissiveIntensity: 0.45,
    roughness: 0.32,
    metalness: 0.2,
    envMapIntensity: 1.6,
  });
  // Softer than a full tower facade: a single pane should read as a warm room,
  // not a beacon competing with the streetlamps.
  mat.userData.i = 0.52;
  mat.userData.sharedResource = true;
  mat.userData.windowLit = true;
  interiorParallaxShader(mat, 1, 1, facade.ramp);
  paneMaterialCache.set(key, mat);
  glowMaterials.push(mat);
  return mat;
}

/**
 * Moderate saturation lift applied to the man-made colours of the dioramas.
 * Hue and lightness are preserved, and achromatic tones (clouds, white paint)
 * are left alone, so the "miniature tabletop" palette gains colour without
 * turning rock, sand or foliage into neon. Natural-surface factories tag their
 * materials with `naturalSurface` and are skipped by `boostBuiltVibrancy`.
 */
const VIBRANT_SATURATION = 1.25;
const VIBRANT_MIN_SATURATION = 0.04;
const VIBRANT_MAX_SATURATION = 0.92;
const vibrantHsl = { h: 0, s: 0, l: 0 };

function liftSaturation(color: THREE.Color): void {
  color.getHSL(vibrantHsl);
  if (vibrantHsl.s <= VIBRANT_MIN_SATURATION || vibrantHsl.s >= VIBRANT_MAX_SATURATION) return;
  color.setHSL(
    vibrantHsl.h,
    Math.min(VIBRANT_MAX_SATURATION, vibrantHsl.s * VIBRANT_SATURATION),
    vibrantHsl.l
  );
}

/**
 * Lift the saturation of every built (non-natural, non-vertex-coloured)
 * material in a landmark group. Guarded per material so the shared material
 * cache is only boosted once no matter how many landmarks are built.
 */
export function boostBuiltVibrancy(root: THREE.Object3D): void {
  root.traverse((object) => {
    const material = (object as THREE.Mesh).material;
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];
    for (const entry of materials) {
      const mat = entry as THREE.MeshStandardMaterial;
      if (
        !mat ||
        mat.userData.naturalSurface ||
        mat.userData.vibrancyApplied ||
        mat.vertexColors
      ) {
        continue;
      }
      mat.userData.vibrancyApplied = true;
      if (mat.color) liftSaturation(mat.color);
      if (mat.emissive) liftSaturation(mat.emissive);
    }
  });
}

export function MPatina(c: THREE.ColorRepresentation): THREE.MeshStandardMaterial {
  return M(c, 0.58, 0.42);
}

export function M(c: THREE.ColorRepresentation, r = 0.7, m = 0): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `m_${colHex}_${r.toFixed(2)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const finalMat = r <= 0.16 && m >= 0.1 ? waterize(mat) : mat;
  return cacheMat(key, finalMat);
}

export function MStone(
  c: THREE.ColorRepresentation,
  r = 0.9,
  bumpScale = 0.045,
  m = 0.02
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `stone_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    ...surfaceDetail('stone', bumpScale),
  });
  mat.userData.naturalSurface = true;
  return cacheMat(key, mat);
}

export function MPlaster(
  c: THREE.ColorRepresentation,
  r = 0.75,
  bumpScale = 0.02,
  m = 0.02
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `plaster_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    ...surfaceDetail('plaster', bumpScale),
  });
  return cacheMat(key, mat);
}

export function MWood(
  c: THREE.ColorRepresentation,
  r = 0.84,
  bumpScale = 0.03
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `wood_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: 0.0,
    ...surfaceDetail('wood', bumpScale),
  });
  return cacheMat(key, mat);
}

/**
 * Natural organic bark & thatch material (tagged naturalSurface=true so
 * boostBuiltVibrancy leaves matte ash-grey bark and dried thatch un-saturated).
 */
export function MBark(
  c: THREE.ColorRepresentation,
  r = 0.9,
  bumpScale = 0.036
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `bark_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: 0.0,
    ...surfaceDetail('wood', bumpScale),
  });
  mat.userData.naturalSurface = true;
  return cacheMat(key, mat);
}

export function MT(
  c: THREE.ColorRepresentation,
  opacity = 0.6,
  r = 0.15,
  m = 0.35,
  doubleSide = true
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `mt_${colHex}_${opacity.toFixed(2)}_${r.toFixed(2)}_${m.toFixed(2)}_${doubleSide ? 1 : 0}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    transparent: true,
    opacity,
    roughness: r,
    metalness: m,
    side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: opacity >= 0.85,
  });
  return cacheMat(key, mat);
}

export function MWater(
  c: THREE.ColorRepresentation = '#1a7598',
  r = 0.1,
  m = 0.25,
  opacity = 1,
  flow?: WaterFlow
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const rawX = flow?.x ?? 0;
  const rawZ = flow?.z ?? 0;
  const len = Math.hypot(rawX, rawZ);
  const fx = len > 1e-5 ? (rawX / len).toFixed(3) : '0.000';
  const fz = len > 1e-5 ? (rawZ / len).toFixed(3) : '0.000';
  const fs = Math.max(0, flow?.speed ?? 1).toFixed(3);
  const key = `wat_${colHex}_${r.toFixed(2)}_${m.toFixed(2)}_${opacity.toFixed(2)}_${fx}_${fz}_${fs}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    transparent: opacity < 1,
    opacity,
  });
  mat.userData.naturalSurface = true;
  waterize(mat, flow);
  return cacheMat(key, mat);
}

export function MCascade(
  c: THREE.ColorRepresentation = '#d9f4ff',
  opacity = 0.88
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `casc_${colHex}_${opacity.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.22,
    metalness: 0.05,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });
  mat.userData.naturalSurface = true;
  cascadeize(mat);
  return cacheMat(key, mat);
}

export function MWet(
  c: THREE.ColorRepresentation,
  rDry = 0.84,
  rWet = 0.16,
  m = 0.05,
  tex: 'stone' | 'plaster' | 'plain' = 'stone'
): THREE.MeshPhysicalMaterial {
  const dryColor = new THREE.Color(c);
  const wetColor = dryColor.clone().multiplyScalar(0.72);
  const mat = new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: rDry,
    metalness: m,
    // Keep clearcoat non-zero at compile time so rain only has to animate the
    // value below, never trigger a shader recompile mid-weather transition.
    clearcoat: 0.02,
    clearcoatRoughness: 0.24,
    ...(tex !== 'plain' ? surfaceDetail(tex, tex === 'stone' ? 0.022 : 0.01) : {}),
  });
  mat.userData.naturalSurface = true;
  mat.userData.puddleWet = true;
  wetPuddleShader(mat);
  wetMaterials.push({ mat, dryColor, wetColor, rDry, rWet });
  return mat;
}

export function G(c: THREE.ColorRepresentation, intensity = 1): THREE.MeshStandardMaterial {
  // Darker glazing body with the same emissive core: the lamp still glows, but
  // the unlit glass no longer blows out to a flat saturated highlight.
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(c).multiplyScalar(0.78),
    emissive: c,
    emissiveIntensity: 0.15,
    roughness: 0.3,
    metalness: 0.12,
    envMapIntensity: 1.45,
  });
  mat.userData.i = intensity;
  glowMaterials.push(mat);
  return lights(mat);
}

export function Mc(c: string): THREE.MeshStandardMaterial {
  if (foliageCache[c]) return foliageCache[c];
  const mat = windy(new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0.02 }));
  mat.userData.sharedResource = true;
  mat.userData.naturalSurface = true;
  foliageCache[c] = mat;
  return mat;
}

export function add<T extends THREE.BufferGeometry, U extends THREE.Material>(
  g: THREE.Object3D,
  geo: T,
  mat: U,
  x = 0,
  y = 0,
  z = 0
): THREE.Mesh<T, U> {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  g.add(mesh);
  return mesh;
}

/**
 * Collapse a group's plain-coloured child meshes into one mesh per material.
 * Lets builders add fine architectural detail without paying a draw call per part.
 */
export function mergeByMaterial(g: THREE.Group): THREE.Group {
  g.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.Mesh[]>();
  for (const child of [...g.children]) {
    if (!(child instanceof THREE.Mesh) || child instanceof THREE.InstancedMesh) continue;
    const mat = child.material as THREE.Material & { vertexColors?: boolean };
    if (mat.vertexColors) continue;
    const list = buckets.get(mat) ?? [];
    list.push(child);
    buckets.set(mat, list);
  }
  buckets.forEach((meshes, mat) => {
    if (meshes.length < 2) return;
    const stdMat = mat as THREE.MeshStandardMaterial;
    const usesMaps = Boolean(
      stdMat.map || stdMat.bumpMap || stdMat.roughnessMap || stdMat.normalMap || stdMat.emissiveMap
    );
    let hasAllUv = true;
    for (let i = 0; i < meshes.length; i++) {
      if (!meshes[i].geometry.attributes.uv) {
        hasAllUv = false;
        break;
      }
    }
    const dropUv = !hasAllUv && !usesMaps;
    const geos: THREE.BufferGeometry[] = [];
    for (const m of meshes) {
      const src = m.geometry;
      const geo = src.index ? src.toNonIndexed() : src.clone();
      if (dropUv) geo.deleteAttribute('uv');
      geo.deleteAttribute('uv1');
      geo.deleteAttribute('uv2');
      m.updateMatrix();
      geo.applyMatrix4(m.matrix);
      geos.push(geo);
    }
    const merged = mergeGeometries(geos, false);
    geos.forEach((geo) => geo.dispose());
    if (!merged) return; // keep the originals if the attribute sets disagree
    meshes.forEach((m) => m.removeFromParent());
    merged.computeBoundingSphere();
    g.add(new THREE.Mesh(merged, mat));
  });
  return g;
}

export const B = (w: number, h: number, d: number): THREE.BoxGeometry =>
  new THREE.BoxGeometry(w, h, d);

export function CB(w: number, h: number, d: number, r = 0.04, segs = 3): THREE.BufferGeometry {
  const cr = Math.min(r, Math.min(w, h, d) * 0.42);
  const key = `cb_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}_${cr.toFixed(3)}_${segs}`;
  if (geoCache[key]) return geoCache[key];
  const geo = new RoundedBoxGeometry(w, h, d, segs, cr);
  return cacheGeo(key, geo);
}

export const C = (
  rt: number,
  rb: number,
  h: number,
  seg = 32,
  hseg = 1,
  open = false,
  thetaStart = 0,
  thetaLength = Math.PI * 2
): THREE.CylinderGeometry => {
  // Big silhouettes keep their full segment budget; small fittings (rails,
  // cables, posts) were paying for 48-84 segments they can never resolve.
  const radius = Math.max(Math.abs(rt), Math.abs(rb));
  let effective = seg;
  if (seg > 24) effective = THREE.MathUtils.clamp(Math.round(12 + radius * 18), 12, seg);
  if (thetaLength < Math.PI * 2 - 0.001) {
    effective = Math.max(effective, Math.round((seg * thetaLength) / (Math.PI * 2)));
  }
  return new THREE.CylinderGeometry(rt, rb, h, effective, hseg, open, thetaStart, thetaLength);
};

export function instancedMeshes(
  g: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  transforms: readonly InstanceTransform[],
  colors?: readonly THREE.ColorRepresentation[]
): THREE.InstancedMesh | null {
  if (!transforms.length) return null;
  const im = new THREE.InstancedMesh(geo, mat, transforms.length);
  for (let i = 0; i < transforms.length; i++) {
    const t = transforms[i];
    tmpPos.set(t.x, t.y, t.z);
    tmpEuler.set(t.rx ?? 0, t.ry ?? 0, t.rz ?? 0);
    tmpQuat.setFromEuler(tmpEuler);
    tmpScale.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
    tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
    im.setMatrixAt(i, tmpMatrix);
    if (colors && colors.length > 0) {
      im.setColorAt(i, tmpColor.set(colors[i % colors.length]));
    }
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  g.add(im);
  return im;
}

/** Instanced gallery/balcony railing: one torus rail plus one instanced post batch. */
export function railing(
  g: THREE.Object3D,
  radius: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  posts = 12,
  height = 0.16,
  postRadius = 0.012
): THREE.Group {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  g.add(holder);
  const transforms: InstanceTransform[] = [];
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    transforms.push({
      x: radius * Math.cos(a),
      y: height / 2,
      z: radius * Math.sin(a),
    });
  }
  instancedMeshes(holder, C(postRadius, postRadius, height, 8), mat, transforms);
  add(
    holder,
    new THREE.TorusGeometry(radius, postRadius * 0.8, 6, Math.max(24, posts * 3)).rotateX(
      Math.PI / 2
    ),
    mat,
    0,
    height,
    0
  );
  return holder;
}

export function gableRoofGeo(
  w: number,
  d: number,
  h: number,
  overhang = 0.08
): THREE.BufferGeometry {
  const hw = w / 2 + overhang;
  const hd = d + overhang * 2;
  const key = `gr_${hw.toFixed(3)}_${hd.toFixed(3)}_${h.toFixed(3)}`;
  if (geoCache[key]) return geoCache[key];
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(0, h);
  s.lineTo(hw, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: hd,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 2,
    curveSegments: 16,
  }).translate(0, 0, -hd / 2);
  return cacheGeo(key, geo);
}

export function capeDutchGableGeo(w = 0.8, h = 0.72, depth = 0.14): THREE.BufferGeometry {
  const key = `cdg_${w.toFixed(2)}_${h.toFixed(2)}_${depth.toFixed(2)}`;
  if (geoCache[key]) return geoCache[key];
  const hw = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(-hw, h * 0.25);
  s.bezierCurveTo(-hw * 0.75, h * 0.28, -hw * 0.7, h * 0.56, -hw * 0.4, h * 0.62);
  s.bezierCurveTo(-hw * 0.28, h * 0.85, -hw * 0.12, h, 0, h);
  s.bezierCurveTo(hw * 0.12, h, hw * 0.28, h * 0.85, hw * 0.4, h * 0.62);
  s.bezierCurveTo(hw * 0.7, h * 0.56, hw * 0.75, h * 0.28, hw, h * 0.25);
  s.lineTo(hw, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.014,
    bevelThickness: 0.014,
    bevelSegments: 3,
    curveSegments: 14,
  }).translate(0, 0, -depth / 2);
  return cacheGeo(key, geo);
}

export function archGeo(w: number, h: number, rArch: number, depth: number): THREE.BufferGeometry {
  const key = `arch_${w.toFixed(2)}_${h.toFixed(2)}_${rArch.toFixed(2)}_${depth.toFixed(2)}`;
  if (geoCache[key]) return geoCache[key];
  const hw = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(-hw, h);
  s.lineTo(hw, h);
  s.lineTo(hw, 0);
  s.lineTo(rArch, 0);
  s.absarc(0, h * 0.48, rArch, 0, Math.PI, false);
  s.lineTo(-rArch, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 2,
    curveSegments: 18,
  }).translate(0, 0, -depth / 2);
  return cacheGeo(key, geo);
}

export const n = (x: number, z: number): number =>
  Math.sin(x * 1.3 + z * 0.7) * 0.5 +
  Math.sin(x * 2.9 - z * 2.1) * 0.25 +
  Math.sin(x * 5.7 + z * 4.3) * 0.12;

export const R = (i: number): number => {
  const x = Math.sin(i * 127.1) * 43758.5;
  return x - Math.floor(x);
};

export function lines(verts: number[], col: THREE.ColorRepresentation): THREE.LineSegments {
  const geo = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute(verts, 3)
  );
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col }));
}

const cableStart = new THREE.Vector3();
const cableEnd = new THREE.Vector3();
const cableMid = new THREE.Vector3();
const cableDir = new THREE.Vector3();
const cableUp = new THREE.Vector3(0, 1, 0);

/**
 * Batched volumetric steel cables / truss chords (replaces 1px WebGL `lines()`).
 * Renders all `[p1, p2]` segments in one InstancedMesh draw call that catches shadows & AO.
 */
export function cableBatch(
  g: THREE.Object3D,
  segments: ReadonlyArray<readonly [[number, number, number], [number, number, number]]>,
  radius: number,
  mat: THREE.Material
): THREE.InstancedMesh | null {
  if (!segments.length) return null;
  const key = `cable_unit_cyl`;
  const geo = geoCache[key] ?? cacheGeo(key, new THREE.CylinderGeometry(1, 1, 1, 6, 1));
  const im = new THREE.InstancedMesh(geo, mat, segments.length);
  for (let i = 0; i < segments.length; i++) {
    const [p1, p2] = segments[i];
    cableStart.set(p1[0], p1[1], p1[2]);
    cableEnd.set(p2[0], p2[1], p2[2]);
    const len = cableStart.distanceTo(cableEnd);
    if (len < 1e-4) {
      tmpScale.set(0, 0, 0);
      tmpMatrix.compose(cableStart, tmpQuat.identity(), tmpScale);
      im.setMatrixAt(i, tmpMatrix);
      continue;
    }
    cableMid.addVectors(cableStart, cableEnd).multiplyScalar(0.5);
    cableDir.subVectors(cableEnd, cableStart).divideScalar(len);
    tmpQuat.setFromUnitVectors(cableUp, cableDir);
    tmpScale.set(radius, len, radius);
    tmpMatrix.compose(cableMid, tmpQuat, tmpScale);
    im.setMatrixAt(i, tmpMatrix);
  }
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  g.add(im);
  return im;
}

/** Single volumetric gravity-sagged parabolic catenary cable tube. */
export function catenaryTube(
  g: THREE.Object3D,
  p1: readonly [number, number, number],
  p2: readonly [number, number, number],
  sag: number,
  radius: number,
  mat: THREE.Material,
  segs = 18,
  radialSegs = 6
): THREE.Mesh {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const x = p1[0] + (p2[0] - p1[0]) * u;
    const y = p1[1] + (p2[1] - p1[1]) * u - sag * 4 * u * (1 - u);
    const z = p1[2] + (p2[2] - p1[2]) * u;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, radialSegs, false), mat);
  g.add(mesh);
  return mesh;
}

export function tint<T extends THREE.BufferGeometry>(
  geo: T,
  fn: (k: THREE.Color, x: number, y: number, z: number) => void
): T {
  const p = geo.attributes.position;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const c: number[] = [];
  const k = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    fn(k, p.getX(i), p.getY(i), p.getZ(i));
    // A very small normal-driven lift on bevel-ish faces (45°-ish slopes)
    // reads as worn edges without adding geometry or a second material.
    const up = nrm ? Math.abs(nrm.getY(i)) : 0;
    const bevel = THREE.MathUtils.clamp(1 - Math.abs(up - 0.58) * 3.2, 0, 1);
    const wear = 1 + 0.028 * bevel;
    c.push(Math.min(1, k.r * wear), Math.min(1, k.g * wear), Math.min(1, k.b * wear));
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  if (!nrm) geo.computeVertexNormals();
  return geo;
}

export interface WeatheringOptions {
  /** Strength of base/crevice darkening (default 0.3). */
  ao?: number;
  /** Strength of upward-face lift (default 0.1). */
  exposure?: number;
  /** Deterministic per-vertex value-noise amount (default 0.06). */
  grain?: number;
  /** World-Y span over which contact AO fades; auto-detected when omitted. */
  aoSpan?: number;
  /** Subtle edge-wear highlight on bevel-ish faces (default 0.025). */
  edgeWear?: number;
}

/**
 * Multiplies an existing vertex-color attribute with cheap baked weathering:
 * contact darkening, sheltered-face creases, upward exposure and fine grain.
 * Composes with the hand-authored gradients from `tint()` instead of replacing
 * them, so it adds perceived detail without new geometry or draw calls.
 */
export function weatherVertexColors<T extends THREE.BufferGeometry>(
  geo: T,
  opts: WeatheringOptions = {}
): T {
  const p = geo.attributes.position;
  if (!p) return geo;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  let colors = geo.attributes.color as THREE.BufferAttribute | undefined;
  if (!colors) {
    geo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(new Float32Array(p.count * 3).fill(1), 3)
    );
    colors = geo.attributes.color as THREE.BufferAttribute;
  }
  const ao = opts.ao ?? 0.3;
  const exposure = opts.exposure ?? 0.1;
  const grain = opts.grain ?? 0.06;
  const edgeWear = opts.edgeWear ?? 0.025;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const span = Math.max(0.001, opts.aoSpan ?? maxY - minY);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const up = THREE.MathUtils.clamp(nrm.getY(i), -1, 1);
    const aoFade = THREE.MathUtils.smoothstep((y - minY) / span, 0, 0.55);
    const shelter = 1 - THREE.MathUtils.smoothstep(up, -0.4, 0.6);
    const groundAO = (1 - aoFade) * 0.72 + shelter * 0.28;
    const noise = Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
    // Convex-ish bevels catch a little light; combine with noise so the wear
    // breaks up instead of outlining every edge uniformly.
    const bevel = THREE.MathUtils.clamp(1 - Math.abs(Math.abs(up) - 0.58) * 3.2, 0, 1);
    const ridgeLift = up > 0.72 ? (up - 0.72) * 0.14 : 0;
    const creviceShade = up < -0.15 ? 0.92 : 1;
    const worn = 1 + edgeWear * bevel * (0.55 + noise * 0.45) + ridgeLift;
    const shade =
      (1 - ao * groundAO) *
      (1 + exposure * Math.max(0, up)) *
      (1 - grain * 0.5 + grain * noise) *
      worn *
      creviceShade;
    colors.setXYZ(i, colors.getX(i) * shade, colors.getY(i) * shade, colors.getZ(i) * shade);
  }
  colors.needsUpdate = true;
  return geo;
}

export function rock(
  g: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  x: number,
  z: number,
  c1: string,
  c2: string,
  k = 0.12,
  y0 = 0
): THREE.Mesh {
  const gm = C(rt, rb, h, 48, 12);
  const p = gm.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const a = Math.atan2(Z, X);
    const bedding = Math.sin(Y * 14 + a * 0.4) * 0.028;
    const ledge = Math.pow(Math.max(0, Math.sin(Y * 8.5 + a * 0.5)), 8) * 0.05;
    const fissure = Math.pow(Math.max(0, Math.cos(a * 7 + Y * 1.2)), 16) * 0.03;
    const f =
      1 +
      k *
        (Math.sin(a * 3 + x) * 0.5 +
          Math.sin(a * 5 + Y * 2.2) * 0.3 +
          Math.sin(a * 8 - Y * 3.1 + z) * 0.2) +
      bedding +
      ledge -
      fissure;
    p.setXYZ(i, X * f, Y, Z * f);
  }
  const a = new THREE.Color(c1);
  const b = new THREE.Color(c2);
  const aoDark = a.clone().multiplyScalar(0.68);
  tint(gm, (c, X, Y, Z) => {
    const hNorm = Math.min(1, Math.max(0, Y / h + 0.5 + 0.03 * Math.sin(Y * 26)));
    const band = Math.floor(hNorm * 8);
    const bandShade = 0.86 + 0.17 * (0.5 + 0.5 * Math.sin(band * 2.4 + 1.1));
    c.copy(a).lerp(b, hNorm).multiplyScalar(bandShade);
    const ang = Math.atan2(Z, X);
    const crevice = Math.pow(Math.max(0, Math.cos(ang * 7 + Y * 1.2)), 16);
    c.multiplyScalar(1 - crevice * 0.32);
    const ao = Math.min(1, Math.max(0, (Y + h * 0.5) / Math.max(0.2, h * 0.28)));
    c.lerp(aoDark, (1 - ao) * 0.5);
  });
  weatherVertexColors(gm, { ao: 0.3, exposure: 0.16, grain: 0.07 });
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
    ...surfaceDetail('stone', 0.032),
  });
  mat.userData.naturalSurface = true;
  return add(g, gm, mat, x, y0 + h / 2, z);
}

let organicBoulderGeo: THREE.BufferGeometry | null = null;

export function scatterRocks(
  g: THREE.Object3D,
  items: readonly InstanceTransform[],
  c1: string,
  c2: string
): void {
  if (!organicBoulderGeo) {
    const ge = new THREE.IcosahedronGeometry(0.45, 1);
    const p = ge.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const X = p.getX(i);
      const Y = p.getY(i);
      const Z = p.getZ(i);
      const d = 0.92 + 0.22 * Math.sin(X * 5.2 + Z * 3.1) + 0.12 * Math.cos(Y * 6.5 - X * 2.7);
      p.setXYZ(i, X * d, Y * (Y < 0 ? 0.68 : 0.92), Z * d);
    }
    ge.computeVertexNormals();
    ge.userData.sharedResource = true;
    organicBoulderGeo = ge;
  }
  const colA = new THREE.Color(c1);
  const colB = new THREE.Color(c2);
  const colors = items.map((_, i) => colA.clone().lerp(colB, R(i * 11 + 3)));
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.93,
    metalness: 0.02,
    ...surfaceDetail('stone', 0.025),
  });
  mat.userData.naturalSurface = true;
  instancedMeshes(g, organicBoulderGeo, mat, items, colors);
}

let tuftGeoCache: THREE.BufferGeometry | null = null;

function getGrassMaterial(): THREE.MeshStandardMaterial {
  if (!grassMatShared) {
    grassMatShared = grassWindy(
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        vertexColors: true,
        roughness: 0.84,
        metalness: 0.02,
      })
    );
    grassMatShared.userData.sharedResource = true;
    grassMatShared.userData.naturalSurface = true;
  }
  return grassMatShared;
}

export function grassTufts(
  g: THREE.Object3D,
  items: readonly InstanceTransform[],
  palette: readonly string[] = ['#4c7a38', '#688f44', '#8b9342']
): void {
  if (!tuftGeoCache) {
    // 3-blade sculpted grass tuft with baked vertical root-to-tip ambient occlusion.
    const blades: THREE.BufferGeometry[] = [];
    const specs: ReadonlyArray<readonly [number, number, number, number, number]> = [
      [0, 0.27, 0.045, 0.0, 0.14],
      [-0.035, 0.22, 0.04, 2.15, 0.26],
      [0.032, 0.19, 0.038, 4.25, -0.24],
    ];
    for (let b = 0; b < specs.length; b++) {
      const [ox, h, r, ry, tilt] = specs[b];
      const blade = new THREE.ConeGeometry(r, h, 4).translate(0, h * 0.5, 0);
      blade.rotateZ(tilt);
      blade.rotateY(ry);
      blade.translate(ox, 0, ox * 0.6);
      const nonIdx = blade.index ? blade.toNonIndexed() : blade;
      if (nonIdx !== blade) blade.dispose();
      const pos = nonIdx.attributes.position;
      const vCols = new Float32Array(pos.count * 3);
      for (let v = 0; v < pos.count; v++) {
        const shade = 0.68 + Math.min(1, Math.max(0, pos.getY(v) / 0.27)) * 0.42;
        vCols[v * 3] = shade;
        vCols[v * 3 + 1] = shade;
        vCols[v * 3 + 2] = shade;
      }
      nonIdx.setAttribute('color', new THREE.BufferAttribute(vCols, 3));
      blades.push(nonIdx);
    }
    const merged = mergeGeometries(blades, false);
    blades.forEach((b) => b.dispose());
    if (merged) {
      merged.computeVertexNormals();
      merged.computeBoundingSphere();
      merged.userData.sharedResource = true;
      tuftGeoCache = merged;
    } else {
      const fallback = new THREE.ConeGeometry(0.08, 0.24, 5).translate(0, 0.12, 0);
      fallback.userData.sharedResource = true;
      tuftGeoCache = fallback;
    }
  }
  const mat = getGrassMaterial();
  const cols = items.map((_, i) => palette[i % palette.length]);
  instancedMeshes(g, tuftGeoCache, mat, items, cols);
}

interface TreePart {
  g: THREE.BufferGeometry;
  c: THREE.ColorRepresentation;
  p?: [number, number, number];
  r?: [number, number, number];
  s?: [number, number, number];
}

interface TreeSpec {
  x: number;
  y: number;
  z: number;
  s: number;
  k: number;
  ry: number;
  variant: number;
  tint: number;
  holder: THREE.Object3D;
}

const treeBatches = new WeakMap<THREE.Object3D, TreeSpec[]>();
const treeGeoCache: Record<string, THREE.BufferGeometry> = {};
let treeMat: THREE.MeshStandardMaterial | null = null;

const treeMergeMatrix = new THREE.Matrix4();
const treeMergeQuat = new THREE.Quaternion();
const treeMergeEuler = new THREE.Euler();
const treeMergePos = new THREE.Vector3();
const treeMergeScale = new THREE.Vector3();
const treeMergeColor = new THREE.Color();

function treeMaterial(): THREE.MeshStandardMaterial {
  if (!treeMat) {
    treeMat = windy(
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.02 }),
      'wind_tree_vc',
      {
        heightScale: 1.75,
        swayScale: 1.05,
        flutterScale: 1.15,
        trunkBase: 0.26,
        wakeScale: 0.16,
        foliageSss: true,
      }
    );
    treeMat.userData.sharedResource = true;
  }
  return treeMat;
}

function mergeTreeParts(parts: readonly TreePart[]): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  for (let k = 0; k < parts.length; k++) {
    const part = parts[k];
    const geo = part.g.index ? part.g.toNonIndexed() : part.g.clone();
    part.g.dispose();
    geo.deleteAttribute('uv');
    geo.deleteAttribute('uv1');
    geo.deleteAttribute('uv2');
    treeMergeEuler.set(part.r?.[0] ?? 0, part.r?.[1] ?? 0, part.r?.[2] ?? 0);
    treeMergeQuat.setFromEuler(treeMergeEuler);
    treeMergePos.set(part.p?.[0] ?? 0, part.p?.[1] ?? 0, part.p?.[2] ?? 0);
    treeMergeScale.set(part.s?.[0] ?? 1, part.s?.[1] ?? 1, part.s?.[2] ?? 1);
    treeMergeMatrix.compose(treeMergePos, treeMergeQuat, treeMergeScale);
    geo.applyMatrix4(treeMergeMatrix);
    treeMergeColor.set(part.c);
    const posAttr = geo.attributes.position;
    // crownGeo bakes per-lobe hue/value multipliers into a color attribute;
    // keep them (trunks/branch parts simply have none).
    const lobeColors = geo.attributes.color as THREE.BufferAttribute | undefined;
    const vertCount = posAttr.count;
    const arr = new Float32Array(vertCount * 3);
    for (let i = 0; i < vertCount; i++) {
      // Soft vertical AO & crown-top sun highlight baked per vertex.
      const vy = posAttr.getY(i);
      const ao = 0.78 + Math.min(1, Math.max(0, (vy - 0.08) / 1.35)) * 0.28;
      const lr = lobeColors ? lobeColors.getX(i) : 1;
      const lg = lobeColors ? lobeColors.getY(i) : 1;
      const lb = lobeColors ? lobeColors.getZ(i) : 1;
      arr[i * 3] = Math.min(1, treeMergeColor.r * ao * lr);
      arr[i * 3 + 1] = Math.min(1, treeMergeColor.g * ao * lg);
      arr[i * 3 + 2] = Math.min(1, treeMergeColor.b * ao * lb);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    geos.push(geo);
  }
  const merged = mergeGeometries(geos, false);
  geos.forEach((geo) => geo.dispose());
  if (!merged) {
    throw new Error('Unable to merge tree geometry');
  }
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  merged.userData.sharedResource = true;
  return merged;
}

/**
 * One canopy cluster = 2–3 asymmetric lobes with distinct value/hue multipliers
 * baked into a vertex-color attribute. mergeTreeParts keeps those multipliers,
 * so lobes stay legible inside the single merged, instanced tree geometry.
 */
function crownGeo(radius: number, seed: number): THREE.BufferGeometry {
  const lobeCount = 2 + Math.floor(R(seed * 5 + 19) * 2);
  const lobes: THREE.BufferGeometry[] = [];
  for (let l = 0; l < lobeCount; l++) {
    const phase = seed * 1.7 + l * 4.3;
    const rr = radius * (l === 0 ? 0.78 : 0.5 + R(phase * 3 + 1) * 0.2);
    const geo = new THREE.IcosahedronGeometry(rr, 1);
    const p = geo.attributes.position;
    const a = R(phase * 3 + 2);
    const b = R(phase * 7 + 4);
    for (let i = 0; i < p.count; i++) {
      const X = p.getX(i);
      const Y = p.getY(i);
      const Z = p.getZ(i);
      const d =
        1 +
        0.2 * Math.sin(X * (15 + a * 8) + phase) * Math.cos(Z * (11 + b * 6) + Y * 8) +
        0.08 * Math.sin(Y * 21 + phase * 3) +
        0.05 * Math.cos(X * 7 - Z * 9);
      p.setXYZ(i, X * d, Y * d * 0.92, Z * d);
    }
    const offsetAngle = phase * 2.2;
    const spread = l === 0 ? 0.03 : radius * (0.22 + R(phase + 9) * 0.16);
    geo.translate(
      Math.cos(offsetAngle) * spread,
      l === 0 ? 0.02 : (R(phase + 3) - 0.5) * radius * 0.34,
      Math.sin(offsetAngle) * spread
    );
    geo.computeVertexNormals();
    const value = l === 0 ? 1.04 : 0.86 + R(phase + 11) * 0.2;
    const hue = (R(phase + 13) - 0.5) * 0.08;
    const cols = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      cols[i * 3] = value * (1 - hue * 0.5);
      cols[i * 3 + 1] = value * (1 + hue * 0.2);
      cols[i * 3 + 2] = value * (1 + hue * 0.8);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    lobes.push(geo);
  }
  const merged = mergeGeometries(lobes, false);
  lobes.forEach((geo) => geo.dispose());
  if (!merged) throw new Error('Unable to merge canopy lobes');
  merged.computeVertexNormals();
  return merged;
}

function buildTreeGeometry(k: number, variant: number): THREE.BufferGeometry {
  const parts: TreePart[] = [];
  const rs = (i: number) => R(variant * 97 + i * 13 + k * 211);

  if (k === 3) {
    // Coastal/tropical palm: ringed curved bole, coconut cluster & 2-tier feathered fronds.
    for (let i = 0; i < 7; i++) {
      const lean = Math.sin(i * 0.23 + variant * 0.22) * 0.09;
      parts.push({
        g: new THREE.CylinderGeometry(0.044 - i * 0.0036, 0.056 - i * 0.0036, 0.21, 7),
        c: i % 2 === 0 ? '#6f563e' : '#5e4732',
        p: [lean, 0.1 + i * 0.18, 0],
        r: [0, 0, -0.055 * i],
      });
    }
    const crownX = 0.23 + (variant - 1) * 0.045;
    for (let i = 0; i < 3; i++) {
      const ca = (i * Math.PI * 2) / 3 + variant * 0.4;
      parts.push({
        g: new THREE.SphereGeometry(0.045, 6, 5),
        c: '#4c341f',
        p: [crownX + Math.cos(ca) * 0.055, 1.24, Math.sin(ca) * 0.055],
      });
    }
    // Outer sweeping fronds
    for (let i = 0; i < 6; i++) {
      const yaw = (i * Math.PI * 2) / 6 + variant * 0.35;
      parts.push({
        g: new THREE.ConeGeometry(0.135 + rs(i) * 0.025, 0.88 + rs(i + 2) * 0.16, 4),
        c: i % 2 === 0 ? '#4e9146' : '#3a793a',
        p: [crownX, 1.29, 0],
        r: [0, yaw, -0.56 - rs(i + 4) * 0.16],
        s: [1, 1, 0.22],
      });
    }
    // Inner arched crown fronds
    for (let i = 0; i < 4; i++) {
      const yaw = (i * Math.PI * 2) / 4 + 0.4 + variant * 0.35;
      parts.push({
        g: new THREE.ConeGeometry(0.11, 0.68 + rs(i + 9) * 0.12, 4),
        c: '#5da14f',
        p: [crownX, 1.33, 0],
        r: [0, yaw, -0.22 - rs(i + 12) * 0.1],
        s: [1, 1, 0.22],
      });
    }
    return mergeTreeParts(parts);
  }

  if (k === 4) {
    // Layered mountain conifer with root flare & staggered boughs.
    parts.push({
      g: new THREE.CylinderGeometry(0.034, 0.082, 0.96, 8),
      c: '#4e3826',
      p: [0, 0.48, 0],
    });
    const pineCols = ['#27522d', '#346838', '#427842'];
    for (let i = 0; i < 6; i++) {
      const rB = 0.47 - i * 0.064 + (variant - 1) * 0.025;
      parts.push({
        g: new THREE.CylinderGeometry(rB * 0.18, rB, 0.32 + rs(i) * 0.07, 9),
        c: pineCols[i % 3],
        p: [(rs(i + 14) - 0.5) * 0.03, 0.78 + i * 0.2, (rs(i + 19) - 0.5) * 0.03],
        r: [(rs(i + 2) - 0.5) * 0.06, i * 0.55 + variant * 0.3, (rs(i + 5) - 0.5) * 0.06],
      });
    }
    return mergeTreeParts(parts);
  }

  const trunkCol = k === 2 ? '#443528' : '#4a3a2a';
  // Root flare + taller trunk + forked structural boughs peek beneath canopy lobes.
  parts.push({
    g: new THREE.CylinderGeometry(0.088, 0.135, 0.18, 7),
    c: trunkCol,
    p: [0, 0.09, 0],
  });
  parts.push({
    g: new THREE.CylinderGeometry(0.048, 0.096, 1.04, 8),
    c: trunkCol,
    p: [0, 0.52, 0],
  });
  const limbCount = k === 2 ? 6 : 4;
  for (let i = 0; i < limbCount; i++) {
    const a = (i * Math.PI * 2) / limbCount + rs(i) * 0.45;
    const reach = k === 2 ? 0.25 : 0.16;
    const tilt = k === 2 ? 1.12 : 0.74;
    parts.push({
      g: new THREE.CylinderGeometry(0.013, 0.036, k === 2 ? 0.74 : 0.62, 6),
      c: trunkCol,
      p: [Math.cos(a) * reach, k === 2 ? 0.94 : 0.9, Math.sin(a) * reach],
      r: [-Math.sin(a) * tilt, 0, -Math.cos(a) * tilt],
    });
  }
  const palettes: Record<number, readonly [string, string, string]> = {
    0: ['#8a5bc4', '#a77ae0', '#6d45a6'],
    1: ['#3e7738', '#569143', '#2d5c2b'],
    2: ['#677c3b', '#819448', '#4f632e'],
  };
  const cs = palettes[k] ?? palettes[1];
  const baseY = k === 2 ? 1.08 : 0.98;
  const count = k === 2 ? 4 : 3 + (variant === 1 ? 1 : 0);
  for (let i = 0; i < count; i++) {
    const r = 0.29 + rs(i + 7) * 0.09 + (variant === 2 ? 0.025 : 0);
    const q = k === 2 ? 0.44 : 0.27 + (i % 2) * 0.06;
    const px = Math.cos(i * 2.39 + variant * 0.4) * q;
    const pz = Math.sin(i * 2.39 + variant * 0.4) * q;
    const py = rs(i + 3) * (k === 2 ? 0.04 : 0.2) + (i === count - 1 ? (k === 2 ? 0.03 : 0.12) : 0);
    parts.push({
      g: crownGeo(r, i + variant * 11 + k * 5),
      c: cs[i % 3],
      p: [px, baseY + py, pz],
      s: k === 2 ? [1.95, 0.26, 1.95] : [1, 0.94, 1],
      r: [0, rs(i + 5) * 2, 0],
    });
  }
  // Small outer leaflets break up the silhouette and add canopy depth.
  for (let i = 0; i < (k === 2 ? 4 : 3); i++) {
    const ang = rs(i + 40) * 6.2832;
    const rad = k === 2 ? 0.56 : 0.36;
    parts.push({
      g: crownGeo(0.13 + rs(i + 44) * 0.06, i + variant * 5 + k * 9),
      c: cs[(i + 1) % 3],
      p: [Math.cos(ang) * rad, baseY + (k === 2 ? 0.02 : 0.14) + rs(i + 48) * (k === 2 ? 0.05 : 0.24), Math.sin(ang) * rad],
      s: k === 2 ? [1.55, 0.28, 1.55] : [1, 0.8, 1],
    });
  }
  return mergeTreeParts(parts);
}

function buildTreeLodGeometry(k: number, level: 1 | 2): THREE.BufferGeometry {
  const parts: TreePart[] = [];
  const trunkSegs = level === 1 ? 5 : 4;
  if (k === 3) {
    // Simplified Palm LOD
    parts.push({
      g: new THREE.CylinderGeometry(0.036, 0.056, 1.15, trunkSegs),
      c: '#6e553e',
      p: [0.1, 0.56, 0],
      r: [0, 0, -0.18],
    });
    const frondCount = level === 1 ? 5 : 3;
    for (let i = 0; i < frondCount; i++) {
      parts.push({
        g: new THREE.ConeGeometry(0.14, 0.78, 3),
        c: i % 2 === 0 ? '#4f9146' : '#3c7b3b',
        p: [0.22, 1.26, 0],
        r: [0, (i * Math.PI * 2) / frondCount, -0.45],
        s: [1, 1, 0.3],
      });
    }
    return mergeTreeParts(parts);
  }

  if (k === 4) {
    // Simplified Pine LOD
    parts.push({
      g: new THREE.CylinderGeometry(0.035, 0.075, 0.92, trunkSegs),
      c: '#4e3826',
      p: [0, 0.46, 0],
    });
    const tiers = level === 1 ? 3 : 1;
    if (tiers === 1) {
      parts.push({
        g: new THREE.ConeGeometry(0.46, 1.18, 6),
        c: '#36693a',
        p: [0, 1.24, 0],
      });
    } else {
      const pineCols = ['#2a5630', '#36693a', '#447943'];
      for (let i = 0; i < tiers; i++) {
        const rB = 0.45 - i * 0.1;
        parts.push({
          g: new THREE.CylinderGeometry(rB * 0.2, rB, 0.46, 6),
          c: pineCols[i % 3],
          p: [0, 0.88 + i * 0.34, 0],
        });
      }
    }
    return mergeTreeParts(parts);
  }

  const trunkCol = k === 2 ? '#4d3624' : '#4a3a2a';
  parts.push({
    g: new THREE.CylinderGeometry(0.05, 0.1, 1.02, trunkSegs),
    c: trunkCol,
    p: [0, 0.51, 0],
  });
  const palettes: Record<number, readonly [string, string, string]> = {
    0: ['#8a5bc4', '#a77ae0', '#6d45a6'],
    1: ['#3e7738', '#569143', '#2d5c2b'],
    2: ['#7e8d3b', '#98a64a', '#5f6e2d'],
  };
  const cs = palettes[k] ?? palettes[1];
  const baseY = k === 2 ? 1.02 : 1.04;
  if (level === 2) {
    parts.push({
      g: new THREE.IcosahedronGeometry(k === 2 ? 0.52 : 0.48, 0),
      c: cs[0],
      p: [0, baseY + 0.08, 0],
      s: k === 2 ? [1.45, 0.46, 1.45] : [1.05, 0.95, 1.05],
    });
  } else {
    for (let i = 0; i < 3; i++) {
      const ang = i * 2.1;
      const q = k === 2 ? 0.32 : 0.26;
      parts.push({
        g: new THREE.IcosahedronGeometry(0.29, 0),
        c: cs[i % 3],
        p: [Math.cos(ang) * q, baseY + (i === 0 ? 0.16 : 0.04), Math.sin(ang) * q],
        s: k === 2 ? [1.5, 0.45, 1.5] : [1, 1, 1],
      });
    }
  }
  return mergeTreeParts(parts);
}

function treeGeometry(k: number, variant: number): THREE.BufferGeometry {
  const key = `tree_${k}_${variant}`;
  const cached = treeGeoCache[key];
  if (cached) return cached;
  const geo = buildTreeGeometry(k, variant);
  treeGeoCache[key] = geo;
  return geo;
}

function treeLodGeometry(k: number, level: 1 | 2): THREE.BufferGeometry {
  const key = `tree_${k}_lod${level}`;
  const cached = treeGeoCache[key];
  if (cached) return cached;
  const geo = buildTreeLodGeometry(k, level);
  treeGeoCache[key] = geo;
  return geo;
}

export function finalizeTreeBatch(g: THREE.Object3D): void {
  const specs = treeBatches.get(g);
  if (!specs || !specs.length) return;
  treeBatches.delete(g);
  const groups = new Map<string, TreeSpec[]>();
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    spec.holder.removeFromParent();
    const key = `${spec.k}_${spec.variant}`;
    const list = groups.get(key);
    if (list) list.push(spec);
    else groups.set(key, [spec]);
  }
  const mat = treeMaterial();
  const color = new THREE.Color();
  groups.forEach((list, key) => {
    const [kText, vText] = key.split('_');
    const kNum = Number(kText);
    const vNum = Number(vText);
    const geo0 = treeGeometry(kNum, vNum);
    const geo1 = treeLodGeometry(kNum, 1);
    const geo2 = treeLodGeometry(kNum, 2);

    const im0 = new THREE.InstancedMesh(geo0, mat, list.length);
    const im1 = new THREE.InstancedMesh(geo1, mat, list.length);
    const im2 = new THREE.InstancedMesh(geo2, mat, list.length);

    for (let i = 0; i < list.length; i++) {
      const spec = list[i];
      const spread = 0.9 + spec.tint * 0.2;
      treeMergePos.set(spec.x, spec.y, spec.z);
      treeMergeEuler.set(0, spec.ry, 0);
      treeMergeQuat.setFromEuler(treeMergeEuler);
      treeMergeScale.set(spec.s * spread, spec.s, spec.s * (1.9 - spread));
      treeMergeMatrix.compose(treeMergePos, treeMergeQuat, treeMergeScale);
      im0.setMatrixAt(i, treeMergeMatrix);
      im1.setMatrixAt(i, treeMergeMatrix);
      im2.setMatrixAt(i, treeMergeMatrix);
      // Per-instance hue (red/green balance) and value jitter: the canopy
      // colours baked into the geometry stay, but no two trees read identical.
      const value = 0.92 + R(spec.x * 13.1 + spec.z * 7.7 + spec.s * 3.3) * 0.2;
      const hueShift = (spec.tint - 0.5) * 0.16;
      color.setRGB(
        Math.max(0, value * (1 - hueShift * 0.7)),
        Math.max(0, value * (1 + hueShift * 0.15)),
        Math.max(0, value * (1 + hueShift * 0.9))
      );
      im0.setColorAt(i, color);
      im1.setColorAt(i, color);
      im2.setColorAt(i, color);
      stampContactShadow(g, spec.x, spec.z, 0.3 * spec.s, 0.24, spec.y + 0.012);
    }

    for (const im of [im0, im1, im2]) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
    }
    im2.userData.noShadow = true;
    im2.castShadow = false;

    const lod = new THREE.LOD();
    lod.addLevel(im0, 0);
    lod.addLevel(im1, 21.5);
    lod.addLevel(im2, 28.5);
    g.add(lod);
  });
}

export function tree(g: THREE.Object3D, x: number, z: number, s = 1, k = 1, y = 0): THREE.Group {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.visible = false;
  g.add(holder);
  const specs = treeBatches.get(g);
  const spec: TreeSpec = {
    x,
    y,
    z,
    s,
    k,
    ry: R(x * 3 + z) * 6.28,
    variant: Math.floor(R(x * 17.3 + z * 5.1 + s * 29.7) * 3) % 3,
    tint: R(x * 7.7 + z * 11.3),
    holder,
  };
  if (specs) specs.push(spec);
  else treeBatches.set(g, [spec]);
  return holder;
}

export function rondavel(
  g: THREE.Object3D,
  x: number,
  z: number,
  y = 0,
  sc = 1,
  wallCol = '#ece3d0',
  roofCol = '#8a6b42'
): THREE.Group {
  const rd = new THREE.Group();
  rd.position.set(x, y, z);
  rd.scale.setScalar(sc);
  add(rd, C(0.42, 0.46, 0.06, 20), MStone('#685d50', 0.94), 0, 0.03, 0);
  add(rd, C(0.36, 0.37, 0.44, 24), MPlaster(wallCol, 0.82), 0, 0.26, 0);
  add(rd, C(0.375, 0.375, 0.07, 24), MPlaster('#a34a36', 0.86), 0, 0.08, 0);
  // Layered thatch courses give the cone a fibrous, banded silhouette.
  const thatch = MBark(roofCol, 0.94, 0.038);
  for (let i = 0; i < 5; i++) {
    const r = 0.47 - i * 0.088;
    add(rd, C(r, r, 0.04, 24, 1, true), thatch, 0, 0.5 + i * 0.072, 0);
  }
  add(rd, new THREE.ConeGeometry(0.46, 0.36, 24), thatch, 0, 0.64, 0);
  add(rd, C(0.03, 0.04, 0.08, 8), MBark('#4e3824', 0.9), 0, 0.84, 0);
  // Recessed doorway and a small shuttered window.
  add(rd, CB(0.14, 0.29, 0.03, 0.008), MPlaster('#e4dccb', 0.8), 0, 0.17, 0.365);
  add(rd, CB(0.11, 0.26, 0.04, 0.01), MWood('#4d321c', 0.8), 0, 0.17, 0.385);
  const win = add(rd, CB(0.09, 0.09, 0.02, 0.005), M('#d7c9a8', 0.5), 0.24, 0.33, 0.26);
  win.rotation.y = -0.62;
  mergeByMaterial(rd);
  g.add(rd);
  return rd;
}

export function colonialHouse(
  g: THREE.Object3D,
  opts: {
    x: number;
    y?: number;
    z: number;
    ry?: number;
    w?: number;
    h?: number;
    d?: number;
    wall: string;
    roof: string;
    trim?: string;
    capeDutch?: boolean;
  }
): THREE.Group {
  const {
    x,
    y = 0,
    z,
    ry = 0,
    w = 1.0,
    h = 0.85,
    d = 0.72,
    wall,
    roof,
    trim = '#e8e2d5',
    capeDutch = false,
  } = opts;
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = ry;
  const y0 = 0.12;
  const fz = d / 2 + 0.02;

  const trimMat = MPlaster(trim, 0.76);
  const stoneMat = MStone('#a89c88', 0.88);
  const frameWood = MWood('#4d3a28', 0.8);
  const winMat = G('#f5cf86', 0.45);
  const shutterMat = MWood('#274c3c', 0.72);
  const slatMat = MWood('#1e3d30', 0.82);
  const doorMat = MWood('#3e281a', 0.75);
  const panelMat = MWood('#543521', 0.74);

  // Raised stoep with a front step, then the stucco body and corner pilasters.
  add(grp, CB(w + 0.22, 0.1, 0.36, 0.02), stoneMat, 0, 0.05, fz + 0.14);
  add(grp, CB(w + 0.14, 0.1, d + 0.22, 0.02), stoneMat, 0, 0.1, 0.08);
  add(grp, CB(w, h, d, 0.03), MPlaster(wall, 0.76), 0, y0 + h / 2, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add(
        grp,
        CB(0.09, h, 0.09, 0.012),
        trimMat,
        sx * (w / 2 - 0.045),
        y0 + h / 2,
        sz * (d / 2 - 0.045)
      );
    }
  }
  add(grp, CB(w + 0.1, 0.07, d + 0.1, 0.02), trimMat, 0, y0 + h + 0.03, 0);

  // Pitched roof with a ridge cap and a small chimney stack.
  add(
    grp,
    gableRoofGeo(w * 0.96, d * 0.96, h * 0.42, 0.06),
    MRoof(roof, 0.82, 0.032, { dirty: true }),
    0,
    y0 + h + 0.06,
    0
  );
  add(
    grp,
    CB(0.07, 0.06, d + 0.16, 0.02),
    MRoof(roof, 0.74, 0.032, { dirty: true }),
    0,
    y0 + h + h * 0.42 + 0.04,
    0
  );
  const chimY = y0 + h + h * 0.22;
  add(grp, CB(0.16, 0.34, 0.16, 0.02), MStone('#8d7660', 0.9), w * 0.28, chimY, -d * 0.2);
  add(grp, CB(0.21, 0.05, 0.21, 0.01), stoneMat, w * 0.28, chimY + 0.19, -d * 0.2);

  if (capeDutch) {
    add(grp, capeDutchGableGeo(w * 0.5, h * 0.62, 0.05), trimMat, 0, y0 + h, fz + 0.005);
    add(
      grp,
      capeDutchGableGeo(w * 0.42, h * 0.53, 0.07),
      MPlaster(wall, 0.76),
      0,
      y0 + h + 0.01,
      fz + 0.04
    );
    add(
      grp,
      new THREE.SphereGeometry(0.035, 8, 6),
      M('#b8985a', 0.4, 0.6),
      0,
      y0 + h + h * 0.62 + 0.03,
      fz + 0.06
    );
  }

  // Panelled front door with a frame and brass knob.
  add(grp, CB(w * 0.22, h * 0.52, 0.03, 0.008), trimMat, 0, y0 + h * 0.26, fz - 0.005);
  add(grp, CB(w * 0.18, h * 0.48, 0.04, 0.008), doorMat, 0, y0 + h * 0.24, fz + 0.015);
  for (const py of [h * 0.14, h * 0.34]) {
    add(grp, CB(w * 0.12, h * 0.15, 0.01, 0.004), panelMat, 0, y0 + py, fz + 0.04);
  }
  add(
    grp,
    new THREE.SphereGeometry(0.012, 6, 5),
    M('#c9a227', 0.3, 0.8),
    w * 0.06,
    y0 + h * 0.24,
    fz + 0.05
  );

  // Glowing sash windows with mullions, sills and louvred shutters.
  for (const sx of [-w * 0.28, w * 0.28]) {
    add(grp, CB(w * 0.2, h * 0.34, 0.03, 0.006), trimMat, sx, y0 + h * 0.52, fz - 0.005);
    add(grp, CB(w * 0.16, h * 0.28, 0.02, 0.004), winMat, sx, y0 + h * 0.52, fz + 0.015);
    add(grp, CB(0.012, h * 0.28, 0.015, 0.003), frameWood, sx, y0 + h * 0.52, fz + 0.03);
    add(grp, CB(w * 0.16, 0.012, 0.015, 0.003), frameWood, sx, y0 + h * 0.52, fz + 0.03);
    add(grp, CB(w * 0.22, 0.035, 0.07, 0.008), stoneMat, sx, y0 + h * 0.34, fz + 0.025);
    for (const side of [-1, 1]) {
      const shx = sx + side * w * 0.125;
      add(grp, CB(0.055, h * 0.28, 0.02, 0.004), shutterMat, shx, y0 + h * 0.52, fz + 0.012);
      for (let s = 0; s < 4; s++) {
        add(
          grp,
          CB(0.042, 0.012, 0.012, 0.002),
          slatMat,
          shx,
          y0 + h * 0.42 + s * h * 0.066,
          fz + 0.026
        );
      }
    }
  }
  mergeByMaterial(grp);
  g.add(grp);
  return grp;
}

export function lampPost(g: THREE.Object3D, x: number, y: number, z: number, h = 0.65): void {
  add(g, C(0.016, 0.024, h, 6), M('#22262e', 0.4, 0.75), x, y + h / 2, z);
  add(g, new THREE.SphereGeometry(0.04, 8, 6), G('#ffdc96', 1.25), x, y + h + 0.03, z);
}

export type StreamFill = (i: number, t: number, out: THREE.Vector3) => void;

export interface StreamHandle {
  update: (t: number) => void;
  material: THREE.PointsMaterial;
}

/**
 * Zero-allocation particle stream. The fill callback writes into a shared vector,
 * so animation ticks never create arrays or vectors.
 */
export function stream(
  g: THREE.Object3D,
  count: number,
  col: THREE.ColorRepresentation,
  sz: number,
  fill: StreamFill,
  opacity = 0.78,
  additive = true
): StreamHandle {
  const p = new Float32Array(count * 3);
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({
    color: col,
    size: sz * 1.6,
    map: getSoftTexture(),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  g.add(points);
  const out = new THREE.Vector3();
  const update = (t: number) => {
    for (let i = 0; i < count; i++) {
      fill(i, t, out);
      p[i * 3] = out.x;
      p[i * 3 + 1] = out.y;
      p[i * 3 + 2] = out.z;
    }
    geo.attributes.position.needsUpdate = true;
  };
  update(0);
  return { update, material: mat };
}

export function drift(
  g: THREE.Object3D,
  count: number,
  col: THREE.ColorRepresentation,
  sz: number,
  fn: (i: number, t: number) => [number, number, number],
  opacity = 0.78
): (t: number) => void {
  const p = new Float32Array(count * 3);
  const ge = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(p, 3));
  const o = new THREE.Points(
    ge,
    new THREE.PointsMaterial({
      color: col,
      size: sz * 1.6,
      map: getSoftTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  o.frustumCulled = false;
  g.add(o);
  return (t: number) => {
    for (let i = 0; i < count; i++) {
      const v = fn(i, t);
      p[i * 3] = v[0];
      p[i * 3 + 1] = v[1];
      p[i * 3 + 2] = v[2];
    }
    ge.attributes.position.needsUpdate = true;
  };
}

export function bird(): THREE.Group {
  const b = new THREE.Group();
  const wh = M('#f4f4f2', 0.6);
  const gy = MT('#bfc5cf', 0.96, 0.6, 0, true);
  const or = M('#e8903a', 0.5);
  const P = (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    s = 0
  ) => {
    const o = add(b, geo, m, x, y, z);
    o.userData.s = s;
    return o;
  };
  P(new THREE.SphereGeometry(0.05, 10, 8), wh, 0, 0, 0).scale.set(0.8, 0.7, 1.9);
  P(new THREE.SphereGeometry(0.03, 10, 8), wh, 0, 0.015, 0.1);
  P(new THREE.ConeGeometry(0.012, 0.05, 6).rotateX(Math.PI / 2), or, 0, 0.012, 0.14);
  P(new THREE.ConeGeometry(0.03, 0.09, 4).rotateX(-Math.PI / 2), wh, 0, 0, -0.12).scale.set(
    1,
    0.25,
    1
  );

  const ws = new THREE.Shape();
  ws.moveTo(0, -0.05);
  ws.lineTo(0.1, -0.06);
  ws.lineTo(0.22, 0.01);
  ws.lineTo(0.2, 0.04);
  ws.lineTo(0.08, 0.03);
  ws.lineTo(0, 0.04);
  ws.closePath();
  const wg = new THREE.ShapeGeometry(ws).rotateX(-Math.PI / 2);
  P(wg, gy, 0, 0.01, 0, 1);
  P(wg, gy, 0, 0.01, 0, -1).scale.x = -1;
  return b;
}

export function birds(g: THREE.Object3D, count: number, r: number, y: number): (t: number) => void {
  const bs = Array.from({ length: count }, () => {
    const b = bird();
    g.add(b);
    return b;
  });
  return (t: number) => {
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i];
      const a = t * 0.25 + (i * 6.2832) / count;
      const climb = Math.sin(t * 0.7 + i);
      const glideEnv = Math.max(0.16, 0.56 + 0.56 * Math.sin(t * 0.52 + i * 1.9));
      const flap = Math.sin(t * 9.2 + i * 1.7) * 0.62 * glideEnv;
      b.position.set(r * Math.cos(a), y + climb * 0.32, r * Math.sin(a));
      b.rotation.set(-Math.cos(t * 0.7 + i) * 0.14, -a, -0.24 - Math.cos(t * 0.8 + i) * 0.08);
      for (let c = 0; c < b.children.length; c++) {
        const w = b.children[c];
        const s = w.userData.s as number;
        if (s) w.rotation.z = s * flap;
      }
    }
  };
}

let carGeos: {
  body: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
  wheel: THREE.BufferGeometry;
  lamp: THREE.BufferGeometry;
  beam: THREE.BufferGeometry;
  tail: THREE.BufferGeometry;
} | null = null;
let carHeadlightMat: THREE.ShaderMaterial | null = null;
let carTaillightMat: THREE.ShaderMaterial | null = null;
let carPoolMat: THREE.ShaderMaterial | null = null;
let carPoolGeo: THREE.BufferGeometry | null = null;

/**
 * Headlight light pooling on a wet road. Gated on rain so dry scenes pay a
 * single discard, and on the night ramp so daytime traffic lays no glow.
 */
export function getCarPoolMat(): THREE.ShaderMaterial {
  if (carPoolMat) return carPoolMat;
  carPoolMat = new THREE.ShaderMaterial({
    uniforms: { uLit: WU.lit, uRain: WU.rain, uDY: WU.dy },
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
      uniform float uLit, uRain, uDY;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float wet = smoothstep(0.3, 0.9, uRain);
        if (wet <= 0.004) discard;
        float lit = smoothstep(0.12, 0.8, uLit);
        if (lit <= 0.004) discard;
        vec2 c = (vUv - 0.5) * 2.0;
        float cone = pow(max(0.0, 1.0 - abs(c.x)), 2.0) * smoothstep(-0.1, 1.0, c.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
        float a = cone * wet * lit * 0.32;
        gl_FragColor = vec4(vec3(1.0, 0.88, 0.62) * a * 1.4, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  carPoolMat.userData.sharedResource = true;
  carPoolMat.userData.noDissolve = true;
  return carPoolMat;
}

export function getCarHeadlightMat(): THREE.ShaderMaterial {
  if (carHeadlightMat) return carHeadlightMat;
  carHeadlightMat = new THREE.ShaderMaterial({
    uniforms: { uLit: WU.lit, uDY: WU.dy },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNorm;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vec4 mv = viewMatrix * wp;
        vNorm = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uLit, uDY;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNorm;
      varying vec3 vViewDir;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float litVis = smoothstep(0.12, 0.85, uLit);
        if (litVis <= 0.005) discard;
        float axial = pow(clamp(vUv.y, 0.0, 1.0), 1.65) * smoothstep(1.0, 0.82, vUv.y);
        float edge = pow(abs(dot(normalize(vNorm), normalize(vViewDir))), 1.4);
        float a = axial * edge * litVis * 0.24;
        vec3 col = mix(vec3(1.0, 0.90, 0.65), vec3(1.0, 0.97, 0.88), vUv.y);
        gl_FragColor = vec4(col * a * 1.4, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  carHeadlightMat.userData.sharedResource = true;
  carHeadlightMat.userData.noDissolve = true;
  return carHeadlightMat;
}

export function getCarTaillightMat(): THREE.ShaderMaterial {
  if (carTaillightMat) return carTaillightMat;
  carTaillightMat = new THREE.ShaderMaterial({
    uniforms: { uLit: WU.lit, uDY: WU.dy },
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
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float litVis = smoothstep(0.12, 0.85, uLit);
        if (litVis <= 0.005) discard;
        float r = length((vUv - 0.5) * 2.0);
        if (r >= 1.0) discard;
        float glow = exp(-r * r * 3.8) * smoothstep(1.0, 0.15, r);
        float a = glow * litVis * 0.42;
        gl_FragColor = vec4(vec3(1.0, 0.16, 0.12) * a * 1.6, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  carTaillightMat.userData.sharedResource = true;
  carTaillightMat.userData.noDissolve = true;
  return carTaillightMat;
}

export function car(col: string, sc = 0.5, withLights = true): THREE.Group {
  if (!carGeos) {
    const extrude = (sh: THREE.Shape, d: number, bs: number) =>
      new THREE.ExtrudeGeometry(sh, {
        depth: d,
        bevelEnabled: true,
        bevelSize: bs,
        bevelThickness: 0.03,
        bevelSegments: 2,
        curveSegments: 8,
      }).translate(0, 0, -d / 2);
    const s = new THREE.Shape();
    s.moveTo(-0.5, 0.06);
    s.lineTo(-0.5, 0.16);
    s.quadraticCurveTo(-0.5, 0.21, -0.44, 0.22);
    s.lineTo(-0.3, 0.23);
    s.lineTo(-0.2, 0.33);
    s.lineTo(0.07, 0.33);
    s.lineTo(0.22, 0.24);
    s.lineTo(0.42, 0.2);
    s.quadraticCurveTo(0.5, 0.19, 0.5, 0.12);
    s.lineTo(0.5, 0.06);
    s.closePath();
    const w = new THREE.Shape();
    w.moveTo(-0.25, 0.24);
    w.lineTo(-0.18, 0.315);
    w.lineTo(0.06, 0.315);
    w.lineTo(0.19, 0.24);
    w.closePath();
    carGeos = {
      body: extrude(s, 0.4, 0.02),
      glass: extrude(w, 0.43, 0.005),
      wheel: new THREE.CylinderGeometry(0.075, 0.075, 0.08, 16).rotateX(Math.PI / 2),
      lamp: new THREE.BoxGeometry(0.02, 0.035, 0.08),
      // Forward (+X) additive headlight cone; tip sits at headlight lens, flares smoothly outward
      beam: new THREE.ConeGeometry(0.24, 1.35, 10, 1, true).rotateZ(Math.PI / 2).translate(0.675, 0, 0),
      tail: new THREE.PlaneGeometry(0.26, 0.26).rotateY(Math.PI / 2),
    };
    carGeos.body.userData.sharedResource = true;
    carGeos.glass.userData.sharedResource = true;
    carGeos.wheel.userData.sharedResource = true;
    carGeos.lamp.userData.sharedResource = true;
    carGeos.beam.userData.sharedResource = true;
    carGeos.tail.userData.sharedResource = true;
  }
  const c = new THREE.Group();
  const b = M(col, 0.35, 0.55);
  const gl = M('#1a2230', 0.1, 0.6);
  const wh = M('#15161a', 0.8);
  add(c, carGeos.body, b);
  add(c, carGeos.glass, gl);
  for (const [x, z] of [
    [-0.3, -0.2],
    [-0.3, 0.2],
    [0.32, -0.2],
    [0.32, 0.2],
  ]) {
    add(c, carGeos.wheel, wh, x, 0.075, z);
  }
  if (withLights) {
    const hl = G('#fff2c0', 1.5);
    const tl = G('#ff2a2a', 1.5);
    const hBeamMat = getCarHeadlightMat();
    const tGlowMat = getCarTaillightMat();
    for (const z of [-0.13, 0.13]) {
      add(c, carGeos.lamp, hl, 0.53, 0.13, z);
      add(c, carGeos.lamp, tl, -0.53, 0.15, z);
      const beam = add(c, carGeos.beam, hBeamMat, 0.53, 0.13, z);
      beam.rotation.z = -0.09;
      beam.castShadow = false;
      beam.receiveShadow = false;
      beam.renderOrder = 4;
      beam.userData.noShadow = true;
      beam.userData.cannotReceiveAO = true;
      beam.userData.noDissolve = true;
      const tGlow = add(c, carGeos.tail, tGlowMat, -0.55, 0.15, z);
      tGlow.castShadow = false;
      tGlow.receiveShadow = false;
      tGlow.renderOrder = 4;
      tGlow.userData.noShadow = true;
      tGlow.userData.cannotReceiveAO = true;
      tGlow.userData.noDissolve = true;
    }
    if (!carPoolGeo) {
      carPoolGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      carPoolGeo.userData.sharedResource = true;
    }
    const pool = add(c, carPoolGeo, getCarPoolMat(), 1.02, 0.006, 0);
    pool.scale.set(1.5, 1, 0.8);
    pool.castShadow = false;
    pool.receiveShadow = false;
    pool.renderOrder = 3;
    pool.userData.noShadow = true;
    pool.userData.cannotReceiveAO = true;
    pool.userData.noDissolve = true;
  }

  c.scale.setScalar(sc);
  return c;
}

export function gondola(col: string): THREE.Group {
  const c = new THREE.Group();
  const b = M(col, 0.35, 0.45);
  const gl = MT('#bfe0ee', 0.65, 0.1, 0.5, true);
  const st = M('#777', 0.4, 0.8);
  add(c, C(0.012, 0.012, 0.3, 8), st, 0, -0.15, 0);
  add(c, new THREE.SphereGeometry(0.17, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), b, 0, -0.3, 0);
  add(c, C(0.17, 0.17, 0.16, 20, 1, true), gl, 0, -0.38, 0);
  add(c, C(0.17, 0.15, 0.03, 20), b, 0, -0.47, 0);
  add(c, CB(0.05, 0.03, 0.03, 0.008), st, 0, 0, 0);
  return c;
}

export function train(col: string): THREE.Group {
  const t = new THREE.Group();
  const b = M(col, 0.45, 0.35);
  const wn = M('#1a2230', 0.1, 0.6);
  const wh = M('#15161a', 0.8);
  const st = M('#e8e8ea', 0.6);
  const cw = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12).rotateX(Math.PI / 2);
  const mk = (nose: boolean) => {
    const s = new THREE.Shape();
    s.moveTo(-0.4, 0);
    s.lineTo(-0.4, 0.28);
    s.lineTo(0.4, 0.28);
    if (nose) {
      s.lineTo(0.5, 0.14);
      s.lineTo(0.5, 0);
    } else {
      s.lineTo(0.4, 0);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.28,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.02,
      bevelSegments: 2,
    }).translate(0, 0.08, -0.14);
  };
  const A = mk(false);
  const N = mk(true);
  [-0.86, 0, 0.86].forEach((x, k) => {
    add(t, k === 2 ? N : A, b, x, 0, 0);
    add(t, CB(0.66, 0.07, 0.34, 0.01), wn, x - (k === 2 ? 0.04 : 0), 0.27, 0);
    add(t, CB(0.8, 0.03, 0.3, 0.008), st, x, 0.38, 0);
    for (const wx of [-0.26, 0.26]) {
      for (const z of [-0.13, 0.13]) {
        add(t, cw, wh, x + wx, 0.06, z);
      }
    }
  });
  mergeByMaterial(t);
  return t;
}

export function animal(col: string): THREE.Group {
  const a = new THREE.Group();
  const m = M(col, 0.88);
  const dk = M('#2a2420', 0.9);
  add(a, new THREE.SphereGeometry(0.07, 12, 10), m, 0, 0.13, 0).scale.set(1.5, 0.85, 0.75);
  add(a, new THREE.SphereGeometry(0.04, 10, 8), m, 0.12, 0.17, 0).scale.set(1.4, 1, 0.8);
  add(a, C(0.02, 0.03, 0.08, 8), m, 0.09, 0.15, 0).rotation.z = -0.7;
  for (const [x, z] of [
    [0.06, 0.035],
    [0.06, -0.035],
    [-0.06, 0.035],
    [-0.06, -0.035],
  ]) {
    add(a, C(0.008, 0.012, 0.1, 6), dk, x, 0.05, z);
  }
  add(a, C(0.004, 0.006, 0.08, 6), dk, -0.11, 0.12, 0).rotation.z = 0.5;
  for (const s of [-1, 1]) {
    add(a, new THREE.ConeGeometry(0.01, 0.05, 6), dk, 0.15, 0.22, s * 0.025).rotation.z = -0.4;
  }
  mergeByMaterial(a);
  return a;
}

/** Dichotomous-branching Namaqua/Karoo Quiver Tree (Aloidendron dichotomum). */
export function quiverTree(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  seed = 0
): THREE.Group {
  const qt = new THREE.Group();
  qt.position.set(x, y, z);
  qt.scale.setScalar(sc);
  const bark = MBark('#bfa77a', 0.9, 0.035);
  const leaf = Mc('#6b8a50');
  const tipMat = Mc('#7fa05e');
  add(qt, C(0.11, 0.16, 0.72, 10), bark, 0, 0.36, 0);

  const fork = (
    px: number,
    py: number,
    pz: number,
    dir: THREE.Vector3,
    len: number,
    rad: number,
    depth: number,
    idx: number
  ) => {
    const end = new THREE.Vector3(px, py, pz).addScaledVector(dir, len);
    const mid = new THREE.Vector3(
      (px + end.x) * 0.5,
      (py + end.y) * 0.5,
      (pz + end.z) * 0.5
    );
    const seg = add(qt, C(rad * 0.76, rad, len, 7), bark, mid.x, mid.y, mid.z);
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    if (depth <= 0) {
      // Spiky aloe rosette at twig terminus
      for (let b = 0; b < 5; b++) {
        const a = (b / 5) * Math.PI * 2 + seed;
        const cone = add(
          qt,
          new THREE.ConeGeometry(0.032, 0.14, 5),
          b % 2 ? tipMat : leaf,
          end.x + Math.cos(a) * 0.03,
          end.y + 0.04,
          end.z + Math.sin(a) * 0.03
        );
        cone.rotation.set(Math.sin(a) * 0.65, 0, -Math.cos(a) * 0.65);
      }
      add(qt, new THREE.ConeGeometry(0.03, 0.13, 5), tipMat, end.x, end.y + 0.06, end.z);
      return;
    }
    const baseYaw = idx * 1.45 + seed * 1.7 + depth * 0.8;
    for (const s of [-1, 1]) {
      const yaw = baseYaw + s * 1.57;
      const nx = dir.x * 0.48 + Math.cos(yaw) * 0.54;
      const ny = Math.max(0.45, dir.y * 0.82);
      const nz = dir.z * 0.48 + Math.sin(yaw) * 0.54;
      fork(
        end.x,
        end.y,
        end.z,
        new THREE.Vector3(nx, ny, nz).normalize(),
        len * 0.72,
        rad * 0.72,
        depth - 1,
        idx * 2 + (s > 0 ? 1 : 0)
      );
    }
  };

  for (let i = 0; i < 2; i++) {
    const a = seed + i * Math.PI;
    const d = new THREE.Vector3(Math.cos(a) * 0.42, 0.9, Math.sin(a) * 0.42).normalize();
    fork(0, 0.68, 0, d, 0.34, 0.085, 2, i + 1);
  }
  mergeByMaterial(qt);
  g.add(qt);
  return qt;
}

/** North-leaning spiny Namaqualand Halfmens (Pachypodium namaquanum). */
export function halfmensTree(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1
): THREE.Group {
  const hm = new THREE.Group();
  hm.position.set(x, y, z);
  hm.scale.setScalar(sc);
  const trunk = MBark('#7f8376', 0.92, 0.04);
  const head = Mc('#5e7d43');
  const col = add(hm, C(0.06, 0.11, 1.05, 10), trunk, 0, 0.52, -0.09);
  col.rotation.x = -0.26;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const lf = add(
      hm,
      new THREE.ConeGeometry(0.036, 0.16, 5),
      head,
      Math.cos(a) * 0.055,
      1.04,
      -0.22 + Math.sin(a) * 0.055
    );
    lf.rotation.set(-0.2 + Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
  }
  add(hm, new THREE.SphereGeometry(0.045, 8, 6), M('#a64838', 0.7), 0, 1.08, -0.24);
  mergeByMaterial(hm);
  g.add(hm);
  return hm;
}

/** Authentic African bush elephant (Loxodonta africana): concave saddle back, domed head, curved tusks. */
export function elephant(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  ry = 0
): THREE.Group {
  const el = new THREE.Group();
  el.position.set(x, y, z);
  el.rotation.y = ry;
  el.scale.setScalar(sc);
  const hide = MBark('#6c6862', 0.9, 0.025);
  const legMud = MBark('#544c44', 0.94, 0.03);
  const tusk = M('#dcd5c2', 0.36);

  // Rear quarters + concave saddle dip + prominent shoulder hump
  add(el, new THREE.SphereGeometry(0.22, 12, 10), hide, -0.18, 0.44, 0).scale.set(1.15, 0.92, 0.88);
  add(el, new THREE.SphereGeometry(0.24, 12, 10), hide, 0.04, 0.42, 0).scale.set(1.2, 0.92, 0.92);
  add(el, new THREE.SphereGeometry(0.21, 12, 10), hide, 0.22, 0.48, 0).scale.set(0.95, 1.02, 0.86);

  // Sloped domed skull
  add(el, new THREE.SphereGeometry(0.16, 12, 10), hide, 0.39, 0.56, 0).scale.set(0.92, 1.08, 0.86);

  // Large flared African fan ears
  for (const s of [-1, 1]) {
    const ear = add(
      el,
      new THREE.SphereGeometry(0.15, 10, 8),
      hide,
      0.32,
      0.55,
      s * 0.16
    );
    ear.scale.set(0.18, 1.15, 0.86);
    ear.rotation.y = -s * 0.36;
  }

  // Articulated S-curve trunk via TubeGeometry
  const trunkPts = [
    new THREE.Vector3(0.49, 0.5, 0),
    new THREE.Vector3(0.57, 0.35, 0),
    new THREE.Vector3(0.55, 0.18, 0),
    new THREE.Vector3(0.61, 0.09, 0),
  ];
  add(
    el,
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunkPts), 12, 0.036, 7, false),
    hide
  );

  // Curved ivory tusks
  for (const s of [-1, 1]) {
    const tCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.47, 0.45, s * 0.065),
      new THREE.Vector3(0.61, 0.39, s * 0.085),
      new THREE.Vector3(0.71, 0.43, s * 0.065),
    ]);
    add(el, new THREE.TubeGeometry(tCurve, 10, 0.017, 6, false), tusk);
  }

  // Columnar mud-caked legs with subtle knee bulge
  for (const [lx, lz] of [
    [0.2, 0.11],
    [0.2, -0.11],
    [-0.19, 0.1],
    [-0.19, -0.1],
  ]) {
    add(el, C(0.068, 0.072, 0.34, 10), legMud, lx, 0.17, lz);
    add(el, new THREE.SphereGeometry(0.072, 8, 6), hide, lx, 0.24, lz);
  }
  add(el, C(0.01, 0.018, 0.22, 6), hide, -0.39, 0.37, 0).rotation.z = 0.38;

  mergeByMaterial(el);
  g.add(el);
  return el;
}

/** African Penguin (Spheniscus demersus): pink supraorbital patch, black horseshoe band, black feet. */
export function penguin(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  ry = 0
): THREE.Group {
  const pg = new THREE.Group();
  pg.position.set(x, y, z);
  pg.rotation.y = ry;
  pg.scale.setScalar(sc);
  const blk = M('#1b2029', 0.58);
  const wht = M('#e3e1d9', 0.68);
  const pink = M('#d47c80', 0.62);

  add(pg, new THREE.SphereGeometry(0.06, 10, 8), blk, 0, 0.095, 0).scale.set(0.85, 1.55, 0.85);
  add(pg, new THREE.SphereGeometry(0.052, 10, 8), wht, 0, 0.09, 0.018).scale.set(0.78, 1.38, 0.72);
  // Characteristic black horseshoe chest band
  const band = add(
    pg,
    new THREE.TorusGeometry(0.048, 0.0085, 6, 14, Math.PI * 1.15),
    blk,
    0,
    0.135,
    0.02
  );
  band.rotation.x = 0.22;
  band.rotation.z = -0.07;

  // Head + bill + pink supraorbital eye glands
  add(pg, new THREE.SphereGeometry(0.036, 10, 8), blk, 0, 0.195, 0.008);
  add(pg, new THREE.ConeGeometry(0.012, 0.042, 6).rotateX(Math.PI / 2), blk, 0, 0.19, 0.055);
  for (const s of [-1, 1]) {
    add(pg, new THREE.SphereGeometry(0.009, 6, 6), pink, s * 0.022, 0.205, 0.026).scale.set(0.7, 0.8, 1.1);
    // Wing flippers
    const w = add(pg, CB(0.012, 0.09, 0.035, 0.004), blk, s * 0.052, 0.105, 0);
    w.rotation.z = s * 0.18;
    // Black webbed feet (distinctly black, not orange!)
    add(pg, CB(0.024, 0.01, 0.042, 0.003), blk, s * 0.022, 0.005, 0.022);
  }
  mergeByMaterial(pg);
  g.add(pg);
  return pg;
}

/** Southern Right Whale (Eubalaena australis): bowed jaw, callosities, paddle flippers, NO dorsal fin. */
export function whale(sc = 1): THREE.Group {
  const wh = new THREE.Group();
  const body = M('#28313b', 0.34, 0.12);
  const callosity = M('#cfc9ba', 0.88);
  const belly = M('#b5b7b6', 0.45);

  // Stocky teardrop body with bowed lower jawline (no dorsal fin!)
  add(wh, new THREE.SphereGeometry(0.28, 14, 10), body, 0, 0, 0).scale.set(2.15, 0.84, 0.92);
  add(wh, new THREE.SphereGeometry(0.18, 12, 8), body, -0.45, -0.02, 0).scale.set(1.6, 0.52, 0.56);
  add(wh, new THREE.SphereGeometry(0.16, 12, 8), body, 0.42, -0.02, 0).scale.set(1.25, 0.88, 0.84);
  add(wh, new THREE.SphereGeometry(0.18, 10, 8), belly, 0.08, -0.15, 0).scale.set(1.3, 0.38, 0.65);

  // Broad square paddle pectoral flippers
  for (const s of [-1, 1]) {
    const fl = add(wh, CB(0.28, 0.035, 0.22, 0.012), body, 0.22, -0.09, s * 0.28);
    fl.rotation.y = s * 0.32;
    fl.rotation.x = s * 0.18;
  }

  // Broad V-notched horizontal tail fluke
  for (const s of [-1, 1]) {
    const fk = add(wh, CB(0.22, 0.028, 0.32, 0.01), body, -0.78, 0.01, s * 0.14);
    fk.rotation.y = s * 0.42;
  }

  // Crusty pale-cream callosity bonnets on the rostrum & brow
  add(wh, new THREE.SphereGeometry(0.055, 8, 6), callosity, 0.56, 0.08, 0).scale.set(1.3, 0.65, 0.7);
  for (const s of [-1, 1]) {
    add(wh, new THREE.SphereGeometry(0.032, 6, 5), callosity, 0.43, 0.11, s * 0.09);
    add(wh, new THREE.SphereGeometry(0.024, 6, 5), callosity, 0.3, 0.13, s * 0.05);
  }

  mergeByMaterial(wh);
  wh.scale.setScalar(sc);
  return wh;
}

/** St. Lucia Estuary Hippopotamus (Hippopotamus amphibius). */
export function hippo(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  ry = 0
): THREE.Group {
  const hp = new THREE.Group();
  hp.position.set(x, y, z);
  hp.rotation.y = ry;
  hp.scale.setScalar(sc);
  const skin = M('#5c4c4f', 0.42, 0.08);
  const dark = M('#3d3234', 0.48);

  add(hp, new THREE.SphereGeometry(0.18, 12, 10), skin, 0, 0.02, 0).scale.set(1.6, 0.72, 0.88);
  add(hp, new THREE.SphereGeometry(0.11, 10, 8), skin, 0.28, 0.06, 0).scale.set(1.25, 0.78, 0.86);
  add(hp, CB(0.12, 0.08, 0.15, 0.03), skin, 0.37, 0.04, 0);
  // Periscope eyes, ears & nostrils above waterline
  for (const s of [-1, 1]) {
    add(hp, new THREE.SphereGeometry(0.022, 6, 5), dark, 0.24, 0.145, s * 0.055);
    add(hp, new THREE.SphereGeometry(0.016, 6, 5), dark, 0.19, 0.155, s * 0.068);
    add(hp, new THREE.SphereGeometry(0.014, 6, 5), dark, 0.41, 0.085, s * 0.036);
  }
  mergeByMaterial(hp);
  g.add(hp);
  return hp;
}

/** Kgalagadi Gemsbok / Oryx (Oryx gazella) with spear horns & black flank stripe. */
export function gemsbok(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  ry = 0
): THREE.Group {
  const gm = new THREE.Group();
  gm.position.set(x, y, z);
  gm.rotation.y = ry;
  gm.scale.setScalar(sc);
  const coat = MBark('#c2ab8c', 0.88);
  const blk = M('#1b1a1c', 0.78);
  const wht = M('#ded9cf', 0.78);

  add(gm, new THREE.SphereGeometry(0.11, 10, 8), coat, 0, 0.24, 0).scale.set(1.75, 0.85, 0.68);
  add(gm, CB(0.24, 0.03, 0.16, 0.01), blk, -0.01, 0.21, 0);
  add(gm, C(0.036, 0.055, 0.15, 8), coat, 0.14, 0.31, 0).rotation.z = -0.58;
  add(gm, new THREE.SphereGeometry(0.045, 8, 6), wht, 0.22, 0.38, 0).scale.set(1.5, 0.85, 0.75);
  add(gm, CB(0.075, 0.025, 0.062, 0.01), blk, 0.24, 0.38, 0);
  for (const s of [-1, 1]) {
    add(gm, C(0.005, 0.011, 0.26, 6), blk, 0.14, 0.5, s * 0.02).rotation.z = 0.68;
  }
  for (const [lx, lz] of [
    [0.11, 0.045],
    [0.11, -0.045],
    [-0.12, 0.045],
    [-0.12, -0.045],
  ]) {
    add(gm, C(0.01, 0.014, 0.18, 6), coat, lx, 0.09, lz);
    add(gm, C(0.012, 0.014, 0.08, 6), blk, lx, 0.14, lz);
  }
  mergeByMaterial(gm);
  g.add(gm);
  return gm;
}

export function boat(col: string, sc = 1): THREE.Group {
  const b = new THREE.Group();
  const h = new THREE.Shape();
  h.moveTo(-0.5, 0);
  h.lineTo(0.5, 0);
  h.lineTo(0.62, 0.14);
  h.lineTo(-0.5, 0.14);
  h.closePath();
  add(
    b,
    new THREE.ExtrudeGeometry(h, {
      depth: 0.24,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 1,
    }).translate(0, 0.04, -0.12),
    M('#f0eee8', 0.45)
  );
  add(b, CB(0.4, 0.16, 0.22, 0.02), M(col, 0.55), -0.08, 0.26, 0);
  add(b, CB(0.28, 0.06, 0.23, 0.01), MT('#1c2a3a', 0.85, 0.15, 0.6), -0.06, 0.28, 0);
  add(b, C(0.035, 0.048, 0.14, 8), M('#c8342d', 0.6), -0.15, 0.4, 0);
  mergeByMaterial(b);
  b.scale.setScalar(sc);
  return b;
}

export function seaRings(
  g: THREE.Object3D,
  y: number,
  r0: number,
  count = 3,
  col: THREE.ColorRepresentation = '#e8fbff'
): (t: number) => void {
  const rs = Array.from({ length: count }, () =>
    add(
      g,
      new THREE.RingGeometry(r0, r0 + 0.09, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      0,
      y,
      0
    )
  );
  return (t: number) => {
    rs.forEach((r, i) => {
      const k = (t * 0.2 + i / count) % 1;
      r.scale.setScalar(1 + k * 0.9);
      r.material.opacity = 0.48 * (1 - k);
    });
  };
}

export function sea(g: THREE.Object3D, c = '#1c6e91', shallow = '#2da8b8'): THREE.Mesh {
  // Square water plate — the house style is a cut slab, not a circular stand.
  const geo = B(15.6, 0.1, 15.6);
  // Radial bathymetry vertex tinting for crisp shallows -> ocean navy gradient
  const cDeep = new THREE.Color(c);
  const cShal = new THREE.Color(shallow);
  const pos = geo.attributes.position;
  const cols: number[] = [];
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const r = Math.max(Math.abs(pos.getX(i)), Math.abs(pos.getZ(i)));
    const mix = Math.min(1, Math.max(0, (r - 2.0) / 5.4));
    tmp.copy(cShal).lerp(cDeep, mix);
    cols.push(tmp.r, tmp.g, tmp.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.12,
    metalness: 0.25,
  });
  waterize(mat);
  return add(g, geo, mat, 0, 0.05, 0);
}

interface ContactShadowSpec {
  x: number;
  y: number;
  z: number;
  r: number;
  op: number;
}

const contactShadowBatches = new WeakMap<THREE.Object3D, ContactShadowSpec[]>();
const contactShadowMaterials = new WeakMap<THREE.Object3D, THREE.MeshBasicMaterial>();
const contactShadowMeshes = new WeakMap<THREE.Object3D, THREE.Mesh>();
const csTmpBox = new THREE.Box3();
const csTmpSize = new THREE.Vector3();
const csTmpCenter = new THREE.Vector3();

function createContactShadowMaterial(): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({
    map: getSoftTexture(),
    color: '#060912',
    transparent: true,
    opacity: 1,
    depthWrite: false,
    vertexColors: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  mat.userData.noDissolve = true;
  mat.customProgramCacheKey = () => 'contact_shadow_v1';
  return mat;
}

export function stampContactShadow(
  g: THREE.Object3D,
  x: number,
  z: number,
  radius: number,
  opacity = 0.24,
  y = 0.014
): void {
  if (radius <= 0.02 || opacity <= 0.005) return;
  let list = contactShadowBatches.get(g);
  if (!list) {
    list = [];
    contactShadowBatches.set(g, list);
  }
  // Wider, lighter baked contact so the penumbra reads as a soft gradient
  // rather than a dark disc with a visible rim. The soft texture already has
  // an alpha falloff; enlarging the footprint is what actually softens it.
  list.push({ x, y, z, r: radius * 1.32, op: Math.min(0.28, opacity * 0.62) });
}

export function stampContactShadowsFromMeshes(g: THREE.Object3D): void {
  g.updateWorldMatrix(true, true);
  g.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || obj instanceof THREE.InstancedMesh) return;
    if (obj.userData.noShadow || obj.userData.cannotReceiveAO) return;
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (!mat || mat.transparent || mat.depthWrite === false) return;

    csTmpBox.setFromObject(obj);
    if (csTmpBox.isEmpty()) return;
    csTmpBox.getSize(csTmpSize);
    csTmpBox.getCenter(csTmpCenter);

    const span = Math.max(csTmpSize.x, csTmpSize.z);
    // Cover tall towers and broad mountain masses too; the rim/sea plate are
    // far wider than 7.5 so they still cannot stamp themselves.
    if (span < 0.16 || span > 7.5 || csTmpSize.y < 0.08) return;
    if (csTmpBox.min.y < -0.35 || csTmpBox.min.y > 0.48) return;

    const r = Math.min(2.4, Math.max(0.18, span * 0.62));
    stampContactShadow(
      g,
      csTmpCenter.x,
      csTmpCenter.z,
      r,
      0.22,
      Math.max(0.014, csTmpBox.min.y + 0.012)
    );
  });
}

export function finalizeContactShadows(g: THREE.Object3D): void {
  const specs = contactShadowBatches.get(g);
  if (!specs || !specs.length) return;
  contactShadowBatches.delete(g);

  const count = specs.length;
  const positions = new Float32Array(count * 4 * 3);
  const uvs = new Float32Array(count * 4 * 2);
  const colors = new Float32Array(count * 4 * 4);
  const indices = new Uint16Array(count * 6);

  for (let i = 0; i < count; i++) {
    const s = specs[i];
    const vBase = i * 4;
    const pBase = vBase * 3;
    const uBase = vBase * 2;
    const cBase = vBase * 4;
    const iBase = i * 6;

    positions[pBase] = s.x - s.r;
    positions[pBase + 1] = s.y;
    positions[pBase + 2] = s.z - s.r;

    positions[pBase + 3] = s.x + s.r;
    positions[pBase + 4] = s.y;
    positions[pBase + 5] = s.z - s.r;

    positions[pBase + 6] = s.x + s.r;
    positions[pBase + 7] = s.y;
    positions[pBase + 8] = s.z + s.r;

    positions[pBase + 9] = s.x - s.r;
    positions[pBase + 10] = s.y;
    positions[pBase + 11] = s.z + s.r;

    uvs[uBase] = 0;
    uvs[uBase + 1] = 0;
    uvs[uBase + 2] = 1;
    uvs[uBase + 3] = 0;
    uvs[uBase + 4] = 1;
    uvs[uBase + 5] = 1;
    uvs[uBase + 6] = 0;
    uvs[uBase + 7] = 1;

    for (let k = 0; k < 4; k++) {
      colors[cBase + k * 4] = 1;
      colors[cBase + k * 4 + 1] = 1;
      colors[cBase + k * 4 + 2] = 1;
      colors[cBase + k * 4 + 3] = s.op;
    }

    indices[iBase] = vBase;
    indices[iBase + 1] = vBase + 2;
    indices[iBase + 2] = vBase + 1;
    indices[iBase + 3] = vBase;
    indices[iBase + 4] = vBase + 3;
    indices[iBase + 5] = vBase + 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeBoundingSphere();

  const mat = createContactShadowMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 1;
  mesh.userData.noShadow = true;
  mesh.userData.cannotReceiveAO = true;
  g.add(mesh);

  contactShadowMaterials.set(g, mat);
  contactShadowMeshes.set(g, mesh);
}

export function setContactShadowFade(g: THREE.Object3D | null, alpha: number): void {
  if (!g) return;
  const mat = contactShadowMaterials.get(g);
  const mesh = contactShadowMeshes.get(g);
  if (!mat || !mesh) return;
  const clamped = Math.max(0, Math.min(1, alpha));
  mat.opacity = clamped;
  mesh.visible = clamped > 0.01;
}
