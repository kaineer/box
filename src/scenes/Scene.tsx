import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Cube } from '../entities/cube/Cube'
import { cubesSlice, type CubesState } from '../entities/cube/cubesSlice'
import { INITIAL_CUBES } from '../entities/cube/model'
import { uiSlice, type UiState } from '../entities/ui/uiSlice'
import { ModeMenuTracker } from '../features/mode/ModeMenuTracker'
import { CAMERA_POLAR, TARGET_LERP } from '../shared/config/constants'
import { useSceneKeyboard } from './useSceneKeyboard'

const { selectCubes, selectActiveId } = cubesSlice.selectors
const { selectCube } = cubesSlice.actions
const { selectMode, selectModeMenuOpen } = uiSlice.selectors

export function Scene() {
  const { camera } = useThree()
  const dispatch = useDispatch()
  const cubes = useSelector((state: { cubes: CubesState }) => selectCubes(state))
  const activeId = useSelector((state: { cubes: CubesState }) =>
    selectActiveId(state),
  )
  const mode = useSelector((state: { ui: UiState }) => selectMode(state))
  const modeMenuOpen = useSelector((state: { ui: UiState }) =>
    selectModeMenuOpen(state),
  )

  const modeRef = useRef(mode)
  const modeMenuOpenRef = useRef(modeMenuOpen)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const desiredTarget = useRef(new Vector3(...INITIAL_CUBES[0].position))

  modeRef.current = mode
  modeMenuOpenRef.current = modeMenuOpen

  const activeCube =
    cubes.find((item) => item.id === activeId) ?? cubes[0] ?? INITIAL_CUBES[0]

  useEffect(() => {
    desiredTarget.current.set(...activeCube.position)
  }, [activeCube.position])

  useSceneKeyboard({
    camera,
    modeRef,
    modeMenuOpenRef,
  })

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (controls) {
      const t = 1 - Math.exp(-TARGET_LERP * delta)
      controls.target.lerp(desiredTarget.current, t)
      controls.update()
    }
  })

  return (
    <>
      {cubes.map((cube) => (
        <Cube
          key={cube.id}
          active={cube.id === activeId}
          insertMode={mode === 'insert'}
          position={cube.position}
          onSelect={() => dispatch(selectCube(cube.id))}
        />
      ))}
      <ModeMenuTracker position={activeCube.position} />
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
