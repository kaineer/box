import type { Camera } from 'three'
import { Vector3 } from 'three'
import type { MoveKey } from './keys'

/** Направление перехода: WASD относительно камеры (XZ), J/K — вверх/вниз. */
export function getNavDirection(camera: Camera, key: MoveKey): Vector3 {
  if (key === 'j') return new Vector3(0, 1, 0)
  if (key === 'k') return new Vector3(0, -1, 0)

  const forward = new Vector3()
  camera.getWorldDirection(forward)
  forward.y = 0
  if (forward.lengthSq() < 1e-8) {
    forward.set(0, 0, -1)
  } else {
    forward.normalize()
  }

  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize()

  switch (key) {
    case 'w':
      return forward
    case 's':
      return forward.clone().negate()
    case 'd':
      return right
    case 'a':
      return right.clone().negate()
  }
}
