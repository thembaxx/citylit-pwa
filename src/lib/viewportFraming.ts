/**
 * Viewport framing maths.
 *
 * The WebGL canvas always fills the window, but the HUD floats on top of it:
 * a landmark card along the bottom, drawers sliding in from the right, a
 * compass on the left. The diorama should still be *composed* inside the
 * free (unoccluded) part of the viewport instead of hiding behind a panel.
 *
 * The maths lives here — pure, DOM-free and unit tested — so the 3D engine
 * only has to apply the result. Two ideas are modelled:
 *
 *  1. **Free rect** – the part of the viewport no HUD surface covers.
 *  2. **Lens shift** – an off-axis projection offset, expressed in CSS
 *     pixels, that slides the rendered image inside the viewport without
 *     rotating the camera or changing the field of view.
 *
 * A positive X offset moves the rendered content to the left, a positive Y
 * offset moves it up. Both are in CSS pixels of the full viewport.
 */

/** HUD coverage, in CSS pixels, measured from each edge of the viewport. */
export interface UiInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** A rectangle in CSS pixels, relative to the viewport's top-left corner. */
export interface ViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** No HUD coverage at all. */
export const EMPTY_INSETS: UiInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Never shift more than this share of the viewport; beyond it the framing
 * stops reading as a composition and starts reading as a bug.
 */
export const MAX_SHIFT_RATIO = 0.3;

/** Clamps a raw pixel shift to the allowed share of the viewport axis. */
export function clampShift(shift: number, viewportSize: number): number {
  if (viewportSize <= 0) return 0;
  const limit = viewportSize * MAX_SHIFT_RATIO;
  return Math.max(-limit, Math.min(limit, shift));
}

/** Merges two inset sets, keeping the widest coverage per edge. */
export function mergeInsets(a: UiInsets, b: UiInsets): UiInsets {
  return {
    top: Math.max(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
    left: Math.max(a.left, b.left),
  };
}

/**
 * The part of the viewport that is not covered by any HUD surface.
 *
 * The result is always at least 1x1 CSS pixels so downstream maths never
 * divides by zero on a fully covered viewport.
 */
export function freeRect(
  insets: UiInsets,
  viewportWidth: number,
  viewportHeight: number
): ViewportRect {
  const left = Math.min(Math.max(0, insets.left), Math.max(0, viewportWidth - 1));
  const right = Math.min(Math.max(0, insets.right), Math.max(0, viewportWidth - 1));
  const top = Math.min(Math.max(0, insets.top), Math.max(0, viewportHeight - 1));
  const bottom = Math.min(Math.max(0, insets.bottom), Math.max(0, viewportHeight - 1));
  const width = Math.max(1, viewportWidth - left - right);
  const height = Math.max(1, viewportHeight - top - bottom);
  return { x: left, y: top, width, height };
}

/**
 * The lens shift that re-centres the subject in the free area.
 *
 * The subject currently sits at the viewport's centre; the free area's centre
 * is offset from it by half the difference between the two covered edges.
 * Positive values slide the rendered content left / up, i.e. towards a panel
 * on the right / bottom.
 */
export function safeAreaOffsetX(insets: UiInsets, viewportWidth: number): number {
  if (viewportWidth <= 0) return 0;
  return clampShift((insets.right - insets.left) / 2, viewportWidth);
}

/**
 * The vertical lens shift that lifts the subject above a bottom panel.
 * Positive when the panel is at the bottom (content moves up), negative for
 * a top bar.
 */
export function safeAreaOffsetY(insets: UiInsets, viewportHeight: number): number {
  if (viewportHeight <= 0) return 0;
  return clampShift((insets.bottom - insets.top) / 2, viewportHeight);
}

/** A complete framing decision for one viewport + HUD coverage. */
export interface FramingPlan {
  /** Lens shift in CSS pixels; positive X moves the content left. */
  shiftX: number;
  /** Lens shift in CSS pixels; positive Y moves the content up. */
  shiftY: number;
  /** The unoccluded rectangle the subject is composed inside. */
  free: ViewportRect;
}

/**
 * Composes the whole framing decision for a viewport and its HUD coverage.
 *
 * The shift is derived from the *difference* between opposite edges so a
 * symmetric inset (a panel on both sides) recentres without moving the
 * subject at all.
 */
export function planFraming(
  insets: UiInsets,
  viewportWidth: number,
  viewportHeight: number
): FramingPlan {
  return {
    shiftX: safeAreaOffsetX(insets, viewportWidth),
    shiftY: safeAreaOffsetY(insets, viewportHeight),
    free: freeRect(insets, viewportWidth, viewportHeight),
  };
}

/**
 * Layout families the stage frames for. Each family has its own composition
 * target, so the engine branches on this instead of re-deriving thresholds.
 *
 * `square` covers the near-square viewports of unfolded foldables and small
 * tablet windows, where the bottom-left card would otherwise sit on top of
 * the diorama.
 */
export type LayoutMode = 'portrait' | 'square' | 'short-landscape' | 'standard';

/** Aspect ratio below which the viewport is treated as a portrait phone. */
export const PORTRAIT_ASPECT = 0.85;

/** Aspect ratio above which a viewport is wider than it is tall. */
export const WIDE_ASPECT = 1.35;

/** Viewports shorter than this are treated as short landscape. */
export const SHORT_VIEWPORT_PX = 520;

/** Aspect band that reads as square: unfolded foldables and small tablets. */
export const SQUARE_ASPECT_MIN = 0.85;
export const SQUARE_ASPECT_MAX = 1.25;

/** Single source of truth for which framing family a viewport belongs to. */
export function layoutModeFor(width: number, height: number): LayoutMode {
  // A degenerate viewport has no shape to reason about; fall back to the
  // conservative portrait framing instead of guessing.
  if (width <= 0 || height <= 0) return 'portrait';
  const aspect = width / height;
  if (aspect < PORTRAIT_ASPECT) return 'portrait';
  if (height < SHORT_VIEWPORT_PX && aspect > WIDE_ASPECT) return 'short-landscape';
  if (aspect >= SQUARE_ASPECT_MIN && aspect <= SQUARE_ASPECT_MAX) return 'square';
  return 'standard';
}

/** Tight viewports that get the compact fit margin (short or very narrow). */
export function isCompactViewport(width: number, height: number): boolean {
  return height < 680 || width / Math.max(1, height) < 0.72;
}

/**
 * How much further the camera has to back off so a subject that is
 * `subjectRadiusPx` CSS pixels in radius still fits inside the free area.
 *
 * Returns 1 when the subject already fits. When it does not, the shortfall is
 * damped by half (the panel only needs to be mostly clear, not exactly
 * clear) and capped so a nearly covered viewport cannot shrink the diorama
 * to a speck.
 */
export function freeFitFactor(
  subjectRadiusPx: number,
  free: ViewportRect,
  maxFactor = 1.35
): number {
  if (!(subjectRadiusPx > 0)) return 1;
  const limit = Math.min(free.width, free.height) / 2;
  if (!(limit > 0)) return 1;
  const raw = subjectRadiusPx / limit;
  if (raw <= 1) return 1;
  return Math.min(maxFactor, 1 + (raw - 1) * 0.5);
}

/**
 * LOD bias for short viewports. Objects occupy fewer pixels when the window is
 * short, so the switch to coarser LODs can happen sooner. Never below 1, so
 * tall viewports keep the tuned quality.
 */
export function lodShortViewportBias(viewportHeight: number): number {
  return Math.min(1.3, Math.max(1, Math.sqrt(800 / Math.max(1, viewportHeight))));
}

/**
 * Lowest auto-quality render scale. Low-DPR screens already render close to
 * one device pixel per CSS pixel, so cutting them further is visible; they
 * keep a higher floor.
 */
export function renderScaleFloor(devicePixelRatio: number): number {
  return devicePixelRatio <= 1.5 ? 0.85 : 0.75;
}

/**
 * Hit radius, in CSS pixels, for the touch fallback in picking. Scales with
 * the canvas so large touch screens do not get tiny targets.
 */
export function touchPickRadius(canvasWidth: number, canvasHeight: number): number {
  const minSide = Math.min(canvasWidth, canvasHeight);
  return Math.min(44, Math.max(28, minSide * 0.05));
}

/**
 * `PerspectiveCamera.setViewOffset(fullW, fullH, x, y, w, h)` arguments that
 * produce a screen-space lens shift of `(shiftX, shiftY)` CSS pixels inside a
 * `viewportWidth × viewportHeight` canvas without changing the field of view.
 *
 * Positive `shiftX` slides the rendered content to the left, positive `shiftY`
 * slides it up — the same convention used by `safeAreaOffsetX` / `safeAreaOffsetY`
 * so the engine can pipe the framing plan straight through.
 *
 * Internally this is the canonical off-axis ("lens shift") form: the virtual
 * frame is exactly the canvas size, so the frustum keeps its magnification
 * and its field of view and only its principal point moves. The rendered
 * image is therefore translated one-to-one with the requested pixel shift
 * (nothing is squeezed or resampled).
 *
 * Verified against `THREE.PerspectiveCamera` — with `fullWidth = viewportWidth`
 * and `width = viewportWidth` the mapping is exactly
 * `offsetX → content moves left by offsetX px` and
 * `offsetY → content moves up by offsetY px`. Because the projection matrix
 * carries the offset, `Raycaster` picking and `unproject` stay exact.
 *
 * Returns `null` when there is no shift to apply so callers can call
 * `camera.clearViewOffset()` instead of recreating an identical frustum.
 */
export interface ViewOffsetArgs {
  fullWidth: number;
  fullHeight: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export function viewOffsetForShift(
  shiftX: number,
  shiftY: number,
  viewportWidth: number,
  viewportHeight: number
): ViewOffsetArgs | null {
  if (viewportWidth <= 0 || viewportHeight <= 0) return null;
  // Sub-pixel shifts are invisible, so they are rounded to whole CSS pixels.
  const sx = Math.round(shiftX);
  const sy = Math.round(shiftY);
  if (sx === 0 && sy === 0) return null;
  return {
    // The virtual frame matches the canvas exactly, so the frustum keeps its
    // size and field of view and only its principal point moves.
    fullWidth: viewportWidth,
    fullHeight: viewportHeight,
    offsetX: sx,
    offsetY: sy,
    width: viewportWidth,
    height: viewportHeight,
  };
}
