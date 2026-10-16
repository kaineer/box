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
  runReadCubesAction,
  runWriteCubesAction,
} from '../features/io/cubeIoActions'
import {
  isDeleteCode,
  isEscapeCode,
  isGroupCode,
  isInsertModeCode,
  isMoveModeCode,
  isReadCode,
  isSelectModeCode,
  isSpaceCode,
  isWriteCode,
  moveKeyFromCode,
  type MoveKey,
} from '../shared/lib/keys'

const {
  selectCubes,
  selectGroups,
  selectActiveId,
  selectSelectedIds,
  selectCanWrite,
} = cubesSlice.selectors
const {
  selectCube,
  removeActiveCube,
  setCubesState,
  createGroupFromSelection,
  ungroupSelectedGroups,
} = cubesSlice.actions
const { setMode, toggleModeMenu, closeModeMenu } = uiSlice.actions

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
  const groups = useSelector((state: { cubes: CubesState }) =>
    selectGroups(state),
  )
  const activeId = useSelector((state: { cubes: CubesState }) =>
    selectActiveId(state),
  )
  const selectedIds = useSelector((state: { cubes: CubesState }) =>
    selectSelectedIds(state),
  )
  const canWrite = useSelector((state: { cubes: CubesState }) =>
    selectCanWrite(state),
  )

  const cubesRef = useRef(cubes)
  const groupsRef = useRef(groups)
  const activeIdRef = useRef(activeId)
  const selectedIdsRef = useRef(selectedIds)
  const canWriteRef = useRef(canWrite)
  cubesRef.current = cubes
  groupsRef.current = groups
  activeIdRef.current = activeId
  selectedIdsRef.current = selectedIds
  canWriteRef.current = canWrite

  useEffect(() => {
    const insertMotions = createMotionBuffer<MoveKey>({
      parseCountDigit: countDigitFromCode,
      parseMotion: moveKeyFromCode,
      onMotion: ({ count, motion }) => {
        const next = executeInsertMotion({
          camera,
          items: cubesRef.current,
          groups: groupsRef.current,
          selectedIds: selectedIdsRef.current,
          moveKey: motion,
          count,
        })
        cubesRef.current = next.items
        groupsRef.current = next.groups
        selectedIdsRef.current = next.selectedIds
        activeIdRef.current =
          next.selectedIds[next.selectedIds.length - 1] ?? activeIdRef.current
        dispatch(setCubesState(next))
      },
    })

    const navigateMotions = createMotionBuffer<MoveKey>({
      parseCountDigit: countDigitFromCode,
      parseMotion: moveKeyFromCode,
      onMotion: ({ count, motion }) => {
        if (
          !cubesRef.current.some((cube) => cube.id === activeIdRef.current)
        ) {
          return
        }
        const nextId = executeNavigateMotion({
          camera,
          items: cubesRef.current,
          activeId: activeIdRef.current,
          moveKey: motion,
          count,
        })
        activeIdRef.current = nextId
        selectedIdsRef.current = [nextId]
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
          groups: groupsRef.current,
          selectedIds: selectedIdsRef.current,
          moveKey: motion,
          count,
        })
        cubesRef.current = next.items
        groupsRef.current = next.groups
        selectedIdsRef.current = next.selectedIds
        activeIdRef.current =
          next.selectedIds[next.selectedIds.length - 1] ?? activeIdRef.current
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
          modeRef.current === 'move' ||
          modeRef.current === 'select'
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

      if (isSelectModeCode(event.code)) {
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
        dispatch(setMode('select'))
        return
      }

      if (isWriteCode(event.code)) {
        if (
          event.repeat ||
          event.shiftKey ||
          event.ctrlKey ||
          event.metaKey ||
          !canWriteRef.current
        ) {
          return
        }
        event.preventDefault()
        resetMotions()
        void runWriteCubesAction(
          dispatch,
          cubesRef.current,
          activeIdRef.current,
        )
        return
      }

      if (isReadCode(event.code)) {
        if (event.repeat || event.shiftKey || event.ctrlKey || event.metaKey) {
          return
        }
        event.preventDefault()
        resetMotions()
        void runReadCubesAction(dispatch)
        return
      }

      if (isGroupCode(event.code)) {
        if (event.repeat || event.ctrlKey || event.metaKey) {
          return
        }
        event.preventDefault()
        resetMotions()
        if (event.shiftKey) {
          dispatch(ungroupSelectedGroups())
        } else {
          dispatch(createGroupFromSelection())
        }
        if (modeMenuOpenRef.current) {
          dispatch(closeModeMenu())
        }
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
