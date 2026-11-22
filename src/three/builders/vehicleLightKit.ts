import * as THREE from 'three';
import {
  getCarHeadlightMat,
  getCarPoolMat,
  getCarTaillightMat,
} from './primitives';

export interface VehicleLightPose {
  /** Ground position of the vehicle centre. */
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Yaw in the car() convention: local forward is +X. */
  readonly yaw: number;
  /** Optional uniform scale; defaults to 1. */
  readonly scale?: number;
}

export interface VehicleLightBatch {
  readonly root: THREE.Group;
  /** Rewrite all instance transforms. Safe to call every frame; no allocations. */
  update: (poses: readonly VehicleLightPose[]) => void;
}

export interface VehicleLightRig {
  readonly root: THREE.Group;
  /** Copy current car transforms into the batch. Safe to call every frame. */
  sync: () => void;
}

/**
 * Attach a batched light rig to a parent and drive it from existing car groups.
 * Cars must be created with `car(..., false)` so their old per-car light meshes
 * are not duplicated. Poses are allocated once; `sync()` only rewrites numbers.
 */
export function attachVehicleLights(
  parent: THREE.Object3D,
  cars: readonly THREE.Object3D[]
): VehicleLightRig {
  const batch = createVehicleLightBatch(cars.length);
  const poses = cars.map(() => ({ x: 0, y: 0, z: 0, yaw: 0, scale: 1 }));
  parent.add(batch.root);
  const sync = (): void => {
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const pose = poses[i];
      pose.x = car.position.x;
      pose.y = car.position.y;
      pose.z = car.position.z;
      pose.yaw = car.rotation.y;
      pose.scale = car.scale.x;
    }
    batch.update(poses);
  };
  sync();
  return { root: batch.root, sync };
}

interface LightGeometries {
  readonly beam: THREE.ConeGeometry;
  readonly tail: THREE.PlaneGeometry;
  readonly pool: THREE.PlaneGeometry;
}

let lightGeometries: LightGeometries | null = null;

const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpScale = new THREE.Vector3();
const tmpMatrix = new THREE.Matrix4();

function ensureLightGeometries(): LightGeometries {
  if (lightGeometries) return lightGeometries;
  const beam = new THREE.ConeGeometry(0.24, 1.35, 10, 1, true)
    .rotateZ(Math.PI / 2)
    .translate(0.675, 0, 0);
  const tail = new THREE.PlaneGeometry(0.26, 0.26).rotateY(Math.PI / 2);
  const pool = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  beam.userData.sharedResource = true;
  tail.userData.sharedResource = true;
  pool.userData.sharedResource = true;
  lightGeometries = { beam, tail, pool };
  return lightGeometries;
}

function markLightMesh(mesh: THREE.InstancedMesh, renderOrder: number): void {
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = renderOrder;
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.userData.noShadow = true;
  mesh.userData.cannotReceiveAO = true;
  mesh.userData.noDissolve = true;
}

function placeInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  pose: VehicleLightPose,
  localX: number,
  localY: number,
  localZ: number,
  rx: number,
  ry: number,
  rz: number,
  scaleX: number,
  scaleY: number,
  scaleZ: number,
  cos: number,
  sin: number
): void {
  const scale = pose.scale ?? 1;
  tmpPos.set(
    pose.x + (localX * cos + localZ * sin) * scale,
    pose.y + localY * scale,
    pose.z + (-localX * sin + localZ * cos) * scale
  );
  tmpEuler.set(rx, ry, rz);
  tmpQuat.setFromEuler(tmpEuler);
  tmpScale.set(scaleX, scaleY, scaleZ);
  tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
  mesh.setMatrixAt(index, tmpMatrix);
}

/**
 * Batched night-only car lights using the same WU-gated additive materials as
 * car(), but with one InstancedMesh per light type instead of per-car meshes.
 * No PointLights are created.
 */
export function createVehicleLightBatch(maxVehicles: number): VehicleLightBatch {
  const geos = ensureLightGeometries();
  const root = new THREE.Group();
  root.name = 'vehicle-light-batch';

  const beams = new THREE.InstancedMesh(geos.beam, getCarHeadlightMat(), maxVehicles * 2);
  const tails = new THREE.InstancedMesh(geos.tail, getCarTaillightMat(), maxVehicles * 2);
  const pools = new THREE.InstancedMesh(geos.pool, getCarPoolMat(), maxVehicles);
  markLightMesh(beams, 4);
  markLightMesh(tails, 4);
  markLightMesh(pools, 3);
  beams.count = 0;
  tails.count = 0;
  pools.count = 0;
  root.add(beams, tails, pools);

  const update = (poses: readonly VehicleLightPose[]): void => {
    const count = Math.min(poses.length, maxVehicles);
    for (let i = 0; i < count; i++) {
      const pose = poses[i];
      const cos = Math.cos(pose.yaw);
      const sin = Math.sin(pose.yaw);
      const s = pose.scale ?? 1;
      for (let side = 0; side < 2; side++) {
        const z = side === 0 ? -0.13 : 0.13;
        placeInstance(
          beams,
          i * 2 + side,
          pose,
          0.53,
          0.13,
          z,
          0,
          pose.yaw,
          -0.09,
          s,
          s,
          s,
          cos,
          sin
        );
        placeInstance(tails, i * 2 + side, pose, -0.55, 0.15, z, 0, pose.yaw, 0, s, s, s, cos, sin);
      }
      placeInstance(
        pools,
        i,
        pose,
        1.02,
        0.006,
        0,
        0,
        pose.yaw,
        0,
        1.5 * s,
        1,
        0.8 * s,
        cos,
        sin
      );
    }
    beams.count = count * 2;
    tails.count = count * 2;
    pools.count = count;
    if (count > 0) {
      beams.instanceMatrix.needsUpdate = true;
      tails.instanceMatrix.needsUpdate = true;
      pools.instanceMatrix.needsUpdate = true;
    }
  };

  return { root, update };
}
