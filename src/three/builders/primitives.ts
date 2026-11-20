import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  cascadeize,
  getBrushedRoughnessTexture,
  getCanvasBumpTexture,
  getPlasterBumpTexture,
  getRoofBumpTexture,
  getSoftTexture,
  getStoneBumpTexture,
  getWoodBumpTexture,
  grassWindy,
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
let grassMatShared: THREE.MeshStandardMaterial | null = null;

function cacheMat(key: string, mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  mat.userData.sharedResource = true;
  matCache[key] = mat;
  return mat;
}

function cacheGeo<T extends THREE.BufferGeometry>(key: string, geo: T): T {
  geo.userData.sharedResource = true;
  geoCache[key] = geo;
  return geo;
}

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();
const tmpColor = new THREE.Color();

let lastWetRain = -1;

export function resetSceneDynamicLists(ringMat: THREE.MeshStandardMaterial): void {
  glowMaterials.length = 0;
  glowMaterials.push(ringMat);
  swayItems.length = 0;
  wetMaterials.length = 0;
  lastWetRain = -1;
}

export function updateWetSurfaces(rain: number): void {
  const w = Math.max(0, Math.min(1, rain));
  if (Math.abs(w - lastWetRain) < 0.002) return;
  lastWetRain = w;
  const wetFactor = w * w * (3 - 2 * w);
  for (let i = 0; i < wetMaterials.length; i++) {
    const entry = wetMaterials[i];
    entry.mat.roughness = entry.rDry + (entry.rWet - entry.rDry) * wetFactor;
    entry.mat.color.copy(entry.dryColor).lerp(entry.wetColor, wetFactor * 0.55);
    entry.mat.envMapIntensity = 0.45 + wetFactor * 0.85;
  }
}

export function MRoof(
  c: THREE.ColorRepresentation,
  r = 0.82,
  bumpScale = 0.026
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `roof_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: 0.03,
    bumpMap: getRoofBumpTexture(),
    bumpScale,
  });
  return cacheMat(key, mat);
}

export function MSteel(
  c: THREE.ColorRepresentation,
  r = 0.78,
  m = 0.82
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `steel_${colHex}_${r.toFixed(2)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    roughnessMap: getBrushedRoughnessTexture(),
  });
  return cacheMat(key, mat);
}

export function MCanvas(
  c: THREE.ColorRepresentation,
  r = 0.9,
  bumpScale = 0.018
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `canvas_${colHex}_${r.toFixed(2)}_${bumpScale.toFixed(3)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: 0,
    bumpMap: getCanvasBumpTexture(),
    bumpScale,
  });
  return cacheMat(key, mat);
}

export function MGlass(
  c: THREE.ColorRepresentation,
  opacity = 0.62,
  r = 0.09,
  m = 0.42
): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `glass_${colHex}_${opacity.toFixed(2)}_${r.toFixed(2)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 0.9,
  });
  return cacheMat(key, mat);
}

export function MPatina(c: THREE.ColorRepresentation): THREE.MeshStandardMaterial {
  return M(c, 0.58, 0.42);
}

export function M(c: THREE.ColorRepresentation, r = 0.7, m = 0): THREE.MeshStandardMaterial {
  const colHex = tmpColor.set(c).getHexString();
  const key = `m_${colHex}_${r.toFixed(2)}_${m.toFixed(2)}`;
  if (matCache[key]) return matCache[key];
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const finalMat = r <= 0.16 && m >= 0.1 ? waterize(mat) : mat;
  return cacheMat(key, finalMat);
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
  return cacheMat(key, mat);
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
  return cacheMat(key, mat);
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
  return cacheMat(key, mat);
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
  return cacheMat(key, mat);
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
  return cacheMat(key, mat);
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
  return cacheMat(key, mat);
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
  if (foliageCache[c]) return foliageCache[c];
  const mat = windy(new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0.02 }));
  mat.userData.sharedResource = true;
  foliageCache[c] = mat;
  return mat;
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

/**
 * Collapse a group's plain-coloured child meshes into one mesh per material.
 * Lets builders add fine architectural detail without paying a draw call per part.
 */
export function mergeByMaterial(g: THREE.Group): THREE.Group {
  g.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.Mesh[]>();
  for (const child of [...g.children]) {
    if (!(child instanceof THREE.Mesh) || child instanceof THREE.InstancedMesh) continue;
    const mat = child.material as THREE.Material & { vertexColors?: boolean };
    if (mat.vertexColors) continue;
    const list = buckets.get(mat) ?? [];
    list.push(child);
    buckets.set(mat, list);
  }
  buckets.forEach((meshes, mat) => {
    if (meshes.length < 2) return;
    const stdMat = mat as THREE.MeshStandardMaterial;
    const usesMaps = Boolean(
      stdMat.map || stdMat.bumpMap || stdMat.roughnessMap || stdMat.normalMap || stdMat.emissiveMap
    );
    let hasAllUv = true;
    for (let i = 0; i < meshes.length; i++) {
      if (!meshes[i].geometry.attributes.uv) {
        hasAllUv = false;
        break;
      }
    }
    const dropUv = !hasAllUv && !usesMaps;
    const geos: THREE.BufferGeometry[] = [];
    for (const m of meshes) {
      const src = m.geometry;
      const geo = src.index ? src.toNonIndexed() : src.clone();
      if (dropUv) geo.deleteAttribute('uv');
      geo.deleteAttribute('uv1');
      geo.deleteAttribute('uv2');
      m.updateMatrix();
      geo.applyMatrix4(m.matrix);
      geos.push(geo);
    }
    const merged = mergeGeometries(geos, false);
    geos.forEach((geo) => geo.dispose());
    if (!merged) return; // keep the originals if the attribute sets disagree
    meshes.forEach((m) => m.removeFromParent());
    merged.computeBoundingSphere();
    g.add(new THREE.Mesh(merged, mat));
  });
  return g;
}

export const B = (w: number, h: number, d: number): THREE.BoxGeometry =>
  new THREE.BoxGeometry(w, h, d);

export function CB(w: number, h: number, d: number, r = 0.04, segs = 2): THREE.BufferGeometry {
  const cr = Math.min(r, Math.min(w, h, d) * 0.42);
  const key = `cb_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}_${cr.toFixed(3)}_${segs}`;
  if (geoCache[key]) return geoCache[key];
  const geo = new RoundedBoxGeometry(w, h, d, segs, cr);
  return cacheGeo(key, geo);
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
  return cacheGeo(key, geo);
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
  return cacheGeo(key, geo);
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
  return cacheGeo(key, geo);
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
    const ledge = Math.pow(Math.max(0, Math.sin(Y * 8.5 + a * 0.5)), 8) * 0.05;
    const fissure = Math.pow(Math.max(0, Math.cos(a * 7 + Y * 1.2)), 16) * 0.03;
    const f =
      1 +
      k *
        (Math.sin(a * 3 + x) * 0.5 +
          Math.sin(a * 5 + Y * 2.2) * 0.3 +
          Math.sin(a * 8 - Y * 3.1 + z) * 0.2) +
      bedding +
      ledge -
      fissure;
    p.setXYZ(i, X * f, Y, Z * f);
  }
  const a = new THREE.Color(c1);
  const b = new THREE.Color(c2);
  const aoDark = a.clone().multiplyScalar(0.68);
  tint(gm, (c, X, Y, Z) => {
    const hNorm = Math.min(1, Math.max(0, Y / h + 0.5 + 0.03 * Math.sin(Y * 26)));
    const band = Math.floor(hNorm * 8);
    const bandShade = 0.86 + 0.17 * (0.5 + 0.5 * Math.sin(band * 2.4 + 1.1));
    c.copy(a).lerp(b, hNorm).multiplyScalar(bandShade);
    const ang = Math.atan2(Z, X);
    const crevice = Math.pow(Math.max(0, Math.cos(ang * 7 + Y * 1.2)), 16);
    c.multiplyScalar(1 - crevice * 0.32);
    const ao = Math.min(1, Math.max(0, (Y + h * 0.5) / Math.max(0.2, h * 0.28)));
    c.lerp(aoDark, (1 - ao) * 0.5);
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
    ge.userData.sharedResource = true;
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

function getGrassMaterial(): THREE.MeshStandardMaterial {
  if (!grassMatShared) {
    grassMatShared = grassWindy(
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        vertexColors: true,
        roughness: 0.84,
        metalness: 0.02,
      })
    );
    grassMatShared.userData.sharedResource = true;
  }
  return grassMatShared;
}

export function grassTufts(
  g: THREE.Object3D,
  items: readonly InstanceTransform[],
  palette: readonly string[] = ['#4c7a38', '#688f44', '#8b9342']
): void {
  if (!tuftGeoCache) {
    // 3-blade sculpted grass tuft with baked vertical root-to-tip ambient occlusion.
    const blades: THREE.BufferGeometry[] = [];
    const specs: ReadonlyArray<readonly [number, number, number, number, number]> = [
      [0, 0.27, 0.045, 0.0, 0.14],
      [-0.035, 0.22, 0.04, 2.15, 0.26],
      [0.032, 0.19, 0.038, 4.25, -0.24],
    ];
    for (let b = 0; b < specs.length; b++) {
      const [ox, h, r, ry, tilt] = specs[b];
      const blade = new THREE.ConeGeometry(r, h, 4).translate(0, h * 0.5, 0);
      blade.rotateZ(tilt);
      blade.rotateY(ry);
      blade.translate(ox, 0, ox * 0.6);
      const nonIdx = blade.index ? blade.toNonIndexed() : blade;
      if (nonIdx !== blade) blade.dispose();
      const pos = nonIdx.attributes.position;
      const vCols = new Float32Array(pos.count * 3);
      for (let v = 0; v < pos.count; v++) {
        const shade = 0.68 + Math.min(1, Math.max(0, pos.getY(v) / 0.27)) * 0.42;
        vCols[v * 3] = shade;
        vCols[v * 3 + 1] = shade;
        vCols[v * 3 + 2] = shade;
      }
      nonIdx.setAttribute('color', new THREE.BufferAttribute(vCols, 3));
      blades.push(nonIdx);
    }
    const merged = mergeGeometries(blades, false);
    blades.forEach((b) => b.dispose());
    if (merged) {
      merged.computeVertexNormals();
      merged.computeBoundingSphere();
      merged.userData.sharedResource = true;
      tuftGeoCache = merged;
    } else {
      const fallback = new THREE.ConeGeometry(0.08, 0.24, 5).translate(0, 0.12, 0);
      fallback.userData.sharedResource = true;
      tuftGeoCache = fallback;
    }
  }
  const mat = getGrassMaterial();
  const cols = items.map((_, i) => palette[i % palette.length]);
  instancedMeshes(g, tuftGeoCache, mat, items, cols);
}

interface TreePart {
  g: THREE.BufferGeometry;
  c: THREE.ColorRepresentation;
  p?: [number, number, number];
  r?: [number, number, number];
  s?: [number, number, number];
}

interface TreeSpec {
  x: number;
  y: number;
  z: number;
  s: number;
  k: number;
  ry: number;
  variant: number;
  tint: number;
  holder: THREE.Object3D;
}

const treeBatches = new WeakMap<THREE.Object3D, TreeSpec[]>();
const treeGeoCache: Record<string, THREE.BufferGeometry> = {};
let treeMat: THREE.MeshStandardMaterial | null = null;

const treeMergeMatrix = new THREE.Matrix4();
const treeMergeQuat = new THREE.Quaternion();
const treeMergeEuler = new THREE.Euler();
const treeMergePos = new THREE.Vector3();
const treeMergeScale = new THREE.Vector3();
const treeMergeColor = new THREE.Color();

function treeMaterial(): THREE.MeshStandardMaterial {
  if (!treeMat) {
    treeMat = windy(
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.02 }),
      'wind_tree_vc',
      { heightScale: 1.75, swayScale: 1.0, flutterScale: 1.05 }
    );
    treeMat.userData.sharedResource = true;
  }
  return treeMat;
}

function mergeTreeParts(parts: readonly TreePart[]): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  for (let k = 0; k < parts.length; k++) {
    const part = parts[k];
    const geo = part.g.index ? part.g.toNonIndexed() : part.g.clone();
    part.g.dispose();
    geo.deleteAttribute('uv');
    geo.deleteAttribute('uv1');
    geo.deleteAttribute('uv2');
    treeMergeEuler.set(part.r?.[0] ?? 0, part.r?.[1] ?? 0, part.r?.[2] ?? 0);
    treeMergeQuat.setFromEuler(treeMergeEuler);
    treeMergePos.set(part.p?.[0] ?? 0, part.p?.[1] ?? 0, part.p?.[2] ?? 0);
    treeMergeScale.set(part.s?.[0] ?? 1, part.s?.[1] ?? 1, part.s?.[2] ?? 1);
    treeMergeMatrix.compose(treeMergePos, treeMergeQuat, treeMergeScale);
    geo.applyMatrix4(treeMergeMatrix);
    treeMergeColor.set(part.c);
    const posAttr = geo.attributes.position;
    const vertCount = posAttr.count;
    const arr = new Float32Array(vertCount * 3);
    for (let i = 0; i < vertCount; i++) {
      // Soft vertical AO & crown-top sun highlight baked per vertex.
      const vy = posAttr.getY(i);
      const ao = 0.78 + Math.min(1, Math.max(0, (vy - 0.08) / 1.35)) * 0.28;
      arr[i * 3] = Math.min(1, treeMergeColor.r * ao);
      arr[i * 3 + 1] = Math.min(1, treeMergeColor.g * ao);
      arr[i * 3 + 2] = Math.min(1, treeMergeColor.b * ao);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    geos.push(geo);
  }
  const merged = mergeGeometries(geos, false);
  geos.forEach((geo) => geo.dispose());
  if (!merged) {
    throw new Error('Unable to merge tree geometry');
  }
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  merged.userData.sharedResource = true;
  return merged;
}

function crownGeo(radius: number, seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  const p = geo.attributes.position;
  const a = R(seed * 3 + 1);
  const b = R(seed * 7 + 4);
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i);
    const Y = p.getY(i);
    const Z = p.getZ(i);
    const d =
      1 +
      0.18 * Math.sin(X * (17 + a * 9) + seed) * Math.cos(Z * (13 + b * 7) + Y * 9) +
      0.07 * Math.sin(Y * 23 + seed * 4);
    p.setXYZ(i, X * d, Y * d, Z * d);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildTreeGeometry(k: number, variant: number): THREE.BufferGeometry {
  const parts: TreePart[] = [];
  const rs = (i: number) => R(variant * 97 + i * 13 + k * 211);

  if (k === 3) {
    const trunkMat = '#6e553e';
    for (let i = 0; i < 6; i++) {
      parts.push({
        g: new THREE.CylinderGeometry(0.045 - i * 0.004, 0.055 - i * 0.004, 0.24, 7),
        c: trunkMat,
        p: [Math.sin(i * 0.25 + variant * 0.2) * 0.08, 0.12 + i * 0.2, 0],
        r: [0, 0, -0.06 * i],
      });
    }
    const crownX = 0.22 + (variant - 1) * 0.05;
    for (let i = 0; i < 8; i++) {
      parts.push({
        g: new THREE.ConeGeometry(0.13 + rs(i) * 0.03, 0.82 + rs(i + 2) * 0.2, 4),
        c: i % 3 === 0 ? '#4f9146' : '#3c7b3b',
        p: [crownX, 1.28, 0],
        r: [0, (i * Math.PI * 2) / 8, -0.35 - (i % 2) * 0.2 + variant * 0.04],
        s: [1, 1, 0.25],
      });
    }
    return mergeTreeParts(parts);
  }

  if (k === 4) {
    parts.push({
      g: new THREE.CylinderGeometry(0.035, 0.075, 0.95, 8),
      c: '#4e3826',
      p: [0, 0.47, 0],
    });
    const pineCols = ['#2a5630', '#36693a', '#447943'];
    for (let i = 0; i < 5; i++) {
      const rB = 0.45 - i * 0.068 + (variant - 1) * 0.03;
      parts.push({
        g: new THREE.CylinderGeometry(rB * 0.22, rB, 0.34 + rs(i) * 0.08, 9),
        c: pineCols[i % 3],
        p: [0, 0.82 + i * 0.22, 0],
        r: [0, i * 0.5 + variant * 0.3, 0],
      });
    }
    return mergeTreeParts(parts);
  }

  const trunkCol = k === 2 ? '#4d3624' : '#4a3a2a';
  parts.push({
    g: new THREE.CylinderGeometry(0.038, 0.092, 0.94, 8),
    c: trunkCol,
    p: [0, 0.46, 0],
  });
  for (let i = 0; i < 3 + (variant > 0 ? 1 : 0); i++) {
    const a = i * 2.1 + rs(i) * 0.5;
    parts.push({
      g: new THREE.CylinderGeometry(0.014, 0.034, 0.56, 6),
      c: trunkCol,
      p: [Math.cos(a) * 0.13, 0.88, Math.sin(a) * 0.13],
      r: [-Math.sin(a) * (k === 2 ? 0.92 : 0.68), 0, -Math.cos(a) * (k === 2 ? 0.92 : 0.68)],
    });
  }
  const palettes: Record<number, readonly [string, string, string]> = {
    0: ['#8a5bc4', '#a77ae0', '#6d45a6'],
    1: ['#3e7738', '#569143', '#2d5c2b'],
    2: ['#7e8d3b', '#98a64a', '#5f6e2d'],
  };
  const cs = palettes[k] ?? palettes[1];
  const baseY = k === 2 ? 1.12 : 1.05;
  const count = k === 2 ? 8 : 9 + variant;
  for (let i = 0; i < count; i++) {
    const r = 0.19 + rs(i + 7) * 0.15 + (variant === 2 ? 0.03 : 0);
    const q = (k === 2 ? 0.37 : 0.31) * (1 + (i % 3) * 0.28);
    const px = Math.cos(i * 2.39 + variant * 0.4) * q;
    const pz = Math.sin(i * 2.39 + variant * 0.4) * q;
    const py = rs(i + 3) * (k === 2 ? 0.2 : 0.4) + (i > 5 && k !== 2 ? 0.24 : 0);
    parts.push({
      g: crownGeo(r, i + variant * 11 + k * 5),
      c: cs[i % 3],
      p: [px, baseY + py, pz],
      s: k === 2 ? [1.55, 0.44, 1.55] : [1, 1, 1],
      r: [0, rs(i + 5) * 2, 0],
    });
  }
  // Fine outer leaflets break up the silhouette and add canopy depth.
  for (let i = 0; i < 4; i++) {
    const ang = rs(i + 40) * 6.2832;
    parts.push({
      g: crownGeo(0.12 + rs(i + 44) * 0.06, i + variant * 5 + k * 9),
      c: cs[(i + 1) % 3],
      p: [Math.cos(ang) * 0.34, baseY + 0.16 + rs(i + 48) * 0.3, Math.sin(ang) * 0.34],
      s: [1, 0.8, 1],
    });
  }
  return mergeTreeParts(parts);
}

function buildTreeLodGeometry(k: number, level: 1 | 2): THREE.BufferGeometry {
  const parts: TreePart[] = [];
  const trunkSegs = level === 1 ? 5 : 4;
  if (k === 3) {
    // Simplified Palm LOD
    parts.push({
      g: new THREE.CylinderGeometry(0.036, 0.056, 1.15, trunkSegs),
      c: '#6e553e',
      p: [0.1, 0.56, 0],
      r: [0, 0, -0.18],
    });
    const frondCount = level === 1 ? 5 : 3;
    for (let i = 0; i < frondCount; i++) {
      parts.push({
        g: new THREE.ConeGeometry(0.14, 0.78, 3),
        c: i % 2 === 0 ? '#4f9146' : '#3c7b3b',
        p: [0.22, 1.26, 0],
        r: [0, (i * Math.PI * 2) / frondCount, -0.45],
        s: [1, 1, 0.3],
      });
    }
    return mergeTreeParts(parts);
  }

  if (k === 4) {
    // Simplified Pine LOD
    parts.push({
      g: new THREE.CylinderGeometry(0.035, 0.075, 0.92, trunkSegs),
      c: '#4e3826',
      p: [0, 0.46, 0],
    });
    const tiers = level === 1 ? 3 : 1;
    if (tiers === 1) {
      parts.push({
        g: new THREE.ConeGeometry(0.46, 1.18, 6),
        c: '#36693a',
        p: [0, 1.24, 0],
      });
    } else {
      const pineCols = ['#2a5630', '#36693a', '#447943'];
      for (let i = 0; i < tiers; i++) {
        const rB = 0.45 - i * 0.1;
        parts.push({
          g: new THREE.CylinderGeometry(rB * 0.2, rB, 0.46, 6),
          c: pineCols[i % 3],
          p: [0, 0.88 + i * 0.34, 0],
        });
      }
    }
    return mergeTreeParts(parts);
  }

  const trunkCol = k === 2 ? '#4d3624' : '#4a3a2a';
  parts.push({
    g: new THREE.CylinderGeometry(0.038, 0.09, 0.94, trunkSegs),
    c: trunkCol,
    p: [0, 0.46, 0],
  });
  const palettes: Record<number, readonly [string, string, string]> = {
    0: ['#8a5bc4', '#a77ae0', '#6d45a6'],
    1: ['#3e7738', '#569143', '#2d5c2b'],
    2: ['#7e8d3b', '#98a64a', '#5f6e2d'],
  };
  const cs = palettes[k] ?? palettes[1];
  const baseY = k === 2 ? 1.12 : 1.15;
  if (level === 2) {
    parts.push({
      g: new THREE.IcosahedronGeometry(k === 2 ? 0.52 : 0.48, 0),
      c: cs[0],
      p: [0, baseY + 0.08, 0],
      s: k === 2 ? [1.45, 0.46, 1.45] : [1.05, 0.95, 1.05],
    });
  } else {
    for (let i = 0; i < 4; i++) {
      const ang = i * 1.57;
      const q = k === 2 ? 0.32 : 0.24;
      parts.push({
        g: new THREE.IcosahedronGeometry(0.28, 0),
        c: cs[i % 3],
        p: [Math.cos(ang) * q, baseY + (i === 0 ? 0.18 : 0.04), Math.sin(ang) * q],
        s: k === 2 ? [1.5, 0.45, 1.5] : [1, 1, 1],
      });
    }
  }
  return mergeTreeParts(parts);
}

function treeGeometry(k: number, variant: number): THREE.BufferGeometry {
  const key = `tree_${k}_${variant}`;
  const cached = treeGeoCache[key];
  if (cached) return cached;
  const geo = buildTreeGeometry(k, variant);
  treeGeoCache[key] = geo;
  return geo;
}

function treeLodGeometry(k: number, level: 1 | 2): THREE.BufferGeometry {
  const key = `tree_${k}_lod${level}`;
  const cached = treeGeoCache[key];
  if (cached) return cached;
  const geo = buildTreeLodGeometry(k, level);
  treeGeoCache[key] = geo;
  return geo;
}

export function finalizeTreeBatch(g: THREE.Object3D): void {
  const specs = treeBatches.get(g);
  if (!specs || !specs.length) return;
  treeBatches.delete(g);
  const groups = new Map<string, TreeSpec[]>();
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    spec.holder.removeFromParent();
    const key = `${spec.k}_${spec.variant}`;
    const list = groups.get(key);
    if (list) list.push(spec);
    else groups.set(key, [spec]);
  }
  const mat = treeMaterial();
  const color = new THREE.Color();
  groups.forEach((list, key) => {
    const [kText, vText] = key.split('_');
    const kNum = Number(kText);
    const vNum = Number(vText);
    const geo0 = treeGeometry(kNum, vNum);
    const geo1 = treeLodGeometry(kNum, 1);
    const geo2 = treeLodGeometry(kNum, 2);

    const im0 = new THREE.InstancedMesh(geo0, mat, list.length);
    const im1 = new THREE.InstancedMesh(geo1, mat, list.length);
    const im2 = new THREE.InstancedMesh(geo2, mat, list.length);

    for (let i = 0; i < list.length; i++) {
      const spec = list[i];
      const spread = 0.9 + spec.tint * 0.2;
      treeMergePos.set(spec.x, spec.y, spec.z);
      treeMergeEuler.set(0, spec.ry, 0);
      treeMergeQuat.setFromEuler(treeMergeEuler);
      treeMergeScale.set(spec.s * spread, spec.s, spec.s * (1.9 - spread));
      treeMergeMatrix.compose(treeMergePos, treeMergeQuat, treeMergeScale);
      im0.setMatrixAt(i, treeMergeMatrix);
      im1.setMatrixAt(i, treeMergeMatrix);
      im2.setMatrixAt(i, treeMergeMatrix);
      const warm = 0.9 + spec.tint * 0.14;
      color.setRGB(warm, warm, warm * (0.94 + spec.tint * 0.06));
      im0.setColorAt(i, color);
      im1.setColorAt(i, color);
      im2.setColorAt(i, color);
      stampContactShadow(g, spec.x, spec.z, 0.3 * spec.s, 0.24, spec.y + 0.012);
    }

    for (const im of [im0, im1, im2]) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
    }
    im2.userData.noShadow = true;
    im2.castShadow = false;

    const lod = new THREE.LOD();
    lod.addLevel(im0, 0);
    lod.addLevel(im1, 21.5);
    lod.addLevel(im2, 28.5);
    g.add(lod);
  });
}

export function tree(g: THREE.Object3D, x: number, z: number, s = 1, k = 1, y = 0): THREE.Group {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.visible = false;
  g.add(holder);
  const specs = treeBatches.get(g);
  const spec: TreeSpec = {
    x,
    y,
    z,
    s,
    k,
    ry: R(x * 3 + z) * 6.28,
    variant: Math.floor(R(x * 17.3 + z * 5.1 + s * 29.7) * 3) % 3,
    tint: R(x * 7.7 + z * 11.3),
    holder,
  };
  if (specs) specs.push(spec);
  else treeBatches.set(g, [spec]);
  return holder;
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
  add(rd, C(0.36, 0.37, 0.44, 24), MPlaster(wallCol, 0.82), 0, 0.26, 0);
  add(rd, C(0.375, 0.375, 0.07, 24), MPlaster('#a34a36', 0.86), 0, 0.08, 0);
  // Layered thatch courses give the cone a fibrous, banded silhouette.
  const thatch = MWood(roofCol, 0.94);
  for (let i = 0; i < 5; i++) {
    const r = 0.47 - i * 0.088;
    add(rd, C(r, r, 0.04, 24, 1, true), thatch, 0, 0.5 + i * 0.072, 0);
  }
  add(rd, new THREE.ConeGeometry(0.46, 0.36, 24), thatch, 0, 0.64, 0);
  add(rd, C(0.03, 0.04, 0.08, 8), MWood('#4e3824', 0.9), 0, 0.84, 0);
  // Recessed doorway and a small shuttered window.
  add(rd, CB(0.14, 0.29, 0.03, 0.008), MPlaster('#efe6d4', 0.8), 0, 0.17, 0.365);
  add(rd, CB(0.11, 0.26, 0.04, 0.01), MWood('#4d321c', 0.8), 0, 0.17, 0.385);
  const win = add(rd, CB(0.09, 0.09, 0.02, 0.005), M('#d7c9a8', 0.5), 0.24, 0.33, 0.26);
  win.rotation.y = -0.62;
  mergeByMaterial(rd);
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
  const y0 = 0.12;
  const fz = d / 2 + 0.02;

  const trimMat = MPlaster(trim, 0.76);
  const stoneMat = MStone('#a89c88', 0.88);
  const frameWood = MWood('#5a4632', 0.8);
  const winMat = G('#ffe1a0', 0.85);
  const shutterMat = MWood('#274c3c', 0.72);
  const slatMat = MWood('#1e3d30', 0.82);
  const doorMat = MWood('#3e281a', 0.75);
  const panelMat = MWood('#543521', 0.74);

  // Raised stoep with a front step, then the stucco body and corner pilasters.
  add(grp, CB(w + 0.22, 0.1, 0.36, 0.02), stoneMat, 0, 0.05, fz + 0.14);
  add(grp, CB(w + 0.14, 0.1, d + 0.22, 0.02), stoneMat, 0, 0.1, 0.08);
  add(grp, CB(w, h, d, 0.03), MPlaster(wall, 0.76), 0, y0 + h / 2, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add(
        grp,
        CB(0.09, h, 0.09, 0.012),
        trimMat,
        sx * (w / 2 - 0.045),
        y0 + h / 2,
        sz * (d / 2 - 0.045)
      );
    }
  }
  add(grp, CB(w + 0.1, 0.07, d + 0.1, 0.02), trimMat, 0, y0 + h + 0.03, 0);

  // Pitched roof with a ridge cap and a small chimney stack.
  add(
    grp,
    gableRoofGeo(w * 0.96, d * 0.96, h * 0.42, 0.06),
    MRoof(roof, 0.82),
    0,
    y0 + h + 0.06,
    0
  );
  add(grp, CB(0.07, 0.06, d + 0.16, 0.02), MRoof(roof, 0.74), 0, y0 + h + h * 0.42 + 0.04, 0);
  const chimY = y0 + h + h * 0.22;
  add(grp, CB(0.16, 0.34, 0.16, 0.02), MStone('#8d7660', 0.9), w * 0.28, chimY, -d * 0.2);
  add(grp, CB(0.21, 0.05, 0.21, 0.01), stoneMat, w * 0.28, chimY + 0.19, -d * 0.2);

  if (capeDutch) {
    add(grp, capeDutchGableGeo(w * 0.5, h * 0.62, 0.05), trimMat, 0, y0 + h, fz + 0.005);
    add(
      grp,
      capeDutchGableGeo(w * 0.42, h * 0.53, 0.07),
      MPlaster(wall, 0.76),
      0,
      y0 + h + 0.01,
      fz + 0.04
    );
    add(
      grp,
      new THREE.SphereGeometry(0.035, 8, 6),
      M('#b8985a', 0.4, 0.6),
      0,
      y0 + h + h * 0.62 + 0.03,
      fz + 0.06
    );
  }

  // Panelled front door with a frame and brass knob.
  add(grp, CB(w * 0.22, h * 0.52, 0.03, 0.008), trimMat, 0, y0 + h * 0.26, fz - 0.005);
  add(grp, CB(w * 0.18, h * 0.48, 0.04, 0.008), doorMat, 0, y0 + h * 0.24, fz + 0.015);
  for (const py of [h * 0.14, h * 0.34]) {
    add(grp, CB(w * 0.12, h * 0.15, 0.01, 0.004), panelMat, 0, y0 + py, fz + 0.04);
  }
  add(
    grp,
    new THREE.SphereGeometry(0.012, 6, 5),
    M('#c9a227', 0.3, 0.8),
    w * 0.06,
    y0 + h * 0.24,
    fz + 0.05
  );

  // Glowing sash windows with mullions, sills and louvred shutters.
  for (const sx of [-w * 0.28, w * 0.28]) {
    add(grp, CB(w * 0.2, h * 0.34, 0.03, 0.006), trimMat, sx, y0 + h * 0.52, fz - 0.005);
    add(grp, CB(w * 0.16, h * 0.28, 0.02, 0.004), winMat, sx, y0 + h * 0.52, fz + 0.015);
    add(grp, CB(0.012, h * 0.28, 0.015, 0.003), frameWood, sx, y0 + h * 0.52, fz + 0.03);
    add(grp, CB(w * 0.16, 0.012, 0.015, 0.003), frameWood, sx, y0 + h * 0.52, fz + 0.03);
    add(grp, CB(w * 0.22, 0.035, 0.07, 0.008), stoneMat, sx, y0 + h * 0.34, fz + 0.025);
    for (const side of [-1, 1]) {
      const shx = sx + side * w * 0.125;
      add(grp, CB(0.055, h * 0.28, 0.02, 0.004), shutterMat, shx, y0 + h * 0.52, fz + 0.012);
      for (let s = 0; s < 4; s++) {
        add(
          grp,
          CB(0.042, 0.012, 0.012, 0.002),
          slatMat,
          shx,
          y0 + h * 0.42 + s * h * 0.066,
          fz + 0.026
        );
      }
    }
  }
  mergeByMaterial(grp);
  g.add(grp);
  return grp;
}

export function lampPost(g: THREE.Object3D, x: number, y: number, z: number, h = 0.65): void {
  add(g, C(0.016, 0.024, h, 6), M('#22262e', 0.4, 0.75), x, y + h / 2, z);
  add(g, new THREE.SphereGeometry(0.04, 8, 6), G('#ffdc96', 1.25), x, y + h + 0.03, z);
}

export type StreamFill = (i: number, t: number, out: THREE.Vector3) => void;

export interface StreamHandle {
  update: (t: number) => void;
  material: THREE.PointsMaterial;
}

/**
 * Zero-allocation particle stream. The fill callback writes into a shared vector,
 * so animation ticks never create arrays or vectors.
 */
export function stream(
  g: THREE.Object3D,
  count: number,
  col: THREE.ColorRepresentation,
  sz: number,
  fill: StreamFill,
  opacity = 0.78,
  additive = true
): StreamHandle {
  const p = new Float32Array(count * 3);
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({
    color: col,
    size: sz * 1.6,
    map: getSoftTexture(),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  g.add(points);
  const out = new THREE.Vector3();
  const update = (t: number) => {
    for (let i = 0; i < count; i++) {
      fill(i, t, out);
      p[i * 3] = out.x;
      p[i * 3 + 1] = out.y;
      p[i * 3 + 2] = out.z;
    }
    geo.attributes.position.needsUpdate = true;
  };
  update(0);
  return { update, material: mat };
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
    carGeos.body.userData.sharedResource = true;
    carGeos.glass.userData.sharedResource = true;
    carGeos.wheel.userData.sharedResource = true;
    carGeos.lamp.userData.sharedResource = true;
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
  mergeByMaterial(t);
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
  mergeByMaterial(a);
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
  mergeByMaterial(b);
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

interface ContactShadowSpec {
  x: number;
  y: number;
  z: number;
  r: number;
  op: number;
}

const contactShadowBatches = new WeakMap<THREE.Object3D, ContactShadowSpec[]>();
const contactShadowMaterials = new WeakMap<THREE.Object3D, THREE.MeshBasicMaterial>();
const contactShadowMeshes = new WeakMap<THREE.Object3D, THREE.Mesh>();
const csTmpBox = new THREE.Box3();
const csTmpSize = new THREE.Vector3();
const csTmpCenter = new THREE.Vector3();

function createContactShadowMaterial(): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({
    map: getSoftTexture(),
    color: '#060912',
    transparent: true,
    opacity: 1,
    depthWrite: false,
    vertexColors: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  mat.userData.noDissolve = true;
  mat.customProgramCacheKey = () => 'contact_shadow_v1';
  return mat;
}

export function stampContactShadow(
  g: THREE.Object3D,
  x: number,
  z: number,
  radius: number,
  opacity = 0.24,
  y = 0.014
): void {
  if (radius <= 0.02 || opacity <= 0.005) return;
  let list = contactShadowBatches.get(g);
  if (!list) {
    list = [];
    contactShadowBatches.set(g, list);
  }
  list.push({ x, y, z, r: radius, op: Math.min(0.6, opacity) });
}

export function stampContactShadowsFromMeshes(g: THREE.Object3D): void {
  g.updateWorldMatrix(true, true);
  g.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || obj instanceof THREE.InstancedMesh) return;
    if (obj.userData.noShadow || obj.userData.cannotReceiveAO) return;
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (!mat || mat.transparent || mat.depthWrite === false) return;

    csTmpBox.setFromObject(obj);
    if (csTmpBox.isEmpty()) return;
    csTmpBox.getSize(csTmpSize);
    csTmpBox.getCenter(csTmpCenter);

    const span = Math.max(csTmpSize.x, csTmpSize.z);
    if (span < 0.16 || span > 3.8 || csTmpSize.y < 0.08) return;
    if (csTmpBox.min.y < -0.08 || csTmpBox.min.y > 0.48) return;

    const r = Math.min(2.2, Math.max(0.18, span * 0.62));
    stampContactShadow(
      g,
      csTmpCenter.x,
      csTmpCenter.z,
      r,
      0.22,
      Math.max(0.014, csTmpBox.min.y + 0.012)
    );
  });
}

export function finalizeContactShadows(g: THREE.Object3D): void {
  const specs = contactShadowBatches.get(g);
  if (!specs || !specs.length) return;
  contactShadowBatches.delete(g);

  const count = specs.length;
  const positions = new Float32Array(count * 4 * 3);
  const uvs = new Float32Array(count * 4 * 2);
  const colors = new Float32Array(count * 4 * 4);
  const indices = new Uint16Array(count * 6);

  for (let i = 0; i < count; i++) {
    const s = specs[i];
    const vBase = i * 4;
    const pBase = vBase * 3;
    const uBase = vBase * 2;
    const cBase = vBase * 4;
    const iBase = i * 6;

    positions[pBase] = s.x - s.r;
    positions[pBase + 1] = s.y;
    positions[pBase + 2] = s.z - s.r;

    positions[pBase + 3] = s.x + s.r;
    positions[pBase + 4] = s.y;
    positions[pBase + 5] = s.z - s.r;

    positions[pBase + 6] = s.x + s.r;
    positions[pBase + 7] = s.y;
    positions[pBase + 8] = s.z + s.r;

    positions[pBase + 9] = s.x - s.r;
    positions[pBase + 10] = s.y;
    positions[pBase + 11] = s.z + s.r;

    uvs[uBase] = 0;
    uvs[uBase + 1] = 0;
    uvs[uBase + 2] = 1;
    uvs[uBase + 3] = 0;
    uvs[uBase + 4] = 1;
    uvs[uBase + 5] = 1;
    uvs[uBase + 6] = 0;
    uvs[uBase + 7] = 1;

    for (let k = 0; k < 4; k++) {
      colors[cBase + k * 4] = 1;
      colors[cBase + k * 4 + 1] = 1;
      colors[cBase + k * 4 + 2] = 1;
      colors[cBase + k * 4 + 3] = s.op;
    }

    indices[iBase] = vBase;
    indices[iBase + 1] = vBase + 2;
    indices[iBase + 2] = vBase + 1;
    indices[iBase + 3] = vBase;
    indices[iBase + 4] = vBase + 3;
    indices[iBase + 5] = vBase + 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeBoundingSphere();

  const mat = createContactShadowMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 1;
  mesh.userData.noShadow = true;
  mesh.userData.cannotReceiveAO = true;
  g.add(mesh);

  contactShadowMaterials.set(g, mat);
  contactShadowMeshes.set(g, mesh);
}

export function setContactShadowFade(g: THREE.Object3D | null, alpha: number): void {
  if (!g) return;
  const mat = contactShadowMaterials.get(g);
  const mesh = contactShadowMeshes.get(g);
  if (!mat || !mesh) return;
  const clamped = Math.max(0, Math.min(1, alpha));
  mat.opacity = clamped;
  mesh.visible = clamped > 0.01;
}
