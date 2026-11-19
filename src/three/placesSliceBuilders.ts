import * as THREE from 'three';
import { LANDMARKS } from '../data/landmarks';
import { createCloudPuffMesh, createSliceCloudLayer } from './placesClouds';
import { WU } from './shaders';
import {
  createCutawayWaterTopMaterial,
  createCutawayWaterWallMaterial,
  createSliceMistMaterial,
  getOrlandoMuralTexture,
  patchPlacesVolumetricFog,
  type CutawayWaterOptions,
  type PlacesShaderEnvironment,
} from './placesShaders';

export const SLICE_HALF = 1.5;

export interface PlaceSliceSpec {
  landmarkName: string;
  landmarkIndex: number;
  province: string;
  /** Constellation coordinate in the Places archipelago (X, Z). */
  gridPos: readonly [number, number];
  subtitle: string;
}

export interface BuiltPlaceSlice {
  spec: PlaceSliceSpec;
  root: THREE.Group;
  hitBox: THREE.Mesh;
  ringMesh: THREE.Mesh;
  cloudGroup: THREE.Group;
  waterMats: THREE.ShaderMaterial[];
  glowMats: THREE.MeshStandardMaterial[];
  tick?: (elapsed: number, litStrength: number) => void;
  dispose: () => void;
}

export interface SliceSharedAssets {
  env: PlacesShaderEnvironment;
  terrainMat: THREE.MeshStandardMaterial;
  cloudMat: THREE.ShaderMaterial;
  foliageGeo: THREE.BufferGeometry;
  trunkGeo: THREE.BufferGeometry;
  rockGeo: THREE.BufferGeometry;
  boxGeo: THREE.BufferGeometry;
  coneGeo: THREE.BufferGeometry;
  sphereGeo: THREE.BufferGeometry;
  cylinderGeo: THREE.BufferGeometry;
  gableRoofGeo: THREE.BufferGeometry;
  flowerGeo: THREE.BufferGeometry;
  mistPlaneGeo: THREE.BufferGeometry;
  waterTopMats: Map<string, THREE.ShaderMaterial>;
  waterWallMats: THREE.ShaderMaterial[];
  waterWallMatMap: Map<string, THREE.ShaderMaterial>;
  dispose: () => void;
}

function createGableRoofGeo(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.56, 0);
  s.lineTo(0, 0.5);
  s.lineTo(0.56, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 1.06,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  });
  geo.center();
  return geo;
}

function createSculptedRockGeo(): THREE.BufferGeometry {
  const g = new THREE.DodecahedronGeometry(1, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 0.84 + 0.26 * Math.sin(x * 3.7 + y * 4.3 + z * 2.9);
    pos.setXYZ(i, x * n, y * (y < 0 ? 0.72 : n), z * n);
  }
  g.computeVertexNormals();
  return g;
}

export function createSliceSharedAssets(
  env: PlacesShaderEnvironment,
  terrainMat: THREE.MeshStandardMaterial,
  cloudMat: THREE.ShaderMaterial
): SliceSharedAssets {
  const waterTopMats = new Map<string, THREE.ShaderMaterial>();
  const waterWallMatMap = new Map<string, THREE.ShaderMaterial>();
  const waterWallMats: THREE.ShaderMaterial[] = [];

  const foliageGeo = new THREE.IcosahedronGeometry(1, 1);
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.28, 1, 6);
  const rockGeo = createSculptedRockGeo();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const coneGeo = new THREE.ConeGeometry(1, 1, 8);
  const sphereGeo = new THREE.SphereGeometry(1, 12, 10);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 14);
  const gableRoofGeo = createGableRoofGeo();
  const flowerGeo = new THREE.DodecahedronGeometry(1, 0);
  const mistPlaneGeo = new THREE.PlaneGeometry(1, 1);

  return {
    env,
    terrainMat,
    cloudMat,
    foliageGeo,
    trunkGeo,
    rockGeo,
    boxGeo,
    coneGeo,
    sphereGeo,
    cylinderGeo,
    gableRoofGeo,
    flowerGeo,
    mistPlaneGeo,
    waterTopMats,
    waterWallMats,
    waterWallMatMap,
    dispose: () => {
      waterTopMats.forEach((m) => m.dispose());
      waterWallMatMap.forEach((m) => m.dispose());
      foliageGeo.dispose();
      trunkGeo.dispose();
      rockGeo.dispose();
      boxGeo.dispose();
      coneGeo.dispose();
      sphereGeo.dispose();
      cylinderGeo.dispose();
      gableRoofGeo.dispose();
      flowerGeo.dispose();
      mistPlaneGeo.dispose();
    },
  };
}

function hashSeed(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hashSeed(ix, iy);
  const b = hashSeed(ix + 1, iy);
  const c = hashSeed(ix, iy + 1);
  const d = hashSeed(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm2(x: number, y: number): number {
  return (
    noise2(x, y) * 0.55 +
    noise2(x * 2.1 + 7.3, y * 2.1 + 3.7) * 0.3 +
    noise2(x * 4.3 + 19.1, y * 4.3 + 11.9) * 0.15
  );
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

interface TerrainSliceConfig {
  segments?: number;
  baseY?: number;
  strataTopColor: string;
  strataBottomColor: string;
  heightAt: (x: number, z: number) => number;
  topColorAt: (x: number, z: number, h: number, slope: number, target: THREE.Color) => void;
  waterLevel?: number;
  waterMask?: (x: number, z: number, h: number) => boolean;
  waterPalette?: CutawayWaterOptions;
  cavernCutout?: (x: number, z: number) => boolean;
}

interface TerrainMeshResult {
  terrainMesh: THREE.Mesh;
  waterTopMesh?: THREE.Mesh;
  waterWallMesh?: THREE.Mesh;
  waterMats: THREE.ShaderMaterial[];
  localGeometries: THREE.BufferGeometry[];
}

function getCachedWaterMats(
  shared: SliceSharedAssets,
  key: string,
  opts: CutawayWaterOptions
): { top: THREE.ShaderMaterial; wall: THREE.ShaderMaterial } {
  let top = shared.waterTopMats.get(key);
  let wall = shared.waterWallMatMap.get(key);
  if (!top) {
    top = createCutawayWaterTopMaterial(shared.env, opts);
    shared.waterTopMats.set(key, top);
  }
  if (!wall) {
    wall = createCutawayWaterWallMaterial(shared.env, opts);
    shared.waterWallMatMap.set(key, wall);
    shared.waterWallMats.push(wall);
  }
  return { top, wall };
}

function buildTerrainAndWaterMeshes(
  shared: SliceSharedAssets,
  paletteKey: string,
  cfg: TerrainSliceConfig
): TerrainMeshResult {
  const N = cfg.segments ?? 44;
  const half = SLICE_HALF;
  const step = (half * 2) / N;
  const baseY = cfg.baseY ?? 0;

  const heights = new Float32Array((N + 1) * (N + 1));
  const xs = new Float32Array(N + 1);
  const zs = new Float32Array(N + 1);

  for (let i = 0; i <= N; i++) {
    const coord = -half + i * step;
    xs[i] = coord;
    zs[i] = coord;
  }

  for (let iz = 0; iz <= N; iz++) {
    for (let ix = 0; ix <= N; ix++) {
      heights[iz * (N + 1) + ix] = Math.max(baseY + 0.08, cfg.heightAt(xs[ix], zs[iz]));
    }
  }

  const hAt = (ix: number, iz: number) => heights[iz * (N + 1) + ix];

  const pos: number[] = [];
  const norm: number[] = [];
  const col: number[] = [];
  const topYAttr: number[] = [];
  const idx: number[] = [];

  const cTop = new THREE.Color();
  const cStrataTop = new THREE.Color(cfg.strataTopColor);
  const cStrataBot = new THREE.Color(cfg.strataBottomColor);
  const cStrataMix = new THREE.Color();

  // Top terrain vertices
  for (let iz = 0; iz <= N; iz++) {
    for (let ix = 0; ix <= N; ix++) {
      const x = xs[ix];
      const z = zs[iz];
      const y = hAt(ix, iz);

      const hx0 = hAt(Math.max(0, ix - 1), iz);
      const hx1 = hAt(Math.min(N, ix + 1), iz);
      const hz0 = hAt(ix, Math.max(0, iz - 1));
      const hz1 = hAt(ix, Math.min(N, iz + 1));
      const dx = (hx1 - hx0) / (step * (ix === 0 || ix === N ? 1 : 2));
      const dz = (hz1 - hz0) / (step * (iz === 0 || iz === N ? 1 : 2));
      const len = Math.hypot(dx, 1, dz) || 1;
      const nx = -dx / len;
      const ny = 1 / len;
      const nz = -dz / len;
      const slope = 1 - ny;

      cfg.topColorAt(x, z, y, slope, cTop);
      pos.push(x, y, z);
      norm.push(nx, ny, nz);
      col.push(cTop.r, cTop.g, cTop.b);
      topYAttr.push(y);
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

  // Helper to emit vertical cutaway strata side walls with exact aTopY for humus rim shading
  const emitSideWall = (
    samples: Array<{ x: number; z: number; topY: number; botY: number }>,
    nx: number,
    nz: number,
    flipWinding: boolean
  ) => {
    const startVert = pos.length / 3;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      // Bottom vertex
      pos.push(s.x, s.botY, s.z);
      norm.push(nx, 0, nz);
      col.push(cStrataBot.r, cStrataBot.g, cStrataBot.b);
      topYAttr.push(s.topY);
      // Top vertex
      pos.push(s.x, s.topY, s.z);
      norm.push(nx, 0, nz);
      cStrataMix.copy(cStrataBot).lerp(cStrataTop, clamp01((s.topY - baseY) / 1.4));
      col.push(cStrataMix.r, cStrataMix.g, cStrataMix.b);
      topYAttr.push(s.topY);
    }
    for (let i = 0; i < samples.length - 1; i++) {
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

  const frontSamples: Array<{ x: number; z: number; topY: number; botY: number }> = [];
  const backSamples: Array<{ x: number; z: number; topY: number; botY: number }> = [];
  const rightSamples: Array<{ x: number; z: number; topY: number; botY: number }> = [];
  const leftSamples: Array<{ x: number; z: number; topY: number; botY: number }> = [];

  for (let i = 0; i <= N; i++) {
    const fCut = cfg.cavernCutout?.(xs[i], half);
    frontSamples.push({
      x: xs[i],
      z: half,
      topY: hAt(i, N),
      botY: fCut ? baseY + 0.9 : baseY,
    });
    backSamples.push({ x: xs[i], z: -half, topY: hAt(i, 0), botY: baseY });

    const rCut = cfg.cavernCutout?.(half, zs[i]);
    rightSamples.push({
      x: half,
      z: zs[i],
      topY: hAt(N, i),
      botY: rCut ? baseY + 0.9 : baseY,
    });
    leftSamples.push({ x: -half, z: zs[i], topY: hAt(0, i), botY: baseY });
  }

  emitSideWall(frontSamples, 0, 1, true);
  emitSideWall(backSamples, 0, -1, false);
  emitSideWall(rightSamples, 1, 0, false);
  emitSideWall(leftSamples, -1, 0, true);

  const botStart = pos.length / 3;
  pos.push(-half, baseY, -half, half, baseY, -half, half, baseY, half, -half, baseY, half);
  for (let i = 0; i < 4; i++) {
    norm.push(0, -1, 0);
    col.push(cStrataBot.r * 0.65, cStrataBot.g * 0.65, cStrataBot.b * 0.65);
    topYAttr.push(baseY + 1.0);
  }
  idx.push(botStart, botStart + 1, botStart + 2, botStart, botStart + 2, botStart + 3);

  const terrainGeo = new THREE.BufferGeometry();
  terrainGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  terrainGeo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  terrainGeo.setAttribute('aTopY', new THREE.Float32BufferAttribute(topYAttr, 1));
  terrainGeo.setIndex(idx);

  const terrainMesh = new THREE.Mesh(terrainGeo, shared.terrainMat);
  terrainMesh.castShadow = true;
  terrainMesh.receiveShadow = true;

  const localGeometries: THREE.BufferGeometry[] = [terrainGeo];
  const waterMats: THREE.ShaderMaterial[] = [];
  let waterTopMesh: THREE.Mesh | undefined;
  let waterWallMesh: THREE.Mesh | undefined;

  if (cfg.waterLevel !== undefined && cfg.waterPalette) {
    const wl = cfg.waterLevel;
    const wMask = cfg.waterMask ?? ((_x: number, _z: number, h: number) => h < wl - 0.01);
    const { top: wTopMat, wall: wWallMat } = getCachedWaterMats(
      shared,
      paletteKey,
      cfg.waterPalette
    );
    waterMats.push(wTopMat, wWallMat);

    const wPos: number[] = [];
    const wDepth: number[] = [];
    const wIdx: number[] = [];
    const vertMap = new Int32Array((N + 1) * (N + 1)).fill(-1);

    for (let iz = 0; iz < N; iz++) {
      for (let ix = 0; ix < N; ix++) {
        const corners: Array<[number, number]> = [
          [ix, iz],
          [ix + 1, iz],
          [ix, iz + 1],
          [ix + 1, iz + 1],
        ];
        let hasWater = false;
        for (const [cx, cz] of corners) {
          if (wMask(xs[cx], zs[cz], hAt(cx, cz))) {
            hasWater = true;
            break;
          }
        }
        if (!hasWater) continue;

        const cornerIds: number[] = [];
        for (const [cx, cz] of corners) {
          const k = cz * (N + 1) + cx;
          if (vertMap[k] === -1) {
            vertMap[k] = wPos.length / 3;
            wPos.push(xs[cx], wl, zs[cz]);
            wDepth.push(wl - hAt(cx, cz));
          }
          cornerIds.push(vertMap[k]);
        }
        wIdx.push(
          cornerIds[0],
          cornerIds[2],
          cornerIds[1],
          cornerIds[1],
          cornerIds[2],
          cornerIds[3]
        );
      }
    }

    if (wIdx.length > 0) {
      const wTopGeo = new THREE.BufferGeometry();
      wTopGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
      wTopGeo.setAttribute('aDepth', new THREE.Float32BufferAttribute(wDepth, 1));
      wTopGeo.setIndex(wIdx);
      wTopGeo.computeVertexNormals();
      localGeometries.push(wTopGeo);

      waterTopMesh = new THREE.Mesh(wTopGeo, wTopMat);
      waterTopMesh.renderOrder = 2;
    }

    const wwPos: number[] = [];
    const wwUv: number[] = [];
    const wwIdx: number[] = [];

    const emitWaterWall = (
      sampleFn: (i: number) => { x: number; z: number; h: number },
      flip: boolean
    ) => {
      for (let i = 0; i < N; i++) {
        const s0 = sampleFn(i);
        const s1 = sampleFn(i + 1);
        const d0 = wl - s0.h;
        const d1 = wl - s1.h;
        if (d0 <= 0.015 && d1 <= 0.015) continue;
        if (!wMask(s0.x, s0.z, s0.h) && !wMask(s1.x, s1.z, s1.h)) continue;

        const base = wwPos.length / 3;
        const b0 = Math.min(wl, s0.h);
        const b1 = Math.min(wl, s1.h);
        wwPos.push(s0.x, b0, s0.z, s0.x, wl, s0.z, s1.x, b1, s1.z, s1.x, wl, s1.z);
        wwUv.push(i / N, 0, i / N, 1, (i + 1) / N, 0, (i + 1) / N, 1);
        if (flip) {
          wwIdx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
        } else {
          wwIdx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        }
      }
    };

    emitWaterWall((i) => ({ x: xs[i], z: half, h: hAt(i, N) }), true);
    emitWaterWall((i) => ({ x: xs[i], z: -half, h: hAt(i, 0) }), false);
    emitWaterWall((i) => ({ x: half, z: zs[i], h: hAt(N, i) }), false);
    emitWaterWall((i) => ({ x: -half, z: zs[i], h: hAt(0, i) }), true);

    if (wwIdx.length > 0) {
      const wWallGeo = new THREE.BufferGeometry();
      wWallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wwPos, 3));
      wWallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wwUv, 2));
      wWallGeo.setIndex(wwIdx);
      wWallGeo.computeVertexNormals();
      localGeometries.push(wWallGeo);

      waterWallMesh = new THREE.Mesh(wWallGeo, wWallMat);
      waterWallMesh.renderOrder = 3;
    }
  }

  return { terrainMesh, waterTopMesh, waterWallMesh, waterMats, localGeometries };
}

type TreeStyle = 'bush' | 'oak' | 'acacia' | 'quiver' | 'jacaranda';

interface TreePlacement {
  x: number;
  y: number;
  z: number;
  scale: number;
  color: string;
  style?: TreeStyle;
}

/**
 * Multi-part sculpted trees & fynbos shrubs: tapered bark trunks + overlapping
 * multi-lobed InstancedMesh canopy tufts so foliage reads organically rather than single spheres.
 */
function addInstancedTrees(
  parent: THREE.Group,
  shared: SliceSharedAssets,
  trees: TreePlacement[],
  matsToDispose: THREE.Material[]
): void {
  if (trees.length === 0) return;
  const barkMat = new THREE.MeshStandardMaterial({ color: '#6b533e', roughness: 0.92 });
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0.02 });
  matsToDispose.push(barkMat, leafMat);

  const trunkItems: Array<{ x: number; y: number; z: number; sx: number; sy: number; r: number }> =
    [];
  const puffItems: Array<{
    x: number;
    y: number;
    z: number;
    sx: number;
    sy: number;
    sz: number;
    rx: number;
    ry: number;
    color: string;
  }> = [];

  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    const st = t.style ?? 'bush';
    const seedA = hashSeed(t.x * 13.7, t.z * 9.3);
    const seedB = hashSeed(t.z * 7.1, t.x * 15.9);

    if (st === 'bush') {
      // Sculpted asymmetrical 2-lobe fynbos cluster seated low into terrain
      puffItems.push({
        x: t.x,
        y: t.y + t.scale * 0.35,
        z: t.z,
        sx: t.scale * (1.05 + seedA * 0.25),
        sy: t.scale * (0.72 + seedB * 0.2),
        sz: t.scale * (1.0 + seedB * 0.22),
        rx: seedA * 0.4,
        ry: seedB * Math.PI * 2,
        color: t.color,
      });
      puffItems.push({
        x: t.x + (seedA - 0.5) * t.scale * 0.7,
        y: t.y + t.scale * 0.25,
        z: t.z + (seedB - 0.5) * t.scale * 0.7,
        sx: t.scale * 0.72,
        sy: t.scale * 0.58,
        sz: t.scale * 0.72,
        rx: seedB * 0.4,
        ry: seedA * Math.PI * 2,
        color: t.color,
      });
    } else if (st === 'acacia') {
      const th = t.scale * 1.45;
      trunkItems.push({ x: t.x, y: t.y + th * 0.46, z: t.z, sx: t.scale * 0.38, sy: th, r: seedA });
      // Flat spreading umbrella canopy made of 3 overlapping flat domes
      for (let k = 0; k < 3; k++) {
        const ang = seedB * 6.28 + k * 2.1;
        const off = k === 0 ? 0 : t.scale * 0.48;
        puffItems.push({
          x: t.x + Math.cos(ang) * off,
          y: t.y + th + (k === 0 ? 0.015 : 0),
          z: t.z + Math.sin(ang) * off,
          sx: t.scale * (k === 0 ? 1.35 : 0.95),
          sy: t.scale * 0.34,
          sz: t.scale * (k === 0 ? 1.28 : 0.92),
          rx: 0.08,
          ry: ang,
          color: t.color,
        });
      }
    } else if (st === 'quiver') {
      const th = t.scale * 2.2;
      trunkItems.push({ x: t.x, y: t.y + th * 0.48, z: t.z, sx: t.scale * 0.52, sy: th, r: seedA });
      for (let k = 0; k < 3; k++) {
        const ang = seedA * 6.28 + k * 2.09;
        const off = t.scale * 0.36;
        puffItems.push({
          x: t.x + Math.cos(ang) * off,
          y: t.y + th + t.scale * 0.14,
          z: t.z + Math.sin(ang) * off,
          sx: t.scale * 0.62,
          sy: t.scale * 0.52,
          sz: t.scale * 0.62,
          rx: 0.2,
          ry: ang,
          color: t.color,
        });
      }
    } else {
      // Tall full-crowned Oak or blooming Jacaranda
      const th = t.scale * (st === 'oak' ? 1.55 : 1.35);
      trunkItems.push({ x: t.x, y: t.y + th * 0.48, z: t.z, sx: t.scale * 0.42, sy: th, r: seedA });
      for (let k = 0; k < 3; k++) {
        const ang = seedB * 6.28 + k * 2.05;
        const off = k === 0 ? 0 : t.scale * 0.36;
        puffItems.push({
          x: t.x + Math.cos(ang) * off,
          y: t.y + th + (k === 0 ? t.scale * 0.32 : t.scale * 0.12),
          z: t.z + Math.sin(ang) * off,
          sx: t.scale * (k === 0 ? 0.95 : 0.78),
          sy: t.scale * (k === 0 ? 0.85 : 0.68),
          sz: t.scale * (k === 0 ? 0.95 : 0.78),
          rx: seedA * 0.35,
          ry: ang,
          color: t.color,
        });
      }
    }
  }

  const dummy = new THREE.Object3D();
  const c = new THREE.Color();

  if (trunkItems.length > 0) {
    const trunkMesh = new THREE.InstancedMesh(shared.trunkGeo, barkMat, trunkItems.length);
    for (let i = 0; i < trunkItems.length; i++) {
      const tr = trunkItems[i];
      dummy.position.set(tr.x, tr.y, tr.z);
      dummy.rotation.set((tr.r - 0.5) * 0.12, tr.r * 6.28, 0);
      dummy.scale.set(tr.sx, tr.sy, tr.sx);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);
    }
    trunkMesh.instanceMatrix.needsUpdate = true;
    trunkMesh.computeBoundingSphere();
    trunkMesh.castShadow = true;
    parent.add(trunkMesh);
  }

  if (puffItems.length > 0) {
    const puffMesh = new THREE.InstancedMesh(shared.foliageGeo, leafMat, puffItems.length);
    for (let i = 0; i < puffItems.length; i++) {
      const p = puffItems[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rx * 0.6);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.updateMatrix();
      puffMesh.setMatrixAt(i, dummy.matrix);
      c.set(p.color);
      // Slight per-lobe sun variation
      c.offsetHSL(0, 0, (hashSeed(i, 7) - 0.5) * 0.08);
      puffMesh.setColorAt(i, c);
    }
    puffMesh.instanceMatrix.needsUpdate = true;
    if (puffMesh.instanceColor) puffMesh.instanceColor.needsUpdate = true;
    puffMesh.computeBoundingSphere();
    puffMesh.castShadow = true;
    puffMesh.receiveShadow = true;
    parent.add(puffMesh);
  }
}

function addInstancedRocks(
  parent: THREE.Group,
  shared: SliceSharedAssets,
  rocks: Array<{
    x: number;
    y: number;
    z: number;
    sx: number;
    sy: number;
    sz: number;
    ry: number;
    color: string;
  }>,
  matsToDispose: THREE.Material[]
): void {
  if (rocks.length === 0) return;
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.04 });
  matsToDispose.push(mat);
  const mesh = new THREE.InstancedMesh(shared.rockGeo, mat, rocks.length);
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  rocks.forEach((r, i) => {
    dummy.position.set(r.x, r.y, r.z);
    dummy.rotation.set(0.18 * (i % 3), r.ry, 0.12 * (i % 2));
    dummy.scale.set(r.sx, r.sy, r.sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    c.set(r.color);
    mesh.setColorAt(i, c);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function addInstancedFlowers(
  parent: THREE.Group,
  shared: SliceSharedAssets,
  tufts: Array<{ x: number; y: number; z: number; scale: number; color: string }>,
  matsToDispose: THREE.Material[]
): void {
  if (tufts.length === 0) return;
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.0 });
  matsToDispose.push(mat);
  const mesh = new THREE.InstancedMesh(shared.flowerGeo, mat, tufts.length);
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  tufts.forEach((f, i) => {
    dummy.position.set(f.x, f.y, f.z);
    dummy.rotation.set(0, hashSeed(f.x, f.z) * 6.28, 0);
    dummy.scale.set(f.scale, f.scale * 0.48, f.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    c.set(f.color);
    mesh.setColorAt(i, c);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  parent.add(mesh);
}

/**
 * Composite pitched-roof cottage with crisp gable prism, chimney, and warm evening window strip.
 */
function makeGabledHouse(
  shared: SliceSharedAssets,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
  winGlowMat: THREE.Material | null,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  chimney = false
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;

  const body = new THREE.Mesh(shared.boxGeo, wallMat);
  body.scale.set(w, h, d);
  body.position.y = h * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(shared.gableRoofGeo, roofMat);
  roof.scale.set(d * 1.05, h * 0.72, w * 1.02);
  roof.rotation.y = Math.PI * 0.5;
  roof.position.y = h + h * 0.17;
  roof.castShadow = true;
  g.add(roof);

  if (winGlowMat) {
    const win = new THREE.Mesh(shared.boxGeo, winGlowMat);
    win.scale.set(w * 0.56, h * 0.28, d * 1.04);
    win.position.y = h * 0.52;
    g.add(win);
  }

  if (chimney) {
    const ch = new THREE.Mesh(shared.boxGeo, wallMat);
    ch.scale.set(w * 0.14, h * 0.75, w * 0.14);
    ch.position.set(w * 0.28, h + h * 0.34, 0);
    g.add(ch);
  }

  return g;
}

function makeRondavel(
  shared: SliceSharedAssets,
  wallMat: THREE.Material,
  thatchMat: THREE.Material,
  baseMat: THREE.Material,
  x: number,
  y: number,
  z: number,
  r = 0.08
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const plinth = new THREE.Mesh(shared.cylinderGeo, baseMat);
  plinth.scale.set(r * 1.08, r * 0.3, r * 1.08);
  plinth.position.y = r * 0.12;
  g.add(plinth);

  const wall = new THREE.Mesh(shared.cylinderGeo, wallMat);
  wall.scale.set(r, r * 0.9, r);
  wall.position.y = r * 0.55;
  wall.castShadow = true;
  g.add(wall);

  const roof = new THREE.Mesh(shared.coneGeo, thatchMat);
  roof.scale.set(r * 1.36, r * 1.06, r * 1.36);
  roof.position.y = r * 1.38;
  roof.castShadow = true;
  g.add(roof);
  return g;
}

function makeSafariVehicle(
  shared: SliceSharedAssets,
  bodyMat: THREE.Material,
  wheelMat: THREE.Material,
  canopyMat: THREE.Material,
  headlightMat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotY: number,
  scale = 1
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  g.scale.setScalar(scale);

  const chassis = new THREE.Mesh(shared.boxGeo, bodyMat);
  chassis.scale.set(0.068, 0.036, 0.14);
  chassis.position.y = 0.026;
  chassis.castShadow = true;
  g.add(chassis);

  const cab = new THREE.Mesh(shared.boxGeo, canopyMat);
  cab.scale.set(0.064, 0.028, 0.095);
  cab.position.set(0, 0.056, -0.012);
  g.add(cab);

  [-0.036, 0.036].forEach((wx) => {
    [-0.042, 0.042].forEach((wz) => {
      const wheel = new THREE.Mesh(shared.cylinderGeo, wheelMat);
      wheel.rotation.z = Math.PI * 0.5;
      wheel.scale.set(0.018, 0.014, 0.018);
      wheel.position.set(wx, 0.016, wz);
      g.add(wheel);
    });
  });

  const lamps = new THREE.Mesh(shared.boxGeo, headlightMat);
  lamps.scale.set(0.052, 0.01, 0.008);
  lamps.position.set(0, 0.026, 0.072);
  g.add(lamps);

  return g;
}

function addRoadRibbon(
  parent: THREE.Group,
  points: THREE.Vector3[],
  width: number,
  color: string,
  geosToDispose: THREE.BufferGeometry[],
  matsToDispose: THREE.Material[]
): void {
  const curve = new THREE.CatmullRomCurve3(points);
  const segs = 38;
  const pos: number[] = [];
  const idx: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPoint(t);
    curve.getTangent(t, tangent);
    side
      .crossVectors(tangent, up)
      .normalize()
      .multiplyScalar(width * 0.5);
    pos.push(p.x - side.x, p.y + 0.016, p.z - side.z);
    pos.push(p.x + side.x, p.y + 0.016, p.z + side.z);
    if (i < segs) {
      const b = i * 2;
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  geosToDispose.push(geo);
  matsToDispose.push(mat);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  parent.add(mesh);
}

/**
 * 24 curated South African isometric cutaway place slices spaced generously (~5.4+ units
 * apart for 3.0×3.0 blocks, leaving >= 2.4 units of clear negative space around every island).
 */
export const PLACE_SLICE_SPECS: readonly PlaceSliceSpec[] = (() => {
  const entries: Array<{ name: string; pos: [number, number]; sub: string }> = [
    // Western Cape archipelago (South-West arc)
    {
      name: 'Robben Island',
      pos: [-18.8, 3.2],
      sub: 'Limestone quarry, prison courtyard & harbour ferry slice',
    },
    {
      name: 'Table Mountain',
      pos: [-13.8, 7.2],
      sub: 'Sandstone buttresses, cableway & drifting tablecloth',
    },
    {
      name: 'Cape Point Lighthouse',
      pos: [-14.6, 13.0],
      sub: 'Peninsula headland, red-tipped beacon & Flying Dutchman',
    },
    {
      name: 'Groot Constantia',
      pos: [-8.6, 7.2],
      sub: 'Cape Dutch gables, shade oaks & Constantia vineyards',
    },
    {
      name: 'Boulders Beach',
      pos: [-9.2, 13.0],
      sub: 'Granite boulder cove & African penguin boardwalk',
    },
    {
      name: 'Hermanus Whale Watching',
      pos: [-3.8, 13.4],
      sub: 'Walker Bay cliffside cottages & breaching whales',
    },
    {
      name: 'Knysna Heads',
      pos: [1.8, 12.8],
      sub: 'Twin lagoon cliffs & turquoise marina sailboats',
    },

    // Northern Cape & West interior
    {
      name: 'Richtersveld',
      pos: [-14.8, -3.4],
      sub: 'Namaqualand wildflower bloom, windpump & quiver trees',
    },
    {
      name: 'Augrabies Falls',
      pos: [-9.6, -8.2],
      sub: 'Orange River granite gorge & plunging canyon spray',
    },
    {
      name: 'The Big Hole',
      pos: [-4.2, -2.0],
      sub: 'Stepped kimberlite diamond crater, headframe & emerald lake',
    },

    // Free State & North West
    {
      name: 'Gariep Dam',
      pos: [1.8, 6.2],
      sub: 'Curved Orange River arch dam, spillway & reservoir',
    },
    {
      name: 'Golden Gate Highlands',
      pos: [7.0, 1.8],
      sub: 'Fluted golden sandstone spires & cliffside lookout',
    },
    {
      name: 'Palace of the Lost City',
      pos: [-3.8, -8.0],
      sub: 'Turquoise mosaic domes & Valley of Waves lagoon',
    },

    // Gauteng cluster
    {
      name: 'Cradle of Humankind',
      pos: [2.0, -6.8],
      sub: 'Maropeng mound & glowing subterranean dolomite cavern',
    },
    {
      name: 'Orlando Towers',
      pos: [1.8, -0.6],
      sub: 'Painted Soweto cooling towers, pitch & township crossroads',
    },
    {
      name: 'Union Buildings',
      pos: [7.6, -6.8],
      sub: 'Baker colonnade, terraced lawns & purple jacarandas',
    },

    // Eastern Cape
    {
      name: 'Storms River Mouth',
      pos: [7.4, 12.4],
      sub: 'Tsitsikamma forest gorge, suspension bridge & amber estuary',
    },
    {
      name: 'Hole in the Wall',
      pos: [13.0, 10.8],
      sub: 'Wild Coast arched basalt sea stack & coastal rondavels',
    },

    // KwaZulu-Natal
    {
      name: 'Sani Pass',
      pos: [12.8, 4.6],
      sub: 'Escarpment 4x4 hairpin switchbacks & border chalet',
    },
    {
      name: 'Drakensberg Amphitheatre',
      pos: [12.4, -1.6],
      sub: 'Basalt amphitheatre wall & multi-tier Tugela cascade',
    },
    {
      name: 'iSimangaliso Wetland Park',
      pos: [18.2, 1.4],
      sub: 'Estuary hippos, barrier dunes & turquoise surf',
    },

    // Mpumalanga & Limpopo
    {
      name: 'Three Rondavels',
      pos: [13.4, -7.8],
      sub: 'Blyde Canyon quartzite huts & emerald gorge river',
    },
    {
      name: 'Kruger National Park',
      pos: [18.6, -6.4],
      sub: 'Red bushveld safari track & elephant waterhole',
    },
    {
      name: 'Mapungubwe Hill',
      pos: [8.2, -12.6],
      sub: 'Ancient royal sandstone mesa & swollen baobab crown',
    },
  ];

  return entries.map((e) => {
    const idx = LANDMARKS.findIndex((lm) => lm.k === e.name);
    const meta = LANDMARKS[Math.max(0, idx)];
    return {
      landmarkName: e.name,
      landmarkIndex: Math.max(0, idx),
      province: meta.c.split(' · ')[1] ?? 'South Africa',
      gridPos: e.pos,
      subtitle: e.sub,
    };
  });
})();

/**
 * Build one complete isometric geological cutaway slice diorama tailored to its place
 * with individual architectural details, sculpted multi-part foliage, and localized weather FX.
 */
export function buildPlaceSlice(
  spec: PlaceSliceSpec,
  shared: SliceSharedAssets,
  seed: number
): BuiltPlaceSlice {
  const root = new THREE.Group();
  root.position.set(0, 0, 0);
  root.visible = false;

  const localGeometries: THREE.BufferGeometry[] = [];
  const localMaterials: THREE.Material[] = [];
  const glowMats: THREE.MeshStandardMaterial[] = [];
  const extraWaterMats: THREE.ShaderMaterial[] = [];
  const sliceTicks: Array<(elapsed: number, lit: number) => void> = [];

  const trackMat = <T extends THREE.Material>(m: T): T => {
    localMaterials.push(m);
    return m;
  };
  const trackGlowMat = (color: string, emissive: string, intensity = 0.8) => {
    const m = trackMat(
      new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: intensity,
        roughness: 0.38,
      })
    );
    glowMats.push(m);
    return m;
  };

  // Helper to attach localized rising mist / surf spray / ridge fog plume per biome
  const addLocalMistPlume = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    tint: string,
    baseOpacity: number,
    tiltX = -0.35,
    rotY = 0.55
  ) => {
    const mistMat = trackMat(createSliceMistMaterial(shared.env, tint, baseOpacity));
    const mesh = new THREE.Mesh(shared.mistPlaneGeo, mistMat);
    mesh.scale.set(w, h, 1);
    mesh.position.set(x, y, z);
    mesh.rotation.set(tiltX, rotY, 0);
    mesh.renderOrder = 4;
    root.add(mesh);
    sliceTicks.push((elapsed) => {
      mistMat.uniforms.uOpacity.value =
        baseOpacity * (0.78 + 0.25 * Math.sin(elapsed * 0.9 + seed));
    });
    return mesh;
  };

  // Warm dusk/night architectural windows & streetlights
  const warmWindowMat = trackGlowMat('#ffe19c', '#ffaa38', 0.35);

  const cScratch = new THREE.Color();
  const oceanWater: CutawayWaterOptions = {
    shallowColor: '#25bdd1',
    deepColor: '#063d54',
    foamStrength: 1.05,
    turbulence: 1.08,
    clarity: 0.85,
  };
  const riverWater: CutawayWaterOptions = {
    shallowColor: '#41ced6',
    deepColor: '#0b5a6e',
    foamStrength: 1.2,
    turbulence: 1.28,
    clarity: 0.74,
  };
  const tanninWater: CutawayWaterOptions = {
    shallowColor: '#915524',
    deepColor: '#0a485f',
    foamStrength: 1.12,
    turbulence: 1.05,
    clarity: 0.68,
  };
  const muddyWater: CutawayWaterOptions = {
    shallowColor: '#9c8663',
    deepColor: '#5c4b34',
    foamStrength: 0.14,
    turbulence: 0.35,
    clarity: 0.45,
  };
  const emeraldWater: CutawayWaterOptions = {
    shallowColor: '#128a72',
    deepColor: '#053b31',
    foamStrength: 0.14,
    turbulence: 0.35,
    clarity: 0.78,
  };

  const name = spec.landmarkName;
  let maxTopY = 1.6;
  let terrainCfg: TerrainSliceConfig;
  const postDecorators: Array<(heightAt: (x: number, z: number) => number) => void> = [];

  if (name === 'Hermanus Whale Watching') {
    const heightAt = (x: number, z: number) => {
      const coastLine = 0.18 + Math.sin(z * 1.45) * 0.38 - z * 0.28;
      const onCliff = smoothstep(coastLine - 0.14, coastLine + 0.18, -x);
      const slope = clamp01((-x - coastLine) * 0.45);
      const noise = fbm2(x * 1.9 + 2, z * 1.9 + 5) * 0.17;
      return 0.42 + onCliff * (0.88 + slope * 0.42) + noise * (0.4 + onCliff * 0.6);
    };
    terrainCfg = {
      strataTopColor: '#cfa76a',
      strataBottomColor: '#69553f',
      heightAt,
      waterLevel: 0.84,
      waterPalette: oceanWater,
      topColorAt: (x, z, h, slope, out) => {
        if (h < 0.86) out.set('#967f5c');
        else if (slope > 0.34) out.set('#bd965e');
        else out.set('#557b34').lerp(cScratch.set('#7a8e43'), fbm2(x * 3, z * 3));
      },
    };
    maxTopY = 1.85;
    postDecorators.push((hFn) => {
      const whiteWall = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.8 })
      );
      const slateRoof = trackMat(
        new THREE.MeshStandardMaterial({ color: '#262d36', roughness: 0.82 })
      );
      const wheelMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#1b1d22', roughness: 0.9 })
      );
      const carMat = trackMat(new THREE.MeshStandardMaterial({ color: '#c4cdd6', roughness: 0.4 }));
      const cottageSpot: Array<[number, number, number]> = [
        [-1.12, -0.95, 0.3],
        [-0.8, -0.62, 0.25],
        [-0.98, -0.22, 0.1],
        [-0.65, 0.12, -0.15],
        [-1.08, 0.56, 0.2],
        [-0.74, 0.88, -0.2],
        [-0.45, -0.92, 0.45],
        [-0.46, 0.52, -0.1],
      ];
      cottageSpot.forEach(([x, z, rot], idx) => {
        root.add(
          makeGabledHouse(
            shared,
            whiteWall,
            slateRoof,
            warmWindowMat,
            0.18,
            0.105,
            0.13,
            x,
            hFn(x, z),
            z,
            rot,
            idx % 2 === 0
          )
        );
      });
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.38, hFn(-1.38, -0.8), -0.8),
          new THREE.Vector3(-0.75, hFn(-0.75, -0.2), -0.2),
          new THREE.Vector3(-0.68, hFn(-0.68, 0.65), 0.65),
          new THREE.Vector3(-1.2, hFn(-1.2, 1.35), 1.35),
        ],
        0.14,
        '#6f6c66',
        localGeometries,
        localMaterials
      );
      root.add(
        makeSafariVehicle(
          shared,
          carMat,
          wheelMat,
          carMat,
          warmWindowMat,
          -0.78,
          hFn(-0.78, 0.18),
          0.18,
          0.2,
          0.65
        )
      );

      const trees: TreePlacement[] = [];
      for (let i = 0; i < 42; i++) {
        const rx = -1.38 + hashSeed(i, 1) * 1.18;
        const rz = -1.35 + hashSeed(i, 2) * 2.65;
        const ry = hFn(rx, rz);
        if (ry > 1.12) {
          trees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.048 + hashSeed(i, 3) * 0.04,
            color: i % 3 === 0 ? '#6e8b38' : '#4a6b28',
            style: i % 7 === 0 ? 'oak' : 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);

      // Coastal limestone cliff boulders along the Walker Bay tide line
      const coastRocks = [
        [0.08, -0.82, 0.16],
        [0.14, -0.35, 0.19],
        [0.22, 0.18, 0.21],
        [0.28, 0.72, 0.17],
        [0.12, 1.08, 0.15],
      ].map(([rx, rz, rs], idx) => ({
        x: rx,
        y: Math.max(0.76, hFn(rx, rz)) + rs * 0.15,
        z: rz,
        sx: rs * 1.25,
        sy: rs * 0.78,
        sz: rs,
        ry: idx * 1.2,
        color: '#8e7e64',
      }));
      addInstancedRocks(root, shared, coastRocks, localMaterials);

      // Sculpted Southern Right Whales (body + pectoral fins + wide tail fluke + animated spout)
      const whaleMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#27323f', roughness: 0.36 })
      );
      const bellyMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#8e99a4', roughness: 0.45 })
      );
      const spoutMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#e8f7ff',
          transparent: true,
          opacity: 0.72,
          roughness: 0.6,
        })
      );
      const whales: Array<{ g: THREE.Group; spout: THREE.Mesh }> = [];
      [
        { x: 0.68, z: 0.54, s: 1.05, rot: -0.65 },
        { x: 0.96, z: -0.18, s: 0.75, rot: 0.42 },
      ].forEach((w) => {
        const wg = new THREE.Group();
        wg.position.set(w.x, 0.83, w.z);
        wg.rotation.y = w.rot;
        const body = new THREE.Mesh(shared.sphereGeo, whaleMat);
        body.scale.set(0.08 * w.s, 0.068 * w.s, 0.23 * w.s);
        const belly = new THREE.Mesh(shared.sphereGeo, bellyMat);
        belly.scale.set(0.065 * w.s, 0.03 * w.s, 0.17 * w.s);
        belly.position.y = -0.04 * w.s;
        const finL = new THREE.Mesh(shared.boxGeo, whaleMat);
        finL.scale.set(0.11 * w.s, 0.012 * w.s, 0.045 * w.s);
        finL.position.set(0.075 * w.s, -0.01, 0.03 * w.s);
        finL.rotation.z = -0.35;
        const finR = new THREE.Mesh(shared.boxGeo, whaleMat);
        finR.scale.set(0.11 * w.s, 0.012 * w.s, 0.045 * w.s);
        finR.position.set(-0.075 * w.s, -0.01, 0.03 * w.s);
        finR.rotation.z = 0.35;
        const fluke = new THREE.Mesh(shared.boxGeo, whaleMat);
        fluke.scale.set(0.165 * w.s, 0.014 * w.s, 0.065 * w.s);
        fluke.position.z = -0.22 * w.s;
        const spout = new THREE.Mesh(shared.coneGeo, spoutMat);
        spout.scale.set(0.045 * w.s, 0.18 * w.s, 0.045 * w.s);
        spout.rotation.x = Math.PI;
        spout.position.set(0, 0.14 * w.s, 0.09 * w.s);
        wg.add(body, belly, finL, finR, fluke, spout);
        root.add(wg);
        whales.push({ g: wg, spout });
      });

      // Localized salty ocean sea-spray mist along the bay cliff base
      addLocalMistPlume(0.18, 1.02, 0.2, 1.4, 0.55, '#e8f6ff', 0.34, -0.25, 0.78);

      sliceTicks.push((t) => {
        whales.forEach(({ g, spout }, idx) => {
          const phase = t * 1.25 + idx * 2.4;
          const arc = Math.sin(phase);
          g.position.y = 0.8 + Math.max(-0.04, arc) * 0.15;
          g.rotation.x = -Math.cos(phase) * 0.36;
          const spoutPulse = Math.max(0, Math.sin(phase * 0.8 + 0.5));
          spout.scale.y = (0.04 + spoutPulse * 0.18) * (idx === 0 ? 1 : 0.75);
          spout.visible = spoutPulse > 0.15;
        });
      });
    });
  } else if (name === 'iSimangaliso Wetland Park') {
    const heightAt = (x: number, z: number) => {
      const dune = smoothstep(-0.35, -1.35, x) * (0.95 + Math.sin(z * 2.2) * 0.15);
      const riverCenter = Math.sin(z * 1.8) * 0.28 - 0.1;
      const inRiver = Math.exp(-Math.pow((x - riverCenter) * 4.5, 2));
      const oceanSlope = smoothstep(0.55, 1.38, x);
      const base = 0.92 + dune * 0.72 + fbm2(x * 2.2, z * 2.2) * 0.12;
      return base - inRiver * 0.45 - oceanSlope * 0.56;
    };
    terrainCfg = {
      strataTopColor: '#d7be8c',
      strataBottomColor: '#766149',
      heightAt,
      waterLevel: 0.82,
      waterPalette: oceanWater,
      topColorAt: (x, _z, h, _slope, out) => {
        if (x < -0.75) out.set('#e8cd8e');
        else if (h < 0.85) out.set('#e5d2a4');
        else out.set('#346828');
      },
    };
    maxTopY = 1.9;
    postDecorators.push((hFn) => {
      const trees: TreePlacement[] = [];
      for (let i = 0; i < 66; i++) {
        const rx = -0.68 + hashSeed(i, 4) * 1.3;
        const rz = -1.38 + hashSeed(i, 5) * 2.75;
        const ry = hFn(rx, rz);
        if (ry > 0.87 && rx > -0.78) {
          trees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.052 + hashSeed(i, 6) * 0.045,
            color: i % 2 === 0 ? '#2f6523' : '#437c2d',
            style: i % 4 === 0 ? 'oak' : 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);

      // Hippos with heads/ears + Nile crocodiles on estuary banks + awning tour boat
      const hippoMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#6b5e63', roughness: 0.65 })
      );
      const crocMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#424c36', roughness: 0.78 })
      );
      [
        [-0.08, -0.22, 0.3],
        [-0.14, 0.34, -0.5],
        [0.05, 0.55, 1.1],
      ].forEach(([hx, hz, rot]) => {
        const hg = new THREE.Group();
        hg.position.set(hx, 0.82, hz);
        hg.rotation.y = rot;
        const body = new THREE.Mesh(shared.sphereGeo, hippoMat);
        body.scale.set(0.055, 0.042, 0.082);
        const snout = new THREE.Mesh(shared.sphereGeo, hippoMat);
        snout.scale.set(0.036, 0.03, 0.044);
        snout.position.set(0, 0.015, 0.07);
        hg.add(body, snout);
        root.add(hg);
      });
      [
        [0.24, -0.18, 0.6],
        [0.32, 0.46, -0.35],
      ].forEach(([cx, cz, rot]) => {
        const croc = new THREE.Mesh(shared.boxGeo, crocMat);
        croc.scale.set(0.024, 0.014, 0.14);
        croc.position.set(cx, Math.max(0.83, hFn(cx, cz) + 0.01), cz);
        croc.rotation.y = rot;
        root.add(croc);
      });

      const boatGroup = new THREE.Group();
      const hull = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#ede8dc', roughness: 0.45 }))
      );
      hull.scale.set(0.085, 0.032, 0.18);
      const canopy = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#39523b', roughness: 0.8 }))
      );
      canopy.scale.set(0.078, 0.016, 0.12);
      canopy.position.y = 0.055;
      boatGroup.add(hull, canopy);
      boatGroup.position.set(-0.04, 0.835, -0.75);
      root.add(boatGroup);

      // Humid subtropical coastal mist drift over estuary
      addLocalMistPlume(0.15, 1.05, 0.1, 1.8, 0.48, '#e3f4ec', 0.28, -0.35, 0.4);

      sliceTicks.push((t) => {
        boatGroup.position.z = -0.58 + Math.sin(t * 0.45) * 0.42;
        boatGroup.position.x = Math.sin(boatGroup.position.z * 1.8) * 0.24 - 0.1;
      });
    });
  } else if (name === 'Kruger National Park') {
    const heightAt = (x: number, z: number) => {
      const hill = smoothstep(-0.3, -1.4, z) * 0.55;
      const poolDist = Math.hypot(x - 0.25, z - 0.82);
      const poolDip = (1 - smoothstep(0.25, 0.92, poolDist)) * 0.52;
      return 0.95 + hill + fbm2(x * 2.2 + 4, z * 2.2 + 9) * 0.14 - poolDip;
    };
    terrainCfg = {
      strataTopColor: '#c97b42',
      strataBottomColor: '#69462f',
      heightAt,
      waterLevel: 0.76,
      waterMask: (x, z, h) => x > -0.65 && z > 0.05 && h < 0.76,
      waterPalette: muddyWater,
      topColorAt: (x, z, h, _slope, out) => {
        if (h < 0.78) out.set('#967c5a');
        else out.set('#6d7d34').lerp(cScratch.set('#9e8844'), fbm2(x * 2.5, z * 2.5));
      },
    };
    maxTopY = 1.65;
    postDecorators.push((hFn) => {
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.42, hFn(-1.42, -0.2), -0.2),
          new THREE.Vector3(-0.3, hFn(-0.3, -0.35), -0.35),
          new THREE.Vector3(0.45, hFn(0.45, -0.15), -0.15),
          new THREE.Vector3(1.42, hFn(1.42, 0.18), 0.18),
        ],
        0.16,
        '#b85d32',
        localGeometries,
        localMaterials
      );
      const roverBody = trackMat(
        new THREE.MeshStandardMaterial({ color: '#ded5bd', roughness: 0.65 })
      );
      const roverCanopy = trackMat(
        new THREE.MeshStandardMaterial({ color: '#4c5742', roughness: 0.85 })
      );
      const tireMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.9 })
      );
      root.add(
        makeSafariVehicle(
          shared,
          roverBody,
          tireMat,
          roverCanopy,
          warmWindowMat,
          0.15,
          hFn(0.15, -0.26),
          -0.26,
          -1.2,
          1.15
        )
      );

      // Detailed Elephant herd (curved trunks, ivory tusks, ears) around waterhole
      const eleMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#787470', roughness: 0.85 })
      );
      const tuskMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f5efe2', roughness: 0.4 })
      );
      [
        [-0.25, 0.65, 0.6, 1.05],
        [0.06, 0.42, -0.2, 0.9],
        [0.44, 0.48, -0.8, 1.0],
        [0.74, 0.68, -1.4, 0.72],
        [-0.36, 0.96, 1.1, 0.95],
      ].forEach(([ex, ez, rot, sc]) => {
        const eg = new THREE.Group();
        eg.position.set(ex, Math.max(0.76, hFn(ex, ez)) + 0.042, ez);
        eg.rotation.y = rot;
        eg.scale.setScalar(sc);
        const body = new THREE.Mesh(shared.sphereGeo, eleMat);
        body.scale.set(0.052, 0.056, 0.084);
        const head = new THREE.Mesh(shared.sphereGeo, eleMat);
        head.scale.setScalar(0.038);
        head.position.set(0, 0.022, 0.07);
        const trunk = new THREE.Mesh(shared.cylinderGeo, eleMat);
        trunk.scale.set(0.011, 0.062, 0.011);
        trunk.position.set(0, -0.012, 0.095);
        trunk.rotation.x = 0.25;
        const tuskL = new THREE.Mesh(shared.coneGeo, tuskMat);
        tuskL.scale.set(0.005, 0.032, 0.005);
        tuskL.rotation.x = Math.PI * 0.42;
        tuskL.position.set(0.016, 0.005, 0.096);
        const tuskR = tuskL.clone();
        tuskR.position.x = -0.016;
        eg.add(body, head, trunk, tuskL, tuskR);
        root.add(eg);
      });

      const trees: TreePlacement[] = [];
      for (let i = 0; i < 46; i++) {
        const rx = -1.36 + hashSeed(i, 11) * 2.72;
        const rz = -1.36 + hashSeed(i, 12) * 2.72;
        const ry = hFn(rx, rz);
        if (ry > 0.88 && Math.hypot(rx - 0.25, rz - 0.82) > 0.85) {
          trees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.055 + hashSeed(i, 13) * 0.05,
            color: i % 3 === 0 ? '#55752a' : '#3d5c20',
            style: i % 4 === 0 ? 'acacia' : 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);

      // Warm golden bushveld heat haze shimmer
      addLocalMistPlume(0, 1.25, 0, 2.2, 0.5, '#f2d39c', 0.22, -0.45, 0.4);
    });
  } else if (name === 'Orlando Towers') {
    const heightAt = (x: number, z: number) => {
      const hill = smoothstep(0.1, -1.3, z) * 0.42;
      const dam =
        x > 0.35 && z > 0.28 ? smoothstep(0.35, 1.05, x) * smoothstep(0.28, 0.95, z) * 0.48 : 0;
      return 0.96 + hill - dam + fbm2(x * 2, z * 2) * 0.05;
    };
    terrainCfg = {
      strataTopColor: '#c2b08d',
      strataBottomColor: '#665b4b',
      heightAt,
      waterLevel: 0.78,
      waterMask: (x, z, h) => x > 0.2 && z > 0.15 && h < 0.78,
      waterPalette: oceanWater,
      topColorAt: (x, z, h, _slope, out) => {
        if (h < 0.8) out.set('#8f846b');
        else if (x < -0.15 && z > -0.45) out.set('#a89578');
        else out.set('#6d8143');
      },
    };
    maxTopY = 2.05;
    postDecorators.push((hFn) => {
      const muralTex = getOrlandoMuralTexture();
      const towerMat = trackMat(
        new THREE.MeshStandardMaterial({ map: muralTex, roughness: 0.74, side: THREE.DoubleSide })
      );
      const profile = [
        new THREE.Vector2(0.265, 0.06),
        new THREE.Vector2(0.185, 0.38),
        new THREE.Vector2(0.165, 0.66),
        new THREE.Vector2(0.205, 0.92),
      ];
      const towerGeo = new THREE.LatheGeometry(profile, 24);
      localGeometries.push(towerGeo);

      const t1y = hFn(0.24, -0.3);
      const t2y = hFn(0.84, -0.35);
      const t1 = new THREE.Mesh(towerGeo, towerMat);
      t1.position.set(0.24, t1y, -0.3);
      t1.castShadow = true;
      const t2 = new THREE.Mesh(towerGeo, towerMat);
      t2.position.set(0.84, t2y, -0.35);
      t2.rotation.y = 1.9;
      t2.castShadow = true;
      root.add(t1, t2);

      // Diagonal concrete base stilts around cooling towers + suspension catwalk & bungee platform
      const strutM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#6b675f', roughness: 0.72, metalness: 0.25 })
      );
      [
        [0.24, t1y, -0.3],
        [0.84, t2y, -0.35],
      ].forEach(([tx, ty, tz]) => {
        for (let s = 0; s < 10; s++) {
          const ang = (s / 10) * Math.PI * 2;
          const col = new THREE.Mesh(shared.cylinderGeo, strutM);
          col.scale.set(0.011, 0.11, 0.011);
          col.position.set(tx + Math.cos(ang) * 0.25, ty + 0.04, tz + Math.sin(ang) * 0.25);
          col.rotation.z = Math.cos(ang) * 0.22;
          col.rotation.x = -Math.sin(ang) * 0.22;
          root.add(col);
        }
      });

      const bridgeM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#d7c49e', roughness: 0.48, metalness: 0.55 })
      );
      const bridge = new THREE.Mesh(shared.boxGeo, bridgeM);
      bridge.scale.set(0.62, 0.024, 0.06);
      bridge.position.set(0.54, Math.max(t1y, t2y) + 0.91, -0.32);
      const bungeePod = new THREE.Mesh(shared.boxGeo, strutM);
      bungeePod.scale.set(0.1, 0.04, 0.1);
      bungeePod.position.set(0.54, Math.max(t1y, t2y) + 0.91, -0.32);
      root.add(bridge, bungeePod);

      // Leveled Soweto soccer pitch pad + perimeter & center white lines + goalposts
      const pitchY = Math.max(hFn(-0.34, -0.78), hFn(-0.34, -0.62)) + 0.02;
      const pitchPlinth = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#7b6b54', roughness: 0.9 }))
      );
      pitchPlinth.scale.set(0.52, 0.07, 0.36);
      pitchPlinth.position.set(-0.34, pitchY - 0.025, -0.78);
      const pitch = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#459432', roughness: 0.88 }))
      );
      pitch.scale.set(0.5, 0.02, 0.34);
      pitch.position.set(-0.34, pitchY + 0.015, -0.78);
      const whiteLineM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.8 })
      );
      const halfLine = new THREE.Mesh(shared.boxGeo, whiteLineM);
      halfLine.scale.set(0.014, 0.024, 0.32);
      halfLine.position.set(-0.34, pitchY + 0.018, -0.78);
      const goalL = new THREE.Mesh(shared.boxGeo, whiteLineM);
      goalL.scale.set(0.018, 0.04, 0.11);
      goalL.position.set(-0.57, pitchY + 0.032, -0.78);
      const goalR = goalL.clone();
      goalR.position.x = -0.11;
      root.add(pitchPlinth, pitch, halfLine, goalL, goalR);

      // Rear ridge steel transmission pylons + overhead power cables
      const pylonM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#8c949c', roughness: 0.5, metalness: 0.6 })
      );
      const pylonPts: THREE.Vector3[] = [];
      [-1.08, -0.18, 0.72].forEach((px, idx) => {
        const pz = -1.24 + idx * 0.04;
        const py = hFn(px, pz);
        const mast = new THREE.Mesh(shared.coneGeo, pylonM);
        mast.scale.set(0.042, 0.28, 0.042);
        mast.position.set(px, py + 0.14, pz);
        const arm = new THREE.Mesh(shared.boxGeo, pylonM);
        arm.scale.set(0.14, 0.012, 0.016);
        arm.position.set(px, py + 0.23, pz);
        root.add(mast, arm);
        pylonPts.push(new THREE.Vector3(px, py + 0.23, pz));
      });
      const lineCurve = new THREE.CatmullRomCurve3(pylonPts);
      const lineGeo = new THREE.TubeGeometry(lineCurve, 16, 0.005, 4, false);
      localGeometries.push(lineGeo);
      root.add(new THREE.Mesh(lineGeo, pylonM));

      // Paved intersecting Soweto avenues
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.38, hFn(-1.38, 0.55), 0.55),
          new THREE.Vector3(-0.78, hFn(-0.78, 0.55), 0.55),
          new THREE.Vector3(-0.15, hFn(-0.15, 0.55), 0.55),
        ],
        0.13,
        '#4c4d52',
        localGeometries,
        localMaterials
      );
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-0.82, hFn(-0.82, -0.25), -0.25),
          new THREE.Vector3(-0.82, hFn(-0.82, 0.55), 0.55),
          new THREE.Vector3(-0.82, hFn(-0.82, 1.35), 1.35),
        ],
        0.13,
        '#4c4d52',
        localGeometries,
        localMaterials
      );

      // Township colourful houses + minibus taxis
      const wallCols = ['#c7664c', '#e4b354', '#5c95b8', '#dcd6cb', '#7aa169'];
      const roofMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#4b4e54', roughness: 0.68, metalness: 0.38 })
      );
      for (let gx = 0; gx < 4; gx++) {
        for (let gz = 0; gz < 4; gz++) {
          const hx = -1.24 + gx * 0.28;
          const hz = -0.15 + gz * 0.36;
          if (gx === 1 || gz === 2) continue;
          const wm = trackMat(
            new THREE.MeshStandardMaterial({
              color: wallCols[(gx * 3 + gz) % wallCols.length],
              roughness: 0.82,
            })
          );
          root.add(
            makeGabledHouse(
              shared,
              wm,
              roofMat,
              warmWindowMat,
              0.145,
              0.08,
              0.11,
              hx,
              hFn(hx, hz),
              hz,
              0
            )
          );
        }
      }

      const taxiBody = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f3f1ea', roughness: 0.45 })
      );
      const taxiTop = trackMat(
        new THREE.MeshStandardMaterial({ color: '#3b82b8', roughness: 0.5 })
      );
      const tireM = trackMat(new THREE.MeshStandardMaterial({ color: '#1a1b1f', roughness: 0.9 }));
      root.add(
        makeSafariVehicle(
          shared,
          taxiBody,
          tireM,
          taxiTop,
          warmWindowMat,
          -0.82,
          hFn(-0.82, 0.92),
          0.92,
          0.0,
          0.72
        ),
        makeSafariVehicle(
          shared,
          taxiBody,
          tireM,
          taxiTop,
          warmWindowMat,
          -0.45,
          hFn(-0.45, 0.55),
          0.55,
          Math.PI * 0.5,
          0.72
        )
      );

      // Scattered flat-topped township acacias
      addInstancedTrees(
        root,
        shared,
        [
          {
            x: -0.04,
            y: hFn(-0.04, -0.78),
            z: -0.78,
            scale: 0.08,
            color: '#45752a',
            style: 'acacia',
          },
          { x: 1.15, y: hFn(1.15, 0.1), z: 0.1, scale: 0.085, color: '#4f8230', style: 'acacia' },
          {
            x: -1.16,
            y: hFn(-1.16, -0.58),
            z: -0.58,
            scale: 0.075,
            color: '#45752a',
            style: 'acacia',
          },
          {
            x: -0.22,
            y: hFn(-0.22, 0.95),
            z: 0.95,
            scale: 0.072,
            color: '#4b7a2d',
            style: 'acacia',
          },
          {
            x: -1.24,
            y: hFn(-1.24, 1.15),
            z: 1.15,
            scale: 0.068,
            color: '#45752a',
            style: 'acacia',
          },
        ],
        localMaterials
      );
    });
  } else if (name === 'Hole in the Wall') {
    const heightAt = (x: number, z: number) => {
      const coastHill =
        smoothstep(0.05, 1.15, x + z * 0.35) * (0.72 + Math.sin(z * 2.1) * 0.18) +
        smoothstep(0.15, 1.25, z - x * 0.4) * 0.46;
      const sandCove =
        Math.exp(-Math.pow((x - 0.3) * 2.2, 2) - Math.pow((z - 0.55) * 2.1, 2)) * 0.24;
      return 0.44 + coastHill + sandCove + fbm2(x * 2.4, z * 2.4) * 0.08;
    };
    terrainCfg = {
      strataTopColor: '#9f9680',
      strataBottomColor: '#4c4943',
      heightAt,
      waterLevel: 0.78,
      waterPalette: oceanWater,
      topColorAt: (x, z, h, slope, out) => {
        if (h < 0.8) out.set('#d2c098');
        else if (h < 0.88 && x > -0.2 && z > 0.1) out.set('#e5d1a3');
        else if (slope > 0.45) out.set('#5e5a53');
        else out.set('#4c872b');
      },
    };
    maxTopY = 1.9;
    postDecorators.push((hFn) => {
      const archShape = new THREE.Shape();
      archShape.moveTo(-0.58, 0);
      archShape.lineTo(-0.44, 0.74);
      archShape.quadraticCurveTo(-0.1, 0.9, 0.34, 0.78);
      archShape.lineTo(0.56, 0.44);
      archShape.lineTo(0.47, 0);
      archShape.lineTo(0.17, 0);
      archShape.absarc(0, 0.14, 0.18, 0, Math.PI, false);
      archShape.lineTo(-0.58, 0);

      const archGeo = new THREE.ExtrudeGeometry(archShape, {
        depth: 0.36,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.045,
        bevelThickness: 0.045,
      });
      archGeo.center();
      localGeometries.push(archGeo);
      const stackMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#58544d', roughness: 0.9 })
      );
      const stackMesh = new THREE.Mesh(archGeo, stackMat);
      stackMesh.position.set(-0.55, 0.92, -0.52);
      stackMesh.rotation.y = 0.65;
      stackMesh.castShadow = true;
      stackMesh.receiveShadow = true;
      root.add(stackMesh);

      const cap = new THREE.Mesh(
        shared.foliageGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#4c872b', roughness: 0.9 }))
      );
      cap.scale.set(0.46, 0.08, 0.24);
      cap.position.set(-0.55, 1.33, -0.52);
      cap.rotation.y = 0.65;
      root.add(cap);

      const wallM = trackMat(new THREE.MeshStandardMaterial({ color: '#ebe4d8', roughness: 0.84 }));
      const baseM = trackMat(new THREE.MeshStandardMaterial({ color: '#59544c', roughness: 0.9 }));
      const thatchM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#8f754d', roughness: 0.92 })
      );
      [
        [0.95, -0.85],
        [1.18, -0.56],
        [0.82, -0.22],
        [-0.36, 0.88],
        [-0.08, 1.08],
        [1.06, 0.18],
      ].forEach(([rx, rz]) => {
        root.add(makeRondavel(shared, wallM, thatchM, baseM, rx, hFn(rx, rz), rz, 0.068));
      });

      // Crashing Wild Coast spray plume curling through the sea arch opening
      addLocalMistPlume(-0.42, 0.98, -0.35, 1.0, 0.45, '#e8f8ff', 0.42, -0.28, 0.65);
    });
  } else if (name === 'Richtersveld') {
    const heightAt = (x: number, z: number) => {
      const hill = smoothstep(-0.2, -1.35, z) * 0.42 + smoothstep(-0.4, 1.3, x) * 0.22;
      return 0.92 + hill + fbm2(x * 2.1 + 8, z * 2.1 + 3) * 0.16;
    };
    terrainCfg = {
      strataTopColor: '#c75c35',
      strataBottomColor: '#693c2a',
      heightAt,
      topColorAt: (x, z, _h, _slope, out) => {
        const patch = fbm2(x * 2.8 + 1.2, z * 2.8 + 4.6);
        const sub = noise2(x * 6.5, z * 6.5);
        if (patch > 0.62) out.set('#ee701e');
        else if (patch > 0.51 && sub > 0.44) out.set('#efd02c');
        else if (patch > 0.43 && sub < 0.35) out.set('#9f5ec8');
        else out.set('#ccb07e');
      },
    };
    maxTopY = 1.8;
    postDecorators.push((hFn) => {
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.38, hFn(-1.38, -0.2), -0.2),
          new THREE.Vector3(-0.2, hFn(-0.2, 0.1), 0.1),
          new THREE.Vector3(0.18, hFn(0.18, 0.85), 0.85),
          new THREE.Vector3(0.45, hFn(0.45, 1.4), 1.4),
        ],
        0.14,
        '#d1b488',
        localGeometries,
        localMaterials
      );

      // Granite koppie boulder piles
      const rocks: Array<{
        x: number;
        y: number;
        z: number;
        sx: number;
        sy: number;
        sz: number;
        ry: number;
        color: string;
      }> = [];
      [
        [-0.95, 0.5, 0.21],
        [-0.78, 0.64, 0.15],
        [0.95, 0.25, 0.23],
        [1.12, 0.42, 0.16],
        [-0.45, -0.82, 0.19],
        [0.86, 0.08, 0.15],
      ].forEach(([rx, rz, rs], idx) => {
        rocks.push({
          x: rx,
          y: hFn(rx, rz) + rs * 0.4,
          z: rz,
          sx: rs * 1.2,
          sy: rs * 0.95,
          sz: rs,
          ry: idx * 1.1,
          color: '#b8946e',
        });
      });
      addInstancedRocks(root, shared, rocks, localMaterials);

      // 3D Instanced Namaqualand Wildflower carpets (orange, marigold yellow, violet)
      const flowers: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 110; i++) {
        const fx = -1.36 + hashSeed(i, 61) * 2.72;
        const fz = -1.36 + hashSeed(i, 62) * 2.72;
        const patch = fbm2(fx * 2.8 + 1.2, fz * 2.8 + 4.6);
        const sub = noise2(fx * 6.5, fz * 6.5);
        if (patch > 0.45) {
          const col = patch > 0.62 ? '#ff6f17' : patch > 0.51 && sub > 0.44 ? '#f5d227' : '#a864d6';
          flowers.push({
            x: fx,
            y: hFn(fx, fz) + 0.015,
            z: fz,
            scale: 0.036 + hashSeed(i, 63) * 0.032,
            color: col,
          });
        }
      }
      addInstancedFlowers(root, shared, flowers, localMaterials);

      // Branched Quiver trees
      addInstancedTrees(
        root,
        shared,
        [
          {
            x: -1.08,
            y: hFn(-1.08, 0.12),
            z: 0.12,
            scale: 0.095,
            color: '#7d9b3b',
            style: 'quiver',
          },
          {
            x: -0.85,
            y: hFn(-0.85, -0.45),
            z: -0.45,
            scale: 0.088,
            color: '#7d9b3b',
            style: 'quiver',
          },
          {
            x: 1.06,
            y: hFn(1.06, -0.18),
            z: -0.18,
            scale: 0.092,
            color: '#86a33e',
            style: 'quiver',
          },
          {
            x: 0.85,
            y: hFn(0.85, -0.75),
            z: -0.75,
            scale: 0.085,
            color: '#759235',
            style: 'quiver',
          },
        ],
        localMaterials
      );

      // Stone shepherd farmstead + spinning windpump windmill + safari trucks
      const stoneM = trackMat(new THREE.MeshStandardMaterial({ color: '#8f7d69', roughness: 0.9 }));
      const roofM = trackMat(new THREE.MeshStandardMaterial({ color: '#5c544b', roughness: 0.85 }));
      const steelM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#b4b9be', roughness: 0.45, metalness: 0.6 })
      );
      root.add(
        makeGabledHouse(
          shared,
          stoneM,
          roofM,
          warmWindowMat,
          0.18,
          0.095,
          0.12,
          0.34,
          hFn(0.34, -0.46),
          -0.46,
          0.5
        )
      );

      const wy = hFn(0.18, -0.56);
      const pylon = new THREE.Mesh(shared.coneGeo, steelM);
      pylon.scale.set(0.032, 0.24, 0.032);
      pylon.position.set(0.18, wy + 0.12, -0.56);
      const rotor = new THREE.Group();
      rotor.position.set(0.18, wy + 0.24, -0.54);
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(shared.boxGeo, steelM);
        blade.scale.set(0.012, 0.07, 0.005);
        blade.rotation.z = (b * Math.PI) / 4;
        rotor.add(blade);
      }
      root.add(pylon, rotor);

      const tireM = trackMat(new THREE.MeshStandardMaterial({ color: '#1b1d22', roughness: 0.9 }));
      const truckM = trackMat(new THREE.MeshStandardMaterial({ color: '#8b8374', roughness: 0.6 }));
      root.add(
        makeSafariVehicle(
          shared,
          truckM,
          tireM,
          truckM,
          warmWindowMat,
          -0.25,
          hFn(-0.25, 0.08),
          0.08,
          1.2,
          0.75
        )
      );

      // Arid Karoo sunlit dust shimmer
      addLocalMistPlume(0, 1.35, 0, 2.0, 0.45, '#f7d8a8', 0.18, -0.42, 0.4);

      sliceTicks.push((t) => {
        rotor.rotation.z = t * (1.8 + WU.wind.value * 0.9);
      });
    });
  } else if (name === 'Sani Pass') {
    const heightAt = (x: number, z: number) => {
      const rise = smoothstep(1.25, -1.1, z) * 1.28 + smoothstep(-1.1, 0.9, x) * 0.28;
      const cliffWall = smoothstep(-0.35, -1.15, z) * 0.42;
      const gorge = Math.exp(-Math.pow((x + 0.72) * 3.8, 2)) * 0.32;
      return 0.76 + rise + cliffWall - gorge + fbm2(x * 2.8, z * 2.8) * 0.09;
    };
    terrainCfg = {
      strataTopColor: '#484a45',
      strataBottomColor: '#7a664b',
      heightAt,
      topColorAt: (_x, _z, _h, slope, out) => {
        if (slope > 0.42) out.set('#474945');
        else out.set('#5a8634');
      },
    };
    maxTopY = 2.45;
    postDecorators.push((hFn) => {
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-0.62, hFn(-0.62, 1.32), 1.32),
          new THREE.Vector3(0.45, hFn(0.45, 1.05), 1.05),
          new THREE.Vector3(-0.35, hFn(-0.35, 0.58), 0.58),
          new THREE.Vector3(0.55, hFn(0.55, 0.18), 0.18),
          new THREE.Vector3(-0.28, hFn(-0.28, -0.25), -0.25),
          new THREE.Vector3(0.68, hFn(0.68, -0.78), -0.78),
          new THREE.Vector3(1.1, hFn(1.1, -1.12), -1.12),
        ],
        0.115,
        '#b8a382',
        localGeometries,
        localMaterials
      );
      const tireM = trackMat(new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.9 }));
      const whiteRoof = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.5 })
      );
      const truckCols = ['#c94436', '#ebe9e1', '#d9d4c7'];
      [
        [0.42, 0.92, 0.4],
        [-0.24, 0.52, -0.5],
        [0.45, 0.14, 0.35],
        [0.24, -0.56, -0.4],
      ].forEach(([tx, tz, rot], idx) => {
        const tm = trackMat(
          new THREE.MeshStandardMaterial({ color: truckCols[idx % 3], roughness: 0.55 })
        );
        root.add(
          makeSafariVehicle(
            shared,
            tm,
            tireM,
            whiteRoof,
            warmWindowMat,
            tx,
            hFn(tx, tz),
            tz,
            rot,
            0.68
          )
        );
      });
      const stoneM = trackMat(new THREE.MeshStandardMaterial({ color: '#787166', roughness: 0.9 }));
      const roofM = trackMat(new THREE.MeshStandardMaterial({ color: '#465241', roughness: 0.85 }));
      root.add(
        makeGabledHouse(
          shared,
          stoneM,
          roofM,
          warmWindowMat,
          0.25,
          0.115,
          0.16,
          1.02,
          hFn(1.02, -0.95),
          -0.95,
          0.4,
          true
        )
      );

      // High-altitude escarpment basalt crags + waterfall gully ribbon + alpine shrubs
      const crags = [
        [-0.22, -0.88, 0.24, 0.34, 0.18],
        [0.45, -0.95, 0.26, 0.32, 0.2],
        [-0.95, -0.45, 0.2, 0.26, 0.18],
        [0.82, -0.25, 0.18, 0.22, 0.16],
        [-0.75, 0.65, 0.14, 0.15, 0.14],
        [0.78, 0.72, 0.15, 0.16, 0.14],
      ].map(([rx, rz, sx, sy, sz], i) => ({
        x: rx,
        y: hFn(rx, rz) + sy * 0.25,
        z: rz,
        sx,
        sy,
        sz,
        ry: i * 1.1,
        color: '#52534d',
      }));
      addInstancedRocks(root, shared, crags, localMaterials);

      const shrubs: TreePlacement[] = [];
      for (let i = 0; i < 24; i++) {
        const rx = -1.25 + hashSeed(i, 91) * 2.5;
        const rz = -0.3 + hashSeed(i, 92) * 1.5;
        const ry = hFn(rx, rz);
        if (Math.abs(rx) > 0.65) {
          shrubs.push({ x: rx, y: ry, z: rz, scale: 0.044, color: '#416b26', style: 'bush' });
        }
      }
      addInstancedTrees(root, shared, shrubs, localMaterials);

      const fallM = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#e5f8ff',
          transparent: true,
          opacity: 0.84,
          roughness: 0.3,
        })
      );
      const stream = new THREE.Mesh(shared.boxGeo, fallM);
      stream.scale.set(0.055, 0.72, 0.055);
      stream.position.set(-0.74, 1.32, 0.32);
      stream.rotation.x = 0.52;
      root.add(stream);
      addLocalMistPlume(0.1, 2.32, -0.65, 2.1, 0.6, '#eff6fc', 0.45, -0.42, 0.55);
    });
  } else if (name === 'Groot Constantia') {
    const heightAt = (x: number, z: number) => {
      const mtn = smoothstep(-0.15, -1.35, z) * smoothstep(-0.35, 1.15, x) * 1.12;
      const pondDip =
        Math.exp(-Math.pow((x - 0.18) * 3.2, 2) - Math.pow((z - 0.35) * 3.2, 2)) * 0.32;
      return 0.92 + mtn - pondDip + fbm2(x * 2, z * 2) * 0.07;
    };
    terrainCfg = {
      strataTopColor: '#9b744d',
      strataBottomColor: '#4c4036',
      heightAt,
      waterLevel: 0.78,
      waterMask: (x, z, h) => x > -0.25 && x < 0.65 && z > -0.05 && z < 0.78 && h < 0.78,
      waterPalette: riverWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.8) out.set('#6d7f5e');
        else if (slope > 0.4) out.set('#7c7974');
        else out.set('#5a8433');
      },
    };
    maxTopY = 2.15;
    postDecorators.push((hFn) => {
      const whiteM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.84 })
      );
      const thatchM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#3b3733', roughness: 0.92 })
      );
      const hy = hFn(-0.62, -0.28);
      root.add(
        makeGabledHouse(
          shared,
          whiteM,
          thatchM,
          warmWindowMat,
          0.44,
          0.16,
          0.22,
          -0.62,
          hy,
          -0.28,
          0.75,
          true
        ),
        makeGabledHouse(
          shared,
          whiteM,
          thatchM,
          warmWindowMat,
          0.2,
          0.12,
          0.14,
          -0.95,
          hFn(-0.95, 0.05),
          0.05,
          0.75
        )
      );
      // Curved Cape Dutch central front gable crest
      const gable = new THREE.Mesh(shared.cylinderGeo, whiteM);
      gable.scale.set(0.06, 0.08, 0.025);
      gable.rotation.z = Math.PI * 0.5;
      gable.position.set(-0.56, hy + 0.22, -0.22);
      gable.rotation.y = 0.75;
      root.add(gable);

      // Vineyard trellis rows + miniature vineyard tractor
      const vineMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#4f7a26', roughness: 0.88 })
      );
      for (let r = 0; r < 7; r++) {
        const vx = -0.62 + r * 0.15;
        const vz = 0.72 + (r % 2) * 0.04;
        const vy = hFn(vx, vz);
        const row = new THREE.Mesh(shared.boxGeo, vineMat);
        row.scale.set(0.048, 0.048, 0.76);
        row.position.set(vx, vy + 0.03, vz);
        row.rotation.y = 0.72;
        row.castShadow = true;
        root.add(row);
      }

      const tractorM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#2b6e35', roughness: 0.55 })
      );
      const tireM = trackMat(new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.9 }));
      root.add(
        makeSafariVehicle(
          shared,
          tractorM,
          tireM,
          tractorM,
          warmWindowMat,
          -0.78,
          hFn(-0.78, 0.36),
          0.36,
          0.72,
          0.68
        )
      );

      // Gravel estate driveway curving around manor house and farm dam
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.02, hFn(-1.02, 0.02), 0.02),
          new THREE.Vector3(-0.46, hFn(-0.46, -0.06), -0.06),
          new THREE.Vector3(-0.08, hFn(-0.08, 0.14), 0.14),
          new THREE.Vector3(0.45, hFn(0.45, 0.85), 0.85),
        ],
        0.095,
        '#cbb894',
        localGeometries,
        localMaterials
      );

      // Constantiaberg granite/sandstone peak crags + mountain fynbos slopes
      const peakRocks = [
        [0.82, -0.98, 0.24],
        [1.06, -0.82, 0.22],
        [0.92, -1.16, 0.2],
        [1.18, -0.58, 0.18],
        [0.56, -1.1, 0.19],
        [1.14, -1.04, 0.23],
        [0.68, -0.78, 0.15],
      ].map(([rx, rz, rs], i) => ({
        x: rx,
        y: hFn(rx, rz) + rs * 0.22,
        z: rz,
        sx: rs * 1.15,
        sy: rs * 1.18,
        sz: rs * 0.95,
        ry: i * 0.95,
        color: i % 2 === 0 ? '#7c766d' : '#6c665e',
      }));
      addInstancedRocks(root, shared, peakRocks, localMaterials);

      const constantiaTrees: TreePlacement[] = [
        {
          x: -1.12,
          y: hFn(-1.12, -0.55),
          z: -0.55,
          scale: 0.145,
          color: '#325d21',
          style: 'oak',
        },
        { x: -0.85, y: hFn(-0.85, -0.82), z: -0.82, scale: 0.14, color: '#396926', style: 'oak' },
        {
          x: -0.38,
          y: hFn(-0.38, -0.78),
          z: -0.78,
          scale: 0.135,
          color: '#2e571e',
          style: 'oak',
        },
        {
          x: -1.18,
          y: hFn(-1.18, -0.18),
          z: -0.18,
          scale: 0.125,
          color: '#396926',
          style: 'oak',
        },
        { x: 0.38, y: hFn(0.38, 1.05), z: 1.05, scale: 0.065, color: '#45752a', style: 'bush' },
        { x: 0.65, y: hFn(0.65, 0.92), z: 0.92, scale: 0.072, color: '#45752a', style: 'bush' },
      ];
      for (let i = 0; i < 20; i++) {
        const rx = 0.15 + hashSeed(i, 91) * 1.18;
        const rz = -1.15 + hashSeed(i, 92) * 1.35;
        const ry = hFn(rx, rz);
        if (ry > 0.95 && ry < 1.85) {
          constantiaTrees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.052 + hashSeed(i, 93) * 0.032,
            color: i % 2 === 0 ? '#3f6b25' : '#527d32',
            style: i % 5 === 0 ? 'oak' : 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, constantiaTrees, localMaterials);
    });
  } else if (name === 'Cape Point Lighthouse') {
    const heightAt = (x: number, z: number) => {
      const pen = smoothstep(0.6, -1.15, x + z * 0.28);
      const peak =
        Math.exp(-Math.pow((x + 0.35) * 1.35, 2) - Math.pow((z + 0.78) * 1.45, 2)) * 1.18;
      const cove = Math.exp(-Math.pow((x - 0.18) * 2.4, 2) - Math.pow((z - 0.22) * 2.2, 2)) * 0.28;
      return 0.42 + pen * 0.64 + peak - cove + fbm2(x * 2.5, z * 2.5) * 0.1;
    };
    terrainCfg = {
      strataTopColor: '#b39567',
      strataBottomColor: '#564c40',
      heightAt,
      waterLevel: 0.82,
      waterPalette: oceanWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.84) out.set('#968569');
        else if (h < 0.9 && slope < 0.22) out.set('#ebdcb8');
        else if (slope > 0.42) out.set('#8f7b60');
        else out.set('#4c6b2d');
      },
    };
    maxTopY = 2.35;
    postDecorators.push((hFn) => {
      const whiteM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f3f2ed', roughness: 0.75 })
      );
      const redM = trackMat(new THREE.MeshStandardMaterial({ color: '#cc3b2b', roughness: 0.6 }));
      const darkTrimM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: 0.65 })
      );
      const ly = hFn(-0.34, -0.78);
      const tower = new THREE.Mesh(shared.cylinderGeo, whiteM);
      tower.scale.set(0.058, 0.25, 0.058);
      tower.position.set(-0.34, ly + 0.125, -0.78);
      tower.castShadow = true;
      const gallery = new THREE.Mesh(shared.cylinderGeo, darkTrimM);
      gallery.scale.set(0.082, 0.018, 0.082);
      gallery.position.set(-0.34, ly + 0.225, -0.78);
      const cap = new THREE.Mesh(shared.coneGeo, redM);
      cap.scale.set(0.072, 0.06, 0.072);
      cap.position.set(-0.34, ly + 0.285, -0.78);
      const lantern = new THREE.Mesh(shared.sphereGeo, trackGlowMat('#ffe58c', '#ffb63b', 1.35));
      lantern.scale.setScalar(0.044);
      lantern.position.set(-0.34, ly + 0.25, -0.78);
      root.add(tower, gallery, cap, lantern);

      // Rotating lighthouse beam kept cleanly horizontal inside pivot group
      const beamMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: '#ffe594',
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      const beamPivot = new THREE.Group();
      beamPivot.position.set(-0.34, ly + 0.25, -0.78);
      const beam = new THREE.Mesh(shared.coneGeo, beamMat);
      beam.scale.set(0.24, 1.32, 0.24);
      beam.rotation.z = Math.PI * 0.5;
      beam.position.x = 0.68;
      beamPivot.add(beam);
      root.add(beamPivot);

      // Keeper cottage + upper cliff lookout deck + coastal granite boulders
      root.add(
        makeGabledHouse(
          shared,
          whiteM,
          darkTrimM,
          warmWindowMat,
          0.16,
          0.085,
          0.11,
          -0.58,
          hFn(-0.58, -0.58),
          -0.58,
          0.45
        )
      );
      const cliffRocks = [
        [0.42, 0.65, 0.16],
        [0.12, 0.85, 0.18],
        [-0.08, 0.25, 0.14],
        [-0.78, 0.12, 0.15],
      ].map(([rx, rz, rs], i) => ({
        x: rx,
        y: Math.max(0.76, hFn(rx, rz)) + rs * 0.2,
        z: rz,
        sx: rs * 1.2,
        sy: rs * 0.85,
        sz: rs,
        ry: i * 1.1,
        color: '#8e7c62',
      }));
      addInstancedRocks(root, shared, cliffRocks, localMaterials);

      // Flying Dutchman funicular rail along the dry peninsula ridge + lower station + red tram
      const stationY = hFn(-0.02, -0.34);
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-0.3, ly + 0.04, -0.72),
          new THREE.Vector3(-0.16, hFn(-0.16, -0.53) + 0.035, -0.53),
          new THREE.Vector3(-0.02, stationY + 0.03, -0.34),
        ],
        0.048,
        '#3b3d42',
        localGeometries,
        localMaterials
      );
      const funStation = new THREE.Mesh(shared.boxGeo, darkTrimM);
      funStation.scale.set(0.11, 0.06, 0.09);
      funStation.position.set(-0.02, stationY + 0.03, -0.34);
      funStation.rotation.y = 0.72;
      const tram = new THREE.Mesh(shared.boxGeo, redM);
      tram.scale.set(0.052, 0.036, 0.088);
      tram.position.set(-0.16, hFn(-0.16, -0.53) + 0.045, -0.53);
      tram.rotation.y = 0.72;
      root.add(funStation, tram);

      const trees: TreePlacement[] = [];
      for (let i = 0; i < 34; i++) {
        const rx = -1.3 + hashSeed(i, 21) * 2.4;
        const rz = -1.3 + hashSeed(i, 22) * 2.2;
        const ry = hFn(rx, rz);
        if (ry > 0.96) {
          trees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.044,
            color: i % 2 === 0 ? '#456327' : '#567832',
            style: 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);

      // Cape Point windswept Atlantic mist around cliff toe
      addLocalMistPlume(0.1, 1.05, 0.1, 1.6, 0.45, '#e8f4fc', 0.3, -0.28, 0.5);

      sliceTicks.push((t, lit) => {
        beamPivot.rotation.y = t * 0.95;
        beamMat.opacity = 0.07 + lit * 0.38;
      });
    });
  } else if (name === 'Augrabies Falls') {
    const heightAt = (x: number, z: number) => {
      const riverX = Math.sin(z * 1.4) * 0.16;
      const inGorge = Math.exp(-Math.pow((x - riverX) * 3.1, 2));
      const upperDrop = smoothstep(-0.18, 0.22, z);
      const floor = 0.95 - inGorge * (0.42 + upperDrop * 0.45);
      return floor + (1 - inGorge) * 0.42 + fbm2(x * 3.2, z * 3.2) * 0.14;
    };
    terrainCfg = {
      strataTopColor: '#c97e4f',
      strataBottomColor: '#694a3b',
      heightAt,
      waterLevel: 0.64,
      waterMask: (x, z, h) => z > -0.05 && Math.abs(x) < 0.62 && h < 0.64,
      waterPalette: riverWater,
      topColorAt: (x, z, h, slope, out) => {
        if (h < 0.66 && z > 0) out.set('#6e685f');
        else if (slope > 0.35) out.set('#b86d42');
        else out.set('#cf9c69').lerp(cScratch.set('#9f6742'), fbm2(x * 3.2, z * 3.2) * 0.45);
      },
    };
    maxTopY = 1.8;
    postDecorators.push((hFn) => {
      const fallMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#e5f9ff',
          emissive: '#89c4d6',
          emissiveIntensity: 0.25,
          roughness: 0.24,
          transparent: true,
          opacity: 0.92,
        })
      );
      const foamMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#f2fbff',
          roughness: 0.45,
          transparent: true,
          opacity: 0.88,
        })
      );
      const upperStream = new THREE.Mesh(shared.boxGeo, fallMat);
      upperStream.scale.set(0.38, 0.04, 1.38);
      upperStream.position.set(0.06, 0.98, -0.72);
      const mainCascade = new THREE.Mesh(shared.boxGeo, fallMat);
      mainCascade.scale.set(0.28, 0.48, 0.12);
      mainCascade.position.set(0.04, 0.78, -0.02);
      mainCascade.rotation.x = 0.26;
      const sideCascade = new THREE.Mesh(shared.boxGeo, fallMat);
      sideCascade.scale.set(0.11, 0.44, 0.09);
      sideCascade.position.set(-0.2, 0.8, 0.08);
      sideCascade.rotation.x = 0.3;
      const foamPool = new THREE.Mesh(shared.cylinderGeo, foamMat);
      foamPool.scale.set(0.26, 0.03, 0.22);
      foamPool.position.set(0.04, 0.65, 0.16);
      root.add(upperStream, mainCascade, sideCascade, foamPool);

      // Sculpted rust-granite gorge boulders & Moon Rock dome slabs
      const graniteRocks: Array<{
        x: number;
        y: number;
        z: number;
        sx: number;
        sy: number;
        sz: number;
        ry: number;
        color: string;
      }> = [];
      [
        [-0.58, -0.68, 0.22],
        [-0.86, 0.18, 0.25],
        [-0.48, 0.56, 0.18],
        [0.54, -0.45, 0.24],
        [0.82, 0.48, 0.22],
        [0.44, 0.82, 0.17],
        [-0.95, 0.88, 0.2],
        [0.98, -0.95, 0.21],
      ].forEach(([rx, rz, rs], idx) => {
        graniteRocks.push({
          x: rx,
          y: hFn(rx, rz) + rs * 0.28,
          z: rz,
          sx: rs * 1.35,
          sy: rs * 0.82,
          sz: rs * 1.15,
          ry: idx * 0.9,
          color: idx % 2 === 0 ? '#be7c50' : '#a66842',
        });
      });
      addInstancedRocks(root, shared, graniteRocks, localMaterials);

      // Elevated timber gorge walkway + viewing platform rail
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.05, hFn(-1.05, -0.35) + 0.04, -0.35),
          new THREE.Vector3(-0.62, hFn(-0.62, -0.1) + 0.04, -0.1),
          new THREE.Vector3(-0.52, hFn(-0.52, 0.36) + 0.04, 0.36),
          new THREE.Vector3(-0.88, hFn(-0.88, 0.92) + 0.04, 0.92),
        ],
        0.09,
        '#7d5d3b',
        localGeometries,
        localMaterials
      );
      const woodM = trackMat(new THREE.MeshStandardMaterial({ color: '#7a5c3c', roughness: 0.85 }));
      const deck = new THREE.Mesh(shared.boxGeo, woodM);
      deck.scale.set(0.24, 0.036, 0.2);
      deck.position.set(-0.5, hFn(-0.5, 0.25) + 0.045, 0.25);
      const rail = new THREE.Mesh(shared.boxGeo, woodM);
      rail.scale.set(0.02, 0.06, 0.2);
      rail.position.set(-0.39, hFn(-0.5, 0.25) + 0.08, 0.25);
      root.add(deck, rail);

      addInstancedTrees(
        root,
        shared,
        [
          {
            x: -1.08,
            y: hFn(-1.08, -0.75),
            z: -0.75,
            scale: 0.09,
            color: '#6e8a33',
            style: 'quiver',
          },
          {
            x: -0.85,
            y: hFn(-0.85, -1.05),
            z: -1.05,
            scale: 0.085,
            color: '#6e8a33',
            style: 'quiver',
          },
          { x: 1.06, y: hFn(1.06, -0.8), z: -0.8, scale: 0.092, color: '#789638', style: 'quiver' },
          { x: 1.15, y: hFn(1.15, -0.3), z: -0.3, scale: 0.085, color: '#6e8a33', style: 'quiver' },
          { x: -1.16, y: hFn(-1.16, 0.55), z: 0.55, scale: 0.062, color: '#5c782d', style: 'bush' },
          { x: 1.05, y: hFn(1.05, 0.82), z: 0.82, scale: 0.065, color: '#5c782d', style: 'bush' },
          { x: 0.78, y: hFn(0.78, -1.02), z: -1.02, scale: 0.06, color: '#668232', style: 'bush' },
        ],
        localMaterials
      );

      // Rising plunge-pool canyon waterfall mist plumes
      addLocalMistPlume(0.06, 0.96, 0.26, 1.1, 0.72, '#eefaff', 0.55, -0.22, 0.55);
      addLocalMistPlume(-0.08, 1.15, 0.45, 0.95, 0.58, '#eefaff', 0.42, -0.32, 0.35);
    });
  } else if (name === 'Golden Gate Highlands') {
    const heightAt = (x: number, z: number) => {
      const terrace = smoothstep(0.6, -1.2, x) * 0.56;
      return 0.86 + terrace + fbm2(x * 2.5, z * 2.5) * 0.14;
    };
    terrainCfg = {
      strataTopColor: '#c98849',
      strataBottomColor: '#694e38',
      heightAt,
      topColorAt: (_x, _z, _h, slope, out) => {
        if (slope > 0.35) out.set('#b86f39');
        else out.set('#89944a').lerp(cScratch.set('#c4aa6a'), 0.42);
      },
    };
    maxTopY = 2.45;
    postDecorators.push((hFn) => {
      // Sculpted Brandwag sandstone buttress cliffs (multi-part tapered rocks, not plain cylinders)
      const rockCols = ['#cc7b3d', '#b56331', '#df9b55'];
      const cragRocks: Array<{
        x: number;
        y: number;
        z: number;
        sx: number;
        sy: number;
        sz: number;
        ry: number;
        color: string;
      }> = [];
      [
        [-0.12, -0.58, 0.34, 0.62, 0.28],
        [-0.08, -0.58, 0.24, 0.98, 0.22],
        [0.36, -0.45, 0.28, 0.78, 0.24],
        [-0.45, -0.28, 0.24, 0.68, 0.2],
        [0.62, 0.05, 0.2, 0.54, 0.18],
        [-0.62, 0.55, 0.18, 0.44, 0.16],
        [0.14, -0.68, 0.22, 0.5, 0.2],
      ].forEach(([sx, sz, w, h, d], idx) => {
        const sy = hFn(sx, sz);
        cragRocks.push({
          x: sx,
          y: sy + h * 0.42,
          z: sz,
          sx: w,
          sy: h * 0.58,
          sz: d,
          ry: idx * 0.7,
          color: rockCols[idx % rockCols.length],
        });
      });
      addInstancedRocks(root, shared, cragRocks, localMaterials);

      // Winding Golden Gate pass road + red SUV + wooden cliffside lookout
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.35, hFn(-1.35, 0.85), 0.85),
          new THREE.Vector3(-0.32, hFn(-0.32, 0.55), 0.55),
          new THREE.Vector3(0.55, hFn(0.55, 0.88), 0.88),
          new THREE.Vector3(1.38, hFn(1.38, 0.68), 0.68),
        ],
        0.13,
        '#756c60',
        localGeometries,
        localMaterials
      );
      const suvM = trackMat(new THREE.MeshStandardMaterial({ color: '#c44b38', roughness: 0.45 }));
      const roofM = trackMat(new THREE.MeshStandardMaterial({ color: '#edeae0', roughness: 0.55 }));
      const tireM = trackMat(new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.9 }));
      root.add(
        makeSafariVehicle(
          shared,
          suvM,
          tireM,
          roofM,
          warmWindowMat,
          0.12,
          hFn(0.12, 0.72),
          0.72,
          1.2,
          0.75
        )
      );

      const deck = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#8f7254', roughness: 0.86 }))
      );
      deck.scale.set(0.3, 0.05, 0.22);
      deck.position.set(-0.36, hFn(-0.36, 0.08) + 0.14, 0.08);
      root.add(deck);

      addInstancedTrees(
        root,
        shared,
        [
          { x: -0.95, y: hFn(-0.95, 0.32), z: 0.32, scale: 0.058, color: '#4c752a', style: 'bush' },
          { x: 0.95, y: hFn(0.95, 0.35), z: 0.35, scale: 0.055, color: '#567d2e', style: 'bush' },
          {
            x: -1.08,
            y: hFn(-1.08, -0.55),
            z: -0.55,
            scale: 0.06,
            color: '#456b26',
            style: 'bush',
          },
        ],
        localMaterials
      );
      addLocalMistPlume(0.15, 2.2, -0.35, 1.8, 0.5, '#f2e8d8', 0.25, -0.4, 0.6);
    });
  } else if (name === 'Boulders Beach') {
    const heightAt = (x: number, z: number) => {
      const beachSlope = smoothstep(-0.7, 0.8, x + z * 0.2);
      const bushBank = smoothstep(-0.15, -1.15, x) * 0.56;
      return 0.48 + (1 - beachSlope) * 0.46 + bushBank + fbm2(x * 2, z * 2) * 0.06;
    };
    terrainCfg = {
      strataTopColor: '#c9b795',
      strataBottomColor: '#5c554c',
      heightAt,
      waterLevel: 0.84,
      waterPalette: oceanWater,
      topColorAt: (x, _z, h, _slope, out) => {
        if (x < -0.42) out.set('#4c752b');
        else if (h < 0.86) out.set('#969d8a');
        else out.set('#ede1c3');
      },
    };
    maxTopY = 1.65;
    postDecorators.push((hFn) => {
      const rocks: Array<{
        x: number;
        y: number;
        z: number;
        sx: number;
        sy: number;
        sz: number;
        ry: number;
        color: string;
      }> = [];
      [
        [0.42, -0.55, 0.28],
        [0.08, -0.78, 0.22],
        [0.75, -0.15, 0.34],
        [0.92, 0.22, 0.2],
        [-0.08, 0.88, 0.24],
        [-0.36, 0.72, 0.16],
        [0.54, -0.32, 0.19],
      ].forEach(([rx, rz, rs], idx) => {
        rocks.push({
          x: rx,
          y: hFn(rx, rz) + rs * 0.45,
          z: rz,
          sx: rs * 1.15,
          sy: rs * 0.88,
          sz: rs,
          ry: idx * 0.9,
          color: '#d4cab6',
        });
      });
      addInstancedRocks(root, shared, rocks, localMaterials);

      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.12, hFn(-1.12, 0.95) + 0.04, 0.95),
          new THREE.Vector3(-0.72, hFn(-0.72, 0.2) + 0.04, 0.2),
          new THREE.Vector3(-0.62, hFn(-0.62, -0.72) + 0.04, -0.72),
        ],
        0.09,
        '#8f6d4a',
        localGeometries,
        localMaterials
      );

      // African penguins (black back + white front belly)
      const pDark = trackMat(new THREE.MeshStandardMaterial({ color: '#1b2028', roughness: 0.6 }));
      const pWhite = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f3f2ed', roughness: 0.65 })
      );
      [
        [-0.08, 0.05],
        [0.06, -0.12],
        [-0.18, 0.22],
        [0.14, 0.16],
        [-0.04, 0.38],
        [0.24, 0.36],
        [0.08, 0.56],
        [-0.22, 0.46],
      ].forEach(([px, pz]) => {
        const py = Math.max(0.84, hFn(px, pz)) + 0.028;
        const pen = new THREE.Mesh(shared.cylinderGeo, pDark);
        pen.scale.set(0.022, 0.056, 0.022);
        pen.position.set(px, py, pz);
        const belly = new THREE.Mesh(shared.boxGeo, pWhite);
        belly.scale.set(0.022, 0.036, 0.016);
        belly.position.set(px + 0.008, py, pz + 0.008);
        root.add(pen, belly);
      });

      addInstancedTrees(
        root,
        shared,
        [
          {
            x: -1.06,
            y: hFn(-1.06, -0.55),
            z: -0.55,
            scale: 0.075,
            color: '#456f28',
            style: 'bush',
          },
          { x: -1.12, y: hFn(-1.12, 0.1), z: 0.1, scale: 0.082, color: '#4f7c2e', style: 'bush' },
          { x: -1.02, y: hFn(-1.02, 0.68), z: 0.68, scale: 0.072, color: '#456f28', style: 'bush' },
        ],
        localMaterials
      );
    });
  } else if (name === 'Robben Island') {
    const heightAt = (x: number, z: number) => {
      const r = Math.hypot(x * 1.05, z * 1.08);
      const island = 1 - smoothstep(0.68, 1.18, r);
      const quarryDip =
        Math.exp(-Math.pow((x - 0.36) * 3.8, 2) - Math.pow((z + 0.25) * 3.8, 2)) * 0.18;
      return 0.48 + island * 0.48 - quarryDip + fbm2(x * 3, z * 3) * 0.05;
    };
    terrainCfg = {
      strataTopColor: '#b7a98c',
      strataBottomColor: '#565249',
      heightAt,
      waterLevel: 0.78,
      waterPalette: oceanWater,
      topColorAt: (x, z, h, _slope, out) => {
        if (h < 0.79) out.set('#6e7c75');
        else if (Math.hypot(x - 0.36, z + 0.25) < 0.34) out.set('#ede4cf');
        else out.set('#65783a');
      },
    };
    maxTopY = 1.65;
    postDecorators.push((hFn) => {
      const stoneM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#9a968e', roughness: 0.88 })
      );
      [
        [-0.05, 0.08, 0.44, 0.08],
        [-0.05, 0.44, 0.44, 0.08],
        [-0.24, 0.26, 0.08, 0.36],
        [0.14, 0.26, 0.08, 0.36],
      ].forEach(([wx, wz, sw, sd]) => {
        const wall = new THREE.Mesh(shared.boxGeo, stoneM);
        wall.scale.set(sw, 0.085, sd);
        wall.position.set(wx, hFn(wx, wz) + 0.042, wz);
        wall.castShadow = true;
        root.add(wall);
      });

      const ly = hFn(-0.46, -0.42);
      const lhBase = new THREE.Mesh(
        shared.cylinderGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#f2f1ec', roughness: 0.75 }))
      );
      lhBase.scale.set(0.045, 0.24, 0.045);
      lhBase.position.set(-0.46, ly + 0.12, -0.42);
      const band = new THREE.Mesh(
        shared.cylinderGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#c4372d', roughness: 0.7 }))
      );
      band.scale.set(0.048, 0.07, 0.048);
      band.position.set(-0.46, ly + 0.14, -0.42);
      const lantern = new THREE.Mesh(shared.sphereGeo, warmWindowMat);
      lantern.scale.setScalar(0.032);
      lantern.position.set(-0.46, ly + 0.25, -0.42);
      root.add(lhBase, band, lantern);

      const jetty = new THREE.Mesh(shared.boxGeo, stoneM);
      jetty.scale.set(0.45, 0.04, 0.06);
      jetty.position.set(1.02, 0.8, 0.25);
      root.add(jetty);
      const ferry = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }))
      );
      ferry.scale.set(0.14, 0.04, 0.07);
      ferry.position.set(1.22, 0.8, 0.48);
      root.add(ferry);

      const islandTrees: TreePlacement[] = [];
      for (let i = 0; i < 16; i++) {
        const ang = i * 0.39;
        const rad = 0.28 + (i % 3) * 0.18;
        const tx = Math.cos(ang) * rad;
        const tz = Math.sin(ang) * rad;
        const ty = hFn(tx, tz);
        if (ty > 0.82) {
          islandTrees.push({ x: tx, y: ty, z: tz, scale: 0.045, color: '#456e28', style: 'bush' });
        }
      }
      addInstancedTrees(root, shared, islandTrees, localMaterials);

      sliceTicks.push((t) => {
        ferry.position.x = 1.18 + Math.sin(t * 0.7) * 0.12;
        ferry.position.z = 0.52 + Math.cos(t * 0.7) * 0.1;
      });
    });
  } else if (name === 'The Big Hole') {
    const heightAt = (x: number, z: number) => {
      const r = Math.hypot(x * 1.04, z * 1.04);
      const pit = (1 - smoothstep(0.32, 0.96, r)) * 0.88;
      const stepRim = Math.round(pit * 5) / 5;
      return 1.28 - (pit * 0.65 + stepRim * 0.35) + fbm2(x * 3.5, z * 3.5) * 0.04;
    };
    terrainCfg = {
      strataTopColor: '#b55635',
      strataBottomColor: '#564d44',
      heightAt,
      waterLevel: 0.58,
      waterMask: (x, z, h) => Math.hypot(x, z) < 0.62 && h < 0.58,
      waterPalette: emeraldWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.6) out.set('#22473f');
        else if (slope > 0.24) out.set('#5a5248');
        else out.set('#b2966d');
      },
    };
    maxTopY = 1.78;
    postDecorators.push((hFn) => {
      const steelM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#454a52', roughness: 0.42, metalness: 0.74 })
      );
      const ty = hFn(0.18, -1.08);
      // Converging 4-legged steel lattice winding headframe + cross-bracing + twin sheave wheels
      const legOffsets: Array<[number, number, number, number]> = [
        [-0.085, -0.065, -0.19, 0.19],
        [0.085, -0.065, 0.19, 0.19],
        [-0.085, 0.065, -0.19, -0.19],
        [0.085, 0.065, 0.19, -0.19],
      ];
      legOffsets.forEach(([ox, oz, rz, rx]) => {
        const leg = new THREE.Mesh(shared.boxGeo, steelM);
        leg.scale.set(0.018, 0.42, 0.018);
        leg.position.set(0.18 + ox, ty + 0.19, -1.08 + oz);
        leg.rotation.set(rx, 0, rz);
        leg.castShadow = true;
        root.add(leg);
      });
      const brace = new THREE.Mesh(shared.boxGeo, steelM);
      brace.scale.set(0.15, 0.016, 0.12);
      brace.position.set(0.18, ty + 0.18, -1.08);
      const headDeck = new THREE.Mesh(shared.boxGeo, steelM);
      headDeck.scale.set(0.095, 0.028, 0.095);
      headDeck.position.set(0.18, ty + 0.37, -1.08);
      const wheelL = new THREE.Mesh(shared.cylinderGeo, steelM);
      wheelL.rotation.z = Math.PI * 0.5;
      wheelL.scale.set(0.056, 0.014, 0.056);
      wheelL.position.set(0.145, ty + 0.415, -1.08);
      const wheelR = wheelL.clone();
      wheelR.position.x = 0.215;
      root.add(brace, headDeck, wheelL, wheelR);

      // Cantilevered skywalk viewing platform projecting over the crater edge
      const skywalk = new THREE.Mesh(shared.boxGeo, steelM);
      skywalk.scale.set(0.46, 0.028, 0.13);
      skywalk.position.set(0.72, 1.32, -0.45);
      skywalk.rotation.y = -0.68;
      root.add(skywalk);

      // Kimberley dirt museum street + corrugated tin houses + hoist powerhouse + visitor hall
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.05, hFn(-1.05, -0.95), -0.95),
          new THREE.Vector3(-0.92, hFn(-0.92, 0.05), 0.05),
          new THREE.Vector3(-1.02, hFn(-1.02, 0.95), 0.95),
        ],
        0.13,
        '#8f6e49',
        localGeometries,
        localMaterials
      );
      const wallM = trackMat(new THREE.MeshStandardMaterial({ color: '#e3dcd0', roughness: 0.85 }));
      const tinM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#8f4739', roughness: 0.72, metalness: 0.3 })
      );
      const museumRoofM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#45515c', roughness: 0.75, metalness: 0.25 })
      );
      [
        [-1.12, -0.62, 0.08],
        [-1.15, -0.2, 0.12],
        [-1.12, 0.24, 0.05],
        [-1.08, 0.66, -0.1],
      ].forEach(([hx, hz, rot]) => {
        root.add(
          makeGabledHouse(
            shared,
            wallM,
            tinM,
            warmWindowMat,
            0.165,
            0.09,
            0.12,
            hx,
            hFn(hx, hz),
            hz,
            rot,
            true
          )
        );
      });
      root.add(
        makeGabledHouse(
          shared,
          wallM,
          museumRoofM,
          warmWindowMat,
          0.16,
          0.085,
          0.12,
          0.44,
          hFn(0.44, -1.14),
          -1.14,
          0.08
        ),
        makeGabledHouse(
          shared,
          wallM,
          museumRoofM,
          warmWindowMat,
          0.26,
          0.1,
          0.16,
          1.08,
          hFn(1.08, -0.04),
          -0.04,
          -0.28,
          true
        )
      );

      // Stepped crater kimberlite rocks + clinging shrubs
      const pitRocks: Array<{
        x: number;
        y: number;
        z: number;
        sx: number;
        sy: number;
        sz: number;
        ry: number;
        color: string;
      }> = [];
      const pitTrees: TreePlacement[] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rad = 0.68 + (i % 3) * 0.16;
        const px = Math.cos(a) * rad;
        const pz = Math.sin(a) * rad;
        const py = hFn(px, pz);
        pitRocks.push({
          x: px,
          y: py + 0.03,
          z: pz,
          sx: 0.08,
          sy: 0.05,
          sz: 0.07,
          ry: a,
          color: '#6b6254',
        });
        if (i % 2 === 0) {
          pitTrees.push({
            x: px * 1.18,
            y: hFn(px * 1.18, pz * 1.18),
            z: pz * 1.18,
            scale: 0.042,
            color: '#4c752b',
            style: 'bush',
          });
        }
      }
      addInstancedRocks(root, shared, pitRocks, localMaterials);
      addInstancedTrees(root, shared, pitTrees, localMaterials);
    });
  } else if (name === 'Union Buildings') {
    const heightAt = (x: number, z: number) => {
      const upperTerrace = smoothstep(-0.08, -0.35, z) * 0.46;
      const midTerrace = smoothstep(0.45, 0.12, z) * 0.22;
      const lowTerrace = smoothstep(1.05, 0.72, z) * 0.16;
      const bowl = Math.exp(-Math.pow(x * 2.4, 2) - Math.pow((z - 0.15) * 3.2, 2)) * 0.14;
      const crestHill = smoothstep(-0.75, -1.35, z) * 0.35;
      return 0.78 + upperTerrace + midTerrace + lowTerrace + crestHill - bowl;
    };
    terrainCfg = {
      strataTopColor: '#9c4329',
      strataBottomColor: '#543528',
      heightAt,
      topColorAt: (x, z, _h, slope, out) => {
        if (Math.abs(z - 0.12) < 0.14 && Math.abs(x) < 0.38) out.set('#d4c29e');
        else if (slope > 0.35) out.set('#a38b67');
        else out.set('#5e8c30');
      },
    };
    maxTopY = 2.05;
    postDecorators.push((hFn) => {
      const sandstoneM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#d8be98', roughness: 0.78 })
      );
      const colonnadeShadeM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#473c32', roughness: 0.9 })
      );
      const tileRoofM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#be5b37', roughness: 0.74 })
      );
      const copperDomeM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#6b9a84', roughness: 0.44, metalness: 0.38 })
      );
      const poolWaterM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#2b9cb0', roughness: 0.22, metalness: 0.2 })
      );
      const baseZ = -0.58;
      const by = hFn(0, baseZ);

      // Baker semicircular colonnade with recessed window arches & columns
      const arcSegs = 8;
      for (let i = 0; i < arcSegs; i++) {
        const a = Math.PI * (0.15 + (i / (arcSegs - 1)) * 0.7);
        const cx = Math.cos(a) * 0.56;
        const cz = baseZ - Math.sin(a) * 0.28 + 0.1;
        const block = new THREE.Mesh(shared.boxGeo, sandstoneM);
        block.scale.set(0.18, 0.19, 0.14);
        block.position.set(cx, by + 0.095, cz);
        block.rotation.y = a - Math.PI * 0.5;
        block.castShadow = true;
        const archRecess = new THREE.Mesh(shared.boxGeo, colonnadeShadeM);
        archRecess.scale.set(0.13, 0.085, 0.146);
        archRecess.position.set(cx, by + 0.095, cz);
        archRecess.rotation.y = a - Math.PI * 0.5;
        const roof = new THREE.Mesh(shared.boxGeo, tileRoofM);
        roof.scale.set(0.19, 0.04, 0.15);
        roof.position.set(cx, by + 0.21, cz);
        roof.rotation.y = a - Math.PI * 0.5;
        root.add(block, archRecess, roof);
      }
      [
        [-0.78, -0.45],
        [0.78, -0.45],
      ].forEach(([wx, wz]) => {
        const wing = new THREE.Mesh(shared.boxGeo, sandstoneM);
        wing.scale.set(0.42, 0.22, 0.24);
        wing.position.set(wx, by + 0.11, wz);
        wing.castShadow = true;
        const wingWin = new THREE.Mesh(shared.boxGeo, warmWindowMat);
        wingWin.scale.set(0.34, 0.08, 0.25);
        wingWin.position.set(wx, by + 0.12, wz);
        const wRoof = new THREE.Mesh(shared.boxGeo, tileRoofM);
        wRoof.scale.set(0.44, 0.05, 0.26);
        wRoof.position.set(wx, by + 0.24, wz);
        root.add(wing, wingWin, wRoof);
      });
      [
        [-0.48, -0.56],
        [0.48, -0.56],
      ].forEach(([tx, tz]) => {
        const tower = new THREE.Mesh(shared.cylinderGeo, sandstoneM);
        tower.scale.set(0.075, 0.42, 0.075);
        tower.position.set(tx, by + 0.21, tz);
        tower.castShadow = true;
        const dome = new THREE.Mesh(shared.sphereGeo, copperDomeM);
        dome.scale.set(0.068, 0.085, 0.068);
        dome.position.set(tx, by + 0.44, tz);
        const lantern = new THREE.Mesh(shared.cylinderGeo, warmWindowMat);
        lantern.scale.set(0.05, 0.06, 0.05);
        lantern.position.set(tx, by + 0.38, tz);
        root.add(tower, dome, lantern);
      });

      // Stepped retaining stone terrace walls + grand staircase + reflecting lawn pool
      [
        [-0.12, 0.96],
        [0.32, 0.45],
      ].forEach(([tz, wallW]) => {
        const wall = new THREE.Mesh(shared.boxGeo, sandstoneM);
        wall.scale.set(wallW, 0.06, 0.05);
        wall.position.set(0, hFn(0, tz) + 0.02, tz);
        root.add(wall);
      });
      const stairs = new THREE.Mesh(shared.boxGeo, sandstoneM);
      stairs.scale.set(0.24, 0.04, 0.92);
      stairs.position.set(0, hFn(0, 0.48) + 0.03, 0.48);
      const pool = new THREE.Mesh(shared.cylinderGeo, poolWaterM);
      pool.scale.set(0.22, 0.02, 0.14);
      pool.position.set(0, hFn(0, 0.16) + 0.02, 0.16);
      root.add(stairs, pool);

      const jacs: TreePlacement[] = [];
      for (let i = 0; i < 9; i++) {
        const z = -0.82 + i * 0.24;
        jacs.push({
          x: -1.18,
          y: hFn(-1.18, z),
          z,
          scale: 0.088,
          color: i % 2 === 0 ? '#7f52c7' : '#9c72e0',
          style: 'jacaranda',
        });
        jacs.push({
          x: 1.18,
          y: hFn(1.18, z),
          z,
          scale: 0.088,
          color: i % 2 === 0 ? '#9c72e0' : '#8558cf',
          style: 'jacaranda',
        });
      }
      addInstancedTrees(root, shared, jacs, localMaterials);
    });
  } else if (name === 'Drakensberg Amphitheatre') {
    const heightAt = (x: number, z: number) => {
      const valley = Math.exp(-Math.pow((x - 0.12) * 2.2, 2)) * smoothstep(-0.3, 1.3, z);
      const wallCurve = smoothstep(0.12, -0.78, z + Math.abs(x) * 0.22);
      return 0.72 + wallCurve * 1.28 - valley * 0.22 + fbm2(x * 3.1, z * 3.1) * 0.11;
    };
    terrainCfg = {
      strataTopColor: '#726a5b',
      strataBottomColor: '#48443d',
      heightAt,
      waterLevel: 0.65,
      waterMask: (x, z, h) => z > 0.25 && Math.abs(x - 0.12) < 0.35 && h < 0.65,
      waterPalette: riverWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.67) out.set('#7a786e');
        else if (slope > 0.42) out.set('#554f45');
        else out.set('#52822d');
      },
    };
    maxTopY = 2.45;
    postDecorators.push(() => {
      const fallMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#e5f8ff',
          emissive: '#89cbe0',
          emissiveIntensity: 0.25,
          roughness: 0.25,
          transparent: true,
          opacity: 0.9,
        })
      );
      [
        [0.14, 1.32, -0.42, 0.085, 1.12],
        [-0.08, 1.38, -0.5, 0.042, 0.96],
        [0.34, 1.28, -0.46, 0.038, 0.92],
      ].forEach(([fx, fy, fz, fw, fh]) => {
        const ribbon = new THREE.Mesh(shared.boxGeo, fallMat);
        ribbon.scale.set(fw, fh, 0.07);
        ribbon.position.set(fx, fy, fz);
        ribbon.rotation.x = 0.22;
        root.add(ribbon);
      });

      // Fluted Drakensberg Sentinel basalt buttresses & plunge-pool boulders
      const buttresses = [
        [-0.75, -0.52, 0.26, 0.56, 0.24],
        [-0.36, -0.68, 0.22, 0.62, 0.2],
        [0.54, -0.62, 0.24, 0.58, 0.22],
        [0.88, -0.42, 0.22, 0.52, 0.2],
        [-0.18, 0.35, 0.14, 0.12, 0.14],
        [0.38, 0.42, 0.15, 0.12, 0.13],
      ].map(([rx, rz, sx, sy, sz], i) => ({
        x: rx,
        y: heightAt(rx, rz) + sy * 0.2,
        z: rz,
        sx,
        sy,
        sz,
        ry: i * 0.8,
        color: '#575248',
      }));
      addInstancedRocks(root, shared, buttresses, localMaterials);

      const trees: TreePlacement[] = [];
      for (let i = 0; i < 42; i++) {
        const rx = -1.25 + hashSeed(i, 31) * 2.5;
        const rz = 0.12 + hashSeed(i, 32) * 1.18;
        const ry = heightAt(rx, rz);
        if (ry > 0.72 && Math.abs(rx - 0.12) > 0.24) {
          trees.push({ x: rx, y: ry, z: rz, scale: 0.056, color: '#396b26', style: 'bush' });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);

      // Rising Tugela canyon waterfall mist + high cliff ridge cloud
      addLocalMistPlume(0.14, 0.95, 0.1, 1.1, 0.65, '#eefaff', 0.48, -0.22, 0.55);
      addLocalMistPlume(0, 2.25, -0.58, 2.2, 0.55, '#eff5fc', 0.36, -0.4, 0.45);
    });
  } else if (name === 'Knysna Heads') {
    const heightAt = (x: number, z: number) => {
      const channel = Math.exp(-Math.pow((x - z * 0.15) * 2.6, 2));
      const leftHead = smoothstep(-0.15, -0.75, x) * smoothstep(-0.25, 0.65, z) * 0.96;
      const rightHead = smoothstep(0.18, 0.85, x) * smoothstep(-0.55, 0.55, z) * 1.05;
      const lagoonShore = smoothstep(-0.55, -1.28, z) * 0.42 * (0.4 + Math.abs(x) * 0.5);
      return (
        0.46 +
        (leftHead + rightHead + lagoonShore) * (1 - channel * 0.82) +
        fbm2(x * 2.5, z * 2.5) * 0.08
      );
    };
    terrainCfg = {
      strataTopColor: '#b59d78',
      strataBottomColor: '#564d42',
      heightAt,
      waterLevel: 0.8,
      waterPalette: oceanWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.82) out.set('#968b72');
        else if (slope > 0.38) out.set('#a88459');
        else out.set('#44752b');
      },
    };
    maxTopY = 1.9;
    postDecorators.push((hFn) => {
      const hullM = trackMat(new THREE.MeshStandardMaterial({ color: '#f3f1eb', roughness: 0.4 }));
      const sailM = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#fffcf5',
          roughness: 0.55,
          side: THREE.DoubleSide,
        })
      );
      const roofM = trackMat(new THREE.MeshStandardMaterial({ color: '#42505e', roughness: 0.8 }));
      const deckM = trackMat(new THREE.MeshStandardMaterial({ color: '#8a6845', roughness: 0.85 }));

      // Wooden marina jetty & clifftop lookout terrace
      const jetty = new THREE.Mesh(shared.boxGeo, deckM);
      jetty.scale.set(0.32, 0.03, 0.06);
      jetty.position.set(-0.68, 0.82, -0.92);
      const lookout = new THREE.Mesh(shared.boxGeo, deckM);
      lookout.scale.set(0.22, 0.04, 0.16);
      lookout.position.set(0.76, hFn(0.76, 0.35) + 0.03, 0.35);
      root.add(jetty, lookout);

      const boats: THREE.Group[] = [];
      [
        [-0.36, -0.68, 0.2],
        [0.05, -0.82, -0.3],
        [0.24, -0.45, 0.4],
        [-0.14, 0.08, 0.1],
      ].forEach(([bx, bz, rot]) => {
        const bg = new THREE.Group();
        bg.position.set(bx, 0.81, bz);
        bg.rotation.y = rot;
        const hull = new THREE.Mesh(shared.boxGeo, hullM);
        hull.scale.set(0.045, 0.024, 0.11);
        const sail = new THREE.Mesh(shared.coneGeo, sailM);
        sail.scale.set(0.036, 0.13, 0.014);
        sail.position.y = 0.078;
        bg.add(hull, sail);
        root.add(bg);
        boats.push(bg);
      });
      [
        [-0.95, 0.12, 0.25],
        [-1.08, 0.55, -0.2],
        [0.95, -0.25, 0.3],
        [0.88, -0.65, -0.15],
        [1.06, 0.15, 0.4],
      ].forEach(([hx, hz, rot]) => {
        root.add(
          makeGabledHouse(
            shared,
            hullM,
            roofM,
            warmWindowMat,
            0.15,
            0.085,
            0.105,
            hx,
            hFn(hx, hz),
            hz,
            rot,
            true
          )
        );
      });

      // Coastal sandstone cliff rocks hugging both Heads along the channel
      const headRocks = [
        [-0.45, 0.22, 0.18],
        [-0.38, 0.65, 0.2],
        [-0.58, -0.18, 0.16],
        [0.42, 0.15, 0.2],
        [0.36, 0.58, 0.19],
        [0.52, -0.36, 0.17],
      ].map(([rx, rz, rs], i) => ({
        x: rx,
        y: Math.max(0.76, hFn(rx, rz)) + rs * 0.16,
        z: rz,
        sx: rs * 1.25,
        sy: rs * 0.85,
        sz: rs,
        ry: i * 1.1,
        color: '#8e7d62',
      }));
      addInstancedRocks(root, shared, headRocks, localMaterials);

      // Dense coastal milkwood & fynbos trees across Eastern and Western Heads
      const headTrees: TreePlacement[] = [];
      for (let i = 0; i < 42; i++) {
        const rx = -1.32 + hashSeed(i, 81) * 2.64;
        const rz = -1.25 + hashSeed(i, 82) * 2.45;
        const ry = hFn(rx, rz);
        if (ry > 0.96) {
          headTrees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.048 + hashSeed(i, 83) * 0.036,
            color: i % 2 === 0 ? '#356623' : '#4a7a2e',
            style: i % 5 === 0 ? 'oak' : 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, headTrees, localMaterials);

      addLocalMistPlume(0.0, 0.98, 0.65, 1.3, 0.42, '#e8f6ff', 0.3, -0.25, 0.5);

      sliceTicks.push((t) => {
        boats.forEach((b, i) => {
          b.rotation.z = Math.sin(t * 1.4 + i) * 0.08;
        });
      });
    });
  } else if (name === 'Palace of the Lost City') {
    const heightAt = (x: number, z: number) => {
      const palaceRise = smoothstep(0.45, -0.85, z) * 0.62;
      const poolDip =
        Math.exp(-Math.pow((x - 0.08) * 1.85, 2) - Math.pow((z - 0.56) * 2.05, 2)) * 0.44;
      return 0.88 + palaceRise - poolDip + fbm2(x * 2.2, z * 2.2) * 0.06;
    };
    terrainCfg = {
      strataTopColor: '#c45b38',
      strataBottomColor: '#6b3b29',
      heightAt,
      waterLevel: 0.76,
      waterMask: (x, z, h) => x > -0.68 && x < 0.88 && z > 0.02 && z < 1.28 && h < 0.76,
      waterPalette: {
        shallowColor: '#3ce3eb',
        deepColor: '#0e9ab8',
        foamStrength: 1.0,
        turbulence: 0.9,
        clarity: 0.9,
      },
      topColorAt: (x, z, h, _slope, out) => {
        const beachD = Math.hypot((x - 0.08) * 0.9, (z - 0.54) * 1.15);
        if (h < 0.77) out.set('#dfcca0');
        else if (beachD < 0.78 && z > 0.06) out.set('#ead8ae');
        else out.set('#3d6e23');
      },
    };
    maxTopY = 2.25;
    postDecorators.push((hFn) => {
      const stoneM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#dab382', roughness: 0.78 })
      );
      const darkTrimM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#453526', roughness: 0.86 })
      );
      const domeM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#8ac9c9', roughness: 0.4, metalness: 0.35 })
      );
      const slideM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#ebae28', roughness: 0.36 })
      );
      const goldM = trackGlowMat('#ffd56b', '#e8a82e', 0.45);
      const py = hFn(0.18, -0.58);
      const keep = new THREE.Mesh(shared.boxGeo, stoneM);
      keep.scale.set(0.76, 0.36, 0.34);
      keep.position.set(0.18, py + 0.18, -0.58);
      keep.castShadow = true;
      const winBand = new THREE.Mesh(shared.boxGeo, warmWindowMat);
      winBand.scale.set(0.7, 0.12, 0.355);
      winBand.position.set(0.18, py + 0.23, -0.58);
      root.add(keep, winBand);
      // Recessed colonnade arches along front facade
      for (let a = -3; a <= 3; a++) {
        const arch = new THREE.Mesh(shared.boxGeo, darkTrimM);
        arch.scale.set(0.055, 0.13, 0.03);
        arch.position.set(0.18 + a * 0.095, py + 0.08, -0.405);
        root.add(arch);
      }
      const leftWing = new THREE.Mesh(shared.boxGeo, stoneM);
      leftWing.scale.set(0.36, 0.22, 0.24);
      leftWing.position.set(-0.34, py + 0.11, -0.42);
      leftWing.rotation.y = 0.42;
      const leftWin = new THREE.Mesh(shared.boxGeo, warmWindowMat);
      leftWin.scale.set(0.3, 0.08, 0.25);
      leftWin.position.set(-0.34, py + 0.14, -0.42);
      leftWin.rotation.y = 0.42;
      const rightWing = new THREE.Mesh(shared.boxGeo, stoneM);
      rightWing.scale.set(0.36, 0.22, 0.24);
      rightWing.position.set(0.7, py + 0.11, -0.42);
      rightWing.rotation.y = -0.42;
      const rightWin = new THREE.Mesh(shared.boxGeo, warmWindowMat);
      rightWin.scale.set(0.3, 0.08, 0.25);
      rightWin.position.set(0.7, py + 0.14, -0.42);
      rightWin.rotation.y = -0.42;
      root.add(leftWing, leftWin, rightWing, rightWin);

      // Grounded Bridge of Time + twin sculpted obelisks + winding Valley of Waves waterslide
      const bY = hFn(0.16, -0.14);
      const bridgeWalk = new THREE.Mesh(shared.boxGeo, stoneM);
      bridgeWalk.scale.set(0.16, 0.04, 0.38);
      bridgeWalk.position.set(0.16, bY + 0.02, -0.14);
      root.add(bridgeWalk);
      [-0.1, 0.1].forEach((ox) => {
        const pylon = new THREE.Mesh(shared.coneGeo, stoneM);
        pylon.scale.set(0.035, 0.18, 0.035);
        pylon.position.set(0.16 + ox, bY + 0.09, -0.02);
        root.add(pylon);
      });
      const slideCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.62, hFn(-0.62, -0.08) + 0.18, -0.08),
        new THREE.Vector3(-0.68, hFn(-0.68, 0.22) + 0.09, 0.22),
        new THREE.Vector3(-0.52, 0.82, 0.46),
        new THREE.Vector3(-0.32, 0.77, 0.62),
      ]);
      const slideGeo = new THREE.TubeGeometry(slideCurve, 20, 0.022, 8, false);
      localGeometries.push(slideGeo);
      root.add(new THREE.Mesh(slideGeo, slideM));

      [
        [-0.14, -0.64, 0.46],
        [0.18, -0.62, 0.58],
        [0.52, -0.6, 0.44],
      ].forEach(([tx, tz, th]) => {
        const t = new THREE.Mesh(shared.cylinderGeo, stoneM);
        t.scale.set(0.08, th, 0.08);
        t.position.set(tx, py + th * 0.5, tz);
        const d = new THREE.Mesh(shared.sphereGeo, domeM);
        d.scale.set(0.088, 0.095, 0.088);
        d.position.set(tx, py + th + 0.04, tz);
        const spire = new THREE.Mesh(shared.coneGeo, goldM);
        spire.scale.set(0.018, 0.09, 0.018);
        spire.position.set(tx, py + th + 0.14, tz);
        root.add(t, d, spire);
      });
      const trees: TreePlacement[] = [];
      for (let i = 0; i < 64; i++) {
        const rx = -1.34 + hashSeed(i, 41) * 2.68;
        const rz = -1.28 + hashSeed(i, 42) * 2.52;
        const ry = hFn(rx, rz);
        if (
          ry > 0.84 &&
          Math.hypot(rx - 0.08, rz - 0.56) > 0.68 &&
          Math.hypot(rx - 0.18, rz + 0.58) > 0.5
        ) {
          trees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.058 + hashSeed(i, 43) * 0.028,
            color: i % 2 === 0 ? '#356920' : '#4a8029',
            style: i % 4 === 0 ? 'quiver' : i % 3 === 0 ? 'oak' : 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);
    });
  } else if (name === 'Storms River Mouth') {
    const heightAt = (x: number, z: number) => {
      const gorge = Math.exp(-Math.pow((x - z * 0.12) * 2.4, 2));
      const leftPeak = smoothstep(0.15, -1.25, x) * (0.95 + smoothstep(0.6, -1.0, z) * 0.55);
      const rightPeak = smoothstep(-0.15, 1.25, x) * (1.1 + smoothstep(0.6, -1.0, z) * 0.58);
      return 0.42 + (leftPeak + rightPeak) * (1 - gorge * 0.86) + fbm2(x * 2.6, z * 2.6) * 0.08;
    };
    terrainCfg = {
      strataTopColor: '#8d877a',
      strataBottomColor: '#45423d',
      heightAt,
      waterLevel: 0.78,
      waterPalette: tanninWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.8) out.set('#6e5538');
        else if (slope > 0.44) out.set('#6a6357');
        else out.set('#2c5c20');
      },
    };
    maxTopY = 2.2;
    postDecorators.push(() => {
      const bridgeM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#9c7850', roughness: 0.8 })
      );
      const cableM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#383d44', roughness: 0.45, metalness: 0.65 })
      );
      const deck = new THREE.Mesh(shared.boxGeo, bridgeM);
      deck.scale.set(1.06, 0.03, 0.085);
      deck.position.set(0.05, 1.12, 0.12);
      deck.rotation.y = 0.25;
      deck.castShadow = true;
      root.add(deck);
      [-0.44, 0.54].forEach((px) => {
        const pylon = new THREE.Mesh(shared.boxGeo, bridgeM);
        pylon.scale.set(0.045, 0.24, 0.045);
        pylon.position.set(px, 1.2, 0.12 - px * 0.22);
        root.add(pylon);
      });
      // Twin suspension cables arcing across pylons
      const cableCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.44, 1.32, 0.22),
        new THREE.Vector3(0.05, 1.15, 0.12),
        new THREE.Vector3(0.54, 1.32, 0.0),
      ]);
      const cableGeo = new THREE.TubeGeometry(cableCurve, 16, 0.009, 6, false);
      localGeometries.push(cableGeo);
      root.add(new THREE.Mesh(cableGeo, cableM));

      const trees: TreePlacement[] = [];
      for (let i = 0; i < 66; i++) {
        const rx = -1.35 + hashSeed(i, 51) * 2.7;
        const rz = -1.35 + hashSeed(i, 52) * 2.2;
        const ry = heightAt(rx, rz);
        if (ry > 0.96) {
          trees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.062 + hashSeed(i, 53) * 0.04,
            color: i % 2 === 0 ? '#2b5e1f' : '#3a7026',
            style: i % 4 === 0 ? 'oak' : 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);

      // Tsitsikamma canyon sea spray & rain-forest mist
      addLocalMistPlume(0.05, 1.02, 0.25, 1.4, 0.5, '#e8f4ef', 0.34, -0.25, 0.55);
    });
  } else if (name === 'Cradle of Humankind') {
    const heightAt = (x: number, z: number) => {
      const tumulus =
        Math.exp(-Math.pow((x + 0.45) * 2.4, 2) - Math.pow((z + 0.22) * 2.4, 2)) * 0.36;
      return 1.24 + tumulus + fbm2(x * 2.2, z * 2.2) * 0.07;
    };
    terrainCfg = {
      strataTopColor: '#9c7852',
      strataBottomColor: '#3f3831',
      heightAt,
      cavernCutout: (x, z) => x > -0.28 && z > -0.28,
      topColorAt: (x, z, _h, _slope, out) => {
        if (Math.hypot(x + 0.45, z + 0.22) < 0.4) out.set('#6a913a');
        else out.set('#849442');
      },
    };
    maxTopY = 1.95;
    postDecorators.push((hFn) => {
      const caveWallM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#6b4e34', roughness: 0.92 })
      );
      const caveFloorM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#3b332b', roughness: 0.94 })
      );
      const roofSlab = new THREE.Mesh(shared.boxGeo, caveWallM);
      roofSlab.scale.set(1.8, 0.12, 1.8);
      roofSlab.position.set(0.58, 0.95, 0.58);
      const floorSlab = new THREE.Mesh(shared.boxGeo, caveFloorM);
      floorSlab.scale.set(1.8, 0.14, 1.8);
      floorSlab.position.set(0.58, 0.07, 0.58);
      root.add(roofSlab, floorSlab);

      const backWallA = new THREE.Mesh(shared.boxGeo, caveWallM);
      backWallA.scale.set(0.16, 0.9, 1.82);
      backWallA.position.set(-0.32, 0.48, 0.58);
      const backWallB = new THREE.Mesh(shared.boxGeo, caveWallM);
      backWallB.scale.set(1.82, 0.9, 0.16);
      backWallB.position.set(0.58, 0.48, -0.32);
      root.add(backWallA, backWallB);

      // Subterranean emerald-turquoise lake + transparent cutaway water faces inside the cavern
      const { top: caveWaterTopMat, wall: caveWaterWallMat } = getCachedWaterMats(
        shared,
        'cradle_cave',
        {
          shallowColor: '#24e3ca',
          deepColor: '#056366',
          foamStrength: 0.15,
          turbulence: 0.2,
          clarity: 0.92,
        }
      );
      extraWaterMats.push(caveWaterTopMat, caveWaterWallMat);
      const cavePoolTopGeo = new THREE.PlaneGeometry(1.76, 1.76, 12, 12);
      cavePoolTopGeo.rotateX(-Math.PI * 0.5);
      const poolDepth = new Float32Array(cavePoolTopGeo.attributes.position.count).fill(0.24);
      cavePoolTopGeo.setAttribute('aDepth', new THREE.BufferAttribute(poolDepth, 1));
      localGeometries.push(cavePoolTopGeo);
      const cavePoolTop = new THREE.Mesh(cavePoolTopGeo, caveWaterTopMat);
      cavePoolTop.position.set(0.6, 0.34, 0.6);
      cavePoolTop.renderOrder = 2;

      const cavePoolFrontGeo = new THREE.PlaneGeometry(1.76, 0.2);
      const cavePoolRightGeo = new THREE.PlaneGeometry(1.76, 0.2);
      cavePoolRightGeo.rotateY(Math.PI * 0.5);
      localGeometries.push(cavePoolFrontGeo, cavePoolRightGeo);
      const cavePoolFront = new THREE.Mesh(cavePoolFrontGeo, caveWaterWallMat);
      cavePoolFront.position.set(0.6, 0.24, 1.485);
      cavePoolFront.renderOrder = 3;
      const cavePoolRight = new THREE.Mesh(cavePoolRightGeo, caveWaterWallMat);
      cavePoolRight.position.set(1.485, 0.24, 0.6);
      cavePoolRight.renderOrder = 3;
      root.add(cavePoolTop, cavePoolFront, cavePoolRight);

      // Suspended wooden cavern walkway + dolomite pillars + glowing amber lanterns
      const walkM = trackMat(new THREE.MeshStandardMaterial({ color: '#7a5c3d', roughness: 0.88 }));
      const catwalk = new THREE.Mesh(shared.boxGeo, walkM);
      catwalk.scale.set(1.05, 0.03, 0.14);
      catwalk.position.set(0.55, 0.46, 0.42);
      catwalk.rotation.y = -0.62;
      root.add(catwalk);

      const stalM = trackMat(new THREE.MeshStandardMaterial({ color: '#b59268', roughness: 0.82 }));
      const lanternM = trackGlowMat('#ffbe59', '#ff9924', 1.45);
      [
        [0.12, 0.12, 0.45],
        [0.65, 0.18, 0.35],
        [0.18, 0.72, 0.38],
        [0.82, 0.65, 0.42],
      ].forEach(([sx, sz, h]) => {
        const stalag = new THREE.Mesh(shared.coneGeo, stalM);
        stalag.scale.set(0.08, h, 0.08);
        stalag.position.set(sx, 0.12 + h * 0.5, sz);
        const stalac = new THREE.Mesh(shared.coneGeo, stalM);
        stalac.scale.set(0.07, h * 0.8, 0.07);
        stalac.rotation.x = Math.PI;
        stalac.position.set(sx + 0.12, 0.92 - h * 0.36, sz + 0.08);
        const lantern = new THREE.Mesh(shared.sphereGeo, lanternM);
        lantern.scale.setScalar(0.036);
        lantern.position.set(sx, 0.52, sz);
        root.add(stalag, stalac, lantern);
      });

      const portal = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#d4cfc4', roughness: 0.75 }))
      );
      portal.scale.set(0.22, 0.12, 0.09);
      portal.position.set(-0.26, 1.4, 0.15);
      const stoneArch = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#8f6948', roughness: 0.88 }))
      );
      stoneArch.scale.set(0.18, 0.1, 0.12);
      stoneArch.position.set(0.45, hFn(0.45, -0.25) + 0.05, -0.25);
      root.add(portal, stoneArch);

      // Spiraling Maropeng visitor paths + parked safari 4x4s
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.15, hFn(-1.15, 0.45), 0.45),
          new THREE.Vector3(-0.35, hFn(-0.35, 0.35), 0.35),
          new THREE.Vector3(0.42, hFn(0.42, 0.08), 0.08),
          new THREE.Vector3(1.12, hFn(1.12, -0.15), -0.15),
        ],
        0.1,
        '#c2ab82',
        localGeometries,
        localMaterials
      );
      const jeepM = trackMat(new THREE.MeshStandardMaterial({ color: '#c4bca6', roughness: 0.6 }));
      const tireM = trackMat(new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.9 }));
      root.add(
        makeSafariVehicle(
          shared,
          jeepM,
          tireM,
          jeepM,
          warmWindowMat,
          0.75,
          hFn(0.75, 0.02),
          0.02,
          0.4,
          0.72
        ),
        makeSafariVehicle(
          shared,
          jeepM,
          tireM,
          jeepM,
          warmWindowMat,
          -0.82,
          hFn(-0.82, 0.42),
          0.42,
          1.1,
          0.72
        )
      );

      // Dolomite surface rocks + rich Highveld acacias & grass bushes on the top prairie
      const cradleRocks = [
        [-0.95, -0.22, 0.14],
        [0.12, -0.68, 0.16],
        [0.95, -0.58, 0.15],
        [-0.22, 0.88, 0.13],
      ].map(([rx, rz, rs], i) => ({
        x: rx,
        y: hFn(rx, rz) + rs * 0.25,
        z: rz,
        sx: rs * 1.25,
        sy: rs * 0.75,
        sz: rs,
        ry: i * 1.1,
        color: '#8e8474',
      }));
      addInstancedRocks(root, shared, cradleRocks, localMaterials);

      const cradleTrees: TreePlacement[] = [
        {
          x: -1.06,
          y: hFn(-1.06, -0.82),
          z: -0.82,
          scale: 0.082,
          color: '#4c752b',
          style: 'acacia',
        },
        { x: 0.86, y: hFn(0.86, -0.92), z: -0.92, scale: 0.078, color: '#567d30', style: 'acacia' },
        { x: -0.95, y: hFn(-0.95, 0.72), z: 0.72, scale: 0.074, color: '#4c752b', style: 'acacia' },
        { x: 0.25, y: hFn(0.25, -1.05), z: -1.05, scale: 0.07, color: '#4c752b', style: 'acacia' },
      ];
      for (let i = 0; i < 16; i++) {
        const bx = -1.25 + hashSeed(i, 95) * 2.4;
        const bz = -1.25 + hashSeed(i, 96) * 2.4;
        if (Math.hypot(bx + 0.45, bz + 0.22) > 0.45) {
          cradleTrees.push({
            x: bx,
            y: hFn(bx, bz),
            z: bz,
            scale: 0.04,
            color: '#5b8232',
            style: 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, cradleTrees, localMaterials);
    });
  } else if (name === 'Table Mountain') {
    const heightAt = (x: number, z: number) => {
      const boxDist = Math.max(Math.abs(x * 1.15), Math.abs(z * 1.65));
      const plateau = 1 - smoothstep(0.55, 1.15, boxDist);
      const devils =
        Math.exp(-Math.pow((x - 0.88) * 3.4, 2) - Math.pow((z + 0.35) * 3.4, 2)) * 0.42;
      const lions = Math.exp(-Math.pow((x + 0.92) * 3.5, 2) - Math.pow((z - 0.38) * 3.5, 2)) * 0.36;
      return 0.78 + plateau * 1.16 + devils + lions + fbm2(x * 3, z * 3) * 0.07;
    };
    terrainCfg = {
      strataTopColor: '#9c8b70',
      strataBottomColor: '#4c463d',
      heightAt,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h > 1.82) out.set('#847966');
        else if (slope > 0.32) out.set('#8f7f67');
        else out.set('#466e2c');
      },
    };
    maxTopY = 2.45;
    postDecorators.push((hFn) => {
      const stM = trackMat(new THREE.MeshStandardMaterial({ color: '#d8d0c2', roughness: 0.78 }));
      const roofStM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#474f59', roughness: 0.72 })
      );
      const cableM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#3b3e44', roughness: 0.5, metalness: 0.65 })
      );
      const carRedM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#d64536', roughness: 0.45 })
      );
      const carBlueM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#2b6cb0', roughness: 0.45 })
      );

      // Vertical sculpted sandstone buttress ribs along front northern cliffs (Twelve Apostles / Gorge)
      const buttresses = [
        [-0.48, 0.56, 0.16, 0.76, 0.14],
        [-0.16, 0.58, 0.18, 0.82, 0.15],
        [0.16, 0.58, 0.18, 0.82, 0.15],
        [0.48, 0.55, 0.16, 0.74, 0.14],
        [-0.78, 0.32, 0.14, 0.52, 0.14],
        [0.78, 0.32, 0.14, 0.52, 0.14],
        [-1.08, 0.78, 0.18, 0.14, 0.16],
        [0.98, 0.85, 0.18, 0.14, 0.16],
      ].map(([rx, rz, sx, sy, sz], i) => ({
        x: rx,
        y: hFn(rx, rz) + sy * 0.18,
        z: rz,
        sx,
        sy,
        sz,
        ry: i * 0.6,
        color: '#918068',
      }));
      addInstancedRocks(root, shared, buttresses, localMaterials);

      const station = new THREE.Mesh(shared.boxGeo, stM);
      station.scale.set(0.22, 0.085, 0.14);
      station.position.set(-0.42, 1.98, 0.36);
      const stRoof = new THREE.Mesh(shared.boxGeo, roofStM);
      stRoof.scale.set(0.24, 0.025, 0.16);
      stRoof.position.set(-0.42, 2.03, 0.36);
      root.add(station, stRoof);

      const lowerSt = new THREE.Mesh(shared.boxGeo, stM);
      lowerSt.scale.set(0.16, 0.065, 0.12);
      lowerSt.position.set(-0.88, hFn(-0.88, 1.05) + 0.032, 1.05);
      const lRoof = new THREE.Mesh(shared.boxGeo, roofStM);
      lRoof.scale.set(0.18, 0.02, 0.14);
      lRoof.position.set(-0.88, hFn(-0.88, 1.05) + 0.072, 1.05);
      root.add(lowerSt, lRoof);

      // Cableway wires + passing red & blue Rotair gondolas
      const cableCurve = new THREE.LineCurve3(
        new THREE.Vector3(-0.42, 2.0, 0.38),
        new THREE.Vector3(-0.88, hFn(-0.88, 1.05) + 0.06, 1.05)
      );
      const cableGeo = new THREE.TubeGeometry(cableCurve, 8, 0.008, 5, false);
      localGeometries.push(cableGeo);
      root.add(new THREE.Mesh(cableGeo, cableM));

      const gondolaA = new THREE.Mesh(shared.cylinderGeo, carRedM);
      gondolaA.scale.set(0.036, 0.042, 0.036);
      const gondolaB = new THREE.Mesh(shared.cylinderGeo, carBlueM);
      gondolaB.scale.set(0.034, 0.04, 0.034);
      root.add(gondolaA, gondolaB);

      // Iconic Table Mountain "tablecloth" cloud blanket spilling over the plateau.
      // Instanced soft puffs share the volumetric cloud shader for a cohesive read.
      const tableclothPuffs = [];
      for (let p = 0; p < 11; p++) {
        const px = -0.62 + p * 0.125;
        const pz = 0.05 + Math.sin(p * 1.35) * 0.13 + (p % 2) * 0.12;
        const spill = Math.max(0, Math.abs(px) - 0.32);
        tableclothPuffs.push({
          x: px,
          y: 2.05 - spill * 0.22 + Math.sin(p * 2.1) * 0.014,
          z: pz,
          sx: 0.175 + (p % 3) * 0.018,
          sy: 0.085 + (p % 2) * 0.012,
          sz: 0.16 + (p % 4) * 0.012,
          phase: 2.6 + p * 0.43,
        });
      }
      const tablecloth = createCloudPuffMesh(shared, tableclothPuffs);
      localGeometries.push(tablecloth.geometry);
      root.add(tablecloth);

      const clothPlume = addLocalMistPlume(
        0.02,
        2.06,
        0.22,
        2.1,
        0.85,
        '#f6faff',
        0.62,
        -0.95,
        0.15
      );

      const trees: TreePlacement[] = [];
      for (let i = 0; i < 44; i++) {
        const rx = -1.35 + hashSeed(i, 71) * 2.7;
        const rz = -1.35 + hashSeed(i, 72) * 2.7;
        const ry = hFn(rx, rz);
        if (ry < 1.32) {
          trees.push({
            x: rx,
            y: ry,
            z: rz,
            scale: 0.052,
            color: i % 2 === 0 ? '#3b6623' : '#4c782c',
            style: i % 6 === 0 ? 'oak' : 'bush',
          });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);

      sliceTicks.push((t) => {
        const u = 0.5 + 0.36 * Math.sin(t * 0.45);
        const uB = 1 - u;
        const p0x = -0.42;
        const p0y = 2.0;
        const p0z = 0.38;
        const p1x = -0.88;
        const p1y = hFn(-0.88, 1.05) + 0.06;
        const p1z = 1.05;
        gondolaA.position.set(
          p0x + (p1x - p0x) * u,
          p0y + (p1y - p0y) * u - 0.03,
          p0z + (p1z - p0z) * u
        );
        gondolaB.position.set(
          p0x + (p1x - p0x) * uB + 0.03,
          p0y + (p1y - p0y) * uB - 0.03,
          p0z + (p1z - p0z) * uB
        );
        clothPlume.position.z = 0.22 + Math.sin(t * 0.35) * 0.08;
      });
    });
  } else if (name === 'Three Rondavels') {
    const heightAt = (x: number, z: number) => {
      const canyon = smoothstep(-0.25, 1.05, z) * 0.65;
      return 1.38 - canyon + fbm2(x * 2.3, z * 2.3) * 0.08;
    };
    terrainCfg = {
      strataTopColor: '#b86842',
      strataBottomColor: '#5c4132',
      heightAt,
      waterLevel: 0.72,
      waterMask: (_x, z, h) => z > 0.55 && h < 0.72,
      waterPalette: riverWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.74) out.set('#6e685d');
        else if (slope > 0.35) out.set('#aa5e39');
        else out.set('#477d2c');
      },
    };
    maxTopY = 2.35;
    postDecorators.push((hFn) => {
      const rockM = trackMat(new THREE.MeshStandardMaterial({ color: '#b5613b', roughness: 0.88 }));
      const capM = trackMat(new THREE.MeshStandardMaterial({ color: '#45752a', roughness: 0.9 }));
      [
        [-0.65, -0.35, 0.22, 0.76],
        [0.0, -0.45, 0.25, 0.9],
        [0.65, -0.25, 0.2, 0.72],
      ].forEach(([rx, rz, rr, rh]) => {
        const y = hFn(rx, rz);
        const col = new THREE.Mesh(shared.cylinderGeo, rockM);
        col.scale.set(rr, rh, rr);
        col.position.set(rx, y + rh * 0.42, rz);
        col.castShadow = true;
        const cap = new THREE.Mesh(shared.coneGeo, capM);
        cap.scale.set(rr * 1.12, rh * 0.36, rr * 1.12);
        cap.position.set(rx, y + rh * 0.96, rz);
        root.add(col, cap);
      });

      // Canyon cliff crags + Blyde River lookout platform + gorge trees
      const canyonRocks = [
        [-0.95, 0.08, 0.22],
        [0.95, 0.12, 0.21],
        [-0.32, 0.22, 0.17],
        [0.34, 0.18, 0.18],
      ].map(([rx, rz, rs], i) => ({
        x: rx,
        y: hFn(rx, rz) + rs * 0.25,
        z: rz,
        sx: rs * 1.35,
        sy: rs * 0.85,
        sz: rs,
        ry: i * 1.1,
        color: '#a85a36',
      }));
      addInstancedRocks(root, shared, canyonRocks, localMaterials);

      const deck = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#7d5f3e', roughness: 0.86 }))
      );
      deck.scale.set(0.32, 0.036, 0.18);
      deck.position.set(-0.98, hFn(-0.98, -0.68) + 0.03, -0.68);
      root.add(deck);

      const trees: TreePlacement[] = [];
      for (let i = 0; i < 32; i++) {
        const rx = -1.25 + hashSeed(i, 97) * 2.5;
        const rz = -1.15 + hashSeed(i, 98) * 1.95;
        const ry = hFn(rx, rz);
        if (ry > 0.78) {
          trees.push({ x: rx, y: ry, z: rz, scale: 0.055, color: '#396b26', style: 'bush' });
        }
      }
      addInstancedTrees(root, shared, trees, localMaterials);
      addLocalMistPlume(0, 2.08, -0.35, 1.9, 0.48, '#f0f5fc', 0.28, -0.4, 0.5);
    });
  } else if (name === 'Gariep Dam') {
    const heightAt = (x: number, z: number) => {
      const upMask = smoothstep(0.18, -0.25, z);
      const upBasin = Math.exp(-Math.pow(x * 0.95, 2)) * upMask * 0.62;
      const downGorge = Math.exp(-Math.pow(x * 2.2, 2)) * (1 - upMask) * 0.48;
      return 1.26 - upBasin - downGorge + fbm2(x * 2, z * 2) * 0.05;
    };
    terrainCfg = {
      strataTopColor: '#b38d62',
      strataBottomColor: '#5c4d3e',
      heightAt,
      waterLevel: 0.86,
      waterMask: (x, z, h) =>
        ((z < 0.14 && Math.abs(x) < 1.28) || (z >= 0.14 && Math.abs(x) < 0.45)) && h < 0.86,
      waterPalette: riverWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.87) out.set('#80796d');
        else if (slope > 0.35) out.set('#967c5c');
        else out.set('#9c9652');
      },
    };
    maxTopY = 1.78;
    postDecorators.push((hFn) => {
      const damM = trackMat(new THREE.MeshStandardMaterial({ color: '#d4d0c5', roughness: 0.72 }));
      const spillM = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#e5f8ff',
          transparent: true,
          opacity: 0.84,
          roughness: 0.28,
        })
      );
      for (let i = -4; i <= 4; i++) {
        const a = i * 0.16;
        const seg = new THREE.Mesh(shared.boxGeo, damM);
        seg.scale.set(0.24, 0.46, 0.12);
        seg.position.set(Math.sin(a) * 0.95, 0.92, 0.12 - Math.cos(a) * 0.18);
        seg.rotation.y = -a;
        seg.castShadow = true;
        root.add(seg);
        if (Math.abs(i) <= 2) {
          const pier = new THREE.Mesh(shared.boxGeo, damM);
          pier.scale.set(0.05, 0.52, 0.16);
          pier.position.set(Math.sin(a) * 0.95, 0.95, 0.12 - Math.cos(a) * 0.18);
          pier.rotation.y = -a;
          root.add(pier);
        }
      }
      const spill = new THREE.Mesh(shared.boxGeo, spillM);
      spill.scale.set(0.55, 0.34, 0.08);
      spill.position.set(0, 0.88, 0.14);
      spill.rotation.x = 0.52;
      const apronPool = new THREE.Mesh(shared.boxGeo, spillM);
      apronPool.scale.set(0.62, 0.03, 0.52);
      apronPool.position.set(0, 0.75, 0.56);
      root.add(spill, apronPool);

      const karooRocks = [
        [-0.98, 0.62, 0.18],
        [0.98, 0.55, 0.19],
        [-1.08, -0.45, 0.16],
        [1.08, -0.35, 0.17],
      ].map(([rx, rz, rs], i) => ({
        x: rx,
        y: hFn(rx, rz) + rs * 0.2,
        z: rz,
        sx: rs * 1.2,
        sy: rs * 0.8,
        sz: rs,
        ry: i * 1.1,
        color: '#9c7c58',
      }));
      addInstancedRocks(root, shared, karooRocks, localMaterials);

      addInstancedTrees(
        root,
        shared,
        [
          {
            x: -1.12,
            y: hFn(-1.12, 0.85),
            z: 0.85,
            scale: 0.068,
            color: '#5c782d',
            style: 'acacia',
          },
          { x: 1.08, y: hFn(1.08, 0.88), z: 0.88, scale: 0.072, color: '#5c782d', style: 'acacia' },
        ],
        localMaterials
      );
      addLocalMistPlume(0, 0.88, 0.42, 0.95, 0.48, '#eefaff', 0.44, -0.25, 0.5);
    });
  } else {
    // Mapungubwe Hill
    const heightAt = (x: number, z: number) => {
      const mesa = 1 - smoothstep(0.32, 0.86, Math.hypot((x + 0.15) * 1.15, (z + 0.12) * 1.4));
      return 0.84 + mesa * 0.68 + fbm2(x * 2.4, z * 2.4) * 0.08;
    };
    terrainCfg = {
      strataTopColor: '#c97843',
      strataBottomColor: '#69432d',
      heightAt,
      topColorAt: (_x, _z, _h, slope, out) => {
        if (slope > 0.35) out.set('#c46f3b');
        else out.set('#988f46');
      },
    };
    maxTopY = 1.95;
    postDecorators.push((hFn) => {
      const barkM = trackMat(new THREE.MeshStandardMaterial({ color: '#9c7d65', roughness: 0.92 }));
      const leafM = trackMat(new THREE.MeshStandardMaterial({ color: '#4c752b', roughness: 0.88 }));
      const stoneWallM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#a8673e', roughness: 0.9 })
      );
      const bx = 0.72;
      const bz = 0.45;
      const by = hFn(bx, bz);
      // Iconic multi-branched Baobab tree
      const trunk = new THREE.Mesh(shared.cylinderGeo, barkM);
      trunk.scale.set(0.145, 0.44, 0.145);
      trunk.position.set(bx, by + 0.21, bz);
      trunk.castShadow = true;
      root.add(trunk);
      [0, 1.6, 3.2, 4.7].forEach((ang, idx) => {
        const limb = new THREE.Mesh(shared.cylinderGeo, barkM);
        limb.scale.set(0.045, 0.22, 0.045);
        limb.position.set(bx + Math.cos(ang) * 0.08, by + 0.43, bz + Math.sin(ang) * 0.08);
        limb.rotation.set(Math.sin(ang) * 0.55, 0, -Math.cos(ang) * 0.55);
        const tuft = new THREE.Mesh(shared.foliageGeo, leafM);
        tuft.scale.set(0.18, 0.085, 0.16);
        tuft.position.set(
          bx + Math.cos(ang) * 0.16,
          by + 0.52 + (idx % 2) * 0.03,
          bz + Math.sin(ang) * 0.16
        );
        tuft.castShadow = true;
        root.add(limb, tuft);
      });

      // Sandstone mesa boulders + royal dry-stone summit wall + Golden Rhino sculpture
      const mesaRocks = [
        [-0.65, 0.18, 0.19],
        [0.35, -0.45, 0.18],
        [-0.45, -0.52, 0.17],
        [0.42, 0.24, 0.16],
      ].map(([rx, rz, rs], i) => ({
        x: rx,
        y: hFn(rx, rz) + rs * 0.2,
        z: rz,
        sx: rs * 1.35,
        sy: rs * 0.85,
        sz: rs,
        ry: i * 1.1,
        color: '#b8683a',
      }));
      addInstancedRocks(root, shared, mesaRocks, localMaterials);

      const royalWall = new THREE.Mesh(shared.boxGeo, stoneWallM);
      royalWall.scale.set(0.36, 0.055, 0.04);
      royalWall.position.set(-0.14, hFn(-0.14, -0.28) + 0.03, -0.28);
      root.add(royalWall);

      const goldM = trackGlowMat('#ffd269', '#e8a82e', 0.55);
      const rhino = new THREE.Mesh(shared.boxGeo, goldM);
      rhino.scale.set(0.085, 0.055, 0.052);
      rhino.position.set(-0.15, hFn(-0.15, -0.12) + 0.045, -0.12);
      root.add(rhino);

      addInstancedTrees(
        root,
        shared,
        [
          {
            x: -0.95,
            y: hFn(-0.95, 0.62),
            z: 0.62,
            scale: 0.08,
            color: '#4e752a',
            style: 'acacia',
          },
          {
            x: -0.82,
            y: hFn(-0.82, -0.78),
            z: -0.78,
            scale: 0.075,
            color: '#587d32',
            style: 'acacia',
          },
          {
            x: 0.85,
            y: hFn(0.85, -0.68),
            z: -0.68,
            scale: 0.078,
            color: '#4e752a',
            style: 'acacia',
          },
          { x: 0.12, y: hFn(0.12, 0.88), z: 0.88, scale: 0.068, color: '#557d2e', style: 'acacia' },
        ],
        localMaterials
      );
      addLocalMistPlume(0, 1.38, 0, 1.9, 0.44, '#f5d29c', 0.18, -0.45, 0.4);
    });
  }

  const builtTerrain = buildTerrainAndWaterMeshes(shared, name, terrainCfg);
  localGeometries.push(...builtTerrain.localGeometries);
  root.add(builtTerrain.terrainMesh);
  if (builtTerrain.waterTopMesh) root.add(builtTerrain.waterTopMesh);
  if (builtTerrain.waterWallMesh) root.add(builtTerrain.waterWallMesh);

  for (const dec of postDecorators) {
    dec(terrainCfg.heightAt);
  }

  // Hovering instanced stylised cloud clusters above the slice (GPU drift/bob)
  const cloudLayer = createSliceCloudLayer(shared, seed, maxTopY, terrainCfg.heightAt);
  const cloudGroup = cloudLayer.group;
  root.add(cloudGroup);

  // Brass/gold hollow square focus rim sitting flush beneath the cutaway block
  const ringFrameGeo = new THREE.RingGeometry(1.56, 1.66, 4);
  ringFrameGeo.rotateZ(Math.PI * 0.25);
  ringFrameGeo.rotateX(-Math.PI * 0.5);
  localGeometries.push(ringFrameGeo);
  const ringMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#e8b04a',
      emissive: '#e8b04a',
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide,
      roughness: 0.35,
    })
  );
  const ringMesh = new THREE.Mesh(ringFrameGeo, ringMat);
  ringMesh.position.y = -0.02;
  ringMesh.renderOrder = 1;
  ringMesh.visible = false;
  root.add(ringMesh);

  for (let i = 0; i < localMaterials.length; i++) {
    const mat = localMaterials[i];
    if (mat instanceof THREE.MeshStandardMaterial) {
      patchPlacesVolumetricFog(mat, shared.env);
    }
  }

  // Invisible bounding hit-box for fast, crisp raycast picking across all 24 islands
  const hitGeo = new THREE.BoxGeometry(3.15, 2.55, 3.15);
  localGeometries.push(hitGeo);
  const hitMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 1.15;
  hitBox.userData.landmarkIndex = spec.landmarkIndex;
  hitBox.userData.sliceIndex = seed;
  root.add(hitBox);

  const tick = (elapsed: number, litStrength: number) => {
    for (let i = 0; i < glowMats.length; i++) {
      glowMats[i].emissiveIntensity = 0.28 + litStrength * 1.5;
    }
    for (let i = 0; i < sliceTicks.length; i++) {
      sliceTicks[i](elapsed, litStrength);
    }
  };

  return {
    spec,
    root,
    hitBox,
    ringMesh,
    cloudGroup,
    waterMats: [...builtTerrain.waterMats, ...extraWaterMats],
    glowMats,
    tick,
    dispose: () => {
      localGeometries.forEach((g) => g.dispose());
      localMaterials.forEach((m) => m.dispose());
      cloudLayer.dispose();
    },
  };
}
