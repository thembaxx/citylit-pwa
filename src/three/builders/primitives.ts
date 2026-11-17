import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  cascadeize,
  getPlasterBumpTexture,
  getSoftTexture,
  getStoneBumpTexture,
  getWoodBumpTexture,
  lights,
  waterize,
  windy,
} from '../shaders';

export interface SwayItem {
  o: THREE.Object3D;
  ph: number;
  a: number;
  sp: number;
}

export interface WetMaterialEntry {
  mat: THREE.MeshStandardMaterial;
  dryColor: THREE.Color;
  wetColor: THREE.Color;
  rDry: number;
  rWet: number;
}

export interface InstanceTransform {
  x: number;
  y: number;
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

export const glowMaterials: THREE.MeshStandardMaterial[] = [];
export const swayItems: SwayItem[] = [];
export const wetMaterials: WetMaterialEntry[] = [];

const matCache: Record<string, THREE.MeshStandardMaterial> = {};
const foliageCache: Record<string, THREE.MeshStandardMaterial> = {};
const geoCache: Record<string, THREE.BufferGeometry> = {};

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();
const tmpColor = new THREE.Color();

export function resetSceneDynamicLists(ringMat: THREE.MeshStandardMaterial): void {
  glowMaterials.length = 0;
  glowMaterials.push(ringMat);
  swayItems.length = 0;
  wetMaterials.length = 0;
}

export function updateWetSurfaces(rain: number): void {
  const w = Math.max(0, Math.min(1, rain));
  const wetFactor = w * w * (3 - 2 * w);
  for (let i = 0; i < wetMaterials.length; i++) {
    const entry = wetMaterials[i];
    entry.mat.roughness = entry.rDry + (entry.rWet - entry.rDry) * wetFactor;
    entry.mat.color.copy(entry.dryColor).lerp(entry.wetColor, wetFactor * 0.55);
    entry.mat.envMapIntensity = 0.45 + wetFactor * 0.85;
  }
}

export function M(c: THREE.ColorRepresentation, r = 0.7, m = 0): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `m_${colHex}_${r.toFixed(2)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const finalMat = r <= 0.16 && m >= 0.1 ? waterize(mat) : mat;
  matCache[key] = finalMat;
  return finalMat;
}

export function MStone(
  c: THREE.ColorRepresentation,
  r = 0.92,
  bumpScale = 0.032,
  m = 0.02
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `stone_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    bumpMap: getStoneBumpTexture(),
    bumpScale,
  });
  matCache[key] = mat;
  return mat;
}

export function MPlaster(
  c: THREE.ColorRepresentation,
  r = 0.78,
  bumpScale = 0.014,
  m = 0.02
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `plaster_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    bumpMap: getPlasterBumpTexture(),
    bumpScale,
  });
  matCache[key] = mat;
  return mat;
}

export function MWood(
  c: THREE.ColorRepresentation,
  r = 0.86,
  bumpScale = 0.024
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `wood_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: 0.0,
    bumpMap: getWoodBumpTexture(),
    bumpScale,
  });
  matCache[key] = mat;
  return mat;
}

export function MT(
  c: THREE.ColorRepresentation,
  opacity = 0.6,
  r = 0.15,
  m = 0.35,
  doubleSide = true
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `mt_${colHex}_${opacity.toFixed(2)}_${r.toFixed(2)}_${m.toFixed(2)}_${doubleSide ? 1 : 0}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    transparent: true,
    opacity,
    roughness: r,
    metalness: m,
    side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: opacity >= 0.85,
  });
  matCache[key] = mat;
  return mat;
}

export function MWater(
  c: THREE.ColorRepresentation = '#1a7598',
  r = 0.1,
  m = 0.25,
  opacity = 1
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `wat_${colHex}_${r.toFixed(2)}_${m.toFixed(2)}_${opacity.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    transparent: opacity < 1,
    opacity,
  });
  waterize(mat);
  matCache[key] = mat;
  return mat;
}

export function MCascade(
  c: THREE.ColorRepresentation = '#d9f4ff',
  opacity = 0.88
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `casc_${colHex}_${opacity.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.22,
    metalness: 0.05,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });
  cascadeize(mat);
  matCache[key] = mat;
  return mat;
}

export function MWet(
  c: THREE.ColorRepresentation,
  rDry = 0.84,
  rWet = 0.16,
  m = 0.05,
  tex: 'stone' | 'plaster' | 'plain' = 'stone'
): THREE.MeshStandardMaterial {
  const dryColor = new THREE.Color(c);
  const wetColor = dryColor.clone().multiplyScalar(0.72);
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: rDry,
    metalness: m,
    bumpMap:
      tex === 'stone'
        ? getStoneBumpTexture()
        : tex === 'plaster'
          ? getPlasterBumpTexture()
          : undefined,
    bumpScale: tex === 'stone' ? 0.022 : tex === 'plaster' ? 0.01 : 0,
  });
  wetMaterials.push({ mat, dryColor, wetColor, rDry, rWet });
  return mat;
}

export function G(c: THREE.ColorRepresentation, intensity = 1): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    emissive: c,
    emissiveIntensity: 0.15,
    roughness: 0.42,
    metalness: 0.08,
  });
  mat.userData.i = intensity;
  glowMaterials.push(mat);
  return lights(mat);
}

export function Mc(c: string): THREE.MeshStandardMaterial {
  return (
    foliageCache[c] ??
    (foliageCache[c] = windy(
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0.02 })
    ))
  );
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

export function CB(w: number, h: number, d: number, r = 0.04, segs = 2): THREE.BufferGeometry {
  const cr = Math.min(r, Math.min(w, h, d) * 0.42);
  const key = `cb_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}_${cr.toFixed(3)}_${segs}`;
  if (geoCache[key]) return geoCache[key];
  const geo = new RoundedBoxGeometry(w, h, d, segs, cr);
  geoCache[key] = geo;
  return geo;
}

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

export function instancedMeshes(
  g: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  transforms: readonly InstanceTransform[],
  colors?: readonly THREE.ColorRepresentation[]
): THREE.InstancedMesh | null {
  if (!transforms.length) return null;
  const im = new THREE.InstancedMesh(geo, mat, transforms.length);
  for (let i = 0; i < transforms.length; i++) {
    const t = transforms[i];
    tmpPos.set(t.x, t.y, t.z);
    tmpEuler.set(t.rx ?? 0, t.ry ?? 0, t.rz ?? 0);
    tmpQuat.setFromEuler(tmpEuler);
    tmpScale.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
    tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
    im.setMatrixAt(i, tmpMatrix);
    if (colors && colors.length > 0) {
      im.setColorAt(i, tmpColor.set(colors[i % colors.length]));
    }
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  g.add(im);
  return im;
}

export function gableRoofGeo(
  w: number,
  d: number,
  h: number,
  overhang = 0.08
): THREE.BufferGeometry {
  const hw = w / 2 + overhang;
  const hd = d + overhang * 2;
  const key = `gr_${hw.toFixed(3)}_${hd.toFixed(3)}_${h.toFixed(3)}`;
  if (geoCache[key]) return geoCache[key];
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(0, h);
  s.lineTo(hw, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: hd,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 1,
  }).translate(0, 0, -hd / 2);
  geoCache[key] = geo;
  return geo;
}

export function capeDutchGableGeo(w = 0.8, h = 0.72, depth = 0.14): THREE.BufferGeometry {
  const key = `cdg_${w.toFixed(2)}_${h.toFixed(2)}_${depth.toFixed(2)}`;
  if (geoCache[key]) return geoCache[key];
  const hw = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(-hw, h * 0.25);
  s.bezierCurveTo(-hw * 0.75, h * 0.28, -hw * 0.7, h * 0.56, -hw * 0.4, h * 0.62);
  s.bezierCurveTo(-hw * 0.28, h * 0.85, -hw * 0.12, h, 0, h);
  s.bezierCurveTo(hw * 0.12, h, hw * 0.28, h * 0.85, hw * 0.4, h * 0.62);
  s.bezierCurveTo(hw * 0.7, h * 0.56, hw * 0.75, h * 0.28, hw, h * 0.25);
  s.lineTo(hw, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.014,
    bevelThickness: 0.014,
    bevelSegments: 2,
    curveSegments: 12,
  }).translate(0, 0, -depth / 2);
  geoCache[key] = geo;
  return geo;
}

export function archGeo(w: number, h: number, rArch: number, depth: number): THREE.BufferGeometry {
  const key = `arch_${w.toFixed(2)}_${h.toFixed(2)}_${rArch.toFixed(2)}_${depth.toFixed(2)}`;
  if (geoCache[key]) return geoCache[key];
  const hw = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(-hw, h);
  s.lineTo(hw, h);
  s.lineTo(hw, 0);
  s.lineTo(rArch, 0);
  s.absarc(0, h * 0.48, rArch, 0, Math.PI, false);
  s.lineTo(-rArch, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 1,
    curveSegments: 14,
  }).translate(0, 0, -depth / 2);
  geoCache[key] = geo;
  return geo;
}

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

export function rock(
  g: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  x: number,
  z: number,
  c1: string,
  c2: string,
  k = 0.12,
  y0 = 0
): THREE.Mesh {
  const gm = C(rt, rb, h, 48, 12);
  const p = gm.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const a = Math.atan2(Z, X);
    const bedding = Math.sin(Y * 14 + a * 0.4) * 0.028;
    const f =
      1 +
      k *
        (Math.sin(a * 3 + x) * 0.5 +
          Math.sin(a * 5 + Y * 2.2) * 0.3 +
          Math.sin(a * 8 - Y * 3.1 + z) * 0.2) +
      bedding;
    p.setXYZ(i, X * f, Y, Z * f);
  }
  const a = new THREE.Color(c1);
  const b = new THREE.Color(c2);
  const aoDark = a.clone().multiplyScalar(0.68);
  tint(gm, (c, _X, Y) => {
    const hNorm = Math.min(1, Math.max(0, Y / h + 0.5 + 0.07 * Math.sin(Y * 26)));
    c.copy(a).lerp(b, hNorm);
    const ao = Math.min(1, Math.max(0, (Y + h * 0.5) / Math.max(0.2, h * 0.28)));
    c.lerp(aoDark, (1 - ao) * 0.48);
  });
  return add(
    g,
    gm,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02,
      bumpMap: getStoneBumpTexture(),
      bumpScale: 0.032,
    }),
    x,
    y0 + h / 2,
    z
  );
}

let organicBoulderGeo: THREE.BufferGeometry | null = null;

export function scatterRocks(
  g: THREE.Object3D,
  items: readonly InstanceTransform[],
  c1: string,
  c2: string
): void {
  if (!organicBoulderGeo) {
    const ge = new THREE.IcosahedronGeometry(0.45, 1);
    const p = ge.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const X = p.getX(i);
      const Y = p.getY(i);
      const Z = p.getZ(i);
      const d = 0.92 + 0.22 * Math.sin(X * 5.2 + Z * 3.1) + 0.12 * Math.cos(Y * 6.5 - X * 2.7);
      p.setXYZ(i, X * d, Y * (Y < 0 ? 0.68 : 0.92), Z * d);
    }
    ge.computeVertexNormals();
    organicBoulderGeo = ge;
  }
  const colA = new THREE.Color(c1);
  const colB = new THREE.Color(c2);
  const colors = items.map((_, i) => colA.clone().lerp(colB, R(i * 11 + 3)));
  instancedMeshes(
    g,
    organicBoulderGeo,
    new THREE.MeshStandardMaterial({
      roughness: 0.93,
      metalness: 0.02,
      bumpMap: getStoneBumpTexture(),
      bumpScale: 0.025,
    }),
    items,
    colors
  );
}

let tuftGeoCache: THREE.BufferGeometry | null = null;

export function grassTufts(
  g: THREE.Object3D,
  items: readonly InstanceTransform[],
  palette: readonly string[] = ['#4c7a38', '#688f44', '#8b9342']
): void {
  if (!tuftGeoCache) {
    const g1 = new THREE.ConeGeometry(0.08, 0.24, 5).translate(0, 0.12, 0);
    tuftGeoCache = g1;
  }
  const mat = Mc(palette[0]);
  const cols = items.map((_, i) => palette[i % palette.length]);
  instancedMeshes(g, tuftGeoCache, mat, items, cols);
}

export function tree(g: THREE.Object3D, x: number, z: number, s = 1, k = 1, y = 0): THREE.Group {
  const t = new THREE.Group();
  t.position.set(x, y, z);
  t.scale.setScalar(s);
  t.rotation.y = R(x * 3 + z) * 6.28;

  if (k === 3) {
    // Coastal palm / wild banana
    const trunkMat = MWood('#6e553e', 0.9);
    for (let i = 0; i < 6; i++) {
      const seg = add(
        t,
        C(0.045 - i * 0.004, 0.055 - i * 0.004, 0.24, 7),
        trunkMat,
        Math.sin(i * 0.25) * 0.08,
        0.12 + i * 0.2,
        0
      );
      seg.rotation.z = -0.06 * i;
    }
    const crown = new THREE.Group();
    crown.position.set(0.22, 1.28, 0);
    t.add(crown);
    const frondMat = Mc('#3c7b3b');
    const frondGeo = new THREE.ConeGeometry(0.14, 0.85, 4);
    frondGeo.scale(1, 1, 0.25);
    frondGeo.rotateZ(-Math.PI / 2.2);
    for (let i = 0; i < 7; i++) {
      const fr = add(crown, frondGeo, frondMat, 0, 0.02, 0);
      fr.rotation.y = (i * Math.PI * 2) / 7;
      fr.rotation.z = -0.35 - (i % 2) * 0.2;
    }
    g.add(t);
    swayItems.push({ o: crown, ph: R(x * 7 + z) * 6, a: 0.05, sp: 1.4 });
    return t;
  }

  if (k === 4) {
    // Tall Cape pine / stone pine or cypress
    add(t, C(0.035, 0.075, 0.95, 8), MWood('#4e3826', 0.92), 0, 0.47, 0);
    const f = new THREE.Group();
    f.position.y = 0.82;
    t.add(f);
    const pineCols = ['#2a5630', '#36693a', '#447943'];
    for (let i = 0; i < 4; i++) {
      const rB = 0.42 - i * 0.08;
      const tier = add(f, C(rB * 0.25, rB, 0.36, 9), Mc(pineCols[i % 3]), 0, i * 0.24, 0);
      tier.rotation.y = i * 0.5;
    }
    g.add(t);
    swayItems.push({ o: f, ph: R(x * 7 + z) * 6, a: 0.025, sp: 1.0 });
    return t;
  }

  // Standard Jacaranda (0), Broadleaf/Fynbos Oak (1), Umbrella Acacia (2)
  const trunkCol = k === 2 ? '#4d3624' : '#4a3a2a';
  add(t, C(0.038, 0.088, 0.92, 8), MWood(trunkCol, 0.92), 0, 0.46, 0);
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + R(x + i) * 0.3;
    const b = add(
      t,
      C(0.015, 0.034, 0.54, 6),
      MWood(trunkCol, 0.92),
      Math.cos(a) * 0.13,
      0.88,
      Math.sin(a) * 0.13
    );
    b.rotation.z = -Math.cos(a) * (k === 2 ? 0.92 : 0.68);
    b.rotation.x = Math.sin(a) * (k === 2 ? 0.92 : 0.68);
  }
  const palettes: Record<number, readonly [string, string, string]> = {
    0: ['#8a5bc4', '#a77ae0', '#6d45a6'],
    1: ['#3e7738', '#569143', '#2d5c2b'],
    2: ['#7e8d3b', '#98a64a', '#5f6e2d'],
  };
  const cs = palettes[k] ?? palettes[1];
  const f = new THREE.Group();
  f.position.y = k === 2 ? 1.12 : 1.05;
  t.add(f);
  if (k === 2) f.scale.set(1.55, 0.44, 1.55);

  const count = k === 2 ? 7 : 8;
  for (let i = 0; i < count; i++) {
    const ge = new THREE.IcosahedronGeometry(0.21 + R(i + k * 9) * 0.13, 1);
    const p = ge.attributes.position;
    for (let j = 0; j < p.count; j++) {
      const X = p.getX(j);
      const Y = p.getY(j);
      const Z = p.getZ(j);
      const d = 1 + 0.16 * Math.sin(X * 21 + i) * Math.cos(Z * 17 + Y * 11);
      p.setXYZ(j, X * d, Y * d, Z * d);
    }
    ge.computeVertexNormals();
    const q = (k === 2 ? 0.36 : 0.3) * (1 + (i % 3) * 0.28);
    add(
      f,
      ge,
      Mc(cs[i % 3]),
      Math.cos(i * 2.39) * q,
      R(i + 3) * (k === 2 ? 0.22 : 0.42) + (i > 5 && k !== 2 ? 0.28 : 0),
      Math.sin(i * 2.39) * q
    );
  }
  g.add(t);
  swayItems.push({ o: f, ph: R(x * 7 + z) * 6, a: 0.03, sp: 1.1 });
  return t;
}

export function rondavel(
  g: THREE.Object3D,
  x: number,
  z: number,
  y = 0,
  sc = 1,
  wallCol = '#ece3d0',
  roofCol = '#8a6b42'
): THREE.Group {
  const rd = new THREE.Group();
  rd.position.set(x, y, z);
  rd.scale.setScalar(sc);
  add(rd, C(0.42, 0.46, 0.06, 20), MStone('#685d50', 0.94), 0, 0.03, 0);
  add(rd, C(0.36, 0.37, 0.44, 20), MPlaster(wallCol, 0.82), 0, 0.26, 0);
  add(rd, C(0.375, 0.375, 0.07, 20), MPlaster('#a34a36', 0.86), 0, 0.08, 0);
  add(rd, new THREE.ConeGeometry(0.46, 0.36, 20), MWood(roofCol, 0.94), 0, 0.64, 0);
  add(rd, C(0.03, 0.04, 0.08, 8), MWood('#4e3824', 0.9), 0, 0.84, 0);
  add(rd, CB(0.11, 0.26, 0.04, 0.01), MWood('#4d321c', 0.8), 0, 0.17, 0.36);
  g.add(rd);
  return rd;
}

export function colonialHouse(
  g: THREE.Object3D,
  opts: {
    x: number;
    y?: number;
    z: number;
    ry?: number;
    w?: number;
    h?: number;
    d?: number;
    wall: string;
    roof: string;
    trim?: string;
    capeDutch?: boolean;
  }
): THREE.Group {
  const {
    x,
    y = 0,
    z,
    ry = 0,
    w = 1.0,
    h = 0.85,
    d = 0.72,
    wall,
    roof,
    trim = '#f4f0e8',
    capeDutch = false,
  } = opts;
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = ry;

  // Raised stoep plinth
  add(grp, CB(w + 0.14, 0.1, d + 0.22, 0.02), MStone('#6a645c', 0.9), 0, 0.05, 0.08);
  // Stucco body
  add(grp, CB(w, h, d, 0.03), MPlaster(wall, 0.76), 0, 0.1 + h / 2, 0);
  // Moulded parapet cornice
  add(grp, CB(w + 0.06, 0.06, d + 0.06, 0.02), MPlaster(trim, 0.72), 0, 0.1 + h + 0.02, 0);

  // Pitched roof or parapet + Cape Dutch gable
  add(
    grp,
    gableRoofGeo(w * 0.96, d * 0.96, h * 0.42, 0.05),
    MPlaster(roof, 0.82),
    0,
    0.1 + h + 0.04,
    0
  );
  if (capeDutch) {
    add(
      grp,
      capeDutchGableGeo(w * 0.44, h * 0.56, 0.09),
      MPlaster(trim, 0.74),
      0,
      0.1 + h,
      d / 2 + 0.02
    );
  }

  // Front door + transom & flanking shuttered glowing windows
  add(
    grp,
    CB(w * 0.18, h * 0.46, 0.04, 0.01),
    MWood('#3e281a', 0.75),
    0,
    0.1 + h * 0.23,
    d / 2 + 0.01
  );
  const winMat = G('#ffe1a0', 0.85);
  const shutterMat = MWood('#274c3c', 0.72);
  for (const sx of [-w * 0.28, w * 0.28]) {
    add(grp, CB(w * 0.16, h * 0.28, 0.03, 0.01), winMat, sx, 0.1 + h * 0.52, d / 2 + 0.01);
    add(
      grp,
      CB(0.05, h * 0.28, 0.03, 0.005),
      shutterMat,
      sx - w * 0.105,
      0.1 + h * 0.52,
      d / 2 + 0.015
    );
    add(
      grp,
      CB(0.05, h * 0.28, 0.03, 0.005),
      shutterMat,
      sx + w * 0.105,
      0.1 + h * 0.52,
      d / 2 + 0.015
    );
  }
  g.add(grp);
  return grp;
}

export function lampPost(g: THREE.Object3D, x: number, y: number, z: number, h = 0.65): void {
  add(g, C(0.016, 0.024, h, 6), M('#22262e', 0.4, 0.75), x, y + h / 2, z);
  add(g, new THREE.SphereGeometry(0.04, 8, 6), G('#ffdc96', 1.25), x, y + h + 0.03, z);
}

export function drift(
  g: THREE.Object3D,
  count: number,
  col: THREE.ColorRepresentation,
  sz: number,
  fn: (i: number, t: number) => [number, number, number],
  opacity = 0.78
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
      opacity,
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

export function bird(): THREE.Group {
  const b = new THREE.Group();
  const wh = M('#f4f4f2', 0.6);
  const gy = MT('#bfc5cf', 0.96, 0.6, 0, true);
  const or = M('#e8903a', 0.5);
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
  const b = M(col, 0.35, 0.45);
  const gl = MT('#bfe0ee', 0.65, 0.1, 0.5, true);
  const st = M('#777', 0.4, 0.8);
  add(c, C(0.012, 0.012, 0.3, 8), st, 0, -0.15, 0);
  add(c, new THREE.SphereGeometry(0.17, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), b, 0, -0.3, 0);
  add(c, C(0.17, 0.17, 0.16, 20, 1, true), gl, 0, -0.38, 0);
  add(c, C(0.17, 0.15, 0.03, 20), b, 0, -0.47, 0);
  add(c, CB(0.05, 0.03, 0.03, 0.008), st, 0, 0, 0);
  return c;
}

export function train(col: string): THREE.Group {
  const t = new THREE.Group();
  const b = M(col, 0.45, 0.35);
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
    add(t, CB(0.66, 0.07, 0.34, 0.01), wn, x - (k === 2 ? 0.04 : 0), 0.27, 0);
    add(t, CB(0.8, 0.03, 0.3, 0.008), st, x, 0.38, 0);
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
  const m = M(col, 0.88);
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
    new THREE.ExtrudeGeometry(h, {
      depth: 0.24,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 1,
    }).translate(0, 0.04, -0.12),
    M('#f0eee8', 0.45)
  );
  add(b, CB(0.4, 0.16, 0.22, 0.02), M(col, 0.55), -0.08, 0.26, 0);
  add(b, CB(0.28, 0.06, 0.23, 0.01), MT('#1c2a3a', 0.85, 0.15, 0.6), -0.06, 0.28, 0);
  add(b, C(0.035, 0.048, 0.14, 8), M('#c8342d', 0.6), -0.15, 0.4, 0);
  b.scale.setScalar(sc);
  return b;
}

export function seaRings(
  g: THREE.Object3D,
  y: number,
  r0: number,
  count = 3,
  col: THREE.ColorRepresentation = '#e8fbff'
): (t: number) => void {
  const rs = Array.from({ length: count }, () =>
    add(
      g,
      new THREE.RingGeometry(r0, r0 + 0.09, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: col,
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
      r.material.opacity = 0.48 * (1 - k);
    });
  };
}

export function sea(g: THREE.Object3D, c = '#1c6e91', shallow = '#2da8b8'): THREE.Mesh {
  const geo = C(7.8, 7.8, 0.1, 96, 1);
  // Radial bathymetry vertex tinting for crisp shallows -> ocean navy gradient
  const cDeep = new THREE.Color(c);
  const cShal = new THREE.Color(shallow);
  const pos = geo.attributes.position;
  const cols: number[] = [];
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    const mix = Math.min(1, Math.max(0, (r - 2.0) / 5.4));
    tmp.copy(cShal).lerp(cDeep, mix);
    cols.push(tmp.r, tmp.g, tmp.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.12,
    metalness: 0.25,
  });
  waterize(mat);
  return add(g, geo, mat, 0, 0.05, 0);
}
