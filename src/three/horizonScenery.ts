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
  // Open cylinder with multi-row skirt so procedural ridge elevation sits naturally above a base floor.
  const radialSegs = 96;
  const geo = new THREE.CylinderGeometry(radius, radius, height, radialSegs, 1, true);
  geo.translate(0, height * 0.5 - 1.4, 0);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uBaseCol: { value: new THREE.Color('#2d3c4e') },
      uHorizonCol: { value: new THREE.Color('#7fa3c4') },
      uGlowCol: { value: new THREE.Color('#ff9d5c') },
      uHor: { value: 0 },
      uWeights: { value: new THREE.Vector4(1, 0, 0, 0) }, // mountain, dune, coastal, urban
      uSeed: { value: seed },
      uAlpha: { value: layerAlpha },
    },
    vertexShader: /* glsl */ `
      uniform vec4 uWeights;
      uniform float uSeed;
      varying float vElev;
      varying vec3 vWorldPos;

      float hash1(float n) { return fract(sin(n) * 43758.5453123); }

      void main() {
        vec3 pos = position;
        float ang = atan(pos.z, pos.x);
        float topMask = smoothstep(-1.3, 0.2, pos.y);

        // Mountain & escarpment ridges
        float mtn = (sin(ang * 3.0 + uSeed) * 0.5 + 0.5) * 0.55
                  + (sin(ang * 7.0 - uSeed * 1.4) * 0.5 + 0.5) * 0.30
                  + (sin(ang * 13.0 + uSeed * 2.1) * 0.5 + 0.5) * 0.15;

        // Rolling Kalahari dunes / savannah mesas
        float dune = pow(sin(ang * 2.0 + uSeed * 0.7) * 0.5 + 0.5, 1.4) * 0.52
                   + (sin(ang * 5.0 - uSeed * 0.9) * 0.5 + 0.5) * 0.18;

        // Coastal ocean horizon with gentle distant headland
        float coast = pow(max(0.0, sin(ang * 2.0 + uSeed * 1.7)), 6.0) * 0.58 + 0.08;

        // Stepped Highveld urban skyline blocks
        float sector = floor((ang + 3.14159) / 0.18);
        float blk = hash1(sector + uSeed * 11.0);
        float urb = step(0.45, blk) * (0.22 + blk * 0.45);

        float profile = mtn * uWeights.x + dune * uWeights.y + coast * uWeights.z + urb * uWeights.w;
        float lift = (0.35 + profile * 4.4) * topMask;
        pos.y = mix(-1.4, -1.4 + lift, topMask);

        vElev = topMask * clamp(profile, 0.0, 1.0);
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBaseCol;
      uniform vec3 uHorizonCol;
      uniform vec3 uGlowCol;
      uniform float uHor;
      uniform float uAlpha;
      varying float vElev;
      varying vec3 vWorldPos;

      void main() {
        vec3 col = mix(uBaseCol, uHorizonCol, 0.35 + vElev * 0.55);
        col += uGlowCol * uHor * (0.22 + 0.25 * vElev);
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
 * Far-horizon South African relief silhouettes & wet ground reflection catcher
 * beneath the diorama plinth so outdoor scenes feel rooted in the landscape.
 */
export function createHorizonScenery(scene: THREE.Scene): HorizonSceneryController {
  const root = new THREE.Group();
  scene.add(root);

  const nearRidge = createHorizonRing(31, 6.2, 0.4, 0.42);
  const farRidge = createHorizonRing(46, 8.4, 2.35, 0.26);
  root.add(nearRidge.mesh, farRidge.mesh);

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
  const groundCatcher = new THREE.Mesh(new THREE.CircleGeometry(18.5, 48), groundMat);
  groundCatcher.rotation.x = -Math.PI / 2;
  groundCatcher.position.y = -0.715;
  groundCatcher.receiveShadow = false;
  groundCatcher.castShadow = false;
  groundCatcher.renderOrder = -1;
  groundCatcher.userData.noShadow = true;
  groundCatcher.userData.cannotReceiveAO = true;
  root.add(groundCatcher);

  const currentWeights: BiomeWeights = { mountain: 1, dune: 0, coastal: 0, urban: 0 };
  const targetWeights: BiomeWeights = { mountain: 1, dune: 0, coastal: 0, urban: 0 };
  const tmpBase = new THREE.Color();
  const tmpHorizon = new THREE.Color();
  const tmpGround = new THREE.Color();
  let hidden = false;

  const setBiome = (biome: LandmarkBiome) => {
    const next = weightsForBiome(biome);
    targetWeights.mountain = next.mountain;
    targetWeights.dune = next.dune;
    targetWeights.coastal = next.coastal;
    targetWeights.urban = next.urban;
  };

  const setHidden = (nextHidden: boolean) => {
    hidden = nextHidden;
    root.visible = !hidden;
  };

  const update: HorizonSceneryController['update'] = (dt, motionScale, opts) => {
    const visible = !hidden && opts.studioWeight < 0.985;
    root.visible = visible;
    if (!visible) return;

    const k = motionScale === 0 ? 1 : 1 - Math.exp(-Math.max(0, dt) * 2.2);
    currentWeights.mountain += (targetWeights.mountain - currentWeights.mountain) * k;
    currentWeights.dune += (targetWeights.dune - currentWeights.dune) * k;
    currentWeights.coastal += (targetWeights.coastal - currentWeights.coastal) * k;
    currentWeights.urban += (targetWeights.urban - currentWeights.urban) * k;

    const studioFade = 1 - opts.studioWeight;

    // Blend silhouette hues between sky tint and horizon fog so ridges sit smoothly in the distance.
    tmpBase.copy(opts.fogColor).lerp(opts.skyColor, 0.22);
    tmpHorizon.copy(opts.fogColor).lerp(opts.skyColor, 0.45);

    nearRidge.mat.uniforms.uWeights.value.set(
      currentWeights.mountain,
      currentWeights.dune,
      currentWeights.coastal,
      currentWeights.urban
    );
    nearRidge.mat.uniforms.uBaseCol.value.lerp(tmpBase, k);
    nearRidge.mat.uniforms.uHorizonCol.value.lerp(tmpHorizon, k);
    nearRidge.mat.uniforms.uGlowCol.value.lerp(opts.sunGlow, k);
    nearRidge.mat.uniforms.uHor.value = opts.hor;
    nearRidge.mat.uniforms.uAlpha.value = (0.44 - opts.night * 0.1) * studioFade;

    farRidge.mat.uniforms.uWeights.value.copy(nearRidge.mat.uniforms.uWeights.value);
    farRidge.mat.uniforms.uBaseCol.value.lerp(tmpHorizon, k);
    farRidge.mat.uniforms.uHorizonCol.value.lerp(opts.fogColor, k);
    farRidge.mat.uniforms.uGlowCol.value.lerp(opts.sunGlow, k);
    farRidge.mat.uniforms.uHor.value = opts.hor * 0.8;
    farRidge.mat.uniforms.uAlpha.value = (0.28 - opts.night * 0.06) * studioFade;

    // Ground catcher takes subtle rain wetness sheen & ambient sky bounce under the plinth.
    tmpGround.copy(opts.fogColor).multiplyScalar(0.32 + (1 - opts.night) * 0.18);
    groundMat.color.lerp(tmpGround, k);
    groundMat.roughness = THREE.MathUtils.lerp(0.88, 0.18, opts.rain);
    groundMat.metalness = THREE.MathUtils.lerp(0.06, 0.24, opts.rain);
    groundMat.opacity = (0.36 + opts.rain * 0.16) * studioFade;
  };

  const dispose = () => {
    scene.remove(root);
    nearRidge.mesh.geometry.dispose();
    nearRidge.mat.dispose();
    farRidge.mesh.geometry.dispose();
    farRidge.mat.dispose();
    groundCatcher.geometry.dispose();
    groundMat.dispose();
  };

  return {
    root,
    setBiome,
    setHidden,
    update,
    dispose,
  };
}
