export const DEFAULT_MOTION_TIMEOUT_MS = 500

export type MotionBufferConfig<TMotion> = {
  timeoutMs?: number
  /** Цифра 0–9 или null, если это не цифра счётчика. */
  parseCountDigit: (code: string) => number | null
  /** Клавиша завершения motion или null. */
  parseMotion: (code: string) => TMotion | null
  onMotion: (motion: { count: number; motion: TMotion }) => void
}

export type MotionBuffer = {
  handleKey: (code: string) => boolean
  reset: () => void
  dispose: () => void
}

/**
 * Vim-подобный буфер: набор цифр + motion.
 * Сбрасывается, если между нажатиями проходит больше timeoutMs.
 */
export function createMotionBuffer<TMotion>({
  timeoutMs = DEFAULT_MOTION_TIMEOUT_MS,
  parseCountDigit,
  parseMotion,
  onMotion,
}: MotionBufferConfig<TMotion>): MotionBuffer {
  let countDigits = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const reset = () => {
    countDigits = ''
    clearTimer()
  }

  const bumpTimer = () => {
    clearTimer()
    timer = setTimeout(reset, timeoutMs)
  }

  const handleKey = (code: string): boolean => {
    const digit = parseCountDigit(code)
    if (digit !== null) {
      countDigits += String(digit)
      bumpTimer()
      return true
    }

    const motion = parseMotion(code)
    if (motion !== null) {
      const parsed = countDigits === '' ? 1 : Number.parseInt(countDigits, 10)
      const count = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
      reset()
      onMotion({ count, motion })
      return true
    }

    return false
  }

  return {
    handleKey,
    reset,
    dispose: reset,
  }
}
