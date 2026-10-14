import { dump, load } from 'js-yaml'
import type { CubeData } from '../../entities/cube/model'

export type CubesDocument = {
  version: 1
  activeId: string
  cubes: CubeData[]
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPosition(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(isFiniteNumber)
  )
}

function isCubeData(value: unknown): value is CubeData {
  if (!value || typeof value !== 'object') return false
  const cube = value as Partial<CubeData>
  return typeof cube.id === 'string' && cube.id.length > 0 && isPosition(cube.position)
}

export function serializeCubesYaml(
  cubes: CubeData[],
  activeId: string,
): string {
  const document: CubesDocument = {
    version: 1,
    activeId,
    cubes,
  }
  return dump(document, { indent: 2, lineWidth: 80 })
}

export function parseCubesYaml(text: string): CubesDocument | null {
  let raw: unknown
  try {
    raw = load(text)
  } catch {
    return null
  }

  if (!raw || typeof raw !== 'object') return null
  const doc = raw as Partial<CubesDocument>
  if (doc.version !== 1) return null
  if (!Array.isArray(doc.cubes) || doc.cubes.length === 0) return null
  if (!doc.cubes.every(isCubeData)) return null
  if (typeof doc.activeId !== 'string') return null
  if (!doc.cubes.some((cube) => cube.id === doc.activeId)) return null

  return {
    version: 1,
    activeId: doc.activeId,
    cubes: doc.cubes.map((cube) => ({
      id: cube.id,
      position: [...cube.position] as [number, number, number],
    })),
  }
}
