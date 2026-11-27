import assert from 'node:assert/strict';
import test from 'node:test';
import { createTerrainHeightSampler, createTriangulatedTerrainSampler } from './terrainHeight.ts';

test('terrain sampler preserves valid heights and clamps to the shared floor', () => {
  const heightAt = createTerrainHeightSampler((x, z) => x - z, -0.2, 0.08);
  assert.equal(heightAt(1, 0), 1);
  assert.ok(Math.abs(heightAt(-1, 0) + 0.12) < 1e-12);
  assert.equal(heightAt(0, 0), 0);
});

test('terrain sampler replaces invalid heights and coordinates with the floor', () => {
  const floor = createTerrainHeightSampler(() => Number.NaN, 0.3, 0.08);
  assert.equal(floor(0, 0), 0.38);
  assert.equal(floor(Number.NaN, 0), 0.38);
  assert.equal(floor(0, Number.POSITIVE_INFINITY), 0.38);

  const invalidSettings = createTerrainHeightSampler(() => Number.NEGATIVE_INFINITY, 0, Number.NaN);
  assert.equal(invalidSettings(0, 0), 0);

  const invalidBaseline = createTerrainHeightSampler(() => Number.NaN, Number.NaN);
  assert.equal(invalidBaseline(0, 0), 0.08);
});

test('triangulated terrain sampler matches the mesh triangles between grid vertices', () => {
  const heightAt = (x: number, z: number) => {
    if (x < 0 && z < 0) return 0;
    if (x >= 0 && z < 0) return 2;
    if (x < 0 && z >= 0) return 4;
    return 10;
  };
  const sample = createTriangulatedTerrainSampler(heightAt, {
    halfExtent: 1,
    segments: 1,
    baseY: -10,
    clearance: 0,
  });

  assert.equal(sample(-0.5, -0.5), 1.5);
  assert.equal(sample(0.5, 0.5), 6.5);
  assert.equal(sample(0, 0), 3);
});

test('triangulated sampler clamps to terrain edges and keeps the safe floor', () => {
  const sample = createTriangulatedTerrainSampler((x) => x, {
    halfExtent: 1,
    segments: 2,
    baseY: -0.5,
    clearance: 0.1,
  });
  assert.ok(Math.abs(sample(-2, 0) + 0.4) < 1e-6);
  assert.equal(sample(2, 0), 1);

  const invalid = createTriangulatedTerrainSampler(() => Number.NaN, {
    halfExtent: 1,
    segments: 2,
    baseY: 0.2,
  });
  assert.ok(Math.abs(invalid(0.25, 0.25) - 0.28) < 1e-6);
});
