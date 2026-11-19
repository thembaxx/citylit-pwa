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

  // A handful of puffs arranged on a slightly flattened sphere reads as one
  // soft cumulus cluster instead of a row of discs.
  const PuffOffsets: ReadonlyArray<readonly [number, number, number, number]> = [
    [0.0, 0.03, 0.0, 1.3],
    [0.105, 0.035, 0.03, 0.96],
    [-0.1, 0.015, 0.04, 0.94],
    [0.03, 0.085, -0.075, 0.86],
    [-0.045, 0.07, 0.08, 0.9],
    [0.14, -0.01, -0.05, 0.74],
    [-0.135, -0.02, -0.035, 0.72],
    [0.02, -0.035, 0.125, 0.68],
  ];

  for (let c = 0; c < 2; c++) {
    const angle = seed * 2.1 + c * 2.35;
    const rad = 0.52 + c * 0.16;
    const cx = Math.cos(angle) * rad;
    const cy = maxTopY + 0.42 + c * 0.12;
    const cz = Math.sin(angle) * rad * 0.85;
    shadowSpots.push({ x: cx, z: cz });

    PuffOffsets.forEach(([ox, oy, oz, weight], p) => {
      const s = 0.118 * weight;
      puffs.push({
        x: cx + ox,
        y: cy + oy,
        z: cz + oz,
        sx: s * 1.22,
        sy: s * 0.94,
        sz: s * 1.08,
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
    opacity: 0.24,
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
