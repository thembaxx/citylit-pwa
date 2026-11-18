import * as THREE from 'three';
import { WU } from './shaders';

export interface PlacesShaderEnvironment {
  sunDir: { value: THREE.Vector3 };
  sunColor: { value: THREE.Color };
  fogColor: { value: THREE.Color };
  fogDensity: { value: number };
}

export function createPlacesShaderEnv(): PlacesShaderEnvironment {
  return {
    sunDir: { value: new THREE.Vector3(0.45, 0.78, 0.42).normalize() },
    sunColor: { value: new THREE.Color('#fff2d6') },
    fogColor: { value: new THREE.Color('#161b26') },
    fogDensity: { value: 0.008 },
  };
}

/**
 * Geological slice terrain & striated cutaway wall material.
 * Preserves full Three.js PBR lighting, real shadows, FogExp2, and PMREM reflections,
 * while rendering procedural sedimentary strata, cleavage cracks, topsoil rims, and
 * rain-wetness sheen across every diorama block.
 */
export function createStrataTerrainMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.04,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRN = WU.rain;
    shader.uniforms.uWT = WU.t;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vPlacePos;
varying vec3 vPlaceNorm;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vPlacePos = position;
vPlaceNorm = normal;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vPlacePos;
varying vec3 vPlaceNorm;
uniform float uRN;
uniform float uWT;

float plHash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}
float plNoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float plFbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * plNoise2(p);
    p = p * 2.05 + vec2(11.3, 7.1);
    a *= 0.5;
  }
  return s;
}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
{
  float absX = abs(vPlacePos.x);
  float absZ = abs(vPlacePos.z);
  float isCutWall = step(0.45, 1.0 - abs(vPlaceNorm.y)) * step(1.42, max(absX, absZ));
  float horizCoord = (absX > absZ ? vPlacePos.z : vPlacePos.x);

  // Horizontal sedimentary geological strata & fracture seams on exposed slice sides
  if (isCutWall > 0.5) {
    float warp = plFbm(vec2(horizCoord * 1.45, vPlacePos.y * 1.9)) * 0.24;
    float yLayer = vPlacePos.y + warp;
    float bands = sin(yLayer * 14.0) * 0.5 + 0.5;
    float fineBands = sin(yLayer * 34.0 + horizCoord * 1.2) * 0.5 + 0.5;
    float seam = smoothstep(0.86, 0.98, sin(yLayer * 18.0 + 1.4));
    float crack = smoothstep(0.91, 0.99, plNoise2(vec2(horizCoord * 5.8 + yLayer * 1.3, yLayer * 2.4)));

    vec3 warmOchre = diffuseColor.rgb * vec3(1.16, 0.98, 0.84);
    vec3 darkShale = diffuseColor.rgb * vec3(0.46, 0.44, 0.43);
    vec3 paleQuartz = diffuseColor.rgb * vec3(1.24, 1.18, 1.08);

    vec3 strataCol = mix(darkShale, warmOchre, smoothstep(0.2, 0.82, bands));
    strataCol = mix(strataCol, paleQuartz, seam * 0.48);
    strataCol *= 0.84 + 0.28 * fineBands;
    strataCol *= 1.0 - crack * 0.34;

    // Dark rich topsoil & root lip right near upper cut edge + deep bottom AO
    float baseAO = smoothstep(-0.08, 0.55, vPlacePos.y);
    strataCol *= 0.72 + 0.28 * baseAO;
    diffuseColor.rgb = strataCol;
  } else {
    // Organic top-surface grain, micro-moss speckles, and subtle crevice contrast
    float grain = plFbm(vPlacePos.xz * 4.4);
    float fine = plNoise2(vPlacePos.xz * 19.0);
    diffuseColor.rgb *= 0.91 + 0.17 * grain + (fine - 0.5) * 0.07;
    // Rain slightly deepens terrain colors
    diffuseColor.rgb *= 1.0 - uRN * 0.14;
  }
}`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
{
  float absX = abs(vPlacePos.x);
  float absZ = abs(vPlacePos.z);
  float isCutWall = step(0.45, 1.0 - abs(vPlaceNorm.y)) * step(1.42, max(absX, absZ));
  if (isCutWall < 0.5) {
    roughnessFactor = mix(roughnessFactor, 0.26, uRN * 0.68);
  }
}`
      );
  };

  mat.customProgramCacheKey = () => 'places_strata_v1';
  return mat;
}

export interface CutawayWaterOptions {
  shallowColor: string;
  deepColor: string;
  foamStrength?: number;
  turbulence?: number;
  clarity?: number;
}

/**
 * Animated cutaway water surface shader with Beer-Lambert depth absorption,
 * Fresnel sky reflection, sunlit wave glints, rain ripples, and shoreline surf foam.
 */
export function createCutawayWaterTopMaterial(
  env: PlacesShaderEnvironment,
  opts: CutawayWaterOptions
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: WU.t,
      uSun: WU.sun,
      uSky: WU.sky,
      uRain: WU.rain,
      uSunDir: env.sunDir,
      uSunColor: env.sunColor,
      uFogColor: env.fogColor,
      uFogDensity: { value: env.fogDensity.value },
      uShallow: { value: new THREE.Color(opts.shallowColor) },
      uDeep: { value: new THREE.Color(opts.deepColor) },
      uFoamStrength: { value: opts.foamStrength ?? 1.0 },
      uTurbulence: { value: opts.turbulence ?? 1.0 },
      uClarity: { value: opts.clarity ?? 0.78 },
    },
    vertexShader: `
attribute float aDepth;
uniform float uTime;
uniform float uTurbulence;
varying float vDepth;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

void main() {
  vDepth = aDepth;
  vec3 pos = position;
  float edgeMask = smoothstep(0.02, 0.25, max(0.0, aDepth));
  float wave = sin(pos.x * 5.2 + uTime * 2.1) * 0.009
             + cos(pos.z * 6.1 - uTime * 1.75) * 0.008
             + sin((pos.x + pos.z) * 8.4 + uTime * 2.9) * 0.004;
  pos.y += wave * uTurbulence * edgeMask;
  vLocalPos = pos;
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: `
uniform float uTime;
uniform float uSun;
uniform float uRain;
uniform float uFoamStrength;
uniform float uTurbulence;
uniform float uClarity;
uniform vec3 uSky;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uShallow;
uniform vec3 uDeep;

varying float vDepth;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

float wtHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float wtNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(wtHash(i), wtHash(i + vec2(1.0, 0.0)), f.x),
    mix(wtHash(i + vec2(0.0, 1.0)), wtHash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
float wtHeight(vec2 p, float t) {
  float h = sin(p.x * 5.4 + t * 2.1) * 0.35
          + cos(p.y * 6.3 - t * 1.8) * 0.30
          + (wtNoise(p * 4.5 + vec2(t * 0.45, -t * 0.32)) - 0.5) * 0.42;
  h += uRain * 0.18 * sin(p.x * 22.0 + t * 11.0) * cos(p.y * 20.0 - t * 9.0);
  return h;
}

void main() {
  if (vDepth < -0.004) discard;
  float depth = max(0.0, vDepth);

  vec2 q = vWorldPos.xz;
  float eps = 0.032;
  float h = wtHeight(q, uTime);
  float hx = wtHeight(q + vec2(eps, 0.0), uTime);
  float hz = wtHeight(q + vec2(0.0, eps), uTime);
  vec3 N = normalize(vec3((h - hx) * 0.5 * uTurbulence, 1.0, (h - hz) * 0.5 * uTurbulence));
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSunDir);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.6);
  vec3 waterBody = mix(uShallow, uDeep, smoothstep(0.03, 0.58, depth));

  // Diffuse + sky bounce + crisp sunlit wave sparkle
  float nDotL = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 110.0) * (0.35 + 0.95 * uSun);

  vec3 col = waterBody * (0.48 + 0.60 * nDotL * (0.45 + 0.55 * uSun)) + waterBody * uSky * 0.25;
  col = mix(col, uSky * 1.06, fresnel * 0.56);
  col += uSunColor * spec * 1.45;

  // Crisp shallow caustics + animated breaking shoreline surf rings (never big blotches)
  float caustic = pow(wtNoise(q * 11.5 + vec2(uTime * 0.35, -uTime * 0.28)), 3.0);
  col += uShallow * caustic * 0.22 * (1.0 - smoothstep(0.05, 0.55, depth)) * (0.4 + 0.6 * uSun);

  float surfPhase = fract(depth * 6.5 - uTime * 0.45 + wtNoise(q * 3.8) * 0.25);
  float surfRing = smoothstep(0.84, 0.96, surfPhase) * (1.0 - smoothstep(0.015, 0.22, depth));
  float shoreLip = (1.0 - smoothstep(0.0, 0.065, depth)) * (0.55 + 0.45 * wtNoise(q * 14.0 + uTime * 0.7));
  float fineWhitecap = smoothstep(0.58, 0.76, h) * smoothstep(0.68, 0.94, wtNoise(q * 13.0 - uTime * 0.5)) * 0.32 * uTurbulence;
  float foam = clamp((surfRing * 0.75 + shoreLip * 0.92 + fineWhitecap) * uFoamStrength, 0.0, 1.0);
  col = mix(col, mix(vec3(0.90, 0.96, 1.0), uSunColor, 0.14), foam);

  // Subtle perimeter meniscus highlight on cutaway slice edges
  float rim = smoothstep(1.44, 1.50, max(abs(vLocalPos.x), abs(vLocalPos.z)));
  col += vec3(0.36, 0.74, 0.88) * rim * 0.24;

  float alpha = mix(0.42, 0.89, smoothstep(0.0, 0.55, depth) * (1.12 - uClarity * 0.34));
  alpha = clamp(max(alpha, foam * 0.92), 0.30, 0.95);

  float dist = length(cameraPosition - vWorldPos);
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

/**
 * Translucent cutaway water cross-section sidewall shader.
 * Renders the gem-like vertical ocean/lagoon/cavern edge pane revealing submerged rocks & seabed.
 */
export function createCutawayWaterWallMaterial(
  env: PlacesShaderEnvironment,
  opts: CutawayWaterOptions
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: WU.t,
      uSun: WU.sun,
      uSky: WU.sky,
      uFogColor: env.fogColor,
      uFogDensity: { value: env.fogDensity.value },
      uShallow: { value: new THREE.Color(opts.shallowColor) },
      uDeep: { value: new THREE.Color(opts.deepColor) },
      uClarity: { value: opts.clarity ?? 0.78 },
    },
    vertexShader: `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: `
uniform float uTime;
uniform float uSun;
uniform vec3 uSky;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform float uClarity;

varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  // vUv.y = 1 at water surface, 0 at seabed contact
  float depthMix = 1.0 - vUv.y;
  vec3 col = mix(uShallow * 1.05, uDeep * 0.72, pow(depthMix, 0.75));
  // Animated subsurface caustic shimmer
  float caustic = sin(vWorldPos.x * 9.0 + vWorldPos.z * 9.0 + uTime * 2.2) * 0.5 + 0.5;
  caustic *= sin(vUv.y * 16.0 - uTime * 1.4) * 0.5 + 0.5;
  col += uShallow * caustic * 0.24 * (0.4 + 0.6 * uSun) * vUv.y;

  // Bright cyan-white meniscus line right along top water slice edge
  float meniscus = smoothstep(0.92, 1.0, vUv.y);
  col = mix(col, mix(uSky, vec3(0.86, 0.97, 1.0), 0.65), meniscus * 0.65);

  float alpha = mix(0.54, 0.80, depthMix) * (1.12 - uClarity * 0.28);
  alpha = clamp(max(alpha, meniscus * 0.78), 0.38, 0.86);

  float dist = length(cameraPosition - vWorldPos);
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

let orlandoMuralTexCache: THREE.CanvasTexture | null = null;

/**
 * Procedural colorful Soweto mural texture inspired by Orlando Towers.
 */
export function getOrlandoMuralTexture(): THREE.CanvasTexture {
  if (orlandoMuralTexCache) return orlandoMuralTexCache;
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Sky-turquoise cooling tower upper gradient + warm ochre base
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#36b2c9');
    bg.addColorStop(0.55, '#f2c14e');
    bg.addColorStop(1, '#d96b38');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Bold painted Soweto geometric arches, sunbursts & silhouettes
    const colors = ['#1e3f5a', '#e85d3f', '#f6d55c', '#3caea3', '#f4f1de', '#ed553b'];
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      const cx = (i * 41 + 18) % w;
      const cy = 60 + ((i * 37) % 130);
      const r = 18 + (i % 4) * 14;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#18202c';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Painterly flowing waves across the mid-band
    ctx.strokeStyle = '#141a24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = h * 0.56 + Math.sin(x * 0.045) * 26 + Math.cos(x * 0.02) * 12;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Base concrete band
    ctx.fillStyle = '#5f5b55';
    ctx.fillRect(0, h - 22, w, 22);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  orlandoMuralTexCache = tex;
  return tex;
}

export function createSliceCloudMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: '#f6f9ff',
    roughness: 0.96,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
  });
  return mat;
}
