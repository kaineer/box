import { configureStore } from '@reduxjs/toolkit'
import { cubesSlice } from '../entities/cube/cubesSlice'
import { uiSlice } from '../entities/ui/uiSlice'

export const store = configureStore({
  reducer: {
    [cubesSlice.reducerPath]: cubesSlice.reducer,
    [uiSlice.reducerPath]: uiSlice.reducer,
  },
})
