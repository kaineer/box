import type { Vector3 } from 'three'

export function adjacentPosition(
  from: readonly [number, number, number],
  direction: Vector3,
  step: number,
): [number, number, number] {
  return [
    from[0] + direction.x * step,
    from[1] + direction.y * step,
    from[2] + direction.z * step,
  ]
}
