import assert from 'node:assert/strict';
import test from 'node:test';
import { bridgeStayAnchors, catenaryArchHeight } from './landmarkGeometry.ts';

const HALF_SPAN = 5.6;
const CROWN = 7.2;

test('catenary arch is symmetric, tallest at the crown and floor-capped at the ends', () => {
  assert.equal(catenaryArchHeight(0, HALF_SPAN, CROWN), CROWN);
  assert.equal(catenaryArchHeight(HALF_SPAN, HALF_SPAN, CROWN), 0.1);
  assert.equal(catenaryArchHeight(-HALF_SPAN, HALF_SPAN, CROWN), 0.1);
  assert.equal(catenaryArchHeight(-2.8, HALF_SPAN, CROWN), catenaryArchHeight(2.8, HALF_SPAN, CROWN));
  assert.ok(catenaryArchHeight(2.8, HALF_SPAN, CROWN) < CROWN);
  assert.ok(catenaryArchHeight(4.2, HALF_SPAN, CROWN) < catenaryArchHeight(2.8, HALF_SPAN, CROWN));
});

test('catenary arch produces no NaN or negative heights across the span', () => {
  for (let x = -HALF_SPAN; x <= HALF_SPAN; x += 0.1) {
    const y = catenaryArchHeight(x, HALF_SPAN, CROWN);
    assert.ok(Number.isFinite(y) && y >= 0.1 && y <= CROWN, `bad height at x=${x}`);
  }
});

test('bridge has 24 stays per mast with no vertical cable at the mast', () => {
  const anchors = bridgeStayAnchors(-2.3, 8.9);
  assert.equal(anchors.length, 24);
  assert.ok(anchors.every((a) => a.deckX !== -2.3));
  const offsets = anchors.map((a) => Number((a.deckX + 2.3).toFixed(4))).sort((a, b) => a - b);
  assert.deepEqual(offsets.slice(0, 3), [-3.36, -3.08, -2.8]);
});

test('bridge stay anchors stay inside the deck and above road level', () => {
  for (const [mastX, topY] of [
    [-2.3, 8.9],
    [2.5, 6.5],
  ] as const) {
    for (const a of bridgeStayAnchors(mastX, topY)) {
      assert.ok(Math.abs(a.deckX) <= 7.4, `deck anchor outside deck: ${a.deckX}`);
      assert.ok(a.topY > 1.82, `mast anchor below road level: ${a.topY}`);
      assert.ok(a.topY < topY, `mast anchor above the mast cap: ${a.topY}`);
    }
  }
});
