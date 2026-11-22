import * as THREE from 'three';
import {
  add,
  B,
  cableBatch,
  C,
  CB,
  G,
  instancedMeshes,
  M,
  MStone,
  mergeByMaterial,
  type InstanceTransform,
} from './primitives';

/**
 * Small reusable human-scale props for diorama sites. Every helper returns a
 * self-contained group using the shared material/geometry caches; call sites
 * can place or instance them without bespoke mesh code.
 */

const wood = () => M('#8b6b4a', 0.86);
const darkWood = () => M('#5f4a36', 0.9);
const metal = () => M('#5d6268', 0.52, 0.55);
const paleStone = () => MStone('#c3b69b', 0.9, 0.02);
const canvas = () => M('#cbb99a', 0.95);

export function bench(): THREE.Group {
  const g = new THREE.Group();
  const pl = wood();
  const fr = darkWood();
  add(g, CB(1.35, 0.08, 0.34, 0.025), pl, 0, 0.42, 0);
  add(g, CB(1.35, 0.26, 0.06, 0.018), pl, 0, 0.62, -0.14);
  for (const x of [-0.55, 0.55]) {
    add(g, B(0.07, 0.42, 0.28), fr, x, 0.21, 0);
  }
  return mergeByMaterial(g);
}

export function interpretiveSign(accent = '#d8a64a'): THREE.Group {
  const g = new THREE.Group();
  const post = darkWood();
  const panel = M(accent, 0.72, 0.08);
  const trim = M('#efe3c8', 0.82);
  add(g, C(0.045, 0.05, 1.05, 10), post, 0, 0.52, 0);
  add(g, CB(0.78, 0.46, 0.05, 0.02), panel, 0, 1.12, 0);
  add(g, CB(0.66, 0.035, 0.056, 0.008), trim, 0, 1.22, 0.01);
  add(g, CB(0.48, 0.026, 0.056, 0.008), trim, -0.07, 1.11, 0.01);
  return mergeByMaterial(g);
}

export function picnicTable(): THREE.Group {
  const g = new THREE.Group();
  const top = wood();
  const legs = darkWood();
  add(g, CB(1.75, 0.09, 0.72, 0.03), top, 0, 0.58, 0);
  for (const x of [-0.68, 0.68]) {
    add(g, B(0.07, 0.5, 0.6), legs, x, 0.29, 0);
    add(g, CB(1.65, 0.07, 0.27, 0.02), top, 0, 0.33, x < 0 ? -0.52 : 0.52);
    add(g, B(0.07, 0.3, 0.07), legs, x, 0.16, x < 0 ? -0.52 : 0.52);
  }
  return mergeByMaterial(g);
}

export function crateStack(count = 3): THREE.Group {
  const g = new THREE.Group();
  const box = wood();
  const strap = darkWood();
  const transforms: InstanceTransform[] = [];
  for (let i = 0; i < count; i++) {
    const level = i % 2;
    transforms.push({
      x: level === 0 ? -0.18 : 0.18,
      y: 0.17 + i * 0.34,
      z: 0,
      ry: level === 0 ? 0.08 : -0.12,
      sx: 1 - i * 0.04,
      sy: 1,
      sz: 1 - i * 0.03,
    });
  }
  instancedMeshes(g, B(0.5, 0.32, 0.42), box, transforms);
  instancedMeshes(
    g,
    B(0.52, 0.035, 0.44),
    strap,
    transforms.map((t) => ({ ...t, y: t.y - 0.12 }))
  );
  return g;
}

/** Simple two-rail kraal fence; posts and rails stay in two draw calls. */
export function kraalFence(length = 4, posts = 6): THREE.Group {
  const g = new THREE.Group();
  const postMat = darkWood();
  const railMat = M('#9a7a55', 0.92);
  const step = length / Math.max(1, posts - 1);
  const postT: InstanceTransform[] = [];
  for (let i = 0; i < posts; i++) {
    postT.push({ x: -length * 0.5 + i * step, y: 0.5, z: 0, ry: (i % 2) * 0.06 });
  }
  instancedMeshes(g, C(0.06, 0.075, 1, 8), postMat, postT);
  cableBatch(
    g,
    [
      [
        [-length * 0.5, 0.72, 0],
        [length * 0.5, 0.72, 0],
      ],
      [
        [-length * 0.5, 0.42, 0],
        [length * 0.5, 0.42, 0],
      ],
    ],
    0.035,
    railMat
  );
  return g;
}

/** Low stone cairn used as a trail/route marker in mountain and coast sites. */
export function cairn(height = 0.75): THREE.Group {
  const g = new THREE.Group();
  const stone = paleStone();
  const radii = [0.34, 0.27, 0.21, 0.15];
  const count = Math.max(2, Math.min(4, Math.round(height / 0.2)));
  for (let i = 0; i < count; i++) {
    add(
      g,
      new THREE.SphereGeometry(radii[i], 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62),
      stone,
      (i % 2 ? 0.04 : -0.03) * i,
      i * (height / count),
      (i % 3 ? -0.02 : 0.03) * i
    ).scale.set(1, 0.62, 0.88);
  }
  return mergeByMaterial(g);
}

/** Small bridge/notice lamp scaled for paths; never a real PointLight. */
export function pathMarker(): THREE.Group {
  const g = new THREE.Group();
  const pole = metal();
  const lens = G('#ffd9a0', 1.1);
  add(g, C(0.035, 0.045, 0.9, 8), pole, 0, 0.45, 0);
  add(g, new THREE.SphereGeometry(0.09, 12, 8), lens, 0, 0.93, 0);
  add(g, C(0.11, 0.11, 0.03, 12), pole, 0, 0.02, 0);
  return mergeByMaterial(g);
}

/** Reusable folded canvas awning for market/coastal scenes. */
export function awning(width = 1.6): THREE.Group {
  const g = new THREE.Group();
  const cloth = canvas();
  const frame = metal();
  add(g, B(width, 0.035, 0.9).rotateX(-0.16), cloth, 0, 1.05, 0);
  for (const x of [-width * 0.48, width * 0.48]) {
    add(g, C(0.025, 0.03, 1.05, 8), frame, x, 0.52, 0.38);
    add(g, C(0.025, 0.03, 1.05, 8), frame, x, 0.52, -0.38);
  }
  return mergeByMaterial(g);
}
