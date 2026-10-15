import type { CubeData } from '../cube/model'
import type { GroupData } from './model'
import { worldPositionOfGroupCube } from './model'

/** Плоский список занятых ячеек: свободные кубы + развёртка групп. */
export function flattenWorldCubes(
  freeCubes: readonly CubeData[],
  groups: readonly GroupData[],
): CubeData[] {
  const result: CubeData[] = freeCubes.map((cube) => ({
    id: cube.id,
    position: [...cube.position] as [number, number, number],
  }))

  for (const group of groups) {
    for (const cube of group.cubes) {
      result.push({
        id: cube.id,
        position: worldPositionOfGroupCube(group, cube),
      })
    }
  }

  return result
}

/** id группы, которой принадлежит куб, или null. */
export function groupIdForCubeId(
  groups: readonly GroupData[],
  cubeId: string,
): string | null {
  for (const group of groups) {
    if (group.cubes.some((cube) => cube.id === cubeId)) {
      return group.id
    }
  }
  return null
}

export function totalCubeCount(
  freeCubes: readonly CubeData[],
  groups: readonly GroupData[],
): number {
  return (
    freeCubes.length +
    groups.reduce((sum, group) => sum + group.cubes.length, 0)
  )
}

export function centroidOfPositions(
  positions: readonly (readonly [number, number, number])[],
): [number, number, number] {
  if (positions.length === 0) return [0, 0, 0]
  let x = 0
  let y = 0
  let z = 0
  for (const [px, py, pz] of positions) {
    x += px
    y += py
    z += pz
  }
  const n = positions.length
  return [x / n, y / n, z / n]
}

export function groupCentroid(group: GroupData): [number, number, number] {
  return centroidOfPositions(
    group.cubes.map((cube) => worldPositionOfGroupCube(group, cube)),
  )
}
