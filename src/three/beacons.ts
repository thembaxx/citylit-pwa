/**
 * Aviation beacon registry.
 *
 * Tall structures (cooling towers, masts, rooftop crowns) carry small red
 * obstruction lights. Before this, each builder that cared about them animated
 * its own material, which meant the landmarks blinked out of sync and any new
 * site had to re-implement the pulse. Builders now record beacon positions, and
 * the engine draws them as one instanced mesh with a shared clock and a stable
 * per-beacon phase, so the whole skyline breathes on one rhythm.
 */
import * as THREE from 'three';
import { WU } from './shaders';

/** A beacon anchor in the local space of the group that recorded it. */
export interface BeaconAnchor {
  x: number;
  y: number;
  z: number;
  color: THREE.ColorRepresentation;
  /** Sphere radius in scene units. */
  size?: number;
  /** Phase offset 0..1 so neighbouring structures do not blink as one. */
  phase?: number;
}

/** Record beacons on an object, exactly like `userData.streetLampAnchors`. */
export function registerBeacons(
  obj: THREE.Object3D,
  anchors: readonly BeaconAnchor[]
): void {
  if (anchors.length === 0) return;
  const list = (obj.userData.beaconAnchors as BeaconAnchor[] | undefined) ?? [];
  list.push(...anchors);
  obj.userData.beaconAnchors = list;
}

/** Gather every beacon under a landmark, expressed in that landmark's local space. */
export function collectBeacons(root: THREE.Object3D | null | undefined): BeaconAnchor[] {
  if (!root) return [];
  root.updateWorldMatrix(true, true);
  const invRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const relative = new THREE.Matrix4();
  const point = new THREE.Vector3();
  const anchors: BeaconAnchor[] = [];
  root.traverse((obj) => {
    const list = obj.userData.beaconAnchors as BeaconAnchor[] | undefined;
    if (!list || list.length === 0) return;
    relative.multiplyMatrices(invRoot, obj.matrixWorld);
    for (const anchor of list) {
      point.set(anchor.x, anchor.y, anchor.z).applyMatrix4(relative);
      anchors.push({ ...anchor, x: point.x, y: point.y, z: point.z });
    }
  });
  return anchors;
}

const beaconGeo = new THREE.SphereGeometry(1, 8, 6);

/**
 * One instanced mesh for every beacon in a landmark. The shader owns the blink,
 * so the mesh costs a single draw call and needs no per-frame JS work beyond the
 * shared clock uniform.
 */
export function createBeaconMesh(anchors: readonly BeaconAnchor[]): THREE.InstancedMesh | null {
  if (anchors.length === 0) return null;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uLit: WU.lit,
      uWT: WU.t,
      uDY: WU.dy,
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vCol;
      varying float vPhase;
      void main() {
        vec3 pos = position;
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(pos, 1.0);
          vPhase = fract(sin(instanceMatrix[3].x * 12.9898 + instanceMatrix[3].z * 78.233) * 43758.5453);
        #else
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vPhase = 0.0;
        #endif
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #else
          vCol = vec3(1.0, 0.28, 0.22);
        #endif
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uLit, uWT, uDY;
      varying vec3 vWorldPos;
      varying vec3 vCol;
      varying float vPhase;
      void main() {
        if (uDY < 90.0 && vWorldPos.y > uDY && vWorldPos.y < 14.0) discard;
        float night = smoothstep(0.1, 0.6, uLit);
        if (night <= 0.004) discard;
        // ~40 bpm obstruction flash with a long dark gap and a fast rise.
        float t = uWT * 1.15 + vPhase * 6.2831;
        float blink = pow(max(0.0, sin(t)), 26.0);
        float glow = 0.16 + blink * 1.5;
        gl_FragColor = vec4(vCol * glow * night, night);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  mat.userData.sharedResource = false;
  mat.userData.noDissolve = true;

  const mesh = new THREE.InstancedMesh(beaconGeo, mat, anchors.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const size = a.size ?? 0.055;
    p.set(a.x, a.y, a.z);
    s.set(size, size, size);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    col.set(a.color ?? '#ff4a3d');
    mesh.setColorAt(i, col);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  mesh.userData.noShadow = true;
  mesh.userData.cannotReceiveAO = true;
  mesh.userData.noDissolve = true;
  return mesh;
}
