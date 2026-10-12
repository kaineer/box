import { Vector3 } from 'three'
import type { Positioned } from './find-neighbor'

/** Ближайший объект к заданной точке (по позиции центра). */
export function findClosest<Id extends string>(
  items: readonly Positioned<Id>[],
  point: readonly [number, number, number],
  excludeId?: Id,
): Id | null {
  const origin = new Vector3(...point)
  let bestId: Id | null = null
  let bestDistance = Infinity

  for (const item of items) {
    if (excludeId !== undefined && item.id === excludeId) continue

    const distance = origin.distanceTo(new Vector3(...item.position))
    if (distance < bestDistance) {
      bestDistance = distance
      bestId = item.id
    }
  }

  return bestId
}
