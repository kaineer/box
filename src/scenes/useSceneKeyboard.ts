import { useEffect, useRef, type MutableRefObject } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { Camera } from 'three'
import { cubesSlice, type CubesState } from '../entities/cube/cubesSlice'
import { countDigitFromCode } from '../features/motions/countDigitFromCode'
import { createMotionBuffer } from '../features/motions/createMotionBuffer'
import { executeInsertMotion } from '../features/motions/executeInsertMotion'
import { executeNavigateMotion } from '../features/motions/executeNavigateMotion'
import {
  isDeleteCode,
  isEscapeCode,
  isInsertModeCode,
  isShiftCode,
  moveKeyFromCode,
  type MoveKey,
} from '../shared/lib/keys'

const { selectCubes, selectActiveId } = cubesSlice.selectors
const { selectCube, removeActiveCube, setCubesState } = cubesSlice.actions

export type KeysState = Record<MoveKey, boolean>

type UseSceneKeyboardParams = {
  camera: Camera
  insertModeRef: MutableRefObject<boolean>
  keysRef: MutableRefObject<KeysState>
  shiftRef: MutableRefObject<boolean>
  setInsertMode: (value: boolean) => void
}

export function useSceneKeyboard({
  camera,
  insertModeRef,
  keysRef,
  shiftRef,
  setInsertMode,
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
    const clearMoveKeys = () => {
      keysRef.current.w = false
      keysRef.current.a = false
      keysRef.current.s = false
      keysRef.current.d = false
      keysRef.current.j = false
      keysRef.current.k = false
    }

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

    const resetMotions = () => {
      insertMotions.reset()
      navigateMotions.reset()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEscapeCode(event.code)) {
        if (insertModeRef.current) {
          event.preventDefault()
          resetMotions()
          setInsertMode(false)
          clearMoveKeys()
        }
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

      if (isInsertModeCode(event.code)) {
        if (event.repeat || event.shiftKey || event.ctrlKey || event.metaKey) {
          return
        }
        event.preventDefault()
        resetMotions()
        setInsertMode(true)
        clearMoveKeys()
        return
      }

      if (isShiftCode(event.code)) {
        shiftRef.current = true
        return
      }

      if (insertModeRef.current) {
        if (event.repeat) return
        if (insertMotions.handleKey(event.code)) {
          event.preventDefault()
        }
        return
      }

      // Вне вставки: цифры копят счётчик, Shift+WASD/JK завершают переход на N шагов
      if (countDigitFromCode(event.code) !== null) {
        if (event.repeat) return
        event.preventDefault()
        navigateMotions.handleKey(event.code)
        return
      }

      const moveKey = moveKeyFromCode(event.code)
      if (!moveKey) return

      if (event.shiftKey) {
        if (event.repeat) return
        event.preventDefault()
        navigateMotions.handleKey(event.code)
        return
      }

      navigateMotions.reset()
      keysRef.current[moveKey] = true
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (isShiftCode(event.code)) {
        shiftRef.current = false
        clearMoveKeys()
        return
      }

      const moveKey = moveKeyFromCode(event.code)
      if (moveKey) {
        keysRef.current[moveKey] = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      insertMotions.dispose()
      navigateMotions.dispose()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [camera, dispatch, insertModeRef, keysRef, setInsertMode, shiftRef])
}
