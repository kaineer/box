import { useEffect, useState, useSyncExternalStore } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { uiSlice, type UiState } from '../../entities/ui/uiSlice'
import {
  EDITOR_MODES,
  MODE_LABELS,
  modeMenuHotkey,
  type EditorMode,
} from '../../shared/config/editor-mode'
import { isArrowDownCode, isArrowUpCode, isEnterCode } from '../../shared/lib/keys'
import {
  getModeMenuScreen,
  subscribeModeMenuScreen,
} from './modeMenuScreen'
import './ModeMenu.css'

const { selectMode, selectModeMenuOpen } = uiSlice.selectors
const { setMode } = uiSlice.actions

function modeIndex(mode: EditorMode): number {
  return EDITOR_MODES.indexOf(mode)
}

export function ModeMenu() {
  const dispatch = useDispatch()
  const mode = useSelector((state: { ui: UiState }) => selectMode(state))
  const open = useSelector((state: { ui: UiState }) => selectModeMenuOpen(state))
  const screen = useSyncExternalStore(
    subscribeModeMenuScreen,
    getModeMenuScreen,
    getModeMenuScreen,
  )
  const [highlight, setHighlight] = useState(() => modeIndex(mode))

  useEffect(() => {
    if (open) {
      setHighlight(modeIndex(mode))
    }
  }, [open, mode])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isArrowUpCode(event.code)) {
        event.preventDefault()
        setHighlight(
          (index) => (index - 1 + EDITOR_MODES.length) % EDITOR_MODES.length,
        )
        return
      }

      if (isArrowDownCode(event.code)) {
        event.preventDefault()
        setHighlight((index) => (index + 1) % EDITOR_MODES.length)
        return
      }

      if (isEnterCode(event.code)) {
        event.preventDefault()
        const selected = EDITOR_MODES[highlight]
        if (selected) dispatch(setMode(selected))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch, highlight, open])

  if (!open || !screen.visible) return null

  return (
    <div
      className="mode-menu-anchor"
      style={{
        transform: `translate(${screen.x}px, ${screen.y}px) translate(16px, -50%)`,
      }}
    >
      <div className="mode-menu" role="menu" aria-label="Modes">
        {EDITOR_MODES.map((item, index) => {
          const hotkey = modeMenuHotkey(item, mode)
          const isCurrent = item === mode
          const isHighlighted = index === highlight

          return (
            <button
              key={item}
              type="button"
              role="menuitem"
              className={[
                'mode-menu__item',
                isHighlighted ? 'mode-menu__item--highlight' : '',
                isCurrent ? 'mode-menu__item--current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => dispatch(setMode(item))}
            >
              <span className="mode-menu__label">{MODE_LABELS[item]}</span>
              {isCurrent && <span className="mode-menu__mark">*</span>}
              {hotkey && <span className="mode-menu__hotkey">[{hotkey}]</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
