export type ModeMenuScreen = {
  x: number
  y: number
  visible: boolean
}

let screen: ModeMenuScreen = { x: 0, y: 0, visible: false }
const listeners = new Set<() => void>()

export function getModeMenuScreen(): ModeMenuScreen {
  return screen
}

export function setModeMenuScreen(next: ModeMenuScreen): void {
  if (
    screen.visible === next.visible &&
    Math.abs(screen.x - next.x) < 0.5 &&
    Math.abs(screen.y - next.y) < 0.5
  ) {
    return
  }
  screen = next
  listeners.forEach((listener) => listener())
}

export function subscribeModeMenuScreen(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
