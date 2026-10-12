import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Outlines } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { adjacentPosition } from './shared/lib/adjacent-position'
import { findClosest } from './shared/lib/find-closest'
import { findNeighbor } from './shared/lib/find-neighbor'
import {
  isDeleteCode,
  isEscapeCode,
  isInsertModeCode,
  isShiftCode,
  moveKeyFromCode,
  type MoveKey,
} from './shared/lib/keys'
import { getNavDirection } from './shared/lib/nav-direction'
import { orbitCameraAroundY } from './shared/lib/orbit-around'
import { polarAngleFromPosition } from './shared/lib/polar-angle'
import { snapCardinal } from './shared/lib/snap-direction'
import './App.css'

const ROTATION_SPEED = 1.8
const TARGET_LERP = 6
const NAV_ALIGNMENT_MIN = 0.75
const CUBE_SIZE = 1.5
const CUBE_GAP = 0.4
const CUBE_STEP = CUBE_SIZE + CUBE_GAP
/** Чуть больше шага сетки — только реально соседние кубы. */
const NAV_MAX_DISTANCE = CUBE_STEP * 1.1
const NEIGHBOR_OPTIONS = {
  alignmentMin: NAV_ALIGNMENT_MIN,
  maxDistance: NAV_MAX_DISTANCE,
}
const CAMERA_POSITION: [number, number, number] = [3, 2, 4]
const CAMERA_POLAR = polarAngleFromPosition(CAMERA_POSITION)

type CubeData = {
  id: string
  position: [number, number, number]
}

const INITIAL_CUBES: CubeData[] = [
  { id: 'left', position: [-(CUBE_SIZE + CUBE_GAP) / 2, 0, 0] },
  { id: 'right', position: [(CUBE_SIZE + CUBE_GAP) / 2, 0, 0] },
]

type KeysState = Record<MoveKey, boolean>

let nextCubeId = 1

function createCubeId(): string {
  nextCubeId += 1
  return `cube-${nextCubeId}`
}

function Cube({
  active,
  insertMode,
  position,
  onSelect,
}: {
  active: boolean
  insertMode: boolean
  position: readonly [number, number, number]
  onSelect: () => void
}) {
  const outlineColor = insertMode ? '#a3be8c' : '#5e81ac'
  const emissive = active ? outlineColor : '#000000'

  return (
    <mesh
      position={position as [number, number, number]}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial
        color="#d8dee9"
        metalness={0.3}
        roughness={0.4}
        transparent
        opacity={0.75}
        emissive={emissive}
        emissiveIntensity={active ? 0.25 : 0}
      />
      {active && <Outlines thickness={4} color={outlineColor} />}
    </mesh>
  )
}

function Scene() {
  const { camera } = useThree()
  const [cubes, setCubes] = useState<CubeData[]>(INITIAL_CUBES)
  const [activeId, setActiveId] = useState(INITIAL_CUBES[0].id)
  const [insertMode, setInsertMode] = useState(false)

  const cubesRef = useRef(cubes)
  const activeIdRef = useRef(activeId)
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

  cubesRef.current = cubes
  activeIdRef.current = activeId
  insertModeRef.current = insertMode

  useEffect(() => {
    const cube =
      cubes.find((item) => item.id === activeId) ?? cubes[0] ?? INITIAL_CUBES[0]
    desiredTarget.current.set(...cube.position)
  }, [activeId, cubes])

  useEffect(() => {
    const clearMoveKeys = () => {
      keysRef.current.w = false
      keysRef.current.a = false
      keysRef.current.s = false
      keysRef.current.d = false
      keysRef.current.j = false
      keysRef.current.k = false
    }

    const handleInsertMove = (moveKey: MoveKey) => {
      const direction = snapCardinal(getNavDirection(camera, moveKey))
      const currentCubes = cubesRef.current
      const currentId = activeIdRef.current

      const neighborId = findNeighbor(
        currentCubes,
        currentId,
        direction,
        NEIGHBOR_OPTIONS,
      )

      if (neighborId) {
        setActiveId(neighborId)
        return
      }

      const current =
        currentCubes.find((item) => item.id === currentId) ?? currentCubes[0]
      if (!current) return

      const position = adjacentPosition(current.position, direction, CUBE_STEP)
      const id = createCubeId()
      setCubes((prev) => [...prev, { id, position }])
      setActiveId(id)
    }

    const handleDeleteActive = () => {
      const currentCubes = cubesRef.current
      if (currentCubes.length <= 1) return

      const currentId = activeIdRef.current
      const current = currentCubes.find((item) => item.id === currentId)
      if (!current) return

      const remaining = currentCubes.filter((item) => item.id !== currentId)
      const nextId = findClosest(remaining, current.position)
      if (!nextId) return

      setCubes(remaining)
      setActiveId(nextId)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEscapeCode(event.code)) {
        if (insertModeRef.current) {
          event.preventDefault()
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
        handleDeleteActive()
        return
      }

      if (isInsertModeCode(event.code)) {
        if (event.repeat || event.shiftKey || event.ctrlKey || event.metaKey) {
          return
        }
        event.preventDefault()
        setInsertMode(true)
        clearMoveKeys()
        return
      }

      if (isShiftCode(event.code)) {
        shiftRef.current = true
        return
      }

      const moveKey = moveKeyFromCode(event.code)
      if (!moveKey) return

      if (insertModeRef.current) {
        if (event.repeat) return
        event.preventDefault()
        handleInsertMove(moveKey)
        return
      }

      if (event.shiftKey) {
        if (event.repeat) return
        event.preventDefault()
        const direction = getNavDirection(camera, moveKey)
        const nextId = findNeighbor(
          cubesRef.current,
          activeIdRef.current,
          direction,
          NEIGHBOR_OPTIONS,
        )
        if (nextId) setActiveId(nextId)
        return
      }

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
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [camera])

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
          onSelect={() => setActiveId(cube.id)}
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

function App() {
  return (
    <div className="app">
      <Canvas camera={{ position: CAMERA_POSITION, fov: 45 }}>
        <color attach="background" args={['#eceff4']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.1} />
        <Scene />
      </Canvas>
    </div>
  )
}

export default App
