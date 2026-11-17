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
  'Table Mountain': { ridgeFog: 0.95, tableCloth: 1 },
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
      return 0.55 + fog * 1.45 + cover * 0.18;
    case 'tableCloth':
      return (0.55 + cover * 0.45) * (0.55 + 0.45 * day);
    case 'heatHaze':
      return dry * (0.22 + 0.78 * day) * (0.55 + 0.45 * (1 - cover));
    case 'dustHaze':
      return dry * (0.45 + 0.55 * day) * (0.55 + options.wind * 0.12);
    case 'seaMist':
      return 0.62 + fog * 0.95 + cover * 0.18;
    case 'sprayMist':
      return 0.7 + cover * 0.3;
    case 'urbanSmog':
      return 0.58 + cover * 0.5;
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

  const currentWeights = emptyWeights();
  const targetWeights = emptyWeights();
  const tintTmp = new THREE.Color();

  let hidden = false;

  const setSite = (site: AtmosphereSite | null) => {
    const profile = resolveProfile(site);
    for (const key of Object.keys(targetWeights) as AtmosphereEffect[]) {
      targetWeights[key] = profile.weights[key];
    }
  };

  const setHidden = (next: boolean) => {
    hidden = next;
    root.visible = !next;
  };

  const update: AtmosphereSceneController['update'] = (dt, elapsed, options) => {
    if (hidden) return;

    const fade = 1 - Math.exp(-dt * 1.6);
    const motion = options.motionScale;
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

      const opacity = layer.spec.base * weight * effectOpacity(layer.effect, options);
      const density = layer.spec.density * (0.75 + options.fog * 0.5);

      tintTmp.copy(layer.tint).lerp(options.fogColor, layer.effect === 'heatHaze' ? 0.14 : 0.52);

      layer.mat.uniforms.uTime.value = elapsed;
      layer.mat.uniforms.uOpacity.value = Math.min(0.85, opacity);
      layer.mat.uniforms.uDensity.value = density;
      layer.mat.uniforms.uWind.value = options.wind;
      layer.mat.uniforms.uColor.value.copy(tintTmp);

      if (layer.effect === 'tableCloth') {
        layer.mesh.rotation.y = elapsed * layer.spec.spin * motion;
        const drift = Math.sin(elapsed * 0.07 * motion) * 0.35;
        layer.mesh.position.x = drift;
        layer.mesh.position.z = Math.cos(elapsed * 0.05 * motion) * 0.25;
      } else {
        layer.mesh.rotation.y = elapsed * layer.spec.spin * motion;
      }
    }
  };

  const dispose = () => {
    for (const layer of layers) {
      layer.mesh.geometry.dispose();
      layer.mat.dispose();
    }
    root.removeFromParent();
  };

  return { root, setSite, setHidden, update, dispose };
}
