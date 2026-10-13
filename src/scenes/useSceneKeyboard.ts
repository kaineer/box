import { useEffect, useRef, type MutableRefObject } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { Camera } from 'three'
import { cubesSlice, type CubesState } from '../entities/cube/cubesSlice'
import { uiSlice } from '../entities/ui/uiSlice'
import { countDigitFromCode } from '../features/motions/countDigitFromCode'
import { createMotionBuffer } from '../features/motions/createMotionBuffer'
import { executeInsertMotion } from '../features/motions/executeInsertMotion'
import { executeMoveMotion } from '../features/motions/executeMoveMotion'
import { executeNavigateMotion } from '../features/motions/executeNavigateMotion'
import type { EditorMode } from '../shared/config/editor-mode'
import {
  isDeleteCode,
  isEscapeCode,
  isInsertModeCode,
  isMoveModeCode,
  isSpaceCode,
  moveKeyFromCode,
  type MoveKey,
} from '../shared/lib/keys'

const { selectCubes, selectActiveId } = cubesSlice.selectors
const { selectCube, removeActiveCube, setCubesState } = cubesSlice.actions
const { setMode, toggleModeMenu } = uiSlice.actions

type UseSceneKeyboardParams = {
  camera: Camera
  modeRef: MutableRefObject<EditorMode>
  modeMenuOpenRef: MutableRefObject<boolean>
}

export function useSceneKeyboard({
  camera,
  modeRef,
  modeMenuOpenRef,
}: UseSceneKeyboardParams) {
  const dispatch = useDispatch()
  const cubes = useSelector((state: { cubes: CubesState }) => selectCubes(state))
  const activeId = useSelector((state: { cubes: CubesState }) =>
    selectActiveId(state),
  )

  const cubesRef = useRef(cubes)
  const activeIdRef = useRef(activeId)
  cubesRef.current = cubes
  activeIdRef.current = activeId

  useEffect(() => {
    const insertMotions = createMotionBuffer<MoveKey>({
      parseCountDigit: countDigitFromCode,
      parseMotion: moveKeyFromCode,
      onMotion: ({ count, motion }) => {
        const next = executeInsertMotion({
          camera,
          items: cubesRef.current,
          activeId: activeIdRef.current,
          moveKey: motion,
          count,
        })
        cubesRef.current = next.items
        activeIdRef.current = next.activeId
        dispatch(setCubesState(next))
      },
    })

    const navigateMotions = createMotionBuffer<MoveKey>({
      parseCountDigit: countDigitFromCode,
      parseMotion: moveKeyFromCode,
      onMotion: ({ count, motion }) => {
        const nextId = executeNavigateMotion({
          camera,
          items: cubesRef.current,
          activeId: activeIdRef.current,
          moveKey: motion,
          count,
        })
        activeIdRef.current = nextId
        dispatch(selectCube(nextId))
      },
    })

    const moveMotions = createMotionBuffer<MoveKey>({
      parseCountDigit: countDigitFromCode,
      parseMotion: moveKeyFromCode,
      onMotion: ({ count, motion }) => {
        const next = executeMoveMotion({
          camera,
          items: cubesRef.current,
          activeId: activeIdRef.current,
          moveKey: motion,
          count,
        })
        cubesRef.current = next.items
        activeIdRef.current = next.activeId
        dispatch(setCubesState(next))
      },
    })

    const resetMotions = () => {
      insertMotions.reset()
      navigateMotions.reset()
      moveMotions.reset()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isSpaceCode(event.code)) {
        if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
          return
        }
        event.preventDefault()
        resetMotions()
        dispatch(toggleModeMenu())
        return
      }

      if (isEscapeCode(event.code)) {
        if (
          modeMenuOpenRef.current ||
          modeRef.current === 'insert' ||
          modeRef.current === 'move'
        ) {
          event.preventDefault()
          resetMotions()
          dispatch(setMode('norm'))
        }
        return
      }

      if (isInsertModeCode(event.code)) {
        if (
          event.repeat ||
          event.shiftKey ||
          event.ctrlKey ||
          event.metaKey ||
          (!modeMenuOpenRef.current && modeRef.current !== 'norm')
        ) {
          return
        }
        event.preventDefault()
        resetMotions()
        dispatch(setMode('insert'))
        return
      }

      if (isMoveModeCode(event.code)) {
        if (
          event.repeat ||
          event.shiftKey ||
          event.ctrlKey ||
          event.metaKey ||
          (!modeMenuOpenRef.current && modeRef.current !== 'norm')
        ) {
          return
        }
        event.preventDefault()
        resetMotions()
        dispatch(setMode('move'))
        return
      }

      if (modeMenuOpenRef.current) {
        return
      }

      if (isDeleteCode(event.code)) {
        if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
          return
        }
        event.preventDefault()
        resetMotions()
        dispatch(removeActiveCube())
        return
      }

      if (event.repeat) return

      if (modeRef.current === 'insert') {
        if (insertMotions.handleKey(event.code)) {
          event.preventDefault()
        }
        return
      }

      if (modeRef.current === 'move') {
        if (moveMotions.handleKey(event.code)) {
          event.preventDefault()
        }
        return
      }

      if (
        countDigitFromCode(event.code) !== null ||
        moveKeyFromCode(event.code) !== null
      ) {
        if (navigateMotions.handleKey(event.code)) {
          event.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      insertMotions.dispose()
      navigateMotions.dispose()
      moveMotions.dispose()
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [camera, dispatch, modeMenuOpenRef, modeRef])
}
