import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Cube } from '../entities/cube/Cube'
import { cubesSlice, type CubesState } from '../entities/cube/cubesSlice'
import { INITIAL_CUBES } from '../entities/cube/model'
import {
  CAMERA_POLAR,
  ROTATION_SPEED,
  TARGET_LERP,
} from '../shared/config/constants'
import { orbitCameraAroundY } from '../shared/lib/orbit-around'
import { useSceneKeyboard, type KeysState } from './useSceneKeyboard'

const { selectCubes, selectActiveId } = cubesSlice.selectors
const { selectCube } = cubesSlice.actions

export function Scene() {
  const { camera } = useThree()
  const dispatch = useDispatch()
  const cubes = useSelector((state: { cubes: CubesState }) => selectCubes(state))
  const activeId = useSelector((state: { cubes: CubesState }) =>
    selectActiveId(state),
  )
  const [insertMode, setInsertMode] = useState(false)

  const insertModeRef = useRef(insertMode)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const desiredTarget = useRef(new Vector3(...INITIAL_CUBES[0].position))
  const keysRef = useRef<KeysState>({
    w: false,
    a: false,
    s: false,
    d: false,
    j: false,
    k: false,
  })
  const shiftRef = useRef(false)

  insertModeRef.current = insertMode

  useEffect(() => {
    const cube =
      cubes.find((item) => item.id === activeId) ?? cubes[0] ?? INITIAL_CUBES[0]
    desiredTarget.current.set(...cube.position)
  }, [activeId, cubes])

  useSceneKeyboard({
    camera,
    insertModeRef,
    keysRef,
    shiftRef,
    setInsertMode,
  })

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (controls) {
      const t = 1 - Math.exp(-TARGET_LERP * delta)
      controls.target.lerp(desiredTarget.current, t)
    }

    if (!shiftRef.current && !insertModeRef.current && controls) {
      const { a, d } = keysRef.current
      const direction = (a ? 1 : 0) + (d ? -1 : 0)
      if (direction !== 0) {
        orbitCameraAroundY(
          camera,
          controls.target,
          direction * ROTATION_SPEED * delta,
        )
      }
    }

    controls?.update()
  })

  return (
    <>
      {cubes.map((cube) => (
        <Cube
          key={cube.id}
          active={cube.id === activeId}
          insertMode={insertMode}
          position={cube.position}
          onSelect={() => dispatch(selectCube(cube.id))}
        />
      ))}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        target={[...INITIAL_CUBES[0].position]}
        minPolarAngle={CAMERA_POLAR}
        maxPolarAngle={CAMERA_POLAR}
      />
    </>
  )
}
