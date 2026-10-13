import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { findClosest } from '../../shared/lib/find-closest'
import { createCubeId, INITIAL_CUBES, type CubeData } from './model'

export type CubesState = {
  items: CubeData[]
  activeId: string
}

const initialState: CubesState = {
  items: INITIAL_CUBES,
  activeId: INITIAL_CUBES[0].id,
}

export const cubesSlice = createSlice({
  name: 'cubes',
  initialState,
  reducers: {
    selectCube(state, action: PayloadAction<string>) {
      if (state.items.some((cube) => cube.id === action.payload)) {
        state.activeId = action.payload
      }
    },
    addCube(state, action: PayloadAction<{ position: [number, number, number] }>) {
      const id = createCubeId()
      state.items.push({ id, position: action.payload.position })
      state.activeId = id
    },
    removeActiveCube(state) {
      if (state.items.length <= 1) return

      const current = state.items.find((cube) => cube.id === state.activeId)
      if (!current) return

      const remaining = state.items.filter((cube) => cube.id !== state.activeId)
      const nextId = findClosest(remaining, current.position)
      if (!nextId) return

      state.items = remaining
      state.activeId = nextId
    },
  },
  selectors: {
    selectCubes: (state) => state.items,
    selectActiveId: (state) => state.activeId,
    selectActiveCube: (state) =>
      state.items.find((cube) => cube.id === state.activeId) ?? state.items[0],
  },
})


export default cubesSlice.reducer
