import * as THREE from 'three';

export const WU = {
  t: { value: 0 },
  sun: { value: 1 },
  sky: { value: new THREE.Color('#3b6490') },
  wind: { value: 1 },
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
    .replace('#include <common>', '#include <common>\nvarying vec3 vWD;uniform float uDY;')
    .replace(
      '#include <alphatest_fragment>',
      `#include <alphatest_fragment>
if(uDY<90.&&vWD.y>uDY&&dot(vWD.xz,vWD.xz)<110.&&vWD.y<14.)discard;diffuseColor.rgb+=vec3(1.,.75,.35)*smoothstep(uDY-.3,uDY,vWD.y)*step(vWD.y,uDY)*(uDY<90.?2.:0.);`
    );
}

let dissolveInstalled = false;

export function installDissolveShader(): void {
  if (dissolveInstalled) return;
  dissolveInstalled = true;

  THREE.Material.prototype.onBeforeCompile = function (shader) {
    if (
      (this as THREE.Material & { isSpriteMaterial?: boolean }).isSpriteMaterial ||
      (this as THREE.Material & { isPointsMaterial?: boolean }).isPointsMaterial ||
      (this as THREE.Material & { isLineBasicMaterial?: boolean }).isLineBasicMaterial
    ) {
      return;
    }
    applyDissolveToShader(shader);
  };
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
  softTextureCache = new THREE.CanvasTexture(c);
  return softTextureCache;
}

export function getStoneBumpTexture(): THREE.CanvasTexture {
  if (stoneBumpCache) return stoneBumpCache;
  const size = 128;
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
        const v = Math.max(0, Math.min(255, Math.round(128 + strata + grain + block)));
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
  stoneBumpCache = tex;
  return tex;
}

export function getPlasterBumpTexture(): THREE.CanvasTexture {
  if (plasterBumpCache) return plasterBumpCache;
  const size = 128;
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
  plasterBumpCache = tex;
  return tex;
}

let roofBumpCache: THREE.CanvasTexture | null = null;
let canvasBumpCache: THREE.CanvasTexture | null = null;
let brushedRoughCache: THREE.CanvasTexture | null = null;

export function getRoofBumpTexture(): THREE.CanvasTexture {
  if (roofBumpCache) return roofBumpCache;
  const size = 128;
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
  roofBumpCache = tex;
  return tex;
}

export function getCanvasBumpTexture(): THREE.CanvasTexture {
  if (canvasBumpCache) return canvasBumpCache;
  const size = 128;
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
  canvasBumpCache = tex;
  return tex;
}

export function getBrushedRoughnessTexture(): THREE.CanvasTexture {
  if (brushedRoughCache) return brushedRoughCache;
  const size = 128;
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
  brushedRoughCache = tex;
  return tex;
}

export function getWoodBumpTexture(): THREE.CanvasTexture {
  if (woodBumpCache) return woodBumpCache;
  const size = 128;
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
        '#include <common>\nvarying vec3 vW;uniform float uWT,uSI,uRN;uniform vec3 uSky;'
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
{vec2 q=vW.xz;float a=q.x*3.+uWT*1.4,b=q.y*2.4-uWT*1.15,c=(q.x+q.y)*5.+uWT*2.1;float rAmt=1.+uRN*.5;vec3 pn=vec3((cos(a)*.15+cos(c)*.1)*rAmt,0.,(cos(b)*.15+cos(c)*.1)*rAmt);normal=normalize(normal+(viewMatrix*vec4(pn,0.)).xyz*.72);}`
      )
      .replace(
        '#include <opaque_fragment>',
        `{float fr=pow(1.-max(dot(normalize(vViewPosition),normal),0.),2.8);outgoingLight=mix(outgoingLight,uSky,fr*.55);float sp=pow(max(0.,sin(vW.x*9.+uWT*3.)*sin(vW.z*8.-uWT*2.5)),14.);outgoingLight+=vec3(1.,.95,.82)*sp*.75*uSI;float foam=smoothstep(.88,1.,sin(length(vW.xz)*3.5-uWT*1.4)*.5+.5)*.12;outgoingLight+=vec3(.88,.96,1.)*foam;}
#include <opaque_fragment>`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => 'water_v2';
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

export function windy(
  mat: THREE.MeshStandardMaterial,
  cacheKey = 'wind'
): THREE.MeshStandardMaterial {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uWd = WU.wind;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWT,uWd;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{
#ifdef USE_INSTANCING
vec3 wp=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
#else
vec3 wp=(modelMatrix*vec4(transformed,1.)).xyz;
#endif
float k=max(position.y+.3,0.);transformed.x+=(sin(uWT*1.8+wp.x*.9+wp.z*.7)*.05+sin(uWT*7.+wp.x*5.)*.012)*uWd*k;transformed.z+=cos(uWT*1.5+wp.z*.8)*.035*uWd*k;}`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => cacheKey;
  return mat;
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
