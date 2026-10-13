import { useFrame, useThree } from '@react-three/fiber'
import { useSelector } from 'react-redux'
import { Vector3 } from 'three'
import { uiSlice, type UiState } from '../../entities/ui/uiSlice'
import { setModeMenuScreen } from './modeMenuScreen'

const { selectModeMenuOpen } = uiSlice.selectors

const projected = new Vector3()

type ModeMenuTrackerProps = {
  position: readonly [number, number, number]
}

/** Считает экранные координаты активного куба для меню вне Canvas. */
export function ModeMenuTracker({ position }: ModeMenuTrackerProps) {
  const { camera, gl } = useThree()
  const open = useSelector((state: { ui: UiState }) => selectModeMenuOpen(state))

  useFrame(() => {
    if (!open) {
      setModeMenuScreen({ x: 0, y: 0, visible: false })
      return
    }

    projected.set(position[0], position[1], position[2]).project(camera)
    const visible = projected.z <= 1
    const x = (projected.x * 0.5 + 0.5) * gl.domElement.clientWidth
    const y = (-projected.y * 0.5 + 0.5) * gl.domElement.clientHeight
    setModeMenuScreen({ x, y, visible })
  })

  return null
}
