import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { EditorMode } from '../../shared/config/editor-mode'

export type UiState = {
  mode: EditorMode
  modeMenuOpen: boolean
}

const initialState: UiState = {
  mode: 'norm',
  modeMenuOpen: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<EditorMode>) {
      state.mode = action.payload
      state.modeMenuOpen = false
    },
    openModeMenu(state) {
      state.modeMenuOpen = true
    },
    closeModeMenu(state) {
      state.modeMenuOpen = false
    },
    toggleModeMenu(state) {
      state.modeMenuOpen = !state.modeMenuOpen
    },
  },
  selectors: {
    selectMode: (state) => state.mode,
    selectIsInsertMode: (state) => state.mode === 'insert',
    selectModeMenuOpen: (state) => state.modeMenuOpen,
  },
})

export default uiSlice.reducer
