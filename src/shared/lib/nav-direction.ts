import type { Camera } from 'three'
import { Vector3 } from 'three'
import type { MoveKey } from './keys'

const right = new Vector3()
const up = new Vector3()

/**
 * Направление в плоскости экрана (перпендикулярно взгляду):
 * h/l — влево/вправо, k/j — вверх/вниз (как в vim).
 */
export function getNavDirection(camera: Camera, key: MoveKey): Vector3 {
  right.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
  up.setFromMatrixColumn(camera.matrixWorld, 1).normalize()

  switch (key) {
    case 'h':
      return right.clone().negate()
    case 'l':
      return right.clone()
    case 'k':
      return up.clone()
    case 'j':
      return up.clone().negate()
  }
}
