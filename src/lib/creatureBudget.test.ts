import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CreatureBudget,
  CREATURE_TIER_CAPS,
  tierDensity,
  tierFromQualityIndex,
} from '../three/creatures/budget.ts';

test('tier mapping respects software GL as a hard floor', () => {
  assert.equal(tierFromQualityIndex(0, false), 0);
  assert.equal(tierFromQualityIndex(1, false), 1);
  assert.equal(tierFromQualityIndex(2, false), 2);
  for (const index of [0, 1, 2]) assert.equal(tierFromQualityIndex(index, true), 2);
});

test('tier density scales the High count per the brief', () => {
  assert.equal(tierDensity(40, 0), 40);
  assert.equal(tierDensity(40, 1), 16);
  assert.equal(tierDensity(40, 2), 6);
  assert.equal(tierDensity(1, 2), 0);
  assert.equal(tierDensity(Number.NaN, 0), 0);
});

test('caps match the brief and software GL reserves nothing', () => {
  assert.deepEqual(CREATURE_TIER_CAPS[0], { instances: 1500, triangles: 150_000 });
  assert.deepEqual(CREATURE_TIER_CAPS[1], { instances: 600, triangles: 60_000 });
  assert.deepEqual(CREATURE_TIER_CAPS[2], { instances: 150, triangles: 15_000 });
  const budget = new CreatureBudget(0, true);
  assert.equal(budget.reserve('gull', 'hero', 10, 100), 0);
  assert.equal(budget.stats().capInstances, 0);
});

test('reservations trim to remaining capacity and track totals', () => {
  const budget = new CreatureBudget(2);
  const granted = budget.reserve('fish', 'ambient', 1000, 40);
  // Ambient gets 45% of the remaining instance cap first.
  assert.equal(granted, 67);
  const stats = budget.stats();
  assert.equal(stats.instances, granted);
  assert.equal(stats.triangles, granted * 40);
  assert.ok(stats.utilisation > 0 && stats.utilisation <= 1);
  const second = budget.reserve('gull', 'mid', 1000, 40);
  assert.ok(second > 0);
  assert.ok(budget.stats().instances <= 150, 'instance cap must hold');
});

test('hero reservations win the remaining budget first', () => {
  const budget = new CreatureBudget(2);
  const hero = budget.reserve('whale', 'hero', 2, 4000);
  assert.equal(hero, 2);
  const ambient = budget.reserve('fish', 'ambient', 200, 40);
  assert.ok(ambient <= 150 - 2);
});

test('triangle cap binds before the instance cap for heavy species', () => {
  const budget = new CreatureBudget(1);
  const granted = budget.reserve('whale', 'hero', 30, 8000);
  assert.equal(granted, 7); // 60000 / 8000
  assert.equal(budget.stats().triangles, 56_000);
});

test('setTier changes caps without evicting existing reservations', () => {
  const budget = new CreatureBudget(0);
  budget.reserve('gemsbok', 'hero', 6, 3000);
  budget.setTier(2);
  assert.equal(budget.stats().tier, 2);
  assert.equal(budget.stats().instances, 6);
  // Six 3000-triangle animals already exceed Low's 15k triangle cap.
  assert.equal(budget.reserve('fish', 'ambient', 20, 40), 0);
  assert.equal(budget.fits(1, 100), false);
  budget.reset();
  assert.equal(budget.stats().instances, 0);
});
