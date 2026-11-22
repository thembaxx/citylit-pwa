import assert from 'node:assert/strict';
import test from 'node:test';
import {
  boundsFitPlinth,
  clamp,
  fitBoundsToPlinth,
  PLINTH_HALF_EXTENT,
  PLINTH_INNER_HALF_EXTENT,
  type PlanarBounds,
} from './fitMath.ts';

test('plinth constants stay in sync with the authored rim', () => {
  assert.equal(PLINTH_HALF_EXTENT, 8.52);
  assert.equal(PLINTH_INNER_HALF_EXTENT, 8.46);
});

test('clamp handles both bounds', () => {
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-5, 0, 3), 0);
  assert.equal(clamp(1.5, 0, 3), 1.5);
});

test('small centred footprints keep scale 1 and zero offset', () => {
  const bounds: PlanarBounds = { minX: -2, maxX: 2, minZ: -3, maxZ: 3 };
  const fit = fitBoundsToPlinth(bounds);
  assert.equal(fit.scale, 1);
  assert.equal(fit.offsetX, 0);
  assert.equal(fit.offsetZ, 0);
  assert.equal(fit.halfX, 2);
  assert.equal(fit.halfZ, 3);
  assert.equal(boundsFitPlinth(bounds), true);
});

test('oversized footprints scale down uniformly', () => {
  const bounds: PlanarBounds = { minX: -20, maxX: 20, minZ: -5, maxZ: 5 };
  const fit = fitBoundsToPlinth(bounds, 0);
  assert.ok(fit.scale < 1);
  assert.ok(fit.scale > 0);
  assert.ok(fit.halfX <= PLINTH_INNER_HALF_EXTENT + 1e-9);
  assert.ok(fit.halfZ <= PLINTH_INNER_HALF_EXTENT + 1e-9);
  assert.equal(boundsFitPlinth(bounds, 0), false);
});

test('off-centre footprints return a centring offset', () => {
  const bounds: PlanarBounds = { minX: 3, maxX: 7, minZ: -1, maxZ: 1 };
  const fit = fitBoundsToPlinth(bounds);
  assert.equal(fit.scale, 1);
  assert.equal(fit.offsetX, -5);
  assert.equal(fit.offsetZ, 0);
});

test('margin reduces the usable footprint', () => {
  const bounds: PlanarBounds = { minX: -8.4, maxX: 8.4, minZ: -1, maxZ: 1 };
  assert.equal(boundsFitPlinth(bounds, 0), true);
  assert.equal(boundsFitPlinth(bounds, 0.2), false);
});
