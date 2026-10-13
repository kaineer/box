import type { Camera } from 'three'
import type { CubeData } from '../../entities/cube/model'
import { NEIGHBOR_OPTIONS } from '../../shared/config/constants'
import { findNeighbor } from '../../shared/lib/find-neighbor'
import type { MoveKey } from '../../shared/lib/keys'
import { getNavDirection } from '../../shared/lib/nav-direction'

export const MAX_NAVIGATE_MOTION_COUNT = 100

type ExecuteNavigateMotionParams = {
  camera: Camera
  items: CubeData[]
  activeId: string
  moveKey: MoveKey
  count: number
}

/**
 * Переходит к соседу count раз в заданном направлении.
 * Останавливается, если следующего куба нет.
 */
export function executeNavigateMotion({
  camera,
  items,
  activeId,
  moveKey,
  count,
}: ExecuteNavigateMotionParams): string {
  const direction = getNavDirection(camera, moveKey)
  let nextActiveId = activeId
  const steps = Math.min(Math.max(1, count), MAX_NAVIGATE_MOTION_COUNT)

  for (let i = 0; i < steps; i += 1) {
    const neighborId = findNeighbor(
      items,
      nextActiveId,
      direction,
      NEIGHBOR_OPTIONS,
    )
    if (!neighborId) break
    nextActiveId = neighborId
  }

  return nextActiveId
}
