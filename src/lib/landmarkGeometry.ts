/**
 * Pure geometry helpers shared by the landmark builders. Keeping these out of
 * the Three.js scene graph lets the authored proportions be unit-tested.
 */

/**
 * Height of a symmetric inverted catenary arch at horizontal position `x`.
 * `halfSpan` is the distance from the crown to a springing point, `height` the
 * crown height and `curvature` controls how sharply the legs flare outwards.
 * The 0.1 floor keeps cable anchors off the deck, matching the old parabola.
 */
export function catenaryArchHeight(
  x: number,
  halfSpan: number,
  height: number,
  curvature = 0.28
): number {
  const edge = Math.cosh(curvature * halfSpan);
  const denominator = edge - 1;
  if (denominator <= 1e-6) return height;
  const y = (height * (edge - Math.cosh(curvature * x))) / denominator;
  return Math.max(0.1, y);
}

/** One semi-fan stay: where it leaves the mast and where it meets the deck. */
export interface StayAnchor {
  topY: number;
  deckX: number;
}

/**
 * The Nelson Mandela Bridge uses 24 stays per mast (48 per pylon side in the
 * Dissing+Weitling semi-fan arrangement). Offsets are compressed so the fan
 * stays inside the authored deck and above road level.
 */
export function bridgeStayAnchors(mastX: number, topY: number): StayAnchor[] {
  const anchors: StayAnchor[] = [];
  for (let i = -12; i <= 12; i++) {
    if (i === 0) continue;
    anchors.push({
      topY: topY - 0.15 - Math.abs(i) * 0.14,
      deckX: mastX + i * 0.28,
    });
  }
  return anchors;
}
