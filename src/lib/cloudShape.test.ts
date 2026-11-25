import assert from 'node:assert/strict';
import test from 'node:test';
import { cloudOpacity, sampleCloudDensity } from './cloudShape.ts';

test('cloud density is deterministic and stays within the texture bounds', () => {
  for (const [u, v] of [
    [0, 0],
    [0.12, 0.62],
    [0.47, 0.39],
    [0.88, 0.63],
    [1, 1],
  ]) {
    const density = sampleCloudDensity(u, v);
    assert.equal(density, sampleCloudDensity(u, v));
    assert.ok(density >= 0 && density <= 1);
  }
  assert.equal(sampleCloudDensity(-0.01, 0.5), 0);
  assert.equal(sampleCloudDensity(0.5, 1.01), 0);
});

test('cloud bank has a dense center, soft edges, and transparent corners', () => {
  assert.ok(sampleCloudDensity(0.47, 0.39) > sampleCloudDensity(0.02, 0.02));
  assert.equal(cloudOpacity(0), 0);
  assert.equal(cloudOpacity(1), 1);
  assert.ok(cloudOpacity(0.65) > 0 && cloudOpacity(0.65) < 1);
});
