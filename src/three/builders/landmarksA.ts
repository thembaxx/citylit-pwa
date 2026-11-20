import * as THREE from 'three';
import { getSoftTexture } from '../shaders';
import {
  add,
  B,
  bird,
  birds,
  boat,
  C,
  car,
  CB,
  colonialHouse,
  drift,
  G,
  gableRoofGeo,
  glowMaterials,
  gondola,
  grassTufts,
  instancedMeshes,
  lampPost,
  lines,
  litWindowMaterial,
  M,
  Mc,
  MCascade,
  mergeByMaterial,
  MPlaster,
  MStone,
  MT,
  MWater,
  MWet,
  MWood,
  n,
  R,
  railing,
  rock,
  rondavel,
  scatterRocks,
  sea,
  seaRings,
  swayItems,
  surfaceDetail,
  tint,
  train,
  tree,
  weatherVertexColors,
  type InstanceTransform,
} from './primitives';
import { corniceBand, doorSurround, facadeWindow } from './dioramaKit';

/** One deep Platteklip notch on the north-facing cliff, shared by cap and cliffs. */
const platteklip = (x: number, z: number): number => {
  if (z <= 0) return 0;
  const across = (x + 0.35) / 0.62;
  return Math.exp(-across * across) * Math.min(1, z / 1.2);
};

const warpTable = <T extends THREE.BufferGeometry>(geo: T, cap: boolean): T => {
  const p = geo.attributes.position;
  const a1 = new THREE.Color('#486836');
  const a2 = new THREE.Color('#c29c6e');
  const a3 = new THREE.Color('#7f834e');
  const aoDark = new THREE.Color('#2d3e23');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const gorge = platteklip(x, z);
    const ribs = 0.045 * Math.cos(a * 11) * Math.max(0, (y + 1.2) / 2.4);
    const f = 1 + 0.09 * n(a * 3, y * 2) + ribs - gorge * 0.32;
    if (cap) {
      // A single level plane: no height noise, no quantised colour steps.
      p.setXYZ(i, x * f, y, z * f);
    } else {
      const upper = Math.max(0, Math.min(1, (y + 1.2) / 2.4));
      const notch = gorge * 0.52 * upper * upper;
      p.setXYZ(i, x * f, y + 0.045 * n(x * 2, z * 2) - notch, z * f);
    }
  }
  tint(geo, (k, _x, y) => {
    if (cap) {
      k.copy(a3);
    } else {
      const t = Math.floor(((y + 1.2) / 2.4) * 10) / 10;
      k.copy(a1).lerp(a2, Math.min(1, Math.max(0, (t - 0.25) * 1.9)));
      const ao = Math.min(1, Math.max(0, (y + 1.2) / 0.65));
      k.lerp(aoDark, (1 - ao) * 0.45);
    }
  });
  return weatherVertexColors(geo, { ao: 0.28, exposure: 0.1, grain: 0.05, aoSpan: 2.4 });
};

const lump = (
  g: THREE.Group,
  r: number,
  x: number,
  z: number,
  sx: number,
  sy: number,
  c1: string,
  c2 = c1
) => {
  const s = new THREE.SphereGeometry(r, 48, 24);
  const p = s.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const f = 1 + 0.08 * n(p.getX(i) * 3, p.getZ(i) * 3);
    p.setXYZ(i, p.getX(i) * f * sx, p.getY(i) * f * sy, p.getZ(i) * f);
  }
  const ca = new THREE.Color(c1);
  const cb = new THREE.Color(c2);
  tint(s, (k, _X, Y) => k.copy(ca).lerp(cb, Math.min(1, Math.max(0, (Y + r) / (r * 2)))));
  weatherVertexColors(s, { ao: 0.24, exposure: 0.12, grain: 0.05, aoSpan: r * 2 });
  add(
    g,
    s,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      ...surfaceDetail('stone', 0.025),
    }),
    x,
    0.4,
    z
  );
};

export function table(): THREE.Group {
  const g = new THREE.Group();
  const vm = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.93,
    metalness: 0.02,
    ...surfaceDetail('stone', 0.03),
    side: THREE.DoubleSide,
  });
  add(g, C(6.2, 6.9, 0.5, 84), MStone('#436333', 0.95), 0, 0.25, 0);
  // One continuous cliff shell with a single deep notch; the cap is one flat plane.
  add(g, warpTable(C(3.6, 5.6, 2.4, 84, 14, true), false), vm, 0, 1.45, 0);
  add(
    g,
    warpTable(new THREE.CircleGeometry(3.6, 84).rotateX(-Math.PI / 2).translate(0, 1.2, 0), true),
    vm,
    0,
    1.45,
    0
  );
  // Lion's Head, Devil's Peak & Signal Hill flanks
  lump(g, 1.5, -4.9, 1.9, 1.0, 1.15, '#466136', '#7b8052');
  lump(g, 1.6, 4.6, 0.8, 1.3, 1.0, '#5a6e44', '#9c8a62');
  lump(g, 1.2, -1.5, -4.6, 1.4, 0.7, '#486237', '#6c774b');

  // Tablecloth pours over ONE windward (north) edge only; the south rim stays clear.
  const cmOuter = MT('#f4f8ff', 0.42, 0.98, 0, false);
  const cmInner = MT('#ffffff', 0.54, 0.98, 0, false);
  const cl: THREE.Mesh[] = [];
  for (let i = 0; i < 16; i++) {
    const x = -3.2 + i * 0.42;
    const z = Math.sqrt(Math.max(0.4, 12.4 - x * x)) * 0.79;
    const mat = i % 2 === 0 ? cmOuter : cmInner;
    const o = add(g, new THREE.IcosahedronGeometry(0.54, 2), mat, x, 2.76 + (i % 3) * 0.1, z);
    o.scale.set(1.2 + R(i) * 0.3, 0.58 + R(i + 2) * 0.25, 0.98);
    o.userData.x = x;
    cl.push(o);
  }
  [-2.1, -1.0, 0.1, 1.3, 2.2].forEach((x, idx) => {
    const o = add(g, new THREE.IcosahedronGeometry(0.5, 2), cmOuter, x, 2.32 - idx * 0.07, 3.5);
    o.scale.set(1.2, 0.95, 0.66);
    o.userData.x = x;
    cl.push(o);
  });

  // Batched fynbos bushes around lower slopes
  const fynbosTransforms: InstanceTransform[] = [];
  for (let i = 0; i < 85; i++) {
    const a = R(i) * 6.2832;
    const r = 5.75 + R(i + 99) * 0.58;
    fynbosTransforms.push({
      x: r * Math.cos(a),
      y: 0.5,
      z: r * Math.sin(a),
      ry: R(i + 12) * 6.28,
      sx: 0.35 + R(i + 5) * 0.35,
      sy: 0.25 + R(i + 7) * 0.25,
      sz: 0.35 + R(i + 9) * 0.35,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.45, 1), Mc('#4d6b34'), fynbosTransforms, [
    '#3d5a2e',
    '#6b7f3a',
    '#7e633e',
  ]);

  // Batched summit sandstone tors
  const torTransforms: InstanceTransform[] = [];
  for (let i = 0; i < 28; i++) {
    const a = R(i + 200) * 6.2832;
    const r = Math.sqrt(R(i + 300)) * 3.05;
    torTransforms.push({
      x: r * Math.cos(a),
      y: 2.68,
      z: r * Math.sin(a),
      ry: R(i + 31) * 6.28,
      sx: 0.35 + R(i) * 0.42,
      sy: 0.22 + R(i + 2) * 0.14,
      sz: 0.35 + R(i + 1) * 0.42,
    });
  }
  scatterRocks(g, torTransforms, '#8c7454', '#b89b72');

  // Maclear's Beacon: a tiny three-stone cairn at the eastern end of the plateau.
  const beaconStone = MStone('#9b9284', 0.94, 0.03);
  add(g, C(0.17, 0.21, 0.18, 8), beaconStone, 2.55, 2.74, -0.8);
  add(g, C(0.11, 0.15, 0.16, 8), beaconStone, 2.58, 2.9, -0.8);
  add(g, C(0.05, 0.09, 0.13, 8), beaconStone, 2.52, 3.04, -0.8);

  // Sculpted lower/upper cableway stations
  add(g, CB(0.76, 0.48, 0.64, 0.04), MPlaster('#d8d2c6', 0.72), 1.0, 0.78, 6.4);
  add(g, CB(0.84, 0.09, 0.72, 0.02), M('#4b5868', 0.45, 0.5), 1.0, 1.05, 6.4);
  add(g, CB(0.68, 0.42, 0.64, 0.04), MPlaster('#ded9ce', 0.72), 1.0, 2.85, 3.3);
  add(g, CB(0.76, 0.08, 0.72, 0.02), M('#4b5868', 0.45, 0.5), 1.0, 3.09, 3.3);
  g.add(lines([1, 1.1, 6.4, 1, 2.9, 3.4, 1.4, 1.1, 6.4, 1.4, 2.9, 3.4], '#28303b'));

  for (let i = 0; i < 8; i++) {
    const a = 3 + i * 0.2;
    lump(
      g,
      0.75 + R(i) * 0.3,
      6.4 * Math.cos(a),
      6.4 * Math.sin(a),
      1,
      1.2,
      i % 2 ? '#596d42' : '#73764f'
    );
  }
  // Sculpted sandstone cliff buttresses flanking Platteklip Gorge
  rock(g, 0.42, 0.95, 2.15, -0.42, 3.85, '#466136', '#c29c6e', 0.14, 0.35);
  rock(g, 0.38, 0.82, 2.0, 1.65, 3.72, '#4a6438', '#b89468', 0.12, 0.35);
  rock(g, 0.4, 0.88, 2.05, -2.05, 3.55, '#486237', '#b59065', 0.12, 0.35);

  const cab = gondola('#d33b2e');
  const cab2 = gondola('#2b6cd3');
  g.add(cab, cab2);
  [1.8, 2, 2.2, 2.4, -0.5, -0.8, -1.1].forEach((a, i) =>
    tree(g, 6.3 * Math.cos(a), 6.3 * Math.sin(a), 0.95 + R(i) * 0.45, i % 3 === 0 ? 4 : 1, 0.5)
  );
  const gls = [0, 1, 2, 3, 4].map(() => {
    const b = bird();
    g.add(b);
    return b;
  });
  const mistFlow = drift(
    g,
    55,
    '#eff6ff',
    0.16,
    (i, t) => {
      const u = (t * 0.22 + R(i * 5)) % 1;
      return [-2.6 + R(i * 3) * 5.2, 2.78 - u * 0.72 + Math.sin(t + i) * 0.06, 3.2 + u * 1.15];
    },
    0.45
  );

  g.userData.tick = (t: number) => {
    cl.forEach((c, i) => {
      const z0 = (c.userData.z0 ??= c.position.z) as number;
      c.position.x = (c.userData.x as number) + Math.sin(t * 0.4 + i) * 0.16;
      c.position.z = z0 + Math.sin(t * 0.3 + i * 1.3) * 0.14;
      const sy = (c.userData.sy ??= c.scale.y) as number;
      c.scale.y = sy * (1 + 0.14 * Math.sin(t * 0.6 + i));
    });
    const u = (Math.sin(t * 0.35) + 1) / 2;
    cab.position.set(1, 1.0 + 1.8 * u, 6.4 - 3 * u);
    cab2.position.set(1.4, 1.0 + 1.8 * (1 - u), 6.4 - 3 * (1 - u));
    cab.rotation.z = cab2.rotation.z = Math.sin(t * 1.7) * 0.06;
    gls.forEach((b, i) => {
      const a = t * 0.25 + i * 1.3;
      b.position.set(5 * Math.cos(a), 4.2 + Math.sin(t * 0.7 + i) * 0.3, 5 * Math.sin(a));
      b.rotation.y = -a;
      b.children.forEach((w) => {
        w.rotation.z = (w.userData.s as number) * Math.sin(t * 9 + i) * 0.6;
      });
    });
    mistFlow(t);
  };
  return g;
}

export function union(): THREE.Group {
  const g = new THREE.Group();
  const st = MStone('#d8b682', 0.85, 0.022);
  const dk = MStone('#b5905a', 0.88, 0.025);
  const rf = MPlaster('#a8543a', 0.78);
  const cu = M('#4f9e8c', 0.36, 0.68);
  const gr = M('#527a3f', 0.94);
  const plaza = MWet('#d6c5a3', 0.84, 0.16, 0.04, 'stone');
  const wn = G('#ffd58e', 1.1);
  dk.side = THREE.DoubleSide;

  // Meintjieskop hillside & stepped terraced lawns
  add(g, CB(12.6, 0.8, 5.4, 0.06), st, 0, 0.4, -2.5);
  (
    [
      [2.2, 0.2],
      [1.5, 0.4],
      [0.9, 0.6],
    ] as const
  ).forEach(([z, h]) => {
    add(g, CB(12.2, h, 1.0, 0.03), plaza, 0, h / 2, z);
    add(g, CB(11.6, 0.04, 0.7, 0.015), gr, 0, h + 0.015, z);
  });
  // Two lower lawn terraces stepping toward the forecourt, with stone copings.
  add(g, CB(12.0, 0.1, 0.9, 0.03), plaza, 0, 0.05, 2.95);
  add(g, CB(11.5, 0.04, 0.6, 0.015), gr, 0, 0.11, 2.95);
  add(g, CB(12.0, 0.08, 0.7, 0.03), plaza, 0, 0.04, 3.7);
  add(g, CB(11.5, 0.035, 0.5, 0.015), gr, 0, 0.09, 3.7);
  // Symmetric formal beds make the hillside gardens legible from above.
  [-1, 1].forEach((s) => {
    add(g, CB(2.6, 0.035, 0.5, 0.015), gr, s * 3.1, 0.14, 2.95);
    add(g, CB(2.6, 0.035, 0.4, 0.015), gr, s * 3.1, 0.115, 3.7);
  });
  const copingT: InstanceTransform[] = [];
  for (let i = -6; i <= 6; i++) copingT.push({ x: i * 0.85, y: 0.16, z: 2.45 });
  instancedMeshes(g, CB(0.12, 0.22, 0.12, 0.02), st, copingT);

  // Deeper semicircular Baker colonnade & vaulted loggia
  add(g, C(4.2, 4.2, 1.85, 64, 1, true, Math.PI / 2, Math.PI), dk, 0, 1.725, -1.2);
  const sh = new THREE.Shape();
  sh.absarc(0, 0, 4.38, 0, Math.PI, false);
  sh.absarc(0, 0, 3.4, Math.PI, 0, true);
  add(
    g,
    new THREE.ExtrudeGeometry(sh, {
      depth: 0.32,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
      curveSegments: 48,
    }).rotateX(-Math.PI / 2),
    st,
    0,
    2.65,
    -1.2
  );
  // Batched colonnade columns & illuminated arched windows
  const colTransforms: InstanceTransform[] = [];
  const winTransforms: InstanceTransform[] = [];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI;
    colTransforms.push({ x: 3.92 * Math.cos(a), y: 1.725, z: -1.2 - 3.92 * Math.sin(a) });
  }
  for (let i = 0; i < 18; i++) {
    const a = ((i + 0.5) / 18) * Math.PI;
    winTransforms.push({
      x: 4.15 * Math.cos(a),
      y: 1.6,
      z: -1.2 - 4.15 * Math.sin(a),
      ry: Math.atan2(-Math.cos(a), Math.sin(a)),
    });
  }
  instancedMeshes(g, C(0.085, 0.105, 1.85, 12), st, colTransforms);
  instancedMeshes(g, CB(0.28, 0.9, 0.06, 0.02), wn, winTransforms);

  // Inner arcade of columns with plinths and capitals behind the outer colonnade.
  const innerColT: InstanceTransform[] = [];
  const capitalT: InstanceTransform[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI;
    const x = 3.42 * Math.cos(a);
    const z = -1.2 - 3.42 * Math.sin(a);
    innerColT.push({ x, y: 1.725, z });
    capitalT.push({ x, y: 2.63, z });
  }
  instancedMeshes(g, C(0.06, 0.075, 1.85, 10), st, innerColT);
  instancedMeshes(g, CB(0.22, 0.06, 0.22, 0.015), dk, capitalT);

  // Central hall linking the two wings behind the deeper colonnade.
  add(g, CB(2.8, 1.7, 1.4, 0.04), st, 0, 1.65, -3.8);
  add(g, CB(3.0, 0.12, 1.6, 0.03), dk, 0, 2.56, -3.8);
  add(g, gableRoofGeo(3.0, 1.6, 0.38, 0.08), rf, 0, 2.62, -3.8);
  add(g, CB(0.34, 0.8, 0.05, 0.012), wn, 0, 1.3, -3.08);

  // Symmetrical East & West sandstone wings with pitched terracotta roofs + domed clock towers
  const fl = M('#dce0e4', 0.35, 0.65);
  const hd = M('#3c6838', 0.92);
  const sb = M('#e6dcc4', 0.82);
  const bz = M('#7c5e34', 0.38, 0.72);
  const flagMat = MT('#007749', 1, 0.6, 0, true);
  const flags: THREE.Mesh[] = [];
  const roofTileT: InstanceTransform[] = [];
  const wingWinT: InstanceTransform[] = [];
  const domeWinT: InstanceTransform[] = [];

  [-1, 1].forEach((s) => {
    add(g, CB(2.65, 2.0, 2.4, 0.04), st, s * 5.1, 1.8, -1.2);
    add(g, CB(2.86, 0.16, 2.6, 0.03), dk, s * 5.1, 2.86, -1.2);
    add(g, gableRoofGeo(2.58, 2.34, 0.52, 0.1), rf, s * 5.1, 2.92, -1.2);

    // Bell / clock tower
    add(g, CB(1.3, 3.6, 1.3, 0.04), st, s * 5.8, 2.6, -0.9);
    add(g, C(0.56, 0.66, 0.52, 24), st, s * 5.8, 4.65, -0.9);
    add(
      g,
      new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      cu,
      s * 5.8,
      4.9,
      -0.9
    );
    // Illuminated tower clock face
    add(g, C(0.24, 0.24, 0.05, 16).rotateX(Math.PI / 2), wn, s * 5.8, 3.85, -0.23);

    for (let j = 0; j < 3; j++) {
      for (let r = 0; r < 2; r++) {
        add(
          g,
          CB(0.35, 0.55, 0.06, 0.015),
          wn,
          s * 5.1 + (j - 1) * 0.75 - s * 0.2,
          1.4 + r * 0.9,
          0
        );
      }
    }
    // Portico pillars & Classical pediment
    for (let j = 0; j < 4; j++) {
      add(g, C(0.07, 0.08, 2.0, 12), st, s * 5.1 + (j - 1.5) * 0.75, 1.8, 0.2);
    }
    const p = add(g, new THREE.ConeGeometry(1.5, 0.6, 4), dk, s * 5.1, 3.2, 0.1);
    p.rotation.y = Math.PI / 4;
    p.scale.z = 0.25;

    // Ribbed terracotta roof tiling and a second storey of glowing windows.
    for (let j = -4; j <= 4; j++) {
      const dx = j * 0.3;
      roofTileT.push({
        x: s * 5.1 + dx,
        y: 2.94 + 0.52 * (1 - Math.abs(dx) / 1.39),
        z: -1.2,
      });
    }
    for (let j = 0; j < 3; j++) {
      wingWinT.push({ x: s * 5.1 + (j - 1) * 0.75 - s * 0.2, y: 2.55, z: 0 });
    }
    // Dome drum windows and a bronze finial on each clock tower.
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      domeWinT.push({
        x: s * 5.8 + 0.6 * Math.cos(a),
        y: 4.65,
        z: -0.9 + 0.6 * Math.sin(a),
        ry: -a + Math.PI / 2,
      });
    }
    // Atlas figure holding up a small world globe on each dome.
    add(g, C(0.08, 0.1, 0.26, 10), bz, s * 5.8, 5.9, -0.9);
    add(g, new THREE.SphereGeometry(0.1, 12, 8), bz, s * 5.8, 6.08, -0.9);
    add(g, new THREE.SphereGeometry(0.13, 16, 12), cu, s * 5.8, 6.24, -0.9);

    add(g, C(0.025, 0.03, 1.4, 8), fl, s * 5.8, 6.3, -1.3);
    const fMesh = add(
      g,
      new THREE.PlaneGeometry(0.45, 0.26, 10, 1),
      flagMat,
      s * 5.8 + 0.26,
      6.8,
      -1.3
    );
    flags.push(fMesh);
  });
  instancedMeshes(g, CB(0.05, 0.03, 2.5, 0.01), rf, roofTileT);
  instancedMeshes(g, CB(0.18, 0.3, 0.05, 0.012), wn, wingWinT);
  instancedMeshes(g, CB(0.09, 0.18, 0.04, 0.01), wn, domeWinT);

  // Recessed sandstone window reveals and string courses, merged into two draws.
  const unionFacade = new THREE.Group();
  [-1, 1].forEach((s) => {
    for (let j = 0; j < 3; j++) {
      for (let r = 0; r < 2; r++) {
        facadeWindow(unionFacade, {
          x: s * 5.1 + (j - 1) * 0.75 - s * 0.2,
          y: 1.4 + r * 0.9,
          z: 0.025,
          width: 0.44,
          height: 0.62,
          depth: 0.1,
          frame: '#d8b682',
          glass: '#2a2118',
        });
      }
    }
    corniceBand(unionFacade, {
      x: s * 5.1,
      y: 1.0,
      z: 0.02,
      width: 2.8,
      depth: 0.16,
      height: 0.1,
      color: '#b5905a',
    });
    corniceBand(unionFacade, {
      x: s * 5.1,
      y: 2.9,
      z: 0.02,
      width: 2.86,
      depth: 0.18,
      height: 0.12,
      color: '#b5905a',
    });
  });
  facadeWindow(unionFacade, {
    x: 0,
    y: 1.3,
    z: -3.06,
    width: 0.5,
    height: 0.9,
    depth: 0.1,
    frame: '#d8b682',
    glass: '#2a2118',
  });
  corniceBand(unionFacade, {
    x: 0,
    y: 2.5,
    z: -3.05,
    width: 3.0,
    depth: 0.18,
    height: 0.12,
    color: '#b5905a',
  });
  g.add(mergeByMaterial(unionFacade));

  // Batched garden hedges & balustrade posts
  const hedgeTransforms: InstanceTransform[] = [];
  for (let i = -4; i <= 4; i++) {
    hedgeTransforms.push({ x: i * 1.3, y: 0.53, z: 2.25 });
    hedgeTransforms.push({ x: i * 1.3 + 0.65, y: 0.73, z: 1.5 });
  }
  for (let i = -5; i <= 5; i++) {
    hedgeTransforms.push({ x: i * 1.25, y: 0.16, z: 3.25 });
    hedgeTransforms.push({ x: i * 1.25 + 0.6, y: 0.14, z: 3.75 });
  }
  instancedMeshes(g, new THREE.ConeGeometry(0.2, 0.65, 10), hd, hedgeTransforms);

  const postTransforms: InstanceTransform[] = [];
  for (let i = 0; i < 28; i++) postTransforms.push({ x: -5.9 + i * 0.44, y: 0.95, z: 0.15 });
  instancedMeshes(g, C(0.03, 0.03, 0.3, 6), st, postTransforms);
  add(g, CB(12.4, 0.06, 0.12, 0.02), st, 0, 1.12, 0.15);

  // Grand central stairways + Nelson Mandela bronze statue
  (
    [
      [2.2, 0.2],
      [1.5, 0.4],
      [0.9, 0.6],
    ] as const
  ).forEach(([z, h]) => add(g, CB(1.6, h + 0.03, 1, 0.02), sb, 0, (h + 0.03) / 2, z));
  add(g, CB(0.7, 0.5, 0.7, 0.03), st, 0, 1.05, -0.4);
  add(g, C(0.12, 0.16, 0.8, 12), bz, 0, 1.7, -0.4);
  add(g, new THREE.SphereGeometry(0.12, 16, 12), bz, 0, 2.2, -0.4);
  add(g, CB(1.3, 0.09, 0.09, 0.02), bz, 0, 2.0, -0.4);

  // Garden lamp posts + Jacaranda avenues
  for (const lx of [-3.4, -1.4, 1.4, 3.4]) lampPost(g, lx, 0.62, 0.9, 0.48);
  for (let i = 0; i < 12; i++) {
    tree(g, (i < 6 ? -1 : 1) * (3.6 + (i % 6) * 0.8), 3.2 + (i % 2) * 0.5, 1.15 + R(i) * 0.4, 0);
  }
  // Additional jacarandas framing the lower terraces.
  for (let i = 0; i < 6; i++) {
    tree(
      g,
      (i < 3 ? -1 : 1) * (2.4 + (i % 3) * 1.3),
      2.0 + (i % 2) * 0.7,
      0.9 + R(i + 40) * 0.25,
      0,
      0.1
    );
  }

  // Forecourt driveway with lane markings and tiny moving cars.
  add(g, CB(12.4, 0.06, 0.9, 0.02), plaza, 0, 0.04, 4.6);
  const laneT: InstanceTransform[] = [];
  for (let i = -7; i <= 7; i++) laneT.push({ x: i * 0.8, y: 0.08, z: 4.6 });
  instancedMeshes(g, CB(0.32, 0.012, 0.03, 0.006), M('#efe6d0', 0.85), laneT);
  const cars = ['#8d2f2b', '#e8e6df', '#2a6fd3', '#d8a53a'].map((col) => {
    const c = car(col, 0.26);
    g.add(c);
    return c;
  });

  const pet = drift(g, 70, '#b58be0', 0.07, (i, t) => {
    const u = ((R(i) * 3 + t * 0.3) % 3) / 3;
    return [
      (i % 2 ? -1 : 1) * (3.6 + R(i + 9) * 4.4) + Math.sin(t + i) * 0.3,
      2.3 * (1 - u) + 0.05,
      2.6 + R(i + 5) * 1.3 + Math.cos(t * 0.7 + i) * 0.2,
    ];
  });
  g.userData.tick = (t: number) => {
    pet(t);
    cars.forEach((c, i) => {
      const d = i % 2 ? 1 : -1;
      c.position.set(
        ((((t * 0.5 * d + i * 3.2) % 12.4) + 12.4) % 12.4) - 6.2,
        0.08,
        4.6 + (i % 2 ? 0.18 : -0.18)
      );
      c.rotation.y = d > 0 ? 0 : Math.PI;
    });
    flags.forEach((f, k) => {
      const p = f.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        p.setZ(i, Math.sin(x * 9 - t * 6 + k) * 0.05 * (x + 0.275) * 2);
      }
      p.needsUpdate = true;
    });
  };
  g.scale.setScalar(0.78);
  return g;
}

export function stadium(): THREE.Group {
  const g = new THREE.Group();
  const sh = MPlaster('#ebe7df', 0.55, 0.012, 0.08);
  const st = M('#f4f6f8', 0.28, 0.68);
  const gl = G('#8fd4ff', 1.4);
  sh.side = THREE.DoubleSide;
  // Keep the Y-arch dominant: the bowl and its hung roof sit well below it.
  const BOWL_SCALE = 0.82;
  const rimY = 2.4 * BOWL_SCALE;
  const bowl = new THREE.Group();
  bowl.scale.y = BOWL_SCALE;
  g.add(bowl);
  const pr = [
    [2.3, 0.15],
    [3.2, 1.3],
    [3.9, 2.1],
    [4.4, 2.35],
    [4.4, 1.2],
    [4.2, 0],
  ].map((p) => new THREE.Vector2(...p));
  add(bowl, new THREE.LatheGeometry(pr, 96), sh);
  add(bowl, new THREE.CircleGeometry(2.3, 64).rotateX(-Math.PI / 2), M('#3b8a47', 0.95), 0, 0.16, 0);
  add(bowl, new THREE.TorusGeometry(4.35, 0.1, 10, 128).rotateX(Math.PI / 2), gl, 0, 2.35, 0);
  add(bowl, new THREE.TorusGeometry(4.4, 0.05, 8, 128).rotateX(Math.PI / 2), gl, 0, 1.3, 0);

  // Split Y-arch ribs
  const H = 7.2;
  const yFn = (x: number) => Math.max(0.1, H * (1 - (x / 5.6) ** 2));
  const dzFn = (x: number, s: number) =>
    s * (x < -1.5 ? Math.min(1.5, (-1.5 - x) * 0.5) + 0.2 : 0.2);

  [-1, 1].forEach((s) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -5.6 + i * 0.28;
      pts.push(new THREE.Vector3(x, yFn(x), dzFn(x, s)));
    }
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.13, 10), st);
  });
  // Arch cross-bracing and a dense fan of steel stays down to the hung roof.
  const v: number[] = [];
  for (let x = -3.6; x <= 3.7; x += 0.32) {
    const zo = Math.sqrt(4.45 * 4.45 - x * x);
    [-1, 1].forEach((s) => v.push(x, yFn(x), 0, x, rimY, s * zo));
    if (Math.abs(x) < 3.28) {
      const zi = Math.sqrt(3.3 * 3.3 - x * x);
      [-1, 1].forEach((s) => v.push(x, yFn(x), 0, x, 2.15 * BOWL_SCALE, s * zi));
    }
    v.push(x, yFn(x), dzFn(x, -1), x, yFn(x), dzFn(x, 1));
  }
  g.add(lines(v, '#dfe6ee'));
  (
    [
      [0.25, 0.7, 2.378, 2.73, '#2b67b0'],
      [0.8, 1.2, 2.81, 3.12, '#e6e8ec'],
      [1.4, 2, 3.288, 3.81, '#2b67b0'],
    ] as const
  ).forEach(([a, b, r1, r2, c]) => {
    const m = M(c, 0.8);
    m.side = THREE.DoubleSide;
    add(g, C(r2 - 0.03, r1 - 0.03, b - a, 80, 1, true), m, 0, (a + b) / 2, 0);
  });

  // Batched perimeter facade louvers (48 -> 1 draw call!)
  const finTransforms: InstanceTransform[] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * 6.2832;
    finTransforms.push({ x: 4.38 * Math.cos(a), y: 1.18, z: 4.38 * Math.sin(a), ry: -a });
  }
  instancedMeshes(bowl, CB(0.08, 2.35, 0.16, 0.02), M('#cfd5dc', 0.38, 0.65), finTransforms);

  const fm = M('#cfd5dc', 0.38, 0.65);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5708 + 0.785;
    const x = 4.6 * Math.cos(a);
    const z = 4.6 * Math.sin(a);
    add(g, C(0.03, 0.05, 3.2, 8), fm, x, 3.2, z);
    add(g, CB(0.5, 0.3, 0.1, 0.02), gl, x, 4.9, z).lookAt(0, 2, 0);
  }
  bowl.add(
    lines(
      [
        -1.5, 0.18, -1, 1.5, 0.18, -1, 1.5, 0.18, -1, 1.5, 0.18, 1, 1.5, 0.18, 1, -1.5, 0.18, 1,
        -1.5, 0.18, 1, -1.5, 0.18, -1, 0, 0.18, -1, 0, 0.18, 1,
      ],
      '#ffffff'
    )
  );
  add(bowl, new THREE.RingGeometry(0.3, 0.33, 48).rotateX(-Math.PI / 2), M('#fff', 0.9), 0, 0.18, 0);

  // Low translucent PTFE/glass roof hung from the arch on the stays above.
  const rm = MT('#f4f7fa', 0.72, 0.55, 0.05, true);
  add(
    bowl,
    new THREE.LatheGeometry([new THREE.Vector2(3.3, 2.15), new THREE.Vector2(4.45, 2.4)], 84),
    rm
  );
  const tv: number[] = [];
  const av: number[] = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * 6.2832;
    const c = Math.cos(a);
    const s = Math.sin(a);
    tv.push(3.3 * c, 2.15, 3.3 * s, 4.45 * c, 2.4, 4.45 * s);
    av.push(2.4 * c, 0.22, 2.4 * s, 3.75 * c, 1.95, 3.75 * s);
  }
  bowl.add(lines(tv, '#aab4c0'));
  bowl.add(lines(av, '#8794a6'));

  // Wettable Durban coastal concourse apron
  add(g, C(5.65, 5.85, 0.12, 84), MWet('#beb8ac', 0.84, 0.18, 0.05, 'stone'), 0, 0.06, 0);
  [-1, 1].forEach((s) =>
    add(g, CB(0.65, 0.5, 0.65, 0.04), MStone('#9e9d98', 0.88), -5.6, 0.25, s * 1.7)
  );
  add(g, CB(0.75, 0.5, 0.95, 0.04), MStone('#9e9d98', 0.88), 5.6, 0.25, 0);
  for (let i = 0; i < 5; i++)
    add(g, B(0.3, 0.01, 2.1), M(i % 2 ? '#4d9d58' : '#3a8446', 0.95), -1.2 + i * 0.6, 0.17, 0);
  const sk = gondola('#d33b2e');
  g.add(sk);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.2832 + 0.2;
    tree(g, 6.9 * Math.cos(a), 6.9 * Math.sin(a), 0.95 + R(i) * 0.25, i % 2 ? 3 : 1);
  }
  g.userData.tick = (t: number) => {
    const x = -5.2 + 10.4 * (Math.sin(t * 0.25) * 0.5 + 0.5);
    sk.position.set(x, yFn(x) - 0.1, 0);
    sk.rotation.z = Math.cos(t * 0.25) * 0.12;
    gl.color.setHSL((t * 0.04) % 1, 0.55, 0.6);
    gl.emissive.copy(gl.color);
  };
  g.scale.setScalar(0.95);
  return g;
}

export function bridge(): THREE.Group {
  const g = new THREE.Group();
  const wh = M('#f0f2f4', 0.32, 0.45);
  const dk = MStone('#31353e', 0.82, 0.018);
  const roadMat = MWet('#2a2d35', 0.82, 0.14, 0.05, 'plaster');
  const bd = G('#ffd79a', 1.15);
  const v: number[] = [];

  // Thin wettable deck carried high over the rail yard.
  add(g, CB(15, 0.14, 1.6, 0.03), roadMat, 0, 1.7, 0);
  [-7.4, 7.4].forEach((x) => add(g, CB(1.25, 1.7, 1.82, 0.05), dk, x, 0.85, 0));

  // Deliberately unequal pylons: 42 m north against a much shorter 27 m south.
  (
    [
      [-2.3, 7.2, 8.9],
      [2.5, 4.8, 6.5],
    ] as const
  ).forEach(([mx, ph, topY]) => {
    [-0.9, 0.9].forEach((mz) => {
      add(g, C(0.07, 0.15, ph, 12), wh, mx, 1.7 + ph / 2, mz);
      add(g, new THREE.SphereGeometry(0.08, 12, 8), G('#ff3b3b', 2.1), mx, topY, mz);
      for (let i = -6; i <= 6; i++) {
        if (!i) continue;
        v.push(mx, topY - 0.15 - Math.abs(i) * 0.26, mz, mx + i * 0.55, 1.82, mz);
      }
    });
    // Cross-portal H-beam trusses
    add(g, CB(0.24, 0.2, 1.85, 0.02), wh, mx, topY - 0.8, 0);
    add(g, CB(0.22, 0.18, 1.85, 0.02), wh, mx, topY - 2.4, 0);
  });
  g.add(lines(v, '#e8eef5'));

  // A few thin rail lines under the span keep the clearance legible.
  const railTransforms: InstanceTransform[] = [];
  for (let k = 0; k < 8; k++) railTransforms.push({ x: 0, y: 0.05, z: -3.2 + k * 0.9 });
  instancedMeshes(g, CB(18, 0.04, 0.055, 0.008), M('#777', 0.4, 0.8), railTransforms);

  const trn = (
    [
      [-4, -1.2, '#b5532f'],
      [3, 1.8, '#3d6fa8'],
      [-0.5, -2.4, '#c8a53a'],
    ] as const
  ).map(([x, z, c], i) => {
    const m = train(c);
    m.position.set(x, 0.075, z);
    m.rotation.y = i % 2 ? Math.PI : 0;
    m.userData.x0 = x;
    g.add(m);
    return m;
  });

  // Braamfontein skyline + Hillbrow Tower + Sentech Tower
  add(g, C(0.8, 0.8, 5.6, 32), bd, -5.5, 2.8, -4);
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 128;
  const cx = cv.getContext('2d')!;
  cx.fillStyle = '#2a2d35';
  cx.fillRect(0, 0, 64, 128);
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 8; c++) {
      cx.fillStyle = R(r * 8 + c + 3) > 0.45 ? '#ffd98a' : '#3a3f4a';
      cx.fillRect(c * 8 + 1, r * 8 + 1, 5, 5);
    }
  }
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  const wt = new THREE.MeshStandardMaterial({
    map: tx,
    emissive: '#ffffff',
    emissiveMap: tx,
    emissiveIntensity: 0.08,
    roughness: 0.65,
  });
  wt.userData.i = 0.55;
  glowMaterials.push(wt);
  for (let i = 0; i < 16; i++) {
    const k = (i * 37) % 7;
    const h = 1.1 + k * 0.55;
    add(g, CB(0.9, h, 0.9, 0.03), wt, -7.4 + i * 0.98, h / 2, -5.8 + (i % 3) * 0.55);
  }

  // Street markings + batched streetlight poles & warm bulbs
  const yl = M('#e8c84a', 0.6);
  const dashT: InstanceTransform[] = [];
  for (let i = 0; i < 20; i++) dashT.push({ x: -7 + i * 0.75, y: 1.79, z: 0 });
  instancedMeshes(g, B(0.4, 0.01, 0.05), yl, dashT);

  const poleT: InstanceTransform[] = [];
  const bulbT: InstanceTransform[] = [];
  [-0.8, 0.8].forEach((z) => {
    add(g, CB(15, 0.1, 0.05, 0.015), wh, 0, 1.82, z);
    for (let i = 0; i < 9; i++) {
      const x = -6.6 + i * 1.65;
      poleT.push({ x, y: 2.05, z });
      bulbT.push({ x, y: 2.35, z });
    }
  });
  instancedMeshes(g, C(0.015, 0.02, 0.55, 6), dk, poleT);
  instancedMeshes(g, new THREE.SphereGeometry(0.05, 8, 8), bd, bulbT);

  const cars = [0, 1, 2, 3].map((i) => {
    const c = car(['#c33', '#fff', '#36c', '#fc3'][i], 0.5);
    c.position.set(0, 1.82, i % 2 ? 0.35 : -0.35);
    c.rotation.y = i % 2 ? 0 : Math.PI;
    g.add(c);
    return c;
  });
  const ringT: InstanceTransform[] = [];
  for (let k = 0; k < 14; k++) ringT.push({ x: -5.5, y: 0.4 + k * 0.38, z: -4 });
  instancedMeshes(g, new THREE.TorusGeometry(0.81, 0.02, 6, 32).rotateX(Math.PI / 2), dk, ringT);

  add(g, C(0.08, 0.15, 7, 12), wh, 6.5, 3.5, -4.6);
  add(g, C(0.36, 0.42, 0.35, 16), bd, 6.5, 6, -4.6);
  add(g, C(0.03, 0.03, 1.2, 6), wh, 6.5, 7.4, -4.6);
  for (let i = 0; i < 9; i++)
    tree(g, -6.5 + i * 1.65, 3.7 + (i % 2) * 0.4, 0.8 + R(i) * 0.3, i % 2 ? 0 : 2);
  g.userData.tick = (t: number) => {
    cars.forEach((c, i) => {
      c.position.x = ((((t * (0.9 + i * 0.15) * (i % 2 ? 1 : -1) + i * 3.7) % 14) + 14) % 14) - 7;
    });
    trn.forEach((m, i) => {
      m.position.x =
        ((((t * (0.6 + i * 0.25) * (i % 2 ? -1 : 1) + (m.userData.x0 as number)) % 16) + 16) % 16) -
        8;
    });
  };
  g.scale.setScalar(0.92);
  return g;
}

export function hole(): THREE.Group {
  const g = new THREE.Group();
  // Broad flat rim, then steep benched kimberlite walls down to a dark pool.
  const pts = [
    new THREE.Vector2(0.01, -3.4),
    new THREE.Vector2(8.2, -3.4),
    new THREE.Vector2(8.2, 0),
    new THREE.Vector2(6.0, 0),
  ];
  let r = 6.0;
  let y = 0;
  for (let i = 0; i < 8; i++) {
    y -= 0.42;
    pts.push(new THREE.Vector2(r - 0.1, y));
    r -= 0.3;
    pts.push(new THREE.Vector2(r, y));
  }
  pts.push(new THREE.Vector2(0.01, y));
  const geo = new THREE.LatheGeometry(pts, 112);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const yy = p.getY(i);
    const z = p.getZ(i);
    if (yy < -0.01 && yy > -3.3 && Math.hypot(x, z) < 6.05) {
      const f = 1 + 0.04 * n(Math.atan2(z, x) * 2, yy * 1.5);
      p.setXYZ(i, x * f, yy, z * f);
    }
  }
  const s = new THREE.Color('#d0ae78');
  const a = new THREE.Color('#b97a42');
  const b = new THREE.Color('#241f1c');
  tint(geo, (k, _x, yy, z) => {
    if (yy < -3.28) return k.copy(b);
    if (yy > -0.01) return k.copy(s);
    const ang = Math.atan2(z, _x);
    const band = Math.floor(-yy * 6);
    const strata = 0.82 + 0.2 * (0.5 + 0.5 * Math.sin(band * 1.9 + 0.6));
    const groove = Math.pow(Math.max(0, Math.cos(ang * 18)), 8);
    return k
      .copy(a)
      .lerp(b, Math.min(1, -yy / 3.2))
      .multiplyScalar(strata * (1 - groove * 0.22));
  });
  const vm = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.032),
    side: THREE.DoubleSide,
  });
  add(g, geo, vm);
  // Raised rim lip makes the void read from a shallow camera angle.
  add(
    g,
    new THREE.TorusGeometry(6.02, 0.07, 8, 128).rotateX(Math.PI / 2),
    MStone('#c9ab78', 0.92, 0.03),
    0,
    0.07,
    0
  );
  // Still, nearly black water at the bottom of the pipe.
  add(
    g,
    new THREE.CircleGeometry(3.4, 64).rotateX(-Math.PI / 2),
    MWater('#102d34', 0.04, 0.14),
    0,
    -3.26,
    0
  );

  // Structural steel Kimberley headgear frame + ore bucket
  const rs = M('#7c3b27', 0.45, 0.65);
  [
    [6, 0.16],
    [6.6, -0.16],
  ].forEach(([x, rz]) => {
    const l = add(g, CB(0.18, 3.6, 0.18, 0.02), rs, x, 1.8, -1.4);
    l.rotation.z = rz;
  });
  // Angled backstay brace
  add(g, CB(0.14, 4.1, 0.14, 0.02), rs, 7.1, 1.75, -1.4).rotation.z = 0.48;
  [0.8, 1.6, 2.4].forEach((h) => add(g, CB(0.7, 0.08, 0.08, 0.015), rs, 6.3, h, -1.4));
  const wl = new THREE.Group();
  wl.position.set(6.3, 3.6, -1.4);
  g.add(wl);
  add(wl, new THREE.TorusGeometry(0.38, 0.05, 8, 24), rs);
  add(wl, CB(0.76, 0.04, 0.04, 0.01), rs);
  add(wl, CB(0.04, 0.76, 0.04, 0.01), rs);

  // Viewing platform & glass balustrade just outside the widened rim.
  add(g, CB(1.85, 0.12, 2.2, 0.02), M('#525862', 0.45, 0.6), 0, 0.1, 6.25);
  add(g, CB(1.85, 0.9, 0.05, 0.01), MT('#b8e6f0', 0.34, 0.08, 0.2, true), 0, 0.58, 5.2);
  const fm = M('#444950', 0.45, 0.7);
  const postT: InstanceTransform[] = [];
  for (let i = 0; i < 44; i++) {
    const ang = (i / 44) * 6.2832;
    postT.push({ x: 6.35 * Math.cos(ang), y: 0.27, z: 6.35 * Math.sin(ang) });
  }
  instancedMeshes(g, C(0.02, 0.02, 0.55, 6), fm, postT);
  add(g, new THREE.TorusGeometry(6.35, 0.015, 6, 128).rotateX(Math.PI / 2), fm, 0, 0.5, 0);
  g.add(lines([6.3, 3.6, -1.4, 2.2, -2.0, -0.6], '#222'));
  const bk = add(g, CB(0.3, 0.25, 0.3, 0.03), rs, 2.2, -2.0, -0.6);

  // Batched Karoo scrub bushes & tailings spoil heaps
  const scrubT: InstanceTransform[] = [];
  for (let i = 0; i < 34; i++) {
    const ang = R(i) * 6.2832;
    const rad = 6 + R(i + 50) * 1.4;
    scrubT.push({
      x: rad * Math.cos(ang),
      y: 0.1,
      z: rad * Math.sin(ang),
      sx: 0.5 + R(i) * 0.7,
      sy: 0.35 + R(i + 3) * 0.45,
      sz: 0.5 + R(i + 7) * 0.7,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.28, 1), Mc('#6b6e3e'), scrubT, [
    '#7a6a40',
    '#5c6e3a',
    '#8c7248',
  ]);

  (
    [
      [-7.4, -3.4, '#6b7f8c'],
      [-6.2, -5.2, '#7a8c97'],
      [6.6, 4.6, '#6b7f8c'],
    ] as const
  ).forEach(([x, z, c]) =>
    add(g, new THREE.ConeGeometry(0.8, 0.55, 16), MStone(c, 0.94), x, 0.27, z)
  );
  for (let i = 0; i < 7; i++) {
    const q = 0.1 + i * 0.14;
    add(
      g,
      new THREE.ConeGeometry(0.28, 0.5, 4),
      MPlaster(i % 2 ? '#e8dcc0' : '#c9b48a', 0.88),
      6.4 * Math.cos(q),
      0.25,
      6.4 * Math.sin(q)
    ).rotation.y = 0.785;
  }
  // Historic pitched-roof Kimberley mine museum hall
  colonialHouse(g, {
    x: -2.5,
    y: 0,
    z: 6.45,
    w: 1.3,
    h: 0.48,
    d: 0.84,
    wall: '#ebe4d3',
    roof: '#7c3b27',
  });

  const dN = 90;
  const dA: number[] = [];
  const dB: number[] = [];
  const dU: number[] = [];
  const dp = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) {
    dA.push(R(i + 400) * 6.2832);
    dB.push(R(i + 500) * 3.2);
    dU.push(Math.sqrt(R(i + 600)));
  }
  const dg = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const pt = new THREE.Points(
    dg,
    new THREE.PointsMaterial({
      color: '#ecc99a',
      size: 0.08,
      map: getSoftTexture(),
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    })
  );
  pt.frustumCulled = false;
  g.add(pt);
  const upd = (t: number) => {
    for (let i = 0; i < dN; i++) {
      const yy = -3.2 + ((dB[i] + t * 0.15) % 3.2);
      const rr = dU[i] * (1.4 + (yy + 3.2) * 1.05);
      dp[i * 3] = rr * Math.cos(dA[i]);
      dp[i * 3 + 1] = yy;
      dp[i * 3 + 2] = rr * Math.sin(dA[i]);
    }
    dg.attributes.position.needsUpdate = true;
  };
  upd(0);
  for (let i = 0; i < 6; i++) {
    const q = 4.3 + i * 0.35;
    tree(g, 6.8 * Math.cos(q), 6.8 * Math.sin(q), 0.9 + R(i) * 0.3, 2);
  }
  const rp = [0, 1, 2].map(() =>
    add(
      g,
      new THREE.RingGeometry(0.9, 0.96, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: '#bff',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
      0,
      -3.22,
      0
    )
  );
  g.position.y = 3.2;
  const w = new THREE.Group();
  w.add(g);
  w.userData.tick = (t: number) => {
    upd(t);
    const u = (Math.sin(t * 0.4) + 1) / 2;
    bk.position.set(2.2 + 4.1 * u, -2.0 + 5.1 * u, -0.6 - 0.8 * u);
    wl.rotation.z = -u * 12;
    rp.forEach((ring, i) => {
      const k = (t * 0.25 + i / 3) % 1;
      ring.scale.setScalar(0.4 + k * 1.4);
      ring.material.opacity = 0.5 * (1 - k);
    });
  };
  return w;
}

export function voortrekker(): THREE.Group {
  const g = new THREE.Group();
  const gr = MStone('#c6b698', 0.82, 0.022);
  const dk = MStone('#9c8a6c', 0.88, 0.025);
  const plaza = MWet('#b5a486', 0.86, 0.18, 0.04, 'stone');
  const bz = M('#6b5a3a', 0.42, 0.72);
  const gl = G('#ffcf8a', 1.25);

  add(g, C(7.55, 7.55, 0.16, 84), plaza, 0, 0.08, 0);
  (
    [
      [7.4, 0.3],
      [6.6, 0.3],
      [5.8, 0.3],
    ] as const
  ).forEach(([w, h], i) => add(g, CB(w, h, w, 0.04), dk, 0, 0.15 + i * 0.3, 0));

  // Chamfered 40m granite cube + Hall of Heroes frieze + recessed vertical lancets
  add(g, CB(4.2, 3.8, 4.2, 0.08), gr, 0, 2.8, 0);
  add(g, CB(4.56, 0.28, 4.56, 0.04), dk, 0, 4.82, 0);
  add(g, CB(3.4, 0.6, 4.32, 0.03), dk, 0, 3.5, 0);
  add(g, CB(1.0, 1.6, 0.06, 0.02), gl, 0, 1.7, 2.12);
  // Side lancet windows
  for (const s of [-1, 1]) {
    add(g, CB(0.06, 1.8, 0.42, 0.015), gl, s * 2.12, 2.5, 0);
  }
  // Granite reveals turn the glowing slits into recessed lancet windows.
  const monumentFacade = new THREE.Group();
  facadeWindow(monumentFacade, {
    x: 0,
    y: 1.7,
    z: 2.14,
    width: 0.55,
    height: 1.5,
    depth: 0.12,
    frame: '#c6b698',
    glass: '#2c2418',
  });
  for (const s of [-1, 1]) {
    facadeWindow(monumentFacade, {
      x: s * 2.14,
      y: 2.5,
      z: 0,
      width: 0.5,
      height: 1.6,
      depth: 0.12,
      frame: '#c6b698',
      glass: '#2c2418',
      rotationY: s * (Math.PI / 2),
    });
    facadeWindow(monumentFacade, {
      x: s * 1.2,
      y: 2.5,
      z: 2.14,
      width: 0.42,
      height: 0.7,
      depth: 0.1,
      frame: '#c6b698',
      glass: '#2c2418',
    });
  }
  corniceBand(monumentFacade, {
    x: 0,
    y: 4.65,
    z: 2.14,
    width: 4.3,
    depth: 0.16,
    height: 0.12,
    color: '#9c8a6c',
  });
  g.add(mergeByMaterial(monumentFacade));
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([x, z]) => {
    add(g, CB(0.74, 3.55, 0.74, 0.05), gr, x * 2.35, 2.65, z * 2.35);
    add(g, C(0.12, 0.16, 0.6, 8), bz, x * 2.35, 4.7, z * 2.35);
    add(g, new THREE.SphereGeometry(0.13, 10, 8), bz, x * 2.35, 5.1, z * 2.35);
  });
  // Shallow granite dome with a dark oculus looking down to the cenotaph.
  add(g, C(1.8, 1.94, 0.78, 48), gr, 0, 5.34, 0);
  const dome = add(
    g,
    new THREE.SphereGeometry(1.8, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    dk,
    0,
    5.73,
    0
  );
  dome.scale.y = 0.52;
  add(g, new THREE.TorusGeometry(0.36, 0.08, 10, 32).rotateX(-Math.PI / 2), dk, 0, 6.66, 0);
  add(
    g,
    new THREE.CircleGeometry(0.3, 32).rotateX(-Math.PI / 2),
    M('#17140f', 0.92),
    0,
    6.65,
    0
  );

  // Anton van Wouw bronze mother-and-child pedestal
  add(g, CB(0.55, 0.6, 0.55, 0.03), dk, 0, 0.9, 3.4);
  add(g, C(0.1, 0.14, 0.8, 8), bz, 0, 1.6, 3.4);
  add(g, new THREE.SphereGeometry(0.12, 10, 8), bz, 0, 2.1, 3.4);

  // Ring of small wagon wedges: the laager reads as a toothed circle from above.
  const wagonT: InstanceTransform[] = [];
  const noseT: InstanceTransform[] = [];
  const tiltT: InstanceTransform[] = [];
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * 6.2832;
    if (Math.abs(a - 1.5708) < 0.2) continue;
    const x = 6.5 * Math.cos(a);
    const z = 6.5 * Math.sin(a);
    wagonT.push({ x, y: 0.3, z, ry: -a });
    noseT.push({ x: 6.88 * Math.cos(a), y: 0.3, z: 6.88 * Math.sin(a), ry: -a });
    tiltT.push({ x, y: 0.53, z, ry: -a });
  }
  instancedMeshes(g, CB(0.66, 0.32, 0.26, 0.03), dk, wagonT);
  instancedMeshes(g, new THREE.ConeGeometry(0.19, 0.4, 4).rotateZ(-Math.PI / 2), dk, noseT);
  instancedMeshes(g, C(0.11, 0.11, 0.56, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), gr, tiltT);

  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.4;
    tree(g, 7.1 * Math.cos(a), 7.1 * Math.sin(a), 0.82, 2);
  }
  const mo = drift(g, 45, '#ffd88a', 0.06, (i, t) => [
    Math.cos(i * 2.4 + t * 0.1) * (2 + R(i) * 4),
    0.5 + ((R(i + 3) * 4 + t * 0.2) % 4),
    Math.sin(i * 2.4 + t * 0.1) * (2 + R(i) * 4),
  ]);
  g.userData.tick = (t: number) => {
    mo(t);
    gl.color.setHSL(0.1, 0.9, 0.5 + 0.1 * Math.sin(t * 2));
    gl.emissive.copy(gl.color);
  };
  return g;
}

export function capePoint(): THREE.Group {
  const g = new THREE.Group();
  const wh = MPlaster('#f4f2ec', 0.62);
  const dk = M('#2b2d34', 0.45, 0.65);
  const lt = G('#fff3b0', 2.6);
  sea(g, '#165b7d', '#2ca1b5');
  // Two distinct sandstone humps: the high old-light peak and a lower shoulder.
  rock(g, 1.55, 3.3, 3.8, -1.6, -0.2, '#6f5b44', '#b49a70', 0.14);
  rock(g, 1.15, 2.0, 2.2, 1.9, 0.7, '#77624a', '#ac916c', 0.14);
  rock(g, 1.2, 2.3, 1.5, 0.3, 0.2, '#6b5a43', '#9d8765', 0.13);
  [
    [3.4, 2.2, 0.8],
    [-3.6, -2, 0.7],
    [2.4, -3.4, 0.6],
  ].forEach(([x, z, r], i) =>
    rock(g, r * 0.7, r * 1.3, 1.2 + i * 0.3, x, z, '#645440', '#968260', 0.13)
  );
  // Extra buttresses and a skirt of weathered scree at the cliff foot.
  rock(g, 0.7, 1.3, 2.4, 2.0, -1.5, '#6f5b44', '#a98f68', 0.16);
  rock(g, 0.6, 1.15, 2.0, -2.4, 2.3, '#6f5b44', '#a98f68', 0.16);
  rock(g, 0.9, 1.5, 1.5, 4.7, -1.9, '#645440', '#968260', 0.14);
  const screeT: InstanceTransform[] = [];
  for (let i = 0; i < 26; i++) {
    const a = R(i + 70) * 6.28;
    const r = 3.6 + R(i + 90) * 1.9;
    screeT.push({
      x: -0.4 + r * Math.cos(a),
      y: 0.24,
      z: 0.2 + r * Math.sin(a),
      sx: 0.3 + R(i) * 0.35,
      sy: 0.22 + R(i + 3) * 0.22,
      sz: 0.3 + R(i + 6) * 0.35,
    });
  }
  scatterRocks(g, screeT, '#746554', '#9c8b70');
  // Separate fynbos caps make the two-summit profile legible from any angle.
  add(g, C(1.15, 1.2, 0.1, 48), MStone('#5c7036', 0.95), -1.6, 3.84, -0.2);
  add(g, C(0.92, 0.98, 0.09, 40), MStone('#5f7639', 0.95), 1.9, 2.24, 0.7);

  // Batched Cape fynbos cushions on both shoulders — scrub only, no trees.
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 26; i++) {
    const high = i < 17;
    const a = R(i) * 6.28;
    const r = R(i + 3) * (high ? 0.95 : 0.72);
    bushT.push({
      x: (high ? -1.6 : 1.9) + r * Math.cos(a),
      y: high ? 3.94 : 2.34,
      z: (high ? -0.2 : 0.7) + r * Math.sin(a),
      sx: 0.7 + R(i + 20) * 0.5,
      sy: 0.45 + R(i + 25) * 0.3,
      sz: 0.7 + R(i + 28) * 0.5,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.18, 1), Mc('#567438'), bushT, [
    '#4d6e35',
    '#6c7e3b',
    '#826840',
  ]);

  // Old whitewashed light on the high peak, keeper hut alongside it.
  add(g, C(0.28, 0.4, 1.5, 24), wh, -1.6, 4.65, -0.2);
  add(g, C(0.46, 0.46, 0.1, 24), dk, -1.6, 5.45, -0.2);
  add(g, C(0.22, 0.22, 0.3, 16), lt, -1.6, 5.65, -0.2);
  add(g, new THREE.ConeGeometry(0.32, 0.28, 16), dk, -1.6, 5.95, -0.2);
  colonialHouse(g, {
    x: -1.6,
    y: 3.88,
    z: -1.05,
    w: 0.75,
    h: 0.34,
    d: 0.48,
    wall: '#f2efe6',
    roof: '#464d56',
  });

  // The working (1919) light is deliberately lower, on the second shoulder.
  const ltNew = G('#fff0a8', 2.3);
  add(g, C(0.18, 0.26, 0.66, 20), wh, 1.9, 2.62, 0.7);
  add(g, C(0.3, 0.3, 0.06, 20), dk, 1.9, 2.99, 0.7);
  add(g, C(0.13, 0.13, 0.2, 16), ltNew, 1.9, 3.12, 0.7);
  add(g, new THREE.ConeGeometry(0.19, 0.16, 16), dk, 1.9, 3.3, 0.7);

  // Winding switchback road snaking up the cliff face to the lighthouse.
  const roadPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 72; i++) {
    const u = i / 72;
    const a = 0.4 + u * Math.PI * 3.1;
    const rad = 3.9 - u * 2.7;
    roadPts.push(
      new THREE.Vector3(-1.6 + rad * Math.cos(a), 0.3 + u * 3.54, -0.2 + rad * Math.sin(a))
    );
  }
  const roadCurve = new THREE.CatmullRomCurve3(roadPts);
  add(g, new THREE.TubeGeometry(roadCurve, 200, 0.16, 6), MStone('#a49b88', 0.95));
  const dashT: InstanceTransform[] = [];
  for (let i = 1; i < 48; i++) {
    const u = i / 48;
    const p = roadCurve.getPointAt(u);
    const tg = roadCurve.getTangentAt(u);
    dashT.push({ x: p.x, y: p.y + 0.15, z: p.z, ry: Math.atan2(-tg.z, tg.x) });
  }
  instancedMeshes(g, CB(0.18, 0.02, 0.04, 0.01), M('#e8e0cc', 0.85), dashT);
  const roadCars = ['#c33', '#e8c84a', '#f4f2ec'].map((col, i) => {
    const c = car(col, i === 1 ? 0.32 : 0.26);
    g.add(c);
    return c;
  });

  // Thin funicular from the low car park to just below the old lighthouse.
  add(g, C(0.85, 0.95, 0.06, 28), MStone('#8f8878', 0.96), 3.9, 0.3, -2.6);
  const funicularCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.9, 0.38, -2.6),
    new THREE.Vector3(2.4, 1.5, -1.8),
    new THREE.Vector3(0.5, 2.7, -0.9),
    new THREE.Vector3(-1.4, 3.55, -0.2),
  ]);
  const railVerts: number[] = [];
  let prevLeft: THREE.Vector3 | null = null;
  let prevRight: THREE.Vector3 | null = null;
  for (let i = 0; i <= 32; i++) {
    const u = i / 32;
    const p = funicularCurve.getPointAt(u);
    const tg = funicularCurve.getTangentAt(u);
    const perp = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(0.09);
    const left = p.clone().add(perp);
    const right = p.clone().sub(perp);
    if (prevLeft && prevRight) {
      railVerts.push(prevLeft.x, prevLeft.y, prevLeft.z, left.x, left.y, left.z);
      railVerts.push(prevRight.x, prevRight.y, prevRight.z, right.x, right.y, right.z);
      if (i % 4 === 0) railVerts.push(left.x, left.y, left.z, right.x, right.y, right.z);
    }
    prevLeft = left;
    prevRight = right;
  }
  g.add(lines(railVerts, '#4b4f56'));
  const funicularCar = add(g, CB(0.24, 0.16, 0.18, 0.02), M('#e8e0cc', 0.7), 3.9, 0.55, -2.6);

  // Sandy cove with turquoise shallows and drifting surf rings.
  const beachX = 4.6;
  const beachZ = 4.0;
  add(g, C(1.45, 1.55, 0.07, 48), MStone('#e6d4a8', 0.96), beachX, 0.13, beachZ);
  add(g, C(0.95, 1.0, 0.03, 40), MStone('#f0e2bd', 0.96), beachX, 0.18, beachZ);
  add(
    g,
    new THREE.RingGeometry(1.5, 1.85, 48).rotateX(-Math.PI / 2),
    MWater('#3bb6bf', 0.08, 0.22),
    beachX,
    0.12,
    beachZ
  );
  const surf = [0, 1, 2].map(() =>
    add(
      g,
      new THREE.RingGeometry(1.5, 1.6, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: '#eafaff',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      beachX,
      0.15,
      beachZ
    )
  );
  const skiff = boat('#d8543c', 0.7);
  g.add(skiff);

  // Coastal fynbos scrub on low islets — never trees on the headland.
  const isletBushT: InstanceTransform[] = [];
  [2.0, 3.2, 4.4, 5.6].forEach((a, i) => {
    const r = 4.9 + R(i + 120) * 0.9;
    const x = -0.4 + r * Math.cos(a);
    const z = 0.2 + r * Math.sin(a);
    rock(g, 0.75, 1.25, 0.55, x, z, '#6f5b44', '#a98f68', 0.14);
    add(g, C(0.78, 0.82, 0.06, 24), MStone('#5c7036', 0.95), x, 0.58, z);
    for (let k = 0; k < 3; k++) {
      const aa = R(i * 7 + k) * 6.28;
      const rr = R(i * 11 + k) * 0.45;
      isletBushT.push({
        x: x + rr * Math.cos(aa),
        y: 0.7,
        z: z + rr * Math.sin(aa),
        sx: 0.9 + R(i + k) * 0.5,
        sy: 0.5 + R(i + 3 + k) * 0.3,
        sz: 0.9 + R(i + 6 + k) * 0.5,
      });
    }
  });
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.26, 1), Mc('#567438'), isletBushT, [
    '#4d6e35',
    '#6c7e3b',
    '#826840',
  ]);

  // Soft billowing cloud puffs above the summit.
  const cloudMat = M('#ffffff', 0.92, 0);
  const clouds: THREE.Group[] = [];
  [
    [-2.4, 6.4, -1.8, 0.75],
    [2.2, 6.0, -2.4, 0.6],
  ].forEach(([x, y, z, s], ci) => {
    const cl = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(s * (0.4 + R(ci * 9 + j) * 0.22), 1),
        cloudMat
      );
      puff.position.set(
        (R(ci * 13 + j) - 0.5) * s * 1.6,
        (R(ci * 17 + j) - 0.5) * s * 0.5,
        (R(ci * 19 + j) - 0.5) * s * 0.8
      );
      cl.add(puff);
    }
    cl.position.set(x, y, z);
    cl.userData.baseX = x;
    g.add(cl);
    clouds.push(cl);
  });

  const bm = new THREE.Group();
  bm.position.set(-1.6, 5.65, -0.2);
  g.add(bm);
  const bmat = new THREE.MeshBasicMaterial({
    color: '#fff4b8',
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  [0, Math.PI].forEach((a) => {
    const c = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 5, 16, 1, true).rotateZ(Math.PI / 2).translate(2.5, 0, 0),
      bmat
    );
    c.rotation.y = a;
    bm.add(c);
  });
  // A shorter, faster beam marks the lower light as the one in service.
  const bmNew = new THREE.Group();
  bmNew.position.set(1.9, 3.12, 0.7);
  g.add(bmNew);
  [0, Math.PI].forEach((a) => {
    const c = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 2.4, 12, 1, true).rotateZ(Math.PI / 2).translate(1.2, 0, 0),
      bmat
    );
    c.rotation.y = a;
    bmNew.add(c);
  });
  const sr = seaRings(g, 0.12, 3.4, 4);
  const spray = drift(
    g,
    60,
    '#e8f8ff',
    0.1,
    (i, t) => {
      const a = R(i * 3) * 6.28;
      const k = (t * 0.45 + R(i * 7)) % 1;
      const rad = 3.55 + k * 0.75;
      return [
        -0.4 + Math.cos(a) * rad,
        0.15 + Math.sin(k * Math.PI) * 0.55,
        0.2 + Math.sin(a) * rad,
      ];
    },
    0.45
  );
  const bd = birds(g, 4, 4, 6);
  g.userData.tick = (t: number) => {
    bm.rotation.y = t * 1.2;
    bmNew.rotation.y = -t * 1.7;
    const fu = 0.5 + 0.46 * Math.sin(t * 0.14);
    const fp = funicularCurve.getPointAt(fu);
    const ftg = funicularCurve.getTangentAt(fu);
    funicularCar.position.set(fp.x, fp.y + 0.12, fp.z);
    funicularCar.rotation.y = Math.atan2(-ftg.z, ftg.x);
    sr(t);
    spray(t);
    bd(t);
    roadCars.forEach((c, i) => {
      const u = (((t * 0.028 * (i % 2 ? 1 : -1) + i / 3) % 1) + 1) % 1;
      const p = roadCurve.getPointAt(u);
      const tg = roadCurve.getTangentAt(u);
      if (i % 2) tg.negate();
      c.position.set(p.x, p.y + 0.16, p.z);
      c.rotation.y = Math.atan2(-tg.z, tg.x);
    });
    surf.forEach((r, i) => {
      const k = (t * 0.22 + i / 3) % 1;
      r.scale.setScalar(1 + k * 0.45);
      r.material.opacity = 0.5 * (1 - k);
    });
    skiff.position.set(
      beachX + 1 + Math.sin(t * 0.4) * 0.25,
      0.13,
      beachZ + 0.9 + Math.cos(t * 0.3) * 0.2
    );
    skiff.rotation.y = -0.6 + Math.sin(t * 0.2) * 0.15;
    clouds.forEach((cl, i) => {
      cl.position.x = (cl.userData.baseX as number) + Math.sin(t * 0.16 + i) * 0.22;
    });
  };
  return g;
}

export function bokaap(): THREE.Group {
  const g = new THREE.Group();
  const wh = MPlaster('#f4f1ea', 0.72);
  const cobble = MWet('#7f756a', 0.86, 0.16, 0.04, 'stone');
  // Curated vibrant yet ACES-balanced Cape Malay facade palette
  const pal = [
    '#d94a5b',
    '#e68c36',
    '#dfb84a',
    '#3ea89e',
    '#6b4c93',
    '#2a887a',
    '#d46148',
    '#d8628c',
  ];
  const roofs = ['#3d434c', '#7a4534', '#4d5b54', '#5c493e'];
  rock(g, 2.6, 3.9, 3.6, 0, -6.4, '#637544', '#988c66', 0.11);

  const benchT: InstanceTransform[] = [];
  for (let r = 0; r < 4; r++) {
    const z = 2.6 - r * 1.55;
    const b0 = 0.3 + r * 0.75;
    // A solid step plus a cobbled lane between rows makes the slope read.
    add(g, CB(10.3, b0, 1.65, 0.04), cobble, 0, b0 / 2, z);
    add(g, CB(10.3, 0.12, 0.14, 0.02), MStone('#8d8374', 0.92), 0, b0 + 0.04, z + 0.76);
    add(g, CB(10.3, 0.04, 0.28, 0.01), cobble, 0, b0 + 0.02, z - 0.85);
    // Voorstoep benches at each end of the terrace.
    benchT.push({ x: -4.7, y: b0 + 0.1, z: z + 0.55 });
    benchT.push({ x: 4.7, y: b0 + 0.1, z: z + 0.55 });
    for (let j = 0; j < 6; j++) {
      const x = -4.1 + j * 1.65;
      const h = 0.95 + ((j * 3 + r * 5) % 3) * 0.24;
      colonialHouse(g, {
        x,
        y: b0,
        z,
        w: 1.44,
        h,
        d: 1.26,
        wall: pal[(j + r * 3) % 8],
        roof: roofs[(j + r) % 4],
        capeDutch: (j + r) % 3 === 0,
      });
    }
    if (r === 0) {
      lampPost(g, -5.1, b0, z + 0.85, 0.55);
      lampPost(g, 0, b0, z + 0.85, 0.55);
      lampPost(g, 5.1, b0, z + 0.85, 0.55);
    }
  }
  instancedMeshes(g, CB(0.4, 0.07, 0.16, 0.02), MWood('#6a4a32', 0.86), benchT);

  // Auwal Mosque + arched facade + turquoise dome + minaret
  add(g, CB(1.44, 1.44, 1.44, 0.05), wh, 5.9, 1.0, -1.2);
  add(g, CB(1.52, 0.1, 1.52, 0.02), M('#2a8e80', 0.4, 0.3), 5.9, 1.75, -1.2);
  add(
    g,
    new THREE.SphereGeometry(0.68, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    M('#2a9d8f', 0.36, 0.4),
    5.9,
    1.78,
    -1.2
  );
  add(g, C(0.12, 0.16, 2.4, 12), wh, 6.6, 1.5, -2.1);
  add(g, new THREE.ConeGeometry(0.22, 0.42, 12), M('#2a9d8f', 0.36, 0.4), 6.6, 2.9, -2.1);

  for (let i = 0; i < 5; i++) tree(g, -4 + i * 2, 4.1, 0.8, 1);
  g.userData.tick = birds(g, 6, 3, 6);
  return g;
}

export function soccer(): THREE.Group {
  const g = new THREE.Group();
  const gl = G('#ffb35a', 1.6);
  // Offset terracotta-tile mosaic, drawn to canvas so the pattern stays crisp
  // instead of smearing through interpolated vertex colours.
  const mosaic = document.createElement('canvas');
  mosaic.width = 256;
  mosaic.height = 256;
  const mx = mosaic.getContext('2d')!;
  mx.fillStyle = '#5c2d18';
  mx.fillRect(0, 0, 256, 256);
  const cols = 16;
  const rows = 12;
  const cw = 256 / cols;
  const ch = 256 / rows;
  const tiles = ['#e8c074', '#d98f45', '#c45f28', '#933817', '#e0a44e'];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tx = col * cw + (row % 2 ? cw / 2 : 0);
      mx.fillStyle = tiles[Math.floor(R(row * 31 + col * 7 + 5) * tiles.length)];
      mx.fillRect(tx + 1, row * ch + 1, cw - 2, ch - 2);
    }
  }
  const mosaicTex = new THREE.CanvasTexture(mosaic);
  mosaicTex.wrapS = THREE.RepeatWrapping;
  mosaicTex.wrapT = THREE.RepeatWrapping;
  mosaicTex.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.MeshStandardMaterial({
    map: mosaicTex,
    roughness: 0.62,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  // Calabash: swollen base, pinched shoulder, flared rim.
  const gourd: [number, number][] = [
    [3.2, 0],
    [3.9, 0.5],
    [4.55, 1.2],
    [4.7, 1.8],
    [4.2, 2.5],
    [3.55, 3.0],
    [3.5, 3.3],
    [4.05, 3.75],
    [4.2, 3.9],
  ];
  const pts: THREE.Vector2[] = gourd.map(([rr, yy]) => new THREE.Vector2(rr, yy));
  for (let i = gourd.length - 1; i >= 1; i--) {
    pts.push(new THREE.Vector2(gourd[i][0] - 0.36, gourd[i][1]));
  }
  add(g, new THREE.LatheGeometry(pts, 108), pm);
  // Radial exterior steel spine ribs (10 African continent alignment spokes)
  const ribT: InstanceTransform[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ribT.push({ x: 4.72 * Math.cos(a), y: 1.85, z: 4.72 * Math.sin(a), ry: -a });
  }
  instancedMeshes(g, CB(0.14, 2.8, 0.16, 0.03), M('#4b3526', 0.55, 0.45), ribT);

  add(g, new THREE.CircleGeometry(3.5, 64).rotateX(-Math.PI / 2), M('#3b8a47', 0.95), 0, 0.48, 0);
  add(g, C(5.45, 5.65, 0.2, 84), MWet('#7f6043', 0.85, 0.16, 0.04, 'stone'), 0, 0.1, 0);
  [
    [4.6, 1.2],
    [4.2, 2.5],
  ].forEach(([R0, y]) =>
    add(g, new THREE.TorusGeometry(R0, 0.07, 8, 112).rotateX(Math.PI / 2), gl, 0, y, 0)
  );
  add(g, new THREE.TorusGeometry(4.15, 0.07, 8, 96).rotateX(Math.PI / 2), gl, 0, 3.9, 0);
  // Continuous ring of fire-coloured lamps under the pot.
  const fire = G('#ff7a2f', 1.05);
  add(g, new THREE.TorusGeometry(5.05, 0.045, 8, 128).rotateX(Math.PI / 2), fire, 0, 0.23, 0);
  const lampT: InstanceTransform[] = [];
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * 6.2832;
    lampT.push({ x: 5.05 * Math.cos(a), y: 0.27, z: 5.05 * Math.sin(a) });
  }
  instancedMeshes(g, new THREE.SphereGeometry(0.09, 8, 6), fire, lampT);
  for (let i = 0; i < 8; i++) {
    const a = i * 0.785 + 0.3;
    tree(g, 6.9 * Math.cos(a), 6.9 * Math.sin(a), 0.9, 2);
  }
  const fw = drift(g, 60, '#ffd27a', 0.1, (i, t) => {
    const u = (t * 0.35 + (i % 4) * 0.25) % 1;
    const a = R(i) * 6.28;
    const e = R(i + 7) * 3.14 - 1.57;
    const d = u * 2.6;
    return [
      Math.cos(a) * Math.cos(e) * d,
      5.4 + Math.sin(e) * d - u * u * 1.2,
      Math.sin(a) * Math.cos(e) * d,
    ];
  });
  g.userData.tick = (t: number) => {
    gl.color.setHSL(0.07 + 0.03 * Math.sin(t), 0.9, 0.55);
    gl.emissive.copy(gl.color);
    fire.color.setHSL(0.045 + 0.015 * Math.sin(t * 1.6), 0.95, 0.55);
    fire.emissive.copy(fire.color);
    fw(t);
  };
  return g;
}

export function rondavels(): THREE.Group {
  const g = new THREE.Group();
  const cm = MT('#f8fbff', 0.68, 0.98, 0, false);

  // Deep green canyon floor and river, well below the escarpment shelf.
  add(g, C(7.2, 7.2, 0.12, 64), MStone('#48563b', 0.96), 0, -3.3, 0);
  add(g, C(1, 1, 0.03, 40), MWater('#2f8fa8', 0.1, 0.25), 0, -3.18, 0).scale.set(1.7, 1, 6.4);

  // Narrow shelf the sentinels stand on, with sharply sheared canyon walls.
  add(g, C(4.6, 5.1, 0.26, 64), MStone('#5f7a3c', 0.95), 1.5, 0.17, 0);
  [
    [-3.4, -2.5, 1.0, 1.6, 3.5],
    [-4.0, 0.8, 0.9, 1.5, 3.6],
    [-2.6, 3.6, 1.1, 1.6, 3.4],
    [1.0, -4.6, 1.1, 1.7, 3.5],
    [1.2, 4.7, 1.0, 1.6, 3.4],
  ].forEach(([x, z, rt, rb, h]) =>
    rock(g, rt, rb, h, x, z, '#6a583b', '#987e54', 0.1, -3.1)
  );

  // Three near-identical rounded, grass-capped summits.
  const crest = new THREE.Group();
  g.add(crest);
  const capGeo = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  [
    [2.2, -2.0, 3.4, 1.0],
    [3.1, 0.0, 3.6, 1.05],
    [2.2, 2.0, 3.4, 1.0],
  ].forEach(([x, z, h, r]) => {
    rock(g, r * 0.8, r * 1.15, h, x, z, '#79573a', '#b88954', 0.11, 0.3);
    add(crest, capGeo, MStone('#668838', 0.92), x, 0.3 + h - 0.04, z).scale.set(
      r * 0.98,
      r * 0.5,
      r * 0.98
    );
    add(
      crest,
      new THREE.ConeGeometry(r * 0.18, 0.42, 12),
      MStone('#7b9a40', 0.92),
      x,
      0.3 + h + 0.2,
      z
    );
  });
  // Mapjaneng, the flat-topped chief, immediately beside the three.
  rock(g, 1.15, 1.55, 2.95, -0.3, 0.2, '#715a3c', '#a98355', 0.09, 0.3);
  add(crest, C(1.12, 1.12, 0.09, 32), MStone('#6d8a3a', 0.92), -0.3, 3.28, 0.2);
  mergeByMaterial(crest);

  // Mist lying in the canyon rather than on the plateau.
  const ms = Array.from({ length: 8 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.7, 14, 10),
      cm,
      -2 + R(i) * 5,
      -2.5 + R(i + 4) * 0.8,
      -2 + R(i + 9) * 4
    );
    o.scale.set(1.8, 0.5, 1.2);
    o.userData.x = o.position.x;
    return o;
  });
  for (let i = 0; i < 8; i++)
    tree(g, -1.8 + R(i) * 1.8, -4.2 + R(i + 30) * 8.4, 0.7 + R(i + 5) * 0.3, i % 4 ? 1 : 2, 0.2);
  const bd = birds(g, 3, 3.5, 6.2);
  g.userData.tick = (t: number) => {
    ms.forEach((o, i) => {
      o.position.x = (o.userData.x as number) + Math.sin(t * 0.25 + i) * 0.5;
      o.scale.y = 0.5 + 0.08 * Math.sin(t * 0.5 + i);
    });
    bd(t);
  };
  return g;
}

export function baobab(): THREE.Group {
  const g = new THREE.Group();
  const bk = MWood('#8a7862', 0.94, 0.032);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#b5964e', 0.96), 0, 0.1, 0);

  // Girth first: a very broad bottle trunk with a flared, buttressed base.
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 22; i++) {
    const y = (i * 3.05) / 22;
    pts.push(
      new THREE.Vector2(
        1.45 *
          (1 +
            0.5 * Math.sin(Math.PI * Math.min(1, y / 2.2)) +
            0.8 * Math.exp(-y * 3.5) -
            (0.16 * y) / 3.05),
        y
      )
    );
  }
  const tg = new THREE.LatheGeometry(pts, 64);
  const p = tg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const a = Math.atan2(Z, X);
    const f = 1 + 0.09 * Math.sin(a * 9 + Y * 3) + 0.055 * Math.sin(a * 17 - Y * 5);
    p.setXYZ(i, X * f, Y, Z * f);
  }
  tg.computeVertexNormals();
  add(g, tg, bk, 0, 0.2, 0);

  // Six spreading buttress roots around the broad base, merged to one draw.
  const roots = new THREE.Group();
  g.add(roots);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + 0.2;
    const root = add(
      roots,
      new THREE.SphereGeometry(0.62, 16, 10),
      bk,
      1.75 * Math.cos(a),
      0.4,
      1.75 * Math.sin(a)
    );
    root.scale.set(1.9, 0.6, 1);
    root.rotation.y = -a;
  }
  mergeByMaterial(roots);

  // Strong vertical fluting reads at miniature scale where fine bark cannot.
  const flutes = new THREE.Group();
  g.add(flutes);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const rib = add(flutes, C(0.05, 0.12, 2.2, 8), bk, 2.05 * Math.cos(a), 1.35, 2.05 * Math.sin(a));
    rib.rotation.z = -0.06 * Math.cos(a);
    rib.rotation.x = 0.06 * Math.sin(a);
  }
  mergeByMaterial(flutes);

  // Sparse, root-like crown: six branches, two small clumps each.
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + R(i) * 0.35;
    const L = 1.5 + R(i + 2) * 0.7;
    const cv = new THREE.CatmullRomCurve3([
      V(0, 2.95, 0),
      V(Math.cos(a) * 0.8, 3.5, Math.sin(a) * 0.8),
      V(Math.cos(a) * L, 3.95 + R(i) * 0.4, Math.sin(a) * L),
    ]);
    add(g, new THREE.TubeGeometry(cv, 10, 0.09, 6), bk);
    const f = new THREE.Group();
    f.position.copy(cv.getPoint(1));
    g.add(f);
    for (let k = 0; k < 2; k++) {
      add(
        f,
        new THREE.IcosahedronGeometry(0.2 + R(k + i) * 0.08, 1),
        Mc(k % 2 ? '#6f8f3a' : '#8aa04a'),
        (k - 0.5) * 0.24,
        k * 0.06,
        R(k) * 0.16
      );
    }
    swayItems.push({ o: f, ph: i, a: 0.05, sp: 1.2 });
  }
  // Batched dry-season golden savanna grass tufts (1 draw call)
  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 72; i++) {
    const a = R(i) * 6.28;
    const r = 2.8 + R(i + 9) * 4.4;
    grassT.push({
      x: r * Math.cos(a),
      y: 0.2,
      z: r * Math.sin(a),
      ry: R(i * 3) * 6.28,
      sy: 1.1 + R(i + 2) * 0.6,
    });
  }
  grassTufts(g, grassT, ['#d1bb62', '#b9a34c', '#8c9442']);
  g.userData.tick = drift(g, 50, '#ffe38a', 0.08, (i, t) => [
    Math.cos(i * 2.4 + t * 0.2) * (1.5 + R(i) * 5),
    0.5 + R(i + 2) * 3 + Math.sin(t + i) * 0.2,
    Math.sin(i * 2.4 + t * 0.2) * (1.5 + R(i) * 5),
  ]);
  return g;
}

export function holewall(): THREE.Group {
  const g = new THREE.Group();
  sea(g, '#166d91', '#2da6b6');
  const s = new THREE.Shape();
  s.moveTo(-2.4, -0.6);
  s.lineTo(-2.4, 2.3);
  s.quadraticCurveTo(-2.3, 3.3, -1.1, 3.3);
  s.lineTo(1, 3.4);
  s.quadraticCurveTo(2.3, 3.3, 2.4, 2.2);
  s.lineTo(2.4, -0.6);
  s.closePath();
  const h = new THREE.Path();
  h.moveTo(-0.9, -0.2);
  h.lineTo(-0.9, 1.3);
  h.absarc(0, 1.3, 0.9, Math.PI, 0, true);
  h.lineTo(0.9, -0.2);
  h.closePath();
  s.holes.push(h);
  const ge = new THREE.ExtrudeGeometry(s, {
    depth: 1.6,
    bevelEnabled: true,
    bevelSize: 0.11,
    bevelThickness: 0.11,
    bevelSegments: 2,
    curveSegments: 24,
  }).translate(0, 0, -0.8);
  const a = new THREE.Color('#6a4e36');
  const b = new THREE.Color('#b69268');
  const c = new THREE.Color('#5a863a');
  add(
    g,
    tint(ge, (k, x, y) =>
      y > 3.15
        ? k.copy(c)
        : k.copy(a).lerp(b, Math.min(1, Math.max(0, y / 3.2 + 0.1 * Math.sin(y * 14 + x))))
    ),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      ...surfaceDetail('stone', 0.032),
    })
  ).scale.setScalar(1.3);

  rock(g, 2.6, 4, 3.6, 0, -5.2, '#62523a', '#988056', 0.1);
  add(g, C(2.6, 2.65, 0.12, 48), MStone('#5c853a', 0.94), 0, 3.66, -5.2);
  // Three authentic Xhosa rondavels on the Wild Coast headland
  [-0.9, 0, 0.9].forEach((x, i) => {
    rondavel(g, x, -5 + i * 0.18, 3.7, 0.56, '#ede2cc', '#a47e3c');
  });
  [
    [-1.4, -4.4],
    [1.5, -4.6],
    [-0.2, -5.9],
  ].forEach(([x, z]) => tree(g, x, z, 0.72, 2, 3.62));
  rock(g, 0.4, 0.7, 1.1, 3.4, 1.5, '#6a5a3e', '#9a8056', 0.12);
  rock(g, 0.35, 0.6, 0.9, -3.2, 2.6, '#6a5a3e', '#9a8056', 0.12);
  const sr = seaRings(g, 0.12, 1.8, 4);
  const spray = drift(
    g,
    55,
    '#e8f8ff',
    0.11,
    (i, t) => {
      const k = (t * 0.5 + R(i * 4)) % 1;
      return [(R(i * 2) - 0.5) * 1.6, 0.16 + Math.sin(k * Math.PI) * 0.75, -0.4 + k * 2.2];
    },
    0.5
  );
  const bd = birds(g, 3, 3.2, 5);
  g.userData.tick = (t: number) => {
    sr(t);
    spray(t);
    bd(t);
  };
  return g;
}

export function castle(): THREE.Group {
  const g = new THREE.Group();
  const wl = MPlaster('#e4d5a8', 0.82);
  const rf = MPlaster('#8a4932', 0.78);
  const st = MStone('#9e957e', 0.9);
  add(g, C(7.6, 7.6, 0.2, 84), MWet('#b4ab86', 0.86, 0.18, 0.04, 'stone'), 0, 0.1, 0);
  const pent = (r: number) =>
    Array.from(
      { length: 5 },
      (_, i) =>
        new THREE.Vector2(r * Math.cos(-1.5708 + i * 1.2566), r * Math.sin(-1.5708 + i * 1.2566))
    );
  const ring = (ro: number, ri: number, d: number) => {
    const s = new THREE.Shape(pent(ro));
    s.holes.push(new THREE.Path(pent(ri)));
    return new THREE.ExtrudeGeometry(s, {
      depth: d,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 1,
    }).rotateX(-Math.PI / 2);
  };
  add(g, ring(5.9, 4.8, 0.05), MWater('#388b9b', 0.1, 0.25), 0, 0.2, 0);
  add(g, ring(4.5, 3.72, 0.98), wl, 0, 0.2, 0);
  add(g, ring(4.56, 3.66, 0.09), st, 0, 1.17, 0);

  // Five triangular bastions make the star plan unmistakable from above.
  const bs = new THREE.Shape();
  bs.moveTo(0, -1.15); // outward tip after the -90deg X rotation
  bs.lineTo(0.74, 0.32);
  bs.lineTo(-0.74, 0.32);
  bs.closePath();
  const bastionGeo = new THREE.ExtrudeGeometry(bs, {
    depth: 0.92,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.05,
    bevelSegments: 1,
  }).rotateX(-Math.PI / 2);
  pent(4.35).forEach((v) => {
    const x = v.x;
    const z = -v.y;
    const yaw = Math.atan2(x, z);
    const body = add(g, bastionGeo, wl, x, 0.2, z);
    body.rotation.y = yaw;
    const cap = add(g, bastionGeo, st, x, 1.14, z);
    cap.rotation.y = yaw;
    cap.scale.set(0.86, 0.14, 0.86);
    // Low chamfered sentry point, kept subordinate to the bastion plan.
    const point = add(g, new THREE.ConeGeometry(0.28, 0.38, 4), rf, x, 1.42, z);
    point.rotation.y = yaw + Math.PI / 4;
  });

  // Kat Balcony Residence with pitched tiled roof & Bell Tower cupola
  add(g, CB(2.4, 0.9, 1.6, 0.04), wl, 0, 0.65, 0.3);
  add(g, gableRoofGeo(2.4, 1.6, 0.45, 0.1), rf, 0, 1.12, 0.3);
  // A varied lit-window facade reads far better than a single glowing pane.
  add(
    g,
    new THREE.PlaneGeometry(2.34, 0.84),
    litWindowMaterial({
      wall: '#e4d5a8',
      lit: '#ffd58a',
      dark: '#6b5a3a',
      cols: 9,
      rows: 3,
      seed: 7,
      chance: 0.5,
      intensity: 0.14,
    }),
    0,
    0.65,
    1.116
  );
  // Recessed residence windows, entrance and a light string course.
  const castleFacade = new THREE.Group();
  for (const x of [-0.78, 0.78]) {
    facadeWindow(castleFacade, {
      x,
      y: 0.72,
      z: 1.14,
      width: 0.34,
      height: 0.46,
      depth: 0.1,
      frame: '#e4d5a8',
      glass: '#2b2418',
    });
  }
  doorSurround(castleFacade, {
    x: 0,
    y: 0.68,
    z: 1.15,
    width: 0.7,
    height: 0.95,
    depth: 0.14,
    jamb: '#e4d5a8',
    panel: '#4a3424',
  });
  corniceBand(castleFacade, {
    x: 0,
    y: 1.14,
    z: 1.12,
    width: 2.46,
    depth: 0.16,
    height: 0.1,
    color: '#9e957e',
  });
  g.add(mergeByMaterial(castleFacade));
  // Legible bell tower over the main entrance: open belfry, bell and tiled cap.
  add(g, CB(0.78, 0.14, 0.78, 0.02), st, 0, 1.26, 3.0);
  for (const dx of [-0.25, 0.25]) {
    for (const dz of [-0.25, 0.25]) {
      add(g, C(0.035, 0.045, 0.86, 8), wl, dx, 1.74, 3.0 + dz);
    }
  }
  add(g, CB(0.72, 0.09, 0.72, 0.02), st, 0, 2.2, 3.0);
  add(g, new THREE.SphereGeometry(0.1, 12, 8), M('#7c5e34', 0.5, 0.55), 0, 1.92, 3.0);
  add(g, new THREE.ConeGeometry(0.56, 0.46, 4), rf, 0, 2.48, 3.0).rotation.y = Math.PI / 4;
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.5;
    tree(g, 6.6 * Math.cos(a), 6.6 * Math.sin(a), 0.8, 1);
  }
  g.userData.tick = birds(g, 4, 3.4, 5);
  return g;
}

export function amphi(): THREE.Group {
  const g = new THREE.Group();
  const wm = MCascade('#e4f5ff', 0.85);
  const cm = MT('#f6faff', 0.62, 0.98, 0, false);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#587442', 0.95), 0, 0.1, 0);
  // Towering layered basalt wall of the Amphitheatre, banded by erosion.
  const bandCols = ['#5d4a3a', '#6b563f', '#7a6047', '#67503a'];
  for (let i = 0; i < 8; i++) {
    add(
      g,
      CB(9.0 - i * 0.7, 0.85, 1.5, 0.06),
      MStone(bandCols[i % 4], 0.95),
      (R(i + 3) - 0.5) * 0.3,
      0.35 + i * 0.82,
      -5.0 + i * 0.08
    );
  }
  const strataT: InstanceTransform[] = [];
  for (let i = 0; i < 8; i++) {
    strataT.push({ x: 0, y: 0.79 + i * 0.82, z: -4.22 + i * 0.08, sx: 1 - i * 0.075 });
  }
  instancedMeshes(g, CB(9.0, 0.05, 0.06, 0.01), M('#4a3a2c', 0.95), strataT);
  for (let i = 0; i < 9; i++) {
    const q = 3.2 + i * 0.21;
    rock(
      g,
      1.1,
      1.7,
      5.2 + R(i) * 1.1,
      5.2 * Math.cos(q),
      5.2 * Math.sin(q),
      '#6c4f39',
      '#c09e78',
      0.14
    );
  }
  rock(g, 1.4, 2.0, 5.4, 5.6, -2.8, '#6c4f39', '#b09270', 0.15);
  rock(g, 1.3, 1.9, 4.8, -5.6, -1.6, '#6c4f39', '#b09270', 0.15);
  const a = 4.04;
  const wx = 3.9 * Math.cos(a);
  const wz = 3.9 * Math.sin(a);
  // Multi-leap cascading Tugela Falls sheet + pool mist puffs
  add(g, CB(0.26, 5.4, 0.1, 0.03), wm, wx, 3.1, wz);
  add(g, CB(0.22, 1.5, 0.1, 0.03), wm, wx - 0.12, 5.35, wz + 0.1).rotation.z = 0.12;
  add(g, CB(0.36, 1.9, 0.12, 0.03), wm, wx + 0.16, 3.6, wz - 0.08).rotation.z = -0.1;
  add(g, CB(0.46, 1.6, 0.12, 0.03), wm, wx - 0.06, 1.35, wz + 0.14);
  // Upper lip ledge and a short stream feeding the first leap.
  add(g, CB(2.2, 0.28, 1.0, 0.05), MStone('#67503a', 0.95), wx, 6.05, wz - 0.45);
  const lipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(wx - 0.9, 6.32, wz - 1.25),
    new THREE.Vector3(wx - 0.35, 6.28, wz - 0.75),
    new THREE.Vector3(wx + 0.05, 6.2, wz - 0.3),
  ]);
  add(g, new THREE.TubeGeometry(lipCurve, 24, 0.12, 6), MWater('#3fa6c0', 0.1, 0.22));
  add(g, C(0.85, 0.95, 0.06, 24), MWater('#3394b4', 0.1, 0.2), wx, 0.23, wz + 0.25);
  const ms = Array.from({ length: 10 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.55, 12, 10),
      cm,
      wx + (R(i) - 0.5) * 1.4,
      0.5 + R(i + 3) * 0.35,
      wz + (R(i + 5) - 0.5) * 1.4
    );
    o.scale.y = 0.5;
    o.userData.x = o.position.x;
    return o;
  });
  for (let i = 0; i < 16; i++)
    tree(g, -5 + R(i) * 10, -0.5 + R(i + 10) * 5.5, 0.75 + R(i) * 0.35, i % 3 ? 1 : 2, 0.2);
  // Grassy valley slopes with batched alpine shrubs and tufts.
  const tuftT: InstanceTransform[] = [];
  const shrubT: InstanceTransform[] = [];
  for (let i = 0; i < 80; i++) {
    const ang = R(i + 20) * 6.2832;
    const r = 2.5 + R(i + 80) * 3.8;
    tuftT.push({
      x: r * Math.cos(ang),
      y: 0.2,
      z: r * Math.sin(ang),
      ry: R(i * 7) * 6.28,
      sy: 1.1,
    });
    if (i % 3 === 0)
      shrubT.push({
        x: r * Math.cos(ang),
        y: 0.24,
        z: r * Math.sin(ang),
        sx: 0.4 + R(i + 3) * 0.3,
        sy: 0.28 + R(i + 5) * 0.2,
        sz: 0.4 + R(i + 9) * 0.3,
      });
  }
  grassTufts(g, tuftT, ['#4d6e35', '#688240', '#8d8746']);
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.3, 1), Mc('#4d6b3d'), shrubT, [
    '#4d6b3d',
    '#6a8549',
    '#7d8a4a',
  ]);

  // Meandering river carrying foam away from the plunge pool.
  const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(wx + 0.1, 0.28, wz + 0.55),
    new THREE.Vector3(-1.0, 0.27, -1.6),
    new THREE.Vector3(0.6, 0.26, -0.4),
    new THREE.Vector3(1.2, 0.25, 1.4),
    new THREE.Vector3(3.0, 0.24, 2.4),
    new THREE.Vector3(4.6, 0.24, 4.0),
  ]);
  add(g, new THREE.TubeGeometry(riverCurve, 80, 0.24, 8), MWater('#3394b4', 0.1, 0.22));
  const foamT: InstanceTransform[] = [];
  for (let i = 1; i < 26; i++) {
    const p = riverCurve.getPointAt(i / 26);
    foamT.push({ x: p.x, y: 0.5, z: p.z, sx: 0.5 + R(i) * 0.4, sz: 0.35 });
  }
  instancedMeshes(
    g,
    new THREE.CircleGeometry(0.14, 12).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: '#eaf8ff',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    foamT
  );

  // Mist clinging to the escarpment peaks above the falls.
  const peakMist = Array.from({ length: 8 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.7, 12, 10),
      cm,
      -3.4 + R(i) * 6.8,
      6.0 + R(i + 3) * 0.5,
      -4.9 + (R(i + 5) - 0.5) * 1.2
    );
    o.scale.set(1.5, 0.45, 0.9);
    o.userData.x = o.position.x;
    return o;
  });

  const fall = drift(g, 150, '#e8f6ff', 0.09, (i, t) => {
    const stage = i % 3;
    const u = (t * 0.85 + R(i)) % 1;
    const top = [6.1, 4.5, 2.5][stage];
    const len = [1.7, 2.1, 2.4][stage];
    const dx = [0.12, -0.06, 0.02][stage];
    return [
      wx + dx + (R(i + 3) - 0.5) * 0.34,
      top - u * len,
      wz + (R(i + 4) - 0.5) * 0.3 + u * 0.12,
    ];
  });
  const riverFoam = drift(
    g,
    60,
    '#eaf8ff',
    0.07,
    (i, t) => {
      const u = (t * 0.06 + R(i)) % 1;
      const p = riverCurve.getPointAt(u);
      return [p.x + (R(i + 3) - 0.5) * 0.3, 0.52, p.z + (R(i + 5) - 0.5) * 0.3];
    },
    0.55
  );
  g.userData.tick = (t: number) => {
    fall(t);
    riverFoam(t);
    ms.forEach((o, i) => {
      o.position.x = (o.userData.x as number) + Math.sin(t * 0.4 + i) * 0.14;
    });
    peakMist.forEach((o, i) => {
      o.position.x = (o.userData.x as number) + Math.sin(t * 0.18 + i) * 0.3;
      o.scale.y = 0.45 + 0.06 * Math.sin(t * 0.5 + i);
    });
  };
  return g;
}

export function palace(): THREE.Group {
  const g = new THREE.Group();
  const st = MStone('#d8be88', 0.72, 0.02);
  const gd = M('#dfa942', 0.28, 0.84);
  const tl = M('#297d8e', 0.42, 0.35);
  const wn = G('#ffd98a', 1.15);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#567440', 0.95), 0, 0.1, 0);
  add(g, CB(8.4, 0.3, 4.6, 0.05), st, 0, 0.35, 0);
  add(g, CB(3.2, 2.6, 2.4, 0.06), st, 0, 1.8, -0.4);
  add(g, CB(3.4, 0.16, 2.6, 0.03), gd, 0, 3.16, -0.4);
  [-1, 1].forEach((s) => {
    add(g, CB(2.4, 1.8, 2, 0.05), st, s * 3.2, 1.4, -0.2);
    add(g, C(0.55, 0.65, 3.2, 16), st, s * 4.8, 2, -1.2);
    add(g, new THREE.ConeGeometry(0.78, 1.5, 16), tl, s * 4.8, 4.35, -1.2);
    add(g, new THREE.SphereGeometry(0.12, 8, 8), gd, s * 4.8, 5.2, -1.2);
    add(g, C(0.35, 0.4, 2.6, 12), st, s * 1.7, 2.6, 0.7);
    add(g, new THREE.ConeGeometry(0.5, 0.9, 12), gd, s * 1.7, 4.35, 0.7);
    for (let j = 0; j < 3; j++)
      add(g, CB(0.3, 0.6, 0.05, 0.015), wn, s * 3.2 + (j - 1) * 0.65, 1.5, 0.82);
  });
  add(g, C(0.9, 1.1, 2, 24), st, 0, 4.1, -0.6);
  add(g, new THREE.ConeGeometry(1.15, 2.2, 24), tl, 0, 6.2, -0.6);
  add(g, C(0.04, 0.04, 1, 6), gd, 0, 7.6, -0.6);
  for (let j = 0; j < 4; j++) add(g, CB(0.3, 0.9, 0.05, 0.015), wn, -0.9 + j * 0.6, 2, 0.82);
  add(g, CB(4.8, 0.08, 2, 0.02), MWater('#3fa4be', 0.08, 0.25), 0, 0.2, 3.4);
  for (let i = 0; i < 7; i++) tree(g, -5 + i * 1.7, 4.9, 0.95, 3, 0.2);
  g.userData.tick = drift(g, 50, '#ffe08a', 0.07, (i, t) => [
    (R(i) - 0.5) * 5,
    0.35 + ((R(i + 3) * 2 + t * 0.3) % 2) * 0.9,
    3.4 + (R(i + 7) - 0.5) * 1.8,
  ]);
  return g;
}

export function golden(): THREE.Group {
  const g = new THREE.Group();
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#a89d58', 0.96), 0, 0.1, 0);
  (
    [
      [-3.2, -2.4, 1.8, 2.6, 4.2],
      [-1, -3.8, 1.5, 2.2, 3.4],
      [2.8, -3, 1.6, 2.4, 3.8],
      [4.4, -0.4, 1.2, 1.8, 2.6],
      [-4.6, 0.6, 1.3, 2, 2.8],
    ] as const
  ).forEach(([x, z, a, b, h], i) =>
    rock(g, a, b, h, x, z, i % 2 ? '#b46f38' : '#a66534', '#eab96e', 0.16)
  );
  // Batched swaying Free State golden grass tufts (110 -> 1 instancedMesh draw call!)
  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 110; i++) {
    const a = R(i) * 6.28;
    const r = 1 + R(i + 9) * 6;
    grassT.push({
      x: r * Math.cos(a),
      y: 0.2,
      z: r * Math.sin(a),
      ry: R(i * 5) * 6.28,
      sy: 1.3 + R(i + 2) * 0.6,
    });
  }
  grassTufts(g, grassT, ['#d2b85a', '#c0a246', '#a89a4a']);

  const cv = new THREE.CatmullRomCurve3(
    [
      [-5, 0.7, -0.5],
      [-2, 0.7, 0.5],
      [1, 0.7, -0.2],
      [4, 0.7, 1.6],
    ].map((p) => new THREE.Vector3(...p))
  );
  add(g, new THREE.TubeGeometry(cv, 40, 0.25, 8), MWater('#4387ad', 0.1, 0.2)).scale.y = 0.3;
  for (let i = 0; i < 4; i++) tree(g, -3 + i * 2.3, 3.8 + R(i), 0.9, 2, 0.2);
  g.userData.tick = drift(g, 45, '#ffd88a', 0.06, (i, t) => [
    Math.cos(i * 2.4 + t * 0.1) * (1 + R(i) * 5.5),
    0.6 + ((R(i + 3) * 4 + t * 0.2) % 3.5),
    Math.sin(i * 2.4 + t * 0.1) * (1 + R(i) * 5.5),
  ]);
  return g;
}

export function kruger(): THREE.Group {
  const g = new THREE.Group();
  const sk = MStone('#888076', 0.92, 0.025);
  const iv = M('#f4eddb', 0.4);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#b4964c', 0.96), 0, 0.1, 0);
  const ear: Array<[THREE.Mesh, number]> = [];
  const mk = (s: number) => {
    const e = new THREE.Group();
    add(e, new THREE.SphereGeometry(1, 28, 20), sk, 0, 1.9, 0).scale.set(1.5, 1.1, 1);
    add(e, new THREE.SphereGeometry(0.7, 22, 16), sk, 1.6, 2.1, 0);
    [
      [0.8, 0.5],
      [0.8, -0.5],
      [-0.8, 0.5],
      [-0.8, -0.5],
    ].forEach(([x, z]) => add(e, C(0.26, 0.3, 1.5, 12), sk, x, 0.85, z));
    add(
      e,
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.1, 1.9, 0),
          new THREE.Vector3(2.5, 1.1, 0),
          new THREE.Vector3(2.4, 0.4, 0),
        ]),
        16,
        0.17,
        8
      ),
      sk
    );
    [-1, 1].forEach((z) => {
      add(e, new THREE.ConeGeometry(0.08, 0.9, 8).rotateZ(-1.1), iv, 2.1, 1.5, z * 0.28);
      const e2 = add(e, new THREE.SphereGeometry(0.55, 16, 12), sk, 1.25, 2.2, z * 0.7);
      e2.scale.set(0.12, 1, 0.9);
      ear.push([e2, z]);
    });
    add(e, C(0.03, 0.04, 1, 6), sk, -1.5, 1.5, 0);
    e.scale.setScalar(s);
    g.add(e);
    return e;
  };
  const mom = mk(1.15);
  mom.position.set(-0.5, 0, 0.5);
  const cf = mk(0.55);
  cf.position.set(-3, 0, 2.2);
  cf.rotation.y = 0.5;
  add(g, C(1.8, 1.8, 0.05, 48), MWater('#3e85aa', 0.1, 0.25), 3.4, 0.22, 2.8);
  scatterRocks(
    g,
    [
      { x: 4.9, y: 0.22, z: 3.1, sx: 0.45, sy: 0.25, sz: 0.4 },
      { x: 2.1, y: 0.22, z: 3.9, sx: 0.38, sy: 0.22, sz: 0.35 },
      { x: 4.1, y: 0.22, z: 1.2, sx: 0.42, sy: 0.24, sz: 0.36 },
    ],
    '#7c6c56',
    '#a38f70'
  );
  for (let i = 0; i < 5; i++) tree(g, -5 + i * 2.4, -3.8 + R(i) * 1.5, 1.1, 2, 0.2);

  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 70; i++) {
    const a = R(i) * 6.28;
    const r = 2 + R(i + 9) * 5;
    grassT.push({ x: r * Math.cos(a), y: 0.2, z: r * Math.sin(a), ry: R(i * 3) * 6.28, sy: 1.3 });
  }
  grassTufts(g, grassT, ['#d1bb62', '#b9a34c', '#8a9440']);

  const dd = drift(g, 45, '#e2c88e', 0.07, (i, t) => [
    Math.cos(i * 2.4 + t * 0.15) * (1 + R(i) * 5.5),
    0.4 + ((R(i + 3) * 3 + t * 0.25) % 2.5),
    Math.sin(i * 2.4 + t * 0.15) * (1 + R(i) * 5.5),
  ]);
  g.userData.tick = (t: number) => {
    dd(t);
    ear.forEach(([e, z], i) => {
      e.rotation.y = z * (0.3 + 0.3 * Math.sin(t * 2.2 + i));
    });
    mom.position.y = 0.03 * Math.sin(t * 1.5);
    cf.position.y = 0.03 * Math.sin(t * 1.5 + 1);
  };
  return g;
}

export function ponte(): THREE.Group {
  const g = new THREE.Group();
  const roadMat = MWet('#484b54', 0.84, 0.16, 0.06, 'plaster');
  add(g, C(7.6, 7.6, 0.2, 84), roadMat, 0, 0.1, 0);
  const wm = litWindowMaterial({
    wall: '#c4bcb0',
    lit: '#e8ca86',
    dark: '#323844',
    cols: 16,
    rows: 55,
    seed: 1,
    chance: 0.58,
    intensity: 0.18,
  });
  wm.userData.i = 0.85;
  add(g, C(1.6, 1.6, 7.4, 64, 1, true), wm, 0, 3.9, 0);
  add(g, C(0.8, 0.8, 7.4, 32, 1, true), MPlaster('#c9c2b4', 0.8), 0, 3.9, 0);
  // Exterior vertical structural concrete ribs
  const ribT: InstanceTransform[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ribT.push({ x: 1.62 * Math.cos(a), y: 3.9, z: 1.62 * Math.sin(a), ry: -a });
  }
  instancedMeshes(g, CB(0.08, 7.4, 0.1, 0.02), MPlaster('#d0cabd', 0.82), ribT);

  // Ponte City is 55 storeys; one thin balcony band per level reads as the
  // building's stacked cylindrical rhythm at miniature scale.
  const bandT: InstanceTransform[] = [];
  for (let i = 0; i < 55; i++) {
    bandT.push({ x: 0, y: 0.27 + i * (7.4 / 55), z: 0, rx: Math.PI / 2 });
  }
  instancedMeshes(g, new THREE.TorusGeometry(1.625, 0.012, 4, 48), MPlaster('#ded6c7', 0.86), bandT);

  add(
    g,
    new THREE.RingGeometry(0.8, 1.6, 64).rotateX(-Math.PI / 2),
    M('#9a9a9a', 0.8),
    0,
    7.6,
    0
  ).material.side = THREE.DoubleSide;
  const sg = G('#ff4a3a', 2);
  add(g, new THREE.TorusGeometry(1.64, 0.12, 8, 64).rotateX(Math.PI / 2), sg, 0, 7.35, 0);
  add(g, C(0.03, 0.05, 1.2, 6), M('#999', 0.5, 0.7), 0, 8.2, 0);
  // Rooftop neon sign frame — the cylinder's other signature identifier.
  const signMat = G('#ff4a3a', 1.6);
  for (const dx of [-0.9, 0.9]) add(g, CB(0.06, 0.7, 0.06, 0.01), signMat, dx, 8.45, 0);
  add(g, CB(1.86, 0.06, 0.06, 0.01), signMat, 0, 8.8, 0);

  for (let i = 0; i < 14; i++) {
    const a = i * 0.9;
    const r = 3.2 + R(i) * 3;
    const h = 1 + R(i + 4) * 3;
    add(g, CB(0.92, h, 0.92, 0.04), wm, r * Math.cos(a), 0.2 + h / 2, r * Math.sin(a));
  }
  const cs = Array.from({ length: 8 }, (_, i) => {
    const c = car(['#c33', '#eee', '#36c', '#fc3', '#2a9d8f', '#222', '#e76f51', '#ddd'][i], 0.45);
    g.add(c);
    return c;
  });
  g.userData.tick = (t: number) => {
    cs.forEach((c, i) => {
      const d = i % 2 ? 1 : -1;
      const a = i * 0.8 + t * 0.22 * d;
      const r = i % 2 ? 5.1 : 5.45;
      c.position.set(r * Math.cos(a), 0.2, r * Math.sin(a));
      c.rotation.y = -a + (d > 0 ? -Math.PI / 2 : Math.PI / 2);
    });
    sg.color.setHSL((t * 0.1) % 1, 0.9, 0.55);
    sg.emissive.copy(sg.color);
    signMat.color.copy(sg.color);
    signMat.emissive.copy(sg.color);
  };
  return g;
}

export function boulders(): THREE.Group {
  const g = new THREE.Group();
  const bk = M('#1b1d22', 0.55);
  const wt = M('#f4f4f2', 0.5);
  const or = M('#e8903a', 0.45);
  const P: THREE.Group[] = [];
  sea(g, '#1b7a98', '#33b5c4');
  add(g, C(4.4, 4.7, 0.2, 64), MStone('#e6d7ae', 0.96), 0, 0.12, -0.6);

  // Three tight granite clusters, with water channels cutting between them.
  const clusterA: [number, number] = [-2.8, -1.8];
  const clusterB: [number, number] = [2.8, -1.6];
  const clusterC: [number, number] = [-1.2, 2.6];
  const clusters = [clusterA, clusterB, clusterC];
  const water = MWater('#2c9fb2', 0.1, 0.22);
  const channel = (a: [number, number], b: [number, number], width: number) => {
    const cv = new THREE.CatmullRomCurve3([
      new THREE.Vector3(a[0], 0.22, a[1]),
      new THREE.Vector3((a[0] + b[0]) / 2 + 0.25, 0.22, (a[1] + b[1]) / 2 - 0.2),
      new THREE.Vector3(b[0], 0.22, b[1]),
    ]);
    add(g, new THREE.TubeGeometry(cv, 28, width, 8, false), water).scale.y = 0.32;
  };
  channel(clusterA, clusterB, 0.62);
  channel(clusterB, clusterC, 0.46);
  channel(clusterC, clusterA, 0.4);

  // Organic, 540-million-year-old rounded Cape granite boulders, tightly grouped.
  const boulderT: InstanceTransform[] = [];
  clusters.forEach(([cx, cz], ci) => {
    for (let i = 0; i < 11; i++) {
      const a = R(ci * 30 + i) * 6.28;
      const r = 0.18 + R(ci * 40 + i) * 1.2;
      const s = 0.75 + R(ci * 50 + i) * 1.15;
      boulderT.push({
        x: cx + r * Math.cos(a),
        y: s * 0.18,
        z: cz + r * Math.sin(a),
        ry: R(ci * 60 + i) * 6.28,
        sx: s * (1.05 + R(ci * 70 + i) * 0.3),
        sy: s * (0.7 + R(ci * 80 + i) * 0.22),
        sz: s,
      });
    }
  });
  scatterRocks(g, boulderT, '#8a8278', '#b0a698');
  // One signature whale-backed tor per cluster, hand-tinted granite shading.
  lump(g, 1.2, clusterA[0], clusterA[1], 1.35, 0.78, '#8f887c', '#c0b7a5');
  lump(g, 1.05, clusterB[0], clusterB[1], 1.3, 0.72, '#948c7e', '#c6bda9');
  lump(g, 0.9, clusterC[0], clusterC[1], 1.25, 0.7, '#8c8477', '#bcb3a1');
  // Fine pebbles stay inside the cluster footprints, leaving channels clear.
  const pebbleT: InstanceTransform[] = [];
  clusters.forEach(([cx, cz], ci) => {
    for (let i = 0; i < 9; i++) {
      const a = R(ci * 90 + i + 110) * 6.28;
      const r = 0.6 + R(ci * 100 + i + 130) * 1.1;
      pebbleT.push({
        x: cx + r * Math.cos(a),
        y: 0.22,
        z: cz + r * Math.sin(a),
        sx: 0.28 + R(i + 2) * 0.24,
        sy: 0.16 + R(i + 5) * 0.12,
        sz: 0.28 + R(i + 7) * 0.24,
      });
    }
  });
  scatterRocks(g, pebbleT, '#9a9080', '#c2b9a6');

  // Penguins cluster on the boulder margins; their tiny size gives the scale.
  const penguinSpot = (i: number): [number, number, number] => {
    const c = i % 3 === 0 ? clusterA : i % 3 === 1 ? clusterB : clusterC;
    const a = R(i + 20) * 6.28;
    const r = 1.15 + R(i + 30) * 0.85;
    return [c[0] + r * Math.cos(a), 0.2, c[1] + r * Math.sin(a)];
  };
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Group();
    const [px, py, pz] = penguinSpot(i);
    p.position.set(px, py, pz);
    p.rotation.y = R(i + 40) * 6.28;
    p.scale.setScalar(0.55 + R(i) * 0.18);
    add(p, new THREE.SphereGeometry(0.22, 14, 10), bk, 0, 0.38, 0).scale.set(1, 1.5, 0.9);
    add(p, new THREE.SphereGeometry(0.17, 14, 10), wt, 0, 0.34, 0.07).scale.set(1, 1.4, 0.6);
    add(p, new THREE.SphereGeometry(0.12, 12, 10), bk, 0, 0.78, 0);
    add(p, new THREE.ConeGeometry(0.04, 0.12, 6).rotateX(Math.PI / 2), or, 0, 0.76, 0.13);
    [-1, 1].forEach((s) =>
      add(p, new THREE.SphereGeometry(0.07, 8, 6), or, s * 0.1, 0.03, 0.05).scale.set(1, 0.4, 1.5)
    );
    g.add(p);
    P.push(p);
  }

  // A larger colony of still tinier penguins, batched into four instanced draws.
  const penT: InstanceTransform[] = [];
  for (let i = 0; i < 38; i++) {
    const [px, py, pz] = penguinSpot(i + 100);
    const sc = 0.42 + R(i + 5) * 0.14;
    penT.push({
      x: px,
      y: py,
      z: pz,
      ry: R(i + 90) * 6.28,
      sx: sc,
      sy: sc,
      sz: sc,
    });
  }
  instancedMeshes(
    g,
    new THREE.SphereGeometry(0.22, 12, 10).scale(1, 1.5, 0.9).translate(0, 0.38, 0),
    bk,
    penT
  );
  instancedMeshes(
    g,
    new THREE.SphereGeometry(0.17, 12, 10).scale(1, 1.4, 0.6).translate(0, 0.34, 0.07),
    wt,
    penT
  );
  instancedMeshes(g, new THREE.SphereGeometry(0.12, 10, 8).translate(0, 0.78, 0), bk, penT);
  instancedMeshes(
    g,
    new THREE.ConeGeometry(0.04, 0.12, 6).rotateX(Math.PI / 2).translate(0, 0.76, 0.13),
    or,
    penT
  );

  // Timber boardwalk crossing a channel between the clusters.
  const plankT: InstanceTransform[] = [];
  for (let z = -3.6; z <= 1.4; z += 0.24) plankT.push({ x: 1.2, y: 0.3, z });
  instancedMeshes(g, CB(0.9, 0.06, 0.15, 0.02), MWood('#9a7d55', 0.9), plankT);
  const postT: InstanceTransform[] = [];
  for (let z = -3.5; z <= 1.3; z += 0.9) {
    postT.push({ x: 0.72, y: 0.58, z });
    postT.push({ x: 1.68, y: 0.58, z });
  }
  instancedMeshes(g, CB(0.07, 0.6, 0.07, 0.015), MWood('#7d6443', 0.9), postT);
  [-1, 1].forEach((s) => {
    const x = 1.2 + s * 0.48;
    add(g, CB(0.07, 0.07, 5.1, 0.015), MWood('#7d6443', 0.9), x, 0.86, -1.1);
    add(g, CB(0.12, 0.12, 5.1, 0.02), MWood('#8a7050', 0.9), x, 0.25, -1.1);
  });

  // Coastal scrub around the back of the cove and soft shoreline surf lines.
  const shrubT: InstanceTransform[] = [];
  for (let i = 0; i < 34; i++) {
    const a = R(i + 140) * 6.28;
    const r = 4.9 + R(i + 160) * 1.0;
    shrubT.push({
      x: r * Math.cos(a),
      y: 0.2,
      z: -0.6 + r * Math.sin(a),
      sx: 0.4 + R(i + 2) * 0.3,
      sy: 0.22 + R(i + 4) * 0.18,
      sz: 0.4 + R(i + 6) * 0.3,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.3, 1), Mc('#6a7f45'), shrubT, [
    '#6a7f45',
    '#88964f',
    '#5b7038',
  ]);
  const shoreFoam = [4.65, 4.9].map((r, i) =>
    add(
      g,
      new THREE.TorusGeometry(r, 0.035, 6, 96).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: '#eafaff',
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      }),
      0,
      0.16 + i * 0.01,
      -0.6
    )
  );

  const sr = seaRings(g, 0.14, 4, 3);
  const bd = birds(g, 3, 3, 5);
  g.userData.tick = (t: number) => {
    P.forEach((p, i) => {
      p.rotation.z = Math.sin(t * 4 + i * 2) * (i % 3 ? 0.04 : 0.12);
      p.position.y = 0.2 + (i % 3 ? 0 : Math.abs(Math.sin(t * 4 + i * 2)) * 0.05);
    });
    sr(t);
    bd(t);
    shoreFoam.forEach((ring, i) => {
      ring.material.opacity = 0.18 + 0.14 * (0.5 + 0.5 * Math.sin(t * 1.6 + i));
      ring.position.y = 0.16 + i * 0.01 + Math.sin(t * 1.1 + i) * 0.02;
    });
  };
  return g;
}

export function agulhas(): THREE.Group {
  const g = new THREE.Group();
  const lt = G('#fff3b0', 2.6);
  const dk = M('#2b2d34', 0.45, 0.65);
  const rd = MPlaster('#c8342d', 0.6);
  const wh = MPlaster('#f4f2ec', 0.68);
  sea(g, '#165f82', '#2694ab');
  add(g, C(4.2, 4.6, 0.5, 64), MStone('#b5a98e', 0.94), -0.4, 0.25, 0);
  for (let i = 0; i < 14; i++) {
    const a = R(i) * 6.28;
    const r = 3.6 + R(i + 3) * 1.2;
    rock(
      g,
      0.35,
      0.55,
      0.5 + R(i + 7) * 0.5,
      -0.4 + r * Math.cos(a),
      r * Math.sin(a),
      '#766b5a',
      '#a0957d',
      0.12
    );
  }
  // Round Pharos tower, painted red with a single broad white band
  // (Cape Agulhas Lighthouse, Wikipedia "Characteristics").
  add(g, CB(1.5, 0.35, 1.5, 0.05), wh, -0.4, 0.62, 0);
  for (let i = 0; i < 6; i++) {
    add(
      g,
      C(0.62 - i * 0.045, 0.68 - i * 0.045, 0.62, 32),
      i === 4 ? wh : rd,
      -0.4,
      0.81 + i * 0.62,
      0
    );
  }
  add(g, C(0.5, 0.45, 0.12, 32), dk, -0.4, 4.3, 0);
  railing(g, 0.5, -0.4, 4.36, 0, dk, 10, 0.14, 0.012);
  add(g, C(0.3, 0.3, 0.4, 24), lt, -0.4, 4.55, 0);
  add(g, new THREE.ConeGeometry(0.38, 0.4, 24), rd, -0.4, 4.95, 0);
  // Keeper's museum house with pitched red-slate roof
  colonialHouse(g, {
    x: -2.4,
    y: 0.45,
    z: 1.3,
    w: 1.6,
    h: 0.62,
    d: 1.0,
    wall: '#f4f1ea',
    roof: '#b8352d',
  });
  add(g, CB(1.4, 0.12, 0.42, 0.02), MStone('#d8d0bc', 0.85), 2, 0.55, 2);

  const bm = new THREE.Group();
  bm.position.set(-0.4, 4.55, 0);
  g.add(bm);
  const bmat = new THREE.MeshBasicMaterial({
    color: '#fff4b8',
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  [0, Math.PI].forEach((a) => {
    const c = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 5, 16, 1, true).rotateZ(Math.PI / 2).translate(2.5, 0, 0),
      bmat
    );
    c.rotation.y = a;
    bm.add(c);
  });
  const sr = seaRings(g, 0.12, 3.6, 3);
  const spray = drift(
    g,
    50,
    '#eaf8ff',
    0.1,
    (i, t) => {
      const a = R(i * 3) * 6.28;
      const k = (t * 0.42 + R(i * 7)) % 1;
      const rad = 4.2 + k * 0.7;
      return [-0.4 + Math.cos(a) * rad, 0.15 + Math.sin(k * Math.PI) * 0.45, Math.sin(a) * rad];
    },
    0.42
  );
  const bd = birds(g, 4, 4, 6);
  g.userData.tick = (t: number) => {
    bm.rotation.y = t * 1.2;
    sr(t);
    spray(t);
    bd(t);
  };
  return g;
}

export function orlando(): THREE.Group {
  const g = new THREE.Group();
  const pal = ['#e84a5f', '#ff9a3c', '#f4d35e', '#4ecdc4', '#5b8def', '#9b59b6'];
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#868074', 0.94), 0, 0.1, 0);
  const T = (x: number, c1: string, c2: string) => {
    const p: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const y = (i * 6.4) / 24;
      p.push(new THREE.Vector2(1.3 + (y < 3.2 ? 1.4 : 1) * ((y - 3.2) / 3.2) ** 2, y));
    }
    add(
      g,
      tint(new THREE.LatheGeometry(p, 72), (k, X, Y, Z) => {
        const q = Math.sin(Math.atan2(Z, X) * 9 + Y * 2.4) + Math.sin(Y * 5);
        k.set(q > 0.6 ? c2 : q < -0.8 ? '#f2f2f2' : c1);
      }),
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.78,
        ...surfaceDetail('plaster', 0.015),
        side: THREE.DoubleSide,
      }),
      x,
      0.2,
      0
    ).scale.setScalar(0.85);
  };
  T(-2.4, '#2a6fd3', '#ffd23f');
  T(2.4, '#d9381e', '#ffd23f');
  add(g, CB(2.4, 0.15, 0.5, 0.02), M('#4b525c', 0.4, 0.7), 0, 4.8, 0);

  // Soweto colorful perimeter homes with pitched roofs
  for (let i = 0; i < 16; i++) {
    const a = i * 0.4;
    const r = 5.4 + R(i) * 1.2;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    const body = add(g, CB(0.7, 0.45, 0.55, 0.02), MPlaster(pal[i % 6], 0.78), x, 0.43, z);
    body.rotation.y = -a;
    const rf = add(g, gableRoofGeo(0.72, 0.56, 0.18, 0.04), M('#8a8f98', 0.45, 0.55), x, 0.65, z);
    rf.rotation.y = -a;
  }
  const jp = add(g, new THREE.SphereGeometry(0.09, 10, 8), M('#ff3b3b', 0.4), 0, 4.7, 0);
  const cd = add(g, B(0.02, 1, 0.02), M('#222'), 0, 4.7, 0);
  const bd = birds(g, 4, 3.5, 7.5);
  add(
    g,
    new THREE.RingGeometry(4.6, 5.2, 64).rotateX(-Math.PI / 2),
    MWet('#3a3b40', 0.85, 0.15, 0.05, 'plaster'),
    0,
    0.205,
    0
  );
  const oc = [0, 1, 2, 3, 4].map((i) => {
    const c = car(['#c33', '#eee', '#36c', '#fc3', '#2a9d8f'][i], 0.5);
    g.add(c);
    return c;
  });
  g.userData.tick = (t: number) => {
    const y = 4.7 - 3.4 * Math.abs(Math.sin(t * 1.2));
    jp.position.y = y;
    cd.scale.y = 4.7 - y + 0.01;
    cd.position.y = (4.7 + y) / 2;
    bd(t);
    oc.forEach((c, i) => {
      const a = i * 1.25 + t * 0.2;
      c.position.set(4.9 * Math.cos(a), 0.21, 4.9 * Math.sin(a));
      c.rotation.y = -a - Math.PI / 2;
    });
  };
  return g;
}

export function bourke(): THREE.Group {
  const g = new THREE.Group();
  const H: Array<[number, number, number]> = [
    [-1.5, 0.8, 0.9],
    [0.6, -0.4, 0.7],
    [2, 1.4, 0.55],
    [-0.2, 2.1, 0.5],
    [1.8, -1.8, 0.8],
    [-2.5, -1.4, 0.6],
    [-3.2, 1.8, 0.45],
  ];
  const sh = new THREE.Shape();
  const sw: THREE.Mesh[] = [];
  const rl = M('#4b525c', 0.45, 0.65);
  sh.absarc(0, 0, 5.5, 0, Math.PI * 2, false);
  H.forEach(([x, y, r]) => {
    const h = new THREE.Path();
    h.absarc(x, y, r, 0, Math.PI * 2, true);
    sh.holes.push(h);
  });
  const a = new THREE.Color('#867154');
  const b = new THREE.Color('#e2d2ae');
  add(
    g,
    tint(
      new THREE.ExtrudeGeometry(sh, {
        depth: 1.1,
        bevelEnabled: true,
        bevelSize: 0.04,
        bevelThickness: 0.04,
        bevelSegments: 1,
        curveSegments: 32,
      }).rotateX(-Math.PI / 2),
      (k, _X, Y) => k.copy(a).lerp(b, Math.min(1, Y / 1.1 + 0.05 * Math.sin(Y * 30)))
    ),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      ...surfaceDetail('stone', 0.03),
      side: THREE.DoubleSide,
    })
  );
  const potholeWater = MWater('#288ca8', 0.09, 0.25);
  H.forEach(([x, y, r]) => {
    add(g, new THREE.CircleGeometry(r * 0.97, 32).rotateX(-Math.PI / 2), potholeWater, x, 0.7, -y);
    sw.push(
      add(
        g,
        new THREE.RingGeometry(r * 0.35, r * 0.9, 24, 1, 0, 2.2).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({
          color: '#e8fbff',
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
        x,
        0.72,
        -y
      )
    );
  });
  add(g, CB(5.2, 0.09, 0.62, 0.02), MWood('#7a583a', 0.82), 0, 1.35, 0);
  const railPostT: InstanceTransform[] = [];
  [-0.3, 0.3].forEach((z) => {
    add(g, CB(5.2, 0.05, 0.05, 0.01), rl, 0, 1.65, z);
    for (let i = 0; i < 6; i++) railPostT.push({ x: -2.4 + i * 0.96, y: 1.5, z });
  });
  instancedMeshes(g, CB(0.05, 0.35, 0.05, 0.01), rl, railPostT);
  [-1, 1].forEach((s) =>
    add(g, CB(0.22, 1.35, 0.8, 0.03), MStone('#7a5a3c', 0.88), s * 2.7, 0.7, 0)
  );
  rock(g, 1.5, 2.2, 3.2, -5.4, -3, '#7b6a4a', '#b39968', 0.14);
  rock(g, 1.2, 1.9, 2.6, 5.2, -3.6, '#7b6a4a', '#b39968', 0.14);
  for (let i = 0; i < 7; i++) {
    const q = i * 0.9 + 0.6;
    tree(g, 6.4 * Math.cos(q), 6.4 * Math.sin(q), 0.82, i % 2 ? 1 : 2);
  }
  const ms = drift(g, 45, '#eaf6ff', 0.08, (i, t) => [
    Math.cos(i * 2.4 + t * 0.1) * (1 + R(i) * 4),
    1 + ((R(i + 3) * 2 + t * 0.15) % 1.6),
    Math.sin(i * 2.4 + t * 0.1) * (1 + R(i) * 4),
  ]);
  g.userData.tick = (t: number) => {
    sw.forEach((o, i) => {
      o.rotation.y = t * (0.8 + i * 0.15) * (i % 2 ? 1 : -1);
    });
    ms(t);
  };
  return g;
}

