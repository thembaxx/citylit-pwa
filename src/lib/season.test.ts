import assert from 'node:assert/strict';
import test from 'node:test';
import { monthToSeasonWeights } from './season.ts';

test('month drives peak summer warmth and dormant winter', () => {
  const january = monthToSeasonWeights(1);
  const july = monthToSeasonWeights(7);

  assert.ok(january.warmth > 0.99, 'January should be peak summer warmth');
  assert.ok(july.warmth < 0.01, 'July should be dormant winter');
  assert.ok(january.warmth > july.warmth);
});

test('autumn and spring weights peak in their respective months', () => {
  const april = monthToSeasonWeights(4);
  const october = monthToSeasonWeights(10);

  assert.ok(april.autumn > 0.99 && april.spring === 0);
  assert.ok(october.spring > 0.99 && october.autumn === 0);
  assert.equal(monthToSeasonWeights(1).autumn, 0);
  assert.equal(monthToSeasonWeights(7).spring, 0);
});

test('weights stay within 0..1 and clamp out-of-range months', () => {
  for (let month = -5; month <= 20; month++) {
    const w = monthToSeasonWeights(month);
    for (const value of [w.warmth, w.autumn, w.spring]) {
      assert.ok(value >= 0 && value <= 1, `weight ${value} out of range for month ${month}`);
    }
  }
  assert.deepEqual(monthToSeasonWeights(0), monthToSeasonWeights(1));
  assert.deepEqual(monthToSeasonWeights(13), monthToSeasonWeights(12));
  assert.deepEqual(monthToSeasonWeights(Number.NaN), monthToSeasonWeights(1));
});

test('transition between adjacent months is continuous, not a snap', () => {
  for (let month = 1; month < 12; month++) {
    const a = monthToSeasonWeights(month);
    const b = monthToSeasonWeights(month + 1);
    assert.ok(Math.abs(a.warmth - b.warmth) < 0.27);
    // Autumn/spring are half-wave clamped, so their largest single step is
    // deliberately bigger than warmth's as a season fades in or out.
    assert.ok(Math.abs(a.autumn - b.autumn) < 0.55);
    assert.ok(Math.abs(a.spring - b.spring) < 0.55);
  }
});
