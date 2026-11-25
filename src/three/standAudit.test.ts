import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { defaultStandPolygon, STAND_HALF } from '../lib/standFootprint.ts';
import { auditStandContainment } from './standAudit.ts';

function box(size: number): THREE.BufferGeometry {
  return new THREE.BoxGeometry(size, 0.2, size);
}

test('the containment audit finds content that reaches past the stand', () => {
  const group = new THREE.Group();
  const inside = new THREE.Mesh(box(2), new THREE.MeshStandardMaterial());
  inside.name = 'inside';
  group.add(inside);

  const outside = new THREE.Mesh(box(2), new THREE.MeshStandardMaterial());
  outside.name = 'outside';
  // The box is 2 wide and reaches 0.25 past the stand edge, so its far face
  // sits 1.25 outside the footprint.
  outside.position.set(STAND_HALF + 0.25, 0, 0);
  group.add(outside);

  const audit = auditStandContainment(group, defaultStandPolygon(STAND_HALF));
  assert.equal(audit.ok, false);
  assert.equal(audit.checked, 2);
  assert.ok(Math.abs(audit.worst - 1.25) < 1e-6, `worst ${audit.worst}`);
  assert.equal(audit.offenders.length, 1);
  assert.match(audit.offenders[0].label, /outside/);
});

test('the containment audit ignores the geometry of the stand itself', () => {
  const group = new THREE.Group();
  const stand = new THREE.Mesh(box(STAND_HALF * 2), new THREE.MeshStandardMaterial());
  stand.name = 'stand';
  stand.userData.standGeometry = true;
  group.add(stand);

  const content = new THREE.Mesh(box(1), new THREE.MeshStandardMaterial());
  content.name = 'content';
  content.position.set(STAND_HALF * 0.4, 0, 0);
  group.add(content);

  const audit = auditStandContainment(group, defaultStandPolygon(STAND_HALF));
  assert.equal(audit.ok, true);
  assert.equal(audit.worst, 0);
  assert.equal(audit.checked, 1);
});

test('the containment audit follows a non-square stand silhouette', () => {
  const group = new THREE.Group();
  // A square block that would fill the square stand exactly, but which pokes
  // past a chamfered pilot corner.
  const block = new THREE.Mesh(box(STAND_HALF * 1.6), new THREE.MeshStandardMaterial());
  block.name = 'block';
  group.add(block);

  const chamfered = [
    [-STAND_HALF, -STAND_HALF],
    [STAND_HALF, -STAND_HALF],
    [STAND_HALF, STAND_HALF * 0.5],
    [STAND_HALF * 0.5, STAND_HALF],
    [-STAND_HALF * 0.5, STAND_HALF],
    [-STAND_HALF, STAND_HALF * 0.5],
  ] as const;

  const audit = auditStandContainment(group, chamfered);
  assert.equal(audit.ok, false);
  assert.ok(audit.worst > 0);
});
