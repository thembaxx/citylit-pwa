import * as THREE from 'three';
import { prepareCanvasTexture } from '../shaders';
import {
  add,
  B,
  cableBatch,
  C,
  CB,
  G,
  instancedMeshes,
  M,
  MSteel,
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

/**
 * Draws the bilingual wording onto a small canvas so SA sites read as real
 * places (English above, Afrikaans below) instead of blank coloured panels.
 */
function signPanelMaterial(accent: string, lines: readonly string[]): THREE.Material {
  if (typeof document === 'undefined' || lines.length === 0) return M(accent, 0.72, 0.08);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 300;
  const ctx = signCanvas.getContext('2d');
  if (!ctx) return M(accent, 0.72, 0.08);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, signCanvas.width, signCanvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, 0, signCanvas.width, 16);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f7f1e3';
  ctx.font = '700 46px sans-serif';
  ctx.fillText(lines[0] ?? '', signCanvas.width / 2, 112);
  if (lines[1]) {
    ctx.font = 'italic 40px sans-serif';
    ctx.fillStyle = '#efe3c8';
    ctx.fillText(lines[1], signCanvas.width / 2, 190);
  }
  const tex = prepareCanvasTexture(new THREE.CanvasTexture(signCanvas));
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.04 });
}

export function interpretiveSign(
  accent = '#d8a64a',
  lines: readonly string[] = []
): THREE.Group {
  const g = new THREE.Group();
  const post = darkWood();
  const panel = signPanelMaterial(accent, lines);
  const trim = M('#efe3c8', 0.82);
  add(g, C(0.045, 0.05, 1.05, 10), post, 0, 0.52, 0);
  add(g, CB(0.78, 0.46, 0.05, 0.02), panel, 0, 1.12, 0);
  add(g, CB(0.66, 0.035, 0.056, 0.008), trim, 0, 1.22, 0.01);
  add(g, CB(0.48, 0.026, 0.056, 0.008), trim, -0.07, 1.11, 0.01);
  return mergeByMaterial(g);
}

/** Municipal street-name blade: bilingual, mounted on a short galvanised pole. */
export function streetNameBlade(
  english: string,
  afrikaans: string,
  accent = '#1f4e79'
): THREE.Group {
  const g = new THREE.Group();
  const post = MSteel('#8d9498', 0.45, 0.6);
  const panel = signPanelMaterial(accent, [english, afrikaans]);
  add(g, C(0.035, 0.04, 1.4, 10), post, 0, 0.7, 0);
  add(g, CB(0.74, 0.3, 0.04, 0.012), panel, 0.24, 1.3, 0);
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

/* ------------------------------------------------------------------ */
/* Batch 2 — placed props (parent + transform convention)              */
/*                                                                      */
/* Unlike the original zero-argument kit above, these helpers take the   */
/* parent and placement directly so call sites never build a throwaway   */
/* group. Each finishes with mergeByMaterial and uses only cached        */
/* materials/geometry from primitives.ts — no lights, no per-frame work. */
/* ------------------------------------------------------------------ */

function placedProp(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc: number,
  ry: number
): THREE.Group {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.y = ry;
  holder.scale.setScalar(sc > 0 ? sc : 1);
  g.add(holder);
  return holder;
}

/** Wheelie bin: moulded body, domed lid, axle and two wheels. */
export function bin(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  ry = 0
): THREE.Group {
  const h = placedProp(g, x, y, z, sc, ry);
  const shell = M('#3d6b53', 0.86);
  const dark = M('#272c30', 0.9);
  const lid = M('#4c7d61', 0.84);
  add(h, CB(0.46, 0.68, 0.42, 0.055), shell, 0, 0.47, 0);
  add(h, CB(0.5, 0.08, 0.46, 0.03), lid, 0, 0.84, -0.01);
  add(h, CB(0.42, 0.06, 0.05, 0.014), dark, 0, 0.9, -0.2);
  add(h, B(0.3, 0.04, 0.05), dark, 0, 0.7, 0.23);
  add(h, C(0.012, 0.012, 0.36, 6), dark, -0.23, 0.16, 0);
  add(h, C(0.012, 0.012, 0.36, 6), dark, 0.23, 0.16, 0);
  add(h, C(0.075, 0.075, 0.05, 8), dark, -0.26, 0.08, 0).rotation.z = Math.PI / 2;
  add(h, C(0.075, 0.075, 0.05, 8), dark, 0.26, 0.08, 0).rotation.z = Math.PI / 2;
  for (const py of [0.3, 0.5, 0.7]) {
    add(h, B(0.47, 0.025, 0.43), lid, 0, py, 0);
  }
  return mergeByMaterial(h);
}

/**
 * Flagpole with a stylised SA-flag tricolour. `colour` overrides the accent
 * band so a site can tint the flag (Union Buildings/Castle use the national
 * palette by default); everything else stays in the shared material cache.
 */
export function flagpole(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  ry = 0,
  colour: string = '#de3831'
): THREE.Group {
  const h = placedProp(g, x, y, z, sc, ry);
  const pole = MSteel('#b9bec2', 0.4, 0.74);
  const base = MStone('#b7aa92', 0.9, 0.02);
  const accent = M(colour, 0.78, 0.04);
  const blue = M('#002395', 0.78, 0.04);
  const green = M('#007a4d', 0.78, 0.04);
  const white = M('#f2f0e6', 0.82);
  add(h, C(0.18, 0.21, 0.1, 12), base, 0, 0.05, 0);
  add(h, C(0.022, 0.03, 2.1, 8), pole, 0, 1.1, 0);
  add(h, new THREE.SphereGeometry(0.045, 8, 6), pole, 0, 2.17, 0);
  cableBatch(h, [[[0, 0.4, 0], [0, 2.05, 0]]], 0.006, pole);
  add(h, B(0.5, 0.3, 0.012), accent, 0.26, 1.86, 0);
  add(h, B(0.5, 0.16, 0.012), blue, 0.26, 1.71, 0);
  add(h, B(0.5, 0.16, 0.012), white, 0.26, 1.63, 0);
  add(h, B(0.5, 0.16, 0.012), green, 0.26, 1.55, 0);
  add(h, B(0.28, 0.06, 0.014), white, 0.15, 1.78, 0.008);
  add(h, B(0.28, 0.06, 0.014), accent, 0.15, 1.62, 0.008);
  add(h, C(0.05, 0.06, 0.04, 8), base, 0, 2.02, 0);
  return mergeByMaterial(h);
}

/** Washing line with a sagging cord and five pieces of coloured cloth. */
export function washingLine(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  ry = 0
): THREE.Group {
  const h = placedProp(g, x, y, z, sc, ry);
  const post = darkWood();
  const cord = metal();
  const cloths = [M('#d6c39a', 0.95), M('#7fa3b8', 0.95), M('#b96a5c', 0.95), M('#d9c977', 0.95), M('#8ba67d', 0.95)];
  add(h, C(0.035, 0.045, 1.5, 7), post, -1.0, 0.75, 0);
  add(h, C(0.035, 0.045, 1.5, 7), post, 1.0, 0.75, 0);
  add(h, C(0.05, 0.06, 0.06, 7), post, -1.0, 0.03, 0);
  add(h, C(0.05, 0.06, 0.06, 7), post, 1.0, 0.03, 0);
  cableBatch(h, [[[-1, 1.44, 0], [-0.5, 1.3, 0]], [[-0.5, 1.3, 0], [0, 1.25, 0]], [[0, 1.25, 0], [0.5, 1.3, 0]], [[0.5, 1.3, 0], [1, 1.44, 0]]], 0.008, cord);
  for (let i = 0; i < 5; i++) {
    const px = -0.72 + i * 0.36;
    const sag = 1.28 + Math.abs(px) * 0.1;
    const cloth = add(h, B(0.3, 0.34, 0.012), cloths[i], px, sag - 0.18, 0);
    cloth.rotation.z = (i % 2 ? 1 : -1) * 0.06;
  }
  return mergeByMaterial(h);
}

/** Taxi-rank shelter: roof, back panel, bench and route board. */
export function taxiShelter(
  g: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  sc = 1,
  ry = 0
): THREE.Group {
  const h = placedProp(g, x, y, z, sc, ry);
  const frame = MSteel('#4a5259', 0.44, 0.76);
  const roof = M('#2c6b8c', 0.8, 0.08);
  const panel = M('#c8c2ad', 0.86);
  const seat = darkWood();
  for (const px of [-1.0, 1.0]) {
    for (const pz of [-0.42, 0.42]) {
      add(h, C(0.035, 0.042, 1.85, 7), frame, px, 0.93, pz);
    }
  }
  add(h, CB(2.3, 0.09, 1.1, 0.03), roof, 0, 1.92, 0);
  add(h, CB(2.3, 0.16, 0.06, 0.02), frame, 0, 1.8, 0.52);
  add(h, B(2.1, 0.9, 0.035), panel, 0, 1.2, -0.44);
  add(h, CB(1.8, 0.07, 0.38, 0.02), seat, 0, 0.56, -0.24);
  for (const px of [-0.78, 0.78]) {
    add(h, B(0.06, 0.5, 0.34), frame, px, 0.3, -0.24);
  }
  add(h, CB(0.5, 0.34, 0.03, 0.014), roof, 0, 1.34, -0.41);
  return mergeByMaterial(h);
}
