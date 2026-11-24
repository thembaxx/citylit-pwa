import * as THREE from 'three';
import { getCachedCanvas, preloadProceduralCanvases, storeGeneratedCanvas } from './textureCache';
import { SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL } from './shaders/season.glsl';

export const WU = {
  t: { value: 0 },
  sun: { value: 1 },
  /** Golden-hour horizon warmth (0 noon/night .. 1 sunset/sunrise). */
  sunHor: { value: 0 },
  /** Seasonal warmth (0 winter .. 1 peak summer). */
  season: { value: 0.5 },
  /** Autumn/golden seasonal influence (peaks mid-autumn). */
  seasonAutumn: { value: 0 },
  /** Spring/fresh-growth seasonal influence (peaks mid-spring). */
  seasonSpring: { value: 0 },
  sky: { value: new THREE.Color('#3b6490') },
  wind: { value: 1 },
  /** Smoothed + gust-modulated wind strength feeding tree, shrub, and grass sway. */
  foliageWind: { value: 1 },
  /** Unit vector pointing in the direction the wind is blowing towards (xz plane). */
  windDir: { value: new THREE.Vector2(1, 0) },
  /** World-space pointer position on ground plane for gentle grass/foliage wind wake. */
  cursor: { value: new THREE.Vector3(0, -100, 0) },
  cursorStrength: { value: 0 },
  /** World-space pointer position for the Places cutaway-water ripple wake. */
  wake: { value: new THREE.Vector3(0, -100, 0) },
  wakeStrength: { value: 0 },
  lit: { value: 0 },
  /** Explicit nighttime-hours toggle factor (0..1) for streetlight emissives. */
  streetLampLit: { value: 0 },
  /** Night-mode activation ramp (0..1) for spawned & batched vehicle lights. */
  vehicleNightLit: { value: 0 },
  rain: { value: 0 },
  /** Weather fog density (0..1); lamp halos bloom wider in fog. */
  fog: { value: 0 },
  /**
   * Share of lit windows in the active landmark (0..1), gated by night. Feeds
   * the sky's light-pollution dome so a busy city glows harder than an empty one.
   */
  pollution: { value: 0 },
  dy: { value: 100 },
  /** Shared semidiurnal coastal tide offset driven by CitylitEngine. */
  coastalTide: { value: 0 },
};

export function applyDissolveToShader(
  shader: THREE.WebGLProgramParametersWithUniforms,
  mat?: THREE.Material
): void {
  if (
    !shader.vertexShader.includes('#include <begin_vertex>') ||
    !shader.fragmentShader.includes('#include <alphatest_fragment>')
  ) {
    return;
  }

  // Vertex-coloured ground/terrain surfaces pick up the seasonal colour morph.
  // Materials with their own shaders (windy foliage, water, strata) call this
  // without a material and bind the season uniforms themselves instead.
  if ((mat as THREE.MeshStandardMaterial | undefined)?.vertexColors) {
    shader.uniforms.uSeasonF = WU.season;
    shader.uniforms.uSeasonAutumn = WU.seasonAutumn;
    shader.uniforms.uSeasonSpring = WU.seasonSpring;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\n${SEASON_UNIFORMS_GLSL}\n${SEASON_MORPH_GLSL}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>\n diffuseColor.rgb = clSeasonMorph(diffuseColor.rgb, 0.82);`
      );
  }

  const hasPbrNormals =
    shader.fragmentShader.includes('#include <opaque_fragment>') &&
    shader.fragmentShader.includes('#include <normal_fragment_begin>');

  shader.uniforms.uDY = WU.dy;
  shader.uniforms.uGouacheHor = WU.sunHor;
  shader.uniforms.uGouacheSun = WU.sun;
  // Atmospheric in-scattering inputs: weather fog + rain thicken the air, the
  // sky tint colours the haze, and golden hour warms the forward scatter.
  shader.uniforms.uFogD = WU.fog;
  shader.uniforms.uRainF = WU.rain;
  shader.uniforms.uSkyF = WU.sky;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWD;uniform float uDY;')
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
#ifdef USE_INSTANCING
vWD=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
#else
vWD=(modelMatrix*vec4(transformed,1.)).xyz;
#endif`
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
varying vec3 vWD;uniform float uDY,uGouacheHor,uGouacheSun,uFogD,uRainF;uniform vec3 uSkyF;
float dtHash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}`
    )
    .replace(
      '#include <alphatest_fragment>',
      `#include <alphatest_fragment>
{
vec3 dCell=floor(vWD*26.0);
float grain=dtHash(dCell);
diffuseColor.rgb*=0.955+0.09*grain;
float ao=smoothstep(-0.15,1.1,vWD.y);
diffuseColor.rgb*=0.9+0.1*ao;
}
if(uDY<90.&&vWD.y>uDY&&dot(vWD.xz,vWD.xz)<110.&&vWD.y<14.)discard;diffuseColor.rgb+=vec3(1.,.75,.35)*smoothstep(uDY-.3,uDY,vWD.y)*step(vWD.y,uDY)*(uDY<90.?2.:0.);`
    );

  if (hasPbrNormals) {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `{
// Painterly gouache sunlit bounce + golden-hour impasto rim light on PBR surfaces.
vec3 gView=normalize(vViewPosition);
float gRim=pow(1.-max(dot(gView,normal),0.),2.6);
float gHeight=smoothstep(-0.2,2.4,vWD.y);
outgoingLight*=1.+.045*smoothstep(.25,.95,uGouacheSun)*gHeight;
outgoingLight+=vec3(1.,.64,.28)*gRim*uGouacheHor*.22*(.35+.65*gHeight);
// Airborne in-scattering. Ground mist pools low, rain thickens it, and the
// forward lobe warms toward the sun so lamps and windows gain visible haze.
float atmoDens=uFogD*0.3+uRainF*0.16;
if(atmoDens>0.002){
vec3 toFrag=vWD-cameraPosition;
float atmoDist=length(toFrag);
vec3 atmoDir=toFrag/max(atmoDist,0.0001);
// Mist hugs the ground: it thins quickly with height so rooftops stay crisp.
float atmoLow=exp(-max(0.,vWD.y)*1.35);
float fwd=pow(max(0.,dot(atmoDir,normalize(vec3(0.45,0.34,0.62)))),3.0);
vec3 atmoCol=mix(uSkyF,vec3(1.,.72,.42),fwd*uGouacheHor);
float ext=1.-exp(-atmoDist*0.04);
outgoingLight+=atmoCol*(atmoDens*atmoLow*ext)*(0.35+fwd*0.8);
}
}
#include <opaque_fragment>`
    );
  }
}

let dissolveInstalled = false;

export function installDissolveShader(): void {
  if (dissolveInstalled) return;
  dissolveInstalled = true;

  THREE.Material.prototype.onBeforeCompile = function (shader) {
    if (
      this.userData?.noDissolve ||
      (this as THREE.Material & { isSpriteMaterial?: boolean }).isSpriteMaterial ||
      (this as THREE.Material & { isPointsMaterial?: boolean }).isPointsMaterial ||
      (this as THREE.Material & { isLineBasicMaterial?: boolean }).isLineBasicMaterial
    ) {
      return;
    }
    applyDissolveToShader(shader, this);
  };
}

/**
 * Procedural surface textures are generated lazily, after the renderer exists.
 * Texture filtering and height->normal conversion are configured once at engine
 * startup so every material helper picks up the same policy.
 */
let textureAnisotropy = 1;
let normalMapsEnabled = false;
/** When true, normal map canvases are generated at half resolution (128 instead of 256). */
let normalMapHalfRes = false;
const trackedCanvasTextures = new Set<THREE.CanvasTexture>();
const normalTextureCache: Record<string, THREE.CanvasTexture> = {};
/** Surfaces that share the procedural height -> roughness pipeline. */
export type RoughnessKind = 'stone' | 'plaster' | 'roof' | 'canvas' | 'wood';
const roughnessTextureCache: Record<string, THREE.CanvasTexture> = {};

export function prepareCanvasTexture(tex: THREE.CanvasTexture): THREE.CanvasTexture {
  tex.anisotropy = textureAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  trackedCanvasTextures.add(tex);
  return tex;
}

/** Configure filtering for all generated textures; call once from CitylitEngine. */
export function configureTextureQuality(anisotropy: number, useNormalMaps: boolean, halfResNormals = false): void {
  textureAnisotropy = Math.max(1, Math.floor(anisotropy));
  normalMapsEnabled = useNormalMaps;
  normalMapHalfRes = halfResNormals;
  for (const tex of trackedCanvasTextures) {
    tex.anisotropy = textureAnisotropy;
    tex.needsUpdate = true;
  }
  for (const tex of Object.values(normalTextureCache)) {
    tex.anisotropy = textureAnisotropy;
    tex.needsUpdate = true;
  }
}

export function normalMapsActive(): boolean {
  return normalMapsEnabled;
}

/**
 * Sobel-derive a tangent-space normal map from an existing grayscale height
 * canvas. Sampling wraps at the edges so the result tiles seamlessly with the
 * original RepeatWrapping bump texture.
 */
function heightToNormalTexture(
  key: string,
  heightTex: THREE.CanvasTexture,
  strength: number
): THREE.CanvasTexture | null {
  if (!normalMapsEnabled) return null;
  const cached = normalTextureCache[key];
  if (cached) return cached;
  const src = heightTex.image as HTMLCanvasElement | undefined;
  const sctx = src?.getContext('2d', { willReadFrequently: true });
  if (!src || !sctx) return null;
  const srcW = src.width;
  const srcH = src.height;
  // On low-end devices (tier 2) generate a half-resolution normal map.
  // The Sobel pass samples from the full-res source so the derivatives are
  // still accurate; only the output canvas is smaller, halving upload cost.
  const w = normalMapHalfRes ? Math.max(1, srcW >> 1) : srcW;
  const h = normalMapHalfRes ? Math.max(1, srcH >> 1) : srcH;
  const srcData = sctx.getImageData(0, 0, srcW, srcH).data;
  const out = getOrCreateCanvas(`normal:${key}${normalMapHalfRes ? '_lr' : ''}`, w, h, (dst) => {
    // Sample from the full-res height data, downscaling coordinates.
    const sample = (x: number, y: number) => {
      const sx = Math.round(x * (srcW / w));
      const sy = Math.round(y * (srcH / h));
      return srcData[((((sy % srcH) + srcH) % srcH) * srcW + (((sx % srcW) + srcW) % srcW)) * 4] / 255;
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
        const dy = (sample(x, y - 1) - sample(x, y + 1)) * strength;
        const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
        const i = (y * w + x) * 4;
        dst[i] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
        dst[i + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
        dst[i + 2] = Math.round((inv * 0.5 + 0.5) * 255);
        dst[i + 3] = 255;
      }
    }
  });
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = heightTex.wrapS;
  tex.wrapT = heightTex.wrapT;
  tex.repeat.copy(heightTex.repeat);
  normalTextureCache[key] = prepareCanvasTexture(tex);
  return tex;
}

/**
 * Derive a low-contrast roughness map from the same height canvas used for
 * bump/normal detail. Grayscale maps multiply material.roughness in Three, so
 * values clustered near 0.9 keep the authored roughness while breaking up the
 * perfectly uniform highlight that makes the miniatures look like plastic.
 */
function heightToRoughnessTexture(
  kind: RoughnessKind,
  heightTex: THREE.CanvasTexture
): THREE.CanvasTexture | null {
  const cached = roughnessTextureCache[kind];
  if (cached) return cached;
  const src = heightTex.image as HTMLCanvasElement | undefined;
  const sctx = src?.getContext('2d', { willReadFrequently: true });
  if (!src || !sctx) return null;
  const w = src.width;
  const h = src.height;
  const srcData = sctx.getImageData(0, 0, w, h).data;
  const out = getOrCreateCanvas(`rough:${kind}`, w, h, (dst) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const height = srcData[i] / 255;
        const variation = (hash2d(x * 0.37, y * 0.53) - 0.5) * 7;
        const v = Math.max(204, Math.min(250, Math.round(232 + (height - 0.5) * 36 + variation)));
        dst[i] = v;
        dst[i + 1] = v;
        dst[i + 2] = v;
        dst[i + 3] = 255;
      }
    }
  });
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = heightTex.wrapS;
  tex.wrapT = heightTex.wrapT;
  tex.repeat.copy(heightTex.repeat);
  roughnessTextureCache[kind] = prepareCanvasTexture(tex);
  return tex;
}

const roughnessHeightByKind: Record<RoughnessKind, () => THREE.CanvasTexture> = {
  stone: getStoneBumpTexture,
  plaster: getPlasterBumpTexture,
  roof: getRoofBumpTexture,
  canvas: getCanvasBumpTexture,
  wood: getWoodBumpTexture,
};

/** Shared, cached roughness companion for a procedural surface. */
export function getSurfaceRoughnessTexture(kind: RoughnessKind): THREE.CanvasTexture | null {
  return heightToRoughnessTexture(kind, roughnessHeightByKind[kind]());
}

export function getStoneNormalTexture(): THREE.CanvasTexture | null {
  return heightToNormalTexture('stone', getStoneBumpTexture(), 3.4);
}
export function getPlasterNormalTexture(): THREE.CanvasTexture | null {
  return heightToNormalTexture('plaster', getPlasterBumpTexture(), 3.0);
}
export function getRoofNormalTexture(): THREE.CanvasTexture | null {
  return heightToNormalTexture('roof', getRoofBumpTexture(), 4.6);
}
export function getCanvasNormalTexture(): THREE.CanvasTexture | null {
  return heightToNormalTexture('canvas', getCanvasBumpTexture(), 3.8);
}
export function getWoodNormalTexture(): THREE.CanvasTexture | null {
  return heightToNormalTexture('wood', getWoodBumpTexture(), 3.2);
}

let softTextureCache: THREE.CanvasTexture | null = null;
let stoneBumpCache: THREE.CanvasTexture | null = null;
let plasterBumpCache: THREE.CanvasTexture | null = null;
let woodBumpCache: THREE.CanvasTexture | null = null;

const HEIGHT_KEYS = {
  stone: 'height:stone',
  plaster: 'height:plaster',
  roof: 'height:roof',
  canvas: 'height:canvas',
  brushed: 'height:brushed',
  wood: 'height:wood',
} as const;

/** Every canvas the deterministic generators can persist across visits. */
const PROCEDURAL_CANVAS_KEYS: readonly string[] = [
  ...Object.values(HEIGHT_KEYS),
  'normal:stone',
  'normal:plaster',
  'normal:roof',
  'normal:canvas',
  'normal:wood',
  'normal:brushed',
  'rough:stone',
  'rough:plaster',
  'rough:roof',
  'rough:canvas',
  'rough:wood',
];

/** Call once at boot, before any material builder asks for a surface map. */
export async function preloadProceduralTextures(): Promise<void> {
  await preloadProceduralCanvases(PROCEDURAL_CANVAS_KEYS);
}

function getOrCreateCanvas(
  key: string,
  width: number,
  height: number,
  fill: (data: Uint8ClampedArray) => void
): HTMLCanvasElement {
  const hit = getCachedCanvas(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    const img = ctx.createImageData(width, height);
    fill(img.data);
    ctx.putImageData(img, 0, 0);
  }
  storeGeneratedCanvas(key, canvas);
  return canvas;
}

function hash2d(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function getSoftTexture(): THREE.CanvasTexture {
  if (softTextureCache) return softTextureCache;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  softTextureCache = prepareCanvasTexture(new THREE.CanvasTexture(c));
  return softTextureCache;
}

export function getStoneBumpTexture(): THREE.CanvasTexture {
  if (stoneBumpCache) return stoneBumpCache;
  const size = 256;
  const c = getOrCreateCanvas(HEIGHT_KEYS.stone, size, size, (data) => {
    for (let y = 0; y < size; y++) {
      const yn = y / size;
      const strata =
        Math.sin(yn * Math.PI * 14) * 18 +
        Math.sin(yn * Math.PI * 34 + 1.3) * 10 +
        Math.sin(yn * Math.PI * 68 + 0.5) * 5;
      for (let x = 0; x < size; x++) {
        const xn = x / size;
        const grain = (hash2d(x, y) - 0.5) * 32 + (hash2d(Math.floor(x * 0.5), Math.floor(y * 0.5)) - 0.5) * 16;
        const block = Math.sin(xn * Math.PI * 8 + Math.sin(yn * Math.PI * 18)) * 9;
        const crack =
          Math.abs(Math.sin(xn * Math.PI * 7 + Math.sin(yn * Math.PI * 5) * 3.2)) > 0.992
            ? -44
            : 0;
        const v = Math.max(0, Math.min(255, Math.round(128 + strata + grain + block + crack)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  prepareCanvasTexture(tex);
  stoneBumpCache = tex;
  return tex;
}

export function getPlasterBumpTexture(): THREE.CanvasTexture {
  if (plasterBumpCache) return plasterBumpCache;
  const size = 256;
  const c = getOrCreateCanvas(HEIGHT_KEYS.plaster, size, size, (data) => {
    for (let y = 0; y < size; y++) {
      const yn = y / size;
      for (let x = 0; x < size; x++) {
        const xn = x / size;
        const fine = (hash2d(x * 1.3, y * 1.7) - 0.5) * 24;
        const trowel =
          Math.sin(xn * Math.PI * 20 + yn * Math.PI * 14) * 7 +
          Math.cos(xn * Math.PI * 9 - yn * Math.PI * 11) * 5;
        const v = Math.max(0, Math.min(255, Math.round(128 + fine + trowel)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  prepareCanvasTexture(tex);
  plasterBumpCache = tex;
  return tex;
}

let roofBumpCache: THREE.CanvasTexture | null = null;
let canvasBumpCache: THREE.CanvasTexture | null = null;
let brushedRoughCache: THREE.CanvasTexture | null = null;

export function getRoofBumpTexture(): THREE.CanvasTexture {
  if (roofBumpCache) return roofBumpCache;
  const size = 256;
  const c = getOrCreateCanvas(HEIGHT_KEYS.roof, size, size, (data) => {
    for (let y = 0; y < size; y++) {
      const row = Math.floor(y / 12);
      const course = Math.sin(((y % 12) / 12) * Math.PI) * 24;
      const jointY = y % 12 === 0 ? -18 : 0;
      for (let x = 0; x < size; x++) {
        const offset = row % 2 ? 6 : 0;
        const tile = Math.sin((((x + offset) % 12) / 12) * Math.PI) * 14;
        const grain = (hash2d(x * 1.7, y * 1.3) - 0.5) * 16;
        const v = Math.max(0, Math.min(255, Math.round(128 + course + tile + grain + jointY)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  prepareCanvasTexture(tex);
  roofBumpCache = tex;
  return tex;
}

export function getCanvasBumpTexture(): THREE.CanvasTexture {
  if (canvasBumpCache) return canvasBumpCache;
  const size = 256;
  const c = getOrCreateCanvas(HEIGHT_KEYS.canvas, size, size, (data) => {
    for (let y = 0; y < size; y++) {
      const yn = y / size;
      for (let x = 0; x < size; x++) {
        const xn = x / size;
        const weave = Math.sin(xn * Math.PI * 56) * Math.sin(yn * Math.PI * 56);
        const slub = (hash2d(Math.floor(x * 0.5), Math.floor(y * 0.5)) - 0.5) * 20;
        const v = Math.max(0, Math.min(255, Math.round(128 + weave * 11 + slub)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  prepareCanvasTexture(tex);
  canvasBumpCache = tex;
  return tex;
}

export function getBrushedNormalTexture(): THREE.CanvasTexture | null {
  return heightToNormalTexture('brushed', getBrushedRoughnessTexture(), 3);
}

export function getBrushedRoughnessTexture(): THREE.CanvasTexture {
  if (brushedRoughCache) return brushedRoughCache;
  const size = 256;
  const c = getOrCreateCanvas(HEIGHT_KEYS.brushed, size, size, (data) => {
    for (let y = 0; y < size; y++) {
      const broad = Math.sin((y / size) * Math.PI * 8) * 10;
      for (let x = 0; x < size; x++) {
        const streak = (hash2d(Math.floor(x * 0.25), y * 2.4) - 0.5) * 28;
        const v = Math.max(0, Math.min(255, Math.round(178 + broad + streak)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  prepareCanvasTexture(tex);
  brushedRoughCache = tex;
  return tex;
}

export function getWoodBumpTexture(): THREE.CanvasTexture {
  if (woodBumpCache) return woodBumpCache;
  const size = 256;
  const c = getOrCreateCanvas(HEIGHT_KEYS.wood, size, size, (data) => {
    for (let y = 0; y < size; y++) {
      const yn = y / size;
      for (let x = 0; x < size; x++) {
        const xn = x / size;
        const knot = Math.exp(-((xn - 0.35) ** 2 * 24 + (yn - 0.6) ** 2 * 10)) * 18;
        const streak =
          Math.sin(xn * Math.PI * 64 + Math.sin(yn * Math.PI * 6) * 2.8 + knot * 0.14) * 18 +
          Math.sin(xn * Math.PI * 22 + yn * Math.PI * 4) * 7 +
          (hash2d(x, Math.floor(y * 0.4)) - 0.5) * 20;
        const v = Math.max(0, Math.min(255, Math.round(128 + streak)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  prepareCanvasTexture(tex);
  woodBumpCache = tex;
  return tex;
}

export interface WaterFlow {
  /** World-space X/Z flow direction. Zero falls back to the default drift. */
  readonly x?: number;
  readonly z?: number;
  /** Relative flow speed; 1 is the existing gentle default. */
  readonly speed?: number;
}

export function waterize(
  mat: THREE.MeshStandardMaterial,
  flow?: WaterFlow
): THREE.MeshStandardMaterial {
  mat.userData.isWaterSurface = true;
  const rawX = flow?.x ?? 0;
  const rawZ = flow?.z ?? 0;
  const flowLen = Math.hypot(rawX, rawZ);
  const flowX = flowLen > 1e-5 ? rawX / flowLen : 0;
  const flowZ = flowLen > 1e-5 ? rawZ / flowLen : 1;
  const flowSpeed = Math.max(0, flow?.speed ?? 1);
  const flowXG = flowX.toFixed(3);
  const flowZG = flowZ.toFixed(3);
  const flowSpeedG = flowSpeed.toFixed(3);

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uSI = WU.sun;
    shader.uniforms.uHorW = WU.sunHor;
    shader.uniforms.uSky = WU.sky;
    shader.uniforms.uRN = WU.rain;
    shader.uniforms.uWdW = WU.wind;
    shader.uniforms.uWdDir = WU.windDir;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
#ifdef USE_INSTANCING
vW=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
#else
vW=(modelMatrix*vec4(transformed,1.)).xyz;
#endif`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vW;uniform float uWT,uSI,uHorW,uRN,uWdW;uniform vec2 uWdDir;uniform vec3 uSky;
float wHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wHash(i),wHash(i+vec2(1.,0.)),f.x),mix(wHash(i+vec2(0.,1.)),wHash(i+vec2(1.,1.)),f.x),f.y);}
float wFbm(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*wNoise(p);p=p*2.07+vec2(13.,7.);a*=.5;}return s;}
float wCaustic(vec2 p,float t){
  float c1=abs(sin(p.x*5.2+t*1.4+sin(p.y*4.1-t*1.1)));
  float c2=abs(sin(p.y*5.7-t*1.3+cos(p.x*4.6+t*0.9)));
  return pow(1.0-min(c1,c2),4.5);
}
float wRainRing(vec2 q,float t){
  vec2 cell=floor(q*3.2),f=fract(q*3.2)-0.5;
  float h=wHash(cell);
  float phase=fract(t*1.35+h);
  float d=length(f-(vec2(h,fract(h*13.7))-0.5)*0.4);
  float ring=smoothstep(0.055,0.0,abs(d-phase*0.42))*(1.0-phase);
  return ring*step(0.28,h);
}
const vec2 RIVER_DIR=vec2(${flowXG},${flowZG});
const float RIVER_SPEED=${flowSpeedG};
const float RIVER_ACTIVE=${flowLen > 1e-5 ? '1.0' : '0.0'};
float wHeight(vec2 p,float t){
float windN=min(2.5,max(0.0,uWdW));
float chop=1.0+windN*0.28;
float wt=t*(1.0+windN*0.18);
vec2 windDrift=uWdDir*(t*(0.12+windN*0.24));
vec2 riverDrift=RIVER_DIR*(t*RIVER_SPEED*(0.12+windN*0.10))*RIVER_ACTIVE;
float alignWave=sin(dot(p,uWdDir)*2.75-wt*1.9)*(0.18+windN*0.16);
float riverWave=sin(dot(p,RIVER_DIR)*2.15-t*RIVER_SPEED*1.45)*0.17*RIVER_ACTIVE;
float h=(sin(p.x*1.9+wt*1.25)*.5+sin(p.y*1.45-wt*.95)*.42+sin((p.x+p.y)*2.6+wt*1.7)*.2+alignWave+riverWave)*chop;
h+=(wFbm(p*2.1+windDrift+riverDrift+vec2(wt*.14,-wt*.10))-.5)*(.42+windN*.12);
h+=uRN*.18*sin((p.x*11.+p.y*9.)+t*9.)*sin((p.x*5.-p.y*13.)-t*7.);
return h;
}`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
{
vec2 q=vW.xz;float t=uWT;float e=.075;
float h=wHeight(q,t),hx=wHeight(q+vec2(e,0.),t),hy=wHeight(q+vec2(0.,e),t);
float rSplash=uRN>0.05?wRainRing(q,t)*uRN*0.14:0.0;
vec3 dev=vec3(-(hx-h)/e+rSplash,0.,-(hy-h)/e+rSplash)*.07;
normal=normalize(normal+(viewMatrix*vec4(dev,0.)).xyz);
}`
      )
      .replace(
        '#include <opaque_fragment>',
        `{
vec2 q=vW.xz;float t=uWT;float h=wHeight(q,t);
float fr=pow(1.-max(dot(normalize(vViewPosition),normal),0.),3.2);
vec3 skyWash=mix(uSky*1.1,vec3(1.,.68,.38),uHorW*.48);
outgoingLight=mix(outgoingLight,skyWash,fr*.62);
// Subsurface dual-layer sunlit caustics strongest in turquoise shallows near shore
float rEdge=max(abs(vW.x),abs(vW.z));
float shallowMask=smoothstep(0.14,0.48,diffuseColor.g)*smoothstep(7.4,2.4,rEdge);
float cA=wCaustic(q*0.85,t);
float cB=wCaustic(q*1.32+vec2(2.3,-1.6),t*0.78);
float caustic=(cA*0.65+cB*0.55)*(0.38+0.62*shallowMask)*(smoothstep(0.15,0.95,uSI)+0.10*uHorW);
outgoingLight+=mix(vec3(0.42,0.88,0.95),vec3(1.0,0.84,0.52),uHorW*0.6)*caustic*0.26;
// Crest foam + shoreline rim foam near the cut wall
float shoreNoise=wNoise(q*4.5+vec2(t*0.6,-t*0.45));
float shoreFoam=smoothstep(6.7,8.05,rEdge)*smoothstep(0.32,0.75,shoreNoise+sin(t*1.8)*0.12);
float crest=smoothstep(.58,.95,h*.5+.5);
outgoingLight+=vec3(.88,.97,1.)*(crest*(.20+min(2.0,uWdW)*.08)+shoreFoam*.34);
// Expanding raindrop splash rings on water surface
if(uRN>0.05){
  outgoingLight+=vec3(.82,.92,1.)*wRainRing(q,t)*uRN*0.28;
}
float glint=pow(wNoise(q*7.+vec2(t*1.4,-t*1.1)),16.);
vec3 glintCol=mix(vec3(1.,.96,.84),vec3(1.,.74,.36),uHorW*.72);
outgoingLight+=glintCol*glint*(.85+.45*uHorW)*uSI;
// Night moonlight silver sparkle across gentle wave crests
float moonVis=smoothstep(0.38,0.04,uSI)*(1.0-uRN*0.7);
if(moonVis>0.01){
  float mGlint=pow(wNoise(q*5.8+vec2(-t*0.95,t*0.85)),13.)*smoothstep(0.38,0.85,h*0.5+0.5);
  outgoingLight+=vec3(0.76,0.88,1.0)*mGlint*moonVis*0.52;
}
}
#include <opaque_fragment>`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => `water_v8_${flowXG}_${flowZG}_${flowSpeedG}`;
  return mat;
}

export function flagWindy(
  mat: THREE.MeshStandardMaterial,
  cacheKey = 'flag_wind'
): THREE.MeshStandardMaterial {
  mat.side = THREE.DoubleSide;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uWd = WU.wind;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWT,uWd;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{
  float pin=smoothstep(0.0,0.32,max(0.0,position.x));
  float wAmp=0.04+clamp(uWd,0.0,3.5)*0.045;
  float wave=sin(position.x*16.0-uWT*(5.5+uWd*2.6)+position.y*4.0);
  transformed.z+=wave*wAmp*pin;
  transformed.y+=cos(position.x*10.0-uWT*4.2)*wAmp*0.32*pin;
}`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => `${cacheKey}_v1`;
  return mat;
}

export function cascadeize(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWU;varying vec3 vWN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWU=uv;vWN=normal;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 vWU;varying vec3 vWN;uniform float uWT;'
      )
      .replace(
        '#include <opaque_fragment>',
        `{float streak=sin(vWU.x*38.)*.5+.5;float flow=sin(vWU.y*24.+uWT*9.+streak*3.)*.5+.5;float mist=smoothstep(0.,.25,vWU.y)*smoothstep(1.,.72,vWU.y);outgoingLight=mix(outgoingLight,vec3(.92,.95,.96),flow*.5+.2*streak);outgoingLight+=vec3(.08,.1,.11)*(1.-mist);}
#include <opaque_fragment>`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => 'cascade_v2';
  return mat;
}

export interface WindyShaderOptions {
  /** Local Y height used to normalize flex curve (default 1.5). */
  heightScale?: number;
  /** Overall sway bend amplitude multiplier (default 1). */
  swayScale?: number;
  /** High-frequency outer foliage flutter multiplier (default 1). */
  flutterScale?: number;
  /** Rain weight vertical droop multiplier (default 1). */
  rainDroop?: number;
  /** Normalized height [0..1] below which root base stays rigidly anchored (default 0.14). */
  trunkBase?: number;
  /** World-space cursor wind wake parting amplitude (default 0.16). */
  wakeScale?: number;
  /** Enables warm backlit foliage subsurface translucency + seasonal tinting. */
  foliageSss?: boolean;
}

export function windy(
  mat: THREE.MeshStandardMaterial,
  cacheKey = 'wind',
  opts: WindyShaderOptions = {}
): THREE.MeshStandardMaterial {
  const heightScale = (opts.heightScale ?? 1.5).toFixed(3);
  const swayScale = (opts.swayScale ?? 1.0).toFixed(3);
  const flutterScale = (opts.flutterScale ?? 1.0).toFixed(3);
  const rainDroop = (opts.rainDroop ?? 1.0).toFixed(3);
  const trunkBase = (opts.trunkBase ?? 0.14).toFixed(3);
  const wakeScale = (opts.wakeScale ?? 0.16).toFixed(3);
  const foliageSss = opts.foliageSss ? 1 : 0;
  const fullKey = `${cacheKey}_v5_${heightScale}_${swayScale}_${flutterScale}_${rainDroop}_${trunkBase}_${wakeScale}_${foliageSss}`;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uWd = WU.foliageWind;
    shader.uniforms.uWindDir = WU.windDir;
    shader.uniforms.uRain = WU.rain;
    shader.uniforms.uCursor = WU.cursor;
    shader.uniforms.uCursorStr = WU.cursorStrength;
    // Every foliage material morphs with the month, not just the SSS-lit ones.
    shader.uniforms.uSeasonF = WU.season;
    shader.uniforms.uSeasonAutumn = WU.seasonAutumn;
    shader.uniforms.uSeasonSpring = WU.seasonSpring;
    if (foliageSss) {
      shader.uniforms.uSunF = WU.sun;
      shader.uniforms.uHorF = WU.sunHor;
    }
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uWT,uWd,uRain,uCursorStr;uniform vec2 uWindDir;uniform vec3 uCursor;'
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{
#ifdef USE_INSTANCING
vec3 wp=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
float seed=instanceMatrix[3].x*.73+instanceMatrix[3].z*1.17;
#else
vec3 wp=(modelMatrix*vec4(transformed,1.)).xyz;
float seed=wp.x*.73+wp.z*1.17;
#endif
// Hierarchical root-anchored flex curve: solid root flare below trunkBase, fluid sway above.
float h=clamp(position.y/${heightScale},0.,1.);
float hb=smoothstep(${trunkBase},1.,h);
float k=hb*hb*(2.2-1.2*hb);
float radial=clamp(length(position.xz)*1.45,0.,1.);
float t=uWT;
float windStrength=clamp(uWd,0.,4.);
float rainFac=clamp(uRain,0.,1.);
// Travelling world-space gust wave sweeps across groves & plains sequentially.
float gustWave=.62+.26*sin(dot(wp.xz,uWindDir)*.48-t*1.38+seed*.35)+.14*sin(t*.41+seed*1.2);
float slow=sin(t*.86+seed),mid=sin(t*1.82+seed*1.7+1.3);
float leafRipple=sin(t*4.1+wp.x*4.9+wp.z*5.4+wp.y*3.1);
// Secondary jitter at a different frequency and spatial phase breaks the
// uniform pulsing so trees in a grove sway independently rather than in unison.
float leafRipple2=sin(t*2.73+wp.x*7.1-wp.z*3.8+seed*1.4)*0.42;
float amp=.094*windStrength*k*gustWave*${swayScale};
float sway=(slow*.62+mid*.28)*amp;
float leewardLean=.042*windStrength*k*(.62+.38*gustWave)*${swayScale};
float flutter=(leafRipple+leafRipple2)*.026*windStrength*k*(.35+.65*radial)*mix(1.,.65,rainFac)*${flutterScale};
// Subtle rotational crown twist weighted by radial branch distance.
float twist=sin(t*1.25+seed*2.1)*.032*windStrength*radial*hb*${swayScale};
vec2 dir=uWindDir;
transformed.x+=dir.x*(sway+leewardLean+flutter)-dir.y*flutter*.65-position.z*twist;
transformed.z+=dir.y*(sway+leewardLean+flutter)+dir.x*flutter*.65+position.x*twist;
// Interactive pointer breeze wake parts nearby grass & canopies smoothly.
vec2 dCur=wp.xz-uCursor.xz;
float cDistSq=dot(dCur,dCur);
float cWake=exp(-cDistSq*1.35)*uCursorStr*${wakeScale}*h;
vec2 wakeDir=cDistSq>0.0001?normalize(dCur):dir;
transformed.x+=wakeDir.x*cWake;
transformed.z+=wakeDir.y*cWake;
// Canopy & grass blade droop under rain weight.
transformed.y-=rainFac*.042*k*${rainDroop};
}`
      );

    // Morph the foliage's own colour (material/vertex/instance tint) with the
    // selected month before any lighting/SSS is applied in opaque_fragment.
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\n${SEASON_UNIFORMS_GLSL}\n${SEASON_MORPH_GLSL}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>\n diffuseColor.rgb = clSeasonMorph(diffuseColor.rgb, 1.0);`
      );

    if (
      foliageSss &&
      shader.fragmentShader.includes('#include <opaque_fragment>') &&
      shader.fragmentShader.includes('#include <normal_fragment_begin>')
    ) {
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uSunF,uHorF;')
        .replace(
          '#include <opaque_fragment>',
          `{
vec3 fView=normalize(vViewPosition);
float backScatter=pow(clamp(-dot(fView,normal)*.5+.5,0.,1.),2.2);
vec3 sssTint=mix(vec3(.65,.95,.42),vec3(1.0,.82,.38),uHorF*.75);
outgoingLight*=mix(vec3(.96,1.0,.94),vec3(1.05,.97,.89),uSeasonF);
outgoingLight+=sssTint*backScatter*(.08*uSunF+.18*uHorF);
}
#include <opaque_fragment>`
        );
    }
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => fullKey;
  return mat;
}

export function grassWindy(
  mat: THREE.MeshStandardMaterial,
  cacheKey = 'wind_grass'
): THREE.MeshStandardMaterial {
  return windy(mat, cacheKey, {
    heightScale: 0.34,
    swayScale: 1.35,
    flutterScale: 0.8,
    rainDroop: 1.3,
    trunkBase: 0.04,
    wakeScale: 0.28,
    foliageSss: true,
  });
}

export function lights(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uLit = WU.lit;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
#ifdef USE_INSTANCING
vW=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
#else
vW=(modelMatrix*vec4(transformed,1.)).xyz;
#endif`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;uniform float uWT,uLit;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
{vec3 cc=floor(vW*2.5);float hh=fract(sin(dot(cc,vec3(12.9898,78.233,37.719)))*43758.5453);float on=smoothstep(hh*.8,hh*.8+.2,uLit);totalEmissiveRadiance*=mix(.3,1.,on)*(.88+.12*sin(uWT*(3.+hh*5.)+hh*30.));}`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => 'lights';
  return mat;
}

export const SKY_NOISE_GLSL = `
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(17.,9.);a*=.5;}return s;}
`;

/**
 * World-space rain puddles & wet sheen on roads, cobblestone aprons, and stone plazas.
 * Preserves the shared dissolve/gouache/seasonal hooks by delegating to applyDissolveToShader.
 */
export function wetPuddleShader(mat: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPuddleRain = WU.rain;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uPuddleRain;
float wpHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wpNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wpHash(i),wpHash(i+vec2(1.,0.)),f.x),mix(wpHash(i+vec2(0.,1.)),wpHash(i+vec2(1.,1.)),f.x),f.y);}
float wpMask(vec2 p,float r){
  if(r<=0.02)return 0.0;
  float n1=wpNoise(p*0.72);
  float n2=wpNoise(p*1.95+vec2(5.2,3.1));
  return smoothstep(0.48,0.74,n1*0.72+n2*0.28)*smoothstep(0.02,0.55,r);
}`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
{
  float pd=wpMask(vWD.xz,uPuddleRain)*step(0.08,vWD.y);
  roughnessFactor=mix(roughnessFactor,0.045,pd*0.92);
}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
{
  float pd=wpMask(vWD.xz,uPuddleRain)*step(0.08,vWD.y);
  diffuseColor.rgb*=1.0-0.22*pd;
}`
      );
    applyDissolveToShader(shader, mat);
  };
  mat.customProgramCacheKey = () => 'wet_puddle_v1';
  return mat;
}

/**
 * Adds subtle 3D tangent-space interior room parallax (recessed ceiling glow, warm back wall,
 * blind slats & depth shadow) inside facade window panes without extra geometry.
 */
export function interiorParallaxShader(
  mat: THREE.MeshStandardMaterial,
  cols: number,
  rows: number,
  /** Optional shared emissive ramp (windowLights dips it on each re-bake). */
  ramp?: { value: number }
): THREE.MeshStandardMaterial {
  const cVal = Math.max(1, Math.round(cols));
  const rVal = Math.max(1, Math.round(rows));
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWinGrid = { value: new THREE.Vector2(cVal, rVal) };
    shader.uniforms.uWinLit = WU.lit;
    shader.uniforms.uWinRamp = ramp ?? { value: 1 };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 vWinUv;\nvarying vec3 vWinWorldPos;\nvarying vec3 vWinWorldNorm;'
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vWinUv=uv;
#ifdef USE_INSTANCING
vWinWorldPos=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
vWinWorldNorm=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*objectNormal);
#else
vWinWorldPos=(modelMatrix*vec4(transformed,1.)).xyz;
vWinWorldNorm=normalize(mat3(modelMatrix)*objectNormal);
#endif`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec2 vWinUv;
varying vec3 vWinWorldPos;
varying vec3 vWinWorldNorm;
uniform vec2 uWinGrid;
uniform float uWinLit;
uniform float uWinRamp;`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
{
  vec2 cellUv=fract(vWinUv*uWinGrid);
  vec2 cellIdx=floor(vWinUv*uWinGrid);
  float paneX=smoothstep(0.36,0.31,abs(cellUv.x-0.5));
  float paneY=smoothstep(0.39,0.34,abs(cellUv.y-0.5));
  float paneMask=paneX*paneY;
  if(paneMask>0.01){
    vec3 wN=normalize(vWinWorldNorm);
    vec3 upAx=abs(wN.y)>0.92?vec3(0.,0.,1.):vec3(0.,1.,0.);
    vec3 rightAx=normalize(cross(upAx,wN));
    vec3 realUp=normalize(cross(wN,rightAx));
    vec3 wView=normalize(vWinWorldPos-cameraPosition);
    vec3 tv=vec3(dot(wView,rightAx),dot(wView,realUp),dot(wView,wN));
    float roomDepth=0.28/max(0.28,abs(tv.z));
    vec2 roomUv=clamp(cellUv+tv.xy*roomDepth*vec2(-0.55,0.45),0.04,0.96);
    float ceilGlow=smoothstep(0.28,0.94,roomUv.y);
    float wallShade=0.72+0.28*smoothstep(0.05,0.45,abs(roomUv.x-0.5));
    float blindPhase=fract(sin(dot(cellIdx,vec2(19.7,43.3)))*43758.5453);
    float blind=mix(1.0,smoothstep(0.35,0.65,roomUv.y),step(0.55,blindPhase)*0.45);
    float depthMod=mix(1.0,(0.48+0.78*ceilGlow)*wallShade*blind,paneMask);
    diffuseColor.rgb*=mix(1.0,0.68+0.42*ceilGlow,paneMask*(1.0-uWinLit*0.5));
    totalEmissiveRadiance*=depthMod*uWinRamp;
  }
}`
      );
    applyDissolveToShader(shader, mat);
  };
  mat.customProgramCacheKey = () => `win_parallax_v1_${cVal}x${rVal}`;
  return mat;
}

