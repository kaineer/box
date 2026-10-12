/** Полярный угол камеры для позиции относительно начала координат. */
export function polarAngleFromPosition(
  position: readonly [number, number, number],
): number {
  const [x, y, z] = position
  return Math.acos(y / Math.hypot(x, y, z))
}
