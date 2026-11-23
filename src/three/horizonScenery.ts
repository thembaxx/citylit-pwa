import * as THREE from 'three';
import type { LandmarkBiome } from '../types/citylit';
import { resolveRegionalPalette } from '../lib/biomePalette';
import type { RegionalPaletteKey } from '../lib/biomePalette';
import { getSoftTexture, WU } from './shaders';

export interface HorizonUpdateOptions {
  fogColor: THREE.Color;
  skyColor: THREE.Color;
  sunGlow: THREE.Color;
  /** City-specific colour pumped into the sky by its street lighting. */
  pollutionTint: THREE.Color;
  hor: number;
  night: number;
  rain: number;
  studioWeight: number;
}

export interface HorizonSceneryController {
  root: THREE.Group;
  setBiome: (biome: LandmarkBiome) => void;
  setSiteTint: (horizonHex: string) => void;
  /** Select the far silhouette: a named site signature, else its region fallback. */
  setSiteSignature: (name: string, biome: LandmarkBiome) => void;
  setHidden: (hidden: boolean) => void;
  update: (dt: number, motionScale: number, opts: HorizonUpdateOptions) => void;
  dispose: () => void;
}

interface BiomeWeights {
  mountain: number;
  dune: number;
  coastal: number;
  urban: number;
}

function weightsForBiome(biome: LandmarkBiome): BiomeWeights {
  switch (biome) {
    case 'mountain':
    case 'waterfall':
      return { mountain: 1, dune: 0, coastal: 0, urban: 0 };
    case 'desert':
    case 'savannah':
      return { mountain: 0.2, dune: 0.85, coastal: 0, urban: 0 };
    case 'coastal':
    case 'wetland':
      return { mountain: 0.18, dune: 0, coastal: 1, urban: 0 };
    case 'urban':
      return { mountain: 0.15, dune: 0, coastal: 0, urban: 1 };
    default:
      return { mountain: 0.6, dune: 0.2, coastal: 0, urban: 0 };
  }
}

/**
 * Phase 1 far-field signatures: a handful of low boxes composed into a recognizable
 * distant form per region, instanced into a single draw call on the outermost ring.
 * `angle` is a small tangential offset in radians, `y` a lift above the ring base,
 * and `tilt` a lean about the local radial axis (for mine-headgear A-frames).
 */
interface SignaturePart {
  readonly angle: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly tilt?: number;
}

const SIGNATURE_RADIUS = 56.8;
const SIGNATURE_BASE_Y = -1.4;
const SIGNATURE_SECTORS = 6;
const SIGNATURE_MAX_PARTS = 4;

const SIGNATURE_PARTS: Readonly<Record<RegionalPaletteKey, readonly SignaturePart[]>> = {
  // Flat-topped table mountain with a lower shoulder and a small Lion's Head step.
  fynbos: [
    { angle: 0, y: 0, width: 8.2, height: 2.0, depth: 1.2 },
    { angle: -0.09, y: 0, width: 3.6, height: 1.25, depth: 1.0 },
    { angle: 0.1, y: 0, width: 2.4, height: 0.85, depth: 0.9 },
  ],
  // Two distant lighthouse towers, one with a lantern cap (Cape Point / Agulhas).
  cape: [
    { angle: -0.035, y: 0, width: 2.4, height: 0.45, depth: 1.4 },
    { angle: -0.035, y: 0.45, width: 0.85, height: 2.5, depth: 0.85 },
    { angle: -0.035, y: 2.95, width: 1.35, height: 0.42, depth: 1.05 },
    { angle: 0.055, y: 0, width: 0.6, height: 1.7, depth: 0.6 },
  ],
  // Stepped Highveld skyline with a low stone-dome mass.
  highveld: [
    { angle: -0.06, y: 0, width: 2.6, height: 1.5, depth: 1.0 },
    { angle: -0.01, y: 0, width: 1.5, height: 2.6, depth: 1.0 },
    { angle: 0.045, y: 0, width: 3.0, height: 1.1, depth: 1.0 },
    { angle: 0.1, y: 0, width: 1.8, height: 1.9, depth: 1.0 },
  ],
  // Kimberley mine headgear: leaning A-frame, pulley beam and a low spoil dump.
  karoo: [
    { angle: -0.02, y: 0, width: 0.38, height: 2.7, depth: 0.7, tilt: 0.28 },
    { angle: 0.02, y: 0, width: 0.38, height: 2.7, depth: 0.7, tilt: -0.28 },
    { angle: 0, y: 2.6, width: 1.6, height: 0.35, depth: 0.7 },
    { angle: 0.09, y: 0, width: 2.8, height: 0.85, depth: 1.2 },
  ],
  // Drakensberg-style escarpment spine with two stepped shoulders.
  kzn: [
    { angle: 0, y: 0, width: 7.0, height: 2.5, depth: 1.1 },
    { angle: -0.085, y: 0, width: 3.2, height: 1.4, depth: 1.0 },
    { angle: 0.085, y: 0, width: 2.6, height: 1.1, depth: 1.0 },
  ],
  // Knysna-style heads: two headlands framing a low waterline gap.
  forest: [
    { angle: -0.06, y: 0, width: 3.4, height: 2.3, depth: 1.1 },
    { angle: 0.06, y: 0, width: 3.0, height: 1.7, depth: 1.1 },
    { angle: 0, y: 0, width: 2.0, height: 0.55, depth: 0.9 },
  ],
  // Crater dome with a low crown and a pair of rondavel-like steps.
  limpopo: [
    { angle: 0, y: 0, width: 5.2, height: 1.6, depth: 1.2 },
    { angle: -0.05, y: 1.6, width: 2.8, height: 0.7, depth: 1.0 },
    { angle: 0.07, y: 0, width: 1.8, height: 1.25, depth: 0.9 },
    { angle: -0.1, y: 0, width: 1.4, height: 2.0, depth: 0.8 },
  ],
  // Low bay skyline of stepped waterfront blocks.
  coastal: [
    { angle: -0.07, y: 0, width: 3.2, height: 1.3, depth: 1.0 },
    { angle: -0.01, y: 0, width: 2.0, height: 1.9, depth: 1.0 },
    { angle: 0.055, y: 0, width: 3.6, height: 1.1, depth: 1.0 },
  ],
};

/**
 * Named sites get their own far silhouette instead of sharing a regional one.
 * These are low-contrast recognition cues only — never survey geometry — and
 * stay within SIGNATURE_MAX_PARTS so the instanced batch keeps one draw call.
 */
const SITE_SIGNATURES: Readonly<Record<string, readonly SignaturePart[]>> = {
  'table mountain': [
    { angle: 0, y: 0, width: 8.4, height: 1.9, depth: 1.2 },
    { angle: -0.1, y: 0, width: 2.1, height: 1.15, depth: 0.9 },
    { angle: 0.11, y: 0, width: 2.8, height: 1.35, depth: 0.9 },
  ],
  'chapman': [
    { angle: 0, y: 0, width: 7.2, height: 2.6, depth: 1.1 },
    { angle: -0.09, y: 0, width: 2.4, height: 1.2, depth: 0.9 },
  ],
  'cape point': [
    { angle: -0.04, y: 0, width: 4.2, height: 1.7, depth: 1.1 },
    { angle: -0.04, y: 1.7, width: 0.7, height: 2.0, depth: 0.7 },
    { angle: -0.04, y: 3.7, width: 1.1, height: 0.32, depth: 0.8 },
  ],
  'cape agulhas': [
    { angle: -0.03, y: 0, width: 0.9, height: 2.3, depth: 0.8 },
    { angle: -0.03, y: 2.3, width: 1.25, height: 0.4, depth: 0.85 },
    { angle: 0.07, y: 0, width: 2.6, height: 0.8, depth: 1.0 },
  ],
  'drakensberg': [
    { angle: 0, y: 0, width: 8.6, height: 2.9, depth: 1.1 },
    { angle: -0.09, y: 0, width: 3.4, height: 1.6, depth: 1.0 },
    { angle: 0.09, y: 0, width: 2.8, height: 1.3, depth: 1.0 },
  ],
  'sani pass': [
    { angle: 0, y: 0, width: 6.2, height: 3.1, depth: 1.1 },
    { angle: -0.08, y: 0, width: 2.6, height: 1.8, depth: 0.9 },
  ],
  'three rondavels': [
    { angle: -0.05, y: 0, width: 2.0, height: 3.0, depth: 1.0 },
    { angle: 0.01, y: 0, width: 2.2, height: 3.4, depth: 1.0 },
    { angle: 0.07, y: 0, width: 1.9, height: 2.6, depth: 1.0 },
  ],
  'orlando towers': [
    { angle: -0.035, y: 0, width: 1.5, height: 3.0, depth: 1.1 },
    { angle: 0.035, y: 0, width: 1.5, height: 3.0, depth: 1.1 },
    { angle: 0, y: 1.4, width: 3.2, height: 0.22, depth: 0.8 },
  ],
  'soweto': [
    { angle: -0.035, y: 0, width: 1.5, height: 3.0, depth: 1.1 },
    { angle: 0.035, y: 0, width: 1.5, height: 3.0, depth: 1.1 },
  ],
  'ponte city': [
    { angle: 0, y: 0, width: 1.9, height: 5.2, depth: 1.3 },
    { angle: 0, y: 5.2, width: 2.2, height: 0.35, depth: 1.0 },
  ],
  'moses mabhida': [
    { angle: 0, y: 0, width: 6.8, height: 0.7, depth: 1.2 },
    { angle: 0, y: 0.7, width: 1.0, height: 3.3, depth: 0.9, tilt: 0.32 },
    { angle: 0.06, y: 0.7, width: 1.0, height: 3.3, depth: 0.9, tilt: -0.32 },
  ],
  'nelson mandela bridge': [
    { angle: -0.05, y: 0, width: 0.55, height: 3.4, depth: 0.8 },
    { angle: 0.05, y: 0, width: 0.55, height: 2.2, depth: 0.8 },
    { angle: 0, y: 1.5, width: 7.0, height: 0.24, depth: 0.8 },
  ],
  'voortrekker': [
    { angle: 0, y: 0, width: 3.8, height: 3.2, depth: 1.5 },
    { angle: 0, y: 3.2, width: 2.4, height: 0.8, depth: 1.2 },
  ],
  'the big hole': [
    { angle: 0, y: 0, width: 5.0, height: 0.55, depth: 1.2 },
    { angle: -0.03, y: 0.55, width: 0.4, height: 2.6, depth: 0.7, tilt: 0.26 },
    { angle: 0.03, y: 0.55, width: 0.4, height: 2.6, depth: 0.7, tilt: -0.26 },
  ],
  'knysna': [
    { angle: -0.06, y: 0, width: 3.4, height: 2.4, depth: 1.1 },
    { angle: 0.06, y: 0, width: 3.0, height: 1.8, depth: 1.1 },
  ],
  'augrabies': [
    { angle: 0, y: 0, width: 6.0, height: 2.4, depth: 1.1 },
    { angle: 0.05, y: 0.6, width: 0.7, height: 1.5, depth: 0.7 },
  ],
  'robben island': [
    { angle: -0.03, y: 0, width: 3.6, height: 0.6, depth: 1.2 },
    { angle: -0.03, y: 0.6, width: 0.6, height: 1.8, depth: 0.7 },
  ],
};

/** Apostrophes/quotes resolve identically; exact keys win over fragments. */
function resolveSignatureParts(name: string, biome: LandmarkBiome): readonly SignaturePart[] {
  const key = name.replace(/[’‘`]/g, "'").trim().toLowerCase();
  const exact = SITE_SIGNATURES[key];
  if (exact) return exact;
  for (const [candidate, parts] of Object.entries(SITE_SIGNATURES)) {
    if (key.includes(candidate)) return parts;
  }
  const region = resolveRegionalPalette(name, biome)?.region ?? 'fynbos';
  return SIGNATURE_PARTS[region];
}

function createHorizonRing(
  radius: number,
  height: number,
  seed: number,
  layerAlpha: number
): { mesh: THREE.Mesh; mat: THREE.ShaderMaterial } {
  const radialSegs = 112;
  const geo = new THREE.CylinderGeometry(radius, radius, height, radialSegs, 2, true);
  geo.translate(0, height * 0.5 - 1.4, 0);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uBaseCol: { value: new THREE.Color('#2d3c4e') },
      uHorizonCol: { value: new THREE.Color('#7fa3c4') },
      uGlowCol: { value: new THREE.Color('#ff9d5c') },
      uSiteHor: { value: new THREE.Color('#6fa6cc') },
      uHor: { value: 0 },
      uNight: { value: 0 },
      uTime: { value: 0 },
      uWeights: { value: new THREE.Vector4(1, 0, 0, 0) }, // mountain, dune, coastal, urban
      uSeed: { value: seed },
      uAlpha: { value: layerAlpha },
      uHaze: { value: 0 },
      uPollution: WU.pollution,
      uPolCol: { value: new THREE.Color('#ff9a52') },
    },
    vertexShader: /* glsl */ `
      uniform vec4 uWeights;
      uniform float uSeed;
      varying float vElev;
      varying float vAngle;
      varying vec3 vWorldPos;

      float hash1(float n) { return fract(sin(n) * 43758.5453123); }

      void main() {
        vec3 pos = position;
        float ang = atan(pos.z, pos.x);
        float topMask = smoothstep(-1.3, 0.2, pos.y);

        // Mountain & escarpment ridges
        float mtn = (sin(ang * 3.0 + uSeed) * 0.5 + 0.5) * 0.52
                  + (sin(ang * 7.0 - uSeed * 1.4) * 0.5 + 0.5) * 0.30
                  + (sin(ang * 13.0 + uSeed * 2.1) * 0.5 + 0.5) * 0.18;

        // Rolling Kalahari dunes / savannah mesas
        float dune = pow(sin(ang * 2.0 + uSeed * 0.7) * 0.5 + 0.5, 1.4) * 0.52
                   + (sin(ang * 5.0 - uSeed * 0.9) * 0.5 + 0.5) * 0.18;

        // Coastal ocean horizon with gentle distant headland
        float coast = pow(max(0.0, sin(ang * 2.0 + uSeed * 1.7)), 6.0) * 0.58 + 0.08;

        // Stepped Highveld urban skyline blocks
        float sector = floor((ang + 3.14159) / 0.16);
        float blk = hash1(sector + uSeed * 11.0);
        float urb = step(0.42, blk) * (0.24 + blk * 0.48);

        float profile = mtn * uWeights.x + dune * uWeights.y + coast * uWeights.z + urb * uWeights.w;
        float lift = (0.35 + profile * 4.6) * topMask;
        pos.y = mix(-1.4, -1.4 + lift, topMask);

        vElev = topMask * clamp(profile, 0.0, 1.0);
        vAngle = ang;
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBaseCol;
      uniform vec3 uHorizonCol;
      uniform vec3 uGlowCol;
      uniform vec3 uSiteHor;
      uniform vec4 uWeights;
      uniform float uHor;
      uniform float uNight;
      uniform float uTime;
      uniform float uSeed;
      uniform float uAlpha;
      uniform float uHaze;
      uniform float uPollution;
      uniform vec3 uPolCol;
      varying float vElev;
      varying float vAngle;
      varying vec3 vWorldPos;

      float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

      void main() {
        vec3 base = mix(uBaseCol, uSiteHor * 0.55, 0.22);
        vec3 horC = mix(uHorizonCol, uSiteHor, 0.26);
        vec3 col = mix(base, horC, 0.32 + vElev * 0.56);

        // Soft upper-crest rim glow (golden dusk & silver moonlight catchlight)
        float crestRim = smoothstep(0.45, 0.92, vElev);
        col += uGlowCol * uHor * (0.24 + 0.32 * crestRim);
        col += vec3(0.42, 0.58, 0.88) * uNight * crestRim * 0.12;

        // Distant urban skyline twinkling window bands at dusk & night
        if (uWeights.w > 0.15 && uNight > 0.1) {
          vec2 cell = vec2(floor((vAngle + 3.14159) * 38.0), floor((vWorldPos.y + 1.4) * 14.0));
          float wLit = step(0.84, hash2(cell + uSeed * 7.0));
          float bandMask = smoothstep(0.06, 0.24, vElev) * (1.0 - smoothstep(0.55, 0.85, vElev));
          float twinkle = 0.72 + 0.28 * sin(uTime * 1.4 + hash2(cell) * 18.0);
          vec3 winCol = mix(vec3(1.0, 0.76, 0.42), vec3(0.75, 0.88, 1.0), step(0.7, hash2(cell + 3.1)));
          col += winCol * wLit * bandMask * uWeights.w * uNight * twinkle * 0.46;
        }

        // Distant coastal sea horizon shimmer + urban harbour sky-glow catching twilight / moonlight
        if (uWeights.z > 0.2) {
          float seaBelt = smoothstep(0.22, 0.02, vElev) * smoothstep(-1.35, -0.7, vWorldPos.y);
          float shimmer = 0.5 + 0.5 * sin(vAngle * 24.0 + uTime * 1.1 + uSeed);
          col += mix(uGlowCol, vec3(0.74, 0.89, 1.0), uNight * 0.72) * seaBelt * shimmer * uWeights.z * (0.14 + uHor * 0.26 + uNight * 0.14);
        }
        if (uNight > 0.12 && (uWeights.w > 0.15 || uWeights.z > 0.35)) {
          float belt = smoothstep(-1.35, -0.5, vWorldPos.y) * (1.0 - smoothstep(0.05, 0.42, vElev));
          vec3 glowTint = mix(vec3(0.32, 0.46, 0.72), vec3(0.95, 0.62, 0.32), uWeights.w);
          col += glowTint * belt * uNight * 0.18;
        }

        // Faint southern starlight catching the far crest. Uses only existing
        // night/haze/studio uniforms, stays behind the horizon fade and is far
        // too low-contrast to compete with the landmark hero.
        if (uNight > 0.2 && uHaze > 0.1) {
          float starCrest = smoothstep(0.5, 0.94, vElev)
                          * (0.5 + 0.5 * sin(vAngle * 19.0 + uSeed * 2.0));
          col += vec3(0.20, 0.28, 0.46) * starCrest * uNight * (1.0 - uHaze) * 0.045;
        }

        // Sodium light-pollution dome over inhabited biomes at night, scaled by
        // how many rooms are actually lit so the sky tracks the city, not the clock.
        if (uNight > 0.05) {
          float dome = smoothstep(0.62, 0.02, vElev) * smoothstep(-1.5, -0.45, vWorldPos.y);
          vec3 sodium = mix(vec3(0.34, 0.42, 0.62), uPolCol, uWeights.w);
          float occupancy = 0.35 + uPollution * 1.35;
          col += sodium * dome * uNight * occupancy * (0.05 + uWeights.w * 0.2 + uWeights.z * 0.07);
        }

        // Aerial perspective: distant layers desaturate and dissolve toward the
        // horizon colour instead of reading as flat cut-out silhouettes.
        float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
        vec3 hazed = mix(uHorizonCol, vec3(lum) * 0.9 + uHorizonCol * 0.4, 0.5);
        col = mix(col, hazed, uHaze * (0.6 + 0.4 * (1.0 - vElev)));

        // Vertical atmospheric fade: soft at the top ridge crest and solid near horizon bottom.
        float alpha = uAlpha * (1.0 - smoothstep(0.68, 1.0, vElev)) * smoothstep(-1.45, -0.35, vWorldPos.y);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  mat.userData.noDissolve = true;

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -2;
  mesh.userData.noShadow = true;
  mesh.userData.cannotReceiveAO = true;
  return { mesh, mat };
}

/**
 * Far-horizon South African relief silhouettes (3 atmospheric depth layers) & wet
 * ground reflection catcher + stage aura beneath the diorama plinth so outdoor scenes
 * feel anchored in screen depth.
 */
export function createHorizonScenery(scene: THREE.Scene): HorizonSceneryController {
  const root = new THREE.Group();
  scene.add(root);

  const nearRidge = createHorizonRing(28, 5.8, 0.4, 0.52);
  const midRidge = createHorizonRing(41, 7.4, 1.55, 0.34);
  const farRidge = createHorizonRing(57, 9.6, 2.9, 0.2);
  root.add(nearRidge.mesh, midRidge.mesh, farRidge.mesh);

  // One shared box geometry + one shared material for every far silhouette. The
  // instance pool is resized (via `count`) when a site signature is selected, so
  // this adds a single draw call and at most 4*6*12 = 288 triangles.
  const signatureGeo = new THREE.BoxGeometry(1, 1, 1);
  const signatureMat = new THREE.MeshBasicMaterial({
    color: '#3c4656',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  signatureMat.userData.noDissolve = true;
  const signatureMesh = new THREE.InstancedMesh(
    signatureGeo,
    signatureMat,
    SIGNATURE_MAX_PARTS * SIGNATURE_SECTORS
  );
  signatureMesh.count = 0;
  signatureMesh.visible = false;
  signatureMesh.frustumCulled = false;
  signatureMesh.renderOrder = -1.8;
  signatureMesh.userData.noShadow = true;
  signatureMesh.userData.cannotReceiveAO = true;
  root.add(signatureMesh);

  // Distant stage sheen & moonlight / sunset specular water path outside the floating island footprint.
  const groundMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uGroundCol: { value: new THREE.Color('#0e131d') },
      uGlowCol: { value: new THREE.Color('#ff9d5c') },
      uOpacity: { value: 0.4 },
      uNight: { value: 0 },
      uHor: { value: 0 },
      uRain: { value: 0 },
      uCoastal: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uGroundCol, uGlowCol;
      uniform float uOpacity, uNight, uHor, uRain, uCoastal, uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        float r = length((vUv - 0.5) * 2.0);
        if (r >= 1.0) discard;
        float radialFade = pow(1.0 - r, 1.65);
        vec3 col = uGroundCol;
        float alpha = radialFade * uOpacity;
        // Outer stage moonlit / golden-hour ripple sheen on coastal sites and wet nights
        float waterMix = max(uCoastal, uRain * 0.75);
        if (waterMix > 0.05 && r > 0.34) {
          vec2 dir = normalize(vWorldPos.xz + vec2(0.0001));
          float trackAlign = pow(max(0.0, dot(dir, normalize(vec2(-0.52, -0.85)))), 4.0);
          float ripple = 0.5 + 0.5 * sin(vWorldPos.x * 2.4 + vWorldPos.z * 3.1 - uTime * 1.4);
          float rippleFine = 0.5 + 0.5 * cos(vWorldPos.x * 5.1 - vWorldPos.z * 4.4 + uTime * 1.9);
          float sheen = trackAlign * (ripple * 0.6 + rippleFine * 0.4) * smoothstep(0.34, 0.56, r) * (1.0 - r);
          vec3 sheenCol = mix(vec3(0.68, 0.84, 1.0), uGlowCol, uHor * (1.0 - uNight * 0.6));
          float sheenAmt = sheen * waterMix * (0.28 * uNight + 0.36 * uHor + 0.18 * uRain);
          col += sheenCol * sheenAmt * 1.4;
          alpha += sheenAmt * 0.35;
        }
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.88));
      }
    `,
  });
  groundMat.userData.noDissolve = true;
  const groundCatcher = new THREE.Mesh(new THREE.CircleGeometry(21.5, 56), groundMat);
  groundCatcher.rotation.x = -Math.PI / 2;
  groundCatcher.position.y = -0.715;
  groundCatcher.receiveShadow = false;
  groundCatcher.castShadow = false;
  groundCatcher.renderOrder = -1;
  groundCatcher.userData.noShadow = true;
  groundCatcher.userData.cannotReceiveAO = true;
  root.add(groundCatcher);

  // Soft stage aura beneath the floating strata rock mass for crisp depth separation.
  const stageAuraMat = new THREE.MeshBasicMaterial({
    map: getSoftTexture(),
    color: '#070a12',
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  stageAuraMat.userData.noDissolve = true;
  const stageAura = new THREE.Mesh(new THREE.CircleGeometry(14.5, 40), stageAuraMat);
  stageAura.rotation.x = -Math.PI / 2;
  stageAura.position.y = -0.74;
  stageAura.renderOrder = -2;
  stageAura.userData.noShadow = true;
  stageAura.userData.cannotReceiveAO = true;
  root.add(stageAura);

  const currentWeights: BiomeWeights = { mountain: 1, dune: 0, coastal: 0, urban: 0 };
  const targetWeights: BiomeWeights = { mountain: 1, dune: 0, coastal: 0, urban: 0 };
  const currentSiteHor = new THREE.Color('#6fa6cc');
  const targetSiteHor = new THREE.Color('#6fa6cc');
  const tmpBase = new THREE.Color();
  const tmpHorizon = new THREE.Color();
  const tmpGround = new THREE.Color();

  // Preallocated scratch for the far silhouette batch: no per-frame allocations.
  const signatureBase = new THREE.Color('#3c4656');
  const tmpSigColor = new THREE.Color();
  const tmpPaletteDark = new THREE.Color();
  const tmpPaletteLight = new THREE.Color();
  const tmpPaletteRim = new THREE.Color();
  const sigPos = new THREE.Vector3();
  const sigScale = new THREE.Vector3();
  const sigYAxis = new THREE.Vector3(0, 1, 0);
  const sigZAxis = new THREE.Vector3(0, 0, 1);
  const sigQuatYaw = new THREE.Quaternion();
  const sigQuatTilt = new THREE.Quaternion();
  const sigQuat = new THREE.Quaternion();
  const sigMatrix = new THREE.Matrix4();
  let signatureAlpha = 0;
  let signatureReady = false;

  let hidden = false;
  let elapsed = 0;

  const setBiome = (biome: LandmarkBiome) => {
    const next = weightsForBiome(biome);
    targetWeights.mountain = next.mountain;
    targetWeights.dune = next.dune;
    targetWeights.coastal = next.coastal;
    targetWeights.urban = next.urban;
  };

  const setSiteTint = (horizonHex: string) => {
    targetSiteHor.set(horizonHex);
  };

  const setSiteSignature: HorizonSceneryController['setSiteSignature'] = (name, biome) => {
    // Colour still follows the region; only the silhouette can be site-specific.
    const palette = resolveRegionalPalette(name, biome);
    tmpPaletteDark.set(palette?.aoShadowColor ?? '#181a2a');
    tmpPaletteLight.set(palette?.skyHorizonTint ?? '#a5b3c1');
    tmpPaletteRim.set(palette?.rimColor ?? '#e3c3c0');
    signatureBase.copy(tmpPaletteDark).lerp(tmpPaletteLight, 0.62).lerp(tmpPaletteRim, 0.08);

    const parts = resolveSignatureParts(name, biome);
    for (let s = 0; s < SIGNATURE_SECTORS; s++) {
      const sectorAngle = (s / SIGNATURE_SECTORS) * Math.PI * 2;
      for (let p = 0; p < parts.length; p++) {
        const part = parts[p];
        const a = sectorAngle + part.angle;
        sigPos.set(
          Math.sin(a) * SIGNATURE_RADIUS,
          SIGNATURE_BASE_Y + part.y + part.height * 0.5,
          Math.cos(a) * SIGNATURE_RADIUS
        );
        sigQuatYaw.setFromAxisAngle(sigYAxis, a);
        sigQuatTilt.setFromAxisAngle(sigZAxis, part.tilt ?? 0);
        sigQuat.copy(sigQuatYaw).multiply(sigQuatTilt);
        sigScale.set(part.width, part.height, part.depth);
        sigMatrix.compose(sigPos, sigQuat, sigScale);
        signatureMesh.setMatrixAt(p * SIGNATURE_SECTORS + s, sigMatrix);
      }
    }
    signatureMesh.count = parts.length * SIGNATURE_SECTORS;
    signatureMesh.instanceMatrix.needsUpdate = true;
    signatureMesh.visible = true;
    signatureReady = true;
  };

  const setHidden = (nextHidden: boolean) => {
    hidden = nextHidden;
    root.visible = !hidden;
  };

  const update: HorizonSceneryController['update'] = (dt, motionScale, opts) => {
    const visible = !hidden && opts.studioWeight < 0.985;
    root.visible = visible;
    if (!visible) return;

    const safeDt = Math.max(0, dt);
    elapsed += safeDt * motionScale;
    const k = motionScale === 0 ? 1 : 1 - Math.exp(-safeDt * 2.2);
    currentWeights.mountain += (targetWeights.mountain - currentWeights.mountain) * k;
    currentWeights.dune += (targetWeights.dune - currentWeights.dune) * k;
    currentWeights.coastal += (targetWeights.coastal - currentWeights.coastal) * k;
    currentWeights.urban += (targetWeights.urban - currentWeights.urban) * k;
    currentSiteHor.lerp(targetSiteHor, k);

    const studioFade = 1 - opts.studioWeight;

    // Blend silhouette hues between sky tint and horizon fog so ridges sit smoothly in distance bands.
    tmpBase.copy(opts.fogColor).lerp(opts.skyColor, 0.2);
    tmpHorizon.copy(opts.fogColor).lerp(opts.skyColor, 0.44);

    const layers = [
      { ring: nearRidge, alpha: 0.52 - opts.night * 0.1, horScale: 1.0, baseLerp: 0.0, haze: 0.06 },
      { ring: midRidge, alpha: 0.34 - opts.night * 0.07, horScale: 0.85, baseLerp: 0.45, haze: 0.28 },
      { ring: farRidge, alpha: 0.2 - opts.night * 0.05, horScale: 0.7, baseLerp: 0.85, haze: 0.55 },
    ];

    for (let i = 0; i < layers.length; i++) {
      const l = layers[i];
      const u = l.ring.mat.uniforms;
      u.uWeights.value.set(
        currentWeights.mountain,
        currentWeights.dune,
        currentWeights.coastal,
        currentWeights.urban
      );
      u.uBaseCol.value.lerp(tmpBase, k).lerp(tmpHorizon, l.baseLerp * k);
      u.uHorizonCol.value.lerp(tmpHorizon, k);
      u.uGlowCol.value.lerp(opts.sunGlow, k);
      u.uSiteHor.value.copy(currentSiteHor);
      u.uHor.value += (opts.hor * l.horScale - u.uHor.value) * k;
      u.uNight.value += (opts.night - u.uNight.value) * k;
      u.uTime.value = elapsed;
      const targetAlpha = l.alpha * studioFade;
      u.uAlpha.value += (targetAlpha - u.uAlpha.value) * k;
      u.uHaze.value += (l.haze + opts.rain * 0.18 - u.uHaze.value) * k;
      u.uPolCol.value.lerp(opts.pollutionTint, k);
    }

    // Far silhouettes follow the same haze/studio/night contract as the rings,
    // but stay deliberately faint so they never compete with the landmark hero.
    if (signatureReady) {
      tmpSigColor.copy(signatureBase).lerp(tmpBase, 0.42).lerp(opts.skyColor, 0.1);
      tmpSigColor.lerp(opts.sunGlow, opts.hor * 0.05);
      tmpSigColor.lerp(opts.fogColor, opts.night * 0.12);
      signatureMat.color.copy(tmpSigColor);
      const targetSigAlpha = (0.19 - opts.night * 0.045) * (1 - opts.rain * 0.28) * studioFade;
      signatureAlpha += (targetSigAlpha - signatureAlpha) * k;
      signatureMat.opacity = signatureAlpha;
    }

    // Ground catcher takes subtle rain wetness sheen, ambient sky bounce, & coastal moon track.
    tmpGround.copy(opts.fogColor).multiplyScalar(0.32 + (1 - opts.night) * 0.18);
    const targetOpacity = (0.36 + opts.rain * 0.16) * studioFade;
    groundMat.uniforms.uGroundCol.value.lerp(tmpGround, k);
    groundMat.uniforms.uGlowCol.value.lerp(opts.sunGlow, k);
    groundMat.uniforms.uOpacity.value += (targetOpacity - groundMat.uniforms.uOpacity.value) * k;
    groundMat.uniforms.uNight.value += (opts.night - groundMat.uniforms.uNight.value) * k;
    groundMat.uniforms.uHor.value += (opts.hor - groundMat.uniforms.uHor.value) * k;
    groundMat.uniforms.uRain.value += (opts.rain - groundMat.uniforms.uRain.value) * k;
    groundMat.uniforms.uCoastal.value = currentWeights.coastal;
    groundMat.uniforms.uTime.value = elapsed;

    stageAuraMat.opacity = (0.32 + (1 - opts.night) * 0.08) * studioFade;
  };

  const dispose = () => {
    scene.remove(root);
    nearRidge.mesh.geometry.dispose();
    nearRidge.mat.dispose();
    midRidge.mesh.geometry.dispose();
    midRidge.mat.dispose();
    farRidge.mesh.geometry.dispose();
    farRidge.mat.dispose();
    signatureMesh.dispose();
    signatureGeo.dispose();
    signatureMat.dispose();
    groundCatcher.geometry.dispose();
    groundMat.dispose();
    stageAura.geometry.dispose();
    stageAuraMat.dispose();
  };

  return {
    root,
    setBiome,
    setSiteTint,
    setSiteSignature,
    setHidden,
    update,
    dispose,
  };
}

