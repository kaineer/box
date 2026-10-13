import { CUBE_GAP, CUBE_SIZE } from '../../shared/config/constants'

export type CubeData = {
  id: string
  position: [number, number, number]
}

export const INITIAL_CUBES: CubeData[] = [
  { id: 'left', position: [-(CUBE_SIZE + CUBE_GAP) / 2, 0, 0] },
  { id: 'right', position: [(CUBE_SIZE + CUBE_GAP) / 2, 0, 0] },
]

let nextCubeId = 1

export function createCubeId(): string {
  nextCubeId += 1
  return `cube-${nextCubeId}`
}
