import * as THREE from 'three';
import { getSoftTexture, lights, waterize, windy } from '../shaders';

export interface SwayItem {
  o: THREE.Object3D;
  ph: number;
  a: number;
  sp: number;
}

export const glowMaterials: THREE.MeshStandardMaterial[] = [];
export const swayItems: SwayItem[] = [];
const foliageCache: Record<string, THREE.MeshStandardMaterial> = {};

export function resetSceneDynamicLists(ringMat: THREE.MeshStandardMaterial): void {
  glowMaterials.length = 0;
  glowMaterials.push(ringMat);
  swayItems.length = 0;
}

export function M(c: THREE.ColorRepresentation, r = 0.7, m = 0): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  return r <= 0.15 && m >= 0.1 ? waterize(mat) : mat;
}

export function G(c: THREE.ColorRepresentation, intensity = 1): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    emissive: c,
    emissiveIntensity: 0.12,
    roughness: 0.5,
  });
  mat.userData.i = intensity;
  glowMaterials.push(mat);
  return lights(mat);
}

export function Mc(c: string): THREE.MeshStandardMaterial {
  return foliageCache[c] ?? (foliageCache[c] = windy(M(c, 0.9)));
}

export function add<T extends THREE.BufferGeometry, U extends THREE.Material>(
  g: THREE.Object3D,
  geo: T,
  mat: U,
  x = 0,
  y = 0,
  z = 0
): THREE.Mesh<T, U> {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  g.add(mesh);
  return mesh;
}

export const B = (w: number, h: number, d: number): THREE.BoxGeometry =>
  new THREE.BoxGeometry(w, h, d);

export const C = (
  rt: number,
  rb: number,
  h: number,
  seg = 32,
  hseg = 1,
  open = false,
  thetaStart = 0,
  thetaLength = Math.PI * 2
): THREE.CylinderGeometry =>
  new THREE.CylinderGeometry(rt, rb, h, seg, hseg, open, thetaStart, thetaLength);

export const n = (x: number, z: number): number =>
  Math.sin(x * 1.3 + z * 0.7) * 0.5 +
  Math.sin(x * 2.9 - z * 2.1) * 0.25 +
  Math.sin(x * 5.7 + z * 4.3) * 0.12;

export const R = (i: number): number => {
  const x = Math.sin(i * 127.1) * 43758.5;
  return x - Math.floor(x);
};

export function lines(verts: number[], col: THREE.ColorRepresentation): THREE.LineSegments {
  const geo = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute(verts, 3)
  );
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col }));
}

export function tint<T extends THREE.BufferGeometry>(
  geo: T,
  fn: (k: THREE.Color, x: number, y: number, z: number) => void
): T {
  const p = geo.attributes.position;
  const c: number[] = [];
  const k = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    fn(k, p.getX(i), p.getY(i), p.getZ(i));
    c.push(k.r, k.g, k.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  geo.computeVertexNormals();
  return geo;
}

export function tree(g: THREE.Object3D, x: number, z: number, s = 1, k = 1, y = 0): THREE.Group {
  const t = new THREE.Group();
  t.position.set(x, y, z);
  t.scale.setScalar(s);
  t.rotation.y = R(x * 3 + z) * 6;
  add(t, C(0.04, 0.09, 0.9, 8), Mc(k === 2 ? '#5a3d26' : '#4a3a2a'), 0, 0.45, 0);
  for (let i = 0; i < 3; i++) {
    const b = add(
      t,
      C(0.015, 0.035, 0.5, 6),
      Mc('#4a3a2a'),
      Math.cos(i * 2.1) * 0.12,
      0.9,
      Math.sin(i * 2.1) * 0.12
    );
    b.rotation.z = -Math.cos(i * 2.1) * 0.7;
    b.rotation.x = Math.sin(i * 2.1) * 0.7;
  }
  const palettes = [
    ['#8a5fc0', '#a77bd6', '#6f4aa8'],
    ['#3f7a3a', '#5a9446', '#2e5f2d'],
    ['#9aa84a', '#b9b85a', '#7d8a3b'],
  ];
  const cs = palettes[k] ?? palettes[1];
  const f = new THREE.Group();
  f.position.y = 1.05;
  t.add(f);
  if (k === 2) f.scale.set(1.35, 0.65, 1.35);

  for (let i = 0; i < 9; i++) {
    const ge = new THREE.IcosahedronGeometry(0.22 + R(i + k * 9) * 0.14, 1);
    const p = ge.attributes.position;
    for (let j = 0; j < p.count; j++) {
      const X = p.getX(j);
      const Y = p.getY(j);
      const Z = p.getZ(j);
      const d = 1 + 0.16 * Math.sin(X * 23 + i) * Math.cos(Z * 19 + Y * 11);
      p.setXYZ(j, X * d, Y * d, Z * d);
    }
    ge.computeVertexNormals();
    const q = 0.32 * (1 + (i % 3) * 0.3);
    add(
      f,
      ge,
      Mc(cs[i % 3]),
      Math.cos(i * 2.4) * q,
      R(i + 3) * 0.4 + (i > 5 ? 0.3 : 0),
      Math.sin(i * 2.4) * q
    );
  }
  g.add(t);
  swayItems.push({ o: f, ph: R(x * 7 + z) * 6, a: 0.03, sp: 1.1 });
  return t;
}

export function drift(
  g: THREE.Object3D,
  count: number,
  col: THREE.ColorRepresentation,
  sz: number,
  fn: (i: number, t: number) => [number, number, number]
): (t: number) => void {
  const p = new Float32Array(count * 3);
  const ge = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(p, 3));
  const o = new THREE.Points(
    ge,
    new THREE.PointsMaterial({
      color: col,
      size: sz * 1.6,
      map: getSoftTexture(),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  o.frustumCulled = false;
  g.add(o);
  return (t: number) => {
    for (let i = 0; i < count; i++) {
      const v = fn(i, t);
      p[i * 3] = v[0];
      p[i * 3 + 1] = v[1];
      p[i * 3 + 2] = v[2];
    }
    ge.attributes.position.needsUpdate = true;
  };
}

export function rock(
  g: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  x: number,
  z: number,
  c1: string,
  c2: string,
  k = 0.1,
  y0 = 0
): THREE.Mesh {
  const gm = C(rt, rb, h, 48, 10);
  const p = gm.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const a = Math.atan2(Z, X);
    const f =
      1 +
      k *
        (Math.sin(a * 3 + x) * 0.5 +
          Math.sin(a * 5 + Y * 2) * 0.3 +
          Math.sin(a * 8 - Y * 3 + z) * 0.2) +
      0.03 * Math.sin(Y * 9);
    p.setXYZ(i, X * f, Y, Z * f);
  }
  const a = new THREE.Color(c1);
  const b = new THREE.Color(c2);
  tint(gm, (c, _X, Y) =>
    c.copy(a).lerp(b, Math.min(1, Math.max(0, Y / h + 0.5 + 0.08 * Math.sin(Y * 30))))
  );
  return add(
    g,
    gm,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
    x,
    y0 + h / 2,
    z
  );
}

export function bird(): THREE.Group {
  const b = new THREE.Group();
  const wh = M('#f4f4f2', 0.6);
  const gy = M('#bfc5cf', 0.6);
  const or = M('#e8903a', 0.5);
  gy.side = THREE.DoubleSide;
  const P = (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    s = 0
  ) => {
    const o = add(b, geo, m, x, y, z);
    o.userData.s = s;
    return o;
  };
  P(new THREE.SphereGeometry(0.05, 10, 8), wh, 0, 0, 0).scale.set(0.8, 0.7, 1.9);
  P(new THREE.SphereGeometry(0.03, 10, 8), wh, 0, 0.015, 0.1);
  P(new THREE.ConeGeometry(0.012, 0.05, 6).rotateX(Math.PI / 2), or, 0, 0.012, 0.14);
  P(new THREE.ConeGeometry(0.03, 0.09, 4).rotateX(-Math.PI / 2), wh, 0, 0, -0.12).scale.set(
    1,
    0.25,
    1
  );

  const ws = new THREE.Shape();
  ws.moveTo(0, -0.05);
  ws.lineTo(0.1, -0.06);
  ws.lineTo(0.22, 0.01);
  ws.lineTo(0.2, 0.04);
  ws.lineTo(0.08, 0.03);
  ws.lineTo(0, 0.04);
  ws.closePath();
  const wg = new THREE.ShapeGeometry(ws).rotateX(-Math.PI / 2);
  P(wg, gy, 0, 0.01, 0, 1);
  P(wg, gy, 0, 0.01, 0, -1).scale.x = -1;
  return b;
}

export function birds(g: THREE.Object3D, count: number, r: number, y: number): (t: number) => void {
  const bs = Array.from({ length: count }, () => {
    const b = bird();
    g.add(b);
    return b;
  });
  return (t: number) => {
    bs.forEach((b, i) => {
      const a = t * 0.25 + (i * 6.28) / count;
      b.position.set(r * Math.cos(a), y + Math.sin(t * 0.7 + i) * 0.3, r * Math.sin(a));
      b.rotation.y = -a;
      b.children.forEach((w) => {
        w.rotation.z = (w.userData.s as number) * Math.sin(t * 9 + i) * 0.6;
      });
    });
  };
}

let carGeos: {
  body: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
  wheel: THREE.BufferGeometry;
  lamp: THREE.BufferGeometry;
} | null = null;

export function car(col: string, sc = 0.5): THREE.Group {
  if (!carGeos) {
    const extrude = (sh: THREE.Shape, d: number, bs: number) =>
      new THREE.ExtrudeGeometry(sh, {
        depth: d,
        bevelEnabled: true,
        bevelSize: bs,
        bevelThickness: 0.03,
        bevelSegments: 2,
        curveSegments: 8,
      }).translate(0, 0, -d / 2);
    const s = new THREE.Shape();
    s.moveTo(-0.5, 0.06);
    s.lineTo(-0.5, 0.16);
    s.quadraticCurveTo(-0.5, 0.21, -0.44, 0.22);
    s.lineTo(-0.3, 0.23);
    s.lineTo(-0.2, 0.33);
    s.lineTo(0.07, 0.33);
    s.lineTo(0.22, 0.24);
    s.lineTo(0.42, 0.2);
    s.quadraticCurveTo(0.5, 0.19, 0.5, 0.12);
    s.lineTo(0.5, 0.06);
    s.closePath();
    const w = new THREE.Shape();
    w.moveTo(-0.25, 0.24);
    w.lineTo(-0.18, 0.315);
    w.lineTo(0.06, 0.315);
    w.lineTo(0.19, 0.24);
    w.closePath();
    carGeos = {
      body: extrude(s, 0.4, 0.02),
      glass: extrude(w, 0.43, 0.005),
      wheel: new THREE.CylinderGeometry(0.075, 0.075, 0.08, 16).rotateX(Math.PI / 2),
      lamp: new THREE.BoxGeometry(0.02, 0.035, 0.08),
    };
  }
  const c = new THREE.Group();
  const b = M(col, 0.35, 0.55);
  const gl = M('#1a2230', 0.1, 0.6);
  const wh = M('#15161a', 0.8);
  const hl = G('#fff2c0', 1.5);
  const tl = G('#ff2a2a', 1.5);
  add(c, carGeos.body, b);
  add(c, carGeos.glass, gl);
  for (const [x, z] of [
    [-0.3, -0.2],
    [-0.3, 0.2],
    [0.32, -0.2],
    [0.32, 0.2],
  ]) {
    add(c, carGeos.wheel, wh, x, 0.075, z);
  }
  for (const z of [-0.13, 0.13]) {
    add(c, carGeos.lamp, hl, 0.53, 0.13, z);
    add(c, carGeos.lamp, tl, -0.53, 0.15, z);
  }
  c.scale.setScalar(sc);
  return c;
}

export function gondola(col: string): THREE.Group {
  const c = new THREE.Group();
  const b = M(col, 0.4, 0.4);
  const gl = M('#bfe0ee', 0.1, 0.5);
  const st = M('#777', 0.4, 0.8);
  gl.transparent = true;
  gl.opacity = 0.65;
  gl.side = THREE.DoubleSide;
  add(c, C(0.012, 0.012, 0.3, 8), st, 0, -0.15, 0);
  add(c, new THREE.SphereGeometry(0.17, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), b, 0, -0.3, 0);
  add(c, C(0.17, 0.17, 0.16, 20, 1, true), gl, 0, -0.38, 0);
  add(c, C(0.17, 0.15, 0.03, 20), b, 0, -0.47, 0);
  add(c, B(0.05, 0.03, 0.03), st, 0, 0, 0);
  return c;
}

export function train(col: string): THREE.Group {
  const t = new THREE.Group();
  const b = M(col, 0.5, 0.3);
  const wn = M('#1a2230', 0.1, 0.6);
  const wh = M('#15161a', 0.8);
  const st = M('#e8e8ea', 0.6);
  const cw = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12).rotateX(Math.PI / 2);
  const mk = (nose: boolean) => {
    const s = new THREE.Shape();
    s.moveTo(-0.4, 0);
    s.lineTo(-0.4, 0.28);
    s.lineTo(0.4, 0.28);
    if (nose) {
      s.lineTo(0.5, 0.14);
      s.lineTo(0.5, 0);
    } else {
      s.lineTo(0.4, 0);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.28,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.02,
      bevelSegments: 2,
    }).translate(0, 0.08, -0.14);
  };
  const A = mk(false);
  const N = mk(true);
  [-0.86, 0, 0.86].forEach((x, k) => {
    add(t, k === 2 ? N : A, b, x, 0, 0);
    add(t, new THREE.BoxGeometry(0.66, 0.07, 0.34), wn, x - (k === 2 ? 0.04 : 0), 0.27, 0);
    add(t, new THREE.BoxGeometry(0.8, 0.03, 0.3), st, x, 0.38, 0);
    for (const wx of [-0.26, 0.26]) {
      for (const z of [-0.13, 0.13]) {
        add(t, cw, wh, x + wx, 0.06, z);
      }
    }
  });
  return t;
}

export function animal(col: string): THREE.Group {
  const a = new THREE.Group();
  const m = M(col, 0.9);
  const dk = M('#2a2420', 0.9);
  add(a, new THREE.SphereGeometry(0.07, 12, 10), m, 0, 0.13, 0).scale.set(1.5, 0.85, 0.75);
  add(a, new THREE.SphereGeometry(0.04, 10, 8), m, 0.12, 0.17, 0).scale.set(1.4, 1, 0.8);
  add(a, C(0.02, 0.03, 0.08, 8), m, 0.09, 0.15, 0).rotation.z = -0.7;
  for (const [x, z] of [
    [0.06, 0.035],
    [0.06, -0.035],
    [-0.06, 0.035],
    [-0.06, -0.035],
  ]) {
    add(a, C(0.008, 0.012, 0.1, 6), dk, x, 0.05, z);
  }
  add(a, C(0.004, 0.006, 0.08, 6), dk, -0.11, 0.12, 0).rotation.z = 0.5;
  for (const s of [-1, 1]) {
    add(a, new THREE.ConeGeometry(0.01, 0.05, 6), dk, 0.15, 0.22, s * 0.025).rotation.z = -0.4;
  }
  return a;
}

export function boat(col: string, sc = 1): THREE.Group {
  const b = new THREE.Group();
  const h = new THREE.Shape();
  h.moveTo(-0.5, 0);
  h.lineTo(0.5, 0);
  h.lineTo(0.62, 0.14);
  h.lineTo(-0.5, 0.14);
  h.closePath();
  add(
    b,
    new THREE.ExtrudeGeometry(h, { depth: 0.24, bevelEnabled: false }).translate(0, 0.04, -0.12),
    M('#e8e8ea', 0.5)
  );
  add(b, B(0.4, 0.16, 0.2), M(col, 0.6), -0.1, 0.26, 0);
  add(b, C(0.04, 0.05, 0.14, 8), M('#c8342d', 0.6), -0.15, 0.4, 0);
  b.scale.setScalar(sc);
  return b;
}

export function seaRings(g: THREE.Object3D, y: number, r0: number, count = 3): (t: number) => void {
  const rs = Array.from({ length: count }, () =>
    add(
      g,
      new THREE.RingGeometry(r0, r0 + 0.08, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: '#e8fbff',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      0,
      y,
      0
    )
  );
  return (t: number) => {
    rs.forEach((r, i) => {
      const k = (t * 0.2 + i / count) % 1;
      r.scale.setScalar(1 + k * 0.9);
      r.material.opacity = 0.45 * (1 - k);
    });
  };
}

export const sea = (g: THREE.Object3D, c = '#1c6e91'): THREE.Mesh =>
  add(g, C(7.8, 7.8, 0.1, 96), M(c, 0.15, 0.25), 0, 0.05, 0);
