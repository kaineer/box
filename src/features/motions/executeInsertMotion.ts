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
  selectedIds: string[]
  moveKey: MoveKey
  count: number
}

/**
 * Для каждого выделенного куба:
 * - свободно → добавить куб напротив (он войдёт в новое выделение);
 * - занято → выделить соседа, текущий куб теряет выделение.
 */
export function executeInsertMotion({
  camera,
  items,
  selectedIds,
  moveKey,
  count,
}: ExecuteInsertMotionParams): { items: CubeData[]; selectedIds: string[] } {
  const direction = snapCardinal(getNavDirection(camera, moveKey))
  let nextItems = items
  let nextSelectedIds = selectedIds.filter((id) =>
    nextItems.some((item) => item.id === id),
  )
  const steps = Math.min(Math.max(1, count), MAX_INSERT_MOTION_COUNT)

  for (let step = 0; step < steps; step += 1) {
    if (nextSelectedIds.length === 0) break

    const resultingIds: string[] = []
    const claimedPositions = new Set<string>()

    const positionKey = (position: readonly [number, number, number]) =>
      `${position[0]},${position[1]},${position[2]}`

    for (const selectedId of nextSelectedIds) {
      const neighborId = findNeighbor(
        nextItems,
        selectedId,
        direction,
        NEIGHBOR_OPTIONS,
      )

      if (neighborId) {
        if (!resultingIds.includes(neighborId)) {
          resultingIds.push(neighborId)
        }
        continue
      }

      const current = nextItems.find((item) => item.id === selectedId)
      if (!current) continue

      const position = adjacentPosition(current.position, direction, CUBE_STEP)
      const key = positionKey(position)
      if (claimedPositions.has(key)) continue

      const occupied = nextItems.some(
        (item) =>
          item.position[0] === position[0] &&
          item.position[1] === position[1] &&
          item.position[2] === position[2],
      )
      if (occupied) continue

      const id = createCubeId()
      nextItems = [...nextItems, { id, position }]
      claimedPositions.add(key)
      resultingIds.push(id)
    }

    if (resultingIds.length === 0) break
    nextSelectedIds = resultingIds
  }

  return { items: nextItems, selectedIds: nextSelectedIds }
}
