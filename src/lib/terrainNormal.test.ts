import assert from 'node:assert/strict';
import test from 'node:test';
import { terrainNormalFromTangents } from './terrainNormal.ts';

test('terrain normal uses world-space tangents on flat and sloped grids', () => {
  assert.deepEqual(terrainNormalFromTangents([1, 0, 0], [0, 0, 1]), [0, 1, 0]);
  const normal = terrainNormalFromTangents([1, 0.5, 0], [0, 0, 1]);
  assert.ok(Math.abs(normal[0] + 0.4472135955) < 1e-8);
  assert.ok(Math.abs(normal[1] - 0.894427191) < 1e-8);
  assert.equal(normal[2], 0);
});

test('terrain normal accounts for a warped footprint basis', () => {
  const normal = terrainNormalFromTangents([1, 0.2, 0.25], [0.1, 0.35, 1]);
  const len = Math.hypot(...normal);
  assert.ok(Math.abs(len - 1) < 1e-10);
  assert.ok(normal[1] > 0);

  // Cross products are perpendicular to both measured terrain tangents.
  assert.ok(Math.abs(normal[0] + normal[1] * 0.2 + normal[2] * 0.25) < 1e-10);
  assert.ok(Math.abs(normal[0] * 0.1 + normal[1] * 0.35 + normal[2]) < 1e-10);
});

test('degenerate and non-finite tangents return a safe up normal', () => {
  assert.deepEqual(terrainNormalFromTangents([0, 0, 0], [0, 0, 1]), [0, 1, 0]);
  assert.deepEqual(terrainNormalFromTangents([Number.NaN, 0, 0], [0, 0, 1]), [0, 1, 0]);
  assert.deepEqual(terrainNormalFromTangents([0, 0, 1], [1, 0, 0]), [0, 1, 0]);
});
