import * as THREE from 'three';
import {
  add,
  B,
  bird,
  birds,
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
  M,
  Mc,
  MCascade,
  MPlaster,
  MStone,
  MT,
  MWater,
  MWet,
  MWood,
  n,
  R,
  rock,
  rondavel,
  scatterRocks,
  sea,
  seaRings,
  swayItems,
  tint,
  train,
  tree,
  type InstanceTransform,
} from './primitives';

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
    // Carver-like sandstone buttresses & Platteklip Gorge notch around z > 0, x ~ -0.3
    const gorge = Math.exp(-Math.pow((x + 0.35) * 1.4, 2)) * (z > 0 ? 0.16 : 0);
    const ribs = 0.045 * Math.cos(a * 11) * Math.max(0, (y + 1.2) / 2.4);
    const f = 1 + 0.09 * n(a * 3, y * 2) + ribs - gorge;
    p.setXYZ(i, x * f, y + 0.045 * n(x * 2, z * 2), z * f);
  }
  return tint(geo, (k, _x, y) => {
    const t = Math.floor(((y + 1.2) / 2.4) * 10) / 10;
    if (cap) {
      k.copy(a3);
    } else {
      k.copy(a1).lerp(a2, Math.min(1, Math.max(0, (t - 0.25) * 1.9)));
      const ao = Math.min(1, Math.max(0, (y + 1.2) / 0.65));
      k.lerp(aoDark, (1 - ao) * 0.45);
    }
  });
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
  add(
    g,
    s,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      bumpMap: MStone(c1).bumpMap,
      bumpScale: 0.025,
    }),
    x,
    0.4,
    z
  );
};

export function table(): THREE.Group {
  const g = new THREE.Group();
  const stoneTex = MStone('#b8986b', 0.92).bumpMap;
  const vm = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.93,
    metalness: 0.02,
    bumpMap: stoneTex,
    bumpScale: 0.03,
    side: THREE.DoubleSide,
  });
  add(g, C(6.2, 6.9, 0.5, 84), MStone('#436333', 0.95), 0, 0.25, 0);
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

  // Orographic tablecloth clouds: soft billowing layered mist spilling over the north cliff
  const cmOuter = MT('#f4f8ff', 0.42, 0.98, 0, false);
  const cmInner = MT('#ffffff', 0.54, 0.98, 0, false);
  const cl: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const x = -3.0 + i * 0.46;
    const z = Math.sqrt(Math.max(0.4, 12.2 - x * x)) * 0.78;
    const mat = i % 2 === 0 ? cmOuter : cmInner;
    const o = add(g, new THREE.IcosahedronGeometry(0.54, 2), mat, x, 2.76 + (i % 3) * 0.1, z);
    o.scale.set(1.25 + R(i) * 0.3, 0.58 + R(i + 2) * 0.25, 0.98);
    o.userData.x = x;
    cl.push(o);
  }
  [-1.7, -0.35, 1.25].forEach((x, idx) => {
    const o = add(g, new THREE.IcosahedronGeometry(0.5, 2), cmOuter, x, 2.34 - idx * 0.04, 3.55);
    o.scale.set(1.3, 0.92, 0.68);
    o.userData.x = x;
    cl.push(o);
  });
  for (let i = 0; i < 8; i++) {
    const o = add(
      g,
      new THREE.IcosahedronGeometry(0.42, 2),
      cmInner,
      -2.3 + i * 0.66,
      2.88 + (i % 2) * 0.1,
      -2.1 - R(i) * 0.55
    );
    o.scale.set(1.3, 0.55, 1.05);
    o.userData.x = o.position.x;
    cl.push(o);
  }

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

  // Maclear's Beacon & sculpted lower/upper cableway stations
  add(g, C(0.08, 0.22, 0.46, 10), MStone('#8e8679', 0.92), -0.8, 2.85, -1.2);
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

  // Semicircular Baker colonnade & vaulted loggia
  add(g, C(3.75, 3.75, 1.85, 64, 1, true, Math.PI / 2, Math.PI), dk, 0, 1.725, -1.2);
  const sh = new THREE.Shape();
  sh.absarc(0, 0, 3.92, 0, Math.PI, false);
  sh.absarc(0, 0, 2.98, Math.PI, 0, true);
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
    colTransforms.push({ x: 3.45 * Math.cos(a), y: 1.725, z: -1.2 - 3.45 * Math.sin(a) });
  }
  for (let i = 0; i < 18; i++) {
    const a = ((i + 0.5) / 18) * Math.PI;
    winTransforms.push({
      x: 3.68 * Math.cos(a),
      y: 1.6,
      z: -1.2 - 3.68 * Math.sin(a),
      ry: Math.atan2(-Math.cos(a), Math.sin(a)),
    });
  }
  instancedMeshes(g, C(0.085, 0.105, 1.85, 12), st, colTransforms);
  instancedMeshes(g, CB(0.28, 0.9, 0.06, 0.02), wn, winTransforms);

  // Symmetrical East & West sandstone wings with pitched terracotta roofs + domed clock towers
  const fl = M('#dce0e4', 0.35, 0.65);
  const hd = M('#3c6838', 0.92);
  const sb = M('#e6dcc4', 0.82);
  const bz = M('#7c5e34', 0.38, 0.72);
  const flagMat = MT('#007749', 1, 0.6, 0, true);
  const flags: THREE.Mesh[] = [];

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

    add(g, C(0.03, 0.03, 2.4, 8), fl, s * 5.8, 6.8, -0.9);
    const fMesh = add(
      g,
      new THREE.PlaneGeometry(0.55, 0.32, 10, 1),
      flagMat,
      s * 5.8 + 0.3,
      7.6,
      -0.9
    );
    flags.push(fMesh);
  });

  // Batched garden hedges & balustrade posts
  const hedgeTransforms: InstanceTransform[] = [];
  for (let i = -4; i <= 4; i++) {
    hedgeTransforms.push({ x: i * 1.3, y: 0.53, z: 2.25 });
    hedgeTransforms.push({ x: i * 1.3 + 0.65, y: 0.73, z: 1.5 });
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
  const pr = [
    [2.3, 0.15],
    [3.2, 1.3],
    [3.9, 2.1],
    [4.4, 2.35],
    [4.4, 1.2],
    [4.2, 0],
  ].map((p) => new THREE.Vector2(...p));
  add(g, new THREE.LatheGeometry(pr, 96), sh);
  add(g, new THREE.CircleGeometry(2.3, 64).rotateX(-Math.PI / 2), M('#3b8a47', 0.95), 0, 0.16, 0);
  add(g, new THREE.TorusGeometry(4.35, 0.1, 10, 128).rotateX(Math.PI / 2), gl, 0, 2.35, 0);
  add(g, new THREE.TorusGeometry(4.4, 0.05, 8, 128).rotateX(Math.PI / 2), gl, 0, 1.3, 0);

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
  // Arch cross-bracing ladder rungs & suspension cables
  const v: number[] = [];
  for (let x = -3.6; x <= 3.7; x += 0.4) {
    const zz = Math.sqrt(4.35 * 4.35 - x * x);
    [-1, 1].forEach((s) => v.push(x, yFn(x), 0, x, 2.35, s * zz));
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
  instancedMeshes(g, CB(0.08, 2.35, 0.16, 0.02), M('#cfd5dc', 0.38, 0.65), finTransforms);

  const fm = M('#cfd5dc', 0.38, 0.65);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5708 + 0.785;
    const x = 4.6 * Math.cos(a);
    const z = 4.6 * Math.sin(a);
    add(g, C(0.03, 0.05, 3.2, 8), fm, x, 3.2, z);
    add(g, CB(0.5, 0.3, 0.1, 0.02), gl, x, 4.9, z).lookAt(0, 2, 0);
  }
  g.add(
    lines(
      [
        -1.5, 0.18, -1, 1.5, 0.18, -1, 1.5, 0.18, -1, 1.5, 0.18, 1, 1.5, 0.18, 1, -1.5, 0.18, 1,
        -1.5, 0.18, 1, -1.5, 0.18, -1, 0, 0.18, -1, 0, 0.18, 1,
      ],
      '#ffffff'
    )
  );
  add(g, new THREE.RingGeometry(0.3, 0.33, 48).rotateX(-Math.PI / 2), M('#fff', 0.9), 0, 0.18, 0);

  const rm = MT('#f4f7fa', 0.84, 0.55, 0.05, true);
  add(
    g,
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
  g.add(lines(tv, '#aab4c0'));
  g.add(lines(av, '#8794a6'));

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

  // Wettable rain-slicked bridge deck + chamfered abutment piers
  add(g, CB(15, 0.22, 1.72, 0.03), roadMat, 0, 1.7, 0);
  [-7.4, 7.4].forEach((x) => add(g, CB(1.25, 1.7, 1.92, 0.05), dk, x, 0.85, 0));

  // Asymmetric H-shaped steel pylons (tall north pylon & shorter south pylon + crossbeams)
  (
    [
      [-2.3, 6.4, 8.15],
      [2.5, 5.4, 7.15],
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

  // Braamfontein rail tracks below
  const railTransforms: InstanceTransform[] = [];
  for (let k = 0; k < 6; k++) railTransforms.push({ x: 0, y: 0.05, z: -3 + k * 1.2 });
  instancedMeshes(g, CB(18, 0.05, 0.08, 0.01), M('#777', 0.4, 0.8), railTransforms);

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
  for (let i = 0; i < 20; i++) dashT.push({ x: -7 + i * 0.75, y: 1.82, z: 0 });
  instancedMeshes(g, B(0.4, 0.01, 0.05), yl, dashT);

  const poleT: InstanceTransform[] = [];
  const bulbT: InstanceTransform[] = [];
  [-0.8, 0.8].forEach((z) => {
    add(g, CB(15, 0.14, 0.05, 0.015), wh, 0, 1.85, z);
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
  const pts = [
    new THREE.Vector2(0.01, -3.2),
    new THREE.Vector2(7.6, -3.2),
    new THREE.Vector2(7.6, 0),
    new THREE.Vector2(5.4, 0),
  ];
  let r = 5.4;
  let y = 0;
  for (let i = 0; i < 9; i++) {
    y -= 0.32;
    pts.push(new THREE.Vector2(r - 0.15, y));
    r -= 0.42;
    pts.push(new THREE.Vector2(r, y));
  }
  pts.push(new THREE.Vector2(0.01, y));
  const geo = new THREE.LatheGeometry(pts, 112);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const yy = p.getY(i);
    const z = p.getZ(i);
    if (yy < -0.01 && yy > -3 && Math.hypot(x, z) < 5.45) {
      const f = 1 + 0.05 * n(Math.atan2(z, x) * 2, yy * 1.5);
      p.setXYZ(i, x * f, yy, z * f);
    }
  }
  const s = new THREE.Color('#c8a26c');
  const a = new THREE.Color('#c07d47');
  const b = new THREE.Color('#3f342d');
  tint(geo, (k, _x, yy, z) => {
    if (yy < -3.1 || yy < -3) return k.copy(b);
    if (yy > -0.01) return k.copy(s);
    const ang = Math.atan2(z, _x);
    const band = Math.floor(-yy * 5);
    const strata = 0.84 + 0.18 * (0.5 + 0.5 * Math.sin(band * 1.9 + 0.6));
    const groove = Math.pow(Math.max(0, Math.cos(ang * 18)), 8);
    return k
      .copy(a)
      .lerp(b, -yy / 2.9)
      .multiplyScalar(strata * (1 - groove * 0.24));
  });
  const vm = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    bumpMap: MStone('#c07d47').bumpMap,
    bumpScale: 0.032,
    side: THREE.DoubleSide,
  });
  add(g, geo, vm);
  add(
    g,
    new THREE.CircleGeometry(2.3, 48).rotateX(-Math.PI / 2),
    MWater('#288d8a', 0.09, 0.2),
    0,
    -2.45,
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

  // Viewing platform & glass balustrade
  add(g, CB(1.85, 0.12, 2.2, 0.02), M('#525862', 0.45, 0.6), 0, 0.1, 5);
  add(g, CB(1.85, 0.9, 0.05, 0.01), MT('#b8e6f0', 0.34, 0.08, 0.2, true), 0, 0.58, 3.95);
  const fm = M('#444950', 0.45, 0.7);
  const postT: InstanceTransform[] = [];
  for (let i = 0; i < 40; i++) {
    const ang = (i / 40) * 6.2832;
    postT.push({ x: 5.7 * Math.cos(ang), y: 0.27, z: 5.7 * Math.sin(ang) });
  }
  instancedMeshes(g, C(0.02, 0.02, 0.55, 6), fm, postT);
  add(g, new THREE.TorusGeometry(5.7, 0.015, 6, 120).rotateX(Math.PI / 2), fm, 0, 0.5, 0);
  g.add(lines([6.3, 3.6, -1.4, 2.2, -1.5, -0.6], '#222'));
  const bk = add(g, CB(0.3, 0.25, 0.3, 0.03), rs, 2.2, -1.65, -0.6);

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
      [-6.2, -3, '#6b7f8c'],
      [-5, -4.4, '#7a8c97'],
      [5.5, 3.8, '#6b7f8c'],
    ] as const
  ).forEach(([x, z, c]) =>
    add(g, new THREE.ConeGeometry(0.9, 0.8, 16), MStone(c, 0.94), x, 0.4, z)
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
    new THREE.PointsMaterial({ color: '#ecc99a', size: 0.08, transparent: true, opacity: 0.58 })
  );
  pt.frustumCulled = false;
  g.add(pt);
  const upd = (t: number) => {
    for (let i = 0; i < dN; i++) {
      const yy = -2.4 + ((dB[i] + t * 0.15) % 3.2);
      const rr = dU[i] * (1.6 + (yy + 2.4) * 0.95);
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
      -2.44,
      0
    )
  );
  g.position.y = 3.2;
  const w = new THREE.Group();
  w.add(g);
  w.userData.tick = (t: number) => {
    upd(t);
    const u = (Math.sin(t * 0.4) + 1) / 2;
    bk.position.set(2.2 + 4.1 * u, -1.65 + 5.1 * u, -0.6 - 0.8 * u);
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
  add(g, C(1.72, 1.92, 0.9, 48), gr, 0, 5.35, 0);
  add(g, new THREE.SphereGeometry(1.72, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), dk, 0, 5.8, 0);
  add(g, new THREE.SphereGeometry(0.3, 16, 8), gl, 0, 7.4, 0);

  // Anton van Wouw bronze mother-and-child pedestal
  add(g, CB(0.55, 0.6, 0.55, 0.03), dk, 0, 0.9, 3.4);
  add(g, C(0.1, 0.14, 0.8, 8), bz, 0, 1.6, 3.4);
  add(g, new THREE.SphereGeometry(0.12, 10, 8), bz, 0, 2.1, 3.4);

  // Batched 44 granite laager ox-wagons + canvas canopies
  const wagonT: InstanceTransform[] = [];
  const tiltT: InstanceTransform[] = [];
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * 6.2832;
    if (Math.abs(a - 1.5708) < 0.2) continue;
    const ry = Math.atan2(-Math.cos(a), -Math.sin(a));
    wagonT.push({ x: 6.6 * Math.cos(a), y: 0.27, z: 6.6 * Math.sin(a), ry });
    tiltT.push({ x: 6.6 * Math.cos(a), y: 0.52, z: 6.6 * Math.sin(a), ry });
  }
  instancedMeshes(g, CB(0.62, 0.42, 0.22, 0.03), dk, wagonT);
  instancedMeshes(g, C(0.11, 0.11, 0.6, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), gr, tiltT);

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
  rock(g, 1.9, 3.5, 3.8, -0.4, 0.2, '#6f5b44', '#b49a70', 0.14);
  [
    [3.4, 2.2, 0.8],
    [-3.6, -2, 0.7],
    [2.4, -3.4, 0.6],
  ].forEach(([x, z, r], i) =>
    rock(g, r * 0.7, r * 1.3, 1.2 + i * 0.3, x, z, '#645440', '#968260', 0.13)
  );
  add(g, C(1.9, 1.95, 0.12, 48), MStone('#5c7036', 0.95), -0.4, 3.84, 0.2);

  // Batched Cape fynbos cushions
  const bushT: InstanceTransform[] = [];
  for (let i = 0; i < 18; i++) {
    const a = R(i) * 6.28;
    const r = R(i + 3) * 1.5;
    bushT.push({
      x: -0.4 + r * Math.cos(a),
      y: 3.94,
      z: 0.2 + r * Math.sin(a),
      sx: 0.85,
      sy: 0.55,
      sz: 0.85,
    });
  }
  instancedMeshes(g, new THREE.IcosahedronGeometry(0.18, 1), Mc('#567438'), bushT, [
    '#4d6e35',
    '#6c7e3b',
    '#826840',
  ]);

  // Whitewashed masonry lighthouse + keeper hut + lower 1919 beacon
  add(g, C(0.28, 0.4, 1.5, 24), wh, -0.4, 4.65, 0.2);
  add(g, C(0.46, 0.46, 0.1, 24), dk, -0.4, 5.45, 0.2);
  add(g, C(0.22, 0.22, 0.3, 16), lt, -0.4, 5.65, 0.2);
  add(g, new THREE.ConeGeometry(0.32, 0.28, 16), dk, -0.4, 5.95, 0.2);
  colonialHouse(g, {
    x: -0.4,
    y: 3.88,
    z: -0.65,
    w: 0.75,
    h: 0.34,
    d: 0.48,
    wall: '#f2efe6',
    roof: '#464d56',
  });

  const bm = new THREE.Group();
  bm.position.set(-0.4, 5.65, 0.2);
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
    sr(t);
    spray(t);
    bd(t);
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

  for (let r = 0; r < 4; r++) {
    const z = 2.6 - r * 1.7;
    const b0 = 0.3 + r * 0.55;
    add(g, CB(10.1, b0, 1.65, 0.04), cobble, 0, b0 / 2, z);
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
      lampPost(g, -4.9, b0, z + 0.85, 0.55);
      lampPost(g, 0, b0, z + 0.85, 0.55);
      lampPost(g, 4.9, b0, z + 0.85, 0.55);
    }
  }

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
  mx.fillStyle = '#6b3b20';
  mx.fillRect(0, 0, 256, 256);
  const cols = 16;
  const rows = 12;
  const cw = 256 / cols;
  const ch = 256 / rows;
  const tiles = ['#e8c074', '#d9a05a', '#c67537', '#a85c2c', '#d98f45'];
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
  const r = (y: number) => 3.1 + 1.5 * Math.sin(Math.PI * Math.pow(y / 3.8, 0.8));
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = (i * 3.8) / 24;
    pts.push(new THREE.Vector2(r(y), y));
  }
  pts.push(new THREE.Vector2(2.95, 3.9));
  for (let i = 24; i >= 3; i--) {
    const y = (i * 3.8) / 24;
    pts.push(new THREE.Vector2(r(y) - 0.4, y));
  }
  add(g, new THREE.LatheGeometry(pts, 108), pm);
  // Radial exterior steel spine ribs (10 African continent alignment spokes)
  const ribT: InstanceTransform[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ribT.push({ x: 4.55 * Math.cos(a), y: 1.75, z: 4.55 * Math.sin(a), ry: -a });
  }
  instancedMeshes(g, CB(0.14, 2.7, 0.16, 0.03), M('#4b3526', 0.55, 0.45), ribT);

  add(g, new THREE.CircleGeometry(3.5, 64).rotateX(-Math.PI / 2), M('#3b8a47', 0.95), 0, 0.48, 0);
  add(g, C(5.45, 5.65, 0.2, 84), MWet('#7f6043', 0.85, 0.16, 0.04, 'stone'), 0, 0.1, 0);
  [
    [4.46, 1],
    [4.3, 2.5],
  ].forEach(([R0, y]) =>
    add(g, new THREE.TorusGeometry(R0, 0.07, 8, 112).rotateX(Math.PI / 2), gl, 0, y, 0)
  );
  add(g, new THREE.TorusGeometry(2.9, 0.07, 8, 96).rotateX(Math.PI / 2), gl, 0, 3.88, 0);
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
    fw(t);
  };
  return g;
}

export function rondavels(): THREE.Group {
  const g = new THREE.Group();
  const cm = MT('#f8fbff', 0.68, 0.98, 0, false);
  add(g, C(7.6, 7.6, 0.2, 84), MStone('#496a38', 0.95), 0, 0.1, 0);
  rock(g, 2.2, 3.2, 3.4, -4.4, -1, '#7a6344', '#c29f6e', 0.14);
  rock(g, 1.8, 2.8, 3, -4.6, 2.4, '#7a6344', '#b49664', 0.14);
  rock(g, 2, 2.8, 2.6, -2.2, -4.2, '#7a6344', '#b49664', 0.14);
  rock(g, 2.4, 3, 1.3, 3.9, 0, '#6a583b', '#987e54', 0.08);
  [
    [3.4, -1.9, 3.4, 0.95],
    [4.2, 0, 4.3, 1.1],
    [3.3, 1.9, 2.9, 0.9],
  ].forEach(([x, z, h, r]) => {
    rock(g, r * 0.82, r * 1.1, h, x, z, '#79573a', '#b88954', 0.11, 0.7);
    add(g, new THREE.ConeGeometry(r * 0.95, 0.7, 28), MStone('#668838', 0.92), x, 0.7 + h + 0.3, z);
  });
  const cv = new THREE.CatmullRomCurve3(
    [
      [-6, 0.55, -3],
      [-3, 0.55, -3.5],
      [0, 0.55, -1],
      [1, 0.55, 2],
      [-1, 0.55, 4],
      [-3, 0.55, 6.5],
    ].map((p) => new THREE.Vector3(...p))
  );
  add(g, new THREE.TubeGeometry(cv, 60, 0.34, 8), MWater('#3394b4', 0.1, 0.25)).scale.y = 0.35;
  const ms = Array.from({ length: 8 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.7, 14, 10),
      cm,
      -3 + R(i) * 5,
      1.2 + R(i + 4) * 0.8,
      -1.5 + R(i + 9) * 4
    );
    o.scale.set(1.8, 0.5, 1.2);
    o.userData.x = o.position.x;
    return o;
  });
  for (let i = 0; i < 12; i++)
    tree(g, -2.4 + R(i) * 4.8, -5 + R(i + 30) * 10, 0.8 + R(i + 5) * 0.4, i % 4 ? 1 : 2, 0.2);
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
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 22; i++) {
    const y = (i * 3.3) / 22;
    pts.push(
      new THREE.Vector2(
        1 +
          0.5 * Math.sin(Math.PI * Math.min(1, y / 2.2)) +
          0.8 * Math.exp(-y * 3.5) -
          (0.18 * y) / 3.3,
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
    const f = 1 + 0.055 * Math.sin(a * 9 + Y * 3) + 0.04 * Math.sin(a * 17 - Y * 5);
    p.setXYZ(i, X * f, Y, Z * f);
  }
  tg.computeVertexNormals();
  add(g, tg, bk, 0, 0.2, 0);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  for (let i = 0; i < 8; i++) {
    const a = i * 0.785 + R(i) * 0.4;
    const L = 1.6 + R(i + 2) * 0.8;
    const cv = new THREE.CatmullRomCurve3([
      V(0, 3.4, 0),
      V(Math.cos(a) * 0.6, 3.9, Math.sin(a) * 0.6),
      V(Math.cos(a) * L, 4.4 + R(i) * 0.5, Math.sin(a) * L),
    ]);
    add(g, new THREE.TubeGeometry(cv, 12, 0.1, 6), bk);
    const f = new THREE.Group();
    f.position.copy(cv.getPoint(1));
    g.add(f);
    for (let k = 0; k < 3; k++) {
      add(
        f,
        new THREE.IcosahedronGeometry(0.28 + R(k + i) * 0.12, 1),
        Mc(k % 2 ? '#6f8f3a' : '#8aa04a'),
        (k - 1) * 0.22,
        k * 0.08,
        R(k) * 0.2
      );
    }
    swayItems.push({ o: f, ph: i, a: 0.05, sp: 1.2 });
  }
  // Batched dry-season golden savanna grass tufts (1 draw call)
  const grassT: InstanceTransform[] = [];
  for (let i = 0; i < 72; i++) {
    const a = R(i) * 6.28;
    const r = 2 + R(i + 9) * 5;
    grassT.push({
      x: r * Math.cos(a),
      y: 0.2,
      z: r * Math.sin(a),
      ry: R(i * 3) * 6.28,
      sy: 1.1 + R(i + 2) * 0.6,
    });
  }
  grassTufts(g, grassT, ['#d1bb62', '#b9a34c', '#8c9442']);
  [
    [-4.5, 2, 1.1],
    [4.8, -1.5, 1.2],
    [2.5, 4.5, 1],
  ].forEach(([x, z, s]) => tree(g, x, z, s, 2, 0.2));
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
      bumpMap: MStone('#b69268').bumpMap,
      bumpScale: 0.032,
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
  add(g, ring(5.7, 4.6, 0.05), MWater('#388b9b', 0.1, 0.25), 0, 0.2, 0);
  add(g, ring(4.4, 3.8, 1.1), wl, 0, 0.2, 0);

  // Five bastions with chamfered stone masonry + tapered sentry turrets
  pent(4.4).forEach((v) => {
    const x = v.x * 1.1;
    const z = -v.y * 1.1;
    add(g, CB(1.32, 1.32, 1.32, 0.05), wl, x, 0.85, z);
    add(g, CB(1.4, 0.1, 1.4, 0.02), st, x, 1.54, z);
    add(g, new THREE.ConeGeometry(0.96, 0.55, 4), rf, x, 1.82, z).rotation.y = Math.PI / 4;
  });

  // Kat Balcony Residence with pitched tiled roof & Bell Tower cupola
  add(g, CB(2.4, 0.9, 1.6, 0.04), wl, 0, 0.65, 0.3);
  add(g, gableRoofGeo(2.4, 1.6, 0.45, 0.1), rf, 0, 1.12, 0.3);
  add(g, CB(0.45, 0.28, 0.04, 0.01), G('#ffd58a', 0.9), 0, 0.68, 1.11);
  add(g, C(0.22, 0.24, 1.3, 12), wl, -0.9, 1.4, -0.8);
  add(g, new THREE.ConeGeometry(0.32, 0.52, 12), rf, -0.9, 2.3, -0.8);
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
  for (let i = 0; i < 7; i++) {
    const q = 3.2 + i * 0.28;
    rock(
      g,
      1.1,
      1.7,
      5.2 + R(i) * 0.9,
      5.2 * Math.cos(q),
      5.2 * Math.sin(q),
      '#6c4f39',
      '#c09e78',
      0.14
    );
  }
  const a = 4.04;
  const wx = 3.9 * Math.cos(a);
  const wz = 3.9 * Math.sin(a);
  // Multi-leap cascading Tugela Falls sheet + pool mist puffs
  add(g, CB(0.26, 5.4, 0.1, 0.03), wm, wx, 3.1, wz);
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
  for (let i = 0; i < 10; i++)
    tree(g, -1 + R(i) * 5, -0.5 + R(i + 10) * 5, 0.8 + R(i) * 0.3, i % 3 ? 1 : 2, 0.2);
  const fall = drift(g, 110, '#e8f6ff', 0.09, (i, t) => {
    const u = (t * 0.8 + R(i)) % 1;
    return [wx + (R(i + 3) - 0.5) * 0.3, 5.8 - u * 5.5, wz + (R(i + 4) - 0.5) * 0.28];
  });
  g.userData.tick = (t: number) => {
    fall(t);
    ms.forEach((o, i) => {
      o.position.x = (o.userData.x as number) + Math.sin(t * 0.4 + i) * 0.14;
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
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 256;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#c4bcb0';
  x.fillRect(0, 0, 128, 256);

  const ecv = document.createElement('canvas');
  ecv.width = 128;
  ecv.height = 256;
  const ex = ecv.getContext('2d')!;
  ex.fillStyle = '#000000';
  ex.fillRect(0, 0, 128, 256);

  for (let r = 0; r < 48; r++) {
    for (let c = 0; c < 16; c++) {
      const lit = R(r * 16 + c) > 0.42;
      x.fillStyle = lit ? '#e8ca86' : '#323844';
      x.fillRect(c * 8 + 1, r * 5 + 1, 6, 3);
      if (lit) {
        ex.fillStyle = '#ffd582';
        ex.fillRect(c * 8 + 1, r * 5 + 1, 6, 3);
      }
    }
  }
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  const etx = new THREE.CanvasTexture(ecv);
  etx.colorSpace = THREE.SRGBColorSpace;
  const wm = new THREE.MeshStandardMaterial({
    map: tx,
    emissive: '#ffffff',
    emissiveMap: etx,
    emissiveIntensity: 0.18,
    roughness: 0.72,
    bumpMap: MPlaster('#c4bcb0').bumpMap,
    bumpScale: 0.012,
    side: THREE.DoubleSide,
  });
  wm.userData.i = 0.85;
  glowMaterials.push(wm);
  add(g, C(1.6, 1.6, 7.4, 64, 1, true), wm, 0, 3.9, 0);
  add(g, C(0.8, 0.8, 7.4, 32, 1, true), MPlaster('#c9c2b4', 0.8), 0, 3.9, 0);
  // Exterior vertical structural concrete ribs
  const ribT: InstanceTransform[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ribT.push({ x: 1.62 * Math.cos(a), y: 3.9, z: 1.62 * Math.sin(a), ry: -a });
  }
  instancedMeshes(g, CB(0.08, 7.4, 0.1, 0.02), MPlaster('#d0cabd', 0.82), ribT);

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

  // Authentic organic 540-million-year-old rounded Cape granite boulders (instanced!)
  const boulderT: InstanceTransform[] = [];
  for (let i = 0; i < 16; i++) {
    const a = R(i) * 6.28;
    const r = 3.25 + R(i + 4) * 1.5;
    const s = 1.05 + R(i + 8) * 1.4;
    boulderT.push({
      x: r * Math.cos(a),
      y: s * 0.2,
      z: -0.6 + r * Math.sin(a),
      ry: R(i + 15) * 6.28,
      sx: s * 1.25,
      sy: s * 0.85,
      sz: s,
    });
  }
  scatterRocks(g, boulderT, '#8a8278', '#b0a698');

  for (let i = 0; i < 14; i++) {
    const p = new THREE.Group();
    const a = R(i + 20) * 6.28;
    const r = Math.sqrt(R(i + 30)) * 3;
    p.position.set(r * Math.cos(a), 0.2, -0.6 + r * Math.sin(a));
    p.rotation.y = R(i + 40) * 6.28;
    p.scale.setScalar(0.8 + R(i) * 0.4);
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
  const sr = seaRings(g, 0.14, 4, 3);
  const bd = birds(g, 3, 3, 5);
  g.userData.tick = (t: number) => {
    P.forEach((p, i) => {
      p.rotation.z = Math.sin(t * 4 + i * 2) * (i % 3 ? 0.04 : 0.12);
      p.position.y = 0.2 + (i % 3 ? 0 : Math.abs(Math.sin(t * 4 + i * 2)) * 0.05);
    });
    sr(t);
    bd(t);
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
  // Banded red-and-white Pharos lighthouse
  add(g, CB(1.5, 0.35, 1.5, 0.05), wh, -0.4, 0.62, 0);
  for (let i = 0; i < 6; i++) {
    add(
      g,
      C(0.62 - i * 0.045, 0.68 - i * 0.045, 0.62, 32),
      i % 2 ? wh : rd,
      -0.4,
      0.81 + i * 0.62,
      0
    );
  }
  add(g, C(0.5, 0.45, 0.12, 32), dk, -0.4, 4.3, 0);
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
        bumpMap: MPlaster('#fff').bumpMap,
        bumpScale: 0.015,
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
      bumpMap: MStone('#e2d2ae').bumpMap,
      bumpScale: 0.03,
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
