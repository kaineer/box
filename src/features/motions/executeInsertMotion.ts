import type { Camera } from 'three'
import type { CubeData } from '../../entities/cube/model'
import { createCubeId } from '../../entities/cube/model'
import { CUBE_STEP, NEIGHBOR_OPTIONS } from '../../shared/config/constants'
import { adjacentPosition } from '../../shared/lib/adjacent-position'
import { findNeighbor } from '../../shared/lib/find-neighbor'
import type { MoveKey } from '../../shared/lib/keys'
import { getNavDirection } from '../../shared/lib/nav-direction'
import { snapCardinal } from '../../shared/lib/snap-direction'

export const MAX_INSERT_MOTION_COUNT = 100

type ExecuteInsertMotionParams = {
  camera: Camera
  items: CubeData[]
  activeId: string
  moveKey: MoveKey
  count: number
}

/** Повторяет insert-шаг count раз (переход к соседу или добавление куба). */
export function executeInsertMotion({
  camera,
  items,
  activeId,
  moveKey,
  count,
}: ExecuteInsertMotionParams): { items: CubeData[]; activeId: string } {
  const direction = snapCardinal(getNavDirection(camera, moveKey))
  let nextItems = items
  let nextActiveId = activeId
  const steps = Math.min(Math.max(1, count), MAX_INSERT_MOTION_COUNT)

  for (let i = 0; i < steps; i += 1) {
    const neighborId = findNeighbor(
      nextItems,
      nextActiveId,
      direction,
      NEIGHBOR_OPTIONS,
    )

    if (neighborId) {
      nextActiveId = neighborId
      continue
    }

    const current =
      nextItems.find((item) => item.id === nextActiveId) ?? nextItems[0]
    if (!current) break

    const position = adjacentPosition(current.position, direction, CUBE_STEP)
    const id = createCubeId()
    nextItems = [...nextItems, { id, position }]
    nextActiveId = id
  }

  return { items: nextItems, activeId: nextActiveId }
}
