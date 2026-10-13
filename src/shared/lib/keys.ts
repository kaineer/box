export type MoveKey = 'h' | 'j' | 'k' | 'l'

/** Физические клавиши (layout-independent): H и Р — оба KeyH. */
const CODE_TO_MOVE_KEY: Record<string, MoveKey> = {
  KeyH: 'h',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
}

export function moveKeyFromCode(code: string): MoveKey | null {
  return CODE_TO_MOVE_KEY[code] ?? null
}

export function isInsertModeCode(code: string): boolean {
  return code === 'KeyI'
}

export function isMoveModeCode(code: string): boolean {
  return code === 'KeyM'
}

export function isEscapeCode(code: string): boolean {
  return code === 'Escape'
}

export function isDeleteCode(code: string): boolean {
  return code === 'KeyX'
}

export function isSpaceCode(code: string): boolean {
  return code === 'Space'
}

export function isArrowUpCode(code: string): boolean {
  return code === 'ArrowUp'
}

export function isArrowDownCode(code: string): boolean {
  return code === 'ArrowDown'
}

export function isEnterCode(code: string): boolean {
  return code === 'Enter' || code === 'NumpadEnter'
}
