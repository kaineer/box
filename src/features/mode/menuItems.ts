import {
  EDITOR_MODES,
  MODE_LABELS,
  modeMenuHotkey,
  type EditorMode,
} from '../../shared/config/editor-mode'

export type ModeMenuItem =
  | {
      kind: 'mode'
      id: EditorMode
      label: string
    }
  | {
      kind: 'action'
      id: 'write' | 'read'
      label: string
    }

export const MODE_MENU_ITEMS: ModeMenuItem[] = [
  ...EDITOR_MODES.map(
    (mode): ModeMenuItem => ({
      kind: 'mode',
      id: mode,
      label: MODE_LABELS[mode],
    }),
  ),
  { kind: 'action', id: 'write', label: 'WRITE' },
  { kind: 'action', id: 'read', label: 'READ' },
]

export function menuItemHotkey(
  item: ModeMenuItem,
  currentMode: EditorMode,
): string | null {
  if (item.kind === 'mode') {
    return modeMenuHotkey(item.id, currentMode)
  }
  return null
}
