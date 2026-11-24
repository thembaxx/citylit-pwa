import * as THREE from 'three';

const noop = () => {};
const fakeCtx = {
  fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'center', textBaseline: 'middle', globalAlpha: 1,
  fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, beginPath: noop, closePath: noop,
  moveTo: noop, lineTo: noop, arc: noop, ellipse: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
  rect: noop, clip: noop, drawImage: noop, setTransform: noop, fill: noop, stroke: noop,
  save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
  createLinearGradient: () => ({ addColorStop: noop }),
  createRadialGradient: () => ({ addColorStop: noop }),
  createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  putImageData: noop,
};
(globalThis as Record<string, unknown>).document = {
  createElement: () => ({ width: 256, height: 256, getContext: () => fakeCtx, style: {} }),
};
(globalThis as Record<string, unknown>).window = { devicePixelRatio: 1 };

const { LANDMARK_BUILDERS } = await import('../src/three/builders/landmarksB.ts');

function geoTriCount(geo: THREE.BufferGeometry): number {
  if (geo.index) return Math.floor(geo.index.count / 3);
  const pos = geo.getAttribute('position');
  return pos ? Math.floor(pos.count / 3) : 0;
}

const rows: Array<{
  key: string; draws: number; meshes: number; inst: number; tris: number;
  aboveMaxXZ: number; fullMaxXZ: number; oobAbove: string[]; top: string[];
}> = [];

for (const [key, build] of Object.entries(LANDMARK_BUILDERS)) {
  const g = build();
  g.updateMatrixWorld(true);
  let draws = 0, meshes = 0, inst = 0, tris = 0;
  let aboveMaxXZ = 0, fullMaxXZ = 0;
  const oobAbove = new Set<string>();
  const heavy: Array<{ name: string; tris: number; count: number }> = [];
  const tmpMat = new THREE.Matrix4();
  const tmpBox = new THREE.Box3();

  g.traverse((obj) => {
    if ((obj as THREE.InstancedMesh).isInstancedMesh) {
      const im = obj as THREE.InstancedMesh;
      inst++; draws++;
      const t = geoTriCount(im.geometry) * im.count;
      tris += t;
      heavy.push({ name: im.name || `IM(${im.geometry.type})`, tris: t, count: im.count });
      im.computeBoundingBox();
      if (im.geometry.boundingBox) {
        for (let i = 0; i < im.count; i++) {
          im.getMatrixAt(i, tmpMat);
          tmpMat.premultiply(im.matrixWorld);
          tmpBox.copy(im.geometry.boundingBox).applyMatrix4(tmpMat);
          const m = Math.max(Math.abs(tmpBox.min.x), Math.abs(tmpBox.max.x), Math.abs(tmpBox.min.z), Math.abs(tmpBox.max.z));
          fullMaxXZ = Math.max(fullMaxXZ, m);
          if (tmpBox.max.y > -0.9) {
            aboveMaxXZ = Math.max(aboveMaxXZ, m);
            if (m > 8.4) oobAbove.add(`${im.name || im.geometry.type}(max=${m.toFixed(2)},y=[${tmpBox.min.y.toFixed(2)},${tmpBox.max.y.toFixed(2)}])`);
          }
        }
      }
    } else if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      meshes++; draws++;
      const t = geoTriCount(mesh.geometry);
      tris += t;
      heavy.push({ name: mesh.name || mesh.geometry.type, tris: t, count: 1 });
      tmpBox.setFromObject(mesh);
      if (!tmpBox.isEmpty()) {
        const m = Math.max(Math.abs(tmpBox.min.x), Math.abs(tmpBox.max.x), Math.abs(tmpBox.min.z), Math.abs(tmpBox.max.z));
        fullMaxXZ = Math.max(fullMaxXZ, m);
        if (tmpBox.max.y > -0.9) {
          aboveMaxXZ = Math.max(aboveMaxXZ, m);
          if (m > 8.4) oobAbove.add(`${mesh.name || mesh.geometry.type}(max=${m.toFixed(2)},y=[${tmpBox.min.y.toFixed(2)},${tmpBox.max.y.toFixed(2)}])`);
        }
      }
    }
  });
  heavy.sort((a, b) => b.tris - a.tris);
  rows.push({
    key, draws, meshes, inst, tris,
    aboveMaxXZ: Number(aboveMaxXZ.toFixed(2)),
    fullMaxXZ: Number(fullMaxXZ.toFixed(2)),
    oobAbove: [...oobAbove].slice(0, 5),
    top: heavy.slice(0, 3).map((h) => `${h.name}:${h.tris}${h.count > 1 ? `x${h.count}` : ''}`),
  });
}

console.log('=== TOP 12 BY DRAWS ===');
[...rows].sort((a, b) => b.draws - a.draws).slice(0, 12).forEach((r) =>
  console.log(`${r.key.padEnd(27)} draws=${String(r.draws).padStart(3)}(m=${r.meshes},im=${r.inst}) tris=${String(r.tris).padStart(6)} ${r.top.join(' | ')}`)
);

console.log('\n=== TOP 12 BY TRIS ===');
[...rows].sort((a, b) => b.tris - a.tris).slice(0, 12).forEach((r) =>
  console.log(`${r.key.padEnd(27)} tris=${String(r.tris).padStart(6)} draws=${String(r.draws).padStart(3)} ${r.top.join(' | ')}`)
);

console.log('\n=== ABOVE-GROUND (> 8.40) ===');
rows.filter((r) => r.aboveMaxXZ > 8.4).sort((a, b) => b.aboveMaxXZ - a.aboveMaxXZ).forEach((r) =>
  console.log(`${r.key.padEnd(27)} above=${r.aboveMaxXZ} full=${r.fullMaxXZ} ${r.oobAbove.join(', ')}`)
);
