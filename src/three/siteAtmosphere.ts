import * as THREE from 'three';
import type { LandmarkBiome } from '../types/citylit';
import { SKY_NOISE_GLSL } from './shaders';

/**
 * Engine-level atmosphere that wraps the hero diorama in a local weather shell.
 * It sits behind and around the landmark, so it works for any builder and can
 * fade between biomes without rebuilding landmark geometry.
 */
export type AtmosphereEffect =
  | 'ridgeFog'
  | 'tableCloth'
  | 'heatHaze'
  | 'seaMist'
  | 'sprayMist'
  | 'dustHaze'
  | 'urbanSmog';

export interface AtmosphereSite {
  key: string;
  biome: LandmarkBiome;
}

export interface AtmosphereUpdateOptions {
  qualityIndex: number;
  motionScale: number;
  /** 0 = full day, 1 = night. */
  night: number;
  rain: number;
  fog: number;
  cover: number;
  wind: number;
  /** Scene fog colour, already tinted for the current time of day. */
  fogColor: THREE.Color;
}

export interface AtmosphereSceneController {
  root: THREE.Group;
  setSite: (site: AtmosphereSite | null) => void;
  setHidden: (hidden: boolean) => void;
  update: (dt: number, elapsed: number, options: AtmosphereUpdateOptions) => void;
  dispose: () => void;
}

type EffectWeights = Record<AtmosphereEffect, number>;

interface LayerSpec {
  effect: AtmosphereEffect;
  radius: number;
  height: number;
  y: number;
  /** Opacity multiplier for this individual ring. */
  base: number;
  /** Noise density multiplier for this individual ring. */
  density: number;
  /** Slow orbital drift, radians per second. */
  spin: number;
  seed: number;
  /** 0 = layered fog, 2 = rising heat shimmer. */
  mode: number;
  additive: boolean;
}

interface AtmosphereLayer {
  effect: AtmosphereEffect;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  spec: LayerSpec;
  tint: THREE.Color;
}

interface AtmosphereProfile {
  weights: EffectWeights;
}

const EFFECT_TINTS: Record<AtmosphereEffect, string> = {
  ridgeFog: '#dbe7f0',
  tableCloth: '#eef4f8',
  heatHaze: '#ffcf96',
  seaMist: '#dfeff7',
  sprayMist: '#eaf8ff',
  dustHaze: '#e9c48a',
  urbanSmog: '#c8c4c9',
};

const BIOME_EFFECTS: Record<LandmarkBiome, Partial<EffectWeights>> = {
  mountain: { ridgeFog: 0.82 },
  desert: { heatHaze: 0.95, dustHaze: 0.34 },
  waterfall: { sprayMist: 0.86, ridgeFog: 0.18 },
  coastal: { seaMist: 0.8 },
  wetland: { seaMist: 0.55, ridgeFog: 0.28 },
  savannah: { dustHaze: 0.5, heatHaze: 0.22 },
  urban: { urbanSmog: 0.36 },
};

/**
 * Named landmarks get a stronger, more characterful signature than their
 * biome default: Table Mountain's tablecloth, Kgalagadi's heat shimmer.
 */
const SITE_OVERRIDES: Record<string, Partial<EffectWeights>> = {
  'Table Mountain': { ridgeFog: 0.6, tableCloth: 1 },
  'Sani Pass': { ridgeFog: 1 },
  'Drakensberg Amphitheatre': { ridgeFog: 0.7, sprayMist: 0.55 },
  'Three Rondavels': { ridgeFog: 0.9 },
  'Golden Gate Highlands': { ridgeFog: 0.55, dustHaze: 0.18 },
  'Kgalagadi Red Dunes': { heatHaze: 1.2, dustHaze: 0.34 },
  Richtersveld: { heatHaze: 1.05, dustHaze: 0.26 },
  'The Big Hole': { heatHaze: 0.55, dustHaze: 0.46 },
  'Augrabies Falls': { sprayMist: 0.72, heatHaze: 0.2 },
  'Cape Point Lighthouse': { seaMist: 1, ridgeFog: 0.3 },
  'Hermanus Whale Watching': { seaMist: 0.95 },
  'iSimangaliso Wetland Park': { seaMist: 0.7, ridgeFog: 0.34 },
  'Kruger National Park': { dustHaze: 0.6, heatHaze: 0.28 },
};

const RING_SPECS: LayerSpec[] = [
  // Mountain fog banks, stacked to read as a slow-moving cloud sea.
  {
    effect: 'ridgeFog',
    radius: 10.4,
    height: 4.6,
    y: 1.5,
    base: 0.5,
    density: 0.85,
    spin: 0.015,
    seed: 0.2,
    mode: 0,
    additive: false,
  },
  {
    effect: 'ridgeFog',
    radius: 13.4,
    height: 6.4,
    y: 2,
    base: 0.4,
    density: 0.7,
    spin: -0.011,
    seed: 3.7,
    mode: 0,
    additive: false,
  },
  {
    effect: 'ridgeFog',
    radius: 16.8,
    height: 9,
    y: 2.8,
    base: 0.28,
    density: 0.55,
    spin: 0.007,
    seed: 7.1,
    mode: 0,
    additive: false,
  },

  // Coastal and wetland mist, sitting low around the plinth.
  {
    effect: 'seaMist',
    radius: 9.8,
    height: 1.9,
    y: 0.5,
    base: 0.55,
    density: 0.62,
    spin: 0.02,
    seed: 1.4,
    mode: 0,
    additive: false,
  },
  {
    effect: 'seaMist',
    radius: 12.6,
    height: 2.8,
    y: 0.9,
    base: 0.36,
    density: 0.45,
    spin: -0.014,
    seed: 5.2,
    mode: 0,
    additive: false,
  },

  // Waterfall spray haze, rising just above the rim.
  {
    effect: 'sprayMist',
    radius: 9.6,
    height: 2.4,
    y: 0.7,
    base: 0.5,
    density: 0.7,
    spin: 0.024,
    seed: 2.2,
    mode: 0,
    additive: false,
  },
  {
    effect: 'sprayMist',
    radius: 11.5,
    height: 3.4,
    y: 1.1,
    base: 0.32,
    density: 0.5,
    spin: -0.018,
    seed: 6.4,
    mode: 0,
    additive: false,
  },

  // Dry-region dust veil.
  {
    effect: 'dustHaze',
    radius: 10.2,
    height: 2.3,
    y: 0.8,
    base: 0.34,
    density: 0.5,
    spin: 0.012,
    seed: 0.9,
    mode: 0,
    additive: false,
  },
  {
    effect: 'dustHaze',
    radius: 13,
    height: 3.4,
    y: 1.2,
    base: 0.24,
    density: 0.38,
    spin: -0.009,
    seed: 4.5,
    mode: 0,
    additive: false,
  },

  // City heat and exhaust haze, taller and subtler.
  {
    effect: 'urbanSmog',
    radius: 12.2,
    height: 5.6,
    y: 1.7,
    base: 0.26,
    density: 0.4,
    spin: 0.006,
    seed: 3.1,
    mode: 0,
    additive: false,
  },

  // Physical improvement: a low fog bank that hugs the plinth, catching
  // overlapping distant views of the diorama from the ground up.
  {
    effect: 'ridgeFog',
    radius: 10.2,
    height: 1.9,
    y: 0.07,
    base: 0.42,
    density: 0.52,
    spin: 0.006,
    seed: 0.5,
    mode: 0,
    additive: false,
  },

  // Physical improvement: ridgeFog rings respond to rain by thickening at
  // the bottom half of their band.
  {
    effect: 'ridgeFog',
    radius: 13,
    height: 3.0,
    y: 0.3,
    base: 0.4,
    density: 0.62,
    spin: -0.006,
    seed: 2.0,
    mode: 0,
    additive: false,
  },

  // Arid heat shimmer, using a fast-rising additive shader.
  {
    effect: 'heatHaze',
    radius: 9.3,
    height: 2.1,
    y: 0.85,
    base: 0.3,
    density: 0.36,
    spin: 0.002,
    seed: 1.7,
    mode: 2,
    additive: true,
  },
  {
    effect: 'heatHaze',
    radius: 9.9,
    height: 2.8,
    y: 1.2,
    base: 0.22,
    density: 0.28,
    spin: -0.002,
    seed: 5.9,
    mode: 2,
    additive: true,
  },
];

const RING_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RING_FRAGMENT = `
varying vec2 vUv;
uniform float uTime, uOpacity, uDensity, uWind, uSeed, uMode;
uniform vec3 uColor;
${SKY_NOISE_GLSL}
void main() {
  float angle = vUv.x * 6.28318;
  float height = vUv.y;
  float t = uTime;

  vec2 p = vec2(cos(angle), sin(angle)) * 2.1;
  p.y = height * 3.2;

  float speed = uMode > 1.5 ? 0.2 : 0.012 + uWind * 0.006;
  vec2 drift = vec2(t * speed + uSeed, -t * (uMode > 1.5 ? 0.24 : 0.035));
  vec2 q = p * 1.15 + drift;

  float broad = fbm(q);
  float fine = fbm(q * 2.7 + vec2(uSeed * 1.7, -t * (uMode > 1.5 ? 0.34 : 0.06)));
  float body = smoothstep(0.3, 0.76, broad * 0.68 + fine * 0.32);
  float band;

  if (uMode > 1.5) {
    float rise = fract(height * 1.35 - t * 0.11 + broad * 0.45);
    body = smoothstep(0.4, 0.78, broad * 0.7 + fine * 0.3 + rise * 0.18);
    band = smoothstep(0.0, 0.16, height) * (1.0 - smoothstep(0.55, 1.0, height));
  } else {
    band = smoothstep(0.0, 0.24, height) * (1.0 - smoothstep(0.42, 1.0, height));
  }

  float alpha = body * band * uOpacity * uDensity;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

const CLOTH_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CLOTH_FRAGMENT = `
varying vec2 vUv;
uniform float uTime, uOpacity, uDensity, uSeed;
uniform vec3 uColor;
${SKY_NOISE_GLSL}
void main() {
  vec2 centered = vUv - 0.5;
  float radius = length(centered) * 2.0;
  float edge = 1.0 - smoothstep(0.32, 1.0, radius);

  vec2 q = vUv * 4.2 + vec2(uSeed, uTime * 0.02);
  float broad = fbm(q);
  float fine = fbm(q * 2.2 - vec2(uTime * 0.04, 0.0));
  float body = smoothstep(0.3, 0.8, broad * 0.7 + fine * 0.3);

  float alpha = body * edge * uOpacity * uDensity;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

function emptyWeights(): EffectWeights {
  return {
    ridgeFog: 0,
    tableCloth: 0,
    heatHaze: 0,
    seaMist: 0,
    sprayMist: 0,
    dustHaze: 0,
    urbanSmog: 0,
  };
}

function resolveProfile(site: AtmosphereSite | null): AtmosphereProfile {
  const weights = emptyWeights();
  if (!site) return { weights };

  const base = BIOME_EFFECTS[site.biome];
  for (const key of Object.keys(base) as AtmosphereEffect[]) {
    weights[key] = base[key] ?? 0;
  }
  const override = SITE_OVERRIDES[site.key];
  if (override) {
    for (const key of Object.keys(override) as AtmosphereEffect[]) {
      weights[key] = override[key] ?? 0;
    }
  }
  return { weights };
}

function effectOpacity(effect: AtmosphereEffect, options: AtmosphereUpdateOptions): number {
  const wet = Math.max(0, Math.min(1, options.rain));
  const dry = 1 - wet;
  const day = 1 - Math.max(0, Math.min(1, options.night));
  const fog = Math.max(0, Math.min(1, options.fog));
  const cover = Math.max(0, Math.min(1, options.cover));

  switch (effect) {
    case 'ridgeFog':
      // Rain thickens the bank near the plinth: a physical 'wet ground' reading.
      // Daylight thins it so the landmark palette reads as crisply as Places.
      return (0.55 + fog * 1.45 + cover * 0.18 + wet * 0.35) * (0.55 + 0.45 * day);
    case 'tableCloth':
      return (0.55 + cover * 0.45) * (0.55 + 0.45 * day);
    case 'heatHaze':
      return dry * (0.22 + 0.78 * day) * (0.55 + 0.45 * (1 - cover));
    case 'dustHaze':
      return dry * (0.45 + 0.55 * day) * (0.55 + options.wind * 0.12);
    case 'seaMist':
      return (0.62 + fog * 0.95 + cover * 0.18) * (0.64 + 0.36 * day);
    case 'sprayMist':
      return 0.7 + cover * 0.3;
    case 'urbanSmog':
      return (0.58 + cover * 0.5) * (0.62 + 0.38 * day);
  }
}

function createRingMaterial(spec: LayerSpec): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: spec.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uDensity: { value: spec.density },
      uWind: { value: 1 },
      uSeed: { value: spec.seed },
      uMode: { value: spec.mode },
      uColor: { value: new THREE.Color(EFFECT_TINTS[spec.effect]) },
    },
    vertexShader: RING_VERTEX,
    fragmentShader: RING_FRAGMENT,
  });
}

function createClothMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uDensity: { value: 0.9 },
      uWind: { value: 1 },
      uSeed: { value: 1.3 },
      uColor: { value: new THREE.Color(EFFECT_TINTS.tableCloth) },
    },
    vertexShader: CLOTH_VERTEX,
    fragmentShader: CLOTH_FRAGMENT,
  });
}

export function createAtmosphereScene(scene: THREE.Scene): AtmosphereSceneController {
  const root = new THREE.Group();
  root.name = 'site-atmosphere';
  scene.add(root);

  const layers: AtmosphereLayer[] = [];

  for (const spec of RING_SPECS) {
    const geometry = new THREE.CylinderGeometry(spec.radius, spec.radius, spec.height, 48, 1, true);
    const mat = createRingMaterial(spec);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.y = spec.y;
    mesh.rotation.y = spec.seed;
    mesh.renderOrder = 1;
    mesh.frustumCulled = false;
    root.add(mesh);
    layers.push({
      effect: spec.effect,
      mesh,
      mat,
      spec,
      tint: new THREE.Color(EFFECT_TINTS[spec.effect]),
    });
  }

  // Table Mountain's tablecloth: a soft, drifting cloud sheet over the massif.
  const clothGeometry = new THREE.PlaneGeometry(11.8, 11.8, 40, 40).rotateX(-Math.PI / 2);
  const clothMat = createClothMaterial();
  const clothMesh = new THREE.Mesh(clothGeometry, clothMat);
  clothMesh.position.y = 3.35;
  clothMesh.renderOrder = 1;
  clothMesh.frustumCulled = false;
  root.add(clothMesh);
  const clothLayer: AtmosphereLayer = {
    effect: 'tableCloth',
    mesh: clothMesh,
    mat: clothMat,
    spec: {
      effect: 'tableCloth',
      radius: 10,
      height: 0.1,
      y: 3.35,
      base: 0.72,
      density: 0.9,
      spin: 0.006,
      seed: 1.3,
      mode: 0,
      additive: false,
    },
    tint: new THREE.Color(EFFECT_TINTS.tableCloth),
  };
  layers.push(clothLayer);

  const wildlifeCount = 36;
  const wildlifeSeeds = new Float32Array(wildlifeCount * 4);
  for (let i = 0; i < wildlifeCount; i++) {
    wildlifeSeeds[i * 4] = i;
    wildlifeSeeds[i * 4 + 1] = ((i * 1.6180339) % 1) * Math.PI * 2;
    wildlifeSeeds[i * 4 + 2] = 0.3 + ((i * 0.37) % 0.7);
    wildlifeSeeds[i * 4 + 3] = (i * 0.73) % 1;
  }
  const wildlifeGeo = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(new Float32Array(wildlifeCount * 3), 3))
    .setAttribute('aSeed', new THREE.BufferAttribute(wildlifeSeeds, 4));
  const wildlifeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uMode: { value: 0 }, // 0 = fireflies, 1 = soaring birds, 2 = arid sunlit motes
      uNight: { value: 0 },
      uWind: { value: 1 },
      uPointScale: { value: 180 },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uTime, uMode, uWind, uPointScale;
      varying float vPulse;
      varying vec4 vSeed;
      void main() {
        float idx = aSeed.x;
        float ang = aSeed.y;
        float radK = aSeed.z;
        float hK = aSeed.w;
        float t = uTime;
        vec3 wp;
        if (uMode > 0.5 && uMode < 1.5) {
          // Circling high coastal/wetland seabirds in figure-8 & thermal arcs
          float orbitAng = ang + t * (0.24 + radK * 0.14) * (mod(idx, 2.0) < 0.5 ? 1.0 : -1.0);
          float r = 4.4 + radK * 5.8;
          wp = vec3(
            cos(orbitAng) * r,
            4.8 + hK * 3.4 + sin(t * 1.3 + ang) * 0.35,
            sin(orbitAng * 1.12) * r * 0.85
          );
          vPulse = 0.78 + 0.22 * sin(t * 5.2 + ang);
        } else if (uMode >= 1.5) {
          // Sunlit rising arid/savannah dust sparkles
          float driftAng = ang + t * 0.12;
          float r = 2.0 + radK * 6.8;
          wp = vec3(
            cos(driftAng) * r + sin(t * 0.7 + idx) * (0.25 + uWind * 0.18),
            0.7 + fract(hK + t * 0.045) * 3.2,
            sin(driftAng) * r
          );
          vPulse = sin(fract(hK + t * 0.045) * 3.14159265);
        } else {
          // Dusk/night bio-luminescent fireflies drifting over grass and water
          float wander = ang + t * (0.18 + radK * 0.16);
          float r = 1.6 + radK * 5.6;
          wp = vec3(
            cos(wander) * r + sin(t * 1.1 + idx * 1.7) * 0.45,
            0.55 + hK * 2.15 + sin(t * 1.9 + idx) * 0.28,
            sin(wander) * r + cos(t * 0.9 + idx * 1.3) * 0.45
          );
          vPulse = pow(max(0.0, sin(t * (1.8 + radK * 2.2) + idx * 2.7)), 3.0);
        }
        vSeed = aSeed;
        vec4 mvPos = modelViewMatrix * vec4(wp, 1.0);
        float sz = uMode > 0.5 && uMode < 1.5 ? 0.56 : 0.28;
        gl_PointSize = clamp((sz * uPointScale) / max(1.0, -mvPos.z), 3.0, 24.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity, uMode, uTime;
      varying float vPulse;
      varying vec4 vSeed;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        if (uMode > 0.5 && uMode < 1.5) {
          // Subtle gull wing V-silhouette
          float flap = sin(uTime * 5.8 + vSeed.y * 4.0) * 0.14;
          float archY = abs(uv.x) * (0.42 + flap) - 0.08;
          float dist = abs(uv.y - archY);
          float span = smoothstep(0.46, 0.12, abs(uv.x));
          float wing = smoothstep(0.095, 0.025, dist) * span;
          if (wing < 0.05) discard;
          vec3 gullCol = mix(vec3(0.92, 0.95, 0.98), vec3(0.76, 0.80, 0.86), abs(uv.x));
          gl_FragColor = vec4(gullCol, wing * uOpacity * 0.88);
        } else {
          float r = length(uv) * 2.0;
          float glow = exp(-r * r * 3.8) * smoothstep(1.0, 0.2, r);
          if (glow < 0.02) discard;
          vec3 col = uMode >= 1.5
            ? vec3(1.0, 0.86, 0.56)
            : mix(vec3(0.76, 1.0, 0.42), vec3(1.0, 0.85, 0.35), vSeed.z);
          gl_FragColor = vec4(col, glow * vPulse * uOpacity);
        }
      }
    `,
  });
  wildlifeMat.userData.noDissolve = true;
  const wildlifePoints = new THREE.Points(wildlifeGeo, wildlifeMat);
  wildlifePoints.frustumCulled = false;
  wildlifePoints.renderOrder = 2;
  wildlifePoints.userData.noDissolve = true;
  wildlifePoints.userData.noShadow = true;
  wildlifePoints.userData.cannotReceiveAO = true;
  root.add(wildlifePoints);

  const currentWeights = emptyWeights();
  const targetWeights = emptyWeights();
  const tintTmp = new THREE.Color();

  let currentBiome: LandmarkBiome = 'mountain';
  let hidden = false;
  let animTime = 0;

  const setSite = (site: AtmosphereSite | null) => {
    const profile = resolveProfile(site);
    if (site) currentBiome = site.biome;
    for (const key of Object.keys(targetWeights) as AtmosphereEffect[]) {
      targetWeights[key] = profile.weights[key];
    }
  };

  const setHidden = (next: boolean) => {
    hidden = next;
    root.visible = !next;
  };

  const update: AtmosphereSceneController['update'] = (dt, _elapsed, options) => {
    if (hidden) return;

    const safeDt = Math.max(0, dt);
    const motion = options.motionScale;
    animTime += safeDt * motion;
    const fade = motion === 0 ? 1 : 1 - Math.exp(-safeDt * 1.6);
    const atmoLerp = motion === 0 ? 1 : 1 - Math.exp(-safeDt * 2.2);
    const lowQuality = options.qualityIndex >= 2;

    for (const key of Object.keys(currentWeights) as AtmosphereEffect[]) {
      currentWeights[key] += (targetWeights[key] - currentWeights[key]) * fade;
    }

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const weight = currentWeights[layer.effect];
      const isFar = lowQuality && layer.spec.radius > 12;
      const visible = weight > 0.012 && !isFar;
      layer.mesh.visible = visible;
      if (!visible) continue;

      const targetOpacity = Math.min(
        0.85,
        layer.spec.base * weight * effectOpacity(layer.effect, options)
      );
      const targetDensity = layer.spec.density * (0.75 + options.fog * 0.5);

      tintTmp.copy(layer.tint).lerp(options.fogColor, layer.effect === 'heatHaze' ? 0.14 : 0.52);

      layer.mat.uniforms.uTime.value = animTime;
      layer.mat.uniforms.uOpacity.value +=
        (targetOpacity - layer.mat.uniforms.uOpacity.value) * atmoLerp;
      layer.mat.uniforms.uDensity.value +=
        (targetDensity - layer.mat.uniforms.uDensity.value) * atmoLerp;
      layer.mat.uniforms.uWind.value += (options.wind - layer.mat.uniforms.uWind.value) * atmoLerp;
      layer.mat.uniforms.uColor.value.lerp(tintTmp, atmoLerp);

      if (layer.effect === 'tableCloth') {
        layer.mesh.rotation.y = animTime * layer.spec.spin;
        const drift = Math.sin(animTime * 0.07) * 0.35;
        layer.mesh.position.x = drift;
        layer.mesh.position.z = Math.cos(animTime * 0.05) * 0.25;
      } else {
        layer.mesh.rotation.y = animTime * layer.spec.spin;
      }
    }

    // Update GPU micro-wildlife layer (coastal seabirds by day, biome fireflies at night, arid motes)
    const dryClear = Math.max(0, 1 - options.rain * 1.4) * (1 - options.fog * 0.6);
    let targetWMode = 0;
    let targetWOpacity = 0;
    if (!lowQuality) {
      if ((currentBiome === 'coastal' || currentBiome === 'wetland') && options.night < 0.45) {
        targetWMode = 1;
        targetWOpacity = (1 - options.night * 1.8) * dryClear * 0.72;
      } else if (
        options.night > 0.25 &&
        (currentBiome === 'savannah' ||
          currentBiome === 'wetland' ||
          currentBiome === 'mountain' ||
          currentBiome === 'waterfall')
      ) {
        targetWMode = 0;
        targetWOpacity = Math.min(1, (options.night - 0.25) / 0.55) * dryClear * 0.85;
      } else if (
        (currentBiome === 'desert' || currentBiome === 'savannah') &&
        options.night < 0.4
      ) {
        targetWMode = 2;
        targetWOpacity = (1 - options.night * 2.0) * dryClear * 0.42;
      }
    }
    wildlifeMat.uniforms.uMode.value = targetWMode;
    wildlifeMat.uniforms.uTime.value = animTime;
    wildlifeMat.uniforms.uNight.value = options.night;
    wildlifeMat.uniforms.uWind.value = options.wind;
    wildlifeMat.uniforms.uPointScale.value = Math.min(
      260,
      Math.max(100, window.innerHeight * 0.22)
    );
    wildlifeMat.uniforms.uOpacity.value +=
      (Math.max(0, targetWOpacity) - wildlifeMat.uniforms.uOpacity.value) * atmoLerp;
    wildlifePoints.visible = wildlifeMat.uniforms.uOpacity.value > 0.015;
  };

  const dispose = () => {
    for (const layer of layers) {
      layer.mesh.geometry.dispose();
      layer.mat.dispose();
    }
    wildlifeGeo.dispose();
    wildlifeMat.dispose();
    root.removeFromParent();
  };

  return { root, setSite, setHidden, update, dispose };
}
