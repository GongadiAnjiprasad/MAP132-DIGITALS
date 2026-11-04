/** Return 1 for next, -1 for previous, or 0 when the gesture is not a horizontal swipe. */
export function getHorizontalSwipeDirection(
  dx: number,
  dy: number,
  threshold = 38,
  verticalRatio = 1.2,
): -1 | 0 | 1 {
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * verticalRatio) return 0;
  return dx < 0 ? 1 : -1;
}
