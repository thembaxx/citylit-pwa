import assert from 'node:assert/strict';
import test from 'node:test';
import { headingYaw, leftLaneOffset, normalizePlanar } from './trafficMath.ts';

test('normalizePlanar rejects zero vectors', () => {
  assert.equal(normalizePlanar(0, 0), null);
  const dir = normalizePlanar(3, 4);
  assert.ok(dir);
  assert.ok(Math.abs(Math.hypot(dir.x, dir.z) - 1) < 1e-9);
});

test('left-hand offset is north when heading east', () => {
  const offset = leftLaneOffset(1, 0, 0.5);
  assert.ok(Math.abs(offset.x) < 1e-9);
  assert.ok(Math.abs(offset.z + 0.5) < 1e-9);
});

test('left-hand offset is west when heading north', () => {
  const offset = leftLaneOffset(0, -1, 0.5);
  assert.ok(Math.abs(offset.x + 0.5) < 1e-9);
  assert.ok(Math.abs(offset.z) < 1e-9);
});

test('heading yaw matches the +X-forward car convention', () => {
  assert.ok(Math.abs(headingYaw(1, 0)) < 1e-9);
  assert.ok(Math.abs(headingYaw(0, -1) - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(headingYaw(-1, 0) - Math.PI) < 1e-9);
});
