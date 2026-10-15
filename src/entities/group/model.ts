export interface GroupCube {
  id: string
  offset: [number, number, number]
}

export interface GroupData {
  id: string
  position: [number, number, number]
  cubes: GroupCube[]
}

let nextGroupId = 1

export function createGroupId(): string {
  nextGroupId += 1
  return `group-${nextGroupId}`
}

/** Чтобы новые id не пересекались с загруженными `group-N`. */
export function syncGroupIdCounter(groups: readonly GroupData[]): void {
  for (const group of groups) {
    const match = /^group-(\d+)$/.exec(group.id)
    if (match) {
      nextGroupId = Math.max(nextGroupId, Number(match[1]))
    }
  }
}

/**
 * Origin группы: верхний-левый-задний угол AABB центров кубов
 * (minX, maxY, minZ) в Three.js Y-up.
 */
export function originFromCubes(
  positions: readonly (readonly [number, number, number])[],
): [number, number, number] {
  if (positions.length === 0) {
    return [0, 0, 0]
  }

  let minX = Infinity
  let maxY = -Infinity
  let minZ = Infinity

  for (const [x, y, z] of positions) {
    if (x < minX) minX = x
    if (y > maxY) maxY = y
    if (z < minZ) minZ = z
  }

  return [minX, maxY, minZ]
}

export function worldPositionOfGroupCube(
  group: GroupData,
  cube: GroupCube,
): [number, number, number] {
  return [
    group.position[0] + cube.offset[0],
    group.position[1] + cube.offset[1],
    group.position[2] + cube.offset[2],
  ]
}
