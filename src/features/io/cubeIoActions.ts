import type { Dispatch } from '@reduxjs/toolkit'
import { cubesSlice } from '../../entities/cube/cubesSlice'
import { syncCubeIdCounter, type CubeData } from '../../entities/cube/model'
import { uiSlice } from '../../entities/ui/uiSlice'
import { readCubesFile } from './readCubesFile'
import { writeCubesFile } from './writeCubesFile'

const { setCubesState } = cubesSlice.actions
const { closeModeMenu } = uiSlice.actions

export async function runWriteCubesAction(
  dispatch: Dispatch,
  cubes: CubeData[],
  activeId: string,
): Promise<void> {
  await writeCubesFile(cubes, activeId)
  dispatch(closeModeMenu())
}

export async function runReadCubesAction(dispatch: Dispatch): Promise<void> {
  const document = await readCubesFile()
  if (document) {
    syncCubeIdCounter(document.cubes)
    dispatch(
      setCubesState({
        items: document.cubes,
        activeId: document.activeId,
      }),
    )
  }
  dispatch(closeModeMenu())
}
