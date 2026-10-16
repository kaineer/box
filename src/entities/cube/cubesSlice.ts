import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  createGroupId,
  originFromCubes,
  worldPositionOfGroupCube,
  type GroupData,
} from '../group/model'
import {
  groupCentroid,
  totalCubeCount,
} from '../group/worldCubes'
import { findClosest } from '../../shared/lib/find-closest'
import { createCubeId, INITIAL_CUBES, type CubeData } from './model'

export type CubesState = {
  cubes: CubeData[]
  groups: GroupData[]
  /** Последний элемент — primary (камера, операции). */
  selectedIds: string[]
}

const initialState: CubesState = {
  cubes: INITIAL_CUBES,
  groups: [],
  selectedIds: [INITIAL_CUBES[0].id],
}

function primaryId(state: CubesState): string {
  return state.selectedIds[state.selectedIds.length - 1] ?? state.cubes[0]?.id ?? ''
}

function isValidSelectableId(state: CubesState, id: string): boolean {
  return (
    state.cubes.some((cube) => cube.id === id) ||
    state.groups.some((group) => group.id === id)
  )
}

function anchorPosition(
  state: CubesState,
  id: string,
): [number, number, number] | null {
  const cube = state.cubes.find((item) => item.id === id)
  if (cube) return cube.position

  const group = state.groups.find((item) => item.id === id)
  if (group) return groupCentroid(group)

  return null
}

function remainingAnchors(state: CubesState): { id: string; position: [number, number, number] }[] {
  return [
    ...state.cubes.map((cube) => ({
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
      const { payload: cubeId } = action;
      if (isValidSelectableId(state, cubeId)) {
        state.selectedIds = [cubeId]
      }
    },
    /** Shift+клик — добавить к выделению (или сделать primary). */
    addCubeToSelection(state, action: PayloadAction<string>) {
      const { payload: cubeId } = action
      if (isValidSelectableId(state, cubeId)) {
        state.selectedIds = [
          ...state.selectedIds.filter((selectedId) => selectedId !== cubeId),
          cubeId,
        ]
      }
    },
    /** Заменить выделение списком id (прямоугольное выделение). */
    setSelection(state, action: PayloadAction<string[]>) {
      const valid = action.payload.filter((id) => isValidSelectableId(state, id))
      if (valid.length === 0) return
      state.selectedIds = valid
    },
    /** Добавить id к выделению (marquee + Shift); уже выбранные переносятся в конец. */
    addToSelection(state, action: PayloadAction<string[]>) {
      const valid = action.payload.filter((id) => isValidSelectableId(state, id))
      if (valid.length === 0) return
      state.selectedIds = [
        ...state.selectedIds.filter((id) => !valid.includes(id)),
        ...valid,
      ]
    },
    addCube(state, action: PayloadAction<{ position: [number, number, number] }>) {
      const id = createCubeId()
      const { position } = action.payload
      state.cubes.push({ id, position })
      state.selectedIds = [id]
    },
    createGroupFromSelection(state) {
      if (state.selectedIds.length < 2) return

      const selectedCubes: CubeData[] = []
      for (const id of state.selectedIds) {
        const cube = state.cubes.find((item) => item.id === id)
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
      state.cubes = state.cubes.filter((cube) => !removing.has(cube.id))
      state.selectedIds = [groupId]
    },
    /** Разгруппировать выделенные группы: кубы возвращаются в список. */
    ungroupSelectedGroups(state) {
      const selectedGroups = state.groups.filter((group) =>
        state.selectedIds.includes(group.id),
      )
      if (selectedGroups.length === 0) return

      const removingGroupIds = new Set(selectedGroups.map((group) => group.id))
      const releasedIds: string[] = []

      for (const group of selectedGroups) {
        for (const cube of group.cubes) {
          state.cubes.push({
            id: cube.id,
            position: worldPositionOfGroupCube(group, cube),
          })
          releasedIds.push(cube.id)
        }
      }

      state.groups = state.groups.filter(
        (group) => !removingGroupIds.has(group.id),
      )
      state.selectedIds = [
        ...state.selectedIds.filter((id) => !removingGroupIds.has(id)),
        ...releasedIds,
      ]
    },
    removeActiveCube(state) {
      const removing = new Set(state.selectedIds)
      if (removing.size === 0) return

      const cubesToRemove = state.cubes.filter((cube) => removing.has(cube.id))
      const groupsToRemove = state.groups.filter((group) =>
        removing.has(group.id),
      )

      if (cubesToRemove.length === 0 && groupsToRemove.length === 0) return

      const removingCubeCount =
        cubesToRemove.length +
        groupsToRemove.reduce((sum, group) => sum + group.cubes.length, 0)

      if (removingCubeCount >= totalCubeCount(state.cubes, state.groups)) {
        return
      }

      const anchorId = primaryId(state)
      const anchorPos =
        anchorPosition(state, anchorId) ??
        state.cubes[0]?.position ??
        (state.groups[0] ? groupCentroid(state.groups[0]) : [0, 0, 0])

      state.cubes = state.cubes.filter((cube) => !removing.has(cube.id))
      state.groups = state.groups.filter((group) => !removing.has(group.id))

      const remaining = remainingAnchors(state)
      const nextId = findClosest(remaining, anchorPos)
      if (!nextId) return

      state.selectedIds = [nextId]
    },
    setCubesState(
      state,
      action: PayloadAction<{
        cubes: CubeData[]
        groups?: GroupData[]
        selectedIds?: string[]
        /** @deprecated для загрузки YAML — станет единственным selected */
        activeId?: string
      }>,
    ) {
      state.cubes = action.payload.cubes
      state.groups = action.payload.groups ?? []

      if (action.payload.selectedIds) {
        const valid = action.payload.selectedIds.filter((id) =>
          isValidSelectableId(state, id),
        )
        state.selectedIds =
          valid.length > 0
            ? valid
            : state.cubes[0]
              ? [state.cubes[0].id]
              : state.groups[0]
                ? [state.groups[0].id]
                : []
        return
      }

      const activeId = action.payload.activeId
      state.selectedIds =
        activeId && isValidSelectableId(state, activeId)
          ? [activeId]
          : state.cubes[0]
            ? [state.cubes[0].id]
            : state.groups[0]
              ? [state.groups[0].id]
              : []
    },
  },
  selectors: {
    selectCubes: (state) => state.cubes,
    selectGroups: (state) => state.groups,
    selectSelectedIds: (state) => state.selectedIds,
    selectIsSelected: (state, id: string) => state.selectedIds.includes(id),
    selectActiveId: (state) => primaryId(state),
    selectActiveCube: (state) =>
      state.cubes.find((cube) => cube.id === primaryId(state)) ?? state.cubes[0],
    selectCanCreateGroup: (state) => {
      if (state.selectedIds.length < 2) return false
      return state.selectedIds.every((id) =>
        state.cubes.some((cube) => cube.id === id),
      )
    },
    selectCanUngroup: (state) =>
      state.selectedIds.some((id) =>
        state.groups.some((group) => group.id === id),
      ),
    /** Сохранение пока не умеет сериализовать группы. */
    selectCanWrite: (state) => state.groups.length === 0,
  },
})
