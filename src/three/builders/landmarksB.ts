import * as THREE from 'three';
import {
  agulhas,
  amphi,
  baobab,
  bokaap,
  boulders,
  bourke,
  bridge,
  capePoint,
  castle,
  golden,
  hole,
  holewall,
  kruger,
  orlando as orlandoBase,
  palace,
  ponte,
  rondavels,
  soccer,
  stadium,
  table,
  union,
  voortrekker,
} from './landmarksA';
import {
  add,
  animal,
  B,
  birds,
  boat,
  C,
  cableBatch,
  capeDutchGableGeo,
  car,
  catenaryTube,
  CB,
  colonialHouse,
  drift,
  G,
  gableRoofGeo,
  gemsbok,
  gondola,
  grassTufts,
  halfmensTree,
  hippo,
  instancedMeshes,
  M,
  MBark,
  Mc,
  mergeByMaterial,
  MCascade,
  MGlass,
  MPlaster,
  MStone,
  MT,
  MWater,
  MWet,
  MWood,
  quiverTree,
  R,
  railing,
  rock,
  rondavel,
  scatterRocks,
  sea,
  seaRings,
  surfaceDetail,
  tint,
  tree,
  weatherVertexColors,
  whale,
  type InstanceTransform,
} from './primitives';
import { prepareCanvasTexture } from '../shaders';
import {
  addLighthouseSweep,
  addStreetLampSet,
  applyDioramaUpgrade,
  corniceBand,
  doorSurround,
  facadeWindow,
  type StreetLampSpec,
} from './dioramaKit';

export function augrabies(): THREE.Group {
  const g = new THREE.Group();
  const wm = MCascade('#eef4f6', 0.88);
  const cm = MT('#edf2f6', 0.54, 0.98, 0, false);
  const gneissBase = '#8b6f5c';
  const gneissTop = '#b68968';
  add(g, B(15.2, 0.2, 15.2), MStone('#846a57', 0.95), 0, 0.1, 0);

  // Exfoliated pink-grey biotite-gneiss ("Moon Rock") dome flanks & sheer granite slot canyon
  add(g, B(3.6, 0.08, 12.2), MWater('#747664', 0.1, 0.22), 0.1, 0.22, 0.4); // Silt-khaki Orange River slot
  rock(g, 2.2, 2.9, 4.4, -3.7, -2.5, gneissBase, gneissTop, 0.14);
  rock(g, 2.3, 3.0, 4.3, 3.8, -2.3, gneissBase, gneissTop, 0.14);
  rock(g, 1.8, 2.6, 3.4, -3.9, 1.6, gneissBase, gneissTop, 0.16);
  rock(g, 1.9, 2.7, 3.3, 3.9, 1.8, gneissBase, gneissTop, 0.16);
  rock(g, 2.6, 3.4, 4.6, 0.1, -5.6, gneissBase, gneissTop, 0.15);

  // Exfoliated smooth Moon Rock granite whaleback domes on the dry Northern Cape rim
  for (const [dx, dz, sx, sy] of [
    [-5.2, -4.1, 1.5, 0.65],
    [5.3, -3.9, 1.4, 0.62],
    [-4.9, 4.2, 1.3, 0.55],
    [5.1, 4.0, 1.35, 0.58],
  ]) {
    const dome = add(g, new THREE.SphereGeometry(1.1, 20, 12), MStone('#9e836c', 0.88, 0.025), dx, 0.35, dz);
    dome.scale.set(sx, sy, 1.25);
  }

  // Broad multi-braided Orange River chute plunging into the sheer granite canyon slot
  add(g, CB(1.42, 4.9, 0.16, 0.03), wm, 0.1, 2.7, -3.95);
  add(g, CB(0.28, 3.4, 0.09, 0.02), wm, -0.88, 1.95, -3.75);
  add(g, CB(0.24, 3.0, 0.08, 0.02), wm, 0.96, 1.75, -3.72);
  add(g, new THREE.SphereGeometry(0.45, 14, 10), cm, 0.1, 5.15, -3.95).scale.set(1.55, 0.34, 0.72);

  // Wet near-black biotite-gneiss plunge apron
  const wetRock = MStone('#3d342c', 0.68, 0.025);
  ([
    [0.1, -3.9, 1.55],
    [-0.88, -3.7, 0.7],
    [0.96, -3.65, 0.65],
  ] as const).forEach(([wx, wz, wr]) => {
    add(g, C(wr, wr * 1.12, 0.05, 28), wetRock, wx, 0.245, wz).scale.z = 0.72;
  });

  // Winding silt-khaki Orange River flowing down the deep slot gorge
  const riverPts = [
    new THREE.Vector3(0.1, 0, -3.1),
    new THREE.Vector3(-0.35, 0, -1.4),
    new THREE.Vector3(0.4, 0, 0.6),
    new THREE.Vector3(0.1, 0, 2.8),
    new THREE.Vector3(0.75, 0, 5.5),
  ];
  const riverGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(riverPts), 64, 0.72, 10);
  riverGeo.scale(1, 0.16, 1);
  add(g, riverGeo, MWater('#747664', 0.09, 0.22), 0, 0.26, 0);
  const riverCurve = new THREE.CatmullRomCurve3(riverPts.map((p) => p.clone().setY(0.3)));

  const ms = Array.from({ length: 9 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.5 + R(i) * 0.24, 12, 10),
      cm,
      (R(i) - 0.5) * 1.7,
      0.48 + R(i + 3) * 0.45,
      -3.25 + R(i + 5) * 0.7
    );
    o.scale.y = 0.45;
    o.userData.x = o.position.x;
    return o;
  });
  const wf = drift(g, 130, '#eef4f6', 0.1, (i, t) => {
    const u = (t * 0.9 + R(i)) % 1;
    return [(R(i + 3) - 0.5) * 1.0, 5.05 - u * 4.75, -3.9 + (R(i + 4) - 0.5) * 0.25 + u * 0.3];
  });
  const plume = drift(
    g,
    55,
    '#eef5f8',
    0.14,
    (i, t) => {
      const u = (t * 0.45 + R(i)) % 1;
      const sp = 0.25 + u * 1.1;
      return [(R(i + 3) - 0.5) * sp, 0.35 + u * 2.4, -3.2 + (R(i + 5) - 0.5) * sp];
    },
    0.5
  );
  const foam = drift(
    g,
    60,
    '#e4ebe8',
    0.09,
    (i, t) => {
      const u = (t * 0.1 + R(i)) % 1;
      const p = riverCurve.getPointAt(u);
      const a = R(i + 3) * 6.28 + t;
      const rr = R(i + 5) * 0.45;
      return [p.x + Math.cos(a) * rr, 0.31, p.z + Math.sin(a) * rr];
    },
    0.7
  );

  // Dichotomous Northern Cape Quiver Trees on the dry gorge rim
  (
    [
      [-5.6, 0.2, -1.5, 1.05],
      [-6.2, 0.2, -3.3, 1.15],
      [5.5, 0.2, -2.3, 1.1],
      [6.3, 0.2, -0.5, 0.92],
      [-5.0, 0.2, 3.2, 0.95],
      [5.4, 0.2, 2.9, 1.0],
    ] as const
  ).forEach(([x, y, z, s], i) => quiverTree(g, x, y, z, s, i * 1.7));

  // Cantilevered wooden gorge rim viewing deck + volumetric 3D steel-rail footbridges (ZERO lines()!)
  const plank = MWood('#9b7a54', 0.9);
  const railMat = M('#4a5058', 0.45, 0.65);
  add(g, CB(1.4, 0.08, 0.85, 0.02), plank, -2.25, 3.62, -1.65);
  cableBatch(
    g,
    [
      [[-2.9, 3.66, -2.02], [-2.9, 3.98, -2.02]],
      [[-1.6, 3.66, -2.02], [-1.6, 3.98, -2.02]],
      [[-1.6, 3.66, -1.28], [-1.6, 3.98, -1.28]],
      [[-2.9, 3.98, -2.02], [-1.6, 3.98, -2.02]],
      [[-1.6, 3.98, -2.02], [-1.6, 3.98, -1.28]],
    ],
    0.022,
    railMat
  );
  (
    [
      [0.35, 0.8, 0],
      [0.45, 3.0, 0.25],
    ] as const
  ).forEach(([bx, bz, ry]) => {
    const br = new THREE.Group();
    br.position.set(bx, 0, bz);
    br.rotation.y = ry;
    g.add(br);
    add(br, CB(1.9, 0.06, 0.48, 0.02), plank, 0, 0.46, 0);
    const segs: Array<readonly [[number, number, number], [number, number, number]]> = [];
    for (const rz of [-0.2, 0.2]) {
      segs.push([[-0.88, 0.84, rz], [0.88, 0.84, rz]]);
      for (const px of [-0.88, -0.3, 0.3, 0.88]) segs.push([[px, 0.48, rz], [px, 0.84, rz]]);
    }
    cableBatch(br, segs, 0.018, railMat);
  });
  addStreetLampSet(g, [
    { x: -2.86, y: 3.66, z: -1.32, kind: 'lantern', scale: 0.78, color: '#ffd688', poolRadius: 0.72 },
    { x: -1.64, y: 3.66, z: -1.98, kind: 'lantern', scale: 0.78, color: '#ffd688', poolRadius: 0.72 },
    { x: -0.5, y: 0.49, z: 0.98, kind: 'bollard', scale: 0.72, color: '#ffd080', poolRadius: 0.6 },
    { x: 1.2, y: 0.49, z: 0.62, kind: 'bollard', scale: 0.72, color: '#ffd080', poolRadius: 0.6 },
    { x: -0.4, y: 0.49, z: 3.18, kind: 'bollard', scale: 0.72, color: '#ffd080', poolRadius: 0.6 },
    { x: 1.3, y: 0.49, z: 2.78, kind: 'bollard', scale: 0.72, color: '#ffd080', poolRadius: 0.6 },
  ]);

  const sr = seaRings(g, 0.32, 1.1, 4);
  const bd = birds(g, 3, 3.5, 6);
  g.userData.tick = (t: number) => {
    wf(t);
    sr(t);
    bd(t);
    plume(t);
    foam(t);
    ms.forEach((o, i) => {
      o.position.x = (o.userData.x as number) + Math.sin(t * 0.5 + i) * 0.12;
      o.scale.y = 0.45 + 0.1 * Math.sin(t * 0.8 + i);
    });
  };
  return g;
}

export function salt(): THREE.Group {
  const g = new THREE.Group();
  const alu = M('#cfd4d8', 0.3, 0.62);
  const aluFacet = new THREE.MeshStandardMaterial({
    color: '#c9cfd4',
    roughness: 0.32,
    metalness: 0.58,
    flatShading: true,
  });
  const dk = M('#242730', 0.48, 0.58);
  const mir = M('#7c9dab', 0.12, 0.9);
  add(g, B(15.2, 0.2, 15.2), MStone('#a88462', 0.96), 0, 0.1, 0);
  add(g, C(2.2, 2.4, 0.5, 36), MStone('#cfc9ba', 0.84), 0, 0.45, 0);

  // Rotating faceted geodesic aluminum enclosure + 37-degree open shutter exposing 91-hex mirror & tracker truss
  const en = new THREE.Group();
  en.position.y = 0.7;
  g.add(en);
  add(en, C(1.48, 1.54, 2.25, 20), aluFacet, 0, 1.125, 0);
  // Louvre ventilation collar
  add(en, C(1.52, 1.52, 0.28, 24), dk, 0, 2.25, 0);
  add(
    en,
    new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    aluFacet,
    0,
    2.36,
    0
  );
  // Open 37-degree tilted shutter slot + recessed dark interior bay
  const bay = add(en, CB(0.76, 1.68, 0.36, 0.02), dk, 0, 2.48, 1.24);
  bay.rotation.x = -0.35;
  // Instanced hexagonal primary mirror array inside the open bay
  const hexT: InstanceTransform[] = [];
  for (let row = -2; row <= 2; row++) {
    for (let col = -2; col <= 2; col++) {
      if (Math.abs(row) + Math.abs(col) > 3) continue;
      hexT.push({
        x: col * 0.135 + (row % 2 ? 0.068 : 0),
        y: 2.02 + row * 0.12,
        z: 1.42 + (2 - row) * 0.04,
        rx: Math.PI / 2 - 0.35,
      });
    }
  }
  instancedMeshes(en, C(0.068, 0.068, 0.02, 6), mir, hexT);
  // Suspended steel tracker payload tripod above primary mirror
  cableBatch(
    en,
    [
      [[0, 2.92, 1.18], [-0.34, 2.05, 1.38]],
      [[0, 2.92, 1.18], [0.34, 2.05, 1.38]],
      [[0, 2.92, 1.18], [0, 2.55, 1.32]],
    ],
    0.018,
    M('#aeb8bd', 0.35, 0.72)
  );
  add(en, CB(0.24, 0.12, 0.24, 0.02), alu, 0, 2.95, 1.18);
  add(en, C(0.26, 0.26, 0.35, 12), M('#b23a2c', 0.45), 0, 3.88, 0);
  add(en, new THREE.SphereGeometry(0.075, 10, 8), G('#ff4a3a', 2.0), 0, 4.14, 0);

  // Iconic slender tall white CCAS calibration tower beside SALT
  add(g, C(0.26, 0.34, 4.65, 16), alu, -4.4, 2.55, -1.2);
  add(g, C(0.42, 0.42, 0.12, 16), dk, -4.4, 4.94, -1.2);
  add(g, new THREE.SphereGeometry(0.18, 12, 8), mir, -4.4, 5.12, -1.2);

  // SAAO Sutherland secondary domes & operations hall
  [
    [-3.4, 2.2],
    [3.5, 1.4],
    [-2.6, -3.2],
  ].forEach(([x, z]) => {
    add(g, C(0.5, 0.55, 0.5, 20), alu, x, 0.45, z);
    add(g, new THREE.SphereGeometry(0.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), alu, x, 0.7, z);
  });
  colonialHouse(g, {
    x: 3.6,
    y: 0.16,
    z: -2.8,
    w: 2.0,
    h: 0.65,
    d: 1.2,
    wall: '#d8d2c4',
    roof: '#465260',
  });
  addStreetLampSet(g, [
    { x: 2.75, y: 0.18, z: -2.02, kind: 'bollard', scale: 0.82, color: '#ff7022', poolRadius: 0.56 },
    { x: 4.45, y: 0.18, z: -2.02, kind: 'bollard', scale: 0.82, color: '#ff7022', poolRadius: 0.56 },
    { x: 2.15, y: 0.18, z: -1.35, kind: 'bollard', scale: 0.8, color: '#ff7022', poolRadius: 0.54 },
    { x: 1.4, y: 0.18, z: -0.7, kind: 'bollard', scale: 0.8, color: '#ff7022', poolRadius: 0.54 },
    { x: -2.55, y: 0.18, z: 1.85, kind: 'bollard', scale: 0.8, color: '#ff7022', poolRadius: 0.54 },
  ]);

  for (let i = 0; i < 4; i++) {
    const a = i * 1.7 + 0.3;
    rock(
      g,
      0.5,
      0.9,
      0.9 + R(i) * 0.6,
      5.6 * Math.cos(a),
      5.6 * Math.sin(a),
      '#827c72',
      '#a59268',
      0.12
    );
  }
  const scrubT: InstanceTransform[] = [];
  for (let i = 0; i < 40; i++) {
    const a = R(i) * 6.28;
    const r = 2.8 + R(i + 9) * 4;
    scrubT.push({
      x: r * Math.cos(a),
      y: 0.25,
      z: r * Math.sin(a),
      sx: 0.45,
      sy: 0.28,
      sz: 0.45,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.32, 1), Mc('#73795f'), scrubT, [
    '#8a8a6a',
    '#69775f',
  ]);
  g.userData.tick = (t: number) => {
    en.rotation.y = t * 0.15;
  };
  return g;
}

export function bloukrans(): THREE.Group {
  const g = new THREE.Group();
  const cn = MStone('#aaada6', 0.76, 0.016);
  const roadMat = MWet('#646b66', 0.84, 0.15, 0.05, 'plaster');
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  add(g, B(15.2, 0.2, 15.2), MStone('#4b6144', 0.95), 0, 0.1, 0);
  // Deep forested V-shaped Tsitsikamma gorge floor & dark river ribbon
  add(g, CB(1.75, 0.08, 12.6, 0.02), MWater('#3d6864', 0.09, 0.24), 0, 0.24, 0);
  [-5.25, 5.25].forEach((x) => {
    rock(g, 1.9, 2.5, 4.7, x, 0, '#4b6144', '#6f7f56', 0.11);
    rock(g, 1.5, 2.1, 4.0, x * 1.05, -3.8, '#4b6144', '#6f7f56', 0.11);
    rock(g, 1.5, 2.1, 3.6, x * 1.05, 3.8, '#4b6144', '#6f7f56', 0.11);
  });

  // Twin parallel parabolic concrete arch ribs + spandrel piers
  [-0.26, 0.26].forEach((zOff) => {
    const pt: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const x = -3.1 + i * (6.2 / 24);
      pt.push(V(x, 2.35 + 1.65 * (1 - (x / 3.1) ** 2), zOff));
    }
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pt), 48, 0.15, 8), cn);
  });
  for (let i = -2; i <= 2; i++) {
    const x = i * 1.2;
    const y = 2.35 + 1.65 * (1 - (x / 3.1) ** 2);
    [-0.26, 0.26].forEach((zOff) => add(g, C(0.08, 0.1, 4.65 - y, 8), cn, x, (y + 4.65) / 2, zOff));
  }
  add(g, CB(11, 0.2, 0.92, 0.03), roadMat, 0, 4.72, 0);
  [-0.4, 0.4].forEach((z) => add(g, CB(11, 0.22, 0.05, 0.01), M('#858d86', 0.42, 0.65), 0, 4.92, z));

  // Under-deck suspended steel mesh bungee catwalk & center-crown jump gantry
  add(g, CB(3.8, 0.04, 0.36, 0.01), M('#4f575f', 0.4, 0.72), 0, 4.18, 0);
  add(g, CB(0.65, 0.14, 0.62, 0.02), M('#2e343a', 0.4, 0.75), 0, 4.16, 0);
  const catwalkSusp: Array<readonly [[number, number, number], [number, number, number]]> = [];
  for (let i = -3; i <= 3; i++) {
    for (const z of [-0.16, 0.16]) {
      catwalkSusp.push([[i * 0.55, 4.62, z], [i * 0.55, 4.18, z]]);
    }
  }
  cableBatch(g, catwalkSusp, 0.014, M('#8c949c', 0.4, 0.7));
  const bloukransLamps: StreetLampSpec[] = [];
  for (const x of [-4.2, -1.4, 1.4, 4.2]) {
    bloukransLamps.push({
      x,
      y: 4.82,
      z: -0.4,
      kind: 'cobra',
      ry: -Math.PI / 2,
      scale: 0.68,
      color: '#ffbe6b',
      poolRadius: 0.88,
    });
    bloukransLamps.push({
      x,
      y: 4.82,
      z: 0.4,
      kind: 'cobra',
      ry: Math.PI / 2,
      scale: 0.68,
      color: '#ffbe6b',
      poolRadius: 0.88,
    });
  }
  bloukransLamps.push(
    { x: -0.45, y: 4.2, z: -0.22, kind: 'lantern', scale: 0.65, color: '#e2f2ff', poolRadius: 0.65 },
    { x: 0.45, y: 4.2, z: 0.22, kind: 'lantern', scale: 0.65, color: '#e2f2ff', poolRadius: 0.65 }
  );
  addStreetLampSet(g, bloukransLamps);

  for (let i = 0; i < 8; i++) {
    tree(g, (i % 2 ? 5.2 : -5.2) + (R(i) - 0.5) * 1.2, (R(i + 5) - 0.5) * 2.4, 1.1, 1, 4.6);
  }
  const jp = add(g, new THREE.SphereGeometry(0.1, 10, 8), M('#b23a2c', 0.4), 0, 4.1, 0);
  const cd = add(g, B(0.02, 1, 0.02), M('#222'), 0, 4.1, 0);
  const bd = birds(g, 3, 4, 7);
  const cr = [0, 1, 2, 3].map((i) => {
    const c = car(['#c33', '#fff', '#36c', '#222'][i], 0.5);
    c.position.set(0, 4.84, i % 2 ? 0.2 : -0.2);
    c.rotation.y = i % 2 ? 0 : Math.PI;
    g.add(c);
    return c;
  });
  const mist = drift(
    g,
    45,
    '#cfd7ce',
    0.13,
    (i, t) => [
      (R(i * 3) - 0.5) * 2.2,
      0.4 + ((R(i * 5) * 2 + t * 0.2) % 2.4),
      (R(i * 7) - 0.5) * 8,
    ],
    0.42
  );
  g.userData.tick = (t: number) => {
    const y = 4.15 - 3.65 * Math.abs(Math.sin(t * 0.9));
    jp.position.y = y;
    cd.scale.y = 4.15 - y + 0.01;
    cd.position.y = (4.15 + y) / 2;
    bd(t);
    mist(t);
    cr.forEach((c, i) => {
      c.position.x = ((((t * (0.9 + i * 0.15) * (i % 2 ? 1 : -1) + i * 3.7) % 11) + 11) % 11) - 5.5;
    });
  };
  return g;
}

export function pilanesberg(): THREE.Group {
  const g = new THREE.Group();
  const pr = [
    [0.01, 0.04],
    [1.85, 0.06],
    [3.1, 0.42],
    [4.1, 1.55],
    [4.9, 2.25],
    [5.6, 1.35],
    [6.4, 0.72],
    [7.55, 0.12],
  ].map((p) => new THREE.Vector2(...p));
  const ge = new THREE.LatheGeometry(pr, 120);
  const p = ge.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const a = Math.atan2(Z, X);
    // Concentric eroded alkaline ring complex incised by radial drainage kloofs
    const kloof = Math.pow(Math.abs(Math.sin(a * 5 + 0.4)), 2.2) * 0.34;
    const secondary = 0.18 * Math.sin(a * 9 - 0.6);
    p.setY(i, Y * (1 + 0.28 * Math.sin(a * 3) + secondary - kloof * 0.55));
  }
  const lo = new THREE.Color('#747b54');
  const mid = new THREE.Color('#5f6d4c');
  const hi = new THREE.Color('#9c775c');
  const granite = tint(ge, (k, X, Y, Z) =>
    Y < 0.6
      ? k.copy(lo).lerp(mid, Y / 0.6)
      : k
          .copy(mid)
          .lerp(hi, Math.min(1, (Y - 0.6) / 1.8))
          .multiplyScalar(0.9 + 0.1 * Math.sin(Y * 30 + Math.atan2(Z, X) * 5))
  );
  weatherVertexColors(granite, { ao: 0.28, exposure: 0.1, grain: 0.06 });
  add(
    g,
    new THREE.TorusGeometry(6.35, 0.46, 6, 64, Math.PI * 1.45).rotateX(Math.PI / 2),
    MStone('#9c775c', 0.94),
    0,
    0.2,
    0
  );
  add(
    g,
    new THREE.TorusGeometry(4.15, 0.34, 6, 48, Math.PI * 1.2).rotateX(Math.PI / 2),
    MStone('#747b54', 0.94),
    0,
    0.32,
    0
  );
  const craterMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.028),
    side: THREE.DoubleSide,
  });
  craterMat.userData.naturalSurface = true;
  add(g, granite, craterMat);

  // Irregular contoured central Mankwe Dam lake
  const lakeGeo = new THREE.CircleGeometry(1.65, 48).rotateX(-Math.PI / 2);
  const lp = lakeGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i);
    const z = lp.getZ(i);
    const a = Math.atan2(z, x);
    const f = 1 + 0.18 * Math.sin(a * 3 + 0.4) + 0.09 * Math.cos(a * 5);
    lp.setXYZ(i, x * f, 0.1, z * f);
  }
  lakeGeo.computeVertexNormals();
  add(g, lakeGeo, MWater('#587670', 0.1, 0.24));

  const an = Array.from({ length: 9 }, (_, i) => {
    const o = animal(i % 3 ? '#777664' : '#8a7f6a');
    g.add(o);
    return o;
  });
  for (let i = 0; i < 16; i++) {
    const q = i * 0.39;
    tree(g, 2.75 * Math.cos(q), 2.75 * Math.sin(q), 0.75, 2, 0.25);
  }
  const dd = drift(g, 40, '#c8b48a', 0.06, (i, t) => [
    Math.cos(i * 2.4 + t * 0.1) * (1 + R(i) * 5.5),
    0.6 + ((R(i + 3) * 4 + t * 0.2) % 3.5),
    Math.sin(i * 2.4 + t * 0.1) * (1 + R(i) * 5.5),
  ]);
  g.userData.tick = (t: number) => {
    an.forEach((o, i) => {
      const a = t * 0.05 * (i % 2 ? 1 : -1) + i * 0.7;
      const r = 2.2 + R(i) * 0.5;
      o.position.set(r * Math.cos(a), 0.2, r * Math.sin(a));
      o.rotation.y = -a + (i % 2 ? -1.57 : 1.57);
    });
    dd(t);
  };
  return g;
}

export function robben(): THREE.Group {
  const g = new THREE.Group();
  const wh = MPlaster('#d8d5c8', 0.72);
  const st = MStone('#aa987a', 0.85);
  const dk = M('#262a31', 0.48, 0.55);
  const red = MPlaster('#9e3a2c', 0.65);
  const rf = MPlaster('#94866c', 0.78);
  const fortMat = MStone('#aa987a', 0.9);
  sea(g, '#306a80', '#5a949a');
  add(g, C(4.1, 4.5, 0.3, 64), MStone('#c3bba3', 0.95), -0.3, 0.15, 0.2);

  // Recessed pale Limestone Quarry bench pit
  add(g, CB(2.1, 0.03, 1.42, 0.01), MStone('#8f8974', 0.96), 1.55, 0.3, 1.5);
  add(g, CB(1.9, 0.035, 1.22, 0.01), MStone('#e2dcc8', 0.97), 1.55, 0.325, 1.5);
  for (let i = 0; i < 3; i++) {
    add(
      g,
      CB(1.6 - i * 0.16, 0.012, 0.035, 0.004),
      MStone('#cfc8b2', 0.95),
      1.55,
      0.35,
      1.12 + i * 0.3
    );
  }

  // 1865 Robben Island Lighthouse: whitewashed masonry cylinder + bold black vertical daymark stripe + red cupola
  add(g, C(0.2, 0.3, 1.62, 24), wh, -2.2, 1.11, 0.4);
  add(g, CB(0.055, 1.62, 0.04, 0.005), dk, -2.2, 1.11, 0.63); // Bold black vertical daymark stripe
  add(g, C(0.32, 0.32, 0.08, 24), dk, -2.2, 1.94, 0.4);
  add(g, C(0.4, 0.4, 0.045, 24), wh, -2.2, 1.99, 0.4);
  const galleryPosts: InstanceTransform[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    galleryPosts.push({
      x: -2.2 + 0.38 * Math.cos(a),
      y: 2.07,
      z: 0.4 + 0.38 * Math.sin(a),
      sy: 0.16,
    });
  }
  instancedMeshes(g, C(0.018, 0.018, 0.16, 6), dk, galleryPosts);
  add(g, new THREE.TorusGeometry(0.38, 0.028, 6, 28).rotateX(Math.PI / 2), dk, -2.2, 2.15, 0.4);
  add(g, C(0.18, 0.18, 0.28, 16), G('#fff3b0', 2.4), -2.2, 2.13, 0.4);
  add(g, new THREE.ConeGeometry(0.25, 0.26, 16), red, -2.2, 2.4, 0.4); // Iconic red cupola!
  const bm = new THREE.Group();
  bm.position.set(-2.2, 2.13, 0.4);
  g.add(bm);
  const bmat = new THREE.MeshBasicMaterial({
    color: '#fff4b8',
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  [0, Math.PI].forEach((a) => {
    const c = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 3.6, 12, 1, true).rotateZ(Math.PI / 2).translate(1.8, 0, 0),
      bmat
    );
    c.rotation.y = a;
    bm.add(c);
  });
  const sweep = addLighthouseSweep(g, -2.2, 0.32, 0.4, 5.4, '#ffefb2');

  // Maximum Security Prison Compound: clean H-block cell wings + perimeter walls + watchtowers
  const fcx = 1.0;
  const hBlocks: Array<[number, number, number]> = [
    [0.2, -1.0, 1.5],
    [1.9, -1.0, 1.5],
    [0.2, 0.7, 1.5],
    [1.9, 0.7, 1.5],
  ];
  hBlocks.forEach(([bx, bz, len]) => {
    add(g, CB(len, 0.32, 0.3, 0.02), fortMat, bx, 0.47, bz);
    add(g, CB(len, 0.03, 0.42, 0.01), rf, bx, 0.65, bz);
  });
  add(g, CB(1.7, 0.32, 0.3, 0.02), fortMat, fcx + 0.9, 0.47, -2.1);
  // 5 watchtowers & perimeter courtyard fences
  [-0.6, 0.8, 2.2].forEach((bx) => {
    add(g, CB(0.2, 0.2, 0.2, 0.02), st, bx, 0.93, -2.3);
    add(g, C(0.03, 0.03, 0.9, 6), dk, bx + 0.1, 1.4, -2.3);
  });
  add(g, CB(3.8, 0.04, 0.04, 0.008), dk, fcx + 0.9, 0.75, 1.55);
  add(g, CB(3.8, 0.04, 0.04, 0.008), dk, fcx + 0.9, 0.6, 1.55);
  add(g, C(1.05, 1.05, 0.03, 24), MStone('#ded3b6', 0.95), fcx + 0.9, 0.32, -0.3);

  // Keeper's cottage (distinctly south of the lighthouse with facade details)
  add(g, CB(0.78, 0.42, 0.52, 0.025), wh, -1.2, 0.51, 1.6);
  add(g, new THREE.ConeGeometry(0.5, 0.28, 4), red, -1.2, 0.86, 1.6).rotation.y = Math.PI / 4;
  const keeperDetail = new THREE.Group();
  keeperDetail.position.set(-1.2, 0.51, 1.6);
  doorSurround(keeperDetail, { x: 0.18, y: -0.02, z: 0.27, width: 0.2, height: 0.3, depth: 0.08 });
  facadeWindow(keeperDetail, { x: -0.19, y: 0.02, z: 0.27, width: 0.16, height: 0.18, depth: 0.07 });
  g.add(mergeByMaterial(keeperDetail));

  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 6.28;
    const rr = 3.7 + R(i) * 0.4;
    rock(
      g,
      0.28 + R(i + 3) * 0.2,
      0.4 + R(i + 5) * 0.3,
      0.35 + R(i + 7) * 0.35,
      -0.3 + rr * Math.cos(a),
      0.2 + rr * Math.sin(a) * 1.1,
      '#79836a',
      '#a89a80',
      0.2
    );
  }
  const offshoreT: InstanceTransform[] = [];
  for (let i = 0; i < 18; i++) {
    const a = R(i) * 6.28;
    const rr = 4.9 + R(i + 6) * 1.6;
    offshoreT.push({
      x: -0.3 + rr * Math.cos(a),
      y: 0.2,
      z: 0.2 + rr * Math.sin(a),
      sx: 0.5 + R(i + 3) * 0.4,
      sy: 0.4,
      sz: 0.5 + R(i + 5) * 0.4,
    });
  }
  scatterRocks(g, offshoreT, '#79836a', '#a89a80');

  // Murray's Bay harbour stone breakwater & ferry timber jetty
  add(g, CB(2.1, 0.22, 0.45, 0.02), st, 4.1, 0.24, 1.15).rotation.y = -0.24;
  const jetty = MWood('#8a6b47', 0.9);
  const robbenLamps: StreetLampSpec[] = [
    { x: -0.25, y: 0.3, z: 1.66, kind: 'flood', ry: Math.PI * 0.5, scale: 0.82, color: '#e6e8d4' },
    { x: 1.4, y: 0.3, z: 1.66, kind: 'flood', ry: Math.PI * 0.5, scale: 0.82, color: '#e6e8d4' },
    { x: 2.75, y: 0.3, z: 1.66, kind: 'flood', ry: Math.PI * 0.5, scale: 0.82, color: '#e6e8d4' },
    { x: -1.02, y: 0.3, z: 1.98, kind: 'lantern', scale: 0.82, color: '#ffd586' },
  ];
  for (let i = 0; i < 12; i++) {
    const u = i / 11;
    const x = 3.2 + u * 2.3;
    const z = 1.6 + u * 0.55;
    add(g, CB(0.34, 0.05, 0.62, 0.01), jetty, x, 0.34, z).rotation.y = -0.24;
    if (i % 3 === 0) {
      add(g, C(0.05, 0.06, 0.45, 8), jetty, x - 0.22, 0.23, z);
      add(g, C(0.05, 0.06, 0.45, 8), jetty, x + 0.22, 0.23, z);
    }
    if (i === 2 || i === 6 || i === 10) {
      robbenLamps.push({
        x,
        y: 0.36,
        z: z - 0.22,
        kind: 'bollard',
        scale: 0.72,
        color: '#ffd07d',
        poolRadius: 0.62,
      });
    }
  }
  addStreetLampSet(g, robbenLamps);

  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 30; i++) {
    const a = R(i) * 6.28;
    const r = 1.2 + R(i + 4) * 2.5;
    bushT.push({ x: -0.3 + r * Math.cos(a), y: 0.35, z: 0.2 + r * Math.sin(a), sx: 0.45, sy: 0.28, sz: 0.45 });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.3, 1), Mc('#79836a'), bushT, [
    '#79836a',
    '#9a9a7a',
    '#6e7f5e',
  ]);
  const tallT: InstanceTransform[] = [];
  for (let i = 0; i < 12; i++) {
    const a = R(i + 20) * 6.28;
    const r = 2.4 + R(i + 30) * 1.2;
    tallT.push({ x: -0.3 + r * Math.cos(a), y: 0.5, z: 0.2 + r * Math.sin(a), sy: 1.5 });
  }
  instancedMeshes(g, new THREE.ConeGeometry(0.14, 0.5, 5), Mc('#6e7f5e'), tallT, ['#6e7f5e', '#8a8a6a']);

  const bt = boat('#3d6fa8', 1.0);
  const bt2 = boat('#c8a24a', 0.7);
  g.add(bt, bt2);
  const sr = seaRings(g, 0.13, 3.6, 4);
  const surf = drift(
    g,
    90,
    '#e4f2f8',
    0.11,
    (i, t) => {
      const a = R(i) * 6.28;
      const k = (t * 0.25 + R(i + 3)) % 1;
      const rr = 3.7 + k * 0.7;
      return [-0.3 + rr * Math.cos(a), 0.14 + Math.sin(k * Math.PI) * 0.12, 0.2 + rr * Math.sin(a) * 1.1];
    },
    0.7
  );
  const bd = birds(g, 4, 3.5, 5);
  g.userData.tick = (t: number) => {
    bm.rotation.y = t * 1.1;
    sweep.rotation.y = bm.rotation.y;
    bt.position.set(5.7, 0.1 + Math.sin(t * 1.2) * 0.03, 2.3);
    bt.rotation.y = -0.24 + Math.sin(t * 0.6) * 0.06;
    bt2.position.set(4.6, 0.1 + Math.sin(t * 1.0 + 1) * 0.03, 3.2);
    bt2.rotation.y = -0.5 + Math.sin(t * 0.5) * 0.05;
    sr(t);
    surf(t);
    bd(t);
  };
  return g;
}

export function chapman(): THREE.Group {
  const g = new THREE.Group();
  sea(g, '#2d6376', '#588d92');

  // Authentic two-tier geological unconformity: dark Cape Granite base + horizontally stratified TMG Sandstone upper cliff!
  const cliffGeo = C(3.15, 4.75, 6.0, 56, 16);
  const cp = cliffGeo.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const X = cp.getX(i);
    const Y = cp.getY(i);
    const Z = cp.getZ(i);
    const a = Math.atan2(Z, X);
    const ledge = Y > -0.3 ? 0.07 * Math.sin(Y * 9) : 0;
    const f = 1 + 0.11 * Math.sin(a * 4 + Y * 0.35) + ledge;
    cp.setXYZ(i, X * f, Y, Z * f);
  }
  const cGranite = new THREE.Color('#5e5954');
  const cTMG = new THREE.Color('#b58b60');
  const cUpper = new THREE.Color('#8e8674');
  tint(cliffGeo, (k, X, Y) => {
    const h = (Y + 3.0) / 6.0;
    if (h < 0.42) k.copy(cGranite).multiplyScalar(0.92 + 0.08 * Math.sin(X * 2));
    else k.copy(cTMG).lerp(cUpper, (h - 0.42) / 0.58 + 0.06 * Math.sin(Y * 14));
  });
  weatherVertexColors(cliffGeo, { ao: 0.3, exposure: 0.12, grain: 0.06 });
  const cliffMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.032),
  });
  cliffMat.userData.naturalSurface = true;
  add(g, cliffGeo, cliffMat, 0, 3.0, -1.8);

  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 40; i++) {
    const a = -1.3 + (i * 2.6) / 39;
    const y = 2.4 + 0.46 * Math.sin(i * 0.48);
    const r = 4.68 - 0.23 * y + 0.52;
    pts.push(new THREE.Vector3(r * Math.sin(a), y, -1.8 + r * Math.cos(a)));
  }
  const cv = new THREE.CatmullRomCurve3(pts);
  add(g, new THREE.TubeGeometry(cv, 140, 0.14, 6), M('#545a55', 0.85));

  // Stone masonry roadside parapet & Cantilevered Half-Tunnel concrete canopy supported on outer piers
  const canopyP = cv.getPointAt(0.38);
  const canopyT = cv.getTangentAt(0.38);
  const canopyYaw = Math.atan2(-canopyT.z, canopyT.x);
  add(g, CB(1.38, 0.12, 0.95, 0.02), MStone('#6d695f', 0.92), canopyP.x, canopyP.y + 0.85, canopyP.z).rotation.y =
    canopyYaw;
  for (const d of [-0.45, 0.45]) {
    add(
      g,
      CB(0.14, 0.85, 0.14, 0.02),
      MStone('#8c8678', 0.9),
      canopyP.x + Math.cos(canopyYaw) * d,
      canopyP.y + 0.42,
      canopyP.z - Math.sin(canopyYaw) * d + 0.35
    );
  }

  // 3D volumetric rockfall catch-fence posts & upper tension rails (ZERO lines()!)
  const fenceSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
  for (let i = 10; i <= 28; i++) {
    const a = cv.getPointAt(i / 39);
    const b = cv.getPointAt((i + 1) / 39);
    fenceSegs.push([[a.x, a.y + 0.44, a.z + 0.24], [b.x, b.y + 0.44, b.z + 0.24]]);
    fenceSegs.push([[a.x, a.y + 0.28, a.z + 0.24], [b.x, b.y + 0.28, b.z + 0.24]]);
    fenceSegs.push([[a.x, a.y + 0.08, a.z + 0.24], [a.x, a.y + 0.46, a.z + 0.24]]);
  }
  cableBatch(g, fenceSegs, 0.015, M('#50565c', 0.5, 0.6));
  const chapmanLamps: StreetLampSpec[] = [
    {
      x: canopyP.x - Math.cos(canopyYaw) * 0.35,
      y: canopyP.y + 0.08,
      z: canopyP.z + Math.sin(canopyYaw) * 0.35,
      kind: 'lantern',
      scale: 0.72,
      color: '#ffaa4a',
      poolRadius: 0.72,
    },
    {
      x: canopyP.x + Math.cos(canopyYaw) * 0.35,
      y: canopyP.y + 0.08,
      z: canopyP.z - Math.sin(canopyYaw) * 0.35,
      kind: 'lantern',
      scale: 0.72,
      color: '#ffaa4a',
      poolRadius: 0.72,
    },
  ];
  for (const u of [0.16, 0.56, 0.78]) {
    const pt = cv.getPointAt(u);
    chapmanLamps.push({
      x: pt.x,
      y: pt.y + 0.08,
      z: pt.z + 0.16,
      kind: 'bollard',
      scale: 0.74,
      color: '#ffc670',
      poolRadius: 0.66,
    });
  }
  addStreetLampSet(g, chapmanLamps);

  const cs = [0, 1, 2].map((i) => {
    const c = car(['#c33', '#fff', '#36c'][i], 0.35);
    g.add(c);
    return c;
  });
  add(g, C(3.05, 3.15, 0.1, 48), MStone('#74805e', 0.94), 0, 6.02, -1.8);
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 16; i++) {
    const a = R(i) * 6.28;
    const r = R(i + 5) * 2.5;
    bushT.push({
      x: r * Math.cos(a),
      y: 6.14,
      z: -1.8 + r * Math.sin(a),
      sx: 0.52,
      sy: 0.32,
      sz: 0.52,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.32, 1), Mc('#74805e'), bushT, [
    '#74805e',
    '#8a8260',
  ]);
  const sr = seaRings(g, 0.12, 4.8, 3);
  const spray = drift(
    g,
    45,
    '#e4f2f8',
    0.1,
    (i, t) => {
      const a = -1.2 + R(i * 3) * 2.4;
      const k = (t * 0.45 + R(i * 7)) % 1;
      const rad = 4.65 + k * 0.65;
      return [Math.sin(a) * rad, 0.16 + Math.sin(k * Math.PI) * 0.5, -1.8 + Math.cos(a) * rad];
    },
    0.45
  );
  const bd = birds(g, 4, 3.5, 7);
  g.userData.tick = (t: number) => {
    cs.forEach((c, i) => {
      const d = i % 2 ? 1 : -1;
      const u = (((t * 0.025 * d + i / 3) % 1) + 1) % 1;
      const p = cv.getPointAt(u);
      const tg = cv.getTangentAt(u);
      if (d < 0) tg.negate();
      c.position.set(p.x, p.y + 0.1, p.z);
      c.rotation.y = Math.atan2(-tg.z, tg.x);
    });
    sr(t);
    spray(t);
    bd(t);
  };
  return g;
}

export function isandlwana(): THREE.Group {
  const g = new THREE.Group();
  add(g, B(15.2, 0.2, 15.2), MStone('#b49f68', 0.96), 0, 0.1, 0);

  // Iconic crouched-sphinx silhouette: steep grassy lower talus topped by sheer dark grey-black dolerite caprock sloping toward the southern nek
  const sphinxGeo = C(1.2, 3.2, 4.35, 56, 16);
  const sp = sphinxGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const X = sp.getX(i);
    const Y = sp.getY(i);
    const Z = sp.getZ(i);
    const h = (Y + 2.175) / 4.35;
    // Asymmetric elongation (head peak west-left, long rocky back sloping east-right toward the nek)
    const neckSlope = X > 0.2 && h > 0.52 ? (X - 0.2) * 0.58 * h : 0;
    const capCliff = h > 0.62 ? 0.85 : 1.0;
    sp.setXYZ(i, X * 1.45 * capCliff, Y - neckSlope, Z * 0.72 * capCliff);
  }
  const cTalus = new THREE.Color('#878b5e');
  const cDolerite = new THREE.Color('#4c4c48');
  tint(sphinxGeo, (k, X, Y) => {
    const h = (Y + 2.175) / 4.35;
    k.copy(cTalus).lerp(cDolerite, THREE.MathUtils.smoothstep(h, 0.56, 0.68));
    if (h > 0.62) k.multiplyScalar(0.92 + 0.08 * Math.sin(X * 6));
  });
  weatherVertexColors(sphinxGeo, { ao: 0.3, exposure: 0.14, grain: 0.06 });
  const sphinxMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.032),
  });
  sphinxMat.userData.naturalSurface = true;
  add(g, sphinxGeo, sphinxMat, -0.3, 2.32, -2.9);

  // Southern rocky nek ridge
  rock(g, 0.95, 1.85, 1.55, 3.6, -2.7, '#7c7560', '#96876c', 0.16);

  // Authentic low hemispherical whitewashed stone-rubble battle cairn domes along the nek & camp site
  const cairnT: InstanceTransform[] = [];
  for (let i = 0; i < 48; i++) {
    cairnT.push({
      x: -2.2 + R(i) * 7.2,
      y: 0.21,
      z: -1.4 + R(i + 9) * 3.4,
      sx: 0.9 + R(i + 4) * 0.35,
      sy: 0.52,
      sz: 0.9 + R(i + 7) * 0.35,
    });
  }
  instancedMeshes(
    g,
    new THREE.SphereGeometry(0.11, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    MStone('#dcd9cc', 0.88),
    cairnT
  );

  for (let i = 0; i < 6; i++) tree(g, (R(i + 30) - 0.5) * 9, 0.5 + R(i + 40) * 4, 0.9, 2, 0.2);

  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 55; i++) {
    const a = R(i + 50) * 6.28;
    const r = 1 + R(i + 60) * 5.5;
    grassT.push({
      x: r * Math.cos(a),
      y: 0.2,
      z: r * Math.sin(a) + 1,
      ry: R(i * 3) * 6.28,
      sy: 1.35,
    });
  }
  grassTufts(g, grassT, ['#858f64', '#b49f68', '#988366']);

  g.userData.tick = drift(g, 60, '#e0c890', 0.08, (i, t) => [
    R(i) * 10 - 5 + Math.sin(t * 0.3 + i) * 0.4,
    0.4 + ((R(i + 3) * 2 + t * 0.25) % 2),
    R(i + 5) * 8 - 3 + Math.cos(t * 0.2 + i) * 0.3,
  ]);
  return g;
}

export function gariep(): THREE.Group {
  const g = new THREE.Group();
  const cn = MStone('#929388', 0.82, 0.016);
  const wm = MCascade('#dfe5e2', 0.86);
  add(g, B(15.2, 0.2, 15.2), MStone('#a0805f', 0.96), 0, 0.1, 0);
  add(g, B(10.8, 1.34, 5.6), MStone('#8c8d83', 0.96), 0, 0.87, -3.3);
  add(g, CB(10.2, 0.1, 5.4, 0.02), MWater('#547e8c', 0.09, 0.24), 0, 1.6, -3.3);
  add(g, CB(3.4, 0.06, 5.2, 0.02), MWater('#547e8c', 0.09, 0.24), 0, 0.24, 3.4);

  // Central double-curvature concrete arch + flanking straight concrete gravity wing walls
  const wallMat = MStone('#aba99e', 0.82);
  wallMat.side = THREE.DoubleSide;
  add(g, C(4.2, 4.4, 1.68, 48, 1, true, Math.PI * 0.72, Math.PI * 0.56), wallMat, 0, 1.0, 3.9);
  add(g, C(4.32, 4.32, 0.14, 48, 1, false, Math.PI * 0.72, Math.PI * 0.56), cn, 0, 1.88, 3.9);
  for (const s of [-1, 1]) {
    const wing = add(g, CB(2.35, 1.7, 0.42, 0.02), wallMat, s * 4.35, 1.05, 0.95);
    wing.rotation.y = s * 0.24;
    // Toothed Roberts splitter flood spillway chutes on BOTH wings!
    for (let k = 0; k < 3; k++) {
      const gx = s * (3.65 + k * 0.58);
      add(g, CB(0.36, 1.05, 0.16, 0.02), M('#6c7476', 0.45, 0.65), gx, 1.38, 1.15 - k * 0.12).rotation.y =
        s * 0.24;
      add(g, CB(0.28, 1.15, 0.08, 0.02), wm, gx, 0.92, 1.24 - k * 0.12).rotation.y = s * 0.24;
    }
  }
  // Central floodgates + upstream cylindrical concrete intake control tower
  for (let i = 0; i < 4; i++) {
    const a = Math.PI * 0.88 + (i / 3) * (Math.PI * 0.24);
    const sx = Math.sin(a) * 4.28;
    const sz = 3.9 + Math.cos(a) * 4.28;
    const gate = add(g, CB(0.5, 1.0, 0.16, 0.02), M('#6c7476', 0.45, 0.65), sx, 1.38, sz);
    gate.rotation.y = a;
    add(g, CB(0.3, 1.15, 0.08, 0.02), wm, sx, 0.96, sz + 0.12).rotation.y = a;
  }
  add(g, C(0.28, 0.34, 1.85, 16), cn, -1.6, 1.02, -1.15);
  add(g, C(0.38, 0.38, 0.12, 16), M('#4b5258', 0.5), -1.6, 2.0, -1.15);
  add(g, CB(0.14, 0.06, 0.95, 0.01), cn, -1.6, 1.92, -0.68);
  const gariepLamps: StreetLampSpec[] = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 0.76 + (i / 5) * (Math.PI * 0.48);
    gariepLamps.push({
      x: Math.sin(a) * 4.28,
      y: 1.95,
      z: 3.9 + Math.cos(a) * 4.28,
      kind: 'cobra',
      ry: a - Math.PI / 2,
      scale: 0.78,
      color: '#ffc36a',
      poolRadius: 0.95,
    });
  }
  gariepLamps.push(
    { x: -3.95, y: 1.9, z: 1.06, kind: 'bollard', scale: 0.82, color: '#ffd07d' },
    { x: 3.95, y: 1.9, z: 1.06, kind: 'bollard', scale: 0.82, color: '#ffd07d' }
  );
  addStreetLampSet(g, gariepLamps);

  rock(g, 1.6, 2.4, 3.1, -5.6, -1.2, '#a0805f', '#c0a078', 0.14);
  rock(g, 1.8, 2.6, 3.4, 5.6, -0.8, '#a0805f', '#c0a078', 0.14);
  for (let i = 0; i < 6; i++) tree(g, -3 + i * 1.2, 5.2 + R(i), 0.9, 2, 0.2);
  const bd = birds(g, 3, 3.2, 6);
  const mist = drift(g, 110, '#dde4e2', 0.1, (i, t) => {
    const u = (t * 0.8 + R(i)) % 1;
    const k = i % 6;
    return [-2.4 + k * 0.95 + (R(i + 3) - 0.5) * 0.3, 1.55 - u * 1.35, 0.15 + u * 1.1];
  });
  g.userData.tick = (t: number) => {
    mist(t);
    bd(t);
  };
  return g;
}

export function maropeng(): THREE.Group {
  const g = new THREE.Group();
  const gr = MStone('#7b8252', 0.94);
  const corten = M('#8c4a32', 0.62, 0.42);
  const bn = M('#d4ccb8', 0.58);
  const cs = MWet('#aaa394', 0.84, 0.18, 0.04, 'stone');
  add(g, B(15.2, 0.2, 15.2), MStone('#aca57c', 0.96), 0, 0.1, 0);

  // Iconic Tumulus Mound cleanly sliced at the south face to expose recessed Corten & dark glass entrance!
  add(
    g,
    new THREE.SphereGeometry(3.2, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    gr,
    0,
    0.2,
    -0.55
  ).scale.set(1, 0.46, 0.95);
  add(g, C(0.52, 0.52, 0.05, 24), MGlass('#2b3b44', 0.85, 0.1), 0, 1.66, -0.55);
  // Corten rust-steel & recessed glass front portal slice + reflecting water pool + timber bridge
  add(g, CB(3.35, 1.05, 0.45, 0.04), corten, 0, 0.72, 1.65);
  add(g, CB(2.85, 0.78, 0.48, 0.02), MGlass('#1a2830', 0.85, 0.08), 0, 0.66, 1.68);
  add(g, CB(2.8, 0.06, 1.45, 0.015), MWater('#4d7076', 0.08, 0.24), 0, 0.23, 2.75);
  add(g, CB(0.72, 0.08, 1.65, 0.02), MWood('#856846', 0.86), 0, 0.3, 2.75);
  // Stylized Mrs Ples cranium monument plinth
  add(g, CB(0.52, 0.36, 0.52, 0.03), cs, 1.65, 0.4, 3.6);
  add(g, new THREE.SphereGeometry(0.15, 16, 12), bn, 1.65, 0.74, 3.6).scale.set(1, 0.9, 1.12);

  // Sunken pale-dolomite Sterkfontein Sinkhole Cave + 3D timber/steel walkway boardwalk (ZERO lines()!)
  add(g, C(1.18, 1.32, 0.22, 24), MStone('#aca592', 0.95), -4.15, 0.16, 1.05);
  add(g, C(0.95, 0.95, 0.12, 20), MStone('#3b3228', 0.96), -4.15, 0.18, 1.05);
  add(g, CB(2.35, 0.06, 0.38, 0.015), MWood('#8a6c49', 0.88), -4.15, 0.34, 1.05).rotation.y = 0.22;
  cableBatch(
    g,
    [
      [[-5.2, 0.36, 1.28], [-5.2, 0.62, 1.28]],
      [[-4.15, 0.36, 1.05], [-4.15, 0.62, 1.05]],
      [[-3.1, 0.36, 0.82], [-3.1, 0.62, 0.82]],
      [[-5.2, 0.62, 1.28], [-3.1, 0.62, 0.82]],
    ],
    0.015,
    corten
  );

  // Maropeng architectural standing concrete fins
  const finT = Array.from({ length: 6 }, (_, i) => ({
    x: -3.2 + i * 0.7,
    y: 0.7,
    z: -1.6 + (i % 2) * 0.3,
    sy: 0.9 + (i % 3) * 0.25,
  }));
  instancedMeshes(g, CB(0.09, 1, 0.32, 0.02), M('#79786e', 0.9), finT);
  addStreetLampSet(g, [
    { x: -1.45, y: 0.22, z: 2.05, kind: 'uplight', scale: 0.95, color: '#ffb96e', coneHeight: 1.55, coneRadius: 0.56 },
    { x: 1.45, y: 0.22, z: 2.05, kind: 'uplight', scale: 0.95, color: '#ffb96e', coneHeight: 1.55, coneRadius: 0.56 },
    { x: -0.42, y: 0.34, z: 3.45, kind: 'bollard', scale: 0.82, color: '#ffd480', poolRadius: 0.72 },
    { x: 0.42, y: 0.34, z: 3.45, kind: 'bollard', scale: 0.82, color: '#ffd480', poolRadius: 0.72 },
    { x: -3.25, y: 0.37, z: 0.85, kind: 'lantern', scale: 0.78, color: '#ffd280', poolRadius: 0.72 },
  ]);
  for (let i = 0; i < 7; i++) tree(g, -5.5 + i * 1.9, -5, 1, 2, 0.2);
  g.userData.tick = drift(g, 50, '#e0c890', 0.07, (i, t) => [
    R(i) * 10 - 5 + Math.sin(t * 0.3 + i) * 0.4,
    0.4 + ((R(i + 3) * 2 + t * 0.25) % 2),
    R(i + 5) * 8 - 4,
  ]);
  return g;
}

export function mapungubwe(): THREE.Group {
  const g = new THREE.Group();
  add(g, B(15.2, 0.2, 15.2), MStone('#b29654', 0.96), 0, 0.1, 0);

  // Authentic ~30m boat-shaped cliff-rimmed sandstone plateau (h ≈ 1.15) with Western Ascent cleft!
  const mesaGeo = C(3.15, 3.4, 1.12, 64, 10);
  const mp = mesaGeo.attributes.position;
  for (let i = 0; i < mp.count; i++) {
    const X = mp.getX(i);
    const Y = mp.getY(i);
    const Z = mp.getZ(i);
    const facing = Math.max(0, Math.cos(Math.atan2(Z, X)));
    const cleft = X < -1.8 && Math.abs(Z) < 0.65 ? 0.35 : 0; // Western Ascent rock cleft
    const notch = Math.abs(Y + 0.15) < 0.28 ? Math.pow(facing, 10) * 0.28 : 0;
    const f = 1 - notch - cleft;
    mp.setXYZ(i, X * f * 1.24, Y, Z * f * 0.56); // Distinctly boat-shaped elongated sandstone ridge
  }
  tint(mesaGeo, (k, X, Y) => {
    k.set(Math.floor((Y + 0.6) * 4.5) % 2 ? '#b88f64' : '#c6ab82');
    if (X < -2.1) k.multiplyScalar(0.75);
  });
  weatherVertexColors(mesaGeo, { ao: 0.28, exposure: 0.12, grain: 0.06 });
  const mesaMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.03),
    side: THREE.DoubleSide,
  });
  mesaMat.userData.naturalSurface = true;
  add(g, mesaGeo, mesaMat, -0.4, 0.76, -0.6);
  add(g, C(3.85, 3.85, 0.09, 48), MStone('#c6ab82', 0.95), -0.4, 1.35, -0.6).scale.set(1, 1, 0.56);

  // Summit dry-stone royal palace terrace walls & tiny Western Ascent rock-cut steps
  add(g, CB(2.6, 0.16, 0.12, 0.02), MStone('#8e7a5a', 0.94), -0.35, 1.46, -0.6);
  add(g, CB(1.6, 0.14, 0.1, 0.02), MStone('#8e7a5a', 0.94), 0.15, 1.45, -0.25);
  for (let i = 0; i < 6; i++) {
    add(g, CB(0.22, 0.08, 0.36, 0.01), MStone('#9e8768', 0.94), -4.5 + i * 0.24, 0.28 + i * 0.18, -0.6);
  }

  // Sandy braided Limpopo–Shashe riverbed winding below the hill (NO giant golden rhino!)
  const cv = new THREE.CatmullRomCurve3(
    [
      [-7, 0.5, 2.2],
      [-3, 0.5, 3.5],
      [1, 0.5, 4.0],
      [4, 0.5, 2.5],
      [7, 0.5, 3.1],
    ].map((p) => new THREE.Vector3(...p))
  );
  add(g, new THREE.TubeGeometry(cv, 60, 0.38, 8), MWater('#748783', 0.09, 0.24)).scale.y = 0.35;

  // Lowveld baobab & umbrella thorn acacias
  [
    [-4.5, 1.2, 1.2],
    [4.1, -0.5, 1.0],
    [2.8, 2.0, 0.8],
  ].forEach(([x, z, s]) => {
    add(g, C(0.22 * s, 0.32 * s, 1.1 * s, 14), MBark('#8c8171', 0.95), x, 0.2 + 0.55 * s, z);
    for (let k = 0; k < 3; k++) {
      add(
        g,
        new THREE.IcosahedronGeometry(0.28 * s, 1),
        Mc(k % 2 ? '#737d50' : '#8a8a68'),
        x + (k - 1) * 0.25 * s,
        1.35 * s + 0.2 + k * 0.05,
        z
      );
    }
  });
  for (let i = 0; i < 4; i++) tree(g, -5 + i * 3, -4.4, 1, 2, 0.2);

  // Subtle golden royal heritage shimmer above summit plateau
  const sp = drift(g, 16, '#ffd86a', 0.08, (i, t) => [
    -0.4 + Math.sin(t * 1.4 + i) * 1.4,
    1.55 + Math.cos(t * 1.2 + i) * 0.14,
    -0.6 + Math.cos(t * 0.9 + i) * 0.55,
  ]);
  g.userData.tick = (t: number) => {
    sp(t);
  };
  return g;
}

export function kgalagadi(): THREE.Group {
  const g = new THREE.Group();
  // Broad sunken pale calcareous dry Nossob riverbed + asymmetric sharp-crested red iron-oxide linear dunes
  const hf = (x: number, y: number) => {
    const riverbed = 1 - Math.exp(-Math.pow((x - Math.sin(y * 0.35) * 1.1) / 1.85, 2));
    const phase = x * 0.95 + Math.sin(y * 0.42) * 1.5;
    // Sharp asymmetric dune crest: gentle windward rise, steep slip-face drop
    const tri = Math.pow(0.5 + 0.5 * Math.sin(phase + 0.25 * Math.sin(phase)), 1.45);
    return 0.14 + riverbed * (0.72 * tri + 0.14 * Math.sin(x * 0.38 - y * 0.6));
  };
  const rg = new THREE.RingGeometry(0.01, 7.6, 120, 46);
  const p = rg.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, hf(p.getX(i), p.getY(i)));
  rg.rotateX(-Math.PI / 2);
  const windward = new THREE.Color('#a65036');
  const slipface = new THREE.Color('#6e3222');
  const crest = new THREE.Color('#be6b44');
  const calcrete = new THREE.Color('#cfc6ae');
  const duneGeo = tint(rg, (k, X, Y, Z) => {
    const riverbed = Math.exp(-Math.pow((X - Math.sin(-Z * 0.35) * 1.1) / 1.75, 2));
    const slope = Math.cos(X * 0.95 + Math.sin(-Z * 0.42) * 1.5);
    k.copy(slope > 0 ? windward : slipface).lerp(crest, Math.max(0, Y - 0.52) * 0.85);
    k.lerp(calcrete, riverbed * 0.92);
  });
  const duneMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    ...surfaceDetail('stone', 0.018),
  });
  duneMat.userData.naturalSurface = true;
  add(g, duneGeo, duneMat);

  [
    [-0.2, 1.4],
    [0.6, -2.2],
    [-0.9, -4.1],
    [3.8, 2.4],
  ].forEach(([x, z]) => {
    tree(g, x, z, 1, 2, hf(x, -z));
    add(g, new THREE.IcosahedronGeometry(0.38, 1), Mc('#858764'), x + 0.48, hf(x, -z) + 0.16, z - 0.38);
  });

  // Authentic Kgalagadi Gemsbok / Oryx herd grazing along the dry Nossob riverbed terrace
  const gb = [0, 1, 2, 3].map((i) => gemsbok(g, 0, 0.3, 0, 1.45 + (i % 2) * 0.25, 0));
  const sn = drift(g, 80, '#e6a870', 0.08, (i, t) => [
    ((((R(i) * 14 - 7 + t * 0.8) % 14) + 14) % 14) - 7,
    0.5 + R(i + 3) * 1.2,
    R(i + 5) * 12 - 6,
  ]);
  g.userData.tick = (t: number) => {
    gb.forEach((o, i) => {
      const q = t * 0.055 * (i % 2 ? 1 : -1) + i * 1.5;
      const z = Math.sin(q) * 4.2;
      const x = Math.sin(-z * 0.35) * 1.1 + (i - 1.5) * 0.55;
      o.position.set(x, hf(x, -z), z);
      o.rotation.y = (i % 2 ? 0 : Math.PI) + Math.cos(q) * 0.35;
    });
    sn(t);
  };
  return g;
}

export function storms(): THREE.Group {
  const g = new THREE.Group();
  const timber = MWood('#7e6547', 0.88);
  const steelMat = M('#7c858b', 0.42, 0.72);
  // Amber-tannin river mouth meeting cold emerald ocean swell
  sea(g, '#2e5d63', '#52807a');
  [-4.65, 4.65].forEach((x) => {
    rock(g, 1.9, 2.6, 3.65, x, 0, '#4b4e52', '#7d7768', 0.13);
    rock(g, 1.5, 2.1, 2.85, x * 1.1, -3.6, '#4b4e52', '#7d7768', 0.13);
    rock(g, 1.5, 2.1, 2.45, x * 1.1, 3.4, '#4b4e52', '#7d7768', 0.13);
  });

  // Volumetric gapped timber suspension planks + A-frame steel towers + parabolic suspension cables (ZERO lines()!)
  const plankT: InstanceTransform[] = [];
  for (let i = 0; i < 24; i++) {
    const x = -2.53 + i * (5.06 / 23);
    plankT.push({ x, y: 1.52, z: 0 });
  }
  instancedMeshes(g, CB(0.16, 0.07, 0.44, 0.015), timber, plankT);
  [-2.6, 2.6].forEach((x) => {
    cableBatch(
      g,
      [
        [[x, 1.48, -0.22], [x, 2.68, -0.14]],
        [[x, 1.48, 0.22], [x, 2.68, 0.14]],
        [[x, 2.66, -0.18], [x, 2.66, 0.18]],
      ],
      0.045,
      M('#88483f', 0.44, 0.6)
    );
  });
  for (const z of [-0.18, 0.18]) {
    catenaryTube(g, [-2.6, 2.66, z], [2.6, 2.66, z], 0.76, 0.022, steelMat, 24, 6);
  }
  const hangerSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
  const yy = (h: number) => 2.66 - 0.76 * (1 - (h / 2.6) ** 2);
  for (let i = 1; i < 20; i++) {
    const x = -2.6 + i * 0.26;
    for (const z of [-0.18, 0.18]) {
      hangerSegs.push([[x, yy(x), z], [x, 1.54, z]]);
    }
  }
  cableBatch(g, hangerSegs, 0.011, steelMat);
  addStreetLampSet(g, [
    { x: -2.6, y: 1.54, z: -0.26, kind: 'lantern', scale: 0.74, color: '#ffd080', poolRadius: 0.66 },
    { x: -2.6, y: 1.54, z: 0.26, kind: 'lantern', scale: 0.74, color: '#ffd080', poolRadius: 0.66 },
    { x: 2.6, y: 1.54, z: -0.26, kind: 'lantern', scale: 0.74, color: '#ffd080', poolRadius: 0.66 },
    { x: 2.6, y: 1.54, z: 0.26, kind: 'lantern', scale: 0.74, color: '#ffd080', poolRadius: 0.66 },
  ]);

  for (let i = 0; i < 10; i++) {
    tree(g, (i % 2 ? 4.6 : -4.6) + (R(i) - 0.5) * 1.2, (R(i + 5) - 0.5) * 4, 1.1, 1, 3.6);
  }
  for (let i = 0; i < 6; i++) {
    const a = R(i) * 6.28;
    const r = 3 + R(i + 7) * 1.5;
    rock(
      g,
      0.3,
      0.5,
      0.5 + R(i + 3) * 0.4,
      r * Math.cos(a),
      r * Math.sin(a) + 2.5,
      '#4b4e52',
      '#8f7e66',
      0.12
    );
  }
  const sr = seaRings(g, 0.12, 2.2, 4);
  const spray = drift(
    g,
    45,
    '#e4f2f8',
    0.1,
    (i, t) => {
      const k = (t * 0.5 + R(i * 4)) % 1;
      return [(R(i * 2) - 0.5) * 3.8, 0.16 + Math.sin(k * Math.PI) * 0.52, -1.5 + k * 3.0];
    },
    0.45
  );
  const bd = birds(g, 4, 3.5, 6);
  g.userData.tick = (t: number) => {
    sr(t);
    spray(t);
    bd(t);
  };
  return g;
}

export function groot(): THREE.Group {
  const g = new THREE.Group();
  const wh = MPlaster('#e8e4da', 0.72);
  const th = MBark('#443b32', 0.94, 0.036); // Aged dark charcoal dekriet thatch
  const gn = MWood('#254c39', 0.68); // Heritage Cape Dutch forest-green shutters
  const teak = MWood('#3a281d', 0.72);
  const wn = G('#e8ca86', 0.9);
  const trim = MStone('#d8cdb4', 0.88);
  const terracotta = MPlaster('#b86e52', 0.84);

  // Gently rolling Constantia Valley loam & vineyard contours
  const hAt = (x: number, z: number) =>
    0.05 * Math.sin(x * 0.62) * Math.cos(z * 0.58) +
    0.09 * Math.max(0, (z + 3) / 9) * Math.sin(x * 0.34 + 1.1);
  const terrainGeo = new THREE.PlaneGeometry(16.2, 16.2, 40, 40).rotateX(-Math.PI / 2);
  const tp = terrainGeo.attributes.position;
  const tc = new Float32Array(tp.count * 3);
  const grassA = new THREE.Color('#74804e');
  const grassB = new THREE.Color('#5e7f38');
  const gc = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i);
    const z = tp.getZ(i);
    tp.setY(i, 0.2 + hAt(x, z));
    gc.copy(grassA).lerp(grassB, 0.5 + 0.5 * Math.sin(x * 0.8 + z * 0.6));
    tc[i * 3] = gc.r;
    tc[i * 3 + 1] = gc.g;
    tc[i * 3 + 2] = gc.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(tc, 3));
  terrainGeo.computeVertexNormals();
  const tMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0,
    ...surfaceDetail('stone', 0.015),
  });
  tMat.userData.naturalSurface = true;
  add(g, terrainGeo, tMat);

  // H-plan Cape Dutch Manor: klompje-brick red stoep, limewashed plaster wings, dark dekriet thatch
  add(g, CB(3.65, 0.11, 1.56, 0.02), MStone('#9e6e58', 0.88), 0, 0.26, 0.16);
  add(g, CB(1.1, 0.06, 0.45, 0.01), MStone('#9e6e58', 0.88), 0, 0.23, 1.05);
  add(g, CB(3.2, 0.9, 1.2, 0.03), wh, 0, 0.68, 0);
  [-1, 1].forEach((s) => {
    add(g, CB(1.0, 0.8, 1.65, 0.03), wh, s * 2.1, 0.63, -0.2);
    add(g, gableRoofGeo(1.0, 1.65, 0.52, 0.08), th, s * 2.1, 1.02, -0.2);
  });
  add(g, gableRoofGeo(3.2, 1.2, 0.82, 0.12), th, 0, 1.13, 0);
  add(g, CB(3.38, 0.06, 0.09, 0.015), trim, 0, 1.95, 0); // Whitewashed thatch ridge cap
  // Anton Anreith Baroque central gable: pilasters, pediment & terracotta niche with bronze figure
  add(g, capeDutchGableGeo(1.28, 1.04, 0.16), wh, 0, 1.13, 0.58);
  [-0.36, 0.36].forEach((px) => add(g, CB(0.08, 0.66, 0.05, 0.01), trim, px, 1.46, 0.67));
  add(g, CB(0.28, 0.34, 0.05, 0.015), terracotta, 0, 1.55, 0.66);
  add(g, C(0.04, 0.05, 0.18, 8), M('#6f5838', 0.42, 0.65), 0, 1.54, 0.69);
  [-1.1, 0, 1.1].forEach((x) => add(g, CB(0.16, 0.22, 0.12, 0.01), trim, x, 1.48, -0.36));
  [-0.85, 0.85].forEach((x) => add(g, C(0.09, 0.11, 0.44, 8), wh, x, 1.55, 0));

  [-1.25, -0.85, 0.85, 1.25, -2.1, 2.1].forEach((x) => {
    add(g, CB(0.24, 0.4, 0.04, 0.01), wn, x, 0.73, 0.62);
    [-1, 1].forEach((s) => add(g, CB(0.095, 0.4, 0.045, 0.01), gn, x + s * 0.2, 0.73, 0.625));
  });
  add(g, CB(0.4, 0.6, 0.04, 0.01), teak, 0, 0.53, 0.62);

  const manorFacade = new THREE.Group();
  [-1.25, -0.85, 0.85, 1.25].forEach((x) => {
    facadeWindow(manorFacade, {
      x,
      y: 0.73,
      z: 0.64,
      width: 0.3,
      height: 0.44,
      depth: 0.09,
      frame: '#3a281d',
      glass: '#26413c',
    });
  });
  [-0.6, 0.6].forEach((dx) => {
    facadeWindow(manorFacade, {
      x: -4.5 + dx,
      y: 0.72,
      z: -1.7,
      width: 0.24,
      height: 0.38,
      depth: 0.08,
      frame: '#3a281d',
      glass: '#26413c',
    });
  });
  doorSurround(manorFacade, {
    x: 0,
    y: 0.55,
    z: 0.64,
    width: 0.5,
    height: 0.7,
    depth: 0.12,
    jamb: '#d8cdb4',
    panel: '#3a281d',
  });
  corniceBand(manorFacade, {
    x: 0,
    y: 1.12,
    z: 0.62,
    width: 3.25,
    depth: 0.2,
    height: 0.1,
    color: '#d8cdb4',
  });
  g.add(mergeByMaterial(manorFacade));

  // Rear Cloete Wine Cellar with Baroque pediment gable & green shutters
  add(g, CB(2.2, 0.1, 1.5, 0.02), MStone('#9e6e58', 0.88), -4.5, 0.3, -2.4);
  add(g, CB(2.0, 0.72, 1.3, 0.03), wh, -4.5, 0.7, -2.4);
  add(g, gableRoofGeo(2.0, 1.3, 0.62, 0.1), th, -4.5, 1.08, -2.4);
  add(g, capeDutchGableGeo(0.95, 0.76, 0.14), wh, -4.5, 1.08, -1.73);
  add(g, CB(0.55, 0.22, 0.05, 0.01), terracotta, -4.5, 1.24, -1.65);
  [-0.6, 0, 0.6].forEach((dx) => {
    add(g, CB(0.18, 0.34, 0.04, 0.01), wn, -4.5 + dx, 0.72, -1.72);
    [-1, 1].forEach((s) =>
      add(g, CB(0.075, 0.34, 0.04, 0.008), gn, -4.5 + dx + s * 0.15, 0.72, -1.715)
    );
  });

  // East lawn reflecting pond with stone curb
  const pondX = 4.7;
  const pondZ = 1.5;
  const pondGeo = new THREE.CircleGeometry(1.3, 48).rotateX(-Math.PI / 2);
  const pp = pondGeo.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i);
    const z = pp.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + 0.12 * Math.sin(a * 3 + 0.6) + 0.07 * Math.cos(a * 5 - 0.3);
    pp.setXYZ(i, x * k, 0.2 + hAt(pondX + x * k, pondZ + z * k), z * k);
  }
  pondGeo.computeVertexNormals();
  add(g, pondGeo, MWater('#608c88', 0.08, 0.22), pondX, 0.02, pondZ);
  add(
    g,
    new THREE.RingGeometry(1.27, 1.42, 48).rotateX(-Math.PI / 2),
    MStone('#b8a98c', 0.95),
    pondX,
    0.24,
    pondZ
  );

  // Contour-following Constantia vineyard trellises
  const vineSegs: InstanceTransform[] = [];
  const stakeT: InstanceTransform[] = [];
  for (let r = 0; r < 13; r++) {
    const zBase = 2.0 + r * 0.43;
    for (let i = 0; i < 20; i++) {
      const x = -4.7 + i * (9.4 / 19);
      const z = zBase + 0.28 * Math.sin((x + 4.7) * 0.5 + r * 0.18);
      if (Math.hypot(x - pondX, z - pondZ) < 1.45) continue;
      const y = 0.2 + hAt(x, z);
      vineSegs.push({
        x,
        y: y + 0.18,
        z,
        ry: -0.14 * Math.cos((x + 4.7) * 0.5 + r * 0.18),
      });
      if (i % 4 === 0) stakeT.push({ x, y: y + 0.16, z });
    }
  }
  instancedMeshes(g, CB(0.52, 0.22, 0.15, 0.03), Mc('#74804e'), vineSegs, [
    '#74804e',
    '#7f9160',
    '#5e7f38',
  ]);
  instancedMeshes(g, C(0.02, 0.025, 0.36, 5), MWood('#5c442d', 0.9), stakeT);

  const roadT: InstanceTransform[] = [];
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const x = -6.6 + t * 6.4;
    const z = -1.5 + 0.85 * Math.sin(t * Math.PI * 0.9);
    roadT.push({ x, y: 0.23 + hAt(x, z), z, ry: -0.12 * Math.cos(t * Math.PI * 0.9) });
  }
  instancedMeshes(g, CB(0.3, 0.03, 0.17, 0.01), MStone('#b8a98c', 0.95), roadT);
  const grootLamps: StreetLampSpec[] = [
    { x: -0.62, y: 0.315, z: 0.88, kind: 'lantern', scale: 0.88, color: '#ffd584' },
    { x: 0.62, y: 0.315, z: 0.88, kind: 'lantern', scale: 0.88, color: '#ffd584' },
    { x: -5.22, y: 0.35, z: -1.66, kind: 'lantern', scale: 0.82, color: '#ffd584' },
    { x: -3.78, y: 0.35, z: -1.66, kind: 'lantern', scale: 0.82, color: '#ffd584' },
  ];
  for (const x of [-5.6, -3.9, -2.2]) {
    const t = (x + 6.6) / 6.4;
    const z = -1.5 + 0.85 * Math.sin(t * Math.PI * 0.9) + 0.24;
    grootLamps.push({
      x,
      y: 0.22 + hAt(x, z),
      z,
      kind: 'victorian',
      scale: 0.86,
      color: '#ffcf7c',
    });
  }
  addStreetLampSet(g, grootLamps);

  const truck = car('#8d2f2b', 0.34);
  truck.position.set(-6.2, 0.36, -1.5);
  g.add(truck);
  const bakkie = car('#d8d3c4', 0.3);
  bakkie.position.set(-2.5, 0.34, -0.9);
  g.add(bakkie);

  // Constantiaberg grey Table Mountain Sandstone crags
  rock(g, 2.8, 4.2, 3.4, 0.4, -6.4, '#6d7883', '#9aa7b2', 0.18);
  rock(g, 1.6, 2.4, 2.6, -3.4, -6.1, '#75808a', '#a8b3bd', 0.16);
  rock(g, 1.3, 2.0, 2.0, 3.6, -6.2, '#6f7a84', '#a2adb7', 0.16);
  rock(g, 0.7, 1.0, 1.4, -1.4, -6.6, '#8b97a1', '#b4bec6', 0.22, 2.5);
  rock(g, 0.6, 0.9, 1.2, 1.5, -6.7, '#8b97a1', '#b4bec6', 0.2, 2.7);

  [
    [-6.8, -4.6, 1.5, 1], [-5.1, -5.6, 1.3, 1], [-3.4, -5.9, 1.2, 4], [-1.6, -6.1, 1.1, 1],
    [1.8, -6.1, 1.2, 1], [3.6, -5.6, 1.3, 4], [5.6, -4.8, 1.4, 1], [6.8, -2.6, 1.3, 1],
    [-7.0, -1.2, 1.3, 1], [-6.9, 1.4, 1.2, 4], [-6.6, 4.0, 1.3, 1], [-5.6, 6.0, 1.2, 1],
    [6.9, 4.2, 1.2, 1], [5.8, 6.0, 1.1, 4], [4.2, 6.4, 1.2, 1], [2.2, 6.6, 1.1, 1],
    [-2.4, 5.9, 1.0, 4], [0.2, 6.5, 1.1, 1],
  ].forEach(([x, z, s, k]) => tree(g, x, z, s, k, 0.2 + hAt(x, z)));

  const tufts: InstanceTransform[] = [];
  const pebbles: InstanceTransform[] = [];
  for (let i = 0; i < 110; i++) {
    const x = -7.6 + R(i * 3 + 1) * 15.2;
    const z = -7.6 + R(i * 5 + 7) * 15.2;
    if (Math.abs(x) < 3 && Math.abs(z) < 1.6) continue;
    if (z > 1.4 && z < 7.4 && Math.abs(x) < 5.2) continue;
    if (Math.hypot(x - pondX, z - pondZ) < 1.5) continue;
    tufts.push({ x, y: 0.2 + hAt(x, z), z });
    if (i % 4 === 0) pebbles.push({ x, y: 0.2 + hAt(x, z), z, sx: 0.6, sz: 0.8 });
  }
  grassTufts(g, tufts, ['#74804e', '#8d9770', '#5e7f38']);
  scatterRocks(g, pebbles, '#8c8069', '#b3a68c');

  const bd = birds(g, 5, 3.5, 6);
  g.userData.tick = (t: number) => {
    bd(t);
    const p = (t * 0.045) % 1;
    const x = -6.2 + p * 6.0;
    const z = -1.5 + 0.85 * Math.sin(p * Math.PI * 0.9);
    truck.position.set(x, 0.36 + hAt(x, z), z);
    truck.rotation.y = -0.12 * Math.cos(p * Math.PI * 0.9);
  };
  return g;
}

export function hermanus(): THREE.Group {
  const g = new THREE.Group();
  // Cold Walker Bay Atlantic water & pale Table Mountain Sandstone headlands
  sea(g, '#245e73', '#42828a');
  rock(g, 2.4, 3.8, 3.2, -3.6, -1.2, '#7d7a6c', '#a99b86', 0.12);
  rock(g, 1.8, 2.8, 2.4, -4.2, 2.4, '#7d7a6c', '#9e9a86', 0.12);
  add(g, C(2.3, 2.35, 0.1, 40), MStone('#848272', 0.95), -3.6, 3.22, -1.2);

  // Winding Cliff Path walkway with dry-stone masonry edge wall & timber viewing benches
  const pv: THREE.Vector3[] = [];
  for (let i = 0; i < 30; i++) {
    const a = -1.1 + i * 0.1;
    pv.push(new THREE.Vector3(-3.6 + 2.6 * Math.cos(a) * 0.6, 3.3, -1.2 + 2.6 * Math.sin(a) * 1.4));
  }
  add(
    g,
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pv), 60, 0.055, 5),
    MStone('#d8cfb8', 0.9)
  );
  const wallT: InstanceTransform[] = [];
  for (let i = 0; i < 18; i++) {
    const a = -0.9 + i * 0.13;
    wallT.push({
      x: -3.6 + 2.15 * Math.cos(a),
      y: 3.32,
      z: -1.2 + 2.15 * Math.sin(a),
      ry: -a,
    });
  }
  instancedMeshes(g, CB(0.1, 0.16, 0.28, 0.015), MStone('#928876', 0.95), wallT);
  const wood = MWood('#6f5538', 0.88);
  for (const [bx, bz, ry] of [
    [-2.05, -0.45, 0.45],
    [-2.25, 0.85, 0.25],
  ]) {
    const bench = new THREE.Group();
    bench.position.set(bx, 3.28, bz);
    bench.rotation.y = ry;
    add(bench, CB(0.16, 0.04, 0.42, 0.008), wood, 0, 0.08, 0);
    add(bench, CB(0.03, 0.1, 0.42, 0.006), wood, -0.06, 0.13, 0);
    add(bench, CB(0.04, 0.08, 0.04, 0.005), M('#2a2c30', 0.6), 0, 0.04, -0.15);
    add(bench, CB(0.04, 0.08, 0.04, 0.005), M('#2a2c30', 0.6), 0, 0.04, 0.15);
    g.add(bench);
  }
  addStreetLampSet(g, [
    { x: -2.05, y: 3.27, z: -0.95, kind: 'bollard', scale: 0.74, color: '#ffd080', poolRadius: 0.62 },
    { x: -2.15, y: 3.27, z: 0.2, kind: 'bollard', scale: 0.74, color: '#ffd080', poolRadius: 0.62 },
    { x: -2.45, y: 3.27, z: 1.35, kind: 'bollard', scale: 0.74, color: '#ffd080', poolRadius: 0.62 },
  ]);

  // Coastal fynbos & milkwood scrub along cliff crest
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 16; i++) {
    const a = R(i) * 6.28;
    const r = R(i + 3) * 1.9;
    bushT.push({
      x: -3.6 + r * Math.cos(a),
      y: 3.35,
      z: -1.2 + r * Math.sin(a),
      sx: 0.5,
      sy: 0.3,
      sz: 0.5,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.32, 1), Mc('#7a825c'), bushT, [
    '#7a825c',
    '#8f966f',
    '#5e6e48',
  ]);

  // Submerged swaying Ecklonia kelp forest in the shallow rocky cove
  const kelpStipes: InstanceTransform[] = [];
  for (let i = 0; i < 24; i++) {
    const x = -1.6 + R(i * 3) * 2.4;
    const z = -2.2 + R(i * 7) * 4.4;
    kelpStipes.push({
      x,
      y: 0.07,
      z,
      rx: (R(i) - 0.5) * 0.4,
      ry: R(i * 5) * 6.28,
      rz: (R(i + 2) - 0.5) * 0.4,
    });
  }
  instancedMeshes(g, new THREE.ConeGeometry(0.045, 0.34, 5), Mc('#566134'), kelpStipes, [
    '#566134',
    '#6b703a',
  ]);

  // Authentic Southern Right Whale pod (callosity bonnets, paddle flippers, NO dorsal fin)
  const wa = whale(1);
  const wb = whale(1.15);
  const wc = whale(0.5);
  g.add(wa, wb, wc);
  const rg = add(
    g,
    new THREE.RingGeometry(0.2, 0.26, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: '#eaf8ff',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    2.9,
    0.14,
    -0.4
  );

  // Characteristic V-shaped dual blowhole spray plume
  const blow = drift(
    g,
    36,
    '#eef9ff',
    0.11,
    (i, t) => {
      const k = (t * 0.65 + R(i * 4)) % 1;
      const side = i % 2 === 0 ? 1 : -1;
      const yaw = wa.rotation.y + side * 0.38;
      const fwdX = Math.cos(wa.rotation.y) * 0.42;
      const fwdZ = -Math.sin(wa.rotation.y) * 0.42;
      return [
        wa.position.x + fwdX + Math.sin(yaw) * side * k * 0.48 + (R(i) - 0.5) * 0.08,
        0.18 + Math.sin(k * Math.PI) * 1.15,
        wa.position.z + fwdZ + Math.cos(yaw) * side * k * 0.48 + (R(i + 2) - 0.5) * 0.08,
      ];
    },
    0.58
  );
  const sr = seaRings(g, 0.12, 3.4, 3);
  const bd = birds(g, 4, 3.4, 6);
  g.userData.tick = (t: number) => {
    const a = t * 0.12;
    const sn = Math.sin(a);
    const cs = Math.cos(a);
    wa.position.set(2.4 * cs + 0.4, 0.1 + Math.sin(t * 1.1) * 0.03, 2.4 * sn + 0.9);
    wa.rotation.y = -a - Math.PI / 2;
    wc.position.set(wa.position.x + 0.5 * cs, 0.1, wa.position.z + 0.5 * sn);
    wc.rotation.y = wa.rotation.y;
    const u = (t % 11) / 11;
    if (u < 0.28) {
      const v = u / 0.28;
      wb.position.set(1.4 + v * 1.5, Math.sin(Math.PI * v) * 1.9 - 0.1, -0.4);
      wb.rotation.z = Math.cos(Math.PI * v);
    } else {
      wb.position.y = -3;
    }
    const w = (u - 0.28) / 0.22;
    rg.material.opacity = w > 0 && w < 1 ? 0.65 * (1 - w) : 0;
    rg.scale.setScalar(1 + Math.max(0, w) * 28);
    blow(t);
    sr(t);
    bd(t);
  };
  return g;
}

export function isimangaliso(): THREE.Group {
  const g = new THREE.Group();
  const wood = MWood('#7a6244', 0.88);
  add(g, B(15.2, 0.2, 15.2), MStone('#cbb897', 0.95), 0, 0.1, 0);
  // Deep tea-stained olive-slate St. Lucia estuary lagoon
  add(g, C(4.6, 4.6, 0.06, 64), MWater('#3f5448', 0.1, 0.24), 0, 0.22, 0.6);
  rock(g, 2.6, 4.6, 2.2, 0, -5.3, '#8e7d6c', '#cbb897', 0.12);
  rock(g, 1.8, 3.2, 1.6, -5.2, -2.4, '#8e7d6c', '#cbb897', 0.12);
  for (let i = 0; i < 8; i++) tree(g, -2 + R(i) * 4, -5.3 + (R(i + 9) - 0.5) * 2, 1, 1, 2.3);

  // Arching mangrove prop-root thickets & swaying estuary papyrus reeds
  const rootT: InstanceTransform[] = [];
  for (let i = 0; i < 36; i++) {
    const a = 0.2 + (i / 36) * Math.PI * 1.3;
    const r = 4.25 + (i % 3) * 0.14;
    rootT.push({
      x: r * Math.cos(a),
      y: 0.34,
      z: 0.6 + r * Math.sin(a),
      ry: -a,
      rz: 0.55,
    });
  }
  instancedMeshes(g, C(0.014, 0.024, 0.36, 5), MBark('#4e3e30', 0.92), rootT);

  const reedT: InstanceTransform[] = [];
  for (let i = 0; i < 70; i++) {
    const a = R(i) * 6.28;
    const r = 4.4 + R(i + 5) * 0.5;
    reedT.push({
      x: r * Math.cos(a),
      y: 0.45,
      z: 0.6 + r * Math.sin(a),
      ry: R(i * 2) * 6.28,
      sy: 0.9 + R(i + 12) * 0.35,
    });
  }
  instancedMeshes(g, new THREE.ConeGeometry(0.032, 0.52, 4), Mc('#879669'), reedT, [
    '#879669',
    '#6f8158',
    '#9a9c76',
  ]);

  // Elevated timber estuary boardwalk & viewing hide projecting from south bank
  add(g, CB(0.54, 0.06, 2.6, 0.015), wood, -2.6, 0.44, 4.75);
  for (const bz of [3.65, 4.45, 5.25, 5.95]) {
    for (const bx of [-2.82, -2.38]) {
      add(g, C(0.03, 0.032, 0.44, 6), wood, bx, 0.28, bz);
    }
  }
  add(g, CB(0.76, 0.42, 0.62, 0.02), wood, -2.6, 0.66, 3.6);
  add(g, gableRoofGeo(0.78, 0.64, 0.22, 0.06), MBark('#685842', 0.94), -2.6, 0.87, 3.6);
  addStreetLampSet(g, [
    { x: -2.6, y: 0.47, z: 5.95, kind: 'bollard', scale: 0.74, color: '#ffd07d', poolRadius: 0.64 },
    { x: -2.6, y: 0.47, z: 4.7, kind: 'bollard', scale: 0.74, color: '#ffd07d', poolRadius: 0.64 },
    { x: -2.18, y: 0.47, z: 3.65, kind: 'bollard', scale: 0.74, color: '#ffd07d', poolRadius: 0.64 },
  ]);

  // Authentic St. Lucia semi-submerged Hippopotamus pod with periscope eyes, ears & nostrils
  const hp = (
    [
      [-1.0, 0.2, 0.3, 1.35],
      [1.2, 1.3, 1.2, 1.15],
      [0.2, 2.4, 2.1, 1.05],
      [-2.1, 1.5, 4.2, 1.2],
      [1.9, -0.4, 3.3, 0.85],
    ] as const
  ).map(([x, z, ry, sc]) => hippo(g, x, 0.18, z, sc, ry));

  const sr = seaRings(g, 0.25, 1.4, 3);
  const bd = birds(g, 4, 3.5, 5);
  const mist = drift(g, 40, '#eaf6ff', 0.12, (i, t) => [
    Math.cos(i * 2.4 + t * 0.05) * 4,
    0.5 + R(i + 3) * 1.2,
    0.6 + Math.sin(i * 2.4 + t * 0.05) * 4,
  ]);
  g.userData.tick = (t: number) => {
    hp.forEach((h, i) => {
      h.position.y = 0.18 + Math.sin(t * 0.8 + i * 2) * 0.025;
      h.rotation.z = Math.sin(t * 0.6 + i) * 0.03;
    });
    sr(t);
    bd(t);
    mist(t);
  };
  return g;
}

export function sani(): THREE.Group {
  const g = new THREE.Group();
  const basalt = MStone('#56554e', 0.94, 0.025);
  add(g, B(15.2, 0.2, 15.2), MStone('#7d7e58', 0.95), 0, 0.1, 0);
  rock(g, 2.5, 4.3, 6.2, 0, -2, '#52534d', '#7c7564', 0.11);
  // Flanking Drakensberg basalt escarpment ridges & cold alpine slate rock pool
  rock(g, 1.3, 2.4, 4.6, -3.5, -2.7, '#52534d', '#7c7564', 0.14);
  rock(g, 1.2, 2.2, 4.1, 3.4, -2.5, '#52534d', '#7c7564', 0.14);
  add(g, CB(0.48, 3.8, 0.08, 0.02), MCascade('#dceef6', 0.84), -1.85, 2.05, 0.55).rotation.set(
    0.45,
    0.2,
    0.18
  );
  add(g, C(0.95, 0.95, 0.05, 28), MWater('#4d5e59', 0.1, 0.25), -2.0, 0.22, 1.65);

  // Switchback gravel track with stacked dry-stone masonry retaining walls
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 60; i++) {
    const y = 0.5 + i * 0.09;
    const a = 0.7 * Math.sin(i * 0.5);
    const r = 4.4 - (1.8 * y) / 6.2 + 0.4;
    pts.push(new THREE.Vector3(r * Math.sin(a), y, -2 + r * Math.cos(a)));
  }
  const cv = new THREE.CatmullRomCurve3(pts);
  add(g, new THREE.TubeGeometry(cv, 200, 0.085, 5), MStone('#b59f79', 0.95));
  const wallSegs: InstanceTransform[] = [];
  for (let i = 3; i < 56; i += 3) {
    const p = pts[i];
    wallSegs.push({
      x: p.x,
      y: p.y - 0.16,
      z: p.z,
      ry: Math.atan2(p.x, p.z + 2),
    });
  }
  instancedMeshes(g, CB(0.46, 0.28, 0.16, 0.02), basalt, wallSegs);

  // Gully-drifted snow patches along summit plateau + stone/iron Sani Mountain Lodge + Basotho mokhoro rondavels
  const snowCap = tint(new THREE.CylinderGeometry(2.45, 2.55, 0.12, 36), (k, X, _Y, Z) => {
    const driftMix = 0.5 + 0.5 * Math.sin(X * 2.4 + Z * 1.9);
    k.set(driftMix > 0.42 ? '#eef3fa' : '#6c6a5e');
  });
  add(g, snowCap, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.76 }), 0, 6.24, -2);
  add(g, CB(0.58, 0.3, 0.44, 0.02), basalt, 0.3, 6.4, -2.25);
  add(g, gableRoofGeo(0.6, 0.46, 0.18, 0.04), M('#757a7c', 0.55, 0.45), 0.3, 6.55, -2.25);
  add(g, CB(0.06, 0.26, 0.44, 0.01), MPlaster('#9c3c32', 0.78), 0.59, 6.42, -2.25);
  add(g, CB(0.14, 0.12, 0.03, 0.005), G('#ffd58a', 1.1), 0.3, 6.4, -2.02);
  rondavel(g, -0.85, -2.35, 6.28, 0.62, '#6b6962', '#635540');
  rondavel(g, -1.45, -1.85, 6.28, 0.54, '#6b6962', '#635540');
  addStreetLampSet(g, [
    { x: 0.05, y: 6.26, z: -1.92, kind: 'lantern', scale: 0.72, color: '#ffca72', poolRadius: 0.65 },
    { x: 0.55, y: 6.26, z: -1.92, kind: 'lantern', scale: 0.72, color: '#ffca72', poolRadius: 0.65 },
    { x: -0.55, y: 6.28, z: -2.05, kind: 'lantern', scale: 0.7, color: '#ffca72', poolRadius: 0.62 },
  ]);

  const tuftT: InstanceTransform[] = [];
  for (let i = 0; i < 55; i++) {
    const a = R(i + 20) * 6.2832;
    const r = 3.2 + R(i + 80) * 3.8;
    tuftT.push({ x: r * Math.cos(a), y: 0.2, z: r * Math.sin(a), ry: R(i * 7) * 6.28, sy: 1.1 });
  }
  grassTufts(g, tuftT, ['#85855e', '#a79a69', '#8f9154']);
  const cs = [0, 1, 2].map((i) => {
    const c = car(['#a6382e', '#d8d5cc', '#2e5d84'][i], 0.28);
    g.add(c);
    return c;
  });
  const mist = drift(g, 55, '#eaf2f8', 0.14, (i, t) => [
    Math.cos(i * 2.4 + t * 0.05) * 4,
    2 + R(i + 3) * 4 + Math.sin(t * 0.3 + i) * 0.3,
    -2 + Math.sin(i * 2.4 + t * 0.05) * 4,
  ]);
  g.userData.tick = (t: number) => {
    cs.forEach((c, i) => {
      const d = i % 2 ? 1 : -1;
      const u = (((t * 0.02 * d + i / 3) % 1) + 1) % 1;
      const p = cv.getPointAt(u);
      const tg = cv.getTangentAt(u);
      if (d < 0) tg.negate();
      c.position.set(p.x, p.y + 0.06, p.z);
      c.rotation.y = Math.atan2(-tg.z, tg.x);
    });
    mist(t);
  };
  return g;
}

export function richtersveld(): THREE.Group {
  const g = new THREE.Group();
  add(g, B(15.2, 0.2, 15.2), MStone('#b29c7e', 0.96), 0, 0.1, 0);

  // Jagged flat-shaded gneiss & iron-oxide quartzite peaks
  const shardMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    flatShading: true,
    ...surfaceDetail('stone', 0.03),
  });
  const shard = (x: number, z: number, rb: number, h: number, ry: number) => {
    const ge = C(rb * 0.3, rb, h, 5, 1);
    tint(ge, (k, _X, Y) => k.set(Y > 0 ? '#bc9672' : '#925f49'));
    add(g, ge, shardMat, x, 0.2 + h / 2, z).rotation.y = ry;
  };
  [
    [-4.6, -2.6, 1.5, 2.7, 0.3],
    [4.4, -3, 1.3, 2.3, -0.4],
    [0, -5, 1.7, 3.1, 0.8],
    [-3, 3.6, 0.9, 1.5, 1.2],
    [3.2, 2.8, 1.0, 1.8, -0.6],
  ].forEach(([x, z, rb, h, ry]) => shard(x, z, rb, h, ry));

  // Pale white Namaqualand quartz-pebble scree mixed with rusted granite scree
  const screeT: InstanceTransform[] = [];
  const quartzT: InstanceTransform[] = [];
  for (let i = 0; i < 24; i++) {
    const a = R(i) * 6.28;
    const r = 1 + R(i + 9) * 5;
    const s = 0.28 + R(i + 2) * 0.28;
    const item = { x: r * Math.cos(a), y: 0.23, z: r * Math.sin(a), sx: s, sy: s * 0.72, sz: s };
    if (i % 3 === 0) quartzT.push(item);
    else screeT.push(item);
  }
  scatterRocks(g, screeT, '#ac7958', '#bc9672');
  scatterRocks(g, quartzT, '#d6d0c2', '#eae4d7');

  // True dichotomous branching Quiver Trees + north-leaning Halfmens succulents
  [
    [-1.5, 0.6, 1.25, 0.3],
    [2.0, -0.8, 1.48, 1.6],
    [3.2, 2.2, 1.02, 2.8],
    [-3.6, -0.6, 1.15, 4.1],
  ].forEach(([x, z, s, sd]) => quiverTree(g, x, 0.2, z, s, sd));
  halfmensTree(g, -0.2, 0.2, -1.8, 1.1);
  halfmensTree(g, 1.1, 0.2, -2.6, 0.95);

  // Nama matjieshuis woven-reed dome tucked near shelter boulder
  add(
    g,
    new THREE.SphereGeometry(0.46, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    MBark('#a6946b', 0.94, 0.04),
    -2.2,
    0.18,
    2.5
  );
  add(g, CB(0.18, 0.22, 0.08, 0.01), M('#2a231c', 0.95), -2.2, 0.3, 2.91);

  g.userData.tick = drift(g, 45, '#f0c890', 0.08, (i, t) => [
    ((((R(i) * 12 - 6 + t * 0.4) % 12) + 12) % 12) - 6,
    0.5 + R(i + 3) * 1.5,
    R(i + 5) * 10 - 5,
  ]);
  return g;
}

export function vredefort(): THREE.Group {
  const g = new THREE.Group();
  // Asymmetric north/west crescent Witwatersrand quartzite collar arcs + central eroded granite dome
  const pr = [
    [0.01, 0.58],
    [0.65, 0.92],
    [1.35, 0.72],
    [2.1, 0.22],
    [3.0, 0.16],
    [3.85, 0.76],
    [4.55, 1.62],
    [5.15, 1.88],
    [5.75, 1.02],
    [6.5, 0.32],
    [7.6, 0.12],
  ].map((p) => new THREE.Vector2(...p));
  const ge = new THREE.LatheGeometry(pr, 112);
  const p = ge.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const r = Math.hypot(X, Z);
    const a = Math.atan2(Z, X);
    // Concentric collar ridges stand highest on the north & west horseshoe (-x, -z) and open to SE Karoo plain
    const crescent = r > 2.4 ? 0.32 + 0.72 * Math.max(0, Math.cos(a + Math.PI * 0.75) * 0.5 + 0.5) : 1.0;
    const strata = r > 2.4 ? 1 + 0.22 * Math.sin(r * 4.2 + a * 2) : 1;
    p.setY(i, Y * crescent * strata * (1 + 0.2 * Math.sin(a * 3 + 1)));
  }
  const lo = new THREE.Color('#aca277');
  const md = new THREE.Color('#7f8756');
  const hi = new THREE.Color('#7c7669');
  add(
    g,
    tint(ge, (k, X, Y, Z) => {
      if (Math.hypot(X, Z) < 3.0)
        k.copy(lo).lerp(md, 0.3 + 0.3 * Math.sin(X * 3) * Math.sin(Z * 3));
      else k.copy(md).lerp(hi, Math.min(1, Y / 1.7));
    }),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      ...surfaceDetail('stone', 0.025),
      side: THREE.DoubleSide,
    })
  );

  // Three broken overturned Witwatersrand quartzite collar arcs along NW crescent
  for (const [rad, tube, arcStart, arcLen, col] of [
    [4.4, 0.22, Math.PI * 0.72, Math.PI * 1.12, '#7c7669'],
    [5.4, 0.2, Math.PI * 0.65, Math.PI * 1.25, '#8a8474'],
    [6.5, 0.16, Math.PI * 0.68, Math.PI * 1.15, '#9d9582'],
  ] as const) {
    add(
      g,
      new THREE.TorusGeometry(rad, tube, 6, 64, arcLen).rotateX(Math.PI / 2).rotateY(arcStart),
      MStone(col, 0.94),
      0,
      0.34,
      0
    );
  }

  // Winding Vaal River S-bend slicing diagonally through the dome with granite boulder rapids
  const vaalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.0, 0.22, 4.4),
    new THREE.Vector3(-3.8, 0.22, 2.2),
    new THREE.Vector3(-0.8, 0.22, 2.9),
    new THREE.Vector3(2.4, 0.22, 0.8),
    new THREE.Vector3(5.2, 0.22, -1.2),
    new THREE.Vector3(7.1, 0.22, -3.4),
  ]);
  const river = add(
    g,
    new THREE.TubeGeometry(vaalCurve, 64, 0.42, 8),
    MWater('#5d776a', 0.09, 0.24)
  );
  river.scale.y = 0.25;
  river.position.y = 0.22;

  const rapidT: InstanceTransform[] = [];
  for (let i = 0; i < 14; i++) {
    const pt = vaalCurve.getPointAt(0.12 + (i / 14) * 0.76);
    rapidT.push({
      x: pt.x + (R(i) - 0.5) * 0.35,
      y: 0.26,
      z: pt.z + (R(i + 4) - 0.5) * 0.35,
      sx: 0.24,
      sy: 0.14,
      sz: 0.24,
    });
  }
  scatterRocks(g, rapidT, '#6c665c', '#989080');

  const rg = add(
    g,
    new THREE.RingGeometry(0.3, 0.4, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: '#d8d0b8',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    0,
    0.66,
    0
  );
  for (let i = 0; i < 8; i++) {
    const a = i * 0.8 + 0.2;
    tree(g, 6.4 * Math.cos(a), 6.4 * Math.sin(a), 0.8, 2, 0.14);
  }
  g.userData.tick = (t: number) => {
    const w = (Math.sin(t * 0.4) + 1) / 2;
    rg.material.opacity = 0.04 + 0.05 * w;
    rg.scale.setScalar(1.2 + 0.2 * w);
  };
  return g;
}

export function harties(): THREE.Group {
  const g = new THREE.Group();
  const cn = MStone('#aaa291', 0.82, 0.015);
  add(g, B(15.2, 0.2, 15.2), MStone('#778878', 0.95), 0, 0.1, 0);
  // Impounded Magaliesberg valley floor beneath murky emerald dam basin & downstream Crocodile River
  add(g, B(10.6, 1.29, 5.6), MStone('#686a48', 0.95), 0, 0.845, -3.3);
  add(g, CB(10, 0.1, 5.4, 0.02), MWater('#5a7c66', 0.09, 0.24), 0, 1.55, -3.3);
  add(g, CB(4, 0.06, 5, 0.02), MWater('#567369', 0.09, 0.24), 0, 0.24, 3.6);
  const wallMat = MStone('#aaa291', 0.82);
  wallMat.side = THREE.DoubleSide;
  add(g, C(4.2, 4.2, 1.6, 64, 1, true, Math.PI * 0.6, Math.PI * 0.8), wallMat, 0, 0.95, 4.1);
  add(g, C(4.3, 4.3, 0.12, 64, 1, false, Math.PI * 0.6, Math.PI * 0.8), cn, 0, 1.8, 4.1);

  // 10 recessed spillway sluice piers & crest parapet along dam crest
  const pierT: InstanceTransform[] = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * 0.66 + (i / 9) * Math.PI * 0.68;
    pierT.push({
      x: 4.15 * Math.sin(a),
      y: 1.88,
      z: 4.1 + 4.15 * Math.cos(a),
      ry: a,
    });
  }
  instancedMeshes(g, CB(0.14, 0.22, 0.28, 0.015), cn, pierT);
  add(g, CB(0.85, 1.35, 0.08, 0.02), MCascade('#e4f5fc', 0.85), 0, 0.92, -0.15);

  rock(g, 1.6, 2.8, 3.6, -5, -1, '#787465', '#a99b86', 0.14);
  rock(g, 1.8, 3, 4, 5.2, -1.6, '#787465', '#a99b86', 0.14);

  // 1923 Roman Triumphal Victory Arch on western dam crest road leading into Kommando Nek tunnel portal
  const archX = -2.75;
  const archZ = 1.05;
  add(g, CB(0.75, 0.64, 0.36, 0.02), cn, archX, 2.08, archZ).rotation.y = 0.72;
  add(g, CB(0.86, 0.1, 0.42, 0.015), cn, archX, 2.42, archZ).rotation.y = 0.72;
  add(g, new THREE.TorusGeometry(0.24, 0.06, 8, 18, Math.PI), cn, archX, 1.98, archZ).rotation.y = 0.72;
  add(g, CB(0.55, 0.48, 0.42, 0.02), M('#181c20', 0.95), -4.15, 1.98, -0.25).rotation.y = 0.65;
  const hartiesLamps: StreetLampSpec[] = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 0.7 + (i / 5) * Math.PI * 0.6;
    hartiesLamps.push({
      x: 4.22 * Math.sin(a),
      y: 1.86,
      z: 4.1 + 4.22 * Math.cos(a),
      kind: 'cobra',
      ry: a - Math.PI / 2,
      scale: 0.78,
      color: '#ffc670',
      poolRadius: 0.96,
    });
  }
  hartiesLamps.push(
    { x: -2.42, y: 1.86, z: 1.38, kind: 'lantern', scale: 0.85, color: '#ffd688' },
    { x: -3.08, y: 1.86, z: 0.72, kind: 'lantern', scale: 0.85, color: '#ffd688' },
    { x: -3.85, y: 0.2, z: 5.2, kind: 'bollard', scale: 0.85, color: '#ffd480' },
    { x: -2.95, y: 0.2, z: 5.2, kind: 'bollard', scale: 0.85, color: '#ffd480' }
  );
  addStreetLampSet(g, hartiesLamps);

  // Emerald floating water-hyacinth mats near upstream face
  const hyT = Array.from({ length: 24 }, (_, i) => ({
    x: -4.4 + (i % 12) * 0.8,
    y: 1.6 + (i % 3) * 0.01,
    z: -3.2 + Math.floor(i / 12) * 1.15,
    sx: 0.52,
    sy: 0.02,
    sz: 0.42,
  }));
  instancedMeshes(g, new THREE.CircleGeometry(0.32, 8), Mc('#4e8836'), hyT, [
    '#4e8836',
    '#629c42',
    '#41782c',
  ]);

  // Volumetric Magaliesberg Aerial Cableway (TubeGeometry — zero lines()!)
  const A = new THREE.Vector3(-3.4, 0.9, 5.2);
  const Bv = new THREE.Vector3(4.6, 4.3, -1.4);
  add(
    g,
    new THREE.TubeGeometry(new THREE.LineCurve3(A, Bv), 12, 0.02, 6, false),
    M('#30353b', 0.45, 0.75)
  );
  add(g, CB(0.72, 0.5, 0.62, 0.03), cn, A.x, 0.4, A.z);
  add(g, CB(0.72, 0.4, 0.62, 0.03), cn, Bv.x, Bv.y - 0.3, Bv.z);
  const g1 = gondola('#4f8c7d');
  const g2 = gondola('#4d6269');
  g.add(g1, g2);

  const sb = [0, 1, 2].map((i) => {
    const b = new THREE.Group();
    const h = new THREE.Shape();
    h.moveTo(-0.25, 0);
    h.lineTo(0.25, 0);
    h.lineTo(0.18, -0.08);
    h.lineTo(-0.2, -0.08);
    h.closePath();
    add(
      b,
      new THREE.ExtrudeGeometry(h, { depth: 0.12, bevelEnabled: false }).translate(0, 0.1, -0.06),
      M('#f4f4f2', 0.5)
    );
    const sl = new THREE.Shape();
    sl.moveTo(0, 0);
    sl.lineTo(0, 0.5);
    sl.lineTo(0.22, 0);
    sl.closePath();
    const sm = MT(['#e0dcd0', '#c9c6ba', '#4f8c7d'][i], 1, 0.7, 0, true);
    add(b, new THREE.ShapeGeometry(sl), sm, 0, 0.14, 0);
    g.add(b);
    return b;
  });
  for (let i = 0; i < 6; i++) tree(g, -4.5 + i * 1.9, 4.6 + R(i), 0.9, 1, 0.2);
  const bd = birds(g, 3, 3.4, 6);
  g.userData.tick = (t: number) => {
    const u = (Math.sin(t * 0.3) + 1) / 2;
    g1.position.lerpVectors(A, Bv, u);
    g2.position.lerpVectors(A, Bv, 1 - u);
    g1.rotation.z = g2.rotation.z = Math.sin(t * 1.7) * 0.05;
    sb.forEach((b, i) => {
      b.position.set(
        -3.5 + ((t * 0.12 + i * 2.4) % 7),
        1.62 + Math.sin(t * 1.3 + i) * 0.012,
        -2.5 - i * 0.9
      );
      b.rotation.z = Math.sin(t * 1.1 + i) * 0.04;
    });
    bd(t);
  };
  return g;
}

export function knysna(): THREE.Group {
  const g = new THREE.Group();
  // Deep Indian Ocean swell meeting sheltered green-teal Knysna Lagoon
  sea(g, '#265c73', '#49828b');
  rock(g, 1.9, 3.2, 4, -3.8, -0.4, '#a6805a', '#c6a57a', 0.12);
  rock(g, 1.45, 2.5, 3.6, 3.6, -0.8, '#a6805a', '#c6a57a', 0.12);
  add(g, C(1.85, 1.9, 0.1, 40), MStone('#455e3d', 0.94), -3.8, 4.03, -0.4);
  add(g, C(1.65, 1.7, 0.1, 40), MStone('#60754d', 0.94), 3.6, 3.43, -0.8);
  add(g, CB(7, 0.08, 4.5, 0.02), MWater('#497d78', 0.09, 0.25), 0, 0.24, -5);
  rock(g, 0.5, 0.8, 0.6, -1.1, 0.8, '#7a6956', '#9a866d', 0.1);
  rock(g, 0.4, 0.7, 0.5, 1.2, 0.4, '#7a6956', '#9a866d', 0.1);

  // Recessed 3D sandstone sea caves with dark shadow recess & rocky arch brows
  const caveMat = M('#12161b', 0.96);
  const caveRim = MStone('#c6a57a', 0.95);
  const cave = (x: number, z: number, s: number) => {
    const voidBox = add(g, C(0.46 * s, 0.48 * s, 0.48 * s, 16), caveMat, x, 0.44, z + 0.14);
    voidBox.scale.set(1, 1.35, 0.8);
    const rim = add(
      g,
      new THREE.TorusGeometry(0.5 * s, 0.12 * s, 8, 24, Math.PI),
      caveRim,
      x,
      0.22,
      z
    );
    rim.scale.y = 1.3;
  };
  cave(-3.8, -3.7, 1.0);
  cave(3.6, -3.65, 0.8);

  // Wild forested West Head (Featherbed) vs terraced cliffside cottages & viewpoint decks on East Head
  const houseT: InstanceTransform[] = [];
  const roofT: InstanceTransform[] = [];
  const addHouse = (x: number, y: number, z: number, ry: number) => {
    houseT.push({ x, y: y + 0.12, z, ry });
    roofT.push({ x, y: y + 0.24, z, ry });
  };
  for (let i = 0; i < 10; i++) {
    const a = R(i + 20) * 6.28;
    const r = R(i + 23) * 1.1;
    addHouse(3.6 + r * Math.cos(a), 3.45, -0.8 + r * Math.sin(a), -a);
  }
  for (let i = 0; i < 6; i++) {
    const z = -2.2 + i * 0.45;
    addHouse(2.75 + (i % 2) * 0.25, 1.35 + (i % 3) * 0.45, z, 0.4);
  }
  for (let i = 0; i < 12; i++) {
    const x = -2.8 + i * 0.48 + (R(i + 30) - 0.5) * 0.08;
    const z = -2.2 + R(i + 40) * 0.4;
    addHouse(x, 0.28, z, (R(i + 50) - 0.5) * 0.5);
  }
  instancedMeshes(g, CB(0.36, 0.24, 0.3, 0.015), MPlaster('#ffffff', 0.82), houseT, [
    '#e8e4da',
    '#d8d3c4',
    '#c9c6bd',
    '#ddd8c8',
  ]);
  instancedMeshes(g, gableRoofGeo(0.36, 0.31, 0.11, 0.03), MPlaster('#ffffff', 0.85), roofT, [
    '#6c5244',
    '#8a4a38',
    '#4a5f70',
  ]);
  add(g, CB(0.65, 0.06, 0.42, 0.015), MWood('#856846', 0.88), 2.35, 3.44, -0.5);
  addStreetLampSet(g, [
    { x: 2.1, y: 3.47, z: -0.35, kind: 'lantern', scale: 0.76, color: '#ffd482', poolRadius: 0.68 },
    { x: 2.65, y: 3.47, z: -0.7, kind: 'lantern', scale: 0.76, color: '#ffd482', poolRadius: 0.68 },
    { x: 3.25, y: 3.47, z: -0.45, kind: 'lantern', scale: 0.76, color: '#ffd482', poolRadius: 0.68 },
  ]);

  // Dense lush indigenous Outeniqua coastal canopy crowning West Head & steep slopes
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 42; i++) {
    const west = i < 28;
    const cx = west ? -3.8 : 3.6;
    const cz = west ? -0.4 : -0.8;
    const top = west ? 4.08 : 3.48;
    const a = R(i + 80) * 6.28;
    const r = R(i + 90) * (west ? 1.65 : 1.3);
    bushT.push({
      x: cx + r * Math.cos(a),
      y: top + 0.08,
      z: cz + r * Math.sin(a),
      sx: west ? 0.56 : 0.45,
      sy: west ? 0.38 : 0.28,
      sz: west ? 0.56 : 0.45,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.3, 1), Mc('#455e3d'), bushT, [
    '#455e3d',
    '#4f6748',
    '#637d50',
  ]);
  for (let i = 0; i < 9; i++) {
    tree(g, -3.8 + (R(i + 100) - 0.5) * 3.0, -0.4 + (R(i + 110) - 0.5) * 3.0, 0.85, 1, 1.8);
    if (i < 6) {
      tree(g, 3.6 + (R(i + 120) - 0.5) * 2.6, -0.8 + (R(i + 130) - 0.5) * 2.6, 0.72, 2, 1.4);
    }
  }

  const sailboat = (col: string, sc: number) => {
    const b = new THREE.Group();
    b.add(boat(col, 0.85));
    add(b, C(0.018, 0.022, 0.85, 6), MWood('#6f5a3c', 0.9), -0.02, 0.55, 0);
    const sailMat = MT('#f4f1e6', 1, 0.7, 0, true);
    const main = new THREE.Shape();
    main.moveTo(0, 0);
    main.lineTo(0, 0.72);
    main.lineTo(0.42, 0.02);
    main.closePath();
    add(b, new THREE.ShapeGeometry(main), sailMat, -0.02, 0.2, 0);
    const jib = new THREE.Shape();
    jib.moveTo(0, 0);
    jib.lineTo(0, 0.5);
    jib.lineTo(-0.28, 0.03);
    jib.closePath();
    add(b, new THREE.ShapeGeometry(jib), sailMat, -0.02, 0.2, 0);
    b.scale.setScalar(sc);
    return b;
  };
  const yachts: THREE.Group[] = [];
  const yachtCols = [
    '#e84a5f', '#2a6fd3', '#f4d35e', '#4ecdc4',
    '#f4f4f2', '#e8a07a', '#9b59b6', '#2a9d8f',
  ];
  for (let i = 0; i < 8; i++) {
    const y = sailboat(yachtCols[i], 0.55 + R(i) * 0.25);
    g.add(y);
    yachts.push(y);
  }
  const bt = boat('#3d6fa8', 0.9);
  g.add(bt);

  // Curved translucent volumetric whitewater bar rollers across the Knysna Bar (ZERO lines()!)
  const rollerMat = new THREE.MeshBasicMaterial({
    color: '#e6f8fd',
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  for (const [cx, cz, r] of [
    [-3.8, -0.4, 3.65],
    [3.6, -0.8, 3.15],
  ] as const) {
    const arc = add(
      g,
      new THREE.TorusGeometry(r, 0.045, 6, 36, Math.PI).rotateX(Math.PI / 2),
      rollerMat,
      cx,
      0.14,
      cz
    );
    arc.scale.y = 0.25;
  }
  for (let z = 0.4; z <= 1.8; z += 0.65) {
    const barCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.3, 0.14, z),
      new THREE.Vector3(0, 0.15, z + 0.25),
      new THREE.Vector3(1.3, 0.14, z),
    ]);
    const bar = add(g, new THREE.TubeGeometry(barCurve, 20, 0.055, 6, false), rollerMat);
    bar.scale.y = 0.28;
  }

  const sr = seaRings(g, 0.13, 2.6, 4);
  const foam = drift(g, 80, '#eafaff', 0.1, (i, t) => {
    const a = R(i) * 6.28;
    const k = (t * 0.3 + R(i + 3)) % 1;
    const rr = 5.4 + k * 0.8;
    return [rr * Math.cos(a), 0.14 + Math.sin(k * Math.PI) * 0.1, rr * Math.sin(a)];
  }, 0.65);
  const spray = drift(
    g,
    40,
    '#eaf8ff',
    0.1,
    (i, t) => {
      const k = (t * 0.48 + R(i * 5)) % 1;
      return [(R(i * 3) - 0.5) * 2.8, 0.16 + Math.sin(k * Math.PI) * 0.45, -0.6 + k * 2.2];
    },
    0.45
  );
  const bd = birds(g, 4, 3.4, 6);
  g.userData.tick = (t: number) => {
    const u = (t * 0.05) % 1;
    bt.position.set(Math.sin(t * 0.7) * 0.6, 0.12, -6.5 + u * 3.2);
    bt.rotation.y = -Math.PI / 2;
    yachts.forEach((y, i) => {
      const a = t * 0.06 * (i % 2 ? 1 : -1) + i * 0.8;
      const rr = 1.6 + R(i) * 1.6;
      y.position.set(Math.cos(a) * rr, 0.1 + Math.sin(t * 1.1 + i) * 0.025, -5 + Math.sin(a) * rr * 0.7);
      y.rotation.y = -a + (i % 2 ? Math.PI / 2 : -Math.PI / 2) + Math.sin(t * 0.5 + i) * 0.08;
      y.rotation.z = Math.sin(t * 0.9 + i) * 0.04;
    });
    sr(t);
    foam(t);
    spray(t);
    bd(t);
  };
  return g;
}

function saFlagTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 84;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#007749';
    ctx.fillRect(0, 0, 128, 84);
    ctx.fillStyle = '#de3831';
    ctx.fillRect(28, 0, 100, 26);
    ctx.fillStyle = '#002395';
    ctx.fillRect(28, 58, 100, 26);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(28, 24, 100, 7);
    ctx.fillRect(28, 53, 100, 7);
    ctx.fillStyle = '#007749';
    ctx.fillRect(28, 30, 100, 24);
    ctx.fillStyle = '#ffb612';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(42, 42);
    ctx.lineTo(0, 74);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#111316';
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(31, 42);
    ctx.lineTo(0, 66);
    ctx.closePath();
    ctx.fill();
  }
  return prepareCanvasTexture(new THREE.CanvasTexture(c));
}

export function donkin(): THREE.Group {
  const g = new THREE.Group();
  const st = MStone('#8d806e', 0.84, 0.02);
  const wh = MPlaster('#e4e0d4', 0.68);
  const dk = M('#2b2d34', 0.48, 0.6);
  const lt = G('#fff3b0', 2.6);
  sea(g, '#2e657c', '#4e8a93');
  add(g, C(4.6, 5.2, 1.4, 64), MStone('#a99b86', 0.94), 0, 0.7, 0);
  add(g, C(4.2, 4.4, 0.1, 64), MStone('#76824e', 0.95), 0, 1.42, 0);

  // Route 67 stone mosaic walkway across the reserve lawn
  const routeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, 1.46, 1.6),
    new THREE.Vector3(-0.8, 1.46, 1.4),
    new THREE.Vector3(0.4, 1.46, 0.6),
    new THREE.Vector3(1.15, 1.46, -0.35),
  ]);
  const walk = add(
    g,
    new THREE.TubeGeometry(routeCurve, 28, 0.18, 6, false),
    MStone('#c6bba5', 0.92)
  );
  walk.scale.y = 0.15;
  walk.position.y = 1.25;

  // 1820 Donkin Stone Pyramid on 3-step chamfered square plinth + dark bronze memorial plaque
  add(g, CB(2.1, 0.12, 2.1, 0.02), st, -0.8, 1.5, 0.4);
  add(g, CB(1.85, 0.12, 1.85, 0.02), st, -0.8, 1.62, 0.4);
  add(g, CB(1.6, 0.12, 1.6, 0.02), st, -0.8, 1.74, 0.4);
  add(g, new THREE.ConeGeometry(0.82, 2.2, 4), st, -0.8, 2.9, 0.4).rotation.y = Math.PI / 4;
  add(g, CB(0.28, 0.18, 0.04, 0.005), M('#3a3228', 0.55, 0.45), -0.8, 2.08, 0.96);

  // Octagonal 1861 Donkin Lighthouse + attached stone keeper's cottage wing + oxide-red lantern cupola
  add(g, C(0.28, 0.4, 1.55, 8), wh, 1.2, 2.28, -0.4);
  add(g, CB(0.75, 0.48, 0.62, 0.02), wh, 1.72, 1.7, -0.42);
  add(g, gableRoofGeo(0.77, 0.64, 0.22, 0.04), MPlaster('#8e4438', 0.8), 1.72, 1.94, -0.42);
  add(g, C(0.45, 0.4, 0.1, 16), dk, 1.2, 3.08, -0.4);
  railing(g, 0.44, 1.2, 3.12, -0.4, dk, 10, 0.15, 0.013);
  add(g, C(0.23, 0.23, 0.32, 16), MPlaster('#9e3a30', 0.65), 1.2, 3.32, -0.4);
  add(g, C(0.14, 0.14, 0.24, 12), lt, 1.2, 3.32, -0.28);
  add(g, new THREE.ConeGeometry(0.3, 0.3, 16), MPlaster('#9e3a30', 0.65), 1.2, 3.65, -0.4);
  const bm = new THREE.Group();
  bm.position.set(1.2, 3.32, -0.4);
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
  const sweep = addLighthouseSweep(g, 1.2, 1.49, -0.4, 5.8, '#ffefb2');

  // National Flagpole flying detailed South African flag
  add(g, C(0.02, 0.02, 1.7, 6), M('#999', 0.4, 0.8), -2.4, 2.25, 1.4);
  const flagMat = new THREE.MeshStandardMaterial({
    map: saFlagTexture(),
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  add(g, CB(0.54, 0.34, 0.018, 0.004), flagMat, -2.12, 2.9, 1.4);

  // Donkin Street Victorian row cottages perched cleanly along hillside stone retaining terraces
  const houseT: InstanceTransform[] = [];
  const roofT: InstanceTransform[] = [];
  const terraceT: InstanceTransform[] = [];
  for (let i = 0; i < 18; i++) {
    const a = -0.35 + i * 0.26 + R(i) * 0.05;
    const r = 4.25 + R(i + 3) * 0.28;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    const ty = 0.78 + (i % 3) * 0.06;
    terraceT.push({ x, y: ty - 0.16, z, ry: -a });
    houseT.push({ x, y: ty + 0.15, z, ry: -a });
    roofT.push({ x, y: ty + 0.29, z, ry: -a });
  }
  instancedMeshes(g, CB(0.56, 0.3, 0.48, 0.02), st, terraceT);
  instancedMeshes(g, CB(0.5, 0.3, 0.4, 0.02), MPlaster('#f4f1e8', 0.8), houseT, [
    '#e8e4da',
    '#d8d3c4',
    '#a06f62',
    '#789496',
  ]);
  instancedMeshes(g, gableRoofGeo(0.52, 0.42, 0.14, 0.03), MPlaster('#7a4534', 0.8), roofT);
  const donkinLamps: StreetLampSpec[] = [
    { x: -1.48, y: 1.56, z: -0.28, kind: 'uplight', scale: 0.86, color: '#ffd27a', coneHeight: 1.35 },
    { x: -0.12, y: 1.56, z: -0.28, kind: 'uplight', scale: 0.86, color: '#ffd27a', coneHeight: 1.35 },
    { x: -1.48, y: 1.56, z: 1.08, kind: 'uplight', scale: 0.86, color: '#ffd27a', coneHeight: 1.35 },
    { x: -0.12, y: 1.56, z: 1.08, kind: 'uplight', scale: 0.86, color: '#ffd27a', coneHeight: 1.35 },
  ];
  for (const u of [0.08, 0.38, 0.68, 0.94]) {
    const p = routeCurve.getPointAt(u);
    donkinLamps.push({
      x: p.x,
      y: 1.46,
      z: p.z + 0.18,
      kind: 'lantern',
      scale: 0.8,
      color: '#ffcf76',
    });
  }
  for (const i of [1, 5, 9, 13, 16]) {
    const a = -0.35 + i * 0.26 + R(i) * 0.05;
    const r = 3.84;
    const ty = 0.78 + (i % 3) * 0.06;
    donkinLamps.push({
      x: r * Math.cos(a),
      y: ty - 0.02,
      z: r * Math.sin(a),
      kind: 'victorian',
      scale: 0.76,
      color: '#ffd080',
    });
  }
  addStreetLampSet(g, donkinLamps);

  for (let i = 0; i < 5; i++) tree(g, -3 + i * 1.1, -1.8 + R(i) * 0.6, 0.8, 1, 1.45);
  const ship = boat('#b23a2c', 2.2);
  g.add(ship);
  for (let i = 0; i < 5; i++) {
    add(
      ship,
      CB(0.16, 0.1, 0.2, 0.015),
      M(['#458f96', '#be8655', '#6a7478', '#b85e50', '#c9a54b'][i], 0.65),
      0.1 + i * 0.09,
      0.23,
      0
    );
  }
  const sr = seaRings(g, 0.12, 5, 3);
  const bd = birds(g, 4, 3.4, 6);
  g.userData.tick = (t: number) => {
    bm.rotation.y = t * 1.2;
    sweep.rotation.y = bm.rotation.y;
    const a = t * 0.09;
    ship.position.set(6.6 * Math.cos(a), 0.1, 6.6 * Math.sin(a));
    ship.rotation.y = -a - Math.PI / 2;
    sr(t);
    bd(t);
  };
  return g;
}

/** High-resolution Soweto graffiti & FNB corporate cooling-tower wrap. */
function coolingTowerMural(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (seed % 2 === 1) {
      // East Tower: iconic FNB turquoise-cyan & charcoal corporate branding wrap
      ctx.fillStyle = '#158f9e';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#262b31';
      ctx.fillRect(0, 172, 512, 84);
      ctx.fillStyle = '#e8b339';
      ctx.fillRect(0, 162, 512, 12);
      ctx.fillStyle = '#f2efe6';
      ctx.beginPath();
      ctx.arc(256, 98, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#158f9e';
      ctx.beginPath();
      ctx.arc(256, 98, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2efe6';
      ctx.fillRect(251, 90, 10, 42);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? '#e8b339' : '#f2efe6';
        ctx.beginPath();
        ctx.arc(224 + i * 13, 84 - (i % 2) * 8, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.quadraticCurveTo(256, 12, 512, 40);
      ctx.stroke();
    } else {
      // West Tower: vivid Soweto street-art mosaic mural
      const pal = ['#c84b36', '#e08e36', '#e5bd42', '#266894', '#388e7c', '#222830'];
      ctx.fillStyle = '#f2ede2';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = pal[0];
      ctx.fillRect(0, 0, 180, 256);
      ctx.fillStyle = pal[3];
      ctx.fillRect(310, 0, 202, 256);
      ctx.fillStyle = pal[2];
      ctx.fillRect(0, 74, 512, 86);
      for (let i = 0; i < 8; i++) {
        const fx = 32 + i * 64;
        ctx.fillStyle = i % 2 ? '#222830' : '#f2ede2';
        ctx.beginPath();
        ctx.arc(fx, 114, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(fx - 15, 134, 30, 38);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.fillRect(0, 164, 512, 10);
      ctx.strokeStyle = '#c84b36';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, 224);
      for (let x = 32; x <= 512; x += 48) {
        ctx.lineTo(x, x % 96 === 0 ? 236 : 196);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return prepareCanvasTexture(tex);
}

/**
 * Orlando Towers, enhanced in place on top of the base builder: vivid murals,
 * diagonal V-strut concrete stilts over dark cooling basins, skybridge handrails
 * & trusses via volumetric cableBatch, marked soccer pitch, pylons & catenary wires.
 */
export function orlando(): THREE.Group {
  const g = orlandoBase();
  const pal = ['#b85e50', '#be8655', '#c9a54b', '#458f96', '#6a7478', '#a4a798'];

  const towerRims = new THREE.Group();
  const concrete = MStone('#a4a798', 0.86);
  const basinMat = MWater('#263438', 0.14, 0.25);
  let tower = 0;
  g.traverse((o) => {
    if (
      o instanceof THREE.Mesh &&
      o.geometry instanceof THREE.LatheGeometry &&
      o.material instanceof THREE.MeshStandardMaterial
    ) {
      const profile: THREE.Vector2[] = [];
      for (let i = 0; i <= 32; i++) {
        const u = i / 32;
        const flare =
          u < 0.5 ? 1.85 * Math.pow(1 - 2 * u, 1.8) : 1.3 * Math.pow(2 * u - 1, 1.8);
        profile.push(new THREE.Vector2(0.95 + flare, u * 6.4));
      }
      o.geometry = new THREE.LatheGeometry(profile, 72);
      o.position.y = 0.72;
      o.scale.setScalar(0.85);
      o.material = new THREE.MeshStandardMaterial({
        map: coolingTowerMural(tower++),
        roughness: 0.78,
        ...surfaceDetail('plaster', 0.015),
        side: THREE.DoubleSide,
      });

      // Waist & lip concrete compression rims calibrated to scale 0.85 & base y=0.72
      add(
        towerRims,
        new THREE.TorusGeometry(0.81, 0.035, 6, 40).rotateX(Math.PI / 2),
        concrete,
        o.position.x,
        3.44,
        0
      );
      add(
        towerRims,
        new THREE.TorusGeometry(1.91, 0.045, 6, 48).rotateX(Math.PI / 2),
        concrete,
        o.position.x,
        6.16,
        0
      );

      // Dark water-catchment cooling basin + 28 diagonal V-strut concrete stilts
      add(g, C(2.42, 2.42, 0.07, 40), basinMat, o.position.x, 0.22, 0);
      add(
        g,
        new THREE.TorusGeometry(2.44, 0.055, 6, 40).rotateX(Math.PI / 2),
        concrete,
        o.position.x,
        0.24,
        0
      );
      const strutSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
      for (let k = 0; k < 14; k++) {
        const a0 = (k / 14) * Math.PI * 2;
        const a1 = ((k + 0.5) / 14) * Math.PI * 2;
        const a2 = ((k + 1) / 14) * Math.PI * 2;
        const rBot = 2.34;
        const rTop = 2.34;
        strutSegs.push([
          [o.position.x + rBot * Math.cos(a0), 0.22, rBot * Math.sin(a0)],
          [o.position.x + rTop * Math.cos(a1), 0.74, rTop * Math.sin(a1)],
        ]);
        strutSegs.push([
          [o.position.x + rBot * Math.cos(a2), 0.22, rBot * Math.sin(a2)],
          [o.position.x + rTop * Math.cos(a1), 0.74, rTop * Math.sin(a1)],
        ]);
      }
      cableBatch(g, strutSegs, 0.042, concrete);
    }
  });
  g.add(mergeByMaterial(towerRims));

  // Sky platform with volumetric steel handrails, underside truss & tower-rim hangers (ZERO lines()!)
  const deckY = 5.02;
  const railMat = M('#e8ecef', 0.45, 0.65);
  const steelMat = M('#666b74', 0.45, 0.72);
  const darkSteel = M('#32363d', 0.45, 0.75);
  add(g, CB(2.6, 0.09, 0.66, 0.015), M('#3d444e', 0.55, 0.5), 0, deckY, 0);
  add(g, CB(2.6, 0.05, 0.72, 0.012), M('#d8d4ca', 0.85), 0, deckY + 0.07, 0);
  const railSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
  [-0.33, 0.33].forEach((z) => {
    railSegs.push([[-1.25, deckY + 0.42, z], [1.25, deckY + 0.42, z]]);
    for (let i = 0; i <= 6; i++) {
      const x = -1.25 + i * (2.5 / 6);
      railSegs.push([[x, deckY + 0.1, z], [x, deckY + 0.42, z]]);
    }
  });
  cableBatch(g, railSegs, 0.016, railMat);
  const trussSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
  for (let i = 0; i < 6; i++) {
    const x = -1.2 + i * 0.4;
    trussSegs.push([[x, deckY - 0.05, 0], [x + 0.4, deckY - 0.26, 0]]);
    trussSegs.push([[x + 0.4, deckY - 0.26, 0], [x + 0.8, deckY - 0.05, 0]]);
  }
  cableBatch(g, trussSegs, 0.018, steelMat);
  cableBatch(
    g,
    [
      [[-1.18, deckY + 0.12, 0], [-0.52, 6.12, 0]],
      [[1.18, deckY + 0.12, 0], [0.52, 6.12, 0]],
    ],
    0.022,
    darkSteel
  );

  // Dense instanced Soweto township homes
  const houseT: InstanceTransform[] = [];
  const roofT: InstanceTransform[] = [];
  for (let ix = -4; ix <= 4; ix++) {
    for (let iz = -4; iz <= 4; iz++) {
      const x = ix * 1.45 + (R(ix * 9 + iz + 40) - 0.5) * 0.22;
      const z = iz * 1.45 + (R(ix * 3 + iz * 7 + 40) - 0.5) * 0.22;
      const rad = Math.hypot(x, z);
      if (rad > 6.9 || (rad > 4.35 && rad < 5.35)) continue;
      if (Math.hypot(x + 2.4, z) < 2.25 || Math.hypot(x - 2.4, z) < 2.25) continue;
      if (Math.abs(x) < 2.0 && z > 2.6) continue;
      const ry = (R(ix * 5 + iz * 11 + 40) - 0.5) * 0.5;
      houseT.push({ x, y: 0.44, z, ry });
      roofT.push({ x, y: 0.66, z, ry });
    }
  }
  instancedMeshes(g, CB(0.66, 0.42, 0.5, 0.02), MPlaster('#ddd9cb', 0.8), houseT, pal);
  instancedMeshes(g, gableRoofGeo(0.68, 0.52, 0.16, 0.03), M('#6a7478', 0.5, 0.5), roofT, [
    '#6a7478',
    '#b85e50',
    '#458f96',
    '#c8b48a',
  ]);

  // Soccer pitch with flat painted line strips, center circle torus & goals
  const pz = 3.5;
  const hw = 1.8;
  const hd = 1.1;
  const chalk = MPlaster('#f4f4f2', 0.82);
  add(g, CB(hw * 2 + 0.16, 0.03, hd * 2 + 0.16, 0.01), M('#4f7a3c', 0.95), 0, 0.225, pz);
  const yL = 0.244;
  add(g, CB(hw * 2, 0.01, 0.04, 0.002), chalk, 0, yL, pz - hd);
  add(g, CB(hw * 2, 0.01, 0.04, 0.002), chalk, 0, yL, pz + hd);
  add(g, CB(0.04, 0.01, hd * 2, 0.002), chalk, -hw, yL, pz);
  add(g, CB(0.04, 0.01, hd * 2, 0.002), chalk, hw, yL, pz);
  add(g, CB(0.04, 0.01, hd * 2, 0.002), chalk, 0, yL, pz);
  add(
    g,
    new THREE.TorusGeometry(0.42, 0.016, 6, 28).rotateX(Math.PI / 2),
    chalk,
    0,
    yL + 0.005,
    pz
  );
  for (const gx of [-hw + 0.04, hw - 0.04]) {
    add(g, CB(0.05, 0.16, 0.42, 0.008), chalk, gx, yL + 0.08, pz);
  }
  const orlandoLamps: StreetLampSpec[] = [
    { x: -hw - 0.16, y: 0.22, z: pz - hd - 0.12, kind: 'flood', ry: -0.78, scale: 0.92, color: '#e6f4ff' },
    { x: hw + 0.16, y: 0.22, z: pz - hd - 0.12, kind: 'flood', ry: -2.35, scale: 0.92, color: '#e6f4ff' },
    { x: -hw - 0.16, y: 0.22, z: pz + hd + 0.12, kind: 'flood', ry: 0.78, scale: 0.92, color: '#e6f4ff' },
    { x: hw + 0.16, y: 0.22, z: pz + hd + 0.12, kind: 'flood', ry: 2.35, scale: 0.92, color: '#e6f4ff' },
    { x: -2.4, y: 0.22, z: 1.55, kind: 'uplight', scale: 1.05, color: '#ffae48', coneHeight: 2.15 },
    { x: 2.4, y: 0.22, z: 1.55, kind: 'uplight', scale: 1.05, color: '#ff8a4c', coneHeight: 2.15 },
    { x: -2.4, y: 0.22, z: -1.55, kind: 'uplight', scale: 1.05, color: '#ffae48', coneHeight: 2.15 },
    { x: 2.4, y: 0.22, z: -1.55, kind: 'uplight', scale: 1.05, color: '#ff8a4c', coneHeight: 2.15 },
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.32;
    if (Math.abs(Math.cos(a) * 4.55) < 2.2 && Math.sin(a) > 0.35) continue;
    orlandoLamps.push({
      x: Math.cos(a) * 4.46,
      y: 0.2,
      z: Math.sin(a) * 4.46,
      kind: 'cobra',
      ry: -a,
      scale: 0.85,
      color: '#ffa03c',
      poolRadius: 1.16,
    });
  }
  addStreetLampSet(g, orlandoLamps);

  // Subtle red aviation lip beacons atop both cooling towers & glowing skybridge deck marker
  const beaconMat = G('#ff4a3d', 1.4);
  for (const tx of [-2.4, 2.4]) {
    for (const ang of [0, Math.PI * 0.67, Math.PI * 1.33]) {
      add(
        g,
        new THREE.SphereGeometry(0.06, 8, 6),
        beaconMat,
        tx + Math.cos(ang) * 1.91,
        6.2,
        Math.sin(ang) * 1.91
      );
    }
  }

  // Lattice electricity pylons + gravity-sagged overhead power wires (ZERO lines()!)
  const pylonSegs: Array<readonly [[number, number, number], [number, number, number]]> = [];
  const pylons: Array<[number, number, number]> = [
    [-6.2, 2.6, 2.9],
    [5.8, 3.4, 2.7],
    [-5.4, -4.6, 2.5],
  ];
  for (const [x, z, h] of pylons) {
    [-0.28, 0.28].forEach((s) => pylonSegs.push([[x + s, 0.2, z], [x + s * 0.2, h, z]]));
    for (let i = 0; i < 5; i++) {
      const ya = 0.2 + (h - 0.2) * (i / 5);
      const yb = 0.2 + (h - 0.2) * ((i + 1) / 5);
      const wa = 0.28 * (1 - i / 5) + 0.05;
      const wb = 0.28 * (1 - (i + 1) / 5) + 0.05;
      pylonSegs.push([[x - wa, ya, z], [x + wb, yb, z]]);
      pylonSegs.push([[x + wa, ya, z], [x - wb, yb, z]]);
      pylonSegs.push([[x - wa, ya, z], [x + wa, ya, z]]);
    }
    pylonSegs.push([[x - 0.7, h - 0.2, z], [x + 0.7, h - 0.2, z]]);
    pylonSegs.push([[x - 0.45, h - 0.55, z], [x + 0.45, h - 0.55, z]]);
  }
  cableBatch(g, pylonSegs, 0.018, steelMat);
  catenaryTube(g, [-6.2, 2.7, 2.6], [5.8, 2.5, 3.4], 0.45, 0.012, darkSteel, 18, 6);
  catenaryTube(g, [-6.2, 2.35, 2.6], [5.8, 2.15, 3.4], 0.45, 0.012, darkSteel, 18, 6);

  [
    [-3.6, 0.23, -3.4, 0.5],
    [3.7, 0.23, -2.6, -0.7],
    [0.2, 0.23, -4.4, 1.2],
  ].forEach(([x, y, z, ry]) => {
    const c = car('#e2ded2', 0.42);
    c.position.set(x, y, z);
    c.rotation.y = ry;
    g.add(c);
  });
  const stones: InstanceTransform[] = [];
  for (let i = 0; i < 24; i++) {
    const a = R(i + 11) * 6.28;
    const r = 1.2 + R(i + 21) * 5.6;
    stones.push({ x: r * Math.cos(a), y: 0.22, z: r * Math.sin(a), sx: 0.5, sy: 0.4, sz: 0.6 });
  }
  scatterRocks(g, stones, '#8a8272', '#b0a68e');

  const baseTick = g.userData.tick as (t: number) => void;
  const dust = drift(g, 45, '#b09a58', 0.07, (i, t) => [
    Math.sin(i * 2.3 + t * 0.08) * (1 + R(i) * 5.5),
    0.35 + ((R(i + 3) * 2 + t * 0.15) % 2.2),
    Math.cos(i * 1.9 + t * 0.06) * (1 + R(i + 5) * 5.5),
  ], 0.5);
  g.userData.tick = (t: number) => {
    baseTick(t);
    dust(t);
    const pulse = 0.72 + 0.28 * Math.sin(t * 2.6);
    beaconMat.emissiveIntensity = 1.4 * pulse;
  };
  return g;
}

const RAW_BUILDERS: Record<string, () => THREE.Group> = {
  'Table Mountain': table,
  'Union Buildings': union,
  'Moses Mabhida Stadium': stadium,
  'Nelson Mandela Bridge': bridge,
  'The Big Hole': hole,
  'Voortrekker Monument': voortrekker,
  'Cape Point Lighthouse': capePoint,
  'Bo-Kaap': bokaap,
  'FNB Stadium (Soccer City)': soccer,
  'Three Rondavels': rondavels,
  Baobab: baobab,
  'Hole in the Wall': holewall,
  'Castle of Good Hope': castle,
  'Drakensberg Amphitheatre': amphi,
  'Palace of the Lost City': palace,
  'Golden Gate Highlands': golden,
  'Kruger National Park': kruger,
  'Ponte City': ponte,
  'Boulders Beach': boulders,
  'Cape Agulhas Lighthouse': agulhas,
  'Orlando Towers': orlando,
  'Bourke’s Luck Potholes': bourke,
  'Augrabies Falls': augrabies,
  'SALT Telescope': salt,
  'Bloukrans Bridge': bloukrans,
  'Pilanesberg Crater': pilanesberg,
  'Robben Island': robben,
  'Chapman’s Peak Drive': chapman,
  Isandlwana: isandlwana,
  'Gariep Dam': gariep,
  'Cradle of Humankind': maropeng,
  'Mapungubwe Hill': mapungubwe,
  'Kgalagadi Red Dunes': kgalagadi,
  'Storms River Mouth': storms,
  'Groot Constantia': groot,
  'Hermanus Whale Watching': hermanus,
  'iSimangaliso Wetland Park': isimangaliso,
  'Sani Pass': sani,
  Richtersveld: richtersveld,
  'Vredefort Dome': vredefort,
  'Hartbeespoort Dam': harties,
  'Knysna Heads': knysna,
  'Donkin Reserve': donkin,
};

/**
 * Every landmark is wrapped with the shared diorama upgrade so the crafted
 * rim, biome cover, micro-weather, batched foliage and audio profile are
 * applied consistently without touching each individual builder.
 */
export const LANDMARK_BUILDERS: Record<string, () => THREE.Group> = {};
for (const key of Object.keys(RAW_BUILDERS)) {
  const build = RAW_BUILDERS[key];
  LANDMARK_BUILDERS[key] = () => applyDioramaUpgrade(key, build());
}
