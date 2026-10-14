/** Digit0–Digit9 → 0–9 (раскладка не влияет). */
export function countDigitFromCode(code: string): number | null {
  if (!code.startsWith('Digit') || code.length !== 6) return null
  const digit = Number(code.slice(5))
  return Number.isInteger(digit) && digit >= 0 && digit <= 9 ? digit : null
}
