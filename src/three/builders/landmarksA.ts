import * as THREE from 'three';
import {
  add,
  B,
  bird,
  birds,
  C,
  car,
  drift,
  G,
  glowMaterials,
  gondola,
  lines,
  M,
  Mc,
  n,
  R,
  rock,
  sea,
  seaRings,
  swayItems,
  tint,
  train,
  tree,
} from './primitives';

const warpTable = <T extends THREE.BufferGeometry>(geo: T, cap: boolean): T => {
  const p = geo.attributes.position;
  const a1 = new THREE.Color('#58763f');
  const a2 = new THREE.Color('#c0a077');
  const a3 = new THREE.Color('#8b8a55');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const f = 1 + 0.09 * n(a * 3, y * 2) + (0.05 * Math.sin(a * 7) * (y + 1.2)) / 2.4;
    p.setXYZ(i, x * f, y + 0.04 * n(x * 2, z * 2), z * f);
  }
  return tint(geo, (k, _x, y) => {
    const t = Math.floor(((y + 1.2) / 2.4) * 9) / 9;
    if (cap) k.copy(a3);
    else k.copy(a1).lerp(a2, Math.min(1, Math.max(0, (t - 0.3) * 2)));
  });
};

const lump = (
  g: THREE.Group,
  r: number,
  x: number,
  z: number,
  sx: number,
  sy: number,
  sc: string
) => {
  const s = new THREE.SphereGeometry(r, 64, 32);
  const p = s.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const f = 1 + 0.07 * n(p.getX(i) * 3, p.getZ(i) * 3);
    p.setXYZ(i, p.getX(i) * f * sx, p.getY(i) * f * sy, p.getZ(i) * f);
  }
  s.computeVertexNormals();
  add(g, s, M(sc, 0.95), x, 0.4, z);
};

export function table(): THREE.Group {
  const g = new THREE.Group();
  const vm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  add(g, C(6.2, 6.9, 0.5, 96), M('#486a38', 1), 0, 0.25, 0);
  add(g, warpTable(C(3.6, 5.6, 2.4, 96, 14, true), false), vm, 0, 1.45, 0).material.side =
    THREE.DoubleSide;
  add(
    g,
    warpTable(new THREE.CircleGeometry(3.6, 96).rotateX(-Math.PI / 2).translate(0, 1.2, 0), true),
    vm,
    0,
    1.45,
    0
  );
  lump(g, 1.5, -4.9, 1.9, 1, 1.15, '#5a7a44');
  lump(g, 1.6, 4.6, 0.8, 1.3, 1, '#7b7b55');
  lump(g, 1.2, -1.5, -4.6, 1.4, 0.7, '#58763f');

  const cm = M('#ffffff', 1);
  cm.transparent = true;
  cm.opacity = 0.93;
  const cl: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const x = -3 + i * 0.66;
    const z = Math.sqrt(Math.max(0.4, 12.5 - x * x)) * 0.8;
    const o = add(g, new THREE.SphereGeometry(0.6, 24, 16), cm, x, 2.75 + (i % 3) * 0.08, z);
    o.scale.set(1.3, 0.5, 1);
    o.userData.x = x;
    cl.push(o);
  }
  [-1.6, 0, 1.6].forEach((x) => {
    const o = add(g, new THREE.SphereGeometry(0.5, 24, 16), cm, x, 2.2, 3.5);
    o.scale.set(1.2, 0.9, 0.6);
    o.userData.x = x;
    cl.push(o);
  });

  const bs = new THREE.IcosahedronGeometry(0.16, 1);
  const bm = [M('#3d5a2e', 1), M('#6b7f3a', 1), M('#8a5a3a', 1)];
  for (let i = 0; i < 80; i++) {
    const a = R(i) * 6.2832;
    const r = 5.75 + R(i + 99) * 0.55;
    add(g, bs, bm[i % 3], r * Math.cos(a), 0.5, r * Math.sin(a)).scale.set(
      1 + R(i + 5),
      0.7 + R(i + 7) * 0.6,
      1 + R(i + 9)
    );
  }
  const rk = new THREE.DodecahedronGeometry(0.17, 0);
  const rm = M('#a58c68', 1);
  for (let i = 0; i < 30; i++) {
    const a = R(i + 200) * 6.2832;
    const r = Math.sqrt(R(i + 300)) * 3.1;
    add(g, rk, rm, r * Math.cos(a), 2.68, r * Math.sin(a)).scale.set(
      1 + R(i) * 1.2,
      0.5,
      1 + R(i + 1)
    );
  }
  add(g, C(0.08, 0.2, 0.45, 10), M('#8d8d8d', 0.9), -0.8, 2.85, -1.2);
  add(g, B(0.7, 0.5, 0.6), M('#c9c9c9', 0.5, 0.3), 1, 0.8, 6.4);
  add(g, B(0.6, 0.4, 0.6), M('#c9c9c9', 0.5, 0.3), 1, 2.85, 3.3);
  g.add(lines([1, 1.1, 6.4, 1, 2.9, 3.4], '#222'));
  for (let i = 0; i < 8; i++) {
    const a = 3 + i * 0.2;
    lump(
      g,
      0.75 + R(i) * 0.3,
      6.4 * Math.cos(a),
      6.4 * Math.sin(a),
      1,
      1.2,
      i % 2 ? '#6f7f4e' : '#7b7b55'
    );
  }
  const gm = M('#2d3a2a', 1);
  (
    [
      [-0.3, 1.45, 4.55, 0.18],
      [1.7, 1.5, 4.3, 0.1],
      [-2.1, 1.5, 4.1, 0.1],
    ] as const
  ).forEach(([x, y, z, w]) => {
    add(g, B(w, 1.6, 0.3), gm, x, y, z).rotation.x = -0.69;
  });
  for (let i = 0; i < 8; i++) {
    const o = add(
      g,
      new THREE.SphereGeometry(0.4, 16, 12),
      cm,
      -2.4 + i * 0.7,
      2.9,
      -2.2 - R(i) * 0.6
    );
    o.scale.set(1.3, 0.45, 1);
    o.userData.x = o.position.x;
    cl.push(o);
  }
  const cab = gondola('#d33');
  g.add(cab);
  [1.8, 2, 2.2, 2.4, -0.5, -0.8, -1.1].forEach((a, i) =>
    tree(g, 6.3 * Math.cos(a), 6.3 * Math.sin(a), 1 + R(i) * 0.5, 1, 0.5)
  );
  const cab2 = gondola('#2a6fd3');
  g.add(cab2);
  g.add(lines([1.4, 1.1, 6.4, 1.4, 2.9, 3.4], '#222'));
  const gls = [0, 1, 2, 3, 4].map(() => {
    const b = bird();
    g.add(b);
    return b;
  });
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
  };
  return g;
}

export function union(): THREE.Group {
  const g = new THREE.Group();
  const st = M('#d8b888', 0.85);
  const dk = M('#b8955f', 0.9);
  const cu = M('#5aa391', 0.4, 0.6);
  const gr = M('#587a45', 1);
  const wn = G('#ffcf8a');
  dk.side = THREE.DoubleSide;

  add(g, B(12.6, 0.8, 5.4), st, 0, 0.4, -2.5);
  (
    [
      [2.2, 0.2],
      [1.5, 0.4],
      [0.9, 0.6],
    ] as const
  ).forEach(([z, h]) => {
    add(g, B(12.2, h, 1), st, 0, h / 2, z);
    add(g, B(11.6, 0.03, 0.7), gr, 0, h + 0.01, z);
  });
  add(g, C(3.75, 3.75, 1.85, 64, 1, true, Math.PI / 2, Math.PI), dk, 0, 1.725, -1.2);
  const sh = new THREE.Shape();
  sh.absarc(0, 0, 3.9, 0, Math.PI, false);
  sh.absarc(0, 0, 3, Math.PI, 0, true);
  add(
    g,
    new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 48 }).rotateX(
      -Math.PI / 2
    ),
    st,
    0,
    2.65,
    -1.2
  );
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI;
    add(g, C(0.09, 0.1, 1.85, 12), st, 3.45 * Math.cos(a), 1.725, -1.2 - 3.45 * Math.sin(a));
  }
  [-1, 1].forEach((s) => {
    add(g, B(2.6, 2, 2.4), st, s * 5.1, 1.8, -1.2);
    add(g, B(2.8, 0.2, 2.6), dk, s * 5.1, 2.9, -1.2);
    add(g, B(1.3, 3.6, 1.3), st, s * 5.8, 2.6, -0.9);
    add(g, C(0.55, 0.65, 0.5, 24), st, s * 5.8, 4.65, -0.9);
    add(
      g,
      new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      cu,
      s * 5.8,
      4.9,
      -0.9
    );
    for (let j = 0; j < 3; j++) {
      for (let r = 0; r < 2; r++) {
        add(g, B(0.35, 0.55, 0.05), wn, s * 5.1 + (j - 1) * 0.75 - s * 0.2, 1.4 + r * 0.9, 0);
      }
    }
  });
  const fl = M('#d8d8d0', 0.4, 0.5);
  const hd = M('#3f6a3a', 1);
  const sb = M('#e6dcc4', 0.8);
  const bz = M('#8a6a3a', 0.4, 0.7);
  for (let i = 0; i < 18; i++) {
    const a = ((i + 0.5) / 18) * Math.PI;
    add(g, B(0.28, 0.9, 0.06), wn, 3.68 * Math.cos(a), 1.6, -1.2 - 3.68 * Math.sin(a)).rotation.y =
      Math.atan2(-Math.cos(a), Math.sin(a));
  }
  const flagMat = M('#007749', 0.6);
  flagMat.side = THREE.DoubleSide;
  const flags: THREE.Mesh[] = [];
  [-1, 1].forEach((s) => {
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
  for (let i = -4; i <= 4; i++) {
    add(g, new THREE.ConeGeometry(0.2, 0.65, 10), hd, i * 1.3, 0.53, 2.25);
    add(g, new THREE.ConeGeometry(0.2, 0.65, 10), hd, i * 1.3 + 0.65, 0.73, 1.5);
  }
  (
    [
      [2.2, 0.2],
      [1.5, 0.4],
      [0.9, 0.6],
    ] as const
  ).forEach(([z, h]) => add(g, B(1.6, h + 0.03, 1), sb, 0, (h + 0.03) / 2, z));
  add(g, B(0.7, 0.5, 0.7), st, 0, 1.05, -0.4);
  add(g, C(0.12, 0.16, 0.8, 12), bz, 0, 1.7, -0.4);
  add(g, new THREE.SphereGeometry(0.12, 16, 12), bz, 0, 2.2, -0.4);
  add(g, B(1.3, 0.09, 0.09), bz, 0, 2, -0.4);
  for (let i = 0; i < 28; i++) add(g, C(0.03, 0.03, 0.3, 6), st, -5.9 + i * 0.44, 0.95, 0.15);
  add(g, B(12.4, 0.06, 0.1), st, 0, 1.12, 0.15);
  [-1, 1].forEach((s) => {
    for (let j = 0; j < 4; j++) {
      add(g, C(0.07, 0.08, 2, 12), st, s * 5.1 + (j - 1.5) * 0.75, 1.8, 0.2);
    }
    const p = add(g, new THREE.ConeGeometry(1.5, 0.6, 4), dk, s * 5.1, 3.2, 0.1);
    p.rotation.y = Math.PI / 4;
    p.scale.z = 0.25;
  });
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
  const sh = M('#e9e6df', 0.5, 0.1);
  const st = M('#f4f4f4', 0.3, 0.6);
  const gl = G('#9fd0ff', 1.4);
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
  add(g, new THREE.CircleGeometry(2.3, 64).rotateX(-Math.PI / 2), M('#3f8a4a', 1), 0, 0.16, 0);
  add(g, new THREE.TorusGeometry(4.35, 0.1, 10, 128).rotateX(Math.PI / 2), gl, 0, 2.35, 0);
  add(g, new THREE.TorusGeometry(4.4, 0.05, 8, 128).rotateX(Math.PI / 2), gl, 0, 1.3, 0);

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
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.13, 10), st);
  });
  const v: number[] = [];
  for (let x = -3.6; x <= 3.7; x += 0.4) {
    const zz = Math.sqrt(4.35 * 4.35 - x * x);
    [-1, 1].forEach((s) => v.push(x, yFn(x), 0, x, 2.35, s * zz));
  }
  g.add(lines(v, '#dfe6ee'));
  (
    [
      [0.25, 0.7, 2.378, 2.73, '#2f6bb3'],
      [0.8, 1.2, 2.81, 3.12, '#e6e6e6'],
      [1.4, 2, 3.288, 3.81, '#2f6bb3'],
    ] as const
  ).forEach(([a, b, r1, r2, c]) => {
    const m = M(c, 0.8);
    m.side = THREE.DoubleSide;
    add(g, C(r2 - 0.03, r1 - 0.03, b - a, 96, 1, true), m, 0, (a + b) / 2, 0);
  });
  const fm = M('#cfd3d8', 0.4, 0.6);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * 6.2832;
    add(g, B(0.08, 2.35, 0.16), fm, 4.38 * Math.cos(a), 1.18, 4.38 * Math.sin(a)).rotation.y = -a;
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5708 + 0.785;
    const x = 4.6 * Math.cos(a);
    const z = 4.6 * Math.sin(a);
    add(g, C(0.03, 0.05, 3.2, 8), fm, x, 3.2, z);
    add(g, B(0.5, 0.3, 0.1), gl, x, 4.9, z).lookAt(0, 2, 0);
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
  const rm = M('#f2f2f2', 0.6);
  rm.side = THREE.DoubleSide;
  rm.transparent = true;
  rm.opacity = 0.85;
  add(
    g,
    new THREE.LatheGeometry([new THREE.Vector2(3.3, 2.15), new THREE.Vector2(4.45, 2.4)], 96),
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
  add(g, C(5.6, 5.8, 0.12, 96), M('#b9b4a8', 0.9), 0, 0.06, 0);
  [-1, 1].forEach((s) => add(g, B(0.6, 0.5, 0.6), M('#9a9a96', 0.9), -5.6, 0.25, s * 1.7));
  add(g, B(0.7, 0.5, 0.9), M('#9a9a96', 0.9), 5.6, 0.25, 0);
  for (let i = 0; i < 5; i++)
    add(g, B(0.3, 0.01, 2.1), M(i % 2 ? '#4d9d58' : '#3a8446', 1), -1.2 + i * 0.6, 0.17, 0);
  const sk = gondola('#d33');
  g.add(sk);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.2832 + 0.2;
    tree(g, 6.9 * Math.cos(a), 6.9 * Math.sin(a), 0.9 + R(i) * 0.3, i % 3 ? 1 : 2);
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
  const wh = M('#f0f0f0', 0.3, 0.3);
  const dk = M('#2b2e36', 0.8, 0.2);
  const bd = G('#c9b99a', 0.9);
  const v: number[] = [];
  add(g, B(15, 0.2, 1.7), dk, 0, 1.7, 0);
  [-7.4, 7.4].forEach((x) => add(g, B(1.2, 1.7, 1.9), dk, x, 0.85, 0));
  [
    [-2.3, 0.9],
    [2.5, -0.9],
  ].forEach(([mx, mz]) => {
    add(g, C(0.05, 0.16, 6.4, 16), wh, mx, 4.9, mz);
    for (let i = -6; i <= 6; i++) {
      if (!i) continue;
      v.push(mx, 8.1 - Math.abs(i) * 0.3, mz, mx + i * 0.55, 1.8, mz);
    }
  });
  g.add(lines(v, '#e9e9e9'));
  for (let k = 0; k < 6; k++) add(g, B(18, 0.05, 0.08), M('#777', 0.4, 0.8), 0, 0.05, -3 + k * 1.2);
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
    emissiveIntensity: 0.05,
    roughness: 0.7,
  });
  wt.userData.i = 0.5;
  glowMaterials.push(wt);
  for (let i = 0; i < 16; i++) {
    const k = (i * 37) % 7;
    add(
      g,
      B(0.9, 1 + k * 0.55, 0.9),
      wt,
      -7.4 + i * 0.98,
      (1 + k * 0.55) / 2,
      -5.8 + (i % 3) * 0.55
    );
  }
  g.add(
    lines(
      [
        -2.3, 8.1, 0.9, -7, 1.8, 0.9, -2.3, 8.1, 0.9, -6.6, 1.8, 0.9, 2.5, 8.1, -0.9, 7, 1.8, -0.9,
        2.5, 8.1, -0.9, 6.6, 1.8, -0.9,
      ],
      '#e9e9e9'
    )
  );
  [
    [-2.3, 0.9],
    [2.5, -0.9],
  ].forEach(([x, z]) => add(g, new THREE.SphereGeometry(0.08, 12, 8), G('#ff3b3b', 2), x, 8.15, z));
  const yl = M('#e8c84a', 0.6);
  const lp = new THREE.SphereGeometry(0.05, 8, 8);
  const pg = C(0.015, 0.02, 0.55, 6);
  for (let i = 0; i < 20; i++) add(g, B(0.4, 0.01, 0.05), yl, -7 + i * 0.75, 1.81, 0);
  [-0.8, 0.8].forEach((z) => {
    add(g, B(15, 0.14, 0.05), wh, 0, 1.84, z);
    for (let i = 0; i < 9; i++) {
      const x = -6.6 + i * 1.65;
      add(g, pg, dk, x, 2.05, z);
      add(g, lp, bd, x, 2.35, z);
    }
  });
  const cars = [0, 1, 2, 3].map((i) => {
    const c = car(['#c33', '#fff', '#36c', '#fc3'][i], 0.5);
    c.position.set(0, 1.8, i % 2 ? 0.35 : -0.35);
    c.rotation.y = i % 2 ? 0 : Math.PI;
    g.add(c);
    return c;
  });
  for (let k = 0; k < 14; k++)
    add(
      g,
      new THREE.TorusGeometry(0.81, 0.02, 6, 32).rotateX(Math.PI / 2),
      dk,
      -5.5,
      0.4 + k * 0.38,
      -4
    );
  add(g, C(0.08, 0.15, 7, 12), wh, 6.5, 3.5, -4.6);
  add(g, new THREE.SphereGeometry(0.4, 16, 12), bd, 6.5, 6, -4.6);
  add(g, C(0.03, 0.03, 1.2, 6), wh, 6.5, 7.4, -4.6);
  for (let i = 0; i < 9; i++)
    tree(g, -6.5 + i * 1.65, 3.7 + (i % 2) * 0.4, 0.8 + R(i) * 0.3, i % 2 ? 1 : 2);
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
  const geo = new THREE.LatheGeometry(pts, 128);
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
  const s = new THREE.Color('#c9a46f');
  const a = new THREE.Color('#c58a55');
  const b = new THREE.Color('#4a3a30');
  tint(geo, (k, _x, yy, z) =>
    yy < -3.1
      ? k.copy(b)
      : yy > -0.01
        ? k.copy(s)
        : yy < -3
          ? k.copy(b)
          : k
              .copy(a)
              .lerp(b, -yy / 2.9)
              .multiplyScalar(0.82 + 0.18 * Math.sin(yy * 40 + Math.atan2(z, _x) * 3))
  );
  const vm = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  add(g, geo, vm);
  add(
    g,
    new THREE.CircleGeometry(2.3, 48).rotateX(-Math.PI / 2),
    M('#2f9a96', 0.1, 0.1),
    0,
    -2.45,
    0
  );
  const rs = M('#7b3f2a', 0.6, 0.6);
  [
    [6, 0.16],
    [6.6, -0.16],
  ].forEach(([x, rz]) => {
    const l = add(g, B(0.18, 3.6, 0.18), rs, x, 1.8, -1.4);
    l.rotation.z = rz;
  });
  [0.8, 1.6, 2.4].forEach((h) => add(g, B(0.7, 0.08, 0.08), rs, 6.3, h, -1.4));
  const wl = new THREE.Group();
  wl.position.set(6.3, 3.6, -1.4);
  g.add(wl);
  add(wl, new THREE.TorusGeometry(0.38, 0.05, 8, 24), rs);
  add(wl, B(0.76, 0.04, 0.04), rs);
  add(wl, B(0.04, 0.76, 0.04), rs);
  add(g, B(1.8, 0.12, 2.2), M('#555', 0.5, 0.6), 0, 0.1, 5);
  const gl = M('#bfe8f0', 0.1);
  gl.transparent = true;
  gl.opacity = 0.28;
  add(g, B(1.8, 0.9, 0.05), gl, 0, 0.58, 3.95);
  const fm = M('#444', 0.5, 0.7);
  for (let i = 0; i < 40; i++) {
    const ang = (i / 40) * 6.2832;
    add(g, C(0.02, 0.02, 0.55, 6), fm, 5.7 * Math.cos(ang), 0.27, 5.7 * Math.sin(ang));
  }
  add(g, new THREE.TorusGeometry(5.7, 0.012, 6, 128).rotateX(Math.PI / 2), fm, 0, 0.5, 0);
  g.add(lines([6.3, 3.6, -1.4, 2.2, -1.5, -0.6], '#222'));
  const bk = add(g, B(0.3, 0.25, 0.3), rs, 2.2, -1.65, -0.6);
  const bh = new THREE.IcosahedronGeometry(0.18, 0);
  for (let i = 0; i < 34; i++) {
    const ang = R(i) * 6.2832;
    const rad = 6 + R(i + 50) * 1.4;
    add(
      g,
      bh,
      M(i % 3 ? '#7a6a40' : '#5c6e3a', 1),
      rad * Math.cos(ang),
      0.1,
      rad * Math.sin(ang)
    ).scale.set(1 + R(i) * 1.5, 0.7 + R(i + 3), 1 + R(i + 7) * 1.5);
  }
  (
    [
      [-6.2, -3, '#6b7f8c'],
      [-5, -4.4, '#7a8c97'],
      [5.5, 3.8, '#6b7f8c'],
    ] as const
  ).forEach(([x, z, c]) => add(g, new THREE.ConeGeometry(0.9, 0.8, 16), M(c, 1), x, 0.4, z));
  for (let i = 0; i < 7; i++) {
    const q = 0.1 + i * 0.14;
    add(
      g,
      new THREE.ConeGeometry(0.28, 0.5, 4),
      M(i % 2 ? '#e8dcc0' : '#c9b48a', 1),
      6.4 * Math.cos(q),
      0.25,
      6.4 * Math.sin(q)
    ).rotation.y = 0.785;
  }
  add(g, B(1.2, 0.5, 0.8), M('#e8e2d2', 0.8), -2.5, 0.25, 6.5);
  add(g, B(1.3, 0.1, 0.9), rs, -2.5, 0.55, 6.5);

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
    new THREE.PointsMaterial({ color: '#ecc99a', size: 0.06, transparent: true, opacity: 0.6 })
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
      new THREE.RingGeometry(0.9, 0.95, 48).rotateX(-Math.PI / 2),
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
  const gr = M('#c4b59b', 0.8);
  const dk = M('#9f8f72', 0.9);
  const bz = M('#6b5a3a', 0.5, 0.6);
  const gl = G('#ffcf8a', 1.2);
  (
    [
      [7.4, 0.3],
      [6.6, 0.3],
      [5.8, 0.3],
    ] as const
  ).forEach(([w, h], i) => add(g, B(w, h, w), dk, 0, 0.15 + i * 0.3, 0));
  add(g, B(4.2, 3.8, 4.2), gr, 0, 2.8, 0);
  add(g, B(4.5, 0.25, 4.5), dk, 0, 4.8, 0);
  add(g, B(3.4, 0.6, 4.3), dk, 0, 3.5, 0);
  add(g, B(1, 1.6, 0.05), gl, 0, 1.7, 2.12);
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([x, z]) => {
    add(g, B(0.7, 3.5, 0.7), gr, x * 2.35, 2.65, z * 2.35);
    add(g, C(0.12, 0.16, 0.6, 8), bz, x * 2.35, 4.7, z * 2.35);
    add(g, new THREE.SphereGeometry(0.13, 10, 8), bz, x * 2.35, 5.1, z * 2.35);
  });
  add(g, C(1.7, 1.9, 0.9, 48), gr, 0, 5.35, 0);
  add(g, new THREE.SphereGeometry(1.7, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), dk, 0, 5.8, 0);
  add(g, new THREE.SphereGeometry(0.3, 16, 8), gl, 0, 7.4, 0);
  add(g, B(0.5, 0.6, 0.5), dk, 0, 0.9, 3.4);
  add(g, C(0.1, 0.14, 0.8, 8), bz, 0, 1.6, 3.4);
  add(g, new THREE.SphereGeometry(0.12, 10, 8), bz, 0, 2.1, 3.4);
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * 6.2832;
    if (Math.abs(a - 1.5708) < 0.2) continue;
    add(g, B(0.62, 0.55, 0.22), dk, 6.6 * Math.cos(a), 0.27, 6.6 * Math.sin(a)).rotation.y =
      Math.atan2(-Math.cos(a), -Math.sin(a));
  }
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.4;
    tree(g, 7.1 * Math.cos(a), 7.1 * Math.sin(a), 0.8, 2);
  }
  const mo = drift(g, 40, '#ffd88a', 0.06, (i, t) => [
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
  const wh = M('#f4f2ec', 0.5);
  const dk = M('#2b2b30', 0.6, 0.5);
  const lt = G('#fff3b0', 2.5);
  sea(g);
  rock(g, 1.9, 3.5, 3.8, -0.4, 0.2, '#7c6850', '#b39b72', 0.13);
  [
    [3.4, 2.2, 0.8],
    [-3.6, -2, 0.7],
    [2.4, -3.4, 0.6],
  ].forEach(([x, z, r], i) =>
    rock(g, r * 0.7, r * 1.3, 1.2 + i * 0.3, x, z, '#6f6048', '#9a8662', 0.12)
  );
  add(g, C(1.9, 1.95, 0.12, 48), M('#6b7f3a', 1), -0.4, 3.84, 0.2);
  for (let i = 0; i < 16; i++) {
    const a = R(i) * 6.28;
    const r = R(i + 3) * 1.5;
    add(
      g,
      new THREE.IcosahedronGeometry(0.16, 1),
      Mc(i % 2 ? '#5a7a3a' : '#8a6a3a'),
      -0.4 + r * Math.cos(a),
      3.95,
      0.2 + r * Math.sin(a)
    ).scale.set(1.2, 0.8, 1.2);
  }
  add(g, C(0.26, 0.38, 1.5, 24), wh, -0.4, 4.65, 0.2);
  add(g, C(0.46, 0.46, 0.1, 24), dk, -0.4, 5.45, 0.2);
  add(g, C(0.22, 0.22, 0.3, 16), lt, -0.4, 5.65, 0.2);
  add(g, new THREE.ConeGeometry(0.3, 0.28, 16), dk, -0.4, 5.95, 0.2);
  const bm = new THREE.Group();
  bm.position.set(-0.4, 5.65, 0.2);
  g.add(bm);
  const bmat = new THREE.MeshBasicMaterial({
    color: '#fff4b8',
    transparent: true,
    opacity: 0.2,
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
  const bd = birds(g, 4, 4, 6);
  g.userData.tick = (t: number) => {
    bm.rotation.y = t * 1.2;
    sr(t);
    bd(t);
  };
  return g;
}

export function bokaap(): THREE.Group {
  const g = new THREE.Group();
  const wn = G('#ffd98a', 1);
  const wh = M('#f4f1ea', 0.7);
  const pal = [
    '#e84a5f',
    '#ff9a3c',
    '#f4d35e',
    '#4ecdc4',
    '#6a4c93',
    '#2a9d8f',
    '#e76f51',
    '#ff6b9d',
  ];
  rock(g, 2.6, 3.9, 3.6, 0, -6.4, '#6b7f4a', '#9a8f6a', 0.1);
  for (let r = 0; r < 4; r++) {
    const z = 2.6 - r * 1.7;
    const b0 = 0.3 + r * 0.55;
    add(g, B(10, b0, 1.6), M('#8a7f73', 0.95), 0, b0 / 2, z);
    for (let j = 0; j < 6; j++) {
      const x = -4.1 + j * 1.65;
      const h = 1 + ((j * 3 + r * 5) % 3) * 0.25;
      add(g, B(1.5, h, 1.3), M(pal[(j + r * 3) % 8], 0.8), x, b0 + h / 2, z);
      add(g, B(1.58, 0.1, 1.38), wh, x, b0 + h + 0.05, z);
      add(g, B(0.28, 0.5, 0.04), M('#3a2a22', 0.7), x - 0.35, b0 + 0.25, z + 0.66);
      [0, 1].forEach((k) =>
        add(g, B(0.26, 0.3, 0.03), wn, x + 0.15 + k * 0.4, b0 + h * 0.65, z + 0.66)
      );
    }
  }
  add(g, B(1.4, 1.4, 1.4), wh, 5.9, 1, -1.2);
  add(
    g,
    new THREE.SphereGeometry(0.7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    M('#2a9d8f', 0.4, 0.3),
    5.9,
    1.7,
    -1.2
  );
  add(g, C(0.12, 0.16, 2.4, 12), wh, 6.6, 1.5, -2.1);
  add(g, new THREE.ConeGeometry(0.2, 0.4, 12), M('#2a9d8f', 0.4, 0.3), 6.6, 2.9, -2.1);
  for (let i = 0; i < 5; i++) tree(g, -4 + i * 2, 4.1, 0.8, 1);
  g.userData.tick = birds(g, 6, 3, 6);
  return g;
}

export function soccer(): THREE.Group {
  const g = new THREE.Group();
  const gl = G('#ffb35a', 1.6);
  const pm = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.7,
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
  const A = new THREE.Color('#c8793a');
  const Bc = new THREE.Color('#6e3f22');
  const Cc = new THREE.Color('#ecc47a');
  add(
    g,
    tint(new THREE.LatheGeometry(pts, 120), (c, x, y, z) => {
      const q = Math.sin(Math.atan2(z, x) * 30) * Math.sin(y * 11);
      c.copy(q > 0.5 ? Cc : q < -0.5 ? Bc : A);
    }),
    pm
  );
  add(g, new THREE.CircleGeometry(3.5, 64).rotateX(-Math.PI / 2), M('#3f8a4a', 1), 0, 0.48, 0);
  add(g, C(5.4, 5.6, 0.2, 96), M('#7d5a3a', 0.9), 0, 0.1, 0);
  [
    [4.46, 1],
    [4.3, 2.5],
  ].forEach(([R0, y]) =>
    add(g, new THREE.TorusGeometry(R0, 0.07, 8, 128).rotateX(Math.PI / 2), gl, 0, y, 0)
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
  const cm = M('#ffffff', 1);
  cm.transparent = true;
  cm.opacity = 0.7;
  add(g, C(7.6, 7.6, 0.2, 96), M('#4a6b3a', 1), 0, 0.1, 0);
  rock(g, 2.2, 3.2, 3.4, -4.4, -1, '#7b6a4a', '#c0a070', 0.14);
  rock(g, 1.8, 2.8, 3, -4.6, 2.4, '#7b6a4a', '#b39968', 0.14);
  rock(g, 2, 2.8, 2.6, -2.2, -4.2, '#7b6a4a', '#b39968', 0.14);
  rock(g, 2.4, 3, 1.3, 3.9, 0, '#6b5a3c', '#9a8056', 0.08);
  [
    [3.4, -1.9, 3.4, 0.95],
    [4.2, 0, 4.3, 1.1],
    [3.3, 1.9, 2.9, 0.9],
  ].forEach(([x, z, h, r]) => {
    rock(g, r * 0.82, r * 1.1, h, x, z, '#7b5a3c', '#b78a55', 0.1, 0.7);
    add(g, new THREE.ConeGeometry(r * 0.95, 0.7, 28), M('#6b8f3a', 1), x, 0.7 + h + 0.3, z);
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
  add(g, new THREE.TubeGeometry(cv, 60, 0.3, 8), M('#3fa0c0', 0.1, 0.2)).scale.y = 0.35;
  const ms = Array.from({ length: 8 }, (_, i) => {
    const o = add(
      g,
      new THREE.SphereGeometry(0.7, 16, 12),
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
  const bk = M('#8a7a64', 0.95);
  add(g, C(7.6, 7.6, 0.2, 96), M('#b59a4a', 1), 0, 0.1, 0);
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
    const f = 1 + 0.05 * Math.sin(a * 9 + Y * 3) + 0.04 * Math.sin(a * 17 - Y * 5);
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
  for (let i = 0; i < 60; i++) {
    const a = R(i) * 6.28;
    const r = 2 + R(i + 9) * 5;
    add(
      g,
      new THREE.ConeGeometry(0.08, 0.35, 5),
      Mc('#d1bb62'),
      r * Math.cos(a),
      0.37,
      r * Math.sin(a)
    );
  }
  [
    [-4.5, 2, 1.1],
    [4.8, -1.5, 1.2],
    [2.5, 4.5, 1],
  ].forEach(([x, z, s]) => tree(g, x, z, s, 2, 0.2));
  g.userData.tick = drift(g, 50, '#e7ff7a', 0.08, (i, t) => [
    Math.cos(i * 2.4 + t * 0.2) * (1.5 + R(i) * 5),
    0.5 + R(i + 2) * 3 + Math.sin(t + i) * 0.2,
    Math.sin(i * 2.4 + t * 0.2) * (1.5 + R(i) * 5),
  ]);
  return g;
}

export function holewall(): THREE.Group {
  const g = new THREE.Group();
  sea(g, '#1a7ba0');
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
    bevelSize: 0.1,
    bevelThickness: 0.1,
    bevelSegments: 2,
    curveSegments: 24,
  }).translate(0, 0, -0.8);
  const a = new THREE.Color('#7a5a3c');
  const b = new THREE.Color('#b89368');
  const c = new THREE.Color('#5f8a3f');
  add(
    g,
    tint(ge, (k, x, y) =>
      y > 3.15
        ? k.copy(c)
        : k.copy(a).lerp(b, Math.min(1, Math.max(0, y / 3.2 + 0.1 * Math.sin(y * 14 + x))))
    ),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })
  ).scale.setScalar(1.3);
  rock(g, 2.6, 4, 3.6, 0, -5.2, '#6a5a3e', '#9a8056', 0.1);
  add(g, C(2.6, 2.65, 0.12, 48), M('#5f8a3f', 1), 0, 3.66, -5.2);
  [-0.8, 0, 0.8].forEach((x, i) => {
    add(g, C(0.22, 0.22, 0.28, 12), M('#e8dcc0', 0.8), x, 3.8, -5 + i * 0.2);
    add(g, new THREE.ConeGeometry(0.3, 0.28, 12), M('#a8843a', 1), x, 4.08, -5 + i * 0.2);
  });
  [
    [-1.4, -4.4],
    [1.5, -4.6],
    [-0.2, -5.9],
  ].forEach(([x, z]) => tree(g, x, z, 0.7, 2, 3.62));
  rock(g, 0.4, 0.7, 1.1, 3.4, 1.5, '#6a5a3e', '#9a8056', 0.12);
  rock(g, 0.35, 0.6, 0.9, -3.2, 2.6, '#6a5a3e', '#9a8056', 0.12);
  const sr = seaRings(g, 0.12, 1.8, 4);
  const bd = birds(g, 3, 3.2, 5);
  g.userData.tick = (t: number) => {
    sr(t);
    bd(t);
  };
  return g;
}

export function castle(): THREE.Group {
  const g = new THREE.Group();
  const wl = M('#e6d8a8', 0.85);
  const rf = M('#8a4b32', 0.8);
  add(g, C(7.6, 7.6, 0.2, 96), M('#b9b08a', 1), 0, 0.1, 0);
  const pent = (r: number) =>
    Array.from(
      { length: 5 },
      (_, i) =>
        new THREE.Vector2(r * Math.cos(-1.5708 + i * 1.2566), r * Math.sin(-1.5708 + i * 1.2566))
    );
  const ring = (ro: number, ri: number, d: number) => {
    const s = new THREE.Shape(pent(ro));
    s.holes.push(new THREE.Path(pent(ri)));
    return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).rotateX(-Math.PI / 2);
  };
  add(g, ring(5.7, 4.6, 0.05), M('#4a9aa8', 0.1, 0.2), 0, 0.2, 0);
  add(g, ring(4.4, 3.8, 1.1), wl, 0, 0.2, 0);
  pent(4.4).forEach((v) => {
    const x = v.x * 1.1;
    const z = -v.y * 1.1;
    add(g, B(1.3, 1.3, 1.3), wl, x, 0.85, z);
    add(g, new THREE.ConeGeometry(0.95, 0.55, 4), rf, x, 1.77, z).rotation.y = Math.PI / 4;
  });
  add(g, B(2.4, 0.9, 1.6), wl, 0, 0.65, 0.3);
  add(g, B(2.6, 0.25, 1.8), rf, 0, 1.25, 0.3);
  add(g, C(0.22, 0.22, 1.3, 12), wl, -0.9, 1.4, -0.8);
  add(g, new THREE.ConeGeometry(0.3, 0.5, 12), rf, -0.9, 2.3, -0.8);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.5;
    tree(g, 6.6 * Math.cos(a), 6.6 * Math.sin(a), 0.8, 1);
  }
  g.userData.tick = birds(g, 4, 3.4, 5);
  return g;
}

export function amphi(): THREE.Group {
  const g = new THREE.Group();
  const wm = M('#e8f6ff', 0.4);
  wm.transparent = true;
  wm.opacity = 0.55;
  add(g, C(7.6, 7.6, 0.2, 96), M('#5e7a46', 1), 0, 0.1, 0);
  for (let i = 0; i < 7; i++) {
    const q = 3.2 + i * 0.28;
    rock(
      g,
      1.1,
      1.7,
      5.2 + R(i) * 0.9,
      5.2 * Math.cos(q),
      5.2 * Math.sin(q),
      '#7a5a3f',
      '#c0a07a',
      0.14
    );
  }
  const a = 4.04;
  const wx = 3.9 * Math.cos(a);
  const wz = 3.9 * Math.sin(a);
  add(g, B(0.22, 5.4, 0.12), wm, wx, 3.1, wz);
  for (let i = 0; i < 10; i++) {
    const o = add(
      g,
      new THREE.SphereGeometry(0.6, 12, 10),
      wm,
      wx + (R(i) - 0.5) * 1.4,
      0.5 + R(i + 3) * 0.3,
      wz + (R(i + 5) - 0.5) * 1.4
    );
    o.scale.y = 0.5;
  }
  for (let i = 0; i < 10; i++)
    tree(g, -1 + R(i) * 5, -0.5 + R(i + 10) * 5, 0.8 + R(i) * 0.3, i % 3 ? 1 : 2, 0.2);
  g.userData.tick = drift(g, 110, '#e8f6ff', 0.09, (i, t) => {
    const u = (t * 0.8 + R(i)) % 1;
    return [wx + (R(i + 3) - 0.5) * 0.25, 5.8 - u * 5.5, wz + (R(i + 4) - 0.5) * 0.25];
  });
  return g;
}

export function palace(): THREE.Group {
  const g = new THREE.Group();
  const st = M('#d8c08a', 0.7);
  const gd = M('#d9a84a', 0.35, 0.8);
  const tl = M('#2a7f8f', 0.5, 0.3);
  const wn = G('#ffd98a', 1);
  add(g, C(7.6, 7.6, 0.2, 96), M('#5e7a46', 1), 0, 0.1, 0);
  add(g, B(8.4, 0.3, 4.6), st, 0, 0.35, 0);
  add(g, B(3.2, 2.6, 2.4), st, 0, 1.8, -0.4);
  [-1, 1].forEach((s) => {
    add(g, B(2.4, 1.8, 2), st, s * 3.2, 1.4, -0.2);
    add(g, C(0.55, 0.65, 3.2, 16), st, s * 4.8, 2, -1.2);
    add(g, new THREE.ConeGeometry(0.78, 1.5, 16), tl, s * 4.8, 4.35, -1.2);
    add(g, new THREE.SphereGeometry(0.12, 8, 8), gd, s * 4.8, 5.2, -1.2);
    add(g, C(0.35, 0.4, 2.6, 12), st, s * 1.7, 2.6, 0.7);
    add(g, new THREE.ConeGeometry(0.5, 0.9, 12), gd, s * 1.7, 4.35, 0.7);
    for (let j = 0; j < 3; j++) add(g, B(0.3, 0.6, 0.05), wn, s * 3.2 + (j - 1) * 0.65, 1.5, 0.82);
  });
  add(g, C(0.9, 1.1, 2, 24), st, 0, 4.1, -0.6);
  add(g, new THREE.ConeGeometry(1.15, 2.2, 24), tl, 0, 6.2, -0.6);
  add(g, C(0.04, 0.04, 1, 6), gd, 0, 7.6, -0.6);
  for (let j = 0; j < 4; j++) add(g, B(0.3, 0.9, 0.05), wn, -0.9 + j * 0.6, 2, 0.82);
  add(g, B(4.8, 0.06, 2), M('#4aa8c0', 0.1, 0.2), 0, 0.2, 3.4);
  for (let i = 0; i < 7; i++) tree(g, -5 + i * 1.7, 4.9, 0.9, 2, 0.2);
  g.userData.tick = drift(g, 50, '#ffe08a', 0.07, (i, t) => [
    (R(i) - 0.5) * 5,
    0.35 + ((R(i + 3) * 2 + t * 0.3) % 2) * 0.9,
    3.4 + (R(i + 7) - 0.5) * 1.8,
  ]);
  return g;
}

export function golden(): THREE.Group {
  const g = new THREE.Group();
  add(g, C(7.6, 7.6, 0.2, 96), M('#a8a05a', 1), 0, 0.1, 0);
  (
    [
      [-3.2, -2.4, 1.8, 2.6, 4.2],
      [-1, -3.8, 1.5, 2.2, 3.4],
      [2.8, -3, 1.6, 2.4, 3.8],
      [4.4, -0.4, 1.2, 1.8, 2.6],
      [-4.6, 0.6, 1.3, 2, 2.8],
    ] as const
  ).forEach(([x, z, a, b, h], i) =>
    rock(g, a, b, h, x, z, i % 2 ? '#b0713c' : '#a86a38', '#e6b870', 0.16)
  );
  const tf = new THREE.Group();
  g.add(tf);
  for (let i = 0; i < 110; i++) {
    const a = R(i) * 6.28;
    const r = 1 + R(i + 9) * 6;
    add(
      tf,
      new THREE.ConeGeometry(0.07, 0.4, 5),
      Mc(i % 3 ? '#d2b85a' : '#a89a4a'),
      r * Math.cos(a),
      0.4,
      r * Math.sin(a)
    );
  }
  swayItems.push({ o: tf, ph: 0, a: 0.02, sp: 1 });
  const cv = new THREE.CatmullRomCurve3(
    [
      [-5, 0.7, -0.5],
      [-2, 0.7, 0.5],
      [1, 0.7, -0.2],
      [4, 0.7, 1.6],
    ].map((p) => new THREE.Vector3(...p))
  );
  add(g, new THREE.TubeGeometry(cv, 40, 0.25, 8), M('#4a8ab0', 0.1, 0.2)).scale.y = 0.3;
  for (let i = 0; i < 4; i++) tree(g, -3 + i * 2.3, 3.8 + R(i), 0.9, 2, 0.2);
  g.userData.tick = drift(g, 40, '#ffd88a', 0.06, (i, t) => [
    Math.cos(i * 2.4 + t * 0.1) * (1 + R(i) * 5.5),
    0.6 + ((R(i + 3) * 4 + t * 0.2) % 3.5),
    Math.sin(i * 2.4 + t * 0.1) * (1 + R(i) * 5.5),
  ]);
  return g;
}

export function kruger(): THREE.Group {
  const g = new THREE.Group();
  const sk = M('#8a8378', 0.95);
  const iv = M('#f1ead8', 0.5);
  add(g, C(7.6, 7.6, 0.2, 96), M('#b59a4a', 1), 0, 0.1, 0);
  const ear: Array<[THREE.Mesh, number]> = [];
  const mk = (s: number) => {
    const e = new THREE.Group();
    add(e, new THREE.SphereGeometry(1, 32, 24), sk, 0, 1.9, 0).scale.set(1.5, 1.1, 1);
    add(e, new THREE.SphereGeometry(0.7, 24, 20), sk, 1.6, 2.1, 0);
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
      sk,
      0,
      0,
      0
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
  add(g, C(1.8, 1.8, 0.05, 48), M('#4a8ab0', 0.1, 0.2), 3.4, 0.22, 2.8);
  for (let i = 0; i < 5; i++) tree(g, -5 + i * 2.4, -3.8 + R(i) * 1.5, 1.1, 2, 0.2);
  for (let i = 0; i < 70; i++) {
    const a = R(i) * 6.28;
    const r = 2 + R(i + 9) * 5;
    add(
      g,
      new THREE.ConeGeometry(0.07, 0.35, 5),
      Mc('#d1bb62'),
      r * Math.cos(a),
      0.37,
      r * Math.sin(a)
    );
  }
  const dd = drift(g, 40, '#d8c08a', 0.07, (i, t) => [
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
  add(g, C(7.6, 7.6, 0.2, 96), M('#4d4f56', 0.9), 0, 0.1, 0);
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 256;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#d8d2c4';
  x.fillRect(0, 0, 128, 256);
  for (let r = 0; r < 48; r++) {
    for (let c = 0; c < 16; c++) {
      x.fillStyle = R(r * 16 + c) > 0.4 ? '#ffd98a' : '#3a3f4a';
      x.fillRect(c * 8 + 1, r * 5 + 1, 6, 3);
    }
  }
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  const wm = new THREE.MeshStandardMaterial({
    map: tx,
    emissive: '#ffffff',
    emissiveMap: tx,
    emissiveIntensity: 0.05,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  wm.userData.i = 0.5;
  glowMaterials.push(wm);
  add(g, C(1.6, 1.6, 7.4, 64, 1, true), wm, 0, 3.9, 0);
  add(g, C(0.8, 0.8, 7.4, 32, 1, true), M('#c9c2b4', 0.8), 0, 3.9, 0);
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
    add(g, B(0.9, h, 0.9), wm, r * Math.cos(a), 0.2 + h / 2, r * Math.sin(a));
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
  const bm = M('#9a9288', 0.9);
  const bk = M('#1c1c20', 0.6);
  const wt = M('#f4f4f4', 0.5);
  const or = M('#e8903a', 0.5);
  const P: THREE.Group[] = [];
  sea(g, '#2a8aa8');
  add(g, C(4.4, 4.7, 0.2, 64), M('#e8d9b0', 1), 0, 0.12, -0.6);
  for (let i = 0; i < 16; i++) {
    const a = R(i) * 6.28;
    const r = 3.3 + R(i + 4) * 1.5;
    const s = 0.5 + R(i + 8) * 0.7;
    add(
      g,
      new THREE.SphereGeometry(s, 24, 16),
      bm,
      r * Math.cos(a),
      s * 0.45,
      -0.6 + r * Math.sin(a)
    ).scale.set(1.2, 0.8, 1);
  }
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Group();
    const a = R(i + 20) * 6.28;
    const r = Math.sqrt(R(i + 30)) * 3;
    p.position.set(r * Math.cos(a), 0.2, -0.6 + r * Math.sin(a));
    p.rotation.y = R(i + 40) * 6.28;
    p.scale.setScalar(0.8 + R(i) * 0.4);
    add(p, new THREE.SphereGeometry(0.22, 16, 12), bk, 0, 0.38, 0).scale.set(1, 1.5, 0.9);
    add(p, new THREE.SphereGeometry(0.17, 16, 12), wt, 0, 0.34, 0.07).scale.set(1, 1.4, 0.6);
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
  const lt = G('#fff3b0', 2.5);
  const dk = M('#2b2b30', 0.6, 0.5);
  const rd = M('#c8342d', 0.6);
  const wh = M('#f4f2ec', 0.7);
  sea(g, '#1f6f92');
  add(g, C(4.2, 4.6, 0.5, 64), M('#b9ad92', 0.95), -0.4, 0.25, 0);
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
      '#7c715f',
      '#a39880',
      0.12
    );
  }
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
  add(g, B(1.6, 0.7, 1), wh, -2.4, 0.85, 1.3);
  add(g, B(1.8, 0.12, 1.2), rd, -2.4, 1.26, 1.3);
  add(g, B(1.4, 0.1, 0.4), M('#d8d0bc', 0.8), 2, 0.55, 2);
  const bm = new THREE.Group();
  bm.position.set(-0.4, 4.55, 0);
  g.add(bm);
  const bmat = new THREE.MeshBasicMaterial({
    color: '#fff4b8',
    transparent: true,
    opacity: 0.2,
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
  const bd = birds(g, 4, 4, 6);
  g.userData.tick = (t: number) => {
    bm.rotation.y = t * 1.2;
    sr(t);
    bd(t);
  };
  return g;
}

export function orlando(): THREE.Group {
  const g = new THREE.Group();
  const pal = ['#e84a5f', '#ff9a3c', '#f4d35e', '#4ecdc4', '#5b8def', '#9b59b6'];
  add(g, C(7.6, 7.6, 0.2, 96), M('#8a8478', 1), 0, 0.1, 0);
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
        roughness: 0.8,
        side: THREE.DoubleSide,
      }),
      x,
      0.2,
      0
    ).scale.setScalar(0.85);
  };
  T(-2.4, '#2a6fd3', '#ffd23f');
  T(2.4, '#d9381e', '#ffd23f');
  add(g, B(2.4, 0.15, 0.5), M('#555', 0.5, 0.6), 0, 4.8, 0);
  for (let i = 0; i < 16; i++) {
    const a = i * 0.4;
    const r = 5.4 + R(i) * 1.2;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    add(g, B(0.7, 0.45, 0.55), M(pal[i % 6], 0.8), x, 0.43, z).rotation.y = -a;
    add(g, B(0.76, 0.06, 0.6), M('#8a8f98', 0.5, 0.5), x, 0.69, z).rotation.y = -a;
  }
  const jp = add(g, new THREE.SphereGeometry(0.09, 10, 8), M('#ff3b3b'), 0, 4.7, 0);
  const cd = add(g, B(0.02, 1, 0.02), M('#222'), 0, 4.7, 0);
  const bd = birds(g, 4, 3.5, 7.5);
  add(
    g,
    new THREE.RingGeometry(4.6, 5.2, 64).rotateX(-Math.PI / 2),
    M('#3a3b40', 0.9),
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
  const rl = M('#555', 0.6, 0.5);
  sh.absarc(0, 0, 5.5, 0, Math.PI * 2, false);
  H.forEach(([x, y, r]) => {
    const h = new THREE.Path();
    h.absarc(x, y, r, 0, Math.PI * 2, true);
    sh.holes.push(h);
  });
  const a = new THREE.Color('#8f7f62');
  const b = new THREE.Color('#e2d4b4');
  add(
    g,
    tint(
      new THREE.ExtrudeGeometry(sh, { depth: 1.1, bevelEnabled: false, curveSegments: 32 }).rotateX(
        -Math.PI / 2
      ),
      (k, _X, Y) => k.copy(a).lerp(b, Math.min(1, Y / 1.1 + 0.05 * Math.sin(Y * 30)))
    ),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide })
  );
  H.forEach(([x, y, r]) => {
    add(
      g,
      new THREE.CircleGeometry(r * 0.97, 32).rotateX(-Math.PI / 2),
      M('#2a8aa8', 0.1, 0.2),
      x,
      0.7,
      -y
    );
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
  add(g, B(5.2, 0.08, 0.6), M('#7a5a3c', 0.8), 0, 1.35, 0);
  [-0.3, 0.3].forEach((z) => {
    add(g, B(5.2, 0.05, 0.05), rl, 0, 1.65, z);
    for (let i = 0; i < 6; i++) add(g, B(0.05, 0.35, 0.05), rl, -2.4 + i * 0.96, 1.5, z);
  });
  [-1, 1].forEach((s) => add(g, B(0.2, 1.35, 0.8), M('#7a5a3c', 0.8), s * 2.7, 0.7, 0));
  rock(g, 1.5, 2.2, 3.2, -5.4, -3, '#7b6a4a', '#b39968', 0.14);
  rock(g, 1.2, 1.9, 2.6, 5.2, -3.6, '#7b6a4a', '#b39968', 0.14);
  for (let i = 0; i < 7; i++) {
    const q = i * 0.9 + 0.6;
    tree(g, 6.4 * Math.cos(q), 6.4 * Math.sin(q), 0.8, i % 2 ? 1 : 2);
  }
  const ms = drift(g, 40, '#eaf6ff', 0.08, (i, t) => [
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
