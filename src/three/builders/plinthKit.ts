import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  clamp,
} from '../../lib/fitMath';
import {
  formatDmsCoords,
  getPlinthOutlinePoints,
  mapDomainToPlinth,
  noise2,
  type PlinthSilhouette,
  type PlinthSiteSpec,
  type UndergroundStoryKind,
} from '../../lib/plinthProfiles';
import type { LandmarkMeta } from '../../types/citylit';
import { applyDissolveToShader, prepareCanvasTexture, WU } from '../shaders';
import { NOISE_GLSL } from '../shaders/noise.glsl';
import { SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL } from '../shaders/season.glsl';
import { surfaceDetail } from './primitives';

export interface BuiltPilotPlinth {
  readonly terrainMesh: THREE.Mesh;
  readonly waterTopMesh?: THREE.Mesh;
  readonly waterWallMesh?: THREE.Mesh;
  readonly pedestalGroup: THREE.Group;
  readonly plinthOutlineGeo: THREE.BufferGeometry;
  readonly plinthOutlineY: number;
  readonly waterLevel?: number;
  readonly groundHeightAt: (x: number, z: number) => number;
}

const rimGeoCache = new Map<string, THREE.BufferGeometry>();

/**
 * Generates (and caches) a thin flat glowing collar ring geometry matching the
 * plinth's silhouette so CitylitEngine's `plinthRing` adapts to every shape.
 */
export function getPlinthRingOutlineGeometry(
  silhouette: PlinthSilhouette,
  halfExtent: number
): THREE.BufferGeometry {
  const key = `${silhouette}_${halfExtent.toFixed(2)}`;
  const hit = rimGeoCache.get(key);
  if (hit) return hit;

  const pts = getPlinthOutlinePoints(silhouette, halfExtent, 16);
  const outer = new THREE.Shape();
  const inner = new THREE.Path();
  const outerScale = (halfExtent + 0.1) / halfExtent;
  const innerScale = (halfExtent + 0.015) / halfExtent;

  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    if (i === 0) outer.moveTo(x * outerScale, -z * outerScale);
    else outer.lineTo(x * outerScale, -z * outerScale);
  }
  outer.closePath();

  for (let i = pts.length - 1; i >= 0; i--) {
    const [x, z] = pts[i];
    if (i === pts.length - 1) inner.moveTo(x * innerScale, -z * innerScale);
    else inner.lineTo(x * innerScale, -z * innerScale);
  }
  inner.closePath();
  outer.holes.push(inner);

  const geo = new THREE.ShapeGeometry(outer).rotateX(-Math.PI / 2);
  geo.computeBoundingSphere();
  geo.userData.sharedResource = true;
  rimGeoCache.set(key, geo);
  return geo;
}

/**
 * Hero stratified geological cutaway + ground micro-relief shader.
 * Shares one compiled GPU program across all sites via per-material uniforms,
 * supports CitylitEngine architectural cutaway (`clippingPlanes`), `WU.dy` dissolve,
 * seasonal ground morphing, rain puddles, and tidal wet-sand darkening.
 */
function createHeroStrataMaterial(spec: PlinthSiteSpec): THREE.MeshStandardMaterial {
  const st = spec.strata;
  const wl = spec.water ? spec.water.waterLevel : -9.0;
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.03,
    envMapIntensity: 0.65,
    ...surfaceDetail('stone', 0.022),
  });
  mat.userData.naturalSurface = true;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRN = WU.rain;
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uPuddleRain = WU.rain;
    shader.uniforms.uSeasonF = WU.season;
    shader.uniforms.uSeasonAutumn = WU.seasonAutumn;
    shader.uniforms.uSeasonSpring = WU.seasonSpring;
    shader.uniforms.uBaseY = { value: spec.baseY };
    shader.uniforms.uWaterY = { value: wl };
    shader.uniforms.uSeasonStr = { value: spec.seasonalGroundStrength };
    shader.uniforms.uHumus = { value: new THREE.Color(st.humus) };
    shader.uniforms.uSubsoil = { value: new THREE.Color(st.subsoil) };
    shader.uniforms.uUpperRock = { value: new THREE.Color(st.upperRock) };
    shader.uniforms.uCoreRock = { value: new THREE.Color(st.coreRock) };
    shader.uniforms.uBasement = { value: new THREE.Color(st.basement) };
    shader.uniforms.uSeamLight = { value: new THREE.Color(st.seamLight) };
    shader.uniforms.uSeamDark = { value: new THREE.Color(st.seamDark) };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aTopY;
attribute float aIsWall;
varying vec3 vHeroPos;
varying vec3 vHeroNorm;
varying float vTopY;
varying float vIsWall;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vec4 hStrataWp = modelMatrix * vec4(transformed, 1.0);
vHeroPos = hStrataWp.xyz;
vHeroNorm = normalize(mat3(modelMatrix) * objectNormal);
vTopY = aTopY + modelMatrix[3].y;
vIsWall = aIsWall;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vHeroPos;
varying vec3 vHeroNorm;
varying float vTopY;
varying float vIsWall;
uniform float uRN, uWT, uBaseY, uWaterY, uSeasonStr;
uniform vec3 uHumus, uSubsoil, uUpperRock, uCoreRock, uBasement, uSeamLight, uSeamDark;
${SEASON_UNIFORMS_GLSL}
${SEASON_MORPH_GLSL}
${NOISE_GLSL}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
{
  if (vIsWall > 0.5) {
    float span = max(0.55, vTopY - uBaseY);
    float depthBelow = max(0.0, vTopY - vHeroPos.y);
    float layerT = clamp(depthBelow / span, 0.0, 1.0);
    float horizCoord = abs(vHeroNorm.x) > abs(vHeroNorm.z) ? vHeroPos.z : vHeroPos.x;

    // 2D face warp + 3D world noise so strata bands wrap smoothly around every corner
    float warp = (clFbm2(vec2(horizCoord * 0.65, vHeroPos.y * 1.45)) - 0.5) * 0.14
               + (clFbm3(vec3(vHeroPos.xz * 0.32, vHeroPos.y * 0.65)) - 0.5) * 0.08;
    float layer = clamp(layerT + warp, 0.0, 1.0);

    vec3 strataCol = uHumus;
    strataCol = mix(strataCol, uSubsoil, smoothstep(0.04, 0.11, layer));
    strataCol = mix(strataCol, uUpperRock, smoothstep(0.18, 0.29, layer));
    strataCol = mix(strataCol, uCoreRock, smoothstep(0.42, 0.56, layer));
    strataCol = mix(strataCol, uBasement, smoothstep(0.74, 0.88, layer));

    // Contrasting mineral seams (calcrete / gold-banket quartz / dark iron-shale)
    float seamA = 1.0 - smoothstep(0.0, 0.024, abs(layer - 0.36));
    float seamB = 1.0 - smoothstep(0.0, 0.022, abs(layer - 0.65));
    strataCol = mix(strataCol, uSeamLight, seamA * 0.58);
    strataCol = mix(strataCol, uSeamDark, seamB * 0.45);

    // Fine laminated bedding planes + erosion rills + grit + embedded pebbles
    float lam = 0.5 + 0.5 * sin(layer * 115.0 + horizCoord * 1.4 + clNoise2(vec2(horizCoord * 1.6, vHeroPos.y * 3.0)) * 2.8);
    strataCol *= 0.92 + 0.14 * lam;

    float gully = smoothstep(0.64, 0.96, clNoise2(vec2(horizCoord * 2.8, vHeroPos.y * 0.55 + 2.0))) * smoothstep(0.08, 0.45, layer);
    strataCol *= 1.0 - gully * 0.15;

    float pebbles = smoothstep(0.68, 0.92, clNoise2(vec2(horizCoord * 8.5, vHeroPos.y * 11.0)));
    float lightPeb = smoothstep(0.74, 0.95, clNoise2(vec2(horizCoord * 9.5 + 4.1, vHeroPos.y * 12.5)));
    strataCol = mix(strataCol, strataCol * 0.65, pebbles * 0.32);
    strataCol = mix(strataCol, mix(uSeamLight, vec3(0.88, 0.85, 0.78), 0.35), lightPeb * 0.28);

    float fissure = smoothstep(0.90, 0.992, clNoise2(vec2(horizCoord * 3.4 + vHeroPos.y * 0.9, vHeroPos.y * 2.1)));
    strataCol *= 1.0 - fissure * 0.30;

    // Dark humus & root overhang lip directly beneath terrain crust
    float humusLip = 1.0 - smoothstep(0.015, 0.075, depthBelow);
    strataCol = mix(strataCol, uHumus * 0.68, humusLip * 0.90);

    // Groundwater moisture darkening where adjacent bay/waterhole sits above slab base
    if (uWaterY > -5.0 && vHeroPos.y < uWaterY + 0.04) {
      float wetSeep = smoothstep(-0.85, 0.04, vHeroPos.y - uWaterY);
      strataCol *= mix(0.76, 0.88, wetSeep);
    }

    // Subtle museum base AO
    float baseAO = smoothstep(uBaseY, uBaseY + 0.55, vHeroPos.y);
    strataCol *= 0.78 + 0.22 * baseAO;
    diffuseColor.rgb = strataCol;
  } else {
    // Ground top relief: organic broad soil/sand/litter mottling + fine mineral grain
    float broad = clFbm2(vHeroPos.xz * 1.1);
    float fine = clNoise2(vHeroPos.xz * 6.5);
    float sprinkle = clNoise2(vHeroPos.xz * 26.0);
    float slope = clamp(1.0 - vHeroNorm.y, 0.0, 1.0);

    diffuseColor.rgb *= 0.88 + 0.22 * broad + (fine - 0.5) * 0.11 + (sprinkle - 0.5) * 0.06;
    diffuseColor.rgb *= 1.0 - slope * 0.18 * (1.0 - fine);

    // Tidal / shore wet-sand darkening just above & beneath waterline
    if (uWaterY > -5.0) {
      float wetBand = 1.0 - smoothstep(0.0, 0.14, abs(vHeroPos.y - uWaterY));
      float sub = step(vHeroPos.y, uWaterY);
      diffuseColor.rgb *= 1.0 - max(wetBand * 0.22, sub * 0.16);
    }

    diffuseColor.rgb *= 1.0 - uRN * 0.15;
    if (uSeasonStr > 0.01) {
      vec3 morphed = clSeasonMorph(diffuseColor.rgb, 0.78);
      diffuseColor.rgb = mix(diffuseColor.rgb, morphed, uSeasonStr);
    }
  }
}`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
{
  if (vIsWall > 0.5) {
    roughnessFactor = mix(roughnessFactor, 0.94, 0.65);
  } else {
    float wetShore = uWaterY > -5.0
      ? (1.0 - smoothstep(0.0, 0.12, abs(vHeroPos.y - uWaterY)))
      : 0.0;
    float puddle = smoothstep(0.48, 0.74, clNoise2(vHeroPos.xz * 1.45)) * smoothstep(0.86, 0.98, vHeroNorm.y);
    float sheen = max(wetShore * 0.72, uRN * (0.42 + 0.58 * puddle));
    roughnessFactor = mix(roughnessFactor, 0.08, clamp(sheen, 0.0, 0.92));
  }
}`
      );

    // Invoke shared dissolve/fog/gouache hook WITHOUT passing `mat` so it
    // does not inject duplicate seasonal color_fragment GLSL.
    applyDissolveToShader(shader);
  };

  mat.customProgramCacheKey = () => 'hero_strata_relief_v1';
  return mat;
}

/**
 * Hero translucent glass water cutaway top surface material.
 * Supports clippingPlanes, landmark dust-dissolve (uDY), semidiurnal tide,
 * shallow-sand transmission, caustics, shore breakers, and meniscus glow.
 */
function createHeroWaterTopMaterial(spec: PlinthSiteSpec): THREE.ShaderMaterial {
  const w = spec.water!;
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    clipping: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    uniforms: {
      uTime: WU.t,
      uSun: WU.sun,
      uHor: WU.sunHor,
      uSky: WU.sky,
      uRain: WU.rain,
      uWind: WU.wind,
      uDY: WU.dy,
      uTide: w.tracksTide ? WU.coastalTide : { value: 0 },
      uWake: WU.wake,
      uWakeStrength: WU.wakeStrength,
      uShallow: { value: new THREE.Color(w.shallowColor) },
      uDeep: { value: new THREE.Color(w.deepColor) },
      uFoamStrength: { value: w.foamStrength },
      uTurbulence: { value: w.turbulence },
      uClarity: { value: w.clarity },
      uCaustic: { value: w.caustic },
      uGlint: { value: w.glint },
    },
    vertexShader: /* glsl */ `
#include <clipping_planes_pars_vertex>
attribute float aDepth;
attribute float aShore;
attribute float aEdge;
uniform float uTime;
uniform float uTurbulence;
uniform float uWind;
uniform float uTide;
varying float vDepth;
varying float vShore;
varying float vEdge;
varying vec3 vWorldPos;
void main() {
  vDepth = aDepth + uTide;
  vShore = aShore;
  vEdge = aEdge;
  vec3 pos = position;
  float edgeMask = smoothstep(0.015, 0.22, max(0.0, aDepth));
  float chop = 0.85 + 0.3 * uWind;
  float wave = sin(pos.x * 2.2 + uTime * 2.1) * 0.016
             + cos(pos.z * 2.6 - uTime * 1.75) * 0.014
             + sin((pos.x - pos.z) * 3.8 + uTime * 2.8) * 0.008;
  pos.y += wave * uTurbulence * chop * edgeMask + uTide;
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWorldPos = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}`,
    fragmentShader: /* glsl */ `
#include <clipping_planes_pars_fragment>
uniform float uTime, uSun, uHor, uRain, uWind, uDY;
uniform float uFoamStrength, uTurbulence, uClarity, uCaustic, uGlint;
uniform vec3 uSky, uShallow, uDeep, uWake;
uniform float uWakeStrength;
varying float vDepth, vShore, vEdge;
varying vec3 vWorldPos;

float hwHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float hwNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hwHash(i),hwHash(i+vec2(1.,0.)),f.x),mix(hwHash(i+vec2(0.,1.)),hwHash(i+vec2(1.,1.)),f.x),f.y);}
float hwFbm(vec2 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*hwNoise(p);p=p*2.05+vec2(9.1,5.3);a*=.5;}return s;}
float hwRidge(vec2 p){return 1.-abs(hwNoise(p)*2.-1.);}
float hwHeight(vec2 p,float t){
  float h=sin(p.x*1.85+t*2.05)*.34+cos(p.y*2.15-t*1.75)*.30+(hwNoise(p*1.65+vec2(t*.42,-t*.31))-.5)*.42;
  h+=uRain*.22*sin(p.x*9.5+t*11.)*cos(p.y*8.8-t*9.5);
  return h;
}

void main() {
  #include <clipping_planes_fragment>
  if (uDY < 90.0 && vWorldPos.y > uDY && dot(vWorldPos.xz, vWorldPos.xz) < 110.0 && vWorldPos.y < 14.0) discard;
  if (vDepth < -0.005) discard;
  float depth = max(0.0, vDepth);
  vec2 q = vWorldPos.xz;

  vec2 wakeD = q - uWake.xz;
  float wakeDist = length(wakeD);
  float wakeEnv = exp(-wakeDist * 2.2) * uWakeStrength;
  float wakeWave = sin(wakeDist * 14.0 - uTime * 5.2) * wakeEnv;

  float eps = 0.08;
  float h = hwHeight(q, uTime);
  float hx = hwHeight(q + vec2(eps, 0.0), uTime);
  float hz = hwHeight(q + vec2(0.0, eps), uTime);
  float tilt = 0.095 * uTurbulence;
  vec3 N = normalize(vec3(-(h - hx) / eps * tilt, 1.0, -(h - hz) / eps * tilt));

  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(vec3(0.45, 0.78, 0.42));
  vec3 H = normalize(L + V);
  float nDotL = max(dot(N, L), 0.0);

  float shallowT = smoothstep(0.0, 0.22, depth);
  float deepT = smoothstep(0.18, 0.88, depth);
  vec3 seabed = mix(vec3(0.78, 0.71, 0.54), uShallow * 0.92, 0.22);
  vec3 body = mix(seabed * 0.94, uShallow, smoothstep(0.0, 0.12, depth));
  body = mix(body, uDeep, deepT);
  body *= mix(0.28, 1.0, uSun);

  float kelpShadow = smoothstep(0.58, 0.84, hwFbm(q * 0.85 + 7.2));
  body = mix(body, mix(uDeep * 0.62, uShallow * 0.28, 0.35), kelpShadow * deepT * 0.44);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.1);
  vec3 sunTint = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.72, 0.38), uHor * 0.72);
  float specBroad = pow(max(dot(N, H), 0.0), 75.0);
  float specGlint = pow(max(dot(N, H), 0.0), 260.0);
  float sparkle = smoothstep(0.56, 0.95, hwNoise(q * 11.0 + vec2(uTime * 1.3, -uTime * 1.1)));

  vec3 col = body * (0.48 + 0.72 * nDotL);
  col += uSky * (0.08 + fresnel * 0.34) * mix(0.85, 1.15, uSun);
  col = mix(col, mix(uShallow, uSky, 0.28), fresnel * 0.34);
  col += sunTint * (specBroad * (0.48 + 0.5 * uSun) + specGlint * (0.24 + sparkle * 1.0) * uSun) * uGlint;

  // Sunlit caustics glowing across the shallow sandy bed
  float c1 = hwRidge(q * 2.1 + vec2(uTime * 0.24, -uTime * 0.18));
  float c2 = hwRidge(q * 2.7 - vec2(uTime * 0.17, uTime * 0.21) + 5.0);
  float caustic = pow(c1 * c2, 2.6);
  col += mix(uShallow, vec3(0.86, 0.98, 0.96), 0.45) * caustic * 0.46 * (1.0 - deepT * 0.8) * (0.3 + 0.7 * uSun) * uCaustic;

  // Shore-hugging curved breakers & pale intertidal foam
  float shore = clamp(vShore, 0.0, 1.0);
  float surfA = smoothstep(0.62, 0.92, fract(shore * 6.5 - uTime * 0.48 + hwNoise(q * 1.4) * 0.32)) * (1.0 - smoothstep(0.0, 0.52, shore));
  float surfB = smoothstep(0.74, 0.96, fract(shore * 10.5 - uTime * 0.72 + 0.5 + hwNoise(q * 2.1 + 6.0) * 0.24)) * (1.0 - smoothstep(0.0, 0.32, shore));
  float shoreLip = (1.0 - smoothstep(0.0, 0.14, shore)) * (0.68 + 0.32 * hwNoise(q * 5.5 + uTime * 0.5));
  float lacyFoam = smoothstep(0.54, 0.78, h) * smoothstep(0.56, 0.85, hwFbm(q * 3.4 - vec2(uTime * 0.28, uTime * 0.22))) * 0.18;
  float rainRip = uRain * smoothstep(0.72, 0.95, sin(q.x * 13.0 + uTime * 13.0) * cos(q.y * 12.0 - uTime * 11.0)) * 0.16;
  float wakeFoam = max(0.0, wakeWave) * 0.4;

  float foam = clamp((surfA + surfB * 0.8 + shoreLip * 1.05 + lacyFoam + rainRip + wakeFoam) * uFoamStrength, 0.0, 1.0);
  foam = smoothstep(0.42, 0.76, foam);
  vec3 foamColor = mix(vec3(0.92, 0.96, 0.98), sunTint, 0.12) * mix(0.36, 0.96, uSun);
  col = mix(col, foamColor, foam);

  // Crisp glassy meniscus highlight along the aquarium cutaway edge
  float meniscus = smoothstep(0.84, 1.0, vEdge);
  col += mix(uShallow, vec3(0.76, 0.96, 1.0), 0.62) * meniscus * 0.22;

  float alpha = mix(0.28, 0.88, shallowT * 0.32 + deepT * 0.56) * (1.12 - uClarity * 0.28);
  alpha = clamp(max(alpha, max(foam * 0.94, meniscus * 0.68)), 0.26, 0.92);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

/**
 * Hero translucent vertical glass water cross-section wall shader.
 * Top edge rides `WU.coastalTide` in exact lockstep with the top water mesh.
 */
function createHeroWaterWallMaterial(spec: PlinthSiteSpec): THREE.ShaderMaterial {
  const w = spec.water!;
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    clipping: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    uniforms: {
      uTime: WU.t,
      uSun: WU.sun,
      uSky: WU.sky,
      uDY: WU.dy,
      uTide: w.tracksTide ? WU.coastalTide : { value: 0 },
      uShallow: { value: new THREE.Color(w.shallowColor) },
      uDeep: { value: new THREE.Color(w.deepColor) },
      uClarity: { value: w.clarity },
    },
    vertexShader: /* glsl */ `
#include <clipping_planes_pars_vertex>
uniform float uTide;
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vec3 pos = position;
  if (uv.y > 0.5) {
    pos.y += uTide;
  }
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWorldPos = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}`,
    fragmentShader: /* glsl */ `
#include <clipping_planes_pars_fragment>
uniform float uTime, uSun, uClarity, uDY;
uniform vec3 uSky, uShallow, uDeep;
varying vec2 vUv;
varying vec3 vWorldPos;

float hwwHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float hwwNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hwwHash(i),hwwHash(i+vec2(1.,0.)),f.x),mix(hwwHash(i+vec2(0.,1.)),hwwHash(i+vec2(1.,1.)),f.x),f.y);}

void main() {
  #include <clipping_planes_fragment>
  if (uDY < 90.0 && vWorldPos.y > uDY && dot(vWorldPos.xz, vWorldPos.xz) < 110.0 && vWorldPos.y < 14.0) discard;
  float depthMix = 1.0 - vUv.y;

  vec3 col = mix(uShallow * 1.05, uDeep * 0.65, pow(depthMix, 0.58));
  col *= mix(0.32, 1.0, uSun);
  col = mix(col, uSky * 0.88, smoothstep(0.0, 0.08, vUv.y) * 0.22);

  // Subtle depth striations & dancing sunlit water-column caustics
  float sediment = 0.5 + 0.5 * sin(vWorldPos.y * 18.0 + sin(vWorldPos.x * 1.6 + vWorldPos.z * 1.4) * 1.4);
  col *= 0.93 + 0.10 * sediment;

  float caustic = (sin(vWorldPos.x * 2.8 + vWorldPos.z * 2.5 + uTime * 1.7) * 0.5 + 0.5)
                * (sin(vUv.y * 14.0 - uTime * 1.3) * 0.5 + 0.5);
  col += uShallow * caustic * 0.28 * (0.35 + 0.65 * uSun) * vUv.y;

  float shaft = smoothstep(0.62, 0.98, hwwNoise(vec2(vUv.x * 9.0 + uTime * 0.04, vUv.y * 1.3)));
  col += mix(uShallow, vec3(0.98, 0.92, 0.78), 0.35) * shaft * 0.14 * vUv.y * (0.3 + 0.7 * uSun);

  // Slowly drifting bubbles inside the cut aquarium glass edge
  vec2 bUv = vec2(vUv.x * 38.0, vUv.y * 14.0 - uTime * 0.55);
  vec2 bCell = floor(bUv);
  float bSeed = hwwHash(bCell);
  vec2 bLocal = fract(bUv) - 0.5;
  float bubble = step(0.80, bSeed) * (1.0 - smoothstep(0.08, 0.22, length(bLocal)));
  col += vec3(0.84, 0.96, 1.0) * bubble * 0.30;

  // Bright glass waterline meniscus and subtle pale sandy bed seam
  float meniscus = smoothstep(0.92, 1.0, vUv.y);
  col = mix(col, mix(uSky, vec3(0.86, 0.96, 0.98), 0.7), meniscus * 0.48);
  float bed = 1.0 - smoothstep(0.0, 0.16, vUv.y);
  col = mix(col, mix(vec3(0.78, 0.72, 0.56), uShallow * 0.5, 0.35), bed * 0.26);

  float alpha = mix(0.38, 0.78, depthMix) * (1.10 - uClarity * 0.32);
  alpha = clamp(max(alpha, meniscus * 0.66), 0.30, 0.84);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

function buildNameplateMesh(
  spec: PlinthSiteSpec,
  meta: LandmarkMeta
): THREE.Group {
  const grp = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = spec.strata.plateBgColor;
    ctx.fillRect(0, 0, 512, 128);

    // Double brass/bronze engraved border
    ctx.strokeStyle = spec.strata.plateFrameColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 476, 92);

    // Corner rivets
    ctx.fillStyle = spec.strata.plateFrameColor;
    for (const [rx, ry] of [
      [28, 28],
      [484, 28],
      [28, 100],
      [484, 100],
    ]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = spec.strata.plateTextColor;
    ctx.font = '700 28px Georgia, "Times New Roman", serif';
    ctx.fillText(meta.k.toUpperCase(), 256, 46);

    ctx.fillStyle = spec.strata.plateFrameColor;
    ctx.font = '600 17px system-ui, -apple-system, sans-serif';
    const dms = formatDmsCoords(meta.coords[0], meta.coords[1]);
    ctx.fillText(`${meta.c}   ·   ${dms}`, 256, 86);
  }

  const tex = prepareCanvasTexture(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;

  const backingMat = new THREE.MeshStandardMaterial({
    color: spec.strata.plateFrameColor,
    roughness: 0.42,
    metalness: 0.55,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.46,
    metalness: 0.22,
  });

  const backing = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.64, 0.08), backingMat);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 0.56), faceMat);
  face.position.z = 0.043;
  grp.add(backing, face);

  // Position flush on the front chamfered face of the museum slab
  const [, frontZ] = mapDomainToPlinth(0, 1, spec.silhouette, spec.halfExtent);
  grp.position.set(0, spec.baseY + 0.24, frontZ + 0.045);
  grp.rotation.x = -0.22;
  grp.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.userData.noContactStamp = true;
    }
  });
  return grp;
}

/**
 * Adds merged geological cutaway storytelling relief details along the slab
 * faces (penguin burrow niche, termite fungus galleries, or industrial conduits).
 */
function buildUndergroundStories(
  story: UndergroundStoryKind,
  spec: PlinthSiteSpec
): THREE.Group {
  const grp = new THREE.Group();
  const half = spec.halfExtent;
  const parts: THREE.BufferGeometry[] = [];
  const partCols: string[] = [];

  const pushGeo = (geo: THREE.BufferGeometry, col: string) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    g.deleteAttribute('uv');
    parts.push(g);
    partCols.push(col);
  };

  if (story === 'burrows') {
    // Exposed African penguin sand-burrow chamber on front-left bank + hanging coastal roots
    const [, frontZ] = mapDomainToPlinth(-0.42, 1, spec.silhouette, half);
    const [bx] = mapDomainToPlinth(-0.42, 1, spec.silhouette, half);
    const burrow = new THREE.CylinderGeometry(0.24, 0.26, 0.1, 16)
      .rotateX(Math.PI / 2)
      .scale(1.35, 0.72, 1)
      .translate(bx, -0.18, frontZ - 0.01);
    pushGeo(burrow, '#1e1914');

    const collar = new THREE.TorusGeometry(0.24, 0.045, 6, 16)
      .scale(1.35, 0.72, 1)
      .translate(bx, -0.18, frontZ + 0.01);
    pushGeo(collar, '#9e8864');

    // Scattered rounded Cape granite corestones protruding slightly from lower granite layer
    for (let i = 0; i < 6; i++) {
      const u = -0.75 + i * 0.24;
      const [cx, cz] = mapDomainToPlinth(u, 1, spec.silhouette, half);
      const stone = new THREE.DodecahedronGeometry(0.14 + (i % 3) * 0.04, 1)
        .scale(1.3, 0.85, 0.65)
        .translate(cx, -0.58 - (i % 2) * 0.22, cz + 0.01);
      pushGeo(stone, i % 2 ? '#8f8a80' : '#736f67');
    }

    // Overhanging fynbos taproots below left turf lip
    for (let i = 0; i < 5; i++) {
      const u = -0.82 + i * 0.14;
      const [rx, rz] = mapDomainToPlinth(u, 1, spec.silhouette, half);
      const len = 0.22 + (i % 3) * 0.11;
      const root = new THREE.CylinderGeometry(0.016, 0.004, len, 5).translate(
        rx,
        0.1 - len * 0.5,
        rz + 0.018
      );
      pushGeo(root, '#4a3522');
    }
  } else if (story === 'termites') {
    // East cutaway face directly beneath termite mound (x = +half, z ~ -1.85)
    const [ex, ez] = mapDomainToPlinth(1, -0.24, spec.silhouette, half);
    // Vertical termite chimney shaft + 3 oval fungus-comb chambers
    pushGeo(
      new THREE.CylinderGeometry(0.04, 0.055, 0.72, 8).translate(ex + 0.008, -0.26, ez),
      '#3a2216'
    );
    for (const [dy, dz, rx, ry] of [
      [-0.32, -0.24, 0.22, 0.13],
      [-0.56, 0.18, 0.26, 0.14],
      [-0.44, -0.02, 0.18, 0.11],
    ]) {
      pushGeo(
        new THREE.SphereGeometry(1, 10, 8)
          .scale(0.05, ry, rx)
          .translate(ex + 0.008, dy, ez + dz),
        '#361f14'
      );
      pushGeo(
        new THREE.SphereGeometry(1, 8, 6)
          .scale(0.035, ry * 0.55, rx * 0.65)
          .translate(ex + 0.02, dy - 0.02, ez + dz),
        '#8a6b48'
      );
    }
    // Acacia root system descending along front cut face
    for (let i = 0; i < 6; i++) {
      const u = -0.68 + i * 0.26;
      const [rx, rz] = mapDomainToPlinth(u, 1, spec.silhouette, half);
      const len = 0.28 + (i % 3) * 0.14;
      pushGeo(
        new THREE.CylinderGeometry(0.024, 0.006, len, 5)
          .rotateZ((i % 2 ? 1 : -1) * 0.18)
          .translate(rx, 0.12 - len * 0.5, rz + 0.015),
        '#4c3624'
      );
    }
  } else if (story === 'conduit') {
    // Industrial cooling water pipe cross-section & conduit sleeves on front-left & front-right cut faces
    for (const [u, radius, col] of [
      [-0.31, 0.17, '#4c545c'],
      [0.31, 0.17, '#4c545c'],
      [-0.44, 0.065, '#8e5a38'],
      [0.44, 0.065, '#8e5a38'],
    ] as const) {
      const [px, pz] = mapDomainToPlinth(u, 1, spec.silhouette, half);
      pushGeo(
        new THREE.CylinderGeometry(radius, radius, 0.12, 16)
          .rotateX(Math.PI / 2)
          .translate(px, -0.14, pz + 0.015),
        col
      );
      pushGeo(
        new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, 0.13, 14)
          .rotateX(Math.PI / 2)
          .translate(px, -0.14, pz + 0.02),
        '#1d2228'
      );
    }
    // Concrete tower pad footing band
    const [fxL, fzL] = mapDomainToPlinth(-0.31, 1, spec.silhouette, half);
    const [fxR, fzR] = mapDomainToPlinth(0.31, 1, spec.silhouette, half);
    pushGeo(
      new THREE.BoxGeometry(1.1, 0.14, 0.08).translate(fxL, 0.08, fzL + 0.01),
      '#7f827a'
    );
    pushGeo(
      new THREE.BoxGeometry(1.1, 0.14, 0.08).translate(fxR, 0.08, fzR + 0.01),
      '#7f827a'
    );
  }

  if (parts.length === 0) return grp;

  const colored: THREE.BufferGeometry[] = [];
  const col = new THREE.Color();
  for (let p = 0; p < parts.length; p++) {
    const g = parts[p];
    col.set(partCols[p]);
    const count = g.attributes.position.count;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = col.r;
      arr[i * 3 + 1] = col.g;
      arr[i * 3 + 2] = col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    colored.push(g);
  }
  const merged = mergeGeometries(colored, false);
  colored.forEach((g) => g.dispose());
  if (!merged) return grp;

  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.78,
    metalness: story === 'conduit' ? 0.35 : 0.04,
  });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.userData.noContactStamp = true;
  grp.add(mesh);
  return grp;
}

/**
 * Builds the watertight sculpted ground terrain, continuous geological strata
 * walls, beveled museum base skirt, underground story details, engraved nameplate,
 * and optional translucent 3D glass water cutaway volume.
 */
export function buildPilotPlinth(
  spec: PlinthSiteSpec,
  meta: LandmarkMeta,
  groundHeightAt: (x: number, z: number) => number,
  topColorAt: (x: number, z: number, y: number, slope: number, out: THREE.Color) => void,
  segments = 60
): BuiltPilotPlinth {
  const N = segments;
  const half = spec.halfExtent;
  const baseY = spec.baseY;
  const sil = spec.silhouette;

  const xs = new Float32Array((N + 1) * (N + 1));
  const zs = new Float32Array((N + 1) * (N + 1));
  const hs = new Float32Array((N + 1) * (N + 1));

  for (let iz = 0; iz <= N; iz++) {
    const v = -1 + (2 * iz) / N;
    for (let ix = 0; ix <= N; ix++) {
      const u = -1 + (2 * ix) / N;
      const [x, z] = mapDomainToPlinth(u, v, sil, half);
      const k = iz * (N + 1) + ix;
      xs[k] = x;
      zs[k] = z;
      hs[k] = groundHeightAt(x, z);
    }
  }

  const pos: number[] = [];
  const norm: number[] = [];
  const col: number[] = [];
  const topYAttr: number[] = [];
  const isWallAttr: number[] = [];
  const idx: number[] = [];

  const cTop = new THREE.Color();
  const cWallBase = new THREE.Color(spec.strata.basement);
  const cWallMid = new THREE.Color(spec.strata.upperRock);

  // Top relief terrain vertices
  for (let iz = 0; iz <= N; iz++) {
    for (let ix = 0; ix <= N; ix++) {
      const k = iz * (N + 1) + ix;
      const x = xs[k];
      const z = zs[k];
      const y = hs[k];

      const kL = iz * (N + 1) + Math.max(0, ix - 1);
      const kR = iz * (N + 1) + Math.min(N, ix + 1);
      const kD = Math.max(0, iz - 1) * (N + 1) + ix;
      const kU = Math.min(N, iz + 1) * (N + 1) + ix;
      const dxSpan = Math.max(1e-4, xs[kR] - xs[kL]);
      const dzSpan = Math.max(1e-4, zs[kU] - zs[kD]);
      const dx = (hs[kR] - hs[kL]) / dxSpan;
      const dz = (hs[kU] - hs[kD]) / dzSpan;
      const len = Math.hypot(dx, 1, dz) || 1;
      const nx = -dx / len;
      const ny = 1 / len;
      const nz = -dz / len;
      const slope = 1 - ny;

      topColorAt(x, z, y, slope, cTop);
      pos.push(x, y, z);
      norm.push(nx, ny, nz);
      col.push(cTop.r, cTop.g, cTop.b);
      topYAttr.push(y);
      isWallAttr.push(0);
    }
  }

  for (let iz = 0; iz < N; iz++) {
    for (let ix = 0; ix < N; ix++) {
      const a = iz * (N + 1) + ix;
      const b = a + 1;
      const c = a + N + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }

  // Emit exact vertical geological cutaway walls stitched to edge top heights
  const emitSideWall = (
    edgeIndices: number[],
    flipWinding: boolean
  ) => {
    const startVert = pos.length / 3;
    const nPts = edgeIndices.length;
    for (let i = 0; i < nPts; i++) {
      const kPrev = edgeIndices[Math.max(0, i - 1)];
      const kCurr = edgeIndices[i];
      const kNext = edgeIndices[Math.min(nPts - 1, i + 1)];
      const tx = xs[kNext] - xs[kPrev];
      const tz = zs[kNext] - zs[kPrev];
      const tLen = Math.hypot(tx, tz) || 1;
      // Outward lateral normal orthogonal to wall tangent
      const nx = flipWinding ? -tz / tLen : tz / tLen;
      const nz = flipWinding ? tx / tLen : -tx / tLen;

      const x = xs[kCurr];
      const z = zs[kCurr];
      const topY = hs[kCurr];

      // Bottom vertex
      pos.push(x, baseY, z);
      norm.push(nx, 0, nz);
      col.push(cWallBase.r, cWallBase.g, cWallBase.b);
      topYAttr.push(topY);
      isWallAttr.push(1);

      // Top vertex (matches terrain perimeter exact vertex coords)
      pos.push(x, topY, z);
      norm.push(nx, 0, nz);
      col.push(cWallMid.r, cWallMid.g, cWallMid.b);
      topYAttr.push(topY);
      isWallAttr.push(1);
    }
    for (let i = 0; i < nPts - 1; i++) {
      const b0 = startVert + i * 2;
      const t0 = b0 + 1;
      const b1 = b0 + 2;
      const t1 = b0 + 3;
      if (flipWinding) {
        idx.push(b0, b1, t0, t0, b1, t1);
      } else {
        idx.push(b0, t0, b1, t0, t1, b1);
      }
    }
  };

  const frontEdge: number[] = [];
  const backEdge: number[] = [];
  const rightEdge: number[] = [];
  const leftEdge: number[] = [];
  for (let i = 0; i <= N; i++) {
    frontEdge.push(N * (N + 1) + i); // iz = N (v = +1)
    backEdge.push(i); // iz = 0 (v = -1)
    rightEdge.push(i * (N + 1) + N); // ix = N (u = +1)
    leftEdge.push(i * (N + 1)); // ix = 0 (u = -1)
  }

  emitSideWall(frontEdge, true);
  emitSideWall(backEdge, false);
  emitSideWall(rightEdge, false);
  emitSideWall(leftEdge, true);

  const terrainGeo = new THREE.BufferGeometry();
  terrainGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  terrainGeo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  terrainGeo.setAttribute('aTopY', new THREE.Float32BufferAttribute(topYAttr, 1));
  terrainGeo.setAttribute('aIsWall', new THREE.Float32BufferAttribute(isWallAttr, 1));
  terrainGeo.setIndex(idx);
  terrainGeo.computeBoundingSphere();

  const terrainMat = createHeroStrataMaterial(spec);
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;

  // Museum chamfered base skirt + engraved nameplate + underground stories
  const pedestalGroup = new THREE.Group();
  const skirtPts = getPlinthOutlinePoints(sil, half, 16);
  const skirtPos: number[] = [];
  const skirtIdx: number[] = [];
  const insetRatio = (half - 0.24) / half;
  const botY = spec.skirtBottomY;

  for (let i = 0; i < skirtPts.length; i++) {
    const [x, z] = skirtPts[i];
    skirtPos.push(x, baseY + 0.01, z);
    skirtPos.push(x * insetRatio, botY, z * insetRatio);
  }
  const nSkirt = skirtPts.length;
  for (let i = 0; i < nSkirt; i++) {
    const i2 = (i + 1) % nSkirt;
    const t0 = i * 2;
    const b0 = t0 + 1;
    const t1 = i2 * 2;
    const b1 = t1 + 1;
    skirtIdx.push(t0, b0, t1, t1, b0, b1);
  }
  // Solid flat underside cap
  const centerIdx = skirtPos.length / 3;
  skirtPos.push(0, botY, 0);
  for (let i = 0; i < nSkirt; i++) {
    const i2 = (i + 1) % nSkirt;
    skirtIdx.push(centerIdx, i2 * 2 + 1, i * 2 + 1);
  }

  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
  skirtGeo.setIndex(skirtIdx);
  skirtGeo.computeVertexNormals();
  skirtGeo.computeBoundingSphere();

  const skirtMat = new THREE.MeshStandardMaterial({
    color: spec.strata.skirtColor,
    roughness: 0.56,
    metalness: 0.34,
  });
  const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
  skirtMesh.userData.noContactStamp = true;
  pedestalGroup.add(skirtMesh);

  pedestalGroup.add(buildUndergroundStories(spec.story, spec));
  pedestalGroup.add(buildNameplateMesh(spec, meta));

  let waterTopMesh: THREE.Mesh | undefined;
  let waterWallMesh: THREE.Mesh | undefined;

  if (spec.water) {
    const wl = spec.water.waterLevel;
    const isWet = (k: number) => hs[k] < wl - 0.008;

    // Two-pass chamfer shore distance so surf breakers follow the curved cove
    const INF = 1e6;
    const shoreDist = new Float32Array((N + 1) * (N + 1)).fill(INF);
    for (let iz = 0; iz <= N; iz++) {
      for (let ix = 0; ix <= N; ix++) {
        const k = iz * (N + 1) + ix;
        if (!isWet(k)) shoreDist[k] = 0;
      }
    }
    for (let iz = 0; iz <= N; iz++) {
      for (let ix = 0; ix <= N; ix++) {
        const k = iz * (N + 1) + ix;
        let d = shoreDist[k];
        if (ix > 0) d = Math.min(d, shoreDist[k - 1] + 1);
        if (iz > 0) d = Math.min(d, shoreDist[k - (N + 1)] + 1);
        if (ix > 0 && iz > 0) d = Math.min(d, shoreDist[k - N - 2] + 1.414);
        shoreDist[k] = d;
      }
    }
    for (let iz = N; iz >= 0; iz--) {
      for (let ix = N; ix >= 0; ix--) {
        const k = iz * (N + 1) + ix;
        let d = shoreDist[k];
        if (ix < N) d = Math.min(d, shoreDist[k + 1] + 1);
        if (iz < N) d = Math.min(d, shoreDist[k + (N + 1)] + 1);
        if (ix < N && iz < N) d = Math.min(d, shoreDist[k + N + 2] + 1.414);
        shoreDist[k] = d;
      }
    }

    const wPos: number[] = [];
    const wDepth: number[] = [];
    const wShore: number[] = [];
    const wEdge: number[] = [];
    const wIdx: number[] = [];
    const vertMap = new Int32Array((N + 1) * (N + 1)).fill(-1);
    const stepSize = (half * 2) / N;

    for (let iz = 0; iz < N; iz++) {
      for (let ix = 0; ix < N; ix++) {
        const ks = [
          iz * (N + 1) + ix,
          iz * (N + 1) + (ix + 1),
          (iz + 1) * (N + 1) + ix,
          (iz + 1) * (N + 1) + (ix + 1),
        ];
        if (!ks.some(isWet)) continue;
        const cIds: number[] = [];
        for (const k of ks) {
          if (vertMap[k] === -1) {
            vertMap[k] = wPos.length / 3;
            const ixk = k % (N + 1);
            const izk = Math.floor(k / (N + 1));
            const uAbs = Math.abs(-1 + (2 * ixk) / N);
            const vAbs = Math.abs(-1 + (2 * izk) / N);
            wPos.push(xs[k], wl, zs[k]);
            wDepth.push(wl - hs[k]);
            wShore.push(clamp((shoreDist[k] * stepSize) / 2.2, 0, 1));
            wEdge.push(Math.max(uAbs, vAbs));
          }
          cIds.push(vertMap[k]);
        }
        wIdx.push(cIds[0], cIds[2], cIds[1], cIds[1], cIds[2], cIds[3]);
      }
    }

    if (wIdx.length > 0) {
      const wTopGeo = new THREE.BufferGeometry();
      wTopGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
      wTopGeo.setAttribute('aDepth', new THREE.Float32BufferAttribute(wDepth, 1));
      wTopGeo.setAttribute('aShore', new THREE.Float32BufferAttribute(wShore, 1));
      wTopGeo.setAttribute('aEdge', new THREE.Float32BufferAttribute(wEdge, 1));
      wTopGeo.setIndex(wIdx);
      wTopGeo.computeVertexNormals();
      wTopGeo.computeBoundingSphere();

      waterTopMesh = new THREE.Mesh(wTopGeo, createHeroWaterTopMaterial(spec));
      waterTopMesh.renderOrder = 2;
      waterTopMesh.userData.noShadow = true;
      waterTopMesh.userData.isWaterSurface = true;
      waterTopMesh.userData.shaderHandlesTide = spec.water.tracksTide;
    }

    const wwPos: number[] = [];
    const wwUv: number[] = [];
    const wwIdx: number[] = [];
    const emitWaterWall = (edgeIndices: number[], flip: boolean) => {
      const m = edgeIndices.length - 1;
      for (let i = 0; i < m; i++) {
        const k0 = edgeIndices[i];
        const k1 = edgeIndices[i + 1];
        if (!isWet(k0) && !isWet(k1)) continue;
        const b0 = Math.min(wl, hs[k0]);
        const b1 = Math.min(wl, hs[k1]);
        const base = wwPos.length / 3;
        wwPos.push(
          xs[k0], b0, zs[k0],
          xs[k0], wl, zs[k0],
          xs[k1], b1, zs[k1],
          xs[k1], wl, zs[k1]
        );
        wwUv.push(i / m, 0, i / m, 1, (i + 1) / m, 0, (i + 1) / m, 1);
        if (flip) {
          wwIdx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
        } else {
          wwIdx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        }
      }
    };

    emitWaterWall(frontEdge, true);
    emitWaterWall(backEdge, false);
    emitWaterWall(rightEdge, false);
    emitWaterWall(leftEdge, true);

    if (wwIdx.length > 0) {
      const wWallGeo = new THREE.BufferGeometry();
      wWallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wwPos, 3));
      wWallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wwUv, 2));
      wWallGeo.setIndex(wwIdx);
      wWallGeo.computeVertexNormals();
      wWallGeo.computeBoundingSphere();

      waterWallMesh = new THREE.Mesh(wWallGeo, createHeroWaterWallMaterial(spec));
      waterWallMesh.renderOrder = 3;
      waterWallMesh.userData.noShadow = true;
    }
  }

  return {
    terrainMesh,
    waterTopMesh,
    waterWallMesh,
    pedestalGroup,
    plinthOutlineGeo: getPlinthRingOutlineGeometry(sil, half),
    plinthOutlineY: baseY - 0.02,
    waterLevel: spec.water?.waterLevel,
    groundHeightAt,
  };
}

/**
 * Attaches built plinth meshes to a landmark group and registers metadata so
 * CitylitEngine adapts the glowing plinth collar to this site's silhouette.
 */
export function attachPilotPlinthToGroup(
  group: THREE.Group,
  built: BuiltPilotPlinth
): void {
  group.add(built.terrainMesh);
  group.add(built.pedestalGroup);
  if (built.waterTopMesh) group.add(built.waterTopMesh);
  if (built.waterWallMesh) group.add(built.waterWallMesh);
  group.userData.plinthOutlineGeo = built.plinthOutlineGeo;
  group.userData.plinthOutlineY = built.plinthOutlineY;
}

/** Helper to sample deterministic surface color noise for `topColorAt` callbacks. */
export function terrainSurfaceNoise(x: number, z: number): number {
  return noise2(x * 0.9, z * 0.9) * 0.65 + noise2(x * 2.4 + 4.2, z * 2.4 - 1.8) * 0.35;
}

export { clamp };
