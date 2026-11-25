import assert from 'node:assert/strict';
import test from 'node:test';
import {
  boundsFitPlinth,
  boundsFitStand,
  clamp,
  fitBoundsToPlinth,
  fitBoundsToStand,
  PLINTH_HALF_EXTENT,
  PLINTH_INNER_HALF_EXTENT,
  type PlanarBounds,
} from './fitMath.ts';
import {
  defaultStandPolygon,
  insetStandPolygon,
  STAND_INNER_HALF,
  STAND_MARGIN,
} from './standFootprint.ts';

test('plinth constants stay in sync with the authored rim', () => {
  assert.equal(PLINTH_HALF_EXTENT, 8.4);
  assert.equal(PLINTH_INNER_HALF_EXTENT, STAND_INNER_HALF);
  assert.ok(PLINTH_INNER_HALF_EXTENT < PLINTH_HALF_EXTENT);
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
  const bounds: PlanarBounds = { minX: -8.3, maxX: 8.3, minZ: -1, maxZ: 1 };
  assert.equal(boundsFitPlinth(bounds, 0), true);
  assert.equal(boundsFitPlinth(bounds, 0.2), false);
});

test('the stand fit honours a chamfered silhouette, not just a square', () => {
  const h = 8.15;
  const c = 2;
  const chamfered = [
    [-h + c, -h],
    [h - c, -h],
    [h, -h + c],
    [h, h - c],
    [h - c, h],
    [-h + c, h],
    [-h, h - c],
    [-h, -h + c],
  ] as const;
  // A square footprint that fits the square stand, but whose corner pokes
  // past the chamfered pilot silhouette.
  const square: PlanarBounds = { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
  const fit = fitBoundsToStand(square, chamfered, 0);
  assert.ok(fit.scale < 1, 'chamfered stand must shrink the footprint');
  assert.ok(fit.scale > 0);
  assert.equal(boundsFitStand(square, chamfered, 0), false);

  // The square stand keeps the same footprint.
  const squareFit = fitBoundsToStand(
    square,
    insetStandPolygon(defaultStandPolygon(8.4), STAND_MARGIN),
    0
  );
  assert.equal(squareFit.scale, 1);
});
