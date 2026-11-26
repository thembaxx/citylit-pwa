import assert from 'node:assert/strict';
import test from 'node:test';
import { cloudDrift } from './cloudMotion.ts';

test('cloud drift is finite, deterministic, and bounded at calm and storm winds', () => {
  for (const wind of [0, 0.5, 1, 2]) {
    const drift = cloudDrift(12.5, 3.2, wind, 1, 0);
    assert.deepEqual(drift, cloudDrift(12.5, 3.2, wind, 1, 0));
    assert.ok(Number.isFinite(drift.x) && Number.isFinite(drift.z));
    assert.ok(Math.hypot(drift.x, drift.z) < 0.12);
  }
});

test('wind direction steers the dominant drift and zero direction falls back safely', () => {
  const east = cloudDrift(4, 0.8, 1, 1, 0);
  const north = cloudDrift(4, 0.8, 1, 0, 1);
  const calmDirection = cloudDrift(4, 0.8, 1, 0, 0);
  assert.ok(Math.abs(east.x) > Math.abs(east.z));
  assert.ok(Math.abs(north.z) > Math.abs(north.x));
  assert.deepEqual(calmDirection, east);
});

test('invalid elapsed, phase, and wind values cannot leak NaN into transforms', () => {
  const drift = cloudDrift(Number.NaN, Number.NaN, Number.NaN, 0, 0);
  assert.deepEqual(drift, cloudDrift(0, 0, 0, 1, 0));
});
