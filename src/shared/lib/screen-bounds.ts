import type { Camera } from 'three'
import { Vector3 } from 'three'

export type ScreenRect = {
  left: number
  top: number
  right: number
  bottom: number
}

const corner = new Vector3()

/** Экранный AABB куба (по проекции 8 углов). */
export function cubeScreenBounds(
  position: readonly [number, number, number],
  size: number,
  camera: Camera,
  width: number,
  height: number,
): ScreenRect {
  const half = size / 2
  const [px, py, pz] = position
  const offsets: [number, number, number][] = [
    [-half, -half, -half],
    [-half, -half, half],
    [-half, half, -half],
    [-half, half, half],
    [half, -half, -half],
    [half, -half, half],
    [half, half, -half],
    [half, half, half],
  ]

  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (const [ox, oy, oz] of offsets) {
    corner.set(px + ox, py + oy, pz + oz).project(camera)
    const x = (corner.x * 0.5 + 0.5) * width
    const y = (-corner.y * 0.5 + 0.5) * height
    left = Math.min(left, x)
    right = Math.max(right, x)
    top = Math.min(top, y)
    bottom = Math.max(bottom, y)
  }

  return { left, top, right, bottom }
}

export function normalizeScreenRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): ScreenRect {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
  }
}

export function screenRectsIntersect(a: ScreenRect, b: ScreenRect): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  )
}
