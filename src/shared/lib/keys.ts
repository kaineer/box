export type MoveKey = 'w' | 'a' | 's' | 'd' | 'j' | 'k'

/** Физические клавиши (layout-independent): A и Ф — оба KeyA. */
const CODE_TO_MOVE_KEY: Record<string, MoveKey> = {
  KeyW: 'w',
  KeyA: 'a',
  KeyS: 's',
  KeyD: 'd',
  KeyJ: 'j',
  KeyK: 'k',
}

export function moveKeyFromCode(code: string): MoveKey | null {
  return CODE_TO_MOVE_KEY[code] ?? null
}

export function isShiftCode(code: string): boolean {
  return code === 'ShiftLeft' || code === 'ShiftRight'
}

export function isInsertModeCode(code: string): boolean {
  return code === 'KeyI'
}

export function isEscapeCode(code: string): boolean {
  return code === 'Escape'
}

export function isDeleteCode(code: string): boolean {
  return code === 'KeyX'
}
