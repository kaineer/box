import {
  EDITOR_MODES,
  MODE_LABELS,
  modeMenuHotkey,
  type EditorMode,
} from '../../shared/config/editor-mode'

export type ModeMenuActionId = 'write' | 'read' | 'group'

export type ModeMenuItem =
  | {
      kind: 'mode'
      id: EditorMode
      label: string
    }
  | {
      kind: 'action'
      id: ModeMenuActionId
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
  { kind: 'action', id: 'group', label: 'GROUP' },
]

const ACTION_HOTKEYS: Record<ModeMenuActionId, string> = {
  write: 'W',
  read: 'R',
  group: 'G',
}

/** Пункты меню с учётом контекста (GROUP — только при multi-select свободных кубов). */
export function visibleModeMenuItems(canCreateGroup: boolean): ModeMenuItem[] {
  return MODE_MENU_ITEMS.filter(
    (item) => item.kind !== 'action' || item.id !== 'group' || canCreateGroup,
  )
}

export function menuItemHotkey(
  item: ModeMenuItem,
  currentMode: EditorMode,
): string | null {
  if (item.kind === 'mode') {
    return modeMenuHotkey(item.id, currentMode)
  }
  return ACTION_HOTKEYS[item.id]
}
