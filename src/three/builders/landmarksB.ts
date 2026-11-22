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
  capeDutchGableGeo,
  car,
  CB,
  colonialHouse,
  drift,
  G,
  gableRoofGeo,
  gondola,
  grassTufts,
  instancedMeshes,
  lines,
  M,
  Mc,
  mergeByMaterial,
  MCascade,
  MPlaster,
  MStone,
  MT,
  MWater,
  MWet,
  MWood,
  R,
  railing,
  rock,
  scatterRocks,
  sea,
  seaRings,
  swayItems,
  surfaceDetail,
  tint,
  tree,
  weatherVertexColors,
  type InstanceTransform,
} from './primitives';
import { applyDioramaUpgrade, corniceBand, doorSurround, facadeWindow } from './dioramaKit';

export function augrabies(): THREE.Group {
  const g = new THREE.Group();
  const wm = MCascade('#e6f6ff', 0.88);
  const cm = MT('#f6fbff', 0.58, 0.98, 0, false);
  const graniteA = '#796b60';
  const graniteB = '#b88a65';
  add(g, B(15.2, 0.2, 15.2), MStone('#796b60', 0.94), 0, 0.1, 0);
  add(g, C(2.75, 2.75, 0.06, 48), MWater('#7e8a7d', 0.09, 0.25), 0, 0.22, 0);

  // Two staggered tiers of jagged red-orange granite form a deep gorge. The
  // gap at the back is where the Orange River drops through the walls.
  for (let i = 0; i < 11; i++) {
    if (i === 4) continue;
    const a = Math.PI + 0.3 + i * 0.28;
    const back = i % 2 === 0;
    const rad = back ? 5.3 : 4.15;
    rock(
      g,
      0.85 + R(i) * 0.5,
      1.2 + R(i + 3) * 0.45,
      (back ? 4.4 : 3.0) + R(i + 5) * 1.9,
      rad * Math.cos(a),
      rad * Math.sin(a),
      graniteA,
      graniteB,
      0.2
    );
  }
  [-1, 1].forEach((s) =>
    rock(g, 1.0, 1.5, 2.2 + R(s + 7) * 1.2, s * 3.1, 3.0, graniteA, graniteB, 0.22)
  );
  rock(g, 1.3, 1.7, 4.2, 0, -5.6, graniteA, graniteB, 0.16);

  // Multi-tier waterfall: a broad main chute flanked by two narrower braids,
  // with a broken white lip where the water crests the upper ledge.
  add(g, CB(1.35, 5.0, 0.14, 0.03), wm, 0.1, 2.85, -4.15);
  add(g, CB(0.22, 2.6, 0.07, 0.02), wm, -0.82, 1.65, -3.9);
  add(g, CB(0.18, 2.2, 0.06, 0.02), wm, 0.86, 1.35, -3.85);
  add(g, new THREE.SphereGeometry(0.42, 14, 10), cm, 0.1, 5.3, -4.15).scale.set(1.5, 0.35, 0.7);

  // Darker wet-rock aprons directly beneath each chute. Constantly wetted
  // granite reads almost black and gives the falls a grounded plunge point.
  const wetRock = MStone('#4a4038', 0.72, 0.02);
  ([
    [0.1, -4.15, 1.5],
    [-0.82, -3.9, 0.7],
    [0.86, -3.85, 0.6],
  ] as const).forEach(([wx, wz, wr]) => {
    add(g, C(wr, wr * 1.12, 0.05, 32), wetRock, wx, 0.235, wz).scale.z = 0.72;
  });

  // Turquoise river winding out of the plunge pool toward the front rim.
  const riverPts = [
    new THREE.Vector3(0.1, 0, -3.2),
    new THREE.Vector3(-0.35, 0, -1.4),
    new THREE.Vector3(0.4, 0, 0.6),
    new THREE.Vector3(0.1, 0, 2.8),
    new THREE.Vector3(0.85, 0, 5.4),
  ];
  const riverGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(riverPts), 64, 0.62, 10);
  riverGeo.scale(1, 0.16, 1);
  add(g, riverGeo, MWater('#7e8a7d', 0.08, 0.22), 0, 0.26, 0);
  const riverCurve = new THREE.CatmullRomCurve3(
    riverPts.map((p) => p.clone().setY(0.3))
  );

  // Churning foam at the plunge pool and swirling flecks along the river.
  const ms = Array.from({ length: 9 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.5 + R(i) * 0.25, 12, 10),
      cm,
      (R(i) - 0.5) * 1.7,
      0.45 + R(i + 3) * 0.45,
      -3.35 + R(i + 5) * 0.7
    );
    o.scale.y = 0.45;
    o.userData.x = o.position.x;
    return o;
  });
  const wf = drift(g, 130, '#eaf6ff', 0.1, (i, t) => {
    const u = (t * 0.9 + R(i)) % 1;
    return [
      (R(i + 3) - 0.5) * 0.95,
      5.2 - u * 4.9,
      -4.1 + (R(i + 4) - 0.5) * 0.25 + u * 0.3,
    ];
  });
  const plume = drift(g, 55, '#eaf8ff', 0.14, (i, t) => {
    const u = (t * 0.45 + R(i)) % 1;
    const sp = 0.25 + u * 1.1;
    return [(R(i + 3) - 0.5) * sp, 0.35 + u * 2.4, -3.3 + (R(i + 5) - 0.5) * sp];
  }, 0.5);
  const foam = drift(g, 60, '#eafaff', 0.09, (i, t) => {
    const u = (t * 0.1 + R(i)) % 1;
    const p = riverCurve.getPointAt(u);
    const a = R(i + 3) * 6.28 + t;
    const rr = R(i + 5) * 0.45;
    return [p.x + Math.cos(a) * rr, 0.31, p.z + Math.sin(a) * rr];
  }, 0.7);

  // Quiver trees: bare forked trunks topped with golden flower clusters, all
  // batched into three instanced draws.
  const qTrunkT: InstanceTransform[] = [];
  const qBranchT: InstanceTransform[] = [];
  const qFlowerT: InstanceTransform[] = [];
  (
    [
      [-5.6, -1.6, 1.0], [-6.4, -3.2, 1.2], [5.5, -2.4, 1.1], [6.4, -0.6, 0.9],
      [-5.0, 3.4, 0.9], [5.4, 3.0, 1.0], [-2.4, -5.2, 1.1], [2.6, -5.0, 0.95],
    ] as const
  ).forEach(([x, z, s], i) => {
    const th = 1.35 * s;
    const topY = 0.2 + th;
    qTrunkT.push({ x, y: 0.2 + th / 2, z, sy: th });
    for (let b = 0; b < 3; b++) {
      const a = b * (6.28 / 3) + R(i) * 2;
      const tilt = 0.38 + R(i * 3 + b) * 0.16;
      const dx = Math.cos(a) * Math.sin(tilt);
      const dz = Math.sin(a) * Math.sin(tilt);
      const dy = Math.cos(tilt);
      const len = 0.8 * s;
      qBranchT.push({
        x: x + dx * len * 0.5,
        y: topY + dy * len * 0.5,
        z: z + dz * len * 0.5,
        sy: len,
        rx: dz,
        rz: -dx,
      });
      qFlowerT.push({ x: x + dx * len, y: topY + dy * len, z: z + dz * len, sx: s, sy: s, sz: s });
    }
  });
  instancedMeshes(g, C(0.055, 0.1, 1, 7), MWood('#bda474', 0.94), qTrunkT);
  instancedMeshes(g, C(0.032, 0.055, 1, 6), MWood('#bda474', 0.94), qBranchT);
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.13, 1), Mc('#c5a447'), qFlowerT, [
    '#c5a447',
    '#d4b45c',
    '#a8893c',
  ]);

  // Two little timber footbridges with rope handrails across the river.
  const plank = MWood('#9b7a54', 0.9);
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
    add(br, CB(1.9, 0.06, 0.46, 0.02), plank, 0, 0.46, 0);
    [-0.85, 0.85].forEach((px) => add(br, C(0.035, 0.045, 0.5, 8), plank, px, 0.7, 0));
    const rv: number[] = [];
    [-0.18, 0.18].forEach((rz) => rv.push(-0.85, 0.92, rz, 0.85, 0.92, rz));
    br.add(lines(rv, '#c9a878'));
  });

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
  const wh = M('#d4d5ce', 0.32, 0.48);
  const dk = M('#242730', 0.5, 0.55);
  const mir = M('#819eaa', 0.14, 0.85);
  add(g, B(15.2, 0.2, 15.2), MStone('#a88462', 0.96), 0, 0.1, 0);
  add(g, C(2.2, 2.4, 0.5, 48), MStone('#d4d5ce', 0.82), 0, 0.45, 0);

  const en = new THREE.Group();
  en.position.y = 0.7;
  g.add(en);
  add(en, C(1.4, 1.5, 2.6, 48), wh, 0, 1.3, 0);
  add(en, C(0.35, 1.4, 1.1, 48), wh, 0, 3.15, 0);
  // Geodesic rib bands + open tracker shutter revealing hexagonal primary mirror glint
  for (let i = 0; i < 6; i++) {
    add(
      en,
      new THREE.TorusGeometry(1.46, 0.025, 6, 32).rotateX(Math.PI / 2),
      M('#aebfc4', 0.3, 0.7),
      0,
      0.35 + i * 0.42,
      0
    );
  }
  add(en, CB(0.54, 1.5, 0.14, 0.02), dk, 0, 2.4, 1.42);
  add(en, C(0.22, 0.22, 0.04, 6).rotateX(Math.PI / 2), mir, 0, 2.25, 1.48);
  add(en, C(0.3, 0.3, 0.4, 16), M('#b23a2c', 0.45), 0, 3.9, 0);
  add(en, new THREE.SphereGeometry(0.08, 10, 8), G('#ff4a3a', 2.0), 0, 4.18, 0);

  // SALT's centre-of-curvature alignment sensor sits in a tall, narrow tower —
  // the dome-plus-tower pairing is its distinguishing silhouette.
  add(g, C(0.28, 0.36, 4.6, 16), wh, -4.4, 2.55, -1.2);
  add(g, C(0.42, 0.42, 0.12, 16), dk, -4.4, 4.93, -1.2);
  add(g, new THREE.SphereGeometry(0.18, 12, 8), M('#819eaa', 0.28, 0.8), -4.4, 5.1, -1.2);

  [
    [-3.4, 2.2],
    [3.5, 1.4],
    [-2.6, -3.2],
  ].forEach(([x, z]) => {
    add(g, C(0.5, 0.55, 0.5, 24), wh, x, 0.45, z);
    add(g, new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), wh, x, 0.7, z);
  });
  // Observatory operations building with pitched roof
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
  // Batched Karoo renosterbos scrub (40 -> 1 draw call!)
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
  add(g, B(15.2, 0.2, 15.2), MStone('#596f53', 0.95), 0, 0.1, 0);
  add(g, CB(1.85, 0.08, 12, 0.02), MWater('#72968c', 0.09, 0.25), 0, 0.24, 0);
  [-5.2, 5.2].forEach((x) => {
    rock(g, 1.9, 2.4, 4.6, x, 0, '#596f53', '#7d8b5f', 0.11);
    rock(g, 1.5, 2, 3.8, x * 1.05, -3.8, '#596f53', '#7d8b5f', 0.11);
    rock(g, 1.5, 2, 3.4, x * 1.05, 3.8, '#596f53', '#7d8b5f', 0.11);
  });

  // Twin parallel parabolic concrete arch ribs + spandrel piers
  [-0.26, 0.26].forEach((zOff) => {
    const pt: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const x = -3 + i * 0.25;
      pt.push(V(x, 2.4 + 1.5 * (1 - (x / 3) ** 2), zOff));
    }
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pt), 48, 0.15, 8), cn);
  });
  for (let i = -2; i <= 2; i++) {
    const x = i * 1.2;
    const y = 2.4 + 1.5 * (1 - (x / 3) ** 2);
    [-0.26, 0.26].forEach((zOff) => add(g, C(0.08, 0.1, 4.6 - y, 8), cn, x, (y + 4.6) / 2, zOff));
  }
  add(g, CB(11, 0.2, 0.92, 0.03), roadMat, 0, 4.7, 0);
  [-0.4, 0.4].forEach((z) =>
    add(g, CB(11, 0.22, 0.05, 0.01), M('#858d86', 0.42, 0.65), 0, 4.92, z)
  );
  for (let i = 0; i < 8; i++) {
    tree(g, (i % 2 ? 5.2 : -5.2) + (R(i) - 0.5) * 1.2, (R(i + 5) - 0.5) * 2.4, 1.1, 1, 4.6);
  }
  const jp = add(g, new THREE.SphereGeometry(0.1, 10, 8), M('#b23a2c', 0.4), 0, 4.6, 0);
  const cd = add(g, B(0.02, 1, 0.02), M('#222'), 0, 4.6, 0);
  const bd = birds(g, 3, 4, 7);
  const cr = [0, 1, 2, 3].map((i) => {
    const c = car(['#c33', '#fff', '#36c', '#222'][i], 0.5);
    c.position.set(0, 4.82, i % 2 ? 0.2 : -0.2);
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
    const y = 4.5 - 4 * Math.abs(Math.sin(t * 0.9));
    jp.position.y = y;
    cd.scale.y = 4.5 - y + 0.01;
    cd.position.y = (4.5 + y) / 2;
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
    [0.01, 0],
    [2, 0.05],
    [3.4, 0.4],
    [4.4, 1.6],
    [5, 2.3],
    [5.6, 1.5],
    [6.4, 0.5],
    [7.6, 0.1],
  ].map((p) => new THREE.Vector2(...p));
  const ge = new THREE.LatheGeometry(pr, 112);
  const p = ge.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const a = Math.atan2(Z, X);
    p.setY(i, Y * (1 + 0.3 * Math.sin(a * 3) + 0.15 * Math.sin(a * 7 + 1)));
  }
  const lo = new THREE.Color('#7a8059');
  const hi = new THREE.Color('#a27c61');
  const mid = new THREE.Color('#647354');
  const granite = tint(ge, (k, _X, Y, Z) =>
    Y < 0.6
      ? k.copy(lo).lerp(mid, Y / 0.6)
      : k
          .copy(mid)
          .lerp(hi, Math.min(1, (Y - 0.6) / 1.8))
          .multiplyScalar(0.9 + 0.1 * Math.sin(Y * 30 + Math.atan2(Z, _X) * 5))
  );
  weatherVertexColors(granite, { ao: 0.26, exposure: 0.08, grain: 0.06 });
  add(
    g,
    new THREE.TorusGeometry(6.4, 0.5, 6, 60, Math.PI * 1.45).rotateX(Math.PI / 2),
    MStone('#a27c61', 0.94),
    0,
    0.18,
    0
  );
  add(
    g,
    new THREE.TorusGeometry(4.4, 0.35, 6, 48, Math.PI * 1.2).rotateX(Math.PI / 2),
    MStone('#7a8059', 0.94),
    0,
    0.3,
    0
  );
  add(
    g,
    granite,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      ...surfaceDetail('stone', 0.028),
      side: THREE.DoubleSide,
    })
  );
  add(
    g,
    new THREE.CircleGeometry(1.5, 48).rotateX(-Math.PI / 2),
    MWater('#748f8b', 0.1, 0.25),
    0,
    0.09,
    0
  );
  const an = Array.from({ length: 9 }, (_, i) => {
    const o = animal(i % 3 ? '#777664' : '#8a7f6a');
    g.add(o);
    return o;
  });
  for (let i = 0; i < 14; i++) {
    const q = i * 0.45;
    tree(g, 2.8 * Math.cos(q), 2.8 * Math.sin(q), 0.72, 2, 0.25);
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
  const wh = MPlaster('#d5d4c7', 0.72);
  const st = MStone('#aa987a', 0.85);
  const dk = M('#2b2d34', 0.48, 0.55);
  const rf = MPlaster('#9a8b70', 0.78);
  const fortMat = MStone('#aa987a', 0.9);
  sea(g, '#6c929c', '#8fa9a8');
  add(g, C(4, 4.4, 0.3, 64), MStone('#c3bba3', 0.95), -0.3, 0.15, 0.2);
  // Pale rectangular quarry cut into the flat limestone surface. The darker
  // apron reads as the excavated edge rather than a raised patch.
  add(g, CB(2.1, 0.03, 1.42, 0.01), MStone('#8f8974', 0.96), 1.55, 0.3, 1.5);
  add(g, CB(1.9, 0.035, 1.22, 0.01), MStone('#e9e4d3', 0.97), 1.55, 0.325, 1.5);
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

  // 1865 Robben Island Lighthouse + rotating beam
  add(g, C(0.18, 0.28, 1.6, 24), wh, -2.2, 1.1, 0.4);
  add(g, C(0.3, 0.3, 0.08, 24), dk, -2.2, 1.94, 0.4);
  // Open lantern gallery: pale deck, twelve posts and a continuous rail ring.
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
  add(g, C(0.17, 0.17, 0.3, 16), M('#a35c4c', 0.7), -2.2, 2.13, 0.4);
  add(g, C(0.1, 0.1, 0.24, 12), G('#fff3b0', 2.5), -2.2, 2.13, 0.28);
  add(g, CB(0.035, 1.6, 0.01, 0.002), M('#606862', 0.9), -2.2, 1.1, 0.62);
  add(g, new THREE.ConeGeometry(0.24, 0.25, 16), dk, -2.2, 2.4, 0.4);
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

  // Maximum Security Prison: four H-blocks and a U-shaped isolation block,
  // enclosed by high walls, double fencing and five watchtowers — not a star fort.
  const fcx = 1.0;
  const hBlocks: Array<[number, number, number]> = [
    [0.2, -1.0, 1.5], [1.9, -1.0, 1.5], [0.2, 0.7, 1.5], [1.9, 0.7, 1.5],
  ];
  hBlocks.forEach(([bx, bz, len]) => {
    add(g, CB(len, 0.32, 0.3, 0.02), fortMat, bx, 0.47, bz);
    add(g, CB(len, 0.03, 0.42, 0.01), rf, bx, 0.65, bz);
  });
  add(g, CB(1.7, 0.32, 0.3, 0.02), fortMat, fcx + 0.9, 0.47, -2.1);
  [-0.6, 0.8, 2.2].forEach((bx) => {
    add(g, CB(0.2, 0.2, 0.2, 0.02), st, bx, 0.93, -2.3);
    add(g, C(0.03, 0.03, 0.9, 6), dk, bx + 0.1, 1.4, -2.3);
  });
  add(g, CB(3.8, 0.04, 0.04, 0.008), dk, fcx + 0.9, 0.75, 1.55);
  add(g, CB(3.8, 0.04, 0.04, 0.008), dk, fcx + 0.9, 0.6, 1.55);
  add(g, C(1.05, 1.05, 0.03, 24), MStone('#ded3b6', 0.95), fcx + 0.9, 0.32, -0.3);

  // Prison cell block, watchtower & pitched-roof guard room inside the fort
  add(g, CB(1.8, 0.3, 0.42, 0.02), st, 1, 0.47, -0.8);
  add(g, gableRoofGeo(1.8, 0.44, 0.2, 0.06), rf, 1, 0.62, -0.8);
  add(g, C(0.1, 0.12, 0.8, 8), st, 2.2, 0.7, 0.3);
  add(g, CB(0.28, 0.2, 0.28, 0.02), dk, 2.2, 1.2, 0.3);
  add(g, CB(0.78, 0.42, 0.52, 0.025), wh, -1.2, 0.51, 1.6);
  add(g, new THREE.ConeGeometry(0.5, 0.28, 4), rf, -1.2, 0.86, 1.6).rotation.y = Math.PI / 4;
  // Two facade-kit details on the keeper's house, collapsed into one batch.
  const keeperDetail = new THREE.Group();
  keeperDetail.position.set(-1.2, 0.51, 1.6);
  doorSurround(keeperDetail, {
    x: 0.18,
    y: -0.02,
    z: 0.27,
    width: 0.2,
    height: 0.3,
    depth: 0.08,
  });
  facadeWindow(keeperDetail, {
    x: -0.19,
    y: 0.02,
    z: 0.27,
    width: 0.16,
    height: 0.18,
    depth: 0.07,
  });
  g.add(mergeByMaterial(keeperDetail));
  // Courtyard well and stacked crates
  add(g, C(0.17, 0.2, 0.18, 12), st, 0.55, 0.42, -0.15);
  add(g, new THREE.TorusGeometry(0.17, 0.03, 6, 12).rotateX(Math.PI / 2), dk, 0.55, 0.52, -0.15);
  [[1.6, 0.1], [1.6, 0.32]].forEach(([x, z]) =>
    add(g, CB(0.2, 0.16, 0.18, 0.01), MWood('#8a6b47', 0.92), x, 0.41, z)
  );

  // Rough wet boulders around the shoreline and a few lying offshore.
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

  // Timber jetty running from the eastern shore out into the small harbour.
  const jetty = MWood('#8a6b47', 0.9);
  for (let i = 0; i < 12; i++) {
    const u = i / 11;
    const x = 3.2 + u * 2.3;
    const z = 1.6 + u * 0.55;
    add(g, CB(0.34, 0.05, 0.62, 0.01), jetty, x, 0.34, z).rotation.y = -0.24;
    if (i % 3 === 0) {
      add(g, C(0.05, 0.06, 0.45, 8), jetty, x - 0.22, 0.23, z);
      add(g, C(0.05, 0.06, 0.45, 8), jetty, x + 0.22, 0.23, z);
    }
  }

  // Batched island coastal fynbos, with a taller cluster behind the fort.
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 30; i++) {
    const a = R(i) * 6.28;
    const r = 1.2 + R(i + 4) * 2.5;
    bushT.push({
      x: -0.3 + r * Math.cos(a),
      y: 0.35,
      z: 0.2 + r * Math.sin(a),
      sx: 0.45,
      sy: 0.28,
      sz: 0.45,
    });
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
  instancedMeshes(g, new THREE.ConeGeometry(0.14, 0.5, 5), Mc('#6e7f5e'), tallT, [
    '#6e7f5e',
    '#8a8a6a',
  ]);

  // Soft cloud puffs above the island.
  const cloudMat = M('#ffffff', 0.92, 0);
  const clouds: THREE.Group[] = [];
  (
    [
      [-4.5, 5.2, -3.5, 0.8],
      [4.0, 5.6, -4.0, 0.95],
    ] as const
  ).forEach(([x, y, z, s], ci) => {
    const cluster = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(s * (0.42 + R(ci * 7 + j) * 0.24), 1),
        cloudMat
      );
      puff.position.set(
        (R(ci * 11 + j) - 0.5) * s * 1.7,
        (R(ci * 13 + j) - 0.5) * s * 0.55,
        (R(ci * 17 + j) - 0.5) * s * 0.9
      );
      cluster.add(puff);
    }
    cluster.position.set(x, y, z);
    cluster.userData.baseX = x;
    clouds.push(cluster);
    g.add(cluster);
  });

  // Boats moored beside the jetty, bobbing gently at their berths.
  const bt = boat('#3d6fa8', 1.0);
  const bt2 = boat('#c8a24a', 0.7);
  g.add(bt, bt2);
  const sr = seaRings(g, 0.13, 3.6, 4);
  const surf = drift(g, 90, '#eafaff', 0.11, (i, t) => {
    const a = R(i) * 6.28;
    const k = (t * 0.25 + R(i + 3)) % 1;
    const rr = 3.7 + k * 0.7;
    return [-0.3 + rr * Math.cos(a), 0.14 + Math.sin(k * Math.PI) * 0.12, 0.2 + rr * Math.sin(a) * 1.1];
  }, 0.7);
  const bd = birds(g, 4, 3.5, 5);
  g.userData.tick = (t: number) => {
    bm.rotation.y = t * 1.1;
    bt.position.set(5.7, 0.1 + Math.sin(t * 1.2) * 0.03, 2.3);
    bt.rotation.y = -0.24 + Math.sin(t * 0.6) * 0.06;
    bt2.position.set(4.6, 0.1 + Math.sin(t * 1.0 + 1) * 0.03, 3.2);
    bt2.rotation.y = -0.5 + Math.sin(t * 0.5) * 0.05;
    sr(t);
    surf(t);
    bd(t);
    clouds.forEach((c, i) => {
      c.position.x = (c.userData.baseX as number) + Math.sin(t * 0.16 + i) * 0.28;
    });
  };
  return g;
}

export function chapman(): THREE.Group {
  const g = new THREE.Group();
  sea(g, '#638d9d', '#8aa8a8');
  rock(g, 3.2, 4.6, 6, 0, -1.8, '#b18460', '#918c7c', 0.11);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 40; i++) {
    const a = -1.3 + (i * 2.6) / 39;
    const y = 2.4 + 0.5 * Math.sin(i * 0.5);
    const r = 4.6 - 0.233 * y + 0.5;
    pts.push(new THREE.Vector3(r * Math.sin(a), y, -1.8 + r * Math.cos(a)));
  }
  const cv = new THREE.CatmullRomCurve3(pts);
  add(g, new THREE.TubeGeometry(cv, 140, 0.13, 6), M('#636a64', 0.85));
  // One short half-tunnel where the road cuts under a rock overhang, plus a
  // dark mesh catch-fence along the cliff edge — both signature road features.
  const canopyP = cv.getPointAt(0.38);
  const canopyT = cv.getTangentAt(0.38);
  const canopyYaw = Math.atan2(-canopyT.z, canopyT.x);
  add(g, CB(1.3, 0.1, 1.0, 0.02), MStone('#706c61', 0.92), canopyP.x, canopyP.y + 0.95, canopyP.z).rotation.y = canopyYaw;
  add(g, CB(1.3, 0.85, 0.1, 0.02), MStone('#918c7c', 0.92), canopyP.x, canopyP.y + 0.5, canopyP.z - 0.48).rotation.y = canopyYaw;
  const fenceV: number[] = [];
  for (let i = 12; i <= 26; i++) {
    const a = cv.getPointAt(i / 39);
    const b = cv.getPointAt((i + 1) / 39);
    fenceV.push(a.x, a.y + 0.42, a.z + 0.26, b.x, b.y + 0.42, b.z + 0.26);
    fenceV.push(a.x, a.y + 0.14, a.z + 0.26, a.x, a.y + 0.42, a.z + 0.26);
  }
  g.add(lines(fenceV, '#4a4f52'));
  const cs = [0, 1, 2].map((i) => {
    const c = car(['#c33', '#fff', '#36c'][i], 0.35);
    g.add(c);
    return c;
  });
  add(g, C(3.1, 3.2, 0.1, 48), MStone('#798365', 0.94), 0, 6.03, -1.8);
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 16; i++) {
    const a = R(i) * 6.28;
    const r = R(i + 5) * 2.6;
    bushT.push({
      x: r * Math.cos(a),
      y: 6.15,
      z: -1.8 + r * Math.sin(a),
      sx: 0.52,
      sy: 0.32,
      sz: 0.52,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.32, 1), Mc('#798365'), bushT, [
    '#798365',
    '#8a8260',
  ]);
  const sr = seaRings(g, 0.12, 4.8, 3);
  const spray = drift(
    g,
    45,
    '#eaf8ff',
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
  add(g, B(15.2, 0.2, 15.2), MStone('#b7a36f', 0.96), 0, 0.1, 0);
  rock(g, 1.3, 3.4, 4.4, 0, -3, '#8b7d69', '#a18868', 0.18);
  rock(g, 1.1, 2.2, 2.2, 2.6, -3.4, '#8b7d69', '#988366', 0.18);
  rock(g, 0.9, 1.8, 1.6, -2.6, -3.6, '#8b7d69', '#988366', 0.18);

  // Batched 46 white stone battle cairns (1 draw call!)
  const cairnT: InstanceTransform[] = [];
  for (let i = 0; i < 46; i++) {
    cairnT.push({ x: (R(i) - 0.5) * 7, y: 0.28, z: -1 + R(i + 9) * 3.4 });
  }
  instancedMeshes(g, new THREE.ConeGeometry(0.075, 0.15, 6), MStone('#d7d6c8', 0.85), cairnT);

  for (let i = 0; i < 6; i++) tree(g, (R(i + 30) - 0.5) * 9, 0.5 + R(i + 40) * 4, 0.9, 2, 0.2);

  // Batched golden Zululand grass tufts (1 draw call!)
  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 50; i++) {
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
  grassTufts(g, grassT, ['#858f64', '#b7a36f', '#988366']);

  g.userData.tick = drift(g, 60, '#e0c890', 0.08, (i, t) => [
    R(i) * 10 - 5 + Math.sin(t * 0.3 + i) * 0.4,
    0.4 + ((R(i + 3) * 2 + t * 0.25) % 2),
    R(i + 5) * 8 - 3 + Math.cos(t * 0.2 + i) * 0.3,
  ]);
  return g;
}

export function gariep(): THREE.Group {
  const g = new THREE.Group();
  const cn = MStone('#8c8d83', 0.82, 0.016);
  const wm = MCascade('#d3d8d0', 0.86);
  add(g, B(15.2, 0.2, 15.2), MStone('#a0805f', 0.96), 0, 0.1, 0);
  // Impounded valley floor: gives the reservoir surface ground to rest on
  // instead of a sheet of water hanging above the base slab.
  add(g, B(10.6, 1.34, 5.4), MStone('#8c8d83', 0.96), 0, 0.87, -3.2);
  add(g, CB(10, 0.1, 5.2, 0.02), MWater('#668e9d', 0.09, 0.25), 0, 1.6, -3.2);
  add(g, CB(3.2, 0.06, 5, 0.02), MWater('#668e9d', 0.09, 0.25), 0, 0.24, 3.4);

  // True curved arch-gravity concrete dam wall + chamfered crest roadway
  const wallMat = MStone('#aaa99e', 0.82);
  wallMat.side = THREE.DoubleSide;
  add(g, C(5.2, 5.4, 1.65, 48, 1, true, Math.PI * 0.72, Math.PI * 0.56), wallMat, 0, 1.0, 4.9);
  add(g, C(5.32, 5.32, 0.14, 48, 1, false, Math.PI * 0.72, Math.PI * 0.56), cn, 0, 1.88, 4.9);

  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 0.86 + (i / 5) * (Math.PI * 0.28);
    const sx = Math.sin(a) * 5.28;
    const sz = 4.9 + Math.cos(a) * 5.28;
    const gate = add(g, CB(0.55, 1.0, 0.16, 0.02), M('#7b8584', 0.45, 0.65), sx, 1.38, sz);
    gate.rotation.y = a;
    const jet = add(g, CB(0.32, 1.15, 0.08, 0.02), wm, sx, 0.98, sz + 0.12);
    jet.rotation.y = a;
  }

  rock(g, 1.6, 2.4, 3, -5.3, -1, '#a0805f', '#c0a078', 0.14);
  rock(g, 1.8, 2.6, 3.4, 5.3, -0.6, '#a0805f', '#c0a078', 0.14);
  for (let i = 0; i < 6; i++) tree(g, -3 + i * 1.2, 5.2 + R(i), 0.9, 2, 0.2);
  const bd = birds(g, 3, 3.2, 6);
  const mist = drift(g, 110, '#d3d8d0', 0.1, (i, t) => {
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
  const gr = MStone('#858a5b', 0.94);
  const mt = M('#9b624c', 0.36, 0.74);
  const bn = M('#aaa394', 0.58);
  const cs = MWet('#aaa394', 0.84, 0.18, 0.04, 'stone');
  add(g, B(15.2, 0.2, 15.2), MStone('#aca57c', 0.96), 0, 0.1, 0);
  add(
    g,
    new THREE.SphereGeometry(3.2, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    gr,
    0,
    0.2,
    -0.3
  ).scale.set(1, 0.45, 1);
  add(g, C(0.5, 0.5, 0.04, 24), MT('#60777d', 0.72, 0.1, 0.6), 0, 1.62, -0.3);
  add(g, new THREE.TorusGeometry(0.8, 0.06, 8, 24, Math.PI), mt, 0, 0.2, 2.45);
  add(g, CB(1.4, 0.05, 1.2, 0.015), cs, 0, 0.22, 3.1);
  add(g, CB(0.52, 0.36, 0.52, 0.03), cs, 0.9, 0.4, 3.7);
  add(g, new THREE.SphereGeometry(0.14, 16, 12), bn, 0.9, 0.72, 3.7).scale.set(1, 0.9, 1.1);
  add(g, CB(1.7, 0.05, 1.1, 0.015), MStone('#4a3a2a', 0.96), -4, 0.22, 0.8);
  const ln: number[] = [];
  for (let i = 0; i < 5; i++) ln.push(-4.85, 0.25, 0.3 + i * 0.22, -3.15, 0.25, 0.3 + i * 0.22);
  for (let i = 0; i < 7; i++) ln.push(-4.85 + i * 0.28, 0.25, 0.25, -4.85 + i * 0.28, 0.25, 1.35);
  g.add(lines(ln, '#9b624c'));
  const finT = Array.from({ length: 6 }, (_, i) => ({
    x: -3.2 + i * 0.7, y: 0.7, z: -1.6 + (i % 2) * 0.3, sy: 0.9 + (i % 3) * 0.25,
  }));
  instancedMeshes(g, CB(0.09, 1, 0.32, 0.02), M('#79786e', 0.9), finT);
  for (let i = 0; i < 4; i++)
    add(g, new THREE.SphereGeometry(0.05, 8, 6), bn, -4.6 + i * 0.5, 0.26, 0.5 + R(i) * 0.6);
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
  const gd = M('#e6b842', 0.25, 0.92);
  add(g, B(15.2, 0.2, 15.2), MStone('#b29654', 0.96), 0, 0.1, 0);
  // Flat-topped sandstone mesa: near-vertical walls, one level summit and a
  // shelter notch pushed into the east face. Deliberately not a rounded hill.
  const mesaGeo = C(3.5, 3.8, 1.9, 64, 12);
  const mp = mesaGeo.attributes.position;
  for (let i = 0; i < mp.count; i++) {
    const X = mp.getX(i);
    const Y = mp.getY(i);
    const Z = mp.getZ(i);
    const facing = Math.max(0, Math.cos(Math.atan2(Z, X)));
    const notch = Math.abs(Y + 0.55) < 0.5 ? Math.pow(facing, 10) * 0.3 : 0;
    const f = 1 - notch;
    mp.setXYZ(i, X * f, Y, Z * f);
  }
  tint(mesaGeo, (k, X, Y) => {
    k.set(Math.floor((Y + 0.95) * 3.2) % 2 ? '#ba9369' : '#c6ab82');
    if (Math.abs(Y + 0.55) < 0.55 && X > 0.8) k.multiplyScalar(0.46);
  });
  const mesaMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    ...surfaceDetail('stone', 0.03),
    side: THREE.DoubleSide,
  });
  add(g, mesaGeo, mesaMat, -0.6, 1.05, -0.6);
  add(g, C(3.52, 3.52, 0.1, 48), MStone('#c6ab82', 0.95), -0.6, 2.03, -0.6);
  // Dark recess and a projecting lintel make the shelter read at miniature scale.
  add(g, CB(0.14, 0.36, 0.78, 0.02), M('#675b4d', 0.96), 2.4, 0.62, -0.6);
  add(g, CB(0.34, 0.1, 0.94, 0.02), MStone('#a87855', 0.95), 2.5, 0.84, -0.6);
  add(g, C(1.1, 1.3, 0.9, 8), MStone('#ba9369', 0.95), 2.1, 0.65, -2.8);
  const cv = new THREE.CatmullRomCurve3(
    [
      [-7, 0.55, 2],
      [-3, 0.55, 3.5],
      [1, 0.55, 4],
      [4, 0.55, 2.5],
      [7, 0.55, 3],
    ].map((p) => new THREE.Vector3(...p))
  );
  add(g, new THREE.TubeGeometry(cv, 60, 0.35, 8), MWater('#748783', 0.09, 0.25)).scale.y = 0.35;
  const rh = animal('#c9a54b');
  rh.scale.setScalar(0.42);
  rh.position.set(3.2, 0.25, 2.4);
  g.add(rh);
  add(rh, new THREE.ConeGeometry(0.012, 0.08, 6), gd, 0.17, 0.2, 0).rotation.z = -0.5;
  [
    [-4.5, 1.2, 1.2],
    [4, -0.5, 1],
    [2.8, 2, 0.8],
  ].forEach(([x, z, s]) => {
    add(g, C(0.22 * s, 0.32 * s, 1.1 * s, 14), MWood('#8c8171', 0.95), x, 0.2 + 0.55 * s, z);
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
  const sp = drift(g, 14, '#ffd86a', 0.1, (i, t) => [
    -0.6 + Math.sin(t * 2 + i) * 0.5,
    1.1 + Math.cos(t * 1.5 + i) * 0.15,
    -0.6 + Math.cos(t + i) * 0.5,
  ]);
  g.userData.tick = (t: number) => {
    rh.rotation.y = 0.6 + Math.sin(t * 0.5) * 0.15;
    sp(t);
  };
  return g;
}

export function kgalagadi(): THREE.Group {
  const g = new THREE.Group();
  const dk = M('#2a2420', 0.88);
  const hf = (x: number, y: number) =>
    0.55 * Math.pow(0.5 + 0.5 * Math.sin(x * 0.9 + Math.sin(y * 0.45) * 1.6), 1.6) +
    0.2 * Math.sin(x * 0.4 - y * 0.7) +
    0.25;
  const rg = new THREE.RingGeometry(0.01, 7.6, 112, 42);
  const p = rg.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, hf(p.getX(i), p.getY(i)));
  rg.rotateX(-Math.PI / 2);
  const a = new THREE.Color('#c96e45');
  const b = new THREE.Color('#9e5039');
  const c = new THREE.Color('#d78655');
  add(
    g,
    tint(rg, (k, X, Y, Z) => {
      const sd = Math.cos(X * 0.9 + Math.sin(-Z * 0.45) * 1.6);
      k.copy(sd > 0 ? a : b).lerp(c, Math.max(0, Y - 0.55) * 0.8);
    }),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      ...surfaceDetail('stone', 0.018),
    })
  );
  [
    [-3, 1],
    [2.5, -2],
    [4, 2.5],
  ].forEach(([x, z]) => {
    tree(g, x, z, 1, 2, hf(x, -z));
    add(g, new THREE.IcosahedronGeometry(0.42, 1), Mc('#858764'), x + 0.5, hf(x, -z) + 0.18, z - 0.4);
  });
  const gb = [0, 1, 2, 3].map(() => {
    const o = animal('#c9b08a');
    o.scale.setScalar(1.7);
    [-1, 1].forEach(
      (s) =>
        (add(o, new THREE.ConeGeometry(0.006, 0.3, 6), dk, 0.15, 0.3, s * 0.02).rotation.z = 0.9)
    );
    g.add(o);
    return o;
  });
  const sn = drift(g, 80, '#f0b070', 0.08, (i, t) => [
    ((((R(i) * 14 - 7 + t * 0.8) % 14) + 14) % 14) - 7,
    0.5 + R(i + 3) * 1.2,
    R(i + 5) * 12 - 6,
  ]);
  g.userData.tick = (t: number) => {
    gb.forEach((o, i) => {
      const q = t * 0.06 * (i % 2 ? 1 : -1) + i * 1.6;
      const r = 2.6 + i * 0.5;
      const x = r * Math.cos(q);
      const z = r * Math.sin(q);
      o.position.set(x, hf(x, -z), z);
      o.rotation.y = -q + (i % 2 ? -Math.PI / 2 : Math.PI / 2);
    });
    sn(t);
  };
  return g;
}

export function storms(): THREE.Group {
  const g = new THREE.Group();
  const rd = M('#88483f', 0.42, 0.55);
  sea(g, '#4c5147', '#6f8880');
  [-4.6, 4.6].forEach((x) => {
    rock(g, 1.9, 2.6, 3.6, x, 0, '#526f4c', '#7d8b5f', 0.12);
    rock(g, 1.5, 2.1, 2.8, x * 1.1, -3.6, '#526f4c', '#7d8b5f', 0.12);
    rock(g, 1.5, 2.1, 2.4, x * 1.1, 3.4, '#526f4c', '#7d8b5f', 0.12);
  });
  add(g, CB(5.4, 0.09, 0.38, 0.02), MWood('#99846a', 0.84), 0, 1.5, 0);
  [-2.6, 2.6].forEach((x) => add(g, CB(0.12, 1.1, 0.12, 0.02), rd, x, 2.05, 0));
  const yy = (h: number) => 2.6 - 0.7 * (1 - (h / 2.6) ** 2);
  const v: number[] = [];
  for (let i = 0; i < 20; i++) {
    const x1 = -2.6 + i * 0.26;
    const x2 = x1 + 0.26;
    v.push(x1, yy(x1), 0.18, x2, yy(x2), 0.18, x1, yy(x1), -0.18, x2, yy(x2), -0.18);
  }
  for (let i = 1; i < 20; i++) {
    const x = -2.6 + i * 0.26;
    [-0.18, 0.18].forEach((z) => v.push(x, yy(x), z, x, 1.55, z));
  }
  g.add(lines(v, '#abb2af'));
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
      '#526f4c',
      '#a18d72',
      0.12
    );
  }
  const sr = seaRings(g, 0.12, 2.2, 4);
  const spray = drift(
    g,
    45,
    '#eaf8ff',
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
  const wh = MPlaster('#ddd9cb', 0.72);
  const th = MWood('#716b60', 0.94);
  const gn = MWood('#526452', 0.74);
  const wn = G('#e8ca86', 1);

  // Gently rolling ground so the vineyards read as planted contours, not flat stripes.
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
  add(
    g,
    terrainGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 })
  );

  // Cape Dutch manor: central gable, flanking wings, thatched roofs and a brick stoep.
  add(g, CB(3.6, 0.1, 1.5, 0.02), MStone('#b69b77', 0.88), 0, 0.26, 0.15);
  add(g, CB(3.2, 0.9, 1.2, 0.03), wh, 0, 0.68, 0);
  [-1, 1].forEach((s) => add(g, CB(1, 0.8, 1.6, 0.03), wh, s * 2.1, 0.63, -0.2));
  add(g, gableRoofGeo(3.2, 1.2, 0.8, 0.12), th, 0, 1.13, 0);
  [-1, 1].forEach((s) => add(g, gableRoofGeo(1.0, 1.6, 0.5, 0.08), th, s * 2.1, 1.01, -0.2));
  add(g, capeDutchGableGeo(1.25, 0.98, 0.16), wh, 0, 1.13, 0.58);
  [-1.1, 0, 1.1].forEach((x) =>
    add(g, CB(0.16, 0.2, 0.12, 0.01), MStone('#d8cdb4', 0.9), x, 1.46, -0.36)
  );
  [-0.85, 0.85].forEach((x) =>
    add(g, C(0.1, 0.12, 0.4, 8), MStone('#a06f62', 0.9), x, 1.52, 0)
  );
  [-1.25, -0.85, 0.85, 1.25, -2.1, 2.1].forEach((x) => {
    add(g, CB(0.24, 0.4, 0.04, 0.01), wn, x, 0.73, 0.62);
    [-1, 1].forEach((s) => add(g, CB(0.09, 0.4, 0.04, 0.01), gn, x + s * 0.2, 0.73, 0.62));
  });
  add(g, CB(0.4, 0.6, 0.04, 0.01), MWood('#3a2a22', 0.72), 0, 0.53, 0.62);

  // Recessed window reveals and a light string course over the plain lit panes.
  const manorFacade = new THREE.Group();
  [-1.25, -0.85, 0.85, 1.25].forEach((x) => {
    facadeWindow(manorFacade, {
      x,
      y: 0.73,
      z: 0.64,
      width: 0.3,
      height: 0.44,
      depth: 0.09,
      frame: '#d8cdb4',
      glass: '#26413c',
    });
  });
  facadeWindow(manorFacade, {
    x: -4.5 + -0.6,
    y: 0.72,
    z: -1.7,
    width: 0.24,
    height: 0.38,
    depth: 0.08,
    frame: '#d8cdb4',
    glass: '#26413c',
  });
  facadeWindow(manorFacade, {
    x: -4.5 + 0.6,
    y: 0.72,
    z: -1.7,
    width: 0.24,
    height: 0.38,
    depth: 0.08,
    frame: '#d8cdb4',
    glass: '#26413c',
  });
  doorSurround(manorFacade, {
    x: 0,
    y: 0.55,
    z: 0.64,
    width: 0.5,
    height: 0.7,
    depth: 0.12,
    jamb: '#d8cdb4',
    panel: '#3a2a22',
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

  // Detached wine cellar with its own small gable.
  add(g, CB(2.2, 0.1, 1.5, 0.02), MStone('#b69b77', 0.88), -4.5, 0.3, -2.4);
  add(g, CB(2.0, 0.72, 1.3, 0.03), wh, -4.5, 0.7, -2.4);
  add(g, gableRoofGeo(2.0, 1.3, 0.62, 0.1), th, -4.5, 1.08, -2.4);
  add(g, capeDutchGableGeo(0.9, 0.7, 0.14), wh, -4.5, 1.08, -1.73);
  [-0.6, 0, 0.6].forEach((dx) =>
    add(g, CB(0.18, 0.34, 0.04, 0.01), wn, -4.5 + dx, 0.72, -1.72)
  );

  // Reflecting pond tucked into the east lawn, with a rough stone lip.
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
  add(g, pondGeo, MWater('#6e9e9b', 0.08, 0.22), pondX, 0.02, pondZ);
  add(
    g,
    new THREE.RingGeometry(1.27, 1.42, 48).rotateX(-Math.PI / 2),
    MStone('#b8a98c', 0.95),
    pondX,
    0.24,
    pondZ
  );

  // Curved, contour-following vineyard rows with trellis posts.
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

  // Gravel estate road sweeping past the manor.
  const roadT: InstanceTransform[] = [];
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const x = -6.6 + t * 6.4;
    const z = -1.5 + 0.85 * Math.sin(t * Math.PI * 0.9);
    roadT.push({ x, y: 0.23 + hAt(x, z), z, ry: -0.12 * Math.cos(t * Math.PI * 0.9) });
  }
  instancedMeshes(g, CB(0.3, 0.03, 0.17, 0.01), MStone('#b8a98c', 0.95), roadT);

  const truck = car('#8d2f2b', 0.34);
  truck.position.set(-6.2, 0.36, -1.5);
  g.add(truck);
  const bakkie = car('#d8d3c4', 0.3);
  bakkie.position.set(-2.5, 0.34, -0.9);
  g.add(bakkie);

  // Constantiaberg crags behind the estate, with sharper summits.
  rock(g, 2.8, 4.2, 3.4, 0.4, -6.4, '#6d7883', '#9aa7b2', 0.18);
  rock(g, 1.6, 2.4, 2.6, -3.4, -6.1, '#75808a', '#a8b3bd', 0.16);
  rock(g, 1.3, 2.0, 2.0, 3.6, -6.2, '#6f7a84', '#a2adb7', 0.16);
  rock(g, 0.7, 1.0, 1.4, -1.4, -6.6, '#8b97a1', '#b4bec6', 0.22, 2.5);
  rock(g, 0.6, 0.9, 1.2, 1.5, -6.7, '#8b97a1', '#b4bec6', 0.2, 2.7);

  // Soft cloud puffs drifting above the summit, as in the reference miniature.
  const cloudMat = M('#ffffff', 0.92, 0);
  const cloudClusters: THREE.Group[] = [];
  [
    [-2.8, 5.0, -4.8, 0.85],
    [0.5, 5.6, -5.4, 1.05],
    [3.0, 5.1, -4.6, 0.8],
  ].forEach(([x, y, z, s], i) => {
    const cluster = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(s * (0.42 + R(i * 7 + j) * 0.24), 1),
        cloudMat
      );
      puff.position.set(
        (R(i * 11 + j) - 0.5) * s * 1.7,
        (R(i * 13 + j) - 0.5) * s * 0.55,
        (R(i * 17 + j) - 0.5) * s * 0.9
      );
      puff.userData.noShadow = true;
      cluster.add(puff);
    }
    cluster.position.set(x, y, z);
    cluster.userData.baseX = x;
    cluster.userData.noShadow = true;
    cloudClusters.push(cluster);
    g.add(cluster);
  });

  // Mature oaks framing the property.
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
    cloudClusters.forEach((c, i) => {
      c.position.x = (c.userData.baseX as number) + Math.sin(t * 0.16 + i) * 0.28;
    });
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
  sea(g, '#507d91', '#62969d');
  rock(g, 2.4, 3.8, 3.2, -3.6, -1.2, '#8b8c7b', '#a99b86', 0.12);
  rock(g, 1.8, 2.8, 2.4, -4.2, 2.4, '#8b8c7b', '#9e9a86', 0.12);
  add(g, C(2.3, 2.35, 0.1, 40), MStone('#8b8c7b', 0.95), -3.6, 3.22, -1.2);
  const pv: THREE.Vector3[] = [];
  for (let i = 0; i < 30; i++) {
    const a = -1.1 + i * 0.1;
    pv.push(new THREE.Vector3(-3.6 + 2.6 * Math.cos(a) * 0.6, 3.3, -1.2 + 2.6 * Math.sin(a) * 1.4));
  }
  add(
    g,
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pv), 60, 0.045, 5),
    MStone('#d8cfb8', 0.88)
  );
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 12; i++) {
    const a = R(i) * 6.28;
    const r = R(i + 3) * 2;
    bushT.push({
      x: -3.6 + r * Math.cos(a),
      y: 3.35,
      z: -1.2 + r * Math.sin(a),
      sx: 0.5,
      sy: 0.3,
      sz: 0.5,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.32, 1), Mc('#8b8c7b'), bushT, [
    '#8b8c7b',
    '#9a9a7a',
  ]);
  const whale = (s: number) => {
    const w = new THREE.Group();
    const m = M('#3d4547', 0.45, 0.15);
    add(w, new THREE.SphereGeometry(0.5, 24, 16), m, 0, 0, 0).scale.set(1.9, 0.7, 0.7);
    add(w, new THREE.SphereGeometry(0.3, 16, 12), m, 0.7, -0.04, 0).scale.set(1.2, 0.8, 0.9);
    const f = new THREE.Shape();
    f.moveTo(0, 0.04);
    f.lineTo(-0.24, 0.36);
    f.lineTo(-0.12, 0);
    f.lineTo(-0.24, -0.36);
    f.lineTo(0, -0.04);
    f.closePath();
    const fm = M('#5a6362', 0.45, 0.15);
    fm.side = THREE.DoubleSide;
    add(w, new THREE.ShapeGeometry(f).rotateX(-Math.PI / 2), fm, -0.95, 0, 0);
    [-1, 1].forEach((z) =>
      add(w, new THREE.SphereGeometry(0.14, 10, 8), m, 0.35, -0.2, z * 0.32).scale.set(
        1.6,
        0.3,
        0.7
      )
    );
    for (let k = 0; k < 5; k++) {
      add(w, new THREE.SphereGeometry(0.07, 8, 6), M('#c9c6b4', 0.95),
        0.62 + k * 0.045, 0.06 + (k % 2) * 0.07, (k - 2) * 0.07);
    }
    w.scale.setScalar(s);
    g.add(w);
    return w;
  };
  const wa = whale(1);
  const wb = whale(1.15);
  const wc = whale(0.5);
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
  // Whale blowhole mist plume
  const blow = drift(
    g,
    30,
    '#eaf8ff',
    0.12,
    (i, t) => {
      const k = (t * 0.65 + R(i * 4)) % 1;
      const spread = k * 0.45;
      return [
        wa.position.x + Math.cos(i) * spread,
        0.25 + Math.sin(k * Math.PI) * 1.15,
        wa.position.z + Math.sin(i) * spread,
      ];
    },
    0.55
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
  add(g, B(15.2, 0.2, 15.2), MStone('#cdbd9e', 0.95), 0, 0.1, 0);
  add(g, C(4.6, 4.6, 0.06, 64), MWater('#748783', 0.09, 0.25), 0, 0.22, 0.6);
  rock(g, 2.6, 4.6, 2.2, 0, -5.3, '#aa8c82', '#cdbd9e', 0.12);
  rock(g, 1.8, 3.2, 1.6, -5.2, -2.4, '#aa8c82', '#cdbd9e', 0.12);
  for (let i = 0; i < 8; i++) tree(g, -2 + R(i) * 4, -5.3 + (R(i + 9) - 0.5) * 2, 1, 1, 2.3);

  // Batched 70 swaying estuary papyrus reeds (1 draw call!)
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

  const hp = (
    [
      [-1, 0.2, 0],
      [1.2, 1.3, 1],
      [0.2, 2.4, 2],
    ] as const
  ).map(([x, z, i]) => {
    const h = new THREE.Group();
    const m = M('#79756d', 0.65);
    add(h, new THREE.SphereGeometry(0.34, 16, 12), m, 0, 0.02, 0).scale.set(1.5, 0.75, 0.95);
    add(h, new THREE.SphereGeometry(0.2, 14, 10), m, 0.5, 0.08, 0).scale.set(1.3, 0.9, 1.1);
    [-1, 1].forEach((s) => {
      add(h, new THREE.ConeGeometry(0.04, 0.08, 6), m, 0.45, 0.28, s * 0.1);
      add(h, new THREE.SphereGeometry(0.03, 8, 6), M('#111'), 0.64, 0.2, s * 0.07);
    });
    h.position.set(x, 0.24, z);
    h.rotation.y = i * 1.7;
    g.add(h);
    return h;
  });
  const sr = seaRings(g, 0.25, 1.4, 3);
  const bd = birds(g, 4, 3.5, 5);
  const mist = drift(g, 40, '#eaf6ff', 0.12, (i, t) => [
    Math.cos(i * 2.4 + t * 0.05) * 4,
    0.5 + R(i + 3) * 1.2,
    0.6 + Math.sin(i * 2.4 + t * 0.05) * 4,
  ]);
  g.userData.tick = (t: number) => {
    hp.forEach((h, i) => {
      h.position.y = 0.24 + Math.sin(t * 0.8 + i * 2) * 0.03;
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
  add(g, B(15.2, 0.2, 15.2), MStone('#85855e', 0.95), 0, 0.1, 0);
  rock(g, 2.5, 4.3, 6.2, 0, -2, '#6b6b60', '#8f8370', 0.11);
  // Flanking Drakensberg escarpment ridges & alpine gorge stream
  rock(g, 1.3, 2.4, 4.6, -3.5, -2.7, '#6b6b60', '#8f8370', 0.14);
  rock(g, 1.2, 2.2, 4.1, 3.4, -2.5, '#6b6b60', '#8f8370', 0.14);
  add(g, CB(0.48, 3.8, 0.08, 0.02), MCascade('#dcf2ff', 0.84), -1.85, 2.05, 0.55).rotation.set(
    0.45,
    0.2,
    0.18
  );
  add(g, C(0.95, 0.95, 0.05, 28), MWater('#2f8aa8', 0.1, 0.25), -2.0, 0.22, 1.65);

  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 60; i++) {
    const y = 0.5 + i * 0.09;
    const a = 0.7 * Math.sin(i * 0.5);
    const r = 4.4 - (1.8 * y) / 6.2 + 0.4;
    pts.push(new THREE.Vector3(r * Math.sin(a), y, -2 + r * Math.cos(a)));
  }
  const cv = new THREE.CatmullRomCurve3(pts);
  add(g, new THREE.TubeGeometry(cv, 200, 0.08, 5), MStone('#c4ad85', 0.95));
  // Snow-dusted 2,876 m escarpment rim + stone/pitched-roof Sani Mountain Lodge
  add(g, C(2.55, 2.6, 0.12, 40), M('#f4f7fc', 0.65), 0, 6.25, -2);
  add(g, CB(0.52, 0.28, 0.42, 0.02), MPlaster('#b0a58d', 0.8), 0.3, 6.4, -2.3);
  add(g, gableRoofGeo(0.54, 0.44, 0.18, 0.04), MPlaster('#8c8f88', 0.7), 0.3, 6.53, -2.3);
  add(g, CB(0.14, 0.12, 0.03, 0.005), G('#ffd58a', 1.1), 0.3, 6.4, -2.08);
  const tuftT: InstanceTransform[] = [];
  for (let i = 0; i < 55; i++) {
    const a = R(i + 20) * 6.2832;
    const r = 3.2 + R(i + 80) * 3.8;
    tuftT.push({ x: r * Math.cos(a), y: 0.2, z: r * Math.sin(a), ry: R(i * 7) * 6.28, sy: 1.1 });
  }
  grassTufts(g, tuftT, ['#85855e', '#a79a69', '#8f9154']);
  const cs = [0, 1, 2].map((i) => {
    const c = car(['#c33', '#fff', '#2a6fd3'][i], 0.28);
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
  const bk = MWood('#c0a064', 0.9);
  const lf = Mc('#7b8060');
  add(g, B(15.2, 0.2, 15.2), MStone('#b29c7e', 0.96), 0, 0.1, 0);
  // Low-poly, flat-shaded shards instead of soft eroded mounds: the jagged
  // skyline is the landscape's signature.
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

  // A sparse apron of scree keeps the angular skyline dominant.
  const screeT: InstanceTransform[] = [];
  for (let i = 0; i < 18; i++) {
    const a = R(i) * 6.28;
    const r = 1 + R(i + 9) * 5;
    const s = 0.35 + R(i + 2) * 0.32;
    screeT.push({ x: r * Math.cos(a), y: 0.24, z: r * Math.sin(a), sx: s, sy: s * 0.8, sz: s });
  }
  scatterRocks(g, screeT, '#ac7958', '#bc9672');

  // Only a handful of quiver trees: bare, slightly forked trunks carrying a
  // flat umbrella crown. The horizontal crown is the key silhouette cue.
  const trunks = new THREE.Group();
  const qt = (x: number, z: number, s: number) => {
    const h = 1.55 * s;
    add(trunks, C(0.07 * s, 0.13 * s, h, 7), bk, x, 0.2 + h / 2, z);
    add(trunks, C(0.04 * s, 0.07 * s, 0.36 * s, 6), bk, x + 0.14 * s, 0.2 + h * 0.72, z).rotation.z =
      -0.6;
    add(trunks, C(0.04 * s, 0.07 * s, 0.3 * s, 6), bk, x - 0.12 * s, 0.2 + h * 0.62, z).rotation.z =
      0.65;
    const crown = new THREE.Group();
    crown.position.set(x, 0.2 + h + 0.04 * s, z);
    add(crown, new THREE.SphereGeometry(0.46 * s, 12, 8), lf).scale.y = 0.32;
    add(crown, C(0.18 * s, 0.24 * s, 0.09 * s, 10), Mc('#7b8060'), 0, 0.055 * s, 0);
    g.add(crown);
    swayItems.push({ o: crown, ph: x * 3, a: 0.035, sp: 1.1 });
  };
  [
    [-1.5, 0.6, 1.35],
    [2.0, -0.8, 1.6],
    [3.2, 2.2, 1.05],
  ].forEach(([x, z, s]) => qt(x, z, s));
  g.add(mergeByMaterial(trunks));
  g.userData.tick = drift(g, 45, '#f0c890', 0.08, (i, t) => [
    ((((R(i) * 12 - 6 + t * 0.4) % 12) + 12) % 12) - 6,
    0.5 + R(i + 3) * 1.5,
    R(i + 5) * 10 - 5,
  ]);
  return g;
}

export function vredefort(): THREE.Group {
  const g = new THREE.Group();
  const pr = [
    [0.01, 0.5],
    [0.6, 0.9],
    [1.3, 0.7],
    [2, 0.2],
    [3, 0.15],
    [3.8, 0.7],
    [4.5, 1.6],
    [5.1, 1.9],
    [5.7, 1],
    [6.5, 0.3],
    [7.6, 0.1],
  ].map((p) => new THREE.Vector2(...p));
  const ge = new THREE.LatheGeometry(pr, 112);
  const p = ge.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const a = Math.atan2(Z, X);
    p.setY(i, Y * (1 + 0.25 * Math.sin(a * 3 + 1) + 0.12 * Math.sin(a * 7)));
  }
  const lo = new THREE.Color('#aca277');
  const md = new THREE.Color('#848a57');
  const hi = new THREE.Color('#857f72');
  add(
    g,
    tint(ge, (k, X, Y, Z) => {
      if (Math.hypot(X, Z) < 3.2)
        k.copy(lo).lerp(md, 0.3 + 0.3 * Math.sin(X * 3) * Math.sin(Z * 3));
      else k.copy(md).lerp(hi, Math.min(1, Y / 1.8));
    }),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      ...surfaceDetail('stone', 0.025),
      side: THREE.DoubleSide,
    })
  );
  add(g, new THREE.TorusGeometry(5.4, 0.22, 6, 64, Math.PI * 1.6).rotateX(Math.PI / 2), MStone('#857f72', 0.94), 0, 0.32, 0.6);
  add(g, new THREE.TorusGeometry(6.8, 0.16, 6, 64, Math.PI * 1.2).rotateX(Math.PI / 2), MStone('#aaa18d', 0.94), -0.4, 0.18, -0.3);
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
    0.6,
    0
  );
  for (let i = 0; i < 8; i++) {
    const a = i * 0.8 + 0.2;
    tree(g, 6.6 * Math.cos(a), 6.6 * Math.sin(a), 0.8, 2, 0.1);
  }
  // Eroded central uplift: no active impact, fireball or ejecta.
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
  // Impounded valley floor beneath the reservoir (same fix as gariep()).
  add(g, B(10.6, 1.29, 5.6), MStone('#77764e', 0.95), 0, 0.845, -3.3);
  add(g, CB(10, 0.1, 5.4, 0.02), MWater('#778878', 0.09, 0.25), 0, 1.55, -3.3);
  add(g, CB(4, 0.06, 5, 0.02), MWater('#778878', 0.09, 0.25), 0, 0.24, 3.6);
  const wallMat = MStone('#aaa291', 0.82);
  wallMat.side = THREE.DoubleSide;
  add(g, C(4.2, 4.2, 1.6, 64, 1, true, Math.PI * 0.6, Math.PI * 0.8), wallMat, 0, 0.95, 4.1);
  add(g, C(4.3, 4.3, 0.12, 64, 1, false, Math.PI * 0.6, Math.PI * 0.8), cn, 0, 1.8, 4.1);
  // Subtle spillway waterfall ribbon on crest
  add(g, CB(0.85, 1.35, 0.08, 0.02), MCascade('#e6f6ff', 0.85), 0, 0.92, -0.15);

  rock(g, 1.6, 2.8, 3.6, -5, -1, '#817d6e', '#a99b86', 0.14);
  rock(g, 1.8, 3, 4, 5.2, -1.6, '#817d6e', '#a99b86', 0.14);
  const A = new THREE.Vector3(-3.4, 0.9, 5.2);
  const Bv = new THREE.Vector3(4.6, 4.3, -1.4);
  g.add(lines([A.x, A.y, A.z, Bv.x, Bv.y, Bv.z], '#222'));
  add(g, new THREE.TorusGeometry(0.42, 0.05, 6, 20, Math.PI), MStone('#aaa291', 0.9), 1.2, 0.28, 4.6);
  const hyT = Array.from({ length: 22 }, (_, i) => ({
    x: -4.4 + (i % 11) * 0.9, y: 1.6 + (i % 3) * 0.01, z: -3.6 + Math.floor(i / 11) * 1.1,
    sx: 0.5, sy: 0.02, sz: 0.4,
  }));
  instancedMeshes(g, new THREE.CircleGeometry(0.3, 8), Mc('#82934f'), hyT);
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
  sea(g, '#568592', '#70a1a3');
  rock(g, 1.9, 3.2, 4, -3.8, -0.4, '#b58d66', '#ccac82', 0.12);
  rock(g, 1.45, 2.5, 3.6, 3.6, -0.8, '#b58d66', '#ccac82', 0.12);
  add(g, C(1.85, 1.9, 0.1, 40), MStone('#637850', 0.94), -3.8, 4.03, -0.4);
  add(g, C(1.65, 1.7, 0.1, 40), MStone('#637850', 0.94), 3.6, 3.43, -0.8);
  add(g, CB(7, 0.08, 4.5, 0.02), MWater('#4f7c77', 0.09, 0.25), 0, 0.24, -5);
  rock(g, 0.5, 0.8, 0.6, -1.1, 0.8, '#877561', '#a18d72', 0.1);
  rock(g, 0.4, 0.7, 0.5, 1.2, 0.4, '#877561', '#a18d72', 0.1);

  // Sea caves cut into the seaward face of each headland: a dark arch mouth
  // with a pale stone rim just proud of the cliff.
  const caveMat = M('#171c22', 0.95);
  const caveRim = MStone('#ccac82', 0.96);
  const cave = (x: number, z: number, s: number) => {
    const mouth = add(g, new THREE.CircleGeometry(0.5 * s, 24, 0, Math.PI), caveMat, x, 0.22, z);
    mouth.scale.y = 1.3;
    const rim = add(
      g,
      new THREE.TorusGeometry(0.5 * s, 0.09 * s, 8, 24, Math.PI),
      caveRim,
      x,
      0.22,
      z
    );
    rim.scale.y = 1.3;
  };
  cave(-3.8, -3.7, 1.0);
  cave(3.6, -3.65, 0.8);

  // Village houses on both headlands and along the sheltered inner shore,
  // batched into two instanced draws (walls + pitched roofs).
  const houseT: InstanceTransform[] = [];
  const roofT: InstanceTransform[] = [];
  const addHouse = (x: number, y: number, z: number, ry: number) => {
    houseT.push({ x, y: y + 0.12, z, ry });
    roofT.push({ x, y: y + 0.24, z, ry });
  };
  for (let i = 0; i < 12; i++) {
    const a = R(i) * 6.28;
    const r = R(i + 3) * 1.1;
    addHouse(-3.8 + r * Math.cos(a), 4.05, -0.4 + r * Math.sin(a), -a);
  }
  for (let i = 0; i < 9; i++) {
    const a = R(i + 20) * 6.28;
    const r = R(i + 23) * 1.0;
    addHouse(3.6 + r * Math.cos(a), 3.45, -0.8 + r * Math.sin(a), -a);
  }
  for (let i = 0; i < 16; i++) {
    const x = -3.0 + i * 0.4 + (R(i + 30) - 0.5) * 0.1;
    const z = -1.9 + R(i + 40) * 0.6;
    addHouse(x, 0.28, z, (R(i + 50) - 0.5) * 0.6);
  }
  for (let i = 0; i < 10; i++) {
    const x = -3.2 + i * 0.7;
    const z = 1.6 + R(i + 60) * 0.5;
    addHouse(x, 0.28, z, (R(i + 70) - 0.5) * 0.5);
  }
  instancedMeshes(g, CB(0.36, 0.24, 0.3, 0.015), MPlaster('#ffffff', 0.82), houseT, [
    '#e8e4da',
    '#d8d3c4',
    '#c9c6bd',
    '#ddd8c8',
    '#cfc9b8',
  ]);
  instancedMeshes(g, gableRoofGeo(0.36, 0.31, 0.11, 0.03), MPlaster('#ffffff', 0.85), roofT, [
    '#6c5244',
    '#8a4a38',
    '#4a5f70',
  ]);

  // Forested cliff tops: a batched scrub canopy plus scattered trees on the
  // slopes below the summit.
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 34; i++) {
    const west = i < 18;
    const cx = west ? -3.8 : 3.6;
    const cz = west ? -0.4 : -0.8;
    const top = west ? 4.08 : 3.48;
    const a = R(i + 80) * 6.28;
    const r = R(i + 90) * 1.45;
    bushT.push({
      x: cx + r * Math.cos(a),
      y: top + 0.08,
      z: cz + r * Math.sin(a),
      sx: 0.5,
      sy: 0.32,
      sz: 0.5,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.3, 1), Mc('#4f6748'), bushT, [
    '#4f6748',
    '#637d50',
    '#6b8a5a',
  ]);
  for (let i = 0; i < 7; i++) {
    tree(g, -3.8 + (R(i + 100) - 0.5) * 3.2, -0.4 + (R(i + 110) - 0.5) * 3.2, 0.8, 1, 1.7);
    tree(g, 3.6 + (R(i + 120) - 0.5) * 2.8, -0.8 + (R(i + 130) - 0.5) * 2.8, 0.75, 2, 1.4);
  }

  // A little fleet of sailboats moored in the sheltered bay.
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

  // Foam rings, drifting surf and pale wave arcs hugging each headland.
  const sr = seaRings(g, 0.13, 2.6, 4);
  const foam = drift(g, 80, '#eafaff', 0.1, (i, t) => {
    const a = R(i) * 6.28;
    const k = (t * 0.3 + R(i + 3)) % 1;
    const rr = 5.4 + k * 0.8;
    return [rr * Math.cos(a), 0.14 + Math.sin(k * Math.PI) * 0.1, rr * Math.sin(a)];
  }, 0.65);
  const surfArc = (cx: number, cz: number, r: number) => {
    const v: number[] = [];
    for (let i = 0; i < 24; i++) {
      const a0 = Math.PI + (i / 24) * Math.PI;
      const a1 = Math.PI + ((i + 1) / 24) * Math.PI;
      v.push(cx + r * Math.cos(a0), 0.15, cz + r * Math.sin(a0));
      v.push(cx + r * Math.cos(a1), 0.15, cz + r * Math.sin(a1));
    }
    g.add(lines(v, '#dff4ff'));
  };
  surfArc(-3.8, -0.4, 3.7);
  surfArc(3.6, -0.8, 3.2);
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

export function donkin(): THREE.Group {
  const g = new THREE.Group();
  const st = MStone('#8d806e', 0.84, 0.02);
  const wh = MPlaster('#dbd7cb', 0.68);
  const dk = M('#2b2d34', 0.48, 0.6);
  const lt = G('#fff3b0', 2.6);
  sea(g, '#6c929c', '#8fa9a8');
  add(g, C(4.6, 5.2, 1.4, 64), MStone('#a99b86', 0.94), 0, 0.7, 0);
  add(g, C(4.2, 4.4, 0.1, 64), MStone('#818455', 0.95), 0, 1.42, 0);
  // 1820 stone pyramid on a chamfered stepped plinth; the taller partner.
  add(g, CB(1.9, 0.12, 1.9, 0.02), st, -0.8, 1.52, 0.4);
  add(g, CB(1.6, 0.12, 1.6, 0.02), st, -0.8, 1.66, 0.4);
  add(g, new THREE.ConeGeometry(0.82, 2.2, 4), st, -0.8, 2.82, 0.4).rotation.y = Math.PI / 4;

  // Small galleryed 1861 lighthouse close beside it.
  add(g, C(0.26, 0.4, 1.55, 24), wh, 1.2, 2.28, -0.4);
  add(g, C(0.45, 0.4, 0.1, 24), dk, 1.2, 3.08, -0.4);
  // Gallery railing is the lighthouse's defining miniature-scale silhouette.
  railing(g, 0.44, 1.2, 3.12, -0.4, dk, 10, 0.15, 0.013);
  add(g, C(0.23, 0.23, 0.32, 16), M('#88483f', 0.7), 1.2, 3.32, -0.4);
  add(g, C(0.14, 0.14, 0.24, 12), lt, 1.2, 3.32, -0.28);
  add(g, new THREE.ConeGeometry(0.3, 0.3, 16), dk, 1.2, 3.65, -0.4);
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
  add(g, C(0.02, 0.02, 1.6, 6), M('#999', 0.4, 0.8), -2.4, 2.2, 1.4);
  add(g, CB(0.5, 0.3, 0.02, 0.005), MT('#007749', 1, 0.6, 0, true), -2.15, 2.85, 1.4);

  // Gqeberha coastal Victorian row cottages with pitched roofs (instanced!)
  const houseT: InstanceTransform[] = [];
  const roofT: InstanceTransform[] = [];
  for (let i = 0; i < 22; i++) {
    const a = i * 0.286 + R(i) * 0.1;
    const r = 4.9 + R(i + 3) * 0.4;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    houseT.push({ x, y: 0.3, z, ry: -a });
    roofT.push({ x, y: 0.44, z, ry: -a });
  }
  instancedMeshes(g, CB(0.5, 0.3, 0.4, 0.02), MPlaster('#f4f1e8', 0.8), houseT, [
    '#e8e4da',
    '#d8d3c4',
    '#a06f62',
    '#8fa9a8',
  ]);
  instancedMeshes(g, gableRoofGeo(0.52, 0.42, 0.14, 0.03), MPlaster('#7a4534', 0.8), roofT);

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
    const a = t * 0.09;
    ship.position.set(6.6 * Math.cos(a), 0.1, 6.6 * Math.sin(a));
    ship.rotation.y = -a - Math.PI / 2;
    sr(t);
    bd(t);
  };
  return g;
}

/** Small generated mural used as the cooling-tower wrap. No external assets. */
function coolingTowerMural(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const pal = ['#b85e50', '#be8655', '#c9a54b', '#458f96', '#6a7478', '#a4a798'];
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(0, 0, 256, 256);
    // Deliberately coarse: two vertical colour fields and one broad mural band
    // stay readable at diorama scale, unlike fine stripes or stippling.
    ctx.fillStyle = pal[seed % pal.length];
    ctx.fillRect(0, 0, 104, 256);
    ctx.fillStyle = pal[(seed + 3) % pal.length];
    ctx.fillRect(162, 0, 94, 256);
    ctx.fillStyle = pal[(seed + 2) % pal.length];
    ctx.fillRect(0, 74, 256, 84);
    for (let i = 0; i < 5; i++) {
      const fx = 26 + i * 52;
      ctx.fillStyle = i % 2 ? '#2b3a42' : '#e8dfcd';
      ctx.beginPath();
      ctx.arc(fx, 116, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(fx - 15, 136, 30, 34);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 158, 256, 9);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-24, 206);
    ctx.lineTo(280, 96);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Orlando Towers, enhanced in place on top of the base builder: painted cooling
 * towers, a dense grid of colourful township homes, a marked soccer pitch,
 * power-line pylons, parked cars and drifting dust.
 */
export function orlando(): THREE.Group {
  const g = orlandoBase();
  const pal = ['#b85e50', '#be8655', '#c9a54b', '#458f96', '#6a7478', '#a4a798'];

  // Deepen the hourglass profile of both lathe-built towers, then wrap each in
  // a coarse mural. Concrete rims at the waist and lip make the curve legible.
  const towerRims = new THREE.Group();
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
      o.material = new THREE.MeshStandardMaterial({
        map: coolingTowerMural(tower++),
        roughness: 0.78,
        ...surfaceDetail('plaster', 0.015),
        side: THREE.DoubleSide,
      });
      const rimMat = M('#a4a798', 0.86, 0.06);
      add(
        towerRims,
        new THREE.TorusGeometry(0.83, 0.035, 6, 40).rotateX(Math.PI / 2),
        rimMat,
        o.position.x,
        2.92,
        0
      );
      add(
        towerRims,
        new THREE.TorusGeometry(1.93, 0.045, 6, 48).rotateX(Math.PI / 2),
        rimMat,
        o.position.x,
        5.64,
        0
      );
    }
  });
  g.add(mergeByMaterial(towerRims));

  // Sky platform: a clear deck with a contrasting handrail, trussed underside
  // and short hangers up to the tower rims.
  const deckY = 4.98;
  add(g, CB(2.6, 0.09, 0.66, 0.015), M('#3d444e', 0.55, 0.5), 0, deckY, 0);
  add(g, CB(2.6, 0.05, 0.72, 0.012), M('#d8d4ca', 0.85), 0, deckY + 0.07, 0);
  const railV: number[] = [];
  [-0.33, 0.33].forEach((z) => {
    railV.push(-1.25, deckY + 0.42, z, 1.25, deckY + 0.42, z);
    for (let i = 0; i <= 6; i++) {
      const x = -1.25 + i * (2.5 / 6);
      railV.push(x, deckY + 0.11, z, x, deckY + 0.42, z);
    }
  });
  g.add(lines(railV, '#e8ecef'));
  const trussV: number[] = [];
  for (let i = 0; i < 6; i++) {
    const x = -1.2 + i * 0.4;
    trussV.push(x, deckY - 0.05, 0, x + 0.4, deckY - 0.26, 0);
    trussV.push(x + 0.4, deckY - 0.26, 0, x + 0.8, deckY - 0.05, 0);
  }
  g.add(lines(trussV, '#7b818b'));
  const hangerV: number[] = [];
  [-1, 1].forEach((s) => hangerV.push(s * 1.22, deckY + 0.12, 0, s * 2.02, 5.58, 0));
  g.add(lines(hangerV, '#3a3d44'));

  // Dense instanced township grid, skipping the towers, the ring road and the
  // patch of ground reserved for the soccer pitch.
  const houseT: InstanceTransform[] = [];
  const roofT: InstanceTransform[] = [];
  for (let ix = -4; ix <= 4; ix++) {
    for (let iz = -4; iz <= 4; iz++) {
      const x = ix * 1.45 + (R(ix * 9 + iz + 40) - 0.5) * 0.22;
      const z = iz * 1.45 + (R(ix * 3 + iz * 7 + 40) - 0.5) * 0.22;
      const rad = Math.hypot(x, z);
      if (rad > 6.9 || (rad > 4.35 && rad < 5.35)) continue;
      if (Math.hypot(x + 2.4, z) < 1.7 || Math.hypot(x - 2.4, z) < 1.7) continue;
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

  // Soccer pitch painted inside the township loop, with a centre circle.
  const pz = 3.5;
  const hw = 1.8;
  const hd = 1.1;
  add(g, CB(hw * 2 + 0.16, 0.03, hd * 2 + 0.16, 0.01), M('#4f7a3c', 0.95), 0, 0.225, pz);
  const lv: number[] = [];
  const yL = 0.245;
  lv.push(-hw, yL, pz - hd, hw, yL, pz - hd);
  lv.push(-hw, yL, pz + hd, hw, yL, pz + hd);
  lv.push(-hw, yL, pz - hd, -hw, yL, pz + hd);
  lv.push(hw, yL, pz - hd, hw, yL, pz + hd);
  lv.push(0, yL, pz - hd, 0, yL, pz + hd);
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2;
    const a1 = ((i + 1) / 16) * Math.PI * 2;
    lv.push(0.42 * Math.cos(a0), yL, pz + 0.42 * Math.sin(a0));
    lv.push(0.42 * Math.cos(a1), yL, pz + 0.42 * Math.sin(a1));
  }
  g.add(lines(lv, '#f4f4f2'));

  // Lattice power pylons with a sagging span of overhead wire.
  const pylon = (x: number, z: number, h: number) => {
    const v: number[] = [];
    [-0.28, 0.28].forEach((s) => v.push(x + s, 0.2, z, x + s * 0.2, h, z));
    for (let i = 0; i < 5; i++) {
      const ya = 0.2 + (h - 0.2) * (i / 5);
      const yb = 0.2 + (h - 0.2) * ((i + 1) / 5);
      const wa = 0.28 * (1 - i / 5) + 0.05;
      const wb = 0.28 * (1 - (i + 1) / 5) + 0.05;
      v.push(x - wa, ya, z, x + wb, yb, z, x + wa, ya, z, x - wb, yb, z);
      v.push(x - wa, ya, z, x + wa, ya, z);
    }
    v.push(x - 0.7, h - 0.2, z, x + 0.7, h - 0.2, z);
    v.push(x - 0.45, h - 0.55, z, x + 0.45, h - 0.55, z);
    g.add(lines(v, '#666b74'));
  };
  const pylons: Array<[number, number, number]> = [
    [-6.2, 2.6, 2.9],
    [5.8, 3.4, 2.7],
    [-5.4, -4.6, 2.5],
  ];
  pylons.forEach(([x, z, h]) => pylon(x, z, h));
  const wire = (a: [number, number, number], b: [number, number, number]) => {
    const v: number[] = [];
    for (let i = 0; i < 12; i++) {
      const u0 = i / 12;
      const u1 = (i + 1) / 12;
      const y0 = a[2] + (b[2] - a[2]) * u0 - 0.45 * Math.sin(u0 * Math.PI);
      const y1 = a[2] + (b[2] - a[2]) * u1 - 0.45 * Math.sin(u1 * Math.PI);
      v.push(
        a[0] + (b[0] - a[0]) * u0, y0, a[1] + (b[1] - a[1]) * u0,
        a[0] + (b[0] - a[0]) * u1, y1, a[1] + (b[1] - a[1]) * u1
      );
    }
    g.add(lines(v, '#3a3d44'));
  };
  wire([-6.2, 2.6, 2.7], [5.8, 3.4, 2.5]);
  wire([-6.2, 2.6, 2.35], [5.8, 3.4, 2.15]);

  // A few cars parked along the estate roads and a scatter of dusty stones.
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
