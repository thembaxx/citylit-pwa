import * as THREE from 'three';

export const WU = {
  t: { value: 0 },
  sun: { value: 1 },
  sky: { value: new THREE.Color('#3b6490') },
  wind: { value: 1 },
  /** Unit vector pointing in the direction the wind is blowing towards (xz plane). */
  windDir: { value: new THREE.Vector2(1, 0) },
  lit: { value: 0 },
  rain: { value: 0 },
  dy: { value: 100 },
};

function applyDissolveToShader(shader: THREE.WebGLProgramParametersWithUniforms): void {
  if (
    !shader.vertexShader.includes('#include <begin_vertex>') ||
    !shader.fragmentShader.includes('#include <alphatest_fragment>')
  ) {
    return;
  }

  shader.uniforms.uDY = WU.dy;
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
varying vec3 vWD;uniform float uDY;
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
    applyDissolveToShader(shader);
  };
}

/**
 * Procedural surface textures are generated lazily, after the renderer exists.
 * Texture filtering and height->normal conversion are configured once at engine
 * startup so every material helper picks up the same policy.
 */
let textureAnisotropy = 1;
let normalMapsEnabled = false;
const trackedCanvasTextures = new Set<THREE.CanvasTexture>();
const normalTextureCache: Record<string, THREE.CanvasTexture> = {};

function prepareCanvasTexture(tex: THREE.CanvasTexture): THREE.CanvasTexture {
  tex.anisotropy = textureAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  trackedCanvasTextures.add(tex);
  return tex;
}

/** Configure filtering for all generated textures; call once from CitylitEngine. */
export function configureTextureQuality(anisotropy: number, useNormalMaps: boolean): void {
  textureAnisotropy = Math.max(1, Math.floor(anisotropy));
  normalMapsEnabled = useNormalMaps;
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
  const w = src.width;
  const h = src.height;
  const srcData = sctx.getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  if (!octx) return null;
  const img = octx.createImageData(w, h);
  const dst = img.data;
  const sample = (x: number, y: number) =>
    srcData[((((y % h) + h) % h) * w + (((x % w) + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      // Image rows increase downward but UV v increases upward: flip dy to
      // produce an OpenGL-style (+Y green) tangent-space normal.
      const dy = (sample(x, y - 1) - sample(x, y + 1)) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * w + x) * 4;
      dst[i] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      dst[i + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      dst[i + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      dst[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = heightTex.wrapS;
  tex.wrapT = heightTex.wrapT;
  tex.repeat.copy(heightTex.repeat);
  normalTextureCache[key] = prepareCanvasTexture(tex);
  return tex;
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
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      const strata =
        Math.sin((y / size) * Math.PI * 10) * 18 + Math.sin((y / size) * Math.PI * 26 + 1.3) * 9;
      for (let x = 0; x < size; x++) {
        const grain = (hash2d(x, y) - 0.5) * 34;
        const block = Math.sin((x / size) * Math.PI * 6 + Math.sin(y * 0.2)) * 8;
        const crack = Math.abs(Math.sin(x * 0.07 + Math.sin(y * 0.04) * 3)) > 0.991 ? -38 : 0;
        const v = Math.max(0, Math.min(255, Math.round(128 + strata + grain + block + crack)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
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
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const fine = (hash2d(x * 1.3, y * 1.7) - 0.5) * 28;
        const trowel = Math.sin(x * 0.22 + y * 0.16) * 8;
        const v = Math.max(0, Math.min(255, Math.round(128 + fine + trowel)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
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
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      const row = Math.floor(y / 16);
      const course = Math.sin(((y % 16) / 16) * Math.PI) * 22;
      for (let x = 0; x < size; x++) {
        const offset = row % 2 ? 8 : 0;
        const tile = Math.sin((((x + offset) % 16) / 16) * Math.PI) * 14;
        const grain = (hash2d(x * 1.7, y * 1.3) - 0.5) * 18;
        const v = Math.max(0, Math.min(255, Math.round(128 + course + tile + grain)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
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
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const weave = Math.sin((x / size) * Math.PI * 64) * Math.sin((y / size) * Math.PI * 64);
        const slub = (hash2d(Math.floor(x * 0.5), Math.floor(y * 0.5)) - 0.5) * 22;
        const v = Math.max(0, Math.min(255, Math.round(128 + weave * 10 + slub)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  prepareCanvasTexture(tex);
  canvasBumpCache = tex;
  return tex;
}

export function getBrushedRoughnessTexture(): THREE.CanvasTexture {
  if (brushedRoughCache) return brushedRoughCache;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      const broad = Math.sin((y / size) * Math.PI * 6) * 12;
      for (let x = 0; x < size; x++) {
        const streak = (hash2d(Math.floor(x * 0.2), y * 2.2) - 0.5) * 26;
        const v = Math.max(0, Math.min(255, Math.round(178 + broad + streak)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
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
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const streak =
          Math.sin(x * 0.65 + Math.sin(y * 0.08) * 2.4) * 18 +
          (hash2d(x, Math.floor(y * 0.35)) - 0.5) * 22;
        const v = Math.max(0, Math.min(255, Math.round(128 + streak)));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  prepareCanvasTexture(tex);
  woodBumpCache = tex;
  return tex;
}

export function waterize(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uSI = WU.sun;
    shader.uniforms.uSky = WU.sky;
    shader.uniforms.uRN = WU.rain;
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
varying vec3 vW;uniform float uWT,uSI,uRN;uniform vec3 uSky;
float wHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wHash(i),wHash(i+vec2(1.,0.)),f.x),mix(wHash(i+vec2(0.,1.)),wHash(i+vec2(1.,1.)),f.x),f.y);}
float wFbm(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*wNoise(p);p=p*2.07+vec2(13.,7.);a*=.5;}return s;}
float wHeight(vec2 p,float t){
float h=sin(p.x*1.9+t*1.25)*.5+sin(p.y*1.45-t*.95)*.42+sin((p.x+p.y)*2.6+t*1.7)*.2;
h+=(wFbm(p*2.1+vec2(t*.22,-t*.16))-.5)*.42;
h+=uRN*.16*sin((p.x*11.+p.y*9.)+t*9.)*sin((p.x*5.-p.y*13.)-t*7.);
return h;
}`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
{
vec2 q=vW.xz;float t=uWT;float e=.075;
float h=wHeight(q,t),hx=wHeight(q+vec2(e,0.),t),hy=wHeight(q+vec2(0.,e),t);
vec3 dev=vec3(-(hx-h)/e,0.,-(hy-h)/e)*.07;
normal=normalize(normal+(viewMatrix*vec4(dev,0.)).xyz);
}`
      )
      .replace(
        '#include <opaque_fragment>',
        `{
vec2 q=vW.xz;float t=uWT;float h=wHeight(q,t);
float fr=pow(1.-max(dot(normalize(vViewPosition),normal),0.),3.2);
outgoingLight=mix(outgoingLight,uSky*1.1,fr*.6);
float crest=smoothstep(.62,.98,h*.5+.5);
outgoingLight+=vec3(.82,.94,1.)*crest*.16;
float glint=pow(wNoise(q*7.+vec2(t*1.4,-t*1.1)),18.);
outgoingLight+=vec3(1.,.96,.84)*glint*.85*uSI;
}
#include <opaque_fragment>`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => 'water_v3';
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
        `{float streak=sin(vWU.x*38.)*.5+.5;float flow=sin(vWU.y*24.+uWT*9.+streak*3.)*.5+.5;float mist=smoothstep(0.,.25,vWU.y)*smoothstep(1.,.72,vWU.y);outgoingLight=mix(outgoingLight,vec3(.93,.98,1.),flow*.55+.22*streak);outgoingLight+=vec3(.12,.16,.2)*(1.-mist);}
#include <opaque_fragment>`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => 'cascade_v1';
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
  const fullKey = `${cacheKey}_v2_${heightScale}_${swayScale}_${flutterScale}_${rainDroop}`;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uWd = WU.wind;
    shader.uniforms.uWindDir = WU.windDir;
    shader.uniforms.uRain = WU.rain;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uWT,uWd,uRain;uniform vec2 uWindDir;'
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
// Smooth root-anchored flex curve extending cleanly across tall trunks & crowns.
float h=clamp(position.y/${heightScale},0.,1.);
float k=h*h*(2.4-1.4*h);
float radial=clamp(length(position.xz)*1.45,0.,1.);
float t=uWT;
float windStrength=clamp(uWd,0.,4.);
float rainFac=clamp(uRain,0.,1.);
// Travelling world-space gust wave sweeps across groves & plains sequentially.
float gustWave=.64+.26*sin(dot(wp.xz,uWindDir)*.48-t*1.35+seed*.35)+.14*sin(t*.41+seed*1.2);
float slow=sin(t*.86+seed),mid=sin(t*1.78+seed*1.7+1.3);
float leafRipple=sin(t*3.9+wp.x*4.7+wp.z*5.3+wp.y*2.9);
float amp=.092*windStrength*k*gustWave*${swayScale};
float sway=(slow*.62+mid*.28)*amp;
float flutter=leafRipple*.024*windStrength*k*(.35+.65*radial)*mix(1.,.65,rainFac)*${flutterScale};
vec2 dir=uWindDir;
transformed.x+=dir.x*(sway+flutter)-dir.y*flutter*.65;
transformed.z+=dir.y*(sway+flutter)+dir.x*flutter*.65;
// Subtle canopy & grass blade droop under rain weight.
transformed.y-=rainFac*.042*k*${rainDroop};
}`
      );
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
    flutterScale: 0.75,
    rainDroop: 1.3,
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
