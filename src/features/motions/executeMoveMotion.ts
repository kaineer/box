import type { Camera } from 'three'
import type { CubeData } from '../../entities/cube/model'
import type { GroupData } from '../../entities/group/model'
import { worldPositionOfGroupCube } from '../../entities/group/model'
import { CUBE_STEP, NEIGHBOR_OPTIONS } from '../../shared/config/constants'
import { adjacentPosition } from '../../shared/lib/adjacent-position'
import { findNeighbor } from '../../shared/lib/find-neighbor'
import type { MoveKey } from '../../shared/lib/keys'
import { getNavDirection } from '../../shared/lib/nav-direction'
import { snapCardinal } from '../../shared/lib/snap-direction'

export const MAX_MOVE_MOTION_COUNT = 100

type WorldCell = {
  id: string
  position: [number, number, number]
  ownerId: string
}

type ExecuteMoveMotionParams = {
  camera: Camera
  items: CubeData[]
  groups: GroupData[]
  selectedIds: string[]
  moveKey: MoveKey
  count: number
}

function buildWorldCells(
  items: readonly CubeData[],
  groups: readonly GroupData[],
): WorldCell[] {
  const cells: WorldCell[] = items.map((cube) => ({
    id: cube.id,
    position: [...cube.position] as [number, number, number],
    ownerId: cube.id,
  }))

  for (const group of groups) {
    for (const cube of group.cubes) {
      cells.push({
        id: cube.id,
        position: worldPositionOfGroupCube(group, cube),
        ownerId: group.id,
      })
    }
  }

  return cells
}

function ownerCanMove(
  ownerId: string,
  world: readonly WorldCell[],
  selectedSet: ReadonlySet<string>,
  direction: ReturnType<typeof snapCardinal>,
): boolean {
  const members = world.filter((cell) => cell.ownerId === ownerId)
  if (members.length === 0) return false

  const ownerByCubeId = new Map(world.map((cell) => [cell.id, cell.ownerId]))

  for (const member of members) {
    const neighborId = findNeighbor(
      world,
      member.id,
      direction,
      NEIGHBOR_OPTIONS,
    )
    if (!neighborId) continue

    const neighborOwner = ownerByCubeId.get(neighborId)
    if (neighborOwner && !selectedSet.has(neighborOwner)) {
      return false
    }
  }

  return true
}

/**
 * Пытается сдвинуть все выделенные кубы и группы.
 * Сосед из того же выделения не блокирует.
 * Кто не сдвинулся, выпадает из выделения.
 */
export function executeMoveMotion({
  camera,
  items,
  groups,
  selectedIds,
  moveKey,
  count,
}: ExecuteMoveMotionParams): {
  items: CubeData[]
  groups: GroupData[]
  selectedIds: string[]
} {
  const direction = snapCardinal(getNavDirection(camera, moveKey))
  let nextItems = items
  let nextGroups = groups
  let nextSelectedIds = selectedIds.filter(
    (id) =>
      nextItems.some((item) => item.id === id) ||
      nextGroups.some((group) => group.id === id),
  )
  const steps = Math.min(Math.max(1, count), MAX_MOVE_MOTION_COUNT)

  for (let step = 0; step < steps; step += 1) {
    if (nextSelectedIds.length === 0) break

    const selectedSet = new Set(nextSelectedIds)
    const world = buildWorldCells(nextItems, nextGroups)
    const movers: string[] = []

    for (const selectedId of nextSelectedIds) {
      if (ownerCanMove(selectedId, world, selectedSet, direction)) {
        movers.push(selectedId)
      }
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

    nextGroups = nextGroups.map((group) => {
      if (!moverSet.has(group.id)) return group
      return {
        ...group,
        position: adjacentPosition(group.position, direction, CUBE_STEP),
      }
    })

    nextSelectedIds = movers
  }

  return {
    items: nextItems,
    groups: nextGroups,
    selectedIds: nextSelectedIds,
  }
}
