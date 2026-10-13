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
  selectedIds: string[]
  moveKey: MoveKey
  count: number
}

/**
 * Пытается сдвинуть все выделенные кубы.
 * Сосед из того же выделения не блокирует.
 * Кубы, которые не сдвинулись, выпадают из выделения.
 */
export function executeMoveMotion({
  camera,
  items,
  selectedIds,
  moveKey,
  count,
}: ExecuteMoveMotionParams): { items: CubeData[]; selectedIds: string[] } {
  const direction = snapCardinal(getNavDirection(camera, moveKey))
  let nextItems = items
  let nextSelectedIds = selectedIds.filter((id) =>
    nextItems.some((item) => item.id === id),
  )
  const steps = Math.min(Math.max(1, count), MAX_MOVE_MOTION_COUNT)

  for (let step = 0; step < steps; step += 1) {
    if (nextSelectedIds.length === 0) break

    const selectedSet = new Set(nextSelectedIds)
    const movers: string[] = []

    for (const selectedId of nextSelectedIds) {
      const neighborId = findNeighbor(
        nextItems,
        selectedId,
        direction,
        NEIGHBOR_OPTIONS,
      )
      if (neighborId && !selectedSet.has(neighborId)) continue
      movers.push(selectedId)
    }

    if (movers.length === 0) {
      nextSelectedIds = []
      break
    }

    const moverSet = new Set(movers)
    nextItems = nextItems.map((item) => {
      if (!moverSet.has(item.id)) return item
      return {
        ...item,
        position: adjacentPosition(item.position, direction, CUBE_STEP),
      }
    })
    nextSelectedIds = movers
  }

  return { items: nextItems, selectedIds: nextSelectedIds }
}
