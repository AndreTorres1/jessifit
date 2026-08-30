/** Vibração curta de feedback (onde suportado — sobretudo Android). */
export function haptic(pattern: number | number[] = 15): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* não suportado */
  }
}
