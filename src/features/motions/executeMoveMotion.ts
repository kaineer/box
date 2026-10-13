import type { Camera } from 'three'
import type { CubeData } from '../../entities/cube/model'
import { CUBE_STEP, NEIGHBOR_OPTIONS } from '../../shared/config/constants'
import { adjacentPosition } from '../../shared/lib/adjacent-position'
import { findNeighbor } from '../../shared/lib/find-neighbor'
import type { MoveKey } from '../../shared/lib/keys'
import { getNavDirection } from '../../shared/lib/nav-direction'
import { snapCardinal } from '../../shared/lib/snap-direction'

export const MAX_MOVE_MOTION_COUNT = 100

type ExecuteMoveMotionParams = {
  camera: Camera
  items: CubeData[]
  activeId: string
  moveKey: MoveKey
  count: number
}

/**
 * Двигает активный куб в направлении, если там нет соседа.
 * Останавливается при блокировке.
 */
export function executeMoveMotion({
  camera,
  items,
  activeId,
  moveKey,
  count,
}: ExecuteMoveMotionParams): { items: CubeData[]; activeId: string } {
  const direction = snapCardinal(getNavDirection(camera, moveKey))
  let nextItems = items
  const steps = Math.min(Math.max(1, count), MAX_MOVE_MOTION_COUNT)

  for (let i = 0; i < steps; i += 1) {
    const neighborId = findNeighbor(
      nextItems,
      activeId,
      direction,
      NEIGHBOR_OPTIONS,
    )
    if (neighborId) break

    const current = nextItems.find((item) => item.id === activeId)
    if (!current) break

    const position = adjacentPosition(current.position, direction, CUBE_STEP)
    nextItems = nextItems.map((item) =>
      item.id === activeId ? { ...item, position } : item,
    )
  }

  return { items: nextItems, activeId }
}
