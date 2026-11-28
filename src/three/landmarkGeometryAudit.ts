import * as THREE from 'three';

export interface LandmarkGeometryAudit {
  readonly ok: boolean;
  /** Worst-case triangles among LOD levels, including instanced copies. */
  readonly triangles: number;
  readonly meshes: number;
  readonly instances: number;
  readonly issues: readonly string[];
}

export interface LandmarkGeometryAuditOptions {
  /** Optional scene-specific budget; LOD alternatives are not added together. */
  readonly maxTriangles?: number;
  /** Cap detail in large generated scenes while still sampling the full bounds. */
  readonly maxVertexChecksPerGeometry?: number;
  /** Maximum absolute local coordinate accepted for authored geometry. */
  readonly maxCoordinate?: number;
}

function objectLabel(object: THREE.Object3D): string {
  return object.name || `${object.type}#${object.id}`;
}

/**
 * Checks a built landmark for malformed buffers/transforms and optionally a
 * triangle budget. This is intentionally renderer-free so builders and tests
 * can use it without WebGL. Alternative THREE.LOD levels contribute their
 * maximum triangle cost rather than being incorrectly summed together.
 */
export function auditLandmarkGeometry(
  root: THREE.Object3D,
  options: LandmarkGeometryAuditOptions = {}
): LandmarkGeometryAudit {
  const issues: string[] = [];
  const maxVertexChecks = Math.max(16, options.maxVertexChecksPerGeometry ?? 200_000);
  const maxCoordinate = Math.max(0.001, options.maxCoordinate ?? 10_000);
  const checkedGeometry = new WeakSet<THREE.BufferGeometry>();
  const checkedInstances = new WeakSet<THREE.InstancedMesh>();
  const geometryIssues = new WeakMap<THREE.BufferGeometry, readonly string[]>();
  let meshes = 0;
  let instances = 0;

  root.updateWorldMatrix(true, true);

  const checkGeometry = (geometry: THREE.BufferGeometry, label: string): number => {
    const position = geometry.getAttribute('position');
    if (!position || position.count === 0) {
      issues.push(`${label}: missing position vertices`);
      return 0;
    }

    if (!checkedGeometry.has(geometry)) {
      checkedGeometry.add(geometry);
      const found: string[] = [];
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox ?? new THREE.Box3();
      const boundsValues = [
        bounds.min.x,
        bounds.min.y,
        bounds.min.z,
        bounds.max.x,
        bounds.max.y,
        bounds.max.z,
      ];
      if (boundsValues.some((value) => !Number.isFinite(value))) {
        found.push('non-finite geometry bounds');
      } else if (boundsValues.some((value) => Math.abs(value) > maxCoordinate)) {
        found.push(`geometry bounds exceed ${maxCoordinate} units`);
      }
      const stride = Math.max(1, Math.ceil(position.count / maxVertexChecks));
      for (let i = 0; i < position.count; i += stride) {
        if (
          !Number.isFinite(position.getX(i)) ||
          !Number.isFinite(position.getY(i)) ||
          !Number.isFinite(position.getZ(i))
        ) {
          found.push(`non-finite vertex at ${i}`);
          break;
        }
      }

      const index = geometry.getIndex();
      let indicesValid = true;
      if (index) {
        if (index.count % 3 !== 0) found.push(`index count ${index.count} is not triangular`);
        for (let i = 0; i < index.count; i++) {
          const value = index.getX(i);
          if (!Number.isInteger(value) || value < 0 || value >= position.count) {
            found.push(`invalid index ${value} at ${i}`);
            indicesValid = false;
            break;
          }
        }
      } else if (position.count % 3 !== 0) {
        found.push(`vertex count ${position.count} is not triangular`);
      }

      if (indicesValid) {
        const elementCount = index?.count ?? position.count;
        const triangleCount = Math.floor(elementCount / 3);
        const triangleStride = Math.max(1, Math.ceil(triangleCount / maxVertexChecks));
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        const edge1 = new THREE.Vector3();
        const edge2 = new THREE.Vector3();
        for (let triangle = 0; triangle < triangleCount; triangle += triangleStride) {
          const offset = triangle * 3;
          const ia = index ? index.getX(offset) : offset;
          const ib = index ? index.getX(offset + 1) : offset + 1;
          const ic = index ? index.getX(offset + 2) : offset + 2;
          a.fromBufferAttribute(position, ia);
          b.fromBufferAttribute(position, ib);
          c.fromBufferAttribute(position, ic);
          edge1.subVectors(b, a);
          edge2.subVectors(c, a);
          if (edge1.cross(edge2).lengthSq() <= 1e-16) {
            found.push(`degenerate triangle at ${triangle}`);
            break;
          }
        }
      }
      geometryIssues.set(geometry, found);
    }

    for (const problem of geometryIssues.get(geometry) ?? []) {
      issues.push(`${label}: ${problem}`);
    }
    const elements = geometry.getIndex()?.count ?? position.count;
    return Math.floor(elements / 3);
  };

  const count = (object: THREE.Object3D): number => {
    for (const value of object.matrixWorld.elements) {
      if (!Number.isFinite(value)) {
        issues.push(`${objectLabel(object)}: non-finite world transform`);
        break;
      }
    }

    if (object instanceof THREE.LOD && object.levels.length > 0) {
      let maxLevelTriangles = 0;
      for (const level of object.levels) {
        maxLevelTriangles = Math.max(maxLevelTriangles, count(level.object));
      }
      return (
        maxLevelTriangles +
        object.children
          .filter((child) => !object.levels.some((level) => level.object === child))
          .reduce((sum, child) => sum + count(child), 0)
      );
    }

    let triangles = 0;
    if (object instanceof THREE.Mesh) {
      meshes++;
      const label = objectLabel(object);
      const perCopy = checkGeometry(object.geometry, label);
      if (object instanceof THREE.InstancedMesh) {
        const copies = object.count;
        instances += copies;
        if (!checkedInstances.has(object)) {
          checkedInstances.add(object);
          const matrices = object.instanceMatrix.array;
          for (let i = 0; i < matrices.length; i++) {
            if (!Number.isFinite(matrices[i])) {
              issues.push(`${label}: non-finite instance transform at ${i}`);
              break;
            }
          }
        }
        triangles += perCopy * copies;
      } else {
        triangles += perCopy;
      }
    }
    for (const child of object.children) triangles += count(child);
    return triangles;
  };

  const triangles = count(root);
  if (options.maxTriangles !== undefined && triangles > options.maxTriangles) {
    issues.push(`triangle budget exceeded: ${triangles} > ${options.maxTriangles}`);
  }

  return { ok: issues.length === 0, triangles, meshes, instances, issues };
}
