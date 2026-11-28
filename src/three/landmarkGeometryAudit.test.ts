import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { auditLandmarkGeometry } from './landmarkGeometryAudit.ts';

const material = new THREE.MeshStandardMaterial();

test('geometry audit accepts valid static and instanced geometry', () => {
  const root = new THREE.Group();
  root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));
  const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, 3);
  instances.setMatrixAt(1, new THREE.Matrix4().makeTranslation(2, 0, 0));
  root.add(instances);

  const audit = auditLandmarkGeometry(root);
  assert.equal(audit.ok, true, audit.issues.join('\n'));
  assert.equal(audit.instances, 3);
  assert.equal(audit.triangles, 12 + 12 * 3);
});

test('geometry audit reports non-finite vertices, indices and transforms', () => {
  const root = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, Infinity, 1, 0], 3)
  );
  geometry.setIndex([0, 1, 4]);
  root.add(new THREE.Mesh(geometry, material));

  const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(), material, 1);
  instances.instanceMatrix.array[0] = Number.NaN;
  root.add(instances);

  const audit = auditLandmarkGeometry(root);
  assert.equal(audit.ok, false);
  assert.ok(audit.issues.some((issue) => issue.includes('non-finite vertex')));
  assert.ok(audit.issues.some((issue) => issue.includes('invalid index')));
  assert.ok(audit.issues.some((issue) => issue.includes('non-finite instance transform')));
});

test('geometry audit reports degenerate triangles and recomputes stale bounds', () => {
  const root = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 2, 0, 0], 3)
  );
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(100, 100, 100),
    new THREE.Vector3(101, 101, 101)
  );
  root.add(new THREE.Mesh(geometry, material));

  const audit = auditLandmarkGeometry(root, { maxCoordinate: 3 });
  assert.equal(audit.ok, false);
  assert.ok(audit.issues.some((issue) => issue.includes('degenerate triangle')));
  assert.ok(!audit.issues.some((issue) => issue.includes('bounds exceed')));
});

test('geometry audit counts only the most expensive LOD level', () => {
  const root = new THREE.Group();
  const lod = new THREE.LOD();
  lod.addLevel(new THREE.Mesh(new THREE.BoxGeometry(), material), 0);
  lod.addLevel(new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), material), 10);
  root.add(lod);

  const audit = auditLandmarkGeometry(root);
  assert.equal(audit.ok, true, audit.issues.join('\n'));
  assert.equal(audit.triangles, 168);
});

test('geometry audit enforces optional triangle and coordinate budgets', () => {
  const root = new THREE.Group();
  root.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), material));

  const audit = auditLandmarkGeometry(root, { maxTriangles: 11, maxCoordinate: 0.5 });
  assert.equal(audit.ok, false);
  assert.ok(audit.issues.some((issue) => issue.includes('triangle budget exceeded')));
  assert.ok(audit.issues.some((issue) => issue.includes('bounds exceed')));
});
