import * as THREE from 'three';
import { LANDMARKS } from '../data/landmarks';
import { WU } from './shaders';
import {
  createCutawayWaterTopMaterial,
  createCutawayWaterWallMaterial,
  getOrlandoMuralTexture,
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
  cloudMat: THREE.MeshStandardMaterial;
  foliageGeo: THREE.BufferGeometry;
  trunkGeo: THREE.BufferGeometry;
  rockGeo: THREE.BufferGeometry;
  boxGeo: THREE.BufferGeometry;
  coneGeo: THREE.BufferGeometry;
  sphereGeo: THREE.BufferGeometry;
  cylinderGeo: THREE.BufferGeometry;
  waterTopMats: Map<string, THREE.ShaderMaterial>;
  waterWallMats: Map<string, THREE.ShaderMaterial>;
  dispose: () => void;
}

export function createSliceSharedAssets(
  env: PlacesShaderEnvironment,
  terrainMat: THREE.MeshStandardMaterial,
  cloudMat: THREE.MeshStandardMaterial
): SliceSharedAssets {
  const waterTopMats = new Map<string, THREE.ShaderMaterial>();
  const waterWallMats = new Map<string, THREE.ShaderMaterial>();

  return {
    env,
    terrainMat,
    cloudMat,
    foliageGeo: new THREE.IcosahedronGeometry(1, 1),
    trunkGeo: new THREE.CylinderGeometry(0.18, 0.28, 1, 6),
    rockGeo: new THREE.DodecahedronGeometry(1, 1),
    boxGeo: new THREE.BoxGeometry(1, 1, 1),
    coneGeo: new THREE.ConeGeometry(1, 1, 7),
    sphereGeo: new THREE.SphereGeometry(1, 12, 10),
    cylinderGeo: new THREE.CylinderGeometry(1, 1, 1, 12),
    waterTopMats,
    waterWallMats,
    dispose: () => {
      waterTopMats.forEach((m) => m.dispose());
      waterWallMats.forEach((m) => m.dispose());
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
  /** Optional custom cavern cutout (used for Cradle of Humankind subterranean cutaway). */
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
  let wall = shared.waterWallMats.get(key);
  if (!top) {
    top = createCutawayWaterTopMaterial(shared.env, opts);
    shared.waterTopMats.set(key, top);
  }
  if (!wall) {
    wall = createCutawayWaterWallMaterial(shared.env, opts);
    shared.waterWallMats.set(key, wall);
  }
  return { top, wall };
}

function buildTerrainAndWaterMeshes(
  shared: SliceSharedAssets,
  paletteKey: string,
  cfg: TerrainSliceConfig
): TerrainMeshResult {
  const N = cfg.segments ?? 32;
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

  // Helper to emit vertical cutaway strata side walls
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
      // Top vertex
      pos.push(s.x, s.topY, s.z);
      norm.push(nx, 0, nz);
      cStrataMix.copy(cStrataBot).lerp(cStrataTop, clamp01((s.topY - baseY) / 1.4));
      col.push(cStrataMix.r, cStrataMix.g, cStrataMix.b);
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

  // Front (+Z), Back (-Z), Right (+X), Left (-X)
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
      botY: fCut ? baseY + 0.08 : baseY,
    });
    backSamples.push({ x: xs[i], z: -half, topY: hAt(i, 0), botY: baseY });

    const rCut = cfg.cavernCutout?.(half, zs[i]);
    rightSamples.push({
      x: half,
      z: zs[i],
      topY: hAt(N, i),
      botY: rCut ? baseY + 0.08 : baseY,
    });
    leftSamples.push({ x: -half, z: zs[i], topY: hAt(0, i), botY: baseY });
  }

  emitSideWall(frontSamples, 0, 1, true);
  emitSideWall(backSamples, 0, -1, false);
  emitSideWall(rightSamples, 1, 0, false);
  emitSideWall(leftSamples, -1, 0, true);

  // Bottom cap so orbit underneath never looks hollow
  const botStart = pos.length / 3;
  pos.push(-half, baseY, -half, half, baseY, -half, half, baseY, half, -half, baseY, half);
  for (let i = 0; i < 4; i++) {
    norm.push(0, -1, 0);
    col.push(cStrataBot.r * 0.65, cStrataBot.g * 0.65, cStrataBot.b * 0.65);
  }
  idx.push(botStart, botStart + 1, botStart + 2, botStart, botStart + 2, botStart + 3);

  const terrainGeo = new THREE.BufferGeometry();
  terrainGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  terrainGeo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
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
            // Signed depth allows fragment shader to trace smooth shoreline curves without triangle jaggedness
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

    // Translucent vertical water cross-section walls along outer cutaway faces
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

function addInstancedFoliage(
  parent: THREE.Group,
  shared: SliceSharedAssets,
  positions: Array<{ x: number; y: number; z: number; scale: number; color: string }>,
  yStretch = 0.85
): void {
  if (positions.length === 0) return;
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.02 });
  const mesh = new THREE.InstancedMesh(shared.foliageGeo, mat, positions.length);
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();

  positions.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(
      hashSeed(p.x, p.z) * 0.5,
      hashSeed(p.z, p.x) * Math.PI * 2,
      hashSeed(p.x * 2, p.z) * 0.5
    );
    dummy.scale.set(p.scale, p.scale * yStretch, p.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    c.set(p.color);
    mesh.setColorAt(i, c);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
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
  }>
): void {
  if (rocks.length === 0) return;
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.84, metalness: 0.05 });
  const mesh = new THREE.InstancedMesh(shared.rockGeo, mat, rocks.length);
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  rocks.forEach((r, i) => {
    dummy.position.set(r.x, r.y, r.z);
    dummy.rotation.set(0.15, r.ry, 0.1);
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

function buildHoverClouds(shared: SliceSharedAssets, seed: number, maxTopY: number): THREE.Group {
  const cloudGroup = new THREE.Group();
  const clusterCount = 3;
  for (let c = 0; c < clusterCount; c++) {
    const cluster = new THREE.Group();
    const angle = seed * 2.1 + c * 2.05;
    const rad = 0.52 + (c % 2) * 0.42;
    cluster.position.set(
      Math.cos(angle) * rad,
      maxTopY + 0.55 + c * 0.18,
      Math.sin(angle) * rad * 0.85
    );
    cluster.userData.baseX = cluster.position.x;
    cluster.userData.baseY = cluster.position.y;
    cluster.userData.phase = seed * 1.7 + c * 2.3;

    const puffs = 3 + (c % 2);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(shared.sphereGeo, shared.cloudMat);
      const s = p === 1 ? 0.18 : 0.12 + (p % 2) * 0.03;
      puff.scale.set(s * 1.45, s * 0.78, s * 1.1);
      puff.position.set((p - 1) * 0.14, p === 1 ? 0.04 : 0, (p % 2 === 0 ? 1 : -1) * 0.04);
      cluster.add(puff);
    }
    cloudGroup.add(cluster);
  }
  return cloudGroup;
}

function makeHouse(
  shared: SliceSharedAssets,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rotY = 0
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

  const roof = new THREE.Mesh(shared.coneGeo, roofMat);
  roof.scale.set(w * 0.78, h * 0.8, d * 0.78);
  roof.rotation.y = Math.PI * 0.25;
  roof.position.y = h + h * 0.34;
  roof.castShadow = true;
  g.add(roof);
  return g;
}

function makeRondavel(
  shared: SliceSharedAssets,
  wallMat: THREE.Material,
  thatchMat: THREE.Material,
  x: number,
  y: number,
  z: number,
  r = 0.09
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const wall = new THREE.Mesh(shared.cylinderGeo, wallMat);
  wall.scale.set(r, r * 0.95, r);
  wall.position.y = r * 0.45;
  wall.castShadow = true;
  g.add(wall);

  const roof = new THREE.Mesh(shared.coneGeo, thatchMat);
  roof.scale.set(r * 1.32, r * 1.05, r * 1.32);
  roof.position.y = r * 1.25;
  roof.castShadow = true;
  g.add(roof);
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
  const segs = 32;
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
    pos.push(p.x - side.x, p.y + 0.015, p.z - side.z);
    pos.push(p.x + side.x, p.y + 0.015, p.z + side.z);
    if (i < segs) {
      const b = i * 2;
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.92, side: THREE.DoubleSide });
  geosToDispose.push(geo);
  matsToDispose.push(mat);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  parent.add(mesh);
}

/**
 * 24 curated South African isometric cutaway place slices covering all 9 provinces
 * and directly inspired by the 20 reference slice dioramas.
 */
export const PLACE_SLICE_SPECS: readonly PlaceSliceSpec[] = (() => {
  const entries: Array<{ name: string; pos: [number, number]; sub: string }> = [
    // Western Cape cluster (South-West arc)
    {
      name: 'Table Mountain',
      pos: [-10.2, 5.2],
      sub: 'Sandstone plateau & cableway massif',
    },
    {
      name: 'Cape Point Lighthouse',
      pos: [-11.0, 9.6],
      sub: 'Peninsula headland & Flying Dutchman cliffs',
    },
    {
      name: 'Robben Island',
      pos: [-13.6, 2.0],
      sub: 'Limestone quarry, prison block & harbour sea slice',
    },
    {
      name: 'Boulders Beach',
      pos: [-7.0, 9.2],
      sub: 'Granite cove & African penguin boardwalk',
    },
    {
      name: 'Groot Constantia',
      pos: [-6.4, 5.0],
      sub: 'Cape Dutch gables & Constantia vineyards',
    },
    {
      name: 'Hermanus Whale Watching',
      pos: [-3.0, 9.4],
      sub: 'Walker Bay cliffside homes & breaching whales',
    },
    {
      name: 'Knysna Heads',
      pos: [1.0, 9.0],
      sub: 'Twin lagoon cliffs & turquoise marina sailboats',
    },

    // Northern Cape & West interior
    {
      name: 'Richtersveld',
      pos: [-10.5, -2.5],
      sub: 'Namaqualand wildflower bloom, granite koppies & quiver trees',
    },
    {
      name: 'Augrabies Falls',
      pos: [-6.5, -5.8],
      sub: 'Orange River salmon-granite gorge & canyon falls',
    },
    {
      name: 'The Big Hole',
      pos: [-3.0, -1.2],
      sub: 'Kimberley stepped diamond crater & emerald pit lake',
    },

    // Free State & North West
    {
      name: 'Gariep Dam',
      pos: [1.2, 4.4],
      sub: 'Curved Orange River arch dam & spillway basin',
    },
    {
      name: 'Golden Gate Highlands',
      pos: [4.8, 1.0],
      sub: 'Fluted golden sandstone spires & canyon lookout',
    },
    {
      name: 'Palace of the Lost City',
      pos: [-2.2, -5.4],
      sub: 'Gilded domed towers & turquoise Valley of Waves',
    },

    // Gauteng cluster
    {
      name: 'Cradle of Humankind',
      pos: [1.2, -4.6],
      sub: 'Maropeng mound & illuminated subterranean dolomite cavern',
    },
    {
      name: 'Orlando Towers',
      pos: [1.2, -0.4],
      sub: 'Painted Soweto cooling towers, bridge & township streets',
    },
    {
      name: 'Union Buildings',
      pos: [5.2, -4.6],
      sub: 'Baker colonnade, terraced lawns & purple jacarandas',
    },

    // Eastern Cape
    {
      name: 'Storms River Mouth',
      pos: [5.0, 8.6],
      sub: 'Tsitsikamma forest gorge, suspension bridge & amber river',
    },
    {
      name: 'Hole in the Wall',
      pos: [9.0, 7.6],
      sub: 'Wild Coast arched sea stack & hillside rondavels',
    },

    // KwaZulu-Natal
    {
      name: 'Sani Pass',
      pos: [8.8, 3.2],
      sub: 'Escarpment 4x4 hairpin switchbacks & border lodge',
    },
    {
      name: 'Drakensberg Amphitheatre',
      pos: [8.6, -1.2],
      sub: 'Basalt amphitheatre wall & multi-tier Tugela cascade',
    },
    {
      name: 'iSimangaliso Wetland Park',
      pos: [12.6, 1.0],
      sub: 'Estuary hippos, coastal dune forest & turquoise surf',
    },

    // Mpumalanga & Limpopo
    {
      name: 'Three Rondavels',
      pos: [9.4, -5.4],
      sub: 'Blyde Canyon terraced huts & green gorge river',
    },
    {
      name: 'Kruger National Park',
      pos: [12.8, -4.4],
      sub: 'Red bushveld safari track & elephant waterhole slice',
    },
    {
      name: 'Mapungubwe Hill',
      pos: [5.8, -8.8],
      sub: 'Ancient royal sandstone mesa & giant baobab crown',
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
 * Build one complete isometric geological cutaway slice diorama tailored to its place.
 */
export function buildPlaceSlice(
  spec: PlaceSliceSpec,
  shared: SliceSharedAssets,
  seed: number
): BuiltPlaceSlice {
  const root = new THREE.Group();
  root.position.set(spec.gridPos[0], 0, spec.gridPos[1]);

  const localGeometries: THREE.BufferGeometry[] = [];
  const localMaterials: THREE.Material[] = [];
  const glowMats: THREE.MeshStandardMaterial[] = [];
  let customTick: ((elapsed: number, lit: number) => void) | undefined;

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
        roughness: 0.4,
      })
    );
    glowMats.push(m);
    return m;
  };

  const cScratch = new THREE.Color();
  const oceanWater: CutawayWaterOptions = {
    shallowColor: '#25b5c2',
    deepColor: '#07435a',
    foamStrength: 1.0,
    turbulence: 1.05,
    clarity: 0.84,
  };
  const riverWater: CutawayWaterOptions = {
    shallowColor: '#3ec7cf',
    deepColor: '#0b5e6f',
    foamStrength: 1.15,
    turbulence: 1.25,
    clarity: 0.72,
  };
  const tanninWater: CutawayWaterOptions = {
    shallowColor: '#8d5324',
    deepColor: '#0a475e',
    foamStrength: 1.1,
    turbulence: 1.05,
    clarity: 0.68,
  };
  const muddyWater: CutawayWaterOptions = {
    shallowColor: '#9c8663',
    deepColor: '#5c4b34',
    foamStrength: 0.15,
    turbulence: 0.35,
    clarity: 0.45,
  };
  const emeraldWater: CutawayWaterOptions = {
    shallowColor: '#12856e',
    deepColor: '#053b31',
    foamStrength: 0.15,
    turbulence: 0.35,
    clarity: 0.76,
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
      const noise = fbm2(x * 1.9 + 2, z * 1.9 + 5) * 0.18;
      return 0.42 + onCliff * (0.88 + slope * 0.42) + noise * (0.4 + onCliff * 0.6);
    };
    terrainCfg = {
      strataTopColor: '#c9a66b',
      strataBottomColor: '#695641',
      heightAt,
      waterLevel: 0.84,
      waterPalette: oceanWater,
      topColorAt: (x, z, h, slope, out) => {
        if (h < 0.86) out.set('#917c5b');
        else if (slope > 0.34) out.set('#b8945d');
        else {
          out.set('#557a34').lerp(cScratch.set('#7a8e43'), fbm2(x * 3, z * 3));
        }
      },
    };
    maxTopY = 1.85;
    postDecorators.push((hFn) => {
      const whiteWall = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f3f1eb', roughness: 0.82 })
      );
      const slateRoof = trackMat(
        new THREE.MeshStandardMaterial({ color: '#2b313a', roughness: 0.85 })
      );
      const cottageSpot: Array<[number, number, number]> = [
        [-1.08, -0.95, 0.3],
        [-0.78, -0.62, 0.25],
        [-0.96, -0.22, 0.1],
        [-0.64, 0.12, -0.15],
        [-1.05, 0.56, 0.2],
        [-0.72, 0.88, -0.2],
        [-0.45, -0.92, 0.45],
      ];
      cottageSpot.forEach(([x, z, rot]) => {
        root.add(makeHouse(shared, whiteWall, slateRoof, 0.18, 0.11, 0.13, x, hFn(x, z), z, rot));
      });
      // Cliff road ribbon
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.38, hFn(-1.38, -0.8), -0.8),
          new THREE.Vector3(-0.75, hFn(-0.75, -0.2), -0.2),
          new THREE.Vector3(-0.68, hFn(-0.68, 0.65), 0.65),
          new THREE.Vector3(-1.2, hFn(-1.2, 1.35), 1.35),
        ],
        0.13,
        '#6d6a64',
        localGeometries,
        localMaterials
      );
      // Fynbos scrub
      const foliage: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 34; i++) {
        const rx = -1.38 + hashSeed(i, 1) * 1.15;
        const rz = -1.35 + hashSeed(i, 2) * 2.65;
        const ry = hFn(rx, rz);
        if (ry > 1.12) {
          foliage.push({
            x: rx,
            y: ry + 0.04,
            z: rz,
            scale: 0.05 + hashSeed(i, 3) * 0.045,
            color: i % 3 === 0 ? '#6b8736' : '#4a6b28',
          });
        }
      }
      addInstancedFoliage(root, shared, foliage);

      // Breaching Southern Right Whales
      const whaleMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#27313d', roughness: 0.45 })
      );
      const whales: THREE.Group[] = [];
      [
        { x: 0.68, z: 0.56, s: 1.0, rot: -0.6 },
        { x: 0.96, z: -0.18, s: 0.72, rot: 0.4 },
      ].forEach((w) => {
        const wg = new THREE.Group();
        wg.position.set(w.x, 0.83, w.z);
        wg.rotation.y = w.rot;
        const body = new THREE.Mesh(shared.sphereGeo, whaleMat);
        body.scale.set(0.08 * w.s, 0.065 * w.s, 0.22 * w.s);
        wg.add(body);
        const fluke = new THREE.Mesh(shared.boxGeo, whaleMat);
        fluke.scale.set(0.16 * w.s, 0.015 * w.s, 0.06 * w.s);
        fluke.position.z = -0.22 * w.s;
        wg.add(fluke);
        root.add(wg);
        whales.push(wg);
      });
      customTick = (t) => {
        whales.forEach((wg, idx) => {
          const arc = Math.sin(t * 1.25 + idx * 2.4);
          wg.position.y = 0.8 + Math.max(-0.04, arc) * 0.14;
          wg.rotation.x = -Math.cos(t * 1.25 + idx * 2.4) * 0.35;
        });
      };
    });
  } else if (name === 'iSimangaliso Wetland Park') {
    const heightAt = (x: number, z: number) => {
      // Sweeping dunes on -X, winding estuary river through middle, beach & ocean on +X
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
        if (x < -0.75) out.set('#e6cb8e'); // golden barrier dunes
        else if (h < 0.85) out.set('#e5d1a3'); // beach / sandbars
        else out.set('#35672a');
      },
    };
    maxTopY = 1.9;
    postDecorators.push((hFn) => {
      const foliage: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 64; i++) {
        const rx = -0.68 + hashSeed(i, 4) * 1.3;
        const rz = -1.38 + hashSeed(i, 5) * 2.75;
        const ry = hFn(rx, rz);
        if (ry > 0.87 && rx > -0.78) {
          foliage.push({
            x: rx,
            y: ry + 0.05,
            z: rz,
            scale: 0.055 + hashSeed(i, 6) * 0.05,
            color: i % 2 === 0 ? '#2f6523' : '#437c2d',
          });
        }
      }
      addInstancedFoliage(root, shared, foliage);

      // Hippos & tour boat in estuary
      const hippoMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#6b5e63', roughness: 0.72 })
      );
      [
        [-0.08, -0.22],
        [-0.14, 0.34],
        [0.05, 0.55],
      ].forEach(([hx, hz]) => {
        const hip = new THREE.Mesh(shared.sphereGeo, hippoMat);
        hip.scale.set(0.06, 0.045, 0.09);
        hip.position.set(hx, 0.82, hz);
        root.add(hip);
      });
      const boatGroup = new THREE.Group();
      const hull = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#ede8dc', roughness: 0.5 }))
      );
      hull.scale.set(0.08, 0.03, 0.17);
      const canopy = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#40533f', roughness: 0.8 }))
      );
      canopy.scale.set(0.075, 0.015, 0.11);
      canopy.position.y = 0.05;
      boatGroup.add(hull, canopy);
      boatGroup.position.set(-0.04, 0.83, -0.75);
      root.add(boatGroup);
      customTick = (t) => {
        boatGroup.position.z = -0.6 + Math.sin(t * 0.45) * 0.42;
        boatGroup.position.x = Math.sin(boatGroup.position.z * 1.8) * 0.25 - 0.1;
      };
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
      // Winding terracotta safari track + safari truck
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.42, hFn(-1.42, -0.2), -0.2),
          new THREE.Vector3(-0.3, hFn(-0.3, -0.35), -0.35),
          new THREE.Vector3(0.45, hFn(0.45, -0.15), -0.15),
          new THREE.Vector3(1.42, hFn(1.42, 0.18), 0.18),
        ],
        0.15,
        '#b85d32',
        localGeometries,
        localMaterials
      );
      const rover = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#dfd6be', roughness: 0.65 }))
      );
      rover.scale.set(0.14, 0.08, 0.08);
      rover.position.set(0.15, hFn(0.15, -0.26) + 0.05, -0.26);
      rover.rotation.y = -0.25;
      rover.castShadow = true;
      root.add(rover);

      // Elephant herd drinking around waterhole
      const eleMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#787470', roughness: 0.85 })
      );
      [
        [-0.25, 0.65, 0.6],
        [0.06, 0.42, -0.2],
        [0.44, 0.48, -0.8],
        [0.74, 0.68, -1.4],
        [-0.36, 0.96, 1.1],
      ].forEach(([ex, ez, rot]) => {
        const eg = new THREE.Group();
        eg.position.set(ex, Math.max(0.76, hFn(ex, ez)) + 0.04, ez);
        eg.rotation.y = rot;
        const body = new THREE.Mesh(shared.sphereGeo, eleMat);
        body.scale.set(0.05, 0.055, 0.08);
        const head = new THREE.Mesh(shared.sphereGeo, eleMat);
        head.scale.setScalar(0.036);
        head.position.set(0, 0.02, 0.068);
        eg.add(body, head);
        root.add(eg);
      });

      const foliage: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 48; i++) {
        const rx = -1.36 + hashSeed(i, 11) * 2.72;
        const rz = -1.36 + hashSeed(i, 12) * 2.72;
        const ry = hFn(rx, rz);
        if (ry > 0.88 && Math.hypot(rx - 0.25, rz - 0.82) > 0.85) {
          foliage.push({
            x: rx,
            y: ry + 0.05,
            z: rz,
            scale: 0.06 + hashSeed(i, 13) * 0.055,
            color: i % 3 === 0 ? '#55752a' : '#3d5c20',
          });
        }
      }
      addInstancedFoliage(root, shared, foliage, 0.58);
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
        else if (x < -0.15 && z > -0.45) out.set('#a99678'); // township earth
        else out.set('#6d8143');
      },
    };
    maxTopY = 2.05;
    postDecorators.push((hFn) => {
      const muralTex = getOrlandoMuralTexture();
      const towerMat = trackMat(
        new THREE.MeshStandardMaterial({ map: muralTex, roughness: 0.78, side: THREE.DoubleSide })
      );
      // Hyperboloid twin painted cooling towers
      const profile = [
        new THREE.Vector2(0.26, 0),
        new THREE.Vector2(0.18, 0.35),
        new THREE.Vector2(0.16, 0.62),
        new THREE.Vector2(0.2, 0.88),
      ];
      const towerGeo = new THREE.LatheGeometry(profile, 22);
      localGeometries.push(towerGeo);

      const t1 = new THREE.Mesh(towerGeo, towerMat);
      t1.position.set(0.24, hFn(0.24, -0.3), -0.3);
      t1.castShadow = true;
      const t2 = new THREE.Mesh(towerGeo, towerMat);
      t2.position.set(0.84, hFn(0.84, -0.35), -0.35);
      t2.rotation.y = 1.9;
      t2.castShadow = true;
      root.add(t1, t2);

      // Bungee suspension catwalk between tower rims
      const bridge = new THREE.Mesh(
        shared.boxGeo,
        trackMat(
          new THREE.MeshStandardMaterial({ color: '#d7c49e', roughness: 0.5, metalness: 0.5 })
        )
      );
      bridge.scale.set(0.62, 0.025, 0.05);
      bridge.position.set(0.54, hFn(0.54, -0.32) + 0.87, -0.32);
      root.add(bridge);

      // Green township soccer pitch
      const pitch = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#458a33', roughness: 0.9 }))
      );
      pitch.scale.set(0.46, 0.02, 0.3);
      pitch.position.set(-0.34, hFn(-0.34, -0.78) + 0.02, -0.78);
      root.add(pitch);

      // Township colourful houses
      const wallCols = ['#c7664c', '#e4b354', '#5c95b8', '#dcd6cb', '#7aa169'];
      const roofMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#4b4e54', roughness: 0.72, metalness: 0.35 })
      );
      for (let gx = 0; gx < 4; gx++) {
        for (let gz = 0; gz < 4; gz++) {
          const hx = -1.24 + gx * 0.28;
          const hz = -0.15 + gz * 0.34;
          if (gx === 1 && gz === 2) continue; // street intersection
          const wm = trackMat(
            new THREE.MeshStandardMaterial({
              color: wallCols[(gx * 3 + gz) % wallCols.length],
              roughness: 0.85,
            })
          );
          const hMesh = new THREE.Mesh(shared.boxGeo, wm);
          const yBase = hFn(hx, hz);
          hMesh.scale.set(0.14, 0.08, 0.11);
          hMesh.position.set(hx, yBase + 0.04, hz);
          hMesh.castShadow = true;
          root.add(hMesh);
          const rMesh = new THREE.Mesh(shared.boxGeo, roofMat);
          rMesh.scale.set(0.155, 0.015, 0.125);
          rMesh.position.set(hx, yBase + 0.085, hz);
          root.add(rMesh);
        }
      }
    });
  } else if (name === 'Hole in the Wall') {
    const heightAt = (x: number, z: number) => {
      // Main coastal hillside on +X/+Z corner, sandy lagoon bay, and dramatic sea stack island on -X/-Z
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
      // Iconic arched sea-stack cliff
      const archShape = new THREE.Shape();
      archShape.moveTo(-0.56, 0);
      archShape.lineTo(-0.42, 0.72);
      archShape.quadraticCurveTo(-0.1, 0.88, 0.32, 0.76);
      archShape.lineTo(0.55, 0.42);
      archShape.lineTo(0.46, 0);
      archShape.lineTo(0.16, 0);
      archShape.absarc(0, 0.14, 0.17, 0, Math.PI, false);
      archShape.lineTo(-0.56, 0);

      const archGeo = new THREE.ExtrudeGeometry(archShape, {
        depth: 0.34,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.04,
        bevelThickness: 0.04,
      });
      archGeo.center();
      localGeometries.push(archGeo);
      const stackMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#58554f', roughness: 0.9 })
      );
      const stackMesh = new THREE.Mesh(archGeo, stackMat);
      stackMesh.position.set(-0.55, 0.92, -0.52);
      stackMesh.rotation.y = 0.65;
      stackMesh.castShadow = true;
      stackMesh.receiveShadow = true;
      root.add(stackMesh);

      // Grass cap along top of the sea arch
      const cap = new THREE.Mesh(
        shared.foliageGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#4c872b', roughness: 0.9 }))
      );
      cap.scale.set(0.46, 0.08, 0.24);
      cap.position.set(-0.55, 1.32, -0.52);
      cap.rotation.y = 0.65;
      root.add(cap);

      // White-walled thatched Xhosa rondavels on rolling green hills
      const wallM = trackMat(new THREE.MeshStandardMaterial({ color: '#e6dfd3', roughness: 0.85 }));
      const thatchM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#8f754d', roughness: 0.92 })
      );
      [
        [0.95, -0.85],
        [1.18, -0.56],
        [0.82, -0.22],
        [-0.36, 0.88],
        [-0.08, 1.08],
      ].forEach(([rx, rz]) => {
        root.add(makeRondavel(shared, wallM, thatchM, rx, hFn(rx, rz), rz, 0.068));
      });
    });
  } else if (name === 'Richtersveld') {
    const heightAt = (x: number, z: number) => {
      const hill = smoothstep(-0.2, -1.35, z) * 0.42 + smoothstep(-0.4, 1.3, x) * 0.22;
      return 0.92 + hill + fbm2(x * 2.1 + 8, z * 2.1 + 3) * 0.16;
    };
    terrainCfg = {
      strataTopColor: '#c45b35',
      strataBottomColor: '#693c2a',
      heightAt,
      topColorAt: (x, z, _h, _slope, out) => {
        // Vivid Namaqualand wildflower bloom bands (orange, golden yellow, purple)
        const patch = fbm2(x * 2.8 + 1.2, z * 2.8 + 4.6);
        const sub = noise2(x * 6.5, z * 6.5);
        if (patch > 0.63) out.set('#ea6f1f');
        else if (patch > 0.52 && sub > 0.45) out.set('#eccb2b');
        else if (patch > 0.44 && sub < 0.35) out.set('#9e5dc4');
        else out.set('#ccb07e');
      },
    };
    maxTopY = 1.8;
    postDecorators.push((hFn) => {
      // Curved dirt track
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-1.38, hFn(-1.38, -0.2), -0.2),
          new THREE.Vector3(-0.2, hFn(-0.2, 0.1), 0.1),
          new THREE.Vector3(0.18, hFn(0.18, 0.85), 0.85),
          new THREE.Vector3(0.45, hFn(0.45, 1.4), 1.4),
        ],
        0.13,
        '#d1b488',
        localGeometries,
        localMaterials
      );
      // Rounded granite koppie boulders
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
        [-0.95, 0.5, 0.2],
        [-0.78, 0.64, 0.14],
        [0.95, 0.25, 0.22],
        [1.12, 0.42, 0.15],
        [-0.45, -0.82, 0.18],
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
      addInstancedRocks(root, shared, rocks);

      // Quiver trees & flower tufts
      const trunkM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#c4a66a', roughness: 0.88 })
      );
      const crownM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#789639', roughness: 0.85 })
      );
      [
        [-1.08, 0.12],
        [-0.85, -0.45],
        [1.06, -0.18],
        [0.85, -0.75],
      ].forEach(([qx, qz]) => {
        const y = hFn(qx, qz);
        const tr = new THREE.Mesh(shared.trunkGeo, trunkM);
        tr.scale.set(0.08, 0.22, 0.08);
        tr.position.set(qx, y + 0.11, qz);
        root.add(tr);
        const cr = new THREE.Mesh(shared.foliageGeo, crownM);
        cr.scale.set(0.09, 0.06, 0.09);
        cr.position.set(qx, y + 0.24, qz);
        root.add(cr);
      });

      // Tiny stone farmstead
      const stoneM = trackMat(new THREE.MeshStandardMaterial({ color: '#8f7d69', roughness: 0.9 }));
      const roofM = trackMat(new THREE.MeshStandardMaterial({ color: '#5c544b', roughness: 0.85 }));
      root.add(
        makeHouse(shared, stoneM, roofM, 0.18, 0.1, 0.12, 0.34, hFn(0.34, -0.46), -0.46, 0.5)
      );
    });
  } else if (name === 'Sani Pass') {
    const heightAt = (x: number, z: number) => {
      // Steep diagonal escarpment rising toward -Z/+X plateau
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
        if (slope > 0.42) out.set('#474945'); // dark basalt cliff rock
        else out.set('#5a8634'); // alpine highland grass
      },
    };
    maxTopY = 2.45;
    postDecorators.push((hFn) => {
      // Hairpin switchback gravel pass
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
        0.11,
        '#b8a382',
        localGeometries,
        localMaterials
      );
      // 4x4 trucks ascending the switchbacks
      const truckCols = ['#c94436', '#ebe9e1', '#d9d4c7'];
      [
        [0.42, 0.92, 0.4],
        [-0.24, 0.52, -0.5],
        [0.45, 0.14, 0.35],
        [0.24, -0.56, -0.4],
      ].forEach(([tx, tz, rot], idx) => {
        const truck = new THREE.Mesh(
          shared.boxGeo,
          trackMat(new THREE.MeshStandardMaterial({ color: truckCols[idx % 3], roughness: 0.55 }))
        );
        truck.scale.set(0.08, 0.055, 0.055);
        truck.position.set(tx, hFn(tx, tz) + 0.04, tz);
        truck.rotation.y = rot;
        root.add(truck);
      });
      // Highest pub border stone chalet at summit
      const stoneM = trackMat(new THREE.MeshStandardMaterial({ color: '#787166', roughness: 0.9 }));
      const roofM = trackMat(new THREE.MeshStandardMaterial({ color: '#465241', roughness: 0.85 }));
      root.add(
        makeHouse(shared, stoneM, roofM, 0.24, 0.12, 0.16, 1.02, hFn(1.02, -0.95), -0.95, 0.4)
      );
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
      // Cape Dutch H-shaped white gabled homestead + thatch roof
      const whiteM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.84 })
      );
      const thatchM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#3b3733', roughness: 0.92 })
      );
      const hy = hFn(-0.62, -0.28);
      root.add(makeHouse(shared, whiteM, thatchM, 0.44, 0.16, 0.22, -0.62, hy, -0.28, 0.75));
      root.add(
        makeHouse(shared, whiteM, thatchM, 0.2, 0.12, 0.14, -0.95, hFn(-0.95, 0.05), 0.05, 0.75)
      );

      // Neat vineyard trellis rows
      const vineMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#4f7a26', roughness: 0.88 })
      );
      for (let r = 0; r < 6; r++) {
        const vx = -0.58 + r * 0.16;
        const vz = 0.72 + (r % 2) * 0.05;
        const vy = hFn(vx, vz);
        const row = new THREE.Mesh(shared.boxGeo, vineMat);
        row.scale.set(0.05, 0.05, 0.78);
        row.position.set(vx, vy + 0.03, vz);
        row.rotation.y = 0.72;
        row.castShadow = true;
        root.add(row);
      }
      // Tall shade oaks behind homestead
      const oaks: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      [
        [-1.12, -0.55],
        [-0.85, -0.82],
        [-0.38, -0.78],
        [-1.18, -0.18],
      ].forEach(([ox, oz]) => {
        oaks.push({ x: ox, y: hFn(ox, oz) + 0.14, z: oz, scale: 0.14, color: '#325d21' });
      });
      addInstancedFoliage(root, shared, oaks, 0.92);
    });
  } else if (name === 'Cape Point Lighthouse') {
    const heightAt = (x: number, z: number) => {
      // Dramatic peninsula ridge dropping into turquoise ocean bay on +X / +Z
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
        else if (h < 0.9 && slope < 0.22) out.set('#ebdcb8'); // sandy cove beach
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
      const ly = hFn(-0.34, -0.78);
      const tower = new THREE.Mesh(shared.cylinderGeo, whiteM);
      tower.scale.set(0.055, 0.24, 0.055);
      tower.position.set(-0.34, ly + 0.12, -0.78);
      tower.castShadow = true;
      const cap = new THREE.Mesh(shared.coneGeo, redM);
      cap.scale.set(0.07, 0.06, 0.07);
      cap.position.set(-0.34, ly + 0.27, -0.78);
      const lantern = new THREE.Mesh(shared.sphereGeo, trackGlowMat('#ffe58c', '#ffb63b', 1.2));
      lantern.scale.setScalar(0.042);
      lantern.position.set(-0.34, ly + 0.24, -0.78);
      root.add(tower, cap, lantern);

      // Flying Dutchman funicular rail descending to carpark loop
      addRoadRibbon(
        root,
        [
          new THREE.Vector3(-0.3, ly + 0.04, -0.72),
          new THREE.Vector3(0.25, hFn(0.25, -0.25) + 0.03, -0.25),
          new THREE.Vector3(0.85, hFn(0.85, 0.28) + 0.03, 0.28),
        ],
        0.045,
        '#3b3d42',
        localGeometries,
        localMaterials
      );
      const foliage: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 30; i++) {
        const rx = -1.3 + hashSeed(i, 21) * 2.4;
        const rz = -1.3 + hashSeed(i, 22) * 2.2;
        const ry = hFn(rx, rz);
        if (ry > 0.96) {
          foliage.push({ x: rx, y: ry + 0.03, z: rz, scale: 0.045, color: '#456327' });
        }
      }
      addInstancedFoliage(root, shared, foliage);
    });
  } else if (name === 'Augrabies Falls') {
    const heightAt = (x: number, z: number) => {
      // Granite plateau sliced down the center by a steep winding river gorge & plunge pool
      const riverX = Math.sin(z * 1.4) * 0.16;
      const inGorge = Math.exp(-Math.pow((x - riverX) * 3.1, 2));
      const upperDrop = smoothstep(-0.18, 0.22, z); // drop happens near z = 0
      const floor = 0.95 - inGorge * (0.42 + upperDrop * 0.45);
      return floor + (1 - inGorge) * 0.42 + fbm2(x * 3.2, z * 3.2) * 0.14;
    };
    terrainCfg = {
      strataTopColor: '#c9885b',
      strataBottomColor: '#694e3f',
      heightAt,
      waterLevel: 0.64,
      waterMask: (x, z, h) => z > -0.05 && Math.abs(x) < 0.62 && h < 0.64,
      waterPalette: riverWater,
      topColorAt: (_x, z, h, slope, out) => {
        if (h < 0.66 && z > 0) out.set('#80796e');
        else if (slope > 0.38) out.set('#c47d54');
        else out.set('#d5bc8f');
      },
    };
    maxTopY = 1.75;
    postDecorators.push((hFn) => {
      // Cascading white waterfall curtain + upper river channel
      const fallMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#dff4fa',
          emissive: '#89c4d6',
          emissiveIntensity: 0.18,
          roughness: 0.3,
          transparent: true,
          opacity: 0.88,
        })
      );
      const upperStream = new THREE.Mesh(shared.boxGeo, fallMat);
      upperStream.scale.set(0.32, 0.04, 1.35);
      upperStream.position.set(0.08, 0.98, -0.75);
      const cascade = new THREE.Mesh(shared.boxGeo, fallMat);
      cascade.scale.set(0.28, 0.44, 0.14);
      cascade.position.set(0.05, 0.78, -0.04);
      cascade.rotation.x = 0.28;
      root.add(upperStream, cascade);

      // Wooden boardwalk decks
      const woodM = trackMat(new THREE.MeshStandardMaterial({ color: '#7a5c3c', roughness: 0.85 }));
      [
        [-0.65, -0.25],
        [-0.78, 0.25],
        [0.68, 0.12],
      ].forEach(([bx, bz]) => {
        const deck = new THREE.Mesh(shared.boxGeo, woodM);
        deck.scale.set(0.24, 0.03, 0.18);
        deck.position.set(bx, hFn(bx, bz) + 0.03, bz);
        root.add(deck);
      });

      // Quiver trees
      const trM = trackMat(new THREE.MeshStandardMaterial({ color: '#bda066', roughness: 0.85 }));
      const crM = trackMat(new THREE.MeshStandardMaterial({ color: '#6b8532', roughness: 0.85 }));
      [
        [-1.08, -0.75],
        [-0.85, -1.05],
        [1.06, -0.8],
        [1.15, -0.3],
      ].forEach(([qx, qz]) => {
        const y = hFn(qx, qz);
        const tr = new THREE.Mesh(shared.trunkGeo, trM);
        tr.scale.set(0.06, 0.2, 0.06);
        tr.position.set(qx, y + 0.1, qz);
        const cr = new THREE.Mesh(shared.foliageGeo, crM);
        cr.scale.set(0.08, 0.05, 0.08);
        cr.position.set(qx, y + 0.22, qz);
        root.add(tr, cr);
      });
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
        else out.set('#969454').lerp(cScratch.set('#c4aa6a'), 0.45);
      },
    };
    maxTopY = 2.45;
    postDecorators.push((hFn) => {
      // Sculpted fluted sandstone pillars rising vertically
      const spireMat = trackMat(
        new THREE.MeshStandardMaterial({ color: '#c9783a', roughness: 0.88 })
      );
      [
        [-0.1, -0.58, 0.24, 1.15],
        [0.36, -0.45, 0.18, 0.98],
        [-0.45, -0.25, 0.16, 0.85],
        [0.62, 0.05, 0.14, 0.74],
        [-0.62, 0.55, 0.13, 0.65],
      ].forEach(([sx, sz, sr, sh]) => {
        const spire = new THREE.Mesh(shared.cylinderGeo, spireMat);
        const sy = hFn(sx, sz);
        spire.scale.set(sr, sh, sr * 0.88);
        spire.position.set(sx, sy + sh * 0.45, sz);
        spire.castShadow = true;
        spire.receiveShadow = true;
        root.add(spire);
      });
      // Elevated stone viewpoint deck
      const deck = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#8f8474', roughness: 0.86 }))
      );
      deck.scale.set(0.28, 0.05, 0.24);
      deck.position.set(-0.36, hFn(-0.36, 0.08) + 0.14, 0.08);
      root.add(deck);
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
        else out.set('#ede1c3'); // warm white cove sand
      },
    };
    maxTopY = 1.65;
    postDecorators.push((hFn) => {
      // Giant smooth cream granite boulders
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
      ].forEach(([rx, rz, rs], idx) => {
        rocks.push({
          x: rx,
          y: hFn(rx, rz) + rs * 0.48,
          z: rz,
          sx: rs * 1.15,
          sy: rs * 0.9,
          sz: rs,
          ry: idx * 0.9,
          color: '#d4cab6',
        });
      });
      addInstancedRocks(root, shared, rocks);

      // Winding timber boardwalk through fynbos
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

      // African penguins on the white beach
      const pMat = trackMat(new THREE.MeshStandardMaterial({ color: '#1b2028', roughness: 0.6 }));
      [
        [-0.08, 0.05],
        [0.06, -0.12],
        [-0.18, 0.22],
        [0.14, 0.16],
        [-0.04, 0.38],
        [0.24, 0.36],
        [0.08, 0.56],
      ].forEach(([px, pz]) => {
        const pen = new THREE.Mesh(shared.cylinderGeo, pMat);
        pen.scale.set(0.022, 0.055, 0.022);
        pen.position.set(px, Math.max(0.84, hFn(px, pz)) + 0.028, pz);
        root.add(pen);
      });
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
        else if (Math.hypot(x - 0.36, z + 0.25) < 0.34) out.set('#ede4cf'); // white limestone quarry
        else out.set('#65783a');
      },
    };
    maxTopY = 1.65;
    postDecorators.push((hFn) => {
      // Prison courtyard square block
      const stoneM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#9a968e', roughness: 0.88 })
      );
      const wingPositions: Array<[number, number, number, number]> = [
        [-0.05, 0.08, 0.44, 0.08],
        [-0.05, 0.44, 0.44, 0.08],
        [-0.24, 0.26, 0.08, 0.36],
        [0.14, 0.26, 0.08, 0.36],
      ];
      wingPositions.forEach(([wx, wz, sw, sd]) => {
        const wall = new THREE.Mesh(shared.boxGeo, stoneM);
        wall.scale.set(sw, 0.08, sd);
        wall.position.set(wx, hFn(wx, wz) + 0.04, wz);
        wall.castShadow = true;
        root.add(wall);
      });
      // Red & white banded lighthouse
      const lhBase = new THREE.Mesh(
        shared.cylinderGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#f2f1ec', roughness: 0.75 }))
      );
      const ly = hFn(-0.46, -0.42);
      lhBase.scale.set(0.045, 0.24, 0.045);
      lhBase.position.set(-0.46, ly + 0.12, -0.42);
      const band = new THREE.Mesh(
        shared.cylinderGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#c4372d', roughness: 0.7 }))
      );
      band.scale.set(0.048, 0.07, 0.048);
      band.position.set(-0.46, ly + 0.14, -0.42);
      root.add(lhBase, band);

      // Ferry jetty + ferry boat
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
      customTick = (t) => {
        ferry.position.x = 1.18 + Math.sin(t * 0.7) * 0.12;
        ferry.position.z = 0.52 + Math.cos(t * 0.7) * 0.1;
      };
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
        else if (slope > 0.38) out.set('#7a7062');
        else out.set('#b99f77');
      },
    };
    maxTopY = 1.7;
    postDecorators.push((hFn) => {
      // Steel headframe + skywalk viewing platform
      const steelM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#454a52', roughness: 0.45, metalness: 0.7 })
      );
      const tower = new THREE.Mesh(shared.coneGeo, steelM);
      tower.scale.set(0.12, 0.34, 0.12);
      tower.position.set(0.28, hFn(0.28, -1.08) + 0.17, -1.08);
      root.add(tower);

      const skywalk = new THREE.Mesh(shared.boxGeo, steelM);
      skywalk.scale.set(0.45, 0.03, 0.14);
      skywalk.position.set(0.65, 1.32, -0.45);
      skywalk.rotation.y = -0.7;
      root.add(skywalk);

      // Corrugated historic Kimberley mine village cottages
      const wallM = trackMat(new THREE.MeshStandardMaterial({ color: '#e3dcd0', roughness: 0.85 }));
      const tinM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#8f4739', roughness: 0.72, metalness: 0.28 })
      );
      [
        [-1.08, -0.55],
        [-1.12, -0.15],
        [-1.08, 0.25],
        [-1.05, 0.65],
      ].forEach(([hx, hz]) => {
        root.add(makeHouse(shared, wallM, tinM, 0.16, 0.09, 0.12, hx, hFn(hx, hz), hz, 0.1));
      });
    });
  } else if (name === 'Union Buildings') {
    const heightAt = (x: number, z: number) => {
      // Elevated upper hill on -Z + stepped flat lawn terraces down toward +Z
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
        if (Math.abs(z - 0.12) < 0.14 && Math.abs(x) < 0.35) out.set('#d1be9a');
        else if (slope > 0.35) out.set('#a38b67');
        else out.set('#639134'); // emerald terraced lawns
      },
    };
    maxTopY = 2.05;
    postDecorators.push((hFn) => {
      const sandstoneM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#d4b890', roughness: 0.8 })
      );
      const tileRoofM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#be5b37', roughness: 0.76 })
      );
      const baseZ = -0.58;
      const by = hFn(0, baseZ);

      // Semicircular Herbert Baker colonnade + left & right wings
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
        const roof = new THREE.Mesh(shared.boxGeo, tileRoofM);
        roof.scale.set(0.19, 0.04, 0.15);
        roof.position.set(cx, by + 0.21, cz);
        roof.rotation.y = a - Math.PI * 0.5;
        root.add(block, roof);
      }
      // Flanking wings & twin domed clock towers
      [
        [-0.78, -0.45],
        [0.78, -0.45],
      ].forEach(([wx, wz]) => {
        const wing = new THREE.Mesh(shared.boxGeo, sandstoneM);
        wing.scale.set(0.42, 0.22, 0.24);
        wing.position.set(wx, by + 0.11, wz);
        wing.castShadow = true;
        const wRoof = new THREE.Mesh(shared.boxGeo, tileRoofM);
        wRoof.scale.set(0.44, 0.05, 0.26);
        wRoof.position.set(wx, by + 0.24, wz);
        root.add(wing, wRoof);
      });
      [
        [-0.48, -0.56],
        [0.48, -0.56],
      ].forEach(([tx, tz]) => {
        const tower = new THREE.Mesh(shared.cylinderGeo, sandstoneM);
        tower.scale.set(0.075, 0.42, 0.075);
        tower.position.set(tx, by + 0.21, tz);
        tower.castShadow = true;
        const dome = new THREE.Mesh(shared.sphereGeo, sandstoneM);
        dome.scale.set(0.068, 0.08, 0.068);
        dome.position.set(tx, by + 0.44, tz);
        root.add(tower, dome);
      });

      // Blooming purple Jacaranda avenues flanking both edges!
      const jacs: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 8; i++) {
        const z = -0.8 + i * 0.26;
        jacs.push({ x: -1.18, y: hFn(-1.18, z) + 0.09, z, scale: 0.11, color: '#8a5fd1' });
        jacs.push({ x: 1.18, y: hFn(1.18, z) + 0.09, z, scale: 0.11, color: '#9c72e0' });
      }
      addInstancedFoliage(root, shared, jacs, 0.85);
    });
  } else if (name === 'Drakensberg Amphitheatre') {
    const heightAt = (x: number, z: number) => {
      // Dramatic horseshoe basalt amphitheatre cliff wall across -Z, deep valley floor toward +Z
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
        else if (slope > 0.42) out.set('#59544b'); // fluted basalt precipice
        else out.set('#56852f');
      },
    };
    maxTopY = 2.45;
    postDecorators.push(() => {
      // Multi-tier Tugela Falls ribbon cascading down cliff face
      const fallMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#e5f8ff',
          emissive: '#89cbe0',
          emissiveIntensity: 0.22,
          roughness: 0.25,
          transparent: true,
          opacity: 0.9,
        })
      );
      const ribbon = new THREE.Mesh(shared.boxGeo, fallMat);
      ribbon.scale.set(0.08, 1.12, 0.08);
      ribbon.position.set(0.14, 1.32, -0.42);
      ribbon.rotation.x = 0.22;
      root.add(ribbon);

      const foliage: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 36; i++) {
        const rx = -1.25 + hashSeed(i, 31) * 2.5;
        const rz = 0.15 + hashSeed(i, 32) * 1.15;
        const ry = heightAt(rx, rz);
        if (ry > 0.72 && Math.abs(rx - 0.12) > 0.24) {
          foliage.push({ x: rx, y: ry + 0.04, z: rz, scale: 0.06, color: '#396b26' });
        }
      }
      addInstancedFoliage(root, shared, foliage);
    });
  } else if (name === 'Knysna Heads') {
    const heightAt = (x: number, z: number) => {
      // Twin massive cliff headlands guarding narrow central sea channel opening to lagoon (-Z)
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
        else if (slope > 0.42) out.set('#a88459');
        else out.set('#44752b');
      },
    };
    maxTopY = 1.9;
    postDecorators.push((hFn) => {
      // Tiny white sailboats in calm lagoon
      const hullM = trackMat(new THREE.MeshStandardMaterial({ color: '#f3f1eb', roughness: 0.4 }));
      const boats: THREE.Group[] = [];
      [
        [-0.36, -0.68],
        [0.05, -0.82],
        [0.24, -0.45],
        [-0.18, -0.22],
      ].forEach(([bx, bz]) => {
        const bg = new THREE.Group();
        bg.position.set(bx, 0.81, bz);
        const hull = new THREE.Mesh(shared.boxGeo, hullM);
        hull.scale.set(0.04, 0.02, 0.09);
        const sail = new THREE.Mesh(shared.coneGeo, hullM);
        sail.scale.set(0.03, 0.11, 0.015);
        sail.position.y = 0.065;
        bg.add(hull, sail);
        root.add(bg);
        boats.push(bg);
      });
      // Cliff houses
      const roofM = trackMat(new THREE.MeshStandardMaterial({ color: '#566473', roughness: 0.8 }));
      [
        [-0.95, 0.12],
        [0.95, -0.25],
        [0.88, -0.65],
      ].forEach(([hx, hz]) => {
        root.add(makeHouse(shared, hullM, roofM, 0.14, 0.08, 0.1, hx, hFn(hx, hz), hz, 0.3));
      });
      customTick = (t) => {
        boats.forEach((b, i) => {
          b.rotation.z = Math.sin(t * 1.4 + i) * 0.08;
        });
      };
    });
  } else if (name === 'Palace of the Lost City') {
    const heightAt = (x: number, z: number) => {
      const palaceRise = smoothstep(0.45, -0.85, z) * 0.62;
      const poolDip =
        Math.exp(-Math.pow((x - 0.12) * 2.5, 2) - Math.pow((z - 0.58) * 2.8, 2)) * 0.38;
      return 0.88 + palaceRise - poolDip + fbm2(x * 2.2, z * 2.2) * 0.06;
    };
    terrainCfg = {
      strataTopColor: '#c45b38',
      strataBottomColor: '#6b3b29',
      heightAt,
      waterLevel: 0.74,
      waterMask: (x, z, h) => x > -0.45 && x < 0.75 && z > 0.15 && z < 1.15 && h < 0.74,
      waterPalette: {
        shallowColor: '#3ce3eb',
        deepColor: '#0e9ab8',
        foamStrength: 1.0,
        turbulence: 0.9,
        clarity: 0.9,
      },
      topColorAt: (x, z, h, _slope, out) => {
        if (h < 0.76) out.set('#e8d5ad');
        else if (x > -0.4 && x < 0.75 && z > 0.05 && z < 0.45) out.set('#ede0be'); // Valley of Waves sandy beach
        else out.set('#447528');
      },
    };
    maxTopY = 2.25;
    postDecorators.push((hFn) => {
      const stoneM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#dab382', roughness: 0.78 })
      );
      const domeM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#8ac9c9', roughness: 0.42, metalness: 0.3 })
      );
      const py = hFn(0.18, -0.58);
      const keep = new THREE.Mesh(shared.boxGeo, stoneM);
      keep.scale.set(0.76, 0.36, 0.34);
      keep.position.set(0.18, py + 0.18, -0.58);
      keep.castShadow = true;
      root.add(keep);
      [
        [-0.14, -0.64, 0.46],
        [0.18, -0.62, 0.56],
        [0.52, -0.6, 0.44],
      ].forEach(([tx, tz, th]) => {
        const t = new THREE.Mesh(shared.cylinderGeo, stoneM);
        t.scale.set(0.08, th, 0.08);
        t.position.set(tx, py + th * 0.5, tz);
        const d = new THREE.Mesh(shared.sphereGeo, domeM);
        d.scale.set(0.088, 0.095, 0.088);
        d.position.set(tx, py + th + 0.04, tz);
        root.add(t, d);
      });
      const foliage: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 42; i++) {
        const rx = -1.32 + hashSeed(i, 41) * 2.6;
        const rz = -1.25 + hashSeed(i, 42) * 2.45;
        const ry = hFn(rx, rz);
        if (
          ry > 0.85 &&
          Math.hypot(rx - 0.12, rz - 0.58) > 0.62 &&
          Math.hypot(rx - 0.18, rz + 0.58) > 0.46
        ) {
          foliage.push({ x: rx, y: ry + 0.05, z: rz, scale: 0.065, color: '#3b6f23' });
        }
      }
      addInstancedFoliage(root, shared, foliage);
    });
  } else if (name === 'Storms River Mouth') {
    const heightAt = (x: number, z: number) => {
      // Deep central river gorge cutting between tall steep forested cliffs into surf ocean (+Z)
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
      // Famous suspension footbridge spanning gorge mouth
      const bridgeM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#9c7850', roughness: 0.8 })
      );
      const deck = new THREE.Mesh(shared.boxGeo, bridgeM);
      deck.scale.set(1.06, 0.03, 0.08);
      deck.position.set(0.05, 1.12, 0.12);
      deck.rotation.y = 0.25;
      deck.castShadow = true;
      root.add(deck);
      [-0.44, 0.54].forEach((px) => {
        const pylon = new THREE.Mesh(shared.boxGeo, bridgeM);
        pylon.scale.set(0.04, 0.22, 0.04);
        pylon.position.set(px, 1.18, 0.12 - px * 0.22);
        root.add(pylon);
      });
      // Dense green canopy covering cliffs
      const foliage: Array<{ x: number; y: number; z: number; scale: number; color: string }> = [];
      for (let i = 0; i < 65; i++) {
        const rx = -1.35 + hashSeed(i, 51) * 2.7;
        const rz = -1.35 + hashSeed(i, 52) * 2.2;
        const ry = heightAt(rx, rz);
        if (ry > 0.96) {
          foliage.push({
            x: rx,
            y: ry + 0.05,
            z: rz,
            scale: 0.065 + hashSeed(i, 53) * 0.04,
            color: i % 2 === 0 ? '#2b5e1f' : '#3a7026',
          });
        }
      }
      addInstancedFoliage(root, shared, foliage);
    });
  } else if (name === 'Cradle of Humankind') {
    const heightAt = (x: number, z: number) => {
      // Grassy Maropeng mound top + subterranean cavern cutaway on front (+X/+Z) corner
      const tumulus =
        Math.exp(-Math.pow((x + 0.45) * 2.4, 2) - Math.pow((z + 0.22) * 2.4, 2)) * 0.36;
      return 1.24 + tumulus + fbm2(x * 2.2, z * 2.2) * 0.07;
    };
    terrainCfg = {
      strataTopColor: '#9c7852',
      strataBottomColor: '#3f3831',
      heightAt,
      cavernCutout: (x, z) => x > -0.35 && z > -0.35 && (x > 0.35 || z > 0.35),
      waterLevel: 0.34,
      waterMask: (x, z) => x > -0.15 && z > -0.15,
      waterPalette: {
        shallowColor: '#19d4be',
        deepColor: '#045759',
        foamStrength: 0.1,
        turbulence: 0.25,
        clarity: 0.92,
      },
      topColorAt: (x, z, _h, _slope, out) => {
        if (Math.hypot(x + 0.45, z + 0.22) < 0.4) out.set('#6a913a');
        else out.set('#849442');
      },
    };
    maxTopY = 1.95;
    postDecorators.push(() => {
      // Hollow illuminated subterranean dolomite cavern ceiling & walls + stalactites + emerald cave pool glow
      const caveWallM = trackMat(
        new THREE.MeshStandardMaterial({ color: '#6b4e34', roughness: 0.92 })
      );
      const roofSlab = new THREE.Mesh(shared.boxGeo, caveWallM);
      roofSlab.scale.set(1.85, 0.14, 1.85);
      roofSlab.position.set(0.45, 0.96, 0.45);
      root.add(roofSlab);

      const backWallA = new THREE.Mesh(shared.boxGeo, caveWallM);
      backWallA.scale.set(0.16, 0.88, 1.85);
      backWallA.position.set(-0.36, 0.52, 0.48);
      const backWallB = new THREE.Mesh(shared.boxGeo, caveWallM);
      backWallB.scale.set(1.85, 0.88, 0.16);
      backWallB.position.set(0.48, 0.52, -0.36);
      root.add(backWallA, backWallB);

      // Dolomite stalactites & stalagmites + glowing lantern pillars
      const stalM = trackMat(new THREE.MeshStandardMaterial({ color: '#b59268', roughness: 0.82 }));
      const lanternM = trackGlowMat('#ffbe59', '#ff9924', 1.4);
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
        lantern.scale.setScalar(0.032);
        lantern.position.set(sx, 0.52, sz);
        root.add(stalag, stalac, lantern);
      });
      // Maropeng visitor entrance portal
      const portal = new THREE.Mesh(
        shared.boxGeo,
        trackMat(new THREE.MeshStandardMaterial({ color: '#d4cfc4', roughness: 0.75 }))
      );
      portal.scale.set(0.18, 0.1, 0.08);
      portal.position.set(-0.28, 1.38, 0.15);
      root.add(portal);
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
        if (h > 1.85) out.set('#8f8470');
        else if (slope > 0.36) out.set('#968872');
        else out.set('#466e2c');
      },
    };
    maxTopY = 2.4;
    postDecorators.push(() => {
      const stM = trackMat(new THREE.MeshStandardMaterial({ color: '#d8d0c2', roughness: 0.78 }));
      const station = new THREE.Mesh(shared.boxGeo, stM);
      station.scale.set(0.18, 0.08, 0.12);
      station.position.set(-0.42, 1.98, 0.36);
      root.add(station);
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
        [-0.65, -0.35, 0.22, 0.75],
        [0.0, -0.45, 0.25, 0.88],
        [0.65, -0.25, 0.2, 0.7],
      ].forEach(([rx, rz, rr, rh]) => {
        const y = hFn(rx, rz);
        const col = new THREE.Mesh(shared.cylinderGeo, rockM);
        col.scale.set(rr, rh, rr);
        col.position.set(rx, y + rh * 0.42, rz);
        col.castShadow = true;
        const cap = new THREE.Mesh(shared.coneGeo, capM);
        cap.scale.set(rr * 1.08, rh * 0.34, rr * 1.08);
        cap.position.set(rx, y + rh * 0.95, rz);
        root.add(col, cap);
      });
    });
  } else if (name === 'Gariep Dam') {
    const heightAt = (x: number, z: number) => {
      const gorge = Math.exp(-Math.pow(x * 1.75, 2));
      const reservoir = z < 0.08 ? 0.45 : 0;
      return 1.24 - gorge * (0.42 + reservoir) + fbm2(x * 2, z * 2) * 0.06;
    };
    terrainCfg = {
      strataTopColor: '#b38d62',
      strataBottomColor: '#5c4d3e',
      heightAt,
      waterLevel: 0.86,
      waterMask: (x, z, h) => z < 0.15 && Math.abs(x) < 1.15 && h < 0.86,
      waterPalette: riverWater,
      topColorAt: (_x, _z, h, slope, out) => {
        if (h < 0.87) out.set('#80796d');
        else if (slope > 0.35) out.set('#967c5c');
        else out.set('#9c9652');
      },
    };
    maxTopY = 1.75;
    postDecorators.push(() => {
      const damM = trackMat(new THREE.MeshStandardMaterial({ color: '#cfccc2', roughness: 0.72 }));
      for (let i = -4; i <= 4; i++) {
        const a = i * 0.16;
        const seg = new THREE.Mesh(shared.boxGeo, damM);
        seg.scale.set(0.24, 0.46, 0.12);
        seg.position.set(Math.sin(a) * 0.95, 0.92, 0.12 - Math.cos(a) * 0.18);
        seg.rotation.y = -a;
        seg.castShadow = true;
        root.add(seg);
      }
    });
  } else {
    // Mapungubwe Hill (ancient royal sandstone mesa + giant sculpted Baobab tree)
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
    maxTopY = 1.9;
    postDecorators.push((hFn) => {
      // Giant bottle-trunked ancient Baobab beside sandstone mesa
      const barkM = trackMat(new THREE.MeshStandardMaterial({ color: '#9c7d65', roughness: 0.92 }));
      const leafM = trackMat(new THREE.MeshStandardMaterial({ color: '#4c752b', roughness: 0.88 }));
      const bx = 0.72;
      const bz = 0.45;
      const by = hFn(bx, bz);
      const trunk = new THREE.Mesh(shared.cylinderGeo, barkM);
      trunk.scale.set(0.14, 0.46, 0.14);
      trunk.position.set(bx, by + 0.22, bz);
      trunk.castShadow = true;
      const crown = new THREE.Mesh(shared.foliageGeo, leafM);
      crown.scale.set(0.34, 0.14, 0.3);
      crown.position.set(bx, by + 0.48, bz);
      crown.castShadow = true;
      root.add(trunk, crown);

      // Tiny golden rhino plinth on summit
      const goldM = trackGlowMat('#ffd269', '#e8a82e', 0.45);
      const rhino = new THREE.Mesh(shared.boxGeo, goldM);
      rhino.scale.set(0.08, 0.05, 0.05);
      rhino.position.set(-0.15, hFn(-0.15, -0.12) + 0.04, -0.12);
      root.add(rhino);
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

  // Hovering stylized volumetric cloud cluster above the slice
  const cloudGroup = buildHoverClouds(shared, seed, maxTopY);
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
      side: THREE.DoubleSide,
      roughness: 0.35,
    })
  );
  const ringMesh = new THREE.Mesh(ringFrameGeo, ringMat);
  ringMesh.position.y = -0.02;
  ringMesh.visible = false;
  root.add(ringMesh);

  // Invisible bounding hit-box for fast, crisp raycast picking across all 24 islands
  const hitGeo = new THREE.BoxGeometry(3.1, 2.5, 3.1);
  localGeometries.push(hitGeo);
  const hitMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 1.15;
  hitBox.userData.landmarkIndex = spec.landmarkIndex;
  hitBox.userData.sliceIndex = seed;
  root.add(hitBox);

  const tick = (elapsed: number, litStrength: number) => {
    // Gentle hover drift for clouds above the slice
    for (let i = 0; i < cloudGroup.children.length; i++) {
      const c = cloudGroup.children[i];
      const phase = c.userData.phase as number;
      const wind = Math.max(0.4, WU.wind.value);
      c.position.x = (c.userData.baseX as number) + Math.sin(elapsed * 0.28 * wind + phase) * 0.14;
      c.position.y = (c.userData.baseY as number) + Math.cos(elapsed * 0.45 + phase) * 0.04;
    }
    for (const gm of glowMats) {
      gm.emissiveIntensity = 0.25 + litStrength * 1.45;
    }
    customTick?.(elapsed, litStrength);
  };

  return {
    spec,
    root,
    hitBox,
    ringMesh,
    cloudGroup,
    waterMats: builtTerrain.waterMats,
    glowMats,
    tick,
    dispose: () => {
      localGeometries.forEach((g) => g.dispose());
      localMaterials.forEach((m) => m.dispose());
    },
  };
}
