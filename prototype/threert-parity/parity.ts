/**
 * THROWAWAY PROTOTYPE — headless ThreeRT binding probe.
 *
 * Question it answers: can a citylit-style diorama be expressed with the real
 * @threert/scene API, and what does ThreeRT's engine ACTUALLY receive from it?
 *
 * Uses ThreeRT's own SceneBinding + RecordingEngine (headless inspection), so
 * no Rust / native renderer is required. Run:  bun prototype/threert-parity/parity.ts
 */
import { writeFileSync } from 'node:fs';
import {
  BoxGeometry,
  CylinderGeometry,
  Color,
  DirectionalLight,
  FogVolume,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RecordingEngine,
  Scene,
  SceneBinding,
  SkyAtmosphere,
  TorusGeometry,
} from '@threert/scene';

const sun = new DirectionalLight(0xffffff, 90_000).setSunAngles(28, 100);

const scene = new Scene();
scene.add(sun);
const sky = new SkyAtmosphere({ sun, dynamic: true, aerial: 1.0 });
scene.environment = sky;

const root = new Group();
root.name = 'table-mountain';
scene.add(root);

// Flat-topped sandstone massif (stand-in for warpTable()'s vertex-coloured mesh).
const massif = new Mesh(
  new CylinderGeometry(3.6, 4.2, 2.4, 12, 1),
  new MeshStandardMaterial({ color: new Color('#9a7d58'), roughness: 0.93, metalness: 0.02 })
);
massif.name = 'massif';
massif.position.set(0, 1.45, 0);
root.add(massif);

// Orographic tablecloth cloud puffs (stand-in for the MT() icosahedron rings).
for (let i = 0; i < 8; i++) {
  const puff = new Mesh(
    new IcosahedronGeometry(0.5, 2),
    new MeshStandardMaterial({
      color: new Color('#f4f8ff'),
      roughness: 1,
      transparent: true,
      opacity: 0.55,
    })
  );
  puff.name = `tablecloth_${i}`;
  puff.position.set(-3 + i * 0.85, 2.8, 0.4);
  puff.scale.set(1.3, 0.6, 1);
  root.add(puff);
}

// Emissive plinth ring — in ThreeRT this is a REAL light source, not a bloom trick.
const ring = new Mesh(
  new TorusGeometry(8.52, 0.035, 8, 96),
  new MeshStandardMaterial({
    color: new Color('#e8b04a'),
    emissive: new Color('#e8b04a'),
    emissiveIntensity: 1.6,
    roughness: 0.4,
  })
);
ring.name = 'plinth_ring';
root.add(ring);

// Volumetric ridge fog — replaces the additive cylinder rings in siteAtmosphere.ts.
const ridgeFog = new FogVolume({
  radialExtinction: 0.02,
  heightExtinction: 0.03,
  albedo: [0.86, 0.9, 0.95],
});
ridgeFog.name = 'ridge_fog';
ridgeFog.scale.set(20, 9, 20);
ridgeFog.position.y = 2;
scene.add(ridgeFog);

// A flat ground for bounce light.
const ground = new Mesh(
  new BoxGeometry(40, 0.2, 40),
  new MeshStandardMaterial({ color: new Color('#436333'), roughness: 0.95 })
);
ground.name = 'ground';
ground.position.y = 0;
scene.add(ground);

const camera = new PerspectiveCamera(42, 16 / 9, 0.2, 200);
camera.position.set(11.5, 6.2, 13);
camera.lookAt(0, 1.5, 0);
scene.add(camera);

// ---- Bind the scene to ThreeRT's engine and inspect what it receives ----
const engine = new RecordingEngine();
const binding = new SceneBinding(engine, scene, camera, {
  name: 'table-mountain-parity',
  width: 1280,
  height: 720,
});
const stats = binding.sync();
const calls = engine.take();

const byMethod: Record<string, number> = {};
for (const [method] of calls) byMethod[method] = (byMethod[method] ?? 0) + 1;

// RecordingEngine shapes: object/material = [method, id, desc], environment/settings = [method, desc].
const envDesc = calls.find(([m]) => m === 'environment')?.[1] as any;
const settingsDesc = calls.find(([m]) => m === 'settings')?.[1] as any;
const materialCalls = calls.filter(([m]) => m === 'material') as [string, number, any][];
const objectCalls = calls.filter(([m]) => m === 'object') as [string, number, any][];
const lightDesc = objectCalls.find(([, , d]) => d.kind === 'light')?.[2]?.light as any;

const emissiveMaterials = materialCalls
  .filter(([, , d]) => d.emissiveIntensity > 0 && d.emissive?.some((c: number) => c > 0.001))
  .map(([, , d]) => ({ name: d.name, emissiveIntensity: d.emissiveIntensity, color: d.emissive }));

const kinds: Record<string, number> = {};
for (const [, , d] of objectCalls) kinds[d.kind] = (kinds[d.kind] ?? 0) + 1;

const report = {
  question: 'Can a citylit diorama bind to ThreeRT, and what does the engine receive?',
  verdict: 'YES — the scene binds cleanly through ThreeRT’s own SceneBinding.',
  binding: { ...stats, counts: binding.counts() },
  engineCallCounts: byMethod,
  objectsByKind: kinds,
  sunLight: lightDesc
    ? {
        type: lightDesc.type,
        intensity: lightDesc.intensity,
        unit: 'lux',
        angularDiameter: lightDesc.angularDiameter,
        castShadow: lightDesc.castShadow,
      }
    : null,
  environment: envDesc
    ? {
        skyType: envDesc.sky?.type,
        dynamic: envDesc.sky?.dynamic,
        aerial: envDesc.sky?.aerial,
        skyLightIntensity: envDesc.sky?.skyLightIntensity,
      }
    : null,
  emissiveMaterials,
  volumeObjects: objectCalls.filter(([, , d]) => d.kind === 'volume').map(([, , d]) => d.name),
  recordedEngineCalls: calls.slice(0, 4).map(([m, ...args]) => ({ method: m, arg: args[0] })),
  renderSettings: settingsDesc
    ? { preset: settingsDesc.preset, width: settingsDesc.width, height: settingsDesc.height }
    : null,
  // Honest porting inventory for the REAL citylit engine.
  citylitPortMap: [
    { citylit: 'src/three/CitylitEngine.ts — PMREM RoomEnvironment IBL', threeRT: 'SkyAtmosphere / HDRIEnvironment (physical sky or HDRI)', status: 'replace' },
    { citylit: 'keyLight/fillLight/hemiLight + shadow maps', threeRT: 'sun (lux) + sky; shadows traced from every light', status: 'delete' },
    { citylit: 'glowMaterials emissiveIntensity animation', threeRT: 'emissive surface IS a light source; animate emissiveIntensity', status: 'keep + upgrade' },
    { citylit: 'updateWetSurfaces() roughness/color tweak', threeRT: 'engine environment.wetness / rain (real reflections)', status: 'replace' },
    { citylit: 'siteAtmosphere.ts additive shader rings', threeRT: 'FogVolume / volumetric height fog', status: 'replace' },
    { citylit: 'shaders.ts dissolve shader (GLSL)', threeRT: 'no GLSL: WGSL material functions, or keep dissolve in PWA UI', status: 'rewrite' },
    { citylit: 'globeScene.ts rim shader + canvas sprite labels', threeRT: 'unlit material / sprite-equivalent; keep globe in PWA layer', status: 'rewrite or keep in PWA' },
    { citylit: 'UnrealBloomPass', threeRT: 'renderer preset post (cinematic/preview), no manual bloom', status: 'delete' },
    { citylit: 'isSoftwareGl + auto quality scaling', threeRT: 'preset + spp/denoise settings; software BVH fallback', status: 'remap' },
  ],
  caveats: [
    'No native renderer on this machine (Rust not installed), so this probe verifies scene binding, not pixels.',
    'The web page beside this report approximates ThreeRT lighting in three.js — it is NOT path traced.',
    'The real dioramas use helpers (warpTable, bump textures, instancing, vertex colours) not reproduced in this stand-in.',
  ],
};

writeFileSync(new URL('./parity.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
