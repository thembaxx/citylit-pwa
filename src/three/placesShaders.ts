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
    fogDensity: { value: 0.0065 },
  };
}

/**
 * High-detail geological slice terrain & striated cutaway wall material.
 * Uses vertex attribute `aTopY` so exposed cutaway sidewalls know exact depth below
 * the grass/sand rim: renders a dark topsoil/root overhang band, pebble pockets,
 * warped sedimentary rock strata, vertical cleavage fissures, and wet-weather sheen.
 */
export function createStrataTerrainMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.87,
    metalness: 0.04,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRN = WU.rain;
    shader.uniforms.uWT = WU.t;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aTopY;
varying vec3 vPlacePos;
varying vec3 vPlaceNorm;
varying float vTopY;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vPlacePos = position;
vPlaceNorm = normal;
vTopY = aTopY;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vPlacePos;
varying vec3 vPlaceNorm;
varying float vTopY;
uniform float uRN;
uniform float uWT;

float plHash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float plNoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = plHash2(i);
  float b = plHash2(i + vec2(1.0, 0.0));
  float c = plHash2(i + vec2(0.0, 1.0));
  float d = plHash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float plFbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * plNoise2(p);
    p = p * 2.04 + vec2(11.3, 7.1);
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

  if (isCutWall > 0.5) {
    float depthBelow = max(0.0, vTopY - vPlacePos.y);
    float warp = plFbm(vec2(horizCoord * 1.65, vPlacePos.y * 2.1)) * 0.24;
    float yLayer = vPlacePos.y + warp;

    // Coarse strata bands + fine laminated sedimentary lines + mineral seams
    float coarse = sin(yLayer * 12.5) * 0.5 + 0.5;
    float fine = sin(yLayer * 38.0 + horizCoord * 1.4) * 0.5 + 0.5;
    float quartzSeam = smoothstep(0.88, 0.99, sin(yLayer * 20.0 + 1.2 + plNoise2(vec2(horizCoord * 3.0, yLayer)) * 0.6));
    float rustSeam = smoothstep(0.82, 0.96, sin(yLayer * 9.5 + 3.8));
    float crack = smoothstep(0.88, 0.99, plNoise2(vec2(horizCoord * 6.8 + yLayer * 1.5, yLayer * 2.8)));
    float pebbles = smoothstep(0.68, 0.92, plNoise2(vec2(horizCoord * 18.0, vPlacePos.y * 22.0)));

    vec3 warmOchre = diffuseColor.rgb * vec3(1.18, 0.99, 0.82);
    vec3 darkShale = diffuseColor.rgb * vec3(0.43, 0.41, 0.40);
    vec3 paleQuartz = diffuseColor.rgb * vec3(1.30, 1.24, 1.12);
    vec3 ironRust = diffuseColor.rgb * vec3(1.24, 0.78, 0.52);

    vec3 strataCol = mix(darkShale, warmOchre, smoothstep(0.18, 0.84, coarse));
    strataCol = mix(strataCol, ironRust, rustSeam * 0.32);
    strataCol = mix(strataCol, paleQuartz, quartzSeam * 0.48);
    strataCol *= 0.83 + 0.28 * fine;
    strataCol = mix(strataCol, strataCol * 0.72, pebbles * 0.35);
    strataCol *= 1.0 - crack * 0.38;

    // Rich dark topsoil & hanging root shadow rim directly below the top cut edge
    float humusBand = 1.0 - smoothstep(0.015, 0.11, depthBelow);
    vec3 darkHumus = diffuseColor.rgb * vec3(0.38, 0.33, 0.25);
    strataCol = mix(strataCol, darkHumus, humusBand * 0.82);

    // Subtle bottom contact AO
    float baseAO = smoothstep(-0.04, 0.58, vPlacePos.y);
    strataCol *= 0.68 + 0.32 * baseAO;
    diffuseColor.rgb = strataCol;
  } else {
    // Multi-frequency top-surface micro-relief (grass tufts, pebbles, rock striations)
    float broad = plFbm(vPlacePos.xz * 3.8);
    float fine = plNoise2(vPlacePos.xz * 18.5);
    float micro = plNoise2(vPlacePos.xz * 42.0);
    float slopeHint = clamp(1.0 - vPlaceNorm.y, 0.0, 1.0);
    diffuseColor.rgb *= 0.89 + 0.19 * broad + (fine - 0.5) * 0.09 + (micro - 0.5) * 0.04;
    // Slight rocky striation darkening on steep exposed cliffs
    diffuseColor.rgb *= 1.0 - slopeHint * 0.14 * (1.0 - fine);
    // Rain slightly deepens terrain & enhances wet shoreline richness
    diffuseColor.rgb *= 1.0 - uRN * 0.15;
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
    float puddle = smoothstep(0.46, 0.72, plNoise2(vPlacePos.xz * 3.2)) * smoothstep(0.85, 0.98, vPlaceNorm.y);
    roughnessFactor = mix(roughnessFactor, 0.20, uRN * (0.45 + 0.55 * puddle));
  }
}`
      );
  };

  mat.customProgramCacheKey = () => 'places_strata_v2';
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
 * Fresnel sky reflection, sunlit wave glints, underwater caustics, rain ripples,
 * and layered breaking surf foam.
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
      uWind: WU.wind,
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
uniform float uWind;
varying float vDepth;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

void main() {
  vDepth = aDepth;
  vec3 pos = position;
  float edgeMask = smoothstep(0.018, 0.22, max(0.0, aDepth));
  float chop = 0.85 + 0.35 * uWind;
  float wave = sin(pos.x * 5.6 + uTime * 2.2) * 0.010
             + cos(pos.z * 6.4 - uTime * 1.85) * 0.009
             + sin((pos.x - pos.z) * 9.2 + uTime * 3.1) * 0.0045;
  pos.y += wave * uTurbulence * chop * edgeMask;
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
  float h = sin(p.x * 5.6 + t * 2.15) * 0.34
          + cos(p.y * 6.6 - t * 1.85) * 0.30
          + (wtNoise(p * 4.8 + vec2(t * 0.48, -t * 0.35)) - 0.5) * 0.44
          + (wtNoise(p * 11.2 - vec2(t * 0.62, t * 0.42)) - 0.5) * 0.20;
  h += uRain * 0.22 * sin(p.x * 24.0 + t * 12.0) * cos(p.y * 22.0 - t * 10.0);
  return h;
}

void main() {
  if (vDepth < -0.004) discard;
  float depth = max(0.0, vDepth);

  vec2 q = vWorldPos.xz;
  float eps = 0.028;
  float h = wtHeight(q, uTime);
  float hx = wtHeight(q + vec2(eps, 0.0), uTime);
  float hz = wtHeight(q + vec2(0.0, eps), uTime);
  vec3 N = normalize(vec3((h - hx) * 0.54 * uTurbulence, 1.0, (h - hz) * 0.54 * uTurbulence));
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSunDir);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.4);
  vec3 waterBody = mix(uShallow, uDeep, smoothstep(0.025, 0.52, depth));

  float nDotL = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 125.0) * (0.4 + 1.0 * uSun);

  vec3 col = waterBody * (0.50 + 0.62 * nDotL * (0.45 + 0.55 * uSun)) + waterBody * uSky * 0.24;
  col = mix(col, uSky * 1.08, fresnel * 0.55);
  col += uSunColor * spec * 1.55;

  // Dual-layer sunlit underwater caustics in clear turquoise shallows
  float c1 = wtNoise(q * 11.5 + vec2(uTime * 0.36, -uTime * 0.28));
  float c2 = wtNoise(q * 14.0 - vec2(uTime * 0.25, uTime * 0.34));
  float caustic = pow(c1 * c2 * 2.1, 2.2);
  col += uShallow * caustic * 0.28 * (1.0 - smoothstep(0.04, 0.54, depth)) * (0.42 + 0.58 * uSun);

  // Crisp rolling breaking surf lines + lacy coastal shore froth
  float surfPhase = fract(depth * 7.2 - uTime * 0.48 + wtNoise(q * 4.2) * 0.26);
  float surfRing = smoothstep(0.83, 0.96, surfPhase) * (1.0 - smoothstep(0.015, 0.26, depth));
  float shoreLip = (1.0 - smoothstep(0.0, 0.072, depth)) * (0.52 + 0.48 * wtNoise(q * 16.0 + uTime * 0.72));
  float lacyFoam = smoothstep(0.56, 0.78, h) * smoothstep(0.65, 0.92, wtNoise(q * 14.5 - uTime * 0.55)) * 0.36 * uTurbulence;
  float rainRipples = uRain * smoothstep(0.75, 0.95, sin(q.x * 32.0 + uTime * 14.0) * cos(q.y * 30.0 - uTime * 12.0)) * 0.22;
  float foam = clamp((surfRing * 0.78 + shoreLip * 0.95 + lacyFoam + rainRipples) * uFoamStrength, 0.0, 1.0);
  col = mix(col, mix(vec3(0.92, 0.97, 1.0), uSunColor, 0.12), foam);

  // Luminous crystal meniscus highlight along cutaway block perimeter
  float rim = smoothstep(1.44, 1.50, max(abs(vLocalPos.x), abs(vLocalPos.z)));
  col += mix(uShallow, vec3(0.72, 0.96, 1.0), 0.45) * rim * 0.30;

  float alpha = mix(0.42, 0.90, smoothstep(0.0, 0.54, depth) * (1.12 - uClarity * 0.35));
  alpha = clamp(max(alpha, foam * 0.94), 0.30, 0.96);

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
  float depthMix = 1.0 - vUv.y;
  vec3 col = mix(uShallow * 1.08, uDeep * 0.68, pow(depthMix, 0.72));
  float caustic = sin(vWorldPos.x * 10.0 + vWorldPos.z * 9.5 + uTime * 2.2) * 0.5 + 0.5;
  caustic *= sin(vUv.y * 18.0 - uTime * 1.5) * 0.5 + 0.5;
  col += uShallow * caustic * 0.26 * (0.4 + 0.6 * uSun) * vUv.y;

  float meniscus = smoothstep(0.91, 1.0, vUv.y);
  col = mix(col, mix(uSky, vec3(0.88, 0.98, 1.0), 0.7), meniscus * 0.72);

  float alpha = mix(0.52, 0.78, depthMix) * (1.10 - uClarity * 0.28);
  alpha = clamp(max(alpha, meniscus * 0.82), 0.36, 0.85);

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
 * Soft swirling mist/cloud/spray plume shader for localized slice weather effects:
 * Table Mountain tablecloth spill, Augrabies/Tugela waterfall spray, coastal surf mist, etc.
 */
export function createSliceMistMaterial(
  env: PlacesShaderEnvironment,
  tintHex = '#eef6fc',
  opacity = 0.52
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: WU.t,
      uWind: WU.wind,
      uSun: WU.sun,
      uLit: WU.lit,
      uTint: { value: new THREE.Color(tintHex) },
      uFogColor: env.fogColor,
      uOpacity: { value: opacity },
    },
    vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `
uniform float uTime;
uniform float uWind;
uniform float uSun;
uniform float uLit;
uniform vec3 uTint;
uniform vec3 uFogColor;
uniform float uOpacity;
varying vec2 vUv;

float mHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float mNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mHash(i), mHash(i + vec2(1.0, 0.0)), f.x),
    mix(mHash(i + vec2(0.0, 1.0)), mHash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
float mFbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * mNoise(p);
    p = p * 2.05 + vec2(5.1, 3.7);
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  float radial = 1.0 - smoothstep(0.22, 1.0, r);
  float spd = 0.14 + uWind * 0.08;
  vec2 uvDrift = vUv * 3.8 + vec2(uTime * spd, -uTime * 0.09);
  float wisp = smoothstep(0.28, 0.78, mFbm(uvDrift));
  float alpha = radial * wisp * uOpacity;
  if (alpha < 0.01) discard;
  vec3 nightCol = mix(uTint, vec3(0.22, 0.28, 0.42), clamp(uLit, 0.0, 1.0) * 0.72);
  vec3 warmCol = mix(nightCol, vec3(1.0, 0.84, 0.68), (1.0 - uSun) * (1.0 - uLit) * 0.42);
  gl_FragColor = vec4(warmCol, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

let orlandoMuralTexCache: THREE.CanvasTexture | null = null;

/**
 * Rich painted Soweto mural texture inspired by the Orlando Towers reference slice.
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
    // Rich upper turquoise sky, warm golden midsection, terracotta base
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#2ea9c4');
    bg.addColorStop(0.22, '#4cc4d4');
    bg.addColorStop(0.55, '#f2c14e');
    bg.addColorStop(0.84, '#df6d34');
    bg.addColorStop(1, '#5f5b55');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Top geometric rim trim
    ctx.fillStyle = '#1f6e5c';
    ctx.fillRect(0, 0, w, 16);
    ctx.fillStyle = '#f6d55c';
    for (let x = 8; x < w; x += 24) {
      ctx.beginPath();
      ctx.arc(x, 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bold painted Soweto motifs, sunbursts & sweeping arches
    const colors = ['#1e4260', '#e85d3f', '#f6d55c', '#3caea3', '#f4f1de', '#ed553b', '#266d5b'];
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      const cx = (i * 37 + 16) % w;
      const cy = 62 + ((i * 41) % 126);
      const r = 16 + (i % 4) * 13;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#141a24';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    // Bold flowing curves across mid-band
    ctx.strokeStyle = '#141a24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y = h * 0.56 + Math.sin(x * 0.049) * 28 + Math.cos(x * 0.024) * 14;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Base concrete band + dark strut triangle shadow band
    ctx.fillStyle = '#5c5852';
    ctx.fillRect(0, h - 24, w, 24);
    ctx.strokeStyle = '#24221e';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 9, h - 22);
      ctx.lineTo(x + 18, h);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  orlandoMuralTexCache = tex;
  return tex;
}

export function createSliceCloudMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#f6f9ff',
    roughness: 0.96,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
  });
}
