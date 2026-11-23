import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeBirdSpawnIntervalSec,
  computeFoliageSwayAngle,
  computeFoliageWindStrength,
  isDaylightForBirds,
} from './foliageWind.ts';

test('computeFoliageWindStrength scales monotonically across weather wind speeds', () => {
  const calmAvg = averageOverSamples((t) => computeFoliageWindStrength(0.6, 0, 0, t, 1));
  const sunnyAvg = averageOverSamples((t) => computeFoliageWindStrength(1.0, 0, 0, t, 1));
  const breezyAvg = averageOverSamples((t) => computeFoliageWindStrength(1.8, 0, 0.7, t, 1));
  const windyAvg = averageOverSamples((t) => computeFoliageWindStrength(3.5, 0.4, 0.3, t, 1));

  assert.ok(calmAvg > 0.3 && calmAvg < sunnyAvg);
  assert.ok(sunnyAvg < breezyAvg);
  assert.ok(breezyAvg < windyAvg);
  assert.ok(windyAvg <= 4.5);
});

test('computeFoliageWindStrength damps to steady non-oscillating level when reduced motion is active', () => {
  const s1 = computeFoliageWindStrength(2.4, 0.6, 0.5, 0.5, 0);
  const s2 = computeFoliageWindStrength(2.4, 0.6, 0.5, 4.2, 0);
  assert.equal(s1, s2);
  assert.ok(s1 > 0 && s1 < 2.4);
  assert.equal(computeFoliageWindStrength(0, 0, 0, 2, 1), 0);
});

test('computeFoliageSwayAngle stays bounded and stops under reduced motion', () => {
  assert.equal(computeFoliageSwayAngle(3.2, 0.5, 1.25, 0.045, 2.0, 0), 0);
  const gentle = Math.abs(computeFoliageSwayAngle(1.0, 0.4, 1.25, 0.045, 0.6, 1));
  const gale = Math.abs(computeFoliageSwayAngle(1.0, 0.4, 1.25, 0.045, 3.5, 1));
  assert.ok(gale > gentle);
  assert.ok(gale < 0.25);
});

test('isDaylightForBirds only permits spawning during calm daylight non-studio conditions', () => {
  assert.equal(isDaylightForBirds(false, false, 0, 0), true);
  assert.equal(isDaylightForBirds(false, false, 0.5, 0.2), true);
  assert.equal(isDaylightForBirds(true, false, 0, 0), false);
  assert.equal(isDaylightForBirds(false, true, 0, 0), false);
  assert.equal(isDaylightForBirds(false, false, 0.9, 0.2), false);
  assert.equal(isDaylightForBirds(false, false, 0.4, 0.7), false);
});

test('computeBirdSpawnIntervalSec spawns quickly when empty and spaces out with active birds', () => {
  const empty = computeBirdSpawnIntervalSec(1.0, 0);
  const one = computeBirdSpawnIntervalSec(1.0, 1);
  const full = computeBirdSpawnIntervalSec(1.0, 4);
  assert.ok(empty < one);
  assert.ok(one < full);
});

function averageOverSamples(fn: (t: number) => number): number {
  let sum = 0;
  const count = 40;
  for (let i = 0; i < count; i++) {
    sum += fn(i * 0.45);
  }
  return sum / count;
}
