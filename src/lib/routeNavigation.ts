/** Return the adjacent stop, wrapping at either end; off-route starts at the nearest route edge. */
export function adjacentRouteStop(
  stopIndices: readonly number[],
  currentIndex: number,
  direction: 1 | -1 = 1
): number | null {
  if (stopIndices.length === 0) return null;
  const currentPosition = stopIndices.indexOf(currentIndex);
  const position = currentPosition < 0 ? (direction > 0 ? -1 : 0) : currentPosition;
  return stopIndices[(position + direction + stopIndices.length) % stopIndices.length];
}
