import * as THREE from 'three';
import { registerBeacons } from '../beacons';
import {
  add,
  B,
  bird,
  birds,
  boat,
  C,
  cableBatch,
  car,
  catenaryTube,
  CB,
  colonialHouse,
  drift,
  fynbos,
  G,
  gableRoofGeo,
  gondola,
  grassTufts,
  instancedMeshes,
  litWindowMaterial,
  M,
  MBark,
  Mc,
  MCascade,
  mergeByMaterial,
  MGlass,
  MPlaster,
  MStone,
  MT,
  MWater,
  MWet,
  MWood,
  n,
  person,
  protea,
  R,
  railing,
  rock,
  rondavel,
  scatterRocks,
  sea,
  seaRings,
  silverTree,
  swayItems,
  surfaceDetail,
  tint,
  train,
  tree,
  weatherVertexColors,
  type InstanceTransform,
} from './primitives';
import { headingYaw, leftLaneOffset } from '../../lib/trafficMath';
import { getSoftTexture, prepareCanvasTexture } from '../shaders';
import {
  addLighthouseSweep,
  addStreetLampSet,
  corniceBand,
  doorSurround,
  facadeWindow,
  shopfrontBand,
  type StreetLampSpec,
} from './dioramaKit';
import { bench, bin, crateStack, flagpole, interpretiveSign, kraalFence, washingLine } from './propKit';
import { attachVehicleLights } from './vehicleLightKit';

/** One deep Platteklip notch on the north-facing cliff, shared by cap and cliffs. */
const platteklip = (x: number, z: number): number => {
  if (z <= 0) return 0;
  const across = (x + 0.35) / 0.62;
  return Math.exp(-across * across) * Math.min(1, z / 1.2);
};

const warpTable = <T extends THREE.BufferGeometry>(geo: T, cap: boolean): T => {
  const p = geo.attributes.position;
  const a1 = new THREE.Color('#797a73');
  const a2 = new THREE.Color('#aaa394');
  const a3 = new THREE.Color('#697051');
  const aoDark = new THREE.Color('#565d5b');
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
  add(g, B(12.4, 0.5, 12.4), MStone('#697051', 0.95), 0, 0.25, 0);
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
  lump(g, 1.5, -4.9, 1.9, 1.0, 1.15, '#797a73', '#aaa394');
  lump(g, 1.6, 4.6, 0.8, 1.3, 1.0, '#797a73', '#c5af8a');
  lump(g, 1.2, -1.5, -4.6, 2.0, 0.4, '#697051', '#9a9a7a');

  // Tablecloth mist cascades gracefully over the windward (north) rim only.
  const cmOuter = MT('#dce4ec', 0.38, 0.96, 0, false);
  const cmInner = MT('#eaeef2', 0.48, 0.96, 0, false);
  const cl: THREE.Mesh[] = [];
  for (let i = 0; i < 16; i++) {
    const x = -3.2 + i * 0.42;
    const z = Math.sqrt(Math.max(0.4, 12.4 - x * x)) * 0.79;
    const mat = i % 2 === 0 ? cmOuter : cmInner;
    const o = add(g, new THREE.IcosahedronGeometry(0.52, 2), mat, x, 2.75 + (i % 3) * 0.09, z);
    o.scale.set(1.25 + R(i) * 0.3, 0.48 + R(i + 2) * 0.2, 0.98);
    o.userData.x = x;
    cl.push(o);
  }
  [-2.1, -1.0, 0.1, 1.3, 2.2].forEach((x, idx) => {
    const o = add(g, new THREE.IcosahedronGeometry(0.48, 2), cmOuter, x, 2.3 - idx * 0.07, 3.5);
    o.scale.set(1.22, 0.85, 0.62);
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
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.45, 1), Mc('#697051'), fynbosTransforms, [
    '#5f7042',
    '#7a7f4e',
    '#8a8260',
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
  scatterRocks(g, torTransforms, '#797a73', '#aaa394');

  // Maclear's Beacon stone cairn at the eastern plateau
  const beaconStone = MStone('#aaa394', 0.94, 0.03);
  add(g, C(0.17, 0.21, 0.18, 8), beaconStone, 2.55, 2.74, -0.8);
  add(g, C(0.11, 0.15, 0.16, 8), beaconStone, 2.58, 2.9, -0.8);
  add(g, C(0.05, 0.09, 0.13, 8), beaconStone, 2.52, 3.04, -0.8);
  const trailSign = interpretiveSign('#d8a64a');
  trailSign.position.set(3.15, 2.68, 0.35);
  trailSign.scale.setScalar(0.7);
  g.add(trailSign);

  // Lower & Upper Cableway stations with curved steel roof decks + volumetric sagged cables
  const cableMat = M('#2d333b', 0.38, 0.78);
  add(g, CB(0.78, 0.48, 0.66, 0.04), MPlaster('#d4cfc4', 0.72), 1.0, 0.78, 6.4);
  add(g, CB(0.88, 0.09, 0.74, 0.02), M('#3b4248', 0.45, 0.55), 1.0, 1.05, 6.4);
  add(g, CB(0.7, 0.42, 0.64, 0.04), MPlaster('#d8d3c8', 0.72), 1.0, 2.85, 3.3);
  add(g, CB(0.78, 0.08, 0.72, 0.02), M('#3b4248', 0.45, 0.55), 1.0, 3.09, 3.3);
  // Twin volumetric haul + track cables
  catenaryTube(g, [1.0, 1.08, 6.4], [1.0, 2.92, 3.4], 0.14, 0.016, cableMat, 20);
  catenaryTube(g, [1.4, 1.08, 6.4], [1.4, 2.92, 3.4], 0.14, 0.016, cableMat, 20);
  addStreetLampSet(g, [
    { x: 0.48, y: 0.54, z: 6.18, kind: 'bollard', scale: 0.9, color: '#ffd58a' },
    { x: 1.54, y: 0.54, z: 6.18, kind: 'bollard', scale: 0.9, color: '#ffd58a' },
    { x: 0.52, y: 2.66, z: 3.15, kind: 'bollard', scale: 0.82, color: '#ffd58a' },
    { x: 1.48, y: 2.66, z: 3.15, kind: 'bollard', scale: 0.82, color: '#ffd58a' },
  ]);

  for (let i = 0; i < 8; i++) {
    const a = 3 + i * 0.2;
    lump(
      g,
      0.75 + R(i) * 0.3,
      6.4 * Math.cos(a),
      6.4 * Math.sin(a),
      1,
      1.2,
      i % 2 ? '#797a73' : '#8e937f'
    );
  }
  // Sculpted sandstone cliff buttresses flanking Platteklip Gorge
  rock(g, 0.42, 0.95, 2.15, -0.42, 3.85, '#797a73', '#aaa394', 0.14, 0.35);
  rock(g, 0.38, 0.82, 2.0, 1.65, 3.72, '#797a73', '#aaa394', 0.12, 0.35);
  rock(g, 0.4, 0.88, 2.05, -2.05, 3.55, '#797a73', '#aaa394', 0.12, 0.35);

  const cab = gondola('#32373d');
  const cab2 = gondola('#32373d');
  g.add(cab, cab2);
  // Peninsula fynbos, not conifers, on the lower slopes (research §3.1 / #11).
  [1.8, 2, 2.2, 2.4, -0.5, -0.8, -1.1].forEach((a, i) => {
    const x = 6.3 * Math.cos(a);
    const z = 6.3 * Math.sin(a);
    const sc = 0.9 + R(i) * 0.35;
    if (i % 3 === 0) silverTree(g, x, 0.5, z, sc, a);
    else if (i % 3 === 1) protea(g, x, 0.5, z, sc, a);
    else fynbos(g, x, 0.5, z, sc, a);
  });
  const gls = [0, 1, 2, 3, 4].map(() => {
    const b = bird();
    g.add(b);
    return b;
  });
  const mistFlow = drift(
    g,
    55,
    '#e4eef8',
    0.16,
    (i, t) => {
      const u = (t * 0.22 + R(i * 5)) % 1;
      return [-2.6 + R(i * 3) * 5.2, 2.78 - u * 0.72 + Math.sin(t + i) * 0.06, 3.2 + u * 1.15];
    },
    0.42
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
    const sag1 = 0.14 * 4 * u * (1 - u);
    const sag2 = 0.14 * 4 * (1 - u) * u;
    cab.position.set(1, 1.08 + 1.84 * u - sag1, 6.4 - 3 * u);
    cab2.position.set(1.4, 1.08 + 1.84 * (1 - u) - sag2, 6.4 - 3 * (1 - u));
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
  const st = MStone('#b9a484', 0.85, 0.022);
  const dk = MStone('#6a635b', 0.88, 0.025);
  const rf = MPlaster('#8f513c', 0.78);
  const cu = M('#556b60', 0.48, 0.42); // weathered copper patina globe
  const domeStone = MStone('#b9a888', 0.85, 0.022);
  const gr = M('#66704a', 0.94);
  const plaza = MWet('#b9a484', 0.84, 0.16, 0.04, 'stone');
  const wn = G('#ffd58e', 1.1);
  dk.side = THREE.DoubleSide;

  // Meintjieskop hillside & stepped dark-granite terraced lawns
  add(g, CB(12.6, 0.8, 5.4, 0.06), dk, 0, 0.4, -2.5);
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
  add(g, CB(12.0, 0.1, 0.9, 0.03), plaza, 0, 0.05, 2.95);
  add(g, CB(11.5, 0.04, 0.6, 0.015), gr, 0, 0.11, 2.95);
  add(g, CB(12.0, 0.08, 0.7, 0.03), plaza, 0, 0.04, 3.7);
  add(g, CB(11.5, 0.035, 0.5, 0.015), gr, 0, 0.09, 3.7);
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

  // Central hall linking the two wings
  add(g, CB(2.8, 1.7, 1.4, 0.04), st, 0, 1.65, -3.8);
  add(g, CB(3.0, 0.12, 1.6, 0.03), dk, 0, 2.56, -3.8);
  add(g, gableRoofGeo(3.0, 1.6, 0.38, 0.08), rf, 0, 2.62, -3.8);
  add(g, CB(0.34, 0.8, 0.05, 0.012), wn, 0, 1.3, -3.08);

  // Sculpted classical triangular pediment geometry
  const pedShape = new THREE.Shape();
  pedShape.moveTo(-1.42, 0);
  pedShape.lineTo(0, 0.55);
  pedShape.lineTo(1.42, 0);
  pedShape.closePath();
  const pedGeo = new THREE.ExtrudeGeometry(pedShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 2,
  }).translate(0, 0, -0.13);

  const fl = M('#dce0e4', 0.35, 0.65);
  const hd = M('#66704a', 0.92);
  const sb = M('#ddd4bf', 0.82);
  const bz = M('#7c5e34', 0.38, 0.72);
  const clockFaceMat = M('#dbd5c6', 0.62);
  const clockHandMat = M('#1b1f24', 0.5);
  const flagMat = MT('#007749', 1, 0.6, 0, true);
  const flags: THREE.Mesh[] = [];
  const roofTileT: InstanceTransform[] = [];
  const wingWinT: InstanceTransform[] = [];
  const domeWinT: InstanceTransform[] = [];

  [-1, 1].forEach((s) => {
    add(g, CB(2.65, 2.0, 2.4, 0.04), st, s * 5.1, 1.8, -1.2);
    add(g, CB(2.86, 0.16, 2.6, 0.03), dk, s * 5.1, 2.86, -1.2);
    add(g, gableRoofGeo(2.58, 2.34, 0.52, 0.1), rf, s * 5.1, 2.92, -1.2);

    // Baker Bell / Clock Tower with stone cupola
    add(g, CB(1.3, 3.6, 1.3, 0.04), st, s * 5.8, 2.6, -0.9);
    add(g, C(0.56, 0.66, 0.52, 24), st, s * 5.8, 4.65, -0.9);
    add(
      g,
      new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      domeStone,
      s * 5.8,
      4.9,
      -0.9
    );
    // Crisp clock face with stone bezel + hour/minute hands
    add(g, C(0.28, 0.28, 0.04, 20).rotateX(Math.PI / 2), dk, s * 5.8, 3.85, -0.24);
    add(g, C(0.23, 0.23, 0.05, 20).rotateX(Math.PI / 2), clockFaceMat, s * 5.8, 3.85, -0.22);
    add(g, CB(0.024, 0.14, 0.02, 0.004), clockHandMat, s * 5.8, 3.9, -0.19);
    add(g, CB(0.11, 0.022, 0.02, 0.004), clockHandMat, s * 5.8 + 0.05, 3.85, -0.19);

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
    // Portico pillars & authentic ExtrudeGeometry Classical pediment
    for (let j = 0; j < 4; j++) {
      add(g, C(0.07, 0.08, 2.0, 12), st, s * 5.1 + (j - 1.5) * 0.75, 1.8, 0.2);
    }
    add(g, pedGeo, st, s * 5.1, 2.86, 0.18);

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
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      domeWinT.push({
        x: s * 5.8 + 0.6 * Math.cos(a),
        y: 4.65,
        z: -0.9 + 0.6 * Math.sin(a),
        ry: -a + Math.PI / 2,
      });
    }
    // Atlas sculpture with bronze globe
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

  // Recessed sandstone window reveals and string courses
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
          frame: '#b9a484',
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
      color: '#6a635b',
    });
    corniceBand(unionFacade, {
      x: s * 5.1,
      y: 2.9,
      z: 0.02,
      width: 2.86,
      depth: 0.18,
      height: 0.12,
      color: '#6a635b',
    });
  });
  facadeWindow(unionFacade, {
    x: 0,
    y: 1.3,
    z: -3.06,
    width: 0.5,
    height: 0.9,
    depth: 0.1,
    frame: '#b9a484',
    glass: '#2a2118',
  });
  corniceBand(unionFacade, {
    x: 0,
    y: 2.5,
    z: -3.05,
    width: 3.0,
    depth: 0.18,
    height: 0.12,
    color: '#6a635b',
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

  // Grand central stairways + articulated Nelson Mandela bronze statue (curved outstretched arms)
  (
    [
      [2.2, 0.2],
      [1.5, 0.4],
      [0.9, 0.6],
    ] as const
  ).forEach(([z, h]) => add(g, CB(1.6, h + 0.03, 1, 0.02), sb, 0, (h + 0.03) / 2, z));
  add(g, CB(0.76, 0.5, 0.76, 0.03), st, 0, 1.05, -0.4);
  add(g, C(0.11, 0.15, 0.78, 12), bz, 0, 1.69, -0.4);
  add(g, new THREE.SphereGeometry(0.11, 14, 10), bz, 0, 2.18, -0.4);
  for (const side of [-1, 1]) {
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.1, 1.98, -0.4),
      new THREE.Vector3(side * 0.36, 2.04, -0.34),
      new THREE.Vector3(side * 0.64, 2.12, -0.24),
    ]);
    add(g, new THREE.TubeGeometry(armCurve, 8, 0.042, 6), bz);
  }

  // Garden Victorian streetlamps, Mandela statue uplights + promenade bollards
  addStreetLampSet(g, [
    { x: -3.4, y: 0.62, z: 0.9, kind: 'victorian', scale: 0.92, color: '#ffd488' },
    { x: -1.4, y: 0.62, z: 0.9, kind: 'victorian', scale: 0.92, color: '#ffd488' },
    { x: 1.4, y: 0.62, z: 0.9, kind: 'victorian', scale: 0.92, color: '#ffd488' },
    { x: 3.4, y: 0.62, z: 0.9, kind: 'victorian', scale: 0.92, color: '#ffd488' },
    { x: -0.62, y: 0.78, z: -0.36, kind: 'uplight', scale: 0.95, color: '#ffe09c', coneHeight: 1.35 },
    { x: 0.62, y: 0.78, z: -0.36, kind: 'uplight', scale: 0.95, color: '#ffe09c', coneHeight: 1.35 },
    { x: -4.2, y: 0.07, z: 3.92, kind: 'victorian', scale: 1.02, color: '#ffd080' },
    { x: -1.9, y: 0.07, z: 3.92, kind: 'victorian', scale: 1.02, color: '#ffd080' },
    { x: 1.9, y: 0.07, z: 3.92, kind: 'victorian', scale: 1.02, color: '#ffd080' },
    { x: 4.2, y: 0.07, z: 3.92, kind: 'victorian', scale: 1.02, color: '#ffd080' },
  ]);
  for (let i = 0; i < 12; i++) {
    tree(g, (i < 6 ? -1 : 1) * (3.6 + (i % 6) * 0.8), 3.2 + (i % 2) * 0.5, 1.15 + R(i) * 0.4, 0);
  }
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

  // Human-scale context on the terraced gardens (#10) + SA flagpoles.
  (
    [
      [-3.4, 0.24, 2.25, 0.2],
      [-1.2, 0.44, 1.5, 1.4],
      [1.4, 0.24, 2.25, 2.8],
      [3.5, 0.44, 1.5, 4.3],
      [-2.2, 0.07, 4.6, 1.0],
      [2.2, 0.07, 4.6, 4.0],
    ] as const
  ).forEach(([x, y, z, ry]) => person(g, x, y, z, 0.95, ry));
  flagpole(g, -4.5, 0.18, 3.25, 1, 0, '#007749');
  flagpole(g, 4.5, 0.18, 3.25, 1, 0, '#007749');

  add(g, CB(12.4, 0.06, 0.9, 0.02), plaza, 0, 0.04, 4.6);
  const laneT: InstanceTransform[] = [];
  for (let i = -7; i <= 7; i++) laneT.push({ x: i * 0.8, y: 0.08, z: 4.6 });
  instancedMeshes(g, CB(0.32, 0.012, 0.03, 0.006), M('#d8d2c4', 0.85), laneT);
  const cars = ['#8d2f2b', '#dedad2', '#2a6fd3', '#d8a53a'].map((col, i) => {
    const c = car(col, 0.26, false);
    const lane = leftLaneOffset(i % 2 ? 1 : -1, 0, 0.18);
    c.position.set(0, 0.08, 4.6 + lane.z);
    c.rotation.y = headingYaw(i % 2 ? 1 : -1, 0);
    g.add(c);
    return c;
  });
  const carLights = attachVehicleLights(g, cars);

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
      c.position.x = ((((t * 0.5 * d + i * 3.2) % 12.4) + 12.4) % 12.4) - 6.2;
      c.rotation.y = headingYaw(d, 0);
    });
    carLights.sync();
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
  const sh = MPlaster('#dbd6cd', 0.56, 0.012, 0.08);
  const st = M('#d8dde2', 0.32, 0.65);
  const cableMat = M('#bfc7d0', 0.35, 0.75);
  const gl = G('#8fd4ff', 1.25);
  sh.side = THREE.DoubleSide;
  const BOWL_SCALE = 0.82;
  const rimY = 2.4 * BOWL_SCALE;
  const bowl = new THREE.Group();
  bowl.scale.y = BOWL_SCALE;
  g.add(bowl);

  // Feathered blue-teal-to-ivory Durban seating bowl gradient (replaces flat bands)
  const seatCv = document.createElement('canvas');
  seatCv.width = 512;
  seatCv.height = 128;
  const sx = seatCv.getContext('2d')!;
  const sg = sx.createLinearGradient(0, 0, 0, 128);
  sg.addColorStop(0.0, '#d6d2c6');
  sg.addColorStop(0.28, '#558c94');
  sg.addColorStop(0.55, '#d0ccc0');
  sg.addColorStop(0.82, '#3a6f7a');
  sg.addColorStop(1.0, '#29545e');
  sx.fillStyle = sg;
  sx.fillRect(0, 0, 512, 128);
  // Crisp radial aisle vomitories + horizontal seating rows
  sx.fillStyle = 'rgba(28,36,42,0.34)';
  for (let i = 0; i < 32; i++) sx.fillRect(i * 16 + 7, 0, 2, 128);
  sx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let r = 0; r < 16; r++) sx.fillRect(0, r * 8, 512, 1);
  const seatTex = prepareCanvasTexture(new THREE.CanvasTexture(seatCv));
  seatTex.colorSpace = THREE.SRGBColorSpace;
  const seatMat = new THREE.MeshStandardMaterial({
    map: seatTex,
    roughness: 0.78,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const pr = [
    [2.3, 0.15],
    [3.2, 1.3],
    [3.9, 2.1],
    [4.4, 2.35],
    [4.4, 1.2],
    [4.2, 0],
  ].map((p) => new THREE.Vector2(...p));
  add(bowl, new THREE.LatheGeometry(pr, 96), sh);
  // Inner seating cone with UV gradient
  add(
    bowl,
    new THREE.CylinderGeometry(3.85, 2.34, 1.85, 96, 1, true),
    seatMat,
    0,
    1.12,
    0
  );
  add(bowl, new THREE.CircleGeometry(2.3, 64).rotateX(-Math.PI / 2), M('#3b8646', 0.95), 0, 0.16, 0);
  add(bowl, new THREE.TorusGeometry(4.35, 0.1, 10, 128).rotateX(Math.PI / 2), gl, 0, 2.35, 0);
  add(bowl, new THREE.TorusGeometry(4.4, 0.05, 8, 128).rotateX(Math.PI / 2), gl, 0, 1.3, 0);

  // Split-Y signature parabolic box-girder arch spine
  const H = 7.2;
  const yFn = (x: number) => Math.max(0.1, H * (1 - (x / 5.6) ** 2));
  const dzFn = (x: number, s: number) =>
    s * (x < -0.7 ? Math.pow((-0.7 - x) / 4.9, 1.25) * 1.45 + 0.08 : 0.08);

  [-1, 1].forEach((s) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -5.6 + i * 0.28;
      pts.push(new THREE.Vector3(x, yFn(x), dzFn(x, s)));
    }
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.135, 10), st);
  });

  // Volumetric cable stays & arch cross-braces (zero 1px WebGL lines!)
  const archSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
  for (let x = -3.6; x <= 3.7; x += 0.34) {
    const zo = Math.sqrt(Math.max(0, 4.42 * 4.42 - x * x));
    [-1, 1].forEach((s) => {
      archSegs.push([[x, yFn(x), dzFn(x, s)], [x, rimY, s * zo]]);
      if (Math.abs(x) < 3.25) {
        const zi = Math.sqrt(Math.max(0, 3.3 * 3.3 - x * x));
        archSegs.push([[x, yFn(x), dzFn(x, s)], [x, 2.15 * BOWL_SCALE, s * zi]]);
      }
    });
    archSegs.push([[x, yFn(x), dzFn(x, -1)], [x, yFn(x), dzFn(x, 1)]]);
  }
  cableBatch(g, archSegs, 0.015, cableMat);

  // 96 instanced curved facade aluminum louvers
  const finTransforms: InstanceTransform[] = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * 6.2832;
    finTransforms.push({ x: 4.38 * Math.cos(a), y: 1.18, z: 4.38 * Math.sin(a), ry: -a });
  }
  instancedMeshes(bowl, CB(0.055, 2.35, 0.14, 0.015), M('#c9cfd6', 0.38, 0.65), finTransforms);

  const fm = M('#c9cfd6', 0.38, 0.65);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5708 + 0.785;
    const x = 4.6 * Math.cos(a);
    const z = 4.6 * Math.sin(a);
    add(g, C(0.03, 0.05, 3.2, 8), fm, x, 3.2, z);
    add(g, CB(0.5, 0.3, 0.1, 0.02), gl, x, 4.9, z).lookAt(0, 2, 0);
  }
  // Crisp volumetric pitch touchlines + halfway circle
  const pitchLineMat = M('#e3e6e1', 0.85);
  add(bowl, CB(3.0, 0.018, 0.04, 0.005), pitchLineMat, 0, 0.175, -1.0);
  add(bowl, CB(3.0, 0.018, 0.04, 0.005), pitchLineMat, 0, 0.175, 1.0);
  add(bowl, CB(0.04, 0.018, 2.04, 0.005), pitchLineMat, -1.5, 0.175, 0);
  add(bowl, CB(0.04, 0.018, 2.04, 0.005), pitchLineMat, 1.5, 0.175, 0);
  add(bowl, CB(0.04, 0.018, 2.0, 0.005), pitchLineMat, 0, 0.175, 0);
  add(bowl, new THREE.RingGeometry(0.3, 0.335, 48).rotateX(-Math.PI / 2), pitchLineMat, 0, 0.18, 0);

  // Translucent PTFE hung roof canopy + volumetric radial trusses
  const rm = MT('#cfc0a2', 0.72, 0.55, 0.05, true);
  add(
    bowl,
    new THREE.LatheGeometry([new THREE.Vector2(3.3, 2.15), new THREE.Vector2(4.45, 2.4)], 84),
    rm
  );
  const roofTrussSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * 6.2832;
    const c = Math.cos(a);
    const s = Math.sin(a);
    roofTrussSegs.push([[3.3 * c, 2.15, 3.3 * s], [4.45 * c, 2.4, 4.45 * s]]);
  }
  cableBatch(bowl, roofTrussSegs, 0.018, M('#9ea8b4', 0.4, 0.65));

  // Wettable Durban coastal concourse apron + radial promenade bollards
  add(g, B(11.4, 0.12, 11.4), MWet('#beb8ac', 0.84, 0.18, 0.05, 'stone'), 0, 0.06, 0);
  const stadiumLamps: StreetLampSpec[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.16;
    stadiumLamps.push({
      x: Math.cos(a) * 5.05,
      y: 0.12,
      z: Math.sin(a) * 5.05,
      kind: 'bollard',
      scale: 0.96,
      color: '#d8f2ff',
      poolRadius: 0.92,
    });
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5708 + 0.785;
    stadiumLamps.push({
      x: Math.cos(a) * 4.82,
      y: 0.12,
      z: Math.sin(a) * 4.82,
      kind: 'uplight',
      scale: 1.15,
      color: '#bfe8ff',
      coneHeight: 2.35,
      coneRadius: 0.85,
      poolRadius: 1.05,
    });
  }
  addStreetLampSet(g, stadiumLamps);
  [-1, 1].forEach((s) =>
    add(g, CB(0.65, 0.5, 0.65, 0.04), MStone('#9e9d98', 0.88), -5.6, 0.25, s * 1.7)
  );
  add(g, CB(0.75, 0.5, 0.95, 0.04), MStone('#9e9d98', 0.88), 5.6, 0.25, 0);
  for (let i = 0; i < 5; i++)
    add(g, B(0.3, 0.01, 2.0), M(i % 2 ? '#4d9d58' : '#3a8446', 0.95), -1.2 + i * 0.6, 0.17, 0);
  const sk = gondola('#b94838');
  g.add(sk);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.2832 + 0.2;
    tree(g, 6.9 * Math.cos(a), 6.9 * Math.sin(a), 0.95 + R(i) * 0.25, i % 2 ? 3 : 1);
  }
  g.userData.tick = (t: number) => {
    const x = -5.2 + 10.4 * (Math.sin(t * 0.25) * 0.5 + 0.5);
    sk.position.set(x, yFn(x) - 0.1, 0);
    sk.rotation.z = Math.cos(t * 0.25) * 0.12;
    gl.color.setHSL(0.54 + 0.03 * Math.sin(t * 0.55), 0.78, 0.72);
    gl.emissive.copy(gl.color);
  };
  g.scale.setScalar(0.95);
  return g;
}

export function bridge(): THREE.Group {
  const g = new THREE.Group();
  const wh = M('#d4d9d8', 0.34, 0.45);
  const dk = MStone('#31353e', 0.82, 0.018);
  const concPier = MStone('#9b9992', 0.88, 0.02);
  const roadMat = MWet('#41474b', 0.82, 0.14, 0.05, 'plaster');
  const bd = G('#ffd79a', 1.15);
  const staySegs: Array<readonly [[number, number, number], [number, number, number]]> = [];

  // Cantilevered deck + trapezoidal structural steel spine box girder
  add(g, CB(15, 0.14, 1.6, 0.03), roadMat, 0, 1.7, 0);
  add(g, CB(14.8, 0.16, 1.0, 0.02), dk, 0, 1.56, 0);
  [-7.4, 7.4].forEach((x) => add(g, CB(1.25, 1.7, 1.82, 0.05), dk, x, 0.85, 0));

  // Asymmetric 42m north & 27m south twin-pylon towers (concrete pier base + steel H/X upper masts)
  const nightWash = G('#6b9dff', 0.72);
  (
    [
      [-2.3, 7.2, 8.9],
      [2.5, 4.8, 6.5],
    ] as const
  ).forEach(([mx, ph, topY]) => {
    [-0.9, 0.9].forEach((mz) => {
      add(g, CB(0.32, 1.7, 0.32, 0.03), concPier, mx, 0.85, mz);
      add(g, C(0.068, 0.14, ph, 12), wh, mx, 1.7 + ph / 2, mz);
      add(g, new THREE.SphereGeometry(0.08, 12, 8), G('#ff3b3b', 1.9), mx, topY, mz);
      add(g, C(0.085, 0.085, 0.14, 12), nightWash, mx, 2.2, mz);
      for (let i = -6; i <= 6; i++) {
        if (!i) continue;
        staySegs.push([[mx, topY - 0.15 - Math.abs(i) * 0.26, mz], [mx + i * 0.55, 1.82, mz]]);
      }
    });
    // Cross-portal H-beam & diagonal X-bracing trusses
    add(g, CB(0.24, 0.2, 1.85, 0.02), wh, mx, topY - 0.8, 0);
    add(g, CB(0.22, 0.18, 1.85, 0.02), wh, mx, topY - 2.4, 0);
    staySegs.push([[mx, topY - 0.85, -0.88], [mx, topY - 2.35, 0.88]]);
    staySegs.push([[mx, topY - 0.85, 0.88], [mx, topY - 2.35, -0.88]]);
  });
  cableBatch(g, staySegs, 0.015, M('#c2cccf', 0.35, 0.75));

  // Glass pedestrian windscreens along bridge sides
  for (const s of [-0.82, 0.82]) {
    add(g, CB(13.8, 0.24, 0.025, 0.005), MGlass('#a8d6e4', 0.45, 0.06), 0, 1.9, s);
  }

  // 42 real rail lines (#15b): one low-poly instanced strip per line. Wider
  // spacing across the yard keeps the deck clearance readable, and a plain box
  // instead of a rounded one keeps the batch cheap (12 tris × 42 = 504).
  const railTransforms: InstanceTransform[] = [];
  for (let k = 0; k < 42; k++) railTransforms.push({ x: 0, y: 0.05, z: -5.8 + k * 0.28 });
  instancedMeshes(g, B(18, 0.035, 0.05), M('#6e6960', 0.4, 0.8), railTransforms);
  for (const gx of [-5.2, 5.2]) {
    add(g, CB(0.06, 0.95, 0.06, 0.01), dk, gx, 0.48, -3.5);
    add(g, CB(0.06, 0.95, 0.06, 0.01), dk, gx, 0.48, 3.3);
    add(g, CB(0.06, 0.06, 6.9, 0.01), dk, gx, 0.95, -0.1);
  }

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

  // High-res Braamfontein office towers + Hillbrow + Sentech Tower
  const wt = litWindowMaterial({
    wall: '#343842',
    lit: '#ffd98a',
    dark: '#1f242c',
    cols: 8,
    rows: 16,
    seed: 11,
    chance: 0.56,
    intensity: 0.48,
  });
  // One instanced batch for the tower row, tinted per instance so the repeated
  // blocks do not read as the same building copy-pasted down the street.
  const towerT: InstanceTransform[] = [];
  const towerCols: THREE.Color[] = [];
  for (let i = 0; i < 16; i++) {
    const k = (i * 37) % 7;
    const h = 1.15 + k * 0.55;
    towerT.push({ x: -7.4 + i * 0.98, y: h / 2, z: -5.8 + (i % 3) * 0.55, sy: h });
    const towerTint = 0.88 + (0.22 * ((i * 53) % 7)) / 7;
    towerCols.push(
      new THREE.Color(
        towerTint,
        towerTint * (0.97 + 0.03 * (i % 3)),
        towerTint * (1.02 - 0.04 * (i % 5))
      )
    );
  }
  instancedMeshes(g, CB(0.92, 1, 0.92, 0.03), wt, towerT, towerCols);
  // Braamfontein stepped landmark office tower (replaces fake cylinder)
  add(g, CB(1.5, 3.6, 1.3, 0.04), wt, -5.5, 1.8, -4.1);
  add(g, CB(1.1, 1.4, 0.95, 0.04), wt, -5.5, 4.3, -4.1);
  // Street-level shopfronts: the city stays awake after the offices go dark.
  shopfrontBand(g, {
    x: -0.55,
    y: 0.3,
    z: -4.18,
    width: 13.4,
    height: 0.34,
    lit: '#ffcf86',
    seed: 23,
    chance: 0.82,
  });
  shopfrontBand(g, {
    x: -5.5,
    y: 0.3,
    z: -3.4,
    width: 1.35,
    height: 0.3,
    lit: '#ffe0a6',
    seed: 41,
    chance: 0.7,
  });

  const yl = M('#e8c84a', 0.6);
  const dashT: InstanceTransform[] = [];
  for (let i = 0; i < 20; i++) dashT.push({ x: -7 + i * 0.75, y: 1.79, z: 0 });
  instancedMeshes(g, B(0.4, 0.01, 0.05), yl, dashT);

  const bridgeLamps: StreetLampSpec[] = [];
  [-0.8, 0.8].forEach((z) => {
    add(g, CB(15, 0.1, 0.05, 0.015), wh, 0, 1.82, z);
    const ry = z > 0 ? Math.PI / 2 : -Math.PI / 2;
    for (let i = 0; i < 5; i++) {
      const x = -5.4 + i * 2.7;
      bridgeLamps.push({
        x,
        y: 1.82,
        z,
        kind: 'cobra',
        ry,
        scale: 0.78,
        color: '#ffbc6b',
        poolRadius: 1.05,
      });
    }
  });
  for (const px of [-2.3, 2.5]) {
    for (const pz of [-0.92, 0.92]) {
      bridgeLamps.push({
        x: px,
        y: 1.8,
        z: pz,
        kind: 'uplight',
        scale: 0.9,
        color: '#a8d4ff',
        coneHeight: 2.1,
        coneRadius: 0.62,
      });
    }
  }
  addStreetLampSet(g, bridgeLamps);

  // Commuters on the two narrow sidewalks (#10) — merged, shared-material silhouettes.
  [-6.1, -3.4, 1.3, 5.2].forEach((x, i) =>
    person(g, x, 1.78, i % 2 ? 0.68 : -0.68, 0.85, i % 2 ? 0 : Math.PI)
  );

  const cars = [0, 1, 2, 3].map((i) => {
    // Left-hand traffic: eastbound keeps left (north, -Z), westbound keeps
    // left (south, +Z). Lights are batched below instead of per-car meshes.
    const dirX = i % 2 ? 1 : -1;
    const lane = leftLaneOffset(dirX, 0, 0.35);
    const c = car(['#c33', '#dedad2', '#36c', '#fc3'][i], 0.5, false);
    c.position.set(0, 1.82, lane.z);
    c.rotation.y = headingYaw(dirX, 0);
    g.add(c);
    return c;
  });
  const carLights = attachVehicleLights(g, cars);

  // Hillbrow & Sentech concrete telecom towers
  add(g, C(0.18, 0.24, 5.4, 24), MStone('#9e9b93', 0.86), -6.5, 2.7, -3.5);
  add(g, C(0.42, 0.36, 0.42, 24), bd, -6.5, 4.65, -3.5);
  add(g, C(0.025, 0.05, 1.1, 8), wh, -6.5, 5.9, -3.5);

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
    carLights.sync();
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
      const f = 1 + 0.055 * n(Math.atan2(z, x) * 2.5, yy * 1.4);
      p.setXYZ(i, x * f * 1.03, yy, z * f * 0.9);
    }
  }
  // Real Kimberley pipe stratigraphy: red soil -> pale dolerite sill -> dark Ventersdorp shale
  const topSoil = new THREE.Color('#a68b61');
  const dolerite = new THREE.Color('#8a8577'); // grey rock faces below the ochre benches
  const shale = new THREE.Color('#3b3e42');
  tint(geo, (k, _x, yy, z) => {
    if (yy < -3.28) return k.copy(shale);
    if (yy > -0.01) return k.copy(topSoil);
    const ang = Math.atan2(z, _x);
    const depth = -yy / 3.2;
    const band = Math.floor(-yy * 6);
    const strata = 0.85 + 0.18 * (0.5 + 0.5 * Math.sin(band * 1.9 + 0.6));
    const groove = Math.pow(Math.max(0, Math.cos(ang * 18)), 8);
    if (depth < 0.16) k.copy(topSoil).lerp(dolerite, depth / 0.16);
    else if (depth < 0.42) k.copy(dolerite);
    else k.copy(dolerite).lerp(shale, Math.min(1, (depth - 0.42) / 0.52));
    return k.multiplyScalar(strata * (1 - groove * 0.24));
  });
  const vm = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.034),
    side: THREE.DoubleSide,
  });
  add(g, geo, vm);
  add(
    g,
    new THREE.TorusGeometry(6.02, 0.07, 8, 128).rotateX(Math.PI / 2),
    MStone('#a68b61', 0.92, 0.03),
    0,
    0.07,
    0
  ).scale.set(1.03, 1, 0.9);
  add(
    g,
    new THREE.CircleGeometry(3.4, 64).rotateX(-Math.PI / 2),
    MWater('#175f5c', 0.04, 0.16),
    0,
    -3.26,
    0
  ).scale.set(1.03, 1, 0.9);

  // Authentic 4-leg structural steel Kimberley headgear frame + twin sheave wheels + volumetric cable
  const rs = M('#8d4e38', 0.45, 0.65);
  const legSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
  for (const [bx, bz] of [
    [5.85, -1.75],
    [5.85, -1.05],
    [6.75, -1.75],
    [6.75, -1.05],
  ] as const) {
    const tx = 6.3 + (bx - 6.3) * 0.35;
    const tz = -1.4 + (bz + 1.4) * 0.35;
    legSegs.push([[bx, 0, bz], [tx, 3.55, tz]]);
  }
  for (const h of [0.85, 1.75, 2.65]) {
    const k = 1 - (h / 3.55) * 0.65;
    const x0 = 6.3 - 0.45 * k;
    const x1 = 6.3 + 0.45 * k;
    const z0 = -1.4 - 0.35 * k;
    const z1 = -1.4 + 0.35 * k;
    legSegs.push(
      [[x0, h, z0], [x1, h, z0]],
      [[x0, h, z1], [x1, h, z1]],
      [[x0, h, z0], [x0, h, z1]],
      [[x1, h, z0], [x1, h, z1]]
    );
  }
  legSegs.push([[7.4, 0, -1.6], [6.4, 3.5, -1.55]], [[7.4, 0, -1.2], [6.4, 3.5, -1.25]]);
  cableBatch(g, legSegs, 0.062, rs);

  const wl = new THREE.Group();
  wl.position.set(6.3, 3.6, -1.4);
  g.add(wl);
  for (const dz of [-0.14, 0.14]) {
    add(wl, new THREE.TorusGeometry(0.38, 0.045, 8, 24), rs, 0, 0, dz);
    add(wl, CB(0.74, 0.036, 0.036, 0.01), rs, 0, 0, dz);
    add(wl, CB(0.036, 0.74, 0.036, 0.01), rs, 0, 0, dz);
  }

  // Cantilevered rim viewing platform & glass balustrade
  add(g, CB(1.85, 0.12, 2.2, 0.02), M('#525862', 0.45, 0.6), 0, 0.1, 5.65);
  add(g, CB(1.85, 0.9, 0.05, 0.01), MT('#b8e6f0', 0.34, 0.08, 0.2, true), 0, 0.58, 4.6);
  const fm = M('#444950', 0.45, 0.7);
  const postT: InstanceTransform[] = [];
  for (let i = 0; i < 44; i++) {
    const ang = (i / 44) * 6.2832;
    postT.push({ x: 6.42 * Math.cos(ang), y: 0.27, z: 5.75 * Math.sin(ang) });
  }
  instancedMeshes(g, C(0.02, 0.02, 0.55, 6), fm, postT);
  add(g, new THREE.TorusGeometry(6.42, 0.015, 6, 128).rotateX(Math.PI / 2), fm, 0, 0.5, 0).scale.set(1, 1, 0.9);
  const hoistCable = add(g, C(0.022, 0.022, 1, 6), M('#2a2e34', 0.4, 0.8), 4.25, 0.8, -1.0);
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
    roof: '#8d4e38',
  });
  addStreetLampSet(g, [
    { x: -3.2, y: 0, z: 6.45, kind: 'lantern', scale: 0.88, color: '#ffd588', poolRadius: 0.82 },
    { x: -1.8, y: 0, z: 6.45, kind: 'lantern', scale: 0.88, color: '#ffd588', poolRadius: 0.82 },
    { x: -0.95, y: 0.16, z: 4.75, kind: 'bollard', scale: 0.85, color: '#ffe09c', poolRadius: 0.72 },
    { x: 0.95, y: 0.16, z: 4.75, kind: 'bollard', scale: 0.85, color: '#ffe09c', poolRadius: 0.72 },
    { x: -0.95, y: 0.16, z: 6.45, kind: 'bollard', scale: 0.85, color: '#ffe09c', poolRadius: 0.72 },
    { x: 0.95, y: 0.16, z: 6.45, kind: 'bollard', scale: 0.85, color: '#ffe09c', poolRadius: 0.72 },
    { x: 6.3, y: 0, z: -1.05, kind: 'uplight', scale: 1.0, color: '#ffb868', coneHeight: 1.75, coneRadius: 0.62 },
  ]);

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
  const hoistDir = new THREE.Vector3();
  const hoistTop = new THREE.Vector3(6.3, 3.6, -1.4);
  const hoistCur = new THREE.Vector3();
  const hoistMid = new THREE.Vector3();
  const hoistUp = new THREE.Vector3(0, 1, 0);
  w.userData.tick = (t: number) => {
    upd(t);
    const u = (Math.sin(t * 0.4) + 1) / 2;
    hoistCur.set(2.2 + 4.1 * u, -2.0 + 5.1 * u, -0.6 - 0.8 * u);
    bk.position.copy(hoistCur);
    const len = Math.max(0.1, hoistTop.distanceTo(hoistCur));
    hoistMid.addVectors(hoistTop, hoistCur).multiplyScalar(0.5);
    hoistDir.subVectors(hoistTop, hoistCur).divideScalar(len);
    hoistCable.position.copy(hoistMid);
    hoistCable.quaternion.setFromUnitVectors(hoistUp, hoistDir);
    hoistCable.scale.set(1, len, 1);
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
  const gr = MStone('#9c8a80', 0.82, 0.022);
  const dk = MStone('#685f52', 0.88, 0.025);
  const plaza = MWet('#9c8a80', 0.86, 0.18, 0.04, 'stone');
  const bz = M('#4d5548', 0.42, 0.72);
  const gl = G('#b69c55', 1.25);

  add(g, B(15.1, 0.16, 15.1), plaza, 0, 0.08, 0);
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
    frame: '#9c8a80',
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
      frame: '#9c8a80',
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
      frame: '#9c8a80',
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
    color: '#685f52',
  });
  g.add(mergeByMaterial(monumentFacade));
  // Corner Art-Deco granite buttresses housing carved pioneer statues (no turret spheres)
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([x, z]) => {
    add(g, CB(0.78, 3.1, 0.78, 0.05), gr, x * 2.35, 2.45, z * 2.35);
    // Stepped Art-Deco relief pillar figure carved inside each corner pilaster
    add(g, CB(0.32, 0.72, 0.32, 0.04), dk, x * 2.44, 4.35, z * 2.44);
    add(g, CB(0.24, 0.24, 0.24, 0.04), dk, x * 2.44, 4.78, z * 2.44);
  });
  // Great Zimbabwe inspired zig-zag chevron stone frieze ringing top parapet
  const chevT: InstanceTransform[] = [];
  for (let side = 0; side < 4; side++) {
    for (let k = -5; k <= 5; k++) {
      const dist = k * 0.4;
      const diag = (k % 2 ? 1 : -1) * 0.46;
      if (side < 2) {
        chevT.push({ x: dist, y: 4.82, z: (side === 0 ? 1 : -1) * 2.28, rz: diag });
      } else {
        chevT.push({ x: (side === 2 ? 1 : -1) * 2.28, y: 4.82, z: dist, rx: diag, ry: Math.PI / 2 });
      }
    }
  }
  instancedMeshes(g, CB(0.26, 0.07, 0.06, 0.01), gr, chevT);

  // Assegai gateway flanking the entrance + black-wildebeest frieze (#15b).
  // Both are static instanced/merged silhouettes in the existing dark materials.
  const assegaiT: InstanceTransform[] = [
    { x: -1.05, y: 1.35, z: 2.55, rx: 0.08 },
    { x: 1.05, y: 1.35, z: 2.55, rx: -0.08 },
  ];
  instancedMeshes(g, C(0.028, 0.034, 2.3, 6), dk, assegaiT);
  instancedMeshes(
    g,
    new THREE.ConeGeometry(0.09, 0.36, 5),
    dk,
    assegaiT.map((t) => ({ x: t.x, y: 2.68, z: t.z, rx: t.rx }))
  );
  const frieze = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const x = -1.9 + i * 0.475;
    add(frieze, B(0.24, 0.11, 0.04), bz, x, 4.36, 2.3);
    add(frieze, B(0.08, 0.09, 0.045), bz, x + 0.13, 4.43, 2.3);
    add(frieze, B(0.03, 0.11, 0.03), bz, x + 0.09, 4.52, 2.3);
  }
  g.add(mergeByMaterial(frieze));

  // Shallow stepped granite dome with a dark central oculus
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
  // Tapered additive light shaft from the oculus onto the Hall of Heroes.
  // Entirely static (no tick), so reduced-motion needs no special case. Depth
  // test is relaxed so the faint cone reads through the solid dome shell.
  const oculusShaft = add(
    g,
    new THREE.ConeGeometry(0.44, 3, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: '#ffe6a8',
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    0,
    5.16,
    0
  );
  oculusShaft.renderOrder = 3;

  // Anton van Wouw bronze mother-and-child pedestal
  add(g, CB(0.55, 0.6, 0.55, 0.03), dk, 0, 0.9, 3.4);
  add(g, C(0.1, 0.14, 0.8, 8), bz, 0, 1.6, 3.4);
  add(g, new THREE.SphereGeometry(0.12, 10, 8), bz, 0, 2.1, 3.4);

  // Ring of ox-wagons with canvas tilts & paired wooden wheels
  const wagonT: InstanceTransform[] = [];
  const noseT: InstanceTransform[] = [];
  const tiltT: InstanceTransform[] = [];
  const wheelT: InstanceTransform[] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * 6.2832;
    const x = 6.9 * Math.cos(a);
    const z = 6.9 * Math.sin(a);
    wagonT.push({ x, y: 0.3, z, ry: -a });
    noseT.push({ x: 7.28 * Math.cos(a), y: 0.3, z: 7.28 * Math.sin(a), ry: -a });
    tiltT.push({ x, y: 0.53, z, ry: -a });
    const dx = Math.cos(a) * 0.2;
    const dz = Math.sin(a) * 0.2;
    const tx = -Math.sin(a) * 0.15;
    const tz = Math.cos(a) * 0.15;
    wheelT.push({ x: x + dx + tx, y: 0.19, z: z + dz + tz, ry: -a });
    wheelT.push({ x: x - dx - tx, y: 0.19, z: z - dz - tz, ry: -a });
  }
  instancedMeshes(g, CB(0.66, 0.32, 0.26, 0.03), dk, wagonT);
  instancedMeshes(g, new THREE.ConeGeometry(0.19, 0.4, 4).rotateZ(-Math.PI / 2), dk, noseT);
  instancedMeshes(g, C(0.11, 0.11, 0.56, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), gr, tiltT);
  instancedMeshes(g, new THREE.TorusGeometry(0.1, 0.018, 5, 12), bz, wheelT);

  addStreetLampSet(g, [
    { x: -0.92, y: 0.2, z: 6.4, kind: 'victorian', scale: 1.02, color: '#ffc970' },
    { x: 0.92, y: 0.2, z: 6.4, kind: 'victorian', scale: 1.02, color: '#ffc970' },
    { x: -0.92, y: 0.2, z: 4.35, kind: 'lantern', scale: 0.95, color: '#ffca72' },
    { x: 0.92, y: 0.2, z: 4.35, kind: 'lantern', scale: 0.95, color: '#ffca72' },
    { x: -2.42, y: 0.8, z: 2.42, kind: 'uplight', scale: 1.05, color: '#ffb95e', coneHeight: 1.85 },
    { x: 2.42, y: 0.8, z: 2.42, kind: 'uplight', scale: 1.05, color: '#ffb95e', coneHeight: 1.85 },
    { x: -2.42, y: 0.8, z: -2.42, kind: 'uplight', scale: 1.05, color: '#ffb95e', coneHeight: 1.85 },
    { x: 2.42, y: 0.8, z: -2.42, kind: 'uplight', scale: 1.05, color: '#ffb95e', coneHeight: 1.85 },
  ]);
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
  const wh = MPlaster('#d9d5c5', 0.62);
  const dk = M('#343c3d', 0.45, 0.65);
  sea(g, '#28627c', '#3fa3b5');
  // Two distinct sandstone humps: the high old-light peak and a lower shoulder.
  rock(g, 1.55, 3.3, 3.8, -1.6, -0.2, '#73755d', '#a08f6d', 0.14);
  rock(g, 1.15, 2.0, 2.2, 1.9, 0.7, '#73755d', '#95866a', 0.14);
  rock(g, 1.2, 2.3, 1.5, 0.3, 0.2, '#697051', '#8a8468', 0.13);
  [
    [3.4, 2.2, 0.8],
    [-3.6, -2, 0.7],
    [2.4, -3.4, 0.6],
  ].forEach(([x, z, r], i) =>
    rock(g, r * 0.7, r * 1.3, 1.2 + i * 0.3, x, z, '#697051', '#8a8468', 0.13)
  );
  // Extra buttresses and a skirt of weathered scree at the cliff foot.
  rock(g, 0.7, 1.3, 2.4, 2.0, -1.5, '#73755d', '#95866a', 0.16);
  rock(g, 0.6, 1.15, 2.0, -2.4, 2.3, '#73755d', '#95866a', 0.16);
  rock(g, 0.9, 1.5, 1.5, 4.7, -1.9, '#697051', '#8a8468', 0.14);
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
  scatterRocks(g, screeT, '#73755d', '#95866a');
  // Separate fynbos caps make the two-summit profile legible from any angle.
  add(g, C(1.15, 1.2, 0.1, 48), MStone('#697051', 0.95), -1.6, 3.84, -0.2);
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
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.18, 1), Mc('#697051'), bushT, [
    '#5f7042',
    '#7a7f4e',
    '#8a8260',
  ]);

  // 1860 Old Cast-Iron Lighthouse on the high peak: black lower, white upper, red dome cupola (NO active beam!)
  const castBlack = M('#262b30', 0.48, 0.6);
  const redDome = M('#9c382c', 0.46, 0.25);
  const museumLantern = G('#ffdb88', 0.45);
  add(g, C(0.32, 0.4, 0.86, 24), castBlack, -1.6, 4.33, -0.2);
  add(g, C(0.27, 0.32, 0.66, 24), wh, -1.6, 5.09, -0.2);
  add(g, C(0.45, 0.45, 0.09, 24), castBlack, -1.6, 5.45, -0.2);
  add(g, C(0.22, 0.22, 0.3, 16), museumLantern, -1.6, 5.65, -0.2);
  add(g, new THREE.SphereGeometry(0.28, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), redDome, -1.6, 5.8, -0.2);
  colonialHouse(g, {
    x: -1.6,
    y: 3.88,
    z: -1.05,
    w: 0.75,
    h: 0.34,
    d: 0.48,
    wall: '#d9d5c5',
    roof: '#343c3d',
  });

  // 1919 Working Dias Point Lighthouse on lower shoulder: square whitewashed masonry carrying the active sweeping beam
  const ltNew = G('#fff0a8', 2.4);
  add(g, CB(0.46, 0.68, 0.46, 0.02), wh, 1.9, 2.62, 0.7);
  add(g, CB(0.56, 0.06, 0.56, 0.01), dk, 1.9, 2.99, 0.7);
  add(g, C(0.15, 0.15, 0.24, 16), ltNew, 1.9, 3.14, 0.7);
  add(g, new THREE.SphereGeometry(0.19, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), redDome, 1.9, 3.26, 0.7);

  // Winding switchback road snaking up the cliff face to the old lighthouse
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
  instancedMeshes(g, CB(0.18, 0.02, 0.04, 0.01), M('#dcd6c4', 0.85), dashT);
  const roadCars = ['#c33', '#e8c84a', '#e3e1da'].map((col, i) => {
    const c = car(col, i === 1 ? 0.32 : 0.26, false);
    g.add(c);
    return c;
  });
  const roadLights = attachVehicleLights(g, roadCars);

  // Flying Dutchman Funicular: volumetric TubeGeometry parallel steel rails + instanced timber sleepers
  add(g, C(0.85, 0.95, 0.06, 28), MStone('#8f8878', 0.96), 3.9, 0.3, -2.6);
  const funicularCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.9, 0.38, -2.6),
    new THREE.Vector3(2.4, 1.5, -1.8),
    new THREE.Vector3(0.5, 2.7, -0.9),
    new THREE.Vector3(-1.4, 3.55, -0.2),
  ]);
  const railLeftPts: THREE.Vector3[] = [];
  const railRightPts: THREE.Vector3[] = [];
  const sleeperT: InstanceTransform[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = i / 28;
    const p = funicularCurve.getPointAt(u);
    const tg = funicularCurve.getTangentAt(u);
    const perp = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(0.085);
    railLeftPts.push(p.clone().add(perp));
    railRightPts.push(p.clone().sub(perp));
    if (i % 2 === 0) {
      sleeperT.push({ x: p.x, y: p.y - 0.012, z: p.z, ry: Math.atan2(-tg.z, tg.x) });
    }
  }
  const railMat = M('#555a62', 0.42, 0.72);
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railLeftPts), 40, 0.018, 6, false), railMat);
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railRightPts), 40, 0.018, 6, false), railMat);
  instancedMeshes(g, CB(0.05, 0.022, 0.24, 0.005), MWood('#5c4632', 0.88), sleeperT);
  const funicularCar = add(g, CB(0.24, 0.16, 0.18, 0.02), M('#d8d2c4', 0.68), 3.9, 0.55, -2.6);
  addStreetLampSet(g, [
    { x: 3.35, y: 0.33, z: -2.15, kind: 'lantern', scale: 0.9, color: '#ffcf80' },
    { x: 4.35, y: 0.33, z: -2.95, kind: 'lantern', scale: 0.9, color: '#ffcf80' },
    { x: 3.65, y: 0.33, z: -3.2, kind: 'bollard', scale: 0.9, color: '#ffcf80' },
    { x: -1.18, y: 3.56, z: -0.42, kind: 'lantern', scale: 0.82, color: '#ffd98e' },
  ]);

  // Sandy cove with turquoise shallows and drifting surf rings.
  const beachX = 4.6;
  const beachZ = 4.0;
  add(g, C(1.45, 1.55, 0.07, 48), MStone('#c8b793', 0.96), beachX, 0.13, beachZ);
  add(g, C(0.95, 1.0, 0.03, 40), MStone('#d9c7a0', 0.96), beachX, 0.18, beachZ);
  add(
    g,
    new THREE.RingGeometry(1.5, 1.85, 48).rotateX(-Math.PI / 2),
    MWater('#378896', 0.08, 0.22),
    beachX,
    0.12,
    beachZ
  );
  const surf = [0, 1, 2].map(() => {
    const ring = add(
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
    );
    ring.userData.tracksCoastalTide = true;
    return ring;
  });
  const skiff = boat('#d8543c', 0.7);
  g.add(skiff);

  // Coastal fynbos scrub on low islets — never trees on the headland.
  const isletBushT: InstanceTransform[] = [];
  [2.0, 3.2, 4.4, 5.6].forEach((a, i) => {
    const r = 4.9 + R(i + 120) * 0.9;
    const x = -0.4 + r * Math.cos(a);
    const z = 0.2 + r * Math.sin(a);
    rock(g, 0.75, 1.25, 0.55, x, z, '#73755d', '#95866a', 0.14);
    add(g, C(0.78, 0.82, 0.06, 24), MStone('#697051', 0.95), x, 0.58, z);
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
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.26, 1), Mc('#697051'), isletBushT, [
    '#5f7042',
    '#7a7f4e',
    '#8a8260',
  ]);

  // Active rotating beam belongs solely to the 1919 working Dias Point light!
  const bmat = new THREE.MeshBasicMaterial({
    color: '#fff4b8',
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const bmNew = new THREE.Group();
  bmNew.position.set(1.9, 3.14, 0.7);
  g.add(bmNew);
  [0, Math.PI].forEach((a) => {
    const c = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 4.2, 14, 1, true).rotateZ(Math.PI / 2).translate(2.1, 0, 0),
      bmat
    );
    c.rotation.y = a;
    bmNew.add(c);
  });
  const sweepNew = addLighthouseSweep(g, 1.9, 0.17, 0.7, 6.2, '#ffefb2');
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
    bmNew.rotation.y = -t * 1.5;
    sweepNew.rotation.y = bmNew.rotation.y;
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
      const lane = leftLaneOffset(tg.x, tg.z, 0.2);
      c.position.set(p.x + lane.x, p.y + 0.16, p.z + lane.z);
      c.rotation.y = headingYaw(tg.x, tg.z);
    });
    roadLights.sync();
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
  };
  return g;
}

export function bokaap(): THREE.Group {
  const g = new THREE.Group();
  const wh = MPlaster('#ded9ce', 0.72);
  const cobble = MWet('#7f756a', 0.86, 0.16, 0.04, 'stone');
  // 8 distinct screen-calibrated Cape Malay jewel tones (1 per attached house!)
  const pal = [
    '#cf4f68',
    '#c7922e',
    '#2b8c94',
    '#3863a8',
    '#6f9946',
    '#785296',
    '#c97454',
    '#b56275',
  ];
  const roofs = ['#3d434c', '#7a4534', '#4d5b54', '#5c493e'];
  rock(g, 2.6, 3.9, 3.6, 0, -6.4, '#637544', '#988c66', 0.11);

  const benchT: InstanceTransform[] = [];
  for (let r = 0; r < 4; r++) {
    const z = 2.6 - r * 1.55;
    const b0 = 0.3 + r * 0.75;
    add(g, CB(10.3, b0, 1.65, 0.04), cobble, 0, b0 / 2, z);
    add(g, CB(10.3, 0.12, 0.14, 0.02), MStone('#8d8374', 0.92), 0, b0 + 0.04, z + 0.76);
    add(g, CB(10.3, 0.04, 0.28, 0.01), cobble, 0, b0 + 0.02, z - 0.85);
    benchT.push({ x: -4.7, y: b0 + 0.1, z: z + 0.55 });
    benchT.push({ x: 4.7, y: b0 + 0.1, z: z + 0.55 });
    for (let j = 0; j < 6; j++) {
      const x = -4.1 + j * 1.65;
      const h = 0.95 + ((j * 3 + r * 5) % 3) * 0.24;
      colonialHouse(g, {
        x,
        y: b0,
        z,
        w: 1.68,
        h,
        d: 1.26,
        wall: pal[(j * 5 + r * 3) % 8],
        roof: roofs[(j + r) % 4],
        capeDutch: r === 0 && j === 2,
      });
      add(g, CB(1.68, 0.06, 0.34, 0.02), MStone('#8d8374', 0.92), x, b0 + 0.05, z + 0.86);
      add(g, CB(1.68, 0.09, 0.14, 0.02), MPlaster('#ddd5c4', 0.8), x, b0 + h + 0.04, z + 0.66);
    }
    if (r === 0) {
      addStreetLampSet(g, [
        { x: -5.0, y: b0, z: z + 0.86, kind: 'victorian', scale: 0.95, color: '#ffd280' },
        { x: -1.65, y: b0, z: z + 0.86, kind: 'victorian', scale: 0.95, color: '#ffd280' },
        { x: 1.65, y: b0, z: z + 0.86, kind: 'victorian', scale: 0.95, color: '#ffd280' },
        { x: 5.0, y: b0, z: z + 0.86, kind: 'victorian', scale: 0.95, color: '#ffd280' },
      ]);
    } else if (r === 1) {
      addStreetLampSet(g, [
        { x: -3.3, y: b0, z: z + 0.86, kind: 'victorian', scale: 0.88, color: '#ffc970' },
        { x: 0.0, y: b0, z: z + 0.86, kind: 'victorian', scale: 0.88, color: '#ffc970' },
        { x: 3.3, y: b0, z: z + 0.86, kind: 'victorian', scale: 0.88, color: '#ffc970' },
      ]);
    }
  }
  instancedMeshes(g, CB(0.4, 0.07, 0.16, 0.02), MWood('#6a4a32', 0.86), benchT);

  // Lane life (#10): stoep silhouettes, washing lines across the lanes, wheelie bins.
  person(g, -2.6, 0.34, 3.32, 0.9, 0.6);
  person(g, 1.4, 1.09, 1.81, 0.86, 2.5);
  washingLine(g, -1.2, 0.34, 2.6, 1, 0);
  washingLine(g, 2.4, 1.09, 1.05, 0.9, 0.2);
  bin(g, -3.9, 0.34, 3.3, 0.8);
  bin(g, 3.9, 1.09, 1.78, 0.8);

  // Authentic flat-parapet Auwal Mosque (NO dome!) + arched green doors + 3-tier sage/white square minaret
  const sage = MPlaster('#6f8572', 0.78);
  const darkGreen = MWood('#24523a', 0.75);
  const brass = M('#c7a048', 0.3, 0.85);
  add(g, CB(1.5, 1.38, 1.48, 0.04), wh, 5.9, 0.99, -1.2);
  add(g, CB(1.58, 0.12, 1.56, 0.02), sage, 5.9, 1.72, -1.2);
  add(g, CB(0.56, 0.2, 0.12, 0.02), sage, 5.9, 1.84, -0.46);
  // Two arched dark-green prayer hall doors on front face
  for (const dx of [-0.28, 0.28]) {
    add(g, CB(0.24, 0.68, 0.06, 0.02), darkGreen, 5.9 + dx, 0.68, -0.45);
  }
  addStreetLampSet(g, [
    { x: 5.35, y: 0.3, z: -0.34, kind: 'lantern', scale: 0.92, color: '#ffe094' },
    { x: 6.45, y: 0.3, z: -0.34, kind: 'lantern', scale: 0.92, color: '#ffe094' },
  ]);
  // Slender 3-tier square minaret with sage cornice gallery + octagonal cupola + brass spire
  add(g, CB(0.32, 1.6, 0.32, 0.02), wh, 6.65, 1.1, -2.05);
  add(g, CB(0.42, 0.08, 0.42, 0.02), sage, 6.65, 1.92, -2.05);
  add(g, CB(0.26, 0.65, 0.26, 0.02), wh, 6.65, 2.28, -2.05);
  add(g, C(0.14, 0.16, 0.28, 8), wh, 6.65, 2.74, -2.05);
  add(g, new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), sage, 6.65, 2.88, -2.05);
  add(g, C(0.012, 0.018, 0.22, 6), brass, 6.65, 3.08, -2.05);

  for (let i = 0; i < 5; i++) tree(g, -4 + i * 2, 4.1, 0.8, 1);
  g.userData.tick = birds(g, 6, 3, 6);
  return g;
}

export function soccer(): THREE.Group {
  const g = new THREE.Group();
  const gl = G('#ffb35a', 1.45);
  // 512x256 staggered GFRC fibreC earth-tone mosaic panels (ash, bone, sand, ochre, terracotta, umber)
  const mosaic = document.createElement('canvas');
  mosaic.width = 512;
  mosaic.height = 256;
  const mx = mosaic.getContext('2d')!;
  mx.fillStyle = '#2d2e30';
  mx.fillRect(0, 0, 512, 256);
  const cols = 32;
  const rows = 16;
  const cw = 512 / cols;
  const ch = 256 / rows;
  const tiles = ['#cfc7b5', '#c9a67c', '#b77a54', '#944d3e', '#6f5a4a', '#463f3c'];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tx = col * cw + (row % 2 ? cw / 2 : 0);
      mx.fillStyle = tiles[Math.floor(R(row * 31 + col * 7 + 5) * tiles.length)];
      mx.fillRect(tx + 1, row * ch + 1, cw - 2, ch - 2);
    }
  }
  const mosaicTex = prepareCanvasTexture(new THREE.CanvasTexture(mosaic));
  mosaicTex.wrapS = THREE.RepeatWrapping;
  mosaicTex.wrapT = THREE.RepeatWrapping;
  mosaicTex.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.MeshStandardMaterial({
    map: mosaicTex,
    roughness: 0.62,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  // 10 distinct calabash shell segments separated by true recessed dark-glass vertical expansion slits!
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
  const petalSpan = (Math.PI * 2) / 10;
  const gapSpan = 0.045;
  const petalGeo = new THREE.LatheGeometry(pts, 12, gapSpan * 0.5, petalSpan - gapSpan);
  const slotMat = MGlass('#182028', 0.85, 0.08);
  const slotGeo = new THREE.LatheGeometry(pts, 4, -gapSpan * 0.55, gapSpan * 1.1);
  for (let i = 0; i < 10; i++) {
    const yaw = i * petalSpan;
    add(g, petalGeo, pm, 0, 0, 0).rotation.y = yaw;
    add(g, slotGeo, slotMat, 0, 0, 0).rotation.y = yaw;
  }

  // Steel spine fins along the 10 African city alignment slits + inner PTFE roof canopy
  const ribT: InstanceTransform[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ribT.push({ x: 4.55 * Math.cos(a), y: 1.85, z: 4.55 * Math.sin(a), ry: -a });
  }
  instancedMeshes(g, CB(0.08, 3.1, 0.14, 0.02), gl, ribT);

  // Inner cantilevered translucent sand-toned PTFE membrane canopy over the 3-tier bowl
  add(
    g,
    new THREE.LatheGeometry([new THREE.Vector2(2.65, 3.45), new THREE.Vector2(4.02, 3.82)], 64),
    MT('#cfc1a4', 0.72, 0.55, 0.05, true)
  );
  add(g, new THREE.CircleGeometry(3.48, 64).rotateX(-Math.PI / 2), M('#3b8646', 0.95), 0, 0.48, 0);
  add(g, B(11, 0.2, 11), MWet('#7f6043', 0.85, 0.16, 0.04, 'stone'), 0, 0.1, 0);
  [
    [4.6, 1.2],
    [4.2, 2.5],
  ].forEach(([R0, y]) =>
    add(g, new THREE.TorusGeometry(R0, 0.06, 8, 112).rotateX(Math.PI / 2), gl, 0, y, 0)
  );
  add(g, new THREE.TorusGeometry(4.15, 0.06, 8, 96).rotateX(Math.PI / 2), gl, 0, 3.9, 0);

  const fire = G('#be8655', 1.05);
  add(g, new THREE.TorusGeometry(5.05, 0.045, 8, 128).rotateX(Math.PI / 2), fire, 0, 0.23, 0);
  const lampT: InstanceTransform[] = [];
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * 6.2832;
    lampT.push({ x: 5.05 * Math.cos(a), y: 0.27, z: 5.05 * Math.sin(a) });
  }
  instancedMeshes(g, new THREE.SphereGeometry(0.09, 8, 6), fire, lampT);
  const soccerLamps: StreetLampSpec[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    soccerLamps.push({
      x: 4.74 * Math.cos(a),
      y: 0.2,
      z: 4.74 * Math.sin(a),
      kind: 'uplight',
      scale: 1.05,
      color: '#ffaa55',
      coneHeight: 2.1,
      coneRadius: 0.72,
    });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.39;
    soccerLamps.push({
      x: 5.55 * Math.cos(a),
      y: 0.2,
      z: 5.55 * Math.sin(a),
      kind: 'flood',
      ry: -a + Math.PI,
      scale: 0.95,
      color: '#ffd999',
      poolRadius: 1.45,
    });
  }
  addStreetLampSet(g, soccerLamps);
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
    fire.color.set('#be8655');
    fire.emissive.copy(fire.color);
    fw(t);
  };
  return g;
}

export function rondavels(): THREE.Group {
  const g = new THREE.Group();
  const cm = MT('#eef3f7', 0.58, 0.98, 0, false);

  // Continuous displaced Blyde Canyon escarpment terrain sloping down into the jade Blyde Dam
  const terrain = new THREE.PlaneGeometry(15.2, 15.2, 56, 56).rotateX(-Math.PI / 2);
  const tp = terrain.attributes.position;
  const hAt = (x: number, z: number) => {
    const ridge = Math.max(0, Math.min(1, (x + 2.2) / 5.4));
    const shelf = Math.pow(ridge, 1.35) * 3.1;
    const canyon = Math.exp(-Math.pow((x + 3.4) / 2.6, 2)) * 1.1;
    const und = 0.22 * Math.sin(x * 0.7 + z * 0.5) + 0.14 * Math.cos(x * 1.3 - z * 0.9);
    return Math.max(-1.65, -1.2 + shelf - canyon + und * 0.7);
  };
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i);
    const z = tp.getZ(i);
    tp.setY(i, hAt(x, z));
  }
  const cFloor = new THREE.Color('#3e5a38');
  const cMid = new THREE.Color('#667746');
  const cCliff = new THREE.Color('#8e6447');
  tint(terrain, (k, x, y, z) => {
    const steep = Math.abs(hAt(x + 0.25, z) - hAt(x - 0.25, z));
    k.copy(cFloor).lerp(cMid, THREE.MathUtils.clamp((y + 1.2) / 2.8, 0, 1));
    if (steep > 0.22 && y > -0.8) k.lerp(cCliff, THREE.MathUtils.clamp((steep - 0.22) * 2.2, 0, 0.75));
  });
  weatherVertexColors(terrain, { ao: 0.28, exposure: 0.12, grain: 0.06 });
  const terrMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.028),
  });
  terrMat.userData.naturalSurface = true;
  add(g, terrain, terrMat);

  // Winding jade Blyde Dam water plane nestled inside the western canyon floor
  const river = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.2, -1.05, -7.1),
    new THREE.Vector3(-3.0, -1.05, -3.2),
    new THREE.Vector3(-3.8, -1.05, 0.4),
    new THREE.Vector3(-2.8, -1.05, 4.0),
    new THREE.Vector3(-3.6, -1.05, 7.1),
  ]);
  const rGeo = new THREE.TubeGeometry(river, 64, 1.55, 10, false);
  rGeo.scale(1, 0.1, 1);
  add(g, rGeo, MWater('#426d68', 0.09, 0.25), 0, -0.96, 0);

  // Three asymmetric horizontally-banded quartzite Rondavel drum peaks + flat-topped Mapjaneng
  const crest = new THREE.Group();
  g.add(crest);
  const capGeo = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const helmetMat = MStone('#5d733e', 0.94, 0.025);
  [
    [1.9, -2.25, 3.05, 0.96],
    [3.05, 0.05, 3.45, 1.08],
    [2.05, 2.2, 2.85, 0.92],
  ].forEach(([x, z, h, r], idx) => {
    const baseY = hAt(x, z) - 0.18;
    rock(g, r * 0.78, r * 1.18, h, x, z, '#a56e4b', '#c0a37b', 0.11, baseY);
    const dome = add(crest, capGeo, helmetMat, x, baseY + h - 0.06, z);
    dome.scale.set(r * 0.96, r * (0.44 + idx * 0.04), r * 0.96);
    const hutTip = add(crest, new THREE.ConeGeometry(r * 0.18, 0.56, 10), helmetMat, x, baseY + h + 0.18, z);
    hutTip.rotation.z = (idx - 1) * 0.06;
  });
  // Mapjaneng, the broad flat-topped chief peak
  const mapBase = hAt(-0.15, 0.15) - 0.18;
  rock(g, 1.18, 1.56, 2.75, -0.15, 0.15, '#a56e4b', '#c0a37b', 0.09, mapBase);
  add(crest, C(1.14, 1.16, 0.12, 32), helmetMat, -0.15, mapBase + 2.74, 0.15);
  mergeByMaterial(crest);

  // Visible chacma baboon troop on a middle-peak ledge (#15b): four merged,
  // high-contrast silhouettes against the ochre rock — no glow, no marker.
  const troop = new THREE.Group();
  const baboonMat = MStone('#3a322c', 0.95, 0.02);
  const ledgeY = hAt(3.05, 0.05) - 0.18 + 3.45 * 0.72;
  (
    [
      [2.8, 1, 0],
      [3.0, 1.1, 0.5],
      [3.2, 0.9, -0.2],
      [3.4, 1.05, 0.25],
    ] as const
  ).forEach(([x, sc, ry], i) => {
    const z = -0.12 + i * 0.16;
    add(troop, new THREE.IcosahedronGeometry(0.13 * sc, 0), baboonMat, x, ledgeY + 0.14 * sc, z);
    add(troop, new THREE.IcosahedronGeometry(0.07 * sc, 0), baboonMat, x + 0.1 * sc, ledgeY + 0.27 * sc, z);
    add(troop, B(0.02, 0.02, 0.2 * sc), baboonMat, x - 0.12 * sc, ledgeY + 0.12 * sc, z).rotation.y = ry;
  });
  g.add(mergeByMaterial(troop));

  // Canyon floor mist & soaring eagles
  const ms = Array.from({ length: 8 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.68, 14, 10),
      cm,
      -3.4 + R(i) * 3.2,
      -0.3 + R(i + 4) * 0.75,
      -3.2 + R(i + 9) * 6.4
    );
    o.scale.set(1.85, 0.42, 1.15);
    o.userData.x = o.position.x;
    return o;
  });
  for (let i = 0; i < 12; i++) {
    const tx = -2.2 + R(i) * 3.2;
    const tz = -5.4 + R(i + 30) * 10.8;
    tree(g, tx, tz, 0.68 + R(i + 5) * 0.28, i % 4 ? 1 : 2, hAt(tx, tz));
  }
  const bd = birds(g, 3, 4.4, 6.2);
  g.userData.tick = (t: number) => {
    ms.forEach((o, i) => {
      o.position.x = (o.userData.x as number) + Math.sin(t * 0.24 + i) * 0.45;
      o.scale.y = 0.42 + 0.07 * Math.sin(t * 0.48 + i);
    });
    bd(t);
  };
  return g;
}

export function baobab(): THREE.Group {
  const g = new THREE.Group();
  const bk = MBark('#8d8882', 0.94, 0.036);
  const podMat = MBark('#6c563d', 0.92, 0.02);
  add(g, B(15.2, 0.2, 15.2), MStone('#9e6847', 0.96), 0, 0.1, 0);

  // Monumental bottle trunk with deep fluted ribs & weathered ash-grey sheen
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = (i * 3.1) / 24;
    pts.push(
      new THREE.Vector2(
        1.42 *
          (1 +
            0.52 * Math.sin(Math.PI * Math.min(1, y / 2.25)) +
            0.84 * Math.exp(-y * 3.4) -
            (0.18 * y) / 3.1),
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
    const f = 1 + 0.11 * Math.sin(a * 10 + Y * 2.6) + 0.06 * Math.sin(a * 18 - Y * 4.5);
    p.setXYZ(i, X * f, Y, Z * f);
  }
  tg.computeVertexNormals();
  add(g, tg, bk, 0, 0.2, 0);

  // Massive spreading buttress roots + vertical flutes merged to 1 draw each
  const roots = new THREE.Group();
  g.add(roots);
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7 + 0.25;
    const root = add(
      roots,
      new THREE.SphereGeometry(0.64, 14, 10),
      bk,
      1.78 * Math.cos(a),
      0.38,
      1.78 * Math.sin(a)
    );
    root.scale.set(1.95, 0.56, 0.95);
    root.rotation.y = -a;
  }
  mergeByMaterial(roots);

  const flutes = new THREE.Group();
  g.add(flutes);
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    const rib = add(flutes, C(0.055, 0.13, 2.25, 8), bk, 2.02 * Math.cos(a), 1.38, 2.02 * Math.sin(a));
    rib.rotation.z = -0.07 * Math.cos(a);
    rib.rotation.x = 0.07 * Math.sin(a);
  }
  mergeByMaterial(flutes);

  // Recursive 2-3 tier upside-down-root branching canopy with palmate clusters & hanging velvet pods
  const twigs = new THREE.Group();
  g.add(twigs);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + R(i) * 0.28;
    const L = 1.65 + R(i + 2) * 0.55;
    const mid = V(Math.cos(a) * 0.85, 3.52 + R(i + 4) * 0.16, Math.sin(a) * 0.85);
    const tip = V(Math.cos(a) * L, 4.02 + R(i + 8) * 0.35, Math.sin(a) * L);
    const cv = new THREE.CatmullRomCurve3([V(0, 2.98, 0), mid, tip]);
    add(twigs, new THREE.TubeGeometry(cv, 10, 0.135, 7), bk);

    // Secondary & tertiary gnarled crooked root-like forks
    for (const s of [-1, 1]) {
      const a2 = a + s * (0.42 + R(i * 3 + s) * 0.24);
      const subTip = V(
        mid.x + Math.cos(a2) * 1.1,
        mid.y + 0.65 + R(i * 5 + s) * 0.25,
        mid.z + Math.sin(a2) * 1.1
      );
      const cv2 = new THREE.CatmullRomCurve3([mid, subTip]);
      add(twigs, new THREE.TubeGeometry(cv2, 6, 0.068, 6), bk);

      // Upright gnarled terminal twiglets
      const twigTip = V(
        subTip.x + Math.cos(a2 + s * 0.35) * 0.45,
        subTip.y + 0.42,
        subTip.z + Math.sin(a2 + s * 0.35) * 0.45
      );
      add(twigs, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([subTip, twigTip]), 4, 0.032, 5), bk);

      // Palmate leaf tuft + hanging oval velvet baobab seed pod
      const f = new THREE.Group();
      f.position.copy(twigTip);
      g.add(f);
      add(f, new THREE.IcosahedronGeometry(0.18, 1), Mc(i % 2 ? '#61823e' : '#73914b'), 0, 0.04, 0).scale.set(
        1.15,
        0.72,
        1.15
      );
      if (i % 2 === 0 || s > 0) {
        add(f, C(0.005, 0.005, 0.18, 4), bk, 0.04, -0.1, 0);
        add(f, new THREE.SphereGeometry(0.052, 8, 6), podMat, 0.04, -0.22, 0).scale.set(0.85, 1.65, 0.85);
      }
      swayItems.push({ o: f, ph: i * 1.4 + s, a: 0.045, sp: 1.25 });
    }
  }
  mergeByMaterial(twigs);

  // Red Lowveld boulders & dry golden grass tufts
  scatterRocks(
    g,
    [
      { x: 3.1, y: 0.24, z: 2.1, sx: 0.55, sy: 0.32, sz: 0.48 },
      { x: -3.4, y: 0.24, z: 1.8, sx: 0.46, sy: 0.28, sz: 0.44 },
      { x: 2.5, y: 0.24, z: -3.1, sx: 0.62, sy: 0.36, sz: 0.52 },
    ],
    '#7d543c',
    '#9e6847'
  );
  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 80; i++) {
    const a = R(i) * 6.28;
    const r = 2.9 + R(i + 9) * 4.3;
    grassT.push({
      x: r * Math.cos(a),
      y: 0.2,
      z: r * Math.sin(a),
      ry: R(i * 3) * 6.28,
      sy: 1.15 + R(i + 2) * 0.55,
    });
  }
  grassTufts(g, grassT, ['#b39452', '#9d8348', '#867844']);
  g.userData.tick = drift(g, 50, '#ffe38a', 0.08, (i, t) => [
    Math.cos(i * 2.4 + t * 0.2) * (1.5 + R(i) * 5),
    0.5 + R(i + 2) * 3 + Math.sin(t + i) * 0.2,
    Math.sin(i * 2.4 + t * 0.2) * (1.5 + R(i) * 5),
  ]);
  return g;
}

export function holewall(): THREE.Group {
  const g = new THREE.Group();
  sea(g, '#2e6371', '#5a8f90');

  // Sculpted tilted dark Ecca shale & ochre-sandstone sea-stack wall with asymmetrical wave tunnel
  const s = new THREE.Shape();
  s.moveTo(-2.55, -0.5);
  s.lineTo(-2.35, 2.25);
  s.quadraticCurveTo(-2.1, 3.35, -0.95, 3.3);
  s.lineTo(1.15, 3.48);
  s.quadraticCurveTo(2.25, 3.35, 2.45, 2.05);
  s.lineTo(2.55, -0.5);
  s.closePath();
  const h = new THREE.Path();
  h.moveTo(-0.98, -0.15);
  h.lineTo(-0.95, 0.92);
  h.absarc(0.05, 0.92, 1.0, Math.PI, 0, true);
  h.lineTo(1.05, -0.15);
  h.closePath();
  s.holes.push(h);
  const ge = new THREE.ExtrudeGeometry(s, {
    depth: 1.75,
    bevelEnabled: true,
    bevelSize: 0.12,
    bevelThickness: 0.12,
    bevelSegments: 2,
    curveSegments: 28,
  }).translate(0, 0, -0.875);
  const pos = ge.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const X = pos.getX(i);
    const Y = pos.getY(i);
    const Z = pos.getZ(i);
    const strata = 0.045 * Math.sin(Y * 11 + X * 0.6);
    pos.setXYZ(i, X + strata, Y, Z + 0.08 * Math.sin(X * 2.1 + Y * 1.4));
  }
  const a = new THREE.Color('#54565a');
  const b = new THREE.Color('#7d6a54');
  const c = new THREE.Color('#536d3f');
  const archGeo = tint(ge, (k, x, y) =>
    y > 3.16
      ? k.copy(c)
      : k.copy(a).lerp(b, Math.min(1, Math.max(0, y / 3.15 + 0.14 * Math.sin(y * 16 + x * 0.7))))
  );
  weatherVertexColors(archGeo, { ao: 0.3, exposure: 0.12, grain: 0.06 });
  const stackMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.034),
  });
  stackMat.userData.naturalSurface = true;
  const stack = add(g, archGeo, stackMat);
  stack.scale.set(1.88, 1.12, 1.28);
  stack.rotation.z = -0.025;

  // Emerald Wild Coast headland with white & pale-blue Xhosa rondavels
  rock(g, 2.7, 4.1, 3.65, 0, -5.2, '#54565a', '#7d6a54', 0.1);
  add(g, C(2.68, 2.74, 0.12, 48), MStone('#536d3f', 0.94), 0, 3.7, -5.2);
  (
    [
      [-0.95, -5.05, '#e6dfd0'],
      [0.05, -4.85, '#c4d8e2'],
      [1.0, -5.0, '#e6dfd0'],
    ] as const
  ).forEach(([x, z, wall]) => {
    rondavel(g, x, z, 3.74, 0.56, wall, '#9e7a3b');
  });
  [
    [-1.45, -4.35],
    [1.55, -4.55],
    [-0.2, -5.9],
  ].forEach(([x, z]) => tree(g, x, z, 0.72, 2, 3.68));
  rock(g, 0.42, 0.72, 1.15, 3.55, 1.45, '#54565a', '#7d6a54', 0.12);
  rock(g, 0.36, 0.62, 0.95, -3.3, 2.55, '#54565a', '#7d6a54', 0.12);

  // Translucent surging wave roller crashing through the arch opening
  const roller = add(
    g,
    C(0.72, 0.92, 2.6, 16, 1, false, 0, Math.PI),
    MT('#d8eef5', 0.55, 0.25, 0.05, true),
    0.05,
    0.16,
    0.4
  );
  roller.rotation.z = Math.PI / 2;

  const sr = seaRings(g, 0.12, 1.85, 4);
  const spray = drift(
    g,
    65,
    '#e4f2f8',
    0.11,
    (i, t) => {
      const k = (t * 0.55 + R(i * 4)) % 1;
      return [(R(i * 2) - 0.5) * 1.8, 0.16 + Math.sin(k * Math.PI) * 0.88, -0.75 + k * 2.9];
    },
    0.55
  );
  const bd = birds(g, 3, 3.2, 5);
  g.userData.tick = (t: number) => {
    roller.position.z = -0.35 + ((t * 0.55) % 1) * 1.9;
    roller.material.opacity = 0.2 + 0.4 * Math.sin(((t * 0.55) % 1) * Math.PI);
    sr(t);
    spray(t);
    bd(t);
  };
  return g;
}

export function castle(): THREE.Group {
  const g = new THREE.Group();
  const wl = MPlaster('#887c69', 0.84); // weathered rubble-stone outer curtains (research §3.13)
  const och = MPlaster('#bd9648', 0.78); // warm yellow-ochre De Kat plaster, ≤0.75 sRGB
  const deKatWhite = MPlaster('#dcd4c4', 0.74);
  const rf = MPlaster('#8a4932', 0.78);
  const st = MStone('#9a8f77', 0.9);
  add(g, B(15.2, 0.2, 15.2), MWet('#aca380', 0.86, 0.18, 0.04, 'stone'), 0, 0.1, 0);

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
  // Outer wet moat & star glacis embankment
  add(g, ring(6.1, 4.9, 0.06), MWater('#486266', 0.1, 0.22), 0, 0.2, 0);
  add(g, ring(4.55, 3.74, 0.98), wl, 0, 0.2, 0);
  add(g, ring(4.6, 3.68, 0.09), st, 0, 1.18, 0);

  // Five triangular bastions with stone coping & bartizan corner sentry turrets
  const bs = new THREE.Shape();
  bs.moveTo(0, -1.18);
  bs.lineTo(0.76, 0.34);
  bs.lineTo(-0.76, 0.34);
  bs.closePath();
  const bastionGeo = new THREE.ExtrudeGeometry(bs, {
    depth: 0.94,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.05,
    bevelSegments: 1,
  }).rotateX(-Math.PI / 2);
  pent(4.36).forEach((v) => {
    const x = v.x;
    const z = -v.y;
    const yaw = Math.atan2(x, z);
    add(g, bastionGeo, wl, x, 0.2, z).rotation.y = yaw;
    const cap = add(g, bastionGeo, st, x, 1.15, z);
    cap.rotation.y = yaw;
    cap.scale.set(0.86, 0.14, 0.86);
    const point = add(g, new THREE.ConeGeometry(0.24, 0.34, 6), rf, x, 1.4, z);
    point.rotation.y = yaw;
  });

  // Kat Cross-Wall bisecting the star courtyard behind De Kat Residence
  add(g, CB(7.1, 0.78, 0.22, 0.03), wl, 0, 0.59, -0.32);
  add(g, CB(7.16, 0.08, 0.28, 0.02), st, 0, 1.0, -0.32);

  // Warm mustard-ochre De Kat Residence anchored against the Kat Cross-Wall
  add(g, CB(2.6, 0.92, 1.45, 0.04), och, 0, 0.66, 0.28);
  add(g, gableRoofGeo(2.6, 1.45, 0.42, 0.1), rf, 0, 1.14, 0.28);
  add(
    g,
    new THREE.PlaneGeometry(2.5, 0.84),
    litWindowMaterial({
      wall: '#bd9648',
      lit: '#ffd58a',
      dark: '#5d4d30',
      cols: 9,
      rows: 3,
      seed: 7,
      chance: 0.48,
      intensity: 0.14,
    }),
    0,
    0.66,
    1.015
  );

  // Ornate 3-arch white plaster De Kat Balcony portico + twin curved baroque stairs & Dolphin Pool
  add(g, CB(0.95, 0.42, 0.34, 0.02), deKatWhite, 0, 0.41, 1.14);
  for (const dx of [-0.36, -0.12, 0.12, 0.36]) {
    add(g, C(0.032, 0.038, 0.46, 8), deKatWhite, dx, 0.82, 1.24);
  }
  add(g, CB(0.96, 0.08, 0.32, 0.02), deKatWhite, 0, 1.04, 1.18);
  add(g, CB(0.45, 0.2, 0.1, 0.02), deKatWhite, 0, 1.16, 1.24);
  for (const s of [-1, 1]) {
    const stair = add(g, CB(0.45, 0.24, 0.2, 0.02), st, s * 0.62, 0.32, 1.16);
    stair.rotation.y = s * 0.28;
  }
  // Octagonal stone Dolphin Pool in front courtyard
  add(g, C(0.42, 0.46, 0.1, 8), st, -1.65, 0.25, 1.75);
  add(g, C(0.35, 0.35, 0.04, 8), MWater('#4d7c7e', 0.08, 0.2), -1.65, 0.29, 1.75);

  const castleFacade = new THREE.Group();
  for (const x of [-0.88, 0.88]) {
    facadeWindow(castleFacade, {
      x,
      y: 0.72,
      z: 1.03,
      width: 0.32,
      height: 0.44,
      depth: 0.09,
      frame: '#dcd4c4',
      glass: '#2b2418',
    });
  }
  doorSurround(castleFacade, {
    x: 0,
    y: 0.68,
    z: 1.04,
    width: 0.62,
    height: 0.84,
    depth: 0.12,
    jamb: '#dcd4c4',
    panel: '#4a3424',
  });
  corniceBand(castleFacade, {
    x: 0,
    y: 1.14,
    z: 1.01,
    width: 2.66,
    depth: 0.16,
    height: 0.1,
    color: '#9a8f77',
  });
  g.add(mergeByMaterial(castleFacade));

  // Pedestrian entrance + Authentic VOC Bell Tower centered directly atop the front Curtain Gateway!
  const gateZ = 3.65;
  add(g, CB(1.32, 0.96, 0.68, 0.03), st, 0, 0.68, gateZ);
  add(g, CB(0.46, 0.62, 0.72, 0.02), MWood('#3b281c', 0.8), 0, 0.51, gateZ);
  add(g, CB(0.84, 0.16, 0.78, 0.02), st, 0, 1.24, gateZ);
  for (const dx of [-0.26, 0.26]) {
    for (const dz of [-0.24, 0.24]) {
      add(g, C(0.035, 0.045, 0.84, 8), deKatWhite, dx, 1.72, gateZ + dz);
    }
  }
  add(g, CB(0.76, 0.09, 0.74, 0.02), st, 0, 2.18, gateZ);
  add(g, new THREE.SphereGeometry(0.1, 12, 8), M('#5a624f', 0.48, 0.6), 0, 1.9, gateZ);
  add(g, new THREE.ConeGeometry(0.56, 0.44, 4), rf, 0, 2.44, gateZ).rotation.y = Math.PI / 4;

  addStreetLampSet(g, [
    { x: -0.78, y: 0.2, z: 3.92, kind: 'lantern', scale: 0.95, color: '#ffce75' },
    { x: 0.78, y: 0.2, z: 3.92, kind: 'lantern', scale: 0.95, color: '#ffce75' },
    { x: -0.84, y: 0.2, z: 1.48, kind: 'victorian', scale: 0.88, color: '#ffd382' },
    { x: 0.84, y: 0.2, z: 1.48, kind: 'victorian', scale: 0.88, color: '#ffd382' },
    { x: -1.18, y: 0.2, z: 1.88, kind: 'lantern', scale: 0.85, color: '#ffd382' },
    { x: 0, y: 0.2, z: 2.6, kind: 'uplight', scale: 0.9, color: '#ffcb74', coneHeight: 1.35 },
  ]);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.5;
    tree(g, 6.6 * Math.cos(a), 6.6 * Math.sin(a), 0.8, 1);
  }
  g.userData.tick = birds(g, 4, 3.4, 5);
  return g;
}

export function amphi(): THREE.Group {
  const g = new THREE.Group();
  const wm = MCascade('#e6eff4', 0.86);
  const cm = MT('#edf2f6', 0.56, 0.98, 0, false);
  add(g, B(15.2, 0.2, 15.2), MStone('#688a48', 0.95), 0, 0.1, 0);

  // Continuous concave crescent Drakensberg basalt wall with vertical columnar flutes
  // rising above a pale Clarens Sandstone lower bench
  const span = Math.PI * 0.82;
  const wallGeo = C(4.45, 5.25, 6.1, 72, 18, false, Math.PI - span / 2, span);
  const wp = wallGeo.attributes.position;
  for (let i = 0; i < wp.count; i++) {
    const X = wp.getX(i);
    const Y = wp.getY(i);
    const Z = wp.getZ(i);
    const ang = Math.atan2(Z, X);
    const flutes = 0.26 * Math.sin(ang * 26) + 0.12 * Math.cos(ang * 43 + Y * 0.6);
    const strata = 0.08 * Math.sin(Y * 6.5);
    const radial = Math.hypot(X, Z);
    if (radial > 0.2) {
      const f = (radial + flutes + strata) / radial;
      wp.setXYZ(i, X * f, Y, Z * f);
    }
  }
  const cLower = new THREE.Color('#a89272'); // Tan Clarens Sandstone lower cliff bench
  const cBasalt = new THREE.Color('#5a625b'); // Grey Drakensberg columnar basalt upper wall
  const cHigh = new THREE.Color('#798178'); // Grey basalt light faces
  const cCrest = new THREE.Color('#688446');
  tint(wallGeo, (k, X, Y, Z) => {
    const h = (Y + 3.05) / 6.1;
    const ang = Math.atan2(Z, X);
    if (h > 0.92) k.copy(cCrest);
    else if (h < 0.24) k.copy(cLower).lerp(cBasalt, Math.max(0, (h - 0.14) / 0.1));
    else k.copy(cBasalt).lerp(cHigh, (h - 0.24) / 0.68 + 0.08 * Math.sin(ang * 26));
  });
  weatherVertexColors(wallGeo, { ao: 0.34, exposure: 0.12, grain: 0.07 });
  const wallMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    ...surfaceDetail('stone', 0.035),
    side: THREE.DoubleSide,
  });
  wallMat.userData.naturalSurface = true;
  add(g, wallGeo, wallMat, 0, 3.25, -0.7);

  // Sentinel Peak (left buttress) and Eastern Buttress (right peak)
  rock(g, 1.35, 2.05, 5.8, -5.2, -1.8, '#5a625b', '#7c8178', 0.15);
  rock(g, 1.3, 2.0, 5.2, 5.25, -2.0, '#5a625b', '#7c8178', 0.15);

  const a = -Math.PI / 2 - 0.18;
  const wx = 4.42 * Math.cos(a);
  const wz = -0.7 + 4.42 * Math.sin(a);
  // 5-step lacy white Tugela Falls leaping from basalt lip into cold slate-green stream
  add(g, CB(0.24, 5.5, 0.09, 0.025), wm, wx, 3.2, wz + 0.12);
  add(g, CB(0.2, 1.5, 0.09, 0.025), wm, wx - 0.1, 5.45, wz + 0.18).rotation.z = 0.1;
  add(g, CB(0.32, 1.9, 0.1, 0.025), wm, wx + 0.14, 3.65, wz + 0.14).rotation.z = -0.09;
  add(g, CB(0.42, 1.6, 0.11, 0.025), wm, wx - 0.04, 1.35, wz + 0.22);
  add(g, CB(2.0, 0.26, 0.9, 0.05), MStone('#565b53', 0.95), wx, 6.22, wz - 0.35);
  const coldStream = MWater('#4f6661', 0.12, 0.2); // Cold slate-green mountain water (NOT neon cyan!)
  const lipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(wx - 0.8, 6.42, wz - 1.1),
    new THREE.Vector3(wx - 0.25, 6.38, wz - 0.55),
    new THREE.Vector3(wx + 0.05, 6.32, wz - 0.12),
  ]);
  add(g, new THREE.TubeGeometry(lipCurve, 24, 0.11, 6), coldStream);
  add(g, C(0.82, 0.92, 0.06, 24), coldStream, wx, 0.23, wz + 0.32);

  const ms = Array.from({ length: 10 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.55, 12, 10),
      cm,
      wx + (R(i) - 0.5) * 1.4,
      0.5 + R(i + 3) * 0.35,
      wz + 0.3 + (R(i + 5) - 0.5) * 1.3
    );
    o.scale.y = 0.48;
    o.userData.x = o.position.x;
    return o;
  });
  for (let i = 0; i < 16; i++)
    tree(g, -5 + R(i) * 10, -0.2 + R(i + 10) * 5.2, 0.75 + R(i) * 0.35, i % 3 ? 1 : 2, 0.2);

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

  const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(wx + 0.1, 0.28, wz + 0.65),
    new THREE.Vector3(-0.9, 0.27, -1.6),
    new THREE.Vector3(0.6, 0.26, -0.4),
    new THREE.Vector3(1.2, 0.25, 1.4),
    new THREE.Vector3(3.0, 0.24, 2.4),
    new THREE.Vector3(4.6, 0.24, 4.0),
  ]);
  add(g, new THREE.TubeGeometry(riverCurve, 80, 0.24, 8), coldStream);
  const foamT: InstanceTransform[] = [];
  for (let i = 1; i < 26; i++) {
    const p = riverCurve.getPointAt(i / 26);
    foamT.push({ x: p.x, y: 0.5, z: p.z, sx: 0.5 + R(i) * 0.4, sz: 0.35 });
  }
  instancedMeshes(
    g,
    new THREE.CircleGeometry(0.14, 12).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: '#e6eff4',
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    foamT
  );

  const peakMist = Array.from({ length: 8 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.7, 12, 10),
      cm,
      -3.4 + R(i) * 6.8,
      6.2 + R(i + 3) * 0.5,
      -4.8 + (R(i + 5) - 0.5) * 1.1
    );
    o.scale.set(1.5, 0.44, 0.9);
    o.userData.x = o.position.x;
    return o;
  });

  const fall = drift(g, 150, '#eef5f8', 0.09, (i, t) => {
    const stage = i % 3;
    const u = (t * 0.85 + R(i)) % 1;
    const top = [6.2, 4.5, 2.5][stage];
    const len = [1.7, 2.1, 2.4][stage];
    const dx = [0.12, -0.06, 0.02][stage];
    return [
      wx + dx + (R(i + 3) - 0.5) * 0.34,
      top - u * len,
      wz + 0.15 + (R(i + 4) - 0.5) * 0.3 + u * 0.12,
    ];
  });
  const riverFoam = drift(
    g,
    60,
    '#eaf2f6',
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
      o.scale.y = 0.44 + 0.06 * Math.sin(t * 0.5 + i);
    });
  };
  return g;
}

export function palace(): THREE.Group {
  const g = new THREE.Group();
  const st = MStone('#b8a581', 0.72, 0.02);
  const bronze = M('#8d6e49', 0.36, 0.78);
  const verdigris = M('#586e67', 0.48, 0.36); // Weathered copper-verdigris, NOT electric teal
  const ivory = M('#e3dccb', 0.44);
  const wn = G('#f6cf84', 1.05);
  add(g, B(15.2, 0.2, 15.2), MStone('#628445', 0.95), 0, 0.1, 0);

  // Palatial travertine plinth & central hall
  add(g, CB(8.6, 0.34, 4.6, 0.05), st, 0, 0.37, -0.4);
  add(g, CB(3.4, 2.65, 2.4, 0.06), st, 0, 1.85, -0.65);
  add(g, CB(3.6, 0.16, 2.6, 0.03), bronze, 0, 3.22, -0.65);
  [-1, 1].forEach((s) => {
    add(g, CB(2.4, 1.85, 2, 0.05), st, s * 3.25, 1.44, -0.4);
    add(g, C(0.55, 0.65, 3.2, 16), st, s * 4.85, 2.02, -1.35);
    add(g, new THREE.ConeGeometry(0.78, 1.5, 16), verdigris, s * 4.85, 4.35, -1.35);
    add(g, new THREE.SphereGeometry(0.12, 8, 8), bronze, s * 4.85, 5.2, -1.35);
    add(g, C(0.35, 0.4, 2.6, 12), st, s * 1.75, 2.62, 0.45);
    add(g, new THREE.ConeGeometry(0.5, 0.9, 12), bronze, s * 1.75, 4.35, 0.45);
    for (let j = 0; j < 3; j++)
      add(g, CB(0.3, 0.6, 0.05, 0.015), wn, s * 3.25 + (j - 1) * 0.65, 1.5, 0.62);
  });

  // King's Tower dome crowned with curved ivory elephant-tusk spires
  add(g, C(0.92, 1.12, 2.05, 24), st, 0, 4.15, -0.75);
  add(g, new THREE.ConeGeometry(1.16, 2.15, 24), verdigris, 0, 6.2, -0.75);
  add(g, C(0.04, 0.04, 0.95, 6), bronze, 0, 7.6, -0.75);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const tuskCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.85, 5.25, -0.75 + Math.sin(a) * 0.85),
      new THREE.Vector3(Math.cos(a) * 1.1, 6.0, -0.75 + Math.sin(a) * 1.1),
      new THREE.Vector3(Math.cos(a) * 0.45, 6.75, -0.75 + Math.sin(a) * 0.45),
    ]);
    add(g, new THREE.TubeGeometry(tuskCurve, 10, 0.055, 6, false), ivory);
  }
  for (let j = 0; j < 4; j++) add(g, CB(0.3, 0.9, 0.05, 0.015), wn, -0.9 + j * 0.6, 2, 0.56);

  // Grand Staircase stepped water cascade + sandy crescent Valley of Waves lagoon
  for (let i = 0; i < 4; i++) {
    add(g, CB(1.5 + i * 0.25, 0.14, 0.55, 0.02), st, 0, 0.72 - i * 0.14, 1.45 + i * 0.52);
    add(g, CB(0.75, 0.05, 0.55, 0.01), MCascade('#dfeef2', 0.82), 0, 0.78 - i * 0.14, 1.45 + i * 0.52);
  }
  add(g, C(2.9, 3.05, 0.09, 36, 1, false, -Math.PI / 2, Math.PI), MStone('#dbcaa0', 0.92), 0, 0.21, 3.5);
  add(g, C(2.45, 2.45, 0.07, 36, 1, false, -Math.PI / 2, Math.PI), MWater('#4e989c', 0.08, 0.22), 0, 0.23, 3.5);
  addStreetLampSet(g, [
    { x: -3.6, y: 0.2, z: 4.45, kind: 'lantern', scale: 1.0, color: '#ffd278' },
    { x: -1.65, y: 0.2, z: 4.55, kind: 'lantern', scale: 1.0, color: '#ffd278' },
    { x: 1.65, y: 0.2, z: 4.55, kind: 'lantern', scale: 1.0, color: '#ffd278' },
    { x: 3.6, y: 0.2, z: 4.45, kind: 'lantern', scale: 1.0, color: '#ffd278' },
    { x: -1.28, y: 0.2, z: 2.65, kind: 'bollard', scale: 0.95, color: '#ffe092' },
    { x: 1.28, y: 0.2, z: 2.65, kind: 'bollard', scale: 0.95, color: '#ffe092' },
    { x: -4.25, y: 0.54, z: -1.15, kind: 'uplight', scale: 1.05, color: '#ffd078', coneHeight: 2.0 },
    { x: 4.25, y: 0.54, z: -1.15, kind: 'uplight', scale: 1.05, color: '#ffd078', coneHeight: 2.0 },
  ]);
  for (let i = 0; i < 8; i++) tree(g, -5.2 + i * 1.5, 5.25, 0.95, 3, 0.2);

  g.userData.tick = drift(g, 50, '#ffe08a', 0.07, (i, t) => [
    (R(i) - 0.5) * 4.6,
    0.35 + ((R(i + 3) * 2 + t * 0.3) % 2) * 0.85,
    3.5 + (R(i + 7) - 0.5) * 1.6,
  ]);
  return g;
}

export function golden(): THREE.Group {
  const g = new THREE.Group();
  add(g, B(15.2, 0.2, 15.2), MStone('#a4a35e', 0.96), 0, 0.1, 0);

  // Iconic Brandwag Buttress: red Elliot Formation mudstone lower slope + overhanging cream/gold Clarens Sandstone cap
  const brandwag = new THREE.Group();
  const buttressGeo = C(1.45, 2.35, 3.85, 48, 14);
  const bp = buttressGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const X = bp.getX(i);
    const Y = bp.getY(i);
    const Z = bp.getZ(i);
    const hNorm = (Y + 1.925) / 3.85;
    // Mushroom overhang lip on upper Clarens sandstone
    const flare = hNorm > 0.55 && hNorm < 0.85 ? 1.18 : 1.0;
    const f = flare * (1 + 0.14 * Math.sin(Math.atan2(Z, X) * 4 + 0.5));
    bp.setXYZ(i, X * f * 1.18, Y, Z * f * 0.82);
  }
  const cElliot = new THREE.Color('#8e544a');
  const cClarens = new THREE.Color('#c7ab7d');
  const cStreak = new THREE.Color('#5a544a');
  tint(buttressGeo, (k, X, Y) => {
    const h = (Y + 1.925) / 3.85;
    k.copy(cElliot).lerp(cClarens, THREE.MathUtils.smoothstep(h, 0.36, 0.56));
    const streak = Math.pow(Math.max(0, Math.sin(X * 5.2 + 0.8)), 8);
    if (h > 0.45) k.lerp(cStreak, streak * 0.55);
  });
  weatherVertexColors(buttressGeo, { ao: 0.28, exposure: 0.14, grain: 0.06 });
  const bwMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    ...surfaceDetail('stone', 0.034),
  });
  bwMat.userData.naturalSurface = true;
  add(brandwag, buttressGeo, bwMat, -2.5, 2.1, -2.55);
  g.add(brandwag);

  (
    [
      [-0.4, -4.0, 1.4, 2.1, 3.2],
      [3.0, -3.1, 1.5, 2.3, 3.7],
      [4.5, -0.5, 1.2, 1.8, 2.6],
      [-4.9, 0.5, 1.2, 1.9, 2.7],
    ] as const
  ).forEach(([x, z, a, b, h]) => rock(g, a, b, h, x, z, '#8e544a', '#c7ab7d', 0.15));

  // R712 Highland Pass curving highway around Brandwag foot + touring vehicles
  const r712 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.1, 0.25, 2.2),
    new THREE.Vector3(-2.8, 0.25, 0.45),
    new THREE.Vector3(1.8, 0.25, 0.35),
    new THREE.Vector3(7.1, 0.25, 2.4),
  ]);
  const roadGeo = new THREE.TubeGeometry(r712, 48, 0.28, 6, false);
  roadGeo.scale(1, 0.12, 1);
  add(g, roadGeo, MWet('#484d52', 0.86, 0.18, 0.05, 'plaster'), 0, 0.21, 0);
  const rvCars = [0, 1].map((i) => {
    const c = car(i === 0 ? '#d8d4c8' : '#3a6289', 0.34, false);
    g.add(c);
    return c;
  });
  const rvLights = attachVehicleLights(g, rvCars);

  // Highland Themeda golden grass tufts
  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 110; i++) {
    const a = R(i) * 6.28;
    const r = 1.1 + R(i + 9) * 5.9;
    grassT.push({
      x: r * Math.cos(a),
      y: 0.2,
      z: r * Math.sin(a),
      ry: R(i * 5) * 6.28,
      sy: 1.3 + R(i + 2) * 0.6,
    });
  }
  grassTufts(g, grassT, ['#b39f54', '#c2aa64', '#8f9154']);

  const cv = new THREE.CatmullRomCurve3(
    [
      [-5, 0.32, 3.8],
      [-1.5, 0.32, 3.1],
      [1.8, 0.32, 3.4],
      [4.5, 0.32, 4.4],
    ].map((p) => new THREE.Vector3(...p))
  );
  add(g, new THREE.TubeGeometry(cv, 40, 0.22, 8), MWater('#648d88', 0.1, 0.2)).scale.y = 0.3;
  for (let i = 0; i < 4; i++) tree(g, -3 + i * 2.3, 4.6 + R(i), 0.9, 2, 0.2);

  const dd = drift(g, 45, '#ffd88a', 0.06, (i, t) => [
    Math.cos(i * 2.4 + t * 0.1) * (1 + R(i) * 5.5),
    0.6 + ((R(i + 3) * 4 + t * 0.2) % 3.5),
    Math.sin(i * 2.4 + t * 0.1) * (1 + R(i) * 5.5),
  ]);
  g.userData.tick = (t: number) => {
    dd(t);
    rvCars.forEach((c, i) => {
      const u = (((t * 0.045 * (i % 2 ? -1 : 1) + i * 0.45) % 1) + 1) % 1;
      const p = r712.getPointAt(u);
      const tg = r712.getTangentAt(u);
      if (i % 2) tg.negate();
      const lane = leftLaneOffset(tg.x, tg.z, 0.3);
      c.position.set(p.x + lane.x, 0.24, p.z + lane.z);
      c.rotation.y = headingYaw(tg.x, tg.z);
    });
    rvLights.sync();
  };
  return g;
}

export function kruger(): THREE.Group {
  const g = new THREE.Group();
  add(g, B(15.2, 0.2, 15.2), MStone('#b89f5c', 0.96), 0, 0.1, 0);

  // The elephant herd is supplied by the season-gated, LOD'd wildlife layer
  // (src/data/wildlife.ts); this builder keeps only the waterhole scenery.

  // Organic Lowveld muddy-edged waterhole
  add(g, C(2.15, 2.35, 0.04, 48), MStone('#7c6b53', 0.96), 3.35, 0.205, 2.65);
  add(g, C(1.78, 1.78, 0.05, 48), MWater('#5e7d75', 0.1, 0.24), 3.35, 0.22, 2.65);
  // Red-earth Macrotermes termite mound
  add(g, C(0.24, 0.62, 1.35, 14), MBark('#9a5b3e', 0.95, 0.03), 4.65, 0.85, -1.85);
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
  for (let i = 0; i < 6; i++) tree(g, -5.2 + i * 2.1, -3.9 + R(i) * 1.4, 1.15, 2, 0.2);
  // Small ranger camp: reusable props keep human scale without new light sources.
  const campFence = kraalFence(3.6, 6);
  campFence.position.set(-5.3, 0.2, 3.9);
  campFence.rotation.y = -0.24;
  g.add(campFence);
  const supplies = crateStack(3);
  supplies.position.set(-4.35, 0.2, 4.55);
  supplies.rotation.y = 0.3;
  g.add(supplies);

  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 75; i++) {
    const a = R(i) * 6.28;
    const r = 2 + R(i + 9) * 5;
    grassT.push({ x: r * Math.cos(a), y: 0.2, z: r * Math.sin(a), ry: R(i * 3) * 6.28, sy: 1.3 });
  }
  grassTufts(g, grassT, ['#bea861', '#a89a58', '#8f9154']);

  const dd = drift(g, 45, '#e2c88e', 0.07, (i, t) => [
    Math.cos(i * 2.4 + t * 0.15) * (1 + R(i) * 5.5),
    0.4 + ((R(i + 3) * 3 + t * 0.25) % 2.5),
    Math.sin(i * 2.4 + t * 0.15) * (1 + R(i) * 5.5),
  ]);
  g.userData.tick = (t: number) => {
    dd(t);
  };
  return g;
}

export function ponte(): THREE.Group {
  const g = new THREE.Group();
  const roadMat = MWet('#41474b', 0.84, 0.16, 0.06, 'plaster');
  add(g, B(15.2, 0.2, 15.2), roadMat, 0, 0.1, 0);

  // Elevated Berea quartzite hillside rock plinth supporting Ponte City
  add(g, C(2.4, 2.95, 0.65, 32), MStone('#7c705c', 0.95), 0, 0.52, 0);
  // Exposed raw quartzite bedrock visible down inside the truly hollow core floor!
  add(g, C(0.84, 0.88, 0.42, 24), MStone('#685c4a', 0.96), 0, 0.42, 0);

  const wm = litWindowMaterial({
    wall: '#8a8172',
    lit: '#e8ca86',
    dark: '#323844',
    cols: 20,
    rows: 55,
    seed: 1,
    chance: 0.6,
    intensity: 0.18,
  });
  wm.userData.i = 0.85;
  const baseY = 0.72;
  const towerH = 7.15;
  // Open perforated exterior shell + inner dark glass/concrete hollow core wall
  add(g, C(1.62, 1.62, towerH, 64, 1, true), wm, 0, baseY + towerH / 2, 0);
  add(g, C(0.84, 0.84, towerH, 32, 1, true), MPlaster('#645e54', 0.88), 0, baseY + towerH / 2, 0);

  // Ground-floor shopfront strip facing the Berea street frontage
  shopfrontBand(g, {
    x: 0,
    y: 0.34,
    z: 2.55,
    width: 2.6,
    height: 0.3,
    lit: '#ffd08a',
    seed: 17,
    chance: 0.75,
  });

  // 24 structural vertical exterior concrete ribs
  const ribT: InstanceTransform[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ribT.push({ x: 1.64 * Math.cos(a), y: baseY + towerH / 2, z: 1.64 * Math.sin(a), ry: -a });
  }
  instancedMeshes(g, CB(0.06, towerH, 0.09, 0.015), MPlaster('#a29785', 0.82), ribT);

  // 55 exterior AND 55 inner hollow-core balcony gallery rings!
  const outerBandT: InstanceTransform[] = [];
  const innerBandT: InstanceTransform[] = [];
  for (let i = 0; i < 55; i++) {
    const y = baseY + 0.08 + i * (towerH / 55);
    outerBandT.push({ x: 0, y, z: 0, rx: Math.PI / 2 });
    innerBandT.push({ x: 0, y, z: 0, rx: Math.PI / 2 });
  }
  instancedMeshes(g, new THREE.TorusGeometry(1.645, 0.012, 4, 48), MPlaster('#a29785', 0.86), outerBandT);
  instancedMeshes(g, new THREE.TorusGeometry(0.845, 0.014, 4, 36), MPlaster('#7a7368', 0.88), innerBandT);

  // Flat open sky-ring roof parapet looking down into the hollow rock core
  const roofRing = add(
    g,
    new THREE.RingGeometry(0.84, 1.64, 64).rotateX(-Math.PI / 2),
    M('#9c9281', 0.8),
    0,
    baseY + towerH,
    0
  );
  roofRing.material.side = THREE.DoubleSide;

  // Crisp red-and-white typographic cellular billboard crown ring + open lattice steel frame
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 64;
  const sctx = signCanvas.getContext('2d')!;
  sctx.fillStyle = '#c82424';
  sctx.fillRect(0, 0, 512, 64);
  sctx.fillStyle = '#f2efe6';
  sctx.font = 'bold 34px system-ui, sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) sctx.fillText('PONTE', 85 + i * 170, 33);
  const signTex = prepareCanvasTexture(new THREE.CanvasTexture(signCanvas));
  signTex.wrapS = THREE.RepeatWrapping;
  signTex.colorSpace = THREE.SRGBColorSpace;
  const crownMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: '#a81c1c',
    emissiveMap: signTex,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  add(g, C(1.56, 1.56, 0.48, 48, 1, true), crownMat, 0, baseY + towerH + 0.42, 0);
  const framePosts: Array<readonly [[number, number, number], [number, number, number]]> = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const fx = 1.56 * Math.cos(a);
    const fz = 1.56 * Math.sin(a);
    framePosts.push([
      [fx, baseY + towerH, fz],
      [fx, baseY + towerH + 0.7, fz],
    ]);
  }
  cableBatch(g, framePosts, 0.02, M('#b8bcc2', 0.4, 0.7));

  // Rooftop obstruction beacons on the crown ring, blinking with the skyline.
  registerBeacons(
    g,
    [0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      return {
        x: Math.cos(a) * 1.5,
        y: baseY + towerH + 0.78,
        z: Math.sin(a) * 1.5,
        color: '#ff4a3d',
        size: 0.06,
      };
    })
  );

  const ponteBuildingCoords: Array<[number, number]> = [];
  for (let i = 0; i < 14; i++) {
    const a = i * 0.9;
    const r = 3.3 + R(i) * 2.9;
    const h = 1 + R(i + 4) * 3;
    const bx = r * Math.cos(a);
    const bz = r * Math.sin(a);
    ponteBuildingCoords.push([bx, bz]);
    add(g, CB(0.92, h, 0.92, 0.04), wm, bx, 0.2 + h / 2, bz);
  }
  const ponteLamps: StreetLampSpec[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.14;
    const lx = 4.78 * Math.cos(a);
    const lz = 4.78 * Math.sin(a);
    const blocked = ponteBuildingCoords.some(([bx, bz]) => Math.hypot(bx - lx, bz - lz) < 0.78);
    if (!blocked) {
      ponteLamps.push({
        x: lx,
        y: 0.2,
        z: lz,
        kind: 'cobra',
        ry: -a,
        scale: 0.9,
        color: '#ff9c3c',
        poolRadius: 1.22,
      });
    }
  }
  addStreetLampSet(g, ponteLamps);
  const cs = Array.from({ length: 8 }, (_, i) => {
    const c = car(['#c33', '#eee', '#36c', '#fc3', '#2a9d8f', '#222', '#e76f51', '#ddd'][i], 0.45, false);
    g.add(c);
    return c;
  });
  const csLights = attachVehicleLights(g, cs);
  g.userData.tick = (t: number) => {
    cs.forEach((c, i) => {
      const d = i % 2 ? 1 : -1;
      const a = i * 0.8 + t * 0.22 * d;
      const r = i % 2 ? 5.1 : 5.45;
      const tx = d > 0 ? -Math.sin(a) : Math.sin(a);
      const tz = d > 0 ? Math.cos(a) : -Math.cos(a);
      const lane = leftLaneOffset(tx, tz, 0.22);
      c.position.set(r * Math.cos(a) + lane.x, 0.2, r * Math.sin(a) + lane.z);
      c.rotation.y = headingYaw(tx, tz);
    });
    csLights.sync();
  };
  return g;
}

export function boulders(): THREE.Group {
  const g = new THREE.Group();
  // Cool False Bay slate-turquoise water + sloping pale shell-sand beach submerged beneath tide
  sea(g, '#236e79', '#478c8b');
  const shoreMat = MStone('#dfcfa8', 0.95);
  add(g, C(4.25, 4.95, 0.22, 64), shoreMat, 0, 0.08, -0.75);
  add(g, C(3.2, 3.8, 0.14, 48), MStone('#cfc098', 0.95), -0.4, 0.16, -0.95);

  // Three tight 540Ma Cape granite boulder clusters + dark wet intertidal bases (ZERO floating TubeGeometry water!)
  const clusterA: [number, number] = [-2.85, -1.85];
  const clusterB: [number, number] = [2.8, -1.65];
  const clusterC: [number, number] = [-1.15, 2.55];
  const clusters = [clusterA, clusterB, clusterC];

  const boulderT: InstanceTransform[] = [];
  const wetRingT: InstanceTransform[] = [];
  clusters.forEach(([cx, cz], ci) => {
    wetRingT.push({ x: cx, y: 0.14, z: cz, sx: 1.55, sy: 0.22, sz: 1.35 });
    for (let i = 0; i < 11; i++) {
      const a = R(ci * 30 + i) * 6.28;
      const r = 0.18 + R(ci * 40 + i) * 1.2;
      const s = 0.78 + R(ci * 50 + i) * 1.15;
      boulderT.push({
        x: cx + r * Math.cos(a),
        y: s * 0.18,
        z: cz + r * Math.sin(a),
        ry: R(ci * 60 + i) * 6.28,
        sx: s * (1.05 + R(ci * 70 + i) * 0.3),
        sy: s * (0.72 + R(ci * 80 + i) * 0.22),
        sz: s,
      });
    }
  });
  scatterRocks(g, wetRingT, '#4a4742', '#52504b'); // Wet dark intertidal granite bases
  scatterRocks(g, boulderT, '#858379', '#aba193');
  lump(g, 1.2, clusterA[0], clusterA[1], 1.35, 0.78, '#7e7b73', '#a39a8c');
  lump(g, 1.05, clusterB[0], clusterB[1], 1.3, 0.72, '#7e7b73', '#a39a8c');
  lump(g, 0.9, clusterC[0], clusterC[1], 1.25, 0.7, '#7e7b73', '#a39a8c');

  const pebbleT: InstanceTransform[] = [];
  clusters.forEach(([cx, cz], ci) => {
    for (let i = 0; i < 9; i++) {
      const a = R(ci * 90 + i + 110) * 6.28;
      const r = 0.6 + R(ci * 100 + i + 130) * 1.1;
      pebbleT.push({
        x: cx + r * Math.cos(a),
        y: 0.21,
        z: cz + r * Math.sin(a),
        sx: 0.28 + R(i + 2) * 0.24,
        sy: 0.16 + R(i + 5) * 0.12,
        sz: 0.28 + R(i + 7) * 0.24,
      });
    }
  });
  scatterRocks(g, pebbleT, '#7e7b73', '#a39a8c');

  // The waddling foreground penguins are supplied by the season-gated, LOD'd
  // wildlife layer at the three boulder clusters (src/data/wildlife.ts).
  // Only the cheap static far tier is built here.
  const penguinSpot = (i: number): [number, number, number] => {
    const c = i % 3 === 0 ? clusterA : i % 3 === 1 ? clusterB : clusterC;
    const a = R(i + 20) * 6.28;
    const r = 1.15 + R(i + 30) * 0.85;
    return [c[0] + r * Math.cos(a), 0.2, c[1] + r * Math.sin(a)];
  };

  // Batched background colony with authentic pink eye spots + black feet
  const penT: InstanceTransform[] = [];
  for (let i = 0; i < 36; i++) {
    const [px, py, pz] = penguinSpot(i + 100);
    const sc = 0.45 + R(i + 5) * 0.14;
    penT.push({ x: px, y: py, z: pz, ry: R(i + 90) * 6.28, sx: sc, sy: sc, sz: sc });
  }
  const bk = M('#1b2029', 0.58);
  const wt = M('#e3e1d9', 0.68);
  const pk = M('#d47c80', 0.62);
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
  instancedMeshes(g, new THREE.SphereGeometry(0.032, 6, 5).translate(0.075, 0.81, 0.085), pk, penT);
  instancedMeshes(g, new THREE.SphereGeometry(0.032, 6, 5).translate(-0.075, 0.81, 0.085), pk, penT);
  instancedMeshes(g, CB(0.18, 0.035, 0.16, 0.01).translate(0, 0.02, 0.06), bk, penT);

  const colonySign = interpretiveSign('#d8a64a');
  colonySign.position.set(1.2, 0.32, -3.2);
  colonySign.rotation.y = -Math.PI / 2;
  colonySign.scale.setScalar(0.8);
  g.add(colonySign);
  const colonyBench = bench();
  colonyBench.position.set(2.0, 0.3, -2.5);
  colonyBench.rotation.y = -Math.PI / 2;
  g.add(colonyBench);

  // Foxy Beach timber boardwalk
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
  addStreetLampSet(g, [
    { x: 0.72, y: 0.33, z: -3.2, kind: 'bollard', scale: 0.76, color: '#ffd482', poolRadius: 0.65 },
    { x: 1.68, y: 0.33, z: -1.6, kind: 'bollard', scale: 0.76, color: '#ffd482', poolRadius: 0.65 },
    { x: 0.72, y: 0.33, z: 0.0, kind: 'bollard', scale: 0.76, color: '#ffd482', poolRadius: 0.65 },
    { x: 1.68, y: 0.33, z: 1.2, kind: 'bollard', scale: 0.76, color: '#ffd482', poolRadius: 0.65 },
  ]);

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
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.3, 1), Mc('#73865e'), shrubT, [
    '#73865e',
    '#8d9770',
    '#697b53',
  ]);
  const shoreFoam = [4.65, 4.95].map((r, i) =>
    add(
      g,
      new THREE.TorusGeometry(r, 0.035, 6, 96).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: '#e6f4f8',
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
  const dk = M('#24272d', 0.45, 0.65);
  const rd = MPlaster('#9c3a2c', 0.64); // Deep oxide red
  const wh = MPlaster('#e6e1d3', 0.68);
  sea(g, '#265c74', '#478f98');
  add(g, C(4.2, 4.6, 0.48, 64), MStone('#9e8864', 0.94), -0.4, 0.24, 0);

  // Jagged dark intertidal Table Mountain sandstone reef ridges around the cape
  const reefT: InstanceTransform[] = [];
  for (let i = 0; i < 20; i++) {
    const a = R(i) * 6.28;
    const r = 3.8 + R(i + 3) * 1.4;
    reefT.push({
      x: -0.4 + r * Math.cos(a),
      y: 0.18,
      z: r * Math.sin(a),
      ry: a + 0.4,
      sx: 0.72 + R(i + 5) * 0.45,
      sy: 0.26 + R(i + 9) * 0.22,
      sz: 0.36 + R(i + 12) * 0.2,
    });
  }
  scatterRocks(g, reefT, '#4e4945', '#6c635a');

  // Red Pharos tower with single broad white band + Keeper's wing FUSED seamlessly to the base plinth!
  add(g, CB(1.5, 0.42, 1.5, 0.04), wh, -0.4, 0.62, 0);
  colonialHouse(g, {
    x: -1.45,
    y: 0.42,
    z: 0.45,
    w: 1.55,
    h: 0.68,
    d: 1.08,
    wall: '#e6e1d3',
    roof: '#9c3a2c',
  });
  for (let i = 0; i < 6; i++) {
    add(
      g,
      C(0.62 - i * 0.045, 0.68 - i * 0.045, 0.62, 32),
      i === 4 ? wh : rd,
      -0.4,
      0.83 + i * 0.62,
      0
    );
  }
  add(g, C(0.5, 0.45, 0.12, 32), dk, -0.4, 4.32, 0);
  railing(g, 0.5, -0.4, 4.38, 0, dk, 10, 0.14, 0.012);
  add(g, C(0.3, 0.3, 0.4, 24), lt, -0.4, 4.57, 0);
  add(g, new THREE.ConeGeometry(0.38, 0.4, 24), rd, -0.4, 4.97, 0);

  // Authentic Cape Agulhas Southernmost Tip cairn + brass plaque + coastal boardwalk
  add(g, CB(0.52, 0.14, 0.52, 0.02), MStone('#686058', 0.94), 2.35, 0.54, 2.25);
  add(g, C(0.18, 0.26, 0.38, 8), MStone('#686058', 0.94), 2.35, 0.78, 2.25);
  add(g, CB(0.24, 0.18, 0.03, 0.005), M('#c9a24b', 0.35, 0.8), 2.35, 0.76, 2.46);
  add(g, CB(1.75, 0.08, 0.44, 0.02), MWood('#8a6d48', 0.88), 1.3, 0.5, 1.9).rotation.y = -0.25;
  addStreetLampSet(g, [
    { x: -1.45, y: 0.42, z: 1.05, kind: 'lantern', scale: 0.85, color: '#ffd990' },
    { x: 0.55, y: 0.53, z: 1.56, kind: 'bollard', scale: 0.8, color: '#ffcf7d' },
    { x: 1.25, y: 0.53, z: 1.74, kind: 'bollard', scale: 0.8, color: '#ffcf7d' },
    { x: 1.95, y: 0.53, z: 1.92, kind: 'bollard', scale: 0.8, color: '#ffcf7d' },
  ]);

  const bm = new THREE.Group();
  bm.position.set(-0.4, 4.57, 0);
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
  const sweep = addLighthouseSweep(g, -0.4, 0.5, 0, 6.0, '#ffefb2');
  const sr = seaRings(g, 0.12, 3.6, 3);
  const spray = drift(
    g,
    50,
    '#e4f2f8',
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
    sweep.rotation.y = bm.rotation.y;
    sr(t);
    spray(t);
    bd(t);
  };
  return g;
}

export function orlando(): THREE.Group {
  const g = new THREE.Group();
  const pal = ['#b85e50', '#be8655', '#c9a54b', '#458f96', '#6a7478', '#a4a798'];
  add(g, B(15.2, 0.2, 15.2), MStone('#80965b', 0.94), 0, 0.1, 0);
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
      0.72,
      0
    ).scale.setScalar(0.85);
  };
  T(-2.4, '#a4a798', '#6a7478');
  T(2.4, '#a4a798', '#6a7478');

  // Soweto colorful perimeter homes with pitched roofs
  for (let i = 0; i < 16; i++) {
    const a = i * 0.4;
    const r = 5.4 + R(i) * 1.2;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    const body = add(g, CB(0.7, 0.45, 0.55, 0.02), MPlaster(pal[i % 6], 0.78), x, 0.43, z);
    body.rotation.y = -a;
    const rf = add(g, gableRoofGeo(0.72, 0.56, 0.18, 0.04), M('#6a7478', 0.45, 0.55), x, 0.65, z);
    rf.rotation.y = -a;
  }
  const jp = add(g, new THREE.SphereGeometry(0.09, 10, 8), M('#ff3b3b', 0.4), 0, 5.1, 0);
  const cd = add(g, B(0.022, 1, 0.022), M('#222'), 0, 5.1, 0);
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
    const c = car(['#b85e50', '#ddd', '#458f96', '#be8655', '#6a7478'][i], 0.5, false);
    g.add(c);
    return c;
  });
  const ocLights = attachVehicleLights(g, oc);
  g.userData.tick = (t: number) => {
    const y = 5.0 - 3.6 * Math.abs(Math.sin(t * 1.2));
    jp.position.y = y;
    cd.scale.y = 5.0 - y + 0.01;
    cd.position.y = (5.0 + y) / 2;
    bd(t);
    oc.forEach((c, i) => {
      const a = i * 1.25 + t * 0.2;
      const tx = -Math.sin(a);
      const tz = Math.cos(a);
      const lane = leftLaneOffset(tx, tz, 0.24);
      c.position.set(4.9 * Math.cos(a) + lane.x, 0.21, 4.9 * Math.sin(a) + lane.z);
      c.rotation.y = headingYaw(tx, tz);
    });
    ocLights.sync();
  };
  return g;
}

export function bourke(): THREE.Group {
  const g = new THREE.Group();
  const H: Array<[number, number, number]> = [
    [-1.5, 0.8, 0.92],
    [0.6, -0.4, 0.72],
    [2.05, 1.45, 0.56],
    [-0.2, 2.1, 0.52],
    [1.8, -1.8, 0.82],
    [-2.5, -1.4, 0.62],
    [-3.2, 1.8, 0.46],
  ];
  const sh = new THREE.Shape();
  const sw: THREE.Mesh[] = [];
  const rl = M('#4b525c', 0.45, 0.65);
  sh.absarc(0, 0, 5.6, 0, Math.PI * 2, false);
  H.forEach(([x, y, r]) => {
    const h = new THREE.Path();
    h.absarc(x, y, r, 0, Math.PI * 2, true);
    sh.holes.push(h);
  });

  // Dramatic curved mineral sandstone striations (ochre, rust-copper, cream & manganese-black)
  const cRust = new THREE.Color('#9a5436');
  const cOchre = new THREE.Color('#c9a87a');
  const cCream = new THREE.Color('#dfd5be');
  const cMn = new THREE.Color('#3d3531');
  const potGeo = tint(
    new THREE.ExtrudeGeometry(sh, {
      depth: 1.15,
      bevelEnabled: true,
      bevelSize: 0.045,
      bevelThickness: 0.045,
      bevelSegments: 2,
      curveSegments: 36,
    }).rotateX(-Math.PI / 2),
    (k, X, Y, Z) => {
      const band = Math.sin(Y * 18 + Math.sin(X * 0.9 + Z * 0.7) * 2.2);
      const streak = Math.pow(Math.max(0, Math.sin(Math.atan2(Z, X) * 6 + Y * 4)), 6);
      k.copy(band > 0.2 ? cCream : band > -0.35 ? cOchre : cRust);
      k.lerp(cMn, streak * 0.42 + (1 - Math.min(1, Y / 1.15)) * 0.25);
    }
  );
  weatherVertexColors(potGeo, { ao: 0.28, exposure: 0.12, grain: 0.06 });
  const potMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    ...surfaceDetail('stone', 0.032),
    side: THREE.DoubleSide,
  });
  potMat.userData.naturalSurface = true;
  add(g, potGeo, potMat);

  // Stepped tannin plunge pools linked by cascading riffle chutes
  const potholeWater = MWater('#55523d', 0.09, 0.25);
  H.forEach(([x, y, r], idx) => {
    const py = 0.62 + (idx % 3) * 0.08;
    add(g, new THREE.CircleGeometry(r * 0.98, 32).rotateX(-Math.PI / 2), potholeWater, x, py, -y);
    sw.push(
      add(
        g,
        new THREE.RingGeometry(r * 0.35, r * 0.9, 24, 1, 0, 2.2).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({
          color: '#dbd6c6',
          transparent: true,
          opacity: 0.46,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
        x,
        py + 0.02,
        -y
      )
    );
  });

  // Two angled steel-and-timber pedestrian footbridges across the potholes
  const addFootbridge = (cx: number, cy: number, cz: number, len: number, ry: number) => {
    const bg = new THREE.Group();
    bg.position.set(cx, cy, cz);
    bg.rotation.y = ry;
    add(bg, CB(len, 0.09, 0.6, 0.02), MWood('#7a583a', 0.82), 0, 0, 0);
    const posts: InstanceTransform[] = [];
    [-0.28, 0.28].forEach((z) => {
      add(bg, CB(len, 0.045, 0.045, 0.01), rl, 0, 0.3, z);
      for (let i = 0; i < 6; i++) posts.push({ x: -len * 0.46 + i * ((len * 0.92) / 5), y: 0.15, z });
    });
    instancedMeshes(bg, CB(0.045, 0.32, 0.045, 0.01), rl, posts);
    [-1, 1].forEach((s) =>
      add(bg, CB(0.2, cy + 0.1, 0.72, 0.03), MStone('#7a5a3c', 0.88), s * (len * 0.5 + 0.05), -cy / 2, 0)
    );
    g.add(bg);
  };
  addFootbridge(0, 1.38, 0.15, 5.2, 0.12);
  addFootbridge(-0.65, 1.56, -1.65, 3.8, -0.58);
  addStreetLampSet(g, [
    { x: -2.55, y: 1.43, z: -0.15, kind: 'bollard', scale: 0.78, color: '#ffd080', poolRadius: 0.68 },
    { x: 2.55, y: 1.43, z: 0.45, kind: 'bollard', scale: 0.78, color: '#ffd080', poolRadius: 0.68 },
    { x: -2.2, y: 1.61, z: -0.5, kind: 'bollard', scale: 0.78, color: '#ffd080', poolRadius: 0.68 },
    { x: 0.9, y: 1.61, z: -2.8, kind: 'bollard', scale: 0.78, color: '#ffd080', poolRadius: 0.68 },
  ]);

  rock(g, 1.5, 2.2, 3.2, -5.4, -3, '#8f7a5e', '#c0a078', 0.14);
  rock(g, 1.2, 1.9, 2.6, 5.2, -3.6, '#8f7a5e', '#c0a078', 0.14);
  for (let i = 0; i < 7; i++) {
    const q = i * 0.9 + 0.6;
    tree(g, 6.4 * Math.cos(q), 6.4 * Math.sin(q), 0.82, i % 2 ? 1 : 2);
  }
  const ms = drift(g, 45, '#e8eef2', 0.08, (i, t) => [
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

