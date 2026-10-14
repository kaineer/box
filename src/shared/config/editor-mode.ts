export type EditorMode = 'norm' | 'insert' | 'move'

export const EDITOR_MODES: EditorMode[] = ['norm', 'insert', 'move']

export const MODE_LABELS: Record<EditorMode, string> = {
  norm: 'NORM',
  insert: 'INSERT',
  move: 'MOVE',
}

/** Горячая клавиша пункта меню с учётом текущего режима. */
export function modeMenuHotkey(
  item: EditorMode,
  currentMode: EditorMode,
): string | null {
  if (item === 'norm') {
    return currentMode === 'norm' ? null : 'Esc'
  }
  if (item === 'insert') return 'I'
  if (item === 'move') return 'M'
  return null
}
