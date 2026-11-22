import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSeasonMonth,
  isSpeciesBlooming,
  monthToSeasonWeights,
  normalizeMonth,
  PLANT_SPECIES,
  setSeasonMonth,
} from './season.ts';

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

test('plant species vocabulary has labels, foliage colours and bloom windows', () => {
  const species = Object.keys(PLANT_SPECIES);
  assert.deepEqual(species, ['bush', 'oak', 'acacia', 'quiver', 'jacaranda']);
  for (const key of species) {
    const info = PLANT_SPECIES[key as keyof typeof PLANT_SPECIES];
    assert.ok(info.label.length > 0);
    assert.match(info.foliageColor, /^#[0-9a-f]{6}$/i);
    for (const month of info.bloomMonths) {
      assert.ok(month >= 1 && month <= 12);
    }
  }
});

test('normalizeMonth wraps into 1-12 in both directions', () => {
  assert.equal(normalizeMonth(1), 1);
  assert.equal(normalizeMonth(12), 12);
  assert.equal(normalizeMonth(13), 1);
  assert.equal(normalizeMonth(0), 12);
  assert.equal(normalizeMonth(-1), 11);
  assert.equal(normalizeMonth(Number.NaN), 1);
});

test('jacaranda blooms only in October and November', () => {
  assert.equal(isSpeciesBlooming(10, 'jacaranda'), true);
  assert.equal(isSpeciesBlooming(11, 'jacaranda'), true);
  for (const month of [1, 4, 7, 9, 12]) {
    assert.equal(isSpeciesBlooming(month, 'jacaranda'), false, `month ${month}`);
  }
  // No gate evaluation yet (or an invalid month) keeps the reference look.
  assert.equal(isSpeciesBlooming(undefined, 'jacaranda'), true);
  assert.equal(isSpeciesBlooming(Number.NaN, 'jacaranda'), true);
});

test('species without a bloom window never flower, even in spring', () => {
  for (const species of ['bush', 'oak', 'acacia', 'quiver'] as const) {
    assert.equal(isSpeciesBlooming(10, species), false, species);
  }
});

test('published season month drives the foliage gate', () => {
  assert.equal(getSeasonMonth(), undefined);
  setSeasonMonth(11);
  assert.equal(getSeasonMonth(), 11);
  assert.equal(isSpeciesBlooming(getSeasonMonth(), 'jacaranda'), true);
  setSeasonMonth(6);
  assert.equal(isSpeciesBlooming(getSeasonMonth(), 'jacaranda'), false);
  setSeasonMonth(Number.NaN);
  assert.equal(getSeasonMonth(), undefined);
});
