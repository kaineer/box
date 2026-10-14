import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { cubesSlice, type CubesState } from '../../entities/cube/cubesSlice'
import { uiSlice, type UiState } from '../../entities/ui/uiSlice'
import { CUBE_SIZE } from '../../shared/config/constants'
import {
  cubeScreenBounds,
  normalizeScreenRect,
  screenRectsIntersect,
} from '../../shared/lib/screen-bounds'
import styles from './SelectionMarquee.module.css'

const { selectCubes } = cubesSlice.selectors
const { setSelection } = cubesSlice.actions
const { selectMode } = uiSlice.selectors

type DragRect = {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Прямоугольное выделение кубов в режиме SELECT (без JSX в дереве R3F). */
export function SelectionMarquee() {
  const { camera, gl } = useThree()
  const dispatch = useDispatch()
  const mode = useSelector((state: { ui: UiState }) => selectMode(state))
  const cubes = useSelector((state: { cubes: CubesState }) => selectCubes(state))
  const [drag, setDrag] = useState<DragRect | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = document.querySelector('.app')
    if (!host) return

    const el = document.createElement('div')
    el.className = styles.marquee
    el.style.display = 'none'
    host.appendChild(el)
    overlayRef.current = el

    return () => {
      el.remove()
      overlayRef.current = null
    }
  }, [])

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    if (mode !== 'select' || !drag) {
      el.style.display = 'none'
      return
    }

    const rect = normalizeScreenRect(drag.x1, drag.y1, drag.x2, drag.y2)
    el.style.display = 'block'
    el.style.left = `${rect.left}px`
    el.style.top = `${rect.top}px`
    el.style.width = `${rect.right - rect.left}px`
    el.style.height = `${rect.bottom - rect.top}px`
  }, [drag, mode])

  useEffect(() => {
    if (mode !== 'select') {
      setDrag(null)
      return
    }

    const canvas = gl.domElement

    const pointerPos = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      event.preventDefault()
      const { x, y } = pointerPos(event)
      setDrag({ x1: x, y1: y, x2: x, y2: y })
      canvas.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!canvas.hasPointerCapture(event.pointerId)) return
      const { x, y } = pointerPos(event)
      setDrag((current) =>
        current ? { ...current, x2: x, y2: y } : current,
      )
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!canvas.hasPointerCapture(event.pointerId)) return
      canvas.releasePointerCapture(event.pointerId)

      const { x, y } = pointerPos(event)
      setDrag((current) => {
        if (!current) return null
        const rect = normalizeScreenRect(current.x1, current.y1, x, y)
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        const hitIds = cubes
          .filter((cube) =>
            screenRectsIntersect(
              rect,
              cubeScreenBounds(cube.position, CUBE_SIZE, camera, width, height),
            ),
          )
          .map((cube) => cube.id)

        if (hitIds.length > 0) {
          dispatch(setSelection(hitIds))
        }
        return null
      })
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [camera, cubes, dispatch, gl, mode])

  return null
}
