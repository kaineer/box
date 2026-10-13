import { polarAngleFromPosition } from '../lib/polar-angle'

export const ROTATION_SPEED = 1.8
export const TARGET_LERP = 6
export const NAV_ALIGNMENT_MIN = 0.75
export const CUBE_SIZE = 1.5
export const CUBE_GAP = 0.4
export const CUBE_STEP = CUBE_SIZE + CUBE_GAP
/** Чуть больше шага сетки — только реально соседние кубы. */
export const NAV_MAX_DISTANCE = CUBE_STEP * 1.1
export const NEIGHBOR_OPTIONS = {
  alignmentMin: NAV_ALIGNMENT_MIN,
  maxDistance: NAV_MAX_DISTANCE,
} as const

export const CAMERA_POSITION: [number, number, number] = [3, 2, 4]
export const CAMERA_POLAR = polarAngleFromPosition(CAMERA_POSITION)
export const SCENE_BACKGROUND = '#eceff4'
