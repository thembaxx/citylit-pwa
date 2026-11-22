import * as THREE from 'three';
import { getSoftTexture } from './shaders';

interface CloudAssets {
  sphereGeo: THREE.BufferGeometry;
  cloudMat: THREE.ShaderMaterial;
}

export interface SliceCloudLayer {
  group: THREE.Group;
  tick: (elapsed: number) => void;
  dispose: () => void;
}

export interface CloudPuffInstance {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  phase: number;
}

/**
 * Build one instanced cloud puff mesh from a set of puff transforms. Each puff
 * gets a per-instance phase so the cloud shader can drift and bob on the GPU.
 */
export function createCloudPuffMesh(
  shared: CloudAssets,
  puffs: ReadonlyArray<CloudPuffInstance>
): THREE.InstancedMesh {
  const puffGeo = shared.sphereGeo.clone();
  const phases = new Float32Array(puffs.length);
  for (let i = 0; i < puffs.length; i++) phases[i] = puffs[i].phase;
  puffGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));

  const mesh = new THREE.InstancedMesh(puffGeo, shared.cloudMat, puffs.length);
  const dummy = new THREE.Object3D();
  puffs.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(0, (p.phase * 0.7) % (Math.PI * 2), 0);
    dummy.scale.set(p.sx, p.sy, p.sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 3;
  return mesh;
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Instanced stylised cloud clusters with GPU drift/bob and a soft contact shadow
 * per cluster. One draw call for every puff and one for all shadows.
 */
export function createSliceCloudLayer(
  shared: CloudAssets,
  seed: number,
  maxTopY: number,
  heightAt: (x: number, z: number) => number
): SliceCloudLayer {
  const group = new THREE.Group();

  const puffs: CloudPuffInstance[] = [];
  const shadowSpots: Array<{ x: number; z: number }> = [];

  // Reference-style cumulus: a wide flat base row of puffs, a bulging middle
  // and a stacked cauliflower crown, so the cluster silhouettes as a single
  // chunky cloud instead of a ring of spheres.
  const PuffOffsets: ReadonlyArray<readonly [number, number, number, number]> = [
    // flat, slightly shaded base
    [0.0, -0.035, 0.0, 1.30],
    [0.19, -0.045, 0.03, 0.92],
    [-0.18, -0.04, -0.02, 0.90],
    [0.06, -0.05, 0.15, 0.80],
    [-0.08, -0.05, -0.14, 0.78],
    // main billows
    [0.02, 0.075, 0.01, 1.14],
    [0.22, 0.05, -0.07, 0.86],
    [-0.21, 0.06, 0.07, 0.84],
    [0.10, 0.03, 0.20, 0.74],
    [-0.13, 0.04, -0.18, 0.72],
    // cauliflower crown, kept broad rather than tall
    [0.02, 0.185, 0.0, 0.90],
    [-0.12, 0.16, -0.05, 0.76],
    [0.14, 0.165, -0.02, 0.78],
    [0.01, 0.225, 0.03, 0.60],
    [-0.02, 0.14, 0.12, 0.66],
  ];

  const clusters = 3 + (Math.floor(seed * 10) % 3);
  for (let c = 0; c < clusters; c++) {
    const angle = seed * 2.1 + c * 2.35;
    const rad = 0.52 + c * 0.16;
    const cx = Math.cos(angle) * rad;
    const cy = maxTopY + 0.78 + c * 0.21;
    const cz = Math.sin(angle) * rad * 0.85;
    shadowSpots.push({ x: cx, z: cz });

    PuffOffsets.forEach(([ox, oy, oz, weight], p) => {
      // Clusters shrink and thin out as they climb, giving the sky depth.
      const s = 0.175 * weight * (1 - c * 0.09) * (0.92 + hash(seed * 31.7 + c * 7.3 + p));
      puffs.push({
        x: cx + ox * (1 - c * 0.05),
        y: cy + oy * (1 - c * 0.04),
        z: cz + oz * (1 - c * 0.05),
        sx: s * 1.30,
        sy: s * (0.94 + oy * 0.18),
        sz: s * 1.16,
        phase: seed * 1.7 + c * 2.3 + p * 0.37,
      });
    });
  }

  const cloudMesh = createCloudPuffMesh(shared, puffs);
  group.add(cloudMesh);

  const shadowGeo = new THREE.PlaneGeometry(1, 1);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getSoftTexture(),
    color: '#050811',
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const shadows = new THREE.InstancedMesh(shadowGeo, shadowMat, shadowSpots.length);
  const dummy = new THREE.Object3D();
  shadowSpots.forEach((spot, i) => {
    dummy.position.set(spot.x, heightAt(spot.x, spot.z) + 0.018, spot.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(0.62, 1, 0.46);
    dummy.updateMatrix();
    shadows.setMatrixAt(i, dummy.matrix);
  });
  shadows.instanceMatrix.needsUpdate = true;
  shadows.computeBoundingSphere();
  shadows.renderOrder = 1;
  shadows.userData.noShadow = true;
  shadows.userData.cannotReceiveAO = true;
  group.add(shadows);

  return {
    group,
    tick: () => {
      // Drift, bob and shading are driven by WU.t inside the cloud shader.
    },
    dispose: () => {
      cloudMesh.geometry.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
    },
  };
}
