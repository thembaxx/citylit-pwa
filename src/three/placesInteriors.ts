import * as THREE from 'three';
import type { SliceSharedAssets } from './placesSliceBuilders';

/**
 * The generic Places cross-section exposes sculpted strata, but a few sites
 * need a modelled room to carry their story. These builders add small,
 * open-fronted "dollhouse" rooms on the slice surface: the front (+Z) and
 * right (+X) faces are omitted so the isometric camera reads straight into
 * them. Everything uses shared geometry and tracked materials, so the 24
 * slices still share one asset pool and one disposal path.
 */
export interface BespokeInteriorContext {
  root: THREE.Group;
  shared: SliceSharedAssets;
  /** Terrain height at a slice-local XZ, used to seat the room on the surface. */
  hFn: (x: number, z: number) => number;
  trackMat: <T extends THREE.Material>(m: T) => T;
  trackGlowMat: (
    color: string,
    emissive: string,
    intensity?: number
  ) => THREE.MeshStandardMaterial;
  localGeometries: THREE.BufferGeometry[];
  localMaterials: THREE.Material[];
  extraWaterMats: THREE.ShaderMaterial[];
  sliceTicks: Array<(elapsed: number, lit: number) => void>;
}

export type BespokeInteriorKind =
  | 'prisonCell'
  | 'manorRoom'
  | 'colonnade'
  | 'royalCompound';

type InteriorBuilder = (ctx: BespokeInteriorContext) => void;

function box(
  ctx: BespokeInteriorContext,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  ry = 0
): THREE.Mesh {
  const mesh = new THREE.Mesh(ctx.shared.boxGeo, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.rotation.y = ry;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  ctx.root.add(mesh);
  return mesh;
}

function standard(ctx: BespokeInteriorContext, color: string, roughness = 0.9) {
  return ctx.trackMat(new THREE.MeshStandardMaterial({ color, roughness }));
}

/**
 * Seat a room on uneven terrain: sample the footprint, add a stone plinth down
 * to the lowest corner, and draw all contents relative to the highest corner
 * so the floor never clips into the terrain.
 */
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
 * Room shell open towards the camera (+X / +Z): a thin floor and two back
 * walls, plus a narrow roof lip at the back for depth. The open faces are what
 * make the interior readable without needing a geological cutout.
 */
function openRoom(
  ctx: BespokeInteriorContext,
  wall: THREE.Material,
  floor: THREE.Material,
  trim: THREE.Material,
  opts: { height?: number; cx?: number } = {}
): void {
  const cx = opts.cx ?? 0.5;
  const top = opts.height ?? 0.82;
  box(ctx, floor, cx, 0.05, 0.5, 2.02, 0.1, 2.02);
  box(ctx, wall, -0.48, top * 0.5, 0.5, 0.12, top, 2.02);
  box(ctx, wall, 0.5, top * 0.5, -0.48, 2.02, top, 0.12);
  box(ctx, trim, -0.42, top + 0.03, 0.5, 0.24, 0.06, 2.1);
  box(ctx, trim, 0.5, top + 0.03, -0.42, 2.1, 0.06, 0.24);
}

/** Robben Island: a limestone cell block with barred cells and cots. */
function prisonCell(baseCtx: BespokeInteriorContext): void {
  onTerrain(baseCtx, '#9c9589', (ctx) => {
    const limestone = standard(ctx, '#b8aa8e');
    const floor = standard(ctx, '#6f685c');
    const iron = standard(ctx, '#3a3a3d', 0.55);
    const canvasMat = standard(ctx, '#a89a7d');
    const lamp = ctx.trackGlowMat('#ffe0a3', '#ffaf42', 0.9);

    openRoom(ctx, limestone, floor, limestone);

    // Three narrow cells divided by full-depth partitions, all facing +Z.
    for (const px of [-0.06, 0.56]) {
      box(ctx, limestone, px, 0.42, 0.04, 0.1, 0.68, 1.06);
    }
    for (let cell = 0; cell < 3; cell++) {
      const cx = -0.4 + cell * 0.62;
      for (let bar = 0; bar < 4; bar++) {
        box(ctx, iron, cx - 0.2 + bar * 0.13, 0.42, 0.62, 0.016, 0.7, 0.016);
      }
      box(ctx, iron, cx, 0.4, 0.62, 0.52, 0.025, 0.025);
      box(ctx, iron, cx, 0.72, 0.62, 0.52, 0.025, 0.025);
      box(ctx, canvasMat, cx, 0.19, 0.16, 0.36, 0.06, 0.54);
      box(ctx, limestone, cx, 0.13, -0.3, 0.34, 0.12, 0.22);
    }
    box(ctx, lamp, 1.02, 0.66, 1.02, 0.09, 0.13, 0.09);
    box(ctx, iron, 1.02, 0.76, 1.02, 0.02, 0.1, 0.02);
  });
}

/** Groot Constantia: a Cape Dutch manor room with fireplace and wine racks. */
function manorRoom(baseCtx: BespokeInteriorContext): void {
  onTerrain(baseCtx, '#7c7468', (ctx) => {
    const plaster = standard(ctx, '#efe6d2');
    const wood = standard(ctx, '#6b452c', 0.78);
    const darkWood = standard(ctx, '#3f2b1d', 0.72);
    const stone = standard(ctx, '#8d8579');
    const hearth = ctx.trackGlowMat('#ffca78', '#ff8c32', 0.95);
    const brass = ctx.trackGlowMat('#ffe6a8', '#d89a3c', 0.45);

    openRoom(ctx, plaster, wood, darkWood, { height: 0.94 });

    // Exposed ceiling beams and a yellow-wood floor border.
    for (let i = 0; i < 5; i++) {
      box(ctx, darkWood, -0.38 + i * 0.44, 0.84, 0.5, 0.07, 0.09, 1.85);
    }
    box(ctx, darkWood, 0.5, 0.13, 1.34, 1.85, 0.02, 0.08);

    // Fireplace on the back wall, with warm embers.
    box(ctx, stone, -0.3, 0.4, -0.32, 0.62, 0.62, 0.2);
    box(ctx, hearth, -0.3, 0.28, -0.19, 0.42, 0.3, 0.04);
    box(ctx, darkWood, -0.3, 0.64, -0.18, 0.72, 0.08, 0.26);

    // Dining table with turned legs and two chairs.
    box(ctx, darkWood, 0.56, 0.4, 0.5, 0.78, 0.05, 0.44);
    for (const ox of [0.26, 0.86]) {
      for (const oz of [0.34, 0.66]) {
        box(ctx, darkWood, ox, 0.24, oz, 0.05, 0.3, 0.05);
      }
    }
    for (const czx of [0.24, 0.88]) {
      box(ctx, wood, czx, 0.29, 1.06, 0.26, 0.05, 0.26);
      box(ctx, wood, czx, 0.45, 1.18, 0.26, 0.3, 0.05);
    }

    // Wine racks along the right-hand wall.
    for (let shelf = 0; shelf < 3; shelf++) {
      const y = 0.3 + shelf * 0.2;
      box(ctx, darkWood, 1.24, y, 0.1, 0.14, 0.03, 0.9);
      for (let bottle = 0; bottle < 4; bottle++) {
        const b = new THREE.Mesh(ctx.shared.cylinderGeo, darkWood);
        b.position.set(1.24, y + 0.08, -0.22 + bottle * 0.22);
        b.scale.set(0.045, 0.13, 0.045);
        ctx.root.add(b);
      }
    }
    box(ctx, brass, 0.5, 0.79, 1.38, 0.1, 0.1, 0.1);
  });
}

/** Union Buildings: the Baker colonnade and a domed deliberative chamber. */
function colonnade(baseCtx: BespokeInteriorContext): void {
  onTerrain(baseCtx, '#b8a68a', (ctx) => {
    const sandstone = standard(ctx, '#d8c3a0');
    const floor = standard(ctx, '#c8b797');
    const shade = standard(ctx, '#5c5142');
    const brass = ctx.trackGlowMat('#ffe9b0', '#d3a24a', 0.6);

    openRoom(ctx, sandstone, floor, sandstone, { height: 0.96 });

    // A rhythmic colonnade along the open front edge.
    for (let i = 0; i < 5; i++) {
      const x = -0.42 + i * 0.46;
      const col = new THREE.Mesh(ctx.shared.cylinderGeo, sandstone);
      col.position.set(x, 0.46, 1.12);
      col.scale.set(0.15, 0.74, 0.15);
      col.castShadow = true;
      ctx.root.add(col);
      box(ctx, sandstone, x, 0.85, 1.12, 0.22, 0.07, 0.22);
    }
    box(ctx, sandstone, 0.5, 0.94, 1.12, 2.05, 0.1, 0.28);

    // Domed chamber at the back with a curved bench.
    const dome = new THREE.Mesh(ctx.shared.sphereGeo, sandstone);
    dome.position.set(0.1, 0.89, -0.1);
    dome.scale.set(0.5, 0.26, 0.5);
    dome.castShadow = true;
    ctx.root.add(dome);
    const drum = new THREE.Mesh(ctx.shared.cylinderGeo, shade);
    drum.position.set(0.1, 0.5, -0.1);
    drum.scale.set(0.86, 0.58, 0.86);
    ctx.root.add(drum);
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      box(
        ctx,
        shade,
        0.1 + Math.sin(a) * 0.62,
        0.22,
        -0.1 + Math.cos(a) * 0.42,
        0.2,
        0.28,
        0.16,
        a
      );
    }
    box(ctx, brass, 0.1, 0.56, 0.28, 0.12, 0.12, 0.12);
  });
}

/** Mapungubwe Hill: the royal stone compound and its gilded rhino. */
function royalCompound(baseCtx: BespokeInteriorContext): void {
  onTerrain(baseCtx, '#8a6b4b', (ctx) => {
    const sandstone = standard(ctx, '#b98356');
    const floor = standard(ctx, '#8d7355');
    const thatch = standard(ctx, '#9c7a48');
    const dark = standard(ctx, '#5c432e');
    const gold = ctx.trackGlowMat('#ffdf86', '#f0a92c', 1.15);
    const ember = ctx.trackGlowMat('#ffc073', '#e06a1e', 0.85);

    openRoom(ctx, sandstone, floor, dark, { height: 0.9 });

    // Low stone enclosure walls inside the cut face.
    box(ctx, sandstone, -0.02, 0.28, 0.72, 0.12, 0.4, 0.9);
    box(ctx, sandstone, 0.72, 0.28, -0.02, 0.9, 0.4, 0.12);

    // Royal hut: cylindrical wall and a broad cone thatch roof.
    const hutWall = new THREE.Mesh(ctx.shared.cylinderGeo, sandstone);
    hutWall.position.set(0.3, 0.32, 0.34);
    hutWall.scale.set(0.6, 0.48, 0.6);
    hutWall.castShadow = true;
    const hutRoof = new THREE.Mesh(ctx.shared.coneGeo, thatch);
    hutRoof.position.set(0.3, 0.64, 0.34);
    hutRoof.scale.set(0.92, 0.4, 0.92);
    hutRoof.castShadow = true;
    ctx.root.add(hutWall, hutRoof);

    // Gilded rhino on a plinth, the hill's best-known find.
    box(ctx, dark, 1.02, 0.26, 1.0, 0.36, 0.28, 0.36);
    const rhino = new THREE.Mesh(ctx.shared.sphereGeo, gold);
    rhino.position.set(1.02, 0.48, 1.0);
    rhino.scale.set(0.22, 0.12, 0.3);
    ctx.root.add(rhino);
    box(ctx, gold, 1.02, 0.51, 1.16, 0.06, 0.08, 0.14);

    // Braziers flanking the entrance.
    for (const bx of [-0.2, 1.14]) {
      box(ctx, sandstone, bx, 0.22, 1.18, 0.16, 0.28, 0.16);
      box(ctx, ember, bx, 0.4, 1.18, 0.12, 0.08, 0.12);
    }
  });
}

export const BESPOKE_INTERIORS: Readonly<Record<BespokeInteriorKind, InteriorBuilder>> = {
  prisonCell,
  manorRoom,
  colonnade,
  royalCompound,
};
