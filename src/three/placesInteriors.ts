import * as THREE from 'three';
import type { SliceSharedAssets } from './placesSliceBuilders';

/**
 * Open-fronted "dollhouse" interiors for the Places archipelago. The front
 * (+Z) and right (+X) faces are omitted so the isometric camera reads into each
 * room. Every repeated part goes through `InteriorBatch`, which emits one
 * InstancedMesh per (shared geometry, material) pair, so a room carrying dozens
 * of bars, bottles, chairs or stalactites costs a handful of draw calls rather
 * than one per part. All geometry is shared and all materials are tracked, so
 * the slices keep one asset pool and one disposal path.
 */
export interface BespokeInteriorContext {
  root: THREE.Group;
  shared: SliceSharedAssets;
  /** Terrain height at a slice-local XZ, used to seat the room on the surface. */
  hFn: (x: number, z: number) => number;
  trackMat: <T extends THREE.Material>(m: T) => T;
  trackGlowMat: (color: string, emissive: string, intensity?: number) => THREE.MeshStandardMaterial;
  localGeometries: THREE.BufferGeometry[];
  localMaterials: THREE.Material[];
  extraWaterMats: THREE.ShaderMaterial[];
  sliceTicks: Array<(elapsed: number, lit: number) => void>;
}

export type BespokeInteriorKind =
  | 'prisonCell'
  | 'manorRoom'
  | 'colonnade'
  | 'royalCompound'
  | 'cableStation'
  | 'keeperRoom'
  | 'whaleLookout'
  | 'marinaOffice'
  | 'penguinCentre'
  | 'wildflowerHall'
  | 'canyonLookout'
  | 'mineOffice'
  | 'damControlRoom'
  | 'ridgeShelter'
  | 'waterPavilion'
  | 'fossilCavern'
  | 'townshipStoep'
  | 'bridgeLodge'
  | 'coastalRondavel'
  | 'borderPost'
  | 'amphitheatreShelter'
  | 'wetlandHide'
  | 'canyonRondavel'
  | 'rangerStation';

type InteriorBuilder = (ctx: BespokeInteriorContext) => void;

/* ------------------------------------------------------------------ *
 * Batched primitives
 * ------------------------------------------------------------------ */

interface Xf {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rx?: number;
  ry?: number;
  rz?: number;
}

type GeoKey = 'box' | 'cylinder' | 'sphere' | 'cone';

const scratch = new THREE.Object3D();

class InteriorBatch {
  private readonly buckets = new Map<
    string,
    { geo: THREE.BufferGeometry; mat: THREE.Material; xf: Xf[] }
  >();

  constructor(private readonly ctx: BespokeInteriorContext) {}

  private geometry(key: GeoKey): THREE.BufferGeometry {
    switch (key) {
      case 'cylinder':
        return this.ctx.shared.cylinderGeo;
      case 'sphere':
        return this.ctx.shared.sphereGeo;
      case 'cone':
        return this.ctx.shared.coneGeo;
      default:
        return this.ctx.shared.boxGeo;
    }
  }

  add(key: GeoKey, mat: THREE.Material, xf: Xf): void {
    const bucketKey = `${key}|${mat.id}`;
    let bucket = this.buckets.get(bucketKey);
    if (!bucket) {
      bucket = { geo: this.geometry(key), mat, xf: [] };
      this.buckets.set(bucketKey, bucket);
    }
    bucket.xf.push(xf);
  }

  flush(): void {
    this.buckets.forEach(({ geo, mat, xf }) => {
      const mesh = new THREE.InstancedMesh(geo, mat, xf.length);
      for (let i = 0; i < xf.length; i++) {
        const t = xf[i];
        scratch.position.set(t.x, t.y, t.z);
        scratch.rotation.set(t.rx ?? 0, t.ry ?? 0, t.rz ?? 0);
        scratch.scale.set(t.sx, t.sy, t.sz);
        scratch.updateMatrix();
        mesh.setMatrixAt(i, scratch.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.ctx.root.add(mesh);
    });
    this.buckets.clear();
  }
}

type Prim = (
  s: InteriorScope,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  rx?: number,
  ry?: number,
  rz?: number
) => void;

const bx: Prim = (s, m, x, y, z, sx, sy, sz, rx, ry, rz) =>
  s.batch.add('box', m, { x, y, z, sx, sy, sz, rx, ry, rz });
const cy: Prim = (s, m, x, y, z, sx, sy, sz, rx, ry, rz) =>
  s.batch.add('cylinder', m, { x, y, z, sx, sy, sz, rx, ry, rz });
const sp: Prim = (s, m, x, y, z, sx, sy, sz, rx, ry, rz) =>
  s.batch.add('sphere', m, { x, y, z, sx, sy, sz, rx, ry, rz });
const co: Prim = (s, m, x, y, z, sx, sy, sz, rx, ry, rz) =>
  s.batch.add('cone', m, { x, y, z, sx, sy, sz, rx, ry, rz });

function standard(ctx: BespokeInteriorContext, color: string, roughness = 0.9) {
  return ctx.trackMat(new THREE.MeshStandardMaterial({ color, roughness }));
}

/* ------------------------------------------------------------------ *
 * Terrain seating
 * ------------------------------------------------------------------ */

/** The original four full-size rooms are seated on a 2x2 centre footprint. */
function onTerrain(
  ctx: BespokeInteriorContext,
  plinthColor: string,
  build: (ctx: BespokeInteriorContext) => void
): void {
  const heights: number[] = [];
  for (const x of [-0.52, 0.5, 1.52]) {
    for (const z of [-0.52, 0.5, 1.52]) heights.push(ctx.hFn(x, z));
  }
  const maxH = Math.max(...heights);
  const minH = Math.min(...heights);
  const group = new THREE.Group();
  group.position.y = maxH + 0.015;
  ctx.root.add(group);

  const drop = maxH - minH + 0.16;
  const plinth = new THREE.Mesh(ctx.shared.boxGeo, standard(ctx, plinthColor));
  plinth.position.set(0.5, -drop * 0.5 + 0.015, 0.5);
  plinth.scale.set(2.18, drop, 2.18);
  plinth.receiveShadow = true;
  group.add(plinth);

  build({ ...ctx, root: group });
}

/**
 * Compact vignettes sit on a smaller footprint, positioned per site so they
 * do not bury a crater, dam wall or cavern that the slice already models.
 * Local coordinates are centred on the vignette.
 */
function onTerrainAt(
  ctx: BespokeInteriorContext,
  color: string,
  center: readonly [number, number],
  span: number,
  build: (ctx: BespokeInteriorContext) => void
): void {
  const [cx, cz] = center;
  const half = span * 0.5;
  // Sample the four footprint corners so a steep slice gets a stilted deck
  // rather than a full-depth block burying the terrain.
  const corners: Array<[number, number, number]> = [];
  for (const dx of [-half, half]) {
    for (const dz of [-half, half]) {
      corners.push([dx, dz, ctx.hFn(cx + dx, cz + dz)]);
    }
  }
  const maxH = Math.max(...corners.map((c) => c[2]));
  const group = new THREE.Group();
  group.position.set(cx, maxH + 0.015, cz);
  ctx.root.add(group);

  const mat = standard(ctx, color);
  const deck = new THREE.Mesh(ctx.shared.boxGeo, mat);
  deck.position.set(0, -0.06, 0);
  deck.scale.set(span + 0.14, 0.12, span + 0.14);
  deck.receiveShadow = true;
  group.add(deck);

  const legMat = standard(ctx, new THREE.Color(color).multiplyScalar(0.72).getStyle());
  for (const [dx, dz, h] of corners) {
    const bottom = h - (maxH + 0.015);
    const top = -0.12;
    const height = top - bottom;
    if (height <= 0.02) continue;
    const leg = new THREE.Mesh(ctx.shared.boxGeo, legMat);
    leg.position.set(dx * 0.88, top - height * 0.5, dz * 0.88);
    leg.scale.set(0.09, height, 0.09);
    leg.castShadow = true;
    group.add(leg);
  }

  build({ ...ctx, root: group });
}

/* ------------------------------------------------------------------ *
 * Original four bespoke rooms (now batched)
 * ------------------------------------------------------------------ */

/** Robben Island: a limestone cell block with barred cells and cots. */
function prisonCell(baseCtx: BespokeInteriorContext): void {
  onTerrain(baseCtx, '#9c9589', (ctx) => {
    const batch = new InteriorBatch(ctx);
    const scope: InteriorScope = { batch, mats: emptyMats(), span: 2.02, height: 0.82 };
    const limestone = standard(ctx, '#b8aa8e');
    const floor = standard(ctx, '#6f685c');
    const iron = standard(ctx, '#3a3a3d', 0.55);
    const canvasMat = standard(ctx, '#a89a7d');
    const lamp = ctx.trackGlowMat('#ffe0a3', '#ffaf42', 0.9);

    openRoom(scope, limestone, floor, limestone);

    // Three narrow cells divided by full-depth partitions, all facing +Z.
    for (const px of [-0.06, 0.56]) {
      bx(scope, limestone, px, 0.42, 0.04, 0.1, 0.68, 1.06);
    }
    for (let cell = 0; cell < 3; cell++) {
      const cx = -0.4 + cell * 0.62;
      for (let bar = 0; bar < 4; bar++) {
        bx(scope, iron, cx - 0.2 + bar * 0.13, 0.42, 0.62, 0.016, 0.7, 0.016);
      }
      bx(scope, iron, cx, 0.4, 0.62, 0.52, 0.025, 0.025);
      bx(scope, iron, cx, 0.72, 0.62, 0.52, 0.025, 0.025);
      bx(scope, canvasMat, cx, 0.19, 0.16, 0.36, 0.06, 0.54);
      bx(scope, limestone, cx, 0.13, -0.3, 0.34, 0.12, 0.22);
    }
    bx(scope, lamp, 1.02, 0.66, 1.02, 0.09, 0.13, 0.09);
    bx(scope, iron, 1.02, 0.76, 1.02, 0.02, 0.1, 0.02);
    batch.flush();
  });
}

/** Groot Constantia: a Cape Dutch manor room with fireplace and wine racks. */
function manorRoom(baseCtx: BespokeInteriorContext): void {
  onTerrain(baseCtx, '#7c7468', (ctx) => {
    const batch = new InteriorBatch(ctx);
    const scope: InteriorScope = { batch, mats: emptyMats(), span: 2.02, height: 0.94 };
    const plaster = standard(ctx, '#efe6d2');
    const wood = standard(ctx, '#6b452c', 0.78);
    const darkWood = standard(ctx, '#3f2b1d', 0.72);
    const stone = standard(ctx, '#8d8579');
    const hearth = ctx.trackGlowMat('#ffca78', '#ff8c32', 0.95);
    const brass = ctx.trackGlowMat('#ffe6a8', '#d89a3c', 0.45);

    openRoom(scope, plaster, wood, darkWood, 0.94);

    for (let i = 0; i < 5; i++) {
      bx(scope, darkWood, -0.38 + i * 0.44, 0.84, 0.5, 0.07, 0.09, 1.85);
    }
    bx(scope, darkWood, 0.5, 0.13, 1.34, 1.85, 0.02, 0.08);

    bx(scope, stone, -0.3, 0.4, -0.32, 0.62, 0.62, 0.2);
    bx(scope, hearth, -0.3, 0.28, -0.19, 0.42, 0.3, 0.04);
    bx(scope, darkWood, -0.3, 0.64, -0.18, 0.72, 0.08, 0.26);

    bx(scope, darkWood, 0.56, 0.4, 0.5, 0.78, 0.05, 0.44);
    for (const ox of [0.26, 0.86]) {
      for (const oz of [0.34, 0.66]) {
        bx(scope, darkWood, ox, 0.24, oz, 0.05, 0.3, 0.05);
      }
    }
    for (const czx of [0.24, 0.88]) {
      bx(scope, wood, czx, 0.29, 1.06, 0.26, 0.05, 0.26);
      bx(scope, wood, czx, 0.45, 1.18, 0.26, 0.3, 0.05);
    }

    for (let shelf = 0; shelf < 3; shelf++) {
      const y = 0.3 + shelf * 0.2;
      bx(scope, darkWood, 1.24, y, 0.1, 0.14, 0.03, 0.9);
      for (let bottle = 0; bottle < 4; bottle++) {
        cy(scope, darkWood, 1.24, y + 0.08, -0.22 + bottle * 0.22, 0.045, 0.13, 0.045);
      }
    }
    bx(scope, brass, 0.5, 0.79, 1.38, 0.1, 0.1, 0.1);
    batch.flush();
  });
}

/** Union Buildings: the Baker colonnade and a domed deliberative chamber. */
function colonnade(baseCtx: BespokeInteriorContext): void {
  onTerrain(baseCtx, '#b8a68a', (ctx) => {
    const batch = new InteriorBatch(ctx);
    const scope: InteriorScope = { batch, mats: emptyMats(), span: 2.02, height: 0.96 };
    const sandstone = standard(ctx, '#d8c3a0');
    const floor = standard(ctx, '#c8b797');
    const shade = standard(ctx, '#5c5142');
    const brass = ctx.trackGlowMat('#ffe9b0', '#d3a24a', 0.6);

    openRoom(scope, sandstone, floor, sandstone, 0.96);

    for (let i = 0; i < 5; i++) {
      const x = -0.42 + i * 0.46;
      cy(scope, sandstone, x, 0.46, 1.12, 0.15, 0.74, 0.15);
      bx(scope, sandstone, x, 0.85, 1.12, 0.22, 0.07, 0.22);
    }
    bx(scope, sandstone, 0.5, 0.94, 1.12, 2.05, 0.1, 0.28);

    sp(scope, sandstone, 0.1, 0.89, -0.1, 0.5, 0.26, 0.5);
    cy(scope, shade, 0.1, 0.5, -0.1, 0.86, 0.58, 0.86);
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      bx(
        scope,
        shade,
        0.1 + Math.sin(a) * 0.62,
        0.22,
        -0.1 + Math.cos(a) * 0.42,
        0.2,
        0.28,
        0.16,
        0,
        a
      );
    }
    bx(scope, brass, 0.1, 0.56, 0.28, 0.12, 0.12, 0.12);
    batch.flush();
  });
}

/** Mapungubwe Hill: the royal stone compound and its gilded rhino. */
function royalCompound(baseCtx: BespokeInteriorContext): void {
  onTerrain(baseCtx, '#8a6b4b', (ctx) => {
    const batch = new InteriorBatch(ctx);
    const scope: InteriorScope = { batch, mats: emptyMats(), span: 2.02, height: 0.9 };
    const sandstone = standard(ctx, '#b98356');
    const floor = standard(ctx, '#8d7355');
    const thatch = standard(ctx, '#9c7a48');
    const dark = standard(ctx, '#5c432e');
    const gold = ctx.trackGlowMat('#ffdf86', '#f0a92c', 1.15);
    const ember = ctx.trackGlowMat('#ffc073', '#e06a1e', 0.85);

    openRoom(scope, sandstone, floor, dark, 0.9);

    bx(scope, sandstone, -0.02, 0.28, 0.72, 0.12, 0.4, 0.9);
    bx(scope, sandstone, 0.72, 0.28, -0.02, 0.9, 0.4, 0.12);

    cy(scope, sandstone, 0.3, 0.32, 0.34, 0.6, 0.48, 0.6);
    co(scope, thatch, 0.3, 0.64, 0.34, 0.92, 0.4, 0.92);

    bx(scope, dark, 1.02, 0.26, 1.0, 0.36, 0.28, 0.36);
    sp(scope, gold, 1.02, 0.48, 1.0, 0.22, 0.12, 0.3);
    bx(scope, gold, 1.02, 0.51, 1.16, 0.06, 0.08, 0.14);

    for (const bxPos of [-0.2, 1.14]) {
      bx(scope, sandstone, bxPos, 0.22, 1.18, 0.16, 0.28, 0.16);
      bx(scope, ember, bxPos, 0.4, 1.18, 0.12, 0.08, 0.12);
    }
    batch.flush();
  });
}

/* ------------------------------------------------------------------ *
 * Shared room shell and detail vocabulary
 * ------------------------------------------------------------------ */

interface InteriorMats {
  wall: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glow: THREE.MeshStandardMaterial;
}

function emptyMats(): InteriorMats {
  // The four original rooms pass their own materials to `openRoom`; this is
  // only a type placeholder for their `InteriorScope`.
  return {} as InteriorMats;
}

interface InteriorScope {
  batch: InteriorBatch;
  mats: InteriorMats;
  span: number;
  height: number;
}

type RoofKind = 'none' | 'timber' | 'thatch' | 'corrugated' | 'tiles';

/** Room shell open towards +X / +Z, with an optional back-only roof treatment. */
function openRoom(
  s: InteriorScope,
  wall: THREE.Material,
  floor: THREE.Material,
  trim: THREE.Material,
  height = 0.82,
  cx = 0.5
): void {
  const top = height;
  bx(s, floor, cx, 0.05, 0.5, 2.02, 0.1, 2.02);
  bx(s, wall, -0.48, top * 0.5, 0.5, 0.12, top, 2.02);
  bx(s, wall, 0.5, top * 0.5, -0.48, 2.02, top, 0.12);
  bx(s, trim, -0.42, top + 0.03, 0.5, 0.24, 0.06, 2.1);
  bx(s, trim, 0.5, top + 0.03, -0.42, 2.1, 0.06, 0.24);
}

/** Compact shell centred on the vignette origin. */
function compactShell(s: InteriorScope, roof: RoofKind): void {
  const { span, height, mats } = s;
  const h = span * 0.5 - 0.04;
  const wallT = Math.max(0.05, span * 0.06);
  bx(s, mats.floor, 0, 0.05, 0, span, 0.1, span);
  bx(s, mats.wall, -h, height * 0.5, 0, wallT, height, span);
  bx(s, mats.wall, 0, height * 0.5, -h, span, height, wallT);
  bx(s, mats.trim, -h + wallT, height + 0.03, 0, 0.18, 0.05, span);
  bx(s, mats.trim, 0, height + 0.03, -h + wallT, span, 0.05, 0.18);

  if (roof === 'none') return;
  const beams = roof === 'thatch' ? 3 : 4;
  for (let i = 0; i < beams; i++) {
    const x = -h + 0.18 + (i * (span - 0.36)) / Math.max(1, beams - 1);
    bx(s, mats.dark, x, height + 0.055, -h * 0.42, 0.045, 0.05, span * 0.62);
  }
  // Eave across the back half keeps the roof legible without hiding the room.
  const eaveMat = roof === 'tiles' ? mats.accent : roof === 'corrugated' ? mats.dark : mats.trim;
  bx(s, eaveMat, 0, height + 0.095, -h * 0.62, span * 0.92, 0.035, span * 0.36);
  if (roof === 'thatch') {
    for (let i = 0; i < 5; i++) {
      const x = -h * 0.8 + (i * span * 1.6) / 4;
      co(s, mats.trim, x, height + 0.17, -h * 0.62, 0.18, 0.18, 0.18);
    }
  }
}

/* Detail passes — each only pushes transforms into the shared batch. */

function fShelves(s: InteriorScope, rows = 3, cols = 4): void {
  const z = -s.span * 0.5 + 0.13;
  for (let row = 0; row < rows; row++) {
    const y = 0.2 + row * 0.22;
    bx(s, s.mats.dark, 0, y, z, s.span * 0.7, 0.03, 0.16);
    for (let col = 0; col < cols; col++) {
      const x = -s.span * 0.3 + (col * s.span * 0.6) / Math.max(1, cols - 1);
      cy(s, s.mats.accent, x, y + 0.075, z, 0.035, 0.11, 0.035);
    }
  }
}

function fCrates(s: InteriorScope, count = 4): void {
  const positions: Array<[number, number]> = [
    [-0.3, 0.28],
    [0.24, 0.34],
    [-0.18, -0.06],
    [0.34, -0.12],
  ];
  for (let i = 0; i < Math.min(count, positions.length); i++) {
    const [x, z] = positions[i];
    const k = s.span / 2.02;
    bx(s, s.mats.dark, x * k, 0.16, z * k, 0.22 * k, 0.22, 0.2 * k);
    bx(s, s.mats.trim, x * k, 0.27, z * k, 0.23 * k, 0.02, 0.21 * k);
  }
}

function fBench(s: InteriorScope, count = 2): void {
  for (let i = 0; i < count; i++) {
    const x = -s.span * 0.22 + i * s.span * 0.42;
    const z = s.span * 0.26;
    bx(s, s.mats.dark, x, 0.2, z, 0.34, 0.05, 0.14);
    for (const ox of [-0.12, 0.12]) {
      bx(s, s.mats.dark, x + ox, 0.11, z, 0.035, 0.16, 0.12);
    }
  }
}

function fTable(s: InteriorScope, chairs = 2): void {
  const z = s.span * 0.05;
  bx(s, s.mats.dark, 0, 0.34, z, s.span * 0.44, 0.04, s.span * 0.26);
  for (const ox of [-0.16, 0.16]) {
    for (const oz of [-0.09, 0.09]) {
      bx(s, s.mats.dark, ox, 0.18, z + oz, 0.035, 0.28, 0.035);
    }
  }
  for (let i = 0; i < chairs; i++) {
    const x = -s.span * 0.18 + i * s.span * 0.36;
    bx(s, s.mats.accent, x, 0.2, z + s.span * 0.24, 0.18, 0.04, 0.16);
    bx(s, s.mats.accent, x, 0.32, z + s.span * 0.3, 0.18, 0.2, 0.03);
  }
}

function fRailing(s: InteriorScope): void {
  const h = s.span * 0.5 - 0.03;
  for (let i = 0; i < 5; i++) {
    const x = -h + 0.12 + (i * (s.span - 0.24)) / 4;
    cy(s, s.mats.dark, x, 0.24, h, 0.022, 0.36, 0.022);
    cy(s, s.mats.dark, h, 0.24, x, 0.022, 0.36, 0.022);
  }
  bx(s, s.mats.trim, 0, 0.42, h, s.span, 0.03, 0.03);
  bx(s, s.mats.trim, h, 0.42, 0, 0.03, 0.03, s.span);
}

function fTelescope(s: InteriorScope): void {
  const z = s.span * 0.14;
  cy(s, s.mats.dark, 0, 0.34, z, 0.03, 0.4, 0.03);
  for (const a of [-0.7, 0.7]) {
    cy(s, s.mats.dark, Math.sin(a) * 0.12, 0.16, z + Math.cos(a) * 0.12, 0.02, 0.3, 0.02, 0, 0, a);
  }
  cy(s, s.mats.accent, 0, 0.58, z, 0.06, 0.28, 0.06, Math.PI * 0.32);
  cy(s, s.mats.dark, 0, 0.58, z - 0.12, 0.028, 0.1, 0.028, Math.PI * 0.32);
}

function fMapBoard(s: InteriorScope): void {
  const z = -s.span * 0.5 + 0.1;
  bx(s, s.mats.dark, -s.span * 0.12, s.height * 0.58, z, s.span * 0.42, s.height * 0.4, 0.025);
  for (let i = 0; i < 3; i++) {
    bx(
      s,
      s.mats.glow,
      -s.span * 0.24 + i * s.span * 0.12,
      s.height * 0.5 + (i % 2) * 0.08,
      z + 0.02,
      0.025,
      0.025,
      0.008
    );
  }
}

function fLanterns(s: InteriorScope, count = 2): void {
  for (let i = 0; i < count; i++) {
    const x = -s.span * 0.28 + i * s.span * 0.56;
    const z = s.span * 0.34;
    cy(s, s.mats.dark, x, 0.3, z, 0.018, 0.5, 0.018);
    sp(s, s.mats.glow, x, 0.58, z, 0.055, 0.075, 0.055);
  }
}

function fFireplace(s: InteriorScope): void {
  const z = -s.span * 0.5 + 0.14;
  bx(s, s.mats.trim, -s.span * 0.2, 0.3, z, s.span * 0.32, 0.48, 0.13);
  bx(s, s.mats.glow, -s.span * 0.2, 0.2, z + 0.08, s.span * 0.2, 0.2, 0.02);
  bx(s, s.mats.dark, -s.span * 0.2, 0.56, z + 0.04, s.span * 0.38, 0.05, 0.16);
}

function fStalactites(s: InteriorScope, count = 7): void {
  for (let i = 0; i < count; i++) {
    const x = -s.span * 0.36 + ((i * 0.618) % 1) * s.span * 0.72;
    const z = -s.span * 0.32 + ((i * 0.381) % 1) * s.span * 0.62;
    const len = 0.1 + (i % 3) * 0.05;
    co(s, s.mats.trim, x, s.height - len * 0.5, z, 0.035, len, 0.035, 0, 0, Math.PI);
    sp(s, s.mats.dark, x, 0.13, z, 0.05, 0.07, 0.05);
  }
}

function fFossilPlinth(s: InteriorScope): void {
  bx(s, s.mats.dark, 0, 0.18, s.span * 0.12, s.span * 0.26, 0.26, s.span * 0.18);
  sp(s, s.mats.accent, 0, 0.38, s.span * 0.12, 0.2, 0.07, 0.09, 0, 0.18);
  bx(s, s.mats.trim, 0, 0.33, s.span * 0.22, 0.12, 0.05, 0.02);
}

function fSign(s: InteriorScope): void {
  const z = s.span * 0.34;
  for (const x of [-s.span * 0.16, s.span * 0.16]) {
    cy(s, s.mats.dark, x, 0.24, z, 0.02, 0.38, 0.02);
  }
  bx(s, s.mats.trim, 0, 0.4, z, s.span * 0.42, 0.16, 0.025);
  bx(s, s.mats.accent, 0, 0.4, z + 0.016, s.span * 0.3, 0.04, 0.006);
}

function fDrums(s: InteriorScope): void {
  for (let i = 0; i < 2; i++) {
    const x = -s.span * 0.18 + i * s.span * 0.36;
    cy(s, s.mats.dark, x, 0.3, -s.span * 0.16, 0.16, 0.16, 0.16, 0, 0, Math.PI * 0.5);
    bx(s, s.mats.accent, x, 0.16, -s.span * 0.16, 0.2, 0.12, 0.22);
  }
}

function fGauges(s: InteriorScope, count = 5): void {
  const z = -s.span * 0.5 + 0.1;
  bx(s, s.mats.dark, 0, s.height * 0.56, z, s.span * 0.66, s.height * 0.42, 0.03);
  for (let i = 0; i < count; i++) {
    const x = -s.span * 0.24 + (i * s.span * 0.48) / Math.max(1, count - 1);
    cy(s, s.mats.glow, x, s.height * 0.58, z + 0.025, 0.045, 0.01, 0.045, Math.PI * 0.5);
  }
}

function fSpecimens(s: InteriorScope): void {
  fShelves(s, 2, 5);
  for (let i = 0; i < 6; i++) {
    const x = -s.span * 0.3 + ((i * 0.618) % 1) * s.span * 0.6;
    const z = -s.span * 0.5 + 0.16;
    sp(s, i % 2 ? s.mats.accent : s.mats.glow, x, 0.38, z, 0.035, 0.05, 0.035);
  }
}

function fRadio(s: InteriorScope): void {
  bx(s, s.mats.dark, s.span * 0.22, 0.24, -s.span * 0.2, 0.24, 0.18, 0.16);
  cy(s, s.mats.dark, s.span * 0.22, 0.48, -s.span * 0.2, 0.008, 0.38, 0.008);
  for (let i = 0; i < 3; i++) {
    cy(
      s,
      s.mats.glow,
      s.span * 0.16 + i * 0.06,
      0.28,
      -s.span * 0.11,
      0.014,
      0.01,
      0.014,
      Math.PI * 0.5
    );
  }
}

function fOreCart(s: InteriorScope): void {
  bx(s, s.mats.dark, -s.span * 0.12, 0.22, s.span * 0.14, 0.32, 0.16, 0.24);
  for (const ox of [-0.1, 0.1]) {
    cy(
      s,
      s.mats.trim,
      -s.span * 0.12 + ox,
      0.12,
      s.span * 0.14,
      0.06,
      0.03,
      0.06,
      0,
      0,
      Math.PI * 0.5
    );
  }
  for (const oz of [-0.16, 0.16]) {
    bx(s, s.mats.accent, -s.span * 0.12, 0.05, s.span * 0.14 + oz, 0.42, 0.02, 0.02);
  }
}

function fCableCar(s: InteriorScope): void {
  cy(s, s.mats.accent, -s.span * 0.16, 0.38, s.span * 0.08, 0.12, 0.24, 0.12);
  bx(s, s.mats.dark, -s.span * 0.16, 0.54, s.span * 0.08, 0.1, 0.03, 0.1);
  cy(s, s.mats.dark, -s.span * 0.16, 0.7, s.span * 0.08, 0.012, 0.3, 0.012);
  bx(s, s.mats.trim, 0, s.height + 0.06, s.span * 0.08, s.span * 0.7, 0.02, 0.02);
}

function fLanternRoom(s: InteriorScope): void {
  sp(s, s.mats.glow, 0, s.height * 0.62, 0, 0.16, 0.2, 0.16);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    cy(
      s,
      s.mats.dark,
      Math.cos(a) * 0.2,
      s.height * 0.62,
      Math.sin(a) * 0.2,
      0.012,
      s.height * 0.6,
      0.012
    );
  }
  co(s, s.mats.trim, 0, s.height + 0.12, 0, 0.28, 0.2, 0.28);
}

function fReeds(s: InteriorScope, count = 8): void {
  for (let i = 0; i < count; i++) {
    const x = -s.span * 0.36 + ((i * 0.754) % 1) * s.span * 0.72;
    const z = s.span * 0.08 + ((i * 0.437) % 1) * s.span * 0.32;
    const h = 0.18 + (i % 3) * 0.07;
    cy(s, s.mats.accent, x, 0.1 + h * 0.5, z, 0.012, h, 0.012, 0, 0, (i % 2 ? 1 : -1) * 0.14);
  }
}

function fEquipmentRack(s: InteriorScope): void {
  const z = -s.span * 0.5 + 0.12;
  bx(s, s.mats.dark, s.span * 0.28, 0.34, z, 0.05, 0.6, s.span * 0.3);
  for (let i = 0; i < 3; i++) {
    cy(s, s.mats.accent, s.span * 0.26, 0.2 + i * 0.18, z, 0.02, 0.16, 0.02, Math.PI * 0.5);
  }
}

function fHearth(s: InteriorScope): void {
  sp(s, s.mats.dark, 0, 0.1, 0, 0.24, 0.1, 0.24);
  for (let i = 0; i < 3; i++) {
    sp(s, s.mats.glow, -0.08 + i * 0.08, 0.16, 0.02 + (i % 2) * 0.06, 0.045, 0.07, 0.045);
  }
}

/* ------------------------------------------------------------------ *
 * Themed vignette recipes
 * ------------------------------------------------------------------ */

interface InteriorPalette {
  plinth: string;
  wall: string;
  floor: string;
  trim: string;
  dark: string;
  accent: string;
  glowColor: string;
  glowEmissive: string;
  glowIntensity?: number;
}

type Feature = (s: InteriorScope) => void;

interface InteriorRecipe {
  /** Slice-local centre of the vignette. */
  center: readonly [number, number];
  span: number;
  height?: number;
  roof?: RoofKind;
  palette: InteriorPalette;
  features: readonly Feature[];
}

function buildThemedInterior(ctx: BespokeInteriorContext, recipe: InteriorRecipe): void {
  const p = recipe.palette;
  onTerrainAt(ctx, p.plinth, recipe.center, recipe.span, (localCtx) => {
    const mats: InteriorMats = {
      wall: standard(localCtx, p.wall),
      floor: standard(localCtx, p.floor),
      trim: standard(localCtx, p.trim),
      dark: standard(localCtx, p.dark, 0.72),
      accent: standard(localCtx, p.accent, 0.8),
      glow: localCtx.trackGlowMat(p.glowColor, p.glowEmissive, p.glowIntensity ?? 0.8),
    };
    const batch = new InteriorBatch(localCtx);
    const scope: InteriorScope = {
      batch,
      mats,
      span: recipe.span,
      height: recipe.height ?? Math.min(0.86, recipe.span * 0.56),
    };
    compactShell(scope, recipe.roof ?? 'timber');
    for (const feature of recipe.features) feature(scope);
    batch.flush();
  });
}

const THEMED_INTERIORS: Readonly<
  Record<
    Exclude<BespokeInteriorKind, 'prisonCell' | 'manorRoom' | 'colonnade' | 'royalCompound'>,
    InteriorRecipe
  >
> = {
  cableStation: {
    center: [0.9, 0.9],
    span: 1,
    height: 0.72,
    roof: 'corrugated',
    palette: {
      plinth: '#8d8375',
      wall: '#cfc8b8',
      floor: '#6b6d6d',
      trim: '#9aa1a4',
      dark: '#3e444b',
      accent: '#c44737',
      glowColor: '#ffe3a8',
      glowEmissive: '#ffb044',
    },
    features: [fCableCar, fDrums, fRailing, fMapBoard],
  },
  keeperRoom: {
    center: [-0.9, 0.9],
    span: 1,
    height: 0.76,
    roof: 'none',
    palette: {
      plinth: '#9a9184',
      wall: '#e2d5c0',
      floor: '#7a6a55',
      trim: '#b74135',
      dark: '#43474c',
      accent: '#d9cbb0',
      glowColor: '#fff0c0',
      glowEmissive: '#ffc45a',
      glowIntensity: 1.1,
    },
    features: [fLanternRoom, fMapBoard, fShelves],
  },
  whaleLookout: {
    center: [-0.85, 0.25],
    span: 1,
    height: 0.7,
    roof: 'timber',
    palette: {
      plinth: '#8d8779',
      wall: '#c9c1ad',
      floor: '#7b6a52',
      trim: '#9a8a6c',
      dark: '#43483f',
      accent: '#4f7f92',
      glowColor: '#ffe1a6',
      glowEmissive: '#ffae42',
    },
    features: [fTelescope, fMapBoard, fBench, fRailing],
  },
  marinaOffice: {
    center: [0.9, 0.9],
    span: 1,
    height: 0.74,
    roof: 'tiles',
    palette: {
      plinth: '#8b8375',
      wall: '#d6c9b2',
      floor: '#6c6254',
      trim: '#a49172',
      dark: '#454b4d',
      accent: '#3f8f9a',
      glowColor: '#ffe2a8',
      glowEmissive: '#ffae42',
    },
    features: [fSign, fShelves, fCrates, fTable],
  },
  penguinCentre: {
    center: [-0.9, 0.9],
    span: 1,
    height: 0.7,
    roof: 'timber',
    palette: {
      plinth: '#7f7a6d',
      wall: '#c7c3b4',
      floor: '#72695a',
      trim: '#9d9a8c',
      dark: '#3b3f42',
      accent: '#4b7f8c',
      glowColor: '#ffe4b0',
      glowEmissive: '#ffb049',
    },
    features: [fSign, fSpecimens, fBench, fCrates],
  },
  wildflowerHall: {
    center: [0.55, 0.9],
    span: 1,
    height: 0.74,
    roof: 'corrugated',
    palette: {
      plinth: '#9a8867',
      wall: '#d8c9a7',
      floor: '#85735a',
      trim: '#b09a70',
      dark: '#514636',
      accent: '#c07a35',
      glowColor: '#ffe6b0',
      glowEmissive: '#ffb64d',
    },
    features: [fSpecimens, fSign, fBench],
  },
  canyonLookout: {
    center: [0.9, 0.9],
    span: 1,
    height: 0.66,
    roof: 'none',
    palette: {
      plinth: '#9a6b4d',
      wall: '#c39a77',
      floor: '#7d5d45',
      trim: '#a87955',
      dark: '#4e3d31',
      accent: '#c9753e',
      glowColor: '#ffe1a4',
      glowEmissive: '#ffab3d',
    },
    features: [fRailing, fTelescope, fMapBoard],
  },
  mineOffice: {
    center: [-0.95, -0.95],
    span: 0.86,
    height: 0.72,
    roof: 'corrugated',
    palette: {
      plinth: '#8d7256',
      wall: '#c1b6a2',
      floor: '#6f6252',
      trim: '#9a7557',
      dark: '#3f4247',
      accent: '#b55635',
      glowColor: '#ffe0a0',
      glowEmissive: '#ffa838',
    },
    features: [fOreCart, fDrums, fSign, fCrates],
  },
  damControlRoom: {
    center: [0.9, 0.9],
    span: 1,
    height: 0.7,
    roof: 'none',
    palette: {
      plinth: '#8d836f',
      wall: '#cdd0c4',
      floor: '#6d736e',
      trim: '#a9b1ab',
      dark: '#3d464a',
      accent: '#4a8fa4',
      glowColor: '#dff2ff',
      glowEmissive: '#79c8e8',
      glowIntensity: 0.7,
    },
    features: [fGauges, fRadio, fTable, fRailing],
  },
  ridgeShelter: {
    center: [0.9, 0.9],
    span: 1,
    height: 0.66,
    roof: 'timber',
    palette: {
      plinth: '#a38556',
      wall: '#d5b57d',
      floor: '#8a6e4c',
      trim: '#b89460',
      dark: '#5a4632',
      accent: '#c58c46',
      glowColor: '#ffdaa0',
      glowEmissive: '#ff9c32',
    },
    features: [fFireplace, fBench, fSign, fCrates],
  },
  waterPavilion: {
    center: [-0.95, -0.85],
    span: 0.86,
    height: 0.8,
    roof: 'tiles',
    palette: {
      plinth: '#8a8d80',
      wall: '#c6d2c8',
      floor: '#6f8f86',
      trim: '#8fb6ad',
      dark: '#3f5b58',
      accent: '#3fa6a0',
      glowColor: '#ffecba',
      glowEmissive: '#ffc45c',
      glowIntensity: 0.7,
    },
    features: [fRailing, fLanterns, fTable, fShelves],
  },
  fossilCavern: {
    center: [-0.9, -0.9],
    span: 1,
    height: 0.78,
    roof: 'none',
    palette: {
      plinth: '#6b5842',
      wall: '#a5855f',
      floor: '#4a4037',
      trim: '#8d7251',
      dark: '#3e342b',
      accent: '#c0a173',
      glowColor: '#ffc978',
      glowEmissive: '#ff9b2e',
      glowIntensity: 1.0,
    },
    features: [fStalactites, fFossilPlinth, fLanterns],
  },
  townshipStoep: {
    center: [-0.85, 0.9],
    span: 1,
    height: 0.7,
    roof: 'corrugated',
    palette: {
      plinth: '#8b8174',
      wall: '#c9a68b',
      floor: '#6d6259',
      trim: '#b0603f',
      dark: '#464a4d',
      accent: '#4d86a0',
      glowColor: '#ffe1a4',
      glowEmissive: '#ffab3e',
    },
    features: [fBench, fCrates, fSign, fRadio],
  },
  bridgeLodge: {
    center: [0.82, 0.82],
    span: 1.1,
    height: 0.72,
    roof: 'timber',
    palette: {
      plinth: '#7c765f',
      wall: '#c3b597',
      floor: '#78654c',
      trim: '#9c7f57',
      dark: '#443c31',
      accent: '#5b8567',
      glowColor: '#ffe2a8',
      glowEmissive: '#ffae42',
    },
    features: [fTable, fBench, fMapBoard, fRailing],
  },
  coastalRondavel: {
    center: [0.4, 0.65],
    span: 1,
    height: 0.74,
    roof: 'thatch',
    palette: {
      plinth: '#8b7357',
      wall: '#c2a17c',
      floor: '#7a6249',
      trim: '#a98455',
      dark: '#4d3c2d',
      accent: '#b57342',
      glowColor: '#ffd596',
      glowEmissive: '#ff9328',
    },
    features: [fHearth, fBench, fCrates],
  },
  borderPost: {
    center: [0.9, 0.9],
    span: 1,
    height: 0.7,
    roof: 'corrugated',
    palette: {
      plinth: '#8d8270',
      wall: '#c8b99c',
      floor: '#6d6455',
      trim: '#a38960',
      dark: '#454a48',
      accent: '#b5613c',
      glowColor: '#ffe0a0',
      glowEmissive: '#ffa838',
    },
    features: [fSign, fGauges, fCrates, fRadio],
  },
  amphitheatreShelter: {
    center: [0.9, 0.9],
    span: 1,
    height: 0.66,
    roof: 'timber',
    palette: {
      plinth: '#8a7b6a',
      wall: '#b9ac96',
      floor: '#6e6559',
      trim: '#978672',
      dark: '#443f39',
      accent: '#a8764a',
      glowColor: '#ffdc9c',
      glowEmissive: '#ffa436',
    },
    features: [fFireplace, fBench, fMapBoard],
  },
  wetlandHide: {
    center: [-0.85, 0.85],
    span: 1,
    height: 0.66,
    roof: 'thatch',
    palette: {
      plinth: '#827a61',
      wall: '#bdb69a',
      floor: '#6c6a53',
      trim: '#9a956f',
      dark: '#40443a',
      accent: '#6d8b56',
      glowColor: '#ffe0a4',
      glowEmissive: '#ffac3e',
    },
    features: [fReeds, fBench, fSign, fRailing],
  },
  canyonRondavel: {
    center: [0.9, 0.45],
    span: 1,
    height: 0.74,
    roof: 'thatch',
    palette: {
      plinth: '#937358',
      wall: '#c9a078',
      floor: '#7c6147',
      trim: '#ac8354',
      dark: '#503b2b',
      accent: '#bd7643',
      glowColor: '#ffd596',
      glowEmissive: '#ff9328',
    },
    features: [fHearth, fBench, fSign],
  },
  rangerStation: {
    center: [0.9, -0.85],
    span: 1,
    height: 0.74,
    roof: 'corrugated',
    palette: {
      plinth: '#94836a',
      wall: '#cbbca0',
      floor: '#756550',
      trim: '#a2875d',
      dark: '#464338',
      accent: '#a8723c',
      glowColor: '#ffe2a8',
      glowEmissive: '#ffae42',
    },
    features: [fRadio, fMapBoard, fEquipmentRack, fTable],
  },
};

export const BESPOKE_INTERIORS: Readonly<Record<BespokeInteriorKind, InteriorBuilder>> = {
  prisonCell,
  manorRoom,
  colonnade,
  royalCompound,
  cableStation: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.cableStation),
  keeperRoom: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.keeperRoom),
  whaleLookout: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.whaleLookout),
  marinaOffice: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.marinaOffice),
  penguinCentre: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.penguinCentre),
  wildflowerHall: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.wildflowerHall),
  canyonLookout: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.canyonLookout),
  mineOffice: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.mineOffice),
  damControlRoom: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.damControlRoom),
  ridgeShelter: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.ridgeShelter),
  waterPavilion: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.waterPavilion),
  fossilCavern: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.fossilCavern),
  townshipStoep: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.townshipStoep),
  bridgeLodge: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.bridgeLodge),
  coastalRondavel: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.coastalRondavel),
  borderPost: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.borderPost),
  amphitheatreShelter: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.amphitheatreShelter),
  wetlandHide: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.wetlandHide),
  canyonRondavel: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.canyonRondavel),
  rangerStation: (ctx) => buildThemedInterior(ctx, THEMED_INTERIORS.rangerStation),
};
