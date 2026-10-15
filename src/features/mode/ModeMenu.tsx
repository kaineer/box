import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { cubesSlice, type CubesState } from '../../entities/cube/cubesSlice'
import { uiSlice, type UiState } from '../../entities/ui/uiSlice'
import type { EditorMode } from '../../shared/config/editor-mode'
import {
  isMenuConfirmCode,
  isMenuDownCode,
  isMenuUpCode,
} from '../../shared/lib/keys'
import {
  runReadCubesAction,
  runWriteCubesAction,
} from '../io/cubeIoActions'
import {
  menuItemHotkey,
  visibleModeMenuItems,
  type ModeMenuItem,
} from './menuItems'
import styles from './ModeMenu.module.css'
import {
  getModeMenuScreen,
  subscribeModeMenuScreen,
} from './modeMenuScreen'

const { selectCubes, selectActiveId, selectCanCreateGroup } =
  cubesSlice.selectors
const { createGroupFromSelection } = cubesSlice.actions
const { selectMode, selectModeMenuOpen } = uiSlice.selectors
const { setMode, closeModeMenu } = uiSlice.actions

function currentModeItemIndex(
  items: ModeMenuItem[],
  mode: EditorMode,
): number {
  return items.findIndex((item) => item.kind === 'mode' && item.id === mode)
}

export function ModeMenu() {
  const dispatch = useDispatch()
  const mode = useSelector((state: { ui: UiState }) => selectMode(state))
  const open = useSelector((state: { ui: UiState }) => selectModeMenuOpen(state))
  const cubes = useSelector((state: { cubes: CubesState }) => selectCubes(state))
  const activeId = useSelector((state: { cubes: CubesState }) =>
    selectActiveId(state),
  )
  const canCreateGroup = useSelector((state: { cubes: CubesState }) =>
    selectCanCreateGroup(state),
  )
  const menuItems = useMemo(
    () => visibleModeMenuItems(canCreateGroup),
    [canCreateGroup],
  )
  const screen = useSyncExternalStore(
    subscribeModeMenuScreen,
    getModeMenuScreen,
    getModeMenuScreen,
  )
  const [highlight, setHighlight] = useState(() =>
    Math.max(0, currentModeItemIndex(menuItems, mode)),
  )

  useEffect(() => {
    if (open) {
      setHighlight(Math.max(0, currentModeItemIndex(menuItems, mode)))
    }
  }, [open, mode, menuItems])

  useEffect(() => {
    setHighlight((index) =>
      menuItems.length === 0 ? 0 : Math.min(index, menuItems.length - 1),
    )
  }, [menuItems])

  const runItem = useCallback(
    async (item: ModeMenuItem) => {
      if (item.kind === 'mode') {
        dispatch(setMode(item.id))
        return
      }

      if (item.id === 'write') {
        await runWriteCubesAction(dispatch, cubes, activeId)
        return
      }

      if (item.id === 'read') {
        await runReadCubesAction(dispatch)
        return
      }

      dispatch(createGroupFromSelection())
      dispatch(closeModeMenu())
    },
    [activeId, cubes, dispatch],
  )

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isMenuUpCode(event.code)) {
        event.preventDefault()
        setHighlight(
          (index) => (index - 1 + menuItems.length) % menuItems.length,
        )
        return
      }

      if (isMenuDownCode(event.code)) {
        event.preventDefault()
        setHighlight((index) => (index + 1) % menuItems.length)
        return
      }

      if (isMenuConfirmCode(event.code)) {
        event.preventDefault()
        const selected = menuItems[highlight]
        if (selected) void runItem(selected)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [highlight, menuItems, open, runItem])

  if (!open || !screen.visible) return null

  return (
    <div
      className={styles.anchor}
      style={{
        transform: `translate(${screen.x}px, ${screen.y}px) translate(16px, -50%)`,
      }}
    >
      <div className={styles.menu} role="menu" aria-label="Modes">
        {menuItems.map((item, index) => {
          const hotkey = menuItemHotkey(item, mode)
          const isCurrent = item.kind === 'mode' && item.id === mode
          const isHighlighted = index === highlight
          const isAction = item.kind === 'action'
          const isFirstAction =
            isAction && menuItems[index - 1]?.kind !== 'action'

          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={clsx(styles.item, {
                [styles.highlight]: isHighlighted,
                [styles.current]: isCurrent,
                [styles.actionStart]: isFirstAction,
              })}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => void runItem(item)}
            >
              <span className={styles.label}>{item.label}</span>
              {isCurrent && <span className={styles.mark}>*</span>}
              {hotkey && <span className={styles.hotkey}>[{hotkey}]</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
