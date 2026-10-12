import { Vector3 } from 'three'

export type Positioned<Id extends string = string> = {
  id: Id
  position: readonly [number, number, number]
}

export type FindNeighborOptions = {
  alignmentMin?: number
  /** Максимальная дистанция до соседа (центр–центр). */
  maxDistance?: number
}

/** Ближайший объект в заданном направлении в пределах proximity. */
export function findNeighbor<Id extends string>(
  items: readonly Positioned<Id>[],
  fromId: Id,
  direction: Vector3,
  options: FindNeighborOptions = {},
): Id | null {
  const { alignmentMin = 0.45, maxDistance = Infinity } = options

  const fromItem = items.find((item) => item.id === fromId) ?? items[0]
  if (!fromItem) return null

  const from = new Vector3(...fromItem.position)
  let bestId: Id | null = null
  let bestScore = -Infinity

  for (const item of items) {
    if (item.id === fromId) continue

    const offset = new Vector3(...item.position).sub(from)
    const distance = offset.length()
    if (distance < 1e-6 || distance > maxDistance) continue

    const alignment = offset.normalize().dot(direction)
    if (alignment < alignmentMin) continue

    // Среди соседних по proximity предпочитаем более близких и лучше выровненных
    const score = alignment / distance
    if (score > bestScore) {
      bestScore = score
      bestId = item.id
    }
  }

  return bestId
}
