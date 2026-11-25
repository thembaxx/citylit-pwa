import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampShift,
  EMPTY_INSETS,
  freeFitFactor,
  freeRect,
  isCompactViewport,
  layoutModeFor,
  lodShortViewportBias,
  mergeInsets,
  planFraming,
  renderScaleFloor,
  safeAreaOffsetX,
  safeAreaOffsetY,
  touchPickRadius,
  viewOffsetForShift,
} from './viewportFraming.ts';

const VIEWPORT_W = 1200;
const VIEWPORT_H = 800;

test('empty insets leave the whole viewport free', () => {
  const rect = freeRect(EMPTY_INSETS, VIEWPORT_W, VIEWPORT_H);
  assert.deepEqual(rect, { x: 0, y: 0, width: VIEWPORT_W, height: VIEWPORT_H });
});

test('free rect subtracts each covered edge', () => {
  const rect = freeRect({ top: 60, right: 400, bottom: 220, left: 0 }, VIEWPORT_W, VIEWPORT_H);
  assert.equal(rect.x, 0);
  assert.equal(rect.y, 60);
  assert.equal(rect.width, VIEWPORT_W - 400);
  assert.equal(rect.height, VIEWPORT_H - 60 - 220);
});

test('free rect never collapses below a single pixel', () => {
  const rect = freeRect({ top: 900, right: 900, bottom: 900, left: 900 }, 400, 400);
  assert.ok(rect.width >= 1);
  assert.ok(rect.height >= 1);
});

test('free rect ignores insets larger than the viewport', () => {
  const rect = freeRect({ top: 0, right: 5000, bottom: 5000, left: 0 }, 400, 400);
  assert.equal(rect.width, 1);
  assert.equal(rect.height, 1);
});

test('merge keeps the widest coverage per edge', () => {
  const merged = mergeInsets(
    { top: 10, right: 20, bottom: 30, left: 40 },
    { top: 50, right: 5, bottom: 25, left: 45 }
  );
  assert.deepEqual(merged, { top: 50, right: 20, bottom: 30, left: 45 });
});

test('a right panel slides the content to the left', () => {
  const offset = safeAreaOffsetX({ ...EMPTY_INSETS, right: 400 }, VIEWPORT_W);
  assert.equal(offset, 200);
});

test('a left panel slides the content to the right', () => {
  const offset = safeAreaOffsetX({ ...EMPTY_INSETS, left: 400 }, VIEWPORT_W);
  assert.equal(offset, -200);
});

test('symmetric side panels recentre without moving the subject', () => {
  const offset = safeAreaOffsetX({ ...EMPTY_INSETS, left: 400, right: 400 }, VIEWPORT_W);
  assert.equal(offset, 0);
});

test('a bottom panel lifts the content up', () => {
  const offset = safeAreaOffsetY({ ...EMPTY_INSETS, bottom: 300 }, VIEWPORT_H);
  assert.equal(offset, 150);
});

test('a top bar pushes the content down', () => {
  const offset = safeAreaOffsetY({ ...EMPTY_INSETS, top: 300 }, VIEWPORT_H);
  assert.equal(offset, -150);
});

test('shifts are clamped to a third of the viewport axis', () => {
  const huge = safeAreaOffsetX({ ...EMPTY_INSETS, right: 4000 }, 1000);
  assert.equal(huge, 300);
  const hugeY = safeAreaOffsetY({ ...EMPTY_INSETS, bottom: 4000 }, 1000);
  assert.equal(hugeY, 300);
});

test('a zero-sized viewport never shifts', () => {
  assert.equal(safeAreaOffsetX({ ...EMPTY_INSETS, right: 200 }, 0), 0);
  assert.equal(safeAreaOffsetY({ ...EMPTY_INSETS, bottom: 200 }, 0), 0);
  assert.equal(clampShift(100, 0), 0);
});

test('clampShift limits both directions', () => {
  assert.equal(clampShift(500, 1000), 300);
  assert.equal(clampShift(-500, 1000), -300);
  assert.equal(clampShift(120, 1000), 120);
});

test('planFraming combines shift and free rect', () => {
  const plan = planFraming({ top: 0, right: 400, bottom: 220, left: 0 }, VIEWPORT_W, VIEWPORT_H);
  assert.equal(plan.shiftX, 200);
  assert.equal(plan.shiftY, 110);
  assert.equal(plan.free.width, 800);
  assert.equal(plan.free.height, 580);
});

test('planFraming on a bare viewport does not move anything', () => {
  const plan = planFraming(EMPTY_INSETS, VIEWPORT_W, VIEWPORT_H);
  assert.equal(plan.shiftX, 0);
  assert.equal(plan.shiftY, 0);
});

test('layout mode picks the framing family from viewport shape', () => {
  assert.equal(layoutModeFor(390, 844), 'portrait');
  assert.equal(layoutModeFor(844, 390), 'short-landscape');
  assert.equal(layoutModeFor(1280, 800), 'standard');
  assert.equal(layoutModeFor(900, 0), 'portrait');
});

test('layout mode recognises near-square foldable viewports', () => {
  // Unfolded foldable / small square window.
  assert.equal(layoutModeFor(900, 900), 'square');
  assert.equal(layoutModeFor(840, 900), 'square');
  assert.equal(layoutModeFor(1100, 1000), 'square');
  // Just outside the square band.
  assert.equal(layoutModeFor(1300, 1000), 'standard');
  assert.equal(layoutModeFor(800, 1000), 'portrait');
  // A short, wide viewport stays short-landscape even though it is square-ish.
  assert.equal(layoutModeFor(500, 300), 'short-landscape');
});

test('compact viewport flags short or narrow screens only', () => {
  assert.equal(isCompactViewport(1280, 800), false);
  assert.equal(isCompactViewport(1280, 600), true);
  assert.equal(isCompactViewport(500, 900), true);
});

test('free-fit factor keeps a subject that already fits untouched', () => {
  const free = freeRect(EMPTY_INSETS, VIEWPORT_W, VIEWPORT_H);
  assert.equal(freeFitFactor(120, free), 1);
  assert.equal(freeFitFactor(0, free), 1);
  // Exactly touching the limit still fits.
  assert.equal(freeFitFactor(Math.min(free.width, free.height) / 2, free), 1);
});

test('free-fit factor backs the camera off when a panel squeezes the subject', () => {
  const free = freeRect({ ...EMPTY_INSETS, right: 600 }, VIEWPORT_W, VIEWPORT_H);
  // Free area is 600x800, so the subject radius must stay below 300 px.
  const factor = freeFitFactor(420, free);
  assert.ok(factor > 1 && factor <= 1.35, `factor ${factor}`);
  // Half the shortfall, damped.
  assert.ok(Math.abs(factor - 1.2) < 1e-9, `factor ${factor}`);
});

test('LOD bias never drops below 1 and grows on short viewports', () => {
  assert.equal(lodShortViewportBias(1080), 1);
  assert.ok(lodShortViewportBias(300) > 1);
  assert.ok(lodShortViewportBias(1) <= 1.3);
});

test('render scale floor is higher on low-DPR screens', () => {
  assert.equal(renderScaleFloor(1), 0.85);
  assert.equal(renderScaleFloor(3), 0.75);
});

test('touch pick radius stays within 28-44 CSS px', () => {
  assert.equal(touchPickRadius(390, 844), 28);
  assert.equal(touchPickRadius(1280, 800), 40);
  assert.equal(touchPickRadius(4000, 3000), 44);
});

test('viewOffsetForShift maps a screen shift one-to-one into setViewOffset space', () => {
  // Verified against THREE.PerspectiveCamera: with `fullWidth = viewportWidth`
  // and `width = viewportWidth` the virtual frame matches the canvas, so the
  // frustum keeps its magnification and field of view and the offset only
  // translates the rendered image — one CSS pixel in, one CSS pixel out.
  const args = viewOffsetForShift(200, 0, 1000, 800)!;
  assert.deepEqual(args, {
    fullWidth: 1000,
    fullHeight: 800,
    offsetX: 200,
    offsetY: 0,
    width: 1000,
    height: 800,
  });

  assert.equal(viewOffsetForShift(0, 0, 1000, 800), null);
  assert.equal(viewOffsetForShift(0, 0, 0, 0), null);
});

test('viewOffsetForShift flips both axes correctly', () => {
  // Positive shiftY lifts content.
  const up = viewOffsetForShift(0, 150, 1000, 800)!;
  assert.equal(up.offsetY, 150);
  // Negative shiftX slides content right; the offset follows.
  const right = viewOffsetForShift(-120, 0, 1000, 800)!;
  assert.equal(right.offsetX, -120);
  // Both axes at once stay independent.
  const both = viewOffsetForShift(-30, 40, 1000, 800)!;
  assert.equal(both.offsetX, -30);
  assert.equal(both.offsetY, 40);
});

test('viewOffsetForShift quantises to whole CSS pixels', () => {
  // Sub-pixel shifts are invisible and would only cost a projection rebuild.
  assert.equal(viewOffsetForShift(0.4, 0.4, 1000, 800), null);
  const args = viewOffsetForShift(3.2, 2.6, 1000, 800)!;
  assert.equal(args.offsetX, 3);
  assert.equal(args.offsetY, 3);
});
