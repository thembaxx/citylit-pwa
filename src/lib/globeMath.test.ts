import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {
  easeInOutCubic,
  easeOutCubic,
  GLOBE_RADIUS,
  latLonToVec3,
  mulberry32,
  pointInPoly,
  provinceVisitRatio,
  slerpDirection,
} from './globeMath.ts';

test('latLonToVec3 maps poles and equator points correctly', () => {
  const north = latLonToVec3(90, 0);
  assert.ok(Math.abs(north.y - GLOBE_RADIUS) < 1e-9);
  assert.ok(Math.abs(north.x) < 1e-9 && Math.abs(north.z) < 1e-9);

  const equator = latLonToVec3(0, 0, 2);
  assert.ok(Math.abs(equator.x - 2) < 1e-9);
  assert.ok(Math.abs(equator.y) < 1e-9 && Math.abs(equator.z) < 1e-9);
  assert.ok(Math.abs(equator.length() - 2) < 1e-9);
});

test('pointInPoly handles a simple ring and holes are unnecessary here', () => {
  const square = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0];
  assert.equal(pointInPoly(5, 5, square), true);
  assert.equal(pointInPoly(11, 5, square), false);
  assert.equal(pointInPoly(5, 11, square), false);
});

test('easing helpers are clamped to 0..1 and monotonic', () => {
  for (const ease of [easeOutCubic, easeInOutCubic]) {
    assert.equal(ease(0), 0);
    assert.equal(ease(1), 1);
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const v = ease(Math.min(t, 1));
      assert.ok(v >= prev, `${v} >= ${prev}`);
      prev = v;
    }
  }
});

test('slerpDirection stays on the unit sphere and interpolates endpoints', () => {
  const a = new THREE.Vector3(1, 0, 0);
  const b = new THREE.Vector3(0, 0, 1);
  const mid = slerpDirection(a, b, 0.5);
  assert.ok(Math.abs(mid.length() - 1) < 1e-9);
  assert.ok(Math.abs(mid.x - Math.SQRT1_2) < 1e-9);
  assert.ok(Math.abs(mid.z - Math.SQRT1_2) < 1e-9);
  assert.ok(slerpDirection(a, b, 0).distanceTo(a) < 1e-9);
  assert.ok(slerpDirection(a, b, 1).distanceTo(b) < 1e-9);
});

test('mulberry32 is deterministic for a seed and varies across seeds', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const c = mulberry32(43);
  const seqA = Array.from({ length: 5 }, () => a());
  const seqB = Array.from({ length: 5 }, () => b());
  const seqC = Array.from({ length: 5 }, () => c());
  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, seqC);
  assert.ok(seqA.every((v) => v >= 0 && v < 1));
});

test('provinceVisitRatio counts only landmarks in that province', () => {
  const landmarks = [
    { c: 'Cape Town · Western Cape' },
    { c: 'Cape Point · Western Cape' },
    { c: 'Pretoria · Gauteng' },
  ];
  assert.equal(provinceVisitRatio('Western Cape', landmarks, new Set([0, 1])), 1);
  assert.equal(provinceVisitRatio('Western Cape', landmarks, new Set([0])), 0.5);
  assert.equal(provinceVisitRatio('Gauteng', landmarks, new Set([2])), 1);
  assert.equal(provinceVisitRatio('Limpopo', landmarks, new Set([0, 1, 2])), 0);
});
