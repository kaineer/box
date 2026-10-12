import type { Camera } from 'three'
import { Vector3 } from 'three'

const offset = new Vector3()
const axisY = new Vector3(0, 1, 0)

/** Поворот камеры вокруг точки вокруг мировой оси Y (как горизонтальный orbit мышью). */
export function orbitCameraAroundY(
  camera: Camera,
  pivot: Vector3,
  angle: number,
): void {
  offset.copy(camera.position).sub(pivot)
  offset.applyAxisAngle(axisY, angle)
  camera.position.copy(pivot).add(offset)
  camera.lookAt(pivot)
}
