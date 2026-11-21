import * as THREE from 'three';
import type { LandmarkBiome, QualityIndex } from '../types/citylit';
import { WU } from './shaders';

export interface WindParticlesUpdateOptions {
  qualityIndex: QualityIndex;
  motionScale: number;
  wind: number;
  rain: number;
  fog: number;
  storm: number;
  cover: number;
  night: number;
  season: number;
  windDir: THREE.Vector2;
}

export interface WindParticlesController {
  points: THREE.Points;
  setBiome: (biome: LandmarkBiome, key?: string) => void;
  setHidden: (hidden: boolean) => void;
  update: (dt: number, elapsed: number, opts: WindParticlesUpdateOptions) => void;
  dispose: () => void;
}

const MAX_PARTICLES = 150;

function seeded(i: number): number {
  const x = Math.sin(i * 127.1 + 31.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Procedural elongated leaf / grass-blade wisp texture for crisp alpha cutouts. */
function createLeafWispTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size * 0.5, size * 0.5);
    ctx.rotate(-0.35);

    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.65, 'rgba(255,255,255,0.88)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(-4, -12, 22, 0);
    ctx.quadraticCurveTo(-4, 12, -22, 0);
    ctx.closePath();
    ctx.fill();

    // Subtle midrib spine
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.lineTo(17, 0);
    ctx.stroke();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const BIOME_PALETTES: Record<LandmarkBiome, readonly [string, string]> = {
  mountain: ['#8ca667', '#d8be7d'],
  savannah: ['#c9a959', '#e2c57e'],
  desert: ['#d7a66a', '#e8c996'],
  coastal: ['#a9cbb8', '#e6f3f5'],
  wetland: ['#72a669', '#bad289'],
  waterfall: ['#80b878', '#d7f1f5'],
  urban: ['#89aa6d', '#c796e8'],
};

/**
 * GPU-driven windborne leaf, grass-wisp, and blossom particle system.
 * Advection, helical flutter, and weather-dependent height/turbulence run
 * entirely inside the vertex shader for zero CPU per-frame loop cost.
 */
export function createWindParticles(scene: THREE.Scene): WindParticlesController {
  const leafTex = createLeafWispTexture();

  const positions = new Float32Array(MAX_PARTICLES * 3);
  const seeds = new Float32Array(MAX_PARTICLES * 4);
  const metas = new Float32Array(MAX_PARTICLES * 3);

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const x = (seeded(i * 3.1 + 1) - 0.5) * 16.5;
    const y = 0.25 + seeded(i * 5.7 + 2) * 4.4;
    const z = (seeded(i * 7.3 + 3) - 0.5) * 16.5;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    seeds[i * 4] = x;
    seeds[i * 4 + 1] = y;
    seeds[i * 4 + 2] = z;
    seeds[i * 4 + 3] = seeded(i * 11.9 + 5);

    metas[i * 3] = 0.72 + seeded(i * 13.1 + 7) * 0.78; // size scale
    metas[i * 3 + 1] = (seeded(i * 17.3 + 9) - 0.5) * 2.0; // tumble speed sign/rate
    metas[i * 3 + 2] = seeded(i * 19.7 + 11); // color mix factor
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geo.setAttribute('aMeta', new THREE.BufferAttribute(metas, 3));

  const targetColA = new THREE.Color('#8ca667');
  const targetColB = new THREE.Color('#d8be7d');
  const jacarandaCol = new THREE.Color('#c394ec');
  const autumnTint = new THREE.Color('#d98d4b');

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 1 },
      uWindDir: { value: new THREE.Vector2(1, 0) },
      uRain: { value: 0 },
      uFog: { value: 0 },
      uStorm: { value: 0 },
      uNight: { value: 0 },
      uOpacity: { value: 0.5 },
      uPointScale: { value: 160 },
      uColA: { value: targetColA.clone() },
      uColB: { value: targetColB.clone() },
      uMap: { value: leafTex },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      attribute vec3 aMeta;
      uniform float uTime;
      uniform float uWind;
      uniform vec2 uWindDir;
      uniform float uRain;
      uniform float uFog;
      uniform float uStorm;
      uniform float uPointScale;
      varying float vAlpha;
      varying float vSpin;
      varying float vMix;

      void main() {
        float phase = aSeed.w * 6.283185;
        float speed = (0.35 + uWind * 1.45 + uStorm * 1.2) * (0.75 + 0.5 * fract(aSeed.w * 13.7));
        float travel = uTime * speed;

        // Advect along the live wind direction vector and wrap smoothly over a 16x16 diorama volume.
        vec2 windAxis = normalize(uWindDir + vec2(0.0001, 0.0));
        vec2 perpAxis = vec2(-windAxis.y, windAxis.x);

        float swirl = sin(uTime * (0.9 + uWind * 0.45) + phase) * (0.45 + uFog * 0.35);
        float gust = sin(uTime * 1.35 + aSeed.x * 0.4 + phase) * (0.28 + uStorm * 0.35);

        vec2 xz = aSeed.xz + windAxis * (travel + gust) + perpAxis * swirl;
        xz = mod(xz + 8.4, 16.8) - 8.4;

        // Weather affects flight altitude & vertical flutter:
        // rain/storm keeps leaves low & whipped; clear breezes carry wisps higher.
        float heightSpan = mix(4.2, 2.1, clamp(uRain * 0.8 + uStorm * 0.4, 0.0, 1.0));
        float baseY = mod(aSeed.y - uTime * (0.14 + uRain * 0.62) + 4.8, heightSpan) + 0.18;
        float flutterY = sin(uTime * (2.2 + uWind * 0.8) + phase * 1.7) * (0.16 + 0.12 * uWind);
        vec3 wp = vec3(xz.x, baseY + flutterY, xz.y);

        // Edge fade so wrapped particles appear and vanish seamlessly outside the plinth rim.
        float edgeDist = max(abs(wp.x), abs(wp.z));
        float edgeFade = 1.0 - smoothstep(6.2, 8.3, edgeDist);
        float heightFade = smoothstep(0.15, 0.55, wp.y) * (1.0 - smoothstep(heightSpan - 0.6, heightSpan + 0.25, wp.y));
        vAlpha = edgeFade * heightFade * (0.55 + 0.45 * sin(uTime * 1.8 + phase));
        vSpin = phase + uTime * aMeta.y * (1.4 + uWind * 1.9);
        vMix = aMeta.z;

        vec4 mvPosition = modelViewMatrix * vec4(wp, 1.0);
        gl_PointSize = clamp((aMeta.x * (0.13 + 0.04 * clamp(uWind, 0.0, 2.5)) * uPointScale) / max(1.2, -mvPosition.z), 3.0, 22.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uColA;
      uniform vec3 uColB;
      uniform float uOpacity;
      uniform float uNight;
      uniform float uRain;
      varying float vAlpha;
      varying float vSpin;
      varying float vMix;

      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float c = cos(vSpin);
        float s = sin(vSpin);
        vec2 rotUv = mat2(c, -s, s, c) * p + 0.5;
        vec4 tex = texture2D(uMap, rotUv);
        if (tex.a < 0.04) discard;

        vec3 col = mix(uColA, uColB, vMix);
        // Slightly darker wet leaves during rain, and softer cool tint at night.
        col *= mix(1.0, 0.72, uRain * 0.85);
        col = mix(col, col * vec3(0.52, 0.62, 0.82), uNight * 0.7);
        gl_FragColor = vec4(col, tex.a * vAlpha * uOpacity);
      }
    `,
  });
  mat.userData.noDissolve = true;

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 2;
  points.userData.noShadow = true;
  points.userData.cannotReceiveAO = true;
  scene.add(points);

  let hidden = false;
  let simTime = 0;
  let activeBiome: LandmarkBiome = 'mountain';
  let activeKey = '';
  const colATmp = new THREE.Color();
  const colBTmp = new THREE.Color();

  const setBiome = (biome: LandmarkBiome, key = '') => {
    activeBiome = biome;
    activeKey = key;
    const pal = BIOME_PALETTES[biome] ?? BIOME_PALETTES.mountain;
    targetColA.set(pal[0]);
    targetColB.set(pal[1]);
    if (
      key.includes('Union Buildings') ||
      key.includes('Voortrekker') ||
      key.includes('Constitution')
    ) {
      targetColB.copy(jacarandaCol);
    }
  };

  const setHidden = (nextHidden: boolean) => {
    hidden = nextHidden;
    points.visible = !hidden && WU.wind.value > 0.06;
  };

  const update: WindParticlesController['update'] = (dt, _elapsed, opts) => {
    if (hidden) {
      points.visible = false;
      return;
    }

    const safeDt = Math.max(0, dt);
    simTime += safeDt * opts.motionScale;

    const effectiveWind = Math.max(opts.wind, opts.storm * 1.4 + opts.rain * 0.35);
    const tierCap = opts.qualityIndex >= 2 ? 48 : opts.qualityIndex === 1 ? 88 : MAX_PARTICLES;
    const windDensity = THREE.MathUtils.clamp((effectiveWind - 0.12) / 1.8, 0.16, 1);
    const drawCount = Math.max(0, Math.round(tierCap * windDensity));
    geo.setDrawRange(0, drawCount);

    // Subtle visibility scaling: barely-there drift in calm air, more crisp leaves in breezy/stormy weather.
    const weatherVisibility =
      THREE.MathUtils.clamp(0.18 + effectiveWind * 0.28 + opts.fog * 0.08, 0, 0.72) *
      (1 - opts.night * 0.25);

    points.visible = drawCount > 0 && weatherVisibility > 0.02;
    if (!points.visible) return;

    const k = opts.motionScale === 0 ? 1 : 1 - Math.exp(-safeDt * 2.5);
    colATmp.copy(targetColA);
    colBTmp.copy(targetColB);
    // Shift dry leaves warmer during cool/autumn/winter months when not coastal/jacaranda
    if (activeBiome !== 'coastal' && !activeKey.includes('Union Buildings')) {
      const dryWeight = THREE.MathUtils.clamp(1 - opts.season, 0, 1) * 0.38;
      colBTmp.lerp(autumnTint, dryWeight);
    }

    mat.uniforms.uColA.value.lerp(colATmp, k);
    mat.uniforms.uColB.value.lerp(colBTmp, k);
    mat.uniforms.uTime.value = simTime;
    mat.uniforms.uWind.value = effectiveWind;
    mat.uniforms.uWindDir.value.copy(opts.windDir);
    mat.uniforms.uRain.value = opts.rain;
    mat.uniforms.uFog.value = opts.fog;
    mat.uniforms.uStorm.value = opts.storm;
    mat.uniforms.uNight.value = opts.night;
    mat.uniforms.uOpacity.value += (weatherVisibility - mat.uniforms.uOpacity.value) * k;
    mat.uniforms.uPointScale.value = Math.min(260, Math.max(95, window.innerHeight * 0.22));
  };

  const dispose = () => {
    scene.remove(points);
    geo.dispose();
    mat.dispose();
    leafTex.dispose();
  };

  return {
    points,
    setBiome,
    setHidden,
    update,
    dispose,
  };
}
