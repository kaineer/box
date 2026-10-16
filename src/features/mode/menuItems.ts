import {
  EDITOR_MODES,
  MODE_LABELS,
  modeMenuHotkey,
  type EditorMode,
} from '../../shared/config/editor-mode'

export type ModeMenuActionId = 'write' | 'read' | 'group' | 'ungroup'

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
  { kind: 'action', id: 'ungroup', label: 'UNGROUP' },
]

const ACTION_HOTKEYS: Record<ModeMenuActionId, string> = {
  write: 'W',
  read: 'R',
  group: 'G',
  ungroup: '⇧G',
}

/** Пункты меню с учётом контекста (WRITE / GROUP / UNGROUP). */
export function visibleModeMenuItems(
  canCreateGroup: boolean,
  canUngroup: boolean,
  canWrite: boolean,
): ModeMenuItem[] {
  return MODE_MENU_ITEMS.filter((item) => {
    if (item.kind !== 'action') return true
    if (item.id === 'write') return canWrite
    if (item.id === 'group') return canCreateGroup
    if (item.id === 'ungroup') return canUngroup
    return true
  })
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
