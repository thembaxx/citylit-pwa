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
  | 'heatHaze'
  | 'seaMist'
  | 'sprayMist'
  | 'dustHaze'
  | 'urbanSmog'
  | 'valleyMist';

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
  /** 1 = Studio mode (hides atmospheric mist & particles). */
  studioWeight?: number;
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
  heatHaze: '#ffcf96',
  seaMist: '#dfeff7',
  sprayMist: '#eaf8ff',
  dustHaze: '#e9c48a',
  urbanSmog: '#c8c4c9',
  valleyMist: '#e4eef6',
};

const BIOME_EFFECTS: Record<LandmarkBiome, Partial<EffectWeights>> = {
  mountain: { ridgeFog: 0.82, valleyMist: 0.32 },
  desert: { heatHaze: 0.95, dustHaze: 0.34 },
  waterfall: { sprayMist: 0.86, ridgeFog: 0.18, valleyMist: 0.56 },
  coastal: { seaMist: 0.8 },
  wetland: { seaMist: 0.55, ridgeFog: 0.28, valleyMist: 0.36 },
  savannah: { dustHaze: 0.5, heatHaze: 0.22 },
  urban: { urbanSmog: 0.36 },
};

/**
 * Named landmarks get a stronger, more characterful signature than their
 * biome default: Kgalagadi's heat shimmer, for example.
 */
const SITE_OVERRIDES: Record<string, Partial<EffectWeights>> = {
  'Table Mountain': { ridgeFog: 0.6 },
  'Sani Pass': { ridgeFog: 1, valleyMist: 0.72 },
  'Drakensberg Amphitheatre': { ridgeFog: 0.7, sprayMist: 0.55, valleyMist: 0.78 },
  'Three Rondavels': { ridgeFog: 0.9, valleyMist: 0.82 },
  'Golden Gate Highlands': { ridgeFog: 0.55, dustHaze: 0.18, valleyMist: 0.58 },
  'Kgalagadi Red Dunes': { heatHaze: 1.2, dustHaze: 0.34 },
  Richtersveld: { heatHaze: 1.05, dustHaze: 0.26 },
  'The Big Hole': { heatHaze: 0.55, dustHaze: 0.46 },
  'Augrabies Falls': { sprayMist: 0.72, heatHaze: 0.2, valleyMist: 0.64 },
  'Bourke’s Luck Potholes': { sprayMist: 0.65, valleyMist: 0.68 },
  'Gariep Dam': { seaMist: 0.38, valleyMist: 0.58 },
  'Hartbeespoort Dam': { ridgeFog: 0.35, valleyMist: 0.62 },
  'Storms River Mouth': { seaMist: 0.85, valleyMist: 0.65 },
  'Knysna Heads': { seaMist: 0.78, valleyMist: 0.48 },
  'Cape Point Lighthouse': { seaMist: 1, ridgeFog: 0.3 },
  'Hermanus Whale Watching': { seaMist: 0.95 },
  'iSimangaliso Wetland Park': { seaMist: 0.7, ridgeFog: 0.34, valleyMist: 0.52 },
  'Kruger National Park': { dustHaze: 0.6, heatHaze: 0.28 },
};

function emptyWeights(): EffectWeights {
  return {
    ridgeFog: 0,
    heatHaze: 0,
    seaMist: 0,
    sprayMist: 0,
    dustHaze: 0,
    urbanSmog: 0,
    valleyMist: 0,
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
    case 'valleyMist':
      return (0.28 + fog * 0.85 + wet * 0.38 + cover * 0.22) * (0.45 + 0.55 * (1 - day * 0.5));
  }
}

export function createAtmosphereScene(scene: THREE.Scene): AtmosphereSceneController {
  const root = new THREE.Group();
  root.name = 'site-atmosphere';
  scene.add(root);

  const layers: AtmosphereLayer[] = [];

  // Two stratified canyon/valley height-mist banks hugging gorges, dams, and escarpment bases.
  for (const [idx, my, radScale, baseOp, spin, seed] of [
    [0, 0.78, 14.4, 0.26, 0.008, 2.4],
    [1, 1.48, 13.6, 0.18, -0.006, 5.1],
  ] as const) {
    const vGeo = new THREE.PlaneGeometry(radScale, radScale, 1, 1).rotateX(-Math.PI / 2);
    const vMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uDensity: { value: 0.75 },
        uWind: { value: 1 },
        uSeed: { value: seed },
        uColor: { value: new THREE.Color(EFFECT_TINTS.valleyMist) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vec4 mv = viewMatrix * wp;
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vViewDir;
        uniform float uTime, uOpacity, uDensity, uWind, uSeed;
        uniform vec3 uColor;
        ${SKY_NOISE_GLSL}
        void main() {
          vec2 c = vUv - 0.5;
          float r = length(c) * 2.0;
          if (r >= 0.98) discard;
          // Soft outer rim + gentle clearing right near focal hero center
          float outerFade = 1.0 - smoothstep(0.45, 0.98, r);
          float innerPocket = smoothstep(0.14, 0.42, r) * 0.65 + 0.35;
          vec2 q = vUv * 5.2 + vec2(uSeed + uTime * (0.015 + uWind * 0.004), -uTime * 0.012);
          float broad = fbm(q);
          float fine = fbm(q * 2.3 + vec2(-uTime * 0.02, uSeed));
          float wisps = smoothstep(0.32, 0.78, broad * 0.65 + fine * 0.35);
          // Fade out cleanly at low grazing view angles so the plane never slices harshly
          float viewUp = abs(vViewDir.y);
          float angleFade = smoothstep(0.06, 0.28, viewUp);
          float alpha = wisps * outerFade * innerPocket * angleFade * uOpacity * uDensity;
          if (alpha < 0.003) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
    vMat.userData.noDissolve = true;
    const vMesh = new THREE.Mesh(vGeo, vMat);
    vMesh.position.y = my;
    vMesh.renderOrder = 1 + idx;
    vMesh.frustumCulled = false;
    vMesh.userData.noShadow = true;
    vMesh.userData.cannotReceiveAO = true;
    vMesh.userData.noDissolve = true;
    root.add(vMesh);
    layers.push({
      effect: 'valleyMist',
      mesh: vMesh,
      mat: vMat,
      spec: {
        effect: 'valleyMist',
        radius: 9.5,
        height: 0.1,
        y: my,
        base: baseOp,
        density: 0.78,
        spin,
        seed,
        mode: 0,
        additive: false,
      },
      tint: new THREE.Color(EFFECT_TINTS.valleyMist),
    });
  }

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
    const studioHidden = (options.studioWeight ?? 0) >= 0.96;
    if (hidden || studioHidden) {
      root.visible = false;
      return;
    }
    root.visible = true;

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
      const visible = weight > 0.012;
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

      layer.mesh.rotation.y = animTime * layer.spec.spin;
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
