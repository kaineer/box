import { configureStore } from '@reduxjs/toolkit'
import { cubesSlice } from '../entities/cube/cubesSlice'

export const store = configureStore({
  reducer: {
    [cubesSlice.reducerPath]: cubesSlice.reducer,
  },
})
