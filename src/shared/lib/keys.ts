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

export function isWriteCode(code: string): boolean {
  return code === 'KeyW'
}

export function isReadCode(code: string): boolean {
  return code === 'KeyR'
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

/** Навигация по меню: k / ↑ */
export function isMenuUpCode(code: string): boolean {
  return code === 'KeyK' || code === 'ArrowUp'
}

/** Навигация по меню: j / ↓ */
export function isMenuDownCode(code: string): boolean {
  return code === 'KeyJ' || code === 'ArrowDown'
}

/** Подтверждение пункта меню: o / Enter */
export function isMenuConfirmCode(code: string): boolean {
  return code === 'KeyO' || isEnterCode(code)
}
