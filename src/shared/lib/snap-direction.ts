import { Vector3 } from 'three'

/** К ближайшей оси (±X, ±Y или ±Z). */
export function snapCardinal(direction: Vector3): Vector3 {
  const ax = Math.abs(direction.x)
  const ay = Math.abs(direction.y)
  const az = Math.abs(direction.z)

  if (ay >= ax && ay >= az) {
    return new Vector3(0, Math.sign(direction.y) || 1, 0)
  }
  if (ax >= az) {
    return new Vector3(Math.sign(direction.x) || 1, 0, 0)
  }
  return new Vector3(0, 0, Math.sign(direction.z) || 1)
}
