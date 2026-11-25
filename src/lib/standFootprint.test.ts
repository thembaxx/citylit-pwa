import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampToStand,
  defaultStandPolygon,
  getStandOutlinePoints,
  insetStandPolygon,
  mapStandDomain,
  pointInStandPolygon,
  standContains,
  standPolygonBounds,
  standPolygonFor,
  standPolygonOverflow,
  STAND_DETAIL_HALF,
  STAND_HALF,
  STAND_INNER_HALF,
  STAND_MARGIN,
  type StandSilhouette,
} from './standFootprint.ts';

const SILHOUETTES: StandSilhouette[] = ['square', 'coastal-cut', 'terrace', 'hex-chamfer'];

test('the stand footprint is one coherent set of numbers', () => {
  assert.equal(STAND_HALF, 8.4);
  assert.equal(STAND_INNER_HALF, STAND_HALF - STAND_MARGIN);
  assert.ok(STAND_DETAIL_HALF < STAND_HALF);
  assert.ok(STAND_DETAIL_HALF > STAND_INNER_HALF - 1);
});

test('standContains and clampToStand keep points inside the shared boundary', () => {
  assert.equal(standContains(0, 0), true);
  assert.equal(standContains(STAND_HALF, 0), true);
  assert.equal(standContains(STAND_HALF + 0.01, 0), false);
  assert.equal(standContains(0, -(STAND_HALF + 0.01)), false);
  assert.equal(standContains(STAND_HALF, 0, 0.5), false);

  const [x, z] = clampToStand(STAND_HALF + 3, -STAND_HALF - 3);
  assert.ok(Math.abs(x) <= STAND_HALF);
  assert.ok(Math.abs(z) <= STAND_HALF);
  assert.equal(x, STAND_HALF - STAND_MARGIN);
  assert.equal(z, -(STAND_HALF - STAND_MARGIN));
});

test('every silhouette fills the same envelope and only trims its corners', () => {
  for (const sil of SILHOUETTES) {
    const pts = getStandOutlinePoints(sil, STAND_DETAIL_HALF, 16);
    assert.ok(pts.length >= 56);
    let maxX = -Infinity;
    let maxZ = -Infinity;
    for (const [x, z] of pts) {
      assert.ok(Number.isFinite(x) && Number.isFinite(z));
      maxX = Math.max(maxX, Math.abs(x));
      maxZ = Math.max(maxZ, Math.abs(z));
    }
    // The edge midpoints reach the half-extent, so a silhouette and the square
    // stand share one boundary. The terrace's organic trim may bulge a little
    // further, but never past the shared outer boundary.
    assert.ok(Math.abs(maxX - STAND_DETAIL_HALF) < 0.06, `${sil} maxX ${maxX}`);
    assert.ok(Math.abs(maxZ - STAND_DETAIL_HALF) < 0.06, `${sil} maxZ ${maxZ}`);
    assert.ok(maxX <= STAND_HALF + 1e-9);
    assert.ok(maxZ <= STAND_HALF + 1e-9);
  }
});

test('the square silhouette is the plain domain, the others trim their corners', () => {
  const [sx, sz] = mapStandDomain(1, 1, 'square', STAND_DETAIL_HALF);
  assert.equal(sx, STAND_DETAIL_HALF);
  assert.equal(sz, STAND_DETAIL_HALF);

  const [hx, hz] = mapStandDomain(1, 1, 'hex-chamfer', STAND_DETAIL_HALF);
  const [tx, tz] = mapStandDomain(1, 1, 'terrace', STAND_DETAIL_HALF);
  const [cx, cz] = mapStandDomain(1, 1, 'coastal-cut', STAND_DETAIL_HALF);
  assert.ok(hx < sx && hz < sz);
  assert.ok(tx < sx && tz < sz);
  assert.ok(cx < sx && cz < sz);
  assert.notEqual(hx, cx);
  // The edge midpoint is never trimmed, only the corner.
  for (const sil of SILHOUETTES) {
    const [mx, mz] = mapStandDomain(0, 1, sil, STAND_DETAIL_HALF);
    assert.ok(Math.abs(mz - STAND_DETAIL_HALF) < 1e-9, `${sil} edge midpoint`);
    assert.ok(Math.abs(mx) < 0.06, `${sil} edge midpoint x ${mx}`);
  }
});

test('standPolygonOverflow is negative inside and measures the spill outside', () => {
  const poly = defaultStandPolygon(STAND_HALF);
  assert.ok(standPolygonOverflow(0, 0, poly) < 0);
  assert.ok(standPolygonOverflow(STAND_HALF - 0.1, 0, poly) < 0);
  const spill = standPolygonOverflow(STAND_HALF + 0.25, 0, poly);
  assert.ok(Math.abs(spill - 0.25) < 1e-9);
  assert.equal(pointInStandPolygon(STAND_HALF + 0.01, 0, poly), false);
  assert.equal(pointInStandPolygon(0, 0, poly), true);
});

test('an inset polygon keeps content clear of the stand edge', () => {
  const poly = defaultStandPolygon(STAND_HALF);
  const inset = insetStandPolygon(poly, STAND_MARGIN);
  const bounds = standPolygonBounds(inset);
  assert.ok(Math.abs(bounds.maxX - STAND_INNER_HALF) < 1e-9);
  assert.ok(Math.abs(bounds.minX + STAND_INNER_HALF) < 1e-9);
  assert.ok(Math.abs(bounds.maxZ - STAND_INNER_HALF) < 1e-9);
  // The inset polygon never reaches the outer boundary.
  assert.ok(bounds.maxX < STAND_HALF);
});

test('a chamfered pilot silhouette cuts its corners out of the square footprint', () => {
  const poly = standPolygonFor('hex-chamfer', STAND_DETAIL_HALF);
  // The corner of the square envelope is outside the pilot footprint.
  assert.equal(pointInStandPolygon(STAND_DETAIL_HALF, STAND_DETAIL_HALF, poly), false);
  // The edge midpoint is inside it.
  assert.equal(pointInStandPolygon(0, STAND_DETAIL_HALF, poly), true);
});
