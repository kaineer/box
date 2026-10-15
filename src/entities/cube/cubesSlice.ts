import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { findClosest } from '../../shared/lib/find-closest'
import { createCubeId, INITIAL_CUBES, type CubeData } from './model'

export type CubesState = {
  items: CubeData[]
  /** Последний элемент — primary (камера, операции). */
  selectedIds: string[]
}

const initialState: CubesState = {
  items: INITIAL_CUBES,
  selectedIds: [INITIAL_CUBES[0].id],
}

function primaryId(state: CubesState): string {
  return state.selectedIds[state.selectedIds.length - 1] ?? state.items[0]?.id ?? ''
}

export const cubesSlice = createSlice({
  name: 'cubes',
  initialState,
  reducers: {
    /** Клик без Shift — ровно один куб. */
    selectCube(state, action: PayloadAction<string>) {
      if (state.items.some((cube) => cube.id === action.payload)) {
        state.selectedIds = [action.payload]
      }
    },
    /** Shift+клик — добавить к выделению (или сделать primary). */
    addCubeToSelection(state, action: PayloadAction<string>) {
      const id = action.payload
      if (!state.items.some((cube) => cube.id === id)) return

      state.selectedIds = [
        ...state.selectedIds.filter((selectedId) => selectedId !== id),
        id,
      ]
    },
    /** Заменить выделение списком кубов (прямоугольное выделение). */
    setSelection(state, action: PayloadAction<string[]>) {
      const valid = action.payload.filter((id) =>
        state.items.some((cube) => cube.id === id),
      )
      if (valid.length === 0) return
      state.selectedIds = valid
    },
    addCube(state, action: PayloadAction<{ position: [number, number, number] }>) {
      const id = createCubeId()
      state.items.push({ id, position: action.payload.position })
      state.selectedIds = [id]
    },
    removeActiveCube(state) {
      if (state.items.length <= 1) return

      const removing = new Set(state.selectedIds)
      if (removing.size === 0) return

      // Нельзя удалить все кубы со сцены
      if (removing.size >= state.items.length) return

      const anchorId = primaryId(state)
      const anchor =
        state.items.find((cube) => cube.id === anchorId) ?? state.items[0]
      if (!anchor) return

      const remaining = state.items.filter((cube) => !removing.has(cube.id))
      const nextId = findClosest(remaining, anchor.position)
      if (!nextId) return

      state.items = remaining
      state.selectedIds = [nextId]
    },
    setCubesState(
      state,
      action: PayloadAction<{
        items: CubeData[]
        selectedIds?: string[]
        /** @deprecated для загрузки YAML — станет единственным selected */
        activeId?: string
      }>,
    ) {
      state.items = action.payload.items

      if (action.payload.selectedIds) {
        const valid = action.payload.selectedIds.filter((id) =>
          state.items.some((cube) => cube.id === id),
        )
        state.selectedIds =
          valid.length > 0
            ? valid
            : state.items[0]
              ? [state.items[0].id]
              : []
        return
      }

      const activeId = action.payload.activeId
      state.selectedIds =
        activeId && state.items.some((cube) => cube.id === activeId)
          ? [activeId]
          : state.items[0]
            ? [state.items[0].id]
            : []
    },
  },
  selectors: {
    selectCubes: (state) => state.items,
    selectSelectedIds: (state) => state.selectedIds,
    selectIsSelected: (state, id: string) => state.selectedIds.includes(id),
    selectActiveId: (state) => primaryId(state),
    selectActiveCube: (state) =>
      state.items.find((cube) => cube.id === primaryId(state)) ?? state.items[0],
  },
})
