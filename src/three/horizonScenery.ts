import * as THREE from 'three';
import type { LandmarkBiome } from '../types/citylit';
import { getSoftTexture } from './shaders';

export interface HorizonUpdateOptions {
  fogColor: THREE.Color;
  skyColor: THREE.Color;
  sunGlow: THREE.Color;
  hor: number;
  night: number;
  rain: number;
  studioWeight: number;
}

export interface HorizonSceneryController {
  root: THREE.Group;
  setBiome: (biome: LandmarkBiome) => void;
  setSiteTint: (horizonHex: string) => void;
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

        // Distant coastal sea horizon shimmer catching twilight / moonlight
        if (uWeights.z > 0.2) {
          float seaBelt = smoothstep(0.22, 0.02, vElev) * smoothstep(-1.35, -0.7, vWorldPos.y);
          float shimmer = 0.5 + 0.5 * sin(vAngle * 24.0 + uTime * 1.1 + uSeed);
          col += mix(uGlowCol, vec3(0.72, 0.88, 1.0), uNight * 0.7) * seaBelt * shimmer * uWeights.z * (0.14 + uHor * 0.25);
        }

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

  // Subtle wet ground reflection / shadow catcher disc directly below the plinth base.
  const groundMat = new THREE.MeshStandardMaterial({
    color: '#0e131d',
    map: getSoftTexture(),
    transparent: true,
    opacity: 0.42,
    roughness: 0.85,
    metalness: 0.08,
    depthWrite: false,
  });
  groundMat.userData.noDissolve = true;
  const groundCatcher = new THREE.Mesh(new THREE.CircleGeometry(19.5, 48), groundMat);
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
      { ring: nearRidge, alpha: 0.52 - opts.night * 0.1, horScale: 1.0, baseLerp: 0.0 },
      { ring: midRidge, alpha: 0.34 - opts.night * 0.07, horScale: 0.85, baseLerp: 0.45 },
      { ring: farRidge, alpha: 0.2 - opts.night * 0.05, horScale: 0.7, baseLerp: 0.85 },
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
    }

    // Ground catcher takes subtle rain wetness sheen & ambient sky bounce under the plinth.
    tmpGround.copy(opts.fogColor).multiplyScalar(0.32 + (1 - opts.night) * 0.18);
    groundMat.color.lerp(tmpGround, k);
    const targetRoughness = THREE.MathUtils.lerp(0.88, 0.18, opts.rain);
    const targetMetalness = THREE.MathUtils.lerp(0.06, 0.24, opts.rain);
    const targetOpacity = (0.36 + opts.rain * 0.16) * studioFade;
    groundMat.roughness += (targetRoughness - groundMat.roughness) * k;
    groundMat.metalness += (targetMetalness - groundMat.metalness) * k;
    groundMat.opacity += (targetOpacity - groundMat.opacity) * k;

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
    groundCatcher.geometry.dispose();
    groundMat.dispose();
    stageAura.geometry.dispose();
    stageAuraMat.dispose();
  };

  return {
    root,
    setBiome,
    setSiteTint,
    setHidden,
    update,
    dispose,
  };
}

