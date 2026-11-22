import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceAnimalTime,
  animalSeasonForMonth,
  isAnimalActive,
  normalizeAnimalMonth,
  writeAnimalPose,
  type AnimalIdle,
  type AnimalPose,
} from '../three/builders/animalKit.ts';

test('normalizeAnimalMonth wraps into 1-12 in both directions', () => {
  assert.equal(normalizeAnimalMonth(1), 1);
  assert.equal(normalizeAnimalMonth(12), 12);
  assert.equal(normalizeAnimalMonth(0), 12);
  assert.equal(normalizeAnimalMonth(13), 1);
  assert.equal(normalizeAnimalMonth(-11), 1);
  assert.equal(normalizeAnimalMonth(25), 1);
  assert.equal(normalizeAnimalMonth(Number.NaN), 1);
});

test('animalSeasonForMonth uses southern-hemisphere seasons', () => {
  for (const m of [12, 1, 2]) assert.equal(animalSeasonForMonth(m), 'summer');
  for (const m of [3, 4, 5]) assert.equal(animalSeasonForMonth(m), 'autumn');
  for (const m of [6, 7, 8]) assert.equal(animalSeasonForMonth(m), 'winter');
  for (const m of [9, 10, 11]) assert.equal(animalSeasonForMonth(m), 'spring');
});

test('isAnimalActive combines month and season gates as AND', () => {
  assert.equal(isAnimalActive(7), true);
  assert.equal(isAnimalActive(7, [6, 7, 8]), true);
  assert.equal(isAnimalActive(7, [12, 1]), false);
  assert.equal(isAnimalActive(7, undefined, 'winter'), true);
  assert.equal(isAnimalActive(7, undefined, ['summer', 'spring']), false);
  assert.equal(isAnimalActive(7, [6, 7, 8], 'winter'), true);
  assert.equal(isAnimalActive(7, [6, 7, 8], 'summer'), false);
  assert.equal(isAnimalActive(undefined, [6, 7, 8], 'summer'), true);
  assert.equal(isAnimalActive(Number.NaN, [6, 7, 8], 'summer'), true);
});

test('advanceAnimalTime clamps dt and motionScale and freezes at zero', () => {
  assert.equal(advanceAnimalTime(10, 1, 0), 10);
  assert.equal(advanceAnimalTime(10, 0.5, 2), 10.2);
  assert.equal(advanceAnimalTime(10, 5, 1), 10.1);
  assert.equal(advanceAnimalTime(10, -1, 1), 10);
  assert.equal(advanceAnimalTime(10, Number.NaN, 1), 10);
  assert.equal(advanceAnimalTime(Number.NaN, 1, 1), 0);
});

test('writeAnimalPose is deterministic, bounded and clears stale fields', () => {
  const pose: AnimalPose = { y: 0, rx: 0, ry: 0, rz: 0, sy: 1 };
  const idles: AnimalIdle[] = ['bob', 'graze', 'lookup', 'waddle', 'submerge', 'rock'];
  for (const idle of idles) {
    for (let i = 0; i <= 24; i++) {
      const phase = i * 0.37;
      writeAnimalPose(pose, idle, phase);
      for (const value of [pose.y, pose.rx, pose.ry, pose.rz]) {
        assert.ok(Number.isFinite(value), `${idle} produced a non-finite value`);
        assert.ok(Math.abs(value) < 0.5, `${idle} produced an out-of-range value: ${value}`);
      }
      assert.ok(Number.isFinite(pose.sy));
      assert.ok(pose.sy > 0.8 && pose.sy < 1.2, `${idle} sy out of range: ${pose.sy}`);
      const snapshot = { ...pose };
      writeAnimalPose(pose, idle, phase);
      assert.deepEqual(pose, snapshot);
    }
  }
  pose.rx = 9;
  pose.rz = 9;
  writeAnimalPose(pose, 'bob', 0);
  assert.equal(pose.rx, 0);
  assert.equal(pose.rz, 0);
  assert.equal(pose.y, 0);
  assert.equal(pose.sy, 1);
});
