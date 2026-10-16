import type { Camera } from 'three'
import type { CubeData } from '../../entities/cube/model'
import { createCubeId } from '../../entities/cube/model'
import {
  createGroupId,
  worldPositionOfGroupCube,
  type GroupData,
} from '../../entities/group/model'
import { flattenWorldCubes } from '../../entities/group/worldCubes'
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
  groups?: GroupData[]
  selectedIds: string[]
  moveKey: MoveKey
  count: number
}

type InsertMotionResult = {
  items: CubeData[]
  groups: GroupData[]
  selectedIds: string[]
}

function positionKey(position: readonly [number, number, number]): string {
  return `${position[0]},${position[1]},${position[2]}`
}

function selectionFootprint(
  items: readonly CubeData[],
  groups: readonly GroupData[],
  selectedIds: readonly string[],
): [number, number, number][] {
  const selected = new Set(selectedIds)
  const footprint: [number, number, number][] = []

  for (const cube of items) {
    if (selected.has(cube.id)) {
      footprint.push([...cube.position] as [number, number, number])
    }
  }

  for (const group of groups) {
    if (!selected.has(group.id)) continue
    for (const cube of group.cubes) {
      footprint.push(worldPositionOfGroupCube(group, cube))
    }
  }

  return footprint
}

/**
 * Сдвиг набора в направлении: глубина AABB по оси + 1 шаг,
 * чтобы копия начиналась с первого свободного «кубоместа» после набора.
 */
function stampOffsetSteps(
  footprint: readonly (readonly [number, number, number])[],
  direction: ReturnType<typeof snapCardinal>,
): number {
  if (footprint.length === 0) return 1

  let minDot = Infinity
  let maxDot = -Infinity
  for (const [x, y, z] of footprint) {
    const dot = x * direction.x + y * direction.y + z * direction.z
    if (dot < minDot) minDot = dot
    if (dot > maxDot) maxDot = dot
  }

  return Math.round((maxDot - minDot) / CUBE_STEP) + 1
}

function occupiedKeys(
  items: readonly CubeData[],
  groups: readonly GroupData[],
): Set<string> {
  return new Set(
    flattenWorldCubes(items, groups).map((cube) => positionKey(cube.position)),
  )
}

/**
 * Если среди выделения есть группа — штампуем копии всего набора
 * (кубы + группы) со сдвигом в направлении. Иначе — покубовая вставка.
 */
export function executeInsertMotion({
  camera,
  items,
  groups = [],
  selectedIds,
  moveKey,
  count,
}: ExecuteInsertMotionParams): InsertMotionResult {
  const direction = snapCardinal(getNavDirection(camera, moveKey))
  const steps = Math.min(Math.max(1, count), MAX_INSERT_MOTION_COUNT)

  const hasSelectedGroup = selectedIds.some((id) =>
    groups.some((group) => group.id === id),
  )

  if (hasSelectedGroup) {
    return stampInsertSelection({
      items,
      groups,
      selectedIds,
      direction,
      steps,
    })
  }

  return insertFreeCubes({
    items,
    groups,
    selectedIds,
    direction,
    steps,
  })
}

function stampInsertSelection({
  items,
  groups,
  selectedIds,
  direction,
  steps,
}: {
  items: CubeData[]
  groups: GroupData[]
  selectedIds: string[]
  direction: ReturnType<typeof snapCardinal>
  steps: number
}): InsertMotionResult {
  let nextItems = items
  let nextGroups = groups
  let nextSelectedIds = selectedIds.filter(
    (id) =>
      nextItems.some((item) => item.id === id) ||
      nextGroups.some((group) => group.id === id),
  )

  for (let step = 0; step < steps; step += 1) {
    if (nextSelectedIds.length === 0) break

    const footprint = selectionFootprint(
      nextItems,
      nextGroups,
      nextSelectedIds,
    )
    if (footprint.length === 0) break

    const offsetSteps = stampOffsetSteps(footprint, direction)
    const delta: [number, number, number] = [
      direction.x * offsetSteps * CUBE_STEP,
      direction.y * offsetSteps * CUBE_STEP,
      direction.z * offsetSteps * CUBE_STEP,
    ]

    const occupied = occupiedKeys(nextItems, nextGroups)
    const targetFree = footprint.every((position) => {
      const key = positionKey([
        position[0] + delta[0],
        position[1] + delta[1],
        position[2] + delta[2],
      ])
      return !occupied.has(key)
    })
    if (!targetFree) break

    const resultingIds: string[] = []
    const addedItems: CubeData[] = []
    const addedGroups: GroupData[] = []

    for (const selectedId of nextSelectedIds) {
      const cube = nextItems.find((item) => item.id === selectedId)
      if (cube) {
        const id = createCubeId()
        addedItems.push({
          id,
          position: [
            cube.position[0] + delta[0],
            cube.position[1] + delta[1],
            cube.position[2] + delta[2],
          ],
        })
        resultingIds.push(id)
        continue
      }

      const group = nextGroups.find((item) => item.id === selectedId)
      if (!group) continue

      const groupId = createGroupId()
      addedGroups.push({
        id: groupId,
        position: [
          group.position[0] + delta[0],
          group.position[1] + delta[1],
          group.position[2] + delta[2],
        ],
        cubes: group.cubes.map((member) => ({
          id: createCubeId(),
          offset: [...member.offset] as [number, number, number],
        })),
      })
      resultingIds.push(groupId)
    }

    if (resultingIds.length === 0) break

    nextItems = [...nextItems, ...addedItems]
    nextGroups = [...nextGroups, ...addedGroups]
    nextSelectedIds = resultingIds
  }

  return {
    items: nextItems,
    groups: nextGroups,
    selectedIds: nextSelectedIds,
  }
}

/**
 * Для каждого выделенного свободного куба:
 * - свободно → добавить куб напротив (он войдёт в новое выделение);
 * - занято → выделить соседа, текущий куб теряет выделение.
 */
function insertFreeCubes({
  items,
  groups,
  selectedIds,
  direction,
  steps,
}: {
  items: CubeData[]
  groups: GroupData[]
  selectedIds: string[]
  direction: ReturnType<typeof snapCardinal>
  steps: number
}): InsertMotionResult {
  let nextItems = items
  let nextSelectedIds = selectedIds.filter((id) =>
    nextItems.some((item) => item.id === id),
  )

  for (let step = 0; step < steps; step += 1) {
    if (nextSelectedIds.length === 0) break

    const resultingIds: string[] = []
    const claimedPositions = new Set<string>()
    const world = flattenWorldCubes(nextItems, groups)

    for (const selectedId of nextSelectedIds) {
      const neighborId = findNeighbor(
        world,
        selectedId,
        direction,
        NEIGHBOR_OPTIONS,
      )

      if (neighborId) {
        // Сосед внутри группы — не выделяем (группы не редактируются поштучно)
        if (
          nextItems.some((item) => item.id === neighborId) &&
          !resultingIds.includes(neighborId)
        ) {
          resultingIds.push(neighborId)
        }
        continue
      }

      const current = nextItems.find((item) => item.id === selectedId)
      if (!current) continue

      const position = adjacentPosition(current.position, direction, CUBE_STEP)
      const key = positionKey(position)
      if (claimedPositions.has(key)) continue

      const occupied = world.some(
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

  return { items: nextItems, groups, selectedIds: nextSelectedIds }
}
