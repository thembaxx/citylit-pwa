import assert from 'node:assert/strict';
import test from 'node:test';
import { boundsFitPlinth, PLINTH_INNER_HALF_EXTENT } from './fitMath.ts';
import {
  bouldersGroundHeight,
  formatDmsCoords,
  getPilotGroundHeightFn,
  getPlinthOutlinePoints,
  krugerGroundHeight,
  mapDomainToPlinth,
  orlandoGroundHeight,
  PILOT_PLINTH_SPECS,
  type PlinthSilhouette,
} from './plinthProfiles.ts';

test('formatDmsCoords renders crisp South African DMS strings', () => {
  assert.equal(formatDmsCoords(-34.2, 18.45), '34°12′S · 18°27′E');
  assert.equal(formatDmsCoords(-24, 31.5), '24°00′S · 31°30′E');
  assert.equal(formatDmsCoords(-26.27, 27.93), '26°16′S · 27°56′E');
});

test('all pilot plinth silhouettes remain strictly inside PLINTH_INNER_HALF_EXTENT', () => {
  const silhouettes: PlinthSilhouette[] = ['square', 'coastal-cut', 'terrace', 'hex-chamfer'];
  for (const sil of silhouettes) {
    const pts = getPlinthOutlinePoints(sil, 7.72, 16);
    assert.ok(pts.length >= 56);
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const [x, z] of pts) {
      assert.ok(Number.isFinite(x) && Number.isFinite(z));
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    assert.ok(maxX <= PLINTH_INNER_HALF_EXTENT - 0.3);
    assert.ok(maxZ <= PLINTH_INNER_HALF_EXTENT - 0.3);
    assert.equal(boundsFitPlinth({ minX, maxX, minZ, maxZ }), true);
  }
});

test('mapDomainToPlinth preserves continuous corners and varies per silhouette', () => {
  const [sqX, sqZ] = mapDomainToPlinth(1, 1, 'square', 7.72);
  const [hxX, hxZ] = mapDomainToPlinth(1, 1, 'hex-chamfer', 7.72);
  const [csX, csZ] = mapDomainToPlinth(1, 1, 'coastal-cut', 7.72);
  assert.ok(hxX < sqX && hxZ < sqZ);
  assert.ok(csX < sqX && csZ < sqZ);
  assert.notEqual(hxX, csX);
});

test('pilot ground heightfields are deterministic and match relief landmarks', () => {
  // Boulders: cove drops under water level (0.14) on front-right; back bluff rises
  assert.equal(bouldersGroundHeight(1.2, -1.0), bouldersGroundHeight(1.2, -1.0));
  assert.ok(bouldersGroundHeight(5.2, 5.0) < -0.25);
  assert.ok(bouldersGroundHeight(-4.5, -5.8) > 0.35);

  // Kruger: waterhole basin dips below water plane ~0.15; acacia ridge rises
  assert.equal(krugerGroundHeight(3.35, 2.65), krugerGroundHeight(3.35, 2.65));
  assert.ok(krugerGroundHeight(3.35, 2.65) < 0.1);
  assert.ok(krugerGroundHeight(-1.0, -5.8) > 0.25);

  // Orlando: cooling basins, ring road & pitch are graded near 0.20; outer berm rises
  assert.ok(Math.abs(orlandoGroundHeight(-2.4, 0) - 0.2) < 0.025);
  assert.ok(Math.abs(orlandoGroundHeight(0, 3.5) - 0.2) < 0.025);
  assert.ok(orlandoGroundHeight(0, -6.5) > 0.28);
});

test('all three pilot plinth specs resolve ground height functions', () => {
  for (const key of Object.keys(PILOT_PLINTH_SPECS)) {
    assert.ok(typeof getPilotGroundHeightFn(key) === 'function', `${key} missing heightFn`);
  }
});
