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
  orlando,
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
  MCascade,
  MPlaster,
  MStone,
  MT,
  MWater,
  MWet,
  MWood,
  R,
  rock,
  scatterRocks,
  sea,
  seaRings,
  swayItems,
  tint,
  tree,
  type InstanceTransform,
} from './primitives';
import { applyDioramaUpgrade } from './dioramaKit';

export function augrabies(): THREE.Group {
  const g = new THREE.Group();
  const wm = MCascade('#e6f6ff', 0.88);
  const cm = MT('#f6fbff', 0.58, 0.98, 0, false);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#87745e', 0.94), 0, 0.1, 0);
  add(g, C(2.75, 2.75, 0.06, 48), MWater('#3394b4', 0.09, 0.25), 0, 0.22, 0);
  for (let i = 0; i < 9; i++) {
    if (i === 4) continue;
    const a = Math.PI + 0.35 + i * 0.3;
    rock(
      g,
      1 + R(i) * 0.4,
      1.7 + R(i + 3) * 0.4,
      3 + R(i + 5) * 2,
      4.4 * Math.cos(a),
      4.4 * Math.sin(a),
      '#7f6656',
      '#c5a592',
      0.14
    );
  }
  rock(g, 1.3, 1.7, 4.2, 0, -5.4, '#7f6656', '#c5a592', 0.12);
  // Twin braided Orange River waterfall chutes
  add(g, CB(0.68, 4.0, 0.1, 0.03), wm, 0, 2.2, -3.95);
  add(g, CB(0.28, 3.2, 0.08, 0.02), wm, -0.78, 1.85, -3.72);
  const ms = Array.from({ length: 6 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.55, 12, 10),
      cm,
      (R(i) - 0.5) * 1.4,
      0.5 + R(i + 3) * 0.3,
      -3.3 + R(i + 5) * 0.5
    );
    o.scale.y = 0.5;
    o.userData.x = o.position.x;
    return o;
  });
  const wf = drift(g, 120, '#eaf6ff', 0.1, (i, t) => {
    const u = (t * 0.9 + R(i)) % 1;
    return [(R(i + 3) - 0.5) * 0.72, 4.2 - u * 3.9, -4 + (R(i + 4) - 0.5) * 0.2 + u * 0.2];
  });
  const sr = seaRings(g, 0.26, 1.2, 4);
  const bd = birds(g, 3, 3.5, 6);
  for (let i = 0; i < 6; i++) {
    const q = 0.4 + i * 0.5;
    tree(g, 5.6 * Math.cos(q), 5.6 * Math.sin(q), 1, 2, 0);
  }
  g.userData.tick = (t: number) => {
    wf(t);
    sr(t);
    bd(t);
    ms.forEach((o, i) => {
      o.position.x = (o.userData.x as number) + Math.sin(t * 0.5 + i) * 0.12;
      o.scale.y = 0.5 + 0.08 * Math.sin(t * 0.8 + i);
    });
  };
  return g;
}

export function salt(): THREE.Group {
  const g = new THREE.Group();
  const wh = M('#f0f2f4', 0.32, 0.48);
  const dk = M('#242730', 0.5, 0.55);
  const mir = M('#9ec4e0', 0.14, 0.85);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#a59268', 0.96), 0, 0.1, 0);
  add(g, C(2.2, 2.4, 0.5, 48), MStone('#cbc3b2', 0.82), 0, 0.45, 0);

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
      M('#b8bec8', 0.3, 0.7),
      0,
      0.35 + i * 0.42,
      0
    );
  }
  add(en, CB(0.54, 1.5, 0.14, 0.02), dk, 0, 2.4, 1.42);
  add(en, C(0.22, 0.22, 0.04, 6).rotateX(Math.PI / 2), mir, 0, 2.25, 1.48);
  add(en, C(0.3, 0.3, 0.4, 16), M('#c8342d', 0.45), 0, 3.9, 0);
  add(en, new THREE.SphereGeometry(0.08, 10, 8), G('#ff4a3a', 2.0), 0, 4.18, 0);

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
      '#4a4036',
      '#6a5e50',
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
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.32, 1), Mc('#7a7d4a'), scrubT, [
    '#8a8a5a',
    '#6f7a4a',
  ]);
  g.userData.tick = (t: number) => {
    en.rotation.y = t * 0.15;
  };
  return g;
}

export function bloukrans(): THREE.Group {
  const g = new THREE.Group();
  const cn = MStone('#dad5c8', 0.76, 0.016);
  const roadMat = MWet('#3c4048', 0.84, 0.15, 0.05, 'plaster');
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#665646', 0.95), 0, 0.1, 0);
  add(g, CB(1.85, 0.08, 12, 0.02), MWater('#3394b4', 0.09, 0.25), 0, 0.24, 0);
  [-5.2, 5.2].forEach((x) => {
    rock(g, 1.9, 2.4, 4.6, x, 0, '#6b5a4a', '#4d7a38', 0.11);
    rock(g, 1.5, 2, 3.8, x * 1.05, -3.8, '#6b5a4a', '#4d7a38', 0.11);
    rock(g, 1.5, 2, 3.4, x * 1.05, 3.8, '#6b5a4a', '#4d7a38', 0.11);
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
    add(g, CB(11, 0.22, 0.05, 0.01), M('#9ca2aa', 0.42, 0.65), 0, 4.92, z)
  );
  for (let i = 0; i < 8; i++) {
    tree(g, (i % 2 ? 5.2 : -5.2) + (R(i) - 0.5) * 1.2, (R(i + 5) - 0.5) * 2.4, 1.1, 1, 4.6);
  }
  const jp = add(g, new THREE.SphereGeometry(0.1, 10, 8), M('#ff3b3b', 0.4), 0, 4.6, 0);
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
    '#e4f4ff',
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
  const lo = new THREE.Color('#8a9a4a');
  const hi = new THREE.Color('#6b5f45');
  const mid = new THREE.Color('#5a8638');
  add(
    g,
    tint(ge, (k, _X, Y, Z) =>
      Y < 0.6
        ? k.copy(lo).lerp(mid, Y / 0.6)
        : k
            .copy(mid)
            .lerp(hi, Math.min(1, (Y - 0.6) / 1.8))
            .multiplyScalar(0.9 + 0.1 * Math.sin(Y * 30 + Math.atan2(Z, _X) * 5))
    ),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      bumpMap: MStone('#6b5f45').bumpMap,
      bumpScale: 0.028,
      side: THREE.DoubleSide,
    })
  );
  add(
    g,
    new THREE.CircleGeometry(1.5, 48).rotateX(-Math.PI / 2),
    MWater('#2888a6', 0.1, 0.25),
    0,
    0.09,
    0
  );
  const an = Array.from({ length: 9 }, (_, i) => {
    const o = animal(i % 3 ? '#6b4a32' : '#8a8a8e');
    g.add(o);
    return o;
  });
  for (let i = 0; i < 14; i++) {
    const q = i * 0.45;
    tree(g, 2.8 * Math.cos(q), 2.8 * Math.sin(q), 0.72, 2, 0.25);
  }
  const dd = drift(g, 40, '#ffd88a', 0.06, (i, t) => [
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
  const wh = MPlaster('#f4f2ec', 0.72);
  const st = MStone('#d8cfb8', 0.85);
  const dk = M('#2b2d34', 0.48, 0.55);
  const rf = MPlaster('#7b5a3c', 0.78);
  sea(g, '#186a8c', '#2fa1b3');
  add(g, C(4, 4.4, 0.3, 64), MStone('#b8a87b', 0.95), -0.3, 0.15, 0.2);
  // Limestone quarry floor
  add(g, C(0.92, 0.92, 0.03, 32), MStone('#c8c4b4', 0.95), 1.6, 0.32, 1.4);

  // 1865 Robben Island Lighthouse + rotating beam
  add(g, C(0.18, 0.28, 1.6, 24), wh, -2.2, 1.1, 0.4);
  add(g, C(0.3, 0.3, 0.08, 24), dk, -2.2, 1.94, 0.4);
  add(g, C(0.16, 0.16, 0.3, 16), G('#fff3b0', 2.5), -2.2, 2.13, 0.4);
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

  // Prison perimeter walls, watchtower & pitched-roof cell block
  [
    [1, -1.3, 2.4, 0.08],
    [1, 0.3, 2.4, 0.08],
  ].forEach(([x, z, w, d]) => add(g, CB(w, 0.35, d, 0.015), st, x, 0.47, z));
  [
    [-0.2, -0.5],
    [2.2, -0.5],
  ].forEach(([x, z]) => add(g, CB(0.08, 0.35, 1.6, 0.015), st, x, 0.47, z));
  add(g, CB(1.8, 0.3, 0.42, 0.02), st, 1, 0.47, -0.8);
  add(g, gableRoofGeo(1.8, 0.44, 0.2, 0.06), rf, 1, 0.62, -0.8);
  add(g, C(0.1, 0.12, 0.8, 8), st, 2.2, 0.7, 0.3);
  add(g, CB(0.28, 0.2, 0.28, 0.02), dk, 2.2, 1.2, 0.3);
  add(g, CB(0.5, 0.3, 0.4, 0.02), wh, -1.2, 0.45, 1.6);
  add(g, new THREE.ConeGeometry(0.35, 0.3, 4), rf, -1.2, 0.75, 1.6).rotation.y = Math.PI / 4;

  // Batched island coastal fynbos
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 18; i++) {
    const a = R(i) * 6.28;
    const r = R(i + 4) * 3.4;
    bushT.push({
      x: -0.3 + r * Math.cos(a),
      y: 0.35,
      z: 0.2 + r * Math.sin(a),
      sx: 0.45,
      sy: 0.28,
      sz: 0.45,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.3, 1), Mc('#7a8a5a'), bushT, [
    '#7a8a5a',
    '#9a9a6a',
  ]);

  const bt = boat('#3d6fa8', 1.0);
  g.add(bt);
  const sr = seaRings(g, 0.12, 3.6, 3);
  const bd = birds(g, 4, 3.5, 5);
  g.userData.tick = (t: number) => {
    bm.rotation.y = t * 1.1;
    const a = t * 0.18;
    bt.position.set(6.4 * Math.cos(a), 0.1, 6.4 * Math.sin(a));
    bt.rotation.y = -a - Math.PI / 2;
    sr(t);
    bd(t);
  };
  return g;
}

export function chapman(): THREE.Group {
  const g = new THREE.Group();
  sea(g, '#166084', '#299cb0');
  rock(g, 3.2, 4.6, 6, 0, -1.8, '#665442', '#9d8a68', 0.11);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 40; i++) {
    const a = -1.3 + (i * 2.6) / 39;
    const y = 2.4 + 0.5 * Math.sin(i * 0.5);
    const r = 4.6 - 0.233 * y + 0.5;
    pts.push(new THREE.Vector3(r * Math.sin(a), y, -1.8 + r * Math.cos(a)));
  }
  const cv = new THREE.CatmullRomCurve3(pts);
  add(g, new THREE.TubeGeometry(cv, 140, 0.13, 6), M('#383a40', 0.85));
  const cs = [0, 1, 2].map((i) => {
    const c = car(['#c33', '#fff', '#36c'][i], 0.35);
    g.add(c);
    return c;
  });
  add(g, C(3.1, 3.2, 0.1, 48), MStone('#5c7238', 0.94), 0, 6.03, -1.8);
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
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.32, 1), Mc('#5a7a3a'), bushT, [
    '#5a7a3a',
    '#8a6a3a',
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
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#a49654', 0.96), 0, 0.1, 0);
  rock(g, 1.3, 3.4, 4.4, 0, -3, '#695b45', '#b09866', 0.18);
  rock(g, 1.1, 2.2, 2.2, 2.6, -3.4, '#695b45', '#a08a58', 0.18);
  rock(g, 0.9, 1.8, 1.6, -2.6, -3.6, '#695b45', '#a08a58', 0.18);

  // Batched 46 white stone battle cairns (1 draw call!)
  const cairnT: InstanceTransform[] = [];
  for (let i = 0; i < 46; i++) {
    cairnT.push({ x: (R(i) - 0.5) * 7, y: 0.28, z: -1 + R(i + 9) * 3.4 });
  }
  instancedMeshes(g, new THREE.ConeGeometry(0.075, 0.15, 6), MStone('#f2efe6', 0.85), cairnT);

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
  grassTufts(g, grassT, ['#c9b45a', '#b69c46', '#9a8e42']);

  g.userData.tick = drift(g, 60, '#e0c890', 0.08, (i, t) => [
    R(i) * 10 - 5 + Math.sin(t * 0.3 + i) * 0.4,
    0.4 + ((R(i + 3) * 2 + t * 0.25) % 2),
    R(i + 5) * 8 - 3 + Math.cos(t * 0.2 + i) * 0.3,
  ]);
  return g;
}

export function gariep(): THREE.Group {
  const g = new THREE.Group();
  const cn = MStone('#ccc7bb', 0.82, 0.016);
  const wm = MCascade('#eaf6ff', 0.86);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#887e5e', 0.96), 0, 0.1, 0);
  add(g, CB(10, 0.1, 5.2, 0.02), MWater('#2585a4', 0.09, 0.25), 0, 1.6, -3.2);
  add(g, CB(3.2, 0.06, 5, 0.02), MWater('#2585a4', 0.09, 0.25), 0, 0.24, 3.4);

  // True curved arch-gravity concrete dam wall + chamfered crest roadway
  const wallMat = MStone('#cfc9bd', 0.82);
  wallMat.side = THREE.DoubleSide;
  add(g, C(5.2, 5.4, 1.65, 48, 1, true, Math.PI * 0.72, Math.PI * 0.56), wallMat, 0, 1.0, 4.9);
  add(g, C(5.32, 5.32, 0.14, 48, 1, false, Math.PI * 0.72, Math.PI * 0.56), cn, 0, 1.88, 4.9);

  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 0.86 + (i / 5) * (Math.PI * 0.28);
    const sx = Math.sin(a) * 5.28;
    const sz = 4.9 + Math.cos(a) * 5.28;
    const gate = add(g, CB(0.55, 1.0, 0.16, 0.02), M('#4b525c', 0.45, 0.65), sx, 1.38, sz);
    gate.rotation.y = a;
    const jet = add(g, CB(0.32, 1.15, 0.08, 0.02), wm, sx, 0.98, sz + 0.12);
    jet.rotation.y = a;
  }

  rock(g, 1.6, 2.4, 3, -5.3, -1, '#7b6a4a', '#a89868', 0.14);
  rock(g, 1.8, 2.6, 3.4, 5.3, -0.6, '#7b6a4a', '#a89868', 0.14);
  for (let i = 0; i < 6; i++) tree(g, -3 + i * 1.2, 5.2 + R(i), 0.9, 2, 0.2);
  const bd = birds(g, 3, 3.2, 6);
  const mist = drift(g, 110, '#eaf6ff', 0.1, (i, t) => {
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
  const gr = MStone('#6c863c', 0.94);
  const mt = M('#8f5d38', 0.36, 0.74);
  const bn = M('#f0e9d6', 0.58);
  const cs = MWet('#cdc7ba', 0.84, 0.18, 0.04, 'stone');
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#a49654', 0.96), 0, 0.1, 0);
  add(
    g,
    new THREE.SphereGeometry(3.2, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    gr,
    0,
    0.2,
    -0.3
  ).scale.set(1, 0.45, 1);
  add(g, C(0.5, 0.5, 0.04, 24), MT('#8fd0e0', 0.72, 0.1, 0.6), 0, 1.62, -0.3);
  add(g, new THREE.TorusGeometry(0.8, 0.06, 8, 24, Math.PI), mt, 0, 0.2, 2.45);
  add(g, CB(1.4, 0.05, 1.2, 0.015), cs, 0, 0.22, 3.1);
  add(g, CB(0.52, 0.36, 0.52, 0.03), cs, 0.9, 0.4, 3.7);
  add(g, new THREE.SphereGeometry(0.14, 16, 12), bn, 0.9, 0.72, 3.7).scale.set(1, 0.9, 1.1);
  add(g, CB(1.7, 0.05, 1.1, 0.015), MStone('#4a3a2a', 0.96), -4, 0.22, 0.8);
  const ln: number[] = [];
  for (let i = 0; i < 5; i++) ln.push(-4.85, 0.25, 0.3 + i * 0.22, -3.15, 0.25, 0.3 + i * 0.22);
  for (let i = 0; i < 7; i++) ln.push(-4.85 + i * 0.28, 0.25, 0.25, -4.85 + i * 0.28, 0.25, 1.35);
  g.add(lines(ln, '#c9b48a'));
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
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#b29654', 0.96), 0, 0.1, 0);
  rock(g, 1.8, 2.7, 3.4, -0.6, -0.6, '#9c6c39', '#da9e63', 0.12, 0.2);
  rock(g, 1, 1.5, 2, 1.9, -2.7, '#9c6c39', '#da9e63', 0.12, 0.2);
  const cv = new THREE.CatmullRomCurve3(
    [
      [-7, 0.55, 2],
      [-3, 0.55, 3.5],
      [1, 0.55, 4],
      [4, 0.55, 2.5],
      [7, 0.55, 3],
    ].map((p) => new THREE.Vector3(...p))
  );
  add(g, new THREE.TubeGeometry(cv, 60, 0.35, 8), MWater('#3394b4', 0.09, 0.25)).scale.y = 0.35;
  const rh = animal('#e6b842');
  rh.scale.setScalar(1.4);
  rh.position.set(-0.6, 3.6, -0.6);
  g.add(rh);
  add(rh, new THREE.ConeGeometry(0.012, 0.08, 6), gd, 0.17, 0.2, 0).rotation.z = -0.5;
  [
    [-4.5, 1.2, 1.2],
    [4, -0.5, 1],
    [2.8, 2, 0.8],
  ].forEach(([x, z, s]) => {
    add(g, C(0.22 * s, 0.32 * s, 1.1 * s, 14), MWood('#8a7a64', 0.95), x, 0.2 + 0.55 * s, z);
    for (let k = 0; k < 3; k++) {
      add(
        g,
        new THREE.IcosahedronGeometry(0.28 * s, 1),
        Mc(k % 2 ? '#6f8f3a' : '#8aa04a'),
        x + (k - 1) * 0.25 * s,
        1.35 * s + 0.2 + k * 0.05,
        z
      );
    }
  });
  for (let i = 0; i < 4; i++) tree(g, -5 + i * 3, -4.4, 1, 2, 0.2);
  const sp = drift(g, 14, '#ffd86a', 0.1, (i, t) => [
    -0.6 + Math.sin(t * 2 + i) * 0.5,
    3.8 + Math.cos(t * 1.5 + i) * 0.3,
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
  const a = new THREE.Color('#d9733a');
  const b = new THREE.Color('#a4401d');
  const c = new THREE.Color('#f0a260');
  add(
    g,
    tint(rg, (k, X, Y, Z) => {
      const sd = Math.cos(X * 0.9 + Math.sin(-Z * 0.45) * 1.6);
      k.copy(sd > 0 ? a : b).lerp(c, Math.max(0, Y - 0.55) * 0.8);
    }),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      bumpMap: MStone('#d9733a').bumpMap,
      bumpScale: 0.018,
    })
  );
  [
    [-3, 1],
    [2.5, -2],
    [4, 2.5],
  ].forEach(([x, z]) => tree(g, x, z, 1, 2, hf(x, -z)));
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
  const rd = M('#c8342d', 0.42, 0.55);
  sea(g, '#166b8d', '#2ca4b6');
  [-4.6, 4.6].forEach((x) => {
    rock(g, 1.9, 2.6, 3.6, x, 0, '#5a4a3a', '#4d7a38', 0.12);
    rock(g, 1.5, 2.1, 2.8, x * 1.1, -3.6, '#5a4a3a', '#4d7a38', 0.12);
    rock(g, 1.5, 2.1, 2.4, x * 1.1, 3.4, '#5a4a3a', '#4d7a38', 0.12);
  });
  add(g, CB(5.4, 0.09, 0.38, 0.02), MWood('#8a6846', 0.84), 0, 1.5, 0);
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
  g.add(lines(v, '#e8e8e8'));
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
      '#5a4a3a',
      '#7a6a5a',
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
  const wh = MPlaster('#f4f1e8', 0.72);
  const th = MWood('#7e6c3f', 0.94);
  const gn = MWood('#2a5536', 0.74);
  const wn = G('#ffd98a', 1);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#729244', 0.95), 0, 0.1, 0);
  // Chamfered Manor House + klompje-brick front stoep + thatched pitched roofs + Baroque Cape Dutch gable
  add(g, CB(3.6, 0.1, 1.5, 0.02), MStone('#9e5a3e', 0.88), 0, 0.23, 0.15);
  add(g, CB(3.2, 0.9, 1.2, 0.03), wh, 0, 0.65, 0);
  [-1, 1].forEach((s) => add(g, CB(1, 0.8, 1.6, 0.03), wh, s * 2.1, 0.6, -0.2));
  add(g, gableRoofGeo(3.2, 1.2, 0.8, 0.12), th, 0, 1.1, 0);
  [-1, 1].forEach((s) => add(g, gableRoofGeo(1.0, 1.6, 0.5, 0.08), th, s * 2.1, 0.98, -0.2));
  add(g, capeDutchGableGeo(1.25, 0.98, 0.16), wh, 0, 1.1, 0.58);

  [-1.25, -0.85, 0.85, 1.25, -2.1, 2.1].forEach((x) => {
    add(g, CB(0.24, 0.4, 0.04, 0.01), wn, x, 0.7, 0.62);
    [-1, 1].forEach((s) => add(g, CB(0.09, 0.4, 0.04, 0.01), gn, x + s * 0.2, 0.7, 0.62));
  });
  add(g, CB(0.4, 0.6, 0.04, 0.01), MWood('#3a2a22', 0.72), 0, 0.5, 0.62);

  // Instanced Constantia vineyard trellis rows + vine foliage (2 draw calls total!)
  const vineRowT: InstanceTransform[] = [];
  const stakeT: InstanceTransform[] = [];
  for (let r = 0; r < 8; r++) {
    const z = 2.4 + r * 0.5;
    vineRowT.push({ x: 0, y: 0.34, z });
    for (let sx = -2.4; sx <= 2.4; sx += 0.8) {
      stakeT.push({ x: sx, y: 0.28, z });
    }
  }
  instancedMeshes(g, CB(5.0, 0.2, 0.16, 0.04), Mc('#477829'), vineRowT, [
    '#477829',
    '#578935',
    '#3e6b24',
  ]);
  instancedMeshes(g, C(0.02, 0.025, 0.36, 5), MWood('#5c442d', 0.9), stakeT);

  rock(g, 2.6, 4.4, 3.6, 0, -6, '#4d5d6b', '#7c8b99', 0.1);
  [
    [-4.5, 2, 1.4],
    [4.6, 1.5, 1.4],
    [-3, -3.2, 1.3],
    [3.2, -3, 1.3],
    [0, -3.4, 1.2],
  ].forEach(([x, z, s], idx) => tree(g, x, z, s, idx % 2 ? 1 : 4, 0.2));
  g.userData.tick = birds(g, 4, 3.5, 6);
  return g;
}

export function hermanus(): THREE.Group {
  const g = new THREE.Group();
  sea(g, '#166a8e', '#2ea6b8');
  rock(g, 2.4, 3.8, 3.2, -3.6, -1.2, '#76644c', '#b29a72', 0.12);
  rock(g, 1.8, 2.8, 2.4, -4.2, 2.4, '#76644c', '#aa9066', 0.12);
  add(g, C(2.3, 2.35, 0.1, 40), MStone('#657938', 0.95), -3.6, 3.22, -1.2);
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
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.32, 1), Mc('#5a7a3a'), bushT, [
    '#5a7a3a',
    '#8a6a3a',
  ]);
  const whale = (s: number) => {
    const w = new THREE.Group();
    const m = M('#424c58', 0.45, 0.15);
    add(w, new THREE.SphereGeometry(0.5, 24, 16), m, 0, 0, 0).scale.set(1.9, 0.7, 0.7);
    add(w, new THREE.SphereGeometry(0.3, 16, 12), m, 0.7, -0.04, 0).scale.set(1.2, 0.8, 0.9);
    const f = new THREE.Shape();
    f.moveTo(0, 0.04);
    f.lineTo(-0.24, 0.36);
    f.lineTo(-0.12, 0);
    f.lineTo(-0.24, -0.36);
    f.lineTo(0, -0.04);
    f.closePath();
    const fm = M('#38424e', 0.45, 0.15);
    fm.side = THREE.DoubleSide;
    add(w, new THREE.ShapeGeometry(f).rotateX(-Math.PI / 2), fm, -0.95, 0, 0);
    [-1, 1].forEach((z) =>
      add(w, new THREE.SphereGeometry(0.14, 10, 8), m, 0.35, -0.2, z * 0.32).scale.set(
        1.6,
        0.3,
        0.7
      )
    );
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
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#c6b484', 0.95), 0, 0.1, 0);
  add(g, C(4.6, 4.6, 0.06, 64), MWater('#28859b', 0.09, 0.25), 0, 0.22, 0.6);
  rock(g, 2.6, 4.6, 2.2, 0, -5.3, '#c4a468', '#e6cf98', 0.12);
  rock(g, 1.8, 3.2, 1.6, -5.2, -2.4, '#c4a468', '#e6cf98', 0.12);
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
  instancedMeshes(g, new THREE.ConeGeometry(0.032, 0.52, 4), Mc('#768846'), reedT, [
    '#768846',
    '#60753a',
    '#8b964c',
  ]);

  const hp = (
    [
      [-1, 0.2, 0],
      [1.2, 1.3, 1],
      [0.2, 2.4, 2],
    ] as const
  ).map(([x, z, i]) => {
    const h = new THREE.Group();
    const m = M('#74646a', 0.65);
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
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#5e7242', 0.95), 0, 0.1, 0);
  rock(g, 2.5, 4.3, 6.2, 0, -2, '#5a4a3a', '#8c7a62', 0.11);
  // Flanking Drakensberg escarpment ridges & alpine gorge stream
  rock(g, 1.3, 2.4, 4.6, -3.5, -2.7, '#4c463b', '#83735d', 0.14);
  rock(g, 1.2, 2.2, 4.1, 3.4, -2.5, '#4c463b', '#83735d', 0.14);
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
  add(g, new THREE.TubeGeometry(cv, 200, 0.08, 5), MStone('#8a7456', 0.95));
  // Snow-dusted 2,876 m escarpment rim + stone/pitched-roof Sani Mountain Lodge
  add(g, C(2.55, 2.6, 0.12, 40), M('#f4f7fc', 0.65), 0, 6.25, -2);
  add(g, CB(0.52, 0.28, 0.42, 0.02), MPlaster('#e8e2d2', 0.8), 0.3, 6.4, -2.3);
  add(g, gableRoofGeo(0.54, 0.44, 0.18, 0.04), MPlaster('#a8452a', 0.7), 0.3, 6.53, -2.3);
  add(g, CB(0.14, 0.12, 0.03, 0.005), G('#ffd58a', 1.1), 0.3, 6.4, -2.08);
  const tuftT: InstanceTransform[] = [];
  for (let i = 0; i < 55; i++) {
    const a = R(i + 20) * 6.2832;
    const r = 3.2 + R(i + 80) * 3.8;
    tuftT.push({ x: r * Math.cos(a), y: 0.2, z: r * Math.sin(a), ry: R(i * 7) * 6.28, sy: 1.1 });
  }
  grassTufts(g, tuftT, ['#4d6e35', '#688240', '#8d8746']);
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
  const bk = MWood('#b49262', 0.9);
  const lf = Mc('#729262');
  const V = (a: number, b: number, c: number) => new THREE.Vector3(a, b, c);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#ad7c4b', 0.96), 0, 0.1, 0);
  [
    [-4.6, -2.6, 1.6, 2.4, 3],
    [4.4, -3, 1.4, 2.2, 2.6],
    [0, -5, 1.8, 2.8, 3.4],
    [-3, 3.6, 0.9, 1.4, 1.4],
  ].forEach(([x, z, a, b, h]) => rock(g, a, b, h, x, z, '#6b4a36', '#b0805a', 0.14, 0.2));

  // Batched rugged desert scree boulders
  const screeT: InstanceTransform[] = [];
  for (let i = 0; i < 30; i++) {
    const a = R(i) * 6.28;
    const r = 1 + R(i + 9) * 5;
    const s = 0.35 + R(i + 2) * 0.32;
    screeT.push({ x: r * Math.cos(a), y: 0.24, z: r * Math.sin(a), sx: s, sy: s * 0.8, sz: s });
  }
  scatterRocks(g, screeT, '#785a40', '#a6825c');

  const bar = (p: THREE.Vector3, q: THREE.Vector3, r: number) => {
    const d = q.clone().sub(p);
    const m = new THREE.Mesh(C(r * 0.7, r, d.length(), 6), bk);
    m.position.copy(p).add(q).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    return m;
  };
  const qt = (x: number, z: number, s: number) => {
    const t = new THREE.Group();
    t.position.set(x, 0.2, z);
    t.scale.setScalar(s);
    g.add(t);
    t.add(bar(V(0, 0, 0), V(0, 1.1, 0), 0.13));
    const cr = new THREE.Group();
    t.add(cr);
    const fk = (p: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, dep: number) => {
      const q = p.clone().add(dir.clone().multiplyScalar(len));
      t.add(bar(p, q, r));
      if (dep < 2) {
        [-1, 1].forEach((sg) =>
          fk(
            q,
            dir
              .clone()
              .applyAxisAngle(V(0, 0, 1), sg * 0.55)
              .applyAxisAngle(V(0, 1, 0), dep * 1.3 + sg),
            len * 0.72,
            r * 0.7,
            dep + 1
          )
        );
      } else {
        for (let k = 0; k < 6; k++) {
          const c = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.32, 4), lf);
          c.position.copy(q);
          c.rotation.set((k - 2.5) * 0.5, k * 1.2, ((k % 3) - 1) * 0.6);
          c.position.y += 0.1;
          cr.add(c);
        }
      }
    };
    fk(V(0, 1.1, 0), V(0, 1, 0), 0.8, 0.09, 0);
    swayItems.push({ o: cr, ph: x * 3, a: 0.04, sp: 1.1 });
  };
  [
    [-1.5, 0.6, 1.3],
    [1.4, -0.4, 1.6],
    [2.8, 1.8, 1.1],
    [-3, -0.5, 1.2],
    [0, 2.5, 0.9],
    [-0.6, -2, 1.4],
  ].forEach(([x, z, s]) => qt(x, z, s));
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
  const lo = new THREE.Color('#c8ae5e');
  const md = new THREE.Color('#6a8638');
  const hi = new THREE.Color('#8a7858');
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
      bumpMap: MStone('#8a7858').bumpMap,
      bumpScale: 0.025,
      side: THREE.DoubleSide,
    })
  );
  const mt = add(g, new THREE.SphereGeometry(0.12, 12, 10), G('#ffb060', 3), 0, -9, 0);
  const tl = Array.from({ length: 8 }, (_, i) =>
    add(g, new THREE.SphereGeometry(0.1 - i * 0.01, 8, 6), G('#ff7a30', 2), 0, -9, 0)
  );
  const rg = add(
    g,
    new THREE.RingGeometry(0.3, 0.4, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: '#ffd9a0',
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
  const A = new THREE.Vector3(-9, 9, -5);
  const Z = new THREE.Vector3(0, 0.7, 0);
  g.userData.tick = (t: number) => {
    const u = (t % 12) / 12;
    [mt, ...tl].forEach((m, i) => {
      const v = Math.min(1, u / 0.1 - i * 0.03);
      if (u > 0.12 || v <= 0) m.position.y = -9;
      else m.position.lerpVectors(A, Z, v);
    });
    const w = (u - 0.1) / 0.25;
    rg.material.opacity = w > 0 && w < 1 ? 0.7 * (1 - w) : 0;
    rg.scale.setScalar(1 + Math.max(0, w) * 14);
  };
  return g;
}

export function harties(): THREE.Group {
  const g = new THREE.Group();
  const cn = MStone('#ccc7bb', 0.82, 0.015);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#828456', 0.95), 0, 0.1, 0);
  add(g, CB(10, 0.1, 5.4, 0.02), MWater('#2585a4', 0.09, 0.25), 0, 1.55, -3.3);
  add(g, CB(4, 0.06, 5, 0.02), MWater('#2585a4', 0.09, 0.25), 0, 0.24, 3.6);
  const wallMat = MStone('#cfc9bd', 0.82);
  wallMat.side = THREE.DoubleSide;
  add(g, C(4.2, 4.2, 1.6, 64, 1, true, Math.PI * 0.6, Math.PI * 0.8), wallMat, 0, 0.95, 4.1);
  add(g, C(4.3, 4.3, 0.12, 64, 1, false, Math.PI * 0.6, Math.PI * 0.8), cn, 0, 1.8, 4.1);
  // Subtle spillway waterfall ribbon on crest
  add(g, CB(0.85, 1.35, 0.08, 0.02), MCascade('#e6f6ff', 0.85), 0, 0.92, -0.15);

  rock(g, 1.6, 2.8, 3.6, -5, -1, '#7b6a4a', '#a89868', 0.14);
  rock(g, 1.8, 3, 4, 5.2, -1.6, '#7b6a4a', '#a89868', 0.14);
  const A = new THREE.Vector3(-3.4, 0.9, 5.2);
  const Bv = new THREE.Vector3(4.6, 4.3, -1.4);
  g.add(lines([A.x, A.y, A.z, Bv.x, Bv.y, Bv.z], '#222'));
  add(g, CB(0.72, 0.5, 0.62, 0.03), cn, A.x, 0.4, A.z);
  add(g, CB(0.72, 0.4, 0.62, 0.03), cn, Bv.x, Bv.y - 0.3, Bv.z);
  const g1 = gondola('#d33');
  const g2 = gondola('#2a6fd3');
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
    const sm = MT(['#e84a5f', '#f4d35e', '#4ecdc4'][i], 1, 0.7, 0, true);
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
  sea(g, '#166b8e', '#2ea6b8');
  rock(g, 1.9, 3.2, 4, -3.8, -0.4, '#886844', '#cb9f64', 0.12);
  rock(g, 1.7, 2.8, 3.4, 3.6, -0.8, '#886844', '#cb9f64', 0.12);
  add(g, C(1.85, 1.9, 0.1, 40), MStone('#5c7638', 0.94), -3.8, 4.03, -0.4);
  add(g, C(1.65, 1.7, 0.1, 40), MStone('#5c7638', 0.94), 3.6, 3.43, -0.8);
  add(g, CB(7, 0.08, 4.5, 0.02), MWater('#3394b0', 0.09, 0.25), 0, 0.24, -5);
  rock(g, 0.5, 0.8, 0.6, -1.1, 0.8, '#4a4036', '#6a5e50', 0.1);
  rock(g, 0.4, 0.7, 0.5, 1.2, 0.4, '#4a4036', '#6a5e50', 0.1);

  // Eastern Head pitched-roof coastal houses
  for (let i = 0; i < 8; i++) {
    const cx = 3.2 + R(i) * 0.8;
    const cz = -0.8 + (R(i + 3) - 0.5) * 1.2;
    add(
      g,
      CB(0.35, 0.24, 0.3, 0.015),
      MPlaster(['#f4f1e8', '#e8dcc0', '#c8d8e0'][i % 3], 0.78),
      cx,
      3.64,
      cz
    );
    add(g, gableRoofGeo(0.36, 0.31, 0.11, 0.03), MPlaster('#6c5244', 0.8), cx, 3.76, cz);
  }
  for (let i = 0; i < 10; i++) {
    tree(g, -3.8 + (R(i) - 0.5) * 2.2, -0.4 + (R(i + 4) - 0.5) * 2.2, 0.9, 1, 4.05);
  }
  const bt = boat('#3d6fa8', 0.9);
  g.add(bt);
  const sr = seaRings(g, 0.12, 2.6, 3);
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
    bt.position.set(Math.sin(t * 0.7) * 0.25, 0.12, -5 + u * 10.5);
    bt.rotation.y = -Math.PI / 2;
    sr(t);
    spray(t);
    bd(t);
  };
  return g;
}

export function donkin(): THREE.Group {
  const g = new THREE.Group();
  const st = MStone('#d8cfb8', 0.84, 0.02);
  const wh = MPlaster('#f4f2ec', 0.68);
  const dk = M('#2b2d34', 0.48, 0.6);
  const lt = G('#fff3b0', 2.6);
  sea(g, '#1b7a98', '#2da8b8');
  add(g, C(4.6, 5.2, 1.4, 64), MStone('#b6a77b', 0.94), 0, 0.7, 0);
  add(g, C(4.2, 4.4, 0.1, 64), MStone('#749444', 0.95), 0, 1.42, 0);
  // 1820 stone pyramid on chamfered stepped plinth
  add(g, new THREE.ConeGeometry(0.82, 1.6, 4), st, -1, 2.4, 0.4).rotation.y = Math.PI / 4;
  add(g, CB(1.9, 0.12, 1.9, 0.02), st, -1, 1.52, 0.4);
  add(g, CB(1.6, 0.12, 1.6, 0.02), st, -1, 1.6, 0.4);

  // 1861 Donkin Lighthouse + keeper's cottage
  add(g, C(0.26, 0.4, 1.8, 24), wh, 1.6, 2.4, -0.6);
  add(g, C(0.45, 0.4, 0.1, 24), dk, 1.6, 3.35, -0.6);
  add(g, C(0.22, 0.22, 0.35, 16), lt, 1.6, 3.6, -0.6);
  add(g, new THREE.ConeGeometry(0.3, 0.3, 16), dk, 1.6, 3.95, -0.6);
  const bm = new THREE.Group();
  bm.position.set(1.6, 3.6, -0.6);
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
    '#f4f1e8',
    '#e8dcc0',
    '#e8a07a',
    '#a8c8d8',
  ]);
  instancedMeshes(g, gableRoofGeo(0.52, 0.42, 0.14, 0.03), MPlaster('#7a4534', 0.8), roofT);

  for (let i = 0; i < 5; i++) tree(g, -3 + i * 1.1, -1.8 + R(i) * 0.6, 0.8, 1, 1.45);
  const ship = boat('#c8342d', 2.2);
  g.add(ship);
  for (let i = 0; i < 5; i++) {
    add(
      ship,
      CB(0.16, 0.1, 0.2, 0.015),
      M(['#2a6fd3', '#e8a07a', '#4ecdc4', '#c33', '#f4d35e'][i], 0.65),
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
