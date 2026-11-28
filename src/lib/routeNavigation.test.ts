import assert from 'node:assert/strict';
import test from 'node:test';
import { adjacentRouteStop } from './routeNavigation.ts';

test('curated route navigation advances, reverses and wraps at both ends', () => {
  const stops = [3, 8, 12];
  assert.equal(adjacentRouteStop(stops, 3), 8);
  assert.equal(adjacentRouteStop(stops, 12), 3);
  assert.equal(adjacentRouteStop(stops, 8, -1), 3);
  assert.equal(adjacentRouteStop(stops, 3, -1), 12);
});

test('off-route navigation enters at the nearest route edge and empty routes stay empty', () => {
  const stops = [3, 8, 12];
  assert.equal(adjacentRouteStop(stops, 99), 3);
  assert.equal(adjacentRouteStop(stops, 99, -1), 12);
  assert.equal(adjacentRouteStop([], 99), null);
});
