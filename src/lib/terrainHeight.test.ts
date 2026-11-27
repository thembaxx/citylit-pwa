import assert from 'node:assert/strict';
import test from 'node:test';
import { createTerrainHeightSampler } from './terrainHeight.ts';

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
