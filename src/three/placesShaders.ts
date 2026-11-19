import * as THREE from 'three';
import { WU } from './shaders';

export interface PlacesSliceEmitterSpec {
  landmarkName: string;
  gridPos: readonly [number, number];
}

export interface PlacesShaderEnvironment {
  sunDir: { value: THREE.Vector3 };
  sunColor: { value: THREE.Color };
  fogColor: { value: THREE.Color };
  fogDensity: { value: number };
  volFogDeepColor: { value: THREE.Color };
  volFogDensity: { value: number };
  focusPos: { value: THREE.Vector3 };
  focusClear: { value: number };
  camDist: { value: number };
  rainIntensity: { value: number };
  snowIntensity: { value: number };
  alpineAmbientSnow: { value: number };
  windStrength: { value: number };
  pixelRatio: { value: number };
  activeSliceIndex: { value: number };
}

export function createPlacesShaderEnv(): PlacesShaderEnvironment {
  return {
    sunDir: { value: new THREE.Vector3(0.45, 0.78, 0.42).normalize() },
    sunColor: { value: new THREE.Color('#fff2d6') },
    fogColor: { value: new THREE.Color('#243044') },
    fogDensity: { value: 0.0095 },
    volFogDeepColor: { value: new THREE.Color('#131b2b') },
    volFogDensity: { value: 0.012 },
    focusPos: { value: new THREE.Vector3(0.0, 0.72, 0.0) },
    focusClear: { value: 0.65 },
    camDist: { value: 8.2 },
    rainIntensity: { value: 0.0 },
    snowIntensity: { value: 0.0 },
    alpineAmbientSnow: { value: 0.35 },
    windStrength: { value: 0.65 },
    pixelRatio: { value: 1.0 },
    activeSliceIndex: { value: 0 },
  };
}

/**
 * Analytical depth- and height-stratified volumetric fog shader snippet with Mie
 * directional sun in-scattering, ray wisp modulation, and focus-zone clarity.
 * Operates in linear HDR space right before tonemapping/colorspace conversion.
 */
export const PLACES_VOLUMETRIC_FOG_GLSL = /* glsl */ `
uniform vec3 uVolSunDir;
uniform vec3 uVolSunColor;
uniform vec3 uVolFogColor;
uniform vec3 uVolFogDeepColor;
uniform float uVolFogDensity;
uniform vec3 uVolFocusPos;
uniform float uVolFocusClear;
uniform float uVolCamDist;
uniform float uVolSun;
uniform float uVolTime;

vec3 plApplyVolumetricFog(vec3 sceneRgb, vec3 worldPos) {
  vec3 rayVec = worldPos - cameraPosition;
  float dist = length(rayVec);
  vec3 viewDir = rayVec / max(dist, 0.0001);

  // Adaptive near clear distance keeps the hero geological slice sharp at close range
  float nearClear = max(4.2, uVolCamDist * 0.74);
  float effDist = max(0.0, dist - nearClear);

  // Analytical exponential height-fog ray integral above slice datum (y = -0.35)
  float y0 = -0.35;
  float falloff = 0.25;
  float camH = cameraPosition.y - y0;
  float fragH = worldPos.y - y0;
  float dH = (fragH - camH) * falloff;
  float heightIntegral;
  if (abs(dH) > 0.001) {
    heightIntegral =
      (exp(-clamp(camH * falloff, -2.0, 8.0)) - exp(-clamp(fragH * falloff, -2.0, 8.0))) / dH;
  } else {
    heightIntegral = exp(-clamp(camH * falloff, -2.0, 8.0));
  }
  heightIntegral = clamp(heightIntegral, 0.16, 2.2);

  // Gentle depth separation ramp across distant ridges & mist plumes
  float farRamp = smoothstep(nearClear * 0.92, nearClear + 22.0, dist);
  float rayWisp = 0.88 + 0.12 * sin(worldPos.x * 0.42 + uVolTime * 0.20)
                       * cos(worldPos.z * 0.38 - uVolTime * 0.16);
  float opticalDepth =
    effDist * uVolFogDensity * (0.52 + 0.85 * heightIntegral) * rayWisp
    + farRamp * uVolFogDensity * 6.5;

  // Preserve silhouette clarity across the centered slice
  float focusDist = length(worldPos.xz - uVolFocusPos.xz);
  float focusLens = mix(1.0, smoothstep(1.35, 4.2, focusDist), clamp(uVolFocusClear, 0.0, 1.0) * 0.88);

  float fogAmount = clamp((1.0 - exp(-opticalDepth)) * focusLens, 0.0, 0.86);

  // Altitude-stratified haze color + forward-scattered Mie solar glow
  float altMix = smoothstep(-0.3, 2.8, worldPos.y);
  vec3 hazeCol = mix(uVolFogDeepColor, uVolFogColor, altMix);
  float sunCos = max(dot(viewDir, normalize(uVolSunDir)), 0.0);
  float mie = pow(sunCos, 5.0) * 0.36 + pow(sunCos, 16.0) * 0.28;
  vec3 scattered = hazeCol + uVolSunColor * mie * (0.30 + 0.70 * uVolSun);

  return mix(sceneRgb, scattered, fogAmount);
}
`;

function bindVolumetricFogUniforms(
  uniforms: Record<string, THREE.IUniform>,
  env: PlacesShaderEnvironment
): void {
  uniforms.uVolSunDir = env.sunDir;
  uniforms.uVolSunColor = env.sunColor;
  uniforms.uVolFogColor = env.fogColor;
  uniforms.uVolFogDeepColor = env.volFogDeepColor;
  uniforms.uVolFogDensity = env.volFogDensity;
  uniforms.uVolFocusPos = env.focusPos;
  uniforms.uVolFocusClear = env.focusClear;
  uniforms.uVolCamDist = env.camDist;
  uniforms.uVolSun = WU.sun;
  uniforms.uVolTime = WU.t;
}

/**
 * Patches any Places MeshStandardMaterial (including InstancedMesh materials) with
 * linear-space depth-based volumetric fog while bypassing CitylitEngine's hero dissolve hook.
 */
export function patchPlacesVolumetricFog<T extends THREE.Material>(
  mat: T,
  env: PlacesShaderEnvironment
): T {
  const matWithFog = mat as T & { fog?: boolean };
  if ('fog' in matWithFog) {
    matWithFog.fog = false;
  }
  const prevKey = mat.customProgramCacheKey?.() ?? 'std';
  mat.customProgramCacheKey = () => `${prevKey}_places_vfog_v1`;
  mat.onBeforeCompile = (shader) => {
    bindVolumetricFogUniforms(shader.uniforms, env);

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vVolFogWPos;`
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
vec4 plFogWp = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  plFogWp = instanceMatrix * plFogWp;
#endif
plFogWp = modelMatrix * plFogWp;
vVolFogWPos = plFogWp.xyz;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vVolFogWPos;
${PLACES_VOLUMETRIC_FOG_GLSL}`
      )
      .replace(
        '#include <tonemapping_fragment>',
        `gl_FragColor.rgb = plApplyVolumetricFog(gl_FragColor.rgb, vVolFogWPos);
#include <tonemapping_fragment>`
      );
  };
  return mat;
}

/**
 * High-detail geological slice terrain & striated cutaway wall material.
 * Uses vertex attribute `aTopY` so exposed cutaway sidewalls know exact depth below
 * the grass/sand rim: renders a dark topsoil/root overhang band, pebble pockets,
 * warped sedimentary rock strata, vertical cleavage fissures, wet-weather sheen,
 * and depth-based volumetric haze.
 */
export function createStrataTerrainMaterial(
  env: PlacesShaderEnvironment
): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.87,
    metalness: 0.04,
    fog: false,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRN = WU.rain;
    shader.uniforms.uWT = WU.t;
    bindVolumetricFogUniforms(shader.uniforms, env);

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aTopY;
varying vec3 vPlacePos;
varying vec3 vPlaceNorm;
varying float vTopY;
varying vec3 vVolFogWPos;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vPlacePos = position;
vPlaceNorm = normal;
vTopY = aTopY;`
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
vVolFogWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vPlacePos;
varying vec3 vPlaceNorm;
varying float vTopY;
varying vec3 vVolFogWPos;
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
}
${PLACES_VOLUMETRIC_FOG_GLSL}`
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
      )
      .replace(
        '#include <tonemapping_fragment>',
        `gl_FragColor.rgb = plApplyVolumetricFog(gl_FragColor.rgb, vVolFogWPos);
#include <tonemapping_fragment>`
      );
  };

  mat.customProgramCacheKey = () => 'places_strata_vfog_v3';
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
 * layered breaking surf foam, and volumetric archipelago fog.
 */
export function createCutawayWaterTopMaterial(
  env: PlacesShaderEnvironment,
  opts: CutawayWaterOptions
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    uniforms: {
      uTime: WU.t,
      uSun: WU.sun,
      uSky: WU.sky,
      uRain: WU.rain,
      uWind: WU.wind,
      uSunDir: env.sunDir,
      uSunColor: env.sunColor,
      uShallow: { value: new THREE.Color(opts.shallowColor) },
      uDeep: { value: new THREE.Color(opts.deepColor) },
      uFoamStrength: { value: opts.foamStrength ?? 1.0 },
      uTurbulence: { value: opts.turbulence ?? 1.0 },
      uClarity: { value: opts.clarity ?? 0.78 },
      uVolSunDir: env.sunDir,
      uVolSunColor: env.sunColor,
      uVolFogColor: env.fogColor,
      uVolFogDeepColor: env.volFogDeepColor,
      uVolFogDensity: env.volFogDensity,
      uVolFocusPos: env.focusPos,
      uVolFocusClear: env.focusClear,
      uVolCamDist: env.camDist,
      uVolSun: WU.sun,
      uVolTime: WU.t,
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
${PLACES_VOLUMETRIC_FOG_GLSL}

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

  col = plApplyVolumetricFog(col, vWorldPos);

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
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    uniforms: {
      uTime: WU.t,
      uSun: WU.sun,
      uSky: WU.sky,
      uShallow: { value: new THREE.Color(opts.shallowColor) },
      uDeep: { value: new THREE.Color(opts.deepColor) },
      uClarity: { value: opts.clarity ?? 0.78 },
      uVolSunDir: env.sunDir,
      uVolSunColor: env.sunColor,
      uVolFogColor: env.fogColor,
      uVolFogDeepColor: env.volFogDeepColor,
      uVolFogDensity: env.volFogDensity,
      uVolFocusPos: env.focusPos,
      uVolFocusClear: env.focusClear,
      uVolCamDist: env.camDist,
      uVolSun: WU.sun,
      uVolTime: WU.t,
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
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform float uClarity;

varying vec2 vUv;
varying vec3 vWorldPos;
${PLACES_VOLUMETRIC_FOG_GLSL}

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

  col = plApplyVolumetricFog(col, vWorldPos);

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
      uOpacity: { value: opacity },
      uVolSunDir: env.sunDir,
      uVolSunColor: env.sunColor,
      uVolFogColor: env.fogColor,
      uVolFogDeepColor: env.volFogDeepColor,
      uVolFogDensity: env.volFogDensity,
      uVolFocusPos: env.focusPos,
      uVolFocusClear: env.focusClear,
      uVolCamDist: env.camDist,
      uVolSun: WU.sun,
      uVolTime: WU.t,
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
uniform float uWind;
uniform float uSun;
uniform float uLit;
uniform vec3 uTint;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vWorldPos;

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
${PLACES_VOLUMETRIC_FOG_GLSL}

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
  warmCol = plApplyVolumetricFog(warmCol, vWorldPos);
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

export function createSliceCloudMaterial(env: PlacesShaderEnvironment): THREE.MeshStandardMaterial {
  return patchPlacesVolumetricFog(
    new THREE.MeshStandardMaterial({
      color: '#f6f9ff',
      roughness: 0.96,
      metalness: 0.0,
      transparent: false,
    }),
    env
  );
}

/**
 * Single-draw-call non-intersecting base mist halo sitting cleanly beneath the centered slice
 * (y <= -0.07) so atmospheric drift never intersects water walls or flips transparent draw order.
 */
export function createPlacesVolumetricFogLayer(env: PlacesShaderEnvironment): {
  mesh: THREE.Mesh;
  dispose: () => void;
} {
  const geo = new THREE.RingGeometry(1.75, 11.5, 64, 4);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: WU.t,
      uWind: env.windStrength,
      uSun: WU.sun,
      uSunDir: env.sunDir,
      uSunColor: env.sunColor,
      uFogColor: env.fogColor,
      uFogDeepColor: env.volFogDeepColor,
      uFogDensity: env.volFogDensity,
    },
    vertexShader: `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: `
uniform float uTime;
uniform float uWind;
uniform float uSun;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uFogColor;
uniform vec3 uFogDeepColor;
uniform float uFogDensity;

varying vec3 vWorldPos;

float vfHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float vfNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(vfHash(i), vfHash(i + vec2(1.0, 0.0)), f.x),
    mix(vfHash(i + vec2(0.0, 1.0)), vfHash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
float vfFbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * vfNoise(p);
    p = p * 2.03 + vec2(9.2, 6.7);
    a *= 0.5;
  }
  return s;
}

void main() {
  vec3 rayVec = vWorldPos - cameraPosition;
  float dist = length(rayVec);
  vec3 viewDir = rayVec / max(dist, 0.0001);

  float densityNorm = clamp((uFogDensity - 0.006) / 0.028, 0.14, 1.5);
  vec2 drift = vec2(uTime * (0.14 + 0.08 * uWind), -uTime * 0.06);
  float bank = smoothstep(0.24, 0.80, vfFbm(vWorldPos.xz * 0.22 + drift));

  float radial = length(vWorldPos.xz);
  float innerFade = smoothstep(1.9, 3.2, radial);
  float outerFade = 1.0 - smoothstep(5.8, 11.4, radial);
  float alpha = bank * innerFade * outerFade * 0.22 * densityNorm;
  if (alpha < 0.005) discard;

  vec3 baseCol = mix(uFogDeepColor, uFogColor, 0.55);
  float sunCos = max(dot(viewDir, normalize(uSunDir)), 0.0);
  float mie = pow(sunCos, 5.0) * 0.38 + pow(sunCos, 16.0) * 0.26;
  vec3 col = baseCol + uSunColor * mie * (0.35 + 0.65 * uSun);

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.42));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -0.09;
  mesh.renderOrder = 0;
  mesh.frustumCulled = false;

  return {
    mesh,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

/**
 * Single-draw-call GPU weather particle system for the Places archipelago:
 * 1) Localized alpine snowfall with gust swirl over Sani Pass, Drakensberg & Golden Gate.
 * 2) Localized coastal/waterfall rain & mist droplets over wild-coast & gorge slices.
 * 3) Focus-following archipelago rain/snow storm dome driven by live weather or preview mode.
 */
export function createPlacesWeatherParticles(
  specs: readonly PlacesSliceEmitterSpec[],
  env: PlacesShaderEnvironment
): {
  points: THREE.Points;
  dispose: () => void;
} {
  const snowSlices = new Set(['Sani Pass', 'Drakensberg Amphitheatre', 'Golden Gate Highlands']);
  const wetSlices = new Set([
    'Cape Point Lighthouse',
    'Storms River Mouth',
    'Hole in the Wall',
    'Knysna Heads',
    'Augrabies Falls',
    'Table Mountain',
  ]);

  const SNOW_PER_SLICE = 160;
  const RAIN_PER_SLICE = 90;
  const GLOBAL_COUNT = 520;

  let localCount = 0;
  for (const s of specs) {
    if (snowSlices.has(s.landmarkName)) localCount += SNOW_PER_SLICE;
    if (wetSlices.has(s.landmarkName)) localCount += RAIN_PER_SLICE;
  }

  const totalCount = localCount + GLOBAL_COUNT;
  const positions = new Float32Array(totalCount * 3);
  const sliceIdxArr = new Float32Array(totalCount);
  const isGlobalArr = new Float32Array(totalCount);
  const typeArr = new Float32Array(totalCount);
  const seedArr = new Float32Array(totalCount);

  // Deterministic pseudo-random generator for clean, reproducible particle layouts
  let rng = 1337421;
  const nextRand = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 4294967296;
  };

  let idx = 0;
  const pushParticle = (
    lx: number,
    ly: number,
    lz: number,
    sliceIdx: number,
    isGlobal: number,
    pType: number
  ) => {
    const i3 = idx * 3;
    positions[i3] = lx;
    positions[i3 + 1] = ly;
    positions[i3 + 2] = lz;
    sliceIdxArr[idx] = sliceIdx;
    isGlobalArr[idx] = isGlobal;
    typeArr[idx] = pType;
    seedArr[idx] = nextRand();
    idx++;
  };

  for (let sIdx = 0; sIdx < specs.length; sIdx++) {
    const s = specs[sIdx];
    if (snowSlices.has(s.landmarkName)) {
      for (let i = 0; i < SNOW_PER_SLICE; i++) {
        pushParticle(
          (nextRand() - 0.5) * 3.8,
          0.15 + nextRand() * 3.8,
          (nextRand() - 0.5) * 3.8,
          sIdx,
          0.0,
          0.0 // Snow
        );
      }
    }
    if (wetSlices.has(s.landmarkName)) {
      for (let i = 0; i < RAIN_PER_SLICE; i++) {
        pushParticle(
          (nextRand() - 0.5) * 3.8,
          0.05 + nextRand() * 4.0,
          (nextRand() - 0.5) * 3.8,
          sIdx,
          0.0,
          1.0 // Rain/Spray
        );
      }
    }
  }

  for (let i = 0; i < GLOBAL_COUNT; i++) {
    pushParticle(
      (nextRand() - 0.5) * 8.6,
      nextRand() * 5.6,
      (nextRand() - 0.5) * 8.6,
      -1.0,
      1.0,
      1.0
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSliceIdx', new THREE.BufferAttribute(sliceIdxArr, 1));
  geo.setAttribute('aIsGlobal', new THREE.BufferAttribute(isGlobalArr, 1));
  geo.setAttribute('aType', new THREE.BufferAttribute(typeArr, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seedArr, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: WU.t,
      uWind: env.windStrength,
      uRainIntensity: env.rainIntensity,
      uSnowIntensity: env.snowIntensity,
      uAlpineAmbientSnow: env.alpineAmbientSnow,
      uPixelRatio: env.pixelRatio,
      uActiveSliceIdx: env.activeSliceIndex,
      uSun: WU.sun,
      uSky: WU.sky,
      uVolSunDir: env.sunDir,
      uVolSunColor: env.sunColor,
      uVolFogColor: env.fogColor,
      uVolFogDeepColor: env.volFogDeepColor,
      uVolFogDensity: env.volFogDensity,
      uVolFocusPos: env.focusPos,
      uVolFocusClear: env.focusClear,
      uVolCamDist: env.camDist,
      uVolSun: WU.sun,
      uVolTime: WU.t,
    },
    vertexShader: `
attribute float aSliceIdx;
attribute float aIsGlobal;
attribute float aType;
attribute float aSeed;

uniform float uTime;
uniform float uWind;
uniform float uRainIntensity;
uniform float uSnowIntensity;
uniform float uAlpineAmbientSnow;
uniform float uPixelRatio;
uniform float uActiveSliceIdx;

varying float vIsSnow;
varying float vAlpha;
varying float vSeed;
varying float vStreakAngle;
varying vec3 vWorldPos;

void main() {
  vSeed = aSeed;
  if (aIsGlobal < 0.5 && abs(aSliceIdx - uActiveSliceIdx) > 0.25) {
    vAlpha = 0.0;
    vStreakAngle = 0.0;
    vWorldPos = vec3(0.0);
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  float globalSnowDominates = step(uRainIntensity + 0.02, uSnowIntensity);
  float isSnow = aIsGlobal > 0.5 ? globalSnowDominates : (1.0 - step(0.5, aType));
  vIsSnow = isSnow;

  // Determine emitter visibility intensity
  float intensity = 0.0;
  if (aIsGlobal > 0.5) {
    intensity = max(uRainIntensity, uSnowIntensity);
  } else if (isSnow > 0.5) {
    intensity = max(uSnowIntensity, uAlpineAmbientSnow);
  } else {
    intensity = clamp(0.18 + uRainIntensity * 0.92, 0.0, 1.0);
  }

  // Cull inactive particles cleanly outside clip space
  if (intensity < 0.02 || aSeed > intensity * 1.15) {
    vAlpha = 0.0;
    vStreakAngle = 0.0;
    vWorldPos = vec3(0.0);
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  float boxW = aIsGlobal > 0.5 ? 8.6 : 3.8;
  float boxH = aIsGlobal > 0.5 ? 5.6 : 3.9;
  float halfW = boxW * 0.5;

  // Coherent travelling wind-gust wave field over the centered diorama
  float gustWave = sin(position.x * 0.34 + position.z * 0.26 - uTime * (1.25 + uWind * 0.85) + aSeed * 1.6);
  float gustWave2 = cos(position.x * 0.22 - position.z * 0.30 + uTime * 0.92);
  float gust = (0.58 + 0.42 * gustWave) * (0.72 + 0.28 * gustWave2) * (0.38 + uWind * 0.92);

  vec3 localPos = position;
  vec3 velWorld;

  if (isSnow > 0.5) {
    float fallSpd = 0.48 + 0.44 * aSeed;
    localPos.y = mod(localPos.y - uTime * fallSpd, boxH);
    float swirlX = sin(uTime * 1.45 + aSeed * 21.0 + localPos.y * 1.55) * 0.20;
    float swirlZ = cos(uTime * 1.15 + aSeed * 15.0 + localPos.y * 1.25) * 0.18;
    float driftX = uTime * (0.28 + gust * 0.58) + swirlX;
    float driftZ = uTime * (0.12 + gust * 0.26) + swirlZ;
    localPos.x = mod(localPos.x + driftX + halfW, boxW) - halfW;
    localPos.z = mod(localPos.z + driftZ + halfW, boxW) - halfW;
    velWorld = vec3(0.45 + gust * 0.65, -fallSpd, 0.20 + gust * 0.3);
  } else {
    float fallSpd = 6.4 + 3.6 * aSeed;
    localPos.y = mod(localPos.y - uTime * fallSpd, boxH);
    float driftX = uTime * (0.85 + gust * 2.15);
    float driftZ = uTime * (0.34 + gust * 0.85);
    localPos.x = mod(localPos.x + driftX + halfW, boxW) - halfW;
    localPos.z = mod(localPos.z + driftZ + halfW, boxW) - halfW;
    velWorld = vec3(1.15 + gust * 2.25, -fallSpd, 0.45 + gust * 0.9);
  }

  vec3 wp = localPos;
  vWorldPos = wp;

  // Soft vertical & radial entry/exit fade so localized slice weather hugs mountains organically
  float fadeBot = smoothstep(0.0, 0.42, localPos.y);
  float fadeTop = 1.0 - smoothstep(boxH - 0.65, boxH, localPos.y);
  float radialFade = aIsGlobal > 0.5 ? 1.0 : (1.0 - smoothstep(1.1, halfW * 1.02, length(localPos.xz)));
  float densFade = smoothstep(0.02, 0.28, intensity);
  float localScale = aIsGlobal > 0.5 ? 1.0 : 0.78;
  vAlpha = fadeBot * fadeTop * radialFade * densFade * (isSnow > 0.5 ? (aIsGlobal > 0.5 ? 0.88 : 0.68) : 0.64);

  // Project wind-slanted velocity into camera view-plane for crisp rain streak alignment
  vec3 viewVel = (viewMatrix * vec4(velWorld, 0.0)).xyz;
  vStreakAngle = atan(-viewVel.x, -viewVel.y);

  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  float viewDist = max(2.8, -mvPosition.z);
  float basePx = (isSnow > 0.5 ? mix(5.0, 10.5, aSeed) : mix(10.5, 18.5, aSeed)) * localScale;
  float maxPx = isSnow > 0.5 ? 15.0 : 24.0;
  gl_PointSize = clamp(basePx * uPixelRatio * (14.0 / viewDist), 2.0, maxPx);
  gl_Position = projectionMatrix * mvPosition;
}`,
    fragmentShader: `
uniform float uSun;
uniform vec3 uSky;

varying float vIsSnow;
varying float vAlpha;
varying float vSeed;
varying float vStreakAngle;
varying vec3 vWorldPos;

${PLACES_VOLUMETRIC_FOG_GLSL}

void main() {
  if (vAlpha < 0.01) discard;
  vec2 uv = gl_PointCoord - 0.5;
  float mask = 0.0;
  vec3 baseCol;

  if (vIsSnow > 0.5) {
    // 6-petal crystalline snowflake + glowing soft core
    float r = length(uv) * 2.0;
    if (r > 1.0) discard;
    float ang = atan(uv.y, uv.x) + vSeed * 6.28;
    float crystal = 0.65 + 0.35 * cos(ang * 6.0);
    float core = 1.0 - smoothstep(0.18, 0.85 * crystal, r);
    float halo = (1.0 - smoothstep(0.0, 1.0, r)) * 0.45;
    mask = clamp(core + halo, 0.0, 1.0);
    baseCol = mix(vec3(0.84, 0.91, 1.0), vec3(1.0, 0.99, 0.97), uSun);
  } else {
    // Rotate sprite UV along projected wind-gust velocity vector
    float ca = cos(vStreakAngle);
    float sa = sin(vStreakAngle);
    vec2 ruv = vec2(ca * uv.x - sa * uv.y, sa * uv.x + ca * uv.y);
    float width = smoothstep(0.15, 0.025, abs(ruv.x));
    float lengthFade = (1.0 - smoothstep(0.06, 0.48, abs(ruv.y))) * smoothstep(-0.48, 0.35, ruv.y);
    mask = width * lengthFade;
    if (mask < 0.02) discard;
    baseCol = mix(vec3(0.55, 0.72, 0.90), mix(uSky * 1.15, vec3(0.88, 0.95, 1.0), 0.55), 0.6 + 0.4 * uSun);
  }

  vec3 litCol = plApplyVolumetricFog(baseCol, vWorldPos);
  float alpha = mask * vAlpha;
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(litCol, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 6;

  return {
    points,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}
