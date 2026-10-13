import { useSelector } from 'react-redux'
import { uiSlice, type UiState } from '../../entities/ui/uiSlice'
import { MODE_LABELS } from '../../shared/config/editor-mode'
import './ModeIndicator.css'

const { selectMode } = uiSlice.selectors

export function ModeIndicator() {
  const mode = useSelector((state: { ui: UiState }) => selectMode(state))

  return (
    <div className={`mode-indicator mode-indicator--${mode}`} role="status">
      {MODE_LABELS[mode]}
    </div>
  )
}
