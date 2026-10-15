import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  createGroupId,
  originFromCubes,
  type GroupData,
} from '../group/model'
import {
  groupCentroid,
  totalCubeCount,
} from '../group/worldCubes'
import { findClosest } from '../../shared/lib/find-closest'
import { createCubeId, INITIAL_CUBES, type CubeData } from './model'

export type CubesState = {
  items: CubeData[]
  groups: GroupData[]
  /** Последний элемент — primary (камера, операции). */
  selectedIds: string[]
}

const initialState: CubesState = {
  items: INITIAL_CUBES,
  groups: [],
  selectedIds: [INITIAL_CUBES[0].id],
}

function primaryId(state: CubesState): string {
  return state.selectedIds[state.selectedIds.length - 1] ?? state.items[0]?.id ?? ''
}

function isValidSelectableId(state: CubesState, id: string): boolean {
  return (
    state.items.some((cube) => cube.id === id) ||
    state.groups.some((group) => group.id === id)
  )
}

function anchorPosition(
  state: CubesState,
  id: string,
): [number, number, number] | null {
  const cube = state.items.find((item) => item.id === id)
  if (cube) return cube.position

  const group = state.groups.find((item) => item.id === id)
  if (group) return groupCentroid(group)

  return null
}

function remainingAnchors(state: CubesState): { id: string; position: [number, number, number] }[] {
  return [
    ...state.items.map((cube) => ({
      id: cube.id,
      position: cube.position,
    })),
    ...state.groups.map((group) => ({
      id: group.id,
      position: groupCentroid(group),
    })),
  ]
}

export const cubesSlice = createSlice({
  name: 'cubes',
  initialState,
  reducers: {
    /** Клик без Shift — ровно один куб или группа. */
    selectCube(state, action: PayloadAction<string>) {
      if (isValidSelectableId(state, action.payload)) {
        state.selectedIds = [action.payload]
      }
    },
    /** Shift+клик — добавить к выделению (или сделать primary). */
    addCubeToSelection(state, action: PayloadAction<string>) {
      const id = action.payload
      if (!isValidSelectableId(state, id)) return

      state.selectedIds = [
        ...state.selectedIds.filter((selectedId) => selectedId !== id),
        id,
      ]
    },
    /** Заменить выделение списком id (прямоугольное выделение). */
    setSelection(state, action: PayloadAction<string[]>) {
      const valid = action.payload.filter((id) => isValidSelectableId(state, id))
      if (valid.length === 0) return
      state.selectedIds = valid
    },
    addCube(state, action: PayloadAction<{ position: [number, number, number] }>) {
      const id = createCubeId()
      state.items.push({ id, position: action.payload.position })
      state.selectedIds = [id]
    },
    createGroupFromSelection(state) {
      if (state.selectedIds.length < 2) return

      const selectedCubes: CubeData[] = []
      for (const id of state.selectedIds) {
        const cube = state.items.find((item) => item.id === id)
        if (!cube) return
        selectedCubes.push(cube)
      }

      const origin = originFromCubes(selectedCubes.map((cube) => cube.position))
      const removing = new Set(selectedCubes.map((cube) => cube.id))
      const groupId = createGroupId()

      state.groups.push({
        id: groupId,
        position: origin,
        cubes: selectedCubes.map((cube) => ({
          id: cube.id,
          offset: [
            cube.position[0] - origin[0],
            cube.position[1] - origin[1],
            cube.position[2] - origin[2],
          ],
        })),
      })
      state.items = state.items.filter((cube) => !removing.has(cube.id))
      state.selectedIds = [groupId]
    },
    removeActiveCube(state) {
      const removing = new Set(state.selectedIds)
      if (removing.size === 0) return

      const cubesToRemove = state.items.filter((cube) => removing.has(cube.id))
      const groupsToRemove = state.groups.filter((group) =>
        removing.has(group.id),
      )

      if (cubesToRemove.length === 0 && groupsToRemove.length === 0) return

      const removingCubeCount =
        cubesToRemove.length +
        groupsToRemove.reduce((sum, group) => sum + group.cubes.length, 0)

      if (removingCubeCount >= totalCubeCount(state.items, state.groups)) {
        return
      }

      const anchorId = primaryId(state)
      const anchorPos =
        anchorPosition(state, anchorId) ??
        state.items[0]?.position ??
        (state.groups[0] ? groupCentroid(state.groups[0]) : [0, 0, 0])

      state.items = state.items.filter((cube) => !removing.has(cube.id))
      state.groups = state.groups.filter((group) => !removing.has(group.id))

      const remaining = remainingAnchors(state)
      const nextId = findClosest(remaining, anchorPos)
      if (!nextId) return

      state.selectedIds = [nextId]
    },
    setCubesState(
      state,
      action: PayloadAction<{
        items: CubeData[]
        groups?: GroupData[]
        selectedIds?: string[]
        /** @deprecated для загрузки YAML — станет единственным selected */
        activeId?: string
      }>,
    ) {
      state.items = action.payload.items
      state.groups = action.payload.groups ?? []

      if (action.payload.selectedIds) {
        const valid = action.payload.selectedIds.filter((id) =>
          isValidSelectableId(state, id),
        )
        state.selectedIds =
          valid.length > 0
            ? valid
            : state.items[0]
              ? [state.items[0].id]
              : state.groups[0]
                ? [state.groups[0].id]
                : []
        return
      }

      const activeId = action.payload.activeId
      state.selectedIds =
        activeId && isValidSelectableId(state, activeId)
          ? [activeId]
          : state.items[0]
            ? [state.items[0].id]
            : state.groups[0]
              ? [state.groups[0].id]
              : []
    },
  },
  selectors: {
    selectCubes: (state) => state.items,
    selectGroups: (state) => state.groups,
    selectSelectedIds: (state) => state.selectedIds,
    selectIsSelected: (state, id: string) => state.selectedIds.includes(id),
    selectActiveId: (state) => primaryId(state),
    selectActiveCube: (state) =>
      state.items.find((cube) => cube.id === primaryId(state)) ?? state.items[0],
    selectCanCreateGroup: (state) => {
      if (state.selectedIds.length < 2) return false
      return state.selectedIds.every((id) =>
        state.items.some((cube) => cube.id === id),
      )
    },
  },
})
